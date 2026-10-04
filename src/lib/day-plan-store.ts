"use client";
import { useSyncedStorage } from "./use-synced-storage";
import { isSupabaseConfigured } from "./supabase/client";
import { planningCanEdit } from "./day-plan";
import type { PlanBlock, PlanDay } from "./day-plan";
export function useDayPlan() {
  const blocks = useSyncedStorage<Record<string, PlanBlock>>(
    "plan:blocks",
    {},
    { accountScoped: true, records: true },
  );
  const days = useSyncedStorage<Record<string, PlanDay>>(
    "plan:days",
    {},
    { accountScoped: true, records: true },
  );
  // Signed-in rollout stays gated until migration 0009 and cloud QA are verified.
  const enabled = planningCanEdit(
    isSupabaseConfigured(),
    process.env.NEXT_PUBLIC_DAILY_PLAN_ENABLED,
  );
  return { blocks, days, enabled };
}
