import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Dumbbell, Flag, ListChecks, ShieldCheck, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnchorItem = {
  id: "fast" | "workout" | "tasks" | "goal";
  label: string;
  completed: boolean;
  href: string;
};

const ICONS = {
  fast: Timer,
  workout: Dumbbell,
  tasks: ListChecks,
  goal: Flag,
};

export default function ProgressRail({
  percent,
  completed,
  total,
  anchors,
}: {
  percent: number;
  completed: number;
  total: number;
  anchors?: AnchorItem[];
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const allDone = completed >= total && total > 0;

  // Track when allDone transitions to true so we can show a 4s celebration toast.
  // We increment a key rather than calling setState synchronously in the effect body.
  const [celebrationKey, setCelebrationKey] = useState(0);
  const prevAllDone = useRef(false);
  useEffect(() => {
    if (allDone && !prevAllDone.current) {
      // Delay the state update to an async tick to avoid calling setState synchronously
      const t = window.setTimeout(() => setCelebrationKey((k) => k + 1), 0);
      return () => window.clearTimeout(t);
    }
    prevAllDone.current = allDone;
  }, [allDone]);

  // Auto-dismiss: once celebrationKey > 0, start a 4s hide timer.
  const [showCelebration, setShowCelebration] = useState(false);
  useEffect(() => {
    if (celebrationKey === 0) return;
    const startT = window.setTimeout(() => setShowCelebration(true), 0);
    const endT = window.setTimeout(() => setShowCelebration(false), 4000);
    return () => {
      window.clearTimeout(startT);
      window.clearTimeout(endT);
    };
  }, [celebrationKey]);

  return (
    <section data-testid="progress-rail" className="border-y border-border/70 py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="dossier-kicker">{allDone ? "Full sequence achieved" : "Momentum"}</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight">
            {completed}/{total} anchors complete
          </p>
        </div>
        <strong
          className={cn(
            "font-display text-3xl font-black tabular-nums transition-colors duration-700",
            allDone ? "text-[#c8ff3d]" : "text-[#32b8c8]",
          )}
        >
          {safePercent}%
        </strong>
      </div>
      <div
        role="progressbar"
        aria-label="Daily momentum"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
      >
        <span
          className={cn(
            "block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
            allDone ? "bg-[#c8ff3d] shadow-[0_0_12px_rgba(200,255,61,0.55)]" : "bg-[#32b8c8]",
          )}
          style={{ width: `${safePercent}%` }}
        />
      </div>

      {anchors && anchors.length > 0 ? (
        <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {anchors.map((anchor) => {
            const Icon = ICONS[anchor.id];
            return (
              <Link
                key={anchor.id}
                href={anchor.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                  anchor.completed
                    ? "border-[#c8ff3d]/50 bg-[#c8ff3d]/10 text-foreground"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      anchor.completed ? "text-[#c8ff3d]" : "text-muted-foreground group-hover:text-primary",
                    )}
                  />
                  <span className="truncate font-medium">{anchor.label}</span>
                </div>
                {anchor.completed ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#c8ff3d]" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border group-hover:bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* Completion celebration toast */}
      {showCelebration && (
        <div
          className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#c8ff3d]/40 bg-[#c8ff3d]/10 px-4 py-3 text-sm font-semibold text-[#c8ff3d] animate-[slide-up_0.35s_ease]"
          role="status"
          aria-live="polite"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          All anchors complete. Outstanding day.
        </div>
      )}
    </section>
  );
}
