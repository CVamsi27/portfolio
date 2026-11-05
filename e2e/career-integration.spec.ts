import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
import { careerRole, contractRole } from "./career-workflow-fixture";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-05T04:00:00Z"));
});

test("Today leads with specific career actions and opens the selected opportunity", async ({
  page,
}) => {
  await seed(page, {
    "vk:career:research": {
      [careerRole.id]: careerRole,
      [contractRole.id]: contractRole,
    },
  });
  await page.goto("/hub?date=2026-11-05");
  const actions = page.getByRole("region", { name: "Career next actions" });
  await expect(actions).toBeVisible();
  await expect(actions.getByText("Sample Company").first()).toBeVisible();
  await actions
    .getByRole("link", { name: "Open opportunity", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(
        JSON.parse(localStorage.getItem("vk:career:activities") ?? "{}"),
      ),
    ),
  ).toHaveLength(0);
});

test("no-plan Plan uses six-hour weekday blocks without requiring study module", async ({
  page,
}) => {
  await seed(page, {
    "vk:personal:modules": { study: false, routine: false, health: true },
  });
  await page.goto("/plan?date=2026-11-05");
  await expect(
    page.getByText("Applications and hiring replies", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText("Contracts and referral conversations", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText("32 hours per full week", { exact: false }),
  ).toBeVisible();
  await page.goto("/plan?date=2026-11-08");
  await expect(
    page.getByText("Applications and hiring replies", { exact: true }),
  ).toHaveCount(0);
});

test("Progress reports recorded career outcomes and separates currencies", async ({
  page,
}) => {
  const event = {
    opportunityId: careerRole.id,
    date: "2026-11-05",
    reference: "A real receipt reference",
    note: "Recorded outcome",
    updatedAt: 100,
  };
  await seed(page, {
    "vk:career:activities": {
      application: { ...event, id: "application", kind: "application" },
      usd: {
        ...event,
        id: "usd",
        kind: "payment",
        amount: 120,
        currency: "USD",
      },
      inr: {
        ...event,
        id: "inr",
        kind: "payment",
        amount: 5000,
        currency: "INR",
      },
    },
  });
  await page.goto("/dashboard?date=2026-11-05");
  const summary = page.getByRole("region", { name: "Career outcomes" });
  await expect(summary).toContainText("Applications");
  await expect(summary).toContainText("USD");
  await expect(summary).toContainText("INR");
  await expect(
    summary.getByRole("link", { name: "Review career outcomes" }),
  ).toHaveAttribute("href", /view=weekly-review/);
});

test("a dated Progress review keeps its selected week when opening Career", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-13T09:00:00Z"));
  await seed(page, {
    "vk:career:activities": {
      payment: {
        id: "payment",
        opportunityId: careerRole.id,
        kind: "payment",
        date: "2026-11-09",
        reference: "Actual payment receipt",
        note: "Paid delivery",
        amount: 120,
        currency: "USD",
        updatedAt: 100,
      },
    },
  });
  await page.goto("/dashboard?date=2026-11-12");
  await page.getByRole("link", { name: "Review career outcomes" }).click();
  await expect(
    page.getByText("Week of 2026-11-09 · recorded through 2026-11-12.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText("USD 120", { exact: false })).toBeVisible();
});
