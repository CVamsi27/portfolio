# NOVA//OS Repo-Wide Editorial System Design

**Date:** 2026-09-17  
**Status:** Approved direction, pending written-spec review  
**Scope:** All user-facing routes in the portfolio repository

## Intent

Make the entire repository feel like one authored digital universe: editorial, cinematic, modern, expressive, and unmistakably intentional. The design should take inspiration from the references’ confidence, oversized typography, world-building, pacing, and interaction choreography without copying their content, layout, assets, or brand identity.

The product is not a dashboard with decorative anime styling. It is a visual operating system for progress. Every screen should answer one of three questions:

1. What chapter am I in?
2. What matters right now?
3. What can I do next?

## Product boundary

The repository contains two experiences:

- **Public dossier:** Vamsi Krishna’s portfolio, résumé, experience, projects, skills, and contact.
- **Personal operating system:** NOVA//OS trackers, motivation, sharing, onboarding, settings, and PWA surfaces.

The visual language is shared across both experiences, but identity and content remain distinct. Portfolio routes must continue to present Vamsi Krishna. Tracker routes must continue to present NOVA//OS. Existing local data, share links, backup files, Supabase rows, deep links, and the no-sign-in-required local mode remain compatible.

## Design thesis

The repo should feel closer to an interactive editorial publication or game dossier than a conventional SaaS admin panel. The interface should use composition, typography, rhythm, and carefully staged reveals to create motivation. Controls remain obvious and accessible inside that world.

### Signature moves

- Full-bleed opening statements rather than a grid of equal cards.
- Oversized display typography that carries hierarchy and personality.
- Asymmetric composition with one dominant visual anchor per screen.
- Technical microcopy: chapter labels, timestamps, status lines, indexes, and progress marks.
- Strong page-to-page continuity: a route feels like the next chapter, not a separate template.
- Revealable command layers so the interface can be dramatic without becoming hard to use.
- Purposeful motion: one choreographed entrance or transition per major surface, with an instant reduced-motion equivalent.

Cards are not prohibited, but they are demoted to dense control surfaces, small data clusters, or secondary details. No page should be a repeated stack of rounded gradient cards.

## Visual system

### Color roles

- **Archive black `#071014`:** primary dark canvas, focus surfaces, navigation chrome.
- **Paper `#F2EEE6`:** editorial light canvas and portfolio contrast mode.
- **Signal cyan `#49E7FF`:** active links, system highlights, focus rings, live state.
- **Acid lime `#C8FF3D`:** progress, completed states, streaks, positive momentum.
- **Anime red `#FF554D`:** primary action, urgency, selected risk, destructive emphasis.
- **Ultraviolet `#8C7DFF`:** secondary depth, ambient glow, selected chapter accents.
- **Ink `#111111` and mist `#7D8A94`:** readable light-mode foreground and muted utility text.

Colors are semantic tokens, not one-off decoration. Decorative gradients, grain, diagonal rules, and glow effects must not carry essential meaning or reduce contrast.

### Typography roles

- **Editorial display:** condensed, expressive, high-impact. Used for product names, hero statements, chapter titles, and key numbers.
- **Interface sans:** clean, modern, highly readable. Used for descriptions, controls, forms, and navigation.
- **Utility mono:** precise and technical. Used for timestamps, counters, sync state, file limits, and metadata.

Typography should create a three-level rhythm: a dramatic thesis, a calm explanation, and precise system detail. Avoid all-caps paragraphs, excess tracking, and typography that looks like a developer placeholder.

### Spatial language

- Default desktop canvas: wide editorial frame with generous outer margins.
- Dominant content: one large statement or action per viewport.
- Supporting content: offset columns, narrow annotations, indexed sections, and progressive disclosure.
- Dividers: thin rules or color bars that communicate sequence, state, or ownership.
- Corners: mostly sharp or lightly cut; rounded shapes are reserved for interactive controls and focused data clusters.
- Textures: subtle diagonal field, grain, offset shadow, or scanline treatment; no visual noise behind essential text.

## Shared component architecture

Create a small set of compositional primitives rather than styling each route independently:

- `EditorialFrame` — full-bleed canvas with light/dark mode, texture, and responsive gutters.
- `ChapterLabel` — route/section index, timestamp, and status line.
- `DisplayStatement` — large responsive thesis typography with optional accent phrase.
- `SignalRule` — semantic divider or progress strip.
- `ActionBlock` — one primary action with supporting explanation and keyboard focus treatment.
- `IndexRail` — revealable route navigation, section index, or chapter navigation.
- `TelemetryLine` — compact metadata row for state, date, sync, or count.
- `TransmissionPanel` — goal/action/motivation composition used by the tracker home and focus scene.
- `EditorialGrid` — controlled multi-column layout for portfolio case studies, services, and dense tracker detail.

The primitives own visual rhythm and accessibility; route components own domain content and actions. Do not introduce a second state model inside visual components.

Add centralized tokens and copy contracts so repeated brand strings, color roles, and surface names do not drift. Keep storage keys such as `vk:` and compatibility discriminators such as `vk-tracker-suite` unchanged.

## Route and experience design

### Portfolio: Public Dossier

The portfolio remains Vamsi Krishna-branded but inherits the editorial system.

- Hero becomes a full-viewport dossier opening with an oversized name, role thesis, and one decisive contact/work action.
- Experience and projects become indexed chapters with large project statements, impact metrics, and progressive detail.
- Skills become a visual capability field or editorial index rather than a uniform badge wall.
- Contact becomes an invitation/dispatch panel with clear availability and form feedback.
- Navigation stays quiet until needed; desktop uses a slim index rail and mobile uses a compact command drawer.
- Preserve SEO, contact API behavior, anchor links, résumé content, and portfolio-specific metadata.

### Trackers: Daily Transmission

The tracker home becomes the default daily entrance.

- Lead with one goal story and one next action.
- Show four supporting signals: Fast, Train, Tasks, and Goal.
- Present Momentum as a transparent summary, not a mysterious score.
- Use optional goal emphasis to prioritize the user’s stated objective.
- Use daily energy mode to select an achievable recommendation without changing recorded progress.
- Allow the user to switch between “Transmission” (story-led) and “Command” (dense operational) views.
- Signed-out local mode is fully usable; cloud sync and private sharing are additive capabilities.

### Motivation: Focus Chapter

Motivation is the cinematic layer of the system, not an isolated quote page.

- Launch focus from any meaningful next action.
- Full-screen view centers the current objective, a short motivating statement, and one action.
- Visual intensity responds to progress and energy mode, not random animation.
- Exiting focus returns the user to the exact action context.
- All controls remain available through keyboard, touch, and reduced-motion states.

### Share: Dispatch Studio

Sharing becomes a deliberate publishing flow.

- Compose text or image as a visual dispatch.
- Preview the exact public/private result before publishing.
- Choose private email allowlist or explicit “Anyone with the link”.
- Set 24-hour, 7-day, or 30-day expiry with plain-language auto-clear feedback.
- Show hard limits close to the action: 50 active drops, image size limits, and browser capacity.
- Provide immediate copy-link feedback and make every created item visibly traceable.
- Keep `/shared-with-me` as a first-class incoming dispatch feed.
- Preserve private access checks, signed media URLs, revocation, expiry, and RLS behavior.

### Settings: System Control Room

Settings becomes calm and indexed rather than a long generic form.

- Group controls into Identity, Sync, Backup, Storage, Appearance, and Danger Zone chapters.
- Keep destructive actions isolated and explicit.
- Show compatibility and storage limits as understandable system facts.
- Let users configure goal emphasis and energy mode without hiding the defaults.
- Make “local-only” and “synced” states visually distinct and plainly explained.

### Login and onboarding: Entry Sequence

- Onboarding is a short, elegant entry sequence that asks only what improves recommendations.
- Login communicates that it is optional for local use and useful for cross-device sync/private sharing.
- Empty, loading, error, and not-configured states use the same editorial language as successful states.
- No auth wall should appear when Supabase is not configured.

### PWA and footer

- PWA name, icons, metadata, install prompt, and service worker identify NOVA//OS.
- Footer uses the same visual signature on every route while adapting the identity line to portfolio vs tracker surfaces.
- Service worker cache changes must invalidate stale branded shells safely.

## Adaptive action engine

The adaptive layer should be deterministic, explainable, and testable as pure domain logic.

### Inputs

- Current goal and optional goal emphasis.
- Today’s Fast, Train, Tasks, and Goal signals.
- At-risk conditions: overdue task, broken streak, expiring share, missed routine, or incomplete daily metric.
- User-selected energy mode: Low, Standard, or High.
- Time context only when it improves an existing action; never invent a deadline.

### Resolution order

1. Goal impact.
2. Risk and overdue state.
3. Energy fit.
4. Existing route-specific priority rules.

The output is one `NextAction` with a stable type, title, explanation, route, completion callback, and reason code. The UI may style the action dramatically, but it must not compute a different priority in the component.

### Momentum model

- Automatic baseline from the four tracker signals.
- Optional goal emphasis changes weights, not raw records.
- Energy mode changes recommendation difficulty and visual emphasis, not score truth.
- A “Why this score?” disclosure lists each signal, weight, and contribution.
- A completed action immediately recalculates the summary.

## Feature enhancements

These are part of the product direction, but should be implemented in bounded releases:

1. **Daily Transmission:** unified home with story statement, next action, four signals, and command-mode reveal.
2. **Explainable Momentum:** shared pure scoring and priority engine with goal emphasis and energy mode.
3. **Action handoffs:** every recommendation can open a tracker, focus scene, or share dispatch while preserving return context.
4. **Chapter history:** weekly narrative review that combines goal progress, habits, workout consistency, reflection, and meaningful shares.
5. **Recovery mode:** compassionate streak recovery that proposes the smallest valid next action after a miss.
6. **Dispatch polish:** preview, audience chips, expiry timeline, revoke state, and incoming-share feed.
7. **System personalization:** typography intensity, motion intensity, accent selection, and compact/expanded command density.
8. **Portfolio chapters:** reusable editorial layout for experience/projects/contact without changing content contracts.

Avoid adding notifications, calendar integrations, social graphs, subscriptions, or AI-generated coaching until the local-first daily loop proves useful. They are future opportunities, not requirements for this redesign.

## Data flow and compatibility

1. Existing hooks read local tracker state.
2. Pure domain selectors derive signal snapshots, Momentum, and `NextAction`.
3. Shared shells render the result through editorial primitives.
4. User actions write through existing tracker hooks.
5. Optional Supabase sync mirrors existing rows when configured.
6. Share actions continue through existing RLS and signing routes.

No new server dependency is required for the first implementation release. New persisted preferences should be versioned and migrated explicitly. Existing `vk:` keys, backup import/export schema, database columns, and share URLs remain stable.

## Motion and accessibility

- One choreographed entrance per major page; avoid simultaneous animation on every element.
- Motion communicates entering a chapter, selecting an action, or completing a signal.
- `prefers-reduced-motion` removes non-essential transforms, pulses, and reveals while preserving hierarchy and feedback.
- All important actions have visible labels; icon-only controls have accessible names.
- Focus order follows the visual reading order, even where the layout is asymmetric.
- Maintain readable contrast on both paper and archive canvases.
- Touch targets remain at least the existing project standard and never depend on hover.

## Rollout boundaries

Implement as separate releases with independent test gates:

1. **Shared editorial foundation:** tokens, primitives, navigation, footer, typography, and route shell.
2. **Daily Transmission:** tracker home, adaptive selector, command reveal, and handoffs.
3. **Focus and recovery:** motivation integration, energy mode, streak recovery, and weekly chapter review.
4. **Dispatch Studio:** share composer and incoming-share redesign, preserving all access enforcement.
5. **Public Dossier:** portfolio route composition using the shared system.
6. **Final polish:** responsive tuning, motion audit, PWA/SEO audit, and documentation.

Each release must pass the existing E2E suite plus focused tests for its new behavior. Do not merge a visual release that weakens local-only mode, share privacy, backup compatibility, or portfolio host routing.

## Verification gates

- All existing tracker, sharing, onboarding, motivation, PWA, and portfolio tests remain green.
- New tests cover `NextAction` priority, Momentum explanation, energy-mode behavior, route handoffs, and responsive editorial shells.
- Local mode works with blank Supabase variables and never forces sign-in.
- Private sharing remains email-allowlisted; public sharing remains explicit opt-in.
- Existing backup export/import accepts the unchanged discriminator and restores data.
- Portfolio host still redirects tracker paths and retains Vamsi metadata/content.
- Tracker host exposes NOVA//OS metadata, manifest, favicon, footer, and install copy.
- Reduced-motion checks pass for every new reveal or focus transition.
- `pnpm lint`, `pnpm build`, and full Playwright suite pass.

