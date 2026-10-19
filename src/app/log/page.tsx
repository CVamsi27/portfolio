"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import CaptureWorkspace from "@/components/daily/CaptureWorkspace";
import JournalWorkspace from "@/components/daily/JournalWorkspace";
function CapturePage() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (params.get("type") === "exercise") {
      const q = new URLSearchParams(params.toString());
      q.delete("type");
      router.replace(`/workout-tracking?${q}`);
    }
  }, [params, router]);
  return (
    <RequireAuth>
      <PersonalShell
        icon="log"
        title={
          params.get("view") === "journal" ? "Daily reflection" : "Add a record"
        }
        subtitle={null}
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
