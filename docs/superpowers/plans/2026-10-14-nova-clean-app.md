# NOVA Clean App Implementation Plan

> Execute inline using executing-plans. Design C01–C16 approved by the user's “continue” on 14 October 2026. Work on fix/nova-clean-app; preserve the main checkout's records and unrelated changes.

**Goal:** Give each personal-workspace page one clear task while preserving all useful capabilities and data.
**Architecture:** Shared compact progress/context and row-action patterns; existing stores and compatible routes. Contextual editors replace permanent configuration forms. No migrations or new dependencies.
**Tech Stack:** Next 16, React 19, TypeScript, existing Radix menus, existing CSS tokens.

## Constraints

Charts remain at the top of tracking views; Germany photographs remain above Motivation text. Keep the two-account access policy, saved data, curricula, schedules, exam rubric/history, explicit sharing and unsaved-draft protections. No deployment in this implementation request.

## Tasks

- [x] 1. C01–C02: shared layout. Test `progressMetric('/food','saved') === null` and compact empty summaries before implementation. Files: progress-presentation.ts/test.ts, WorkspaceProgressLead, Navbar, nova-workspace.css. Native chart units/gaps remain. Existing desktop Tools destinations retain access to capture/search/session.
- [x] 2. C03–C04/C10–C11: daily planning and task/goal rows. Files: DailyWorkspace, DaySelector, todo/page, goal/page, shared ActionMenu. Remove duplicate date/panels; put row operations into menus; default goal shows actual purpose and milestones. Verify add/edit/complete/Undo, date changes, query deep links and draft retention.
- [x] 3. C05–C06: study/career. Files: roadmap/page, GermanyExecutionView, GermanyExams. Remove duplicate launchers/summary panels, default catalogue shows actual catalogue, guides remain reachable in detail. Verify chapter opening, original task guides, campaign unavailable state, active study and exam data contracts.
- [x] 4. C07–C09: health. Files: HealthWorkspace, FoodTracker, MealLibrary, weight-loss/page, workout-tracking/page, intermittent-fasting/page. Move connections to Settings Data with legacy route support; use one date and contextual logger; retain specialized nutrition insights through a secondary link; remove redundant empty history statistics. Verify food portion/day-quality, weight, water Undo, meal windows, workout sets/history.
- [x] 5. C12–C16: remaining surfaces. Files: ProgressDashboard, JournalWorkspace, motivation/FocusScene, archive/page, share/page, settings/page, CaptureWorkspace, more/page. Reflection has one editor with date/return context; row actions and reminders use menus; backups/devices/limits remain available. Verify saved reminders, library, explicit sharing, return paths and auth behavior.
- [x] 6. Local QA. Update tests for intentional hierarchy changes without weakening evidence/access invariants. Run typecheck, lint, production build, focused Node domain tests. Use in-app browser for desktop/320px/390px, empty/populated/active/error checks. Append design-qa evidence and accurate account-specific limitations. Mark C01–C16 only when implemented or explicitly report remaining work.

Behavior test cycle: use Node tests for pure progress/state contracts and the in-app browser for actual layout/actions. Existing browser regression specs remain the CI release gate; local direct Playwright remains subject to the prior browser-use constraint. Red evidence includes the captured current pages showing duplicate dates, chart scaffolds, permanent forms and controls.

## Verification record — 15 October 2026

- C01–C16 implemented locally. Shared actions preserve modal focus return; empty charts stay compact; catalogue/configuration and capture editors omit unrelated charts. Food Diary keeps calories/protein and the meal list; full nutrient coverage remains in Nutrients.
- The production build and typecheck passed. Lint was rerun after correcting a formatter-moved image directive. Fifty focused Node tests passed, including meal-date gaps, account key isolation, nutrition snapshots, timetable and exam rules.
- Full browser regression run: 329/329 passed in 2.0 minutes after adapting the intentionally moved controls. A subsequent Food simplification passed all 45 affected nutrition/personal-tracking cases. The final reflection-editor checks are recorded in design-qa.md. These runs use local mode and independent test storage.
- Visual scan: 19 default desktop routes plus Motivation, 18 default routes at each of 320px and 390px; no document overflow. Populated dark-mode captures cover Food, Goals, Tasks and Motivation. Original captures and comparisons remain under artifacts/ui-ux/clean-app-implementation-2026-10-14.
- Release gate still external: owner-authenticated campaign, live cloud sharing/device operations, and production deployment were not verified in this local-mode run. Existing storage and account permissions were not changed.
- The user’s separate detailed career-plan request is a review proposal in the private Bible reports workspace, now using the confirmed full-stack / 60-hour budget. It has not replaced saved account assignments.

The final standalone editor removes its analytics chart and duplicate title. History selection now updates the URL so reload opens the same reflection. The new regression first failed on the stale date URL, then passed after the correction; the completed final run is recorded in design-qa.md. No saved records were migrated or deleted.


Subsequent final verification (15 October): the user approved implementation of the private 60-hour timetable design. The completed renderer/authoring extension and the full cleanup now pass **334/334 browser cases**, plus 39 career/authoring cases, production build, TypeScript, lint and whitespace checks. This supersedes the earlier final-revision browser-run limitation above. No cloud import or deployment was performed.
