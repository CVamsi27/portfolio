import { expect, test } from "@playwright/test";

test.describe("public personal portfolio", () => {
  test("public portfolio is personal and work-first", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Vamsi Krishna.*Portfolio/i);
    await expect(
      page.getByRole("link", { name: /Vamsi Krishna portfolio/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Selected work/i })).toBeVisible();
    await expect(page.locator("[data-project-index]")).toHaveCount(6);
    await expect(page.locator("body")).not.toContainText("Buildora");
    await expect(page.locator("body")).not.toContainText("NOVA//OS");
  });

  test("public metadata uses the personal thumbnail and icon", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('link[rel="icon"][type="image/svg+xml"]'),
    ).toHaveAttribute("href", "/icons/vk.svg");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /portfolio-og\.png$/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });

  test("public manifest is distinct from the tracker manifest", async ({ page }) => {
    const publicManifest = await page.request.get(
      "http://127.0.0.1:4111/manifest.webmanifest",
      { headers: { Host: "buildora.work" } },
    );
    expect(publicManifest.ok()).toBeTruthy();
    expect((await publicManifest.json()).name).toBe("Vamsi Krishna — Portfolio");

    const trackerManifest = await page.request.get(
      "http://127.0.0.1:4111/manifest.webmanifest",
      { headers: { Host: "personal.buildora.work" } },
    );
    expect(trackerManifest.ok()).toBeTruthy();
    expect((await trackerManifest.json()).name).toBe("NOVA");
  });

  test("public page stays within the viewport on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /I build software/i })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "visible");
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
});
