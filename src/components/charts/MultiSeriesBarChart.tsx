"use client";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type BarDatum = {
  label: string;
  date?: string;
  value: number | null;
  segments?: Array<{ key: string; label: string; value: number; color: string }>;
};

export default function MultiSeriesBarChart({
  data,
  unit,
  title,
  subtitle,
  goal,
  goalLabel,
  barColor = "fill-primary",
  legend,
  emptyCopy = "No readings in this range yet.",
}: {
  data: BarDatum[];
  unit: string;
  title?: string;
  subtitle?: string;
  goal?: number;
  goalLabel?: string;
  barColor?: string;
  legend?: Array<{ label: string; color: string }>;
  emptyCopy?: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<number | null>(null);

  const stats = useMemo(() => {
    const activeVals = data
      .map((d) => d.value)
      .filter((v): v is number => v !== null && v > 0);
    if (!activeVals.length) return null;
    const total = activeVals.reduce((a, b) => a + b, 0);
    const avg = total / activeVals.length;
    const peak = Math.max(...activeVals);
    const hitGoal =
      goal !== undefined && goal > 0
        ? activeVals.filter((v) => v >= goal).length
        : null;
    return { total, avg, peak, count: activeVals.length, hitGoal };
  }, [data, goal]);

  const values = data.map((d) => d.value ?? 0);
  const maxVal = Math.max(goal ?? 0, ...values, 1);
  const ceiling = Math.ceil((maxVal * 1.15) / 10) * 10 || maxVal * 1.15;

  const width = 560;
  const height = 200;
  const left = 46;
  const right = width - 12;
  const top = 16;
  const bottom = 162;
  const plotW = right - left;
  const plotH = bottom - top;
  const step = plotW / Math.max(data.length, 1);
  const barW = Math.max(5, Math.min(26, step * 0.64));
  const y = (v: number) => bottom - (Math.min(v, ceiling) / ceiling) * plotH;

  const active = hovered !== null ? data[hovered] : null;
  const fmt = (n: number) =>
    Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {title && (
            <h4 className="font-display text-sm font-semibold text-foreground">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {active && active.value !== null ? (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-mono tabular-nums text-foreground">
            <span className="text-muted-foreground">
              {active.date ?? active.label}
            </span>
            <strong className="text-foreground">
              {fmt(active.value)} {unit}
            </strong>
            {active.segments && active.segments.length > 1 && (
              <span className="text-muted-foreground">
                (
                {active.segments
                  .map((s) => `${s.label.split(" ")[0]} ${Math.round(s.value)}`)
                  .join(" · ")}
                )
              </span>
            )}
          </div>
        ) : stats ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono tabular-nums">
            <span className="rounded-lg border border-border/60 bg-background/70 px-2 py-0.5 text-foreground">
              Avg {fmt(Math.round(stats.avg))} {unit}
            </span>
            <span className="rounded-lg border border-border/60 bg-background/70 px-2 py-0.5 text-muted-foreground">
              Peak {fmt(stats.peak)}
            </span>
            {stats.hitGoal !== null && (
              <span className="rounded-lg bg-emerald-500/12 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                {stats.hitGoal}/{stats.count} goal
              </span>
            )}
          </div>
        ) : null}
      </div>

      {!stats ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyCopy}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={title ?? `Bar chart in ${unit}`}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={`mb-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {[0, ceiling / 3, (ceiling * 2) / 3, ceiling].map((tick, i) => (
            <g key={i}>
              <line
                x1={left}
                x2={right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border/55"
                strokeWidth="1"
                strokeDasharray={i === 0 ? undefined : "3 4"}
              />
              <text
                x={left - 8}
                y={y(tick) + 3.5}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] font-mono tabular-nums"
              >
                {tick >= 1000
                  ? `${(tick / 1000).toFixed(1)}k`
                  : Math.round(tick)}
              </text>
            </g>
          ))}

          {goal !== undefined && goal > 0 && (
            <g>
              <line
                x1={left}
                x2={right}
                y1={y(goal)}
                y2={y(goal)}
                className="stroke-emerald-500/75"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
              {goalLabel && (
                <text
                  x={right}
                  y={Math.max(top + 10, y(goal) - 5)}
                  textAnchor="end"
                  className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono font-medium"
                >
                  {goalLabel}
                </text>
              )}
            </g>
          )}

          {data.map((item, idx) => {
            const cx = left + idx * step + step / 2;
            const bx = cx - barW / 2;
            const isActive = hovered === idx;
            if (item.value === null || item.value <= 0) return null;

            if (item.segments && item.segments.length > 0) {
              let currentBottom = bottom;
              return (
                <g
                  key={item.date ?? `${item.label}-${idx}`}
                  onMouseEnter={() => setHovered(idx)}
                  className="cursor-pointer"
                >
                  {isActive && (
                    <rect
                      x={bx - 3}
                      y={top}
                      width={barW + 6}
                      height={plotH}
                      rx={4}
                      className="fill-primary/8"
                    />
                  )}
                  {item.segments.map((seg) => {
                    const segH = (seg.value / ceiling) * plotH;
                    const sy = currentBottom - segH;
                    currentBottom = sy;
                    return (
                      <rect
                        key={seg.key}
                        x={bx}
                        y={sy}
                        width={barW}
                        height={Math.max(2, segH)}
                        rx={3}
                        style={{ fill: seg.color }}
                        opacity={hovered === null || isActive ? 0.94 : 0.38}
                        className="transition-opacity duration-150"
                      >
                        <title>
                          {item.date ?? item.label} · {seg.label}:{" "}
                          {Math.round(seg.value)} {unit}
                        </title>
                      </rect>
                    );
                  })}
                </g>
              );
            }

            const h = Math.max(3, bottom - y(item.value));
            return (
              <g
                key={item.date ?? `${item.label}-${idx}`}
                onMouseEnter={() => setHovered(idx)}
                className="cursor-pointer"
              >
                {isActive && (
                  <rect
                    x={bx - 3}
                    y={top}
                    width={barW + 6}
                    height={plotH}
                    rx={4}
                    className="fill-primary/8"
                  />
                )}
                <rect
                  x={bx}
                  y={y(item.value)}
                  width={barW}
                  height={h}
                  rx={Math.min(5, barW / 2)}
                  className={cn(
                    "transition-opacity duration-150",
                    barColor,
                    hovered !== null && !isActive && "opacity-35",
                  )}
                >
                  <title>
                    {item.date ?? item.label}: {item.value.toLocaleString()}{" "}
                    {unit}
                  </title>
                </rect>
              </g>
            );
          })}

          {[0, Math.floor((data.length - 1) / 2), data.length - 1]
            .filter((i, pos, arr) => i >= 0 && arr.indexOf(i) === pos)
            .map((idx) => (
              <text
                key={idx}
                x={left + idx * step + step / 2}
                y={184}
                textAnchor={
                  idx === 0
                    ? "start"
                    : idx === data.length - 1
                      ? "end"
                      : "middle"
                }
                className="fill-muted-foreground text-[10px] font-mono"
              >
                {data[idx]?.label}
              </text>
            ))}
        </svg>
      )}

      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-muted-foreground">
          {legend.map((entry) => (
            <span key={entry.label} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-xs"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
