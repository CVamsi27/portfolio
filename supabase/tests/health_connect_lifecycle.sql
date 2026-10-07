begin;
insert into auth.users(id) values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002') on conflict do nothing;
set local role service_role;
do $$
declare owner uuid:='00000000-0000-0000-0000-000000000001';device uuid:='11111111-1111-1111-1111-111111111111';secret text:=repeat('a',64);stamp bigint:=(extract(epoch from clock_timestamp())*1000)::bigint;record jsonb; archive jsonb;
begin
 perform public.health_connect_pair(device,'Phone',secret,repeat('b',64),repeat('c',64));perform public.health_connect_claim(owner,repeat('b',64));
 record:=jsonb_build_object('id','w1','type','weight','date',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD'),'value',70,'unit','kg','source','scale','measuredAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'updatedAt',stamp);
 perform public.health_connect_sync(device,secret,jsonb_build_array(record));archive:=public.health_connect_export(owner);
 if jsonb_array_length(archive->'records')<>1 or archive::text like '%digest%' then raise exception 'Export invalid';end if;
 if jsonb_array_length(public.health_connect_export('00000000-0000-0000-0000-000000000002')->'records')<>0 then raise exception 'Export leaked owner';end if;
 perform public.health_connect_delete_imports(owner,null,null,'scale');
 perform public.health_connect_sync(device,secret,jsonb_build_array(record||jsonb_build_object('updatedAt',stamp+1)));
 if exists(select 1 from public.health_connect_records where user_id=owner and not deleted) then raise exception 'Phone replay resurrected record';end if;
 if not (public.health_connect_export(owner)->'records'->0->>'deleted')::boolean then raise exception 'Export lost tombstone';end if;
 perform public.health_connect_sync(device,secret,jsonb_build_array(record||jsonb_build_object('id','after-source-delete','updatedAt',stamp+2)));
 if not exists(select 1 from public.health_connect_records where user_id=owner and record_id='after-source-delete' and not deleted) then raise exception 'Source deletion blocked genuinely new data';end if;
 perform public.health_connect_delete_imports(owner,null,null,null);
 perform public.health_connect_sync(device,secret,jsonb_build_array(record||jsonb_build_object('id','after-all-delete','updatedAt',stamp+3),record||jsonb_build_object('updatedAt',stamp+3)));
 if not exists(select 1 from public.health_connect_records where user_id=owner and record_id='after-all-delete' and not deleted) then raise exception 'All deletion blocked genuinely new data';end if;
 if exists(select 1 from public.health_connect_records where user_id=owner and record_id='w1' and not deleted) then raise exception 'All deletion permitted deleted replay';end if;
 perform public.health_connect_restore(owner,archive->'records');
 perform public.health_connect_sync(device,secret,jsonb_build_array(record||jsonb_build_object('updatedAt',stamp+4,'value',71)));
 if not exists(select 1 from public.health_connect_records where user_id=owner and record_id='w1' and not deleted and snapshot->>'value'='71') then raise exception 'Explicit restore did not clear replay barrier';end if;

 if not exists(select 1 from public.health_connect_records where user_id=owner and not deleted) then raise exception 'Explicit restore failed';end if;
 begin
 perform public.health_connect_restore(owner,jsonb_build_array(record||jsonb_build_object('id','new'),record||jsonb_build_object('id','bad','value',-1)));raise exception 'Expected invalid rejection';
 exception when others then if sqlerrm<>'Invalid health archive record' then raise;end if;end;
 if exists(select 1 from public.health_connect_records where record_id='new') then raise exception 'Invalid batch partially restored';end if;
 raise notice 'PASS owner export, tombstones, replay barrier, explicit restore, wholebatch rollback';
end $$;
reset role;
set local role authenticated;
do $$begin
 begin perform public.health_connect_export('00000000-0000-0000-0000-000000000001');raise exception 'Expected RPC denied';exception when insufficient_privilege then null;end;
 raise notice 'PASS authenticated cannot bypass server owner binding';
end $$;
rollback;
