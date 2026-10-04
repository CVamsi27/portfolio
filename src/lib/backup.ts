"use client";

/**
 * Full-suite backup & restore. Every tracker key is covered — including the
 * v1 migration backups (`vk:backup:v1:*`) — so nothing is ever stranded.
 * Backups are plain JSON, versioned with a timestamp, and import validates
 * every payload before anything is written.
 */

import { validWorkState } from "./work-session";
import { currentAuthUserId } from "./auth-store";
import { isSupabaseConfigured } from "./supabase/client";
import { validEntry, validFood, validNutrients, NUTRIENTS } from "./nutrition";
import { validSchedule } from "./routine-reminders";
const SCOPED_KEYS = [
  "nutrition:entries",
  "nutrition:foods",
  "nutrition:recipes",
  "nutrition:targets",
  "routine:schedules",
  "routine:history",
  "recovery:entries",
  "habits:items",
  "habits:history",
  "personal:modules",
  "personal:guard-opt-in",
];
function storageKey(key: string, legacy = false) {
  return !legacy && isSupabaseConfigured()
    ? `vk:account:${currentAuthUserId() ?? "signed-out"}:${key}`
    : `vk:${key}`;
}
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
  "motivation:media",
  "share",
  "share:links",
  "weight-loss",
  "archive:items",
  "reminders",
  "fasting:water",
  "work:active",
  "focus:active",
  "focus:sessions",
  "lockdown:preferences",
  "bedtime:manual",
  "bedtime:dismissed-until",
  "timetable_100_days",
  "roadmap:progress",
  "study:active_session",
  "study:completed_chapters",
  "career_command_center",
  "career_execution_state",
  "night_curfew_config",
  "distraction_shield_state",
  "nutrition:entries",
  "nutrition:foods",
  "nutrition:recipes",
  "nutrition:targets",
  "routine:schedules",
  "routine:history",
  "recovery:entries",
  "habits:items",
  "habits:history",
  "personal:modules",
  "personal:guard-opt-in",
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
      emails: Array.isArray(link.emails)
        ? link.emails.filter(
            (email): email is string => typeof email === "string",
          )
        : [],
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
    const localKey = storageKey(key);
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
export function collectBackup(options?: { legacy?: boolean }): BackupFile {
  const data: Partial<Record<BackupKey, unknown>> = {};
  const v1Backups: Record<string, unknown> = {};
  if (typeof window !== "undefined") {
    for (const key of KEYS) {
      try {
        const raw = window.localStorage.getItem(
          storageKey(key, options?.legacy),
        );
        if (raw !== null) {
          const value = JSON.parse(raw);
          data[key] = key === "share:links" ? sanitizeShareLinks(value) : value;
        }
      } catch {
        // skip corrupt entries
      }
      try {
        const raw = window.localStorage.getItem(
          storageKey(`backup:v1:${key}`, options?.legacy),
        );
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
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
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
  return (
    value === null ||
    typeof value === "object" ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Validate + apply a backup file. Writes only after full validation;
 * the pre-import state is snapshotted to `vk:backup:v1:<key>` semantics
 * (a dedicated pre-import snapshot) so restore is itself reversible.
 */
export function applyBackup(backup: unknown): ImportReport {
  if (typeof window === "undefined")
    return {
      ok: false,
      error: "Client only",
      keysRestored: [],
      keysSkipped: [],
    };
  if (!backup || typeof backup !== "object") {
    return {
      ok: false,
      error: "Not a JSON object",
      keysRestored: [],
      keysSkipped: [],
    };
  }
  const b = backup as Record<string, unknown>;
  if (b.app !== "vk-tracker-suite") {
    return {
      ok: false,
      error: "This file wasn't exported from the tracker suite.",
      keysRestored: [],
      keysSkipped: [],
    };
  }
  const version = typeof b.version === "number" ? b.version : 0;
  if (version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `Backup from a newer version (v${version}); this app is v${BACKUP_VERSION}.`,
      keysRestored: [],
      keysSkipped: [],
    };
  }
  if (!b.data || typeof b.data !== "object" || Array.isArray(b.data)) {
    return {
      ok: false,
      error: "Backup has no data section.",
      keysRestored: [],
      keysSkipped: [],
    };
  }

  const data = b.data as Record<string, unknown>;
  const arrayKeys = [
    "todos",
    "fasting:history",
    "focus:sessions",
    "motivation:favs",
    "motivation:custom",
    "share",
    "archive:items",
    "study:completed_chapters",
  ];
  for (const key of KEYS) {
    if (!(key in data) || SCOPED_KEYS.includes(key)) continue;
    const value = data[key];
    const valid =
      key === "work:active"
        ? validWorkState(value)
        : key === "bedtime:manual"
          ? typeof value === "boolean"
          : key === "bedtime:dismissed-until"
            ? typeof value === "number" && Number.isFinite(value)
            : arrayKeys.includes(key)
              ? Array.isArray(value)
              : [
                    "work:active",
                    "focus:active",
                    "study:active_session",
                    "timetable_100_days",
                  ].includes(key)
                ? value === null ||
                  (typeof value === "object" && !Array.isArray(value))
                : value !== null &&
                  typeof value === "object" &&
                  !Array.isArray(value);
    if (!valid)
      return {
        ok: false,
        error: `Invalid ${key} data. Nothing imported.`,
        keysRestored: [],
        keysSkipped: [],
      };
  }
  // Validate all private record collections before any writes or snapshots.
  for (const key of SCOPED_KEYS) {
    if (!(key in data)) continue;
    const value = data[key];
    if (key === "personal:guard-opt-in") {
      if (typeof value !== "boolean")
        return {
          ok: false,
          error: "Invalid guard setting.",
          keysRestored: [],
          keysSkipped: [],
        };
      continue;
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      return {
        ok: false,
        error: `Invalid ${key} collection. Nothing imported.`,
        keysRestored: [],
        keysSkipped: [],
      };
    for (const record of Object.values(value)) {
      if (key === "personal:modules") {
        if (typeof record !== "boolean")
          return {
            ok: false,
            error: "Invalid module preferences.",
            keysRestored: [],
            keysSkipped: [],
          };
        continue;
      }
      if (
        !record ||
        typeof record !== "object" ||
        !Number.isFinite((record as { updatedAt?: number }).updatedAt)
      )
        return {
          ok: false,
          error: `Invalid ${key} record. Nothing imported.`,
          keysRestored: [],
          keysSkipped: [],
        };
      const r = record as Record<string, unknown>;
      const valid =
        key === "nutrition:entries"
          ? validEntry(record)
          : key === "nutrition:foods"
            ? validFood(record)
            : key === "nutrition:recipes"
              ? validFood(record) &&
                Array.isArray(r.ingredients) &&
                r.ingredients.every(
                  (i: Record<string, unknown>) =>
                    validNutrients(i.nutrients) &&
                    typeof i.quantity === "number" &&
                    i.quantity > 0,
                )
              : key === "nutrition:targets"
                ? typeof r.id === "string" &&
                  r.id in NUTRIENTS &&
                  typeof r.amount === "number" &&
                  Number.isFinite(r.amount) &&
                  r.amount >= 0 &&
                  ["reference", "limit"].includes(String(r.kind))
                : key === "routine:schedules"
                  ? validSchedule(record)
                  : key === "routine:history"
                    ? typeof r.id === "string" &&
                      typeof r.date === "string" &&
                      ["done", "taken", "skipped", "snoozed"].includes(
                        String(r.status),
                      )
                    : key === "recovery:entries"
                      ? typeof r.date === "string" &&
                        (r.sleepHours === null ||
                          (typeof r.sleepHours === "number" &&
                            r.sleepHours >= 0 &&
                            r.sleepHours <= 24))
                      : key === "habits:items"
                        ? typeof r.name === "string"
                        : typeof r.done === "boolean" &&
                          typeof r.date === "string";
      if (!valid)
        return {
          ok: false,
          error: `Invalid ${key} record. Nothing imported.`,
          keysRestored: [],
          keysSkipped: [],
        };
    }
  }
  const restored: string[] = [];
  const skipped: string[] = [];

  // Keep exact bytes for rollback, including timestamps and pending flags.
  const original = new Map<string, string | null>();
  const changes = new Map<string, string | null>();
  const snapshot: Record<string, unknown> = {};
  for (const key of KEYS) {
    if (!(key in data)) continue;
    const value = data[key];
    if (!looksLikeShape(value)) {
      skipped.push(key);
      continue;
    }
    const local = storageKey(key);
    const raw = window.localStorage.getItem(local);
    try {
      snapshot[key] = raw === null ? null : JSON.parse(raw);
    } catch {
      snapshot[key] = { unparsedOriginal: raw };
    }
    changes.set(local, JSON.stringify(value));
    changes.set(
      isSupabaseConfigured() ? `${local}:meta` : `vk:meta:${key}`,
      null,
    );
    if (SCOPED_KEYS.includes(key)) changes.set(`${local}:pending`, "true");
  }
  const snapshotKey = storageKey("pre-import");
  if (Object.keys(snapshot).length)
    changes.set(snapshotKey, JSON.stringify(snapshot));
  try {
    for (const key of changes.keys())
      original.set(key, window.localStorage.getItem(key));
    // Save the rollback copy before touching any current data.
    if (changes.has(snapshotKey))
      window.localStorage.setItem(snapshotKey, changes.get(snapshotKey)!);
    for (const [key, value] of changes) {
      if (key === snapshotKey) continue;
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    }
    restored.push(
      ...KEYS.filter((key) => key in data && looksLikeShape(data[key])),
    );
  } catch {
    let recovered = true;
    for (const [key, raw] of original) {
      try {
        if (raw === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, raw);
      } catch {
        recovered = false;
      }
    }
    return {
      ok: false,
      error: recovered
        ? "Restore stopped: device storage is full or unavailable. Existing data was restored."
        : "Restore stopped: device storage is unavailable. Keep your backup and check device storage before retrying.",
      keysRestored: [],
      keysSkipped: skipped,
    };
  }

  // Restore v1 snapshots under their backup keys (data preservation only).
  if (b.v1Backups && typeof b.v1Backups === "object") {
    for (const [key, value] of Object.entries(
      b.v1Backups as Record<string, unknown>,
    )) {
      if (!KEYS.includes(key as BackupKey)) continue;
      try {
        window.localStorage.setItem(
          storageKey(`backup:v1:${key}`),
          JSON.stringify(value),
        );
      } catch {
        // best effort
      }
    }
  }

  return {
    ok: true,
    keysRestored: restored,
    keysSkipped: skipped,
    exportedAt: typeof b.exportedAt === "string" ? b.exportedAt : undefined,
  };
}
