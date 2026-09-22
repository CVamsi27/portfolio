# Personal Today Cockpit Redesign

## Status

Approved design direction. This spec is limited to the Personal Buildora
surface (`personal.buildora.work`). The public Buildora surface and its routes
must remain unchanged.

## Problem

The Personal experience currently behaves like a dense dashboard. The home
route stacks the next action, goal summary, focus, momentum ring, action queue,
weekly pulse, quick logging, streaks, metrics, review cards, motivation,
activity, and quick links. This makes the main point difficult to find,
especially on mobile.

The redesign should make the first screen answer two questions immediately:

1. What is the one useful move I should make now?
2. What is the next thing that follows it?

Progress and secondary tools should remain visible, but progressively
disclosed instead of competing with the primary action.

## Product thesis

Personal is a calm execution cockpit: open it, understand the next move, start
it, and record what happened with very little friction.

The home experience follows this sequence:

```text
Today → decide
Focus → protect attention
Log → record progress
More → manage the system
```

## Information architecture

### Canonical routes

- `/hub` is the canonical Today route.
- `/trackers` remains a compatibility route and renders or redirects to the
  same Today experience.
- `/motivation` remains the Focus destination for compatibility, but the
  primary navigation label is `Focus`.
- Existing feature routes remain available and are grouped under `More`.

### Primary navigation

The four primary destinations are:

1. **Today** — the next action, compact progress, and one up-next item.
2. **Focus** — timed and open-ended focus sessions plus motivation scenes.
3. **Log** — fast capture for tasks, weight, workouts, fasting, and notes.
4. **More** — goals, health, archive, sharing, and settings.

On mobile, these destinations use a persistent safe-area-aware bottom dock.
The dock does not hide while scrolling. On desktop, the same four destinations
appear in the top navigation without exposing a long tracker sitemap.

The Today route has no back button. Secondary routes return to Today with a
simple, consistent link rather than a route-specific navigation treatment.

## Today layout

The mobile-first composition is:

```text
┌────────────────────────────┐
│  09:42     Tue, Sep 22     │
│  Good morning, Vamsi        │
│  One move now.              │
│                            │
│  ┌────────────────────────┐ │
│  │ NEXT MOVE              │ │
│  │ Write the opening      │ │
│  │ paragraph              │ │
│  │                        │ │
│  │ [ Enter 25 min focus ] │ │
│  └────────────────────────┘ │
│                            │
│  64% momentum     2/4 done │
│  ───────────────────────── │
│  UP NEXT                   │
│  Log your weight · 30 sec  │
│                            │
│  [Today] [Focus] [Log] [More]│
└────────────────────────────┘
```

### Today header

The header is compact and useful rather than a large telemetry block. It shows
the current local time with seconds, plus compact Munich and San Francisco
clocks. The current date and greeting remain secondary to the next action.

### Next move

`NextMoveCard` is the visual anchor. It contains:

- a short `Next move` label;
- the typed next action derived from existing priority rules;
- a one-sentence explanation when useful;
- one primary action, such as `Start 25 min focus` or `Log weigh-in`.

The card must not contain unrelated metrics, multiple competing CTAs, or a
long motivational paragraph.

### Progress rail

`ProgressRail` replaces the oversized dashboard treatment. It shows:

- one completion percentage or compact ring;
- the number of completed daily anchors;
- a small list of anchor labels or a single horizontal completion rail.

It must not repeat the full metric cards, charts, and streaks on the Today
surface. Detailed progress remains available in the relevant feature pages.

### Up next lane

`UpNextLane` is the signature component. It shows exactly one continuation
cue selected from the next incomplete commitment, recovery cue, milestone, or
tracker action. It includes the action, category, and approximate effort when
known. If there is no queued item, it offers one clear setup action.

## Log surface

The Log destination opens a fast capture surface with four clear entry points:

```text
What do you want to log?

[ Task ]       [ Weight ]
[ Workout ]    [ Note ]
```

Fasting remains available through the detailed health flow and may be exposed
as a fifth option when fasting is enabled. The surface should favor immediate
capture and recent entries over a dense form dashboard.

## More surface

`More` groups secondary areas into a simple list with short descriptions:

- Goals
- Health / Weight loss
- Archive
- Sharing
- Settings

The list is not a second sitemap. Each row should explain what the destination
helps the user do.

## Visual system

The Personal surface uses a distinct, non-gradient visual language. Public
Buildora styles must not be altered.

### Palette

| Role | Value |
| --- | --- |
| Deep ink | `#102027` |
| Warm paper | `#F4F0E7` |
| Clean card | `#FFFDF8` |
| Signal cyan | `#32B8C8` |
| Action lime | `#C9FF4F` |
| Muted graphite | `#68736F` |
| Soft rule | `#DCD6CA` |

No violet-to-pink gradients or legacy portfolio accent classes may appear on
the Personal surface.

### Typography

- Space Grotesk for display and headings.
- Inter for body content.
- IBM Plex Mono for time, status, metadata, and compact labels.

### Component language

- Use fewer cards and more intentional section boundaries.
- Use quiet borders and restrained corner radii.
- Use one strong action color per screen.
- Prefer text hierarchy over decorative color coding.
- Use compact rails and rows instead of large metric widgets.
- Keep motion limited to meaningful transitions and honor reduced motion.

## Component boundaries

The implementation should extract or reshape focused components rather than
continuing to grow the current hub page:

- `PersonalShell` — shared Personal layout and page spacing.
- `TodayHeader` — compact time, date, greeting, and world clocks.
- `NextMoveCard` — primary action and action context.
- `ProgressRail` — compact completion state.
- `UpNextLane` — one continuation cue.
- `LogSheet` or `LogPage` — fast capture entry points.
- `PersonalNav` — shared Today / Focus / Log / More navigation.

Existing stores, sync behavior, focus sessions, weight-loss state, goals, and
archive data remain the source of truth. This redesign does not introduce a
new persistence layer.

## Interaction and states

- The primary action remains usable when data is empty or still loading.
- Empty states explain the next setup action in plain language.
- Loading states preserve layout height to avoid mobile jumps.
- Errors explain what failed and offer a clear recovery path.
- The mobile dock remains accessible while content scrolls.
- Keyboard focus remains visible.
- Reduced-motion users receive an equivalent static transition.
- Authentication and setup flows remain intact.

## Responsive requirements

The first layout target is 320px wide, followed by 390px and 430px. The
implementation must have no horizontal overflow at those widths. Desktop may
use a wider two-column composition, but the mobile ordering remains the source
of truth:

```text
header → next move → progress → up next → secondary content → navigation
```

## Verification gates

- Mobile browser checks at 320px, 390px, and 430px.
- No horizontal overflow on any Personal route.
- `/hub` is the active Today route and `/trackers` remains compatible.
- Navigation exposes Today, Focus, Log, and More consistently.
- The old back button does not appear on Today.
- No violet/pink legacy gradient appears on Personal pages.
- Public Buildora routes and styling remain unchanged.
- Existing navigation, auth, focus, motivation, weight-loss, archive, and
  sharing tests continue to pass.
- `pnpm lint`, production build, `git diff --check`, and relevant Playwright
  coverage pass before release.

## Out of scope

- Public Buildora redesign.
- Replacing existing tracker data models.
- New push notification infrastructure.
- Binary archive uploads.
- Rewriting every feature page before the shell and Today route are stable.
