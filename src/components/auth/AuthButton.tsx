"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import type { SyncStatus } from "@/lib/use-synced-storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRound, Settings, BookOpen, LogOut, ChevronDown, CheckCircle2 } from "lucide-react";

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

export default function AuthButton({ showEmail = false }: { showEmail?: boolean } = {}) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();

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
    // The /login page has its own sign-in card — don't duplicate it in nav.
    if (pathname === "/login") return null;
    return (
      <Link href="/login">
        <Button size="sm" variant="outline">
          Sign in with Google
        </Button>
      </Link>
    );
  }

  const initial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="inline-flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted/80 hover:border-primary/50 cursor-pointer shadow-xs active:scale-95"
            title={`Account: ${user.email ?? "Signed-in"}`}
          >
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
              {initial}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background bg-emerald-500" />
            </span>
            <span className="hidden sm:inline-block max-w-[140px] truncate text-xs text-muted-foreground font-mono">
              {user.email?.split("@")[0]}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1.5">
          <DropdownMenuLabel className="px-2 py-1.5 font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-semibold leading-none text-foreground truncate">
                {user.email}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>Google Sync Active</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Account & Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/roadmap" className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Career Roadmap</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => getSupabase()?.auth.signOut()}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showEmail ? (
        <span
          data-testid="auth-email"
          className="hidden lg:inline max-w-[min(60vw,32rem)] break-all text-right text-xs leading-5 text-muted-foreground"
        >
          {user.email}
        </span>
      ) : null}
    </div>
  );
}
