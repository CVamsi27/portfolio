"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import ProgressDashboard from "@/components/progress/ProgressDashboard";
export default function DashboardPage() {
  return (
    <RequireAuth>
      <PersonalShell
        title="Progress"
        eyebrow="Your records over time"
        icon="log"
        showBack={false}
        subtitle="See what changed, check what is missing and choose your next action."
      >
        <ProgressDashboard />
      </PersonalShell>
    </RequireAuth>
  );
}
