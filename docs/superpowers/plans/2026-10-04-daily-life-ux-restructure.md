# Daily-life UX restructure implementation plan

**Goal:** Run work, meals, exercise and reminders from one daily agenda with fast shared capture.
**Architecture:** Pure agenda projection over existing records and new account-scoped planning records; reusable capture/context components; focused workspaces behind four primary destinations.
**Tech stack:** Next.js, React, TypeScript, existing Supabase synced records, Playwright and Node tests.
**Execution:** Inline, in this session. Approved specification: ../specs/2026-10-04-daily-life-ux-restructure-design.md.

## Constraints

Keep all existing records, public portfolio/PDF, owner timetable 10h weekday/4h weekend, reminder identities and nutrient coverage. No inferred health scores, doses or intake. Preserve old routes. Cloud/device release gates require separate evidence.

## Tasks

- [x] Planning records and projection: create src/lib/day-plan.ts, day-plan-store.ts and day-plan.test.ts. Validate dates/timezones/durations/references; project owner schedule and occurrences without persisting duplicates; include blocks/day priorities in backup validation. Run `node --experimental-strip-types --test src/lib/day-plan.test.ts`; first verify failure, then implement and pass. The existing RPC restricts keys, so migration 0009 extends its allowlist. Configured Supabase planning remains gated pending signed-in QA.
- [x] Shell/navigation/capture: modify personal-nav, Navbar, PersonalShell, TrackerNavDock; add CaptureWorkspace and ActiveSessionBar plus local view controls. Write e2e/daily-life.spec.ts for four destinations, compact editor headers, dated capture, saved return context and exact task handoff. Run the new tests against the old build and verify failure. Implement Add as a contextual chooser, retain standalone /log and keyboard compatibility. Remove automatic summary/clock/action-bar stacking.
- [x] Today/Plan: create shared DailyWorkspace for execution and planning; replace trackers and plan entrypoints. Add chronological agenda, current/next, priorities, unscheduled tasks, day/week schedule editor and collision preview. Test reload, deletion/undo and missing linked tasks; use the shared session controller.
- [x] Health: replace health directory with daily records and direct actions; regroup food/workout/body/recovery interfaces with local views. Keep historical corrections and nutrient unknowns; test food/routine independence and meal repeat preview.
- [x] Goal/Learning: move goal configuration into Edit goal and reporting into Progress; add optional task/milestone link; regroup roadmap into focused learning/resources. Preserve source/evidence/timetable tests.
- [x] Progress/tools: add selectable domain views, consolidate reflection and journal, regroup settings and sharing, keep Library retrieval. Extend route tests for old links and view/date persistence.
- [x] Release: complete new journey tests and update obsolete UI expectations to intended behavior; run full browser/domain suite, typecheck/lint/build; inspect populated phone/light and desktop/dark captures; update change sheet/audit with precise limits; commit/push and integrate main.

Each component edit is covered by the meaningful journey tests above; presentation-only changes use populated screenshot and responsive review rather than implementation-mirroring tests. For local browser QA set public Supabase variables blank when building/starting; never move .env. Run `pnpm exec playwright test --workers=4` directly. Do not rebuild .next while browser tests use it.

## Verification and rollout evidence

The pure planning tests failed before implementation, then passed. Shared-capture/agenda journey tests also failed against the old build before their replacements were introduced. Regression audit progressed from 77 failures / 160 passes to 19 failures / 219 passes; the fixes included lost correction notes, missing saved account timetables, Settings hash routing and clock initialization. Obsolete expectations were updated to the approved journeys while retaining storage, public portfolio, source evidence, accessibility and correction coverage.

Production build, TypeScript and ESLint pass. All 52 library/domain tests pass; Bible validation matches 100 days / 556 chapters. Curriculum generation/seed suites pass (7 generator and 11 sync/seed tests, with some library coverage also included in the 52). No live seed was run. Populated 390px light / 1440px dark captures of Today, Plan, Health, Food, Goal and Progress were reviewed under artifacts/ui-ux/daily-*.png (local, intentionally untracked). Final route matrix includes 320/390/768/1440px light/dark layouts.

Water takes one action from Today. Weight opens in one action. Saved food uses three actions from Today: Food, select food, Save after reviewing the portion; amount typing is excluded. Exact task IDs persist into active/completed focus records and cross-page Resume; finishing does not complete the task. Backups reject mismatched planning IDs before writing. Routine edit previews preserve occurrence history.

Migration 0009 was authored, not applied. The configured Supabase build flag remains off by default; authenticated account switching/concurrent/offline writes and real-device push are separate pending gates. Provider/scheduler configuration is unchanged. Rollback keeps planning/nutrition/routine records and disables the new planning controls; see the setup guide.

Complete browser regression: 244 passed. Final focused journeys: 33 passed after the rollout-gate/cross-calendar corrections. Cross-calendar collisions were first reproduced with a failing domain assertion, then corrected to compare instants; all 52 domain/library tests pass. Record corrections, direct task scheduling, independent reminder actions and date-safe water undo remain covered. The final rollout flag gates both ordinary controls and editor submissions, including deep links.
