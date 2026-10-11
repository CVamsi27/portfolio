import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { healthOwner, healthRpc } from "./health-connect-server.ts";
import {
  authToken,
  startAuthFixture,
} from "../../scripts/fixtures/personal-auth.ts";

let fixture: Awaited<ReturnType<typeof startAuthFixture>>;
const original = { ...process.env };
before(async () => {
  fixture = await startAuthFixture();
  process.env.NEXT_PUBLIC_SUPABASE_URL = fixture.url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-service-role";
});
after(async () => {
  process.env = original;
  await fixture.close();
});
const device = {
  p_device_id: "ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f",
  p_secret_digest: "a".repeat(64),
};

test("only approved Google users can claim or manage health connections", async () => {
  for (const kind of ["allowed", "srija"]) {
    const user = await healthOwner(
      new Request("https://personal.buildora.work/api/health-connect/claim", {
        headers: { authorization: `Bearer ${authToken(kind)}` },
      }),
    );
    assert.ok(user.id);
  }
  await assert.rejects(
    healthOwner(
      new Request("https://personal.buildora.work/api/health-connect/claim", {
        headers: { authorization: `Bearer ${authToken("denied")}` },
      }),
    ),
    /Access denied/,
  );
});

test("paired device RPCs require an approved owner before accessing records", async () => {
  fixture.controls.deviceOwner = "allowed";
  assert.deepEqual(
    await healthRpc("health_connect_sync", { ...device, p_records: [] }),
    { paired: true, accepted: 1 },
  );
  fixture.controls.deviceOwner = "denied";
  const count = fixture.requests.filter((url) => url.includes("/rpc/")).length;
  for (const name of ["health_connect_sync", "health_connect_status"])
    await assert.rejects(healthRpc(name, device), /Access denied/);
  assert.equal(
    fixture.requests.filter((url) => url.includes("/rpc/")).length,
    count,
  );
});

test("pending Android pairing can check status but cannot upload records", async () => {
  fixture.controls.deviceOwner = "unpaired";
  assert.deepEqual(await healthRpc("health_connect_status", device), {
    paired: false,
    accepted: 1,
  });
  await assert.rejects(
    healthRpc("health_connect_sync", device),
    /not authorized/,
  );
  fixture.controls.deviceOwner = "missing";
  await assert.rejects(
    healthRpc("health_connect_status", device),
    /not authorized/,
  );
});
