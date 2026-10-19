import { expect, test } from "@playwright/test";

/** Mirrors the seven projects in `const.ts`, in case-study order. */
const SLUGS = [
  "docita",
  "senior-full-stack-bible",
  "teamops",
  "super-tic-tac-toe",
  "digital-library",
  "task-manager",
  "portfolio",
];

test.describe("portfolio case studies", () => {
  test("every project renders a case study with resolvable anchors and metadata", async ({
    page,
  }) => {
    for (const slug of SLUGS) {
      const response = await page.goto(`/work/${slug}`);
      expect(response?.status(), `${slug} should render`).toBe(200);

      // Hero
      await expect(
        page.getByRole("heading", { level: 1 }),
        `${slug} needs a single h1`,
      ).toHaveCount(1);
      await expect(page.getByTestId("case-study-hero")).toBeVisible();
      await expect(page.getByTestId("case-study-stack")).toBeVisible();

      // Every in-page anchor resolves to an element on this page.
      const dangling = await page.evaluate(() => {
        const anchors = Array.from(
          document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
        );
        return anchors
          .map((a) => a.getAttribute("href")!.slice(1))
          .filter(
            (id) =>
              id.length > 0 && document.getElementById(decodeURIComponent(id)) === null,
          );
      });
      expect(dangling, `${slug} has dangling anchors`).toEqual([]);

      // Metadata + OG
      const title = await page.title();
      expect(title.length, `${slug} title`).toBeGreaterThan(10);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /.{40,}/,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        /.{4,}/,
      );

      // Back to the overview and next/prev navigation
      await expect(
        page.getByRole("link", { name: /All selected work/i }),
      ).toBeVisible();
      await expect(page.getByTestId("case-study-pagination")).toBeVisible();
    }
  });

  test("unknown slugs return 404", async ({ page }) => {
    const response = await page.goto("/work/not-a-real-project");
    expect(response?.status()).toBe(404);
  });

  test("work cards and the command palette link to case studies", async ({
    page,
  }) => {
    await page.goto("/");
    for (const slug of SLUGS) {
      await expect(
        page.locator(`a[data-case-study-link="${slug}"]`),
        `work card link for ${slug}`,
      ).toHaveCount(1);
    }

    await page.locator(`a[data-case-study-link="docita"]`).click();
    await expect(page).toHaveURL(/\/work\/docita$/);

    // The palette's project commands open the case study.
    await page.goto("/");
    await page.keyboard.press("Meta+k");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("combobox").fill("TeamOps");
    await page.getByRole("option", { name: /TeamOps/i }).first().click();
    await expect(page).toHaveURL(/\/work\/teamops$/);
  });

  test("case study canonical uses the served www origin", async ({ page }) => {
    await page.goto("/work/docita");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://www.buildora.work/work/docita",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://www.buildora.work/work/docita",
    );
  });

  test("portfolio host serves case studies, sitemap, and still redirects other paths", async ({
    request,
  }) => {
    const caseStudy = await request.get(
      "http://127.0.0.1:4111/work/docita",
      { headers: { Host: "buildora.work" }, maxRedirects: 0 },
    );
    expect(caseStudy.status()).toBe(200);

    const sitemap = await request.get("http://127.0.0.1:4111/sitemap.xml", {
      headers: { Host: "buildora.work" },
    });
    expect(sitemap.status()).toBe(200);
    const body = await sitemap.text();
    expect(body).toContain("/work/docita");
    expect(body).toContain("/work/portfolio");
    expect(body).toContain("https://www.buildora.work/");
    expect(body).not.toMatch(/<loc>https:\/\/buildora\.work\//);

    const redirect = await request.get("http://127.0.0.1:4111/settings", {
      headers: { Host: "buildora.work" },
      maxRedirects: 0,
    });
    expect([307, 308, 302]).toContain(redirect.status());
    const location = new URL(redirect.headers()["location"], redirect.url());
    expect(location.pathname).toBe("/");

    const wikiPath = await request.get("http://127.0.0.1:4111/work", {
      headers: { Host: "buildora.work" },
      maxRedirects: 0,
    });
    // `/work` itself is not a page; it redirects like every non-root path.
    expect([307, 308, 302, 404]).toContain(wikiPath.status());
  });

  test("case study fits the phone viewport without horizontal scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/work/docita");
    await expect(page.getByTestId("case-study-hero")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
});
