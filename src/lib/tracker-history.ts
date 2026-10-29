/** Wire-only history compression. Active fields and all decoded record values stay unchanged. */
const HISTORY_FIELDS: Record<string, readonly string[]> = {
  career_command_center: ["roadmapHistory"],
  timetable_100_days: ["scheduleHistory"],
};
type CodecOptions = { local?: boolean };
function fields(
  key: string,
  local = false,
): Array<[string, "array" | "object"]> {
  const base = (HISTORY_FIELDS[key] ?? []).map(
    (field) => [field, "array"] as [string, "array"],
  );
  if (local && key === "career_command_center")
    return [...base, ["germanyRoadmap", "object"]];
  if (local && key === "timetable_100_days")
    return [...base, ["days", "array"]];
  return base;
}
const shapeMatches = (value: unknown, shape: "array" | "object") =>
  shape === "array" ? Array.isArray(value) : object(value);
const historyCache = new WeakMap<
  object,
  { envelope: Envelope; text: string }
>();
const MAX_BYTES = 64 * 1024 * 1024;
type Envelope = {
  __novaHistory: 1;
  codec: "gzip-base64";
  bytes: number;
  sha256: string;
  data: string;
};
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const hash = async (bytes: Uint8Array<ArrayBuffer>) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
async function collect(
  stream: ReadableStream<Uint8Array>,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const reader = stream.getReader(),
    chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw Error("History size limit exceeded");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
function base64(bytes: Uint8Array) {
  let raw = "";
  for (let i = 0; i < bytes.length; i += 32768)
    raw += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(raw);
}
export async function encodeTrackerHistory<T>(
  key: string,
  value: T,
  options: CodecOptions = {},
): Promise<T> {
  if (!HISTORY_FIELDS[key] || !object(value)) return value;
  const result: Record<string, unknown> = { ...value };
  for (const [field, shape] of fields(key, options.local)) {
    if (
      !shapeMatches(result[field], shape) ||
      (object(result[field]) && "__novaHistory" in result[field])
    )
      continue;
    const history = result[field] as object;
    const text = JSON.stringify(history),
      cached = historyCache.get(history as object);
    if (cached?.text === text) {
      result[field] = cached.envelope;
      continue;
    }
    const bytes = new TextEncoder().encode(text);
    if (bytes.length < 256 * 1024) continue;
    if (bytes.length > MAX_BYTES) throw Error("History size limit exceeded");
    const compressed = await collect(
      new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
      MAX_BYTES,
    );
    if (compressed.length >= bytes.length) continue;
    const envelope = {
      __novaHistory: 1,
      codec: "gzip-base64",
      bytes: bytes.length,
      sha256: await hash(bytes),
      data: base64(compressed),
    } satisfies Envelope;
    historyCache.set(history, { envelope, text });
    result[field] = envelope;
  }
  return result as T;
}
export async function decodeTrackerHistory<T>(
  key: string,
  value: T,
  options: CodecOptions = {},
): Promise<T> {
  if (!HISTORY_FIELDS[key] || !object(value)) return value;
  const result: Record<string, unknown> = { ...value };
  for (const [field, shape] of fields(key, options.local)) {
    const candidate = result[field];
    if (
      candidate === undefined ||
      (shapeMatches(candidate, shape) &&
        !(object(candidate) && "__novaHistory" in candidate))
    )
      continue;
    if (!object(candidate) || !("__novaHistory" in candidate))
      throw Error("Unsupported history format");
    const e = candidate as unknown as Envelope;
    if (
      e.__novaHistory !== 1 ||
      e.codec !== "gzip-base64" ||
      !Number.isInteger(e.bytes) ||
      e.bytes < 0 ||
      e.bytes > MAX_BYTES
    )
      throw Error("Unsupported history format or size");
    if (
      typeof e.data !== "string" ||
      e.data.length > MAX_BYTES ||
      e.data.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(e.data) ||
      !/^[a-f0-9]{64}$/.test(e.sha256)
    )
      throw Error("History integrity validation failed");
    const raw = atob(e.data),
      compressed = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    const bytes = await collect(
      new Blob([compressed])
        .stream()
        .pipeThrough(new DecompressionStream("gzip")),
      Math.min(e.bytes, MAX_BYTES),
    );
    if (bytes.length !== e.bytes || (await hash(bytes)) !== e.sha256)
      throw Error("History integrity validation failed");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const decoded: unknown = JSON.parse(text);
    if (!shapeMatches(decoded, shape))
      throw Error("History must decode to an " + shape);
    historyCache.set(decoded as object, { envelope: e, text });
    result[field] = decoded;
  }
  return result as T;
}

/** Cache-backed synchronous wire view for edits to an already loaded document. */
export function cachedTrackerHistory<T>(
  key: string,
  value: T,
  options: CodecOptions = {},
): T {
  if (!HISTORY_FIELDS[key] || !object(value)) return value;
  const result: Record<string, unknown> = { ...value };
  for (const [field, shape] of fields(key, options.local)) {
    const history = result[field];
    if (shapeMatches(history, shape)) {
      const cached = historyCache.get(history as object);
      if (cached?.text === JSON.stringify(history))
        result[field] = cached.envelope;
    }
  }
  return result as T;
}
export function hasTrackerHistoryEnvelope(
  key: string,
  value: unknown,
  options: CodecOptions = {},
): boolean {
  return Boolean(
    HISTORY_FIELDS[key] &&
      object(value) &&
      fields(key, options.local).some(
        ([field]) => object(value[field]) && "__novaHistory" in value[field],
      ),
  );
}
export function historyKeyForStorage(localKey: string): string {
  return (
    Object.keys(HISTORY_FIELDS).find(
      (key) => localKey === key || localKey.endsWith(":" + key),
    ) ?? localKey
  );
}
