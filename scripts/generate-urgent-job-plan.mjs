/** Explicit private authoring only. No account writes, network calls or public personal payload. */
import {
  readFileSync,
  writeFileSync,
  realpathSync,
  existsSync,
  unlinkSync,
} from "node:fs";
import { resolve, dirname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  isJobPlan,
  urgentJobSlots,
  assignmentMarkdown,
} from "../src/lib/job-plan.ts";
import { isGermanyRoadmap } from "../src/lib/germany-roadmap.ts";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const effectiveOn = "2026-10-15";
const campaignLink =
  "[Current remote/Germany campaign](2026-10-10-germany-campaign.md)";
const examsLink = "[Existing prompts and rubrics](2026-10-10-germany-exams.md)";
const titles = {
  applications: "Applications and qualification",
  project: "Project proof or paid delivery",
  network: "Hiring conversations and outreach",
  oss: "OSS contribution",
  study: "Targeted gap repair",
  coding: "Coding interview",
  speaking: "Spoken project story",
  assessment: "Checkpoint and gap repair",
  german: "German practice",
  review: "Evidence and next action",
  funnel: "Applications, replies and funnel",
  mock: "Mock interview and scoring",
  documents: "Documents and relocation",
  planning: "Review and plan next week",
  proof: "Behavioral interview and scoring",
};
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
const sprint = [
  [
    "2026-10-15",
    "project",
    "Run and interpret the original query benchmark without overwriting historical results.",
  ],
  [
    "2026-10-16",
    "project",
    "Trace the benchmark query and both representative plans; explain the composite index mechanism, sort/limit behavior and one index-maintenance cost.",
  ],
  [
    "2026-10-19",
    "project",
    "Recompute p50/p95 from raw samples and trace actual pagination; explain deterministic ordering and endpoint costs excluded by the server-only benchmark.",
  ],
  [
    "2026-10-20",
    "coding",
    "Run the named booking tests and reduced SQL correctness model; explain competing overlaps, accepted adjacency and a different clinician without claiming API integration.",
  ],
  [
    "2026-10-22",
    "project",
    "Run the named payment tests, inspect recorded correctness cases and trace actual settlement; explain under-limit, rollback and duplicate behavior while distinguishing model from Docita.",
  ],
  [
    "2026-10-23",
    "project",
    "Run the named queue tests and inspect correctness results; explain stale/new acknowledgement tokens, fake duplicate effects and the actual recovery boundary.",
  ],
  [
    "2026-10-26",
    "project",
    "Change one benchmark workload in a copy and compare actual plans and recorded measurements.",
  ],
  [
    "2026-10-27",
    "coding",
    "Rehearse the 90-second, five-minute and ten-minute explanations and repair one observed weakness.",
  ],
];
function payFromCampaign(campaign) {
  const hourly = /USD\s+([\d,]+)\/hour minimum/i.exec(campaign);
  const salary = /USD\s+([\d,]+)\s+gross annual base/i.exec(campaign);
  const germany =
    /Germany relocation preferences remain\s+\*\*([^*]+)\*\*/i.exec(campaign);
  const rate = Number(hourly?.[1].replaceAll(",", ""));
  const base = Number(salary?.[1].replaceAll(",", ""));
  if (
    !(rate > 0) ||
    !Number.isFinite(base) ||
    base !== rate * 40 * 52 ||
    !germany ||
    !/both remote contracts and salaried remote jobs/i.test(campaign)
  )
    throw new Error(
      "Private campaign must confirm both remote floors, their 40-hour/52-week comparison and separate Germany preferences",
    );
  return `Remote from India: confirm India eligibility, employee/EOR/contract status, scope and Europe-compatible hours. The confirmed floor is USD ${rate.toLocaleString("en-US")}/hour for contracts and USD ${base.toLocaleString("en-US")} gross annual base at 40 hours/week for salaried remote roles. Keep bonus, equity and benefits separate. Germany relocation remains ${germany[1]}; check language, office attendance and the actual overseas-hiring process separately. Missing pay or eligibility means qualification pending, not an application or automatic rejection.`;
}
function cleanBrief(brief = "") {
  return brief
    .replace(
      /Start with 15m recall, read selectively for 40m, explain\/trace for 25m and source-check for 10m\./g,
      "",
    )
    .replace(
      /Spend 10m defining the boundary, 90m on the smallest slice, 35m on meaningful checks and 15m packaging evidence\./g,
      "",
    )
    .replace(
      /Spend 15m checking current issue\/review status, 75m reproducing\/testing\/fixing and 30m validating and recording the result\./g,
      "",
    )
    .replace(
      /Spend 30m on relevant research, 60m on the useful artifact\/draft and 30m on a clear evidence check and next action\./g,
      "",
    )
    .replace(/ +/g, " ")
    .trim();
}
function guideLinks(markdown) {
  return markdown.replace(/\]\(([^)]+)\)/g, (match, url) => {
    if (/^https:\/\//.test(url)) return match;
    const name = url.split("/").at(-1)?.split("#")[0];
    const aliases = {
      "2026-10-15-urgent-remote-germany-campaign.md":
        "2026-10-10-germany-campaign.md",
      "2026-10-15-germany-hiring-playbook.md": "2026-10-10-germany-campaign.md",
      "2026-10-15-detailed-job-plan-calendar.md":
        "2026-10-10-germany-detailed-roadmap-design.md",
      "2026-10-15-detailed-job-plan-design.md":
        "2026-10-10-germany-detailed-roadmap-design.md",
      "2026-10-10-germany-daily-curriculum.md":
        "2026-10-10-germany-daily-curriculum.md",
      "2026-10-10-germany-exams.md": "2026-10-10-germany-exams.md",
      "2026-10-10-germany-campaign.md": "2026-10-10-germany-campaign.md",
      "2026-10-10-germany-detailed-roadmap-design.md":
        "2026-10-10-germany-detailed-roadmap-design.md",
    };
    return aliases[name] ? `](${aliases[name]})` : match;
  });
}
function steps(kind, minutes, fullLoop = false) {
  switch (kind) {
    case "applications":
      return [
        "Use 20 minutes for due employer replies, deadlines and duplicate checks.",
        "Use 35 minutes to qualify live roles across both queues; resolve pay, location and hours before substantial custom work.",
        "Use 80 minutes for the strongest suitable application packet and supported experience matches.",
        "Use 30 minutes for the requested documents, final role-specific review and candidate-controlled submission.",
        "Use 15 minutes to record draft/submitted status, actual confirmation, exact version and dated next action.",
      ];
    case "project":
      return [
        "Define one boundary and its expected failure for 10 minutes.",
        "Implement, reproduce or deliver the agreed slice for 70 minutes using permitted synthetic inputs.",
        "Run meaningful checks and inspect the actual result for 30 minutes.",
        "Save revision, commands, result, review status and limitations for 10 minutes. Specific take-home clocks in the brief take precedence within the same total time.",
      ];
    case "network":
      return minutes === 120
        ? [
            "Research the relevant role, team or requester for 30 minutes.",
            "Personalize specific conversations or develop the same useful artifact for 70 minutes; one weekly post uses at most one outreach hour.",
            "Review accuracy, prior contact and the useful question for 20 minutes. Record actual sends separately from drafts.",
          ]
        : [
            "Check relevant contacts, due replies and one real role or problem for 15 minutes.",
            "Prepare a useful specific question or bounded paid-task proposal for 35 minutes.",
            "Review factual wording and next action for 10 minutes; drafts remain drafts until actually sent.",
          ];
    case "oss":
      return [
        "Check the issue, contribution/AI rules, overlap and runtime for 10 minutes.",
        "Use 35 minutes for the next small reproduction, regression test, fix or real review response in the same queue.",
        "Run required checks and record current revision, result and actual ready/submitted/reviewed/merged stage for 15 minutes.",
      ];
    case "study":
      return [
        "Retrieve one observed misconception without notes for 5 minutes.",
        "Use one subsection or example from the dated source to repair that gap for 15 minutes; the linked chapter is a reference, not a full reading assignment.",
        "Predict a changed example, check it and save one corrected explanation for 10 minutes.",
      ];
    case "coding":
      return [
        "Clarify contract and boundaries for 10 minutes.",
        "Attempt the existing dated prompt without help for 50 minutes.",
        "Run boundary cases for 20 minutes and explain complexity/trade-offs for 10 minutes.",
      ];
    case "speaking":
      return [
        "Record the assigned answer for 10 minutes.",
        "Listen and score personal contribution and supported detail for 10 minutes.",
        "Record an improved version and name the remaining gap for 10 minutes.",
      ];
    case "assessment":
      return [
        "Complete the existing dated prompt and scoring rules within its 90-minute assessment allowance.",
        "Use 30 minutes for the highest-value repair. The two full-loop Fridays retain R1 60 minutes, R0 30 minutes and 30 minutes for scoring/repair.",
      ];
    case "german":
      return [
        "Retrieve the previous lesson for 15 minutes.",
        "Listen/study the dated material for 20 minutes.",
        "Speak for 15 minutes and write/correct for 10 minutes; report observed ability.",
      ];
    case "review":
      return [
        "Reconcile actual evidence, replies and stages for 10 minutes.",
        "Recall one important mechanism and record its remaining gap for 10 minutes.",
        "Choose tomorrow's first concrete action and at most one replacement priority for 10 minutes.",
      ];
    case "funnel":
      return [
        "Check actual employer replies, deadlines and due follow-ups for 20 minutes.",
        "Qualify the next suitable opportunity or finish its strongest pending packet for 30 minutes.",
        "Record remote/Germany counts, pending constraints and actual next action for 10 minutes; silence is not rejection.",
      ];
    case "mock":
      return fullLoop
        ? [
            "Run R3 10:15–11:15 for 60 minutes and R5 11:15–11:45 for 30 minutes under the existing form/tool rules.",
            "Score R3 11:45–11:55 and R5 11:55–12:05 from the saved attempts, then repair one observed gap 12:05–12:15.",
          ]
        : [
            "Use 90 minutes for the dated existing assessment and its scoring; preserve the prompt, tool limits and rubric.",
            "Use the remaining 30 minutes for a changed-case repair or due interview preparation, keeping the original result separate.",
          ];
    case "proof":
      return [
        "Run the dated R6 behavioral form from 13:00–13:45 using the existing tool rules.",
        "Score R6 from 13:45–14:00 and save actual dimensions, critical failures and one gap. This replaces Saturday OSS, not the rubric.",
      ];
    case "documents":
      return [
        "Use 10 minutes to resolve one dated document or relocation dependency against the official source.",
        "Use 5 minutes to record the source/date, actual status and unresolved next action privately.",
      ];
    case "planning":
      return [
        "Review actual outcomes and one bottleneck for 5 minutes.",
        "Choose one replacement priority from employer stages and observed gaps for 5 minutes.",
        "Record its next action and reassessment date for 5 minutes; keep Sunday free.",
      ];
  }
}
const outcome = (brief) =>
  brief
    .replace(/\[[^\]]+\]\([^)]+\)/g, (s) => s.slice(1, s.indexOf("]")))
    .replace(/[*`]/g, "")
    .split(/(?<=[.!?])\s+/)[0];
function sourceFor(day, kind, allDays, i) {
  return (
    day.assignments.find((a) => a.kind === kind) ??
    (kind === "study"
      ? allDays[i - 1]?.assignments.find((a) => a.kind === kind)
      : null)
  );
}
export function generateUrgentJobPlan(base, campaign, learningPlan) {
  if (
    !isGermanyRoadmap(base) ||
    !base.execution?.jobPlan ||
    base.execution.jobPlan.version !== 1
  )
    throw new Error(
      "A valid explicit legacy detailed baseline is required; do not regenerate from an urgent output",
    );
  const pay = payFromCampaign(campaign);
  if (
    typeof learningPlan !== "string" ||
    learningPlan.trim().length < 40 ||
    !/^## /m.test(learningPlan) ||
    !/```/.test(learningPlan)
  )
    throw new Error(
      "The explicit private learning plan must include its session instructions and runnable command blocks",
    );
  const oldDays = base.execution.jobPlan.days;
  const days = oldDays.map((day, i) => {
    if (day.date < effectiveOn) return structuredClone(day);
    const full = ["2026-12-19", "2027-01-02"].includes(day.date);
    const interviewSession = sprint.findIndex(
      ([date, kind]) => date === day.date && kind === "coding",
    );
    const assignments = urgentJobSlots(day.date).map(([range, kind]) => {
      const source = sourceFor(day, kind, oldDays, i);
      const [start, end] = range
        .split("-")
        .map((s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3)));
      const minutes = end - start;
      let brief = cleanBrief(source?.brief);
      if (kind === "applications")
        brief = `Handle due replies and actual employer stages first, then qualify the strongest live unsubmitted role across the remote and Germany queues. Match three responsibilities to supported MAQ/Docita experience and choose the correct global/EU application CV. ${pay}\n\n${campaignLink}`;
      if (kind === "network")
        brief = `Use a relevant existing conversation, exact role or actual engineering problem. Prepare one personalized question or proposal for a six-to-ten-hour paid task with agreed scope, budget, acceptance checks, review and handoff. ${pay}\n\n${campaignLink}`;
      if (kind === "project")
        brief = `Actual paid delivery, employer take-homes and agreed review deadlines replace this exercise first. Otherwise continue the dated technical theme below, narrowing to one two-hour slice.\n\n${brief}`;
      if (kind === "oss" && !source)
        brief =
          "Continue the same TanStack Query contribution or its single Zod backup: reconcile the current reproduction/test/fix/review stage. Do not start another queue. [Contribution guide](https://github.com/TanStack/query/blob/main/CONTRIBUTING.md) · [AI policy](https://github.com/TanStack/query/blob/main/AI_POLICY.md)";
      if (kind === "study")
        brief = `Repair one gap exposed by a vacancy, interview attempt or actual review. Use one bounded example from this dated reference; remove lower-priority reading.\n\n${brief}`;
      if (kind === "funnel")
        brief = `Resolve due employer actions and review the actual remote/Germany queues. ${pay}\n\n${campaignLink}`;
      if (kind === "documents")
        brief = `Resolve one highest-priority dependency from the dated document topic within fifteen minutes; keep the remaining scope as a later replacement, not extra hours.\n\n${brief}`;
      if (kind === "planning")
        brief =
          "Review raw remote/Germany stages, rates actually offered, unresolved constraints and observed interview gaps. Choose one replacement task and reassessment date from real evidence. The first two working weeks launch the campaign; subsequent weeks continue the live pipeline and dated technical themes rather than restarting the sprint. Keep Sunday free.";
      if (full && kind === "mock")
        brief = `Run the dated R3 and R5 forms with 60 and 30 minutes respectively, then score each for ten minutes and use ten minutes for one repair. Keep existing prompts, permitted tools, versions and thresholds. ${examsLink}`;
      if (full && kind === "proof")
        brief = `Run the dated R6 form for 45 minutes and score for 15 minutes. This one-hour interview block replaces Saturday OSS in the two full-loop weeks: 13 interview hours and 3 OSS hours, with the same 60-hour total. ${examsLink}`;
      if (["2026-12-17", "2026-12-31"].includes(day.date) && kind === "project")
        brief = `The changed take-home ${day.date === "2026-12-17" ? "TH-A" : "TH-B"} starts 11:15–13:15, exactly two hours under its existing prompt and tool rules. Save the time-limited revision and stop; the remaining one hour is tomorrow. ${examsLink}`;
      if (["2026-12-18", "2027-01-01"].includes(day.date) && kind === "project")
        brief = `Finish ${day.date === "2026-12-18" ? "TH-A" : "TH-B"} 11:15–12:15, exactly one hour, stopping implementation at three hours total. Use 12:15–13:15 for inspecting the frozen result and preparing the defense; do not count it as extra implementation. ${examsLink}`;
      const session = sprint.findIndex(
        ([date, slot]) => date === day.date && slot === kind,
      );
      if (session >= 0)
        brief = `Proof sprint session ${session + 1} of 8. ${sprint[session][2]} Use the private eight-session learning route and its exact commands through the current campaign guide. Keep observed synthetic results separate from historical employment/customer impact. These sixteen hours replace six project plus two interview hours in each rolling working week; actual paid work or employer stages may replace them and move completion.\n\n${campaignLink}`;
      if (interviewSession >= 0 && kind === "speaking")
        brief = `Continue proof sprint session ${interviewSession + 1}: use the final 30 minutes to explain the same operation, score the explanation and record its limitation. This is the same two-hour interview session, not another lab.\n\n${campaignLink}`;
      const deliverable =
        kind === "applications" || kind === "network" || kind === "funnel"
          ? "Exact role/contact, pay and eligibility evidence or named question, versioned material, actual draft/sent/submitted stage, confirmation when available and dated next action."
          : (source?.deliverable ??
            "A dated artifact with revision or source, exact observed check, actual review/stage, remaining limitation and next action.");
      return {
        id: `germany:2026:day:${day.date}:assignment:${kind}`,
        date: day.date,
        range,
        minutes,
        kind,
        title: titles[kind],
        outcome: session >= 0 ? sprint[session][2] : outcome(brief),
        brief,
        steps:
          session >= 0
            ? [
                "Use 20 minutes to read the named session and inspect its existing source/test command, input and evidence boundary.",
                "Use 70 minutes to run or trace its assigned operation; record actual observations, failures and assistance.",
                ...(kind === "coding"
                  ? [
                      "Continue in the following speaking block for the remaining 30 minutes of this same two-hour session.",
                    ]
                  : [
                      "Explain the mechanism aloud and answer a changed constraint for 20 minutes.",
                      "Record revision, command, result, limitation and next action for 10 minutes.",
                    ]),
              ]
            : interviewSession >= 0 && kind === "speaking"
              ? [
                  "Explain the same session's operation aloud, then score the explanation against observed evidence for 20 minutes.",
                  "Record the result, limitation and next action for 10 minutes. This completes the existing two-hour session.",
                ]
              : steps(kind, minutes, full),
        deliverable,
        doneCheck: ["applications", "network", "oss", "funnel"].includes(kind)
          ? "The record identifies the actual stage and next action; prepared material is not a submission, send, accepted delivery or merged contribution."
          : "The named artifact has an observed check, remaining limitation and next action. An elapsed block is not evidence of completion.",
        dependency: ["applications", "network", "funnel"].includes(kind)
          ? `Open the exact live role or real conversation, current global/EU CV and actual tracker; verify duplicate contact, pay, location and hours. ${campaignLink}`
          : (source?.dependency ??
            `Open the dated source or current campaign, actual repository/issue status and last observed gap. ${campaignLink}`),
        blocked: ["applications", "network", "funnel"].includes(kind)
          ? "Retain unresolved pay, India eligibility or relocation questions explicitly; use the next suitable lead without lowering the floor, bulk messaging or forcing a count."
          : (source?.blocked ??
            "Record the exact blocker and smallest next action. Replace matching later work; do not add catch-up hours or claim an unobserved outcome."),
      };
    });
    return { date: day.date, assignments };
  });
  // The two interview sessions use their existing coding/speaking IDs and time split.
  // Mark only the coding portion as the session anchor; all eight sessions total 16h.
  const jobPlan = {
    ...base.execution.jobPlan,
    version: 2,
    effectiveOn,
    sourceDigest: digest(
      JSON.stringify([
        base.execution.jobPlan.sourceDigest,
        campaign,
        learningPlan,
        days,
      ]),
    ),
    days,
  };
  if (!isJobPlan(jobPlan))
    throw new Error(
      "Generated urgent assignments failed duration, history, link or shape validation",
    );
  const design = `# Active remote/Germany execution design\n\nEffective ${effectiveOn}, Asia/Kolkata. Use the next four focused hours in the campaign guide inside existing blocks. Workdays before this date retain their original assignments; no history or evidence is backfilled.\n\n| Workstream | Hours/week |\n|---|---:|\n${allocations.map((a) => `| ${a.label} | ${a.hours} |`).join("\n")}\n| **Total** | **60** |\n\nEvery weekday is eleven focused hours and Saturday five; Sunday is free. Wednesday assessments retain 90 minutes plus 30 minutes repair. The two full-loop Saturdays replace OSS with R6: those weeks have 13 interview hours and 3 OSS hours, still 60 total. Keep all existing rubric versions and take-home limits. Actual interviews replace matching practice; actual paid delivery replaces project exercises, followed by lower-priority OSS/posts/reading when necessary.\n\n${pay}\n\nThe eight-session proof sprint runs once through 27 October if employer work does not replace it. Afterwards follow actual delivery/review priorities and the existing dated technical progression. Application and contact counts are workload guides conditional on qualified supply, not completion receipts or employer promises.\n\n${campaignLink}`;
  const execution = {
    ...base.execution,
    jobPlan,
    assessments: base.execution.assessments.map((a) =>
      a.date < effectiveOn
        ? a
        : {
            ...a,
            time: a.id.startsWith("W")
              ? "16:45–18:45 (existing 90-minute assessment +30-minute repair)"
              : "10:15–12:15 (existing assessment/scoring +30-minute repair; full-loop rounds use their dated blocks)",
          },
    ),
    guides: base.execution.guides.map((g) =>
      g.id === "campaign"
        ? {
            ...g,
            title: "Remote and Germany hiring campaign",
            content: `${guideLinks(campaign)}\n\n# Reproduce and explain the measured project — complete learning reference\n\nThe following private source contains the exact commands, eight session checks and interview answers. Preserve historical results and use fresh output paths.\n\n${guideLinks(learningPlan)}`,
          }
        : g.id === "design"
          ? { ...g, title: "60-hour remote/Germany execution", content: design }
          : g,
    ),
  };
  const roadmap = {
    ...base,
    execution,
    allocations,
    target:
      "Full-stack engineer — India-eligible remote employment/paid contracts and Germany relocation",
    reviewedOn: effectiveOn,
    sourceDigest: digest(
      JSON.stringify([base.sourceDigest, jobPlan.sourceDigest]),
    ),
  };
  if (!isGermanyRoadmap(roadmap))
    throw new Error("Generated urgent roadmap failed validation");
  const calendar = `# Active detailed remote/Germany calendar\n\nEffective ${effectiveOn}. Generated from the explicit private baseline and current confirmed campaign. Historical assignment objects before this date are unchanged. No account data changes merely by creating these files.\n\n${design.replace(/^# /, "## ")}\n\n${days.map((d) => `### ${d.date}${d.date < effectiveOn ? " — historical reference; preserve actual evidence" : ""}\n\n${d.assignments.map((a) => `#### ${a.range.replace("-", "–")} · ${a.minutes}m — ${a.title}\n\n${assignmentMarkdown(a)}\n\nAssignment ID: \`${a.id}\``).join("\n\n")}`).join("\n\n")}\n`;
  return { roadmap, calendar };
}
function privatePath(path, output = false) {
  const resolved = resolve(path);
  const actual = realpathSync(output ? dirname(resolved) : resolved);
  if (!actual.includes(`${sep}80-lanes-abroad-full-stack${sep}personal${sep}`))
    throw new Error(
      "All authoring inputs and outputs must remain in the canonical private personal directory",
    );
  return resolved;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = process.argv.slice(2);
  const expected = [
    "--baseline",
    "--campaign",
    "--learning-plan",
    "--output",
    "--calendar-output",
  ];
  if (args.length !== 10 || expected.some((flag, i) => args[i * 2] !== flag))
    throw new Error(
      "Usage: node --experimental-strip-types scripts/generate-urgent-job-plan.mjs --baseline PRIVATE_BASELINE.json --campaign PRIVATE_CAMPAIGN.md --learning-plan PRIVATE_LEARNING.md --output PRIVATE_URGENT.json --calendar-output PRIVATE_CALENDAR.md",
    );
  const [baseline, campaign, learningPlan, output, calendarOutput] =
    expected.map((_, i) => privatePath(args[i * 2 + 1], i >= 3));
  if (
    new Set([baseline, campaign, learningPlan, output, calendarOutput]).size !==
      5 ||
    !output.endsWith(".json") ||
    !calendarOutput.endsWith(".md") ||
    existsSync(output) ||
    existsSync(calendarOutput)
  )
    throw new Error(
      "Outputs must be distinct fresh private JSON/Markdown files; existing sources and outputs are never overwritten",
    );
  const result = generateUrgentJobPlan(
    JSON.parse(readFileSync(baseline, "utf8")),
    readFileSync(campaign, "utf8"),
    readFileSync(learningPlan, "utf8"),
  );
  const created = [];
  try {
    writeFileSync(output, JSON.stringify(result.roadmap, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    created.push(output);
    writeFileSync(calendarOutput, result.calendar, { mode: 0o600, flag: "wx" });
    created.push(calendarOutput);
  } catch (error) {
    for (const path of created) unlinkSync(path);
    throw error;
  }
  console.log(
    "Generated private urgent roadmap and dated calendar; account data unchanged.",
  );
}
