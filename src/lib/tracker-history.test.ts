import test from "node:test";
import assert from "node:assert/strict";
import * as codec from "./tracker-history.ts";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
const sample = () => ({
  germanyRoadmap: { version: 3 },
  roadmapHistory: [
    {
      source: "synthetic",
      notes: "retained technical history ".repeat(22000),
      days: [{ date: "2026-10-26", complete: true }],
    },
  ],
  custom: { keep: true },
});
test("large history compresses losslessly while active fields and legacy reads remain intact", async () => {
  const value = sample();
  const encoded = await codec.encodeTrackerHistory(
    "career_command_center",
    value,
  );
  assert.ok(JSON.stringify(encoded).length < JSON.stringify(value).length / 10);
  assert.deepEqual(encoded.germanyRoadmap, value.germanyRoadmap);
  assert.deepEqual(
    await codec.decodeTrackerHistory("career_command_center", encoded),
    value,
  );
  assert.deepEqual(
    await codec.decodeTrackerHistory("career_command_center", value),
    value,
  );
  assert.deepEqual(await codec.encodeTrackerHistory("unrelated", value), value);
  assert.deepEqual(
    await codec.encodeTrackerHistory("career_command_center", encoded),
    encoded,
  );
});
test("a corrupted history fails closed and schedule history follows the same contract", async () => {
  const value = {
    days: [{ date: "2026-10-29", complete: true }],
    scheduleHistory: sample().roadmapHistory,
  };
  const encoded = await codec.encodeTrackerHistory("timetable_100_days", value);
  assert.deepEqual(
    await codec.decodeTrackerHistory("timetable_100_days", encoded),
    value,
  );
  const corrupt = structuredClone(encoded) as unknown as {
    scheduleHistory: { sha256: string; bytes: number };
  };
  corrupt.scheduleHistory.sha256 = "0".repeat(64);
  await assert.rejects(
    codec.decodeTrackerHistory("timetable_100_days", corrupt),
    /integrity/i,
  );
  const oversized = structuredClone(encoded) as unknown as {
    scheduleHistory: { sha256: string; bytes: number };
  };
  oversized.scheduleHistory.bytes = 128 * 1024 * 1024;
  await assert.rejects(
    codec.decodeTrackerHistory("timetable_100_days", oversized),
    /size/i,
  );
});

test("mutating an already cached history array cannot reuse its old compressed bytes", async () => {
  const value = sample();
  const first = await codec.encodeTrackerHistory(
    "career_command_center",
    value,
  );
  const firstWire = JSON.stringify(first);
  const history = value.roadmapHistory;
  history[0].days[0].complete = false;
  assert.equal(value.roadmapHistory, history);
  assert.equal(
    Array.isArray(
      codec.cachedTrackerHistory("career_command_center", value).roadmapHistory,
    ),
    true,
  );
  const next = await codec.encodeTrackerHistory("career_command_center", value);
  assert.notEqual(JSON.stringify(next), firstWire);
  assert.deepEqual(
    await codec.decodeTrackerHistory("career_command_center", next),
    value,
  );
  assert.equal(JSON.stringify(first), firstWire);
  assert.equal(
    Array.isArray(
      codec.cachedTrackerHistory("career_command_center", value).roadmapHistory,
    ),
    false,
  );
});

type TestEnvelope = {
  __novaHistory: number;
  codec: string;
  bytes: number;
  sha256: string;
  data: string;
};
const envelopeFor = (bytes: Uint8Array): TestEnvelope => ({
  __novaHistory: 1,
  codec: "gzip-base64",
  bytes: bytes.byteLength,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  data: gzipSync(bytes).toString("base64"),
});
const decodeEnvelope = (roadmapHistory: unknown) =>
  codec.decodeTrackerHistory("career_command_center", {
    active: { retained: true },
    roadmapHistory,
  });

test("history envelopes measure Unicode as UTF-8 bytes and leave active fields intact", async () => {
  const history = [{ note: "नमस्ते 🧠".repeat(40000) }];
  const bytes = new TextEncoder().encode(JSON.stringify(history));
  const envelope = envelopeFor(bytes);
  assert.ok(envelope.bytes > JSON.stringify(history).length);
  assert.deepEqual(await decodeEnvelope(envelope), {
    active: { retained: true },
    roadmapHistory: history,
  });
});

test("valid gzip and checksum cannot disguise malformed UTF-8 or a non-array history", async () => {
  // This would be an otherwise valid JSON array if the decoder replaced bad UTF-8.
  await assert.rejects(
    decodeEnvelope(
      envelopeFor(Uint8Array.from([0x5b, 0x22, 0xc3, 0x28, 0x22, 0x5d])),
    ),
    /encoded|encoding|UTF-8/i,
  );
  await assert.rejects(
    decodeEnvelope(envelopeFor(new TextEncoder().encode('{"history":[]}'))),
    /array/i,
  );
  await assert.rejects(
    decodeEnvelope(envelopeFor(new TextEncoder().encode("[broken]"))),
    SyntaxError,
  );
});

test("truncated gzip and dishonest expansion sizes fail without a partial history", async () => {
  const envelope = envelopeFor(
    new TextEncoder().encode(
      JSON.stringify([{ note: "retained".repeat(10000) }]),
    ),
  );
  const compressed = Buffer.from(envelope.data, "base64");
  await assert.rejects(
    decodeEnvelope({
      ...envelope,
      data: compressed.subarray(0, compressed.length - 8).toString("base64"),
    }),
  );
  await assert.rejects(
    decodeEnvelope({ ...envelope, bytes: envelope.bytes - 1 }),
    /size/i,
  );
  await assert.rejects(
    decodeEnvelope({ ...envelope, bytes: envelope.bytes + 1 }),
    /integrity/i,
  );
  await assert.rejects(
    decodeEnvelope({ ...envelope, sha256: "0".repeat(64) }),
    /integrity/i,
  );
});

test("unknown formats, invalid base64 and unsupported size declarations are rejected", async () => {
  const valid = envelopeFor(new TextEncoder().encode("[]"));
  for (const changed of [
    { __novaHistory: 2 },
    { codec: "brotli-base64" },
    { bytes: -1 },
    { bytes: 1.5 },
    { bytes: 64 * 1024 * 1024 + 1 },
    { data: "AA=A" },
    { data: "AAA" },
    { data: "!!!!" },
    { data: valid.data + "\n" },
    { sha256: "not-a-hash" },
  ])
    await assert.rejects(decodeEnvelope({ ...valid, ...changed }));
  for (const invalid of [null, "history", 7, {}, { codec: "gzip-base64" }])
    await assert.rejects(decodeEnvelope(invalid), /format/i);
  assert.deepEqual(
    await codec.decodeTrackerHistory("career_command_center", { active: true }),
    { active: true },
  );
});
