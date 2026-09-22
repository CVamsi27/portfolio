# Personal Lockdown and General Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with checkpoints.

**Goal:** Add honest browser/PWA bedtime and focus lockdown experiences, and make Personal Buildora neutral and reusable for users with goals other than Germany or job search.

**Architecture:** Keep device-wide controls outside the browser boundary. Add a pure local-time schedule module, a synced lockdown preference store, and a Personal-only gate. Normalize a new general goal category through preferences and motivation media so destination/job content is opt-in.

**Tech Stack:** Next.js App Router, React 19, TypeScript, existing useSyncedStorage tracker_data layer, localStorage fallback, Playwright.

## Global Constraints

- Public buildora.work remains untouched.
- Bedtime has no enabled default; a user must choose a schedule before enabling it.
- Browser lockdown cannot disable unrelated apps, force OS Do Not Disturb, or lock the entire phone/laptop.
- No new Supabase migration; use the existing generic tracker_data RLS path and local-only fallback.
- Do not send raw goal titles, journal entries, or private notes to public motivation providers.
- Preserve current focus-session records, /trackers compatibility, sharing/privacy, and Personal-only routing.
- Test widths 320px, 390px, and 430px with no horizontal overflow.

## File Map

- Create src/lib/lockdown.ts for schedule evaluation and platform checklist metadata.
- Create src/components/trackers/DevicePreparation.tsx for honest OS setup guidance.
- Create src/components/trackers/LockdownGate.tsx for Personal route protection.
- Modify src/lib/user-prefs.ts, src/lib/trackers.ts, and src/lib/command-deck.ts for general momentum.
- Modify src/lib/motivation-media.ts for broad allowlisted fallbacks.
- Modify src/lib/tracker-store.ts only if a focused lockdown hook is useful.
- Modify src/components/trackers/FocusSprint.tsx and src/lib/focus-sprint.ts for active lock state.
- Modify src/app/settings/page.tsx and Questionnaire.tsx for setup.
- Add e2e/lockdown-domain.spec.ts, e2e/lockdown.spec.ts, and e2e/general-goals.spec.ts.

---

### Task 1: Add the General momentum goal model

Files:
- Modify src/lib/user-prefs.ts
- Modify src/lib/trackers.ts
- Modify src/lib/command-deck.ts
- Test e2e/general-goals.spec.ts

Interfaces:
- GoalCategory gains the literal "general".
- GOAL_CATEGORIES gains General momentum with the sparkles icon and copy "Build momentum around whatever matters next".
- DEFAULT_GOAL_METRICS.general becomes { label: "Useful moves", target: 1, unit: "move" }.
- displayGoalTitle({ goalCategory: "general", goalTitle: "" }) returns "General momentum".
- Invalid stored categories normalize to general; known legacy categories remain unchanged.

- [ ] Step 1: Write failing assertions.

    test("general momentum is neutral", async ({ page }) => {
      await seed(page, { "vk:prefs": { goalCategory: "general", questionnaireDone: true } });
      await page.goto("/motivation");
      await expect(page.getByTestId("focus-scene")).toContainText("General momentum");
      await expect(page.getByTestId("focus-scene")).not.toContainText(/Germany|Berlin|job search/i);
    });

- [ ] Step 2: Run pnpm exec playwright test e2e/general-goals.spec.ts --workers=1. It must fail because general is not yet valid.
- [ ] Step 3: Add the literal, category, metric, normalization, and neutral command-deck copy.
- [ ] Step 4: Add the general branch to any motivation API category validation.
- [ ] Step 5: Run the focused test again; it must pass.
- [ ] Step 6: Commit with:
      git add src/lib/user-prefs.ts src/lib/trackers.ts src/lib/command-deck.ts e2e/general-goals.spec.ts
      git commit -m "feat(personal): add neutral general momentum goal"

---

### Task 2: Build the bedtime schedule domain

Files:
- Create src/lib/lockdown.ts
- Create e2e/lockdown-domain.spec.ts

Interfaces:

    export type LockdownPlatform = "ios" | "android" | "macos" | "windows";

    export type LockdownPreferences = {
      bedtimeEnabled: boolean;
      bedtimeStart: string;
      bedtimeEnd: string;
      bedtimeDays: number[];
      deviceChecklist: Record<LockdownPlatform, boolean>;
    };

    export const DEFAULT_LOCKDOWN_PREFERENCES: LockdownPreferences = {
      bedtimeEnabled: false,
      bedtimeStart: "22:30",
      bedtimeEnd: "07:00",
      bedtimeDays: [0, 1, 2, 3, 4, 5, 6],
      deviceChecklist: { ios: false, android: false, macos: false, windows: false },
    };

    export function isBedtimeLocked(preferences: LockdownPreferences, now: Date): boolean;
    export function nextBedtimeWindow(preferences: LockdownPreferences, now: Date): { start: Date; end: Date } | null;

- [ ] Step 1: Write failing tests for disabled schedules, same-day windows, overnight windows, unselected weekdays, and the after-midnight portion of an overnight window.
- [ ] Step 2: Run pnpm exec playwright test e2e/lockdown-domain.spec.ts --workers=1. It must fail because the module is absent.
- [ ] Step 3: Implement minute-of-day parsing, malformed-value safety, selected-day handling, and overnight previous-day handling.
- [ ] Step 4: Export static iOS, Android, macOS, and Windows preparation metadata. Each instruction must say the user activates OS Focus/DND/app limits manually.
- [ ] Step 5: Run the domain suite and confirm it passes.
- [ ] Step 6: Commit with:
      git add src/lib/lockdown.ts e2e/lockdown-domain.spec.ts
      git commit -m "feat(personal): add bedtime lockdown scheduling"

---

### Task 3: Add device preparation and the Personal lockdown gate

Files:
- Create src/components/trackers/DevicePreparation.tsx
- Create src/components/trackers/LockdownGate.tsx
- Modify src/components/trackers/PersonalShell.tsx
- Modify src/app/layout.tsx only when the tracker host can be identified server-side
- Test e2e/lockdown.spec.ts

Interface:

    type LockdownGateProps = {
      children: React.ReactNode;
      focusActive?: boolean;
    };

LockdownGate reads lockdown:preferences through useSyncedStorage, calls isBedtimeLocked, and renders children normally when no lock is active.

- [ ] Step 1: Write failing tests that cover disabled bedtime, active bedtime lock screen, emergency exit, same-origin navigation blocking during focus, and mobile overflow.
- [ ] Step 2: Run pnpm exec playwright test e2e/lockdown.spec.ts --workers=1. It must fail because the gate does not exist.
- [ ] Step 3: Implement DevicePreparation with four compact OS sections and 44px touch targets. Persist checklist completion through the lockdown preference store.
- [ ] Step 4: Implement a fixed accessible overlay with aria-modal, reason, local end time, Settings link, and emergency exit. Add data-personal-lock="bedtime" or "focus" to document.documentElement while active.
- [ ] Step 5: Intercept only same-origin Personal anchors during focus. Do not block browser close, OS navigation, or external links.
- [ ] Step 6: Mount the gate inside PersonalShell or the tracker surface, never as an unconditional public layout overlay.
- [ ] Step 7: Run pnpm exec playwright test e2e/lockdown.spec.ts e2e/navigation.spec.ts --workers=1; both must pass.
- [ ] Step 8: Commit with:
      git add src/components/trackers/DevicePreparation.tsx src/components/trackers/LockdownGate.tsx src/components/trackers/PersonalShell.tsx src/app/layout.tsx e2e/lockdown.spec.ts
      git commit -m "feat(personal): add in-app bedtime lock screen"

---

### Task 4: Integrate focus lockdown with existing sessions

Files:
- Modify src/components/trackers/FocusSprint.tsx
- Modify src/lib/focus-mode.ts
- Modify src/lib/focus-sprint.ts
- Test e2e/focus-sprint.spec.ts
- Test e2e/motivation-focus.spec.ts

Interfaces:
- Preserve data-testid focus-sprint and Start/Pause/Resume/Finish/Cancel labels.
- Add data-focus-lock="active|inactive" and visible interruption text.
- Keep FocusActiveState.interruptions, fullscreen, and existing session persistence backward compatible.

- [ ] Step 1: Add failing assertions that starting sets data-focus-lock active, an attempted same-origin route leaves the path unchanged and increments interruptions, fullscreen exit increments interruptions, and finishing clears the lock while persisting a completed session.
- [ ] Step 2: Run pnpm exec playwright test e2e/focus-sprint.spec.ts e2e/motivation-focus.spec.ts --workers=1; new assertions must fail while existing timing behavior remains the baseline.
- [ ] Step 3: Use the existing active focus storage as the shared lock source. Ensure finish, cancel, unmount, and fullscreen exit remove document lock attributes and restore navigation.
- [ ] Step 4: Place DevicePreparation below the timer or behind a disclosure; explain that OS DND/app limits are manual.
- [ ] Step 5: Run pnpm exec playwright test e2e/focus-sprint.spec.ts e2e/motivation-focus.spec.ts e2e/lockdown.spec.ts --workers=1; all must pass.
- [ ] Step 6: Commit with:
      git add src/components/trackers/FocusSprint.tsx src/lib/focus-mode.ts src/lib/focus-sprint.ts e2e/focus-sprint.spec.ts e2e/motivation-focus.spec.ts
      git commit -m "feat(personal): lock navigation during focus sessions"

---

### Task 5: Add bedtime configuration to Settings

Files:
- Modify src/app/settings/page.tsx
- Modify src/lib/tracker-store.ts or add the focused hook next to existing store hooks
- Test e2e/lockdown.spec.ts

Interface:

    export function useLockdownPreferences(): {
      value: LockdownPreferences;
      setValue: (next: LockdownPreferences | ((previous: LockdownPreferences) => LockdownPreferences)) => void;
      status: SyncStatus;
    };

- [ ] Step 1: Write failing Settings tests: disabled initially; enable only after valid times and at least one day; persistence after reload; invalid empty time cannot enable.
- [ ] Step 2: Run pnpm exec playwright test e2e/lockdown.spec.ts --grep Settings --workers=1; it must fail because controls do not exist.
- [ ] Step 3: Implement useSyncedStorage("lockdown:preferences", DEFAULT_LOCKDOWN_PREFERENCES) with malformed-data normalization.
- [ ] Step 4: Add time inputs, seven day toggles, explicit enable checkbox, local-time label, next-window preview, save status, and DevicePreparation. Keep existing backup/restore/account/danger-zone sections unchanged.
- [ ] Step 5: Run lockdown/navigation tests at widths 320, 390, and 430; confirm no horizontal overflow.
- [ ] Step 6: Commit with:
      git add src/app/settings/page.tsx src/lib/tracker-store.ts e2e/lockdown.spec.ts
      git commit -m "feat(personal): configure bedtime protection"

---

### Task 6: Remove specific defaults from onboarding and motivation

Files:
- Modify src/components/Questionnaire.tsx
- Modify src/lib/motivation-media.ts
- Modify src/app/motivation/page.tsx
- Modify src/app/trackers/landing/page.tsx
- Modify active Personal copy found with rg -n "Germany|Berlin|job search|visa" src
- Test e2e/general-goals.spec.ts

Interfaces:
- General media uses only broad allowlisted keywords: focus, resilience, progress.
- Goal-aware relocation includes a country only when goalCountry is explicitly selected.
- Neutral defaults do not contain Germany, Berlin, or job-search assumptions.

- [ ] Step 1: Add failing tests for General momentum across onboarding, hub, motivation, and Personal landing; add a Germany relocation test to preserve explicit destination imagery.
- [ ] Step 2: Run pnpm exec playwright test e2e/general-goals.spec.ts --workers=1; it must fail on current specific copy/defaults.
- [ ] Step 3: Make onboarding ask what the user wants to move forward, show General momentum as an equal option, and render country/job fields only for relevant categories.
- [ ] Step 4: Add General momentum label, rationale, fallback scene, and keyword branch without weakening the existing allowlisted country mapping or API privacy.
- [ ] Step 5: Run pnpm exec playwright test e2e/general-goals.spec.ts e2e/motivation-settings.spec.ts e2e/motivation-focus.spec.ts --workers=1; all must pass.
- [ ] Step 6: Commit with:
      git add src/components/Questionnaire.tsx src/lib/motivation-media.ts src/app/motivation/page.tsx src/app/trackers/landing/page.tsx e2e/general-goals.spec.ts
      git commit -m "feat(personal): generalize onboarding and motivation"

---

### Task 7: Release verification and branch delivery

Files:
- Modify README.md or existing Personal architecture documentation if release notes are maintained there.
- Test all relevant E2E suites.

- [ ] Step 1: Document vk:lockdown:preferences, local-only behavior, existing tracker_data sync, and manual OS DND/app blocking.
- [ ] Step 2: Run:
      pnpm lint
      pnpm run pretest:e2e
      pnpm exec playwright test
      git diff --check
  Baseline-browser-mapping may continue to emit its existing stale-data warning.
- [ ] Step 3: Review git status --short, git diff main...HEAD --stat, and rg -n "Germany|Berlin|job search" src. Confirm matches are explicit user-selected mappings or tests/docs, not neutral defaults. Confirm public-host regression tests pass.
- [ ] Step 4: Push with:
      git push -u origin fix/personal-today-cockpit
- [ ] Step 5: Merge safely:
      git checkout main
      git pull --ff-only origin main
      git merge --ff-only fix/personal-today-cockpit
      git push origin main
      git checkout fix/personal-today-cockpit
  If ff-only fails because remote main advanced, stop for non-destructive reconciliation; never force-push.
- [ ] Step 6: Commit any documentation change with:
      git add README.md
      git commit -m "docs(personal): document lockdown limitations"

