import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dispatchTelegramNotification } from "./telegram-delivery.ts";
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const owner = "00000000-0000-4000-8000-000000000001";
const token = "00000000-0000-4000-8000-000000000002";
const id = "a".repeat(64);
const recipientFingerprint = "b".repeat(64);
const now = Date.parse("2026-10-27T00:30:00Z");
const notification = {
  id,
  kind: "career-digest",
  scheduledAt: now,
  text: "A synthetic daily plan",
};
type Call = { name: string; args: Record<string, unknown> };

function rpcAdapter(
  run: (
    name: string,
    args: Record<string, unknown>,
  ) => { data: unknown; error: unknown },
) {
  return {
    rpc: async (name: string, args: Record<string, unknown>) => run(name, args),
  } as unknown as Pick<SupabaseClient, "rpc">;
}

test("sending is durably armed before transport and acceptance records its provider identifier", async () => {
  const calls: Call[] = [];
  const admin = rpcAdapter((name, args) => {
    calls.push({ name, args });
    return {
      data:
        name === "claim_telegram_delivery"
          ? { status: "claimed", token }
          : true,
      error: null,
    };
  });
  const result = await dispatchTelegramNotification({
    admin,
    owner,
    notification,
    recipientFingerprint,
    now,
    send: async () => {
      assert.deepEqual(
        calls.map((call) => call.name),
        ["claim_telegram_delivery", "arm_telegram_delivery"],
      );
      return { kind: "accepted", messageId: 73 };
    },
  });
  assert.equal(result, "sent");
  assert.equal(calls[0].args.p_delivery, id);
  assert.equal(calls[0].args.p_expires_at, "2026-10-27T00:40:00.000Z");
  assert.deepEqual(calls[2], {
    name: "finish_telegram_delivery",
    args: {
      p_user: owner,
      p_delivery: id,
      p_token: token,
      p_outcome: "sent",
      p_message_id: 73,
      p_error_code: null,
      p_retry_after_seconds: null,
    },
  });
});

test("claim and arm failures do not contact the provider", async () => {
  for (const fixture of [
    {
      claim: { data: { status: "skipped" }, error: null },
      arm: true,
      expected: "skipped",
    },
    {
      claim: { data: { status: "unknown" }, error: null },
      arm: true,
      expected: "unknown",
    },
    {
      claim: { data: null, error: { message: "unavailable" } },
      arm: true,
      expected: "failed",
    },
    {
      claim: { data: { status: "claimed", token }, error: null },
      arm: false,
      expected: "skipped",
    },
  ]) {
    let attempts = 0;
    const admin = rpcAdapter((name) =>
      name === "claim_telegram_delivery"
        ? fixture.claim
        : { data: fixture.arm, error: null },
    );
    const result = await dispatchTelegramNotification({
      admin,
      owner,
      notification,
      recipientFingerprint,
      now,
      send: async () => {
        attempts++;
        return { kind: "accepted", messageId: 73 };
      },
    });
    assert.equal(result, fixture.expected);
    assert.equal(attempts, 0);
  }
});

test("a lost arm acknowledgement leaves acceptance unknown and does not send", async () => {
  let attempted = false;
  const admin = rpcAdapter((name) =>
    name === "claim_telegram_delivery"
      ? { data: { status: "claimed", token }, error: null }
      : { data: null, error: { message: "network" } },
  );
  assert.equal(
    await dispatchTelegramNotification({
      admin,
      owner,
      notification,
      recipientFingerprint,
      now,
      send: async () => {
        attempted = true;
        return { kind: "accepted", messageId: 73 };
      },
    }),
    "unknown",
  );
  assert.equal(attempted, false);
});

test("a lost acceptance acknowledgement is reported unknown without a second send", async () => {
  let attempts = 0;
  const admin = rpcAdapter((name) =>
    name === "claim_telegram_delivery"
      ? { data: { status: "claimed", token }, error: null }
      : name === "arm_telegram_delivery"
        ? { data: true, error: null }
        : { data: null, error: { message: "unavailable" } },
  );
  assert.equal(
    await dispatchTelegramNotification({
      admin,
      owner,
      notification,
      recipientFingerprint,
      now,
      send: async () => {
        attempts++;
        return { kind: "accepted", messageId: 73 };
      },
    }),
    "unknown",
  );
  assert.equal(attempts, 1);
});

test("only definite rate limiting asks the database to schedule a bounded retry", async () => {
  const fixtures = [
    {
      outcome: {
        kind: "rejected" as const,
        code: "telegram-429",
        retryable: true,
        retryAfterSeconds: 31,
      },
      expected: "failed",
      persisted: "retryable",
      retryAfter: 31,
    },
    {
      outcome: {
        kind: "rejected" as const,
        code: "telegram-429",
        retryable: true,
        retryAfterSeconds: Number.MAX_SAFE_INTEGER,
      },
      expected: "failed",
      persisted: "retryable",
      retryAfter: 901,
    },
    {
      outcome: {
        kind: "rejected" as const,
        code: "telegram-403",
        retryable: false,
      },
      expected: "failed",
      persisted: "failed",
      retryAfter: null,
    },
    {
      outcome: { kind: "unknown" as const, code: "telegram-network-error" },
      expected: "unknown",
      persisted: "unknown",
      retryAfter: null,
    },
  ];
  for (const fixture of fixtures) {
    const calls: Call[] = [];
    const admin = rpcAdapter((name, args) => {
      calls.push({ name, args });
      return {
        data:
          name === "claim_telegram_delivery"
            ? { status: "claimed", token }
            : true,
        error: null,
      };
    });
    assert.equal(
      await dispatchTelegramNotification({
        admin,
        owner,
        notification,
        recipientFingerprint,
        now,
        send: async () => fixture.outcome,
      }),
      fixture.expected,
    );
    assert.equal(calls[2].args.p_outcome, fixture.persisted);
    assert.equal(calls[2].args.p_retry_after_seconds, fixture.retryAfter);
  }
});

test("expired and malformed notifications never claim or send", async () => {
  let calls = 0;
  const admin = rpcAdapter(() => {
    calls++;
    return { data: null, error: null };
  });
  for (const value of [
    { ...notification, scheduledAt: now - 600_001 },
    { ...notification, scheduledAt: now + 1 },
    { ...notification, id: "invalid" },
    { ...notification, text: "" },
  ])
    await dispatchTelegramNotification({
      admin,
      owner,
      notification: value,
      recipientFingerprint,
      now,
      send: async () => {
        throw new Error("must not send");
      },
    });
  assert.equal(calls, 0);
});

// Opt in to an isolated local cluster. This never reads application credentials
// or connects to an existing database. CI can run it with PostgreSQL on PATH.
test(
  "PostgreSQL delivery state enforces concurrency, fencing, expiry, and bounded retries",
  {
    skip:
      process.env.TELEGRAM_SQL_TESTS !== "1"
        ? "Set TELEGRAM_SQL_TESTS=1 with PostgreSQL binaries installed."
        : false,
  },
  async (t) => {
    const directory = mkdtempSync("/tmp/telegram-sql-");
    const data = join(directory, "data");
    const asyncExec = promisify(execFile);
    let started = false;
    const args = [
      "-h",
      directory,
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atq",
    ];
    const sql = (input: string) =>
      execFileSync("psql", args, {
        input,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    const sqlAsync = async (input: string) =>
      (await asyncExec("psql", [...args, "-c", input])).stdout.trim();
    const sqlId = (value: number) => value.toString(16).padStart(64, "0");
    const claim = (value: number) =>
      `public.claim_telegram_delivery('${owner}','${sqlId(value)}','career-digest','${recipientFingerprint}',now()-interval '1 second',now()+interval '9 minutes')`;
    try {
      execFileSync(
        "initdb",
        [
          "-D",
          data,
          "--no-locale",
          "-E",
          "UTF8",
          "-U",
          "postgres",
          "-A",
          "trust",
        ],
        { stdio: "pipe" },
      );
      execFileSync(
        "pg_ctl",
        [
          "-D",
          data,
          "-l",
          join(directory, "postgres.log"),
          "-o",
          `-k ${directory} -c listen_addresses=''`,
          "-w",
          "start",
        ],
        { stdio: "pipe" },
      );
      started = true;
      sql(`create role authenticated; create role anon; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as 'select null::uuid';
      insert into auth.users values ('${owner}');
      ${readFileSync(new URL("../../supabase/migrations/0008_routine_push.sql", import.meta.url), "utf8")}
      grant usage on schema public to authenticated,anon,service_role;
      grant all on public.push_deliveries to authenticated,anon,service_role;`);
      // Applying the actual migration is part of the behavior test, not a textual assertion.
      const migration = new URL(
        "../../supabase/migrations/0015_telegram_delivery_state.sql",
        import.meta.url,
      );
      sql(
        existsSync(migration) ? readFileSync(migration, "utf8") : "select 1;",
      );

      await t.test(
        "concurrent claimants receive exactly one token and stale tokens cannot arm or finish",
        async () => {
          const results = await Promise.all([
            sqlAsync(`select ${claim(1)};`),
            sqlAsync(`select ${claim(1)};`),
          ]);
          const claims = results.map((value) => JSON.parse(value));
          assert.equal(
            claims.filter((value) => value.status === "claimed").length,
            1,
          );
          const firstToken = claims.find(
            (value) => value.status === "claimed",
          ).token;
          assert.equal(
            sql(
              `select public.arm_telegram_delivery('${owner}','${sqlId(1)}','${token}');`,
            ),
            "f",
          );
          sql(
            `update public.push_deliveries set lease_until=now()-interval '1 second' where delivery_id='${sqlId(1)}';`,
          );
          const reclaimed = JSON.parse(sql(`select ${claim(1)};`));
          assert.equal(reclaimed.status, "claimed");
          assert.notEqual(reclaimed.token, firstToken);
          assert.equal(
            sql(
              `select public.arm_telegram_delivery('${owner}','${sqlId(1)}','${firstToken}');`,
            ),
            "f",
          );
          assert.equal(
            sql(
              `select public.arm_telegram_delivery('${owner}','${sqlId(1)}','${reclaimed.token}');`,
            ),
            "t",
          );
          assert.equal(
            sql(
              `select public.finish_telegram_delivery('${owner}','${sqlId(1)}','${firstToken}','sent',73,null,null);`,
            ),
            "f",
          );
          assert.equal(
            sql(
              `select public.finish_telegram_delivery('${owner}','${sqlId(1)}','${reclaimed.token}','sent',73,null,null);`,
            ),
            "t",
          );
          assert.equal(
            sql(
              `select status||':'||attempt_count||':'||provider_message_id from public.push_deliveries where delivery_id='${sqlId(1)}';`,
            ),
            "sent:1:73",
          );
          assert.equal(
            JSON.parse(sql(`select ${claim(1)};`)).status,
            "skipped",
          );
        },
      );

      await t.test(
        "expired sending and legacy pending are unknown and never reclaimed",
        () => {
          const current = JSON.parse(sql(`select ${claim(2)};`));
          sql(`select public.arm_telegram_delivery('${owner}','${sqlId(2)}','${current.token}');
        update public.push_deliveries set lease_until=now()-interval '1 second' where delivery_id='${sqlId(2)}';`);
          assert.equal(
            JSON.parse(sql(`select ${claim(2)};`)).status,
            "unknown",
          );
          assert.equal(
            JSON.parse(sql(`select ${claim(2)};`)).status,
            "unknown",
          );
          sql(
            `insert into public.push_deliveries(user_id,delivery_id,lease_until) values('${owner}','${sqlId(3)}',now()-interval '1 second');`,
          );
          assert.equal(
            JSON.parse(sql(`select ${claim(3)};`)).status,
            "unknown",
          );
          assert.equal(
            sql(
              `select count(*) from public.push_deliveries where status='unknown' and unknown_at is not null;`,
            ),
            "2",
          );
        },
      );

      await t.test(
        "definite 429 obeys retry delay and stops after three attempts",
        () => {
          for (let attempt = 1; attempt <= 3; attempt++) {
            const current = JSON.parse(sql(`select ${claim(4)};`));
            assert.equal(current.status, "claimed");
            assert.equal(
              sql(
                `select public.arm_telegram_delivery('${owner}','${sqlId(4)}','${current.token}');`,
              ),
              "t",
            );
            sql(
              `select public.finish_telegram_delivery('${owner}','${sqlId(4)}','${current.token}','retryable',null,'telegram-429',31);`,
            );
            assert.equal(
              JSON.parse(sql(`select ${claim(4)};`)).status,
              "skipped",
            );
            assert.equal(
              sql(
                `select (next_attempt_at >= attempted_at+interval '31 seconds')::text from public.push_deliveries where delivery_id='${sqlId(4)}';`,
              ),
              attempt < 3 ? "true" : "",
            );
            sql(
              `update public.push_deliveries set next_attempt_at=case when next_attempt_at is null then null else now()-interval '1 second' end where delivery_id='${sqlId(4)}';`,
            );
          }
          assert.equal(
            JSON.parse(sql(`select ${claim(4)};`)).status,
            "skipped",
          );
          assert.equal(
            sql(
              `select status||':'||attempt_count from public.push_deliveries where delivery_id='${sqlId(4)}';`,
            ),
            "failed:3",
          );
        },
      );

      await t.test(
        "a retry beyond occurrence expiry is terminal and recipient changes cannot resend",
        () => {
          const current = JSON.parse(sql(`select ${claim(5)};`));
          sql(`select public.arm_telegram_delivery('${owner}','${sqlId(5)}','${current.token}');
        select public.finish_telegram_delivery('${owner}','${sqlId(5)}','${current.token}','retryable',null,'telegram-429',99999);`);
          assert.equal(
            JSON.parse(sql(`select ${claim(5)};`)).status,
            "skipped",
          );
          assert.equal(
            sql(
              `select next_attempt_at is null from public.push_deliveries where delivery_id='${sqlId(5)}';`,
            ),
            "t",
          );
          const changed = `public.claim_telegram_delivery('${owner}','${sqlId(5)}','career-digest','${"c".repeat(64)}',now()-interval '1 second',now()+interval '9 minutes')`;
          assert.equal(JSON.parse(sql(`select ${changed};`)).status, "skipped");
        },
      );

      await t.test(
        "legacy routine claims remain available and unauthenticated roles cannot call Telegram RPCs",
        () => {
          assert.equal(
            sql(
              `select public.claim_routine_push('${owner}','legacy-web-push');`,
            ),
            "t",
          );
          assert.equal(
            sql(
              `select public.claim_routine_push('${owner}','legacy-web-push');`,
            ),
            "f",
          );
          for (const role of ["authenticated", "anon"]) {
            assert.equal(
              sql(
                `select has_function_privilege('${role}','public.claim_telegram_delivery(uuid,text,text,text,timestamp with time zone,timestamp with time zone)','execute');`,
              ),
              "f",
            );
            assert.equal(
              sql(
                `set role ${role}; select count(*) from public.push_deliveries;`,
              ),
              "0",
            );
          }
          assert.equal(
            sql(
              `select has_function_privilege('service_role','public.claim_telegram_delivery(uuid,text,text,text,timestamp with time zone,timestamp with time zone)','execute');`,
            ),
            "t",
          );
          const serviceClaim = JSON.parse(
            sql(`set role service_role; select ${claim(6)};`),
          );
          assert.equal(serviceClaim.status, "claimed");
        },
      );

      await t.test(
        "scheduler sweep expires only annotated owner Telegram sends and retains the history",
        () => {
          const current = JSON.parse(sql(`select ${claim(7)};`));
          sql(`select public.arm_telegram_delivery('${owner}','${sqlId(7)}','${current.token}');
        update public.push_deliveries set lease_until=now()-interval '1 second' where delivery_id='${sqlId(7)}';
        insert into public.push_deliveries(user_id,delivery_id,status,lease_until) values
          ('${owner}','unrelated-web-push','pending',now()-interval '1 second');`);
          assert.equal(
            sql(`select public.expire_telegram_deliveries('${owner}');`),
            "1",
          );
          assert.equal(
            sql(
              `select status from public.push_deliveries where delivery_id='${sqlId(7)}';`,
            ),
            "unknown",
          );
          assert.equal(
            sql(
              `select status from public.push_deliveries where delivery_id='unrelated-web-push';`,
            ),
            "pending",
          );
          assert.equal(
            sql(`select public.expire_telegram_deliveries('${owner}');`),
            "0",
          );
          assert.equal(
            sql(
              `select has_function_privilege('authenticated','public.expire_telegram_deliveries(uuid)','execute');`,
            ),
            "f",
          );
        },
      );

      await t.test(
        "sweep retires expired pre-send claims and retry timers while preserving reclaimable claims",
        () => {
          sql(`select ${claim(9)}; select ${claim(10)};`);
          const retry = JSON.parse(sql(`select ${claim(11)};`));
          sql(`select public.arm_telegram_delivery('${owner}','${sqlId(11)}','${retry.token}');
        select public.finish_telegram_delivery('${owner}','${sqlId(11)}','${retry.token}','retryable',null,'telegram-429',31);
        update public.push_deliveries set expires_at=now()-interval '1 second' where delivery_id in ('${sqlId(9)}','${sqlId(11)}');
        update public.push_deliveries set lease_until=now()-interval '1 second' where delivery_id='${sqlId(10)}';`);
          assert.equal(
            sql(`select public.expire_telegram_deliveries('${owner}');`),
            "2",
          );
          assert.equal(
            sql(
              `select status||':'||last_error_code from public.push_deliveries where delivery_id='${sqlId(9)}';`,
            ),
            "failed:telegram-expired-before-send",
          );
          assert.equal(
            sql(
              `select next_attempt_at is null from public.push_deliveries where delivery_id='${sqlId(11)}';`,
            ),
            "t",
          );
          assert.equal(
            JSON.parse(sql(`select ${claim(10)};`)).status,
            "claimed",
          );
        },
      );

      await t.test(
        "driver keeps an accepted but unacknowledged send fenced across subsequent scheduler calls",
        async () => {
          const argument = (value: unknown) =>
            value === null
              ? "null"
              : `'${String(value).replaceAll("'", "''")}'`;
          const parameters: Record<string, string[]> = {
            claim_telegram_delivery: [
              "p_user",
              "p_delivery",
              "p_kind",
              "p_recipient_fingerprint",
              "p_scheduled_at",
              "p_expires_at",
            ],
            arm_telegram_delivery: ["p_user", "p_delivery", "p_token"],
            finish_telegram_delivery: [
              "p_user",
              "p_delivery",
              "p_token",
              "p_outcome",
              "p_message_id",
              "p_error_code",
              "p_retry_after_seconds",
            ],
          };
          const admin = rpcAdapter((name, args) => {
            if (name === "finish_telegram_delivery")
              return {
                data: null,
                error: {
                  message:
                    "simulated lost DB connection before acknowledgement",
                },
              };
            const value = sql(
              `set role service_role; select public.${name}(${parameters[name].map((key) => argument(args[key])).join(",")});`,
            );
            return {
              data:
                value === "t"
                  ? true
                  : value === "f"
                    ? false
                    : JSON.parse(value),
              error: null,
            };
          });
          const clock = Date.now();
          const currentNotification = {
            ...notification,
            id: sqlId(8),
            scheduledAt: clock - 1000,
          };
          let sent = 0;
          const options = {
            admin,
            owner,
            notification: currentNotification,
            recipientFingerprint,
            now: clock,
            send: async () => {
              sent++;
              return { kind: "accepted" as const, messageId: 73 };
            },
          };
          assert.equal(await dispatchTelegramNotification(options), "unknown");
          assert.equal(await dispatchTelegramNotification(options), "skipped");
          sql(
            `update public.push_deliveries set lease_until=now()-interval '1 second' where delivery_id='${sqlId(8)}';`,
          );
          assert.equal(await dispatchTelegramNotification(options), "unknown");
          assert.equal(sent, 1);
          assert.equal(
            sql(
              `select status||':'||attempt_count from public.push_deliveries where delivery_id='${sqlId(8)}';`,
            ),
            "unknown:1",
          );
        },
      );
    } finally {
      if (started)
        execFileSync("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"], {
          stdio: "pipe",
        });
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
