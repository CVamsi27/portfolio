import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
const dates = (n: number) =>
  new Date(Date.UTC(2026, 9, 12 + n)).toISOString().slice(0, 10);
const execution = {
  version: 1,
  assessmentVersion: "b".repeat(64),
  days: Array.from({ length: 60 }, (_, i) => {
    const date = dates(Math.floor(i / 5) * 7 + (i % 5));
    return {
      id: `germany:2026:day:${date}`,
      date,
      week: Math.floor(i / 5) + 1,
      title: "Dated assignment " + date,
      blocks: {
        study:
          "[Scope](https://study.buildora.work/10-frontend/scope.md). Explain identifier resolution and trace the failure.",
        project:
          "Trace a synthetic request and test the authorization boundary.",
        practice: "C01",
        speak: "Explain your own contribution.",
      },
    };
  }),
  rounds: Array.from({ length: 7 }, (_, i) => ({
    id: "R" + i,
    title: "R" + i + " — interview practice",
    dimensions: [
      "Requirements",
      "Correctness",
      "Boundaries",
      "Tests",
      "Communication",
    ],
    minimum3: [1, 2],
    passTotal: 16,
    version: "c".repeat(64),
    content:
      '**Form A:** solve a changed constraint.\n\n```javascript\nconsole.log("A");\n\nconsole.log("B");\n```',
  })),
  assessments: Array.from({ length: 12 }, (_, i) => [
    {
      id: "W" + String(i + 1).padStart(2, "0"),
      date: dates(i * 7 + 2),
      time: "16:15–17:45",
      content: "Trace and score the boundary.",
    },
    {
      id: "E" + String(i + 1).padStart(2, "0"),
      date: dates(i * 7 + 5),
      time: "10:15–11:45",
      content: "R2 frontend form A and scoring.",
    },
  ]).flat(),
  companies: Array.from({ length: 25 }, (_, i) => ({
    id: "DE" + String(i + 1).padStart(2, "0"),
    title: `[Employer ${i + 1}](https://example.org/jobs/${i + 1})`,
    status: "Board/watch · exact requisition unverified",
    action:
      "Check language, work authorization and actual role before applying.",
  })),
  weeks: Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    application: "Check two eligible roles and actual replies.",
    tuesday: "Prepare a verified contact message.",
    thursday: "Review draft P01 before deciding to publish.",
    oss: {
      monday: "Read contribution rules.",
      wednesday: "Reproduce an observed issue.",
      friday: "Run the relevant tests.",
    },
    german: "Practice beginner introductions.",
    germanCheck: "Record listening and speaking gaps.",
    relocation: "Verify document dependencies.",
  })),
  posts: Array.from({ length: 12 }, (_, i) => ({
    id: "P" + String(i + 1).padStart(2, "0"),
    date: dates(i * 7 + 3),
    title: "A truthful technical draft",
    content: "Explain a mechanism without invented metrics.",
  })),
  practices: [
    {
      id: "C01",
      task: "Find two distinct indices.",
      cases: "Empty input and duplicate values.",
    },
  ],
  guides: ["design", "curriculum", "exams", "campaign"].map((id) => ({
    id,
    title: id + " guide",
    content:
      '## Explain a mechanism\n\nA practical guide.\n\n```javascript\nconsole.log("A");\n\nconsole.log("B");\n```',
  })),
};
const plan = {
  version: 1,
  reviewedOn: "2026-10-10",
  startDate: "2026-10-12",
  endDate: "2027-01-03",
  target: "Senior full-stack engineering",
  sourceDigest: "a".repeat(64),
  weeks: Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    start: dates(i * 7),
    end: dates(i * 7 + 6),
    study: "Explain mechanism",
    deliverable: "Test boundary",
    campaign: "Check roles",
    items: [
      {
        id: `germany:2026:w${String(i + 1).padStart(2, "0")}:project`,
        text: "Test the boundary",
        acceptanceCriteria: "Record the actual test and result.",
        evidenceType: "note",
        estimatedMinutes: 120,
      },
    ],
  })),
  allocations: [{ label: "Focused work", hours: 50 }],
  sections: [],
  sources: [],
  execution,
};
async function setup(page: import("@playwright/test").Page) {
  await seed(page, {
    "vk:career_command_center": { germanyRoadmap: plan },
    "vk:career_execution_state": {
      version: 1,
      evidenceByItemId: {},
      archivedItems: [],
    },
  });
  await page.goto("/roadmap?date=2026-10-12");
}
test("dated assignments open contextual study links and retain a scored attempt after reload", async ({
  page,
}) => {
  await setup(page);
  const roadmap = page.getByTestId("germany-roadmap");
  await expect(
    roadmap.getByText(
      "Trace a synthetic request and test the authorization boundary.",
    ),
  ).toBeVisible();
  const study = roadmap
    .getByRole("link", { name: "Scope", exact: true })
    .first();
  await expect(study).toHaveAttribute(
    "href",
    /roadmapDate=2026-10-12.*roadmapTask=/,
  );
  await roadmap.getByRole("button", { name: "Exams", exact: true }).click();
  await roadmap.getByText("R2 — interview practice", { exact: true }).click();
  await roadmap
    .getByRole("button", { name: "Record an attempt", exact: true })
    .click();
  await roadmap
    .getByLabel("Prompt/form and changed constraint")
    .fill("Frontend stale responses form A");
  await roadmap.getByLabel("Start time (IST)").fill("2026-10-24T10:15");
  await roadmap.getByLabel("End time (IST)").fill("2026-10-24T11:15");
  await roadmap.getByLabel("Focused minutes").fill("60");
  await roadmap.getByLabel("Practical track").selectOption("frontend");
  for (const name of execution.rounds[2].dimensions) {
    await roadmap
      .getByRole("combobox", { name: name + " score", exact: true })
      .selectOption("4");
    await roadmap
      .getByLabel(name + " observation", { exact: true })
      .fill("Observed correct behavior with meaningful edge-case tests.");
  }
  await roadmap
    .getByLabel("Saved artifact and checks")
    .fill(
      "The frozen revision and test command establish latest-request correctness and the tenant boundary.",
    );
  await roadmap
    .getByLabel("Next repair")
    .fill("Change to duplicate-submit and uncertain-write constraints.");
  await roadmap.getByLabel("Next practice/retake date").fill("2026-10-28");
  await roadmap
    .getByRole("button", { name: "Save attempt", exact: true })
    .click();
  await expect(roadmap).toContainText("Passed · self-assessed");
  await page.reload();
  await page.getByRole("button", { name: "Exams", exact: true }).click();
  await page.getByText("R2 — interview practice", { exact: true }).click();
  await expect(page.getByTestId("germany-roadmap")).toContainText(
    "Frontend stale responses form A",
  );
  await expect(page.getByTestId("germany-roadmap")).toContainText(
    "1 of 2 changed-prompt passes",
  );
});
for (const theme of ["light", "dark"])
  test(`detailed roadmap keeps full width and usable company controls at 320px in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await setup(page);
    const roadmap = page.getByTestId("germany-roadmap");
    await roadmap
      .getByRole("button", { name: "Companies", exact: true })
      .click();
    await roadmap
      .getByLabel("Find a company or requirement")
      .fill("Employer 25");
    await expect(
      roadmap.getByRole("link", { name: "Employer 25", exact: true }),
    ).toBeVisible();
    await expect(
      roadmap.getByRole("link", { name: "Employer 1", exact: true }),
    ).toHaveCount(0);
    await roadmap.getByRole("button", { name: "Guides", exact: true }).click();
    await roadmap.getByText("design guide", { exact: true }).click();
    await expect(roadmap.locator("pre code").first()).toHaveText(
      'console.log("A");\n\nconsole.log("B");',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  });
