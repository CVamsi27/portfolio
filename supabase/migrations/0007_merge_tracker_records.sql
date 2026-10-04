-- Atomic, owner-only record merge. Different entries cannot overwrite one another.
create or replace function public.merge_tracker_records(p_owner uuid, p_key text, p_records jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare current_value jsonb; result jsonb; item record; uid uuid := auth.uid();
begin
 if uid is null or uid is distinct from p_owner then raise exception 'Authentication required'; end if;
 if p_key not like 'nutrition:%' and p_key not in ('routine:schedules','routine:history','recovery:entries','habits:items','habits:history') then raise exception 'Unsupported record collection'; end if;
 if p_records is null or jsonb_typeof(p_records) <> 'object' or octet_length(p_records::text) > 2000000 then raise exception 'Invalid records'; end if;
 insert into tracker_data(user_id,key,value) values(uid,p_key,'{}'::jsonb) on conflict do nothing;
 select value into current_value from tracker_data where user_id=uid and key=p_key for update;
 result := current_value;
 for item in select key,value from jsonb_each(p_records) loop
  if jsonb_typeof(item.value) <> 'object' or jsonb_typeof(item.value->'updatedAt') <> 'number' then raise exception 'Record timestamp required'; end if;
  if result->item.key is null or (item.value->>'updatedAt')::numeric > coalesce((result->item.key->>'updatedAt')::numeric,0)
    or ((item.value->>'updatedAt')::numeric = coalesce((result->item.key->>'updatedAt')::numeric,0) and item.value->>'deleted'='true') then
   result := jsonb_set(result,array[item.key],item.value,true);
  end if;
 end loop;
 update tracker_data set value=result,updated_at=clock_timestamp() where user_id=uid and key=p_key;
 return result;
end $$;
revoke all on function public.merge_tracker_records(uuid,text,jsonb) from public;
grant execute on function public.merge_tracker_records(uuid,text,jsonb) to authenticated;
