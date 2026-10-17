# Unified redesign — implementation plan

> Execute against the approved [design contract](../specs/2026-10-17-unified-redesign-design.md). Six phases; each ends green on the same gates and is individually revertable. Free rein granted 17 October 2026; boundaries in the contract still apply.

**Goal:** Fix the systemic UI/UX defects, unify the design system across both surfaces, remove the dead and duplicated layers, and add the approved features (quick capture, one palette, case studies, Today timeline, weekly review, honest empty states).

**Architecture:** Keep Next.js 16 / React 19 / Tailwind v4 / Playwright. Consolidate to one token file, one palette component, one navigation source, one empty-state primitive. No new dependencies.

**Tech stack:** existing only. Verification via existing Node domain tests + Playwright suite + screenshot review.

## Constraints

- Baseline first: run the full browser suite on the current build and record the result (expected 352/352 per the 17 October record).
- Never weaken persistence, security, evidence, exam or access assertions; update only what UX legitimately changed.
- Preserve `vk:*` keys, record shapes, backup compatibility, share rules, owner timetable and routing aliases (redirects stay valid).
- Work on one branch (`redesign/unified-uiux`), phased commits, no mixing of phases.
- Captures stay under `artifacts/ui-ux/` (gitignored) or the private workspace.

## Phase 0 — Baseline and safety net

- [x] Create branch `redesign/unified-uiux` from `main`; confirm clean tree. — Branch created 17 Oct 2026; only the two new docs untracked.
- [x] Run baseline: full Playwright suite, `tsc --noEmit`, ESLint, production build. Record totals in the phase log. — **354/354 browser cases passed (4.0m)**; production build inside `pretest:e2e` succeeded. (Main carried two more cases than the 352 record: `roadmap-plan.spec.ts`.)
- [x] Capture the current state of every affected route at 390/1440 in both themes (already performed 17 October; re-capture only if `main` moved). — 54 captures in `artifacts/ui-ux/redesign-review-2026-10-17/` (gitignored) plus 8 portfolio sections.
- [x] Add `e2e/redesign-guards.spec.ts`: shell/chrome parity, page titles match labels, chapter breadcrumbs, honest empty states, dock quick-add/search sheet, Today now/next above the fold.

**Exit:** baseline recorded; guards fail for the intended reasons. — Guard baseline: **15 failed / 10 passed**; every failure maps to a phase deliverable (chrome parity, titles, breadcrumbs, empty copy, sheet, Today card). The 10 passes pin behaviour that must stay.

## Phase 1 — Foundations (no intended visual change)

- [x] Inventory every custom property in the three stylesheets with its consumers; write the mapping to canonical tokens (`canvas`, `surface`, `surface-2`, `border`, `rule`, `ink`, `ink-muted`, `accent`, `accent-soft`, `accent-ink`, `focus`, `success`, `warning`, `danger`). — Inventory performed during the 17 Oct audit. Decision recorded: the canonical set is realised as the existing `--color-*` / `--portfolio-*` / `--nova-*` namespaces with a single owner (`ui-system.css`); a rename to new vocabulary would touch every Tailwind utility with zero UX value, so it was not performed. Mapping evidence: token dump + phase entry in `docs/ui-ux-review.md`.
- [x] Remove tracker palette overrides and duplicate canvas declarations from `globals.css`; move all palette values into `ui-system.css`; convert `nova-workspace.css` colour literals to tokens. — Also removed: dead `.gradient-text` utility, dead `input[type="range"]` block (zero consumers), and the redundant second tracker palette block in `ui-system.css` whose light values (`#f6f7f5`/`#dce3df`/`#e9eeeb`) had been shadowed pre-change and would otherwise have drifted from the frozen snapshot.
- [x] Verify by screenshot diff that light/dark values are unchanged on representative routes (Today, Food, Progress, Settings, portfolio `/`). — Token dump: 0 differences across 6 cases (light+dark, both surfaces). Pixel diff: 0 differing pixels across 15 captures (see phase entry).
- [x] Build shared primitives: `PageHeader` (chapter breadcrumb + title + context slot + actions), `PageSummary` (data-only value·context line), `EmptyState`, `SectionCard`, `ActionMenu` (a11y menu reused by rows). — `ChapterHeader` renamed to `PageHeader` (5 import sites) and gained the `chapter-breadcrumb` slot; `PageSummary` and `SectionCard` added; `EmptyState` gained `secondary` + optional icon; `ActionMenu` already existed and is the canonical one.
- [x] Delete zero-consumer components: `DomainProgressOverview`, `ProgressRail`, `DailyCockpit`, `ConsistencyGrid`, `WeekPulse`, `ActionQueue`, `TodayDetails`, `TodayHeader`, `InstallPrompt`, `PersonalSectionNavigation`; delete the `TrackerShell` alias and update its 11 import sites; drop dead `SignalPanel`/`StoryPanel` imports from Settings.
- [x] Commit `refactor(ui): consolidate design tokens and shared primitives`.

**Exit:** production build + full suite green; screenshots show no unintended visual drift. — **364 passed / 15 failed** (3.8m): the 15 failures are exactly the pinned Phase 2–4 guards from Phase 0, no other regressions. tsc, ESLint, production build green; token dump and 15-capture pixel diff show zero drift.

## Phase 2 — NOVA chrome, naming and chrome unification

- [x] Add chapter breadcrumb to `PageHeader`; apply aligned titles per T2 across Tasks, Goals, Food, Body & weight, Workouts, Fasting & eating window, Routine reminders, Library, Add a record, Tools. — New `ChapterBreadcrumb` renders only on the seven guard routes (`/health` stays a clean chapter root, no crumbs on `/log`, `/more`, `/archive`). Titles now match their rail/dock labels, including the renamed “Body & weight” (was “Body and weight”) and “Fasting & eating window” (was “Intermittent fasting”).
- [x] Render `/log` and `/more` inside `PersonalShell` (rail + dock + reminders); `/more` becomes the Tools directory reading `PERSONAL_TOOLS_NAV`; keep `?type=` deep links and standalone return links working. — The standalone navbar path is now only `/login`; `/log` keeps rail + dock + reminders and `/more` renders as the Tools directory. The existing `?type=exercise` redirect and `returnTo` specs pass unchanged.
- [x] Single navigation source: rail, dock and Tools read `PERSONAL_PRIMARY_NAV`/`PERSONAL_TOOLS_NAV`; delete `PERSONAL_MORE_NAV`; repoint its tests. — `PERSONAL_MORE_NAV` deleted; `personal-nav.test.ts` repointed to the primary + tools arrays.
- [x] Replace `WorkspaceProgressLead` everywhere: delete the component and its injections in `PersonalShell`, `HealthWorkspace`, `FoodTracker`, `DailyWorkspace`, `ProgressDashboard`, `GermanyExams`; move range controls into the charts they own; convert each page’s lead content into `PageSummary` where data exists. — `WorkspaceProgressLead.tsx` deleted (and its injection removed from `PersonalShell`); the dashboard chart became `ProgressChart` (testid `progress-chart`, range/metric controls inside the panel); pages mount a one-line `MetricSummary` that renders only when the selected day has a reading (`90 min · today`, `1 task · today`, `82.4 kg · today`); dead `progressMetric()` removed.
- [x] Rewrite empty-state copy across pages with `EmptyState` (no “No completed X”, no zero grids). — Positive, action-first copy on Tasks, Goals, Workouts, Fasting, Library, hydration, nutrition insights/summary and Germany exams; actionable health-ledger rows and Today’s agenda lines deliberately left; the food diary keeps the header’s single “Add food” action (no duplicate primary).
- [x] Update affected specs (`goal`, `progress-dashboard`, `workspace-consistency`, `command-deck`, `full-tracking-completion`, `editorial-foundation`, `daily-life`, `onboarding-hub`) and extend `redesign-guards.spec.ts`. — Also updated `archive-ux`, `fasting`, `personal-roadmap`, `personal-tracking`; guard file now 38 guards including chrome parity on `/log`/`/more`, breadcrumbs, lead-strip absence on eleven routes and a daily-summary guard.
- [x] Commit `refactor(nova): unify chrome, naming and empty states`.

**Exit:** full suite green; every NOVA route renders one title, one context control, one primary action; screenshot review at 390/1440 light+dark. — **389 passed / 3 failed (4.2m)**: the three failures are exactly the Phase 3–4 guards pinned in Phase 0 (dock quick-add, header search sheet, Today now/next). 60 fresh captures in `artifacts/ui-ux/redesign-phase2-2026-10-17/` plus close reads of Today, Tasks, Goals, Add a record, Tools, Progress, Body & weight and Health at 390/1440 and both themes show one title, one context control and one primary action per route. tsc, ESLint, unit tests and production build green; whitespace check clean.

## Phase 3 — One command palette + mobile quick capture

- [ ] Extract `CommandPalette` with a registry API (`navigation`, `records`, `actions`) and mount it on both surfaces; migrate portfolio actions (sections, resume, terminal, shortcuts, copy email) and NOVA actions (navigate, capture water/food/weight/note, add task, start focus, search tasks/goals/milestones/roadmap days/library).
- [ ] Delete `PortfolioCommandPalette` and `trackers/CommandPalette` after migration; delete the duplicate shortcut modal logic (keep one shortcuts sheet).
- [ ] Add QuickSheet (tabs: Add | Search) opened by ⌘K-equivalent on mobile, the header search icon and a floating “+” above the dock; 44px targets, focus trap, dock clearance.
- [ ] Update `palette-ux`, `command-deck`, `navigation` specs; add QuickSheet regressions (open, tab switch, capture writes, focus return) — failing first, then passing.
- [ ] Commit `feat(ui): unify command palette and add mobile quick capture`.

**Exit:** one palette implementation in the tree; full suite green; phone captures reviewed at 320/390.

## Phase 4 — Today timeline + weekly review + onboarding

- [ ] Rebuild Today per T5 (Now/Next → timeline → unscheduled tasks → quick capture row → collapsed study/career context); keep the compressed week strip.
- [ ] Build `/review` as the guided weekly review (five steps per T6) writing only existing record shapes; keep `/dashboard?view=reflection` intact; link from Progress and Today.
- [ ] Add the first-run setup card on Today (goal, modules, notifications) backed by existing prefs keys; self-dismisses when complete.
- [ ] Add regressions: timeline renders plan/routine/session blocks for a seeded day; weekly review saves one journal entry and optional commitments; setup card disappears after completion and never reappears for returning users.
- [ ] Commit `feat(nova): today timeline, weekly review and setup card`.

**Exit:** full suite green; Today’s first actionable row sits above the fold at 390×844; captures recorded.

## Phase 5 — Portfolio tightening + case studies

- [ ] Tighten the single page per T7: Work card details behind disclosure, Architecture 8 → 6 cards, Open Source + Ecosystem merged, Capabilities compacted, older Experience rows collapsed; target ≤ ~8,000px at 1440.
- [ ] Add `/work/[slug]` case studies for the seven projects with truthful copy assembled from `const.ts` and existing docs; per-page metadata/OG; next/prev; links from Work cards and the palette.
- [ ] Allow `/work/*` in `proxy.ts` for portfolio hosts; keep every other non-root path redirecting to `/`; add sitemap entries.
- [ ] Update `public-portfolio.spec.ts` (length/section assertions), add case-study specs (route renders, anchors resolve, metadata present, unknown slug 404s).
- [ ] Commit `feat(portfolio): tighten overview and add project case studies`.

**Exit:** portfolio height budget met; full suite green; case studies reviewed in both themes at 390/1440.

## Phase 6 — Final QA, docs and release evidence

- [ ] Full gates: complete Playwright suite, Node domain/curriculum/Germany/access suites, `tsc --noEmit`, ESLint, production build, whitespace check.
- [ ] Screenshot matrix for every route (320/390/768/1440, light/dark) with populated seeds where available; store under `artifacts/ui-ux/redesign-final-2026-10-17/`.
- [ ] Append phase entries to `docs/ui-ux-review.md` (implemented improvements, follow-ups, boundaries) mirroring the existing format; update `design-qa.md`; update `docs/NOVA_CHANGE_SHEET.md` status rows touched by this pass.
- [ ] Record limits explicitly (local mode, no authenticated cloud verification, no deployment).
- [ ] Commit `docs(qa): record unified redesign verification`.

**Exit:** all gates green; docs updated; user decides on merge/deploy.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Palette/token migration shifts colours subtly | Screenshot diff in Phase 1 before any layout change; revert if drift is visible |
| Removing `progress-lead` breaks many specs | Land the guard spec first; update specs within the same phase; never delete assertions silently |
| Today rebuild touches dense state (day plan, routine, sessions) | Read-only integration first; no new writes; seeded-day regressions before wiring |
| Proxy change opens the portfolio host accidentally | Allow-list exactly `/work/*`; explicit regression that other paths still redirect to `/` |
| Phase size | Each phase ends green with its own commit; stop and report between phases |
