import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const validDate = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(Date.parse(`${date}T12:00:00Z`)) &&
  new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
const addDays = (date, n) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400000)
    .toISOString()
    .slice(0, 10);
export function generateGermanyRoadmap(markdown) {
  const meta =
    /<!-- germany-roadmap: start=(\S+) end=(\S+) reviewed=(\S+) -->/.exec(
      markdown,
    );
  if (!meta || !meta.slice(1).every(validDate))
    throw new Error("Valid roadmap metadata dates required");
  const [, startDate, endDate, reviewedOn] = meta;
  if (
    addDays(startDate, 83) !== endDate ||
    new Date(`${startDate}T12:00:00Z`).getUTCDay() !== 1
  )
    throw new Error("Campaign must cover twelve Monday–Sunday weeks");
  const sections = markdown
    .split(/^## /m)
    .slice(1)
    .map((chunk) => {
      const at = chunk.indexOf("\n");
      return {
        title: chunk.slice(0, at).trim(),
        content: chunk.slice(at + 1).trim(),
      };
    });
  const weekly = sections.find((s) => s.title.startsWith("Twelve weeks"));
  const rows = (weekly?.content ?? "")
    .split("\n")
    .filter((l) => /^\| \d+ ·/.test(l))
    .map((l) =>
      l
        .split(/(?<!\\)\|/)
        .slice(1, -1)
        .map((c) => c.trim().replace(/\\\|/g, "|")),
    );
  if (
    rows.length !== 12 ||
    rows.some((r, i) => Number(r[0].split(" ·")[0]) !== i + 1 || r.length !== 4)
  )
    throw new Error("Twelve ordered weeks required");
  const weeks = rows.map((r, i) => ({
    number: i + 1,
    start: addDays(startDate, i * 7),
    end: addDays(startDate, i * 7 + 6),
    study: r[1],
    deliverable: r[2],
    campaign: r[3],
    items: [
      ["study", r[1]],
      ["project", r[2]],
      ["campaign", r[3]],
    ].map(([kind, text]) => ({
      id: `germany:${startDate.slice(0, 4)}:w${String(i + 1).padStart(2, "0")}:${kind}`,
      text,
      evidenceType: "note",
      acceptanceCriteria: `Describe the actual ${kind} result, link or revision when applicable, the check performed and remaining gap. For applications and OSS, distinguish prepared, submitted, reviewed and accepted. Verify only after checking the evidence.`,
      estimatedMinutes: kind === "project" ? 120 : 90,
    })),
  }));
  const budget =
    sections.find((s) => s.title === "The 50-hour timetable")?.content ??
    sections.find((s) => s.title === "Weekly allocation")?.content ??
    "";
  const allocationTable = budget.includes("### Weekly allocation")
    ? budget.split("### Weekly allocation")[1]
    : budget;
  const allocations = allocationTable
    .split("\n")
    .filter((l) => /^\|/.test(l))
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((x) => x.trim()),
    )
    .filter(
      (r) =>
        r.length === 2 &&
        !r[0].includes("Total") &&
        Number.isFinite(Number(r[1])),
    )
    .map(([label, hours]) => ({ label, hours: Number(hours) }));
  if (allocations.reduce((a, r) => a + r.hours, 0) !== 50)
    throw new Error("Weekly allocations must total 50 hours");
  const include = [
    "Position yourself",
    "Begin with",
    "Study with",
    "Build two",
    "Open source:",
    "LinkedIn,",
    "Applications",
    "Interview",
    "German",
    "Qualification",
    "Germany",
    "Visa",
    "Track",
    "Review",
    "Measure",
    "Run the Germany",
    "Prepare for",
  ];
  const content = sections.filter((s) =>
    include.some((prefix) => s.title.startsWith(prefix)),
  );
  const target =
    /\*\*Primary target:\*\* ([^\n]+)/.exec(markdown)?.[1] ??
    "Senior full-stack/product engineering in Germany";
  const links = [
    ...markdown.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g),
  ].map(([, label, url]) => ({ label, url }));
  return {
    version: 1,
    reviewedOn,
    startDate,
    endDate,
    target,
    sourceDigest: createHash("sha256").update(markdown).digest("hex"),
    weeks,
    allocations,
    sections: content,
    sources: [...new Map(links.map((l) => [l.url, l])).values()],
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output)
    throw new Error(
      "Usage: node scripts/generate-germany-roadmap.mjs PRIVATE_PLAN PRIVATE_OUTPUT",
    );
  const plan = generateGermanyRoadmap(readFileSync(input, "utf8"));
  writeFileSync(output, JSON.stringify(plan, null, 2) + "\n", { mode: 0o600 });
  console.log(
    `Generated ${plan.weeks.length} weeks, ${plan.sections.length} guides, 50 hours/week; private output only.`,
  );
}
