import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

test("the selected week date stays visible on narrow phones and after resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await seed(page);
  await page.goto("/hub?date=2026-10-11");
  const week = page.getByRole("navigation", { name: "Week dates" });
  const selected = week.locator('[aria-pressed="true"]');
  const selectedIsVisible = async () => {
    const [strip, day] = await Promise.all([
      week.boundingBox(),
      selected.boundingBox(),
    ]);
    return Boolean(
      strip &&
        day &&
        day.x >= strip.x &&
        day.x + day.width <= strip.x + strip.width,
    );
  };
  await expect(selected).toHaveAccessibleName("Sunday, October 11, 2026");
  await expect.poll(selectedIsVisible).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 320, height: 844 });
  await expect.poll(selectedIsVisible).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Today", exact: true }),
  ).toBeInViewport();
});

test("Tools dialogs return focus and release background isolation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/hub");
  const tools = page.getByRole("button", { name: "Tools menu" });
  for (const [item, dialog] of [
    ["Add a record", "Add a record"],
    ["Search or run command", "Command Palette"],
    ["Keyboard shortcuts", "Keyboard Shortcuts"],
  ]) {
    await tools.click();
    await page.getByRole("menuitem", { name: item, exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: dialog, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(tools).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
  }
  await page.getByRole("button", { name: "Choose date" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Choose date" })
      .getByRole("button", { name: "Close", exact: true }),
  ).toBeFocused();
});

test("daily recording retains selected-date capture and undo from its disclosure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const date = "2026-10-04";
  await page.clock.install({ time: new Date("2026-10-04T09:00:00+05:30") });
  await seed(page, {
    "vk:plan:blocks": Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [
        String(i),
        {
          id: String(i),
          date,
          startLocal: `${String(9 + i).padStart(2, "0")}:00`,
          durationMinutes: 30,
          kind: "event",
          title: `Commitment ${i + 1}`,
          timeZone: "Asia/Kolkata",
          updatedAt: 1,
        },
      ]),
    ),
  });
  await page.goto(`/hub?date=${date}`);
  await expect(page.getByTestId("day-agenda")).toContainText("Commitment 10");
  await page
    .locator("summary")
    .filter({ hasText: /^Add a record$/ })
    .click();
  const actions = page.getByRole("group", { name: "Daily recording actions" });
  await expect(actions.getByRole("button", { name: "Water +1" })).toBeVisible();
  await actions.getByRole("button", { name: "Water +1" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:fasting:water")!)["2026-10-04"],
    ),
  ).toBe(1);
  await actions.getByRole("button", { name: "Undo water" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("vk:fasting:water")!)["2026-10-04"],
    ),
  ).toBe(0);
});

test("Today and Plan omit the queue while Tasks retains capture and scheduling", async ({
  page,
}) => {
  await seed(page);
  for (const route of ["/hub", "/plan"]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: "Unscheduled tasks", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(".task-queue-panel")).toHaveCount(0);
  }
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page
    .getByRole("textbox", { name: "New task", exact: true })
    .fill("A clear first step");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByText("A clear first step", { exact: true }),
  ).toBeVisible();
  await page.locator(".workspace-action-menu").first().click();
  await page.getByRole("menuitem", { name: "Schedule", exact: true }).click();
  await expect(
    page
      .getByRole("combobox", { name: "Link task", exact: true })
      .locator("option:checked"),
  ).toHaveText("A clear first step");
});

test("Health keeps food capture beside its record with the selected date and return path", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/health?date=2026-10-03");
  const food = page
    .locator(".health-record-list li")
    .filter({ has: page.getByText("Food", { exact: true }) });
  await expect(food).toContainText("No food logged");
  await food.getByRole("link", { name: "Add food", exact: true }).click();
  await expect(page).toHaveURL(/type=food&date=2026-10-03/);
  await expect(
    page.getByRole("link", { name: "Return to previous page", exact: true }),
  ).toHaveAttribute("href", "/health?date=2026-10-03");
});
