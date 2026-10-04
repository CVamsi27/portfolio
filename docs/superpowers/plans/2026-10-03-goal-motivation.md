# Goal Motivation Simplification Plan

> **For agentic workers:** Execute inline with executing-plans and review checkpoints.

**Goal:** Make /motivation a calm, inspiring page devoted to the user's saved goal.

**Architecture:** Read existing preferences and milestones without changing them. A pure goal-motivation helper supplies original, category-specific encouragement; FocusScene renders one stable goal visual, reminder and next step. A compact personal-reminders dialog retains saved/custom affirmation access. Existing journal, visits and favorites remain stored; remove journaling, streaks and focus timing from this route.

**Tech Stack:** React, Next.js, TypeScript, existing Modal, synced storage, Playwright.

## Global constraints

Use the saved goal title/country; never assume Germany for other accounts. Goal-aware media on this route regardless of a legacy general-inspiration preference; do not rewrite preferences. Do not send custom goal text or name in media requests. No autoplay rotation, fullscreen takeover, quote-author misattribution, forced lockout, cloud data changes or record deletion.

## Task 1: Regression specification

Files: e2e/motivation-focus.spec.ts, e2e/motivation-settings.spec.ts and new e2e/goal-motivation.spec.ts.

- [x] Write new checks for exact custom goal, category/country-specific encouragement, milestone completion-derived progress, no journal/streak/deck stats/timer/general toggle, preserved storage, and meaningful plan destination.
- [x] Run new tests against old build and confirm removed-section assertions fail.

## Task 2: Simplify rendering and state

Files: src/app/motivation/page.tsx, src/components/motivation/FocusScene.tsx, new src/lib/goal-motivation.ts, src/app/globals.css, src/app/ui-system.css.

- [x] Export `goalEncouragement(category: GoalCategory, country?: string): { why: string; reminders: string[] }` with original text for each supported category, interpolating destination only for relocation.
- [x] Replace the page with one hero and one compact personal-reminders launcher. Hero consumes displayGoalTitle, goalEncouragement, unfinished milestone and completed/total milestone count. Primary native link opens /roadmap for career/learning/relocation, otherwise /goal; milestone link opens /goal. Completed milestones show a completion message and /log action rather than an unfinished task.
- [x] Preserve saved favorites/custom quotes in their existing keys, with safe updater writes. Present saved/custom entries only on request; create labeled custom-reminder input and an explicit empty state. Copy gives success only after clipboard resolves and reports failure.
- [x] Fetch/cache one goal-aware visual using category/country only; retain fallback on failure and matching attribution. Remove interval rotation and fullscreen code. Image never carries the text; failed images leave text/actions readable.
- [x] Remove obsolete focus-scene CSS and replace with compact responsive hero styles. No 100vh floor, edge-to-edge negative margins or controls over images. Respect reduced motion and 44px targets.

## Task 3: Update behavior tests and verify

Files: related motivation, modal, tracker-actions, general-goals and reduced-motion browser tests; docs/ui-ux-review.md.

- [x] Replace tests for deliberately removed sections with storage-preservation, goal-personalization, reminder CRUD, stable imagery and action-navigation tests. Keep modal keyboard/backdrop recovery coverage using the new reminder dialog.
- [x] Run lint, typecheck and build; restart local production server and run targeted tests, then full browser suite.
- [x] Capture/review 320px light and 1440px dark screenshots, including long goal title, missing image and completed-goal state. Record evidence and any production verification limitation.

Result: 190 browser checks passed; build, lint, typecheck and diff whitespace checks passed. Local changes remain uncommitted and are not deployed.


Consolidated scope: [NOVA change sheet](../../NOVA_CHANGE_SHEET.md). The sheet resolves navigation/scope differences and adds the requested food tracker; this document remains the historical design or delivered phase record.
