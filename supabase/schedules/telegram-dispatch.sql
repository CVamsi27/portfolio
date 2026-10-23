-- Operator-run Telegram routine dispatcher.
--
-- This file is deliberately outside supabase/migrations: `supabase db push`
-- must not install a scheduler. Run it only after the application revision is
-- deployed and the production environment contains TELEGRAM_BOT_TOKEN,
-- TELEGRAM_CHAT_ID and CRON_SECRET.
--
-- Before running, store the same CRON_SECRET value in Supabase Vault:
--   select vault.create_secret(
--     '<CRON_SECRET>',
--     'telegram_cron_secret',
--     'Bearer for /api/telegram/dispatch'
--   );
--
-- The route resolves the owner account, groups due routine items, and claims
-- durable delivery IDs. It sends only to the configured private Telegram chat.

select cron.unschedule('nova-telegram-dispatch')
where exists (
  select 1 from cron.job where jobname = 'nova-telegram-dispatch'
);

select cron.schedule(
  'nova-telegram-dispatch',
  '* * * * *',
  $$
    select net.http_get(
      url := 'https://www.buildora.work/api/telegram/dispatch',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'telegram_cron_secret'
        )
      ),
      timeout_milliseconds := 30000
    );
  $$
);
