# Changelog

## v2.0 — Personal Tracker Suite (2026-09-17)

The portfolio repo now ships two products in one codebase: the public résumé at `buildora.work`, and a private, local-first life-OS at `personal.buildora.work` — 8 tracker pages, offline-capable PWA, cloud sync, and a 35-test E2E suite in CI.

### ✨ Highlights

- **Hub command center** (`/trackers`) — Apple-Fitness-style 4-segment momentum ring (fast · workout · tasks · goal metric), quick actions (add task, log metric, start/stop fast), 48-hour activity feed, and a Week-in-Review card with week-over-week deltas.
- **Installable PWA** — web manifest with generated maskable icons, install banner on the hub, and a service worker that precaches the shell and falls back to a cached `/trackers` offline page.
- **Local-first sync** — every write lands in `localStorage` instantly; Supabase rows mirror it with debounced pushes and last-write-wins pulls. Signed-out mode is a first-class citizen, not a degraded one.

### 🏃 Workouts

- Split-aware day tabs: Push/Pull/Legs, Upper/Lower, Full Body, plus a custom day builder.
- Exercise library CRUD per day — add, edit, delete, reorder.
- Structured set logging: `weight × reps` rows stored canonically in kg, with a kg⇄lbs display toggle.
- Last-session prefill, personal records (est. 1RM), weekly volume chart, and a floating rest timer (60/90/120/180 s) with WebAudio chime + vibration that survives tab suspension.

### ⏱ Fasting

- Timestamp-based engine — elapsed time is derived from `startedAt`, immune to background-tab drift; in-flight fasts survive upgrades.
- Fasting/eating-window dual mode with metabolic stage badges.
- Manual past-fast entry (including overnight handling), editable + deletable history, streak / avg (7d, 30d) / longest / total stats, 7-day chart.

### 🎯 Goals

- All six categories (relocation, fitness, career, learning, financial, custom) fully interactive — controls no longer vanish outside relocation.
- Editable daily metric label/target, 14-day chart, hit-streak, and a run-rate ETA toward a goal total.
- Full milestone CRUD: add, edit, delete, reorder, with completion timestamps.

### ✅ Todos

- Priorities (P1/P2/P3), tags (Work / Health / Goal / Personal / Deep Work) with filtering.
- Today / Tomorrow / Upcoming / Completed views, inline editing, Enter-chained quick add, clear-completed, and a genuine consecutive-day completion streak.

### 🔥 Motivation

- Daily quote deck with shuffle, favorites, and copy.
- Custom affirmations that join the deck.
- Three-prompt micro-journal (win / learned / tomorrow's focus) stored per date and synced.

### 📤 Share & Settings

- Ephemeral drops with tags, pinning, fuzzy search, and a polished email allowlist editor.
- Settings page: full-suite JSON export/import (validate-before-write, pre-import snapshot, v1 backups included), per-tracker storage stats, quick preferences, and a type-`CLEAR` danger zone.

### 🧱 Under the hood

- Typed store hooks over one external-store primitive (`useSyncedStorage`); domain math centralized in `src/lib/trackers.ts`.
- One-time v1→v2 migrations for every legacy shape — each snapshots the old payload to `vk:backup:v1:<key>` first and is idempotent.
- Host routing moved to Next 16's `proxy.ts` convention; ESLint 9 flat config at a 0-error/0-warning policy (React Compiler rules).
- Toolchain pinned (`packageManager`, `.nvmrc`); CI runs lint + typecheck + E2E with lockfile-keyed browser caching, no secrets required.

### 🧪 Quality

- 35 Playwright E2E tests across 6 specs — onboarding, hub, fasting, workouts, goal, todos, motivation, settings, host routing — running against a real production build in local mode. The suite caught and fixed three real bugs before release: an inverted fasting Start button, a hydration-broken portal link, and a visit-log effect that could erase same-day history.
