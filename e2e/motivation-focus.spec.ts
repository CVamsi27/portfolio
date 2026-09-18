import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("motivation focus scene", () => {
  test("renders goal-safe media behind the full-screen focus scene", async ({ page }) => {
    await page.route("**/api/motivation-media**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          imageUrl: "https://images.example.test/journey.jpg",
          imageAlt: "A path toward a distant horizon",
          attribution: "Public image source",
          quote: "Progress becomes visible when you keep moving.",
          quoteAuthor: "NOVA//OS",
          fetchedAt: Date.now(),
        }),
      });
    });
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-media")).toHaveAttribute("src", "https://images.example.test/journey.jpg");
    await expect(page.getByText("Public image source")).toBeVisible();
    await expect(page.getByTestId("focus-goal")).toContainText("Relocate to Canada");
    await expect(page.getByTestId("focus-scene")).toHaveAttribute("data-focus-active", "false");
  });

  test("motivation opens as a goal-centered focus scene", async ({ page }) => {
    await seed(page);
    await page.goto("/motivation");

    await expect(page.getByTestId("focus-scene")).toBeVisible();
    await expect(page.getByTestId("focus-goal")).toContainText("Relocate to Canada");
    await expect(page.getByRole("button", { name: "Enter Focus Mode" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Shuffle" })).toBeVisible();
    await expect(page.getByText(/Recognized university degree/)).toBeVisible();
  });

  test("focus mode remains usable when browser fullscreen is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(document, "exitFullscreen", {
        configurable: true,
        value: undefined,
      });
    });
    await seed(page);
    await page.goto("/motivation");

    const focusButton = page.getByRole("button", { name: "Enter Focus Mode" });
    await focusButton.click();
    await expect(page.getByRole("button", { name: "Exit Focus Mode" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("focus-scene")).toHaveAttribute("data-focus-active", "true");

    await page.getByRole("button", { name: "Exit Focus Mode" }).click();
    await expect(page.getByRole("button", { name: "Enter Focus Mode" })).toHaveAttribute("aria-pressed", "false");
  });

  test("focus scene exposes reduced-motion styling hooks", async ({ page }) => {
    await seed(page);
    await page.goto("/motivation");

    await expect(page.getByTestId("focus-scene")).toHaveClass(/focus-scene/);
    await expect(page.getByTestId("focus-scene")).toHaveAttribute("data-reduced-motion", "supported");
  });
});
