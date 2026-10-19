# Unified redesign — design contract

**Status:** direction approved by the user on 17 October 2026 (both surfaces; refine the existing system; all listed fixes/removals and additions accepted; free rein granted outside UI, exercised only within the boundaries below).

**Scope:** the public portfolio (`buildora.work` / `/`) and the NOVA workspace (`personal.buildora.work` + tracker paths), delivered as one coherent design language through small reviewable phases.

**Supersedes:** nothing. This contract extends the approved [NOVA change sheet](../NOVA_CHANGE_SHEET.md) and the [clean-app C01–C16](2026-10-14-nova-clean-app-design.md) decisions. Those page contracts remain binding; this pass fixes the systemic issues those passes left standing.

## 1. Evidence base

Fresh captures of every route were taken on 17 October 2026 against the current production build in local mode, light and dark, at 1440 and 390, plus sectional captures of the portfolio: `artifacts/ui-ux/redesign-review-2026-10-17/` (54 images, gitignored). Route inventory, storage map and redundancy audit: exploration of `src/` on the same date (61,583 lines; 149 components).

Observed drivers:

1. **Repeated progress-lead strip.** `WorkspaceProgressLead` renders on every NOVA page via `PersonalShell` (plus `HealthWorkspace`, `FoodTracker`, `DailyWorkspace`, `ProgressDashboard`, `GermanyExams`). Empty state is negative boilerplate — “No completed focus”, “No weight”, “No recorded energy” — with a repeated 30-day range select consuming the prime viewport on ten routes.
2. **Chrome and IA drift.** `/log` renders without the sidebar rail (`nova-login-nav`); `/more` duplicates the sidebar Tools group; nav label “Plan” leads to pages titled “Tasks”/“Goals”; nav label “Health” leads to “Food”, “Body and weight”, “Water & eating window” and “Routine reminders”.
3. **Duplicated systems.** Two command palettes (`PortfolioCommandPalette` 733 lines, `trackers/CommandPalette` 572) with identical semantics; four tracker canvas/palette definitions across `globals.css`, `ui-system.css`, `nova-workspace.css`; dead components with zero consumers (`DomainProgressOverview`, `ProgressRail`, `DailyCockpit`, `ConsistencyGrid`, `TodayDetails`, `TodayHeader`, `InstallPrompt`, `PersonalSectionNavigation`; `WeekPulse`/`ActionQueue` only consumed by `DailyCockpit`).
4. **Portfolio length.** 14,046px at 1440px with repeated tech/claim copy across Work, Architecture, Capabilities, Open Source and Impact; no per-project depth; ⌘K/`~`/`?` affordances are icon-only.
5. **Missing flows.** No phone quick-add; no guided weekly review; empty states are placeholders rather than next actions; no first-run setup path beyond the questionnaire.

## 2. Principles

1. **One system, two skins.** Identical tokens, primitives and interaction rules; the portfolio speaks blue/ink/paper, NOVA speaks teal/canvas. Nothing else differs.
2. **One owner per concern.** One palette component, one navigation data source, one palette token file, one empty-state primitive, one page-header component.
3. **Honest silence.** Never render an empty scaffold. If there is no data, render the page’s own actionable empty state — never a zeroed statistic, never negative boilerplate.
4. **Existing invariants stand.** 44px touch targets, keyboard access and focus return, dark/light fidelity, reduced-motion behaviour, dock clearance, English pinned dates.

## 3. Contracts

### T1 — Token consolidation

- Canonical token set (single names, both surfaces, light/dark): `canvas`, `surface`, `surface-2`, `border`, `rule`, `ink`, `ink-muted`, `accent`, `accent-soft`, `accent-ink`, `focus`, `success`, `warning`, `danger`; radii 8/12/16; control heights 36/44; type scale page title 36 desktop / 28 phone, section 20, body 15/14, caption 12.5, mono utility small-caps.
- `globals.css` keeps the Tailwind `@theme` layer and base styles only; the tracker palette overrides at lines 82–127 and duplicate canvas declarations are removed.
- `ui-system.css` becomes the single owner of every palette value for both surfaces.
- `nova-workspace.css` keeps layout rules only; every colour reference becomes a token.
- Migration is mechanical and verified by screenshot comparison before/after (no intended visual change in this step).

### T2 — Navigation, naming and chrome

- Primary NOVA destinations unchanged: Today `/hub`, Plan `/plan`, Roadmap `/roadmap`, Health `/health`, Progress `/dashboard`. Tools: Motivation, Library, Sharing, Settings.
- Chapter identity: pages that are not a chapter root render a compact breadcrumb (`Plan / Tasks`) inside the shared header. Chapter roots render the title only.
- Titles align with labels: `/intermittent-fasting` → “Fasting & eating window”; `/weight-loss` → “Body & weight”; `/workout-tracking` → “Workouts”; `/routine` → “Routine reminders”; `/archive` → “Library”; `/log` → “Add a record”; `/todo` → “Tasks”; `/goal` → “Goals”; `/food` → “Food”; `/dashboard` → “Progress”; `/more` → “Tools”.
- `/log` and `/more` render inside `PersonalShell` (rail, dock, reminders). `/log` keeps `?type=` deep links and its standalone return behaviour; `/more` becomes the Tools directory (single source with the sidebar entries).
- Desktop rail, mobile dock and `/more` read from `PERSONAL_PRIMARY_NAV` + `PERSONAL_TOOLS_NAV` only; `PERSONAL_MORE_NAV` is deleted after test repointing. `TrackerShell` alias is deleted (11 import sites updated).
- Mobile dock keeps its five destinations; a floating **“+”** above the dock (right edge) and a header search affordance open one **QuickSheet** with `Add` and `Search` tabs. Seven dock items would break the 44px contract, so the add/search actions live in the sheet.

### T3 — One command palette

- One `CommandPalette` component with a registry: navigation entries (surface-aware), record search (tasks, goals, milestones, roadmap days, library items), and actions (capture water/food/weight/note, add task, start/stop focus session, open resume, copy email, toggle theme, open shortcuts).
- Preserved behaviour: combobox semantics, arrow navigation, active-result visibility, focus trap with negative-tabindex exclusion, Escape ownership, mobile touch entry, bounded scrolling.
- `PortfolioCommandPalette` and `trackers/CommandPalette` are deleted after migration; both surfaces mount the same component with different registries.

### T4 — Page summary, empty states, onboarding

- `WorkspaceProgressLead` is deleted. Pages that own a chart keep that chart; the range control lives **inside** the chart/table it controls.
- New `PageSummary`: renders only when data exists, in the form `value · unit · context` (“3 sessions · 2h 30m · this week”). No data → renders nothing.
- New `EmptyState` primitive: positive title, one-line hint, one primary action, optional secondary link. Copy rules: no “No completed X”, no zero-value grids, no implementation vocabulary.
- First-run setup card on Today (3 steps: goal, modules, notifications) backed by existing prefs keys, self-dismissing when complete; replaces the questionnaire-first experience for returning users.

### T5 — Today timeline

- Order: header (date + single primary action) → **Now/Next** card (the one next action with CTA) → **timeline** (time gutter; blocks from the day plan, routine occurrences, active session, meals) → **unscheduled tasks** (top three + count) → **quick capture row** (Water +1, Food, Weight, Note) → collapsed study/career context.
- The week strip stays, compressed to a single 7-day row with the selected day highlighted.
- Removed: the empty “Add a record” label row and surrounding dead zones observed in the 17 October capture.
- Data reads: `day-plan-store`, `routine-store`, `work-session-store`, tracker store. No new writes or key changes.

### T6 — Weekly review

- `/review` stops redirecting and becomes the guided weekly review: (1) Week at a glance (7-day projection), (2) Wins & lessons (writes the existing journal record for the week-ending date), (3) Tasks & milestones (completed, carried, dropped), (4) Metrics (weight, energy, focus, study deltas from the Progress projections), (5) Next week (three commitments + first action, written into the goal store where a goal exists).
- Progress → Reflection keeps the daily editor and links here. `/dashboard?view=reflection` behaviour is preserved.

### T7 — Portfolio

- Same one-page narrative, tightened to ≤ ~8,000px at 1440 (from 14,046px) by: collapsing Work card bullet lists behind per-card disclosure, Architecture 8 → 6 cards with the existing “Explore all 23 patterns” link, merging Open Source + Ecosystem tracks into one section, compacting Capabilities into one grid, collapsing pre-2023 Experience rows to a single line, keeping three Impact cards.
- **Amendment 2026-10-19:** budget revised to ≤ 11,800px at 1440: measured 10,817px on macOS and 11,152px on the ubuntu-latest CI runner after every content-preserving move, with the margin absorbing platform font metrics. The original target implied −6,046px, but the plan's own listed moves measure −2,771px; closing the rest would hide visible narrative (work-card descriptions, the Impact practice panel, current-role detail). Owner direction on 19 October: keep the achieved height, record the deviation rather than cut content. The e2e pin now enforces 11,800px as a regression guard.
- Case-study routes `/work/[slug]` for the seven projects (docita, senior-full-stack-bible, teamops, super-tic-tac-toe, digital-library, task-manager, portfolio): hero (role, stack, live/source links), problem, approach, architecture highlights, verification/limits note, related-patterns links, next/prev navigation. Content is assembled from existing truthful sources (`const.ts` project copy, architecture showcase, README claims); no invented metrics.
- `proxy.ts` allows `/work/*` on portfolio hosts while keeping every other non-root path redirecting to `/`.
- Palette and Work cards link to case studies; per-page metadata/OG; sitemap entries.

### T8 — Verification protocol

- Per phase: `tsc --noEmit`, ESLint, production build, focused Playwright specs, then the complete suite; screenshots at 320/390/768/1440 in both themes for affected routes.
- Test updates are allowed where UX legitimately changed (e.g. `progress-lead` assertions, `/log` chrome, palette selectors); assertions about persistence, security, evidence and access are never weakened.
- Each completed phase appends an entry to `docs/ui-ux-review.md` and the QA log gains the capture set.
- Baseline before any change: the full suite on the current build (352 cases per the 17 October record) so drift is attributable.

## 4. Boundaries

- No data migrations; storage keys (`vk:*`), record shapes, backup/restore compatibility, share access rules, evidence gating, exam criteria, owner timetable, allowlist/auth and host routing stay as-is unless a phase explicitly changes routing with redirects retained.
- No new runtime dependencies; existing fonts, icons and stores are reused.
- Public repository contains no personal content or authenticated captures; review images stay under `artifacts/ui-ux/` (gitignored) or the private workspace.
- Production deployment, cloud imports and authenticated-device verification remain separate release gates and are not claimed by local checks.

## 5. Deliverable shape

Phases in `docs/superpowers/plans/2026-10-17-unified-redesign.md`, each independently verifiable and individually revertable. Every phase ends green on the same gates and records its evidence.
