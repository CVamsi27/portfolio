import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyOwnerRelease,
  reviseCareerDigestPreferences,
} from "./owner-release.ts";

type Row = { key: string; value: unknown; updated_at: string };
type Write = { key: string; version: string; owner: string };
const owner = "synthetic-owner";
const initialRows = (): Row[] => [
  {
    key: "career_command_center",
    value: { revision: "old" },
    updated_at: "career-v1",
  },
  {
    key: "timetable_100_days",
    value: { revision: "old", note: "original" },
    updated_at: "timetable-v1",
  },
  { key: "reminders", value: { enabled: false }, updated_at: "reminders-v1" },
];
const changes = () => [
  {
    key: "career_command_center",
    value: { revision: "new" },
    version: "career-v1",
  },
  {
    key: "timetable_100_days",
    value: { revision: "new", note: "original" },
    version: "timetable-v1",
  },
];

// The external boundary models owner/key/version filtering; backups use the real filesystem.
function store(rows: Row[], afterWrite?: (key: string, rows: Row[]) => void) {
  const state = {
    rows: structuredClone(rows),
    attempts: [] as Write[],
    reads: 0,
  };
  const client = {
    from(table: string) {
      assert.equal(table, "tracker_data");
      return {
        update(update: { value: unknown; updated_at: string }) {
          const filters = new Map<string, string>();
          const query = {
            eq(column: string, value: string) {
              filters.set(column, value);
              return query;
            },
            select(columns: string) {
              assert.equal(columns, "key");
              return {
                async maybeSingle() {
                  const attempt = {
                    key: filters.get("key")!,
                    version: filters.get("updated_at")!,
                    owner: filters.get("user_id")!,
                  };
                  state.attempts.push(attempt);
                  const row = state.rows.find(
                    (candidate) => candidate.key === attempt.key,
                  );
                  if (
                    attempt.owner !== owner ||
                    !row ||
                    (filters.has("updated_at") &&
                      row.updated_at !== attempt.version)
                  )
                    return { data: null, error: null };
                  row.value = structuredClone(update.value);
                  row.updated_at = update.updated_at;
                  afterWrite?.(row.key, state.rows);
                  return { data: { key: row.key }, error: null };
                },
              };
            },
          };
          return query;
        },
        select(columns: string) {
          assert.equal(columns, "key,value,updated_at");
          return {
            async eq(column: string, value: string) {
              assert.equal(column, "user_id");
              assert.equal(value, owner);
              state.reads++;
              return { data: structuredClone(state.rows), error: null };
            },
          };
        },
      };
    },
  };
  return { state, client: client as unknown as Pick<SupabaseClient, "from"> };
}

test("a second-row CAS conflict retains the original backup and reports the first applied key", async () => {
  // Removing the version filter would overwrite the concurrent timetable edit.
  const before = initialRows();
  const { state, client } = store(before, (key, rows) => {
    if (key !== "career_command_center") return;
    Object.assign(rows[1], {
      value: { revision: "old", note: "concurrent edit" },
      updated_at: "timetable-v2",
    });
    Object.assign(rows[2], {
      value: { enabled: true },
      updated_at: "reminders-v2",
    });
  });
  const dir = mkdtempSync(join(tmpdir(), "owner-release-"));
  const backupPath = join(dir, "before.json");
  try {
    await assert.rejects(
      () =>
        applyOwnerRelease({
          client,
          owner,
          before,
          changes: changes(),
          backupPath,
        }),
      (error: Error) => {
        assert.match(error.message, /applied keys: career_command_center\./);
        assert.match(error.message, /Concurrent change in timetable_100_days/);
        return true;
      },
    );
    assert.deepEqual(JSON.parse(readFileSync(backupPath, "utf8")), before);
    assert.equal(statSync(backupPath).mode & 0o777, 0o600);
    assert.deepEqual(
      state.rows.map((row) => row.value),
      [
        { revision: "new" },
        { revision: "old", note: "concurrent edit" },
        { enabled: true },
      ],
    );
    assert.deepEqual(state.attempts, [
      { key: "career_command_center", version: "career-v1", owner },
      { key: "timetable_100_days", version: "timetable-v1", owner },
    ]);
    assert.equal(state.reads, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fresh-version reconciliation applies only the remaining row and preserves concurrent data", async () => {
  // Replaying the original snapshot would clobber the concurrent note or reject the fresh version.
  const before = initialRows();
  const { state, client } = store(before, (key, rows) => {
    if (key !== "career_command_center") return;
    Object.assign(rows[1], {
      value: { revision: "old", note: "concurrent edit" },
      updated_at: "timetable-v2",
    });
    Object.assign(rows[2], {
      value: { enabled: true },
      updated_at: "reminders-v2",
    });
  });
  const dir = mkdtempSync(join(tmpdir(), "owner-release-repair-"));
  const originalBackup = join(dir, "original-before.json");
  const backupPath = join(dir, "fresh-before.json");
  try {
    await assert.rejects(
      () =>
        applyOwnerRelease({
          client,
          owner,
          before,
          changes: changes(),
          backupPath: originalBackup,
        }),
      /Concurrent change in timetable_100_days/,
    );
    const { data, error } = await client
      .from("tracker_data")
      .select("key,value,updated_at")
      .eq("user_id", owner);
    assert.equal(error, null);
    assert.ok(data);
    const fresh = data as Row[];
    const currentTimetable = fresh.find(
      (row) => row.key === "timetable_100_days",
    )!;
    const result = await applyOwnerRelease({
      client,
      owner,
      before: fresh,
      backupPath,
      changes: [
        {
          key: currentTimetable.key,
          value: {
            ...(currentTimetable.value as Record<string, unknown>),
            revision: "new",
          },
          version: currentTimetable.updated_at,
        },
      ],
    });
    assert.deepEqual(result, {
      appliedKeys: ["timetable_100_days"],
      untouchedRows: 2,
    });
    assert.deepEqual(state.attempts, [
      { key: "career_command_center", version: "career-v1", owner },
      { key: "timetable_100_days", version: "timetable-v1", owner },
      { key: "timetable_100_days", version: "timetable-v2", owner },
    ]);
    assert.deepEqual(state.rows[0], fresh[0]);
    assert.deepEqual(state.rows[1].value, {
      revision: "new",
      note: "concurrent edit",
    });
    assert.deepEqual(state.rows[2], fresh[2]);
    assert.equal(state.reads, 2);
    assert.deepEqual(JSON.parse(readFileSync(originalBackup, "utf8")), before);
    assert.deepEqual(JSON.parse(readFileSync(backupPath, "utf8")), fresh);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a no-op makes no account requests and creates no backup", async () => {
  // Moving backup creation above the no-op guard would create an unnecessary private snapshot.
  const before = initialRows();
  const { state, client } = store(before);
  const dir = mkdtempSync(join(tmpdir(), "owner-release-noop-"));
  const backupPath = join(dir, "before.json");
  try {
    assert.deepEqual(
      await applyOwnerRelease({
        client,
        owner,
        before,
        changes: [],
        backupPath,
      }),
      { appliedKeys: [], untouchedRows: 3 },
    );
    assert.equal(existsSync(backupPath), false);
    assert.deepEqual(state.attempts, []);
    assert.equal(state.reads, 0);
    assert.deepEqual(state.rows, before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an existing backup is retained and prevents every account write", async () => {
  // Dropping exclusive backup creation or writing before backup would destroy recovery evidence.
  const before = initialRows();
  const { state, client } = store(before);
  const dir = mkdtempSync(join(tmpdir(), "owner-release-backup-"));
  const backupPath = join(dir, "before.json");
  writeFileSync(backupPath, "retained backup\n", { mode: 0o600 });
  try {
    await assert.rejects(
      () =>
        applyOwnerRelease({
          client,
          owner,
          before,
          changes: changes(),
          backupPath,
        }),
      /EEXIST/,
    );
    assert.equal(readFileSync(backupPath, "utf8"), "retained backup\n");
    assert.deepEqual(state.attempts, []);
    assert.deepEqual(state.rows, before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const mismatch of ["changed row", "untouched row", "row count"] as const) {
  test(`full-owner readback rejects mismatched ${mismatch} after writes`, async () => {
    // Checking only changed rows (or only their keys) would miss corrupted or concurrent owner values.
    const before = initialRows();
    const { state, client } = store(before, (key, rows) => {
      if (key !== "timetable_100_days") return;
      if (mismatch === "row count")
        rows.push({
          key: "new-row",
          value: { saved: true },
          updated_at: "new-v1",
        });
      else
        rows[mismatch === "changed row" ? 0 : 2].value = { concurrent: true };
    });
    const dir = mkdtempSync(join(tmpdir(), "owner-release-readback-"));
    const backupPath = join(dir, "before.json");
    try {
      await assert.rejects(
        () =>
          applyOwnerRelease({
            client,
            owner,
            before,
            changes: changes(),
            backupPath,
          }),
        (error: Error) => {
          assert.match(
            error.message,
            /applied keys: career_command_center, timetable_100_days\./,
          );
          assert.match(
            error.message,
            mismatch === "row count"
              ? /row count changed/
              : new RegExp(
                  `Readback mismatch.*${mismatch === "changed row" ? "career_command_center" : "reminders"}`,
                ),
          );
          return true;
        },
      );
      assert.equal(state.reads, 1);
      assert.deepEqual(JSON.parse(readFileSync(backupPath, "utf8")), before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("digest clock migration preserves opt-in, cadence, activation and catch-up choices", () => {
  const preferences = {
    version: 1,
    enabled: true,
    cadence: "digest-and-learning",
    digestTime: "06:00",
    timezone: "Asia/Kolkata",
    catchUpMinutes: 10,
    enabledAt: "2026-10-27T12:07:10.097Z",
  };
  assert.deepEqual(reviseCareerDigestPreferences(preferences, "07:00"), {
    ...preferences,
    digestTime: "07:00",
  });
  assert.equal(preferences.digestTime, "06:00");
  assert.throws(() => reviseCareerDigestPreferences(preferences, "25:00"));
  assert.throws(() => reviseCareerDigestPreferences(null, "07:00"));
});
