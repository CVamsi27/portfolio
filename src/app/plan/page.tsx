"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTodos } from "@/lib/tracker-store";
import { dateKey } from "@/lib/trackers";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import FocusSprint from "@/components/trackers/FocusSprint";
import Link from "next/link";
import SectionLinks from "@/components/personal/SectionLinks";
export default function PlanPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading your plan…</p>}>
      <PlanWorkspace />
    </Suspense>
  );
}
function PlanWorkspace() {
  const { value: tasks } = useTodos();
  const taskId = useSearchParams().get("task");
  const [chosenTask, setChosenTask] = useState<string>();
  const pending = (tasks ?? [])
    .filter((item) => !item.done && item.date <= dateKey())
    .sort(
      (a, b) =>
        a.priority.localeCompare(b.priority) || a.createdAt - b.createdAt,
    );
  const selected =
    (tasks ?? []).find((item) => item.id === (chosenTask ?? taskId)) ??
    (chosenTask === "" ? undefined : pending[0]);
  return (
    <RequireAuth>
      <PersonalShell
        showBack={false}
        title="Plan"
        icon="todo"
        subtitle="Choose the next step, then give it your attention."
      >
        <div className="plan-workspace-grid">
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Focus task
              <select
                aria-label="Focus task"
                className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                value={selected?.id ?? ""}
                onChange={(event) => setChosenTask(event.target.value)}
              >
                <option value="">Focused work</option>
                {(tasks ?? [])
                  .filter((item) => !item.done)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.text}
                    </option>
                  ))}
              </select>
            </label>
            <FocusSprint label={selected?.text ?? "Focused work"} />
          </div>
          <section className="progress-panel">
            <header>
              <h2>Your next tasks</h2>
              <Link href="/todo" className="progress-panel-action">
                Manage tasks →
              </Link>
            </header>
            {pending.length ? (
              <ol className="plan-task-queue">
                {pending.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={selected?.id === item.id}
                      onClick={() => setChosenTask(item.id)}
                    >
                      <span>{item.text}</span>
                      <small>
                        {item.priority} · Due {item.date}
                      </small>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="progress-note">
                No pending tasks due today. Add a task or start an open work
                session.
              </p>
            )}
            <p className="progress-note">
              {pending.length} pending tasks due by today. Select one to focus
              on.
            </p>
          </section>
        </div>
        <SectionLinks
          items={[
            {
              href: "/todo",
              label: "Tasks",
              description: "Priorities, due dates and your next three actions.",
            },
            {
              href: "/goal",
              label: "Goals",
              description: "Your outcome, milestones and weekly commitment.",
            },
            {
              href: "/roadmap",
              label: "Roadmap and timetable",
              description:
                "Your study blocks and progress through the curriculum.",
            },
          ]}
        />
      </PersonalShell>
    </RequireAuth>
  );
}
