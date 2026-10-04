import { expect, test } from "@playwright/test";
import { seed, daysAgoKey } from "./helpers";
import {
  getMotivationCategoryLabel,
  getMotivationRationale,
} from "../src/lib/motivation-media";

test("motivation media exposes destination-aware context", () => {
  expect(getMotivationCategoryLabel("relocation", "Germany")).toBe(
    "Germany relocation",
  );
  expect(getMotivationRationale("goal", "relocation", "Germany")).toContain(
    "Germany",
  );
});

test.describe("motivation", () => {
  test("legacy general preference still receives goal-aware inspiration without a preference rewrite", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/motivation-media"))
        requests.push(request.url());
    });
    await page.route("**/api/motivation-media**", (route) =>
      route.fulfill({ json: { quote: "Keep moving.", fetchedAt: Date.now() } }),
    );
    await seed(page, {
      "vk:prefs": {
        goalCategory: "relocation",
        goalCountry: "Canada",
        motivationPersonalization: "general",
        questionnaireDone: true,
      },
    });
    await page.goto("/motivation");
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(requests.at(-1)).toContain("source=goal");
    expect(requests.at(-1)).toContain("country=Canada");
    expect(
      JSON.parse((await page.evaluate(() => localStorage.getItem("vk:prefs")))!)
        .motivationPersonalization,
    ).toBe("general");
  });

  test("relocation media uses safe destination terms without raw goal text", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/motivation-media"))
        requests.push(request.url());
    });
    await page.route("**/api/motivation-media**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ quote: "Keep moving.", fetchedAt: Date.now() }),
      });
    });
    await seed(page, {
      "vk:prefs": {
        name: "Test User",
        goalCategory: "relocation",
        goalTitle: "Private title that must never leave the browser",
        goalCountry: "Germany",
        dailyMetricLabel: undefined,
        dailyMetricTarget: undefined,
        dailyMetricGoalTotal: undefined,
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
        questionnaireDone: true,
      },
    });
    await page.goto("/motivation");
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const url = requests.at(-1)!;
    expect(url).toContain("category=relocation");
    expect(url).toContain("country=Germany");
    expect(url).not.toContain("Private%20title");
    expect(url).not.toContain("Test%20User");
  });

  test("saved and personal reminders remain available in a compact dialog", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/motivation");
    await page
      .getByRole("button", { name: "Save reminder", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Unsave reminder", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Personal reminders", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Personal reminders" });
    await dialog
      .getByLabel("Your reminder", { exact: true })
      .fill("I am building a future I believe in.");
    await dialog
      .getByRole("button", { name: "Add reminder", exact: true })
      .click();
    await expect(
      dialog.getByText("I am building a future I believe in.", { exact: true }),
    ).toBeVisible();
    const values = await page.evaluate(() => ({
      favs: JSON.parse(localStorage.getItem("vk:motivation:favs")!),
      custom: JSON.parse(localStorage.getItem("vk:motivation:custom")!),
    }));
    expect(values.favs).toHaveLength(1);
    expect(values.custom[0].text).toBe("I am building a future I believe in.");
    await page.reload();
    await page
      .getByRole("button", { name: "Personal reminders", exact: true })
      .click();
    await expect(
      dialog.getByText("I am building a future I believe in.", { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", {
        name: "Remove personal reminder: I am building a future I believe in.",
        exact: true,
      })
      .click();
    await expect(
      dialog.getByText("I am building a future I believe in.", { exact: true }),
    ).toHaveCount(0);
  });
});

test.describe("settings: backup, restore, wipe", () => {
  test("export produces a valid suite backup; import round-trips it", async ({
    page,
  }) => {
    await seed(page, {
      "vk:todos": [
        {
          id: "e1",
          text: "Back me up",
          done: false,
          date: daysAgoKey(0),
          priority: "P1",
          tag: "Work",
          createdAt: 1,
        },
      ],
    });
    await page.goto("/settings");

    // Capture the download and its content.
    const downloadP = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export full backup/ }).click();
    const download = await downloadP;
    const path = await download.path();
    const fs = await import("node:fs/promises");
    const backup = JSON.parse((await fs.readFile(path!)).toString("utf8"));
    expect(backup.app).toBe("vk-tracker-suite");
    expect(backup.data.todos).toHaveLength(1);
    expect(backup.data.prefs.questionnaireDone).toBe(true);

    // Mutate, then import the backup back.
    await page.evaluate(() => window.localStorage.removeItem("vk:todos"));
    const chooserP = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Import backup/ }).click();
    const chooser = await chooserP;
    await chooser.setFiles(path!);

    await expect(page.getByText(/Restored \d+ keys/)).toBeVisible();
    const todos = JSON.parse(
      (await page.evaluate(() => window.localStorage.getItem("vk:todos"))) ??
        "[]",
    );
    expect(todos[0].text).toBe("Back me up");
  });

  test("import rejects foreign JSON", async ({ page }) => {
    await seed(page);
    await page.goto("/settings");
    const chooserP = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Import backup/ }).click();
    const chooser = await chooserP;
    await chooser.setFiles({
      name: "not-a-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ hello: "world" })),
    });
    await expect(
      page.getByText("Import failed", { exact: true }),
    ).toBeVisible();
  });

  test("danger zone requires typing CLEAR and wipes the namespace", async ({
    page,
  }) => {
    await seed(page, {
      "vk:todos": [
        {
          id: "w1",
          text: "Doomed",
          done: false,
          date: daysAgoKey(0),
          priority: "P2",
          tag: "Work",
          createdAt: 1,
        },
      ],
    });
    await page.goto("/settings");

    const wipeBtn = page.getByRole("button", { name: "Clear local data" });
    await expect(wipeBtn).toBeDisabled();
    await page.getByPlaceholder("CLEAR").fill("CLEAR");
    await wipeBtn.click();

    const todos = await page.evaluate(() =>
      window.localStorage.getItem("vk:todos"),
    );
    expect(todos).toBeNull();
  });
});
