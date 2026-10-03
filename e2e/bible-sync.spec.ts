import { test, expect } from "@playwright/test";
import { seed } from "./helpers";
import curriculum from "../src/data/career-curriculum.json";

test("shows Bible priorities and the generated snapshot without losing evidence", async ({ page }) => {
  const today = curriculum.days[0];
  const id = today.checklist[0].id;
  await page.clock.install({ time: new Date("2026-09-30T09:00:00+05:30") });
  await seed(page, {
    "vk:timetable_100_days": { days: [{ ...today, chapters: today.chapters.map(chapter => ({ ...chapter, rolePriority: "Optional", generalImportance: "Specialized" })) }] },
    "vk:career_execution_state": { version: 1, evidenceByItemId: { [id]: { evidence: { value: "Preserved five ideas and a booking failure trace." }, completedAt: "2026-09-30T08:55:00+05:30" } }, archivedItems: [] },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/roadmap");
  await expect(page.getByTestId("bible-sync-policy")).toContainText("animation and alternative libraries can wait");
  await expect(page.getByTestId("bible-sync-policy")).toContainText(curriculum.sourceDigest.slice(0, 12));
  await expect(page.getByText(`Role: ${today.chapters[0].rolePriority} · General: ${today.chapters[0].generalImportance}`).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem("vk:career_execution_state") ?? "{}").evidenceByItemId[key].evidence.value, id)).toContain("Preserved five ideas");
});
