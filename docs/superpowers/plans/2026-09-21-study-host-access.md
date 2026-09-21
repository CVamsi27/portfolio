# Study Buildora Host Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Deploy the `software-developer-bible` Jekyll site at `study.buildora.work` behind a server-checked Google OAuth gate that permits only `cvamsik99@gmail.com` and redirects other signed-in accounts to the personal host.

**Architecture:** Keep Jekyll responsible for static study content and use Cloudflare Pages Functions as the request boundary. The middleware validates an HttpOnly Supabase access-token cookie through the Supabase Auth user endpoint before allowing any study HTML or content asset; a small unauthenticated auth surface handles Google OAuth and exchanges the returned token for the cookie.

**Tech Stack:** Jekyll/Minima, Cloudflare Pages Functions, native Fetch/Web APIs, Supabase Auth Google OAuth, Node `node:test` for policy tests.

## Global Constraints

- The study repository remains a static Jekyll/Cloudflare Pages deployment.
- A browser-only gate is not acceptable because direct static-file requests must be blocked.
- Only the case-insensitive email `cvamsik99@gmail.com` is allowed.
- Non-allowlisted signed-in users redirect to `https://personal.buildora.work/?study=access-denied`.
- Missing/invalid sessions fail closed and never serve study content.
- Supabase and Cloudflare credentials are deployment variables, never committed secrets.
- Existing Jekyll private-lane exclusion and publish-safety checks must remain green.

---

### Task 1: Add pure study-access policy tests

**Repository:** `software-developer-bible`

**Files:**
- Create: `functions/_lib/study-access.mjs`
- Create: `functions/_lib/study-access.test.mjs`

**Interfaces:**
- `normalizeEmail(value: unknown): string`
- `isAllowedStudyEmail(value: unknown): boolean`
- `safeNextPath(value: unknown): string`
- `accessDeniedRedirect(): Response`

- [ ] **Step 1: Write the failing tests.**

Use Node’s built-in test runner:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedStudyEmail, normalizeEmail, safeNextPath } from "./study-access.mjs";

test("normalizes email and allows only the exact study account", () => {
  assert.equal(normalizeEmail(" CVamsik99@GMAIL.COM "), "cvamsik99@gmail.com");
  assert.equal(isAllowedStudyEmail("cvamsik99@gmail.com"), true);
  assert.equal(isAllowedStudyEmail("other@gmail.com"), false);
  assert.equal(isAllowedStudyEmail(undefined), false);
});

test("accepts only same-origin relative next paths", () => {
  assert.equal(safeNextPath("/20-backend/INDEX.html"), "/20-backend/INDEX.html");
  assert.equal(safeNextPath("https://evil.example"), "/");
  assert.equal(safeNextPath("//evil.example"), "/");
  assert.equal(safeNextPath(""), "/");
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run:

```bash
node --test functions/_lib/study-access.test.mjs
```

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement the policy module.**

Normalize strings with trim/lowercase, compare against the exact constant `cvamsik99@gmail.com`, and accept only paths beginning with one `/` and not `//`.

- [ ] **Step 4: Run the policy tests.**

```bash
node --test functions/_lib/study-access.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the policy contract.**

```bash
git add functions/_lib/study-access.mjs functions/_lib/study-access.test.mjs
git commit -m "test(study): define the email access policy"
```

### Task 2: Add the Cloudflare Pages middleware boundary

**Repository:** `software-developer-bible`

**Files:**
- Create: `functions/_middleware.ts`
- Modify: `wrangler.toml`

**Interfaces:**
- Cloudflare handler receives `env.SUPABASE_URL` and `env.SUPABASE_ANON_KEY`.
- Middleware calls `next()` only after a valid allowlisted session check.

- [ ] **Step 1: Add the middleware failure tests.**

Extend `functions/_lib/study-access.test.mjs` with request-path assertions for the public auth paths:

```js
test("auth bootstrap paths are the only unauthenticated paths", () => {
  const allowed = ["/auth/login.html", "/auth/callback.html", "/auth/start", "/auth/session", "/auth/logout", "/favicon.svg"];
  assert.deepEqual(allowed.every((path) => isPublicAuthPath(path)), true);
  assert.equal(isPublicAuthPath("/"), false);
  assert.equal(isPublicAuthPath("/20-backend/INDEX.html"), false);
});
```

Export `isPublicAuthPath(path: string): boolean` from the policy module so the middleware and tests share the same allowlist.

- [ ] **Step 2: Implement the middleware.**

For each request:

1. allow the explicit auth bootstrap paths;
2. read `study_access_token` from the Cookie header;
3. if missing, redirect to `/auth/login.html?next=<encoded relative path>`;
4. call `${SUPABASE_URL}/auth/v1/user` with `apikey` and bearer authorization;
5. if the returned user email is allowed, call `next()` and add `Cache-Control: private, no-store`;
6. if the user is valid but not allowed, clear the cookie and return the personal-host redirect;
7. if validation fails, clear the cookie and redirect to the study login page.

Never log the access token or the returned user payload.

- [ ] **Step 3: Declare the environment contract.**

Add comments to `wrangler.toml` documenting the required variables without values:

```toml
[vars]
# SUPABASE_URL and SUPABASE_ANON_KEY are set in Cloudflare Pages.
```

Do not put real values in the repository.

- [ ] **Step 4: Run policy tests and type/build checks.**

```bash
node --test functions/_lib/study-access.test.mjs
bundle exec jekyll build --trace
```

Expected: policy tests pass and the existing Jekyll build remains green.

- [ ] **Step 5: Commit the middleware boundary.**

```bash
git add functions/_lib/study-access.mjs functions/_lib/study-access.test.mjs functions/_middleware.ts wrangler.toml
git commit -m "feat(study): protect pages with a Supabase session gate"
```

### Task 3: Implement Google OAuth start, callback, session exchange, and logout

**Repository:** `software-developer-bible`

**Files:**
- Create: `functions/auth/start.ts`
- Create: `functions/auth/session.ts`
- Create: `functions/auth/logout.ts`
- Create: `auth/login.html`
- Create: `auth/callback.html`

**Interfaces:**
- `GET /auth/start?next=/path` redirects to Supabase Google authorization.
- `POST /auth/session` accepts `{ access_token: string }` and returns `{ ok: true, next: string }` for the allowed email or `{ ok: false, reason: "not-allowed" }` otherwise.
- `GET /auth/logout` clears `study_access_token` and redirects to `/auth/login.html`.

- [ ] **Step 1: Add session endpoint tests with mocked Supabase responses.**

Use a small request harness around the handler or extract `validateStudyToken(fetcher, token, env)` into `functions/_lib/supabase-session.mjs`. Test allowed email, non-allowed email, missing token, malformed JSON, and Supabase non-200 responses.

- [ ] **Step 2: Implement `/auth/start`.**

Validate `next` with `safeNextPath`, construct a callback URL of the form `/auth/callback.html?next=<encoded path>`, and redirect to `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=<encoded callback>`. Do not accept arbitrary redirect URLs.

- [ ] **Step 3: Implement `/auth/session`.**

Parse JSON, require a non-empty access token, validate it via `GET ${SUPABASE_URL}/auth/v1/user`, compare the returned email with `isAllowedStudyEmail`, and set:

```text
Set-Cookie: study_access_token=<token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
```

Return no-store JSON. For a non-allowlisted email, send an expired cookie and `{ "ok": false, "reason": "not-allowed" }`.

- [ ] **Step 4: Implement the login and callback pages.**

`auth/login.html` is self-contained with inline CSS and one Google button linking to `/auth/start`. It reads the safe `next` query parameter and preserves it in the start URL. `auth/callback.html` reads `access_token` from the URL hash, posts it to `/auth/session`, clears the hash with `history.replaceState`, and redirects either to the requested path or `https://personal.buildora.work/?study=access-denied`.

The callback never renders the token and never stores it in localStorage.

- [ ] **Step 5: Implement logout.**

Return an expired `study_access_token` cookie and a 302 to `/auth/login.html`. Keep the endpoint public so an allowed user can invoke it even when the static page shell has no custom logout control yet.

- [ ] **Step 6: Run unit/build checks.**

```bash
node --test functions/_lib/*.test.mjs
bundle exec jekyll build --trace
```

Expected: all access tests pass and the static site still builds.

- [ ] **Step 7: Commit the OAuth slice.**

```bash
git add functions/auth auth/login.html auth/callback.html functions/_lib
git commit -m "feat(study): add Google OAuth session exchange"
```

### Task 4: Add the study favicon and deployment documentation

**Repository:** `software-developer-bible`

**Files:**
- Create: `favicon.svg`
- Create: `_includes/head-custom.html`
- Modify: `docs/deployment.md`
- Modify: `README.md`

- [ ] **Step 1: Add the study favicon.**

Create a square SVG using the simple Buildora `B` geometry with a small cyan/lime study accent. Keep it local to the study repo. `_includes/head-custom.html` adds `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`.

- [ ] **Step 2: Document Cloudflare variables and auth setup.**

Add a deployment section covering `SUPABASE_URL`, `SUPABASE_ANON_KEY`, the Google provider callback URL, Pages Functions deployment, and the required `study.buildora.work` custom domain. State that the GitHub source remains governed by repository visibility and that the Pages middleware protects the deployed site.

- [ ] **Step 3: Add static checks for auth files and private output.**

Extend the existing deployment workflow or its script so it asserts `auth/login.html`, `auth/callback.html`, and `favicon.svg` are present while the existing private-lane exclusion assertions remain active.

- [ ] **Step 4: Run the repository checks.**

```bash
bundle exec jekyll build --trace
node --test functions/_lib/*.test.mjs
git diff --check
```

- [ ] **Step 5: Commit the study UX/docs slice.**

```bash
git add favicon.svg _includes/head-custom.html docs/deployment.md README.md .github/workflows
git commit -m "docs(study): document protected Pages deployment"
```

### Task 5: Verify the deployed study access boundary

**Repository:** `software-developer-bible`

**Files:**
- Verify: deployed `study.buildora.work` and Cloudflare Pages configuration

- [ ] **Step 1: Configure Cloudflare Pages variables outside git.**

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the Pages project for preview and production environments. Configure Google OAuth’s allowed callback URL as `https://study.buildora.work/auth/callback.html`.

- [ ] **Step 2: Verify unauthenticated content is blocked.**

```bash
curl -sSI https://study.buildora.work/
curl -sSI https://study.buildora.work/20-backend/INDEX.html
```

Expected: both responses redirect to `/auth/login.html` and do not return study HTML.

- [ ] **Step 3: Verify favicon and auth bootstrap assets.**

```bash
curl -fsSI https://study.buildora.work/favicon.svg
curl -fsSI https://study.buildora.work/auth/login.html
curl -fsSI https://study.buildora.work/auth/callback.html
```

Expected: HTTP 200 responses.

- [ ] **Step 4: Verify both Google identity outcomes manually.**

Sign in with `cvamsik99@gmail.com` and confirm the requested study path loads. Sign in with a different Google account and confirm the browser lands on `https://personal.buildora.work/?study=access-denied` without exposing the study page.

- [ ] **Step 5: Commit deployment documentation or configuration corrections separately.**

```bash
git add docs/deployment.md README.md .github/workflows
git commit -m "ci(study): verify protected Pages release"
```

