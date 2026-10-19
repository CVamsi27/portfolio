import { expect, test } from "@playwright/test";

test.describe("public personal portfolio", () => {
  test("public portfolio is personal and work-first", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Vamsi Krishna.*Portfolio/i);
    await expect(
      page.getByRole("link", { name: /Vamsi Krishna portfolio/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Selected work/i })).toBeVisible();
    await expect(page.locator("[data-project-index]")).toHaveCount(7);
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

  test("tightened overview keeps every chapter within the height budget", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const height = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    // Budget revised 2026-10-19 (owner direction): measured 10,817px on macOS
    // and 11,152px on the ubuntu-latest CI runner after all content-preserving
    // tightening, so the pin carries a margin for platform font metrics. The
    // original "~8,000px" target implied -6,046px, but the plan's own listed
    // moves measure -2,771px; deeper cuts would hide visible narrative (see
    // docs/ui-ux-review.md).
    expect(height).toBeLessThanOrEqual(11_800);

    // Seven indexed work cards; each detail list sits behind a disclosure.
    await expect(page.locator("[data-project-index]")).toHaveCount(7);
    await expect(
      page.locator("[data-project-index] details[data-project-details]"),
    ).toHaveCount(7);

    // Architecture shows six curated patterns with the library link.
    await expect(page.locator("[data-pattern-card]")).toHaveCount(6);
    await expect(
      page.getByRole("link", { name: /Explore All 23 Patterns/i }),
    ).toBeVisible();

    // Experience: the current role is expanded, earlier roles are single-line.
    await expect(page.locator("[data-experience-current]")).toHaveCount(1);
    await expect(page.locator("details[data-experience-history]")).toHaveCount(2);

    // Open source and ecosystem tracks share one section grid.
    await expect(page.locator("#OpenSource [data-repo-card]")).toHaveCount(4);
    await expect(page.locator("#OpenSource [data-ecosystem-track]")).toHaveCount(2);

    // Every chapter of the narrative still exists.
    for (const id of [
      "Top",
      "Work",
      "Architecture",
      "OpenSource",
      "Experience",
      "Capabilities",
      "Impact",
      "Contact",
    ]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test("work card details stay behind per-card disclosure", async ({ page }) => {
    await page.goto("/");
    const details = page
      .locator('[data-project-index="01"]')
      .locator("details[data-project-details]");
    await expect(details).not.toHaveAttribute("open", "");
    // Retry the toggle so a post-hydration re-render cannot swallow the click.
    await expect(async () => {
      const isOpen = await details.evaluate(
        (el) => (el as HTMLDetailsElement).open,
      );
      if (!isOpen) await details.locator("summary").click();
      expect(await details.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(
        true,
      );
    }).toPass();
    await expect(details).toContainText(/PostgreSQL/i);
  });
});
