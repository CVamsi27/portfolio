"use client";

import {
  DEFAULT_LOCKDOWN_PREFERENCES,
  normalizeLockdownPreferences,
  type LockdownPreferences,
} from "./lockdown";
import { useSyncedStorage, type SyncStatus } from "./use-synced-storage";

export function useLockdownPreferences(): {
  value: LockdownPreferences;
  setValue: (next: LockdownPreferences | ((previous: LockdownPreferences) => LockdownPreferences)) => void;
  status: SyncStatus;
} {
  const { value: rawValue, setValue, status } = useSyncedStorage<LockdownPreferences>("lockdown:preferences", DEFAULT_LOCKDOWN_PREFERENCES);
  return { value: normalizeLockdownPreferences(rawValue), setValue, status };
}
