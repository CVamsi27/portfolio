import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("navigation & shell", () => {
  test("portfolio root renders as a personal work index", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Vamsi|Full Stack/i);
    await expect(page.getByRole("heading", { name: /Selected work/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Study" })).toHaveCount(0);
    await expect(page.getByTestId("nova-simple-mark")).toHaveCount(0);
  });

  test("personal-host rewrite lands on the public tracker landing", async ({ page }) => {
    const resp = await page.request.get("http://127.0.0.1:4111/", {
      headers: { Host: "personal.buildora.work" },
      maxRedirects: 0,
    });
    // The proxy rewrites (not redirects) the personal host onto the public landing.
    expect(resp.status()).toBe(200);
    const html = await resp.text();
    expect(html).toContain('data-testid="tracker-public-landing"');
    expect(html).toContain("Enter NOVA");
    expect(html).not.toContain("Sign in required");
  });

  test("portfolio host never serves tracker pages", async ({ page }) => {
    const resp = await page.request.get("http://127.0.0.1:4111/trackers", {
      headers: { Host: "buildora.work" },
      maxRedirects: 0,
    });
    expect([307, 308, 302]).toContain(resp.status());
  });

  test("tracker top bar shows a Today breadcrumb and the dock is hidden on desktop", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    // Breadcrumb back to hub.
    await expect(page.locator('a[href="/hub"]').first()).toBeVisible();
    // Mobile dock is hidden at desktop widths.
    await expect(page.getByTestId("mobile-command-dock")).toBeHidden();
  });

  test("authenticated Personal pages share the mobile command dock", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    for (const route of ["/settings", "/archive", "/share", "/shared-with-me", "/motivation", "/log", "/more"]) {
      await page.goto(route);
      await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
    }
  });

  test("personal navigation does not expose the public Study entry", async ({ page }) => {
    await seed(page);
    await page.goto("/trackers");
    await expect(page.getByRole("link", { name: "Study" })).toHaveCount(0);
  });

  test("personal navbar does not expose account email text", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");

    const rail = page.getByTestId("command-rail");
    await expect(rail.locator('[data-testid="auth-email"]')).toHaveCount(0);
    await expect(rail).not.toContainText(/@/);
  });

  test("personal navbar uses the simplified NOVA mark", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");

    await expect(page.getByTestId("nova-simple-mark")).toBeVisible();
    await expect(page.getByRole("link", { name: "NOVA home" })).toContainText("NOVA");
  });

  test("personal navbar keeps Today, Focus, Log, Sharing, and More visible", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");

    const rail = page.getByTestId("command-rail");
    await expect(rail.getByTestId("tracker-primary-nav")).toBeVisible();
    await expect(rail.getByTestId("tracker-primary-nav").getByRole("link")).toHaveCount(5);
    await expect(rail.getByTestId("tracker-primary-nav").getByRole("link", { name: "Today" })).toBeVisible();
    await expect(rail.getByTestId("tracker-primary-nav").getByRole("link", { name: "Focus" })).toBeVisible();
    await expect(rail.getByTestId("tracker-primary-nav").getByRole("link", { name: "Log" })).toBeVisible();
    await expect(rail.getByTestId("tracker-primary-nav").getByRole("link", { name: "Sharing" })).toHaveAttribute("href", "/share");
    await expect(rail.getByTestId("tracker-primary-nav").getByRole("link", { name: "More" })).toBeVisible();
  });

  test("mobile personal navigation keeps the five destinations in the dock", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/todo");

    await expect(page.getByTestId("tracker-primary-nav")).toBeHidden();
    await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
    await expect(page.getByTestId("mobile-command-dock").getByRole("link")).toHaveCount(5);
    await expect(page.getByTestId("mobile-command-dock").getByRole("link", { name: "Sharing" })).toHaveAttribute("href", "/share");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("More does not duplicate the primary Sharing destination", async ({ page }) => {
    await seed(page);
    await page.goto("/more");

    await expect(page.getByTestId("more-links").locator('a[href="/share"]')).toHaveCount(0);
    await expect(page.getByTestId("more-links").locator('a[href="/shared-with-me"]')).toHaveCount(0);
  });

  test("settings keeps account controls outside the navbar", async ({ page }) => {
    await seed(page);
    await page.goto("/settings");
    const trackerSurface = page.locator('[data-surface="archive"]');
    await expect(trackerSurface.getByText("Account & sync")).toBeVisible();
    await expect(
      trackerSurface
        .getByText("Local mode", { exact: true })
        .or(trackerSurface.getByRole("button", { name: /Sign in|Sign out/ })),
    ).toBeVisible();
  });

  test("every primary chapter exposes the shared visual shell", async ({ page }) => {
    await seed(page);
    for (const route of ["/intermittent-fasting", "/workout-tracking", "/goal", "/todo", "/settings"]) {
      await page.goto(route);
      await expect(page.getByTestId("chapter-header")).toBeVisible();
    }
  });

  test("PWA assets are served and exempt from the portfolio redirect", async ({ page }) => {
    const manifest = await page.request.get("http://127.0.0.1:4111/manifest.webmanifest", {
      headers: { Host: "buildora.work" },
    });
    expect(manifest.status()).toBe(200);
    const json = await manifest.json();
    expect(json.name).toBe("Vamsi Krishna — Portfolio");
    const sw = await page.request.get("http://127.0.0.1:4111/sw.js", { headers: { Host: "buildora.work" } });
    expect(sw.status()).toBe(200);
  });
});
