-- Execute after 0010 in an isolated PostgreSQL/Supabase test database.
-- All fixtures roll back. Requires a test administrator, never a production user.
begin;
insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002') on conflict do nothing;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select set_config('nova.test.entries', '{
 "meal-1:rice": {"id":"meal-1:rice","mealId":"meal-1","foodId":"rice","name":"Rice","basisAmount":100,"basisUnit":"g","nutrients":{"energy":130,"sodium":0,"calcium":null},"source":"custom","updatedAt":7,"date":"2026-10-07","meal":"Lunch","quantity":150},
 "meal-1:curd": {"id":"meal-1:curd","mealId":"meal-1","foodId":"curd","name":"Curd","basisAmount":100,"basisUnit":"g","nutrients":{"energy":60},"source":"custom","updatedAt":7,"date":"2026-10-07","meal":"Lunch","quantity":100}
}',true);
set local role authenticated;

do $$
declare owner uuid := '00000000-0000-0000-0000-000000000001'; entries jsonb := current_setting('nova.test.entries')::jsonb;
begin
  if public.save_nutrition_meal(owner,'operation-1','meal-1',entries) <> entries then raise exception 'Snapshot changed'; end if;
  perform public.save_nutrition_meal(owner,'operation-1','meal-1',entries);
  if (select count(*) from public.nutrition_meal_entries) <> 2 or
    (select count(*) from public.nutrition_meals) <> 1 or
    (select count(*) from public.nutrition_meal_operations) <> 1 then raise exception 'Retry duplicated meal'; end if;
  if (select snapshot->'nutrients'->'calcium' from public.nutrition_meal_entries where id='meal-1:rice') <> 'null'::jsonb then
    raise exception 'Unknown nutrients were lost'; end if;
  raise notice 'PASS: whole meal saved once with immutable snapshots';

  begin
    perform public.save_nutrition_meal(owner,'operation-1','meal-1',jsonb_set(entries,'{meal-1:rice,quantity}','200'));
    raise exception 'Expected conflict';
  exception when others then
    if sqlerrm <> 'Operation ID already used for a different meal' then raise; end if;
  end;
  begin
    perform public.save_nutrition_meal(owner,'operation-2','meal-1',entries);
    raise exception 'Expected meal conflict';
  exception when others then
    if sqlerrm <> 'Meal already exists; use a revision-aware edit operation' then raise; end if;
  end;
  if (select count(*) from public.nutrition_meal_operations) <> 1 then raise exception 'Conflict left an operation'; end if;
  raise notice 'PASS: operation mismatch and meal conflict roll back';

  begin
    perform public.save_nutrition_meal(owner,'invalid-1','meal-1',jsonb_set(entries,'{meal-1:curd,quantity}','0'));
    raise exception 'Expected invalid row';
  exception when others then
    if sqlerrm <> 'Invalid portion or timestamp' then raise; end if;
  end;
  begin
    perform public.save_nutrition_meal(owner,'invalid-2','meal-1',jsonb_set(entries,'{meal-1:curd,date}','"2026-10-08"'));
    raise exception 'Expected mixed dates';
  exception when others then
    if sqlerrm <> 'All foods must belong to the same dated meal operation' then raise; end if;
  end;
  begin
    perform public.save_nutrition_meal(owner,'invalid-3','meal-1',jsonb_set(entries,'{meal-1:rice,nutrients,protein}','-1'));
    raise exception 'Expected negative nutrient rejection';
  exception when others then
    if sqlerrm <> 'Nutrients cannot be negative' then raise; end if;
  end;
  begin
    perform public.save_nutrition_meal(owner,'invalid-4','meal-1',entries #- '{meal-1:curd,foodId}');
    raise exception 'Expected missing snapshot field rejection';
  exception when others then
    if sqlerrm <> 'Invalid food snapshot' then raise; end if;
  end;
  begin
    perform public.save_nutrition_meal(owner,'invalid-5','meal-1',jsonb_set(entries,'{meal-1:rice,nutrients,energy}','1e309'::jsonb));
    raise exception 'Expected non-finite browser nutrient rejection';
  exception when others then
    if sqlerrm <> 'Invalid nutrient value' then raise; end if;
  end;
  if (select count(*) from public.nutrition_meal_operations) <> 1 or
    (select count(*) from public.nutrition_meal_entries) <> 2 then raise exception 'Invalid meal partially wrote'; end if;
  raise notice 'PASS: invalid/mixed rows reject atomically';

  begin
    insert into public.nutrition_meals(user_id,id,operation_id,date,meal,updated_at_ms)
      values(owner,'bypass','bypass','2026-10-07','Lunch',1);
    raise exception 'Expected direct write rejection';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: direct mutation cannot bypass transaction';
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$
begin
  if exists(select 1 from public.nutrition_meals) or exists(select 1 from public.nutrition_meal_entries)
    or exists(select 1 from public.nutrition_meal_operations) then raise exception 'Another owner can read the meal'; end if;
  begin
    perform public.save_nutrition_meal('00000000-0000-0000-0000-000000000001','operation-1','meal-1',current_setting('nova.test.entries')::jsonb);
    raise exception 'Expected owner rejection';
  exception when others then
    if sqlerrm <> 'Authentication required' then raise; end if;
  end;
  raise notice 'PASS: owner isolation protects reads and RPC writes';
end $$;

select set_config('request.jwt.claim.sub','',true);
do $$
begin
  begin
    perform public.save_nutrition_meal('00000000-0000-0000-0000-000000000001','operation-1','meal-1',current_setting('nova.test.entries')::jsonb);
    raise exception 'Expected anonymous rejection';
  exception when others then
    if sqlerrm <> 'Authentication required' then raise; end if;
  end;
  raise notice 'PASS: missing authentication rejects ingestion';
end $$;
rollback;
