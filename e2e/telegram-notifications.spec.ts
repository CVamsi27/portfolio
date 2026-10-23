import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("settings presents Telegram routine delivery without browser push setup", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/settings#notifications");
  await page.getByText("Routine notification delivery", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Telegram delivery", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/No browser permission or device subscription is needed/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enable notifications", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Enable browser reminders", exact: true }),
  ).toHaveCount(0);
});
