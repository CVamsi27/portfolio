# Personal access allowlist

Approved by the user on 11 October 2026: restrict personal.buildora.work to
cvamsik99@gmail.com and srija210v@gmail.com using server-validated Google sign-in.

Protect all personal pages (including landing and sharing) except login and the
OAuth callback. Validate Supabase cookie sessions with getUser; normalize email
case and require a confirmed Google identity with an exact email match. Reject
other users with an access-denied screen, and fail closed when configuration or
authentication services are unavailable. Preserve safe relative return paths.

Protect personal APIs on every deployed host so the public portfolio and preview
hosts cannot serve as alternate API entrances. Accept validated bearer sessions
for existing API clients. Contact remains public. Push dispatch keeps its cron
secret; Android pairing creates only a pending device, while claiming requires an
allowed user and paired device status/sync verifies the owner's allowlist. These
machine endpoints retain their existing authentication and throttling.

Keep the public portfolio open and localhost development unrestricted. Static
bootstrap assets remain available. Do not cache protected HTML or Flight payloads;
disable navigation caching and purge old service-worker caches on the personal
host. Localhost retains its existing offline behavior. Client gating also hides
private content after sign-out or an account change.

Use the existing Supabase SSR cookie client and a PKCE callback that exchanges
the authorization code before redirecting to the protected destination. Do not
trust cookie user payloads or locally decoded JWTs. Existing data and RLS remain
unchanged; this is a website access boundary, not a database migration.

Verify exact emails, rejected lookalikes, missing/unverified/non-Google accounts,
cookie and bearer validation, auth outages, safe callbacks, cache behavior,
public/local routing and real server responses. Document callback configuration
and distinguish local implementation from a live deployment.
