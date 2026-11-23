"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, currentAuthUserId } from "@/lib/auth-store";
import { getSupabase } from "@/lib/supabase/client";
import { shiftDay } from "@/lib/day-plan";
import {
  importedHealthProgress,
  type HealthSourceSelection,
  type ImportedReading,
} from "@/lib/imported-health-progress";

export type HealthConnectDevice = {
  id: string;
  label: string;
  lastSyncAt: string | null;
  revokedAt?: string | null;
  pairedAt?: string;
};

export function useHealthConnectSummary(
  rangeDays: number,
  endDate: string,
  sources: HealthSourceSelection = {},
) {
  const { user, configured } = useAuth();
  const clampedRange = Math.max(1, Math.min(90, rangeDays));
  const from = shiftDay(endDate, -(clampedRange - 1));
  const [devices, setDevices] = useState<HealthConnectDevice[]>([]);
  const [records, setRecords] = useState<ImportedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const generation = useRef(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const owner = currentAuthUserId();
        const session = configured
          ? await getSupabase()?.auth.getSession()
          : null;
        if (configured && !session?.data.session) {
          if (current === generation.current) {
            setDevices([]);
            setRecords([]);
            setLoaded(true);
            setLoading(false);
          }
          return;
        }
        const headers: Record<string, string> = session?.data.session
          ? { Authorization: `Bearer ${session.data.session.access_token}` }
          : {};
        const deviceRes = await fetch("/api/health-connect/devices", {
          cache: "no-store",
          signal: controller.signal,
          headers,
        });
        const deviceData = await deviceRes.json().catch(() => ({}));
        if (!deviceRes.ok) {
          if (deviceRes.status === 401 || deviceRes.status === 503) {
            if (current === generation.current) {
              setDevices([]);
              setRecords([]);
              setLoaded(true);
              setLoading(false);
            }
            return;
          }
          throw Error(
            deviceData.error ?? "Google Health connection unavailable.",
          );
        }
        const all: ImportedReading[] = [];
        let offset = 0;
        while (true) {
          if (current !== generation.current || currentAuthUserId() !== owner)
            return;
          const res = await fetch(
            `/api/health-connect/records?from=${from}&to=${endDate}&limit=100&offset=${offset}`,
            { cache: "no-store", signal: controller.signal, headers },
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok)
            throw Error(data.error ?? "Unable to load Google Health records.");
          if (!Array.isArray(data.records)) break;
          all.push(...data.records);
          offset += data.records.length;
          if (
            offset >= (data.total ?? all.length) ||
            !data.records.length ||
            offset > 5000
          )
            break;
        }
        if (current === generation.current && currentAuthUserId() === owner) {
          setDevices(
            Array.isArray(deviceData.devices) ? deviceData.devices : [],
          );
          setRecords(all);
          setLoaded(true);
        }
      } catch (cause) {
        if (current === generation.current && !controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load Google Health records.",
          );
          setLoaded(true);
        }
      } finally {
        if (current === generation.current) setLoading(false);
      }
    })();
    return () => {
      controller.abort();
      generation.current = current + 1;
    };
  }, [configured, user?.id, from, endDate, tick]);

  const sourcesKey = JSON.stringify(sources);
  const progress = useMemo(() => {
    try {
      return importedHealthProgress(
        records,
        from,
        endDate,
        JSON.parse(sourcesKey) as HealthSourceSelection,
      );
    } catch {
      return importedHealthProgress([], from, endDate, {});
    }
  }, [records, from, endDate, sourcesKey]);

  const activeDevices = useMemo(
    () => devices.filter((d) => !d.revokedAt),
    [devices],
  );

  const connectedDevice = useMemo(() => {
    if (!activeDevices.length) return null;
    return [...activeDevices].sort((a, b) =>
      (b.lastSyncAt ?? "").localeCompare(a.lastSyncAt ?? ""),
    )[0];
  }, [activeDevices]);

  const latestOf = useCallback(
    (pts: Array<{ date: string; value: number | null }>) => {
      for (let i = pts.length - 1; i >= 0; i -= 1) {
        if (pts[i].value !== null) return pts[i];
      }
      return null;
    },
    [],
  );

  const onDate = useCallback(
    (pts: Array<{ date: string; value: number | null }>, date: string) =>
      pts.find((p) => p.date === date)?.value ?? null,
    [],
  );

  const avgOf = useCallback(
    (pts: Array<{ date: string; value: number | null }>) => {
      const vals = pts
        .map((p) => p.value)
        .filter((v): v is number => v !== null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    },
    [],
  );

  const summary = useMemo(() => {
    const latestWeight = latestOf(progress.weight);
    const prevWeight = progress.weight
      .filter((p) => p.value !== null && p.date < (latestWeight?.date ?? ""))
      .at(-1);
    const weightDelta =
      latestWeight?.value != null && prevWeight?.value != null
        ? Number((latestWeight.value - prevWeight.value).toFixed(1))
        : null;
    return {
      todaySteps: onDate(progress.steps, endDate),
      todaySleepMinutes: onDate(progress.sleep, endDate),
      todaySleepStages: progress.sleepStagesByDate[endDate] ?? null,
      todayExerciseMinutes: onDate(progress.exercise, endDate),
      todayExerciseSessions: progress.exerciseSessionsByDate[endDate] ?? [],
      todayActiveCalories: onDate(progress.active_calories, endDate),
      todayHydrationMl: onDate(progress.hydration, endDate),
      todayRestingHr: onDate(progress.resting_hr, endDate),
      latestWeight,
      weightDelta,
      avgSteps: avgOf(progress.steps),
      avgSleepMinutes: avgOf(progress.sleep),
      avgExerciseMinutes: avgOf(progress.exercise),
      avgActiveCalories: avgOf(progress.active_calories),
      hasAnyData:
        progress.steps.some((p) => p.value !== null) ||
        progress.sleep.some((p) => p.value !== null) ||
        progress.weight.some((p) => p.value !== null) ||
        progress.exercise.some((p) => p.value !== null) ||
        progress.active_calories.some((p) => p.value !== null) ||
        progress.hydration.some((p) => p.value !== null) ||
        progress.resting_hr.some((p) => p.value !== null),
    };
  }, [progress, endDate, latestOf, onDate, avgOf]);

  return {
    from,
    to: endDate,
    devices: activeDevices,
    connectedDevice,
    records,
    progress,
    summary,
    loading,
    loaded,
    error,
    refresh,
  };
}
