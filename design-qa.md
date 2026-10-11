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
