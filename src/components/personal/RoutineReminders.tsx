"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNow } from "@/lib/tracker-store";
import { useRoutine } from "@/lib/routine-store";
import {
  routineOccurrences,
  zonedDate,
  validSchedule,
  type RoutineOccurrence,
  type RoutineSchedule,
} from "@/lib/routine-reminders";
import PushPreferences from "./PushPreferences";
export default function RoutineReminders({
  configure = false,
}: {
  configure?: boolean;
}) {
  const { schedules, history, items } = useRoutine();
  const now = useNow(30_000);
  const date = zonedDate(now);
  const occurrences = routineOccurrences(items, date);
  const missed = Array.from({ length: 7 }, (_, index) =>
    zonedDate(now - (index + 1) * 86_400_000),
  )
    .flatMap((day) => routineOccurrences(items, day))
    .filter((item) => {
      const record = history.value[item.id];
      return !record || record.deleted || record.status === "snoozed";
    });
  const [actedOn, setActedOn] = useState<string[]>([]);
  const pending = occurrences.filter((item) => {
    const record = history.value[item.id];
    return !record || record.deleted || record.status === "snoozed";
  });
  const visibleIds = new Set([
    ...pending.slice(0, 2).map((item) => item.id),
    ...actedOn,
  ]);
  const visibleOccurrences = configure
    ? occurrences
    : occurrences.filter((item) => visibleIds.has(item.id));
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [newType, setNewType] = useState<"meal" | "supplement">("supplement");
  const complete = (
    item: RoutineOccurrence,
    status: "done" | "taken" | "skipped" | "snoozed",
    minutes?: number,
  ) => {
    setActedOn((previous) => [...new Set([...previous, item.id])]);
    history.setValue((previous) => ({
      ...previous,
      [item.id]: {
        ...item,
        status,
        snoozeUntil: minutes
          ? Math.max(now, item.scheduledAt) + minutes * 60_000
          : undefined,
        completedAt: status === "snoozed" ? undefined : now,
        updatedAt: Math.max(
          Date.now(),
          (previous[item.id]?.updatedAt ?? 0) + 1,
        ),
      },
    }));
  };
  const update = (item: RoutineSchedule, change: Partial<RoutineSchedule>) => {
    const next = {
      ...item,
      ...change,
      updatedAt: Math.max(now, item.updatedAt + 1),
    };
    if (!validSchedule(next)) {
      setError("Choose a valid time, timezone, and at least one repeat day.");
      return;
    }
    schedules.setValue((previous) => ({ ...previous, [item.id]: next }));
    setError("");
  };
  const add = () => {
    if (!newName.trim()) return;
    const item: RoutineSchedule = {
      id: crypto.randomUUID(),
      label: newName.trim(),
      time: newTime,
      days: [0, 1, 2, 3, 4, 5, 6],
      type: newType,
      timezone: "Asia/Kolkata",
      startsOn: date,
      enabled: true,
      updatedAt: now,
    };
    if (validSchedule(item)) {
      schedules.setValue((previous) => ({ ...previous, [item.id]: item }));
      setNewName("");
    } else setError("Choose a valid name and time.");
  };
  return (
    <section
      className="rounded-xl border border-border bg-card p-4 space-y-4"
      aria-label="Meal and supplement reminders"
    >
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-semibold">Your routine</h2>
        {!configure && (
          <Link
            href="/routine"
            className="inline-flex min-h-11 items-center text-sm text-primary underline"
          >
            All reminders and history
          </Link>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {date} · Times shown in IST. Completion never adds food or an assumed
        dose.
      </p>
      {!occurrences.length ? (
        <p className="text-sm text-muted-foreground">
          No reminders for today. Set your own routine in reminder settings.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {visibleOccurrences.map((item) => {
            const stored = history.value?.[item.id];
            const record = stored && !stored.deleted ? stored : undefined;
            const done =
              record && !record.deleted && record.status !== "snoozed";
            const due = now >= (record?.snoozeUntil ?? item.scheduledAt);
            return (
              <li key={item.id} className="py-3 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">{item.label}</p>
                  <span className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("en", {
                      timeZone: "Asia/Kolkata",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(item.scheduledAt)}{" "}
                    ·{" "}
                    {done
                      ? record.status
                      : record?.status === "snoozed" && !due
                        ? "Snoozed"
                        : due
                          ? "Due"
                          : "Scheduled"}
                  </span>
                </div>
                {done ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      history.setValue((previous) => ({
                        ...previous,
                        [item.id]: {
                          ...record,
                          deleted: true,
                          updatedAt: Math.max(Date.now(), record.updatedAt + 1),
                        },
                      }))
                    }
                  >
                    Undo completion
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {item.meal && (
                      <Button asChild variant="outline">
                        <Link
                          href={`/food?meal=${encodeURIComponent(item.meal)}`}
                        >
                          Log {item.meal.toLowerCase()}
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        complete(
                          item,
                          item.type === "supplement" ? "taken" : "done",
                        )
                      }
                    >
                      {item.type === "supplement" ? "Taken" : "Done"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => complete(item, "snoozed", 10)}
                    >
                      Snooze 10 min
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => complete(item, "snoozed", 30)}
                    >
                      Snooze 30 min
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => complete(item, "skipped")}
                    >
                      Skip today
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!configure && occurrences.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {pending.length} pending today
          {pending.length === 0
            ? " · All reminders recorded."
            : " · Showing the next items; the full checklist is in reminders."}
        </p>
      )}
      {!configure && missed.length > 0 && (
        <Link
          href="/routine#missed"
          className="inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          {missed.length} dated missed reminders
        </Link>
      )}
      {configure && (
        <>
          <PushPreferences />
          <div className="space-y-4">
            <h3 className="font-semibold">Reminder schedules</h3>
            {items
              .filter((item) => !item.deleted)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <label className="flex min-h-11 items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) =>
                        update(item, { enabled: e.target.checked })
                      }
                    />
                    {item.label}
                  </label>
                  {item.linkedTo ? (
                    <p className="text-sm text-muted-foreground">
                      Follows Lunch time; its Taken state is separate.
                    </p>
                  ) : (
                    <>
                      <label htmlFor={`time-${item.id}`} className="text-sm">
                        Time
                      </label>
                      <Input
                        id={`time-${item.id}`}
                        type="time"
                        value={item.time}
                        onChange={(e) => update(item, { time: e.target.value })}
                      />
                      <label htmlFor={`zone-${item.id}`} className="text-sm">
                        Timezone
                      </label>
                      <Input
                        id={`zone-${item.id}`}
                        defaultValue={item.timezone}
                        onBlur={(e) =>
                          update(item, { timezone: e.target.value })
                        }
                      />
                    </>
                  )}
                  <div
                    className="flex flex-wrap gap-1"
                    aria-label={`${item.label} repeat days`}
                  >
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, index) => (
                        <Button
                          key={day}
                          variant="outline"
                          aria-pressed={item.days.includes(index)}
                          onClick={() =>
                            update(item, {
                              days: item.days.includes(index)
                                ? item.days.filter((value) => value !== index)
                                : [...item.days, index],
                            })
                          }
                        >
                          {day}
                        </Button>
                      ),
                    )}
                  </div>
                  <label htmlFor={`note-${item.id}`} className="text-sm">
                    Product / dose note (optional)
                  </label>
                  <Input
                    id={`note-${item.id}`}
                    maxLength={300}
                    value={item.note ?? ""}
                    onChange={(e) => update(item, { note: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => update(item, { deleted: true })}
                  >
                    Remove schedule
                  </Button>
                </div>
              ))}
            <div className="space-y-2">
              <label htmlFor="routine-name">New reminder name</label>
              <Input
                id="routine-name"
                value={newName}
                maxLength={200}
                onChange={(e) => setNewName(e.target.value)}
              />
              <label htmlFor="routine-time">Time (IST)</label>
              <Input
                id="routine-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <select
                aria-label="Reminder kind"
                className="min-h-11 rounded-lg border border-border bg-background p-2"
                value={newType}
                onChange={(e) =>
                  setNewType(e.target.value as "meal" | "supplement")
                }
              >
                <option value="supplement">Supplement</option>
                <option value="meal">Meal</option>
              </select>
              <Button onClick={add} disabled={!newName.trim()}>
                Add reminder
              </Button>
            </div>
          </div>
          <details>
            <summary
              id="missed"
              className="flex min-h-11 cursor-pointer items-center font-medium"
            >
              Missed reminders from the last seven days ({missed.length})
            </summary>
            <p className="text-xs text-muted-foreground">
              These are dated missed items, not new doses. Log only what you
              actually did.
            </p>
            <ul>
              {missed.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span>
                    {item.date} · {item.label}
                  </span>
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        complete(item, item.type === "meal" ? "done" : "taken")
                      }
                    >
                      Record completion
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => complete(item, "skipped")}
                    >
                      Skip missed item
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary className="flex min-h-11 items-center cursor-pointer font-medium">
              Completion history
            </summary>
            <ul className="space-y-2">
              {Object.values(history.value ?? {})
                .filter((item) => !item.deleted)
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, 50)
                .map((item) => (
                  <li key={item.id} className="text-sm">
                    {item.date} · {item.label} · {item.status}
                    {item.completedAt
                      ? ` at ${new Intl.DateTimeFormat("en", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(item.completedAt)}`
                      : ""}
                  </li>
                ))}
            </ul>
          </details>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
