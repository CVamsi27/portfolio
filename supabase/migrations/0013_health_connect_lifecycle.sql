-- Owner import lifecycle. Per-record deletion barriers block native replays, including newer aggregate timestamps.
alter table public.health_connect_devices add column if not exists archive_device boolean not null default false;
-- Retain barriers only for upstream keys explicitly removed by the owner.
alter table public.health_connect_records add column if not exists owner_deleted boolean not null default false;
create or replace function public.health_connect_sync(p_device_id uuid,p_secret_digest text,p_records jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare device public.health_connect_devices%rowtype; item jsonb; stamp numeric; day date; seen text[]:=array[]::text[]; record_key text; incoming_deleted boolean; synced timestamptz:=clock_timestamp();
begin
  -- Lock the binding for the transaction: revocation cannot race a validated write.
  select * into device from public.health_connect_devices where id=p_device_id for update;
  if not found or device.secret_digest is distinct from p_secret_digest or device.user_id is null or device.revoked_at is not null then raise exception 'Health authentication required'; end if;
  perform public.health_connect_limit('sync:'||p_device_id::text,60,60);
  if p_records is null or jsonb_typeof(p_records)<>'array' or jsonb_array_length(p_records)>500
    or octet_length(p_records::text)>1000000 then raise exception 'Invalid health records'; end if;
  for item in select value from jsonb_array_elements(p_records) loop
    if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 250
      or jsonb_typeof(item->'source') is distinct from 'string' or length(btrim(item->>'source')) not between 1 and 500
      or jsonb_typeof(item->'type') is distinct from 'string' or item->>'type' not in ('weight','steps','sleep')
      or jsonb_typeof(item->'date') is distinct from 'string' or item->>'date' !~ '^\d{4}-\d{2}-\d{2}$'
      or jsonb_typeof(item->'unit') is distinct from 'string'
      or jsonb_typeof(item->'value') is distinct from 'number'
      or jsonb_typeof(item->'updatedAt') is distinct from 'number'
      or jsonb_typeof(item->'measuredAt') is distinct from 'string'
      or item->>'measuredAt' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$'
      or (item ? 'deleted' and jsonb_typeof(item->'deleted')<>'boolean') then raise exception 'Invalid health record'; end if;
    day:=(item->>'date')::date;
    stamp:=(item->>'updatedAt')::numeric;
    if to_char(day,'YYYY-MM-DD')<>item->>'date' or day<(synced at time zone 'UTC')::date-400 or day>(synced at time zone 'UTC')::date+1
      or stamp<0 or stamp>extract(epoch from synced+interval '1 day')*1000 or trunc(stamp)<>stamp
      or (item->>'measuredAt')::timestamptz>synced+interval '1 day'
      or (item->>'value')::numeric<0 then raise exception 'Invalid health date or value'; end if;
    if (item->>'type'='weight' and (item->>'unit'<>'kg' or (item->>'value')::numeric<=0 or (item->>'value')::numeric>1000))
      or (item->>'type'='steps' and (item->>'unit'<>'count' or (item->>'value')::numeric>1000000 or trunc((item->>'value')::numeric)<>(item->>'value')::numeric))
      or (item->>'type'='sleep' and (item->>'unit'<>'minutes' or (item->>'value')::numeric>2880)) then raise exception 'Invalid health unit or value'; end if;
    record_key:=jsonb_build_array(item->>'type',item->>'source',item->>'id')::text;
    if record_key=any(seen) then raise exception 'Invalid health duplicate record'; end if;
    seen:=array_append(seen,record_key);
  end loop;
  for item in select value from jsonb_array_elements(p_records) loop
    if exists(select 1 from public.health_connect_records where user_id=device.user_id
      and type=item->>'type' and source=item->>'source' and record_id=item->>'id'
      and owner_deleted) then continue; end if;
    if exists(select 1 from public.health_connect_records where user_id=device.user_id and type=item->>'type'
      and source=item->>'source' and record_id=item->>'id' and device_id<>device.id
      and not exists(select 1 from public.health_connect_devices d where d.id=health_connect_records.device_id and d.archive_device and d.revoked_at is not null)) then raise exception 'Health device conflict'; end if;
    incoming_deleted:=coalesce((item->>'deleted')::boolean,false);
    insert into public.health_connect_records(user_id,type,source,record_id,device_id,date,updated_at_ms,deleted,snapshot)
      values(device.user_id,item->>'type',item->>'source',item->>'id',device.id,(item->>'date')::date,(item->>'updatedAt')::bigint,incoming_deleted,item)
      on conflict(user_id,type,source,record_id) do update set
        device_id=excluded.device_id,date=excluded.date,updated_at_ms=excluded.updated_at_ms,deleted=excluded.deleted,snapshot=excluded.snapshot
      where excluded.updated_at_ms>health_connect_records.updated_at_ms
        or (excluded.updated_at_ms=health_connect_records.updated_at_ms and excluded.deleted and not health_connect_records.deleted);
  end loop;
  update public.health_connect_devices set last_sync_at=synced where id=device.id;
  return jsonb_build_object('ok',true,'count',jsonb_array_length(p_records),'received',jsonb_array_length(p_records),'lastSyncAt',synced);
end $$;


create or replace function public.health_connect_delete_imports(p_owner uuid,p_from date,p_to date,p_source text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare affected integer; stamp bigint:=(extract(epoch from clock_timestamp())*1000)::bigint;
begin
 if p_owner is null or not exists(select 1 from auth.users where id=p_owner) then raise exception 'Health authentication required'; end if;
 if (p_from is null)<>(p_to is null) or p_from>p_to or (p_source is not null and length(btrim(p_source)) not between 1 and 500) then raise exception 'Invalid health deletion'; end if;
 -- Same device locks as sync make the deletion barrier effective before any subsequent upload.
 perform id from public.health_connect_devices where user_id=p_owner order by id for update;
 update public.health_connect_records set owner_deleted=true,deleted=true,updated_at_ms=greatest(updated_at_ms,stamp),snapshot=snapshot||jsonb_build_object('deleted',true,'updatedAt',greatest(updated_at_ms,stamp))
 where user_id=p_owner and not owner_deleted and (p_from is null or date>=p_from) and (p_to is null or date<=p_to) and (p_source is null or source=p_source);
 get diagnostics affected=row_count;
 return jsonb_build_object('count',affected);
end $$;
create or replace function public.health_connect_export(p_owner uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare total integer; records jsonb;
begin
 if p_owner is null or not exists(select 1 from auth.users where id=p_owner) then raise exception 'Health authentication required'; end if;
 select count(*),coalesce(jsonb_agg((select jsonb_object_agg(key,value) from jsonb_each(snapshot) where key=any(array['id','type','date','value','unit','source','measuredAt','updatedAt','deleted','zoneOffsetSeconds','startAt','endAt','stages','measurementKind']))||jsonb_build_object('deviceId',device_id) order by date,type,source,record_id),'[]'::jsonb) into total,records from public.health_connect_records where user_id=p_owner;
 if total>5000 or octet_length(records::text)>20000000 then raise exception 'Invalid health archive export limit'; end if;
 return jsonb_build_object('format','nova-health-connect','version',1,'exportedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'records',records,'total',total);
end $$;
create or replace function public.health_connect_restore(p_owner uuid,p_records jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; restored uuid; existing public.health_connect_records%rowtype; seen text[]:=array[]::text[]; k text;
begin
 if p_owner is null or not exists(select 1 from auth.users where id=p_owner) then raise exception 'Health authentication required'; end if;
 if p_records is null or jsonb_typeof(p_records)<>'array' or jsonb_array_length(p_records)>5000 or octet_length(p_records::text)>20000000 then raise exception 'Invalid health archive'; end if;
 perform id from public.health_connect_devices where user_id=p_owner order by id for update;
 -- Validate the entire archive and source collisions before any insert.
 for item in select value from jsonb_array_elements(p_records) loop
  if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 250 or jsonb_typeof(item->'source') is distinct from 'string' or length(btrim(item->>'source')) not between 1 and 500
   or item->>'type' not in ('weight','steps','sleep') or jsonb_typeof(item->'type') is distinct from 'string'
   or jsonb_typeof(item->'date') is distinct from 'string' or item->>'date' !~ '^\d{4}-\d{2}-\d{2}$' or to_char((item->>'date')::date,'YYYY-MM-DD')<>item->>'date'
   or jsonb_typeof(item->'value') is distinct from 'number' or (item->>'value')::numeric<0
   or jsonb_typeof(item->'updatedAt') is distinct from 'number' or (item->>'updatedAt')::numeric<0 or trunc((item->>'updatedAt')::numeric)<>(item->>'updatedAt')::numeric
   or jsonb_typeof(item->'measuredAt') is distinct from 'string' or item->>'measuredAt' !~ '^\d{4}-\d{2}-\d{2}T' or (item->>'measuredAt')::timestamptz>clock_timestamp()+interval '1 day'
   or (item ? 'deleted' and jsonb_typeof(item->'deleted')<>'boolean') then raise exception 'Invalid health archive record'; end if;
  if (item->>'type'='weight' and (item->>'unit' is distinct from 'kg' or (item->>'value')::numeric<=0 or (item->>'value')::numeric>1000))
   or (item->>'type'='steps' and (item->>'unit' is distinct from 'count' or (item->>'value')::numeric>1000000 or trunc((item->>'value')::numeric)<>(item->>'value')::numeric))
   or (item->>'type'='sleep' and (item->>'unit' is distinct from 'minutes' or (item->>'value')::numeric>2880)) then raise exception 'Invalid health archive unit'; end if;
  k:=jsonb_build_array(item->>'type',item->>'source',item->>'id')::text;
  if k=any(seen) then raise exception 'Invalid health duplicate record'; end if;seen:=array_append(seen,k);
  select * into existing from public.health_connect_records where user_id=p_owner and type=item->>'type' and source=item->>'source' and record_id=item->>'id';
  if found and not existing.deleted and (existing.snapshot-'deviceId') is distinct from (item-'deviceId') then raise exception 'Health device conflict'; end if;
 end loop;
 select id into restored from public.health_connect_devices where user_id=p_owner and archive_device and revoked_at is not null limit 1;
 if restored is null then restored:=pg_catalog.gen_random_uuid();insert into public.health_connect_devices(id,user_id,label,secret_digest,expires_at,revoked_at,archive_device) values(restored,p_owner,'Restored archive',repeat('0',64),clock_timestamp(),clock_timestamp(),true);end if;
 for item in select value from jsonb_array_elements(p_records) loop
  insert into public.health_connect_records(user_id,type,source,record_id,device_id,date,updated_at_ms,deleted,snapshot)
  values(p_owner,item->>'type',item->>'source',item->>'id',restored,(item->>'date')::date,(item->>'updatedAt')::bigint,coalesce((item->>'deleted')::boolean,false),(select jsonb_object_agg(key,value) from jsonb_each(item) where key=any(array['id','type','date','value','unit','source','measuredAt','updatedAt','deleted','zoneOffsetSeconds','startAt','endAt','stages','measurementKind'])))
  on conflict(user_id,type,source,record_id) do update set owner_deleted=false,snapshot=excluded.snapshot,date=excluded.date,updated_at_ms=excluded.updated_at_ms,deleted=excluded.deleted;
 end loop;
 return jsonb_build_object('count',jsonb_array_length(p_records));
end $$;
revoke all on function public.health_connect_delete_imports(uuid,date,date,text),public.health_connect_export(uuid),public.health_connect_restore(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.health_connect_delete_imports(uuid,date,date,text),public.health_connect_export(uuid),public.health_connect_restore(uuid,jsonb) to service_role;
