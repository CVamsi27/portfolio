export const MAX_DROPS = 50;
export const MAX_DROP_IMAGES = 6;
export const CLOUD_IMAGE_LIMIT_BYTES = 5_000_000;
export const LOCAL_IMAGE_LIMIT_BYTES = 1_200_000;
export const BROWSER_STORAGE_LIMIT_BYTES = 5_000_000;
/** An image left inline is part of the synced drop JSON — keep it tiny. */
export const SYNC_INLINE_IMAGE_LIMIT_BYTES = 400_000;

export type ShareAccessMode = "private" | "public";

export type SharedDropPayloadInput = {
  id?: string;
  owner: string;
  text: string;
  imagePath: string | null;
  imagePaths?: string[];
  expiresAt: string | null;
  createdFromDrop: string;
  ownerEmail: string | null;
  access: ShareAccessMode;
  allowedEmails: string[];
};

/** Build the row shape expected by the shared_drops RLS policies. */
export function buildSharedDropPayload(input: SharedDropPayloadInput) {
  const imagePaths = (
    input.imagePaths && input.imagePaths.length
      ? input.imagePaths
      : input.imagePath
        ? [input.imagePath]
        : []
  ).filter(Boolean);
  return {
    ...(input.id ? { id: input.id } : {}),
    owner: input.owner,
    text: input.text,
    image_url: null,
    image_path: imagePaths[0] ?? input.imagePath,
    ...(imagePaths.length > 1 ? { image_paths: imagePaths } : {}),
    is_public: input.access === "public",
    expires_at: input.expiresAt,
    created_from_drop: input.createdFromDrop,
    owner_email: input.ownerEmail,
    allowed_emails: input.access === "private" ? input.allowedEmails : [],
  };
}

export type DropImageFields = {
  image?: string | null;
  imagePath?: string | null;
  images?: string[] | null;
};

/**
 * Every image attached to a drop, newest schema first. Drops created before
 * multi-image support only have `image`, so both shapes must keep working.
 */
export function dropImageSources(drop: DropImageFields): string[] {
  // Repeated picks of the same file are legitimate, so only the legacy
  // single-image fields are de-duplicated against the gallery.
  const gallery = (drop.images ?? []).filter(Boolean);
  const legacy = [...new Set([drop.image, drop.imagePath])].filter(
    (source): source is string => Boolean(source) && !gallery.includes(source!),
  );
  return [...gallery, ...legacy];
}

export function dropHasImages(drop: DropImageFields): boolean {
  return dropImageSources(drop).length > 0;
}

/**
 * Storage path for an image reference, or null when the image only exists
 * inline (a data URL). Accepts a bare path, a legacy public object URL, or a
 * signed URL.
 */
export function imageStoragePath(source: string): string | null {
  if (!source) return null;
  if (source.startsWith("data:")) return null;
  if (source.startsWith("http")) return storagePathFromUrl(source);
  return source;
}

export function isInlineImage(source: string): boolean {
  return source.startsWith("data:");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function accessMode(record: {
  is_public?: boolean;
  allowed_emails?: string[];
}): ShareAccessMode {
  return record.is_public === true ? "public" : "private";
}

export function shareLimitState(activeDrops: number, imageBytes: number) {
  const safeDrops = Math.max(0, activeDrops);
  const safeImageBytes = Math.max(0, imageBytes);
  return {
    dropsLeft: Math.max(0, MAX_DROPS - safeDrops),
    dropCapReached: safeDrops >= MAX_DROPS,
    imageCapReached: safeImageBytes > CLOUD_IMAGE_LIMIT_BYTES,
    usageLabel: `${Math.round(safeImageBytes / 1000)} KB / ${Math.round(BROWSER_STORAGE_LIMIT_BYTES / 1000)} KB`,
  };
}

export function expiryCopy(expiresAt: string | null, now = Date.now()): string {
  if (!expiresAt) return "never expires";
  const remaining = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "expired";
  const hours = Math.floor(remaining / 3_600_000);
  if (hours < 1) return "expires in less than 1 hour";
  if (hours < 24) return `expires in ${hours} hours`;
  const days = Math.floor(hours / 24);
  return `expires in ${days} ${days === 1 ? "day" : "days"}`;
}

export function storagePathFromUrl(url: string): string | null {
  const marker = "/drops/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

/**
 * Storage paths a published link may sign: the gallery when 0017 has run, then
 * the single-image columns, then the legacy object URL. Deployments without the
 * image_paths column must keep publishing the first image rather than none.
 */
export function publishedImagePaths(row: {
  image_paths?: string[] | null;
  image_path?: string | null;
  image_url?: string | null;
}): string[] {
  const gallery = (row.image_paths ?? []).filter(Boolean);
  if (gallery.length) return [...new Set(gallery)];
  if (row.image_path) return [row.image_path];
  const legacy = row.image_url ? storagePathFromUrl(row.image_url) : null;
  return legacy ? [legacy] : [];
}

/**
 * How long a signed media URL may live: never past the drop's own expiry, and
 * never longer than an hour. A malformed timestamp is treated as no expiry, the
 * same way the row's expiry check treats it.
 */
export const MAX_SIGNED_URL_SECONDS = 3600;

export function signedUrlTtlSeconds(
  expiresAt: string | null,
  now = Date.now(),
): number {
  if (!expiresAt) return MAX_SIGNED_URL_SECONDS;
  const remaining = Math.floor((new Date(expiresAt).getTime() - now) / 1000);
  if (!Number.isFinite(remaining)) return MAX_SIGNED_URL_SECONDS;
  return Math.max(0, Math.min(MAX_SIGNED_URL_SECONDS, remaining));
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const payload = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  return Math.floor((payload.replace(/\s/g, "").length * 3) / 4);
}
