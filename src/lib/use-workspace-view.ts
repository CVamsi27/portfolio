"use client";
import { useEffect, useState } from "react";

/** Keep a local workspace view in the URL without losing its date or context. */
export function useWorkspaceView<T extends string>(
  views: readonly T[],
  fallback: T,
) {
  const [view, update] = useState<T>(fallback);
  const key = views.join(",");
  useEffect(() => {
    const sync = () => {
      const candidate = new URLSearchParams(window.location.search).get("view");
      update(
        key.split(",").includes(candidate ?? "") ? (candidate as T) : fallback,
      );
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [key, fallback]);
  const setView = (next: T) => {
    if (!views.includes(next)) return;
    const query = new URLSearchParams(window.location.search);
    query.set("view", next);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${query}${window.location.hash}`,
    );
    update(next);
  };
  return [view, setView] as const;
}
