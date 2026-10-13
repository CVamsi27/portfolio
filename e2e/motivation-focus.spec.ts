import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

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
    await page.getByRole("link", { name: "Open Roadmap", exact: true }).click();
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

  test("Germany imagery leads the page and retains its credit below the photo", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/motivation");
    const image = page.getByTestId("focus-media");
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute(
      "src",
      /\/images\/motivation\/germany-neuschwanstein\.webp$/,
    );
    await expect(image).toHaveAttribute("alt", /Germany/);
    await expect(
      page.getByRole("link", { name: "Polina Koroleva / Unsplash" }),
    ).toHaveAttribute("href", "https://unsplash.com/photos/HIEnq8fXPhY");
    const imageBounds = await image.boundingBox();
    const goalBounds = await page.getByTestId("focus-goal").boundingBox();
    expect(goalBounds!.y).toBeGreaterThan(imageBounds!.y + imageBounds!.height);
    await expect(
      page.getByText("Supporting image", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByTestId("focus-goal")).toHaveText(
      "Relocate to Canada",
    );
  });

  test("views change only on request and do not change the reminder or saved goal", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-goal")).toHaveText(
      "Relocate to Canada",
    );
    const reminder = await page.locator("blockquote").textContent();
    const originalPrefs = await page.evaluate(() =>
      localStorage.getItem("vk:prefs"),
    );
    await page.clock.install();
    await page.clock.fastForward(30_000);
    await expect(page.getByTestId("focus-media")).toHaveAttribute(
      "src",
      /neuschwanstein/,
    );
    await page.getByRole("button", { name: "Eibsee", exact: true }).click();
    await expect(page.getByTestId("focus-media")).toHaveAttribute(
      "src",
      /eibsee/,
    );
    await expect(
      page.getByRole("button", { name: "Eibsee", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("focus-scene-category")).toContainText(
      "Bavarian Alps, Germany",
    );
    await page.getByRole("button", { name: "Berlin", exact: true }).click();
    await expect(page.getByTestId("focus-media")).toHaveAttribute(
      "src",
      /berlin/,
    );
    await expect(
      page.getByRole("link", { name: "Ricardo Gomez Angel / Unsplash" }),
    ).toHaveAttribute("href", "https://unsplash.com/photos/fv0yV5-Pbjc");
    await expect(page.locator("blockquote")).toHaveText(reminder!);
    expect(await page.evaluate(() => localStorage.getItem("vk:prefs"))).toBe(
      originalPrefs,
    );
  });

  test("a failed photo keeps text readable and another view can recover", async ({
    page,
  }) => {
    await page.route(
      "**/images/motivation/germany-neuschwanstein.webp",
      (route) => route.abort(),
    );
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByRole("status")).toContainText("Choose another view");
    await expect(page.getByTestId("focus-goal")).toHaveText(
      "Relocate to Canada",
    );
    await expect(page.locator("blockquote")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open Roadmap", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Polina Koroleva / Unsplash" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Eibsee", exact: true }).click();
    await expect(page.getByTestId("focus-media")).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByTestId("focus-media")
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
  });

  test("bundled Germany views remain available when the media service is unavailable", async ({
    page,
  }) => {
    await page.route("**/api/motivation-media**", (route) => route.abort());
    await seed(page);
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-scene-category")).toContainText(
      "Bavaria, Germany",
    );
    await expect(page.getByTestId("goal-why")).toContainText("Canada");
    await expect
      .poll(() =>
        page
          .getByTestId("focus-media")
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(
      page.getByRole("link", { name: "Open Roadmap", exact: true }),
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
        page.getByRole("link", { name: "Open Roadmap", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const visual = page.locator(".germany-gallery__image");
      const bounds = await visual.boundingBox();
      const parent = await visual.locator("..").boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(180);
      expect(bounds!.width).toBeLessThanOrEqual(parent!.width);
      if (width <= 390) {
        const choices = await page
          .getByRole("group", { name: "Choose a Germany view" })
          .getByRole("button")
          .all();
        const rows = [];
        for (const choice of choices) {
          const button = await choice.boundingBox();
          expect(button!.height).toBeGreaterThanOrEqual(44);
          rows.push(button!.y);
        }
        expect(new Set(rows).size).toBe(1);
      }

      const action = await page
        .getByRole("link", { name: "Open Roadmap", exact: true })
        .boundingBox();
      expect(action!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
