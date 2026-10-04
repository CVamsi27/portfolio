import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("command deck leads with the goal and next move", async ({ page }) => {
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
  await expect(page.getByTestId("next-move-card")).toContainText(
    /Choose a neighborhood|next move/i,
  );
  await expect(page.getByTestId("today-header")).toContainText(
    "Relocate to Canada",
  );
  await expect(
    page.getByRole("heading", { name: "Tasks to do" }),
  ).toBeVisible();
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
