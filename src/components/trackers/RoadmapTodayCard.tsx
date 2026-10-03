"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useAuth } from "@/lib/auth-store";
import { personalSchedule } from "@/lib/personal-timetable";
import { dateKey } from "@/lib/trackers";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleRing } from "@/components/trackers/Ring";
import {
  BookOpen, CheckSquare, Square, Flame, ArrowUpRight,
  Users, GitPullRequest, MapPin, Brain, ShieldCheck, RotateCcw, Headphones,
  CalendarDays,
} from "lucide-react";
import DailyTimetable from "@/components/trackers/DailyTimetable";
import DeepStudyCockpitModal from "@/components/study/DeepStudyCockpitModal";
import FullPageRevisionGate from "@/components/study/FullPageRevisionGate";
import StudyBreakLoungeModal from "@/components/study/StudyBreakLoungeModal";
import curriculum from "@/data/career-curriculum.json";
import type { CompletedChapterRecord } from "@/lib/study-focus";
import { type ExtendedCompletedChapter, getDueRevisionItems } from "@/lib/revision-engine";

interface ChecklistItem { id: string; text: string; done: boolean }
interface DayPlan {
  day: number; date: string; topic: string; title: string;
  studyLink: string; mission: string; practiceTask: string;
  interviewQuestions: string[];
  checklist: ChecklistItem[];
  schedule: Record<string, string | { label: string; minutes?: number; work?: boolean; output?: string }>;
  oSSProject: string; mockInterviewPlatform: string; founderOutreachTarget: string;
}
interface Timetable { days: DayPlan[] }

function pct(cl: ChecklistItem[]) {
  return cl.length ? Math.round(cl.filter(c => c.done).length / cl.length * 100) : 0;
}

const TOPIC_COLOR: Record<string, string> = {
  "00-strategy": "#f59e0b",
  "10-frontend / 10.1-javascript": "#facc15",
  "10-frontend / 10.2-typescript": "#3b82f6",
  "10-frontend / 10.3-react": "#06b6d4",
  "10-frontend / 10.4-nextjs": "#a3e635",
  "20-backend / 20.1-nodejs": "#22c55e",
  "20-backend / 20.2-api": "#34d399",
  "20-backend / 20.5-security": "#f43f5e",
  "20-backend / 20.3-database": "#8b5cf6",
  "30-architecture / 30.1-design-patterns": "#ec4899",
  "30-architecture / 30.2-system-design": "#f97316",
  "30-architecture / 30.3-infra-patterns": "#d946ef",
  "40-platform / 40.1-docker": "#0ea5e9",
  "40-platform / 40.2-kubernetes": "#3b82f6",
  "40-platform / 40.3-ci-cd": "#10b981",
  "40-platform / 40.4-observability": "#a78bfa",
  "40-platform / 40.5-build-tools": "#fb923c",
  "50-quality / 50.1-testing": "#4ade80",
  "50-quality / 50.2-accessibility": "#fbbf24",
  "50-quality / 50.3-performance": "#f87171",
  "60-realtime / 60.1-websockets": "#67e8f9",
  "70-interview-toolkit / 70.1-behavioral": "#fb7185",
  "70-interview-toolkit / 70.2-coding-patterns": "#a3e635",
  "70-interview-toolkit / 70.3-cheatsheets": "#fcd34d",
  "80-lanes-abroad-full-stack": "#c084fc",
};

function HubMotivationStrip({ todayDate }: { todayDate: string }) {
  const days = (curriculum.days as unknown as DayPlan[]) ?? [];
  const dayIndex = days.findIndex(d => d.date === todayDate);
  if (dayIndex < 0) return null;
  let streak = 0;
  for (let i = dayIndex - 1; i >= 0; i -= 1) {
    if (pct(days[i].checklist ?? []) === 100) streak += 1; else break;
  }
  if (pct(days[dayIndex].checklist ?? []) === 100) streak += 1;
  const recent = days.slice(Math.max(0, dayIndex - 6), dayIndex + 1);
  const completedRecent = recent.filter(d => pct(d.checklist ?? []) === 100).length;
  return (
    <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 p-2.5">
        <Flame className={`h-4 w-4 ${streak > 0 ? "text-rose-400" : "text-muted-foreground"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Streak</p>
          <p className="font-mono text-base font-bold tabular-nums leading-tight">{streak} day{streak === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 p-2.5">
        <CalendarDays className="h-4 w-4 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last 7 days</p>
          <p className="font-mono text-base font-bold tabular-nums leading-tight">{completedRecent}/{recent.length} <span className="text-xs font-normal text-muted-foreground">full days</span></p>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapTodayCard() {
  const { user } = useAuth();
  const aligned = personalSchedule(user?.email, new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()));
  const { value: timetable, setValue: setTimetable } = useSyncedStorage<Timetable | null>("timetable_100_days", null);
  const { value: completedChapters } = useSyncedStorage<ExtendedCompletedChapter[]>("study:completed_chapters", []);
  const today = aligned !== undefined ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()) : dateKey();
  const [studyCockpitOpen, setStudyCockpitOpen] = useState(false);
  const [revisionGateOpen, setRevisionGateOpen] = useState(false);
  const [breakLoungeOpen, setBreakLoungeOpen] = useState(false);

  const dueRevisionList = useMemo(() => {
    return getDueRevisionItems(completedChapters || []);
  }, [completedChapters]);


  const plan = useMemo(() => {
    const userPlan = timetable?.days?.find(d => d.date === today);
    if (userPlan) return userPlan;
    const curriculumDay = curriculum.days.find(d => d.date === today) ?? curriculum.days[0];
    return curriculumDay as unknown as DayPlan;
  }, [timetable, today]);

  const todayChapters = useMemo(() => {
    return curriculum.days.find(d => d.date === today)?.chapters || [];
  }, [today]);
  const masteredTodayCount = useMemo(() => {
    const set = new Set((completedChapters || []).map(c => c.chapterId));
    return todayChapters.filter(ch => set.has(ch.id)).length;
  }, [todayChapters, completedChapters]);
  const allTodayMastered = todayChapters.length > 0 && masteredTodayCount === todayChapters.length;


  const progress = pct(plan.checklist);
  const ringColor = TOPIC_COLOR[plan.topic] ?? "#6b7280";
  const doneCount = plan.checklist.filter(c => c.done).length;
  const todayQ = plan.interviewQuestions?.[(plan.day - 1) % (plan.interviewQuestions?.length || 1)];

  function toggle(itemId: string) {
    const baseTimetable = timetable ?? { days: curriculum.days as unknown as DayPlan[] };
    setTimetable({
      ...baseTimetable,
      days: baseTimetable.days.map(d =>
        d.date === today
          ? { ...d, checklist: d.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) }
          : d
      ),
    });
  }

  return (
    <Card variant="dossier" className="ring-2 ring-primary/40 shadow-lg shadow-primary/10 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <div className="relative shrink-0">
            <SimpleRing pct={progress} size={56} thickness={7} from={ringColor} to="#a855f7" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold tabular-nums text-primary">{progress}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Day {plan.day} of 78 · Today
              </span>
            </div>
            <p className="mt-0.5 font-display font-bold text-sm leading-snug">{plan.title}</p>
            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
              <span>{doneCount}/{plan.checklist.length} tasks done</span>
              {todayChapters.length > 0 && (
                <>
                  <span>·</span>
                  <span className={allTodayMastered ? "text-emerald-400 font-semibold" : "text-cyan-400 font-semibold"}>
                    {allTodayMastered ? "All study mastered" : `${masteredTodayCount}/${todayChapters.length} study mastered`}
                  </span>
                </>
              )}
            </div>
          </div>
          <Link href="/roadmap"
            className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
            Full Plan →
          </Link>
        </div>

        <div className="mx-4 mb-3">
          <DailyTimetable schedule={aligned ?? plan.schedule ?? {}} date={plan.date} timeZone={aligned !== undefined ? "Asia/Kolkata" : undefined} />
        </div>

        {/* Today's mission */}
        <div className="mx-4 mb-3 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Today&apos;s goal</p>
          <p className="text-xs leading-relaxed text-foreground/90">{plan.mission}</p>
        </div>

        {/* Motivation strip: streak + week */}
        <HubMotivationStrip todayDate={today} />

        {/* Checklist (first 4 items) */}
        <div className="px-4 pb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Today&apos;s Checklist</p>
          <div className="space-y-0.5">
            {plan.checklist.slice(0, 4).map(item => (
              <button key={item.id} onClick={() => toggle(item.id)}
                className={`flex w-full items-start gap-2 rounded px-1.5 py-1.5 text-left text-xs hover:bg-muted/40 transition-colors ${item.done ? "opacity-60" : ""}`}>
                {item.done
                  ? <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  : <Square className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interview Q of the day */}
        {todayQ && (
          <div className="mx-4 mt-3 mb-3 rounded-lg border border-violet-500/20 bg-violet-500/8 px-3 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-1 flex items-center gap-1">
              <Brain className="h-3 w-3" /> Interview Q of the Day
            </p>
            <p className="text-xs leading-relaxed">{todayQ}</p>
          </div>
        )}

        {/* Quick action row */}
        <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={() => setStudyCockpitOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
          >
            <ShieldCheck className="h-3 w-3" />
            {allTodayMastered ? "Review Focus Sprint" : "Deep Focus Sprint"}
          </button>
          <a href={plan.studyLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
            <BookOpen className="h-3 w-3" />Web tab
          </a>
          <a href={plan.oSSProject === "Langfuse"
              ? "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22"
              : "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22"}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
            <GitPullRequest className="h-3 w-3" />OSS
          </a>
          <a href={plan.mockInterviewPlatform === "micro1.ai" ? "https://micro1.ai" : "https://interviewsby.ai"}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
            <Users className="h-3 w-3" />Mock
          </a>
          <a href="https://wellfound.com/jobs?q=node+typescript+senior"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors">
            <MapPin className="h-3 w-3" />Roles
          </a>
            <Link href="/roadmap"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors">
            <ArrowUpRight className="h-3 w-3" />All Details
          </Link>
          <button
            type="button"
            onClick={() => setRevisionGateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 text-amber-400" />
            <span>Recall Gate{dueRevisionList.length > 0 ? ` (${dueRevisionList.length})` : ""}</span>
          </button>
          <button
            type="button"
            onClick={() => setBreakLoungeOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
            title="Mindful Audio Break: YouTube Music & Top 10 Tech Podcasts"
          >
            <Headphones className="h-3 w-3 text-cyan-400" />
            <span>Audio Break</span>
          </button>
        </div>

        <DeepStudyCockpitModal
          open={studyCockpitOpen}
          dayNumber={plan.day}
          onClose={() => setStudyCockpitOpen(false)}
        />
        <FullPageRevisionGate
          open={revisionGateOpen}
          onClose={() => setRevisionGateOpen(false)}
        />
        <StudyBreakLoungeModal
          open={breakLoungeOpen}
          onClose={() => setBreakLoungeOpen(false)}
        />
      </CardContent>
    </Card>
  );
}
