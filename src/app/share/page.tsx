"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ActionMenu from "@/components/trackers/ActionMenu";
import TrackerShell from "@/components/trackers/TrackerShell";
import SharedInbox from "@/components/trackers/SharedInbox";
import Segmented from "@/components/trackers/Segmented";
import EmptyState from "@/components/trackers/EmptyState";
import Modal from "@/components/trackers/Modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { storageUsageBytes } from "@/lib/use-local-storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { SyncBadge } from "@/components/auth/AuthButton";
import { useToast } from "@/components/ui/use-toast";
import { Users, Plus, Check, X, Search, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  accessMode,
  BROWSER_STORAGE_LIMIT_BYTES,
  buildSharedDropPayload,
  CLOUD_IMAGE_LIMIT_BYTES,
  estimateDataUrlBytes,
  expiryCopy,
  isValidEmail,
  LOCAL_IMAGE_LIMIT_BYTES,
  MAX_DROPS,
  normalizeEmail,
  shareLimitState,
  storagePathFromUrl,
  type ShareAccessMode,
} from "@/lib/share-domain";

type DropTag = "Note" | "Snippet" | "Image" | "Link";

type Drop = {
  id: string;
  text: string;
  image: string | null;
  createdAt: string;
  expiresAt: string | null; // null = never
  tags?: DropTag[];
  pinned?: boolean;
  imagePath?: string | null;
};

type SharedLink = {
  id: string;
  url: string;
  expiresAt: string | null;
  emails: string[];
  isPublic: boolean;
};

const TTL_OPTIONS = [
  { id: "24h", label: "24 hours", ms: 24 * 3600 * 1000 },
  { id: "7d", label: "7 days", ms: 7 * 24 * 3600 * 1000 },
  { id: "30d", label: "30 days", ms: 30 * 24 * 3600 * 1000 },
] as const;

const DROP_TAGS: { id: DropTag; auto: (t: string) => boolean }[] = [
  { id: "Note", auto: () => false },
  { id: "Link", auto: (t) => /https?:\/\//i.test(t) },
  {
    id: "Snippet",
    auto: (t) => /[{};=>]|function |const |import |class /.test(t),
  },
];

const isAlive = (d: Drop) =>
  !d.expiresAt || new Date(d.expiresAt).getTime() > Date.now();

/** Tiny subsequence fuzzy match — returns a score, or -1 when no match. */
function fuzzyScore(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;
  let ti = 0;
  let score = 0;
  let streak = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    score += found === ti ? 2 + streak : 1; // reward consecutive hits
    streak = found === ti ? streak + 1 : 0;
    ti = found + 1;
  }
  return score;
}

/** Renders drop images regardless of whether they are inline data: URLs or
 *  Supabase storage paths. Storage paths get a short-lived signed URL so the
 *  image is visible to the owner on the private drop list. */
function DropImage({ src, className }: { src: string; className?: string }) {
  const isDirect = src.startsWith("data:") || src.startsWith("http");
  const [cloudSrc, setCloudSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isDirect) return;
    let cancelled = false;
    const sb = getSupabase();
    if (!sb) return;
    void sb.storage
      .from("drops")
      .createSignedUrl(src, 300)
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.signedUrl) {
          setCloudSrc(data.signedUrl);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src, isDirect]);

  const resolvedSrc = isDirect ? src : cloudSrc;
  if (!resolvedSrc) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt="shared drop"
      className={className}
      loading="lazy"
    />
  );
}

export default function SharePage() {
  const searchParams = useSearchParams();
  const showInbox = searchParams.get("view") === "incoming";
  const {
    value: drops,
    setValue: setDrops,
    status,
    user,
  } = useSyncedStorage<Drop[]>("share", []);
  const { value: links, setValue: setLinks } = useSyncedStorage<
    Record<string, SharedLink>
  >("share:links", {});
  const { toast } = useToast();
  const safeDrops = useMemo(() => drops ?? [], [drops]);
  const safeLinks = links ?? {};
  const [text, setText] = useState("");
  const [composerOpen, setComposerOpen] = useState(
    searchParams.get("compose") === "1",
  );
  const [pendingImg, setPendingImg] = useState<string | null>(null);
  const [ttl, setTtl] = useState<string>("7d");
  const [usage, setUsage] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareEditor, setShareEditor] = useState<string | null>(null);
  const [shareAccess, setShareAccess] = useState<ShareAccessMode>("private");
  const [emailInput, setEmailInput] = useState("");
  const [draftEmails, setDraftEmails] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<DropTag | "all">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const signedIn = Boolean(user && isSupabaseConfigured());

  // Derived during render — expired drops vanish instantly, no effect needed.
  const visible = useMemo(() => {
    const alive = safeDrops.filter(isAlive);
    const filtered = alive.filter((d) => {
      if (tagFilter !== "all" && !(d.tags ?? []).includes(tagFilter))
        return false;
      if (!query.trim()) return true;
      return (
        fuzzyScore(`${d.text} ${(d.tags ?? []).join(" ")}`, query.trim()) >= 0
      );
    });
    return filtered.sort(
      (a, b) =>
        Number(b.pinned ?? false) - Number(a.pinned ?? false) ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }, [safeDrops, query, tagFilter]);

  const imageCount = safeDrops.filter(
    (d) => (d.image || d.imagePath) && isAlive(d),
  ).length;

  const refreshUsage = () => setUsage(storageUsageBytes());

  const cleanStorageFiles = (expired: Drop[]) => {
    if (!signedIn) return;
    const paths = expired
      .map(
        (d) =>
          d.imagePath ??
          (d.image?.startsWith("http") ? storagePathFromUrl(d.image) : null),
      )
      .filter((p): p is string => Boolean(p));
    if (paths.length)
      void getSupabase()
        ?.storage.from("drops")
        .remove(paths)
        .then(() => undefined);
  };

  const purgeExpired = (list: Drop[]): Drop[] => {
    const expired = list.filter((d) => !isAlive(d));
    if (expired.length) cleanStorageFiles(expired);
    return list.filter(isAlive);
  };

  const cleanupExpiredShares = async () => {
    if (!signedIn) return;
    try {
      const sb = getSupabase();
      if (!sb) return;
      const { data: sess } = await sb.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      await sb
        .from("shared_drops")
        .delete()
        .eq("owner", uid)
        .lt("expires_at", new Date().toISOString());
    } catch {
      // best effort — RLS read policy hides expired rows regardless
    }
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const limit = signedIn ? CLOUD_IMAGE_LIMIT_BYTES : LOCAL_IMAGE_LIMIT_BYTES;
    if (f.size > limit) {
      toast({
        title: "Image too large",
        description: signedIn
          ? "Signed-in images must be 5 MB or smaller. Compress the screenshot first."
          : "Local-only images must be approximately 1.2 MB or smaller. Sign in for the 5 MB limit.",
      });
      return;
    }
    const r = new FileReader();
    r.onload = () => setPendingImg(String(r.result));
    r.readAsDataURL(f);
  };

  const uploadToStorage = async (
    dataUrl: string,
    name: string,
  ): Promise<string | null> => {
    try {
      const sb = getSupabase();
      if (!sb) return null;
      const { data: sess } = await sb.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return null;
      const blob = await (await fetch(dataUrl)).blob();
      const ext = (blob.type.split("/")[1] || "png").split("+")[0];
      const path = `${uid}/${name}.${ext}`;
      const { error } = await sb.storage
        .from("drops")
        .upload(path, blob, {
          contentType: blob.type || "image/png",
          upsert: true,
        });
      if (error) return null;
      return path;
    } catch {
      return null;
    }
  };

  const autoTags = (t: string, hasImage: boolean): DropTag[] => {
    const tags: DropTag[] = [];
    if (hasImage) tags.push("Image");
    if (!hasImage || t) {
      for (const { id, auto } of DROP_TAGS) {
        if (id !== "Image" && auto(t)) tags.push(id);
      }
    }
    return tags.length ? tags : ["Note"];
  };

  const save = async () => {
    if ((!text.trim() && !pendingImg) || saving) return;
    if (safeDrops.filter(isAlive).length >= MAX_DROPS) {
      toast({
        title: `Cap is ${MAX_DROPS} drops`,
        description:
          "Export or delete old ones first (expired drops auto-clear).",
      });
      return;
    }
    setSaving(true);
    try {
      const opt = TTL_OPTIONS.find((o) => o.id === ttl) ?? TTL_OPTIONS[1];
      const expiresAt = new Date(Date.now() + opt.ms).toISOString();
      const base = purgeExpired(safeDrops);
      const tags = autoTags(text.trim(), Boolean(pendingImg));
      let next: Drop[];
      if (pendingImg?.startsWith("data:")) {
        if (signedIn) {
          const id = `${Date.now()}`;
          const url = await uploadToStorage(pendingImg, id);
          next = [
            {
              id,
              text: text.trim(),
              image: url ?? pendingImg,
              createdAt: new Date().toISOString(),
              expiresAt,
              tags,
            },
            ...base,
          ];
          if (!url)
            toast({
              title: "Image upload failed",
              description: "Saved inline instead (heavier sync).",
            });
        } else {
          const bytes = estimateDataUrlBytes(pendingImg);
          if (bytes > LOCAL_IMAGE_LIMIT_BYTES) {
            toast({
              title: "Image too large for local mode",
              description:
                "Sign in with Google to save images over ~1.2MB, or compress first.",
            });
            return;
          }
          next = [
            {
              id: `${Date.now()}`,
              text: text.trim(),
              image: pendingImg,
              createdAt: new Date().toISOString(),
              expiresAt,
              tags,
            },
            ...base,
          ];
        }
      } else {
        next = [
          {
            id: `${Date.now()}`,
            text: text.trim(),
            image: pendingImg,
            createdAt: new Date().toISOString(),
            expiresAt,
            tags,
          },
          ...base,
        ];
      }
      setDrops(next);
      setText("");
      setPendingImg(null);
      setComposerOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      refreshUsage();
      void cleanupExpiredShares();
    } finally {
      setSaving(false);
    }
  };

  const remove = (d: Drop) => {
    setDrops(purgeExpired(safeDrops).filter((x) => x.id !== d.id));
    if (signedIn) {
      const path =
        d.imagePath ??
        (d.image?.startsWith("http") ? storagePathFromUrl(d.image) : null);
      if (path)
        void getSupabase()
          ?.storage.from("drops")
          .remove([path])
          .then(() => undefined);
    }
    if (safeLinks[d.id]) void revokeLink(d, true);
    refreshUsage();
    void cleanupExpiredShares();
  };

  const togglePin = (d: Drop) => {
    setDrops(
      safeDrops.map((x) => (x.id === d.id ? { ...x, pinned: !x.pinned } : x)),
    );
  };

  // --- allowlist sharing (private: only listed emails can view) ---

  const openEditor = (d: Drop) => {
    setShareEditor(d.id);
    const link = safeLinks[d.id];
    setShareAccess(link ? accessMode({ is_public: link.isPublic }) : "private");
    setDraftEmails(link?.emails ?? []);
    setEmailInput("");
  };

  const addEmail = (d: Drop) => {
    const email = normalizeEmail(emailInput);
    if (!isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Enter a valid email address.",
      });
      return;
    }
    if (draftEmails.includes(email)) {
      setEmailInput("");
      return;
    }
    const next = [...draftEmails, email];
    setDraftEmails(next);
    setEmailInput("");
    void d;
  };

  const removeEmail = (d: Drop, email: string) => {
    const next = draftEmails.filter((e) => e !== email);
    setDraftEmails(next);
    void d;
  };

  const createLink = async (d: Drop) => {
    if (!signedIn) {
      toast({
        title: "Sign in to share",
        description: "Links are allowlisted to emails you pick.",
      });
      return;
    }
    if (shareAccess === "private" && draftEmails.length === 0) {
      toast({
        title: "No viewers added",
        description: "Add at least one email to share with.",
      });
      return;
    }
    setSharingId(d.id);
    try {
      const sb = getSupabase();
      if (!sb) return;
      let imagePath =
        d.imagePath ??
        (d.image?.startsWith("http") ? storagePathFromUrl(d.image) : null);
      if (d.image?.startsWith("data:")) {
        imagePath = await uploadToStorage(d.image, `shared-${d.id}`);
        if (imagePath)
          setDrops(
            safeDrops.map((x) =>
              x.id === d.id ? { ...x, image: null, imagePath } : x,
            ),
          );
        if (!imagePath) {
          toast({
            title: "Could not secure image",
            description:
              "The private Storage upload failed, so no share link was created.",
          });
          return;
        }
      }
      const { data: sess } = await sb.auth.getSession();
      const owner = sess.session?.user?.id;
      if (!owner) {
        toast({
          title: "Session expired",
          description: "Sign in again before creating a share link.",
        });
        return;
      }
      const { data, error } = await sb
        .from("shared_drops")
        .upsert(
          buildSharedDropPayload({
            id: safeLinks[d.id]?.id,
            owner,
            text: d.text ?? "",
            imagePath,
            access: shareAccess,
            expiresAt: d.expiresAt,
            createdFromDrop: d.id,
            ownerEmail: sess.session?.user?.email ?? null,
            allowedEmails: draftEmails,
          }),
        )
        .select("id")
        .single();
      if (error || !data) {
        toast({
          title: "Could not save share settings",
          description:
            "Your drop and viewer changes are still here. Check your connection and try again.",
        });
        return;
      }
      const url = `${window.location.origin}/share/${data.id}`;
      setLinks({
        ...safeLinks,
        [d.id]: {
          id: data.id,
          url,
          expiresAt: d.expiresAt,
          emails: draftEmails,
          isPublic: shareAccess === "public",
        },
      });
      let copied = false;
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        // The saved link remains selectable in the editor.
      }
      toast({
        title: safeLinks[d.id]
          ? "Share settings updated"
          : "Share link created",
        description: copied
          ? "Link copied. Viewers must meet this site's sign-in requirements and the access settings you selected."
          : "Settings saved, but the clipboard is unavailable. Select the share link below to copy it manually.",
      });
    } finally {
      setSharingId(null);
    }
  };

  const copyLink = async (d: Drop) => {
    const link = safeLinks[d.id];
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(`link-${d.id}`);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      toast({
        title: "Could not copy link",
        description:
          "Select the share link in the editor and copy it manually.",
      });
    }
  };

  const revokeLink = async (d: Drop, silent = false) => {
    const link = safeLinks[d.id];
    if (!link) return;
    try {
      await getSupabase()?.from("shared_drops").delete().eq("id", link.id);
    } catch {
      /* best effort */
    }
    const next = { ...safeLinks };
    delete next[d.id];
    setLinks(next);
    if (shareEditor === d.id) setDraftEmails([]);
    if (!silent)
      toast({
        title: "Share link revoked",
        description: "Allowlisted viewers lose access.",
      });
  };

  const copyText = async (d: Drop) => {
    try {
      await navigator.clipboard.writeText(d.text || "");
      setCopiedId(d.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      toast({
        title: "Could not copy text",
        description:
          "Select the note text and copy it manually, or enable clipboard access and try again.",
      });
    }
  };

  const exportAll = () => {
    const blob = new Blob(
      [JSON.stringify(safeDrops.filter(isAlive), null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vk-share-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  useEffect(() => {
    refreshUsage();
    const expired = safeDrops.filter((drop) => !isAlive(drop));
    if (expired.length > 0) {
      setDrops(safeDrops.filter(isAlive));
      cleanStorageFiles(expired);
    }
    void cleanupExpiredShares();
    // The external store owns the data lifecycle; this is an opportunistic
    // page-entry cleanup and should not run for every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const activeDropCount = safeDrops.filter(isAlive).length;
  const pendingImageBytes = pendingImg?.startsWith("data:")
    ? estimateDataUrlBytes(pendingImg)
    : 0;
  const limits = shareLimitState(activeDropCount, pendingImageBytes);
  const kb = Math.min(usage, BROWSER_STORAGE_LIMIT_BYTES) / 1024;

  return (
    <TrackerShell icon="share" title={null} subtitle={null}>
      <header
        data-editorial-chapter="true"
        className="flex items-center justify-between gap-3"
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Sharing
        </h1>
        <div className="flex items-center gap-3">
          <SyncBadge status={status} />
          {showInbox ? (
            <Button asChild>
              <Link href="/share?compose=1">New drop</Link>
            </Button>
          ) : (
            <Button onClick={() => setComposerOpen(true)}>New drop</Button>
          )}
        </div>
      </header>
      <nav
        aria-label="Sharing views"
        data-testid="sharing-view-switcher"
        className="workspace-views flex gap-6"
      >
        <Link
          href="/share"
          aria-current={!showInbox ? "page" : undefined}
          className="transition-colors"
        >
          My drops
        </Link>
        <Link
          href="/share?view=incoming"
          aria-current={showInbox ? "page" : undefined}
          className="transition-colors"
        >
          Inbox
        </Link>
      </nav>
      {showInbox ? (
        <SharedInbox userId={user?.id ?? null} />
      ) : (
        <div className="sharing-workspace">
          {/* ── Search + tag filter ── */}
          <section
            id="sent-drops"
            className="sharing-saved min-w-0 space-y-3"
            aria-labelledby="saved-drops-title"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="saved-drops-title" className="sr-only">
                Saved drops
              </h2>
              {activeDropCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {activeDropCount} {activeDropCount === 1 ? "drop" : "drops"}
                </span>
              )}
            </div>
            {activeDropCount > 0 && (
              <>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      aria-label="Search drops"
                      placeholder="Search drops"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Filter drops by type"
                    className="min-h-11 max-w-28 rounded-xl border border-input bg-background px-2 text-sm"
                    value={tagFilter}
                    onChange={(event) =>
                      setTagFilter(event.target.value as DropTag | "all")
                    }
                  >
                    <option value="all">All types</option>
                    <option value="Note">Notes</option>
                    <option value="Snippet">Snippets</option>
                    <option value="Image">Images</option>
                    <option value="Link">Links</option>
                  </select>
                </div>
              </>
            )}
            {/* ── Drops grid ── */}
            {visible.length === 0 ? (
              <EmptyState
                icon={Search}
                title={
                  query || tagFilter !== "all"
                    ? "No drops match"
                    : "No drops yet"
                }
                hint={
                  query || tagFilter !== "all"
                    ? "Try a different search or clear the filter."
                    : "Create a drop to save a note, link or image."
                }
              />
            ) : (
              <div className="space-y-3">
                {visible.map((d) => (
                  <Card
                    variant="dossier"
                    key={d.id}
                    className={cn(
                      "overflow-hidden",
                      d.pinned && "border-primary/40",
                    )}
                  >
                    {d.image && (
                      <DropImage
                        src={d.image}
                        className="max-h-56 w-full object-cover"
                      />
                    )}
                    <CardContent className="p-4">
                      {d.text &&
                        (d.text.length > 300 ? (
                          <details>
                            <summary className="min-h-11 cursor-pointer break-words [overflow-wrap:anywhere] text-sm">
                              {d.text.slice(0, 180)}…
                            </summary>
                            <p className="mt-3 whitespace-pre-wrap break-words text-base leading-relaxed">
                              {d.text}
                            </p>
                          </details>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                            {d.text}
                          </p>
                        ))}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                        <span>
                          {d.createdAt.slice(0, 16).replace("T", " ")}
                        </span>
                        <span>· {expiryCopy(d.expiresAt)}</span>
                        <span>· {safeLinks[d.id] ? "Shared" : "Private"}</span>
                        {(d.tags ?? []).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                        {safeLinks[d.id] && (
                          <span className="inline-flex items-center gap-1">
                            · <Users className="h-3 w-3" />{" "}
                            {safeLinks[d.id].isPublic
                              ? "link access"
                              : safeLinks[d.id].emails.length}
                          </span>
                        )}
                      </div>
                      <ActionMenu label="Shared item actions">
                        {" "}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(d)}
                          aria-label={d.pinned ? "Unpin" : "Pin"}
                        >
                          {d.pinned ? (
                            <PinOff className="h-4 w-4 text-primary" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        {d.text && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyText(d)}
                          >
                            {copiedId === d.id ? (
                              <>
                                <Check className="mr-1 h-4 w-4" /> Copied
                              </>
                            ) : (
                              "Copy text"
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditor(d)}
                        >
                          {safeLinks[d.id] ? (
                            <>
                              <Check className="mr-1 h-4 w-4" /> Manage access
                            </>
                          ) : (
                            "Share"
                          )}
                        </Button>
                        {d.image?.startsWith("data:") && (
                          <a
                            href={d.image}
                            download={`drop-${d.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center rounded-xl border border-input px-3 text-sm transition-colors hover:bg-accent"
                          >
                            Open
                          </a>
                        )}
                        <button
                          onClick={() => remove(d)}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Delete drop"
                        >
                          Delete
                        </button>
                      </ActionMenu>

                      <Modal
                        open={shareEditor === d.id}
                        onClose={() => setShareEditor(null)}
                        title="Who can view this drop?"
                        className="sharing-access-dialog sm:max-w-lg"
                      >
                        <div className="space-y-4">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Viewers on personal.buildora.work must use an
                            approved Google account.
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-2.5 text-sm">
                              <input
                                type="radio"
                                name={`share-access-${d.id}`}
                                value="private"
                                checked={shareAccess === "private"}
                                onChange={() => setShareAccess("private")}
                                className="mt-0.5 accent-primary"
                              />
                              <span>
                                <strong>Specific people</strong>
                                <span className="mt-1 block text-sm text-muted-foreground">
                                  Only the emails you add.
                                </span>
                              </span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-2.5 text-sm">
                              <input
                                type="radio"
                                name={`share-access-${d.id}`}
                                value="public"
                                checked={shareAccess === "public"}
                                onChange={() => setShareAccess("public")}
                                className="mt-0.5 accent-primary"
                              />
                              <span>
                                <strong>Link access</strong>
                                <span className="mt-1 block text-sm text-muted-foreground">
                                  Both approved accounts can open the link.
                                </span>
                              </span>
                            </label>
                          </div>
                          {shareAccess === "private" &&
                          draftEmails.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {draftEmails.map((e) => (
                                <span
                                  key={e}
                                  className="inline-flex max-w-full items-center rounded-lg bg-muted pl-3 text-sm"
                                >
                                  <span className="min-w-0 break-all">{e}</span>
                                  <button
                                    onClick={() => removeEmail(d, e)}
                                    aria-label={`Remove ${e}`}
                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : shareAccess === "private" ? (
                            <p className="text-xs text-muted-foreground">
                              No viewers yet — add emails below.
                            </p>
                          ) : null}
                          {shareAccess === "private" ? (
                            <div className="flex min-w-0 gap-2">
                              <Input
                                type="email"
                                aria-label="Viewer email"
                                className="min-w-0 flex-1"
                                placeholder="friend@gmail.com"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") addEmail(d);
                                }}
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => addEmail(d)}
                              >
                                Add
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              The link stops working when this drop expires.
                            </p>
                          )}
                          {safeLinks[d.id] && (
                            <label className="block space-y-2 text-sm text-muted-foreground">
                              <span>Share link</span>
                              <Input
                                readOnly
                                value={safeLinks[d.id].url}
                                onFocus={(event) =>
                                  event.currentTarget.select()
                                }
                                onClick={(event) =>
                                  event.currentTarget.select()
                                }
                              />
                            </label>
                          )}
                          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                            <Button
                              size="sm"
                              onClick={() => createLink(d)}
                              disabled={sharingId === d.id || !signedIn}
                            >
                              {sharingId === d.id
                                ? "Saving…"
                                : safeLinks[d.id]
                                  ? "Save share settings"
                                  : "Confirm & create link"}
                            </Button>
                            {safeLinks[d.id] && (
                              <>
                                <span className="order-last w-full text-sm text-muted-foreground">
                                  {safeLinks[d.id].isPublic
                                    ? "Link access"
                                    : "Private allowlist"}{" "}
                                  · {expiryCopy(d.expiresAt)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => copyLink(d)}
                                >
                                  {copiedId === `link-${d.id}` ? (
                                    <>
                                      <Check className="mr-1 h-4 w-4" /> Link
                                      copied
                                    </>
                                  ) : (
                                    "Copy link"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => revokeLink(d)}
                                >
                                  Revoke
                                </Button>
                              </>
                            )}
                          </div>
                          {!signedIn && (
                            <p className="text-sm text-muted-foreground">
                              Sign in with Google to save these permissions.
                            </p>
                          )}
                        </div>
                      </Modal>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Modal
            open={composerOpen}
            title="New drop"
            onClose={() => {
              if (
                (text.trim() || pendingImg) &&
                !window.confirm("Discard the unsaved drop?")
              )
                return;
              setComposerOpen(false);
              setText("");
              setPendingImg(null);
            }}
          >
            {/* ── Composer ── */}
            <Card
              variant="dossier"
              id="share-editor"
              className="sharing-composer"
            >
              <CardContent className="space-y-4 p-4 sm:p-5">
                <label htmlFor="drop-content" className="sr-only">
                  Drop content
                </label>
                <textarea
                  id="drop-content"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a note or paste a link…"
                  rows={3}
                  className="block min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                {pendingImg && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pendingImg}
                    alt="pending upload"
                    className="max-h-48 rounded-lg border border-border/60 object-contain"
                  />
                )}
                <div className="space-y-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                  <fieldset
                    aria-label="Auto-clear this drop"
                    className="space-y-1.5"
                  >
                    <legend className="sr-only">Auto-clear this drop</legend>
                    <span className="text-sm text-muted-foreground">
                      Auto-clear after
                    </span>
                    <Segmented
                      label="Drop expiry"
                      variant="soft"
                      options={TTL_OPTIONS.map((o) => ({
                        value: o.id,
                        label: o.label,
                      }))}
                      value={ttl}
                      onChange={setTtl}
                    />
                  </fieldset>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        pendingImg
                          ? setPendingImg(null)
                          : fileRef.current?.click()
                      }
                    >
                      {pendingImg ? (
                        "Remove image"
                      ) : (
                        <>
                          <Plus className="mr-1 h-4 w-4" /> Add image
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      data-editorial-action
                      onClick={save}
                      disabled={
                        (!text.trim() && !pendingImg) ||
                        saving ||
                        limits.dropCapReached ||
                        limits.imageCapReached
                      }
                    >
                      {saving ? "Saving…" : "Save drop"}
                    </Button>
                  </div>
                </div>
                {limits.dropCapReached && (
                  <p className="text-sm font-medium text-destructive">
                    Drop cap reached. Export or delete an active drop before
                    adding another.
                  </p>
                )}
                {limits.imageCapReached && (
                  <p className="text-sm font-medium text-destructive">
                    This image exceeds the active image limit. Choose a smaller
                    file.
                  </p>
                )}
              </CardContent>
            </Card>
          </Modal>

          {/* ── Storage limits ── */}
          {activeDropCount > 0 && (
            <details className="sharing-limits border-t border-border pt-2">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Storage limits <span aria-hidden="true">+</span>
                </span>
                <span className="tabular-nums">
                  {kb.toFixed(1)} KB used · {imageCount} images
                </span>
              </summary>
              <div className="pb-3">
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Drops:</strong>{" "}
                    {MAX_DROPS} active drops maximum. Expired drops clear from
                    this list automatically.
                  </li>
                  <li>
                    <strong className="text-foreground">Images:</strong> 5 MB
                    per signed-in image, or approximately 1.2 MB per local-only
                    image.
                  </li>
                  <li>
                    <strong className="text-foreground">Browser:</strong>{" "}
                    approximately{" "}
                    {(BROWSER_STORAGE_LIMIT_BYTES / 1000).toLocaleString()} KB
                    display capacity. Export before making large changes.
                  </li>
                  <li>
                    <strong className="text-foreground">Sharing:</strong>{" "}
                    specific people must match signed-in emails; link access
                    adds no email allowlist. Both follow the site&apos;s sign-in
                    requirements.{" "}
                    <Link
                      href="/share?view=incoming"
                      className="text-primary hover:underline"
                    >
                      Inbox
                    </Link>{" "}
                    shows incoming private drops.
                  </li>
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={exportAll}
                  disabled={activeDropCount === 0}
                >
                  Export JSON backup
                </Button>
              </div>
            </details>
          )}
        </div>
      )}
    </TrackerShell>
  );
}
