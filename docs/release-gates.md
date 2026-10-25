# Release gates — evidence and rollback record

Three sequential gates: production baseline/schema, authenticated sync, notification delivery. Gate C now uses Telegram routine delivery instead of web push. The approved design is in `docs/superpowers/specs/2026-10-19-release-gates-design.md`; the execution plan is `docs/superpowers/plans/2026-10-19-release-gates.md`.

Secrets, database connection strings and user rows are never recorded here. Raw backup artifacts stay under the gitignored `artifacts/release/2026-10-19/` directory.

## Current state at Gate A start

| Item | Value |
| --- | --- |
| Repository | `main` |
| Baseline production SHA | `e6c387b` |
| Baseline Vercel deployment | `7170638613` |
| Production Supabase project | `ejbghgpatpfubxltkpde` |
| Remote migrations at start | `0001–0005` |
| Pending migrations | `0006–0014` |
| Gate plan commit | `e111a2f` (docs only) |

### Known findings

- The apex `https://buildora.work` redirects 307 to `https://www.buildora.work`, while canonical metadata, Open Graph URLs, JSON-LD and the sitemap still emit the apex.
- Live `robots.txt` is Cloudflare-managed and has no `Sitemap:` directive.
- Live responses carry HSTS but no `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` or `Permissions-Policy`.
- `merge_tracker_records` and the push tables do not exist in production until `0006–0014` are applied.
- Record-shaped local storage can leak one reader's default to another reader when the key is absent.

## Gate A baseline smoke (19 October 2026)

Command:

```bash
pnpm release:smoke
```

Output against `e6c387b` / `www.buildora.work`:

```text
ok   root status 200
ok   root renders the portfolio
ok   case study docita
ok   case study senior-full-stack-bible
ok   case study teamops
ok   case study super-tic-tac-toe
ok   case study digital-library
ok   case study task-manager
ok   case study portfolio
ok   sitemap status 200
ok   sitemap has 8 URLs
FAIL sitemap uses the www origin — https://buildora.work/
ok   robots status 200
FAIL robots declares the sitemap — Sitemap directive missing
ok   manifest status 200
FAIL header x-content-type-options — missing
FAIL header referrer-policy — missing
FAIL header x-frame-options — missing
FAIL header permissions-policy disables camera — missing
ok   apex redirects to www
ok   personal hub redirects to login
ok   personal login status 200

6 release smoke check(s) failed.
```

The six failures are the Gate A deployment-integrity work; no route or auth regression was observed.

## Gate A backup (19 October 2026)

Command:

```bash
supabase db dump --linked --schema public -f artifacts/release/2026-10-19/public-schema.sql
supabase db dump --linked --schema public --data-only --use-copy -f artifacts/release/2026-10-19/public-data.sql
```

Readback:

| Artifact | Value |
| --- | --- |
| Application tables in dump | 2 (`shared_drops`, `tracker_data`) |
| `tracker_data` rows | 17 |
| `shared_drops` rows | 0 |
| Storage | 1 bucket, 1 object, metadata size 0 |
| Schema dump | `bd8a2d4f4c99f56c08a974fc5aa1c9458ddf3b4e4366524fcd0ee2bfacef1609` |
| Data dump | `a530db054e7889d1e86d7913671a1a02efc065a6792ae59e02211b575857edf2` |
| `tracker_data` key export | `c60be82fb8e788f4c74d2b23175ae438b471603514c6bf84a61045257e7335f3` |
| `shared_drops` ID export | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` |

The dumps and JSON exports are under the gitignored `artifacts/release/2026-10-19/` directory. `git check-ignore` confirmed the release directory cannot be staged.

The dump uses quoted identifiers (`"public"."tracker_data"`), not unquoted names; the verification grep in the plan was corrected to match the real format. No migration has been applied.

## Gate A progress — stopped after backup

| Item | Result |
| --- | --- |
| Plan commit pushed | `e111a2f` |
| Production deployment for plan commit | `7175830284` — success |
| CI for plan commit | `39264957612` — success (7m22s) |
| Baseline smoke | 6 expected failures (sitemap origin, robots sitemap, four headers) |
| Backup | Complete; 17 `tracker_data` rows, 0 `shared_drops` rows |
| Backup permissions | Directory `700`, files `600`; path gitignored |
| Local Gate A commits | `334edd2` (smoke verifier), `5a28aed` (backup record) — not pushed |
| Migrations applied | None; awaiting approval for Task A3 |

Gate A stops here. Applying `0006–0014` requires explicit owner approval.

## Gate A result (19 October 2026)

Status: **closed — awaiting owner acknowledgement before Gate B.**

| Item | Result |
| --- | --- |
| Deployed SHA | `bff1525` |
| Vercel production deployment | `7176695252` — success |
| CI | `39270398340` — success (4m58s) |
| Local full suite | 409 passed, 0 failed |
| Migrations | `0006–0014` applied; remote list ends at `0014` |
| Dry run | matched the same 9 files before push |
| PostgREST surface | `/push_subscriptions`, `/push_deliveries`, `/rpc/merge_tracker_records`, `/rpc/claim_routine_push`, `/health_connect_devices`, `/health_connect_records` all present |
| Production smoke | all 22 checks passed |

Production smoke output:

```text
ok   root status 200
ok   root renders the portfolio
ok   case study docita
ok   case study senior-full-stack-bible
ok   case study teamops
ok   case study super-tic-tac-toe
ok   case study digital-library
ok   case study task-manager
ok   case study portfolio
ok   sitemap status 200
ok   sitemap has 8 URLs
ok   sitemap uses the www origin
ok   robots status 200
ok   robots declares the sitemap
ok   manifest status 200
ok   header x-content-type-options
ok   header referrer-policy
ok   header x-frame-options
ok   header permissions-policy disables camera
ok   apex redirects to www
ok   personal hub redirects to login
ok   personal login status 200
```

Live verification:

- `https://www.buildora.work/` sends `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `x-frame-options: DENY` and `permissions-policy: camera=(), microphone=(), geolocation=()`.
- `https://www.buildora.work/work/docita` emits `<link rel="canonical" href="https://www.buildora.work/work/docita">` and a matching `og:url`.
- The sitemap emits 8 `https://www.buildora.work/` URLs.
- Cloudflare managed robots content is prepended to the app route; the response ends with `Host: https://www.buildora.work` and `Sitemap: https://www.buildora.work/sitemap.xml`. No Cloudflare operator change was required.

Rollback:

- Previous production deployment: `7170638613` (`e6c387b`). Promote it from Vercel if a rollback is needed.
- Schema: `0006–0014` are additive; keep them. Do not downgrade the schema and do not roll back data.
- Backup: `artifacts/release/2026-10-19/` (gitignored, directory `700`, files `600`). Hashes and row counts are recorded above.

Unchanged in this gate: feature flags, Vercel and Supabase secrets, shared-drop rules, auth providers, and routing aliases.

## Cloud sync harness

`scripts/verify-cloud-sync.mjs` creates two ephemeral email/password users, verifies RLS read/write isolation, all 15 record keys' newer-wins/tombstone merge semantics, and owner-only merge, then deletes both users and their rows in `finally`.

It is guarded twice: it refuses to run without `ALLOW_PROD_SYNC_VERIFY=1`, and it refuses unless `EXPECTED_SUPABASE_REF` matches the configured project URL. It never prints emails, user IDs, endpoints or keys.

```bash
ALLOW_PROD_SYNC_VERIFY=1 \
EXPECTED_SUPABASE_REF=ejbghgpatpfubxltkpde \
pnpm verify:cloud-sync
```

## Gate B automated sync verification (20 October 2026)

Command:

```bash
ALLOW_PROD_SYNC_VERIFY=1 \
EXPECTED_SUPABASE_REF=ejbghgpatpfubxltkpde \
pnpm verify:cloud-sync
```

Result: exit 0, 21 checks verified, 2 ephemeral users, 15 record keys.

```text
ok   created two ephemeral users
ok   A writes its own row
ok   B cannot read A's rows
ok   B cannot insert as A
ok   B cannot update A's rows
ok   merge semantics routine:schedules
ok   merge semantics routine:history
ok   merge semantics recovery:entries
ok   merge semantics habits:items
ok   merge semantics habits:history
ok   merge semantics plan:blocks
ok   merge semantics plan:days
ok   merge semantics nutrition:entries
ok   merge semantics nutrition:foods
ok   merge semantics nutrition:recipes
ok   merge semantics nutrition:targets
ok   merge semantics nutrition:programs
ok   merge semantics nutrition:days
ok   merge semantics nutrition:templates
ok   merge semantics nutrition:batches
ok   merge is owner-only
{
  "verified": 21,
  "users": 2,
  "keys": 15
}
cleanup ok: no probe rows remain
```

The first run exposed a harness bug, not a product bug: the project-ref guard expected a dot before the ref, and the generic probe shape did not satisfy the `0014` nutrition validators. The guard now compares the exact hostname, and the harness builds valid minimal shapes for programs, days, templates and batches. No validation was weakened, and the failing run's users were deleted in `finally`.

No emails, user IDs, endpoints or keys are recorded here. The full output is in `artifacts/release/2026-10-19/cloud-sync-harness.txt`.

## Gate B browser sync precheck (21 October 2026)

Before the owner-assisted two-account check, a guarded local precheck exercised the browser sync path with two ephemeral Supabase users: two isolated browser contexts for account A and one context for account B. Result: 14 checks passed, then both users and their rows were deleted.

```text
ok   created two isolated ephemeral users
ok   device A1 writes a task and the cloud row is updated
ok   device A2 pulls the task after reload
ok   device A1 receives A2's rename
ok   device A2 loses the deleted task after reload
ok   offline write stays local and retries online
ok   a second account cannot read A's task
ok   A stores tasks under the account-scoped key only
ok   legacy unscoped todos are not attached to the account
ok   UI sign-out closes the authenticated workspace
ok   switching to B hides A's scoped task
ok   switching back to A restores A's task
ok   exports the account backup
ok   import restores the deleted task on A
ok   imported task reaches the second device
```

The precheck caught a restore/sync gap: imported whole-value keys such as `todos` were restored locally but were not marked pending, and their sync metadata was cleared. A mount-time cloud pull could therefore overwrite the restored data. `applyBackup` now stamps every imported key with a fresh local timestamp and a pending flag, so the next sync wakeup uploads the restore. The three export/import checks above pass after that fix; `e2e/backup-sync-metadata.spec.ts` covers the metadata/pending regression.

The precheck used `localhost`, so it deliberately bypassed the personal-host Google allowlist. It did not replace B4; the owner-assisted result is recorded below.

### B4 result (23 October 2026)

The owner completed the two-account B4 check on the local production build against production Supabase, using two separate Chrome profiles and the two approved Google accounts. Owner-confirmed results:

- Google OAuth sign-in succeeded for both accounts.
- Cross-profile task add, pull and rename passed.
- Offline add, offline reload, reconnect and retry passed.
- Deletion and non-resurrection after reload passed.
- Account switching and account-scoped/legacy-key isolation passed.
- Export/import restoration stayed within the exporting account.
- PWA offline reload passed.

Limit: `localhost` bypassed the personal-host allowlist; the allowlist remains covered by unit tests. Production sign-in on the deployed personal host was not repeated in B5, so this record does not claim deployed-account allowlist evidence. B4 is complete for the local Google OAuth, sync and PWA path. Test task names only were used and were removed as part of the deletion check.

### B5 result — production deployment (23–25 October 2026)

Status: **Gate B closed.**

| Item | Result |
| --- | --- |
| Application code SHA | `f0bca86` |
| Docs-only verification SHA | `e74ee32` |
| CI | `39973697489` — success (5m13s) for `f0bca86`; `40168670297` — success for `e74ee32` |
| Vercel production deployment | `7281367750` for `f0bca86`; `7309498413` for the docs-only `e74ee32` |
| Production host | `https://www.buildora.work` |
| Local gates at final code SHA | `pnpm test:sync` 8 passed; `pnpm test:germany-roadmap` 36 passed; TypeScript and lint passed; full Playwright suite 417 passed |
| Production smoke | all 22 checks passed on 25 October 2026, after the docs-only deployment |
| Cloud sync harness | 21 checks passed; 2 ephemeral users; all 15 record keys; cleanup left no probe rows |
| Deployment integrity | live CSS contains the `f0bca86` dock rules; `/api/telegram/dispatch` returns `401` without a bearer |

Production smoke and the guarded harness were rerun against `https://www.buildora.work` on 25 October 2026 after the docs-only deployment. Later documentation-only commits may auto-deploy, but they do not change the application code identified above.

The first B5 push (`8b22e71`) passed the local suite but CI run `39970466491` failed on a real 320 px dock overflow: Linux fallback fonts made “Health” 45 px wide in a 42 px label box. `5cdc71a` gave the five links equal flex space and added deterministic wide-fallback coverage. A second CI run then exposed the generated `Inter Fallback` size-adjust on the normal 320 px assertion; `f0bca86` removes horizontal dock padding and tightens label tracking below 360 px. Final CI and deployment refer to `f0bca86`.

No production tracker data was deleted or migrated in B5. The separate 178-open-task cleanup decision remains open. Gate C (Telegram routine delivery) remains open: no production Telegram environment, scheduler or scheduled routine message is claimed yet.

Rollback: promote production deployment `7281367750` (`f0bca86`) if the current docs-only deployment ever needs replacing; it is the verified application code for this gate. The Gate A fallback remains `7176883861` (`d72a5e1`). Schema stays at `0014`; do not downgrade it.

## Tracker audit follow-up (22 October 2026)

The paused tracker audit found two misleading cross-page states in the reproduced production view: `/plan` showed “No activities” for a date whose generated timetable was visible on `/hub`, and `/review` called every scheduled day “quiet” because it only counted completed tasks. The local-only fixes now:

- include generated timetable and career blocks in Plan’s day and week agendas while keeping those rows read-only;
- keep the full assignment/guide detail in the existing Job timetable section instead of expanding it inside Plan agenda rows;
- group the Plan week agenda by day and include the same generated blocks;
- report scheduled block counts in Weekly review and reserve “quiet day” for days with no tasks, focus, study or timetable blocks.

Evidence: the reproduced production seed showed 8 Plan agenda rows at both 390 px and 1440 px (previously 0), no horizontal overflow, and Review reported scheduled blocks instead of “quiet day” for scheduled dates. Verification passed: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test:sync` (8), `pnpm test:germany-roadmap` (36), and the full Playwright suite (416 passed). No production data or deployment changed; B4 is complete; the task-cleanup decision remains open.

## Notification channel revision (23 October 2026)

Gate C's VAPID/web-push delivery plan is superseded. Routine reminders now use the existing Telegram bot and private chat; no browser permission or device push subscription is required. Career, weigh-in and focus reminder slots remain in-app, and contact alerts continue to use the same Telegram bot.

The local implementation adds:

- an authenticated `/api/telegram/dispatch` scheduler endpoint using `CRON_SECRET`;
- owner resolution by the configured owner email, with the routine and history rows read only for that account;
- durable per-group delivery claims in the existing `push_deliveries` table, so retries do not duplicate a delivered group;
- a plain-text Telegram message with the IST time, grouped routine labels and `/routine` link;
- a Telegram delivery card in Settings and Routine notifications, replacing the browser push controls.

Implementation commit: `1741c42` (local `main`, not pushed or deployed).

Local verification: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test:telegram` (6 passed), `pnpm test:personal-access` (24 passed), `pnpm test:sync` (8 passed), `pnpm test:germany-roadmap` (36 passed), and the full Playwright suite (417 passed). A standalone local setup message was delivered to the configured private Telegram chat; this proves bot/chat transport only. A read-only production dry run resolved the owner, found one routine row and seven schedules, and computed zero due groups at check time; no message was sent. The locally built route returned `401` without a bearer and `200 {"sent":0,"failed":0}` with a test bearer while no groups were due. No live production scheduler, production environment change or scheduled routine delivery is claimed yet. Gate C still requires configuring the Telegram and cron secrets in production, installing the per-minute scheduler, proving one real scheduled routine message with no duplicate, and exercising retry/rollback. B4 is now complete and no deployment was made at that point.
