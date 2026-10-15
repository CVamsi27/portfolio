"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shiftDay, validDay } from "@/lib/day-plan";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useId } from "react";
export default function DaySelector({
  date,
  today,
  onChange,
}: {
  date: string;
  today: string;
  onChange: (date: string) => void;
}) {
  const inputId = useId();
  return (
    <div className="day-selector">
      <Button
        variant="outline"
        aria-label="Previous day"
        onClick={() => onChange(shiftDay(date, -1))}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Button>
      <label className="sr-only" htmlFor={inputId}>
        Selected date
      </label>
      <Input
        id={inputId}
        aria-label="Selected date"
        type="date"
        value={date}
        onInput={(e) => {
          if (validDay(e.currentTarget.value)) onChange(e.currentTarget.value);
        }}
        onChange={(e) => {
          if (validDay(e.currentTarget.value)) onChange(e.currentTarget.value);
        }}
      />
      <Button
        variant="outline"
        aria-label="Next day"
        onClick={() => onChange(shiftDay(date, 1))}
      >
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
      {date !== today && (
        <Button variant="ghost" onClick={() => onChange(today)}>
          Today
        </Button>
      )}
    </div>
  );
}
