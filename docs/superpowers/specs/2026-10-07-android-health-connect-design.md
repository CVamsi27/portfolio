# Android Health Connect synchronization

## Goal and platform constraint

Sync weight, steps and sleep from the user's Android Health Connect / Google Fit setup into NOVA. Health Connect is an on-device Android datastore, accessed through its Android SDK. A website/PWA cannot request its record permissions directly. Google Fit REST is approaching end of service and is not the integration target. Google Health API currently does not onboard new projects and is a different source path.

The source apps must already write the relevant records to Health Connect. NOVA cannot import data absent from Health Connect or bypass permissions. First delivery covers weight, daily steps and sleep duration/sessions; other metrics are future opt-in additions.

## Recommended design

Build a small read-only Android companion plus an authenticated website ingestion endpoint. The companion displays connection state, granted metric types, last successful sync and Sync now. Android permission prompts request only READ_WEIGHT, READ_STEPS and READ_SLEEP; background read is a separate optional permission when available. Android 13 devices support foreground sync; Android 14+ background capability must be checked before scheduling WorkManager.

The website Settings > Health connections displays the connected device, permitted metrics, last sync, errors/retry and Disconnect. Health and Progress show source-labelled imported records and daily step counts. No disconnected feature appears as successfully connected.

## Alternatives

- Companion app (recommended): supports ongoing device sync and current Health Connect APIs; requires APK installation and permission on the phone.
- File import: avoids an Android application but requires manual exports and cannot provide ongoing synchronization.
- Google Fit REST: unsuitable for a new integration because of its documented end-of-service migration.

## Pairing and authorization

Use dedicated revocable device credentials, not the user's Google password or NOVA session token. The app generates a random 256-bit device secret, stores it with Android Keystore-backed encryption, and sends only its digest when creating a pending pairing request. A separate cryptographically random pairing code expires after ten minutes. The user signs into NOVA in a normal browser, enters that code, reviews read-only metric permissions and approves the device. The server atomically binds an unclaimed request to the current Supabase user. No anonymous request can select an owner or read health records.

Ingestion authenticates the device credential against a server-held digest and its active account binding. Limit payload size, date range, record counts and request frequency. Pending pairing requests are rate-limited and expire; device secrets never appear in URLs, logs or exports. Disconnect invalidates ingestion immediately. Google OAuth remains in the normal browser.

## Data and merging

Store imported records separately from manual records, owner-scoped with database policies. Each weight measurement and sleep session keeps provider record ID, source package, device, timestamp, timezone offset and upstream modification/deletion state. Daily steps use Health Connect aggregation with user source priorities, rather than adding overlapping records from multiple apps. Sleep duration excludes awake stages when available; records without stages are labelled session duration. Overnight sessions are assigned consistently by waking date in the recorded timezone.

Use stable upstream IDs and timestamps for idempotent upsert and tombstones. Repeated sync must never duplicate steps or sleep. Handle paginated reads, changes-token expiry and re-fetch of the allowed window. A partial upload is retried with the same IDs. Manual weight and sleep records remain editable; show a conflict/source selection rather than silently overwriting a manual value. Imported values retain original provenance and unknown fields.

## Release acceptance

- Browser/API tests: unauthorized ingestion rejected; no cross-account reads; duplicate batches idempotent; revoked credentials rejected; malformed records rejected before writes; midnight/overnight and multi-source steps correct; manual records preserved; export/restore includes imported data without credentials.
- Android compilation and instrumentation: unavailable SDK, Android 13/14, permission denial/revocation, missing source data, pagination, expired change tokens, offline retry and optional background restrictions.
- Real device: install companion, pair to the signed-in account, grant requested metrics, verify weight/steps/sleep against Health Connect, reconnect after offline use and disconnect/revoke.
- Existing nutrition, reminders, owner timetable and public portfolio regression must pass. Apply additive migrations with backup; never reset tables.

## Current status

Design prepared; companion, ingestion endpoint, database migration and live phone sync are not yet implemented. Android SDK/Gradle are not available in the current workspace environment. Implementing this is a new native-app deliverable beyond the existing website, with its own installation and device verification requirement.

## Primary references, checked 7 October 2026

- https://developer.android.com/health-and-fitness/health-connect/get-started
- https://developer.android.com/health-and-fitness/health-connect/read-data
- https://developer.android.com/health-and-fitness/health-connect/migration/fit
- https://developers.google.com/health

## Expanded nutrition product proposal

The user subsequently requested MacroFactor-level implementation. The [complete nutrition specification](2026-10-07-macrofactor-level-nutrition-design.md) incorporates this Android integration alongside the food catalog, multi-item logger, recipes, insights and independently validated coaching. It remains a proposed expanded design; no implementation status above is changed.
