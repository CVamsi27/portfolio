"use client";

import { useEffect, useRef } from "react";
import { containingWeek } from "@/lib/day-presentation";
import DaySelector from "./DaySelector";

export default function WeekDateStrip({
  date,
  today,
  onChange,
}: {
  date: string;
  today: string;
  onChange: (date: string) => void;
}) {
  const stripRef = useRef<HTMLElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const revealSelectedDate = () => {
      const selected = selectedRef.current;
      if (!selected) return;
      const stripBounds = strip.getBoundingClientRect();
      const selectedBounds = selected.getBoundingClientRect();
      if (selectedBounds.left < stripBounds.left) {
        strip.scrollLeft += selectedBounds.left - stripBounds.left;
      } else if (selectedBounds.right > stripBounds.right) {
        strip.scrollLeft += selectedBounds.right - stripBounds.right;
      }
    };

    revealSelectedDate();
    const observer = new ResizeObserver(revealSelectedDate);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [date]);

  return (
    <div className="nova-calendar-row">
      <nav ref={stripRef} className="nova-week-strip" aria-label="Week dates">
        {containingWeek(date).map((day) => {
          const value = new Date(day + "T12:00:00Z");
          return (
            <button
              key={day}
              ref={day === date ? selectedRef : undefined}
              type="button"
              aria-pressed={day === date}
              aria-label={new Intl.DateTimeFormat("en", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(value)}
              onClick={() => onChange(day)}
            >
              <span>
                {new Intl.DateTimeFormat("en", {
                  weekday: "short",
                  timeZone: "UTC",
                }).format(value)}
              </span>
              <strong>{value.getUTCDate()}</strong>
            </button>
          );
        })}
      </nav>
      <DaySelector date={date} today={today} onChange={onChange} />
    </div>
  );
}
