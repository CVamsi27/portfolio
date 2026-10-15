/** Explicit private authoring CLI. Never contacts an account or imports personal content into Next. */
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { isJobPlan } from "../src/lib/job-plan.ts";
import { isGermanyRoadmap } from "../src/lib/germany-roadmap.ts";
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
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const paths = process.argv.slice(2).map((p) => resolve(p));
  if (paths.length !== 4)
    throw new Error(
      "Usage: node --experimental-strip-types scripts/generate-job-plan.mjs PRIVATE_BASELINE PRIVATE_CALENDAR PRIVATE_DESIGN PRIVATE_OUTPUT",
    );
  const [baseline, calendar, design, output] = paths;
  for (const path of [baseline, calendar, design, dirname(output)])
    if (!realpathSync(path).includes("/80-lanes-abroad-full-stack/personal/"))
      throw new Error(
        "All inputs/output must remain in the canonical private personal directory",
      );
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
