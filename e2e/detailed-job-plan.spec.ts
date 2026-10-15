import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
import { roadmapFixture } from "../scripts/fixtures/job-plan.mjs";
const date = "2026-10-15";
const id = `germany:2026:day:${date}:assignment:study`;
async function setup(page: import("@playwright/test").Page) {
  await page.clock.install({ time: new Date("2026-10-15T04:00:00Z") });
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: roadmapFixture() },
    "vk:timetable_100_days": {
      timezone: "Asia/Kolkata",
      days: [
        {
          date,
          day: 16,
          title: "Study",
          topic: "Runtime boundaries",
          chapters: [],
          checklist: [],
          schedule: {},
        },
      ],
    },
  });
}
test("assignment links, instructions and evidence survive expansion and reload at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.goto(`/roadmap?view=execution&panel=today&date=${date}`);
  const row = page.getByTestId(`assignment-${id}`);
  await expect(row.getByText("08:00–09:30 · 90 min")).toBeVisible();
  await expect(
    row.getByRole("link", { name: "Type narrowing", exact: true }),
  ).not.toBeVisible();
  await row.locator("summary").click();
  const url = new URL(
    (await row
      .getByRole("link", { name: "Type narrowing", exact: true })
      .getAttribute("href"))!,
  );
  expect(url.searchParams.get("roadmapDate")).toBe(date);
  expect(url.searchParams.get("roadmapTask")).toBe(`germany:2026:day:${date}`);
  await expect(row.getByRole("list").first().getByRole("listitem")).toHaveCount(
    2,
  );
  const evidence = row.getByTestId(id);
  await evidence
    .getByRole("button", { name: "Add evidence", exact: true })
    .click();
  await evidence
    .getByRole("textbox", { name: "Result and checks" })
    .fill(
      "The synthetic invalid payload is rejected at runtime. Saved the test command, observed failure and corrected the unaided type-boundary explanation.",
    );
  await evidence
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await expect(evidence.getByRole("status")).toHaveText(
    "Evidence saved · needs verification",
  );
  await page.reload();
  await row.locator("summary").click();
  await expect(evidence.getByRole("status")).toHaveText(
    "Evidence saved · needs verification",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
test("Today and Plan expose the same assignment and evidence destination without duplicating old slots", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/hub?date=${date}`);
  const today = page.getByTestId("day-agenda");
  const row = today
    .locator("li.nova-agenda-row")
    .filter({ hasText: "Type narrowing at runtime" });
  await expect(row).toHaveCount(1);
  await row.locator("summary").click();
  await expect(
    row.getByRole("link", { name: "Type narrowing", exact: true }),
  ).toBeVisible();
  await row.getByRole("link", { name: "Record assignment evidence" }).click();
  await expect(
    page
      .getByTestId(`assignment-${id}`)
      .getByRole("button", { name: "Add evidence", exact: true }),
  ).toBeVisible();
  await page.goto(`/plan?date=${date}`);
  const plan = page.getByRole("region", { name: "Job timetable" });
  await expect(
    plan.getByText("Type narrowing at runtime", { exact: true }),
  ).toBeVisible();
  await expect(plan.getByText("08:00–09:30 · 90 min")).toBeVisible();
  const assignment = plan.getByTestId(`assignment-${id}`);
  await assignment.locator("summary").click();
  await assignment
    .getByRole("link", { name: "Exercise bank", exact: true })
    .click();
  await expect(page.locator("#germany-guide-curriculum")).toHaveAttribute(
    "open",
    "",
  );
  await expect(
    page.getByText("Synthetic guide for curriculum", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Synthetic guide for curriculum", { exact: true }),
  ).toBeVisible();
});
test("unsafe assignment payload is not rendered as an active career plan", async ({
  page,
}) => {
  const plan = roadmapFixture();
  plan.execution.jobPlan.days[3].assignments[0].brief =
    "[Unsafe](javascript:alert(1))";
  await seed(page, { "vk:career_command_center": { germanyRoadmap: plan } });
  await page.goto("/roadmap?view=execution");
  await expect(
    page.getByRole("heading", { name: "Career plan unavailable", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Unsafe", exact: true }),
  ).toHaveCount(0);
});

test("Week includes linked assignments on each workday and avoids an empty activity panel beside a full timetable", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/plan?view=week&date=${date}`);
  const timetable = page.getByRole("region", { name: "Job timetable" });
  await expect(
    timetable.getByTestId("job-day-2026-10-16").locator("summary").first(),
  ).toBeVisible();
  await expect(timetable.getByTestId("job-day-2026-10-18")).toHaveCount(0);
  await timetable
    .getByTestId("job-day-2026-10-16")
    .locator("summary")
    .first()
    .click();
  await expect(
    timetable
      .getByTestId("assignment-germany:2026:day:2026-10-16:assignment:study")
      .getByText("08:00–09:30 · 90 min"),
  ).toBeVisible();
  await expect(
    page.getByText("No activities in this week. Add an activity to begin.", {
      exact: true,
    }),
  ).not.toBeVisible();
});

test("saved and verified evidence stays consistent across pages and editing revokes the verified label", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/roadmap?view=execution&panel=today&date=${date}`);
  const row = page.getByTestId(`assignment-${id}`);
  await row.locator("summary").click();
  const evidence = row.getByTestId(id);
  await evidence
    .getByRole("button", { name: "Add evidence", exact: true })
    .click();
  await evidence
    .getByRole("textbox", { name: "Result and checks" })
    .fill(
      "The malformed payload is rejected. Saved the runtime trace, the exact test command, actual result and one corrected misconception.",
    );
  await evidence
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await expect(
    row.locator("summary").getByText("Evidence saved", { exact: true }),
  ).toBeVisible();
  await evidence
    .getByRole("button", { name: "Verify saved evidence", exact: true })
    .click();
  await expect(
    row.locator("summary").getByText("Verified", { exact: true }),
  ).toBeVisible();
  await page.goto(`/plan?view=week&date=${date}`);
  const day = page.getByTestId("job-day-2026-10-15");
  await expect(day.locator("summary").first()).toContainText("1/8 verified");
  await expect(
    day
      .getByTestId(`assignment-${id}`)
      .locator("summary")
      .getByText("Verified", { exact: true }),
  ).toBeVisible();
  await page.goto(`/hub?date=${date}`);
  const agenda = page
    .getByTestId("day-agenda")
    .locator("li.nova-agenda-row")
    .filter({ hasText: "Type narrowing at runtime" });
  await expect(
    agenda.locator("summary").getByText("Verified", { exact: true }),
  ).toBeVisible();
  await agenda.locator("summary").click();
  await agenda
    .getByRole("link", { name: "Record assignment evidence" })
    .click();
  await row
    .getByRole("button", { name: "Review evidence", exact: true })
    .click();
  await row
    .getByRole("textbox", { name: "Result and checks" })
    .fill(
      "The changed payload exposed an untested boundary. Saved the failing command and actual observation; verification needs another independent check.",
    );
  await row.getByRole("button", { name: "Save evidence", exact: true }).click();
  await expect(
    row.locator("summary").getByText("Evidence saved", { exact: true }),
  ).toBeVisible();
  await expect(
    row.locator("summary").getByText("Verified", { exact: true }),
  ).toHaveCount(0);
});

test("a week-view evidence link opens and focuses the selected assignment on the same Roadmap route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.goto(`/roadmap?view=execution&panel=this-week&date=${date}`);
  await page.getByText(`Study ${date}`, { exact: true }).click();
  const appId = `germany:2026:day:${date}:assignment:applications`;
  const row = page.getByTestId(`assignment-${appId}`);
  await row.locator("summary").click();
  await row.getByRole("link", { name: "Record assignment evidence" }).click();
  await expect(
    row.getByRole("button", { name: "Add evidence", exact: true }),
  ).toBeVisible();
  await expect(row).toBeFocused();
  await expect(row.locator("summary")).toBeInViewport();
  await page.reload();
  await expect(row).toBeFocused();
});
