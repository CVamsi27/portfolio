import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveTelegramOwner,
  routineMessage,
  sendTelegramMessage,
  telegramConfigured,
  telegramOwnerEmail,
  validTelegramChatId,
} from "./telegram-server.ts";
import type { RoutineOccurrence } from "./routine-reminders.ts";
import * as telegram from "./telegram-server.ts";

const withEnv = async (
  values: Record<string, string | undefined>,
  run: () => Promise<void> | void,
) => {
  const original = { ...process.env };
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await run();
  } finally {
    process.env = original;
  }
};

const occurrence = (label: string, at: string): RoutineOccurrence => ({
  id: `${label}:${at}`,
  reminderId: label.toLowerCase(),
  label,
  date: "2026-10-03",
  scheduledAt: Date.parse(at),
  type: "supplement",
});

test("telegram configuration requires a bot token and numeric chat", async () => {
  await withEnv(
    {
      TELEGRAM_BOT_TOKEN: "123456789:abcdefghijklmnop",
      TELEGRAM_CHAT_ID: "123456",
    },
    () => assert.equal(telegramConfigured(), true),
  );
  await withEnv(
    { TELEGRAM_BOT_TOKEN: "123456789:abcdefghijklmnop", TELEGRAM_CHAT_ID: "" },
    () => assert.equal(telegramConfigured(), false),
  );
  await withEnv(
    { TELEGRAM_BOT_TOKEN: "short", TELEGRAM_CHAT_ID: "123456" },
    () => assert.equal(telegramConfigured(), false),
  );
});

test("telegram chat ids reject non-numeric values", () => {
  for (const value of ["123", "-100123", " 456 "]) {
    assert.equal(validTelegramChatId(value), true, value);
  }
  for (const value of ["", "0", "abc", "1.2", "+123", null, undefined]) {
    assert.equal(validTelegramChatId(value), false, String(value));
  }
});

test("routine messages group labels, IST time, and the routine link", () => {
  const message = routineMessage([
    occurrence("Lunch", "2026-10-03T08:30:00Z"),
    occurrence("Omega-3 with lunch", "2026-10-03T08:30:00Z"),
  ]);
  assert.match(message, /^NOVA routine · 14:00/);
  assert.match(message, /Lunch \+ Omega-3 with lunch/);
  assert.match(message, /https:\/\/personal\.buildora\.work\/routine/);
});

test("telegram sender posts the configured chat without exposing the token", async () => {
  await withEnv(
    {
      TELEGRAM_BOT_TOKEN: "123456789:abcdefghijklmnop",
      TELEGRAM_CHAT_ID: "-100987654321",
    },
    async () => {
      let request: { url: string; init?: RequestInit } | undefined;
      const fetcher = (async (url: string, init?: RequestInit) => {
        request = { url, init };
        return new Response(
          JSON.stringify({ ok: true, result: { message_id: 73 } }),
          { status: 200 },
        );
      }) as typeof fetch;
      await sendTelegramMessage("NOVA routine · 14:00", fetcher);
      assert.equal(
        request?.url,
        "https://api.telegram.org/bot123456789:abcdefghijklmnop/sendMessage",
      );
      const body = JSON.parse(String(request?.init?.body));
      assert.equal(body.chat_id, "-100987654321");
      assert.equal(body.text, "NOVA routine · 14:00");
      assert.equal(body.disable_web_page_preview, true);
      assert.doesNotMatch(String(request?.init?.body), /abcdefghijklmnop/);
    },
  );
});

test("private destination verification rejects groups, mismatched IDs, and ambiguous metadata", async () => {
  assert.equal(typeof telegram.getPrivateTelegramChat, "function");
  await withEnv(
    {
      TELEGRAM_BOT_TOKEN: "123456789:abcdefghijklmnop",
      TELEGRAM_CHAT_ID: "123456",
    },
    async () => {
      const fetcher = (body: unknown, status = 200) =>
        (async () =>
          new Response(JSON.stringify(body), { status })) as typeof fetch;
      const chat = await telegram.getPrivateTelegramChat(
        fetcher({
          ok: true,
          result: { id: 123456, type: "private", first_name: "Fixture" },
        }),
      );
      assert.match(chat.fingerprint, /^[a-f0-9]{64}$/);
      assert.equal(JSON.stringify(chat).includes("Fixture"), false);
      assert.equal(JSON.stringify(chat).includes("123456"), false);
      for (const body of [
        { ok: true, result: { id: 123456, type: "group" } },
        { ok: true, result: { id: 987654, type: "private" } },
        { ok: true, result: { type: "private" } },
        { ok: false, description: "sensitive provider error" },
      ])
        await assert.rejects(
          () => telegram.getPrivateTelegramChat(fetcher(body)),
          (error: Error) =>
            !/sensitive|123456|abcdefghijklmnop/.test(error.message),
        );
      await assert.rejects(
        () =>
          telegram.getPrivateTelegramChat((async () => {
            throw new Error("token in upstream URL");
          }) as typeof fetch),
        /private chat could not be verified/,
      );
    },
  );
});

test("send outcomes distinguish provider acceptance, definite rejection, and unknown acceptance", async () => {
  assert.equal(typeof telegram.sendTelegramMessageOutcome, "function");
  await withEnv(
    {
      TELEGRAM_BOT_TOKEN: "123456789:abcdefghijklmnop",
      TELEGRAM_CHAT_ID: "123456",
    },
    async () => {
      const fixtures: { body: unknown; status: number; expected: unknown }[] = [
        {
          body: { ok: true, result: { message_id: 73 } },
          status: 200,
          expected: { kind: "accepted", messageId: 73 },
        },
        {
          body: {
            ok: false,
            error_code: 429,
            parameters: { retry_after: 31 },
            description: "sensitive",
          },
          status: 429,
          expected: {
            kind: "rejected",
            code: "telegram-429",
            retryAfterSeconds: 31,
            retryable: true,
          },
        },
        {
          body: { ok: false, error_code: 403, description: "sensitive" },
          status: 403,
          expected: {
            kind: "rejected",
            code: "telegram-403",
            retryable: false,
          },
        },
        {
          body: { ok: false, error_code: 500 },
          status: 500,
          expected: { kind: "unknown", code: "telegram-server-error" },
        },
        {
          body: { ok: true },
          status: 200,
          expected: { kind: "unknown", code: "telegram-invalid-response" },
        },
        {
          body: { ok: true, result: { message_id: 0 } },
          status: 200,
          expected: { kind: "unknown", code: "telegram-invalid-response" },
        },
        {
          body: { ok: false, error_code: 400 },
          status: 200,
          expected: {
            kind: "rejected",
            code: "telegram-400",
            retryable: false,
          },
        },
      ];
      for (const fixture of fixtures) {
        const fetcher = (async () =>
          new Response(JSON.stringify(fixture.body), {
            status: fixture.status,
          })) as typeof fetch;
        assert.deepEqual(
          await telegram.sendTelegramMessageOutcome("fixture", fetcher),
          fixture.expected,
        );
      }
      assert.deepEqual(
        await telegram.sendTelegramMessageOutcome("fixture", (async () => {
          throw new Error("sensitive token");
        }) as typeof fetch),
        { kind: "unknown", code: "telegram-network-error" },
      );
      assert.deepEqual(
        await telegram.sendTelegramMessageOutcome(
          "fixture",
          (async () => new Response("not JSON")) as typeof fetch,
        ),
        { kind: "unknown", code: "telegram-invalid-response" },
      );
    },
  );
});

test("telegram sender rejects failed API responses", async () => {
  await withEnv(
    {
      TELEGRAM_BOT_TOKEN: "123456789:abcdefghijklmnop",
      TELEGRAM_CHAT_ID: "123456",
    },
    async () => {
      const fetcher = (async () =>
        new Response(JSON.stringify({ ok: false }), {
          status: 400,
        })) as typeof fetch;
      await assert.rejects(() => sendTelegramMessage("test", fetcher));
    },
  );
});

test("owner lookup uses the configured email and fails closed when ambiguous", async () => {
  const users = [
    { id: "owner", email: "Owner@Example.com" },
    { id: "other", email: "other@example.com" },
  ];
  const admin = {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users }, error: null }),
      },
    },
  } as unknown as SupabaseClient;
  await withEnv({ TELEGRAM_OWNER_EMAIL: " owner@example.com " }, async () => {
    assert.equal(telegramOwnerEmail(), "owner@example.com");
    assert.equal(await resolveTelegramOwner(admin), "owner");
  });
  await withEnv({ TELEGRAM_OWNER_EMAIL: "other@example.com" }, async () => {
    assert.equal(await resolveTelegramOwner(admin), "other");
  });
  const duplicate = {
    auth: {
      admin: {
        listUsers: async () => ({
          data: {
            users: [
              { id: "a", email: "owner@example.com" },
              { id: "b", email: "owner@example.com" },
            ],
          },
          error: null,
        }),
      },
    },
  } as unknown as SupabaseClient;
  await withEnv({ TELEGRAM_OWNER_EMAIL: "owner@example.com" }, async () => {
    await assert.rejects(() => resolveTelegramOwner(duplicate));
  });
});
