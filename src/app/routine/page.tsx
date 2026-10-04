"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import RoutineReminders from "@/components/personal/RoutineReminders";
export default function RoutinePage() {
  return (
    <RequireAuth>
      <PersonalShell
        icon="timer"
        title="Routine reminders"
        subtitle="Meal and supplement times, with independent completion and no assumed doses."
      >
        <RoutineReminders configure />
      </PersonalShell>
    </RequireAuth>
  );
}
