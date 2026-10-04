# NOVA product redesign — proposed design and delivery roadmap

Status: ready for user review; broad redesign implementation has not started.

## Purpose and scope

Redesign personal.buildora.work around planning the day, doing focused work, and reviewing progress. Keep health, private notes, and sharing available without crowding daily work. This covers the personal application and its login/entry screens. The public portfolio remains a separate product; shared primitives receive compatible fixes, but this proposal does not rebuild buildora.work or study.buildora.work.

Preserve existing records, account boundaries, shared permissions, and bookmarked routes. Keep the software-developer-bible alignment and 10 focused hours on weekdays / 4 hours on each weekend day exclusively for cvamsik99@gmail.com. Other accounts retain their own schedules. Breaks do not count as focused work.

## Approaches considered

1. **Recommended: redesign journeys in the existing application.** Replace the navigation and page hierarchy, consolidate duplicate surfaces, and reuse proven storage/domain logic. Deliver independently testable phases. This changes the experience substantially while preserving data and allowing rollback.
2. **Visual refresh only.** Faster, but leaves competing study/focus screens, hidden core features, and confusing enforcement flows. Insufficient for the reported problems.
3. **Full application rewrite.** Greatest architectural freedom, but introduces migration risk and delays usable improvements. Current evidence does not justify replacing working authentication and data models.

## Evidence and limits

- Primary navigation currently prioritizes Today, Focus, Log, Sharing, and More; Tasks and Roadmap are buried under More despite being central daily activities.
- StudyBreakLoungeModal contains roughly 1,000 lines combining recommendations, hidden playback, recall questions, timer, and a full-screen shield. Its play action sets local stream state rather than opening its existing YouTube Music URL.
- Playback uses a hidden youtube-nocookie iframe; the UI claims audio is active without receiving player confirmation. Existing video IDs and episode descriptions are not verified destinations.
- The distraction blocklist contains youtube.com and the default allowlist has no music.youtube.com exception. A new external flow must resolve that conflict explicitly.
- Multiple study/revision surfaces exist: DeepStudyCockpitModal, RevisionDeckModal, FullPageRevisionGate, and the lounge recall screen. These should become one study journey and one review journey.
- Existing uncommitted reliability fixes address modal backdrop dismissal, visible focus cancellation, timer expiration away from Focus, and stale service-worker router responses. All 192 local Chromium browser checks pass. The authenticated live click issue remains unconfirmed; local test success is not production verification.

## Proposed information architecture

Use five persistent destinations on desktop and mobile: **Today, Plan, Focus, Review, More**. Desktop uses a restrained sidebar; mobile uses a labeled bottom bar. The current page is clear in both. No second competing navigation rail.

- **Today:** local date/time and sync status; next scheduled block; one primary action to start or resume; top three tasks; compact progress; quick logging. Show detailed timetable on demand. Distinguish planned minutes, completed focus minutes, and elapsed clock time.
- **Plan:** Tasks, Roadmap, and Goals as three explicit sections. Deep links continue to work. Roadmap presents Today, Curriculum, and Timetable; review is reached through Review. Applications, proof work, coding, and mock preparation remain visible in the existing career schedule rather than gaining another dashboard.
- **Focus:** one session workspace with topic, duration, start/pause/resume/finish/cancel, useful resource links, and access to Audio break. A visible status strip persists across routes. Leaving a page does not silently block navigation or end a session.
- **Review:** daily log and due recall in two clear tabs. Completed sessions retain provenance; a timer finishing does not claim a chapter was learned. Existing /log remains a usable entry point.
- **More:** Health (weight, hydration, fasting, workouts), Library (Archive), Sharing (outgoing and shared-with-me), and Settings. Preserve all existing routes and records.

## Feature decisions

| Existing area | Decision | Result |
| --- | --- | --- |
| Today / tracker landing / hub | Consolidate | One daily overview; legacy entry routes resolve predictably |
| Tasks | Keep and elevate | Fast capture, priority, due date, completion, undo; no duplicate task queue |
| Goals | Keep, simplify | Milestones linked to plan; remove repetitive motivational panels |
| 100-day roadmap / career curriculum | Keep and redesign | Clear day progress, source links, next action, owner-specific timetable |
| Focus sprint / study cockpit | Consolidate | One session controller and workspace; preserve session history |
| Revision deck / full-page recall gate | Consolidate | User-initiated due review with reveal, self-rating, skip, and exit |
| Audio lounge | Replace | Small external podcast launcher plus optional break timer |
| Distraction shield / mobile barriers | Rework | Explicit opt-in, explain scope, visible pause/exit; no guilt-based confirmation |
| Bedtime / night curfew | Rework | Optional reminder and rest screen, with exit; no default forced lockout |
| Log | Keep | Quick entry, clear save state, editable history and validation |
| Weight / hydration / fasting / workouts | Keep under Health | Shared navigation and consistent input units; calculators/rest timers remain contextual |
| Archive | Keep as Library | Search/filter, readable detail, reliable copy, undo removal |
| Sharing / shared-with-me | Keep under More | Clear owner/access labels, revoke/share flows, privacy preserved |
| Clock | Keep compact | IST/account timezone explicit, accurate midnight and daylight-saving behavior |
| Command palette / shortcuts | Keep | Consistent destination names; discoverable shortcut help |
| Device preparation | Simplify | Optional checklist; describe actual browser capabilities accurately |
| Sync / account / data tools | Keep and strengthen | Visible saving/offline/error/retry states; preserve unsaved entries |
| Rank badges, fake equalizers, hidden video, blackout shield, lounge trivia | Remove from UI | Eliminate misleading playback and unrelated break complexity |
| Repeated stats/cards/motivational copy | Remove duplicates | One authoritative presentation for each metric |

“Remove” means remove the presentation or redundant mechanism, not erase stored records. Any data schema change needs a separate migration with backup and readback verification.

## Audio break behavior

Rename the entry to **Audio break** and heading to **Listen on YouTube Music**. Show three concise choices with podcast name, topic, and one external-link action. Default recommendation: Syntax for web/full-stack work; Software Engineering Daily for systems/database work; The Changelog for tooling/open source. Match the selected study topic with deterministic categories; default to Syntax when no topic is available. Let the user choose another recommendation.

Syntax's own description supports its full-stack focus: https://www.syntax.fm/about. The Changelog describes developer interviews and open-source coverage: https://changelog.com/. These establish relevance, not YouTube Music availability.

Use https://music.youtube.com/search?q= plus an encoded podcast title and relevant topic until a real podcast/episode destination is verified. Label it **Find podcast on YouTube Music**, never “Play” or a claimed exact episode. Clicking is a native anchor opening a new tab with rel="noopener noreferrer". Do not start asynchronous work before opening. Do not autoplay, embed, imitate playback, or claim to control the external tab.

Permit the exact hostname music.youtube.com through the in-app distraction interceptor for the approved break flow, including existing saved blocklists. Do not broaden the exception to youtube.com or unrelated subdomains. Explain that NOVA cannot lock or monitor another site.

Optional 5/10/15-minute break timer has explicit Start, Pause, Resume, Reset, and End break. Opening the podcast does not silently start the timer. Use timestamps and accumulated paused duration so background tabs/sleep do not slow time. On return, show actual remaining time or Break finished. Preserve the active study session; offer a clear Resume study action. Timer completion does not force navigation or claim the podcast stopped.

The chooser uses the shared accessible dialog: initial focus, trapped tab order, Escape/backdrop close, restore trigger focus, body-scroll restoration, and only one active modal. Closing it never leaves an invisible click barrier. All entries on Today and Roadmap use the same chooser.

## Visual and interaction contract

Use a calm workspace: warm neutral backgrounds, teal accent, strong readable text, restrained borders, consistent 8px spacing rhythm. One page heading, short subtitle, one primary action per screen. Use typography to establish hierarchy; remove uppercase diagnostic copy and decorative status claims. Support existing light/dark preference.

Controls have a minimum 44px target; mobile input text is at least 16px. Forms have persistent labels, inline error text, and retained values after failures. Save actions show pending, saved, or failed with retry. Destructive actions have clear confirmation or undo according to impact. Loading, empty, offline, unauthorized, and error states explain the next action. Status does not depend on color alone.

At 320, 390, 768, 1024, and 1440px: no horizontal page overflow, dock covers no controls, dialogs fit the viewport and scroll internally, tables become readable stacked rows where needed. Keyboard access, visible focus, screen-reader labels, reduced motion, and contrast are release requirements. Avoid full-screen overlays for ordinary navigation or logging.

## Delivery sequence and affected boundaries

Each subsystem receives a detailed implementation plan after this product design is approved. Execute inline with review checkpoints.

1. **Reliability and Audio break.** Finish the existing regression patch; replace StudyBreakLoungeModal; isolate recommendation data in src/lib/study-audio.ts; update distraction-shield policy and RoadmapTodayCard/roadmap entry points. Add external-link, modal cleanup, saved-blocklist, timer background, and active-session preservation checks. Gate: every lounge action opens the intended host or changes a truthful local timer state.
2. **Application shell and navigation.** personal-nav.ts, PersonalShell, TrackerNavDock, command palette, More, login/entry. Keep route compatibility. Gate: every destination reachable on keyboard/mobile, active state correct, authenticated/anonymous navigation verified.
3. **Today and Plan.** hub, todo, goal, roadmap, DailyTimetable and daily summary components. Consolidate repeated panels; reuse current storage. Gate: plan changes appear consistently, schedule override is owner-only, clear distinction between planned/completed/elapsed work.
4. **Focus and Review.** FocusSprint, LockdownGate, study cockpit, revision surfaces, motivation and log. Shared session state owns timing; page components display it. Gate: one completion per session, route changes/reloads safe, cancel never creates false completion, skip/exit always available.
5. **Health, Library, Sharing, Settings.** Redesign the remaining existing pages using the same shell, forms, feedback, and responsive rules. Gate: existing CRUD, units, access control, export and saved preferences remain correct.
6. **Release review.** Run lint, typecheck, build, relevant domain tests and full Playwright suite; capture light/dark desktop/mobile screenshots; verify authenticated production workflows after deployment. Record evidence and rollback commit. Do not delete data to clear caches or resolve UI issues.

## Acceptance and review

The redesign succeeds when a returning user can see the next task, start work, take a podcast break, resume, log progress, and find secondary tools without competing screens or unexplained blocked clicks. Verify those journeys end to end, including refresh, offline/retry, background timers, and deployment cache upgrades.

The current 192-test result is a baseline, not a permanent acceptance count. Update tests when approved semantics change; preserve meaningful behavior checks rather than old decorative text. Production sign-in and the exact previously failing authenticated control require live validation and remain open until observed.

Review decisions: approve the five destinations and the feature table; confirm optional focus/bedtime enforcement replacing forced barriers; approve the external YouTube Music search fallback. The detailed code-level plans follow approval of these product decisions.


## Subsequent user direction — motivation route

The user explicitly requested removing unnecessary sections and making /motivation entirely inspiring toward their goal. The route now follows docs/superpowers/plans/2026-10-03-goal-motivation.md: saved goal as the sole main heading, category-specific original encouragement, next milestone and one plan action. Timers remain on Today, journal capture remains in Log, and saved/personal reminders are on demand. This supersedes the earlier proposal to treat /motivation as the focus session workspace; the broader five-destination reorganization remains a later phase.


Consolidated scope: [NOVA change sheet](../../NOVA_CHANGE_SHEET.md). The sheet resolves navigation/scope differences and adds the requested food tracker; this document remains the historical design or delivered phase record.
