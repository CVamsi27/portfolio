import { test, expect } from "@playwright/test";
import { normalizeFdcFood } from "../src/lib/nutrition-provider";

test("Foundation calories use specific then general Atwater values without guessing", () => {
  const base = {
    fdcId: 123,
    description: "Foundation fixture",
    dataType: "Foundation",
  };
  expect(
    normalizeFdcFood({
      ...base,
      foodNutrients: [
        { nutrient: { id: 2047, unitName: "kcal" }, amount: 150 },
        { nutrient: { id: 2048, unitName: "kcal" }, amount: 140 },
      ],
    }).nutrients.energy,
  ).toBe(140);
  expect(
    normalizeFdcFood({
      ...base,
      foodNutrients: [{ nutrient: { id: 2047, unitName: "kcal" }, amount: 0 }],
    }).nutrients.energy,
  ).toBe(0);
});

test("malformed provider nutrient rows do not break otherwise valid food", () => {
  const food = normalizeFdcFood({
    fdcId: 123,
    description: "Food",
    foodNutrients: [
      null,
      {},
      { nutrient: { id: 1008, unitName: "kcal" }, amount: 42 },
    ],
  });
  expect(food.nutrients.energy).toBe(42);
});

test("recipe ingredient selection gives visible feedback instead of silently failing", async ({
  page,
}) => {
  await page.goto("/food?view=saved");
  await page
    .getByRole("button", { name: "Create recipe", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add ingredient", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Choose a saved ingredient",
  );
});

test("save an ingredient without a meal, create a recipe and review one serving before logging", async ({
  page,
}) => {
  await page.goto("/food?view=saved&date=2026-10-07");
  await page
    .getByRole("button", { name: "Add saved food", exact: true })
    .click();
  const food = page.getByRole("dialog", {
    name: "Add saved food",
    exact: true,
  });
  await food.getByLabel("Food name", { exact: true }).fill("Ingredient label");
  await food.getByLabel("Calories (kcal)", { exact: true }).fill("200");
  await food
    .getByRole("button", { name: "Save ingredient", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      Object.keys(
        JSON.parse(localStorage.getItem("vk:nutrition:entries") ?? "{}"),
      ),
    ),
  ).toHaveLength(0);
  await page
    .getByRole("button", { name: "Create recipe", exact: true })
    .click();
  const recipe = page.getByRole("dialog", {
    name: "Create recipe",
    exact: true,
  });
  await recipe.getByLabel("Recipe name").fill("Four serving batch");
  const ingredient = await page.evaluate(
    () =>
      Object.keys(JSON.parse(localStorage.getItem("vk:nutrition:foods")!))[0],
  );
  await recipe.getByLabel("Saved ingredient").selectOption(ingredient);
  await expect(
    recipe.getByLabel("Ingredient quantity (selected food’s unit)"),
  ).toHaveValue("100");
  await recipe
    .getByLabel("Ingredient quantity (selected food’s unit)")
    .fill("200");
  await recipe
    .getByRole("button", { name: "Add ingredient", exact: true })
    .click();
  await recipe
    .getByRole("button", { name: "Save recipe", exact: true })
    .click();
  await page.getByText("Saved recipes", { exact: true }).click();
  await page.getByRole("button", { name: "Log recipe", exact: true }).click();
  const log = page.getByRole("dialog", { name: "Log food", exact: true });
  await expect(
    log.getByLabel("Consumed quantity", { exact: true }),
  ).toHaveValue("1");
  await expect(log).toContainText("This portion: 100 kcal");
  await log.getByRole("button", { name: "Save food", exact: true }).click();
  await page.getByRole("button", { name: "Diary", exact: true }).click();
  await expect(
    page.getByText("1 serving · 100 kcal", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("1 serving · 100 kcal", { exact: true }),
  ).toBeVisible();
});

test("quick capture reviews one recipe serving instead of the whole batch", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "vk:nutrition:recipes",
      JSON.stringify({
        batch: {
          id: "batch",
          name: "Saved batch",
          basisAmount: 4,
          basisUnit: "serving",
          nutrients: { energy: 400 },
          source: "Recipe estimate",
          updatedAt: 1,
          ingredients: [],
        },
      }),
    ),
  );
  await page.goto("/log?type=food&date=2026-10-07");
  await page.getByLabel("Recent and saved food").selectOption("batch");
  await expect(page.getByLabel("Food quantity", { exact: true })).toHaveValue(
    "1",
  );
  await expect(page.getByText(/100 kcal · 2026-10-07/)).toBeVisible();
});
