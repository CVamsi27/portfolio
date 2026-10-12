"use client";
import { useEffect, useRef, useState } from "react";
export type TrendPoint = { date: string; value: number | null };
const round = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);
export function shortProgressDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
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
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const [table, setTable] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const resize = () =>
      setWidth(
        Math.max(180, Math.round(element.getBoundingClientRect().width)),
      );
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const clean = points.map((point) => ({
    ...point,
    value:
      point.value !== null && Number.isFinite(point.value) ? point.value : null,
  }));
  const readings = clean.filter((point) => point.value !== null);
  const values = readings.map((point) => point.value!);
  const low = bars ? 0 : Math.min(...values);
  const high = Math.max(...values);
  const padding = bars ? 0 : Math.max((high - low) * 0.15, 0.5);
  const min = domain?.min ?? Math.max(0, low - padding);
  const step = 10 ** Math.floor(Math.log10(Math.max(high, 1)));
  const max =
    domain?.max ??
    (bars
      ? Math.max(step, Math.ceil((high * 1.1) / step) * step)
      : Math.max(high + padding, min + 1));
  const left = 64,
    right = width - 12,
    top = 26,
    bottom = 144;
  const x = (index: number) =>
    left + 10 + (index * (right - left - 20)) / Math.max(clean.length - 1, 1);
  const y = (value: number) =>
    bottom - ((value - min) * (bottom - top)) / (max - min);
  const barWidth = Math.max(
    2,
    Math.min(22, ((right - left) / Math.max(clean.length, 1)) * 0.6),
  );
  let path = "",
    connected = false;
  clean.forEach((point, index) => {
    if (point.value === null) {
      connected = false;
      return;
    }
    path += `${connected ? " L" : " M"}${x(index)} ${y(point.value)}`;
    connected = true;
  });
  return (
    <div ref={host} className="progress-chart">
      {!readings.length ? (
        <p className="progress-chart-empty">No readings in this range.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} 198`}
            role="img"
            aria-label={`${label}, ${unit}: ${readings.length} dated readings. Missing readings are gaps.`}
          >
            <title>
              {label} · {unit}
            </title>
            <text x={left} y={14} className="progress-chart-label">
              {unit.length > 24 ? `${unit.slice(0, 23)}…` : unit}
            </text>
            {[min, (min + max) / 2, max].map((value) => (
              <g key={value}>
                <line
                  x1={left}
                  x2={right}
                  y1={y(value)}
                  y2={y(value)}
                  className="progress-chart-grid"
                />
                <text
                  x={left - 8}
                  y={y(value) + 4}
                  textAnchor="end"
                  className="progress-chart-label"
                >
                  {round(value)}
                </text>
              </g>
            ))}
            {!bars && <path d={path} className="progress-chart-line" />}
            {clean.map((point, index) =>
              point.value === null ? null : bars ? (
                <rect
                  key={point.date}
                  x={x(index) - barWidth / 2}
                  y={y(point.value)}
                  width={barWidth}
                  height={bottom - y(point.value)}
                  className="progress-chart-bar"
                >
                  <title>
                    {point.date}: {round(point.value)} {unit}
                  </title>
                </rect>
              ) : (
                <circle
                  key={point.date}
                  cx={x(index)}
                  cy={y(point.value)}
                  r={3}
                  className="progress-chart-dot"
                >
                  <title>
                    {point.date}: {round(point.value)} {unit}
                  </title>
                </circle>
              ),
            )}
            {[0, Math.floor((clean.length - 1) / 2), clean.length - 1]
              .filter((value, index, all) => all.indexOf(value) === index)
              .map((index) => (
                <text
                  key={index}
                  x={
                    index === 0
                      ? left
                      : index === clean.length - 1
                        ? right
                        : x(index)
                  }
                  y={166}
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === clean.length - 1
                        ? "end"
                        : "middle"
                  }
                  className="progress-chart-label"
                >
                  {shortProgressDate(clean[index].date)}
                </text>
              ))}
            <text
              x={(left + right) / 2}
              y={190}
              textAnchor="middle"
              className="progress-chart-label"
            >
              Date
            </text>
          </svg>
          <details onToggle={(event) => setTable(event.currentTarget.open)}>
            <summary>View dated readings</summary>
            {table && (
              <div className="progress-table-scroll">
                <table>
                  <caption className="sr-only">{label} dated readings</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">{unit}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clean.map((point) => (
                      <tr key={point.date}>
                        <th scope="row">{point.date}</th>
                        <td>
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
        </>
      )}
    </div>
  );
}
