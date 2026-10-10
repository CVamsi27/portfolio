# Germany execution roadmap implementation

**Goal:** Publish the approved dated execution plan with study context, honest evidence and scored interview preparation.

**Architecture:** Private canonical Markdown under the Bible personal reports directory generates an authenticated account payload. The public application contains rendering and validation code only. Existing weekly IDs, historical study assignments and evidence remain stable. Study links contain only a date and task identifier, with a fixed personal return destination.

**Stack:** Next.js, TypeScript, React, Supabase, Node test runner, Playwright; Jekyll reading interface.

## Tasks

- [x] Extend `scripts/generate-germany-roadmap.mjs` and its behavioral tests. Parse all 60 weekdays, 24 assessments, seven round rubrics, 25 companies, campaign tables and dated post drafts. Reject incomplete dates, duplicate IDs and empty instructions. Hash all canonical inputs.
- [x] Add `src/lib/germany-execution.ts` with runtime validation, dated schedule assignments, safe contextual study URLs, append-only exam attempts, critical-failure and changed-prompt readiness rules. Test preservation, scoring and rejection cases before implementation.
- [x] Extend `src/lib/germany-roadmap.ts` and career execution state without resetting old payloads or records.
- [x] Add focused Today / This week / Exams / Companies / Guides views, safe code-aware Markdown rendering, evidence actions and exam recording. Map Today and Plan to dated work. Keep the 50-hour budget and recovery Sunday.
- [x] Add the study return link before outline early exits. Validate date/task context, preserve it for chapter/revision navigation and authentication, and test redirect rejection.
- [x] Activate the approved private companions and regenerate their private JSON. Dry-run the owner import, back up, apply with concurrency checks and verify exact readback.
- [x] Run unit tests, relevant browser flows, lint/build, private data exclusions and Bible verification. Inspect 320px and desktop views in both themes.
- [ ] Commit and push both repositories after gates pass. Verify deployed revisions, authenticated live behavior and retained history; record release evidence privately.

## Release constraints

Do not send applications, outreach, social posts or OSS submissions. No credentials or private planning payload enter the portfolio repository. Attempts remain historical when prompts change and no date automatically creates a pass. A failed assessment replaces a later practice block; it adds no hours. Actual employer instructions override mock preparation.

Local release gates passed: the final full browser suite, meaningful scoring/migration tests, lint/typecheck/build and Bible verification. Owner import applied one row with exact readback of all 17 owner rows and all 100 study days. Production completion is recorded separately in the canonical private release evidence.
