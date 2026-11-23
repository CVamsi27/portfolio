"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type TrendPoint = { date: string; value: number | null };

const round = (value: number) =>
  Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);

export function shortProgressDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Build smooth monotone cubic Bezier paths per contiguous non-null segment. */
function buildSmoothSegments(
  coords: Array<{ x: number; y: number } | null>,
  baselineY: number,
): { linePaths: string[]; areaPaths: string[] } {
  const groups: Array<Array<{ x: number; y: number }>> = [];
  let current: Array<{ x: number; y: number }> = [];
  for (const pt of coords) {
    if (pt) {
      current.push(pt);
    } else if (current.length) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);

  const linePaths: string[] = [];
  const areaPaths: string[] = [];

  for (const pts of groups) {
    if (pts.length === 1) continue;
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
    linePaths.push(d);
    const first = pts[0];
    const last = pts[pts.length - 1];
    areaPaths.push(
      `${d} L ${last.x.toFixed(1)} ${baselineY.toFixed(1)} L ${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`,
    );
  }
  return { linePaths, areaPaths };
}

export default function TrendChart({
  points,
  label,
  unit,
  bars = false,
  domain,
}: {
  points: TrendPoint[];
  label: string;
  unit: string;
  bars?: boolean;
  domain?: { min: number; max: number };
}) {
  const gradId = useId().replace(/:/g, "");
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(520);
  const [table, setTable] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const resize = () =>
      setWidth(
        Math.max(240, Math.round(element.getBoundingClientRect().width)),
      );
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const clean = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        value:
          point.value !== null && Number.isFinite(point.value)
            ? point.value
            : null,
      })),
    [points],
  );

  const readings = useMemo(
    () => clean.filter((point) => point.value !== null),
    [clean],
  );

  const stats = useMemo(() => {
    if (!readings.length) return null;
    const vals = readings.map((r) => r.value!);
    const total = vals.reduce((a, b) => a + b, 0);
    const avg = total / vals.length;
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const first = readings[0];
    const latest = readings[readings.length - 1];
    const delta =
      readings.length >= 2 ? latest.value! - first.value! : null;
    const deltaPct =
      delta !== null && first.value! > 0
        ? Math.round((delta / first.value!) * 100)
        : null;
    return { total, avg, minV, maxV, first, latest, delta, deltaPct };
  }, [readings]);

  if (!readings.length || !stats) {
    return (
      <div ref={host} className="progress-chart">
        <p className="progress-chart-empty">No readings in this range.</p>
      </div>
    );
  }

  const low = bars ? 0 : stats.minV;
  const high = stats.maxV;
  const padding = bars ? 0 : Math.max((high - low) * 0.22, 0.4);
  const min = domain?.min ?? Math.max(0, low - padding);
  const stepOrder = 10 ** Math.floor(Math.log10(Math.max(high, 1)));
  const max =
    domain?.max ??
    (bars
      ? Math.max(stepOrder, Math.ceil((high * 1.15) / stepOrder) * stepOrder)
      : Math.max(high + padding, min + 1));

  const svgHeight = 232;
  const left = 54;
  const right = width - 16;
  const top = 22;
  const bottom = 180;
  const plotW = Math.max(80, right - left);
  const plotH = bottom - top;

  const x = (index: number) =>
    left + 10 + (index * (plotW - 20)) / Math.max(clean.length - 1, 1);
  const y = (value: number) =>
    bottom - ((value - min) * plotH) / Math.max(max - min, 0.0001);

  const barWidth = Math.max(
    4,
    Math.min(26, (plotW / Math.max(clean.length, 1)) * 0.64),
  );

  const coords = clean.map((pt, idx) =>
    pt.value === null ? null : { x: x(idx), y: y(pt.value) },
  );
  const { linePaths, areaPaths } = buildSmoothSegments(coords, bottom);

  const yTicks = [min, min + (max - min) * 0.33, min + (max - min) * 0.67, max];
  const avgY = y(stats.avg);
  const activePoint =
    activeIndex !== null && clean[activeIndex]?.value !== null
      ? clean[activeIndex]
      : null;

  const xTickIndices = [
    0,
    Math.floor((clean.length - 1) / 3),
    Math.floor(((clean.length - 1) * 2) / 3),
    clean.length - 1,
  ].filter((v, idx, arr) => v >= 0 && v < clean.length && arr.indexOf(v) === idx);

  return (
    <div ref={host} className="progress-chart space-y-4">
      {/* Compact 4-Stat Telemetry Summary Strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 dark:bg-background/60">
          <p className="text-[11px] font-medium text-muted-foreground">
            {activePoint ? shortProgressDate(activePoint.date) : "Latest"}
          </p>
          <p className="mt-0.5 font-display text-base font-semibold tabular-nums text-foreground">
            {round((activePoint ?? stats.latest).value!)}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {unit}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 dark:bg-background/60">
          <p className="text-[11px] font-medium text-muted-foreground">
            {bars ? "Daily avg" : "Period avg"}
          </p>
          <p className="mt-0.5 font-display text-base font-semibold tabular-nums text-foreground">
            {round(stats.avg)}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {unit}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 dark:bg-background/60">
          <p className="text-[11px] font-medium text-muted-foreground">
            {bars ? "Period total" : "Min – Max"}
          </p>
          <p className="mt-0.5 font-display text-base font-semibold tabular-nums text-foreground">
            {bars
              ? round(stats.total)
              : `${round(stats.minV)} – ${round(stats.maxV)}`}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 dark:bg-background/60">
          <p className="text-[11px] font-medium text-muted-foreground">
            {activePoint ? "vs Average" : "Period change"}
          </p>
          <p className="mt-0.5 font-display text-base font-semibold tabular-nums">
            {activePoint ? (
              <span
                className={
                  activePoint.value! >= stats.avg
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"
                }
              >
                {activePoint.value! >= stats.avg ? "+" : ""}
                {round(activePoint.value! - stats.avg)} {unit}
              </span>
            ) : stats.delta !== null ? (
              <span
                className={
                  stats.delta === 0
                    ? "text-muted-foreground"
                    : stats.delta > 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-sky-700 dark:text-sky-400"
                }
              >
                {stats.delta > 0 ? "+" : ""}
                {round(stats.delta)}
                {stats.deltaPct !== null
                  ? ` (${stats.delta > 0 ? "+" : ""}${stats.deltaPct}%)`
                  : ""}
              </span>
            ) : (
              <span className="text-muted-foreground">1 reading</span>
            )}
          </p>
        </div>
      </div>

      {/* Main High-Craft SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`${label}, ${unit}: ${readings.length} dated readings. Missing readings are gaps.`}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <title>
            {label} · {unit}
          </title>
          <defs>
            <linearGradient
              id={`area-${gradId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-primary)"
                stopOpacity="0.32"
              />
              <stop
                offset="85%"
                stopColor="var(--color-primary)"
                stopOpacity="0.04"
              />
              <stop
                offset="100%"
                stopColor="var(--color-primary)"
                stopOpacity="0"
              />
            </linearGradient>
            <linearGradient
              id={`bar-${gradId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-primary)"
                stopOpacity="0.95"
              />
              <stop
                offset="100%"
                stopColor="var(--color-primary)"
                stopOpacity="0.52"
              />
            </linearGradient>
          </defs>

          {/* Horizontal dashed gridlines & Y-axis labels */}
          {yTicks.map((value, i) => (
            <g key={i}>
              <line
                x1={left}
                x2={right}
                y1={y(value)}
                y2={y(value)}
                className="stroke-border/55"
                strokeWidth="1"
                strokeDasharray={i === 0 ? undefined : "3 4"}
              />
              <text
                x={left - 10}
                y={y(value) + 3.5}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] font-mono tabular-nums"
              >
                {round(value)}
              </text>
            </g>
          ))}

          {/* Period average reference line */}
          {readings.length >= 2 && avgY >= top && avgY <= bottom && (
            <g>
              <line
                x1={left}
                x2={right}
                y1={avgY}
                y2={avgY}
                stroke="var(--color-primary)"
                strokeOpacity="0.45"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
              <text
                x={right}
                y={Math.max(top + 10, avgY - 5)}
                textAnchor="end"
                className="fill-primary text-[10px] font-mono font-medium"
              >
                avg {round(stats.avg)}
              </text>
            </g>
          )}

          {/* Smooth area fills under continuous spline segments */}
          {!bars &&
            areaPaths.map((d, idx) => (
              <path key={`a-${idx}`} d={d} fill={`url(#area-${gradId})`} />
            ))}

          {/* Smooth Bezier curves */}
          {!bars &&
            linePaths.map((d, idx) => (
              <path
                key={`l-${idx}`}
                d={d}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

          {/* Vertical hover crosshair */}
          {activeIndex !== null && clean[activeIndex]?.value !== null && (
            <line
              x1={x(activeIndex)}
              x2={x(activeIndex)}
              y1={top}
              y2={bottom}
              stroke="var(--color-primary)"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
          )}

          {/* Data bars or interactive spline nodes */}
          {clean.map((point, index) => {
            if (point.value === null) return null;
            const px = x(index);
            const py = y(point.value);
            const isActive = activeIndex === index;

            if (bars) {
              const barH = Math.max(3, bottom - py);
              return (
                <g
                  key={point.date}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() =>
                    setActiveIndex((prev) => (prev === index ? null : index))
                  }
                >
                  {isActive && (
                    <rect
                      x={px - barWidth / 2 - 4}
                      y={top}
                      width={barWidth + 8}
                      height={plotH}
                      rx={4}
                      className="fill-primary/8"
                    />
                  )}
                  <rect
                    x={px - barWidth / 2}
                    y={py}
                    width={barWidth}
                    height={barH}
                    rx={Math.min(5, barWidth / 2)}
                    fill={`url(#bar-${gradId})`}
                    opacity={activeIndex === null || isActive ? 1 : 0.42}
                    className="transition-opacity duration-150"
                  >
                    <title>
                      {point.date}: {round(point.value)} {unit}
                    </title>
                  </rect>
                </g>
              );
            }

            return (
              <g
                key={point.date}
                className="cursor-pointer"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() =>
                  setActiveIndex((prev) => (prev === index ? null : index))
                }
              >
                {/* Generous invisible hit area */}
                <circle cx={px} cy={py} r={14} fill="transparent" />
                {isActive && (
                  <circle
                    cx={px}
                    cy={py}
                    r={9}
                    fill="var(--color-primary)"
                    fillOpacity="0.18"
                  />
                )}
                <circle
                  cx={px}
                  cy={py}
                  r={isActive ? 5 : readings.length > 20 ? 2.8 : 3.6}
                  fill="var(--color-card)"
                  stroke="var(--color-primary)"
                  strokeWidth={isActive ? 2.8 : 2}
                  className="transition-all duration-150"
                >
                  <title>
                    {point.date}: {round(point.value)} {unit}
                  </title>
                </circle>
              </g>
            );
          })}

          {/* X-axis date ticks */}
          {xTickIndices.map((index) => (
            <text
              key={index}
              x={
                index === 0
                  ? left
                  : index === clean.length - 1
                    ? right
                    : x(index)
              }
              y={204}
              textAnchor={
                index === 0
                  ? "start"
                  : index === clean.length - 1
                    ? "end"
                    : "middle"
              }
              className="fill-muted-foreground text-[10px] font-mono"
            >
              {shortProgressDate(clean[index].date)}
            </text>
          ))}
        </svg>
      </div>

      {/* Expandable Dated Readings Table */}
      <details
        className="rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5 text-xs"
        onToggle={(event) => setTable(event.currentTarget.open)}
      >
        <summary className="cursor-pointer select-none font-medium text-primary hover:underline">
          View dated readings
        </summary>
        {table && (
          <div className="progress-table-scroll mt-3 max-h-64 overflow-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <caption className="sr-only">{label} dated readings</caption>
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th scope="col" className="py-1.5 pr-4 font-medium">
                    Date
                  </th>
                  <th scope="col" className="py-1.5 font-medium">
                    {unit}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {clean.map((point) => (
                  <tr key={point.date} className="hover:bg-muted/30">
                    <th scope="row" className="py-1.5 pr-4 font-mono font-normal">
                      {point.date}
                    </th>
                    <td className="py-1.5 font-medium">
                      {point.value === null
                        ? "Not recorded"
                        : round(point.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}
