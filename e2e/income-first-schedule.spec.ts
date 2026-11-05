import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { seed } from "./helpers";

// Build only synthetic fixtures through the real private-authoring logic; never load personal files.
const { previous, current } = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      "import {readFileSync} from 'node:fs'; import {roadmapFixture} from './scripts/fixtures/job-plan.mjs'; import {generateStudyDayRoadmap} from './scripts/generate-job-plan.mjs'; import {generateIncomeFirstPlan} from './scripts/generate-income-first-plan.ts'; import {BALANCED_7AM_SCHEDULE_REVISION} from './src/lib/personal-timetable.ts'; const previous=generateStudyDayRoadmap(roadmapFixture(),JSON.parse(readFileSync('./src/data/career-curriculum.json','utf8')),{scheduleRevision:BALANCED_7AM_SCHEDULE_REVISION}); process.stdout.write(JSON.stringify({previous,current:generateIncomeFirstPlan(previous)}));",
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
    },
  ),
);

const date = "2026-11-05";
const assignmentId = `income-first:2026-11-05:day:${date}:assignment:applications`;
const existingEvidence = {
  evidence: {
    value:
      "A previous independently recorded result is retained with its original identity.",
  },
  completedAt: "2026-11-04T12:00:00Z",
};
const data = () => ({
  "vk:career_command_center": {
    germanyRoadmap: current,
    roadmapHistory: [previous],
  },
  "vk:timetable_100_days": { timezone: "Asia/Kolkata", days: [] },
  "vk:career_execution_state": {
    version: 1,
    evidenceByItemId: { "retained-history": existingEvidence },
    archivedItems: [],
  },
});

test("income assignment deep links focus the correct row and evidence survives Plan navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date("2026-11-05T04:00:00Z") });
  await seed(page, data());
  await page.goto(
    `/roadmap?view=execution&panel=today&date=${date}&task=fullstack:2026-10-26:day:${date}&assignment=${encodeURIComponent(assignmentId)}`,
  );
  const assignment = page.getByTestId(`assignment-${assignmentId}`);
  await expect(assignment).toBeFocused();
  await expect(assignment.getByText("09:00–11:00 · 120 min")).toBeVisible();
  await assignment
    .getByRole("button", { name: "Add evidence", exact: true })
    .click();
  await assignment
    .getByRole("textbox", { name: "Result and checks" })
    .fill(
      "Reviewed a synthetic employer's actual role and prepared a truthful application. No application was sent; eligibility and compensation remain to confirm.",
    );
  await assignment
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await page.goto(`/plan?date=${date}&view=week`);
  await expect(
    page
      .getByTestId(`assignment-${assignmentId}`)
      .getByText("Evidence saved", { exact: true }),
  ).toBeVisible();
  const evidence = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("vk:career_execution_state")!)
        .evidenceByItemId,
  );
  expect(evidence["retained-history"]).toEqual(existingEvidence);
  expect(evidence[assignmentId].verifiedAt).toBeUndefined();
});

test("a full income-first week contains five six-hour days and one two-hour review on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.clock.install({ time: new Date("2026-11-09T04:00:00Z") });
  await seed(page, data());
  await page.goto("/plan?date=2026-11-09&view=week");
  await expect(page.getByTestId(/^assignment-income-first:/)).toHaveCount(26);
  await expect(
    page.getByTestId(
      "assignment-income-first:2026-11-05:day:2026-11-14:assignment:review",
    ),
  ).toContainText("09:00–11:00 · 120 min");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.goto("/roadmap?view=execution&panel=today&date=2026-11-15");
  await expect(
    page.getByText(/Recovery Sunday\. No required work/),
  ).toBeVisible();
  await expect(page.getByTestId(/^assignment-income-first:/)).toHaveCount(0);
});

test("earlier dated plans keep their old assignment identities and clocks", async ({
  page,
}) => {
  await seed(page, data());
  await page.goto("/plan?date=2026-11-04&view=day");
  await expect(
    page.getByTestId(
      "assignment-fullstack:2026-10-26:day:2026-11-04:assignment:study:0630",
    ),
  ).toContainText("09:00–10:30 · 90 min");
  await expect(page.getByTestId(/^assignment-income-first:/)).toHaveCount(0);
});

test("weekly review reads the selected career schedule rather than the legacy study workload", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-15T04:00:00Z") });
  await seed(page, data());
  await page.goto("/review?date=2026-11-15");
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Mon 9" })
      .filter({ hasText: "5 blocks scheduled" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Sat 14" })
      .filter({ hasText: "1 block scheduled" }),
  ).toBeVisible();
});
