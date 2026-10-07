import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

test("health pairing reviews permissions and displays server errors without claiming a connection", async ({
  page,
}) => {
  await seed(page);
  await page.route("**/api/health-connect/devices", (route) =>
    route.fulfill({ json: { devices: [] } }),
  );
  await page.route("**/api/health-connect/records**", (route) =>
    route.fulfill({ json: { records: [], hasMore: false } }),
  );
  await page.route("**/api/health-connect/claim", (route) =>
    route.fulfill({
      status: 409,
      json: { error: "Pairing code expired. Create a new code on your phone." },
    }),
  );
  await page.goto("/health?view=connections");
  await expect(
    page.getByRole("heading", { name: "Android Health Connect" }),
  ).toBeVisible();
  await page
    .getByLabel("Pairing code", { exact: true })
    .fill("ABCDEF1234567890");
  await expect(
    page.getByRole("button", { name: "Connect device", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Allow this device to import weight, steps and sleep read-only")
    .check();
  await page
    .getByRole("button", { name: "Connect device", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Pairing code expired" }),
  ).toContainText("Pairing code expired");
  await expect(
    page.getByText("No device connected.", { exact: true }),
  ).toBeVisible();
});

test("imported records preserve sources and disconnect requires an explicit device choice", async ({
  page,
}) => {
  await seed(page);
  const devices = [
    {
      id: "device-1",
      label: "My Android phone",
      lastSyncAt: "2026-10-07T06:00:00Z",
    },
  ];
  await page.route("**/api/health-connect/devices", (route) =>
    route.fulfill({ json: { devices } }),
  );
  await page.route("**/api/health-connect/records**", (route) =>
    route.fulfill({
      json: {
        records: [
          {
            id: "w1",
            type: "weight",
            date: "2026-10-07",
            value: 72,
            unit: "kg",
            source: "com.example.scale",
            measuredAt: "2026-10-07T06:00:00Z",
            updatedAt: 1,
          },
        ],
        hasMore: false,
      },
    }),
  );
  await page.route("**/api/health-connect/revoke", async (route) => {
    devices.length = 0;
    await route.fulfill({ json: { revoked: true } });
  });
  await page.goto("/health?view=connections&date=2026-10-07");
  await expect(
    page.getByText("My Android phone", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("72 kg", { exact: true })).toBeVisible();
  await expect(
    page.getByText("com.example.scale", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Disconnect My Android phone", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm disconnect", exact: true })
    .click();
  await expect(
    page.getByText("No device connected.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("72 kg", { exact: true })).toBeVisible();
});
