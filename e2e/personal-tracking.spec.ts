import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

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
    "Career",
    "Health",
    "Progress",
  ]);
  await nav.getByRole("link", { name: "Health", exact: true }).click();
  await expect(page).toHaveURL(/\/health$/);
  await expect(page.getByTestId("focus-lock-status")).toBeVisible();
  await page.getByRole("button", { name: "Cancel focus session" }).click();
  await expect(page.getByTestId("focus-lock-status")).toBeHidden();
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

test("personal pages fit a narrow phone in light and dark themes", async ({
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
      "/dashboard",
      "/more",
    ]) {
      await page.goto(route);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(320);
    }
  }
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
  await page.getByText("Habits", { exact: true }).click();
  await page.getByLabel("New habit").fill("Read for ten minutes");
  const habits = page
    .getByRole("heading", { name: "Small habits" })
    .locator("..");
  await habits.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByLabel("Read for ten minutes", { exact: true }).check();
  await page.reload();
  await page.getByText("Habits", { exact: true }).click();
  await expect(
    page.getByLabel("Read for ten minutes", { exact: true }),
  ).toBeChecked();
});
