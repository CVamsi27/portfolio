"use client";

import { useMemo } from "react";
import { Quote } from "lucide-react";
import { MOTIVATION_QUOTES, dateKey } from "@/lib/trackers";
import { useCustomQuotes } from "@/lib/tracker-store";

/**
 * DailyThought — a single rotating motivational line anchored to today's date.
 * Uses the same quote pool as the Motivation page so no extra data is needed.
 * The index is stable for the day (changes at midnight).
 */
export default function DailyThought() {
  const { value: customQuotes } = useCustomQuotes();

  const quote = useMemo(() => {
    const defaultQuotes = Object.values(MOTIVATION_QUOTES).flat();
    const pool = [
      ...defaultQuotes.map((q) => ({ text: q.text, author: "" })),
      ...(customQuotes ?? []).map((q) => ({ text: q.text, author: "You" })),
    ];
    if (!pool.length) return null;
    // Stable daily index based on today's date string
    const seed = dateKey(new Date())
      .split("-")
      .reduce((acc, part) => acc + parseInt(part, 10), 0);
    return pool[seed % pool.length];
  }, [customQuotes]);

  if (!quote) return null;

  return (
    <div
      data-testid="daily-thought"
      className="flex items-start gap-3 rounded-xl border border-[#32b8c8]/20 bg-[#0d2028]/60 px-4 py-3"
      aria-label="Daily thought"
    >
      <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#32b8c8] opacity-70" aria-hidden />
      <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">
        <span className="text-foreground/90">{quote.text}</span>
        {quote.author ? (
          <span className="ml-2 text-[11px] font-mono text-[#32b8c8]/70">— {quote.author}</span>
        ) : null}
      </p>
    </div>
  );
}
