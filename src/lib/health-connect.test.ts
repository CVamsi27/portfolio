import test from "node:test";
import assert from "node:assert/strict";
import {
  validateHealthBatch,
  validPairRequest,
  deviceCredential,
  secretDigest,
} from "./health-connect.ts";
const now = Date.parse("2026-10-07T12:00:00Z");
const weight = () => ({
  id: "weight-1",
  type: "weight",
  date: "2026-10-07",
  value: 70,
  unit: "kg",
  source: "com.example",
  measuredAt: "2026-10-07T08:00:00Z",
  updatedAt: now,
  zoneOffsetSeconds: 19800,
});

test("health uploads accept reviewed provenance and reject an entire malformed batch", () => {
  assert.equal(validateHealthBatch({ records: [weight()] }, now), true);
  for (const change of [
    { value: -1 },
    { unit: "lb" },
    { date: "2026-02-30" },
    { measuredAt: "2026-10-07" },
    { updatedAt: Infinity },
    { deleted: "true" },
    { source: "" },
  ])
    assert.equal(
      validateHealthBatch(
        { records: [weight(), { ...weight(), id: "weight-2", ...change }] },
        now,
      ),
      false,
    );
});
test("duplicate upstream IDs, stale windows and excessive uploads are rejected", () => {
  assert.equal(
    validateHealthBatch({ records: [weight(), weight()] }, now),
    false,
  );
  assert.equal(
    validateHealthBatch(
      { records: [{ ...weight(), date: "2020-01-01" }] },
      now,
    ),
    false,
  );
  assert.equal(
    validateHealthBatch(
      {
        records: Array.from({ length: 501 }, (_, i) => ({
          ...weight(),
          id: String(i),
        })),
      },
      now,
    ),
    false,
  );
  assert.equal(validateHealthBatch({ records: [] }, now), true);
});
test("steps are integer daily aggregates; sleep keeps waking-day staged duration", () => {
  assert.equal(
    validateHealthBatch(
      {
        records: [
          {
            ...weight(),
            type: "steps",
            value: 5100,
            unit: "count",
            measurementKind: "aggregate",
          },
        ],
      },
      now,
    ),
    true,
  );
  assert.equal(
    validateHealthBatch(
      { records: [{ ...weight(), type: "steps", value: 0.5, unit: "count" }] },
      now,
    ),
    false,
  );
  const sleep = {
    ...weight(),
    type: "sleep",
    unit: "minutes",
    value: 420,
    startAt: "2026-10-06T17:30:00Z",
    endAt: "2026-10-07T01:30:00Z",
    measuredAt: "2026-10-07T01:30:00Z",
    measurementKind: "asleep",
    stages: [
      {
        stage: "deep",
        startAt: "2026-10-06T18:00:00Z",
        endAt: "2026-10-06T19:00:00Z",
      },
    ],
  };
  assert.equal(validateHealthBatch({ records: [sleep] }, now), true);
  assert.equal(
    validateHealthBatch({ records: [{ ...sleep, value: 600 }] }, now),
    false,
  );
  assert.equal(
    validateHealthBatch({ records: [{ ...sleep, date: "2026-10-06" }] }, now),
    false,
  );
  assert.equal(
    validateHealthBatch(
      {
        records: [
          {
            ...sleep,
            stages: [
              {
                stage: "deep",
                startAt: "2026-10-07T03:00:00Z",
                endAt: "2026-10-07T04:00:00Z",
              },
            ],
          },
        ],
      },
      now,
    ),
    false,
  );
});
test("pairing validates digest and credential parsing hashes decoded secret bytes", () => {
  const deviceId = "00000000-0000-0000-0000-000000000001";
  const secret = Buffer.alloc(32, 7).toString("base64url");
  assert.equal(
    validPairRequest({
      deviceId,
      label: "My Android",
      secretDigest: secretDigest(secret),
    }),
    true,
  );
  assert.equal(
    validPairRequest({ deviceId, label: "", secretDigest: "abc" }),
    false,
  );
  assert.deepEqual(deviceCredential(`Bearer ${deviceId}.${secret}`), {
    deviceId,
    digest: secretDigest(secret),
  });
  assert.equal(deviceCredential(`Bearer ${deviceId}.bad`), null);
  assert.equal(deviceCredential(`Bearer ${deviceId}.${secret}=`), null);
});
