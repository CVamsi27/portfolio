# Today task ownership implementation plan

> **For agentic workers:** Execute inline in the current feature branch. No delegation is needed.

**Goal:** Remove the duplicate task queue from Today; keep it in Plan as Unscheduled tasks.

**Architecture:** DailyWorkspace remains shared by Today and Plan. Render the task queue only when `planning` is true, preserving its existing task storage, date filtering, priorities, start and schedule handlers. Today's contextual primary action still consumes the existing pending tasks.

**Tech Stack:** Next.js, React, TypeScript, existing CSS and E2E scenarios, Codex in-app browser.

## Approved design and constraints

- User selected this change on 12 October 2026: remove the section from Today and keep Unscheduled tasks in Plan.
- No tasks are deleted, completed or rescheduled by this change.
- Keep the agenda, next-action button and Plan navigation.
- Keep existing Plan capture, pin, start and schedule actions.
- Preserve the earlier Sharing experiment files.
- Use the local production preview with public Supabase configuration blanked; do not run the standalone Playwright browser without separate authorization.

## Task 1: Move the task queue's presentation to Plan

**Files:** `src/components/daily/DailyWorkspace.tsx`, `src/app/nova-workspace.css`, `e2e/today-hierarchy.spec.ts`, `e2e/command-deck.spec.ts`, `e2e/onboarding-hub.spec.ts`, the existing full-site design spec.

- [x] Update the existing task-creation regression: create a task through Plan, verify Today has no queue, verify the task remains visible in Plan under Unscheduled tasks with Schedule available.
- [x] Observe the old behavior in the in-app browser with an illustrative local task: Today still displays Tasks to do.
- [x] Change `(planning || pending.length > 0)` to `planning`, rename the heading to Unscheduled tasks, and remove unused Today queue CSS.
- [x] Update the two existing Today task assertions to verify the contextual action and Plan ownership instead of a duplicate queue.
- [x] Build, type-check and lint; verify Today/Plan on phone and inspect desktop Today rendering. Open Schedule with the saved task selected; do not save the test draft.
- [x] Save before/after screenshots and actual verification results. Keep the local preview available.

## Results

- Before: an illustrative overdue local task displayed Tasks to do on Today. After: the same browser state has zero task-queue panels; Plan has Unscheduled tasks and the same task.
- Today on 12 October still offers Start focused work and opens the existing focus page with that task selected. Schedule opens the time-block editor with the same task selected. No save or completion action was performed.
- Browser evidence inspected: today-before.jpg, today-after.jpg, plan-mobile-after.jpg and today-desktop-after.jpg under artifacts/ui-ux/task-ownership. The desktop Today capture is 1280px wide; phone checks used 390×844. A 1×1 desktop Plan capture was rejected.
- Closing the test scheduling draft hit an in-app-browser control failure. A fresh tab rendered desktop Today correctly, but follow-up desktop interactions could not be confirmed. This limits browser verification; it is not evidence of an application regression. Phone task capture, next-action routing and scheduling selection passed before the browser control failure.
- 14 focused Node tests, lint, TypeScript, production build and whitespace checks passed. The three existing E2E scenarios were updated, but the standalone Playwright suite was not run. Authenticated cloud behavior was not tested.
- The approved full-site spec now records Plan ownership. Existing Sharing experiment edits remain intact. Changes are local on codex/today-task-ownership.
