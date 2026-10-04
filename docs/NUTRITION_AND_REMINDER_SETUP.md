# Nutrition and routine delivery setup

Manual food/recipe logging and in-app routine checklists work without an external provider. Production private record syncing requires Supabase migrations 0007 and 0008. Apply with the project's existing migration workflow and retain a database backup; never reset user tables.

Server environment:

- USDA_FDC_API_KEY: your data.gov FoodData Central key. Search has no production demo-key fallback.
- VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY: generate once with `node scripts/generate-push-keys.mjs`; store the private key only on the server.
- VAPID_SUBJECT: a valid operator mailto contact or HTTPS URL.
- CRON_SECRET: a strong random bearer secret for the scheduler.
- Existing Supabase URL and service-role/secret key, alongside the configured public auth key.

Configure a server scheduler to GET `/api/push/dispatch` once per minute with `Authorization: Bearer <CRON_SECRET>`. No unauthenticated dispatch is accepted. Configuration is intentionally not silently added to a platform's cron plan or paid service. The app's push opt-in remains unavailable until these values are set.

Users explicitly enable notifications in Routine reminders. Subscription keys are private and owner-scoped. Lock-screen text is generic unless they select detailed content. The dispatcher groups simultaneous items (Lunch + Omega-3), leases durable per-device delivery IDs to avoid simultaneous double sends, retries failed pending deliveries, and removes expired subscriptions. A provider may accept a push without the device actually showing it; notification completion is not supplement completion. Browser/system delays remain possible.

Verify a real signed-in device with the site closed: one due notification, correct routine destination, separate meal/supplement states, snooze, denied permission, expired subscription, and a 10 PM reminder while NOVA's optional rest view is active. Record deployment evidence before claiming delivery is operational.

Authoritative references: [FoodData Central API](https://fdc.nal.usda.gov/api-guide/), [web-push library](https://github.com/web-push-libs/web-push).

## Account data and rollback

Authenticated storage now uses `vk:account:<user id>:<key>`. Existing cloud data is pulled into that account. Older unassigned `vk:<key>` browser records are retained, never silently attached to an account. Settings offers an explicit legacy-device export; review that file before importing it into the intended account. Normal exports, restore snapshots and deletion affect the current account.

Before rollout, export each account and back up the database. Apply migrations 0007 and 0008 without resetting tables, then check two distinct signed-in accounts and two devices: records stay private, separate entries merge, an edited entry wins by timestamp, deletions survive sync, and offline writes retry on reconnection. These authenticated checks have not been performed by the local auth-open browser suite.

To roll back the UI, redeploy the previously verified application revision. Retain the new nutrition, routine, recovery and habit records, account-prefixed browser storage, and SQL tables; do not drop them as part of rollback. Disable the dispatch scheduler first if reverting push support. Restore an exported backup only after reviewing its account and timestamp. Supabase migration execution, server environment values, scheduler setup and real-device delivery remain deployment gates.

## Active-session compatibility

`work:active` is the authoritative focus/study record. Existing `focus:active` and `study:active_session` keys remain compatibility mirrors and are included in backups. A legacy active session is adopted only when no authoritative record exists; an explicitly cleared authoritative session does not resurrect a stale legacy timer. Authenticated adoption waits for cloud pulls. Verify this transition on signed-in devices before rollout. Completed chapter records may now include `sessionId` for retry deduplication; existing records remain intact.

## Daily planning rollout

Apply migration `0009_day_planning_records.sql` after 0007/0008 through the existing migration workflow. It extends the owner-only `merge_tracker_records` allowlist with `plan:blocks` and `plan:days`; it does not reset or drop existing records. Export backups first.

The new schedule/priority mutation controls are available in local mode. Configured Supabase builds default to read-only planning until the build variable `NEXT_PUBLIC_DAILY_PLAN_ENABLED=true` is enabled. Keep it unset while applying and verifying the migration. Validate two signed-in accounts and two devices: private blocks/priorities, concurrent different-block edits, same-block timestamp resolution, deletion/undo across devices, offline retry, sign-out/account switching and export/import. Verify legacy timetable projection and owner-only 600/240-minute budgets. Then rebuild with the flag enabled. These checks are pending; no production migration or account/device QA was performed by this release.

Rollback: unset the planning flag and redeploy the previously verified revision. Retain `plan:blocks`, `plan:days`, their account-prefixed browser caches and migration 0009; never delete records to remove a UI. Full backup validation rejects malformed dates, zones, durations and mismatched planning IDs before any write.
