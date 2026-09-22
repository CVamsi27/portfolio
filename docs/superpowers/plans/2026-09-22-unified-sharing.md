# Unified Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with checkpoints.

**Goal:** Make `/share` the single personal Sharing destination for creating, reviewing, and receiving shared items while keeping existing share links and `/shared-with-me` compatibility intact.

**Architecture:** Extract the current incoming inbox into a reusable client component. Add a query-driven view switcher to the existing Share page, with `create` as the default and `incoming` as the compatibility target. Make Sharing a primary personal navigation item and remove duplicate entries from More; leave storage, Supabase access, permissions, and public share URLs unchanged.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Playwright, existing `useSyncedStorage`/Supabase helpers.

## Global Constraints

- `/share` is canonical; `/shared-with-me` redirects to `/share?view=incoming`.
- Existing `/share/[shareId]` URLs, `share` local storage, `share:links` synced storage, Supabase queries, access modes, expiry behavior, and RLS assumptions remain unchanged.
- The Inbox includes self-owned rows and labels them `Your shared items`.
- Public `buildora.work` remains untouched.
- No new persistence models, dependencies, or database migrations.
- Mobile navigation exposes one Sharing destination and no duplicate sharing links in More.

## File map

- `src/components/trackers/SharedInbox.tsx` — reusable incoming/self-shared inbox UI and Supabase loading state.
- `src/app/shared-with-me/page.tsx` — compatibility redirect only.
- `src/app/share/page.tsx` — canonical composer/sent view, inbox view, and view switcher.
- `src/lib/personal-nav.ts` — primary Sharing item and removal from More.
- `src/lib/trackers.ts` — remove duplicate sharing metadata if still exposed.
- `src/app/more/page.tsx`, `src/app/login/page.tsx`, `src/app/settings/page.tsx` — canonical contextual links and copy.
- `e2e/navigation.spec.ts`, `e2e/share.spec.ts`, `e2e/shared-with-me.spec.ts`, `e2e/tracker-actions.spec.ts` — regression coverage.

---

### Task 1: Add failing coverage for the unified Sharing experience

**Files:** Modify `e2e/navigation.spec.ts`, `e2e/share.spec.ts`, `e2e/shared-with-me.spec.ts`, and `e2e/tracker-actions.spec.ts`.

**Interfaces:** Tests consume the existing `seed(page)` helper and current Supabase test setup. They define the contract for navigation, query views, compatibility routing, and self-shared rows.

- [ ] **Step 1: Test primary navigation.** Assert the personal mobile dock has exactly one `Sharing` link to `/share`, and `/more` has no separate `Share` or `Shared with me` navigation links.
- [ ] **Step 2: Test canonical views.** Assert `/share` shows the create composer by default and a switcher labeled `Create & sent` and `Inbox`. Assert `/share?view=incoming` shows the inbox heading and review action.
- [ ] **Step 3: Test compatibility.** Navigate to `/shared-with-me`; expect the final URL `/share?view=incoming` and the inbox heading.
- [ ] **Step 4: Test self-shared rows.** Use the existing Supabase response setup with a row whose `owner` is the seeded current user and assert `Your shared items` plus the row text.
- [ ] **Step 5: Run the focused tests and verify they fail for the missing behavior.**

```bash
pnpm run pretest:e2e
CI=1 pnpm exec playwright test e2e/navigation.spec.ts e2e/share.spec.ts e2e/shared-with-me.spec.ts e2e/tracker-actions.spec.ts --workers=1 --retries=0
```

Expected: failures identify missing Sharing navigation, combined views, redirect, or self-shared rendering—not test setup errors.

- [ ] **Step 6: Commit the red tests.**

```bash
git add e2e/navigation.spec.ts e2e/share.spec.ts e2e/shared-with-me.spec.ts e2e/tracker-actions.spec.ts
git commit -m "test(personal): define unified sharing navigation"
```

### Task 2: Extract the inbox and make `/share` canonical

**Files:** Create `src/components/trackers/SharedInbox.tsx`; modify `src/app/shared-with-me/page.tsx` and `src/app/share/page.tsx`.

**Interfaces:** `SharedInbox` accepts `{ id: string } | null` for the current user and renders loading, unavailable, empty, grouped, and self-owned states. `SharePage` reads `view=incoming` with `useSearchParams`; absent or unknown values select the create/sent view.

- [ ] **Step 1: Extract inbox behavior.** Move the existing incoming types, fetcher, grouping helper, state card, summary, list, timeout, retry behavior, and `/share/[id]` links into `SharedInbox.tsx` without changing query columns or labels.
- [ ] **Step 2: Replace the old page with a redirect.** Make `src/app/shared-with-me/page.tsx` a server page that calls `redirect("/share?view=incoming")`.
- [ ] **Step 3: Add a compact view switcher.** In `SharePage`, render links to `/share` and `/share?view=incoming` with selected styling and `aria-current`, labeled `Create & sent` and `Inbox`.
- [ ] **Step 4: Render one view at a time.** Keep the existing composer, search/filter, sent drops, storage limits, and share editor for the default view. Render `SharedInbox` and inbox-specific heading/action copy for the incoming view. Do not change write, storage, or access behavior.
- [ ] **Step 5: Run focused sharing tests and verify green.**

```bash
CI=1 pnpm exec playwright test e2e/share.spec.ts e2e/shared-with-me.spec.ts --workers=1 --retries=0
```

- [ ] **Step 6: Commit the route implementation.**

```bash
git add src/components/trackers/SharedInbox.tsx src/app/shared-with-me/page.tsx src/app/share/page.tsx
git commit -m "feat(personal): combine sharing and inbox views"
```

### Task 3: Make Sharing a primary navigation destination

**Files:** Modify `src/lib/personal-nav.ts`, `src/lib/trackers.ts`, `src/app/more/page.tsx`, `src/app/login/page.tsx`, `src/app/settings/page.tsx`, `e2e/navigation.spec.ts`, and `e2e/tracker-actions.spec.ts`.

**Interfaces:** Add `{ id: "sharing", href: "/share", label: "Sharing", short: "Share", icon: "share" }` to the primary nav and include `sharing` in its id union. Remove both sharing entries from More. Contextual inbox links use `/share?view=incoming`; create/sent links use `/share`.

- [ ] **Step 1: Update the nav model.** Add Sharing to `PERSONAL_PRIMARY_NAV`; remove `/share` and `/shared-with-me` from `PERSONAL_MORE_NAV`; update any secondary tracker metadata that exposes duplicate entries.
- [ ] **Step 2: Update contextual copy and links.** Point login/settings/More copy to the unified route, using the incoming query only when the destination specifically means incoming items.
- [ ] **Step 3: Run navigation/action tests.**

```bash
CI=1 pnpm exec playwright test e2e/navigation.spec.ts e2e/tracker-actions.spec.ts --workers=1 --retries=0
```

- [ ] **Step 4: Commit navigation integration.**

```bash
git add src/lib/personal-nav.ts src/lib/trackers.ts src/app/more/page.tsx src/app/login/page.tsx src/app/settings/page.tsx e2e/navigation.spec.ts e2e/tracker-actions.spec.ts
git commit -m "feat(personal): add sharing to primary navigation"
```

### Task 4: Release verification

**Files:** Modify only verified files from Tasks 1–3 if a regression is found.

- [ ] **Step 1: Run lint and whitespace checks.**

```bash
pnpm lint
git diff --check
```

- [ ] **Step 2: Run the complete browser suite.**

```bash
pnpm run pretest:e2e
CI=1 pnpm exec playwright test --workers=1
```

Expected: all existing tests pass, including public-host regression coverage.

- [ ] **Step 3: Audit route references.**

```bash
rg -n 'href="/shared-with-me"|href="/share"|/shared-with-me|/share\\?view=incoming' src e2e
```

Confirm primary navigation exposes `/share` once and `/shared-with-me` remains only a compatibility route or intentional incoming link.

- [ ] **Step 4: Review the final diff.** Confirm no public-host files, share data models, Supabase policies, or unrelated tracker behavior changed. Preserve existing untracked `.freebuff/` and `.superpowers/` directories.

- [ ] **Step 5: If the release suite requires a verified fix, stage only the affected files from Tasks 1–3 and commit it with `test(personal): verify unified sharing release`; if no fix is needed, leave the tree unchanged after verification.**

```bash
git add src/components/trackers/SharedInbox.tsx src/app/shared-with-me/page.tsx src/app/share/page.tsx src/lib/personal-nav.ts src/lib/trackers.ts src/app/more/page.tsx src/app/login/page.tsx src/app/settings/page.tsx e2e/navigation.spec.ts e2e/share.spec.ts e2e/shared-with-me.spec.ts e2e/tracker-actions.spec.ts
git commit -m "test(personal): verify unified sharing release"
```
