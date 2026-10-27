-- Telegram dispatch is claim -> arm -> send -> acknowledge. Once armed,
-- a missing acknowledgement is ambiguous and must not cause an automatic resend.
-- Legacy web-push pending/sent rows and claim_routine_push remain compatible.
alter table public.push_deliveries
  drop constraint if exists push_deliveries_status_check;
alter table public.push_deliveries
  add constraint push_deliveries_status_check
    check (status in ('pending','sent','claimed','sending','failed','unknown')),
  add column telegram_kind text check (telegram_kind in ('routine','career-digest','career-study','career-project')),
  add column recipient_fingerprint text check (recipient_fingerprint ~ '^[a-f0-9]{64}$'),
  add column scheduled_at timestamptz,
  add column expires_at timestamptz,
  add column lease_token uuid,
  add column attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  add column attempted_at timestamptz,
  add column unknown_at timestamptz,
  add column next_attempt_at timestamptz,
  add column last_error_code text check (last_error_code ~ '^[a-z0-9-]{1,64}$'),
  add column provider_message_id bigint check (provider_message_id > 0);

create index push_deliveries_telegram_status
  on public.push_deliveries(user_id,telegram_kind,status,attempted_at desc)
  where telegram_kind is not null;

-- All three functions are invoker functions with service-role-only execution.
-- The caller resolves the configured owner; recipients never come from requests.
create function public.claim_telegram_delivery(
  p_user uuid,p_delivery text,p_kind text,p_recipient_fingerprint text,
  p_scheduled_at timestamptz,p_expires_at timestamptz
) returns jsonb language plpgsql security invoker
set search_path=pg_catalog,public as $$
declare
  current_delivery public.push_deliveries%rowtype;
  new_token uuid := gen_random_uuid();
  current_time_value timestamptz;
begin
  if p_user is null or p_delivery is null or p_delivery !~ '^[a-f0-9]{64}$'
    or p_kind is null or p_kind not in ('routine','career-digest','career-study','career-project')
    or p_recipient_fingerprint is null or p_recipient_fingerprint !~ '^[a-f0-9]{64}$'
    or p_scheduled_at is null or p_expires_at is null
    or not isfinite(p_scheduled_at) or not isfinite(p_expires_at)
    or p_expires_at <= p_scheduled_at
    or p_expires_at > p_scheduled_at+interval '15 minutes' then
    raise exception using errcode='22023',message='Invalid Telegram delivery arguments.';
  end if;
  if p_scheduled_at <= clock_timestamp() and p_expires_at >= clock_timestamp() then
    insert into public.push_deliveries(
      user_id,delivery_id,status,lease_until,telegram_kind,recipient_fingerprint,
      scheduled_at,expires_at,lease_token
    ) values (
      p_user,p_delivery,'claimed',clock_timestamp()+interval '2 minutes',p_kind,
      p_recipient_fingerprint,p_scheduled_at,p_expires_at,new_token
    ) on conflict(user_id,delivery_id) do nothing;
  end if;
  -- The primary key and this row lock serialize concurrent scheduler invocations.
  select * into current_delivery from public.push_deliveries
    where user_id=p_user and delivery_id=p_delivery for update;
  if not found then return jsonb_build_object('status','skipped'); end if;
  current_time_value := clock_timestamp();
  if current_delivery.lease_token=new_token then
    return jsonb_build_object('status','claimed','token',new_token);
  end if;
  if current_delivery.status='unknown' then return jsonb_build_object('status','unknown'); end if;
  if current_delivery.status='sent' then return jsonb_build_object('status','skipped'); end if;
  if (current_delivery.status='sending' or current_delivery.status='pending')
    and current_delivery.lease_until < current_time_value then
    update public.push_deliveries set status='unknown',unknown_at=current_time_value,
      next_attempt_at=null,last_error_code=case when status='pending'
        then 'telegram-legacy-acceptance-unknown' else 'telegram-lease-expired' end,
      telegram_kind=coalesce(telegram_kind,p_kind),
      recipient_fingerprint=coalesce(recipient_fingerprint,p_recipient_fingerprint)
      where user_id=p_user and delivery_id=p_delivery;
    return jsonb_build_object('status','unknown');
  end if;
  if current_delivery.telegram_kind is distinct from p_kind
    or current_delivery.recipient_fingerprint is distinct from p_recipient_fingerprint
    or current_delivery.status in ('pending','sending') then
    return jsonb_build_object('status','skipped');
  end if;
  if current_delivery.expires_at < current_time_value then
    update public.push_deliveries set status='failed',next_attempt_at=null,
      last_error_code='telegram-expired-before-send'
      where user_id=p_user and delivery_id=p_delivery;
    return jsonb_build_object('status','skipped');
  end if;
  if current_delivery.attempt_count >= 3
    or (current_delivery.status='claimed' and current_delivery.lease_until >= current_time_value)
    or (current_delivery.status='failed' and (current_delivery.next_attempt_at is null
      or current_delivery.next_attempt_at > current_time_value)) then
    return jsonb_build_object('status','skipped');
  end if;
  update public.push_deliveries set status='claimed',lease_token=new_token,
    lease_until=current_time_value+interval '2 minutes',next_attempt_at=null
    where user_id=p_user and delivery_id=p_delivery;
  return jsonb_build_object('status','claimed','token',new_token);
end $$;

create function public.arm_telegram_delivery(p_user uuid,p_delivery text,p_token uuid)
returns boolean language plpgsql security invoker
set search_path=pg_catalog,public as $$
declare armed boolean;
begin
  if p_user is null or p_delivery is null or p_token is null
    or p_delivery !~ '^[a-f0-9]{64}$' then
    raise exception using errcode='22023',message='Invalid Telegram delivery arguments.';
  end if;
  update public.push_deliveries set status='sending',attempt_count=attempt_count+1,
    attempted_at=clock_timestamp(),lease_until=clock_timestamp()+interval '2 minutes',
    last_error_code=null
    where user_id=p_user and delivery_id=p_delivery and lease_token=p_token
      and status='claimed' and lease_until >= clock_timestamp()
      and scheduled_at <= clock_timestamp() and expires_at >= clock_timestamp()
      and attempt_count < 3
    returning true into armed;
  return coalesce(armed,false);
end $$;

create function public.finish_telegram_delivery(
  p_user uuid,p_delivery text,p_token uuid,p_outcome text,
  p_message_id bigint default null,p_error_code text default null,
  p_retry_after_seconds integer default null
) returns boolean language plpgsql security invoker
set search_path=pg_catalog,public as $$
declare
  current_delivery public.push_deliveries%rowtype;
  current_time_value timestamptz;
  retry_at timestamptz;
begin
  if p_user is null or p_delivery is null or p_token is null
    or p_delivery !~ '^[a-f0-9]{64}$'
    or p_outcome is null or p_outcome not in ('sent','failed','unknown','retryable')
    or (p_outcome='sent' and (p_message_id is null or p_message_id <= 0))
    or (p_outcome<>'sent' and p_message_id is not null)
    or (p_outcome<>'sent' and (p_error_code is null or p_error_code !~ '^[a-z0-9-]{1,64}$'))
    or (p_outcome='sent' and p_error_code is not null)
    or (p_outcome='retryable' and p_error_code<>'telegram-429')
    or (p_retry_after_seconds is not null and (p_retry_after_seconds < 1 or p_outcome<>'retryable')) then
    raise exception using errcode='22023',message='Invalid Telegram delivery outcome.';
  end if;
  select * into current_delivery from public.push_deliveries
    where user_id=p_user and delivery_id=p_delivery for update;
  if not found or current_delivery.status<>'sending'
    or current_delivery.lease_token is distinct from p_token then return false; end if;
  current_time_value := clock_timestamp();
  -- A response arriving beyond the lease is conservative even if no other worker
  -- has yet observed the expiry. An operator must reconcile it without resending.
  if current_delivery.lease_until < current_time_value then
    update public.push_deliveries set status='unknown',unknown_at=current_time_value,
      last_error_code='telegram-lease-expired',next_attempt_at=null
      where user_id=p_user and delivery_id=p_delivery;
    return false;
  end if;
  if p_outcome='retryable' and current_delivery.attempt_count < 3 then
    -- Retry is safe only for a definite 429. Never clamp the provider's minimum
    -- delay down to fit the window: if it cannot fit, stop this occurrence.
    if coalesce(p_retry_after_seconds,0) <= 900 then
      retry_at := current_time_value + make_interval(secs => greatest(
        coalesce(p_retry_after_seconds,0),5*(2^(current_delivery.attempt_count-1))::integer));
      if retry_at > current_delivery.expires_at then retry_at := null; end if;
    end if;
  end if;
  update public.push_deliveries set
    status=case when p_outcome='retryable' then 'failed' else p_outcome end,
    delivered_at=case when p_outcome='sent' then current_time_value else delivered_at end,
    provider_message_id=case when p_outcome='sent' then p_message_id else provider_message_id end,
    unknown_at=case when p_outcome='unknown' then current_time_value else unknown_at end,
    next_attempt_at=retry_at,last_error_code=p_error_code,
    lease_until=current_time_value
    where user_id=p_user and delivery_id=p_delivery;
  return true;
end $$;

-- Run on every authorized scheduler invocation, including when the occurrence
-- window has closed and the original notification is no longer selected.
create function public.expire_telegram_deliveries(p_user uuid)
returns integer language plpgsql security invoker
set search_path=pg_catalog,public as $$
declare changed integer;
begin
  if p_user is null then
    raise exception using errcode='22023',message='Invalid Telegram delivery owner.';
  end if;
  update public.push_deliveries set
    status=case when status='sending' then 'unknown' else 'failed' end,
    unknown_at=case when status='sending' then clock_timestamp() else unknown_at end,
    next_attempt_at=null,last_error_code=case when status='sending'
      then 'telegram-lease-expired' else 'telegram-expired-before-send' end
    where user_id=p_user and telegram_kind is not null and (
      (status='sending' and lease_until < clock_timestamp())
      or (status='claimed' and expires_at < clock_timestamp())
      or (status='failed' and next_attempt_at is not null and expires_at < clock_timestamp())
    );
  get diagnostics changed = row_count;
  return changed;
end $$;

revoke all on function public.claim_telegram_delivery(uuid,text,text,text,timestamptz,timestamptz) from public,anon,authenticated;
revoke all on function public.arm_telegram_delivery(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.finish_telegram_delivery(uuid,text,uuid,text,bigint,text,integer) from public,anon,authenticated;
revoke all on function public.expire_telegram_deliveries(uuid) from public,anon,authenticated;
grant execute on function public.claim_telegram_delivery(uuid,text,text,text,timestamptz,timestamptz) to service_role;
grant execute on function public.arm_telegram_delivery(uuid,text,uuid) to service_role;
grant execute on function public.finish_telegram_delivery(uuid,text,uuid,text,bigint,text,integer) to service_role;
grant execute on function public.expire_telegram_deliveries(uuid) to service_role;
