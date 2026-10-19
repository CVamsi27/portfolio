"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useAuth } from "@/lib/auth-store";
import Questionnaire from "@/components/Questionnaire";
import { useUserPrefs } from "@/lib/user-prefs";
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
import { isGermanyRoadmap, type GermanyRoadmap } from "@/lib/germany-roadmap";
import { jobAssignments, jobEvidenceStatus } from "@/lib/job-plan";
import JobAssignmentDetail, {
  assignmentHref,
  JobAssignmentRow,
  JobProgressLabel,
} from "@/components/career/JobAssignmentDetail";
import RoadmapGuide from "@/components/career/RoadmapGuide";
import {
  datedAssignments,
  annotateGermanySchedule,
} from "@/lib/germany-execution";
import {
  EMPTY_CAREER_EXECUTION_STATE,
  type CareerExecutionState,
} from "@/lib/career-roadmap";
import { personalSchedule } from "@/lib/personal-timetable";
import { useRoutine } from "@/lib/routine-store";
import { usePersonalModules } from "@/lib/personal-modules";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import { useWorkSession } from "@/lib/work-session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DaySelector from "./DaySelector";
import WeekDateStrip from "./WeekDateStrip";
import TodayAgendaRow from "./TodayAgendaRow";
import TodaySetupCard from "./TodaySetupCard";
import { agendaPeriod, agendaStatus } from "@/lib/day-presentation";
import { ArrowRight } from "lucide-react";
import { editablePlanBlocks } from "@/lib/plan-presentation";
import MetricSummary from "@/components/progress/MetricSummary";
import HabitChecklist from "@/components/personal/HabitChecklist";
import FocusSprint from "@/components/trackers/FocusSprint";
import { displayWeight } from "@/lib/health";
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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
  const career = useSyncedStorage<{ germanyRoadmap?: GermanyRoadmap } | null>(
    "career_command_center",
    null,
  );
  const execution = useSyncedStorage<CareerExecutionState>(
    "career_execution_state",
    EMPTY_CAREER_EXECUTION_STATE,
  );
  const germany = isGermanyRoadmap(career.value?.germanyRoadmap)
    ? career.value.germanyRoadmap
    : null;
  const germanyAssignments = germany?.execution
    ? datedAssignments(germany.execution, date)
    : {};
  const detailedAssignments = modules.value.study
    ? jobAssignments(germany?.execution?.jobPlan, date)
    : [];
  const jobDays = (
    planning && view === "week"
      ? Array.from({ length: 7 }, (_, i) => shiftDay(date, i))
      : [date]
  )
    .map((d) => ({
      date: d,
      assignments: modules.value.study
        ? jobAssignments(germany?.execution?.jobPlan, d)
        : [],
    }))
    .filter((d) => d.assignments.length > 0);
  const prescribed = modules.value.study
    ? personalSchedule(user?.email, date)
    : undefined;
  const sourceDays = [shiftDay(date, -1), date, shiftDay(date, 1)];
  const fixedBlocks = (sourceDate: string) => {
    const prescribed = modules.value.study
      ? personalSchedule(user?.email, sourceDate)
      : undefined;
    const storedDay = timetable.value?.days?.find((d) => d.date === sourceDate);
    return modules.value.study
      ? timetableBlocks(
          sourceDate,
          germany?.execution
            ? annotateGermanySchedule(
                germany.execution,
                sourceDate,
                prescribed ?? storedDay?.schedule ?? {},
              )
            : (prescribed ?? storedDay?.schedule ?? {}),
          prescribed ? "Asia/Kolkata" : (timetable.value?.timezone ?? timeZone),
          prescribed ? "owner" : "timetable",
        )
      : {};
  };
  const ownerBlocks = Object.assign(
    {},
    ...sourceDays.map(fixedBlocks),
  ) as Record<string, PlanBlock>;
  const allBlocks = { ...ownerBlocks, ...plan.blocks.value };
  const rows = dayAgenda({
    date,
    calendarTimeZone: timeZone,
    blocks: planning
      ? Object.fromEntries(
          editablePlanBlocks(plan.blocks.value, date).map((block) => [
            block.id,
            block,
          ]),
        )
      : allBlocks,
    tasks: todos.value,
    routines:
      !planning && modules.value.routine
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
        "Activity editing is currently unavailable. Your draft is retained.",
      );
      return;
    }
    const task = todos.value.find((t) => t.id === taskId);
    const b: PlanBlock = {
      ...editing,
      deleted: false,
      id: editing?.id ?? crypto.randomUUID(),
      date: editing?.date ?? date,
      startLocal: start,
      durationMinutes: Number(duration),
      timeZone: editing?.timeZone ?? timeZone,
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
    const conflictBlocks: Record<string, PlanBlock> = {
      ...Object.assign(
        {},
        ...[-1, 0, 1].map((delta) => fixedBlocks(shiftDay(b.date, delta))),
      ),
      ...plan.blocks.value,
    };
    const overlapping = Object.values(conflictBlocks).filter(
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
      setMessage("Activity saved on this device.");
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
    setMessage("Activity removed. Its task and activity records are retained.");
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
  const assignmentForRow = (row?: AgendaItem) =>
    row && (row.id.startsWith("owner:") || row.id.startsWith("timetable:"))
      ? jobAssignments(
          germany?.execution?.jobPlan,
          row.block?.date ?? date,
        ).find((a) => row.id.endsWith(":" + a.range))
      : undefined;
  const renderRow = (row: AgendaItem) => {
    const assignment = assignmentForRow(row);
    const content = (
      <>
        {assignment ? (
          <JobAssignmentDetail assignment={assignment} recordLink />
        ) : (
          row.block?.description &&
          (germany?.execution &&
          (row.id.startsWith("owner:") || row.id.startsWith("timetable:")) ? (
            <RoadmapGuide
              content={row.block.description}
              context={{ date, task: `germany:2026:day:${date}` }}
            />
          ) : (
            <p>{row.block.description}</p>
          ))
        )}
        {planning && (
          <small>
            {agendaStatus(row, date, today, now)}
            {row.block?.id.startsWith("owner:")
              ? " · Bible timetable (IST)"
              : ""}
          </small>
        )}
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
                variant={planning ? "default" : "outline"}
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
              <Button
                size="sm"
                variant={planning ? "default" : "outline"}
                onClick={() => act(row, "taken")}
              >
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
      </>
    );
    if (!planning)
      return (
        <TodayAgendaRow
          key={row.id}
          row={row}
          timeZone={timeZone}
          outcome={assignment?.outcome}
          evidenceStatus={
            assignment
              ? jobEvidenceStatus(
                  execution.value?.evidenceByItemId?.[assignment.id],
                )
              : undefined
          }
          status={agendaStatus(row, date, today, now)}
        >
          {content}
        </TodayAgendaRow>
      );
    return (
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
          {content}
        </div>
      </li>
    );
  };
  const addUrl = (type: string) =>
    `/log?type=${type}&date=${date}&returnTo=${encodeURIComponent(`${planning ? "/plan" : "/hub"}?date=${date}`)}`;
  if (params.get("setup") === "1")
    return <Questionnaire onComplete={() => router.replace("/hub")} />;
  if (planning && view === "focus")
    return (
      <section className="workspace-panel">
        <h1 className="font-display text-3xl font-semibold">Focus</h1>
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
  const activeSession = Boolean(work.focus || work.study);
  const actionableNext = date === today ? next : undefined;
  const nextAssignment = assignmentForRow(actionableNext);
  const primaryHref = activeSession
    ? work.study
      ? "/roadmap"
      : "/plan?view=focus"
    : ((nextAssignment ? assignmentHref(nextAssignment) : actionableNext?.href) ??
      (date === today && pending[0]
        ? `/plan?view=focus&task=${encodeURIComponent(pending[0].id)}`
        : `/plan?date=${date === today && rows.length > 0 && !incomplete.some((row) => row.at + (row.durationMinutes ?? 0) * 60000 > now) ? shiftDay(date, 1) : date}`));
  const primaryLabel = activeSession
    ? "Resume session"
    : actionableNext
      ? actionableNext.kind === "meal"
        ? "Log meal"
        : actionableNext.kind === "supplement"
          ? "Open routine"
          : "Open commitment"
      : date === today && pending[0]
        ? "Start focused work"
        : date === today &&
            rows.length > 0 &&
            !incomplete.some((row) => row.at >= now)
          ? "Plan tomorrow"
          : "Plan this day";
  const formatClock = (at: number) =>
    new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(at);
  const timelineSession =
    !planning && date === today && activeSession
      ? {
          title: work.focus?.label ?? work.study?.chapterTitle ?? "Focused work",
          startedAt: work.focus?.startedAt ?? work.study?.startedAt ?? now,
          href: work.study ? "/roadmap" : "/plan?view=focus",
        }
      : null;
  const nextCard = (() => {
    if (timelineSession) {
      const minutesIn = Math.max(
        0,
        Math.round((now - timelineSession.startedAt) / 60000),
      );
      return {
        kicker: "In session",
        title: timelineSession.title,
        meta: `Started ${formatClock(timelineSession.startedAt)} · ${minutesIn} min`,
        href: timelineSession.href,
        cta: "Resume",
      };
    }
    const row = actionableNext ?? (date !== today ? incomplete[0] : undefined);
    if (row)
      return {
        kicker: current && date === today ? "Now" : "Next",
        title: row.title,
        meta: `${formatClock(row.at)}${
          row.durationMinutes
            ? `–${formatClock(row.at + row.durationMinutes * 60000)}`
            : ""
        } · ${agendaStatus(row, date, today, now)}`,
        href:
          date !== today && ["task", "event", "study"].includes(row.kind)
            ? `/plan?date=${date}`
            : row.href,
        cta:
          row.kind === "meal"
            ? "Log meal"
            : row.kind === "supplement"
              ? "Open routine"
              : "Open",
      };
    if (date === today && pending[0])
      return {
        kicker: "Next",
        title: pending[0].text,
        meta: `Unscheduled · ${pending[0].priority} · ${pending[0].tag}`,
        href: `/plan?view=focus&task=${encodeURIComponent(pending[0].id)}`,
        cta: "Start focus sprint",
      };
    return {
      kicker: "Today",
      title: "An open day",
      meta: "Schedule a commitment or start a focus sprint.",
      href: `/plan?date=${date}`,
      cta: "Plan this day",
    };
  })();
  return (
    <div className={`daily-workspace${planning ? "" : " nova-today"}`}>
      {planning ? (
        <header className="nova-today-header">
          <div>
            <h1>Plan</h1>
            <DaySelector date={date} today={today} onChange={setDate} />
          </div>
          {plan.enabled && (
            <Button className="nova-primary-action" onClick={() => begin()}>
              Add activity
            </Button>
          )}
        </header>
      ) : (
        <>
          <header className="nova-today-header" data-testid="today-header">
            <div>
              <h1>Today</h1>
              <p>
                <button
                  type="button"
                  className="nova-date-context"
                  aria-label="Choose date"
                  onClick={() => setDatePickerOpen(true)}
                >
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(date + "T12:00:00Z"))}
                </button>
                <span>
                  {" "}
                  · {timeZone === "Asia/Calcutta" ? "Asia/Kolkata" : timeZone}
                  {date !== today ? " · Selected day" : ""}
                </span>
              </p>
            </div>
            <Link className="nova-primary-action" href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </header>
        </>
      )}
      {!planning && date === today && <TodaySetupCard />}
      {!planning && (
        <section
          className="nova-next-card"
          data-testid="today-next-action"
          aria-label="Now and next"
        >
          <div className="nova-next-body">
            <p className="nova-next-kicker">{nextCard.kicker}</p>
            <strong>{nextCard.title}</strong>
            <small>{nextCard.meta}</small>
          </div>
          <Link className="nova-next-cta" href={nextCard.href}>
            {nextCard.cta}
          </Link>
        </section>
      )}
      <MetricSummary
        metric="focus"
        endDate={date}
        context={date === today ? "today" : date}
      />
      {!planning && (
        <WeekDateStrip date={date} today={today} onChange={setDate} />
      )}

      {planning && (
        <nav className="workspace-views" aria-label="Planning views">
          {[
            ["day", "Activities"],
            ["week", "Week"],
          ].map(([id, label]) => (
            <Link
              key={id}
              aria-current={view === id ? "page" : undefined}
              href={
                id === "tasks"
                  ? "/todo"
                  : id === "goal"
                    ? "/goal"
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
          Activity editing is currently unavailable. You can view your agenda in
          Today.
        </p>
      )}
      {planning && (
        <div className="workspace-child-links">
          <Link href="/todo">Tasks</Link>
          <Link href="/goal">Goals</Link>
          <Link href={`/plan?view=focus&date=${date}`}>Focus</Link>
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
            setMessage("Activity restored.");
          }}
        >
          Undo removed activity
        </Button>
      )}
      {planning && jobDays.length > 0 && (
        <section className="workspace-panel" aria-label="Job timetable">
          <h2 className="font-display text-xl font-semibold">Job timetable</h2>
          <p className="text-sm text-muted-foreground">
            {jobDays.reduce(
              (n, d) =>
                n + d.assignments.reduce((sum, a) => sum + a.minutes, 0),
              0,
            ) / 60}{" "}
            hours · IST · open an assignment for instructions and links
          </p>
          {view === "week" && (
            <p
              className="text-xs text-muted-foreground mb-3"
              aria-label="Timetable dates"
            >
              {[date, shiftDay(date, 6)]
                .map((d) =>
                  new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(d + "T12:00:00Z")),
                )
                .join(" – ")}
            </p>
          )}
          {view === "week"
            ? jobDays.map((d) => (
                <details
                  key={d.date}
                  data-testid={`job-day-${d.date}`}
                  open={d.date === date}
                  className="border-t border-border py-3"
                >
                  <summary className="min-h-11 cursor-pointer font-semibold">
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    }).format(new Date(d.date + "T12:00:00Z"))}{" "}
                    · {d.assignments.reduce((n, a) => n + a.minutes, 0) / 60}{" "}
                    hours
                    <JobProgressLabel
                      assignments={d.assignments}
                      entries={execution.value?.evidenceByItemId}
                    />
                  </summary>
                  {d.assignments.map((a) => (
                    <JobAssignmentRow
                      key={a.id}
                      assignment={a}
                      evidence={execution.value?.evidenceByItemId?.[a.id]}
                      recordLink
                    />
                  ))}
                </details>
              ))
            : detailedAssignments.map((a) => (
                <JobAssignmentRow
                  key={a.id}
                  assignment={a}
                  evidence={execution.value?.evidenceByItemId?.[a.id]}
                  recordLink
                />
              ))}
        </section>
      )}
      {(!planning ||
        jobDays.length === 0 ||
        (view === "week"
          ? editablePlanBlocks(plan.blocks.value, date, 7).length > 0
          : rows.length > 0)) && (
        <div className={`daily-agenda-layout${planning ? " is-planning" : ""}`}>
          {planning && view === "week" ? (
            <section className="workspace-panel">
              <h2>
                Your activities · {date}–{shiftDay(date, 6)}
              </h2>
              {editablePlanBlocks(plan.blocks.value, date, 7).length ? (
                <ul>
                  {editablePlanBlocks(plan.blocks.value, date, 7).map(
                    (block) => (
                      <li
                        className="workspace-heading border-b border-border py-4"
                        key={block.id}
                      >
                        <div>
                          <strong>{block.title}</strong>
                          <p className="text-sm text-muted-foreground">
                            {block.date} · {block.startLocal} ·{" "}
                            {block.durationMinutes} min
                            {block.completedAt ? " · Completed" : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            disabled={!plan.enabled}
                            onClick={() => begin(block)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={!plan.enabled}
                            onClick={() => remove(block)}
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="workspace-empty">
                  No activities in this week. Add an activity to begin.
                </p>
              )}
            </section>
          ) : (
            <section className="workspace-panel" data-testid="day-agenda">
              <div className={planning ? "workspace-heading" : "sr-only"}>
                {planning && <h2>Your activities</h2>}
              </div>
              {timelineSession && (
                <ol className="agenda-list nova-timeline-session">
                  <li
                    className="nova-agenda-row"
                    data-testid="today-session-block"
                  >
                    <div className="nova-agenda-time">
                      <time
                        dateTime={new Date(
                          timelineSession.startedAt,
                        ).toISOString()}
                      >
                        {formatClock(timelineSession.startedAt)}
                      </time>
                      <small>
                        {Math.max(
                          0,
                          Math.round((now - timelineSession.startedAt) / 60000),
                        )}{" "}
                        min
                      </small>
                    </div>
                    <div className="nova-agenda-body">
                      <strong>{timelineSession.title}</strong>
                      <small>
                        In session · started{" "}
                        {formatClock(timelineSession.startedAt)}
                      </small>
                      <div className="agenda-actions">
                        <Link
                          className="inline-action"
                          href={timelineSession.href}
                        >
                          Resume
                        </Link>
                      </div>
                    </div>
                  </li>
                </ol>
              )}
              {incomplete.length ? (
                planning ? (
                  <ol className="agenda-list">{incomplete.map(renderRow)}</ol>
                ) : (
                  <div className="nova-agenda-groups">
                    {(["Morning", "Afternoon", "Evening"] as const).map(
                      (period) => {
                        const items = incomplete.filter(
                          (row) => agendaPeriod(row.at, timeZone) === period,
                        );
                        return items.length ? (
                          <section
                            className="nova-agenda-group"
                            key={period}
                            aria-label={period}
                          >
                            <h3>{period}</h3>
                            <ol className="agenda-list">
                              {items.map(renderRow)}
                            </ol>
                          </section>
                        ) : null;
                      },
                    )}
                  </div>
                )
              ) : (
                <p className="workspace-empty">
                  {planning
                    ? "No activities for this date. Add an activity to begin."
                    : "No timed commitments for this day. Schedule an activity in Plan."}
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
        </div>
      )}
      {!planning && pending.length > 0 && (
        <section className="nova-open-tasks" data-testid="today-open-tasks">
          <h2>Open tasks</h2>
          <ul>
            {pending.slice(0, 3).map((task) => (
              <li key={task.id}>
                <Link
                  href={`/plan?view=focus&task=${encodeURIComponent(task.id)}`}
                >
                  {task.text}
                </Link>
                <small>
                  {task.priority} · {task.tag}
                </small>
              </li>
            ))}
          </ul>
          {pending.length > 3 && (
            <Link className="inline-action" href="/todo">
              {pending.length - 3} more in Tasks
            </Link>
          )}
        </section>
      )}
      {!planning && (
        <>
          <section className="daily-utilities">
            <div
              className="daily-quick-actions"
              role="group"
              aria-label="Daily recording actions"
            >
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
                    setMessage("Water addition undone.");
                  }}
                >
                  Undo water
                </Button>
              )}
              {modules.value.food && <Link href={addUrl("food")}>Food</Link>}
              <Link href={addUrl("weight")}>Weight</Link>
              <Link href={addUrl("note")}>Note</Link>
            </div>
            <section
              data-editorial-telemetry
              className="recorded-strip"
              aria-label="Recorded for this day"
            >
              <strong>Recorded</strong>
              <span>
                {modules.value.food
                  ? `${records.foodCount} food entries · `
                  : ""}
                {modules.value.movement
                  ? `${records.exerciseCount} exercises · `
                  : ""}
                {records.latestWeight
                  ? displayWeight(records.latestWeight.value, prefs.weightUnit)
                  : "No weigh-in"}
              </span>
              <Link href={`/health?date=${date}`}>Edit records →</Link>
            </section>
          </section>
          {modules.value.study &&
            germany?.execution &&
            Object.keys(germanyAssignments).length > 0 && (
              <details className="daily-utilities">
                <summary>Study &amp; career</summary>
                <Link
                  className="capture-return"
                  href={`/roadmap?view=roadmap&panel=today&date=${date}`}
                >
                  Open detailed assignments and study links
                </Link>
              </details>
            )}
          {modules.value.habits && date === today && (
            <details className="daily-utilities">
              <summary>Habits</summary>
              <HabitChecklist />
            </details>
          )}
          <Link
            className="capture-return"
            href={`/log?view=journal&date=${date}`}
          >
            Review this day →
          </Link>
          <Link className="capture-return" href={`/review?date=${date}`}>
            Weekly review →
          </Link>
        </>
      )}
      <Modal
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        title="Choose date"
      >
        <DaySelector
          date={date}
          today={today}
          onChange={(day) => {
            setDate(day);
            setDatePickerOpen(false);
          }}
        />
      </Modal>
      <Modal
        open={editor && plan.enabled}
        onClose={() => {
          const changed =
            title !== (editing?.title ?? "") ||
            taskId !== (editing?.sourceId ?? "") ||
            start !== (editing?.startLocal ?? "09:00") ||
            duration !== String(editing?.durationMinutes ?? 60) ||
            kind !== (editing?.kind ?? "task");
          if (changed && !window.confirm("Discard the unsaved activity?"))
            return;
          setEditor(false);
        }}
        title={editing ? "Edit activity" : "Add activity"}
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
            {editing?.date ?? date} · {editing?.timeZone ?? timeZone}
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
            {confirmOverlap ? "Save activity with overlap" : "Save activity"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
