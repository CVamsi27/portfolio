# Workspace completion plan

Continue the approved all-domain dashboard and usable-page redesign. Retain the existing teal/neutral design and records. Reduce navigation/entry friction rather than add more summary cards.

- [x] Tasks: collapse optional entry metadata, replace repeated filter chips with compact labeled selects, add name search and clear filters; keep keyboard add/edit/delete undo.
- [x] Goals: replace duplicate introductory story/score panels with a compact next-milestone line and a dated 30-day metric chart with missing-day gaps.
- [x] Progress: include journal-day records and a dated current-goal metric chart; preserve known-value and range semantics.
- [x] Shared navigation: make secondary-page return links point to their owning section; retain stable routes and keyboard focus.
- [x] Verify meaningful behavior with focused tests, populated screenshots, lint/typecheck/build and full regression suite.
- [x] Record evidence, commit/push, integrate latest main without dropping concurrent changes and push main.

Release evidence: 231 full Chromium tests, 25 domain/storage tests, 12 final-build focused browser tests; typecheck, lint and production build passed. Local QA evidence only; existing production gates remain pending.
