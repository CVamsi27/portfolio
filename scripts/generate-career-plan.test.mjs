import assert from "node:assert/strict";
import { test } from "node:test";
import { generateCareerPlan } from "./generate-career-plan.mjs";

const fixture = `# Career Roadmap — start here

> **What this is:** the orientation layer for the job search. It links the detailed plans; it does not replace them.

**Updated:** 17 October 2026 (IST). **Search window:** 12 October 2026 → 3 January 2027, then a 4–7 January review.

## 1. Will companies hire this profile? — the honest answer

Targeted batches convert; see the [LeaseTeq note](reports/leaseteq-app-router-drill-2026-09-12.md) and the [study site](https://study.buildora.work/roadmap.md). Requests routed by \`evidence\`.

## 2. What is happening right now? — the active loop

One campaign loop.

## 3. The two lanes

| Lane | Window |
| --- | --- |
| Germany | Oct → Jan |

## 4. The weekly rhythm

| Day | Focus |
| --- | --- |
| Monday | Applications |

## 5. Risks and recovery rules

- Guard the résumé.

## 6. The map of everything

- [CV](cv.md)
`;

test("plan generation keeps study links, strips private links and drops the map", () => {
  const plan = generateCareerPlan(fixture);
  assert.equal(plan.version, 1);
  assert.equal(plan.updated, "17 October 2026 (IST)");
  assert.equal(
    plan.window,
    "12 October 2026 → 3 January 2027, then a 4–7 January review.",
  );
  assert.equal(plan.title, "Career Roadmap — start here");
  assert.equal(plan.sourceDigest.length, 64);
  assert.equal(plan.sections.length, 5);
  assert.equal(
    plan.sections[0].id,
    "1-will-companies-hire-this-profile-the-honest-answer",
  );
  assert.ok(plan.sections[0].markdown.includes("LeaseTeq note"));
  assert.ok(!plan.sections[0].markdown.includes("reports/leaseteq"));
  assert.ok(
    plan.sections[0].markdown.includes(
      "[study site](https://study.buildora.work/roadmap.md)",
    ),
  );
  assert.ok(plan.intro?.includes("What this is"));
  assert.ok(!plan.sections.some((section) => section.title.startsWith("6.")));
  assert.ok(plan.generatedAt.endsWith("Z"));
});

test("plan generation refuses a document without the updated meta line", () => {
  assert.throws(
    () =>
      generateCareerPlan(
        "# X\n\n## 1. A\n\nb\n\n## 2. B\n\nc\n\n## 3. C\n\nd\n\n## 4. D\n\ne\n",
      ),
    /Updated and Search window/,
  );
});

test("plan generation refuses an empty section body", () => {
  assert.throws(
    () =>
      generateCareerPlan(
        "# X\n\n**Updated:** today. **Search window:** now.\n\n## 1. A\n\nb\n\n## 2. B\n\nc\n\n## 3. C\n\nd\n\n## 4. D\n\n",
      ),
    /is empty/,
  );
});
