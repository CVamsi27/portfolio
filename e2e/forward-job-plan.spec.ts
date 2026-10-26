import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { seed } from "./helpers";
const plan = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `import {readFileSync} from 'node:fs'; import {roadmapFixture} from './scripts/fixtures/job-plan.mjs'; import {generateStudyDayRoadmap} from './scripts/generate-job-plan.mjs'; process.stdout.write(JSON.stringify(generateStudyDayRoadmap(roadmapFixture(),JSON.parse(readFileSync('./src/data/career-curriculum.json','utf8')))));`,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 12 * 1024 * 1024,
    },
  ),
);
const date = "2026-10-26";
const id = `fullstack:2026-10-26:day:${date}:assignment:applications:0830`;
test("forward Today, roadmap evidence and weekly plan share the new assignment without resetting history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date(date + "T04:00:00Z") });
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: plan },
    "vk:timetable_100_days": {
      timezone: "Asia/Kolkata",
      days: [{ date, chapters: [], checklist: [], schedule: {} }],
    },
    "vk:career_execution_state": {
      version: 1,
      evidenceByItemId: {
        "old-evidence": {
          evidence: {
            value: "Previous actual attempt retained for historical review.",
          },
          completedAt: "2026-10-24T06:00:00Z",
        },
      },
      archivedItems: [],
    },
  });
  await page.goto(`/hub?date=${date}`);
  await page
    .getByRole("link", { name: "Open commitment", exact: true })
    .click();
  const row = page.getByTestId(`assignment-${id}`);
  await expect(row).toHaveAttribute("open", "");
  await expect(row).toBeFocused();
  await expect(
    row
      .getByText(/Full-stack only:/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await row.getByRole("button", { name: "Add evidence", exact: true }).click();
  await row
    .getByRole("textbox", { name: "Result and checks" })
    .fill(
      "Prepared a truthful full-stack remote packet against the exact India eligibility requirements. Salary and hours are still unknown; no application was submitted.",
    );
  await row.getByRole("button", { name: "Save evidence", exact: true }).click();
  await page.goto(`/plan?date=${date}&view=week`);
  await expect(
    page
      .getByTestId(`assignment-${id}`)
      .getByText("Evidence saved", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const evidence = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("vk:career_execution_state")!)
        .evidenceByItemId,
  );
  expect(evidence["old-evidence"]).toBeTruthy();
  expect(evidence[id].verifiedAt).toBeUndefined();
});
test("new final week renders and Sunday remains free", async ({ page }) => {
  await seed(page, { "vk:career_command_center": { germanyRoadmap: plan } });
  await page.goto("/roadmap?view=execution&panel=today&date=2027-02-18");
  await expect(page.getByTestId("germany-roadmap")).toContainText(
    "Next-cycle decision",
  );
  await page.goto("/roadmap?view=execution&date=2027-02-18&panel=this-week");
  await expect(
    page.getByText("Week 17 · 2027-02-15–2027-02-18", { exact: true }),
  ).toBeVisible();
  await page.goto("/roadmap?view=execution&panel=today&date=2027-02-14");
  await expect(
    page.getByText(/Recovery Sunday\. No required work/),
  ).toBeVisible();
});

test("career review shows full-stack remote leads without invented fit scores or bulk outreach quotas", async ({
  page,
}) => {
  await seed(page, {
    "vk:career_command_center": {
      germanyRoadmap: plan,
      resumeAnalysis: { strengths: [], gaps: [] },
      targetRoles: {
        germany: [],
        remoteEU: [],
        remoteIndia: [
          {
            id: "particle41-fullstack",
            company: "Synthetic full-stack employer",
            role: "Full Stack Engineer",
            link: "https://example.test/jobs/1",
            status: "research ready",
            notes: "India remote; compensation and hours need review.",
            sourceChecked: "2026-10-25",
            fitScore: null,
          },
        ],
        remote: [],
      },
      roleResearchNote:
        "Source check: 2026-10-25. No verified EU/Germany relocation lead.",
      outreachTemplates: {
        germanySaaS: "Unsent relocation eligibility draft",
        remote: "Unsent India eligibility draft",
        ossMaintainer: "Unsent contribution scope draft",
      },
    },
  });
  await page.goto("/roadmap?view=career");
  await expect(
    page.getByText("Synthetic full-stack employer", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Fit review pending", { exact: true }),
  ).toBeVisible();
  await page.goto("/roadmap?view=outreach");
  await expect(page.getByText(/Send 10 messages per day/)).toHaveCount(0);
  await expect(page.getByText(/Drafts stay unsent until/)).toBeVisible();
});
