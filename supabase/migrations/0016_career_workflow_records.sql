-- Add income-workflow collections without changing validation of existing keys.
-- Apply and verify before enabling NEXT_PUBLIC_CAREER_WORKFLOW_ENABLED.
-- The existing implementation remains SECURITY INVOKER and owner checked.
do $$ begin
  if to_regprocedure('public.merge_tracker_records_legacy_0014(uuid,text,jsonb)') is null then
    alter function public.merge_tracker_records(uuid,text,jsonb) rename to merge_tracker_records_legacy_0014;
  end if;
end $$;

create or replace function public.valid_career_date(v text) returns boolean
language plpgsql immutable set search_path='' as $$
declare parsed date;
begin
  if v is null or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or left(v,4)='0000' then return false; end if;
  parsed:=v::date;
  return to_char(parsed,'YYYY-MM-DD')=v;
exception when others then return false;
end $$;

create or replace function public.valid_career_url(v text, contact boolean default false) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(length(v) between 1 and 2000 and v !~ '[[:space:][:cntrl:]]' and v !~* '%0[ad]'
   and (v ~* '^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
     or (contact and v ~* '^mailto:[^@[:space:]?]+@[^@[:space:]?]+\.[^@[:space:]?]+$')),false)
$$;

create or replace function public.valid_career_record(p_key text, v jsonb, record_id text) returns boolean
language plpgsql immutable set search_path='' as $$
declare field text; item jsonb; stamp numeric; amount numeric; parsed timestamptz; max_length integer;
begin
  if jsonb_typeof(v) is distinct from 'object' or record_id !~ '^[A-Za-z0-9_-]{1,100}$' or record_id in ('__proto__','constructor','prototype')
    or jsonb_typeof(v->'id') is distinct from 'string' or v->>'id' is distinct from record_id
    or jsonb_typeof(v->'updatedAt') is distinct from 'number' then return false; end if;
  stamp:=(v->>'updatedAt')::numeric;
  if stamp<0 or stamp>9007199254740991 or trunc(stamp)<>stamp
    or (v?'deleted' and jsonb_typeof(v->'deleted') is distinct from 'boolean') then return false; end if;
  if p_key='career:research' then
    if v?'sourceUpdatedAt' then
      if jsonb_typeof(v->'sourceUpdatedAt') is distinct from 'number' then return false; end if;
      stamp:=(v->>'sourceUpdatedAt')::numeric;
      if stamp<0 or stamp>9007199254740991 or trunc(stamp)<>stamp then return false; end if;
    end if;
    foreach field in array array['company','title','roleUrl','location','eligibilityEvidence','suggestedAction','compensation','draft'] loop
      max_length:=case when field in ('company','title') then 300 when field='location' then 500 when field='draft' then 20000 else 2000 end;
      if jsonb_typeof(v->field) is distinct from 'string' or length(v->>field)>max_length
        or (field not in ('compensation','draft') and length(btrim(v->>field))=0) then return false; end if;
    end loop;
    if length(btrim(v->>'company'))=0 or length(btrim(v->>'title'))=0
      or not public.valid_career_url(v->>'roleUrl') or not public.valid_career_date(v->>'checkedOn')
      or jsonb_typeof(v->'kind') is distinct from 'string' or v->>'kind' not in ('employment','contract')
      or jsonb_typeof(v->'availability') is distinct from 'string' or v->>'availability' not in ('active','expired','uncertain')
      or jsonb_typeof(v->'eligibility') is distinct from 'string' or v->>'eligibility' not in ('eligible','clarify','ineligible')
      or jsonb_typeof(v->'rank') is distinct from 'number' then return false; end if;
    stamp:=(v->>'rank')::numeric;
    if stamp<0 or stamp>10000 or trunc(stamp)<>stamp then return false; end if;
    foreach field in array array['fit','gaps','questions'] loop
      if jsonb_typeof(v->field) is distinct from 'array' or jsonb_array_length(v->field)>30 then return false; end if;
      for item in select value from jsonb_array_elements(v->field) loop
        if jsonb_typeof(item) is distinct from 'string' or length(item#>>'{}')>2000 or length(btrim(item#>>'{}'))=0 then return false; end if;
      end loop;
    end loop;
    if jsonb_typeof(v->'contacts') is distinct from 'array' or jsonb_array_length(v->'contacts')>20 then return false; end if;
    for item in select value from jsonb_array_elements(v->'contacts') loop
      if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'name') is distinct from 'string'
        or length(btrim(item->>'name')) not between 1 and 300
        or jsonb_typeof(item->'url') is distinct from 'string' or not public.valid_career_url(item->>'url',true) then return false; end if;
    end loop;
  elsif p_key='career:opportunities' then
    if jsonb_typeof(v->'stage') is distinct from 'string' or v->>'stage' not in ('research','clarify','ready','applied','interview','offer','won','closed')
      or jsonb_typeof(v->'priority') is distinct from 'number' then return false; end if;
    stamp:=(v->>'priority')::numeric;
    if stamp<0 or stamp>10000 or trunc(stamp)<>stamp then return false; end if;
    foreach field in array array['draft','notes','nextAction','scope','terms','weeklyHours'] loop
      max_length:=case when field='draft' then 20000 when field='notes' then 10000 when field in ('scope','terms') then 5000 when field='weeklyHours' then 300 else 2000 end;
      if jsonb_typeof(v->field) is distinct from 'string' or length(v->>field)>max_length then return false; end if;
    end loop;
    foreach field in array array['followUpOn','startOn','firstPaymentOn'] loop
      if not v?field or (v->field<>'null'::jsonb and (jsonb_typeof(v->field) is distinct from 'string' or not public.valid_career_date(v->>field))) then return false; end if;
    end loop;
  elsif p_key='career:activities' then
    if jsonb_typeof(v->'opportunityId') is distinct from 'string' or v->>'opportunityId' !~ '^[A-Za-z0-9_-]{1,100}$' or v->>'opportunityId' in ('__proto__','constructor','prototype')
      or not public.valid_career_date(v->>'date') or jsonb_typeof(v->'kind') is distinct from 'string'
      or v->>'kind' not in ('application','outreach','conversation','reply','interview','proposal','agreement','payment','note','delivery','offer') then return false; end if;
    foreach field in array array['reference','note'] loop
      max_length:=case when field='reference' then 2000 else 10000 end;
      if jsonb_typeof(v->field) is distinct from 'string' or length(v->>field)>max_length then return false; end if;
    end loop;
    if v->>'kind'<>'note' and length(btrim(v->>'reference'))=0 then return false; end if;
    if v?'done' and jsonb_typeof(v->'done') is distinct from 'boolean' then return false; end if;
    if v?'scheduledAt' then
      if jsonb_typeof(v->'scheduledAt') is distinct from 'string' or length(v->>'scheduledAt') not between 20 and 40 or v->>'scheduledAt' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T.*(Z|[+-][0-9]{2}:[0-9]{2})$' then return false; end if;
      parsed:=(v->>'scheduledAt')::timestamptz;
      if not isfinite(parsed) then return false; end if;
    end if;
    if v->>'kind'='payment' then
      if jsonb_typeof(v->'amount') is distinct from 'number' or jsonb_typeof(v->'currency') is distinct from 'string'
        or v->>'currency' !~ '^[A-Z]{3}$' then return false; end if;
      amount:=(v->>'amount')::numeric;
      if amount<=0 or amount>1000000000000 then return false; end if;
    else
      if v?'amount' and (jsonb_typeof(v->'amount') is distinct from 'number' or (v->>'amount')::numeric<0 or (v->>'amount')::numeric>1.7976931348623157e308) then return false; end if;
      if v?'currency' and (jsonb_typeof(v->'currency') is distinct from 'string' or v->>'currency' !~ '^[A-Z]{3}$') then return false; end if;
    end if;
  else return false;
  end if;
  return true;
exception when others then return false;
end $$;

create or replace function public.merge_tracker_records(p_owner uuid,p_key text,p_records jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); item record; result jsonb;
begin
  if uid is null or uid is distinct from p_owner then raise exception 'Authentication required'; end if;
  if p_key is null or p_key not in ('career:research','career:opportunities','career:activities') then
    return public.merge_tracker_records_legacy_0014(p_owner,p_key,p_records);
  end if;
  if p_records is null or jsonb_typeof(p_records) is distinct from 'object' or octet_length(p_records::text)>2000000 then raise exception 'Invalid career collection'; end if;
  if (select count(*) from jsonb_each(p_records))>2000 then raise exception 'Too many career records'; end if;
  for item in select key,value from jsonb_each(p_records) loop
    if not public.valid_career_record(p_key,item.value,item.key) then raise exception 'Invalid career record'; end if;
  end loop;
  insert into public.tracker_data(user_id,key,value) values(uid,p_key,'{}'::jsonb) on conflict do nothing;
  select value into result from public.tracker_data where user_id=uid and key=p_key for update;
  for item in select key,value from jsonb_each(p_records) loop
    if result->item.key is null or (item.value->>'updatedAt')::numeric>coalesce((result->item.key->>'updatedAt')::numeric,0)
      or ((item.value->>'updatedAt')::numeric=coalesce((result->item.key->>'updatedAt')::numeric,0) and item.value->>'deleted'='true') then
      result:=jsonb_set(result,array[item.key],item.value,true);
    end if;
  end loop;
  update public.tracker_data set value=result,updated_at=clock_timestamp() where user_id=uid and key=p_key;
  return result;
end $$;

revoke all on function public.merge_tracker_records(uuid,text,jsonb),public.merge_tracker_records_legacy_0014(uuid,text,jsonb),public.valid_career_date(text),public.valid_career_url(text,boolean),public.valid_career_record(text,jsonb,text) from public;
grant execute on function public.merge_tracker_records(uuid,text,jsonb),public.merge_tracker_records_legacy_0014(uuid,text,jsonb),public.valid_career_date(text),public.valid_career_url(text,boolean),public.valid_career_record(text,jsonb,text) to authenticated;
