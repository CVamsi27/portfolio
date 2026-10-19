# Release gates — authenticated sync, push delivery, production deployment

> Approved 19 October 2026. Three sequential release gates. Each gate ends with recorded evidence, a rollback path and a stop/report checkpoint. The unified UI/UX redesign is already merged and live; this spec does not reopen its design.

## Context

The redesign merged into `main` at `e6ec58b` and was verified by CI (`406 passed / 0 failed / 0 flaky`). Vercel's Git integration auto-deployed `main`; the live portfolio currently serves the redesign, including `/work/docita` and the new sitemap. Production Google sign-in is configured and the personal host redirects anonymous visitors to `/login`.

Three release gates remain. They were never exercised by the local-mode browser suite.

### Findings from the 19 October production sweep

- **Schema drift.** The linked production Supabase project (`ejbghgpatpfubxltkpde`, "Buildora") has migrations `0001–0005` applied. `0006–0014` are pending. In particular, `0007` adds `merge_tracker_records` and `0008` adds the push tables. Record-shaped stores (`nutrition:*`, `routine:*`, `recovery:*`, `habits:*`, `plan:*`) therefore cannot sync in production today; plain-key stores still use `tracker_data` upserts.
- **Push is implemented but inactive.** The subscription API, dispatcher, service worker, migration and VAPID generator already exist. There are no VAPID or `CRON_SECRET` values, no scheduler, and no real-device delivery evidence.
- **Canonical host mismatch.** `https://buildora.work/*` 307-redirects to `https://www.buildora.work/*`, but `metadataBase`, Open Graph URLs, JSON-LD and the sitemap emit `https://buildora.work`. Canonical and sitemap URLs therefore point at redirects.
- **Robots has no sitemap declaration.** The live `robots.txt` is Cloudflare-managed content and contains no `Sitemap:` line. There is no app `robots.ts`.
- **No baseline security headers.** The live portfolio returns HSTS but not `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` or `Permissions-Policy`.
- **Known local-store hazard.** `readLocal` in `use-synced-storage.ts` caches a reader's `initial` default when storage is empty. A second reader with a different `initial` receives the first reader's cached default. This can silently present or write the wrong default shape. It is in scope because the sync gate is the right time to prove local/cloud parity.

## Goals

1. Bring the production database to the repository's migration head safely, with a verified backup, a dry-run and an exact readback.
2. Prove authenticated cloud sync for two separate accounts: RLS isolation, merge semantics, tombstones, offline retry, account switching, export/import and no legacy-key attachment.
3. Activate web push and prove one real delivery each on macOS Chrome/Safari and Android Chrome while the site is closed.
4. Align production metadata (canonical origin, robots sitemap, baseline security headers) with what is actually served.
5. Leave a reproducible evidence record and a rollback path for every gate.

## Non-goals

- Health Connect phone pairing or lifecycle operations.
- Enabling `NEXT_PUBLIC_DAILY_PLAN_ENABLED`, `NEXT_PUBLIC_NUTRITION_PROGRAM_ENABLED` or `NEXT_PUBLIC_NUTRITION_REUSE_ENABLED`.
- iOS/iPadOS push proof (no device available in this pass).
- The native Android app, background Health Connect sync or release signing.
- Migrating older unassigned `vk:<key>` browser records into an account.
- A Content Security Policy. Next.js inline scripts make CSP a separate project; only the four low-risk headers above are added.
- Reopening the public portfolio or NOVA visual design.
- Changing DNS, the apex→www redirect, or the Vercel project setup.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Migration set | Apply all pending `0006–0014` | Additive schema; brings production to head; feature flags stay off so UI activation is separate. |
| Push scheduler | Supabase `pg_cron` + `pg_net` | No new platform, free, per-minute capable, and the per-minute activity also prevents free-tier project pause. Fallback: Cloudflare Worker cron if the extensions are unavailable. |
| Sync verification | Ephemeral admin-created users over REST plus one manual Google check | Proves RLS/merge without touching the two real accounts; the manual check covers the actual OAuth path. |
| Production access | Hybrid | Agent runs backups, migrations and verification; the owner enters secrets, approves production mutations and performs Google/device checks. |
| Canonical host | `https://www.buildora.work` | Matches the live redirect; preserves existing indexing. The apex remains a redirect. |
| Sequencing | Gate A → Gate B → Gate C | B and C depend on the schema and production configuration released in A. |

## Architecture

### Gate A — production baseline, schema and deployment integrity

1. Capture the deployed SHA, live route matrix, migration list, table row counts and storage object count. Write the evidence to `docs/release-gates.md`; binary dumps and exports live under `artifacts/release/<date>/` (gitignored).
2. Back up `public` schema and data with the linked Supabase CLI. If the CLI cannot dump without the database password, the owner supplies it interactively. Export `tracker_data` and `shared_drops` as JSON through the service role and hash every artifact.
3. Dry-run `supabase db push --linked`, confirm the exact `0006–0014` list, then apply. Verify the remote migration list, the RPCs (`merge_tracker_records`, `claim_routine_push`), the new tables and RLS. Stop at the first error; do not reset tables.
4. Make deployment output match deployment reality:
   - one `PORTFOLIO_ORIGIN` constant (`https://www.buildora.work`) used by `metadataBase`, Open Graph, JSON-LD and the sitemap;
   - `src/app/robots.ts` declaring the sitemap (with a Cloudflare operator fallback if managed robots overrides it);
   - four baseline headers in `next.config.mjs`.
5. Add `scripts/release-smoke.mjs` and `pnpm release:smoke` to assert the public contract against a deployed base URL. Run it before the fixes to record the failures, then after the deploy to prove them fixed.
6. Record the previous Vercel deployment for promotion and the additive-schema rollback rule.

**Acceptance:** remote migration list ends at `0014`; backup artifacts are non-empty with recorded hashes; `release:smoke` passes against production (or a documented Cloudflare exception); CI green on the deployed SHA; no feature flag changed.

### Gate B — authenticated cloud sync

1. Fix the default-cache leak: cache parsed values only when a raw value exists. A missing key must always return the caller's own `initial`. Add focused unit tests and a testing reset hook.
2. Add `scripts/verify-cloud-sync.mjs` (`pnpm verify:cloud-sync`):
   - refuses to run without `ALLOW_PROD_SYNC_VERIFY=1` and a matching project ref;
   - creates two ephemeral users via the admin API, signs both in with the publishable key;
   - proves RLS read/update/insert isolation in both directions;
   - proves owner-only merge, newer-timestamp wins, equal-timestamp tombstone wins, and every record-mode key accepted (`nutrition:*`, `routine:schedules`, `routine:history`, `recovery:entries`, `habits:items`, `habits:history`, `plan:blocks`, `plan:days`);
   - deletes both users and all probe rows in a `finally` block and verifies no residue.
3. Run the harness against production after Gate A. Any RLS or merge failure stops the gate.
4. Manual two-account check on two browser profiles/devices: cross-device write, focus/reload pull, offline write retry, deletion/undo, account switching, export/import, legacy-key non-attachment. The owner signs in; the agent records evidence.
5. Deploy the cache fix, wait for CI and Vercel, rerun the smoke check, and record the sync evidence and limits.

**Acceptance:** harness exits 0 with a redacted summary; manual checklist complete for both approved accounts; no probe rows or users remain; cache unit tests and full CI green; live deployment serves the fix.

### Gate C — push delivery

1. Generate VAPID keys with the existing script. The owner stores `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `CRON_SECRET` in Vercel Production, confirms the Supabase server key, and redeploys. Secrets never enter the repository or transcript.
2. Enable `pg_cron` and `pg_net`. Store the cron bearer in Supabase Vault. Install a per-minute `cron.schedule` job that calls `https://personal.buildora.work/api/push/dispatch` with the Vault secret. Verify `cron.job`, `cron.job_run_details` and a 200 in `net._http_response`.
3. The owner enables notifications in Routine reminders on macOS Chrome/Safari and Android Chrome, confirms the subscription rows, schedules a due reminder roughly two minutes ahead, closes the site, and confirms one notification per device. Clicking opens `/routine`. Verify generic vs detailed text, no duplicate delivery, snooze/skip/undo, denied permission and disabled-device behaviour.
4. Record evidence with timestamps and screenshots; document rollback: unschedule the job, remove the push env values, redeploy, retain tables and subscriptions.

**Acceptance:** `/api/push/config` returns a public key for a signed-in approved account; the cron job runs every minute with HTTP 200; one notification is delivered and opens the correct destination on both available devices; no duplicate; failure paths are recorded; rollback is documented.

## Error handling and rollback

| Gate | Failure | Response |
| --- | --- | --- |
| A | Backup missing or empty | Stop; do not push migrations. |
| A | Migration error | Stop immediately. Do not reset. Additive migrations already applied remain; diagnose with the backup and migration output. |
| A | Smoke failure after deploy | Promote the previous Vercel deployment (`7170638613`, `e6c387b`); the schema is additive and remains. |
| B | RLS or merge assertion fails | Stop; no production data changes beyond the ephemeral probe users, which the `finally` block deletes. |
| B | Real-account check fails | Stop; record the failing path; do not claim sync. |
| C | Scheduler extension unavailable | Use the documented Cloudflare Worker fallback; do not claim delivery until it runs. |
| C | Cron gets 401/403 | Compare the Vercel `CRON_SECRET` and Vault value; rotate both together. |
| C | Notification not delivered | Stop; keep push opt-in disabled; record the provider/device evidence. |

No gate drops tables, deletes user rows, resets storage, rotates the Supabase keys or changes the two-account allowlist.

## Verification and evidence

- **Code gates:** focused unit tests, TypeScript, ESLint, production build, full Playwright suite, CI on the pushed SHA.
- **Production gates:** `pnpm release:smoke`, `pnpm verify:cloud-sync`, `cron.job_run_details`, `net._http_response`, subscription-row checks, real-device screenshots.
- **Evidence:** `docs/release-gates.md` records commands, timestamps, deployment IDs, row counts, hashes (not secrets) and the manual checklist. Large artifacts stay under `artifacts/release/<date>/` (gitignored).
- **Claims:** authenticated sync, push delivery and deployment are claimed only after their gate evidence exists. iOS push and Health Connect remain explicitly unverified.

## Risks and limits

- Production migrations are the highest-risk step; backup, dry-run, additive SQL and stop-on-error mitigate it.
- Supabase free-tier limits and project pause; per-minute cron keeps the project active but adds function invocations.
- Cloudflare may challenge or override server-to-server cron requests and managed `robots.txt`; both have documented operator fallbacks.
- Real Google and device checks depend on the owner's participation; the plan marks them as operator steps, not agent-verifiable.
- The sync harness creates temporary auth users in production; it is guarded, cleans up and never touches the two real accounts' data.
- Push delivery timing depends on the browser push service; a one-to-two-minute window is expected and must be recorded, not hidden.

## Spec self-review

- No placeholders, TBDs or unresolved decisions.
- Migration set, scheduler, verification method, access model and canonical host are consistent across sections.
- Scope is three release gates; deferred features are explicit non-goals.
- Every acceptance criterion has an evidence path; operator-only steps are labelled.
