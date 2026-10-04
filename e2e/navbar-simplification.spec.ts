import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

for (const width of [320, 768, 1440]) {
  test(`personal header keeps secondary actions in More at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page);
    await page.goto("/hub");
    const rail = page.getByTestId("command-rail");
    await expect(rail.getByRole("button")).toHaveCount(2);
    await rail.getByRole("button", { name: "More options", exact: true }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Tools", exact: true })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Account & settings", exact: true })).toHaveAttribute("href", "/settings");
    await menu.getByRole("menuitem", { name: "Search or run command" }).click();
    const palette = page.getByRole("dialog", { name: "Command Palette", exact: true });
    await expect(palette).toBeVisible();
    await palette.getByLabel("Search commands").fill("tasks");
    await palette.getByRole("option", { name: /^Tasks/ }).click();
    await expect(page).toHaveURL(/\/todo$/);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("More supports theme changes and keyboard dismissal without losing navigation", async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/hub");
  const more = page.getByRole("button", { name: "More options", exact: true });
  await more.click();
  await page.getByRole("menuitem", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await more.focus();
  await more.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(more).toBeFocused();
});
