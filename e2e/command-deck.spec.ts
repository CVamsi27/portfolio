import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("command deck leads with the goal and next move", async ({ page }) => {
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
        date: new Date().toISOString().slice(0, 10),
        priority: "P1",
        tag: "Goal",
        createdAt: 1,
      },
    ],
  });
  await page.goto("/trackers");
  await expect(page.getByTestId("command-deck-title")).toContainText("Relocate to Canada");
  await expect(page.getByTestId("next-action")).toContainText(/Choose a neighborhood|next move/i);
  await expect(page.getByTestId("momentum-signal")).toBeVisible();
});
