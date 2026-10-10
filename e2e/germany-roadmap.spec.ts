import { expect, test } from "@playwright/test";
import { seed } from "./helpers";
const item = {
  id: "germany:2026:w01:project",
  text: "Reproduce a synthetic workflow and test its rejection boundary.",
  evidenceType: "note",
  acceptanceCriteria:
    "Record the revision, test, observed outcome and local limitation.",
  estimatedMinutes: 120,
};
const plan = {
  version: 1,
  reviewedOn: "2026-10-10",
  startDate: "2026-10-12",
  endDate: "2027-01-03",
  target:
    "Senior full-stack engineering in Germany. Berlin first, Munich second.",
  sourceDigest: "a".repeat(64),
  weeks: Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    start: new Date(Date.UTC(2026, 9, 12 + i * 7)).toISOString().slice(0, 10),
    end: new Date(Date.UTC(2026, 9, 18 + i * 7)).toISOString().slice(0, 10),
    study: "Explain the mechanism and one failure.",
    deliverable: "Tested workflow " + (i + 1),
    campaign: "Check live roles and tailor applications.",
    items: [
      {
        ...item,
        id: `germany:2026:w${String(i + 1).padStart(2, "0")}:project`,
      },
    ],
  })),
  allocations: [{ label: "Focused work", hours: 50 }],
  sections: [
    {
      title: "Applications and proof",
      content:
        "Apply while preparing. Use [official sources](https://www.make-it-in-germany.com/en/).",
    },
  ],
  sources: [],
};
async function setup(page: import("@playwright/test").Page) {
  await page.clock.install({ time: new Date("2026-10-12T09:00:00Z") });
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: plan },
    "vk:timetable_100_days": {
      days: [
        {
          date: "2026-10-12",
          day: 13,
          chapters: [],
          checklist: [],
          schedule: {
            "08:30-10:00": {
              label: "Study and retrieve",
              minutes: 90,
              work: true,
              output: "Unaided trace",
            },
          },
          title: "Study",
          topic: "Study",
        },
      ],
    },
  });
  await page.goto("/roadmap");
}
test("promotes the roadmap and preserves evidence through reload without auto-verification", async ({
  page,
}) => {
  await setup(page);
  const roadmap = page.getByTestId("germany-roadmap");
  await expect(
    roadmap.getByRole("heading", { name: "Build proof. Apply every week." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Germany", exact: true }),
  ).toBeVisible();
  const action = roadmap.getByTestId(item.id).first();
  await action
    .getByRole("button", { name: "Add evidence", exact: true })
    .click();
  await action.getByLabel("Result and checks").fill("done");
  await action
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await expect(action.getByRole("alert")).toBeVisible();
  await action
    .getByLabel("Result and checks")
    .fill(
      "The synthetic workflow passes both allowed and rejected cases; commit evidence and the local-only limitation were checked.",
    );
  await action
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await expect(action).toContainText("needs verification");
  await action
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await expect(action).toContainText("needs verification");
  await page.reload();
  const restored = page
    .getByTestId("germany-roadmap")
    .getByTestId(item.id)
    .first();
  await expect(restored).toContainText("needs verification");
  await restored
    .getByRole("button", { name: "Review evidence", exact: true })
    .click();
  await restored
    .getByRole("button", { name: "Verify saved evidence", exact: true })
    .click();
  await expect(page.getByTestId("germany-roadmap")).toContainText("1/12 milestones verified");
  await page.reload();
  await expect(page.getByTestId("germany-roadmap")).toContainText(
    "1/12 milestones verified",
  );
});
for (const width of [320, 390, 768, 1440])
  for (const theme of ["light", "dark"])
    test(`roadmap is readable at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await setup(page);
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
        document.documentElement.classList.toggle("light", t === "light");
      }, theme);
      await expect(page.getByTestId("germany-roadmap")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      if (width < 1024) {
        const dock = page.getByTestId("mobile-command-dock");
        await expect(dock.getByRole("link")).toHaveCount(6);
        await expect(
          dock.getByRole("link", { name: "Roadmap", exact: true }),
        ).toHaveAttribute("aria-current", "page");
        await expect(dock.locator('[aria-current="page"]')).toHaveCount(1);
        for (const link of await dock.getByRole("link").all()) {
          const box = await link.boundingBox();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
        for (const label of await dock.locator('a > span').all()) {
          expect(await label.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
        }
      }
      await page.getByLabel("Plan date").fill("2026-10-18");
      await expect(page.getByTestId("germany-roadmap")).toContainText(
        "Recovery Sunday. No required work.",
      );
      await expect(
        page.getByRole("region", { name: "Today's timetable" }),
      ).toContainText("0m planned focus");
      await page.getByLabel("Plan date").fill("2027-01-04");
      await expect(page.getByTestId("germany-roadmap")).toContainText(
        "Continue the hiring cycle",
      );
      expect(new URL(page.url()).searchParams.get("date")).toBe("2027-01-04");
    });
test("missing campaign data gives a useful empty state and keeps legacy views", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/roadmap");
  await expect(
    page.getByText("Germany campaign is not available in this account yet."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Curriculum", exact: true }).click();
  await expect(
    page.getByText("Study catalogue and history", { exact: true }),
  ).toBeVisible();
});
