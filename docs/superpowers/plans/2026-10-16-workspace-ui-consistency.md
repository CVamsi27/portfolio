# Workspace UI consistency corrections

> Execute inline against the already approved C01–C16 clean-app contract. This is a repair of the selected design, with no new product direction or account changes.

**Goal:** Make NOVA page hierarchy, actions, dates, tabs and touch controls consistent.

**Architecture:** Extend the shared header with a context slot for date controls. Screens that own their date state render that header before their progress lead. Keep existing stores, dates, URL handlers, evidence and draft semantics. Apply the existing palette, typefaces and 8px control radius through scoped workspace styles.

**Tech stack:** Existing Next.js, React, TypeScript, CSS and Playwright. No dependencies.

## Constraints

- Keep 36px desktop / 28px phone page titles, 224px rail and existing content gutters.
- One date context before the relevant chart; form-only dates stay with their form.
- Compact header actions wrap naturally; no blanket full-width action on phones.
- View navigation uses existing underline tabs; choice inputs retain segmented controls.
- Completion controls retain a square 44px touch area around a smaller indicator.
- Preserve all records, timetable fields, security, assessment rules and deep links.

## Tasks

- [x] Capture current Today, Plan, Roadmap, Health, Food, Body, Workouts, Progress, Goals, Tasks, Motivation, Library, Sharing and Settings; record repeatable drift. — Drift was inventoried by running the full browser suite against the existing build (17 repeatable failures, listed under Verification); the pre-change capture set was not retained.
- [x] Add browser regressions for date context before chart, date/view/reload preservation, phone header action fit and square completion touch controls. Run against the existing build and confirm the affected cases fail. — The affected cases failed against the existing build and were repaired; the new `e2e/workspace-consistency.spec.ts` pins the repaired behaviors and passes.
- [x] Add `context?: ReactNode` to ChapterHeader/PersonalShell/TrackerShell. Add optional shell progress ownership. Place Health, Food, Progress and Workout date contexts before their chart; use the shared date arrows with existing accessible labels.
- [x] Reuse the compact header for Sharing and the view navigation for Tasks. Use plain empty states and remove the redundant one-option workout banner.
- [x] Normalize shared workspace header spacing, control radii, primary action type, card radii and empty-state treatment; retain theme tokens and focus states. Repair milestone and exercise completion buttons with a square hit target plus inner indicator.
- [x] Run focused workflow tests, full browser suite, typecheck, lint and production build. Inspect before/after desktop and phone captures and record limits. Commit, push and merge only if release checks pass, following existing user authorization. — Verified below.

## Verification (2026-10-17)

- Drift inventory (full suite against the existing build): 17 repeatable failures — the todo "Task view" accessible group, workout exercise-card selectors, eight hydration mismatches from an implicit-locale date on Goals, and the mobile milestone width at 320px.
- Repairs: `WorkspaceViews` renders `role="group"` again; `src/lib/trackers.ts` and `src/app/archive/page.tsx` pin dates to `en-US`; the mobile milestone name wrap is restored in `nova-workspace.css`; the workouts spec helper follows the new `workspace-exercise-row` structure.
- Focused run: todos, command-deck, workouts, workspace-completion, workspace-consistency and the full ui-ux landmark matrix — 38/38 pass on the dev server.
- Full suite: **352/352 browser cases pass** on the production build (blanked `NEXT_PUBLIC_SUPABASE_*`, local mode).
- Gates: ESLint 0, `tsc --noEmit` 0, `test:career-curriculum`, `test:germany-roadmap`, `test:personal-access` and `germany-motivation.test.mjs` pass; the pretest production build succeeded.
- Captures: 10 phone/desktop spot checks inspected from the private personal workspace reports directory `ui-refinement-2026-10-17-workspace-consistency/` (Goals 390/1280, Workouts 390/1280, Food, Health, Progress, Tasks, Sharing and Body at 390). Limits: seeded empty-state spot checks, not a full before/after visual diff; the pre-change captures from the start of the pass were not retained.
- Release: the standing user authorization covers commit, push, green checks and merge for this repair; production deployment is Git-connected. No cloud account data or personal content enters this repository.
