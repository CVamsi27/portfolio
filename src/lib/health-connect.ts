import { createHash } from "node:crypto";

export type HealthRecord = {
  id: string;
  type: "weight" | "steps" | "sleep";
  date: string;
  value: number;
  unit: "kg" | "count" | "minutes";
  source: string;
  measuredAt: string;
  updatedAt: number;
  deleted?: boolean;
  zoneOffsetSeconds?: number;
  startAt?: string;
  endAt?: string;
  stages?: Array<{ stage: string; startAt: string; endAt: string }>;
  measurementKind?: string;
};
export const HEALTH_WINDOW_DAYS = 400;
const DAY = 86400000;
export const validDeviceId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const text = (value: unknown, limit: number): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= limit &&
  !/[\u0000-\u001f]/.test(value);
export function validHealthDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !value.startsWith("0000-") &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
const instant = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 40 &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(
    value,
  ) &&
  validHealthDate(value.slice(0, 10)) &&
  Number.isFinite(Date.parse(value));

export function validateHealthBatch(
  value: unknown,
  now = Date.now(),
): value is { records: HealthRecord[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const records = (value as { records: unknown }).records;
  if (!Array.isArray(records) || records.length > 500 || !Number.isFinite(now))
    return false;
  const keys = new Set<string>();
  const today = Date.parse(new Date(now).toISOString().slice(0, 10));
  return records.every((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
      return false;
    const r = candidate as HealthRecord;
    if (
      !text(r.id, 250) ||
      !text(r.source, 500) ||
      !["weight", "steps", "sleep"].includes(r.type) ||
      !validHealthDate(r.date) ||
      Date.parse(r.date) < today - HEALTH_WINDOW_DAYS * DAY ||
      Date.parse(r.date) > today + DAY ||
      !instant(r.measuredAt) ||
      Date.parse(r.measuredAt) > now + DAY ||
      !Number.isSafeInteger(r.updatedAt) ||
      r.updatedAt < 0 ||
      r.updatedAt > now + DAY ||
      !Number.isFinite(r.value) ||
      r.value < 0 ||
      (r.deleted !== undefined && typeof r.deleted !== "boolean") ||
      (r.measurementKind !== undefined && !text(r.measurementKind, 40)) ||
      (r.zoneOffsetSeconds !== undefined &&
        (!Number.isInteger(r.zoneOffsetSeconds) ||
          Math.abs(r.zoneOffsetSeconds) > 64800))
    )
      return false;
    if (
      (r.type === "weight" &&
        (r.unit !== "kg" || r.value <= 0 || r.value > 1000)) ||
      (r.type === "steps" &&
        (r.unit !== "count" ||
          !Number.isInteger(r.value) ||
          r.value > 1000000)) ||
      (r.type === "sleep" && (r.unit !== "minutes" || r.value > 2880))
    )
      return false;
    const key = JSON.stringify([r.type, r.source, r.id]);
    if (keys.has(key)) return false;
    keys.add(key);
    if ((r.startAt !== undefined) !== (r.endAt !== undefined)) return false;
    if (r.startAt !== undefined || r.endAt !== undefined) {
      if (!instant(r.startAt) || !instant(r.endAt)) return false;
      const start = Date.parse(r.startAt),
        end = Date.parse(r.endAt);
      if (end < start || end > now + DAY || end - start > 2880 * 60000)
        return false;
      if (r.type === "sleep" && r.value > (end - start) / 60000 + 0.01)
        return false;
    }
    if (r.zoneOffsetSeconds !== undefined && r.type !== "steps") {
      const waking =
        r.type === "sleep" ? (r.endAt ?? r.measuredAt) : r.measuredAt;
      if (
        new Date(Date.parse(waking) + r.zoneOffsetSeconds * 1000)
          .toISOString()
          .slice(0, 10) !== r.date
      )
        return false;
    }
    if (r.stages !== undefined) {
      if (
        r.type !== "sleep" ||
        !r.startAt ||
        !r.endAt ||
        !Array.isArray(r.stages) ||
        r.stages.length > 2000
      )
        return false;
      let lastEnd = Date.parse(r.startAt);
      for (const stage of r.stages) {
        if (
          !stage ||
          !text(stage.stage, 40) ||
          !instant(stage.startAt) ||
          !instant(stage.endAt)
        )
          return false;
        const start = Date.parse(stage.startAt),
          end = Date.parse(stage.endAt);
        if (start < lastEnd || end < start || end > Date.parse(r.endAt))
          return false;
        lastEnd = end;
      }
    }
    return true;
  });
}

export function validPairRequest(
  value: unknown,
): value is { deviceId: string; label: string; secretDigest: string } {
  if (!value || typeof value !== "object") return false;
  const p = value as {
    deviceId: unknown;
    label: unknown;
    secretDigest: unknown;
  };
  return (
    validDeviceId(p.deviceId) &&
    text(p.label, 100) &&
    typeof p.secretDigest === "string" &&
    /^[a-f0-9]{64}$/.test(p.secretDigest)
  );
}
export function secretDigest(secret: string): string {
  return createHash("sha256")
    .update(Buffer.from(secret, "base64url"))
    .digest("hex");
}
export function deviceCredential(
  header: string | null,
): { deviceId: string; digest: string } | null {
  const match = header?.match(/^Bearer ([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/i);
  if (!match || !validDeviceId(match[1])) return null;
  const bytes = Buffer.from(match[2], "base64url");
  if (bytes.length !== 32 || bytes.toString("base64url") !== match[2])
    return null;
  return { deviceId: match[1], digest: secretDigest(match[2]) };
}
