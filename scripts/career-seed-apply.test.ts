import test from "node:test";
import assert from "node:assert/strict";
import { applyCareerRows, verifyCareerReadback } from "./career-seed-apply.ts";
const rows = [{ user_id: "owner", key: "todos", value: [{ done: true }] }, { user_id: "owner", key: "reminders", value: { enabled: false } }];

test("missing RPC uses one atomic bulk upsert and verifies every value", async () => {
  let writes = 0;
  const client = {
    rpc: async () => ({ error: { code: "PGRST202", message: "Missing function" } }),
    from: () => ({ upsert: async (batch: unknown[]) => { writes++; assert.equal(batch.length, 2); assert.ok(batch.every(row => typeof (row as { updated_at?: unknown }).updated_at === "string")); return { error: null }; } }),
  };
  assert.equal(await applyCareerRows(client, "owner", rows), "bulk-upsert");
  assert.equal(writes, 1);
  verifyCareerReadback(rows, [...rows].reverse());
  assert.throws(() => verifyCareerReadback(rows, [{ ...rows[0], value: [] }, rows[1]]), /readback/i);
});

test("permission errors never trigger a fallback write", async () => {
  const client = { rpc: async () => ({ error: { code: "42501", message: "Denied" } }), from: () => { throw new Error("Must not write"); } };
  await assert.rejects(() => applyCareerRows(client, "owner", rows), /Denied/);
});
