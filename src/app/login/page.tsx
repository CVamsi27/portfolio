"use client";

import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";

export default function LoginPage() {
  const { user, loading, configured } = useAuth();

  const signIn = () =>
    getSupabase()?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/trackers` },
    });

  return (
    <TrackerShell
      icon="🔑"
      title="Login"
      subtitle="One Google account unlocks all private trackers on every device. Public pages never need this."
    >
      <Card>
        <CardContent className="p-8 text-center">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !configured ? (
            <>
              <p className="text-3xl">🔧</p>
              <h2 className="font-display mt-3 text-xl font-bold">Sync not configured yet</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code> (see the
                setup steps), then this button signs you in with Google.
              </p>
              <Link href="/share" className="mt-4 inline-block text-sm text-primary hover:underline">
                Continue to the Share page →
              </Link>
            </>
          ) : user ? (
            <>
              <p className="text-3xl">✅</p>
              <h2 className="font-display mt-3 text-xl font-bold">You&apos;re signed in</h2>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
              <Link href="/trackers">
                <Button className="mt-5 w-full">Open my trackers</Button>
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
              <p className="text-3xl">🔑</p>
              <h2 className="font-display mt-3 text-xl font-bold">Sign in with Google</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
