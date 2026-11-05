#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY;
const service =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const expectedRef = process.env.EXPECTED_SUPABASE_REF;
let projectHost = "";
try {
  projectHost = new URL(url).hostname;
} catch {
  // Invalid or missing URL is rejected below.
}

if (process.env.ALLOW_PROD_SYNC_VERIFY !== "1") {
  console.error("Refusing to run: set ALLOW_PROD_SYNC_VERIFY=1.");
  process.exit(1);
}
if (!url || !anon || !service) {
  console.error("Missing Supabase URL, publishable key or service key.");
  process.exit(1);
}
if (!expectedRef || projectHost !== `${expectedRef}.supabase.co`) {
  console.error("EXPECTED_SUPABASE_REF does not match the configured project.");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const recordKeys = [
  "career:research",
  "career:opportunities",
  "career:activities",
  "routine:schedules",
  "routine:history",
  "recovery:entries",
  "habits:items",
  "habits:history",
  "plan:blocks",
  "plan:days",
  "nutrition:entries",
  "nutrition:foods",
  "nutrition:recipes",
  "nutrition:targets",
  "nutrition:programs",
  "nutrition:days",
  "nutrition:templates",
  "nutrition:batches",
];
const genericProbe = (id) => ({
  id,
  record: (updatedAt, label, deleted) => ({
    updatedAt,
    label,
    ...(deleted ? { deleted: true } : {}),
  }),
});
const validFood = {
  id: "probe-food",
  name: "Probe food",
  source: "release-check",
  basisAmount: 100,
  basisUnit: "g",
  updatedAt: 1,
  nutrients: { energy: 100, protein: 1, carbs: 1, fat: 1 },
};
const validProgramDays = Array.from({ length: 7 }, () => ({
  energy: 2000,
  protein: 100,
  carbs: 200,
  fat: 70,
}));
const probes = {
  "career:research": {
    id: "probe-career-research",
    record: (updatedAt, label, deleted) => ({
      id: "probe-career-research",
      company: "Synthetic verification employer",
      title: "Full-stack engineer",
      roleUrl: "https://example.test/jobs/probe",
      kind: "employment",
      location: "India remote",
      availability: "active",
      checkedOn: "2026-11-05",
      eligibility: "clarify",
      eligibilityEvidence: "Synthetic cloud merge verification only.",
      fit: [],
      gaps: [],
      questions: [],
      suggestedAction: "Verify the role",
      rank: 1,
      compensation: "Unconfirmed",
      contacts: [],
      draft: "Unsent",
      updatedAt,
      label,
      ...(deleted ? { deleted: true } : {}),
    }),
  },
  "career:opportunities": {
    id: "probe-career-opportunity",
    record: (updatedAt, label, deleted) => ({
      id: "probe-career-opportunity",
      stage: "research",
      priority: 1,
      draft: "Unsent",
      notes: "",
      nextAction: "Review exact requirements",
      followUpOn: null,
      scope: "",
      terms: "",
      weeklyHours: "",
      startOn: null,
      firstPaymentOn: null,
      updatedAt,
      label,
      ...(deleted ? { deleted: true } : {}),
    }),
  },
  "career:activities": {
    id: "probe-career-activity",
    record: (updatedAt, label, deleted) => ({
      id: "probe-career-activity",
      opportunityId: "probe-career-opportunity",
      kind: "note",
      date: "2026-11-05",
      reference: "",
      note: "Synthetic verification note",
      updatedAt,
      label,
      ...(deleted ? { deleted: true } : {}),
    }),
  },
  "routine:schedules": genericProbe("probe-routine-schedules"),
  "routine:history": genericProbe("probe-routine-history"),
  "recovery:entries": genericProbe("probe-recovery-entries"),
  "habits:items": genericProbe("probe-habits-items"),
  "habits:history": genericProbe("probe-habits-history"),
  "plan:blocks": genericProbe("probe-plan-blocks"),
  "plan:days": genericProbe("probe-plan-days"),
  "nutrition:entries": genericProbe("probe-nutrition-entries"),
  "nutrition:foods": genericProbe("probe-nutrition-foods"),
  "nutrition:recipes": genericProbe("probe-nutrition-recipes"),
  "nutrition:targets": genericProbe("probe-nutrition-targets"),
  "nutrition:programs": {
    id: "probe-nutrition-programs",
    record: (updatedAt, label, deleted) => ({
      id: "probe-nutrition-programs",
      startDate: "2026-10-19",
      mode: "manual",
      goal: "maintain",
      days: validProgramDays,
      updatedAt,
      label,
      ...(deleted ? { deleted: true } : {}),
    }),
  },
  "nutrition:days": {
    id: "2026-10-19",
    record: (updatedAt, label, deleted) => ({
      id: "2026-10-19",
      status: "partial",
      updatedAt,
      label,
      ...(deleted ? { deleted: true } : {}),
    }),
  },
  "nutrition:templates": {
    id: "probe-nutrition-templates",
    record: (updatedAt, label, deleted) => ({
      id: "probe-nutrition-templates",
      name: "Probe template",
      items: [{ food: validFood, quantity: 1 }],
      updatedAt,
      label,
      ...(deleted ? { deleted: true } : {}),
    }),
  },
  "nutrition:batches": {
    id: "probe-nutrition-batches",
    record: (updatedAt, label, deleted) => ({
      id: "probe-nutrition-batches",
      preparedDate: "2026-10-19",
      recipe: {
        ...validFood,
        ingredients: [
          {
            name: "Probe ingredient",
            quantity: 100,
            unit: "g",
            nutrients: { energy: 100, protein: 1, carbs: 1, fat: 1 },
          },
        ],
      },
      updatedAt,
      label,
      ...(deleted ? { deleted: true } : {}),
    }),
  },
};
const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const password = randomUUID();
const userIds = [];
let verified = 0;

function pass(name) {
  verified += 1;
  console.log(`ok   ${name}`);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createUser(label) {
  const email = `release-sync-${suffix}-${label}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userIds.push(data.user.id);
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function cleanup() {
  for (const id of userIds) {
    await admin.from("push_subscriptions").delete().eq("user_id", id);
    await admin.from("tracker_data").delete().eq("user_id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error)
      console.error(`cleanup user ${id.slice(0, 8)}: ${error.message}`);
  }
}

try {
  const a = await createUser("a");
  const b = await createUser("b");
  pass("created two ephemeral users");

  const { error: insertError } = await a.client.from("tracker_data").upsert(
    {
      user_id: a.id,
      key: "release:probe",
      value: { owner: "a" },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" },
  );
  assert(!insertError, `A could not write its row: ${insertError?.message}`);
  pass("A writes its own row");

  const { data: leaked } = await b.client
    .from("tracker_data")
    .select("key")
    .eq("user_id", a.id);
  assert((leaked ?? []).length === 0, "B can read A's rows");
  pass("B cannot read A's rows");

  const { error: crossInsert } = await b.client.from("tracker_data").insert({
    user_id: a.id,
    key: "release:cross",
    value: {},
    updated_at: new Date().toISOString(),
  });
  assert(Boolean(crossInsert), "B inserted a row owned by A");
  pass("B cannot insert as A");

  const { data: updated } = await b.client
    .from("tracker_data")
    .update({ value: { hacked: true } })
    .eq("user_id", a.id)
    .select();
  assert((updated ?? []).length === 0, "B updated A's row");
  const { data: aRow } = await a.client
    .from("tracker_data")
    .select("value")
    .eq("key", "release:probe")
    .maybeSingle();
  assert(aRow?.value?.owner === "a", "A's row changed");
  pass("B cannot update A's rows");

  for (const key of recordKeys) {
    const probe = probes[key];
    const merge = (updatedAt, label, deleted = false) =>
      a.client.rpc("merge_tracker_records", {
        p_owner: a.id,
        p_key: key,
        p_records: {
          [probe.id]: probe.record(updatedAt, label, deleted),
        },
      });

    const first = await merge(1, "older");
    assert(
      !first.error && first.data?.[probe.id]?.label === "older",
      `${key}: first merge failed ${first.error?.message ?? ""}`,
    );

    const stale = await merge(0, "stale");
    assert(
      stale.data?.[probe.id]?.label === "older",
      `${key}: stale merge won`,
    );

    const newer = await merge(2, "newer");
    assert(
      newer.data?.[probe.id]?.label === "newer",
      `${key}: newer merge lost`,
    );

    const tombstone = await merge(2, "newer", true);
    assert(
      tombstone.data?.[probe.id]?.deleted === true,
      `${key}: tombstone lost`,
    );

    pass(`merge semantics ${key}`);
  }

  const { error: crossMerge } = await b.client.rpc("merge_tracker_records", {
    p_owner: a.id,
    p_key: "routine:schedules",
    p_records: { probe: { updatedAt: 1 } },
  });
  assert(Boolean(crossMerge), "B merged into A's collection");
  pass("merge is owner-only");

  const anonymous = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (const key of [
    "career:research",
    "career:opportunities",
    "career:activities",
  ]) {
    const probe = probes[key];
    const request = {
      p_owner: a.id,
      p_key: key,
      p_records: { [probe.id]: probe.record(3, "forbidden") },
    };
    assert(
      Boolean((await b.client.rpc("merge_tracker_records", request)).error),
      `${key}: cross-owner merge succeeded`,
    );
    assert(
      Boolean((await anonymous.rpc("merge_tracker_records", request)).error),
      `${key}: anonymous merge succeeded`,
    );
    pass(`private access ${key}`);
  }
  const badResearch = await a.client.rpc("merge_tracker_records", {
    p_owner: a.id,
    p_key: "career:research",
    p_records: {
      "probe-career-research": {
        ...probes["career:research"].record(3, "invalid"),
        roleUrl: "javascript:alert(1)",
      },
    },
  });
  assert(Boolean(badResearch.error), "Unsafe career research URL was accepted");
  pass("career research validation");

  console.log(
    JSON.stringify({ verified, users: 2, keys: recordKeys.length }, null, 2),
  );
} finally {
  try {
    await cleanup();
    if (userIds.length) {
      const { data: residue } = await admin
        .from("tracker_data")
        .select("user_id")
        .in("user_id", userIds);
      assert((residue ?? []).length === 0, "cleanup left probe rows");
    }
    console.log("cleanup ok: no probe rows remain");
  } catch (error) {
    console.error(`cleanup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
