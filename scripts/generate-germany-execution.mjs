import { createHash } from "node:crypto";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const addDays = (date, n) =>
  new Date(Date.parse(date + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
const headings = (text, level) =>
  text
    .split(new RegExp("^" + "#".repeat(level) + " ", "m"))
    .slice(1)
    .map((chunk) => {
      const at = chunk.indexOf("\n");
      return {
        title: chunk.slice(0, at).trim(),
        content: chunk.slice(at + 1).trim(),
      };
    });
const tableRows = (text) =>
  text
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .map((l) =>
      l
        .split(/(?<!\\)\|/)
        .slice(1, -1)
        .map((c) => c.trim().replace(/\\\|/g, "|")),
    )
    .filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
const table = (text, header) => {
  const rows = tableRows(text);
  const start = rows.findIndex((r) => r[0] === header[0] && r[1] === header[1]);
  if (start < 0) throw new Error("Missing table: " + header.join(" / "));
  let end = start + 1;
  while (
    end < rows.length &&
    rows[end].length === rows[start].length &&
    !["Week", "Date", "ID", "Check", "Exam"].includes(rows[end][0])
  )
    end++;
  return rows.slice(start + 1, end);
};
const calendarDate = (text, start) => {
  const clean = text.replace(
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) /,
    "",
  );
  const year = clean.includes("Jan")
    ? Number(start.slice(0, 4)) + 1
    : Number(start.slice(0, 4));
  const d = new Date(clean + " " + year + " 12:00:00 UTC");
  if (!Number.isFinite(d.getTime())) throw new Error("Invalid date " + text);
  return d.toISOString().slice(0, 10);
};
function ordered(rows, count, prefix) {
  if (
    rows.length !== count ||
    rows.some((r, i) => r[0] !== prefix + String(i + 1).padStart(2, "0"))
  )
    throw new Error("Incomplete or duplicate " + prefix + " records");
  return rows;
}
export function generateGermanyExecution(sources, startDate) {
  const { curriculum, exams, campaign, design } = sources;
  if (
    ![curriculum, exams, campaign, design].every(
      (s) => typeof s === "string" && s.trim().length,
    )
  )
    throw new Error("All detailed companion sources required");
  if (/\[\[[\w-]+\]\]/.test(curriculum))
    throw new Error("Unresolved study instructions");
  const daily = headings(curriculum, 3).filter((s) =>
    /^(Monday|Tuesday|Wednesday|Thursday|Friday) \d/.test(s.title),
  );
  const expected = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 5 }, (_, d) => addDays(startDate, w * 7 + d)),
  ).flat();
  if (daily.length !== 60)
    throw new Error("Sixty weekday assignments required");
  const days = daily.map((s, i) => {
    const date = calendarDate(s.title, startDate);
    if (date !== expected[i])
      throw new Error("Missing, duplicate or out-of-order daily date " + date);
    const blocks = {};
    for (const match of s.content.matchAll(
      /\*\*(Study|Project|Practice|Speak|Assessment):\*\* ([\s\S]*?)(?=\*\*(?:Study|Project|Practice|Speak|Assessment):\*\*|$)/g,
    ))
      blocks[match[1].toLowerCase()] = match[2].trim();
    if (
      !blocks.study ||
      !/https:\/\/study\.buildora\.work\//.test(blocks.study) ||
      !blocks.project ||
      !(blocks.assessment || (blocks.practice && blocks.speak))
    )
      throw new Error(
        "Missing daily project or practice instructions: " + date,
      );
    return {
      id: `germany:2026:day:${date}`,
      date,
      week: Math.floor(i / 5) + 1,
      title: s.title,
      blocks,
    };
  });
  const rounds = headings(exams, 2)
    .filter((s) => /^Round R[0-6] —/.test(s.title))
    .map((s) => {
      const meta = /<!-- germany-exam (.+?) -->/.exec(s.content);
      if (!meta) throw new Error("Round scoring metadata required: " + s.title);
      const config = JSON.parse(meta[1]);
      if (
        !Array.isArray(config.dimensions) ||
        config.dimensions.length < 5 ||
        config.dimensions.some((s) => typeof s !== "string" || !s) ||
        !Number.isInteger(config.passTotal) ||
        config.passTotal < 1 ||
        config.passTotal > config.dimensions.length * 4 ||
        !Array.isArray(config.minimum3) ||
        config.minimum3.some(
          (n) => !Number.isInteger(n) || n < 0 || n >= config.dimensions.length,
        )
      )
        throw new Error("Invalid round rubric");
      return {
        ...config,
        title: s.title.replace(/^Round /, ""),
        content: s.content.replace(meta[0], "").trim(),
        version: digest(s.content),
      };
    });
  if (rounds.length !== 7 || rounds.some((r, i) => r.id !== "R" + i))
    throw new Error("Seven ordered rounds required");
  const assessments = [
    ...ordered(table(exams, ["Check", "Wednesday"]), 12, "W"),
    ...ordered(table(exams, ["Exam", "Saturday"]), 12, "E"),
  ]
    .map((r) => ({
      id: r[0],
      date: calendarDate(r[1], startDate),
      time: r[0][0] === "W" ? "16:15–17:45" : "10:15–11:45",
      content: r[2],
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  assessments.forEach((a) => {
    const w = Number(a.id.slice(1)) - 1;
    if (a.date !== addDays(startDate, w * 7 + (a.id[0] === "W" ? 2 : 5)))
      throw new Error("Invalid assessment date " + a.id);
  });
  const companies = ordered(
    tableRows(campaign).filter((r) => /^DE\d{2}$/.test(r[0])),
    25,
    "DE",
  ).map((r) => ({ id: r[0], title: r[1], status: r[2], action: r[3] }));
  const apps = table(campaign, [
    "Week",
    "Application/research focus in 12:30 blocks",
  ]);
  const oss = table(campaign, ["Week", "Monday session"]);
  const german = table(campaign, [
    "Week",
    "Monday–Friday speaking/writing focus",
  ]);
  const reloc = table(campaign, ["Date", "Checkpoint and output"]);
  if ([apps, german, reloc].some((r) => r.length !== 12))
    throw new Error("Twelve campaign/personal weeks required");
  const weeks = apps.map((r, i) => {
    const o = oss.find((o) => {
      const [a, b = a] = o[0].split(/[–-]/).map(Number);
      return i + 1 >= a && i + 1 <= b;
    });
    if (
      !o ||
      calendarDate(reloc[i][0], startDate) !== addDays(startDate, i * 7 + 5)
    )
      throw new Error("Missing OSS or personal schedule");
    return {
      number: i + 1,
      application: r[1],
      tuesday: r[2],
      thursday: r[3],
      oss: { monday: o[1], wednesday: o[2], friday: o[3] },
      german: german[i][1],
      germanCheck: german[i][2],
      relocation: reloc[i][1],
    };
  });
  const posts = headings(campaign, 3)
    .filter((s) => /^P\d{2} — /.test(s.title))
    .map((s, i) => {
      const m = /^(P\d{2}) — ([^:]+): (.+)$/.exec(s.title);
      if (!m || m[1] !== "P" + String(i + 1).padStart(2, "0"))
        throw new Error("Invalid post order");
      const date = calendarDate(m[2], startDate);
      if (date !== addDays(startDate, i * 7 + 3))
        throw new Error("Invalid post date");
      return { id: m[1], date, title: m[3], content: s.content };
    });
  if (posts.length !== 12) throw new Error("Twelve dated post drafts required");
  const practices = table(curriculum, ["ID", "Task and input contract"]).map(
    (r) => ({ id: r[0], task: r[1], cases: r[2] }),
  );
  if (!practices.length) throw new Error("Coding practice contracts required");
  const guides = [
    ["design", "Execution and timetable", design],
    ["curriculum", "Study and project instructions", curriculum],
    ["exams", "Exam prompts, scoring and retakes", exams],
    ["campaign", "Companies, contacts, OSS and personal work", campaign],
  ].map(([id, title, content]) => ({
    id,
    title,
    content: content.replace(/<!--[^]*?-->/g, ""),
  }));
  return {
    version: 1,
    assessmentVersion: digest(exams),
    days,
    rounds,
    assessments,
    companies,
    weeks,
    posts,
    practices,
    guides,
  };
}
