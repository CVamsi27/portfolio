import { createRoot } from "react-dom/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setSupabaseClientForTesting } from "../../src/lib/supabase/client";
import { useSyncedStorage } from "../../src/lib/use-synced-storage";
import { applyBackup, BACKUP_VERSION } from "../../src/lib/backup";
import { notifyStorageChanged } from "../../src/lib/tracker-store";
import type { CareerTelegramPreferences } from "../../src/lib/career-telegram";

const key = "career:telegram-preferences";
const preferences: CareerTelegramPreferences = {
  version: 1,
  enabled: true,
  cadence: "digest-and-learning",
  digestTime: "06:00",
  timezone: "Asia/Kolkata",
  catchUpMinutes: 10,
  enabledAt: "2026-10-27T00:00:00Z",
};
let account = "fixture-owner";
let authChanged: (event: string, session: unknown) => void;
const cloud = new Map<string, unknown>([[account, preferences]]);
const writes: Array<{ user_id: string; key: string; value: unknown }> = [];
const finishWrites = new Map<number, (result: { error: unknown }) => void>();
let changeValue: (value: CareerTelegramPreferences) => void;
const session = () => ({ user: { id: account } });
const channel = {
  on() {
    return channel;
  },
  subscribe() {
    return channel;
  },
};

setSupabaseClientForTesting({
  auth: {
    getSession: async () => ({ data: { session: session() } }),
    onAuthStateChange: (callback: typeof authChanged) => {
      authChanged = callback;
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
  from: () => {
    let owner = account;
    const query = {
      select() {
        return query;
      },
      eq(column: string, value: string) {
        if (column === "user_id") owner = value;
        return query;
      },
      maybeSingle: async () => ({
        data: cloud.has(owner)
          ? { value: cloud.get(owner), updated_at: "2026-10-27T00:01:00Z" }
          : null,
        error: null,
      }),
      upsert: async (row: (typeof writes)[number]) => {
        const index = writes.push(row) - 1;
        const result = await new Promise<{ error: unknown }>((resolve) => {
          finishWrites.set(index, resolve);
        });
        if (!result.error) cloud.set(row.user_id, row.value);
        return result;
      },
    };
    return query;
  },
  getChannels: () => [],
  channel: () => channel,
  removeChannel() {},
} as unknown as SupabaseClient);

declare global {
  interface Window {
    restoreHarness: {
      restore(): boolean;
      enable(): void;
      acknowledge(error?: boolean, index?: number): boolean;
      switchAccount(): void;
      queueOldAccount(): void;
      inspect(): {
        writes: typeof writes;
        cloud: unknown;
        pending: string | null;
      };
    };
  }
}

window.restoreHarness = {
  restore() {
    const result = applyBackup({
      app: "vk-tracker-suite",
      version: BACKUP_VERSION,
      data: { [key]: preferences },
    });
    notifyStorageChanged();
    return result.ok;
  },
  enable() {
    changeValue({
      ...preferences,
      enabled: true,
      enabledAt: new Date().toISOString(),
    });
  },
  acknowledge(error = false, index = writes.length - 1) {
    const finish = finishWrites.get(index);
    if (!finish) return false;
    finishWrites.delete(index);
    finish({
      error: error ? { message: "fixture write rejected" } : null,
    });
    return true;
  },
  switchAccount() {
    account = "fixture-other";
    authChanged("SIGNED_IN", session());
  },
  queueOldAccount() {
    localStorage.setItem(`vk:account:fixture-owner:${key}:pending`, "true");
    notifyStorageChanged();
  },
  inspect: () => ({
    writes,
    cloud: cloud.get("fixture-owner"),
    pending: localStorage.getItem(`vk:account:fixture-owner:${key}:pending`),
  }),
};

function Probe() {
  const store = useSyncedStorage<CareerTelegramPreferences>(key, {
    ...preferences,
    enabled: false,
    enabledAt: null,
  });
  changeValue = (value) => store.setValue(value, { immediate: true });
  return (
    <output data-testid="restore-store">
      {JSON.stringify({
        value: store.value,
        status: store.status,
        userId: store.user?.id,
      })}
    </output>
  );
}
createRoot(document.getElementById("root")!).render(<Probe />);
