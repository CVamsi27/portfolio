import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("product branding", () => {
  test("tracker shell exposes the NOVA//OS product identity", async ({ page }) => {
    await seed(page);
    await page.goto("/trackers");
    await expect(page.getByTestId("nova-mark").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /NOVA\/\/OS/i }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Your next chapter, in motion.");
    await expect(page).toHaveTitle(/NOVA\/\/OS/i);
  });

  test("portfolio shell keeps the personal identity", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Open the NOVA//OS trackers" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Buildora home" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Vamsi Krishna/i })).toBeVisible();
    await expect(page).toHaveTitle(/Buildora.*Vamsi Krishna/i);
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

  test("tracker navigation and footer use NOVA//OS", async ({ page }) => {
    await seed(page);
    await page.goto("/todo");
    await expect(page.getByRole("link", { name: /NOVA\/\/OS/i }).first()).toBeVisible();
    await expect(page.locator("footer")).toContainText("NOVA//OS");
    await expect(page.locator("footer")).toContainText("Your next chapter, in motion.");
    await expect(page.getByText("NOVA//OS // Chapter 01")).toBeVisible();
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
    await expect(page.getByText("Welcome to NOVA//OS")).toBeVisible();
    await page.goto("/motivation");
    await expect(page.getByTestId("focus-scene")).toBeVisible();
  });

  test("PWA metadata exposes the NOVA//OS identity", async ({ page }) => {
    const manifestResponse = await page.request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBeTruthy();
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe("NOVA//OS");
    expect(manifest.short_name).toBe("NOVA");
    expect(manifest.start_url).toBe("/hub");

    await page.goto("/trackers");
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute("href", "/icon.svg");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#071014");
  });

  test("service worker belongs to the current product shell", async ({ page }) => {
    const sw = await page.request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
    const source = await sw.text();
    expect(source).toContain("NOVA//OS");
    expect(source).toContain('CACHE_VERSION = "nova-os-v3"');
    expect(source).not.toContain(["VK", "Personal", "Suite"].join(" "));
  });
});
