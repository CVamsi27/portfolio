import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
test("Plan schedules a task and Today opens the exact task without duplicating it", async ({
  page,
}) => {
  const date = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:todos": [
      {
        id: "api",
        text: "Practice APIs",
        done: false,
        date,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
    ],
  });
  await page.goto("/plan");
  await page
    .getByRole("button", { name: "Add time block", exact: true })
    .click();
  await page.getByLabel("Link task").selectOption("api");
  await page.getByLabel("Start time", { exact: true }).fill("09:00");
  await page
    .getByRole("button", { name: "Save time block", exact: true })
    .click();
  await page.reload();
  await expect(page.getByTestId("day-agenda")).toContainText("Practice APIs");
  await page.goto("/hub");
  await page
    .getByTestId("day-agenda")
    .getByRole("link", { name: "Start", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/task=api/);
  await expect(page.getByTestId("focus-sprint")).toContainText("Practice APIs");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:todos")!).length,
    ),
  ).toBe(1);
});
test("daily capture shows one type and retains a chosen date", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/log?type=task&date=2026-10-03&returnTo=%2Fhub");
  await page.getByLabel("Task name", { exact: true }).fill("Backfilled task");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  const tasks = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:todos")!),
  );
  expect(tasks[0].date).toBe("2026-10-03");
  await expect(
    page.getByRole("link", { name: "Return to Today", exact: true }),
  ).toHaveAttribute("href", "/hub");
});
test("editor shell removes repeated progress and clocks and keeps five primary destinations", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food");
  await expect(
    page.getByRole("region", { name: "Seven-day progress" }),
  ).toHaveCount(0);
  await expect(page.locator(".dossier-world-clock")).toHaveCount(0);
  await expect(
    page.getByTestId("tracker-primary-nav").getByRole("link"),
  ).toHaveCount(5);
});

test("scheduled block removal and undo retain its linked task", async ({
  page,
}) => {
  const date = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:todos": [
      {
        id: "task",
        text: "Linked task",
        done: false,
        date,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
    ],
    "vk:plan:blocks": {
      block: {
        id: "block",
        date,
        startLocal: "09:00",
        durationMinutes: 30,
        timeZone: "Asia/Kolkata",
        kind: "task",
        title: "Linked task",
        sourceId: "task",
        updatedAt: 1,
      },
    },
  });
  await page.goto("/plan");
  await page
    .getByTestId("day-agenda")
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await expect(page.getByTestId("day-agenda")).not.toContainText("Linked task");
  await page.getByRole("button", { name: "Undo removed block" }).click();
  await expect(page.getByTestId("day-agenda")).toContainText("Linked task");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:todos")!).length,
    ),
  ).toBe(1);
});
test("food capture previews portion calories and leaves routine history unchanged", async ({
  page,
}) => {
  const date = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:nutrition:foods": {
      rice: {
        id: "rice",
        name: "Rice",
        basisAmount: 100,
        basisUnit: "g",
        nutrients: { energy: 130, protein: 3 },
        source: "Manual",
        updatedAt: 1,
      },
    },
  });
  await page.goto(`/log?type=food&date=${date}`);
  await page.getByLabel("Recent and saved food").selectOption("rice");
  await page.getByLabel("Food quantity").fill("200");
  await expect(page.getByTestId("capture-workspace")).toContainText("260 kcal");
  await page.getByRole("button", { name: "Save food", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Food saved");
  expect(
    await page.evaluate(
      () =>
        Object.values(JSON.parse(localStorage.getItem("vk:nutrition:entries")!))
          .length,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:routine:history") ?? "{}"),
    ),
  ).toEqual({});
});
test("Progress opens one metric at a time and historical reflection is editable", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/dashboard");
  await expect(page.locator(".progress-summary-button")).toHaveCount(6);
  await expect(page.locator(".progress-panel")).toHaveCount(0);
  await page.getByRole("button", { name: /Weight.*Explore dated/ }).click();
  await expect(page.locator(".progress-panel")).toHaveCount(1);
  await page.getByRole("button", { name: "Reflection", exact: true }).click();
  await page
    .getByLabel("What went well?", { exact: true })
    .fill("Completed a useful step");
  await page.getByRole("button", { name: "Save reflection" }).click();
  await expect(page.getByRole("status")).toContainText("Reflection saved");
});

test("correcting weight and sleep keeps existing notes and other recovery fields", async ({
  page,
}) => {
  const date = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:weight-loss": {
      entries: {
        [date]: { weightKg: 80, note: "Morning reading", updatedAt: 1 },
      },
      recoveryByDay: {},
    },
    "vk:recovery:entries": {
      [date]: {
        id: date,
        date,
        sleepHours: 7,
        energy: 4,
        mood: "Good",
        note: "Rest day",
        updatedAt: 1,
      },
    },
  });
  await page.goto(`/log?type=weight&date=${date}`);
  await page.getByLabel("Weight (kg)").fill("79");
  await page.getByRole("button", { name: "Save weigh-in" }).click();
  expect(
    await page.evaluate(
      (date) =>
        JSON.parse(localStorage.getItem("vk:weight-loss")!).entries[date].note,
      date,
    ),
  ).toBe("Morning reading");
  await page.goto(`/log?type=sleep&date=${date}`);
  await page.getByLabel("Sleep duration (hours)").fill("8");
  await page.getByRole("button", { name: "Save sleep" }).click();
  const record = await page.evaluate(
    (date) => JSON.parse(localStorage.getItem("vk:recovery:entries")!)[date],
    date,
  );
  expect(record.energy).toBe(4);
  expect(record.note).toBe("Rest day");
});

test("water needs one action, supports undo and leaves other dated records alone", async ({
  page,
}) => {
  await seed(page, { "vk:fasting:water": { "2026-10-01": 4 } });
  await page.goto("/hub?date=2026-10-02");
  await page.getByRole("button", { name: "Water +1", exact: true }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:fasting:water")!),
    ),
  ).toEqual({ "2026-10-01": 4, "2026-10-02": 1 });
  await page.getByRole("button", { name: "Undo water" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:fasting:water")!)["2026-10-02"],
    ),
  ).toBe(0);
});
test("planning backup round-trips blocks and rejects mismatched IDs before any writes", async ({
  page,
}) => {
  const block = {
    id: "meeting",
    date: "2026-10-04",
    startLocal: "10:00",
    durationMinutes: 30,
    timeZone: "Asia/Kolkata",
    kind: "event",
    title: "Team planning",
    updatedAt: 1,
  };
  await seed(page, { "vk:plan:blocks": { meeting: block } });
  await page.goto("/settings#data");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export full backup/ }).click();
  const download = await pending;
  const fs = await import("node:fs/promises");
  const backup = JSON.parse(
    await fs.readFile((await download.path())!, "utf8"),
  );
  expect(backup.data["plan:blocks"]).toEqual({ meeting: block });
  const apply = async (value: unknown) => {
    const pending = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Import backup/ }).click();
    await (
      await pending
    ).setFiles({
      name: "plan.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(value)),
    });
  };
  await apply({
    ...backup,
    data: { ...backup.data, "plan:blocks": { wrong: block } },
  });
  await expect(page.getByText("Import failed", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:plan:blocks")!),
    ),
  ).toEqual({ meeting: block });
  await page.evaluate(() => localStorage.removeItem("vk:plan:blocks"));
  await apply(backup);
  await expect(page.getByText(/Restored \d+ keys/)).toBeVisible();
  await page.goto("/plan?date=2026-10-04");
  await expect(page.getByTestId("day-agenda")).toContainText("Team planning");
});
test("task scheduling opens its exact ID and an overlap requires review before saving", async ({
  page,
}) => {
  const date = new Date().toISOString().slice(0, 10);
  const task = {
    id: "task",
    text: "Selected task",
    done: false,
    date,
    priority: "P1",
    tag: "Work",
    createdAt: 1,
  };
  const block = {
    id: "event",
    date,
    startLocal: "09:00",
    durationMinutes: 60,
    timeZone: await page.evaluate(
      () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
    kind: "event",
    title: "Meeting",
    updatedAt: 1,
  };
  await seed(page, { "vk:todos": [task], "vk:plan:blocks": { event: block } });
  await page.goto("/todo");
  await page.getByRole("link", { name: "Schedule", exact: true }).click();
  await expect(page.getByLabel("Link task")).toHaveValue("task");
  await page
    .getByRole("button", { name: "Save time block", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Overlaps Meeting");
  expect(
    await page.evaluate(
      () =>
        Object.keys(JSON.parse(localStorage.getItem("vk:plan:blocks")!)).length,
    ),
  ).toBe(1);
  await page
    .getByRole("button", { name: /Save time block with overlap/ })
    .click();
  await expect(page.getByTestId("day-agenda")).toContainText("Selected task");
});

test("a linked work session resumes its task and finishing never marks that task done", async ({
  page,
}) => {
  const date = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:todos": [
      {
        id: "task",
        text: "Exact task",
        date,
        done: false,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
    ],
  });
  await page.goto(`/plan?view=focus&task=task&date=${date}`);
  await page
    .getByRole("button", { name: "Start focus sprint", exact: true })
    .click();
  await page.goto("/food");
  const bar = page.getByTestId("focus-lock-status");
  await expect(bar).toHaveCount(1);
  await bar.getByRole("link", { name: "Resume" }).click();
  await expect(page).toHaveURL(/task=task/);
  await bar
    .getByRole("button", { name: "Finish session", exact: true })
    .click();
  await expect(bar).toBeHidden();
  const data = await page.evaluate(() => ({
    task: JSON.parse(localStorage.getItem("vk:todos")!)[0],
    session: JSON.parse(localStorage.getItem("vk:focus:sessions")!)[0],
  }));
  expect(data.task.done).toBe(false);
  expect(data.session.taskId).toBe("task");
  await page.getByRole("button", { name: "Mark task complete" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:todos")!)[0].done,
    ),
  ).toBe(true);
});

test("routine editing previews a draft and preserves occurrence history", async ({
  page,
}) => {
  const lunch = {
    id: "lunch",
    label: "Lunch",
    time: "14:00",
    days: [0, 1, 2, 3, 4, 5, 6],
    timezone: "Asia/Kolkata",
    enabled: true,
    type: "meal",
    meal: "Lunch",
    updatedAt: 1,
  };
  await seed(page, {
    "vk:routine:schedules": { lunch },
    "vk:routine:history": {},
  });
  await page.goto("/routine");
  await page.getByText("Edit reminder schedules", { exact: true }).click();
  await page.locator("#time-lunch").fill("15:00");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("vk:routine:schedules")!).lunch.time,
    ),
  ).toBe("14:00");
  await page
    .getByRole("button", { name: "Preview changes to Lunch", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Review reminder change" });
  await expect(dialog).toContainText("15:00");
  await dialog.getByRole("button", { name: "Confirm reminder change" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("vk:routine:schedules")!).lunch.time,
    ),
  ).toBe("15:00");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:routine:history")!),
    ),
  ).toEqual({});
});

test("water undo never corrects a different selected day", async ({ page }) => {
  await seed(page, { "vk:fasting:water": { "2026-10-01": 4 } });
  await page.goto("/hub?date=2026-10-02");
  await page.getByRole("button", { name: "Water +1", exact: true }).click();
  await page.locator("#workspace-date").fill("2026-10-01");
  await expect(page).toHaveURL(/date=2026-10-01/);
  await expect(page.getByRole("button", { name: "Undo water" })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:fasting:water")!)["2026-10-01"],
    ),
  ).toBe(4);
});

test("mobile capture preserves the selected day and returns to its planning view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/plan?date=2026-10-03&view=week");
  await page.getByTestId("mobile-command-dock").getByRole("link", { name: "Add a record" }).click();
  await page.getByRole("button", { name: "Task", exact: true }).click();
  await page.getByLabel("Task name", { exact: true }).fill("Historical capture");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem("vk:todos")!));
  expect(records[0].date).toBe("2026-10-03");
  await page.getByRole("link", { name: "Return to previous page", exact: true }).click();
  await expect(page).toHaveURL(/\/plan\?date=2026-10-03&view=week$/);
});
