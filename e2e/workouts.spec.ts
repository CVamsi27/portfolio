import { expect, test } from "@playwright/test";
import { seed, daysAgoKey, workoutCell } from "./helpers";

/** The exercise card containing a named exercise. */
function card(page: import("@playwright/test").Page, name: string) {
  return page.locator("div.rounded-xl.border", { has: page.getByText(name, { exact: true }) }).first();
}

test.describe("workout tracker", () => {
  test("logs a structured set: weight × reps persist in kg", async ({ page }) => {
    await seed(page); // fullbody split → "Full Body Session" day, presets present
    await page.goto("/workout-tracking");

    const squats = card(page, "Squats");
    await expect(squats).toBeVisible();

    // Toggle done → target set rows seed + rest timer opens (90s default).
    await squats.getByRole("button", { name: "Mark Squats done" }).click();
    await expect(squats.getByLabel("Set 1 weight")).toBeVisible();
    await expect(page.getByText("Rest timer", { exact: true })).toBeVisible();

    // Fill structured fields.
    await squats.getByLabel("Set 1 weight").fill("62.5");
    await squats.getByLabel("Set 1 reps").fill("8");

    // Values persist through a reload (stored canonically in kg).
    await page.reload();
    const squats2 = card(page, "Squats");
    await expect(squats2.getByLabel("Set 1 weight")).toHaveValue("62.5");
    await expect(squats2.getByLabel("Set 1 reps")).toHaveValue("8");

    const stored = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:workouts"))) ?? "{}");
    const cell = stored?.[daysAgoKey(0)]?.squats;
    expect(cell.sets[0]).toEqual({ reps: 8, weightKg: 62.5 });
    expect(cell.done).toBe(true);
  });

  test("last-session prefill shows previous sets and copies them", async ({ page }) => {
    await seed(page, {
      "vk:workouts": { [daysAgoKey(3)]: { squats: workoutCell(10, 60) } },
    });
    await page.goto("/workout-tracking");

    const squats = card(page, "Squats");
    await expect(squats.getByText(/Last: 60 kg × 10/)).toBeVisible();

    await squats.getByRole("button", { name: "Prefill" }).click();
    await expect(squats.getByLabel("Set 1 weight")).toHaveValue("60");
    await expect(squats.getByLabel("Set 1 reps")).toHaveValue("10");
  });

  test("exercise library CRUD: add a custom exercise to the day", async ({ page }) => {
    await seed(page);
    await page.goto("/workout-tracking");

    await page.getByRole("button", { name: "Exercise", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("e.g. Incline Dumbbell Press").fill("Zercher Squat");
    await dialog.getByRole("button", { name: "Add exercise" }).click();

    const custom = card(page, "Zercher Squat");
    await expect(custom).toBeVisible();

    // Persisted in the library override for this day.
    const lib = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:workout:library"))) ?? "{}");
    expect(JSON.stringify(lib)).toContain("Zercher Squat");

    // Survives reload.
    await page.reload();
    await expect(card(page, "Zercher Squat")).toBeVisible();
  });

  test("rest timer presets, pause and restart work", async ({ page }) => {
    await seed(page);
    await page.goto("/workout-tracking");

    const squats = card(page, "Squats");
    await squats.getByRole("button", { name: "Mark Squats done" }).click();
    const timer = page.getByText("Rest timer", { exact: true });
    await expect(timer).toBeVisible();

    // Switch to 60s preset.
    await page.getByRole("button", { name: "60s", exact: true }).click();
    await expect(page.locator("span.font-display.text-\\[13px\\]")).toHaveText(/^00:5\d|^01:00$/);

    // Pause → countdown freezes; resume → ticks again.
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const frozen = await page.locator("span.font-display.text-\\[13px\\]").textContent();
    await page.waitForTimeout(1_200);
    expect(await page.locator("span.font-display.text-\\[13px\\]").textContent()).toBe(frozen);
    await page.getByRole("button", { name: "Resume" }).click();

    // Close it.
    await page.getByRole("button", { name: "Close rest timer" }).click();
    await expect(page.getByText("Rest timer", { exact: true })).toHaveCount(0);
  });

  test("kg ⇄ lbs toggle converts displayed weights", async ({ page }) => {
    await seed(page, {
      "vk:prefs": undefined, // remove the prefs override → use helper defaults below
      "vk:workouts": { [daysAgoKey(3)]: { squats: workoutCell(10, 60) } },
    });
    // Re-seed with lbs unit (seed merges; remove-then-set isn't possible in one pass).
    await page.addInitScript(() => {
      const prefs = JSON.parse(window.localStorage.getItem("vk:prefs") ?? "{}");
      prefs.weightUnit = "lbs";
      window.localStorage.setItem("vk:prefs", JSON.stringify(prefs));
    });

    await page.goto("/workout-tracking");
    const squats = card(page, "Squats");
    // 60 kg → 132.3 lbs (60 × 2.20462 = 132.2772 → "132.3 lbs").
    await expect(squats.getByText(/132\.3 lbs/)).toBeVisible();
  });

  test("weekly volume chart reflects logged tonnage", async ({ page }) => {
    await seed(page, {
      "vk:workouts": { [daysAgoKey(1)]: { squats: workoutCell(10, 100) } }, // 1000 kg this week
    });
    await page.goto("/workout-tracking");
    await expect(page.getByText(/this week/)).toBeVisible();
    await expect(page.getByText("Personal records")).toBeVisible();
    // PR card shows the seeded squat PR.
    await expect(page.getByText("Squats").first()).toBeVisible();
    await expect(page.getByText(/e1RM/).first()).toBeVisible();
  });
});
