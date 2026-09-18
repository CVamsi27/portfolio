# Changelog

## v2.0 — Personal Tracker Suite (2026-09-17)

The portfolio repo now ships two products in one codebase: the public résumé at `buildora.work`, and a private, local-first life-OS at `personal.buildora.work` — 8 tracker pages, offline-capable PWA, cloud sync, and a 44-test E2E suite in CI.

### Highlights

- **Hub command center** (`/trackers`) — Apple-Fitness-style 4-segment momentum ring (fast · workout · tasks · goal metric), quick actions (add task, log metric, log a meal window), 48-hour activity feed, and a Week-in-Review card with week-over-week deltas.
- **Installable PWA** — web manifest with generated maskable icons, install banner on the hub, and a service worker that precaches the shell and falls back to a cached `/trackers` offline page.
- **Local-first sync** — every write lands in `localStorage` instantly; Supabase rows mirror it with debounced pushes and last-write-wins pulls. Signed-out mode is a first-class citizen, not a degraded one.

### Workouts

- Split-aware day tabs: Push/Pull/Legs, Upper/Lower, Full Body, plus a custom day builder.
- Exercise library CRUD per day — add, edit, delete, reorder.
- Structured set logging: `weight × reps` rows stored canonically in kg, with a kg⇄lbs display toggle.
- Last-session prefill, personal records (est. 1RM), weekly volume chart, and a floating rest timer (60/90/120/180 s) with WebAudio chime + vibration that survives tab suspension.

### Fasting

- Meal-window engine — first and last meal times calculate the overnight fast without a fragile start/stop timer.
- Daily routine-first setup, manual past-day logging, editable + deletable history, auto-clear choices, streak / avg (7d, 30d) / longest / total stats, and a 7-day chart.

### Goals

- All six categories (relocation, fitness, career, learning, financial, custom) fully interactive — controls no longer vanish outside relocation.
- Editable daily metric label/target, 14-day chart, hit-streak, and a run-rate ETA toward a goal total.
- Full milestone CRUD: add, edit, delete, reorder, with completion timestamps.

### Todos

- Priorities (P1/P2/P3), tags (Work / Health / Goal / Personal / Deep Work) with filtering.
- Today / Tomorrow / Upcoming / Completed views, inline editing, Enter-chained quick add, clear-completed, and a genuine consecutive-day completion streak.

### Motivation

- Daily quote deck with shuffle, favorites, and copy.
- Custom affirmations that join the deck.
- Three-prompt micro-journal (win / learned / tomorrow's focus) stored per date and synced.

### Shonen Dossier redesign and release gates

- Responsive chapter shell, command deck, goal-centered Motivation focus scene, mobile command dock, and reduced-motion-safe dossier reveal styling now carry the visual system through the tracker suite and public portfolio.
- The reduced-motion contract disables non-essential animation and transitions; Focus Mode keeps a layout fallback when browser fullscreen is unavailable.
- Local mode remains usable without Supabase: public variables blank the auth gate and cloud sync, while cloud image storage and public/private Share links stay unavailable until the configured migrations and server signer are present.

### Share and Settings

- Ephemeral drops with tags, pinning, fuzzy search, explicit private `Specific people` access, opt-in public `Anyone with the link` access, private media, email allowlists, expiry cleanup, and five-minute signed image URLs.
- Share limits are 50 active drops, 5 MB per signed-in image, approximately 1.2 MB per local-only image, and approximately 5,000 KB displayed browser capacity. Public/private access is enforced by Supabase RLS and the server-only signing route; a link or gateway acceptance does not imply delivery or notification.
- Supabase migrations run in order from `0001_tracker_data.sql` through `0005_private_share_media.sql`; the service-role/secret signing key is server-only and never uses a `NEXT_PUBLIC_` prefix.
- Settings page: full-suite JSON export/import (validate-before-write, pre-import snapshot, v1 backups included), per-tracker storage stats, quick preferences, and a type-`CLEAR` danger zone.

### Under the hood

- Typed store hooks over one external-store primitive (`useSyncedStorage`); domain math centralized in `src/lib/trackers.ts`.
- One-time v1→v2 migrations for every legacy shape — each snapshots the old payload to `vk:backup:v1:<key>` first and is idempotent.
- Host routing moved to Next 16's `proxy.ts` convention; ESLint 9 flat config at a 0-error/0-warning policy (React Compiler rules).
- Toolchain pinned (`packageManager`, `.nvmrc`); CI runs lint + typecheck + E2E with lockfile-keyed browser caching, no secrets required.

### Quality

- 44 Playwright E2E tests across 12 specs — including onboarding, hub, fasting, workouts, goal, todos, motivation, Share UI, reduced motion, settings, and host routing — run against a real production build in local mode. Release gates are `pnpm test:e2e`, `pnpm lint`, and `pnpm build`; configured Share integration additionally requires Supabase credentials and is not covered by local mode. The suite caught and fixed three real bugs before release: an inverted fasting Start button, a hydration-broken portal link, and a visit-log effect that could erase same-day history.
## Unreleased

- Rebranded tracker-facing product surfaces as NOVA//OS while preserving internal storage and backup compatibility identifiers.
- Added the repo-wide NOVA//OS editorial foundation: paper-toned public dossier, archive-black tracker chapters, shared display typography, indexed utility rails, telemetry, signal rules, and explicit action hierarchy.
- Applied the foundation to portfolio, tracker shell, Share, Settings, Login, Motivation focus, onboarding, and install surfaces without changing localStorage keys, share access behavior, or no-sign-in local mode.
- Added browser contracts for semantic surfaces, chapter identity, mobile action visibility, route coverage, host boundaries, and reduced-motion behavior. Adaptive Momentum and recovery features remain separate follow-up work.
