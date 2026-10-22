"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";
import { useUserPrefs } from "@/lib/user-prefs";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useGoalState, useJournal, useNow, useTodos } from "@/lib/tracker-store";
import { normalizeWeeklyCommitments, type WeeklyCommitment } from "@/lib/trackers";
import { calendarZone, shiftDay, validDay } from "@/lib/day-plan";
import { containingWeek } from "@/lib/day-presentation";
import { personalSchedule } from "@/lib/personal-timetable";
import { zonedDate } from "@/lib/routine-reminders";
import type { RecoveryEntry } from "@/components/personal/RecoveryTracker";

const localDay = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));

const longDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));

function JournalForm({
  initialWin,
  initialLearned,
  onSave,
}: {
  initialWin: string;
  initialLearned: string;
  onSave: (win: string, learned: string) => void;
}) {
  const [win, setWin] = useState(initialWin);
  const [learned, setLearned] = useState(initialLearned);
  return (
    <form
      className="weekly-review-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(win, learned);
      }}
    >
      <label className="field-label">
        What went well this week?
        <Textarea
          maxLength={2000}
          value={win}
          onChange={(event) => setWin(event.target.value)}
        />
      </label>
      <label className="field-label">
        What did you learn this week?
        <Textarea
          maxLength={2000}
          value={learned}
          onChange={(event) => setLearned(event.target.value)}
        />
      </label>
      <Button type="submit">Save reflection</Button>
    </form>
  );
}

function CommitmentForm({
  weekOf,
  initial,
  onSave,
}: {
  weekOf: string;
  initial: [string, string, string];
  onSave: (texts: string[]) => void;
}) {
  const [first, setFirst] = useState(initial[0]);
  const [second, setSecond] = useState(initial[1]);
  const [third, setThird] = useState(initial[2]);
  return (
    <form
      className="weekly-review-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave([first, second, third]);
      }}
    >
      <p className="weekly-review-hint">
        Week of {longDate(weekOf)}. The first action is the one you start with
        on Monday.
      </p>
      <label className="field-label">
        First action for next week
        <Input
          maxLength={200}
          value={first}
          onChange={(event) => setFirst(event.target.value)}
        />
      </label>
      <label className="field-label">
        Commitment 2 (optional)
        <Input
          maxLength={200}
          value={second}
          onChange={(event) => setSecond(event.target.value)}
        />
      </label>
      <label className="field-label">
        Commitment 3 (optional)
        <Input
          maxLength={200}
          value={third}
          onChange={(event) => setThird(event.target.value)}
        />
      </label>
      <Button type="submit" disabled={!first.trim()}>
        Save next week
      </Button>
    </form>
  );
}

/**
 * Guided weekly review (/review): five steps that read the existing stores
 * and write only existing record shapes — the journal entry for the
 * week-ending date and next week's commitments in the goal store.
 */
export default function WeeklyReview() {
  const params = useSearchParams();
  const now = useNow(60000);
  const { user } = useAuth();
  const { prefs } = useUserPrefs();
  const today = zonedDate(now, calendarZone(prefs.timeZone));
  const timetable = useSyncedStorage<{
    days: Array<{ date: string; schedule?: Record<string, unknown> }>;
  } | null>("timetable_100_days", null);
  const end = validDay(params.get("date")) ? params.get("date")! : today;
  const { data } = usePersonalProgress(14, end);
  const week = data.days.slice(7);
  const previous = data.days.slice(0, 7);
  const weekStart = week[0]?.date ?? end;
  const scheduledCount = (date: string) => {
    const prescribed = personalSchedule(user?.email, date);
    const stored = timetable.value?.days?.find((day) => day.date === date)
      ?.schedule;
    return Object.keys(prescribed ?? stored ?? {}).length;
  };
  const nextWeekOf = shiftDay(containingWeek(end)[0], 7);
  const todos = useTodos();
  const journal = useJournal();
  const goals = useGoalState();
  const recovery = useSyncedStorage<Record<string, RecoveryEntry>>(
    "recovery:entries",
    {},
    { accountScoped: true, records: true },
  );
  const [notice, setNotice] = useState("");

  const existing = journal.value[end];
  const commitments = normalizeWeeklyCommitments(goals.value);
  const nextCommitments = commitments.filter(
    (item) => item.weekOf === nextWeekOf,
  );
  const goalExists =
    Boolean(prefs.goalTitle.trim()) || prefs.goalCategory !== "general";

  const completed = todos.value.filter(
    (task) =>
      task.done &&
      task.completedAt &&
      localDay(task.completedAt) >= weekStart &&
      localDay(task.completedAt) <= end,
  );
  const carried = todos.value.filter(
    (task) => !task.done && task.date < weekStart,
  );
  const stillOpen = todos.value.filter(
    (task) => !task.done && task.date >= weekStart && task.date <= end,
  );
  const milestonesDone = Object.values(
    goals.value.milestonesByCategory ?? {},
  )
    .flat()
    .filter(
      (milestone) =>
        milestone.done &&
        milestone.doneAt &&
        milestone.doneAt >= weekStart &&
        milestone.doneAt <= end,
    );

  const sum = (values: Array<number | null | undefined>) =>
    values.reduce<number>((total, value) => total + (value ?? 0), 0);
  const average = (values: number[]) =>
    values.length
      ? values.reduce((total, value) => total + value, 0) / values.length
      : null;
  const weights = (days: typeof week) =>
    average(
      days
        .map((day) => day.weight)
        .filter((value): value is number => value !== null),
    );
  const energy = (days: typeof week) =>
    average(
      days
        .map((day) => recovery.value[day.date]?.energy)
        .filter(
          (value): value is number =>
            typeof value === "number" && !Number.isNaN(value),
        ),
    );
  const delta = (
    current: number | null,
    before: number | null,
    unit: string,
    digits = 0,
  ) => {
    if (current === null || current === undefined) return "—";
    const value = `${digits ? current.toFixed(digits) : Math.round(current)}${unit}`;
    if (before === null || before === undefined) return value;
    const change = current - before;
    if (Math.abs(change) < (digits ? 0.05 : 0.5)) return `${value} · steady`;
    const size = digits ? Math.abs(change).toFixed(digits) : String(Math.round(Math.abs(change)));
    return `${value} · ${change > 0 ? "+" : "−"}${size}${unit} vs last week`;
  };

  const saveJournal = (win: string, learned: string) => {
    if (!win.trim() && !learned.trim()) return;
    journal.setValue((previousEntries) => ({
      ...previousEntries,
      [end]: {
        win: win.trim(),
        learned: learned.trim(),
        focus: previousEntries[end]?.focus ?? "",
        updatedAt: Date.now(),
      },
    }));
    setNotice("Weekly reflection saved.");
  };

  const saveCommitments = (texts: string[]) => {
    const cleaned = texts.map((text) => text.trim()).filter(Boolean);
    if (!cleaned.length) return;
    goals.setValue((state) => ({
      ...state,
      weeklyCommitment: undefined,
      weeklyCommitments: [
        ...normalizeWeeklyCommitments(state).filter(
          (item) => item.weekOf !== nextWeekOf,
        ),
        ...cleaned.map(
          (text, index): WeeklyCommitment => ({
            id:
              index === 0
                ? `week-${nextWeekOf}`
                : `week-${nextWeekOf}-${index + 1}`,
            text,
            weekOf: nextWeekOf,
            status: "active",
          }),
        ),
      ],
    }));
    setNotice("Next week saved.");
  };

  const titles = (taskList: typeof todos.value) =>
    taskList.slice(0, 5).map((task) => task.text);

  return (
    <div className="weekly-review" data-testid="weekly-review">
      <p className="weekly-review-range">
        Week ending {longDate(end)} · {dayLabel(week[0]?.date ?? end)} –{" "}
        {dayLabel(end)}
      </p>
      {notice && <p role="status">{notice}</p>}

      <section className="workspace-panel" aria-label="1 — Week at a glance">
        <h2>Week at a glance</h2>
        <ul className="weekly-review-days">
          {week.map((day) => {
            const scheduled = scheduledCount(day.date);
            const hasActivity =
              day.tasks > 0 ||
              Boolean(day.focus) ||
              Boolean(day.study) ||
              scheduled > 0;
            return (
              <li key={day.date}>
                <strong>{dayLabel(day.date)}</strong>
                <span>
                  {day.tasks > 0
                    ? `${day.tasks} task${day.tasks === 1 ? "" : "s"} done`
                    : hasActivity
                      ? "0 tasks done"
                      : "quiet day"}
                  {scheduled
                    ? ` · ${scheduled} block${scheduled === 1 ? "" : "s"} scheduled`
                    : ""}
                  {day.focus ? ` · ${day.focus} min focus` : ""}
                  {day.study ? ` · ${day.study} min study` : ""}
                </span>
                {journal.value[day.date] && (
                  <span className="weekly-review-flag">reflection</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="workspace-panel" aria-label="2 — Wins and lessons">
        <h2>Wins &amp; lessons</h2>
        <JournalForm
          key={`${end}:${existing?.updatedAt ?? "new"}`}
          initialWin={existing?.win ?? ""}
          initialLearned={existing?.learned ?? ""}
          onSave={saveJournal}
        />
      </section>

      <section className="workspace-panel" aria-label="3 — Tasks and milestones">
        <h2>Tasks &amp; milestones</h2>
        <dl className="weekly-review-groups">
          <div>
            <dt>Completed</dt>
            <dd>
              {completed.length}
              {titles(completed).length > 0 && (
                <ul>
                  {titles(completed).map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          <div>
            <dt>Carried forward</dt>
            <dd>
              {carried.length}
              {titles(carried).length > 0 && (
                <ul>
                  {titles(carried).map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          <div>
            <dt>Still open</dt>
            <dd>
              {stillOpen.length}
              {titles(stillOpen).length > 0 && (
                <ul>
                  {titles(stillOpen).map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          <div>
            <dt>Milestones reached</dt>
            <dd>
              {milestonesDone.length}
              {milestonesDone.length > 0 && (
                <ul>
                  {milestonesDone.slice(0, 5).map((milestone) => (
                    <li key={milestone.id}>{milestone.title}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="workspace-panel" aria-label="4 — Metrics">
        <h2>Metrics</h2>
        <dl className="weekly-review-metrics">
          <div>
            <dt>Weight</dt>
            <dd>{delta(weights(week), weights(previous), " kg", 1)}</dd>
          </div>
          <div>
            <dt>Energy</dt>
            <dd>{delta(energy(week), energy(previous), " / 5", 1)}</dd>
          </div>
          <div>
            <dt>Focus</dt>
            <dd>
              {delta(
                sum(week.map((day) => day.focus)),
                sum(previous.map((day) => day.focus)),
                " min",
              )}
            </dd>
          </div>
          <div>
            <dt>Study</dt>
            <dd>
              {delta(
                sum(week.map((day) => day.study)),
                sum(previous.map((day) => day.study)),
                " min",
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="workspace-panel" aria-label="5 — Next week">
        <h2>Next week</h2>
        {goalExists ? (
          <CommitmentForm
            key={nextCommitments.map((item) => item.id).join("|") || "new"}
            weekOf={nextWeekOf}
            initial={[
              nextCommitments[0]?.text ?? "",
              nextCommitments[1]?.text ?? "",
              nextCommitments[2]?.text ?? "",
            ]}
            onSave={saveCommitments}
          />
        ) : (
          <p className="weekly-review-hint">
            Commitments live in your goal.{" "}
            <Link className="inline-action" href="/goal">
              Choose a goal
            </Link>{" "}
            first, then save next week&apos;s plan here.
          </p>
        )}
      </section>
    </div>
  );
}
