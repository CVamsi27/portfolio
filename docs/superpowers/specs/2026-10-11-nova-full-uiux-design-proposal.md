# NOVA: full personal workspace design proposal

**Scope:** all user-facing pages on personal.buildora.work.
**Status:** Approved by the user on 11 October 2026. Shared shell and Today pilot implemented and verified locally; remaining workflows follow the checkpoint sequence below.
**Date:** 11 October 2026.

## 1. What the design must accomplish

NOVA helps two approved users run their day, develop their career, record health information, and review their progress. The interface should make the current action, its context, and its result easy to understand. The primary experience is doing and reviewing real work; every visible section must serve that purpose.

The user requested a proper design plan before further UI changes and approved this design packet. Earlier Sharing revisions remain separate uncommitted experiments; use the approved Open agenda system as the implementation reference. Deployment remains a separate step after workflow verification.

This proposal establishes the shared system and page-level workflows together. It does not change the two-account Google access policy, saved-data contracts, learning curriculum, timetable allocations, evidence-based completion, nutrition calculations, reminder schedules, or public portfolio.

### Evidence and diagnosis

Reviewed the current navigation code, shared shells, design tokens, route inventory, consolidated change sheet, and captured Sharing phone/desktop/dialog states. Findings from those sources:

- Mobile navigation contains five destinations plus Add, while the top bar also offers capture. Controls consume space and compete with page actions.
- The change sheet and current interface disagree on Roadmap placement and Tools/More naming. The proposed system below makes those choices explicit.
- Counts, storage guidance, badges and explanatory chrome often occupy the same visual tier as the content people came to use.
- Repeated cards, pill controls and action rows lack a common rule for when they are necessary.
- Creation, local saving, cloud sharing and copying a link need clearer action boundaries.
- Permission editing inside a note makes the surrounding list harder to scan. The recent dialog experiment improves isolation, but does not establish a complete product design.
- Overflow and browser checks are useful verification; they do not judge composition, hierarchy or visual quality.

Other routes require representative rendered review before their designs are finalized. Their workflow requirements below come from the existing product scope and code; this proposal does not claim every existing screen has been visually audited.

## 2. Directions considered

| Direction | Structure | Benefit | Tradeoff |
| --- | --- | --- | --- |
| **Calm daily workspace — recommended** | Stable navigation, clear page title, one contextual action, readable agenda/list/log, details opened when needed | Supports daily work, career study and health on both phone and desktop | Requires replacing inconsistent page patterns, not just changing colors |
| Dense desktop workbench | Compact tables, multiple persistent panels, extensive visible controls | Efficient for long career-planning sessions | Phone adaptation becomes a separate design; everyday capture is harder to learn |
| Content-led dashboard | Large summaries and overview cards with drill-down navigation | Easy to browse an overview | Adds an extra step to logging and executing work; encourages repeated statistics |

Selected direction: **Open agenda**, the first displayed image in the second ideation set, chosen by the user on 11 October 2026. This resolves the direction to a spacious left rail, a calendar ribbon, grouped rows and details opened inline. The earlier Weekly rhythm image inspired exploration but is not the selected target. The other alternatives are not implementation references.

### Selected visual and approved extensions

| Reference | Decision | Use |
| --- | --- | --- |
| [Desktop Today](assets/2026-10-11-nova-open-agenda/today-desktop-selected.png) | Selected by the user | Authoritative composition, palette, row spacing and navigation direction |
| [Mobile Today](assets/2026-10-11-nova-open-agenda/today-mobile-proposed.png) | Approved adaptation | Calendar strip, inline details and five-destination dock |
| [Desktop Sharing](assets/2026-10-11-nova-open-agenda/sharing-desktop-proposed.png) | Approved adaptation | Content-first collection, inline preview and on-demand creation |
| [Desktop Food](assets/2026-10-11-nova-open-agenda/food-desktop-proposed.png) | Approved adaptation | Dated meal groups and compact known-nutrient summary |

These are generated design references with illustrative records. They are not browser captures or proof of working interactions. Desktop targets are 1440×1024 and mobile is 390×844; generated raster dimensions are approximate. Use the layout contract below at the actual CSS viewport sizes, rather than inferring CSS pixels directly from the raster.

The approved extensions continue the selected direction; they are not another numbered selection set. All remaining page designs inherit this system and the workflows in section 6. Before implementing a workflow, render its representative states with actual data and review them at the required viewports.

### Details resolved beyond the generated images

- Use inline expansion for inspection throughout the ordinary agenda, collection and log patterns. Avoid a persistent inspector by default. Long editing still uses a dedicated editor.
- Treat selected and expanded as separate states: a selected row has an accent cue; an expanded row exposes details and an accurate collapse control. The original desktop image's forward chevron on an expanded row must become an upward chevron with an accessible expanded state.
- Show duration once per row. The initial Today concept repeats it in the time gutter and detail strip; retain it in the gutter and show only the time range in the expanded details.
- On Food, use one Edit action per entry. Remove the generated duplicate Edit entry link. Quantity in the preview is read-only; editing opens the existing portion editor with Save and Cancel.
- Use consistent icons from the existing icon source or a matching maintained library. Generated icon variations are not new assets to reproduce. Retain the supplied NOVA identity.
- On mobile, a seven-day date strip uses compact 44px controls. At 320px, allow horizontal scrolling within that strip rather than shrinking the targets or overflowing the page. Keep date-picker access available through the date label.
- Example Plan tomorrow is contextual: the real active task or selected date determines the action. Do not force that label onto every date or duplicate a task's primary action.

## 3. Information architecture and navigation

### Primary destinations

Keep **Today, Plan, Roadmap, Health, Progress** as the five primary destinations. Roadmap remains directly reachable because the current curriculum, Germany execution and interview preparation are substantial workflows. This deliberately resolves the older four-destination documentation in favor of the current product.

Use **Tools** consistently for secondary destinations: Library, Sharing, Motivation, Settings, account, theme, search and keyboard help. Goals remains a child of Plan; Motivation is reachable from Goals and Tools. Health subtools remain under Health. Tools is a navigation grouping, not an extra mobile dock item.

### Desktop: 1024px and wider

- A 224px left navigation rail contains the NOVA mark, five primary links, a Tools group, and account/status at its bottom.
- The content area has a maximum width of 1120px and 32px horizontal padding. Reading-only content is capped at 720px.
- The page header contains its title, relevant date/view context, and the primary contextual action. Remove the second horizontal copy of the primary navigation.
- Search and general capture are available through Tools, without permanent competing controls in the rail. A page action such as New drop or Log meal has its own explicit label.
- The selected primary destination and selected secondary route are visible. Sharing belongs to Tools; food and body belong to Health; Tasks and Goals belong to Plan.

### Phone and tablet: below 1024px

- One compact header contains the page title, its primary action, and a 44px Tools/menu control. Preserve NOVA identity with a small mark rather than a second large heading.
- The bottom dock contains exactly the five primary destinations, with the same names and order as desktop. At 320px, each destination retains at least a 44px target and a readable label.
- General Add record and search remain reachable from Tools. On Today, Plan, Health and Progress, the contextual capture action is visible in the header. On Sharing it is New drop; on Library it is New item.
- When a current task or active session owns the main action, header capture uses a secondary treatment. The screen still has one filled primary action.
- Remove repeated Add controls and repeated back links from primary pages. Detail pages retain one named return path or breadcrumb.
- Reserve the dock height and device safe area in the content layout. Dialogs cover and isolate navigation while editing.
- At 768–1023px, permit useful two-column page content without adding a desktop rail or a second navigation bar.

### Routes and product ownership

| Destination | Routes / existing feature owners | Entry experience |
| --- | --- | --- |
| Today | /hub, /trackers, approved personal entry | Selected day, current action and chronological agenda |
| Plan | /plan, /todo, /goal | Day/week scheduling, unscheduled tasks and goals |
| Roadmap | /roadmap | Current dated learning assignment and evidence |
| Health | /health, /food, /routine, /weight-loss, /workout-tracking, /intermittent-fasting | Dated logs and their correction/history flows |
| Progress | /dashboard, /review | One selected trend or reflection workflow |
| Tools | /more, /archive, /share, /shared-with-me, /share/[shareId], /motivation, /settings | Secondary content, sharing and preferences |
| Capture | /log and existing contextual capture | One record type, explicit date and relevant fields |
| Account entry | /login, /auth/callback, restricted landing states | Clear sign-in, loading, denied-account and recovery states |

Preserve existing URLs and bookmarks. The legacy inbox alias retains its canonical Sharing destination. Existing standalone reflection, capture and personal-entry paths remain usable; this design does not prescribe new redirects without a separate route inventory check.

## 4. Visual system

### Color roles

Use semantic tokens; page components must not choose arbitrary accent colors.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | #F5F7FA | #101820 |
| Surface | #FFFFFF | #192530 |
| Primary text | #172B40 | #F1F5F9 |
| Secondary text | #526579 | #ABBAC8 |
| Action / selection accent | #176C78 | #70D6DB |
| Border | #D8E1EC | #354657 |

Dark accent controls use #101820 text; light accent controls use #FFFFFF text. Danger, warning and success are semantic states with a text label or icon, never alternate page themes. Verify the rendered state palette during mockup review: ordinary text contrast must reach 4.5:1; essential control boundaries and focus indicators must reach 3:1 against adjacent colors. Disabled controls use a neutral treatment and an explanation when the reason is not apparent; avoid making them look like enabled primary actions.

### Type and spacing

- Space Grotesk: page and section headings, used with restraint. Keep the existing NOVA wordmark treatment separate.
- Inter: content, navigation and controls. Body and form input text is 16px; dense desktop table text may be 14px. Supporting text is 14px; 12px is reserved for nonessential annotations and dock labels.
- Use Inter with tabular numerals for timestamps, durations and measurements. Keep the system to the selected two fonts.
- Page titles: 32px desktop, 24px phone by default. The Today pilot uses 48px desktop and 32px phone after normalized visual comparison established the source's larger title hierarchy. Section headings: 18–20px. Body line height: 1.5–1.6.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48px. Phone page gutters: 16px at 320px, 20px at 390px. Section gaps: 24px phone, 32px desktop.
- Controls: 44px minimum height; icons and icon-only controls have defined 44px targets. Use 8px control radii and 12px panel radii. Pills are reserved for concise statuses or selected filters.
- Use a panel to group a form, chart, or independent record collection. Individual rows inside a collection use dividers. Avoid nesting panels within panels.
- Use one filled primary action for the active workflow. Secondary actions use quiet borders or text; destructive actions are separated from routine completion.
- Use short hover/focus transitions. Animate opening or feedback only when it explains an interaction. Respect reduced motion. No decorative shimmer, glow or automatic visual rotation in the workspace.

## 5. Shared page and interaction patterns

### List / agenda

Header → date or view selector → optional search/filter → content rows → optional supporting details. A row places its name and meaningful state first, one short metadata line second, and relevant actions last. Long content wraps. Essential mobile actions do not rely on hover.

### Dated record / log

Date and units remain visible beside the entry workflow. The active log comes first; a compact known-data summary follows or sits beside it on desktop. History and configuration have distinct entry points. Editing a historical record clearly identifies its date and preserves unrelated fields.

### Editing

Phone: a sheet or full-screen editor for longer forms, with a stable title/close area, scrollable body and reachable save area. Desktop: a 560–640px dialog for creation. Inspect ordinary selected records inline; a persistent side panel requires a workflow-specific reason and a separately reviewed design. Long nutrition, recipe, workout or roadmap work uses a dedicated page.

Focus moves into modal editors, stays there with Tab, and returns to the opener. Save retains the draft on failure. Closing an edited unsaved form asks whether to keep editing or discard. Enter must not accidentally save a multiline note or unfinished food quantity. Escape follows the same unsaved-change rule.

### Feedback and states

- Validation belongs beside the field, with an accessible error relationship.
- A failed action has a visible recovery path. Errors inside a modal are announced inside that modal.
- Pending actions show what is happening and prevent duplicate writes.
- Saved, local-only, syncing and failed-sync are distinct states. A local save does not claim cloud availability.
- Copy feedback appears beside Copy link/text and only claims success after the clipboard operation succeeds. The URL or text remains available for manual copying.
- Empty states state what is missing and provide one relevant action. Filtered empty states offer Clear filters.
- Distinguish unavailable data from zero, especially in nutrition, focus, study and progress views.
- Confirmations are reserved for consequential loss, permission changes or discarding an edited draft. Ordinary deletion uses existing Undo behavior where supported.

## 6. Page designs

### Today

Open on the selected date. Present the actual Now/Next action through the header action and relevant agenda row, without a second large summary card. Use the selected calendar ribbon, then Morning, Afternoon and Evening groups with a time gutter. Show time, activity, completion and the next useful action in each row. Expand short notes and secondary actions inline; Open task reaches the longer workflow. Meals and supplements participate in the same chronology, with clear taken/skipped/snoozed states. Unscheduled work belongs to Plan under Unscheduled tasks; Today retains one contextual pending-task action when no timed commitment is next. Optional habits sit below the agenda on both phone and desktop. This task ownership refinement was approved by the user on 12 October 2026. The clock is a small contextual time display. An active focus session has one authoritative bar and one set of pause/resume/finish/cancel actions.

### Plan, Tasks and Goals

Plan starts with Day/Week and the selected period. Desktop places the scheduling canvas beside the unscheduled queue; phone shows the selected day's sequence with an explicit Unscheduled view. Scheduling presents conflict information before confirming. Tasks uses readable rows with optional filters and a straightforward task editor. Goals presents the saved purpose, next milestone and evidence/completion state. Historical progress and goal configuration open separately. Do not reproduce the task queue or goal story across multiple panels.

### Roadmap

Lead with current day/date, the assigned learning topic and the next required evidence. Use three top-level views: Today, Curriculum, Career. Within Today's assignment, resources, practice, interview preparation and completion evidence are clearly labeled sections. Timetable is reachable from Today; the detailed schedule opens on demand. Career retains Germany execution, applications and interview/exam workflows with their existing factual statuses. Preserve dated timetable allocations, the recovery day, historical rules, Bible links and evidence gates; opening material or running a timer does not count as mastery.

### Health and Food

Health is the doorway to actual dated records: food, water, body, exercise, sleep/recovery and routines. Show the most recent relevant value and a direct Log/Open action per domain; unconfigured modules stay quiet.

Food opens on Diary with the selected date, a compact calories/macros summary and meals in chronological groups. Each entry shows food, portion and energy with Edit and a secondary menu. Saved foods and Nutrients are separate local views. Food search is a distinct selection step, followed by portion review and Save. Manual entry, import, barcode data and recipes retain their approved provenance and quantity rules. Nutrient detail shows known totals and coverage; missing nutrients are not zero. Recipes retain independent ingredient amounts, batch yield and historical meal snapshots.

### Body, Exercise, Fasting and Routines

- Body: date/unit → weigh-in or correction → recent trend → history. Target editing is optional and separate from entering a measurement.
- Exercise: selected session/date → exercise rows → readable sets with previous values. Rest controls stay with the active session. History, program setup and plate calculator have explicit entry points.
- Fasting: first/last meal or active optional timer → the actual save/end action → history. Overnight windows and manual records have clear labels.
- Routines: selected day → each occurrence with scheduled time and taken/skipped/snoozed status. Configuration is separate; it never silently changes historical completion.
- Sleep/recovery: brief dated entry and history; no inferred readiness score or medical interpretation.

### Progress and Reflection

Choose Health or Work, then one metric, then the date range. Present a clearly labeled chart, its factual change/coverage, and dated readings. Avoid a wall of unrelated miniature charts. Missing days remain gaps, explicit zero remains zero, and partial totals disclose their coverage. Reflection opens an existing dated journal workflow and retains direct links to relevant evidence. The selected range and metric survive appropriate navigation.

### Sharing

Default to saved content. Use **My drops** and **Inbox** as local views, with **New drop** as the primary action. The new-drop composer opens when requested rather than permanently pushing the list down the phone screen. Saving a drop keeps it private; sharing is a separate deliberate action.

A drop row shows a title or readable text preview, type, expiry and either Private or Shared with a meaningful audience label. Expand short content and Copy/Manage access actions inline on desktop and phone; use a sheet or dedicated viewer for large images or long content. Keep secondary actions in the row menu. Storage capacity appears only in a storage disclosure or a relevant upload/cap error.

The share editor shows the content reference, selected audience, expiry, and Create link/Save permissions. On the restricted deployment, audience choices are Selected approved accounts and Approved accounts with the link. The account picker is limited to the existing two-account website policy; retain legacy saved email values visibly for review rather than silently rewriting them. Owner management access remains governed by the current cloud policy. A link becomes shareable only after its cloud write succeeds. Copy link is separate from saving permissions. Revoke confirms success only when the service confirms removal; a failed revoke retains the saved link and explains that access may still be active.

The approved-account notice is concise in this flow. Do not call a link public or promise signed-out access. Local mode clearly indicates that a cloud share link cannot be created. Incoming items show sender, access and expiry; expired, denied and unavailable links offer an appropriate return or retry path without revealing protected content.

### Library and Motivation

Library is a searchable collection with readable text/link/image previews, type filters, pinning, editing, copy and recoverable deletion. An image failure preserves the note text. Motivation retains the saved goal, relevant encouragement and next milestone; its image is supporting content, with original writing and source attribution clearly distinguished. Personal reminders remain optional. Do not reintroduce timers, visit counters or autoplay into Motivation.

### Settings, Capture and account entry

Settings has named sections: Account, Appearance, Enabled features, Notifications and routines, Focus preferences, Devices, Sync and backup, Data management. Pairing, import/export, deletion, browser notification status and real-device limitations stay understandable. Put destructive actions at the end.

Capture chooses one record type, confirms date/units, and presents only its required fields. Use the same form and validation in contextual capture and /log. Returning from capture preserves the originating page/date.

Login presents NOVA identity, one Google sign-in action and concise restricted-workspace guidance. Loading, unavailable configuration and access denied are distinct. Account retry uses a readable action and a safe return URL. The normal dock and background reminder UI do not compete with sign-in.

## 7. Wireframe contract

These structural wireframes describe the approved Open agenda system. The selected desktop Today image is the visual target, with the approved adaptations beside it. Apply the token and interaction rules above to each workflow.

```text
DESKTOP — shared workspace
┌──────────────────┬──────────────────────────────────────────────────┐
│ NOVA             │ Page title                  Contextual action    │
│                  │ Date / local views                               │
│                  ├──────────────────────────────────────────────────┤
│                  │                                                  │
│ Today            │ Primary workflow / grouped dated rows            │
│ Plan             │ Expanded details within the relevant row         │
│ Roadmap          │                                                  │
│ Health           │                                                  │
│ Progress         │                                                  │
│                  │                                                  │
│ Tools            │                                                  │
│ Library          │                                                  │
│ Sharing          │                                                  │
│ Settings         │                                                  │
│ Account / sync   │                                                  │
└──────────────────┴──────────────────────────────────────────────────┘

PHONE — Sharing
┌──────────────────────────────────────┐
│ N  Sharing           New drop    ⋯    │
│ My drops       Inbox                 │
│ Search drops                 Filter  │
├──────────────────────────────────────┤
│ Travel details for our next trip     │
│ Note · Private · Expires tomorrow    │
│ Read / copy / share                  │
├──────────────────────────────────────┤
│ Another saved drop                   │
│ Link · Shared · Expires in 7 days    │
│ Read / copy / manage access          │
│                                      │
│ Storage details                      │
├──────────────────────────────────────┤
│ Today  Plan  Roadmap  Health Progress │
└──────────────────────────────────────┘

PHONE — Today
┌──────────────────────────────────────┐
│ N  Today                         ⋯   │
│ Selected date / seven-day strip      │
│ One contextual main action           │
├──────────────────────────────────────┤
│ Morning                              │
│ 09:00  Work / learning block         │
│        Expanded note / Open task     │
│ Afternoon                            │
│ 14:00  Meal / routine occurrence     │
│ Evening                              │
│ 18:00  Next scheduled work           │
│ Unscheduled work / optional habits   │
├──────────────────────────────────────┤
│ Today  Plan  Roadmap  Health Progress │
└──────────────────────────────────────┘
```

## 8. Design review and delivery order

1. **Select the direction.** Complete: the user selected Open agenda. Its left rail, calendar ribbon, flat grouped rows and inline inspection are the shared design direction.
2. **Review adaptations and workflow states.** The user approved desktop Today, mobile Today, desktop Sharing and desktop Food references. Complete representative review of Plan, Roadmap and Progress, mobile Sharing/Food, 320px Sharing/editor, long content, an empty state and dark appearance before rolling out those workflows. These are design artifacts, separate from production source.
3. **Review real interaction sequences.** New record → save → edit → return; start/pause/finish work; choose food/portion → save; share → copy → revoke; failed save; denied account. Identify the next action and where feedback appears in each state.
4. **Write the implementation plan against the approved mockups.** Map shared primitives, route ownership, storage-preserving adaptations and tests to exact files. Do not treat this proposal as permission to redesign all pages immediately.
5. **Implement the shell and Today pilot.** Complete locally: shared navigation, tokens, page header, date strip and agenda rows. Populated and expanded views checked at 320, 390, 768 and 1440px; empty, historical/future-date, dialog focus and active-session entry/resume/cancel checked in the browser. See the implementation plan and root `design-qa.md` for evidence and limits.
6. **Roll out complete workflows.** Sharing → Plan/Roadmap → Health and its logging tools → Progress/Reflection → Library/Motivation/Settings/account. Each checkpoint includes its proposed design, mobile/desktop visual review and appropriate behavioral verification.
7. **Verify authenticated production behavior and release.** Distinguish local UI verification from signed-in cloud writes, provider behavior, pairing and actual notification delivery. Publish only the reviewed scope.

The implementation map will likely include Navbar, PersonalShell, ChapterHeader, TrackerNavDock, personal-nav, ui-system.css and the page-owned workflow components. Consolidate token overrides in one semantic layer. Split page components only where the approved workflow benefits from a clear responsibility boundary; avoid an unrelated application rewrite.

## 9. Acceptance criteria

### Visual and usability review

- Representative mockups are explicitly reviewed before production UI changes resume.
- Desktop and mobile share navigation names, destination ownership and selected states.
- Each page has one title and one primary action for its current workflow; metadata does not compete with them.
- On 390×844 Sharing, actual saved content is visible before scrolling; the composer appears on request. On Today, the current action and the start of the agenda are visible before scrolling.
- At 320px, labels remain readable, primary targets remain at least 44px, and long notes, email addresses, titles, units and errors stay usable.
- At 768px, layout changes are intentional. At 1440px, reading and form widths remain bounded.
- Main content and primary editor actions are reachable with the dock, safe area, active-session bar and on-screen keyboard present.
- Light and dark states have verified contrast for text, controls, focus, disabled states and errors.
- Visual review uses ordinary viewport captures after fonts and state settle. Include open editors and populated content, not only empty screens or full-page captures.

### Behavioral preservation

- Existing records survive layout changes, route navigation, editing, export and validated restore.
- Known zero, unknown data, partial nutrition coverage, dates, units and source provenance retain their meaning.
- One authoritative focus/session controller remains; task completion and learning evidence are not inferred from activity.
- Keyboard focus, modal isolation, Escape/discard handling and return-to-opener work consistently.
- Save/copy/share/revoke feedback matches the actual operation result. Failed writes retain the draft or saved permissions.
- Google access remains restricted to cvamsik99@gmail.com and srija210v@gmail.com on the deployed personal website. Local development, public portfolio and credential-protected machine flows preserve their current contracts.
- Timetable, reminders, protected personal records and external study links keep their approved behavior.

### Release evidence

For each checkpoint, record the reviewed mockup, actual viewport captures, changed workflows, test results and remaining live-service limits. Passing automated tests alone does not accept the visual design. Unavailable live verification must be recorded rather than reported as success.

## 10. Current handoff

The requested scope is the full personal website. Open agenda and its Today, Sharing and Food adaptations are approved. Four reference images are saved with this document. Navigation ownership and all page workflows are specified above. The shared shell and Today are the completed local pilot; Sharing is the next workflow checkpoint.

The pilot has not been deployed. Generated references are design targets; local browser checks and production-build verification are recorded separately. Signed-in cloud behavior and the remaining page redesigns still require their own workflow verification before release.
