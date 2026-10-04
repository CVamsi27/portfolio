import test from "node:test";
import assert from "node:assert/strict";
import { mergeRecords, scopedLocalKey } from "./record-merge.ts";
test("different concurrent entries survive merging and newer tombstones win", () => {
  const result = mergeRecords(
    { a: { updatedAt: 3, deleted: true }, b: { updatedAt: 1 } },
    { a: { updatedAt: 2 }, c: { updatedAt: 1 } },
  );
  assert.deepEqual(Object.keys(result).sort(), ["a", "b", "c"]);
  assert.equal(result.a.deleted, true);
});
test("new private local keys never reveal another account", () => {
  assert.notEqual(
    scopedLocalKey("nutrition:entries", "a", true, true),
    scopedLocalKey("nutrition:entries", "b", true, true),
  );
  assert.equal(
    scopedLocalKey("nutrition:entries", null, false, true),
    "vk:nutrition:entries",
  );
});
