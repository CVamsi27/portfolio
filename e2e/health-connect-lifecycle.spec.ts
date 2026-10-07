import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
const record = {
  id: "w1",
  type: "weight",
  date: "2026-10-07",
  value: 72,
  unit: "kg",
  source: "scale",
  measuredAt: "2026-10-07T06:00:00Z",
  updatedAt: 1,
};
test("health lifecycle paginates records, reviews restore, and confirms scoped deletion", async ({
  page,
}) => {
  await seed(page);
  let deleted = false,
    restores = 0;
  await page.route("**/api/health-connect/devices", (r) =>
    r.fulfill({ json: { devices: [] } }),
  );
  await page.route("**/api/health-connect/records**", (r) => {
    const offset = new URL(r.request().url()).searchParams.get("offset");
    return r.fulfill({
      json: {
        records: deleted
          ? []
          : [{ ...record, id: offset ? "w2" : "w1", value: offset ? 73 : 72 }],
        total: deleted ? 0 : 2,
      },
    });
  });
  await page.route("**/api/health-connect/delete", (r) => {
    expect(r.request().postDataJSON()).toEqual({
      confirm: "DELETE IMPORTS",
      from: "2026-10-07",
      to: "2026-10-07",
    });
    deleted = true;
    return r.fulfill({ json: { count: 2 } });
  });
  await page.route("**/api/health-connect/restore", (r) => {
    restores++;
    expect(r.request().postDataJSON().records).toHaveLength(1);
    return r.fulfill({ json: { count: 1 } });
  });
  await page.goto("/health?view=connections&date=2026-10-07");
  await expect(page.getByText("72 kg", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Load more imported records" })
    .click();
  await expect(page.getByText("73 kg", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Delete imports for 2026-10-07" })
    .click();
  expect(deleted).toBe(false);
  await page
    .getByRole("button", { name: "Confirm delete health imports" })
    .click();
  await expect(
    page.getByText("No imported records for this date."),
  ).toBeVisible();
  await page
    .getByLabel("Restore health archive")
    .setInputFiles({
      name: "health.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "nova-health-connect",
          version: 1,
          exportedAt: "2026-10-07T06:00:00Z",
          records: [record],
          owner: "ignored",
          devices: [{ secret: "ignored" }],
        }),
      ),
    });
  await expect(
    page.getByText(/Review restore: 1 source records/),
  ).toBeVisible();
  expect(restores).toBe(0);
  await page
    .getByRole("button", { name: "Confirm restore health imports" })
    .click();
  await expect(page.getByText(/Restored 1 source records/)).toBeVisible();
});
test("owner lifecycle endpoints deny unauthenticated access", async ({
  request,
}) => {
  expect((await request.get("/api/health-connect/export")).status()).toBe(401);
  for (const path of ["restore", "delete"])
    expect(
      (
        await request.post(`/api/health-connect/${path}`, { data: {} })
      ).status(),
    ).toBe(401);
});
