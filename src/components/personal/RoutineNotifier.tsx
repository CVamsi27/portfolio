"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRoutine } from "@/lib/routine-store";
import { useNow } from "@/lib/tracker-store";
import { routineOccurrences, zonedDate } from "@/lib/routine-reminders";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-store";
export default function RoutineNotifier() {
  const routine = useRoutine();
  const now = useNow(30_000);
  const { toast } = useToast();
  const { user, configured } = useAuth();
  useEffect(() => {
    if (configured && !user) return;
    const groups = new Map<number, string[]>();
    const dates = new Set(
      routine.items.map((item) => zonedDate(now, item.timezone)),
    );
    for (const date of dates)
      for (const item of routineOccurrences(routine.items, date)) {
        const saved = routine.history.value[item.id];
        const record = saved && !saved.deleted ? saved : undefined;
        if (record && record.status !== "snoozed") continue;
        const at = record?.snoozeUntil ?? item.scheduledAt;
        if (at > now || now - at > 15 * 60_000) continue;
        const names = groups.get(at) ?? [];
        names.push(item.label);
        groups.set(at, names);
      }
    for (const [at, names] of groups) {
      const key = `vk:routine-alert:${user?.id ?? "local"}:${at}`;
      try {
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "seen");
        toast({
          title: names.join(" + "),
          description: (
            <Link href="/routine" className="text-primary underline">
              Due now · log, snooze or skip
            </Link>
          ),
        });
      } catch {
        /* Reminders remain in checklist if browser storage is unavailable. */
      }
    }
  }, [routine.items, routine.history.value, now, toast, user, configured]);
  return null;
}
