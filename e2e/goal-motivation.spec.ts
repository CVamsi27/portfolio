import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test("motivation stays devoted to the saved goal and preserves removed-section data", async ({
  page,
}) => {
  await seed(page, {
    "vk:prefs": {
      goalCategory: "relocation",
      goalCountry: "Germany",
      goalTitle: "Build my engineering career in Germany",
      questionnaireDone: true,
      motivationPersonalization: "general",
    },
    "vk:goal": {
      metricByDay: {},
      milestonesByCategory: {
        relocation: [
          {
            id: "proof",
            title: "Publish my engineering portfolio",
            done: false,
            doneAt: null,
          },
          { id: "cv", title: "Prepare my CV", done: true, doneAt: 1 },
        ],
      },
    },
    "vk:journal": {
      "2026-09-20": {
        win: "Kept learning",
        learned: "Transactions",
        focus: "Portfolio",
        updatedAt: 1,
      },
    },
    "vk:motivation:visits": { "2026-09-20": 1 },
  });
  await page.goto("/motivation");
  await expect(page.getByTestId("focus-goal")).toHaveText(
    "Build my engineering career in Germany",
  );
  await expect(page.getByTestId("goal-why")).toContainText("Germany");
  await expect(page.getByTestId("focus-next-action")).toContainText(
    "Publish my engineering portfolio",
  );
  await expect(page.getByText("1 of 2 milestones complete")).toBeVisible();
  await expect(page.getByTestId("focus-sprint")).toHaveCount(0);
  for (const name of [
    "Daily reflection",
    "Your affirmations",
    "Saved fuel",
    "Day streak",
    "Deck size",
    "Inspiration source",
  ])
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "General inspiration" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open my plan", exact: true }),
  ).toHaveAttribute("href", "/roadmap");
  const stored = await page.evaluate(() => ({
    journal: JSON.parse(localStorage.getItem("vk:journal")!),
    visits: JSON.parse(localStorage.getItem("vk:motivation:visits")!),
    prefs: JSON.parse(localStorage.getItem("vk:prefs")!),
  }));
  expect(Object.keys(stored.journal)).toEqual(["2026-09-20"]);
  expect(stored.visits).toEqual({ "2026-09-20": 1 });
  expect(stored.prefs.motivationPersonalization).toBe("general");
});

test("completed goals celebrate completion without inventing a next milestone", async ({
  page,
}) => {
  await seed(page, {
    "vk:prefs": {
      goalCategory: "custom",
      goalTitle: "Finish my project",
      questionnaireDone: true,
    },
    "vk:goal": {
      metricByDay: {},
      milestonesByCategory: {
        custom: [
          { id: "done", title: "Ship the project", done: true, doneAt: 1 },
        ],
      },
    },
  });
  await page.goto("/motivation");
  await expect(page.getByTestId("focus-next-action")).toContainText(
    "You completed every milestone",
  );
  await expect(
    page.getByRole("link", { name: "Reflect on my progress", exact: true }),
  ).toHaveAttribute("href", "/log");
});

test("clipboard failure is honest and never reports copied", async ({
  page,
}) => {
  await seed(page);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    }),
  );
  await page.goto("/motivation");
  await page
    .getByRole("button", { name: "Copy reminder", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Couldn’t copy");
  await expect(
    page.getByRole("button", { name: "Copy reminder", exact: true }),
  ).toHaveText("Copy");
});
