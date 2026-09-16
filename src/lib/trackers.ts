import type { GoalCategory, MotivationStyle } from "./user-prefs";

export const TRACKER_LINKS = [
  { href: "/trackers", label: "All", short: "All" },
  { href: "/intermittent-fasting", label: "Fasting", short: "Fast" },
  { href: "/motivation", label: "Motivation", short: "Boost" },
  { href: "/goal", label: "Goal", short: "Goal" },
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

// ── Personalized motivation quotes by style ──
export const MOTIVATION_QUOTES: Record<MotivationStyle, { text: string; tag: string }[]> = {
  discipline: [
    { text: "Small daily wins compound into a life you're proud of.", tag: "Discipline" },
    { text: "You don't need motivation to start. You need a start to build momentum.", tag: "Action" },
    { text: "Discipline is choosing the future self over the current craving.", tag: "Focus" },
    { text: "Eat in the window. Work in the zone. Sleep like it's a skill.", tag: "Routine" },
    { text: "Future you is watching. Make them proud before lunch.", tag: "Accountability" },
    { text: "Consistency beats intensity. Show up again tomorrow.", tag: "Habit" },
    { text: "The hardest part is showing up. Once you're there, momentum takes over.", tag: "Start" },
    { text: "Every rep, every fast, every application — it all counts. Keep stacking.", tag: "Compound" },
  ],
  resilience: [
    { text: "Rejection is redirection — every 'no' funds the next 'yes'.", tag: "Resilience" },
    { text: "Fall seven times, stand up eight. The world belongs to those who persist.", tag: "Grit" },
    { text: "Setbacks are setups for comebacks. Keep moving.", tag: "Bounce Back" },
    { text: "They said it was impossible. Then someone did it — that someone is you.", tag: "Defiance" },
    { text: "The pain of discipline is nothing compared to the pain of regret.", tag: "Choice" },
    { text: "You've survived 100% of your worst days. That's a perfect record.", tag: "Track Record" },
    { text: "Pressure makes diamonds. Keep pressing.", tag: "Pressure" },
    { text: "No one is coming to save you. That's the best news — you have full control.", tag: "Ownership" },
  ],
  growth: [
    { text: "Growth begins at the edge of your comfort zone. Step further today.", tag: "Growth" },
    { text: "Every skill you master is a door that opens. Keep unlocking.", tag: "Skills" },
    { text: "The best investment you can make is in yourself.", tag: "Investment" },
    { text: "Compare yourself to who you were yesterday, not to who someone else is today.", tag: "Progress" },
    { text: "Learning never exhausts the mind. Keep sharpening.", tag: "Learning" },
    { text: "You're not behind. You're on your own timeline. Trust the process.", tag: "Patience" },
    { text: "Mistakes are proof that you're trying. Fail forward.", tag: "Experiment" },
    { text: "The compound effect of daily learning is unstoppable.", tag: "Compound" },
  ],
  health: [
    { text: "Your body is the only home you'll live in forever. Take care of it.", tag: "Body" },
    { text: "Movement is medicine. Every rep is a prescription.", tag: "Fitness" },
    { text: "Fast clean. Eat clean. Sleep clean. Repeat.", tag: "Routine" },
    { text: "Health is not a goal — it's a daily practice.", tag: "Daily" },
    { text: "The strongest muscle is your heart. Train it, feed it, rest it.", tag: "Heart" },
    { text: "You can't pour from an empty cup. Fill yours first.", tag: "Self-Care" },
    { text: "Sweat is just fat crying. Make it weep.", tag: "Grind" },
    { text: "Recovery is part of the workout. Rest like a pro.", tag: "Recovery" },
  ],
  career: [
    { text: "Apply like it's your job — until it gets you the job.", tag: "Outreach" },
    { text: "Your network is your net worth. Build it intentionally.", tag: "Network" },
    { text: "Every application is a lottery ticket. Buy more.", tag: "Volume" },
    { text: "Skills pay the bills. Keep stacking your toolkit.", tag: "Skills" },
    { text: "The best time to plant a tree was 20 years ago. Second best is now.", tag: "Start" },
    { text: "Don't wait for opportunity. Create it.", tag: "Initiative" },
    { text: "Your resume opens doors. Your skills walk through them.", tag: "Competence" },
    { text: "Rejection is just data. Analyze, adapt, apply again.", tag: "Iteration" },
  ],
  stoic: [
    { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", tag: "Marcus Aurelius" },
    { text: "The obstacle is the way. What blocks the path becomes the path.", tag: "Ryan Holiday" },
    { text: "Waste no more time arguing about what a good person should be. Be one.", tag: "Marcus Aurelius" },
    { text: "Difficulties strengthen the mind, as labor does the body.", tag: "Seneca" },
    { text: "It's not what happens to you, but how you react to it that matters.", tag: "Epictetus" },
    { text: "First say to yourself what you would be; and then do what you have to do.", tag: "Epictetus" },
    { text: "He who fears death will never do anything worthy of a living man.", tag: "Seneca" },
    { text: "The best revenge is not to be like your enemy.", tag: "Marcus Aurelius" },
  ],
};

// ── Goal-specific milestones ──
export const GOAL_MILESTONES: Record<GoalCategory, string[]> = {
  relocation: [
    "Recognized university degree (Anabin H+ confirmation)",
    "Concrete job offer from a target-country entity",
    "Minimum salary meeting the visa threshold",
    "Full Stack Tech Stack specification (matching position description)",
  ],
  fitness: [
    "Set baseline measurements (weight, body fat, key lifts)",
    "Complete 4 consecutive weeks of training",
    "Hit first major strength milestone",
    "Achieve target body composition or endurance goal",
  ],
  career: [
    "Update resume and LinkedIn to target role",
    "Complete 50 applications to target companies",
    "Land first technical interview",
    "Receive and accept an offer",
  ],
  learning: [
    "Choose primary skill / certification to pursue",
    "Complete foundational coursework or tutorial",
    "Build a portfolio project demonstrating the skill",
    "Get feedback from a peer or mentor",
  ],
  financial: [
    "Set monthly savings target and track it",
    "Build 3-month emergency fund",
    "Start one additional income stream",
    "Review and optimize monthly expenses",
  ],
  custom: [
    "Define your goal clearly (write it down)",
    "Break it into 4 weekly milestones",
    "Complete the first milestone",
    "Review and adjust the plan",
  ],
};

// ── Goal-specific snippets ──
export const GOAL_SNIPPETS: Record<GoalCategory, (hub?: string) => string> = {
  relocation: (hub) =>
    `Hallo! I'm a Full Stack Engineer specializing in TypeScript (React, Node, NestJS, PostgreSQL). I love the tech ecosystem in ${hub ?? "your city"} and notice your team is scaling up. Would love to connect and share how my background aligns with your current architecture needs. Vielen Dank!`,
  fitness: () =>
    `Training update: ${new Date().toLocaleDateString()} — Every rep counts. Every session compounds. The version of me that shows up today is building the version of me that wins tomorrow.`,
  career: () =>
    `Career development check-in: ${new Date().toLocaleDateString()} — Focused on continuous improvement. Building skills, shipping projects, and making connections that matter.`,
  learning: () =>
    `Learning update: ${new Date().toLocaleDateString()} — Today's focus: deep work on the core skill. Consistency beats intensity. 30 minutes of focused practice > 3 hours of distracted effort.`,
  financial: () =>
    `Financial check-in: ${new Date().toLocaleDateString()} — Tracking expenses, building savings, and investing in skills that generate returns. Small optimizations compound.`,
  custom: () =>
    `Daily reflection: ${new Date().toLocaleDateString()} — One step closer today. Progress isn't always visible, but it's always happening. Trust the process.`,
};

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
