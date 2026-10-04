import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

test("daily recording is reachable before a long agenda without scrolling", async ({
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
  const actions = page.getByRole("group", { name: "Daily recording actions" });
  await expect(
    actions.getByRole("button", { name: "Water +1" }),
  ).toBeInViewport();
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

test("empty Today omits an empty task panel while Plan keeps task capture", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/hub");
  await expect(
    page.getByRole("heading", { name: "Tasks to do", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("No unscheduled tasks. Add one when you need it."),
  ).toHaveCount(0);
  await page.goto("/plan");
  await expect(
    page.getByRole("heading", { name: "Tasks to do", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add task", exact: true }).click();
  await page
    .getByLabel("Task name", { exact: true })
    .fill("A clear first step");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page.goto("/hub");
  await expect(
    page.getByRole("heading", { name: "Tasks to do", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".unscheduled-list")).toContainText(
    "A clear first step",
  );
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
