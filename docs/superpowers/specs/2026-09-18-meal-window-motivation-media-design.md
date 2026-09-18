# Meal-Window Fasting, Goal Media, and Tracker Polish

## Intent

Replace the remaining timer-first fasting interaction, make Motivation a cinematic goal transmission with reliable public media, and remove the last legacy dashboard styling from tracker surfaces. Preserve the existing NOVA//OS editorial language, local-first behavior, no-sign-in local mode, Supabase sync compatibility, and all current portfolio identity boundaries.

This is one bounded product pass with three connected outcomes:

1. Fasting is recorded as a daily eating window using first- and last-meal times.
2. Motivation is a full-screen, goal-aware visual scene with public API media, cache, and deterministic fallback.
3. Tracker routes share a sharper editorial panel system instead of mixing the new shell with rounded legacy cards.

## Goals and non-goals

### Goals

- Ask for a reusable daily first-meal and last-meal routine when fasting is enabled and no routine exists.
- Prefill today's meal window from that routine when no daily log exists.
- Calculate fasting duration from the eating window: `fastHours = 24 - eatingWindowHours`.
- Keep manual history, analytics, streaks, and existing timer-created records readable.
- Load category-relevant motivational artwork and an inspirational quote from public APIs without sending the user's raw goal title externally.
- Cache successful media locally for offline reopening and use curated local fallbacks when APIs fail.
- Give the fasting, motivation, workout, goal, todo, settings, and share pages one consistent tracker-only editorial treatment.
- Keep every important action keyboard accessible and make reduced-motion behavior deterministic.

### Non-goals

- No replacement of Supabase, authentication, sharing privacy, storage limits, or host routing.
- No automatic submission of a daily fasting log without an explicit confirmation action.
- No raw custom goal title, personal name, email, or journal text in public API query parameters.
- No dependency on a remote API for the core tracker shell or existing quote/journal functionality.
- No new notification, calendar, subscription, or social feature in this pass.

## Design

### 1. Meal-window fasting

#### User flow

The first onboarding or fasting-page setup state asks for:

- First meal time, defaulting to `12:00` when no routine exists.
- Last meal time, defaulting to `20:00` when no routine exists.
- A clear explanation that the times define the eating window and the calculated fasting duration.

The routine is saved as preferences. On a day without a confirmed log, the fasting page shows the routine values as an editable draft with:

- `Confirm today` as the primary action.
- `Edit routine` as a secondary action.
- The calculated eating-window and fasting duration visible before confirmation.

After confirmation, the day appears in history and the primary surface becomes an edit/review state. Editing a day changes only that day; editing the routine changes future prefills and never rewrites existing logs.

Start/Stop and End & Log controls are removed from the primary fasting UI. Existing timer data is not deleted or rewritten.

#### Data model

Extend the existing preference shape with optional routine fields:

```ts
fastingFirstMealTime?: string; // HH:mm
fastingLastMealTime?: string; // HH:mm
```

Extend `FastHistoryEntry` with optional meal-window metadata:

```ts
firstMealTime?: string;
lastMealTime?: string;
source?: "timer" | "manual" | "meal-window";
```

Meal-window entries retain the existing `start` and `end` timestamps for compatibility and analytics. For a log dated `YYYY-MM-DD`, `start` represents the last meal on that date and `end` represents the first meal on the following date. The original first/last meal strings remain on the record for display and editing.

The calculated duration uses local calendar time and handles an overnight boundary. Invalid or equal meal times are rejected with an inline message. The permitted window is 15 minutes through 72 hours, matching the existing manual-history safety range.

The existing `vk:fasting` and `vk:fasting:history` keys remain. New optional fields are additive, so old backups and old timer records continue to load. A migration normalizes missing `source` to `timer` for existing records and leaves their timestamps unchanged.

#### Analytics behavior

Existing analytics functions continue to consume `start`/`end`, so streak, averages, longest fast, charts, and totals work for both timer and meal-window records. The UI labels meal-window rows with the first/last meal times and timer rows with their legacy elapsed-time presentation.

### 2. Goal-aware Motivation media

#### Provider strategy

Use two no-auth public APIs listed in the referenced Public APIs catalog:

- Art Institute of Chicago API for searched artwork metadata and image IDs.
- Zen Quotes API for a fresh inspirational quote.

The application uses safe category mappings rather than personal text:

```ts
relocation -> ["landscape", "journey", "city"]
fitness    -> ["athlete", "movement", "mountain"]
career     -> ["architecture", "industry", "craft"]
learning   -> ["books", "science", "study"]
financial  -> ["horizon", "growth", "abundance"]
custom     -> ["sunrise", "resilience", "possibility"]
```

Only one safe category term is sent per request. The goal title, user name, journal, and custom affirmation text never leave the browser.

#### Resolver contract

Create a pure resolver module with a testable contract:

```ts
type MotivationMedia = {
  imageUrl: string | null;
  imageTitle?: string;
  imageCredit?: string;
  imageSourceUrl?: string;
  quote: string;
  quoteAuthor?: string;
  quoteSource?: string;
  category: GoalCategory;
  fetchedAt: number;
};

resolveMotivationMedia(category: GoalCategory, signal?: AbortSignal): Promise<MotivationMedia>
```

The resolver:

1. Checks a category-scoped local cache with a bounded freshness window.
2. Fetches artwork and quote in parallel with a short timeout.
3. Validates response shape and image URL before returning it.
4. Stores only the normalized response, never raw provider payloads.
5. Falls back independently: cached image + local quote, local image treatment + API quote, or fully curated local media.

The fallback is deterministic per category and includes an existing local quote deck so Motivation never renders an empty scene. A visible source/credit line appears whenever remote media is used; fallback mode is labeled `LOCAL FALLBACK` for transparency.

#### Focus scene

Extend `FocusScene` with optional media props. The scene keeps its existing fullscreen fallback, Escape behavior, reduced-motion hook, action callbacks, goal progress, milestone, and streak. Add:

- Background artwork with `background-image` and `background-position: center`.
- Multiple overlays for readability and NOVA//OS color treatment.
- Quote, author/source, category label, and media credit.
- A small `Refresh transmission` action that invalidates the category cache and retries.
- `aria-label` and a non-background fallback description for the image.

When reduced motion is enabled, background scaling, pulse, and reveal animation are disabled. When the image fails to load, the overlay remains and the local gradient treatment is restored.

### 3. Tracker UI polish

The shared tracker shell remains the layout boundary. Add a tracker-only editorial panel class that:

- Uses compact corners or square edges instead of default rounded dashboard cards.
- Uses one strong border, one offset signal shadow, and fewer layered gradients.
- Keeps touch targets rounded only where they are controls, pills, or segmented choices.
- Uses the existing archive, paper, cyan, lime, red, violet, ink, and mist tokens.

Apply it to:

- Fasting routine and history.
- Motivation quote deck, journal, and custom affirmation sections.
- Workout exercise library and set-entry panels.
- Goal roadmap and metric panels.
- Todo composer, filters, and list rows.
- Settings, Share, and Shared with me secondary panels.

Each route must have one dominant statement/action, one compact telemetry band where useful, and a visible empty state. Existing callbacks, labels needed by tests, and action semantics remain unchanged.

## Error handling and privacy

- API requests use `AbortController`, a short timeout, and response validation.
- Provider failures, rate limits, CORS errors, malformed responses, and image decode errors all resolve to the local fallback path.
- No API failure blocks navigation, fullscreen mode, journaling, or existing quote actions.
- Only category-safe keywords are sent to public providers. No authentication token, Supabase data, or personal content is sent.
- Remote image URLs are displayed as background media and are not persisted as trusted HTML. Credit/source links use `noopener noreferrer`.
- Local cached media can be cleared from Settings with the existing local-data controls or an explicit Motivation cache action.

## Testing

Add unit-style tests for pure meal-window calculations and category mappings. Add Playwright coverage for:

- First-use routine prompt and validation.
- Routine prefill and explicit daily confirmation.
- Editing a day without rewriting the routine.
- Legacy timer history still rendering and contributing to analytics.
- Cached motivation media rendering without a network request.
- API success, malformed response, timeout, image error, and fallback behavior.
- Goal-safe query terms never containing the raw goal title.
- Fullscreen/fallback focus scene, credit/source visibility, refresh action, and reduced motion.
- Legacy rounded card regression selectors on fasting, motivation, workouts, goals, todos, settings, and Share.

Release gates:

```bash
pnpm exec playwright test
pnpm lint
pnpm build
git diff --check
```

## Rollout order

1. Add pure meal-window domain helpers and additive data compatibility.
2. Update onboarding and fasting UI from timer-first to routine + daily confirmation.
3. Add the cached public-media resolver and FocusScene integration.
4. Apply the tracker panel polish route by route.
5. Run visual and behavior gates, update README/CHANGELOG, and review at desktop and 390px widths.

## Acceptance criteria

- A new user can set first and last meal times and confirm a day without seeing Start/Stop as the primary fasting action.
- Existing timer history still appears and analytics remain accurate.
- Motivation opens with a full-screen goal scene, a readable quote, and either a category-relevant remote image or an explicit local fallback.
- Refreshing or losing network access never produces a blank motivation scene.
- Tracker routes no longer mix the new editorial shell with obviously old rounded dashboard panels.
- Local mode requires no sign-in and sends no personal goal text to external APIs.
- All release gates pass.
