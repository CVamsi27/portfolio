# Release Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release and prove the three production gates: authenticated cloud sync, real push delivery, and a verified production deployment.

**Architecture:** Gate A backs up and migrates the production database, then aligns canonical metadata, robots and security headers with what Vercel actually serves. Gate B fixes the local default-cache leak and proves RLS/merge with two ephemeral Supabase users plus a manual two-account check. Gate C configures VAPID/CRON secrets, installs a Supabase `pg_cron` + `pg_net` dispatcher, and proves delivery on macOS and Android.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase (Postgres, Auth, Realtime, Vault, `pg_cron`, `pg_net`), Vercel, Playwright, Node 22/23, existing `@supabase/supabase-js` and `web-push` dependencies.

## Global Constraints

- No new npm dependencies. `pg_cron` and `pg_net` are database extensions, not packages.
- Preserve `vk:*` keys, record shapes, backup compatibility, share rules, evidence gating and routing aliases. Do not weaken any persistence, security, exam or access assertion.
- Apply only migrations `0006–0014`. They are additive. Never reset tables, drop user data or rotate Supabase keys.
- Keep `NEXT_PUBLIC_DAILY_PLAN_ENABLED`, `NEXT_PUBLIC_NUTRITION_PROGRAM_ENABLED` and `NEXT_PUBLIC_NUTRITION_REUSE_ENABLED` unset.
- Secrets are entered only in Vercel or Supabase. Never commit, print or paste a secret into the transcript.
- Production mutations require the Gate A backup first. Stop and report at the end of each gate.
- Claims must match evidence. iOS push, Health Connect and feature-flagged nutrition/planning activation remain unverified and out of scope.
- Canonical portfolio origin is `https://www.buildora.work`. The apex remains a redirect.
- Run `pnpm lint`, `npx tsc --noEmit` and the affected tests before each push. Full CI must be green on every pushed SHA.

---

## File Structure

**Create**

- `scripts/release-smoke.mjs` — deployed-host contract checks (routes, sitemap, robots, headers, redirects).
- `scripts/verify-cloud-sync.mjs` — guarded ephemeral-user RLS/merge harness.
- `src/lib/site.ts` — one source for portfolio and personal origins.
- `src/lib/site.test.ts` — origin constant invariants.
- `src/lib/local-parse.ts` — pure stored-JSON parser.
- `src/lib/local-parse.test.ts` — default/stored/corrupt value tests.
- `src/app/robots.ts` — app-served robots with sitemap declaration.
- `src/lib/push-server.test.ts` — endpoint and configuration validation tests.
- `supabase/schedules/push-dispatch.sql` — operator-run cron schedule (not a migration).
- `docs/release-gates.md` — evidence, checklists and rollback record.

**Modify**

- `.gitignore` — ignore `/artifacts/release/` so production backups are never staged.
- `package.json` — `release:smoke`, `verify:cloud-sync`, `test:sync`, `test:push` scripts.
- `src/lib/use-synced-storage.ts` — cache parsed values only when storage has a value.
- `src/lib/use-synced-storage.test.ts` — cache isolation regression.
- `src/app/layout.tsx` — metadata and JSON-LD use the shared origin.
- `src/app/sitemap.ts` — shared origin.
- `src/lib/const.ts` — displayed website value uses www.
- `next.config.mjs` — four baseline security headers.
- `e2e/public-case-studies.spec.ts` — sitemap origin, robots, headers, canonical assertions.
- `e2e/public-portfolio.spec.ts` — root Open Graph URL assertion.
- `docs/NUTRITION_AND_REMINDER_SETUP.md` — scheduler, Vault, verification and rollback.
- `README.md` — release status and evidence.

---

## Phase A — production baseline, schema, deployment integrity

### Task A1: Add the production smoke verifier

**Files:**
- Create: `scripts/release-smoke.mjs`
- Modify: `package.json`
- Create: `docs/release-gates.md`

**Interfaces:**
- Consumes: live production URLs.
- Produces: `pnpm release:smoke`, exit code 0 only when the public contract passes.

- [ ] **Step 1: Write the smoke script**

```js
#!/usr/bin/env node
const BASE = process.env.RELEASE_BASE_URL ?? "https://www.buildora.work";
const PERSONAL =
  process.env.RELEASE_PERSONAL_URL ?? "https://personal.buildora.work";
const APEX = process.env.RELEASE_APEX_URL ?? "https://buildora.work";
const ORIGIN = "https://www.buildora.work";
const SLUGS = [
  "docita",
  "senior-full-stack-bible",
  "teamops",
  "super-tic-tac-toe",
  "digital-library",
  "task-manager",
  "portfolio",
];
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`ok   ${name}`);
    return;
  }
  failures.push(name);
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

async function get(url) {
  return fetch(url, { redirect: "manual" });
}

async function main() {
  const root = await get(`${BASE}/`);
  check("root status 200", root.status === 200, String(root.status));
  const rootHtml = await root.text();
  check(
    "root renders the portfolio",
    /Case study|Selected Work/.test(rootHtml),
    "portfolio markers missing",
  );

  for (const slug of SLUGS) {
    const response = await get(`${BASE}/work/${slug}`);
    check(`case study ${slug}`, response.status === 200, String(response.status));
  }

  const sitemap = await get(`${BASE}/sitemap.xml`);
  const sitemapBody = await sitemap.text();
  check("sitemap status 200", sitemap.status === 200, String(sitemap.status));
  const locs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  check("sitemap has 8 URLs", locs.length === 8, String(locs.length));
  check(
    "sitemap uses the www origin",
    locs.every((url) => url.startsWith(`${ORIGIN}/`)),
    locs.find((url) => !url.startsWith(`${ORIGIN}/`)) ?? "",
  );

  const robots = await get(`${BASE}/robots.txt`);
  const robotsBody = await robots.text();
  check("robots status 200", robots.status === 200, String(robots.status));
  check(
    "robots declares the sitemap",
    robotsBody.includes(`Sitemap: ${ORIGIN}/sitemap.xml`),
    "Sitemap directive missing",
  );

  const manifest = await get(`${BASE}/manifest.webmanifest`);
  check("manifest status 200", manifest.status === 200, String(manifest.status));

  for (const [name, expected] of [
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-frame-options", "DENY"],
  ]) {
    const value = root.headers.get(name);
    check(`header ${name}`, value === expected, value ?? "missing");
  }
  const permissions = root.headers.get("permissions-policy") ?? "";
  check(
    "header permissions-policy disables camera",
    permissions.includes("camera=()"),
    permissions || "missing",
  );

  const apex = await get(`${APEX}/`);
  check(
    "apex redirects to www",
    apex.status === 307 && apex.headers.get("location") === `${ORIGIN}/`,
    `${apex.status} ${apex.headers.get("location")}`,
  );

  const hub = await get(`${PERSONAL}/hub`);
  const hubLocation = hub.headers.get("location") ?? "";
  check(
    "personal hub redirects to login",
    hub.status === 307 && hubLocation.startsWith(`${PERSONAL}/login`),
    `${hub.status} ${hubLocation}`,
  );
  const login = await get(`${PERSONAL}/login`);
  check("personal login status 200", login.status === 200, String(login.status));

  if (failures.length) {
    console.error(`\n${failures.length} release smoke check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll release smoke checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Add the package script**

```json
"release:smoke": "node scripts/release-smoke.mjs",
```

- [ ] **Step 3: Run it against current production and record the baseline**

Run:

```bash
pnpm release:smoke
```

Expected: failures for `sitemap uses the www origin`, `robots declares the sitemap`, the three header checks and the permissions-policy check. Root, case studies, manifest, apex redirect and personal redirect pass. Save the exact output in `docs/release-gates.md` under `## Gate A baseline (19 October 2026)`.

- [ ] **Step 4: Commit**

```bash
git add scripts/release-smoke.mjs package.json docs/release-gates.md
git commit -m "test(release): add production smoke verifier"
```

### Task A2: Back up production

**Files:**
- Modify: `docs/release-gates.md`
- Create: `artifacts/release/2026-10-19/` (gitignored)

**Interfaces:**
- Consumes: linked Supabase project `ejbghgpatpfubxltkpde`.
- Produces: schema/data dumps, JSON exports and `SHA256SUMS` for the migration rollback record.

- [ ] **Step 1: Ignore the evidence directory and create it**

Add this line to `.gitignore`:

```gitignore
/artifacts/release/
```

Then create the directory:

```bash
mkdir -p artifacts/release/2026-10-19
git check-ignore artifacts/release/2026-10-19/public-schema.sql
```

Expected: `git check-ignore` prints the path, proving a production dump cannot be staged by accident.

- [ ] **Step 2: Dump the public schema and data**

```bash
supabase db dump --linked --schema public \
  -f artifacts/release/2026-10-19/public-schema.sql
supabase db dump --linked --schema public --data-only --use-copy \
  -f artifacts/release/2026-10-19/public-data.sql
```

If the CLI prompts for the database password, enter it at the prompt. Do not put the password on the command line or in shell history.

- [ ] **Step 3: Verify the dumps are real**

```bash
grep -c "CREATE TABLE" artifacts/release/2026-10-19/public-schema.sql
grep -c "COPY public.tracker_data" artifacts/release/2026-10-19/public-data.sql
```

Expected: at least 5 tables and exactly 1 `tracker_data` copy block. If either dump is empty, stop.

- [ ] **Step 4: Export the two key tables as JSON and record counts**

```bash
set -a; . ./.env; set +a
curl -sS "$SUPABASE_URL/rest/v1/tracker_data?select=key,updated_at" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -o artifacts/release/2026-10-19/tracker_data-keys.json
curl -sS "$SUPABASE_URL/rest/v1/shared_drops?select=id" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -o artifacts/release/2026-10-19/shared_drops-ids.json
node -e "for (const f of ['tracker_data-keys','shared_drops-ids']) { const rows = require('./artifacts/release/2026-10-19/' + f + '.json'); console.log(f, rows.length); }"
```

Record both counts in `docs/release-gates.md`. Do not print keys or rows.

- [ ] **Step 5: Hash the artifacts**

```bash
shasum -a 256 artifacts/release/2026-10-19/public-schema.sql \
  artifacts/release/2026-10-19/public-data.sql \
  artifacts/release/2026-10-19/tracker_data-keys.json \
  artifacts/release/2026-10-19/shared_drops-ids.json \
  | tee artifacts/release/2026-10-19/SHA256SUMS
```

Record the hashes in `docs/release-gates.md`.

- [ ] **Step 6: Commit the evidence note**

```bash
git add .gitignore docs/release-gates.md
git commit -m "docs(release): record the production backup"
```

### Task A3: Apply migrations 0006–0014

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: the verified backup from Task A2.
- Produces: remote schema at `0014`, with `merge_tracker_records` and `claim_routine_push` visible through PostgREST.

- [ ] **Step 1: Dry-run the exact migration list**

```bash
supabase db push --linked --dry-run
```

Expected list, in order: `0006_career_roadmap_atomic_sync.sql`, `0007_merge_tracker_records.sql`, `0008_routine_push.sql`, `0009_day_planning_records.sql`, `0010_nutrition_meals.sql`, `0011_health_connect.sql`, `0012_nutrition_program_records.sql`, `0013_health_connect_lifecycle.sql`, `0014_nutrition_reuse_records.sql`.

If the list differs, stop and report.

- [ ] **Step 2: Apply**

```bash
supabase db push --linked
```

- [ ] **Step 3: Confirm the remote history**

```bash
supabase migration list --linked
```

Expected: `remote` is non-empty for `0001–0014`.

- [ ] **Step 4: Confirm the new surface through PostgREST**

```bash
set -a; . ./.env; set +a
curl -sS "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -o artifacts/release/2026-10-19/openapi.json
node -e "
const spec = require('./artifacts/release/2026-10-19/openapi.json');
const paths = Object.keys(spec.paths);
for (const p of ['/push_subscriptions','/push_deliveries','/rpc/merge_tracker_records','/rpc/claim_routine_push']) {
  if (!paths.includes(p)) throw new Error('missing ' + p);
}
console.log('schema surface ok');
"
```

- [ ] **Step 5: Record the result**

Append the dry-run list, push output, migration list and `schema surface ok` to `docs/release-gates.md`. Do not include connection strings or keys.

- [ ] **Step 6: Commit**

```bash
git add docs/release-gates.md
git commit -m "docs(release): record the production migration"
```

### Task A4: Align the canonical origin to www

**Files:**
- Create: `src/lib/site.ts`
- Create: `src/lib/site.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/lib/const.ts`
- Modify: `e2e/public-case-studies.spec.ts`
- Modify: `e2e/public-portfolio.spec.ts`

**Interfaces:**
- Produces: `PORTFOLIO_ORIGIN = "https://www.buildora.work"` and `PERSONAL_ORIGIN = "https://personal.buildora.work"`, consumed by metadata, JSON-LD and the sitemap.

- [ ] **Step 1: Write the failing origin test**

Create `src/lib/site.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { PORTFOLIO_ORIGIN, PERSONAL_ORIGIN } from "./site.ts";

test("canonical origins match the deployed hosts", () => {
  assert.equal(PORTFOLIO_ORIGIN, "https://www.buildora.work");
  assert.equal(PERSONAL_ORIGIN, "https://personal.buildora.work");
  assert.equal(new URL(PORTFOLIO_ORIGIN).hostname, "www.buildora.work");
});
```

Run:

```bash
node --experimental-strip-types --test src/lib/site.test.ts
```

Expected: FAIL because `src/lib/site.ts` does not exist.

- [ ] **Step 2: Add the constants**

Create `src/lib/site.ts`:

```ts
export const PORTFOLIO_ORIGIN = "https://www.buildora.work";
export const PERSONAL_ORIGIN = "https://personal.buildora.work";
```

- [ ] **Step 3: Replace hardcoded metadata origins**

In `src/app/layout.tsx`, import the constants and use them for `metadataBase`, `openGraph.url`, the Twitter card origin and every JSON-LD `@id`/`url` that currently uses `https://buildora.work` or `https://personal.buildora.work`. Keep the `study.buildora.work` resource links unchanged.

In `src/app/sitemap.ts`, import `PORTFOLIO_ORIGIN` and replace the local `PORTFOLIO_ORIGIN` constant.

In `src/lib/const.ts`, change the displayed website value to `https://www.buildora.work`.

- [ ] **Step 4: Update the production assertions**

In `e2e/public-case-studies.spec.ts`, extend the sitemap test:

```ts
expect(body).toContain("https://www.buildora.work/");
expect(body).not.toMatch(/<loc>https:\/\/buildora\.work\//);
```

Add a canonical metadata test:

```ts
test("case study canonical uses the served www origin", async ({ page }) => {
  await page.goto("/work/docita");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.buildora.work/work/docita",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://www.buildora.work/work/docita",
  );
});
```

In `e2e/public-portfolio.spec.ts`, add:

```ts
await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
  "content",
  "https://www.buildora.work",
);
```

- [ ] **Step 5: Run the checks**

```bash
node --experimental-strip-types --test src/lib/site.test.ts
npx tsc --noEmit
pnpm lint
npx playwright test e2e/public-portfolio.spec.ts e2e/public-case-studies.spec.ts --reporter=line
```

Expected: all pass after the edits.

- [ ] **Step 6: Commit**

```bash
git add src/lib/site.ts src/lib/site.test.ts src/app/layout.tsx src/app/sitemap.ts src/lib/const.ts e2e/public-case-studies.spec.ts e2e/public-portfolio.spec.ts
git commit -m "fix(seo): use the served www origin for canonical metadata"
```

### Task A5: Serve robots with a sitemap declaration

**Files:**
- Create: `src/app/robots.ts`
- Modify: `e2e/public-case-studies.spec.ts`

**Interfaces:**
- Consumes: `PORTFOLIO_ORIGIN`.
- Produces: `/robots.txt` containing `Sitemap: https://www.buildora.work/sitemap.xml`.

- [ ] **Step 1: Add the failing assertion**

In `e2e/public-case-studies.spec.ts`, add:

```ts
test("robots declares the canonical sitemap", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:4111/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(
    "Sitemap: https://www.buildora.work/sitemap.xml",
  );
});
```

- [ ] **Step 2: Run it and confirm the failure**

```bash
npx playwright test e2e/public-case-studies.spec.ts --grep "robots declares" --reporter=line
```

Expected: FAIL because the local build has no `/robots.txt` route (or lacks the line).

- [ ] **Step 3: Add the route**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { PORTFOLIO_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${PORTFOLIO_ORIGIN}/sitemap.xml`,
    host: PORTFOLIO_ORIGIN,
  };
}
```

- [ ] **Step 4: Rebuild and rerun**

```bash
npx playwright test e2e/public-case-studies.spec.ts --reporter=line
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/robots.ts e2e/public-case-studies.spec.ts
git commit -m "feat(seo): declare the sitemap in robots.txt"
```

### Task A6: Add baseline security headers

**Files:**
- Modify: `next.config.mjs`
- Modify: `e2e/public-case-studies.spec.ts`

**Interfaces:**
- Produces: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy` on app responses.

- [ ] **Step 1: Add the failing assertions**

In `e2e/public-case-studies.spec.ts`, add:

```ts
test("portfolio responses carry baseline security headers", async ({
  request,
}) => {
  const response = await request.get("http://127.0.0.1:4111/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["permissions-policy"]).toContain("camera=()");
});
```

- [ ] **Step 2: Run it and confirm the failure**

```bash
npx playwright test e2e/public-case-studies.spec.ts --reporter=line
```

Expected: FAIL on the missing headers.

- [ ] **Step 3: Configure the headers**

Replace `next.config.mjs` with:

```js
/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

Do not add `notifications=()`; the push permission prompt must remain available.

- [ ] **Step 4: Rebuild and rerun**

```bash
npx playwright test e2e/public-case-studies.spec.ts e2e/public-portfolio.spec.ts --reporter=line
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs e2e/public-case-studies.spec.ts
git commit -m "fix(security): add baseline response headers"
```

### Task A7: Deploy and verify Gate A

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: all Gate A commits.
- Produces: a live deployment whose smoke checks pass, plus a rollback reference.

- [ ] **Step 1: Run the local gates**

```bash
npx tsc --noEmit
pnpm lint
npx playwright test --reporter=line
```

Expected: 406 passed (or the current full count), 0 failed.

- [ ] **Step 2: Push and wait for CI and Vercel**

```bash
git push origin main
gh run list --limit 1
```

Wait for the CI run to finish with `success`. Confirm a Vercel production deployment exists for the pushed SHA:

```bash
gh api repos/CVamsi27/portfolio/deployments --jq '.[0] | [.id,.sha[0:7],.environment] | @tsv'
```

- [ ] **Step 3: Run the smoke verifier against production**

```bash
pnpm release:smoke
```

Expected: all checks pass. If `robots declares the sitemap` still fails, Cloudflare's managed `robots.txt` is overriding the app route. In Cloudflare, disable the managed `robots.txt`/content-signals injection for `www.buildora.work` or add `Sitemap: https://www.buildora.work/sitemap.xml` to the managed output, then rerun. Do not weaken the assertion.

- [ ] **Step 4: Record Gate A evidence**

Append to `docs/release-gates.md`:

- deployed SHA and Vercel deployment ID;
- CI run URL/id and result;
- production smoke output;
- remote migration list ending at `0014`;
- backup hashes and row counts;
- rollback deployment (`7170638613`, `e6c387b`) and the rule: promote the previous deployment; keep additive schema; no data rollback;
- any Cloudflare operator change.

- [ ] **Step 5: Commit and wait for the docs CI**

```bash
git add docs/release-gates.md
git commit -m "docs(release): record Gate A evidence"
git push origin main
gh run list --limit 1
```

Expected: docs-only CI success.

- [ ] **Step 6: Stop and report Gate A**

Report: migration result, live smoke result, canonical/robots/headers outcome, rollback reference. Do not start Gate B until the owner acknowledges.

---

## Phase B — authenticated cloud sync

### Task B1: Stop empty-storage defaults from leaking between readers

**Files:**
- Create: `src/lib/local-parse.ts`
- Create: `src/lib/local-parse.test.ts`
- Modify: `src/lib/use-synced-storage.ts`
- Modify: `src/lib/use-synced-storage.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `parseStoredValue(raw, initial)`, `__readLocalForTesting(key, initial)`, `__resetLocalValueCacheForTesting()`.
- Guarantees: a missing key never shares another reader's default.

- [ ] **Step 1: Write the failing parser tests**

Create `src/lib/local-parse.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseStoredValue } from "./local-parse.ts";

test("missing storage returns each caller's own default", () => {
  assert.deepEqual(parseStoredValue(null, { first: true }), { first: true });
  assert.deepEqual(parseStoredValue(null, { second: true }), { second: true });
});

test("stored JSON wins; null and corrupt JSON fall back", () => {
  assert.deepEqual(parseStoredValue('{"stored":true}', { stored: false }), {
    stored: true,
  });
  assert.deepEqual(parseStoredValue("null", { fallback: true }), {
    fallback: true,
  });
  assert.deepEqual(parseStoredValue("{", { fallback: true }), {
    fallback: true,
  });
});
```

Run:

```bash
node --experimental-strip-types --test src/lib/local-parse.test.ts
```

Expected: FAIL because `local-parse.ts` does not exist.

- [ ] **Step 2: Add the pure parser**

Create `src/lib/local-parse.ts`:

```ts
export function parseStoredValue<T>(raw: string | null, initial: T): T {
  if (raw === null) return initial;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? initial : (parsed as T);
  } catch {
    return initial;
  }
}
```

- [ ] **Step 3: Cache only stored values**

In `src/lib/use-synced-storage.ts`:

1. Import `parseStoredValue`.
2. Change `LocalEntry` to `{ raw: string; parsed: unknown }`.
3. Replace `readLocal` with:

```ts
function readLocal<T>(localKey: string, initial: T): T {
  const raw = window.localStorage.getItem(localKey);
  if (raw === null) {
    localCache.delete(localKey);
    return initial;
  }
  const cached = localCache.get(localKey);
  if (cached && cached.raw === raw) return cached.parsed as T;
  const parsed = parseStoredValue(raw, initial);
  localCache.set(localKey, { raw, parsed });
  return parsed;
}

export function __readLocalForTesting<T>(localKey: string, initial: T): T {
  return readLocal(localKey, initial);
}

export function __resetLocalValueCacheForTesting() {
  localCache.clear();
}
```

- [ ] **Step 4: Add the cache regression test**

Append to `src/lib/use-synced-storage.test.ts`:

```ts
test("empty storage never shares a cached default between readers", async (t) => {
  const originalWindow = globalThis.window;
  const store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  };
  const { __readLocalForTesting, __resetLocalValueCacheForTesting } =
    await import("./use-synced-storage.ts");
  __resetLocalValueCacheForTesting();
  t.after(() => {
    __resetLocalValueCacheForTesting();
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  assert.deepEqual(__readLocalForTesting("probe", { first: true }), {
    first: true,
  });
  assert.deepEqual(__readLocalForTesting("probe", { second: true }), {
    second: true,
  });

  store.set("probe", '{"stored":true}');
  assert.deepEqual(__readLocalForTesting("probe", { second: true }), {
    stored: true,
  });
  assert.deepEqual(__readLocalForTesting("probe", { other: true }), {
    stored: true,
  });
});
```

- [ ] **Step 5: Add the test script and run it**

Add to `package.json`:

```json
"test:sync": "node --experimental-strip-types --test src/lib/local-parse.test.ts src/lib/record-merge.test.ts src/lib/use-synced-storage.test.ts",
```

Run:

```bash
pnpm test:sync
npx tsc --noEmit
pnpm lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/local-parse.ts src/lib/local-parse.test.ts src/lib/use-synced-storage.ts src/lib/use-synced-storage.test.ts package.json
git commit -m "fix(sync): never cache a default as another reader's value"
```

### Task B2: Add the guarded cloud-sync harness

**Files:**
- Create: `scripts/verify-cloud-sync.mjs`
- Modify: `package.json`
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, publishable key, service key, `EXPECTED_SUPABASE_REF`, `ALLOW_PROD_SYNC_VERIFY=1`.
- Produces: exit 0 only when RLS isolation, owner-only merge, newer-wins and tombstones pass and cleanup leaves no rows.

- [ ] **Step 1: Write the harness**

```js
#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY;
const service =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const expectedRef = process.env.EXPECTED_SUPABASE_REF;

if (process.env.ALLOW_PROD_SYNC_VERIFY !== "1") {
  console.error("Refusing to run: set ALLOW_PROD_SYNC_VERIFY=1.");
  process.exit(1);
}
if (!url || !anon || !service) {
  console.error("Missing Supabase URL, publishable key or service key.");
  process.exit(1);
}
if (!expectedRef || !url.includes(`.${expectedRef}.supabase.co`)) {
  console.error("EXPECTED_SUPABASE_REF does not match the configured project.");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const recordKeys = [
  "routine:schedules",
  "routine:history",
  "recovery:entries",
  "habits:items",
  "habits:history",
  "plan:blocks",
  "plan:days",
  "nutrition:entries",
  "nutrition:foods",
  "nutrition:recipes",
  "nutrition:targets",
  "nutrition:programs",
  "nutrition:days",
  "nutrition:templates",
  "nutrition:batches",
];
const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const password = randomUUID();
const userIds = [];
let verified = 0;

function pass(name) {
  verified += 1;
  console.log(`ok   ${name}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createUser(label) {
  const email = `release-sync-${suffix}-${label}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userIds.push(data.user.id);
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function cleanup() {
  for (const id of userIds) {
    await admin.from("push_subscriptions").delete().eq("user_id", id);
    await admin.from("tracker_data").delete().eq("user_id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`cleanup user ${id.slice(0, 8)}: ${error.message}`);
  }
}

try {
  const a = await createUser("a");
  const b = await createUser("b");
  pass("created two ephemeral users");

  const { error: insertError } = await a.client.from("tracker_data").upsert(
    {
      user_id: a.id,
      key: "release:probe",
      value: { owner: "a" },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" },
  );
  assert(!insertError, `A could not write its row: ${insertError?.message}`);
  pass("A writes its own row");

  const { data: leaked } = await b.client
    .from("tracker_data")
    .select("key")
    .eq("user_id", a.id);
  assert((leaked ?? []).length === 0, "B can read A's rows");
  pass("B cannot read A's rows");

  const { error: crossInsert } = await b.client.from("tracker_data").insert({
    user_id: a.id,
    key: "release:cross",
    value: {},
    updated_at: new Date().toISOString(),
  });
  assert(Boolean(crossInsert), "B inserted a row owned by A");
  pass("B cannot insert as A");

  const { data: updated } = await b.client
    .from("tracker_data")
    .update({ value: { hacked: true } })
    .eq("user_id", a.id)
    .select();
  assert((updated ?? []).length === 0, "B updated A's row");
  const { data: aRow } = await a.client
    .from("tracker_data")
    .select("value")
    .eq("key", "release:probe")
    .maybeSingle();
  assert(aRow?.value?.owner === "a", "A's row changed");
  pass("B cannot update A's rows");

  for (const key of recordKeys) {
    const id = `probe-${key.replace(/[^a-z]/gi, "-")}`;
    const merge = (records) =>
      a.client.rpc("merge_tracker_records", {
        p_owner: a.id,
        p_key: key,
        p_records: records,
      });

    const first = await merge({ [id]: { updatedAt: 1, label: "older" } });
    assert(
      !first.error && first.data?.[id]?.label === "older",
      `${key}: first merge failed ${first.error?.message ?? ""}`,
    );

    const stale = await merge({ [id]: { updatedAt: 0, label: "stale" } });
    assert(stale.data?.[id]?.label === "older", `${key}: stale merge won`);

    const newer = await merge({ [id]: { updatedAt: 2, label: "newer" } });
    assert(newer.data?.[id]?.label === "newer", `${key}: newer merge lost`);

    const tombstone = await merge({
      [id]: { updatedAt: 2, deleted: true },
    });
    assert(tombstone.data?.[id]?.deleted === true, `${key}: tombstone lost`);

    pass(`merge semantics ${key}`);
  }

  const { error: crossMerge } = await b.client.rpc("merge_tracker_records", {
    p_owner: a.id,
    p_key: "routine:schedules",
    p_records: { probe: { updatedAt: 1 } },
  });
  assert(Boolean(crossMerge), "B merged into A's collection");
  pass("merge is owner-only");

  console.log(
    JSON.stringify({ verified, users: 2, keys: recordKeys.length }, null, 2),
  );
} finally {
  try {
    await cleanup();
    if (userIds.length) {
      const { data: residue } = await admin
        .from("tracker_data")
        .select("user_id")
        .in("user_id", userIds);
      assert((residue ?? []).length === 0, "cleanup left probe rows");
    }
    console.log("cleanup ok: no probe rows remain");
  } catch (error) {
    console.error(`cleanup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
```

- [ ] **Step 2: Add the package script**

```json
"verify:cloud-sync": "node --env-file-if-exists=.env --env-file-if-exists=.env.local scripts/verify-cloud-sync.mjs",
```

- [ ] **Step 3: Verify the guard rails**

```bash
pnpm verify:cloud-sync
```

Expected: exits 1 with `Refusing to run: set ALLOW_PROD_SYNC_VERIFY=1.` It must not create users yet.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-cloud-sync.mjs package.json docs/release-gates.md
git commit -m "test(sync): add guarded production RLS and merge harness"
```

### Task B3: Run the sync harness against production

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: Gate A schema at `0014`, `.env` credentials.
- Produces: a redacted pass summary and proof of cleanup.

- [ ] **Step 1: Run the harness**

```bash
ALLOW_PROD_SYNC_VERIFY=1 \
EXPECTED_SUPABASE_REF=ejbghgpatpfubxltkpde \
pnpm verify:cloud-sync
```

Expected: `ok` for two users, RLS read/insert/update isolation, all 15 record keys, and owner-only merge; then `cleanup ok: no probe rows remain`; exit 0.

- [ ] **Step 2: On failure, stop**

Record the failing assertion. Do not retry with a weakened check. Inspect the function definition and RLS policies; fix the cause in a new migration or code change, then rerun from Task A2's backup rule (no data rollback needed for probe users).

- [ ] **Step 3: Record the evidence**

Append the redacted output to `docs/release-gates.md`. Do not record emails, user IDs, endpoints or keys.

- [ ] **Step 4: Commit**

```bash
git add docs/release-gates.md
git commit -m "docs(release): record cloud-sync harness evidence"
```

### Task B4: Complete the two-account manual sync check

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: two approved Google accounts and two browser profiles/devices.
- Produces: a signed checklist covering cross-device sync, offline retry, deletion, account switching and backup restore.

- [ ] **Step 1: Prepare two signed-in profiles**

Use two separate browser profiles (or a browser and phone) with the two approved Google accounts. Do not sign out of either during the first four checks.

- [ ] **Step 2: Cross-device write and pull**

1. On account A, add a todo named `Release sync check <timestamp>` and wait for `Synced`.
2. On account B, focus the tab or reload; confirm the todo appears.
3. On B, rename it; on A, focus; confirm the new name.

- [ ] **Step 3: Offline retry and deletion**

1. On A, switch DevTools to Offline, add `Offline release check`.
2. Reload; confirm it renders from local storage.
3. Go online and focus; wait for `Synced`; confirm B receives it.
4. Delete both test todos on A; confirm B loses them after focus and they do not return after reload.

- [ ] **Step 4: Account switching and legacy isolation**

1. Sign out of A and sign in as B; confirm no A data is visible.
2. In DevTools, confirm account keys use `vk:account:<user id>:` and that older unscoped `vk:` keys were not attached to the account.
3. Sign back in as A; confirm A data returns.

- [ ] **Step 5: Export and restore**

1. Export A's backup from Settings.
2. Delete one test todo; import the backup on A; confirm it restores only A's account data.
3. Do not import A's backup into B's account.

- [ ] **Step 6: Record the checklist**

Record each result, timestamp, browser/device and any console sync error in `docs/release-gates.md`. If any check fails, stop and report; do not claim authenticated sync.

- [ ] **Step 7: Commit**

```bash
git add docs/release-gates.md
git commit -m "docs(release): record two-account sync verification"
```

### Task B5: Deploy the sync fix and verify Gate B

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: Gate B commits.
- Produces: live deployment with the cache fix and a green Gate B record.

- [ ] **Step 1: Run the local gates**

```bash
pnpm test:sync
npx tsc --noEmit
pnpm lint
npx playwright test --reporter=line
```

Expected: all pass.

- [ ] **Step 2: Push and wait**

```bash
git push origin main
gh run list --limit 1
```

Wait for CI success and a Vercel production deployment for the pushed SHA.

- [ ] **Step 3: Verify production**

```bash
pnpm release:smoke
ALLOW_PROD_SYNC_VERIFY=1 EXPECTED_SUPABASE_REF=ejbghgpatpfubxltkpde pnpm verify:cloud-sync
```

Expected: smoke passes; harness passes and cleans up.

- [ ] **Step 4: Record and stop**

Append the deployed SHA, CI run, smoke output and harness summary to `docs/release-gates.md`. Commit the docs, push, wait for docs CI, then stop and report Gate B.

---

## Phase C — push delivery

### Task C1: Add push endpoint and configuration tests

**Files:**
- Create: `src/lib/push-server.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `validPushEndpoint`, `pushConfigured`.
- Produces: `pnpm test:push`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/push-server.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { pushConfigured, validPushEndpoint } from "./push-server.ts";

test("accepts the four supported push services", () => {
  for (const endpoint of [
    "https://fcm.googleapis.com/wp/abc",
    "https://web.push.apple.com/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://abc.notify.windows.com/w/?token=x",
  ]) {
    assert.equal(validPushEndpoint(endpoint), true, endpoint);
  }
});

test("rejects unsafe or unknown endpoints", () => {
  for (const endpoint of [
    "http://fcm.googleapis.com/x",
    "https://user:pass@fcm.googleapis.com/x",
    "https://fcm.googleapis.com:8443/x",
    "https://example.com/x",
    "",
    null,
  ]) {
    assert.equal(validPushEndpoint(endpoint), false, String(endpoint));
  }
});

test("pushConfigured requires every server value", () => {
  const original = { ...process.env };
  const values = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    VAPID_PUBLIC_KEY: "public",
    VAPID_PRIVATE_KEY: "private",
    VAPID_SUBJECT: "mailto:owner@example.com",
    CRON_SECRET: "secret",
    SUPABASE_SECRET_KEY: "service",
  };
  Object.assign(process.env, values);
  assert.equal(pushConfigured(), true);
  delete process.env.VAPID_PRIVATE_KEY;
  assert.equal(pushConfigured(), false);
  process.env = original;
});
```

- [ ] **Step 2: Run it and confirm the failure**

```bash
node --experimental-strip-types --test src/lib/push-server.test.ts
```

Expected: the test file fails only if an assertion is wrong; if it passes, keep it as regression coverage. The endpoint/config functions already exist, so this task is a characterization test, not a new implementation.

- [ ] **Step 3: Add the script and run the suite**

```json
"test:push": "node --experimental-strip-types --test src/lib/push-server.test.ts src/lib/routine-delivery.test.ts src/lib/routine-reminders.test.ts",
```

```bash
pnpm test:push
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/push-server.test.ts package.json
git commit -m "test(push): cover endpoint validation and configuration"
```

### Task C2: Document the scheduler and add the operator SQL

**Files:**
- Create: `supabase/schedules/push-dispatch.sql`
- Modify: `docs/NUTRITION_AND_REMINDER_SETUP.md`
- Modify: `docs/release-gates.md`

**Interfaces:**
- Produces: exact Vault, extension, schedule, verification and rollback steps.

- [ ] **Step 1: Add the schedule SQL**

Create `supabase/schedules/push-dispatch.sql`:

```sql
-- Operator-run after VAPID/CRON env values exist and the Vault secret is stored.
-- This file is not applied by `supabase db push`.

select cron.unschedule('nova-push-dispatch')
where exists (select 1 from cron.job where jobname = 'nova-push-dispatch');

select cron.schedule(
  'nova-push-dispatch',
  '* * * * *',
  $$
    select net.http_get(
      url := 'https://personal.buildora.work/api/push/dispatch',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'push_cron_secret'
        )
      ),
      timeout_milliseconds := 30000
    );
  $$
);
```

- [ ] **Step 2: Document activation**

In `docs/NUTRITION_AND_REMINDER_SETUP.md`, add a `## Push delivery activation (19 October 2026)` section with:

- Vercel Production values: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, plus the existing Supabase server key.
- Generate keys with `node scripts/generate-push-keys.mjs`; do not paste private values.
- Enable `pg_cron` and `pg_net` in Supabase Dashboard → Database → Extensions.
- Store the secret:

```sql
select vault.create_secret(
  '<CRON_SECRET>',
  'push_cron_secret',
  'Bearer for /api/push/dispatch'
);
```

- Run `supabase/schedules/push-dispatch.sql` in the SQL editor.
- Verify:

```sql
select jobid, jobname, schedule, active
from cron.job where jobname = 'nova-push-dispatch';

select status, return_message, start_time
from cron.job_run_details
order by start_time desc limit 5;

select status_code, left(content, 200)
from net._http_response
order by created desc limit 5;
```

- Rollback:

```sql
select cron.unschedule('nova-push-dispatch');
```

Then remove the four Vercel values and redeploy. Keep `push_subscriptions`, `push_deliveries` and migration `0008`.
- Fallback if the extensions are unavailable: a Cloudflare Worker with a `* * * * *` cron trigger calling the same URL with `Authorization: Bearer <CRON_SECRET>`.

- [ ] **Step 3: Commit**

```bash
git add supabase/schedules/push-dispatch.sql docs/NUTRITION_AND_REMINDER_SETUP.md docs/release-gates.md
git commit -m "docs(push): add scheduler, verification and rollback"
```

### Task C3: Configure VAPID and CRON in Vercel

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: owner-entered production secrets.
- Produces: a redeployed production build whose `/api/push/config` returns a public key for a signed-in approved account.

- [ ] **Step 1: Generate the values locally**

```bash
node scripts/generate-push-keys.mjs
openssl rand -hex 32
```

Do not paste the private key or `CRON_SECRET` into the transcript.

- [ ] **Step 2: Enter the values in Vercel**

In Vercel → Project → Settings → Environment Variables → Production, set:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (a `mailto:` owner address)
- `CRON_SECRET`

Confirm `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` is present. Do not add `NEXT_PUBLIC_` prefixes to any of these.

- [ ] **Step 3: Redeploy**

Trigger a production redeploy from Vercel (or push a docs commit). Wait for the deployment to succeed.

- [ ] **Step 4: Verify configuration**

While signed in to `https://personal.buildora.work` as an approved account, run in DevTools:

```js
fetch("/api/push/config").then((response) => response.json())
```

Expected: an object with a non-null `publicKey`. Record only that the key is present; do not record its value.

- [ ] **Step 5: Record and commit**

Record the env names (not values), deployment ID and the config check in `docs/release-gates.md`.

```bash
git add docs/release-gates.md
git commit -m "docs(release): record push configuration"
```

### Task C4: Install and verify the per-minute dispatcher

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: Vault secret, `pg_cron`, `pg_net`, `supabase/schedules/push-dispatch.sql`.
- Produces: a cron job running every minute with HTTP 200 responses.

- [ ] **Step 1: Confirm the extensions**

Run in the Supabase SQL editor:

```sql
select extname from pg_extension where extname in ('pg_cron', 'pg_net');
```

Expected: both rows. If missing, enable both in Dashboard → Database → Extensions, then rerun.

- [ ] **Step 2: Store the Vault secret**

Run in the SQL editor with the same value as Vercel's `CRON_SECRET` (not in the transcript):

```sql
select vault.create_secret(
  '<CRON_SECRET>',
  'push_cron_secret',
  'Bearer for /api/push/dispatch'
);
```

If the secret already exists, rotate it with `vault.update_secret` and update Vercel in the same change window.

- [ ] **Step 3: Install the schedule**

Run the contents of `supabase/schedules/push-dispatch.sql`.

- [ ] **Step 4: Verify the job and its results**

```sql
select jobid, jobname, schedule, active
from cron.job where jobname = 'nova-push-dispatch';
```

Expected: one active row with schedule `* * * * *`. Wait two minutes, then:

```sql
select status, return_message, start_time
from cron.job_run_details
order by start_time desc limit 5;

select status_code, left(content, 200)
from net._http_response
order by created desc limit 5;
```

Expected: recent runs with HTTP `200` and JSON such as `{"sent":0,"failed":0}`. A `401` means Vercel and Vault secrets differ; rotate both together. A DNS/timeout failure means the request never reached Vercel; verify the URL and Cloudflare rules.

- [ ] **Step 5: Record and commit**

Record the extension check, job row, latest run status and HTTP status (no secrets) in `docs/release-gates.md`.

```bash
git add docs/release-gates.md
git commit -m "docs(release): record the push scheduler"
```

### Task C5: Prove real delivery on macOS and Android

**Files:**
- Modify: `docs/release-gates.md`

**Interfaces:**
- Consumes: configured push, two devices, one approved account.
- Produces: timestamped delivery evidence and failure-path results.

- [ ] **Step 1: Enable on macOS Chrome**

1. Sign in as an approved account.
2. Open Routine reminders, enable notifications, allow the browser prompt.
3. Confirm a subscription row exists (count only; do not print the endpoint):

```sql
select count(*) from push_subscriptions;
```

- [ ] **Step 2: Enable on Android Chrome**

Repeat on Android Chrome. Confirm the count increases by one.

- [ ] **Step 3: Deliver with the site closed**

1. Record the original time of one routine item, then temporarily change it to roughly two minutes from now using the `Time (IST)` input.
2. Close every tab and the installed site on both devices.
3. Wait up to two minutes.
4. Confirm exactly one notification per device, with the expected title/body.
5. Tap/click the notification; confirm `/routine` opens to the right view.
6. Restore the original schedule time and confirm it saves.

Record the scheduled time, delivery time, device and result.

- [ ] **Step 4: Verify detail, deduplication and actions**

1. Repeat with `Show meal/supplement details on the lock screen` enabled; confirm the detailed text.
2. Confirm the dispatcher's `sent` count increments once per delivery group and `push_deliveries` has one row per delivery ID.
3. Snooze one item; confirm a later notification and that completion state is unchanged.
4. Skip/undo an item; confirm the notification does not mark it complete.

- [ ] **Step 5: Verify failure paths**

1. Use a fresh browser profile, deny permission, and confirm the UI says delivery is unavailable and in-app reminders still work.
2. Disable notifications on one device; confirm its subscription row is removed and no further notification arrives.
3. Confirm the 10 PM reminder is delivered while NOVA's optional rest view is active.

- [ ] **Step 6: Record and stop**

Record each result and timestamp in `docs/release-gates.md`. Note explicitly that iOS and Health Connect were not tested. Commit the docs, push, wait for docs CI, then stop and report Gate C.

---

## Final verification and release record

### Task D1: Update the release documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/NUTRITION_AND_REMINDER_SETUP.md`
- Modify: `docs/release-gates.md`

- [ ] **Step 1: Update the README**

Change the Routine and Reminders bullets from “deferred until production scheduling and secrets exist” to the verified state: scheduler installed, secrets configured, macOS/Android evidence recorded, iOS unverified. Link `docs/release-gates.md`.

- [ ] **Step 2: Update the setup doc**

Replace the old “Configure a server scheduler” instruction with the actual `pg_cron` + `pg_net` implementation and the Vault rotation procedure. Keep the real-device boundaries and rollback.

- [ ] **Step 3: Finalize the evidence doc**

Add a final table:

| Gate | Evidence | Result |
| --- | --- | --- |
| A — schema/deployment | migration list, backup hashes, smoke output, CI run | pass/fail |
| B — sync | harness summary, two-account checklist | pass/fail |
| C — push | cron runs, macOS/Android delivery, failure paths | pass/fail |

List the remaining unverified items: iOS push, Health Connect, feature-flagged planning/nutrition activation.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/NUTRITION_AND_REMINDER_SETUP.md docs/release-gates.md
git commit -m "docs(release): record the completed release gates"
```

### Task D2: Final CI and release report

- [ ] **Step 1: Run the full local gates**

```bash
pnpm test:sync
pnpm test:push
npx tsc --noEmit
pnpm lint
npx playwright test --reporter=line
```

Expected: all pass; full browser suite green.

- [ ] **Step 2: Push and watch CI**

```bash
git push origin main
gh run list --limit 1
```

Expected: CI success on the final SHA. Save the run id and result.

- [ ] **Step 3: Final production smoke**

```bash
pnpm release:smoke
```

Expected: all checks pass.

- [ ] **Step 4: Report**

Report the final SHA, CI run, smoke result, sync evidence, push evidence and the explicit unverified boundaries. Do not claim deployment, sync or delivery beyond the recorded evidence.

---

## Self-review notes

- **Spec coverage:** Gate A maps to Tasks A1–A7; Gate B to B1–B5; Gate C to C1–C5; documentation/close-out to D1–D2.
- **No placeholders:** every code step includes the file and implementation; every operator step includes the command or dashboard path and expected result.
- **Type consistency:** `PORTFOLIO_ORIGIN`, `PERSONAL_ORIGIN`, `parseStoredValue`, `__readLocalForTesting`, `__resetLocalValueCacheForTesting`, `release:smoke`, `verify:cloud-sync`, `test:sync` and `test:push` are defined before use.
- **Safety:** backups precede `db push`; `/artifacts/release/` is gitignored before any dump; ephemeral users are deleted in `finally`; secrets never enter the repository; rollback is documented for each gate.
