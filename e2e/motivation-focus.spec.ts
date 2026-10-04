import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

const sceneMedia = {
  imageUrl: "https://images.example.test/journey.jpg",
  imageAlt: "A path toward a distant horizon",
  attribution: "Public image source",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  categoryLabel: "Canada relocation",
  quote: "A borrowed quote must not be attributed to original encouragement.",
  quoteAuthor: "Someone else",
  fetchedAt: Date.now(),
};

test.describe("goal motivation", () => {
  test("milestone action opens the plan without changing goal or focus data", async ({
    page,
  }) => {
    const original = {
      metricByDay: { "2026-10-03": 2 },
      milestonesByCategory: {
        relocation: [
          {
            id: "visa",
            title: "Collect visa documents",
            done: false,
            doneAt: null,
          },
        ],
      },
    };
    await seed(page, { "vk:goal": original });
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-next-action")).toContainText(
      "Collect visa documents",
    );
    await page.getByRole("link", { name: "Open my plan", exact: true }).click();
    await expect(page).toHaveURL(/\/roadmap$/);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem("vk:goal")!)),
    ).toEqual(original);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("vk:focus:active") ?? "null"),
      ),
    ).toBeNull();
  });

  test("goal-safe imagery retains attribution without misattributing original reminders", async ({
    page,
  }) => {
    await page.route("**/api/motivation-media**", (route) =>
      route.fulfill({ json: sceneMedia }),
    );
    await page.route("**/api/motivation-image**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#17343a"/></svg>',
      }),
    );
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-media")).toHaveAttribute(
      "src",
      /journey.jpg/,
    );
    await expect(
      page.getByRole("link", { name: "Public image source" }),
    ).toHaveAttribute("href", sceneMedia.sourceUrl);
    await expect(page.getByTestId("focus-scene-category")).toHaveText(
      "Canada relocation",
    );
    await expect(page.locator("blockquote")).not.toContainText(
      sceneMedia.quote,
    );
    await expect(page.getByTestId("focus-scene")).not.toContainText(
      "Someone else",
    );
  });

  test("imagery stays still without automatic rotation", async ({ page }) => {
    await page.route("**/api/motivation-media**", (route) =>
      route.fulfill({
        json: {
          ...sceneMedia,
          imageOptions: [
            { imageUrl: "https://images.example.test/second.jpg" },
          ],
        },
      }),
    );
    await page.route("**/api/motivation-image**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
      }),
    );
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-media")).toHaveAttribute(
      "src",
      /journey.jpg/,
    );
    await page.clock.install();
    await page.clock.fastForward(30_000);
    await expect(page.getByTestId("focus-media")).toHaveAttribute(
      "src",
      /journey.jpg/,
    );
    await expect(page.getByTestId("focus-media-pending")).toHaveCount(0);
  });

  test("failed imagery leaves goal, reminder and action readable", async ({
    page,
  }) => {
    await page.route("**/api/motivation-media**", (route) =>
      route.fulfill({ json: sceneMedia }),
    );
    await page.route("**/api/motivation-image**", (route) => route.abort());
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-media")).toHaveCount(0);
    await expect(page.getByTestId("focus-goal")).toHaveText(
      "Relocate to Canada",
    );
    await expect(page.locator("blockquote")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open my plan", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Public image source" }),
    ).toHaveCount(0);
  });

  test("service failure keeps the goal-aware fallback without blocking actions", async ({
    page,
  }) => {
    await page.route("**/api/motivation-media**", (route) =>
      route.fulfill({ status: 503, body: "Unavailable" }),
    );
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-scene-category")).toContainText(
      "Canada relocation",
    );
    await expect(page.getByTestId("goal-why")).toContainText("Canada");
    await expect(
      page.getByRole("link", { name: "Open my plan", exact: true }),
    ).toBeVisible();
  });

  test("another reminder changes encouragement without taking over the screen", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/motivation");
    const before = await page.locator("blockquote").textContent();
    await page.getByRole("button", { name: "Another reminder" }).click();
    await expect(page.locator("blockquote")).not.toHaveText(before!);
    await expect(page.getByRole("button", { name: /Focus Mode/ })).toHaveCount(
      0,
    );
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  });

  test("goal page remains readable at phone and tablet widths", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        goalCategory: "career",
        goalTitle:
          "Build a career where I can solve meaningful engineering problems with a team I trust",
        questionnaireDone: true,
      },
    });
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/motivation");
      await expect(page.getByTestId("focus-goal")).toContainText(
        "meaningful engineering",
      );
      await expect(
        page.getByRole("link", { name: "Open my plan", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const action = await page
        .getByRole("link", { name: "Open my plan", exact: true })
        .boundingBox();
      expect(action!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
