# Personal Operating System Polish Design

## Status

Approved direction: redesign the personal NOVA//OS experience around a daily command center, make tracker actions consistent, and add a local-first Focus Sprint.

## Scope and boundary

This work applies only to the personal NOVA//OS surface:

- `/trackers` and the personal tracker routes
- shared personal shell components under `src/components/trackers` and `src/components/editorial`
- personal tracker state and tests

The public Buildora experience remains unchanged. In particular, do not alter the public portfolio page, public Buildora mark, public navigation layout, or public editorial styling.

## Problem

The personal app already contains useful data, but the current hierarchy gives too many modules equal visual weight. The home route repeats momentum information across separate panels, the next action is easy to lose among analytics, and tracker pages do not consistently expose their primary action in the same place. The product needs to feel like a daily operating system: clear current state, one next move, and a short path to action.

## Experience goals

1. A returning user can understand today's state and start the next useful action without scanning the whole page.
2. Every tracker exposes one obvious primary action directly below its chapter header.
3. Secondary analytics remain available but stop competing with the daily action.
4. Focus time becomes a first-class, local-first activity without silently modifying tasks or goals.
5. Empty, loading, unavailable, mobile, keyboard, and reduced-motion states remain intentional.
6. The personal surface stays visually coherent with the existing dark archive palette, cyan/lime signal colors, compact wordmark, and editorial typography.

## Design direction

### Daily command center

The hub should be organized in this order:

```text
TODAY / date                         MOMENTUM / percent
goal title + short daily brief       four anchor labels

NEXT MOVE
single recommended action            [primary action] [focus sprint]

ACTION QUEUE
unfinished task / goal / routine rows with status and destination

WEEK PULSE
compact seven-day activity strip with focus minutes

TRACKERS
small route links for deeper work
```

The existing ring remains useful as a compact momentum signal, but the duplicated StoryPanel, SignalPanel, and large ring treatment should be consolidated into one above-the-fold daily brief. Week review, streaks, quotes, and detailed analytics should remain below the action queue or behind a compact review grouping.

The unique visual signature is a mission strip: a narrow signal rail connecting the current next move to its destination. It should use the existing cyan/lime/red language and no new decorative illustration system.

### Shared tracker action bar

`TrackerShell` will accept a small, explicit primary-action contract rather than deriving actions from route names. The bar will support:

- primary action: label, destination or click handler, icon, disabled/loading state
- optional secondary action: label and destination or handler
- contextual status: existing sync/status badge remains available

On desktop the bar sits immediately beneath `ChapterHeader`. On mobile it remains in document flow with a compact layout and must not cover the bottom navigation dock. The action contract must work for links and buttons so existing route-local state remains authoritative.

Initial route actions:

| Route | Primary action | Secondary action |
| --- | --- | --- |
| Fasting | Start fast or save meal window | Open history |
| Workouts | Log session | Open exercise library |
| Goal | Log today's progress | Open milestones |
| Todo | Add task | Open completed tasks |
| Motivation | Start focus scene | Write reflection |
| Share | Create share drop | View sent drops |
| Shared | Review incoming items | Retry inbox when unavailable |
| Settings | Save or manage preferences | Export backup where relevant |

Where a route has multiple valid states, the primary label must describe the current state rather than remain a generic “Open” action.

### Focus Sprint

Focus Sprint is a local-first timer available from the hub and Motivation. It is intentionally small and task-oriented:

- presets: 15, 25, and 45 minutes
- optional label sourced from the current next move
- states: idle, running, paused, completed, cancelled
- controls: start, pause, resume, finish early, cancel
- completion creates a focus-session record with start time, end time, duration, label, and completion state
- completed sessions contribute focus minutes to the hub's seven-day pulse
- the timer never auto-completes a todo, changes goal metrics, or writes a journal entry

The timer should survive route navigation and refresh through the existing synced-storage/local-first storage boundary. If storage is unavailable, the UI should remain usable in the current tab and explain that the session cannot be persisted.

## Data contract

Add a focused `FocusSession` type and storage hook rather than placing timer fields in unrelated todo or motivation records:

```ts
type FocusSession = {
  id: string;
  label: string;
  plannedMinutes: 15 | 25 | 45;
  startedAt: number;
  endedAt?: number;
  durationMinutes: number;
  status: "completed" | "cancelled";
  createdAt: number;
};
```

The active timer may be stored separately from completed history so a refresh can restore an in-progress session without treating it as completed. The history is bounded to a safe recent window or pruned at write time to prevent unbounded local growth.

## Error and empty states

- A fresh hub should show a direct first action, not an analytics-heavy blank slate.
- An empty action queue should say the day is clear and offer a concrete next step.
- A failed Focus Sprint persistence write should preserve the live timer and expose a retry/save action.
- A tracker action that cannot run should explain the missing setup or unavailable sync state beside the control.
- Loading states should reserve the final layout space and avoid full-page indefinite “Loading…” text.
- All action controls need visible focus styles and text alternatives for icon-only buttons.

## Responsive and motion rules

- Keep the primary action visible within the first screen on desktop and narrow mobile widths.
- Collapse secondary analytics before shrinking action labels below comprehension.
- Use one restrained transition for the mission rail and timer progress; honor `prefers-reduced-motion`.
- Do not introduce a new full-viewport minimum height that creates wasted space on short routes.

## Testing and acceptance gates

Add or update Playwright coverage for:

1. Hub hierarchy exposes the next move, action queue, and focus entry point.
2. Each primary tracker route exposes its contextual action bar with a meaningful label.
3. Focus Sprint starts, pauses, resumes, completes, cancels, survives navigation, and contributes completed minutes to the seven-day pulse.
4. Focus Sprint does not mutate todo completion or goal metrics.
5. Empty and unavailable states remain actionable.
6. Mobile screenshots/locators confirm the action bar and bottom dock do not overlap.
7. Public portfolio tests confirm the Buildora page and public logo remain unchanged.

Release gates remain `pnpm lint`, `pnpm build`, `git diff --check`, and the full Playwright suite in local mode.

## Non-goals

- No public Buildora redesign.
- No server-side focus analytics or new account tables in this pass.
- No automatic task completion or goal updates when a sprint ends.
- No replacement of the existing motivation media system.
- No wholesale component-library rewrite.
