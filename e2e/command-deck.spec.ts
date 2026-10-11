import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("Today leads with a task action and preserves goal records", async ({ page }) => {
  const today = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:prefs": {
      name: "Test User",
      goalCategory: "relocation",
      goalTitle: "",
      goalCountry: "Canada",
      questionnaireDone: true,
    },
    "vk:todos": [
      {
        id: "t1",
        text: "Choose a neighborhood",
        done: false,
        date: today,
        priority: "P1",
        tag: "Goal",
        createdAt: 1,
      },
    ],
    "vk:focus:sessions": [
      {
        id: "focus_1",
        label: "Choose a neighborhood",
        plannedMinutes: 25,
        startedAt: Date.now() - 25 * 60_000,
        endedAt: Date.now(),
        durationMinutes: 25,
        status: "completed",
        createdAt: Date.now(),
      },
    ],
  });
  await page.goto("/trackers");
  await expect(page.locator(".task-queue-panel")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start focused work", exact: true })).toHaveAttribute("href", "/plan?view=focus&task=t1");
  await page.goto("/motivation");
  await expect(page.getByTestId("focus-scene")).toContainText("Relocate to Canada");
  await page.goto("/plan");
  await expect(
    page.getByRole("heading", { name: "Unscheduled tasks", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".unscheduled-list")).toContainText("Choose a neighborhood");
  await page.goto("/dashboard?view=work&metric=learning");
  await expect(page.getByText("25 min", { exact: true })).toBeVisible();
  await page.goto("/plan?view=focus");
  await expect(
    page.getByRole("button", { name: /start focus sprint/i }),
  ).toBeVisible();
});

test("command queue keeps a completed task anchor visible", async ({
  page,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  await seed(page, {
    "vk:prefs": {
      name: "Test User",
      goalCategory: "relocation",
      goalTitle: "",
      goalCountry: "Canada",
      questionnaireDone: true,
    },
    "vk:todos": [
      {
        id: "t2",
        text: "Completed task",
        done: true,
        date: today,
        priority: "P2",
        tag: "Personal",
        completedAt: Date.now(),
        createdAt: 1,
      },
    ],
  });
  await page.goto("/trackers");
  await expect(page.getByText("Completed task", { exact: true })).toHaveCount(
    0,
  );
  await page.goto("/todo");
  await page
    .getByRole("group", { name: "Task view" })
    .getByRole("button", { name: "Completed", exact: true })
    .click();
  await expect(page.getByText("Completed task", { exact: true })).toBeVisible();
});
