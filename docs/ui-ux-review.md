# UI/UX redesign review

Reviewed 2026-10-03. Scope: the public portfolio and NOVA workspace. The approved [design](superpowers/specs/2026-10-03-ui-ux-redesign-design.md) and [implementation plan](superpowers/plans/2026-10-03-ui-ux-redesign.md) describe the delivery contract.

## Implemented improvements

| Verified issue | Result |
| --- | --- |
| Mixed colors, tiny metadata, heavy decorative chrome | A scoped blue portfolio and teal workspace palette, readable light/dark text, quiet panels, consistent controls and restrained headings. `src/app/ui-system.css` owns these refinements. |
| Tablet navigation gap and missing Tasks destination | Desktop navigation begins at 1024px; the mobile dock covers tablet widths. More includes Tasks and keeps the active state on secondary routes. Sharing child routes retain their parent context. |
| Nested landmarks and interactive elements | One main landmark, link buttons use `asChild`, and tested routes have no nested links/buttons. |
| Repeated overview panels hide daily actions | Quick capture is visible on Today. Supporting summaries move into expandable overviews on Tasks, workouts, fasting and Settings. Settings includes section anchors. |
| Labels promise actions that only scroll | Form links say “Open meal window” and “Open session.” Focus and Tasks match their navigation names. |
| Dialogs lose opener focus or let keyboard shortcuts escape | Shared focus handling traps Tab, restores the opener, locks scrolling and gives the top dialog ownership of Escape. Applied to tracker and portfolio dialogs, palettes and drawers. |
| Bedtime overlay sits below fixed navigation | The bedtime dialog mounts in the document body and uses shared keyboard handling; its exit controls remain clickable. |
| Notification prompts and browser capability hydration errors | Removed the duplicate automatic permission request; permission checks use a stable server snapshot and explicit user actions. |
| Sharing expiry preview changes during hydration | Preview describes the selected lifetime relative to creation. Actual saved expiry behavior is retained. |
| Contact failures discard context or lack clear recovery | Inline accessible error/success feedback, retained fields, proper autocomplete and explicit pending state. Submission tests intercept requests locally. |
| Mobile task page immediately opens the keyboard | Initial task autofocus removed; deliberate inline editing retains focus behavior. |
| Hidden back-to-top control enters keyboard navigation | Hidden state removes it from the tab order; visible control has a 44px target. |
| Animated public stats obscure the actual values | Stats render their final values immediately. Concurrent portfolio content edits are preserved. |

## Follow-up fixes

The next pass reproduced and fixed these additional issues:

- Log's “End Fast Window” cleared the running timer without saving history. It now appends the actual start/end timestamps and protocol, preserves earlier sessions, and survives reload.
- Log displayed kilograms when the selected unit was pounds. Saved entries now use the chosen unit; invalid entries explain the accepted range and expose `aria-invalid` with associated error text.
- Recovery scores lacked accessible meanings and selected states. Energy and sleep choices now have explicit names, `aria-pressed`, and 44px touch targets. Task priority exposes its selected state too.
- Modal background content stayed available outside the dialog. Shared handling now makes the background inert and hides it from accessibility navigation, preserves previous attributes, handles changing portal content, and restores the page on close.
- Portfolio modal close buttons and resume links were 28–32px tall. Header controls now use 44px targets; the resume header wraps on small screens. Log cards now match the shared panel treatment and success text is readable in both themes.

The new regressions were exercised against the preceding build and failed before implementation. The complete follow-up Chromium suite passed **161 tests**, including the new Log and modal regressions. Lint, TypeScript, the local-mode production build and `git diff --check` also pass. Light/dark mobile captures confirm the Log layout fits 320px and resume controls remain usable at 320 × 650px.

## Archive refinement pass

- Populated archive items now stack their action controls below content on phones. Long unbroken notes wrap inside the card; the full reading area remains available.
- Capture fields have visible labels. Source URLs are parsed and validated before saving; link/image captures require a source, image sources require HTTPS, and malformed inputs retain the draft with an associated error.
- Successful saving is announced. A newly captured item remains visible even if a previously selected goal scope or search would hide it.
- Filtered empty states distinguish missing results from an empty archive and offer “Show all items.” Inline tag chips expose their selected state.
- The latest deletion can be undone while the page remains open, restoring the original item metadata. Store updates preserve other current items.
- Clipboard failure explains manual recovery instead of silently ignoring the action.

All five new regressions failed against the preceding implementation. **35 tests passed** after the fixes: archive regressions, existing personal-roadmap flows, and the full light/dark responsive matrix. Lint, TypeScript, the production build and `git diff --check` pass. Populated 320px screenshots are `artifacts/ui-ux/followup-archive-light-320.png` and `followup-archive-dark-320.png`.

## Clock refinement

The clock now keeps the device-local date visible on phones, identifies its UTC offset, and uses a stable 24-hour HH:MM display without ticking seconds or decorative day/night icons. The time still follows the device timezone; it is not forced to India time. The expanded Munich and San Francisco rows each show their own date and current UTC offset, with aligned times and full-width rows. The disclosure remains keyboard accessible and refreshes immediately on focus or visibility return.

**33 relevant tests passed**, covering explicit local timezone display at 320px, local midnight rollover, Munich's daylight-saving transition, populated roadmap behavior and the complete light/dark responsive matrix. The new clock tests failed against the preceding implementation; an additional layout assertion reproduced and caught the narrow city-row issue before its correction. Lint, TypeScript, the production build and `git diff --check` pass. Visual evidence: `artifacts/ui-ux/clock-refined-light.png`.

## Workout and hydration refinement

The rest timer now mounts above the page rather than inside its stacking context, stays above the navigation dock through tablet widths, and exposes its countdown as an accessible progress bar. Its ring and restart action use the selected duration; finished sessions cannot be paused. Presets show their selected state, and timer controls use 44px targets.

The plate calculator now rejects weights below the empty bar, associates a clear error with the input, and identifies selected presets. Hydration controls use a responsive four/eight-column layout with 44px targets; their exact selected count and logged-water progress are accessible. The hydration header wraps instead of squeezing its text.

All four new regressions failed against the preceding build. **32 relevant browser checks passed**, covering these cases, existing workout and fasting behavior and the responsive route matrix. An additional assertion confirms 50% ring progress halfway through a 60-second preset. Lint, TypeScript, the production build and `git diff --check` pass. Visual review confirms separation between the rest timer and tablet dock at 768px (`artifacts/ui-ux/workout-rest-768.png`).

## Search and keyboard refinement

Workspace search now includes Tasks and Career roadmap, uses the current destination names, and describes navigation actions accurately. Ending a fast from search records the session in history before clearing the timer. Unsupported encryption claims were removed.

Both palettes expose a combobox with selectable options and keep the active result visible while navigating with arrow keys. Enter acts on results only while the search input owns focus, so close and clear controls cannot accidentally execute a command. Shared focus trapping now excludes controls with negative tab indexes. Results wrap, close controls use 44px targets, and short screens have bounded scrolling. Portfolio search is available by touch on phones.

The five initial regressions failed against the preceding build; the additional mobile regression reproduced the hidden search control. The complete suite passed **178 tests** after the palette and shared focus fixes. After adding mobile search, **42 affected tests passed** against a fresh production build. Visual review then reproduced clipped workspace keyboard hints; the footer now wraps, and all **six palette tests passed** against the final build, including a nested overflow assertion. Lint, TypeScript, production build and `git diff --check` pass. Both palettes were visually reviewed at 320 × 450px; captures are `artifacts/ui-ux/palette-portfolio-320.png` and `palette-workspace-320.png`.

## Timetable usability and planning features

Today, the roadmap's today summary and each expanded day's Schedule tab now share a single timetable view. Long instructions wrap and each block shows its duration and expected output. Current/next summaries stay visible when the full schedule is hidden; the disclosure exposes its expanded state and controlled content.

The view refreshes at minute boundaries and on tab focus/visibility return. Boundary checks verify the transition into a break and the next block. An open Today plan also switches correctly across midnight. Past time slots are labeled “Time elapsed” rather than crossed out or marked completed. Time passing never writes evidence or schedule state.

Structured work/break schedules expose planned focus totals; older unclassified string schedules show total scheduled time instead of inventing a focus budget. The exact-owner 10-hour weekday / 4-hour weekend-day schedule and stored progress remain intact. This pass makes no cloud writes.

The three initial timetable regressions and the legacy-budget regression failed against the preceding builds. **36 affected browser checks** and **11 unit tests** passed on the final implementation. Lint, TypeScript, the local-mode production build and `git diff --check` pass. Light/dark visual review at 320px confirms full instructions, outputs and summary readability. Full component captures use seeded four-hour weekend data: `artifacts/ui-ux/timetable-light-320.png` and `timetable-dark-320.png`. Live OAuth rendering and deployment were not exercised.

## Verification

`pnpm lint`, `pnpm exec tsc --noEmit`, the local-mode production build and `git diff --check` pass. The complete Chromium Playwright suite passed **157 tests**. After the final contrast, login-copy and reminder-field refinements, the affected suites and responsive matrix passed **34 tests** against a fresh production build. The final copy pass also replaced remaining “Personal Buildora” interface labels with NOVA. Browser coverage includes 16 routes at 320, 390, 768 and 1440px in both themes, with reduced motion enabled. The route matrix checks overflow, headings, main landmarks, nested interactive controls and runtime errors. Existing suites exercise seeded empty/populated state, tracker persistence, focus sessions, bedtime settings, sharing access rules, backup and roadmap evidence.

Local screenshots are saved under `artifacts/ui-ux/` and excluded from Git. Representative captures include `final-portfolio-light-1440.png`, `final-hub-light-390.png`, `final-todo-dark-390.png`, and `final-settings-dark-1440.png`. Follow-up mobile evidence includes `followup-log-light-320.png`, `followup-log-dark-320.png`, and `followup-resume-light-320.png`. These are implementation review evidence, not production screenshots.

## Boundaries

Saved-data shapes, storage keys, share access defaults, evidence-gated completion and host routing remain intact. No deployment or commit was requested. Build and browser checks run with optional Supabase configuration blanked. Live OAuth, cross-device Supabase synchronization, signed media and external contact delivery are not verified by the local browser suite. Automated responsive checks and visual inspection cover the listed routes/viewports; they do not establish compatibility with every browser or assistive technology.

## 2026-10-03 — Audio break redesign

Replaced the shared lounge's hidden iframe/full-screen playback simulation with three native YouTube Music podcast discovery links. Kept the component interface for all callers. Added optional timestamp-based 5/10/15-minute break timing with pause, resume, reset and finish, independent of study focus storage. The timer survives closing the chooser while its component remains mounted; it does not persist across page reloads. Updated entry labels and allowed exactly music.youtube.com through older saved distraction blocklists.

Verified accessible Escape dismissal/focus restoration, native new-tab destination, no embedded player, saved blocklist compatibility, paused/background timing, unchanged focus storage, and 320px overflow. Captured artifacts/ui-ux/audio-break-mobile.png and audio-break-desktop-dark.png after animations settled. Production build, lint and TypeScript checks pass. Authenticated production behavior is not verified locally.

Product redesign remains phased: shell/navigation, Today/Plan, Focus/Review, then secondary tools. No tracker records or cloud settings were changed by this phase.

Regression evidence: full suite 194 passed / 1 assertion failure (raw localStorage string `"null"` versus parsed null). Corrected that assertion to check the parsed domain value; all 3 Audio break checks then passed. No implementation change followed the full run. Thus all 195 cases passed across the full run and corrected targeted rerun; a single fully green 195-case run has not been claimed.

## 2026-10-03 — Goal-driven motivation, without dashboard clutter

Rebuilt /motivation as one goal story: the saved goal is the main heading, original category-specific encouragement explains its purpose, an original reminder offers encouragement, and the next unfinished milestone leads to the relevant plan. Completed milestones receive a completion message and reflection action. The displayed count is completed milestones, not visits or assumed work.

Removed the focus timer, daily journal form, visit/deck/saved-count tiles, general-inspiration switch, fullscreen takeover, automatic image rotation, refresh transmission controls, duplicate milestone summaries and standalone affirmation/favorites cards. Existing journal, visit, quote and preference storage is retained. Journaling remains in Log; focus sessions remain on Today. Personal/saved reminders remain accessible through one compact dialog.

Navigation now calls this route Motivation (Inspire on the mobile dock). Search's focus-sprint action opens Today rather than a route without a timer. Removed obsolete source/style controls from setup and Settings; setup confirms the chosen goal and preserves preferences outside its local fields. Removed 300 lines of obsolete scene CSS. Image attribution matches the displayed visual, while original encouragement is never labeled with a remotely fetched author's name.

Verified goal-aware requests even with old general preferences, no raw custom goal/name in media requests, exact saved goal display, milestone counts/completion, unchanged removed-section records, saved/custom reminder persistence, clipboard failure feedback, modal dismissal/focus restoration, static imagery, missing-image/service fallback, and phone/tablet overflow. Captures: artifacts/ui-ux/motivation-goal-mobile.png, motivation-goal-desktop.png and motivation-complete-fallback.png. These use seeded QA records, not the authenticated owner's cloud data. Build/lint/typecheck passed. Authenticated production deployment is not verified.

Final stable production-build regression run: **190 passed (1.4m)**. This includes the new goal motivation and clipboard-failure checks, navigation/palette changes, onboarding, modal recovery, Audio break, clocks, health tools, sharing and responsive route checks. The earlier interrupted build/test overlap was superseded by this clean server restart and full run. Visual review confirmed the goal precedes the image on mobile, the long goal wraps, and completed/missing-image states remain usable.

## Integrated personal tracking — 4 October 2026

The approved consolidation now uses Today, Plan, Health, Review and More, with native quick capture and preserved legacy destinations. Today shows one next action, top three tasks, optional modules and a collapsed study schedule/checklist. Removed study streak clutter and blank Food meal/saved-data sections. Food supports portions, known-aware macro/micronutrient totals, saved/recent/favorite foods, recipes, dated edits, duplicate/delete/undo and optional targets. Owner-only meal/supplement schedules use IST, with separate completion, dated missed occurrences, snooze and undo. Focus permits navigation; optional rest permits immediate exit and reminder access.

Final local production-build verification: 204 browser tests and 15 domain/storage tests passed; TypeScript, lint, build and diff checks passed. Reviewed phone/light and desktop/dark screenshots in artifacts/ui-ux/tracking-*. Local auth-open validation does not prove the deployed authenticated flow. Database migrations, food-provider credentials, push credentials/scheduler and real-device delivery remain pending; see NUTRITION_AND_REMINDER_SETUP.md. Changes are uncommitted on fix/click-interactions.

## Final scope audit — 4 October 2026

The additional audit completed task deletion/cleanup undo, task date editing, selected-task focus, one authoritative work-session controller, cross-page study controls, study completion deduplication, Review's learning/water/movement/body records, compact routine summaries, Library naming, a direct goal-to-Motivation link, calendar-boundary consistency, provider retrieval provenance and phone editor layout recovery. Latest main's Bible curriculum and resume changes were retained.

Final verification against the integrated production build: **215 Chromium tests passed** (2.3 minutes), **17 nutrition/storage/session tests passed**, and **18 curriculum/sync tests passed**. TypeScript, ESLint, production build, Bible snapshot validation (100 days / 556 chapters) and staged diff whitespace checks passed. No production credentials were added; authenticated migration, cloud/offline and real-device push gates remain pending. The scope-to-code map is in [NOVA_IMPLEMENTATION_AUDIT.md](NOVA_IMPLEMENTATION_AUDIT.md). Commit/push history on `fix/click-interactions` is the source of submission evidence.

## Personal workspace refinement — 4 October 2026

Refined the shared page hierarchy, compact clock treatment, destination rows, card surfaces, form heights, focus wording and mobile dock. Removed the repeated Today return link from primary sections and the personal marketing footer, retaining the public portfolio footer. No record schema or schedule changes. Reviewed final Plan, Health, Food, Review and More captures at 390/1440px in light/dark mode; the regression matrix additionally checks 320/768px and the remaining personal/public destinations.

Final production-build local QA: **215 Chromium tests passed (2.2 minutes)**; TypeScript, ESLint, build and diff whitespace checks passed. The initial run found three obsolete footer expectations and a rest-timer test whose clock continued advancing during setup. Updated the footer expectations and paused the timer test clock before controlled advancement; the final run passes all tests. Screenshots: `artifacts/ui-ux/refined-*`. Auth-open local QA does not verify the live authenticated deployment. Separate resume PDF modifications were excluded from this change.

## All-domain progress workspace — 4 October 2026

Progress is now a primary destination at /dashboard, with 7/30/90-day ranges, ending-date and period navigation, weight/food/exercise/water/sleep/focus/study charts, nutrient coverage and optional saved targets, exercise sets/repetitions/known load, completed fasting and task/goal/routine/habit counts. Every chart offers dated readings; unlogged days remain gaps, and nutrition uses portion-aware known-day averages rather than treating missing nutrients as zero. Detailed /review remains accessible.

Connected personal detail pages through shared section tabs and domain-specific seven-day summaries; section roots avoid duplicate navigation. Today links to the dashboard without becoming a second statistics page. Plan now starts with task selection and focus, followed by the pending queue and planning tools. Body and weight now supports dated corrections, removal/undo, independent target editing, 30/90-day dated charts and expanded history. Retained old recovery observations while removing the calculated readiness score.

Final local production-build verification: **224 Chromium tests passed (1.6 minutes)**; **24 domain/storage tests passed**; TypeScript, ESLint, build and diff whitespace checks passed. New scenarios cover range and date navigation, sparse/unknown values, all nutrients, accessible charts, task selection and dated weight correction/undo. Reviewed populated 390px light and 1440px dark captures of Dashboard, Plan, Body, Health, Food and Exercise; the route matrix also checks 320/768px and public/supporting routes. Evidence: artifacts/ui-ux/progress-*. Auth-open local QA does not establish authenticated production or device notification delivery. No schema, provider credentials, reminder dose or owner timetable changes.

## Workspace workflow completion — 4 October 2026

Tasks now offers name search, combined priority/tag filters and a single clear action; optional new-task metadata stays behind Task options. Today completion counts actual completion timestamps for today plus pending tasks due by today, excluding previous-day completions. Filtered empty states distinguish no matches from an empty day. Task and milestone names retain readable space on phones while their touch controls wrap beneath them.

Goals replaces the repeated story and score panels with the next saved milestone and completion count. Its 30-day metric chart uses dated readings with gaps for missing days. Progress includes dated goal-metric readings (including explicitly recorded zero) and nonempty journal-day coverage in the selected range, with direct journal access. Secondary pages return to Plan, Health, Progress or More according to the existing navigation route map; stored record formats and reminders remain unchanged.

Local QA captures: artifacts/ui-ux/completion-{todo,goal,dashboard}-{390-light,1440-dark}.png. Reviewed populated mobile Tasks and Goals after fixing squeezed row names. Production authentication, provider/migration configuration and real-device notification checks retain their existing separate release gates.

Verification: **231 Chromium regression tests passed (2.6 minutes)** and **25 domain/storage tests passed**. Final production rebuild, TypeScript and ESLint passed; **12 focused browser tests passed** after the journal copy/filter styling cleanup. Regression scenarios cover combined filters without record mutation, today's completion timestamps, contextual back links, journal and zero/missing goal readings, mobile text widths, persisted goal logging and milestone CRUD. Auth-open local checks do not establish live deployment or external service readiness.

## Sharing recovery and access guidance — 11 October 2026

Continued the approved UI/UX scope with three reproduced Sharing failures: blocked clipboard writes were silent, saved links offered no action to apply edited viewer settings, and sharing guidance still promised signed-out access after the approved website restriction.

Added an explicit Save share settings action for existing links and a labeled, read-only link field that selects its URL for manual copying. Clipboard failures now explain how to recover; creating or updating a link only claims a successful copy when the clipboard write succeeds. The link is saved before copying, so a blocked clipboard does not hide the result. Replaced migration instructions in save errors with recovery guidance that retains the drop and viewer draft. Link access is consistently distinguished from an additional email allowlist, and the editor explains the approved Google-account requirement on personal.buildora.work.

The local-mode browser tests reproduce clipboard denial, confirm the URL remains selectable, expose the saved-link update action without allowing unsigned cloud writes, and check that edited viewer drafts do not silently rewrite persisted permissions. The existing 320px layout already wraps long notes and provides a 44px recipient-removal target. Reviewed populated 320px light and 1440px dark screenshots under `artifacts/ui-ux/share-recovery-*` with no horizontal overflow. Local UI checks do not verify an authenticated cloud create/update or a production deployment.

Verification: **27 Chromium checks passed** across Sharing, incoming shares, share payloads and the UI/UX regression suite, including the 320/390/768/1440px light/dark route matrix. The final production rebuild and seven Sharing checks passed again after the label consistency pass. ESLint, TypeScript and whitespace checks passed. Changes remain local and uncommitted.

## Sharing visual correction — 11 October 2026

The user rejected the previous captures. The recovery fixes worked, but the mobile page gave repeated counts and storage guidance more space than the actual notes, and the inline permissions editor made each card much taller. Passing overflow checks had not established a useful visual hierarchy.

Reworked Sharing within the approved NOVA visual system. A single title/status row and quiet view tabs replace the repeated back/help row and full-width filled switcher. The composer leads with a labeled content field, compact expiry choices and an explicit Save drop action. Counts occupy a single small line, storage details stay behind an accessible disclosure, and search/type filtering belongs to the saved list. Desktop gives the compact composer its own column and saved drops the wider column; mobile presents the first saved note above the dock at 390×844. Permissions now use the existing accessible dialog, with readable copy, independently selectable link, 44px recipient removal and focus restoration. The existing data shapes and access enforcement are retained.

Reviewed viewport captures at 320px and 390px light and 1440px dark, including the separate permission dialog: `artifacts/ui-ux/sharing-redesign-*` and `sharing-dialog-*`. These supersede the earlier full-page recovery captures for visual review. **38 browser checks passed in one run**, including both-theme route matrices and the new phone-content/focus-return checks; the additional capture/filter persistence check also passed. Final production build, ESLint, TypeScript and whitespace checks passed. This is a local Sharing refinement; authenticated cloud writes and deployment remain unverified.

## Unified redesign — Phase 1 foundations — 17 October 2026

Executed Phase 1 of the approved unified redesign (design contract `docs/superpowers/specs/2026-10-17-unified-redesign-design.md`, plan `docs/superpowers/plans/2026-10-17-unified-redesign.md`) on branch `redesign/unified-uiux`. This phase is foundations only: one palette owner, dead layers removed, shared primitives built — no intended visual change.

**Token consolidation.** `ui-system.css` is now the single owner of every palette value for both surfaces: the dark neutral fallback, the NOVA workspace (light/dark) and the public portfolio (light/dark) blocks each declare every colour once. `globals.css` keeps only the Tailwind `@theme` defaults and base styles; the legacy cream tracker palette, lime/violet accent overrides and duplicate canvas declarations that unlayered imports had been shadowing are deleted. `nova-workspace.css` keeps layout rules only and every colour reference is a token. Also removed while consolidating: the dead `.gradient-text` utility and the dead `input[type="range"]` styling block (no range input exists anywhere), and a redundant second tracker palette block in `ui-system.css` whose values had been shadowed before the change and would otherwise have drifted (canvas `#f6f7f5` → frozen `#f5f7fa`, rule `#dce3df` → `#d8e1ec`, surface-2 `#e9eeeb` → `#e5edf3`). The removal of the canonical-name rename from the contract sketch (canvas/surface/ink vocabulary) is recorded as a deliberate deviation: the frozen `--color-*` namespaces already provide one name per role for both surfaces, and renaming would touch every Tailwind utility with zero UX value.

**Proof of no drift.** A rerunnable token dump (`artifacts/ui-ux/redesign-review-2026-10-17/token-dump.mjs`) compared every resolved custom property plus body/element probes across six route cases (portfolio and tracker, light and dark): **0 differences** against the pre-change snapshot. A 15-capture pixel diff (Today, Food, Progress, Settings, portfolio `/`; desktop light/dark, phone light) showed **0 differing pixels** before and after the last code change of the phase.

**Shared primitives.** `ChapterHeader` became `PageHeader` (5 import sites) with a new chapter-breadcrumb slot (`data-testid="chapter-breadcrumb"`) for the Phase 2 chrome work. Added `PageSummary` (data-only reading line that renders nothing without data), `SectionCard` (titled panel shell) and extended `EmptyState` with an optional icon and secondary action. `ActionMenu` already existed and remains the canonical accessible row menu. Ten zero-consumer components were deleted, plus the `TrackerShell` alias (11 import sites) and dead `SignalPanel`/`StoryPanel` imports.

**Verification vs the pinned guards.** Full Chromium suite: **364 passed / 15 failed (3.8m)**; the 15 failures are exactly the redesign guards pinned in Phase 0 for Phases 2–4 (rail on `/log` and `/more`, two page titles, seven chapter breadcrumbs, one empty-state copy check, the QuickSheet pair, Today now/next). No other failures. TypeScript, ESLint and the local production build pass. Local-mode checks do not establish authenticated production behaviour, and no storage keys, record shapes or share rules were touched.

## Unified redesign — Phase 2 workspace chrome, naming and honest summaries — 17 October 2026

Executed Phase 2 of the approved unified redesign (design contract `docs/superpowers/specs/2026-10-17-unified-redesign-design.md`, plan `docs/superpowers/plans/2026-10-17-unified-redesign.md`) on branch `redesign/unified-uiux`. This phase makes the workspace chrome consistent, aligns naming, deletes the repeated progress-lead strip and rewrites empty states without changing any storage contract.

**Chrome and naming.** `/log` and `/more` now render inside the workspace chrome: the rail and the phone dock are present on both, with reminders intact, and `/more` is the Tools directory mapping `PERSONAL_TOOLS_NAV` directly. The dedicated standalone navbar path is now used only by the sign-in route. `PERSONAL_MORE_NAV` was deleted so the rail, dock and Tools directory read one navigation source, and the navigation tests were repointed to `PERSONAL_PRIMARY_NAV`/`PERSONAL_TOOLS_NAV`. Page titles now match their navigation labels across Tasks, Goals, Food, Body & weight (was “Body and weight”), Workouts, Fasting & eating window (was “Intermittent fasting”), Routine reminders, Library, Add a record and Tools, each with a chapter breadcrumb (`Plan / Tasks`, `Health / Body & weight`, …) built from the new `ChapterBreadcrumb` on `PageHeader`. Breadcrumbs render only on the guard routes; chapter roots such as `/health` stay clean, as do `/log`, `/more` and `/archive`.

**Lead strip removed.** `WorkspaceProgressLead` was deleted along with its injections in `PersonalShell`, `HealthWorkspace`, `FoodTracker`, `DailyWorkspace`, `ProgressDashboard` and `GermanyExams`. The dashboard chart became `ProgressChart`: metric and range controls now live inside the panel they control under the single `progress-chart` testid, and an empty range renders an actionable empty state instead of negative boilerplate. Each page’s lead content became a one-line `MetricSummary` that renders only when the selected day has a reading (`90 min · today`, `1 task · today`, `82.4 kg · today`); null and zero readings stay silent and units singularize. Dead `progressMetric()` was removed.

**Empty states.** Page-level empty copy was rewritten to positive, action-first language with `EmptyState` (Tasks, Goals, Workouts, Fasting history, Library, hydration, nutrition insights and summary, Germany exams chart, food diary). Actionable per-row statuses in the health ledger and Today’s agenda lines were deliberately left as-is. The food diary gained no duplicate primary action — the header keeps the single “Add food” control (a first pass had added a second; it was reverted after review).

**Verification.** Full Chromium suite: **389 passed / 3 failed (4.2m)**; the three failures are exactly the redesign guards pinned in Phase 0 for Phases 3–4 (mobile dock quick-add, header search sheet, Today now/next above the fold), with no other regressions. The guard file grew to 38 guards: chrome parity on `/log`/`/more`, title/label alignment, breadcrumbs, absence of the lead strip on eleven routes, the Tools directory reading the shared source, and the daily summary appearing only with a real reading. Seven planned specs plus `archive-ux`, `fasting`, `personal-roadmap` and `personal-tracking` were updated where the UX legitimately changed; two stale assertions (dock absent on `/log`, old title text) were corrected to the approved behaviour. `personal-nav` and `progress-presentation` unit tests pass; TypeScript, ESLint and the production build pass; whitespace check clean. Visual review used 60 fresh captures under `artifacts/ui-ux/redesign-phase2-2026-10-17/` plus close reads of Today, Tasks, Goals, Add a record, Tools, Progress, Body & weight and Health at 390/1440 in both themes.

**Boundaries.** Local mode only: authenticated cloud sync, notifications and deployment remain unverified. No `vk:*` keys, record shapes, backup behaviour or share rules were touched. The two command palettes remain separate and the Today rebuild remains scheduled for Phases 3–4; the pinned failing guards above are their contract.

## Unified redesign — Phase 3 one command palette + mobile quick capture — 18 October 2026

Executed Phase 3 of the approved unified redesign (design contract `docs/superpowers/specs/2026-10-17-unified-redesign-design.md`, plan `docs/superpowers/plans/2026-10-17-unified-redesign.md`) on branch `redesign/unified-uiux`. This phase collapses the two command palettes into one implementation, adds the mobile QuickSheet capture surface and merges the two shortcut modals — with no storage, record-shape or routing change.

**One command module.** `src/components/command/` now holds the single implementation: `CommandPalette` (variants `nova`/`portfolio`) built on `CommandSearch`, which owns the shared combobox semantics, arrow/Enter handling, active-result visibility, the clear-query control and the close button. Two registry hooks feed it: `useNovaCommands` (navigation derived from `PERSONAL_PRIMARY_NAV`/`PERSONAL_TOOLS_NAV` plus chapter destinations; searchable Records from open tasks, goal milestones, completed study chapters and Library items; actions for captures, fasting, focus, study cockpit, distraction shields, revision deck, break lounge, theme and shortcuts) and `usePortfolioCommands` (sections, resume, vCard, copy email, terminal, game, study/shield/revision/break, projects and tech filters). The old `PortfolioCommandPalette` (733 lines), `trackers/CommandPalette` (572 lines) and both shortcut modals were deleted; one `ShortcutsModal` now serves both surfaces with each surface’s own shortcut data shared behind common dialog mechanics.

**Mobile QuickSheet.** The workspace’s phone command surface is a bottom sheet named “Quick add and search” with Add|Search tabs. It opens from the floating + above the dock (Add tab, testid `dock-quick-add`), the new header search icon (`header-search`, Search tab) and the compact Tools menu; ⌘K opens the sheet below 1024px and the palette above. “Water +1” writes `vk:fasting:water` immediately and confirms with a “Water logged” status while the sheet stays open; every other capture routes into the existing `/log?type=` forms. All controls keep 44px targets, focus trap / Escape / focus return come from the shared dialog hook, and the sheet’s z-index clears the dock.

**Specs.** Failing-first: the spec updates pinned the new compact behaviour before implementation (9 expected failures, no others). `palette-ux` now pins the sheet for the workspace phone surface and keeps the palette for the portfolio; `navbar-simplification` and `today-hierarchy` were updated for the two visible rail buttons and the sheet dialog name; the guard file gained the water-write and focus-return regressions. `command-deck` and `navigation` needed no palette changes.

**Verification.** Full Chromium suite: **393 passed / 1 failed (2.0m)** — the single failure is exactly the Phase 4 `today-next-action` guard pinned in Phase 0. TypeScript, ESLint, the production build and all unit suites (101 `node --test` checks) pass. Visual review used 11 scene captures under `artifacts/ui-ux/redesign-phase3-2026-10-18/`: phone dock with quick add, sheet Add/Search tabs, water confirmation, dark sheet, Tools menu, both palettes and both shortcuts sheets at 1440.

**Boundaries.** Local mode only: authenticated cloud sync, notifications and deployment remain unverified. No `vk:*` keys, record shapes, backup behaviour, share rules or routing aliases changed; `/log` keeps its `?type=` deep links and return behaviour. The Today rebuild, weekly review and first-run card remain Phase 4; the pinned `today-next-action` guard is their contract.

## Unified redesign — Phase 4 Today timeline, weekly review and first-run setup — 18 October 2026

Executed Phase 4 of the approved unified redesign (design contract `docs/superpowers/specs/2026-10-17-unified-redesign-design.md`, plan `docs/superpowers/plans/2026-10-17-unified-redesign.md`) on branch `redesign/unified-uiux`. This phase rebuilds Today around a single next action, adds the guided weekly review at `/review` and introduces a self-dismissing first-run card — again with no storage, record-shape, routing or dependency change.

**Today leads with the next action.** A Now/Next card (`today-next-action`) now sits directly under the header: it reads the day’s agenda rows first (plan block, routine item or the active session), falls back to the first open task, and otherwise shows “An open day” with a “Plan this day” link — so the first phone screen always answers “what now?”. The active focus session renders as a timeline block (`today-session-block`) above the morning/afternoon/evening groups, so progress in the moment is visible in the day itself rather than only in the global focus banner.

**The rest of the day, in order.** Open tasks (`today-open-tasks`) list the top three open items with an “N more in Tasks” link; the visible quick capture row returns (Water +1 with inline undo, Food, Weight, Note) above the recorded strip and its “Edit records →” link; Study & career collapses to a summary with a single roadmap link so the day no longer carries a duplicate assignment table; “Review this day →” stays, and “Weekly review →” joins it.

**`/review` is the guided weekly review.** Five numbered sections: week at a glance (per-day tasks done, focus/study minutes, quiet days, a reflection flag), wins & lessons, tasks & milestones (completed, carried forward, still open, milestones reached), metrics (weight/energy vs the previous week, focus/study totals), and next week. Step 2 writes exactly one journal record for the week-ending date (`{win, learned, focus, updatedAt}`, preserving an existing `focus` field) and step 5 writes up to three `WeeklyCommitment` entries into `goal.weeklyCommitments` for the following week — existing shapes only, no new keys. The old redirect is gone; Progress Reflection keeps its panel and gains “Open the weekly review”.

**First-run setup card.** `TodaySetupCard` (`today-setup-card`) appears on Today only while the questionnaire is unfinished and a step is open, and lists three existing destinations: goal (`/goal`), modules (`/settings#modules`) and reminders (`/settings#reminders`). Completion is derived, not tracked: goal prefs, presence of `vk:personal:modules`, presence of `vk:reminders`. There is no dismissal flag, so the card self-dismisses the moment the workspace is configured and never reappears for returning users.

**Specs.** Nine failing-first tests were written and verified before implementation (water capture on Today, the recording flow, the review link, plus guards for the next-action card, the timeline session block, open tasks, weekly-review writes and the setup card), then made green by the rebuild. `today-hierarchy`, `daily-life` and `full-tracking-completion` were updated only where the disclosure-based flow legitimately changed.

**Verification.** Full Chromium suite: **399 passed / 0 failed (2.1m)** — including the `today-next-action` guard pinned in Phase 0 and used as this phase’s exit gate. TypeScript, ESLint, the production build and all unit suites (101 `node --test` checks) pass. Visual review used 11 scene captures under `artifacts/ui-ux/redesign-phase4-2026-10-18/`: phone Today populated/session/setup/capture at 390 (light + dark), desktop Today at 1440, and the review page at 390/1440 plus full-page and dark, and Progress Reflection.

**Defect caught in review.** The first capture run crashed Today: `useLocalValue` shares its per-key parse cache with `useSyncedStorage`, so reading the modules key with a `null` initial made `usePersonalModules()` return `null` and broke every seeded Today render. The fix keeps the setup card out of that cache: key presence is detected through a boolean `useSyncExternalStore` snapshot on localStorage. **Follow-up noted, not changed:** any two readers of the same key with different initial values will still corrupt each other’s default through the shared cache — a latent store hazard outside this phase’s scope.

**Boundaries.** Local mode only: authenticated cloud sync, notifications and deployment remain unverified. No `vk:*` keys, record shapes, backup behaviour, share rules or routing aliases changed; `/dashboard?view=reflection` stays intact beside `/review`; no new dependencies. Phase 5 (portfolio tightening and `/work/[slug]` case studies) remains.
