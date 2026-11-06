import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
import { careerRole, contractRole } from "./career-workflow-fixture";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-05T09:00:00Z"));
  await seed(page, {
    "vk:career:research": {
      [careerRole.id]: careerRole,
      [contractRole.id]: contractRole,
    },
  });
});

test("the role brief supports comparing two openings at the in-app pane width without starting an application", async ({
  page,
}) => {
  await page.setViewportSize({ width: 685, height: 850 });
  await page.goto("/roadmap?q=Sample");
  const brief = page.getByRole("complementary", { name: "Role brief" });
  await expect(brief).toContainText("Product Engineer");
  const contract = page.getByRole("button", {
    name: "Preview Sample Company Workflow implementation",
  });
  await contract.press("Enter");
  await expect(contract).toBeFocused();
  await expect(brief).toContainText("Workflow implementation");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Search opportunities")).toHaveValue("Sample");
  await expect(brief).toContainText("Workflow implementation");
  await brief.getByRole("button", { name: "Open opportunity" }).click();
  const editor = page.getByRole("dialog", {
    name: "Sample Company · Workflow implementation",
  });
  await expect(editor).toBeVisible();
  await expect(
    editor.getByText("No activity recorded.", { exact: false }),
  ).toBeVisible();
  await editor.getByRole("button", { name: "Back to queue" }).click();
  await expect(
    brief.getByRole("button", { name: "Open opportunity" }),
  ).toBeFocused();
});

test("Today shows the first role’s actual evidence and unresolved question", async ({
  page,
}) => {
  await page.goto("/hub?date=2026-11-05");
  const actions = page.getByRole("region", { name: "Career next actions" });
  await expect(
    actions.getByText("React and Node workflow ownership", { exact: true }),
  ).toBeVisible();
  await expect(
    actions.getByText("Confirm the first-payment date", { exact: true }),
  ).toBeVisible();
});
