# Bible priority sync

Goal: keep personal.buildora.work's study snapshot and priorities aligned with the canonical Bible while preserving completed evidence and unrelated tracker data.

Architecture: derive both importance fields from Bible metadata in the existing generator; retain the dated inventory as a backlog, display optional/deferred decisions, and refresh saved chapter metadata from the shipped catalogue. A content digest detects edits even when titles/read times stay the same. No private Bible data is included in the public bundle.

- [x] Add regression tests for independent priorities, missing/invalid metadata, and content-only drift.
- [x] Generate the snapshot with both fields and content hashes; keep numbered ordering and stable chapter IDs.
- [x] Test and implement chapter metadata hydration preserving saved date assignments/schedules.
- [x] Render both fields and computed inventory totals with a clear optional/deferred study policy.
- [x] Remove non-atomic seed fallback; verify complete owner-scoped readback and preserve evidence/todos/reminders.
- [x] Run unit tests, lint, typecheck, build and focused roadmap E2E; regenerate against Bible main.
- [x] Seed only after dry-run validation, publish the isolated changes to portfolio main, and verify deployment status (release is checked after push).
- [x] Record sync instructions in both repositories, run Bible verification, commit/push Bible main.
