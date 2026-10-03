# Owner timetable alignment

User instruction: align timetable with software-developer-bible only for cvamsik99@gmail.com.

Source: `../software-developer-bible/80-lanes-abroad-full-stack/personal/reports/100-day-job-roadmap.md`, updated October 3, 2026. Use four-hour weekdays, two-hour Saturdays, recovery Sundays, and the October 4 launch exception (90 minutes). Saturday times are example placements because the source specifies durations only. Preserve pre-October-3 dates, evidence, checklist flags and all other account data. This change aligns schedule blocks; it does not replace the chapter curriculum or start an eight-week plan automatically.

- [x] Test owner matching, durations, launch exception, recovery and immutable preservation.
- [x] Share owner schedule logic between Today and roadmap, using IST for owner active blocks.
- [x] Preview exactly one owner timetable row before applying, preserve a local backup, guard against concurrent changes and verify readback.
- [x] Verify production build, affected browser flows and lint.

No email/outreach or reminder settings are changed. Display overlays require the authenticated email; anonymous local mode retains existing schedules. The stored timetable row is account-scoped by user ID. UI code must be deployed separately to show updated schedule template text; no deployment was requested.

## Saved-account verification

The dedicated script resolved exactly the requested owner, previewed 97 changed dates of 100, and updated only `timetable_100_days` with readback verification. Backup: `/tmp/portfolio-timetable-before-1791027166849.json` (local, mode 0600). It preserves earlier dates and every non-schedule field; no career profile, reminders, tasks, or other users' rows were written. Saturday block placements are examples; the source defines their durations. The existing general seed script also uses the same owner-specific alignment.

Recheck: `node --env-file=.env --experimental-strip-types scripts/align-personal-timetable.ts` is read-only. `--apply` updates only the exact owner's existing timetable, backs up the previous value and refuses an outdated row version. It never creates a missing timetable. Never print environment credentials.

Verification: 10 unit tests passed; 30 roadmap/responsive browser checks passed, followed by 13 roadmap checks on the final build. Lint, TypeScript, production build and diff whitespace checks pass. Final read-only owner preview reports zero changed dates. Authenticated rendering is gated by the live auth email; browser tests use local mode, so live OAuth rendering was not exercised.

## Owner budget override — October 3

The user's subsequent instruction supersedes the earlier four-hour/two-hour/recovery budget: **10 focused hours each Monday–Friday and 4 focused hours on both Saturday and Sunday** (58 hours/week). It also supersedes the October 4 launch exception. Source-aligned activities remain, with the requested duration override recorded separately in the saved schedule metadata. Past dates before October 3 and existing checklist/evidence fields remain unchanged.

Weekdays: 08:30–10:30 study; 10:30–12:30 practical work; 12:30–14:00 applications/replies; 14:30–16:30 public proof/OSS; 16:30–17:30 coding/interview prep; 17:30–18:00 mock/story; 20:30–21:30 recall/follow-ups/planning. Weekends: 09:00–10:15 applications/review; 10:30–11:45 practical work/study; 14:30–15:15 coding; 15:30–16:00 mock/story; 16:00–16:15 recall/planning. Times are IST examples. Breaks and meal/family time are outside focused totals.

All 11 unit tests pass, including exact-account matching, weekday/weekend totals, block durations, non-overlap, protected meal/family windows and immutable progress preservation. No changes were made to the Bible repository's published plan; the user's requested budget is an explicit personal override.

The override was applied to the exact owner's saved timetable: 97 future/current dates updated; readback verified. Previous-value backup: `/tmp/portfolio-timetable-before-1791029339822.json` (mode 0600). A transient account-resolution failure was retried after connectivity verification; the final preview and apply succeeded. Final validation: 11 unit tests, 13 roadmap browser tests, lint, TypeScript, production build and `git diff --check` passed. UI code remains local pending deployment.

## Timetable usability enhancement

Use one component for Today, today's roadmap summary and the expanded day schedule. Show planned focus minutes only when work/break classification is explicit; legacy string schedules show total scheduled time. Expose full labels and outputs, current/next block, an accessible disclosure and non-completion elapsed labels. Update clock state on minute boundaries and tab focus/visibility return. Do not mutate schedule or evidence when time passes. Keep the owner-specific 10h/4h budget intact.

Timetable UI verification: six new/extended timetable checks plus existing roadmap and responsive suites passed (36 browser checks total); all 11 state/budget unit tests passed. Lint, TypeScript, production build and whitespace checks pass. This enhancement made no saved-account changes.
