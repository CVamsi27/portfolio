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

  test("keeps the personal entry and hub neutral for a general goal", async ({ page }) => {
    await seed(page, {
      "vk:prefs": {
        goalCategory: "general",
        goalTitle: "",
        questionnaireDone: true,
      },
    });

    await page.goto("/trackers/landing");
    await expect(page.getByTestId("tracker-public-landing")).not.toContainText(/Germany|Berlin|job search/i);

    await page.goto("/hub");
    await expect(page.getByTestId("next-move-card")).toContainText(/general momentum/i);
    await expect(page.getByTestId("next-move-card")).not.toContainText(/Germany|Berlin|job search/i);
  });

  test("offers General momentum in onboarding", async ({ page }) => {
    await seed(page, { "vk:prefs": { questionnaireDone: false } });
    await page.goto("/trackers");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("General momentum")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Build a steady weekly rhythm")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Get promoted to senior")).toHaveCount(0);
  });

  test("keeps destination imagery opt-in for an explicit Germany goal", async ({ page }) => {
    await seed(page, {
      "vk:prefs": {
        goalCategory: "relocation",
        goalTitle: "",
        goalCountry: "Germany",
        questionnaireDone: true,
      },
    });
    await page.goto("/motivation");

    await expect(page.getByTestId("focus-scene")).toContainText("Germany relocation");
  });
});
