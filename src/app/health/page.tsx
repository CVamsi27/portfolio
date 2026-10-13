"use client";
import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import HealthWorkspace from "@/components/daily/HealthWorkspace";
export default function HealthPage() {
  return (
    <RequireAuth>
      <PersonalShell
        showBack={false}
        title="Health"
        icon="scale"
        subtitle={null}
      >
        <Suspense fallback={<p>Loading health records…</p>}>
          <HealthWorkspace />
        </Suspense>
      </PersonalShell>
    </RequireAuth>
  );
}
