"use client";
import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import DailyWorkspace from "@/components/daily/DailyWorkspace";
export default function PlanPage() {
  return (
    <RequireAuth>
      <PersonalShell
        showBack={false}
        title={null}
        icon="todo"
        subtitle={null}
      >
        <Suspense fallback={<p>Loading your plan…</p>}>
          <DailyWorkspace planning />
        </Suspense>
      </PersonalShell>
    </RequireAuth>
  );
}
