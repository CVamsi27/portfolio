export type NextActionInput = {
  fastRunning: boolean;
  workoutDone: boolean;
  todoCount: number;
  doneTodos: number;
  goalPct: number;
  metricLabel: string;
  nextTask?: string;
};

/** Derive the single action that best protects today's momentum. */
export function buildNextAction(input: NextActionInput): string {
  if (input.fastRunning) return "Protect the current fast";

  if (input.todoCount > input.doneTodos) {
    const nextTask = input.nextTask?.trim();
    return nextTask || "Complete the next move";
  }

  if (!input.workoutDone) return "Log the session";

  const goalComplete = input.goalPct >= (input.goalPct <= 1 ? 1 : 100);
  if (!goalComplete) return `Log ${input.metricLabel}`;

  return "Write today's reflection";
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
