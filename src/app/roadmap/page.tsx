"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import { Card, CardContent } from "@/components/ui/card";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey } from "@/lib/trackers";
import { SimpleRing } from "@/components/trackers/Ring";
import {
  BookOpen,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ExternalLink,
  Clock,
  ListChecks,
  Target,
  Flame,
  GitPullRequest,
  Users,
  Mail,
  Search,
  Layers,
  Trophy,
  BarChart2,
  ArrowUpRight,
  Zap,
  MapPin,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const PHASE_META: Record<string, { color: string; bg: string; ring: string; icon: React.ReactNode; short: string }> = {
  "00-strategy":               { color: "#f59e0b", bg: "bg-amber-500/10",   ring: "#f59e0b", icon: <Target className="h-4 w-4" />,       short: "Strategy" },
  "10-frontend / 10.1-javascript": { color: "#facc15", bg: "bg-yellow-400/10", ring: "#facc15", icon: <Zap className="h-4 w-4" />,           short: "JS" },
  "10-frontend / 10.2-typescript": { color: "#3b82f6", bg: "bg-blue-500/10",   ring: "#3b82f6", icon: <Layers className="h-4 w-4" />,        short: "TS" },
  "10-frontend / 10.3-react":      { color: "#06b6d4", bg: "bg-cyan-500/10",   ring: "#06b6d4", icon: <Zap className="h-4 w-4" />,           short: "React" },
  "10-frontend / 10.4-nextjs":     { color: "#a3e635", bg: "bg-lime-400/10",   ring: "#a3e635", icon: <Layers className="h-4 w-4" />,        short: "Next.js" },
  "20-backend / 20.1-nodejs":      { color: "#22c55e", bg: "bg-green-500/10",  ring: "#22c55e", icon: <Flame className="h-4 w-4" />,         short: "Node" },
  "20-backend / 20.2-api":         { color: "#34d399", bg: "bg-emerald-400/10",ring: "#34d399", icon: <Layers className="h-4 w-4" />,        short: "APIs" },
  "20-backend / 20.5-security":    { color: "#f43f5e", bg: "bg-rose-500/10",   ring: "#f43f5e", icon: <Target className="h-4 w-4" />,        short: "Security" },
  "20-backend / 20.3-database":    { color: "#8b5cf6", bg: "bg-violet-500/10", ring: "#8b5cf6", icon: <BarChart2 className="h-4 w-4" />,     short: "DB" },
  "30-architecture / 30.1-design-patterns": { color: "#ec4899", bg: "bg-pink-500/10", ring: "#ec4899", icon: <Layers className="h-4 w-4" />,   short: "Patterns" },
  "30-architecture / 30.2-system-design":   { color: "#f97316", bg: "bg-orange-500/10",ring: "#f97316", icon: <BarChart2 className="h-4 w-4" />,short: "System Design" },
  "30-architecture / 30.3-infra-patterns":  { color: "#d946ef", bg: "bg-fuchsia-500/10",ring:"#d946ef",icon: <Layers className="h-4 w-4" />,   short: "Infra" },
  "40-platform / 40.1-docker":     { color: "#0ea5e9", bg: "bg-sky-500/10",    ring: "#0ea5e9", icon: <Layers className="h-4 w-4" />,        short: "Docker" },
  "40-platform / 40.2-kubernetes": { color: "#3b82f6", bg: "bg-blue-500/10",   ring: "#3b82f6", icon: <Layers className="h-4 w-4" />,        short: "K8s" },
  "40-platform / 40.3-ci-cd":      { color: "#10b981", bg: "bg-emerald-500/10",ring: "#10b981", icon: <Flame className="h-4 w-4" />,         short: "CI/CD" },
  "40-platform / 40.4-observability": { color:"#a78bfa", bg:"bg-violet-400/10",ring:"#a78bfa",  icon: <BarChart2 className="h-4 w-4" />,     short: "Observability" },
  "40-platform / 40.5-build-tools":   { color:"#fb923c", bg:"bg-orange-400/10",ring:"#fb923c",  icon: <Zap className="h-4 w-4" />,           short: "Build Tools" },
  "50-quality / 50.1-testing":     { color: "#4ade80", bg: "bg-green-400/10",  ring: "#4ade80", icon: <CheckSquare className="h-4 w-4" />,   short: "Testing" },
  "50-quality / 50.2-accessibility":{ color: "#fbbf24", bg:"bg-amber-400/10",  ring: "#fbbf24", icon: <Users className="h-4 w-4" />,         short: "A11y" },
  "50-quality / 50.3-performance":  { color: "#f87171", bg:"bg-red-400/10",    ring: "#f87171", icon: <BarChart2 className="h-4 w-4" />,     short: "Perf" },
  "60-realtime / 60.1-websockets":  { color: "#67e8f9", bg:"bg-cyan-400/10",   ring: "#67e8f9", icon: <Zap className="h-4 w-4" />,           short: "WS" },
  "70-interview-toolkit / 70.1-behavioral": { color:"#fb7185",bg:"bg-rose-400/10",ring:"#fb7185",icon:<Users className="h-4 w-4" />,          short: "Behavioral" },
  "70-interview-toolkit / 70.2-coding-patterns": { color:"#a3e635",bg:"bg-lime-400/10",ring:"#a3e635",icon:<Zap className="h-4 w-4" />,       short: "Coding" },
  "70-interview-toolkit / 70.3-cheatsheets": { color:"#fcd34d",bg:"bg-yellow-300/10",ring:"#fcd34d",icon:<Layers className="h-4 w-4" />,      short: "Cheatsheets" },
  "80-lanes-abroad-full-stack":     { color: "#c084fc", bg: "bg-purple-400/10", ring: "#c084fc", icon: <MapPin className="h-4 w-4" />,        short: "Germany Lane" },
};
const DEFAULT_META = { color: "#6b7280", bg: "bg-muted/30", ring: "#6b7280", icon: <BookOpen className="h-4 w-4" />, short: "Study" };

function getMeta(topic: string) {
  return PHASE_META[topic] ?? DEFAULT_META;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(checklist: ChecklistItem[]) {
  if (!checklist.length) return 0;
  return Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
}

// ─── Schedule Block Component ─────────────────────────────────────────────────
function ScheduleRow({ time, activity, isActive }: { time: string; activity: string; isActive: boolean }) {
  const emoji = activity.match(/^([\u{1F300}-\u{1FFFF}]|[\u2600-\u27BF])/u)?.[0] ?? "";
  const text = emoji ? activity.slice(emoji.length).trim() : activity;
  return (
    <div className={`flex gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/40"}`}>
      <span className={`w-28 shrink-0 font-mono text-[11px] ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>{time}</span>
      <span className="flex items-center gap-1.5">
        {emoji && <span>{emoji}</span>}
        <span className={isActive ? "text-foreground font-medium" : "text-foreground/80"}>{text}</span>
        {isActive && <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">NOW</span>}
      </span>
    </div>
  );
}

// ─── Step Row ─────────────────────────────────────────────────────────────────
function StepRow({ step, index, icon }: { step: string; index: number; icon: React.ReactNode }) {
  const linkMatch = step.match(/https?:\/\/\S+/);
  const textBefore = linkMatch ? step.slice(0, step.indexOf(linkMatch[0])) : step;
  const textAfter = linkMatch ? step.slice(step.indexOf(linkMatch[0]) + linkMatch[0].length) : "";
  return (
    <li className="flex gap-3 rounded-lg px-2 py-2 hover:bg-muted/30 transition-colors">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">{index + 1}</span>
      <span className="text-sm leading-relaxed">
        {textBefore}
        {linkMatch && (
          <a href={linkMatch[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:no-underline">
            {linkMatch[0].replace(/https?:\/\//, "").split("/")[0]}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {textAfter}
      </span>
    </li>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────
function CheckItem({
  item,
  onToggle,
}: {
  item: ChecklistItem;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-muted/40 text-left ${item.done ? "opacity-70" : ""}`}
    >
      {item.done ? (
        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
      <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.text}</span>
    </button>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({
  plan,
  onToggle,
  isToday,
}: {
  plan: DayPlan;
  onToggle: (dayNum: number, itemId: string) => void;
  isToday: boolean;
}) {
  const [open, setOpen] = useState(isToday);
  const [tab, setTab] = useState<"schedule" | "steps" | "checklist" | "links">("checklist");
  const progress = pct(plan.checklist);
  const isPast = plan.date < dateKey();
  const meta = getMeta(plan.topic);

  // Determine currently active schedule block based on wall clock
  const nowHHMM = new Date().toTimeString().slice(0, 5);
  function isActiveSlot(timeRange: string) {
    if (!isToday) return false;
    const [start, end] = timeRange.split(" - ");
    if (!start || !end) return false;
    return nowHHMM >= start && nowHHMM < end;
  }

  const doneCount = plan.checklist.filter((c) => c.done).length;

  return (
    <Card variant="dossier" className={`overflow-hidden transition-all duration-200 ${isToday ? "ring-2 ring-primary/60 shadow-lg shadow-primary/10" : ""}`}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 p-4 text-left group">
        {/* Left: day badge with ring */}
        <div className="relative shrink-0">
          <SimpleRing pct={progress} size={48} thickness={6} from={meta.ring} to={meta.ring} className={progress === 0 ? "opacity-30" : ""} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold tabular-nums ${isToday ? "text-primary" : progress === 100 ? "text-emerald-400" : isPast && progress < 100 ? "text-rose-400" : "text-foreground"}`}>
              {plan.day}
            </span>
          </div>
        </div>

        {/* Center: title + metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.bg}`} style={{ color: meta.color }}>
              {meta.icon}
              {meta.short}
            </span>
            {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">TODAY</span>}
            {progress === 100 && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">DONE ✓</span>}
            {isPast && progress < 100 && progress > 0 && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">IN PROGRESS</span>}
            {isPast && progress === 0 && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">OVERDUE</span>}
          </div>
          <p className="font-display font-bold text-sm leading-tight">{plan.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{plan.date} · {doneCount}/{plan.checklist.length} tasks</p>
        </div>

        {/* Right: collapse arrow */}
        <div className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* ── Expanded ───────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border/40">
          {/* Study link CTA */}
          <div className="px-4 pt-4">
            <a
              href={plan.studyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/8 px-4 py-3 hover:bg-primary/15 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary">Open Study Material</p>
                  <p className="text-[11px] text-muted-foreground">study.buildora.work → {plan.topic.split(" / ").pop()}</p>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
            </a>
          </div>

          {/* Quick-action pills */}
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {[
              { icon: <GitPullRequest className="h-3 w-3" />, label: `OSS: ${plan.oSSProject}`, href: plan.oSSProject === "Langfuse" ? "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22" : "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22" },
              { icon: <Users className="h-3 w-3" />, label: `Mock: ${plan.mockInterviewPlatform}`, href: "https://micro1.ai" },
              { icon: <Search className="h-3 w-3" />, label: "Find roles", href: "https://wellfound.com/jobs?q=node+typescript+senior" },
              { icon: <Mail className="h-3 w-3" />, label: `Outreach: ${plan.founderOutreachTarget}`, href: "https://linkedin.com/in/" },
            ].map((p) => (
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 hover:bg-primary/5 transition-colors">
                {p.icon}{p.label}
              </a>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border/40 mt-4 px-4 gap-0">
            {([
              { id: "checklist", icon: <CheckSquare className="h-3.5 w-3.5" />, label: "Checklist" },
              { id: "schedule",  icon: <Clock className="h-3.5 w-3.5" />,       label: "Schedule" },
              { id: "steps",     icon: <ListChecks className="h-3.5 w-3.5" />,  label: "Steps" },
              { id: "links",     icon: <ExternalLink className="h-3.5 w-3.5" />,label: "Links" },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-xs font-medium transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.icon}{t.label}
                {t.id === "checklist" && doneCount > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 text-[10px] text-primary">{doneCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-4 py-4">

            {/* CHECKLIST */}
            {tab === "checklist" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">{doneCount} of {plan.checklist.length} complete</p>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {plan.checklist.map((item) => (
                  <CheckItem key={item.id} item={item} onToggle={() => onToggle(plan.day, item.id)} />
                ))}
              </div>
            )}

            {/* SCHEDULE */}
            {tab === "schedule" && (
              <div className="space-y-1">
                {isToday && <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Active block is highlighted</p>}
                {Object.entries(plan.schedule).map(([time, activity]) => (
                  <ScheduleRow key={time} time={time} activity={activity} isActive={isActiveSlot(time)} />
                ))}
              </div>
            )}

            {/* STEPS */}
            {tab === "steps" && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-3 font-medium uppercase tracking-wider">Complete each step to verify the day is done</p>
                <ol className="space-y-1">
                  {plan.steps.map((step, i) => (
                    <StepRow key={i} step={step} index={i} icon={null} />
                  ))}
                </ol>
              </div>
            )}

            {/* LINKS */}
            {tab === "links" && (
              <div className="space-y-2">
                {[
                  { label: "📖 Study Material", url: plan.studyLink, desc: "Chapter reading on study.buildora.work" },
                  { label: "🐙 Langfuse OSS Issues", url: "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22", desc: "LLM observability tool — good first issues" },
                  { label: "💡 Lightdash OSS Issues", url: "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22", desc: "Open-source BI — great Node+Postgres fit" },
                  { label: "🤖 micro1.ai Mock Interview", url: "https://micro1.ai", desc: "Free AI mock interview platform" },
                  { label: "🤖 interviewsby.ai", url: "https://interviewsby.ai", desc: "System design + coding mock" },
                  { label: "👥 Pramp", url: "https://www.pramp.com", desc: "Peer-to-peer live mock interviews" },
                  { label: "🔍 Wellfound Roles", url: "https://wellfound.com/jobs?q=node+typescript+senior", desc: "Find startup roles matching your stack" },
                  { label: "💼 LinkedIn Jobs", url: "https://www.linkedin.com/jobs/search/?keywords=Senior+Full+Stack+TypeScript", desc: "LinkedIn job search for your stack" },
                  { label: "🇩🇪 Personio Careers", url: "https://www.personio.com/careers/", desc: "Top Munich B2B SaaS target" },
                  { label: "🇩🇪 Doctolib Careers", url: "https://careers.doctolib.com/", desc: "HealthTech — direct domain match" },
                ].map(({ label, url, desc }) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                    <div>
                      <p className="text-xs font-medium">{label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Phase progress bar ───────────────────────────────────────────────────────
function PhaseBar({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const p = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="font-medium truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{done}/{total}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const { value: timetable, setValue: setTimetable } = useSyncedStorage<Timetable | null>("timetable_100_days", null);
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "done">("all");
  const [search, setSearch] = useState("");

  const today = dateKey();
  const days = useMemo(() => timetable?.days ?? [], [timetable]);

  // Stats
  const completedDays = useMemo(() => days.filter((d) => pct(d.checklist) === 100).length, [days]);
  const totalItems = useMemo(() => days.reduce((a, d) => a + d.checklist.length, 0), [days]);
  const doneItems = useMemo(() => days.reduce((a, d) => a + d.checklist.filter((c) => c.done).length, 0), [days]);
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const todayPlan = days.find((d) => d.date === today);
  const todayPct = todayPlan ? pct(todayPlan.checklist) : 0;

  // Phase groups for progress bars
  const phaseGroups = useMemo(() => {
    const groups: Record<string, { label: string; color: string; done: number; total: number }> = {};
    for (const d of days) {
      const meta = getMeta(d.topic);
      const key = d.topic;
      if (!groups[key]) groups[key] = { label: meta.short, color: meta.ring, done: 0, total: 0 };
      groups[key].total++;
      if (pct(d.checklist) === 100) groups[key].done++;
    }
    return Object.values(groups);
  }, [days]);

  // Filtered days
  const filtered = useMemo(() => {
    let result = days;
    if (filter === "today") result = result.filter((d) => d.date === today);
    else if (filter === "pending") result = result.filter((d) => pct(d.checklist) < 100 && d.date <= today);
    else if (filter === "done") result = result.filter((d) => pct(d.checklist) === 100);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(q) || d.topic.toLowerCase().includes(q));
    }
    return result;
  }, [days, filter, today, search]);

  function handleToggle(dayNum: number, itemId: string) {
    if (!timetable) return;
    setTimetable({
      ...timetable,
      days: timetable.days.map((d) =>
        d.day === dayNum
          ? { ...d, checklist: d.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) }
          : d
      ),
    });
  }

  return (
    <RequireAuth>
      <PersonalShell
        icon="book"
        title="100-Day Roadmap"
        subtitle="Bible-driven study plan · daily checklists · OSS contributions · founder outreach."
        eyebrow="NOVA // 100-Day Execution"
      >
        {/* ── Study Bible Banner ── */}
        <a href="https://study.buildora.work" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-5 py-4 hover:bg-primary/15 transition-colors">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-display font-bold text-sm">Software Developer Bible</p>
              <p className="text-[11px] text-muted-foreground">study.buildora.work — 560 chapters, 178h of material</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
        </a>

        {/* ── Hero Stats ── */}
        {days.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Days",     value: String(days.length),     color: "text-foreground",   note: "planned" },
              { label: "Days Complete",  value: String(completedDays),   color: "text-emerald-400",  note: "100% done" },
              { label: "Tasks Done",     value: `${doneItems}/${totalItems}`, color: "text-amber-400", note: "checklist items" },
              { label: "Overall",        value: `${overallPct}%`,        color: "text-primary",      note: "progress" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-card/40 p-3.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{s.note}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Today's Spotlight ── */}
        {todayPlan && (
          <Card variant="dossier" className="ring-2 ring-primary/40 shadow-md shadow-primary/10">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Ring */}
                <div className="relative shrink-0">
                  <SimpleRing pct={todayPct} size={72} thickness={7} from={getMeta(todayPlan.topic).ring} to="#a855f7" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-primary tabular-nums">{todayPct}%</span>
                  </div>
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Day {todayPlan.day} · Today</span>
                  </div>
                  <p className="font-display font-bold text-base leading-tight">{todayPlan.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{todayPlan.topic}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={todayPlan.studyLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                      <BookOpen className="h-3 w-3" /> Open Study
                    </a>
                    <Link href="#today"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors"
                      onClick={() => setFilter("today")}>
                      <ListChecks className="h-3 w-3" /> View Checklist
                    </Link>
                    <a href="https://micro1.ai" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
                      <Users className="h-3 w-3" /> Mock Interview
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Phase Progress Bars ── */}
        {phaseGroups.length > 0 && (
          <Card variant="dossier">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="h-4 w-4 text-primary" />
                <h2 className="font-display font-bold">Phase Progress</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {phaseGroups.map((g) => (
                  <PhaseBar key={g.label} label={g.label} done={g.done} total={g.total} color={g.color} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── External Resources ── */}
        <Card variant="dossier">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="font-display font-bold">Key Resources</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { icon: "📖", label: "Study Bible",         url: "https://study.buildora.work",                                     desc: "All 560 chapters" },
                { icon: "🐙", label: "Langfuse Issues",    url: "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22", desc: "OSS: good first issues" },
                { icon: "💡", label: "Lightdash Issues",   url: "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22",desc: "OSS: Node + Postgres" },
                { icon: "🤖", label: "micro1.ai",          url: "https://micro1.ai",                                                desc: "Free AI mock interview" },
                { icon: "🤖", label: "interviewsby.ai",    url: "https://interviewsby.ai",                                          desc: "System design mock" },
                { icon: "👥", label: "Pramp",              url: "https://www.pramp.com",                                            desc: "Peer mock interviews" },
                { icon: "🔍", label: "Wellfound Jobs",     url: "https://wellfound.com/jobs?q=node+typescript+senior",              desc: "Startup roles" },
                { icon: "🇩🇪", label: "Personio",          url: "https://www.personio.com/careers/",                                desc: "Munich SaaS (fit: 9/10)" },
                { icon: "🇩🇪", label: "Doctolib",          url: "https://careers.doctolib.com/",                                    desc: "HealthTech (fit: 10/10)" },
                { icon: "🇩🇪", label: "N26",               url: "https://n26.com/en/careers",                                       desc: "Berlin FinTech (fit: 8/10)" },
                { icon: "🌐", label: "Toptal",             url: "https://www.toptal.com/developers/apply",                          desc: "Remote top 3% vetting" },
                { icon: "🌐", label: "Turing.com",         url: "https://developers.turing.com/",                                   desc: "Remote Silicon Valley" },
              ].map(({ icon, label, url, desc }) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-card/40 p-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors group">
                  <span className="text-lg shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Filter + Search ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1.5">
            {(["all", "today", "pending", "done"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-card text-muted-foreground hover:border-primary/60"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topic…"
              className="h-8 w-full rounded-full border border-border/70 bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} days</span>
        </div>

        {/* ── Empty ── */}
        {days.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-display font-bold">No roadmap synced yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
              Sign in with cvamsik99@gmail.com and the 78-day timetable will load automatically from the cloud.
            </p>
          </div>
        )}

        {/* ── Day cards ── */}
        <div id="today" className="space-y-2">
          {filtered.map((plan) => (
            <DayCard key={plan.day} plan={plan} onToggle={handleToggle} isToday={plan.date === today} />
          ))}
        </div>
      </PersonalShell>
    </RequireAuth>
  );
}
