"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shiftDay, validDay } from "@/lib/day-plan";
export default function DaySelector({
  date,
  today,
  onChange,
}: {
  date: string;
  today: string;
  onChange: (date: string) => void;
}) {
  return (
    <div className="day-selector">
      <Button
        variant="outline"
        aria-label="Previous day"
        onClick={() => onChange(shiftDay(date, -1))}
      >
        ←
      </Button>
      <label className="sr-only" htmlFor="workspace-date">
        Selected date
      </label>
      <Input
        id="workspace-date"
        aria-label="Selected date"
        type="date"
        value={date}
        onChange={(e) => {
          if (validDay(e.target.value)) onChange(e.target.value);
        }}
      />
      <Button
        variant="outline"
        aria-label="Next day"
        onClick={() => onChange(shiftDay(date, 1))}
      >
        →
      </Button>
      {date !== today && (
        <Button variant="ghost" onClick={() => onChange(today)}>
          Today
        </Button>
      )}
    </div>
  );
}
