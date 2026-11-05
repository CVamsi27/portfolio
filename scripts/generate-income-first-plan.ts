/** Explicit private authoring only: no account requests and no public personal payload. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type GermanyRoadmap,
  isGermanyRoadmap,
} from "../src/lib/germany-roadmap.ts";
import {
  incomeFirstAssignmentId,
  type JobAssignment,
  type JobKind,
} from "../src/lib/job-plan.ts";
import {
  incomeFirstDaySlots,
  INCOME_FIRST_SCHEDULE_REVISION,
} from "../src/lib/personal-timetable.ts";
import {
  assertPrivateWorkspacePath,
  assertFreshPrivateOutputPath,
} from "./private-workspace.ts";

const revision = INCOME_FIRST_SCHEDULE_REVISION;
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const guide =
  "From 5 November 2026, use 32 focused hours per full week: six hours Monday–Friday, two hours Saturday and Sunday off. Prioritize hiring replies, suitable applications and specific paid-work conversations. Interviews and paid delivery replace preparation. Reuse existing project proof; the curriculum is a reference and OSS is optional. Keep drafts, actual submissions, replies, agreements and payments separate. Check the 13 November outreach cohort only after five weekdays; 30 November is an income checkpoint, not an offer or payment forecast. Continue this workload after the checkpoint until you choose a revision.";
const detail: Partial<
  Record<JobKind, { title: string; outcome: string; steps: string[] }>
> = {
  applications: {
    title: "Applications and hiring replies",
    outcome:
      "Handle current hiring replies, qualify suitable roles and record actual submissions separately from drafts.",
    steps: [
      "Check booked interviews, hiring replies and exact role eligibility first.",
      "Tailor existing truthful evidence to the selected role; apply only through the reviewed employer route when you choose to.",
      "Record the actual submission date and confirmation, or leave the material marked prepared; set the next follow-up.",
    ],
  },
  network: {
    title: "Contracts and referral conversations",
    outcome:
      "Find a concrete paid requirement and its next conversation; distinguish enquiries from proposals.",
    steps: [
      "Review existing warm contacts and current client replies before finding new contacts.",
      "Prepare a specific enquiry or scoped paid diagnostic against a real requirement; review recipient and wording before sending.",
      "Record actual conversations, proposals, terms and next action. Ask about hours, start and first payment without inventing a pay floor.",
    ],
  },
  project: {
    title: "Paid delivery or existing project proof",
    outcome:
      "Deliver one agreed outcome or package a reproducible existing feature with its real limits.",
    steps: [
      "Choose paid delivery or an employer task first; otherwise use an existing project artifact.",
      "Implement or demonstrate one observable result, run relevant checks and retain the actual output.",
      "Record the outcome and remaining gap; avoid starting a new application or broad OSS project to postpone applications.",
    ],
  },
  coding: {
    title: "Practical interview preparation",
    outcome:
      "Attempt one role-relevant problem, correct one gap and retest a changed case.",
    steps: [
      "Use the current job description or last observed interview gap to choose one exercise.",
      "Attempt it independently for 25 minutes, then use 10 minutes of targeted reference and 20 minutes of changed-case repair.",
      "Use five minutes to retain the original attempt, assistance label, correction and next question.",
    ],
  },
  review: {
    title: "Follow-ups and records",
    outcome:
      "Record actual actions, first-payment dates and the next three priorities.",
    steps: [
      "Check due follow-ups and interview logistics; a reply replaces an automatic follow-up suggestion.",
      "Record what was actually sent, agreed or received, keeping payment currencies separate.",
      "Choose the next three specific actions and stop; pending recent outreach is not a rejection.",
    ],
  },
};

export function generateIncomeFirstPlan(base: GermanyRoadmap): GermanyRoadmap {
  if (
    !isGermanyRoadmap(base) ||
    base.version !== 2 ||
    !base.execution?.jobPlan ||
    ![3, 4].includes(base.execution.jobPlan.version)
  )
    throw new Error("A validated forward roadmap is required");
  if (base.execution.jobPlan.version === 4) return structuredClone(base);
  const result = structuredClone(base),
    execution = result.execution!,
    job = execution.jobPlan!;
  const previous = job.scheduleRevision;
  job.version = 4;
  job.weeklyMinutes = 1920;
  job.scheduleRevision = structuredClone(revision);
  if (previous) job.previousScheduleRevision = previous;
  job.days = job.days.map((day) => {
    if (day.date < revision.effectiveOn) return day;
    const saturday = new Date(`${day.date}T12:00:00Z`).getUTCDay() === 6;
    return {
      ...day,
      assignments: incomeFirstDaySlots(day.date).map(
        ([range, kind]): JobAssignment => {
          const spec = detail[kind]!;
          const source = day.assignments.find(
            (a) =>
              a.kind === kind || (kind === "coding" && a.kind === "assessment"),
          );
          const [start, end] = range
            .split("-")
            .map(
              (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3)),
            );
          return {
            id: incomeFirstAssignmentId(day.date, kind),
            date: day.date,
            range,
            minutes: end - start,
            kind,
            title: saturday ? "Weekly review or a mock interview" : spec.title,
            outcome: saturday
              ? "Review actual pipeline outcomes or replace this review with a two-hour mock and debrief."
              : spec.outcome,
            brief: saturday
              ? `${guide} Use these two hours for the weekly review or one mock; do not add a second block.`
              : guide,
            steps: saturday
              ? [
                  "Review actual applications, conversations and payment dates, or run one role-relevant mock with its existing rubric.",
                  "Retain the specific next action or changed-case repair and stop within the two-hour allocation.",
                ]
              : spec.steps,
            deliverable:
              "A dated actual outcome, evidence or a clear blocker; no automatic completion from elapsed time.",
            doneCheck:
              "The recorded result distinguishes preparation, actual actions and any unresolved uncertainty.",
            dependency:
              "Open the selected role, previous result or agreed client requirement before starting.",
            blocked:
              "Record the missing information and take the next suitable action within the same time budget.",
            chapterIds: source?.chapterIds ?? [],
            prerequisiteAssignmentIds: [],
            skillIds: ["project", "coding"].includes(kind)
              ? source?.skillIds?.length
                ? source.skillIds
                : job.knownSkillIds!.slice(0, 1)
              : [],
            relatedRoleIds: [],
            relatedClaimIds: [],
            provenance: "income-first:2026-11-05",
          };
        },
      ),
    };
  });
  job.sourceDigest = digest([base.sourceDigest, revision, job.days]);
  const byDate = new Map(job.days.map((day) => [day.date, day]));
  execution.days = execution.days.map((day) =>
    day.date < revision.effectiveOn
      ? day
      : {
          ...day,
          title: `${day.date} · Income-first career work`,
          blocks: Object.fromEntries(
            byDate.get(day.date)!.assignments.map((a) => [a.kind, a.brief]),
          ),
        },
  );
  // Planned assessment appointments are replaced; actual attempts live in career_execution_state and remain untouched.
  execution.assessments = execution.assessments.filter(
    (a) => a.date < revision.effectiveOn,
  );
  execution.guides = execution.guides.map((item) =>
    item.id === "design" || item.id === "campaign"
      ? {
          ...item,
          title:
            item.id === "design"
              ? "32-hour income-first schedule"
              : "Applications and paid-work conversations",
          content: guide,
        }
      : item,
  );
  execution.weeks = execution.weeks.map((week, index) =>
    result.weeks[index].end < revision.effectiveOn
      ? week
      : {
          ...week,
          application: guide,
          tuesday:
            "Relevant hiring or paid-work conversations inside the scheduled contract block.",
          thursday:
            "Continue specific conversations and existing requirements; proposals and enquiries remain separate.",
          oss: {
            monday:
              "Optional only when tied to a current opportunity; replace existing proof time.",
            wednesday: "Optional continuation within the same budget.",
            friday: "Review actual results; no mandatory PR quota.",
          },
          german:
            "Optional reference; no required language-study block in this campaign.",
          germanCheck: "Do not infer language proficiency from elapsed study.",
          relocation:
            "Review only a real role's engagement and work-authorization requirements; India remote and Hyderabad first.",
        },
  );
  result.weeks = result.weeks.map((week) =>
    week.end < revision.effectiveOn
      ? week
      : {
          ...week,
          study: "Targeted practical preparation",
          deliverable:
            "Actual hiring and paid-work outcomes with a clear next action",
          campaign: guide,
          items: [
            {
              id: `income-first:2026-11-05:week:${week.number}:review`,
              text: "Review the actual career pipeline and next actions",
              evidenceType: "note" as const,
              estimatedMinutes: 0,
              acceptanceCriteria:
                "Separate applications, conversations, proposals, agreements and payments; retain pending items and the next dated action.",
            },
          ],
        },
  );
  const hours = [10, 7.5, 5, 5, 0, 0, 0, 4.5];
  result.allocations = result.allocations.map((allocation, index) => ({
    ...allocation,
    hours: hours[index],
  }));
  result.target =
    "Income-first full-stack work: India-eligible remote or Hyderabad onsite/hybrid, with paid contracts and startup applications in parallel. First income by 30 November is a goal, not a forecast.";
  result.reviewedOn = revision.effectiveOn;
  result.sections = [{ title: "Income-first career workflow", content: guide }];
  result.sourceDigest = digest([
    job.sourceDigest,
    result.allocations,
    result.weeks,
    result.sections,
  ]);
  if (!isGermanyRoadmap(result))
    throw new Error(
      "Income-first plan failed capacity, identity or compatibility validation",
    );
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const input = process.argv
    .find((arg) => arg.startsWith("--input="))
    ?.slice(8);
  const output = process.argv
    .find((arg) => arg.startsWith("--output="))
    ?.slice(9);
  if (!input || !output)
    throw new Error(
      "Usage: generate-income-first-plan.ts --input=PRIVATE_PLAN --output=FRESH_PRIVATE_PLAN",
    );
  const target = assertFreshPrivateOutputPath(output);
  const source = assertPrivateWorkspacePath(input);
  const plan = generateIncomeFirstPlan(
    JSON.parse(readFileSync(source, "utf8")),
  );
  writeFileSync(target, JSON.stringify(plan, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  console.log(
    "Generated validated 32-hour private career plan; no account records changed.",
  );
}
