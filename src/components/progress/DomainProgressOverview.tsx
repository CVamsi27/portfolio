"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import { displayWeight } from "@/lib/health";
export default function DomainProgressOverview() {
  const path = usePathname();
  const domains: Record<string, string> = {
    "/food": "nutrition",
    "/weight-loss": "body",
    "/workout-tracking": "exercise",
    "/intermittent-fasting": "wellbeing",
    "/routine": "routine",
    "/todo": "tasks",
    "/goal": "goals",
    "/roadmap": "learning",
    "/health": "health",
    "/review": "all",
  };
  const domain = domains[path];
  return domain ? <Overview domain={domain} /> : null;
}
function Overview({ domain }: { domain: string }) {
  const { data: d, prefs, milestones, tasks } = usePersonalProgress(7);
  const fields: Record<string, Array<[string, string]>> = {
    nutrition: [
      ["Food logged", `${d.foodDays}/7 days`],
      [
        "Calories / known day",
        d.nutrients.energy.average === null
          ? "Not recorded"
          : `${Math.round(d.nutrients.energy.average)} kcal`,
      ],
      [
        "Protein / known day",
        d.nutrients.protein.average === null
          ? "Not recorded"
          : `${Math.round(d.nutrients.protein.average)} g`,
      ],
    ],
    body: [
      [
        "Latest in range",
        d.latestWeight
          ? displayWeight(d.latestWeight.value, prefs.weightUnit)
          : "Not recorded",
      ],
      [
        "Change between readings",
        d.weightChange === null
          ? "Need 2 readings"
          : displayWeight(d.weightChange, prefs.weightUnit),
      ],
      ["Weigh-ins", String(d.weightCount)],
    ],
    exercise: [
      ["Exercise logged", `${d.workoutDays}/7 days`],
      ["Saved sets", String(d.setCount)],
      [
        "Recorded duration",
        d.exerciseMinutes === null
          ? "Not recorded"
          : `${d.exerciseMinutes} min`,
      ],
    ],
    wellbeing: [
      ["Water logged", `${d.waterDays}/7 days`],
      ["Water recorded", `${d.waterTotal} glasses`],
      [
        "Sleep / known day",
        d.sleepAverage === null
          ? "Not recorded"
          : `${d.sleepAverage.toFixed(1)} h`,
      ],
    ],
    learning: [
      ["Study records", String(d.studySessions)],
      ["Study duration", `${d.studyMinutes} min`],
      ["Focus duration", `${d.focusMinutes} min`],
    ],
    routine: [
      ["Completed reminders", String(d.routineCompleted)],
      [
        "Days with completion",
        `${d.days.filter((day) => day.routine > 0).length}/7`,
      ],
      ["Habit records", String(d.habitsCompleted)],
    ],
    tasks: [
      ["Tasks completed", String(d.completedTasks)],
      ["Tasks pending now", String(tasks.filter((item) => !item.done).length)],
      ["Focus duration", `${d.focusMinutes} min`],
    ],
    goals: [
      ["Tasks completed", String(d.completedTasks)],
      [
        "Milestones · current goal",
        milestones.length
          ? `${milestones.filter((item) => item.done).length}/${milestones.length}`
          : "Not set",
      ],
      ["Routine completions", String(d.routineCompleted)],
    ],
    health: [
      [
        "Latest weight",
        d.latestWeight
          ? displayWeight(d.latestWeight.value, prefs.weightUnit)
          : "Not recorded",
      ],
      ["Food logged", `${d.foodDays}/7 days`],
      ["Exercise logged", `${d.workoutDays}/7 days`],
    ],
    all: [
      ["Exercise logged", `${d.workoutDays}/7 days`],
      ["Food logged", `${d.foodDays}/7 days`],
      ["Tasks completed", String(d.completedTasks)],
    ],
  };
  return (
    <section
      className="domain-progress-overview"
      aria-label="Seven-day progress"
    >
      <header>
        <span>Last 7 days · saved records</span>
        <Link
          href={`/dashboard${domain === "all" || domain === "health" ? "" : `#${domain}`}`}
        >
          Full progress dashboard →
        </Link>
      </header>
      <dl>
        {fields[domain].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
