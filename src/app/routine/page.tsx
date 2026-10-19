"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import ChapterBreadcrumb from "@/components/trackers/ChapterBreadcrumb";
import MetricSummary from "@/components/progress/MetricSummary";
import RoutineReminders from "@/components/personal/RoutineReminders";
export default function RoutinePage() {
  return (
    <RequireAuth>
      <PersonalShell
        icon="timer"
        title="Routine reminders"
        subtitle={null}
        breadcrumb={
          <ChapterBreadcrumb
            href="/health"
            label="Health"
            current="Routine reminders"
          />
        }
        context={<MetricSummary metric="routine" context="today" />}
      >
        <RoutineReminders configure />
      </PersonalShell>
    </RequireAuth>
  );
}
