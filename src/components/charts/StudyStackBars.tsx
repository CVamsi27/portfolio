"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import curriculum from "@/data/career-curriculum.json";
import ProgressBar, { type ProgressTone } from "./ProgressBar";

const STACK_META: Record<
  string,
  { label: string; tone: ProgressTone; url: string }
> = {
  "10-frontend": {
    label: "10 · Frontend (JS / TS / React)",
    tone: "sky",
    url: "https://study.buildora.work/10-frontend/",
  },
  "20-backend": {
    label: "20 · Backend (Node / NestJS / Postgres / Security)",
    tone: "emerald",
    url: "https://study.buildora.work/20-backend/",
  },
  "30-architecture": {
    label: "30 · Architecture & System Design",
    tone: "violet",
    url: "https://study.buildora.work/30-architecture/",
  },
  "40-platform": {
    label: "40 · Platform & DevOps",
    tone: "amber",
    url: "https://study.buildora.work/40-platform/",
  },
  "50-quality": {
    label: "50 · Quality, Testing & Performance",
    tone: "primary",
    url: "https://study.buildora.work/50-quality/",
  },
  "60-realtime": {
    label: "60 · Real-Time & WebSockets",
    tone: "sky",
    url: "https://study.buildora.work/60-realtime/",
  },
  "70-interview-toolkit": {
    label: "70 · Coding Patterns & Behavioral",
    tone: "rose",
    url: "https://study.buildora.work/70-interview-toolkit/",
  },
  "80-lanes-abroad-full-stack": {
    label: "80 · Full-Stack Interview Lane",
    tone: "violet",
    url: "https://study.buildora.work/80-lanes-abroad-full-stack/",
  },
};

export default function StudyStackBars({
  completedIds,
  essentialOnly = true,
  onSelectStack,
}: {
  completedIds: Set<string>;
  essentialOnly?: boolean;
  onSelectStack?: (stack: string) => void;
}) {
  const [mode, setMode] = useState<"essential" | "all">(
    essentialOnly ? "essential" : "all",
  );
  const isEssential = mode === "essential";

  const stacks = useMemo(() => {
    const chapters = curriculum.days.flatMap((d) => d.chapters ?? []);
    const byStack = new Map<
      string,
      { total: number; essential: number; done: number; essentialDone: number }
    >();
    for (const ch of chapters) {
      const bucket = byStack.get(ch.stack) ?? {
        total: 0,
        essential: 0,
        done: 0,
        essentialDone: 0,
      };
      bucket.total += 1;
      const isEss = ch.rolePriority === "Essential";
      if (isEss) bucket.essential += 1;
      if (completedIds.has(ch.id)) {
        bucket.done += 1;
        if (isEss) bucket.essentialDone += 1;
      }
      byStack.set(ch.stack, bucket);
    }
    return Object.keys(STACK_META)
      .filter((key) => byStack.has(key))
      .map((key) => {
        const stats = byStack.get(key)!;
        const meta = STACK_META[key];
        return { key, ...meta, ...stats };
      });
  }, [completedIds]);

  const visibleStacks = stacks.filter(
    (s) => (isEssential ? s.essential : s.total) > 0,
  );

  const totalTarget = visibleStacks.reduce(
    (sum, s) => sum + (isEssential ? s.essential : s.total),
    0,
  );
  const totalDone = visibleStacks.reduce(
    (sum, s) => sum + (isEssential ? s.essentialDone : s.done),
    0,
  );

  return (
    <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            Study Bible mastery by stack
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEssential
              ? "Essential senior-screen chapters mastered across study.buildora.work"
              : "All 600 chapters across study.buildora.work"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Study Bible chapter scope"
            className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-[11px]"
          >
            <button
              type="button"
              onClick={() => setMode("essential")}
              aria-pressed={isEssential}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                isEssential
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Essential
            </button>
            <button
              type="button"
              onClick={() => setMode("all")}
              aria-pressed={!isEssential}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                !isEssential
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All 600
            </button>
          </div>
          <Link
            href="/roadmap?view=study"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <ProgressBar
        label={isEssential ? "Overall Essential Mastery" : "Overall Bible Mastery"}
        value={totalDone}
        max={totalTarget}
        unit="chapters"
        tone="primary"
      />

      <div className="space-y-3 pt-1">
        {visibleStacks.map((stack) => {
          const max = isEssential ? stack.essential : stack.total;
          const val = isEssential ? stack.essentialDone : stack.done;
          const pct = max > 0 ? Math.round((val / max) * 100) : 0;
          return (
            <div key={stack.key} className="group">
              <div className="flex items-center justify-between gap-2 mb-1">
                {onSelectStack ? (
                  <button
                    type="button"
                    onClick={() => onSelectStack(stack.key)}
                    className="text-xs font-medium text-foreground hover:text-primary text-left transition-colors"
                  >
                    {stack.label}
                  </button>
                ) : (
                  <a
                    href={stack.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {stack.label}
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </a>
                )}
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {val}/{max} · {pct}%
                </span>
              </div>
              <ProgressBar value={val} max={max} tone={stack.tone} compact />
            </div>
          );
        })}
      </div>
    </section>
  );
}
