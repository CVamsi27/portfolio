"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { planningCanEdit } from "@/lib/day-plan";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import Modal from "@/components/trackers/Modal";
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
import {
  useMigrateTodos,
  useTodos,
  useGoalState,
  newTodo,
} from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Check,
  ListChecks,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type View = "today" | "tomorrow" | "upcoming" | "done";

const tomorrowKey = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateKey(d);
};

export default function TodoPage() {
  useMigrateTodos();
  const { value: todos, setValue: setTodos, status } = useTodos();
  const goal = useGoalState();
  const milestones = Object.values(
    goal.value.milestonesByCategory ?? {},
  ).flat();
  const safe = useMemo(() => todos ?? [], [todos]);

  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [removedTasks, setRemovedTasks] = useState<Todo[]>([]);
  const [priority, setPriority] = useState<TodoPriority>("P2");
  const [tag, setTag] = useState<TodoTag>("Personal");
  const [dateDraft, setDateDraft] = useState<"today" | "tomorrow">("today");
  const [view, setView] = useState<View>("today");
  const [tagFilter, setTagFilter] = useState<TodoTag | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "all">(
    "all",
  );
  const filtered = Boolean(
    search.trim() || tagFilter !== "all" || priorityFilter !== "all",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const today = dateKey();
  const tomorrow = tomorrowKey();

  const overdueTasks = useMemo(
    () => safe.filter((t) => t.date < today && !t.done),
    [safe, today],
  );

  const visible = useMemo(() => {
    let list: Todo[];
    if (view === "today")
      list = safe.filter(
        (t) => (t.date === today || t.date < today) && !t.done,
      );
    else if (view === "tomorrow")
      list = safe.filter((t) => t.date === tomorrow && !t.done);
    else if (view === "upcoming")
      list = safe.filter((t) => t.date > tomorrow && !t.done);
    else list = safe.filter((t) => t.done);
    if (tagFilter !== "all") list = list.filter((t) => t.tag === tagFilter);
    if (priorityFilter !== "all")
      list = list.filter((t) => t.priority === priorityFilter);
    if (search.trim())
      list = list.filter((t) =>
        t.text.toLowerCase().includes(search.trim().toLowerCase()),
      );
    // P1 first, overdue floats up within same priority, then by date
    const prioRank: Record<TodoPriority, number> = { P1: 0, P2: 1, P3: 2 };
    return [...list].sort((a, b) => {
      const aOverdue = a.date < today ? -1 : 0;
      const bOverdue = b.date < today ? -1 : 0;
      return (
        prioRank[a.priority] - prioRank[b.priority] ||
        aOverdue - bOverdue ||
        a.date.localeCompare(b.date)
      );
    });
  }, [safe, view, tagFilter, priorityFilter, search, today, tomorrow]);

  const todayList = safe.filter((t) =>
    t.done
      ? Boolean(t.completedAt && dateKey(new Date(t.completedAt)) === today)
      : t.date <= today,
  );
  const doneToday = todayList.filter((t) => t.done).length;
  const openToday = todayList.filter((t) => !t.done).length;
  const pct = todayList.length
    ? Math.round((doneToday / todayList.length) * 100)
    : 0;
  const streak = calculateStreak(
    Object.entries(
      safe.reduce<Record<string, number>>((acc, t) => {
        if (t.done && t.completedAt) {
          const k = dateKey(new Date(t.completedAt));
          acc[k] = (acc[k] ?? 0) + 1;
        }
        return acc;
      }, {}),
    )
      .filter(([, n]) => n > 0)
      .map(([k]) => k),
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
        t.id === id
          ? {
              ...t,
              done: !t.done,
              completedAt: !t.done ? Date.now() : undefined,
            }
          : t,
      ),
    );

  const remove = (id: string) => {
    setRemovedTasks(safe.filter((t) => t.id === id));
    setTodos((previous) => previous.filter((t) => t.id !== id));
  };
  const undoRemoval = () => {
    setTodos((previous) => [
      ...previous,
      ...removedTasks.filter((t) => !previous.some((p) => p.id === t.id)),
    ]);
    setRemovedTasks([]);
  };

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

  const clearDone = () => {
    setRemovedTasks(safe.filter((t) => t.done));
    setTodos((previous) => previous.filter((t) => !t.done));
  };

  // Push all overdue tasks to today
  const [reschedulePreview, setReschedulePreview] = useState(false);
  const rescheduleOverdue = () =>
    setTodos(
      safe.map((t) => (t.date < today && !t.done ? { ...t, date: today } : t)),
    );

  return (
    <RequireAuth>
      <TrackerShell
        icon="todo"
        title="Tasks"
        subtitle="Plan your day and keep priorities clear. Select a task to edit it."
        badge={<SyncBadge status={status} />}
        actions={{
          primary: (
            <a
              href="#todo-list"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Add task
            </a>
          ),
          secondary: (
            <a
              href="#todo-list"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open task list →
            </a>
          ),
        }}
      >
        {removedTasks.length > 0 && (
          <p
            role="status"
            className="flex flex-wrap items-center gap-3 text-sm"
          >
            {removedTasks.length} task(s) removed.
            <Button
              variant="outline"
              onClick={undoRemoval}
              aria-label="Undo task deletion"
            >
              Undo deletion
            </Button>
          </p>
        )}
        <Modal
          open={reschedulePreview}
          onClose={() => setReschedulePreview(false)}
          title="Move overdue tasks to today"
        >
          <p>
            {overdueTasks.length} pending tasks will move to {today}. Completed
            tasks stay unchanged.
          </p>
          <ul>
            {overdueTasks.map((t) => (
              <li key={t.id}>
                {t.text} · {t.date} → {today}
              </li>
            ))}
          </ul>
          <Button
            onClick={() => {
              rescheduleOverdue();
              setReschedulePreview(false);
            }}
          >
            Confirm reschedule
          </Button>
        </Modal>
        {/* ── Quick add ── */}
        <Card variant="dossier" id="todo-list">
          <CardContent className="space-y-3 p-5">
            <div className="flex gap-2">
              <Input
                aria-label="New task"
                placeholder="What needs to get done?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <Button onClick={add}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            <details className="task-options">
              <summary>
                Task options · {dateDraft} · {priority} · {tag}
              </summary>
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
                  options={TODO_PRIORITIES.map((p) => ({
                    value: p.id,
                    label: p.id,
                  }))}
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
            </details>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          <span>
            {doneToday}/{todayList.length} done today
          </span>{" "}
          ·{" "}
          <Link
            className="text-primary"
            href="/dashboard?view=work&metric=goals"
          >
            Task history →
          </Link>
        </p>
        {/* ── Views + tag filter ── */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="Task view"
            options={[
              {
                value: "today",
                label: `Today${openToday ? ` (${openToday})` : ""}`,
              },
              { value: "tomorrow", label: "Tomorrow" },
              { value: "upcoming", label: "Upcoming" },
              { value: "done", label: "Completed" },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
        <div className="task-filter-grid">
          <label>
            Search tasks
            <Input
              aria-label="Search tasks"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this view"
            />
          </label>
          <label>
            Priority
            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as TodoPriority | "all")
              }
            >
              <option value="all">All priorities</option>
              {TODO_PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tag
            <select
              aria-label="Filter by tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value as TodoTag | "all")}
            >
              <option value="all">All tags</option>
              {TODO_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {filtered && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setTagFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* ── Overdue rescue banner ── */}
        {view === "today" && overdueTasks.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/8 px-3 py-2.5">
            <p className="text-xs font-semibold text-rose-400">
              {overdueTasks.length} overdue task
              {overdueTasks.length === 1 ? "" : "s"} carried from previous days
            </p>
            <button
              onClick={() => setReschedulePreview(true)}
              className="shrink-0 rounded-lg border border-rose-500/40 px-2.5 py-1 text-xs font-bold text-rose-400 transition-colors hover:border-rose-400 hover:text-rose-300"
            >
              Push all to today
            </button>
          </div>
        )}

        {/* ── Task list ── */}
        <Card variant="dossier">
          <CardContent className="p-5">
            {visible.length === 0 ? (
              <EmptyState
                icon={view === "done" ? Check : ListChecks}
                title={
                  filtered
                    ? "No matching tasks"
                    : view === "done"
                      ? "Nothing completed yet"
                      : view === "today"
                        ? "Today is clear"
                        : view === "tomorrow"
                          ? "Nothing planned for tomorrow"
                          : "No upcoming tasks"
                }
                hint={
                  filtered
                    ? "Clear filters or change the search to see more tasks."
                    : "Add a task above. Open Task options to choose its date, priority and tag."
                }
              />
            ) : (
              <ul className="space-y-2">
                {visible.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "task-row group flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      t.done
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : t.date < today
                          ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                          : "border-border/60 hover:border-primary/30",
                    )}
                  >
                    <button
                      onClick={() => toggle(t.id)}
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-xs transition-all active:scale-90",
                        t.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted-foreground/50",
                      )}
                      aria-pressed={t.done}
                      aria-label={
                        t.done
                          ? `Mark "${t.text}" not done`
                          : `Mark "${t.text}" done`
                      }
                    >
                      {t.done ? <Check className="h-3 w-3" /> : ""}
                    </button>

                    {editingId === t.id ? (
                      <div className="order-last grid w-full min-w-0 gap-2 sm:order-none sm:w-auto sm:flex-1 sm:grid-cols-2">
                        <Input
                          aria-label="Edit task name"
                          className="min-h-11 flex-1"
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(t.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <label className="field-label">
                          Goal milestone
                          <select
                            aria-label="Goal milestone"
                            value={t.milestoneId ?? ""}
                            onChange={(e) =>
                              setTodos((p) =>
                                p.map((item) =>
                                  item.id === t.id
                                    ? {
                                        ...item,
                                        milestoneId:
                                          e.target.value || undefined,
                                      }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">No milestone</option>
                            {milestones.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.title}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs">
                          Due date
                          <Input
                            type="date"
                            aria-label={`Due date for ${t.text}`}
                            value={t.date}
                            onChange={(e) => {
                              if (!/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))
                                return;
                              setTodos((previous) =>
                                previous.map((item) =>
                                  item.id === t.id
                                    ? { ...item, date: e.target.value }
                                    : item,
                                ),
                              );
                              setEditingId(null);
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(t.id);
                          setEditDraft(t.text);
                        }}
                        className={cn(
                          "task-name min-w-0 min-h-11 flex-1 break-words text-left",
                          t.done && "line-through opacity-60",
                        )}
                        title="Click to edit"
                      >
                        {t.text}
                      </button>
                    )}

                    {!t.done &&
                      planningCanEdit(
                        isSupabaseConfigured(),
                        process.env.NEXT_PUBLIC_DAILY_PLAN_ENABLED,
                      ) && (
                        <Link
                          className="inline-action task-schedule order-last w-full sm:order-none sm:w-auto"
                          href={`/plan?schedule=${encodeURIComponent(t.id)}&date=${t.date < today ? today : t.date}`}
                        >
                          Schedule
                        </Link>
                      )}
                    {/* Overdue badge */}
                    {!t.done && t.date < today && (
                      <span className="shrink-0 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-500">
                        Overdue
                      </span>
                    )}

                    <span className="hidden shrink-0 sm:block">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-semibold",
                          TAG_COLORS[t.tag],
                        )}
                      >
                        {t.tag}
                      </span>
                    </span>

                    <button
                      onClick={() => cyclePriority(t)}
                      aria-label="Cycle priority"
                      className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-bold transition-colors hover:bg-accent"
                      title="Click to cycle priority"
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          TODO_PRIORITIES.find((p) => p.id === t.priority)?.dot,
                        )}
                      />
                      {t.priority}
                    </button>

                    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {t.date === today ? "" : t.date.slice(5)}
                    </span>

                    {!t.done ? (
                      <Link
                        href={`/plan?task=${encodeURIComponent(t.id)}#focus-sprint`}
                        title={`Focus on "${t.text}"`}
                        aria-label={`Focus on "${t.text}"`}
                        className="inline-flex h-11 w-11 items-center justify-center shrink-0 text-muted-foreground transition-colors hover:text-primary sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}

                    <button
                      onClick={() => remove(t.id)}
                      aria-label="Delete task"
                      className="inline-flex h-11 w-11 items-center justify-center shrink-0 text-muted-foreground transition-colors hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {view === "done" && safe.some((t) => t.done) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={clearDone}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear completed
              </Button>
            )}
            {view === "today" && openToday === 0 && todayList.length > 0 && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-emerald-500">
                <CalendarDays className="h-4 w-4" /> All done for today.
                Beautiful.
              </p>
            )}
          </CardContent>
        </Card>
      </TrackerShell>
    </RequireAuth>
  );
}
