"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Activity =
  | string
  | { label: string; minutes?: number; work?: boolean; output?: string };
export type DailySchedule = Record<string, Activity>;

function minuteOfDay(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const value = Number(match[1]) * 60 + Number(match[2]);
  return Number(match[1]) < 24 && Number(match[2]) < 60 ? value : null;
}
function hours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ") || "0m";
}

export default function DailyTimetable({
  schedule,
  timeZone,
  date,
  title = "Today's timetable",
}: {
  schedule: DailySchedule;
  timeZone?: string;
  date: string;
  title?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  useEffect(() => {
    const refresh = () => setNow(Math.floor(Date.now() / 60_000) * 60_000);
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  const zone =
    timeZone ??
    (now === null ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone);
  const currentDate =
    now === null
      ? null
      : new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(now);
  const currentMinute =
    now === null
      ? null
      : minuteOfDay(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: zone,
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(now),
        );
  const isToday = date === currentDate;
  const blocks = Object.entries(schedule)
    .map(([range, activity]) => {
      const [start, end] = range.split(/\s*[-–—]\s*/).map(minuteOfDay);
      const block =
        typeof activity === "string" ? { label: activity } : activity;
      const minutes =
        block.minutes ??
        (start !== null && end !== null && end >= start ? end - start : 0);
      return { range, start, end, ...block, minutes };
    })
    .sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity));
  const active =
    isToday && currentMinute !== null
      ? blocks.find(
          (block) =>
            block.start !== null &&
            block.end !== null &&
            currentMinute >= block.start &&
            currentMinute < block.end,
        )
      : undefined;
  const next =
    isToday && currentMinute !== null
      ? blocks.find(
          (block) => block.start !== null && block.start > currentMinute,
        )
      : undefined;
  const focus = blocks
    .filter((block) => block.work === true)
    .reduce((total, block) => total + block.minutes, 0);
  const unclassified = blocks.some((block) => block.work === undefined);
  const scheduled = blocks.reduce((total, block) => total + block.minutes, 0);
  const displayRange = (range: string) => range.replace(/\s*[-–—]\s*/, "–");
  return (
    <section
      aria-label={title}
      className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Clock aria-hidden className="h-4 w-4 text-primary" />
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {unclassified
              ? `${hours(scheduled)} scheduled`
              : `${hours(focus)} planned focus`}{" "}
            · {zone === "Asia/Kolkata" ? "IST" : zone}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-primary hover:bg-accent"
        >
          {expanded ? "Hide schedule" : "Show schedule"}
          <ChevronDown
            aria-hidden
            className={cn("h-4 w-4", expanded && "rotate-180")}
          />
        </button>
      </div>
      {now !== null && (
        <div className="mt-3 space-y-1 rounded-lg border border-border bg-background/60 p-3 text-sm">
          {!isToday ? (
            <p>
              Schedule for {date}. Open today&apos;s plan for current blocks.
            </p>
          ) : active ? (
            <>
              <p className="font-semibold text-primary">
                Now: {displayRange(active.range)}
              </p>
              <p className="break-words">{active.label}</p>
            </>
          ) : (
            <p>{next ? "Between blocks" : "No more blocks scheduled today"}</p>
          )}
          {next && (
            <p className="break-words text-muted-foreground">
              Next: {displayRange(next.range)} · {next.label}
            </p>
          )}
        </div>
      )}
      <div id={id} hidden={!expanded} className="mt-3">
        {blocks.length ? (
          <ol className="space-y-2">
            {blocks.map((block) => {
              const current = block === active;
              const elapsed =
                isToday &&
                currentMinute !== null &&
                block.end !== null &&
                currentMinute >= block.end;
              return (
                <li
                  key={block.range}
                  aria-current={current ? "time" : undefined}
                  className={cn(
                    "rounded-lg border p-3",
                    current
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-background/40",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {displayRange(block.range)} · {block.minutes} min
                    </span>
                    <span>
                      {current
                        ? "Current"
                        : elapsed
                          ? "Time elapsed"
                          : "Planned"}
                      {block.work === false ? " · Break" : ""}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm font-medium">
                    {block.label}
                  </p>
                  {block.output && (
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      Output: {block.output}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            No blocks planned for this date.
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Planned time is not proof of completion. Record evidence in your
          checklist.
        </p>
      </div>
    </section>
  );
}
