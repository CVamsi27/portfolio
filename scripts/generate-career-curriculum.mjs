import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const STUDY_STACKS = [
  "10-frontend",
  "20-backend",
  "30-architecture",
  "40-platform",
  "50-quality",
  "60-realtime",
  "70-interview-toolkit",
];
const CHAPTER_FILENAME = /^\d+(?:\.\d+)+-.+\.md$/;
const MAX_STUDY_MINUTES_PER_DAY = 120;

const DAILY_SCHEDULE = {
  "07:00-08:30": { label: "Exercise and freshen up (no breakfast)", minutes: 90, work: false, output: "Health routine done" },
  "08:30-10:30": { label: "Bible study and retrieval practice", minutes: 120, work: true, output: "Chapter notes and recall answer" },
  "10:30-12:30": { label: "Build, debug, or solve a problem", minutes: 120, work: true, output: "Commit, solution, diagram, or recording" },
  "12:30-14:00": { label: "Role research and tailored application work", minutes: 90, work: true, output: "Verified role scorecard or application evidence" },
  "14:00-14:30": { label: "Lunch", minutes: 30, work: false, output: "Protected meal break" },
  "14:30-16:30": { label: "Open source or public portfolio proof", minutes: 120, work: true, output: "Agreed issue, reviewed code, or shipped proof" },
  "16:30-17:30": { label: "Interview preparation", minutes: 60, work: true, output: "Structured answer and trade-off notes" },
  "17:30-18:00": { label: "Mock interview", minutes: 30, work: true, output: "Recording and one improvement" },
  "18:00-20:00": { label: "Family time (offline)", minutes: 120, work: false, output: "Protected family time" },
  "20:00-20:30": { label: "Dinner", minutes: 30, work: false, output: "Protected meal break" },
  "20:30-21:30": { label: "Follow-up, outreach, and next-day review", minutes: 60, work: true, output: "One quality follow-up or next-day brief" },
  "21:30-22:00": { label: "Wind down; sleep at 22:00", minutes: 30, work: false, output: "Devices away and tomorrow ready" },
};

const PHASES = [
  { through: 1, id: "activation", label: "Activation and baseline" },
  { through: 14, id: "foundation", label: "Core foundations and interview baseline" },
  { through: 42, id: "build", label: "Build and deepen the product" },
  { through: 65, id: "reliability", label: "Reliability, security, and operations" },
  { through: 84, id: "proof", label: "Public proof and community contribution" },
  { through: 99, id: "interviews", label: "Interview loops and targeted applications" },
  { through: 100, id: "close", label: "Close, review, and next plan" },
];

function walkMarkdown(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkMarkdown(path, output);
    else if (entry.isFile() && entry.name.endsWith(".md")) output.push(path);
  }
  return output;
}

function compareChapterPaths(left, right) {
  const leftPrefix = left.split("/").at(-1).match(/^([\d.]+)-/)[1].split(".").map(Number);
  const rightPrefix = right.split("/").at(-1).match(/^([\d.]+)-/)[1].split(".").map(Number);
  const length = Math.max(leftPrefix.length, rightPrefix.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftPrefix[index] ?? -1) - (rightPrefix[index] ?? -1);
    if (difference !== 0) return difference;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

function readChapter(path, bibleRoot, studyBaseUrl) {
  const markdown = readFileSync(path, "utf8");
  const title = markdown.match(/^#\s+(.+)\s*$/m)?.[1]?.trim();
  if (!title) throw new Error(`Chapter has no H1 title: ${relative(bibleRoot, path)}`);
  const minutes = Number(markdown.match(/read--time-(\d+)_min/i)?.[1] ?? 15);
  if (!Number.isInteger(minutes) || minutes < 1) throw new Error(`Invalid read time: ${relative(bibleRoot, path)}`);
  const chapterPath = relative(bibleRoot, path).split(sep).join("/");
  const studyPath = chapterPath.split("/").map(encodeURIComponent).join("/");
  const stack = chapterPath.split("/")[0];
  return {
    id: chapterPath,
    path: chapterPath,
    title,
    studyUrl: `${studyBaseUrl.replace(/\/$/, "")}/${studyPath}`,
    stack,
    estimatedMinutes: minutes,
  };
}

function collectInventory(bibleRoot, studyBaseUrl) {
  const included = [];
  const excludedByReason = { index: 0, personal: 0, nonNumbered: 0, outsideStudyStacks: 0 };
  const allMarkdown = walkMarkdown(bibleRoot);
  for (const path of allMarkdown) {
    const relPath = relative(bibleRoot, path).split(sep).join("/");
    if (relPath.split("/").includes("personal")) {
      excludedByReason.personal += 1;
      continue;
    }
    const root = relPath.split("/")[0];
    if (!STUDY_STACKS.includes(root)) {
      excludedByReason.outsideStudyStacks += 1;
      continue;
    }
    if (path.split(sep).at(-1) === "INDEX.md") {
      excludedByReason.index += 1;
      continue;
    }
    if (!CHAPTER_FILENAME.test(path.split(sep).at(-1))) {
      excludedByReason.nonNumbered += 1;
      continue;
    }
    included.push(readChapter(path, bibleRoot, studyBaseUrl));
  }
  included.sort((a, b) => compareChapterPaths(a.path, b.path));
  return { chapters: included, excludedByReason, markdownFilesScanned: allMarkdown.length };
}

function isoDate(startDate, offsetDays) {
  const date = new Date(`${startDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function getPhase(day) {
  return PHASES.find(phase => day <= phase.through);
}

function groupChapters(chapters, dayCount) {
  if (chapters.length < dayCount) throw new Error(`Curriculum has ${chapters.length} chapters for ${dayCount} dates; every date needs a chapter.`);
  const durations = chapters.map(chapter => chapter.estimatedMinutes);
  const totalMinutes = durations.reduce((sum, minutes) => sum + minutes, 0);
  const longest = Math.max(...durations);
  if (longest > MAX_STUDY_MINUTES_PER_DAY) {
    const chapter = chapters.find(item => item.estimatedMinutes === longest);
    throw new Error(`Chapter exceeds the daily study budget: ${chapter.path} (${longest} minutes)`);
  }
  const minimumBins = (start, limit) => {
    let bins = 1;
    let load = 0;
    for (let index = start; index < durations.length; index += 1) {
      if (load + durations[index] > limit) {
        bins += 1;
        load = 0;
      }
      load += durations[index];
    }
    return bins;
  };
  let low = Math.max(longest, Math.ceil(totalMinutes / dayCount));
  let high = MAX_STUDY_MINUTES_PER_DAY;
  if (minimumBins(0, high) > dayCount) throw new Error("The complete curriculum cannot fit into 100 two-hour study blocks.");
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (minimumBins(0, middle) <= dayCount) high = middle;
    else low = middle + 1;
  }
  const balancedLimit = low;
  const groups = [];
  let cursor = 0;
  let remainingMinutes = totalMinutes;

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    const daysLeft = dayCount - dayIndex;
    const targetMinutes = remainingMinutes / daysLeft;
    let cumulativeMinutes = 0;
    let bestEnd = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let end = cursor + 1; end <= chapters.length - (daysLeft - 1); end += 1) {
      cumulativeMinutes += durations[end - 1];
      if (cumulativeMinutes > balancedLimit) break;
      const futureStart = end;
      const futureDays = daysLeft - 1;
      const futureCount = chapters.length - futureStart;
      if (futureCount < futureDays) continue;
      if (futureDays > 0 && minimumBins(futureStart, balancedLimit) > futureDays) continue;
      const score = Math.abs(cumulativeMinutes - targetMinutes);
      if (score < bestScore) {
        bestScore = score;
        bestEnd = end;
      }
      if (cumulativeMinutes >= targetMinutes && score > bestScore) break;
    }
    if (bestEnd < 0) throw new Error(`Could not balance the chapter load for day ${dayIndex + 1}.`);
    const assigned = chapters.slice(cursor, bestEnd);
    groups.push(assigned);
    const assignedMinutes = durations.slice(cursor, bestEnd).reduce((sum, minutes) => sum + minutes, 0);
    remainingMinutes -= assignedMinutes;
    cursor = bestEnd;
  }
  if (cursor !== chapters.length) throw new Error(`Unassigned chapters remain: ${chapters.length - cursor}`);
  return groups;
}

function stackAction(stack, day) {
  const actions = {
    "10-frontend": "Implement one user-facing interaction and check keyboard, loading, empty, and error states.",
    "20-backend": "Implement or trace one API use case; test validation, authorization, failure, and idempotency boundaries.",
    "30-architecture": "Draw one architecture decision, compare two options, and state failure modes and measurable trade-offs.",
    "40-platform": "Run one reproducible deployment or operations drill; capture health, rollback, and cost evidence.",
    "50-quality": "Add a discriminating test or measurable accessibility/performance check and record its before/after result.",
    "60-realtime": "Build or review one reconnect, ordering, backpressure, or fan-out scenario with a failure test.",
    "70-interview-toolkit": "Solve one timed coding or interview drill, then explain the reasoning aloud without notes.",
  };
  return `${actions[stack] ?? "Build a small, testable artifact from today's reading."} Day ${day}: explain the decision and attach a commit, diagram, or recording.`;
}

function ossAction(day) {
  if (day <= 3) return { project: "Langfuse", action: "Read the contribution guide and map the local architecture; do not open a speculative PR." };
  if (day % 7 === 0) return { project: "Lightdash", action: "Check maintainer policy and contribute product feedback or issue context; ask before coding." };
  return { project: "Langfuse", action: "Work only on a scoped issue with maintainer context; otherwise publish a small portfolio-quality proof artifact." };
}

function roleAction(day) {
  const weekDay = (day - 1) % 7;
  if (weekDay === 0) return "Select one Germany role; verify the exact opening, language, location, and qualifying-offer/visa conditions from its source.";
  if (weekDay === 1) return "Tailor one application to a verified role using only resume-backed evidence; save a draft for your own review.";
  if (weekDay === 2) return "Find one remote role and confirm whether applicants in India or an employer-of-record arrangement are accepted.";
  if (weekDay === 3) return "Prepare one company-specific role scorecard: product, stack, evidence match, gap, and next step.";
  if (weekDay === 4) return "Submit one reviewed application only if the role is verified open and the evidence match is credible; otherwise improve the proof artifact.";
  if (weekDay === 5) return "Review follow-ups due today; send at most one useful, context-specific follow-up after checking the application history.";
  return "Review the weekly funnel and select next week's highest-fit roles; do not count unsent drafts as applications.";
}

function checklistFor(date, chapter, day) {
  const prefix = `career:${date}`;
  return [
    { id: `${prefix}:study-notes`, text: "Write concise notes for today's assigned chapters", evidenceType: "note", acceptanceCriteria: "At least 5 key ideas, one open question, and one link to the chapter notes.", estimatedMinutes: 25 },
    { id: `${prefix}:retrieval`, text: "Explain one chapter concept from memory", evidenceType: "recording", acceptanceCriteria: "A 2–5 minute audio/video recording or a written answer made before reopening the chapter.", estimatedMinutes: 15 },
    { id: `${prefix}:practice`, text: "Complete the applied engineering exercise", evidenceType: "commit", acceptanceCriteria: "A commit URL/hash, runnable artifact, or accepted solution plus one test or measured result.", estimatedMinutes: 120 },
    { id: `${prefix}:role-scorecard`, text: "Complete today's role research or application action", evidenceType: "note", acceptanceCriteria: "Company, exact role URL, source-check date, eligibility, evidence match, gap, and next action are recorded.", estimatedMinutes: 90 },
    { id: `${prefix}:public-proof`, text: "Make progress on OSS or public proof", evidenceType: "url", acceptanceCriteria: "Link to an agreed issue/discussion, reviewable public artifact, or portfolio commit; if blocked, record the maintainer question and pivot artifact.", estimatedMinutes: 120 },
    { id: `${prefix}:interview`, text: "Practice today's interview question under a timer", evidenceType: "recording", acceptanceCriteria: "Record a 5–10 minute answer and one specific correction for the next attempt.", estimatedMinutes: 60 },
    { id: `${prefix}:closeout`, text: "Complete the evening review and set up tomorrow", evidenceType: "note", acceptanceCriteria: "Record completed evidence, carry-forward item if needed, one lesson, and tomorrow's first action.", estimatedMinutes: 30 },
  ].map(item => ({ ...item, day }));
}

export function validateCurriculum(curriculum) {
  if (!curriculum || curriculum.version !== 1 || !Array.isArray(curriculum.days)) throw new Error("Invalid curriculum shape.");
  if (curriculum.days.length !== 100) throw new Error("Curriculum must contain exactly 100 dated days.");
  if (curriculum.days[0]?.date !== "2026-09-30" || curriculum.days.at(-1)?.date !== "2027-01-07") throw new Error("Curriculum date range must be 2026-09-30 through 2027-01-07.");
  const chapterIds = new Set();
  const checklistIds = new Set();
  for (const [index, day] of curriculum.days.entries()) {
    if (day.day !== index + 1 || day.date !== isoDate("2026-09-30", index)) throw new Error(`Non-consecutive date at day ${index + 1}.`);
    if (!Array.isArray(day.chapters) || day.chapters.length === 0) throw new Error(`Day ${day.day} has no study chapter.`);
    const studyMinutes = day.chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0);
    if (studyMinutes > MAX_STUDY_MINUTES_PER_DAY) throw new Error(`Day ${day.day} exceeds the two-hour study budget.`);
    for (const chapter of day.chapters) {
      if (chapterIds.has(chapter.id)) throw new Error(`Duplicate chapter: ${chapter.id}`);
      chapterIds.add(chapter.id);
      const url = new URL(chapter.studyUrl);
      if (url.hostname !== "study.buildora.work" && url.hostname !== "study.example.test") throw new Error(`Invalid study URL: ${chapter.studyUrl}`);
      if (!chapter.title || !chapter.path || !chapter.stack) throw new Error(`Incomplete chapter metadata: ${chapter.id}`);
    }
    const workMinutes = Object.values(day.schedule).filter(block => block.work).reduce((sum, block) => sum + block.minutes, 0);
    if (workMinutes !== 600) throw new Error(`Day ${day.day} must contain exactly ten work hours.`);
    if (day.schedule["18:00-20:00"]?.minutes !== 120 || day.schedule["14:00-14:30"]?.label !== "Lunch" || day.schedule["20:00-20:30"]?.label !== "Dinner") throw new Error(`Day ${day.day} does not preserve family and meal anchors.`);
    if (!Array.isArray(day.checklist) || day.checklist.length !== 7) throw new Error(`Day ${day.day} must have seven verification items.`);
    for (const item of day.checklist) {
      if (!item.id || !item.text || !item.evidenceType || !item.acceptanceCriteria) throw new Error(`Incomplete checklist item on day ${day.day}.`);
      if (checklistIds.has(item.id)) throw new Error(`Duplicate checklist item: ${item.id}`);
      checklistIds.add(item.id);
    }
  }
  if (chapterIds.size !== curriculum.chapterCount) throw new Error("Chapter count does not match assigned chapters.");
  return curriculum;
}

export function buildCurriculum({ bibleRoot, startDate, dayCount, studyBaseUrl }) {
  const root = resolve(bibleRoot);
  if (!existsSync(root)) throw new Error(`Bible root does not exist: ${root}`);
  if (startDate !== "2026-09-30" || dayCount !== 100) throw new Error("This roadmap is locked to 100 dates starting 2026-09-30.");
  const base = new URL(studyBaseUrl);
  if (base.protocol !== "https:" || !["study.buildora.work", "study.example.test"].includes(base.hostname)) throw new Error("Study base URL must be HTTPS on the approved study host.");
  const inventory = collectInventory(root, base.toString().replace(/\/$/, ""));
  const groups = groupChapters(inventory.chapters, dayCount);
  const stackCounts = {};
  for (const chapter of inventory.chapters) stackCounts[chapter.stack] = (stackCounts[chapter.stack] ?? 0) + 1;
  const sourceDigest = createHash("sha256").update(inventory.chapters.map(chapter => `${chapter.path}\0${readFileSync(join(root, chapter.path), "utf8")}`).join("\0")).digest("hex");
  const totalStudyMinutes = inventory.chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0);
  const days = groups.map((chapters, index) => {
    const day = index + 1;
    const date = isoDate(startDate, index);
    const phase = getPhase(day);
    const primary = chapters[0];
    const oss = ossAction(day);
    const question = `Explain ${primary.title} to a senior interviewer. State the invariant, one failure mode, one trade-off, and how you would verify the result.`;
    const activation = day === 1;
    return {
      id: `career-${date}`,
      day,
      date,
      phase: phase.id,
      phaseLabel: phase.label,
      activation,
      topic: primary.stack,
      chapterId: primary.id,
      title: chapters.length === 1 ? primary.title : `${primary.title} + ${chapters.length - 1} related chapters`,
      chapters,
      studyMinutes: chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0),
      schedule: DAILY_SCHEDULE,
      mission: activation
        ? "Activate the system: audit your resume and portfolio, confirm the first target role, study the assigned chapter, and finish one practice artifact that is feasible from the current time. Earlier blocks today are not overdue."
        : `Study ${chapters.length} assigned chapter${chapters.length === 1 ? "" : "s"} for ${chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0)} minutes. Then turn ${primary.title} into a small, reviewable engineering proof and connect it to a target role.`,
      practiceTask: stackAction(primary.stack, day),
      interviewQuestion: question,
      interviewQuestions: [question],
      ossTrack: { project: oss.project, action: oss.action },
      oSSProject: oss.project,
      roleTrack: { lane: "Senior Full-Stack / Backend TypeScript", action: roleAction(day) },
      mockInterviewPlatform: "micro1 free AI mock or Exponent/Pramp peer practice; recorded self-review every day",
      founderOutreachTarget: "At most one relevant follow-up or warm conversation; quality before volume",
      steps: [
        `Open each assigned chapter from study.buildora.work and note its main invariant: ${chapters.map(chapter => chapter.title).join("; ")}.`,
        "Close the reading tab and write the recall answer before checking your notes.",
        "Complete the practice task in a small branch or isolated exercise; run the relevant tests and capture the result.",
        "Verify one Germany or remote role from its exact listing and save its source, eligibility, evidence match, and gap.",
        `Follow the OSS rule for ${oss.project}: confirm scope with maintainers before coding; if no agreed issue exists, ship a public proof artifact instead.`,
        "Record a timed interview answer, score clarity/technical depth/trade-offs, and write one correction.",
        "Use the final checklist to attach evidence, verify completed outputs, and carry unfinished work into a dated next action.",
      ],
      checklist: checklistFor(date, primary, day),
      notifications: [
        { key: "launch", time: "07:00", message: `Day ${day}: start with health, then open today's roadmap.`, href: "/roadmap" },
        { key: "study-close", time: "10:25", message: `Close the study block with notes and recall for Day ${day}.`, href: "/roadmap" },
        { key: "role-action", time: "12:25", message: "Save today's verified role scorecard or application evidence.", href: "/roadmap" },
        { key: "mock", time: "17:25", message: "Start the timed mock and capture one improvement.", href: "/roadmap" },
        { key: "family", time: "18:00", message: "Protect the two-hour family block; work resumes at 20:30.", href: "/hub" },
        { key: "closeout", time: "21:30", message: "Verify today's evidence and set the first task for tomorrow.", href: "/roadmap" },
      ],
      resources: [
        { label: "Assigned chapter", url: primary.studyUrl },
        { label: "Full study curriculum", url: "https://study.buildora.work" },
        { label: "Germany role search", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20Full%20Stack%20TypeScript&location=Germany" },
        { label: "Remote role search", url: "https://wellfound.com/jobs?q=senior%20typescript%20node" },
      ],
    };
  });
  const curriculum = {
    version: 1,
    sourceDigest,
    startDate,
    endDate: isoDate(startDate, dayCount - 1),
    chapterCount: inventory.chapters.length,
    totalStudyMinutes,
    inventorySummary: {
      markdownFilesScanned: inventory.markdownFilesScanned,
      includedChapterCount: inventory.chapters.length,
      excludedByReason: inventory.excludedByReason,
      stackCounts,
    },
    days,
  };
  return validateCurriculum(curriculum);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    if (key === "--help") return { help: true };
    if (key === "--check") {
      args.check = true;
      continue;
    }
    args[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write("Usage: node scripts/generate-career-curriculum.mjs --bible-root PATH --start-date 2026-09-30 --days 100 --study-base-url https://study.buildora.work --output PATH\n");
    return;
  }
  for (const required of ["bible-root", "start-date", "days", "study-base-url", "output"]) {
    if (!args[required]) throw new Error(`Missing required argument --${required}`);
  }
  const curriculum = buildCurriculum({
    bibleRoot: args["bible-root"],
    startDate: args["start-date"],
    dayCount: Number(args.days),
    studyBaseUrl: args["study-base-url"],
  });
  const output = resolve(args.output);
  if (args.check) {
    if (!existsSync(output)) throw new Error(`Generated curriculum is missing: ${output}`);
    const current = readFileSync(output, "utf8");
    const expected = `${JSON.stringify(curriculum, null, 2)}\n`;
    if (current !== expected) throw new Error("Generated curriculum is stale; run career:generate and inspect the resulting diff.");
    process.stdout.write(`Validated ${curriculum.days.length} days and ${curriculum.chapterCount} chapters; snapshot matches the bible.\n`);
    return;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(curriculum, null, 2)}\n`);
  process.stdout.write(`Generated ${curriculum.days.length} days; ${curriculum.chapterCount} chapters; ${curriculum.totalStudyMinutes} study minutes; digest ${curriculum.sourceDigest}.\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    run();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
