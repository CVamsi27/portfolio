import assert from "node:assert/strict";
import { test } from "node:test";
import { generateGermanyRoadmap } from "./generate-germany-roadmap.mjs";
const fixture = `# Campaign
<!-- germany-roadmap: start=2026-10-12 end=2027-01-03 reviewed=2026-10-10 -->
**Primary target:** Senior engineer. Berlin first.
## Twelve weeks, with one main deliverable per week
| Week | Study | Project | Campaign |
| --- | --- | --- | --- |
${Array.from({ length: 12 }, (_, i) => `| ${i + 1} · dates | Study ${i + 1} | Tested project ${i + 1} | Application ${i + 1} |`).join("\n")}
## Weekly allocation
| Workstream | Hours |
| --- | --- |
| Work | 50 |
| **Total** | **50** |
## Study with a role-specific order
Learn a [mechanism](https://example.org/study).\n`;
test("private source produces contiguous weeks and stable evidence IDs without runtime imports", () => {
  const plan = generateGermanyRoadmap(fixture);
  assert.equal(plan.weeks.length, 12);
  assert.equal(plan.weeks[0].start, "2026-10-12");
  assert.equal(plan.weeks[11].end, "2027-01-03");
  assert.deepEqual(
    plan.weeks[0].items.map((i) => i.id),
    [
      "germany:2026:w01:study",
      "germany:2026:w01:project",
      "germany:2026:w01:campaign",
    ],
  );
  assert.equal(plan.sourceDigest.length, 64);
  assert.equal(
    generateGermanyRoadmap(fixture + "\n").sourceDigest === plan.sourceDigest,
    false,
  );
  assert.equal(plan.sections[0].title, "Study with a role-specific order");
});
test("rejects incomplete cycles, impossible dates and wrong weekly budget", () => {
  assert.throws(
    () => generateGermanyRoadmap(fixture.replace("2026-10-12", "2026-02-30")),
    /date/i,
  );
  assert.throws(
    () =>
      generateGermanyRoadmap(fixture.replace("| 12 · dates", "| 11 · dates")),
    /week/i,
  );
  assert.throws(
    () =>
      generateGermanyRoadmap(fixture.replace("| Work | 50 |", "| Work | 51 |")),
    /50/,
  );
});

const addDays = (n) =>
  new Date(Date.UTC(2026, 9, 12 + n)).toISOString().slice(0, 10);
const longDate = (date) =>
  new Date(date + "T12:00:00Z")
    .toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    })
    .replace(",", "");
const shortDate = (date) =>
  new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
const detailed = {
  curriculum:
    Array.from(
      { length: 12 },
      (_, w) =>
        `## Week ${w + 1} — outcome

` +
        Array.from(
          { length: 5 },
          (_, d) => `### ${longDate(addDays(w * 7 + d))}

**Study:** Read [Scope](https://study.buildora.work/10-frontend/scope.md) and explain resolution. **Project:** Trace and test an observed request boundary. **Practice:** C01. **Speak:** Explain the result and limitation.`,
        ).join("\n\n"),
    ).join("\n\n") +
    "\n\n## Coding exercises used by the calendar\n\n| ID | Task and input contract | Cases to test and expected reasoning |\n| --- | --- | --- |\n| C01 | Find distinct indices | Empty and repeated values |",
  exams:
    Array.from(
      { length: 7 },
      (_, i) => `## Round R${i} — preparation

A changed prompt with observable behavior.

<!-- germany-exam ${JSON.stringify({ id: "R" + i, dimensions: ["Contract", "Correctness", "Tests", "Trade-offs", "Communication"], passTotal: 16, minimum3: [1, 2] })} -->`,
    ).join("\n\n") +
    "\n\n| Check | Wednesday | Prompt and observable outcome |\n| --- | --- | --- |\n" +
    Array.from(
      { length: 12 },
      (_, w) =>
        `| W${String(w + 1).padStart(2, "0")} | ${shortDate(addDays(w * 7 + 2))} | Explain and score the enforcing boundary |`,
    ).join("\n") +
    "\n\n| Exam | Saturday | Format, prompt and pass gate |\n| --- | --- | --- |\n" +
    Array.from(
      { length: 12 },
      (_, w) =>
        `| E${String(w + 1).padStart(2, "0")} | ${shortDate(addDays(w * 7 + 5))} | Work, save evidence and score the appropriate round |`,
    ).join("\n"),
  campaign:
    "## The first 25 employers and your next action\n\n| ID | Employer and exact source | Evidence/status on 10 Oct | Action, emphasis and contact target |\n| --- | --- | --- | --- |\n" +
    Array.from(
      { length: 25 },
      (_, i) =>
        `| DE${String(i + 1).padStart(2, "0")} | [Employer ${i + 1}](https://example.org/jobs/${i + 1}) | Board/watch | Read exact requirements and record unknown eligibility |`,
    ).join("\n") +
    "\n\n## The dated application and contact plan\n\n| Week | Application/research focus in 12:30 blocks | Tuesday 14:30–16:00 | Thursday 14:30–16:00 |\n| --- | --- | --- | --- |\n" +
    Array.from(
      { length: 12 },
      (_, i) =>
        `| Week ${i + 1} | Verify eligible roles | Prepare a named contact message | Review a truthful post |`,
    ).join("\n") +
    "\n\n## Open source — one bounded contribution path\n\n| Week | Monday session | Wednesday session | Friday session / evidence |\n| --- | --- | --- | --- |\n| 1–12 | Read contribution rules | Reproduce a current issue | Record actual result |\n\n## German practice\n\n| Week | Monday–Friday speaking/writing focus | Friday check inside 20:30–21:15 |\n| --- | --- | --- |\n" +
    Array.from(
      { length: 12 },
      (_, i) => `| ${i + 1} | Beginner speaking practice | Record skill gaps |`,
    ).join("\n") +
    "\n\n## Saturday personal checkpoints — one dependency at a time\n\n| Date | Checkpoint and output |\n| --- | --- |\n" +
    Array.from(
      { length: 12 },
      (_, w) =>
        `| ${shortDate(addDays(w * 7 + 5))} | Verify one document dependency |`,
    ).join("\n") +
    "\n\n## Technical writing — twelve usable draft posts\n\n" +
    Array.from(
      { length: 12 },
      (_, w) => `### P${String(w + 1).padStart(2, "0")} — ${longDate(
        addDays(w * 7 + 3),
      )
        .split(" ")
        .slice(1)
        .join(" ")}: an observed mechanism

A truthful draft without an invented result.`,
    ).join("\n\n"),
  design:
    "## Timetable\n\nAll assignments replace work inside the fifty-hour budget.",
};
test("detailed source produces a complete dated plan and includes all companion changes in its digest", () => {
  const plan = generateGermanyRoadmap(fixture, detailed);
  assert.equal(plan.execution.days.length, 60);
  assert.equal(plan.execution.days[0].date, "2026-10-12");
  assert.equal(plan.execution.days[59].date, "2027-01-01");
  assert.equal(plan.execution.assessments.length, 24);
  assert.equal(plan.execution.companies.length, 25);
  assert.equal(plan.execution.rounds.length, 7);
  assert.equal(plan.execution.posts[11].date, "2026-12-31");
  assert.equal(
    plan.execution.weeks[11].relocation,
    "Verify one document dependency",
  );
  assert.notEqual(
    generateGermanyRoadmap(fixture, {
      ...detailed,
      design: detailed.design + " Changed.",
    }).sourceDigest,
    plan.sourceDigest,
  );
});
test("company queues may have repeated headers without losing the second queue", () => {
  const split = detailed.campaign.replace(
    "| DE11 |",
    "| ID | Employer and exact source | Evidence/status on 10 Oct | Action, emphasis and contact target |\n| --- | --- | --- | --- |\n| DE11 |",
  );
  assert.equal(
    generateGermanyRoadmap(fixture, { ...detailed, campaign: split }).execution
      .companies[24].id,
    "DE25",
  );
});
test("rejects missing or duplicated daily assignments instead of publishing an incomplete plan", () => {
  assert.throws(
    () =>
      generateGermanyRoadmap(fixture, {
        ...detailed,
        curriculum: detailed.curriculum.replace(
          "### Monday 12 October",
          "### Tuesday 13 October",
        ),
      }),
    /day|date|duplicate/i,
  );
  assert.throws(
    () =>
      generateGermanyRoadmap(fixture, {
        ...detailed,
        curriculum: detailed.curriculum.replace(
          "**Project:** Trace and test an observed request boundary. ",
          "",
        ),
      }),
    /project|instructions/i,
  );
});
