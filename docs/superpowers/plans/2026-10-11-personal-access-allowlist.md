# Personal Access Allowlist Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan inline, task by task.

**Goal:** Restrict personal.buildora.work to the two approved Google accounts.

**Architecture:** A shared policy normalizes exact emails and validates Google
identities. Supabase SSR request authentication verifies cookies or bearer tokens;
Next proxy gates pages and APIs. A PKCE route completes sign-in before the gate.

**Tech Stack:** Next 16, TypeScript, Supabase SSR, Node test, Playwright.

## Global constraints

- Approved emails: cvamsik99@gmail.com and srija210v@gmail.com.
- Public portfolio and localhost remain usable.
- Authentication/configuration failures deny deployed personal access.
- Preserve existing data, Android pairing and cron credential boundaries.

### Task 1: Server policy and request boundary

Files: src/lib/personal-access.ts, src/lib/supabase/request.ts, src/proxy.ts,
src/lib/personal-access.test.ts, src/lib/personal-access-server.test.ts.

- [x] Write failing policy and real proxy tests: anonymous pages redirect to login,
  production APIs return 401, rejected identities return 403, confirmed Google
  emails pass, forged cookie user data cannot authorize, and public/local routing
  remains available. Use a local GoTrue HTTP fixture for external authentication.
- [x] Run `node --experimental-strip-types --test src/lib/personal-access*.test.ts`.
- [x] Implement exact host/email policy, SSR getUser validation, cookie propagation,
  safe return paths, no-store responses, API bearer validation and closed failures.
- [x] Rerun tests; assert refresh cookies survive both next and redirect responses.

### Task 2: Sign-in and machine credentials

Files: src/app/auth/callback/route.ts, src/app/login/page.tsx, src/app/layout.tsx,
src/components/auth/PersonalAccessGate.tsx, src/components/trackers/PersonalShell.tsx,
src/lib/health-connect-server.ts. The proxy covers nutrition and other personal
APIs without duplicating their authorization helpers.

- [x] Add failing callback tests for allowed, denied, missing/invalid code and unsafe
  return paths; verify cookies are exchanged with the real SSR client fixture.
- [x] Implement callback code exchange and server validation, clearing denied
  sessions; update OAuth redirectTo to `/auth/callback?next=<encoded path>`.
- [x] Show access denied and retry sign-in; client gate requires an allowed Google
  account on personal host and allows login. Keep local-only login available locally.
- [x] Enforce the same identity policy at the API boundary, health-owner helper and
  device RPC owners. Login does not mount saved focus/bedtime UI or reminders.
- [x] Rerun server tests and type checking.

### Task 3: Cache, documentation and release verification

Files: public/sw.js, scripts/personal-service-worker.test.mjs, README.md,
docs/NOVA_CHANGE_SHEET.md, e2e/personal-access.spec.ts.

- [x] Write failing service-worker tests executing the real worker in a VM: personal
  navigation uses network without cache fallback; activation deletes old caches;
  localhost still serves its offline shell.
- [x] Disable personal host HTML caching and purge old caches; update release docs
  with the exact callback URL and protected sharing behavior.
- [x] Run focused tests, lint, TypeScript, production build, and focused Playwright
  access/public-host/login regressions. Record any unrelated failures precisely.
- [x] Inspect deployment credentials and callback configuration. Preserve all
  existing callbacks while adding personal and local PKCE callback URLs.

Publication acceptance: publish through the existing Git-connected production
deployment and verify anonymous root/deep pages redirect to login and personal
APIs deny access. The completion message records that live verification. Actual
interactive Google sign-in requires the account holder; local tests use a GoTrue
HTTP fixture and the real Supabase SSR client, not a live user session.

## Verification before publication

- 21 policy/server/callback/device tests and 3 service-worker tests passed.
- The complete Playwright suite passed: 320 tests, zero failures/skips.
- ESLint, TypeScript, production build and git diff whitespace checks passed.
- Supabase callback additions were applied and read back; existing study and
  development callbacks were preserved. Google is enabled and signup is open.
- The existing owner account was confirmed to have a verified matching Google
  identity. No interactive live Google session was created or impersonated.
