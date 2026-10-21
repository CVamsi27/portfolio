import { expect, test } from "@playwright/test";
import { seed, daysAgoKey } from "./helpers";

test.describe("todo manager", () => {
  test("adds tasks with priority + tag, Enter chains entry", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/todo");

    await page.getByRole("button", { name: "Add task", exact: true }).click();
    const input = page.getByRole("textbox", { name: "New task", exact: true });
    await input.fill("Write E2E tests");
    await page.getByText(/^Task options/).click();
    // Pick P1 and Work tag before adding. "Work" collides with "Deep Work"
    // and the tag-filter group — pin both dimensions.
    await page
      .getByRole("group", { name: "Priority", exact: true })
      .getByRole("button", { name: "P1", exact: true })
      .click();
    await page
      .getByRole("group", { name: "Tag", exact: true })
      .getByRole("button", { name: "Work", exact: true })
      .click();
    await input.press("Enter");
    await expect(page.getByText("Write E2E tests", {exact:true})).toBeVisible();

    // Chained entry: input keeps focus + value cleared.
    await input.fill("Second chained task");
    await input.press("Enter");
    await expect(page.getByText("Second chained task", {exact:true})).toBeVisible();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();

    // Persisted with the right fields.
    const todos = JSON.parse(
      (await page.evaluate(() => window.localStorage.getItem("vk:todos"))) ??
        "[]",
    );
    const first = todos.find(
      (t: { text: string }) => t.text === "Write E2E tests",
    );
    expect(first.priority).toBe("P1");
    expect(first.tag).toBe("Work");
    expect(first.date).toBe(daysAgoKey(0));
  });

  test("inline edit renames a task", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await page
      .getByRole("textbox", { name: "New task", exact: true })
      .fill("Original name");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Close", exact: true }).click();
    const task = page.getByText("Original name");
    await task.click(); // click-to-edit
    const editBox = page.locator("input[value='']");
    const box = page.getByRole("textbox", {
      name: "Edit task name",
      exact: true,
    });
    await box.fill("Renamed task");
    await box.press("Enter");
    await expect(page.getByText("Renamed task")).toBeVisible();
    await expect(task).toHaveCount(0);
    void editBox;
  });

  test("toggle done moves task between views", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await page
      .getByRole("textbox", { name: "New task", exact: true })
      .fill("Finishable task");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Close", exact: true }).click();
    // Complete it.
    await page
      .getByRole("button", { name: /Mark "Finishable task" done/ })
      .click();
    await expect(
      page.getByText("All done for today. Beautiful."),
    ).toBeVisible();

    // It's in Completed view.
    await page
      .getByRole("group", { name: "Task view" })
      .getByRole("button", { name: /Completed/ })
      .click();
    await expect(page.getByText("Finishable task")).toBeVisible();

    // Clear completed wipes it.
    await page.getByRole("button", { name: /Clear completed/ }).click();
    await expect(page.getByText("Finishable task")).toHaveCount(0);
    const todos = JSON.parse(
      (await page.evaluate(() => window.localStorage.getItem("vk:todos"))) ??
        "[]",
    );
    expect(todos).toHaveLength(0);
  });

  test("tag filter narrows the visible list", async ({ page }) => {
    const today = daysAgoKey(0);
    await seed(page, {
      "vk:todos": [
        {
          id: "a",
          text: "Work item",
          done: false,
          date: today,
          priority: "P2",
          tag: "Work",
          createdAt: 1,
        },
        {
          id: "b",
          text: "Health item",
          done: false,
          date: today,
          priority: "P3",
          tag: "Health",
          createdAt: 2,
        },
      ],
    });
    await page.goto("/todo");
    await expect(page.getByText("Work item")).toBeVisible();
    await expect(page.getByText("Health item")).toBeVisible();

    await page.getByText("Filters", { exact: true }).click();
    await page.getByLabel("Filter by tag").selectOption("Work");
    await expect(page.getByText("Work item")).toBeVisible();
    await expect(page.getByText("Health item")).toHaveCount(0);
  });

  test("date filter narrows open tasks and Open retains future tasks", async ({ page }) => {
    const tomorrow = daysAgoKey(-1);
    await seed(page, {
      "vk:todos": [
        {
          id: "c",
          text: "Plan tomorrow",
          done: false,
          date: tomorrow,
          priority: "P1",
          tag: "Goal",
          createdAt: 1,
        },
      ],
    });
    await page.goto("/todo");
    await page.getByText("Filters", { exact: true }).click();
    await page.getByLabel("Task dates").selectOption("tomorrow");
    await expect(page.getByText("Plan tomorrow")).toBeVisible();
    // Open retains pending work across all dates.
    await page
      .getByRole("group", { name: "Task view" })
      .getByRole("button", { name: "Open", exact: true })
      .click();
    await expect(page.getByText("Plan tomorrow")).toBeVisible();
  });

  test("today view keeps future work out and tucks overdue tasks into a disclosure", async ({
    page,
  }) => {
    const today = daysAgoKey(0);
    const yesterday = daysAgoKey(1);
    const tomorrow = daysAgoKey(-1);
    const task = (
      id: string,
      text: string,
      date: string,
      priority: "P1" | "P2" | "P3" = "P2",
    ) => ({
      id,
      text,
      done: false,
      date,
      priority,
      tag: "Personal",
      createdAt: 1,
    });
    await seed(page, {
      "vk:todos": [
        task("today", "Today task", today),
        task("overdue", "Overdue task", yesterday, "P1"),
        task("future", "Tomorrow task", tomorrow),
      ],
    });

    await page.goto("/todo");
    await expect(
      page.getByRole("button", { name: "Today", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Today task", { exact: true })).toBeVisible();
    await expect(page.getByText("Tomorrow task", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByText("Overdue task", { exact: true }),
    ).toBeHidden();
    await expect(page.getByText("Overdue (1)", { exact: true })).toBeVisible();

    await page.getByText("Overdue (1)", { exact: true }).click();
    await expect(
      page.getByText("Overdue task", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("group", { name: "Task view" })
      .getByRole("button", { name: "Open", exact: true })
      .click();
    await expect(
      page.getByText("Tomorrow task", { exact: true }),
    ).toBeVisible();
  });

  test("offers a confirmed cleanup for stale 100-day plan tasks", async ({
    page,
  }) => {
    const today = daysAgoKey(0);
    const task = (id: string, text: string) => ({
      id,
      text,
      done: false,
      date: today,
      priority: "P1" as const,
      tag: "Goal",
      createdAt: 1,
    });
    await seed(page, {
      "vk:todos": [
        task("t_100day_1", "Old plan task"),
        task("career-plan:2026-10-21", "Current plan task"),
        task("personal-1", "Personal task"),
      ],
    });

    await page.goto("/todo");
    await expect(page.getByTestId("legacy-plan-cleanup")).toContainText(
      "1 unfinished task",
    );
    await page.getByRole("button", { name: "Clean up old tasks" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Remove old 100-day plan tasks",
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Remove 1 old task", exact: true })
      .click();

    await expect(page.getByText("Old plan task", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByText("Current plan task", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Personal task", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Undo task deletion" }).click();
    await expect(page.getByText("Old plan task", { exact: true })).toBeVisible();
  });

  test("completed history preserves prior days without an execution streak", async ({ page }) => {
    const now = Date.now();
    const mk = (i: number) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    };
    const todos = [0, 1, 2].flatMap((i) => [
      {
        id: `x${i}`,
        text: `t${i}`,
        done: true,
        date: mk(i),
        priority: "P2",
        tag: "Work",
        createdAt: 1,
        completedAt: now - i * 86_400_000,
      },
    ]);
    await seed(page, { "vk:todos": todos });
    await page.goto("/todo");
    await expect(page.getByText("3-day completion streak")).toHaveCount(0);await page.getByRole("button",{name:"Completed",exact:true}).click();await expect(page.getByRole("button",{name:/Mark.*not done/})).toHaveCount(3);
  });
});
