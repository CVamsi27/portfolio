import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
const entry = {
  id: "rice-log",
  foodId: "rice",
  name: "Cooked rice",
  date: "2026-10-07",
  meal: "Lunch",
  quantity: 150,
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy: 130, calcium: null },
  source: "Label fixture",
  updatedAt: 1,
};
const recipe = {
  id: "stew",
  name: "Lentil stew",
  basisAmount: 4,
  basisUnit: "serving",
  servings: 4,
  cookedWeightGrams: 800,
  nutrients: { energy: 1200 },
  ingredients: [],
  source: "Private recipe",
  updatedAt: 1,
};
test("save and repeat an immutable meal with reviewed portions", async ({
  page,
}) => {
  await seed(page, { "vk:nutrition:entries": { "rice-log": entry } });
  await page.goto("/food?view=saved&date=2026-10-07");
  const library = page.getByRole("region", { name: "Meal library" });
  await library
    .getByLabel("Meal template name", { exact: true })
    .fill("Usual lunch");
  await library
    .getByRole("button", { name: "Save meal template", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Repeat Usual lunch", exact: true })
    .click();
  const modal = page.getByRole("dialog", { name: "Review meal portions" });
  await modal.getByLabel("Consumed date", { exact: true }).fill("2026-10-08");
  await modal
    .getByLabel("Portion for Cooked rice (g)", { exact: true })
    .fill("200");
  await modal
    .getByRole("button", { name: "Save consumed meal", exact: true })
    .click();
  await expect(modal).toBeHidden();
  const stored = await page.evaluate(
    () =>
      Object.values(
        JSON.parse(localStorage.getItem("vk:nutrition:entries") ?? "{}"),
      ) as (typeof entry)[],
  );
  expect(stored).toHaveLength(2);
  expect(stored.find((e) => e.date === "2026-10-08")?.quantity).toBe(200);
  expect(stored.find((e) => e.date === "2026-10-08")?.nutrients.energy).toBe(
    130,
  );
  await page.reload();
  await expect(
    library.getByRole("button", { name: "Repeat Usual lunch", exact: true }),
  ).toBeVisible();
});
test("preparation is separate from intake and portions respect remaining declared yield", async ({
  page,
}) => {
  await seed(page, { "vk:nutrition:recipes": { stew: recipe } });
  await page.goto("/food?view=saved&date=2026-10-07");
  const library = page.getByRole("region", { name: "Meal library" });
  await library
    .getByRole("button", { name: "Prepare Lentil stew", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Prepare recipe batch" })
    .getByRole("button", { name: "Save prepared batch", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        Object.keys(
          JSON.parse(localStorage.getItem("vk:nutrition:entries") ?? "{}"),
        ).length,
    ),
  ).toBe(0);
  await library
    .getByRole("button", { name: "Log portion of Lentil stew", exact: true })
    .click();
  const modal = page.getByRole("dialog", { name: "Review meal portions" });
  await modal
    .getByLabel("Batch portion unit", { exact: true })
    .selectOption("g");
  await modal.getByLabel("Batch portion", { exact: true }).fill("200");
  await modal
    .getByRole("button", { name: "Save consumed meal", exact: true })
    .click();
  await expect(library).toContainText("Declared remaining: 600 g / 3 servings");
  const stored = await page.evaluate(
    () =>
      Object.values(
        JSON.parse(localStorage.getItem("vk:nutrition:entries") ?? "{}"),
      ) as (typeof entry)[],
  );
  expect(stored).toHaveLength(1);
  expect(stored[0].nutrients.energy).toBe(300);
  expect(stored[0].quantity).toBe(200);
  expect(stored[0].basisAmount).toBe(200);
  await library
    .getByRole("button", { name: "Log portion of Lentil stew", exact: true })
    .click();
  await modal
    .getByLabel("Batch portion unit", { exact: true })
    .selectOption("g");
  await modal.getByLabel("Batch portion", { exact: true }).fill("700");
  await modal
    .getByRole("button", { name: "Save consumed meal", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toContainText("exceeds");
});

test("correcting a batch portion preserves its provenance and recalculates remaining", async ({
  page,
}) => {
  const portion = {
    ...entry,
    id: "portion",
    foodId: "stew",
    name: "Lentil stew",
    quantity: 200,
    basisAmount: 200,
    nutrients: { energy: 300 },
    batchId: "prepared",
    batchFraction: 0.25,
  };
  await seed(page, {
    "vk:nutrition:entries": { portion },
    "vk:nutrition:batches": {
      prepared: {
        id: "prepared",
        recipe,
        preparedDate: "2026-10-07",
        updatedAt: 2,
      },
    },
  });
  await page.goto("/food?date=2026-10-07");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Nutrients per", { exact: true }).fill("100");
  await modal.getByLabel("Consumed quantity", { exact: true }).fill("100");
  await modal
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await page.goto("/food?view=saved&date=2026-10-07");
  await expect(
    page.getByRole("region", { name: "Meal library" }),
  ).toContainText("Declared remaining: 700 g / 3.5 servings");
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("vk:nutrition:entries") ?? "{}").portion,
  );
  expect(stored.batchId).toBe("prepared");
  expect(stored.batchFraction).toBe(0.125);
});
test("clearing prepared servings leaves only a declared cooked-weight yield", async ({
  page,
}) => {
  await seed(page, { "vk:nutrition:recipes": { stew: recipe } });
  await page.goto("/food?view=saved&date=2026-10-07");
  await page
    .getByRole("button", { name: "Prepare Lentil stew", exact: true })
    .click();
  const modal = page.getByRole("dialog", { name: "Prepare recipe batch" });
  await modal.getByLabel("Prepared servings", { exact: true }).fill("");
  await modal
    .getByRole("button", { name: "Save prepared batch", exact: true })
    .click();
  const batch = (await page.evaluate(
    () =>
      Object.values(
        JSON.parse(localStorage.getItem("vk:nutrition:batches") ?? "{}"),
      )[0],
  )) as { recipe: typeof recipe };
  expect(batch.recipe.basisUnit).toBe("g");
  expect(batch.recipe.cookedWeightGrams).toBe(800);
  expect(batch.recipe.servings).toBeUndefined();
  await page
    .getByRole("button", { name: "Log portion of Lentil stew", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Review meal portions" })
      .getByLabel("Batch portion unit", { exact: true }),
  ).toHaveValue("g");
});
