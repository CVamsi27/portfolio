import type { FocusMinutes, FocusSessionMode } from "./focus-sprint";
export type FocusPreferences = {
  plannedMinutes: FocusMinutes;
  mode: FocusSessionMode;
  fullscreen: boolean;
};
export const DEFAULT_FOCUS_PREFERENCES: FocusPreferences = {
  plannedMinutes: 25,
  mode: "timed",
  fullscreen: false,
};
export function focusPreferences(value: unknown): FocusPreferences {
  const raw = (
    value && typeof value === "object" ? value : {}
  ) as Partial<FocusPreferences>;
  return {
    plannedMinutes: [25, 50, 90].includes(raw.plannedMinutes ?? 0)
      ? raw.plannedMinutes!
      : 25,
    mode: raw.mode === "open" ? "open" : "timed",
    fullscreen: raw.fullscreen === true,
  };
}
