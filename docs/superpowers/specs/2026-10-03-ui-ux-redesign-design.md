# UI and UX redesign

## Objective

Make the public portfolio easy to browse and the NOVA personal workspace easy to use every day. Audit both experiences and address verified issues across their routes, without changing existing storage contracts, privacy settings, authentication, or host routing.

## Approach

Redesign shared foundations first, then refine individual pages. A cosmetic-only pass cannot resolve navigation and interaction defects. A complete application rewrite introduces unnecessary risk to persisted tracker data. Preserve useful components and replace presentation or interaction patterns where inspection shows they impede use.

## Navigation and hierarchy

- Public portfolio: prioritize selected work, experience, capabilities, and contact; make resume access straightforward. Keep secondary tools behind an explicit menu.
- Personal workspace: consistent desktop navigation and mobile bottom navigation, with correct active states on child routes. Make tasks, roadmap, health, and settings discoverable through More and search.
- Give each page one descriptive title, a short useful explanation, and a clear primary action. Reduce redundant chapter labels, decorative metadata, and competing action areas.
- Keep headers, mobile docks, notifications, and dialogs from obscuring content or each other. Respect device safe areas and sticky-header anchor offsets.

## Visual system

Retain separate identities for the public portfolio and NOVA while consolidating each surface's tokens and component styling. Use Space Grotesk for restrained headings, Inter for readable body and control text, and IBM Plex Mono only for actual data and utility annotations.

Proposed personal palette: canvas #101820, panel #192530, elevated panel #223240, text #F1F5F9, secondary text #ABBAC8, accent #70D6DB. Proposed public palette: canvas #F7F9FC, panel #FFFFFF, text #172B40, secondary text #526579, accent #245CB3, border #D8E1EC. Verify rendered contrast before finalizing tokens; support both theme modes.

Use consistent spacing, bounded line lengths, quiet borders, and a small set of panel and button treatments. The signature is the useful daily plan and actual project work, rather than decorative dashboard chrome. Avoid oversized condensed uppercase headings, excessive glows, and tiny all-caps labels.

## Interaction and accessibility

- Consistent primary, secondary, destructive, disabled, and loading control states; explicit action labels.
- Visible keyboard focus, meaningful accessible names, usable touch targets, and correct selected-state semantics.
- Dialogs capture the opener before moving focus, trap keyboard focus, restore it on close, and fit short screens with scrollable content and accessible actions.
- Keyboard shortcuts respect text inputs, modifiers, and active dialogs.
- Forms connect labels, help text, and errors; validation explains how to recover. Empty, loading, offline, success, and error states guide the next action.
- Honor reduced motion and prevent mobile horizontal overflow.

## Implementation boundaries

Keep presentation changes in shared shells, navigation, UI primitives, page components, and scoped style tokens. Keep domain logic and persistence intact unless a verified interaction bug requires a narrow change. Inventory route-specific issues as the rendered audit proceeds; do not claim all routes fixed based only on shared styling.

## Findings from source inspection

These are code-level findings; rendered severity still needs browser verification.

| Finding | Evidence | Required correction |
|---|---|---|
| Actions promise a save but only scroll | Fasting header's “Save today's window” is an anchor to `#meal-window`; workout “Log session” also navigates to an editor | Navigation says “Open meal window” or “Open session”; actual saving happens through clearly labeled form controls |
| Focus and Motivation use different names for one destination | Primary navigation calls `/motivation` Focus; its page title says Motivation | Use Focus consistently as the page name; describe motivation as one part of that page |
| Tasks are missing from the More directory | `/todo` exists but `PERSONAL_MORE_NAV` omits it | Add Tasks to the destination directory and ensure search and shortcuts use the same label |
| Primary navigation loses context on secondary pages | `isPersonalPrimaryPath` only handles exact matches and the `/trackers` alias | Associate secondary destinations with More and sharing detail/inbox routes with Sharing |
| Multiple visual treatments compete | Shared Button uses a primary-to-fuchsia gradient; page action anchors hard-code lime; More's bedtime button hard-codes indigo | Derive actions from scoped semantic tokens and shared variants |
| Tiny text carries meaningful information | Mobile dock labels are 9px; Today status labels are 9px; tracker metadata often uses 10px | Keep navigation and essential labels readable; reserve compact metadata for noncritical information |
| Decorative action panels repeat across pages | TrackerActionBar repeats the same generic paragraph regardless of page purpose | Put actions beside the page heading or relevant form, with page-specific help only when needed |
| Interactive elements are nested | Today wraps a Button inside a Link for Log workout | Render one interactive element using Button's `asChild` pattern |
| Modal return focus is captured too late | Modal calls `dialog.focus()` before capturing `document.activeElement` | Capture opener first, handle Tab from the dialog container, and test restoration |
| Landmarks are nested | RootLayout renders main and PersonalShell renders another main | Use one main landmark with sections inside the shell |
| Bedtime description overstates browser behavior | More says “Blank notifications” despite browser-only protection documented in README | Describe the in-app bedtime screen accurately and keep OS setup guidance explicit |
| Dense controls can hide their meaning | Segmented controls truncate labels in equal-width columns | Allow responsive wrapping or deliberate horizontal scrolling with visible complete labels |

## Page-by-page redesign

### Today and onboarding

Make the opening viewport answer three questions: what matters today, what should I do next, and where do I record progress? Use a brief greeting and date, one next-action card, and a compact daily checklist. Integrate the roadmap's current study block into this hierarchy so it does not compete with separate next-action and focus cards. Keep weekly trends, activity history, and detailed health statistics below the immediate actions.

Remove elapsed-day percentage and implementation terminology from the greeting area. Put sync state near account controls. Keep world clocks collapsed behind an explicit time-zone control when they are not needed. Quick capture has visible labels, input validation, and feedback after saving. Onboarding explains which choices are optional, shows progress, preserves existing values, and returns to a usable Today screen.

### Roadmap and study

Organize the roadmap into Today, Schedule, Progress, and Career resources. Default to the current day's work, retain the user's selection during edits, and offer an explicit return to today. Each study block shows time, topic, duration, status, and one clear action. Distinguish opening a chapter, saving evidence, and verifying completion. Put role research and resume resources in their own section rather than interleaving them with today's checklist.

Keep evidence-gated completion and existing study protection behavior. Make the consequences of starting a protected session visible before starting it. Session controls show remaining time, pause/end options permitted by the current rules, and the next recovery step after interruption. Prevent unrelated keyboard shortcuts from opening another overlay while studying or editing a dialog.

### Focus and reflection

Use a single Focus page name and a clear separation between starting a timed session, viewing motivation, and writing a reflection. Bring session setup and its start control above decorative imagery. Keep affirmations and saved items secondary. Handle media loading and failure without blocking the start control. Explain when reflections are saved; show a saved state rather than making users infer persistence.

### Tasks and Log

Tasks opens with quick add and a readable list. Keep Today, Upcoming, and Completed filters clear, expose task editing through a recognizable control, and avoid making priority cycling depend on discovering a tooltip. Long task names wrap without covering dates or action buttons. Completing and deleting remain distinct actions.

Log is the common capture entry point: choose task, workout, meal window, weight, or reflection, then show only the relevant fields. Always show the record date and units. Reuse the same validation and success vocabulary as the dedicated tracker pages. Avoid adding a second data layer or introducing new record types.

### Health, fasting, and workouts

Health prioritizes today's weigh-in, unit, trend, and target. Secondary recovery ratings expose selected state to assistive technology and explain the scale. Show chart units and an accessible summary; distinguish no data from a zero value.

Fasting prioritizes first/last meal times, computed window, and the actual save control. Explain overnight ranges and edits. Make routine setup, today's record, and history distinct. Header controls must not imply a save when they only scroll.

Workouts prioritizes selected date, training day, and set entry. Each set keeps weight, reps, and units visible together on mobile. Put previous-session values next to entry fields, keep rest timer controls accessible without covering the logger, and move records/volume summaries below the session. Saving, adding a set, and ending a session have separate labels and feedback.

### Goals and archive

Goals prioritizes the active goal, the next milestone, and this week's commitment. Put goal editing and category selection behind an explicit edit action. Display progress with its denominator and unit; distinguish recorded progress from a forecast. Keep recovery guidance actionable and neutral.

Archive prioritizes search and capture, with clear filters and readable previews. Distinguish no saved items from no search results. Preserve text when an image fails, wrap long URLs, and expose edit, pin, and delete consistently. Keep private status understandable without repeating technical storage descriptions.

### Sharing

Use clear Outgoing and Incoming views. Creation groups content, access, and expiry in a predictable order. Show the selected audience before the share action; keep public sharing an explicit choice. Separate copying a link from changing access. Explain expired, unavailable, and unauthorized items with appropriate recovery actions. Keep storage limits contextual to uploads rather than competing with the composer.

### Settings and More

Group Settings into Profile and appearance, Notifications, Focus and bedtime, Sync and backup, and Data management. Show saved state and distinguish browser permission from in-app reminder preferences. Keep destructive actions at the end with specific descriptions of affected data. Backup import shows validation and results using the existing safe restore mechanism.

More becomes a readable destination directory grouped into Planning, Health, Library, and Settings, including Tasks. Bedtime activation describes its immediate in-app effect. Maintain access to existing release mechanisms and do not silently disable protection features.

### Public portfolio

Lead with the engineer's name, role, selected project evidence, and View work / Contact actions. Resume remains a discoverable secondary action. Simplify the header to useful section links and a small utility menu. Project entries distinguish case study, source code, and live preview; previews explain unavailable destinations and close accessibly.

Use a consistent section rhythm for projects, architecture, open source, experience, capabilities, testimonials, and contact. Keep architecture readable on mobile with an accessible text equivalent. Present skills as readable groups rather than a wall of badges. Contact fields retain values on failure, expose clear validation, and distinguish pending, successful, and failed submission. Avoid adding unsupported claims or invented testimonials.

## Layout contracts

Desktop personal workspace: stable navigation, heading with contextual action, wide main task area, and an optional smaller supporting column. Tablet collapses supporting panels below the main task. Mobile shows one column, readable page heading, immediate action, and a five-destination bottom dock. Page content includes enough bottom padding for the dock and device safe area.

Desktop portfolio: quiet persistent header and spacious sections with project content as the visual focus. Mobile: compact brand/menu row, fully readable hero, stacked project content, and no floating utility controls over primary actions.

Body copy targets 16px; essential control labels target 14px or larger; supporting metadata targets 12px or larger. Touch controls target at least 44px in each interactive dimension, with adequate spacing. Headings use a bounded responsive scale. Essential actions do not truncate. These are design targets to validate against real content rather than global overrides applied blindly.

## Delivery sequence and acceptance

1. Baseline rendered audit: record route, viewport, state, reproduction, and severity. Capture representative screenshots before changes.
2. Shared foundations: tokens, shell, navigation, buttons, inputs, dialogs, and overlay coordination. Verify keyboard and mobile behavior before propagating changes.
3. Everyday workflows: Today, onboarding, Tasks, Log, Roadmap, and Focus. Verify saving, editing, completion, session controls, and persisted reloads.
4. Supporting routes: health, fasting, workouts, goals, archive, sharing, More, and Settings. Verify empty/populated/error states and privacy controls.
5. Public portfolio: hero, navigation, work, remaining sections, previews, resume, and contact.
6. Release checks: route-by-route responsive review, light/dark review, meaningful regression tests, lint, typecheck, production build, and relevant E2E suites.

Acceptance requires no reproduced navigation dead ends, nested interactive controls, obscured primary actions, or horizontal overflow in audited viewports. Dialogs must remain operable by keyboard, restore opener focus, and fit short screens. Every audited form must communicate its labels, invalid state, save action, and result. Report unresolved external-service or credential-dependent behavior separately. A passing build alone does not establish UX completion.

## Verification

Review rendered public and personal surfaces at 320px, 390px, tablet, and desktop widths, in light and dark modes. Exercise primary navigation, form actions, empty/populated tracker states, dialogs, keyboard focus, and reduced motion. Add meaningful regression coverage for behavior fixes. Run lint, TypeScript checks, production build, and relevant existing Playwright suites; report any environment or credential limitations explicitly.

## Completion evidence

Provide a concise issue/change record, actual check results, and screenshots or a local preview of the implemented experience. Preserve existing user changes and saved data. Publishing and committing implementation changes are outside this request.
