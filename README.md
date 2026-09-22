# Vamsi Krishna — Portfolio & Personal Tracker Suite

One Next.js 16 codebase serving two experiences, split by host at the edge:

| Host | Experience |
|---|---|
| `buildora.work` (and `/`) | Vamsi Krishna's public portfolio — selected work, experience, capabilities, and contact |
| `personal.buildora.work` (and `localhost:3000`) | Private life-OS command center — fasting, workouts, goals, todos, motivation, journal |

The public site is a personal portfolio; the tracker side is gated by auth when Supabase is configured, and fully usable signed-out (local-only mode).

The tracker UI is branded NOVA. Internal `vk:` localStorage keys and the `vk-tracker-suite` backup discriminator remain stable for existing data.

### Editorial product system

The repository now keeps two intentional visual systems: the public portfolio is a warm-paper editorial **Selected Work / Index**, while tracker routes are an archive-black **NOVA** workspace. The `src/components/editorial/` primitives are presentational only; tracker hooks, share/privacy behavior, local-first persistence, and host routing remain the source of truth.

The system is responsive across the supported 320px, 390px, and 430px mobile viewports and honors `prefers-reduced-motion` by removing non-essential reveals and transitions. The current release includes explainable next-action prioritization, recovery mode, ordered milestones, weekly review, archive capture, and compact world clocks without changing the existing tracker-data contract.

---

## Architecture

```
Request → src/proxy.ts (host router, Next 16 middleware convention)
  ├─ buildora.work            → résumé routes; /trackers* is 307-redirected off
  ├─ personal.* host          → tracker suite; / rewrites to /trackers/landing; /hub is the canonical workspace
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

The personal release’s new weight-loss, archive, reminder, recovery, and weekly-commitment fields use the existing generic `tracker_data` sync layer and its current RLS policy. No additional Supabase migration is required for those local-first tracker stores.

### Data model

All state lives under the `vk:` localStorage namespace, one JSON document per tracker (mirrored 1:1 into `tracker_data` cloud rows):

`prefs` · `fasting` · `fasting:history` · `workouts` · `workout:library` · `todos` · `goal` · `journal` · `motivation:favs` · `motivation:custom` · `motivation:visits` · `share` · `share:links` · `weight-loss` · `archive:items` · `reminders` · `lockdown:preferences`

- **Types & domain logic** — `src/lib/trackers.ts` (split presets, timestamp fasting engine, streak/PR/ETA/volume math) and `src/lib/user-prefs.ts` (onboarding preferences).
- **Typed hooks** — `src/lib/tracker-store.ts` exposes `useWorkouts()`, `useFasting()`, `useTodos()`, `useGoalState()`, `useJournal()`, `useExerciseLibrary()`, … plus a shared `useNow()` wall-clock ticker.
- **Migrations** — v1→v2 adapters run once per page load, snapshot the old payload to `vk:backup:v1:<key>` first, and are idempotent (comma-string set logs → structured `{reps, weightKg}`; tick-counter fasts → real `startedAt` timestamps, in-flight fasts survive).
- **Backup/restore** — `src/lib/backup.ts` exports the entire namespace (including v1 snapshots) as versioned JSON and imports with validate-before-write plus a pre-import snapshot.

### Highlights

- **Hub** (`/hub`, with `/trackers` retained for compatibility) — single momentum ring (fast · workout · tasks · goal anchor), one typed next action, compact world clocks, quick actions, 48h activity feed, and Week-in-Review.
- **Workouts** — split-aware day tabs (PPL / Upper-Lower / Full Body / custom day builder), exercise library CRUD with reorder, structured `weight × reps` set rows, last-session prefill, kg⇄lbs display toggle (stored canonically in kg), rest timer with WebAudio chime, PRs and weekly volume.
- **Fasting** — timestamp-derived elapsed time (immune to tab suspension drift), fasting/eating dual mode, manual past-fast entry, editable history, streak/avg/longest stats.
- **Goal** — all seven categories fully interactive, editable daily metric, 14-day chart, run-rate ETA, ordered milestone CRUD, weekly commitment history, and missed-plan recovery.
- **Weight Loss** — daily weigh-ins with unit conversion, target delta, seven-entry trend, notes, and energy/sleep/soreness recovery signals.
- **Todos** — P1/P2/P3 priorities, tags, Today/Tomorrow/Upcoming/Done views, inline editing, Enter-chained quick add.
- **Motivation** — daily deck + realistic category-aware imagery with allowlisted relay/fallbacks + custom affirmations + 3-prompt micro-journal with a true consecutive-day streak.
- **Archive** — private local-first notes, links, image references, and quotes with tags, source URLs, pinning, goal links, search, and broken-media fallbacks.
- **Reminders** — user-configured weigh-in, focus, and end-of-day prompts while the app is open. Browser permission is opt-in; background push is deferred until production scheduling and secrets exist.
- **Protection** — optional, user-configured bedtime windows and focus-session navigation locks. The browser/PWA can cover Personal and record interruptions, but it cannot disable other phone/laptop apps or activate system Do Not Disturb; users complete the OS Focus/DND/app-limit checklist manually. Bedtime is disabled until a user chooses valid times and active days.
- **Share** (`/share`) — ephemeral drops with tags, pinning, fuzzy search, explicit private/public access, private media, email allowlists, and short-lived signed image URLs.
- **PWA** — installable (`manifest.webmanifest`, generated maskable icons, install banner on the hub); the service worker precaches `/hub`, serves pages network-first, and falls back to the cached canonical hub shell offline.
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

The E2E suite (`e2e/`, 101 tests across 20 specs) drives the real production build in local mode on port 4111:

```bash
pnpm test:e2e                          # full suite
./node_modules/.bin/playwright test e2e/workouts.spec.ts
./node_modules/.bin/playwright test e2e/share.spec.ts --grep "hard limits|asks for access"
./node_modules/.bin/playwright test e2e/reduced-motion.spec.ts
./node_modules/.bin/playwright test --headed -g "rest timer"
pnpm lint && pnpm run pretest:e2e       # release gates
npx playwright show-trace test-results/<dir>/trace.zip   # debug a failure
```

Key mechanics: the config blanks `NEXT_PUBLIC_SUPABASE_*` for the build (auth open, sync off), and `e2e/helpers.ts#seed` injects valid v2 store shapes into `localStorage` before page load — guarded by a `sessionStorage` flag so seeding runs **once per tab**, letting tests reload the page and assert persistence while every fresh context starts clean. Mobile contracts cover 320px, 390px, and 430px hub widths with no horizontal overflow. Run `pnpm run pretest:e2e` with the same blank public variables before invoking Playwright directly; `NEXT_PUBLIC_*` values are inlined at build time. The configured Share integration suite is separate and requires all public Supabase variables plus a server-only signing key; local-mode E2E does not verify remote RLS, storage signing, or carrier/link delivery.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: frozen-lockfile install (pnpm 11, Node 22), lint, typecheck, then the E2E suite with lockfile-keyed browser caching. No secrets required — the local-mode build is the point. Failed runs upload the Playwright report as an artifact.
