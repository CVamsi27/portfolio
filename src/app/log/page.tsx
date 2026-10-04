"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import SectionLinks from "@/components/personal/SectionLinks";
import LogCapture from "@/components/trackers/LogCapture";

export default function LogPage() {
  return (
    <RequireAuth>
      <PersonalShell
        icon="log"
        title="Log"
        subtitle="Record workouts, fasting windows, tasks, and daily signals in real time."
      >
        <SectionLinks
          items={[
            {
              href: "/food",
              label: "Food",
              description: "Log a meal or nutrient label.",
            },
            {
              href: "/health",
              label: "Recovery",
              description: "Record sleep, mood and energy.",
            },
            {
              href: "/routine",
              label: "Routine",
              description: "Meal and supplement completion.",
            },
          ]}
        />
        <LogCapture />
      </PersonalShell>
    </RequireAuth>
  );
}
