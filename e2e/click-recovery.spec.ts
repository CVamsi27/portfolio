import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("tracker backdrop dismisses the modal and restores navigation clicks", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/motivation");
  const opener = page.getByRole("button", { name: "Personal reminders", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Personal reminders" });
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.locator("[inert]").count()).toBe(0);
  await page
    .getByTestId("tracker-primary-nav")
    .getByRole("link", { name: "Progress", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("focus lock offers immediate cancellation from every tracker route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 750 });
  await seed(page, {
    "vk:focus:active": {
      id: "recover-focus",
      label: "Prior session",
      mode: "open",
      startedAt: Date.now(),
      pausedMs: 0,
    },
  });
  await page.goto("/settings");
  const lock = page.getByTestId("focus-lock-status");
  await expect(lock).toBeVisible();
  await lock.getByRole("button", { name: "Cancel focus session" }).click();
  await expect(lock).toBeHidden();
  await page
    .getByTestId("mobile-command-dock")
    .getByRole("link", { name: "Progress", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:focus:active")!),
    ),
  ).toBeNull();
});

test("expired focus cannot trap navigation on a page without a sprint widget", async ({
  page,
}) => {
  await seed(page, {
    "vk:focus:active": {
      id: "expired-focus",
      label: "Finished session",
      mode: "timed",
      plannedMinutes: 25,
      startedAt: Date.now() - 30 * 60_000,
      pausedMs: 0,
    },
  });
  await page.goto("/settings");
  await expect(page.getByTestId("focus-lock-status")).toBeHidden();
  await page
    .getByTestId("tracker-primary-nav")
    .getByRole("link", { name: "Progress", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const sessions = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:focus:sessions")!),
  );
  expect(
    sessions.filter(
      (session: { id: string }) => session.id === "expired-focus",
    ),
  ).toHaveLength(1);
  expect(
    sessions.find((session: { id: string }) => session.id === "expired-focus"),
  ).toMatchObject({ status: "completed", durationMinutes: 25 });
});

test("a running timer expires on Settings and saves history only once", async ({
  page,
}) => {
  const now = new Date("2026-10-03T09:00:00Z");
  await page.clock.install({ time: now });
  await seed(page, {
    "vk:focus:active": {
      id: "boundary-focus",
      label: "Finishing session",
      mode: "timed",
      plannedMinutes: 25,
      startedAt: now.getTime() - 24 * 60_000,
      pausedMs: 0,
    },
    "vk:focus:sessions": [
      {
        id: "previous",
        label: "Earlier work",
        startedAt: now.getTime() - 60 * 60_000,
        durationMinutes: 10,
        status: "completed",
        createdAt: now.getTime() - 30 * 60_000,
      },
    ],
  });
  await page.goto("/settings");
  await expect(page.getByTestId("focus-lock-status")).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(page.getByTestId("focus-lock-status")).toBeHidden();
  await page.goto("/hub");
  await page.clock.runFor(1000);
  const sessions = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:focus:sessions")!),
  );
  expect(
    sessions.filter(
      (session: { id: string }) => session.id === "boundary-focus",
    ),
  ).toHaveLength(1);
  expect(
    sessions.some((session: { id: string }) => session.id === "previous"),
  ).toBe(true);
});

test("a paused sprint stays paused until explicitly cancelled", async ({
  page,
}) => {
  const now = Date.now();
  await seed(page, {
    "vk:focus:active": {
      id: "paused-focus",
      label: "Paused work",
      mode: "timed",
      plannedMinutes: 25,
      startedAt: now - 60 * 60_000,
      pausedAt: now - 50 * 60_000,
      pausedMs: 0,
    },
  });
  await page.goto("/settings");
  const lock = page.getByTestId("focus-lock-status");
  await expect(lock).toBeVisible();
  await lock.getByRole("button", { name: "Cancel focus session" }).click();
  await expect(lock).toBeHidden();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:focus:sessions")!),
    ),
  ).toEqual([]);
});
