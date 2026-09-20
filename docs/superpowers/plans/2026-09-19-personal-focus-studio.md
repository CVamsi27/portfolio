# Personal NOVA//OS Focus Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the private NOVA//OS surface around an image-led Focus studio, remove the signed-in email from the personal navbar, and apply a consistent tracker-only editorial treatment without changing the public Buildora portfolio.

**Architecture:** Keep the existing `TrackerShell`, local-first storage, and route contracts. Add a destination-safe media resolver that normalizes Wikimedia Commons imagery and the existing quote source into cached `MotivationMedia`, then render it through a two-column desktop / stacked mobile `FocusScene`. Use an opt-in dossier card variant so personal tracker polish does not alter public portfolio cards.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide icons, Playwright E2E, localStorage/Supabase progressive sync.

## Global Constraints

- The public Buildora portfolio at `/` must remain unchanged.
- Do not change route names, localStorage keys, Supabase schema, authentication semantics, sharing privacy, or tracker calculations.
- Never send raw goal titles, user names, journal text, affirmations, or emails to public APIs.
- Preserve local-first behavior, no-sign-in local mode, fullscreen fallback, Escape behavior, visible focus states, and reduced-motion support.
- Use Wikimedia Commons for destination-aware public imagery; show attribution/source links for remote media.
- Release gates are `pnpm lint`, `pnpm build`, `pnpm exec playwright test`, and `git diff --check`.

---

### Task 1: Remove navbar email while preserving account access

**Files:**
- Modify: `src/components/auth/AuthButton.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `e2e/navigation.spec.ts`
- Modify: `e2e/editorial-foundation.spec.ts`

**Interfaces:**
- `AuthButton({ showEmail?: boolean })` defaults to `false` for the navbar and renders the email only when `showEmail` is `true`.
- Settings passes `showEmail` explicitly; the personal navbar keeps the default compact account presentation.

- [ ] **Step 1: Write the failing regression tests**

Add to `e2e/navigation.spec.ts`:

```ts
test("personal navbar does not expose account email text", async ({ page }) => {
  await seed(page);
  await page.goto("/todo");

  const rail = page.getByTestId("command-rail");
  await expect(rail.locator('[data-testid="auth-email"]')).toHaveCount(0);
  await expect(rail).not.toContainText(/@/);
});

test("settings keeps account controls outside the navbar", async ({ page }) => {
  await seed(page);
  await page.goto("/settings");
  await expect(page.getByText("Account & sync")).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign in|Sign out|Local mode/ })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused tests to verify the new contract is not implemented**

Run: `pnpm exec playwright test e2e/navigation.spec.ts -g "account email|account controls"`

Expected: FAIL on the new assertions once a signed-in/configured fixture is used, because the current authenticated branch always renders the email and Settings does not distinguish its usage.

- [ ] **Step 3: Implement the account presentation boundary**

Update `AuthButton` to accept `showEmail = false` and import `UserRound` from `lucide-react`. In the authenticated branch, render a compact account icon with an accessible label, render `data-testid="auth-email"` only when `showEmail` is true, and keep the labeled Sign out button unchanged. Do not put the email in the compact icon title when `showEmail` is false.

Change the Settings account card to `<AuthButton showEmail />`. Leave the Navbar call as `<AuthButton />`.

- [ ] **Step 4: Run the focused tests**

Run: `pnpm exec playwright test e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts -g "account email|account controls|tracker top bar|product routes"`

Expected: PASS; the public portfolio assertions remain unchanged.

- [ ] **Step 5: Commit the navbar slice**

```bash
git add src/components/auth/AuthButton.tsx src/app/settings/page.tsx e2e/navigation.spec.ts e2e/editorial-foundation.spec.ts
git commit -m "fix: remove account email from personal navbar"
```

### Task 2: Build a destination-safe motivation media resolver

**Files:**
- Modify: `src/lib/motivation-media.ts`
- Modify: `src/app/api/motivation-media/route.ts`
- Modify: `src/app/motivation/page.tsx`
- Modify: `e2e/motivation-settings.spec.ts`
- Modify: `e2e/motivation-focus.spec.ts`

**Interfaces:**
- Extend `MotivationMedia` with optional `sourceUrl`, `provider`, and `destinationKey`.
- `getMotivationKeywords(source, category, country?)` returns fixed search terms only.
- `resolveMotivationMedia({ source, category, country, fetchImpl })` returns normalized media with independent image/quote fallback.
- The route accepts `source`, `category`, and optional `country`; it ignores unsupported countries and never accepts raw goal titles.

- [ ] **Step 1: Write the failing privacy and Germany query test**

In `e2e/motivation-settings.spec.ts`, capture `/api/motivation-media` requests after seeding `goalCategory: "relocation"`, `goalCountry: "Germany"`, and a sensitive custom `goalTitle`. Assert the latest request includes `category=relocation` and `country=Germany`, but not the custom title, the user name, or journal text.

- [ ] **Step 2: Run the focused test**

Run: `pnpm exec playwright test e2e/motivation-settings.spec.ts -g "Germany|safe destination"`

Expected: FAIL because the page currently does not send `country` and the resolver uses generic Art Institute search terms.

- [ ] **Step 3: Add fixed category and destination mappings**

In `src/lib/motivation-media.ts`, add category terms for relocation, fitness, career, learning, financial, and custom. Add a fixed destination map for every value in `RELOCATION_COUNTRIES`; Germany must resolve to terms such as `Germany`, `landmark`, `city`, and `landscape`. Unsupported values fall back to category terms. Do not interpolate free-form goal data.

The public helper should have this shape:

```ts
const DESTINATION_TERMS: Partial<Record<string, readonly string[]>> = {
  Germany: ["Germany", "landmark", "city", "landscape"],
  Canada: ["Canada", "landmark", "city", "landscape"],
  "United States": ["United States", "landmark", "city", "landscape"],
};

export function getMotivationKeywords(
  source: MotivationPersonalization,
  category: GoalCategory,
  country?: string,
): readonly string[] {
  if (source === "general") return GENERAL_KEYWORDS;
  if (category === "relocation" && country && DESTINATION_TERMS[country]) {
    return DESTINATION_TERMS[country]!;
  }
  return CATEGORY_TERMS[category] ?? CATEGORY_TERMS.custom;
}
```

Complete the fixed map for every supported relocation country before using the helper from the route.

- [ ] **Step 4: Replace the image provider with Wikimedia Commons normalization**

Build a server-side request to `https://commons.wikimedia.org/w/api.php` using `generator=search`, namespace `6`, `prop=imageinfo`, `iiprop=url|extmetadata`, and a bounded thumbnail width. Select the first result with a safe HTTPS thumbnail URL. Normalize image URL, alt text, attribution, source page URL, provider, and destination key. Keep the existing quote request independent and retain local quote fallback.

Build the request from `URLSearchParams` so query values are encoded and no raw user text can enter the URL:

```ts
const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
for (const [key, value] of Object.entries({
  action: "query",
  generator: "search",
  gsrsearch: keywords.join(" "),
  gsrnamespace: "6",
  gsrlimit: "8",
  prop: "imageinfo",
  iiprop: "url|extmetadata",
  iiurlwidth: "1600",
  format: "json",
})) endpoint.searchParams.set(key, value);
```

- [ ] **Step 5: Pass only validated country context**

In `MotivationPage`, send `country` only for relocation goals. In the route, accept it only when it is in `RELOCATION_COUNTRIES`; otherwise pass `undefined`. The query must never include `goalTitle`, `name`, `journal`, or `affirmation`.

- [ ] **Step 6: Run media/privacy tests and commit**

Run: `pnpm exec playwright test e2e/motivation-settings.spec.ts e2e/motivation-focus.spec.ts`

Expected: PASS for Germany-safe query, general inspiration privacy, mocked-image rendering, and existing focus behavior.

```bash
git add src/lib/motivation-media.ts src/app/api/motivation-media/route.ts src/app/motivation/page.tsx e2e/motivation-settings.spec.ts e2e/motivation-focus.spec.ts
git commit -m "feat: add destination-aware motivation media"
```

### Task 3: Recompose Motivation as the Focus studio

**Files:**
- Modify: `src/components/motivation/FocusScene.tsx`
- Modify: `src/app/motivation/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `e2e/motivation-focus.spec.ts`
- Modify: `e2e/reduced-motion.spec.ts`

**Interfaces:**
- `FocusScene` consumes `nextAction: string`, optional destination text, media image, attribution, source URL, provider, quote author, and destination metadata.
- Add `onRefreshMedia` and `mediaLoading` without changing existing action callbacks.
- Preserve `data-testid="focus-scene"`, `data-testid="focus-media"`, and `data-testid="focus-goal"`.

- [ ] **Step 1: Write failing hierarchy and mobile assertions**

Add assertions for visible `Next action`, a `Refresh transmission` button, a source link, and a 390px viewport check that the primary action is visible and the body has no horizontal overflow.

- [ ] **Step 2: Run the focused tests**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts -g "Next action|Refresh transmission|390px"`

Expected: FAIL because the current scene is quote-first and has no refresh or source link.

- [ ] **Step 3: Implement the two-column Focus studio**

Restructure `FocusScene` into a media figure and a brief column. The media figure contains the image, destination/category label, readable overlay, and source credit. The brief contains the quote and author, current objective, one concrete next action, goal progress, next milestone, streak, fullscreen, refresh, and existing secondary actions.

Use this component boundary so the existing callbacks remain stable:

```tsx
<div className="focus-scene__grid">
  <figure className="focus-scene__media">
    <img data-testid="focus-media" src={media?.imageUrl} alt={media?.imageAlt ?? "Motivational scene"} />
    <figcaption>
      {media?.sourceUrl ? <a href={media.sourceUrl}>{media.attribution}</a> : "LOCAL FALLBACK"}
    </figcaption>
  </figure>
  <div className="focus-scene__brief">
    <ChapterLabel eyebrow={destination ? `Focus transmission / ${destination}` : "Focus transmission"} />
    <blockquote>{quote}</blockquote>
    <p data-focus-next-action>Next action: {nextAction}</p>
    <div data-focus-progress>Goal signal: {safePct}%</div>
    <div className="focus-scene__actions">
      <Button type="button" onClick={onStartAction}>Start next action</Button>
      <Button type="button" variant="outline" onClick={onRefreshMedia}>Refresh transmission</Button>
      <Button type="button" variant="ghost" onClick={onOpenGoal}>Open goal</Button>
    </div>
  </div>
</div>
```

Use this component boundary so the existing callbacks remain stable:

```tsx
<div className="focus-scene__grid">
  <figure className="focus-scene__media">
    <img data-testid="focus-media" src={media?.imageUrl} alt={media?.imageAlt ?? "Motivational scene"} />
    <figcaption>
      {media?.sourceUrl ? <a href={media.sourceUrl}>{media.attribution}</a> : "LOCAL FALLBACK"}
    </figcaption>
  </figure>
  <div className="focus-scene__brief">
    <ChapterLabel eyebrow={destination ? `Focus transmission / ${destination}` : "Focus transmission"} />
    <blockquote>{quote}</blockquote>
    <p data-focus-next-action>Next action: {nextAction}</p>
    <div data-focus-progress>Goal signal: {safePct}%</div>
    <div className="focus-scene__actions">
      <Button type="button" onClick={onStartAction}>Start next action</Button>
      <Button type="button" variant="outline" onClick={onRefreshMedia}>Refresh transmission</Button>
      <Button type="button" variant="ghost" onClick={onOpenGoal}>Open goal</Button>
    </div>
  </div>
</div>
```

Keep fullscreen ref/state, `data-focus-active`, Escape handling, `safePct`, and all existing callbacks. Keep Shuffle, Save, and Copy available below the primary action.

- [ ] **Step 4: Add responsive and failure-safe styling**

Add tracker-scoped styles for a two-column desktop grid and stacked mobile layout. Use square/compact editorial panels, archive background, cyan orientation, lime progress, and red action signals. On image decode failure, hide the image layer and retain the local gradient plus all text. Disable continuous background motion under `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Add cache-aware refresh orchestration**

Use a cache key built from source, category, and validated destination key. Derive `nextAction` before rendering with `nextMilestone === "All milestones complete" ? "Log today's progress" : `Move toward: ${nextMilestone}``; this is display copy only and is never sent to the provider. Reuse fresh media, remove only the active key on refresh, and ignore late responses after unmount or preference changes with cancellation. Pass loading state to the scene without shifting layout.

- [ ] **Step 6: Run and commit**

Run: `pnpm exec playwright test e2e/motivation-focus.spec.ts e2e/motivation-settings.spec.ts e2e/reduced-motion.spec.ts`

Expected: PASS for mocked remote media, attribution, refresh, fullscreen fallback, reduced motion, persistence, and mobile layout.

```bash
git add src/components/motivation/FocusScene.tsx src/app/motivation/page.tsx src/app/globals.css e2e/motivation-focus.spec.ts e2e/reduced-motion.spec.ts
git commit -m "feat: redesign motivation as focus studio"
```

### Task 4: Apply tracker-only editorial card consistency

**Files:**
- Modify: `src/components/ui/card.tsx`
- Modify: tracker route files under `src/app/trackers`, `src/app/intermittent-fasting`, `src/app/workout-tracking`, `src/app/goal`, `src/app/todo`, `src/app/motivation`, `src/app/settings`, `src/app/share`, `src/app/shared-with-me`, and `src/app/login`
- Modify: `src/app/globals.css`
- Modify: `e2e/editorial-foundation.spec.ts`

**Interfaces:**
- `Card` gains optional `variant?: "default" | "dossier"`; default preserves public portfolio behavior.
- Tracker route cards opt into `variant="dossier"`; public Skills/Contact cards do not.

- [ ] **Step 1: Write the variant regression tests**

Assert that the public portfolio contains zero `[data-card-variant="dossier"]` elements and that `/motivation` contains at least one.

- [ ] **Step 2: Run the tests to verify the variant is missing**

Run: `pnpm exec playwright test e2e/editorial-foundation.spec.ts -g "card|portfolio|motivation"`

Expected: FAIL on the new variant assertions.

- [ ] **Step 3: Add the opt-in Card variant**

Add a `variant` prop and `data-card-variant="dossier"` marker. Add archive-scoped `dossier-card` CSS with compact corners, strong border, one offset signal shadow, and no automatic gradient. Preserve rounded controls nested inside cards.

Use an explicit variant instead of changing the default shared card:

```tsx
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "dossier";
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      data-card-variant={variant === "dossier" ? "dossier" : undefined}
      className={cn(
        variant === "dossier"
          ? "dossier-card"
          : "rounded-2xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
```

Use an explicit variant instead of changing the default shared card:

```tsx
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "dossier";
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      data-card-variant={variant === "dossier" ? "dossier" : undefined}
      className={cn(
        variant === "dossier"
          ? "dossier-card"
          : "rounded-2xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
```

- [ ] **Step 4: Opt tracker cards into the variant**

Update structural cards in tracker routes to pass `variant="dossier"`. Do not modify public portfolio card call sites.

- [ ] **Step 5: Run shell and mobile consistency tests**

Run: `pnpm exec playwright test e2e/foundation.spec.ts e2e/editorial-foundation.spec.ts e2e/navigation.spec.ts`

Expected: PASS with archive routes using the dossier treatment and the public paper route retaining its current identity.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/card.tsx src/app/trackers/page.tsx src/app/intermittent-fasting/page.tsx src/app/workout-tracking/page.tsx src/app/goal/page.tsx src/app/todo/page.tsx src/app/motivation/page.tsx src/app/settings/page.tsx src/app/share/page.tsx src/app/shared-with-me/page.tsx src/app/login/page.tsx 'src/app/share/[shareId]/page.tsx' src/app/globals.css e2e/editorial-foundation.spec.ts
git commit -m "style: unify personal tracker panels"
```

Stage only the listed tracker/public call-site files; do not include unrelated workspace directories.

### Task 5: Run release gates and verify the public boundary

**Files:**
- Modify only if needed: `CHANGELOG.md`
- Test: all existing `e2e/*.spec.ts`
- Verify unchanged: `src/app/page.tsx`, `src/components/pages/*`, and public-route tests

- [ ] **Step 1: Run lint**

Run: `pnpm lint`. Expected: exit 0 with no new warnings/errors.

- [ ] **Step 2: Run the production build**

Run: `pnpm build`. Expected: exit 0 with the updated Wikimedia route, Focus studio, and card variant.

- [ ] **Step 3: Run the complete E2E suite**

Run: `pnpm exec playwright test`. Expected: all tracker, motivation, sharing, onboarding, reduced-motion, branding, and public-boundary tests pass.

- [ ] **Step 4: Check whitespace and public-route drift**

Run `git diff --check) and compare the complete branch diff against the pre-work commit. The diff must contain no public portfolio component files or root-page behavior changes.

- [ ] **Step 5: Manually verify 1440px and 390px**

Confirm destination image/credit readability, obvious next action, email-free rail, meaningful local fallback, stable refresh feedback, reduced-motion behavior, reachable mobile dock, and no horizontal overflow.

- [ ] **Step 6: Record release evidence**

Add a concise current entry to `CHANGELOG.md` covering the personal-only navbar cleanup, destination-aware Focus studio, safe public media attribution/fallback, and tracker panel consistency. Run:

```bash
git add CHANGELOG.md
git commit -m "docs: record personal focus studio polish"
```
