"use client";
import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import SectionLinks from "@/components/personal/SectionLinks";
import { useNutrition } from "@/lib/nutrition-store";
import { nutrientTotals, scaleNutrients } from "@/lib/nutrition";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey } from "@/lib/trackers";
import { useTodos, useGoalState, useJournal } from "@/lib/tracker-store";
import type { FocusSession } from "@/lib/focus-sprint";
import type { RecoveryEntry } from "@/components/personal/RecoveryTracker";
import { useWorkouts } from "@/lib/tracker-store";
import type { CompletedChapterRecord } from "@/lib/study-focus";
import {
  DEFAULT_WEIGHT_LOSS_STATE,
  displayWeight,
  type WeightLossState,
} from "@/lib/health";
import { useUserPrefs } from "@/lib/user-prefs";
import { Input } from "@/components/ui/input";
export default function ReviewPage() {
  const [date, setDate] = useState(() => dateKey());
  const [weekly, setWeekly] = useState(false);
  const nutrition = useNutrition();
  const { prefs } = useUserPrefs();
  const workouts = useWorkouts();
  const water = useSyncedStorage<Record<string, number>>("fasting:water", {});
  const body = useSyncedStorage<WeightLossState>(
    "weight-loss",
    DEFAULT_WEIGHT_LOSS_STATE,
  );
  const study = useSyncedStorage<CompletedChapterRecord[]>(
    "study:completed_chapters",
    [],
  );
  const tasks = useTodos();
  const goals = useGoalState();
  const journal = useJournal();
  const focus = useSyncedStorage<FocusSession[]>("focus:sessions", []);
  const recovery = useSyncedStorage<Record<string, RecoveryEntry>>(
    "recovery:entries",
    {},
    { accountScoped: true, records: true },
  );
  const start = new Date(`${date}T00:00:00Z`);
  if (weekly) start.setUTCDate(start.getUTCDate() - 6);
  const first = Number.isFinite(start.getTime())
    ? start.toISOString().slice(0, 10)
    : date;
  const entries = Object.values(nutrition.entries.value).filter(
    (item) => !item.deleted && item.date >= first && item.date <= date,
  );
  const total = nutrientTotals(
    entries.map((item) =>
      scaleNutrients(item.nutrients, item.quantity, item.basisAmount),
    ),
  );
  const sessions = focus.value.filter((item) => {
    const day = dateKey(new Date(item.endedAt ?? item.createdAt));
    return (
      item.status === "completed" &&
      Number.isFinite(item.durationMinutes) &&
      item.durationMinutes >= 0 &&
      day >= first &&
      day <= date
    );
  });
  const sleeps = Object.values(recovery.value).filter(
    (item) =>
      !item.deleted &&
      item.date >= first &&
      item.date <= date &&
      item.sleepHours !== null,
  );
  const completedTasks = (tasks.value ?? []).filter(
    (item) =>
      item.done &&
      item.completedAt &&
      dateKey(new Date(item.completedAt)) >= first &&
      dateKey(new Date(item.completedAt)) <= date,
  );
  const milestones = Object.values(goals.value.milestonesByCategory ?? {})
    .flat()
    .filter(
      (item) =>
        item.done && item.doneAt && item.doneAt >= first && item.doneAt <= date,
    );
  const reflections = Object.entries(journal.value ?? {}).filter(
    ([day]) => day >= first && day <= date,
  );
  const learned = (study.value ?? []).filter(
    (item) =>
      item.date >= first &&
      item.date <= date &&
      Number.isFinite(item.durationMinutes) &&
      item.durationMinutes >= 0,
  );
  const waterDays = Object.entries(water.value ?? {}).filter(
    ([day, value]) =>
      day >= first && day <= date && Number.isFinite(value) && value >= 0,
  );
  const movementDays = Object.entries(workouts.value ?? {}).filter(
    ([day, logs]) =>
      day >= first &&
      day <= date &&
      Object.values(logs).some((log) => log.done || log.sets?.length),
  );
  const weights = Object.entries(body.value.entries ?? {})
    .filter(
      ([day, entry]) =>
        day >= first && day <= date && Number.isFinite(entry.weightKg),
    )
    .sort(([a], [b]) => a.localeCompare(b));
  return (
    <RequireAuth>
      <PersonalShell
        title="Review"
        eyebrow="Reflection"
        icon="log"
        subtitle="See what you recorded and choose what to adjust."
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Through date
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={weekly}
              onChange={(e) => setWeekly(e.target.checked)}
            />
            Last seven days
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          {first} – {date} · Your calendar
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <section className="rounded-xl border border-border p-4">
            <h2 className="font-semibold">Focus</h2>
            <p className="mt-2 text-2xl">
              {sessions.reduce((sum, item) => sum + item.durationMinutes, 0)}{" "}
              min
            </p>
            <p className="text-sm text-muted-foreground">
              {sessions.length} saved sessions
            </p>
          </section>
          <section className="rounded-xl border border-border p-4">
            <h2 className="font-semibold">Food</h2>
            <p className="mt-2 text-2xl">
              {total.values.energy == null
                ? "Unrecorded"
                : `${Math.round(total.values.energy)} kcal`}
            </p>
            <p className="text-sm text-muted-foreground">
              Known subtotal · {total.coverage.energy ?? 0}/{entries.length}{" "}
              entries have calories
            </p>
          </section>
          <section className="rounded-xl border border-border p-4">
            <h2 className="font-semibold">Sleep</h2>
            <p className="mt-2 text-2xl">
              {sleeps.length
                ? `${(sleeps.reduce((sum, item) => sum + (item.sleepHours ?? 0), 0) / sleeps.length).toFixed(1)} h`
                : "Unrecorded"}
            </p>
            <p className="text-sm text-muted-foreground">
              Average over {sleeps.length} recorded days
            </p>
          </section>
        </div>
        {(learned.length > 0 ||
          movementDays.length > 0 ||
          waterDays.length > 0 ||
          weights.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {learned.length > 0 && (
              <section className="rounded-xl border border-border p-4">
                <h2 className="font-semibold">Learning</h2>
                <p className="mt-2">
                  {learned.reduce((sum, item) => sum + item.durationMinutes, 0)}{" "}
                  min of recorded study
                </p>
                <p className="text-sm text-muted-foreground">
                  {learned.length} saved chapter sessions · separate from focus
                  sprints
                </p>
                <ul className="mt-3 text-sm space-y-2">
                  {learned.slice(0, 5).map((item, index) => (
                    <li key={`${item.chapterId}:${item.completedAt}:${index}`}>
                      {item.chapterTitle} · {item.durationMinutes} min
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(movementDays.length > 0 || waterDays.length > 0) && (
              <section className="rounded-xl border border-border p-4">
                <h2 className="font-semibold">Movement and water</h2>
                <p className="mt-2">
                  {movementDays.length} recorded workout days
                </p>
                <p>
                  {waterDays.reduce((sum, [, glasses]) => sum + glasses, 0)}{" "}
                  glasses recorded
                </p>
                <p className="text-sm text-muted-foreground">
                  Water logged on {waterDays.length} days. Unlogged days are
                  unknown.
                </p>
              </section>
            )}
            {weights.length > 0 && (
              <section className="rounded-xl border border-border p-4">
                <h2 className="font-semibold">Body trend</h2>
                <p className="mt-2">
                  Latest:{" "}
                  {displayWeight(weights.at(-1)![1].weightKg, prefs.weightUnit)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {weights.length} weigh-ins
                  {weights.length > 1
                    ? ` · Change: ${displayWeight(weights.at(-1)![1].weightKg - weights[0][1].weightKg, prefs.weightUnit)}`
                    : ""}
                </p>
              </section>
            )}
          </div>
        )}
        <section className="rounded-xl border border-border p-4">
          <h2 className="font-semibold">Actions and reflection</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {completedTasks.length} completed tasks · {milestones.length}{" "}
            milestones · {reflections.length} journal days
          </p>
          {completedTasks.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {completedTasks.slice(0, 10).map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ul>
          )}
        </section>
        <SectionLinks
          items={[
            {
              href: "/log",
              label: "Journal and quick capture",
              description: "Reflect on your day or add a record.",
            },
            {
              href: "/roadmap",
              label: "Learning and recall",
              description: "Review study evidence and revisit due material.",
            },
            {
              href: "/todo",
              label: "Task history",
              description: "Completed actions and remaining priorities.",
            },
            {
              href: "/goal",
              label: "Milestones",
              description: "Progress toward your chosen outcome.",
            },
          ]}
        />
      </PersonalShell>
    </RequireAuth>
  );
}
