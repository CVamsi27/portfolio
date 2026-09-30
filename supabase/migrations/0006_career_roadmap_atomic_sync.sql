-- Atomic, owner-scoped seed path for the private career planner.
-- Call only from a trusted service-role script after resolving the exact account.
create or replace function public.sync_career_roadmap(p_user_id uuid, p_rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_value jsonb;
  applied integer := 0;
begin
  if p_user_id is null or p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'invalid career roadmap sync payload';
  end if;
  if jsonb_array_length(p_rows) > 5 then
    raise exception 'too many career roadmap rows';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_rows) as rows(value)
    group by rows.value ->> 'key'
    having count(*) > 1
  ) then
    raise exception 'duplicate career roadmap key';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_rows) as rows(value)
    where rows.value ->> 'user_id' is distinct from p_user_id::text
       or rows.value ->> 'key' is null
       or rows.value ->> 'key' not in (
         'timetable_100_days', 'career_command_center',
         'career_execution_state', 'todos', 'reminders'
       )
       or not (rows.value ? 'value')
  ) then
    raise exception 'invalid career roadmap row';
  end if;
  for row_value in select value from jsonb_array_elements(p_rows)
  loop
    insert into public.tracker_data (user_id, key, value, updated_at)
    values (p_user_id, row_value ->> 'key', row_value -> 'value', now())
    on conflict (user_id, key) do update
      set value = excluded.value, updated_at = excluded.updated_at;
    applied := applied + 1;
  end loop;
  return applied;
end;
$$;

revoke all on function public.sync_career_roadmap(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.sync_career_roadmap(uuid, jsonb) to service_role;
