import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

const plan = {
  version: 1,
  generatedAt: "2026-10-17T12:00:00.000Z",
  updated: "17 October 2026 (IST)",
  window: "12 October 2026 → 3 January 2027, then a 4–7 January review.",
  title: "Career Roadmap — start here",
  intro: "> **What this is:** the orientation layer for the job search.",
  sourceDigest: "a".repeat(64),
  sections: [
    {
      id: "1-honest-answer",
      title: "1. Honest answer",
      markdown:
        "**Targeted batches convert.** See the [study site](https://study.buildora.work/roadmap.md).",
    },
    {
      id: "2-the-active-loop",
      title: "2. The active loop",
      markdown: "One campaign loop at a time.",
    },
  ],
};

test("the Plan tab renders the tailored plan from the career row", async ({
  page,
}) => {
  await seed(page, { "vk:career_command_center": { plan } });
  await page.goto("/roadmap");
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page).toHaveURL(/view=plan/);
  const view = page.getByTestId("career-plan");
  await expect(view).toBeVisible();
  await expect(view).toContainText("Tailored career plan");
  await expect(view).toContainText("updated 17 October 2026 (IST)");
  await view.getByText("1. Honest answer").click();
  await expect(view.getByText("Targeted batches convert.")).toBeVisible();
  await expect(
    view.getByRole("link", { name: "study site" }),
  ).toHaveAttribute("href", "https://study.buildora.work/roadmap.md");
  await expect(view.getByText("2. The active loop")).toBeVisible();
});

test("a career row without the plan shows the owner-only notice", async ({
  page,
}) => {
  await seed(page, { "vk:career_command_center": { reviewedOn: "2026-10-10" } });
  await page.goto("/roadmap");
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(
    page.getByText("The tailored career plan is private to the owner account."),
  ).toBeVisible();
});
