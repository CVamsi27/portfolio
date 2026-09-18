# Buildora Public Entry and Generic Goal System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Buildora’s public portfolio and NOVA//OS entry routes clear to anonymous visitors, replace country-specific goal assumptions with a generic country-aware model, add goal-aware/general motivation choice, land meal-window fasting, and remove stale emoji or legacy UI copy.

**Architecture:** Keep one Next.js app with host-aware proxy routing. Add a public `/trackers/landing` route that is never wrapped in `RequireAuth`, retain `/trackers` as the workspace, and centralize Buildora/NOVA//OS identity in `src/lib/brand.ts`. Extend preferences and fasting storage additively, isolate provider-facing motivation resolution behind a privacy-safe category-keyword resolver, and reuse the existing editorial primitives instead of introducing a second design system.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, Lucide React, localStorage-backed synced stores, optional Supabase sync, Playwright E2E, pnpm.

## Global Constraints

- The personal-host root must render public feature information without authentication and must not redirect to `/login`.
- Buildora leads the public portfolio identity; Vamsi Krishna remains the portfolio owner and dominant hero name; NOVA//OS remains the tracker product name under Buildora.
- Relocation must not preselect a country or contain Berlin-specific active UI/test copy; offer United States, United Kingdom, Canada, United Arab Emirates, Australia, Japan, Germany, Netherlands, Ireland, Singapore, and Other.
- Motivation providers receive only allowlisted category keywords; raw goal titles, names, countries, journal text, and user-entered notes never leave the app.
- Fasting is meal-window-first, calculates overnight windows, asks for a routine before the first log, and preserves legacy timer data.
- No emoji characters may remain in app UI, aria labels, metadata, changelog headings, or active test fixtures.
- Preserve existing `vk:` local-storage keys, `vk-tracker-suite` backup compatibility, sharing routes, exports, local mode, and optional cloud-auth behavior.
- Do not stage or modify `.freebuff/` or `.superpowers/`.
- Every behavior change follows the TDD cycle: write a focused failing test, run it and observe the expected failure, implement the smallest passing change, rerun focused tests, then commit.

---

## File Map

### Public entry and identity

- Create: `src/app/trackers/landing/page.tsx` — public NOVA//OS feature landing page.
- Modify: `src/proxy.ts` — rewrite the personal-host root to the public landing route.
- Modify: `src/lib/brand.ts` — Buildora parent-brand and explicit portfolio/person fields.
- Modify: `src/app/layout.tsx` — Buildora-first portfolio metadata and tracker parent-brand metadata.
- Modify: `src/components/Navbar.tsx` — Buildora public wordmark and route-aware labels.
- Modify: `src/components/Footer.tsx` — Buildora/Vamsi and NOVA//OS/Buildora signatures.
- Modify: `src/components/pages/About.tsx` — Buildora masthead with Vamsi Krishna as the hero name.
- Modify: `src/app/manifest.ts` — preserve NOVA//OS PWA identity and parent-brand description.
- Test: `e2e/navigation.spec.ts`, `e2e/branding.spec.ts` — anonymous public-entry and metadata boundaries.

### Goals and preferences

- Modify: `src/lib/user-prefs.ts` — country, motivation personalization, icon-name taxonomy, safe defaults.
- Modify: `src/components/trackers/icons.tsx` — add stable non-emoji goal icon names.
- Modify: `src/components/Questionnaire.tsx` — neutral goal copy, country selection, motivation source choice.
- Modify: `src/app/goal/page.tsx` — relocation country editor and composed display title.
- Modify: `src/app/trackers/page.tsx` — icon rendering and neutral hub subtitle.
- Modify: `src/lib/tracker-store.ts` only if preference migration needs a shared adapter; do not alter existing key names.
- Modify: `e2e/onboarding-hub.spec.ts`, `e2e/goal.spec.ts`, `e2e/branding.spec.ts` — preference and copy behavior.

### Meal-window fasting

- Create: `src/lib/fasting-window.ts` — pure time parsing, overnight calculation, and validation.
- Modify: `src/lib/trackers.ts` — meal-window types and history analytics adapters.
- Modify: `src/lib/tracker-store.ts` — additive routine/window migration helpers.
- Modify: `src/app/intermittent-fasting/page.tsx` — first/last meal form, routine prefill, and auto-clear controls.
- Modify: `src/app/trackers/page.tsx` — meal-window summary instead of timer-first action wording.
- Modify: `e2e/fasting.spec.ts`, `e2e/onboarding-hub.spec.ts` — first visit, routine, overnight, and history behavior.

### Motivation media and choice

- Create: `src/lib/motivation-media.ts` — allowlisted keyword map, provider response validation, cache shape, and fallbacks.
- Create: `src/app/api/motivation-media/route.ts` — bounded server-side provider adapter with source/category validation.
- Modify: `src/app/motivation/page.tsx` — source selector, media loading, and fallback state.
- Modify: `src/components/motivation/FocusScene.tsx` — full-screen image background, attribution, readability layers, and fallback.
- Modify: `src/lib/user-prefs.ts`, `src/components/Questionnaire.tsx` — motivation personalization field and onboarding choice.
- Modify: `e2e/motivation-focus.spec.ts`, `e2e/motivation-settings.spec.ts` — goal/general modes and provider privacy checks.

### Repo-wide copy and polish

- Modify: `CHANGELOG.md` — remove emoji headings.
- Modify: active source, tests, and fixtures containing Berlin/Germany demo copy, “Personal Suite”, or emoji UI strings.
- Modify: tracker feature routes where old Card-first wording or stale shell copy remains.
- Test: add focused assertions to existing E2E suites and run source audits with `rg`.

---

### Task 1: Public landing route and Buildora identity

**Files:**
- Create: `src/app/trackers/landing/page.tsx`
- Modify: `src/proxy.ts`, `src/lib/brand.ts`, `src/app/layout.tsx`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`, `src/components/pages/About.tsx`, `src/app/manifest.ts`
- Test: `e2e/navigation.spec.ts`, `e2e/branding.spec.ts`

**Interfaces:**
- Produces `PORTFOLIO_BRAND.siteName`, `PORTFOLIO_BRAND.personName`, `TRACKER_BRAND.parentBrand`, and a public landing page with `data-testid="tracker-public-landing"`.
- The personal-host proxy rewrites `/` to `/trackers/landing` without issuing a redirect.

- [ ] **Step 1: Write the failing public-entry tests.**

Add assertions to `e2e/navigation.spec.ts`:

```ts
test("personal root shows the public NOVA//OS landing without auth", async ({ page }) => {
  const response = await page.request.get("http://127.0.0.1:4111/", {
    headers: { Host: "personal.buildora.work" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('data-testid="tracker-public-landing"');
  expect(await response.text()).not.toContain("Sign in required");
});
```

Add assertions to `e2e/branding.spec.ts`:

```ts
test("portfolio shell leads with Buildora and keeps Vamsi as the person", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BUILDORA", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Vamsi Krishna/i })).toBeVisible();
  await expect(page).toHaveTitle(/Buildora.*Vamsi Krishna/i);
});
```

- [ ] **Step 2: Run the focused tests and observe the expected failures.**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/branding.spec.ts -g "public|Buildora"`

Expected: the personal-root response contains the old `/trackers` document and the Buildora assertions fail because the current brand contract has no `siteName` or public masthead.

- [ ] **Step 3: Implement the public route and host rewrite.**

Create a route that is not wrapped in `RequireAuth` and uses the existing tracker editorial primitives. Its first render must include:

```tsx
<main data-testid="tracker-public-landing">
  <p>From Buildora</p>
  <h1>NOVA//OS</h1>
  <p>Goals, routines, focus, and momentum in one private workspace.</p>
  <Link href="/trackers">Enter NOVA//OS</Link>
  <Link href="/motivation">Explore motivation</Link>
</main>
```

Change the personal-host branch in `src/proxy.ts` to set `url.pathname = "/trackers/landing"` for `/`, preserving the tracker surface header. Keep all other personal routes unchanged.

- [ ] **Step 4: Implement the explicit brand contract and shared shell copy.**

Extend the brand objects with these values:

```ts
PORTFOLIO_BRAND.siteName = "Buildora";
PORTFOLIO_BRAND.personName = "Vamsi Krishna";
PORTFOLIO_BRAND.title = "Buildora — Vamsi Krishna | Full Stack Engineer";
TRACKER_BRAND.parentBrand = "Buildora";
```

Use Buildora in the public navbar/footer and portfolio metadata, keep `Vamsi Krishna` as the dominant About heading, and keep NOVA//OS as the tracker wordmark. Replace the portfolio `~VK` visual label with a Buildora wordmark while retaining the existing NOVA//OS portal link.

- [ ] **Step 5: Run the focused tests and verify they pass.**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/branding.spec.ts -g "public|Buildora|portfolio shell|product identity"`

Expected: PASS, including no auth gate in the personal-root response and no regression in NOVA//OS manifest assertions.

- [ ] **Step 6: Commit the slice.**

```bash
git add src/app/trackers/landing/page.tsx src/proxy.ts src/lib/brand.ts src/app/layout.tsx src/components/Navbar.tsx src/components/Footer.tsx src/components/pages/About.tsx src/app/manifest.ts e2e/navigation.spec.ts e2e/branding.spec.ts
git commit -m "feat: add public buildora tracker entry"
```

### Task 2: Generic goal taxonomy and motivation preference

**Files:**
- Modify: `src/lib/user-prefs.ts`, `src/components/trackers/icons.tsx`, `src/components/Questionnaire.tsx`, `src/app/goal/page.tsx`, `src/app/trackers/page.tsx`
- Test: `e2e/onboarding-hub.spec.ts`, `e2e/goal.spec.ts`, `e2e/motivation-settings.spec.ts`

**Interfaces:**
- Produces `MotivationPersonalization`, `RELOCATION_COUNTRIES`, and `goalCountry`/`motivationPersonalization` safe preference fields.
- `GOAL_CATEGORIES` exposes `iconName: TrackerIconName` instead of emoji text.

- [ ] **Step 1: Write failing onboarding and goal tests.**

Add tests that seed an incomplete preference object and verify:

```ts
await expect(page.getByText("Choose a destination")).toBeVisible();
await expect(page.getByRole("option", { name: "United States" })).toBeVisible();
await expect(page.locator('input[placeholder*="Berlin"]')).toHaveCount(0);
await expect(page.getByText("Goal-aware")).toBeVisible();
await expect(page.getByText("General inspiration")).toBeVisible();
```

Add a goal-page test that selects Canada and expects the composed display title to contain `Relocate to Canada`.

- [ ] **Step 2: Run the focused tests and observe failures.**

Run: `pnpm exec playwright test e2e/onboarding-hub.spec.ts e2e/goal.spec.ts e2e/motivation-settings.spec.ts -g "country|destination|inspiration|Canada"`

Expected: FAIL because the current questionnaire has no country field, no personalization source, and still contains Berlin-specific copy and emoji category values.

- [ ] **Step 3: Add additive preference types and neutral constants.**

Implement:

```ts
export type MotivationPersonalization = "goal" | "general";
export const RELOCATION_COUNTRIES = [
  "United States", "United Kingdom", "Canada", "United Arab Emirates",
  "Australia", "Japan", "Germany", "Netherlands", "Ireland", "Singapore", "Other",
] as const;
```

Add `goalCountry?: string` and `motivationPersonalization: MotivationPersonalization` to `UserPrefs`, default the latter to `"goal"`, and normalize invalid legacy values to the safe default. Replace emoji fields in `GOAL_CATEGORIES` with `iconName` values that exist in `TRACKER_ICONS`.

- [ ] **Step 4: Update onboarding, goal settings, and hub rendering.**

Show a country select only for relocation, do not preselect a country, and use a neutral goal placeholder. Compose the display title in a pure helper from `goalTitle` and `goalCountry`; do not overwrite a user-entered legacy title. Render `TrackerIcon` for category cards and remove emoji concatenation from hub and goal subtitles.

Add a `Segmented` control with values `goal` and `general` to the Motivation onboarding step and the existing Motivation settings surface. Save both fields through `setPrefs` without changing the `vk:prefs` key.

- [ ] **Step 5: Run the focused tests and verify they pass.**

Run: `pnpm exec playwright test e2e/onboarding-hub.spec.ts e2e/goal.spec.ts e2e/motivation-settings.spec.ts -g "country|destination|inspiration|Canada"`

Expected: PASS, including no country selected by default and neutral copy in incomplete onboarding.

- [ ] **Step 6: Commit the slice.**

```bash
git add src/lib/user-prefs.ts src/components/trackers/icons.tsx src/components/Questionnaire.tsx src/app/goal/page.tsx src/app/trackers/page.tsx e2e/onboarding-hub.spec.ts e2e/goal.spec.ts e2e/motivation-settings.spec.ts
git commit -m "feat: make goals destination aware"
```

### Task 3: Meal-window fasting and auto-clear polish

**Files:**
- Create: `src/lib/fasting-window.ts`
- Modify: `src/lib/trackers.ts`, `src/lib/tracker-store.ts`, `src/app/intermittent-fasting/page.tsx`, `src/app/trackers/page.tsx`
- Test: `e2e/fasting.spec.ts`, `e2e/onboarding-hub.spec.ts`

**Interfaces:**
- Produces `MealWindowEntry`, `MealWindowRoutine`, `calculateMealWindow(firstMeal, lastMeal)`, and `validateMealWindow(firstMeal, lastMeal)`.
- `calculateMealWindow` returns `{ fastHours, eatingHours, overnight }` and handles `lastMeal < firstMeal` as an overnight window.

- [ ] **Step 1: Write failing pure-behavior and E2E tests.**

Import the pure helper at the top of `e2e/fasting.spec.ts` and add a direct assertion for `20:00` to `12:00`:

```ts
import { calculateMealWindow } from "../src/lib/fasting-window";

const result = calculateMealWindow("20:00", "12:00");
expect(result).toMatchObject({ fastHours: 16, overnight: true });
```

Add UI assertions for a first visit with empty history: the page asks for a routine, displays first/last meal fields, and offers `24 hours`, `7 days`, and `30 days` auto-clear choices. Assert that no `Start` or `Stop` primary action is present.

- [ ] **Step 2: Run the fasting tests and observe failure.**

Run: `pnpm exec playwright test e2e/fasting.spec.ts e2e/onboarding-hub.spec.ts -g "meal|routine|auto-clear|Start|Stop"`

Expected: FAIL because the current page renders timer controls and has no meal-window calculation or routine prompt.

- [ ] **Step 3: Implement the pure meal-window calculation.**

Use local time components, not UTC date parsing, and return a 24-hour normalized duration:

```ts
export function calculateMealWindow(firstMeal: string, lastMeal: string) {
  const start = minutesSinceMidnight(firstMeal);
  const end = minutesSinceMidnight(lastMeal);
  const eatingMinutes = end >= start ? end - start : 1440 - start + end;
  return {
    fastHours: Math.round(((1440 - eatingMinutes) / 60) * 10) / 10,
    eatingHours: Math.round((eatingMinutes / 60) * 10) / 10,
    overnight: end < start,
  };
}
```

Reject missing, malformed, or equal times with a user-facing validation message; do not add medical guidance or claims.

- [ ] **Step 4: Add additive store fields and migration behavior.**

Add meal-window records and routine fields without removing `FastState` or `FastHistoryEntry`. Preserve existing timer records in analytics, map old date/hour records through the existing adapter, and use the routine only as a prefill. Store explicit auto-clear duration as `24 | 168 | 720` hours and remove expired local meal-window records at read/write boundaries.

- [ ] **Step 5: Replace timer-first UI with meal-window UI.**

Render first/last meal inputs, a routine-first empty state, the computed fasting duration, and an explicit `Save today’s window` action. Keep historical charts and protocol context as secondary information. Use Lucide icons only. Expose the auto-clear selector with helper copy explaining that saved local windows are removed after the selected duration.

- [ ] **Step 6: Run focused tests and commit.**

Run: `pnpm exec playwright test e2e/fasting.spec.ts e2e/onboarding-hub.spec.ts`

Expected: PASS for overnight calculation, routine prefill, save behavior, legacy history visibility, and auto-clear choices.

```bash
git add src/lib/fasting-window.ts src/lib/trackers.ts src/lib/tracker-store.ts src/app/intermittent-fasting/page.tsx src/app/trackers/page.tsx e2e/fasting.spec.ts e2e/onboarding-hub.spec.ts
git commit -m "feat: track fasting by meal windows"
```

### Task 4: Goal-aware and general motivation media

**Files:**
- Create: `src/lib/motivation-media.ts`, `src/app/api/motivation-media/route.ts`
- Modify: `src/app/motivation/page.tsx`, `src/components/motivation/FocusScene.tsx`
- Test: `e2e/motivation-focus.spec.ts`, `e2e/motivation-settings.spec.ts`

**Interfaces:**
- `getMotivationKeywords(source, category)` returns an allowlisted string array and never receives a raw goal title.
- `resolveMotivationMedia({ source, category, fetchImpl })` returns `{ imageUrl, imageAlt, attribution, quote, quoteAuthor, fetchedAt }` or a deterministic fallback.
- `GET /api/motivation-media?source=goal|general&category=<GoalCategory>` validates both parameters before any provider request.

- [ ] **Step 1: Write failing resolver and UI tests.**

Add an E2E route interception that returns a known image/quote and assert the focus scene renders an image background, quote attribution, and a source control. Add a request assertion:

```ts
await expect.poll(() => capturedProviderUrl).toContain("journey");
expect(capturedProviderUrl).not.toContain("Relocate");
expect(capturedProviderUrl).not.toContain("Canada");
```

Add a general-mode assertion that the request uses only `focus`, `resilience`, or `progress` keywords.

- [ ] **Step 2: Run focused motivation tests and observe failure.**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts e2e/motivation-settings.spec.ts -g "media|source|provider|keyword"`

Expected: FAIL because the current focus scene has no media request, no image layer, and no personalization source.

- [ ] **Step 3: Implement privacy-safe provider resolution.**

Use a fixed map:

```ts
const CATEGORY_KEYWORDS = {
  relocation: ["journey", "horizon", "city"],
  fitness: ["movement", "strength", "training"],
  career: ["focus", "craft", "progress"],
  learning: ["study", "library", "discovery"],
  financial: ["growth", "building", "future"],
  custom: ["focus", "resilience", "progress"],
} as const;
```

Implement bounded provider requests to Art Institute of Chicago artwork search and Zen Quotes, validate response shape, reject non-HTTPS image URLs, and return local fallback content on timeout, HTTP error, invalid data, or missing CORS/server response. Cache valid results in the existing local synced-storage pattern with a bounded TTL.

- [ ] **Step 4: Add the API route and scene integration.**

The API route validates `source` and `category`, calls the resolver with the server `fetch`, and returns the normalized payload. `MotivationPage` loads it when the source/category changes and passes media to `FocusScene`. `FocusScene` renders a full-bleed `<img>` behind layered gradients, an attribution line, and the existing readable objective/quote controls. If media is loading or unavailable, preserve the current abstract scene as fallback.

- [ ] **Step 5: Run focused tests and commit.**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts e2e/motivation-settings.spec.ts`

Expected: PASS for both source modes, fallback behavior, full-screen focus mode, reduced motion, and provider keyword privacy.

```bash
git add src/lib/motivation-media.ts src/app/api/motivation-media/route.ts src/app/motivation/page.tsx src/components/motivation/FocusScene.tsx e2e/motivation-focus.spec.ts e2e/motivation-settings.spec.ts
git commit -m "feat: add goal-aware motivation media"
```

### Task 5: Repo-wide copy and UI polish pass

**Files:**
- Modify: `src/app/globals.css`, `src/app/trackers/page.tsx`, `src/app/goal/page.tsx`, `src/app/intermittent-fasting/page.tsx`, `src/app/workout-tracking/page.tsx`, `src/app/todo/page.tsx`, `src/app/share/page.tsx`, `src/app/shared-with-me/page.tsx`, `src/app/login/page.tsx`, `src/app/settings/page.tsx`, `CHANGELOG.md`, and any active tests/fixtures found by the audit.
- Test: `e2e/editorial-foundation.spec.ts`, `e2e/reduced-motion.spec.ts`, all affected E2E suites.

**Interfaces:**
- Preserves all route paths and data keys while making copy, iconography, focus states, and responsive composition consistent with the existing editorial system.

- [ ] **Step 1: Write the failing string and route audit.**

Add a focused browser assertion over every primary tracker route:

```ts
for (const route of ["/trackers", "/goal", "/intermittent-fasting", "/workout-tracking", "/todo", "/motivation", "/share", "/shared-with-me", "/settings", "/login"]) {
  await page.goto(route);
  await expect(page.locator("body")).not.toContainText("Personal Suite");
  await expect(page.locator("body")).not.toContainText("Relocate to Berlin");
}
```

Run a source audit that fails on emoji code points in active user-facing files and on stale Berlin/demo strings:

```bash
rg -n -P "[\\x{1F300}-\\x{1FAFF}]|Berlin|Relocate to Berlin|Personal Suite" src public e2e README.md CHANGELOG.md
```

- [ ] **Step 2: Run the audit and observe the expected failures.**

Run: `pnpm exec playwright test e2e/editorial-foundation.spec.ts e2e/reduced-motion.spec.ts` and the `rg` command above.

Expected: failures identify the remaining visible flame emoji copy, category emoji fields, Berlin fixtures/placeholders, and any old shell wording.

- [ ] **Step 3: Replace stale copy and icon usage.**

Use Lucide or `TrackerIcon` wherever a visible emoji currently appears. Rewrite active changelog headings as plain text. Replace active Berlin fixtures with a neutral country fixture or an explicit Canada/United States selection test. Do not alter historical design docs or compatibility-sensitive storage values.

- [ ] **Step 4: Polish remaining route surfaces.**

For each route, apply the existing `ChapterHeader`, `StoryPanel`, `SignalPanel`, `ActionBlock`, and focus-visible utility classes where the page still uses a generic stacked Card layout. Preserve content and event handlers. Ensure buttons have a 44px minimum hit area, labels are sentence case, empty states name the next action, and `prefers-reduced-motion` disables nonessential reveals.

- [ ] **Step 5: Run focused tests and commit.**

Run: `pnpm exec playwright test e2e/editorial-foundation.spec.ts e2e/reduced-motion.spec.ts e2e/branding.spec.ts e2e/onboarding-hub.spec.ts e2e/goal.spec.ts`

Expected: PASS, followed by an empty `rg` result for forbidden active strings and emoji code points.

```bash
git add src/app/globals.css src/app/trackers/page.tsx src/app/goal/page.tsx src/app/intermittent-fasting/page.tsx src/app/workout-tracking/page.tsx src/app/todo/page.tsx src/app/share/page.tsx src/app/shared-with-me/page.tsx src/app/login/page.tsx src/app/settings/page.tsx CHANGELOG.md e2e
git commit -m "polish: unify tracker copy and surfaces"
```

### Task 6: Full verification and release evidence

**Files:**
- Modify only if verification finds a regression: affected source/test files from Tasks 1–5.
- Test: all E2E suites and the repository gates.

**Interfaces:**
- Produces a clean, evidence-backed verification record in the final response; no new runtime interface.

- [ ] **Step 1: Run lint and build.**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both commands exit 0 with no TypeScript, ESLint, or Next build errors.

- [ ] **Step 2: Run the complete E2E suite.**

Run: `pnpm exec playwright test`

Expected: all existing and newly added tests pass in local mode with no sign-in.

- [ ] **Step 3: Run the final diff and copy audits.**

Run:

```bash
git diff --check
rg -n -P "[\\x{1F300}-\\x{1FAFF}]|Berlin|Relocate to Berlin|Personal Suite" src public e2e README.md CHANGELOG.md
git status --short
```

Expected: `git diff --check` is silent; the string audit is silent except for intentionally preserved historical or compatibility references that are documented; only intended source changes and the pre-existing untracked directories remain.

- [ ] **Step 4: Perform browser QA at desktop and 390px.**

Inspect `/`, `/trackers/landing`, `/trackers`, `/goal`, `/intermittent-fasting`, `/motivation`, `/share`, `/shared-with-me`, `/login`, and `/settings`. Confirm public entry, Buildora emphasis, country selection, meal-window routine flow, full-screen media focus, keyboard focus, and reduced motion.

- [ ] **Step 5: Commit any verification fixes and report evidence.**

If a fix is required, repeat the smallest relevant red-green test and commit it with a focused conventional message. Report exact commands and pass counts, plus any check that could not run because of an external credential or deployment condition.

## Plan self-review

- Public entry and auth regression: Task 1.
- Buildora/Vamsi/NOVA//OS identity and favicon/manifest boundary: Task 1.
- Major-country relocation options and no Berlin default: Task 2.
- Goal-aware/general motivation choice: Tasks 2 and 4.
- Public API media with safe keywords, caching, fallback, and full-screen scene: Task 4.
- Meal-window fasting, routine-first setup, overnight math, and 24-hour/7-day/30-day cleanup: Task 3.
- Emoji removal and remaining old UI polish: Task 5.
- Compatibility, accessibility, responsive QA, lint, build, E2E, diff, and audit evidence: Task 6.
- No placeholder implementation steps, no new storage key renames, and no changes to `.freebuff/` or `.superpowers/`.
