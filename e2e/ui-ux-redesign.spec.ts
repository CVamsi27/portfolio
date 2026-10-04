import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("secondary destinations keep navigation context and Tasks is discoverable", async ({ page }) => {
  await seed(page);
  await page.goto("/todo");
  await expect(page.getByTestId("tracker-primary-nav").getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "page");
  await page.goto("/plan");
  await expect(page.getByRole("link", { name: /Tasks/ }).last()).toHaveAttribute("href", "/todo");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shared-with-me");
  await expect(page.getByRole("link",{name:"Account and tools"})).toBeVisible();await expect(page.getByTestId("mobile-command-dock").getByRole("link",{name:"More"})).toHaveCount(0);
});

test("workspace has one main landmark and accessible quick capture", async ({ page }) => {
  await seed(page);
  await page.goto("/hub");
  await expect(page.getByRole("main")).toHaveCount(1);
  await page.getByRole("button",{name:"Quick capture"}).click();await page.getByRole("dialog").getByRole("button",{name:"Task",exact:true}).click();
  await page.getByRole("textbox", { name: "Task name", exact: true }).fill("Prepare interview notes");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page.goto("/todo");
  await expect(page.getByText("Prepare interview notes", { exact: true })).toBeVisible();
});

test("modal traps focus from its container and restores the opener after editing", async ({ page }) => {
  await seed(page);
  await page.goto("/motivation");
  const opener = page.getByRole("button", { name: "Personal reminders", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Personal reminders" });
  await expect(dialog).toBeVisible();
  await dialog.focus();
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await dialog.getByRole("textbox").first().fill("Build something useful today");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("form navigation does not promise a save and motivation leads with the saved goal", async ({ page }) => {
  await seed(page);
  await page.goto("/intermittent-fasting");
  await expect(page.getByLabel("First meal time")).toBeVisible();await expect(page.getByTestId("tracker-action-bar")).toHaveCount(0);
  await page.goto("/motivation");
  await expect(page.getByRole("heading", { level: 1, name: "Relocate to Canada", exact: true })).toBeVisible();
});

test("mobile controls are readable and primary navigation works through tablet widths", async ({ page }) => {
  await seed(page);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/todo");
    const dock = page.getByTestId("mobile-command-dock");
    await expect(dock).toBeVisible();
    const link = dock.getByRole("link", { name: "Today", exact: true });
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await link.locator("span").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("contact errors remain visible next to the form and retain the message", async ({ page }) => {
  await page.route("**/api/contact", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Unavailable" }) }));
  await page.goto("/");
  await page.getByLabel(/^Your name$/i).fill("Alex Chen");
  await page.getByLabel(/^Your email$/i).fill("alex@example.com");
  await page.getByLabel("Message", { exact: true }).fill("I would like to discuss an engineering role.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator("#Contact").getByRole("alert")).toContainText(/try again|email/i);
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("I would like to discuss an engineering role.");
});

test("resume viewer moves keyboard focus inside and returns it when closed", async ({ page }) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "View resume", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Résumé Viewer" });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Today never requests notification permission on page load", async ({ page }) => {
  await seed(page);
  await page.clock.install({ time: new Date("2026-10-03T08:30:00") });
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "permission", { get: () => "default" });
    Notification.requestPermission = async () => {
      document.documentElement.dataset.permissionPrompt = "requested";
      return "denied";
    };
  });
  await page.goto("/hub");
  await expect(page.getByTestId("today-header")).toBeVisible();
  await page.clock.runFor(500);
  await expect(page.locator("html")).not.toHaveAttribute("data-permission-prompt", "requested");
});

for (const theme of ["light", "dark"]) {
  for (const width of [320, 390, 768, 1440]) {
    test(`route layout and landmarks at ${width}px in ${theme} mode`, async ({ page }) => {
      test.setTimeout(90_000);
      await seed(page);
      await page.addInitScript(value => localStorage.setItem("theme", value), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: 900 });
      const runtimeErrors: string[] = [];
      page.on("pageerror", error => runtimeErrors.push(error.message));
      for (const route of ["/", "/hub", "/dashboard", "/health", "/plan", "/review", "/food", "/todo", "/roadmap", "/motivation", "/log", "/more", "/settings", "/weight-loss", "/intermittent-fasting", "/workout-tracking", "/goal", "/archive", "/share", "/login", "/trackers/landing"]) {
        await page.goto(route);
        await expect(page.getByRole("main"), route).toHaveCount(1);
        await expect(page.getByRole("heading", { level: 1 }).first(), route).toBeVisible();
        await expect(page.locator("a button, button a"), route).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth), { message: route }).toBeLessThanOrEqual(width);
      }
      expect(runtimeErrors).toEqual([]);
    });
  }
}

test("open dialogs remove background navigation from accessibility and focus", async ({ page }) => {
  await page.goto("/");
  const rail = page.getByTestId("command-rail");
  const opener = page.getByRole("button", { name: "View resume", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Résumé Viewer" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  expect(await rail.evaluate(el => Boolean(el.closest("[inert]")))).toBe(true);
  const backgroundControl = rail.locator("a").first();
  await backgroundControl.evaluate((el: HTMLElement) => el.focus());
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  const close = dialog.getByRole("button", { name: "Close résumé modal" });
  expect((await close.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(page.getByRole("navigation")).toHaveCount(1);
  expect(await rail.evaluate(el => Boolean(el.closest("[inert]")))).toBe(false);
  await expect(opener).toBeFocused();
});
