# Anime Dossier Personal Suite Redesign

## Product thesis

The Personal Suite becomes a living anime-inspired dossier for the user’s real life: fasting, workouts, tasks, goals, motivation, and quick captures are chapters in one ongoing story. The interface should feel authored and cinematic, not like a generic productivity dashboard. Every screen should answer one motivating question: “What is my next move?”

The approved visual direction is **Shonen Dossier**: dramatic manga-scale typography, serialized chapter language, neon red and acid-lime signal colors, dark archive surfaces, sharp panel geometry, expressive motion, and a restrained recurring protagonist/mascot motif. The style takes inspiration from KPR’s lore-driven console framing and Don’t Board Me’s oversized editorial rhythm, while keeping the product’s interactions direct and accessible.

## Scope and rollout

This is a product-wide redesign split into independently shippable phases:

1. **Foundation:** visual tokens, typography, app shell, responsive tracker navigation, panel primitives, motion rules, and shared loading/empty/error states.
2. **Command Deck:** redesign `/trackers` around the next move, daily chapter, momentum signal, and cross-tracker quick actions.
3. **Motivation Focus Scene:** redesign `/motivation` as a full-viewport inspirational scene centered on the current goal, with browser fullscreen entered only after the user activates Focus mode.
4. **Share Arc:** implement hard limits, automatic link creation, email allowlists, optional public links, private media delivery, access-aware `/shared-with-me`, and the redesigned Share surfaces.
5. **Tracker chapters:** carry the system through fasting, workouts, goals, todo, settings, portfolio pages, and onboarding without changing existing stored data contracts unless a migration is required.
6. **Polish and release gates:** responsive QA, keyboard and screen-reader QA, reduced-motion QA, E2E coverage, build/lint verification, and production configuration notes.

## Visual system

### Palette

- Archive black: `#08090D` for the main field and immersive scenes.
- Ink violet: `#2424D7` for depth, links, and secondary energy.
- Signal red: `#FF435E` for urgent actions, active chapter markers, and dramatic emphasis.
- Acid lime: `#C4FF48` for completed progress, streaks, confirmations, and “next move” affordances.
- Paper white: `#F8F3EB` for primary type on dark surfaces.
- Muted steel: `#8F929B` for utility metadata and supporting copy.

The accent system must remain legible in both themes. Color is never the only state indicator; pair it with text, icons, borders, or shape changes.

### Type

- Display: a condensed, expressive display face for chapter titles, hero statements, and large numbers.
- Body: a highly readable sans-serif for controls, form fields, and explanations.
- Utility: a monospace face for timestamps, sync state, limits, access labels, and system-log flavor.

Typography uses sentence case for instructions and controls. Uppercase is reserved for short utility labels and chapter metadata. Copy should be specific and motivating without inventing artificial urgency.

### Layout and motion

Use asymmetrical editorial compositions, manga-like panels, clipped accents, offset borders, and occasional full-bleed sections. Avoid default three-column card grids as the primary structure. Cards remain available as content containers, but the page should read as a sequence of authored panels.

Motion is used for one clear purpose per interaction: chapter reveal, progress confirmation, scene transition, or focus. Respect `prefers-reduced-motion` by disabling parallax, looping effects, and non-essential transforms while preserving state changes and focus visibility.

## Shared app shell

Replace the current utility-first tracker shell presentation with a responsive command rail:

- Desktop: logo, chapter marker, primary routes, current streak/momentum signal, auth/theme controls.
- Mobile: compact logo and signal, a bottom command dock for the highest-frequency routes, and a menu for the rest.
- The current sync badge moves out of the page hero into the utility rail. It remains visible and has explicit text for local, syncing, synced, and error states.
- Every page gets a chapter eyebrow, one strong title, one next-action sentence, and a contextual action region.
- A global quick-capture command palette is a later Foundation/Command Deck feature and should open from keyboard shortcut plus an accessible button.

The shell must keep existing route URLs and preserve navigation semantics for keyboard and screen-reader users.

## Command Deck (`/trackers`)

The hub becomes a “daily episode” rather than a statistics wall.

- Lead with the current goal title, the next concrete action, and a large momentum signal.
- Render fasting, workout, todo, and goal progress as four named story beats around the main signal.
- Keep quick task, metric, fast, and workout actions visible near the lead action.
- Add a daily chapter summary assembled from existing activity data, with empty-state copy that gives the user one clear starting action.
- Add a weekly review panel that turns the existing weekly metrics into a short narrative with one suggested focus.
- Keep existing tracker calculations and stored keys stable while changing their presentation.

## Motivation Focus Scene (`/motivation`)

The Motivation route is an immersive goal scene, not a list of quotes.

### Entry state

The page fills the viewport below the app chrome with a cinematic background treatment derived from the approved palette. It shows:

- Current goal title and category.
- Goal progress and the next milestone.
- A large daily affirmation or custom quote.
- Current streak and a single “next move” action.
- A clear `Enter Focus Mode` button.

The page must not call the browser fullscreen API on load because browsers require a user gesture. On activation, `requestFullscreen()` is called on the focus scene when supported; if unavailable, the page still uses its full-viewport layout. The control changes to `Exit Focus Mode`, and `Escape` exits through the browser’s native behavior.

### Focus mode behavior

- Hide nonessential chrome while retaining a compact exit control and accessible status announcement.
- Keep the goal and affirmation centered with deliberate type scale and generous negative space.
- Provide `Start next action`, `Shuffle affirmation`, `Save affirmation`, and `Open goal` actions.
- Use a short entrance sequence and a static reduced-motion fallback.
- Keep journaling, custom affirmations, and saved fuel below the immersive scene so the primary emotional moment is not diluted.

## Share Arc

### Limits and storage copy

Replace “Zero-cost storage strategy” with a concise **Storage limits** panel:

- 50 active drops maximum.
- Signed-in image limit: 5 MB per image.
- Local-only image limit: approximately 1.2 MB.
- Browser storage indicator: current usage versus 5,000 KB.
- Expired drops clear from the active list automatically.
- Export JSON backup remains available and is positioned beside the limits summary.

The UI should show limits before the user saves, including an inline warning when the drop cap or image limit is close. Do not frame the product around provider pricing or “zero cost.”

### Auto-clear control

Use an explicit fieldset-style control titled **Auto-clear this drop** with three equally sized options: `24 hours`, `7 days`, and `30 days`. The selected option must have a label, selected state, and expiration summary such as “Clears Thu, Sep 24 at 14:30.” The control must wrap cleanly on mobile and not be nested inside an unrelated label.

### Share flow

Clicking `Share` opens an inline panel or dialog for that drop and immediately presents two access modes:

1. **Specific people:** email input with add/remove chips. Only signed-in users whose authenticated email matches an allowlisted address can read the share record. These records appear on `/shared-with-me` for the matching users.
2. **Anyone with the link:** explicit opt-in that permits signed-out visitors with the link to read the share record.

Every share action creates a shareable link automatically after the user confirms access. The interface then shows the link, copy action, current access mode, expiry, and `Revoke link`. Updating the email list updates the existing record. Switching to public mode updates the same record instead of creating duplicates.

The page must make the permission consequence explicit: “Anyone with this link can view it” versus “Only these signed-in emails can view it.”

### Private media delivery

The `drops` storage bucket becomes private. Shared records store an image path, not a public object URL. The authorized share-detail loader returns a short-lived signed media URL for the viewer. Public links use a server-side share endpoint that verifies the public share record and creates a bounded signed media URL without exposing service credentials to the browser.

Database row-level security remains the source of truth for private rows. Public rows require an explicit `is_public` flag and an unexpired timer. Owner management remains restricted to the owner. Expired rows must not be returned to viewers and must be cleaned up opportunistically by the owner’s Share page.

### Shared with me

`/shared-with-me` is an authenticated inbox. It must query only rows the signed-in user is permitted to read and group them by sender. Each item shows content type, sender, expiry, and an access indicator. Empty, loading, and failed queries get distinct states. A revoked or expired item should disappear on refresh and the detail route should show a clear access-denied state.

## Tracker chapter upgrades

- Fasting: make the active timer the lead scene, surface the next phase, and use the chapter language without changing timing calculations.
- Workouts: show the current session as a progression sequence with clear set completion and a celebratory completion state.
- Goal: make milestones visually central and expose the goal as the data source for Motivation Focus mode.
- Todo: add stronger priority and “next action” hierarchy, while keeping quick completion one tap away.
- Settings: group preferences by identity, goals, motivation, and data controls; expose export and sync status together.
- Portfolio/about pages: bring the same typography and motion grammar into the public-facing site while keeping professional readability and contact actions clear.

## Data and component boundaries

- Shared UI primitives: `CommandShell`, `ChapterHeader`, `SignalPanel`, `StoryPanel`, `FocusScene`, `AccessModeFieldset`, `LimitMeter`, `ExpiryPicker`, and `SyncStatus`.
- Share domain helpers: limit calculations, expiry formatting, email normalization, public/private access mode, and storage-path/signing helpers live outside the page component and are unit-testable.
- Keep `useSyncedStorage` as the persistence boundary for local/cloud tracker JSON unless a feature requires a dedicated table.
- Add a dedicated server share route for public media signing rather than putting service-role credentials or signing logic in client components.
- Preserve current localStorage keys and existing tracker JSON shapes. New fields must be optional and backward compatible.

## Error and edge-state behavior

- Hard limit reached: disable save, show the exact limit, and link to export/delete actions.
- Image too large: reject before upload and show the signed-in/local limit that applies.
- Share creation failure: keep the editor open, retain email drafts, and explain whether the database migration or sign-in is missing.
- Public share fetch failure: show a neutral unavailable state without leaking whether a private record exists.
- Signed media failure: show the text content and a bounded media error state where possible.
- Sync failure: keep local changes visible, show a clear retry/status affordance, and never silently claim synced.

## Accessibility and responsive requirements

- All focus-mode and share controls are keyboard reachable with visible focus rings.
- Dialogs trap focus, restore focus on close, and announce success/error toasts.
- Do not rely on color, animation, or hover alone to communicate progress or access.
- Maintain readable body text at mobile widths and support landscape phones for Focus mode.
- Test at narrow mobile, tablet, desktop, and reduced-motion settings.

## Verification and release gates

- Unit tests for limits, expiry, email normalization, access-mode transitions, goal-to-motivation derivation, and fullscreen fallback behavior.
- E2E coverage for creating a drop, hitting the 50-drop cap, image limit rejection, auto-clear display, private share visibility, public share visibility without sign-in, revoke behavior, Shared with me filtering, and focus-mode entry/exit.
- Run `pnpm lint`, `pnpm build`, and the Playwright suite with Supabase-configured and local-mode environments where supported.
- Manually verify screenshots at mobile and desktop widths plus `prefers-reduced-motion`.
- Supabase rollout order: storage bucket/policy migration, shared record migration, server signing route configuration, then client deployment.

## Definition of done

The redesign is complete when the product feels like one intentional anime-inspired world across public and private routes, Motivation can become a real full-screen goal scene through a user action, Share always produces a link with explicit access choice, limits are visible before failure, private media is not publicly exposed, `/shared-with-me` reflects actual allowlist access, and all existing tracker workflows remain usable and verified.
