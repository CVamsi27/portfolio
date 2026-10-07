# Food and recipe repair; health integration investigation

Goal: repair the previously approved food/recipe workflow and improve provider reliability. Google health integration is a separate platform decision awaiting the user's source app/device.

Architecture: retain account-scoped timestamp merges, immutable meal snapshots and current nutrition record shapes. Reuse the food editor for a standalone saved ingredient; recipes use saved ingredients and deliberate portion review. No invented nutrient values, health permissions or credentials.

- [x] Reproduce silent missing-ingredient action, absent standalone ingredient creation, whole-batch default and newer USDA energy fields with failing browser/domain tests.
- [x] Add saved ingredient creation, explicit missing-selection errors, selected ingredient basis default, recipe Log action defaulting to one serving (gram recipes retain their declared weight basis).
- [x] Support USDA 1008/2048/2047 energy in priority order; ignore malformed nutrient rows; retain unknown nutrients and explicit zeros.
- [x] Show search failure feedback inside its panel and clear errors for each request. Check local storage failures retain drafts.
- [x] Verify affected browser journeys, provider tests, build/lint and persistence; document USDA configuration dependency.
- [x] Determine Google Health versus Android Health Connect from the user's actual source. Google Health new project access is currently closed; Health Connect requires an Android client. Do not expose a fake Connect action or claim live synchronization.

Observed production evidence: GET /api/nutrition/search?q=rice returned 503 with database-unavailable configuration message on 7 October 2026. No provider credentials were read or changed.

References: https://fdc.nal.usda.gov/Foundation_Foods_Documentation/ ; https://developers.google.com/health ; https://developer.android.com/health-and-fitness/health-connect/migration/fit

User confirmed Android Health Connect / Google Fit. Native sync design is in docs/superpowers/specs/2026-10-07-android-health-connect-design.md; it remains a separate unimplemented deliverable. The public Open Food Facts full-text search probe also returned 503, so no unverified fallback was added.
