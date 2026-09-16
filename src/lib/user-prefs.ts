"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useSyncedStorage } from "./use-synced-storage";

export type GoalCategory =
  | "relocation"
  | "fitness"
  | "career"
  | "learning"
  | "financial"
  | "custom";

export type WorkoutSplit = "fullbody" | "push-pull-legs" | "upper-lower" | "custom";

export type MotivationStyle = "discipline" | "resilience" | "growth" | "health" | "career" | "stoic";

export type UserPrefs = {
  name: string;
  goalCategory: GoalCategory;
  goalTitle: string; // e.g. "Relocate to Germany" or custom
  workoutDaysPerWeek: number;
  workoutSplit: WorkoutSplit;
  customExercises: string[];
  fastingEnabled: boolean;
  fastingProtocolId: string;
  motivationStyle: MotivationStyle;
  questionnaireDone: boolean;
};

const DEFAULT_PREFS: UserPrefs = {
  name: "",
  goalCategory: "relocation",
  goalTitle: "",
  workoutDaysPerWeek: 4,
  workoutSplit: "fullbody",
  customExercises: [],
  fastingEnabled: true,
  fastingProtocolId: "16-8",
  motivationStyle: "discipline",
  questionnaireDone: false,
};

export const GOAL_CATEGORIES: { id: GoalCategory; label: string; icon: string; desc: string }[] = [
  { id: "relocation", label: "Relocation", icon: "🌍", desc: "Move to a new country" },
  { id: "fitness", label: "Fitness", icon: "💪", desc: "Build strength and health" },
  { id: "career", label: "Career Growth", icon: "🚀", desc: "Level up professionally" },
  { id: "learning", label: "Learning", icon: "📚", desc: "Master new skills" },
  { id: "financial", label: "Financial", icon: "💰", desc: "Build wealth and freedom" },
  { id: "custom", label: "Custom", icon: "✨", desc: "Define your own path" },
];

export const WORKOUT_SPLITS: { id: WorkoutSplit; label: string; desc: string }[] = [
  { id: "fullbody", label: "Full Body", desc: "Hit every muscle each session" },
  { id: "push-pull-legs", label: "Push/Pull/Legs", desc: "6-day rotation" },
  { id: "upper-lower", label: "Upper/Lower", desc: "4-day split" },
  { id: "custom", label: "Custom", desc: "Your own routine" },
];

export const MOTIVATION_STYLES: { id: MotivationStyle; label: string; desc: string }[] = [
  { id: "discipline", label: "Discipline", desc: "Consistency over motivation" },
  { id: "resilience", label: "Resilience", desc: "Bounce back from setbacks" },
  { id: "growth", label: "Growth Mindset", desc: "Always improving" },
  { id: "health", label: "Health First", desc: "Body and mind" },
  { id: "career", label: "Career Drive", desc: "Professional ambition" },
  { id: "stoic", label: "Stoic", desc: "Calm, focused, unstoppable" },
];

export function useUserPrefs() {
  const { value: prefs, setValue: setPrefs } = useSyncedStorage<UserPrefs>("prefs", DEFAULT_PREFS);
  const safe = prefs ?? DEFAULT_PREFS;
  return { prefs: safe, setPrefs, isSetup: safe.questionnaireDone };
}
