# Personal Today Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task with checkpoints.

**Goal:** Reshape the Personal Buildora experience around one next action, a compact progress rail, one up-next cue, and a consistent Today / Focus / Log / More navigation model.

**Architecture:** Keep existing local-storage and synced tracker stores as the source of truth. Add a small Personal navigation model, a shared Personal shell, focused Today components, a fast Log route, and a More route; keep feature pages and public Buildora routes compatible while moving secondary detail out of the Today surface.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, existing local/synced storage hooks, Lucide icons, Playwright.

## Global Constraints

- This work is limited to `personal.buildora.work`; public Buildora routes and styling must remain unchanged.
- `/hub` is the canonical Today route; `/trackers` remains a compatibility route.
- Primary navigation is exactly Today, Focus, Log, and More.
- The mobile dock remains visible while scrolling and must respect the safe-area inset.
- The first layout targets are 320px, 390px, and 430px with no horizontal overflow.
- No violet-to-pink gradients or legacy portfolio accent classes may appear on the Personal surface.
- Existing tracker data, sync behavior, authentication, focus sessions, weight-loss state, goals, archive, and sharing remain compatible.
- Use Space Grotesk for display, Inter for body copy, and IBM Plex Mono for time/status metadata.
- Do not introduce a new persistence layer for this redesign.
- Preserve visible keyboard focus and equivalent reduced-motion behavior.
- Run `pnpm lint`, production build, `git diff --check`, and relevant Playwright coverage before release.

---

## File Map

### New files

- `src/lib/personal-nav.ts` — typed Personal primary and More navigation definitions.
- `src/components/trackers/PersonalShell.tsx` — shared Personal page frame, compact page header, and dock placement.
- `src/components/trackers/TodayHeader.tsx` — compact greeting, date, local clock, Munich clock, and San Francisco clock.
- `src/components/trackers/NextMoveCard.tsx` — one primary action and its context.
- `src/components/trackers/ProgressRail.tsx` — compact momentum and anchor completion display.
- `src/components/trackers/UpNextLane.tsx` — one continuation cue after the current action.
- `src/components/trackers/TodayDetails.tsx` — progressively disclosed secondary Today details.
- `src/components/trackers/LogCapture.tsx` — fast task, weight, workout, fasting, and note entry choices.
- `src/app/log/page.tsx` — authenticated Log destination.
- `src/app/more/page.tsx` — authenticated More destination.
- `e2e/personal-cockpit.spec.ts` — focused shell, hierarchy, navigation, and responsive coverage.

### Existing files to modify

- `src/components/Navbar.tsx` — replace the tracker sitemap with the four primary destinations.
- `src/components/HeaderMenu.tsx` — retain public behavior and make the Personal More entry route-based where needed.
- `src/components/trackers/TrackerNavDock.tsx` — consume typed nav definitions and remain visible on authenticated Personal routes.
- `src/components/trackers/TrackerShell.tsx` — delegate shared page framing to `PersonalShell` while preserving existing callers.
- `src/components/trackers/ChapterHeader.tsx` — support the compact Personal page-header layout without changing public editorial pages.
- `src/components/trackers/WorldClockStrip.tsx` — share clock formatting with `TodayHeader` and keep seconds visible without a large telemetry block.
- `src/app/trackers/page.tsx` — reduce the Today surface to the new hierarchy and move secondary modules into disclosure.
- `src/app/hub/page.tsx` — keep the canonical route export and add a route-level compatibility assertion if needed.
- `src/app/globals.css` — scope the Personal palette and shell layout; remove Personal-only legacy gradient selectors.
- `src/lib/command-deck.ts` — add typed detail/effort metadata for the up-next cue while preserving `buildNextAction` compatibility.
- `src/lib/trackers.ts` — replace long tracker nav groupings with compatibility metadata where existing feature links still need labels/icons.
- `e2e/navigation.spec.ts` — assert the four primary destinations and the new More behavior.
- `e2e/personal-roadmap.spec.ts` — update hub hierarchy, dock count, and mobile assertions.
- `e2e/foundation.spec.ts` — update shell/dock expectations.
- `e2e/editorial-foundation.spec.ts` — update route shell and secondary-page dock expectations.
- `e2e/command-deck.spec.ts` — update selectors for the new NextMoveCard and ProgressRail.
- `e2e/onboarding-hub.spec.ts` — keep onboarding and quick logging assertions compatible with the redesigned Today route.

---

## Task 1: Add the typed Personal navigation model

**Files:**
- Create: `src/lib/personal-nav.ts`
- Modify: `src/lib/trackers.ts`
- Test: `e2e/personal-cockpit.spec.ts`

**Interfaces:**

```ts
export type PersonalPrimaryId = "today" | "focus" | "log" | "more";

export type PersonalNavItem = {
  id: PersonalPrimaryId;
  href: "/hub" | "/motivation" | "/log" | "/more";
  label: "Today" | "Focus" | "Log" | "More";
  short: "Today" | "Focus" | "Log" | "More";
  icon: TrackerIconName;
};

export const PERSONAL_PRIMARY_NAV: readonly PersonalNavItem[];
export const PERSONAL_MORE_NAV: readonly PersonalNavItem[];
export function isPersonalPrimaryPath(pathname: string, href: PersonalNavItem["href"]): boolean;
```

- [ ] **Step 1: Write the failing navigation test.**

Add a Playwright test that seeds local mode, visits `/hub`, and expects exactly
four primary links named Today, Focus, Log, and More. It must also assert that
the old desktop Goal and Weight Loss links are not direct primary links.

```ts
test("personal navigation exposes four execution destinations", async ({ page }) => {
  await seed(page);
  await page.goto("/hub");
  const nav = page.getByTestId("tracker-primary-nav");
  await expect(nav.getByRole("link")).toHaveCount(4);
  await expect(nav.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/hub");
  await expect(nav.getByRole("link", { name: "Focus" })).toHaveAttribute("href", "/motivation");
  await expect(nav.getByRole("link", { name: "Log" })).toHaveAttribute("href", "/log");
  await expect(nav.getByRole("link", { name: "More" })).toHaveAttribute("href", "/more");
});
```

- [ ] **Step 2: Run the focused test to verify it fails.**

Run: `pnpm exec playwright test e2e/personal-cockpit.spec.ts -g "four execution destinations"`

Expected: FAIL because the current primary nav is derived from `TRACKER_PRIMARY_LINKS` and does not contain the four new routes.

- [ ] **Step 3: Implement the typed definitions.**

Create `PERSONAL_PRIMARY_NAV` with the exact four routes and define
`PERSONAL_MORE_NAV` from the existing feature destinations: Goals, Health /
Weight loss, Archive, Sharing, and Settings. Keep fasting and workouts in the
More list, preserving existing links and icons.

Update `src/lib/trackers.ts` only where old feature metadata is needed by
secondary pages. Do not delete existing route constants until all callers have
been migrated.

- [ ] **Step 4: Run the focused test to verify it still fails only on rendering.**

Run the same Playwright command. Expected: the model tests are no longer the
failure source; the Navbar still renders the old arrays.

- [ ] **Step 5: Commit the navigation model.**

```bash
git add src/lib/personal-nav.ts src/lib/trackers.ts e2e/personal-cockpit.spec.ts
git commit -m "refactor(personal): define focused primary navigation"
```

## Task 2: Build the shared Personal shell and navigation

**Files:**
- Create: `src/components/trackers/PersonalShell.tsx`
- Modify: `src/components/trackers/TrackerShell.tsx`
- Modify: `src/components/trackers/ChapterHeader.tsx`
- Modify: `src/components/trackers/TrackerNavDock.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/HeaderMenu.tsx`
- Modify: `src/components/trackers/WorldClockStrip.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/navigation.spec.ts`, `e2e/foundation.spec.ts`, `e2e/editorial-foundation.spec.ts`

**Interfaces:**

```tsx
export default function PersonalShell(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  showBack?: boolean;
  showDock?: boolean;
  badge?: ReactNode;
}): JSX.Element;
```

- [ ] **Step 1: Add failing shell assertions.**

Update navigation tests to require:

- `/hub` has no `.dossier-back-link`.
- `/hub` desktop and mobile navigation expose Today, Focus, Log, More.
- the mobile dock has four links and remains visible after a scroll down and
  back up.
- `/todo`, `/goal`, and `/weight-loss` have a Today link to `/hub`.
- the navbar contains no account email text.

- [ ] **Step 2: Run the shell tests to capture the current failures.**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts`

Expected: failures for the old five-link dock, old primary nav labels, and
the hidden-on-scroll behavior.

- [ ] **Step 3: Implement `PersonalShell`.**

Move the shared `EditorialFrame`, page width, compact header, content spacing,
and dock composition from `TrackerShell` into `PersonalShell`. Keep the shell
surface scoped to `tracker-surface`. `TrackerShell` should delegate to
`PersonalShell` with the existing prop names so feature pages do not all need a
simultaneous rewrite.

Default `showDock` to `true` for authenticated Personal pages. Keep an explicit
`showDock={false}` escape hatch for login/onboarding flows that cannot expose
the Personal navigation.

- [ ] **Step 4: Implement the four-link dock.**

Make `TrackerNavDock` consume `PERSONAL_PRIMARY_NAV`. Remove scroll-direction
state and always render the dock when enabled. Keep `paddingBottom:
env(safe-area-inset-bottom)` and add enough shell bottom padding so the dock
does not cover content. Use `aria-current="page"` and the canonical `/hub`
match for Today.

- [ ] **Step 5: Implement the desktop primary rail.**

In `Navbar`, use `PERSONAL_PRIMARY_NAV` for Personal hosts. Render More as a
normal route link to `/more`; do not expose the long tracker sitemap in the
desktop rail. Keep portfolio navigation behavior unchanged by branching on the
existing host/surface check.

- [ ] **Step 6: Simplify the Personal header and clocks.**

Keep the NOVA mark, auth controls, and theme toggle, but reduce page-header
height and remove the chapter language from the primary Today screen. Reuse
clock formatting from `WorldClockStrip`, showing local, Munich, and San
Francisco times with seconds in compact inline groups. Do not remove the clock
data from feature pages where it remains useful.

- [ ] **Step 7: Scope the visual reset.**

In `globals.css`, define the approved Personal tokens under `.tracker-surface`
using `#102027`, `#F4F0E7`, `#FFFDF8`, `#32B8C8`, `#C9FF4F`, `#68736F`, and
`#DCD6CA`. Remove the Personal-only selector that rewrites legacy
`from-primary/to-fuchsia-500` classes and replace affected Personal component
classes with explicit scoped classes. Leave portfolio tokens and selectors
unchanged.

- [ ] **Step 8: Run shell tests and commit.**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts`

Expected: all updated shell assertions pass.

```bash
git add src/components/trackers/PersonalShell.tsx src/components/trackers/TrackerShell.tsx src/components/trackers/ChapterHeader.tsx src/components/trackers/TrackerNavDock.tsx src/components/Navbar.tsx src/components/HeaderMenu.tsx src/components/trackers/WorldClockStrip.tsx src/app/globals.css e2e/navigation.spec.ts e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts
git commit -m "feat(personal): establish focused navigation shell"
```

## Task 3: Replace the Today dashboard with the focused cockpit

**Files:**
- Create: `src/components/trackers/TodayHeader.tsx`
- Create: `src/components/trackers/NextMoveCard.tsx`
- Create: `src/components/trackers/ProgressRail.tsx`
- Create: `src/components/trackers/UpNextLane.tsx`
- Create: `src/components/trackers/TodayDetails.tsx`
- Modify: `src/components/trackers/DailyCockpit.tsx`
- Modify: `src/lib/command-deck.ts`
- Modify: `src/app/trackers/page.tsx`
- Modify: `src/app/hub/page.tsx`
- Test: `e2e/personal-cockpit.spec.ts`, `e2e/command-deck.spec.ts`, `e2e/personal-roadmap.spec.ts`, `e2e/onboarding-hub.spec.ts`

**Interfaces:**

```ts
export type UpNextCue = {
  title: string;
  detail: string;
  href: string;
  effortMinutes?: number;
  kind: NextActionKind;
};

export function buildUpNextCue(input: {
  nextAction: NextAction;
  recoveryCue?: { title: string; detail: string; href: string };
  nextMilestone?: string;
}): UpNextCue;
```

```tsx
export function NextMoveCard(props: {
  action: NextAction;
  summary: string;
  primaryLabel: string;
  onPrimary?: () => void;
}): JSX.Element;

export function ProgressRail(props: {
  percent: number;
  completed: number;
  total: number;
  label?: string;
}): JSX.Element;

export function UpNextLane(props: { cue: UpNextCue | null }): JSX.Element;
```

- [ ] **Step 1: Write failing Today hierarchy tests.**

Add tests that seed a normal user and assert `/hub` contains, in order:

1. `today-header`
2. `next-move-card`
3. `progress-rail`
4. `up-next-lane`

Also assert that the old always-visible `action-queue`, streak row, weekly
review, and large ring are absent from the default Today view. Existing data
must still be available under a `Today details` disclosure.

```ts
test("Today leads with one move and one continuation cue", async ({ page }) => {
  await seed(page);
  await page.goto("/hub");
  await expect(page.getByTestId("today-header")).toBeVisible();
  await expect(page.getByTestId("next-move-card")).toBeVisible();
  await expect(page.getByTestId("progress-rail")).toBeVisible();
  await expect(page.getByTestId("up-next-lane")).toBeVisible();
  await expect(page.getByTestId("action-queue")).toHaveCount(0);
  await expect(page.getByTestId("daily-momentum-ring")).toHaveCount(0);
  await expect(page.getByTestId("today-details")).toBeVisible();
});
```

- [ ] **Step 2: Run the focused test to verify failure.**

Run: `pnpm exec playwright test e2e/personal-cockpit.spec.ts -g "one move and one continuation"`

Expected: FAIL because the current hub renders the old cockpit and action queue.

- [ ] **Step 3: Add `buildUpNextCue` without changing next-action priority.**

Keep `buildNextAction` as the source of truth for the current move. Add a pure
helper that chooses the next continuation cue in this order: recovery cue,
next incomplete milestone, weekly commitment, then the current action’s
fallback. It must return a stable `kind`, `href`, and readable detail. Add
tests in `e2e/command-deck.spec.ts` using the existing domain helper style for
weight-loss recovery, milestones, and generic todo fallback.

- [ ] **Step 4: Implement the four Today components.**

`TodayHeader` renders the compact date/greeting and seconds clocks. It should
reuse one clock formatter and preserve a stable layout while the first client
timestamp hydrates.

`NextMoveCard` renders the current typed action, a one-sentence explanation,
and one primary button. The button must use the existing action href and keep
focus start available for todo/milestone actions.

`ProgressRail` replaces the large SVG/ring block with a semantic
`role="progressbar"`, percent text, completed anchor count, and a single
horizontal rail. It must remain readable at 320px.

`UpNextLane` renders exactly one item with category, effort, and an arrow link;
its empty state gives one setup action.

- [ ] **Step 5: Move secondary Today content behind disclosure.**

`TodayDetails` should use a native `<details>` element or an equivalent
accessible disclosure. Move WeekPulse, streaks, metrics, week review, recent
activity, and secondary links inside it. Do not delete their calculations or
feature links; they are simply not part of the first viewport.

- [ ] **Step 6: Refactor the hub page.**

Keep existing store migrations, quick logging compatibility, weight-loss
recovery cue, and typed `NextAction` inputs. Replace the current `DailyCockpit`
composition with:

```tsx
<PersonalShell title={...} showBack={false}>
  <TodayHeader ... />
  <NextMoveCard action={nextAction} summary={...} primaryLabel="Start focus" />
  <ProgressRail percent={ringPct} completed={completedAnchors} total={4} />
  <UpNextLane cue={upNextCue} />
  <TodayDetails ... />
</PersonalShell>
```

The existing tracker data remains accessible through the Log and More routes.
Do not render a duplicate “Today’s action” or “Inspiration source” panel on
secondary pages.

- [ ] **Step 7: Run Today tests and commit.**

Run: `pnpm exec playwright test e2e/personal-cockpit.spec.ts e2e/command-deck.spec.ts e2e/personal-roadmap.spec.ts e2e/onboarding-hub.spec.ts`

Expected: the new hierarchy, action derivation, onboarding, recovery cue, and
legacy `/trackers` compatibility tests pass.

```bash
git add src/components/trackers/TodayHeader.tsx src/components/trackers/NextMoveCard.tsx src/components/trackers/ProgressRail.tsx src/components/trackers/UpNextLane.tsx src/components/trackers/TodayDetails.tsx src/components/trackers/DailyCockpit.tsx src/lib/command-deck.ts src/app/trackers/page.tsx src/app/hub/page.tsx e2e/personal-cockpit.spec.ts e2e/command-deck.spec.ts e2e/personal-roadmap.spec.ts e2e/onboarding-hub.spec.ts
git commit -m "feat(personal): focus Today on the next move"
```

## Task 4: Add Log and More destinations

**Files:**
- Create: `src/components/trackers/LogCapture.tsx`
- Create: `src/app/log/page.tsx`
- Create: `src/app/more/page.tsx`
- Modify: `src/lib/personal-nav.ts`
- Modify: `src/app/globals.css`
- Test: `e2e/personal-cockpit.spec.ts`, `e2e/tracker-actions.spec.ts`

**Interfaces:**

```tsx
export type LogCaptureProps = {
  onTaskSaved?: (text: string) => void;
  onNoteSaved?: (text: string) => void;
};

export function LogCapture(props: LogCaptureProps): JSX.Element;
```

- [ ] **Step 1: Write failing Log and More tests.**

Test `/log` for four labeled actions: Task, Weight, Workout, and Note. Test
that entering a task saves it to the existing `vk:todos` shape and that the
Weight and Workout actions link to `/weight-loss` and `/workout-tracking`.
Test `/more` for Goals, Health / Weight loss, Archive, Sharing, and Settings.

- [ ] **Step 2: Run the tests to verify failure.**

Run: `pnpm exec playwright test e2e/personal-cockpit.spec.ts e2e/tracker-actions.spec.ts -g "Log|More|task"`

Expected: FAIL because `/log` and `/more` do not exist.

- [ ] **Step 3: Implement `LogCapture`.**

Use `useTodos` for task capture and the existing navigation for weight/workout.
Use the existing journal/archive-compatible local shape for notes; do not add a
new storage key. Every capture path must show a role-status confirmation and
clear its input after success. Keep empty input disabled and keyboard Enter
support for task and note capture.

- [ ] **Step 4: Implement `/log`.**

Wrap `LogCapture` in `RequireAuth` and `PersonalShell`. Use the compact page
header and keep the four choices above the recent capture list. If fasting is
enabled, expose a fifth Fasting link without making it part of the primary
navigation.

- [ ] **Step 5: Implement `/more`.**

Render one accessible list of links using `PERSONAL_MORE_NAV`, with plain
descriptions such as “Plan milestones and this week’s commitment” and “Review
weight, recovery, and health signals.” Avoid a second grid dashboard.

- [ ] **Step 6: Run tests and commit.**

Run: `pnpm exec playwright test e2e/personal-cockpit.spec.ts e2e/tracker-actions.spec.ts`

Expected: Log capture, More links, and existing tracker action tests pass.

```bash
git add src/components/trackers/LogCapture.tsx src/app/log/page.tsx src/app/more/page.tsx src/lib/personal-nav.ts src/app/globals.css e2e/personal-cockpit.spec.ts e2e/tracker-actions.spec.ts
git commit -m "feat(personal): add focused log and more surfaces"
```

## Task 5: Align secondary pages with the new shell

**Files:**
- Modify: `src/app/goal/page.tsx`
- Modify: `src/app/motivation/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/archive/page.tsx`
- Modify: `src/app/share/page.tsx`
- Modify: `src/app/shared-with-me/page.tsx`
- Modify: `src/app/intermittent-fasting/page.tsx`
- Modify: `src/app/workout-tracking/page.tsx`
- Modify: `src/app/weight-loss/page.tsx`
- Modify: `src/components/trackers/TrackerActionBar.tsx`
- Modify: `e2e/navigation.spec.ts`, `e2e/editorial-foundation.spec.ts`, `e2e/tracker-actions.spec.ts`

- [ ] **Step 1: Add secondary-page shell assertions.**

For each authenticated feature route, assert the page has one Today return
link, the four-link mobile dock, and no duplicated Today action/source panels.
For `/hub`, assert the return link is absent.

- [ ] **Step 2: Run the assertions to identify page-specific conflicts.**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts e2e/tracker-actions.spec.ts`

- [ ] **Step 3: Migrate page headers to the shared compact shell.**

Keep page-specific actions, but remove duplicated oversized header utility rows.
Use `showBack` only on secondary pages. Use `More` for settings, sharing, and
archive entry points rather than adding new top-level rail links.

- [ ] **Step 4: Keep feature functionality unchanged.**

Do not alter focus timing/fullscreen rules, motivation relay/fallback behavior,
weight-loss calculations, archive goal filters, sharing permissions, or synced
storage keys. Only move their entry points and reduce surrounding chrome.

- [ ] **Step 5: Run tests and commit.**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts e2e/tracker-actions.spec.ts e2e/motivation-focus.spec.ts e2e/share.spec.ts e2e/shared-with-me.spec.ts`

Expected: secondary routes retain their existing behavior while sharing the
new shell and navigation.

```bash
git add src/app/goal/page.tsx src/app/motivation/page.tsx src/app/settings/page.tsx src/app/archive/page.tsx src/app/share/page.tsx src/app/shared-with-me/page.tsx src/app/intermittent-fasting/page.tsx src/app/workout-tracking/page.tsx src/app/weight-loss/page.tsx src/components/trackers/TrackerActionBar.tsx e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts e2e/tracker-actions.spec.ts
git commit -m "refactor(personal): align feature pages with the shell"
```

## Task 6: Complete responsive and regression verification

**Files:**
- Modify: `e2e/personal-cockpit.spec.ts`
- Modify: `e2e/personal-roadmap.spec.ts`
- Modify: `e2e/branding.spec.ts`
- Modify: `e2e/navigation.spec.ts`
- Modify: `README.md` if route inventory or Personal navigation documentation is stale

- [ ] **Step 1: Add mobile viewport coverage.**

For widths 320, 390, and 430, visit `/hub`, `/log`, `/more`, `/motivation`,
`/goal`, `/weight-loss`, and `/archive`. Assert:

```ts
await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
```

Also assert the dock remains visible after a 300px downward scroll and does not
cover the last primary action by checking the final content bounding box against
the viewport bottom plus safe-area padding.

- [ ] **Step 2: Add visual-language regression checks.**

Visit Personal routes and assert the rendered HTML does not contain legacy
`to-fuchsia-500` or `from-primary` classes in the tracker surface. Visit the
portfolio root and assert its existing public branding and portal link remain
unchanged.

- [ ] **Step 3: Run the complete local verification gate.**

Run in order:

```bash
pnpm lint
pnpm run pretest:e2e
pnpm run test:e2e
git diff --check
```

Expected: lint, production build, all Playwright tests, and whitespace checks
pass. If the existing local server on port 4111 is stale, stop it and rerun
`pnpm run pretest:e2e` before the Playwright command.

- [ ] **Step 4: Review the final diff for host scope.**

Run:

```bash
git diff --stat origin/main...HEAD
git diff -- src/app/page.tsx src/components/pages src/components/brand
```

Expected: no public landing/page/brand implementation changes beyond tests or
explicitly host-scoped shared code. Any shared change must have a
`.tracker-surface` guard and a passing public regression assertion.

- [ ] **Step 5: Commit verification updates.**

```bash
git add e2e/personal-cockpit.spec.ts e2e/personal-roadmap.spec.ts e2e/branding.spec.ts e2e/navigation.spec.ts README.md
git commit -m "test(personal): verify focused cockpit across mobile widths"
```

## Release handoff

After all tasks pass, review the commits as one Personal-only change set. Do
not push or merge automatically from this plan unless the user separately
requests release delivery. Confirm `/hub` is canonical, `/trackers` works,
Personal navigation is Today / Focus / Log / More, and the public host remains
unchanged before handing off.
