import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
import { newOpportunity } from "../src/lib/career-workflow";
import {
  careerRole,
  careerSnapshot,
  contractRole,
} from "./career-workflow-fixture";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-05T09:00:00Z"));
});

test("backfilled applications keep a later reply's follow-up cleared in the editor", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-13T09:00:00Z"));
  await seed(page, {
    "vk:career:research": { [careerRole.id]: careerRole },
    "vk:career:opportunities": {
      [careerRole.id]: {
        ...newOpportunity(careerRole, 100),
        stage: "applied",
        followUpOn: null,
      },
    },
    "vk:career:activities": {
      reply: {
        id: "reply",
        opportunityId: careerRole.id,
        kind: "reply",
        date: "2026-11-10",
        reference: "Employer reply received",
        note: "Waiting for their next step",
        updatedAt: 200,
      },
    },
  });
  await page.goto(`/roadmap?role=${careerRole.id}`);
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Record application", exact: true })
    .click();
  await dialog.getByLabel("Activity date").fill("2026-11-05");
  await dialog
    .getByLabel("Confirmation reference")
    .fill("Earlier actual receipt ABC123");
  await dialog
    .getByRole("button", { name: "Save activity", exact: true })
    .click();
  await expect(dialog.getByLabel("Follow up on")).toHaveValue("");
});

test("advanced filters stay out of the primary queue and remain available on demand", async ({
  page,
}) => {
  await seed(page, {
    "vk:career:research": {
      [careerRole.id]: careerRole,
      [contractRole.id]: { ...contractRole, eligibility: "clarify" },
    },
  });
  await page.goto("/roadmap");
  await expect(page.getByLabel("Actual stage", { exact: true })).toBeHidden();
  await page.getByText("More filters", { exact: true }).click();
  await page.getByLabel("Eligibility filter").selectOption("clarify");
  await expect(page).toHaveURL(/eligibility=clarify/);
  await expect(
    page.getByRole("button", {
      name: "Open Sample Company Workflow implementation",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Eligibility filter")).toHaveValue("clarify");
});

test("career queue works without a saved study plan", async ({ page }) => {
  await seed(page);
  await page.goto("/roadmap");
  await expect(
    page.getByRole("heading", { name: "Your opportunity queue" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import research", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add an opportunity", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Career plan unavailable", { exact: true }),
  ).toHaveCount(0);
});

test("drafts stay unsent and recording an application schedules a weekday follow-up", async ({
  page,
}) => {
  await seed(page, { "vk:career:research": { [careerRole.id]: careerRole } });
  await page.goto(`/roadmap?role=${careerRole.id}`);
  const detail = page.getByRole("dialog", {
    name: "Sample Company · Product Engineer",
  });
  await expect(detail).toBeVisible();
  await detail
    .getByRole("textbox", { name: "Application draft" })
    .fill("A reviewed unsent draft with one accurate project example.");
  await detail
    .getByRole("button", { name: "Save opportunity", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      Object.keys(
        JSON.parse(localStorage.getItem("vk:career:activities") ?? "{}"),
      ),
    ),
  ).toHaveLength(0);
  await detail
    .getByRole("button", { name: "Record application", exact: true })
    .click();
  await detail
    .getByRole("textbox", { name: "Confirmation reference" })
    .fill("Employer receipt application-123");
  await detail
    .getByRole("button", { name: "Save activity", exact: true })
    .click();
  await expect(
    detail.getByText("Application recorded", { exact: true }),
  ).toBeVisible();
  await expect(detail.getByLabel("Follow up on")).toHaveValue("2026-11-12");
  await page.reload();
  await expect(
    page.getByRole("dialog").getByLabel("Application draft"),
  ).toHaveValue("A reviewed unsent draft with one accurate project example.");
});

test("research imports preview before writing and duplicate imports preserve user records", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/roadmap");
  await page
    .getByRole("button", { name: "Import research", exact: true })
    .click();
  await page.getByLabel("Research snapshot file").setInputFiles({
    name: "research.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(careerSnapshot)),
  });
  await expect(page.getByText("Added", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("vk:career:research")),
  ).toBeNull();
  await page.getByRole("button", { name: "Apply selected changes" }).click();
  await expect(
    page.getByRole("button", { name: "Open Sample Company Product Engineer" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Import research", exact: true })
    .click();
  await page.getByLabel("Research snapshot file").setInputFiles({
    name: "research.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(careerSnapshot)),
  });
  await expect(page.getByText("Duplicate", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply selected changes" }),
  ).toBeDisabled();
});

test("filters and selected opportunity survive reload at mobile width", async ({
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
  await page.getByLabel("Opportunity type").selectOption("contract");
  await expect(page).toHaveURL(/kind=contract/);
  await page
    .getByRole("button", {
      name: "Open Sample Company Workflow implementation",
    })
    .click();
  await expect(page).toHaveURL(/role=sample-contract/);
  await page.reload();
  await expect(
    page.getByRole("dialog", {
      name: "Sample Company · Workflow implementation",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("practice retains original evidence and records the actual assistance and repair", async ({
  page,
}) => {
  await seed(page, {
    "vk:career:research": { [careerRole.id]: careerRole },
    "vk:career_execution_state": {
      version: 1,
      evidenceByItemId: {
        previous: {
          evidence: { value: "Earlier unchanged evidence" },
          completedAt: "2026-10-30T08:00:00Z",
        },
      },
      archivedItems: [],
    },
  });
  await page.goto("/roadmap?view=practice");
  await page.getByLabel("Target opportunity").selectOption(careerRole.id);
  await page
    .getByLabel("Original attempt")
    .fill("Built the first API attempt and observed an authorization failure.");
  await page.getByLabel("Assistance used").selectOption("official-docs");
  await page
    .getByLabel("Correction")
    .fill("Checked ownership before reading the resource.");
  await page
    .getByLabel("Changed-case result")
    .fill(
      "A second tenant now receives a denied response; legitimate access succeeds.",
    );
  await page.getByRole("button", { name: "Save practice" }).click();
  await expect(page.getByText("Practice saved", { exact: true })).toBeVisible();
  const evidence = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("vk:career_execution_state")!)
        .evidenceByItemId,
  );
  expect(evidence.previous.evidence.value).toBe("Earlier unchanged evidence");
  expect(
    Object.keys(evidence).some((id) => id.startsWith("career:practice:")),
  ).toBe(true);
});

test("invalid and cancelled imports leave the queue unchanged", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/roadmap?import=1");
  await page.getByLabel("Research snapshot file").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...careerSnapshot,
        roles: [{ ...careerRole, roleUrl: "javascript:alert(1)" }],
      }),
    ),
  });
  await expect(page.getByRole("alert")).toContainText("Nothing imported");
  await expect(
    page.getByRole("button", { name: "Apply selected changes" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cancel import" }).click();
  await page
    .getByRole("button", { name: "Import research", exact: true })
    .click();
  await page.getByLabel("Research snapshot file").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(careerSnapshot)),
  });
  await page.getByRole("button", { name: "Cancel import" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("vk:career:research")),
  ).toBeNull();
});

test("reply clears a follow-up and closing stops suggestions", async ({
  page,
}) => {
  await seed(page, { "vk:career:research": { [careerRole.id]: careerRole } });
  await page.goto(`/roadmap?role=${careerRole.id}`);
  const detail = page.getByRole("dialog");
  await detail.getByLabel("Follow up on").fill("2026-11-10");
  await detail.getByRole("button", { name: "Schedule follow-up" }).click();
  await detail.getByRole("button", { name: "Record conversation" }).click();
  await detail.getByLabel("Activity type").selectOption("reply");
  await detail
    .getByLabel("Confirmation reference")
    .fill("Hiring team email 5 November");
  await detail.getByRole("button", { name: "Save activity" }).click();
  await expect(detail.getByLabel("Follow up on")).toHaveValue("");
  await detail
    .getByRole("button", { name: "Close opportunity", exact: true })
    .click();
  await detail.getByRole("button", { name: "Back to queue" }).click();
  await page.getByText("More filters", { exact: true }).click();
  await page.getByLabel("Follow-ups due").check();
  await expect(
    page.getByText("No opportunities match these filters"),
  ).toBeVisible();
});

test("contract payments stay separate by currency and scheduled delivery can be completed", async ({
  page,
}) => {
  await seed(page, {
    "vk:career:research": { [contractRole.id]: contractRole },
  });
  await page.goto(`/roadmap?role=${contractRole.id}`);
  const detail = page.getByRole("dialog");
  for (const [amount, currency] of [
    ["100", "USD"],
    ["5000", "INR"],
  ]) {
    await detail.getByRole("button", { name: "More activity" }).click();
    await detail.getByLabel("Activity type").selectOption("payment");
    await detail
      .getByLabel("Confirmation reference")
      .fill(`Bank receipt for ${currency}`);
    await detail.getByLabel("Amount received").fill(amount);
    await detail.getByLabel("Currency", { exact: true }).fill(currency);
    await detail.getByRole("button", { name: "Save activity" }).click();
  }
  await detail.getByRole("button", { name: "More activity" }).click();
  await detail.getByLabel("Activity type").selectOption("delivery");
  await detail
    .getByLabel("Confirmation reference")
    .fill("Client approved scoped task");
  await detail
    .getByLabel("Scheduled time (device timezone)")
    .fill("2026-11-05T16:00");
  await detail.getByRole("button", { name: "Save activity" }).click();
  await detail.getByRole("button", { name: "Mark activity complete" }).click();
  await expect(detail.getByText("Completed", { exact: true })).toBeVisible();
  await detail.getByRole("button", { name: "Back to queue" }).click();
  await page
    .getByRole("button", { name: "Weekly review", exact: true })
    .click();
  await expect(page.getByText("USD 100", { exact: true })).toBeVisible();
  await expect(page.getByText("INR 5,000", { exact: true })).toBeVisible();
});

test("opportunity dialog traps focus and restores its opener", async ({
  page,
}) => {
  await seed(page, { "vk:career:research": { [careerRole.id]: careerRole } });
  await page.goto("/roadmap");
  const opener = page.getByRole("button", {
    name: "Open Sample Company Product Engineer",
  });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page
      .getByRole("dialog")
      .evaluate((dialog) => dialog.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});
