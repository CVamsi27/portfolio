"use client";
import { cn } from "@/lib/utils";

export type FunnelStage = {
  id: string;
  label: string;
  count: number;
  target?: number;
  tone?: "primary" | "sky" | "violet" | "amber" | "emerald";
};

const BAR_GRADIENTS = {
  primary: "from-primary/80 to-primary",
  sky: "from-sky-500/80 to-sky-400",
  violet: "from-violet-500/80 to-violet-400",
  amber: "from-amber-500/80 to-amber-400",
  emerald: "from-emerald-500/80 to-emerald-400",
};

const DOT_COLORS = {
  primary: "bg-primary",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

export default function HiringFunnelChart({
  stages,
  title = "Hiring funnel conversion",
  subtitle,
}: {
  stages: FunnelStage[];
  title?: string;
  subtitle?: string;
}) {
  const maxVal = Math.max(
    1,
    ...stages.map((s) => Math.max(s.count, s.target ?? 0)),
  );
  const topCount = stages[0]?.count ?? 0;
  const convoCount = stages[2]?.count ?? 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {topCount > 0 ? (
          <span className="rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary tabular-nums">
            {Math.round((convoCount / topCount) * 100)}% reply rate
          </span>
        ) : (
          <span className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
            No sends in range
          </span>
        )}
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPct = Math.max(
            stage.count > 0 ? 5 : 0,
            Math.round((stage.count / maxVal) * 100),
          );
          const targetPct = stage.target
            ? Math.min(100, Math.round((stage.target / maxVal) * 100))
            : null;
          const prev = index > 0 ? stages[index - 1].count : null;
          const conv =
            prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null;
          const tone = stage.tone ?? "primary";

          return (
            <div key={stage.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <span
                    className={cn("h-2 w-2 rounded-full", DOT_COLORS[tone])}
                  />
                  {stage.label}
                </span>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  {conv !== null && (
                    <span className="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      → {conv}%
                    </span>
                  )}
                  <span className="font-semibold text-foreground">
                    {stage.count}
                    {stage.target ? (
                      <span className="font-normal text-muted-foreground">
                        /{stage.target}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/65">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                    BAR_GRADIENTS[tone],
                  )}
                  style={{ width: `${widthPct}%` }}
                />
                {targetPct !== null && targetPct > 0 && targetPct < 100 && (
                  <span
                    aria-hidden="true"
                    title={`Target: ${stage.target}`}
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/35"
                    style={{ left: `${targetPct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
