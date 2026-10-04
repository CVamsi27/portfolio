import { test, expect } from "@playwright/test";
import { seed, todayKey } from "./helpers";
const task = {
  id: "planned",
  text: "Build the shipping feature",
  done: false,
  date: todayKey(),
  priority: "P1",
  tag: "Work",
  createdAt: 1,
};
test("task deletion and completed cleanup offer undo, and dates are editable", async ({
  page,
}) => {
  await seed(page, { "vk:todos": [task] });
  await page.goto("/todo");
  await page.getByText(task.text, { exact: true }).click();
  await page
    .getByLabel("Due date for Build the shipping feature")
    .fill("2026-12-01");
  await page.getByRole("button", { name: "Upcoming", exact: true }).click();
  await expect(page.getByText(task.text, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await expect(page.getByText(task.text, { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Undo task deletion" }).click();
  await expect(page.getByText(task.text, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: `Mark "${task.text}" done`, exact: true })
    .click();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear completed", exact: true })
    .click();
  await page.getByRole("button", { name: "Undo task deletion" }).click();
  await expect(page.getByText(task.text, { exact: true })).toBeVisible();
});
test("Today and task focus open the intended task in the shared Plan workspace", async ({
  page,
}) => {
  await seed(page, { "vk:todos": [task] });
  await page.goto("/hub");
  await page
    .getByRole("link", { name: "Start focused work", exact: true })
    .click();
  await expect(page.getByTestId("focus-sprint")).toContainText(task.text);
});
test("study sessions stay visible across routes and use the same active record", async ({
  page,
}) => {
  await seed(page, {
    "vk:study:active_session": {
      id: "study",
      chapterId: "one",
      chapterTitle: "Database design",
      chapterUrl: "https://study.buildora.work",
      stack: "Backend",
      day: 1,
      date: todayKey(),
      startedAt: Date.now(),
      pausedMs: 0,
      targetMinutes: 25,
      distractionCount: 0,
      attentionChecksTotal: 0,
      attentionChecksPassed: 0,
      strictLockdown: false,
      notes: "",
    },
  });
  await page.goto("/health");
  await expect(page.getByTestId("study-session-status")).toContainText(
    "Database design",
  );
  await page.goto("/plan?view=focus");
  await page
    .getByRole("button", { name: "Start focus sprint", exact: true })
    .click();
  await expect(
    page.getByText(
      "A study session is already active. Resume or finish it from Roadmap first.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause study session" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume study session" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel study session" }).click();
  await expect(page.getByTestId("study-session-status")).toBeHidden();
  const record = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:work:active")!),
  );
  expect(record).toMatchObject({ version: 1, current: null });
});
test("Review includes saved study, water, movement and body records without inventing values", async ({
  page,
}) => {
  await seed(page, {
    "vk:study:completed_chapters": [
      {
        chapterId: "one",
        chapterTitle: "Database design",
        stack: "Backend",
        day: 1,
        date: todayKey(),
        completedAt: new Date().toISOString(),
        durationMinutes: 18,
        distractions: 0,
        notes: "",
      },
    ],
    "vk:fasting:water": { [todayKey()]: 3 },
    "vk:weight-loss": {
      entries: { [todayKey()]: { weightKg: 70, updatedAt: 1 } },
      recoveryByDay: {},
    },
    "vk:workouts": {
      [todayKey()]: {
        squat: { done: true, sets: [{ reps: 5, weightKg: 40 }] },
      },
    },
  });
  await page.goto("/review");
  await expect(page).toHaveURL(/view=reflection/);
  await expect(
    page.getByRole("heading", { name: "Daily reflection" }),
  ).toBeVisible();
  await page.goto("/dashboard?view=work&metric=learning");
  await expect(page.locator("#learning")).toContainText("18 min");
  await page.goto("/dashboard?view=health&metric=wellbeing");
  await expect(page.locator("#wellbeing")).toContainText("3");
  await page.getByLabel("Progress metric").selectOption("body");
  await expect(page.locator("#body")).toContainText("70 kg");
});

test("invalid active-session backups fail before changing any records", async ({
  page,
}) => {
  await seed(page, { "vk:todos": [task] });
  await page.goto("/settings#data");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Import backup/ }).click();
  await (
    await chooser
  ).setFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        app: "vk-tracker-suite",
        version: 2,
        data: {
          todos: [],
          "work:active": {
            version: 1,
            current: {
              kind: "study",
              session: { id: "bad", startedAt: "tomorrow" },
            },
          },
        },
      }),
    ),
  });
  await expect(page.getByText("Import failed", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("vk:todos")!)),
  ).toEqual([task]);
});

test("Today keeps the routine compact while all schedule items remain reachable", async ({
  page,
}) => {
  const { routineDefaults } = await import("../src/lib/routine-reminders");
  await page.clock.install({ time: new Date("2026-10-05T02:00:00Z") });
  await seed(page, {
    "vk:routine:schedules": Object.fromEntries(
      routineDefaults("cvamsik99@gmail.com").map((item) => [item.id, item]),
    ),
  });
  await page.goto("/hub");
  const routine = page.getByTestId("day-agenda");
  await expect(routine).toContainText("Omega-3 with lunch");
  await expect(routine.getByRole("listitem")).toHaveCount(7);
  await page.getByText("Time zones & reminders", { exact: true }).click();
  await page
    .getByRole("link", { name: "Manage reminders", exact: true })
    .click();
  await expect(
    page.getByText("Omega-3 with lunch", { exact: true }).first(),
  ).toBeVisible();
});

test("task capture uses the device calendar date at an IST day boundary", async ({
  browser,
}) => {
  const context = await browser.newContext({ timezoneId: "Asia/Kolkata" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-10-03T20:00:00Z") });
  await seed(page);
  await page.goto("/todo");
  await page
    .getByRole("textbox", { name: "New task", exact: true })
    .fill("Local calendar task");
  await page
    .getByRole("textbox", { name: "New task", exact: true })
    .press("Enter");
  const todos = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:todos")!),
  );
  expect(todos[0].date).toBe("2026-10-04");
  await context.close();
});

test("Library keeps the old archive URL and goal planning links directly to Motivation", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/archive");
  await expect(
    page.getByRole("heading", { name: "Library", exact: true }),
  ).toBeVisible();
  await page.goto("/goal");
  await page.getByRole("link", { name: "Motivation", exact: true }).click();
  await expect(page).toHaveURL(/\/motivation$/);
});

test("phone task date editing does not overlap action controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await seed(page, { "vk:todos": [task] });
  await page.goto("/todo");
  await page.getByText(task.text, { exact: true }).click();
  const date = await page.getByLabel(`Due date for ${task.text}`).boundingBox();
  const priority = await page
    .getByRole("button", { name: "Cycle priority", exact: true })
    .boundingBox();
  expect(
    date &&
      priority &&
      (date.y >= priority.y + priority.height ||
        date.x + date.width <= priority.x ||
        priority.x + priority.width <= date.x),
  ).toBe(true);
});
