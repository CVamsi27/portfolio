"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Segmented from "@/components/trackers/Segmented";
import EmptyState from "@/components/trackers/EmptyState";
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
import ChapterLabel from "@/components/editorial/ChapterLabel";
import TelemetryLine from "@/components/editorial/TelemetryLine";
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
  { id: "Snippet", auto: (t) => /[{};=>]|function |const |import |class /.test(t) },
];

const isAlive = (d: Drop) => !d.expiresAt || new Date(d.expiresAt).getTime() > Date.now();

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

export default function SharePage() {
  const { value: drops, setValue: setDrops, status, user } = useSyncedStorage<Drop[]>("share", []);
  const { value: links, setValue: setLinks } = useSyncedStorage<Record<string, SharedLink>>("share:links", {});
  const { toast } = useToast();
  const safeDrops = useMemo(() => drops ?? [], [drops]);
  const safeLinks = links ?? {};
  const [text, setText] = useState("");
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
      if (tagFilter !== "all" && !(d.tags ?? []).includes(tagFilter)) return false;
      if (!query.trim()) return true;
      return fuzzyScore(`${d.text} ${(d.tags ?? []).join(" ")}`, query.trim()) >= 0;
    });
    return filtered.sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.createdAt.localeCompare(a.createdAt));
  }, [safeDrops, query, tagFilter]);

  const imageCount = safeDrops.filter((d) => (d.image || d.imagePath) && isAlive(d)).length;

  const refreshUsage = () => setUsage(storageUsageBytes());

  const cleanStorageFiles = (expired: Drop[]) => {
    if (!signedIn) return;
    const paths = expired
      .map((d) => d.imagePath ?? (d.image?.startsWith("http") ? storagePathFromUrl(d.image) : null))
      .filter((p): p is string => Boolean(p));
    if (paths.length) void getSupabase()?.storage.from("drops").remove(paths).then(() => undefined);
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

  const uploadToStorage = async (dataUrl: string, name: string): Promise<string | null> => {
    try {
      const sb = getSupabase();
      if (!sb) return null;
      const { data: sess } = await sb.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return null;
      const blob = await (await fetch(dataUrl)).blob();
      const ext = (blob.type.split("/")[1] || "png").split("+")[0];
      const path = `${uid}/${name}.${ext}`;
      const { error } = await sb
        .storage.from("drops")
        .upload(path, blob, { contentType: blob.type || "image/png", upsert: true });
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
      toast({ title: `Cap is ${MAX_DROPS} drops`, description: "Export or delete old ones first (expired drops auto-clear)." });
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
            { id, text: text.trim(), image: url ?? pendingImg, createdAt: new Date().toISOString(), expiresAt, tags },
            ...base,
          ];
          if (!url) toast({ title: "Image upload failed", description: "Saved inline instead (heavier sync)." });
        } else {
          const bytes = estimateDataUrlBytes(pendingImg);
          if (bytes > LOCAL_IMAGE_LIMIT_BYTES) {
            toast({ title: "Image too large for local mode", description: "Sign in with Google to save images over ~1.2MB, or compress first." });
            return;
          }
          next = [
            { id: `${Date.now()}`, text: text.trim(), image: pendingImg, createdAt: new Date().toISOString(), expiresAt, tags },
            ...base,
          ];
        }
      } else {
        next = [
          { id: `${Date.now()}`, text: text.trim(), image: pendingImg, createdAt: new Date().toISOString(), expiresAt, tags },
          ...base,
        ];
      }
      setDrops(next);
      setText("");
      setPendingImg(null);
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
      const path = d.imagePath ?? (d.image?.startsWith("http") ? storagePathFromUrl(d.image) : null);
      if (path) void getSupabase()?.storage.from("drops").remove([path]).then(() => undefined);
    }
    if (safeLinks[d.id]) void revokeLink(d, true);
    refreshUsage();
    void cleanupExpiredShares();
  };

  const togglePin = (d: Drop) => {
    setDrops(safeDrops.map((x) => (x.id === d.id ? { ...x, pinned: !x.pinned } : x)));
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
      toast({ title: "Invalid email", description: "Enter a valid email address." });
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
      toast({ title: "Sign in to share", description: "Links are allowlisted to emails you pick." });
      return;
    }
    if (shareAccess === "private" && draftEmails.length === 0) {
      toast({ title: "No viewers added", description: "Add at least one email to share with." });
      return;
    }
    setSharingId(d.id);
    try {
      const sb = getSupabase();
      if (!sb) return;
      let imagePath = d.imagePath ?? (d.image?.startsWith("http") ? storagePathFromUrl(d.image) : null);
      if (d.image?.startsWith("data:")) {
        imagePath = await uploadToStorage(d.image, `shared-${d.id}`);
        if (imagePath) setDrops(safeDrops.map((x) => (x.id === d.id ? { ...x, image: null, imagePath } : x)));
        if (!imagePath) {
          toast({ title: "Could not secure image", description: "The private Storage upload failed, so no share link was created." });
          return;
        }
      }
      const { data: sess } = await sb.auth.getSession();
      const owner = sess.session?.user?.id;
      if (!owner) {
        toast({ title: "Session expired", description: "Sign in again before creating a share link." });
        return;
      }
      const { data, error } = await sb
        .from("shared_drops")
        .upsert(buildSharedDropPayload({
          id: safeLinks[d.id]?.id,
          owner,
          text: d.text ?? "",
          imagePath,
          access: shareAccess,
          expiresAt: d.expiresAt,
          createdFromDrop: d.id,
          ownerEmail: sess.session?.user?.email ?? null,
          allowedEmails: draftEmails,
        }))
        .select("id")
        .single();
      if (error || !data) {
        toast({ title: "Could not create link", description: "Run Supabase migrations 0001 through 0005, then try again." });
        return;
      }
      const url = `${window.location.origin}/share/${data.id}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* clipboard unavailable */
      }
      setLinks({
        ...safeLinks,
        [d.id]: { id: data.id, url, expiresAt: d.expiresAt, emails: draftEmails, isPublic: shareAccess === "public" },
      });
      toast({
        title: safeLinks[d.id] ? "Share settings updated" : "Share link created",
        description: shareAccess === "public" ? "Copied to clipboard — anyone with the link can view it until it expires." : "Copied to clipboard — only matching signed-in emails can view it.",
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
      /* clipboard unavailable */
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
    if (!silent) toast({ title: "Share link revoked", description: "Allowlisted viewers lose access." });
  };

  const copyText = async (d: Drop) => {
    try {
      await navigator.clipboard.writeText(d.text || "");
      setCopiedId(d.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(safeDrops.filter(isAlive), null, 2)], { type: "application/json" });
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
  const pendingImageBytes = pendingImg?.startsWith("data:") ? estimateDataUrlBytes(pendingImg) : 0;
  const limits = shareLimitState(activeDropCount, pendingImageBytes);
  const kb = Math.min(usage, BROWSER_STORAGE_LIMIT_BYTES) / 1024;
  const selectedTtl = TTL_OPTIONS.find((option) => option.id === ttl) ?? TTL_OPTIONS[1];
  const selectedExpiry = new Date(Date.now() + selectedTtl.ms);

  return (
    <TrackerShell
      icon="share"
      title="Share"
      subtitle="A timed drop archive with explicit access controls, private media, and automatic cleanup."
      badge={<SyncBadge status={status} />}
      actions={{
        primary: <a href="#share-editor" className="inline-flex min-h-10 items-center border border-[#C8FF3D] bg-[#C8FF3D] px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[#071014]">Create share</a>,
        secondary: <a href="#sent-drops" className="text-xs font-semibold text-primary hover:underline">View sent drops →</a>,
      }}
    >
      {/* ── Composer ── */}
      <Card variant="dossier" id="share-editor" data-editorial-action className="editorial-dispatch-composer">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-end justify-between gap-4">
            <ChapterLabel eyebrow="Dispatch studio // compose" status={signedIn ? "sync ready" : "local mode"} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">01 / 03</span>
          </div>
          <TelemetryLine
            items={[
              { label: "Drops", value: `${activeDropCount}/${MAX_DROPS}` },
              { label: "Images", value: imageCount },
              { label: "Expiry", value: selectedTtl.label },
            ]}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text, a link, a code snippet, a win..."
            rows={3}
            className="min-h-[80px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          {pendingImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pendingImg} alt="pending upload" className="max-h-48 rounded-lg border border-border/60 object-contain" />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Plus className="mr-1 h-4 w-4" /> Add image
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <fieldset aria-label="Auto-clear this drop" className="flex min-w-0 flex-wrap items-center gap-2">
              <legend className="sr-only">Auto-clear this drop</legend>
              <span className="text-xs text-muted-foreground">Auto-clear this drop</span>
              <Segmented
                label="Drop expiry"
                variant="soft"
                options={TTL_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
                value={ttl}
                onChange={setTtl}
              />
              <span className="text-xs text-muted-foreground">
                {expiryCopy(selectedExpiry.toISOString())} · clears {selectedExpiry.toLocaleString()}
              </span>
            </fieldset>
            {pendingImg && (
              <Button variant="ghost" size="sm" onClick={() => setPendingImg(null)}>
                Remove image
              </Button>
            )}
            <span className="flex-1" />
            <Button size="sm" onClick={save} disabled={(!text.trim() && !pendingImg) || saving || limits.dropCapReached || limits.imageCapReached}>
              {saving ? "Uploading…" : "Drop it"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeDropCount}/{MAX_DROPS} drops · {limits.dropsLeft} drops left · {imageCount} images ·{" "}
            {signedIn
              ? "signed-in images use private Storage (5 MB max)."
              : "local-only images are capped at approximately 1.2 MB; sharing needs sign-in."}{" "}
            Browser: {kb.toFixed(1)} KB / {(BROWSER_STORAGE_LIMIT_BYTES / 1000).toLocaleString()} KB.
          </p>
          {limits.dropCapReached && <p className="text-sm font-medium text-destructive">Drop cap reached. Export or delete an active drop before adding another.</p>}
          {limits.imageCapReached && <p className="text-sm font-medium text-destructive">This image exceeds the active image limit. Choose a smaller file.</p>}
        </CardContent>
      </Card>

      {/* ── Search + tag filter ── */}
      <Card variant="dossier" id="sent-drops">
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search drops (fuzzy) — try 'snip' or a URL fragment"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Segmented
            label="Tag filter"
            variant="soft"
            options={[
              { value: "all" as const, label: "All" },
              { value: "Note" as const, label: "Notes" },
              { value: "Snippet" as const, label: "Snippets" },
              { value: "Image" as const, label: "Images" },
              { value: "Link" as const, label: "Links" },
            ]}
            value={tagFilter}
            onChange={setTagFilter}
          />
        </CardContent>
      </Card>

      {/* ── Drops grid ── */}
      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title={query || tagFilter !== "all" ? "No drops match" : "No drops yet"}
          hint={
            query || tagFilter !== "all"
              ? "Try a different search or clear the filter."
              : "Your quick captures land here newest-first, and vanish when their timer runs out."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((d) => (
            <Card variant="dossier" key={d.id} className={cn("group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg", d.pinned && "border-primary/40")}>
              {d.image?.startsWith("data:") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image} alt="shared drop" className="max-h-56 w-full object-cover" loading="lazy" />
              )}
              <CardContent className="p-4">
                {d.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{d.text}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
                  <span>{d.createdAt.slice(0, 16).replace("T", " ")}</span>
                  <span>· {expiryCopy(d.expiresAt)}</span>
                  {(d.tags ?? []).map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {t}
                    </span>
                  ))}
                  {safeLinks[d.id] && (
                    <span className="inline-flex items-center gap-1">
                      · <Users className="h-3 w-3" /> {safeLinks[d.id].isPublic ? "public" : safeLinks[d.id].emails.length}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => togglePin(d)} aria-label={d.pinned ? "Unpin" : "Pin"}>
                    {d.pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  {d.text && (
                    <Button variant="outline" size="sm" onClick={() => copyText(d)}>
                      {copiedId === d.id ? <><Check className="mr-1 h-4 w-4" /> Copied</> : "Copy text"}
                    </Button>
                  )}
                  {shareEditor === d.id ? (
                    <Button variant="ghost" size="sm" onClick={() => setShareEditor(null)}>
                      Close
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => openEditor(d)}>
                      {safeLinks[d.id] ? <><Check className="mr-1 h-4 w-4" /> Sharing</> : "Share"}
                    </Button>
                  )}
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
                  <span className="flex-1" />
                  <button
                    onClick={() => remove(d)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Delete drop"
                  >
                    Delete
                  </button>
                </div>

                {shareEditor === d.id && (
                  <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <h3 className="text-sm font-semibold">Who can view this drop?</h3>
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
                        <span><strong>Specific people</strong><span className="block text-xs text-muted-foreground">Only matching signed-in emails.</span></span>
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
                        <span><strong>Anyone with the link</strong><span className="block text-xs text-muted-foreground">Signed-out visitors can view it until expiry.</span></span>
                      </label>
                    </div>
                    {shareAccess === "private" && draftEmails.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {draftEmails.map((e) => (
                          <span key={e} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                            {e}
                            <button onClick={() => removeEmail(d, e)} aria-label={`Remove ${e}`} className="text-muted-foreground transition-colors hover:text-foreground">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : shareAccess === "private" ? (
                      <p className="text-xs text-muted-foreground">No viewers yet — add emails below.</p>
                    ) : null}
                    {shareAccess === "private" ? (
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="friend@gmail.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addEmail(d);
                          }}
                        />
                        <Button size="sm" variant="secondary" onClick={() => addEmail(d)}>
                          Add
                        </Button>
                      </div>
                    ) : (
                      <p className="rounded-lg bg-primary/10 p-2 text-xs text-muted-foreground">Public mode is an explicit opt-in: anyone who receives this link can read the drop before it auto-clears.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {!safeLinks[d.id] ? (
                        <Button size="sm" onClick={() => createLink(d)} disabled={sharingId === d.id || !signedIn}>
                          {sharingId === d.id ? "Creating…" : "Confirm & create link"}
                        </Button>
                      ) : (
                        <>
                          <span className="self-center text-xs text-muted-foreground">
                            {safeLinks[d.id].isPublic ? "Public access" : "Private allowlist"} · {expiryCopy(d.expiresAt)}
                          </span>
                          <Button size="sm" variant="secondary" onClick={() => copyLink(d)}>
                            {copiedId === `link-${d.id}` ? <><Check className="mr-1 h-4 w-4" /> Link copied</> : "Copy link"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => revokeLink(d)}>
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                    {!signedIn && <p className="text-xs text-muted-foreground">Sign in with Google to create or update share links.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Storage limits ── */}
      <Card variant="dossier">
        <CardContent className="p-5">
          <h2 className="font-display font-bold">Storage limits</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Drops:</strong> {MAX_DROPS} active drops maximum. Expired drops clear from this list automatically.</li>
            <li><strong className="text-foreground">Images:</strong> 5 MB per signed-in image, or approximately 1.2 MB per local-only image.</li>
            <li><strong className="text-foreground">Browser:</strong> approximately {(BROWSER_STORAGE_LIMIT_BYTES / 1000).toLocaleString()} KB display capacity. Export before making large changes.</li>
            <li><strong className="text-foreground">Sharing:</strong> private allowlists match signed-in emails; public mode is an explicit link-access choice. <a href="/shared-with-me" className="text-primary hover:underline">Shared with me</a> shows incoming private drops.</li>
          </ul>
          <Button variant="secondary" size="sm" className="mt-3" onClick={exportAll} disabled={visible.length === 0}>
            Export JSON backup
          </Button>
        </CardContent>
      </Card>
    </TrackerShell>
  );
}
