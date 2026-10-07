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
   'nutrition:programs','nutrition:days','routine:schedules','routine:history',
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
