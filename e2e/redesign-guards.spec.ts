import { expect, test } from "@playwright/test";
import { seed, todayKey } from "./helpers";

/**
 * Redesign target-behaviour guards (2026-10-17 unified redesign).
 *
 * These pin the contract in docs/superpowers/specs/2026-10-17-unified-redesign-design.md.
 * They are expected to FAIL against the pre-redesign build and pass once the
 * corresponding phase lands:
 *   - shell/chrome parity + titles + breadcrumbs + honest empty states -> Phase 2
 *   - dock quick capture / search sheet                                  -> Phase 3
 *   - Today now/next card above the fold                                 -> Phase 4
 *   - Today timeline + weekly review + first-run setup card              -> Phase 4
 */

test.describe("redesign guards — chrome parity", () => {
  test("Add a record and Tools render inside the workspace rail", async ({
    page,
  }) => {
    await seed(page);
    for (const route of ["/log", "/more"]) {
      await page.goto(route);
      await expect(
        page.getByTestId("tracker-primary-nav"),
        `rail missing on ${route}`,
      ).toBeVisible();
    }
  });

  test("mobile dock stays available on Add a record", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/log");
    await expect(page.getByTestId("mobile-command-dock")).toBeVisible();
  });
});

test.describe("redesign guards — naming", () => {
  const titles: [string, RegExp][] = [
    ["/todo", /^Tasks$/],
    ["/goal", /^Goals$/],
    ["/food", /^Food$/],
    ["/workout-tracking", /^Workouts$/],
    ["/intermittent-fasting", /^Fasting & eating window$/],
    ["/weight-loss", /^Body & weight$/],
    ["/routine", /^Routine reminders$/],
    ["/archive", /^Library$/],
    ["/more", /^Tools$/],
  ];

  for (const [route, title] of titles) {
    test(`${route} page title matches its navigation label`, async ({
      page,
    }) => {
      await seed(page);
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(
        title,
      );
    });
  }

  const chapters: [string, string][] = [
    ["/todo", "Plan"],
    ["/goal", "Plan"],
    ["/food", "Health"],
    ["/workout-tracking", "Health"],
    ["/weight-loss", "Health"],
    ["/intermittent-fasting", "Health"],
    ["/routine", "Health"],
  ];

  for (const [route, chapter] of chapters) {
    test(`${route} shows its ${chapter} chapter breadcrumb`, async ({
      page,
    }) => {
      await seed(page);
      await page.goto(route);
      const crumb = page.getByTestId("chapter-breadcrumb");
      await expect(crumb).toBeVisible();
      await expect(crumb).toContainText(chapter);
    });
  }
});

test.describe("redesign guards — honest empty states", () => {
  for (const route of ["/todo", "/goal", "/workout-tracking", "/routine"]) {
    test(`${route} shows no negative progress boilerplate when empty`, async ({
      page,
    }) => {
      await seed(page);
      await page.goto(route);
      const main = page.locator("main");
      await expect(main).not.toContainText(/No completed (tasks|focus|study)/i);
      await expect(main).not.toContainText(/No recorded (energy|water)/i);
    });
  }
});

test.describe("redesign guards — progress strip removed", () => {
  for (const route of [
    "/todo",
    "/goal",
    "/food",
    "/health",
    "/weight-loss",
    "/workout-tracking",
    "/intermittent-fasting",
    "/routine",
    "/hub",
    "/plan",
    "/roadmap",
  ]) {
    test(`${route} renders no repeated progress strip`, async ({ page }) => {
      await seed(page);
      await page.goto(route);
      await expect(page.getByTestId("progress-lead")).toHaveCount(0);
    });
  }
});

test.describe("redesign guards — Tools directory", () => {
  test("Tools lists every Tools destination from the shared source", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/more");
    const links = page.getByTestId("more-links");
    for (const [label, href] of [
      ["Motivation", "/motivation"],
      ["Library", "/archive"],
      ["Sharing", "/share"],
      ["Settings", "/settings"],
    ] as const) {
      await expect(links.locator(`a[href="${href}"]`)).toContainText(label);
    }
  });
});

test.describe("redesign guards — lead became an honest summary", () => {
  test("Today adds a one-line focus summary when the day has a session", async ({
    page,
  }) => {
    const now = Date.now();
    await seed(page, {
      "vk:focus:sessions": [
        {
          id: "focus_guard",
          label: "Chapter 12",
          plannedMinutes: 25,
          startedAt: now - 25 * 60_000,
          endedAt: now,
          durationMinutes: 25,
          status: "completed",
          createdAt: now,
        },
      ],
    });
    await page.goto("/hub");
    await expect(page.getByTestId("page-summary")).toContainText("25 min");
  });
});

test.describe("redesign guards — capture affordances", () => {
  test("mobile dock offers quick add and search beside its destinations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    const dock = page.getByTestId("mobile-command-dock");
    await expect(dock).toBeVisible();
    // Five destinations stay.
    await expect(dock.getByRole("link")).toHaveCount(5);
    // Quick capture opens the sheet on the Add tab.
    await page.getByTestId("dock-quick-add").click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("tab", { name: "Add" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("header search opens the sheet on the Search tab", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    await page.getByTestId("header-search").click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await expect(sheet.getByRole("tab", { name: "Search" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("QuickSheet Add tab writes a glass of water immediately", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    await page.getByTestId("dock-quick-add").click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await sheet.getByRole("button", { name: "Water +1", exact: true }).click();
    await expect(sheet.getByRole("status")).toContainText("Water logged");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const store = JSON.parse(
            localStorage.getItem("vk:fasting:water") ?? "{}",
          ) as Record<string, number>;
          return Object.values(store).reduce((sum, value) => sum + value, 0);
        }),
      )
      .toBe(1);
  });

  test("QuickSheet restores focus to the affordance that opened it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    const opener = page.getByTestId("header-search");
    await opener.click();
    const sheet = page.getByRole("dialog", { name: /quick add and search/i });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});

test.describe("redesign guards — Today leads with the next action", () => {
  test("now/next card is visible in the first phone screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.goto("/hub");
    const next = page.getByTestId("today-next-action");
    await expect(next).toBeVisible();
    const box = await next.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(844);
  });
});

test.describe("redesign guards — Today timeline, weekly review and first-run setup", () => {
  test("timeline renders the day's plan, routine and active session", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-05T03:00:00Z") });
    await seed(page, {
      "vk:plan:blocks": {
        drafting: {
          id: "drafting",
          date: "2026-10-05",
          startLocal: "09:30",
          durationMinutes: 45,
          timeZone: "Asia/Kolkata",
          kind: "event",
          title: "Draft the case study",
          updatedAt: 1,
        },
      },
      "vk:routine:schedules": {
        vitamins: {
          id: "vitamins",
          label: "Take vitamin D",
          time: "10:00",
          days: [0, 1, 2, 3, 4, 5, 6],
          timezone: "Asia/Kolkata",
          enabled: true,
          type: "supplement",
          updatedAt: 1,
        },
      },
      "vk:focus:active": {
        id: "session",
        label: "Interview prep deep dive",
        startedAt: new Date("2026-10-05T02:50:00Z").getTime(),
        pausedMs: 0,
        plannedMinutes: 25,
      },
    });
    await page.goto("/hub");
    const agenda = page.getByTestId("day-agenda");
    await expect(agenda).toContainText("Draft the case study");
    await expect(agenda).toContainText("Take vitamin D");
    await expect(agenda.getByTestId("today-session-block")).toContainText(
      "Interview prep deep dive",
    );
  });

  test("Today lists three open tasks and counts the rest in Tasks", async ({
    page,
  }) => {
    const date = todayKey();
    const task = (
      id: string,
      text: string,
      priority: string,
      createdAt: number,
    ) => ({ id, text, done: false, date, priority, tag: "Work", createdAt });
    await seed(page, {
      "vk:todos": [
        task("t1", "Tune the timeline", "P1", 1),
        task("t2", "Reply to the recruiter", "P1", 2),
        task("t3", "Walk 30 minutes", "P2", 3),
        task("t4", "Read one chapter", "P2", 4),
      ],
    });
    await page.goto("/hub");
    const open = page.getByTestId("today-open-tasks");
    await expect(open.locator("li")).toHaveCount(3);
    await expect(open).toContainText("Tune the timeline");
    await expect(open).toContainText("Reply to the recruiter");
    await expect(open).toContainText("Walk 30 minutes");
    await expect(open).not.toContainText("Read one chapter");
    await expect(
      open.getByRole("link", { name: "1 more in Tasks", exact: true }),
    ).toHaveAttribute("href", "/todo");
  });

  test("weekly review saves one journal entry and next week's commitments", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-11T12:00:00+05:30") });
    await seed(page);
    await page.goto("/review");
    await expect(
      page.getByRole("heading", { name: "Weekly review", exact: true }),
    ).toBeVisible();
    // Typing before hydration is discarded by the controlled fields, so retry
    // the pair until both values stick.
    await expect(async () => {
      await page
        .getByLabel("What went well this week?")
        .fill("Shipped the timeline rebuild");
      await page
        .getByLabel("What did you learn this week?")
        .fill("Small sessions beat long plans");
      await expect(
        page.getByLabel("What went well this week?"),
      ).toHaveValue("Shipped the timeline rebuild", { timeout: 1000 });
      await expect(
        page.getByLabel("What did you learn this week?"),
      ).toHaveValue("Small sessions beat long plans", { timeout: 1000 });
    }).toPass();
    await page.getByRole("button", { name: "Save reflection" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Weekly reflection saved",
    );
    await expect(async () => {
      await page
        .getByLabel("First action for next week")
        .fill("Book two interview slots");
      await page.getByLabel("Commitment 2").fill("Ship the weekly review");
      await expect(
        page.getByLabel("First action for next week"),
      ).toHaveValue("Book two interview slots", { timeout: 1000 });
      await expect(page.getByLabel("Commitment 2")).toHaveValue(
        "Ship the weekly review",
        { timeout: 1000 },
      );
    }).toPass();
    await page.getByRole("button", { name: "Save next week" }).click();
    await expect(page.getByRole("status")).toContainText("Next week saved");
    const journal = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("vk:journal")!) as Record<
          string,
          { win: string; learned: string }
        >,
    );
    const keys = Object.keys(journal);
    expect(keys).toHaveLength(1);
    expect(journal[keys[0]].win).toBe("Shipped the timeline rebuild");
    expect(journal[keys[0]].learned).toBe("Small sessions beat long plans");
    const weekEnd = new Date(keys[0] + "T12:00:00Z");
    const nextMonday = new Date(weekEnd);
    nextMonday.setUTCDate(
      weekEnd.getUTCDate() - ((weekEnd.getUTCDay() + 6) % 7) + 7,
    );
    const weekOf = nextMonday.toISOString().slice(0, 10);
    const commitments = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("vk:goal")!).weeklyCommitments as Array<{
          text: string;
          weekOf: string;
          status: string;
        }>,
    );
    expect(commitments).toHaveLength(2);
    expect(commitments[0]).toMatchObject({
      text: "Book two interview slots",
      weekOf,
      status: "active",
    });
    expect(commitments[1]).toMatchObject({
      text: "Ship the weekly review",
      weekOf,
      status: "active",
    });
  });

  test("first-run setup card self-dismisses when its steps are complete", async ({
    page,
  }) => {
    await seed(page, {
      "vk:prefs": {
        name: "First Run",
        goalCategory: "general",
        goalTitle: "",
        workoutDaysPerWeek: 4,
        workoutSplit: "fullbody",
        weightUnit: "kg",
        fastingEnabled: true,
        fastingProtocolId: "16-8",
        motivationStyle: "discipline",
        motivationPersonalization: "goal",
        customSplitDays: [
          { id: "day-1", label: "Day 1" },
          { id: "day-2", label: "Day 2" },
          { id: "day-3", label: "Day 3" },
        ],
        questionnaireDone: false,
      },
    });
    await page.goto("/hub");
    const card = page.getByTestId("today-setup-card");
    await expect(card).toBeVisible();
    await expect(
      card.getByRole("link", { name: "Choose your modules", exact: true }),
    ).toHaveAttribute("href", "/settings#modules");
    await expect(
      card.getByRole("link", { name: "Turn on reminders", exact: true }),
    ).toHaveAttribute("href", "/settings#reminders");
    await page.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem("vk:prefs")!);
      localStorage.setItem(
        "vk:prefs",
        JSON.stringify({ ...prefs, goalCategory: "career" }),
      );
      localStorage.setItem(
        "vk:personal:modules",
        JSON.stringify({
          food: true,
          routine: true,
          study: true,
          recovery: false,
          habits: false,
          fasting: false,
          movement: true,
        }),
      );
      localStorage.setItem(
        "vk:reminders",
        JSON.stringify({
          weighIn: { enabled: false, time: "08:00" },
          focus: { enabled: false, time: "09:00" },
          evening: { enabled: false, time: "20:30" },
          career: {
            morning: { enabled: false, time: "07:00" },
            study: { enabled: false, time: "10:25" },
            roleResearch: { enabled: false, time: "12:25" },
            interview: { enabled: false, time: "17:25" },
            eveningReview: { enabled: false, time: "20:30" },
            windDown: { enabled: false, time: "21:30" },
          },
        }),
      );
    });
    await page.reload();
    await expect(card).toHaveCount(0);
    await page.reload();
    await expect(card).toHaveCount(0);
  });

  test("first-run setup card never appears for returning users", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/hub");
    await expect(page.getByTestId("today-setup-card")).toHaveCount(0);
  });
});
