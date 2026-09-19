# Personal NOVA//OS Focus Studio Design

## Status

Visually approved by the user; implementation pending.

## Intent

Make the private `personal.buildora.work` experience feel like one authored personal operating system instead of a collection of individually styled tracker pages. The primary redesign is `/motivation`: an image-led Focus studio that makes the current goal feel present, gives the user one visible next move, and uses category-aware public imagery without exposing personal text to external APIs.

The public Buildora portfolio at `/` is explicitly out of scope and must remain unchanged.

## Scope

### In scope

- Personal NOVA//OS navbar and shared tracker shell.
- Removing the signed-in email from the personal navbar while preserving account and sign-out access.
- Reworking `/motivation` into the approved Focus studio composition.
- Goal-category and destination-aware motivation imagery.
- Caching, refresh, attribution, image failure, and offline fallback behavior.
- Tracker-only consistency fixes for spacing, panel treatment, hierarchy, mobile navigation, and focus states where the shared shell currently leaks legacy dashboard styling.
- Regression tests for navigation, motivation behavior, responsive layout, reduced motion, and API privacy.

### Out of scope

- Any change to the public portfolio homepage or its components.
- Changes to route names, localStorage keys, Supabase schema, authentication semantics, sharing privacy, or tracker calculations.
- New notifications, social features, subscriptions, or calendar integrations.

## Experience direction

### Personal navbar

The desktop personal navbar keeps NOVA//OS branding, route orientation, theme control, and the existing tracker navigation. The signed-in email is removed from the visible rail. A compact account affordance replaces it; the sign-out action remains explicit, keyboard accessible, and discoverable. Settings continues to show the signed-in account email where account context is useful.

The mobile command dock keeps the active route clear, remains touch friendly, and does not duplicate the desktop account presentation.

### Motivation Focus studio

The scene is a deliberate two-part composition:

```text
┌─────────────────────────────────────────────────────────────┐
│ NOVA//OS rail                         route / account        │
├───────────────────────────────┬─────────────────────────────┤
│                               │ Focus transmission          │
│  destination / category image │ quote + source              │
│  goal title over image         │ next action                 │
│  visible source credit         │ progress · milestone        │
│                               │ Enter focus · Open goal     │
└───────────────────────────────┴─────────────────────────────┘
```

The image is the emotional anchor. The right-hand column turns emotion into movement by showing the current objective, one concrete next action, goal progress, and the next milestone. Fullscreen focus mode remains user-initiated; Escape and the existing fallback behavior remain intact.

On narrow screens the composition becomes a vertical story: image first, then quote and action, then supporting progress. The primary action remains visible without requiring a long scroll. Secondary quote, favorite, copy, journal, and custom-affirmation tools remain available below the scene without competing with the first action.

### Visual system

Use the existing NOVA//OS archive language as the source of truth:

- Archive background: `#071014`.
- Signal colors: cyan for orientation, lime for progress, red for action, violet only for secondary state.
- Utility typography for labels and telemetry; display typography for goal and quote statements.
- Square or compact editorial panels for surfaces; rounded corners reserved for controls, pills, and segmented choices.
- One strong border and one offset signal shadow per dominant panel; avoid stacked gradients and unrelated purple dashboard treatments.
- Visible focus rings, reduced-motion support, and touch targets that remain usable at mobile widths.

## Category-aware media

### Provider and query strategy

Use Wikimedia Commons as the primary public image source and retain the existing public quote source/local quote deck behavior. Wikimedia Commons provides a public API for searching Commons media and returning image metadata and source URLs. Queries are built only from a fixed allowlist:

- Relocation: selected destination country plus fixed terms such as `landmark`, `city`, `landscape`, or `architecture`.
- Fitness: `training`, `movement`, `strength`, `athlete`.
- Career: `craft`, `architecture`, `studio`, `progress`.
- Learning: `library`, `study`, `science`, `discovery`.
- Financial: `growth`, `building`, `horizon`, `future`.
- Custom: `sunrise`, `resilience`, `possibility`.

For relocation, the country value is resolved through the existing `RELOCATION_COUNTRIES` allowlist. A free-form goal title, user name, journal entry, affirmation, email, or other personal text is never sent to the provider.

Germany is therefore rendered with Germany-specific landmark/city/landscape imagery rather than a generic journey illustration.

### Resolver contract

Normalize provider data into a small `MotivationMedia` record containing:

- `imageUrl` and accessible `imageAlt`.
- `attribution` and a source page URL.
- `quote` and optional author/source.
- category, destination key, provider, and fetch timestamp.

Fetch image and quote independently with a short timeout and response-shape validation. A missing image must not remove a valid quote, and a quote failure must not remove a valid image.

Cache successful normalized records by personalization source, category, and destination key for 24 hours. `Refresh transmission` invalidates that scoped record and requests a new result. The cache stores normalized metadata only.

### Fallback behavior

The scene must never be blank:

1. Cached category/destination image plus local quote.
2. Remote image plus existing local quote deck.
3. Local NOVA//OS gradient treatment plus local quote deck.

When remote media is active, show a compact source credit with a link. When local fallback is active, label it as `LOCAL FALLBACK` for transparency. Image decode errors restore the local treatment without removing the goal or action content.

## Functional continuity

- Preserve existing goal progress, milestone, streak, favorites, shuffle, copy, journal, custom affirmations, and fullscreen behavior.
- Keep `Goal-aware` and `General inspiration` modes; general mode uses category-safe imagery without destination text.
- Keep local-first behavior and the current synced-storage keys.
- Keep the account email available in Settings, but not in the navbar.
- Keep existing route labels and test-critical action names unless a label change is required for the new composition.

## Verification

Add or update coverage for:

- The personal navbar does not render `data-testid="auth-email"` or visible email text while signed in.
- Settings still exposes account context and sign-out behavior.
- Motivation renders a goal-centered Focus studio with visible action, progress, quote, and source credit.
- Germany imagery requests use only the fixed country/category mapping and never include raw goal title or journal text.
- Cache reuse avoids a second request within the freshness window; refresh invalidates only the current media record.
- Malformed API responses, timeouts, and image decode failures keep a readable local fallback scene.
- Fullscreen fallback, Escape behavior, reduced motion, keyboard focus, and 390px layout remain usable.
- Existing motivation persistence and tracker navigation tests remain green.

Release gates:

```bash
pnpm lint
pnpm build
pnpm exec playwright test
git diff --check
```

## Acceptance criteria

- The public `/` experience has no changed files or behavior.
- The personal navbar no longer displays the signed-in email.
- `/motivation` feels like a purposeful focus ritual rather than a quote collection.
- A relocation goal such as Germany receives destination-relevant imagery with visible attribution.
- The next action is obvious on desktop and mobile.
- Remote media failure, offline reopening, and reduced motion all leave the experience usable and intentional.
- Personal tracker pages share one consistent NOVA//OS editorial language without breaking existing data or workflows.
