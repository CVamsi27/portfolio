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
