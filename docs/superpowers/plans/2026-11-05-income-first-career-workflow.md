# NOVA career workflow implementation

Approved by the user on 5 November 2026. Implement inline with executing-plans and behavior-led tests. Branch: `fix/nova-career-workflow`.

Goal: a usable, local-first income pipeline across Today, Plan, Career and Progress, independent of a saved study plan. Preserve NOVA's teal design, account boundaries, historical plans and evidence. No submissions, outgoing messages, deployments or live owner imports.

- [x] Data/import: validated research snapshots, user-owned opportunity records, activity history, follow-up logic, review totals, backup/restore, additive database migration and private exporter.
- [x] Opportunity workflow: responsive role queue, reviewed imports, editable drafts, explicit actual-action logging, contract/payment details, practice and weekly review. Old resource URLs remain accessible.
- [x] Schedule/integration: v4 income-first plan from 2026-11-05, 32h full weeks, Today next actions, Plan and Progress integration, private generated payload and companion documentation.
- [x] Verification: domain and compatibility tests, invalid/duplicate imports, data preservation, browser flows, responsive/theme/accessibility checks, TypeScript, lint and production build. Cloud checks remain explicitly unverified until run against a migrated test project.

## Shared implementation boundary

`src/lib/career-workflow.ts` owns serializable types and pure behavior. `src/lib/career-workflow-store.ts` owns hooks and write gating. UI lives under `src/components/career/workflow/`. Career routing is the existing `/roadmap` route; new default views are opportunities, practice and weekly-review; existing explicit views remain resources.

Research collections: `career:research`, `career:opportunities`, `career:activities`. All use existing account-scoped per-record timestamp merging. Imported facts never overwrite user-owned records. Snapshots use `schemaVersion: 1`, `exportedAt`, and `roles`. Public fixtures are synthetic; personal exports remain under the canonical private personal repository.

New schedule: weekdays 09:00–11:00 applications, 11:15–12:45 contracts/referrals, 13:00–14:00 proof or paid delivery, 15:00–16:00 practice, 16:00–16:30 follow-up. Saturday 09:00–11:00 review/mock, Sunday off. Interviews/delivery replace time. Earlier schedules retain their original revision and evidence IDs.

## Release boundary

Local mode is available immediately. Configured signed-in writes require `NEXT_PUBLIC_CAREER_WORKFLOW_ENABLED=true` after the additive migration and cloud verification. Existing collection behavior must remain intact. No cloud migration, deployment or account import is part of this implementation run.

## Approved-scope refinement

- [x] Counted queue views with URL-persisted search/context, clear stage labels and narrow-screen controls.
- [x] Explicit employer research checks that preserve drafts, actual stages and follow-up choices, reject future dates and retain previously derived stages safely during sync.
- [x] Separate readiness action after clarification, without recording an application.
- [x] Final refinement verification and visual preview evidence: 199 unit/compatibility checks, 5 isolated PostgreSQL checks and 471 full-suite browser cases passed; build, TypeScript, lint and whitespace checks passed. Manual 320px/desktop preview saved as `artifacts/ui-ux/career-workflow-2026-11-05/career-queue-refined.jpg`. Signed-in writes remain gated.

## Verified local result

Production build, TypeScript, ESLint and whitespace checks pass. Unit/compatibility scripts pass 192 checks, the isolated PostgreSQL suite passes 5 checks, and the full Playwright suite passes 466 cases. The final mobile CSS refinements additionally pass all 23 focused career/import/schedule/resource cases. Local preview contains the reviewed seven-role private snapshot with no application or payment events created. Screenshots are retained in ignored `artifacts/ui-ux/career-workflow-2026-11-05/`. Cloud migration, test-project sync verification, live owner import and deployment were not performed; configured career writes remain gated.

## Visual correction after owner feedback

The owner found the completed UI generic. Refine the existing approved career workflow inline; preserve all storage, URL and actual-action semantics. The direction is a practical work desk: compact role list with a joined control bar; restrained teal selection and status text; one prominent Today action with two compact subsequent actions; outcome figures in a shared ledger rather than separate cards. Keep Space Grotesk/Inter and existing NOVA light/dark colors. Avoid new decorative assets, gradients, invented metrics or a new design system.

The alternatives considered were a denser work list, a Kanban board and a decorative dashboard. Use the work list because role comparison and first-action clarity serve the income goal; a board would add horizontal navigation, while a dashboard would retain the repeated-card problem.

- [x] Queue: merge the title/count/action area and filters; expose roles within the first screen at desktop and 320px. Keep search/filter labels, keyboard focus and deep links.
- [x] Today: make the highest-priority company/action prominent and subsequent actions compact. Retain all three links, effort and reasons in original order; show the exact researched role below each company.
- [x] Detail and review: reduce boxed metadata and full-width buttons; group related figures without changing the logged-out or configured-account write gates.
- [x] Verify: the new first-screen scan regression failed at both widths before the visual changes and now passes. Full browser suite: 473 passed; final role-caption/mobile-alignment refinement: 24 focused cases passed. Domain: 40 passed. TypeScript, lint, production build and whitespace checks passed. Before/after screenshots and 320px light/dark captures reviewed; original light theme and viewport restored. Local preview remains available without changing real activity or configured-account write gating.
