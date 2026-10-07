import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
test("imported progress paginates, chooses sources and keeps manual metrics separate on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  const base = {
    id: "w",
    type: "weight",
    date: "2026-10-07",
    value: 72,
    unit: "kg",
    source: "scale",
    measuredAt: "2026-10-07T06:00:00Z",
    updatedAt: 1,
  };
  await page.route("**/api/health-connect/records**", (r) => {
    const offset = Number(
      new URL(r.request().url()).searchParams.get("offset"),
    );
    return r.fulfill({
      json: {
        records: offset
          ? [{ ...base, id: "other", source: "other scale", value: 80 }]
          : [base],
        total: 2,
      },
    });
  });
  await page.goto("/dashboard?view=health&metric=body&date=2026-10-07&range=7");
  await page.getByRole("button", { name: "View imported trends" }).click();
  const panel = page.getByRole("region", { name: "Imported health progress" });
  await expect(panel.getByLabel("Weight source")).toHaveValue("other scale");
  await panel.getByLabel("Weight source").selectOption("scale");
  await panel.getByText("View daily readings · kg", { exact: true }).click();
  await expect(
    panel.getByRole("cell", { name: "72", exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByText(
      "No usable imported daily steps readings for this source in this range.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
