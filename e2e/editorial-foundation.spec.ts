import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("editorial foundation exposes semantic surfaces and an action hierarchy", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(page.locator('section.editorial-frame[data-surface="archive"]')).toBeVisible();
  await expect(page.locator("[data-editorial-kicker]").first()).toBeVisible();
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await expect(page.locator("[data-editorial-telemetry]").first()).toBeVisible();
});

test("portfolio uses the personal paper editorial surface", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-surface="paper"]')).toBeVisible();
  await expect(page).toHaveTitle(/Vamsi Krishna.*Portfolio/i);
  await expect(page.getByRole("heading", { name: /Selected work/i })).toBeVisible();
  await expect(page.locator("[data-project-index]").first()).toBeVisible();
  await expect(page.locator('[data-card-variant="dossier"]')).toHaveCount(0);
});

test("personal tracker cards opt into the dossier treatment", async ({ page }) => {
  await seed(page);
  await page.goto("/motivation");
  await expect.poll(() => page.locator('[data-card-variant="dossier"]').count()).toBeGreaterThan(0);
});

test("tracker shell reads as one editorial chapter", async ({ page }) => {
  await seed(page);
  await page.goto("/todo");
  await expect(page.getByTestId("chapter-header")).toHaveAttribute("data-editorial-chapter", "true");
  await expect(page.locator("[data-editorial-index]").first()).toBeVisible();
  await expect(page.locator("footer")).toContainText("Your next chapter, in motion.");
});

test("desktop and mobile shells keep the primary action visible", async ({ page }) => {
  await seed(page);
  await page.goto("/trackers");
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
});

  test("product routes use distinct editorial chapters", async ({ page }) => {
  await seed(page);
  for (const route of ["/trackers", "/share", "/shared-with-me", "/settings", "/login", "/motivation"]) {
    await page.goto(route);
    await expect(page.locator("[data-editorial-chapter], [data-testid='today-header']").first()).toBeVisible();
    await expect(page.locator("[data-editorial-kicker], .dossier-kicker").first()).toBeVisible();
  }
  });

  test("authenticated utility routes keep primary navigation available", async ({ page }) => {
    await seed(page);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/settings", "/archive", "/share", "/shared-with-me", "/motivation", "/log", "/more"]) {
      await page.goto(route);
      await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
    }
    await page.goto("/login");
    await expect(page.getByTestId("mobile-command-dock")).toHaveCount(0);
  });

test("share limits remain visible near the dispatch action", async ({ page }) => {
  await seed(page);
  await page.goto("/share");
  await expect(page.getByText("Storage limits")).toBeVisible();
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await expect(page.locator("body")).toContainText("50");
});

test("editorial shell remains readable at mobile width", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/trackers");
  await expect(page.locator("[data-editorial-action]").first()).toBeVisible();
  await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "visible");
});
