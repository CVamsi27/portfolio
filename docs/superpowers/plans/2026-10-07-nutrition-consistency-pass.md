# Nutrition consistency pass

Approved continuation of the existing nutrition design.

Goal: keep planned versus consumed behavior consistent in day review, use the newest valid snapshot in recent food retrieval, and make range analysis robust to malformed persisted records and extreme totals.

- [x] Reproduce planned-food fasting/complete review with browser journeys before changing controls.
- [x] Reproduce recent snapshot selection and invalid record behavior with pure domain tests. Extract recent retrieval into a small helper used by FoodTracker; keep entry metadata out of reusable food snapshots, preserve declared portions, and preserve library tombstones.
- [x] Test incomplete/overflowing analysis and invalid dates before fixing the aggregate/date guards. Preserve unknown versus zero and historical review invalidation.
- [x] Verify domain, build/type/lint and browser regressions; update audit/setup/change sheet with actual results and remaining full-spec gates.
- [x] Commit and push, fast-forward main and delete branch under existing authorization.

No provider/model/native activation or production migration is inferred from local checks.

Evidence: 302 browser checks, 96 domain/storage checks and seven focused nutrition journeys passed; build/type/lint/whitespace passed. Two browser failures and the aggregate/malformed-row failures were observed before their fixes.
