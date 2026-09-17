# Anime Dossier Personal Suite Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire Personal Suite and public portfolio into an anime-inspired, responsive, motivating product while making Share limits, access control, expiry, and public/private media behavior explicit and secure.

**Architecture:** Keep existing tracker JSON keys and calculation functions stable. Add a small set of visual primitives for chapter headers, signal panels, story panels, and focus scenes; keep feature logic in domain helpers and route components. Treat Supabase row-level security plus a server-side public-share media route as the source of truth for shared access, with localStorage remaining the instant local cache.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, lucide-react, Supabase JS/SSR, Playwright E2E, pnpm.

## Global Constraints

- The approved visual direction is **Shonen Dossier**: dramatic manga-scale typography, serialized chapter language, neon red and acid-lime signal colors, dark archive surfaces, sharp panel geometry, expressive motion, and a restrained recurring protagonist/mascot motif.
- The UI must not frame the product around provider pricing or “zero cost.” Use a **Storage limits** panel instead.
- Limits are 50 active drops maximum, 5 MB per signed-in image, approximately 1.2 MB per local-only image, and approximately 5,000 KB browser storage display capacity.
- Expired drops clear from the active list automatically; the Share page must clean expired media/share rows opportunistically.
- Every Share confirmation creates a shareable link automatically.
- Private sharing accepts normalized email allowlist entries and only matching signed-in users can read the record; matching rows appear in `/shared-with-me`.
- “Anyone with the link” is an explicit public mode and permits signed-out visitors to read an unexpired share.
- The `drops` storage bucket is private; shared records store image paths and viewers receive short-lived signed media URLs.
- Motivation uses a full-viewport focus scene. Browser fullscreen is entered only after the user activates `Enter Focus Mode`; it has a layout fallback when the API is unavailable.
- Preserve existing localStorage keys and tracker JSON shapes; new fields are optional and backward compatible.
- Color is never the only state indicator. Preserve visible keyboard focus and reduced-motion support.

---

## File Map

### Shared visual foundation

- Create: `src/components/trackers/ChapterHeader.tsx` — eyebrow, title, subtitle, next-action slot, and optional utility status.
- Create: `src/components/trackers/SignalPanel.tsx` — large metric/progress surface used by the hub and focus scene.
- Create: `src/components/trackers/StoryPanel.tsx` — editorial panel container with label, title, supporting copy, and optional action.
- Create: `src/components/trackers/SyncStatus.tsx` — explicit local/syncing/synced/error utility-rail state.
- Modify: `src/components/trackers/TrackerShell.tsx` — compose the new chapter header and responsive content frame.
- Modify: `src/components/Navbar.tsx` — command-rail desktop header and mobile menu behavior.
- Modify: `src/components/trackers/TrackerNavDock.tsx` — mobile command dock with route semantics unchanged.
- Modify: `src/app/globals.css` — Shonen Dossier tokens, typography roles, panel utilities, motion, focus, and responsive rules.
- Modify: `src/app/layout.tsx` — load display/body/utility fonts and update theme metadata.
- Test: `e2e/foundation.spec.ts` — shell semantics, mobile dock, focus styling hooks, and route continuity.

### Command Deck

- Create: `src/lib/command-deck.ts` — pure daily chapter and next-action derivation from existing tracker values.
- Modify: `src/app/trackers/page.tsx` — replace the stats wall with the daily episode layout while preserving quick actions.
- Test: `e2e/command-deck.spec.ts` — goal title, next action, signal, and quick action behavior.

### Motivation Focus Scene

- Create: `src/components/motivation/FocusScene.tsx` — full-viewport anime-inspired goal scene and fullscreen controls.
- Create: `src/lib/focus-mode.ts` — browser-safe fullscreen helpers and accessible labels.
- Modify: `src/app/motivation/page.tsx` — derive current goal/milestone, render FocusScene, keep journal and quote management below it.
- Test: `e2e/motivation-focus.spec.ts` — goal anchoring, focus fallback, activation/exit labels, and existing quote/journal persistence.

### Share domain and secure media

- Create: `src/lib/share-domain.ts` — limits, expiry, email normalization, access-mode transitions, and storage path parsing.
- Create: `src/app/api/share/[shareId]/route.ts` — public share metadata/media signing endpoint using server-only Supabase credentials.
- Create: `supabase/migrations/0005_private_share_media.sql` — access-mode columns, path storage, private bucket, RLS, and storage policies.
- Modify: `src/app/share/page.tsx` — hard-limit UI, auto-clear fieldset, automatic share link creation, access mode editor, and storage-limit panel.
- Modify: `src/app/share/[shareId]/page.tsx` — authorized row loading and signed media URL rendering.
- Modify: `src/app/shared-with-me/page.tsx` — access-aware inbox grouping, content metadata, and failure/empty states.
- Modify: `src/lib/backup.ts` — include share access metadata without exporting secrets.
- Test: `e2e/share.spec.ts` — local limits/expiry UI plus configured Supabase private/public/revoke flows.

### Product-wide chapter polish

- Modify: `src/app/intermittent-fasting/page.tsx` — active timer as lead story beat.
- Modify: `src/app/workout-tracking/page.tsx` — progression sequence and completion state.
- Modify: `src/app/goal/page.tsx` — milestone-first presentation and Motivation handoff.
- Modify: `src/app/todo/page.tsx` — next-action hierarchy and faster completion affordances.
- Modify: `src/app/settings/page.tsx` — grouped data controls and explicit sync state.
- Modify: `src/app/login/page.tsx`, `src/components/Questionnaire.tsx` — onboarding identity and chapter language.
- Modify: `src/components/pages/About.tsx`, `src/components/pages/Projects.tsx`, `src/components/pages/Skills.tsx`, `src/components/pages/Experience.tsx`, `src/components/pages/Contact.tsx` — carry the visual grammar into public portfolio surfaces without reducing readability.
- Test: `e2e/navigation.spec.ts`, existing route suites — route continuity and responsive shell behavior.

### Documentation and release evidence

- Modify: `README.md` — storage limits, Supabase migrations, public/private share configuration, and local testing commands.
- Modify: `CHANGELOG.md` — redesign and Share security behavior.
- Create: `e2e/reduced-motion.spec.ts` — reduced-motion CSS and no-looping-animation contract.

---

## Task 1: Build the Shonen Dossier visual foundation

**Files:** See shared visual foundation entries in the File Map.

**Interfaces:**

- `ChapterHeader` accepts `{ eyebrow: string; title: ReactNode; subtitle: ReactNode; action?: ReactNode; utility?: ReactNode }`.
- `SignalPanel` accepts `{ label: string; value: ReactNode; detail?: ReactNode; progress?: number; tone?: "red" | "lime" | "violet" }`.
- `StoryPanel` accepts `{ eyebrow?: string; title: ReactNode; children?: ReactNode; action?: ReactNode; tone?: "archive" | "signal" | "violet" }`.
- `SyncStatus` accepts the existing `SyncStatus` union and renders text plus icon/state marker.
- `TrackerShell` continues accepting `icon`, `title`, `subtitle`, `badge`, and `children`, so route-level behavior stays compatible.

- [ ] **Step 1: Write the failing foundation E2E test**

```ts
import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("tracker shell exposes chapter header and mobile command dock", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(page.getByText(/Command Center|Welcome back/)).toBeVisible();
  await expect(page.getByTestId("chapter-header")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
});
```

- [ ] **Step 2: Run the test and confirm the expected RED failure**

Run: `pnpm exec playwright test e2e/foundation.spec.ts --grep "chapter header"`

Expected: FAIL because `chapter-header` and `mobile-command-dock` do not exist yet.

- [ ] **Step 3: Add the visual primitives and tokens**

Implement the four components with semantic headings, `data-testid` hooks, and `aria-live="polite"` on `SyncStatus`. Add the approved palette and font roles to `globals.css`, style the existing dark/light themes, and add a single `dossier-reveal` animation plus a `prefers-reduced-motion` override that sets animation and transition durations to zero.

- [ ] **Step 4: Recompose the shell and navigation**

Update `TrackerShell` to render `ChapterHeader` and use a wider responsive frame on desktop. Update `Navbar` and `TrackerNavDock` to expose the same route hrefs with the new command-rail styling; keep `HeaderMenu` for the mobile overflow routes. Move `SyncBadge` rendering into the utility region while retaining its existing status source.

- [ ] **Step 5: Run the foundation test and the existing navigation suite**

Run: `pnpm exec playwright test e2e/foundation.spec.ts e2e/navigation.spec.ts`

Expected: PASS with no route or accessibility errors.

- [ ] **Step 6: Commit the foundation**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/trackers/ChapterHeader.tsx src/components/trackers/SignalPanel.tsx src/components/trackers/StoryPanel.tsx src/components/trackers/SyncStatus.tsx src/components/trackers/TrackerShell.tsx src/components/Navbar.tsx src/components/trackers/TrackerNavDock.tsx e2e/foundation.spec.ts e2e/navigation.spec.ts
git commit -m "feat: add shonen dossier visual foundation"
```

## Task 2: Redesign the tracker hub as the Command Deck

**Files:** `src/lib/command-deck.ts`, `src/app/trackers/page.tsx`, `e2e/command-deck.spec.ts`.

**Interfaces:**

- `buildDailyChapter(input: { goalTitle: string; goalLabel: string; goalPct: number; ringPct: number; nextAction: string; today: string }): { eyebrow: string; title: string; summary: string; nextAction: string }`.
- `buildNextAction(input: { fastRunning: boolean; workoutDone: boolean; todoCount: number; doneTodos: number; goalPct: number; metricLabel: string }): string`.
- Existing quick actions `addQuickTask`, `toggleFast`, and `logQuickMetric` keep their current side effects.

- [ ] **Step 1: Write the failing chapter derivation test in the E2E suite**

```ts
test("command deck leads with the goal and next move", async ({ page }) => {
  await seed(page, {
    "vk:prefs": { name: "Test User", goalCategory: "relocation", goalTitle: "Relocate to Berlin", questionnaireDone: true },
    "vk:todos": [{ id: "t1", text: "Choose a neighborhood", done: false, date: new Date().toISOString().slice(0, 10), priority: "P1", tag: "Goal", createdAt: 1 }],
  });
  await page.goto("/trackers");
  await expect(page.getByTestId("command-deck-title")).toContainText("Relocate to Berlin");
  await expect(page.getByTestId("next-action")).toContainText(/Choose a neighborhood|next move/i);
  await expect(page.getByTestId("momentum-signal")).toBeVisible();
});
```

- [ ] **Step 2: Run it and confirm RED**

Run: `pnpm exec playwright test e2e/command-deck.spec.ts --grep "goal and next move"`

Expected: FAIL because the new Command Deck hooks and chapter derivation do not exist.

- [ ] **Step 3: Implement pure chapter derivation**

Create `buildNextAction` with this priority: running fast → “Protect the current fast”; unfinished P1/P2 task → that task’s text; no workout → “Log the session”; goal below 100% → `Log ${metricLabel}`; otherwise → “Write today’s reflection”. Pass `metricLabel` from the existing `metric.label` value. Create `buildDailyChapter` using the current date and goal metadata; do not access browser APIs from the helper.

- [ ] **Step 4: Replace the hub hero and metric grid**

Use `ChapterHeader`, `SignalPanel`, and `StoryPanel` for the goal title, momentum signal, four story beats, quick actions, and weekly review. Keep the existing fasting ring calculation and all existing quick action handlers. Add `data-testid="command-deck-title"`, `data-testid="next-action"`, and `data-testid="momentum-signal"` to stable semantic containers.

- [ ] **Step 5: Run Command Deck, existing hub, and navigation tests**

Run: `pnpm exec playwright test e2e/command-deck.spec.ts e2e/navigation.spec.ts`

Expected: PASS; quick task, quick metric, and fasting actions still update localStorage.

- [ ] **Step 6: Commit the Command Deck**

```bash
git add src/lib/command-deck.ts src/app/trackers/page.tsx e2e/command-deck.spec.ts
git commit -m "feat: turn tracker hub into command deck"
```

## Task 3: Add the full-screen Motivation Focus Scene

**Files:** `src/lib/focus-mode.ts`, `src/components/motivation/FocusScene.tsx`, `src/app/motivation/page.tsx`, `e2e/motivation-focus.spec.ts`.

**Interfaces:**

- `enterFullscreen(element: HTMLElement): Promise<boolean>` calls `element.requestFullscreen()` only when available and returns `false` on unsupported/rejected APIs.
- `exitFullscreen(): Promise<void>` calls `document.exitFullscreen()` only when available.
- `focusModeLabel(active: boolean): string` returns `"Enter Focus Mode"` or `"Exit Focus Mode"`.
- `FocusScene` accepts `{ goalTitle: string; goalLabel: string; goalPct: number; nextMilestone: string; streak: number; quote: string; onStartAction: () => void; onShuffle: () => void; onSave: () => void; onOpenGoal: () => void }`.

- [ ] **Step 1: Write the failing Motivation Focus test**

```ts
test("motivation opens as a goal-centered focus scene", async ({ page }) => {
  await seed(page);
  await page.goto("/motivation");
  await expect(page.getByTestId("focus-scene")).toBeVisible();
  await expect(page.getByTestId("focus-goal")).toContainText("Relocate to Berlin");
  await expect(page.getByRole("button", { name: "Enter Focus Mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shuffle" })).toBeVisible();
});
```

- [ ] **Step 2: Run it and confirm RED**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts --grep "goal-centered"`

Expected: FAIL because the Motivation page currently renders a standard quote card and no focus scene.

- [ ] **Step 3: Implement fullscreen helpers and the FocusScene**

Keep all `document` access in event handlers or `focus-mode.ts`. Render `data-testid="focus-scene"` with a `min-height: calc(100svh - var(--app-header-height))` layout, a large goal title, quote, progress, milestone, streak, and one primary next action. The focus button must call `enterFullscreen` from a click handler and set local active state whether the API succeeds or not.

- [ ] **Step 4: Connect Motivation state to the current goal**

Read `prefs.goalTitle`, `goalCategory`, `milestonesFor`, and existing streak data. Select the first incomplete milestone as `nextMilestone`, or “All milestones complete” when none remain. Keep quote shuffle/favorite/custom quote/journal persistence unchanged and place those supporting sections below the focus scene.

- [ ] **Step 5: Add exit behavior and reduced-motion styles**

Listen for `fullscreenchange` and `keydown` only within a cleanup-safe effect in `FocusScene`. Update the button label and `aria-pressed` state. Use a static background and no looping animation under `prefers-reduced-motion: reduce`.

- [ ] **Step 6: Run Motivation regression coverage**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts e2e/motivation-settings.spec.ts`

Expected: PASS; focus mode labels work, the scene remains usable when fullscreen is unsupported, and quote/journal persistence remains green.

- [ ] **Step 7: Commit Motivation**

```bash
git add src/lib/focus-mode.ts src/components/motivation/FocusScene.tsx src/app/motivation/page.tsx e2e/motivation-focus.spec.ts
git commit -m "feat: add goal-centered motivation focus mode"
```

## Task 4: Secure and redesign Share

**Files:** `src/lib/share-domain.ts`, `src/app/api/share/[shareId]/route.ts`, `supabase/migrations/0005_private_share_media.sql`, `src/app/share/page.tsx`, `src/app/share/[shareId]/page.tsx`, `src/app/shared-with-me/page.tsx`, `src/lib/backup.ts`, `e2e/share.spec.ts`.

**Interfaces:**

- `MAX_DROPS = 50`, `CLOUD_IMAGE_LIMIT_BYTES = 5_000_000`, `LOCAL_IMAGE_LIMIT_BYTES = 1_200_000`, and `BROWSER_STORAGE_LIMIT_BYTES = 5_000_000` are exported from `share-domain.ts`.
- `normalizeEmail(value: string): string` lowercases and trims input.
- `isValidEmail(value: string): boolean` validates a normalized address.
- `accessMode(record: { is_public?: boolean; allowed_emails?: string[] }): "private" | "public"` returns `public` only when `is_public === true`.
- `shareLimitState(activeDrops: number, imageBytes: number): { dropsLeft: number; dropCapReached: boolean; imageCapReached: boolean; usageLabel: string }` returns values for pre-save UI.
- `expiryCopy(expiresAt: string | null, now?: number): string` returns a stable human-readable expiration summary.
- `POST /api/share/[shareId]` is not used for creating rows; `GET` accepts an existing share id and returns `{ text, imageUrl, createdAt, expiresAt, ownerEmail }` only for an unexpired public record.

- [ ] **Step 1: Write the failing Share domain/UI tests**

```ts
test("share page shows hard limits and explicit auto-clear choices", async ({ page }) => {
  await seed(page);
  await page.goto("/share");
  await expect(page.getByText("Storage limits")).toBeVisible();
  await expect(page.getByRole("group", { name: "Auto-clear this drop" })).toBeVisible();
  await expect(page.getByRole("button", { name: "24 hours" })).toBeVisible();
  await expect(page.getByRole("button", { name: "7 days" })).toBeVisible();
  await expect(page.getByRole("button", { name: "30 days" })).toBeVisible();
});

test("share editor asks for access and creates a link after confirmation", async ({ page }) => {
  await seed(page, { "vk:share": [{ id: "d1", text: "A private note", image: null, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86_400_000).toISOString(), tags: ["Note"] }] });
  await page.goto("/share");
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Who can view this drop?")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Specific people/i })).toBeChecked();
  await expect(page.getByPlaceholder("friend@gmail.com")).toBeVisible();
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `pnpm exec playwright test e2e/share.spec.ts --grep "hard limits|asks for access"`

Expected: FAIL because the page still renders the zero-cost copy and the existing editor lacks a labeled access-mode control.

- [ ] **Step 3: Implement pure Share domain helpers**

Move limit constants, email normalization/validation, expiry formatting, and access-mode derivation out of `src/app/share/page.tsx`. Add tests through the browser-visible UI and keep the helper functions free of React, `window`, and Supabase dependencies.

- [ ] **Step 4: Replace the composer limit and auto-clear UI**

Render a labeled `fieldset`/`role="group"` named `Auto-clear this drop` with three button-backed options. Show the selected expiration date/time under the control. Replace every “zero-cost” string with exact limit language. Disable `Drop it` at 50 active drops, show the remaining count before that point, reject local/cloud images at their respective byte caps, and keep export beside the Storage limits panel.

- [ ] **Step 5: Replace the share editor with explicit access modes**

When the user clicks `Share`, show a panel titled `Who can view this drop?` with a private `Specific people` radio selected by default and a public `Anyone with the link` radio. In private mode, normalize/add/remove emails. In public mode, hide the email input and show the consequence text. On confirmation, always insert or update one `shared_drops` row and copy the generated URL. Show access mode, expiry, copy link, and revoke controls after success.

- [ ] **Step 6: Add the private storage/share migration**

Create `0005_private_share_media.sql` to add `is_public boolean not null default false`, `image_path text`, and a compatibility-preserving backfill from existing `image_url` values where possible. Set the `drops` bucket to private, drop the public storage select policy, allow owner writes/deletes, and add a `shared_drops` select policy that permits owners, matching signed-in allowlist emails, or unexpired `is_public` rows. Keep expired rows unreadable.

- [ ] **Step 7: Implement authorized media loading**

Update Share creation to store `image_path` and never persist a public object URL. Update private detail loading to call `createSignedUrl` after the row passes RLS. Implement the public `GET /api/share/[shareId]` route with `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY` credentials, verify the row is public and unexpired, and create a bounded signed URL for the image path. Return a neutral 404 for private, revoked, expired, or missing records.

- [ ] **Step 8: Fix Shared with me and backup behavior**

Query `shared_drops` as the signed-in user without client-side access guesses; RLS determines visibility. Group by sender, show content type/expiry/access metadata, and separate loading, empty, and unavailable states. Export the local drop data and non-secret link metadata (`url`, `expiresAt`, `emails`, `isPublic`) without exporting storage tokens.

- [ ] **Step 9: Run local and configured Share tests**

Run local UI coverage: `pnpm exec playwright test e2e/share.spec.ts --grep "hard limits|asks for access"`.

Run configured integration coverage with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only Supabase credentials set: `pnpm exec playwright test e2e/share.spec.ts`.

Expected: local limits/expiry UI passes; configured tests prove private allowlist visibility, public signed-out link visibility, image signing, revoke denial, and Shared with me filtering.

- [ ] **Step 10: Document migration order and commit Share**

```bash
git add src/lib/share-domain.ts src/app/api/share/[shareId]/route.ts supabase/migrations/0005_private_share_media.sql src/app/share/page.tsx src/app/share/[shareId]/page.tsx src/app/shared-with-me/page.tsx src/lib/backup.ts e2e/share.spec.ts README.md
git commit -m "feat: add explicit share access and storage limits"
```

## Task 5: Carry the visual language through every chapter

**Files:** tracker and public-page entries in the File Map.

**Interfaces:** Existing route URLs, store hooks, and domain calculations do not change. Each route adopts the shared `ChapterHeader`, `StoryPanel`, and relevant signal/action primitives.

- [ ] **Step 1: Write the failing route consistency test**

```ts
test("every primary chapter exposes the shared visual shell", async ({ page }) => {
  await seed(page);
  for (const route of ["/intermittent-fasting", "/workout-tracking", "/goal", "/todo", "/settings", "/portfolio"]) {
    await page.goto(route);
    await expect(page.getByTestId("chapter-header")).toBeVisible();
  }
});
```

- [ ] **Step 2: Run it and confirm RED**

Run: `pnpm exec playwright test e2e/navigation.spec.ts --grep "visual shell"`

Expected: FAIL on at least one route before the chapter migration is complete.

- [ ] **Step 3: Migrate fasting, workouts, goals, todo, and settings**

Replace only presentation containers and labels. Keep timers, set logging, milestone editing, todo toggles, preference updates, export/import, and wipe safeguards intact. Use a single lead action per route and give empty states one concrete next step.

- [ ] **Step 4: Migrate onboarding and public portfolio surfaces**

Use chapter language and the approved palette in `Questionnaire` and public sections. Keep contact details, resume links, project links, and professional copy readable; use anime motifs as framing and motion, not as a substitute for content.

- [ ] **Step 5: Run all route suites**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/goal.spec.ts e2e/fasting.spec.ts e2e/workouts.spec.ts e2e/todos.spec.ts e2e/motivation-settings.spec.ts e2e/onboarding-hub.spec.ts`

Expected: PASS with existing persistence and route assertions unchanged.

- [ ] **Step 6: Commit the chapter migration**

```bash
git add src/app/intermittent-fasting/page.tsx src/app/workout-tracking/page.tsx src/app/goal/page.tsx src/app/todo/page.tsx src/app/settings/page.tsx src/app/login/page.tsx src/components/Questionnaire.tsx src/components/pages/About.tsx src/components/pages/Projects.tsx src/components/pages/Skills.tsx src/components/pages/Experience.tsx src/components/pages/Contact.tsx e2e/navigation.spec.ts
git commit -m "feat: carry dossier design across the suite"
```

## Task 6: Responsive, reduced-motion, and release verification

**Files:** `e2e/reduced-motion.spec.ts`, `README.md`, `CHANGELOG.md`, plus any files required by failing gates.

- [ ] **Step 1: Add the reduced-motion contract test**

```ts
test("reduced motion disables non-essential animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motivation");
  const duration = await page.getByTestId("focus-scene").evaluate((el) => getComputedStyle(el).animationDuration);
  expect(["0s", "0.001s"]).toContain(duration);
});
```

- [ ] **Step 2: Run the reduced-motion and full E2E suites**

Run: `pnpm exec playwright test e2e/reduced-motion.spec.ts` then `pnpm test:e2e`.

Expected: PASS at desktop and configured mobile projects, with no focus traps, console errors, or route regressions.

- [ ] **Step 3: Verify lint and production build**

Run: `pnpm lint && pnpm build`.

Expected: both commands exit 0 with no TypeScript, ESLint, or route-handler errors.

- [ ] **Step 4: Run the visual QA matrix**

Capture `/trackers`, `/motivation`, `/share`, `/shared-with-me`, and `/share/[id]` at 390px, 768px, and 1440px widths. Check overflow, focus rings, readable contrast, image cropping, sticky/mobile navigation, focus-scene landscape behavior, and public/private access copy.

- [ ] **Step 5: Update docs and release evidence**

Document Supabase migration order (`0001` through `0005`), required server-only share signing variables, local-mode behavior, hard limits, public/private link semantics, test commands, and the fact that gateway/link access does not imply delivery or notification.

- [ ] **Step 6: Commit release evidence**

```bash
git add e2e/reduced-motion.spec.ts README.md CHANGELOG.md
git commit -m "chore: verify dossier redesign release gates"
```

## Final review checklist

- [ ] No “zero-cost” or provider-pricing language remains in the Share UI or docs.
- [ ] Share creation always produces a link after access confirmation.
- [ ] Public mode is visibly and explicitly opt-in.
- [ ] Private rows appear only for matching signed-in emails and owners.
- [ ] Private bucket objects are not directly public.
- [ ] Motivation has a goal-centered focus scene and a user-activated fullscreen path.
- [ ] Existing localStorage keys, tracker calculations, and route URLs remain compatible.
- [ ] Desktop/mobile/reduced-motion/accessibility checks pass.
- [ ] `pnpm lint`, `pnpm build`, and the E2E suite have current evidence.
