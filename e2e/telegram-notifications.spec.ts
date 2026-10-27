import { expect, test, type Page } from "@playwright/test";
import { seed } from "./helpers";

const preferences = {
  version: 1,
  enabled: true,
  cadence: "digest-and-learning",
  digestTime: "06:00",
  timezone: "Asia/Kolkata",
  catchUpMinutes: 10,
  enabledAt: "2026-10-27T03:00:00.000Z",
};

async function openDelivery(page: Page) {
  await page.goto("/settings#notifications");
  await page
    .getByText("Routine notification delivery", { exact: true })
    .click();
}

test.beforeEach(async ({ page }) => {
  // Status is a server boundary; no provider or production storage is contacted.
  await page.route("**/api/telegram/status", (route) =>
    route.fulfill({ status: 503, json: { error: "Status unavailable." } }),
  );
});

test("delivery status fails closed when server authentication is unavailable", async ({
  request,
}) => {
  const response = await request.get("/api/telegram/status");
  expect([401, 503]).toContain(response.status());
  expect(await response.json()).toEqual({ error: expect.any(String) });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("settings presents Telegram routine delivery without browser push setup", async ({
  page,
}) => {
  await seed(page);
  await openDelivery(page);
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

test("career delivery defaults off and viewing settings never subscribes", async ({
  page,
}) => {
  await seed(page);
  await openDelivery(page);
  await expect(
    page.getByRole("checkbox", {
      name: "Career Telegram reminders",
      exact: true,
    }),
  ).not.toBeChecked();
  await expect(
    page.getByText("Device-only settings", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("vk:career:telegram-preferences"),
    ),
  ).toBeNull();
  await expect(
    page.getByText("Server delivery status is unavailable.", { exact: true }),
  ).toBeVisible();
});

test("opting in starts now and preserves routine and in-app preferences", async ({
  page,
}) => {
  const routines = {
    breakfast: {
      id: "breakfast",
      label: "Breakfast",
      enabled: true,
      time: "08:00",
      days: [1, 2, 3, 4, 5, 6],
      timezone: "Asia/Kolkata",
      type: "meal",
      updatedAt: 1,
    },
  };
  const inApp = {
    weighIn: { enabled: false, time: "08:00" },
    focus: { enabled: false, time: "09:00" },
    evening: { enabled: false, time: "20:30" },
    career: {
      morning: { enabled: false, time: "07:30" },
      study: { enabled: true, time: "10:25" },
      roleResearch: { enabled: false, time: "12:25" },
      interview: { enabled: false, time: "17:25" },
      eveningReview: { enabled: false, time: "20:30" },
      windDown: { enabled: false, time: "21:30" },
    },
    browserPermission: "denied",
  };
  await seed(page, { "vk:routine:schedules": routines, "vk:reminders": inApp });
  await openDelivery(page);
  const before = Date.now();
  await page
    .getByRole("checkbox", { name: "Career Telegram reminders", exact: true })
    .check();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:career:telegram-preferences")!),
  );
  expect(stored.enabled).toBe(true);
  expect(stored.cadence).toBe("digest-and-learning");
  expect(Date.parse(stored.enabledAt)).toBeGreaterThanOrEqual(before);
  expect(Date.parse(stored.enabledAt)).toBeLessThanOrEqual(Date.now());
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:routine:schedules")!),
    ),
  ).toEqual(routines);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:reminders")!),
    ),
  ).toEqual(inApp);
  await page.reload();
  await page
    .getByText("Routine notification delivery", { exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "Career Telegram reminders",
      exact: true,
    }),
  ).toBeChecked();
});

test("cadence changes preserve opt-in time and disabling clears consent", async ({
  page,
}) => {
  await seed(page, { "vk:career:telegram-preferences": preferences });
  await openDelivery(page);
  await page
    .getByLabel("Career reminder cadence", { exact: true })
    .selectOption("digest-only");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:career:telegram-preferences")!),
    ),
  ).toEqual({ ...preferences, cadence: "digest-only" });
  await page
    .getByRole("checkbox", { name: "Career Telegram reminders", exact: true })
    .uncheck();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:career:telegram-preferences")!),
  );
  expect(stored.enabled).toBe(false);
  expect(stored.enabledAt).toBeNull();
});

test("invalid stored consent stays off until an explicit opt-in", async ({
  page,
}) => {
  await seed(page, {
    "vk:career:telegram-preferences": { ...preferences, enabledAt: null },
  });
  await openDelivery(page);
  await expect(
    page.getByRole("checkbox", {
      name: "Career Telegram reminders",
      exact: true,
    }),
  ).not.toBeChecked();
  await expect(
    page.getByText(/Saved career settings could not be read/),
  ).toBeVisible();
});

test("expanding an enabled cadence starts new block consent now", async ({
  page,
}) => {
  await seed(page, {
    "vk:career:telegram-preferences": {
      ...preferences,
      cadence: "digest-only",
    },
  });
  await openDelivery(page);
  const before = Date.now();
  await page
    .getByLabel("Career reminder cadence", { exact: true })
    .selectOption("digest-and-learning");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:career:telegram-preferences")!),
  );
  expect(stored.enabled).toBe(true);
  expect(stored.cadence).toBe("digest-and-learning");
  expect(Date.parse(stored.enabledAt)).toBeGreaterThanOrEqual(before);
  expect(Date.parse(stored.enabledAt)).toBeLessThanOrEqual(Date.now());
});

test("provider acknowledgement and unknown attempts are distinct from phone receipt", async ({
  page,
}) => {
  await page.route("**/api/telegram/status", (route) =>
    route.fulfill({
      json: {
        configured: { telegram: true, storage: true, dispatcher: true },
        ownerAllowed: true,
        delivery: {
          available: true,
          scope: "career",
          counts: {
            pending: 0,
            claimed: 0,
            sending: 0,
            sent: 2,
            failed: 0,
            unknown: 1,
          },
          latestAttemptAt: "2026-10-27T00:30:00.000Z",
          latestSentAt: "2026-10-27T00:30:00.000Z",
          latestUnknownAt: "2026-10-26T00:30:00.000Z",
        },
      },
    }),
  );
  await seed(page, { "vk:career:telegram-preferences": preferences });
  await openDelivery(page);
  await expect(
    page.getByText("Provider accepted: 2 · Unknown: 1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Provider acceptance does not confirm receipt on your phone/,
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/Unknown attempts require review before any replay/),
  ).toBeVisible();
});
