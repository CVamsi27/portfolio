export const TRACKER_LINKS = [
  { href: "/trackers", label: "All", short: "All" },
  { href: "/intermittent-fasting", label: "Fasting", short: "Fast" },
  { href: "/motivation", label: "Motivation", short: "Boost" },
  { href: "/goal", label: "Germany Goal", short: "Goal" },
  { href: "/workout-tracking", label: "Workouts", short: "Gym" },
  { href: "/todo", label: "Todo", short: "Todo" },
  { href: "/share", label: "Share", short: "Share" },
  { href: "/shared-with-me", label: "Shared", short: "Shared" },
] as const;

export type FastingProtocol = {
  id: string;
  label: string;
  fastHours: number;
  blurb: string;
};

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  { id: "14-10", label: "14:10 Gentle Start", fastHours: 14, blurb: "Easy entry, steady energy" },
  { id: "16-8", label: "16:8 Lean Gains", fastHours: 16, blurb: "Classic daily driver" },
  { id: "18-6", label: "18:6 Fat Burn", fastHours: 18, blurb: "Deeper ketosis push" },
  { id: "20-4", label: "20:4 Warrior", fastHours: 20, blurb: "Aggressive cut days" },
];

export function fastingStage(pct: number): { title: string; desc: string } {
  if (pct < 25)
    return { title: "Blood Sugar Drops", desc: "Insulin falls, transitioning energy source" };
  if (pct < 55)
    return { title: "Fat Burn Kicks In", desc: "Glycogen low — body taps stored fat" };
  if (pct < 85)
    return { title: "Ketosis + Focus", desc: "Ketones rise, appetite steadies, mind sharpens" };
  return { title: "Autophagy Zone", desc: "Cellular cleanup peaks — ride it to the window" };
}

export type Exercise = {
  id: string;
  name: string;
  unit: "reps" | "minutes";
  baseline: number[];
  baselineMinutes?: number;
  hint: string;
};

export const WORKOUT_EXERCISES: Exercise[] = [
  { id: "rows", name: "Rows", unit: "reps", baseline: [9, 7], hint: "Full-body pull" },
  { id: "squats", name: "Squats", unit: "reps", baseline: [14, 12], hint: "Legs + glutes" },
  { id: "pushups", name: "Pushups", unit: "reps", baseline: [8, 7], hint: "Chest + triceps" },
  { id: "lunges", name: "Lunges", unit: "reps", baseline: [], hint: "Each leg — start 8/leg" },
  { id: "pullups", name: "Pull-ups", unit: "reps", baseline: [], hint: "Strict or assisted" },
  { id: "dips", name: "Dips", unit: "reps", baseline: [], hint: "Chest / bench dips" },
  { id: "pike", name: "Pike Pushups", unit: "reps", baseline: [], hint: "Shoulders" },
  { id: "rdl", name: "Romanian Deadlift", unit: "reps", baseline: [], hint: "Hinge, light load" },
  { id: "rope", name: "Jump Ropes", unit: "minutes", baseline: [], baselineMinutes: 8, hint: "8 min cardio finisher" },
];

export const MOTIVATION_QUOTES: { text: string; tag: string }[] = [
  { text: "Small daily wins compound into a Berlin boarding pass.", tag: "Germany Goal" },
  { text: "Apply like it's your job — until it gets you the job.", tag: "Outreach" },
  { text: "Discipline is choosing the future self over the current craving.", tag: "Fasting" },
  { text: "One more rep today is one less excuse tomorrow.", tag: "Training" },
  { text: "You don't need motivation to start. You need a start to build momentum.", tag: "Action" },
  { text: "Rejection is redirection — every 'no' funds the 'yes' in Berlin.", tag: "Resilience" },
  { text: "Eat in the window. Work in the zone. Sleep like it's a skill.", tag: "Routine" },
  { text: "Future you is watching. Make them proud before lunch.", tag: "Focus" },
];

export const GOAL_MILESTONES = [
  "Recognized university degree (Anabin H+ confirmation)",
  "Concrete job offer from a Germany-based entity",
  "Minimum salary meeting the Blue Card threshold",
  "Full Stack Tech Stack specification (matching position description)",
];

export function dateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function formatHMS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}
