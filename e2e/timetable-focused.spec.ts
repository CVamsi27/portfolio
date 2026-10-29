import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { seed } from "./helpers";

test.use({ timezoneId: "Asia/Kolkata", screenshot: "off", trace: "off" });

const plan = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `import {readFileSync} from 'node:fs'; import {roadmapFixture} from './scripts/fixtures/job-plan.mjs'; import {generateStudyDayRoadmap} from './scripts/generate-job-plan.mjs'; process.stdout.write(JSON.stringify(generateStudyDayRoadmap(roadmapFixture(),JSON.parse(readFileSync('./src/data/career-curriculum.json','utf8')))));`,
    ],
    { encoding: "utf8", maxBuffer: 12 * 1024 * 1024 },
  ),
);

const historicalDate = "2026-10-26";
const assignmentId =
  "fullstack:2026-10-26:day:2026-10-26:assignment:applications:0830";
const application = plan.execution.jobPlan.days[0].assignments.find(
  (assignment: { id: string }) => assignment.id === assignmentId,
);
const revisedPlan = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `import {readFileSync} from 'node:fs';import {roadmapFixture} from './scripts/fixtures/job-plan.mjs';import {generateStudyDayRoadmap} from './scripts/generate-job-plan.mjs';import {BALANCED_7AM_SCHEDULE_REVISION} from './src/lib/job-plan.ts';process.stdout.write(JSON.stringify(generateStudyDayRoadmap(roadmapFixture(),JSON.parse(readFileSync('./src/data/career-curriculum.json','utf8')),{scheduleRevision:BALANCED_7AM_SCHEDULE_REVISION})));`,
    ],
    { encoding: "utf8", maxBuffer: 12 * 1024 * 1024 },
  ),
);

test("Plan presents each fixed commitment once alongside editable personal activities", async ({
  page,
}) => {
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: plan },
    "vk:plan:blocks": {
      appointment: {
        id: "appointment",
        date: historicalDate,
        startLocal: "18:30",
        durationMinutes: 30,
        timeZone: "Asia/Kolkata",
        kind: "event",
        title: "Synthetic appointment",
        updatedAt: 1,
      },
    },
  });
  await page.goto(`/plan?date=${historicalDate}`);
  await expect(page.getByText(application.title, { exact: true })).toHaveCount(
    1,
  );
  await expect(
    page.getByText("Synthetic appointment", { exact: true }),
  ).toBeVisible();
  const personal = page
    .getByTestId("day-agenda")
    .locator("li")
    .filter({ hasText: "Synthetic appointment" });
  await expect(
    personal.getByRole("button", { name: "Edit", exact: true }),
  ).toBeVisible();
  await personal.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Edit activity" }),
  ).toBeVisible();
});

test("Today uses one exact assignment action in the header and agenda", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-26T04:00:00Z") });
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: revisedPlan },
  });
  await page.goto(`/hub?date=${historicalDate}`);
  const primary = page
    .getByTestId("today-header")
    .getByRole("link", { name: "Open commitment", exact: true });
  await expect(primary).toHaveAttribute(
    "href",
    /assignment=fullstack%3A2026-10-26%3Aday%3A2026-10-26%3Aassignment%3Aapplications%3A0830/,
  );
  await expect(
    page.getByTestId("today-next-action").getByRole("link"),
  ).toHaveCount(0);
  const row = page
    .getByTestId("day-agenda")
    .locator(".nova-agenda-row")
    .filter({ has: page.getByText(application.title, { exact: true }) });
  await row.locator("summary").first().click();
  await expect(
    row.getByRole("link", { name: "Start", exact: true }),
  ).toHaveAttribute("href", (await primary.getAttribute("href")) as string);
});

test("new routine groups study assignments and keeps the week useful on a narrow phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: revisedPlan },
  });
  await page.goto("/plan?date=2026-10-30");
  const agenda = page.getByTestId("day-agenda");
  await expect(agenda.getByText("Refresh", { exact: true })).toBeVisible();
  await expect(agenda.getByText("Exercise", { exact: true })).toBeVisible();
  await expect(agenda.getByText("Bath", { exact: true })).toBeVisible();
  const morning = agenda.getByTestId("study-window-morning-study");
  await expect(morning.locator("summary").first()).toContainText("09:00–14:00");
  await expect(morning.locator("summary").first()).toContainText(
    "Morning study",
  );
  await expect(
    morning.getByRole("link", { name: "Record assignment evidence" }).first(),
  ).toBeHidden();
  await morning.locator("summary").first().click();
  await expect(morning.getByTestId(/^assignment-/).first()).toBeVisible();
  await morning
    .getByTestId(/^assignment-/)
    .first()
    .locator("summary")
    .click();
  await expect(
    morning.getByRole("link", { name: "Record assignment evidence" }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Week", exact: true }).click();
  const week = page.getByTestId("plan-week-agenda");
  await expect(week.getByTestId("plan-week-day-2026-10-26")).toBeVisible();
  await expect(week.getByTestId("plan-week-day-2026-11-01")).toContainText(
    "Sunday off",
  );
  await expect(week.getByTestId("plan-week-day-2026-10-30")).toContainText(
    "10h study",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("a compressed saved history reloads into the same dated assignments", async ({
  page,
}) => {
  const { encodeTrackerHistory } = await import("../src/lib/tracker-history");
  const value = {
    germanyRoadmap: revisedPlan,
    roadmapHistory: [{ note: "Retained synthetic history ".repeat(20000) }],
  };
  const wire = await encodeTrackerHistory("career_command_center", value, {local:true});
  await seed(page, { "vk:career_command_center": wire });
  await page.goto("/plan?date=2026-10-30");
  const morning = page.getByTestId("study-window-morning-study");
  await expect(morning.locator("summary").first()).toContainText("09:00–14:00");
  await morning.locator("summary").first().click();
  await expect(morning.getByTestId(/^assignment-/)).toHaveCount(4);
  await page.reload();
  await expect(page.getByTestId("study-window-morning-study")).toBeVisible();
});
