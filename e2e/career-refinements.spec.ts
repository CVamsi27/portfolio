import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
import { careerRole, contractRole } from "./career-workflow-fixture";
import { newOpportunity } from "../src/lib/career-workflow";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-05T09:00:00Z"));
});

test("a research check preserves a displayed clarification stage even before any user record exists", async ({
  page,
}) => {
  const role = { ...careerRole, eligibility: "clarify" as const };
  await seed(page, { "vk:career:research": { [role.id]: role } });
  await page.goto(`/roadmap?role=${role.id}`);
  const detail = page.getByRole("dialog");
  await detail
    .getByRole("button", { name: "Record research check", exact: true })
    .click();
  await detail.getByLabel("Checked eligibility").selectOption("eligible");
  await detail
    .getByLabel("Check evidence or remaining question")
    .fill("The employer confirms that this role accepts engineers in India.");
  await detail
    .getByRole("button", { name: "Save research check", exact: true })
    .click();
  await expect(
    detail.getByText("Needs clarification", { exact: true }),
  ).toBeVisible();
  await expect(
    detail.getByRole("button", { name: "Mark ready to apply", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Mark ready to apply", exact: true }),
  ).toBeEnabled();
});

test("a fresh research check preserves the actual application, draft and follow-up", async ({
  page,
}) => {
  const role = { ...careerRole, checkedOn: "2026-10-25" };
  await seed(page, {
    "vk:career:research": { [role.id]: role },
    "vk:career:opportunities": {
      [role.id]: {
        ...newOpportunity(role, 100),
        stage: "applied",
        draft: "My saved application wording",
        followUpOn: "2026-11-12",
      },
    },
    "vk:career:activities": {
      sent: {
        id: "sent",
        opportunityId: role.id,
        kind: "application",
        date: "2026-11-05",
        reference: "Actual receipt ABC",
        note: "Sent application",
        updatedAt: 100,
      },
    },
  });
  await page.goto(`/roadmap?role=${role.id}`);
  const detail = page.getByRole("dialog");
  await detail
    .getByRole("button", { name: "Record research check", exact: true })
    .click();
  await detail
    .getByLabel("Check evidence or remaining question")
    .fill(
      "The employer's current opening explicitly accepts engineers working remotely in India.",
    );
  await detail
    .getByRole("button", { name: "Save research check", exact: true })
    .click();
  await expect(
    detail.getByText("Research check saved", { exact: true }),
  ).toBeVisible();
  await expect(
    detail.getByText("Application sent", { exact: true }),
  ).toBeVisible();
  await expect(detail.getByLabel("Application draft")).toHaveValue(
    "My saved application wording",
  );
  await expect(detail.getByLabel("Follow up on")).toHaveValue("2026-11-12");
  await page.reload();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Source checked 2026-11-05", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(JSON.parse(localStorage.getItem("vk:career:activities")!)),
    ),
  ).toEqual(["sent"]);
});

test("clarified research becomes ready only through an explicit preparation action", async ({
  page,
}) => {
  const role = { ...careerRole, eligibility: "clarify" as const };
  await seed(page, {
    "vk:career:research": { [role.id]: role },
    "vk:career:opportunities": { [role.id]: newOpportunity(role, 100) },
  });
  await page.goto(`/roadmap?role=${role.id}`);
  const detail = page.getByRole("dialog");
  await detail
    .getByRole("button", { name: "Record research check", exact: true })
    .click();
  await detail.getByLabel("Checked eligibility").selectOption("eligible");
  await detail
    .getByLabel("Check evidence or remaining question")
    .fill("Hiring confirmed that the role is India remote.");
  await detail
    .getByRole("button", { name: "Save research check", exact: true })
    .click();
  await expect(
    detail.getByRole("button", { name: "Mark ready to apply", exact: true }),
  ).toBeEnabled();
  await detail
    .getByRole("button", { name: "Mark ready to apply", exact: true })
    .click();
  await expect(
    detail.getByText("Ready to apply", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(
        JSON.parse(localStorage.getItem("vk:career:activities") ?? "{}"),
      ),
    ),
  ).toHaveLength(0);
});

test("one-click queue views preserve search context and clear contradictory advanced filters", async ({
  page,
}) => {
  await seed(page, {
    "vk:career:research": {
      [careerRole.id]: careerRole,
      [contractRole.id]: contractRole,
    },
  });
  await page.goto("/roadmap?q=Sample&kind=employment");
  await page.getByRole("button", { name: "Contracts", exact: true }).click();
  await expect(page).toHaveURL(/queue=contracts/);
  await expect(page.getByLabel("Search opportunities")).toHaveValue("Sample");
  await expect(
    page.getByRole("button", {
      name: "Open Sample Company Workflow implementation",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Open Sample Company Product Engineer",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Contracts", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Clear filters", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Open Sample Company Product Engineer",
      exact: true,
    }),
  ).toBeVisible();
});

test("queue views remain reachable without horizontal page overflow at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await seed(page, {
    "vk:career:research": {
      [careerRole.id]: careerRole,
      [contractRole.id]: contractRole,
    },
  });
  await page.goto("/roadmap");
  await page.getByRole("button", { name: "Contracts", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Open Sample Company Workflow implementation",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});
