import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const owner = "10000000-0000-4000-8000-000000000001";
const other = "10000000-0000-4000-8000-000000000002";
const research = {
  id: "synthetic-role",
  company: "Example Engineering",
  title: "Full-stack engineer",
  roleUrl: "https://example.test/jobs/one",
  kind: "employment",
  location: "India remote",
  availability: "active",
  checkedOn: "2026-11-05",
  eligibility: "eligible",
  eligibilityEvidence: "The exact listing permits remote work from India.",
  fit: ["React and Node"],
  gaps: ["Vue ramp"],
  questions: ["Start date?"],
  suggestedAction: "Review and apply",
  rank: 1,
  compensation: "Unconfirmed",
  contacts: [{ name: "Hiring team", url: "mailto:hiring@example.test" }],
  draft: "An unsent application draft.",
  updatedAt: 1,
};
const opportunity = {
  id: research.id,
  stage: "ready",
  priority: 1,
  draft: "Unsent",
  notes: "",
  nextAction: "Review application",
  followUpOn: null,
  scope: "",
  terms: "",
  weeklyHours: "",
  startOn: null,
  firstPaymentOn: null,
  updatedAt: 1,
};
const application = {
  id: "application-one",
  opportunityId: research.id,
  kind: "application",
  date: "2026-11-05",
  reference: "Confirmation received from employer",
  note: "Applied manually",
  updatedAt: 1,
};

test(
  "career SQL merges are private, validated and preserve existing collection behavior",
  {
    skip:
      process.env.CAREER_SQL_TESTS !== "1"
        ? "Set CAREER_SQL_TESTS=1 with local PostgreSQL binaries."
        : false,
  },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), "nova-career-sql-"));
    const data = join(directory, "data");
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
    let started = false;
    const sql = (input: string) =>
      execFileSync("psql", args, {
        input,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    const asUser = (user: string | null, input: string) =>
      sql(
        `set role authenticated; set "request.jwt.claim.sub" = '${user ?? ""}'; ${input}`,
      );
    const mergeSql = (key: string, records: unknown, user = owner) =>
      `select public.merge_tracker_records('${user}', '${key}', '${JSON.stringify(records).replaceAll("'", "''")}'::jsonb);`;
    const merge = (key: string, records: unknown) =>
      JSON.parse(asUser(owner, mergeSql(key, records)));
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
      sql(`create role authenticated; create role anon; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table public.tracker_data(user_id uuid not null, key text not null, value jsonb not null default '{}', updated_at timestamptz not null default now(), primary key(user_id,key));
      alter table public.tracker_data enable row level security;
      create policy owner_only on public.tracker_data for all to authenticated using (auth.uid()=user_id) with check(auth.uid()=user_id);
      grant usage on schema public,auth to authenticated,anon;
      grant select,insert,update on public.tracker_data to authenticated;
      ${readFileSync(new URL("../supabase/migrations/0014_nutrition_reuse_records.sql", import.meta.url), "utf8")}`);
      const migration = new URL(
        "../supabase/migrations/0016_career_workflow_records.sql",
        import.meta.url,
      );
      if (existsSync(migration)) {
        sql(readFileSync(migration, "utf8"));
        // A repeated migration must not rename the wrapper into its own delegate.
        sql(readFileSync(migration, "utf8"));
      }

      await t.test(
        "newer records win, stale records lose and equal-time tombstones survive",
        () => {
          const first = merge("career:research", { [research.id]: research });
          assert.equal(first[research.id].company, "Example Engineering");
          assert.equal(
            merge("career:research", {
              [research.id]: { ...research, company: "Stale", updatedAt: 0 },
            })[research.id].company,
            "Example Engineering",
          );
          assert.equal(
            merge("career:research", {
              [research.id]: { ...research, company: "Updated", updatedAt: 2 },
            })[research.id].company,
            "Updated",
          );
          assert.equal(
            merge("career:research", {
              [research.id]: { ...research, updatedAt: 2, deleted: true },
            })[research.id].deleted,
            true,
          );
          assert.equal(
            merge("career:opportunities", { [opportunity.id]: opportunity })[
              opportunity.id
            ].stage,
            "ready",
          );
          assert.equal(
            merge("career:activities", { [application.id]: application })[
              application.id
            ].kind,
            "application",
          );
        },
      );
      await t.test(
        "malformed records are rejected before any collection is written",
        () => {
          const unsafe = [
            { ...research, roleUrl: "javascript:alert(1)" },
            { ...research, roleUrl: "https://user:password@example.test/jobs" },
            { ...research, checkedOn: "2026-02-30" },
            {
              ...research,
              contacts: [
                {
                  name: "Team",
                  url: "mailto:hiring@example.test%0Abcc:other@example.test",
                },
              ],
            },
            { ...research, eligibility: "definitely" },
            { ...research, updatedAt: -1 },
            { ...research, sourceUpdatedAt: -1 },
          ];
          for (const value of unsafe)
            assert.throws(() =>
              merge("career:research", { [research.id]: value }),
            );
          assert.throws(() => merge("career:research", { wrong: research }));
          assert.throws(() =>
            merge("career:activities", {
              [application.id]: { ...application, reference: "" },
            }),
          );
          assert.throws(() =>
            merge("career:activities", {
              payment: {
                ...application,
                id: "payment",
                kind: "payment",
                amount: 100,
                currency: "",
              },
            }),
          );
          assert.throws(() =>
            merge("career:activities", {
              payment: {
                ...application,
                id: "payment",
                kind: "payment",
                amount: 0,
                currency: "INR",
              },
            }),
          );
          assert.throws(() =>
            merge("career:opportunities", {
              [opportunity.id]: { ...opportunity, followUpOn: "2026-02-30" },
            }),
          );
        },
      );
      await t.test(
        "anonymous and cross-owner calls cannot read or modify collections",
        () => {
          assert.throws(() =>
            asUser(
              other,
              mergeSql("career:research", { [research.id]: research }),
            ),
          );
          assert.throws(() =>
            asUser(
              null,
              mergeSql("career:research", { [research.id]: research }),
            ),
          );
          assert.throws(() =>
            sql(
              `set role anon; ${mergeSql("career:research", { [research.id]: research })}`,
            ),
          );
          assert.equal(
            asUser(
              other,
              `select count(*) from public.tracker_data where user_id='${owner}';`,
            ),
            "0",
          );
        },
      );
      await t.test(
        "independent entries merge and old collections retain validation",
        () => {
          const second = {
            ...research,
            id: "second-role",
            roleUrl: "https://example.test/jobs/two",
          };
          const data = merge("career:research", { [second.id]: second });
          assert.equal(Object.keys(data).length, 2);
          assert.equal(
            merge("routine:schedules", {
              routine: { updatedAt: 1, label: "Existing record" },
            }).routine.label,
            "Existing record",
          );
          assert.equal(
            merge("nutrition:entries", {
              entry: { updatedAt: 1, label: "Existing record" },
            }).entry.label,
            "Existing record",
          );
          assert.throws(() =>
            merge("nutrition:templates", {
              invalid: { id: "invalid", updatedAt: 1, name: "No items" },
            }),
          );
          assert.throws(() => merge("unsupported:key", {}));
        },
      );
    } finally {
      if (started)
        execFileSync("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"], {
          stdio: "pipe",
        });
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
