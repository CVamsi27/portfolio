# Release gates — evidence and rollback record

Three sequential gates: production baseline/schema, authenticated sync, push delivery. The approved design is in `docs/superpowers/specs/2026-10-19-release-gates-design.md`; the execution plan is `docs/superpowers/plans/2026-10-19-release-gates.md`.

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
