"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { DEFAULT_REMINDERS, REMINDER_LABELS, type ReminderKey, type ReminderPreferences } from "@/lib/reminders";

function istParts() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** In-app delivery used until background push infrastructure is provisioned. */
export default function ReminderNudges() {
  const { value } = useSyncedStorage<ReminderPreferences>("reminders", DEFAULT_REMINDERS);
  const reminders = value ?? DEFAULT_REMINDERS;
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [clock, setClock] = useState(istParts());

  useEffect(() => {
    const tick = () => setClock(istParts());
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const slots = useMemo(() => [
    ...(["weighIn", "focus", "evening"] as const).map(key => ({ key, slot: reminders[key] })),
    ...(["morning", "study", "roleResearch", "interview", "eveningReview", "windDown"] as const).map(key => ({ key, slot: reminders.career?.[key] ?? DEFAULT_REMINDERS.career[key] })),
  ], [reminders]);
  const due = slots.find(({ key, slot }) => slot.enabled && slot.time === clock.time && dismissed !== `${clock.date}:${key}`);
  useEffect(() => {
    if (!due) return;
    const dedupeKey = `vk:reminder-fired:${clock.date}:${due.key}`;
    if (window.localStorage.getItem(dedupeKey)) return;
    window.localStorage.setItem(dedupeKey, "1");
    if ("Notification" in window && Notification.permission === "granted") new Notification(REMINDER_LABELS[due.key], { body: "Open Personal Buildora to continue your dated career plan." });
  }, [clock.date, due]);
  if (!due) return null;
  const href = ["weighIn", "focus", "evening"].includes(due.key) ? due.key === "weighIn" ? "/weight-loss" : due.key === "focus" ? "/motivation" : "/hub" : "/roadmap";
  return <div role="status" className="fixed inset-x-3 bottom-20 z-[80] mx-auto flex max-w-md items-center gap-3 border border-[#49e7ff]/35 bg-[#071014] p-3 text-sm text-white shadow-[6px_6px_0_rgba(200,255,61,.55)] sm:bottom-5"><BellRing className="h-4 w-4 shrink-0 text-[#c8ff3d]" /><span className="min-w-0 flex-1">{REMINDER_LABELS[due.key]}</span><Link href={href} className="text-xs font-bold uppercase tracking-wide text-[#c8ff3d]">Open</Link><button aria-label="Dismiss reminder" onClick={() => setDismissed(`${clock.date}:${due.key}`)}><X className="h-4 w-4" /></button></div>;
}
