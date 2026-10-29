import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { AgendaItem } from "@/lib/day-plan";
import { minutesOf } from "@/lib/day-plan";
import { scheduledInstant } from "@/lib/routine-reminders";
import type { personalDayFrame } from "@/lib/personal-timetable";

type DayFrame = ReturnType<typeof personalDayFrame>;
const fixed = (row: AgendaItem) =>
  row.id.startsWith("owner:") || row.id.startsWith("timetable:");
const duration = (minutes: number) =>
  `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The daily frame gives the timetable shape; assignment instructions stay one disclosure away. */
export default function TimetableAgenda({
  date,
  rows,
  frame,
  renderRow,
}: {
  date: string;
  rows: AgendaItem[];
  frame: DayFrame;
  renderRow: (row: AgendaItem) => ReactNode;
}) {
  if (!frame.length)
    return <ol className="agenda-list">{rows.map(renderRow)}</ol>;
  const contained = new Set<string>();
  const groups = frame.map((block) => {
    const start = scheduledInstant(date, block.startLocal, "Asia/Kolkata");
    const end = start + block.durationMinutes * 60_000;
    const children = rows.filter(
      (row) => fixed(row) && row.at >= start && row.at < end,
    );
    children.forEach((row) => contained.add(row.id));
    return { block, start, children };
  });
  const entries = [
    ...groups.map((group) => ({ at: group.start, id: group.block.id, group })),
    ...rows
      .filter((row) => !contained.has(row.id))
      .map((row) => ({ at: row.at, id: row.id, row })),
  ].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  return (
    <ol className="agenda-list">
      {entries.map((entry) => {
        if ("row" in entry) return renderRow(entry.row);
        const { block, children } = entry.group;
        const range = `${block.startLocal}–${clock(minutesOf(block.startLocal) + block.durationMinutes)}`;
        return (
          <li
            key={block.id}
            className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 border-b border-border py-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-5"
          >
            <div className="pt-1 text-sm font-semibold tabular-nums text-muted-foreground">
              {block.startLocal}
            </div>
            {block.kind === "study" ? (
              <details
                data-testid={`study-window-${block.id}`}
                className="group min-w-0"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <strong className="block text-base font-semibold leading-6 sm:text-lg">
                      {block.label}
                    </strong>
                    <small className="mt-1 block text-xs leading-5 text-muted-foreground sm:text-sm">
                      {range} · {duration(block.durationMinutes)} ·{" "}
                      {children.length
                        ? `${children.length} assignments`
                        : "Open study time"}
                    </small>
                  </span>
                  <ChevronDown
                    aria-hidden
                    className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="min-w-0 pt-3">
                  {children.length ? (
                    <ol className="agenda-list">{children.map(renderRow)}</ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose your next study task in{" "}
                      <Link
                        className="underline underline-offset-4"
                        href={`/roadmap?date=${date}`}
                      >
                        Roadmap
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </details>
            ) : (
              <div className="flex min-h-11 min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <div>
                  <strong className="block text-sm font-medium sm:text-base">
                    {block.label}
                  </strong>
                  <small className="mt-1 block text-xs text-muted-foreground">
                    {range}
                  </small>
                </div>
                {block.kind === "exercise" && (
                  <Link
                    className="inline-action"
                    href={`/workout-tracking?date=${date}`}
                  >
                    Open workout
                  </Link>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function TimetableWeek({
  days,
  selectedDate,
  frames,
  renderRow,
  renderProgress,
}: {
  days: Array<{ date: string; rows: AgendaItem[] }>;
  selectedDate: string;
  frames: Record<string, DayFrame>;
  renderRow: (row: AgendaItem) => ReactNode;
  renderProgress?: (date: string) => ReactNode;
}) {
  return (
    <div className="divide-y divide-border">
      {days.map((day) => {
        const frame = frames[day.date] ?? [];
        const studyMinutes = frame
          .filter((block) => block.kind === "study")
          .reduce((total, block) => total + block.durationMinutes, 0);
        const sunday = new Date(`${day.date}T12:00:00Z`).getUTCDay() === 0;
        return (
          <details
            key={day.date}
            data-testid={`job-day-${day.date}`}
            open={day.date === selectedDate}
            className="group min-w-0 py-2"
          >
            <summary
              data-testid={`plan-week-day-${day.date}`}
              className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-1 py-2 [&::-webkit-details-marker]:hidden"
            >
              <span className="min-w-0 flex-1 text-sm font-semibold">
                {new Intl.DateTimeFormat("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                }).format(new Date(`${day.date}T12:00:00Z`))}
                {renderProgress?.(day.date)}
              </span>
              <span className="text-xs text-muted-foreground">
                {sunday && !studyMinutes
                  ? "Sunday off"
                  : studyMinutes
                    ? `${duration(studyMinutes)} study`
                    : `${day.rows.length} commitments`}
              </span>
              <ChevronDown
                aria-hidden
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="min-w-0 pb-4">
              <Link
                className="inline-action mb-2"
                href={`/plan?date=${day.date}`}
              >
                Open day
              </Link>
              {day.rows.length || frame.length ? (
                <TimetableAgenda
                  date={day.date}
                  rows={day.rows}
                  frame={frame}
                  renderRow={renderRow}
                />
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  {sunday
                    ? "No required study. Personal activities can still be added."
                    : "No commitments scheduled."}
                </p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
