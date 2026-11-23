"use client";
import { cn } from "@/lib/utils";

export type FunnelStage = {
  id: string;
  label: string;
  count: number;
  target?: number;
  tone?: "primary" | "sky" | "violet" | "amber" | "emerald";
};

const BAR_COLORS = {
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
  const maxVal = Math.max(1, ...stages.map((s) => Math.max(s.count, s.target ?? 0)));
  const topCount = stages[0]?.count ?? 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {topCount > 0 && stages.length >= 2 && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary tabular-nums">
            {Math.round(((stages[1]?.count ?? 0) / topCount) * 100)}% reply rate
          </span>
        )}
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPct = Math.max(
            stage.count > 0 ? 6 : 0,
            Math.round((stage.count / maxVal) * 100),
          );
          const prev = index > 0 ? stages[index - 1].count : null;
          const conv =
            prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null;
          const tone = stage.tone ?? "primary";

          return (
            <div key={stage.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-foreground">
                  {stage.label}
                </span>
                <div className="flex items-center gap-2 tabular-nums">
                  {conv !== null && (
                    <span className="text-[11px] text-muted-foreground">
                      {conv}% of prev
                    </span>
                  )}
                  <span className="font-semibold text-foreground">
                    {stage.count}
                    {stage.target ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        / {stage.target}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted/70">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    BAR_COLORS[tone],
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
