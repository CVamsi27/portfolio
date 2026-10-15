import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("general momentum goal", () => {
  test("keeps general goal text neutral alongside Germany scenery", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        goalCategory: "general",
        goalTitle: "",
        questionnaireDone: true,
      },
    });
    await page.goto("/motivation");

    await expect(page.getByTestId("focus-scene")).toContainText(
      "General momentum",
    );
    await expect(page.locator(".goal-inspiration__story")).not.toContainText(
      /Germany|Berlin|job search/i,
    );
    await expect(page.getByTestId("focus-media")).toHaveAttribute(
      "alt",
      /Germany/,
    );
  });

  test("keeps the personal entry and hub neutral for a general goal", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        goalCategory: "general",
        goalTitle: "",
        questionnaireDone: true,
      },
    });

    await page.goto("/trackers/landing");
    await expect(page).toHaveURL(/\/hub$/);
    await expect(page.getByRole("main")).not.toContainText(
      /Germany|Berlin|job search/i,
    );

    await page.goto("/hub");
    await expect(
      page
        .getByTestId("today-header")
        .getByRole("heading", { name: "Today", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("main")).not.toContainText(
      /Germany|Berlin|job search/i,
    );
  });

  test("offers General momentum in onboarding", async ({ page }) => {
    await seed(page, { "vk:prefs": { questionnaireDone: false } });
    await page.goto("/trackers?setup=1");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("General momentum")).toBeVisible();
    await expect(
      page.getByPlaceholder("e.g. Build a steady weekly rhythm"),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("e.g. Get promoted to senior"),
    ).toHaveCount(0);
  });

  test("keeps the explicit Germany objective visible alongside Germany scenery", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        goalCategory: "relocation",
        goalTitle: "",
        goalCountry: "Germany",
        questionnaireDone: true,
      },
    });
    await page.goto("/motivation");

    await expect(page.getByTestId("focus-scene")).toContainText(
      "Relocate to Germany",
    );
  });
});
