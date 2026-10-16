# NOVA Open agenda pilot — design QA

Scope: shared navigation and Today, the first checkpoint of the approved full-site design. Sharing and Food have not passed implementation QA in this checkpoint.

Source visual truth: `docs/superpowers/specs/assets/2026-10-11-nova-open-agenda/today-desktop-selected.png` and `today-mobile-proposed.png` in the same directory.

Implementation: `http://localhost:4173/hub`; light appearance, 11 October 2026, four illustrative local event commitments created through Plan, first row expanded. The source uses illustrative tasks, notes and meal categories; implementation uses actual event data and derived statuses/actions. Differences in these records are expected rather than forced fixtures.

## Initial comparison — blocked

Evidence: `artifacts/ui-ux/open-agenda/comparison-desktop-before.png` and `comparison-mobile-before.png`, each placing source and implementation together. Raw captures: `today-desktop-before.jpg`, `today-mobile-before-surface.jpg`.

- **P2 — missing white agenda surface.** The source separates the calendar canvas from a white agenda working area. The implementation carried the gray canvas through the agenda. Fix: use the card token for the agenda region with full-width internal gutters.
- **P2 — weak title hierarchy.** The first 32px desktop/24px phone title looked smaller than the normalized reference. Fix: optically match Today at 48px/32px, retaining the specified families and medium weight.
- **P2 — excessive phone row height.** Calendar and row padding pushed the fourth commitment beneath the dock. Fix: compact mobile calendar and row rhythm while preserving 44px controls; retain date-picker access through the date label.
- **P2 — stray rail divider.** A previous horizontal-navigation border remained beside the new links. Fix: remove that inherited divider from the scoped rail.
- **P0 — menu-to-dialog background isolation race.** Opening capture before Radix closed left the page permanently aria-hidden on Escape and lost dialog focus. Reproduced through the browser. Fix: queue capture/search/help until `onCloseAutoFocus` releases the menu, restore the Tools trigger, then open the dialog on the next animation frame. Verified Close/search receives initial focus and Escape restores Tools with main aria-hidden removed.

Final captures and comparison follow below after production verification.

## Second comparison — blocked

Evidence: `comparison-desktop-iteration-2.png` and `comparison-mobile-iteration-2.png`. Surface separation, title sizing and stray rail border were fixed. Two additional P2 issues remained:

- **P2 — font aliases invalid at the root.** Computed title and body fonts were system UI; `--font-display` and `--font-sans` were empty despite loaded Next/font families. Fix: resolve both aliases on the tracker body where Next/font declares Inter and Space Grotesk, and apply the body family.
- **P2 — fourth phone row still obscured.** Dinner started at 743px, with the dock starting at 764px. Fix: reduce top padding, date-line gap, group gaps and gutter spacing without reducing the disclosure or dock targets below 44px. Restore the specified blue-gray border token overridden by older surface rules.

## Narrow-phone review — blocked

Evidence: first 320px capture (retained as `today-320-before-grid-fix.jpg`). Despite document scrollWidth reporting 320px, ancestor clipping concealed a 332px grid track and the end of the primary action. Fix: set the Today grid to `minmax(0, 1fr)` and `min-width: 0` on its calendar row. The week strip must scroll inside its own width instead of enlarging the grid. This is P2; verify actual control bounds as well as document width.

## Final comparison — passed

Final raw production captures (all relative to `artifacts/ui-ux/open-agenda/`):

| State | Capture | CSS viewport / image pixels |
| --- | --- | --- |
| Light, Today, four events, first row expanded | `today-desktop-final.jpg` | 1440×1024 / 1440×1024 |
| Same state, phone | `today-mobile-final.jpg` | 390×844 / 390×844 |
| Narrow phone, selected Sunday scrolled into view | `today-320-final.jpg` | 320×844 / 320×844 |
| Tablet, calendar controls wrap below week | `today-768-final.jpg` | 768×1024 / 768×1024 |
| Phone, dark appearance | `today-dark-final.jpg` | 390×844 / 390×844 |
| Empty historical day, 7 October | `today-empty-historical.jpg` | 1440×1024 / 1440×1024 |

Source desktop pixels: 1487×1058, normalized to 1440×1024. Source mobile pixels: 853×1844, normalized to 390×844. These are generated rasters, not captures with a known deviceScaleFactor. Browser devicePixelRatio was 1, so implementation screenshots use one pixel per CSS pixel. Source copies were resampled with Lanczos for comparison; originals were preserved. No browser chrome or device bezel is included. Comparison captions add 30px above each composite.

Full-view combined evidence: `comparison-desktop-after.png`, `comparison-mobile-after.png`. Focused combined evidence: `comparison-desktop-detail.png` (header, week and first expanded row at readable scale) and `comparison-mobile-detail.png`. Both source and rendered images were opened together in each comparison input. The final desktop/mobile captures were regenerated after the grid fix and compared again.

Earlier issues are resolved: white agenda surface restored, Today hierarchy matched optically, rail divider removed, loaded fonts confirmed, Dinner ends at 757px before the 764px dock on 390px, and the 320px content track now measures 288px inside 16px gutters. Its week has 332px of content scrolling inside 288px; the primary action ends at 304px and row chevrons at 296px. Dock links measure 60×60px on the narrow phone. At 320px, wrapped titles/actions require normal vertical scrolling; the dock remains visible and lower content is reachable.

### Required fidelity surfaces

- **Fonts/typography:** Computed title family is Space Grotesk with Inter fallback; body is Inter. Title 48px desktop/32px phone, row titles 20px/16px and metadata 14px match the implementation contract. Source-generated glyph shapes and nominal metadata scale are approximate, so exact font reconstruction is not claimed. Medium/semibold optical weights, tabular time numerals, long-title wrapping and hierarchy were reviewed in the focused comparisons. No clipped labels at tested widths.
- **Spacing/layout rhythm:** 224px rail and 1120px content maximum follow the approved spec, rather than tracing the raster's approximate rail width. White work surface, calendar ribbon, three chronological groups, gutter and inline expansion are present. Phone header/ribbon/action sequence, internal scrolling at 320px, tablet date-control wrap and five-item dock are verified. The desktop inset matches the shared frame contract; four rows stay visible on the reference desktop viewport.
- **Colors/tokens:** Canvas #F5F7FA, white work surface, ink #172B40, support #526579, accent #176C78 and divider #D8E1EC confirmed. Source generated accent appears brighter; the agreed semantic token is authoritative. Calculated light text contrasts: ink/white 14.4:1, support/white 6.0:1, white/accent 6.1:1. Dark controls and surfaces use the approved dark tokens and remain readable. Focus uses the accent ring; selection also has an underline and pressed state. Decorative low-contrast timeline lines are not the sole state cue.
- **Image quality/assets:** Original supplied NOVA identity is retained, with the existing vector mark and wordmark. Icons come from the existing TrackerIcon/Lucide library, as explicitly resolved in the design spec. No generated brand mark, illustration or product image was approximated. Screenshots are sharp at 1× and show actual rendered UI.
- **Copy/content:** The four titles follow the source examples; they are local event records, so categories, elapsed statuses and Mark done are actual product values. Notes, meal categories and fake task links were not invented to reproduce illustrative content. The primary action reflects the real next commitment; empty/future dates link to Plan this day. Duration appears once and expanded chevrons accurately indicate collapse. Date/timezone copy is concise and correct; historical dates are marked Selected day.

### Behavioral and accessibility evidence

- Containing week 5–11 October, Wednesday historical selection, Monday 12 October future selection, date-picker previous day, native date field and return to Sunday checked.
- Capture opens with Close focused, preserves record date and return path, and Escape restores Tools. Search/help receive their correct initial focus and also release background isolation; main aria-hidden is null after dismissal.
- Water +1 shows confirmation; Undo removes the action and now reports Water addition undone.
- The contextual commitment opens the existing Plan date; Plan editing/time-block controls remain reachable. Focus start, Today Resume session, then cancel were checked without completion credit.
- Desktop Sharing selects the Sharing rail link (`aria-current="page"`). Narrow dock targets stay at least 44px, with no page overflow; the 320px grid was inspected directly to avoid a false pass from ancestor clipping.
- Final production interaction run checked browser console output: zero new errors/warnings. Earlier dev compilation and duplicate-key errors were separately fixed; old log entries were excluded by timestamp. No signed-in cloud behavior was tested.

### Findings and limits

No actionable P0/P1/P2 differences remain for the shell/Today pilot. Expected differences are real-record content/status/actions, supplied identity and library icons, exact approved tokens, specified rail width and optically chosen Today title sizing. These do not change the selected composition or primary workflow.

The final refinement pass below resolves initial selected-date visibility on the 320px calendar.

Verification limits: owner-specific timetable/routine completion and authenticated cloud sync were covered only by existing derivation/access unit tests, not a signed-in browser. The standalone Playwright CLI suite was not run; its existing menu, dock, capture, onboarding, date and agenda expectations were updated, and a menu-dialog regression case was added for later execution. Sharing, Food and the other full-site page redesigns remain separate checkpoints. Active-session controls retain the existing shared session banner.

### Implementation checklist

- [x] Fix material comparison issues and recapture at the same state/viewports.
- [x] Review full composition and focused typography/controls, then phone/tablet/dark states.
- [x] Check primary interactions, focus restoration, actual control bounds and console output.
- [x] Save evidence and verification limits; keep a working local production preview.

## Final refinement pass — passed

The selected Sunday was initially outside the 320px strip: button bounds 304–348px, visible strip 16–304px, scrollLeft 0. The week strip now reveals the selected date on mount, date changes and container resizing, using only horizontal scrolling. A ResizeObserver is disconnected on cleanup; no document scrolling or data mutation is involved.

Production-browser verification after the fix: selected Sunday 260–304px within the 16–304px strip, scrollLeft 44, document width 320px. Resizing 320→390→320 keeps Sunday visible and the Today heading at y=77px. A matching E2E regression covers initial visibility and resizing; it has not been executed by the standalone runner.

Committed final evidence lives in [verification](docs/superpowers/specs/assets/2026-10-11-nova-open-agenda/verification/): `today-desktop.jpg` (1440×1024), `today-mobile.jpg` (390×844), `today-320.jpg` (320×844), `today-dark.jpg` (390×844), `comparison-desktop.jpg` and `comparison-mobile.jpg`. The combined images show the same normalized references and first-row-expanded state described above and were inspected together after this change. Earlier iteration evidence remains local under `artifacts/`.

All five fidelity surfaces remain passed: loaded font families and readable type; agenda/calendar/rail spacing; light/dark semantic tokens; sharp existing vector identity/icons; actual record content, status and contextual actions. No new P0/P1/P2 differences were found. The narrowed calendar now exposes its selected date automatically.

Rechecked Tools capture initial focus and Escape restoration in production: Close receives focus, Tools regains it, main aria-hidden is removed. Fresh production-browser console: zero errors/warnings. Final focused unit suite 20/20, access and service-worker suite 24/24, TypeScript, lint and production build passed. Tooling notices remain unchanged. Authenticated cloud behavior and the standalone Playwright suite remain unverified.

final result: passed


# Full personal workspace — final implementation QA

Date: 13 October 2026, Asia/Kolkata. Scope: approved D01–D13. This section supersedes the pilot-only scope above for the current implementation.

## Reference and normalization

Source: approved `nova-full-layout-v2.html` review and `docs/superpowers/specs/2026-10-12-nova-full-layout-review.md`, retaining the selected Open agenda identity, Inter/Space Grotesk, teal and semantic light/dark colors. The source remains in the task's original `.codex-multi-2/visualizations/2026/10/11/01a129c0-61f3-7370-90ab-60c0ab5fa848` directory.

The source was rendered directly in a local QA wrapper with UTF-8 and an explicit light appearance to avoid iframe screenshot clipping. Its review controls were cropped from the evidence, leaving the whole app canvas. Source screenshot width is 1024 CSS px, canvas width 992; production desktop is 1024×900. All captures use DPR 1. The combined comparison scales both captures to 768px per column solely for viewing. Source rail is 164px in the scaled interactive widget; implementation intentionally uses the written production specification's 224px rail. These are structural comparisons, not pixel-identical clones.

Evidence under `artifacts/ui-ux/implementation-2026-10-12/`:

| Comparison/state | Evidence |
| --- | --- |
| Plan source and production together | `plan-comparison.png` (source left, production right) |
| Focused Exams source and actual component together | `exams-comparison.png` (source light, harness dark) |
| Final production Plan empty state | `plan-final-production.jpg` |
| Motivation, visible desktop Tools entry | `motivation-desktop.jpg` |
| Final Today phone | `today-phone-final.jpg`, 320px CSS width |
| Actual Exams component phone | `exams-phone.jpg`, 320px CSS width |

The reference contains illustrative chart values and records. Production uses saved readings, gaps and honest empty states; it does not copy the sample focus minutes, exam scores or activities. The Plan comparison includes a local synthetic activity used to verify editing. The final empty-state production capture uses a fresh origin. Exams show raw score totals bounded by the round's actual maximum instead of the reference's illustrative percent. General rounds omit the redundant Track control. Rubric, repair and history use real existing contracts.

## Visual review

The combined images and phone captures were opened and inspected. Typography retains the selected families and readable title/body hierarchy. Spacing supports one title, leading chart, then work; optional material uses named disclosures. Light/dark tokens preserve teal actions, muted context and borders. Existing vector identity/icons remain sharp; optional Motivation imagery is retained behind Supporting image. Copy and controls describe actual records and preserve date/unit/context. No material visual mismatch remains within these intentional normalization and data differences.

## Findings resolved

- P2: responsive charts shrank axis text with a fixed viewBox. The chart measures its host, keeps readable labels, leaves missing dates as gaps and provides a dated-readings table. Long custom units abbreviate only the visible axis label, retaining the full accessible title and footer.
- P2: Week editing risked replacing an activity's date with the viewport date. Editing now preserves the original date/time zone and checks overlaps against that date. Production UI creation/edit verified a 13 October activity from the week beginning 12 October.
- P2: exam round/track changes could discard a draft. Keep editing/Discard draft now guard changes, cancel and return. Final UI check retained the exact draft after Keep editing. The outer practical Track is the single source for the form.
- P2: score scale extended past the actual maximum; bounded round domains now display the real maximum. Same-time immutable attempts choose the latest appended repair/history entry.
- P2: repeated curriculum labels caused duplicate React keys. Groups use stable topic identifiers; the final production console is clean.
- QA harness only: imported Tailwind classes initially omitted modal styles. Explicit source discovery fixed the harness before using it as evidence. No fixture code was added to the app.

## Behavior and validation

58 focused Node tests pass: navigation, metric mapping/conversion/missing readings, activity projection, focus preferences, personal progress, date/overlap rules, exam eligibility/history, timetable, account access, sync multiplexing and nutrition history. TypeScript, ESLint and the optimized production build pass. `git diff --check` passes. Existing dependency-metadata and Node type-stripping notices remain.

Production browser checks used `http://127.0.0.1:4197` on 12 October and a freshly built `http://127.0.0.1:4198` on 13 October, with Supabase configuration empty. Final desktop and narrow-phone console checks report zero warnings/errors. All 23 route/view checks at 320px on 12 October reported scroll width 320px; 14 representative views were repeated at 320px on 13 October. A transient navigation count was rechecked in the settled Career state: exactly one leading chart. Health Connections, Motivation, Library, Sharing, Settings, Capture and Sign-in omit charts; progress views retain them.

Verified local interactions include activity create/edit/save and week date preservation; task capture/completion; private-drop creation; Appearance theme; saved 50-minute Focus defaults; goal metric and meal-window actions; phone Tools → Motivation; chart metric/range selection; Exams round/track/draft protection. Synthetic in-memory exam attempts exercised first-pass/two-prompt self-assessed readiness, immutable history, repair ordering and bounded scores using the reviewed rubric.

## Limits and remaining observations

Authenticated cloud writes, cross-account Sharing access changes and live production deployment were not exercised. The standalone Playwright suite was not run; its selectors were updated to the new editors/activity language. These checks do not claim complete accessibility compliance. Exams were exercised with the actual component and schema in a local in-memory harness because the anonymous preview does not contain either owner's reviewed Germany campaign. No readiness or career outcome is fabricated in production.

P3: count copy can use plural units at a count of one; raw ISO date formatting remains on some historical rows. These do not block the approved workflows.

final result: passed


# UI/UX refinement pass — 13 October 2026

Scope: continue the approved D05/D07/D09/D12 layout; correct evidenced spacing, image visibility and empty-state clutter. Existing stores and workflows are reused. Preview: `http://127.0.0.1:4200/motivation`.

## Captured flow and findings

1. Motivation resting state (`01-motivation-before.jpg`): P2, the story padding had been set to zero, placing headings and dividers against the card border. Fixed to 24px desktop/20px phone padding and an 8px card radius; removed the redundant page subtitle.
2. Supporting image open (`05-image-before.jpg`): P2, the figure was 0px tall because its children are positioned absolutely and its minimum height was overridden to zero. Restored an explicit aspect ratio and minimum visible height. A first phone iteration revealed a 320px figure inside a 246px parent; explicit width 100% fixes this. Final measured phone figure is 246×180px, wholly inside its parent.
3. Library empty (`03-library-before.jpg`): P2, a dashed icon box inside a second card dominated the empty page. Library now uses the shared EmptyState's opt-in plain appearance with a direct New item hint. Other consumers keep their existing framed appearance. New item still opens the contextual editor.
4. Health empty chart (`02-health-before.jpg`): P3, excess empty-chart height delayed the dated records. Reduced empty-message height/padding and retained chart metric, range, coverage and record action. The same compact treatment applies to shared progress surfaces.
5. Settings (`04-settings-before.jpg`): the rendered account form remains readable and grouped. No change from this review. Pseudo-element plus signs in the accessibility snapshot were not visible in the rendered page and were not treated as a visual defect.

## Comparison and verification

Evidence lives in `artifacts/ui-ux/refinement-2026-10-13/`. `01-motivation-comparison.png`, `02-health-comparison.png` and `03-library-comparison.png` put the baseline at left and revised production page at right. Captures were normalized to 1280px CSS width/DPR 1 and shown at half size; Library's baseline viewport height is 720px versus 866px after, so only content/card regions are compared. The first mismatched tablet/desktop comparisons were discarded and regenerated. These are defect-correction comparisons grounded in the approved layout, not a new pixel-identical visual proposal.

Opened all combined comparison images and the final phone image screenshot. Typography retains Inter/Space Grotesk and the existing type hierarchy. Insets and dividers now align; colors remain the approved light tokens and teal. The real supporting photograph preserves object-fit cover and source attribution, with no added substitute artwork. Copy is shorter, and the primary goal/library actions remain clear. Full-width comparison views show the scoped changes; the 320px image capture supplies focused imagery/control evidence.

UI checks: open/collapse supporting image; reminder save state; Library New item and editor close; Health metric and 7-day range; six other phone routes (Library, Health, Progress, Today, Tasks, Settings) without horizontal overflow. Final desktop and phone consoles report zero errors/warnings. Explicit phone image bounds pass. TypeScript, ESLint, production build and diff whitespace checks pass. No new unit tests were added for these reversible presentation changes. Authenticated cloud operations and the standalone Playwright suite were not exercised.

All scoped P2 findings are resolved. The checked controls remain at least 44px tall; this does not claim complete accessibility compliance. Final review uses an isolated local build, not a deployed production change.

final result: passed


## Publication verification — 13 October 2026

The user authorized final pass, commit, push and merge. Final rendered checks reconfirm Motivation image bounds (420px tall on desktop, within its container) and Library contextual-editor open/close; console is clean. TypeScript, lint and 58 focused Node regressions pass. The last production build and responsive captures cover the exact refinement code. Repository CI will verify the complete branch, including its full E2E suite, before merging.


The final publication pass also updates older E2E expectations to the approved layout: Tasks owns scheduling; the dashboard displays selected daily readings; task date/tag filters are under Filters; optional imagery is explicitly opened; Motivation links say Open Roadmap. Numeric record and persistence checks remain, with a phone image-container-bounds regression added. Full-suite verification runs in repository CI.


CI publication follow-up: the complete 329-test run exposed a real narrow-phone dock-label issue with web fonts unavailable (Roadmap label 63px inside a 58px slot). Preserve 72px slots for the longer Roadmap/Progress names; other destinations retain their touch targets. Update stale contextual-flow expectations and use semantic combobox selectors. Date-based tests wait for their mocked client date/seeded readings before interacting, rather than clicking the server-rendered version during hydration. No test is skipped or removed.


The final pass reproduced the Progress through-date issue in the in-app browser: the native date value changed but the period and URL did not. Handle both input and change with a captured, validated date. A fresh production build now changes the period to 6 August–4 September 2026, persists the date in the URL and restores 13 October via Back to today. Console is clean. The E2E test checks period, URL and restoration.

## 2026-10-13 — Germany photographs above Motivation text

User-directed refinement: “motivation should have beautiful Germany images, text below”. Source truth is the captured existing NOVA screen plus this scoped direction (`docs/superpowers/specs/2026-10-13-motivation-germany-images.md`). The optional supporting-image disclosure is intentionally replaced by a visible Germany gallery above all goal/reminder/action text.

Evidence directory: `artifacts/ui-ux/germany-motivation-2026-10-13/`.

- Full comparison: `before.png` (1280×878) and `desktop-final.png` (1280×1346), combined in `desktop-comparison.png` (2560×1346). Both captured at 1280×720 CSS pixels, density 1, light theme, default general goal, same dated reminder, /motivation. Full-page heights differ intentionally because the requested lead photograph adds a region; the shorter image is padded for comparison.
- Focused responsive comparison: `phone-comparison.png` (640×844), initial and final 320×844 states, density 1. Final selector fits one row; all three buttons remain 44px tall. `phone-390-final.png` verifies the wider phone crop. Original full-page phone captures place the fixed dock within the expanded page image; final phone evidence uses viewport captures to avoid mistaking this capture behavior for overlap.
- Failure comparison: `recovery-comparison.png`, captured at 1280×720 CSS pixels then normalized equally to half scale. Initial broken-image state, final recovery message, and successful selection of Eibsee were inspected. Asset was temporarily moved only for this local failure check, then restored and decoded again by the asset test.

### Comparison history and findings

1. [P2] The intrinsic image height exceeded its 460px container and clipped the photograph. Fixed by making the image fill its positioned container; final image bounds are 460px tall and the goal starts below the photograph/caption.
2. [P2] The Berlin selector wrapped onto a second row at 320px. Reduced horizontal button padding on phones; final DOM bounds confirm all three share the same row with 44px height and scrollWidth equal to 320.
3. [P2] An initial image failure before hydration left broken-image chrome. Switched to the existing Next Image component, whose mount behavior replays early errors. Final initial-load failure shows a readable recovery message, hides the missing-photo credit, and selecting Eibsee loads a full 1800px photograph. The goal, reminder and next-step controls remain usable.

### Required fidelity surfaces

- Typography: existing Inter/body and Space Grotesk/display hierarchy retained; existing goal and reminder wrapping remains consistent. Quiet 13px location and 11px source credit are below the photo. Selector labels remain readable at 320px.
- Spacing/layout: existing rail, content gutters, story padding and card radius retained. Desktop image is a bounded panorama; phone image is 4:3 with the castle focal point retained. Text has no image overlay. No horizontal overflow at 320px or 390px.
- Colors/tokens: existing NOVA light surfaces, borders and teal selection/focus tokens retained. No decorative chart or synthetic image fallback introduced.
- Assets: three actual, verified Germany photographs, locally bundled WebP, direct photographer/source attribution, descriptive alt text. Castle default, Eibsee and Berlin manually selected; no timer or automatic transition. Source/license details are in `public/images/motivation/README.md`.
- Copy/content: saved goal, purpose, reminder and milestone behavior preserved independently of the Germany visual selection. Existing saved/personal reminder dialog retained.

### Verification

Passed: production build including TypeScript; ESLint; bundled photo contract (demonstrated red before assets, green after); diff whitespace check. Browser verification covered all three photo choices, active selection/credit, desktop/320px/390px layouts, Another reminder, Save and the saved reminder dialog, and initial photo-failure recovery. The healthy final preview has no browser warning/error logs. Expected missing-image server errors were confined to the intentional recovery check.

Regression specs updated for image-first ordering, manual-only switching, local image availability, private-goal preservation, recovery and responsive bounds. The complete Playwright suite has not been run for this local revision; it remains a CI verification step when published. No residual P0/P1/P2 visual findings.

Publication follow-up: CI run 38403299321 passed 327 of 329 browser tests. Two assertions needed to follow the requested design and native image behavior: general-goal neutrality now applies to the story text while Germany photo captions remain visible; the exact bundled image path accepts the absolute URL written by Next Image during mount. Gallery actions, responsive bounds, failure recovery and other page tests passed. The corrected commit runs through the full CI suite again before merge.

final result: passed


## 2026-10-15 — Full workspace cleanup, local handoff

Scope: the approved C01–C16 design in `docs/superpowers/specs/2026-10-14-nova-clean-app-design.md`, implemented on `fix/nova-clean-app`. This pass gives each page a primary task, removes duplicate date/navigation/empty-stat scaffolds, and moves optional configuration and row operations behind contextual controls. Saved records, curricula, assessment rules, sharing boundaries and the Germany gallery are preserved. The separate 60-hour career timetable remains a review draft in the private Bible workspace; it is not bundled into this public repository or imported into an account.

### Visual evidence and findings

Baseline: `artifacts/ui-ux/clean-app-audit-2026-10-14/`. Final evidence: `artifacts/ui-ux/clean-app-implementation-2026-10-14/`. The baseline and final local empty states span the 14–15 October date rollover. They are layout comparisons, not identical dated-data snapshots.

- Opened and inspected the primary, health, tools and phone overview images. The scan covers 19 default desktop routes plus Motivation, and 18 default routes at both 320px and 390px. No document horizontal overflow was observed.
- Opened `food-before-after.png` and `hub-before-after.png`: normalized 390px phone viewport comparisons with the surrounding application context. Food now has three primary views, one capture action, a compact empty summary and contextual review controls. Today now has one date control, week dates and the day's agenda without the repeated date and empty chart scaffold.
- Inspected populated dark-mode Food, Goals, Tasks and Motivation at desktop and 390px. `food-populated-390-final.png` verifies the compact calories/protein summary above actual meal rows, including the recorded 195 kcal chart. Full nutrient detail remains in Nutrients.
- Existing Inter/Space Grotesk typography, NOVA surfaces, teal selection/focus tokens and Germany image assets are retained. No new palette or generated artwork was added. Optional controls retain readable labels and touch targets. This is scoped layout/focus evidence, not a complete accessibility certification.
- Fixed a real menu/dialog focus-return defect: closing Personal reminders now returns focus to Reminder actions. Fixed Settings query/hash navigation so history settings opens Data. Reflection history selection updates the date URL and reloads the same entry; its regression failed before the correction and passed afterward.

### Verification and limitations

- Latest production build: passed, 47 routes. TypeScript and ESLint passed; external baseline-browser-mapping/pnpm metadata notices remain. Diff whitespace check passed.
- Focused Node domain tests: 50/50 passed, covering progress metrics/date gaps, fasting, nutrition reuse, record merging, timetable, navigation and Germany execution contracts.
- Full local browser suite: 329/329 passed in 2.0 minutes before the final Food and reflection refinements. After those refinements, all 45 affected nutrition/personal-tracking tests passed and the final editor/progress/daily/workspace group passed 43/43 in 13.5 seconds, including the new reflection history/reload regression. The complete 330-test suite has not been rerun at the final revision.
- Browser regressions use isolated local storage and local mode. Responsive regression coverage includes 320px, 390px, 768px and 1440px in both themes. Manual captures include empty and populated states; interaction checks cover recording, dates, menus, dialog return, reminders and contextual navigation.
- Owner-authenticated campaign data, live cloud sharing and connected-device operations were not verified. No account records were migrated or deleted. No commit, push, merge or production deployment occurred in this pass. The final local preview remains available at `http://127.0.0.1:4221/hub`; the temporary viewport override was reset.

Final local result: passed for the scoped cleanup and recorded checks. Production/account-specific gates remain unverified.


## 2026-10-15 — Detailed career timetable

The full-stack / 60-hour design was approved through “continue”. The implementation adds an optional validated private assignment extension, shared detail presentation in Today/Plan/Roadmap, per-assignment evidence and weekly groups. Existing 50-hour plans remain usable. Source readings retain the dated study return context; internal guide links restore the same guide after reload. Past dates, weekly evidence and exam criteria/attempt IDs are preserved. No personal payload is bundled in the app.

The generator rejects incomplete dates, wrong budgets, overlaps, missing steps and unsafe links before writing a new private artifact. The actual output contains 72 workdays/526 assignments; all 86 distinct study links resolve locally. Calendar authoring fixes remove accidental next-week headings from assignment text and handle the two full-loop Fridays. Extra repeated timing prose is removed from the brief because the numbered steps already show it.

### Visual evidence

Evidence is kept in the canonical private Bible reports directory (`80-lanes-abroad-full-stack/personal/reports/`), rather than duplicating personal timetable content in this public repository:

- `detailed-job-timetable-plan-desktop.png`: collapsed assignment rows with time, title, outcome and aligned chevron.
- `detailed-job-timetable-assignment-phone.png` and `detailed-job-timetable-assignment-phone-detail.png`: 390px context plus the expanded real Type Narrowing/Zod assignment, clickable chapters, numbered steps and saved artifact.
- `detailed-job-timetable-week-phone.png` and `detailed-job-timetable-week-320.png`: compact date groups and the 60-hour weekly budget. Sunday has no required assignment.

Opened the desktop and expanded phone screenshots. The existing typography, palette, page gutters, navigation and progress placement are retained. The phone review uses the real plan in disposable local storage; the fixture encoding was corrected before the final captures. Rows have clear touch targets and no native disclosure marker on a separate line. The empty personal-activity panel is hidden beside a full job timetable. Document bounds match 390px and 320px; healthy preview logs contain no warnings/errors. The viewport override was reset.

### Final checks

Production build, TypeScript, ESLint and diff whitespace checks passed. `pnpm test:germany-roadmap` passed 9 authoring and 30 domain cases. The **complete final browser suite passed 334/334 in 2.0 minutes**, covering the earlier cleanup and this timetable implementation. The prior 332/333 run exposed a legacy row-label selector after adding a time label; keeping that label in its own span restores the full existing study/exam workflow. The new Week behavior was also demonstrated failing before implementation. No browser cases were skipped or removed.

Local preview only. The canonical baseline and saved account timetable have not been replaced; no cloud import, message, application, post, OSS submission, commit, push, merge or production deployment occurred. Live cloud/account-specific operations remain unverified.


## 2026-10-15 — Timetable refinement and resume consistency

Continued within the approved clean-app and detailed-assignment design. Replaced clipped, mid-word outcome strings with complete action sentences. Expanded rows hide the repeated compact outcome. Saved evidence and verified evidence now have distinct labels across Today/Plan/Roadmap, with small actual per-day progress on the week view and an explicit displayed date range. No zero-progress panel or new configuration surface was added. Application instructions link to claim preparation and identify the correct private EU CV; the existing 60-hour allocation is unchanged.

The source walkthrough and a red browser test exposed same-route week-to-assignment navigation not opening its evidence form. Query observers now respond to client navigation, and the selected valid assignment receives keyboard focus and a scroll offset below the phone header. The test verifies form visibility, focus, viewport position and reload restoration. No unrelated record is used as completion evidence; editing a verified note returns it to saved.

Private evidence directory: Bible `80-lanes-abroad-full-stack/personal/reports/ui-refinement-2026-10-15/`. Opened `assignment-phone-final.png`, `plan-phone-final.png` and `week-phone-final.png`. The captures retain the NOVA shell, original typography, palette, gutters and navigation. `week-320-final.png` and `week-desktop-final.png` provide additional bounds/context evidence. The local saved note explicitly says it is a QA sample, not completion of the user's study assignment. Browser bounds match 390px and 320px with no horizontal overflow. Healthy preview logs contain no warnings/errors. The temporary viewport override was reset.

Resume source/PDFs are canonical in the private Bible and accessed by resume-generator symlinks. Candidate confirmation establishes March 2025 promotion. The PDF role lines now show Senior Software Engineer (Mar–Jul 2025) and Software Engineer (Oct 2021–Feb 2025), retaining shared MAQ bullets and all existing truthful claim boundaries. All three final rendered PDFs were inspected; no font/margin reduction or clipping. The phone-free public export matches `public/VamsiKrishna_Resume.pdf`, and the local portfolio role text reflects the same promotion month. The active private profile no longer feeds unsupported historical performance percentages into new generated material. No historical sent application was rewritten.

Final checks: production build, TypeScript, lint and whitespace checks passed. **336/336 browser tests passed in 1.7 minutes** at the final application revision. **41 career/authoring checks**, **8 resume generator/cover-letter tests**, **4 claim/synchronization tests**, and the three final PDF structural verifications passed. Private personal-data doctor passed. All 87 distinct study links in the new private payload resolve to canonical files. These checks establish local behavior/artifact consistency, not independent employment verification, universal production guarantees or account-specific cloud readiness. No cloud import, outbound communication, commit, push, merge or deployment occurred.

## 2026-10-15 — Final audit

Opened the remaining desktop and 320px week screenshots, checked Sunday recovery and the post-campaign next-cycle message, and rechecked the public resume SHA-256 against its canonical phone-free export. Found one authoring conflict: the generic mock steps compressed scoring into the full R3/R5 interview block on 19 December and 2 January. Corrected the three relevant assignments on each date to match the existing exam guide: R3/R5 attempts at 10:15–11:45; R6 plus its scoring at 14:30–15:30; ten minutes each for R3 scoring, R5 scoring and planning at 15:30–16:00. Titles, brief, steps and deliverables agree, with one exam-guide link per relevant assignment. IDs, times, budgets and existing assessment rubrics remain unchanged.

New regression failed before the fix and passed afterward. **42/42 career/authoring tests passed** (11 authoring, 31 domain). Generator syntax and whitespace checks passed. The private payload remains 72 workdays/526 assignments with 87 resolving local study targets. Application source and resume PDFs were unchanged in this bounded audit; the prior 336/336 browser run and build/type/lint evidence still apply to that application revision and were not repeated.

Inspected the updated actual assignment at 390px; final capture is private Bible `personal/reports/ui-refinement-2026-10-15/full-loop-phone-final-pass.png`. Disposable local preview storage was refreshed, removing the earlier QA-only evidence note. Viewport reset and preview retained. All changes remain local and uncommitted; no production account import or deployment occurred.

## 2026-10-15 — Hiring plan and independent-venture resume

The new user request strengthens the existing approved Germany/full-stack/60-hour design. Future application briefs now start with actual employer stages/replies and a suitable live, eligible, unsubmitted requisition; historical employer pairs are optional leads. First-week project blocks package supported Docita/NOVA evidence immediately. Workstream-specific prerequisites and blocked actions replace the generic repeated instruction. The generated campaign guide states current capacity before the retained historical source. All 72 workdays, 526 assignment IDs, slot durations and original assessment definitions remain intact; 87 study targets resolve locally.

Candidate confirmation establishes full Docita application ownership and the attempted commercial venture. The CV/portfolio now label it an independent SaaS venture, with current React/Vite implementation wording. All three one-page A4 exports were regenerated, structurally verified and visually inspected; body type and margins remain unchanged. The canonical public export omits phone contact and matches the portfolio bytes. MAQ's March 2025 promotion stays scoped correctly. Active private profile/Markdown/mode inputs agree; historical application documents remain snapshots.

Fresh Docita source inspection and 104 passing focused tests support the technical stories and expose stale claim-fencing prose in two Bible chapters, now corrected. These are implementation/test checks, not production database/concurrency or commercial-outcome verification. The Docita checkout remains unchanged.

Final production build, TypeScript, lint, syntax and whitespace checks passed. **336/336 full browser tests passed in 2.4 minutes** on the final portfolio revision. **43 career/authoring tests** and **13 resume generator/cover-letter/claim tests** passed. Private personal-data doctor and YAML parsing passed; Bible internal link checks passed with external probes skipped. Known Node/pnpm/baseline-browser-mapping notices remain.

Manual phone inspection covers the regenerated real application assignment, safe linked sources, readable steps and supported draft/submitted status boundaries. Final private capture: `personal/reports/ui-refinement-2026-10-15/hiring-application-phone.png`. Viewport reset, local preview retained. All work remains local and uncommitted. No cloud account import, application/message/post/PR submission, production deployment, push or merge.
## 2026-10-15 — Urgent campaign synchronization release

The user requested synchronization of the active private Bible campaign with personal.buildora.work. This release includes the previously approved cleanup and detailed-assignment refinements above. The new version-two timetable preserves older assignments and assessment definitions, adds dated applications/outreach/OSS and focused practice, derives career targets from the reviewed allocation, and labels the retained weekly brief historical. Current assignment links open the current campaign and full learning commands. Personal content and generated payloads remain outside this public repository.

Final local release gates passed: **340/340 browser cases**, **52 career/authoring cases**, **18 curriculum/sync cases**, **24 access/service-worker cases**, production build, TypeScript, ESLint and whitespace checks. The generated curriculum matches the current canonical Bible and includes no personal chapters. The private output validates with 72 workdays and 572 assignments; regular and assessment-exception weeks retain the 60-hour budget. Historical days, IDs, forms, versions and practices remain intact.

The owner-only release script makes a private backup, applies two compare-and-swap updates and verifies every owner row. Actual deployment/import evidence is recorded in the canonical private synchronization report; local browser tests do not establish an authenticated production visual check.

## 2026-10-16 — Timetable final pass

The weekly Saturday view now uses the shared expandable assignment rows, saved evidence status and evidence links. Study return links use Saturday's date even when another weekday is selected; legacy Saturday rendering also carries its own date. Both browser regressions failed on the wrong date before the fix and pass afterward. The authoring correction replaces inherited task deliverables and prerequisites in the one-time practice sprint and aligns full-loop scoring instructions with the existing time block. Assignment IDs, ranges, minutes, budgets, assessment definitions and historical assignments remain intact.

Today's primary commitment now reuses the same dated career assignment as its agenda row, with focus and evidence navigation. A regression first reproduced the incorrect general-curriculum destination; generic study retains its original destination. Saturday's expanded assignment and evidence form also fit within a 390px viewport.

The full regression exposed selected-date clipping after a rapid 320→390→320px resize: the browser reset horizontal scroll while ResizeObserver saw the original final size. The existing reveal handler now also listens for window resize, with matching cleanup. The unchanged strict regression failed four of five isolated pre-fix attempts, then passed all five after the repair.

Focused checks passed: 30 related browser cases, 54 career/authoring cases, production build, TypeScript, ESLint and whitespace. Real-plan visual evidence and actual deployment/import results are recorded in the private Bible final-pass report. No personal payload or screenshot is added to this public repository.
