"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  ChevronRight,
  ImageIcon,
  Inbox,
  Lock,
  PenLine,
  RefreshCw,
  Users,
} from "lucide-react";
import { expiryCopy } from "@/lib/share-domain";
import { cn } from "@/lib/utils";

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
type IncomingState = IncomingResult & {
  status: "loading" | "ready" | "unavailable";
};
type IncomingGroup = {
  key: string;
  label: string;
  isSelf: boolean;
  items: Incoming[];
};

async function fetchIncoming(): Promise<IncomingResult> {
  if (typeof window === "undefined" || !isSupabaseConfigured())
    return { rows: [], unavailable: true };
  const sb = getSupabase();
  if (!sb) return { rows: [], unavailable: true };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const { data, error } = await sb
      .from("shared_drops")
      .select(
        "id, text, image_path, image_url, created_at, expires_at, owner, owner_email, is_public",
      )
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
    const key = isSelf ? "self" : (row.owner_email ?? row.owner);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(row);
      continue;
    }
    groups.set(key, {
      key,
      label: isSelf ? "Your shared items" : (row.owner_email ?? "Someone"),
      isSelf,
      items: [row],
    });
  }
  return [...groups.values()];
}

function InboxSummary() {
  return (
    <p
      data-testid="shared-inbox-summary"
      className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
    >
      <Inbox className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        Your shared items and incoming drops, newest first and grouped by
        sender, with access and expiry on every record.
      </span>
    </p>
  );
}

function StateCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card variant="dossier">
      <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:p-6">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          aria-hidden
        >
          <Inbox className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

/** Small square preview for rows that carry media; falls back to an icon. */
function InboxThumb({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    const sb = getSupabase();
    if (!sb) return;
    void sb.storage
      .from("drops")
      .createSignedUrl(path, 900)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.signedUrl) setUrl(data.signedUrl);
        else setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path || failed) {
    return (
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        aria-hidden
      >
        {path ? (
          <ImageIcon className="h-4 w-4" />
        ) : (
          <PenLine className="h-4 w-4" />
        )}
      </span>
    );
  }

  if (!url) {
    return (
      <span
        className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-muted"
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="shared drop preview"
      className="h-11 w-11 shrink-0 rounded-lg object-cover"
      loading="lazy"
    />
  );
}

function AccessPill({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isPublic
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {isPublic ? (
        <Users className="h-3 w-3" aria-hidden />
      ) : (
        <Lock className="h-3 w-3" aria-hidden />
      )}
      {isPublic ? "Link" : "Private"}
    </span>
  );
}

function IncomingGroupCard({ group }: { group: IncomingGroup }) {
  return (
    <Card variant="dossier" className="min-w-0 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {group.isSelf ? "Sent by you" : "Incoming"}
            </p>
            <h2 className="font-display mt-1 truncate text-lg font-semibold">
              {group.label}
            </h2>
          </div>
          <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold tabular-nums text-muted-foreground">
            {group.items.length}
          </span>
        </header>
        <ul className="mt-2 space-y-1">
          {group.items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/share/${item.id}`}
                className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <InboxThumb path={item.image_path} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.text || "Image drop"}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <AccessPill isPublic={item.is_public} />
                    <span className="tabular-nums">
                      {expiryCopy(item.expires_at)}
                    </span>
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function IncomingList({ uid }: { uid: string }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<IncomingState>({
    status: "loading",
    rows: [],
    unavailable: false,
  });

  useEffect(() => {
    let cancelled = false;
    void fetchIncoming().then((result) => {
      if (cancelled) return;
      setState({
        ...result,
        status: result.unavailable ? "unavailable" : "ready",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, uid]);

  const groups = useMemo(
    () => groupIncomingRows(state.rows, uid),
    [state.rows, uid],
  );
  const retry = useCallback(() => {
    setState({ status: "loading", rows: [], unavailable: false });
    setReloadKey((value) => value + 1);
  }, []);

  if (state.status === "loading") {
    return (
      <Card variant="dossier" aria-live="polite">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground sm:p-6">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          Loading your shared inbox…
        </CardContent>
      </Card>
    );
  }

  if (state.status === "unavailable") {
    return (
      <StateCard
        title="Shared items unavailable"
        action={
          <Button variant="secondary" size="sm" onClick={retry}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try again
          </Button>
        }
      >
        The access-controlled inbox could not be reached. Check your connection
        and try again.
      </StateCard>
    );
  }

  if (groups.length === 0) {
    return (
      <StateCard title="Nothing shared yet">
        Your shared items will appear here, along with drops someone has
        allowlisted to your account.
      </StateCard>
    );
  }

  const total = state.rows.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm tabular-nums text-muted-foreground">
          {total} {total === 1 ? "item" : "items"} · {groups.length}{" "}
          {groups.length === 1 ? "sender" : "senders"}
        </p>
        <button
          type="button"
          onClick={retry}
          aria-label="Refresh inbox"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <IncomingGroupCard key={group.key} group={group} />
        ))}
      </div>
    </div>
  );
}

export default function SharedInbox({ userId }: { userId: string | null }) {
  return (
    <>
      <InboxSummary />
      <div id="shared-inbox">
        {!userId ? (
          <StateCard
            title="Sign in to see incoming drops"
            action={
              <Link href="/login">
                <Button size="sm">Sign in with Google</Button>
              </Link>
            }
          >
            Your local workspace is still available. Sign in when you want to
            receive allowlisted items across devices.
          </StateCard>
        ) : (
          <IncomingList uid={userId} />
        )}
      </div>
    </>
  );
}
