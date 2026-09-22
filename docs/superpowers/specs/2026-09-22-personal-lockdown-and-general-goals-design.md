# Personal Lockdown and General Goals Design

**Date:** 2026-09-22  
**Scope:** `personal.buildora.work` / Personal surface only  
**Branch:** `fix/personal-today-cockpit`

## Problem

Personal Buildora needs a clear bedtime and focus ritual, but a browser app cannot disable unrelated phone or laptop apps, force operating-system Do Not Disturb, or lock a device globally. The product also contains overly specific examples and defaults that can make the experience feel designed only for a Germany relocation or job-search goal.

## Goals

- Provide an explicit, local-time bedtime schedule that users must configure before enabling.
- Make an active focus session and bedtime state feel locked inside the Personal app.
- Block in-app navigation during active focus and record interruptions.
- Explain the device-level steps needed for iOS, Android, macOS, and Windows.
- Add a neutral `General momentum` goal alongside specific goal categories.
- Keep Germany, job, and destination-specific imagery/content conditional on the user selecting those values.
- Preserve local-only mode, existing synced storage, existing focus sessions, and public Buildora behavior.

## Non-goals and platform boundary

- No claim that a website can disable phone or laptop apps.
- No automatic OS Do Not Disturb, Screen Time, Digital Wellbeing, Focus, or app-limit control.
- No native mobile or desktop companion app in this release.
- No changes to `buildora.work` or public portfolio routing.

## User experience

### Bedtime

Bedtime is off until the user selects a schedule. Settings expose:

- enable/disable control;
- local start and end times;
- optional day selection;
- a preview of the next lock window;
- a device-preparation checklist with platform-specific instructions.

When the schedule is active, Personal routes show a calm lock screen with the reason, local end time, and an explicit emergency exit. The app does not prevent the user from closing the browser; it protects the in-app experience and records the exit when the page can observe it.

### Focus

Starting a focus session activates the existing fullscreen attempt and adds:

- a route/navigation lock inside Personal;
- visible session status and remaining time;
- interruption count for visibility changes, fullscreen exit, and attempted in-app navigation;
- explicit finish, pause, and cancel controls;
- a fallback layout when fullscreen is unavailable.

The focus surface includes a concise “Prepare your device” checklist rather than pretending to control other apps.

### General goals

Onboarding presents `General momentum` alongside Relocation, Career Growth, Fitness, Weight Loss, Learning, Financial, and Custom. General momentum:

- uses broad action language;
- does not require a destination, job title, or private goal title;
- uses broad motivation keywords and fallback scenes;
- keeps the same milestones, task logging, focus, and review mechanics.

Specific imagery and copy are selected only from explicit user choices, such as a relocation destination or career category.

## Data model

Add a synced `LockdownPreferences` value through the existing generic `tracker_data` layer:

```ts
type LockdownPreferences = {
  bedtimeEnabled: boolean;
  bedtimeStart: string;
  bedtimeEnd: string;
  bedtimeDays: number[];
  deviceChecklist: Record<"ios" | "android" | "macos" | "windows", boolean>;
};
```

No Supabase migration is required. The existing local cache and optional sync continue to be the source of truth. Focus session records retain their current interruption and fullscreen fields.

Extend `GoalCategory` with `general`, provide safe defaults, and keep older stored values compatible through normalization.

## Architecture

- `src/lib/lockdown.ts` owns schedule evaluation, next-window calculation, and platform checklist metadata.
- `src/components/trackers/LockdownGate.tsx` owns the in-app blocking presentation and route-lock behavior.
- `src/components/trackers/DevicePreparation.tsx` renders platform-specific, honest setup steps.
- `src/components/trackers/FocusSprint.tsx` continues to own session timing and interruption persistence, delegating shared lock behavior to the lockdown helper where appropriate.
- `src/lib/user-prefs.ts` owns the normalized `general` category and neutral display labels.
- `src/lib/motivation-media.ts` keeps category and destination mapping allowlisted; General momentum uses broad keywords only.
- Settings owns bedtime configuration; the shell and focus surface consume the normalized state.

## Security and privacy

- Bedtime and focus state remain private tracker data under the existing RLS-backed synced store.
- No raw goal title, journal content, or personal notes are sent to public motivation providers.
- Device instructions are static app content and do not request OS-level permissions.
- Route locking is an experience safeguard, not an authorization boundary.

## Verification

- Unit-test bedtime windows across midnight, disabled schedules, selected days, and local time.
- Test lock-screen visibility, route blocking, emergency exit, and focus interruption counts.
- Test fullscreen success and fallback paths.
- Test onboarding and motivation for General momentum without Germany/job-specific copy.
- Test explicit relocation and career selections still produce their appropriate category imagery.
- Run lint, production build, full Playwright, mobile widths 320/390/430, and public-host regression tests.

