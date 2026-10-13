# NOVA Full Layout Implementation Plan

> **For agentic workers:** Execute this plan inline with the executing-plans workflow, task by task. The user has approved D01–D13 and explicitly authorized implementation.

**Goal:** Implement the approved full personal-workspace layout with one timetable, visible Motivation, prominent factual progress and focused Exams.

**Architecture:** Preserve the existing stores, route contracts and record editors. Add a shared leading progress surface with a pure metric presentation layer; place it after each relevant page title. Simplify the existing page compositions and extract Exams into a focused component without changing assessment rules.

**Tech Stack:** Next.js 16, React 19, TypeScript, existing Tailwind/NOVA styles, Lucide, Node test runner and in-app browser.

## Global Constraints

- Retain the approved Open agenda fonts, teal accent, light/dark theme, five primary destinations and phone dock.
- Today is the only timetable surface. Plan edits user-created activities; remove Unscheduled tasks and Learning shortcut.
- One relevant chart leads progress pages; no fake personal data or decorative charts on content/settings pages.
- Preserve account boundaries, two-account access policy, immutable exam attempts, evidence gates, history, sync and draft/error recovery.
- Preserve the earlier Sharing changes. Initial implementation excluded Git publication; the user subsequently authorized commit, push and merge during the final pass on 13 October 2026.

### Task 1: Navigation, frame and chart presentation

**Files:** `src/lib/personal-nav.ts`, `src/lib/personal-nav.test.ts`, new `src/lib/progress-presentation.ts` and its test, new `src/components/progress/WorkspaceProgressLead.tsx`, `TrendChart.tsx`, `PersonalShell.tsx`, `ChapterHeader.tsx`, `src/app/more/page.tsx`, `nova-workspace.css`.

**Interfaces:** `progressMetric(path, view): metric | null`; `metricPoints(days, metric, weightUnit)` produces dated values with missing readings preserved. `WorkspaceProgressLead` renders range/metric, factual trend, coverage and a record action.

- [x] Add failing tests for Motivation as the first tool and progress metric mapping/conversion/missing dates.
- [x] Run `node --experimental-strip-types --test src/lib/personal-nav.test.ts src/lib/progress-presentation.test.ts` and observe the missing behavior.
- [x] Implement the shared presentation and responsive chart; use recorded data from `usePersonalProgress`.
- [x] Honor shell actions, reduce generic subtitles, add Motivation to Tools and verify the tests.

### Task 2: Today and Plan

**Files:** `src/components/daily/DailyWorkspace.tsx`, `src/app/plan/page.tsx`, new `src/lib/plan-presentation.ts` and its test.

**Interfaces:** `editablePlanBlocks(blocks, date, days)` returns valid, nondeleted user blocks in the chosen period; excludes owner/timetable blocks and preserves completed activities.

- [x] Test selection of user activities, exclusion of fixed/deleted blocks, and week/date boundaries before implementation.
- [x] Show the focus trend immediately after Today's header; preserve the agenda, next action and date selection.
- [x] Replace Plan's repeated day agenda with editable activity rows and a week editor; remove queue and Learning link.
- [x] Preserve overlap confirmation, task scheduling deep links, save errors, Undo and focus entry.

### Task 3: Roadmap and Exams

**Files:** `src/app/roadmap/page.tsx`, `GermanyRoadmap.tsx`, `GermanyExecutionView.tsx`, new `GermanyExams.tsx`, `GermanyExamForm.tsx`, `src/lib/germany-execution.test.ts`.

- [x] Keep existing exam tests as the rule regression gate; test any new score-trend selection against mixed rounds, tracks and versions.
- [x] Present Today / Curriculum / Career navigation while preserving existing resource/deep links.
- [x] Remove all rendered Roadmap timetables; link to Today. Move long guides/resources into named disclosures.
- [x] Show round/track score trend, next-attempt action, current rubric, repair/retake and read-only attempt history. Reuse the existing exam form and immutable append behavior.

### Task 4: Progress and Health

**Files:** `ProgressDashboard.tsx`, domain pages and existing health/nutrition components, `WorkspaceProgressLead.tsx`.

- [x] Replace the six-card default overview with Health / Work / Reflection and one metric/range/chart.
- [x] Keep through-date, dated readings, coverage, import provenance, milestone and journal workflows reachable.
- [x] Put relevant domain charts before forms; reduce repeated metrics/helper text and hide occasional setup/history in disclosures.

### Task 5: Motivation, Library, Sharing, Settings and Capture

**Files:** corresponding `src/app/*/page.tsx`, `FocusScene.tsx`, capture/health components, `nova-workspace.css`.

- [x] Keep one Motivation goal action; make the attributed image optional and retain reminders.
- [x] Put Library/Sharing creation in contextual editors, saved content first; hide empty search/filter controls.
- [x] Group Settings as Account / Appearance / Notifications / Focus / Data, with theme under Appearance and destructive controls in Data.
- [x] Keep contextual capture fields, date/unit, return links and sign-in minimal chrome.

### Task 6: Validation and handoff

- [x] Run focused Node regressions for progress/planning/navigation/exams and record behavior.
- [x] Run TypeScript, lint and production build; repair failures before handoff.
- [x] Run local preview with cloud configuration empty; check desktop and narrow-phone core actions in the in-app browser.
- [x] Compare the selected design reference with rendered screens, record findings in `design-qa.md`, and fix material layout issues.
- [x] Record completed tasks and implementation status; leave a reviewable diff and local preview.

## Completion evidence — 13 October 2026

D01–D13 are implemented. The focused Node suite passes 58/58; TypeScript, ESLint and the production build pass. Final in-app browser checks use an isolated local build with all Supabase public configuration empty. The preview is `http://127.0.0.1:4198/hub`.

Desktop and 320px phone checks cover navigation, leading charts, content-page chart exclusions, contextual editors, activity week/date preservation, Settings defaults and Exams draft protection. Exams use the actual reviewed schema in an isolated in-memory harness, not either owner's cloud account. Full screenshot comparisons and limitations are recorded in the appended full-workspace section of `design-qa.md`. The standalone Playwright suite and authenticated production writes were not run.

At continuation, the branch already contained implementation commit `c1146ee` and plan commit `6b405af`. The final refinement pass updates presentation and QA/status documentation. The user has now authorized committing, pushing and merging the branch; the repository CI is the release verification gate.
