# NOVA Health Sync (Android companion)

A read-only foreground Android app for NOVA's Health Connect integration. It requests **only weight, steps and sleep reads**, uses Android Keystore AES-GCM for the random 32-byte device credential, and does not use Google passwords, website session tokens or write permissions. Android backup is disabled.

## Build and install

Use JDK 17, Android SDK platform 36 and build-tools 35, and the committed Gradle wrapper:

```sh
./gradlew testDebugUnitTest assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

This debug APK is a development artifact. A signed release APK/Play listing, package signing custody and permission declarations in Play Console are separate release work; no signing keys are committed.

1. Install/update Health Connect (built into Android 14; separate app on supported older devices).
2. Ensure your source apps write weight, steps and sleep into Health Connect.
3. Choose **Grant read permissions**, then **Pair with NOVA**.
4. Sign into `https://personal.buildora.work/health?view=connections`, enter the displayed expiring code and approve the device. No website sign-in credential is entered in this app.
5. Choose **Check connection**, then **Sync now**. Sync is manual and foreground only. An error remains visible; the successful-sync checkpoint is advanced only after all chunks acknowledge.
6. Disconnect on the website to revoke uploads immediately. The optional local reset removes this phone's credential and checkpoint, leaving account imports intact.

## Data semantics

- Weight and sleep paginate every read; stable Health Connect IDs make retries idempotent.
- Reads remain within the last 29 days under the default historical permission window. Steps cover today plus 27 complete local days and use Health Connect **aggregation with user source priorities**, never summing raw overlapping records.
- Weight dates use the recorded offset when provided. Sleep belongs to its waking date using the recorded end offset; missing offsets fall back to the phone's current zone and are retained as the selected offset.
- Staged sleep includes sleeping/light/deep/REM intervals, merges overlaps and clips them to the session. Unstaged sleep is explicitly labelled **session duration**. Unknown or uncovered stages are not silently counted as confirmed asleep; unknown-stage sessions are labelled partial-stage-duration.
- Sleep duration is uploaded in **minutes**; raw stage intervals and source package are retained. Max 2,000 stages per session; an unsupported record produces an error rather than silently dropping stages.
- A full successful reread compares the prior successful snapshot and emits deletion tombstones for missing (type, source, ID) identities inside a retained 28-day window. Denied or incomplete reads never infer deletion. This is **not** the long-history changes-token implementation: deletion detection outside the foreground window remains pending.
- Upload chunks contain at most 200 records and stay below 750 KB. Empty windows send one acknowledged empty request, recording the completed check on the server. Partial uploads are retried with the same record IDs. Imported records are separate from manual website entries.

## Server contract

- `POST /api/health-connect/pair` unauthenticated `{deviceId,label,secretDigest}` → `{pairingCode,expiresAt}`. Digest is SHA-256 of raw secret bytes.
- `GET /api/health-connect/status`, bearer `deviceId.secretBase64url` → `{paired,lastSyncAt}`. Expired/revoked credentials return an explicit error.
- `POST /api/health-connect/sync` same bearer, `{records:[...]}` → `{count}`.
- Record: `{id,type,date,value,unit,source,measuredAt,updatedAt,deleted?}`. Types/units: weight/kg, steps/count, sleep/minutes. Optional retained provenance: `zoneOffsetSeconds,startAt,endAt,measurementKind,stages:[{stage,startAt,endAt}]`.

## Verification and release gates

Verified locally on 7 October 2026: `testDebugUnitTest` passed all 10 tests and `assembleDebug` produced `app/build/outputs/apk/debug/app-debug.apk` (package `work.buildora.healthsync`, minSdk 28, targetSdk 35, compileSdk 36). Gradle 8.13 wrapper distribution is pinned by SHA-256. Android `lintDebug` completed with 0 errors and 27 warnings (dependency/target updates and UI localization/accessibility follow-up); its report is `app/build/reports/lint-results-debug.html`. `adb devices` found no attached phone. No phone was connected or used.

JVM tests cover timestamp/date math, overlapping/clipped sleep stages, unstaged duration and raw-byte credential hashing, provider/type-scoped deletion identities, empty-window acknowledgement and payload-aware chunking. Building does not prove real-device permissions, provider aggregation or cloud pairing correctness. Release requires Android 13/14+ permission denial/revocation tests, a real phone comparison of source records and steps, offline/partial upload retry, webpage pairing/revocation, and production database migration/configuration verification. Background scheduling and broad-history change tokens are not enabled.

Official references checked 7 October 2026:

- [Health Connect setup and permissions](https://developer.android.com/health-and-fitness/health-connect/get-started)
- [Health Connect stable release notes](https://developer.android.com/jetpack/androidx/releases/health-connect) — pinned stable `connect-client:1.1.0`; do not use the guide's alpha dependency implicitly.
- [Read data and use aggregation for steps](https://developer.android.com/health-and-fitness/health-connect/read-data)
- [Sleep sessions](https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions)
