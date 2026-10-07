import { test, expect } from "@playwright/test";

test("health endpoints require authorization and never expose private data in local mode", async ({
  request,
}) => {
  for (const path of ["devices", "records", "status"]) {
    const response = await request.get(`/api/health-connect/${path}`);
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toBe("private, no-store");
    expect(Object.keys(await response.json())).toEqual(["error"]);
  }
  for (const path of ["claim", "revoke", "sync"]) {
    const response = await request.post(`/api/health-connect/${path}`, {
      data: { records: [] },
    });
    expect(response.status()).toBe(401);
    expect(Object.keys(await response.json())).toEqual(["error"]);
  }
});

test("missing health storage configuration cannot create a pairing or report a successful sync", async ({
  request,
}) => {
  const pair = await request.post("/api/health-connect/pair", {
    data: {
      deviceId: "00000000-0000-0000-0000-000000000001",
      label: "Fixture",
      secretDigest: "a".repeat(64),
    },
  });
  expect(pair.status()).toBe(503);
  expect(await pair.json()).toEqual({
    error: "Health connection storage is not configured.",
  });
  const sync = await request.post("/api/health-connect/sync", {
    headers: {
      Authorization: `Bearer 00000000-0000-0000-0000-000000000001.${Buffer.alloc(32, 1).toString("base64url")}`,
    },
    data: { records: [] },
  });
  expect(sync.status()).toBe(503);
  expect(Object.keys(await sync.json())).toEqual(["error"]);
});
