# NOVA//OS Editorial Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every user-facing route in the repository share the same full-bleed editorial visual language while preserving Vamsi/NOVA//OS identity boundaries, behavior, accessibility, and compatibility.

**Architecture:** Introduce a small set of presentational editorial primitives and semantic design tokens, then compose the existing portfolio, tracker, share, settings, onboarding, login, and focus routes through those primitives. Domain hooks and route actions remain the source of truth; the new components only own composition, copy presentation, and responsive behavior. Feature-engine work such as Momentum weighting, recovery mode, and weekly narrative review is intentionally a follow-up plan after this visual foundation is stable.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, CSS custom properties, `next/font`, Playwright, existing local-first tracker hooks and host proxy.

## Global Constraints

- The repository should feel closer to an interactive editorial publication or game dossier than a conventional SaaS admin panel.
- Full-bleed opening statements replace repeated equal-weight card grids; cards remain for dense controls and secondary details.
- **Archive black `#071014`**, **paper `#F2EEE6`**, **signal cyan `#49E7FF`**, **acid lime `#C8FF3D`**, **anime red `#FF554D`**, **ultraviolet `#8C7DFF`**, **ink `#111111`**, and **mist `#7D8A94`** are semantic roles.
- Typography uses expressive editorial display, readable interface sans, and precise utility mono.
- Portfolio content remains Vamsi Krishna-branded; tracker content remains NOVA//OS-branded.
- Existing local data, share links, backup files, Supabase rows, deep links, and no-sign-in-required local mode remain compatible.
- Important actions have visible labels, icon-only controls have accessible names, keyboard focus remains visible, and reduced motion removes non-essential animation.
- No new runtime dependency or server dependency is needed for this foundation release.

---

## File map

- Create `src/components/editorial/EditorialFrame.tsx` — full-bleed semantic canvas with surface tone, texture, responsive gutters, and `data-surface` hook.
- Create `src/components/editorial/ChapterLabel.tsx` — indexed section label with optional status and timestamp.
- Create `src/components/editorial/DisplayStatement.tsx` — responsive editorial headline with optional accent span.
- Create `src/components/editorial/SignalRule.tsx` — semantic rule/progress strip with accessible label support.
- Create `src/components/editorial/ActionBlock.tsx` — primary action plus explanation and optional secondary action.
- Create `src/components/editorial/TelemetryLine.tsx` — compact utility metadata row.
- Create `src/components/editorial/EditorialGrid.tsx` — controlled responsive grid for secondary content only.
- Modify `src/app/globals.css` — add semantic color/type/layout tokens, editorial surfaces, texture utilities, focus styles, and reduced-motion behavior.
- Modify `src/components/Navbar.tsx` — use the editorial index rail and retain host-aware identity.
- Modify `src/components/Footer.tsx` — use the shared editorial footer signature and host-aware identity.
- Modify `src/components/trackers/TrackerShell.tsx` — use `EditorialFrame`, `ChapterLabel`, and `TelemetryLine` while preserving tracker links and action slots.
- Modify `src/components/trackers/ChapterHeader.tsx` — compose shared chapter primitives rather than duplicating typography rules.
- Modify `src/components/trackers/StoryPanel.tsx` and `src/components/trackers/SignalPanel.tsx` — recompose existing secondary panels into editorial blocks.
- Modify `src/components/motivation/FocusScene.tsx` — align full-screen focus layout with the shared transmission language.
- Modify `src/components/Questionnaire.tsx` and `src/components/auth/RequireAuth.tsx` — use the entry-sequence layout.
- Modify `src/components/InstallPrompt.tsx` — use the editorial action block.
- Modify `src/app/page.tsx`, `src/components/pages/About.tsx`, `src/components/pages/Experience.tsx`, `src/components/pages/Projects.tsx`, `src/components/pages/Skills.tsx`, and `src/components/pages/Contact.tsx` — compose the public dossier using shared primitives without changing content or API behavior.
- Modify `src/app/trackers/page.tsx`, `src/app/share/page.tsx`, `src/app/shared-with-me/page.tsx`, `src/app/settings/page.tsx`, and `src/app/login/page.tsx` — migrate route composition to the shared foundation.
- Modify `e2e/foundation.spec.ts`, `e2e/reduced-motion.spec.ts`, `e2e/navigation.spec.ts`, and create `e2e/editorial-foundation.spec.ts` — verify visual language contracts, identity boundaries, responsive structure, and motion behavior.
- Modify `README.md` and `CHANGELOG.md` — document the shared editorial foundation and its compatibility promise.

## Test commands

- Focused foundation tests: `pnpm exec playwright test e2e/editorial-foundation.spec.ts e2e/foundation.spec.ts e2e/reduced-motion.spec.ts`
- Portfolio/tracker boundary: `pnpm exec playwright test e2e/navigation.spec.ts e2e/branding.spec.ts`
- Full browser suite: `pnpm exec playwright test`
- Static gates: `pnpm lint && pnpm build`

---

### Task 1: Define editorial primitives and visual contracts

**Files:**
- Create: `src/components/editorial/EditorialFrame.tsx`
- Create: `src/components/editorial/ChapterLabel.tsx`
- Create: `src/components/editorial/DisplayStatement.tsx`
- Create: `src/components/editorial/SignalRule.tsx`
- Create: `src/components/editorial/ActionBlock.tsx`
- Create: `src/components/editorial/TelemetryLine.tsx`
- Create: `src/components/editorial/EditorialGrid.tsx`
- Modify: `src/app/globals.css`
- Create: `e2e/editorial-foundation.spec.ts`

**Interfaces:**
- `EditorialFrame({ surface, children, className }: { surface: "archive" | "paper" | "ink"; children: React.ReactNode; className?: string })` renders a semantic `<section data-surface={surface}>`.
- `ChapterLabel({ index, eyebrow, status, className }: { index?: string; eyebrow: string; status?: string; className?: string })` renders utility metadata in the project’s mono face.
- `DisplayStatement({ children, accent, as, className }: { children: React.ReactNode; accent?: React.ReactNode; as?: "h1" | "h2" | "p"; className?: string })` renders one dominant statement.
- `SignalRule({ value, label, className }: { value?: number; label?: string; className?: string })` renders an optional accessible progress indicator.
- `ActionBlock({ eyebrow, title, description, primary, secondary }: { eyebrow?: string; title: string; description?: string; primary: React.ReactNode; secondary?: React.ReactNode })` renders the single-action composition.
- `TelemetryLine({ items }: { items: Array<{ label: string; value: React.ReactNode }> })` renders a responsive metadata row.
- `EditorialGrid({ children, className }: { children: React.ReactNode; className?: string })` renders a grid intended for secondary modules.

- [ ] **Step 1: Write failing primitive contract tests**

Add component-level browser assertions to `e2e/editorial-foundation.spec.ts` through an existing route that will render the primitives:

```ts
import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("editorial foundation exposes semantic surfaces and an action hierarchy", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(page.locator('[data-surface="archive"]')).toBeVisible();
  await expect(page.locator("[data-editorial-kicker]").first()).toBeVisible();
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await expect(page.locator("[data-editorial-telemetry]").first()).toBeVisible();
});

test("portfolio uses the paper editorial surface without changing identity", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-surface="paper"]')).toBeVisible();
  await expect(page).toHaveTitle(/Vamsi Krishna/i);
  await expect(page.locator("body")).toContainText("Vamsi Krishna");
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts`.

Expected: FAIL because the current route tree does not expose the new data attributes or shared primitives.

- [ ] **Step 3: Add semantic design tokens and reduced-motion rules**

In `src/app/globals.css`, add the named color roles as CSS variables, define editorial surface classes, and add these behavior hooks:

```css
:root {
  --nova-archive: #071014;
  --nova-paper: #f2eee6;
  --nova-cyan: #49e7ff;
  --nova-lime: #c8ff3d;
  --nova-red: #ff554d;
  --nova-violet: #8c7dff;
  --nova-ink: #111111;
  --nova-mist: #7d8a94;
}

[data-surface="archive"] { background: var(--nova-archive); color: #f7fbff; }
[data-surface="paper"] { background: var(--nova-paper); color: var(--nova-ink); }
[data-editorial-action] { position: relative; isolation: isolate; }

@media (prefers-reduced-motion: reduce) {
  [data-editorial-reveal], [data-editorial-action]::after { animation: none !important; transition: none !important; transform: none !important; }
}
```

Preserve the project’s existing variables and classes; map old utility names to the new semantic roles instead of removing selectors used by existing routes.

- [ ] **Step 4: Implement the primitives with accessible markup**

Each primitive must have one responsibility. Use `section`, `header`, `h1`/`h2`, `p`, and `dl`/`div` semantics appropriate to the content. `ActionBlock` must render a visible primary action without relying on hover. `SignalRule` must expose `role="progressbar"` only when `value` is provided and clamp numeric values between 0 and 100.

- [ ] **Step 5: Render the primitives on the tracker and portfolio entry routes**

Add an archive `EditorialFrame` and a paper `EditorialFrame` to the existing route entry composition, with `data-editorial-kicker`, `data-editorial-action`, and `data-editorial-telemetry` hooks. Keep the current domain content and actions; this step only provides the shared structure.

- [ ] **Step 6: Run the focused tests and lint**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts` and `pnpm lint`.

Expected: both primitive contract tests pass and lint exits 0.

- [ ] **Step 7: Commit the foundation primitives**

```bash
git add src/components/editorial src/app/globals.css e2e/editorial-foundation.spec.ts
git commit -m "feat: add nova os editorial primitives"
```

---

### Task 2: Recompose shared navigation, footer, and tracker shell

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/trackers/TrackerShell.tsx`
- Modify: `src/components/trackers/ChapterHeader.tsx`
- Modify: `src/components/trackers/StoryPanel.tsx`
- Modify: `src/components/trackers/SignalPanel.tsx`
- Modify: `e2e/foundation.spec.ts`
- Modify: `e2e/navigation.spec.ts`

**Interfaces:**
- Consumes the primitives from Task 1.
- Preserves `NOVA//OS` tracker wordmark, Vamsi portfolio wordmark, route links, auth controls, theme toggle, mobile command dock, footer navigation, and host-aware metadata.

- [ ] **Step 1: Add failing shell assertions**

Extend `e2e/editorial-foundation.spec.ts`:

```ts
test("tracker shell reads as one editorial chapter", async ({ page }) => {
  await seed(page);
  await page.goto("/todo");
  await expect(page.getByTestId("chapter-header")).toHaveAttribute("data-editorial-chapter", "true");
  await expect(page.locator("[data-editorial-index]").first()).toBeVisible();
  await expect(page.locator("footer")).toContainText("Your next chapter, in motion.");
});

test("desktop and mobile shells keep the primary action visible", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
});
```

- [ ] **Step 2: Run the shell assertions and verify RED**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts -g "editorial chapter|primary action"`.

Expected: FAIL because the current shared shell does not expose the new chapter/index/action contracts.

- [ ] **Step 3: Recompose the tracker shell**

Wrap the existing `TrackerShell` content in archive `EditorialFrame`, replace duplicated eyebrow/date markup with `ChapterLabel` and `TelemetryLine`, and set `data-editorial-chapter="true"` on `ChapterHeader`. Keep the current `TrackerNavDock` placement and bottom spacing so mobile content is not obscured.

- [ ] **Step 4: Recompose navigation and footer as editorial utility**

Keep host-aware identities and routes, but make desktop navigation a slim indexed rail with an intentional active rule. Make the footer a quiet signature with a paper/archive-aware border and no generic technology line on tracker surfaces. Preserve the portfolio portal link and tracker `NOVA//OS` label.

- [ ] **Step 5: Recompose secondary panels without changing domain behavior**

Use `EditorialGrid`, `TelemetryLine`, and `SignalRule` inside `StoryPanel` and `SignalPanel`. Keep all existing props, text values that are not product branding, and action callbacks unchanged.

- [ ] **Step 6: Run shell and regression tests**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts e2e/foundation.spec.ts e2e/navigation.spec.ts e2e/reduced-motion.spec.ts`.

Expected: all tests pass at desktop and mobile viewport sizes.

- [ ] **Step 7: Commit shared shell composition**

```bash
git add src/components/Navbar.tsx src/components/Footer.tsx src/components/trackers e2e/editorial-foundation.spec.ts e2e/foundation.spec.ts e2e/navigation.spec.ts
git commit -m "feat: recompose nova os shared shell"
```

---

### Task 3: Recompose the portfolio as the Public Dossier

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/pages/About.tsx`
- Modify: `src/components/pages/Experience.tsx`
- Modify: `src/components/pages/Projects.tsx`
- Modify: `src/components/pages/Skills.tsx`
- Modify: `src/components/pages/Contact.tsx`
- Modify: `e2e/editorial-foundation.spec.ts`
- Modify: `e2e/navigation.spec.ts`

**Interfaces:**
- Consumes Task 1 primitives and Task 2 shared shell.
- Preserves portfolio section ids `About`, `Experience`, `Projects`, `Skills`, and `Contact`, resume content, contact API contract, and Vamsi metadata.

- [ ] **Step 1: Add failing Public Dossier assertions**

Add:

```ts
test("portfolio presents indexed dossier chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-public-dossier]")).toBeVisible();
  await expect(page.locator("[data-chapter-index='00']")).toBeVisible();
  await expect(page.locator("[data-chapter-index='01']")).toBeVisible();
  await expect(page.locator("[data-chapter-index='02']")).toBeVisible();
  await expect(page.locator("[data-chapter-index='03']")).toBeVisible();
  await expect(page.locator("[data-chapter-index='04']")).toBeVisible();
  await expect(page.locator("body")).toContainText("Vamsi Krishna");
});
```

- [ ] **Step 2: Run the portfolio assertion and verify RED**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts -g "Public Dossier"`.

Expected: FAIL because the current sections do not expose a shared dossier root or indexed chapter attributes.

- [ ] **Step 3: Convert the hero to a full-bleed dossier opening**

Use a paper `EditorialFrame` with `data-public-dossier`, an indexed `ChapterLabel` for chapter `00`, a `DisplayStatement` for the name/role thesis, one primary work/contact action, and a subtle utility index. Keep the existing content and links; change only composition and visual hierarchy.

- [ ] **Step 4: Convert each section into an indexed chapter**

Wrap About, Experience, Projects, Skills, and Contact with a shared chapter index and editorial rule. Use `EditorialGrid` only for secondary project/experience details. Do not remove or rename existing anchor ids or change the contact submission behavior.

- [ ] **Step 5: Add responsive dossier behavior**

At widths below 768px, stack the visual statement and details vertically, keep the chapter index visible, collapse the desktop index rail into the existing mobile menu, and ensure the primary contact/work action remains in the first viewport.

- [ ] **Step 6: Run portfolio and host-boundary tests**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts e2e/navigation.spec.ts`.

Expected: portfolio identity and route boundaries remain green, including the tracker portal link and portfolio-host redirect.

- [ ] **Step 7: Commit Public Dossier composition**

```bash
git add src/app/page.tsx src/components/pages e2e/editorial-foundation.spec.ts e2e/navigation.spec.ts
git commit -m "feat: compose public portfolio dossier"
```

---

### Task 4: Recompose tracker entry, share, settings, login, onboarding, and focus surfaces

**Files:**
- Modify: `src/app/trackers/page.tsx`
- Modify: `src/app/share/page.tsx`
- Modify: `src/app/shared-with-me/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/Questionnaire.tsx`
- Modify: `src/components/auth/RequireAuth.tsx`
- Modify: `src/components/InstallPrompt.tsx`
- Modify: `src/components/motivation/FocusScene.tsx`
- Modify: `e2e/command-deck.spec.ts`
- Modify: `e2e/share.spec.ts`
- Modify: `e2e/motivation-focus.spec.ts`
- Modify: `e2e/editorial-foundation.spec.ts`

**Interfaces:**
- Consumes shared primitives and shell.
- Preserves all current tracker hooks, share access modes, email allowlists, expiry choices, image limits, PWA install behavior, backup controls, focus mode, and local-only mode.

- [ ] **Step 1: Add failing route-composition assertions**

Add:

```ts
test("product routes use distinct editorial chapters", async ({ page }) => {
  await seed(page);
  for (const route of ["/trackers", "/share", "/shared-with-me", "/settings", "/login", "/motivation"]) {
    await page.goto(route);
    await expect(page.locator("[data-editorial-chapter]").first()).toBeVisible();
    await expect(page.locator("[data-editorial-kicker]").first()).toBeVisible();
  }
});

test("share limits remain visible near the dispatch action", async ({ page }) => {
  await seed(page);
  await page.goto("/share");
  await expect(page.getByText("Storage limits")).toBeVisible();
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await expect(page.locator("body")).toContainText("50");
});
```

- [ ] **Step 2: Run route assertions and verify RED**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts -g "distinct editorial|share limits"`.

Expected: FAIL because several routes still use independent card-first composition.

- [ ] **Step 3: Convert tracker home to the first transmission surface**

Keep current metrics and quick actions but place them inside an archive `EditorialFrame`: one dominant statement, one primary action slot, a compact telemetry band, and an `EditorialGrid` for secondary signal details. Do not implement new adaptive scoring in this task; preserve current values and callbacks.

- [ ] **Step 4: Convert Share into Dispatch Studio composition**

Keep the existing editor state and submit logic. Visually order the screen as compose → audience → expiry → limits → published dispatches. Keep email allowlist and public opt-in controls explicit and nearby. Never hide a hard limit behind a secondary interaction.

- [ ] **Step 5: Convert Shared with me, Settings, and Login into indexed control chapters**

Use chapter labels, section rules, and progressive disclosure. Keep destructive settings isolated. Keep login copy clear that local mode does not require sign-in when Supabase is unconfigured.

- [ ] **Step 6: Convert onboarding, install prompt, and focus scene**

Use the entry-sequence composition for onboarding/install. Use the archive transmission composition for FocusScene, preserving fullscreen fallback, Escape behavior, reduced-motion hooks, and action callbacks.

- [ ] **Step 7: Run route-specific behavior tests**

Run `pnpm exec playwright test e2e/command-deck.spec.ts e2e/share.spec.ts e2e/motivation-focus.spec.ts e2e/editorial-foundation.spec.ts`.

Expected: visual-contract and existing functional tests pass without changes to share/privacy/local-data behavior.

- [ ] **Step 8: Commit product-route composition**

```bash
git add src/app/trackers src/app/share src/app/shared-with-me src/app/settings src/app/login src/components/Questionnaire.tsx src/components/auth/RequireAuth.tsx src/components/InstallPrompt.tsx src/components/motivation/FocusScene.tsx e2e
git commit -m "feat: carry editorial system across product routes"
```

---

### Task 5: Complete motion, responsive, documentation, and release gates

**Files:**
- Modify: `src/app/globals.css`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `e2e/reduced-motion.spec.ts`
- Modify: `e2e/editorial-foundation.spec.ts` only for selector corrections that reflect real behavior

**Interfaces:**
- Verifies all visual composition work without changing domain APIs or persisted data.

- [ ] **Step 1: Add final responsive and reduced-motion assertions**

Add:

```ts
test("editorial shell remains readable at mobile width", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/trackers");
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "visible");
});

test("reduced motion removes non-essential editorial movement", async ({ page }) => {
  await seed(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motivation");
  await expect(page.getByTestId("focus-scene")).toHaveAttribute("data-reduced-motion", "supported");
  const durations = await page.locator("[data-editorial-reveal]").evaluateAll((els) => els.map((el) => getComputedStyle(el).animationDuration));
  expect(durations.every((duration) => duration === "0s" || duration === "0.01ms")).toBeTruthy();
});
```

- [ ] **Step 2: Run the responsive and motion tests and verify RED if coverage is missing**

Run `pnpm exec playwright test e2e/editorial-foundation.spec.ts e2e/reduced-motion.spec.ts`.

Expected: existing hooks may pass, while any missing new data attributes or overflow/motion rules fail visibly and guide the final CSS corrections.

- [ ] **Step 3: Finish the motion system**

Use only `data-editorial-reveal` for non-essential entrance/reveal motion. Keep one dominant choreography per major surface. Add reduced-motion overrides for transforms, transitions, and animation durations without disabling focus indicators or completion feedback.

- [ ] **Step 4: Perform a string and compatibility audit**

Run:

```bash
rg -n "vk:|vk-tracker-suite|NEXT_PUBLIC_SUPABASE|shared_drops|allowed_emails|expires_at|NOVA//OS|Vamsi Krishna" src public README.md CHANGELOG.md
```

Confirm that only intentional compatibility identifiers remain, tracker and portfolio product names are in their correct surfaces, and no share/privacy/local-mode implementation was renamed.

- [ ] **Step 5: Update documentation**

Document the editorial foundation, route expressions, reduced-motion behavior, and the fact that feature-engine work follows as separate releases. Keep the explicit compatibility sentence for `vk:` keys and `vk-tracker-suite`.

- [ ] **Step 6: Run complete release gates**

Run:

```bash
pnpm exec playwright test
pnpm lint
pnpm build
git diff --check
```

Expected: the full browser suite, lint, build, and whitespace checks all exit 0.

- [ ] **Step 7: Review the rendered surfaces**

Inspect `/`, `/trackers`, `/share`, `/settings`, and `/motivation` at desktop and 390×844 Chromium widths. Confirm each page has one dominant statement/action, no accidental horizontal overflow, readable contrast, correct host identity, and no card-grid regression.

- [ ] **Step 8: Commit final foundation release**

```bash
git add src README.md CHANGELOG.md e2e
git commit -m "chore: finalize nova os editorial foundation"
```

## Follow-up plans after this release

The following are intentionally not implemented in this foundation plan and each requires its own design/plan/test cycle:

- Explainable Momentum and goal-weighted scoring.
- Energy mode and deterministic `NextAction` resolution.
- Action handoffs and return context.
- Chapter history and weekly narrative review.
- Streak recovery mode.
- Dispatch Studio interaction upgrades beyond composition.

