import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("personal roadmap", () => {
  test("keeps the hub canonical while tracker pages return to it", async ({ page }) => {
    await seed(page);

    await page.goto("/hub");
    await expect(page.getByRole("heading", { name: /welcome back|command center/i })).toBeVisible();
    await expect(page.locator(".dossier-back-link")).toHaveCount(0);

    await page.goto("/todo");
    await expect(page.getByTestId("chapter-header").getByRole("link", { name: "Hub" })).toHaveAttribute("href", "/hub");

    await page.goto("/trackers");
    await expect(page.getByRole("heading", { name: /welcome back|command center/i })).toBeVisible();

    const manifest = await page.request.get("/manifest.webmanifest");
    expect(await manifest.json()).toMatchObject({ start_url: "/hub" });
  });

  test("records a daily weigh-in and surfaces the weight-loss tracker", async ({ page }) => {
    await seed(page, {
      "vk:prefs": {
        name: "Test User",
        goalCategory: "weightloss",
        goalTitle: "Reach 75 kg",
        weightUnit: "kg",
        fastingEnabled: true,
        fastingProtocolId: "16-8",
        workoutDaysPerWeek: 4,
        workoutSplit: "fullbody",
        motivationStyle: "health",
        motivationPersonalization: "goal",
        customSplitDays: [],
        questionnaireDone: true,
      },
    });

    await page.goto("/weight-loss");
    await expect(page.getByRole("heading", { name: /weight loss/i })).toBeVisible();
    await page.getByLabel(/today'?s weight/i).fill("82.4");
    await page.getByRole("button", { name: /save weigh-in/i }).click();
    await expect(page.getByRole("heading", { name: "Logged 82.4 kg" })).toBeVisible();

    await page.goto("/hub");
    await expect(page.getByTestId("command-rail").getByRole("link", { name: "Weight Loss" })).toBeVisible();
    await expect(page.getByTestId("action-queue").getByText("Daily weigh-in recorded")).toBeVisible();
  });

  test("keeps the mobile hub focused with a world clock strip and a single momentum ring", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");

    await expect(page.getByTestId("world-clock-strip")).toContainText("Munich");
    await expect(page.getByTestId("world-clock-strip")).toContainText("San Francisco");
    await expect(page.getByRole("img", { name: /daily momentum/i })).toBeVisible();
    await expect(page.getByTestId("command-center-brief")).toBeVisible();
    await expect(page.getByTestId("mobile-command-dock").getByRole("link")).toHaveCount(5);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("captures and retrieves a private archive item", async ({ page }) => {
    await seed(page);
    await page.goto("/archive");

    await page.getByLabel("Capture").fill("A useful visa checklist from Berlin");
    await page.getByLabel("Tags").fill("relocation, visa");
    await page.getByRole("button", { name: /save to archive/i }).click();
    await expect(page.getByText("A useful visa checklist from Berlin")).toBeVisible();

    await page.getByLabel("Search archive").fill("Berlin");
    await expect(page.getByText("A useful visa checklist from Berlin")).toBeVisible();
  });

  test("links archive items to the active goal and previews image references", async ({ page }) => {
    await seed(page, { "vk:prefs": { name: "Test User", goalCategory: "relocation", goalTitle: "Relocate to Germany", weightUnit: "kg", questionnaireDone: true } });
    await page.goto("/archive");

    await page.getByRole("button", { name: /image/i }).click();
    await page.getByLabel("Capture").fill("Berlin relocation moodboard");
    await page.getByLabel("Source URL").fill("https://images.unsplash.com/photo-1467269204594-9661b134dd2b");
    await page.getByRole("button", { name: /save to archive/i }).click();
    await expect(page.getByRole("img", { name: /berlin relocation moodboard/i })).toBeVisible();
    await expect(page.getByRole("listitem").getByText("Relocation", { exact: true })).toBeVisible();

    await page.getByRole("group", { name: "Archive scope" }).getByRole("button", { name: "Relocation", exact: true }).click();
    await expect(page.getByText("Berlin relocation moodboard")).toBeVisible();
  });

  test("keeps a broken archive image reference understandable", async ({ page }) => {
    await seed(page, {
      "vk:prefs": { name: "Test User", goalCategory: "relocation", goalTitle: "Relocate to Germany", weightUnit: "kg", questionnaireDone: true },
      "vk:archive:items": [{ id: "broken-image", body: "Old image reference", kind: "image", tags: [], sourceUrl: "https://images.unsplash.com/not-found", goalCategory: "relocation", pinned: false, createdAt: Date.now() }],
    });
    await page.goto("/archive");
    await expect(page.getByRole("img", { name: /old image reference image unavailable/i })).toBeVisible();
  });

  test("shows a recovery cue when the active weight-loss goal needs a check-in", async ({ page }) => {
    await seed(page, {
      "vk:prefs": { name: "Test User", goalCategory: "weightloss", goalTitle: "Reach 75 kg", weightUnit: "kg", questionnaireDone: true },
      "vk:weight-loss": { entries: {}, recoveryByDay: {} },
    });
    await page.goto("/hub");
    await expect(page.getByTestId("recovery-cue")).toContainText(/recovery check-in/i);
    await expect(page.getByTestId("recovery-cue").getByRole("link")).toHaveAttribute("href", "/weight-loss");
  });

  test("offers recovery after an incomplete weekly commitment", async ({ page }) => {
    await seed(page, {
      "vk:prefs": { name: "Test User", goalCategory: "relocation", goalTitle: "Relocate to Germany", weightUnit: "kg", questionnaireDone: true },
      "vk:goal": { metricByDay: {}, milestonesByCategory: {}, weeklyCommitment: { text: "Finish visa paperwork", weekOf: "2020-01-06" } },
    });
    await page.goto("/goal");
    await expect(page.getByTestId("weekly-review")).toContainText("Finish visa paperwork");
    await page.getByRole("button", { name: /carry forward/i }).click();
    await expect(page.getByText(/carried forward/i)).toBeVisible();
  });

  test("saves opt-in reminder preferences without requiring push infrastructure", async ({ page }) => {
    await seed(page);
    await page.goto("/settings");

    await page.getByLabel("Weigh-in reminder").check();
    await page.getByLabel("Weigh-in time").fill("08:15");
    await page.getByRole("button", { name: /save reminders/i }).click();
    await expect(page.getByText("Reminders saved", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vk:reminders") ?? "{}"))).toMatchObject({ weighIn: { enabled: true, time: "08:15" } });
  });

  test("turns the goal roadmap into a weekly commitment", async ({ page }) => {
    await seed(page);
    await page.goto("/goal");

    await page.getByLabel("Weekly commitment").fill("Contact three Berlin hiring managers");
    await page.getByRole("button", { name: /save weekly commitment/i }).click();
    await expect(page.getByText("Contact three Berlin hiring managers")).toBeVisible();
  });

  test("keeps the hub within the viewport at supported mobile widths", async ({ page }) => {
    await seed(page);
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/hub");
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
});
