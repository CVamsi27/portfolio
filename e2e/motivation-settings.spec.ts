import { expect, test } from "@playwright/test";
import { seed, daysAgoKey } from "./helpers";

test.describe("motivation", () => {
  test("quote deck shuffles + favorites persist", async ({ page }) => {
    await seed(page);
    await page.goto("/motivation");

    // Quote of the day renders with its category badge.
    await expect(page.getByText(/Quote of the day · /)).toBeVisible();

    // Favorite it → button flips to "Saved" and the fav is stored.
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeVisible();
    const favs = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:motivation:favs"))) ?? "[]");
    expect(favs.length).toBe(1);

    // Shuffle keeps a quote on screen.
    await page.getByRole("button", { name: "Shuffle" }).click();
    await expect(page.locator("blockquote")).toBeVisible();

    // Custom affirmation via the modal.
    await page.getByRole("button", { name: "Add", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("I show up for the hard things first…").fill("I ship every single day.");
    await dialog.getByRole("button", { name: "Add to deck" }).click();
    // Scope to the affirmations list — the text may also surface as the
    // quote of the day once it joins the deck.
    await expect(page.locator("li").filter({ hasText: "I ship every single day." })).toBeVisible();
    const custom = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:motivation:custom"))) ?? "[]");
    expect(custom.some((q: { text: string }) => q.text === "I ship every single day.")).toBe(true);
  });

  test("daily micro-journal saves three prompts per date", async ({ page }) => {
    await seed(page);
    await page.goto("/motivation");

    // Targets are the placeholder texts (labels aren't programmatically associated).
    await page.getByPlaceholder(/auth flow/).fill("Shipped the E2E suite");
    await page.getByPlaceholder(/RSC hydration/).fill("How Playwright seeding works");
    await page.getByPlaceholder(/set logger/).fill("Fix any flaky tests");
    await page.getByRole("button", { name: "Save reflection" }).click();
    await expect(page.getByText("Saved ✓")).toBeVisible();

    const journal = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:journal"))) ?? "{}");
    const today = daysAgoKey(0);
    expect(journal[today]?.win).toContain("Shipped the E2E suite");
    expect(journal[today]?.focus).toContain("Fix any flaky tests");
  });

  test("visit streak counts consecutive days", async ({ page }) => {
    const day = (i: number) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    };
    await seed(page, {
      "vk:motivation:visits": { [day(0)]: 1, [day(1)]: 2, [day(2)]: 1, [day(4)]: 1 },
    });
    await page.goto("/motivation");
    // The "Day streak" stat tile shows the consecutive count (3 — day 4 breaks it).
    const value = page.getByText("Day streak").locator("xpath=following-sibling::p[1]");
    await expect(value).toHaveText("3");
  });
});

test.describe("settings: backup, restore, wipe", () => {
  test("export produces a valid suite backup; import round-trips it", async ({ page }) => {
    await seed(page, {
      "vk:todos": [
        { id: "e1", text: "Back me up", done: false, date: daysAgoKey(0), priority: "P1", tag: "Work", createdAt: 1 },
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
    const todos = JSON.parse((await page.evaluate(() => window.localStorage.getItem("vk:todos"))) ?? "[]");
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
    await expect(page.getByText("Import failed")).toBeVisible();
  });

  test("danger zone requires typing CLEAR and wipes the namespace", async ({ page }) => {
    await seed(page, {
      "vk:todos": [
        { id: "w1", text: "Doomed", done: false, date: daysAgoKey(0), priority: "P2", tag: "Work", createdAt: 1 },
      ],
    });
    await page.goto("/settings");

    const wipeBtn = page.getByRole("button", { name: "Clear local data" });
    await expect(wipeBtn).toBeDisabled();
    await page.getByPlaceholder("CLEAR").fill("CLEAR");
    await wipeBtn.click();

    const todos = await page.evaluate(() => window.localStorage.getItem("vk:todos"));
    expect(todos).toBeNull();
  });
});
