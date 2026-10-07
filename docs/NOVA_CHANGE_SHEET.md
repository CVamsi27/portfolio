# NOVA — consolidated website change sheet

**Updated:** 4 October 2026 (IST)

**Product:** personal.buildora.work — one personal workspace for planning, health, progress and purpose.

**Status:** approved product scope implemented locally, including food tracking and routine reminders. Production database migrations, provider credentials, scheduler configuration and authenticated delivery verification remain release gates.

The later approved [MacroFactor-level nutrition specification](superpowers/specs/2026-10-07-macrofactor-level-nutrition-design.md) expands the original nutrition/Android scope. That larger target is in progress; the original defer list below describes the earlier release, not cancellation of the newly accepted requirements.

This is the single scope and decision sheet for the redesign. Earlier design documents remain historical references. Where they differ, use this sheet and the latest user instructions. Deliver one coherent release through small, reviewable implementation steps; “one change sheet” does not require one enormous commit.

## 1. The intended experience

Open Today and understand what matters next. Plan work and personal commitments. Record meals, movement and other useful signals with little effort. Review progress without duplicate dashboards. Visit Motivation when encouragement is needed, and find familiar data after every update.

The product supports the whole person, not just the career timetable. Health receives a primary destination now that food tracking is a core feature. Features can be enabled or hidden by the user; disabled modules do not fill Today with empty cards. No forced tracking, competitive score, guilt language or generic motivational clutter.

### Primary navigation

**Today → Plan → Health → Progress**, with **Add** and **Tools** separate on desktop and mobile.

| Destination | What belongs here | Main action |
| --- | --- | --- |
| Today | Selected day, chronological work/meal/supplement agenda, one Now/Next action, unscheduled tasks and up to three pinned priorities | Execute or capture for the selected day |
| Plan | Day/week time blocks, backlog, goal and learning links; focus setup reached by an exact task ID | Schedule or start selected work |
| Health | Dated records, history, direct food/water/exercise/weight capture and optional recovery | Record or correct the selected day |
| Progress | Compact overview, one selected Health or Work metric at a time, 7/30/90-day trends and Reflection; /review redirects to Reflection | Inspect one question or reflect |
| Tools /more | Library, Sharing, Settings and secondary tools; Motivation is reached from Goal | Open a secondary tool |

Quick capture is always reachable from the shell and Today. `/log` remains the direct capture route; it is not removed. `/motivation` stays entirely goal-oriented, rather than becoming a timer dashboard. Existing routes and bookmarks remain usable; aliases must preserve their destination and selected view. Desktop and mobile use the same names and active-state rules. A compact Motivation link is available from the goal summary, without reproducing its content on Today.

This supersedes the earlier Today/Plan/Focus/Review/More proposal: Focus becomes a work session within Plan/Today, and Health becomes a primary destination.

## 2. What is already done, and what remains

| Status | Changes | Evidence / limit |
| --- | --- | --- |
| Previously merged | Shared UI foundation, accessible controls/dialogs, portfolio polish, tracker improvements, clock fixes, search refinements, and owner timetable alignment | Commit `8cbb2c8`; historical checks in docs/ui-ux-review.md |
| Implemented locally | Modal click recovery, visible focus cancellation, off-page timer expiration, service-worker router-cache fix | Not deployed; authenticated live click issue still requires confirmation |
| Implemented locally | Audio break opens three relevant podcast searches on YouTube Music; optional break timer; exact Music hostname exception | No hidden playback; timer survives closing its mounted chooser, not a page reload |
| Implemented locally | Goal-led Motivation page; removed journal/timer/stats/rotation/fullscreen clutter; personal reminders on demand; navigation/search/setup consistency | Included in the integrated local regression suite; historical phase evidence retained |
| Implemented locally | Today/Plan/Health/Progress navigation plus Add/Tools, daily agenda, optional modules/habits/recovery, optional focus/rest/guard and consolidated recall | Local browser verification; existing destination routes and records retained |
| Implemented locally | Food portions, recipes, macro/micronutrient coverage, saved/favorite foods, optional targets and typed backup/restore | Manual logging works without provider credentials; live database search needs its server key |
| Implemented locally | Owner-only IST meal/supplement schedule, occurrence history, snooze/undo, notification opt-in and private push infrastructure | In-app checklist available; closed-site delivery requires migrations, server credentials, scheduler and a real signed-in device |

The earlier consolidation was merged into main at `f58d68a`. The new progress workspace lives on `fix/progress-dashboard`. “Implemented locally” is not a claim that personal.buildora.work has changed. Release verification must distinguish local mode from a real authenticated cloud session.

## 3. Full feature change matrix

| Area | Decision | Final behavior / changes |
| --- | --- | --- |
| Today / hub / tracker entry | Consolidate | One selected day, chronological planned/routine agenda, one Now/Next action and unscheduled task queue; records open in their owners |
| Navigation and search | Redesign | Five destinations above; consistent labels, active states, keyboard search and shortcuts; stable old routes |
| Tasks | Keep and simplify | Quick add, priority, due date, useful filters, explicit edit, completion, undo delete; no duplicate task queues |
| Goals | Keep and simplify | Saved purpose, milestones and weekly commitment; clear units/denominators; settings behind Edit goal |
| Career / 100-day roadmap | Keep and redesign | Current day, Curriculum, Timetable and career resources; evidence-based completion, correct source links, no competing next-action panels |
| Focus and study cockpit | Consolidate | One session state/controller, topic/resources, start/pause/resume/finish/cancel; active status across routes |
| Revision deck / recall gate | Consolidate | One due-review experience with reveal, self-rating, skip and exit; user-initiated rather than compulsory navigation gate |
| Motivation | Keep the new focused design | Saved goal, relevant encouragement, next milestone/action; saved/personal reminders on demand; no work timer or dashboard tiles |
| Audio break | Keep the simplified launcher | Native YouTube Music links, truthful labels, optional timer, clear return action; add topic-based recommendation ordering |
| Distraction / mobile barriers | Rework | Opt-in guard, explain its actual in-app scope, visible pause/end; ordinary navigation always works |
| Bedtime / curfew | Rework | Optional reminder/rest view with exit; no default forced lockout; no claim of controlling OS notifications |
| Food and nutrition | Add — core | Daily food log, calories/macros/micros, portions, saved foods, recipes, targets and coverage-aware review |
| Hydration | Keep, integrate | One water record shared between Today and Health; no separate duplicate counters |
| Weight / body | Keep and simplify | Date/unit visible, weigh-in, trend with accessible summary, optional target; avoid confusing no data with zero |
| Workouts / movement | Keep and redesign | Mobile set entry, previous-session values, contextual rest timer/plate calculator; summaries after the active session |
| Meal and supplement reminders | Add — requested personal routine | Lunch/snack/dinner and supplement schedule below; Today checklist, snooze, taken/skipped history and honest notification status |
| Fasting / meal window | Keep optional | First/last meal and history; distinguish timers from manual records; food timestamps may suggest a window only with confirmation |
| Recovery | Add a lightweight capture | Optional sleep start/end or duration, energy/mood and short note; no wearable integration or diagnostic score in this release |
| Habits | Add a small optional checklist | At most five user-selected routines on Today; one completion record per date, no separate habit dashboard or duplicate task system |
| Log / capture | Expand and unify | Task, food, workout, weight, water, meal window, reflection and optional recovery; date/unit shown; only relevant fields visible |
| Daily/weekly review | Consolidate | Task and milestone progress, actual focus time, optional health trends and reflection; nutrition intake with data coverage, not a health score |
| Archive | Keep as Library | Private notes/links/images, search/filter, readable detail, stable image failure, safe copy, undo delete |
| Sharing / incoming shares | Keep secondary | Explicit content/audience/expiry, distinct copy/access controls, revoke/recovery, private defaults |
| Clock | Keep contextual | Compact local date/time on Today; timezone detail on request; correct midnight and daylight saving; absent from Motivation |
| Device setup | Simplify | Optional checklist explaining browser versus OS capabilities; no repeated prerequisite screens |
| Settings and account | Regroup | Profile/appearance, enabled modules, reminders, focus/rest preferences, sync/backup, data management |
| Public portfolio | Retain completed improvements | Preserve resume/projects/contact and shared-control fixes; broad personal redesign does not rewrite the portfolio |
| Software Developer Bible | Preserve integration | Verified source links and curriculum alignment; no redesign of study.buildora.work in this release |

**Remove from the visible experience:** duplicate summary cards, visit/deck counts, pretend playback, hidden video, automatic inspirational slideshows, unnecessary fullscreen barriers, rank/equalizer decorations, shame-based prompts, redundant affirmation sections, obsolete source/style choices, repeated diagnostic copy and implementation terminology.

**Defer:** AI meal-photo estimates, automatic barcode camera scanning, grocery/meal-planning automation, wearables, automatic exercise-calorie credits, supplement recommendations, clinical interpretation, banking/expense tracking, social feeds and gamification. These do not belong in the first cohesive release. Manual packaged-food entry and recipe logging are included now.

Removing an interface does not delete records. Existing journal, favorites, custom reminders, session history, timetable and other data remain available through their appropriate views and backups.

## 4. Food tracker — required first release

### A. Everyday flow

1. Open **Health → Food**, or choose **Food** in quick capture.
2. Select date and Breakfast, Lunch, Dinner or Snack; names can be changed later without changing nutrient records.
3. Find a recent/favorite/saved food, search the database, enter a food manually, or select a recipe.
4. Choose quantity and a declared portion (grams, supported millilitres, or a named serving with known mass). Show calories and macros for that quantity before saving.
5. Save with clear feedback. The meal and daily summaries update once. Edit quantity/meal/date, duplicate to another date, or remove with Undo.
6. Use **Nutrients** to inspect vitamins/minerals and their data coverage. The main page stays a food log, not a wall of nutrient tiles.

Recent foods and repeat-meal actions make ordinary logging faster. Empty days say “No food logged”; they do not imply zero intake. A date picker and previous/next day controls make backfilling straightforward. A food entry is a log, not a nutrition prescription.

### B. Daily summary

Show calories (kcal), protein (g), carbohydrate (g), fat (g) and optional fibre (g). Show consumed totals; show comparisons only when the user has set a relevant target. One daily summary sits above the grouped meals. Each meal shows its subtotal and entries with name, portion and energy.

Fibre, total sugar, saturated fat, sodium and detailed nutrients are available on expansion. Do not add component values twice: sugars/fibre are not extra carbohydrate totals; saturated fat is not added on top of fat. Source-provided energy takes precedence over a macro-derived approximation. If energy is estimated from macros, label that estimate explicitly.

### C. Micronutrients

Support, where the source supplies them:

- Vitamins A (µg RAE), C (mg), D (µg), E (mg alpha-tocopherol), K (µg), B1/thiamin (mg), B2/riboflavin (mg), B3/niacin (mg), B5/pantothenic acid (mg), B6 (mg), B7/biotin (µg), B9/folate (µg DFE), and B12 (µg).
- Calcium, iron, magnesium, phosphorus, potassium, sodium and zinc (mg); copper and manganese (mg); iodine and selenium (µg).

Keep nutrient identities and units explicit. Do not combine incompatible vitamin-A forms or folate equivalents with a simple mass conversion. Convert mg/µg only when nutrient identity and basis match. Keep provider-specific fields that cannot be normalized separate rather than inventing values.

A missing nutrient is **unknown**, not zero. A day with partial information says, for example, “Known calcium: 420 mg — data available for 3 of 5 entries.” Its target comparison is labeled partial. Absence of an entry means unlogged, not deficient. Do not award an “all nutrients complete” badge based on incomplete database/label values.

### D. Targets

Allow optional, editable targets for calories and individual macros/nutrients; show totals without targets by default. Set a target once in Nutrition settings, with its unit and type: informational/reference, desired amount or user-entered limit. A value above a minimum/reference is not automatically “bad,” and sodium/other limit-style targets are not presented as goals to exceed.

Do not silently infer a calorie deficit from weight, automatically increase intake targets after exercise, diagnose deficiencies or recommend supplements. If reference guidance is offered, identify its source and required profile inputs rather than applying one number to everyone. USDA's DRI calculator uses personal inputs and reference standards; it is a reference resource, not a substitute for a clinician's individualized advice: https://www.nal.usda.gov/human-nutrition-and-food-safety/dri-calculator.

The tracker remains useful without height, age, sex or activity-level setup. Manual targets are optional; no sensitive-profile questionnaire blocks food logging.

### E. Food sources and home cooking

**Manual entry works first and offline.** Save a name, brand optional, nutrient basis (per 100 g / per 100 ml / per declared serving), known nutrients and portion conversion. Numeric input allows genuine zero values, rejects negative/non-finite values, and retains unknown fields as null. A food may be logged with incomplete data, clearly marked as such.

**Database search:** use USDA FoodData Central through a server-side adapter, with source ID, source type, nutrient basis and retrieval date. Search/Details endpoints are documented; a data.gov API key is required and must remain secret. Handle rate limits, empty results and provider outages without losing a manual draft. Primary reference: https://fdc.nal.usda.gov/api-guide/.

Do not promise comprehensive Indian-food coverage. Give home-cooked Indian meals first-class manual/recipe workflows: dal, rice, roti, curries or other dishes are entered as the user's actual recipe or a clearly identified database match, not invented default nutrition. Distinguish raw/cooked and branded/plain foods in results. Saved label entries identify their source as user-entered; do not imply micronutrients exist when the label does not provide them.

**Recipes:** choose ingredients and quantities, include cooking oil and other additions, then declare total yield in servings or measured final cooked grams. Sum ingredient nutrient amounts once; scale by the consumed share of the batch. Let the user save and reuse the recipe. Label it an estimate because preparation and ingredient variability affect actual nutrition. Changes to a saved recipe do not rewrite historical meals.

Nutrition data varies by food form and source; FoodData Central distinguishes Foundation, SR Legacy, survey and branded datasets. Keep this provenance visible in details: https://fdc.nal.usda.gov/Foundation_Foods_Documentation/.

### F. Calculations and validation contract

For a per-100g food: `entry amount = source amount × consumed grams / 100`. A food with 200 kcal and 10g protein per 100g logged at 150g contributes 300 kcal and 15g protein. Known micronutrients scale by the same basis; unknown ones remain unknown.

For a serving-based food: use its declared serving amount. A “cup,” “roti,” “bowl” or “piece” is usable only when a mass or serving-specific nutrient basis is declared. Never assume all bowls/rotis weigh the same. Millilitres must use per-volume nutrients or a known density; never silently treat 1ml as 1g for every food.

Keep calculation precision internally and round for display only. Editing/reclassification updates one entry; retries and double-clicks cannot create duplicates. Imported/provider results are validated before normalization. Daily totals use the selected local calendar date, not accidental UTC day boundaries. Overnight eating and date edits are explicit.

### G. Data and account boundaries

Suggested focused files: `src/lib/nutrition.ts` for types/calculations/normalization, `src/lib/nutrition-store.ts` for persistence, `src/lib/nutrition-provider.ts` for server-side FoodData Central access, `src/app/api/nutrition/search/route.ts` and `src/app/api/nutrition/food/[id]/route.ts` for authenticated lookups; `src/app/food/page.tsx` and `src/components/nutrition/` for the daily log, entry editor, nutrient details and recipes.

Use the existing authenticated store architecture, with versioned `nutrition:entries`, `nutrition:foods`, `nutrition:recipes` and `nutrition:targets` keys. Each entry has a stable ID, local record date, optional eaten-at timestamp/timezone, meal, source, consumed quantity and a **nutrient snapshot**. Provider changes and recipe edits cannot alter yesterday's totals. Unknown nutrient values remain null through storage/export/import.

Include every new key in validated backup/restore and deletion policies. Do not put provider secrets in client storage or NEXT_PUBLIC variables. Food search sends the search term; it does not send the user's meal history, weight or goal title to the provider. Health records are private and never included in existing shares by default.

Audit account switching and offline synchronization before enabling cloud nutrition writes. Local/cloud reconciliation must preserve newer edits and detect conflicts; silently overwriting a whole food history is unacceptable. Avoid building a second independent synchronization system without first assessing the existing generic store's limits.

### H. Food acceptance examples

- 150g of the example above produces 300 kcal/15g protein; edit to 75g produces 150 kcal/7.5g without a duplicate entry.
- A missing calcium value remains unknown in entry, daily summary, export and restore; true zero remains zero.
- A recipe with a 1,000g final yield logged at 250g contributes one quarter of its declared batch nutrients.
- Per-serving, per-100g and per-100ml entries use their own declared basis; an undefined bowl size requires input.
- Provider outage/rate limit leaves manual logging available and a draft intact; provider credentials never appear in browser responses.
- Changing a saved food/recipe leaves historical snapshots unchanged. Removing a meal updates totals, and Undo restores exactly that entry.
- Switching accounts cannot reveal another person's food records. Sharing a workout does not include meals. Export/restore round-trips units, unknowns and record dates.
- No meals logged shows an empty state; partial nutrients show coverage; no target means no invented percentage.

## 4I. Meal and supplement reminder requirements

**User-requested schedule:** applies to cvamsik99@gmail.com only, in **Asia/Kolkata (IST)**. Other users may create their own schedules; this routine is not a global default. “Monsay” is interpreted as Monday. Zinc at noon is interpreted as daily; these assumptions remain editable.

| Reminder | Time (IST) | Repeat | Display / action |
| --- | --- | --- | --- |
| Vitamin B12 | 8:00 AM | Every Monday | “B12 reminder”; mark Taken, Snooze or Skip |
| Zinc | 12:00 PM | Daily | “Zinc reminder”; mark Taken, Snooze or Skip |
| Lunch | 2:00 PM | Daily | “Time for lunch”; open lunch food capture or mark reminder Done |
| Omega-3 | With lunch, initially 2:00 PM | Daily | “Omega-3 with lunch”; separate Taken state in the lunch reminder group |
| Snacks | 6:00 PM | Daily | “Time for a snack”; open snack food capture or mark reminder Done |
| Dinner | 8:00 PM | Daily | “Time for dinner”; open dinner food capture or mark reminder Done |
| Magnesium | 10:00 PM | Daily | “Magnesium reminder”; mark Taken, Snooze or Skip |

These are the user's supplied routine, not dosage recommendations. The app must not invent doses or units. Store an optional user-entered product/dose note. Supplement reminders are now in scope; automatically recommending supplements remains deferred.

### Reminder experience

- Today includes generated occurrences in the daily agenda; Health provides a quiet Manage reminders link. Notification click opens the corresponding food capture or supplement reminder, not a blocking full-screen overlay.
- Group Lunch and Omega-3 into one notification to reduce noise, with independent completion controls. Link Omega-3 to the configured lunch reminder: editing lunch time moves the linked reminder. If lunch is logged early or late, keep its Omega-3 Taken/Skip status visible; do not infer that the supplement was taken.
- Offer Snooze 10 minutes / 30 minutes, Done/Taken, Skip today, and Edit schedule. Show actual completion time and distinguish Scheduled, Due, Snoozed, Done/Taken and Skipped. Completion can be undone to correct an accidental tap.
- Acknowledging a meal reminder does not fabricate a food log or calories. A supplement Taken action does not add nutrients to dietary totals without separately entered, validated supplement composition and quantity; that nutrient integration is deferred.
- Do not repeatedly interrupt for missed items. On return, show overdue reminders in the checklist. B12 is due only on Monday; an unacknowledged Monday reminder appears as that dated missed occurrence, not as a new Tuesday dose.
- Settings exposes each schedule, its recurrence, timezone and enabled state. Reminder configuration and history are private, included in backup/restore, and never shared by default.

### Timing and delivery contract

Calculate occurrences from calendar date, local time and IANA timezone. B12 means Monday at 08:00 IST, not an interval of 168 hours from the last acknowledgement. Midnight/reload and changing device timezone do not shift this saved IST routine. Each occurrence has a stable ID derived from account, reminder ID and scheduled instant; retries, multiple tabs/devices and snoozes must not create duplicate occurrences or completion records.

Keep the existing in-app reminders usable, but do not promise exact background delivery from a JavaScript timer. Notifications when the site is closed require an explicitly enabled web-push subscription, a server scheduler, and service-worker notification handling. Request notification permission only when the user chooses Enable notifications. Keep subscription endpoints private; avoid putting meal or supplement details on a lock screen unless the user opts in to detailed notifications.

Show **In-app only**, **Notifications enabled**, **Permission denied**, or **Delivery unavailable** truthfully. If permission, browser support or push service is unavailable, the checklist and in-app reminders still work and setup explains the limitation. System/browser delivery can be delayed; do not label an unconfirmed delivery “received.” Quiet hours must show any conflict with the explicitly requested 10:00 PM Magnesium reminder and allow an explicit per-reminder exception; never silently discard it.

Reminders do not alter the protected timetable or count as work. Lunch at 2:00 PM and dinner at 8:00 PM align with the existing protected meal periods. Snacks at 6:00 PM remain a personal reminder during family time, not a new study block. Magnesium remains accessible even if the optional bedtime/rest view is active.

### Acceptance checks

- The owner's seven configured reminder items use the exact times and recurrences above; another account receives none of this personal routine automatically.
- On Monday, B12 becomes due at 08:00 IST once; on Tuesday, no new B12 occurrence is generated. Daily items appear once per local date.
- Lunch/Omega-3 notify as one group; marking Lunch done leaves Omega-3 pending until independently Taken or Skipped.
- Snooze postpones the same occurrence; refresh, offline/reconnect and concurrent tabs do not duplicate it. Editing the recurring schedule does not rewrite past completion history.
- Meal completion without a food record leaves nutrient totals unchanged. Supplement completion stores no invented dose or nutrient amount.
- Denied permission leaves a functioning checklist and accurate delivery label. Supported opt-in push deep-links to the right item and is checked on a real authenticated device before closed-site reminders are claimed.
- At 22:00 IST, Magnesium is visible despite bedtime UI or quiet-hour configuration; the user can complete, skip or snooze it without being trapped.

## 5. Shared UX rules for every feature

One main landmark and one main heading per page. One obvious primary action; use progressive disclosure for detail. Calm light/dark surfaces, readable hierarchy, consistent spacing and units. All buttons/links respond, and all dialogs close without leaving invisible blocking layers.

Minimum 44px targets, 16px mobile inputs, persistent labels, keyboard operation, visible focus, accurate screen-reader state, reduced motion and usable contrast. Verify 320/390/768/1024/1440px. Long titles/URLs/food names wrap; docks do not strand controls; modal content scrolls inside the viewport.

Forms retain draft values on failure. Show Saving, Saved locally, Synced, or Failed with retry truthfully. Offline work remains usable where supported. Empty, loading, not-found and unauthorized states provide a next action. Destructive actions use specific confirmation or Undo according to impact. Charts include units and text summaries.

Timers use timestamps, paused duration and one authoritative `work:active` session record; legacy focus/study keys remain compatibility mirrors. Route changes, sleep, reload and midnight do not duplicate completion or create false work. Normal navigation is not intercepted merely because focus is active; optional stricter protection requires explicit opt-in and a visible exit. Audio break does not pretend to control an external tab.

## 6. Personal rules that must survive the redesign

- The software-developer-bible timetable overlay applies **only to cvamsik99@gmail.com**.
- **10 focused hours on each weekday; 4 focused hours on each Saturday and Sunday.** Breaks, meals, family time and dinner stay outside the focused total.
- Preserve source alignment, owner-specific dates, planned block classification and schedule editing rules; other accounts keep their own plans.
- The Motivation page uses the account's saved goal and country. Do not hard-code Germany for every user.
- Completed timers, elapsed schedule blocks, logged meals and checked milestones are distinct facts. Never substitute one for another.
- Existing authentication, ownership and sharing boundaries remain in force. Any migration needs a backup, validation and readback.

## 7. One release backlog, in delivery order

| ID | Deliverable | Depends on | Done when |
| --- | --- | --- | --- |
| C01 | Finish/review existing local reliability, Audio break and Motivation changes | Existing patch | Regression suite green; reviewable diff; authenticated live clicks verified after deployment |
| C02 | Final shell, five destinations, module toggles, aliases and search | C01 | Every module reachable on phone/keyboard; old URLs work; enabled/disabled state persists |
| C03 | Simplify Today and Plan, tasks/goals/timetable | C02 | One next action; core task flow works; 10h/4h owner rule passes; no duplicate summaries |
| C04 | Nutrition domain, manual daily log, saved foods and targets | C02 | Calculation/unknown/unit/date tests and manual CRUD pass; backup/account isolation integrated |
| C05 | Recipes and FoodData Central search/details | C04 | History snapshots stable; provider faults safe; source attribution and serving conversion tested |
| C06 | Unified Health: food, hydration, body, movement, optional recovery, meal/supplement reminders | C03–C05 | Shared records feed Health/Today once; the seven-item IST reminder routine and snooze/history checks pass; real push delivery tested where enabled; fasting remains optional |
| C07 | Consolidated focus/study, recall, optional protection and bedtime | C02–C03 | Session route/reload/background behavior correct; skip/cancel/navigation always recoverable |
| C08 | Review, quick capture and optional lightweight habits | C03–C07 | Daily/weekly views agree with source logs; no invented scores; reflection/history reachable |
| C09 | Library, Sharing, Settings and entry/onboarding polish | C02, C04 | Data tools cover all modules; privacy/access/defaults preserved; obsolete choices removed |
| C10 | Whole-site visual, accessibility and release verification | C01–C09 | Full suite/build/lint/typecheck pass; authenticated mobile/desktop journeys observed; rollback recorded |

Food is a first-release requirement, not an indefinite future enhancement. Manual logging ships without waiting for an API key; live database search requires the provider key configured on the server. Do not use a demo key as a production substitute or fabricate search data when the provider is unavailable.

Detailed implementation plans should reference these IDs and this sheet; they must not silently expand scope. Execute inline with focused review checkpoints. No new dependencies or external paid provider is assumed.

## 8. Data integrity and release gates

Inventory every persisted key before release. The current backup key list must be audited against focus, roadmap/timetable, hydration and all other active stores, not just extended with nutrition; passing old backup tests is not proof of complete coverage. Keep imported-file validation, version handling, pre-restore snapshots and scoped deletion explicit.

Use domain tests for nutrition basis/units/missing values/recipes; browser tests for capture, reload, offline/retry, deletion Undo, responsive controls and private-account flows. Test server search validation and provider failure without contacting a real service for every run. Verify real deployment provider connectivity once credentials are configured.

Full journeys:

1. Sign in → see Today → add/finish task → open plan → start/pause/resume/end work → take Audio break → return → review actual progress.
2. Log a meal → change portion → add recipe → view known macros/micros → log water/workout/weight → inspect daily/weekly summary → undo removal.
3. Read Motivation → open the relevant plan → save a reminder → refresh → find it again without unrelated clutter.
4. Work offline → see accurate local-save status → reconnect → resolve sync safely; switch accounts → verify isolation.
5. Export → validated restore → compare records; test share/revoke/access; update app/service worker → navigation still responds and records remain.

Release only after the actual deployed authenticated flows pass. Record test count, screenshots, skipped checks, provider configuration and rollout/rollback commit. Preserve backups and user data during cache cleanup.

## 9. Implementation and release boundary

The user approved implementation of this scope. The local application now includes the reorganized navigation, manual/recipe nutrition workflows, optional recovery/habits, owner-only routine defaults, consolidated recall, and optional rest/guard controls. No calorie target, supplement dose or meal history has been invented. Notification permission remains an explicit user choice.

Local auth-open tests validate browser behavior and data handling; they do not prove deployed authentication, cloud migration execution or closed-site push delivery. Follow [Nutrition and reminder setup](NUTRITION_AND_REMINDER_SETUP.md) for provider configuration, database migrations, scheduler setup, account checks and rollback. The production release remains pending those gates.

### Latest local evidence — 4 October 2026

Final production-build Chromium suite: **204 passed**. Domain/storage tests: **15 passed**. TypeScript, lint, production build and diff whitespace checks passed. Phone/light and desktop/dark visual review removed empty Food sections and collapsed Today's detailed study schedule/checklist. Authenticated cloud, configured provider search and closed-site notification delivery remain pending. See the [implementation plan](superpowers/plans/2026-10-03-complete-personal-tracking.md) for detailed evidence and outstanding gates.

## Final scope audit — 4 October 2026

The additional audit completed task deletion/cleanup undo, task date editing, selected-task focus, one authoritative work-session controller, cross-page study controls, study completion deduplication, Review's learning/water/movement/body records, compact routine summaries, Library naming, a direct goal-to-Motivation link, calendar-boundary consistency, provider retrieval provenance and phone editor layout recovery. Latest main's Bible curriculum and resume changes were retained.

Final verification against the integrated production build: **215 Chromium tests passed** (2.3 minutes), **17 nutrition/storage/session tests passed**, and **18 curriculum/sync tests passed**. TypeScript, ESLint, production build, Bible snapshot validation (100 days / 556 chapters) and staged diff whitespace checks passed. No production credentials were added; authenticated migration, cloud/offline and real-device push gates remain pending. The scope-to-code map is in [NOVA_IMPLEMENTATION_AUDIT.md](NOVA_IMPLEMENTATION_AUDIT.md). Commit/push history on `fix/click-interactions` is the source of submission evidence.

## Progress workspace extension — 4 October 2026

The latest request expands the overview into a main Progress destination at /dashboard. Include weight and saved target; daily calories/macros and full micronutrient coverage; exercise days/sets/repetitions/known load/duration; water, sleep and completed fasting; separate focus and study; tasks, current-goal milestones, routine and habit completion records. Support 7/30/90-day ranges, ending-date and period navigation, accessible charts and daily readings, and direct entry/edit actions. Missing values remain unknown; partial nutrient totals must be labeled. Existing /review remains the detailed reflection route. No new inferred targets, readiness scores, exercise calories or supplement nutrient estimates.

Superseded by the approved daily-life structure below: detail pages use a contextual back link and local views; automatic section tabs, clocks, action bars and seven-day summaries are removed. Plan defaults to day/week scheduling; focus setup opens for selected work. Body and weight must support dated corrections, removal/undo, independent target editing and calendar-spaced charts; preserve previous recovery observations without calculated readiness claims.

## Workspace workflow completion — 4 October 2026

Tasks now offers name search, combined priority/tag filters and a single clear action; optional new-task metadata stays behind Task options. Today completion counts actual completion timestamps for today plus pending tasks due by today, excluding previous-day completions. Filtered empty states distinguish no matches from an empty day. Task and milestone names retain readable space on phones while their touch controls wrap beneath them.

Goals replaces the repeated story and score panels with the next saved milestone and completion count. Its 30-day metric chart uses dated readings with gaps for missing days. Progress includes dated goal-metric readings (including explicitly recorded zero) and nonempty journal-day coverage in the selected range, with direct journal access. Secondary pages return to Plan, Health, Progress or More according to the existing navigation route map; stored record formats and reminders remain unchanged.

Local QA captures: artifacts/ui-ux/completion-{todo,goal,dashboard}-{390-light,1440-dark}.png. Reviewed populated mobile Tasks and Goals after fixing squeezed row names. Production authentication, provider/migration configuration and real-device notification checks retain their existing separate release gates.

Verification: **231 Chromium regression tests passed (2.6 minutes)** and **25 domain/storage tests passed**. Final production rebuild, TypeScript and ESLint passed; **12 focused browser tests passed** after the journal copy/filter styling cleanup. Regression scenarios cover combined filters without record mutation, today's completion timestamps, contextual back links, journal and zero/missing goal readings, mobile text widths, persisted goal logging and milestone CRUD. Auth-open local checks do not establish live deployment or external service readiness.

## Approved daily-life restructure — 4 October 2026

The user selected “Run my day: work, meals, exercise and reminders together” and approved the [complete design](superpowers/specs/2026-10-04-daily-life-ux-restructure-design.md). This section supersedes earlier five-destination, dashboard-first and always-mounted focus/capture descriptions. Existing records and routes are preserved.

- Today projects saved time blocks, owner/saved timetables and recurring meals/supplements into one agenda, with neutral earlier/complete states. Owner blocks remain 10h weekdays / 4h weekends in IST; source days are translated into the selected calendar timezone. Water is one action with undo; weight opens in one action; recent food takes three actions from Today: Food, select food, Save after reviewing the portion (typing excluded).
- Plan provides day/week scheduling, exact task references, conflict preview with explicit override, remove/undo and three optional priority references. Task backlog adds Schedule and batch reschedule preview. Focus starts on demand; a single cross-page session bar resumes its exact task and provides Finish/Cancel. Finishing never silently completes a task.
- Global Add and standalone /log share single-type dated forms. Weight/recovery corrections retain notes and other recorded fields. Food portion snapshots stay independent from reminder states. Health shows direct daily records/history; food separates Diary/Saved/Nutrients, repetition opens portion/date review; workouts move setup/history behind disclosures and offer a factual finish summary. Body keeps optional target configuration after entry.
- Goal configuration is on demand; tasks may reference milestones. Learning source policy and optional career resources are secondary. Progress opens compact summaries and explores one metric at a time; date/range/view deep links persist, with /review as the Reflection alias. Settings has Profile/Modules/Notifications/Work/Data; old hash links open their intended section. Routine separates Schedule/History/Notifications and requires preview/confirmation for schedule edits, retaining past history.
- Legacy bookmarks, source evidence, Bible snapshot, local migration/storage behavior, public portfolio and resume remain covered. Removed UI components do not delete their backing records.

Planning collections are `plan:blocks` and `plan:days`, account-scoped with timestamp merges, deletion tombstones and validated backups. Migration 0009 extends the existing owner-only merge allowlist without resetting data. In configured Supabase builds, planning mutation controls remain disabled until `NEXT_PUBLIC_DAILY_PLAN_ENABLED=true` is deliberately enabled after signed-in, multi-device/offline tests. Local auth-open coverage cannot prove that gate. See [setup and rollback](NUTRITION_AND_REMINDER_SETUP.md).

### Daily-life release verification

The complete regression run passed **244 browser tests**. All **52 library/domain tests** passed, including explicit rollout gating and cross-calendar timezone collisions. The final focused journeys were rechecked after the gate and calendar safeguards. TypeScript, ESLint and the production build passed; Bible validation matched 100 days / 556 chapters and the 7 generator plus 11 sync/seed tests passed. Populated 390px light and 1440px dark views were reviewed; the full matrix covers 320/390/768/1440px in both themes.

These are local, auth-open checks. No production SQL, provider credential, authenticated device verification or delivery activation is claimed. The build flag keeps signed-in planning edits closed until the documented migration/cloud gates pass.

### Mobile capture follow-up — 2026-10-04

The mobile Add action now carries the selected calendar date and originating page/query into capture. Saving a record from a historical Plan day keeps that date, and Return restores the original day/week view. A browser regression reproduced the wrong-date save before the fix and passes after it. All 14 daily-life browser journeys, ESLint and the production build passed for this follow-up. Production/cloud activation gates above remain outstanding.

### Navbar simplification — 2026-10-04

The personal header now shows the four primary destinations, Add and More. Study Bible, Tools, account/settings, search, keyboard shortcuts and theme switching are grouped inside the More menu. Account sign-in/sign-out remain in Settings; keyboard shortcuts and the public portfolio header retain their existing behavior. The menu uses the existing accessible dropdown primitive, 44px touch targets and keyboard dismissal with focus restoration.

Validation: production build and ESLint passed. The focused navigation/search/service-worker/daily-life run passed 57 checks; its new theme test initially assumed the wrong default theme. With an explicit light starting state, all four new navbar checks passed, covering 320/768/1440px, menu-to-search navigation, theme changes and Escape focus restoration. Desktop and 320px header/menu screenshots were reviewed. Cloud activation gates remain unchanged.

### Daily workflow hierarchy — 2026-10-04

After feedback that the navbar change was insufficient, Today now puts dated recording controls before the long agenda. The desktop agenda has a separate task rail, while phone layouts retain a single column. Empty Today task panels are omitted; Plan and Add still provide task creation. Time zones and reminder administration move into a secondary disclosure. Chapter headers are smaller and Today drops its redundant introduction. Desktop agenda actions sit alongside their records rather than extending every row vertically.

Health logging actions now live beside the matching food, exercise, body and sleep records; the separate duplicate shortcut row is removed. Dated capture and return navigation, water Undo, existing records and clock behavior are preserved. See [refinement design](superpowers/specs/2026-10-04-daily-workflow-refinement.md).

The first broad run passed 250 browser checks and exposed one old test clicking a now-disclosed reminder link. After adapting that test to the intended interaction and completing Health, all 66 final focused checks passed, including 320/390/768/1440px light/dark route layouts, date/return navigation, clock midnight/DST, water Undo, task capture and reminders. Production build and ESLint passed. Populated Today and Health screenshots were reviewed; the screenshot audit covered six workspaces at phone/desktop sizes without horizontal overflow. This is local verification; production cloud gates remain outstanding.

### All personal pages refinement — 2026-10-04

Applied the approved daily-workflow hierarchy throughout the personal site. Shared headers now have one title and an inline back/context row, with explanations in an About this page disclosure. Goal separates Purpose/Milestones/Metric; Learning separates Current Study/Curriculum/Revision; workouts separate Session/History/Plan and keep set-entry controls immediate; Water separates hydration from eating-window setup and history. Progress summaries are compact on phones. Library starts with retrieval and uses a focused Add modal; discarding a draft clears the next capture. Login retains a validated intended destination. The personal introduction no longer uses fabricated demo scores, and Sharing/Inbox drop decorative framing.

Workspace views preserve query context and survive reload. Food and workout date changes persist; finishing a workout returns to its originating workspace. Today, Plan, Health, Body, recovery, Reflection, capture, Routine, Settings, Tools, sharing and legacy aliases retain their existing record and navigation contracts under the common shell. Public portfolio/resume files and external Bible content remain preserved. Only two excluded-file inventory counters were refreshed in the Bible snapshot; all timetable days, chapters, study minutes and source digest remain identical.

See [route-by-route decisions](superpowers/specs/2026-10-04-all-personal-pages-refinement.md). Local verification: **264 Chromium browser checks passed**, including all-page workflows, layout/theme widths, evidence, dated capture, navigation and persistence. Bible validation matches 100 days / 556 chapters and all 18 generator/sync/seed tests pass. Production build and ESLint pass. Populated screenshots cover 34 route/views at 390px light and 1440px dark without horizontal overflow; mobile routes and representative desktop workspaces were visually reviewed. Final focused verification after the Inbox copy/context cleanup is recorded below.

These are local auth-open checks. Existing production SQL/provider, authenticated multi-device and real-device notification gates remain pending in NUTRITION_AND_REMINDER_SETUP.md.

Final follow-up: **62 focused browser checks passed** after the Inbox banner and Learning URL-context cleanup. The final build, TypeScript, ESLint and whitespace checks passed.


### Food and recipe repair — 7 October 2026

Recipes now have a functioning ingredient-first path: Add saved food creates an ingredient without adding a meal; missing ingredient selection reports an actionable error; quantity begins from the selected basis; Log recipe and quick capture review one serving rather than the full serving-based batch. Edits preserve historical meal snapshots. Food/recipe/target sync failures are included in the visible status. Search errors are visible beside the controls and cleared before a new product load.

USDA Foundation food calories now recognize 1008/2048/2047 in order, preserve explicit zero and ignore malformed nutrient rows. No calories are inferred from incomplete macros. Live USDA search remains blocked by missing production provider configuration (503); a tested public alternative also returned 503 and was not introduced as an unverified fallback.

Verification: five new regressions were reproduced before their fixes; all 45 focused nutrition/workflow checks passed. The full run passed 268 checks and found one unrelated Progress test assuming October 4 without a frozen clock. After freezing its intended fixture date, all nine Progress checks passed. Production build, TypeScript, ESLint and whitespace checks passed. Local tests do not prove signed-in cloud migrations or activate provider configuration.

User confirmed Android Health Connect / Google Fit. The [native companion design](superpowers/specs/2026-10-07-android-health-connect-design.md) covers read-only weight/steps/sleep permissions, account/device pairing, source attribution, deduplication, offline recovery and revocation. Native app, ingestion endpoints, migration and real-phone sync remain unimplemented pending this new platform design review; the food repair does not claim a Health Connect connection.


## Nutrition enhancement checkpoint — 7 October 2026

Implemented multi-food durable drafts, richer recipes with cooked weight/servings, dated manual/flexible programs, explicit day-quality review and 7/30/90-day coverage-aware insights. Backup/restore includes programs, reviews and optional recipe metadata. Health → Connections adds expiring pairing approval, device status, separately stored source records and explicit revocation. The Android foreground companion is compiled and locally tested.

The full MacroFactor-level target remains in progress. Prepared batches/templates, provider coverage/offline catalog and declared portions, validated guided coaching/check-ins, capture assistance and the complete imported-record lifecycle remain requirements. Production database/cloud/device gates are listed in [delivery setup](NUTRITION_AND_REMINDER_SETUP.md); a merged bundle is not evidence those gates passed.
