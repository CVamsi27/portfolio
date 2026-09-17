"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { TRACKER_BRAND } from "@/lib/brand";
import { Lock } from "lucide-react";

/**
 * Gate for private tracker pages. Public pages: `/`, `/portfolio`,
 * `/login`, `/share`, `/share/[id]`, `/shared-with-me` handles its own
 * signed-out state (it is only useful signed in).
 * When Supabase isn't configured yet (local mode), everything stays open.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6">
        <div className="animate-pulse rounded-xl border border-border/60 bg-card p-8 text-sm text-muted-foreground">
          Checking sign-in…
        </div>
      </div>
    );
  }

  if (!configured || user) return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-16">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-primary/10 via-card to-card shadow-xl shadow-primary/5">
        <CardContent className="p-8 text-center">
            <p className="text-3xl"><Lock className="mx-auto h-8 w-8 text-primary" /></p>
          <h1 className="font-display mt-3 text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {TRACKER_BRAND.name} trackers are private to your account. Sign in with Google to
            continue — your data syncs across devices.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/login">
              <Button className="w-full">Go to login</Button>
            </Link>
            <Link
              href="/share"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              …or open the Share page
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
