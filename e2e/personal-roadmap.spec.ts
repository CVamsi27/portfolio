import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("personal roadmap", () => {
  test("keeps the hub canonical while tracker pages return to it", async ({
    page,
  }) => {
    await seed(page);

    await page.goto("/hub");
    await expect(
      page.getByTestId("today-header").getByRole("heading"),
    ).toBeVisible();
    await expect(page.locator(".dossier-back-link")).toHaveCount(0);

    await page.goto("/todo");
    await expect(
      page.getByTestId("chapter-header").getByRole("link", { name: "Today" }),
    ).toHaveAttribute("href", "/hub");

    await page.goto("/trackers");
    await expect(
      page.getByTestId("today-header").getByRole("heading"),
    ).toBeVisible();

    const manifest = await page.request.get("/manifest.webmanifest");
    expect(await manifest.json()).toMatchObject({ start_url: "/hub" });
  });

  test("records a daily weigh-in and surfaces the weight-loss tracker", async ({
    page,
  }) => {
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
    await expect(
      page.getByRole("heading", { name: /body and weight/i }),
    ).toBeVisible();
    await page.getByLabel(/today'?s weight/i).fill("82.4");
    await page.getByRole("button", { name: /save weigh-in/i }).click();
    await expect(
      page.getByRole("heading", { name: "Logged 82.4 kg" }),
    ).toBeVisible();

    await page.goto("/hub");
    await page.goto("/health");
    await expect(page.getByRole("link", { name: /Body/ })).toHaveAttribute(
      "href",
      "/weight-loss",
    );
    expect(
      await page.evaluate(
        () =>
          Object.values(
            JSON.parse(localStorage.getItem("vk:weight-loss")!).entries,
          )[0],
      ),
    ).toMatchObject({ weightKg: 82.4 });
  });

  test("keeps the mobile hub focused with compact clocks and a progress rail", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");

    await expect(
      page.getByTestId("today-header").getByTestId("world-clock-strip"),
    ).toContainText("Munich");
    await expect(
      page.getByTestId("today-header").getByTestId("world-clock-strip"),
    ).toContainText("San Francisco");
    await expect(page.getByTestId("progress-rail")).toHaveCount(0);
    await expect(page.getByTestId("next-move-card")).toBeVisible();
    await expect(page.getByTestId("up-next-lane")).toHaveCount(0);
    await expect(page.getByTestId("next-move-card")).not.toContainText(
      /meal window|concrete job offer|about 10 min/i,
    );
    await expect(page.getByTestId("clock-disclosure")).toBeVisible();
    await expect(
      page.getByTestId("mobile-command-dock").getByRole("link"),
    ).toHaveCount(5);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });

  test("captures and retrieves a private archive item", async ({ page }) => {
    await seed(page);
    await page.goto("/archive");

    await page
      .getByLabel("Capture", { exact: true })
      .fill("A useful visa checklist from Berlin");
    await page.getByLabel("Tags").fill("relocation, visa");
    await page.getByRole("button", { name: /save to library/i }).click();
    await expect(
      page.getByText("A useful visa checklist from Berlin"),
    ).toBeVisible();

    await page.getByLabel("Search library").fill("Berlin");
    await expect(
      page.getByText("A useful visa checklist from Berlin"),
    ).toBeVisible();
  });

  test("links archive items to the active goal and previews image references", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        name: "Test User",
        goalCategory: "relocation",
        goalTitle: "Relocate to Germany",
        weightUnit: "kg",
        questionnaireDone: true,
      },
    });
    await page.goto("/archive");

    await page.getByRole("button", { name: /image/i }).click();
    await page
      .getByLabel("Capture", { exact: true })
      .fill("Berlin relocation moodboard");
    await page
      .getByLabel("Source URL")
      .fill("https://images.unsplash.com/photo-1467269204594-9661b134dd2b");
    await page.getByRole("button", { name: /save to library/i }).click();
    await expect(
      page.getByRole("img", { name: /berlin relocation moodboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("listitem").getByText("Relocation", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("group", { name: "Library scope" })
      .getByRole("button", { name: "Relocation", exact: true })
      .click();
    await expect(page.getByText("Berlin relocation moodboard")).toBeVisible();
  });

  test("keeps a broken archive image reference understandable", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        name: "Test User",
        goalCategory: "relocation",
        goalTitle: "Relocate to Germany",
        weightUnit: "kg",
        questionnaireDone: true,
      },
      "vk:archive:items": [
        {
          id: "broken-image",
          body: "Old image reference",
          kind: "image",
          tags: [],
          sourceUrl: "https://images.unsplash.com/not-found",
          goalCategory: "relocation",
          pinned: false,
          createdAt: Date.now(),
        },
      ],
    });
    await page.goto("/archive");
    await expect(
      page.getByRole("img", { name: /old image reference image unavailable/i }),
    ).toBeVisible();
  });

  test("shows a recovery cue when the active weight-loss goal needs a check-in", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        name: "Test User",
        goalCategory: "weightloss",
        goalTitle: "Reach 75 kg",
        weightUnit: "kg",
        questionnaireDone: true,
      },
      "vk:weight-loss": { entries: {}, recoveryByDay: {} },
    });
    await page.goto("/health");
    await page.getByText("Recovery · optional daily check-in").click();
    await expect(page.getByLabel("Sleep duration (hours)")).toBeVisible();
  });

  test("offers recovery after an incomplete weekly commitment", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        name: "Test User",
        goalCategory: "relocation",
        goalTitle: "Relocate to Germany",
        weightUnit: "kg",
        questionnaireDone: true,
      },
      "vk:goal": {
        metricByDay: {},
        milestonesByCategory: {},
        weeklyCommitment: {
          text: "Finish visa paperwork",
          weekOf: "2020-01-06",
        },
      },
    });
    await page.goto("/goal");
    await expect(page.getByTestId("weekly-review")).toContainText(
      "Finish visa paperwork",
    );
    await page.getByRole("button", { name: /carry forward/i }).click();
    await expect(page.getByText(/carried forward/i)).toBeVisible();
  });

  test("saves opt-in reminder preferences without requiring push infrastructure", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/settings");

    await page.getByLabel("Weigh-in reminder").check();
    await page.getByLabel("Weigh-in time").fill("08:15");
    await page.getByRole("button", { name: /save reminders/i }).click();
    await expect(
      page.getByText("Reminders saved", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("vk:reminders") ?? "{}"),
      ),
    ).toMatchObject({ weighIn: { enabled: true, time: "08:15" } });
  });

  test("requires evidence and a separate verification step for roadmap completion", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-09-30T10:00:00+05:30") });
    await seed(page, {
      "vk:career_execution_state": {
        version: 1,
        evidenceByItemId: {},
        archivedItems: [],
      },
    });
    await page.goto("/roadmap");
    await expect(page.getByText("Study in this order")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Execution Context" }),
    ).toHaveAttribute(
      "href",
      /study\.buildora\.work\/10-frontend\/10\.1-javascript/,
    );
    await page.getByText("How to complete this task").first().click();
    await expect(
      page.getByText(
        "For each chapter, write its invariant, one small example, and one failure mode.",
      ),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: /write concise notes for chosen role-relevant chapters/i,
      })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "At least 5 accurate ideas",
    );
    await page
      .getByPlaceholder(/add your notes/i)
      .fill(
        "Five key ideas: closures, lexical scope, stack frames, hoisting, and temporal dead zones. Open question: how do module scopes differ?",
      );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Save evidence" })
      .click();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:career_execution_state") ?? "{}"),
    );
    expect(Object.keys(saved.evidenceByItemId)).toHaveLength(1);
    expect(
      saved.evidenceByItemId[Object.keys(saved.evidenceByItemId)[0]].verifiedAt,
    ).toBeUndefined();
    await page
      .getByRole("button", {
        name: /write concise notes for chosen role-relevant chapters/i,
      })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Verify saved evidence" })
      .click();
    const verified = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vk:career_execution_state") ?? "{}"),
    );
    expect(
      verified.evidenceByItemId[Object.keys(verified.evidenceByItemId)[0]]
        .verifiedAt,
    ).toBeTruthy();
  });

  test("shows career reminders in IST while the app is open", async ({
    page,
  }) => {
    await seed(page, {
      "vk:reminders": {
        ...{
          weighIn: { enabled: false, time: "08:00" },
          focus: { enabled: false, time: "09:00" },
          evening: { enabled: false, time: "20:30" },
        },
        career: {
          morning: { enabled: true, time: "07:00" },
          study: { enabled: false, time: "10:25" },
          roleResearch: { enabled: false, time: "12:25" },
          interview: { enabled: false, time: "17:25" },
          eveningReview: { enabled: false, time: "20:30" },
          windDown: { enabled: false, time: "21:30" },
        },
      },
    });
    await page.clock.install({ time: new Date("2026-09-30T01:30:00.000Z") });
    await page.goto("/hub");
    await expect(page.getByRole("status")).toContainText(
      "Exercise and freshen up",
    );
  });

  test("turns the goal roadmap into a weekly commitment", async ({ page }) => {
    await seed(page);
    await page.goto("/goal");

    await page
      .getByLabel("Weekly commitment")
      .fill("Contact three Berlin hiring managers");
    await page.getByRole("button", { name: /save weekly commitment/i }).click();
    await expect(
      page.getByText("Contact three Berlin hiring managers"),
    ).toBeVisible();
  });

  test("keeps the hub within the viewport at supported mobile widths", async ({
    page,
  }) => {
    await seed(page);
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/hub");
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
  });
});
