# Personal Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Rework the public `buildora.work` portfolio into a professional, editorial personal site that emphasizes selected work and experience while preserving the private NOVA tracker surface.

**Architecture:** Keep the existing Next.js single-page portfolio and host-aware shell. Add a dedicated portfolio brand contract, personal mark, and host-aware metadata/manifest values; replace only the public page composition, public navigation/footer, and portfolio-specific CSS. Keep tracker components, tracker data, storage keys, routes, and NOVA assets unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `next-themes`, Lucide, Font Awesome, Playwright, pnpm.

## Global Constraints

- Scope is the public portfolio surface on `buildora.work` only.
- The private NOVA//OS tracker surface and its host-specific behavior remain unchanged.
- The work is the dominant visual subject; the person's name is a compact signature rather than a hero headline.
- Use the approved palette: `#f4f1ea`, `#17191c`, `#6f7478`, `#315cff`, `#dce5ff`, `#c97755`.
- Use Space Grotesk for display, Inter for body, and IBM Plex Mono for utility labels.
- Preserve `/portfolio`, the public resume asset, existing external project URLs, external-link safety attributes, keyboard focus, responsive behavior, and reduced-motion support.
- Do not modify tracker storage schemas, authentication, shared-drop behavior, tracker copy, tracker routes, or NOVA assets.

---

## File map

### Create

- `src/components/brand/VamsiMark.tsx` — compact `VK` personal mark with `mark` and `wordmark` variants.
- `public/icons/vk.svg` — square personal favicon/apple icon asset readable at 16px.
- `public/portfolio-og.svg` — 1200×630 social preview artwork using the approved portfolio palette.
- `public/portfolio-og.png` — raster social preview generated from the SVG with the existing `sharp` dependency.
- `e2e/public-portfolio.spec.ts` — public-only content, metadata, responsive, and tracker-boundary coverage.

### Modify

- `src/lib/brand.ts` — replace public Buildora-facing values with personal portfolio values; keep `TRACKER_BRAND` unchanged.
- `src/app/layout.tsx` — choose light portfolio/dark tracker defaults and expose host-aware Open Graph, Twitter, favicon, and apple metadata.
- `src/app/manifest.ts` — return the portfolio manifest on public host and the current NOVA manifest on tracker host.
- `src/components/Navbar.tsx` — use `VamsiMark`, personal labels, work-first navigation, and no public NOVA portal link.
- `src/components/Footer.tsx` — use the personal signature, current year, and compact social/contact closing.
- `src/app/page.tsx` — compose the redesigned public sections and keep the public `data-public-dossier` boundary.
- `src/components/pages/About.tsx` — replace the terminal hero with the compact personal introduction and work thesis.
- `src/components/pages/Experience.tsx` — render the existing experience data as an editorial evidence timeline.
- `src/components/pages/Projects.tsx` — render the existing project data as a numbered selected-work index.
- `src/components/pages/Skills.tsx` — replace the autoplay icon carousel with grouped capabilities and a compact technology list.
- `src/components/pages/Contact.tsx` — replace the card-heavy closing with a simple contact invitation while preserving the form behavior.
- `src/lib/const.ts` — rename public section labels and correct public neutral copy without changing tracker data.
- `src/app/globals.css` — add portfolio-scoped palette, layout, index, link, and responsive rules; do not change tracker selectors.
- `src/app/icon.svg` — point the Next app icon route at the same personal `VK` geometry used by the public favicon while keeping tracker host metadata pointing at `nova.svg`.
- `README.md` — describe the public surface as a personal portfolio and the personal host as the NOVA tracker suite.
- `e2e/branding.spec.ts` — update public identity/icon assertions and add host-aware manifest assertions.
- `e2e/navigation.spec.ts` — update the public PWA asset assertion and remove the public NOVA portal expectation.
- `e2e/editorial-foundation.spec.ts` — assert the new public work-first hierarchy while preserving tracker editorial assertions.

## Implementation tasks

### Task 1: Lock the public/tracker boundary with failing tests

**Files:**
- Create: `e2e/public-portfolio.spec.ts`
- Modify: `e2e/branding.spec.ts`
- Modify: `e2e/navigation.spec.ts`
- Modify: `e2e/editorial-foundation.spec.ts`

**Interfaces:**
- Consumes the existing public route `/`, the `/portfolio` alias, and host-aware request headers.
- Produces executable acceptance criteria for `VamsiMark`, public metadata, selected-work indexing, and tracker isolation.

- [ ] **Step 1: Add failing public identity and hierarchy assertions.**

```ts
test("public portfolio is personal and work-first", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Vamsi Krishna.*Portfolio/i);
  await expect(page.getByRole("link", { name: /Vamsi Krishna portfolio/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Selected work/i })).toBeVisible();
  await expect(page.locator("[data-project-index]")).toHaveCount(6);
  await expect(page.locator("body")).not.toContainText("Buildora");
  await expect(page.locator("body")).not.toContainText("NOVA//OS");
});

test("public metadata uses the personal thumbnail and icon", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute("href", "/icons/vk.svg");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /portfolio-og\.png$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});
```

- [ ] **Step 2: Add host-aware manifest assertions.**

```ts
const publicManifest = await page.request.get("http://127.0.0.1:4111/manifest.webmanifest", {
  headers: { Host: "buildora.work" },
});
expect((await publicManifest.json()).name).toBe("Vamsi Krishna — Portfolio");

const trackerManifest = await page.request.get("http://127.0.0.1:4111/manifest.webmanifest", {
  headers: { Host: "personal.buildora.work" },
});
expect((await trackerManifest.json()).name).toBe("NOVA");
```

- [ ] **Step 3: Run the focused tests and verify they fail for the old Buildora surface.**

Run: `pnpm exec playwright test e2e/public-portfolio.spec.ts e2e/branding.spec.ts e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts`

Expected: FAIL on old Buildora/NOVA public identity, missing personal metadata, or missing work-index markers; existing tracker assertions should remain green.

- [ ] **Step 4: Commit the test contract.**

```bash
git add e2e/public-portfolio.spec.ts e2e/branding.spec.ts e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts
git commit -m "test(portfolio): define personal public identity"
```

### Task 2: Implement the personal brand, icons, thumbnail, and metadata

**Files:**
- Create: `src/components/brand/VamsiMark.tsx`
- Create: `public/icons/vk.svg`
- Create: `public/portfolio-og.svg`
- Create: `public/portfolio-og.png`
- Modify: `src/lib/brand.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts`
- Modify: `src/app/icon.svg`

**Interfaces:**
- `VamsiMark` accepts `{ variant: "mark" | "wordmark"; label?: string; className?: string }` and renders an accessible `VK` mark/wordmark.
- `PORTFOLIO_BRAND` exposes `siteName: "Vamsi Krishna"`, a personal title, personal description, `iconPath: "/icons/vk.svg"`, and `ogImagePath: "/portfolio-og.png"`.
- `TRACKER_BRAND` remains byte-for-byte behaviorally equivalent for name, description, theme color, and icon path.

- [ ] **Step 1: Define the personal brand contract.**

Set the public values to:

```ts
siteName: "Vamsi Krishna",
personName: "Vamsi Krishna Chandaluri",
name: "Vamsi Krishna",
title: "Vamsi Krishna — Full Stack Engineer & Product Builder",
iconPath: "/icons/vk.svg",
ogImagePath: "/portfolio-og.png",
description: "Full Stack Engineer building reliable, thoughtful software with TypeScript, React, Node.js, NestJS, and PostgreSQL.",
```

Keep `getBrandForHost` and `isTrackerHost` signatures unchanged.

- [ ] **Step 2: Create the square `VK` SVG asset and inline mark.**

Use deep charcoal ink, warm paper, electric blue, and no Buildora/NOVA geometry. Ensure the SVG has a `viewBox`, no external references, and a readable silhouette at 16px. Give logo-only output an accessible label from the `label` prop.

- [ ] **Step 3: Create and rasterize the social thumbnail.**

Create a 1200×630 SVG with a warm paper field, small `VK` signature, the text `Selected work / Full Stack Engineer`, and a single blue rule. Generate the PNG from that SVG with a one-shot Node script using the already-installed `sharp` package; do not add a dependency.

- [ ] **Step 4: Make layout metadata host-aware.**

Use `metadataBase: new URL("https://buildora.work")` for the public brand and emit:

```ts
openGraph: {
  type: "website",
  url: "https://buildora.work",
  title: PORTFOLIO_BRAND.title,
  description: PORTFOLIO_BRAND.description,
  images: [{ url: PORTFOLIO_BRAND.ogImagePath, width: 1200, height: 630, alt: "Vamsi Krishna portfolio" }],
},
twitter: {
  card: "summary_large_image",
  title: PORTFOLIO_BRAND.title,
  description: PORTFOLIO_BRAND.description,
  images: [PORTFOLIO_BRAND.ogImagePath],
},
```

Keep tracker metadata title, description, theme color, and `nova.svg` icon unchanged when `x-product-surface=tracker` or the host starts with `personal.`.

- [ ] **Step 5: Make the manifest host-aware without changing NOVA values.**

Read `headers()` in `src/app/manifest.ts`, detect the same tracker condition as layout, return the current NOVA manifest for tracker requests, and return a public manifest with `name: "Vamsi Krishna — Portfolio"`, `short_name: "Vamsi"`, `start_url: "/"`, `display: "standalone"`, paper background, and `/icons/vk.svg` for public requests.

- [ ] **Step 6: Run metadata tests and commit the brand slice.**

Run: `pnpm exec playwright test e2e/public-portfolio.spec.ts e2e/branding.spec.ts`

Expected: public favicon, metadata, thumbnail, and manifest assertions pass; tracker identity assertions remain green.

```bash
git add src/components/brand/VamsiMark.tsx public/icons/vk.svg public/portfolio-og.svg public/portfolio-og.png src/lib/brand.ts src/app/layout.tsx src/app/manifest.ts src/app/icon.svg e2e/public-portfolio.spec.ts e2e/branding.spec.ts
git commit -m "feat(portfolio): add personal brand metadata"
```

### Task 3: Replace the public shell and navigation language

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/lib/const.ts`

**Interfaces:**
- Public navbar renders `VamsiMark variant="wordmark" label="Vamsi Krishna portfolio"` and links to `#Work`, `#Experience`, `#Capabilities`, and `#Contact`.
- Tracker navbar continues to render `NovaMark`, tracker primary navigation, account controls, and tracker hrefs exactly as before.
- `MENU_LIST` becomes the public anchor list; tracker `PERSONAL_PRIMARY_NAV` stays unchanged.

- [ ] **Step 1: Update public section identifiers and labels.**

Change only the public menu constants to `Work`, `Experience`, `Capabilities`, and `Contact`. Keep existing project, work experience, personal details, and tracker constants intact.

- [ ] **Step 2: Remove the public NOVA portal and Buildora wordmark.**

In the non-tracker branch of `Navbar`, render the personal wordmark and only the public work/experience/capabilities/contact links. Keep the mode toggle and mobile menu. Do not change the tracker branch.

- [ ] **Step 3: Make theme defaults surface-aware.**

Pass `defaultTheme={trackerSurface ? "dark" : "light"}` to `ThemeProvider` so the public portfolio opens on the approved warm-paper theme while tracker routes keep the existing dark default. Preserve user-selected theme behavior and the existing mode toggle.

- [ ] **Step 4: Update the public footer.**

Use `© {year} Vamsi Krishna Chandaluri`, a compact `Full Stack Engineer · TypeScript · React · PostgreSQL` descriptor, and a `Top` link to `#Top`. Keep the tracker footer branch unchanged.

- [ ] **Step 5: Run shell tests and commit.**

Run: `pnpm exec playwright test e2e/branding.spec.ts e2e/navigation.spec.ts`

Expected: public shell exposes personal identity and no public NOVA portal; personal host still exposes NOVA and no Study/public portfolio links.

```bash
git add src/components/Navbar.tsx src/components/Footer.tsx src/app/layout.tsx src/lib/const.ts e2e/branding.spec.ts e2e/navigation.spec.ts
git commit -m "feat(portfolio): simplify personal public shell"
```

### Task 4: Rebuild the public content as a work-first portfolio index

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/pages/About.tsx`
- Modify: `src/components/pages/Experience.tsx`
- Modify: `src/components/pages/Projects.tsx`
- Modify: `src/components/pages/Skills.tsx`
- Modify: `src/components/pages/Contact.tsx`

**Interfaces:**
- `About` renders `id="Top"` and a compact hero with no terminal widget and no Buildora label.
- `Projects` renders `id="Work"` and one `[data-project-index]` marker per existing project.
- `Skills` renders `id="Capabilities"` with grouped text capabilities and no autoplay carousel.
- `Experience` renders `id="Experience"` from `WORK_EXPERIENCE` without changing its data shape.
- `Contact` renders `id="Contact"`, preserves the existing `/api/contact` form schema and submit behavior, and exposes email/resume/social links.

- [ ] **Step 1: Replace the hero with a compact personal thesis.**

Render:

```tsx
<p>Available for thoughtful product engineering work</p>
<h1>I build software that earns its place.</h1>
<p>Full Stack Engineer working across product interfaces, dependable APIs, and the systems that carry them into production.</p>
```

Keep the resume download and social links, but make the name a small `Vamsi Krishna Chandaluri` signature near the supporting metadata rather than the dominant heading.

- [ ] **Step 2: Convert projects into the selected-work index.**

For each `PROJECTS` row, render the project number, title, description, tech labels, source link when present, and live link. The first project may span the full width or receive a stronger accent rule; all rows must remain keyboard-accessible and preserve `target="_blank" rel="noopener noreferrer"` for external URLs.

- [ ] **Step 3: Turn experience into evidence.**

Keep the existing three work entries and details, but use a two-column desktop layout: date/company metadata on the left and role/details/technologies on the right. On mobile, stack metadata above the role. Remove dossier dots and chapter-number decoration from the public surface.

- [ ] **Step 4: Replace the skill carousel with capabilities.**

Use four groups with explicit headings and plain-language content:

```ts
const CAPABILITIES = [
  { title: "Product engineering", items: ["React interfaces", "Accessible flows", "Design systems", "TypeScript delivery"] },
  { title: "Backend systems", items: ["NestJS and Node.js", "PostgreSQL data models", "APIs and integrations", "Queues and webhooks"] },
  { title: "Quality and delivery", items: ["Jest and Vitest", "Playwright", "GitHub Actions", "Docker"] },
  { title: "Working style", items: ["End-to-end ownership", "Clear boundaries", "Mentoring", "Measured iteration"] },
];
```

Keep a small technology strip using existing `SKILLS` only if it supports scanning; remove the autoplay behavior and icon-card carousel.

- [ ] **Step 5: Simplify the contact section.**

Keep the existing form validation, toast behavior, and `/api/contact` endpoint. Recompose the visible layout around one invitation, an email-first link, the resume link, social connections, and a secondary form panel. Ensure labels and error messages remain associated with fields.

- [ ] **Step 6: Run public content tests and commit.**

Run: `pnpm exec playwright test e2e/public-portfolio.spec.ts e2e/editorial-foundation.spec.ts`

Expected: the public page exposes hero/work/experience/capabilities/contact markers, all project links remain present, and tracker editorial tests remain green.

```bash
git add src/app/page.tsx src/components/pages/About.tsx src/components/pages/Experience.tsx src/components/pages/Projects.tsx src/components/pages/Skills.tsx src/components/pages/Contact.tsx e2e/public-portfolio.spec.ts e2e/editorial-foundation.spec.ts
git commit -m "feat(portfolio): make selected work the homepage focus"
```

### Task 5: Add the portfolio-specific visual system and responsive behavior

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/common/SectionHeading.tsx`
- Modify: `src/components/common/Reveal.tsx` only if the public reveal needs a semantic marker; preserve tracker behavior.

**Interfaces:**
- Portfolio CSS is scoped under `.portfolio-surface` or `[data-public-dossier]` so tracker selectors keep their current values.
- Public sections use stable classes for hero, work index, experience evidence, capability groups, and contact closing.

- [ ] **Step 1: Add portfolio tokens and base surface rules.**

Scope the approved palette under `body.portfolio-surface`, set the paper background, remove the public dotted/dark dossier atmosphere, and use a subtle blue selection/focus treatment. Leave `body.tracker-surface`, `.tracker-surface`, and tracker archive colors unchanged.

- [ ] **Step 2: Style the navigation and work index.**

Use thin rules, compact IBM Plex Mono metadata, blue hover states, and large but controlled Space Grotesk project titles. Make the work index rows readable as a list on mobile and a two-column editorial grid on wider screens. Use one signature accent rule instead of repeated gradients or shadow-heavy cards.

- [ ] **Step 3: Style experience, capabilities, and contact.**

Give each section clear hierarchy through spacing and rules, not oversized chapter numbers. Keep body copy at readable line length, ensure links have visible hover/focus states, and make the form panel visually secondary to the email/contact invitation.

- [ ] **Step 4: Add responsive and reduced-motion rules.**

At widths below 768px, stack metadata and content columns, keep the menu usable, prevent horizontal overflow, and preserve the work index tap targets. Under `prefers-reduced-motion: reduce`, disable public reveal transforms and hover lifts while keeping content visible.

- [ ] **Step 5: Run lint and focused responsive checks.**

Run: `pnpm lint`

Run: `pnpm exec playwright test e2e/public-portfolio.spec.ts --project=chromium`

Expected: lint passes; public content is visible at default and mobile viewport, no horizontal overflow is reported, and reduced-motion assertions pass if present.

```bash
git add src/app/globals.css src/components/common/SectionHeading.tsx src/components/common/Reveal.tsx
git commit -m "style(portfolio): add editorial personal visual system"
```

### Task 6: Update project-facing documentation and run full release gates

**Files:**
- Modify: `README.md`
- Verify: all files changed by Tasks 1–5

**Interfaces:**
- README describes `buildora.work` as Vamsi Krishna's public personal portfolio and `personal.buildora.work` as the NOVA tracker suite.
- No tracker-facing documentation loses the stable internal `vk:` compatibility notes.

- [ ] **Step 1: Update the README host table and visual description.**

Replace public Buildora product language with personal portfolio language while retaining the actual domain, current route boundaries, and NOVA tracker details. Do not rewrite unrelated tracker documentation.

- [ ] **Step 2: Run the complete lint and production build gates.**

Run: `pnpm lint`

Run: `pnpm build`

Expected: both commands exit 0. If a failure is unrelated to the portfolio changes, record the exact command and failing gate before continuing.

- [ ] **Step 3: Run the full E2E suite.**

Run: `pnpm test:e2e`

Expected: public branding, metadata, navigation, and tracker tests pass. If Supabase or external credentials make a test unavailable, record it as credential-blocked rather than treating it as a pass.

- [ ] **Step 4: Inspect the rendered public page.**

Run the production server with `pnpm start`, inspect `/` at desktop and mobile widths, then verify:

```text
public root → warm paper, small VK/name signature, work-first hero
selected work → dominant numbered index with live/source links
experience → readable timeline/evidence list
contact → email/resume/social actions and working form
public metadata → VK favicon and portfolio-og.png
personal host/local tracker path → NOVA mark, dark theme, existing tracker behavior
```

- [ ] **Step 5: Review the final diff and commit documentation/gates.**

Run: `git diff --check` and `git status --short`.

```bash
git add README.md
git commit -m "docs(portfolio): describe personal site boundary"
```

## Final self-review checklist

- [ ] Spec requirement for public-only scope maps to Tasks 1–3 and Task 6.
- [ ] Spec requirement for work-first information architecture maps to Task 4.
- [ ] Spec requirement for palette/type/layout maps to Task 5.
- [ ] Spec requirement for favicon, thumbnail, OG/Twitter metadata, and manifest maps to Task 2.
- [ ] Spec requirement for reduced motion, focus states, mobile layout, and safe external links maps to Tasks 4–5.
- [ ] Spec requirement for lint/build/render verification maps to Task 6.
- [ ] Every step contains concrete paths, commands, expected outcomes, and no unresolved implementation gaps.
