"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { DEFAULT_REMINDERS, REMINDER_LABELS, type ReminderPreferences } from "@/lib/reminders";

function nowTime() { return new Date().toTimeString().slice(0, 5); }

/** In-app delivery used until background push infrastructure is provisioned. */
export default function ReminderNudges() {
  const { value } = useSyncedStorage<ReminderPreferences>("reminders", DEFAULT_REMINDERS);
  const reminders = value ?? DEFAULT_REMINDERS;
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [minute, setMinute] = useState(nowTime());

  useEffect(() => {
    const tick = () => setMinute(nowTime());
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const due = useMemo(() => (['weighIn', 'focus', 'evening'] as const)
    .map((key) => [key, reminders[key]] as const)
    .find(([key, slot]) => slot.enabled && slot.time === minute && dismissed !== `${key}:${minute}`), [dismissed, minute, reminders]);
  if (!due) return null;
  const [key] = due;
  const href = key === "weighIn" ? "/weight-loss" : key === "focus" ? "/motivation" : "/hub";
  return <div role="status" className="fixed inset-x-3 bottom-20 z-[80] mx-auto flex max-w-md items-center gap-3 border border-[#49e7ff]/35 bg-[#071014] p-3 text-sm text-white shadow-[6px_6px_0_rgba(200,255,61,.55)] sm:bottom-5"><BellRing className="h-4 w-4 shrink-0 text-[#c8ff3d]" /><span className="min-w-0 flex-1">{REMINDER_LABELS[key]}</span><Link href={href} className="text-xs font-bold uppercase tracking-wide text-[#c8ff3d]">Open</Link><button aria-label="Dismiss reminder" onClick={() => setDismissed(`${key}:${minute}`)}><X className="h-4 w-4" /></button></div>;
}
