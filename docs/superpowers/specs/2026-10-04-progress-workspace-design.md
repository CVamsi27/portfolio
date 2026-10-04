# Progress workspace design

The personal tracker needs enough information to answer what changed, how much was logged and what to do next. The previous Review offered small totals without trends and the section pages were isolated. This redesign retains all editable histories, owner-only study scheduling and optional modules.

## Structure

Today remains the action queue. Plan contains Tasks, Goals and Roadmap. Health contains Food, Exercise, Body, Water/fasting and Routine. Progress becomes a primary destination at /dashboard; /review keeps detailed reflection/history. More contains Motivation, Library, Sharing and Settings. Contextual section navigation appears consistently across these areas. Tracking pages include an overview of their own progress before detailed editors.

## Dashboard

7/30/90-day ranges ending on a chosen calendar date; previous/next period navigation. A prominent weight trend and nutrition timeline lead, then exercise, water/sleep, focus/study and task/goal/routine summaries. Each panel has one entry/edit action. Food includes macros and an expandable micronutrient table with coverage, recorded-day averages and optional saved targets. Weight includes saved target, latest measurement date and change between recorded points. Exercise shows logged days, completed exercises, sets and recorded duration rather than estimated calories burned.

Charts have explicit dates, units, gaps for unknown values and accessible text/data tables. A single measurement cannot imply a trend. Empty states lead to logging. Deleted entries, failed/malformed data, future/out-of-range records and incomplete sessions must not inflate totals. Nutrient totals are known subtotals; unlogged days are not zero-calorie days. Focus and study are separate to prevent double counting. Supplement completion never contributes guessed nutrients.

## Visual direction

Retain calm teal #176c78, ink #172b40, white #ffffff, canvas #f6f7f5, muted #526579, rule #dce3df with existing dark equivalents. Existing display face is restrained to titles; body sans handles controls and tabular numbers handle readings. Signature: a readable dated progress timeline with gaps, not decorative scores. Two-column desktop panels, one-column mobile, horizontal section tabs and a stable bottom dock. Information is grouped as overview, entry/action, then history; optional detail is disclosed.

## Boundaries and verification

No new schema, tracking defaults, medical targets or notification permissions. Existing stores and account-scoped sync remain authoritative. Cover aggregation and missing data with domain tests, range/date/persistence/navigation with browser tests and inspect populated/empty mobile and desktop screenshots. Production cloud and push configuration are separate gates.
