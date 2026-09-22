export type NextActionKind = "fast" | "weigh-in" | "commitment" | "milestone" | "todo" | "workout" | "goal" | "reflection";

export type NextAction = {
  kind: NextActionKind;
  title: string;
  href: string;
};

export type UpNextCue = {
  title: string;
  detail: string;
  href: string;
  effortMinutes?: number;
  kind: NextActionKind;
};

export type NextActionInput = {
  fastRunning: boolean;
  fastLogged?: boolean;
  workoutDone: boolean;
  todoCount: number;
  doneTodos: number;
  goalPct: number;
  metricLabel: string;
  nextTask?: string;
  weightLossGoal?: boolean;
  weightLoggedToday?: boolean;
  weeklyCommitment?: { text: string; completed?: boolean };
  nextMilestone?: string;
};

/** Derive the single action that best protects today's momentum. */
export function buildNextAction(input: NextActionInput): NextAction {
  if (input.fastRunning) return { kind: "fast", title: "Protect the current fast", href: "/intermittent-fasting" };
  if (!input.fastLogged) return { kind: "fast", title: "Log today’s meal window", href: "/intermittent-fasting" };
  if (input.weightLossGoal && !input.weightLoggedToday) return { kind: "weigh-in", title: "Log today’s weigh-in", href: "/weight-loss" };
  if (input.weeklyCommitment && !input.weeklyCommitment.completed) {
    return { kind: "commitment", title: `Advance: ${input.weeklyCommitment.text}`, href: "/goal#weekly-commitment" };
  }
  if (input.nextMilestone?.trim()) {
    return { kind: "milestone", title: `Advance: ${input.nextMilestone.trim()}`, href: "/goal#milestones" };
  }

  if (input.todoCount > input.doneTodos) {
    const nextTask = input.nextTask?.trim();
    return { kind: "todo", title: nextTask || "Complete the next move", href: "/todo" };
  }

  if (!input.workoutDone) return { kind: "workout", title: "Log the session", href: "/workout-tracking" };

  const goalComplete = input.goalPct >= (input.goalPct <= 1 ? 1 : 100);
  if (!goalComplete) return { kind: "goal", title: `Log ${input.metricLabel}`, href: "/goal" };

  return { kind: "reflection", title: "Write today’s reflection", href: "/motivation" };
}

export function buildUpNextCue(input: {
  nextAction: NextAction;
  recoveryCue?: { title: string; detail: string; href: string };
  nextMilestone?: string;
}): UpNextCue {
  if (input.recoveryCue) {
    return {
      title: input.recoveryCue.title,
      detail: input.recoveryCue.detail,
      href: input.recoveryCue.href,
      effortMinutes: 1,
      kind: "reflection",
    };
  }

  if (input.nextMilestone?.trim() && input.nextAction.kind !== "milestone") {
    return {
      title: `Prepare: ${input.nextMilestone.trim()}`,
      detail: "Your next ordered milestone is waiting in the roadmap.",
      href: "/goal#milestones",
      effortMinutes: 10,
      kind: "milestone",
    };
  }

  return {
    title: input.nextAction.kind === "reflection" ? "Close the loop with a reflection" : "Keep the sequence moving",
    detail: input.nextAction.kind === "reflection" ? "Name what worked and what should change tomorrow." : "Finish the current move, then return here for the next cue.",
    href: input.nextAction.href,
    effortMinutes: input.nextAction.kind === "reflection" ? 3 : undefined,
    kind: input.nextAction.kind,
  };
}

export function buildDailyChapter(input: {
  goalTitle: string;
  goalLabel: string;
  goalPct: number;
  ringPct: number;
  nextAction: string;
  today: string;
}): { eyebrow: string; title: string; summary: string; nextAction: string } {
  const title = input.goalTitle.trim() || input.goalLabel;
  return {
    eyebrow: `Daily Chapter // ${input.today}`,
    title,
    summary: `${input.goalLabel} arc at ${Math.round(input.goalPct)}% today. The command deck is tracking ${input.ringPct}% momentum across four anchors.`,
    nextAction: input.nextAction,
  };
}
