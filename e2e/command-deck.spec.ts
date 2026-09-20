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
  await expect(page.getByTestId("command-deck-title")).toContainText("Relocate to Canada");
  await expect(page.getByTestId("next-action")).toContainText(/Choose a neighborhood|next move/i);
  await expect(page.getByTestId("momentum-signal")).toBeVisible();
  await expect(page.getByTestId("command-center-brief")).toBeVisible();
  await expect(page.getByTestId("action-queue")).toContainText("Choose a neighborhood");
  await expect(page.getByTestId("week-pulse")).toContainText("25m");
  await expect(page.getByRole("button", { name: /start focus sprint/i })).toBeVisible();
});
