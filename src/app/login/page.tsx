"use client";

import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { KeyRound, UserCheck, Wrench } from "lucide-react";

function StatusIcon({ children, variant }: { children: React.ReactNode; variant: "primary" | "success" | "warn" }) {
  return (
    <span
      className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
        variant === "success"
          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
          : variant === "warn"
            ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25"
            : "bg-gradient-to-br from-primary to-fuchsia-500 shadow-primary/25"
      }`}
    >
      {children}
    </span>
  );
}

export default function LoginPage() {
  const { user, loading, configured } = useAuth();

  const signIn = () =>
    getSupabase()?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/trackers` },
    });

  return (
    <TrackerShell
      icon="login"
      title="Login"
      subtitle="One Google account unlocks all private trackers on every device. Public pages never need this."
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-primary/10 via-card to-card shadow-xl shadow-primary/5">
        <CardContent className="flex flex-col items-center p-8 text-center">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !configured ? (
            <>
              <StatusIcon variant="warn"><Wrench className="h-7 w-7 text-white" /></StatusIcon>
              <h2 className="font-display mt-4 text-xl font-bold">Sync not configured yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Add <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code> (see the
                setup steps), then this button signs you in with Google.
              </p>
              <Link href="/share" className="mt-4 inline-block text-sm text-primary hover:underline">
                Continue to the Share page
              </Link>
            </>
          ) : user ? (
            <>
              <StatusIcon variant="success"><UserCheck className="h-7 w-7 text-white" /></StatusIcon>
              <h2 className="font-display mt-4 text-xl font-bold">You're signed in</h2>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
              <Link href="/trackers" className="mt-5 w-full">
                <Button className="w-full">Open my trackers</Button>
              </Link>
              <Button
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => getSupabase()?.auth.signOut()}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <StatusIcon variant="primary"><KeyRound className="h-7 w-7 text-white" /></StatusIcon>
              <h2 className="font-display mt-4 text-xl font-bold">Sign in with Google</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Free, no password. Your fasting, workouts, todos, goal board and
                motivation sync across phone + laptop.
              </p>
              <Button className="mt-5 w-full" onClick={signIn}>
                Continue with Google
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Public pages stay open: <Link href="/" className="hover:underline">home</Link> ·{" "}
                <Link href="/share" className="hover:underline">share</Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </TrackerShell>
  );
}
