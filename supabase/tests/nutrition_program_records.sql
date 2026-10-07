-- Isolated PostgreSQL/Supabase test database only. Every fixture rolls back.
begin;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002') on conflict do nothing;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$
declare
 owner uuid := '00000000-0000-0000-0000-000000000001';
 program jsonb := '{"id":"program","startDate":"2026-10-07","mode":"manual","goal":"maintain","days":[{"energy":2000,"protein":120,"carbs":250,"fat":60},{"energy":2000,"protein":120,"carbs":250,"fat":60},{"energy":2000,"protein":120,"carbs":250,"fat":60},{"energy":1800,"protein":120,"carbs":250,"fat":60},{"energy":2200,"protein":120,"carbs":250,"fat":60},{"energy":2000,"protein":120,"carbs":250,"fat":60},{"energy":2000,"protein":120,"carbs":250,"fat":60}],"updatedAt":5}';
 review jsonb := '{"id":"2026-10-07","status":"complete","updatedAt":7}';
 invalid jsonb;
 result jsonb;
 label text;
begin
 result := public.merge_tracker_records(owner,'nutrition:programs',jsonb_build_object('program',program));
 if result->'program' <> program then raise exception 'Program changed on merge'; end if;
 result := public.merge_tracker_records(owner,'nutrition:days',jsonb_build_object('2026-10-07',review));
 if result->'2026-10-07' <> review then raise exception 'Review changed on merge'; end if;
 raise notice 'PASS: manual daily targets and review records round-trip';
 result := public.merge_tracker_records(owner,'nutrition:programs',jsonb_build_object('flexible',jsonb_set(jsonb_set(program,'{id}','"flexible"'),'{mode}','"flexible"')));
 if result->'flexible'->>'mode' <> 'flexible' then raise exception 'Flexible allocation failed'; end if;
 foreach label in array array['partial','estimated','fasting'] loop
   perform public.merge_tracker_records(owner,'nutrition:days',jsonb_build_object('2026-10-08',jsonb_set(jsonb_set(review,'{id}','"2026-10-08"'),'{status}',to_jsonb(label)) || '{"updatedAt":8}'));
 end loop;
 raise notice 'PASS: flexible program and all explicit day review statuses accepted';
 for invalid in select value from jsonb_array_elements(jsonb_build_array(
   jsonb_set(program,'{id}','"mismatch"'), jsonb_set(program,'{days}','[]'),
   jsonb_set(program,'{days,0,energy}','0'), jsonb_set(program,'{days,0,protein}','-1'),
   jsonb_set(program,'{days,0,fat}','"20"'), jsonb_set(program,'{days,0,carbs}','1e309'::jsonb),
   jsonb_set(program,'{startDate}','"2026-02-30"'),jsonb_set(program,'{mode}','"guided"'),
   jsonb_set(program,'{goal}','"invalid"'),jsonb_set(program,'{deleted}','"true"'),
   jsonb_set(program,'{updatedAt}','-1'),jsonb_set(program,'{updatedAt}','1e309'::jsonb),program - 'updatedAt'
 )) loop
   begin
     perform public.merge_tracker_records(owner,'nutrition:programs',jsonb_build_object('program',invalid));
     raise exception 'Expected invalid program rejection';
   exception when others then
     if sqlerrm not in ('Invalid nutrition program','Record timestamp required') then raise; end if;
   end;
 end loop;
 if (select value->'program' from public.tracker_data where key='nutrition:programs') <> program then raise exception 'Invalid program changed stored targets'; end if;
 raise notice 'PASS: 13 invalid program payloads reject before replacing records';
 for invalid in select value from jsonb_array_elements(jsonb_build_array(
   jsonb_set(review,'{id}','"2026-10-08"'), jsonb_set(review,'{status}','"unknown"'),
   jsonb_set(review,'{updatedAt}','-1'),jsonb_set(review,'{updatedAt}','1e309'::jsonb),
   jsonb_set(review,'{deleted}','null'), jsonb_set(review,'{status}','["complete"]')
 )) loop
   begin
     perform public.merge_tracker_records(owner,'nutrition:days',jsonb_build_object('2026-10-07',invalid));
     raise exception 'Expected invalid day rejection';
   exception when others then
     if sqlerrm <> 'Invalid nutrition day' then raise; end if;
   end;
 end loop;
 begin
   perform public.merge_tracker_records(owner,'nutrition:days','{"2026-02-30":{"id":"2026-02-30","status":"partial","updatedAt":1}}');
   raise exception 'Expected invalid calendar date rejection';
 exception when others then if sqlerrm <> 'Invalid nutrition day' then raise; end if; end;
 if (select value->'2026-10-07' from public.tracker_data where key='nutrition:days') <> review then raise exception 'Invalid review changed stored day'; end if;
 raise notice 'PASS: 7 invalid day payloads reject atomically';
 begin
   perform public.merge_tracker_records(owner,'nutrition:programs',jsonb_build_object('new',jsonb_set(program,'{id}','"new"'),'bad',jsonb_set(program,'{id}','"bad"') - 'days'));
   raise exception 'Expected whole collection rejection';
 exception when others then if sqlerrm <> 'Invalid nutrition program' then raise; end if; end;
 if (select value ? 'new' from public.tracker_data where key='nutrition:programs') then raise exception 'Collection partially wrote'; end if;
 raise notice 'PASS: valid plus invalid collection rejects without partial writes';
 result := public.merge_tracker_records(owner,'nutrition:programs',jsonb_build_object('program',jsonb_set(program,'{updatedAt}','4')));
 if result->'program' <> program then raise exception 'Older record overwrote targets'; end if;
 result := public.merge_tracker_records(owner,'nutrition:programs',jsonb_build_object('program',jsonb_set(program,'{deleted}','true')));
 if result->'program'->>'deleted' <> 'true' then raise exception 'Equal timestamp deletion lost'; end if;
 result := public.merge_tracker_records(owner,'nutrition:programs',jsonb_build_object('program',program));
 if result->'program'->>'deleted' <> 'true' then raise exception 'Equal timestamp resurrected tombstone'; end if;
 raise notice 'PASS: older changes ignored and equal timestamp tombstones retained';
 foreach label in array array['nutrition:entries','nutrition:foods','nutrition:recipes','nutrition:targets','routine:schedules','routine:history','recovery:entries','habits:items','habits:history','plan:blocks','plan:days'] loop
   perform public.merge_tracker_records(owner,label,'{"legacy":{"updatedAt":1}}');
 end loop;
 raise notice 'PASS: all 11 prior record collections still merge';
 begin
   perform public.merge_tracker_records(owner,'nutrition:unknown','{}');raise exception 'Expected unknown key rejection';
 exception when others then if sqlerrm <> 'Unsupported record collection' then raise; end if; end;
 begin
   perform public.merge_tracker_records('00000000-0000-0000-0000-000000000002','nutrition:days','{}');raise exception 'Expected other owner rejection';
 exception when others then if sqlerrm <> 'Authentication required' then raise; end if; end;
 raise notice 'PASS: unknown keys and foreign owner writes reject';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$
begin
 if exists(select from public.tracker_data where key in ('nutrition:programs','nutrition:days')) then raise exception 'Other owner could see private programs'; end if;
 raise notice 'PASS: second owner cannot read first owner targets or reviews';
 perform set_config('request.jwt.claim.sub','',true);
 begin
   perform public.merge_tracker_records('00000000-0000-0000-0000-000000000001','nutrition:days','{}');raise exception 'Expected missing authentication rejection';
 exception when others then if sqlerrm <> 'Authentication required' then raise; end if; end;
 raise notice 'PASS: authenticated role without a user identity cannot write';
end $$;
reset role;
set local role anon;
do $$
begin
 begin
   perform public.merge_tracker_records('00000000-0000-0000-0000-000000000001','nutrition:days','{}');raise exception 'Expected anonymous execute rejection';
 exception when insufficient_privilege then null; end;
 raise notice 'PASS: anonymous RPC execution denied';
end $$;
rollback;
