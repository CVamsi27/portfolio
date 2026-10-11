import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server.js";
import { GET } from "../app/auth/callback/route.ts";
import { startAuthFixture } from "../../scripts/fixtures/personal-auth.ts";

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
const request = (query: string) =>
  new NextRequest(`https://personal.buildora.work/auth/callback${query}`, {
    headers: {
      host: "personal.buildora.work",
      cookie: `sb-127-auth-token-code-verifier=base64-${Buffer.from(JSON.stringify("fixture-verifier")).toString("base64url")}`,
    },
  });

test("Google code exchange sets session cookies before returning to a protected page", async () => {
  const response = await GET(
    request("?code=allowed&next=%2Fgoal%3Fview%3Dweek"),
  );
  assert.equal(
    response.headers.get("location"),
    "https://personal.buildora.work/goal?view=week",
  );
  assert.match(
    response.headers.get("set-cookie")!,
    /sb-127-auth-token=base64-/,
  );
  assert.match(response.headers.get("cache-control")!, /no-store/);
});

test("denied callback identities clear exchanged cookies and return to access denied", async () => {
  const response = await GET(request("?code=denied&next=%2Fgoal"));
  assert.equal(
    new URL(response.headers.get("location")!).searchParams.get("error"),
    "access-denied",
  );
  assert.doesNotMatch(
    response.headers.get("set-cookie")!,
    /sb-127-auth-token=base64-/,
  );
  assert.match(response.headers.get("set-cookie")!, /Max-Age=0/);
});

test("missing and invalid authorization codes never redirect into the workspace", async () => {
  for (const query of ["", "?code=invalid", "?error=access_denied"]) {
    const response = await GET(request(query));
    assert.equal(new URL(response.headers.get("location")!).pathname, "/login");
    assert.equal(
      new URL(response.headers.get("location")!).searchParams.get("error"),
      "sign-in-failed",
    );
  }
});

test("external callback destinations cannot create an open redirect", async () => {
  const response = await GET(request("?code=allowed&next=%2F%2Fevil.test"));
  assert.equal(
    response.headers.get("location"),
    "https://personal.buildora.work/hub",
  );
});

test("callbacks select their own PKCE verifier when multiple Google flows are pending", async () => {
  const req = request("?code=allowed-flow&sb_flow_id=testflow123&next=%2Fhub");
  req.cookies.set(
    "sb-127-auth-token-flow-testflow123-code-verifier",
    `base64-${Buffer.from(JSON.stringify("flow-verifier")).toString("base64url")}`,
  );
  const response = await GET(req);
  assert.equal(
    response.headers.get("location"),
    "https://personal.buildora.work/hub",
  );
});
