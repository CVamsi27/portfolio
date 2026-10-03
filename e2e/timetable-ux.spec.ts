import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.use({ timezoneId: "UTC" });

const longLabel =
  "Read the entire chapter, explain the missing mechanism, and capture practical evidence without losing any instructions on a narrow phone screen";
async function setup(page: import("@playwright/test").Page) {
  await page.clock.install({ time: new Date("2026-10-03T09:05:00Z") });
  await seed(page, {
    "vk:timetable_100_days": {
      timezone: "UTC",
      days: [
        {
          day: 4,
          date: "2026-10-03",
          topic: "Study",
          title: "Readable daily plan",
          studyLink: "https://study.buildora.work",
          mission: "Save evidence",
          practiceTask: "Build a tested slice",
          checklist: [],
          interviewQuestions: [],
          chapters: [],
          schedule: {
            "08:00-09:00": {
              label: "Earlier research block",
              minutes: 60,
              work: true,
              output: "Verified role notes",
            },
            "09:00-09:10": {
              label: longLabel,
              minutes: 10,
              work: true,
              output: "Notes and a correct recall answer",
            },
            "09:15-09:45": {
              label: "Practical follow-up",
              minutes: 30,
              work: true,
              output: "Passing tests",
            },
            "10:00-10:30": { label: "Meal break", minutes: 30, work: false },
          },
        },
        {
          day: 5,
          date: "2026-10-04",
          topic: "Study",
          title: "Tomorrow's plan",
          studyLink: "https://study.buildora.work",
          mission: "Next day",
          practiceTask: "Next slice",
          checklist: [],
          interviewQuestions: [],
          chapters: [],
          schedule: {
            "09:00-10:00": {
              label: "Tomorrow's practice",
              minutes: 60,
              work: true,
            },
          },
        },
      ],
    },
  });
  await page.goto("/hub");
  return page.getByRole("region", { name: "Today's timetable" });
}

test("timetable shows focus budget and full instructions without marking elapsed work complete", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const timetable = await setup(page);
  await expect(timetable).toContainText("1h 40m planned focus");
  await expect(timetable).toContainText("Notes and a correct recall answer");
  const label = timetable.locator("ol").getByText(longLabel, { exact: true });
  await expect(label).toBeVisible();
  expect(
    await label.evaluate(
      (el) =>
        el.scrollWidth <= el.clientWidth &&
        getComputedStyle(el).textOverflow !== "ellipsis",
    ),
  ).toBe(true);
  expect(
    await timetable
      .getByText("Earlier research block", { exact: true })
      .evaluate((el) => getComputedStyle(el).textDecorationLine),
  ).not.toContain("line-through");
  await expect(timetable).toContainText("Next: 09:15–09:45");
});

test("current block refreshes at the boundary and break keeps the next action visible", async ({
  page,
}) => {
  const timetable = await setup(page);
  await expect(timetable).toContainText("Now: 09:00–09:10");
  await page.clock.fastForward(5 * 60_000);
  await expect(timetable).toContainText("Between blocks");
  await expect(timetable).toContainText("Next: 09:15–09:45");
  await page.clock.fastForward(5 * 60_000);
  await expect(timetable).toContainText("Now: 09:15–09:45");
});

test("schedule disclosure exposes its state and keeps summary available", async ({
  page,
}) => {
  const timetable = await setup(page);
  const toggle = timetable.getByRole("button", { name: "Hide schedule" });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(
    timetable.getByText("Earlier research block", { exact: true }),
  ).toBeHidden();
  await expect(timetable).toContainText("1h 40m planned focus");
  await expect(
    timetable.getByRole("button", { name: "Show schedule" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("open Today updates its plan across midnight", async ({ page }) => {
  const timetable = await setup(page);
  await page.clock.fastForward(15 * 60 * 60_000);
  await expect(timetable).toContainText("Tomorrow's practice");
  await expect(timetable).toContainText("1h planned focus");
  await expect(
    timetable.getByText("Earlier research block", { exact: true }),
  ).toHaveCount(0);
});

test("roadmap summary and expanded schedule share totals and full outputs", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/roadmap");
  await expect(
    page.getByRole("region", { name: "Today's timetable" }),
  ).toContainText("1h 40m planned focus");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  const schedule = page.getByRole("region", { name: "Day schedule" });
  await expect(schedule).toContainText("1h 40m planned focus");
  await expect(schedule).toContainText("Notes and a correct recall answer");
});

test("legacy schedules show planned time without inventing a focus budget", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem("vk:timetable_100_days")!);
    plan.days[0].schedule = { "09:00-10:00": "Unclassified legacy block" };
    localStorage.setItem("vk:timetable_100_days", JSON.stringify(plan));
  });
  await page.reload();
  const timetable = page.getByRole("region", { name: "Today's timetable" });
  await expect(timetable).toContainText("1h scheduled");
  await expect(timetable).not.toContainText("planned focus");
});
