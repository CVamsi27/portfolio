"use client";

/**
 * Full-suite backup & restore. Every tracker key is covered — including the
 * v1 migration backups (`vk:backup:v1:*`) — so nothing is ever stranded.
 * Backups are plain JSON, versioned with a timestamp, and import validates
 * every payload before anything is written.
 */

const KEYS = [
  "prefs",
  "fasting",
  "fasting:history",
  "workouts",
  "workout:library",
  "todos",
  "goal",
  "journal",
  "motivation:favs",
  "motivation:custom",
  "motivation:visits",
  "share",
  "share:links",
  "weight-loss",
  "archive:items",
  "reminders",
] as const;

export type BackupKey = (typeof KEYS)[number];

export const BACKUP_VERSION = 2;

export type BackupFile = {
  app: "vk-tracker-suite";
  version: number;
  exportedAt: string;
  data: Partial<Record<BackupKey, unknown>>;
  /** v1 migration snapshots taken before upgrades (included for safety). */
  v1Backups?: Record<string, unknown>;
};

export type KeyStat = {
  key: string;
  bytes: number;
  items: number | null; // array/map length where meaningful
  exists: boolean;
};

type ShareLinkBackup = {
  id: string;
  url: string;
  expiresAt: string | null;
  emails: string[];
  isPublic: boolean;
};

function sanitizeShareLinks(value: unknown): Record<string, ShareLinkBackup> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, ShareLinkBackup> = {};
  for (const [dropId, candidate] of Object.entries(value)) {
    if (!candidate || typeof candidate !== "object") continue;
    const link = candidate as Record<string, unknown>;
    if (typeof link.id !== "string" || typeof link.url !== "string") continue;
    out[dropId] = {
      id: link.id,
      url: link.url,
      expiresAt: typeof link.expiresAt === "string" ? link.expiresAt : null,
      emails: Array.isArray(link.emails) ? link.emails.filter((email): email is string => typeof email === "string") : [],
      isPublic: link.isPublic === true,
    };
  }
  return out;
}

/** Byte size of one localStorage entry (UTF-16 → ×2). */
export function keyBytes(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return 0;
    return (key.length + raw.length) * 2;
  } catch {
    return 0;
  }
}

function itemCount(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    // Map-ish shapes: dateKey → number, dateKey → dayLog, etc.
    return entries.length;
  }
  return null;
}

/** Per-key stats for the settings dashboard (prefixed with the app's `vk:` namespace). */
export function collectKeyStats(): KeyStat[] {
  if (typeof window === "undefined") return [];
  const out: KeyStat[] = [];
  for (const key of KEYS) {
    const localKey = `vk:${key}`;
    let exists = false;
    let items: number | null = null;
    try {
      const raw = window.localStorage.getItem(localKey);
      exists = raw !== null;
      if (raw !== null) items = itemCount(JSON.parse(raw));
    } catch {
      // corrupt entry — still report bytes
    }
    out.push({ key, bytes: keyBytes(localKey), items, exists });
  }
  return out;
}

export function totalBackupBytes(stats: KeyStat[]): number {
  return stats.reduce((a, s) => a + s.bytes, 0);
}

/** "12.3 KB" */
export function fmtKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Build the backup object from current localStorage state. */
export function collectBackup(): BackupFile {
  const data: Partial<Record<BackupKey, unknown>> = {};
  const v1Backups: Record<string, unknown> = {};
  if (typeof window !== "undefined") {
    for (const key of KEYS) {
      try {
        const raw = window.localStorage.getItem(`vk:${key}`);
        if (raw !== null) {
          const value = JSON.parse(raw);
          data[key] = key === "share:links" ? sanitizeShareLinks(value) : value;
        }
      } catch {
        // skip corrupt entries
      }
      try {
        const raw = window.localStorage.getItem(`vk:backup:v1:${key}`);
        if (raw !== null) v1Backups[key] = JSON.parse(raw);
      } catch {
        // skip
      }
    }
  }
  return {
    app: "vk-tracker-suite",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    v1Backups: Object.keys(v1Backups).length ? v1Backups : undefined,
  };
}

/** Trigger a JSON download of the full backup. */
export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vk-tracker-backup-${dateStamp()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
}

export type ImportReport = {
  ok: boolean;
  error?: string;
  keysRestored: string[];
  keysSkipped: string[];
  exportedAt?: string;
};

function looksLikeShape(value: unknown): boolean {
  return value === null || typeof value === "object" || typeof value === "string" || typeof value === "number";
}

/**
 * Validate + apply a backup file. Writes only after full validation;
 * the pre-import state is snapshotted to `vk:backup:v1:<key>` semantics
 * (a dedicated pre-import snapshot) so restore is itself reversible.
 */
export function applyBackup(backup: unknown): ImportReport {
  if (typeof window === "undefined") return { ok: false, error: "Client only", keysRestored: [], keysSkipped: [] };
  if (!backup || typeof backup !== "object") {
    return { ok: false, error: "Not a JSON object", keysRestored: [], keysSkipped: [] };
  }
  const b = backup as Record<string, unknown>;
  if (b.app !== "vk-tracker-suite") {
    return { ok: false, error: "This file wasn't exported from the tracker suite.", keysRestored: [], keysSkipped: [] };
  }
  const version = typeof b.version === "number" ? b.version : 0;
  if (version > BACKUP_VERSION) {
    return { ok: false, error: `Backup from a newer version (v${version}); this app is v${BACKUP_VERSION}.`, keysRestored: [], keysSkipped: [] };
  }
  if (!b.data || typeof b.data !== "object") {
    return { ok: false, error: "Backup has no data section.", keysRestored: [], keysSkipped: [] };
  }

  const data = b.data as Record<string, unknown>;
  const restored: string[] = [];
  const skipped: string[] = [];

  // Snapshot current values so the import can be undone manually.
  const snapshot: Record<string, unknown> = {};
  for (const key of KEYS) {
    if (!(key in data)) continue;
    const value = data[key];
    if (!looksLikeShape(value)) {
      skipped.push(key);
      continue;
    }
    try {
      const current = window.localStorage.getItem(`vk:${key}`);
      if (current !== null) snapshot[key] = JSON.parse(current);
    } catch {
      // ignore snapshot failures
    }
  }
  if (Object.keys(snapshot).length) {
    try {
      window.localStorage.setItem("vk:pre-import", JSON.stringify(snapshot));
    } catch {
      // quota — proceed without snapshot
    }
  }

  for (const key of KEYS) {
    if (!(key in data)) continue;
    const value = data[key];
    if (!looksLikeShape(value)) continue;
    try {
      window.localStorage.setItem(`vk:${key}`, JSON.stringify(value));
      restored.push(key);
      // Keep meta timestamps in the past so cloud pull (last-write-wins)
      // can refresh these rows from Supabase if the user is signed in.
      window.localStorage.removeItem(`vk:meta:${key}`);
    } catch {
      skipped.push(key);
    }
  }

  // Restore v1 snapshots under their backup keys (data preservation only).
  if (b.v1Backups && typeof b.v1Backups === "object") {
    for (const [key, value] of Object.entries(b.v1Backups as Record<string, unknown>)) {
      try {
        window.localStorage.setItem(`vk:backup:v1:${key}`, JSON.stringify(value));
      } catch {
        // best effort
      }
    }
  }

  return { ok: true, keysRestored: restored, keysSkipped: skipped, exportedAt: typeof b.exportedAt === "string" ? b.exportedAt : undefined };
}
