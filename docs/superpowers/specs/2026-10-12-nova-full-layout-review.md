# NOVA — full layout review v2

Status: approved design; no implementation authorization. Date: 12 October 2026, Asia/Kolkata. The user approved all revised decisions D01–D13, rejected none and requested no further changes. The user explicitly requested that this remain in the design stage.

Direction: retain the selected Open agenda visual system. Make the default page smaller and clearer; keep real work, records, history and occasional tools reachable. The interactive review contains 23 page/view layouts and 13 independent decisions. Its charts and records are illustrative layout content, not saved personal data.

Accepted feedback: Today is the only timetable surface. Remove the Unscheduled tasks section completely, including from Plan; remove Plan's Learning shortcut. Roadmap owns learning. Highlight charts at the top of every page that tracks progress, as explicitly clarified by the user; do not add charts to purely administrative or content pages. Enhance Exams with a dedicated workflow within Career.

## Review decisions

All decisions below are approved. There are no rejected or pending decisions. This approval covers the design proposal only; application implementation, deployment and Git operations require a subsequent instruction.

| ID | Approved decision |
| --- | --- |
| D01 | Five primary destinations; Motivation is the first visible Tools destination on desktop and phone. |
| D02 | Today contains the agenda and one next action; optional habits, daily records and reminders open on demand. |
| D03 | Revised: Plan edits user-created activities; Today alone displays the timetable. No Unscheduled tasks section or Learning shortcut. Tasks and Goals retain their dedicated views. |
| D04 | Revised: Roadmap uses Today, Curriculum and Career; no duplicate timetable, including in disclosures. Relevant agenda links open Today. |
| D05 | Motivation owns purpose, encouragement and the next step; Goals owns milestones and metrics. Remove duplicate goal links; retain the attributed image as optional content. |
| D06 | Health shows dated records and direct actions; detailed logging, history and setup belong in the relevant domain. |
| D07 | Revised: One relevant progress chart leads every page that tracks progress, below its title/context and before lists or forms. Metric/range controls belong with the chart. |
| D08 | Sharing opens on saved drops and Inbox; New drop opens an editor. Sharing access remains a separate deliberate action. |
| D09 | Library opens on saved items; empty libraries hide useless search/filter controls. Creation opens an editor. |
| D10 | Settings groups Account, Appearance, Notifications, Focus and Data; occasional and destructive tools stay within their named sections. |
| D11 | Contextual creation uses a dialog/sheet with only the selected record's fields, date and units. |
| D12 | Shared pages have one title and one primary action; remove generic instruction paragraphs and repeated helper labels. Login has separate minimal chrome. |
| D13 | New: Exams has a focused Career view with a round-specific score trend, next attempt, rubric/evidence, repair/retake and immutable history. |

## Shared frame — D01, D11, D12

Desktop: 224px left rail; content maximum 1120px with 32px gutters. Primary navigation is Today, Plan, Roadmap, Health, Progress. The Tools group is Motivation, Library, Sharing, Settings. The selected destination is visible; detail routes select their parent. Add a record, search, theme and keyboard help belong in the utility menu.

Phone: compact NOVA header with Tools; five-item bottom dock for the primary destinations. Motivation is the first Tools entry. Pages scroll vertically with dock clearance and controls at least 44px. Long labels wrap. Creation opens in a sheet or full-screen editor when its content is long. A desktop two-column arrangement becomes one column; it does not shrink into two tiny columns.

Keep Inter body text and Space Grotesk headings, the existing NOVA mark, the agreed teal accent, pale canvas, white work surface and the existing dark theme roles. Use a flat working area for lists; reserve separate surfaces for genuinely distinct tasks. No extra gradients, decorative badges or metric cards.

Default page order on progress pages: title/context and primary action → relevant chart and compact metric/range controls → local views/date controls → main work area → optional history/settings. Other pages omit the chart. Preserve feedback, errors and provenance beside the action that needs them. Missing information is distinct from an explicit zero.

## Today — D02

Routes: `/hub`, `/trackers`.

- Header: Today, selected date/timezone, one action for the next commitment, active session or pending task.
- Calendar: containing Monday–Sunday strip, with a reachable date picker and visible selected date on narrow phones.
- Work area: Morning, Afternoon, Evening; time, title, actual status, duration once. Expand short notes and existing actions inline.
- Below: small Daily records and Habits & reminders disclosures; review-day entry remains available.
- Remove: task backlog, goal story, repeated Now/Next cards, visit/streak counters and always-open clock/reminder panels.
- Empty day: one concise state and a Plan action. Active session: one authoritative session controller. Historical dates retain their explicit date and existing rules.

## Plan, Tasks and Goals — D03, D05

Routes: `/plan`, `/todo`, `/goal`.

Plan: one title/date header and Add activity. Activities and Week are editing views for user-created activities, with a date/week picker and Edit on each row. They are not another read-only timeline of the same study, meal and routine blocks. A View timetable link opens Today. No Unscheduled section, backlog panel or Learning shortcut anywhere in Plan. Tasks and Goals remain reachable as dedicated child workflows; open-ended focus stays in a small Focus tools disclosure. Remove Your plan as a repeated heading and oversized empty panels. The leading chart shows completed focus, clearly separated from planned time.

Tasks: readable task rows, Add task, Open/Completed views. Search, tags and priority filters appear when there is something to filter. The editor contains title, due date and optional priority/tag. Editing, completion and recoverable deletion retain their existing behavior; no duplicate task list in Today.

Goals: current saved purpose, next milestone, milestone list and a distinct Progress/metric view. Edit goal is separate from logging a metric. Motivation has a clear link. Goal configuration and history open on request; do not repeat the full purpose story across Plan, Today and Goals.

## Roadmap — D04

Route: `/roadmap`; preserve existing query and deep-link contracts during implementation.

- Today: date, assigned topic, Start study; concise Study/Practice/Evidence sections. Keep resource links and evidence gates understandable.
- Timetable: absent from every Roadmap view, including disclosures. Open Today's agenda links to the one authoritative timetable. This presentation change does not alter existing study allocations, fixed IST scheduling or protected recovery/family blocks.
- Curriculum: chapter search, topics and actual study status; revision/recall queue and source/priority explanations live here.
- Career: existing Germany execution, applications, interviews and factual evidence. Exams gets its own focused view within Career. Resume/outreach/resources are secondary entries within Career.
- Move away from the default screen: full timetable, six reminder cards, audio-break controls, detailed curriculum explanation and career-resource inventories. Notification preferences remain in Settings; active alerts remain available.
- Unavailable account data: concise explicit state with a relevant return/action. Do not manufacture a campaign, mastery or application success.

## Motivation — D05

Route: `/motivation`.

Motivation is restored to desktop Tools, phone Tools and the Tools page. It remains reachable from Goals. The page contains the saved purpose, one current reminder and the next milestone. Another reminder, Save and Copy are modest supporting actions; there is one primary next-step link.

When the next step and Review goal would lead to the same destination, show one link. Keep personal reminders in an editor. Keep the existing attributed image available as supporting content, preferably optional on phone. No focus timer, daily reflection form, visit counters, autoplay or unrelated dashboard sections in Motivation.

## Exams — D13

Location: Career → Exams within the existing Roadmap workflow; preserve deep links when implemented.

- First: round-specific score trend, with round, track, rubric version and range context. Compare attempts under the same criteria; label outdated rubrics and assisted attempts instead of combining them into a readiness claim. Empty history has a compact first-attempt state.
- Select a round R0–R6 and applicable General/Frontend/Backend track. Show the actual time limit and tool rule beside the choice. R0 30m; R1/R2/R3 60m; R4 180m; R5 30m; R6 45m. Official docs are eligible only for R2/R4; assisted attempts are practice, not readiness evidence.
- Next attempt: one Start attempt action with prompt preview, active rubric and tool context. An active attempt exposes time/focus and a clear Finish action. The long exam guide opens on request rather than above the work.
- Review: a readable current-rubric dimension list, score 0–4 or Unscored, required reason and supporting evidence. Show total, each failing gate and critical failures explicitly; a total alone does not establish a pass. Reviewer identity/type stays with the evidence.
- Repair/retake: failing dimension → practice action → evidence, plus a retake date and a changed prompt. Keep history reachable below, preserving immutable attempts and their prompt/rubric versions.
- Readiness: two eligible passes on distinct prompts under the current round/track/version. At least one human-reviewed pass supports Reviewed readiness; otherwise use Self-assessed readiness. R2's Frontend and Backend readiness remain separate. Unscored, repair-needed and criteria-changed states are distinct.

The mock demonstrates the proposed hierarchy and round controls; it does not execute an exam, score actual evidence, or introduce new passing criteria.

## Health and its logging pages — D06

Health (`/health`): selected date and enabled domain rows for Food, Water, Body, Exercise, Sleep. Each row shows a factual recorded value or concise missing state, with one useful Log/Open action. History, Recovery and Connections are distinct views. Routines and trends remain accessible without another permanent summary wall.

Food (`/food`): date and Add food → compact known calories/macros → chronological meals. Entry rows show food, quantity and known energy, with Edit and a secondary menu. Diary, Saved foods and Nutrients are local views. Search → portion review → Save is a separate editor sequence. Recipes, manual entry, imports and barcode/source details remain available in the relevant tool view. Unknown nutrient values remain unknown.

Body (`/weight-loss`): title/date/unit → weight trend → measurement entry → history. Target editing and optional body measurements open separately. Saving a weigh-in does not modify other fields.

Exercise (`/workout-tracking`): selected session/date → exercises and readable set rows → finish/save. Previous values and rest controls stay beside the current exercise. History, program setup and plate calculator are secondary entries.

Fasting (`/intermittent-fasting`): Water, Meal window and History. Optional active timer opens explicitly; no permanent oversized timer when inactive. Overnight windows, manual records and Undo retain their behavior.

Routines (`/routine`): selected day and occurrence rows with scheduled time and actual taken/skipped/snoozed state. Edit routine and notification preferences are separate. Configuration never rewrites historical completion.

Sleep/recovery (`/health?view=recovery`): dated sleep hours, optional energy/mood/note, Save, and history. No invented medical or readiness score.

## Progress and Reflection — D07

Routes: `/dashboard`, `/review`, existing journal view in `/log`.

Default sequence: title/through-date → one trend with category, metric and 7/30/90-day range controls → factual change/coverage → dated readings. Empty ranges give a useful record action. No all-domain six-card wall and no repeated Explore dated records caption on every item.

Chart coverage: Today and Plan show completed focus; Tasks shows completed tasks; Goals shows the selected saved metric or completed milestones; Roadmap/Curriculum shows evidence-backed learning; Career shows completed actions; Exams shows scores for the selected round/track/current rubric; Health/Sleep shows a selected recorded health measure; Food shows energy or a selected known nutrient; Body shows weight; Exercise shows recorded minutes/sets; Fasting shows its selected water/window history; Routines shows recorded occurrences; Reflection shows dated entry coverage. Use one relevant chart, with visible units, gaps and coverage. No invented readiness, motivation or medical score. Charts remain above forms and long lists on phones too.

No progress chart on Motivation, Sharing, Library, Settings, Capture or Sign-in. Keep the goal story and next step prominent on Motivation. If there are no records, reserve the leading chart position for a concise empty state with the relevant record action, rather than generating sample data in the real app.

Keep missing dates as gaps, explicit zero as zero, source attribution and partial coverage. Metric/range selection persists through relevant navigation. Reflection edits a real dated journal entry with direct evidence links, rather than creating a separate duplicate reflection store.

## Sharing and Library — D08, D09

Sharing (`/share`, `/shared-with-me`, `/share/[shareId]`): My drops and Inbox with New drop in the header. Saved rows lead: title/preview, type, expiry, Private/Shared audience, and on-demand actions. New drop opens an editor; the composer is not permanently above the phone list. Empty collections hide search/type filters. Storage details are a disclosure or relevant cap/upload error.

Manage access is a separate editor showing the content, audience, expiry and explicit save/create/revoke actions. Saving content does not share it. Cloud-link success is shown only after the actual write; failure preserves the relevant draft or saved link. Keep the two-account policy, owner management boundary, denied/expired states and legacy audience values for review.

Library (`/archive`): saved item list plus New item; search and filters when items exist. Short text expands inline; long content has a proper viewer/editor. Keep copy, pinning, tags, image fallback and recoverable deletion. Empty state contains one useful New item action, rather than filters, counts and multiple capture/find slogans.

## Settings, Capture and Sign-in — D10, D11, D12

Settings (`/settings`): Account, Appearance, Notifications, Focus, Data. Account owns profile/calendar and sign-in/out. Appearance owns theme and enabled features. Notifications owns routine/browser preferences. Focus owns session defaults, fullscreen and explicit guard preferences. Data owns device pairing, import/export, sync/backup and data management. Destructive actions are last and remain explicit. Keep honest sync/local status once; do not expose environment variable names in normal controls.

Capture (`/log` and contextual editors): selected record type, date, units and only its required fields. Return preserves the originating route/date. Food uses search and portion review; time blocks expose overlap conflicts before saving. Save failure retains the draft. Unsaved closing follows the existing discard/keep-editing rule.

Sign-in (`/login`, callback and denied states): NOVA identity, one Google action and concise approved-account guidance. No rail, dock or background reminders. Distinguish loading, denied and unavailable service/configuration. Preserve secure return paths. No access-policy change is proposed.

Tools (`/more`): Motivation, Library, Sharing and Settings plus the small number of useful secondary entries. It is not a second dashboard or an inventory of every feature. The public portfolio and public landing routes are outside this personal-workspace layout proposal.

## Evidence and limits

The current review inspected local rendered Tools, Health, Roadmap, Progress, Motivation, Plan, Library, Settings and Sharing on 12 October. Screenshots are saved locally under `artifacts/ui-ux/cleanup-2026-10-12/`. Motivation's page is intact; its omission from both `PERSONAL_TOOLS_NAV` and `/more` explains why it is hard to find.

The local Sharing surface includes earlier uncommitted experiments. Local data and default curriculum views are not proof of either owner's signed-in production layout or cloud operations. The 23 proposed views illustrate structure rather than claiming every workflow was audited in every state. No accessibility-compliance claim is made from these captures.

This design turn changes only review material. Existing application code, local Sharing experiments, records, authentication and deployed behavior remain unchanged until the user approves implementation scope.

The revised preview was checked across all 23 views at desktop width 1024px and a narrow-phone viewport of 320px. No horizontal overflow or clipped chart labels was found. All 17 progress views place their chart directly after the title; the other six omit it. The phone keeps five primary destinations and sign-in has none.

Metric and 7/30/90-day range controls redraw the chart; weight uses a line with missing readings left as gaps. Exam round selection updates the displayed round/time/tool rule. Repair opens its disclosure, and attempt evidence opens a read-only viewer. Plan's Activities and Week views contain no repeated timetable or Unscheduled queue. Nine approvals carry forward; D03/D04/D07/D13 start pending. Approval toggle/reset was checked without sending a review message. No preview console errors or warnings were recorded. This verifies design review material, not completed application implementation.
