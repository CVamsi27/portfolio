import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { roadmapFixture } from "./fixtures/job-plan.mjs";
import {
  urgentCampaignFixture,
  urgentLearningFixture,
} from "./fixtures/urgent-job-plan.mjs";
function setup() {
  const temp = mkdtempSync(join(tmpdir(), "urgent-job-plan-"));
  const dir = join(temp, "80-lanes-abroad-full-stack/personal/reports");
  mkdirSync(dir, { recursive: true });
  const base = roadmapFixture();
  writeFileSync(join(dir, "base.json"), JSON.stringify(base));
  writeFileSync(join(dir, "campaign.md"), urgentCampaignFixture);
  writeFileSync(join(dir, "learning.md"), urgentLearningFixture);
  return { temp, dir, base };
}
function run(f, extras = []) {
  return spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      resolve("scripts/generate-urgent-job-plan.mjs"),
      "--baseline",
      join(f.dir, "base.json"),
      "--campaign",
      join(f.dir, "campaign.md"),
      "--learning-plan",
      join(f.dir, "learning.md"),
      "--output",
      join(f.dir, "urgent.json"),
      "--calendar-output",
      join(f.dir, "calendar.md"),
      ...extras,
    ],
    { encoding: "utf8" },
  );
}
test("private CLI produces a dual-market timetable and preserves historical sources and evidence IDs", () => {
  const f = setup();
  try {
    const before = readFileSync(join(f.dir, "base.json"), "utf8");
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "urgent.json"), "utf8"));
    assert.equal(p.execution.jobPlan.version, 2);
    assert.deepEqual(
      p.execution.jobPlan.days.slice(0, 3),
      f.base.execution.jobPlan.days.slice(0, 3),
    );
    assert.deepEqual(p.weeks, f.base.weeks);
    assert.deepEqual(p.execution.weeks, f.base.execution.weeks);
    assert.deepEqual(p.execution.rounds, f.base.execution.rounds);
    assert.deepEqual(p.execution.practices, f.base.execution.practices);
    assert.equal(readFileSync(join(f.dir, "base.json"), "utf8"), before);
    assert.match(p.target, /remote.*Germany/i);
    assert.deepEqual(
      p.allocations.map((a) => a.hours),
      [16, 7, 12, 10, 4, 3, 5, 3],
    );
    const a = p.execution.jobPlan.days[3].assignments[0];
    assert.equal(a.kind, "applications");
    assert.equal(a.range, "08:00-11:00");
    assert.match(a.brief, /USD 73\/hour/);
    assert.match(a.brief, /USD 151,840/);
    assert.match(a.brief, /EUR 81K/);
    assert.match(a.brief, /India/);
    assert.match(a.brief, /2026-10-10-germany-campaign.md/);
    assert.equal(a.id, f.base.execution.jobPlan.days[3].assignments[2].id);
    assert.match(
      p.execution.guides.find((g) => g.id === "campaign").content,
      /next four focused hours/,
    );
    assert.match(
      p.execution.guides.find((g) => g.id === "campaign").content,
      /python3 example.py --output runs\/fresh-synthetic.json/,
    );
    assert.match(
      p.execution.guides.find((g) => g.id === "campaign").content,
      /Twenty-four follow-ups/,
    );
    assert.match(
      p.execution.guides.find((g) => g.id === "campaign").content,
      /\[Calendar\]\(2026-10-10-germany-detailed-roadmap-design.md\)/,
    );
    assert.equal(statSync(join(f.dir, "urgent.json")).mode & 0o777, 0o600);
    assert.equal(statSync(join(f.dir, "calendar.md")).mode & 0o777, 0o600);
    const cal = readFileSync(join(f.dir, "calendar.md"), "utf8");
    assert.equal((cal.match(/^# /gm) ?? []).length, 1);
    assert.match(cal, /13.*interview.*3.*OSS/);
    assert.match(cal, /2027-01-02/);
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
test("all full future weeks fit the budget and full-loop rounds retain their durations", () => {
  const f = setup();
  try {
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "urgent.json"), "utf8"));
    const group = {
      applications: "apps",
      funnel: "apps",
      network: "network",
      coding: "interview",
      speaking: "interview",
      assessment: "interview",
      mock: "interview",
      proof: "interview",
      project: "project",
      oss: "oss",
      study: "study",
      german: "german",
      review: "review",
      documents: "review",
      planning: "review",
    };
    for (let i = 6; i < 72; i += 6) {
      const days = p.execution.jobPlan.days.slice(i, i + 6);
      const sums = Object.fromEntries(
        [
          "apps",
          "network",
          "interview",
          "project",
          "oss",
          "study",
          "german",
          "review",
        ].map((k) => [k, 0]),
      );
      for (const d of days)
        for (const a of d.assignments) sums[group[a.kind]] += a.minutes;
      const full = ["2026-12-19", "2027-01-02"].includes(days[5].date);
      assert.deepEqual(sums, {
        apps: 960,
        network: 420,
        interview: full ? 780 : 720,
        project: 600,
        oss: full ? 180 : 240,
        study: 180,
        german: 300,
        review: 180,
      });
    }
    for (const [thu, fri] of [
      ["2026-12-17", "2026-12-18"],
      ["2026-12-31", "2027-01-01"],
    ]) {
      const assignment = (date, kind) =>
        p.execution.jobPlan.days
          .find((d) => d.date === date)
          .assignments.find((a) => a.kind === kind);
      assert.match(assignment(thu, "project").brief, /11:15–13:15.*two hours/);
      assert.match(assignment(fri, "project").brief, /11:15–12:15.*one hour/);
      assert.doesNotMatch(assignment(fri, "project").brief, /10:15–11:15/);
    }
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
test("the proof sprint runs once and later work follows dated themes and actual external priorities", () => {
  const f = setup();
  try {
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "urgent.json"), "utf8"));
    const assignments = p.execution.jobPlan.days.flatMap((d) => d.assignments);
    const sessions = assignments.filter((a) =>
      /Proof sprint session [1-8] of 8/.test(a.brief),
    );
    assert.equal(sessions.length, 8);
    const continuations = assignments.filter((a) =>
      /Continue proof sprint session/.test(a.brief),
    );
    assert.equal(continuations.length, 2);
    assert.equal(
      [...sessions, ...continuations].reduce((n, a) => n + a.minutes, 0),
      960,
    );
    assert.ok(sessions.every((a) => a.date <= "2026-10-27"));
    const booking = sessions.find((a) => a.date === "2026-10-20");
    assert.match(booking.outcome, /booking tests/);
    assert.match(booking.steps.join(" "), /20 minutes.*70 minutes/s);
    assert.doesNotMatch(booking.steps.join(" "), /coding problem|without help/);
    assert.match(continuations[0].steps.join(" "), /20 minutes.*10 minutes/s);
    assert.match(
      assignments.find((a) => a.date === "2026-11-02" && a.kind === "project")
        .brief,
      /paid|external/i,
    );
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
test("replaced proof sessions require evidence and prerequisites from their new work rather than baseline exercises", () => {
  const f = setup();
  try {
    const cases = [
      ["2026-10-15", "project", /environment.*revision.*output/i],
      ["2026-10-16", "project", /query plans.*index/i],
      ["2026-10-19", "project", /p50.*p95.*pagination/i],
      ["2026-10-20", "coding", /booking.*overlap/i],
      ["2026-10-20", "speaking", /recording.*session 4/i],
      ["2026-10-22", "project", /payment.*rollback/i],
      ["2026-10-23", "project", /queue.*token/i],
      ["2026-10-26", "project", /changed workload.*prediction/i],
      ["2026-10-27", "coding", /timed explanations.*answers/i],
      ["2026-10-27", "speaking", /recording.*session 8/i],
    ];
    for (const [date, kind] of cases) {
      const a = f.base.execution.jobPlan.days
        .find((d) => d.date === date)
        .assignments.find((a) => a.kind === kind);
      a.deliverable =
        "Superseded baseline deliverable: frontend packet or coding complexity.";
      a.dependency =
        "Superseded baseline prerequisite: unrelated coding prompt.";
    }
    writeFileSync(join(f.dir, "base.json"), JSON.stringify(f.base));
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "urgent.json"), "utf8"));
    for (const [date, kind, artifact] of cases) {
      const a = p.execution.jobPlan.days
        .find((d) => d.date === date)
        .assignments.find((a) => a.kind === kind);
      assert.match(
        a.deliverable,
        artifact,
        `${date}/${kind} saves the actual new task`,
      );
      assert.match(a.dependency, /session [1-8]|same session/i);
      assert.match(a.dependency, /2026-10-10-germany-campaign.md/);
      assert.doesNotMatch(a.deliverable + a.dependency, /Superseded baseline/);
      assert.equal(a.id, `germany:2026:day:${date}:assignment:${kind}`);
    }
    assert.deepEqual(
      p.execution.jobPlan.days.slice(0, 3),
      f.base.execution.jobPlan.days.slice(0, 3),
    );
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
test("full-loop evidence is scored inside the mock window instead of inheriting the old planning instruction", () => {
  const f = setup();
  try {
    for (const date of ["2026-12-19", "2027-01-02"]) {
      const a = f.base.execution.jobPlan.days
        .find((d) => d.date === date)
        .assignments.find((a) => a.kind === "mock");
      a.deliverable =
        "Save design and defense; scoring belongs to the planning block.";
    }
    writeFileSync(join(f.dir, "base.json"), JSON.stringify(f.base));
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "urgent.json"), "utf8"));
    for (const date of ["2026-12-19", "2027-01-02"]) {
      const a = p.execution.jobPlan.days
        .find((d) => d.date === date)
        .assignments.find((a) => a.kind === "mock");
      assert.match(a.deliverable, /R3.*R5.*11:45–12:05/);
      assert.doesNotMatch(
        a.deliverable,
        /scoring belongs to the planning block/,
      );
      assert.match(a.dependency, /dated R3.*R5.*rubric/i);
      assert.match(a.dependency, /2026-10-10-germany-exams.md/);
    }
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
test("CLI refuses ambiguous pay inputs and existing outputs without overwriting sources", () => {
  const f = setup();
  try {
    writeFileSync(
      join(f.dir, "campaign.md"),
      urgentCampaignFixture.replace("151,840", "151,000"),
    );
    assert.notEqual(run(f).status, 0);
    assert.equal(existsSync(join(f.dir, "urgent.json")), false);
    writeFileSync(join(f.dir, "campaign.md"), urgentCampaignFixture);
    writeFileSync(join(f.dir, "calendar.md"), "retain");
    assert.notEqual(run(f).status, 0);
    assert.equal(readFileSync(join(f.dir, "calendar.md"), "utf8"), "retain");
    assert.equal(existsSync(join(f.dir, "urgent.json")), false);
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
