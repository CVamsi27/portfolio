"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useJournal } from "@/lib/tracker-store";
import { dateKey } from "@/lib/trackers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validDay } from "@/lib/day-plan";
export default function JournalWorkspace() {
  const params = useSearchParams();
  const store = useJournal();
  const [date, setDate] = useState(() => {
    const value = params.get("date");
    return validDay(value) ? value : dateKey();
  });
  const [draft, setDraft] = useState<{
    win: string;
    learned: string;
    focus: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const value = draft ??
    store.value[date] ?? { win: "", learned: "", focus: "" };
  return (
    <section className="workspace-panel">
      <div className="workspace-heading">
        <h2>Daily reflection</h2>
        <Link href="/dashboard?view=reflection">Progress reflection →</Link>
      </div>
      <label className="field-label">
        Date
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            if (validDay(e.target.value)) {
              if (draft && !window.confirm("Discard the unsaved reflection?"))
                return;
              setDate(e.target.value);
              setDraft(null);
            }
          }}
        />
      </label>
      {(
        [
          ["win", "What went well?"],
          ["learned", "What did you learn?"],
          ["focus", "What will you do next?"],
        ] as const
      ).map(([key, label]) => (
        <label className="field-label" key={key}>
          {label}
          <textarea
            value={value[key]}
            onChange={(e) => setDraft({ ...value, [key]: e.target.value })}
          />
        </label>
      ))}
      <Button
        onClick={() => {
          store.setValue((p) => ({
            ...p,
            [date]: { ...value, updatedAt: Date.now() },
          }));
          setDraft(null);
          setMessage("Reflection saved on this device.");
        }}
      >
        Save reflection
      </Button>
      {message && <p role="status">{message}</p>}
      <details>
        <summary>Past entries</summary>
        {Object.entries(store.value)
          .filter(([, v]) => [v.win, v.learned, v.focus].some((x) => x.trim()))
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([day, v]) => (
            <button
              className="history-row"
              key={day}
              onClick={() => {
                if (draft && !window.confirm("Discard the unsaved reflection?"))
                  return;
                setDate(day);
                setDraft(null);
              }}
            >
              <strong>{day}</strong>
              <span>{v.win || v.learned || v.focus}</span>
            </button>
          ))}
      </details>
    </section>
  );
}
