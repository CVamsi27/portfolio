"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ActionMenu from "@/components/trackers/ActionMenu";
import PageHeader from "@/components/trackers/PageHeader";
import PersonalShell from "@/components/trackers/PersonalShell";
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
import {
  Users,
  Plus,
  Check,
  X,
  Search,
  Pin,
  PinOff,
  ImagePlus,
  ImageOff,
  Loader2,
  CloudOff,
  LogIn,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  accessMode,
  BROWSER_STORAGE_LIMIT_BYTES,
  buildSharedDropPayload,
  CLOUD_IMAGE_LIMIT_BYTES,
  dropImageSources,
  estimateDataUrlBytes,
  expiryCopy,
  imageStoragePath,
  isInlineImage,
  isValidEmail,
  LOCAL_IMAGE_LIMIT_BYTES,
  MAX_DROP_IMAGES,
  MAX_DROPS,
  normalizeEmail,
  shareLimitState,
  type ShareAccessMode,
} from "@/lib/share-domain";
import { compressImageFile } from "@/lib/image-compress";
import {
  applyImageRepairs,
  inlineImageRepairTargets,
} from "@/lib/share-repair";

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
  /** Multi-image drops store every image here (paths or inline data URLs). */
  images?: string[];
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

/**
 * Renders drop images whether they are inline data: URLs or Supabase storage
 * paths. Paths get a short-lived signed URL — and when that fails we say so
 * instead of leaving an invisible hole, because a missing image is exactly the
 * symptom of a drop that never reached cloud storage.
 */
function DropImage({
  src,
  alt,
  className,
  openable,
}: {
  src: string;
  alt: string;
  className?: string;
  openable?: boolean;
}) {
  const isDirect = src.startsWith("data:") || src.startsWith("http");
  // Resolution is keyed by src so a stale signed URL can never leak across
  // drops, and nothing is written to state during the effect body.
  const [cloud, setCloud] = useState<{
    src: string;
    url: string | null;
  } | null>(null);
  const [broken, setBroken] = useState<string | null>(null);

  useEffect(() => {
    if (isDirect) return;
    let cancelled = false;
    const settle = (url: string | null) => {
      if (!cancelled) setCloud({ src, url });
    };
    const sb = getSupabase();
    if (!sb) {
      void Promise.resolve().then(() => settle(null));
      return;
    }
    void sb.storage
      .from("drops")
      .createSignedUrl(src, 3600)
      .then(({ data, error }) => {
        settle(!error && data?.signedUrl ? data.signedUrl : null);
      });
    return () => {
      cancelled = true;
    };
  }, [src, isDirect]);

  const resolvedSrc = isDirect ? src : cloud?.src === src ? cloud.url : null;
  const failed =
    broken === src || (!isDirect && cloud?.src === src && cloud.url === null);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} unavailable`}
        className={cn(
          "flex flex-col items-center justify-center gap-1 bg-muted/50 p-2 text-center text-[11px] text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="h-4 w-4" aria-hidden />
        <span>Image unavailable</span>
      </div>
    );
  }

  if (!resolvedSrc) {
    return (
      <div aria-hidden className={cn("animate-pulse bg-muted/60", className)} />
    );
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setBroken(src)}
    />
  );

  if (!openable) return image;

  return (
    <a
      href={resolvedSrc}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden"
      aria-label={`Open ${alt}`}
    >
      {image}
    </a>
  );
}

function DropGallery({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  if (sources.length === 1) {
    return (
      <div className="border-b border-border/40 bg-muted/20">
        <DropImage
          src={sources[0]}
          alt="shared drop"
          openable
          className="max-h-72 w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-px border-b border-border/40 bg-border/40 sm:grid-cols-3">
      {sources.map((src, index) => (
        <DropImage
          key={`${src.slice(0, 24)}-${index}`}
          src={src}
          alt={`shared drop image ${index + 1}`}
          openable
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ))}
    </div>
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
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
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
  const repairStarted = useRef(false);

  const signedIn = Boolean(user && isSupabaseConfigured());
  const configured = isSupabaseConfigured();

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

  const aliveDrops = useMemo(() => safeDrops.filter(isAlive), [safeDrops]);
  const imageCount = aliveDrops.reduce(
    (total, drop) => total + dropImageSources(drop).length,
    0,
  );

  const refreshUsage = () => setUsage(storageUsageBytes());

  const pathFor = (source: string) => imageStoragePath(source);

  const cleanStorageFiles = (expired: Drop[]) => {
    if (!signedIn) return;
    const paths = expired
      .flatMap((d) => dropImageSources(d))
      .map(pathFor)
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
      const { error } = await sb.storage.from("drops").upload(path, blob, {
        contentType: blob.type || "image/png",
        upsert: true,
      });
      if (error) return null;
      return path;
    } catch {
      return null;
    }
  };

  /** Compress every picked image, then queue it for the new drop. */
  const addFiles = async (incoming: File[]) => {
    if (!incoming.length || processing) return;
    const room = MAX_DROP_IMAGES - pendingImages.length;
    if (room <= 0) {
      toast({
        title: `Up to ${MAX_DROP_IMAGES} images per drop`,
        description: "Remove one of the selected images to add another.",
      });
      return;
    }
    setProcessing(true);
    try {
      const limit = signedIn
        ? CLOUD_IMAGE_LIMIT_BYTES
        : LOCAL_IMAGE_LIMIT_BYTES;
      const accepted: string[] = [];
      let skipped = 0;
      let tooLarge = 0;
      for (const file of incoming.slice(0, room)) {
        if (!file.type.startsWith("image/")) {
          skipped += 1;
          continue;
        }
        if (file.size > limit) {
          tooLarge += 1;
          continue;
        }
        try {
          accepted.push(await compressImageFile(file));
        } catch {
          skipped += 1;
        }
      }
      if (incoming.length > room) skipped += incoming.length - room;
      if (accepted.length) {
        setPendingImages((current) =>
          [...current, ...accepted].slice(0, MAX_DROP_IMAGES),
        );
      }
      if (tooLarge) {
        toast({
          title: "Image too large",
          description: signedIn
            ? "Images must be 5 MB or smaller. Compress the screenshot first."
            : "Local-only images must be about 1.2 MB or smaller. Sign in for the 5 MB limit.",
        });
      } else if (skipped && !accepted.length) {
        toast({
          title: "No images added",
          description: `Choose images only — up to ${MAX_DROP_IMAGES} per drop.`,
        });
      } else if (skipped) {
        toast({
          title: "Some files were skipped",
          description: `Only ${MAX_DROP_IMAGES} images can be attached to one drop.`,
        });
      }
    } finally {
      setProcessing(false);
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
    if ((!text.trim() && pendingImages.length === 0) || saving) return;
    if (aliveDrops.length >= MAX_DROPS) {
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
      const tags = autoTags(text.trim(), pendingImages.length > 0);
      const id = `${Date.now()}`;
      let stored = [...pendingImages];

      if (signedIn && stored.length) {
        const uploaded: string[] = [];
        let inlineCount = 0;
        for (let index = 0; index < stored.length; index += 1) {
          const path = await uploadToStorage(stored[index], `${id}-${index}`);
          if (path) {
            uploaded.push(path);
          } else {
            uploaded.push(stored[index]);
            if (isInlineImage(stored[index])) inlineCount += 1;
          }
        }
        stored = uploaded;
        if (inlineCount) {
          toast({
            title: "Images could not reach the cloud",
            description: `${inlineCount === 1 ? "One image stays" : `${inlineCount} images stay`} on this device only. Check the Storage setup and add them again from this device to sync.`,
          });
        }
      }

      const paths = stored.filter((source) => !isInlineImage(source));
      const next: Drop[] = [
        {
          id,
          text: text.trim(),
          image: null,
          imagePath: paths[0] ?? null,
          images: stored,
          createdAt: new Date().toISOString(),
          expiresAt,
          tags,
        },
        ...base,
      ];

      try {
        setDrops(next);
      } catch {
        toast({
          title: "This device is out of space",
          description:
            "Remove an image or an old drop, then save again. Nothing was changed.",
        });
        return;
      }

      setText("");
      setPendingImages([]);
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
      const paths = dropImageSources(d)
        .map(pathFor)
        .filter((p): p is string => Boolean(p));
      if (paths.length)
        void getSupabase()
          ?.storage.from("drops")
          .remove(paths)
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

      // Publish every image this drop has. Inline images are uploaded first so
      // the link never depends on the owner's browser.
      const sources = dropImageSources(d);
      const paths: string[] = [];
      let changed = false;
      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index];
        if (isInlineImage(source)) {
          const uploaded = await uploadToStorage(
            source,
            `shared-${d.id}-${index}`,
          );
          if (!uploaded) {
            toast({
              title: "Could not secure image",
              description:
                "The private Storage upload failed, so no share link was created.",
            });
            return;
          }
          paths.push(uploaded);
          changed = true;
        } else {
          const path = pathFor(source);
          if (!path) {
            toast({
              title: "Could not secure image",
              description:
                "One image has no cloud copy, so no share link was created.",
            });
            return;
          }
          paths.push(path);
        }
      }
      if (changed) {
        const nextImages = [...paths];
        setDrops(
          safeDrops.map((x) =>
            x.id === d.id
              ? {
                  ...x,
                  image: null,
                  images: nextImages,
                  imagePath: nextImages[0] ?? null,
                }
              : x,
          ),
        );
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

      const payload = buildSharedDropPayload({
        id: safeLinks[d.id]?.id,
        owner,
        text: d.text ?? "",
        imagePath: paths[0] ?? null,
        imagePaths: paths,
        access: shareAccess,
        expiresAt: d.expiresAt,
        createdFromDrop: d.id,
        ownerEmail: sess.session?.user?.email ?? null,
        allowedEmails: draftEmails,
      });

      let { data, error } = await sb
        .from("shared_drops")
        .upsert(payload)
        .select("id")
        .single();

      // Deployments that have not run 0017_share_multi_image.sql have no
      // image_paths column; publish the first image rather than fail.
      if (error && payload.image_paths) {
        const legacy = { ...payload };
        delete (legacy as { image_paths?: string[] }).image_paths;
        const retried = await sb
          .from("shared_drops")
          .upsert(legacy)
          .select("id")
          .single();
        data = retried.data;
        error = retried.error;
      }

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
    const blob = new Blob([JSON.stringify(aliveDrops, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vk-share-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /**
   * Images saved before cloud upload worked live inline in the synced drop
   * row, which is too big to travel. When the owner is signed in on the device
   * that still holds them, push them to Storage and replace the bytes with a
   * path so every other device can finally see them.
   */
  useEffect(() => {
    if (!signedIn || repairStarted.current) return;
    const pending = inlineImageRepairTargets(safeDrops.filter(isAlive));
    if (pending.length === 0) return;
    repairStarted.current = true;
    let cancelled = false;
    void (async () => {
      const repairs = new Map<string, string[]>();
      for (const { drop, sources } of pending) {
        const next = [...sources];
        let ok = false;
        for (let index = 0; index < sources.length; index += 1) {
          if (!isInlineImage(sources[index])) continue;
          const path = await uploadToStorage(
            sources[index],
            `repair-${drop.id}-${index}`,
          );
          if (path) {
            next[index] = path;
            ok = true;
          }
        }
        if (ok) repairs.set(drop.id, next);
      }
      if (cancelled || repairs.size === 0) return;
      try {
        setDrops((current) => applyImageRepairs(current, repairs));
        toast({
          title: "Images synced to the cloud",
          description:
            "Older images were re-uploaded so they now appear on your other devices.",
        });
      } catch {
        // Keep the local bytes; the next visit retries.
        repairStarted.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [safeDrops, setDrops, signedIn, toast]);

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

  // Expiry must react while the page is open (drops vanish on their own).
  useEffect(() => {
    const timer = setInterval(() => {
      if (safeDrops.some((drop) => !isAlive(drop))) refreshUsage();
    }, 60_000);
    return () => clearInterval(timer);
  }, [safeDrops]);

  const activeDropCount = aliveDrops.length;
  const pendingImageBytes = pendingImages
    .filter(isInlineImage)
    .reduce((total, source) => total + estimateDataUrlBytes(source), 0);
  const limits = shareLimitState(activeDropCount, pendingImageBytes);
  const kb = Math.min(usage, BROWSER_STORAGE_LIMIT_BYTES) / 1024;
  const sharedCount = aliveDrops.filter((drop) => safeLinks[drop.id]).length;
  const filtering = Boolean(query.trim()) || tagFilter !== "all";

  return (
    <PersonalShell icon="share" title={null} subtitle={null}>
      <PageHeader
        compact
        eyebrow="Tools"
        title="Sharing"
        subtitle={null}
        action={
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
        }
      />
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
          {!signedIn && (
            <div className="sharing-span flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              {configured ? (
                <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <ImageOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              )}
              <p className="min-w-0">
                {configured ? (
                  <>
                    Drops stay on this device until you sign in.{" "}
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <LogIn className="h-3.5 w-3.5" aria-hidden /> Sign in to
                      sync notes and images to your other devices
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Cloud sync is not configured on this deployment, so drops
                    are saved on this device only.
                  </>
                )}
              </p>
            </div>
          )}

          {activeDropCount > 0 && (
            <dl className="sharing-span sharing-summary">
              <div>
                <dt>Drops</dt>
                <dd>
                  {activeDropCount}
                  <small>active</small>
                </dd>
              </div>
              <div>
                <dt>Images</dt>
                <dd>
                  {imageCount}
                  <small>{imageCount === 1 ? "file" : "files"}</small>
                </dd>
              </div>
              <div>
                <dt>Shared</dt>
                <dd>
                  {sharedCount}
                  <small>{sharedCount === 1 ? "link" : "links"}</small>
                </dd>
              </div>
              <div>
                <dt>This device</dt>
                <dd>
                  {kb.toFixed(1)}
                  <small>KB</small>
                </dd>
              </div>
            </dl>
          )}

          {/* ── Search + tag filter ── */}
          <section
            id="sent-drops"
            className="sharing-saved min-w-0 space-y-3"
            aria-labelledby="saved-drops-title"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="saved-drops-title"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                Saved drops
              </h2>
              {activeDropCount > 0 && (
                <span className="text-sm tabular-nums text-muted-foreground">
                  {filtering
                    ? `${visible.length} of ${activeDropCount} shown`
                    : `${activeDropCount} ${activeDropCount === 1 ? "drop" : "drops"}`}
                </span>
              )}
            </div>
            {activeDropCount > 0 && (
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
            )}
            {/* ── Drops grid ── */}
            {visible.length === 0 ? (
              <EmptyState
                appearance="framed"
                icon={Search}
                title={
                  query || tagFilter !== "all"
                    ? "No drops match"
                    : "No drops yet"
                }
                hint={
                  query || tagFilter !== "all"
                    ? "Try a different search or clear the filter."
                    : "Create a drop to save a note, a link or up to six images."
                }
              />
            ) : (
              <div className="sharing-drops">
                {visible.map((d) => {
                  const sources = dropImageSources(d);
                  return (
                    <Card
                      variant="dossier"
                      key={d.id}
                      className={cn(
                        "overflow-hidden",
                        d.pinned && "border-primary/40",
                      )}
                    >
                      <DropGallery sources={sources} />
                      <CardContent className="flex h-full flex-col p-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs tabular-nums text-muted-foreground">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                              safeLinks[d.id]
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {safeLinks[d.id] ? (
                              <Users className="h-3 w-3" aria-hidden />
                            ) : (
                              <Lock className="h-3 w-3" aria-hidden />
                            )}
                            {safeLinks[d.id] ? "Shared" : "Private"}
                          </span>
                          <span>
                            {d.createdAt.slice(0, 16).replace("T", " ")}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{expiryCopy(d.expiresAt)}</span>
                          {d.pinned && (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Pin className="h-3 w-3" aria-hidden />
                              <span className="sr-only">Pinned</span>
                            </span>
                          )}
                          {(d.tags ?? []).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        {d.text &&
                          (d.text.length > 300 ? (
                            <details className="mt-3">
                              <summary className="min-h-11 cursor-pointer break-words [overflow-wrap:anywhere] text-sm">
                                {d.text.slice(0, 180)}…
                              </summary>
                              <p className="mt-3 whitespace-pre-wrap break-words text-base leading-relaxed">
                                {d.text}
                              </p>
                            </details>
                          ) : (
                            <p className="mt-3 whitespace-pre-wrap break-words text-base leading-relaxed">
                              {d.text}
                            </p>
                          ))}
                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
                          <span className="min-w-0 truncate text-xs text-muted-foreground">
                            {sources.length > 0
                              ? `${sources.length} ${sources.length === 1 ? "image" : "images"}`
                              : safeLinks[d.id]
                                ? safeLinks[d.id].isPublic
                                  ? "Anyone with the link"
                                  : `${safeLinks[d.id].emails.length} ${
                                      safeLinks[d.id].emails.length === 1
                                        ? "viewer"
                                        : "viewers"
                                    }`
                                : "Only you"}
                          </span>
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
                                  <Check className="mr-1 h-4 w-4" /> Manage
                                  access
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
                        </div>

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
                            {sources.length > 1 && (
                              <p className="text-sm text-muted-foreground">
                                This drop has {sources.length} images. The link
                                shows all of them once they finish uploading.
                              </p>
                            )}
                            {shareAccess === "private" &&
                            draftEmails.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {draftEmails.map((e) => (
                                  <span
                                    key={e}
                                    className="inline-flex max-w-full items-center rounded-lg bg-muted pl-3 text-sm"
                                  >
                                    <span className="min-w-0 break-all">
                                      {e}
                                    </span>
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
                                  onChange={(e) =>
                                    setEmailInput(e.target.value)
                                  }
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
                  );
                })}
              </div>
            )}
          </section>

          <Modal
            open={composerOpen}
            title="New drop"
            className="sm:max-w-lg"
            onClose={() => {
              if (
                (text.trim() || pendingImages.length) &&
                !window.confirm("Discard the unsaved drop?")
              )
                return;
              setComposerOpen(false);
              setText("");
              setPendingImages([]);
            }}
          >
            {/* ── Composer ── */}
            <div id="share-editor" className="sharing-composer space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Keep a thought, a link or screenshots. A new drop stays private
                until you share it.
              </p>
              <label htmlFor="drop-content" className="sr-only">
                Drop content
              </label>
              <textarea
                id="drop-content"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={(event) => {
                  const files = Array.from(event.clipboardData?.files ?? []);
                  if (!files.length) return;
                  event.preventDefault();
                  void addFiles(files);
                }}
                placeholder="Write a note or paste a link…"
                rows={3}
                className="block min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />

              <div
                data-testid="drop-image-zone"
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  )
                    setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  void addFiles(Array.from(event.dataTransfer.files));
                }}
                className={cn(
                  "rounded-xl border border-dashed p-3 transition-colors",
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-muted/20",
                )}
              >
                {pendingImages.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {pendingImages.map((src, index) => (
                        <div
                          key={`${index}-${src.slice(-16)}`}
                          className="group relative overflow-hidden rounded-lg border border-border/60"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={`Selected image ${index + 1}`}
                            className="aspect-square w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPendingImages((current) =>
                                current.filter((_, i) => i !== index),
                              )
                            }
                            aria-label={`Remove selected image ${index + 1}`}
                            className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {pendingImages.length} of {MAX_DROP_IMAGES} images
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingImages([])}
                      >
                        Clear images
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    aria-live="polite"
                    className="flex flex-col items-center gap-1 py-4 text-center"
                  >
                    {processing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium text-foreground/80">
                      {processing ? "Optimising images…" : "Drag images here"}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {processing
                        ? "Large photos are resized before they are saved."
                        : `Paste a screenshot, or choose up to ${MAX_DROP_IMAGES} files`}
                    </p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = "";
                    void addFiles(files);
                  }}
                />
              </div>

              <div className="space-y-3">
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
                <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={processing}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {pendingImages.length ? "Add more images" : "Add images"}
                  </Button>
                  <Button
                    size="sm"
                    data-editorial-action
                    onClick={save}
                    disabled={
                      (!text.trim() && pendingImages.length === 0) ||
                      saving ||
                      processing ||
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
            </div>
          </Modal>

          {/* ── Storage limits ── */}
          {activeDropCount > 0 && (
            <details className="sharing-limits">
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
                    <strong className="text-foreground">Images:</strong> up to{" "}
                    {MAX_DROP_IMAGES} per drop, compressed on this device. 5 MB
                    per signed-in image, or about 1.2 MB per local-only image.
                  </li>
                  <li>
                    <strong className="text-foreground">Sync:</strong> signed-in
                    images upload to private Storage so every device can load
                    them. Images saved while signed out stay on this device.
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
    </PersonalShell>
  );
}
