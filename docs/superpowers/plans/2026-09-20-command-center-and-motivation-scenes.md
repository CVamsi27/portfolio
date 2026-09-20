# Command Center and Motivation Scenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the personal NOVA//OS hub feel like a compact daily cockpit and make Motivation imagery and scenes specific to the selected goal category and destination.

**Architecture:** Preserve the current local-first stores, `TrackerShell`, `ActionQueue`, `WeekPulse`, `FocusSprint`, and `MotivationMedia` contracts. Extract only the presentation boundary needed to reduce hub repetition, add category/destination context to the media contract, and let `FocusScene` render that context without owning fetching or persistence.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, existing synced-storage hooks, Wikimedia Commons API, Unsplash fallbacks, lucide-react, Playwright.

## Global Constraints

- Work only on `personal.buildora.work` routes and personal components.
- Do not modify `src/app/page.tsx`, `src/components/pages/*`, `BuildoraMark`, or public portfolio layout/styles.
- Keep the dark archive palette, cyan/lime/red signals, NOVA mark, editorial typography, keyboard focus, and reduced-motion behavior.
- Keep the primary daily action visible within the first viewport on desktop and mobile.
- Use existing local-first stores; do not add server-side analytics or account tables.
- Motivation media must retain a safe HTTPS URL, useful alt text, attribution, and a source link when available.
- Focus Sprint must not complete todos, milestones, or goal metrics automatically.
- Release gates are `pnpm lint`, `pnpm run pretest:e2e`, `pnpm exec playwright test`, and `git diff --check`.

---

### Task 1: Add a compact daily cockpit view model

**Files:**
- Create: `src/components/trackers/DailyCockpit.tsx`
- Modify: `src/app/trackers/page.tsx`
- Modify: `src/components/trackers/ActionQueue.tsx`
- Test: `e2e/command-deck.spec.ts`

**Interfaces:**
- `DailyCockpit` accepts `nextAction`, `nextActionHref`, `nextActionSummary`, `actionQueue: ActionQueueRow[]`, `weekPulse: WeekPulseDay[]`, `momentum: { percent: number; segments: RingSegment[]; legend: Array<{ label: string; value: number; color: string; detail: string }> }`, and `focusLabel`.
- It renders the daily move, `FocusSprint`, compact momentum, `ActionQueue`, and `WeekPulse` in a stable order.
- It does not read or write storage; `/trackers/page.tsx` remains the owner of derived store data and handlers.

- [ ] **Step 1: Write the failing hierarchy assertions.**

Extend `e2e/command-deck.spec.ts` with seeded data and assert the section order:

```ts
const order = await page.locator('[data-testid="command-center-brief"], [data-testid="action-queue"], [data-testid="week-pulse"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-testid")));
expect(order).toEqual(["command-center-brief", "action-queue", "week-pulse"]);
await expect(page.getByTestId("action-queue").getByText("Collect visa documents")).toBeVisible();
```

Seed a completed task and assert it remains discoverable but visually quieter:

```ts
await expect(page.getByTestId("action-queue").getByText("Completed task")).toHaveClass(/line-through/);
```

- [ ] **Step 2: Run the focused test and verify the new boundary is absent.**

Run: `pnpm exec playwright test e2e/command-deck.spec.ts`

Expected: existing coverage passes while the new cockpit/completed-row assertions fail.

- [ ] **Step 3: Implement `DailyCockpit` and move the hub's above-the-fold JSX into it.**

Use a stable structure with a two-column desktop grid, a stacked mobile flow, `data-testid="command-center-brief"`, and `items-start` so the daily panel cannot stretch to match the taller review column. Keep the current primary labels and destinations. Keep `ActionQueue` and `WeekPulse` outside the brief section so their DOM order is stable.

- [ ] **Step 4: Compact completed queue rows without removing their links.**

In `ActionQueue.tsx`, add `data-complete={row.complete ? "true" : "false"}` and apply reduced opacity/background emphasis only when complete. Keep the accessible `Open ${row.label}` link present.

- [ ] **Step 5: Run the hub tests.**

Run: `pnpm exec playwright test e2e/command-deck.spec.ts e2e/onboarding-hub.spec.ts`

Expected: PASS for seeded state, fresh empty state, queue order, completed-row emphasis, and focus entry point.

- [ ] **Step 6: Commit the daily cockpit slice.**

```bash
git add src/components/trackers/DailyCockpit.tsx src/components/trackers/ActionQueue.tsx src/app/trackers/page.tsx e2e/command-deck.spec.ts
git commit -m "feat: tighten personal daily cockpit"
```

### Task 2: Add category-aware motivation media rationale

**Files:**
- Modify: `src/lib/motivation-media.ts`
- Modify: `src/app/api/motivation-media/route.ts`
- Test: `e2e/motivation-settings.spec.ts`
- Test: `e2e/motivation-focus.spec.ts`

**Interfaces:**
- Extend `MotivationMedia` with `categoryLabel?: string` and `rationale?: string`.
- Add `getMotivationCategoryLabel(category: GoalCategory, country?: string): string`.
- Add `getMotivationRationale(source: MotivationPersonalization, category: GoalCategory, country?: string): string`.
- `fallbackMotivationMedia` and `resolveMotivationMedia` return both fields deterministically.
- The API returns both fields alongside the existing `keywords` array.

- [ ] **Step 1: Write failing media assertions.**

Add pure assertions:

```ts
expect(getMotivationCategoryLabel("relocation", "Germany")).toBe("Germany relocation");
expect(getMotivationRationale("goal", "relocation", "Germany")).toContain("Germany");
```

Add a routed Motivation test that verifies `category=relocation` and `country=Germany`, then returns a response containing `categoryLabel` and `rationale`.

- [ ] **Step 2: Run focused media tests and verify failure.**

Run: `pnpm exec playwright test e2e/motivation-settings.spec.ts e2e/motivation-focus.spec.ts`

Expected: FAIL because the helpers and media fields do not exist.

- [ ] **Step 3: Implement deterministic category labels and rationale.**

Use labels `Relocation`, `Fitness`, `Career`, `Learning`, `Financial progress`, and `Personal progress`. For a valid relocation country return `${country} relocation`; otherwise return the category label. Rationale should use plain language, for example `A real view of Germany keeps the next chapter visible.`.

- [ ] **Step 4: Attach metadata to fallback, resolved, and API media.**

Call the helpers from `fallbackMotivationMedia` and `resolveMotivationMedia`. Preserve safe URL normalization and provider attribution. Add fields to the API JSON without changing query validation.

- [ ] **Step 5: Run focused media tests.**

Run: `pnpm exec playwright test e2e/motivation-settings.spec.ts e2e/motivation-focus.spec.ts`

Expected: PASS for destination query, category fallback, attribution, API failure, and remote-image failure behavior.

- [ ] **Step 6: Commit the media contract slice.**

```bash
git add src/lib/motivation-media.ts src/app/api/motivation-media/route.ts e2e/motivation-settings.spec.ts e2e/motivation-focus.spec.ts
git commit -m "feat: explain motivation media context"
```

### Task 3: Refine the Motivation scene hierarchy

**Files:**
- Modify: `src/components/motivation/FocusScene.tsx`
- Modify: `src/app/motivation/page.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/motivation-focus.spec.ts`

**Interfaces:**
- Extend `FocusSceneProps` with `categoryLabel?: string` and `rationale?: string`.
- `MotivationPage` passes `media.categoryLabel` and `media.rationale`; no new storage keys are added.

- [ ] **Step 1: Write failing scene assertions.**

Add:

```ts
await expect(page.getByTestId("focus-media-rationale")).toContainText("real");
await expect(page.getByTestId("focus-scene-category")).toContainText(/relocation|germany/i);
```

Keep the narrow viewport check and assert the document scroll width stays at most 390 pixels.

- [ ] **Step 2: Run scene tests and verify failure.**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts`

Expected: FAIL because `FocusScene` does not render the new metadata.

- [ ] **Step 3: Render scene metadata in the existing hierarchy.**

Render the category label in the image overlay and a short rationale near the next-action rail:

```tsx
<span data-testid="focus-scene-category" className="focus-scene__eyebrow">Scene // {categoryLabel ?? goalLabel}</span>
<p data-testid="focus-media-rationale" className="focus-scene__rationale">{rationale}</p>
```

Keep image attribution visible, keep `Start next action` before secondary media controls in DOM order, and keep the rationale factual rather than promotional.

- [ ] **Step 4: Tighten responsive scene spacing.**

Adjust only motivation scene selectors in `src/app/globals.css`: reduce narrow-screen grid padding, cap the media panel height on mobile while preserving `object-fit: cover`, keep image labels inside bounds, and disable image-scale/progress transitions under reduced motion. Preserve desktop split and fullscreen minimum height.

- [ ] **Step 5: Run the focused scene suite.**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts e2e/reduced-motion.spec.ts`

Expected: PASS for metadata, image fallback, fullscreen fallback, mobile width, refresh, Focus Sprint, and reduced motion.

- [ ] **Step 6: Commit the scene slice.**

```bash
git add src/components/motivation/FocusScene.tsx src/app/motivation/page.tsx src/app/globals.css e2e/motivation-focus.spec.ts
git commit -m "feat: sharpen category motivation scenes"
```

### Task 4: Integrate and verify personal/public boundaries

**Files:**
- Modify only if needed: `e2e/navigation.spec.ts`, `e2e/command-deck.spec.ts`, `e2e/motivation-settings.spec.ts`

**Interfaces:**
- Consumes the `DailyCockpit` and `MotivationMedia` contracts from Tasks 1–3.
- Produces a green responsive regression suite and public-root guard.

- [ ] **Step 1: Run lint and the local production build.**

Run: `pnpm lint` and `pnpm run pretest:e2e`.

Expected: ESLint and the blank-Supabase production build pass.

- [ ] **Step 2: Run the full browser suite.**

Run: `pnpm exec playwright test`.

Expected: all tests pass, including public-root assertions that `/` does not render personal tracker surfaces or the NOVA personal mark.

- [ ] **Step 3: Perform visual QA at desktop and mobile widths.**

Use the local production server and capture `/trackers` and `/motivation` at 1280×900 and 390×844. Confirm the first action is visible without excessive empty space, completed queue rows are quieter but discoverable, Germany imagery is labeled and attributed, fallback preserves scene layout, and the mobile dock never covers the primary action.

- [ ] **Step 4: Run final hygiene checks.**

Run: `git diff --check`, `git status --short`, and `git log --oneline -8`.

Expected: no whitespace errors; only pre-existing untracked `.freebuff/` and `.superpowers/` remain outside product changes.

- [ ] **Step 5: Commit any integration-only test adjustments.**

```bash
git add e2e/navigation.spec.ts e2e/command-deck.spec.ts e2e/motivation-settings.spec.ts
git commit -m "test: verify personal surface boundaries"
```
