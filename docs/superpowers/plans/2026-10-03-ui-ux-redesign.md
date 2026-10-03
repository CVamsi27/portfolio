# UI and UX Redesign Implementation Plan

**Goal:** Execute the approved redesign of the public portfolio and personal workspace.

**Architecture:** Preserve stores, route contracts, auth, and protection semantics. Consolidate surface styling in a scoped stylesheet; improve shared primitives before individual pages.

**Tech stack:** Next.js 16, React 19, Tailwind 4, TypeScript, Playwright.

## Constraints

Do not change saved-data shapes, share access defaults, or evidence-gated completion. Work inline on `fix/ui-ux-redesign`; no publishing or commits requested. Use the approved spec as the acceptance contract.

## Tasks

- [x] Baseline: build local-mode app, start server, capture representative desktop/mobile pages and inspect route errors.
- [x] Regression coverage in `e2e/ui-ux-redesign.spec.ts`: active More on Tasks, Tasks directory link, one main landmark, modal opener restoration, readable dock, truthfully labeled form navigation, responsive route matrix. Run against baseline to establish failures.
- [x] Shared navigation: modify `personal-nav.ts`, `Navbar.tsx`, `TrackerNavDock.tsx`, `PersonalShell.tsx`, `More/page.tsx`; align labels, active states, landmarks, and breakpoint behavior.
- [x] Shared controls: modify Button, Input, Textarea, Segmented, Modal; establish solid semantic actions, touch sizes, full labels, stable focus and scroll ownership. Guard global shortcuts when a dialog is open or modifiers are used.
- [x] Design foundation: create `src/app/ui-system.css`, imported after globals; define theme palettes, restrained typography, panels, focus styles, dock clearance, responsive density, and reduced motion. Remove contradictory surface token definitions in globals where practical.
- [x] Daily flows: update TodayHeader, TrackerActionBar, TodayDetails and Today page; make quick capture visible and labeled, reduce decorative status clutter, align Focus and Tasks titles, and correct anchor labels on tracker forms.
- [x] Supporting flows: inspect roadmap sections, sharing composer, health, fasting, workouts, goals, archive, login/onboarding and settings. Improve descriptive labels, selected states, responsive controls and save feedback where required. Preserve domain rules.
- [x] Public portfolio: simplify desktop header, strengthen role/name hierarchy and contact CTA, standardize project/section treatment, improve contact submission feedback and form labels.
- [x] Validation: run lint and typecheck; rebuild; run new regression suite and existing E2E coverage; inspect fresh screenshots at mobile/tablet/desktop in both themes. Fix regressions and record actual results and outstanding limits in `docs/ui-ux-review.md`.

## Concrete regression examples

```ts
await page.goto('/todo');
await expect(page.getByTestId('tracker-primary-nav').getByRole('link', { name: 'More' })).toHaveAttribute('aria-current', 'page');
await expect(page.getByRole('main')).toHaveCount(1);
await page.goto('/more');
await expect(page.getByTestId('more-links').getByRole('link', { name: /Tasks/ })).toHaveAttribute('href', '/todo');
```

Dialog test: focus and click New affirmation, type a quote, Escape, assert opener is focused; reopen, Tab into the dialog, assert focus remains within it. Responsive review compares document scroll width with viewport width and verifies primary actions remain visible and reachable.

## Commands

`NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= pnpm build`

`pnpm exec playwright test e2e/ui-ux-redesign.spec.ts --workers=2`

`pnpm lint` and `pnpm exec tsc --noEmit`

`pnpm exec playwright test --workers=4`
