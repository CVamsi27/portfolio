# Nutrition workspace implementation plan

Approved scope: the user requested continuing enhancements after the MacroFactor-level proposal. Execute within that scope without another approval round. The master nutrition and Android specifications remain the product target.

Architecture: preserve existing meal snapshots and legacy collection reads while introducing a stable meal operation model, persistent account-scoped drafts, richer recipes and versioned manual strategy. Keep domain logic separate from React; isolate provider and cloud/native rollout gates. Never claim unverified coaching accuracy or live phone sync.

Tech: Next/React/TypeScript, IndexedDB, existing Supabase owner-scoped storage and additive SQL migrations.

## Independent work units

- [x] Meal domain and durable drafts: validate whole drafts before write, stable per-item operation IDs, idempotent entry projection, IndexedDB persistence and account isolation; test invalid/duplicate/restore cases. Add additive transactional SQL ingestion schema with ownership and validation, retaining legacy data.
- [x] Rich recipes: serving count plus cooked weight, portion conversion and previews; ingredient snapshots and source preservation (prepared-batch lifecycle remains a later stage); integrated recipe builder in a separate component. Preserve legacy recipe compatibility and historical meals.
- [x] Manual strategy and day quality: dated program versions, weekly distribution, explicit day completeness/fasting with unknown-energy validation; summaries/history; test deterministic selection and invalid states. No fabricated adaptive recommendation.
- [x] Meal composer: multi-item draft, searchable saved/recent foods, custom quick add/ingredients, portions and editable rows, one Save meal, restore/discard; integrate recipe and existing database search; test real browser persistence and quantities.
- [x] Local integration and verification: preserve existing food edit/log routes and health/progress projections, backup new optional fields/collections, keyboard and phone layouts, build/type/lint and browser regression. Record which cloud/native/provider gates remain pending.

## Remaining target stages after this foundation

Provider credential/coverage verification, native Health Connect pairing/import and real-device testing, validated guided-coaching model and reviewed image/description assistance remain explicit master-plan deliverables. They are not complete merely because a control or design is present.

Do not run pnpm test:e2e (it moves environment files). Use pnpm exec playwright test with a completed local-mode production build; never rebuild while its server is active. Only the primary agent runs browser/build suites. Independent domain suites may run in parallel.

## Native/server implementation extension

- [x] Android foreground companion: read-only permissions, pagination, timezone/sleep stages, priority steps, encrypted pairing credential, safe chunking, empty sync checkpoint and source-aware deletion snapshots. Compiled APK and 10 JVM tests; live phone/instrumentation and release signing pending.
- [x] Health Connect server: expiring pairing/owner claim, digest-based authentication, bounded/atomic imports, tombstones, revocation, owner-only preview and request limits; isolated PostgreSQL evidence. Migration/configured-cloud verification pending.
- [x] Server validation for nutrition programs/day reviews, with cloud mutation rollout flag default off.

The new meal RPC is insert-only infrastructure; UI record-sync cutover/outbox and revision-aware editing are pending. Health imports currently appear separately in Connections; unified trends, full export/restore/deletion, broad-history changes and background sync remain open.

## Verified checkpoint

Production build, typecheck and ESLint pass. Final Chromium suite: 287 passing; nutrition/Health Connect domain suites: 38 passing. Isolated PostgreSQL migration tests and reapplication pass. Android debug APK compiles with 10 passing JVM tests; lint has 0 errors and 27 warnings. Cloud migrations, two-account configured checks, provider credentials and actual phone verification remain explicitly unverified. See NOVA_IMPLEMENTATION_AUDIT.md for boundaries and companion evidence.
