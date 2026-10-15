# NOVA clean-app plan

Status: direction A / C01–C16 approved by the user’s continuation on 14 October; implemented locally on `fix/nova-clean-app`. Validation and release limits are recorded below.

User direction: “I still see lots of unnecessary stuff, please scan all and implement a clean app, plan 1st.” Scope is the full personal.buildora.work workspace, carrying forward the approved NOVA visual identity, progress charts on tracking pages, and Germany photographs above Motivation text.

## Audit basis and limits

Current source: main at bf6b1c1. Reviewed the route inventory, shared shell/navigation/chart components, page markup, and major supporting workspaces. Captured local desktop route/view states and eight representative phone pages using the in-app browser. Evidence is under `artifacts/ui-ux/clean-app-audit-2026-10-14/`; `index.json` maps captures to routes. Overview images: `primary-overview.png`, `health-overview.png`, `tools-overview.png`, `secondary-overview.png`, `phone-overview.png`.

Browser evidence uses the current production build in local mode with fresh browser storage: predominantly empty records, default goal/workout data and the shipped study catalogue. It does not establish the layout of either owner's authenticated campaign, populated sharing inbox, successful cloud operations or active exam. Those paths were inspected in source and require populated/authenticated verification during implementation. `/review` is a compatibility redirect; its transition capture is not treated as a separate finished screen.

The public portfolio at `/` and `/portfolio` is a separate product surface. Its boundary was inspected; the cleanup applies to the personal workspace and its entry/auth routes, not to portfolio content or backend services.

## Findings that drive the plan

1. **Repeated context:** Today shows a header date, week strip and separate date field. Plan repeats the date above and below progress. Sleep/recovery has an outer day selector and another date inside capture. Reflection has a through-date plus editor date and another entry route.
2. **Large empty chart regions:** many pages show a heading, range selector, interval, “No readings”, coverage and record link before any task. At 390px these regions occupy a substantial part of the first screen. Keeping a relevant top chart does not require six separate empty-state elements.
3. **Overlapping navigation/actions:** desktop Tools entries coexist with a second Tools menu. Food has five wrapping tabs and Log meal/Log food controls on every view; its Progress view adds another range control. Health rows expose both capture and destination links. Several header actions only jump to an already-visible region.
4. **Legacy Roadmap layers:** the default local Today view exposes an unavailable-campaign notice, an expanded study catalogue, Audio break, multiple ways to open the same chapter, task guides, and three footer disclosures for progress/source/overview. Curriculum opens with Today filtering and an expanded day checklist rather than a clear catalogue.
5. **Forms before useful content:** Goals opens with an empty weekly-commitment form. Saved foods shows a meal-template form even when there are no consumed meals to save. Food's empty diary opens with a day-review form and disabled completion buttons.
6. **History duplicates analytics:** Workout history repeats a weekly strip, three counters, personal records and weekly volume beneath the top chart. Fasting history opens with automatic-retention settings, then a second chart and four zero-value statistics before the history list.
7. **Administrative details on daily pages:** Health Connections includes pairing, source records, import/export and deletion controls together. Settings Data renders raw storage keys, including many empty entries. Sharing shows storage totals even when nothing is saved.
8. **Status repetition:** “Local only”, “Saved on this device” and account sync descriptions recur across headers, forms and Settings. A stable save mode should be expressed once; save failures and active sync errors must stay visible.

## Direction choices

- **A — Workflow cleanup (recommended):** keep useful capabilities, reduce each default page to its main task, remove repeated UI, and give secondary workflows one clear home. This directly addresses the observed clutter without requiring data migrations.
- **B — Smaller cosmetic pass:** reduce padding and captions while keeping the current navigation and panels. Lower scope, but leaves the competing actions and duplicate pages.
- **C — Feature reduction:** remove entire modules such as recipes, fasting, reminders or Sharing. This requires the user to choose which capabilities to retire and creates greater migration/support risk. It is not the proposed implementation.

## Shared layout contract — C01

Keep the five primary destinations: Today, Plan, Roadmap, Health, Progress. Keep Motivation first among Tools, followed by Library, Sharing, Settings. Desktop uses those direct entries without a second Tools dropdown; phone keeps the five-item dock and one Tools menu. `/more` remains a simple directory for compatibility.

Every work page has one title, one relevant date/context control, one primary action, one top progress region when the active view tracks records, then its main content. Secondary actions go into an explicitly labeled menu or editor. Remove duplicate headings, counters, link clusters and permanent help paragraphs rather than adding more nested disclosures.

Retain Inter/body, Space Grotesk/headings, the existing NOVA mark and tokens: pale canvas #f3f7fb, ink #172b40, white work surfaces, teal #176c78, muted #e5edf3/#526579, and existing dark equivalents. Use one flat working surface with row dividers; separate panels only for distinct tasks. Keep the 224px desktop rail, 1120px content limit, 32px desktop gutters and 16–20px phone gutters. No new theme, animated decoration or dependency is needed.

Phone actions do not become full-width blocks merely because the viewport is narrow; use an adjacent title/action row when it fits. Keep labels, 44px controls, keyboard focus, natural wrapping, and dock clearance.

## Progress contract — C02

Keep a relevant chart at the top of tracking views, as previously requested. Use one shared range control and a compact metric control. Keep units, gaps, source/coverage and accessible dated values.

When empty, replace the stacked chart scaffold with one short line such as “No focus recorded · 30 days” and a useful record action if it is not already present. Do not show blank plot space, repeated zero totals, or redundant “0/30” captions. The range remains reachable in the same compact toolbar. A populated chart expands normally above the work area.

Content/configuration views such as Saved foods, program setup, device pairing and exam guides do not inherit an unrelated chart just because they share a route with a tracker. Progress/insight views have one chart/range owner, avoiding Food's separate 30-day and 7-day selectors.

Missing records remain unknown or absent. In particular, the legacy fasting history zero statistics and Health's missing-water display must not imply confirmed zero activity. Keep explicitly recorded zero valid. Do not change scoring, logging-completeness, evidence, nutrition or medical rules to simplify display.

## Page decisions

| ID | Page and default layout | Remove from default UI | Single home for secondary work |
| --- | --- | --- | --- |
| C03 | **Today**: title/date → compact focus chart → week strip → today's timed agenda. One contextual Plan action on an empty day. | Separate duplicate date field; repeated Your day label; competing Plan tomorrow/Start focus/empty-state prompts; permanent clock/reminder links. | One Add record action opens capture. Review day opens the canonical reflection editor. Timezone and notification configuration belong in Settings; urgent/active reminders remain contextual. |
| C04 | **Plan**: title/date + Add activity → focus chart → Day/Week switch → editable activity rows. | Date repetition, Focus tools panel, always-visible View timetable, navigation that mixes editing views with Tasks/Goals destinations. | Tasks and Goals remain plainly labeled child links. Focus starts from an activity or a small Focus action; advanced preferences stay in Settings. Week presents an editor, not a duplicate Today timetable. |
| C05 | **Roadmap Today**: title/date → study chart → current assignment → Start study → required proof/next action. | Audio break launcher, repeated Web tab/Deep Study/open-external actions, progress rings beside a top chart, generic priority prose, source/weekly/progress footer panels. | Curriculum owns chapter catalogue and revision. Career owns applications, outreach, role research, Germany guides and Exams. Detailed task instructions open beside the relevant task. |
| C06 | **Curriculum, Career, Exams**: searchable compact chapter rows; one career section selector; focused round/track score trend and next attempt. | Six-tab chapter-detail toolbars and repeated task descriptions in every row; overlapping Career resources navigation; empty guide/history sections in an unused exam. | Open a chapter/day detail for checklist, practice and resources. Career guides and campaign context have one Guides home. Keep current-rubric scoring, explicit failing gates, human/self review, repair, assisted labels, draft guards and immutable history. A missing campaign notice appears only where campaign work is needed; usable study content remains primary. |
| C07 | **Health**: selected date → chosen health chart → Food/Water/Body/Exercise/Sleep rows, each with one useful action. | Paired Record/Open links on every row, duplicate trends link, Manage reminders in the header, Connections tab among daily views. | Row label opens its detailed tracker; contextual Add/Edit or Water +1 performs the record action. History and Sleep remain local views. Connections moves to Settings → Data; old links remain valid. |
| C08 | **Food**: date + Add food → energy chart → concise known totals → meal rows. Main views: Diary, Saved, Nutrients. | Permanent Log meal/Log food pair across all tabs; empty day-review panel; Strategy and Progress as separate primary tabs; template forms when nothing can be saved. | Add food opens one editor with food/meal paths. Saved has contextual New food/Recipe/Meal actions. Targets/program configuration lives under Food settings. Insights belongs under Progress with a compatible Food link. Reviewed/partial/estimated/fasting states remain honest, editable metadata; do not auto-confirm fasting or completeness. |
| C09 | **Body, Exercise, Water, Eating window, Sleep**: one date, the relevant chart, the active entry/session, and a concise history path. | Weigh-in empty-history panel, duplicated session jump, Full Body plus Full selector repetition, compound/isolation badges where they do not change the action, eight water-setting buttons, percent plus repeated volume counters, zero-stat history grids, long fasting-stage guide in everyday logging. | Weight target and extra measurements open on demand; workout Plan owns split/unit/plate tools; History owns records; Water uses total and +/- controls with adjustment available; Eating window owns setup, timer and records; Sleep has one date and optional recovery fields. Move retention controls to settings without changing their value or behavior. Preserve existing meal-window timing, manual edits and Undo. |
| C10 | **Tasks**: title + Add task → compact completion chart → Open/Completed → task rows. | Big empty-state card, priority/tag/action badges and multiple icon controls on every row. | One row menu for Edit, priority/tag, Focus and recoverable Remove. Show filters when needed; due date and actual completion remain visible. No task backlog returns to Today or Plan. |
| C11 | **Goals**: saved goal title → relevant metric/milestone chart → next milestone and milestone list. Metric logging is a clear local view. | Purpose/Milestones split that hides the actionable list; empty weekly-commitment form; duplicate next-milestone link/heading; four reorder/edit/delete buttons on every milestone; reflection-prompt footer. | Edit goal and optional weekly commitment open in one goal editor. Milestone menus own edit/reorder/remove. Existing weekly records remain editable. Motivation remains a direct link; metric quick increments stay near metric entry rather than in the purpose view. |
| C12 | **Progress & reflection**: title/through-date → category and metric → one chart/range → dated readings. Reflection is a view with one Write/Edit action. | Through-date below the chart; repeated explanations; permanent three-field reflection editor in analytics; duplicate independent Journal screen. | One canonical dated reflection editor backs `/log?view=journal`, `/review`, and Progress reflection links. Existing URLs, record dates, history and unsaved-edit protection survive. |
| C13 | **Motivation**: beautiful Germany photograph → one reminder → saved goal/next step → Open Roadmap or Review goal. | Generic filler paragraph where it only repeats the goal, routine milestone counter, always-visible Save/Copy/Personal reminders button cluster. | Keep manual photo choice, accurate caption/credit, and text below the image. Another reminder stays visible; Save, Copy and Personal reminders live in one clearly labeled reminder menu. Keep custom/saved reminders, success/errors and image recovery. |
| C14 | **Library & Sharing**: saved content list with one New action. Sharing keeps My items/Inbox and explicit access status. | Repeated Saved drops/count heading, storage summary when empty, permanent per-item Copy/Pin/Share/Delete clusters, multiple type/goal/tag badges. | Row open/view plus one actions menu. Access management remains explicit and separate from saving. Rename drop wording to item consistently if approved. Storage caps appear when relevant; backup/storage details live in Settings. Preserve expiry, source links, denial states, existing audience values and recoverable removal. |
| C15 | **Settings & Tools**: focused account/theme/preferences/data screens; a short Tools directory. | Duplicate Local only/mode blocks, raw empty storage-key list, repeated export buttons, setup slogans, unrelated study-site link and duplicate Reminder settings directory entry. | Account shows one sync state. Notifications owns delivery preferences; Routine owns schedules. Data owns device connections, backup/restore and explicit destructive controls. Advanced storage shows friendly populated module names on request; debug keys stay out of normal UI. Module toggles keep all data. |
| C16 | **Capture, entry and sign-in**: direct editor for the originating task; one Google action with accurate account/error state. | Change type and a second date when the context already supplies them; instruction-only Exercise capture detour; full workspace navigation on a standalone editor/sign-in; recurring public marketing introduction for an existing user. | Contextual capture returns to its original route/date. Exercise opens the session directly. Standalone capture retains a type picker. `/trackers`, `/hub`, entry/onboarding aliases and safe auth returns stay compatible. The two approved-account policy is unchanged. |

## Implementation boundaries

This is a presentation and workflow consolidation. Reuse current stores and hooks; do not delete saved records, alter module preferences, rewrite the approved country/goal, change schedules, change exam criteria, or expand access. Preserve exports/imports and historical snapshots. Remove obsolete presentation components only after every consumer/deep link has a replacement.

Prefer shared page-header/date/action, progress-state and row-action patterns over additional page-specific CSS overrides. View choice, selected record date and return route must stay stable through reload/back navigation. Modals/editors preserve failed or unsaved drafts; destructive actions retain explicit confirmation/recovery. No cloud or notification permission is triggered by merely opening a page.

Primary files: `PersonalShell`, `TrackerNavDock`, the app rail/header, `WorkspaceProgressLead`, `TrendChart`, `DailyWorkspace`, `DaySelector`, `HealthWorkspace`, `CaptureWorkspace`, `JournalWorkspace`, `FoodTracker`, `NutritionDayQuality`, `MealLibrary`, `ProgressDashboard`, `GermanyExecutionView`, `GermanyExams`, and the individual Tasks/Goals/Body/Workout/Fasting/Motivation/Sharing/Library/Settings routes. The execution checklist is `docs/superpowers/plans/2026-10-14-nova-clean-app.md`.

## Execution order after approval

1. Shared shell, context/date/action rules and compact chart-empty states (C01–C02). Check representative Today/Food/Settings frames before propagating.
2. Daily work and planning: Today, Plan, Tasks, Goals (C03–C04, C10–C11).
3. Study and career: remove legacy Roadmap duplication; verify authenticated campaign, curriculum, active study and exams (C05–C06).
4. Health and its entry flows: Health, Food, Body, Exercise, Water/window, Sleep, imports (C07–C09).
5. Progress/reflection, Motivation, saved content, Settings, capture and entry routes (C12–C16).
6. Full QA, final review, then release only when requested. Each phase must meet the shared contract; do not stop after a sample page looks cleaner.

## Acceptance and release evidence

- Audit every default screen plus its menus/editors with empty, populated and relevant active/error states. Track all page decisions C01–C16 as implemented or explicitly deferred.
- At 390×844 and 320×844, the default work content begins within the first screen above the dock on ordinary tracking pages. The deliberate Motivation image and a genuinely active timed session may use more space. Do not meet this target by shrinking readable controls or hiding essential evidence.
- One visible date control per work context; one chart/range owner per tracking view; one main action; no duplicate storage/status narration; no empty history/stat grids. Secondary actions are reachable in one local action/menu, not nested multiple levels deep.
- Source controls do not move to a screen where they are undiscoverable. Verify keyboard access, focus return, current tab/menu state, touch targets, dock clearance, dark mode, long titles and missing images.
- Test saved-data preservation, dates/back/reload, new/edit/complete/Undo, Food portion review and logging quality, active sessions, explicit sharing/access/expiry, pairing/backup, exam scoring/immutable history, and unsaved drafts.
- Preserve original curricula, URLs, authored exercise content and reading order. Clean the surrounding UI, not the learning material.
- Typecheck, lint, focused unit/domain tests, production build and complete CI browser suite must pass. Add/update meaningful behavior tests for consolidated flows; do not weaken evidence/security tests to make the cleanup pass.
- Compare browser screenshots against the approved layout using populated states, including the two owners' authenticated campaign where available. Report blocked account-specific checks separately from local success.

## Approval

Direction A and C01–C16 were approved by continuation and implemented locally. Food has three primary views; the reflection editor has one title and no analytics chart; Connections and retention live in Settings; secondary reminder/row actions use accessible menus; tracking pages retain compact empty states and populated charts. The optional terminology change from “drop” to “item” was not applied: saved sharing terminology remains compatible. No production deployment or account import is included.
