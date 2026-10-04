"use client";
import { useSyncedStorage } from "./use-synced-storage";
export const DEFAULT_MODULES = {
  food: true,
  routine: true,
  study: true,
  recovery: false,
  habits: false,
  fasting: false,
  movement: true,
};
export type PersonalModules = typeof DEFAULT_MODULES;
export function usePersonalModules() {
  return useSyncedStorage<PersonalModules>(
    "personal:modules",
    DEFAULT_MODULES,
    { accountScoped: true },
  );
}
