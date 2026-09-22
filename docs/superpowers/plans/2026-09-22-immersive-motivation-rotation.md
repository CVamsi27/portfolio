# Immersive Motivation Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Motivation imagery persistent, rotate approved category visuals automatically, fill the Personal viewport, and rename the visible tracker brand to NOVA.

**Architecture:** Extend the existing privacy-safe motivation media model with a small approved visual deck. Let the page select a slide on a timer, while `FocusScene` owns image retention, load/error transitions, attribution, and full-viewport presentation. Centralize the visible tracker name as `NOVA`; preserve all internal keys and public Buildora boundaries.

**Tech Stack:** Next.js App Router, React 19, TypeScript, existing same-origin motivation relay, Playwright.

## Global Constraints

- Work only on Personal tracker surfaces and shared tracker brand values; public Buildora identity and routing remain unchanged.
- Keep all motivation provider inputs category/country based; never send private goal titles, journal text, or notes.
- Use only HTTPS image URLs from the existing allowlisted relay hosts.
- Preserve attribution, source links, local fallback behavior, fullscreen focus mode, reduced motion, and existing storage keys.
- Keep the rotation timer disabled when there is only one usable image and clean it up on unmount.

### Task 1: Add failing motivation rotation and NOVA boundary tests

**Files:**
- Modify `e2e/motivation-focus.spec.ts`
- Modify `e2e/branding.spec.ts`
- Modify `e2e/navigation.spec.ts`

- [ ] Step 1: Add a media response with two `imageOptions` and assert the first image is visible, the second becomes visible after the rotation interval, and the scene remains rendered when the second image fails.
- [ ] Step 2: Add mobile viewport assertions at 320px, 390px, and 430px for no horizontal overflow and full scene height.
- [ ] Step 3: Change tracker-facing brand assertions to `NOVA` and add a guard that no tracker shell text contains `NOVA//OS`.
- [ ] Step 4: Run the focused suites and confirm they fail because the new media contract, full-scene state, and brand copy are not implemented.

### Task 2: Extend the motivation media deck

**Files:**
- Modify `src/lib/motivation-media.ts`
- Modify `src/app/api/motivation-media/route.ts` only if response typing requires it

- [ ] Step 1: Add a typed `MotivationVisual` shape and optional `imageOptions` to `MotivationMedia`.
- [ ] Step 2: Add two or more approved realistic visuals for each broad category, preserving category-specific and explicit destination fallback selection.
- [ ] Step 3: Return the fallback deck with each resolved media response and prepend a fetched Wikimedia image when it is valid and distinct.
- [ ] Step 4: Run media-focused tests and confirm deck metadata remains attribution-safe.

### Task 3: Make FocusScene persistent and full viewport

**Files:**
- Modify `src/components/motivation/FocusScene.tsx`
- Modify `src/app/globals.css`

- [ ] Step 1: Render the previous usable image while a new active image is loading; crossfade only after `onLoad`, retain it on `onError`, and use the existing fallback when no usable image exists.
- [ ] Step 2: Make the media figure cover the full scene and place the objective panel over it with mobile-safe readable contrast.
- [ ] Step 3: Respect `prefers-reduced-motion` by disabling transition duration while keeping the same image retention behavior.
- [ ] Step 4: Run focused scene tests at all supported mobile widths.

### Task 4: Rotate the selected deck in MotivationPage

**Files:**
- Modify `src/app/motivation/page.tsx`
- Modify `e2e/motivation-focus.spec.ts`

- [ ] Step 1: Keep the resolved media as the deck source, select an active slide by index, and advance every 10 seconds only when multiple usable images exist.
- [ ] Step 2: Reset to the first slide on manual refresh and when goal/category personalization changes.
- [ ] Step 3: Keep the current media loading state and refresh button behavior compatible.
- [ ] Step 4: Run motivation suites and confirm rotation, refresh, attribution, relay, and fallback behavior.

### Task 5: Rename visible tracker branding to NOVA

**Files:**
- Modify `src/lib/brand.ts`
- Modify `src/components/brand/NovaMark.tsx`
- Modify tracker-facing copy in `src/components/`, `src/app/`, and `src/lib/motivation-media.ts`
- Modify `src/app/manifest.ts`
- Modify affected E2E assertions and README tracker copy

- [ ] Step 1: Set the visible tracker brand contract and wordmark to `NOVA`; preserve `short_name: "NOVA"`, internal compatibility keys, and Buildora portfolio identity.
- [ ] Step 2: Replace tracker-facing `NOVA//OS` copy in navbar, shell, onboarding, footer, settings, landing, focus, and manifest surfaces.
- [ ] Step 3: Run branding/navigation tests and confirm public Buildora does not gain Personal tracker content.

### Task 6: Release verification

- [ ] Step 1: Run `pnpm lint`.
- [ ] Step 2: Run `pnpm run pretest:e2e`.
- [ ] Step 3: Run `pnpm exec playwright test e2e/motivation-focus.spec.ts e2e/branding.spec.ts e2e/navigation.spec.ts --workers=1`.
- [ ] Step 4: Run the full Playwright suite and `git diff --check`.
- [ ] Step 5: Review `git diff main...HEAD --stat` and confirm no public-host implementation changes were introduced.
