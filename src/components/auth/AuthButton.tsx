"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import type { SyncStatus } from "@/lib/use-synced-storage";

export function SyncBadge({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { dot: string; label: string }> = {
    "local-only": { dot: "bg-muted-foreground", label: "Local only" },
    syncing: { dot: "bg-amber-500 animate-pulse", label: "Syncing…" },
    synced: { dot: "bg-emerald-500", label: "Synced" },
    error: { dot: "bg-red-500", label: "Sync error" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function AuthButton() {
  const { user, loading, configured } = useAuth();

  if (loading) return null;

  if (!configured) {
    return (
      <span
        title="Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable Google sync"
        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
      >
        Local mode
      </span>
    );
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button size="sm" variant="outline">
          Sign in with Google
        </Button>
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="max-w-[140px] truncate text-xs text-muted-foreground">
        {user.email}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => getSupabase()?.auth.signOut()}
      >
        Sign out
      </Button>
    </span>
  );
}
