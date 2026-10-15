import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

for (const width of [320, 768, 1440]) {
  test(`personal header keeps secondary actions in Tools at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page);
    await page.goto("/hub");
    const rail = page.getByTestId("command-rail");
    await expect(
      rail.getByRole("button").filter({ visible: true }),
    ).toHaveCount(width >= 1024 ? 2 : 1);
    if (width >= 1024) {
      await expect(
        rail.getByRole("link", { name: "Motivation", exact: true }),
      ).toHaveAttribute("href", "/motivation");
      await expect(
        rail.getByRole("link", { name: "Settings", exact: true }),
      ).toHaveAttribute("href", "/settings");
    }
    if (width >= 1024) {
      await expect(
        rail.getByRole("button", { name: "Tools menu", exact: true }),
      ).toBeHidden();
      await rail.getByRole("button", { name: "Search", exact: true }).click();
    } else {
      await rail
        .getByRole("button", { name: "Tools menu", exact: true })
        .click();
      const menu = page.getByRole("menu");
      if (width < 1024) {
        await expect(
          menu.getByRole("menuitem", { name: "Motivation", exact: true }),
        ).toHaveAttribute("href", "/motivation");
        await expect(
          menu.getByRole("menuitem", { name: "Settings", exact: true }),
        ).toHaveAttribute("href", "/settings");
      }
      await expect(
        menu.getByRole("menuitem", { name: "All tools", exact: true }),
      ).toHaveCount(0);
      await menu
        .getByRole("menuitem", { name: "Search or run command" })
        .click();
    }
    const palette = page.getByRole("dialog", {
      name: "Command Palette",
      exact: true,
    });
    await expect(palette).toBeVisible();
    await palette.getByLabel("Search commands").fill("tasks");
    await palette.getByRole("option", { name: /^Tasks/ }).click();
    await expect(page).toHaveURL(/\/todo$/);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
  });
}

test("More supports theme changes and keyboard dismissal without losing navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/hub");
  const more = page.getByRole("button", { name: "Tools menu", exact: true });
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
