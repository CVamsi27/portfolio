-- Read-only Health Connect imports remain separate from manual tracker records.
-- Only server service_role RPCs may mutate devices/imports. Websites receive
-- owner-scoped read columns, never credentials, pairing digests or network hashes.
create table if not exists public.health_connect_devices (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  label text not null check(length(label) between 1 and 100),
  secret_digest text not null check(secret_digest ~ '^[a-f0-9]{64}$'),
  pairing_digest text unique check(pairing_digest ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  paired_at timestamptz,
  revoked_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.health_connect_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check(type in ('weight','steps','sleep')),
  source text not null check(length(source) between 1 and 500),
  record_id text not null check(length(record_id) between 1 and 250),
  device_id uuid not null references public.health_connect_devices(id),
  date date not null,
  updated_at_ms bigint not null check(updated_at_ms >= 0),
  deleted boolean not null default false,
  snapshot jsonb not null check(jsonb_typeof(snapshot) = 'object'),
  primary key(user_id,type,source,record_id)
);
create index if not exists health_connect_records_owner_date on public.health_connect_records(user_id,date);
create index if not exists health_connect_devices_owner on public.health_connect_devices(user_id);
create table if not exists public.health_connect_request_limits (
  key text primary key,
  window_at timestamptz not null,
  count integer not null
);
alter table public.health_connect_devices enable row level security;
alter table public.health_connect_records enable row level security;
alter table public.health_connect_request_limits enable row level security;
drop policy if exists health_connect_devices_owner on public.health_connect_devices;
create policy health_connect_devices_owner on public.health_connect_devices for select to authenticated using(auth.uid()=user_id);
drop policy if exists health_connect_records_owner on public.health_connect_records;
create policy health_connect_records_owner on public.health_connect_records for select to authenticated using(auth.uid()=user_id);
revoke all on public.health_connect_devices,public.health_connect_records,public.health_connect_request_limits from public,anon,authenticated;
grant select(id,user_id,label,paired_at,revoked_at,last_sync_at) on public.health_connect_devices to authenticated;
grant select on public.health_connect_records to authenticated;
grant all on public.health_connect_devices,public.health_connect_records,public.health_connect_request_limits to service_role;

create or replace function public.health_connect_limit(p_key text,p_max integer,p_seconds integer)
returns void language plpgsql security definer set search_path='' as $$
declare counter integer;
begin
  if p_key is null or length(p_key)>200 or p_max not between 1 and 100 or p_seconds not between 1 and 3600 then raise exception 'Invalid health limit'; end if;
  insert into public.health_connect_request_limits(key,window_at,count) values(p_key,clock_timestamp(),1)
  on conflict(key) do update set
    window_at=case when health_connect_request_limits.window_at < clock_timestamp()-make_interval(secs=>p_seconds) then clock_timestamp() else health_connect_request_limits.window_at end,
    count=case when health_connect_request_limits.window_at < clock_timestamp()-make_interval(secs=>p_seconds) then 1 else health_connect_request_limits.count+1 end
  returning count into counter;
  if counter>p_max then raise exception 'Health rate limited'; end if;
  delete from public.health_connect_request_limits where window_at < clock_timestamp()-interval '1 day';
end $$;

create or replace function public.health_connect_request_limit(p_key text,p_max integer,p_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform public.health_connect_limit(p_key,p_max,p_seconds);
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.health_connect_pair(p_device_id uuid,p_label text,p_secret_digest text,p_code_digest text,p_rate_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare device public.health_connect_devices%rowtype; expiry timestamptz:=clock_timestamp()+interval '10 minutes';
begin
  if p_device_id is null or p_label is null or length(btrim(p_label)) not between 1 and 100
    or p_secret_digest is null or p_secret_digest !~ '^[a-f0-9]{64}$'
    or p_code_digest is null or p_code_digest !~ '^[a-f0-9]{64}$'
    or p_rate_key is null or p_rate_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid health pairing'; end if;
  perform public.health_connect_limit('pair:'||p_rate_key,10,600);
  delete from public.health_connect_devices where user_id is null and expires_at < clock_timestamp()-interval '1 day';
  insert into public.health_connect_devices(id,label,secret_digest,pairing_digest,expires_at)
    values(p_device_id,btrim(p_label),p_secret_digest,p_code_digest,expiry) on conflict(id) do nothing;
  select * into device from public.health_connect_devices where id=p_device_id for update;
  if device.user_id is not null or device.revoked_at is not null or device.secret_digest is distinct from p_secret_digest then raise exception 'Health device conflict'; end if;
  update public.health_connect_devices set label=btrim(p_label),pairing_digest=p_code_digest,expires_at=expiry where id=p_device_id;
  return jsonb_build_object('expiresAt',expiry);
end $$;

create or replace function public.health_connect_claim(p_owner uuid,p_code_digest text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare device public.health_connect_devices%rowtype; paired timestamptz:=clock_timestamp();
begin
  if p_owner is null or p_code_digest is null or p_code_digest !~ '^[a-f0-9]{64}$' then raise exception 'Invalid health claim'; end if;
  perform public.health_connect_limit('claim:'||p_owner::text,30,600);
  select * into device from public.health_connect_devices where pairing_digest=p_code_digest for update;
  if not found or device.user_id is not null or device.revoked_at is not null or device.expires_at < paired then raise exception 'Health pairing unavailable'; end if;
  if (select count(*) from public.health_connect_devices where user_id=p_owner and revoked_at is null)>=10 then raise exception 'Health rate limited'; end if;
  update public.health_connect_devices set user_id=p_owner,paired_at=paired,pairing_digest=null where id=device.id;
  return jsonb_build_object('id',device.id,'label',device.label,'lastSyncAt',device.last_sync_at,'revokedAt',null,'pairedAt',paired);
end $$;

create or replace function public.health_connect_status(p_device_id uuid,p_secret_digest text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare device public.health_connect_devices%rowtype;
begin
  select * into device from public.health_connect_devices where id=p_device_id;
  if not found or device.secret_digest is distinct from p_secret_digest or device.revoked_at is not null
    or (device.user_id is null and device.expires_at<clock_timestamp()) then raise exception 'Health authentication required'; end if;
  perform public.health_connect_limit('status:'||p_device_id::text,60,60);
  return jsonb_build_object('paired',device.user_id is not null,'lastSyncAt',device.last_sync_at);
end $$;

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

create or replace function public.health_connect_revoke(p_owner uuid,p_device_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if p_owner is null or not exists(select 1 from public.health_connect_devices where id=p_device_id and user_id=p_owner) then raise exception 'Health authentication required'; end if;
  update public.health_connect_devices set revoked_at=coalesce(revoked_at,clock_timestamp()),pairing_digest=null where id=p_device_id and user_id=p_owner;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.health_connect_owner_status(p_owner uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if p_owner is null then raise exception 'Health authentication required'; end if;
  return jsonb_build_object('devices',coalesce((select jsonb_agg(jsonb_build_object('id',id,'label',label,'lastSyncAt',last_sync_at,'revokedAt',revoked_at,'pairedAt',paired_at) order by paired_at desc) from public.health_connect_devices where user_id=p_owner),'[]'::jsonb),
    'counts',jsonb_build_object(
      'weight',(select count(*) from public.health_connect_records where user_id=p_owner and type='weight' and not deleted),
      'steps',(select count(*) from public.health_connect_records where user_id=p_owner and type='steps' and not deleted),
      'sleep',(select count(*) from public.health_connect_records where user_id=p_owner and type='sleep' and not deleted)));
end $$;

revoke all on function public.health_connect_limit(text,integer,integer),public.health_connect_request_limit(text,integer,integer),public.health_connect_pair(uuid,text,text,text,text),public.health_connect_claim(uuid,text),public.health_connect_status(uuid,text),public.health_connect_sync(uuid,text,jsonb),public.health_connect_revoke(uuid,uuid),public.health_connect_owner_status(uuid) from public,anon,authenticated;
grant execute on function public.health_connect_request_limit(text,integer,integer),public.health_connect_pair(uuid,text,text,text,text),public.health_connect_claim(uuid,text),public.health_connect_status(uuid,text),public.health_connect_sync(uuid,text,jsonb),public.health_connect_revoke(uuid,uuid),public.health_connect_owner_status(uuid) to service_role;
