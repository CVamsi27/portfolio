"use client";

import { useRef, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Segmented from "@/components/trackers/Segmented";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { storageUsageBytes } from "@/lib/use-local-storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { SyncBadge } from "@/components/auth/AuthButton";
import { Users, Plus, Check, X } from "lucide-react";

type Drop = {
  id: string;
  text: string;
  image: string | null;
  createdAt: string;
  expiresAt: string | null; // null = never
};

type SharedLink = { id: string; url: string; expiresAt: string | null; emails: string[] };

const LOCAL_IMG_LIMIT = 1_200_000; // ~1.2 MB binary for base64/localStorage path
const CLOUD_IMG_LIMIT = 5_000_000;
const MAX_DROPS = 50;

const TTL_OPTIONS = [
  { id: "24h", label: "24 hours", ms: 24 * 3600 * 1000 },
  { id: "7d", label: "7 days", ms: 7 * 24 * 3600 * 1000 },
  { id: "30d", label: "30 days", ms: 30 * 24 * 3600 * 1000 },
] as const;

const isAlive = (d: Drop) => !d.expiresAt || new Date(d.expiresAt).getTime() > Date.now();

function expiryLabel(iso: string | null | undefined): string {
  if (!iso) return "never expires";
  const left = new Date(iso).getTime() - Date.now();
  if (left <= 0) return "expired";
  const h = Math.floor(left / 3600000);
  if (h < 1) return "expires in <1h";
  if (h < 24) return `expires in ${h}h`;
  return `expires in ${Math.floor(h / 24)}d`;
}

function storagePathFromUrl(url: string): string | null {
  const marker = "/drops/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length).split("?")[0];
}

const validEmail = (s: string) => /.+@.+\..+/.test(s.trim());

export default function SharePage() {
  const { value: drops, setValue: setDrops, status, user } = useSyncedStorage<Drop[]>("share", []);
  const { value: links, setValue: setLinks } = useSyncedStorage<Record<string, SharedLink>>("share:links", {});
  const safeDrops = drops ?? [];
  const safeLinks = links ?? {};
  const [text, setText] = useState("");
  const [pendingImg, setPendingImg] = useState<string | null>(null);
  const [ttl, setTtl] = useState<string>("7d");
  const [usage, setUsage] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareEditor, setShareEditor] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [draftEmails, setDraftEmails] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const signedIn = Boolean(user && isSupabaseConfigured());

  // Derived during render — expired drops vanish instantly, no effect needed.
  const visible = safeDrops.filter(isAlive);
  const imageCount = visible.filter((d) => d.image).length;

  const refreshUsage = () => setUsage(storageUsageBytes());

  const cleanStorageFiles = (expired: Drop[]) => {
    if (!signedIn) return;
    const paths = expired
      .map((d) => (d.image?.startsWith("http") ? storagePathFromUrl(d.image) : null))
      .filter((p): p is string => Boolean(p));
    if (paths.length) void getSupabase()?.storage.from("drops").remove(paths).then(() => undefined);
  };

  /** Expired drops are dropped from state whenever the user acts. */
  const purgeExpired = (list: Drop[]): Drop[] => {
    const expired = list.filter((d) => !isAlive(d));
    if (expired.length) cleanStorageFiles(expired);
    return list.filter(isAlive);
  };

  /** Best-effort: delete my expired share-link rows so the table stays lean. */
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
    if (f.size > CLOUD_IMG_LIMIT) {
      alert("Keep images under ~5MB (zero-cost tier). Compress the screenshot first.");
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
      return sb.storage.from("drops").getPublicUrl(path).data.publicUrl;
    } catch {
      return null;
    }
  };

  const save = async () => {
    if ((!text.trim() && !pendingImg) || saving) return;
    if (visible.length >= MAX_DROPS) {
      alert(`Cap is ${MAX_DROPS} drops — export or delete old ones first (expired drops auto-clear).`);
      return;
    }
    setSaving(true);
    try {
      const opt = TTL_OPTIONS.find((o) => o.id === ttl) ?? TTL_OPTIONS[1];
      // Every drop carries an expiry — no "never" option (personal-use cap).
      const expiresAt = new Date(Date.now() + opt.ms).toISOString();
      const base = purgeExpired(drops);
      let next: Drop[];
      if (pendingImg?.startsWith("data:")) {
        if (signedIn) {
          const id = `${Date.now()}`;
          const url = await uploadToStorage(pendingImg, id);
          next = [
            { id, text: text.trim(), image: url ?? pendingImg, createdAt: new Date().toISOString(), expiresAt },
            ...base,
          ];
          if (!url) alert("Image upload failed — saved inline instead (heavier sync).");
        } else {
          const bytes = Math.round(pendingImg.length * 0.75);
          if (bytes > LOCAL_IMG_LIMIT) {
            alert("Sign in with Google to save images over ~1.2MB, or compress the screenshot first.");
            return;
          }
          next = [
            { id: `${Date.now()}`, text: text.trim(), image: pendingImg, createdAt: new Date().toISOString(), expiresAt },
            ...base,
          ];
        }
      } else {
        next = [
          { id: `${Date.now()}`, text: text.trim(), image: pendingImg, createdAt: new Date().toISOString(), expiresAt },
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
    setDrops(purgeExpired(drops).filter((x) => x.id !== d.id));
    if (signedIn && d.image?.startsWith("http")) {
      const path = storagePathFromUrl(d.image);
      if (path) void getSupabase()?.storage.from("drops").remove([path]).then(() => undefined);
    }
    if (links[d.id]) void revokeLink(d, true);
    refreshUsage();
    void cleanupExpiredShares();
  };

  // --- allowlist sharing (private: only listed emails can view) ---

  const openEditor = (d: Drop) => {
    setShareEditor(d.id);
    setDraftEmails(safeLinks[d.id]?.emails ?? []);
    setEmailInput("");
  };

  const addEmail = async (d: Drop) => {
    const email = emailInput.trim().toLowerCase();
    if (!validEmail(email)) {
      alert("Enter a valid email address.");
      return;
    }
    if (draftEmails.includes(email)) {
      setEmailInput("");
      return;
    }
    const next = [...draftEmails, email];
    setDraftEmails(next);
    setEmailInput("");
    const link = links[d.id];
    if (link) {
      const { error } = await getSupabase()?.from("shared_drops").update({ allowed_emails: next }).eq("id", link.id) ?? { error: null };
      if (error) {
        alert("Could not update sharing — did you run migration 0004?");
        return;
      }
      setLinks({ ...links, [d.id]: { ...link, emails: next } });
    }
  };

  const removeEmail = async (d: Drop, email: string) => {
    const next = draftEmails.filter((e) => e !== email);
    setDraftEmails(next);
    const link = links[d.id];
    if (link) {
      await getSupabase()?.from("shared_drops").update({ allowed_emails: next }).eq("id", link.id);
      setLinks({ ...links, [d.id]: { ...link, emails: next } });
    }
  };

  const createLink = async (d: Drop) => {
    if (!signedIn) {
      alert("Sign in with Google to share — links are allowlisted to emails you pick.");
      return;
    }
    if (draftEmails.length === 0) {
      alert("Add at least one email to share with.");
      return;
    }
    setSharingId(d.id);
    try {
      const sb = getSupabase();
      if (!sb) return;
      let imageUrl = d.image?.startsWith("http") ? d.image : null;
      if (d.image?.startsWith("data:")) {
        imageUrl = await uploadToStorage(d.image, `shared-${d.id}`);
        if (imageUrl) setDrops(drops.map((x) => (x.id === d.id ? { ...x, image: imageUrl } : x)));
      }
      const { data: sess } = await sb.auth.getSession();
      const { data, error } = await sb
        .from("shared_drops")
        .insert({
          text: d.text ?? "",
          image_url: imageUrl,
          expires_at: d.expiresAt,
          created_from_drop: d.id,
          owner_email: sess.session?.user?.email ?? null,
          allowed_emails: draftEmails,
        })
        .select("id")
        .single();
      if (error || !data) {
        alert("Could not create link — did you run migration 0004_shared_allowlist.sql?");
        return;
      }
      const url = `${window.location.origin}/share/${data.id}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch { /* clipboard unavailable */ }
      setLinks({ ...links, [d.id]: { id: data.id, url, expiresAt: d.expiresAt, emails: draftEmails } });
      setCopiedId(`link-${d.id}`);
      setTimeout(() => setCopiedId(null), 1500);
    } finally {
      setSharingId(null);
    }
  };

  const copyLink = async (d: Drop) => {
    const link = links[d.id];
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(`link-${d.id}`);
      setTimeout(() => setCopiedId(null), 1200);
    } catch { /* clipboard unavailable */ }
  };

  const revokeLink = async (d: Drop, silent = false) => {
    const link = links[d.id];
    if (!link) return;
    try {
      await getSupabase()?.from("shared_drops").delete().eq("id", link.id);
    } catch { /* best effort */ }
    const next = { ...links };
    delete next[d.id];
    setLinks(next);
    if (shareEditor === d.id) setDraftEmails([]);
    if (!silent) alert("Share link revoked — allowlisted viewers lose access.");
  };

  const copyText = async (d: Drop) => {
    try {
      await navigator.clipboard.writeText(d.text || "");
      setCopiedId(d.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch { /* clipboard unavailable */ }
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(visible, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vk-share-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const kb = (usage / 1024).toFixed(1);

  return (
    <TrackerShell
      icon="share"
      title="Share"
      subtitle="Private scratchpad with email-allowlisted sharing. Signed-in friends you pick can view on the Shared page — everyone else sees nothing."
      badge={<SyncBadge status={status} />}
    >
      <Card>
        <CardContent className="space-y-3 p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text, a link, a win..."
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
            <label className="text-xs text-muted-foreground">
              Auto-clear{" "}
              <Segmented
                label="Drop expiry"
                variant="soft"
                options={TTL_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
                value={ttl}
                onChange={setTtl}
              />
            </label>
            {pendingImg && (
              <Button variant="ghost" size="sm" onClick={() => setPendingImg(null)}>
                Remove image
              </Button>
            )}
            <span className="flex-1" />
            <Button size="sm" onClick={save} disabled={(!text.trim() && !pendingImg) || saving}>
              {saving ? "Uploading…" : "Drop it"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {visible.length}/{MAX_DROPS} drops · {imageCount} images ·{" "}
            {signedIn
              ? "signed in — images go to Storage (5 MB max), sharing is email-allowlisted."
              : "local mode — images capped ~1.2 MB, sharing needs sign-in."}{" "}
            Browser: ~{kb} KB / ~5,000 KB.
          </p>
        </CardContent>
      </Card>

      {visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-5 text-sm text-muted-foreground">
            No drops yet — your quick captures land here newest-first, and vanish when their timer runs out.
          </CardContent>
        </Card>
      ) : (
          <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((d) => (
            <Card key={d.id} className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              {d.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image} alt="shared drop" className="max-h-56 w-full object-cover" loading="lazy" />
              )}
              <CardContent className="p-4">
                {d.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{d.text}</p>}
                <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                  {d.createdAt.slice(0, 16).replace("T", " ")} · {expiryLabel(d.expiresAt)}
                  {links[d.id] ? (
                    <>
                      {" "}· <Users className="mb-0.5 inline h-3 w-3" /> {links[d.id].emails.length} viewer(s)
                    </>
                  ) : (
                    ""
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
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
                      {links[d.id] ? <><Check className="mr-1 h-4 w-4" /> Sharing</> : "Share"}
                    </Button>
                  )}
                  {d.image && (
                    <a href={d.image} download={`drop-${d.id}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-xl border border-input px-3 text-sm transition-colors hover:bg-accent">
                      Open
                    </a>
                  )}
                  <span className="flex-1" />
                  <button
                    onClick={() => remove(d)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Delete
                  </button>
                </div>

                {shareEditor === d.id && (
                  <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs font-medium">Who can view (email allowlist)</p>
                    {draftEmails.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {draftEmails.map((e) => (
                          <span key={e} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                            {e}
                            <button onClick={() => removeEmail(d, e)} aria-label={`Remove ${e}`} className="text-muted-foreground transition-colors hover:text-foreground"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="friend@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void addEmail(d);
                        }}
                      />
                      <Button size="sm" variant="secondary" onClick={() => addEmail(d)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!links[d.id] ? (
                        <Button size="sm" onClick={() => createLink(d)} disabled={sharingId === d.id || !signedIn}>
                          {sharingId === d.id ? "Creating…" : "Create link"}
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => copyLink(d)}>
                            {copiedId === `link-${d.id}` ? <><Check className="mr-1 h-4 w-4" /> Link copied</> : "Copy link"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => revokeLink(d)}>
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                    {!signedIn && (
                      <p className="text-xs text-muted-foreground">Sign in with Google to create links.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <h2 className="font-display font-bold">Zero-cost storage strategy</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Caps ($0):</strong> {MAX_DROPS} drops max, 5 MB per image signed in (~1.2 MB local). Expired drops auto-clear.</li>
            <li><strong className="text-foreground">Text ($0):</strong> syncs as JSON rows in Postgres free tier.</li>
            <li><strong className="text-foreground">Images ($0):</strong> Storage bucket <code className="rounded bg-muted px-1 text-xs">drops</code> (free 1 GB), private per-user folders; only URLs sync.</li>
            <li><strong className="text-foreground">Sharing ($0, private):</strong> “Share” allowlists emails — only those signed-in viewers can open the link, listed under <a href="/shared-with-me" className="text-primary hover:underline">Shared with me</a>. Revoke anytime; links honor the drop&apos;s timer.</li>
          </ul>
          <Button variant="secondary" size="sm" className="mt-3" onClick={exportAll} disabled={visible.length === 0}>
            Export JSON backup
          </Button>
        </CardContent>
      </Card>
    </TrackerShell>
  );
}
