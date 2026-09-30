# Bible-Synced Career Operating System Design

**Date:** 2026-09-30 (IST)  
**Owner account:** `cvamsik99@gmail.com`  
**Delivery surfaces:** `personal.buildora.work` (private execution) and `study.buildora.work` (learning reference)

## Goal

Turn the private tracker into a truthful, dated 100-day job-search operating system from 30 September 2026 through 7 January 2027. It must assign every canonical technical chapter in the Software Developer Bible to a dated learning block, connect that study to deliberate practice and job-search work, persist the plan for the owner account, and make completion verifiable rather than performative.

The plan is intended to improve the candidate's demonstrated senior-engineering capability and hiring evidence. It must never imply that completing a timetable alone makes somebody senior, or add experience/metrics to a CV that cannot be supported by the canonical personal materials.

## Existing System and Constraints

The `portfolio` repository serves `personal.buildora.work` from the private tracker routes. It already has:

- local-first, typed tracker state synchronised to the `public.tracker_data` Supabase table;
- a `timetable_100_days` key, `career_command_center` key, synced todos, a roadmap UI, a `sync-roadmap.ts` administrator seed script, and browser-notification preferences;
- a login flow with the target account and row-level security that isolates every user's data.

The Software Developer Bible is in the sibling private repository `../software-developer-bible`. Its `80-lanes-abroad-full-stack/personal/` directory is the canonical home for CV, job-search and relocation material. `career-ops` remains a tool-only external checkout and is never changed or committed for this work.

The production site cannot depend on a sibling checkout at request time. The portfolio repository therefore checks in a generated, reviewable roadmap snapshot. The generator reads the bible only during development; deployment consumes the snapshot.

## Scope and Releases

This work is intentionally split into three independently releasable parts. Each part has its own test gate and does not require the next part to be useful.

1. **Curriculum truth and seed safety.** Generate a dated plan from the canonical bible inventory, with stable IDs, direct study links, schedule arithmetic, evidence requirements, and safe account-scoped upserts.
2. **Interactive private command center.** Add a focused daily view, checklist evidence capture, recovery behaviour, task and role state, and reliable notification UX.
3. **Career evidence and operating documentation.** Update canonical personal material with a truthful resume analysis, target-role strategy, job-search cadence, OSS contribution protocol, and source-verified relocation guidance.

No unauthorised job applications, messages, contributions, or CV claims are created by this feature. The application makes those steps concrete and trackable; the account owner still authorises each external send or submission.

## Approach Options Considered

### 1. Expand the existing hard-coded seed script

This is fast but has poor drift resistance: bible chapters can be added or renamed without the roadmap noticing, and replacing the whole JSON document risks losing completed work.

### 2. Keep an independently curated dashboard plan

This makes editing the UI easy but creates a second curriculum source of truth. It would directly violate the user's request to synchronise the timetable with the bible.

### 3. Recommended: generated curriculum snapshot plus interactive execution state

An explicit generator inventories and validates bible chapters, assigns them to a deterministic date and study slot, and writes a checked-in data module. The seed script imports it and only populates owner-scoped planner records. The UI keeps mutable completion evidence, interview notes and application status separate from the generated curriculum. This is the selected design.

## Data Model

### Generated `CareerCurriculum`

Each dated day has a stable `dayKey` (`career-2026-09-30` through `career-2027-01-07`) and contains:

- ISO date and phase;
- full daily schedule, including health, meals, family time, work, and wind-down;
- one or more canonical bible chapters, each with a repo-relative source path, title, estimated duration, and verified `study.buildora.work` URL;
- a study objective, applied-practice task, interview drill, optional OSS activity, role-search activity, and review action;
- a checklist whose items declare a required evidence type (`url`, `commit`, `recording`, `note`, `application`, `screenshot`, or `manual-confirmation`);
- notification checkpoints and the UI link they should open.

The chapter allocation is deterministic. The generator normalises the inventory, excludes private `personal/` material and non-chapter navigation files, assigns every included chapter exactly once, and fails when a chapter cannot be linked or the 100-day capacity is exceeded. A generated inventory report records the source revision, total chapter count, date range, and chapter-to-day mapping for review.

### Mutable `CareerExecutionState`

Mutable state is stored under a new planner-owned tracker key. It maps a stable checklist-item ID to:

- `completedAt` only after required evidence has been supplied;
- evidence value and optional reflection;
- an explicit `verifiedAt` timestamp for final checks;
- a `carriedForwardTo` date when an incomplete item is rescheduled.

Generated curriculum data and mutable evidence must not be stored in the same replace-on-seed document. A reseed preserves matching stable IDs and their evidence, removes only obsolete planner-generated items after recording them as archived, and leaves all user-authored todos untouched.

### Existing tracker data

The existing `todos` key receives only planner todos with a documented `career-plan:` ID prefix. A rerun merges by ID instead of deleting every matching task. `career_command_center` becomes a versioned current career snapshot and stores its `sourceCheckedAt` date for all live-market links.

The script resolves `cvamsik99@gmail.com` through the Supabase admin API, then upserts only rows with that authenticated user's ID. It never logs secret values, user credentials, or unrelated rows. It exits before modifying data if the account is absent, required environment variables are absent, or the generated plan fails validation.

## Daily Operating Model

The schedule follows the user's fixed day and totals exactly ten work hours:

| IST time | Activity | Output required |
| --- | --- | --- |
| 07:00–08:30 | Exercise and freshen up; no breakfast | Health routine confirmation |
| 08:30–10:30 | Bible study | Notes plus one retrieval-practice answer |
| 10:30–12:30 | Build, debugging, or algorithm/system-design practice | Commit, solution, diagram, or recorded explanation |
| 12:30–14:00 | Role research and tailored application preparation | Saved role scorecard or application draft |
| 14:00–14:30 | Lunch | Protected break |
| 14:30–16:30 | OSS, portfolio, or public technical proof | Issue discussion, PR, shipped feature, or draft article |
| 16:30–17:30 | Interview preparation | Answer notes and timed practice |
| 17:30–18:00 | Mock interview | Score and one improvement action |
| 18:00–20:00 | Family time | Protected offline time |
| 20:00–20:30 | Dinner | Protected break |
| 20:30–21:30 | Follow-up, outreach, applications, and next-day planning | Sent/queued follow-up or documented review |
| 21:30–22:00 | Wind-down | Device-off checklist |

30 September is an activation day. It starts from the current time without marking earlier blocks overdue. It records the baseline resume/portfolio audit, seeds the plan, enables desired reminders, selects the first source-verified roles, and completes the first assigned study and practice loop that remains feasible that day.

The normal daily pattern does not demand ten low-quality founder emails. It instead targets a small, measured weekly pipeline: tailored applications, follow-ups, warm outreach, and role research. Every outreach item must include a company-specific reason and be explicitly marked as drafted versus sent.

## Career Strategy and Resume Analysis

The primary lane is **Senior Full-Stack Engineer / Senior Backend Engineer** for TypeScript, Node/NestJS, React/Next.js, PostgreSQL, multi-tenant SaaS, regulated products, and product-minded platform work. The secondary lanes are **Platform/SaaS Engineer** and **Solutions or Forward-Deployed Engineer** where the job description genuinely values customer-facing technical depth.

Germany (Berlin and Munich) is the primary geography; English-first remote roles are a parallel, not distracting, lane. Role cards are categorised as:

- Germany relocation-capable;
- remote-compatible from India/EOR confirmed;
- remote but restricted by location or work authorisation;
- research only.

Each role card includes direct source URL, last-checked date, fit rationale grounded only in CV evidence, gaps, salary/visa information only when source-verified, next action, and outcome status. Stale roles must display as stale rather than being presented as open.

The resume analysis distinguishes evidence from gaps. It may promote the demonstrated Docita, MAQ, and Cognizant strengths already documented in the canonical CV, but it must not invent GDPR/DSGVO compliance, enterprise-scale AI work, Kubernetes experience, merged OSS PRs, or compensation claims. Gaps become dated proof-building work: an App Router deployment, a small reproducible Kubernetes/Terraform lab, a scoped OSS contribution, public technical writing, timed system-design recordings, and German practice.

For relocation, the dashboard links to official German guidance and labels legal/visa information as informational. It does not claim that an employer has no involvement: a qualifying job offer and applicable employment conditions are required before the applicant can pursue an EU Blue Card.

## OSS, Interview, and Public-Proof Rules

Langfuse is the initial OSS lane because it maps to TypeScript, Prisma/PostgreSQL, developer experience and agent observability. The system must send the candidate through issue discussion and contribution guidelines before any coding. Lightdash is a research/community lane, not an automatic coding target: its current contributor guide requires maintainers or trusted contributors to agree scope first. A card cannot claim a planned contribution is a PR or a hiring signal.

Mock practice uses free or free-tier options only when available and marks availability as source-checked. A daily mock can be a recorded self-interview when a service is unavailable. The dashboard captures the question, score, evidence link, one concrete correction, and planned retry date.

The job-search scorecard reports leading indicators (hours studied, proof artifacts, conversations, tailored applications, follow-ups, interview loops) separately from outcome metrics (responses, screens, offers). It must never reward bulk application volume over quality.

## Interaction and Notification Design

The roadmap remains a single focused mobile-friendly route. The top section answers only:

1. What should I do now?
2. What evidence will prove it is complete?
3. What is next after this block?

The full timeline is available below the daily command card, grouped into phases and searchable by date, chapter, role lane, and evidence status. A task opens its linked bible chapter, not a generic study homepage. Completion controls request the required evidence before enabling the final checkbox. Final verification is a separate deliberate action, so a completed activity is never silently treated as a verified result.

Reminder preferences gain career-specific checkpoints for morning launch, study close, application/role follow-up, mock interview, evening review, and wind-down. When the page is open, the application shows an in-app nudge and uses the browser Notification API when the user opted in. It must tolerate permission denial and duplicate prevention. Background delivery is shown as unavailable until a production push provider, VAPID keys, subscription persistence, and a scheduler are configured; the UI does not imply it can notify a closed browser today.

## Verification and Release Gates

### Generator and data tests

- inventory contains every eligible bible chapter exactly once and excludes personal/private documents;
- dates are consecutive from 2026-09-30 through 2027-01-07;
- each normal day has the exact declared ten work hours, plus protected health, meals, family and sleep blocks;
- every chapter URL is valid against the study URL mapping;
- every task has a required evidence type and final verification criterion;
- reseed merging retains completed evidence and non-planner todos;
- invalid credentials, missing owner account, invalid generated data, and failed writes make no partial update.

### UI tests

- the current day opens with the active block, direct chapter link, and exact completion requirement;
- a checklist item cannot be finally verified without required evidence;
- an evidence-backed task persists across reload and sync shape changes;
- carry-forward creates a visible next action rather than an invisible overdue item;
- reminders remain opt-in and behave safely when browser permission is denied;
- role cards display source-check date, restricted location/visa status where applicable, and do not show stale research as an open job;
- supported 320px, 390px, and 430px widths have no horizontal overflow.

### Operational checks

- run focused Playwright tests, lint, typecheck/build, and the full local-mode E2E suite in `portfolio`;
- run the bible's `bash 80-lanes-abroad-full-stack/personal/doctor.sh` and `bash scripts/verify.sh` after canonical personal documentation changes;
- run the seed in dry-run/validation mode first, then one owner-scoped Supabase upsert with service credentials supplied only through the environment;
- manually sign in as the owner, confirm cloud sync status, verify one direct bible link, one evidence capture, a reminder permission state, and data persistence after reload;
- record the exact data keys, payload version, timestamp, and test results in the release note.

## Non-Goals

- Sending applications, messages, PRs, or visa submissions without a separate explicit user action.
- Making background push notifications appear reliable without a deployed provider and secrets.
- Claiming completion of all bible study, OSS work, or interview preparation before evidence exists.
- Copying private personal data into `career-ops` or any public repository.
- Replacing professional legal or immigration advice.

## Source Basis

The implementation will use the supplied Mehul Mohan video as motivation for a focused, public-proof-oriented 100-day reset, rather than treating its content as a factual career guarantee. Current contribution rules and visa details are rechecked against their primary sources before any live link or assertion is seeded.
