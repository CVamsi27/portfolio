"use client";

import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalValue } from "@/lib/use-synced-storage";

import { TrackerIcon, type TrackerIconName } from "@/components/trackers/icons";
import { ArrowRight } from "lucide-react";

const CARDS: { href: string; icon: TrackerIconName; title: string; desc: string; key: string }[] = [
  { href: "/intermittent-fasting", icon: "timer", title: "Intermittent Fasting", desc: "Live ring timer, protocol picker, scrub timeline, recent fasts.", key: "vk:fasting" },
  { href: "/motivation", icon: "flame", title: "Motivation", desc: "Quote of the day, shuffle deck, saved fuel for hard days.", key: "vk:motivation:favs" },
  { href: "/goal", icon: "flag", title: "Germany Goal", desc: "Outreach velocity, visa checklist, application log, outreach snippets.", key: "vk:goal" },
  { href: "/workout-tracking", icon: "workout", title: "Workout Tracking", desc: "Full Body log, week strip, sets/reps analytics vs baseline.", key: "vk:workouts" },
  { href: "/todo", icon: "todo", title: "Todo", desc: "Quick daily list with today filter and progress bar.", key: "vk:todos" },
  { href: "/share", icon: "share", title: "Share", desc: "Quick-drop text + images, copy/download, JSON export.", key: "vk:share" },
];

function summaryOf(key: string, v: unknown): string {
  if (v == null) return "…";
  if (Array.isArray(v)) return v.length ? `${v.length} saved` : "Not started";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (key === "vk:fasting" && typeof o.elapsedSec === "number")
      return `${((o.elapsedSec as number) / 3600).toFixed(1)}h · ${String(o.phase)}`;
    if (key === "vk:goal") {
      const done = ((o.checks as boolean[] | undefined) ?? []).filter(Boolean).length;
      const apps = Object.values((o.appsByDay as Record<string, number> | undefined) ?? {}).reduce<number>(
        (a, b) => a + (b as number),
        0,
      );
      return `${apps} apps · ${done}/4 visa`;
    }
    if (key === "vk:workouts") {
      const days = Object.keys(o).length;
      return days ? `${days} days logged` : "Not started";
    }
    if (key === "vk:todos") {
      const arr = o as unknown as { done: boolean }[];
      return Array.isArray(arr) ? `${arr.filter((t) => !t.done).length} open` : "Active";
    }
  }
  return "Active";
}

function HubCard({ meta }: { meta: (typeof CARDS)[number] }) {
  // Store-backed read: live across tabs, no loader effect ("…" pre-mount).
  const stored = useLocalValue(meta.key.replace(/^vk:/, ""), null as unknown);
  return (
    <Link href={meta.href} className="group">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
        <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 shadow-md shadow-primary/20"
                >
                  <TrackerIcon name={meta.icon} className="h-5 w-5 text-white" />
                </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
              {summaryOf(meta.key, stored)}
            </span>
          </div>
          <h2 className="font-display mt-3 font-bold group-hover:text-primary">
            {meta.title} <ArrowRight className="mb-0.5 inline h-4 w-4" />
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{meta.desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TrackersHub() {
  return (
    <RequireAuth>
    <TrackerShell
      icon="hub"
      title="Trackers"
      subtitle="Grab-and-go hub. Pick a tracker below — each page is a single-pager that saves to your browser automatically."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <HubCard key={c.href} meta={c} />
        ))}
      </div>
    </TrackerShell>
    </RequireAuth>
  );
}
