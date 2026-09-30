# Bible-Synced Career Operating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and seed an evidence-based, 100-day career roadmap from 2026-09-30 through 2027-01-07 that maps every numbered study chapter in the private Software Developer Bible to a dated study assignment and supports safe, synced execution in the personal dashboard.

**Architecture:** The bible remains the curriculum source. A deterministic generator reads numbered markdown chapters from the sibling bible checkout and produces a checked-in curriculum snapshot consumed by portfolio UI and seed tooling. Supabase stores versioned curriculum and user execution evidence separately; one database RPC applies the planner-owned row set atomically for the verified owner. The roadmap UI renders generated plans and mutates only evidence state, while existing todo, auth, sync, and reminder primitives remain in use.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Supabase/Postgres, Node.js ESM scripts, Playwright E2E, the repository's existing local-first `useSyncedStorage` hook.

## Global Constraints

- Dates use Asia/Kolkata and cover exactly 2026-09-30 through 2027-01-07 inclusive.
- The administrator seed modifies only the exact owner email supplied privately through `CAREER_OWNER_EMAIL`; source, tests, generated data, and logs must not contain the personal email.
- Never print or persist Supabase service credentials, phone numbers, or family PII in logs or generated data.
- The private bible at `../software-developer-bible` is the curriculum source; `80-lanes-abroad-full-stack/personal/` remains the canonical home for personal job-search data.
- The application is not allowed to create or send job applications, outreach, OSS issues/PRs, or visa submissions on the user's behalf.
- A planned activity is not a completed outcome. Required evidence must exist before an item can be marked verified.
- Do not add experience, metrics, compliance claims, OSS outcomes, or skill proficiency to the CV unless existing source evidence supports it.
- Lightdash code contributions require prior maintainer agreement; Langfuse changes follow its current contribution guide.
- Browser reminders are in-app/foreground reminders. Do not claim background push until its delivery service is configured and tested.
- All data writes target the portfolio repository's existing `tracker_data` table with owner RLS, through a transaction that cannot leave a partial seed.
- Preserve unrelated workspace edits. Never commit or push in `career-ops`.

---

## Repository Map and Responsibilities

### `software-developer-bible`

- `80-lanes-abroad-full-stack/personal/reports/100-day-job-roadmap.md` — canonical detailed daily plan, phases, job-search cadence, weekly review, and source links.
- `80-lanes-abroad-full-stack/personal/reports/career-evidence-and-role-strategy-2026-09-30.md` — dated resume gap analysis, evidence-backed role lanes, interview proof backlog, and relocation/remote constraints.
- `80-lanes-abroad-full-stack/personal/README.md` — navigation into the roadmap and canonical job-search files.

### `portfolio`

- `scripts/generate-career-curriculum.mjs` — scans a supplied bible root and emits deterministic JSON plus a coverage manifest.
- `scripts/generate-career-curriculum.test.mjs` — isolated Node tests for inventory, date, URL, capacity, and schedule invariants.
- `src/data/career-curriculum.json` — generated, reviewable curriculum snapshot checked into this application repository.
- `src/lib/career-roadmap.ts` — runtime types, stable-ID helpers, date selection, evidence validation, reseed merge, schedule validation.
- `src/lib/career-roadmap.test.ts` — domain tests run with Node 22+'s built-in TypeScript stripping; no browser or Supabase dependency.
- `src/app/roadmap/page.tsx` — existing roadmap UI, updated to render curriculum snapshot and synced execution state.
- `src/components/trackers/RoadmapTodayCard.tsx` — hub's compact current block and safe evidence actions.
- `src/components/ReminderNudges.tsx` — due reminders, deep links, dismissal/deduplication, permission-aware browser notices.
- `src/lib/reminders.ts` — typed career reminder preferences and defaults.
- `src/app/settings/page.tsx` — reminder configuration and delivery capability state.
- `src/app/hub/page.tsx` — existing command center remains the daily entry point.
- `supabase/migrations/0006_career_roadmap_atomic_sync.sql` — narrowly scoped atomic upsert function with restricted execute permissions.
- `scripts/sync-roadmap.ts` — replace v2 hard-coded generation with validated snapshot import, explicit dry-run, one atomic RPC, post-write readback, and no Telegram side effect.
- `e2e/personal-roadmap.spec.ts` — user-visible roadmap, evidence, date, and role/link contracts.
- `e2e/helpers.ts` — seed new typed storage keys for isolated browser tests.
- `package.json` — generator, validation, focused test, and sync command scripts.

## Task 1: Lock the Bible Inventory and Schedule Contract

**Files:**
- Modify: `docs/superpowers/specs/2026-09-30-bible-synced-career-operating-system-design.md`
- Create: `scripts/generate-career-curriculum.mjs`
- Create: `scripts/generate-career-curriculum.test.mjs`
- Create: `src/data/career-curriculum.json`
- Modify: `package.json`

**Interfaces:**
- Generator exports `buildCurriculum({ bibleRoot, startDate, dayCount, studyBaseUrl })` and `validateCurriculum(curriculum)` for import by Node tests.
- `buildCurriculum` returns `{ version, sourceDigest, startDate, endDate, chapterCount, totalStudyMinutes, days }`.
- Each chapter is `{ id, path, title, studyUrl, stack, estimatedMinutes }`.
- Each day is `{ id, day, date, phase, schedule, chapters, mission, practiceTask, interviewQuestion, ossTrack, roleTrack, checklist, notifications }`.
- Checklist items are `{ id, text, evidenceType, acceptanceCriteria, estimatedMinutes }` and begin uncompleted in generated data.
- The generator takes `--bible-root`, `--start-date`, `--days`, `--study-base-url`, and `--output`; an absent bible root fails before touching output.

- [ ] **Step 1: Add inventory and schedule contract tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { buildCurriculum, validateCurriculum } from "./generate-career-curriculum.mjs";

const fixtureBible = mkdtempSync(join(tmpdir(), "career-curriculum-"));
const fixtureExpectedChapterPaths = [
  "10-frontend/10.1-javascript/10.1.1.01-execution-context.md",
  "20-backend/20.1-node.js/20.1.1.01-runtime.md",
];
for (const [path, title] of [
  [fixtureExpectedChapterPaths[0], "Execution Context"],
  [fixtureExpectedChapterPaths[1], "Node Runtime"],
]) {
  const file = join(fixtureBible, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `# ${title}\n\n[![Read time](badge/read--time-15_min)](#)\n`);
}
mkdirSync(join(fixtureBible, "80-lanes-abroad-full-stack", "personal"), { recursive: true });
writeFileSync(join(fixtureBible, "80-lanes-abroad-full-stack", "personal", "cv.md"), "# Private CV\n");
writeFileSync(join(fixtureBible, "10-frontend", "INDEX.md"), "# Navigation only\n");

test("assigns every public numbered chapter exactly once across 100 consecutive dates", () => {
  const plan = buildCurriculum({ bibleRoot: fixtureBible, startDate: "2026-09-30", dayCount: 100, studyBaseUrl: "https://study.example.test" });
  const chapters = plan.days.flatMap(day => day.chapters.map(chapter => chapter.path));
  assert.equal(plan.days.length, 100);
  assert.equal(plan.days[0].date, "2026-09-30");
  assert.equal(plan.days.at(-1).date, "2027-01-07");
  assert.equal(new Set(chapters).size, chapters.length);
  assert.deepEqual([...chapters].sort(), fixtureExpectedChapterPaths.sort());
});

test("excludes INDEX and private personal documents from the study inventory", () => {
  const plan = buildCurriculum({ bibleRoot: fixtureBible, startDate: "2026-09-30", dayCount: 100, studyBaseUrl: "https://study.example.test" });
  assert.equal(plan.days.flatMap(day => day.chapters).some(chapter => chapter.path.endsWith("INDEX.md") || chapter.path.includes("/personal/")), false);
});

test("rejects a day whose study work exceeds its two-hour budget", () => {
  const plan = buildCurriculum({ bibleRoot: fixtureBible, startDate: "2026-09-30", dayCount: 100, studyBaseUrl: "https://study.example.test" });
  assert.throws(() => validateCurriculum({ ...plan, days: plan.days.map((day, index) => index === 0 ? { ...day, chapters: day.chapters.map(chapter => ({ ...chapter, estimatedMinutes: 121 })) } : day) }), /study budget/i);
});
```

- [ ] **Step 2: Run generator tests and confirm they fail because generator exports do not exist**

Run: `node --test scripts/generate-career-curriculum.test.mjs`

Expected: module import failure naming `buildCurriculum` and `validateCurriculum`.

- [ ] **Step 3: Implement deterministic inventory, stable grouping, and validation**

The generator must enumerate numbered markdown files from public study roots `10-frontend` through `70-interview-toolkit`, exclude all `personal/`, `projects/`, `docs/`, and generated folders, and use the filename's numeric study prefix for deterministic ordering. `INDEX.md` and non-numbered Markdown files are not chapter assignments. Each file title comes from the first H1; absence of an H1 fails validation. Stable chapter IDs equal their repository-relative path. Estimated minutes parse the existing `Read time` badge when present and otherwise use 15 minutes. Assign whole chapters to contiguous dated groups in numeric curriculum order, balancing total minutes across the 100 dates; fail if any day exceeds 120 study minutes. The current scan found 556 chapters and 10,606 reading minutes (176.8 hours); recount at generation time and never hard-code these values. A broader 765-file markdown count includes files outside the study inventory.

Set the non-study schedule to: 07:00–08:30 exercise/freshen; 08:30–10:30 study; 10:30–12:30 build/practice; 12:30–14:00 role research/application prep; 14:00–14:30 lunch; 14:30–16:30 OSS/portfolio; 16:30–17:30 interview prep; 17:30–18:00 mock; 18:00–20:00 family; 20:00–20:30 dinner; 20:30–21:30 follow-up/review; 21:30–22:00 wind-down/sleep at 22:00. The generator validates 600 total work minutes, 120 family minutes, the meal anchors, and the 07:00/22:00 boundaries.

Every day receives a chapter recall task, one related implementation or debugging deliverable, a stack-specific interview drill, a sourced job-search action, a proof-building action, and a nightly closeout. 30 September's date record is tagged `activation`; its completed-time calculations use the user's local time and do not mark elapsed pre-seed blocks overdue.

- [ ] **Step 4: Re-run generator tests and confirm they pass**

Run: `node --test scripts/generate-career-curriculum.test.mjs`

Expected: all inventory, privacy-exclusion, date, and load tests pass.

- [ ] **Step 5: Generate and inspect the checked-in curriculum snapshot**

Run: `node scripts/generate-career-curriculum.mjs --bible-root ../software-developer-bible --start-date 2026-09-30 --days 100 --study-base-url https://study.buildora.work --output src/data/career-curriculum.json`

Expected: JSON reports a chapter count equal to the actual included files, chapter count equals the sum assigned to all days, all estimated reading minutes total 10,606 for the current source tree, every study URL is a `study.buildora.work` URL built from the encoded source path, and no private source path appears.

- [ ] **Step 6: Add package scripts and commit the generator deliverable**

Add `career:generate` and `career:validate` scripts. Run `git diff --check`, then commit only the generator, its tests, generated snapshot, and package-script changes as `feat: generate bible-synced career curriculum`.

## Task 2: Model Evidence and Safe Reseeding

**Files:**
- Create: `src/lib/career-roadmap.ts`
- Create: `src/lib/career-roadmap.test.ts`
- Modify: `scripts/sync-roadmap.ts`
- Modify: `package.json`

**Interfaces:**
- `CareerExecutionState` is `{ version: 1; evidenceByItemId: Record<string, { evidence: string; reflection?: string; completedAt: string; verifiedAt?: string; carriedForwardTo?: string }>; archivedItems: Array<{ id: string; archivedAt: string; reason: string }> }`.
- `mergeExecutionState(previous, nextChecklistIds)` returns preserved active evidence and archives removed planner item IDs.
- `canCompleteEvidence(item, evidence)` validates non-empty URL, commit hash/URL, recording URL, note content, application reference, screenshot URL, or explicit manual confirmation according to `evidenceType`.
- `buildPlannerTodos(curriculum, existingTodos)` updates only IDs prefixed `career-plan:` and preserves all other todo rows and planner completion states.
- `validateSeedPayload(payload, ownerEmail)` refuses wrong owner, missing curriculum version, duplicate day/checklist IDs, invalid dates, invalid links, or missing evidence criteria.

- [ ] **Step 1: Add failing tests for stable evidence merge and user-todo preservation**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPlannerTodos, canCompleteEvidence, mergeExecutionState } from "./career-roadmap.ts";

describe("career roadmap state", () => {
  it("preserves evidence on matching IDs and archives removed items", () => {
    const previous = { version: 1 as const, evidenceByItemId: { "career:2026-09-30:study": { evidence: "notes.md", completedAt: "2026-09-30T10:00:00+05:30" } }, archivedItems: [] };
    const next = mergeExecutionState(previous, ["career:2026-09-30:study", "career:2026-10-01:study"]);
    assert.equal(next.evidenceByItemId["career:2026-09-30:study"].evidence, "notes.md");
    assert.equal(next.evidenceByItemId["career:2026-09-30:study"].completedAt, "2026-09-30T10:00:00+05:30");
  });

  it("preserves non-roadmap todos and completed planner todos on reseed", () => {
    const merged = buildPlannerTodos({ days: [{ day: 1, date: "2026-09-30", title: "Day 1" }] }, [
      { id: "personal-1", text: "Call family", done: false },
      { id: "career-plan:2026-09-30", text: "Old Day 1", done: true },
    ]);
    assert.deepEqual(merged, [
      { id: "personal-1", text: "Call family", done: false },
      { id: "career-plan:2026-09-30", text: "[Day 1] Day 1", done: true, date: "2026-09-30", priority: "P1", tag: "Goal", createdAt: Date.parse("2026-09-30T12:00:00.000Z") },
    ]);
  });

  it("requires usable evidence before completion", () => {
    assert.equal(canCompleteEvidence({ evidenceType: "commit" }, ""), false);
    assert.equal(canCompleteEvidence({ evidenceType: "commit" }, "https://github.com/CVamsi27/demo/commit/0123456789abcdef0123456789abcdef01234567"), true);
  });
});
```

- [ ] **Step 2: Run focused domain tests and confirm expected missing-module failure**

Run: `node --experimental-strip-types --test src/lib/career-roadmap.test.ts`

Expected: all domain-contract tests pass after the implementation step.

- [ ] **Step 3: Implement validators, merge helpers, and seed payload construction**

Use deterministic IDs (`career:<ISO date>:<short action>`), UTC ISO timestamps for audit events, and local calendar dates only for schedule selection. Reject evidence strings longer than 2,000 characters. HTTP(S) URLs must parse successfully. Do not accept a blank checkbox click as evidence. Preserve planner todo `done` only when the stable item ID is unchanged.

- [ ] **Step 4: Refactor sync script to snapshot import and dry-run by default**

Remove all hard-coded `TOPICS`, legacy role status guesses, Telegram delivery, and requests that can make external sends. Import `src/data/career-curriculum.json`; require explicit `--apply` before writes; default to `--dry-run`; read `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from environment without echoing them. Resolve the exact lower-cased owner email through paginated admin user lookup; fail if the matching email is absent or ambiguous. Read only that user's `timetable_100_days`, `career_command_center`, `career_execution_state`, `reminders`, and `todos` rows. Construct all new values in memory, validate them completely, print a redacted change summary, and apply with the RPC added in Task 3. After the RPC, read back the same keys and compare curriculum version, date count, IDs, and merged todo count before reporting success.

- [ ] **Step 5: Re-run domain tests and typecheck the seed module**

Run: `node --experimental-strip-types --test src/lib/career-roadmap.test.ts`

Expected: evidence validation, archive behavior, todo preservation, and owner mismatch cases pass.

- [ ] **Step 6: Commit the state and reseed-safety deliverable**

Run focused lint on changed TypeScript and `git diff --check`; commit the domain helpers, tests, sync script, and package command as `feat: preserve career roadmap evidence on reseed`.

## Task 3: Make Owner-Scoped Database Writes Atomic

**Files:**
- Create: `supabase/migrations/0006_career_roadmap_atomic_sync.sql`
- Modify: `scripts/sync-roadmap.ts`
- Modify: `README.md`

**Interfaces:**
- SQL function `public.sync_career_roadmap(p_user_id uuid, p_rows jsonb) returns integer` upserts only the allowed planner keys and returns the number of applied rows.
- Allowed keys are `timetable_100_days`, `career_command_center`, `career_execution_state`, `todos`, and `reminders`.
- Function rejects null user IDs, non-array payloads, more than five keys, duplicate keys, and any key outside the allowlist.

- [ ] **Step 1: Add the atomicity and allowlist migration**

Verify in migration review that the function is `SECURITY INVOKER`, fixes `search_path`, upserts each JSON row inside one function call/transaction, and grants execute only to `service_role`. There must be no public or authenticated execute grant because the caller supplies a user ID.

Use the following function body, validating the complete key set before beginning the upsert loop:

```sql
create or replace function public.sync_career_roadmap(p_user_id uuid, p_rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  row_value jsonb;
  applied integer := 0;
begin
  if p_user_id is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'invalid career roadmap sync payload';
  end if;
  if jsonb_array_length(p_rows) > 5 then
    raise exception 'too many career roadmap rows';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_rows) as rows(value)
    group by rows.value ->> 'key'
    having count(*) > 1
  ) then
    raise exception 'duplicate career roadmap key';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_rows) as rows(value)
    where rows.value ->> 'user_id' is distinct from p_user_id::text
       or rows.value ->> 'key' is null
       or rows.value ->> 'key' not in (
         'timetable_100_days', 'career_command_center',
         'career_execution_state', 'todos', 'reminders'
       )
       or not (rows.value ? 'value')
  ) then
    raise exception 'invalid career roadmap row';
  end if;
  for row_value in select value from jsonb_array_elements(p_rows)
  loop
    insert into public.tracker_data (user_id, key, value, updated_at)
    values (p_user_id, row_value ->> 'key', row_value -> 'value', now())
    on conflict (user_id, key) do update
      set value = excluded.value, updated_at = excluded.updated_at;
    applied := applied + 1;
  end loop;
  return applied;
end;
$$;

revoke all on function public.sync_career_roadmap(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.sync_career_roadmap(uuid, jsonb) to service_role;
```

PostgreSQL function execution is one transaction, so any validation or constraint error rolls the entire set back.

- [ ] **Step 2: Review migration permissions and validation order**

Confirm `SECURITY INVOKER`, an empty `search_path`, schema-qualified table access, the full payload validation before the loop, and execute grants only to `service_role`. Add `drop function if exists` only if the signature changes; do not weaken existing grants during replacement.

- [ ] **Step 3: Add an adversarial rollback test and execute it when local Supabase is available**

Run a valid five-row call and read back all five. Then submit a payload with four valid rows and one disallowed key, assert the RPC fails, and confirm none of the four valid rows changed. If no local Supabase database is configured, record this gate as blocked and require the same check in the deployed manual verification.

- [ ] **Step 4: Wire the seed script to the RPC and preserve reminder settings**

Build the candidate rows only after all current values have been read and merged. Keep existing reminder values and user permission state; append six career time slots with enabled false by default: `07:00`, `10:25`, `12:25`, `17:25`, `20:30`, and `21:30`. Do not overwrite unrelated reminder keys. One RPC applies all rows.

- [ ] **Step 5: Document migration and secret-handling procedure**

Update README with migration order, safe dry-run/apply commands, owner verification, and a readback checklist. Commands must accept credentials only from environment (never CLI arguments). Note that the migration must be applied before `--apply` can succeed.

- [ ] **Step 6: Commit the database migration and seed integration**

Run `git diff --check`; commit only the migration, script and README changes as `feat: sync career roadmap rows atomically`.

## Task 4: Update the Roadmap and Hub to Capture Verified Work

**Files:**
- Modify: `src/app/roadmap/page.tsx`
- Modify: `src/components/trackers/RoadmapTodayCard.tsx`
- Create: `src/components/trackers/CareerEvidenceDialog.tsx`
- Modify: `src/components/ReminderNudges.tsx`
- Modify: `src/lib/reminders.ts`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/hub/page.tsx`
- Modify: `e2e/helpers.ts`
- Modify: `e2e/personal-roadmap.spec.ts`

**Interfaces:**
- `CareerEvidenceDialog` accepts `{ item, existingEvidence, onSave, onCancel }`; it shows the criterion and required evidence field and emits validated evidence only.
- `RoadmapTodayCard` reads the current date from the Asia/Kolkata date helper, displays the active time block and first unverified task, and offers direct study/action links.
- `ReminderPreferences` adds `career: Record<CareerReminderKey, ReminderSlot>` and retains the current three health slots without changing their persisted keys.
- Every roadmap action uses `career_execution_state`; generated snapshot items are immutable from the UI.

- [ ] **Step 1: Add browser contract tests for verification and reminders**

```ts
test("requires evidence before a roadmap checklist item becomes verified", async ({ page }) => {
  await seed(page, { "vk:timetable_100_days": fixtureTimetable, "vk:career_execution_state": emptyCareerState });
  await page.goto("/roadmap");
  await page.getByRole("button", { name: /complete.*study notes/i }).click();
  await expect(page.getByRole("dialog", { name: /verify task/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /save evidence/i })).toBeDisabled();
  await page.getByLabel(/evidence/i).fill("https://study.buildora.work/10-frontend/10.1-javascript/01-execution-and-scope/10.1.1.01-execution-context.md");
  await page.getByRole("button", { name: /save evidence/i }).click();
  await expect(page.getByText(/verified/i)).toBeVisible();
});

test("shows due career reminder in the foreground and lets the user dismiss it", async ({ page }) => {
  await seed(page, { "vk:reminders": dueCareerReminderFixture });
  await page.goto("/hub");
  await expect(page.getByRole("status")).toContainText(/study block/i);
  await page.getByRole("button", { name: /dismiss reminder/i }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
});
```

- [ ] **Step 2: Run the two focused E2E tests and verify they fail on the current UI**

Run: `pnpm exec playwright test e2e/personal-roadmap.spec.ts --grep "requires evidence|due career reminder"`

Expected: tests fail because the dialog and career reminder are absent. Build in local mode first using the existing `pnpm run pretest:e2e` command if the checked-in build has production Supabase settings.

- [ ] **Step 3: Implement evidence dialog and final verification display**

Replace direct checklist toggles in roadmap and hub with a dialog. `manual-confirmation` displays the acceptance criterion and a required explicit confirmation checkbox; URL-like evidence types require an HTTP(S) URL; notes require at least 40 characters; application evidence requires a company plus job URL or saved tracker ID; commit evidence requires a GitHub commit URL or a 40-character hex hash. Save updates `career_execution_state` with a completion timestamp. A separate “Verify result” action stamps `verifiedAt` after rendering the supplied evidence link/text. Reopening allows editing/correcting evidence; it never silently deletes history.

- [ ] **Step 4: Render a useful current-day command card and full dated chapter coverage**

Update the top of `/roadmap` to show date in IST, current/next block, today's assigned chapters and exact links, expected output, evidence requirement, and a carry-forward control for overdue items. Use `Intl.DateTimeFormat` with `Asia/Kolkata`; do not derive local schedule time from UTC host timezone. Group all 100 dates by phase; support search across title, chapter title/path, phase, and action type. Show total chapter count from the snapshot. The first activation day is not treated as a missed 07:00 start if seeded later on 30 September.

- [ ] **Step 5: Add opt-in notifications and correct settings copy**

Add six career slots to Settings, default off. `ReminderNudges` checks exact minute in IST, deduplicates by `{date, reminderKey}` in local storage, shows the in-app reminder while the app is open, and requests Notification permission only from the explicit settings button. If permission is denied or unsupported, retain in-app reminders and show accurate status. The morning motivational browser notification must not request permission on page mount. Show “background alerts not configured” as a capability statement, not an error.

- [ ] **Step 6: Add E2E cases for timezone/date, carry-forward, reload persistence, and mobile width**

Use a fixed injected clock for the 2026-09-30 activation case and verify no pre-seed blocks display as overdue. Verify a missed checklist item can be carried to the next date without changing the original generated curriculum. Reload after evidence save and assert evidence remains. At 320, 390, and 430 pixels assert `document.documentElement.scrollWidth <= viewport width`.

- [ ] **Step 7: Run focused tests, typecheck, lint, and commit UI work**

Run focused roadmap E2E, relevant unit tests, `pnpm lint`, and `pnpm build` under local mode. Commit the UI, reminder, helper, and test changes as `feat: add evidence-driven career roadmap controls`.

## Task 5: Replace Stale Career Content with Source-Checked Guidance

**Files:**
- Modify: `software-developer-bible/80-lanes-abroad-full-stack/personal/reports/100-day-job-roadmap.md`
- Create: `software-developer-bible/80-lanes-abroad-full-stack/personal/reports/career-evidence-and-role-strategy-2026-09-30.md`
- Modify: `software-developer-bible/80-lanes-abroad-full-stack/personal/README.md`
- Modify: `portfolio/src/app/roadmap/page.tsx`
- Modify: `portfolio/scripts/sync-roadmap.ts`

**Interfaces:**
- Career snapshot schema is `{ version, sourceCheckedAt, resumeEvidence, targetRoleLanes, targetCompanies, weeklyTargets, germanyRoute, interviewResources, ossProtocols }`.
- Each target opportunity has `{ company, role, geography, workEligibility, sourceUrl, sourceCheckedAt, fitScore, evidenceMatches, gaps, nextAction, status }`.
- Application status is one of `research`, `verified_open`, `drafting`, `applied`, `screening`, `interviewing`, `offer`, `closed`, or `stale`.

- [ ] **Step 1: Draft evidence-backed resume mapping from canonical sources**

Map only the current `cv.md`, the 2026-09-12 ATS audit, and dated interview reports. Include strengths: founding-engineer ownership of Docita; documented production TS/React/NestJS/Postgres stack; multi-tenant authorization/audit; MAQ's sourced performance/delivery/mentoring metrics; Cognizant Spring Boot fundamentals. Explicit gaps: Next.js App Router production proof, Kubernetes/Terraform hands-on proof, public OSS review trail, technical writing samples, and German level. For every proposed resume phrase, cite its source file and section. Recheck all inconsistent claims (such as clinic counts, performance percentages, years, GDPR/DSGVO, and “production”) against the latest canonical CV; mark unresolved contradictions for human review instead of copying the more impressive value.

- [ ] **Step 2: Research current role families and interview practice resources**

Browse employer career pages and role boards on implementation date; store source-check date and direct job URL per opening. Do not infer that a careers homepage means a specific job is open. Exclude unverified salary bands. For remote roles, record whether the listing explicitly accepts India or confirms an EOR. For Germany, label Blue Card as candidate-applied after a qualifying offer, and link to official Make it in Germany guidance. Confirm official threshold text and eligibility for the degree/IT-professional pathway before writing numbers.

Research Micro1 mock practice from its official product page, and at least one genuinely free self-practice alternative (recorded self-mock, Pramp/interviewing.io availability checked, or structured peer mock). Label price/free tier with date and avoid claiming a service is free without official evidence.

- [ ] **Step 3: Correct OSS contribution tracks with current maintainer policy**

For Langfuse, link its current `CONTRIBUTING.md`, repository issues, local setup, and required tests; state that proposed significant work should be discussed first and a PR is not guaranteed to be accepted. For Lightdash, record the current policy that code contributions require prior maintainer approval/trusted status; lead with issue context, feature feedback, docs discussion, and community participation. Do not use misleading “good first issue” links when the project does not accept unsolicited PRs.

- [ ] **Step 4: Replace the daily plan with phase goals, dates, tasks, and real completion criteria**

The 100-day canonical doc must include the user's full day schedule, ten work hours, wake/sleep/meals/family anchors, day-1 activation, 100-day phase milestones, daily study/build/job-search/OSS/interview/outreach actions, weekly scorecard, recovery protocol, application quality rubric, interview call override, and end-of-day final verification checklist. Calibrate outreach to quality: source-check a role, tailor evidence, record application only after actual submission, follow up once after a context-appropriate interval, and spend remaining time on warm conversations/proof work. Include concrete deliverables and measurable weekly targets, but avoid promising a job or calling the schedule a senior-level guarantee.

- [ ] **Step 5: Add a stack study-link cross-check report**

Use the generated curriculum manifest to produce counts by top-level stack and day, compare to the current 556 observed numbered learning chapters and 10,606 reading minutes, ensure every included path links to a matching private bible file, and list exclusions with reason (`INDEX`, personal, project, docs, or non-numbered reference). Include that report in the roadmap source doc or generated manifest. Update the personal README's roadmap pointers only after the document exists.

- [ ] **Step 6: Run canonical private-repo gates and commit only in the bible repo**

Run:

```bash
bash 80-lanes-abroad-full-stack/personal/doctor.sh
python3 scripts/check_counts.py --write
bash scripts/verify.sh
```

Review all restamped count changes. Stage only the intended personal files and any required mechanically refreshed count metadata; commit in `software-developer-bible` as `docs(personal): build dated evidence-led job roadmap`. Never commit these changes in `career-ops`.

## Task 6: Verify, Seed, and Hand Off the Live Experience

**Files:**
- Modify as needed: `docs/superpowers/specs/2026-09-30-bible-synced-career-operating-system-design.md`
- Modify as needed: `README.md`
- Modify as needed: `scripts/sync-roadmap.ts`
- Modify as needed: `e2e/personal-roadmap.spec.ts`

**Interfaces:**
- `scripts/sync-roadmap.ts --dry-run` never mutates any row and prints the owner email, version, date range, chapter count, row keys, and per-key row counts only.
- `scripts/sync-roadmap.ts --apply` performs one atomic RPC and then verifies its readback.
- Completion report records commit SHAs, actual test output summaries, seed timestamp, and exact database keys updated; no credentials or secret-bearing environment values are copied into logs/documents.

- [ ] **Step 1: Run generator, domain, lint, build, and full local-mode E2E gates**

Run `pnpm career:generate`, `pnpm career:validate`, the domain test scripts, focused roadmap E2E, `pnpm lint`, `pnpm build`, and `pnpm test:e2e`. If any existing tests fail, capture their exact failure and determine whether it predates this work before changing unrelated code.

- [ ] **Step 2: Run personal-bible validation gates**

Run `doctor.sh`, `python3 scripts/check_counts.py`, `python3 scripts/check_structure.py`, `python3 scripts/check_links.py`, `python3 scripts/check_freshness.py`, and `bash scripts/verify.sh`. Resolve failures within the touched docs and record unrelated pre-existing failures distinctly.

- [ ] **Step 3: Validate local migration and dry-run seed**

Apply migration `0006` to a local Supabase instance if configured. Run sync without `--apply`; confirm it resolves exactly one owner and reports only the five allowed row keys. Verify before/after snapshots of existing non-planner todos, planner evidence, and reminder preferences are byte-equivalent in dry-run mode.

- [ ] **Step 4: Apply the owner seed only when server credentials and migration are available**

Run with environment-provided `SUPABASE_URL` and `SUPABASE_SECRET_KEY` and explicit `--apply`. The process must stop without a write when credentials, migration, owner account, or readback validation are missing. Confirm one atomic RPC upsert and readback for the exact owner.

- [ ] **Step 5: Perform signed-in manual acceptance on the actual host when available**

Sign in with the configured owner account; check the current date, first assigned chapter link, evidence dialog, save/reload persistence, role source date, reminder opt-in, permission denied path, and sync badge. Verify timetable, execution state, career snapshot, todos, and reminders in that same account. Do not claim production completion based only on a local build.

- [ ] **Step 6: Commit verification notes and hand off**

Write exact successful, blocked, and unverified gates to `80-lanes-abroad-full-stack/personal/reports/100-day-job-roadmap.md` or a concise dated status note. Run `git diff --check` in each affected repository and ensure no credentials, generated PII, or unrelated changes are staged. Commit each repo separately; never push or commit in `career-ops`.

## Plan Coverage and Self-Review

| Approved design requirement | Plan task |
| --- | --- |
| All study chapters represented and dated | Task 1 |
| Fixed full-day schedule and 100-day dates | Tasks 1 and 5 |
| Individual tasks with completion evidence and final verification | Tasks 2 and 4 |
| Personal account-scoped database sync with progress preservation | Tasks 2 and 3 |
| Notifications and accurate delivery capabilities | Task 4 |
| Resume analysis and specific relocation/remote role lanes | Task 5 |
| Job-search, OSS, mock-interview, and source-verified links | Tasks 1, 4, and 5 |
| Unit, E2E, DB, documentation, and acceptance checks | Task 6 |

No incomplete implementation placeholders remain. All task dependencies are ordered: generator and contract → state merge → atomic DB sync → UI → canonical career content → live acceptance. The total implementation spans two private repositories but each commit remains repo-local. If the live owner credentials or production access are unavailable, local verification remains complete while database write and signed-in host acceptance are explicitly reported as blocked, not passed.
