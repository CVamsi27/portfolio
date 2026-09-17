# NOVA//OS Tracker Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand every tracker-facing surface as NOVA//OS while preserving Vamsi Krishna portfolio identity and all existing local-data, backup, share-link, and route compatibility.

**Architecture:** Add one small tracker brand module and one reusable SVG mark component, then make the shared shell host-aware so tracker and portfolio surfaces select their own identity. Keep the existing internal `vk:` storage namespace and `vk-tracker-suite` backup discriminator unchanged. Verify the boundary with Playwright, including browser metadata, PWA assets, responsive shell behavior, and reduced-motion behavior.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, `next/font`, Playwright, Sharp icon-generation script, service worker, Markdown documentation.

## Global Constraints

- **Name:** NOVA//OS.
- **Tagline:** Your next chapter, in motion.
- **Scope:** Tracker/product surfaces only; portfolio routes retain Vamsi Krishna identity.
- **Mark:** Angular N from two orbital rails around a four-point nova star; no VK initials on tracker surfaces.
- **Color roles:** archive black, signal cyan, acid lime, anime red, ultraviolet, paper white, and mist gray.
- **Typography roles:** expressive condensed/editorial display, clean modern sans-serif body, monospace utility labels.
- **Compatibility:** Keep internal storage keys, backup identifiers, database compatibility names, share links, and deep links stable.
- **Accessibility:** Provide accessible names for logo-only states, preserve visible keyboard focus, maintain contrast, and respect reduced motion.
- **Verification:** Add branding assertions, keep existing E2E green, and pass lint plus production build.

---

## File map

- Create `src/lib/brand.ts` — tracker brand constants and host-safe identity helpers; contains no storage or route mutation.
- Create `src/components/brand/NovaMark.tsx` — inline SVG mark/wordmark with `mark`, `compact`, and `wordmark` variants.
- Modify `src/proxy.ts` — mark tracker requests with an internal request header so metadata can distinguish local tracker paths from the portfolio root.
- Modify `src/app/layout.tsx` — select metadata, viewport color, and apple title from the request surface while preserving existing font loading and shell composition.
- Modify `src/app/manifest.ts` — expose NOVA//OS PWA metadata and the new signal-cyan visual theme.
- Modify `src/app/icon.svg` — replace the VK monogram with the nova-star/orbital-rail mark.
- Modify `src/components/Navbar.tsx` — render NOVA//OS tracker branding and retain Vamsi branding on portfolio surfaces.
- Modify `src/components/Footer.tsx` — render a product signature on tracker surfaces and the existing personal signature on portfolio surfaces.
- Modify `src/components/InstallPrompt.tsx` — use NOVA//OS product copy without changing the existing `vk:install:dismissed` key.
- Modify `src/components/Questionnaire.tsx` — replace tracker-facing Personal Suite copy.
- Modify `src/components/auth/RequireAuth.tsx` — replace tracker-facing product copy while retaining signed-out/local-mode behavior.
- Modify `src/components/trackers/TrackerShell.tsx` — replace chapter eyebrow with NOVA//OS.
- Modify `src/components/motivation/FocusScene.tsx` — update the focus-scene product signature if its footer identifies the suite.
- Modify `public/sw.js` — rename product comments and bump the cache version to invalidate the prior VK-branded shell cache.
- Modify `scripts/generate-pwa-icons.mjs` — generate maskable icons from the new mark without rasterizing text.
- Modify `README.md` and `CHANGELOG.md` — update public tracker product references while documenting stable internal compatibility names.
- Modify `e2e/navigation.spec.ts` and create `e2e/branding.spec.ts` — test tracker/portfolio identity separation and PWA metadata.

## Test commands

- Focused branding tests: `pnpm exec playwright test e2e/branding.spec.ts e2e/navigation.spec.ts`
- Existing shell regression: `pnpm exec playwright test e2e/foundation.spec.ts e2e/reduced-motion.spec.ts e2e/motivation-focus.spec.ts`
- Lint: `pnpm lint`
- Production build: `pnpm build`

---

### Task 1: Add the NOVA//OS brand contract and failing boundary tests

**Files:**
- Create: `src/lib/brand.ts`
- Create: `e2e/branding.spec.ts`
- Modify: `e2e/navigation.spec.ts`

**Interfaces:**
- Produces `TRACKER_BRAND` with `name`, `tagline`, `description`, `themeColor`, and `iconPath` string fields.
- Produces `isTrackerHost(hostname: string): boolean` and `getBrandForHost(hostname: string): typeof TRACKER_BRAND | typeof PORTFOLIO_BRAND`.
- Produces `PORTFOLIO_BRAND` with `name`, `title`, and `description` fields for the shared layout/footer boundary.

- [ ] **Step 1: Write the failing browser assertions**

Add this test shape to `e2e/branding.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("tracker shell exposes the NOVA//OS product identity", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(page.getByRole("link", { name: /NOVA\/\/OS/i }).first()).toBeVisible();
  await expect(page.locator("body")).toContainText("Your next chapter, in motion.");
  await expect(page).toHaveTitle(/NOVA\/\/OS/i);
});

test("portfolio shell keeps the personal identity", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Open the NOVA//OS trackers" })).toBeVisible();
  await expect(page).toHaveTitle(/Vamsi Krishna/i);
});
```

Update the existing PWA assertion in `e2e/navigation.spec.ts` from `VK Personal Suite` to `NOVA//OS` and add an assertion for the tracker tagline in the tracker shell.

- [ ] **Step 2: Run the focused tests and verify RED**

Run `pnpm exec playwright test e2e/branding.spec.ts e2e/navigation.spec.ts`.

Expected: the new tests fail because the current shell still renders `~VK`, `Personal Suite`, and the Vamsi metadata on tracker routes. Existing unrelated navigation tests may remain green.

- [ ] **Step 3: Add the brand contract**

Create `src/lib/brand.ts` with this stable shape:

```ts
export const TRACKER_BRAND = {
  name: "NOVA//OS",
  tagline: "Your next chapter, in motion.",
  description: "A personal operating system for goals, habits, focus, and shared momentum.",
  themeColor: "#071014",
  iconPath: "/icon.svg",
} as const;

export const PORTFOLIO_BRAND = {
  name: "Vamsi Krishna",
  title: "Vamsi Krishna | Full Stack Engineer",
  description:
    "Product-focused Full Stack Engineer with 5+ years of experience delivering production web applications with TypeScript, React, Node.js, NestJS, and PostgreSQL.",
} as const;

export function isTrackerHost(hostname: string): boolean {
  return hostname.startsWith("personal.");
}

export function getBrandForHost(hostname: string) {
  return isTrackerHost(hostname) ? TRACKER_BRAND : PORTFOLIO_BRAND;
}
```

- [ ] **Step 4: Run TypeScript/lint checks for the new module**

Run `pnpm lint`.

Expected: the new constants and helpers introduce no lint or type errors; the browser tests remain RED until later tasks wire the contract into the shell.

- [ ] **Step 5: Commit the contract and tests**

```bash
git add src/lib/brand.ts e2e/branding.spec.ts e2e/navigation.spec.ts
git commit -m "test: define nova os branding boundary"
```

---

### Task 2: Build the NOVA//OS mark and replace shared shell branding

**Files:**
- Create: `src/components/brand/NovaMark.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/trackers/TrackerShell.tsx`

**Interfaces:**
- Produces `NovaMark({ variant, className, label }: { variant: "mark" | "compact" | "wordmark"; className?: string; label?: string })`.
- Consumes `TRACKER_BRAND` and `isTrackerHost` from `src/lib/brand.ts`.
- Preserves the existing tracker navigation links, auth controls, theme toggle, mobile dock, footer Top link, and portfolio `~VK` visual identity.

- [ ] **Step 1: Extend the browser tests for shell surfaces**

Add assertions to `e2e/branding.spec.ts`:

```ts
test("tracker navigation and footer use NOVA//OS", async ({ page }) => {
  await seed(page);
  await page.goto("/todo");
  await expect(page.getByRole("link", { name: /NOVA\/\/OS/i }).first()).toBeVisible();
  await expect(page.locator("footer")).toContainText("NOVA//OS");
  await expect(page.locator("footer")).toContainText("Your next chapter, in motion.");
  await expect(page.getByText("NOVA//OS // Chapter 01")).toBeVisible();
});
```

- [ ] **Step 2: Run the new shell assertions and verify RED**

Run `pnpm exec playwright test e2e/branding.spec.ts -g "navigation and footer"`.

Expected: FAIL because the current shell has no NOVA//OS mark, footer signature, or chapter eyebrow.

- [ ] **Step 3: Implement the inline SVG mark**

Create `NovaMark.tsx` with an accessible inline SVG. The `mark` variant renders only the angular N, orbital rails, and four-point star; `compact` wraps the mark with the `NOVA//OS` text at small sizes; `wordmark` uses larger text for desktop. Set `aria-hidden="true"` only when a non-empty `label` is not needed; otherwise expose `role="img"` and `aria-label={label ?? "NOVA//OS"}`.

Use the approved role colors in the SVG: archive black background only for the `mark` tile, signal cyan rails, acid lime star, and paper-white wordmark. Do not embed a font-dependent text glyph inside the favicon mark.

- [ ] **Step 4: Wire the mark and host-aware copy into the shell**

In `Navbar.tsx`, render `<NovaMark variant="wordmark" label="NOVA//OS" />` for `isTracker` and keep the current `~VK` link for portfolio pages. Change the portfolio portal label and accessible name to `Open the NOVA//OS trackers` while keeping the same route behavior.

In `Footer.tsx`, derive `isTracker` from `window.location.hostname` through the same `useSyncExternalStore` pattern already used by `Navbar.tsx`. Render the tracker signature `NOVA//OS · Your next chapter, in motion.` on tracker surfaces and preserve `© {year} Vamsi Krishna Chandaluri` plus the technology line on portfolio surfaces.

In `TrackerShell.tsx`, change the chapter eyebrow to `NOVA//OS // Chapter 01` and leave the tracker navigation mechanics untouched.

- [ ] **Step 5: Run focused tests and inspect responsive states**

Run `pnpm exec playwright test e2e/branding.spec.ts e2e/foundation.spec.ts e2e/reduced-motion.spec.ts`.

Expected: all focused tests pass. Use the existing mobile viewport test to confirm the logo remains visible and the mobile command dock still appears.

- [ ] **Step 6: Commit shell branding**

```bash
git add src/components/brand/NovaMark.tsx src/components/Navbar.tsx src/components/Footer.tsx src/components/trackers/TrackerShell.tsx e2e/branding.spec.ts
git commit -m "feat: brand tracker shell as nova os"
```

---

### Task 3: Make metadata and PWA assets NOVA//OS

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts`
- Modify: `src/app/icon.svg`
- Modify: `scripts/generate-pwa-icons.mjs`
- Modify: `public/icons/icon-192.png`
- Modify: `public/icons/icon-512.png`
- Modify: `public/icons/icon-192-maskable.png`
- Modify: `public/icons/icon-512-maskable.png`

**Interfaces:**
- `generateMetadata()` in `src/app/layout.tsx` returns `Metadata` selected from the request surface using the `x-product-surface: tracker` header and `getBrandForHost`.
- `generateViewport()` in `src/app/layout.tsx` returns the matching theme color for tracker and portfolio surfaces.
- `manifest()` returns the NOVA//OS PWA identity and keeps `/trackers` as `start_url`.
- The SVG and all generated PNGs use the mark contract from Task 2, with no VK text.

- [ ] **Step 1: Add failing metadata and icon assertions**

Add this test to `e2e/branding.spec.ts`:

```ts
test("PWA metadata exposes the NOVA//OS identity", async ({ page }) => {
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("NOVA//OS");
  expect(manifest.short_name).toBe("NOVA");
  expect(manifest.start_url).toBe("/trackers");

  await page.goto("/trackers");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/icon.svg");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#071014");
});
```

- [ ] **Step 2: Run the PWA test and verify RED**

Run `pnpm exec playwright test e2e/branding.spec.ts -g "PWA metadata"`.

Expected: FAIL because the manifest currently names VK Personal Suite, the theme color is purple, and the layout metadata is not host-aware.

- [ ] **Step 3: Mark tracker requests before metadata generation**

In `src/proxy.ts`, create a cloned `Headers` object for requests whose host starts with `personal.` or whose host is local and whose pathname is a non-root, non-API route. Set `x-product-surface` to `tracker` on that clone and pass it through `NextResponse.rewrite(url, { request: { headers } })` for the personal-host root rewrite and `NextResponse.next({ request: { headers } })` for normal tracker requests. Leave the portfolio redirect, API exemption, PWA asset exemption, and localhost routing behavior unchanged.

- [ ] **Step 4: Add host-aware layout metadata**

Import `headers` from `next/headers`, `getBrandForHost`, `PORTFOLIO_BRAND`, and `TRACKER_BRAND`. Replace the static `metadata` export with `export async function generateMetadata(): Promise<Metadata>`, read `(await headers()).get("host") ?? ""` and `(await headers()).get("x-product-surface")`, and select tracker identity when the internal surface header is `tracker` or `isTrackerHost(host)` is true. Return the existing portfolio title/description for all other hosts. Keep `manifest: "/manifest.webmanifest"`, `icons.icon`, and `icons.apple` pointing at the existing asset paths so browser caching and the route contract remain stable.

Replace the static `Viewport` export with `export async function generateViewport(): Promise<Viewport>`, use the same surface selection, and return `TRACKER_BRAND.themeColor` for tracker requests and the existing `#0b0d12` for portfolio requests. This keeps the tracker color from leaking into the portfolio browser chrome.

- [ ] **Step 5: Update manifest, typography hook, and source SVG**

Set `manifest()` to:

```ts
name: "NOVA//OS",
short_name: "NOVA",
description: "A personal operating system for goals, habits, focus, and shared momentum.",
theme_color: "#071014",
background_color: "#071014",
```

Keep categories, scope, `start_url`, and icon paths unchanged. Replace `src/app/icon.svg` with a 64×64 vector containing an archive-black rounded tile, two cyan orbital rails, and a lime four-point star around the angular N mark.

Add one expressive condensed display face through `next/font/google` in `src/app/layout.tsx` and expose it as `--font-nova-display`. Use that variable only in `NovaMark` and tracker-facing NOVA//OS signature treatments; keep the portfolio's existing display font unchanged.

- [ ] **Step 6: Make generated maskable assets use the source mark**

In `scripts/generate-pwa-icons.mjs`, keep the regular icon rasterization from `src/app/icon.svg`. Replace the embedded VK text in the maskable SVG with the same vector mark, use a full-bleed archive-black background, and keep the mark inside the Android safe zone. Run `node scripts/generate-pwa-icons.mjs` to regenerate all four PNG assets.

- [ ] **Step 7: Run asset tests and build**

Run `pnpm exec playwright test e2e/branding.spec.ts -g "PWA metadata"`, then `pnpm lint` and `pnpm build`.

Expected: the PWA assertions pass, generated icon files are valid, lint passes, and Next can dynamically generate the host/surface-aware layout metadata.

- [ ] **Step 8: Commit metadata and assets**

```bash
git add src/proxy.ts src/app/layout.tsx src/app/manifest.ts src/app/icon.svg scripts/generate-pwa-icons.mjs public/icons
git commit -m "feat: ship nova os pwa identity"
```

---

### Task 4: Replace tracker-facing product copy without changing compatibility keys

**Files:**
- Modify: `src/components/InstallPrompt.tsx`
- Modify: `src/components/Questionnaire.tsx`
- Modify: `src/components/auth/RequireAuth.tsx`
- Modify: `src/components/motivation/FocusScene.tsx`
- Modify: `src/lib/brand.ts`

**Interfaces:**
- Consumes `TRACKER_BRAND.name`, `TRACKER_BRAND.tagline`, and `TRACKER_BRAND.description`.
- Preserves `vk:install:dismissed`, `vk:` localStorage keys, Supabase auth behavior, and focus-mode controls.

- [ ] **Step 1: Add copy assertions before editing copy**

Extend `e2e/branding.spec.ts`:

```ts
test("tracker product copy is consistent", async ({ page }) => {
  await seed(page);
  await page.goto("/settings");
  await expect(page.locator("body")).not.toContainText("Personal Suite");
  await expect(page.locator("body")).not.toContainText("VK Personal Suite");
  await page.goto("/motivation");
  await expect(page.getByTestId("focus-scene")).toBeVisible();
});
```

- [ ] **Step 2: Run the copy test and verify RED**

Run `pnpm exec playwright test e2e/branding.spec.ts -g "product copy"`.

Expected: FAIL because install/onboarding/auth/chapter copy still includes Personal Suite.

- [ ] **Step 3: Replace visible product copy through the brand contract**

Change `InstallPrompt` to say `Install NOVA//OS` and describe “Your next chapter, in motion.” while leaving `DISMISS_KEY = "vk:install:dismissed"` unchanged.

Change questionnaire and `RequireAuth` headings, kickers, and explanatory copy to use NOVA//OS terminology. Keep the no-sign-in-required/local-mode behavior and public-page language.

Change any product-name footer/signature text in `FocusScene` to NOVA//OS while preserving the “Esc to exit” affordance and all action labels.

Use `TRACKER_BRAND` for repeated name/tagline strings so a future copy change has one source of truth.

- [ ] **Step 4: Prove compatibility strings remain stable**

Run `rg -n 'vk:install:dismissed|vk-tracker-suite|localStorage' src/lib/backup.ts src/components/InstallPrompt.tsx src` and confirm the storage and backup identifiers have not changed. Run `pnpm exec playwright test e2e/branding.spec.ts e2e/share.spec.ts e2e/onboarding-hub.spec.ts`.

Expected: branding, share, and onboarding tests pass; no migration or import/export behavior changes.

- [ ] **Step 5: Commit tracker copy**

```bash
git add src/components/InstallPrompt.tsx src/components/Questionnaire.tsx src/components/auth/RequireAuth.tsx src/components/motivation/FocusScene.tsx src/lib/brand.ts e2e/branding.spec.ts
git commit -m "feat: update tracker product language"
```

---

### Task 5: Refresh service-worker identity and product documentation

**Files:**
- Modify: `public/sw.js`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Service worker retains the same `/` scope and precache/runtime behavior while changing only product-facing comments and cache namespace.
- Documentation describes NOVA//OS while explicitly preserving the internal backup discriminator for compatibility.

- [ ] **Step 1: Add an asset identity assertion**

Extend the PWA test:

```ts
test("service worker belongs to the current product shell", async ({ page }) => {
  const sw = await page.request.get("/sw.js");
  expect(sw.ok()).toBeTruthy();
  const source = await sw.text();
  expect(source).toContain("NOVA//OS");
  expect(source).toContain('CACHE_VERSION = "nova-os-v2"');
  expect(source).not.toContain("VK Personal Suite");
});
```

- [ ] **Step 2: Run the assertion and verify RED**

Run `pnpm exec playwright test e2e/branding.spec.ts -g "service worker"`.

Expected: FAIL because `public/sw.js` still contains the VK comment and `vk-suite-v1` cache version.

- [ ] **Step 3: Update the service worker safely**

Change the product comment to `NOVA//OS service worker` and set `const CACHE_VERSION = "nova-os-v2";`. Leave cache cleanup, fetch handling, and offline fallback code unchanged.

- [ ] **Step 4: Update product-facing docs**

Replace tracker-facing “Personal Suite” references in README and CHANGELOG with NOVA//OS. Add one compatibility sentence: “The UI is branded NOVA//OS; internal `vk:` localStorage keys and the `vk-tracker-suite` backup discriminator remain stable for existing data.” Keep portfolio references to Vamsi Krishna and technical implementation details accurate.

- [ ] **Step 5: Run docs and service-worker checks**

Run `pnpm exec playwright test e2e/branding.spec.ts -g "service worker"` and `git diff --check`.

Expected: service-worker test passes and documentation contains no accidental trailing whitespace.

- [ ] **Step 6: Commit service-worker and documentation updates**

```bash
git add public/sw.js README.md CHANGELOG.md e2e/branding.spec.ts
git commit -m "docs: align tracker product references"
```

---

### Task 6: Run the complete release gates and review the visual boundary

**Files:**
- Modify: `e2e/branding.spec.ts` only if a discovered assertion needs correction; do not weaken an assertion to hide a failure.

**Interfaces:**
- Verifies all public routes, tracker routes, PWA assets, and compatibility-sensitive flows as one release candidate.

- [ ] **Step 1: Run the full browser suite**

Run `pnpm exec playwright test`.

Expected: all existing tracker/share/focus/navigation tests and the new branding tests pass.

- [ ] **Step 2: Run static gates**

Run `pnpm lint && pnpm build`.

Expected: both commands exit 0.

- [ ] **Step 3: Review changed branding strings**

Run `rg -n "Personal Suite|VK Personal Suite|~VK|NOVA//OS|Your next chapter" src public README.md CHANGELOG.md --glob '!**/*.png'`.

Expected: `Personal Suite` and `~VK` remain only in intentional portfolio portal compatibility context or historical changelog text; tracker-facing routes and components use NOVA//OS. `vk:` and `vk-tracker-suite` remain only in compatibility-sensitive implementation paths and the explicit documentation note.

- [ ] **Step 4: Check the browser UI at both widths**

Start the production server with the existing Playwright config, inspect `/trackers` at desktop and 390px widths, then inspect `/` at desktop width. Confirm the NOVA//OS mark is crisp, the footer does not wrap awkwardly, the mobile dock is not obscured, and the portfolio still reads as Vamsi Krishna.

- [ ] **Step 5: Commit any final test-only correction**

If a test needs a real selector correction discovered during the release run, make the smallest targeted edit, rerun the failing test plus the full suite, and commit it with:

```bash
git add e2e/branding.spec.ts e2e/navigation.spec.ts
git commit -m "test: finalize nova os release gates"
```
