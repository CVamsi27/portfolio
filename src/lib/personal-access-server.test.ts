import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server.js";
import proxy from "../proxy.ts";
import {
  authToken,
  sessionCookie,
  startAuthFixture,
} from "../../scripts/fixtures/personal-auth.ts";

let fixture: Awaited<ReturnType<typeof startAuthFixture>>;
const original = { ...process.env };
before(async () => {
  fixture = await startAuthFixture();
  process.env.NEXT_PUBLIC_SUPABASE_URL = fixture.url;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fixture-publishable";
});
after(async () => {
  process.env = original;
  await fixture.close();
});

const request = (
  path: string,
  host = "personal.buildora.work",
  headers: Record<string, string> = {},
) =>
  new NextRequest(`https://${host}${path}`, { headers: { host, ...headers } });

test("anonymous personal root, deep links and sharing redirect before rendering", async () => {
  for (const path of [
    "/",
    "/hub",
    "/goal?view=week",
    "/trackers/landing",
    "/share/123",
    "/hub?_rsc=flight",
  ]) {
    const response = await proxy(request(path));
    assert.equal(response.status, 307, path);
    const location = new URL(response.headers.get("location")!);
    assert.equal(location.pathname, "/login");
    assert.equal(location.searchParams.get("next"), path);
    assert.match(response.headers.get("cache-control")!, /no-store/);
  }
});

test("APIs cannot bypass the allowlist via a public or preview host or image suffix", async () => {
  for (const host of [
    "personal.buildora.work",
    "buildora.work",
    "portfolio-preview.vercel.app",
  ]) {
    for (const path of [
      "/api/share/123",
      "/api/share/123.svg",
      "/api/motivation-image",
      "/api/nutrition/search",
    ]) {
      const response = await proxy(request(path, host));
      assert.equal(response.status, 401, `${host}${path}`);
      assert.match(response.headers.get("cache-control")!, /no-store/);
    }
  }
});

test("both allowed cookie sessions pass only after remote validation", async () => {
  for (const kind of ["allowed", "srija"]) {
    const response = await proxy(
      request("/hub", undefined, { cookie: sessionCookie(kind) }),
    );
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.match(response.headers.get("cache-control")!, /no-store/);
  }
  assert.ok(fixture.requests.includes("/auth/v1/user"));
});

test("forged allowed cookie user and non-Google identities cannot enter", async () => {
  for (const kind of ["denied", "password"]) {
    const response = await proxy(
      request("/hub", undefined, { cookie: sessionCookie(kind) }),
    );
    assert.equal(
      new URL(response.headers.get("location")!).searchParams.get("error"),
      "access-denied",
    );
    const api = await proxy(
      request("/api/share/123", undefined, {
        authorization: `Bearer ${authToken(kind)}`,
      }),
    );
    assert.equal(api.status, 403);
  }
});

test("invalid bearer wins over an allowed cookie and authentication outages fail closed", async () => {
  const invalid = await proxy(
    request("/api/share/123", undefined, {
      cookie: sessionCookie(),
      authorization: `Bearer ${authToken("invalid")}`,
    }),
  );
  assert.equal(invalid.status, 401);
  const outage = await proxy(
    request("/hub", undefined, { cookie: sessionCookie("outage") }),
  );
  assert.equal(new URL(outage.headers.get("location")!).pathname, "/login");
  const api = await proxy(
    request("/api/share/123", undefined, {
      authorization: `Bearer ${authToken("allowed")}`,
    }),
  );
  assert.equal(api.headers.get("x-middleware-next"), "1");
});

test("missing configuration fails closed only on deployed protected requests", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "";
  try {
    assert.equal((await proxy(request("/hub"))).status, 307);
    assert.equal((await proxy(request("/api/share/123"))).status, 503);
    assert.equal(
      (await proxy(request("/hub", "localhost:3000"))).headers.get(
        "x-middleware-next",
      ),
      "1",
    );
    assert.equal(
      (await proxy(request("/", "buildora.work"))).headers.get(
        "x-middleware-next",
      ),
      "1",
    );
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  }
});

test("login, callback and machine endpoints retain their independent boundaries", async () => {
  for (const path of [
    "/login",
    "/auth/callback?code=abc",
    "/sw.js",
    "/manifest.webmanifest",
    "/api/contact",
    "/api/health-connect/pair",
    "/api/health-connect/status",
    "/api/health-connect/sync",
    "/api/push/dispatch",
    "/api/telegram/dispatch",
  ]) {
    assert.equal(
      (await proxy(request(path))).headers.get("x-middleware-next"),
      "1",
      path,
    );
  }
});

test("session refresh cookies survive page continuation and reach downstream rendering", async () => {
  const response = await proxy(
    request("/hub", undefined, { cookie: sessionCookie("allowed", true) }),
  );
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.match(response.headers.get("set-cookie")!, /sb-127-auth-token=/);
  assert.match(
    response.headers.get("x-middleware-request-cookie")!,
    /sb-127-auth-token=base64-/,
  );
});

test("public hosts cannot forge a tracker surface using request headers", async () => {
  const response = await proxy(
    request("/", "buildora.work", { "x-product-surface": "tracker" }),
  );
  assert.equal(
    response.headers.get("x-middleware-request-x-product-surface"),
    null,
  );
  assert.equal(
    (await proxy(request("/hub", "buildora.work"))).headers.get("location"),
    "https://buildora.work/",
  );
});
