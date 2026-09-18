# Buildora Public Entry, Generic Goals, and Copy System Design

**Date:** 2026-09-18  
**Status:** Draft for review  
**Extends:** `2026-09-18-meal-window-motivation-media-design.md`  
**Scope:** public host routing, Buildora identity, tracker onboarding, goal taxonomy, motivation preference, emoji-free copy, and final tracker UI polish

## Problem

The repository has two different product surfaces sharing one Next.js app, but the public entry behavior and copy do not consistently communicate that boundary.

1. `personal.buildora.work/` is rewritten directly to `/trackers`. The tracker hub can render `RequireAuth`, which sends an anonymous visitor to `/login`. The visitor therefore sees a legacy gate before seeing the newer login page instead of learning what the product does.
2. The portfolio host is technically branded around Vamsi Krishna, but Buildora is not given enough visual or metadata emphasis at `buildora.work`.
3. Relocation onboarding contains a Berlin-specific placeholder and a Berlin-specific hub option. The model needs to be destination-neutral, with country selection only when the user chooses relocation.
4. Goal cards use emoji characters as icons, and at least one tracker surface still uses an emoji in visible copy. The product should use the existing icon system and typography instead.
5. Motivation is currently tied to a motivation style, but users cannot clearly choose between goal-aware inspiration and general inspiration.
6. The tracker suite still contains a few old card, wording, and entry-state patterns even after the editorial foundation pass.
7. Intermittent fasting remains timer-first in parts of the experience. The approved meal-window design needs to land as part of this same coherent pass.

## Goals

- Make the public portfolio and tracker entry points immediately understandable without requiring authentication.
- Make “Buildora” visually prominent on the public host while retaining Vamsi Krishna as the person and portfolio identity.
- Preserve NOVA//OS as the tracker product identity, with a clear Buildora relationship rather than a competing brand.
- Replace country-specific relocation assumptions with a generic country-aware goal flow.
- Let people choose whether motivation is based on their goal or intentionally general.
- Remove emoji characters from user-facing product copy, icons, metadata, changelog headings, and active examples.
- Carry through the approved meal-window fasting interaction, public motivational media, and tracker UI polish from the predecessor spec.
- Preserve anonymous local use, optional Supabase sync, existing local-storage keys, exports, sharing, and route compatibility.

## Non-goals

- No change to the portfolio owner or resume content: Vamsi Krishna remains the person presented by the portfolio.
- No removal or renaming of NOVA//OS tracker data keys, backup discriminators, or existing shared-drop URLs.
- No requirement for sign-in to view the personal-host landing page or to use local tracker mode.
- No external image hosting account, paid media provider, or raw goal-title transmission to a third-party API.
- No rewriting of git history or archival design documents solely to change historical wording.

## Product model

### Host and entry contract

The app has three intentional states:

| Host or path | Surface | Anonymous behavior |
| --- | --- | --- |
| `buildora.work/` | Buildora public portfolio | Show the public portfolio and Buildora identity |
| `personal.buildora.work/` | NOVA//OS public product entry | Show the feature landing page; never redirect to login |
| `personal.buildora.work/trackers` and feature routes | NOVA//OS personal workspace | Show local-first app or an auth prompt only when cloud sync requires it |

Change the personal-host root rewrite from `/trackers` to a dedicated public route such as `/trackers/landing`. Keep the existing tracker surface header so host-aware metadata and shell styles remain correct. The landing route must not render `RequireAuth`.

The landing page should include:

- a visible NOVA//OS wordmark with a small “from Buildora” relationship label;
- a concise promise around goals, routines, focus, workouts, meal windows, tasks, motivation, and private sharing;
- a feature rail or chapter grid showing the real app capabilities;
- a clear “Enter NOVA//OS” action to `/trackers`;
- a secondary “Explore motivation” action to `/motivation`;
- a local-first/no-sign-in note that does not imply cloud sync is anonymous;
- an optional signed-in “Resume command center” state if client auth is already available, without changing the public route or hiding the feature explanation.

The landing page should be statically understandable at a narrow viewport, keyboard navigable, and free from auth-only controls. `/trackers` remains the workspace route and may continue to open onboarding when preferences are not configured.

### Brand hierarchy

Use one source of truth in `src/lib/brand.ts` with explicit fields rather than scattering names through components:

- `PORTFOLIO_BRAND.siteName`: `Buildora`;
- `PORTFOLIO_BRAND.personName`: `Vamsi Krishna`;
- `PORTFOLIO_BRAND.title`: `Buildora — Vamsi Krishna | Full Stack Engineer`;
- `TRACKER_BRAND.name`: `NOVA//OS`;
- `TRACKER_BRAND.parentBrand`: `Buildora`.

On the public portfolio host:

- the navbar and footer lead with Buildora;
- the hero makes `Vamsi Krishna` the dominant personal name, with Buildora as the masthead/edition label;
- the metadata title and description mention Buildora and Vamsi Krishna in that order;
- the NOVA//OS portal remains discoverable as a product link.

On the personal host:

- NOVA//OS remains the dominant product wordmark;
- Buildora appears as a quiet parent-brand relationship in the landing, footer, and metadata;
- the tracker routes never fall back to “Personal Suite”, “VK”, or portfolio-only labels.

The favicon and manifest must use the surface-aware product identity already established by the branding pass. Do not introduce a second logo system; extend `NovaMark` and the existing Buildora/portfolio mark treatment.

### Generic goals and country selection

Keep the existing six goal categories, but replace emoji fields with a stable icon name consumed by `TrackerIcon` or Lucide. Icon rendering must remain decorative when the adjacent label is present.

Extend preferences additively:

```ts
type MotivationPersonalization = "goal" | "general";

type UserPrefs = {
  // existing fields...
  goalCountry?: string;
  motivationPersonalization: MotivationPersonalization;
};
```

For relocation:

- label the category as “Relocation” with neutral copy such as “Plan a move to a destination that matters to you”;
- show a searchable/selectable country field only for the relocation category;
- do not preselect a country;
- offer at least United States, United Kingdom, Canada, United Arab Emirates, Australia, Japan, Germany, Netherlands, Ireland, Singapore, and Other;
- store the selected country separately from the free-form goal title;
- compose a display title such as `Relocate to {country}` only after a country is selected;
- use generic placeholders such as “Name the outcome you want” and “Choose a destination”;
- remove Berlin/Germany-specific defaults, placeholders, fixture assertions, and visible examples from active app code and tests.

For non-relocation categories, hide the country field and preserve the current category-specific metric defaults. If a legacy preference contains a Berlin-specific title, preserve the user’s data but offer a one-time neutralization affordance rather than silently overwriting it.

### Motivation choice

Add a first-class choice in onboarding and the Motivation settings surface:

- `Goal-aware`: imagery and quotes are selected from the user’s goal category and motivation style;
- `General inspiration`: imagery and quotes use broad human-performance themes and never include the goal title.

Default new users to `goal` to preserve the current intent, but make the choice explicit and reversible. The motivation page should show the active source as a small control near the focus scene, not as a separate settings maze.

Motivation inputs must be privacy-safe:

- use only an allowlisted category keyword map such as `relocation -> journey, horizon, city`; never send the raw goal title, person name, country, or journal content to an external provider;
- use general keywords such as `focus, resilience, progress` when the user selects general inspiration;
- cache the resolved image and quote locally by category/source with a bounded TTL;
- show deterministic local fallback content when the network is unavailable, a provider fails, or the returned media is unusable.

The public API implementation from the predecessor spec remains the target: Art Institute of Chicago for category-safe artwork media and Zen Quotes for quote text, with resilient fallback and no hard dependency on either provider. The public-apis catalog is reference material, not a runtime dependency.

### Meal-window fasting

Carry forward the predecessor spec without a timer-first regression:

- replace start/stop as the primary interaction with first-meal and last-meal time inputs;
- calculate the fasting duration across midnight;
- if no log exists, ask for the user’s daily routine first and prefill today’s form from it;
- allow today’s actual window to differ from the routine;
- retain legacy timer records through a migration adapter and keep historical charts meaningful;
- show 24-hour, 7-day, and 30-day auto-clear choices with an explanatory helper line;
- remove emoji icons from the fasting surface.

The primary action should read as a concrete save action, not a timer command. Validation must handle missing times, equal times, invalid ranges, and an overnight window without making medical claims.

## UI and copy system

This pass is a repo-wide consistency sweep over user-facing routes:

- portfolio home and shared navigation/footer;
- tracker landing, onboarding, hub, goals, workouts, meal windows, todos, motivation, share, shared-with-me, login, and settings;
- PWA metadata, install prompt, empty states, error states, and local-mode notices.

Use the existing editorial primitives and visual language: oversized chapter titles, indexed labels, asymmetric signal panels, restrained borders, strong typographic hierarchy, and responsive spacing. Replace any remaining default `Card`-first composition where it reads like a generic dashboard, but do not rewrite stable data or auth logic just for appearance.

Copy rules:

- no emoji characters in app UI, aria labels, metadata, changelog headings, or active test fixtures;
- use NovaMark, Lucide, CSS marks, and text labels for visual signals;
- never describe the app as Germany-specific, relocation-specific, or auth-only;
- state “works locally without sign-in” only where the surrounding feature actually supports it;
- distinguish local storage, optional sync, and private sharing in plain language;
- use sentence case for explanatory copy and compact uppercase only for indexed editorial labels;
- preserve a visible focus ring, readable contrast, reduced-motion behavior, and touch targets of at least 44px.

Update CHANGELOG headings to plain text. Keep historical design docs as historical records unless they are active implementation instructions; update active plans, fixtures, and tests so they no longer teach the old Berlin or emoji behavior.

## Technical changes

### Routing and public entry

- Add a public tracker landing route and page component.
- Update `src/proxy.ts` so the personal host root rewrites to that route, not `/trackers`.
- Add route tests proving anonymous personal-root requests render the landing page and do not redirect to `/login`.
- Keep `/trackers` behind its existing workspace behavior and preserve local development routing.

### Brand and shared shell

- Extend `src/lib/brand.ts` with Buildora parent-brand fields and explicit portfolio/person names.
- Update `src/app/layout.tsx`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`, `src/components/pages/About.tsx`, `src/app/manifest.ts`, and favicon metadata.
- Add tests for Buildora-first portfolio metadata, Vamsi-first hero identity, and NOVA//OS tracker metadata.

### Preferences and onboarding

- Add `goalCountry` and `motivationPersonalization` to the preference model and safe defaults.
- Replace `GOAL_CATEGORIES.icon` emoji strings with icon names.
- Add country options and relocation-only country UI in `Questionnaire` and the goal settings surface.
- Normalize only known legacy placeholder/demo values in tests and seed fixtures; do not delete user-entered goal data.
- Add schema-safe fallback behavior for old preference objects.

### Motivation media and quote resolver

- Implement the category-safe resolver and local cache from the predecessor spec.
- Add source controls to onboarding and Motivation.
- Keep `FocusScene` full-screen, readable over media, and useful with local fallback content.
- Add provider timeout, response-shape validation, TTL, and deterministic fallback tests.

### Meal-window tracker

- Add first/last meal fields and daily routine fields to the fasting store in an additive shape.
- Keep existing history records readable and migrate timer records into the nearest supported meal-window representation where possible.
- Update hub summaries, charts, and empty states to use calculated windows.

### Repo-wide cleanup

- Replace visible emoji characters in source and active docs with existing icon components or plain copy.
- Audit old login/landing wording, “Personal Suite” references, Berlin/Germany examples, and generic placeholder text.
- Use `rg` checks over `src`, `public`, active tests, `README.md`, and `CHANGELOG.md` for forbidden strings and emoji code points.

## Verification

Run the existing project gates plus focused checks:

1. `pnpm lint`
2. `pnpm build`
3. `pnpm exec playwright test`
4. `git diff --check`
5. `rg` audit for `Berlin`, `Relocate to Berlin`, `Personal Suite`, the old auth redirect wording, and emoji code points in user-facing source/docs.
6. Browser QA at desktop and 390px widths for:
   - `buildora.work/` portfolio hero, navbar, footer, favicon title, and NOVA//OS portal;
   - `personal.buildora.work/` public landing while signed out;
   - `/trackers` onboarding and workspace;
   - relocation with each major country option and no default country;
   - motivation in goal-aware and general modes, online and offline;
   - first fasting visit, routine prefill, overnight calculation, and 24-hour/7-day/30-day auto-clear;
   - share/login/settings surfaces with no emoji or stale identity copy.

Automated assertions should cover:

- personal-root never renders the auth gate for anonymous visitors;
- public landing feature copy is present without a session;
- Buildora is present in portfolio metadata and public shell;
- NOVA//OS is present in tracker metadata and shell;
- relocation has no preselected country and composes the title only after selection;
- general motivation never calls the goal-specific provider query;
- external requests contain category keywords only;
- no emoji characters remain in the audited user-facing strings;
- old preference objects still load and existing exports/imports remain compatible.

## Acceptance criteria

- An anonymous visitor opening `personal.buildora.work/` sees a polished NOVA//OS feature landing page, not `/login`.
- The visitor can understand the app’s core features and enter the workspace without sign-in in local mode.
- `buildora.work/` makes Buildora prominent while clearly presenting Vamsi Krishna as the portfolio owner.
- Relocation is neutral and destination-aware: no Berlin default, no Germany-only copy, and at least the requested major countries are available.
- Motivation has a visible goal-aware/general choice and both modes work with provider failures.
- Fasting is meal-window-first, asks for a daily routine when needed, and calculates overnight windows correctly.
- User-facing UI and active docs contain no emoji characters.
- All existing data, sharing, export, offline, auth, and host-boundary behavior remains compatible.
- Lint, build, end-to-end tests, diff checks, and the string audit pass.

## Open review question

Please review this revised scope before implementation begins. The only product choice still called out for confirmation is the brand hierarchy: Buildora will lead the public portfolio, Vamsi Krishna will remain the dominant personal hero name, and NOVA//OS will remain the tracker product name under Buildora.
