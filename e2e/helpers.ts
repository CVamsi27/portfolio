import type { Page } from "@playwright/test";

export const todayKey = () => new Date().toISOString().slice(0, 10);

/** ISO date `daysAgo` days back (0 = today). */
export function daysAgoKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Seed the app's localStorage before any page script runs. Values match the
 * v2 store shapes exactly, so no migration rewrites them (migrations snapshot
 * + rewrite on any shape change — keeping the shapes v2 keeps tests hermetic).
 *
 * Runs once per tab (guarded by a sessionStorage flag): client-side route
 * changes AND reloads keep whatever is in storage, so tests can assert
 * persistence — while every new test (fresh context) seeds from scratch.
 *
 * Questionnaire is marked done so pages render immediately.
 */
export async function seed(page: Page, data: Record<string, unknown> = {}): Promise<void> {
  await page.addInitScript((seeds) => {
    if (window.sessionStorage.getItem("__vkSeeded")) return;
    window.sessionStorage.setItem("__vkSeeded", "1");
    const defaults: Record<string, unknown> = {
      "vk:prefs": {
        name: "Test User",
        goalCategory: "relocation",
        goalTitle: "",
        goalCountry: "Canada",
        dailyMetricLabel: undefined,
        dailyMetricTarget: undefined,
        dailyMetricGoalTotal: undefined,
        workoutDaysPerWeek: 4,
        workoutSplit: "fullbody",
        weightUnit: "kg",
        fastingEnabled: true,
        fastingProtocolId: "16-8",
        motivationStyle: "discipline",
        motivationPersonalization: "goal",
        customSplitDays: [
          { id: "day-1", label: "Day 1" },
          { id: "day-2", label: "Day 2" },
          { id: "day-3", label: "Day 3" },
        ],
        questionnaireDone: true,
      },
      "vk:fasting": { protocolId: "16-8", phase: "fasting", startedAt: null },
      "vk:fasting:history": [],
      "vk:workouts": {},
      "vk:workout:library": {},
      "vk:todos": [],
      "vk:goal": { metricByDay: {}, milestonesByCategory: {} },
      "vk:journal": {},
      "vk:motivation:favs": [],
      "vk:motivation:custom": [],
      "vk:motivation:visits": {},
      "vk:share": [],
      "vk:share:links": {},
    };
    window.localStorage.clear();
    for (const [k, v] of Object.entries({ ...defaults, ...seeds })) {
      window.localStorage.setItem(k, JSON.stringify(v));
    }
  }, data);
}

/** Fast-history entry as the fasting store writes it. */
export function fastEntry(id: string, startMs: number, endMs: number, protocolId = "16-8") {
  return { id, start: startMs, end: endMs, protocolId, source: "timer" };
}

/** Structured workout log for a date + exercise. */
export function workoutCell(reps: number, weightKg: number | null, done = true) {
  return { done, sets: [{ reps, weightKg }] };
}
