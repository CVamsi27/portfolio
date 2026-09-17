import { expect, test } from "@playwright/test";
import { seed, daysAgoKey, workoutCell } from "./helpers";

test.describe("onboarding questionnaire", () => {
  test("walks goal → workout → fasting → motivation and persists prefs", async ({ page }) => {
    // Fresh visitor — no prefs at all (do not use the standard seed).
    // sessionStorage guard: survives reloads, fresh per test context.
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("__vkOnboard1")) return;
      window.sessionStorage.setItem("__vkOnboard1", "1");
      window.localStorage.clear();
    });
    await page.goto("/trackers");

    await expect(page.getByText("Welcome to your Trackers")).toBeVisible();

    // Step 0: name.
    await page.getByPlaceholder("Your name").fill("E2E Runner");
    await page.getByRole("button", { name: "Next" }).click();

    // Step 1: goal — pick Financial, override metric target. Labels aren't
    // programmatically associated; step 1 has inputs [title, metric, target].
    await page.getByText("Financial", { exact: false }).first().click();
    await page.locator("input").nth(0).fill("Emergency fund");
    await page.locator("input").nth(2).fill("25");
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: workout — pick Push / Pull / Legs and kg.
    await page.getByRole("button", { name: "Push / Pull / Legs" }).click();
    await page.getByRole("button", { name: "Kilograms (kg)" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 3: fasting — No disables the protocol picker.
    await page.getByText("No", { exact: true }).click();
    await expect(page.getByText("Preferred protocol")).not.toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 4: motivation — Stoic, then finish.
    await page.getByText("Calm, focused, unstoppable").click();
    await page.getByRole("button", { name: /Get started/ }).click();

    // Prefs persisted + onboarding dismissed.
    await expect(page.getByText("Welcome back, E2E Runner")).toBeVisible({ timeout: 10_000 });
    const prefs = JSON.parse(
      (await page.evaluate(() => window.localStorage.getItem("vk:prefs"))) ?? "{}",
    );
    expect(prefs.questionnaireDone).toBe(true);
    expect(prefs.name).toBe("E2E Runner");
    expect(prefs.goalCategory).toBe("financial");
    expect(prefs.workoutSplit).toBe("push-pull-legs");
    expect(prefs.fastingEnabled).toBe(false);
    expect(prefs.motivationStyle).toBe("stoic");
    expect(prefs.dailyMetricTarget).toBe(25);
  });

  test("reappears until finished — leaving mid-flow keeps onboarding pending", async ({ page }) => {
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("__vkOnboard2")) return;
      window.sessionStorage.setItem("__vkOnboard2", "1");
      window.localStorage.clear();
    });
    await page.goto("/trackers");
    await expect(page.getByText("Welcome to your Trackers")).toBeVisible();
    await page.getByPlaceholder("Your name").fill("Halfway");
    await page.getByRole("button", { name: "Next" }).click();
    // Reload — nothing was finished, so questionnaireDone is still false and
    // the questionnaire must reappear (storage survives the reload).
    await page.reload();
    await expect(page.getByText("Welcome to your Trackers")).toBeVisible();
  });
});

test.describe("hub command center", () => {
  test("momentum ring, quick actions, and week-in-review render from seeded data", async ({ page }) => {
    const now = Date.now();
    const today = daysAgoKey(0);
    await seed(page, {
      // One fast yesterday (~16h) and one active fast today.
      "vk:fasting:history": [
        { id: "f1", start: now - 40 * 3600_000, end: now - 24 * 3600_000, protocolId: "16-8", source: "timer" },
      ],
      "vk:fasting": { protocolId: "16-8", phase: "fasting", startedAt: now - 3600_000 },
      // Squats logged today (anchor: workout) + one past session for last-session hints.
      "vk:workouts": {
        [daysAgoKey(3)]: { squats: workoutCell(10, 60) },
        [today]: { squats: workoutCell(12, 62.5, false) },
      },
      // One P1 task done today, one open (anchor: tasks).
      "vk:todos": [
        { id: "t1", text: "Seed done task", done: true, date: today, priority: "P1", tag: "Work", createdAt: now - 7200_000, completedAt: now - 3600_000 },
        { id: "t2", text: "Seed open task", done: false, date: today, priority: "P2", tag: "Work", createdAt: now - 3600_000 },
      ],
      // Goal metric logged today (anchor: goal).
      "vk:goal": { metricByDay: { [today]: 3 }, milestonesByCategory: {} },
    });

    await page.goto("/trackers");

    await expect(page.getByText("Welcome back, Test User")).toBeVisible();

    // Momentum ring shows a percentage and the four legend anchors.
    const pct = await page.locator("span.font-display.text-4xl").first().textContent();
    expect(pct).toMatch(/^\d+%$/);
    // Legend labels (nav links share these words — scope to the legend spans).
    for (const anchor of ["Fasting", "Workout", "Tasks", "Goal"]) {
      await expect(page.locator("span.w-16", { hasText: anchor }).first()).toBeVisible();
    }

    // Streak cards are seeded correctly.
    await expect(page.getByText("1d", { exact: true }).first()).toBeVisible();

    // Week-in-review digest present.
    await expect(page.getByText("Week in review")).toBeVisible();
    await expect(page.getByText(/active days/)).toBeVisible();

    // Quick action: add a task from the hub → lands in todo store.
    await page.getByPlaceholder("+ Quick add task…").fill("From the hub");
    await page.keyboard.press("Enter");
    const todos = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:todos"))) ?? "[]");
    expect(todos.some((t: { text: string }) => t.text === "From the hub")).toBe(true);

    // Quick action: log goal metric.
    await page.getByPlaceholder(/\+ Log/).fill("2");
    await page.keyboard.press("Enter");
    const goal = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:goal"))) ?? "{}");
    expect(goal.metricByDay[today]).toBe(5);
  });

  test("all clear state: fresh seed shows 0% momentum and empty activity", async ({ page }) => {
    await seed(page);
    await page.goto("/trackers");
    await expect(page.getByText("0%", { exact: true })).toBeVisible();
    await expect(page.getByText("Start fast")).toBeVisible();
  });
});
