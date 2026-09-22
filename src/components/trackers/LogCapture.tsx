"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Dumbbell, FileText, Scale, Timer, ListChecks } from "lucide-react";
import { useJournal, useTodos } from "@/lib/tracker-store";
import { dateKey, type Todo } from "@/lib/trackers";
import { useUserPrefs } from "@/lib/user-prefs";

export default function LogCapture() {
  const { prefs } = useUserPrefs();
  const { value: todos, setValue: setTodos } = useTodos();
  const { value: journal, setValue: setJournal } = useJournal();
  const [task, setTask] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const today = dateKey();

  const saveTask = () => {
    const text = task.trim();
    if (!text) return;
    const next: Todo = { id: `t_${Date.now().toString(36)}`, text, done: false, date: today, priority: "P2", tag: "Goal", createdAt: Date.now() };
    setTodos([...(todos ?? []), next]);
    setTask("");
    setMessage("Task added to Today");
  };

  const saveNote = () => {
    const text = note.trim();
    if (!text) return;
    const previous = journal?.[today];
    setJournal({ ...(journal ?? {}), [today]: { win: previous?.win ?? "", learned: previous?.learned ?? "", focus: text, updatedAt: Date.now() } });
    setNote("");
    setMessage("Note saved to Today");
  };

  return (
    <section data-testid="log-capture" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-border/70 bg-card/60 p-4 sm:p-5">
          <div className="flex items-start gap-3"><ListChecks className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="font-display text-lg font-bold">Task</h2><p className="mt-1 text-sm text-muted-foreground">Give Today one concrete move.</p></div></div>
          <div className="mt-4 flex gap-2"><input aria-label="Task to log" className="min-w-0 flex-1 border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="e.g. Send the application" value={task} onChange={(event) => setTask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveTask()} /><button type="button" onClick={saveTask} className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground">Save</button></div>
        </div>

        <Link href="/weight-loss#weigh-in" className="group border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/70 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><Scale className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="font-display text-lg font-bold">Weight</h2><p className="mt-1 text-sm text-muted-foreground">Record today&apos;s weigh-in and recovery.</p></div></div><ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div></Link>
        <Link href="/workout-tracking" className="group border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/70 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><Dumbbell className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="font-display text-lg font-bold">Workout</h2><p className="mt-1 text-sm text-muted-foreground">Log the session while it is still fresh.</p></div></div><ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div></Link>
        <Link href="/intermittent-fasting" className="group border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/70 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><Timer className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="font-display text-lg font-bold">Fasting</h2><p className="mt-1 text-sm text-muted-foreground">Start or close a meal window.</p></div></div><ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div></Link>
      </div>

      <div className="border border-border/70 bg-card/60 p-4 sm:p-5"><div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="font-display text-lg font-bold">Note</h2><p className="mt-1 text-sm text-muted-foreground">Capture one thought without opening the full reflection.</p></div></div><textarea aria-label="Note to log" className="mt-4 min-h-24 w-full resize-y border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="What should you remember from today?" value={note} onChange={(event) => setNote(event.target.value)} /><button type="button" onClick={saveNote} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground"><Check className="h-3.5 w-3.5" /> Save note</button></div>
      {message ? <p role="status" className="text-sm font-semibold text-emerald-500">{message}</p> : null}
      <p className="text-xs text-muted-foreground">{prefs.goalTitle || "Your captures stay private and sync through your existing tracker store when connected."}</p>
    </section>
  );
}
