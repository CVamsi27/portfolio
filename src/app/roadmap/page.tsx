"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import { Card, CardContent } from "@/components/ui/card";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey } from "@/lib/trackers";
import {
  BookOpen,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ExternalLink,
  ArrowUpRight,
  ListChecks,
  Clock,
} from "lucide-react";

// ─── Types (must match what sync-roadmap.ts writes) ───────────────────────────
interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface DayPlan {
  day: number;
  date: string;
  topic: string;
  chapterId: string;
  title: string;
  studyLink: string;
  practiceLinks: string[];
  schedule: Record<string, string>;
  steps: string[];
  checklist: ChecklistItem[];
  notification: { time: string; message: string };
  oSSProject: string;
  mockInterviewPlatform: string;
  founderOutreachTarget: string;
}

interface Timetable {
  days: DayPlan[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function progressPct(checklist: ChecklistItem[]) {
  if (!checklist.length) return 0;
  return Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
}

function statusColor(pct: number, isPast: boolean) {
  if (pct === 100) return "bg-emerald-500";
  if (pct > 0) return "bg-amber-400";
  if (isPast) return "bg-red-500/70";
  return "bg-muted";
}

// ─── Day card ─────────────────────────────────────────────────────────────────
function DayCard({
  plan,
  onToggle,
  isToday,
}: {
  plan: DayPlan;
  onToggle: (dayIdx: number, itemId: string) => void;
  isToday: boolean;
}) {
  const [open, setOpen] = useState(isToday);
  const pct = progressPct(plan.checklist);
  const isPast = plan.date < dateKey();

  return (
    <Card
      variant="dossier"
      className={`overflow-hidden transition-all ${isToday ? "ring-2 ring-primary/70" : ""}`}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        {/* Day badge */}
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold tabular-nums ${
            isToday
              ? "bg-primary text-primary-foreground"
              : pct === 100
              ? "bg-emerald-500/20 text-emerald-400"
              : isPast
              ? "bg-red-500/10 text-red-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {plan.day}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {plan.date} {isToday && <span className="ml-1 text-primary">· TODAY</span>}
          </p>
          <p className="mt-0.5 truncate font-display font-bold text-sm">{plan.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{plan.topic}</p>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${statusColor(pct, isPast)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-border/50 px-4 pb-5 pt-4 space-y-5">
          {/* Study link CTA */}
          <a
            href={plan.studyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="flex-1">Open Study Material</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>

          {/* Time schedule */}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <Clock className="h-3 w-3" /> Today&apos;s Schedule
            </p>
            <div className="space-y-1">
              {Object.entries(plan.schedule).map(([time, activity]) => (
                <div key={time} className="flex gap-3 text-xs">
                  <span className="w-28 shrink-0 font-mono text-muted-foreground">{time}</span>
                  <span className="text-foreground/90">{activity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <ListChecks className="h-3 w-3" /> Step-by-Step Tasks
            </p>
            <ol className="space-y-1.5 list-none">
              {plan.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Checklist */}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <CheckSquare className="h-3 w-3" /> Completion Checklist
            </p>
            <ul className="space-y-2">
              {plan.checklist.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onToggle(plan.day, item.id)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left"
                  >
                    {item.done ? (
                      <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Extra links */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://study.buildora.work`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/60 transition-colors"
            >
              <BookOpen className="h-3 w-3" /> study.buildora.work
            </a>
            <a
              href={`https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/60 transition-colors"
            >
              🐙 OSS: {plan.oSSProject}
            </a>
            <a
              href="https://micro1.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/60 transition-colors"
            >
              🤖 Mock: {plan.mockInterviewPlatform}
            </a>
            <a
              href="https://wellfound.com/jobs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/60 transition-colors"
            >
              🎯 Outreach: {plan.founderOutreachTarget}
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const { value: timetable, setValue: setTimetable } = useSyncedStorage<Timetable | null>(
    "timetable_100_days",
    null
  );

  const today = dateKey();
  const days = useMemo(() => timetable?.days ?? [], [timetable]);
  const todayDay = days.find((d) => d.date === today);
  const totalDone = days.reduce((acc, d) => acc + d.checklist.filter((c) => c.done).length, 0);
  const totalItems = days.reduce((acc, d) => acc + d.checklist.length, 0);
  const completedDays = days.filter((d) => progressPct(d.checklist) === 100).length;

  // Filter state
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "done">("all");

  const filtered = useMemo(() => {
    switch (filter) {
      case "today":
        return days.filter((d) => d.date === today);
      case "pending":
        return days.filter((d) => progressPct(d.checklist) < 100 && d.date <= today);
      case "done":
        return days.filter((d) => progressPct(d.checklist) === 100);
      default:
        return days;
    }
  }, [days, filter, today]);

  function handleToggle(dayNumber: number, itemId: string) {
    if (!timetable) return;
    const next: Timetable = {
      ...timetable,
      days: timetable.days.map((d) =>
        d.day === dayNumber
          ? {
              ...d,
              checklist: d.checklist.map((c) =>
                c.id === itemId ? { ...c, done: !c.done } : c
              ),
            }
          : d
      ),
    };
    setTimetable(next);
  }

  return (
    <RequireAuth>
      <PersonalShell
        icon="book"
        title="100-Day Roadmap"
        subtitle="Your complete bible-driven study plan, OSS targets, and outreach schedule — all in one place."
        eyebrow="NOVA // Study Roadmap"
      >
        {/* ── Study Bible banner ── */}
        <a
          href="https://study.buildora.work"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-5 py-4 hover:bg-primary/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-display font-bold text-sm">Software Developer Bible</p>
              <p className="text-xs text-muted-foreground">study.buildora.work — your full stack curriculum</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
        </a>

        {/* ── Stats row ── */}
        {days.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total days", value: `${days.length}`, color: "text-foreground" },
              { label: "Days complete", value: `${completedDays}`, color: "text-emerald-400" },
              {
                label: "Checklist",
                value: `${totalDone}/${totalItems}`,
                color: "text-amber-400",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-card/40 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
                <p className={`mt-1 font-display text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Today's plan highlight ── */}
        {todayDay && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1">
              🗓 Today — Day {todayDay.day}
            </p>
            <p className="font-display font-bold text-sm">{todayDay.title}</p>
            <a
              href={todayDay.studyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" /> Open study material <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "today", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-card text-muted-foreground hover:border-primary/60"
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">
            {filtered.length} days
          </span>
        </div>

        {/* ── Empty state ── */}
        {days.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-display font-bold">No roadmap data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in and the timetable will sync from the cloud automatically.
            </p>
          </div>
        )}

        {/* ── Day cards ── */}
        <div className="space-y-3">
          {filtered.map((plan) => (
            <DayCard
              key={plan.day}
              plan={plan}
              onToggle={handleToggle}
              isToday={plan.date === today}
            />
          ))}
        </div>
      </PersonalShell>
    </RequireAuth>
  );
}
