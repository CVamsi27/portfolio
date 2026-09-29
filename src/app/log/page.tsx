"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import LogCapture from "@/components/trackers/LogCapture";

export default function LogPage() {
  return (
    <RequireAuth>
      <PersonalShell
        icon="log"
        title="Log"
        subtitle="Record workouts, fasting windows, tasks, and daily signals in real time."
      >
        <LogCapture />
      </PersonalShell>
    </RequireAuth>
  );
}
