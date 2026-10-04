import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

test("workout session controls are immediate and History and Plan survive reload", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/workout-tracking?date=2026-10-03");
  await expect(page.getByRole("group", { name: "Weight unit" })).toBeVisible();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Personal records", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "History", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Workout plan", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/date=2026-10-03.*view=plan/);
});

test("Library leads with retrieval and Add item opens a focused capture", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/archive");
  await expect(page.getByLabel("Search library")).toBeInViewport();
  await expect(page.getByLabel("Capture", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Capture", { exact: true }).fill("A useful saved note");
  await page
    .getByRole("button", { name: "Save to library", exact: true })
    .click();
  await expect(page.getByLabel("Capture", { exact: true })).toBeHidden();
  await expect(
    page.getByText("A useful saved note", { exact: true }).first(),
  ).toBeVisible();
});

test("Water is the default and meal window/history are deliberate views", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/intermittent-fasting");
  await expect(page.getByLabel("First meal time")).toBeHidden();
  await page
    .getByRole("button", { name: "Eating window", exact: true })
    .click();
  await expect(page.getByLabel("First meal time")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("First meal time")).toBeVisible();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "History", exact: true }),
  ).toBeVisible();
});

test("Routine and Tasks retain the selected view", async ({ page }) => {
  await seed(page);
  await page.goto("/routine");
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Notifications", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
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

test("Goal separates its purpose from milestone editing and keeps the selected view", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/goal");
  await expect(
    page.getByRole("button", { name: "Add milestone", exact: true }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Milestones", exact: true }).click();
  await page
    .getByRole("button", { name: "Add milestone", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Add milestone" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Milestones", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Food exposes the selected view to assistive technology after reload", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/food?date=2026-10-03&view=nutrients");
  await expect(
    page.getByRole("button", { name: "Nutrients", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Diary", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Diary", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Record date", { exact: true })).toHaveValue(
    "2026-10-03",
  );
});

test("changing the food diary date survives reload", async ({ page }) => {
  await seed(page);
  await page.goto("/food?date=2026-10-03&view=diary");
  await page.getByLabel("Record date", { exact: true }).fill("2026-10-02");
  await page.reload();
  await expect(page.getByLabel("Record date", { exact: true })).toHaveValue(
    "2026-10-02",
  );
});

test("discarding a Library draft starts the next capture empty", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/archive");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Capture", { exact: true }).fill("Discard this draft");
  page.once("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(page.getByLabel("Capture", { exact: true })).toHaveValue("");
});

test("workout date changes survive reload", async ({ page }) => {
  await seed(page);
  await page.goto("/workout-tracking?date=2026-10-03");
  await page.getByLabel("Selected date", { exact: true }).fill("2026-10-02");
  await page.reload();
  await expect(page.getByLabel("Selected date", { exact: true })).toHaveValue(
    "2026-10-02",
  );
});

test("finishing capture from Today returns to Today", async ({ page }) => {
  await seed(page);
  await page.goto("/workout-tracking?date=2026-10-03&returnTo=%2Fhub");
  await page
    .getByRole("button", { name: "Review and finish workout", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Done · return to previous page", exact: true })
    .click();
  await expect(page).toHaveURL(/\/hub$/);
});

test("Learning keeps curriculum search out of the current study flow", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/roadmap");
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
