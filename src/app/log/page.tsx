"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import LogCapture from "@/components/trackers/LogCapture";

export default function LogPage() {
  return <RequireAuth><PersonalShell icon="todo" title="Log" subtitle="Record the signal while it is still fresh."><LogCapture /></PersonalShell></RequireAuth>;
}
