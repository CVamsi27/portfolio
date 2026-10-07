# Nutrition final-pass implementation plan

Approved continuation of the full nutrition specification; no new approval is required.

Goal: close usable feature gaps and fix observed errors without presenting unverified provider, coaching or real-device behavior as complete.

Architecture: keep historical consumed snapshots, legacy storage and manual health data. Add independently tested meal reuse/batch helpers, a cached catalog interface and owner-only health lifecycle operations. Root owns integration, backup/store changes and browser/build verification; isolated domain/SQL work may proceed independently.

- [x] Reusable meals and prepared batches: write failing domain tests for immutable snapshots, quantity scaling, corrected recipe yields and batch remnants; implement template/batch components with explicit consumed versus prepared state. Root integrates synced collections, backup validation and cloud key gate.
- [x] Offline catalog: test source/freshness/account isolation, aliases without conflating nutrients and stored declared portions; implement cached provider adapter and usable offline fallback. Root integrates logger search. Provider credential coverage remains a live gate.
- [x] Health lifecycle: test owner-only export/delete/restore and pagination; implement bounded owner operations without device secrets in files; explicit deletion, restore validation and source separation. Preserve tombstones against device reupload, manual data and existing revoke semantics. Add SQL migration and real PostgreSQL tests.
- [x] Final-pass review: reproduce draft/auth/search/save edge cases before fixing, check shared data and disabled-cloud features, test phone/keyboard flows, run build/type/lint/domain/SQL/browser gates.
- [x] Documentation and delivery: update change sheet/setup/audit with actual verified and blocked stages, commit/push/merge main/delete feature branch after green checks.

Unverified stages remain explicit: configured provider coverage, production migration/account checks, real Android instrumentation/phone pairing, release signing, validated adaptive coaching/check-ins, reviewed capture assistance, broad-history change tokens and background synchronization. Do not substitute placeholder success UI for these requirements.

Root alone runs pnpm build and pnpm exec playwright test. Never use pnpm test:e2e or rebuild an active .next server. No production table reset or printed credentials.

Delivery evidence: 299 browser, 79 nutrition/import domain and 13 shared progress/storage checks passed; build/type/lint/whitespace passed; isolated PostgreSQL new migrations/reapply and prior SQL regressions passed. The unchecked full-spec stages listed above remain open, independent of this completed final-pass scope.
