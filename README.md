# Vamsi Krishna — Portfolio & Personal Tracker Suite

One Next.js 16 codebase serving two experiences, split by host at the edge:

| Host | Experience |
|---|---|
| `buildora.work` (and `/`) | Vamsi Krishna's public portfolio — selected work, experience, capabilities, and contact |
| `personal.buildora.work` | Private life-OS command center; restricted to two approved Google accounts |
| `localhost:3000` | Development tracker routes; local-only mode remains available |

The public site is a personal portfolio; the tracker side is gated by auth when Supabase is configured, and fully usable signed-out (local-only mode).

The tracker UI is branded NOVA. Legacy `vk:` browser data is retained; authenticated storage uses `vk:account:<user id>:<key>` for isolation. The `vk-tracker-suite` backup discriminator remains stable.

### UI and product system

[UI/UX review and validation](docs/ui-ux-review.md) documents the redesign and its verification.

The repository now keeps two intentional visual systems: the public portfolio uses a restrained blue **Selected Work / Index**, while tracker routes use a teal **NOVA** workspace. Both support readable light and dark themes, shared touch-sized controls, and responsive navigation. `src/app/ui-system.css` owns the current surface palettes and layout refinements. The `src/components/editorial/` primitives are presentational only; tracker hooks, share/privacy behavior, local-first persistence, and host routing remain the source of truth.

The system is responsive across the supported 320px, 390px, and 430px mobile viewports and honors `prefers-reduced-motion` by removing non-essential reveals and transitions. The current release includes explainable next-action prioritization, recovery mode, ordered milestones, weekly review, archive capture, and compact world clocks without changing the existing tracker-data contract.

The Career Command Center contains a Bible-derived reference catalog, dated execution assignments, evidence-gated completion, role research and user-owned reminders. Catalog version 2 supplies navigation across numbered public chapters and the full-stack role lane; it creates no mandatory chapter checklist. The account's versioned plan supplies the actual daily workload.

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

The approved scope and current evidence are in [NOVA change sheet](docs/NOVA_CHANGE_SHEET.md). See [implementation audit](docs/NOVA_IMPLEMENTATION_AUDIT.md) for coverage and [nutrition/reminder setup](docs/NUTRITION_AND_REMINDER_SETUP.md) for migrations, server credentials, scheduling, authenticated checks and rollback.

### Highlights

- **Today** (`/hub`, with `/trackers` retained for compatibility) — one next action, top three tasks, contextual clocks, optional modules, and a collapsed study timetable/checklist. Primary navigation is Today → Plan → Health → Progress → More.
- **Health and Food** — dated meal logging, calories/macros/micronutrients with unknown-aware coverage, declared portions, saved/recent/favorite foods, recipes, optional targets, water, body records and movement. Manual logging works without external credentials.
- **Routine** — owner-only IST meal/supplement defaults, separate completion history, snooze/skip/undo and explicit Web Push opt-in. Closed-site notifications require configured migrations, server keys and a scheduler; they are not activated by committing code.
- **Progress dashboard** (`/dashboard`) — selectable 7/30/90-day weight, food, macro/micronutrient, exercise, water, sleep, focus/study, task/goal and routine views. Charts preserve missing days and expose daily reading tables; summaries link directly to editable source records.
- **Body and weight** — dated weigh-ins, corrections, removal/undo, independent optional target and 30/90-day trends. Plan supports selecting the task to focus on before starting. Section navigation connects detail pages.
- **Review and capture** — daily/weekly task, milestone, focus, study, food, sleep, movement, water and body records; quick capture and optional recovery/five-item habits.
- **Workouts** — split-aware day tabs (PPL / Upper-Lower / Full Body / custom day builder), exercise library CRUD with reorder, structured `weight × reps` set rows, last-session prefill, kg⇄lbs display toggle (stored canonically in kg), rest timer with WebAudio chime, PRs and weekly volume.
- **Fasting** — timestamp-derived elapsed time (immune to tab suspension drift), fasting/eating dual mode, manual past-fast entry, editable history, streak/avg/longest stats.
- **Goal** — all seven categories fully interactive, editable daily metric, 14-day chart, run-rate ETA, ordered milestone CRUD, weekly commitment history, and missed-plan recovery.
- **Weight Loss** — daily weigh-ins with unit conversion, target delta, seven-entry trend, notes, and energy/sleep/soreness recovery signals.
- **Tasks** — P1/P2/P3 priorities, tags, Today/Tomorrow/Upcoming/Completed views, name/date editing, selected-task focus and undo for deletion/cleanup.
- **Motivation** — saved goal, one relevant encouragement, optional personal reminders, stable goal-aware imagery/fallbacks and a next-milestone action.
- **Library** (`/archive`) — private local-first notes, links, image references, and quotes with tags, source URLs, pinning, goal links, search, and broken-media fallbacks.
- **Reminders** — user-configured weigh-in, focus, and end-of-day prompts while the app is open. Browser permission is opt-in; background push is deferred until production scheduling and secrets exist.
- **Career roadmap** (`/roadmap`) — a generated reference catalog plus a versioned 100-study-day execution plan, 60-hour full weeks (11h weekdays, 5h Saturday, Sunday free), concrete daily practice/role/OSS/interview prompts, saved evidence with a separate verify action, and opt-in reminders. Historical assignments and evidence retain their IDs.
- **Focus and protection** — one active work-session controller with preserved legacy mirrors, navigation-safe focus/study sessions and cross-page pause/resume/cancel. Bedtime and distraction protection are opt-in, with immediate exit; NOVA does not control system Do Not Disturb or other apps.
- **Share** (`/share`) — ephemeral drops with tags, pinning, fuzzy search, explicit private/public access, private media, email allowlists, and short-lived signed image URLs.
- **PWA** — installable (`manifest.webmanifest`, generated maskable icons, install banner on the hub). The personal host uses network requests with server access checks and purges previous caches; offline page fallback remains available in local development.
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
| `pnpm career:generate` | Rebuild the Bible reference catalog and its configured Monday–Saturday navigation dates |
| `pnpm career:validate` | Check snapshot freshness, chapter coverage, dates, capacity, and links |
| `pnpm test:career-curriculum` | Run curriculum generator tests |
| `pnpm career:seed` | Validate and preview owner-scoped Supabase rows; dry-run only |
| `CAREER_OWNER_EMAIL=… pnpm career:seed -- --apply` | Atomically sync five owner-scoped rows and verify readback; keep the email in ignored environment configuration |
| `pnpm test:e2e` | Playwright suite (its `pretest:e2e` hook rebuilds in local mode first) |
| `pnpm exec playwright test e2e/reduced-motion.spec.ts` | Reduced-motion contract test against the current production build |

**Environment.** Copy your Supabase URL + publishable key into `.env` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to enable sign-in and cross-device sync. For public Share links, also configure `SUPABASE_SERVICE_ROLE_KEY` (or the server-only `SUPABASE_SECRET_KEY`) for the `/api/share/[shareId]` signer. Never prefix that secret with `NEXT_PUBLIC_`; it must not reach the browser. Leave the public variables blank for pure local mode. Note `NEXT_PUBLIC_*` vars are inlined at **build time**.

### Personal website access

`personal.buildora.work` permits only confirmed Google identities for
`cvamsik99@gmail.com` and `srija210v@gmail.com`. The server validates the Supabase
session with `getUser` before serving any personal page, including landing and
sharing. Missing configuration, invalid sessions and auth outages deny access.
Other signed-in accounts see an access-denied screen. The public portfolio stays
open; localhost keeps local-only development.

Google sign-in uses the PKCE callback
`https://personal.buildora.work/auth/callback`. Include that callback, its query
parameters, and approved development callbacks in Supabase's redirect URL
allowlist (for example `https://personal.buildora.work/auth/callback**`). The Google
provider continues to use the project's Supabase Auth callback. The application
callback validates the account and a relative `next` path before redirecting;
credentials and OAuth codes are never logged.

Personal APIs enforce the same policy on every deployed host, including public
and preview hosts. API clients may use verified bearer tokens. Contact remains
public; scheduled push requires its cron secret. Android pairing creates a pending
device only; claiming requires an approved account and paired device status/upload
checks the approved owner before existing credential/revocation/throttle RPC
checks. User data and database RLS are unchanged. No migration is required.

The personal service worker does not cache pages or replay an offline workspace.
Existing installed clients must connect once to receive the worker update and
purge older caches. Previously stored local records are not deleted. Client gating
hides loaded private UI after sign-out or account changes.

Run `pnpm test:personal-access`, build, and run
`pnpm exec playwright test e2e/personal-access.spec.ts e2e/branding.spec.ts e2e/navigation.spec.ts e2e/public-portfolio.spec.ts`.
Verify live root/deep pages redirect to `/login`, anonymous personal APIs return
401, and both approved accounts finish Google sign-in. A build alone does not
confirm deployment or a real Google sign-in.

### Share storage and access

Run Supabase migrations in order: `0001_tracker_data.sql`, `0002_drops_storage.sql`, `0003_shared_drops.sql`, `0004_shared_allowlist.sql`, `0005_private_share_media.sql`, then `0006_career_roadmap_atomic_sync.sql`. Migration 0006 adds a `SECURITY INVOKER` function with a fixed search path and strict row-key/user validation; only `service_role` can execute it. The career seed defaults to dry-run. After migration 0006 is deployed, configure `CAREER_OWNER_EMAIL`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY` privately, then run `pnpm career:seed -- --apply`. It reads only the five planner keys, preserves unrelated todos, evidence, and reminder choices, performs one atomic RPC (or one bulk upsert if the function is absent), then compares every value in readback. Never print or commit private account identifiers or service credentials. The share migration makes the `drops` bucket private, adds public/private access mode and storage-path columns, backfills compatible paths, and applies owner/allowlist/expiry RLS.

Share enforces 50 active drops, a 5 MB limit per signed-in image, an approximately 1.2 MB limit per local-only image, and an approximately 5,000 KB browser-storage display capacity. Expired drops are removed from the active list and cleaned opportunistically. Private links require a matching signed-in email. Public drops keep their explicit access mode and expiry in storage, but every deployed personal website/share API request now also requires an approved Google account. Allowed detail requests use the server route to issue a five-minute signed media URL. Backups include link URL, expiry, allowlist, and access mode metadata, but never storage tokens.

**Conventions.** TypeScript strict, ESLint 0-error/0-warning policy (React Compiler rules included), Radix where it matters, dependency-free primitives for tracker UI (`Ring`, `MiniBars`, `Modal`, `RestTimer` in `src/components/trackers/`).

## Testing

The E2E suite (`e2e/`) drives the real production build in local mode on port 4111. Use `pnpm exec playwright test --list` for the current inventory:

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


## Keeping the personal roadmap aligned with the Bible

The Bible owns chapter titles, read times, role priority and general importance. `career:generate` copies numbered technical chapters and the public full-stack lane, with a content digest; private authoring data never enters the bundle. `career:validate` fails when the snapshot differs from the source. The page computes totals and displays priorities and digest. Refreshing saved chapter facts retains dated schedules and evidence; missing chapters visibly request review rather than silently replacing dated work.

Treat catalog dates as navigation, not a mastery deadline. The reviewed account plan owns the timetable, prerequisite assignments and acceptance criteria. Reference availability does not add workload or mark a skill verified.

For each Bible content/priority change: regenerate, run `career:validate`, curriculum/sync tests and roadmap browser tests, inspect the diff, then publish portfolio main. The Git-connected deployment publishes the bundle. This does not update account rows. Use the reviewed campaign import below for a replan; `career:seed` is an initialization workflow and must not replace an existing execution plan. Existing evidence, unrelated todos and reminder preferences remain separate account state.

No cross-repository scheduled sync is configured. A new Bible push requires regeneration/publication of this snapshot; the visible digest identifies what was actually shipped.

### Versioned campaign release

The forward revision uses GermanyRoadmap version 2 and JobPlan version 3. It contains 100 Monday–Saturday study days, exact 660/300-minute caps and no Sunday work. Each assignment has stable chapter, skill, claim and role references; study, synthetic project work, independent coding and spoken explanation have distinct outputs. The current campaign presentation contains reviewed full-stack role cards and unsent drafts; historical presentation and roadmap data are retained separately. No reminder preference or candidate-readiness score is promoted by import.

After setting `PRIVATE_WORKSPACE` to the canonical private workspace, generate to fresh `.next` output names and inspect the resulting calendar and map. After validation, move all three together to their canonical names before the dry run:

```bash
node --experimental-strip-types scripts/generate-job-plan.mjs --study-days \
  "$PRIVATE_WORKSPACE/reports/germany-job-roadmap-urgent-60h.json" \
  src/data/career-curriculum.json \
  "$PRIVATE_WORKSPACE/reports/fullstack-100-study-day-roadmap.next.json" \
  "$PRIVATE_WORKSPACE/reports/2026-10-26-fullstack-100-study-day-calendar.next.md" \
  --roles="$PRIVATE_WORKSPACE/reports/fullstack-role-queue.json" \
  --matrix="$PRIVATE_WORKSPACE/reports/fullstack-skill-claim-role-matrix.json" \
  --presentation="$PRIVATE_WORKSPACE/reports/fullstack-campaign-presentation.json" \
  --campaign="$PRIVATE_WORKSPACE/reports/2026-10-25-fullstack-remote-campaign.md" \
  --map="$PRIVATE_WORKSPACE/reports/fullstack-assignment-map.next.json"
node --env-file=.env --experimental-strip-types scripts/sync-germany-roadmap.ts \
  --payload="$PRIVATE_WORKSPACE/reports/fullstack-100-study-day-roadmap.json" \
  --preview="$PRIVATE_WORKSPACE/reports/fullstack-owner-preview.json"
```

Deploy the compatible app before importing version 3 assignments. The preview is a mode-0600 local artifact containing owner data. Review its exact changed keys, historical preservation, final merged capacities and references. Repeat the same payload with `--apply` for the reviewed release; omit `--preview` or choose a fresh preview filename because previews never overwrite an existing file. Verify all owner rows, then expect an empty change list on the next dry run. The importer uses one compare-and-swap per row; it does not claim a two-row transaction. A conflict reports applied keys and retains the backup for deliberate reconciliation.

### Historical Germany campaign authoring

`/roadmap` is a primary personal navigation destination. Its account-scoped Germany campaign is separate from the public study catalogue. It shows the current week, three next actions, a dated shared timetable and evidence that requires an explicit verification step. Existing Curriculum, Revision and resource deep links remain available.

The retained urgent campaign uses 60 focused hours per full week: weekdays 660 minutes, Saturday 300, Sunday recovery. Its assignments take effect on 15 October 2026. These commands document that historical authoring path; the forward revision above supersedes its future schedule while preserving earlier work. Clock placements are IST examples; actual meetings use their date-aware invitation time.

Current authoring sources live in the private personal workspace (`../personal/reports/`). The reviewed urgent campaign extends the retained 60-hour baseline without overwriting the baseline, original teaching guides or assessment definitions. Generate the new account payload and matching human calendar from this checkout; inputs, output and release backups stay under the canonical private personal directory:

```bash
node --experimental-strip-types scripts/generate-urgent-job-plan.mjs \
  --baseline ../personal/reports/germany-job-roadmap-60h.json \
  --campaign ../personal/reports/2026-10-15-urgent-remote-germany-campaign.md \
  --learning-plan ../personal/reports/2026-10-15-measured-project-interview-plan.md \
  --output ../personal/reports/germany-job-roadmap-urgent-60h.json \
  --calendar-output ../personal/reports/2026-10-15-urgent-job-plan-calendar.md
node --env-file=.env --experimental-strip-types scripts/sync-germany-roadmap.ts \
  --payload=../personal/reports/germany-job-roadmap-urgent-60h.json
# After the release gates pass, inspect the dry-run and repeat its exact payload with --apply.
```

The generator creates new mode-0600 files and refuses existing outputs. For a later revision choose fresh output names, review the generated calendar, and pass that exact JSON path to the release script. Do not substitute the historical 50-hour payload or general seed when releasing this campaign. Private content is account data and must never be imported into the public application bundle.

Publish the matching frontend through the Git-connected production deployment before importing the new assignment schema; deployment and account-data release are separate checks. The release resolves the exact configured timetable owner and updates only the career/timetable rows using each row's expected timestamp. Each compare-and-swap is atomic; the two-row release is not a transaction. A conflict stops work and reports any applied keys. Re-read and reconcile current data before another attempt rather than blindly restoring the backup. A private mode-0600 backup and an exact readback of every owner row protect tasks, reminders, study history and evidence. Repeat the same dry-run after a successful apply and expect no changed keys. No external communication or reminder opt-in occurs.

Run the generator, schedule/navigation/evidence unit tests and `e2e/germany-roadmap.spec.ts` alongside the existing navigation, Bible-sync and timetable suites. Verify the authenticated account and Git-connected deployment separately; a successful local-mode render does not prove either.

### Tailored career-plan release

The `/roadmap` Plan view carries the owner-only orientation layer — the private `CAREER-ROADMAP.md` (honest assessment, active loop, two lanes, weekly rhythm, risks) rendered through the roadmap guide. The generator drops the "map of everything" appendix, strips relative private links (https study links stay) and refuses anything outside the canonical private personal workspace. Generate, dry-run, then repeat the exact payload with `--apply`:

```bash
node scripts/generate-career-plan.mjs \
  ../personal/CAREER-ROADMAP.md \
  ../personal/reports/career-plan.json
node --env-file=.env --experimental-strip-types scripts/sync-career-plan.ts \
  --payload=../personal/reports/career-plan.json
# After the dry-run matches, repeat its exact payload with --apply.
```

The owner-only sync merges the payload into the existing `career_command_center` row as `plan`, makes a private mode-0600 backup and verifies every owner row; the compare-and-swap update stops on a missing or conflicting owner row without overwriting data. Other accounts see a private notice instead of the plan. The plan is account data and must never be imported into the public application bundle.
