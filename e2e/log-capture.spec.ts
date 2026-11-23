import { expect, test } from "@playwright/test";
import { seed, todayKey } from "./helpers";

test("Log validates and saves a task for the selected date", async ({ page }) => {
  await seed(page);
  await page.goto("/log?type=task");
  const workspace = page.getByTestId("capture-workspace");
  await expect(workspace).toBeVisible();
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(workspace.getByRole("alert")).toContainText("Enter a task name");
  await page.getByLabel("Task name", { exact: true }).fill("Send referral note");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(workspace.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  const todos = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:todos") ?? "[]"),
  );
  expect(todos.some((t: { text: string }) => t.text === "Send referral note")).toBe(true);
});

test("Log captures a career note into the daily journal and omits manual health logging", async ({
  page,
}) => {
  await seed(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/log?type=note");
  await expect(
    page.getByRole("button", { name: /^(Food|Weight|Sleep|Water|Workout|Fast)$/i }),
  ).toHaveCount(0);
  await page
    .getByLabel("Note", { exact: true })
    .fill("Reviewed PostgreSQL RLS tenant isolation invariants.");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const journal = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:journal") ?? "{}"),
  );
  expect(journal[todayKey()]?.learned).toContain("PostgreSQL RLS");
});
