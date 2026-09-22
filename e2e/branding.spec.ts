import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("product branding", () => {
  test("tracker shell exposes the NOVA product identity", async ({ page }) => {
    await seed(page);
    await page.goto("/trackers");
    await expect(page.getByTestId("nova-mark").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /NOVA/i }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Your next chapter, in motion.");
    await expect(page).toHaveTitle(/NOVA/i);
    await expect(page.locator("body")).not.toContainText("NOVA//OS");
  });

  test("portfolio shell keeps the personal identity", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Vamsi Krishna portfolio/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /I build software/i })).toBeVisible();
    await expect(page).toHaveTitle(/Vamsi Krishna.*Portfolio/i);
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute("href", "/icons/vk.svg");
  });

  test("personal-host landing explains the product before workspace entry", async ({ page }) => {
    const response = await page.request.get("http://127.0.0.1:4111/", {
      headers: { Host: "personal.buildora.work" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('data-testid="tracker-public-landing"');
    expect(html).toContain("Goals, routines, focus");
    expect(html).toContain('href="/hub"');
    expect(html).not.toContain("Sign in required");
  });

  test("tracker navigation and footer use NOVA", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    await expect(page.getByRole("link", { name: /NOVA/i }).first()).toBeVisible();
    await expect(page.locator("footer")).toContainText("NOVA");
    await expect(page.locator("footer")).toContainText("Your next chapter, in motion.");
    await expect(page.getByText("NOVA // Chapter 01")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("NOVA//OS");
  });

  test("tracker product copy is consistent", async ({ page }) => {
    await seed(page);
    await page.goto("/trackers");
    await page.evaluate(() => {
      const prefs = JSON.parse(window.localStorage.getItem("vk:prefs") ?? "{}");
      window.localStorage.setItem("vk:prefs", JSON.stringify({ ...prefs, questionnaireDone: false }));
    });
    await page.reload();
    await expect(page.locator("body")).not.toContainText(["Personal", "Suite"].join(" "));
    await expect(page.locator("body")).not.toContainText(["VK", "Personal", "Suite"].join(" "));
    await expect(page.getByText("Welcome to NOVA")).toBeVisible();
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-scene")).toBeVisible();
  });

  test("PWA metadata exposes the NOVA identity", async ({ page }) => {
    const manifestResponse = await page.request.get("/manifest.webmanifest", {
      headers: { Host: "personal.buildora.work" },
    });
    expect(manifestResponse.ok()).toBeTruthy();
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe("NOVA");
    expect(manifest.short_name).toBe("NOVA");
    expect(manifest.start_url).toBe("/hub");

    await page.goto("/trackers");
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute("href", "/icons/nova.svg");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#071014");
  });

  test("service worker belongs to the current product shell", async ({ page }) => {
    const sw = await page.request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
    const source = await sw.text();
    expect(source).toContain("NOVA service worker");
    expect(source).not.toContain("NOVA//OS");
    expect(source).toContain('CACHE_VERSION = "nova-os-v3"');
    expect(source).not.toContain(["VK", "Personal", "Suite"].join(" "));
  });
});
