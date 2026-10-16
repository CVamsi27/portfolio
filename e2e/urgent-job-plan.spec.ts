import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { seed } from "./helpers";

const date = "2026-10-16";
const appId = `germany:2026:day:${date}:assignment:applications`;
// Run the ESM authoring boundary with Node; Playwright's CommonJS transform
// cannot load a CLI module containing import.meta directly.
const roadmap = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
    import { roadmapFixture } from './scripts/fixtures/job-plan.mjs';
    import { urgentCampaignFixture, urgentLearningFixture } from './scripts/fixtures/urgent-job-plan.mjs';
    import { generateUrgentJobPlan } from './scripts/generate-urgent-job-plan.mjs';
    process.stdout.write(JSON.stringify(generateUrgentJobPlan(roadmapFixture(), urgentCampaignFixture, urgentLearningFixture).roadmap));
  `,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    },
  ),
);

async function setup(page: Page, plan = roadmap) {
  await page.clock.install({ time: new Date("2026-10-16T04:00:00Z") });
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: plan },
    "vk:timetable_100_days": {
      timezone: "Asia/Kolkata",
      days: ["2026-10-14", "2026-10-15", date, "2026-10-17", "2026-10-18"].map(
        (day, index) => ({
          date: day,
          day: 15 + index,
          title: "Synthetic study",
          topic: "Runtime boundaries",
          chapters: [],
          checklist: [],
          schedule: {},
        }),
      ),
    },
  });
}

test("Today opens the active career commitment at its dated assignment and evidence form", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/hub?date=${date}`);
  const commitment = page.getByRole("link", { name: "Open commitment", exact: true });
  await expect(commitment).toHaveAttribute(
    "href",
    /\/roadmap\?view=execution&panel=today&date=2026-10-16&task=germany:2026:day:2026-10-16&assignment=germany%3A2026%3Aday%3A2026-10-16%3Aassignment%3Aapplications/,
  );
  await commitment.click();
  const row = page.getByTestId(`assignment-${appId}`);
  await expect(row).toHaveAttribute("open", "");
  await expect(row).toBeFocused();
  await row.getByRole("button", { name: "Add evidence", exact: true }).click();
  await expect(row.getByRole("textbox", { name: "Result and checks" })).toBeVisible();
});

test("Today retains the generic study commitment destination without a career assignment", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-16T04:00:00Z") });
  await seed(page, {
    "vk:plan:blocks": {
      "generic-study": {
        id: "generic-study",
        date,
        startLocal: "09:00",
        durationMinutes: 60,
        kind: "study",
        title: "Independent reading",
        timeZone: "Asia/Kolkata",
        updatedAt: 1,
      },
    },
  });
  await page.goto(`/hub?date=${date}`);
  await expect(
    page.getByRole("link", { name: "Open commitment", exact: true }),
  ).toHaveAttribute("href", "/roadmap?view=today");
});

test("urgent assignments agree across Today and Plan and retain evidence after reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.goto(`/hub?date=${date}`);
  const agenda = page.getByTestId("day-agenda");
  const today = agenda
    .locator("li.nova-agenda-row")
    .filter({ hasText: "Applications and qualification" });
  await expect(today).toHaveCount(1);
  await today.locator("summary").click();
  await expect(today.getByText(/USD 73\/hour/)).toBeVisible();
  await today.getByRole("link", { name: "Record assignment evidence" }).click();
  const row = page.getByTestId(`assignment-${appId}`);
  await expect(
    row.getByText("08:00–11:00 · 180 min", { exact: true }),
  ).toBeVisible();
  await row.getByRole("button", { name: "Add evidence", exact: true }).click();
  await row
    .getByRole("textbox", { name: "Result and checks" })
    .fill(
      "Qualified the synthetic role against its stated location and pay. Prepared the packet with three actual examples; submission remains pending and its next action is recorded.",
    );
  await row.getByRole("button", { name: "Save evidence", exact: true }).click();
  await page.goto(`/plan?date=${date}`);
  const plan = page.getByRole("region", { name: "Job timetable" });
  const planned = plan.getByTestId(`assignment-${appId}`);
  await expect(
    planned.locator("summary").getByText("Evidence saved", { exact: true }),
  ).toBeVisible();
  await expect(
    planned.getByText("08:00–11:00 · 180 min", { exact: true }),
  ).toBeVisible();
  await expect(
    plan.getByTestId(`assignment-germany:2026:day:${date}:assignment:network`),
  ).toBeVisible();
  await expect(
    plan.getByTestId(`assignment-germany:2026:day:${date}:assignment:oss`),
  ).toBeVisible();
  await page.reload();
  await expect(
    planned.locator("summary").getByText("Evidence saved", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("urgent qualification links open the current campaign and preserve the guide after reload", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/plan?date=${date}`);
  const row = page.getByTestId(`assignment-${appId}`);
  await row.locator("summary").click();
  await row
    .getByRole("link", { name: "Current remote/Germany campaign", exact: true })
    .first()
    .click();
  const guide = page.locator("#germany-guide-campaign");
  await expect(guide).toHaveAttribute("open", "");
  await expect(guide.getByText(/USD 151,840 gross annual base/)).toBeVisible();
  await expect(
    guide.getByText("Start now — the next four focused hours", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(guide).toHaveAttribute("open", "");
  await expect(guide.getByText(/USD 151,840 gross annual base/)).toBeVisible();
});

test("urgent Saturday remains five hours and Sunday has no required assignments", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/plan?date=2026-10-17");
  const plan = page.getByRole("region", { name: "Job timetable" });
  await expect(
    plan.getByText("10:15–12:15 · 120 min", { exact: true }),
  ).toBeVisible();
  await expect(
    plan.getByText("15:00–15:15 · 15 min", { exact: true }),
  ).toBeVisible();
  await page.goto("/plan?date=2026-10-18");
  await expect(
    page.locator('[data-testid^="assignment-germany:"]'),
  ).toHaveCount(0);
});

test("urgent campaign action uses current qualification and labels the retained weekly source historical", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/roadmap?view=execution&panel=today&date=${date}`);
  const action = page
    .getByRole("heading", { name: "Campaign action", exact: true })
    .locator("..");
  await action.getByText("Current campaign brief", { exact: true }).click();
  await expect(action.getByText(/USD 73\/hour/)).toBeVisible();
  await expect(action.getByText(/India eligibility/)).toBeVisible();
  const historical = action.locator("details").filter({
    has: page.getByText("Historical weekly campaign source", { exact: true }),
  });
  await expect(historical).not.toHaveAttribute("open", "");
  await historical.locator("summary").click();
  await expect(
    historical.getByText(roadmap.execution.weeks[0].application, {
      exact: true,
    }),
  ).toBeVisible();
  await action
    .getByRole("button", { name: "Open current campaign guide", exact: true })
    .click();
  await expect(page.locator("#germany-guide-campaign")).toHaveAttribute(
    "open",
    "",
  );
  await page.goto("/roadmap?view=execution&panel=today&date=2026-10-14");
  const previous = page
    .getByRole("heading", { name: "Campaign action", exact: true })
    .locator("..");
  await expect(
    previous.getByText("Campaign brief", { exact: true }),
  ).toBeVisible();
  await expect(
    previous.getByText("Historical weekly campaign source", { exact: true }),
  ).toHaveCount(0);
});

test("Saturday study links and evidence keep Saturday's date when another weekday is selected", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const saturdayId = "germany:2026:day:2026-10-17:assignment:study";
  await page.goto(`/roadmap?view=execution&panel=this-week&date=${date}`);
  const saturday = page
    .getByText("Saturday: exam, funnel, relocation and review", { exact: true })
    .locator("..");
  await saturday.locator(":scope > summary").click();
  const studyLink = saturday
    .locator('a[href^="https://study.buildora.work/"]')
    .first();
  await expect(studyLink).toHaveAttribute(
    "href",
    /[?&]roadmapDate=2026-10-17(?:&|$)/,
  );
  await expect(studyLink).toHaveAttribute(
    "href",
    /[?&]roadmapTask=germany%3A2026%3Aday%3A2026-10-17(?:&|$)/,
  );
  const assignment = saturday.getByTestId(`assignment-${saturdayId}`);
  await assignment.locator("summary").click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const record = assignment.getByRole("link", {
    name: "Record assignment evidence",
  });
  await expect(record).toHaveAttribute("href", /[?&]date=2026-10-17(?:&|$)/);
  await record.click();
  const todayAssignment = page.getByTestId(`assignment-${saturdayId}`);
  await todayAssignment
    .getByRole("button", { name: "Add evidence", exact: true })
    .click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await todayAssignment
    .getByRole("textbox", { name: "Result and checks" })
    .fill(
      "Traced the Saturday source using a changed invalid input. Saved the observed validation failure, corrected explanation and the remaining gap for review.",
    );
  await todayAssignment
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await page.goto(`/roadmap?view=execution&panel=this-week&date=${date}`);
  await saturday.locator(":scope > summary").click();
  await expect(
    assignment.locator("summary").getByText("Evidence saved", { exact: true }),
  ).toBeVisible();
});

test("the legacy Saturday fallback also keeps its own study return date", async ({
  page,
}) => {
  const legacyPlan = structuredClone(roadmap);
  delete legacyPlan.execution.jobPlan;
  legacyPlan.allocations = [{ label: "Historical campaign", hours: 50 }];
  legacyPlan.execution.assessments.find(
    (assessment: { id: string }) => assessment.id === "E01",
  ).content +=
    " [Legacy Saturday study](https://study.buildora.work/10-frontend/10.2-typescript/01-foundations/10.2.1.03-type-narrowing.md).";
  await setup(page, legacyPlan);
  await page.goto("/roadmap?view=execution&panel=this-week&date=2026-10-14");
  const saturday = page
    .getByText("Saturday: exam, funnel, relocation and review", { exact: true })
    .locator("..");
  await saturday.locator(":scope > summary").click();
  const study = saturday.getByRole("link", { name: "Legacy Saturday study" });
  await expect(study).toHaveAttribute(
    "href",
    /[?&]roadmapDate=2026-10-17(?:&|$)/,
  );
  await expect(study).toHaveAttribute(
    "href",
    /[?&]roadmapTask=germany%3A2026%3Aday%3A2026-10-17(?:&|$)/,
  );
});
