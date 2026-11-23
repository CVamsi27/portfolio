"use client";
import { useMemo, useState } from "react";
import { shortProgressDate, type TrendPoint } from "@/components/progress/TrendChart";

export default function SmoothTrendChart({
  points,
  unit,
  title,
  subtitle,
  stroke = "#6366f1",
  showMovingAverage = true,
  emptyCopy = "No readings in this range yet.",
}: {
  points: TrendPoint[];
  unit: string;
  title?: string;
  subtitle?: string;
  stroke?: string;
  showMovingAverage?: boolean;
  emptyCopy?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const validReadings = points.filter((p) => p.value !== null);

  const movingAvg = useMemo(() => {
    if (!showMovingAverage) return [];
    return points.map((pt, idx) => {
      const window = points
        .slice(Math.max(0, idx - 6), idx + 1)
        .map((p) => p.value)
        .filter((v): v is number => v !== null);
      if (pt.value === null || window.length < 2) return null;
      return window.reduce((a, b) => a + b, 0) / window.length;
    });
  }, [points, showMovingAverage]);

  if (!validReadings.length) {
    return (
      <div className="space-y-2">
        {title && (
          <h4 className="font-display text-sm font-semibold text-foreground">
            {title}
          </h4>
        )}
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
          {emptyCopy}
        </p>
      </div>
    );
  }

  const values = validReadings.map((p) => p.value!);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pad = Math.max((maxVal - minVal) * 0.18, 0.5);
  const lo = Math.max(0, minVal - pad);
  const hi = Math.max(maxVal + pad, lo + 1);

  const width = 560;
  const height = 190;
  const left = 48;
  const right = width - 12;
  const top = 16;
  const bottom = 154;
  const x = (i: number) =>
    left + (i * (right - left)) / Math.max(points.length - 1, 1);
  const y = (v: number) => bottom - ((v - lo) * (bottom - top)) / (hi - lo);

  let linePath = "";
  let connected = false;
  points.forEach((pt, i) => {
    if (pt.value === null) {
      connected = false;
      return;
    }
    linePath += `${connected ? " L" : " M"}${x(i)} ${y(pt.value)}`;
    connected = true;
  });

  let avgPath = "";
  let avgConnected = false;
  movingAvg.forEach((val, i) => {
    if (val === null) {
      avgConnected = false;
      return;
    }
    avgPath += `${avgConnected ? " L" : " M"}${x(i)} ${y(val)}`;
    avgConnected = true;
  });

  const active = hovered !== null ? points[hovered] : null;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

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
              {active.date}:{" "}
              <strong>
                {fmt(active.value)} {unit}
              </strong>
            </span>
          )}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={title ?? `Trend chart in ${unit}`}
      >
        {[lo, (lo + hi) / 2, hi].map((tick) => (
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
              {fmt(tick)}
            </text>
          </g>
        ))}

        {avgPath && (
          <path
            d={avgPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            opacity="0.85"
          />
        )}

        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((pt, idx) =>
          pt.value === null ? null : (
            <circle
              key={pt.date}
              cx={x(idx)}
              cy={y(pt.value)}
              r={hovered === idx ? 5.5 : 3.2}
              fill={stroke}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>
                {pt.date}: {fmt(pt.value)} {unit}
              </title>
            </circle>
          ),
        )}

        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((i, pos, arr) => i >= 0 && arr.indexOf(i) === pos)
          .map((idx) => (
            <text
              key={idx}
              x={x(idx)}
              y={174}
              textAnchor={
                idx === 0
                  ? "start"
                  : idx === points.length - 1
                    ? "end"
                    : "middle"
              }
              className="fill-muted-foreground text-[10px]"
            >
              {shortProgressDate(points[idx].date)}
            </text>
          ))}
      </svg>

      {showMovingAverage && avgPath && (
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: stroke }}
            />
            Daily reading ({unit})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-500" />
            7-day moving average
          </span>
        </div>
      )}
    </div>
  );
}
