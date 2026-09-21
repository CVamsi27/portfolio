# Study Buildora Access Design

## Goal

Publish the `software-developer-bible` repository at `study.buildora.work`, make it discoverable from the public `buildora.work` portfolio, and restrict the deployed study content to the Google identity `cvamsik99@gmail.com`. A signed-in user with any other email is sent to `https://personal.buildora.work/?study=access-denied`; an unauthenticated visitor sees a study-specific Google sign-in screen.

The public portfolio and personal tracker remain separate products. The public portfolio keeps its current open access, and the personal tracker keeps its existing host routing and authentication behavior.

## Scope and repository boundaries

This feature touches two repositories:

1. `portfolio` — public navigation, host-aware favicon metadata, personal-shell UX redesign, and regression coverage for the new study entry, icon behavior, and mobile hierarchy.
2. `software-developer-bible` — Cloudflare Pages access middleware, OAuth callback/session bridge, study login page, favicon, and deployment documentation.

The study repository remains a static Jekyll/Cloudflare Pages deployment. Study content is not copied into the Next.js portfolio app.

## Personal shell redesign

The personal tracker keeps its NOVA//OS identity, routes, persisted data, and domain behavior, but the shared shell is restructured around one daily flow. The hub is the command center; child pages become quieter task surfaces.

### Hub hierarchy

The mobile-first hub will render in this order:

```text
[ NOVA//OS ]                                      [ menu ]

Tue Sep 21 · 16:45

TODAY
Relocate to Germany

NEXT MOVE
Complete the next milestone                         [ Start action ]

[ momentum ring ]       [ Fast ] [ Tasks ] [ Goal ] [ Workout ]

[ Quick log ]           [ Start focus ]

Recovery cue, only when needed
Week pulse and activity, progressively disclosed
```

The hub will have one dominant next-action block, one completion ring, and compact anchor details. Existing typed next-action priority and persisted tracker calculations remain the source of truth. Recovery, weekly review, activity, install prompts, and motivation become lower-priority sections that do not compete with the next move.

### Shared shell rules

- Replace the oversized chapter telemetry treatment with a compact section bar and concise local date/time row.
- Keep Munich and San Francisco clocks available through a compact disclosure rather than consuming the full header on every page.
- Render the mobile dock only on core action pages. Login, public landing, settings, archive, sharing, and other utility pages do not show a dock that can overlap content.
- Keep the dock to core destinations; expose archive, motivation, sharing, settings, and secondary trackers through a single More destination.
- Child pages use a quiet back-to-Hub control, one title/subtitle pair, one primary action, and their content. They do not repeat the hub's daily dashboard panels.
- Preserve safe-area padding, keyboard focus visibility, reduced-motion behavior, and the no-horizontal-overflow contract at 320px, 390px, and 430px.
- Reduce decorative competition: graphite surfaces are primary, acid lime marks action, cyan marks information, and amber marks attention. Purple gradients and red rules are not used as competing primary signals.

The signature interaction is the “Next move” block: it is the first actionable element after the compact date row and always leads to the same typed action destination shown by the hub calculation.

## Chosen architecture

### Portfolio entry

Add a restrained `Study` link to the public portfolio navigation on desktop and the existing mobile menu. It points directly to `https://study.buildora.work`. The link is absent from the personal tracker navigation, so the product surfaces stay distinct.

### Study access boundary

Use a Cloudflare Pages Function middleware in the study repository as the security boundary. A browser-only content gate is not sufficient because static files could still be requested directly.

The middleware will:

- allow only the login page, OAuth callback page, session exchange endpoint, and favicon/bootstrap assets without a study session;
- validate the `study_access_token` HttpOnly, Secure, SameSite=Lax cookie against the configured Supabase Auth user endpoint;
- compare the returned email case-insensitively to `cvamsik99@gmail.com`;
- serve the static Jekyll output only for the allowed email;
- clear invalid or expired cookies and redirect non-allowed authenticated users to the personal host with `study=access-denied`;
- avoid caching authenticated HTML or session responses at the edge.

The access boundary protects the deployed study host. The GitHub repository remains governed by its existing repository visibility and GitHub permissions; this feature does not attempt to make source code private.

### Google OAuth flow

The study login page starts Supabase Google OAuth with a callback at `https://study.buildora.work/auth/callback.html`. The callback page reads the returned access token from the OAuth fragment, posts it once to the same-origin session endpoint, and removes the token fragment from the address bar.

The session endpoint validates the token with Supabase before setting the HttpOnly cookie. It returns success only for the allowlisted email. A non-allowlisted Google account receives a cleared cookie and a redirect target for `personal.buildora.work/?study=access-denied`. An allowed account is redirected to `/`.

The study deployment requires server-side Cloudflare variables for the Supabase project URL and publishable/anon key. The key is not treated as authorization; the server-side user validation and email comparison are the gate.

### Favicons

The portfolio app will expose separate SVG icon assets:

- public host: simple Buildora mark;
- personal host: simple NOVA//OS mark;
- study host: a restrained Buildora study mark in the static repository.

The Next.js metadata and explicit head link will choose the public or personal icon from the request host. The study repository will reference its own local favicon so it does not inherit the current NOVA asset or depend on the portfolio deployment.

## User experience

- Public portfolio: `Study` reads as a focused learning resource, not another project card or tracker control.
- Unauthenticated study visitor: sees a concise “Study Bible” explanation and one “Continue with Google” action.
- Allowed visitor: returns to the requested study page after successful login.
- Other signed-in visitor: is redirected softly to the personal host with a clear access-denied context rather than a dead-end error page.
- Expired/invalid session: returns to the study login page and does not expose protected content.
- Mobile: the new portfolio link uses the existing menu behavior and does not add horizontal width.

## Failure handling

- Missing Supabase configuration: the study login page explains that access is not configured; protected content remains unavailable.
- OAuth cancellation or provider error: return to the study login page with a recoverable message.
- Supabase validation timeout/error: fail closed and return to login; do not serve study content.
- Non-allowlisted email: clear the session cookie before redirecting to the personal host.
- Direct request to a content file without a valid session: middleware redirects before the file is served.
- Browser back/forward cache: authenticated pages send no-store headers where the middleware controls the response; logout clears the cookie and returns to the login page.

## Verification

Portfolio tests:

- public navigation exposes the Study option with the exact external URL;
- personal navigation does not expose the public Study option;
- public host renders the Buildora favicon;
- personal host renders the NOVA//OS favicon;
- existing public-host regression tests continue to prevent tracker routes from appearing on `buildora.work`.
- personal login/utility pages do not render the mobile command dock;
- hub mobile hierarchy exposes one next-action block, one momentum ring, and no horizontal overflow;
- compact clock disclosure does not increase the shell's default mobile height;
- child pages return to `/hub` without repeating hub-only content.

Study repository tests/checks:

- allowed-session middleware serves the requested static page;
- missing/invalid session never serves study HTML and redirects to login;
- non-allowlisted email clears access and redirects to the personal host;
- OAuth callback/session exchange succeeds only for the exact allowlisted email;
- Jekyll build and existing publish-safety assertions remain green;
- favicon and login assets resolve from the study host.

Release verification will include `git diff --check`, portfolio lint/typecheck/E2E, the study repository's Jekyll CI gate, and a deployed smoke check on all three host behaviors. Supabase credentials and Cloudflare Pages variables are deployment prerequisites, not committed secrets.

## Explicit non-goals

- No study content migration into the portfolio app.
- No change to personal tracker RLS or local storage.
- No client-only protection presented as secure access control.
- No broad email-domain allowlist; only `cvamsik99@gmail.com` is accepted.
- No new background notification or study-progress data system.
