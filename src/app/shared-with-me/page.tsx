"use client";

import { Suspense, use, useMemo } from "react";
import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";

type Incoming = {
  id: string;
  text: string;
  image_url: string | null;
  created_at: string;
  expires_at: string | null;
  owner: string;
  owner_email: string | null;
};

async function fetchIncoming(uid: string): Promise<Incoming[]> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return [];
  const sb = getSupabase();
  if (!sb) return [];
  // Never rejects: RLS denial / network error → empty list.
  try {
    const { data } = await sb
      .from("shared_drops")
      .select("id, text, image_url, created_at, expires_at, owner, owner_email")
      .order("created_at", { ascending: false });
    return ((data ?? []) as Incoming[]).filter((r) => r.owner !== uid);
  } catch {
    return [];
  }
}

/** People sharing with me + the items they shared (email-allowlisted). */
function IncomingList({ uid, email }: { uid: string; email: string }) {
  const rows = use(useMemo(() => fetchIncoming(uid), [uid]));
  const groups = useMemo(() => {
    const m = new Map<string, Incoming[]>();
    for (const r of rows) {
      const k = r.owner_email ?? "Someone";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return [...m.entries()];
  }, [rows]);

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-3xl">📭</p>
          <h2 className="font-display mt-3 text-xl font-bold">Nothing shared yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When someone allowlists <strong>{email}</strong> on a drop, it lands here grouped by sender.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            People sharing with you
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {groups.map(([sender, items]) => (
              <span key={sender} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {sender} · {items.length}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
      {groups.map(([sender, items]) => (
        <Card key={sender}>
          <CardContent className="space-y-2 p-4">
            <h2 className="font-semibold">{sender}</h2>
            {items.map((it) => (
              <Link
                key={it.id}
                href={`/share/${it.id}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:bg-accent"
              >
                {it.image_url ? <span>🖼</span> : <span>✎</span>}
                <span className="flex-1 truncate text-sm">
                  {it.text || "(image)"}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {it.expires_at ? `⏳ ${it.expires_at.slice(0, 10)}` : "∞"}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default function SharedWithMePage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      <TrackerShell
        icon="👥"
        title="Shared with me"
        subtitle="Drops other people allowlisted to your email. Their timers and revokes apply instantly."
      >
        {!user ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Sign in to see items shared with you.
            </CardContent>
          </Card>
        ) : (
          <Suspense
            fallback={
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Loading shared items…
                </CardContent>
              </Card>
            }
          >
            <IncomingList uid={user.id} email={user.email ?? ""} />
          </Suspense>
        )}
      </TrackerShell>
    </RequireAuth>
  );
}
