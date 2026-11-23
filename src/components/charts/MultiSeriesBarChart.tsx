"use client";
import { useState } from "react";
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
  const [hovered, setHovered] = useState<number | null>(null);
  const values = data.map((d) => d.value ?? 0);
  const hasAny = data.some((d) => d.value !== null && d.value > 0);
  const maxVal = Math.max(goal ?? 0, ...values, 1);
  const ceiling = Math.ceil((maxVal * 1.15) / 10) * 10 || maxVal * 1.15;

  const width = 560;
  const height = 190;
  const left = 44;
  const right = width - 12;
  const top = 16;
  const bottom = 154;
  const plotW = right - left;
  const plotH = bottom - top;
  const step = plotW / Math.max(data.length, 1);
  const barW = Math.max(4, Math.min(26, step * 0.65));
  const y = (v: number) => bottom - (Math.min(v, ceiling) / ceiling) * plotH;

  const active = hovered !== null ? data[hovered] : null;

  return (
    <div className="space-y-3">
      {(title || active) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
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
          {active && active.value !== null && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-foreground">
              {active.date ?? active.label}:{" "}
              <strong>
                {Number.isInteger(active.value)
                  ? active.value.toLocaleString()
                  : active.value.toFixed(1)}{" "}
                {unit}
              </strong>
            </span>
          )}
        </div>
      )}

      {!hasAny ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
          {emptyCopy}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={title ?? `Bar chart in ${unit}`}
        >
          {[0, ceiling / 2, ceiling].map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                x2={right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border/60"
                strokeWidth="1"
              />
              <text
                x={left - 8}
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
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
                className="stroke-emerald-500/80"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
              {goalLabel && (
                <text
                  x={right}
                  y={y(goal) - 4}
                  textAnchor="end"
                  className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-medium"
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
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                >
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
                        height={Math.max(1, segH)}
                        rx={2}
                        style={{ fill: seg.color }}
                        opacity={hovered === null || isActive ? 0.92 : 0.45}
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

            const h = Math.max(2, bottom - y(item.value));
            return (
              <rect
                key={item.date ?? `${item.label}-${idx}`}
                x={bx}
                y={y(item.value)}
                width={barW}
                height={h}
                rx={3}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "cursor-pointer transition-opacity",
                  barColor,
                  hovered !== null && !isActive && "opacity-40",
                )}
              >
                <title>
                  {item.date ?? item.label}: {item.value.toLocaleString()}{" "}
                  {unit}
                </title>
              </rect>
            );
          })}

          {[0, Math.floor((data.length - 1) / 2), data.length - 1]
            .filter((i, pos, arr) => i >= 0 && arr.indexOf(i) === pos)
            .map((idx) => (
              <text
                key={idx}
                x={left + idx * step + step / 2}
                y={174}
                textAnchor={
                  idx === 0
                    ? "start"
                    : idx === data.length - 1
                      ? "end"
                      : "middle"
                }
                className="fill-muted-foreground text-[10px]"
              >
                {data[idx]?.label}
              </text>
            ))}
        </svg>
      )}

      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
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
