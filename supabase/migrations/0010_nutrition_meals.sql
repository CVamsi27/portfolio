-- Additive foundation only: legacy tracker_data remains the read/rollback path.
-- RPC contract: save_nutrition_meal(owner UUID, operation ID, meal ID, entries JSON object)
-- entries = mealEntries(draft, stamp). The same operation and exact JSON payload are
-- safe to retry. Reusing an operation or meal ID for a different payload fails.
-- This insert-only ingestion deliberately rejects edits; revision-aware editing and
-- verified legacy import/cutover are separate migrations, never implicit overwrites.

create table if not exists public.nutrition_meal_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null check (operation_id ~ '^[A-Za-z0-9_-]{1,100}$'),
  meal_id text not null check (meal_id ~ '^[A-Za-z0-9_-]{1,100}$'),
  entries jsonb not null check (jsonb_typeof(entries) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);

create table if not exists public.nutrition_meals (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  operation_id text not null,
  date date not null,
  meal text not null,
  updated_at_ms bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, operation_id),
  foreign key (user_id, operation_id) references public.nutrition_meal_operations(user_id, operation_id)
);

create table if not exists public.nutrition_meal_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  meal_id text not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  primary key (user_id, id),
  foreign key (user_id, meal_id) references public.nutrition_meals(user_id, id)
);

create index if not exists nutrition_meals_owner_date on public.nutrition_meals(user_id, date);
create index if not exists nutrition_meal_entries_owner_meal on public.nutrition_meal_entries(user_id, meal_id);

alter table public.nutrition_meal_operations enable row level security;
alter table public.nutrition_meals enable row level security;
alter table public.nutrition_meal_entries enable row level security;

drop policy if exists nutrition_meal_operations_owner on public.nutrition_meal_operations;
create policy nutrition_meal_operations_owner on public.nutrition_meal_operations
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists nutrition_meals_owner on public.nutrition_meals;
create policy nutrition_meals_owner on public.nutrition_meals
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists nutrition_meal_entries_owner on public.nutrition_meal_entries;
create policy nutrition_meal_entries_owner on public.nutrition_meal_entries
  for select to authenticated using (auth.uid() = user_id);

-- Authenticated writes go through the validating transaction; direct mutation cannot
-- bypass meal completeness or operation idempotency. Anonymous users have no access.
revoke all on public.nutrition_meal_operations, public.nutrition_meals, public.nutrition_meal_entries from public, anon, authenticated;
grant select on public.nutrition_meal_operations, public.nutrition_meals, public.nutrition_meal_entries to authenticated;

create or replace function public.save_nutrition_meal(
  p_owner uuid, p_operation_id text, p_meal_id text, p_entries jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  entry record;
  nutrient record;
  prior public.nutrition_meal_operations%rowtype;
  day_text text;
  meal_text text;
  stamp numeric;
  parsed_date date;
  max_finite constant numeric := 1.7976931348623157e308;
  allowed_nutrients constant text[] := array[
    'energy','protein','carbs','fat','fibre','sugar','saturatedFat',
    'vitaminA','vitaminC','vitaminD','vitaminE','vitaminK','thiamin','riboflavin',
    'niacin','pantothenic','vitaminB6','biotin','folate','vitaminB12',
    'calcium','iron','magnesium','phosphorus','potassium','sodium','zinc',
    'copper','manganese','iodine','selenium'
  ];
begin
  if uid is null or uid is distinct from p_owner then raise exception 'Authentication required'; end if;
  if p_operation_id is null or p_operation_id !~ '^[A-Za-z0-9_-]{1,100}$'
    or p_meal_id is null or p_meal_id !~ '^[A-Za-z0-9_-]{1,100}$' then
    raise exception 'Invalid operation or meal ID';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'object'
    or octet_length(p_entries::text) > 2000000 then raise exception 'Invalid meal entries'; end if;
  if (select count(*) from jsonb_each(p_entries)) not between 1 and 100 then
    raise exception 'A meal requires between 1 and 100 foods';
  end if;

  -- Validate every snapshot before inserting any row. Exceptions roll back the whole RPC.
  for entry in select key, value from jsonb_each(p_entries) loop
    if jsonb_typeof(entry.value) <> 'object'
      or entry.key !~ ('^' || p_meal_id || ':[A-Za-z0-9_-]{1,100}$')
      or entry.value->>'id' is distinct from entry.key
      or entry.value->>'mealId' is distinct from p_meal_id
      or jsonb_typeof(entry.value->'name') is distinct from 'string'
      or length(btrim(entry.value->>'name')) = 0 or length(entry.value->>'name') > 300
      or jsonb_typeof(entry.value->'foodId') is distinct from 'string'
      or length(entry.value->>'foodId') not between 1 and 500
      or jsonb_typeof(entry.value->'source') is distinct from 'string'
      or length(entry.value->>'source') > 1000
      or jsonb_typeof(entry.value->'basisUnit') is distinct from 'string'
      or entry.value->>'basisUnit' not in ('g','ml','serving')
      or jsonb_typeof(entry.value->'basisAmount') is distinct from 'number'
      or jsonb_typeof(entry.value->'quantity') is distinct from 'number'
      or jsonb_typeof(entry.value->'updatedAt') is distinct from 'number'
      or jsonb_typeof(entry.value->'date') is distinct from 'string'
      or jsonb_typeof(entry.value->'meal') is distinct from 'string'
      or length(btrim(entry.value->>'meal')) = 0 or length(entry.value->>'meal') > 100
      or jsonb_typeof(entry.value->'nutrients') is distinct from 'object'
      or (entry.value ? 'note' and (jsonb_typeof(entry.value->'note') <> 'string' or length(entry.value->>'note') > 2000))
      or entry.value ? 'deleted' then raise exception 'Invalid food snapshot';
    end if;
    if (entry.value->>'basisAmount')::numeric <= 0
      or (entry.value->>'basisAmount')::numeric > max_finite
      or (entry.value->>'quantity')::numeric <= 0 or (entry.value->>'quantity')::numeric > 1000000
      or (entry.value->>'updatedAt')::numeric not between 0 and 9007199254740991
      or trunc((entry.value->>'updatedAt')::numeric) <> (entry.value->>'updatedAt')::numeric then
      raise exception 'Invalid portion or timestamp';
    end if;
    if entry.value->>'date' !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid meal date'; end if;
    parsed_date := (entry.value->>'date')::date;
    if to_char(parsed_date, 'YYYY-MM-DD') <> entry.value->>'date' then raise exception 'Invalid meal date'; end if;
    if day_text is null then
      day_text := entry.value->>'date'; meal_text := entry.value->>'meal'; stamp := (entry.value->>'updatedAt')::numeric;
    elsif entry.value->>'date' is distinct from day_text
      or entry.value->>'meal' is distinct from meal_text
      or (entry.value->>'updatedAt')::numeric is distinct from stamp then
      raise exception 'All foods must belong to the same dated meal operation';
    end if;
    for nutrient in select key, value from jsonb_each(entry.value->'nutrients') loop
      if not (nutrient.key = any(allowed_nutrients)) or jsonb_typeof(nutrient.value) not in ('number','null') then
        raise exception 'Invalid nutrient value';
      end if;
      if jsonb_typeof(nutrient.value) = 'number' and (nutrient.value::text)::numeric < 0 then
        raise exception 'Nutrients cannot be negative';
      end if;
      if jsonb_typeof(nutrient.value) = 'number' and (
        (nutrient.value::text)::numeric > max_finite or
        (nutrient.value::text)::numeric * (entry.value->>'quantity')::numeric > max_finite or
        (nutrient.value::text)::numeric * (entry.value->>'quantity')::numeric /
          (entry.value->>'basisAmount')::numeric > max_finite
      ) then raise exception 'Invalid nutrient value'; end if;
    end loop;
  end loop;

  -- Unique insertion waits for a competing transaction; the following lock then
  -- compares its committed operation payload, including immutable nutrient values.
  insert into public.nutrition_meal_operations(user_id,operation_id,meal_id,entries)
    values(uid,p_operation_id,p_meal_id,p_entries) on conflict (user_id,operation_id) do nothing;
  select * into prior from public.nutrition_meal_operations
    where user_id=uid and operation_id=p_operation_id for update;
  if prior.meal_id is distinct from p_meal_id or prior.entries is distinct from p_entries then
    raise exception 'Operation ID already used for a different meal';
  end if;
  if exists (select 1 from public.nutrition_meals where user_id=uid and operation_id=p_operation_id) then
    return prior.entries;
  end if;
  if exists (select 1 from public.nutrition_meals where user_id=uid and id=p_meal_id) then
    raise exception 'Meal already exists; use a revision-aware edit operation';
  end if;
  insert into public.nutrition_meals(user_id,id,operation_id,date,meal,updated_at_ms)
    values(uid,p_meal_id,p_operation_id,day_text::date,meal_text,stamp::bigint);
  insert into public.nutrition_meal_entries(user_id,id,meal_id,snapshot)
    select uid,key,p_meal_id,value from jsonb_each(p_entries);
  return p_entries;
end $$;

revoke all on function public.save_nutrition_meal(uuid,text,text,jsonb) from public, anon;
grant execute on function public.save_nutrition_meal(uuid,text,text,jsonb) to authenticated;
