"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase/client.ts";
import { mergeRecords, scopedLocalKey } from "./record-merge.ts";
import { useAuth, currentAuthUserId } from "./auth-store.ts";

export type SyncStatus =
  | "local-only" // no Supabase env configured, or signed out
  | "syncing"
  | "synced"
  | "error";

const debounceMs = 800;

/**
 * Synced store with exactly ONE useEffect (cloud pull, see below).
 *
 * Local state lives in a module-level external store instead of
 * useState + hydration effect:
 * - getServerSnapshot returns the initial value → prerender matches paint
 * - first subscribe() flips `mounted` and re-notifies → real value loads
 * - same-tab writes notify listeners; cross-tab `storage` events do too
 * - snapshots are cached by raw string → stable refs, no render loops
 *
 * The remaining cloud-pull effect is deliberate: local data renders
 * instantly and the cloud progressively enhances it. Suspense would block
 * first paint on a network round-trip — worse UX for the same effect count.
 */
type LocalEntry = { raw: string | null; parsed: unknown };
const localCache = new Map<string, LocalEntry>();
const localListeners = new Map<string, Set<() => void>>();
let mounted = false;

function readLocal<T>(localKey: string, initial: T): T {
  const raw = window.localStorage.getItem(localKey);
  const cached = localCache.get(localKey);
  if (cached && cached.raw === raw) return cached.parsed as T;
  let parsed: T = initial;
  if (raw !== null) {
    try {
      const v = JSON.parse(raw);
      // Guard: JSON.parse("null") === null, or other unexpected types
      if (v !== null && v !== undefined) parsed = v as T;
    } catch {
      // corrupted entry → fall back to initial
    }
  }
  localCache.set(localKey, { raw, parsed });
  return parsed;
}

function notifyLocal(localKey: string) {
  localCache.delete(localKey);
  localListeners.get(localKey)?.forEach((l) => l());
}

function writeLocal(localKey: string, value: unknown) {
  try {
    window.localStorage.setItem(localKey, JSON.stringify(value));
  } catch {
    // quota — cloud push still attempted by the caller
  }
  notifyLocal(localKey);
}

function subscribeLocal(localKey: string, cb: () => void) {
  let set = localListeners.get(localKey);
  if (!set) {
    set = new Set();
    localListeners.set(localKey, set);
  }
  set.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === localKey) notifyLocal(localKey);
  };
  window.addEventListener("storage", onStorage);
  if (!mounted) mounted = true;
  // Every subscriber gets a post-hydration refresh. A sibling component may
  // have claimed the module-level mounted flag before this store subscribed.
  queueMicrotask(cb);
  return () => {
    localListeners.get(localKey)?.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Read-only view of a local key through the same external store —
 * for display-only consumers (e.g. hub summaries). No cloud, no effect.
 */
export function useLocalValue<T>(key: string, initial: T) {
  const { user, configured } = useAuth();
  const localKey = scopedLocalKey(key, user?.id ?? null, configured, true);
  const [initialState] = useState(() => initial);
  const subscribe = useCallback(
    (cb: () => void) => subscribeLocal(localKey, cb),
    [localKey],
  );
  const getSnapshot = useCallback(
    () => (mounted ? readLocal(localKey, initialState) : initialState),
    [localKey, initialState],
  );
  const getServerSnapshot = useCallback(() => initialState, [initialState]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface RealtimeItem {
  key?: string;
  value?: unknown;
  updated_at?: string;
}

export type RealtimeItemCallback = (item: RealtimeItem) => void;

interface UserRealtimeHub {
  channel: RealtimeChannel | null;
  keyListeners: Map<string, Set<RealtimeItemCallback>>;
  teardownTimer: ReturnType<typeof setTimeout> | null;
}

const realtimeHubs = new Map<string, UserRealtimeHub>();

/**
 * Returns active realtime listener state (used for testing and status checks).
 */
export function getRealtimeHubDebugState(userId: string) {
  const hub = realtimeHubs.get(userId);
  if (!hub) return null;
  let totalListeners = 0;
  for (const set of hub.keyListeners.values()) {
    totalListeners += set.size;
  }
  return {
    hasChannel: Boolean(hub.channel),
    totalListeners,
    keys: Array.from(hub.keyListeners.keys()),
    hasPendingTeardown: Boolean(hub.teardownTimer),
  };
}

/**
 * Resets all realtime hubs (used in test teardown).
 */
export function resetRealtimeHubsForTesting() {
  for (const hub of realtimeHubs.values()) {
    if (hub.teardownTimer) clearTimeout(hub.teardownTimer);
  }
  realtimeHubs.clear();
}

/**
 * Subscribes a listener to Postgres changes on `tracker_data` for a specific user and key.
 * Multiplexes all key listeners through a SINGLE Supabase Realtime channel per user,
 * preventing `cannot add postgres_changes callbacks after subscribe()` errors and
 * avoiding socket/channel quota exhaustion when multiple components mount simultaneously.
 */
export function subscribeRealtimeKey(
  userId: string,
  key: string,
  callback: RealtimeItemCallback,
): () => void {
  if (typeof window === "undefined") return () => {};
  if (!isSupabaseConfigured()) return () => {};
  const sb = getSupabase();
  if (!sb) return () => {};

  let hub = realtimeHubs.get(userId);
  if (!hub) {
    hub = {
      channel: null,
      keyListeners: new Map(),
      teardownTimer: null,
    };
    realtimeHubs.set(userId, hub);
  }

  // Cancel any pending delayed teardown
  if (hub.teardownTimer) {
    clearTimeout(hub.teardownTimer);
    hub.teardownTimer = null;
  }

  // Register listener for this key
  let listeners = hub.keyListeners.get(key);
  if (!listeners) {
    listeners = new Set();
    hub.keyListeners.set(key, listeners);
  }
  listeners.add(callback);

  // If channel does not exist yet, initialize and subscribe
  if (!hub.channel) {
    try {
      const channelName = `rt_tracker_data_${userId.slice(0, 8)}`;

      // Clean up any stale channel from Supabase's internal registry with this topic
      const existing = sb
        .getChannels()
        .find((c) => c.topic === `realtime:${channelName}`);
      if (existing) {
        try {
          void sb.removeChannel(existing);
        } catch {
          // ignore
        }
      }

      const channel = sb.channel(channelName).on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tracker_data",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new?: RealtimeItem }) => {
          const item = payload?.new;
          if (!item || !item.key) return;
          const currentHub = realtimeHubs.get(userId);
          const keyCbs = currentHub?.keyListeners.get(item.key);
          if (keyCbs) {
            keyCbs.forEach((cb) => {
              try {
                cb(item);
              } catch (e) {
                console.error("Error in realtime listener callback:", e);
              }
            });
          }
        },
      );

      hub.channel = channel;
      channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Realtime channel subscription error for user", userId);
        }
      });
    } catch (err) {
      console.warn("Failed to initialize Supabase Realtime channel:", err);
    }
  }

  return () => {
    const currentHub = realtimeHubs.get(userId);
    if (!currentHub) return;

    const currentListeners = currentHub.keyListeners.get(key);
    if (currentListeners) {
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        currentHub.keyListeners.delete(key);
      }
    }

    let totalListeners = 0;
    for (const set of currentHub.keyListeners.values()) {
      totalListeners += set.size;
    }

    if (totalListeners === 0) {
      if (currentHub.teardownTimer) clearTimeout(currentHub.teardownTimer);
      currentHub.teardownTimer = setTimeout(() => {
        if (currentHub.channel) {
          try {
            void sb.removeChannel(currentHub.channel);
          } catch {
            // ignore
          }
          currentHub.channel = null;
        }
        realtimeHubs.delete(userId);
      }, 5000);
      (currentHub.teardownTimer as { unref?: () => void }).unref?.();
    }
  };
}

export function useSyncedStorage<T>(
  key: string,
  initialValue: T,
  options?: { accountScoped?: boolean; records?: boolean },
) {
  const { user, configured } = useAuth();
  const scoped = options?.accountScoped !== false;
  const records = options?.records === true;
  const localKey = scopedLocalKey(key, user?.id ?? null, configured, scoped);
  const metaKey = scoped && configured ? `${localKey}:meta` : `vk:meta:${key}`;
  // Stable identity for the empty-state snapshot (inline literals differ per render).
  const [initial] = useState(() => initialValue);
  const [status, setStatus] = useState<SyncStatus>("local-only");
  const subscribe = useCallback(
    (cb: () => void) => subscribeLocal(localKey, cb),
    [localKey],
  );
  const getSnapshot = useCallback(
    () => (mounted ? readLocal(localKey, initial) : initial),
    [localKey, initial],
  );
  const getServerSnapshot = useCallback(() => initial, [initial]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Cloud pull effect: loads row on mount/user change, listens to visibility/focus for instant tab wakeups,
  // and subscribes to Supabase Realtime changes for instant multi-device synchronization.
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      if (!user) setStatus("local-only");
      return;
    }
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;

    const pullCloud = () => {
      if (cancelled) return;
      void sb
        .from("tracker_data")
        .select("value, updated_at")
        .eq("user_id", user.id)
        .eq("key", key)
        .maybeSingle()
        .then(
          ({ data, error }) => {
            if (cancelled) return;
            if (error) {
              setStatus("error");
              return;
            }
            if (data) {
              const cloudAt = new Date(data.updated_at).getTime();
              const localAt = Number(window.localStorage.getItem(metaKey) ?? 0);
              if (records || cloudAt > localAt) {
                writeLocal(
                  localKey,
                  records
                    ? mergeRecords(
                        readLocal(localKey, initial) as never,
                        data.value as never,
                      )
                    : data.value,
                );
                try {
                  window.localStorage.setItem(metaKey, String(cloudAt));
                } catch {
                  // ignore
                }
              }
            }
            setStatus("synced");
          },
          () => {
            if (!cancelled) setStatus("error");
          },
        );
    };

    setStatus("syncing");
    pullCloud();

    // Pull immediately when device wakes up or user focuses tab (e.g. phone screen turned on)
    const onVisible = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        pullCloud();
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    // Supabase Realtime channel subscription multiplexer for instant cross-device updates (phone <-> desktop)
    let unsubscribeRealtime: (() => void) | null = null;
    try {
      unsubscribeRealtime = subscribeRealtimeKey(user.id, key, (item) => {
        if (cancelled) return;
        const cloudAt = new Date(item.updated_at || "").getTime();
        const localAt = Number(window.localStorage.getItem(metaKey) ?? 0);
        if (records || cloudAt > localAt) {
          writeLocal(
            localKey,
            records
              ? mergeRecords(
                  readLocal(localKey, initial) as never,
                  item.value as never,
                )
              : item.value,
          );
          try {
            window.localStorage.setItem(metaKey, String(cloudAt));
          } catch {
            // ignore
          }
        }
        setStatus("synced");
      });
    } catch (err) {
      console.warn("Failed to subscribe to realtime changes:", err);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      if (unsubscribeRealtime) {
        try {
          unsubscribeRealtime();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user?.id, localKey, metaKey, records]);

  // Push — debounced or immediate, in the write path
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    },
    [localKey],
  );
  const push = useCallback(
    (next: T, immediate = false) => {
      if (!isSupabaseConfigured()) return;
      const sb = getSupabase();
      if (!sb) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);

      const doPush = () => {
        void (async () => {
          try {
            const { data } = await sb.auth.getSession();
            const uid = data.session?.user?.id;
            if (
              !uid ||
              (scoped && (uid !== user?.id || uid !== currentAuthUserId()))
            ) {
              setStatus("local-only");
              return;
            }
            setStatus("syncing");
            const now = Date.now();
            const { error, data: merged } = records
              ? await sb.rpc("merge_tracker_records", {
                  p_owner: uid,
                  p_key: key,
                  p_records: next,
                })
              : await sb.from("tracker_data").upsert(
                  {
                    user_id: uid,
                    key,
                    value: next as unknown as object,
                    updated_at: new Date(now).toISOString(),
                  },
                  { onConflict: "user_id,key" },
                );
            if (
              !error &&
              records &&
              merged &&
              (!scoped || uid === currentAuthUserId())
            ) {
              writeLocal(
                localKey,
                mergeRecords(
                  readLocal(localKey, initial) as never,
                  merged as never,
                ),
              );
            }
            if (error) {
              setStatus("error");
              return;
            }
            try {
              window.localStorage.setItem(metaKey, String(now));
            } catch {
              // ignore
            }
            if (
              JSON.stringify(readLocal(localKey, initial)) ===
              JSON.stringify(records ? merged : next)
            )
              window.localStorage.removeItem(`${localKey}:pending`);
            setStatus("synced");
          } catch {
            setStatus("error");
          }
        })();
      };

      if (immediate) {
        doPush();
      } else {
        pushTimer.current = setTimeout(doPush, debounceMs);
      }
    },
    [key, metaKey, localKey, records, scoped, user?.id, initial],
  );

  useEffect(() => {
    if (!user) return;
    const retry = () => {
      if (currentAuthUserId() !== user.id) return;
      if (window.localStorage.getItem(`${localKey}:pending`) === "true")
        push(readLocal(localKey, initial), true);
    };
    const visible = () => {
      if (document.visibilityState === "visible") retry();
    };
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    document.addEventListener("visibilitychange", visible);
    retry();
    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [records, user, localKey, initial, push]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T), options?: { immediate?: boolean }) => {
      if (scoped && configured && !user) return;
      const prev = mounted ? readLocal(localKey, initial) : initial;
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(localKey, JSON.stringify(resolved));
      } catch {
        setStatus("error");
        throw new Error(
          "Device storage is full or unavailable. Your change was not saved.",
        );
      }
      writeLocal(localKey, resolved);
      window.localStorage.setItem(`${localKey}:pending`, "true");
      window.localStorage.setItem(metaKey, String(Date.now()));
      push(resolved, options?.immediate);
    },
    [localKey, metaKey, initial, push, scoped, configured, user],
  );

  return { value, setValue, status, user } as const;
}
