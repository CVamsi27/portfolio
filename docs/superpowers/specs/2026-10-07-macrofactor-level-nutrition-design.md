# NOVA nutrition: MacroFactor-level product specification

Status: accepted for staged implementation by the user's request to continue enhancements. This expands the food repair into a complete nutrition and coaching product. Features listed below are requirements, not claims of existing implementation.

## Product objective

Make NOVA usable as the user's primary food, body-weight and nutrition-strategy application: fast daily logging, dependable food data, complete recipes, useful trends and understandable weekly adjustments. Preserve the wider Run my day workspace: work, meals, exercise and reminders remain connected through Today, Health and Progress.

Use MacroFactor's documented capabilities as the quality benchmark, while retaining NOVA's own design and independently implemented algorithms. Do not promise the same food catalog, proprietary model, algorithm accuracy or commercial-provider access.

The recommended scope includes all core logging, database, recipe, strategy, analytics and Android integration requirements below. Photo/description/label assistance is the final delivery stage, not a substitute for the core logger. Existing workout recording is preserved; this is not a specification for cloning a separate workout-coaching application.

## Delivery approaches considered

- Web nutrition workspace plus Android companion (recommended): keeps existing daily-workflow integration and delivers device imports without duplicating the logger.
- A full native-first Android nutrition application: stronger native camera/widget integration, but adds a second complete UI and a larger migration/maintenance obligation. This can be a later evolution.
- Web-only nutrition: useful for logging and strategy but cannot satisfy the requested Health Connect synchronization, so it does not meet the full target.

## Current gaps verified in NOVA

- Single-food modal saves rather than an editable multi-food meal draft.
- USDA-only online search; production currently returns 503 because its server credential is absent.
- Food records lack multiple declared portions, barcode lookup and catalog revisions.
- Recipes retain scaled ingredient snapshots but lack cooked weight plus servings, prepared batches and per-log ingredient adjustments.
- Nutrition targets are manually entered nutrient values; there is no nutrition program, adaptive expenditure model or weekly check-in.
- Body weight has recorded history; no validated coaching trend model feeds nutrition strategy.
- No nutrition-day completeness state, so a partial day cannot yet be distinguished from fully recorded intake.
- Nutrition uses account-scoped JSON collections with timestamp merging. It lacks a transactional meal write, durable operation outbox and provider catalog storage.
- Android Health Connect integration exists only as a proposed design.

The 7 October ingredient/recipe repair is a useful foundation, not product parity. Its tests do not establish coaching accuracy or live cloud/device readiness.

## Daily experience

Health opens a compact nutrition summary with energy/protein/carbohydrate/fat consumed and the selected day's targets, weight trend, and a single Log meal action. Diary remains reachable directly from Today. Keep the global four-item navigation; nutrition uses local Diary, Foods & recipes, Insights and Strategy views.

Diary shows date, meal groups/time, consumed amounts, notes and optional targets. Missing targets do not block logging. Use neutral consumed/remaining wording, and allow totals to exceed a target without punitive styling. Planned food is visibly separate from consumed intake. Yesterday, today and historical capture retain their chosen date, meal and return context.

Log meal opens one draft with Search, Recent, Library, Barcode and Quick add sources. Add several foods, review portions and total nutrition, then Save meal once. Creating a food or recipe can return it directly to this draft. Editing a row does not discard the rest of the draft. Navigation, rotation, refresh and network loss preserve the draft; discard is deliberate.

Repeat/copy a meal or selected foods to another date, change quantities in place, move items between meals, save a meal template, and delete/undo without corrupting history. Search can be used with a keyboard, and every gesture has a visible button equivalent.

## Food database and provider service

Use a provider-neutral catalog interface. Separate common/research foods, packaged label foods, private custom foods and recipe estimates. Each result exposes provider, brand, region, raw/cooked/prepared state, portion basis, retrieval date and available nutrient coverage.

- Common-food search must support staple ingredients and home-cooked Indian meals, with raw and cooked variants distinguished. Curated aliases such as dal/lentils or curd/yogurt improve retrieval but do not assert those foods have identical nutrient values.
- Branded foods support barcode lookup, name/brand search and label correction into a private custom version.
- USDA integration must be configured and exercised against real signed-in requests before the catalog gate passes. Evaluate an additional international/Indian packaged-food provider using its coverage, units, terms, licensing, availability and cost. A provider returning 503 in a probe is not a validated fallback.
- Keep a reviewed cached catalog slice and the user's library searchable offline. Return useful cached results during outages and show provider freshness. Do not confuse cached results with a complete global database.
- Provider services use bounded caches, timeouts, request limits, retries only for appropriate transient failures, structured errors and operational availability metrics. No public demo API key in production.
- Avoid duplicate results across providers where equivalence is verified; retain distinct versions when preparation, portions or label values differ.
- Preserve null/unknown nutrients, explicit zero, kcal/kJ conversions and nutrient identity. Never interpret absence as zero. Show reported calories separately from macro-derived calculations when they differ.
- Store per-100g/per-100ml/declared-serving bases explicitly. Permit pieces, bowls, cups and tablespoons only with source-declared gram/ml conversions. A volume-to-weight conversion needs an actual density; serving names alone are insufficient.
- Attribution and applicable database licenses remain visible and included in exports. Do not scrape MacroFactor's private database.

Catalog acceptance uses a documented representative test list: staple foods, Indian brands, raw/cooked variants, liquids, serving-based labels, products with incomplete micronutrients and missing barcodes. Record source coverage and unsupported cases before release; do not market unverified database breadth.

## Recipe and meal system

A recipe stores ingredient source versions, quantities, original nutrient snapshots, name, instructions/notes, serving count and optional final prepared weight. Both servings and cooked grams can coexist, so the user can log either one serving or a weighed portion from the same batch.

Recipe editor allows search/barcode/custom ingredient creation without exiting, immediate quantity editing, replacement, removal, reordering and duplication. Include oils, sauces and toppings as ordinary ingredients. Show total batch nutrition and per-serving/per-100g previews, with unknown coverage.

Prepare creates a batch snapshot: modify ingredients for this cooking session, record final weight/servings, and optionally save a new recipe version. Log part of the batch or expand its ingredients into a meal draft for substitutions. Never infer cooked weight by summing raw ingredients; do not infer vitamin retention from cooking without supported data.

Recipe edits never rewrite past consumed records. Repeating a past meal retains its snapshot unless the user explicitly chooses the current recipe version. Deleting a recipe keeps already logged meals and undo history intact.

Quick add accepts known energy and/or macros with a name and note. Missing values stay missing. Imported label values can be reviewed before creating a reusable food.

## Nutrition-day quality and completeness

Track a user's explicit day status: not logged, partial, complete, estimated complete, or confirmed fasting. Meal entries alone never prove that a day is complete. Mark complete is available after review; unresolved energy values prevent that day from being treated as fully known energy intake.

Confirmed fasting is distinct from an empty log. A fasting day with consumed food requires reconciliation. Historical corrections invalidate/recompute affected analysis and pending recommendations. A day may have complete calorie intake while still having incomplete micronutrient coverage; show those separately.

These statuses serve analytics and coaching, rather than awarding compliance scores. Partial logs remain useful records and are not silently extrapolated to a full day.

## Goals and strategy

Support loss, maintenance and gain goals, target weight when relevant, preferred pace and review dates. Onboarding explains starting estimates and accepts an existing externally prescribed/manual plan. Starting estimates, learned expenditure and confirmed target plans have separate labels.

Three program modes:

- Manual: user sets calorie/macronutrient targets, with daily variations and program history. No automatic adjustment.
- Guided: NOVA proposes weekly energy and macro changes from eligible logged intake, weight trend and goal. Explain inputs, uncertainty and why a change is suggested. User accepts, edits or skips the check-in; no silent target replacement.
- Flexible: NOVA proposes a weekly budget; the user distributes calories/macros across days, preserving the weekly total and seeing tradeoffs before accepting.

Allow protein preference, balanced/custom macro allocation and configurable day distribution. Program changes apply from an explicit date and retain prior versions; past food records do not change. Show consumed-versus-plan and observed goal progress separately.

## Independent trend and expenditure engine

Implement the engine as a versioned, deterministic domain module with stored input provenance, eligibility decisions and reason codes. Display raw weight separately from a smoothed trend. Corrections, unit changes, noisy measurements and missing days must not silently fabricate observations.

The initial model must be fully specified, reviewed and tested before guided mode is enabled. Define smoothing, initial expenditure, calibration window, eligible-day rules, treatment of fasting/estimates, outlier policy, uncertainty, adjustment bounds and goal transitions in a dedicated algorithm specification. Numerical defaults must come from justified evidence and validation; a generic calorie-per-kilogram shortcut is not sufficient to claim MacroFactor-level accuracy.

Hold recommendations when data is insufficient, contradictory or uncertain, and tell the user what records are missing. Preserve the last accepted program during those periods. The model responds to observed intake and trend, rather than judging whether the person followed the previous targets.

Steps and sleep provide activity/recovery context. Do not automatically add wearable calories burned to the food budget. A step-informed modifier is a separate future model change that requires its own validation.

Validation includes controlled synthetic trajectories, missing/partial days, water-weight changes, goal changes, late corrections, multi-device imports, and consented longitudinal records where available. Compare prospective weight predictions with a documented baseline, report error/stability across scenarios, and review operating bounds before enabling generated targets. Synthetic tests prove behavior, not real-world physiological accuracy. Never claim accuracy equivalent to MacroFactor without comparative evidence.

## Insights

Daily/7/30/90-day/custom-range energy and macros; nutrient detail with contributor foods, coverage and optional user reference values. Show average complete-day intake separately from averages across partial logs. Provide raw/trend weight, goal pace, estimated expenditure when eligible, accepted program history and weekly check-in explanations.

Health also shows source-labelled steps and sleep. Link each chart back to dated records for correction. Empty states offer the appropriate recording action; sparse charts retain gaps. Include neutral period comparisons and data-quality indicators rather than misleading perfect-completion scores.

## Android Health Connect

Include the previously proposed [Android integration](2026-10-07-android-health-connect-design.md): companion, account pairing, read-only weight/steps/sleep, permission state, optional supported background reads, duplicate prevention, changes/deletions and revocation. Source apps must already write their data to Health Connect.

Imported records remain separate from manual records. Daily steps use Health Connect aggregation/source priorities to avoid overlap. Overnight sleep keeps timezone/session provenance and distinguishes asleep duration from session duration. Manual weight/sleep conflicts are visible and resolved explicitly. Disconnected or unverified sync is never labelled active.

The web logger remains fully usable independently. Native phone installation, permissions, Android compilation and real-device synchronization are release requirements. Writing nutrition back to Health Connect is outside the first release and would require separate write permissions and loop-prevention rules.

## Storage, API and migration

Introduce dedicated catalog and owner-scoped nutrition tables for foods/versions, declared portions, recipes/ingredient versions, prepared batches, meal entries, nutrition days, goals/program versions and check-ins. Health integration uses separate imported-record and device-binding tables. Preserve immutable nutrient snapshots in consumed meal rows.

Meal save is one database transaction with a stable operation ID, preventing partial meals or duplicates on retry. Use explicit schema validation, ownership policies, limits and revision checks. Concurrent edits to the same entity surface a resolvable conflict; edits to distinct records merge independently. Deletes are tombstones until retention/undo rules allow cleanup.

Use IndexedDB for persistent drafts, local collections and an operation outbox; acknowledge local versus server saves honestly. Resume queued writes after restart/reconnect, and isolate caches by account. Keep provider credentials and device secrets outside user exports and browser storage.

Migrate existing nutrition JSON collections through a versioned, idempotent importer. Preserve IDs, amounts, dates, notes, favorites, unknown nutrients, tombstones and snapshots. Reconcile counts and nutrient totals before switching reads. Existing backups remain importable; new exports include the new schema. Retain legacy records until verified cutover, with a documented rollback read path. Never reset tables or silently discard records.

This replaces nutrition storage deliberately; other personal-workspace collections remain unchanged. Public portfolio/PDF and the owner Bible timetable remain out of scope.

## Photo, label and description assistance

After the core catalog/logger passes release gates, add barcode camera scanning with typed-code fallback, label OCR and described/photo meal proposals. The user reviews foods, preparation and quantities before logging. Unsupported or uncertain recognitions require correction; photo estimates do not masquerade as measured portions.

Provider choice, credentials/cost, data retention and whether images leave the device are explicit design decisions before enabling remote assistance. Store a reviewed draft, not an uneditable single calorie number. No health records or photos are sent to an external model without the user's feature choice.

## Delivery sequence and acceptance gates

1. Reliable foundation: provider configuration/coverage, catalog adapters, additive schema/migration, offline cache/outbox, transactional/idempotent meal saving and export/restore. Verify account isolation and concurrent/offline writes on two signed-in devices.
2. Daily logger and recipes: editable multi-food draft, integrated ingredient creation, reusable meal templates, barcode lookup, dual recipe yield, prepared batches and immutable history. Usable on 320/390/768/1440px and keyboard; real phone review required.
3. Insights and manual strategy: day completeness, nutrient coverage/contributors, weight trend, manual/flexible program records and dated analytics. Before the guided engine is released, flexible allocation uses the user's chosen weekly budget; it does not claim a learned budget. Separate measured, estimated and missing values throughout.
4. Android health: compile/install companion, pair, grant permissions, synchronize/retry/revoke weight/steps/sleep and verify against the phone's records. Complete web ownership/duplicate/conflict tests.
5. Guided coaching: dedicated algorithm specification, baseline/backtest evidence, calibration/uncertainty states, explained weekly check-in and versioned accepted targets. No release based only on rendering a trend chart.
6. Assisted logging: validated barcode camera, reviewed label/description/photo suggestions with configured providers and clear uncertainty.

All stages are part of the target product; their order controls dependencies, not a reduction of scope. Do not describe a stage-1 logger as full MacroFactor parity.

Measurable interaction goals: repeat a saved meal within three taps excluding portion edits; add a second food without reopening the logger; log a weighed recipe from its card in three taps excluding numeric input; preserve every unsaved draft after refresh/offline interruption. Cached library/search should feel immediate; measure p95 response time and establish a tested phone baseline before publishing performance claims. Slow remote search remains cancellable and never blocks manual entry.

Per-stage verification includes domain tests, browser journeys, accessible names/focus, touch layouts, restore/migration fixtures, authenticated API tests and observable failure states. Required cloud/native/model evidence is reported pending when unavailable. Maintain setup, operation, rollback and release evidence alongside the change sheet.

## Decisions assumed for this proposal

- Full nutrition product within NOVA, rather than a separate site or cosmetic clone.
- Web logger plus Android companion; Android Health Connect is the user's confirmed source.
- Independent guided coaching with validation; no attempt to extract MacroFactor's private algorithm or catalog.
- Provider configuration/licensing and real-device checks are required deliverables, not inferred from local browser tests.
- All existing user data and non-nutrition personal workflows remain preserved.

## Primary sources checked 7 October 2026

- MacroFactor logging: https://help.macrofactorapp.com/en/articles/215-how-to-log-food-in-macrofactor
- Program styles: https://help.macrofactorapp.com/macro_program/program_styles/
- Recipes: https://help.macrofactorapp.com/en/articles/223-tips-for-creating-recipes-for-dishes-comprised-of-multiple-servings
- Exploding recipes: https://help.macrofactorapp.com/en/articles/3-explode-recipes
- Weight trend: https://help.macrofactorapp.com/dashboard/weight_trend
- Expenditure V3: https://macrofactor.com/expenditure-v3/
- Step modifiers: https://macrofactor.com/expenditure-modifiers/
- Nutrient coverage: https://help.macrofactorapp.com/en/articles/101-view-your-micronutrient-intake-and-more-detailed-information-about-your-macronutrient-intake
- Health Connect: https://developer.android.com/health-and-fitness/health-connect/get-started

## Implementation checkpoint — 7 October 2026

Meal drafts, rich recipes, manual/flexible programs, day reviews, nutrient insights and their backup support have been implemented. Android companion and pairing/import infrastructure are being verified. See the [implementation plan](../plans/2026-10-07-nutrition-workspace.md) and [rollout setup](../../NUTRITION_AND_REMINDER_SETUP.md) for verified evidence and pending release gates. The full target remains open: prepared batches/templates, provider-neutral catalog/offline cache and declared portions, guided coaching/check-ins, reviewed capture assistance and complete imported-record lifecycle are not delivered by this foundation.


## Final-pass checkpoint — 7 October 2026

Templates, prepared batches, declared portions, a bounded account-scoped offline catalog and imported-record lifecycle/source trends are now implemented and locally verified. The cache uses complete reviewed snapshots and retrieval aliases; it does not establish broad provider coverage. Cloud migrations and authenticated/device validation remain release gates. Guided coaching/check-ins, reviewed capture assistance, revision-aware meal storage/outbox and legacy cutover, broader catalog coverage and native background/change-token/signing requirements remain open. See the [final-pass plan](../plans/2026-10-07-nutrition-final-pass.md) and delivery setup for current evidence.
