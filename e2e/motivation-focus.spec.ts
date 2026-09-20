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
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
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
    await expect(page.getByTestId("focus-next-action").getByText("Next action", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh transmission" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Public image source" })).toHaveAttribute("href", "https://commons.wikimedia.org/wiki/File:Example.jpg");
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
    await expect(page.getByTestId("focus-next-action")).toContainText(/Recognized university degree/);
  });

  test("focus studio stays usable at a narrow mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/motivation");

    await expect(page.getByRole("button", { name: "Start next action" })).toBeVisible();
    await expect(page.getByTestId("focus-scene")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("refresh transmission fetches a new public scene", async ({ page }) => {
    let requestCount = 0;
    await page.route("**/api/motivation-media**", async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          imageUrl: `https://images.example.test/journey-${requestCount}.jpg`,
          imageAlt: "A path toward a distant horizon",
          attribution: "Public image source",
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
          quote: "Progress becomes visible when you keep moving.",
          quoteAuthor: "NOVA//OS",
          fetchedAt: Date.now(),
        }),
      });
    });
    await seed(page);
    await page.goto("/motivation");

    await expect.poll(() => requestCount).toBeGreaterThan(0);
    const initialRequestCount = requestCount;
    await page.getByRole("button", { name: "Refresh transmission" }).click();
    await expect.poll(() => requestCount).toBeGreaterThan(initialRequestCount);
    await expect(page.getByRole("button", { name: "Refresh transmission" })).toBeEnabled();
  });

  test("failed remote imagery falls back to a local visual", async ({ page }) => {
    await page.route("**/api/motivation-media**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          imageUrl: "https://images.example.test/unavailable.jpg",
          imageAlt: "Unavailable remote image",
          attribution: "Public image source",
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
          quote: "Progress becomes visible when you keep moving.",
          quoteAuthor: "NOVA//OS",
          fetchedAt: Date.now(),
        }),
      });
    });
    await page.route("https://images.example.test/**", (route) => route.abort());
    await seed(page);
    await page.goto("/motivation");

    await expect(page.getByRole("img", { name: "Canada local motivation fallback" })).toBeVisible();
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
