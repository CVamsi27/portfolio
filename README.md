# Buildora — Portfolio & Personal Tracker Suite

One Next.js 16 codebase serving two experiences, split by host at the edge:

| Host | Experience |
|---|---|
| `buildora.work` (and `/`) | Public developer résumé — hero, experience, projects, skills, live contact |
| `personal.buildora.work` (and `localhost:3000`) | Private life-OS command center — fasting, workouts, goals, todos, motivation, journal |

The résumé carries a subtle **Personal Suite** portal link; the tracker side is gated by auth when Supabase is configured, and fully usable signed-out (local-only mode).

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

**Local-first by design.** Every write hits `localStorage` synchronously and the cloud is progressive enhancement: offline-capable, zero-latency UI, and the same JSON rows sync across devices when signed in. Supabase is optional — with no env vars the app runs entirely locally and auth stays open.

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
- **Share** (`/share`) — ephemeral drops with tags, pinning, fuzzy search, email allowlist.
- **PWA** — installable (`manifest.webmanifest`, generated maskable icons, install banner on the hub); the service worker precaches the shell, serves pages network-first and falls back to a cached `/trackers` offline shell.

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

**Environment.** Copy your Supabase URL + publishable key into `.env` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to enable sign-in and cross-device sync. Leave them blank for pure local mode. Note `NEXT_PUBLIC_*` vars are inlined at **build time**.

**Conventions.** TypeScript strict, ESLint 0-error/0-warning policy (React Compiler rules included), Radix where it matters, dependency-free primitives for tracker UI (`Ring`, `MiniBars`, `Modal`, `RestTimer` in `src/components/trackers/`).

## Testing

The E2E suite (`e2e/`, 35 tests) drives the real production build in local mode on port 4111:

```bash
pnpm test:e2e                          # full suite
./node_modules/.bin/playwright test e2e/workouts.spec.ts
./node_modules/.bin/playwright test --headed -g "rest timer"
npx playwright show-trace test-results/<dir>/trace.zip   # debug a failure
```

Key mechanics: the config blanks `NEXT_PUBLIC_SUPABASE_*` for the build (auth open, sync off), and `e2e/helpers.ts#seed` injects valid v2 store shapes into `localStorage` before page load — guarded by a `sessionStorage` flag so seeding runs **once per tab**, letting tests reload the page and assert persistence while every fresh context starts clean.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: frozen-lockfile install (pnpm 11, Node 22), lint, typecheck, then the E2E suite with lockfile-keyed browser caching. No secrets required — the local-mode build is the point. Failed runs upload the Playwright report as an artifact.
