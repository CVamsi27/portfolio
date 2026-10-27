import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import {
  studyDates,
  studyDaySlots,
  studyAssignmentId,
  type JobPlan,
} from "../../../../lib/job-plan.ts";
import { DEFAULT_CAREER_TELEGRAM_PREFERENCES } from "../../../../lib/career-telegram.ts";
import { GET } from "./route.ts";

const originalEnv = { ...process.env };
const realFetch = globalThis.fetch;
const realNow = Date.now;
const owner = "ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f";
const baseClock = Date.parse("2026-10-26T06:01:00+05:30");
let clock = baseClock;
let fixtureUrl = "";
let privateChat = true;
let ackError = false;
let sweepError = false;
let trackerError = false;
let prefsEnabled = true;
let routineEnabled = true;
let sends: string[] = [];
let claims: Record<string, unknown>[] = [];
let reads: URL[] = [];
let seen = new Set<string>();
const plan: JobPlan = {
  version: 3,
  effectiveOn: "2026-10-26",
  endDate: "2027-02-18",
  studyDayCount: 100,
  timezone: "Asia/Kolkata",
  weeklyMinutes: 3600,
  sourceDigest: "a".repeat(64),
  provenance: "Synthetic fixture",
  catalogueChapterIds: ["systems"],
  knownSkillIds: ["observability"],
  knownRoleIds: [],
  knownClaimIds: [],
  days: studyDates().map((date) => ({
    date,
    assignments: studyDaySlots(date).map(([range, kind]) => ({
      id: studyAssignmentId(date, kind, range),
      date,
      range,
      kind,
      minutes:
        Number(range.slice(6, 8)) * 60 +
        Number(range.slice(9)) -
        Number(range.slice(0, 2)) * 60 -
        Number(range.slice(3, 5)),
      title: "Trace a slow request",
      outcome: "Compare measured latency",
      brief: "Trace the request path",
      steps: ["Capture a trace", "Compare the result"],
      deliverable: "A trace and benchmark",
      doneCheck: "Evidence supports the decision",
      dependency: "Read the trace",
      blocked: "Retain the job when the worker stops",
      chapterIds: ["systems"],
      prerequisiteAssignmentIds: [],
      skillIds: ["observability"],
      relatedRoleIds: [],
      relatedClaimIds: [],
      provenance: "Synthetic fixture",
    })),
  })),
};
const schedule = {
  id: "fixture",
  label: "Fixture routine",
  time: "06:00",
  days: [1],
  timezone: "Asia/Kolkata",
  enabled: true,
  type: "meal",
  updatedAt: 1,
};
const server = createServer(async (request, response) => {
  const url = new URL(request.url!, fixtureUrl);
  reads.push(url);
  response.setHeader("Content-Type", "application/json");
  if (url.pathname === "/auth/v1/admin/users") {
    response.end(
      JSON.stringify({ users: [{ id: owner, email: "owner@example.test" }] }),
    );
    return;
  }
  if (url.pathname === "/rest/v1/tracker_data") {
    if (trackerError) {
      response.writeHead(500);
      response.end('{"message":"fixture storage failure"}');
      return;
    }
    const key = url.searchParams.get("key");
    const prefs = {
      ...DEFAULT_CAREER_TELEGRAM_PREFERENCES,
      enabled: prefsEnabled,
      enabledAt: prefsEnabled ? "2026-10-25T00:00:00Z" : null,
    };
    if (key === "eq.career_command_center") {
      response.end(
        JSON.stringify({
          plan:
            url.searchParams.get("select") ===
            "plan:value->germanyRoadmap->execution->jobPlan"
              ? plan
              : null,
        }),
      );
      return;
    }
    if (key === "eq.career_execution_state") {
      response.end('{"value":{"evidenceByItemId":{}}}');
      return;
    }
    response.end(
      JSON.stringify([
        {
          key: "routine:schedules",
          value: routineEnabled ? { fixture: schedule } : {},
        },
        { key: "routine:history", value: {} },
        { key: "career:telegram-preferences", value: prefs },
      ]),
    );
    return;
  }
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    let body = "";
    for await (const chunk of request) body += chunk;
    const data = JSON.parse(body);
    if (url.pathname.endsWith("expire_telegram_deliveries")) {
      if (sweepError) {
        response.writeHead(500);
        response.end('{"message":"sweep failed"}');
        return;
      }
      response.end("0");
      return;
    }
    if (url.pathname.endsWith("claim_telegram_delivery")) {
      claims.push(data);
      if (seen.has(data.p_delivery)) {
        response.end('{"status":"skipped"}');
        return;
      }
      seen.add(data.p_delivery);
      response.end(
        '{"status":"claimed","token":"ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f"}',
      );
      return;
    }
    if (url.pathname.endsWith("arm_telegram_delivery")) {
      response.end("true");
      return;
    }
    if (url.pathname.endsWith("finish_telegram_delivery")) {
      if (ackError) {
        response.writeHead(500);
        response.end('{"message":"ack failed"}');
        return;
      }
      response.end("true");
      return;
    }
  }
  response.writeHead(404);
  response.end("{}");
});
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  fixtureUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: fixtureUrl,
    SUPABASE_SERVICE_ROLE_KEY: "fixture-service-key",
    TELEGRAM_OWNER_EMAIL: "owner@example.test",
    TELEGRAM_BOT_TOKEN: "fixture-token-long-enough",
    TELEGRAM_CHAT_ID: "123456",
    CRON_SECRET: "fixture-cron-secret",
  });
  Date.now = () => clock;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (!url.startsWith("https://api.telegram.org/"))
      return realFetch(input, init);
    if (url.endsWith("/getChat"))
      return Response.json({
        ok: true,
        result: { id: 123456, type: privateChat ? "private" : "group" },
      });
    const body = JSON.parse(String(init?.body));
    sends.push(body.text);
    return Response.json({ ok: true, result: { message_id: sends.length } });
  };
});
after(async () => {
  process.env = originalEnv;
  Date.now = realNow;
  globalThis.fetch = realFetch;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
beforeEach(() => {
  clock = baseClock;
  schedule.time = "06:00";
  privateChat = true;
  ackError = false;
  sweepError = false;
  trackerError = false;
  prefsEnabled = true;
  routineEnabled = true;
  process.env.TELEGRAM_CHAT_ID = "123456";
  sends = [];
  claims = [];
  reads = [];
  seen = new Set();
});
const request = (token = "fixture-cron-secret") =>
  new Request("https://www.buildora.work/api/telegram/dispatch", {
    headers: { authorization: `Bearer ${token}` },
  });

test("invalid bearer does not read owner data or contact Telegram", async () => {
  const response = await GET(request("wrong"));
  assert.equal(response.status, 401);
  assert.equal(reads.length, 0);
  assert.equal(sends.length, 0);
});
test("one fixed owner can receive routine and career messages with independent stable IDs", async () => {
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    due: 2,
    sent: 2,
    failed: 0,
    unknown: 0,
    skipped: 0,
  });
  assert.equal(sends.length, 2);
  assert.ok(
    sends.every((text) => text.includes("https://personal.buildora.work/")),
  );
  const legacy = createHash("sha256")
    .update(`telegram:123456:${clock - 60000}`)
    .digest("hex");
  assert.equal(
    claims.find((item) => item.p_kind === "routine")?.p_delivery,
    legacy,
  );
  assert.equal(
    claims.find((item) => item.p_kind === "routine")?.p_expires_at,
    new Date(clock - 60000 + 15 * 60000).toISOString(),
  );
  assert.notEqual(claims[0].p_delivery, claims[1].p_delivery);
  for (const url of reads.filter(
    (url) => url.pathname === "/rest/v1/tracker_data",
  ))
    assert.equal(url.searchParams.get("user_id"), `eq.${owner}`);
  const careerRead = reads.find(
    (url) => url.searchParams.get("key") === "eq.career_command_center",
  )!;
  assert.equal(
    careerRead.searchParams.get("select"),
    "plan:value->germanyRoadmap->execution->jobPlan",
  );
  const repeat = await GET(request());
  assert.deepEqual(await repeat.json(), {
    due: 2,
    sent: 0,
    failed: 0,
    unknown: 0,
    skipped: 2,
  });
  assert.equal(sends.length, 2);
});
test("disabled career preferences preserve existing routine delivery and skip loading the large plan", async () => {
  prefsEnabled = false;
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sent, 1);
  assert.equal(claims[0].p_kind, "routine");
  assert.equal(
    reads.some(
      (url) => url.searchParams.get("key") === "eq.career_command_center",
    ),
    false,
  );
});
test("a nonprivate destination fails before any claim or private message", async () => {
  privateChat = false;
  const response = await GET(request());
  assert.equal(response.status, 503);
  assert.equal(sends.length, 0);
  assert.equal(claims.length, 0);
});
test("provider acceptance with failed ledger acknowledgement is unknown, never reported sent", async () => {
  ackError = true;
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    due: 2,
    sent: 0,
    failed: 0,
    unknown: 2,
    skipped: 0,
  });
});
test("sweeper and storage errors stop dispatch with no provider sends", async () => {
  for (const kind of ["sweep", "storage"]) {
    sweepError = kind === "sweep";
    trackerError = kind === "storage";
    const response = await GET(request());
    assert.equal(response.status, 503);
    assert.equal(sends.length, 0);
  }
});

test("normalizing a numeric chat alias cannot resend an accepted career occurrence", async () => {
  routineEnabled = false;
  const first = await GET(request());
  assert.equal((await first.json()).sent, 1);
  process.env.TELEGRAM_CHAT_ID = "00123456";
  const repeat = await GET(request());
  assert.equal((await repeat.json()).sent, 0);
  assert.equal(sends.length, 1);
});

test("routine-only ticks avoid loading the full dated career plan", async () => {
  clock = baseClock + 12 * 60 * 60_000;
  schedule.time = "18:00";
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sent, 1);
  assert.equal(
    reads.some(
      (url) => url.searchParams.get("key") === "eq.career_command_center",
    ),
    false,
  );
});
