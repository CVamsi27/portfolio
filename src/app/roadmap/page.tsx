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
  BookOpen, CheckSquare, Square, ChevronDown, ChevronUp,
  CalendarDays, ExternalLink, Clock, ListChecks, Target,
  Flame, GitPullRequest, Users, Mail, Search, Layers,
  Trophy, BarChart2, ArrowUpRight, Zap, MapPin, AlertTriangle,
  Copy, CheckCheck, Star, Briefcase, Globe, Code2, Brain,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChecklistItem { id: string; text: string; done: boolean }
interface DayPlan {
  day: number; date: string; topic: string; chapterId: string; title: string;
  studyLink: string; schedule: Record<string, string>;
  mission: string; practiceTask: string;
  interviewQuestions: string[];
  steps: string[]; checklist: ChecklistItem[];
  notification: { time: string; message: string };
  oSSProject: string; mockInterviewPlatform: string; founderOutreachTarget: string;
  resources: { label: string; url: string }[];
}
interface Timetable { days: DayPlan[] }

interface CareerData {
  resumeAnalysis: {
    strengths: { item: string; impact: string; fitScore: number }[];
    gaps: { item: string; action: string; urgency: string }[];
  };
  targetRoles: {
    germany: { company: string; city: string; role: string; fitScore: number; salary: string; link: string; status: string; notes: string }[];
    remote: { company: string; role: string; fitScore: number; link: string; status: string; notes: string }[];
  };
  outreachTemplates: { germanySaaS: string; remote: string; ossMaintainer: string };
  germanyChecklist: { id: string; text: string; done: boolean; link?: string }[];
  weeklyTargets: Record<string, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PHASE_COLORS: Record<string, { ring: string; bg: string; short: string }> = {
  "00-strategy": { ring: "#f59e0b", bg: "bg-amber-500/10", short: "Strategy" },
  "10-frontend / 10.1-javascript": { ring: "#facc15", bg: "bg-yellow-400/10", short: "JS" },
  "10-frontend / 10.2-typescript": { ring: "#3b82f6", bg: "bg-blue-500/10",   short: "TS" },
  "10-frontend / 10.3-react":      { ring: "#06b6d4", bg: "bg-cyan-500/10",   short: "React" },
  "10-frontend / 10.4-nextjs":     { ring: "#a3e635", bg: "bg-lime-400/10",   short: "Next.js" },
  "20-backend / 20.1-nodejs":      { ring: "#22c55e", bg: "bg-green-500/10",  short: "Node/NestJS" },
  "20-backend / 20.2-api":         { ring: "#34d399", bg: "bg-emerald-400/10",short: "APIs" },
  "20-backend / 20.5-security":    { ring: "#f43f5e", bg: "bg-rose-500/10",   short: "Security" },
  "20-backend / 20.3-database":    { ring: "#8b5cf6", bg: "bg-violet-500/10", short: "PostgreSQL" },
  "30-architecture / 30.1-design-patterns": { ring: "#ec4899", bg: "bg-pink-500/10",    short: "Patterns" },
  "30-architecture / 30.2-system-design":   { ring: "#f97316", bg: "bg-orange-500/10",  short: "Sys Design" },
  "30-architecture / 30.3-infra-patterns":  { ring: "#d946ef", bg: "bg-fuchsia-500/10", short: "Infra" },
  "40-platform / 40.1-docker":     { ring: "#0ea5e9", bg: "bg-sky-500/10",    short: "Docker" },
  "40-platform / 40.2-kubernetes": { ring: "#3b82f6", bg: "bg-blue-500/10",   short: "K8s" },
  "40-platform / 40.3-ci-cd":      { ring: "#10b981", bg: "bg-emerald-500/10",short: "CI/CD" },
  "40-platform / 40.4-observability": { ring: "#a78bfa", bg: "bg-violet-400/10", short: "Observability" },
  "40-platform / 40.5-build-tools":   { ring: "#fb923c", bg: "bg-orange-400/10", short: "Build Tools" },
  "50-quality / 50.1-testing":     { ring: "#4ade80", bg: "bg-green-400/10",  short: "Testing" },
  "50-quality / 50.2-accessibility":{ ring: "#fbbf24", bg: "bg-amber-400/10", short: "A11y" },
  "50-quality / 50.3-performance":  { ring: "#f87171", bg: "bg-red-400/10",   short: "Performance" },
  "60-realtime / 60.1-websockets":  { ring: "#67e8f9", bg: "bg-cyan-400/10",  short: "Real-time" },
  "70-interview-toolkit / 70.1-behavioral":     { ring: "#fb7185", bg: "bg-rose-400/10",  short: "Behavioral" },
  "70-interview-toolkit / 70.2-coding-patterns":{ ring: "#a3e635", bg: "bg-lime-400/10",  short: "LeetCode" },
  "70-interview-toolkit / 70.3-cheatsheets":    { ring: "#fcd34d", bg: "bg-yellow-300/10",short: "Cheatsheets" },
  "80-lanes-abroad-full-stack":     { ring: "#c084fc", bg: "bg-purple-400/10", short: "🇩🇪 Germany" },
};
const DEF_COLOR = { ring: "#6b7280", bg: "bg-muted/30", short: "Study" };
function getColor(topic: string) { return PHASE_COLORS[topic] ?? DEF_COLOR; }
function pct(cl: ChecklistItem[]) { return cl.length ? Math.round(cl.filter(c => c.done).length / cl.length * 100) : 0; }

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
      {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Schedule row ─────────────────────────────────────────────────────────────
function ScheduleRow({ time, activity, isActive }: { time: string; activity: string; isActive: boolean }) {
  return (
    <div className={`flex gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${isActive ? "bg-primary/12 ring-1 ring-primary/30" : "hover:bg-muted/40"}`}>
      <span className={`w-28 shrink-0 font-mono text-[11px] ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>{time}</span>
      <span className={`${isActive ? "text-foreground font-medium" : "text-foreground/80"}`}>
        {activity}
        {isActive && <span className="ml-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">NOW</span>}
      </span>
    </div>
  );
}

// ─── Day card ─────────────────────────────────────────────────────────────────
function DayCard({ plan, onToggle, isToday }: { plan: DayPlan; onToggle: (d: number, id: string) => void; isToday: boolean }) {
  const [open, setOpen] = useState(isToday);
  const [tab, setTab] = useState<"checklist" | "mission" | "schedule" | "steps" | "interview" | "links">("checklist");
  const progress = pct(plan.checklist);
  const isPast = plan.date < dateKey();
  const color = getColor(plan.topic);
  const doneCount = plan.checklist.filter(c => c.done).length;
  const nowHH = new Date().toTimeString().slice(0, 5);
  function isActive(t: string) {
    if (!isToday) return false;
    const [s, e] = t.split(" - ");
    return !!s && !!e && nowHH >= s && nowHH < e;
  }

  const TABS = [
    { id: "checklist" as const, icon: <CheckSquare className="h-3.5 w-3.5" />, label: "Checklist" },
    { id: "mission" as const,   icon: <Target className="h-3.5 w-3.5" />,      label: "Mission" },
    { id: "schedule" as const,  icon: <Clock className="h-3.5 w-3.5" />,       label: "Schedule" },
    { id: "steps" as const,     icon: <ListChecks className="h-3.5 w-3.5" />,  label: "Steps" },
    { id: "interview" as const, icon: <Brain className="h-3.5 w-3.5" />,       label: "Interview Q" },
    { id: "links" as const,     icon: <ExternalLink className="h-3.5 w-3.5" />,label: "Links" },
  ];

  return (
    <Card variant="dossier" className={`overflow-hidden transition-all duration-200 ${isToday ? "ring-2 ring-primary/60 shadow-lg shadow-primary/10" : ""}`}>
      {/* ── Header ── */}
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-start gap-3 p-4 text-left group">
        <div className="relative shrink-0">
          <SimpleRing pct={progress} size={48} thickness={6} from={color.ring} to={color.ring} className={progress === 0 && !isToday ? "opacity-25" : ""} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold tabular-nums ${isToday ? "text-primary" : progress === 100 ? "text-emerald-400" : isPast && progress === 0 ? "text-rose-400" : "text-foreground"}`}>{plan.day}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${color.bg}`} style={{ color: color.ring }}>{color.short}</span>
            {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">TODAY</span>}
            {progress === 100 && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">✓ DONE</span>}
            {isPast && progress > 0 && progress < 100 && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">IN PROGRESS</span>}
            {isPast && progress === 0 && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">⚠ OVERDUE</span>}
          </div>
          <p className="font-display font-bold text-sm leading-tight">{plan.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{plan.date} · {doneCount}/{plan.checklist.length} done</p>
          {/* Mini progress bar */}
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: color.ring }} />
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
      </button>

      {/* ── Expanded ── */}
      {open && (
        <div className="border-t border-border/40">
          {/* Study link */}
          <div className="px-4 pt-3">
            <a href={plan.studyLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/8 px-4 py-3 hover:bg-primary/14 transition-colors">
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary">Open Study Material →</p>
                  <p className="text-[11px] text-muted-foreground">study.buildora.work · {plan.topic.split(" / ").pop()}</p>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
            </a>
          </div>

          {/* Quick pills */}
          <div className="flex flex-wrap gap-1.5 px-4 pt-2.5">
            {[
              { icon: <GitPullRequest className="h-3 w-3" />, label: `OSS: ${plan.oSSProject}`, href: plan.oSSProject === "Langfuse" ? "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22" : "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22" },
              { icon: <Users className="h-3 w-3" />, label: `Mock: ${plan.mockInterviewPlatform}`, href: plan.mockInterviewPlatform === "micro1.ai" ? "https://micro1.ai" : "https://interviewsby.ai" },
              { icon: <Search className="h-3 w-3" />, label: "Find Roles", href: "https://wellfound.com/jobs?q=node+typescript+senior" },
            ].map(p => (
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-2.5 py-1 text-[11px] hover:border-primary/50 hover:bg-primary/5 transition-colors">
                {p.icon}{p.label}
              </a>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-border/40 mt-3 px-4 gap-0 scrollbar-none">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1 border-b-2 px-2.5 pb-2 pt-1 text-[11px] font-medium transition-colors whitespace-nowrap ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.icon}{t.label}
                {t.id === "checklist" && doneCount > 0 && <span className="rounded-full bg-primary/20 px-1 text-[10px] text-primary">{doneCount}</span>}
              </button>
            ))}
          </div>

          <div className="px-4 py-4 space-y-3">
            {/* CHECKLIST */}
            {tab === "checklist" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verify completion — tick each when actually done</p>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{doneCount}/{plan.checklist.length}</span>
                </div>
                <div className="space-y-0.5">
                  {plan.checklist.map(item => (
                    <button key={item.id} onClick={() => onToggle(plan.day, item.id)}
                      className={`group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all hover:bg-muted/40 text-left ${item.done ? "opacity-65" : ""}`}>
                      {item.done
                        ? <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        : <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />}
                      <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MISSION */}
            {tab === "mission" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5"><Flame className="h-3.5 w-3.5" />Daily Mission</p>
                  <p className="text-sm leading-relaxed">{plan.mission}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/8 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5" />Practice Challenge</p>
                  <p className="text-sm leading-relaxed">{plan.practiceTask}</p>
                </div>
              </div>
            )}

            {/* SCHEDULE */}
            {tab === "schedule" && (
              <div className="space-y-0.5">
                {isToday && <p className="text-[10px] text-primary font-semibold mb-2">Active block highlighted based on current time</p>}
                {Object.entries(plan.schedule).map(([time, activity]) => (
                  <ScheduleRow key={time} time={time} activity={activity} isActive={isActive(time)} />
                ))}
              </div>
            )}

            {/* STEPS */}
            {tab === "steps" && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Complete in order — each step builds on the last</p>
                <ol className="space-y-2">
                  {plan.steps.map((step, i) => {
                    const url = step.match(/https?:\/\/\S+/)?.[0];
                    const before = url ? step.slice(0, step.indexOf(url)) : step;
                    const after = url ? step.slice(step.indexOf(url) + url.length) : "";
                    return (
                      <li key={i} className="flex gap-3 rounded-lg px-2.5 py-2.5 hover:bg-muted/30 transition-colors">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                        <span className="text-sm leading-relaxed">
                          {before}
                          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:no-underline inline-flex items-center gap-0.5">{url.replace(/https?:\/\//, "").split("/")[0]}<ExternalLink className="h-3 w-3" /></a>}
                          {after}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* INTERVIEW Q */}
            {tab === "interview" && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Answer each out loud. Record yourself. This IS the interview.</p>
                <div className="space-y-2">
                  {plan.interviewQuestions.map((q, i) => (
                    <div key={i} className={`rounded-lg border p-3 transition-colors ${i === (plan.day - 1) % plan.interviewQuestions.length ? "border-primary/40 bg-primary/8" : "border-border/40 bg-card/40"}`}>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-[10px] font-bold text-muted-foreground shrink-0">Q{i + 1}</span>
                        <p className="text-sm">{q}</p>
                      </div>
                      {i === (plan.day - 1) % plan.interviewQuestions.length && (
                        <p className="mt-1.5 text-[10px] text-primary font-semibold">← TODAY&apos;S FOCUS QUESTION</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LINKS */}
            {tab === "links" && (
              <div className="space-y-1.5">
                {plan.resources.map(({ label, url }) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors group">
                    <p className="text-xs font-medium group-hover:text-primary transition-colors">{label}</p>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
                <a href="https://study.buildora.work" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/8 px-3 py-2.5 hover:bg-primary/14 transition-colors group">
                  <p className="text-xs font-medium text-primary">📖 study.buildora.work — full chapter</p>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Career Command Center sections ──────────────────────────────────────────
function ResumeSection({ data }: { data: CareerData["resumeAnalysis"] }) {
  const [tab, setTab] = useState<"strengths" | "gaps">("gaps");
  return (
    <Card variant="dossier">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-amber-400" />
          <h2 className="font-display font-bold">Resume Analysis</h2>
        </div>
        <div className="flex gap-2 mb-4">
          {(["gaps", "strengths"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-primary/50"}`}>
              {t === "gaps" ? "⚠ Gaps to Fix" : "✓ Strengths"}
            </button>
          ))}
        </div>
        {tab === "strengths" && (
          <div className="space-y-2">
            {data.strengths.map((s, i) => (
              <div key={i} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-emerald-400">{s.item}</p>
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">{s.fitScore}/10</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.impact}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "gaps" && (
          <div className="space-y-2">
            {data.gaps.map((g, i) => (
              <div key={i} className={`rounded-lg border p-3 ${g.urgency === "critical" ? "border-rose-500/30 bg-rose-500/8" : g.urgency === "high" ? "border-amber-500/30 bg-amber-500/8" : "border-border/40 bg-card/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold">{g.item}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${g.urgency === "critical" ? "bg-rose-500/20 text-rose-400" : g.urgency === "high" ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>{g.urgency}</span>
                </div>
                <p className="mt-1 text-xs text-primary">{g.action}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RolesSection({ data }: { data: CareerData["targetRoles"] }) {
  const [tab, setTab] = useState<"germany" | "remote">("germany");
  return (
    <Card variant="dossier">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-4 w-4 text-primary" />
          <h2 className="font-display font-bold">Target Roles</h2>
        </div>
        <div className="flex gap-2 mb-4">
          {(["germany", "remote"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-primary/50"}`}>
              {t === "germany" ? "🇩🇪 Germany" : "🌐 Remote"}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {(tab === "germany" ? data.germany : data.remote).map((r, i) => (
            <div key={i} className="rounded-lg border border-border/40 bg-card/30 p-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold">{r.company}</p>
                    {"city" in r && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{(r as { city: string }).city}</span>}
                    {"salary" in r && <span className="text-[10px] text-emerald-400 font-mono">{(r as { salary: string }).salary}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.role}</p>
                  <p className="text-[11px] text-foreground/70 mt-1">{r.notes}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{r.fitScore}/10</span>
                  <a href={r.link} target="_blank" rel="noopener noreferrer"
                    className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] font-medium hover:border-primary/50 transition-colors">
                    Apply →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OutreachSection({ templates }: { templates: CareerData["outreachTemplates"] }) {
  const TMPL = [
    { label: "🇩🇪 Germany SaaS", key: "germanySaaS" as const },
    { label: "🌐 Remote", key: "remote" as const },
    { label: "🐙 OSS Maintainer", key: "ossMaintainer" as const },
  ];
  const [active, setActive] = useState<keyof CareerData["outreachTemplates"]>("germanySaaS");
  return (
    <Card variant="dossier">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="font-display font-bold">Outreach Templates</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">Copy → personalise → send</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {TMPL.map(t => (
            <button key={t.key} onClick={() => setActive(t.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-primary/50"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <pre className="rounded-xl border border-border/40 bg-muted/20 p-4 text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-mono overflow-x-auto">{templates[active]}</pre>
          <div className="mt-2">
            <CopyBtn text={templates[active]} label="Copy Template" />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Replace {`{Company}`}, {`{Name}`}, and the product observation before sending. Personalise every message.</p>
      </CardContent>
    </Card>
  );
}

function GermanyChecklist({ items, onToggle }: { items: CareerData["germanyChecklist"]; onToggle: (id: string) => void }) {
  const done = items.filter(i => i.done).length;
  return (
    <Card variant="dossier">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-400" />
            <h2 className="font-display font-bold">🇩🇪 Germany Relocation Checklist</h2>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{done}/{items.length}</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${items.length ? Math.round(done / items.length * 100) : 0}%` }} />
        </div>
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id} className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 hover:bg-muted/30 transition-colors ${item.done ? "opacity-60" : ""}`}>
              <button onClick={() => onToggle(item.id)} className="mt-0.5 shrink-0">
                {item.done ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-xs leading-relaxed ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text}</p>
              </div>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const { value: timetable, setValue: setTimetable } = useSyncedStorage<Timetable | null>("timetable_100_days", null);
  const { value: career, setValue: setCareer } = useSyncedStorage<CareerData | null>("career_command_center", null);
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "done">("all");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<"roadmap" | "career" | "germany" | "outreach">("roadmap");
  const { toast } = useToast();

  const today = dateKey();
  const days = useMemo(() => timetable?.days ?? [], [timetable]);
  const completedDays = useMemo(() => days.filter(d => pct(d.checklist) === 100).length, [days]);
  const totalItems = useMemo(() => days.reduce((a, d) => a + d.checklist.length, 0), [days]);
  const doneItems = useMemo(() => days.reduce((a, d) => a + d.checklist.filter(c => c.done).length, 0), [days]);
  const overallPct = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0;
  const todayPlan = days.find(d => d.date === today);
  const todayPct = todayPlan ? pct(todayPlan.checklist) : 0;

  const phaseGroups = useMemo(() => {
    const groups: Record<string, { label: string; ring: string; done: number; total: number }> = {};
    for (const d of days) {
      const c = getColor(d.topic);
      if (!groups[d.topic]) groups[d.topic] = { label: c.short, ring: c.ring, done: 0, total: 0 };
      groups[d.topic].total++;
      if (pct(d.checklist) === 100) groups[d.topic].done++;
    }
    return Object.values(groups);
  }, [days]);

  const filtered = useMemo(() => {
    let r = days;
    if (filter === "today") r = r.filter(d => d.date === today);
    else if (filter === "pending") r = r.filter(d => pct(d.checklist) < 100 && d.date <= today);
    else if (filter === "done") r = r.filter(d => pct(d.checklist) === 100);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(d => d.title.toLowerCase().includes(q) || d.topic.toLowerCase().includes(q));
    }
    return r;
  }, [days, filter, today, search]);

  function toggleChecklist(dayNum: number, itemId: string) {
    if (!timetable) return;
    setTimetable({ ...timetable, days: timetable.days.map(d => d.day === dayNum ? { ...d, checklist: d.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) } : d) });
  }

  function toggleGermany(id: string) {
    if (!career) return;
    setCareer({ ...career, germanyChecklist: career.germanyChecklist.map(i => i.id === id ? { ...i, done: !i.done } : i) });
    toast({ title: "Progress saved!", description: "Germany checklist updated." });
  }

  const NAV = [
    { id: "roadmap" as const,  label: "📅 Roadmap",        icon: <CalendarDays className="h-4 w-4" /> },
    { id: "career" as const,   label: "🎯 Resume & Roles",  icon: <Target className="h-4 w-4" /> },
    { id: "outreach" as const, label: "✉️  Outreach",        icon: <Mail className="h-4 w-4" /> },
    { id: "germany" as const,  label: "🇩🇪 Germany",         icon: <MapPin className="h-4 w-4" /> },
  ];

  return (
    <RequireAuth>
      <PersonalShell icon="book" title="Career Command Center" subtitle="100-day plan · resume · target roles · outreach · Germany relocation." eyebrow="NOVA // Execution">
        {/* Study Bible banner */}
        <a href="https://study.buildora.work" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3.5 hover:bg-primary/15 transition-colors">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-display font-bold text-sm">Software Developer Bible</p>
              <p className="text-[11px] text-muted-foreground">study.buildora.work · 560 chapters · 178h of material · your full curriculum</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
        </a>

        {/* Section nav */}
        <div className="flex gap-2 flex-wrap">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${section === n.id ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-primary/50"}`}>
              {n.icon}{n.label}
            </button>
          ))}
        </div>

        {/* ── ROADMAP SECTION ── */}
        {section === "roadmap" && (
          <>
            {/* Stats */}
            {days.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Days", value: String(days.length), color: "text-foreground", note: "planned" },
                  { label: "Days Done", value: String(completedDays), color: "text-emerald-400", note: "100% complete" },
                  { label: "Tasks Done", value: `${doneItems}/${totalItems}`, color: "text-amber-400", note: "checklist" },
                  { label: "Overall", value: `${overallPct}%`, color: "text-primary", note: "progress" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border/60 bg-card/40 p-3.5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                    <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.note}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Today spotlight */}
            {todayPlan && (
              <Card variant="dossier" className="ring-2 ring-primary/40 shadow-md shadow-primary/10">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <SimpleRing pct={todayPct} size={68} thickness={7} from={getColor(todayPlan.topic).ring} to="#a855f7" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary tabular-nums">{todayPct}%</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Day {todayPlan.day} · Today</span>
                      </div>
                      <p className="font-display font-bold">{todayPlan.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{todayPlan.mission?.slice(0, 130)}…</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a href={todayPlan.studyLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                          <BookOpen className="h-3 w-3" />Open Study
                        </a>
                        <button onClick={() => setFilter("today")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
                          <ListChecks className="h-3 w-3" />Checklist
                        </button>
                        <a href="https://micro1.ai" target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
                          <Users className="h-3 w-3" />Mock Interview
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phase bars */}
            {phaseGroups.length > 0 && (
              <Card variant="dossier">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    <h2 className="font-display font-bold">Phase Progress</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {phaseGroups.map(g => (
                      <div key={g.label} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium truncate">{g.label}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{g.done}/{g.total}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${g.total ? Math.round(g.done / g.total * 100) : 0}%`, background: g.ring }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter + search */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1.5">
                {(["all", "today", "pending", "done"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-card text-muted-foreground hover:border-primary/60"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topic…"
                  className="h-8 w-full rounded-full border border-border/70 bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length} days</span>
            </div>

            {days.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="font-display font-bold">Timetable syncing…</p>
                <p className="mt-1 text-sm text-muted-foreground">Sign in as cvamsik99@gmail.com — data loads automatically.</p>
              </div>
            )}

            <div className="space-y-2">
              {filtered.map(plan => (
                <DayCard key={plan.day} plan={plan} onToggle={toggleChecklist} isToday={plan.date === today} />
              ))}
            </div>
          </>
        )}

        {/* ── CAREER SECTION ── */}
        {section === "career" && career && (
          <>
            <ResumeSection data={career.resumeAnalysis} />
            <RolesSection data={career.targetRoles} />
          </>
        )}
        {section === "career" && !career && (
          <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-display font-bold">Career data loading…</p>
          </div>
        )}

        {/* ── OUTREACH SECTION ── */}
        {section === "outreach" && career && (
          <>
            <OutreachSection templates={career.outreachTemplates} />
            <Card variant="dossier">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h2 className="font-display font-bold">Outreach Rules</h2>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    "Send 10 messages per day — no exceptions. Consistency beats perfection.",
                    "Always include 1 specific product observation. Shows you've done research.",
                    "Follow up after 5 days with: 'Just bumping this up in case it was buried.'",
                    "LinkedIn + Email both. Find emails at hunter.io or Apollo.io.",
                    "Target CTOs and Engineering Managers — not HR. Direct is faster.",
                    "Track every message: company, date sent, response, follow-up date.",
                  ].map((r, i) => (
                    <li key={i} className="flex gap-2.5 text-foreground/80">
                      <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card variant="dossier">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-bold">Where to Find Contacts</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { label: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/search/?keywords=Senior+Full+Stack+TypeScript&location=Germany", desc: "Primary channel" },
                    { label: "Wellfound (AngelList)", url: "https://wellfound.com/jobs?q=node+typescript&l=germany", desc: "Startup roles" },
                    { label: "Hunter.io", url: "https://hunter.io", desc: "Find email addresses" },
                    { label: "Apollo.io", url: "https://www.apollo.io", desc: "Contact database" },
                    { label: "Glassdoor Germany Jobs", url: "https://www.glassdoor.de/Job/germany-senior-software-engineer-jobs-SRCH_IL.0,7_IN96_KO8,32.htm", desc: "Salary + reviews" },
                    { label: "StepStone Germany", url: "https://www.stepstone.de/Jobs/Beruf/software-engineer.html", desc: "German job board" },
                    { label: "XING Jobs", url: "https://www.xing.com/jobs", desc: "German LinkedIn" },
                    { label: "Make It In Germany", url: "https://www.make-it-in-germany.com", desc: "Official portal" },
                  ].map(({ label, url, desc }) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/40 p-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold group-hover:text-primary transition-colors">{label}</p>
                        <p className="text-[11px] text-muted-foreground">{desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── GERMANY SECTION ── */}
        {section === "germany" && career && (
          <>
            <GermanyChecklist items={career.germanyChecklist} onToggle={toggleGermany} />
            <Card variant="dossier">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <h2 className="font-display font-bold">EU Blue Card — Key Facts</h2>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { q: "Minimum salary (IT shortage occupation)", a: "€41,041/year gross (2025)" },
                    { q: "Minimum salary (standard)", a: "€45,552/year gross (2025)" },
                    { q: "Degree requirement", a: "Recognised university degree — KL University qualifies (check anabin.kmk.org)" },
                    { q: "Processing time", a: "4–12 weeks after job offer + blocked account + degree docs" },
                    { q: "What you need", a: "Job offer + degree certificate (apostilled) + blocked account + health insurance" },
                    { q: "Path to PR", a: "Blue Card → 21 months (B1 German) or 33 months without language" },
                    { q: "German language required?", a: "Not for the Blue Card, but critical for interviews and integration. Start NOW." },
                  ].map(({ q, a }) => (
                    <div key={q} className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                      <p className="font-semibold text-muted-foreground">{q}</p>
                      <p className="mt-0.5 font-medium text-primary">{a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card variant="dossier">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-bold">Top Target Companies</h2>
                </div>
                <div className="space-y-2">
                  {career.targetRoles.germany.map(r => (
                    <a key={r.company} href={r.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2.5 hover:border-primary/40 transition-colors group">
                      <div>
                        <p className="text-xs font-bold group-hover:text-primary transition-colors">{r.company} <span className="text-muted-foreground font-normal">· {r.city}</span></p>
                        <p className="text-[11px] text-muted-foreground">{r.role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-emerald-400 font-mono">{r.salary}</span>
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">{r.fitScore}/10</span>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
        {section === "germany" && !career && (
          <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-display font-bold">Data loading…</p>
          </div>
        )}
      </PersonalShell>
    </RequireAuth>
  );
}
