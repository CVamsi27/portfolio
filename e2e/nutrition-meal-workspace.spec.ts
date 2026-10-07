import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
const food = (id: string, name: string, energy: number) => ({
  id,
  name,
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy, protein: 10 },
  source: "Label fixture",
  updatedAt: 1,
});
test("a multi-food meal draft survives reload and saves once with reviewed portions", async ({
  page,
}) => {
  await seed(page, {
    "vk:nutrition:foods": {
      rice: food("rice", "Cooked rice", 130),
      dal: food("dal", "Cooked lentils", 116),
    },
  });
  await page.goto("/food?date=2026-10-07");
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await modal
    .getByRole("button", { name: "Add Cooked rice", exact: true })
    .click();
  await modal
    .getByRole("button", { name: "Add Cooked lentils", exact: true })
    .click();
  await modal
    .getByLabel("Quantity for Cooked rice", { exact: true })
    .fill("150");
  await expect(modal).toContainText("311");
  await expect(modal.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  await expect(
    modal.getByLabel("Quantity for Cooked rice", { exact: true }),
  ).toHaveValue("150");
  await expect(
    modal.getByLabel("Quantity for Cooked lentils", { exact: true }),
  ).toHaveValue("100");
  await modal.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(modal).toBeHidden();
  const entries = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:nutrition:entries")!),
  );
  expect(Object.values(entries)).toHaveLength(2);
  expect(new Set(Object.values(entries).map((e: any) => e.mealId)).size).toBe(
    1,
  );
  await page.reload();
  await expect(
    page.getByText("150 g · 195 kcal", { exact: true }),
  ).toBeVisible();
});
test("meal editor can create a custom food inside the same draft without logging until save", async ({
  page,
}) => {
  await page.goto("/food?date=2026-10-07");
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await modal.getByRole("button", { name: "Quick add", exact: true }).click();
  await modal.getByLabel("Food name", { exact: true }).fill("Lunch estimate");
  await modal.getByLabel("Calories (kcal)", { exact: true }).fill("500");
  await modal.getByRole("button", { name: "Add to meal", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        Object.keys(
          JSON.parse(localStorage.getItem("vk:nutrition:entries") ?? "{}"),
        ).length,
    ),
  ).toBe(0);
  await expect(
    modal.getByLabel("Quantity for Lunch estimate", { exact: true }),
  ).toHaveValue("1");
  await modal.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    page.getByText("1 serving · 500 kcal", { exact: true }),
  ).toBeVisible();
});

test("a corrupt stored draft is reported and retained until explicitly discarded", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food?date=2026-10-07");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("nova-nutrition-drafts-v1", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("drafts");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("drafts", "readwrite");
        tx.objectStore("drafts").put({ damaged: "retained" }, "local");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await expect(modal.getByRole("alert")).toContainText(
    "Stored meal draft is invalid",
  );
  await expect(
    modal.getByRole("button", { name: "Save meal", exact: true }),
  ).toBeDisabled();
  const snapshot = await page.evaluate(
    async () =>
      new Promise((resolve) => {
        const request = indexedDB.open("nova-nutrition-drafts-v1", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("drafts");
          const read = tx.objectStore("drafts").get("local");
          read.onsuccess = () => resolve(read.result);
          tx.oncomplete = () => db.close();
        };
      }),
  );
  expect(snapshot).toEqual({ damaged: "retained" });
  page.once("dialog", (dialog) => dialog.accept());
  await modal
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await expect(modal).toBeHidden();
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  await expect(modal.getByRole("alert")).toHaveCount(0);
  await expect(modal.getByRole("status")).toContainText("Draft saved");
});

test("cooked recipe grams use declared cooked yield without scaling the batch twice", async ({
  page,
}) => {
  await seed(page, {
    "vk:nutrition:recipes": {
      batch: {
        id: "batch",
        name: "Cooked batch",
        source: "Private recipe",
        basisAmount: 4,
        basisUnit: "serving",
        servings: 4,
        cookedWeightGrams: 800,
        nutrients: { energy: 400 },
        ingredients: [
          {
            foodId: "rice",
            name: "Rice",
            quantity: 200,
            unit: "g",
            nutrients: { energy: 400 },
          },
        ],
        updatedAt: 1,
      },
    },
  });
  await page.goto("/food?date=2026-10-07");
  await page.getByRole("button", { name: "Log meal", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Log meal", exact: true });
  await modal
    .getByRole("button", { name: "Add 100 g cooked", exact: true })
    .click();
  await modal
    .getByLabel("Quantity for Cooked batch", { exact: true })
    .fill("200");
  await modal.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    page.getByText("200 g · 100 kcal", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("200 g · 100 kcal", { exact: true }),
  ).toBeVisible();
});

test("meal, recipe, strategy, nutrition progress and connection workflows fit a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await seed(page, {
    "vk:nutrition:foods": {
      rice: food("rice", "A long descriptive cooked rice food label", 130),
    },
  });
  for (const theme of ["light", "dark"]) {
    await page.goto("/food");
    await page.evaluate((theme) => {
      localStorage.setItem("theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }, theme);
    await page.getByRole("button", { name: "Log meal", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Log meal", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    for (const view of ["strategy", "insights", "saved"]) {
      await page.goto(`/food?view=${view}&date=2026-10-07`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto("/health?view=connections");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
