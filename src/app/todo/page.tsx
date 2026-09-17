"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Segmented from "@/components/trackers/Segmented";
import EmptyState from "@/components/trackers/EmptyState";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SyncBadge } from "@/components/auth/AuthButton";
import {
  type Todo,
  type TodoPriority,
  type TodoTag,
  TAG_COLORS,
  TODO_PRIORITIES,
  TODO_TAGS,
  calculateStreak,
  dateKey,
} from "@/lib/trackers";
import { useMigrateTodos, useTodos, newTodo } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import { CalendarDays, Check, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import SignalPanel from "@/components/trackers/SignalPanel";
import StoryPanel from "@/components/trackers/StoryPanel";

type View = "today" | "tomorrow" | "upcoming" | "done";

const tomorrowKey = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateKey(d);
};

export default function TodoPage() {
  useMigrateTodos();
  const { value: todos, setValue: setTodos, status } = useTodos();
  const safe = useMemo(() => todos ?? [], [todos]);

  const [text, setText] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("P2");
  const [tag, setTag] = useState<TodoTag>("Personal");
  const [dateDraft, setDateDraft] = useState<"today" | "tomorrow">("today");
  const [view, setView] = useState<View>("today");
  const [tagFilter, setTagFilter] = useState<TodoTag | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const today = dateKey();
  const tomorrow = tomorrowKey();

  const visible = useMemo(() => {
    let list: Todo[];
    if (view === "today") list = safe.filter((t) => t.date === today && !t.done);
    else if (view === "tomorrow") list = safe.filter((t) => t.date === tomorrow && !t.done);
    else if (view === "upcoming") list = safe.filter((t) => t.date > tomorrow && !t.done);
    else list = safe.filter((t) => t.done);
    if (tagFilter !== "all") list = list.filter((t) => t.tag === tagFilter);
    // P1 first, then by date
    const prioRank: Record<TodoPriority, number> = { P1: 0, P2: 1, P3: 2 };
    return [...list].sort((a, b) => prioRank[a.priority] - prioRank[b.priority] || a.date.localeCompare(b.date));
  }, [safe, view, tagFilter, today, tomorrow]);

  const todayList = safe.filter((t) => t.date === today || (t.date < today && !t.done));
  const doneToday = todayList.filter((t) => t.done).length;
  const openToday = todayList.filter((t) => !t.done).length;
  const pct = todayList.length ? Math.round((doneToday / todayList.length) * 100) : 0;
  const streak = calculateStreak(
    Object.entries(safe.reduce<Record<string, number>>((acc, t) => {
      if (t.done && t.completedAt) {
        const k = new Date(t.completedAt).toISOString().slice(0, 10);
        acc[k] = (acc[k] ?? 0) + 1;
      }
      return acc;
    }, {})).filter(([, n]) => n > 0).map(([k]) => k),
  );

  const add = () => {
    const v = text.trim();
    if (!v) return;
    const date = dateDraft === "tomorrow" ? tomorrow : today;
    setTodos([...safe, newTodo(v, { date, priority, tag })]);
    setText(""); // keep focus for chained entry
  };

  const toggle = (id: string) =>
    setTodos(
      safe.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined } : t,
      ),
    );

  const remove = (id: string) => setTodos(safe.filter((t) => t.id !== id));

  const cyclePriority = (t: Todo) => {
    const order: TodoPriority[] = ["P1", "P2", "P3"];
    const next = order[(order.indexOf(t.priority) + 1) % 3];
    setTodos(safe.map((x) => (x.id === t.id ? { ...x, priority: next } : x)));
  };

  const saveEdit = (id: string) => {
    const v = editDraft.trim();
    if (v) setTodos(safe.map((t) => (t.id === id ? { ...t, text: v } : t)));
    setEditingId(null);
  };

  const clearDone = () => setTodos(safe.filter((t) => !t.done));

  return (
    <RequireAuth>
      <TrackerShell
        icon="todo"
        title="Todo"
        subtitle="Focused task manager — priorities, tags and date planning. Enter chains tasks; click a title to edit inline."
        badge={<SyncBadge status={status} />}
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <StoryPanel
            eyebrow="Next action"
            title="Today&apos;s next move"
            action={<a href="#todo-list" className="dossier-back-link">Open task list</a>}
          >
            {openToday
              ? `${openToday} task${openToday === 1 ? "" : "s"} waiting in today’s queue. Start with the highest-priority move.`
              : "Add one concrete task to open the next scene, or use the completed view to review the streak."}
          </StoryPanel>
          <SignalPanel
            label="Completion signal"
            value={`${pct}%`}
            detail={`${doneToday}/${todayList.length} done today · ${streak}-day streak`}
            progress={pct}
            tone="lime"
          />
        </div>
        {/* ── Quick add ── */}
        <Card id="todo-list">
          <CardContent className="space-y-3 p-5">
            <div className="flex gap-2">
              <Input
                placeholder="Add a task + Enter (keeps focus for chaining)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                autoFocus
              />
              <Button onClick={add}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Segmented
                label="Task date"
                variant="soft"
                options={[
                  { value: "today", label: "Today" },
                  { value: "tomorrow", label: "Tomorrow" },
                ]}
                value={dateDraft}
                onChange={setDateDraft}
              />
              <Segmented
                label="Priority"
                variant="soft"
                options={TODO_PRIORITIES.map((p) => ({ value: p.id, label: p.id }))}
                value={priority}
                onChange={setPriority}
              />
              <Segmented
                label="Tag"
                variant="soft"
                options={TODO_TAGS.map((t) => ({ value: t, label: t }))}
                value={tag}
                onChange={setTag}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Progress + streak ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {doneToday}/{todayList.length} done today
              </span>
              <span className="text-xs text-muted-foreground">🔥 {streak}-day completion streak</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* ── Views + tag filter ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="Task view"
            options={[
              { value: "today", label: `Today${openToday ? ` (${openToday})` : ""}` },
              { value: "tomorrow", label: "Tomorrow" },
              { value: "upcoming", label: "Upcoming" },
              { value: "done", label: "Completed" },
            ]}
            value={view}
            onChange={setView}
          />
          <Segmented
            label="Tag filter"
            variant="soft"
            options={[{ value: "all" as const, label: "All" }, ...TODO_TAGS.map((t) => ({ value: t, label: t }))]}
            value={tagFilter}
            onChange={setTagFilter}
          />
        </div>

        {/* ── Task list ── */}
        <Card>
          <CardContent className="p-5">
            {visible.length === 0 ? (
              <EmptyState
                icon={view === "done" ? Check : ListChecks}
                title={
                  view === "done"
                    ? "Nothing completed yet"
                    : view === "today"
                      ? "Today is clear"
                      : view === "tomorrow"
                        ? "Nothing planned for tomorrow"
                        : "No upcoming tasks"
                }
                hint="Add tasks above — set a priority, a tag, and schedule for today or tomorrow."
              />
            ) : (
              <ul className="space-y-2">
                {visible.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      t.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 hover:border-primary/30",
                    )}
                  >
                    <button
                      onClick={() => toggle(t.id)}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-all active:scale-90",
                        t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/50",
                      )}
                      aria-pressed={t.done}
                      aria-label={t.done ? `Mark "${t.text}" not done` : `Mark "${t.text}" done`}
                    >
                      {t.done ? <Check className="h-3 w-3" /> : ""}
                    </button>

                    {editingId === t.id ? (
                      <Input
                        className="h-8 flex-1"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(t.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(t.id);
                          setEditDraft(t.text);
                        }}
                        className={cn("min-w-0 flex-1 truncate text-left", t.done && "line-through opacity-60")}
                        title="Click to edit"
                      >
                        {t.text}
                      </button>
                    )}

                    <span className="hidden shrink-0 sm:block">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", TAG_COLORS[t.tag])}>{t.tag}</span>
                    </span>

                    <button
                      onClick={() => cyclePriority(t)}
                      aria-label="Cycle priority"
                      className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold transition-colors hover:bg-accent"
                      title="Click to cycle priority"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", TODO_PRIORITIES.find((p) => p.id === t.priority)?.dot)} />
                      {t.priority}
                    </button>

                    <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {t.date === today ? "" : t.date.slice(5)}
                    </span>

                    <button
                      onClick={() => remove(t.id)}
                      aria-label="Delete task"
                      className="shrink-0 text-muted-foreground transition-colors hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {view === "done" && safe.some((t) => t.done) && (
              <Button variant="outline" size="sm" className="mt-3" onClick={clearDone}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear completed
              </Button>
            )}
            {view === "today" && openToday === 0 && todayList.length > 0 && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-emerald-500">
                <CalendarDays className="h-4 w-4" /> All done for today. Beautiful.
              </p>
            )}
          </CardContent>
        </Card>
      </TrackerShell>
    </RequireAuth>
  );
}
