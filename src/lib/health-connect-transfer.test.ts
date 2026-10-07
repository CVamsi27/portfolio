import test from "node:test";
import assert from "node:assert/strict";
import {
  parseHealthArchive,
  healthArchive,
} from "./health-connect-transfer.ts";
const record = {
  id: "w1",
  type: "weight",
  date: "2020-01-01",
  value: 70,
  unit: "kg",
  source: "scale",
  measuredAt: "2020-01-01T12:00:00Z",
  updatedAt: 1,
  deviceId: "11111111-1111-1111-1111-111111111111",
};
test("historical archives preserve sources and tombstones but strip owner credentials", () => {
  const archive = healthArchive([
    { ...record, deleted: true, secret: "danger", user_id: "other" },
  ]);
  assert.equal(archive.records[0].deleted, true);
  assert.equal("secret" in archive.records[0], false);
  assert.equal("user_id" in archive.records[0], false);
  assert.equal(
    parseHealthArchive({ ...archive, owner: "someone", secret: "ignore" })
      .records.length,
    1,
  );
});
test("whole malformed or duplicate archives are rejected", () => {
  for (const records of [
    [record, { ...record, id: "bad", value: -1 }],
    [record, record],
    [{ ...record, date: "2020-02-30" }],
    [{ ...record, unit: "lbs" }],
  ])
    assert.throws(() =>
      parseHealthArchive({
        format: "nova-health-connect",
        version: 1,
        exportedAt: new Date().toISOString(),
        records,
      }),
    );
});
test("credentials never become device pairing instructions", () => {
  const a = parseHealthArchive({
    ...healthArchive([record]),
    devices: [{ secret: "abc" }],
  });
  assert.equal("devices" in a, false);
});
