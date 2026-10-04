import { expect, test } from "@playwright/test";
import { seed, todayKey } from "./helpers";

test("ending a fast from Log saves its actual session and preserves history", async ({
  page,
}) => {
  const startedAt = Date.now() - 2 * 3600_000;
  const previous = {
    id: "previous",
    start: startedAt - 86400_000,
    end: startedAt - 72000_000,
    protocolId: "16-8",
    source: "timer",
  };
  await seed(page, {
    "vk:fasting": { protocolId: "16-8", phase: "fasting", startedAt },
    "vk:fasting:history": [previous],
  });
  await page.goto("/health");
  await page.getByRole("button", { name: "End Fast Window" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Fast ended and saved to history",
  );
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:fasting:history") ?? "[]"),
  );
  expect(history).toHaveLength(2);
  expect(history[0]).toEqual(previous);
  expect(history[1]).toMatchObject({
    start: startedAt,
    protocolId: "16-8",
    source: "timer",
  });
  expect(history[1].end).toBeGreaterThan(startedAt);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "End Fast Window" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:fasting:history") ?? "[]"),
    ),
  ).toEqual(history);
});

test("Log respects the chosen weight unit and explains invalid entries", async ({
  page,
}) => {
  await seed(page);
  await page.addInitScript(() => {
    const prefs = JSON.parse(localStorage.getItem("vk:prefs") ?? "{}");
    localStorage.setItem(
      "vk:prefs",
      JSON.stringify({ ...prefs, weightUnit: "lbs" }),
    );
    localStorage.setItem(
      "vk:weight-loss",
      JSON.stringify({
        entries: {
          [new Date().toISOString().slice(0, 10)]: {
            weightKg: 80,
            updatedAt: Date.now(),
          },
        },
        recoveryByDay: {},
      }),
    );
  });
  await page.goto("/log?type=weight");
  await expect(page.getByLabel("Weight (lbs)")).toBeVisible();
  const weight = page.getByRole("spinbutton", { name: "Weight (lbs)" });
  await weight.fill("-1");
  await page
    .getByRole("button", { name: "Save weigh-in", exact: true })
    .click();
  await expect(weight).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByTestId("capture-workspace").getByRole("alert"),
  ).toContainText("Enter a valid weight in lbs");
  await weight.fill("180");
  await page
    .getByRole("button", { name: "Save weigh-in", exact: true })
    .click();
  await expect(
    page.getByTestId("capture-workspace").getByRole("alert"),
  ).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Saved on this device.");
});

test("optional recovery records explicit energy and preserves it on touch screens", async ({
  page,
}) => {
  await seed(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/log?type=sleep");
  await page.getByLabel("Sleep duration (hours)").fill("7");
  await page.getByText("Optional recovery details", { exact: true }).click();
  const score = page.getByLabel("Energy", { exact: true });
  await score.selectOption("4");
  await page.getByRole("button", { name: "Save sleep", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const recovery = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:recovery:entries") ?? "{}"),
  );
  expect(recovery[todayKey()].energy).toBe(4);
});
