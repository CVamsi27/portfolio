-- Isolated database only; fixtures always roll back.
begin;
insert into auth.users(id) values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002') on conflict do nothing;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$
declare
 owner uuid:='00000000-0000-0000-0000-000000000001';
 food jsonb:='{"id":"rice","name":"Rice","basisAmount":100,"basisUnit":"g","source":"Label","nutrients":{"energy":130,"calcium":null},"updatedAt":1}';
 template jsonb;
 batch jsonb;
 invalid jsonb;
 result jsonb;
begin
 template:=jsonb_build_object('id','lunch','name','Lunch','updatedAt',2,'items',jsonb_build_array(jsonb_build_object('food',food,'quantity',150)));
 batch:=jsonb_build_object('id','prepared','preparedDate','2026-10-07','updatedAt',3,'recipe',food || '{"basisUnit":"serving","basisAmount":4,"servings":4,"cookedWeightGrams":800,"ingredients":[{"name":"Rice","quantity":200,"unit":"g","nutrients":{"energy":260,"calcium":null}}]}'::jsonb);
 result:=public.merge_tracker_records(owner,'nutrition:templates',jsonb_build_object('lunch',template));
 if result->'lunch'<>template then raise exception 'Template changed';end if;
 result:=public.merge_tracker_records(owner,'nutrition:batches',jsonb_build_object('prepared',batch));
 if result->'prepared'<>batch then raise exception 'Batch changed';end if;
 raise notice 'PASS: immutable snapshots and unknown nutrients round-trip';
 for invalid in select value from jsonb_array_elements(jsonb_build_array(
 template-'items',jsonb_set(template,'{items}','[]'),jsonb_set(template,'{id}','"other"'),jsonb_set(template,'{deleted}','"true"'),
 jsonb_set(template,'{items,0,quantity}','0'),jsonb_set(template,'{items,0,quantity}','1000001'),jsonb_set(template,'{items,0,food,nutrients}','{"energy":-1}'),
 jsonb_set(template,'{items,0,food,nutrients}','{"unknown":20}'),jsonb_set(template,'{items,0,food,basisAmount}','0'),
 jsonb_set(template,'{items,0,food,nutrients}','{"energy":1e308}') || jsonb_build_object('items',jsonb_build_array(jsonb_build_object('food',food||'{"nutrients":{"energy":1e308}}','quantity',1000000)))
 )) loop
  begin perform public.merge_tracker_records(owner,'nutrition:templates',jsonb_build_object('lunch',invalid));raise exception 'Expected invalid template rejection';
  exception when others then if sqlerrm not like 'Invalid %' then raise;end if;end;
 end loop;
 for invalid in select value from jsonb_array_elements(jsonb_build_array(
 batch-'recipe',jsonb_set(batch,'{preparedDate}','"2026-02-30"'),jsonb_set(batch,'{preparedDate}','"0000-10-07"'),jsonb_set(batch,'{deleted}','1'),
 jsonb_set(batch,'{recipe,servings}','0'),jsonb_set(batch,'{recipe,cookedWeightGrams}','-1'),jsonb_set(batch,'{recipe,ingredients}','[null]'),
 jsonb_set(batch,'{recipe,ingredients,0,nutrients}','{"energy":"10"}'),jsonb_set(batch,'{recipe,ingredients,0,quantity}','-1')
 )) loop
  begin perform public.merge_tracker_records(owner,'nutrition:batches',jsonb_build_object('prepared',invalid));raise exception 'Expected invalid batch rejection';
  exception when others then if sqlerrm not like 'Invalid %' then raise;end if;end;
 end loop;
 raise notice 'PASS: malformed snapshots quantities yields dates and flags rejected';
 begin
 perform public.merge_tracker_records(owner,'nutrition:templates',jsonb_build_object('new',jsonb_set(template,'{id}','"new"'),'bad',jsonb_set(template,'{id}','"bad"')-'items'));
 raise exception 'Expected atomic validation failure';
 exception when others then if sqlerrm not like 'Invalid %' then raise;end if;end;
 if (select value?'new' from public.tracker_data where key='nutrition:templates') then raise exception 'Partial collection write';end if;
 begin perform public.merge_tracker_records('00000000-0000-0000-0000-000000000002','nutrition:templates',jsonb_build_object('lunch',template));raise exception 'Expected ownership rejection';
 exception when others then if sqlerrm<>'Authentication required' then raise;end if;end;
 raise notice 'PASS: atomic collection validation and cross-owner RPC rejection';
 result:=public.merge_tracker_records(owner,'nutrition:templates',jsonb_build_object('lunch',template||'{"deleted":true}'));
 if result->'lunch'->>'deleted'<>'true' then raise exception 'Tombstone did not win tie';end if;
 result:=public.merge_tracker_records(owner,'nutrition:templates',jsonb_build_object('lunch',template||'{"updatedAt":1}'));
 if result->'lunch'->>'deleted'<>'true' then raise exception 'Older write resurrected tombstone';end if;
 raise notice 'PASS: deletion tie and stale retry preserved';
end $$;
rollback;
