import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { roadmapFixture } from "./fixtures/job-plan.mjs";
function setup() {
  const temp = mkdtempSync(join(tmpdir(), "job-plan-"));
  const dir = join(temp, "80-lanes-abroad-full-stack/personal/reports");
  mkdirSync(dir, { recursive: true });
  const base = roadmapFixture();
  delete base.execution.jobPlan;
  base.allocations[0].hours = 50;
  const calendar = roadmapFixture()
    .execution.jobPlan.days.map(
      (d) =>
        `### Day ${d.date}\n\n| IST slot | Assignment and links | Done check |\n|---|---|---|\n` +
        d.assignments
          .map(
            (a) =>
              `| ${a.range.replace("-", "–")} · ${a.minutes}m | **${a.kind}:** ${a.brief} | ${a.deliverable} |`,
          )
          .join("\n"),
    )
    .join("\n\n");
  for (const [name, content] of [
    ["base.json", JSON.stringify(base)],
    ["calendar.md", calendar],
    [
      "design.md",
      "# Design\n\n| Workstream | Hours/week |\n|---|---|\n| Work | 60 |\n| **Total** | **60** |",
    ],
  ])
    writeFileSync(join(dir, name), content);
  return { temp, dir, base, calendar };
}
function run(f) {
  return spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      resolve("scripts/generate-job-plan.mjs"),
      join(f.dir, "base.json"),
      join(f.dir, "calendar.md"),
      join(f.dir, "design.md"),
      join(f.dir, "output.json"),
    ],
    { encoding: "utf8" },
  );
}
test("CLI generates a private complete calendar without changing baseline IDs, rubrics or input", () => {
  const f = setup();
  try {
    const before = readFileSync(join(f.dir, "base.json"), "utf8");
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "output.json"), "utf8"));
    assert.equal(p.execution.jobPlan.days.length, 72);
    assert.equal(
      p.execution.jobPlan.days[3].assignments[0].range,
      "08:00-09:30",
    );
    assert.equal(p.allocations[0].hours, 60);
    assert.deepEqual(p.execution.rounds, f.base.execution.rounds);
    assert.deepEqual(p.weeks, f.base.weeks);
    assert.equal(readFileSync(join(f.dir, "base.json"), "utf8"), before);
    assert.equal(p.execution.jobPlan.days[3].assignments[0].steps.length, 4);
    const campaign = p.execution.guides.find(
      (g) => g.id === "campaign",
    ).content;
    assert.match(campaign, /5–8.*four hours.*five hours/s);
    assert.match(campaign, /Historical research and preparation source/);
    assert.ok(
      campaign.endsWith(
        f.base.execution.guides.find((g) => g.id === "campaign").content,
      ),
    );
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
for (const [name, change] of [
  [
    "missing date",
    (s) => s.replace(/### Day 2026-10-15[\s\S]*?(?=### Day 2026-10-16)/, ""),
  ],
  ["duration mismatch", (s) => s.replace("· 90m", "· 89m")],
  [
    "unsafe link",
    (s) =>
      s.replace(
        "https://study.buildora.work/10-frontend/10.2-typescript/01-foundations/10.2.1.03-type-narrowing.md",
        "javascript:alert(1)",
      ),
  ],
])
  test("rejects " + name + " before creating an import artifact", () => {
    const f = setup();
    try {
      writeFileSync(join(f.dir, "calendar.md"), change(f.calendar));
      const r = run(f);
      assert.notEqual(r.status, 0);
      assert.equal(existsSync(join(f.dir, "output.json")), false);
    } finally {
      rmSync(f.temp, { recursive: true, force: true });
    }
  });

test("collapsed study outcomes preserve a complete action sentence and applications link to claim preparation", () => {
  const f = setup();
  try {
    const sentence =
      "Compare the runtime rejection boundary with a TypeScript annotation, explain the malformed input and the actual validation result, then record a corrected misconception without inventing an outcome.";
    const calendar = f.calendar.replace(
      "Compare a declared type with runtime validation.",
      sentence,
    );
    writeFileSync(join(f.dir, "calendar.md"), calendar);
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "output.json"), "utf8"));
    assert.equal(p.execution.jobPlan.days[0].assignments[0].outcome, sentence);
    assert.match(
      p.execution.jobPlan.days[3].assignments[2].brief,
      /https:\/\/study\.buildora\.work\/80-lanes-abroad-full-stack\/80\.18-resume-claim-crosswalk\.md/,
    );
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});

test("full-loop Saturdays reserve mock time for design and defense, with scoring in the later blocks", () => {
  const f = setup();
  try {
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "output.json"), "utf8"));
    for (const date of ["2026-12-19", "2027-01-02"]) {
      const day = p.execution.jobPlan.days.find((d) => d.date === date);
      const assignment = (kind) => day.assignments.find((a) => a.kind === kind);
      const mock = assignment("mock");
      assert.match(mock.steps.join(" "), /10:15–11:15.*R3/);
      assert.match(mock.steps.join(" "), /11:15–11:45.*R5/);
      assert.match(mock.steps.join(" "), /15:30–16:00/);
      assert.doesNotMatch(mock.steps.join(" "), /score.*within the 90-minute/i);
      assert.match(assignment("proof").steps.join(" "), /14:30–15:15.*R6/);
      assert.match(assignment("proof").steps.join(" "), /15:15–15:30.*scor/i);
      assert.match(assignment("planning").steps.join(" "), /10 minutes.*R3/);
      assert.match(assignment("planning").steps.join(" "), /10 minutes.*R5/);
      assert.equal(
        day.assignments.reduce((n, a) => n + a.minutes, 0),
        300,
      );
      assert.equal(mock.id, `germany:2026:day:${date}:assignment:mock`);
    }
    const ordinary = p.execution.jobPlan.days.find(
      (d) => d.date === "2026-12-26",
    );
    assert.match(
      ordinary.assignments.find((a) => a.kind === "mock").steps.join(" "),
      /within the 90-minute block/,
    );
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});

test("assignment prerequisites and blocked actions follow the actual workstream", () => {
  const f = setup();
  try {
    const r = run(f);
    assert.equal(r.status, 0, r.stderr);
    const p = JSON.parse(readFileSync(join(f.dir, "output.json"), "utf8"));
    const assignments = p.execution.jobPlan.days.flatMap((d) => d.assignments);
    const first = (kind) => assignments.find((a) => a.kind === kind);
    assert.match(first("oss").dependency, /contribution.*AI.*reproduction/i);
    assert.match(first("oss").blocked, /two.*sessions.*Zod/i);
    assert.match(first("network").dependency, /artifact.*recipient/i);
    assert.match(first("speaking").dependency, /personal contribution/i);
    assert.match(first("german").dependency, /lesson.*audio/i);
    assert.match(first("funnel").dependency, /submission dates.*confirmation/i);
    assert.match(first("planning").dependency, /funnel.*failed/i);
    for (const date of ["2026-12-19", "2027-01-02"]) {
      const day = p.execution.jobPlan.days.find((d) => d.date === date);
      assert.match(
        day.assignments.find((a) => a.kind === "proof").dependency,
        /R6.*rubric/,
      );
      assert.match(
        day.assignments.find((a) => a.kind === "planning").dependency,
        /saved R3.*R5/,
      );
    }
  } finally {
    rmSync(f.temp, { recursive: true, force: true });
  }
});
