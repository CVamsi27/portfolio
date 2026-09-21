import type { WeightUnit } from "./user-prefs";
import { displayToKg, kgToDisplay } from "./trackers";

export type RecoveryCheckIn = {
  energy: 1 | 2 | 3 | 4 | 5;
  sleep: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  updatedAt: number;
};

export type WeightEntry = { weightKg: number; note?: string; updatedAt: number };

export type WeightLossState = {
  targetKg?: number;
  entries: Record<string, WeightEntry>;
  recoveryByDay: Record<string, RecoveryCheckIn>;
};

export const DEFAULT_WEIGHT_LOSS_STATE: WeightLossState = { entries: {}, recoveryByDay: {} };

export function weightTrend(entries: Record<string, WeightEntry>, days = 7): number | null {
  const weights = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([, entry]) => entry.weightKg);
  if (weights.length < 2) return null;
  return Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10;
}

export function displayWeight(weightKg: number | undefined, unit: WeightUnit): string {
  return weightKg == null ? "—" : `${Math.round(kgToDisplay(weightKg, unit) * 10) / 10} ${unit}`;
}

export function inputToKg(value: number, unit: WeightUnit): number {
  return Math.round(displayToKg(value, unit) * 100) / 100;
}
