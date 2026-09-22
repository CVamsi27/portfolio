"use client";

import { Activity, Check, Flame, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type FastingStage = {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "cyan" | "lime" | "amber" | "violet";
};

export const FASTING_STAGES: FastingStage[] = [
  {
    id: "blood-sugar",
    name: "Blood Sugar Normalization",
    startHour: 0,
    endHour: 4,
    summary: "Insulin levels drop, digestion completes, blood glucose returns to baseline.",
    icon: Activity,
    tone: "cyan",
  },
  {
    id: "glycogen",
    name: "Glycogen Depletion",
    startHour: 4,
    endHour: 12,
    summary: "Stored liver glycogen converts to energy, transitioning toward fat oxidation.",
    icon: Zap,
    tone: "amber",
  },
  {
    id: "ketosis",
    name: "Ketosis & Fat Oxidation",
    startHour: 12,
    endHour: 16,
    summary: "Fat breakdown accelerates, hepatic ketone production begins, metabolic flexibility activates.",
    icon: Flame,
    tone: "lime",
  },
  {
    id: "autophagy",
    name: "Autophagy & Cellular Renewal",
    startHour: 16,
    endHour: 24,
    summary: "Cellular recycling activates, clearing misfolded proteins and damaged mitochondria.",
    icon: ShieldCheck,
    tone: "violet",
  },
  {
    id: "deep-ketosis",
    name: "Deep Ketosis & GH Surge",
    startHour: 24,
    endHour: 48,
    summary: "Growth hormone secretion peaks, systemic inflammation markers reduce.",
    icon: Sparkles,
    tone: "lime",
  },
];

export default function FastingStages({ elapsedHours }: { elapsedHours: number }) {
  const currentStageIndex = FASTING_STAGES.findIndex(
    (stage) => elapsedHours >= stage.startHour && elapsedHours < stage.endHour,
  );
  const activeStage =
    currentStageIndex !== -1
      ? FASTING_STAGES[currentStageIndex]
      : elapsedHours >= 24
        ? FASTING_STAGES[FASTING_STAGES.length - 1]
        : FASTING_STAGES[0];

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#49e7ff]">
            Physiological Timeline
          </span>
          <h3 className="mt-1 font-display text-base font-bold sm:text-lg">
            Biological Fasting Stages
          </h3>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {elapsedHours.toFixed(1)}h elapsed
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {FASTING_STAGES.map((stage, idx) => {
          const isComplete = elapsedHours >= stage.endHour;
          const isCurrent =
            (elapsedHours >= stage.startHour && elapsedHours < stage.endHour) ||
            (idx === FASTING_STAGES.length - 1 && elapsedHours >= stage.startHour);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-all",
                isCurrent
                  ? "border-primary/70 bg-primary/10 shadow-sm"
                  : isComplete
                    ? "border-border/60 bg-muted/20 opacity-90"
                    : "border-border/40 bg-transparent opacity-50",
              )}
            >
              <div
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs",
                  isCurrent
                    ? "bg-primary text-primary-foreground font-bold"
                    : isComplete
                      ? "bg-muted text-[#c8ff3d]"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4 text-[#c8ff3d]" /> : <Icon className="h-4 w-4" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold sm:text-sm",
                      isCurrent ? "text-primary" : "text-foreground",
                    )}
                  >
                    {stage.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {stage.startHour}h – {stage.endHour}h
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stage.summary}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
