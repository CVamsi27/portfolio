import assert from "node:assert/strict";
import test from "node:test";
import { gzipSync } from "node:zlib";
import {
  decodeTrackerHistoryRows,
  prepareTrackerHistoryRows,
} from "./tracker-history-rows.ts";
import {
  decodeTrackerHistory,
  encodeTrackerHistory,
} from "../src/lib/tracker-history.ts";

const career = () => ({
  germanyRoadmap: { revision: "old" },
  roadmapHistory: [
    {
      notes: "Retained synthetic historical trace. ".repeat(17000),
      days: [{ date: "2026-10-26", done: true }],
    },
  ],
  custom: { retained: true },
});

test("CLI reads decode histories for merging without changing the raw recovery snapshot", async () => {
  const value = career();
  const before = [
    {
      key: "career_command_center",
      value: await encodeTrackerHistory("career_command_center", value),
      updated_at: "version-1",
    },
    { key: "unrelated", value: { done: true }, updated_at: "version-2" },
  ];
  const raw = JSON.stringify(before);
  const decoded = await decodeTrackerHistoryRows(before);
  assert.deepEqual(decoded[0].value, value);
  assert.equal(decoded[0].updated_at, "version-1");
  assert.deepEqual(decoded[1], before[1]);
  assert.equal(JSON.stringify(before), raw);
});

test("semantic repeats retain original gzip bytes and produce no owner changes", async () => {
  const value = career();
  const encoded = await encodeTrackerHistory("career_command_center", value);
  const alternative = structuredClone(encoded) as unknown as {
    roadmapHistory: { data: string };
  };
  alternative.roadmapHistory.data = gzipSync(
    JSON.stringify(value.roadmapHistory),
    { level: 1 },
  ).toString("base64");
  assert.notEqual(
    alternative.roadmapHistory.data,
    (encoded as unknown as { roadmapHistory: { data: string } }).roadmapHistory
      .data,
  );
  const before = [
    {
      key: "career_command_center",
      value: alternative,
      updated_at: "version-1",
    },
  ];
  const prepared = await prepareTrackerHistoryRows(before, [
    { key: "career_command_center", value, version: "version-1" },
  ]);
  assert.deepEqual(prepared.changes, []);
  assert.equal(prepared.rows[0].value, alternative);
  assert.equal(prepared.rows[0].version, "version-1");
});

test("changed CLI values are encoded for exact wire readback while histories and CAS versions survive", async () => {
  const old = career();
  const before = [
    {
      key: "career_command_center",
      value: await encodeTrackerHistory("career_command_center", old),
      updated_at: "version-1",
    },
    { key: "reminders", value: { enabled: false }, updated_at: "version-2" },
  ];
  const raw = JSON.stringify(before);
  const next = { ...old, germanyRoadmap: { revision: "new" } };
  const result = await prepareTrackerHistoryRows(before, [
    { key: "career_command_center", value: next, version: "version-1" },
    { key: "reminders", value: { enabled: false }, version: "version-2" },
  ]);
  assert.equal(result.rows.length, 2);
  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].version, "version-1");
  assert.equal(
    Array.isArray((result.changes[0].value as typeof next).roadmapHistory),
    false,
  );
  assert.deepEqual(
    await decodeTrackerHistory(
      "career_command_center",
      result.changes[0].value,
    ),
    next,
  );
  assert.equal(JSON.stringify(before), raw);
});

test("legacy small histories and missing rows retain their original schema", async () => {
  const timetable = {
    days: [{ date: "2026-10-29", completed: true }],
    scheduleHistory: [{ days: [] }],
  };
  const result = await prepareTrackerHistoryRows(
    [],
    [{ key: "timetable_100_days", value: timetable, version: "new" }],
  );
  assert.equal(result.changes.length, 1);
  assert.deepEqual(result.rows[0].value, timetable);
  const repeat = await prepareTrackerHistoryRows(result.rows, result.rows);
  assert.deepEqual(repeat.changes, []);
});

test("a corrupt prior envelope stops preparation rather than dropping history", async () => {
  const encoded = await encodeTrackerHistory("career_command_center", career());
  (
    encoded as unknown as { roadmapHistory: { sha256: string } }
  ).roadmapHistory.sha256 = "0".repeat(64);
  const before = [
    { key: "career_command_center", value: encoded, updated_at: "old" },
  ];
  const snapshot = JSON.stringify(before);
  await assert.rejects(
    prepareTrackerHistoryRows(before, [
      { key: "career_command_center", value: career(), version: "old" },
    ]),
    /integrity/i,
  );
  assert.equal(JSON.stringify(before), snapshot);
});
