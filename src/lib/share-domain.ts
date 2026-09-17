export const MAX_DROPS = 50;
export const CLOUD_IMAGE_LIMIT_BYTES = 5_000_000;
export const LOCAL_IMAGE_LIMIT_BYTES = 1_200_000;
export const BROWSER_STORAGE_LIMIT_BYTES = 5_000_000;

export type ShareAccessMode = "private" | "public";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function accessMode(record: { is_public?: boolean; allowed_emails?: string[] }): ShareAccessMode {
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

export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const payload = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  return Math.floor((payload.replace(/\s/g, "").length * 3) / 4);
}
