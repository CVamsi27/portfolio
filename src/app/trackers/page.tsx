"use client";
import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import DailyWorkspace from "@/components/daily/DailyWorkspace";
import {
  useMigrateTodos,
  useMigrateFasting,
  useMigrateGoal,
  useMigrateWorkouts,
} from "@/lib/tracker-store";
export default function TrackersHub() {
  useMigrateTodos();
  useMigrateFasting();
  useMigrateGoal();
  useMigrateWorkouts();
  return (
    <RequireAuth>
      <PersonalShell
        showBack={false}
        title="Today"
        icon="hub"
        subtitle="Work, meals, movement and reminders — one day at a time."
      >
        <Suspense fallback={<p>Loading your day…</p>}>
          <DailyWorkspace />
        </Suspense>
      </PersonalShell>
    </RequireAuth>
  );
}
