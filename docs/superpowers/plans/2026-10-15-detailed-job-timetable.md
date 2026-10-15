# Detailed Job Timetable Implementation Plan

> Execute inline using executing-plans. The user approved the linked full-stack / 60-hour design with “continue” on 15 October 2026. Continue in the existing fix/nova-clean-app checkout; preserve its completed cleanup work.

**Goal:** Render linked, actionable career assignments and generate a private 60-hour import payload without changing account records.

**Architecture:** Add an optional validated jobPlan extension to the existing Germany execution payload. Both Today and Roadmap consume the same assignments. Existing 50-hour payloads and all assessment/evidence IDs remain compatible. Authoring sources and generated personal output stay in the private Bible repository.

**Tech Stack:** Existing Next/React/TypeScript, native details, RoadmapGuide and evidence controls; Node authoring CLI; no dependencies.

## Constraints

Effective date 2026-10-15; earlier schedules remain historical. Weekdays total 660 minutes, Saturday 300, Sunday zero. Wednesday has one 120-minute assessment/repair block instead of coding plus speaking. Data and account isolation remain intact. No cloud import, messages, application submissions, commit, push or deployment in this request.

## Tasks

- [x] 1. Validated assignments and compatibility. Create src/lib/job-plan.ts and test. Interface: JobAssignment {id,date,range,minutes,kind,title,outcome,brief,steps,deliverable,doneCheck,dependency,blocked}; JobPlan {version,effectiveOn,timezone,weeklyMinutes,sourceDigest,days}. Validate all 72 ordered workdays, IDs, range durations, nonoverlap, safe links, daily budgets and required instructions. Add optional GermanyExecution.jobPlan, route datedAssignments/annotateGermanySchedule through it only on/after effectiveOn, accept matching 60-hour roadmap allocations. Test malformed data rejection, historical fallback, Wednesday and Saturday budgets, Sunday recovery and nonmutation.
- [x] 2. Private authoring pipeline. Create scripts/generate-job-plan.mjs and test. Consume explicit private baseline/calendar/design paths; parse dated rows and checked workstream instructions; emit private output only. Keep exam definitions, previous guide content and source IDs intact. Test incomplete dates, overlapping/mismatched time ranges, injected links and input nonmutation. Generate germany-job-roadmap-60h.json under Bible personal/reports; verify runtime validators against the real output. Repair accidental next-week heading leakage in the new calendar only.
- [x] 3. Reusable assignment presentation. Create components/career/JobAssignmentDetail.tsx. Roadmap rows show time, title and one outcome, expanding to linked brief, ordered steps, deliverable, done check, prerequisite and blocked next action. Use existing EvidenceItem for each assignment, with unchanged daily/weekly evidence retained. Today rows use same detail and link to the dated evidence form. Add safe guide navigation fallback and query restoration. Add browser regression for expansion, study return URL, evidence save/reload, narrow screen and old-payload fallback.
- [x] 4. Import compatibility and handoff. Extend alignCampaignTimetable with optional plan; preserve dates before effectiveOn and unrelated rows. Owner-only sync uses this explicit plan. Verify no production call is made. Run focused Node tests, affected browser suites, typecheck, lint, build and whitespace check; capture populated phone/desktop preview. Update design-qa and approved plan status with exact checks and unverified cloud limitations.

Representative domain test: an imported Thursday jobPlan produces ranges 08:00-09:30 through 21:00-21:30 totaling 660 minutes, while 14 October keeps 08:30-10:00. Removing the extension must restore the legacy schedule. Changing a Wednesday assessment to 90 minutes must invalidate the payload rather than silently adding a speaking block. An unsafe link or missing date must reject generation before writing output.

## Verification — 15 October 2026

Completed locally. The optional extension remains backward compatible with existing 50-hour plans. The generated private plan has 72 workdays and 526 assignments, with 660-minute weekdays, 300-minute Saturdays and recovery Sundays. The two full-loop Fridays share the 120-minute assessment/repair format. All 86 distinct study URLs in the extension resolve to canonical repository files. Before 15 October, the original timetable is retained.

Red/green evidence: future slots initially remained at 50 hours; expanded validation and historical import alignment initially failed; a Sunday test exposed a legacy block leaking into recovery; the Week test initially lacked daily groups. These pass after the corrections. New browser cases verify source context, evidence persistence without auto-verification, Today/Plan agreement, guide URL restoration, rejection of unsafe payloads and weekly assignment groups.

Final checks: production build, TypeScript, ESLint and whitespace check passed. `pnpm test:germany-roadmap`: 9 authoring +30 domain cases passed. Full Playwright suite: **334/334 passed in 2.0 minutes**. The earlier 332/333 run exposed a legacy label selector after adding time context; restoring the label as a separate span preserved both readable time and the existing scored-attempt workflow.

Manual review uses the actual generated plan in disposable local browser storage, with desktop/390px/320px screenshots saved under the private Bible reports directory. Opened the desktop and expanded phone captures; checked weekly groups, study URLs and console. Viewport reset on completion. No horizontal overflow at 320/390px and no browser warnings/errors in the healthy preview.

The private baseline JSON and original source guides remain unchanged. The new payload is `germany-job-roadmap-60h.json` in the canonical personal reports directory. Owner-only import now accepts the plan explicitly and retains the existing backup, concurrency and exact-readback protections, but no cloud read/import, outbound communication, commit, push, merge or deployment was performed. Those account-specific operations remain unverified.

## Refinement follow-up — 15 October 2026

User request: continue UI/timetable refinements and check repos/resume-generator. This completes the approved compact-row, actual-status and claim-preparation design. Keep the existing visual system and 60-hour budget.

- [x] Generate complete action sentences for collapsed outcomes, removing arbitrary mid-word truncation. Keep all full instructions and stable IDs. Add the canonical public claim-preparation chapter to application instructions; name the private EU CV without publishing it.
- [x] Show saved versus verified assignment evidence consistently in Today, Plan and Roadmap. Derive status only from a valid note and stored timestamps. An old daily-result record cannot verify a different assignment. Editing evidence must return its status to saved. Add dated week range and small per-day verification counts where real evidence exists; hide repeated outcome text after expanding a row.
- [x] Review all three canonical resume PDFs, layout and current generator/claim tests. Preserve current content and PDFs unless a factual or rendering defect is established. Record claim limits, the grouped MAQ promotion-date question and practical rehearsal actions in a private review. Keep public/private exports separate.
- [x] Verify meaningful domain/authoring/browser regressions, build, lint, typecheck and responsive rendered output. Update QA evidence and private generated plan. No cloud import, external application/message/post, commit or deployment.

### Refinement verification

Complete on 15 October. Collapsed outcomes use complete action sentences and do not cut words. Expanded rows show the full brief once. Real saved/verified evidence appears consistently in Today, Plan, Roadmap and per-day week summaries; invalid or legacy daily-result evidence cannot verify an unrelated assignment. Editing evidence returns it to saved. The week shows its explicit date range.

A further browser regression demonstrated that a link from the Roadmap week view did not switch to its assignment evidence form. The URL observers now follow client navigation as well as popstate, and focus/scroll targets the valid selected assignment with space for the phone header. That regression passed after the correction and preserves focus after reload.

Final production build, lint, TypeScript and whitespace checks passed. Full final browser suite: **336/336 passed in 1.7 minutes**. Career/authoring checks: **41 passed**. Resume generator/cover-letter checks: **8 passed**; separate claim/synchronization checks: **4 passed**. All three current PDFs pass the one-page/searchable A4 verifier and rendered inspection. The candidate-confirmed March 2025 promotion is shown as two MAQ role tenures. The phone-free public PDF matches the local portfolio download; private application aliases resolve to canonical files.

Private personal-data doctor passed. The updated 72-day/526-assignment payload has 87 distinct study targets, all resolved to local canonical chapters. Manual captures cover the actual private plan in disposable local storage at desktop, 390px and 320px, with a clearly labeled QA-only saved note. No horizontal overflow or healthy-preview console warnings/errors. Viewport reset; preview left available. No production import/deployment, external communication, commit, push or merge.

## Final audit follow-up — 15 October 2026

Opened the remaining desktop and 320px week captures. Checked Sunday recovery and the post-campaign handoff in the local preview; confirmed the public resume still matches its canonical phone-free export by SHA-256.

Found and corrected a content conflict in the authoring generator: generic Saturday steps asked for scoring inside the full 90-minute R3/R5 interview block on 19 December and 2 January. Those two days now explicitly reserve 60 minutes for R3, 30 for R5, 45 for R6 plus 15 for R6 scoring, then ten minutes each for R3 scoring, R5 scoring and planning. The six affected assignments have matching titles, briefs, steps and deliverables, with one exam-guide link each. All existing IDs, ranges, durations, assessment definitions and rubrics remain unchanged; Saturday remains 300 minutes.

The new generator regression failed before the correction and passed afterward. Career/authoring suite: **42/42 passed** (11 authoring, 31 domain); syntax and diff whitespace checks passed. Regenerated private output: 72 workdays, 526 assignments, 87 resolving local study targets. The application source and resume PDFs did not change in this audit, so the prior 336/336 browser suite and build/type/lint results still describe that application revision; those gates were not rerun. Manually reviewed the corrected expanded assignment at 390px. Disposable QA storage was reset to the updated payload; the earlier example evidence note is no longer present. No account import, commit, push, merge or deployment.

## Hiring and resume strengthening — 15 October 2026

User requested the strongest Germany timetable and resume based on Bible, resume-generator and Docita. Retained the approved full-stack React/TypeScript + backend target and 60-hour schedule. Candidate directly confirmed full Docita application ownership as an independent SaaS venture, attempted sales and the return to employment applications. The CV and linked portfolio now identify the independent venture explicitly, without claiming commercial traction. MAQ promotion remains March 2025.

- [x] Audit current Docita source and bounded tests; update two stale Bible queue/outbox explanations and record reproducible hiring evidence. Docita source itself remains unchanged.
- [x] Replace the 57 future fixed-employer application briefs with actual-stage/live-eligible-requisition priority, keeping named leads as optional research. Package first proof versions in the remaining first-week blocks and prepare an early independent-review request. Keep every assignment ID, slot, duration and original assessment definition intact.
- [x] Give all workstreams concrete prerequisites and blocked actions. Add a current-capacity preface to the generated campaign guide while preserving its historical body. Regenerate the private 72-day/526-assignment payload; validate all 87 local study targets.
- [x] Tighten the shared CV summary and dense bullets, label Docita's independent venture, regenerate all three PDFs, inspect rendered pages, and synchronize the phone-free public export. Align active Markdown/YAML/mode profiles and current targeting links; canonicalize the ignored career-ops mode input into the private Bible with its original preserved as history.
- [x] Verify the final revision and record local handoff. Full browser suite **336/336 passed in 2.4 minutes**; **43 career/authoring**, **13 resume/cover-letter/claim**, **104 targeted Docita tests** passed. Production build, TypeScript, lint, PDF structure/render review, private data doctor, YAML parsing and whitespace checks passed. Bible link checker passed with external probes skipped. No production account import, outbound communication, commit, push, merge or deployment.

Private reports hold the hiring playbook, current role calibration, Docita source/test evidence and updated resume review. These are preparation artifacts, not employer decisions. Local phone preview uses disposable storage with no completion evidence seeded. The normal viewport is restored. The actual saved account timetable remains unchanged until a separate import.
