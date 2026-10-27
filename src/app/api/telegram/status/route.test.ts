import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import { NextRequest } from "next/server.js";
import { PERSONAL_ALLOWED_EMAILS } from "../../../../lib/personal-access.ts";
import {
  authToken,
  authUser,
} from "../../../../../scripts/fixtures/personal-auth.ts";
import { GET } from "./route.ts";

const original = { ...process.env };
const ownerId = "ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f";
const otherId = "b4f5ddc5-ecbe-4fb5-a565-18fcab0336b4";
const requests: URL[] = [];
let missingMigration = false;
let fixtureUrl = "";
const server = createServer((request, response) => {
  const url = new URL(request.url!, fixtureUrl);
  requests.push(url);
  response.setHeader("Content-Type", "application/json");
  if (url.pathname === "/auth/v1/user") {
    let kind = "invalid";
    try {
      kind = JSON.parse(
        Buffer.from(
          request.headers.authorization!.split(".")[1],
          "base64url",
        ).toString(),
      ).sub;
    } catch {}
    if (kind === "invalid" || kind === "outage") {
      response.writeHead(kind === "outage" ? 503 : 401);
      response.end('{"message":"Unavailable"}');
      return;
    }
    const owner = kind === "owner";
    response.end(
      JSON.stringify({
        ...authUser(
          owner
            ? PERSONAL_ALLOWED_EMAILS[0]
            : kind === "other"
              ? PERSONAL_ALLOWED_EMAILS[1]
              : "denied@example.test",
        ),
        id: owner ? ownerId : otherId,
      }),
    );
    return;
  }
  if (url.pathname === "/auth/v1/admin/users") {
    response.end(
      JSON.stringify({
        users: [{ ...authUser(PERSONAL_ALLOWED_EMAILS[0]), id: ownerId }],
      }),
    );
    return;
  }
  if (url.pathname === "/rest/v1/push_deliveries") {
    if (missingMigration) {
      response.writeHead(400);
      response.end('{"code":"42703","message":"column unavailable"}');
      return;
    }
    if (request.method === "HEAD") {
      const status = url.searchParams.get("status");
      response.setHeader(
        "Content-Range",
        `0-0/${status === "eq.sent" ? 2 : status === "eq.unknown" ? 1 : 0}`,
      );
      response.end();
      return;
    }
    const column = url.searchParams.get("select")!;
    response.end(JSON.stringify({ [column]: "2026-10-27T00:30:00.000Z" }));
    return;
  }
  response.writeHead(404);
  response.end("{}");
});

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  fixtureUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.NEXT_PUBLIC_SUPABASE_URL = fixtureUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fixture-publishable";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-service-role";
  process.env.TELEGRAM_OWNER_EMAIL = PERSONAL_ALLOWED_EMAILS[0];
  process.env.TELEGRAM_BOT_TOKEN = "fixture-bot-token-long-enough";
  process.env.TELEGRAM_CHAT_ID = "123456";
  process.env.CRON_SECRET = "fixture-cron-secret";
});
after(async () => {
  process.env = original;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
beforeEach(() => {
  requests.length = 0;
  missingMigration = false;
});
const request = (kind?: string) =>
  new NextRequest("https://personal.buildora.work/api/telegram/status", {
    headers: kind ? { authorization: `Bearer ${authToken(kind)}` } : {},
  });

test("anonymous, invalid and unavailable authentication cannot read any delivery metadata", async () => {
  for (const kind of [undefined, "invalid", "outage"]) {
    const response = await GET(request(kind));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: "Authentication required.",
    });
    assert.match(response.headers.get("cache-control")!, /no-store/);
  }
  assert.equal(
    requests.some((url) => url.pathname.startsWith("/rest/")),
    false,
  );
  assert.equal(
    requests.some((url) => url.pathname.startsWith("/auth/v1/admin/")),
    false,
  );
});

test("another approved account cannot inspect the configured owner's deliveries", async () => {
  for (const kind of ["other", "denied"]) {
    const response = await GET(request(kind));
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Access denied." });
  }
  assert.equal(
    requests.some((url) => url.pathname !== "/auth/v1/user"),
    false,
  );
});

test("owner status exposes only scoped aggregate counts and timestamps", async () => {
  const response = await GET(request("owner"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, {
    configured: { telegram: true, storage: true, dispatcher: true },
    ownerAllowed: true,
    delivery: {
      available: true,
      scope: "career",
      counts: {
        pending: 0,
        claimed: 0,
        sending: 0,
        sent: 2,
        failed: 0,
        unknown: 1,
      },
      latestAttemptAt: "2026-10-27T00:30:00.000Z",
      latestSentAt: "2026-10-27T00:30:00.000Z",
      latestUnknownAt: "2026-10-27T00:30:00.000Z",
    },
  });
  const ledgerReads = requests.filter(
    (url) => url.pathname === "/rest/v1/push_deliveries",
  );
  assert.equal(ledgerReads.length, 9);
  for (const url of ledgerReads) {
    assert.equal(url.searchParams.get("user_id"), `eq.${ownerId}`);
    assert.equal(
      url.searchParams.get("telegram_kind"),
      "in.(career-digest,career-study,career-project)",
    );
  }
  const encoded = JSON.stringify(body);
  for (const secret of [
    ownerId,
    PERSONAL_ALLOWED_EMAILS[0],
    "123456",
    "fixture-bot-token",
    "fixture-cron-secret",
    "fixture-service-role",
  ])
    assert.equal(encoded.includes(secret), false);
});

test("missing delivery-state migration returns unavailable instead of healthy empty history", async () => {
  missingMigration = true;
  const response = await GET(request("owner"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.delivery.available, false);
  assert.equal(body.delivery.latestSentAt, null);
  assert.equal(body.delivery.counts.sent, 0);
  assert.equal(JSON.stringify(body).includes("column unavailable"), false);
});
