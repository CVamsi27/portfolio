import { expect, test } from "@playwright/test";
import { seed, daysAgoKey } from "./helpers";

test.describe("todo manager", () => {
  test("adds tasks with priority + tag, Enter chains entry", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");

    const input = page.getByPlaceholder(/Add a task/);
    await input.fill("Write E2E tests");
    // Pick P1 and Work tag before adding. "Work" collides with "Deep Work"
    // and the tag-filter group — pin both dimensions.
    await page.getByRole("group", { name: "Priority", exact: true }).getByRole("button", { name: "P1", exact: true }).click();
    await page.getByRole("group", { name: "Tag", exact: true }).getByRole("button", { name: "Work", exact: true }).click();
    await input.press("Enter");
    await expect(page.getByText("Write E2E tests")).toBeVisible();

    // Chained entry: input keeps focus + value cleared.
    await input.fill("Second chained task");
    await input.press("Enter");
    await expect(page.getByText("Second chained task")).toBeVisible();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();

    // Persisted with the right fields.
    const todos = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:todos"))) ?? "[]");
    const first = todos.find((t: { text: string }) => t.text === "Write E2E tests");
    expect(first.priority).toBe("P1");
    expect(first.tag).toBe("Work");
    expect(first.date).toBe(daysAgoKey(0));
  });

  test("inline edit renames a task", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    await page.getByPlaceholder(/Add a task/).fill("Original name");
    await page.keyboard.press("Enter");

    const task = page.getByText("Original name");
    await task.click(); // click-to-edit
    const editBox = page.locator("input[value='']");
    const box = page.locator("li input.h-8");
    await box.fill("Renamed task");
    await box.press("Enter");
    await expect(page.getByText("Renamed task")).toBeVisible();
    await expect(task).toHaveCount(0);
    void editBox;
  });

  test("toggle done moves task between views", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    await page.getByPlaceholder(/Add a task/).fill("Finishable task");
    await page.keyboard.press("Enter");

    // Complete it.
    await page.getByRole("button", { name: /Mark "Finishable task" done/ }).click();
    await expect(page.getByText("All done for today. Beautiful.")).toBeVisible();

    // It's in Completed view.
    await page.getByRole("group", { name: "Task view" }).getByRole("button", { name: /Completed/ }).click();
    await expect(page.getByText("Finishable task")).toBeVisible();

    // Clear completed wipes it.
    await page.getByRole("button", { name: /Clear completed/ }).click();
    await expect(page.getByText("Finishable task")).toHaveCount(0);
    const todos = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:todos"))) ?? "[]");
    expect(todos).toHaveLength(0);
  });

  test("tag filter narrows the visible list", async ({ page }) => {
    const today = daysAgoKey(0);
    await seed(page, {
      "vk:todos": [
        { id: "a", text: "Work item", done: false, date: today, priority: "P2", tag: "Work", createdAt: 1 },
        { id: "b", text: "Health item", done: false, date: today, priority: "P3", tag: "Health", createdAt: 2 },
      ],
    });
    await page.goto("/todo");
    await expect(page.getByText("Work item")).toBeVisible();
    await expect(page.getByText("Health item")).toBeVisible();

    await page.getByRole("group", { name: "Tag filter" }).getByRole("button", { name: "Work", exact: true }).click();
    await expect(page.getByText("Work item")).toBeVisible();
    await expect(page.getByText("Health item")).toHaveCount(0);
  });

  test("tomorrow view shows tasks scheduled ahead", async ({ page }) => {
    const tomorrow = daysAgoKey(-1);
    await seed(page, {
      "vk:todos": [
        { id: "c", text: "Plan tomorrow", done: false, date: tomorrow, priority: "P1", tag: "Goal", createdAt: 1 },
      ],
    });
    await page.goto("/todo");
    await page.getByRole("group", { name: "Task view" }).getByRole("button", { name: "Tomorrow" }).click();
    await expect(page.getByText("Plan tomorrow")).toBeVisible();
    // Not in Today view.
    await page.getByRole("group", { name: "Task view" }).getByRole("button", { name: /^Today/ }).click();
    await expect(page.getByText("Plan tomorrow")).toHaveCount(0);
  });

  test("completion streak counts consecutive done days", async ({ page }) => {
    const now = Date.now();
    const mk = (i: number) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    };
    const todos = [0, 1, 2].flatMap((i) => [
      { id: `x${i}`, text: `t${i}`, done: true, date: mk(i), priority: "P2", tag: "Work", createdAt: 1, completedAt: now - i * 86_400_000 },
    ]);
    await seed(page, { "vk:todos": todos });
    await page.goto("/todo");
    await expect(page.getByText("🔥 3-day completion streak")).toBeVisible();
  });
});
