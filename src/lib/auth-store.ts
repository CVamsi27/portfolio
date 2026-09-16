import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * App-wide auth as an external store — zero useEffect.
 * One Supabase subscription lives at module scope; every consumer
 * (gates, buttons, login, sync hook) reads the same snapshot.
 * getServerSnapshot returns null so static prerender matches first paint.
 */

let current: Session | null = null;
let resolved = false;
const listeners = new Set<() => void>();
let attached = false;

function emit() {
  listeners.forEach((l) => l());
}

function attach() {
  if (attached) return;
  const sb = getSupabase();
  if (!sb) return;
  attached = true;
  sb.auth.getSession().then(({ data }) => {
    current = data.session;
    resolved = true;
    emit();
  });
  sb.auth.onAuthStateChange((_e, session) => {
    current = session;
    resolved = true;
    emit();
  });
}

function subscribe(cb: () => void) {
  attach();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const snapSession = () => current;
const snapResolved = () => resolved;
const snapNull = () => null;
const snapFalse = () => false;

export function useAuth() {
  const session = useSyncExternalStore(subscribe, snapSession, snapNull);
  const ready = useSyncExternalStore(subscribe, snapResolved, snapFalse);
  const configured = isSupabaseConfigured();
  return {
    user: session?.user ?? null,
    loading: configured && !ready,
    configured,
  };
}
