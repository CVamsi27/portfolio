"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ImageIcon, Inbox, PenLine, RefreshCw, Users } from "lucide-react";
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
type IncomingState = IncomingResult & { status: "loading" | "ready" | "unavailable" };
type IncomingGroup = { key: string; label: string; isSelf: boolean; items: Incoming[] };

async function fetchIncoming(): Promise<IncomingResult> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return { rows: [], unavailable: true };
  const sb = getSupabase();
  if (!sb) return { rows: [], unavailable: true };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const { data, error } = await sb
      .from("shared_drops")
      .select("id, text, image_path, image_url, created_at, expires_at, owner, owner_email, is_public")
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []) as Incoming[], unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

function groupIncomingRows(rows: Incoming[], uid: string): IncomingGroup[] {
  const groups = new Map<string, IncomingGroup>();
  for (const row of rows) {
    const isSelf = row.owner === uid;
    const key = isSelf ? "self" : row.owner_email ?? row.owner;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(row);
      continue;
    }
    groups.set(key, {
      key,
      label: isSelf ? "Your shared items" : row.owner_email ?? "Someone",
      isSelf,
      items: [row],
    });
  }
  return [...groups.values()];
}

function InboxSummary() {
  return (
    <Card variant="dossier" data-testid="shared-inbox-summary" className="shared-inbox__summary">
      <CardContent className="shared-inbox__summary-content">
        <div>
          <p className="shared-inbox__eyebrow">Dispatch inbox // private</p>
          <h2>Shared momentum, in one place.</h2>
          <p className="shared-inbox__summary-copy">
            Your shared items and incoming drops stay grouped by sender, with access and expiry visible at a glance.
          </p>
        </div>
        <div className="shared-inbox__summary-mark" aria-hidden>
          <Users className="h-5 w-5" />
          <span>Access<br />aware</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StateCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card variant="dossier">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="shared-inbox__state-icon" aria-hidden><Inbox className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
            {action ? <div className="mt-4">{action}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IncomingList({ uid }: { uid: string }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<IncomingState>({ status: "loading", rows: [], unavailable: false });

  useEffect(() => {
    let cancelled = false;
    void fetchIncoming().then((result) => {
      if (cancelled) return;
      setState({ ...result, status: result.unavailable ? "unavailable" : "ready" });
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, uid]);

  const groups = useMemo(() => groupIncomingRows(state.rows, uid), [state.rows, uid]);
  const retry = useCallback(() => {
    setState({ status: "loading", rows: [], unavailable: false });
    setReloadKey((value) => value + 1);
  }, []);

  if (state.status === "loading") {
    return (
      <Card variant="dossier" aria-live="polite">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            Loading your shared inbox…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "unavailable") {
    return (
      <StateCard
        title="Shared items unavailable"
        action={<button type="button" onClick={retry} className="shared-inbox__retry"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>}
      >
        The access-controlled inbox could not be reached. Check your connection and try again.
      </StateCard>
    );
  }

  if (groups.length === 0) {
    return (
      <StateCard title="Nothing shared yet">
        Your shared items will appear here, along with drops someone has allowlisted to your account.
      </StateCard>
    );
  }

  return (
    <div className="shared-inbox__groups">
      {groups.map((group) => (
        <Card variant="dossier" key={group.key} className="shared-inbox__group-card">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="shared-inbox__eyebrow">{group.isSelf ? "Owner dispatch" : "Incoming dispatch"}</p>
                <h2 className="mt-1 font-display text-lg font-bold">{group.label}</h2>
              </div>
              <span className="shared-inbox__count">{group.items.length}</span>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <Link key={item.id} href={`/share/${item.id}`} className="shared-inbox__item">
                  {item.image_path || item.image_url ? <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" /> : <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate text-sm">{item.text || "(image)"}</span>
                  <span className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                    <span className="block">{accessMode(item)}</span>
                    <span className="block">{expiryCopy(item.expires_at)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SharedInbox({ userId }: { userId: string | null }) {
  return (
    <>
      <InboxSummary />
      <div id="shared-inbox">
        {!userId ? (
          <StateCard title="Sign in to see incoming drops">
            Your local workspace is still available. Sign in when you want to receive allowlisted items across devices.
          </StateCard>
        ) : (
          <IncomingList uid={userId} />
        )}
      </div>
    </>
  );
}
