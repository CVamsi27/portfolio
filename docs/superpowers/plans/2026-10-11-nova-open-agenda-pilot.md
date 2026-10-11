# NOVA Open agenda pilot implementation plan

> **For agentic workers:** Use executing-plans to implement this plan task by task in the current feature checkout. Preserve the existing uncommitted Sharing changes. Execute inline; no agent delegation is needed.

**Goal:** Implement the approved shared NOVA navigation and a responsive Today agenda faithful to the selected reference.

**Architecture:** Retain the existing authentication, storage, schedule derivation and work-session controllers. Navbar owns a desktop rail and mobile Tools menu; TrackerNavDock contains the five primary destinations. DailyWorkspace retains Plan's behavior and uses isolated Today presentation components for calendar navigation and inline agenda details.

**Tech stack:** Next.js 16, React 19, TypeScript, existing Lucide icons, semantic CSS tokens, Node's test runner and the Codex in-app browser.

## Global constraints

- Reference: `docs/superpowers/specs/assets/2026-10-11-nova-open-agenda/today-desktop-selected.png`; proposed phone adaptation beside it.
- Primary destinations: Today, Plan, Roadmap, Health, Progress. Tools: Library, Sharing, Settings, additional utilities on demand.
- Desktop rail 224px at 1024px and wider; five-item phone dock; no duplicated Add controls.
- Light canvas #F5F7FA, surface #FFFFFF, ink #172B40, support #526579, accent #176C78, divider #D8E1EC; preserve specified dark roles.
- Space Grotesk headings and Inter body/numerals; existing NOVA identity; controls at least 44px.
- One contextual primary action; grouped flat rows, chronological time gutter, inline inspection, no persistent task inspector.
- Existing access policy, URLs, stored records, timetable, evidence and session contracts remain intact.
- Scope is the independently testable shell/Today checkpoint. Sharing and Food redesigns are later workflow checkpoints; their earlier uncommitted experiments must not be overwritten.
- Verify local mode with Supabase public configuration blanked. Do not deploy or claim signed-in cloud verification.

## Task 1: Date presentation and navigation ownership

**Files:** Create `src/lib/day-presentation.ts`, `src/lib/day-presentation.test.ts`; modify `src/lib/personal-nav.ts`, `src/lib/personal-nav.test.ts`.

**Interfaces:** `containingWeek(date: string): string[]`; `agendaPeriod(at: number, timeZone: string): "Morning" | "Afternoon" | "Evening"`; `agendaStatus(row: AgendaItem, date: string, today: string, now: number): string`. Reuse `validDay`/`shiftDay`; invalid calendar dates throw rather than produce an ambiguous week. Export `PERSONAL_TOOLS_NAV` and `isPersonalToolPath(pathname: string, href: string): boolean` for the Navbar consumer.

- [x] Write literal fixture tests before implementation. Sunday 11 October belongs to 5–11 October; Thursday 1 January 2026 belongs to 29 December–4 January. Local noon and 17:00 are the period boundaries. A currently running commitment stays Planned; ended entries become Earlier only on today. `/shared-with-me` and `/share/id` select Sharing.
- [x] Run `node --experimental-strip-types --test src/lib/day-presentation.test.ts src/lib/personal-nav.test.ts` and record the initial missing-feature failure.
- [x] Implement the date derivations without changing storage or agenda construction:

```ts
const weekday = new Date(date + "T12:00:00Z").getUTCDay();
const monday = shiftDay(date, -((weekday + 6) % 7));
return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
```

- [x] Use `Intl.DateTimeFormat` with the calendar time zone for period grouping; retain explicit unavailable/completed/routine statuses.
- [x] Re-run the focused tests and existing day-plan tests.

## Task 2: Shared shell and reachable Tools

**Files:** Modify `src/components/Navbar.tsx`, `src/components/trackers/TrackerNavDock.tsx`, `src/components/trackers/PersonalBackLink.tsx`, `src/components/trackers/ChapterHeader.tsx`, create `src/app/nova-workspace.css` and import it in `src/app/layout.tsx`.

**Interfaces:** Existing Navbar capture/search/shortcut state remains the authoritative owner; move capture to a Tools menu item. The rail consumes the shared primary/tool navigation arrays. Dock consumes only `PERSONAL_PRIMARY_NAV`. Shared CSS is scoped to tracker surfaces; the portfolio retains its current structure.

- [x] Observe the existing browser: horizontal primary links, top Add and sixth dock item do not match the approved reference.
- [x] Render primary links with existing `TrackerIcon` and `aria-current`; render secondary Library/Sharing/Settings under Tools.
- [x] Move Add record, search, theme, Study Bible and keyboard help into Tools, preserving the selected date and return path when opening capture:

```ts
setCaptureContext({
  returnTo: window.location.pathname + window.location.search,
  date: new URLSearchParams(window.location.search).get("date") ?? undefined,
});
setCaptureOpen(true);
```

- [x] Remove dock capture and route the primary content beside the rail at desktop sizes. Keep navigation compact on phones, hiding the rail links there. Login has compact brand presentation without the normal dock/rail.
- [x] Avoid self-links in `PersonalBackLink`; keep meaningful parent paths for detail workflows. Shared compact titles display their description plainly.
- [x] Verify Tools capture opens, Escape restores focus, and primary/secondary links retain correct selected states.

## Task 3: Today calendar and inline agenda

**Files:** Create `src/components/daily/WeekDateStrip.tsx`, `src/components/daily/TodayAgendaRow.tsx`; modify `src/components/daily/DailyWorkspace.tsx`, `src/components/daily/DaySelector.tsx`, `src/app/trackers/page.tsx`, `src/app/nova-workspace.css`.

**Interfaces:** `WeekDateStrip({ date, today, onChange })` uses `containingWeek` and the existing DaySelector. `TodayAgendaRow({ row, timeZone, status, children })` renders time/title/status and a native inline disclosure; `children` contains the existing description/actions, preserving current save/routine handlers. DailyWorkspace keeps Plan's existing row renderer.

- [x] Hide the shell's duplicate Today header by passing `title={null}`; DailyWorkspace renders the single Today header, selected date/time zone and contextual primary link.
- [x] If an eligible next commitment exists, link to its existing workflow; otherwise offer a pending task, Plan today for a future Today activity, or Plan tomorrow when the day has no remaining work. During an active session show its existing return action rather than creating another controller.
- [x] Add the containing Monday–Sunday week strip, exact weekday/date pairs and accessible selected date. Date changes retain query context via the existing `setDate` function.
- [x] Group incomplete Today rows by `agendaPeriod`; expand notes and the existing actions inline. Duration appears once in the gutter; details show the range. Completed/skipped rows remain reachable in their existing disclosure.
- [x] Remove the large Now/Next card and move quick recording into a small on-demand disclosure below the agenda. Preserve Water +1/Undo and all contextual log URLs. Pending tasks sit below, not in a permanent desktop side rail.
- [x] Retain planning, reminders, errors, undo, habits and active-session behavior. No timetable or task data changes.

## Task 4: Verification and checkpoint handoff

**Files:** Create/update `design-qa.md`; update this plan's checkboxes with actual results.

- [x] Run focused unit tests, personal-access tests, TypeScript and lint. Run a production build once the source is stable.
- [x] In the in-app browser create illustrative time blocks through Plan and inspect populated, expanded, empty and historical states. Verify week/day controls, existing commitment and focus-session routes, capture return paths and Tools keyboard behavior. Routine derivation is covered by the existing unit tests; live owner routine actions remain a later signed-in check.
- [x] Compare the selected reference and captured Today at 1440×1024 and 390×844; inspect 320px and 768px for overflow and dock clearance. Inspect dark appearance and record limitations truthfully.
- [x] Fix material composition, clipping, spacing and interaction failures, then record the final visual QA result. Keep the local browser preview open for the user.
- [x] Report this checkpoint's scope, verification evidence and the next full-site workflow checkpoint. Preserve unrelated uncommitted changes and do not publish.


## Checkpoint results — 11 October 2026

- Initial date/presentation tests failed on the missing module/export, then passed after implementation. Final focused suite: 20 tests passed. Access policy/service worker suite: 24 tests passed.
- TypeScript, lint, whitespace check and final local-mode production build passed. Existing baseline-browser-mapping/pnpm warnings remain tooling notices.
- Browser checks: four event commitments created through Plan; inline expansion; exact containing-week dates; historical/future day navigation; native picker; water add/undo feedback; capture date/return context; capture/search/help initial focus and Escape restoration; Sharing active rail state; focus start → Today resume action → cancel without completion credit.
- Visual comparison used combined normalized reference/rendered images at 1440×1024 and 390×844, plus focused typography/row regions. Phone 320px, tablet 768px and dark appearance checked. Font alias, agenda surface, title hierarchy, narrow-grid clipping, dock clearance and menu/modal isolation issues fixed and recaptured.
- `design-qa.md` contains all iterations, final evidence and remaining verification limits. No new browser console errors/warnings during the final production interaction run.
- Existing E2E menu/dock/capture, onboarding, date and agenda expectations updated for the new UI contract; a dialog regression scenario added. The standalone Playwright CLI suite was not executed; browser verification used the Product Design in-app-browser workflow.
- Uncommitted Sharing files were preserved. Pilot CSS is isolated in nova-workspace.css. No deployment or cloud-data mutation was performed. Next checkpoint: Sharing, against its approved reference and actual workflow states.

## Final refinement and source publication

- [x] Reproduce narrow-calendar initial selection visibility: Sunday 304–348px outside the 16–304px strip.
- [x] Reveal the selected date horizontally on mount/date change/container resize. Confirm Sunday 260–304px at 320px, including a 390→320 resize, without scrolling the page.
- [x] Add a regression scenario for initial selected-date visibility and resizing. Standalone E2E execution remains outside this browser verification pass.
- [x] Repeat focused tests (20), access/service-worker tests (24), TypeScript, lint and production build after the final code change.
- [x] Recapture desktop, phone, narrow phone and dark appearance; inspect combined source/rendered comparisons; save final evidence in the versioned reference asset directory and update design-qa.md.
- Commit and push this shell/Today checkpoint on the current feature branch, as requested. Preserve the four earlier Sharing experiment files outside the commit. No deployment is included.
