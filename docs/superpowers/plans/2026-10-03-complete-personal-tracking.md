# Complete Personal Tracking Implementation Plan

> **For agentic workers:** Execute inline with executing-plans, using the approved docs/NOVA_CHANGE_SHEET.md as the acceptance contract.

**Goal:** Deliver the approved integrated personal tracker, including food and scheduled meal/supplement reminders.

**Architecture:** Reuse existing authenticated tracker storage, extending it with account-scoped keys and atomic timestamped record merging for new collections. Build nutrition calculations independently of rendering and providers. Keep the shared shell and existing routes; new Plan, Health and Review pages organize existing tools. Push delivery is separate from in-app recurrence, with explicit server configuration and permission.

**Tech Stack:** Next.js, React, TypeScript, Supabase RLS/RPC, native Web Push, Playwright and Node domain tests.

## Global constraints

Preserve existing records and source/owner timetable rules. Nutrition missing values remain null. No invented nutrient data or supplement doses. Native external audio links. Ordinary navigation never blocked by focus. Provider secrets/server push credentials stay server-side. Report configuration/deployment gates honestly.

## C01–C03: Shell and planning

Files: personal-nav.ts, Navbar.tsx, TrackerNavDock.tsx, More, new Plan route, Today summary/module preferences, CommandPalette and LockdownGate.

- [x] Add navigation tests for Today/Plan/Health/Review/More and normal navigation during focus; run red.
- [x] Consolidate route mappings, create Plan with Tasks/Goals/Roadmap links and an embedded focus workspace, preserve old routes.
- [x] Add optional module choices with persistent enabled state; keep only next action, top tasks, timetable and selected summaries on Today.
- [x] Replace forced focus link interception with a visible active-session strip; keep expiration/cancel correctness.

## C04–C05: Nutrition

Files: new nutrition.ts, nutrition-store.ts, nutrition-provider.ts, API routes, food page/components, record-merge.ts, use-synced-storage.ts and migration 0007.

Interfaces:
```ts
type Nutrients = Record<string, number | null>;
type PortionBasis = { amount: number; unit: 'g' | 'ml' | 'serving' };
// scaleNutrients(values, consumedAmount, basisAmount): Nutrients
// nutrientTotals(entries): { values: Nutrients; coverage: Record<string, number>; count: number }
// entries snapshot name/source/quantity/nutrients and updatedAt; deleted entries retain tombstones.
```

- [x] Write domain tests for 100g scaling, true zero versus missing, coverage, recipe yield and unknown handling. Run `node --experimental-strip-types --test src/lib/nutrition.test.ts`; confirm missing module fails.
- [x] Implement registry, validation, scaling, immutable meal snapshots and recipe scaling. Keep nutrient units explicit and volume conversions declared.
- [x] Extend synced storage with account scope and record merge options; guard session changes and queue retries. Add authenticated atomic RPC merge and collection tests.
- [x] Build dated meal log/editor with manual foods, recent/saved foods, portion edits, duplicate/delete/undo, optional targets, nutrient details and recipe builder.
- [x] Add authenticated FoodData Central search/details adapter with timeout, response normalization and unavailable state when key absent. No production demo key.
- [x] Extend validated backup/restore with all active keys and typed new records; reject malformed nutrition before writes.

## C06: Health and reminders

Files: Health route, recovery/habits components, routine-reminders.ts/store/UI, API push routes, worker and push migration/configuration guide.

- [x] Write recurrence tests for Monday 08:00, daily noon/14:00/18:00/20:00/22:00 IST; owner-only defaults; grouped lunch and Omega-3; snooze and completion identity.
- [x] Implement private schedules and timestamped occurrence history, independent completion, undo and editable times. In-app reminders survive reload and stay reachable at bedtime.
- [x] Add optional Web Push subscription API, scheduler dispatch API and service-worker click handling. Record permission/configuration accurately; never claim closed-site delivery without configured scheduler and real-device verification.
- [x] Integrate food, water, weight, workouts and optional recovery in Health. Add optional five-item habit checklist with dated completion, without duplicating tasks.

## C07–C09: Work, review and supporting tools

Files: study/revision/curfew components, Review route, LogCapture, Settings, More and sync/backup interfaces.

- [x] Consolidate recall into one accessible flow; retain evidence and history. Remove unconditional mobile/night overlays; optional rest/guard remains with immediate exit.
- [x] Add daily/weekly Review using existing task/session/journal and new nutrition/recovery records; show actual values and nutrition coverage.
- [x] Add food/reminder/recovery capture links, settings module/reminder controls, and private sharing defaults. Keep Library/Sharing destination directory uncluttered.

## C10: Verification and release evidence

- [x] Run domain tests, lint, typecheck, production build, focused browser tests and full suite.
- [ ] Review phone/desktop/light/dark images plus empty/offline/failed/long-title states. Fix real failures and retain meaningful tests when approved semantics change.
- [x] Record local implementation, migrations, environment configuration and authenticated deployment/push gates separately. Preserve user data and a rollback path. No automatic provider-key signup or notification activation.

## Remaining deployment checks

- [ ] Apply migrations 0007/0008 using production database credentials, preserving tables and backups.
- [ ] Configure FoodData Central and Web Push environment values plus the authenticated minute scheduler.
- [ ] Verify two signed-in accounts and devices for isolation, record merging, deletion and offline retries.
- [ ] Verify actual closed-site delivery on a real signed-in device, including Monday B12, grouped Lunch/Omega-3 and 22:00 Magnesium.
- [ ] Observe deployed authenticated phone/desktop journeys before declaring the release operational.

Local auth-open browser tests cannot satisfy these deployment checks. See docs/NUTRITION_AND_REMINDER_SETUP.md for setup and rollback.

## Local verification — 4 October 2026

- Full Chromium suite: **204 passed**, zero failures (2.7 minutes), against the final production build on port 4111 with Supabase auth disabled for hermetic local testing.
- Domain/storage tests: **15 passed**, zero failures.
- TypeScript, ESLint, production build and `git diff --check`: passed.
- Reviewed phone/light and desktop/dark screenshots for Today, Health, Food, Routine and Review under `artifacts/ui-ux/tracking-*`; final Today and Food screenshots reflect collapsed study details and reduced empty-state clutter. Browser layout tests also cover 320/390/768/1440 widths and both themes, plus the new food dialog at narrow widths.
- Existing tests cover failures and long timetable labels; authenticated offline/cloud reconciliation and real-device notification delivery remain unverified, as listed above. The visual/offline checklist therefore remains partial.
- The subsequent final scope audit and branch submission supersede this local phase; no deployment is claimed.

## Final scope audit — 4 October 2026

The additional audit completed task deletion/cleanup undo, task date editing, selected-task focus, one authoritative work-session controller, cross-page study controls, study completion deduplication, Review's learning/water/movement/body records, compact routine summaries, Library naming, a direct goal-to-Motivation link, calendar-boundary consistency, provider retrieval provenance and phone editor layout recovery. Latest main's Bible curriculum and resume changes were retained.

Final verification against the integrated production build: **215 Chromium tests passed** (2.3 minutes), **17 nutrition/storage/session tests passed**, and **18 curriculum/sync tests passed**. TypeScript, ESLint, production build, Bible snapshot validation (100 days / 556 chapters) and staged diff whitespace checks passed. No production credentials were added; authenticated migration, cloud/offline and real-device push gates remain pending. The scope-to-code map is in [NOVA_IMPLEMENTATION_AUDIT.md](../../NOVA_IMPLEMENTATION_AUDIT.md). Commit/push history on `fix/click-interactions` is the source of submission evidence.
