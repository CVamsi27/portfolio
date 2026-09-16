"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";

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
  if (!mounted) {
    mounted = true;
    // Re-read past first paint (server + first client render used initial).
    queueMicrotask(cb);
  }
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
  const localKey = `vk:${key}`;
  const [initialState] = useState(() => initial);
  const subscribe = useCallback((cb: () => void) => subscribeLocal(localKey, cb), [localKey]);
  const getSnapshot = useCallback(
    () => (mounted ? readLocal(localKey, initialState) : initialState),
    [localKey, initialState],
  );
  const getServerSnapshot = useCallback(() => initialState, [initialState]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useSyncedStorage<T>(key: string, initialValue: T) {
  const localKey = `vk:${key}`;
  const metaKey = `vk:meta:${key}`;
  // Stable identity for the empty-state snapshot (inline literals differ per render).
  const [initial] = useState(() => initialValue);
  const [status, setStatus] = useState<SyncStatus>("local-only");
  const { user } = useAuth();
  const subscribe = useCallback((cb: () => void) => subscribeLocal(localKey, cb), [localKey]);
  const getSnapshot = useCallback(
    () => (mounted ? readLocal(localKey, initial) : initial),
    [localKey, initial],
  );
  const getServerSnapshot = useCallback(() => initial, [initial]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // THE one effect: pull the cloud row when the signed-in user changes,
  // merging last-write-wins over local.
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      if (!user) setStatus("local-only");
      return;
    }
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    setStatus("syncing");
    void sb
      .from("tracker_data")
      .select("value, updated_at")
      .eq("user_id", user.id)
      .eq("key", key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus("error");
          return;
        }
        if (data) {
          const cloudAt = new Date(data.updated_at).getTime();
          const localAt = Number(window.localStorage.getItem(metaKey) ?? 0);
          if (cloudAt > localAt) {
            writeLocal(localKey, data.value);
            try {
              window.localStorage.setItem(metaKey, String(cloudAt));
            } catch {
              // ignore
            }
          }
        }
        setStatus("synced");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user?.id]);

  // Push — debounced, in the write path (no effect; React 18+ safely
  // ignores a status set after unmount).
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const push = useCallback(
    (next: T) => {
      if (!isSupabaseConfigured()) return;
      const sb = getSupabase();
      if (!sb) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        void (async () => {
          const { data } = await sb.auth.getSession();
          const uid = data.session?.user?.id;
          if (!uid) {
            setStatus("local-only");
            return;
          }
          setStatus("syncing");
          const now = Date.now();
          const { error } = await sb.from("tracker_data").upsert(
            { user_id: uid, key, value: next as unknown as object, updated_at: new Date(now).toISOString() },
            { onConflict: "user_id,key" },
          );
          if (error) {
            setStatus("error");
            return;
          }
          try {
            window.localStorage.setItem(metaKey, String(now));
          } catch {
            // ignore
          }
          setStatus("synced");
        })();
      }, debounceMs);
    },
    [key, metaKey],
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = mounted ? readLocal(localKey, initial) : initial;
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeLocal(localKey, resolved);
      push(resolved);
    },
    [localKey, initial, push],
  );

  return { value, setValue, status, user } as const;
}
