import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("navigation & shell", () => {
  test("portfolio root renders and exposes the NOVA//OS portal", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Vamsi|Full Stack/i);
    // Portal link is host-aware: on localhost it points at the tracker hub.
    // (host is read in an effect, so allow the href to settle after hydration.)
    const portal = page.getByRole("link", { name: "Open the NOVA//OS trackers" });
    await expect(portal).toBeVisible();
    await expect(portal).toHaveAttribute("href", "/trackers", { timeout: 7_000 });
  });

  test("personal-host rewrite lands on the tracker hub", async ({ page }) => {
    await seed(page);
    const resp = await page.request.get("http://127.0.0.1:4111/", {
      headers: { Host: "personal.buildora.work" },
      maxRedirects: 0,
    });
    // The proxy rewrites (not redirects) the personal host onto /trackers.
    expect(resp.status()).toBe(200);
  });

  test("portfolio host never serves tracker pages", async ({ page }) => {
    const resp = await page.request.get("http://127.0.0.1:4111/trackers", {
      headers: { Host: "buildora.work" },
      maxRedirects: 0,
    });
    expect([307, 308, 302]).toContain(resp.status());
  });

  test("tracker top bar shows breadcrumbs and the dock is hidden on desktop", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    // Breadcrumb back to hub.
    await expect(page.locator('a[href="/trackers"]').first()).toBeVisible();
    // Mobile dock is hidden at desktop widths.
    const dock = page.locator("nav, [class*='backdrop-blur']").filter({ hasText: /Hub/ }).last();
    await expect(dock).toBeHidden();
  });

  test("every primary chapter exposes the shared visual shell", async ({ page }) => {
    await seed(page);
    for (const route of ["/intermittent-fasting", "/workout-tracking", "/goal", "/todo", "/settings", "/portfolio"]) {
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
    expect(json.name).toBe("NOVA//OS");
    const sw = await page.request.get("http://127.0.0.1:4111/sw.js", { headers: { Host: "buildora.work" } });
    expect(sw.status()).toBe(200);
  });
});
