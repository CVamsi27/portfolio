# Unified Sharing Design

## Goal

Make sharing a single, discoverable personal workspace. Users should be able to create drops, review sent items, and receive both incoming and self-shared items from one `Sharing` destination.

## User experience

- Add `Sharing` as a primary personal navigation destination alongside Today, Focus, and Log.
- Remove separate sharing destinations from the More menu.
- Make `/share` the canonical route.
- Present two explicit views on `/share`:
  - `Create & sent`: the existing composer, sent-drop search, filters, and share controls.
  - `Inbox`: incoming allowlisted drops plus the user's own shared items.
- Keep the view switcher compact and usable at mobile widths. The active view must be apparent through selected state and heading copy.
- Preserve the existing primary action hierarchy: creating a share remains the main action in `Create & sent`; reviewing incoming items is the main action in `Inbox`.

## Route compatibility

- `/shared-with-me` remains available as a compatibility route and redirects to `/share?view=incoming`.
- Existing `/share/[shareId]` public/private drop URLs remain unchanged.
- Existing local `share` storage, synced `share:links` storage, Supabase queries, access modes, expiry behavior, and RLS assumptions remain unchanged.
- The Inbox continues to group rows by sender and explicitly labels self-owned rows as `Your shared items`.

## Implementation boundaries

- Extract the current incoming inbox UI and data-fetching behavior into a reusable tracker component.
- Render that component from the canonical Share page instead of maintaining a second page implementation.
- Use the existing pathname/query navigation patterns; do not introduce new persistence or database models.
- Keep the public Buildora host and unrelated personal routes untouched.

## Verification

- Test that the personal navigation exposes one `Sharing` destination and no duplicate share links in More.
- Test that `/share` renders the create/sent view by default and the inbox view when requested.
- Test that `/shared-with-me` redirects to the canonical inbox view.
- Test that self-shared rows remain visible in the combined inbox.
- Run lint, focused sharing/navigation tests, full Playwright, and `git diff --check`.
