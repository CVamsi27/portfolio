import { expect, test } from "@playwright/test";
import { buildNextAction } from "@/lib/command-deck";

test.describe("command deck next action", () => {
  test("uses the first incomplete milestone after daily obligations are clear", () => {
    expect(buildNextAction({
      fastRunning: false,
      fastLogged: true,
      workoutDone: true,
      todoCount: 0,
      doneTodos: 0,
      goalPct: 0,
      metricLabel: "applications",
      nextMilestone: "Send three tailored applications",
    })).toEqual({
      kind: "milestone",
      title: "Advance: Send three tailored applications",
      href: "/goal#milestones",
    });
  });

  test("keeps a missing weigh-in ahead of a milestone", () => {
    expect(buildNextAction({
      fastRunning: false,
      fastLogged: true,
      workoutDone: true,
      todoCount: 0,
      doneTodos: 0,
      goalPct: 0,
      metricLabel: "check-ins",
      weightLossGoal: true,
      weightLoggedToday: false,
      nextMilestone: "Review the first weekly trend",
    })).toEqual({
      kind: "weigh-in",
      title: "Log today’s weigh-in",
      href: "/weight-loss",
    });
  });
});
