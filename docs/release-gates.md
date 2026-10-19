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
