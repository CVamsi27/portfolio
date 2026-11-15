"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PersonalShell from "@/components/trackers/PersonalShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useToast } from "@/components/ui/use-toast";
import { Check, Copy, Lock, Users } from "lucide-react";
import { expiryCopy, storagePathFromUrl } from "@/lib/share-domain";

type SharedRow = {
  text: string;
  imageUrls: string[];
  created_at: string;
  expiresAt: string | null;
  ownerEmail: string | null;
  isPublic: boolean;
};

type SharedRowFields = {
  text: string;
  image_path: string | null;
  image_url: string | null;
  image_paths?: string[] | null;
  created_at: string;
  expires_at: string | null;
  owner_email: string | null;
  is_public: boolean;
};

const ROW_COLUMNS =
  "text, image_path, image_url, created_at, expires_at, owner_email, is_public";

/** Paths for every image on the row, newest schema first. */
function imagePathsFor(row: SharedRowFields): string[] {
  const fromArray = (row.image_paths ?? []).filter(Boolean);
  if (fromArray.length) return [...new Set(fromArray)];
  if (row.image_path) return [row.image_path];
  if (row.image_url) {
    const path = storagePathFromUrl(row.image_url);
    return path ? [path] : [];
  }
  return [];
}

async function signPaths(
  paths: string[],
  signer: {
    createSignedUrl: (
      path: string,
      seconds: number,
    ) => Promise<{ data?: { signedUrl?: string } | null; error?: unknown }>;
  },
): Promise<string[]> {
  const urls = await Promise.all(
    paths.map(async (path) => {
      try {
        const { data, error } = await signer.createSignedUrl(path, 3600);
        if (error || !data?.signedUrl) return null;
        return data.signedUrl;
      } catch {
        return null;
      }
    }),
  );
  return urls.filter((url): url is string => Boolean(url));
}

async function fetchSharedDrop(
  shareId: string,
  signedIn: boolean,
): Promise<SharedRow | null> {
  if (typeof window === "undefined") return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    if (!signedIn) {
      const response = await fetch(
        `/api/share/${encodeURIComponent(shareId)}`,
        {
          signal: controller.signal,
        },
      );
      if (!response.ok) return null;
      return (await response.json()) as SharedRow;
    }

    const sb = getSupabase();
    if (!sb) return null;
    let { data, error } = await sb
      .from("shared_drops")
      .select(`${ROW_COLUMNS}, image_paths`)
      .eq("id", shareId)
      .abortSignal(controller.signal)
      .maybeSingle();
    if (error) {
      // Deployments without 0017_share_multi_image.sql fall back to one image.
      const legacy = await sb
        .from("shared_drops")
        .select(ROW_COLUMNS)
        .eq("id", shareId)
        .abortSignal(controller.signal)
        .maybeSingle();
      data = legacy.data as unknown as typeof data;
      error = legacy.error;
    }
    if (error || !data) return null;
    const row = data as unknown as SharedRowFields;
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now())
      return null;

    const imageUrls = await signPaths(
      imagePathsFor(row),
      sb.storage.from("drops"),
    );
    return {
      text: row.text,
      imageUrls,
      created_at: row.created_at,
      expiresAt: row.expires_at,
      ownerEmail: row.owner_email,
      isPublic: row.is_public === true,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Readable "15 Nov 2026, 14:05" — rendered client-side after the fetch. */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SenderMark({ email }: { email: string | null }) {
  const initial = (email ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary"
      aria-hidden
    >
      {initial}
    </span>
  );
}

function Gallery({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <div className="border-b border-border/40 bg-muted/20">
        <a
          href={images[0]}
          target="_blank"
          rel="noreferrer"
          aria-label="Open shared image in a new tab"
          className="block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt="shared drop"
            className="mx-auto max-h-[70vh] w-full object-contain"
          />
        </a>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-px border-b border-border/40 bg-border/40 sm:grid-cols-3">
      {images.map((url, index) => (
        <a
          key={`${url.slice(0, 24)}-${index}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open shared image ${index + 1} in a new tab`}
          className="group block overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`shared drop image ${index + 1}`}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </a>
      ))}
    </div>
  );
}

function LoadingCard() {
  return (
    <Card variant="dossier" className="overflow-hidden" aria-live="polite">
      <div
        className="aspect-[16/9] w-full animate-pulse bg-muted/60"
        aria-hidden
      />
      <CardContent className="space-y-3 p-5">
        <div
          className="h-3.5 w-2/3 animate-pulse rounded bg-muted"
          aria-hidden
        />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" aria-hidden />
        <span className="sr-only">Loading shared drop…</span>
      </CardContent>
    </Card>
  );
}

/**
 * Private shared view — RLS only returns the row when the signed-in
 * viewer's email is allowlisted (or they're the owner) and unexpired.
 */
function SharedDrop({ shareId }: { shareId: string }) {
  const { user, configured } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const signedIn = Boolean(user);
  const lookupKey = `${signedIn ? "in" : "out"}:${shareId}`;
  // One fetch per share id and auth state. Building the promise during render
  // re-suspended forever and re-requested the drop on every render.
  const [resolved, setResolved] = useState<{
    key: string;
    row: SharedRow | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSharedDrop(shareId, signedIn).then((row) => {
      if (!cancelled) setResolved({ key: lookupKey, row });
    });
    return () => {
      cancelled = true;
    };
  }, [shareId, signedIn, lookupKey, reloadKey]);

  const loading = resolved?.key !== lookupKey;
  const row = loading ? null : (resolved?.row ?? null);

  if (loading) return <LoadingCard />;

  if (!row) {
    return (
      <Card variant="dossier" className="overflow-hidden">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
          </span>
          <h2 className="font-display mt-3 text-xl font-semibold">
            {user ? "Not shared with you" : "Sign in to view"}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {user
              ? `${user.email} isn't on the allowlist for this drop, or the link has expired.`
              : "This drop may be shared privately with your email address, or the link has expired."}
          </p>
          {!user && !configured && (
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Sharing isn&apos;t configured on this deployment, so link access
              cannot be checked here yet.
            </p>
          )}
          <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {user ? (
              <Link href="/share?view=incoming" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  See what&apos;s shared with me
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="w-full sm:w-auto">
                <Button className="w-full">Sign in with Google</Button>
              </Link>
            )}
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(row.text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast({
        title: "Could not copy text",
        description: "Select the text and copy it manually.",
      });
    }
  };

  return (
    <Card variant="dossier" className="overflow-hidden">
      <Gallery images={row.imageUrls} />
      <CardContent className="p-5">
        <header className="flex items-start gap-3">
          <SenderMark email={row.ownerEmail} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {row.ownerEmail ?? "Someone"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums text-muted-foreground">
              <span>Sent {formatWhen(row.created_at)}</span>
              <span aria-hidden>·</span>
              <span>{expiryCopy(row.expiresAt)}</span>
            </div>
          </div>
          <span
            className={
              row.isPublic
                ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                : "inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            }
          >
            {row.isPublic ? (
              <Users className="h-3 w-3" aria-hidden />
            ) : (
              <Lock className="h-3 w-3" aria-hidden />
            )}
            {row.isPublic ? "Link" : "Private"}
          </span>
        </header>

        {row.text && (
          <>
            <p className="mt-4 whitespace-pre-wrap break-words text-base leading-relaxed">
              {row.text}
            </p>
            <div className="mt-4 border-t border-border/40 pt-3">
              <Button variant="secondary" size="sm" onClick={copyText}>
                {copied ? (
                  <>
                    <Check className="mr-1 h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-4 w-4" /> Copy text
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Media links are signed and short-lived. Access and expiry are set by
          the sender.
        </p>
      </CardContent>
    </Card>
  );
}

export default function SharedDropPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { loading } = useAuth();

  return (
    <PersonalShell
      icon="link"
      title="Shared drop"
      subtitle="A read-only drop. The sender controls who can open it and when it disappears."
    >
      {loading ? (
        <Card variant="dossier">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Loading shared drop…
          </CardContent>
        </Card>
      ) : (
        <SharedDrop shareId={shareId} />
      )}
    </PersonalShell>
  );
}
