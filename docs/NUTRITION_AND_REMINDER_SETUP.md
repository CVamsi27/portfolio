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


## Food and recipe repair — 7 October 2026

Saved foods can now be created without logging a meal using Add saved food. Enter the nutrient label basis, source and known values; leave unknowns blank. Create recipe uses these ingredients and reports a missing selection rather than silently ignoring it. Ingredient quantity starts from the chosen food's declared basis. Log recipe opens portion review with one serving for serving-based batches; quick capture uses the same default. Gram-based recipes retain their declared gram basis. Historical meal snapshots stay unchanged when recipes are edited. Recipe/food sync failures are included in the visible sync status, alongside entries and targets.

FoodData Central normalization now supports supplied kcal values in nutrient IDs 1008, 2048 (Atwater specific) and 2047 (Atwater general), in that order. Invalid/null nutrient rows are ignored; unknowns remain unknown and explicit zero remains zero. This follows [USDA Foundation Foods documentation](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/).

Production GET `/api/nutrition/search?q=rice` returned 503 on 7 October because `USDA_FDC_API_KEY` is not configured. Set this server-only credential in the existing hosting environment, redeploy and verify search while signed in. The repair does not provision a provider account or invent a credential. Search feedback is displayed beside its controls and the draft remains available. A public alternative also returned 503 in a live probe; it was not introduced as a fallback.

Android Health Connect sync requires a native companion and phone permission; Google sign-in to the website cannot grant that access. See the [proposed sync design](superpowers/specs/2026-10-07-android-health-connect-design.md). No live Health Connect connection is claimed by this repair.

## Nutrition workspace and Android companion — 7 October 2026

The food diary now supports a multi-food **Log meal** draft. It is stored in account-scoped IndexedDB and restored after reload. Saving projects all reviewed portions into the existing collection in one local update with stable meal/item IDs. Unknown nutrient values remain unknown. Storage failures are surfaced; a corrupt draft is retained until the user explicitly discards it. The new transactional meal RPC in migration `0010_nutrition_meals.sql` is additive infrastructure; the UI still uses the existing record-sync path. Revision-aware editing, an outbox and legacy cutover remain pending.

Recipes can declare both servings and final cooked weight, edit ingredient quantities, and include private ingredient snapshots without first logging food. Logged meals retain their historical snapshot when a recipe changes. Strategy supports dated manual targets and flexible weekly allocation; the selected weekday's program targets override only calorie/macronutrient references. Day review distinguishes partial, complete, estimated and explicitly confirmed fasting. Later intake edits invalidate an earlier review. Progress shows 7/30/90-day known intake, complete-day averages, gaps and nutrient coverage/contributors. It does not present an adaptive expenditure model or automatic recommendation.

Apply `0012_nutrition_program_records.sql` using the existing migration workflow after account/database backups. This preserves existing collection access while validating programs and day reviews on the server. In configured cloud builds, enable `NEXT_PUBLIC_NUTRITION_PROGRAM_ENABLED=true` only after authenticated ownership, record merging, account-switch, offline retry and restore checks pass. Local mode permits these workflows for verification. Keep the flag unset during rollout; existing program reads remain available.

### Health Connect rollout

The companion project is [android/health-sync](../android/health-sync/README.md). It requests read-only weight, steps and sleep permissions and performs foreground **Sync now**. It retains source and timezone metadata, aggregates steps using Health Connect priorities, and labels sleep duration according to available stages. Its limited-window deletion detection is not a long-history changes-token implementation. No background scheduling is enabled.

Apply `0011_health_connect.sql` with a database backup. The existing Supabase URL and server-only service-role/secret key are required. Pairing/sync endpoints return unavailable errors when storage is not configured. Ensure the reverse proxy supplies trustworthy client-address headers and rate-limits pending pairing requests; application/database limits supplement those controls. Do not put credentials in client builds, URLs or exported backups.

Open **Health → Connections** while signed in, enter the ten-minute pairing code displayed by the phone and explicitly approve read-only imports. Then use Sync now on the phone. The website displays connected devices, last sync and dated imported source records separately from manual logs. Disconnect revokes future uploads and retains historical imports. The device credential is generated locally and encrypted with Android Keystore; only its digest is retained by the server.

Before enabling a production connection, verify the migration with two accounts, revoked/expired credentials, repeated and malformed batches, and an actual phone. Compare weight, prioritized steps and staged/unstaged overnight sleep with Health Connect, deny/revoke permissions, retry offline/partial uploads and disconnect. Building an APK and passing local SQL/browser tests do not satisfy these device/cloud gates. Imported source trends and export/restore/deletion controls are implemented in the final-pass checkpoint below. Background sync and broader change-token coverage remain follow-up work.


## Nutrition final pass — 7 October 2026

Saved food now includes reusable meal templates and prepared recipe batches. Preparation records no consumption; reviewed batch portions update remaining declared grams/servings, and later intake corrections retain batch provenance. Repeating a meal creates independent historical snapshots. Backup validation covers both collections and rejects mismatched keys, invalid yields/portions and malformed batch tags before writing any data.

Apply `0014_nutrition_reuse_records.sql` after `0012_nutrition_program_records.sql` with account/database backups. Configured cloud builds disable template/batch mutations until `NEXT_PUBLIC_NUTRITION_REUSE_ENABLED=true`. Keep the flag unset until two-account ownership, concurrent merging, tombstones, account switching, offline retry and restore checks pass. Unset the flag and redeploy the previous verified revision to roll back UI activation; retain collections and migrations. No production migration or activation was performed in this pass.

Catalog search immediately retrieves saved and downloaded snapshots, supports retrieval aliases such as dahi/curds and dal, and preserves declared gram weights without inventing density conversions. Downloaded records are account-scoped, bounded, dated and explicitly clearable. This cache is supplementary retrieval data, not consumed history. USDA still requires its server-only credential and live coverage validation; aliases do not substitute one food's nutrition for another.

Apply `0013_health_connect_lifecycle.sql` after `0011_health_connect.sql`. Owner-only endpoints export a bounded full archive including tombstones, restore reviewed snapshots and delete imports by date/source/all. Explicit deletion marks existing upstream keys so later phone uploads cannot resurrect them; genuinely new IDs still import. Explicit restore clears the barrier for restored keys. Disconnect and deletion remain separate; manual records are unchanged. Exports above 5,000 records or 20 MB fail visibly rather than truncate. Verify all operations with two live accounts, a phone replay, a new reading after deletion and reviewed restoration before production activation.

Progress → Health offers imported weight, daily steps and sleep trends with one visible source choice per metric. Missing records remain gaps, step aggregates are not added across devices, and overlapping or unbounded sleep sessions require review. These trends remain separate from manual logs. Local API-mocked browser journeys do not establish live phone or cloud readiness.

Still pending: revision-aware meal storage/outbox and legacy cutover, broader validated provider coverage, independently specified/validated guided expenditure coaching and check-ins, reviewed assisted capture, native background/change-token coverage, release signing and real-phone instrumentation.


### Day-review and recent-food consistency

Planned entries are excluded from fasting/complete review controls as well as consumed totals. Changing the diary date or account resets any unconfirmed fasting action. Recent & saved uses the newest valid consumed snapshot per distinct food; repeating it creates a new intake record without linking it to an old prepared batch. Malformed dated intake stays unknown in completeness analysis; null rows cannot crash the diary. No schema change or new configuration is required for these corrections. The preceding full-spec and live-release gates remain open.
