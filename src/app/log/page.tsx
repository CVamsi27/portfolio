"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import CaptureWorkspace from "@/components/daily/CaptureWorkspace";
import JournalWorkspace from "@/components/daily/JournalWorkspace";
function CapturePage() {
  const params = useSearchParams();
  return (
    <RequireAuth>
      <PersonalShell
        icon="log"
        title={params.get("view") === "journal" ? "Journal" : "Add a record"}
        subtitle="Choose one activity and record it for the right day."
      >
        {params.get("view") === "journal" ? (
          <JournalWorkspace />
        ) : (
          <CaptureWorkspace
            key={params.toString()}
            initialType={params.get("type") ?? ""}
            initialDate={params.get("date") ?? undefined}
            returnTo={params.get("returnTo") ?? "/hub"}
          />
        )}
      </PersonalShell>
    </RequireAuth>
  );
}
export default function LogPage() {
  return (
    <Suspense fallback={<p>Loading capture…</p>}>
      <CapturePage />
    </Suspense>
  );
}
