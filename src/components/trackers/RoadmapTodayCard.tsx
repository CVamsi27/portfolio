"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey } from "@/lib/trackers";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleRing } from "@/components/trackers/Ring";
import {
  BookOpen, CheckSquare, Square, Flame, Clock, ArrowUpRight,
  Users, GitPullRequest, MapPin, Brain,
} from "lucide-react";

interface ChecklistItem { id: string; text: string; done: boolean }
interface DayPlan {
  day: number; date: string; topic: string; title: string;
  studyLink: string; mission: string; practiceTask: string;
  interviewQuestions: string[];
  checklist: ChecklistItem[];
  schedule: Record<string, string>;
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

/** Send a browser notification once per day at 08:00 */
function useDailyNotification(plan: DayPlan | undefined) {
  useEffect(() => {
    if (!plan || typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const STORAGE_KEY = `notif_sent_${plan.date}`;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const now = new Date();
    const h = now.getHours();
    // Fire if we're between 08:00 and 12:00 and haven't sent yet today
    if (h < 8 || h >= 12) return;

    const send = () => {
      if (Notification.permission === "granted") {
        new Notification(`Day ${plan.day}: ${plan.title}`, {
          body: plan.mission.slice(0, 150),
          icon: "/icon.svg",
          badge: "/icon.svg",
          tag: `roadmap-${plan.date}`,
        });
        localStorage.setItem(STORAGE_KEY, "1");
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then(perm => {
          if (perm === "granted") {
            new Notification(`Day ${plan.day}: ${plan.title}`, {
              body: plan.mission.slice(0, 150),
              icon: "/icon.svg",
              tag: `roadmap-${plan.date}`,
            });
            localStorage.setItem(STORAGE_KEY, "1");
          }
        });
      }
    };

    // Immediate or schedule for 08:00
    send();
  }, [plan]);
}

export default function RoadmapTodayCard() {
  const { value: timetable, setValue: setTimetable } = useSyncedStorage<Timetable | null>("timetable_100_days", null);
  const today = dateKey();

  const plan = useMemo(() => timetable?.days?.find(d => d.date === today), [timetable, today]);

  useDailyNotification(plan);

  if (!plan) return null;

  const progress = pct(plan.checklist);
  const ringColor = TOPIC_COLOR[plan.topic] ?? "#6b7280";
  const doneCount = plan.checklist.filter(c => c.done).length;
  const nowHH = new Date().toTimeString().slice(0, 5);

  // Find active schedule block
  const activeBlock = Object.entries(plan.schedule).find(([time]) => {
    const [s, e] = time.split(" - ");
    return s && e && nowHH >= s && nowHH < e;
  });

  const todayQ = plan.interviewQuestions?.[(plan.day - 1) % (plan.interviewQuestions?.length || 1)];

  function toggle(itemId: string) {
    if (!timetable) return;
    setTimetable({
      ...timetable,
      days: timetable.days.map(d =>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Day {plan.day} of 78 · Today
              </span>
            </div>
            <p className="mt-0.5 font-display font-bold text-sm leading-snug">{plan.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{doneCount}/{plan.checklist.length} tasks done</p>
          </div>
          <Link href="/roadmap"
            className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors">
            Full Plan →
          </Link>
        </div>

        {/* Now block */}
        {activeBlock && (
          <div className="mx-4 mb-3 rounded-lg bg-primary/10 px-3 py-2 ring-1 ring-primary/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Now — {activeBlock[0]}
            </p>
            <p className="mt-0.5 text-xs text-foreground/90">{activeBlock[1]}</p>
          </div>
        )}

        {/* Today's mission */}
        <div className="mx-4 mb-3 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Today&apos;s goal</p>
          <p className="text-xs leading-relaxed text-foreground/90">{plan.mission}</p>
        </div>

        {/* Checklist (first 4 items) */}
        <div className="px-4 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Today&apos;s Checklist</p>
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1 flex items-center gap-1">
              <Brain className="h-3 w-3" /> Interview Q of the Day
            </p>
            <p className="text-xs leading-relaxed">{todayQ}</p>
          </div>
        )}

        {/* Quick action row */}
        <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
          <a href={plan.studyLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <BookOpen className="h-3 w-3" />Study
          </a>
          <a href={plan.oSSProject === "Langfuse"
              ? "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22"
              : "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22"}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] hover:border-primary/50 transition-colors">
            <GitPullRequest className="h-3 w-3" />OSS
          </a>
          <a href={plan.mockInterviewPlatform === "micro1.ai" ? "https://micro1.ai" : "https://interviewsby.ai"}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] hover:border-primary/50 transition-colors">
            <Users className="h-3 w-3" />Mock
          </a>
          <a href="https://wellfound.com/jobs?q=node+typescript+senior"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] hover:border-primary/50 transition-colors">
            <MapPin className="h-3 w-3" />Roles
          </a>
          <Link href="/roadmap"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] text-primary hover:bg-primary/20 transition-colors">
            <ArrowUpRight className="h-3 w-3" />All Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
