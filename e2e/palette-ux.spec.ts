import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

async function open(page: import("@playwright/test").Page, route: string) {
  await page.goto(route);
  if (route === "/") {
    await page.getByRole("button", { name: "Command Palette (⌘K)", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "More options", exact: true }).click();
    await page.getByRole("menuitem", { name: "Search or run command" }).click();
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
  for (const route of ["/", "/hub"]) {
    const palette = await open(page, route);
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
  }
});
