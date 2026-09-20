# Personal Operating System Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the personal NOVA//OS surface feel like a daily operating system by improving the command center hierarchy, standardizing tracker actions, and adding a local-first Focus Sprint.

**Architecture:** Keep existing tracker state and local-first sync boundaries. Add a focused `focus-sprint` domain module for pure timer/session calculations, a reusable `FocusSprint` UI component, and a `TrackerActionBar` layout contract consumed by `TrackerShell`. Recompose the hub from existing metrics plus a new action queue and week pulse; do not change public Buildora components or routes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, existing `useSyncedStorage`/`useLocalValue` stores, lucide-react, Playwright.

## Global Constraints

- Work only on personal NOVA//OS routes and shared personal tracker components.
- Do not modify `src/app/page.tsx`, `src/components/pages/*`, `BuildoraMark`, or public portfolio layout/styles.
- Preserve local-first behavior and optional Supabase synchronization through existing storage hooks.
- Focus Sprint must never auto-complete todos, write goal metrics, or create journal entries.
- Keep the existing dark archive palette, cyan/lime signal colors, typography, simple NOVA mark, keyboard focus styles, and reduced-motion behavior.
- Keep the primary action visible on desktop and narrow mobile widths without covering `TrackerNavDock`.
- Every task must add or update behavior tests before implementation and end with its focused test command.
- Release gates: `pnpm lint`, `pnpm run pretest:e2e`, `pnpm exec playwright test`, and `git diff --check`.

---

### Task 1: Add the Focus Sprint domain and storage contract

**Files:**
- Create: `src/lib/focus-sprint.ts`
- Create: `e2e/focus-sprint-domain.spec.ts`

**Interfaces:**
- Produces `FocusSession`, `FocusActiveState`, `FOCUS_PRESETS`, `getFocusElapsedMs`, `getFocusRemainingMs`, `completeFocusSession`, and `focusMinutesForDates`.
- Uses `dateKey` from `src/lib/trackers.ts` for week aggregation.
- Storage keys used by later tasks: `vk:focus:active` and `vk:focus:sessions`.

- [ ] **Step 1: Write the failing domain tests.**

Add Playwright-runner tests covering the exact pure timer contract. This repository does not include a separate unit-test runner, so these tests import the browser-independent module without opening a page:

```ts
import { expect, test } from "@playwright/test";
import {
  FOCUS_PRESETS,
  completeFocusSession,
  focusMinutesForDates,
  getFocusElapsedMs,
  getFocusRemainingMs,
} from "../src/lib/focus-sprint";

test.describe("focus sprint domain", () => {
  test("exposes only the three supported presets", () => {
    expect(FOCUS_PRESETS.map((preset) => preset.minutes)).toEqual([15, 25, 45]);
  });

  test("clamps elapsed and remaining time to the planned duration", () => {
    expect(getFocusElapsedMs({ startedAt: 1_000, plannedMinutes: 15 }, 1_000 + 20 * 60_000)).toBe(15 * 60_000);
    expect(getFocusRemainingMs({ startedAt: 1_000, plannedMinutes: 15 }, 1_000 - 1)).toBe(15 * 60_000);
  });

  test("creates a completed record without changing task or goal data", () => {
    const session = completeFocusSession({ id: "focus_1", label: "Visa checklist", plannedMinutes: 25, startedAt: 1_000 }, 1_000 + 20 * 60_000);
    expect(session).toMatchObject({ id: "focus_1", label: "Visa checklist", status: "completed", durationMinutes: 20 });
  });

  test("aggregates only completed sessions in the requested date range", () => {
    expect(focusMinutesForDates([
      { id: "a", label: "a", plannedMinutes: 15, startedAt: Date.parse("2026-09-20T09:00:00Z"), endedAt: Date.parse("2026-09-20T09:20:00Z"), durationMinutes: 20, status: "completed", createdAt: 1 },
      { id: "b", label: "b", plannedMinutes: 25, startedAt: Date.parse("2026-09-20T10:00:00Z"), endedAt: Date.parse("2026-09-20T10:10:00Z"), durationMinutes: 10, status: "cancelled", createdAt: 1 },
    ], "2026-09-20")).toBe(20);
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails.**

Run: `pnpm exec playwright test e2e/focus-sprint-domain.spec.ts`

Expected: FAIL because `src/lib/focus-sprint.ts` does not exist yet.

- [ ] **Step 3: Implement the pure domain module.**

Define:

```ts
export type FocusMinutes = 15 | 25 | 45;
export type FocusSessionStatus = "completed" | "cancelled";
export type FocusActiveState = {
  id: string;
  label: string;
  plannedMinutes: FocusMinutes;
  startedAt: number;
  pausedAt?: number;
  pausedMs: number;
};
export type FocusSession = {
  id: string;
  label: string;
  plannedMinutes: FocusMinutes;
  startedAt: number;
  endedAt?: number;
  durationMinutes: number;
  status: FocusSessionStatus;
  createdAt: number;
};
```

Use `Math.max`/`Math.min` to clamp elapsed time, round completed duration down to whole minutes with a minimum of one minute for a completed session, and filter aggregation by `dateKey(new Date(session.startedAt))` and `status === "completed"`. Keep the pure functions independent of React and browser globals.

- [ ] **Step 4: Run the focused domain test.**

Run: `pnpm exec playwright test e2e/focus-sprint-domain.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain slice.**

```bash
git add src/lib/focus-sprint.ts e2e/focus-sprint-domain.spec.ts
git commit -m "feat: add focus sprint domain"
```

### Task 2: Build the reusable Focus Sprint component

**Files:**
- Create: `src/components/trackers/FocusSprint.tsx`
- Create: `e2e/focus-sprint.spec.ts`
- Modify: `e2e/helpers.ts` to seed empty focus keys for test isolation

**Interfaces:**
- `FocusSprint` props: `label: string`, `compact?: boolean`, `onCompleted?: (session: FocusSession) => void`.
- Reads/writes `useSyncedStorage<FocusActiveState | null>("focus:active", null)` and `useSyncedStorage<FocusSession[]>("focus:sessions", [])`.
- Uses `useNow(1000)` for the visible clock and the pure functions from Task 1.

- [ ] **Step 1: Add the failing browser tests.**

Cover the user-visible state transitions:

```ts
test("starts, pauses, resumes, and completes a focus sprint", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await page.getByRole("button", { name: /start focus sprint/i }).click();
  await expect(page.getByRole("button", { name: /pause sprint/i })).toBeVisible();
  await page.getByRole("button", { name: /pause sprint/i }).click();
  await expect(page.getByRole("button", { name: /resume sprint/i })).toBeVisible();
  await page.getByRole("button", { name: /finish sprint/i }).click();
  await expect(page.getByText(/focus sprint complete/i)).toBeVisible();
  const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem("vk:focus:sessions") ?? "[]"));
  expect(sessions[0].status).toBe("completed");
});

test("does not complete a todo or change the goal metric", async ({ page }) => {
  const today = todayKey();
  await seed(page, {
    "vk:todos": [{ id: "task_1", text: "Visa checklist", done: false, date: today, priority: "P1", tag: "Goal", createdAt: 1 }],
    "vk:goal": { metricByDay: { [today]: 2 }, milestonesByCategory: {} },
  });
  await page.goto("/trackers");
  await page.getByRole("button", { name: /start focus sprint/i }).click();
  await page.getByRole("button", { name: /finish sprint/i }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vk:todos") ?? "[]")[0].done)).toBe(false);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem("vk:goal") ?? "{}").metricByDay[key], today)).toBe(2);
});
```

Use the component's preset buttons and accessible labels instead of waiting for real time. The test may finish early immediately; the domain module must still record a bounded, non-negative duration.

- [ ] **Step 2: Run the new tests to verify they fail.**

Run: `pnpm exec playwright test e2e/focus-sprint.spec.ts`

Expected: FAIL because the component and hub entry point do not exist.

- [ ] **Step 3: Implement idle and preset selection.**

Render a compact dossier panel with a “Focus sprint” eyebrow, three preset controls, an optional current-label line, and a primary `Start focus sprint` button. Default the label from the `label` prop and default preset to 25 minutes. Add `data-testid="focus-sprint"` and stable button names.

- [ ] **Step 4: Implement running and paused state.**

On start, write an active record with a unique ID and `pausedMs: 0`. On pause, store `pausedAt`; on resume, add the pause duration to `pausedMs`. Render remaining time as `MM:SS`, a progress rail, pause/resume, finish, and cancel controls. Use `aria-live="polite"` for the clock and stop all non-essential motion under reduced motion.

- [ ] **Step 5: Implement completion, cancellation, and persistence failure states.**

Completion appends a bounded session history, clears the active record, invokes `onCompleted`, and shows a short “Focus sprint complete” confirmation. Cancellation clears only the active record and does not append history. If either write fails, leave the live UI running and show a retryable “Not saved yet” state.

- [ ] **Step 6: Run the focused browser tests.**

Run: `pnpm exec playwright test e2e/focus-sprint.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit the component slice.**

```bash
git add src/components/trackers/FocusSprint.tsx e2e/focus-sprint.spec.ts e2e/helpers.ts
git commit -m "feat: add focus sprint controls"
```

### Task 3: Add the shared tracker action bar contract

**Files:**
- Create: `src/components/trackers/TrackerActionBar.tsx`
- Modify: `src/components/trackers/TrackerShell.tsx`
- Modify: `src/app/intermittent-fasting/page.tsx`
- Modify: `src/app/workout-tracking/page.tsx`
- Modify: `src/app/goal/page.tsx`
- Modify: `src/app/todo/page.tsx`
- Modify: `src/app/motivation/page.tsx`
- Modify: `src/app/share/page.tsx`
- Modify: `src/app/shared-with-me/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `e2e/editorial-foundation.spec.ts` or create `e2e/tracker-actions.spec.ts`

**Interfaces:**
- `TrackerShell` gains `actions?: { primary: ReactNode; secondary?: ReactNode }`.
- `TrackerActionBar` accepts the same action object and renders `data-testid="tracker-action-bar"`.
- Route-local controls remain owned by their page; the shell owns only layout and responsive placement.

- [ ] **Step 1: Add action-bar assertions before wiring pages.**

Add a route table test that visits each seeded personal route and asserts the action bar plus a route-specific action label. Use exact names that describe behavior:

```ts
for (const route of [
  ["/intermittent-fasting", /start fast|save routine/i],
  ["/workout-tracking", /log session/i],
  ["/goal", /log today/i],
  ["/todo", /add task/i],
  ["/motivation", /start focus/i],
  ["/share", /create share/i],
  ["/shared-with-me", /review|retry/i],
  ["/settings", /backup|preferences|save/i],
] as const) {
  await page.goto(route[0]);
  await expect(page.getByTestId("tracker-action-bar")).toBeVisible();
  await expect(page.getByTestId("tracker-action-bar").getByRole("button", { name: route[1] }).or(page.getByTestId("tracker-action-bar").getByRole("link", { name: route[1] }))).toBeVisible();
}
```

- [ ] **Step 2: Run the action-bar test to verify it fails.**

Run: `pnpm exec playwright test e2e/tracker-actions.spec.ts`

Expected: FAIL because `TrackerShell` has no action bar.

- [ ] **Step 3: Implement the shared layout.**

Create a compact responsive `TrackerActionBar` with a left “Today’s action” label, primary control, optional secondary control, and `data-editorial-reveal`. Place it directly after `ChapterHeader` and before the route page's main content. Use `flex-wrap`, `min-h-11` controls, and no fixed positioning so it cannot overlap the mobile dock.

- [ ] **Step 4: Wire route-specific actions using existing handlers.**

Use the current route state and handlers rather than adding duplicate business logic:

- fasting: pass the existing start/end or routine-save control; label it from the current phase
- workouts: pass the existing log-session entry control
- goal: pass the existing daily-metric control
- todo: link to `#todo-list` with “Add task” and link completed view as secondary
- motivation: connect “Start focus scene” to the existing `FocusScene` entry and “Write reflection” to the journal section
- share/shared/settings: use their existing create, retry, and export/settings controls

When a page has no single safe immediate mutation, the primary action should navigate to its main editor rather than inventing a second form.

- [ ] **Step 5: Verify action placement at desktop and mobile widths.**

Run: `pnpm exec playwright test e2e/tracker-actions.spec.ts --project=chromium`

Expected: PASS, including visibility without overlap at a 390px viewport.

- [ ] **Step 6: Commit the shared action slice.**

```bash
git add src/components/trackers/TrackerActionBar.tsx src/components/trackers/TrackerShell.tsx src/app/intermittent-fasting/page.tsx src/app/workout-tracking/page.tsx src/app/goal/page.tsx src/app/todo/page.tsx src/app/motivation/page.tsx src/app/share/page.tsx src/app/shared-with-me/page.tsx src/app/settings/page.tsx e2e/tracker-actions.spec.ts
git commit -m "feat: standardize tracker primary actions"
```

### Task 4: Recompose the home command center

**Files:**
- Create: `src/components/trackers/ActionQueue.tsx`
- Create: `src/components/trackers/WeekPulse.tsx`
- Modify: `src/app/trackers/page.tsx`
- Modify: `src/lib/command-deck.ts` if the queue needs a pure action model
- Modify: `e2e/command-deck.spec.ts`
- Modify: `e2e/helpers.ts` to seed focus sessions for pulse assertions

**Interfaces:**
- `ActionQueue` receives rows with `id`, `label`, `detail`, `status`, `href`, and `tone` and emits accessible links/buttons.
- `WeekPulse` receives seven day labels and `{ activityCount, focusMinutes }` values and renders a compact `data-testid="week-pulse"` strip.
- The hub consumes `focusMinutesForDates` from Task 1 and the existing daily metrics.

- [ ] **Step 1: Add failing hub hierarchy tests.**

Extend `e2e/command-deck.spec.ts` to require:

```ts
await expect(page.getByTestId("command-center-brief")).toBeVisible();
await expect(page.getByTestId("action-queue")).toBeVisible();
await expect(page.getByTestId("week-pulse")).toBeVisible();
await expect(page.getByRole("button", { name: /start focus sprint/i })).toBeVisible();
```

Seed one P1 todo, one completed focus session, and a goal metric. Assert the queue includes the todo and the pulse includes the focus minutes.

- [ ] **Step 2: Run the hub tests to verify they fail.**

Run: `pnpm exec playwright test e2e/command-deck.spec.ts`

Expected: FAIL because the new hierarchy test IDs do not exist.

- [ ] **Step 3: Implement `ActionQueue` from pure row data.**

Render one compact row per unfinished anchor: the next priority todo, meal-window/fasting state, workout state, and goal metric state. Each row must have a readable state, a route link, and a left signal rail. If no row is pending, render an actionable “Day is clear” state linking to Motivation or Todo.

- [ ] **Step 4: Implement `WeekPulse` from seven-day values.**

Render seven equal columns with a day label, activity height, and focus-minute label. Use `aria-label` per day, clamp visual heights to 0–100%, and keep the component usable when every value is zero. Do not introduce a charting dependency.

- [ ] **Step 5: Recompose the hub above the fold.**

Create one `command-center-brief` section containing the goal title, compact momentum signal, `nextAction`, and `FocusSprint`. Follow it with `ActionQueue`, `WeekPulse`, and a “Review” section containing the existing streaks, week review, quote, and detailed analytics. Remove the duplicated large ring/SignalPanel pairing from the first screen while preserving the underlying calculations and deep links.

- [ ] **Step 6: Verify the hub and mobile hierarchy.**

Run: `pnpm exec playwright test e2e/command-deck.spec.ts e2e/focus-sprint.spec.ts`

Expected: PASS at desktop and 390px viewport; next action, focus entry, and action queue remain visible before the review section.

- [ ] **Step 7: Commit the hub slice.**

```bash
git add src/components/trackers/ActionQueue.tsx src/components/trackers/WeekPulse.tsx src/app/trackers/page.tsx src/lib/command-deck.ts e2e/command-deck.spec.ts e2e/helpers.ts
git commit -m "feat: reshape personal command center"
```

### Task 5: Connect Focus Sprint to Motivation and weekly review

**Files:**
- Modify: `src/app/motivation/page.tsx`
- Modify: `src/components/motivation/FocusScene.tsx` only for a compact focus entry point if required by its current API
- Modify: `src/lib/trackers.ts` or `src/lib/command-deck.ts` only where the week review needs a pure focus-minute field
- Modify: `e2e/motivation-focus.spec.ts`

**Interfaces:**
- Motivation derives its default sprint label from the same `nextMilestone`/`nextAction` copy already shown in the scene.
- Focus completion updates only `vk:focus:sessions`; motivation visit, favorite, quote, and journal state remain independent.

- [ ] **Step 1: Add the failing integration test.**

In `e2e/motivation-focus.spec.ts`, seed a goal with an unfinished milestone, open `/motivation`, and assert a visible “Start focus sprint” control whose active label references that milestone. Complete the sprint and assert `vk:focus:sessions` has one completed record while `vk:journal` is unchanged.

- [ ] **Step 2: Run the integration test to verify it fails.**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts -g "focus sprint"`

Expected: FAIL because Motivation does not mount `FocusSprint`.

- [ ] **Step 3: Mount a compact Focus Sprint entry under the FocusScene.**

Pass the current next-action label and `compact` mode. Keep the existing realistic motivation media and scene controls unchanged. The sprint should read as a utility connected to the scene, not a second hero.

- [ ] **Step 4: Add focus minutes to the existing weekly review model.**

Extend the pure review input/output only as needed, keeping existing callers backwards-compatible. Display focus minutes as one compact review stat or as the `WeekPulse` tooltip/label; avoid adding another large card.

- [ ] **Step 5: Run the integration tests.**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts e2e/command-deck.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit the motivation integration.**

```bash
git add src/app/motivation/page.tsx src/components/motivation/FocusScene.tsx src/lib/trackers.ts src/lib/command-deck.ts e2e/motivation-focus.spec.ts
git commit -m "feat: connect focus sprint to motivation"
```

### Task 6: Final responsive, accessibility, and release verification

**Files:**
- Modify only files required by test findings from Tasks 1–5.
- Test: `e2e/navigation.spec.ts`, `e2e/branding.spec.ts`, `e2e/editorial-foundation.spec.ts`, `e2e/command-deck.spec.ts`, `e2e/focus-sprint.spec.ts`, `e2e/motivation-focus.spec.ts`, and the full `e2e/` suite.

- [ ] **Step 1: Run lint and type/build validation.**

Run: `pnpm lint && pnpm run pretest:e2e`

Expected: ESLint and the production build pass with no public route changes.

- [ ] **Step 2: Run focused personal UX tests.**

Run: `pnpm exec playwright test e2e/command-deck.spec.ts e2e/tracker-actions.spec.ts e2e/focus-sprint.spec.ts e2e/motivation-focus.spec.ts e2e/navigation.spec.ts`

Expected: PASS, including the public logo guard and personal-only simplified NOVA mark behavior.

- [ ] **Step 3: Inspect mobile and desktop renderings.**

Use Playwright at 1280px and 390px widths for `/trackers`, `/todo`, `/motivation`, and `/shared-with-me`. Confirm the action bar, focus controls, queue rows, and bottom dock have no overlap, clipped labels, or excess empty viewport space.

- [ ] **Step 4: Run the full suite and diff checks.**

Run: `pnpm exec playwright test && git diff --check`

Expected: all tests pass and Git reports no whitespace errors.

- [ ] **Step 5: Review scope and status.**

Run: `git status --short` and `git diff --stat HEAD~5..HEAD`. Confirm only personal surface files, tests, and the approved design/plan docs changed; `.freebuff/` and `.superpowers/` remain untracked and untouched.

- [ ] **Step 6: Commit any final corrections.**

```bash
git add src/lib/focus-sprint.ts src/components/trackers/FocusSprint.tsx src/components/trackers/TrackerActionBar.tsx src/components/trackers/TrackerShell.tsx src/components/trackers/ActionQueue.tsx src/components/trackers/WeekPulse.tsx src/components/motivation/FocusScene.tsx src/app/trackers/page.tsx src/app/motivation/page.tsx src/app/intermittent-fasting/page.tsx src/app/workout-tracking/page.tsx src/app/goal/page.tsx src/app/todo/page.tsx src/app/share/page.tsx src/app/shared-with-me/page.tsx src/app/settings/page.tsx src/lib/trackers.ts src/lib/command-deck.ts e2e/focus-sprint-domain.spec.ts e2e/focus-sprint.spec.ts e2e/tracker-actions.spec.ts e2e/command-deck.spec.ts e2e/motivation-focus.spec.ts e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts
git commit -m "fix: polish personal operating system responsive states"
```
