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

  test("career focus skips meal logging and distant milestones in favor of today's dated work", () => {
    expect(buildNextAction({
      fastRunning: false,
      fastLogged: false,
      workoutDone: false,
      todoCount: 2,
      doneTodos: 0,
      nextTask: "Study JavaScript execution context",
      goalPct: 0,
      metricLabel: "applications",
      nextMilestone: "Concrete job offer from a target-country entity",
      careerFocus: true,
    })).toEqual({
      kind: "todo",
      title: "Study JavaScript execution context",
      href: "/todo",
    });
  });

  test("career focus opens today's roadmap when there is no dated task", () => {
    expect(buildNextAction({
      fastRunning: false,
      fastLogged: false,
      workoutDone: false,
      todoCount: 0,
      doneTodos: 0,
      goalPct: 0,
      metricLabel: "applications",
      nextMilestone: "Concrete job offer from a target-country entity",
      careerFocus: true,
    })).toEqual({
      kind: "todo",
      title: "Open today's roadmap",
      href: "/roadmap",
    });
  });
});
