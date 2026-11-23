import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

test("Library leads with retrieval and New item opens a focused capture", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/archive");
  await expect(page.getByLabel("Search library")).toHaveCount(0);
  await expect(page.getByLabel("Capture", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "New item", exact: true }).click();
  await page.getByLabel("Capture", { exact: true }).fill("A useful saved note");
  await page
    .getByRole("button", { name: "Save to library", exact: true })
    .click();
  await expect(page.getByLabel("Capture", { exact: true })).toBeHidden();
  await expect(
    page.getByText("A useful saved note", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByLabel("Search library")).toBeVisible();
});

test("Tasks retains the selected view across reload", async ({ page }) => {
  await seed(page);
  await page.goto("/todo");
  await page.getByRole("button", { name: /^Completed/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Completed/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("login continues to the intended personal day and rejects external destinations", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/login?next=%2Fhealth%3Fdate%3D2026-10-03");
  await page
    .getByRole("link", { name: "Continue to workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/health\?date=2026-10-03$/);
  await page.goto("/login?next=https%3A%2F%2Fevil.example");
  await expect(
    page.getByRole("link", { name: "Continue to workspace", exact: true }),
  ).toHaveAttribute("href", "/hub");
});

test("Goal shows milestones with its purpose and keeps the selected view", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/goal");
  await expect(
    page.getByRole("button", { name: "Add milestone", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Goal & milestones", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add milestone", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Add milestone" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Goal & milestones", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("discarding a Library draft starts the next capture empty", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/archive");
  await page.getByRole("button", { name: "New item", exact: true }).click();
  await page.getByLabel("Capture", { exact: true }).fill("Discard this draft");
  page.once("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "New item", exact: true }).click();
  await expect(page.getByLabel("Capture", { exact: true })).toHaveValue("");
});

test("Learning keeps curriculum search out of the current study flow", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/roadmap?view=roadmap");
  await expect(page.getByLabel("Search roadmap", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Curriculum", exact: true }).click();
  await expect(
    page.getByLabel("Search roadmap", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Curriculum", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
