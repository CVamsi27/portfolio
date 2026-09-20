"use client";

import { Suspense, use, useMemo } from "react";
import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { ImageIcon, Inbox, PenLine } from "lucide-react";
import { accessMode, expiryCopy } from "@/lib/share-domain";

type Incoming = {
  id: string;
  text: string;
  image_path: string | null;
  image_url: string | null;
  created_at: string;
  expires_at: string | null;
  owner: string;
  owner_email: string | null;
  is_public: boolean;
};

type IncomingResult = { rows: Incoming[]; unavailable: boolean };

async function fetchIncoming(uid: string): Promise<IncomingResult> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return { rows: [], unavailable: true };
  const sb = getSupabase();
  if (!sb) return { rows: [], unavailable: true };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const { data } = await sb
      .from("shared_drops")
      .select("id, text, image_path, image_url, created_at, expires_at, owner, owner_email, is_public")
      .neq("owner", uid)
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal);
    return { rows: (data ?? []) as Incoming[], unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** People sharing with me + the items they shared (email-allowlisted). */
function IncomingList({ uid, email }: { uid: string; email: string }) {
  const result = use(useMemo(() => fetchIncoming(uid), [uid]));
  const rows = result.rows;
  const groups = useMemo(() => {
    const m = new Map<string, Incoming[]>();
    for (const r of rows) {
      const k = r.owner_email ?? "Someone";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return [...m.entries()];
  }, [rows]);

  if (result.unavailable) {
    return (
      <Card variant="dossier">
        <CardContent className="p-8 text-center">
          <p className="text-3xl"><Inbox className="mx-auto h-8 w-8 text-primary" /></p>
          <h2 className="font-display mt-3 text-xl font-bold">Shared items unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">The access-controlled inbox could not be reached. Check your connection and try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card variant="dossier" className="border-dashed">
        <CardContent className="p-8 text-center">
              <p className="text-3xl"><Inbox className="mx-auto h-8 w-8 text-primary" /></p>
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
      <Card variant="dossier">
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
        <Card variant="dossier" key={sender}>
          <CardContent className="space-y-2 p-4">
            <h2 className="font-semibold">{sender}</h2>
            {items.map((it) => (
              <Link
                key={it.id}
                href={`/share/${it.id}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:bg-accent"
              >
                {it.image_path || it.image_url ? <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" /> : <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className="flex-1 truncate text-sm">
                  {it.text || "(image)"}
                </span>
                <span className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  <span className="block">{accessMode(it)}</span>
                  <span className="block">{expiryCopy(it.expires_at)}</span>
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
        icon="shared"
        title="Shared with me"
        subtitle="Drops other people allowlisted to your email. Their timers and revokes apply instantly."
      >
        {!user ? (
          <Card variant="dossier">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Sign in to see items shared with you.
            </CardContent>
          </Card>
        ) : (
          <Suspense
            fallback={
              <Card variant="dossier">
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
