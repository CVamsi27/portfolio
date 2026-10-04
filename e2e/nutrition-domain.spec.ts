import { test, expect } from "@playwright/test";
import { normalizeFdcFood } from "../src/lib/nutrition-provider";
test("provider normalization keeps nutrient identity, units, zero and missing values", () => {
  const food = normalizeFdcFood({
    fdcId: 123,
    description: "Provider fixture",
    dataType: "Foundation",
    foodNutrients: [
      { nutrient: { id: 1008, unitName: "KCAL" }, amount: 200 },
      { nutrient: { id: 1087, unitName: "MG" }, amount: 0 },
      { nutrient: { id: 1178, unitName: "UG" }, amount: 4.5 },
      { nutrient: { id: 1105, unitName: "UG" }, amount: 900 },
    ],
  });
  expect(food.basisAmount).toBe(100);
  expect(food.basisUnit).toBe("g");
  expect(food.nutrients).toMatchObject({
    energy: 200,
    calcium: 0,
    vitaminB12: 4.5,
    vitaminA: null,
  });
});
test("invalid provider payloads cannot produce an apparently valid food", () => {
  expect(() => normalizeFdcFood({ fdcId: NaN, description: "Bad" })).toThrow();
  expect(() => normalizeFdcFood({ fdcId: 123, description: "" })).toThrow();
});

test("database food provenance includes its retrieval date", () => {
  const food = normalizeFdcFood({
    fdcId: 123,
    description: "Dated source",
    dataType: "Foundation",
    foodNutrients: [],
  });
  expect(food.source).toMatch(/Retrieved \d{4}-\d{2}-\d{2}/);
});
