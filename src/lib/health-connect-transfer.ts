// Portable archives intentionally contain no owner binding or device credentials.
export type TransferRecord = {
  id: string;
  type: "weight" | "steps" | "sleep";
  date: string;
  value: number;
  unit: "kg" | "count" | "minutes";
  source: string;
  measuredAt: string;
  updatedAt: number;
  deleted?: boolean;
  deviceId?: string;
  zoneOffsetSeconds?: number;
  startAt?: string;
  endAt?: string;
  stages?: Array<{ stage: string; startAt: string; endAt: string }>;
  measurementKind?: string;
};
export type HealthArchive = {
  format: "nova-health-connect";
  version: 1;
  exportedAt: string;
  records: TransferRecord[];
};
const fields = [
  "id",
  "type",
  "date",
  "value",
  "unit",
  "source",
  "measuredAt",
  "updatedAt",
  "deleted",
  "deviceId",
  "zoneOffsetSeconds",
  "startAt",
  "endAt",
  "stages",
  "measurementKind",
];
const day = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  v > "0000-12-31" &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
const instant = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length <= 40 &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.test(
    v,
  ) &&
  day(v.slice(0, 10)) &&
  Number.isFinite(Date.parse(v));
const text = (v: unknown, max: number): v is string =>
  typeof v === "string" &&
  v.trim().length > 0 &&
  v.length <= max &&
  !/[\u0000-\u001f]/.test(v);
export function parseHealthArchive(value: unknown): HealthArchive {
  if (!value || typeof value !== "object")
    throw Error("Choose a NOVA health archive.");
  const a = value as HealthArchive;
  if (
    a.format !== "nova-health-connect" ||
    a.version !== 1 ||
    !instant(a.exportedAt) ||
    !Array.isArray(a.records) ||
    a.records.length > 5000
  )
    throw Error("Unsupported health archive or more than 5,000 records.");
  const seen = new Set<string>();
  const records = a.records.map((r) => {
    if (
      !r ||
      typeof r !== "object" ||
      !text(r.id, 250) ||
      !text(r.source, 500) ||
      !day(r.date) ||
      !instant(r.measuredAt) ||
      Date.parse(r.measuredAt) > Date.now() + 86400000 ||
      !Number.isSafeInteger(r.updatedAt) ||
      r.updatedAt < 0 ||
      r.updatedAt > Date.now() + 86400000 ||
      !Number.isFinite(r.value) ||
      r.value < 0 ||
      !["weight", "steps", "sleep"].includes(r.type) ||
      (r.deleted !== undefined && typeof r.deleted !== "boolean") ||
      (r.deviceId !== undefined &&
        !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(r.deviceId)) ||
      (r.measurementKind !== undefined && !text(r.measurementKind, 40)) ||
      (r.zoneOffsetSeconds !== undefined &&
        (!Number.isInteger(r.zoneOffsetSeconds) ||
          Math.abs(r.zoneOffsetSeconds) > 64800))
    )
      throw Error("Invalid health archive record. Nothing was restored.");
    if (
      (r.type === "weight" &&
        (r.unit !== "kg" || r.value <= 0 || r.value > 1000)) ||
      (r.type === "steps" &&
        (r.unit !== "count" ||
          !Number.isInteger(r.value) ||
          r.value > 1000000)) ||
      (r.type === "sleep" && (r.unit !== "minutes" || r.value > 2880))
    )
      throw Error("Invalid health units or values.");
    if (
      (r.startAt !== undefined) !== (r.endAt !== undefined) ||
      (r.startAt !== undefined &&
        (!instant(r.startAt) ||
          !instant(r.endAt) ||
          Date.parse(r.endAt) < Date.parse(r.startAt) ||
          Date.parse(r.endAt) - Date.parse(r.startAt) > 172800000 ||
          Date.parse(r.endAt) > Date.now() + 86400000 ||
          (r.type === "sleep" &&
            r.value >
              (Date.parse(r.endAt) - Date.parse(r.startAt)) / 60000 + 0.01)))
    )
      throw Error("Invalid health interval.");
    if (r.stages !== undefined) {
      if (
        r.type !== "sleep" ||
        !r.startAt ||
        !r.endAt ||
        !Array.isArray(r.stages) ||
        r.stages.length > 2000
      )
        throw Error("Invalid sleep stages.");
      let last = Date.parse(r.startAt);
      for (const s of r.stages) {
        if (
          !s ||
          !text(s.stage, 40) ||
          !instant(s.startAt) ||
          !instant(s.endAt) ||
          Date.parse(s.startAt) < last ||
          Date.parse(s.endAt) < Date.parse(s.startAt) ||
          Date.parse(s.endAt) > Date.parse(r.endAt)
        )
          throw Error("Invalid sleep stages.");
        last = Date.parse(s.endAt);
      }
    }
    const key = JSON.stringify([r.type, r.source, r.id]);
    if (seen.has(key)) throw Error("Duplicate source record in archive.");
    seen.add(key);
    const clean = Object.fromEntries(
      fields
        .filter((k) => Object.hasOwn(r, k))
        .map((k) => [k, (r as unknown as Record<string, unknown>)[k]]),
    ) as TransferRecord;
    if (clean.stages)
      clean.stages = clean.stages.map(({ stage, startAt, endAt }) => ({
        stage,
        startAt,
        endAt,
      }));
    return clean;
  });
  return {
    format: "nova-health-connect",
    version: 1,
    exportedAt: a.exportedAt,
    records,
  };
}
export function healthArchive(records: unknown[]): HealthArchive {
  return parseHealthArchive({
    format: "nova-health-connect",
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  });
}
