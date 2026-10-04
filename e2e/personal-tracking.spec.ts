import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
test("manual portions, immutable snapshots, unknown nutrients and undo survive reload", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food");
  await page.getByRole("button", { name: "Log food", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Log food", exact: true });
  await dialog.getByLabel("Food name").fill("Measured meal");
  await dialog.getByLabel("Calories (kcal)", { exact: true }).fill("200");
  await dialog.getByLabel("Protein (g)", { exact: true }).fill("10");
  await dialog.getByLabel("Consumed quantity").fill("150");
  await expect(dialog).toContainText("This portion: 300 kcal");
  await dialog.getByRole("button", { name: "Save food", exact: true }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Measured meal" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("150 g · 300 kcal")).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit food entry" });
  await edit.getByLabel("Consumed quantity").fill("50");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("50 g · 100 kcal")).toBeVisible();
  const values = await page.evaluate(() => ({
    entries: JSON.parse(localStorage.getItem("vk:nutrition:entries")!),
    foods: JSON.parse(localStorage.getItem("vk:nutrition:foods")!),
  }));
  expect(Object.values(values.foods)[0]).toMatchObject({
    basisAmount: 100,
    nutrients: { energy: 200, calcium: null },
  });
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Measured meal" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Undo removal" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Measured meal" }),
  ).toBeVisible();
});
test("primary navigation stays clickable during an active focus session", async ({
  page,
}) => {
  await seed(page, {
    "vk:focus:active": {
      id: "session",
      label: "Work",
      mode: "open",
      startedAt: Date.now(),
      pausedMs: 0,
    },
  });
  await page.goto("/hub");
  const nav = page.getByTestId("tracker-primary-nav");
  await expect(nav.getByRole("link")).toHaveText([
    "Today",
    "Plan",
    "Health",
    "Progress",
  ]);
  await nav.getByRole("link", { name: "Health", exact: true }).click();
  await expect(page).toHaveURL(/\/health$/);
  await expect(page.getByTestId("focus-lock-status")).toBeVisible();
  await page.getByRole("button", { name: "Cancel focus session" }).click();
  await expect(page.getByTestId("focus-lock-status")).toBeHidden();
});
test("routine completion is separate from food and undo restores the due occurrence", async ({
  page,
}) => {
  const now = Date.now();
  await seed(page, {
    "vk:routine:schedules": {
      lunch: {
        id: "lunch",
        label: "Lunch",
        time: "14:00",
        days: [0, 1, 2, 3, 4, 5, 6],
        timezone: "Asia/Kolkata",
        enabled: true,
        type: "meal",
        meal: "Lunch",
        updatedAt: now,
      },
    },
  });
  await page.goto("/routine");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Undo completion" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("vk:nutrition:entries")),
  ).toBeNull();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Undo completion" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo completion" }).click();
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Snooze 10 min" }).click();
  await expect(page.getByText(/· Snoozed/)).toBeVisible();
});
test("disabled Today modules disappear without deleting their records", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/settings#modules");
  await page.getByLabel("Food and nutrients", { exact: true }).uncheck();
  await page.goto("/hub");
  await expect(
    page.getByRole("link", { name: "Log food", exact: false }),
  ).toBeHidden();
  await page.goto("/food");
  await expect(
    page.getByRole("button", { name: "Log food", exact: true }),
  ).toBeVisible();
});

test("recipe portions use the declared yield and edits leave meal snapshots unchanged", async ({
  page,
}) => {
  const food = {
    id: "ingredient",
    name: "Known ingredient",
    basisAmount: 100,
    basisUnit: "g",
    nutrients: { energy: 200, protein: 10, calcium: null },
    source: "Manual label",
    updatedAt: 1,
  };
  await seed(page, { "vk:nutrition:foods": { ingredient: food } });
  await page.goto("/food");
  await page
    .getByRole("button", { name: "Saved foods & recipes", exact: true })
    .click();
  await page.getByRole("button", { name: "Create recipe" }).click();
  const recipe = page.getByRole("dialog", { name: "Create recipe" });
  await recipe.getByLabel("Recipe name").fill("Batch meal");
  await recipe.getByLabel("Saved ingredient").selectOption("ingredient");
  await recipe
    .getByLabel("Ingredient quantity (selected food’s unit)")
    .fill("200");
  await recipe.getByRole("button", { name: "Add ingredient" }).click();
  await recipe.getByLabel("Final batch yield").fill("4");
  await recipe.getByRole("button", { name: "Save recipe" }).click();
  await page.getByRole("button", { name: "Diary", exact: true }).click();
  await page.getByRole("button", { name: "Log food", exact: true }).click();
  const log = page.getByRole("dialog", { name: "Log food", exact: true });
  const id = await page.evaluate(
    () =>
      Object.keys(JSON.parse(localStorage.getItem("vk:nutrition:recipes")!))[0],
  );
  await log.getByLabel("Saved foods and recipes").selectOption(id);
  await log.getByLabel("Consumed quantity").fill("1");
  await expect(log).toContainText("This portion: 100 kcal");
  await log.getByRole("button", { name: "Save food", exact: true }).click();
  await expect(page.getByText("1 serving · 100 kcal")).toBeVisible();
  await page
    .getByRole("button", { name: "Saved foods & recipes", exact: true })
    .click();
  await page.getByText("Saved recipes", { exact: true }).click();
  await page.getByRole("button", { name: "Edit recipe", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit recipe" });
  await edit.getByLabel("Final batch yield").fill("2");
  await edit.getByRole("button", { name: "Save recipe" }).click();
  await page.getByRole("button", { name: "Diary", exact: true }).click();
  await expect(page.getByText("1 serving · 100 kcal")).toBeVisible();
});

test("nutrition backup preserves unknown values and invalid imports write nothing", async ({
  page,
}) => {
  const entry = {
    id: "food",
    foodId: "source",
    name: "Private food",
    basisAmount: 100,
    basisUnit: "ml",
    quantity: 150,
    date: "2026-10-03",
    meal: "Lunch",
    nutrients: { energy: 0, calcium: null },
    source: "User label",
    updatedAt: 5,
  };
  await seed(page, { "vk:nutrition:entries": { food: entry } });
  await page.goto("/settings#data");
  const downloadP = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export full backup/ }).click();
  const download = await downloadP;
  const fs = await import("node:fs/promises");
  const backup = JSON.parse(
    await fs.readFile((await download.path())!, "utf8"),
  );
  expect(backup.data["nutrition:entries"].food).toMatchObject(entry);
  const importFile = async (value: unknown) => {
    const chooserP = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Import backup/ }).click();
    await (
      await chooserP
    ).setFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(value)),
    });
  };
  const invalid = {
    ...backup,
    data: {
      ...backup.data,
      todos: [],
      "nutrition:entries": { food: { ...entry, quantity: -1 } },
    },
  };
  await importFile(invalid);
  await expect(page.getByText("Import failed", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:nutrition:entries")!),
    ),
  ).toEqual({ food: entry });
  await page.evaluate(() => localStorage.removeItem("vk:nutrition:entries"));
  await importFile(backup);
  await expect(page.getByText(/Restored \d+ keys/)).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:nutrition:entries")!),
    ),
  ).toEqual({ food: entry });
});

test("new pages and food dialog fit a narrow phone in light and dark themes", async ({
  page,
}) => {
  await seed(page);
  await page.setViewportSize({ width: 320, height: 750 });
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    for (const route of [
      "/hub",
      "/plan",
      "/health",
      "/review",
      "/food",
      "/routine",
      "/more",
    ]) {
      await page.goto(route);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(320);
    }
    await page.goto("/food");
    await page.getByRole("button", { name: "Log food", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Log food", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(320);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  }
});

test("the 10 PM supplement remains reachable after leaving bedtime mode", async ({
  page,
}) => {
  const now = Date.parse("2026-10-04T22:00:00+05:30");
  await page.clock.install({ time: new Date(now) });
  await seed(page, {
    "vk:lockdown:preferences": {
      bedtimeEnabled: true,
      bedtimeStart: "00:00",
      bedtimeEnd: "23:59",
      bedtimeDays: [0, 1, 2, 3, 4, 5, 6],
    },
    "vk:routine:schedules": {
      magnesium: {
        id: "magnesium",
        label: "Magnesium",
        time: "22:00",
        days: [0, 1, 2, 3, 4, 5, 6],
        timezone: "Asia/Kolkata",
        enabled: true,
        type: "supplement",
        updatedAt: now,
      },
    },
  });
  await page.goto("/hub");
  const rest = page.getByRole("dialog", { name: "Bedtime mode" });
  await expect(rest).toBeVisible();
  await rest
    .getByRole("link", { name: "Meal and supplement reminders" })
    .click();
  await expect(page).toHaveURL(/\/routine$/);
  await expect(rest).toBeHidden();
  await page.getByRole("button", { name: "Taken", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Undo completion" }),
  ).toBeVisible();
  await page.reload();
  await expect(rest).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Undo completion" }),
  ).toBeVisible();
});

test("habit Add submits by click and completion survives reload", async ({
  page,
}) => {
  await seed(page, {
    "vk:personal:modules": {
      food: false,
      routine: false,
      study: false,
      recovery: false,
      habits: true,
      fasting: false,
      movement: false,
    },
  });
  await page.goto("/hub");
  await page.getByLabel("New habit").fill("Read for ten minutes");
  const habits = page
    .getByRole("heading", { name: "Small habits" })
    .locator("..");
  await habits.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByLabel("Read for ten minutes", { exact: true }).check();
  await page.reload();
  await expect(
    page.getByLabel("Read for ten minutes", { exact: true }),
  ).toBeChecked();
});

test("changing a source portion unit requires newly declared nutrient values", async ({
  page,
}) => {
  await seed(page, {
    "vk:nutrition:foods": {
      source: {
        id: "source",
        name: "Per-100g label",
        basisAmount: 100,
        basisUnit: "g",
        nutrients: { energy: 200 },
        source: "Label per 100g",
        updatedAt: 1,
      },
    },
  });
  await page.goto("/food");
  await page.getByRole("button", { name: "Log food", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Log food", exact: true });
  await form.getByLabel("Saved foods and recipes").selectOption("source");
  await form.getByLabel("Portion unit").selectOption("ml");
  await expect(form.getByLabel("Calories (kcal)", { exact: true })).toHaveValue(
    "",
  );
  await expect(form).toContainText(
    "NOVA does not assume a weight-to-volume conversion.",
  );
  await form.getByLabel("Calories (kcal)", { exact: true }).fill("50");
  await form.getByRole("button", { name: "Save food", exact: true }).click();
  await expect(page.getByText("100 ml · 50 kcal")).toBeVisible();
});

test("food defaults to the device calendar day near UTC midnight", async ({
  browser,
}) => {
  const context = await browser.newContext({ timezoneId: "Asia/Kolkata" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-10-03T20:00:00Z") });
  await seed(page);
  await page.goto("/food");
  await expect(page.locator('input[type="date"]').first()).toHaveValue(
    "2026-10-04",
  );
  await context.close();
});
