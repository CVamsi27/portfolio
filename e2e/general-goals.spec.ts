import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("general momentum goal", () => {
  test("renders neutral motivation without destination or job assumptions", async ({ page }) => {
    await seed(page, {
      "vk:prefs": {
        goalCategory: "general",
        goalTitle: "",
        questionnaireDone: true,
      },
    });
    await page.goto("/motivation");

    await expect(page.getByTestId("focus-scene")).toContainText("General momentum");
    await expect(page.getByTestId("focus-scene")).not.toContainText(/Germany|Berlin|job search/i);
  });

  test("offers General momentum in onboarding", async ({ page }) => {
    await seed(page, { "vk:prefs": { questionnaireDone: false } });
    await page.goto("/trackers");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("General momentum")).toBeVisible();
  });
});
