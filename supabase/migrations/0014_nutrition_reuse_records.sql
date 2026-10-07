-- Additive collection validation. Existing 0012 behavior and timestamp merges remain.
create or replace function public.valid_reuse_nutrients(v jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare n record;
begin
 if jsonb_typeof(v) is distinct from 'object' then return false; end if;
 for n in select key,value from jsonb_each(v) loop
  if n.key not in ('energy','protein','carbs','fat','fibre','sugar','saturatedFat','vitaminA','vitaminC','vitaminD','vitaminE','vitaminK','thiamin','riboflavin','niacin','pantothenic','vitaminB6','biotin','folate','vitaminB12','calcium','iron','magnesium','phosphorus','potassium','sodium','zinc','copper','manganese','iodine','selenium') then return false; end if;
  if n.value <> 'null'::jsonb and (jsonb_typeof(n.value) is distinct from 'number' or n.value::numeric<0 or n.value::numeric>1.7976931348623157e308) then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
create or replace function public.valid_reuse_food(v jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
begin
 return jsonb_typeof(v)='object' and jsonb_typeof(v->'id')='string' and length(v->>'id') between 1 and 500
 and jsonb_typeof(v->'name')='string' and length(btrim(v->>'name')) between 1 and 300
 and jsonb_typeof(v->'source')='string' and length(v->>'source')<=1000
 and jsonb_typeof(v->'basisAmount')='number' and (v->>'basisAmount')::numeric>0 and (v->>'basisAmount')::numeric<=1000000
 and jsonb_typeof(v->'basisUnit')='string' and v->>'basisUnit' in ('g','ml','serving')
 and jsonb_typeof(v->'updatedAt')='number' and (v->>'updatedAt')::numeric between 0 and 9007199254740991 and trunc((v->>'updatedAt')::numeric)=(v->>'updatedAt')::numeric
 and (not v?'deleted' or jsonb_typeof(v->'deleted')='boolean')
 and (not v?'favorite' or jsonb_typeof(v->'favorite')='boolean')
 and public.valid_reuse_nutrients(v->'nutrients');
exception when others then return false;
end $$;
revoke all on function public.valid_reuse_food(jsonb),public.valid_reuse_nutrients(jsonb) from public;
grant execute on function public.valid_reuse_food(jsonb),public.valid_reuse_nutrients(jsonb) to authenticated;
-- Additive validation for nutrition programs/day reviews. Existing tracker_data
-- remains the storage path, with all prior supported collections preserved.
-- 0009 accepted nutrition:* without validating program/day shapes; this closes
-- that gap. Apply and verify before enabling NEXT_PUBLIC_NUTRITION_PROGRAM_ENABLED.
create or replace function public.merge_tracker_records(p_owner uuid, p_key text, p_records jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 current_value jsonb;
 result jsonb;
 item record;
 day_value jsonb;
 reuse_item jsonb;
 snap jsonb;
 ingredient jsonb;
 nutrient record;
 nutrient_key text;
 date_text text;
 parsed_date date;
 stamp numeric;
 uid uuid := auth.uid();
 max_finite constant numeric := 1.7976931348623157e308;
begin
 if uid is null or uid is distinct from p_owner then raise exception 'Authentication required'; end if;
 if p_key is null or p_key not in (
   'nutrition:entries','nutrition:foods','nutrition:recipes','nutrition:targets',
   'nutrition:programs','nutrition:days','nutrition:templates','nutrition:batches','routine:schedules','routine:history',
   'recovery:entries','habits:items','habits:history','plan:blocks','plan:days'
 ) then raise exception 'Unsupported record collection'; end if;
 if p_records is null or jsonb_typeof(p_records) is distinct from 'object'
   or octet_length(p_records::text) > 2000000 then raise exception 'Invalid records'; end if;

 -- Validate the whole incoming collection before inserting/locking tracker rows.
 for item in select key,value from jsonb_each(p_records) loop
   if jsonb_typeof(item.value) is distinct from 'object'
     or jsonb_typeof(item.value->'updatedAt') is distinct from 'number' then
     raise exception 'Record timestamp required';
   end if;
   if p_key in ('nutrition:templates','nutrition:batches') then
     stamp := (item.value->>'updatedAt')::numeric;
     if item.key !~ '^[A-Za-z0-9_-]{1,100}$' or item.value->>'id' is distinct from item.key
       or jsonb_typeof(item.value->'id') is distinct from 'string'
       or stamp < 0 or stamp > 9007199254740991 or trunc(stamp)<>stamp
       or (item.value ? 'deleted' and jsonb_typeof(item.value->'deleted') is distinct from 'boolean') then raise exception 'Invalid nutrition reuse record'; end if;
     if p_key='nutrition:templates' then
       if jsonb_typeof(item.value->'name') is distinct from 'string' or length(btrim(item.value->>'name')) not between 1 and 300
         or jsonb_typeof(item.value->'items') is distinct from 'array' then raise exception 'Invalid meal template'; end if;
       if jsonb_array_length(item.value->'items') not between 1 and 100 then raise exception 'Invalid meal template'; end if;
       for reuse_item in select value from jsonb_array_elements(item.value->'items') loop
         if not coalesce(public.valid_reuse_food(reuse_item->'food'),false) or jsonb_typeof(reuse_item->'quantity') is distinct from 'number' then raise exception 'Invalid meal template'; end if;
         if (reuse_item->>'quantity')::numeric not between 0.000000000001 and 1000000 then raise exception 'Invalid meal template'; end if;
         for nutrient in select key,value from jsonb_each(reuse_item->'food'->'nutrients') loop
           if nutrient.value<>'null'::jsonb and nutrient.value::numeric * (reuse_item->>'quantity')::numeric / (reuse_item->'food'->>'basisAmount')::numeric > max_finite then raise exception 'Invalid scaled meal template'; end if;
         end loop;
       end loop;
     else
       date_text:=item.value->>'preparedDate';
       if jsonb_typeof(item.value->'preparedDate') is distinct from 'string' or date_text !~ '^\d{4}-\d{2}-\d{2}$' or left(date_text,4)='0000' then raise exception 'Invalid prepared batch'; end if;
       begin parsed_date:=date_text::date; exception when others then raise exception 'Invalid prepared batch'; end;
       if to_char(parsed_date,'YYYY-MM-DD')<>date_text then raise exception 'Invalid prepared batch'; end if;
       snap:=item.value->'recipe';
       if not coalesce(public.valid_reuse_food(snap),false) or jsonb_typeof(snap->'ingredients') is distinct from 'array' then raise exception 'Invalid prepared recipe'; end if;
       if snap->>'basisUnit' not in ('g','serving') and not snap?'servings' and not snap?'cookedWeightGrams' then raise exception 'Invalid prepared yield'; end if;
       if jsonb_array_length(snap->'ingredients')>100 or (snap?'notes' and (jsonb_typeof(snap->'notes') is distinct from 'string' or length(snap->>'notes')>2000)) then raise exception 'Invalid prepared recipe'; end if;
       foreach nutrient_key in array array['servings','cookedWeightGrams'] loop
         if snap?nutrient_key and (jsonb_typeof(snap->nutrient_key) is distinct from 'number' or (snap->>nutrient_key)::numeric<=0 or (snap->>nutrient_key)::numeric>1000000) then raise exception 'Invalid prepared yield'; end if;
       end loop;
       for ingredient in select value from jsonb_array_elements(snap->'ingredients') loop
         if jsonb_typeof(ingredient) is distinct from 'object' or jsonb_typeof(ingredient->'name') is distinct from 'string'
           or length(btrim(ingredient->>'name')) not between 1 and 300 or jsonb_typeof(ingredient->'quantity') is distinct from 'number'
           or (ingredient->>'quantity')::numeric<=0 or (ingredient->>'quantity')::numeric>1000000
           or jsonb_typeof(ingredient->'unit') is distinct from 'string' or ingredient->>'unit' not in ('g','ml','serving')
           or not coalesce(public.valid_reuse_nutrients(ingredient->'nutrients'),false) then raise exception 'Invalid prepared ingredient'; end if;
       end loop;
       -- A finite ingredient can still overflow a finite batch total.
       if exists(select 1 from jsonb_array_elements(snap->'ingredients') a cross join lateral jsonb_each(a->'nutrients') n where n.value <> 'null'::jsonb group by n.key having sum(n.value::numeric)>max_finite) then raise exception 'Invalid prepared batch total'; end if;
     end if;
   end if;
   if p_key in ('nutrition:programs','nutrition:days') then
     stamp := (item.value->>'updatedAt')::numeric;
     if stamp < 0 or stamp > max_finite
       or jsonb_typeof(item.value->'id') is distinct from 'string'
       or item.value->>'id' is distinct from item.key or length(btrim(item.key)) = 0
       or (item.value ? 'deleted' and jsonb_typeof(item.value->'deleted') is distinct from 'boolean') then
       if p_key = 'nutrition:programs' then raise exception 'Invalid nutrition program';
       else raise exception 'Invalid nutrition day'; end if;
     end if;
   end if;
   if p_key = 'nutrition:programs' then
     if jsonb_typeof(item.value->'startDate') is distinct from 'string'
       or (item.value->>'startDate') !~ '^\d{4}-\d{2}-\d{2}$'
       or jsonb_typeof(item.value->'mode') is distinct from 'string'
       or item.value->>'mode' not in ('manual','flexible')
       or jsonb_typeof(item.value->'goal') is distinct from 'string'
       or item.value->>'goal' not in ('loss','maintain','gain')
       or jsonb_typeof(item.value->'days') is distinct from 'array' then
       raise exception 'Invalid nutrition program';
     end if;
     date_text := item.value->>'startDate';
     begin
       parsed_date := date_text::date;
     exception when others then raise exception 'Invalid nutrition program'; end;
     if to_char(parsed_date,'YYYY-MM-DD') <> date_text or jsonb_array_length(item.value->'days') <> 7 then
       raise exception 'Invalid nutrition program';
     end if;
     for day_value in select value from jsonb_array_elements(item.value->'days') loop
       if jsonb_typeof(day_value) is distinct from 'object' then raise exception 'Invalid nutrition program'; end if;
       foreach nutrient_key in array array['energy','protein','carbs','fat'] loop
         if jsonb_typeof(day_value->nutrient_key) is distinct from 'number' then raise exception 'Invalid nutrition program'; end if;
         if (day_value->>nutrient_key)::numeric < 0 or (day_value->>nutrient_key)::numeric > max_finite
           or (nutrient_key = 'energy' and (day_value->>nutrient_key)::numeric = 0) then
           raise exception 'Invalid nutrition program';
         end if;
       end loop;
     end loop;
   elsif p_key = 'nutrition:days' then
     if item.key !~ '^\d{4}-\d{2}-\d{2}$'
       or jsonb_typeof(item.value->'status') is distinct from 'string'
       or item.value->>'status' not in ('partial','complete','estimated','fasting') then
       raise exception 'Invalid nutrition day';
     end if;
     begin
       parsed_date := item.key::date;
     exception when others then raise exception 'Invalid nutrition day'; end;
     if to_char(parsed_date,'YYYY-MM-DD') <> item.key then raise exception 'Invalid nutrition day'; end if;
   end if;
 end loop;

 insert into public.tracker_data(user_id,key,value) values(uid,p_key,'{}'::jsonb) on conflict do nothing;
 select value into current_value from public.tracker_data where user_id=uid and key=p_key for update;
 result := current_value;
 for item in select key,value from jsonb_each(p_records) loop
   if result->item.key is null or (item.value->>'updatedAt')::numeric > coalesce((result->item.key->>'updatedAt')::numeric,0)
     or ((item.value->>'updatedAt')::numeric = coalesce((result->item.key->>'updatedAt')::numeric,0) and item.value->>'deleted'='true') then
     result := jsonb_set(result,array[item.key],item.value,true);
   end if;
 end loop;
 update public.tracker_data set value=result,updated_at=clock_timestamp() where user_id=uid and key=p_key;
 return result;
end $$;
revoke all on function public.merge_tracker_records(uuid,text,jsonb) from public;
grant execute on function public.merge_tracker_records(uuid,text,jsonb) to authenticated;
