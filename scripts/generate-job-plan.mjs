/** Explicit private authoring CLI. Never contacts an account or imports personal content into Next. */
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  isJobPlan,
  studyDates,
  studyDaySlots,
  studyAssignmentId,
  STUDY_PLAN_START,
  STUDY_PLAN_END,
} from "../src/lib/job-plan.ts";
import { isGermanyRoadmap } from "../src/lib/germany-roadmap.ts";
import {
  assertPrivateWorkspacePath,
  assertFreshPrivateOutputPath,
} from "./private-workspace.ts";
const digest = (s) => createHash("sha256").update(s).digest("hex");
const plain = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`]/g, "")
    .trim();
const names = {
  study: "Study and retrieval",
  project: "Build and verify",
  applications: "Applications and replies",
  oss: "OSS contribution",
  network: "Networking and technical writing",
  coding: "Coding interview",
  speaking: "Spoken project story",
  assessment: "Checkpoint and gap repair",
  german: "German practice",
  review: "Evidence and next action",
  funnel: "Application funnel",
  mock: "Mock interview and scoring",
  documents: "Documents and relocation",
  proof: "Package project proof",
  planning: "Plan next week",
};
const workflows = {
  study: [
    "Recall the prerequisite without notes for 15 minutes.",
    "Read the linked sections selectively for 40 minutes.",
    "Trace the assigned behavior without the source for 25 minutes.",
    "Check the source and correct one misconception for 10 minutes.",
  ],
  project: [
    "Choose the smallest observable boundary and expected failure for 10 minutes.",
    "Implement or reproduce the specific slice for 90 minutes using synthetic data.",
    "Run meaningful checks for 35 minutes; confirm a regression test detects the missing behavior.",
    "Save revision, exact commands, actual results and limitations for 15 minutes.",
  ],
  applications: [
    "Check actual replies and due actions for 10 minutes; inspect current role constraints for 20 minutes.",
    "Tailor truthful evidence to the suitable role for 30 minutes.",
    "Review the final materials and destination for 20 minutes; submit only when you choose to.",
    "Record prepared/submitted status, actual confirmation and next action for 10 minutes.",
  ],
  oss: [
    "Spend 15 minutes reading current contribution rules, AI policy and overlapping issues/PRs.",
    "Spend 75 minutes on the assigned reproduction, regression test, focused fix or actual review response.",
    "Spend 30 minutes on required checks and your own explanation; distinguish ready, submitted and merged.",
  ],
  network: [
    "Research the relevant person/team and actual engineering context for 30 minutes.",
    "Develop the specific question, technical artifact or post draft for 60 minutes.",
    "Check evidence, privacy and your own wording for 30 minutes; keep it a draft until you choose to send.",
  ],
  coding: [
    "Clarify inputs, outputs, invariants and boundary behavior for 10 minutes.",
    "Attempt the assigned problem without assistance for 50 minutes.",
    "Run boundary cases for 20 minutes; explain complexity and one tradeoff for 10 minutes.",
  ],
  speaking: [
    "Record the assigned answer for 10 minutes.",
    "Listen and score specificity, personal contribution and unsupported claims for 10 minutes.",
    "Record an improved answer for 10 minutes and name the remaining gap.",
  ],
  assessment: [
    "Use the existing dated prompt and permitted tools; complete the 90-minute assessment/scoring block.",
    "Use the remaining 30 minutes for the single highest-value repair.",
    "Keep attempts, scores and critical failures honest; do not add a separate coding or speaking task.",
  ],
  german: [
    "Retrieve the previous lesson for 15 minutes.",
    "Listen/study using the linked material for 20 minutes.",
    "Speak for 15 minutes; write and correct for 10 minutes.",
  ],
  review: [
    "Retrieve one earlier mechanism without notes for 15 minutes.",
    "Save actual evidence and the observed gap for 10 minutes.",
    "Choose tomorrow’s first action for 5 minutes; carry at most one priority by replacing another block.",
  ],
  funnel: [
    "Review actual applications, replies and due follow-ups for 30 minutes.",
    "Inspect suitable current roles and choose next actions for 30 minutes; do not infer rejection from silence.",
  ],
  mock: [
    "Run the dated changed-prompt assessment using its existing tool/time rules.",
    "Score observed behavior, critical failures and the one highest-value repair within the 90-minute block.",
  ],
  documents: [
    "Open the official source and answer the assigned document/relocation question.",
    "Save the source date, observed requirement, unresolved question and next document action within 60 minutes.",
  ],
  proof: [
    "Use actual synthetic evidence and a reproducible setup; follow the assigned behavioral replacement in full-loop weeks.",
    "Package checks, limitations and your own contribution within 60 minutes.",
  ],
  planning: [
    "Review actual stages, evidence and failed-round repairs for 15 minutes.",
    "Choose replacement blocks and next scope for 15 minutes; preserve Sunday recovery.",
  ],
};
// These two existing exam loops use the later Saturday blocks for scoring.
const fullLoopWorkflows = {
  mock: [
    "Use 10:15–11:15 for the dated R3 design form and 11:15–11:45 for its R5 take-home defense, following the existing rubric and tool rules.",
    "Preserve both attempts for scoring during 15:30–16:00; do not shorten either round to score inside this block.",
  ],
  proof: [
    "Use 14:30–15:15 for the dated R6 behavioral form instead of packaging project proof.",
    "Use 15:15–15:30 for R6 scoring, critical failures and one observed gap under the existing rubric.",
  ],
  planning: [
    "Use the first 10 minutes to score R3 from the saved design attempt.",
    "Use the next 10 minutes to score R5 from the saved take-home defense.",
    "Use the final 10 minutes to choose the next replacement blocks from actual results; preserve Sunday recovery.",
  ],
};
const prerequisites = {
  study:
    "Open the dated chapter and last recall attempt; check its prerequisite example before adding topics.",
  project:
    "Use the actual repository revision, runnable setup and synthetic fixture; inspect the previous failed check. Verify missing historical setup inside this block rather than assuming it happened.",
  applications:
    "Use the current Germany/EU application PDF from resume-generator, the exact live requisition and actual pipeline status. Match three responsibilities to supported experience; check language, office and work-authorization constraints. Keep the private application PDF separate from the phone-free public export.",
  oss: "Check the single issue's current status, contribution rules, AI policy, repository revision, supported runtime and exact reproduction command before changing code.",
  network:
    "Use one supported artifact, a relevant recipient or audience, and one specific question. Check previous contact and consent before preparing a message; preparation does not send it.",
  coding:
    "Open the assigned prompt/version, allowed tools and last failed case. Start the timer before the unaided attempt; keep assisted work separate.",
  speaking:
    "Use the current CV, one real artifact and an accurate personal contribution map. Keep official titles, dates and observed results consistent.",
  assessment:
    "Open the dated existing prompt/rubric and any due failed-round repair; retain original attempts and tool/assistance records.",
  german:
    "Open the dated lesson and its audio, plus the last corrected phrases or recording. Use the actual lesson prerequisite, not an assumed language level.",
  review:
    "Bring today's actual commands/results, saved work, stage changes and assessment gaps; an elapsed block is not a completion receipt.",
  funnel:
    "Use exact submission dates, vacancy IDs, CV versions, actual confirmation and response/stage dates. Keep pending and ineligible records distinct.",
  mock: "Open the dated existing prompt/rubric, allowed tools and last failed-round repair; retain original attempts and distinguish self-scoring from independent review.",
  documents:
    "Use the dated official source for the actual route/question and the known document inventory. Separate verified facts, missing evidence and questions for qualified advice.",
  proof:
    "Use an actual revision, source-sharing permission, synthetic fixture and reproducible checks. Identify personal contribution and limits before packaging the demonstration.",
  planning:
    "Bring the current funnel, actual employer deadlines, failed assessment dimensions and previous replacement decisions. Remove displaced scope when choosing a new priority.",
};
const blockedActions = {
  study:
    "Reduce to the smallest prerequisite trace, record the exact unknown and check that source. Replace broad reading with the observed gap; do not add catch-up hours.",
  project:
    "Save the exact setup/test failure and missing prerequisite. Use the remaining block for the smallest runnable synthetic case; replace a later project slice instead of adding scope.",
  applications:
    "Record the failed role constraint or unresolved eligibility question and use the next suitable live lead. Do not submit a mismatch, duplicate an application or infer rejection from silence.",
  oss: "After two focused sessions without a reliable setup or suitable reproduction, narrow to a real example/documentation gap or inspect the single Zod backup. Keep one queue and distinguish ready, submitted and merged.",
  network:
    "If no relevant person or review slot is available, retain the specific draft and improve the same artifact or recorded explanation. Do not fill the block with bulk messages or unsupported posts.",
  coding:
    "Preserve the timed failing attempt and exact misconception. Study one targeted hint after the unaided clock, label assistance, then replace a later practice block with a changed-case retest.",
  speaking:
    "Remove any claim you cannot support and explain a smaller verified contribution. Record the missing evidence as a follow-up instead of inventing an impact figure.",
  assessment:
    "Save the actual score, critical failure and assistance used. Repair one dimension inside its assigned time; replace later practice for a retake rather than rewriting the original result.",
  german:
    "If a partner or connection is unavailable, use available lesson audio and a private recorded exchange; keep the unanswered listening/speaking gap visible. Do not claim a new CEFR level.",
  review:
    "Mark missing evidence as unverified and retain the exact next action. Carry at most one priority into a replacement block; do not backfill a completion record.",
  funnel:
    "Reconcile one uncertain record against an actual receipt or conversation. Leave unknown dates, attachments and outcomes unknown; do not fabricate a conversion rate.",
  mock: "Preserve the actual attempt and failed dimension; score only observed behavior. If independent feedback is unavailable, label self-scoring and use a changed-prompt retest later.",
  documents:
    "Record the unresolved requirement and official contact/question. Use the remaining block to check the next dependency; do not assume eligibility or upload identity documents to an unverified destination.",
  proof:
    "Share only the permitted sanitized diagram and synthetic example. If a check cannot run, include its exact blocker and limit rather than presenting the mechanism as production-verified.",
  planning:
    "If the sample is small or outcomes pending, choose one evidence-backed replacement and a reassessment date. Preserve breaks and Sunday recovery; never create automatic overdue debt.",
};
const resource = {
  project:
    "[Project walkthroughs](https://study.buildora.work/projects/INDEX.md)",
  coding: "[Full exercise bank](2026-10-10-germany-daily-curriculum.md)",
  assessment: "[Assessment prompts and rubrics](2026-10-10-germany-exams.md)",
  mock: "[Assessment prompts and rubrics](2026-10-10-germany-exams.md)",
  applications:
    "[Germany application guidance](https://www.make-it-in-germany.com/en/working-in-germany/job/application) · [Resume claim preparation](https://study.buildora.work/80-lanes-abroad-full-stack/80.18-resume-claim-crosswalk.md)",
  german: "[Goethe practice](https://www.goethe.de/en/spr/ueb.html)",
  documents:
    "[Official Germany guidance](https://www.make-it-in-germany.com/en/)",
  funnel: "[Company queue and campaign](2026-10-10-germany-campaign.md)",
  proof:
    "[Project walkthroughs](https://study.buildora.work/projects/INDEX.md)",
  planning: "[Campaign guide](2026-10-10-germany-campaign.md)",
  review: "[Study and project guide](2026-10-10-germany-daily-curriculum.md)",
};
export function generateJobPlan(base, calendar, design) {
  if (!isGermanyRoadmap(base))
    throw new Error("Valid baseline roadmap required");
  const sections = calendar
    .split(/^### /m)
    .slice(1)
    .map((s) => ({
      date: /\b(202[67]-\d{2}-\d{2})\b/.exec(s.split("\n")[0])?.[1],
      body: s.slice(s.indexOf("\n") + 1),
    }))
    .filter((s) => s.date);
  const days = sections
    .map(({ date, body }) => {
      const weekday = new Date(date + "T12:00:00Z").getUTCDay();
      const fullLoop = ["2026-12-19", "2027-01-02"].includes(date);
      const kinds =
        weekday === 6
          ? ["funnel", "mock", "documents", "proof", "planning"]
          : [
              "study",
              "project",
              "applications",
              weekday === 2 || weekday === 4 ? "network" : "oss",
              ...(weekday === 3 || ["2026-12-18", "2027-01-01"].includes(date)
                ? ["assessment"]
                : ["coding", "speaking"]),
              "german",
              "review",
            ];
      const rows = body
        .split("\n")
        .filter((l) => /^\| \d{2}:/.test(l))
        .map((l) =>
          l
            .split(/(?<!\\)\|/)
            .slice(1, -1)
            .map((c) => c.trim().replace(/\\\|/g, "|")),
        );
      if (weekday === 0) {
        if (rows.length) throw new Error("Sunday must be recovery");
        return null;
      }
      const assignments = rows.map(([slot, source, done], i) => {
        const match = /^(\d{2}:\d{2})[–-](\d{2}:\d{2}) · (\d+)m$/.exec(slot);
        const kind = kinds[i];
        if (!match || !kind || !done)
          throw new Error("Invalid assignment slot or instructions: " + date);
        if (/<br><br>##/.test(source))
          throw new Error("Next-week heading leaked into assignment: " + date);
        const brief = source
          .replace(/<br\s*\/?>/g, "\n")
          .replace(
            "Start with 15m recall, read selectively for 40m, explain/trace for 25m and source-check for 10m.",
            "",
          )
          .replace(
            "Spend 10m defining the boundary, 90m on the smallest slice, 35m on meaningful checks and 15m packaging evidence.",
            "",
          )
          .replace(
            "Spend 15m checking current issue/review status, 75m reproducing/testing/fixing and 30m validating and recording the result.",
            "",
          )
          .replace(
            "Spend 30m on relevant research, 60m on the useful artifact/draft and 30m on a clear evidence check and next action.",
            "",
          )
          .replace("Clarify 10m, solve 50m, test 20m, explain 10m.", "")
          .replace("Record 10m, listen/score for 10m, retry for 10m.", "")
          .replace(
            "Retrieve 15m, listen/study 20m, speak 15m and write/check 10m.",
            "",
          )
          .replace(/ +/g, " ")
          .trim();
        const linked = [...brief.matchAll(/\[([^\]]+)\]\([^)]+\)/g)].map(
          (m) => m[1],
        );
        let action = brief.replace(/^\*\*[^*]+:\*\*\s*/, "");
        if (kind === "study")
          action = action
            .replace(/\[[^\]]+\]\([^)]+\)/g, "")
            .replace(/^(?:(?:Read|Study|Open|and)\b|[\s,.;:])+/i, "");
        if (kind === "applications")
          action = action.replace(/^respond to due replies first\.\s*/i, "");
        const detail = plain(action);
        const sentence = detail.split(/(?<=[.!?])\s+/)[0] || names[kind];
        const outcome = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        const assignmentResource =
          fullLoop && (kind === "proof" || kind === "planning")
            ? resource.mock
            : resource[kind];
        return {
          id: `germany:2026:day:${date}:assignment:${kind}`,
          date,
          range: match[1] + "-" + match[2],
          minutes: Number(match[3]),
          kind,
          title:
            kind === "study" && linked.length
              ? "Study: " + linked.slice(0, 2).join(" + ")
              : fullLoop && kind === "mock"
                ? "Design and take-home defense"
                : fullLoop && kind === "proof"
                  ? "Behavioral interview and scoring"
                  : fullLoop && kind === "planning"
                    ? "Score design and defense; plan next week"
                    : names[kind],
          outcome,
          brief:
            brief +
            (assignmentResource && !brief.includes(assignmentResource)
              ? "\n\n" + assignmentResource
              : ""),
          steps: (fullLoop && fullLoopWorkflows[kind]) || workflows[kind],
          deliverable: done,
          doneCheck:
            kind === "applications" || kind === "oss" || kind === "network"
              ? "The evidence identifies the real stage and next action. A prepared draft is not a submission or publication."
              : kind === "study"
                ? "Explain the assigned mechanism without notes, predict the changed example and correct the observed misconception."
                : "The named artifact includes an observed check, remaining limitation and next repair; elapsed time alone is not completion.",
          dependency:
            fullLoop && kind === "proof"
              ? "Open the dated R6 behavioral prompt, rubric and permitted tool rules; this replaces project-proof packaging."
              : fullLoop && kind === "planning"
                ? "Bring the saved R3 design and R5 defense attempts, their rubrics and actual employer-stage deadlines."
                : prerequisites[kind],
          blocked: blockedActions[kind],
        };
      });
      return { date, assignments };
    })
    .filter(Boolean);
  const jobPlan = {
    version: 1,
    effectiveOn: "2026-10-15",
    timezone: "Asia/Kolkata",
    weeklyMinutes: 3600,
    sourceDigest: digest(calendar + "\n" + design),
    days,
  };
  if (!isJobPlan(jobPlan))
    throw new Error(
      "Incomplete, unsafe or invalid assignment calendar: check dates, ranges, duration budgets and links",
    );
  const table =
    /\| Workstream \| Hours\/week \|([\s\S]*?)(?:\n\n|$)/.exec(design)?.[1] ??
    "";
  const allocations = table
    .split("\n")
    .filter((l) => /^\|/.test(l))
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((s) => s.trim()),
    )
    .filter((r) => !r[0].includes("Total") && Number.isFinite(Number(r[1])))
    .map(([label, hours]) => ({ label, hours: Number(hours) }));
  if (allocations.reduce((n, a) => n + a.hours, 0) !== 60)
    throw new Error("Design allocations must total 60 hours");
  const execution = {
    ...base.execution,
    jobPlan,
    assessments: base.execution.assessments.map((a) =>
      a.id.startsWith("W") && a.date >= jobPlan.effectiveOn
        ? {
            ...a,
            time: "16:45–18:45 (90-minute assessment + 30-minute repair)",
          }
        : a,
    ),
    guides: base.execution.guides.map((g) =>
      g.id === "design"
        ? { ...g, title: "60-hour execution and timetable", content: design }
        : g.id === "campaign"
          ? {
              ...g,
              content:
                "# Current hiring decisions — 15 October 2026\n\n" +
                "Use the [60-hour execution guide](2026-10-10-germany-detailed-roadmap-design.md) and dated assignments for current capacity and priority. Start with actual employer stages/replies, then the strongest live eligible unsubmitted vacancy. Named employers below are research leads to recheck.\n\n" +
                "Current capacity: 5–8 strong applications per full week when enough roles fit; networking/writing four hours; German five hours at 20:00–21:00 IST; one OSS queue with Zod as backup. Package an initial case-study packet now and improve it weekly. These current instructions supersede the older capacity notes below.\n\n" +
                "# Historical research and preparation source\n\n" +
                g.content,
            }
          : g,
    ),
  };
  const result = {
    ...base,
    execution,
    allocations,
    reviewedOn: "2026-10-15",
    sourceDigest: digest(
      JSON.stringify([base.sourceDigest, jobPlan.sourceDigest]),
    ),
    target:
      "Full-stack engineer — React/TypeScript + Node.js/backend in Germany",
  };
  if (!isGermanyRoadmap(result))
    throw new Error("Generated roadmap failed validation");
  return result;
}

// This forward revision reuses the existing assignment/evidence system. The Bible
// catalogue supplies reference facts; it never determines required daily volume.
const forwardThemes = [
  [
    "JavaScript execution, closures, async and baseline",
    "js-runtime",
    /execution-and-scope|async-concurrency/,
    "Predict async ordering and trace the current React → API → PostgreSQL operation.",
  ],
  [
    "React state, effects, forms and runtime contracts",
    "react-ui",
    /10\.3-react|10\.5-form-handling/,
    "Reproduce pending/error/retry and stale-response behavior; check keyboard use.",
  ],
  [
    "SQL modeling, indexes, plans, pagination and pooling",
    "postgresql",
    /index|query-plan|pagination|connection-pool/,
    "Run a synthetic query lab, compare actual plans and explain costs excluded by the experiment.",
  ],
  [
    "Transactions, constraints, races and tenant authorization",
    "identity-tenancy",
    /transaction|isolation|authorization|multi-tenan|row-level|prisma/,
    "Race independent synthetic writes and test allowed/denied tenant operations through the actual enforcement path.",
  ],
  [
    "Queues, outbox, retries, leases and shutdown",
    "distributed-work",
    /outbox|idempotenc|retry|queue|graceful/,
    "Crash after effect and before acknowledgment; distinguish claim fencing from effect deduplication.",
  ],
  [
    "Webhooks, provider failure and realtime recovery",
    "realtime",
    /webhook|reconnect|reconciliation|websocket/,
    "Send duplicate/out-of-order inputs and disconnect/reconnect around an update; inspect recovery.",
  ],
  [
    "Meaningful testing, debugging and UI performance",
    "testing-delivery",
    /playwright|integration-test|debug|profil|performance/,
    "Reproduce a real failure, repair it and measure the actual bottleneck with named limitations.",
  ],
  [
    "CI, Docker, migrations, telemetry and rollback",
    "operations",
    /docker|ci-cd|migration|observability|rollback/,
    "Run a compatible release/recovery drill with explicit health signals and stop conditions.",
  ],
  [
    "System design, capacity and architecture evolution",
    "system-design",
    /system-design|capacity|consistency|modular-monolith/,
    "Design with justified workload estimates, then change a consistency or availability constraint.",
  ],
  [
    "Next.js working depth: boundaries, caching and streaming",
    "nextjs",
    /nextjs|next-js|hydration|server-component|streaming/,
    "Trace one bounded server/client path and cache invalidation; keep working depth accurate.",
  ],
  [
    "Unfamiliar full-stack exercises and project defense",
    "api-contracts",
    /api-design|error-handling|contract|interview/,
    "Attempt an unfamiliar frontend/API/database case under a timer and repair the weakest observed skill.",
  ],
  [
    "Full loops, real stories and first readiness review",
    "senior-collaboration",
    /behavioral|leadership|communication|interview/,
    "Run the full interview loop; preserve observed gaps and evidence limits for every resume-critical claim.",
  ],
  [
    "Advanced TypeScript, runtime and resource reasoning",
    "typescript",
    /10\.2-typescript|memory|backpressure/,
    "Solve a changed type/runtime/resource problem independently and explain the enforcement boundary.",
  ],
  [
    "Role-driven cloud, networking, security and recovery",
    "operations",
    /network|threat|security|disaster|recovery/,
    "Bound a fault/recovery or threat exercise to a qualified role and identify trusted authority.",
  ],
  [
    "Advanced frontend/realtime or safe AI integration",
    "ai-engineering",
    /realtime|websocket|prompt-injection|evaluation|ai-/,
    "Choose from actual role demand; test correctness, data exposure, performance and failure behavior.",
  ],
  [
    "Senior design review, mentoring and changed-prompt retests",
    "senior-collaboration",
    /code-review|mentoring|leadership|system-design/,
    "Review an unfamiliar change and defend a concrete decision using actual contribution evidence.",
  ],
  [
    "Final four days: unresolved skills and next cycle",
    "senior-collaboration",
    /interview|revision|system-design/,
    "Retest unresolved skills, progress actual hiring stages and retain specific scheduled gaps.",
  ],
];
const dailyCases = [
  [
    [
      "Execution, lexical scope and closures",
      "Trace one existing UI → API → database operation, then isolate two counters created by the same closure factory. Interleave their callbacks and prove each counter owns a separate captured cell.",
      "Implement makeCounter(start) returning increment and read functions. Interleave two counters, include a negative start and explain what remains reachable after the factory returns.",
    ],
    [
      "this, prototypes and TypeScript narrowing",
      "Implement parseBooking(input: unknown) using a runtime contract. Reject null, arrays, a missing field and an invalid date; explain which properties TypeScript alone cannot establish.",
      "Write a type guard for a discriminated success/error response. Process unknown null, primitive and malformed-object inputs without a cast or non-null assertion.",
    ],
    [
      "Event loop and promise ordering",
      "Create a synthetic submit flow with a timer, a promise callback and a rejected request. Predict the log order, observe it and verify pending state resets after success and rejection.",
      "Implement settleBatch(promises) that retains input order and reports each success or failure without an unhandled rejection. Test an empty batch and out-of-order completion.",
    ],
    [
      "Cancellation and bounded concurrency",
      "Reproduce search A completing after newer search B. Add cancellation plus a current-request check; prove the old result cannot overwrite B, and keep the difference between aborting a request and undoing an effect explicit.",
      "Implement mapLimit(tasks, limit, signal) with limit two, ordered outputs and a stated failure policy. Stop launching new work on abort and account for already-running tasks.",
    ],
    [
      "Runtime contracts across a full-stack request",
      "Trace a form payload through runtime validation, trusted tenant scope and a database write. Run a reduced synthetic case for malformed input and a conflicting booking; name each mocked boundary.",
      "Implement half-open appointment overlap for one clinician using normalized numeric UTC instants. Cover adjacent slots, identical starts, another clinician and invalid intervals.",
    ],
    [
      "Async revision and changed-case baseline",
      "Run a changed-case mock: diagnose a closure retaining stale state and a late response replacing newer input. Save the unaided attempt, observed output and one specific repair.",
      "Re-explain the failed async case from a clean input after the correction, without consulting the previous solution.",
    ],
  ],
  [
    [
      "React state ownership and rendering",
      "Build an editable appointment draft owned by one component. Change a field and cancel the edit; show why derived totals need not become a second independently updated state.",
      "Implement an immutable update to one item in a nested booking list; retain unaffected object references and test an unknown ID.",
    ],
    [
      "Effects and stale response cleanup",
      "Build a search view with a changing query and a slow fake API. Unmount and reorder responses; verify cleanup and request identity prevent stale visible data.",
      "Repair a supplied effect with a missing dependency and an old callback capture. Predict reruns before executing the changed case.",
    ],
    [
      "Forms and runtime validation",
      "Build one synthetic booking form with shared runtime validation. Trigger invalid input, server rejection and double submit; show field errors and pending feedback.",
      "Parse an unknown nested form payload into a discriminated result. Preserve field-level errors without trusting a TypeScript annotation at runtime.",
    ],
    [
      "Server state and concurrent optimistic writes",
      "Build a list backed by a query cache. Run two optimistic edits, reject the first after the second succeeds and prevent rollback from restoring stale content.",
      "Implement a per-record mutation version check and reconcile two out-of-order responses. State what happens when the server normalizes a value.",
    ],
    [
      "Keyboard access and error focus",
      "Complete the same form with only a keyboard. Verify label names, focus movement to the first error, dialog close behavior and recovery after a failed submission.",
      "Implement focus-target selection from a validation error map while skipping disabled and absent fields; test stable field order.",
    ],
    [
      "React workflow retest",
      "Run a changed prompt combining form validation, pending/error states and a late response. Explain state ownership and one accessibility boundary under the existing rubric.",
      "Retest the week's weakest behavior with a different input and retain the original failed attempt.",
    ],
  ],
  [
    [
      "Relational modeling and constraints",
      "Model synthetic clinics, clinicians and appointments with primary, foreign and uniqueness constraints. Attempt an orphaned clinician reference and record which database rule rejects it.",
      "Design a small schema for orders and line items; reject duplicate external IDs and explain which rule must survive concurrent writers.",
    ],
    [
      "Composite index column order",
      "Populate a synthetic appointment table. Compare a clinic/date lookup before and after a composite index, using the actual plan and unchanged ordered results.",
      "Given equality, range and ordering requirements, choose between two composite indexes and predict which scans each query can use.",
    ],
    [
      "Query plans and measurement scope",
      "Read actual and estimated row counts for one query plan. Change data skew, rerun it and separate database execution observations from API/network costs.",
      "Identify the first bad cardinality estimate in a supplied plan and propose one discriminating measurement before changing an index.",
    ],
    [
      "Stable pagination",
      "Implement keyset pagination over timestamp plus ID. Insert an equal-timestamp row between pages and inspect duplication, omission and ordering under the chosen contract.",
      "Implement a cursor comparator for equal timestamps and unique IDs; cover empty pages, ties, reverse direction and an invalid cursor.",
    ],
    [
      "Connection pooling and timeouts",
      "Bound concurrent synthetic requests against a small local pool. Hold one transaction open; observe waiting and confirm timeout/release behavior with an explicit cleanup path.",
      "Implement a small permit limiter with try/finally release; test rejection, cancellation and a caller that fails after acquiring a permit.",
    ],
    [
      "SQL changed-workload retest",
      "Repeat one query under a changed filter selectivity and explain why its plan or observed time changes. Keep raw samples and excluded costs visible.",
      "Defend index choice, pagination contract and pool limits from the actual synthetic workload rather than a universal rule.",
    ],
  ],
  [
    [
      "Transaction invariants",
      "Implement a synthetic transfer whose debit and credit must commit together. Fail after the debit and confirm rollback leaves the invariant intact.",
      "State and test a transfer invariant with zero/negative amounts, the same account and insufficient funds before comparing transaction strategies.",
    ],
    [
      "Isolation and racing writes",
      "Run two independent transactions against a shared synthetic balance or booking. Record interleavings and show what the selected isolation level does and does not prevent.",
      "Trace two read-check-write sequences under a changed isolation assumption and locate the lost update or invalid combined decision.",
    ],
    [
      "Booking exclusion and conflict feedback",
      "Race overlapping synthetic appointments for the same clinician through the real constraint. Include adjacency and a different clinician, then map the conflict to useful API/UI feedback.",
      "Implement interval-conflict detection for a changed workload and explain why a process-local precheck cannot arbitrate independent writers.",
    ],
    [
      "Prisma transaction boundaries",
      "Trace one ORM transaction and an external call. Move the external effect outside the database transaction and document the crash gap and recovery choice.",
      "Refactor a supplied transaction callback that holds a connection during a slow remote call; preserve its actual database invariant.",
    ],
    [
      "Trusted tenant scope and authorization",
      "Create two synthetic tenants. Attempt allowed access, guessed resource IDs and a forged tenant field through the actual policy path; label any database role or RLS condition not exercised.",
      "Implement resource authorization from trusted request context and stored ownership. Test a missing resource, another tenant and an untrusted client tenant field.",
    ],
    [
      "Concurrent authorization retest",
      "Run a changed booking race plus one cross-tenant access attempt. Identify the database authority, request authority and any mocked enforcement boundary.",
      "Explain a new policy case after ownership or tenant membership changes during a request; state the consistency decision.",
    ],
  ],
  [
    [
      "Durable jobs and acknowledgement",
      "Enqueue a synthetic job, crash its worker after the effect but before acknowledgement and inspect redelivery. Separate a completed effect from a removed job.",
      "Model job states and valid transitions; reject acknowledgement without the current claim token.",
    ],
    [
      "Transactional outbox boundary",
      "Save a business change and outbox record in one database transaction. Fail the relay after delivery and demonstrate duplicate handling at the consumer boundary.",
      "Design the smallest outbox claim query and consumer deduplication key for two independent relays without promising external exactly-once effects.",
    ],
    [
      "Retry policy and poison work",
      "Feed transient and permanent synthetic errors into a bounded retry policy. Inspect backoff, terminal state and manual replay without silently retrying invalid work forever.",
      "Implement a retry decision function from attempt count, error class and deadline; cover retry exhaustion and a caller cancellation.",
    ],
    [
      "Leases and fencing",
      "Pause an old worker beyond its lease, reclaim with a new token and resume the old acknowledgement. Prove the stale token cannot mutate the current claim.",
      "Implement a monotonic-token state transition and test stale/new acknowledgements; explain why fencing the claim alone cannot deduplicate an external effect.",
    ],
    [
      "Graceful shutdown and cleanup",
      "Signal a synthetic worker during an active job. Stop new claims, bound drain time and demonstrate whether the in-flight job is acknowledged or left recoverable.",
      "Write an async drain controller that stops admission, tracks active work and exits on a deadline without losing rejection evidence.",
    ],
    [
      "Queue recovery retest",
      "Run a changed crash/acknowledgement ambiguity and manual dead-letter replay under the rubric. Save effect counts, claim tokens and the remaining recovery limit.",
      "Defend a new retry deadline and duplicate-consumer scenario using actual observations from the week.",
    ],
  ],
  [
    [
      "Webhook authenticity and parsing",
      "Verify a synthetic webhook signature against the exact raw bytes. Change whitespace and payload bytes; distinguish authentication, parsing and business validation failures.",
      "Design a signature-verification boundary that rejects altered bytes, missing headers and invalid encodings before trusting event fields.",
    ],
    [
      "Duplicate webhook delivery",
      "Deliver the same synthetic payment event twice. Keep one business transition and record the repeated receipt without assuming the provider delivers only once.",
      "Implement a deduplication-key contract for duplicate event IDs and conflicting payloads with the same ID.",
    ],
    [
      "Out-of-order payment events",
      "Deliver settled then pending events for one synthetic payment. Define the allowed state transition and a reconciliation action for an ambiguous provider result.",
      "Implement an explicit state transition table; reject backward transitions and handle an event whose prerequisite is missing.",
    ],
    [
      "Provider timeout ambiguity",
      "Time out after a fake provider has accepted an effect. Reconcile by a stable request reference and keep unknown versus failed outcomes distinct.",
      "Design a retry/reconcile decision for accepted, rejected and unknown provider outcomes without double-applying the effect.",
    ],
    [
      "Realtime reconnect and replay",
      "Disconnect a synthetic client between two updates. Reconnect from a last-seen sequence, replay missed events and handle a duplicate delivery.",
      "Implement sequence-gap detection and a replay cursor; cover duplicates, missing retention and a forced full resynchronization.",
    ],
    [
      "Integration recovery retest",
      "Combine a duplicate webhook with a reconnect around the resulting update. Explain which durable state lets the client recover and which provider outcome remains unknown.",
      "Defend the changed event ordering without relying on arrival time as the business authority.",
    ],
  ],
  [
    [
      "Discriminating unit tests",
      "Find one untested behavior in the synthetic workflow. Write a failing case first, verify it fails for the missing behavior and make the smallest repair.",
      "Review a test that only asserts its mock calls; replace it with an observable contract that would detect the real regression.",
    ],
    [
      "Integration authority and test doubles",
      "Exercise one workflow through its actual database constraint or authorization policy. Deliberately break that boundary and verify the test detects it.",
      "Decide which dependency must be real for a booking-race test and which provider can be simulated; explain the remaining limits.",
    ],
    [
      "Browser submission and network failure",
      "Submit a complete synthetic form through the browser, reject its request and retry it. Verify visible state and persisted result rather than only opening the dialog.",
      "Write a browser-test plan that proves submission and error recovery while avoiding selectors tied to internal component structure.",
    ],
    [
      "React profiling and render cost",
      "Profile a synthetic large list before changing it. Identify the slow interaction, apply one justified change and compare the same workload without inventing a percentage.",
      "Diagnose a changed rendering trace and choose between state relocation, memoization and virtualization using the measured bottleneck.",
    ],
    [
      "Debugging and resource leaks",
      "Reproduce a repeated mount/unmount or request loop. Inspect listeners, timers or connections and prove cleanup prevents accumulation under the same scenario.",
      "Implement a disposable resource wrapper with idempotent cleanup and test success, failure and double disposal.",
    ],
    [
      "Quality changed-case retest",
      "Run an unfamiliar failing workflow and choose a minimal test boundary, debugging measurement and repair. Preserve assisted versus unaided attempts.",
      "Explain which observed behavior the chosen test proves and which correctness claim still needs integration evidence.",
    ],
  ],
  [
    [
      "Reproducible CI gates",
      "Reproduce a local failing check in a clean environment. Pin the relevant runtime/inputs and distinguish an executed pass from a skipped or credential-blocked gate.",
      "Review a CI job that reports success after skipping its test command; propose a failure condition that prevents a vacuous pass.",
    ],
    [
      "Docker process and shutdown",
      "Run the synthetic service in a container with a real health route. Stop it during work and inspect signal handling, port binding and exit behavior.",
      "Explain a changed container startup failure from its logs, process command and environment instead of changing the health check blindly.",
    ],
    [
      "Secrets and deployment configuration",
      "Start the synthetic service with one required variable absent. Fail clearly at the correct boundary, redact sensitive values and verify the repaired configuration.",
      "Design validation for missing, malformed and conflicting configuration values without putting secrets in build output.",
    ],
    [
      "Compatible schema migration",
      "Introduce an additive field while an old and new synthetic client both run. Exercise forward/backward behavior and an explicit rollback constraint.",
      "Plan an expand/contract migration for a renamed field with mixed-version clients and explain when removing the old field is safe.",
    ],
    [
      "Telemetry and bounded rollback",
      "Inject one synthetic failure, locate its trace/log/metric signal and trigger a rollback stop condition. Record missing samples as unknown rather than healthy.",
      "Choose an operation-level signal and alert threshold from a stated workload, then identify what the signal cannot establish.",
    ],
    [
      "Release recovery retest",
      "Run a changed startup or migration failure. Decide stop, rollback or targeted repair from observed evidence and preserve the exact revision/commands.",
      "Defend the recovery decision while an old client remains live and one telemetry stream is missing.",
    ],
  ],
  [
    [
      "Requirements and workload estimates",
      "Design a small appointment service from explicit users, request rates, data size and availability needs. State estimates and what would change the design.",
      "Convert a stated workload into peak request and storage estimates; check units and distinguish guesses from measured inputs.",
    ],
    [
      "Data models and authority",
      "Choose the source of truth for bookings, payments and notifications. Trace a write and identify which component arbitrates conflicting decisions.",
      "Compare two ownership boundaries after an appointment is rescheduled during a payment update.",
    ],
    [
      "Cache consistency",
      "Add a cache to one synthetic read path, update the underlying record and exercise invalidation failure. Explain the chosen stale-read contract.",
      "Design cache keys and invalidation for tenant-scoped lists without returning one tenant's data to another.",
    ],
    [
      "Failure domains and overload",
      "Slow one dependency and bound caller concurrency, timeouts and queues. Inspect how the system degrades rather than allowing unbounded waiting.",
      "Choose an overload policy under a changed traffic spike and calculate which resource becomes saturated first.",
    ],
    [
      "Modular architecture evolution",
      "Compare a modular monolith with a service split for one actual boundary. State team, consistency and deployment conditions that justify the extra distributed failure modes.",
      "Review a proposed service split and identify the transaction or data ownership dependency that must change first.",
    ],
    [
      "System-design retest",
      "Redesign the same workload after a changed availability or consistency requirement. Justify the smallest architecture change and identify a new failure boundary.",
      "Defend one estimate and one rejected alternative under a changed interviewer constraint.",
    ],
  ],
  [
    [
      "Next.js server and client boundaries",
      "Build a bounded page with a server read and one client interaction. Identify what runs where and which data may cross the serialized boundary.",
      "Place a browser-only API and a private credential in the correct execution boundary; explain a changed hydration failure.",
    ],
    [
      "Request data and route handlers",
      "Implement a small route handler with runtime validation and trusted request scope. Trace an invalid payload and an unauthorized request.",
      "Refactor a supplied handler whose typed request body is never validated at runtime and state which checks remain required.",
    ],
    [
      "Caching and invalidation by version",
      "Inspect the pinned Next.js version and explicit cache configuration. Change one record and verify the selected revalidation path rather than assuming a universal default.",
      "Explain a stale response after a write by separating request memoization, data caching and route output under the actual version.",
    ],
    [
      "Hydration and serialization",
      "Render a bounded server snapshot and hydrate the client. Introduce a non-serializable or time-dependent value, observe the mismatch and repair the boundary.",
      "Design a transport-safe representation for dates and errors and show what information must be reconstructed on the client.",
    ],
    [
      "Streaming and partial failure",
      "Stream a slow synthetic section behind a loading boundary. Fail it after another section appears and inspect useful error/retry behavior.",
      "Choose error and loading boundaries for independent requests with different latency and failure characteristics.",
    ],
    [
      "Next.js working-depth retest",
      "Trace a changed server/client/cache path end to end under the pinned version. Preserve the resume's working-depth label and observed limits.",
      "Defend which behavior came from explicit configuration and which came from the current framework default.",
    ],
  ],
  [
    [
      "Unfamiliar frontend workflow",
      "Build a small unfamiliar editor from a written contract with loading, validation and conflict feedback. Record the unaided attempt before reading a reference solution.",
      "Implement a controlled editor with cancel/reset and a changed server response; state ownership of draft and persisted values.",
    ],
    [
      "Unfamiliar backend contract",
      "Implement a small paginated endpoint from a new contract. Check unknown input, authorization and structured failure behavior.",
      "Write a cursor parser and response contract for malformed cursors, empty results and stable ordering without copying a prior endpoint.",
    ],
    [
      "Unfamiliar data change",
      "Add a synthetic invariant and race two callers against it. Capture the actual enforcement and map its rejection to a usable response.",
      "Solve a changed resource-allocation problem with two concurrent requests and explain why the chosen authority can arbitrate it.",
    ],
    [
      "Cross-layer project defense",
      "Walk an existing operation from UI input to persisted state. Mark personal contribution, implemented source, actual run evidence and remaining assumptions separately.",
      "Diagnose a changed failure at one boundary and identify the next discriminating check rather than inventing an impact metric.",
    ],
    [
      "Weakest observed skill repair",
      "Select the lowest observed dimension from a saved attempt. Repair only that mechanism and retest it using a new input within the same block.",
      "Attempt a changed case without the previous solution, then compare the exact misconception and remaining gap.",
    ],
    [
      "Unfamiliar full-stack mock",
      "Run a new interface/API/database prompt under the existing rubric. Save the unaided result, tool use and one repair without overwriting earlier scores.",
      "Defend the first failed boundary and how its fix changed the observable result.",
    ],
  ],
  [
    [
      "Recruiter screen and truthful scope",
      "Record a concise introduction using actual dates, full-stack ownership and current remote constraints. Remove unsupported adoption, production or experience claims.",
      "Answer a changed scope question without turning learning or source inspection into claimed employment experience.",
    ],
    [
      "Coding round and communication",
      "Run one timed coding prompt, speak the invariant before implementation and test boundary cases. Score reasoning separately from whether code eventually runs.",
      "Solve a new collection or interval variant without assistance and explain complexity plus one rejected approach.",
    ],
    [
      "Practical full-stack round",
      "Complete a bounded frontend/API/data task with explicit acceptance criteria. Preserve a failed or partial result and identify the highest-value next check.",
      "Repair an unfamiliar malformed-input or duplicate-submit case under the allowed tools and time.",
    ],
    [
      "System-design round",
      "Design from clarified workload and constraints, then change one failure or consistency requirement. Score the reasoning against the existing dimensions.",
      "Explain what must change after a stated tenfold load increase and what need not change yet.",
    ],
    [
      "Behavioral stories and contribution",
      "Rehearse a real MAQ or project decision using situation, personal action, evidence and limits. State disagreement or learning without inventing an employer incident.",
      "Answer a changed follow-up about a trade-off, mentoring action or mistake using only an actual event.",
    ],
    [
      "First core-readiness review",
      "Run a full changed-prompt loop across the weakest rounds. Retain every resume-critical skill as demonstrated, working, learning or unverified with a named next gap.",
      "Explain why a date, self-score or completed reading list cannot substitute for an independently checked demonstration.",
    ],
  ],
  [
    [
      "Advanced TypeScript generics",
      "Implement a reusable typed transformation and test inference against unknown and union inputs. Compare compile-time guarantees with runtime validation.",
      "Design a generic result mapper that preserves discriminants without unsafe assertions and test an unexpected runtime payload.",
    ],
    [
      "Variance and function contracts",
      "Compare callback types under the actual compiler options. Demonstrate an unsafe substitution and explain the input/output constraint that rejects it.",
      "Repair a callback API whose parameter type accepts a narrower value than callers can provide.",
    ],
    [
      "Runtime memory and reachability",
      "Create and release a bounded cache or listener. Inspect retained references and verify cleanup under repeated operations without treating one heap snapshot as a leak proof.",
      "Implement an eviction policy with a strict item cap and test replacement, deletion and references held by another owner.",
    ],
    [
      "Streams and backpressure",
      "Pipe a fast synthetic producer into a slow consumer with a bounded buffer. Observe queue growth and explain how pressure reaches the producer.",
      "Implement a bounded async buffer with a stated stop/failure policy and account for a consumer that disconnects.",
    ],
    [
      "Event-loop delay and CPU work",
      "Add a bounded CPU-heavy operation, measure event-loop delay and compare partitioning or worker isolation under the same workload.",
      "Choose an execution strategy for mixed I/O and CPU tasks while preserving cancellation and error reporting.",
    ],
    [
      "Runtime changed-case retest",
      "Combine a type contract with a resource-lifetime or pressure constraint. Solve a changed case and retain source-linked corrections for the failed reasoning.",
      "Defend which property the type system establishes and which resource invariant requires runtime enforcement.",
    ],
  ],
  [
    [
      "Network path and dependency failure",
      "Trace client → edge → application → database for one synthetic request. Break DNS or a dependency endpoint in an isolated setup and locate the observed failure.",
      "Choose a timeout budget across three hops and explain why independent per-hop defaults can exceed the caller's deadline.",
    ],
    [
      "Cloud identity and least privilege",
      "Define the smallest permissions for one deployment operation. Test an allowed and denied synthetic action without printing credentials.",
      "Review an overly broad permission statement and reduce it to the actual resource and operation boundary.",
    ],
    [
      "Threat modeling and trust boundaries",
      "Draw untrusted input, credentials, tenant context and provider callbacks for one workflow. Exercise the highest-risk boundary with synthetic input.",
      "Find where a supplied design trusts a client-controlled tenant or redirect and specify a check at the actual authority.",
    ],
    [
      "Backup and recovery evidence",
      "Restore a disposable synthetic dataset from a retained backup. Check record integrity and measure the actual recovery steps and remaining gaps.",
      "Define recovery-point and recovery-time goals for a stated workload and explain what a backup file alone does not prove.",
    ],
    [
      "Cost and resource limits",
      "Compare two bounded deployment configurations using explicit workload assumptions and measured resource use. Keep uncertain cost inputs and external charges visible.",
      "Locate a runaway resource cost under a changed traffic pattern and choose a limit that preserves the critical operation.",
    ],
    [
      "Operations recovery mock",
      "Run a changed network, access or recovery fault using a role-relevant constraint. Communicate the signal, stop condition and next repair without claiming production readiness.",
      "Explain how the recovery plan changes when one backup, credential or telemetry dependency is unavailable.",
    ],
  ],
  [
    [
      "Role-driven advanced frontend",
      "Select a qualified role's actual UI requirement and build one bounded interaction. Measure its correctness and accessibility before adding performance machinery.",
      "Solve a changed state-ownership or focus problem using a new input and a documented user-visible contract.",
    ],
    [
      "Realtime ordering and conflicts",
      "Reorder two synthetic updates from separate clients. Apply an explicit version/conflict rule and explain whether the result is convergence or a business decision requiring authority.",
      "Implement a version comparator with duplicate, stale and concurrent updates under a stated conflict policy.",
    ],
    [
      "Offline recovery",
      "Disconnect during an edit, queue one bounded pending operation and reconnect against a changed server value. Surface conflict rather than silently overwriting work.",
      "Design an offline operation ID and replay rule that survives reconnect and duplicate delivery.",
    ],
    [
      "Safe AI feature boundary",
      "If a qualified role needs AI, build a small synthetic-data feature with explicit tool permissions, output validation and an unsafe-input evaluation case. Otherwise deepen the same frontend/realtime requirement.",
      "Validate a generated structured response and reject malformed output; explain why model text does not authorize a tool call.",
    ],
    [
      "AI evaluation and cost failure",
      "Run a small retained evaluation set for the bounded feature, including prompt injection and provider failure. Set time/token/cost limits and retain unknown outcomes.",
      "Design a pass/fail check for a model-assisted operation that cannot be satisfied by fluent text alone.",
    ],
    [
      "Role-driven feature defense",
      "Defend the selected frontend/realtime or AI slice under changed constraints. Keep new learning separate from employment experience and save remaining security/performance limits.",
      "Explain the smallest test that would falsify the claimed feature behavior.",
    ],
  ],
  [
    [
      "Design review and alternatives",
      "Review an unfamiliar design against workload, authority and failure constraints. State one concrete risk, one alternative and what evidence would change the recommendation.",
      "Refute or support a proposed abstraction using a changed requirement rather than personal style preference.",
    ],
    [
      "Code review and regression risk",
      "Review an unfamiliar bounded patch, trace affected callers and name the smallest meaningful regression check. Separate a correctness issue from a preference.",
      "Find a contract change hidden behind a refactor and construct the input that distinguishes old and new behavior.",
    ],
    [
      "Mentoring and explanation",
      "Explain a difficult mechanism to a peer or recording, ask for a prediction and correct the specific misconception. Use an actual mentoring example when discussing work history.",
      "Turn an ambiguous review comment into a concrete example, reason and verification step.",
    ],
    [
      "Prioritization and product judgment",
      "Compare two possible repairs using user impact, evidence and effort. Replace one lower-value task rather than adding hours to the week.",
      "Choose a response to conflicting deadlines and explain the assumption that would change the priority.",
    ],
    [
      "Incident communication",
      "Rehearse a synthetic incident update with observed impact, unknowns, mitigation and next check. Keep it distinct from a real employer incident story.",
      "Write an update after a mitigation succeeds but root cause remains unverified, without claiming resolution too early.",
    ],
    [
      "Senior full-loop retest",
      "Repeat weak coding, design and collaboration dimensions with changed prompts. Retain independent review status and a named final repair.",
      "Defend an unfamiliar trade-off while preserving actual contribution and evidence boundaries.",
    ],
  ],
  [
    [
      "Unresolved skill retest",
      "Select the highest-priority unresolved resume skill from retained evidence. Run a changed case unaided and record the actual state and next repair.",
      "Solve the smallest new input that still distinguishes the previously failed mechanism.",
    ],
    [
      "Actual hiring-stage preparation",
      "Use a real suitable employer's stated stage or replace this block with the next unresolved skill. Prepare only supported examples and retain its actual deadline and status.",
      "Practice a role-specific changed constraint without rewriting old application or assessment outcomes.",
    ],
    [
      "Evidence packet consistency",
      "Check the current resume, public artifact and interview story against the same retained operation. Repair unsupported wording and broken references within the block.",
      "Explain one claim at source, executed-evidence and personal-contribution levels without conflating them.",
    ],
    [
      "Next-cycle decision",
      "Review all remaining skill gaps and actual hiring states. Choose dated replacement tasks for the next cycle; the final date creates no mastery or employment certificate.",
      "Defend the next priority from observed evidence and name the condition that would change it.",
    ],
  ],
];
const lessonScopes = [
  /10\.1-javascript|10\.2-typescript|10\.5-form-handling/,
  /10\.3-react|10\.5-form-handling|50\.2-accessibility/,
  /20\.4-database/,
  /20\.4-database|20\.5-security|20\.2-nestjs/,
  /20\.6-microservices|20\.2-nestjs|30\.3/,
  /60-realtime|20\.3-rest-apis|20\.6-microservices/,
  /50-quality|10\.3-react/,
  /40-platform|20\.4-database/,
  /30-architecture|80\.03-|80\.08-|80\.27-/,
  /10\.4-next\.js/,
  /10\.3-react|20\.3-rest-apis|20\.4-database|80\.18-/,
  /70-interview-toolkit|80\.18-|80\.30-/,
  /10\.2-typescript|20\.1-node|10\.1-javascript/,
  /40-platform|20\.5-security/,
  /10-frontend|60-realtime|80\.08-/,
  /70-interview-toolkit|80\.18-|80\.30-|80\.32-/,
  /80\.29-|80\.32-|80\.18-|80\.33-/,
];
const preferredReferences = [
  [],
  [
    "10\\.3\\.2\\.01-usestate",
    "10\\.3\\.2\\.02-useeffect",
    "react-hook-form",
    "tanstack-query",
    "keyboard-navigation",
    "10\\.3\\.5\\.03-interview",
  ],
  [
    "20\\.4\\.1\\.01",
    "20\\.4\\.2\\.01",
    "20\\.4\\.2\\.01",
    "pagination",
    "connection-pooling",
    "20\\.4\\.2\\.01",
  ],
  [
    "20\\.4\\.3\\.01",
    "20\\.4\\.3\\.02",
    "20\\.4\\.3\\.01",
    "prisma",
    "20\\.5\\.1\\.09",
    "20\\.4\\.3\\.02",
  ],
  [
    "scheduling-background-jobs",
    "transactional-outbox",
    "idempotency-retry-deep",
    "idempotency-retry-deep",
    "lifecycle-hooks-graceful",
    "idempotency-retry-deep",
  ],
  [
    "webhooks",
    "webhooks",
    "webhooks",
    "long-running-api-operations",
    "60\\.1",
    "webhooks",
  ],
  [
    "unit-testing",
    "integration-testing",
    "playwright",
    "10\\.3\\.3\\.05-performance",
    "debugging",
    "integration-testing",
  ],
  [
    "github-actions",
    "docker-build-deploy",
    "secrets-management",
    "migration-strategies",
    "opentelemetry",
    "blue-green-canary",
  ],
  [
    "80\\.03-",
    "80\\.03-",
    "cache-aside",
    "backpressure-and-flow-control",
    "modular-monolith",
    "80\\.08-",
  ],
  [
    "10\\.4.*server-components",
    "10\\.4.*route-handlers",
    "10\\.4.*caching",
    "10\\.4.*hydration",
    "10\\.4.*streaming",
    "10\\.4.*interview",
  ],
  [
    "react-hook-form",
    "20\\.3\\.1\\.01",
    "20\\.4\\.3\\.01",
    "80\\.18-",
    "80\\.29-",
    "80\\.30-",
  ],
  ["80\\.18-", "70\\.2-", "80\\.30-", "80\\.03-", "70\\.1\\.01", "80\\.30-"],
  [
    "advanced-generics",
    "variance",
    "20\\.1.*memory",
    "backpressure",
    "20\\.1.*event-loop",
    "10\\.2.*interview",
  ],
  [
    "40\\.1.*network",
    "20\\.5.*authorization",
    "threat-model",
    "backups-pitr",
    "cost",
    "80\\.08-",
  ],
  [
    "10\\.3\\.3\\.06-state-management",
    "60.*order",
    "60.*reconnect",
    "80\\.08-",
    "80\\.08-",
    "80\\.08-",
  ],
  [
    "80\\.03-",
    "70\\.1\\.03",
    "70\\.1\\.02",
    "70\\.1\\.03",
    "40\\.4\\.3\\.02-alerting",
    "80\\.30-",
  ],
  [],
];
const finalReferences = [
  "80.29-topic-brushup-roadmap.md",
  "80.32-company-prep-sheets.md",
  "80.18-resume-claim-crosswalk.md",
  "80.33-weekly-study-tracker.md",
].map((file) => "80-lanes-abroad-full-stack/" + file);
const js = "10-frontend/10.1-javascript/";
const firstWeek = [
  [
    js + "01-execution-and-scope/10.1.1.01-execution-context.md",
    js + "01-execution-and-scope/10.1.1.02-scope.md",
    js + "01-execution-and-scope/10.1.1.06-closures.md",
  ],
  [
    js + "02-objects-prototypes-this/10.1.2.01-this.md",
    js + "02-objects-prototypes-this/10.1.2.02-prototypes.md",
    "10-frontend/10.2-typescript/01-foundations/10.2.1.03-type-narrowing.md",
  ],
  [
    js + "03-async-concurrency/10.1.3.01-event-loop.md",
    js + "03-async-concurrency/10.1.3.02-promises.md",
    js + "03-async-concurrency/10.1.3.03-async-await.md",
  ],
  [
    js + "03-async-concurrency/10.1.3.04-error-handling.md",
    js + "03-async-concurrency/10.1.3.05-abort-and-cancellation.md",
    js + "03-async-concurrency/10.1.3.06-bounded-concurrency.md",
  ],
  [
    "10-frontend/10.2-typescript/01-foundations/10.2.1.01-types-vs-interfaces.md",
    "10-frontend/10.5-form-handling/10.5.02-zod.md",
  ],
  [js + "03-async-concurrency/10.1.3.02-promises.md"],
];
const allocations = [
  ["Applications and qualification", 16],
  ["Hiring conversations and outreach", 7],
  ["Interviews and practical preparation", 12],
  ["Project proof or paid delivery", 10],
  ["OSS contribution", 4],
  ["Targeted study", 3],
  ["German", 5],
  ["Documents, review and planning", 3],
].map(([label, hours]) => ({ label, hours }));
const forwardRole =
  "Full-stack only: require meaningful frontend plus backend/API/database ownership and explicit remote eligibility from India, or employer-supported relocation followed by permitted remote EU/Germany work. Review lower pay; record actual compensation, hours and engagement separately. Drafts, submissions and replies have separate states.";
export function generateStudyDayRoadmap(base, curriculum, options = {}) {
  if (!isGermanyRoadmap(base))
    throw new Error(
      "Valid existing roadmap required; do not reseed the account",
    );
  const skillMap = new Map(
    (options.skillMatrix?.skills ?? []).map((skill) => [skill.skillId, skill]),
  );
  if (
    options.skillMatrix &&
    forwardThemes.some((theme) => !skillMap.has(theme[1]))
  )
    throw new Error("Private skill map omits a scheduled skill family");
  const knownClaims = new Set(
    (options.skillMatrix?.claims ?? []).map((claim) => claim.claimId),
  );
  if (
    options.skillMatrix &&
    [...skillMap.values()].some((skill) =>
      skill.claimIds.some((id) => !knownClaims.has(id)),
    )
  )
    throw new Error("Private skill map contains an orphaned resume claim");
  const roleQueue = options.roleQueue ?? [];
  if (
    !Array.isArray(roleQueue) ||
    new Set(roleQueue.map((r) => r.id)).size !== roleQueue.length ||
    !roleQueue.every(
      (r) =>
        /^[a-z][a-z0-9-]{1,80}-fullstack$/.test(r.id) &&
        [r.title, r.status, r.action].every(
          (v) => typeof v === "string" && v.length > 0,
        ) &&
        /^https:\/\//.test(r.url),
    )
  )
    throw new Error("Invalid private role queue");
  const catalogue =
    curriculum.chapters ?? curriculum.days.flatMap((d) => d.chapters);
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  if (!catalogue.length || byId.size !== catalogue.length)
    throw new Error("Unique current Bible catalogue required");
  for (const path of firstWeek.flat())
    if (!byId.has(path))
      throw new Error("Assigned chapter absent from current Bible: " + path);
  const dates = studyDates();
  const provenance = "fullstack-remote:2026-10-26:v3";
  let previousStudy;
  const days = dates.map((date, index) => {
    const week = Math.floor(index / 6);
    const theme = forwardThemes[week];
    const [mechanism, projectCase, codingCase] = dailyCases[week][index % 6];
    const taskSkills =
      index === 1
        ? ["js-runtime", "typescript"]
        : index === 4
          ? ["typescript", "api-contracts"]
          : [theme[1]];
    const candidates = catalogue.filter((c) => lessonScopes[week].test(c.id));
    if (!candidates.length)
      throw new Error("No canonical reference for " + theme[0]);
    const terms = mechanism
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(
        (term) =>
          term.length > 3 &&
          ![
            "react",
            "postgresql",
            "typescript",
            "next",
            "case",
            "retest",
            "changed",
            "boundary",
            "role",
            "driven",
          ].includes(term),
      );
    const ranked = candidates
      .map((chapter) => ({
        chapter,
        score: terms.filter((term) =>
          (chapter.title + " " + chapter.id).toLowerCase().includes(term),
        ).length,
      }))
      .sort((a, b) => b.score - a.score);
    const preferredPattern = preferredReferences[week][index % 6];
    const preferred = preferredPattern
      ? catalogue.find((c) => new RegExp(preferredPattern).test(c.id))
      : undefined;
    const primaryReference =
      preferred ??
      (ranked[0].score
        ? ranked[0].chapter
        : candidates[(index % 6) % candidates.length]);
    const selected =
      index < 6
        ? firstWeek[index].map((id) => byId.get(id))
        : week === 16
          ? [byId.get(finalReferences[index % 6])]
          : week === 14 && /\bAI\b/.test(mechanism)
            ? [
                byId.get(
                  "80-lanes-abroad-full-stack/80.08-system-design-case-bank.md",
                ),
              ]
            : [primaryReference];
    if (selected.some((chapter) => !chapter))
      throw new Error("Missing canonical reference for " + mechanism);
    const links = selected
      .map((c) => `[${c.title}](${c.studyUrl})`)
      .join(" · ");
    const studyId = studyAssignmentId(
      date,
      "study",
      studyDaySlots(date).find(([, k]) => k === "study")[0],
    );
    const dependencies = previousStudy ? [previousStudy] : [];
    const recall = [1, 7, 21]
      .map((offset) => {
        const d = new Date(date + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() - offset);
        return dates.filter((v) => v <= d.toISOString().slice(0, 10)).at(-1);
      })
      .filter(Boolean);
    const assignments = studyDaySlots(date).map(([range, kind]) => {
      const [a, b] = range
        .split("-")
        .map((t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3)));
      const technical = [
        "study",
        "project",
        "coding",
        "speaking",
        "assessment",
        "mock",
      ].includes(kind);
      const instructions = {
        study: `Recall ${mechanism.toLowerCase()} before opening the source. Choose one linked mechanism, predict a small case and correct the observed misconception within 30 minutes.`,
        project: projectCase,
        coding: codingCase,
        speaking: `Record a three-minute explanation of ${mechanism.toLowerCase()} using the actual artifact. State the invariant, personal contribution, one trade-off and one failure boundary; replay, correct and retry within 30 minutes.`,
        assessment: `Use 90 minutes for an unaided changed-case attempt: ${codingCase} Use the remaining 30 minutes to score the actual result and repair one observed gap. Do not add a separate coding or speaking block.`,
        mock: `Use the existing round rubric for a changed-case mock: ${projectCase} Keep attempt, scoring and one repair inside this two-hour block.`,
      };
      const instruction = technical
        ? instructions[kind]
        : ["applications", "funnel", "network"].includes(kind)
          ? forwardRole
          : kind === "oss"
            ? "Use one scoped contribution or synthetic public proof. Read contribution/AI policy, reproduce the actual issue, run required checks and retain limitations. Preparation never implies submission or merge."
            : kind === "german"
              ? "Practice beginner German: retrieve 15m, listen/study 20m, speak 15m and write/correct 10m. Retain the actual gap; do not infer a CEFR level."
              : "Review actual evidence, failed attempts and hiring states; choose one next action by replacing a lower-priority block. Sunday remains free.";
      const technicalSteps =
        kind === "study"
          ? [
              "Retrieve the prerequisite from memory for five minutes before reopening a source.",
              "Read only the relevant section for fifteen minutes; other links are references, not extra required chapters.",
              "Predict and trace one small changed case for ten minutes, then save the correction and one remaining question.",
            ]
          : kind === "project"
            ? [
                "Use fifteen minutes to identify the current revision, synthetic fixture and success/failure contract.",
                `Use seventy-five minutes for this bounded case: ${projectCase}`,
                "Use twenty minutes for meaningful checks, including an input that would fail without the intended boundary.",
                "Use ten minutes to save the exact commands, observed output, revision, synthetic/mocked boundaries and remaining limitation.",
              ]
            : kind === "coding"
              ? [
                  "Use ten minutes to state inputs, outputs, invariant and boundary cases; start the unaided timer.",
                  `Attempt for fifty minutes without the previous solution: ${codingCase}`,
                  "Use twenty minutes to execute boundary cases; preserve the failed attempt before a hint.",
                  "Use ten minutes to explain complexity, one alternative and the next changed-case repair.",
                ]
              : kind === "speaking"
                ? [
                    "Record a three-minute answer, then listen for unsupported claims and unclear causal steps.",
                    "State one invariant, the observed result, an alternative and a failure boundary using your actual contribution.",
                    "Record the corrected answer; use the remaining time to note one specific gap rather than adding another topic.",
                  ]
                : [
                    instruction,
                    "Use the existing rubric and tool policy; preserve the original attempt, actual score, critical failure and assistance label.",
                    "Repair one observed dimension inside the same two-hour window; a retake later replaces another practice block.",
                  ];
      const deliverable =
        kind === "study"
          ? "A short unaided recall note, predicted and observed trace, source link, one correction and one remaining question."
          : kind === "project"
            ? "A runnable synthetic slice or actual source trace, revision, fixture, exact checks/output and an explicit list of mocked or unexecuted boundaries."
            : kind === "coding"
              ? "The timed original solution, inputs and boundary-test results, assistance used, complexity explanation and the next changed-case repair."
              : kind === "speaking"
                ? "Original and corrected three-minute recordings with one actual contribution, one trade-off, one failure boundary and a scored clarity gap."
                : technical
                  ? "The original timed attempt, prompt/version, tool use, actual rubric scores, critical failures and one retained repair."
                  : "Dated evidence of the actual stage, source or practice result, with the next action and unresolved conditions.";
      return {
        id: studyAssignmentId(date, kind, range),
        date,
        range,
        minutes: b - a,
        kind,
        title: technical ? `${names[kind]}: ${mechanism}` : names[kind],
        outcome: instruction,
        brief: `${instruction}\n\n${technical ? links : ["applications", "funnel", "network"].includes(kind) ? "Apply only to a currently live, suitable full-stack remote role. Country labels alone do not establish India eligibility." : "Use the named output within this existing block; retain uncertainty and actual progress."}${kind === "study" && index === 5 ? `\n\n[Async revision](https://study.buildora.work/${js}03-async-concurrency/REVISION.md)` : ""}${kind === "study" ? `\n\nChoose one mechanism within this 30-minute block. Other links are references, not a requirement to master several chapters. Recall earlier attempts from ${recall.join(", ") || "the diagnostic"} within existing time.` : ""}`,
        steps: technical
          ? technicalSteps
          : [
              instruction,
              "Record the actual outcome, uncertainty and dated next action. Keep unsent or unsubmitted work in draft state.",
            ],
        deliverable,
        doneCheck: technical
          ? `The saved ${kind} artifact satisfies its named output and retains observed failures and limitations. Inspect it before the separate verification action; an elapsed block cannot verify the skill.`
          : "The record reflects a real outcome and its limits. Prepared applications/messages remain drafts until actually sent.",
        dependency: technical
          ? "Trace the previous prerequisite attempt first. If its mechanism is unclear, replace today's new scope with the smallest repair; do not create catch-up debt."
          : ["applications", "funnel", "network"].includes(kind)
            ? "Use the exact live full-stack vacancy, actual private CV variant, India eligibility or confirmed relocation route, true hiring stage and compensation/hours conditions. Review lower pay without treating it as acceptance."
            : (prerequisites[kind] ?? prerequisites.review),
        blocked: blockedActions[kind] ?? blockedActions.review,
        chapterIds: technical ? selected.map((c) => c.id) : [],
        prerequisiteAssignmentIds: technical
          ? kind === "study"
            ? dependencies
            : index % 6 === 5
              ? dependencies
              : [studyId]
          : [],
        skillIds: technical ? taskSkills : [],
        relatedRoleIds: roleQueue.length
          ? roleQueue.map((role) => role.id)
          : [
              "particle41-fullstack",
              "tempo-fullstack",
              "bjak-fullstack",
              "csc-generation-fullstack",
            ],
        relatedClaimIds: technical
          ? [
              ...new Set(
                taskSkills.flatMap(
                  (id) => skillMap.get(id)?.claimIds ?? ["docita-product"],
                ),
              ),
            ]
          : [],
        provenance,
      };
    });
    previousStudy = studyId;
    return { date, assignments };
  });
  const jobPlan = {
    version: 3,
    effectiveOn: STUDY_PLAN_START,
    endDate: STUDY_PLAN_END,
    studyDayCount: 100,
    timezone: "Asia/Kolkata",
    weeklyMinutes: 3600,
    sourceDigest: digest(
      JSON.stringify([provenance, curriculum.sourceDigest, days]),
    ),
    catalogueChapterIds: [...byId.keys()],
    knownSkillIds: [...new Set(forwardThemes.map((theme) => theme[1]))],
    knownRoleIds: roleQueue.length
      ? roleQueue.map((role) => role.id)
      : [
          "particle41-fullstack",
          "tempo-fullstack",
          "bjak-fullstack",
          "csc-generation-fullstack",
        ],
    knownClaimIds: options.skillMatrix ? [...knownClaims] : ["docita-product"],
    provenance,
    days,
  };
  if (!isJobPlan(jobPlan))
    throw new Error(
      "Forward assignment capacity, chapters or prerequisites failed validation",
    );
  const weeks = forwardThemes.map((theme, i) => {
    const start = dates[i * 6],
      end = dates[Math.min(i * 6 + 5, 99)];
    return {
      number: i + 1,
      start,
      end,
      study: theme[0],
      deliverable: theme[3],
      campaign: forwardRole,
      items: [
        {
          id: `${provenance}:week:${i + 1}:review`,
          text: `Review observed evidence: ${theme[0]}`,
          evidenceType: "note",
          estimatedMinutes: 0,
          acceptanceCriteria:
            "Record demonstrated, working, learning and unverified skills separately. Retain the highest-value remaining gap and dated next replacement.",
        },
      ],
    };
  });
  const execution = {
    ...base.execution,
    version: 2,
    jobPlan,
    days: days.map((d, i) => ({
      id: `fullstack:${STUDY_PLAN_START}:day:${d.date}`,
      date: d.date,
      week: Math.floor(i / 6) + 1,
      title: `${d.date} · ${dailyCases[Math.floor(i / 6)][i % 6][0]}`,
      blocks: Object.fromEntries(d.assignments.map((a) => [a.kind, a.brief])),
    })),
    weeks: weeks.map((w) => ({
      number: w.number,
      application: forwardRole,
      tuesday: forwardRole,
      thursday: forwardRole,
      oss: {
        monday: "One scoped contribution or public proof",
        wednesday: "Continue the same contribution",
        friday: "Check actual tests/review state",
      },
      german: "Beginner German practice",
      germanCheck: "Retain a corrected spoken/written example",
      relocation:
        "Verify an actual remote offer's country, engagement and relocation conditions",
    })),
    assessments: days
      .filter((d) =>
        d.assignments.some((a) => a.kind === "assessment" || a.kind === "mock"),
      )
      .map((d, i) => ({
        id: `${provenance}:assessment:${i + 1}`,
        date: d.date,
        time: d.assignments.find(
          (a) => a.kind === "assessment" || a.kind === "mock",
        ).range,
        content: d.assignments.find(
          (a) => a.kind === "assessment" || a.kind === "mock",
        ).brief,
      })),
    companies: roleQueue.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      action: `[Exact role](${r.url})\n\n${r.action}`,
    })),
    posts: [],
    guides: [
      {
        id: "design",
        title: "100-study-day full-stack remote execution",
        content:
          "# Current schedule\n\n100 Monday–Saturday study days, 26 October 2026–18 February 2027. Five 11-hour weekdays and a five-hour Saturday; Sunday free. Study at 06:30–07:00 protects the existing health, lunch, family, dinner and sleep anchors. Read one mechanism selectively; references do not create a mastery quota. Employer stages replace matching practice blocks.",
      },
      {
        id: "campaign",
        title: "Full-stack remote role qualification",
        content: options.campaignMarkdown ?? forwardRole,
      },
      {
        id: "daily",
        title: "Learning and evidence",
        content:
          "Follow the dated canonical links, numbered experiment, prerequisite and blocker. Save actual evidence, then verify separately. Revisit earlier attempts at approximately 1, 7 and 21 days within existing blocks.",
      },
      {
        id: "exams",
        title: "Changed-prompt assessments",
        content:
          "Reuse the round rubrics. Preserve all earlier attempts and assistance labels. A calendar checkpoint neither certifies mastery nor promises employment.",
      },
    ],
  };
  const result = {
    ...base,
    version: 2,
    startDate: STUDY_PLAN_START,
    endDate: STUDY_PLAN_END,
    reviewedOn: "2026-10-25",
    target:
      "Full-stack engineering — remote India/global; remote EU/Germany through verified eligibility or relocation; compensation flexible for review",
    sourceDigest: digest(
      JSON.stringify([
        jobPlan.sourceDigest,
        weeks,
        roleQueue,
        options.campaignMarkdown ?? forwardRole,
        options.skillMatrix ?? null,
        options.campaignPresentation ?? null,
      ]),
    ),
    catalogueChapterIds: [...byId.keys()],
    ...(options.campaignPresentation
      ? { campaignPresentation: options.campaignPresentation }
      : {}),
    weeks,
    allocations,
    execution,
    sections: [
      { title: "Forward learning and hiring revision", content: forwardRole },
    ],
    sources: [
      {
        label: "Canonical learning catalogue",
        url: "https://study.buildora.work",
      },
    ],
  };
  if (!isGermanyRoadmap(result))
    throw new Error("Forward roadmap failed compatible schema validation");
  return result;
}
export function mapStudyAssignments(plan, matrix) {
  if (!isGermanyRoadmap(plan) || plan.version !== 2)
    throw new Error("Validated forward roadmap required");
  const assignments = plan.execution.jobPlan.days.flatMap(
    (day) => day.assignments,
  );
  const skills = matrix.skills.map((skill) => {
    const assigned = assignments.filter((a) =>
      a.skillIds.includes(skill.skillId),
    );
    if (!assigned.length)
      throw new Error("Unscheduled or unknown skill: " + skill.skillId);
    if (
      (
        skill.chapters?.map((chapter) => chapter.biblePath) ?? skill.chapterIds
      ).some((id) => !plan.catalogueChapterIds.includes(id))
    )
      throw new Error(
        "Skill references a missing canonical chapter: " + skill.skillId,
      );
    return {
      ...skill,
      assignmentIds: assigned.map((a) => a.id),
      firstAssignedDate: assigned[0].date,
    };
  });
  if (
    new Set(skills.map((s) => s.skillId)).size !==
    plan.execution.jobPlan.knownSkillIds.length
  )
    throw new Error("Private map omits a scheduled skill family");
  return {
    version: 1,
    generatedOn: plan.reviewedOn,
    sourceDigest: plan.sourceDigest,
    matrixDigest: digest(JSON.stringify(matrix)),
    policy: "Scheduling or agent checks never verify candidate skills",
    skills,
    roles: matrix.roles.map((role) => ({
      ...role,
      assignmentIds: assignments
        .filter((a) => a.relatedRoleIds.includes(role.roleId))
        .map((a) => a.id),
    })),
  };
}
export function studyDayCalendar(plan) {
  return (
    `# Full-stack remote — 100 study days\n\nVersion 3; timezone Asia/Kolkata. ${plan.startDate}–${plan.endDate}. Sunday free. Elapsed study is not verified readiness.\n\n` +
    plan.execution.jobPlan.days
      .map(
        (d, i) =>
          `## Study day ${i + 1}: ${d.date}\n\n` +
          d.assignments
            .map(
              (a) =>
                `### ${a.range} · ${a.minutes}m — ${a.title}\n\n${a.brief}\n\n${a.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**Save:** ${a.deliverable}\n\n**Before starting:** ${a.dependency}\n\n**If blocked:** ${a.blocked}\n\n**Assignment:** ${a.id}`,
            )
            .join("\n\n"),
      )
      .join("\n\n")
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv[2] === "--study-days") {
    const paths = process.argv.slice(3, 7).map((p) => resolve(p));
    if (paths.length !== 4)
      throw new Error(
        "Usage: generate-job-plan.mjs --study-days PRIVATE_BASELINE CATALOGUE_JSON PRIVATE_OUTPUT_JSON PRIVATE_CALENDAR_MD",
      );
    const [baseline, catalogue] = paths;
    assertPrivateWorkspacePath(baseline);
    const output = assertFreshPrivateOutputPath(paths[2]);
    const calendar = assertFreshPrivateOutputPath(paths[3]);
    if (new Set(paths).size !== paths.length)
      throw new Error("Output must not overwrite a source");
    const optional = (flag) => {
      const path = process.argv
        .find((arg) => arg.startsWith(flag + "="))
        ?.slice(flag.length + 1);
      if (!path) return undefined;
      const file = assertPrivateWorkspacePath(path);
      return readFileSync(file, "utf8");
    };
    const roles = optional("--roles"),
      matrix = optional("--matrix"),
      presentation = optional("--presentation"),
      campaignMarkdown = optional("--campaign");
    const plan = generateStudyDayRoadmap(
      JSON.parse(readFileSync(baseline, "utf8")),
      JSON.parse(readFileSync(catalogue, "utf8")),
      {
        ...(roles ? { roleQueue: JSON.parse(roles) } : {}),
        ...(matrix ? { skillMatrix: JSON.parse(matrix) } : {}),
        ...(presentation
          ? { campaignPresentation: JSON.parse(presentation) }
          : {}),
        ...(campaignMarkdown ? { campaignMarkdown } : {}),
      },
    );
    const mapPath = process.argv
      .find((arg) => arg.startsWith("--map="))
      ?.slice(6);
    const mapOutput = mapPath
      ? assertFreshPrivateOutputPath(mapPath)
      : undefined;
    const outputs = [output, calendar, ...(mapOutput ? [mapOutput] : [])];
    if (
      new Set(outputs).size !== outputs.length ||
      outputs.some((path) => [baseline, catalogue].includes(path))
    )
      throw new Error(
        "Outputs must be distinct and must not overwrite a source",
      );
    if (mapOutput && !matrix)
      throw new Error("Private assignment map requires a matrix");
    const assignmentMap = mapOutput
      ? mapStudyAssignments(plan, JSON.parse(matrix))
      : undefined;
    writeFileSync(output, JSON.stringify(plan, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    writeFileSync(calendar, studyDayCalendar(plan), {
      mode: 0o600,
      flag: "wx",
    });
    if (mapOutput)
      writeFileSync(mapOutput, JSON.stringify(assignmentMap, null, 2) + "\n", {
        mode: 0o600,
        flag: "wx",
      });
    console.log(
      "Generated 100 capacity-checked study days. Account data unchanged.",
    );
    process.exit(0);
  }
  const paths = process.argv.slice(2).map((p) => resolve(p));
  if (paths.length !== 4)
    throw new Error(
      "Usage: node --experimental-strip-types scripts/generate-job-plan.mjs PRIVATE_BASELINE PRIVATE_CALENDAR PRIVATE_DESIGN PRIVATE_OUTPUT",
    );
  const [baseline, calendar, design, output] = paths;
  for (const path of [baseline, calendar, design, dirname(output)]) {
    const actual = realpathSync(path);
    if (
      !["/80-lanes-abroad-full-stack/personal/", "/repos/personal/"].some(
        (root) => actual.includes(root),
      )
    )
      throw new Error(
        "All inputs/output must remain in the canonical private personal directory",
      );
  }
  if (paths.slice(0, 3).includes(output))
    throw new Error("Output must not overwrite authoring sources");
  const result = generateJobPlan(
    JSON.parse(readFileSync(baseline, "utf8")),
    readFileSync(calendar, "utf8"),
    readFileSync(design, "utf8"),
  );
  writeFileSync(output, JSON.stringify(result, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  console.log(
    "Generated 72 linked workdays at 60 hours/week. Account data unchanged.",
  );
}
