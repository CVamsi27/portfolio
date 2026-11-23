import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
test("Plan schedules a task and Today opens the exact task without duplicating it", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-05T03:00:00Z"));
  const date = "2026-10-05";
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
  await page.getByRole("button", { name: "Add activity", exact: true }).click();
  await page.getByLabel("Link task").selectOption("api");
  await page.getByLabel("Start time", { exact: true }).fill("09:00");
  await page
    .getByRole("button", { name: "Save activity", exact: true })
    .click();
  await page.reload();
  await expect(page.getByTestId("day-agenda")).toContainText("Practice APIs");
  await page.goto("/hub");
  await page
    .getByTestId("day-agenda")
    .locator("summary")
    .filter({ hasText: "Practice APIs" })
    .click();
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
  await page.goto("/health");
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
  await page.getByRole("button", { name: "Undo removed activity" }).click();
  await expect(page.getByTestId("day-agenda")).toContainText("Linked task");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:todos")!).length,
    ),
  ).toBe(1);
});
test("Progress opens one metric at a time and historical reflection is editable", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/dashboard");
  await expect(page.locator(".progress-summary-button")).toHaveCount(0);
  await expect(page.getByTestId("progress-chart")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Metric", exact: true })
    .selectOption("water");
  await expect(page.getByTestId("progress-chart")).toContainText(
    "Synced hydration",
  );
  await page.getByRole("button", { name: "Reflection", exact: true }).click();
  await page
    .getByRole("link", { name: "Write or edit reflection", exact: true })
    .click();
  await page
    .getByLabel("What went well?", { exact: true })
    .fill("Completed a useful step");
  await page.getByRole("button", { name: "Save reflection" }).click();
  await expect(page.getByRole("status")).toContainText("Reflection saved");
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
  await page.clock.setFixedTime(new Date("2026-10-05T03:00:00Z"));
  const date = "2026-10-05";
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
  await page.locator(".workspace-action-menu").first().click();
  await page.getByRole("menuitem", { name: "Schedule", exact: true }).click();
  await expect(page.getByLabel("Link task")).toHaveValue("task");
  await page
    .getByRole("button", { name: "Save activity", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Overlaps Meeting");
  expect(
    await page.evaluate(
      () =>
        Object.keys(JSON.parse(localStorage.getItem("vk:plan:blocks")!)).length,
    ),
  ).toBe(1);
  await page
    .getByRole("button", { name: /Save activity with overlap/ })
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

test("mobile capture preserves the selected day and returns to its planning view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/plan?date=2026-10-03&view=week");
  await page.getByRole("button", { name: "Tools menu", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Add a record", exact: true })
    .click();
  await page.getByRole("button", { name: "Task", exact: true }).click();
  await page
    .getByLabel("Task name", { exact: true })
    .fill("Historical capture");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:todos")!),
  );
  expect(records[0].date).toBe("2026-10-03");
  await page
    .getByRole("link", { name: "Return to previous page", exact: true })
    .click();
  await expect(page).toHaveURL(/\/plan\?date=2026-10-03&view=week$/);
});

test("reflection history keeps the selected entry date through reload", async ({
  page,
}) => {
  await seed(page, {
    "vk:journal": {
      "2026-10-14": {
        win: "Earlier reflection",
        learned: "",
        focus: "",
        updatedAt: 1,
      },
      "2026-10-15": {
        win: "Later reflection",
        learned: "",
        focus: "",
        updatedAt: 2,
      },
    },
  });
  await page.goto("/log?view=journal&date=2026-10-15");
  await page.getByText("Past entries", { exact: true }).click();
  await page
    .getByRole("button", { name: /2026-10-14 Earlier reflection/ })
    .click();
  await expect(page).toHaveURL(/date=2026-10-14/);
  await page.reload();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(
    "2026-10-14",
  );
  await expect(page.getByRole("textbox", {name:"What went well?", exact:true})).toHaveValue(
    "Earlier reflection",
  );
});
