# Buildora — Portfolio & Personal Tracker Suite

One Next.js 16 codebase serving two experiences, split by host at the edge:

| Host | Experience |
|---|---|
| `buildora.work` (and `/`) | Public developer résumé — hero, experience, projects, skills, live contact |
| `personal.buildora.work` (and `localhost:3000`) | Private life-OS command center — fasting, workouts, goals, todos, motivation, journal |

The résumé carries a subtle **NOVA//OS** portal link; the tracker side is gated by auth when Supabase is configured, and fully usable signed-out (local-only mode).

The tracker UI is branded NOVA//OS. Internal `vk:` localStorage keys and the `vk-tracker-suite` backup discriminator remain stable for existing data.

### Editorial product system

The repository now shares one visual grammar across both hosts: the portfolio is a paper-toned **Public Dossier**, while tracker routes are an archive-black **NOVA//OS** transmission. Full-bleed chapter openings, indexed utility rails, oversized display type, technical telemetry, signal rules, and one obvious next action replace repeated equal-weight dashboard panels. The `src/components/editorial/` primitives are presentational only; tracker hooks, share/privacy behavior, local-first persistence, and host routing remain the source of truth.

The system is responsive down to a 390px mobile viewport and honors `prefers-reduced-motion` by removing non-essential reveals and transitions. Adaptive product features such as explainable momentum weighting, recovery mode, and weekly narrative review remain separate follow-up releases so this foundation can ship without changing persisted data or domain APIs.

---

## Architecture

```
Request → src/proxy.ts (host router, Next 16 middleware convention)
  ├─ buildora.work            → résumé routes; /trackers* is 307-redirected off
  ├─ personal.* host          → tracker suite; / rewrites to /trackers
  └─ PWA assets (manifest, sw.js, /icons/*) → exempt on every host

Tracker pages (client components)
  └─ typed store hooks (src/lib/tracker-store.ts)
       └─ useSyncedStorage (src/lib/use-synced-storage.ts)
            ├─ localStorage  ← instant reads/writes, external-store subscriptions
            └─ Supabase tracker_data (user_id, key, value, updated_at)
                 pull-on-sign-in (last-write-wins by updated_at)
                 debounced push (800ms) on every write
```

**Local-first by design.** Every write hits `localStorage` synchronously and the cloud is progressive enhancement: offline-capable, zero-latency UI, and the same JSON rows sync across devices when signed in. Supabase is optional — with no public Supabase env vars the app runs entirely locally, auth stays open, and Share drops remain local-only. Cloud sync, signed-in image storage, allowlisted private links, and public signed media require the configured Supabase project and migrations.

### Data model

All state lives under the `vk:` localStorage namespace, one JSON document per tracker (mirrored 1:1 into `tracker_data` cloud rows):

`prefs` · `fasting` · `fasting:history` · `workouts` · `workout:library` · `todos` · `goal` · `journal` · `motivation:favs` · `motivation:custom` · `motivation:visits` · `share` · `share:links`

- **Types & domain logic** — `src/lib/trackers.ts` (split presets, timestamp fasting engine, streak/PR/ETA/volume math) and `src/lib/user-prefs.ts` (onboarding preferences).
- **Typed hooks** — `src/lib/tracker-store.ts` exposes `useWorkouts()`, `useFasting()`, `useTodos()`, `useGoalState()`, `useJournal()`, `useExerciseLibrary()`, … plus a shared `useNow()` wall-clock ticker.
- **Migrations** — v1→v2 adapters run once per page load, snapshot the old payload to `vk:backup:v1:<key>` first, and are idempotent (comma-string set logs → structured `{reps, weightKg}`; tick-counter fasts → real `startedAt` timestamps, in-flight fasts survive).
- **Backup/restore** — `src/lib/backup.ts` exports the entire namespace (including v1 snapshots) as versioned JSON and imports with validate-before-write plus a pre-import snapshot.

### Highlights

- **Hub** (`/trackers`) — Apple-Fitness-style 4-segment momentum ring (fast · workout · tasks · goal metric), quick actions, 48h activity feed, Week-in-Review with week-over-week deltas.
- **Workouts** — split-aware day tabs (PPL / Upper-Lower / Full Body / custom day builder), exercise library CRUD with reorder, structured `weight × reps` set rows, last-session prefill, kg⇄lbs display toggle (stored canonically in kg), rest timer with WebAudio chime, PRs and weekly volume.
- **Fasting** — timestamp-derived elapsed time (immune to tab suspension drift), fasting/eating dual mode, manual past-fast entry, editable history, streak/avg/longest stats.
- **Goal** — all six categories fully interactive, editable daily metric, 14-day chart, run-rate ETA, milestone CRUD with completion timestamps.
- **Todos** — P1/P2/P3 priorities, tags, Today/Tomorrow/Upcoming/Done views, inline editing, Enter-chained quick add.
- **Motivation** — daily deck + custom affirmations + 3-prompt micro-journal with a true consecutive-day streak.
- **Share** (`/share`) — ephemeral drops with tags, pinning, fuzzy search, explicit private/public access, private media, email allowlists, and short-lived signed image URLs.
- **PWA** — installable (`manifest.webmanifest`, generated maskable icons, install banner on the hub); the service worker precaches the shell, serves pages network-first and falls back to a cached `/trackers` offline shell.
- **Editorial foundation** — shared chapter primitives (`EditorialFrame`, `ChapterLabel`, `DisplayStatement`, `ActionBlock`, `SignalRule`, `TelemetryLine`, `EditorialGrid`) keep portfolio, tracker, focus, share, settings, and onboarding surfaces visually related while preserving their distinct identities.

---

## Development

```bash
pnpm install
pnpm dev            # http://localhost:3000 → tracker suite
```

| Script | What it does |
|---|---|
| `pnpm dev` | Next dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint 9 flat config (`eslint.config.mjs`) |
| `pnpm test:e2e` | Playwright suite (its `pretest:e2e` hook rebuilds in local mode first) |
| `pnpm exec playwright test e2e/reduced-motion.spec.ts` | Reduced-motion contract test against the current production build |

**Environment.** Copy your Supabase URL + publishable key into `.env` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to enable sign-in and cross-device sync. For public Share links, also configure `SUPABASE_SERVICE_ROLE_KEY` (or the server-only `SUPABASE_SECRET_KEY`) for the `/api/share/[shareId]` signer. Never prefix that secret with `NEXT_PUBLIC_`; it must not reach the browser. Leave the public variables blank for pure local mode. Note `NEXT_PUBLIC_*` vars are inlined at **build time**.

### Share storage and access

Run Supabase migrations in order: `0001_tracker_data.sql`, `0002_drops_storage.sql`, `0003_shared_drops.sql`, `0004_shared_allowlist.sql`, then `0005_private_share_media.sql`. The final migration makes the `drops` bucket private, adds public/private access mode and storage-path columns, backfills compatible paths, and applies owner/allowlist/expiry RLS.

Share enforces 50 active drops, a 5 MB limit per signed-in image, an approximately 1.2 MB limit per local-only image, and an approximately 5,000 KB browser-storage display capacity. Expired drops are removed from the active list and cleaned opportunistically. Private links require a matching signed-in email; public links are an explicit “Anyone with the link” choice and are readable only until expiry. Public detail pages use the server route to issue a five-minute signed media URL. Backups include link URL, expiry, allowlist, and access mode metadata, but never storage tokens.

**Conventions.** TypeScript strict, ESLint 0-error/0-warning policy (React Compiler rules included), Radix where it matters, dependency-free primitives for tracker UI (`Ring`, `MiniBars`, `Modal`, `RestTimer` in `src/components/trackers/`).

## Testing

The E2E suite (`e2e/`, 44 tests across 12 specs) drives the real production build in local mode on port 4111:

```bash
pnpm test:e2e                          # full suite
./node_modules/.bin/playwright test e2e/workouts.spec.ts
./node_modules/.bin/playwright test e2e/share.spec.ts --grep "hard limits|asks for access"
./node_modules/.bin/playwright test e2e/reduced-motion.spec.ts
./node_modules/.bin/playwright test --headed -g "rest timer"
pnpm lint && pnpm build                 # release gates
npx playwright show-trace test-results/<dir>/trace.zip   # debug a failure
```

Key mechanics: the config blanks `NEXT_PUBLIC_SUPABASE_*` for the build (auth open, sync off), and `e2e/helpers.ts#seed` injects valid v2 store shapes into `localStorage` before page load — guarded by a `sessionStorage` flag so seeding runs **once per tab**, letting tests reload the page and assert persistence while every fresh context starts clean. Run `pnpm build` with the same blank public variables before invoking Playwright directly; `NEXT_PUBLIC_*` values are inlined at build time. The configured Share integration suite is separate and requires all public Supabase variables plus a server-only signing key; local-mode E2E does not verify remote RLS, storage signing, or carrier/link delivery.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: frozen-lockfile install (pnpm 11, Node 22), lint, typecheck, then the E2E suite with lockfile-keyed browser caching. No secrets required — the local-mode build is the point. Failed runs upload the Playwright report as an artifact.
