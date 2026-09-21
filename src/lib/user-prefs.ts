"use client";

import { useSyncedStorage } from "./use-synced-storage";
import type { TrackerIconName } from "@/components/trackers/icons";

export type GoalCategory =
  | "relocation"
  | "fitness"
  | "weightloss"
  | "career"
  | "learning"
  | "financial"
  | "custom";

export type WorkoutSplit = "fullbody" | "push-pull-legs" | "upper-lower" | "custom";

export type MotivationStyle = "discipline" | "resilience" | "growth" | "health" | "career" | "stoic";
export type MotivationPersonalization = "goal" | "general";

export type WeightUnit = "kg" | "lbs";

export type CustomSplitDay = { id: string; label: string };

export type UserPrefs = {
  name: string;
  goalCategory: GoalCategory;
  goalTitle: string;
  goalCountry?: string;
  /** Label of the daily metric being logged (e.g. "Applications"). */
  dailyMetricLabel?: string;
  /** Per-day target for the metric. */
  dailyMetricTarget?: number;
  /** Cumulative total that completes the goal — drives the ETA estimate. */
  dailyMetricGoalTotal?: number;
  workoutDaysPerWeek: number;
  workoutSplit: WorkoutSplit;
  weightUnit: WeightUnit;
  fastingEnabled: boolean;
  fastingProtocolId: string;
  motivationStyle: MotivationStyle;
  motivationPersonalization: MotivationPersonalization;
  /** Named day tabs for the custom split. */
  customSplitDays: CustomSplitDay[];
  questionnaireDone: boolean;
};

export const DEFAULT_GOAL_METRICS: Record<GoalCategory, { label: string; target: number; unit: string }> = {
  relocation: { label: "Applications & Outreach", target: 3, unit: "outreaches" },
  career: { label: "Target Applications", target: 5, unit: "apps" },
  fitness: { label: "Active Workout", target: 45, unit: "mins" },
  weightloss: { label: "Daily weigh-in", target: 1, unit: "check-in" },
  learning: { label: "Deep Study", target: 60, unit: "mins" },
  financial: { label: "Savings & Investments", target: 20, unit: "$" },
  custom: { label: "Daily Focus Metric", target: 3, unit: "items" },
};

const DEFAULT_PREFS: UserPrefs = {
  name: "",
  goalCategory: "relocation",
  goalTitle: "",
  goalCountry: undefined,
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
  questionnaireDone: false,
};

export { DEFAULT_PREFS as DEFAULT_USER_PREFS };

export const RELOCATION_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "United Arab Emirates",
  "Australia",
  "Japan",
  "Germany",
  "Netherlands",
  "Ireland",
  "Singapore",
  "Other",
] as const;

export const GOAL_CATEGORIES: { id: GoalCategory; label: string; iconName: TrackerIconName; desc: string }[] = [
  { id: "relocation", label: "Relocation", iconName: "globe", desc: "Plan a move to a destination that matters to you" },
  { id: "fitness", label: "Fitness", iconName: "workout", desc: "Build strength and health" },
  { id: "weightloss", label: "Weight Loss", iconName: "scale", desc: "Build a calmer, sustainable body-composition practice" },
  { id: "career", label: "Career Growth", iconName: "briefcase", desc: "Level up professionally" },
  { id: "learning", label: "Learning", iconName: "book", desc: "Master new skills" },
  { id: "financial", label: "Financial", iconName: "wallet", desc: "Build wealth and freedom" },
  { id: "custom", label: "Custom", iconName: "sparkles", desc: "Define your own path" },
];

export const WORKOUT_SPLITS: { id: WorkoutSplit; label: string; desc: string }[] = [
  { id: "fullbody", label: "Full Body", desc: "Hit every muscle each session" },
  { id: "push-pull-legs", label: "Push / Pull / Legs", desc: "Targeted 3-phase split" },
  { id: "upper-lower", label: "Upper / Lower", desc: "Balanced 4-day power split" },
  { id: "custom", label: "Custom", desc: "Build your own day tabs" },
];

export const MOTIVATION_STYLES: { id: MotivationStyle; label: string; desc: string }[] = [
  { id: "discipline", label: "Discipline", desc: "Consistency over motivation" },
  { id: "resilience", label: "Resilience", desc: "Bounce back from setbacks" },
  { id: "growth", label: "Growth Mindset", desc: "Always improving" },
  { id: "health", label: "Health First", desc: "Body and mind" },
  { id: "career", label: "Career Drive", desc: "Professional ambition" },
  { id: "stoic", label: "Stoic", desc: "Calm, focused, unstoppable" },
];

export function displayGoalTitle(prefs: Pick<UserPrefs, "goalCategory" | "goalTitle" | "goalCountry">): string {
  const customTitle = prefs.goalTitle.trim();
  if (customTitle) return customTitle;
  if (prefs.goalCategory === "relocation" && prefs.goalCountry) return `Relocate to ${prefs.goalCountry}`;
  return GOAL_CATEGORIES.find((category) => category.id === prefs.goalCategory)?.label ?? "Your goal";
}

/** Resolve metric label/target for a category, honoring explicit user overrides. */
export function metricFor(prefs: UserPrefs, category?: GoalCategory): { label: string; target: number } {
  const cat = category ?? prefs.goalCategory;
  const preset = DEFAULT_GOAL_METRICS[cat] ?? DEFAULT_GOAL_METRICS.custom;
  // If the saved label belongs to a different category's default, prefer the preset.
  const labelIsFromOtherCat =
    prefs.dailyMetricLabel &&
    Object.entries(DEFAULT_GOAL_METRICS).some(([k, v]) => k !== cat && v.label === prefs.dailyMetricLabel);
  const label = labelIsFromOtherCat ? preset.label : prefs.dailyMetricLabel || preset.label;
  const target = prefs.dailyMetricTarget && prefs.dailyMetricTarget > 0 ? prefs.dailyMetricTarget : preset.target;
  return { label, target };
}

export function useUserPrefs() {
  const { value: prefs, setValue: setPrefs } = useSyncedStorage<UserPrefs>("prefs", DEFAULT_PREFS);
  const safe: UserPrefs = {
    ...DEFAULT_PREFS,
    ...(prefs ?? {}),
    weightUnit: prefs?.weightUnit === "lbs" ? "lbs" : "kg",
    motivationPersonalization: prefs?.motivationPersonalization === "general" ? "general" : "goal",
    customSplitDays: prefs?.customSplitDays?.length ? prefs.customSplitDays : DEFAULT_PREFS.customSplitDays,
  };
  return { prefs: safe, setPrefs, isSetup: safe.questionnaireDone };
}
