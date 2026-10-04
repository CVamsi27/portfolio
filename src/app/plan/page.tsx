"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTodos } from "@/lib/tracker-store";
import { dateKey } from "@/lib/trackers";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import FocusSprint from "@/components/trackers/FocusSprint";
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
  const pending = (tasks ?? [])
    .filter((item) => !item.done && item.date <= dateKey())
    .sort(
      (a, b) =>
        a.priority.localeCompare(b.priority) || a.createdAt - b.createdAt,
    );
  const selected =
    (tasks ?? []).find((item) => item.id === taskId) ?? pending[0];
  return (
    <RequireAuth>
      <PersonalShell
        title="Plan"
        icon="todo"
        subtitle="Choose the next step, then give it your attention."
      >
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
        <FocusSprint label={selected?.text ?? "Focused work"} />
      </PersonalShell>
    </RequireAuth>
  );
}
