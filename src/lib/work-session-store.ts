"use client";
import { useCallback, useEffect, useMemo } from "react";
import { isSupabaseConfigured } from "./supabase/client";
import { useSyncedStorage } from "./use-synced-storage";
import type { FocusActiveState } from "./focus-sprint";
import type { ActiveStudySession } from "./study-focus";
import type { WorkSession, WorkState } from "./work-session";
type Update<T> = T | null | ((previous: T | null) => T | null);
/** One authoritative active record; legacy keys are retained as compatibility mirrors. */
export function useWorkSession() {
  const {
    value: state,
    setValue: setState,
    status,
  } = useSyncedStorage<WorkState | null>("work:active", null);
  const {
    value: legacyFocus,
    setValue: setLegacyFocus,
    status: focusStatus,
  } = useSyncedStorage<FocusActiveState | null>("focus:active", null);
  const {
    value: legacyStudy,
    setValue: setLegacyStudy,
    status: studyStatus,
  } = useSyncedStorage<ActiveStudySession | null>("study:active_session", null);
  const fallback = useMemo<WorkSession | null>(
    () =>
      legacyFocus
        ? { kind: "focus", session: legacyFocus }
        : legacyStudy
          ? { kind: "study", session: legacyStudy }
          : null,
    [legacyFocus, legacyStudy],
  );
  const current = state ? state.current : fallback;
  // Do not seal an empty record before authenticated cloud rows have been pulled.
  useEffect(() => {
    const ready = [status, focusStatus, studyStatus].every(
      (s) => s === "synced" || (!isSupabaseConfigured() && s === "local-only"),
    );
    if (state === null && fallback && ready)
      setState((previous) => previous ?? { version: 1, current: fallback });
  }, [state, fallback, status, focusStatus, studyStatus, setState]);
  const setFocus = useCallback(
    (update: Update<FocusActiveState>, options?: { immediate?: boolean }) => {
      let accepted = false;
      let next: FocusActiveState | null = null;
      setState((previous) => {
        const active = previous
          ? previous.current
          : legacyFocus
            ? { kind: "focus" as const, session: legacyFocus }
            : legacyStudy
              ? { kind: "study" as const, session: legacyStudy }
              : null;
        if (active?.kind === "study") return previous;
        next =
          typeof update === "function"
            ? update(active?.session ?? null)
            : update;
        accepted = true;
        return {
          version: 1,
          current: next ? { kind: "focus", session: next } : null,
        };
      }, options);
      if (accepted) setLegacyFocus(next, options);
    },
    [setState, setLegacyFocus, legacyFocus, legacyStudy],
  );
  const setStudy = useCallback(
    (update: Update<ActiveStudySession>, options?: { immediate?: boolean }) => {
      let accepted = false;
      let next: ActiveStudySession | null = null;
      setState((previous) => {
        const active = previous
          ? previous.current
          : legacyFocus
            ? { kind: "focus" as const, session: legacyFocus }
            : legacyStudy
              ? { kind: "study" as const, session: legacyStudy }
              : null;
        if (active?.kind === "focus") return previous;
        next =
          typeof update === "function"
            ? update(active?.session ?? null)
            : update;
        accepted = true;
        return {
          version: 1,
          current: next ? { kind: "study", session: next } : null,
        };
      }, options);
      if (accepted) setLegacyStudy(next, options);
    },
    [setState, setLegacyStudy, legacyFocus, legacyStudy],
  );
  return {
    focus: current?.kind === "focus" ? current.session : null,
    study: current?.kind === "study" ? current.session : null,
    setFocus,
    setStudy,
    status,
  };
}
