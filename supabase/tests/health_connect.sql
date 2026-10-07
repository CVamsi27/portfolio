-- Isolated administrator test only. Apply 0011 first. All fixtures roll back.
begin;
insert into auth.users(id) values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002') on conflict do nothing;
set local role service_role;
do $$
declare
  owner uuid:='00000000-0000-0000-0000-000000000001';
  other uuid:='00000000-0000-0000-0000-000000000002';
  device uuid:='11111111-1111-1111-1111-111111111111';
  expired uuid:='22222222-2222-2222-2222-222222222222';
  secret text:=repeat('a',64); code text:=repeat('b',64); stamp bigint:=(extract(epoch from clock_timestamp())*1000)::bigint;
  records jsonb; result jsonb; original jsonb;
begin
  perform public.health_connect_pair(device,'Android',secret,code,repeat('c',64));
  if (public.health_connect_status(device,secret)->>'paired')::boolean then raise exception 'Pending device already paired'; end if;
  begin
    perform public.health_connect_sync(device,secret,'[]'); raise exception 'Expected unclaimed rejection';
  exception when others then if sqlerrm<>'Health authentication required' then raise; end if; end;
  result:=public.health_connect_claim(owner,code);
  if result->>'id'<>device::text or result ? 'secret_digest' then raise exception 'Invalid claim result'; end if;
  begin
    perform public.health_connect_claim(other,code); raise exception 'Expected one-time claim';
  exception when others then if sqlerrm<>'Health pairing unavailable' then raise; end if; end;
  if not (public.health_connect_status(device,secret)->>'paired')::boolean then raise exception 'Claim was not bound'; end if;
  raise notice 'PASS: pairing is authenticated, owner-bound, and one-time';

  perform public.health_connect_pair(expired,'Old Android',secret,repeat('d',64),repeat('e',64));
  update public.health_connect_devices set expires_at=clock_timestamp()-interval '1 minute' where id=expired;
  begin
    perform public.health_connect_claim(owner,repeat('d',64)); raise exception 'Expected expired pairing rejection';
  exception when others then if sqlerrm<>'Health pairing unavailable' then raise; end if; end;
  raise notice 'PASS: expired pairing is unusable';

  records:=jsonb_build_array(
    jsonb_build_object('id','weight-1','type','weight','date',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD'),'value',70,'unit','kg','source','com.example','measuredAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'updatedAt',stamp),
    jsonb_build_object('id','steps-1','type','steps','date',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD'),'value',5000,'unit','count','source','Health Connect priority aggregate','measuredAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'updatedAt',stamp),
    jsonb_build_object('id','sleep-1','type','sleep','date',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD'),'value',420,'unit','minutes','source','com.example','measuredAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'updatedAt',stamp));
  result:=public.health_connect_sync(device,secret,records);
  if (result->>'count')::integer<>3 then raise exception 'Upload did not acknowledge entire batch'; end if;
  perform public.health_connect_sync(device,secret,records);
  if (select count(*) from public.health_connect_records where user_id=owner)<>3 then raise exception 'Retry duplicated imports'; end if;
  if public.health_connect_owner_status(other)->'counts' <> '{"weight":0,"steps":0,"sleep":0}'::jsonb then raise exception 'Another owner saw imported records'; end if;
  original:=public.health_connect_owner_status(owner);
  if original::text like '%digest%' then raise exception 'Status leaked credentials'; end if;
  raise notice 'PASS: whole batch idempotent, source-labelled, and owner scoped';

  begin
    perform public.health_connect_sync(device,secret,jsonb_set(records,'{1,value}','-1')); raise exception 'Expected invalid row rejection';
  exception when others then if sqlerrm<>'Invalid health date or value' then raise; end if; end;
  begin
    perform public.health_connect_sync(device,secret,jsonb_build_array(records->0,records->0)); raise exception 'Expected duplicate row rejection';
  exception when others then if sqlerrm<>'Invalid health duplicate record' then raise; end if; end;
  if public.health_connect_owner_status(owner)<>original then raise exception 'Invalid batch partially wrote or advanced sync'; end if;
  raise notice 'PASS: invalid and duplicate records reject before any write';

  perform public.health_connect_sync(device,secret,jsonb_build_array(jsonb_set(records->0,'{deleted}','true')));
  perform public.health_connect_sync(device,secret,jsonb_build_array(records->0));
  if not (select deleted from public.health_connect_records where user_id=owner and record_id='weight-1') then raise exception 'Equal timestamp resurrected deletion'; end if;
  perform public.health_connect_sync(device,secret,jsonb_build_array(jsonb_set(records->0,'{updatedAt}',to_jsonb(stamp-1))));
  if not (select deleted from public.health_connect_records where user_id=owner and record_id='weight-1') then raise exception 'Stale import resurrected deletion'; end if;
  raise notice 'PASS: tombstones win ties and reject stale resurrection';

  begin
    perform public.health_connect_revoke(other,device); raise exception 'Expected cross-owner revocation rejection';
  exception when others then if sqlerrm<>'Health authentication required' then raise; end if; end;
  perform public.health_connect_revoke(owner,device);
  begin
    perform public.health_connect_sync(device,secret,'[]'); raise exception 'Expected revoked sync rejection';
  exception when others then if sqlerrm<>'Health authentication required' then raise; end if; end;
  begin
    perform public.health_connect_status(device,secret); raise exception 'Expected revoked status rejection';
  exception when others then if sqlerrm<>'Health authentication required' then raise; end if; end;
  raise notice 'PASS: revocation immediately rejects device reads and writes';

  perform public.health_connect_request_limit('test-rate',1,600);
  begin
    perform public.health_connect_request_limit('test-rate',1,600); raise exception 'Expected distributed rate rejection';
  exception when others then if sqlerrm<>'Health rate limited' then raise; end if; end;
  raise notice 'PASS: persistent database request limits enforce bounds';
end $$;

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
set local role authenticated;
do $$
begin
  if exists(select 1 from public.health_connect_records) then raise exception 'RLS leaked another owner'; end if;
  begin
    perform secret_digest from public.health_connect_devices; raise exception 'Expected secret column rejection';
  exception when insufficient_privilege then null; end;
  begin
    perform public.health_connect_claim('00000000-0000-0000-0000-000000000002',repeat('b',64)); raise exception 'Expected direct RPC denial';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS: owner RLS hides others and browser cannot read credentials or invoke device RPCs';
end $$;
rollback;
