# Personal Buildora Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Restructure `personal.buildora.work` around one mobile-first daily flow, add host-correct favicons, and expose the protected study destination from the public portfolio without changing tracker data behavior.

**Architecture:** Keep `TrackerShell` as the shared personal layout, but make its header compact, make dock rendering explicit per page, and move hub priority into one `DailyCockpit` composition. Preserve existing hooks, routes, storage keys, typed next-action logic, and host proxy behavior. Add separate SVG favicon assets and a public-only external Study link.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide icons, Playwright, existing editorial primitives.

## Global Constraints

- The public portfolio and personal tracker remain separate products.
- The hub is the command center; child pages are quieter task surfaces.
- The hub exposes one dominant next-action block, one completion ring, and compact anchor details.
- Login, public landing, settings, archive, sharing, and other utility pages do not render the mobile command dock.
- Supported mobile widths are 320px, 390px, and 430px with no horizontal overflow.
- Preserve safe-area padding, keyboard focus visibility, reduced-motion behavior, route semantics, and persisted tracker data.
- Graphite surfaces are primary, acid lime marks action, cyan marks information, and amber marks attention; purple gradients and red rules do not compete as primary signals.
- Do not modify the public portfolio content or personal tracker storage schemas as part of the shell work.

---

### Task 1: Lock the new shell contract with failing tests

**Files:**
- Modify: `e2e/navigation.spec.ts`
- Modify: `e2e/foundation.spec.ts`
- Modify: `e2e/editorial-foundation.spec.ts`
- Modify: `e2e/personal-roadmap.spec.ts`

**Interfaces:**
- Tests consume `data-testid="personal-section-header"`, `data-testid="clock-disclosure"`, `data-testid="hub-next-action"`, `data-testid="hub-anchor-grid"`, and `data-testid="mobile-command-dock"`.
- The shell will expose `data-dock-context="core"` only when the dock is intentionally rendered.

- [ ] **Step 1: Replace obsolete shell assertions.**

Change tests that require a full `chapter-header` on every route so they instead assert the compact section header. Change login/settings/archive/share expectations to assert zero mobile docks. Keep chapter semantics on core action pages only.

- [ ] **Step 2: Add the hub hierarchy assertions.**

Add a test that visits `/hub` at 390px and asserts:

```ts
await expect(page.getByTestId("hub-next-action")).toBeVisible();
await expect(page.getByTestId("daily-momentum-ring")).toBeVisible();
await expect(page.getByTestId("hub-anchor-grid")).toBeVisible();
await expect(page.getByTestId("hub-next-action").locator("a").first()).toBeVisible();
await expect(page.getByTestId("clock-disclosure")).toBeVisible();
await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
```

- [ ] **Step 3: Add the host-specific entry/icon assertions.**

On the portfolio root, assert a `Study` link with `href="https://study.buildora.work"`. On the personal-host request, assert that the Study link is absent. Assert `link[rel="icon"]` resolves to `/icons/buildora.svg` on the public host and `/icons/nova.svg` on the personal host.

- [ ] **Step 4: Run the focused tests and verify they fail for the intended missing selectors.**

Run:

```bash
pnpm run pretest:e2e
pnpm exec playwright test e2e/navigation.spec.ts e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts e2e/personal-roadmap.spec.ts --reporter=line
```

Expected: failures identify the old header/dock/icon/link contract, not build or fixture failures.

- [ ] **Step 5: Commit the failing contract.**

```bash
git add e2e/navigation.spec.ts e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts e2e/personal-roadmap.spec.ts
git commit -m "test(personal): define compact shell hierarchy"
```

### Task 2: Add host-correct favicon assets and the public Study entry

**Files:**
- Create: `public/icons/buildora.svg`
- Create: `public/icons/nova.svg`
- Modify: `src/lib/brand.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `e2e/navigation.spec.ts`
- Modify: `e2e/branding.spec.ts`

**Interfaces:**
- `PORTFOLIO_BRAND.iconPath` is `/icons/buildora.svg`.
- `TRACKER_BRAND.iconPath` is `/icons/nova.svg`.
- `Navbar` adds `{ label: "Study", href: "https://study.buildora.work" }` only for the public surface.

- [ ] **Step 1: Create the two SVG assets.**

Use the existing inline Buildora and simplified NOVA marks as the source geometry. Keep each asset square, self-contained, and readable at 16px. `buildora.svg` uses the public paper/ink palette; `nova.svg` uses the simple cyan/lime NOVA mark.

- [ ] **Step 2: Wire metadata and the explicit head link to the brand icon path.**

Use `brand.iconPath` in `generateMetadata()`. In `RootLayout`, render the same path from `requestBrand()` instead of hardcoding `/icon.svg`. Keep `src/app/icon.svg` as a compatibility fallback, but no host should reference it in rendered metadata.

- [ ] **Step 3: Add the public Study link without changing tracker navigation.**

Build the public menu from the existing `MENU_LIST` plus one external Study item. Keep the current NOVA//OS portal link. Do not add Study to `TRACKER_LINKS` or to the personal mobile dock.

- [ ] **Step 4: Run the branding and navigation tests.**

Run:

```bash
pnpm exec playwright test e2e/navigation.spec.ts e2e/branding.spec.ts --reporter=line
```

Expected: Study appears only on the public root and favicon assertions pass.

- [ ] **Step 5: Commit the entry and favicon slice.**

```bash
git add public/icons/buildora.svg public/icons/nova.svg src/lib/brand.ts src/app/layout.tsx src/components/Navbar.tsx e2e/navigation.spec.ts e2e/branding.spec.ts
git commit -m "feat(portfolio): add study entry and host favicons"
```

### Task 3: Make the shared personal shell compact and context-aware

**Files:**
- Modify: `src/components/trackers/TrackerShell.tsx`
- Modify: `src/components/trackers/ChapterHeader.tsx`
- Modify: `src/components/trackers/WorldClockStrip.tsx`
- Modify: `src/components/trackers/TrackerNavDock.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- `TrackerShell` accepts `showDock?: boolean` with default `true` and passes the value to `TrackerNavDock`.
- `ChapterHeader` renders `data-testid="personal-section-header"` and keeps `data-editorial-chapter="true"` for compatibility.
- `WorldClockStrip` renders `data-testid="clock-disclosure"` and exposes a compact disclosure control with local time visible by default.
- `TrackerNavDock` accepts `showDock?: boolean` and sets `data-dock-context="core"` when rendered.

- [ ] **Step 1: Add the explicit dock contract before changing styles.**

Return `null` from `TrackerNavDock` when `showDock` is false. Keep the existing five destination hrefs for core action pages, but move utility routes behind the existing HeaderMenu/More path rather than adding more dock items.

- [ ] **Step 2: Replace the tall chapter header layout.**

Keep the Hub/back action, section label, title, subtitle, and utility content, but reduce the default vertical spacing and title scale. Use a compact top row for the back/section affordance and a concise title block. Remove the decorative full-width pseudo-rule from the default mobile header.

- [ ] **Step 3: Make clocks compact and progressively disclosed.**

Keep local time, Munich, San Francisco, and seconds. Show local time and date in the default row. Place the two remote clocks in a native `<details>` or equivalent accessible disclosure with `aria-expanded`; ensure the disclosure does not create horizontal overflow.

- [ ] **Step 4: Add the graphite/lime/cyan/amber shell tokens.**

Update only shell selectors in `globals.css`: remove the competing purple/red emphasis from header, dock, action-bar, and telemetry styles; preserve existing focus-visible and reduced-motion rules. Keep safe-area padding on the dock and add a bottom content reserve only when the dock is actually rendered.

- [ ] **Step 5: Run shell tests at all supported widths.**

Run:

```bash
pnpm exec playwright test e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts e2e/personal-roadmap.spec.ts --reporter=line
```

Expected: the compact shell selectors pass and all width assertions remain within 320px, 390px, and 430px.

- [ ] **Step 6: Commit the shared-shell slice.**

```bash
git add src/components/trackers/TrackerShell.tsx src/components/trackers/ChapterHeader.tsx src/components/trackers/WorldClockStrip.tsx src/components/trackers/TrackerNavDock.tsx src/app/globals.css e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts
git commit -m "refactor(personal): compact the tracker shell"
```

### Task 4: Recompose the hub around the single next move

**Files:**
- Modify: `src/app/trackers/page.tsx`
- Modify: `src/components/trackers/DailyCockpit.tsx`
- Modify: `src/components/trackers/ActionQueue.tsx`
- Modify: `src/components/editorial/ActionBlock.tsx`
- Modify: `src/components/trackers/Ring.tsx` only if sizing/accessibility requires it

**Interfaces:**
- `DailyCockpit` keeps the existing `dailyMove`, `momentum`, `actionQueue`, and `weekPulse` data interfaces but renders `data-testid="hub-next-action"` and `data-testid="hub-anchor-grid"` around the primary blocks.
- The existing `buildNextAction()` result remains the only source for the primary action href/title.

- [ ] **Step 1: Move the hub title context into the compact header.**

Use the existing goal title and today date in the section header, but remove duplicate “next move” copy from `goalSummary`. The goal summary becomes a short context line with one `Open goal` link.

- [ ] **Step 2: Make the next-action block dominant.**

Wrap `dailyMove` in `data-testid="hub-next-action"`, preserve the exact `nextAction.href`, and use one primary label such as `Start this move`. Keep `Enter focus` as the only secondary action. Do not introduce a second primary button.

- [ ] **Step 3: Turn the action queue into compact anchor details.**

Render the four existing anchors as a compact grid under the ring, with one-line labels and a short status. Keep completion semantics, hrefs, and `data-testid="action-queue"`; remove the large “Keep the next moves visible” heading that competes with the primary block.

- [ ] **Step 4: Progressive-disclose secondary hub sections.**

Keep recovery cues visible when thresholds require them. Put week pulse, streaks, metric cards, week review, quote, activity, quick links, and setup controls into clearly labeled lower sections with compact spacing. Do not remove data; reduce default visual weight and avoid presenting all sections at the same hierarchy level.

- [ ] **Step 5: Replace the four-input quick-actions wall.**

Keep task and metric logging functional, but group them under a compact `Quick log` control or disclosure. Keep start/end fast and workout links available from the same surface without adding another full card.

- [ ] **Step 6: Verify the hub behavior and mobile hierarchy.**

Run:

```bash
pnpm exec playwright test e2e/command-deck-domain.spec.ts e2e/command-deck.spec.ts e2e/personal-roadmap.spec.ts e2e/focus-sprint.spec.ts --reporter=line
```

Expected: next-action priority, ring calculation, focus entry, weight-loss recovery cue, and mobile overflow behavior remain green.

- [ ] **Step 7: Commit the hub slice.**

```bash
git add src/app/trackers/page.tsx src/components/trackers/DailyCockpit.tsx src/components/trackers/ActionQueue.tsx src/components/editorial/ActionBlock.tsx src/components/trackers/Ring.tsx e2e/command-deck-domain.spec.ts e2e/command-deck.spec.ts e2e/personal-roadmap.spec.ts e2e/focus-sprint.spec.ts
git commit -m "refactor(personal): lead the hub with one next move"
```

### Task 5: Remove dock/header clutter from utility pages

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/archive/page.tsx`
- Modify: `src/app/share/page.tsx`
- Modify: `src/app/shared-with-me/page.tsx`
- Modify: `src/app/motivation/page.tsx`
- Modify: `src/app/trackers/landing/page.tsx` only if its shell needs the compact utility contract
- Modify: `src/app/intermittent-fasting/page.tsx`, `src/app/workout-tracking/page.tsx`, `src/app/goal/page.tsx`, `src/app/todo/page.tsx`, and `src/app/weight-loss/page.tsx` only to pass the explicit dock/page context
- Modify: `e2e/navigation.spec.ts`
- Modify: `e2e/editorial-foundation.spec.ts`

**Interfaces:**
- Utility pages pass `showDock={false}` to `TrackerShell`.
- Core action pages pass `showDock={true}` and retain the Hub back link.

- [ ] **Step 1: Add explicit page-context props instead of pathname heuristics.**

Pass `showDock={false}` on login, settings, archive, share, shared-with-me, motivation, and the public tracker landing. Keep the dock on hub, goal, todo, fasting, workout, and weight-loss pages where quick switching is useful.

- [ ] **Step 2: Keep child-page navigation consistent.**

Ensure core child pages show one compact `Hub` back link and do not repeat hub-only action queues, momentum ring, or world-clock blocks beyond the compact shell utility row.

- [ ] **Step 3: Test the page-context matrix.**

Run:

```bash
pnpm exec playwright test e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts e2e/tracker-actions.spec.ts --reporter=line
```

Expected: utility pages have no dock, core pages have one dock on mobile, and every core page exposes its primary action.

- [ ] **Step 4: Commit the utility-page slice.**

```bash
git add src/app/login/page.tsx src/app/settings/page.tsx src/app/archive/page.tsx src/app/share/page.tsx src/app/shared-with-me/page.tsx src/app/motivation/page.tsx src/app/trackers/landing/page.tsx src/app/intermittent-fasting/page.tsx src/app/workout-tracking/page.tsx src/app/goal/page.tsx src/app/todo/page.tsx src/app/weight-loss/page.tsx e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts e2e/tracker-actions.spec.ts
git commit -m "refactor(personal): scope mobile navigation to action pages"
```

### Task 6: Run the complete personal release gate

**Files:**
- Verify: all modified portfolio files and tests from Tasks 1–5

- [ ] **Step 1: Run static quality checks.**

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm run pretest:e2e
git diff --check
```

- [ ] **Step 2: Run the complete browser suite.**

```bash
pnpm test:e2e -- --reporter=line
```

Expected: all existing and new tests pass, including public-host regression checks.

- [ ] **Step 3: Review the rendered personal routes.**

Use the local production build at 320px, 390px, and 430px to inspect `/hub`, `/login`, `/goal`, `/todo`, `/archive`, `/settings`, and `/motivation`. Confirm the hub leads with the next move, utility pages do not show a dock, and no route has horizontal overflow.

- [ ] **Step 4: Commit any test-only selector corrections as a separate commit.**

```bash
git add e2e
git commit -m "test(personal): finalize shell release coverage"
```

