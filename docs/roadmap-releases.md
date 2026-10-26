# Catalogue and owner roadmap releases

The Bible catalogue and the owner's dated execution plan have different jobs. `career:generate` refreshes canonical chapter titles, IDs, priority metadata, reading estimates and content digest. Version 2 catalogue groups are navigation only: they have no required work schedule or completion checklist. Browsing the whole catalogue does not establish skill readiness.

The compatible forward contract is `GermanyRoadmap.version = 2`, `GermanyExecution.version = 2` and `JobPlan.version = 3`. Existing version 1 roadmaps and version 1/2 assignment plans remain readable. Version 3 uses 100 Monday–Saturday study days, a 660-minute weekday cap, a 300-minute Saturday cap, and no Sunday assignments. A full six-day week contains exactly 3,600 focused minutes. Workstreams total 16/7/12/10/4/3/5/3 hours; an employer stage replaces a matching practice block.

Generate the generic catalogue first, then use the existing authoring command with private input/output paths:

```sh
pnpm career:generate
pnpm career:validate
pnpm career:forward:generate PRIVATE_BASELINE_JSON src/data/career-curriculum.json PRIVATE_OUTPUT_JSON PRIVATE_CALENDAR_MD --roles=PRIVATE_ROLE_QUEUE_JSON --matrix=PRIVATE_SKILL_MATRIX_JSON --campaign=PRIVATE_CAMPAIGN_MD --map=PRIVATE_ASSIGNMENT_MAP_JSON --presentation=PRIVATE_CAMPAIGN_PRESENTATION_JSON
```

The generator validates the source catalogue, chapter IDs, ordered prerequisite assignment IDs, exact time slots and capacity. Private role/claim data is loaded only by the explicit authoring CLI; Next.js never imports those files. The old `career:seed` command refuses catalogue version 2 because replacing an account with navigation groups would discard execution context.

The forward CLI resolves private inputs and output parents against the actual `~/repos/personal` directory, including symlinks. All output names must be distinct, new files; it checks payload, calendar and optional map destinations before writing any of them. Use fresh `.next` names for regeneration. Output writes are exclusive mode-0600 files, but the three local writes are not one filesystem transaction.

Each assignment ID includes the revision start, actual date, kind and start time. The latter distinguishes split outreach blocks. Evidence remains append-only under its original IDs. Reading, a timer, generated code and an agent-run check never verify the candidate's skill. Save evidence, inspect it, then perform the separate verification action.

The optional reviewed campaign presentation replaces active role cards, profile positioning, research note and unsent templates. It keeps the exact earlier values in campaignPresentationHistory and preserves all other profile fields and progress. Unknown fit scores render as pending review.

The forward merge retains the former roadmap in `roadmapHistory`, retains prior timetable days in `scheduleHistory`, and preserves every existing day field and all dates before the effective date. It extends missing dates rather than truncating the old timetable. Past dates select the retained roadmap, so its assignments retain their original meaning. Repeating the same merge is a no-op. Separate evidence, tasks, reminders and other account rows are untouched.

Release requires the exact owner to resolve uniquely. The importer reads all owner rows, requires existing career and timetable rows, then prepares only those two values:

```sh
pnpm career:forward:release --payload=PRIVATE_OUTPUT_JSON --preview=PRIVATE_NEW_PREVIEW_JSON
```

The preview is a new mode-0600 private file containing the source rows, exact proposed changes and summary. Review it alongside the payload before using `--apply`. Apply writes an exclusive private backup before any account update, performs a compare-and-swap against each row's original `updated_at`, and checks exact values for both changed rows and every untouched owner row. A second dry run must report no changed keys.

The two updates are **not one transaction**. A concurrent update or readback mismatch stops the release and reports already applied keys. Retain that backup and preview. Re-read current rows and prepare a targeted repair with fresh compare-and-swap versions; do not blindly restore all owner rows or overwrite concurrent work. A local build or generated payload does not demonstrate that a deployed client or live account was updated.

Run `pnpm test:career-curriculum`, `pnpm test:germany-roadmap`, type/lint/build checks and the affected browser tests. The forward browser suite checks Today → dated assignment → saved evidence → weekly plan, final-week rendering, Sunday recovery and retained prior evidence.

The orientation importer (`sync-career-plan.ts`) uses the same real-path check for private inputs, an exclusive private backup, per-row compare-and-swap and all-row readback. An unchanged orientation exits without a write or backup.

Today waits for hydration before selecting the device clock and calendar. Its server loading state matches the first browser paint; the mounted view then applies the user's timezone and preferences. A clock differing from the build date and the route-layout sweeps cover this boundary.
