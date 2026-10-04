"use client";
import { useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import TodayHeader from "@/components/trackers/TodayHeader";
import RoadmapTodayCard from "@/components/trackers/RoadmapTodayCard";
import Questionnaire from "@/components/Questionnaire";
import { useUserPrefs, displayGoalTitle } from "@/lib/user-prefs";
import {
  useTodos,
  useNow,
  useMigrateTodos,
  useMigrateFasting,
  useMigrateGoal,
  useMigrateWorkouts,
} from "@/lib/tracker-store";
import { dateKey } from "@/lib/trackers";
import { usePersonalModules } from "@/lib/personal-modules";
import RoutineReminders from "@/components/personal/RoutineReminders";
import RecoveryTracker from "@/components/personal/RecoveryTracker";
import HabitChecklist from "@/components/personal/HabitChecklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionLinks from "@/components/personal/SectionLinks";
export default function TrackersHub() {
  useMigrateTodos();
  useMigrateFasting();
  useMigrateGoal();
  useMigrateWorkouts();
  const { prefs, isSetup } = useUserPrefs();
  const todos = useTodos();
  const modules = usePersonalModules();
  const [text, setText] = useState("");
  const [setup, setSetup] = useState(false);
  const now = useNow(30_000);
  const today = dateKey(new Date(now));
  const pending = (todos.value ?? [])
    .filter((item) => !item.done && item.date <= today)
    .sort(
      (a, b) =>
        a.priority.localeCompare(b.priority) || a.createdAt - b.createdAt,
    );
  const next = pending[0];
  const add = () => {
    if (!text.trim()) return;
    todos.setValue((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        text: text.trim(),
        done: false,
        date: today,
        priority: "P2",
        tag: "Personal",
        createdAt: Date.now(),
      },
    ]);
    setText("");
  };
  if (!isSetup || setup)
    return (
      <RequireAuth>
        <Questionnaire onComplete={() => setSetup(false)} />
      </RequireAuth>
    );
  return (
    <RequireAuth>
      <PersonalShell title={null} showBack={false}>
        <TodayHeader
          name={prefs.name}
          goalTitle={displayGoalTitle(prefs)}
          momentumPercent={undefined}
        />
        <section
          className="rounded-xl border border-primary/40 bg-card p-5"
          data-testid="next-move-card"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Your next action
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {next?.text ?? "Choose one useful action for today"}
          </h2>
          <Button asChild className="mt-3" data-editorial-action>
            <Link href={next ? "/plan#focus-sprint" : "/todo"}>
              {next ? "Start focused work" : "Plan today"}
            </Link>
          </Button>
        </section>
        <section className="rounded-xl border border-border p-4">
          <div className="flex justify-between items-center gap-2">
            <h2 className="font-semibold">Top three tasks</h2>
            <Link
              className="min-h-11 inline-flex items-center text-sm text-primary underline"
              href="/todo"
            >
              All tasks
            </Link>
          </div>
          {pending.length ? (
            <ul>
              {pending.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() =>
                        todos.setValue((previous) =>
                          previous.map((task) =>
                            task.id === item.id
                              ? { ...task, done: true, completedAt: Date.now() }
                              : task,
                          ),
                        )
                      }
                    />
                    {item.text}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pending tasks for today.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
            className="mt-3 flex gap-2"
          >
            <Input
              aria-label="Task name"
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a task…"
            />
            <Button type="submit" disabled={!text.trim()}>
              Add task
            </Button>
          </form>
        </section>
        {modules.value.study && <RoadmapTodayCard />}
        <SectionLinks
          items={[
            {
              href: "/log",
              label: "Quick capture",
              description: "A thought, goal metric or activity.",
            },
            ...(modules.value.food
              ? [
                  {
                    href: "/food",
                    label: "Log food",
                    description: "Meals, calories and nutrient coverage.",
                  },
                ]
              : []),
            ...(modules.value.movement
              ? [
                  {
                    href: "/workout-tracking",
                    label: "Log movement",
                    description: "Record your workout.",
                  },
                ]
              : []),
            ...(modules.value.fasting
              ? [
                  {
                    href: "/intermittent-fasting",
                    label: "Fasting and water",
                    description: "Your eating window and hydration.",
                  },
                ]
              : []),
          ]}
        />
        {modules.value.routine && <RoutineReminders />}
        {modules.value.recovery && <RecoveryTracker />}
        {modules.value.habits && <HabitChecklist />}
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/settings#modules"
            className="min-h-11 inline-flex items-center text-primary underline"
          >
            Customize Today
          </Link>
          <button
            className="min-h-11 text-muted-foreground"
            onClick={() => setSetup(true)}
          >
            {isSetup ? "Edit your setup" : "Set up your goals"}
          </button>
        </div>
      </PersonalShell>
    </RequireAuth>
  );
}
