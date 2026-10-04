import { useState } from "react";
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
}: {
  points: TrendPoint[];
  label: string;
  unit: string;
  bars?: boolean;
}) {
  const [table, setTable] = useState(false);
  const readings = points.filter(
    (point) => point.value !== null && Number.isFinite(point.value),
  );
  if (!readings.length)
    return (
      <p className="progress-chart-empty">
        No readings in this range. Add a record to start this trend.
      </p>
    );
  const values = readings.map((point) => point.value!);
  const low = bars ? 0 : Math.min(...values);
  const high = Math.max(...values);
  const padding = bars ? 0 : Math.max((high - low) * 0.15, 0.5);
  const min = Math.max(0, low - padding);
  const max = Math.max(high + padding, min + 1);
  const x = (index: number) =>
    42 + (index * 486) / Math.max(points.length - 1, 1);
  const y = (value: number) => 132 - ((value - min) * 112) / (max - min);
  let path = "";
  let connected = false;
  points.forEach((point, index) => {
    if (point.value === null) {
      connected = false;
      return;
    }
    path += `${connected ? " L" : " M"}${x(index)} ${y(point.value)}`;
    connected = true;
  });
  return (
    <div className="progress-chart">
      <svg
        viewBox="0 0 560 168"
        role="img"
        aria-label={`${label}: ${readings.length} recorded days from ${shortProgressDate(points[0].date)} to ${shortProgressDate(points.at(-1)!.date)}. Missing readings are gaps.`}
      >
        {[min, (min + max) / 2, max].map((value) => (
          <g key={value}>
            <line
              x1="42"
              x2="528"
              y1={y(value)}
              y2={y(value)}
              className="progress-chart-grid"
            />
            <text
              x="35"
              y={y(value) + 4}
              textAnchor="end"
              className="progress-chart-label"
            >
              {round(value)}
            </text>
          </g>
        ))}
        {!bars && <path d={path} className="progress-chart-line" />}
        {points.map((point, index) =>
          point.value === null ? null : bars ? (
            <rect
              key={point.date}
              x={x(index) - Math.min(8, 200 / points.length)}
              y={y(point.value)}
              width={Math.min(16, 400 / points.length)}
              height={Math.max(1, 132 - y(point.value))}
              rx="2"
              className="progress-chart-bar"
            >
              <title>
                {shortProgressDate(point.date)}: {round(point.value)} {unit}
              </title>
            </rect>
          ) : (
            <circle
              key={point.date}
              cx={x(index)}
              cy={y(point.value)}
              r="3"
              className="progress-chart-dot"
            >
              <title>
                {shortProgressDate(point.date)}: {round(point.value)} {unit}
              </title>
            </circle>
          ),
        )}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((value, index, all) => all.indexOf(value) === index)
          .map((index) => (
            <text
              key={index}
              x={x(index)}
              y="159"
              textAnchor={
                index === 0
                  ? "start"
                  : index === points.length - 1
                    ? "end"
                    : "middle"
              }
              className="progress-chart-label"
            >
              {shortProgressDate(points[index].date)}
            </text>
          ))}
      </svg>
      <details onToggle={(e) => setTable(e.currentTarget.open)}>
        <summary>View daily readings · {unit}</summary>
        {table && (
          <div className="progress-table-scroll">
            <table>
              <caption className="sr-only">{label} daily readings</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">{unit}</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.date}>
                    <th scope="row">{shortProgressDate(point.date)}</th>
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
    </div>
  );
}
