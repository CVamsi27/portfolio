# Germany Roadmap Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task-by-task in this session. The user approved continuation of the reviewed design.

**Goal:** Publish a Germany job campaign with a shared 50-hour weekly timetable and direct primary navigation, preserving existing account history.

**Architecture:** Private content is generated from the canonical Bible plan and imported into the owner's existing career record. Generic components render that account content; the shared date-aware schedule powers Today and Roadmap. An owner-scoped compare-and-swap update preserves all unrelated rows and progress.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Node tests, Playwright.

## Global Constraints

- Personal content remains in the private Bible or authenticated account storage; no private document import into the client bundle.
- Start the new timetable on 2026-10-12; preserve earlier schedules and the 2026-09-30 through 2027-01-07 study range.
- Weekdays 540 minutes; Saturday 300 minutes; Sunday no required blocks; weekly total 50 hours.
- Preserve evidence, old checklist IDs, custom career fields, tasks, reminders and other accounts.
- Roadmap has one active primary navigation item; keep mobile capture and old view links.
- Legal facts are dated 2026 with conditional qualification and employer requirements; recheck for 2027.
- No applications, messages, social posts or OSS submissions are sent by this release.

### Task 1: Shared schedule and navigation

Files: `src/lib/personal-timetable.ts`, `src/lib/personal-timetable.test.ts`, `src/lib/personal-nav.ts`, `src/lib/personal-nav.test.ts`.

Interface: `personalSchedule(email, date): PersonalSchedule | undefined`; empty schedule means recovery, undefined means no owner override.

- [x] Add tests with literal expected totals 540/300/0, rotation, strict date validation, weekly 3000 minutes, historical 600/240 and other-account isolation.
- [x] Observe failure with `node --experimental-strip-types --test src/lib/personal-timetable.test.ts src/lib/personal-nav.test.ts`.
- [x] Implement future schedule selection: `date >= "2026-10-12" ? campaignSchedule(day) : historicalSchedule(day)`; retain old objects.
- [x] Promote Roadmap between Plan and Health; remove `/roadmap` from Plan's child routes; prove exactly one active item.
- [x] Run the tests again and review mobile capture dimensions in Task 4.

### Task 2: Canonical content and private generator

Files: private Bible `personal/reports/100-day-job-roadmap.md`, `personal/profile.yml`, approved report; website `scripts/generate-germany-roadmap.mjs`, `scripts/generate-germany-roadmap.test.mjs`, `src/lib/germany-roadmap.ts`, `src/lib/germany-roadmap.test.ts`.

Interface: `GermanyRoadmap` has version, reviewedOn, startDate/endDate, target, sourceDigest, weeks, allocations, sections and sources. Each week has number, start/end, study, deliverable, campaign and stable `germany:2026:wNN:study|project|campaign` evidence IDs.

- [x] Reconcile one active plan from the approved design and remove unconditional eligibility language.
- [x] Test generator against a controlled private fixture: twelve contiguous weeks, source fingerprint, escaped table cells, bad date rejection, no publication of private inputs.
- [x] Generate private `germany-job-roadmap.json` from the canonical Markdown, using its timetable/week tables and substantive workstream sections.
- [x] Test current week before/during/after cycle and evidence acceptance without auto-completion; implement those pure helpers.

### Task 3: Focused authenticated roadmap view

Files: `src/components/career/GermanyRoadmap.tsx`, `src/app/roadmap/page.tsx`.

Interface: component receives `plan`, `date`, `schedule`, `executionState`, `onSaveEvidence(item, evidence)` and `onVerifyEvidence(item, evidence)`; uses existing account storage and timetable component.

- [x] Add Playwright cases for primary Roadmap, overview, full weeks, date selection/recovery, evidence save versus verification, reload and legacy views.
- [x] Render target, selected week mission, shared timetable and three next actions before expandable weeks; preserve curriculum/revision and career resources.
- [x] Render meaningful empty state when no account plan is available; never import the private JSON as a client fallback.
- [x] Replace stale Germany legal cards with source-linked 2026 conditions, qualification uncertainty and no fixed processing guarantee.
- [x] Keep catalogue and motivation/history behind on-demand details; Sunday retained chapters are optional browsing.

### Task 4: Owner merge and release verification

Files: `scripts/sync-germany-roadmap.ts`, its merge helpers/tests, `scripts/sync-roadmap.ts`, `scripts/align-personal-timetable.ts`, generated curriculum, README.

Interface: targeted owner update reads `career_command_center` and `timetable_100_days`; shallow merge preserves fields, patches future schedule only. New milestones reuse existing execution storage without replacing it.

- [x] Test actual merge with old evidence/tasks/reminders/custom profile and historical days; assert untouched inputs and output preservation.
- [x] Dry-run account sync, back up existing rows under private Bible with mode 0600, apply each row with expected `updated_at` and verify exact readback; stop on conflicts and record partial-write status honestly.
- [x] Adapt full future seed to merge existing career fields and use the union of study and Germany IDs; refresh annual/legal fields.
- [x] Regenerate catalogue after Bible metadata writers, prove private exclusion and preserve range and chapter IDs.
- [x] Run lint, type check, Node suites, production build and focused Playwright plus navigation/public regressions; inspect light/dark at 320/390/768/1440.
- [x] Run Bible doctor, verification and standalone links before commit; commit only scoped changes in each repository.
- [x] Push portfolio to its existing Git-connected Vercel production deployment, inspect deployment and live assets. Verify account database separately; report authentication verification limitations if any.

## Release verification checkpoint

The initial production deployment from `3fc9def` succeeded. Authenticated live checks verified all 36 milestone records, the primary Roadmap link, dated 9-hour weekdays / 5-hour Saturday / recovery Sunday, weekday rotation, Today alignment, reload preservation and dated Germany guidance. The owner data release changed only its selected rows and retained all other rows, historical days and execution evidence. The approved phone-free resume export is served byte-for-byte by the public download.

The final full browser run exercised 312 cases: 307 passed in the parallel run and five load-dependent timeouts passed in a serial rerun. The new theme/width checks use the app's saved theme and require 12px labels, unclipped text and 44px touch targets. The mobile dock retains all five destinations and Add at 320px. Linux CI exposed wider inherited monospace glyphs in the active Roadmap label. The long labels now have 64px minimum widths and use the same sans font as the navbar; a separate 320px case blocks web fonts to exercise fallback rendering. Navigation assertions now include Roadmap. Separate timing fixes wait for committed date navigation and worker activation, and hold the daylight-saving test clock until the explicit advance.

Lint, type checking and all 33 Node tests passed. The Bible's verification gates, standalone link check and personal symlink doctor passed. The Git-connected follow-up deployment and full remote CI remain independently observable release checks in GitHub and Vercel.
