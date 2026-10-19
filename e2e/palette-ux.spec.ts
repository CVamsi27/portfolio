import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

async function open(page: import("@playwright/test").Page, route: string) {
  await page.goto(route);
  if (route === "/") {
    await page
      .getByRole("button", { name: "Command Palette (⌘K)", exact: true })
      .click();
  } else {
    const direct = page
      .getByTestId("command-rail")
      .getByRole("button", { name: "Search", exact: true });
    if (await direct.isVisible()) await direct.click();
    else {
      await page
        .getByRole("button", { name: "Tools menu", exact: true })
        .click();
      await page
        .getByRole("menuitem", { name: "Search or run command", exact: true })
        .click();
    }
  }
  return page.getByRole("dialog", { name: "Command Palette", exact: true });
}

test("workspace search discovers Tasks and Career roadmap", async ({
  page,
}) => {
  await seed(page);
  let palette = await open(page, "/hub");
  await palette.getByLabel("Search commands").fill("tasks");
  await palette.getByRole("option", { name: /^Tasks/ }).click();
  await expect(page).toHaveURL(/\/todo$/);
  palette = await open(page, "/todo");
  await palette.getByLabel("Search commands").fill("roadmap");
  await palette.getByRole("option", { name: /^Career roadmap/ }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
});

test("portfolio search exposes keyboard selection and keeps it visible", async ({
  page,
}) => {
  const palette = await open(page, "/");
  const search = palette.getByRole("combobox", { name: "Search commands" });
  await expect(search).toHaveAttribute("aria-expanded", "true");
  for (let i = 0; i < 10; i++) await search.press("ArrowDown");
  const selected = palette.getByRole("option", { selected: true });
  await expect(selected).toHaveCount(1);
  await expect(selected).toBeInViewport();
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    (await selected.getAttribute("id"))!,
  );
  const close = palette.getByRole("button", { name: "Close command palette" });
  await close.focus();
  await close.press("Tab");
  await expect(search).toBeFocused();
});

test("Enter on the workspace close button never executes a result", async ({
  page,
}) => {
  await seed(page);
  const palette = await open(page, "/hub");
  await palette.getByLabel("Search commands").fill("Start New Fast");
  const close = palette.getByRole("button", { name: "Close command palette" });
  await close.focus();
  await close.press("Enter");
  await expect(palette).toBeHidden();
  await expect(page).toHaveURL(/\/hub$/);
  const fast = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:fasting") ?? "null"),
  );
  expect(fast.startedAt).toBeNull();
});

test("Enter on Clear query keeps portfolio search open", async ({ page }) => {
  const palette = await open(page, "/");
  await palette.getByLabel("Search commands").fill("resume");
  await palette.getByRole("button", { name: "Clear query" }).press("Enter");
  await expect(palette).toBeVisible();
  await expect(palette.getByLabel("Search commands")).toHaveValue("");
});

test("ending a fast through search preserves its session", async ({ page }) => {
  const start = Date.now() - 7200000;
  await seed(page, {
    "vk:fasting": { protocolId: "16-8", phase: "fasting", startedAt: start },
  });
  const palette = await open(page, "/hub");
  await palette.getByLabel("Search commands").fill("End Current Fast");
  await palette.getByLabel("Search commands").press("Enter");
  await expect(page).toHaveURL(/\/intermittent-fasting$/);
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("vk:fasting:history") ?? "[]"),
  );
  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({
    start,
    protocolId: "16-8",
    source: "timer",
  });
});

test("phone search is available by touch and fits a short screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await seed(page);
  // The portfolio keeps the palette on phones.
  const palette = await open(page, "/");
  const close = palette.getByRole("button", {
    name: "Close command palette",
  });
  await expect(close).toBeInViewport();
  await expect(palette.getByRole("combobox")).toBeInViewport();
  expect(
    await palette.evaluate((el) =>
      Array.from(el.querySelectorAll("div")).every(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
    ),
  ).toBe(true);
  const bounds = await palette.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(450);
  await close.click();
  await expect(palette).toBeHidden();

  // The workspace phone surface is the QuickSheet, opened on Search.
  await page.goto("/hub");
  await page.getByRole("button", { name: "Tools menu", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Search or run command", exact: true })
    .click();
  const sheet = page.getByRole("dialog", { name: /quick add and search/i });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("tab", { name: "Search" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const sheetClose = sheet.getByRole("button", { name: "Close", exact: true });
  await expect(sheetClose).toBeInViewport();
  await expect(sheet.getByRole("combobox")).toBeInViewport();
  expect(
    await sheet.evaluate((el) =>
      Array.from(el.querySelectorAll("div")).every(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
    ),
  ).toBe(true);
  const sheetBounds = await sheet.boundingBox();
  expect(sheetBounds!.x).toBeGreaterThanOrEqual(0);
  expect(sheetBounds!.x + sheetBounds!.width).toBeLessThanOrEqual(320);
  expect(sheetBounds!.y + sheetBounds!.height).toBeLessThanOrEqual(450);
  await sheetClose.click();
  await expect(sheet).toHaveCount(0);
});
