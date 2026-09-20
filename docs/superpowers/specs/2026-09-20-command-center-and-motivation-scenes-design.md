# Command Center and Motivation Scenes Design

## Status

Approved direction: tighten the personal NOVA//OS command center into a daily cockpit and make Motivation scenes feel deliberate, realistic, and specific to the selected goal category.

## Scope and boundary

This work applies only to `personal.buildora.work`:

- the personal `/trackers` command center and its shared personal components
- the personal `/motivation` route and motivation-media helpers/API
- personal Playwright coverage and local-first state handling

The public Buildora experience at `/` remains untouched. Public navigation, public branding, portfolio content, and public editorial styles are out of scope.

## Problem

The personal command center now has the right ingredients, but the daily action still competes with progress summaries and review panels. The page can feel longer than necessary, and the user's first decision is not always obvious. Motivation has useful controls and remote imagery, but the scene should make a stronger connection between the selected category, the image subject, the quote, and the next action.

## Experience goals

1. A returning user can identify today's next move and start it within the first viewport.
2. Action queue, focus time, momentum, and review remain available without competing equally with the next action.
3. Completed or low-priority information takes less space than unfinished work.
4. Motivation imagery feels realistic, category-aware, and useful as a cue for action rather than decorative wallpaper.
5. Relocation scenes use the selected destination when available, such as Germany-specific imagery for a Germany goal.
6. Remote media remains resilient: attribution is visible, unsafe/unavailable images fall back cleanly, and refresh remains explicit.
7. Personal state, local-first persistence, keyboard access, and reduced-motion behavior remain intact.

## Design direction

### Daily cockpit

The `/trackers` hub should use this information order:

```text
TODAY / date
[next move + primary action]       [compact momentum signal]
[focus sprint tied to the next move]

ACTION QUEUE / unfinished anchors

MOMENTUM + THIS WEEK / compact pulse and focus minutes

REVIEW / secondary tracker summaries and recent activity
```

The next move and Focus Sprint form the dominant first section. Momentum is reduced to a compact signal beside it on desktop and follows the focus/action content on mobile. The Action Queue is the main navigation surface for unfinished work. Week Pulse and historical review remain useful, but they should not create a tall empty panel or repeat the same summary copy.

Completed queue rows should remain visible for orientation but use reduced emphasis and less visual weight. Empty states should present one concrete suggestion, such as adding a task or logging today's progress.

The signature element is a restrained mission strip: a colored signal rail and destination link connecting each current anchor to the route where it can be completed. No new illustration system is introduced.

### Motivation scene

The `/motivation` route should read as one intentional focus scene:

```text
[realistic category or destination image]
         ↓
[goal title + progress signal]
[quote with source/author]
[next milestone / next action]
[start action] [refresh image] [open goal]
```

The selected category controls the visual search vocabulary:

| Category | Preferred image subject |
| --- | --- |
| Relocation | destination landmarks, city streets, recognizable landscapes |
| Fitness | athletes, training spaces, movement, recovery |
| Career | real workspaces, craft, collaboration, making |
| Learning | study spaces, labs, books in use, classrooms |
| Financial | planning, building, tangible progress, collaboration |
| Custom | realistic progress-oriented scenes with a calm horizon |

When category is relocation and a supported country is selected, both the remote query and fallback should include that destination. The visible scene label should name the destination or category in plain language.

Images resolved from public media sources must retain attribution and a source link. The scene should show a readable overlay, useful alt text, and a local/fallback visual if the remote image fails. Refresh invalidates only the active category/destination cache entry; it does not discard saved quotes, journal entries, goal data, or focus history.

The primary scene action routes to the current goal step. Focus Sprint remains available as a separate, local-first control tied to the displayed next milestone. Fullscreen is an enhancement, not a requirement for using the scene.

## Architecture and data flow

### Command center

- Keep existing tracker stores and derive a `dailyBrief`/`actionQueue` view model from them.
- Keep `FocusSprint` as the single owner of active timer state and session writes.
- Keep `TrackerShell` and `TrackerActionBar` as the shared route-level action boundary.
- Use existing anchors/routes for navigation; no new server-side command-center table is needed.

### Motivation media

- Keep `MotivationMedia` as the media contract.
- Centralize category and destination keywords in `src/lib/motivation-media.ts`.
- Keep the API responsible for fetching and normalizing public media, while the client owns cache freshness, refresh, and image-error fallback.
- Add only deterministic metadata needed for the scene, such as a human-readable category label or search rationale; do not store raw provider responses in unrelated goal state.

## Error and empty states

- Command center with no activity: show the next available action and one empty-state invitation.
- Unavailable synced storage: preserve usable local controls and communicate that persistence may need retrying.
- Motivation API failure: show a realistic category/destination fallback with attribution and keep the scene actionable.
- Remote image failure: replace the image area without collapsing layout or hiding the goal controls.
- Missing destination: fall back to the relocation category rather than showing an incorrect country.
- Reduced motion: disable non-essential scene transitions and progress animation.

## Responsive and accessibility rules

- Keep the primary next action visible within the first viewport on desktop and mobile.
- Use document flow for action bars and scene controls; never cover the mobile command dock.
- Preserve visible keyboard focus, semantic headings, descriptive image alt text, and polite live regions for changing status.
- Use compact spacing and fewer repeated summaries before reducing action-label clarity.

## Testing and acceptance gates

Add or update Playwright coverage for:

1. The command center presents next move, Focus Sprint, action queue, and compact week/review content in that order.
2. Completed queue items are visually de-emphasized without losing their destination.
3. Mobile command-center layout remains within the viewport width and does not overlap the dock.
4. Motivation category selection changes the media request vocabulary and scene label.
5. Relocation with Germany requests destination-aware media and falls back to a Germany-specific realistic image.
6. Remote media retains attribution and recovers from API or image failure.
7. Existing Motivation controls—shuffle, save, copy, fullscreen fallback, refresh, and Focus Sprint—remain usable.
8. Public navigation tests continue to prove the Buildora root does not render personal tracker surfaces or the NOVA personal mark.

Release gates remain:

```text
pnpm lint
pnpm run pretest:e2e
pnpm exec playwright test
git diff --check
```

## Non-goals

- No changes to public Buildora `/` or portfolio components.
- No new server-side analytics or account tables.
- No automatic completion of todos, milestones, or goal metrics from Focus Sprint.
- No replacement of the existing public-media provider with a new external service.
- No wholesale component-library rewrite.
