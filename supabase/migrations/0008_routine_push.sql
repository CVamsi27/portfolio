create table if not exists public.push_subscriptions (
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null, p256dh text not null, auth text not null,
 detailed boolean not null default false,
 primary key(user_id,endpoint),
 unique(endpoint)
);
create unique index if not exists push_subscription_endpoint on public.push_subscriptions(endpoint);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscription_owner on public.push_subscriptions;
create policy push_subscription_owner on public.push_subscriptions for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create table if not exists public.push_deliveries (
 user_id uuid not null references auth.users(id) on delete cascade,
 delivery_id text not null,
 status text not null default 'pending' check(status in ('pending','sent')),
 lease_until timestamptz not null default now(),
 delivered_at timestamptz,
 primary key(user_id,delivery_id)
);
alter table public.push_deliveries enable row level security;
-- No public/authenticated access to dispatch state.
create or replace function public.claim_routine_push(p_user uuid,p_delivery text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare claimed boolean;
begin
 insert into push_deliveries(user_id,delivery_id,lease_until) values(p_user,p_delivery,now()+interval '2 minutes')
 on conflict(user_id,delivery_id) do update set lease_until=now()+interval '2 minutes'
 where push_deliveries.status='pending' and push_deliveries.lease_until<now()
 returning true into claimed;
 return coalesce(claimed,false);
end $$;
revoke all on function public.claim_routine_push(uuid,text) from public;
grant execute on function public.claim_routine_push(uuid,text) to service_role;
