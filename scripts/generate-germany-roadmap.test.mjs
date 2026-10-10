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
