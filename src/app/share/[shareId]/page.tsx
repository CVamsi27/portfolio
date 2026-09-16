"use client";

import { Suspense, use, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TrackerShell from "@/components/trackers/TrackerShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Lock } from "lucide-react";

type SharedRow = {
  text: string;
  image_url: string | null;
  created_at: string;
  expires_at: string | null;
  owner_email: string | null;
};

async function fetchSharedDrop(shareId: string): Promise<SharedRow | null> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return null;
  const sb = getSupabase();
  if (!sb) return null;
  // Never rejects: RLS denial (not allowlisted) / expiry / network → null.
  try {
    const { data } = await sb
      .from("shared_drops")
      .select("text, image_url, created_at, expires_at, owner_email")
      .eq("id", shareId)
      .maybeSingle();
    if (!data) return null;
    const row = data as SharedRow;
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return null;
    return row;
  } catch {
    return null;
  }
}

/**
 * Private shared view — RLS only returns the row when the signed-in
 * viewer's email is allowlisted (or they're the owner) and unexpired.
 */
function SharedDrop({ shareId }: { shareId: string }) {
  const row = use(useMemo(() => fetchSharedDrop(shareId), [shareId]));

  if (!row) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-3xl"><Lock className="mx-auto h-8 w-8 text-primary" /></p>
          <h2 className="font-display mt-3 text-xl font-bold">Not shared with you</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This email isn&apos;t on the allowlist, or the link expired / was revoked.
          </p>
          <Link href="/shared-with-me">
            <Button variant="outline" className="mt-4 w-full">See what&apos;s shared with me</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {row.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.image_url} alt="shared drop" className="max-h-[480px] w-full object-contain bg-muted/30" />
      )}
      <CardContent className="p-5">
        {row.text && <p className="whitespace-pre-wrap leading-relaxed">{row.text}</p>}
        <p className="mt-3 text-xs tabular-nums text-muted-foreground">
          From {row.owner_email ?? "someone"} · {row.created_at.slice(0, 16).replace("T", " ")}
          {row.expires_at ? ` · vanishes ${row.expires_at.slice(0, 16).replace("T", " ")}` : " · never expires"}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SharedDropPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { user, loading, configured } = useAuth();

  return (
    <TrackerShell
      icon="link"
      title="Shared drop"
      subtitle="Private link — only emails the owner allowlisted can open this. Sign in with the right Google account."
    >
      {loading || !configured ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {loading ? "Loading shared drop…" : "Sharing isn't configured on this deployment yet."}
          </CardContent>
        </Card>
      ) : !user ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-3xl"><Lock className="mx-auto h-8 w-8 text-primary" /></p>
            <h2 className="font-display mt-3 text-xl font-bold">Sign in to view</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This link is allowlisted — sign in with the Google account it was shared to.
            </p>
            <Link href="/login">
              <Button className="mt-4 w-full">Go to login</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Loading shared drop…
              </CardContent>
            </Card>
          }
        >
          <SharedDrop shareId={shareId} />
        </Suspense>
      )}
    </TrackerShell>
  );
}
