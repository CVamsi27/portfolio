import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
const entry = (date: string) => ({
  id: date,
  date,
  name: "Reviewed meal",
  foodId: "food",
  meal: "Lunch",
  quantity: 100,
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy: 500, protein: 20 },
  source: "Label",
  updatedAt: 1,
});

test("a saved program supplies the selected weekday diary targets and preserves nutrient references", async ({
  page,
}) => {
  await seed(page, {
    "vk:nutrition:entries": {
      "2026-10-07": entry("2026-10-07"),
      "2026-10-08": entry("2026-10-08"),
    },
    "vk:nutrition:targets": {
      calcium: { id: "calcium", kind: "reference", amount: 900, updatedAt: 1 },
      energy: { id: "energy", kind: "reference", amount: 999, updatedAt: 1 },
    },
  });
  await page.goto("/food?date=2026-10-07&view=strategy");
  const strategy = page.getByRole("region", { name: "Nutrition strategy" });
  await strategy
    .getByRole("button", { name: "New program", exact: true })
    .click();
  await strategy.getByLabel("Sunday calories", { exact: true }).fill("2000");
  await strategy.getByLabel("Sunday protein", { exact: true }).fill("120");
  await strategy.getByLabel("Sunday carbs", { exact: true }).fill("250");
  await strategy.getByLabel("Sunday fat", { exact: true }).fill("60");
  await strategy
    .getByRole("button", {
      name: "Copy Sunday targets to all days",
      exact: true,
    })
    .click();
  await strategy.getByLabel("Wednesday calories", { exact: true }).fill("1800");
  await strategy.getByLabel("Thursday calories", { exact: true }).fill("2200");
  await strategy
    .getByRole("button", { name: "Save program", exact: true })
    .click();
  await expect(strategy.getByRole("status")).toContainText("Program saved");
  await page.getByRole("button", { name: "Diary", exact: true }).click();
  const summary = page.getByRole("region", { name: "Daily nutrition" });
  await expect(summary).toContainText("Your reference: 1800 kcal");
  await expect(
    page.getByText("Program targets effective from 2026-10-07", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByLabel("Record date", { exact: true }).fill("2026-10-08");
  await expect(summary).toContainText("Your reference: 2200 kcal");
  await page.reload();
  await expect(summary).toContainText("Your reference: 2200 kcal");
  await page.getByRole("button", { name: "Nutrients", exact: true }).click();
  await page
    .getByText("All nutrients and data coverage", { exact: true })
    .click();
  await expect(summary).toContainText("Your reference: 900 mg");
  await page.getByLabel("Record date", { exact: true }).fill("2026-10-06");
  await expect(summary).not.toContainText("Your reference: 1800 kcal");
});

test("reviewed complete intake becomes partial after editing a historical portion", async ({
  page,
}) => {
  await seed(page, {
    "vk:nutrition:entries": { "2026-10-07": entry("2026-10-07") },
  });
  await page.goto("/food?date=2026-10-07");
  const review = page.getByRole("region", { name: "Nutrition day review" });
  await review
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await expect(review).toContainText("Included in known complete-day intake");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const modal = page.getByRole("dialog", {
    name: "Edit food entry",
    exact: true,
  });
  await modal.getByLabel("Consumed quantity", { exact: true }).fill("150");
  await modal
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(review).toContainText("Partial log");
  await expect(review).toContainText("Food records changed after confirmation");
  await expect(review).not.toContainText(
    "Included in known complete-day intake",
  );
  await review
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await expect(review).toContainText("750 kcal recorded");
});

test("an empty diary requires explicit fasting confirmation and records zero only afterward", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food?date=2026-10-07");
  const review = page.getByRole("region", { name: "Nutrition day review" });
  await expect(review).toContainText("Not logged");
  await expect(
    review.getByRole("button", { name: "Mark complete", exact: true }),
  ).toBeDisabled();
  await review
    .getByRole("button", { name: "Confirm fasting", exact: true })
    .click();
  await expect(review).not.toContainText("0 kcal recorded");
  await review
    .getByRole("button", { name: "Yes, no caloric intake", exact: true })
    .click();
  await expect(review).toContainText("Confirmed fasting");
  await expect(review).toContainText("0 kcal recorded");
  await page.reload();
  await expect(review).toContainText("0 kcal recorded");
});

test("custom recipe ingredients preserve cooked weight and serving yield independently", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food?date=2026-10-07&view=saved");
  await page
    .getByRole("button", { name: "Create recipe", exact: true })
    .click();
  const recipe = page.getByRole("dialog", {
    name: "Create recipe",
    exact: true,
  });
  await recipe
    .getByLabel("Recipe name", { exact: true })
    .fill("Weighed custom batch");
  await recipe
    .getByRole("button", { name: "Create ingredient", exact: true })
    .click();
  await recipe
    .getByLabel("Ingredient name", { exact: true })
    .fill("Label ingredient");
  await recipe.getByLabel("Calories (kcal)", { exact: true }).fill("400");
  await recipe
    .getByRole("button", { name: "Add custom ingredient", exact: true })
    .click();
  await recipe.getByLabel("Final batch yield", { exact: true }).fill("4");
  await recipe.getByLabel("Cooked weight (g)", { exact: true }).fill("800");
  const calorieRow = recipe.getByRole("row").filter({
    has: page.getByText("Calories (kcal)", {
      exact: true,
    }),
  });
  await expect(calorieRow).toContainText("400");
  await expect(calorieRow).toContainText("100");
  await expect(calorieRow).toContainText("50");
  await recipe
    .getByRole("button", { name: "Save recipe", exact: true })
    .click();
  const saved = await page.evaluate(() =>
    Object.values(JSON.parse(localStorage.getItem("vk:nutrition:recipes")!)),
  );
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({
    servings: 4,
    cookedWeightGrams: 800,
    ingredients: [{ name: "Label ingredient", nutrients: { energy: 400 } }],
  });
  await page.getByText("Saved recipes", { exact: true }).click();
  await page.getByRole("button", { name: "Edit recipe", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit recipe", exact: true });
  await expect(
    edit.getByLabel("Final batch yield", { exact: true }),
  ).toHaveValue("4");
  await expect(
    edit.getByLabel("Cooked weight (g)", { exact: true }),
  ).toHaveValue("800");
});

test("planned food never blocks explicit fasting or enables complete intake review", async ({
  page,
}) => {
  await seed(page, {
    "vk:nutrition:entries": {
      planned: { ...entry("2026-10-07"), planned: true },
    },
  });
  await page.goto("/food?date=2026-10-07");
  const review = page.getByRole("region", { name: "Nutrition day review" });
  await expect(
    review.getByRole("button", { name: "Mark complete", exact: true }),
  ).toBeDisabled();
  await review
    .getByRole("button", { name: "Confirm fasting", exact: true })
    .click();
  await review
    .getByRole("button", { name: "Yes, no caloric intake", exact: true })
    .click();
  await expect(review).toContainText("0 kcal recorded");
  await expect(review).toContainText("Confirmed fasting");
});

test("changing the diary date closes an unconfirmed fasting action", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food?date=2026-10-07");
  const review = page.getByRole("region", { name: "Nutrition day review" });
  await review
    .getByRole("button", { name: "Confirm fasting", exact: true })
    .click();
  await page.getByLabel("Record date", { exact: true }).fill("2026-10-08");
  await expect(
    review.getByRole("button", { name: "Yes, no caloric intake", exact: true }),
  ).toBeHidden();
  expect(
    await page.evaluate(() => localStorage.getItem("vk:nutrition:days")),
  ).toBeNull();
});

test("meal retrieval uses the newest correction and repeating it does not consume its old batch", async ({
  page,
}) => {
  const latest = {
    ...entry("2026-10-07"),
    id: "latest",
    foodId: "rice",
    name: "Corrected rice",
    updatedAt: 3,
    batchId: "old-batch",
    batchFraction: 0.25,
  };
  await seed(page, {
    "vk:nutrition:entries": {
      latest,
      older: { ...latest, id: "older", name: "Old rice", updatedAt: 1 },
    },
  });
  await page.goto("/food?date=2026-10-08");
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await expect(
    modal.getByRole("button", { name: "Add Old rice", exact: true }),
  ).toBeHidden();
  await modal
    .getByRole("button", { name: "Add Corrected rice", exact: true })
    .click();
  await modal.getByRole("button", { name: "Save meal", exact: true }).click();
  const repeated = await page.evaluate(() =>
    Object.values(
      JSON.parse(localStorage.getItem("vk:nutrition:entries") ?? "{}"),
    ).filter((e: any) => e.date === "2026-10-08"),
  );
  expect(repeated).toHaveLength(1);
  expect(repeated[0]).not.toHaveProperty("batchId");
  expect(repeated[0]).not.toHaveProperty("batchFraction");
});
