import { createClient } from "@supabase/supabase-js";
import curriculum from "../src/data/career-curriculum.json" with { type: "json" };
import {
  buildPlannerTodos,
  mergeCareerReminders,
  EMPTY_CAREER_EXECUTION_STATE,
  mergeExecutionState,
  validateSeedPayload,
} from "../src/lib/career-roadmap.ts";
import type { CareerCurriculum } from "../src/lib/career-roadmap.ts";

const configuredOwnerEmail = process.env.CAREER_OWNER_EMAIL?.trim().toLowerCase();
const ownerEmail = configuredOwnerEmail ?? "preview@example.invalid";
const keys = ["timetable_100_days", "career_command_center", "career_execution_state", "todos", "reminders"] as const;
const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const apply = process.argv.includes("--apply");

if (apply && (!url || !secret || !configuredOwnerEmail)) throw new Error("--apply requires SUPABASE_URL, SUPABASE_SECRET_KEY, and CAREER_OWNER_EMAIL in the environment.");
if (url && !secret) throw new Error("SUPABASE_SECRET_KEY is required when SUPABASE_URL is provided.");
if ((url || secret) && !configuredOwnerEmail) throw new Error("CAREER_OWNER_EMAIL is required before connecting to Supabase.");

function careerData() {
  return {
    version: 1,
    resumeAnalysis: {
      reviewedOn: "2026-09-30",
      caveat: "Evidence-led review of the canonical CV; confirm each claim and quantify only with source evidence.",
      strengths: [
        { item: "Founding Engineer ownership at Docita", impact: "Strong end-to-end product and delivery signal when backed by shipped artifacts.", fitScore: 9 },
        { item: "TypeScript, React, Node.js and PostgreSQL", impact: "Direct match for senior product engineering and backend-leaning full-stack roles.", fitScore: 9 },
        { item: "Multi-tenant healthcare SaaS and privacy/security work", impact: "Relevant domain experience for healthtech and regulated SaaS; explain controls precisely.", fitScore: 8 },
        { item: "Measured latency improvement and mentoring at MAQ", impact: "Useful quantified impact and team multiplier evidence; prepare the measurement method.", fitScore: 8 },
      ],
      gaps: [
        { item: "Senior-level public proof is hard to assess from a CV alone", action: "Publish two compact architecture case studies with diagrams, trade-offs, tests, and outcomes.", urgency: "high" },
        { item: "Kubernetes/Terraform depth is not as well evidenced as app/backend work", action: "Build and operate a small tested deployment; describe failure recovery and observability.", urgency: "medium" },
        { item: "Resume bullets need claim-by-claim evidence and role tailoring", action: "Maintain a source-of-truth achievement ledger and tailor a one-page variant per role family.", urgency: "high" },
        { item: "German language and relocation logistics need verification", action: "Start a sustainable A1 routine and validate degree recognition, salary threshold, and offer conditions from official sources.", urgency: "medium" },
      ],
    },
    targetRoles: {
      germany: [{ company: "Personio", city: "Munich or Berlin", role: "Senior Software Engineer — Backend / Fullstack", fitScore: 7, salary: "Not stated in listing", link: "https://www.personio.com/careers/3994eea1-edac-40c7-886b-61a92dfa813d/", status: "open · verify fit/team", sourceChecked: "2026-09-30", notes: "Official general senior-engineer opening across Munich/Berlin/London. Your end-to-end SaaS, Node/TypeScript/Postgres and Java experience map to the full-stack/backend path; role also mentions Java/Kotlin, so ask about team match and visa/relocation support." }],
      remote: [
        { company: "oMazons", role: "Full-Stack Developer — TypeScript / Vue / Node", fitScore: 8, salary: "₹22L–₹30L shown", link: "https://wellfound.com/jobs/4157895-full-stack-developer-typescript-vue-3-node", status: "listing found · verify at apply", sourceChecked: "2026-09-30", notes: "Wellfound listing says remote/everywhere and 3–5 years; strong TypeScript, Node, Postgres, Prisma, queues and end-to-end ownership match. Vue 3 is the main ramp-up; confirm employer, India eligibility, compensation, and vacancy directly." },
        { company: "TapStock", role: "Senior Backend Engineer — Node.js / TypeScript", fitScore: 8, salary: "₹6L–₹18L shown", link: "https://wellfound.com/jobs/4677899-senior-backend-engineer-3-years-exp", status: "listing found · compensation caution", sourceChecked: "2026-09-30", notes: "Wellfound listing says remote India, 3+ years, Node/TypeScript/Postgres/Prisma and two positions; Redis/BullMQ, cloud operations and first-backend ownership are additional requirements. Listed range is broad and low at its floor—confirm real budget and employment terms before investing heavily." },
      ],
    },
    roleResearchNote: "Source check: 2026-09-30. Listings change quickly; re-open the exact listing before applying and confirm location eligibility, language, compensation, work authorization/relocation, and that the role is still accepting applications. Wellfound listings are third-party leads, not employer verification.",
    outreachTemplates: {
      germanySaaS: "Subject: {Role} — TypeScript / Node.js | {specific evidence}\n\nHi {Name},\nI build production software across TypeScript, Node.js, React, and PostgreSQL. In my current/recent work at {company}, I {verifiable outcome}. I noticed {specific product/team detail} and would be interested in discussing {relevant problem}.\n\nPortfolio: https://buildora.work\nGitHub: https://github.com/CVamsi27\n\nRegards,\nVamsi",
      remote: "Hi {Name},\nI am exploring remote {role-family} roles compatible with India. My strongest evidence is {specific shipped project/outcome}; the work maps to {specific requirement from listing}. Does this role hire in India directly or through an EOR?\n\nPortfolio: https://buildora.work | GitHub: https://github.com/CVamsi27\nRegards, Vamsi",
      ossMaintainer: "Hi {maintainer}, I read the contribution guide and the context on {issue}. Before coding, could you confirm whether {narrow proposed change} is in scope? I can add tests and share a small design note first. Thanks!",
    },
    germanyChecklist: [
      { id: "germany-degree", text: "Verify degree and institution recognition through official Anabin/ZAB guidance", done: false, link: "https://anabin.kmk.org/anabin.html" },
      { id: "germany-blue-card", text: "Check current EU Blue Card requirements against the exact offer and qualification", done: false, link: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" },
      { id: "germany-documents", text: "Prepare degree, transcripts, experience letters, passport, and certified translations as required", done: false },
      { id: "germany-language", text: "Set an achievable German A1 study cadence and record weekly practice", done: false, link: "https://www.goethe.de/en/spr/kup/kur/dlk.html" },
      { id: "germany-budget", text: "Build a relocation budget from current official and provider quotes before spending", done: false },
    ],
    weeklyTargets: { focusedStudyHours: 14, practiceArtifacts: 5, tailoredApplications: 5, qualityOutreach: 5, mockInterviews: 2, publicProof: 1 },
  };
}

async function listExactUser(client: ReturnType<typeof createClient>) {
  const matches = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Unable to resolve owner account: ${error.message}`);
    matches.push(...data.users.filter(user => user.email?.toLowerCase() === ownerEmail));
    if (data.users.length < 1000) break;
  }
  if (matches.length !== 1) throw new Error(`Expected exactly one account for the configured owner; found ${matches.length}.`);
  return matches[0];
}

async function run() {
  let client: ReturnType<typeof createClient> | undefined;
let userId = "00000000-0000-4000-8000-000000000000";
  const existing: Record<string, unknown> = {};
  if (url && secret && configuredOwnerEmail) {
    client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const user = await listExactUser(client);
    userId = user.id;
    const { data, error } = await (client as any).from("tracker_data").select("key,value").eq("user_id", userId).in("key", [...keys]);
    if (error) throw new Error(`Unable to read current planner rows: ${error.message}`);
    for (const row of data ?? []) existing[row.key] = row.value;
  } else if (apply) {
    throw new Error("Apply mode requires the configured database.");
  }

  const currentState = existing.career_execution_state ?? EMPTY_CAREER_EXECUTION_STATE;
  const checklistIds = curriculum.days.flatMap(day => day.checklist.map(item => item.id));
  const executionState = mergeExecutionState(currentState, checklistIds);
  const previousDays = (existing.timetable_100_days as { days?: Array<{ date?: string; checklist?: Array<{ id?: string; text?: string; done?: boolean }> }> } | undefined)?.days ?? [];
  const priorClaims = previousDays.flatMap(day => (day.checklist ?? [])
    .filter(item => item.done === true && typeof item.id === "string")
    .map(item => ({ id: item.id!, date: day.date ?? "unknown", text: item.text ?? "Previously checked roadmap task", claimedDone: true as const })));
  const claimById = new Map([...(executionState.legacyClaims ?? []), ...priorClaims].map(claim => [claim.id, claim]));
  executionState.legacyClaims = [...claimById.values()];
  const timetable = { ...curriculum, timezone: "Asia/Kolkata", source: "software-developer-bible" };
  const todos = buildPlannerTodos(curriculum, Array.isArray(existing.todos) ? existing.todos as never[] : []);
  const reminders = {
    ...(existing.reminders && typeof existing.reminders === "object" ? existing.reminders as Record<string, unknown> : {}),
    career: mergeCareerReminders(existing.reminders && typeof existing.reminders === "object" ? (existing.reminders as { career?: unknown }).career : undefined),
  };
  const values: Record<string, unknown> = {
    timetable_100_days: timetable,
    career_command_center: careerData(),
    career_execution_state: executionState,
    todos,
    reminders,
  };
  const rows = keys.map(key => ({ user_id: userId, key, value: values[key] }));
  validateSeedPayload({ ownerEmail, curriculum: curriculum as unknown as CareerCurriculum, rows }, ownerEmail);
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ownerConfigured: Boolean(configuredOwnerEmail), accountResolved: Boolean(client), curriculumDays: curriculum.days.length, chapters: curriculum.chapterCount, checklistItems: checklistIds.length, rows: rows.length, preservedTodoRows: todos.filter(row => !row.id.startsWith("career-plan:")).length, executionEvidencePreserved: Object.keys(executionState.evidenceByItemId).length, priorChecklistClaimsPreservedForReview: executionState.legacyClaims.length, remindersDefaultOff: true }, null, 2));
  if (!apply) return;
  if (!client) throw new Error("Database client was not initialized.");
  const { data: applied, error } = await (client as any).rpc("sync_career_roadmap", { p_user_id: userId, p_rows: rows });
  if (error) throw new Error(`Atomic career sync failed: ${error.message}`);
  if (applied !== rows.length) throw new Error(`Atomic sync applied ${String(applied)} rows; expected ${rows.length}.`);
  const { data: readback, error: readError } = await (client as any).from("tracker_data").select("key,value").eq("user_id", userId).in("key", [...keys]);
  if (readError) throw new Error(`Sync succeeded but verification readback failed: ${readError.message}`);
  const result = new Map((readback ?? []).map((row: { key: string; value: unknown }) => [row.key, row.value]));
  const savedCurriculum = result.get("timetable_100_days") as typeof curriculum | undefined;
  const savedTodos = result.get("todos") as typeof todos | undefined;
  if (savedCurriculum?.version !== curriculum.version || savedCurriculum.days.length !== curriculum.days.length || savedTodos?.length !== todos.length) {
    throw new Error("Database readback did not match the validated planner snapshot.");
  }
  console.log("Career roadmap database sync and readback verification succeeded.");
}

run().catch(error => { console.error(error instanceof Error ? error.message : "Career sync failed."); process.exitCode = 1; });
