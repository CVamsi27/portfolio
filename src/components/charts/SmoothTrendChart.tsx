"use client";
import { useId, useMemo, useState } from "react";
import {
  shortProgressDate,
  type TrendPoint,
} from "@/components/progress/TrendChart";

function buildSpline(
  coords: Array<{ x: number; y: number } | null>,
  baselineY: number,
) {
  const groups: Array<Array<{ x: number; y: number }>> = [];
  let cur: Array<{ x: number; y: number }> = [];
  for (const pt of coords) {
    if (pt) cur.push(pt);
    else if (cur.length) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  const lines: string[] = [];
  const areas: string[] = [];
  for (const pts of groups) {
    if (pts.length < 2) continue;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    lines.push(d);
    areas.push(
      `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${baselineY.toFixed(1)} L ${pts[0].x.toFixed(1)} ${baselineY.toFixed(1)} Z`,
    );
  }
  return { lines, areas };
}

export default function SmoothTrendChart({
  points,
  unit,
  title,
  subtitle,
  stroke = "#38bdf8",
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
  const gradId = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<number | null>(null);
  const validReadings = useMemo(
    () => points.filter((p) => p.value !== null),
    [points],
  );

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

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  if (!validReadings.length) {
    return (
      <div className="space-y-2.5">
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
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyCopy}
        </p>
      </div>
    );
  }

  const values = validReadings.map((p) => p.value!);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const latest = validReadings[validReadings.length - 1];
  const first = validReadings[0];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const delta = validReadings.length >= 2 ? latest.value! - first.value! : null;

  const pad = Math.max((maxVal - minVal) * 0.22, 0.4);
  const lo = Math.max(0, minVal - pad);
  const hi = Math.max(maxVal + pad, lo + 1);

  const width = 560;
  const height = 204;
  const left = 48;
  const right = width - 14;
  const top = 16;
  const bottom = 166;
  const x = (i: number) =>
    left + (i * (right - left)) / Math.max(points.length - 1, 1);
  const y = (v: number) => bottom - ((v - lo) * (bottom - top)) / (hi - lo);

  const mainSpline = buildSpline(
    points.map((pt, i) =>
      pt.value === null ? null : { x: x(i), y: y(pt.value) },
    ),
    bottom,
  );
  const avgSpline = buildSpline(
    movingAvg.map((val, i) => (val === null ? null : { x: x(i), y: y(val) })),
    bottom,
  );

  const active = hovered !== null ? points[hovered] : null;
  const ticks = [lo, lo + (hi - lo) * 0.33, lo + (hi - lo) * 0.67, hi];

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
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums">
          <span className="rounded-lg border border-border/60 bg-background/70 px-2 py-0.5 text-foreground">
            {active && active.value !== null
              ? `${shortProgressDate(active.date)}: ${fmt(active.value)} ${unit}`
              : `Latest ${fmt(latest.value!)} ${unit}`}
          </span>
          <span className="rounded-lg border border-border/60 bg-background/70 px-2 py-0.5 text-muted-foreground">
            Avg {fmt(avg)}
          </span>
          {delta !== null && (
            <span
              className={`rounded-lg px-2 py-0.5 font-semibold ${
                delta <= 0
                  ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  : "bg-sky-500/12 text-sky-600 dark:text-sky-400"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {fmt(delta)} {unit}
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={title ?? `Trend chart in ${unit}`}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={`st-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="85%" stopColor={stroke} stopOpacity="0.03" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick, i) => (
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
              {fmt(tick)}
            </text>
          </g>
        ))}

        {mainSpline.areas.map((d, idx) => (
          <path key={`a-${idx}`} d={d} fill={`url(#st-${gradId})`} />
        ))}

        {avgSpline.lines.map((d, idx) => (
          <path
            key={`avg-${idx}`}
            d={d}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.6"
            strokeDasharray="4 4"
            opacity="0.85"
          />
        ))}

        {mainSpline.lines.map((d, idx) => (
          <path
            key={`l-${idx}`}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {hovered !== null && points[hovered]?.value !== null && (
          <line
            x1={x(hovered)}
            x2={x(hovered)}
            y1={top}
            y2={bottom}
            stroke={stroke}
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        )}

        {points.map((pt, idx) => {
          if (pt.value === null) return null;
          const px = x(idx);
          const py = y(pt.value);
          const isActive = hovered === idx;
          return (
            <g
              key={pt.date}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(idx)}
            >
              <circle cx={px} cy={py} r={12} fill="transparent" />
              {isActive && (
                <circle
                  cx={px}
                  cy={py}
                  r={8}
                  fill={stroke}
                  fillOpacity="0.2"
                />
              )}
              <circle
                cx={px}
                cy={py}
                r={isActive ? 4.8 : 3.2}
                fill="var(--color-card)"
                stroke={stroke}
                strokeWidth={isActive ? 2.5 : 2}
              >
                <title>
                  {pt.date}: {fmt(pt.value)} {unit}
                </title>
              </circle>
            </g>
          );
        })}

        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((i, pos, arr) => i >= 0 && arr.indexOf(i) === pos)
          .map((idx) => (
            <text
              key={idx}
              x={x(idx)}
              y={188}
              textAnchor={
                idx === 0
                  ? "start"
                  : idx === points.length - 1
                    ? "end"
                    : "middle"
              }
              className="fill-muted-foreground text-[10px] font-mono"
            >
              {shortProgressDate(points[idx].date)}
            </text>
          ))}
      </svg>

      {showMovingAverage && avgSpline.lines.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
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
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/80">
            Range {fmt(minVal)}–{fmt(maxVal)} {unit}
          </span>
        </div>
      )}
    </div>
  );
}
