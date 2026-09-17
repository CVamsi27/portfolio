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
import { storagePathFromUrl } from "@/lib/share-domain";

type SharedRow = {
  text: string;
  imageUrl: string | null;
  created_at: string;
  expiresAt: string | null;
  ownerEmail: string | null;
};

async function fetchSharedDrop(shareId: string, signedIn: boolean): Promise<SharedRow | null> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    if (!signedIn) {
      const response = await fetch(`/api/share/${encodeURIComponent(shareId)}`, { signal: controller.signal });
      if (!response.ok) return null;
      return (await response.json()) as SharedRow;
    }

    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb
      .from("shared_drops")
      .select("text, image_path, image_url, created_at, expires_at, owner_email")
      .eq("id", shareId)
      .abortSignal(controller.signal)
      .maybeSingle();
    if (!data || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) return null;
    const imagePath = data.image_path ?? (data.image_url ? storagePathFromUrl(data.image_url) : null);
    let imageUrl: string | null = null;
    if (imagePath) {
      const signed = await sb.storage.from("drops").createSignedUrl(imagePath, 300);
      if (signed.error || !signed.data?.signedUrl) return null;
      imageUrl = signed.data.signedUrl;
    }
    return {
      text: data.text,
      imageUrl,
      created_at: data.created_at,
      expiresAt: data.expires_at,
      ownerEmail: data.owner_email,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Private shared view — RLS only returns the row when the signed-in
 * viewer's email is allowlisted (or they're the owner) and unexpired.
 */
function SharedDrop({ shareId }: { shareId: string }) {
  const { user } = useAuth();
  const row = use(useMemo(() => fetchSharedDrop(shareId, Boolean(user)), [shareId, user]));

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
      {row.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.imageUrl} alt="shared drop" className="max-h-[480px] w-full object-contain bg-muted/30" />
      )}
      <CardContent className="p-5">
        {row.text && <p className="whitespace-pre-wrap leading-relaxed">{row.text}</p>}
        <p className="mt-3 text-xs tabular-nums text-muted-foreground">
          From {row.ownerEmail ?? "someone"} · {row.created_at.slice(0, 16).replace("T", " ")}
          {row.expiresAt ? ` · vanishes ${row.expiresAt.slice(0, 16).replace("T", " ")}` : " · never expires"}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SharedDropPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { loading, configured } = useAuth();

  return (
    <TrackerShell
      icon="link"
      title="Shared drop"
      subtitle="An access-controlled drop with short-lived media and automatic expiry."
    >
      {loading || !configured ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {loading ? "Loading shared drop…" : "Sharing isn't configured on this deployment yet."}
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
