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
