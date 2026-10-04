# NOVA daily-life UX restructure

Date: 4 October 2026
Status: approved by the user on 4 October 2026; implemented in the daily-life restructuring release. Signed-in planning and operational delivery remain gated as documented in the setup guide.

## Product decision

The user chose: **Run my day: work, meals, exercise and reminders together.**

The visual styling is acceptable. The redesign changes information architecture, journeys, components and defaults. Retain the readable teal/neutral visual system and invest effort in fewer decisions, fewer repeated controls and clearer outcomes.

Success means a person can open Today, understand their next commitment, start work or record an activity, and return to the same day without finding the relevant tracker again.

Scope: personal.buildora.work and its personal routes. Preserve the public portfolio, resume/PDF and external Software Developer Bible. This proposal supersedes conflicting UX decisions in the consolidated change sheet after approval; previous completed work remains historical evidence.

## Evidence from the current source

- `src/app/trackers/page.tsx` renders a next-action card, top-three task list, study card, destination links, routine checklist, recovery form and habits independently. They are not one chronological day. Its next-action URL does not carry the displayed task ID.
- `src/app/plan/page.tsx` leads with a focus timer and another pending-task queue. It does not provide a practical day/week scheduling workspace.
- `src/components/trackers/PersonalShell.tsx` inserts a clock, section navigation, action bar and seven-day summary before many editors. Entering a tracker requires passing repeated context.
- `src/app/health/page.tsx` begins with destination links, then full recovery and reminder components; it does not make direct everyday logging the primary interaction.
- `src/app/log/page.tsx` and `src/components/trackers/LogCapture.tsx` offer a long mixed capture surface with separate destination links. Capture and journal are conflated.
- `src/app/review/page.tsx` repeats several statistics now available in Progress. More repeats sharing destinations and settings/reminder entry points.
- `src/app/goal/page.tsx` mixes goal configuration, milestones, daily metric, consistency grid, ETA and generated outreach. The next action competes with configuration and reporting.
- `src/app/roadmap/page.tsx` is about 2,000 lines, with daily learning, curriculum, interview drills, outreach, relocation facts, resources, guards and motivation. The default learning journey must not expose all of these at once.

These are source-derived findings, not a completed usability study or proof of live authenticated behavior.

## Approaches considered

| Approach | Strength | Trade-off | Decision |
| --- | --- | --- | --- |
| Daily agenda with shared capture | Connects work, health and reminders around what happens today | Needs a small scheduling model and careful linking of existing records | Recommended |
| Dashboard first | Makes trends immediately visible | Slower to start work or record lunch; encourages more summary cards | Keep reporting inside Progress |
| Independent module workspaces | Easier to change one tracker at a time | Preserves navigation burden and disconnected queues | Use only as destinations behind the agenda |

## Navigation and ownership

Four primary destinations: **Today, Plan, Health, Progress**. Mobile uses four consistently named destinations plus a separate labeled Add button. Desktop uses the same destinations and Add action. Account/tools menu contains Settings, Library and Sharing; Motivation belongs with the primary goal.

- Today owns execution and the chronological day.
- Plan owns scheduling, the task backlog, the primary goal and learning preparation.
- Health owns recording food, exercise, body measurements, sleep and optional fasting.
- Progress owns statistics, historical comparisons and reflection.
- Add owns quick entry using the same forms as the destination pages.

Primary navigation replaces the current More destination; `/more` remains a working Tools landing route. Every old URL stays usable through a maintained workspace or a redirect that preserves the requested view, date and selected record. Existing G V continues to open Progress. Existing capture shortcuts continue to work. Never require a menu search to find primary daily actions.

Do not stack a back link, section tabs, duplicate destination links and an action bar for the same navigation purpose. Detail pages use one section back link plus local views. Root workspaces use their own view navigation.

## Daily journey and low-fidelity layout

```text
TODAY — Sun, 4 Oct                    [Add] [Account]
[Previous day] [Today] [Next day]

[Active session, only when one exists: Resume / Finish / Cancel]

NOW / NEXT
14:00 Lunch + omega 3          [Log lunch] [Routine actions]
  Log food and mark a reminder are separate, explicit actions.

YOUR DAY                       [Edit in Plan]
08:00 Study block              Completed
12:00 Zinc                     [Taken] [Later] [Skip]
14:00 Lunch / omega 3           Due
18:00 Snack                    Upcoming
20:00 Dinner                   Upcoming
22:00 Magnesium                Upcoming

NO TIME ASSIGNED
[ ] Practice API design        [Start] [Schedule]

[Food] [Water +1] [Weight] [Exercise]  — enabled quick actions
[Review this day]               — quiet footer action
```

Desktop can place the small unscheduled queue beside the agenda. Mobile keeps chronological content first. This is a structural wireframe, not a request for a new color palette.

### Today behavior

1. Open at the user's current calendar date. Historical dates are explicitly labeled; starting a work timer is only offered for today.
2. Show an existing active session before any recommendation. Otherwise show one next scheduled commitment, with its exact destination and linked record ID. Do not silently substitute a different task in Plan.
3. Merge planned blocks, generated meal/supplement occurrences and recorded activity into one agenda. Completed occurrences collapse behind a count; earlier incomplete commitments use neutral wording and can be rescheduled or skipped.
4. Unscheduled tasks stay in a small separate queue. The person can choose up to three daily priorities, referencing existing task IDs rather than creating duplicate tasks.
5. Enabled habits appear as a compact checklist. Sleep can appear as one unrecorded morning prompt that opens the shared form, not a permanent full form.
6. Show no global progress percentage, streak, quota warning, repeated seven-day cards or destination directory. Absence of a meal/workout record means unrecorded, not failure.
7. Optional modules can be hidden without deleting their data or removing access to old records.

## Page-by-page redesign

| Existing area | Final structure | Remove from the default surface | Add or change |
| --- | --- | --- | --- |
| Today `/hub`, `/trackers` | One selected day and agenda | Competing next-action/task/study cards, full recovery form, link directory | Now/Next, chronological agenda, unscheduled queue, contextual quick capture |
| Plan `/plan` | Day / Week / Tasks / Goal / Learning views | Always-mounted focus timer and second task queue | Time-block editor, weekly outline, schedule conflicts, exact task/session handoff |
| Tasks `/todo` | Backlog editor, Today/Upcoming/Completed, search and filters | Streak/progress story panels and duplicate add/list anchors | Priority pinning, Schedule action, batch reschedule with preview; keep edit, complete and undo |
| Goal `/goal` | Purpose, next milestone and weekly commitment first | Category selection, metrics configuration, consistency grid and outreach mixed into the main journey | Edit goal panel; attach tasks to milestones; daily metric as optional logging; reports in Progress |
| Learning `/roadmap` | Current block / Curriculum / Resources | Repeated banners/digest, motivation hero, guards, notification lists and career resource walls before study | One resume/start action, essential-first curriculum filters, source details on demand, separate optional career resources |
| Health `/health` | Today / History, compact direct entry strip | Link-directory-first layout, full routine schedule, full capture forms | Meal status, last workout, latest dated weight, last sleep and water; every row opens its relevant editor |
| Food `/food` | Diary / Saved foods & recipes / Nutrients | Recipe management and micronutrient wall interrupting meal entry | Recent/favorite food chooser, repeat meal with portion/date preview, meal-group edit actions, visible pending save |
| Exercise `/workout-tracking` | Session / History / Plan | Volume/PR panels before set entry; split management and calculators always visible | Choose/start workout, large set-entry rows, last-session reference, finish summary; rest/plates contextual |
| Body `/weight-loss` | Weigh-in plus dated history | Trend/target configuration above the immediate entry form | Unit/date explicit; trend after records; optional target inside settings; retain correction/remove/undo |
| Water & fasting `/intermittent-fasting` | Water first; optional eating window in a separate view | Countdown dominating hydration or enabling fasting by default | Shared water control; edit/undo water entry; deliberate fasting start/end/history |
| Recovery | Shared sleep/energy/mood form and dated history inside Health | Duplicate recovery forms and synthetic readiness measures | Short sleep-first capture; optional other fields; inspect and correct past records |
| Routine `/routine` | Schedule / History / Notifications | Schedule administration inside Today/Health; repeated device setup guidance | Group related meal/supplement rows, occurrence actions, explicit delivery status, edit preview |
| Progress `/dashboard` | Overview / Health / Work & learning / Reflection | Six expanded detailed panels on every visit; repeated metrics from Review | Compact domain summaries, one selected detail chart, aligned date ranges, saved-target comparison and recording coverage |
| Review `/review` | Reflection view under Progress | Duplicate statistics dashboard | Daily/weekly reflection prompts, recorded wins, editable note and optional next-week commitment |
| Capture `/log` | Full-page version of the global Add flow; Journal view via `?view=journal` | Long all-category form and navigation directory | Choose one record type, date, relevant fields, save feedback and return to original context |
| Motivation `/motivation` | Purpose, next milestone, personal words, one next action | Generic rotation, visit counters, timers and duplicated reporting | Goal-specific encouragement; start the exact next task; edit personal reminders on demand |
| Library `/archive` | Searchable list and focused item detail | Decorative storage/count panels above retrieval | Type filters, add from global capture, stable selected item, copy/save feedback and undo |
| Sharing `/share`, `/shared-with-me` | Sent / Received within one Sharing workspace | Duplicate destinations and ambiguous actions | Preview content/audience/expiry; explicit share confirmation; revoke and access status |
| Settings `/settings` | Profile / Modules / Notifications / Work preferences / Data | One long configuration page, duplicate schedule editors, story/signal panels | Clear saved/unsaved state, timezone explanation, module visibility, separate destructive data controls |
| Tools `/more` | Small secondary directory | Primary-navigation slot, repeated health/planning links | Settings, Library, Sharing and optional tools only |
| Login and setup | Sign in, then optional short personalization | Mandatory repeated questionnaire or prerequisite barriers | Continue to intended route; timezone/module summary; skip and edit later |
| Public portfolio / external Bible | Existing behavior | Nothing under this proposal | Regression coverage only; preserve resume/PDF and source links |

## Component decisions

### Remove or relocate

- Remove automatic `DomainProgressOverview` injection from detail editors; retain its projection logic for Progress summaries.
- Stop injecting `WorldClockStrip`, `TrackerActionBar` and section tabs together into every page. Put a compact date/time on Today; timezone detail belongs in its control and Settings.
- Replace Today destination lists, `RoadmapTodayCard` and the standalone next-action card with agenda rows backed by the same records.
- Remove the permanent focus setup from Plan's default view. Keep the existing session controller and show setup when a task/study block is started.
- Remove story/signal/consistency/ETA panels from everyday entry flows. Any useful historical information belongs in Progress, with valid units and observed data.
- Move recipe/split/goal/routine configuration to their appropriate local views, not nested beneath daily forms.
- Keep audio break as an optional session break action opening an honest YouTube Music destination. It does not need a lounge, player or standalone section.
- Keep focus guard/bedtime options off by default and never block ordinary app navigation.

### New required components

| Component | Responsibility | Data and interaction |
| --- | --- | --- |
| Day selector | One consistent calendar context | Previous/next/today, explicit timezone, historical label |
| Daily agenda | Chronological planned and recorded day | Pure projection of blocks, routine occurrences and linked records; no duplicated storage |
| Agenda row | One understandable event or activity | Time, title, state, exact primary action; expandable secondary actions |
| Now/Next | One immediate action | Active session wins; next chronological commitment otherwise; no forced action |
| Time-block editor | Schedule a task, study block, exercise or personal event | Start, duration, date, optional record link; collision warning and explicit save |
| Unscheduled queue | Short task list that can become a plan | Existing task IDs, at most three optional daily priorities |
| Add chooser and record forms | Consistent quick entry everywhere | Food, water, weight, exercise, sleep/recovery, task, goal metric, note; one form at a time |
| Active session bar | Preserve a running work session across routes | Existing controller; Resume/Finish/Cancel, no second timer |
| Record feedback | Make mutation outcomes understandable | Saving/Saved/Failed, retry preserving draft, undo where supported |
| Progress explorer | One readable historical question at a time | Shared range, metric selector, dated chart/table, coverage and edit-source link |
| History browser | Find and correct past records | Date/type filters, stable selected record and source editor |
| Workspace preferences | Keep the everyday surface personal | Enabled modules, optional daily prompts and visible shortcuts |

Do not add AI recommendations, meal-photo estimation, wearables, finance, social features, leaderboards, extra scores or compulsory daily tracking. Multi-goal/project management is outside this release: retain one primary purpose with milestones, ordinary tasks and optional health targets.

## Capture and return contracts

- Quick capture opens in a dialog on desktop and a full-height sheet on mobile; `/log` is the equivalent standalone route.
- Every opener supplies `{ type, date, returnTo, sourceId? }`. Validate `returnTo` as a local personal route. Preserve the originating day/view and scroll position where possible.
- Water +1 saves directly with Undo. Other capture types show their minimal form. Exercise opens the session workspace rather than compressing set logging into a small dialog.
- Successful save updates each relevant screen exactly once and retains date context. Failure keeps the draft and gives Retry. Closing a dirty form asks whether to discard it; closing an unchanged form requires no confirmation.
- Food saves a food record only. Routine Taken/Done saves an occurrence only. After saving lunch from a routine row, offer an explicit “Mark lunch done” action; never silently mark omega 3 taken or invent supplement nutrients.
- Repeat food/workout operations copy editable values with a preview. They never copy completion timestamps or mutate previous-day records.

## Scheduling model and data safety

New scheduling requires new persisted data, not guessed time slots on existing tasks.

Proposed records:

- `plan:blocks`: account-scoped records keyed by ID; `{ id, date, startLocal, durationMinutes, timeZone, kind, title, sourceId?, updatedAt, deleted? }`. `kind` is task, study, exercise or event. Store the block's timezone explicitly. Validate date, IANA timezone, positive duration and reference type. Blocks cannot cross midnight in this release; offer splitting into two explicit blocks.
- `plan:days`: account-scoped records keyed by date; `{ date, priorityTaskIds, updatedAt, deleted? }`. Reject duplicate IDs and more than three selected priorities. Missing/deleted linked tasks are shown as unavailable, with a repair/unlink action.
- Goal-to-task linkage is an optional `milestoneId` on a task with a backwards-compatible reader; unrelated tasks remain valid. A deleted milestone leaves the task intact and clears only the link after confirmation.

Use existing synced-record conflict/tombstone handling. Extend typed export/import to include these records before enabling scheduling. Old backups remain importable. Add the next sequential database migration only if server persistence needs it; inspect the current migration catalog at implementation time. No table reset, bulk deletion or silent record reshaping.

Existing food snapshots, units, workout sets, weight history, journal, routines, sessions and study evidence remain authoritative. Deleting a scheduled block removes scheduling only; deleting an activity uses that activity's own explicit action and undo rules. No new total combines focus and study when they refer to the same session: show separate recorded categories until a verifiable linkage exists.

## Personal rules to preserve

- Only cvamsik99@gmail.com receives the Bible-aligned timetable: 10 hours on weekdays and 4 hours on each weekend day, in Asia/Kolkata. Other accounts keep their own settings. User-created extra blocks warn about overlap and do not silently rewrite the prescribed timetable or its hour totals.
- Preserve verified curriculum inventory/source links and recorded evidence; do not change the 100-day/556-chapter snapshot as a side effect of UX work.
- Owner routine: Monday B12 08:00; zinc 12:00; lunch and omega 3 14:00; snack 18:00; dinner 20:00; magnesium 22:00. Preserve occurrence identity, snooze, skip, taken and undo histories.
- Other accounts' dates use their configured timezone. Generated owner routines use their explicit timezone even when traveling; display it where ambiguity matters.
- Missing nutrition remains unknown. Show portion-aware calories/macros and available micronutrients with coverage. Unknown food days are not zero-intake days. Targets are user-entered; no invented dosage or medical interpretation.
- In-app reminder availability and closed-site push delivery are distinct states. Existing migration/provider/scheduler/device verification gates remain visible in administration, not repeated as product copy on every screen.

## Interaction and accessibility rules

A row's primary action always matches its title and record ID. Starting a session does not mark a task complete. Finishing a linked session offers a separate task completion choice. An existing session must be resumed or explicitly replaced; never start parallel timers.

Touch targets at least 44px; no hover-only essential controls. Mobile names get full readable width. Modal focus remains contained and returns to its opener. Preserve reduced motion, visible keyboard focus and screen-reader statuses. Color alone never conveys due/completed/failed state.

Remember selected local view/filter while switching destinations; encode meaningful deep links with date/view/record. Never reload the app just to change a filter. Search-empty and no-record states are distinct. Critical changes have explicit Save/Cancel; immediate actions have feedback/undo. Authentication/offline/error states must preserve drafts and explain the next action.

## Acceptance criteria

These are release targets, not claims already measured:

- Today displays one agenda and at most one Now/Next recommendation; no duplicate pending-task queues or permanent reporting cards.
- From Today, water takes one action; a new weigh-in opens within two actions; recent food can be selected, portion-reviewed and saved within four actions. Count from the relevant Today shortcut and exclude text typing.
- A selected task starts with that exact task ID/label and returns to the same selected day. Routine food capture does not complete supplement occurrences.
- A day's work, meals, exercise and reminders can be inspected without switching tracker pages; editing remains in the owning workspace.
- Scheduling/priority changes survive reload, account switch, offline retry and backup/restore without copying tasks or changing old activity records.
- Disabled modules disappear from Today while their histories remain accessible. Old URLs resolve to the intended view/date without loops.
- Charts preserve known-zero versus missing readings; timestamps honor owner/account timezone rules across midnight and daylight saving boundaries.
- 320/390/768/1440px in light/dark themes: no overflow, squeezed text, obscured active controls or unreachable bottom content.
- Full browser regression plus domain/storage, typecheck, lint and production build pass. Signed-in cloud checks and real-device push are separate required production evidence, never replaced by auth-open local tests.

## Delivery sequence and reviewable slices

1. **Navigation and shell:** four destinations, contextual headers, tools menu, active-session placement, legacy route matrix. Retain existing pages behind it until replacements pass.
2. **Shared capture:** split existing forms into reusable record-specific units; implement chooser/context/return contracts and draft feedback before replacing the old Log surface.
3. **Day planning and Today:** scheduling records, export/import compatibility and pure agenda projection; Plan day/week editor; Today unified agenda, priorities and exact action handoffs.
4. **Health workflows:** direct Health entry, food diary/repeat flows, exercise session/history, body/water/recovery forms and occurrence integration. Remove obsolete default components after their replacements are reachable.
5. **Goal and learning:** next-milestone/weekly commitment, isolated goal editing, contextual learning blocks and optional career resources. Keep the Bible snapshot and timetable invariants.
6. **Progress and supporting tools:** domain explorer, consolidated reflection/journal, Library/Sharing/Settings restructure; complete legacy aliases and persistence checks.
7. **Release:** populated before/after captures, measured journey action counts, complete tests, updated change sheet/audit/setup docs, commit/push and main integration as authorized. Deployment verification must be reported separately.

Each slice is independently testable. Do not ship a temporary navigation dead end or remove a capture path before its replacement works. Feature-gate the new planning/agenda experience until its persistence path and backups are verified; switching back preserves records created with it.

## Design self-review

The proposal keeps the accepted visual identity, removes duplicated daily entry points, gives each workspace one responsibility and adds only components needed for the chosen daily-life journey. The new schedule model is explicit; historical activity, reminder completion and planned events stay distinct. There are no undefined future integrations or data-deleting removals. Implementation should proceed inline in phased commits after design review, using a detailed task/test plan derived from this specification.
