import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
const yogurt = {
  id: "yogurt",
  name: "Plain yogurt",
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy: 60, calcium: null },
  source: "Private label",
  updatedAt: 1,
  portions: [
    { name: "Cup from label", amount: 1, unit: "serving", gramWeight: 150 },
  ],
};
test("saved food aliases and declared portions remain usable when database search fails", async ({
  page,
}) => {
  await seed(page, { "vk:nutrition:foods": { yogurt } });
  await page.route("**/api/nutrition/search**", (r) =>
    r.fulfill({ status: 503, json: { error: "Food database unavailable" } }),
  );
  await page.goto("/food?date=2026-10-07");
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await modal
    .getByRole("button", { name: "Search database", exact: true })
    .click();
  await modal.getByLabel("Food catalog search").fill("curds");
  await modal
    .getByRole("button", { name: "Search food database", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toContainText(
    "Food database unavailable",
  );
  await modal.getByRole("button", { name: /Plain yogurt/ }).click();
  await modal.getByLabel("Declared portion").selectOption("0");
  await modal
    .getByRole("button", { name: "Use this food", exact: true })
    .click();
  await expect(
    modal.getByLabel("Quantity for Plain yogurt", { exact: true }),
  ).toHaveValue("150");
  await modal.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    page.getByText("150 g · 90 kcal", { exact: true }),
  ).toBeVisible();
});
test("downloaded snapshots can be searched offline after reload without a live provider", async ({
  page,
}) => {
  await seed(page);
  await page.route("**/api/nutrition/search**", (r) =>
    r.fulfill({ json: { foods: [{ id: 123, name: "Plain yogurt" }] } }),
  );
  await page.route("**/api/nutrition/food/123", (r) =>
    r.fulfill({ json: { food: yogurt } }),
  );
  await page.goto("/food");
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  let modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await modal
    .getByRole("button", { name: "Search database", exact: true })
    .click();
  await modal.getByLabel("Food catalog search").fill("yogurt");
  await modal
    .getByRole("button", { name: "Search food database", exact: true })
    .click();
  await modal
    .getByRole("button", { name: "Plain yogurt", exact: true })
    .click();
  await expect(modal.getByText(/Available offline/).first()).toBeVisible();
  await page.reload();
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await modal
    .getByRole("button", { name: "Search database", exact: true })
    .click();
  await modal.getByLabel("Food catalog search").fill("dahi");
  await modal.getByRole("button", { name: /Plain yogurt/ }).click();
  await modal
    .getByRole("button", { name: "Use this food", exact: true })
    .click();
  await expect(
    modal.getByLabel("Quantity for Plain yogurt", { exact: true }),
  ).toHaveValue("100");
  await page.context().setOffline(false);
});
