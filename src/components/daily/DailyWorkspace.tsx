"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useAuth } from "@/lib/auth-store";
import Questionnaire from "@/components/Questionnaire";
import { useUserPrefs, displayGoalTitle } from "@/lib/user-prefs";
import { useTodos, useNow } from "@/lib/tracker-store";
import { useDayPlan } from "@/lib/day-plan-store";
import {
  calendarZone,
  dayAgenda,
  timetableBlocks,
  validDay,
  validPlanBlock,
  conflicts,
  shiftDay,
  type PlanBlock,
  type AgendaItem,
} from "@/lib/day-plan";
import {
  routineOccurrences,
  zonedDate,
  type RoutineHistory,
} from "@/lib/routine-reminders";
import { personalSchedule } from "@/lib/personal-timetable";
import { useRoutine } from "@/lib/routine-store";
import { usePersonalModules } from "@/lib/personal-modules";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import { useWorkSession } from "@/lib/work-session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DaySelector from "./DaySelector";
import HabitChecklist from "@/components/personal/HabitChecklist";
import FocusSprint from "@/components/trackers/FocusSprint";
import { displayWeight } from "@/lib/health";
import WorldClockStrip from "@/components/trackers/WorldClockStrip";
import Modal from "@/components/trackers/Modal";
const deviceZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
export default function DailyWorkspace({
  planning = false,
}: {
  planning?: boolean;
}) {
  const params = useSearchParams(),
    router = useRouter();
  const { user } = useAuth();
  const { prefs } = useUserPrefs();
  const timeZone = calendarZone(prefs.timeZone);
  const now = useNow(30000),
    today = zonedDate(now, timeZone);
  const date = validDay(params.get("date")) ? params.get("date")! : today;
  const view =
    params.get("view") ??
    (params.get("task") ||
    params.get("label") ||
    (typeof window !== "undefined" && window.location.hash === "#focus-sprint")
      ? "focus"
      : "day");
  const todos = useTodos(),
    plan = useDayPlan(),
    routine = useRoutine(),
    modules = usePersonalModules(),
    work = useWorkSession();
  const water = useSyncedStorage<Record<string, number>>("fasting:water", {});
  const [waterUndo, setWaterUndo] = useState<string | null>(null);
  const { data: records } = usePersonalProgress(1, date);
  const [editing, setEditing] = useState<PlanBlock | null>(null),
    [editor, setEditor] = useState(Boolean(params.get("schedule"))),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [removed, setRemoved] = useState<PlanBlock | null>(null),
    [confirmOverlap, setConfirmOverlap] = useState(false);
  const [title, setTitle] = useState(""),
    [kind, setKind] = useState<PlanBlock["kind"]>("task"),
    [taskId, setTaskId] = useState(params.get("schedule") ?? ""),
    [start, setStart] = useState("09:00"),
    [duration, setDuration] = useState("60");
  const setDate = (day: string) => {
    const q = new URLSearchParams(params.toString());
    q.set("date", day);
    router.replace(`${planning ? "/plan" : "/hub"}?${q}`);
  };
  const timetable = useSyncedStorage<{
    timezone?: string;
    days: Array<{
      day?: number;
      date: string;
      title?: string;
      schedule?: Record<
        string,
        | string
        | { label: string; minutes?: number; work?: boolean; output?: string }
      >;
    }>;
  } | null>("timetable_100_days", null);
  const storedDay = timetable.value?.days.find((day) => day.date === date);
  const prescribed = modules.value.study
    ? personalSchedule(user?.email, date)
    : undefined;
  const sourceDays = [shiftDay(date, -1), date, shiftDay(date, 1)];
  const ownerBlocks = Object.assign(
    {},
    ...sourceDays.map((sourceDate) => {
      const prescribed = modules.value.study
        ? personalSchedule(user?.email, sourceDate)
        : undefined;
      const storedDay = timetable.value?.days?.find(
        (d) => d.date === sourceDate,
      );
      return modules.value.study
        ? timetableBlocks(
            sourceDate,
            prescribed ?? storedDay?.schedule ?? {},
            prescribed
              ? "Asia/Kolkata"
              : (timetable.value?.timezone ?? timeZone),
            prescribed ? "owner" : "timetable",
          )
        : {};
    }),
  ) as Record<string, PlanBlock>;
  const allBlocks = { ...ownerBlocks, ...plan.blocks.value };
  const rows = dayAgenda({
    date,
    calendarTimeZone: timeZone,
    blocks: allBlocks,
    tasks: todos.value,
    routines: modules.value.routine
      ? sourceDays.flatMap((day) => routineOccurrences(routine.items, day))
      : [],
    history: routine.history.value,
  });
  const completed = rows.filter((row) => row.done);
  const incomplete = rows.filter((row) => !row.done);
  const current = incomplete.find(
    (row) => row.at <= now && row.at + (row.durationMinutes ?? 0) * 60000 > now,
  );
  const next = current ?? incomplete.find((row) => row.at >= now);
  const scheduledTasks = new Set(
    rows.map((row) => row.block?.sourceId).filter(Boolean),
  );
  const priorities = plan.days.value[date]?.deleted
    ? []
    : (plan.days.value[date]?.priorityTaskIds ?? []);
  const pending = todos.value
    .filter((t) => !t.done && t.date <= date && !scheduledTasks.has(t.id))
    .sort(
      (a, b) =>
        Number(priorities.includes(b.id)) - Number(priorities.includes(a.id)) ||
        a.priority.localeCompare(b.priority) ||
        a.createdAt - b.createdAt,
    );
  const selectedTask = todos.value.find((t) => t.id === params.get("task"));
  const begin = (block?: PlanBlock) => {
    setEditing(block ?? null);
    setTitle(block?.title ?? "");
    setKind(block?.kind ?? "task");
    setTaskId(block?.sourceId ?? "");
    setStart(block?.startLocal ?? "09:00");
    setDuration(String(block?.durationMinutes ?? 60));
    setEditor(true);
    setError("");
    setConfirmOverlap(false);
  };
  const save = () => {
    if (!plan.enabled) {
      setError(
        "Planning edits become available after cloud rollout verification.",
      );
      return;
    }
    const task = todos.value.find((t) => t.id === taskId);
    const b: PlanBlock = {
      ...editing,
      deleted: false,
      id: editing?.id ?? crypto.randomUUID(),
      date,
      startLocal: start,
      durationMinutes: Number(duration),
      timeZone,
      kind,
      title: kind === "task" && task ? task.text : title.trim(),
      sourceId: kind === "task" && task ? task.id : undefined,
      updatedAt: Math.max(now, (editing?.updatedAt ?? 0) + 1),
    };
    if (!validPlanBlock(b)) {
      setError(
        "Choose a title, valid start time and whole-minute duration ending before midnight.",
      );
      return;
    }
    if (kind === "task" && !task) {
      setError("Choose an existing task or select Personal event.");
      return;
    }
    const overlapping = Object.values(allBlocks).filter(
      (x) => validPlanBlock(x) && conflicts(b, x),
    );
    if (overlapping.length && !confirmOverlap) {
      setError(
        `Overlaps ${overlapping.map((x) => x.title).join(", ")}. Save again to keep both, or change the time.`,
      );
      setConfirmOverlap(true);
      return;
    }
    try {
      plan.blocks.setValue((p) => ({ ...p, [b.id]: b }));
      setEditor(false);
      setMessage("Time block saved on this device.");
    } catch {
      setError("Unable to save. Your draft is retained.");
    }
  };
  const remove = (b: PlanBlock) => {
    plan.blocks.setValue((p) => ({
      ...p,
      [b.id]: {
        ...p[b.id],
        deleted: true,
        updatedAt: Math.max(now, p[b.id].updatedAt + 1),
      },
    }));
    setRemoved(b);
    setMessage(
      "Time block removed. Its task and activity records are retained.",
    );
  };
  const togglePriority = (id: string) => {
    if (!plan.enabled) return;
    const next = priorities.includes(id)
      ? priorities.filter((x) => x !== id)
      : [...priorities, id];
    if (next.length > 3) {
      setMessage(
        "Choose up to three priorities. Unpin one before adding another.",
      );
      return;
    }
    plan.days.setValue((p) => ({
      ...p,
      [date]: {
        date,
        priorityTaskIds: next,
        updatedAt: Math.max(now, (p[date]?.updatedAt ?? 0) + 1),
      },
    }));
  };
  const act = (row: AgendaItem, status: RoutineHistory["status"]) => {
    if (!row.occurrence) return;
    const occurrence = row.occurrence;
    routine.history.setValue((p) => ({
      ...p,
      [occurrence.id]: {
        ...occurrence,
        status,
        snoozeUntil:
          status === "snoozed"
            ? Math.max(now, occurrence.scheduledAt) + 15 * 60000
            : undefined,
        completedAt: status === "snoozed" ? undefined : now,
        updatedAt: Math.max(now, (p[occurrence.id]?.updatedAt ?? 0) + 1),
      },
    }));
    setMessage(
      status === "snoozed"
        ? "Reminder moved 15 minutes later."
        : "Routine updated.",
    );
  };
  const undoRoutine = (row: AgendaItem) => {
    routine.history.setValue((p) => ({
      ...p,
      [row.id]: {
        ...p[row.id],
        deleted: true,
        updatedAt: Math.max(now, (p[row.id]?.updatedAt ?? 0) + 1),
      },
    }));
    setMessage("Routine action undone.");
  };
  const renderRow = (row: AgendaItem) => (
    <li key={row.id} className="agenda-row">
      <div className="agenda-time">
        <time>
          {new Intl.DateTimeFormat("en", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone,
          }).format(row.at)}
        </time>
        <small>
          {row.durationMinutes ? `${row.durationMinutes} min` : row.kind}
        </small>
      </div>
      <div className="agenda-body">
        <strong>{row.title}</strong>
        {row.block?.description && <p>{row.block.description}</p>}
        <small>
          {row.done
            ? (row.status ?? "Completed")
            : date === today && row.at < now && !current?.id?.includes(row.id)
              ? "Earlier"
              : row.unavailable
                ? "Linked task unavailable"
                : "Planned"}
          {row.block?.id.startsWith("owner:") ? " · Bible timetable (IST)" : ""}
        </small>
        <div className="agenda-actions">
          {!row.done &&
            !row.unavailable &&
            !(
              row.kind === "event" &&
              (row.id.startsWith("owner:") || row.id.startsWith("timetable:"))
            ) &&
            (row.kind === "event" ? (
              <Button
                size="sm"
                disabled={
                  !plan.enabled ||
                  row.id.startsWith("timetable:") ||
                  row.id.startsWith("owner:")
                }
                onClick={() =>
                  plan.blocks.setValue((p) => ({
                    ...p,
                    [row.id]: {
                      ...p[row.id],
                      completedAt: Date.now(),
                      updatedAt: Date.now(),
                    },
                  }))
                }
              >
                Mark done
              </Button>
            ) : row.occurrence?.type === "supplement" ? (
              <Button size="sm" onClick={() => act(row, "taken")}>
                Taken
              </Button>
            ) : (
              <Link
                className="inline-action"
                href={
                  date !== today &&
                  ["task", "event", "study"].includes(row.kind)
                    ? `/plan?date=${date}`
                    : row.href
                }
              >
                {row.kind === "meal"
                  ? "Log meal"
                  : date === today
                    ? "Start"
                    : "Open"}
              </Link>
            ))}
          {row.occurrence && !row.done && (
            <details>
              <summary>Routine actions</summary>
              <div className="flex flex-wrap gap-2">
                {row.kind === "meal" && (
                  <Button size="sm" onClick={() => act(row, "done")}>
                    Mark done
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act(row, "snoozed")}
                >
                  Later · 15 min
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => act(row, "skipped")}
                >
                  Skip
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Food and supplement records are separate.
              </p>
            </details>
          )}
          {row.done && row.occurrence && (
            <Button size="sm" variant="ghost" onClick={() => undoRoutine(row)}>
              Undo
            </Button>
          )}
          {planning &&
            row.block &&
            !row.block.id.startsWith("owner:") &&
            !row.block.id.startsWith("timetable:") &&
            plan.enabled && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => begin(row.block)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(row.block!)}
                >
                  Remove
                </Button>
              </>
            )}
          {row.unavailable && <Link href="/todo">Find a task</Link>}
        </div>
      </div>
    </li>
  );
  const addUrl = (type: string) =>
    `/log?type=${type}&date=${date}&returnTo=${encodeURIComponent(`${planning ? "/plan" : "/hub"}?date=${date}`)}`;
  if (params.get("setup") === "1")
    return <Questionnaire onComplete={() => router.replace("/hub")} />;
  if (planning && view === "focus")
    return (
      <section className="workspace-panel">
        <div className="workspace-heading">
          <h2>
            {work.focus?.label ??
              selectedTask?.text ??
              params.get("label") ??
              "Focused work"}
          </h2>
          <Link href={`/plan?date=${date}`}>Back to plan</Link>
        </div>
        {params.get("task") && !selectedTask ? (
          <p role="alert">
            This task is unavailable. Choose another task in Plan.
          </p>
        ) : (
          <>
            <FocusSprint
              taskId={selectedTask?.id}
              returnTo={`/plan?date=${date}`}
              label={
                selectedTask?.text ?? params.get("label") ?? "Focused work"
              }
            />
            {selectedTask && !selectedTask.done && !work.focus && (
              <Button
                variant="outline"
                onClick={() =>
                  todos.setValue((p) =>
                    p.map((t) =>
                      t.id === selectedTask.id
                        ? { ...t, done: true, completedAt: now }
                        : t,
                    ),
                  )
                }
              >
                Mark task complete
              </Button>
            )}
          </>
        )}
      </section>
    );
  return (
    <div className="daily-workspace">
      <div
        className="workspace-heading"
        data-testid={planning ? undefined : "today-header"}
      >
        <div>
          <h2>
            {planning
              ? "Your plan"
              : `Your day${prefs.name ? `, ${prefs.name}` : ""}`}
          </h2>
          <p>
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(date + "T12:00:00Z"))}{" "}
            · {timeZone}
            {date !== today ? " · Historical / planned day" : ""}
          </p>
        </div>
        {!planning && (
          <Link href="/goal" className="text-sm text-primary">
            {displayGoalTitle(prefs)}
          </Link>
        )}
        <DaySelector date={date} today={today} onChange={setDate} />
      </div>
      {!planning && <WorldClockStrip />}
      {planning && (
        <nav className="workspace-views" aria-label="Planning views">
          {[
            ["day", "Day"],
            ["week", "Week"],
            ["tasks", "Tasks"],
            ["goal", "Goal"],
            ["learning", "Learning"],
          ].map(([id, label]) => (
            <Link
              key={id}
              aria-current={view === id ? "page" : undefined}
              href={
                id === "tasks"
                  ? "/todo"
                  : id === "goal"
                    ? "/goal"
                    : id === "learning"
                      ? "/roadmap"
                      : `/plan?view=${id}&date=${date}`
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
      {planning && !plan.enabled && (
        <p className="workspace-notice">
          Day planning is awaiting cloud setup. Your existing tasks, timetable
          and records remain available.
        </p>
      )}
      {planning && (
        <div className="flex flex-wrap gap-2">
          {plan.enabled && (
            <Button onClick={() => begin()}>Add time block</Button>
          )}
          <Link className="inline-action" href="/plan?view=focus">
            Start open work →
          </Link>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {(plan.blocks.status === "error" || plan.days.status === "error") && (
        <p role="alert">
          Planning changes are stored on this device; cloud sync needs
          attention. Export a backup in Settings.
        </p>
      )}
      {removed && (
        <Button
          variant="outline"
          onClick={() => {
            plan.blocks.setValue((p) =>
              p[removed.id]?.deleted
                ? {
                    ...p,
                    [removed.id]: {
                      ...removed,
                      deleted: false,
                      updatedAt: Math.max(now, p[removed.id].updatedAt + 1),
                    },
                  }
                : p,
            );
            setRemoved(null);
            setMessage("Time block restored.");
          }}
        >
          Undo removed block
        </Button>
      )}
      {!planning && date === today && !work.focus && !work.study && (
        <section className="next-commitment" data-testid="next-move-card">
          <p className="text-xs text-muted-foreground">
            {current ? "Now" : "Next"}
          </p>
          <h2>
            {next?.title ??
              (pending[0]?.text || "Make room for what matters today")}
          </h2>
          {next ? (
            <Link className="inline-action" href={next.href}>
              {next.kind === "meal"
                ? "Log meal"
                : next.kind === "supplement"
                  ? "Open routine"
                  : "Open commitment"}{" "}
              →
            </Link>
          ) : pending[0] ? (
            <Link
              aria-label="Start focused work"
              data-editorial-action
              className="inline-action"
              href={`/plan?view=focus&task=${encodeURIComponent(pending[0].id)}`}
            >
              Start focused work →
            </Link>
          ) : (
            <Link data-editorial-action className="inline-action" href="/plan">
              Plan today →
            </Link>
          )}
        </section>
      )}
      {planning && view === "week" ? (
        <section className="workspace-panel">
          <h2>Seven-day outline</h2>
          <div className="week-outline">
            {Array.from({ length: 7 }, (_, i) => shiftDay(date, i)).map(
              (day) => {
                const blocks = Object.values(plan.blocks.value).filter(
                  (b) => validPlanBlock(b) && !b.deleted && b.date === day,
                );
                const fixed = personalSchedule(user?.email, day);
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const q = new URLSearchParams({ date: day, view: "day" });
                      router.replace(`/plan?${q}`);
                    }}
                  >
                    <strong>{day}</strong>
                    <span>{blocks.length} time blocks</span>
                    {fixed && (
                      <small>
                        {Object.values(fixed).reduce(
                          (sum, b) => sum + b.minutes,
                          0,
                        ) / 60}
                        h Bible timetable
                      </small>
                    )}
                    {blocks.slice(0, 3).map((b) => (
                      <small key={b.id}>
                        {b.startLocal} · {b.title}
                      </small>
                    ))}
                  </button>
                );
              },
            )}
          </div>
        </section>
      ) : (
        <section className="workspace-panel" data-testid="day-agenda">
          <div className="workspace-heading">
            <h2>Your day</h2>
            {!planning && (
              <Link href={`/plan?date=${date}`}>Edit in Plan →</Link>
            )}
          </div>
          {incomplete.length ? (
            <ol className="agenda-list">{incomplete.map(renderRow)}</ol>
          ) : (
            <p className="workspace-empty">
              No timed commitments for this day. Schedule an activity in Plan or
              add a record.
            </p>
          )}
          {completed.length > 0 && (
            <details>
              <summary>{completed.length} completed or skipped</summary>
              <ol className="agenda-list">{completed.map(renderRow)}</ol>
            </details>
          )}
        </section>
      )}
      <section className="workspace-panel">
        <div className="workspace-heading">
          <h2>No time assigned</h2>
          <Link href="/todo">All tasks →</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Pending tasks due by this date. Pin up to three priorities.
        </p>
        {pending.length ? (
          <ul className="unscheduled-list">
            {pending.slice(0, planning ? 20 : 5).map((task) => (
              <li key={task.id}>
                <span>
                  <strong>{task.text}</strong>
                  <small>
                    Due {task.date} · {task.priority}
                    {priorities.includes(task.id) ? " · Priority" : ""}
                  </small>
                </span>
                <div className="flex flex-wrap gap-2">
                  {date === today && (
                    <Link
                      className="inline-action"
                      href={`/plan?view=focus&task=${encodeURIComponent(task.id)}`}
                    >
                      Start
                    </Link>
                  )}
                  {plan.enabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-pressed={priorities.includes(task.id)}
                      onClick={() => togglePriority(task.id)}
                    >
                      {priorities.includes(task.id) ? "Unpin" : "Pin"}
                    </Button>
                  )}
                  {planning && plan.enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        begin();
                        setTaskId(task.id);
                      }}
                    >
                      Schedule
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="workspace-empty">
            No unscheduled tasks. Add one when you need it.
          </p>
        )}
        <Link className="inline-action" href={addUrl("task")}>
          Add task
        </Link>
      </section>
      {!planning && (
        <>
          <div
            className="daily-quick-actions"
            aria-label="Daily recording actions"
          >
            {modules.value.food && <Link href={addUrl("food")}>Food</Link>}
            <Button
              variant="outline"
              onClick={() => {
                water.setValue((p) => ({ ...p, [date]: (p[date] ?? 0) + 1 }));
                setWaterUndo(date);
                setMessage("Added one glass of water.");
              }}
            >
              Water +1
            </Button>
            {waterUndo === date && (
              <Button
                variant="ghost"
                onClick={() => {
                  water.setValue((p) => ({
                    ...p,
                    [date]: Math.max(0, (p[date] ?? 0) - 1),
                  }));
                  setWaterUndo(null);
                }}
              >
                Undo water
              </Button>
            )}
            <Link href={addUrl("weight")}>Weight</Link>
            {modules.value.movement && (
              <Link href={addUrl("exercise")}>Exercise</Link>
            )}
            {modules.value.recovery && (
              <Link href={addUrl("sleep")}>Sleep</Link>
            )}
          </div>
          <section
            data-editorial-telemetry
            className="recorded-strip"
            aria-label="Recorded for this day"
          >
            <strong>Recorded</strong>
            <span>
              {modules.value.food ? `${records.foodCount} food entries · ` : ""}
              {modules.value.movement
                ? `${records.exerciseCount} exercises · `
                : ""}
              {records.latestWeight
                ? displayWeight(records.latestWeight.value, prefs.weightUnit)
                : "No weigh-in"}
            </span>
            <Link href={`/health?date=${date}`}>Edit records →</Link>
          </section>
          {modules.value.habits && date === today && <HabitChecklist />}
          <Link
            className="capture-return"
            href={`/log?view=journal&date=${date}`}
          >
            Review this day →
          </Link>
          <Link className="capture-return" href="/settings#reminders">
            Manage reminders
          </Link>
        </>
      )}
      <Modal
        open={editor && plan.enabled}
        onClose={() => {
          const changed =
            title !== (editing?.title ?? "") ||
            taskId !== (editing?.sourceId ?? "") ||
            start !== (editing?.startLocal ?? "09:00") ||
            duration !== String(editing?.durationMinutes ?? 60) ||
            kind !== (editing?.kind ?? "task");
          if (changed && !window.confirm("Discard the unsaved time block?"))
            return;
          setEditor(false);
        }}
        title={editing ? "Edit time block" : "Add time block"}
      >
        <form
          className="capture-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="field-label">
            Activity
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as PlanBlock["kind"]);
                setConfirmOverlap(false);
              }}
            >
              {[
                ["task", "Task"],
                ["study", "Study"],
                ["exercise", "Exercise"],
                ["event", "Personal event"],
              ].map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {kind === "task" ? (
            <label className="field-label">
              Link task
              <select
                aria-label="Link task"
                value={taskId}
                onChange={(e) => {
                  setTaskId(e.target.value);
                  setConfirmOverlap(false);
                }}
              >
                <option value="">Choose a task</option>
                {todos.value
                  .filter((t) => !t.done)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.text}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <label className="field-label">
              Title
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
              />
            </label>
          )}
          <p>
            {date} · {timeZone}
          </p>
          <label className="field-label">
            Start time
            <Input
              aria-label="Start time"
              type="time"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setConfirmOverlap(false);
              }}
            />
          </label>
          <label className="field-label">
            Duration (minutes)
            <Input
              type="number"
              aria-label="Duration (minutes)"
              min="1"
              max="1440"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                setConfirmOverlap(false);
              }}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <Button type="submit">
            {confirmOverlap
              ? "Save time block with overlap"
              : "Save time block"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
