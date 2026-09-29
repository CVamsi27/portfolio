/**
 * sync-roadmap.ts
 * Syncs the full 100-day study timetable, todos, resume analysis, and
 * Germany/remote role targets into the portfolio Supabase DB.
 *
 * Credentials are read from env vars only – never hard-coded.
 * Usage: SUPABASE_URL=... SUPABASE_SECRET_KEY=... npx --yes tsx scripts/sync-roadmap.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
if (!supabaseUrl || !supabaseKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars");

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types ────────────────────────────────────────────────────────────────────
interface DayPlan {
  day: number;
  date: string;
  topic: string;
  chapterId: string;
  title: string;
  studyLink: string;
  practiceLinks: string[];
  schedule: Record<string, string>;
  steps: string[];
  checklist: { id: string; text: string; done: boolean }[];
  notification: { time: string; message: string };
  oSSProject: string;
  mockInterviewPlatform: string;
  founderOutreachTarget: string;
}

interface Todo {
  id: string;
  text: string;
  done: boolean;
  date: string;
  priority: "P1" | "P2" | "P3";
  tag: "Work" | "Health" | "Goal" | "Personal" | "Deep Work";
  createdAt: number;
  completedAt?: number;
}

// ─── The complete topic list from the bible ───────────────────────────────────
// Each entry = one study day. Topics are ordered by the bible's study order.
const TOPICS = [
  // ── 00-strategy (5 days) ──────────────────────────────────────────────────
  {
    stack: "00-strategy",
    id: "00.01",
    title: "Communication Skills for Tech Interviews",
    file: "00.01-communication.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Personio (Munich)",
  },
  {
    stack: "00-strategy",
    id: "00.02",
    title: "Resume Tips & ATS Optimisation",
    file: "00.02-resume-tips.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Doctolib (Berlin)",
  },
  {
    stack: "00-strategy",
    id: "00.03",
    title: "STAR Method & Behavioural Answers",
    file: "00.03-star-method.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Celonis (Munich)",
  },
  {
    stack: "00-strategy",
    id: "00.04",
    title: "HR Questions & Salary Negotiation",
    file: "00.04-hr-questions.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "N26 (Berlin)",
  },
  {
    stack: "00-strategy",
    id: "00.review",
    title: "Strategy Review Day + Mock Walk-through",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "interviewsby.ai",
    outreach: "SumUp (Berlin)",
  },

  // ── 10-frontend / JS (6 days) ─────────────────────────────────────────────
  {
    stack: "10-frontend / 10.1-javascript",
    id: "10.1.1",
    title: "JS: Execution Context, Scope & Closures",
    file: "01-execution-and-scope/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Personio",
  },
  {
    stack: "10-frontend / 10.1-javascript",
    id: "10.1.2",
    title: "JS: Objects, Prototypes & this",
    file: "02-objects-prototypes-this/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Celonis",
  },
  {
    stack: "10-frontend / 10.1-javascript",
    id: "10.1.3",
    title: "JS: Async, Event Loop & Promises",
    file: "03-async-concurrency/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Gorillas (Berlin)",
  },
  {
    stack: "10-frontend / 10.1-javascript",
    id: "10.1.4",
    title: "JS: Memory, Data Structures & Garbage Collection",
    file: "04-memory-and-data/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "interviewsby.ai",
    outreach: "Mambu",
  },
  {
    stack: "10-frontend / 10.1-javascript",
    id: "10.1.5",
    title: "JS: Functional Patterns (Generators, Currying)",
    file: "05-functional-patterns/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "TIER Mobility (Berlin)",
  },
  {
    stack: "10-frontend / 10.1-javascript",
    id: "10.1.6",
    title: "JS: Modern Features, Web Workers & Interview Qs",
    file: "06-modern-and-interview/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Adjust",
  },

  // ── 10-frontend / TS (5 days) ─────────────────────────────────────────────
  {
    stack: "10-frontend / 10.2-typescript",
    id: "10.2.1",
    title: "TS: Foundations — Types, Interfaces & Narrowing",
    file: "01-foundations/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Contentful (Berlin)",
  },
  {
    stack: "10-frontend / 10.2-typescript",
    id: "10.2.2",
    title: "TS: Generics & Type Inference",
    file: "02-generics-and-inference/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "interviewsby.ai",
    outreach: "Babbel (Berlin)",
  },
  {
    stack: "10-frontend / 10.2-typescript",
    id: "10.2.3",
    title: "TS: Utility Types, Conditional & Mapped Types",
    file: "03-type-transformations/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Idealo (Berlin)",
  },
  {
    stack: "10-frontend / 10.2-typescript",
    id: "10.2.4",
    title: "TS: Advanced Patterns (Decorators, Branded Types)",
    file: "04-advanced-patterns/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Taxfix (Berlin)",
  },
  {
    stack: "10-frontend / 10.2-typescript",
    id: "10.2.5",
    title: "TS: Interview Prep & Challenge Day",
    file: "05-interview-prep/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "ABOUT YOU (Hamburg)",
  },

  // ── 10-frontend / React (5 days) ──────────────────────────────────────────
  {
    stack: "10-frontend / 10.3-react",
    id: "10.3.1",
    title: "React: Internals — Virtual DOM, Fiber & Reconciliation",
    file: "01-react-internals/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Personio",
  },
  {
    stack: "10-frontend / 10.3-react",
    id: "10.3.2",
    title: "React: Core Hooks Deep-dive",
    file: "02-core-hooks/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "interviewsby.ai",
    outreach: "SumUp",
  },
  {
    stack: "10-frontend / 10.3-react",
    id: "10.3.3",
    title: "React: Advanced Hooks & Patterns",
    file: "03-advanced-hooks-and-patterns/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Doctolib",
  },
  {
    stack: "10-frontend / 10.3-react",
    id: "10.3.4",
    title: "React: Modern React 19 Features",
    file: "04-modern-react/INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Celonis",
  },
  {
    stack: "10-frontend / 10.3-react",
    id: "10.3.5",
    title: "React: Patterns & Interview Questions",
    file: "05-patterns-and-interview/INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "N26",
  },

  // ── 10-frontend / Next.js (3 days) ────────────────────────────────────────
  {
    stack: "10-frontend / 10.4-nextjs",
    id: "10.4.1",
    title: "Next.js: App Router, RSC & Data Fetching",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Vercel-backed startup",
  },
  {
    stack: "10-frontend / 10.4-nextjs",
    id: "10.4.2",
    title: "Next.js: Auth, Middleware & API Routes",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "interviewsby.ai",
    outreach: "Pitch (Berlin)",
  },
  {
    stack: "10-frontend / 10.4-nextjs",
    id: "10.4.3",
    title: "Next.js: Performance, Caching & Deployment",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Moonfare (Berlin)",
  },

  // ── 20-backend / Node (4 days) ────────────────────────────────────────────
  {
    stack: "20-backend / 20.1-nodejs",
    id: "20.1.1",
    title: "Node.js: Event Loop, Streams & Core Modules",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Taxfix",
  },
  {
    stack: "20-backend / 20.1-nodejs",
    id: "20.1.2",
    title: "Node.js: Performance, Clustering & Worker Threads",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Personio",
  },
  {
    stack: "20-backend / 20.1-nodejs",
    id: "20.1.3",
    title: "NestJS: Modules, Providers, DI & Guards",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "FlixBus (Munich)",
  },
  {
    stack: "20-backend / 20.1-nodejs",
    id: "20.1.4",
    title: "NestJS: Advanced (Interceptors, CQRS, Microservices)",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "interviewsby.ai",
    outreach: "Allianz X",
  },

  // ── 20-backend / REST & APIs (2 days) ─────────────────────────────────────
  {
    stack: "20-backend / 20.2-api",
    id: "20.2.1",
    title: "REST API Design: OpenAPI, Versioning & Pagination",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Contentful",
  },
  {
    stack: "20-backend / 20.2-api",
    id: "20.2.2",
    title: "GraphQL, gRPC & tRPC",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Shopify (Remote)",
  },

  // ── 20-backend / Security (3 days) ────────────────────────────────────────
  {
    stack: "20-backend / 20.5-security",
    id: "20.5.1",
    title: "Auth Fundamentals: JWT, OAuth2, OIDC",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Auth0 / Okta (Remote)",
  },
  {
    stack: "20-backend / 20.5-security",
    id: "20.5.2",
    title: "ABAC, RBAC & Row-Level Security",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "N26",
  },
  {
    stack: "20-backend / 20.5-security",
    id: "20.5.3",
    title: "GDPR, DSGVO & Encryption in Transit/At-Rest",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "interviewsby.ai",
    outreach: "Doctolib",
  },

  // ── 20-backend / Database (4 days) ────────────────────────────────────────
  {
    stack: "20-backend / 20.3-database",
    id: "20.3.1",
    title: "PostgreSQL: Indexes, Query Planning & EXPLAIN",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Aiven (Remote)",
  },
  {
    stack: "20-backend / 20.3-database",
    id: "20.3.2",
    title: "PostgreSQL: Transactions, Isolation & Row-Level Security",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Zalando (Berlin)",
  },
  {
    stack: "20-backend / 20.3-database",
    id: "20.3.3",
    title: "Prisma ORM: Schema Design, Migrations & Relations",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Personio",
  },
  {
    stack: "20-backend / 20.3-database",
    id: "20.3.4",
    title: "Redis, Background Jobs & Message Queues",
    file: "INDEX.md",
    days: 1,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Tier Mobility",
  },

  // ── 30-architecture (8 days) ──────────────────────────────────────────────
  {
    stack: "30-architecture / 30.1-design-patterns",
    id: "30.1",
    title: "Design Patterns: GoF 23 Patterns (Creational, Structural, Behavioural)",
    file: "INDEX.md",
    days: 2,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Celonis",
  },
  {
    stack: "30-architecture / 30.2-system-design",
    id: "30.2",
    title: "System Design: Scalability, Load Balancing & Caching",
    file: "INDEX.md",
    days: 3,
    oss: "Lightdash",
    mock: "interviewsby.ai",
    outreach: "Zalando",
  },
  {
    stack: "30-architecture / 30.3-infra-patterns",
    id: "30.3",
    title: "Infra Patterns: Event-Driven, CQRS, Transactional Outbox",
    file: "INDEX.md",
    days: 3,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "SumUp",
  },

  // ── 40-platform (8 days) ──────────────────────────────────────────────────
  {
    stack: "40-platform / 40.1-docker",
    id: "40.1",
    title: "Docker: Containers, Images, Networking & Compose",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "FlixBus",
  },
  {
    stack: "40-platform / 40.2-kubernetes",
    id: "40.2",
    title: "Kubernetes: Workloads, Networking, Scaling & Hardening",
    file: "INDEX.md",
    days: 3,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Zalando",
  },
  {
    stack: "40-platform / 40.3-ci-cd",
    id: "40.3",
    title: "CI/CD: Pipelines, Releases & Deployment Metrics",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Personio",
  },
  {
    stack: "40-platform / 40.4-observability",
    id: "40.4",
    title: "Observability: Logging, Tracing, Metrics & SRE",
    file: "INDEX.md",
    days: 2,
    oss: "Langfuse",
    mock: "interviewsby.ai",
    outreach: "Datadog (Remote)",
  },
  {
    stack: "40-platform / 40.5-build-tools",
    id: "40.5",
    title: "Build Tools: Vite, esbuild, Turbo & Bundler Optimisation",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Vercel-backed",
  },

  // ── 50-quality (6 days) ───────────────────────────────────────────────────
  {
    stack: "50-quality / 50.1-testing",
    id: "50.1",
    title: "Testing: Unit, Integration, E2E (Jest, Playwright)",
    file: "INDEX.md",
    days: 3,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Personio",
  },
  {
    stack: "50-quality / 50.2-accessibility",
    id: "50.2",
    title: "Accessibility: WCAG, ARIA & Semantic HTML",
    file: "INDEX.md",
    days: 1,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Zalando",
  },
  {
    stack: "50-quality / 50.3-performance",
    id: "50.3",
    title: "Performance: Core Web Vitals, LCP, INP & Optimisation",
    file: "INDEX.md",
    days: 2,
    oss: "Langfuse",
    mock: "interviewsby.ai",
    outreach: "SumUp",
  },

  // ── 60-realtime (3 days) ──────────────────────────────────────────────────
  {
    stack: "60-realtime / 60.1-websockets",
    id: "60.1",
    title: "Real-time: WebSockets, SSE & Scaling",
    file: "INDEX.md",
    days: 3,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Liveblocks (Remote)",
  },

  // ── 70-interview-toolkit (8 days) ─────────────────────────────────────────
  {
    stack: "70-interview-toolkit / 70.1-behavioral",
    id: "70.1",
    title: "Behavioural Interview Mastery & STAR Stories",
    file: "INDEX.md",
    days: 2,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Celonis",
  },
  {
    stack: "70-interview-toolkit / 70.2-coding-patterns",
    id: "70.2",
    title: "LeetCode Patterns: Arrays, Graphs, DP, Heaps",
    file: "INDEX.md",
    days: 4,
    oss: "Lightdash",
    mock: "interviewsby.ai",
    outreach: "Doctolib",
  },
  {
    stack: "70-interview-toolkit / 70.3-cheatsheets",
    id: "70.3",
    title: "Cheatsheets: Final System Design & Coding Review",
    file: "INDEX.md",
    days: 2,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "Personio",
  },

  // ── 80-lanes / OSS + Final (8 days) ──────────────────────────────────────
  {
    stack: "80-lanes-abroad-full-stack",
    id: "80.1",
    title: "Abroad Lane: Germany Target Research & Outreach Sprint",
    file: "INDEX.md",
    days: 2,
    oss: "Langfuse",
    mock: "micro1.ai",
    outreach: "10 founders per day",
  },
  {
    stack: "80-lanes-abroad-full-stack",
    id: "80.2",
    title: "OSS Sprint: Ship 2 Meaningful PRs to Langfuse or Lightdash",
    file: "INDEX.md",
    days: 3,
    oss: "Langfuse",
    mock: "interviewsby.ai",
    outreach: "OSS maintainers",
  },
  {
    stack: "80-lanes-abroad-full-stack",
    id: "80.3",
    title: "Take-home Projects & Full Mock Interview Loops",
    file: "INDEX.md",
    days: 3,
    oss: "Lightdash",
    mock: "micro1.ai",
    outreach: "Final wave",
  },
];

// ─── Build flat day list ──────────────────────────────────────────────────────
const STUDY_BASE_URL = "https://study.buildora.work";
const PERSONAL_URL = "https://personal.buildora.work";
const BIBLE_GITHUB = "https://github.com/CVamsi27/software-developer-bible/blob/main";

const DAILY_SCHEDULE: Record<string, string> = {
  "07:00 - 08:30": "💪 Exercise & Freshen Up (no breakfast)",
  "08:30 - 10:30": "📖 Deep Study (see today's topic + AI rabbit-hole with Claude Opus)",
  "10:30 - 12:30": "🛠️  Core Practice (code the concept, build mini-project or solve LeetCode)",
  "12:30 - 14:00": "🔍 Role Scouting & Prep Notes (10 roles, product audit, prepare outreach)",
  "14:00 - 14:30": "🍱 Lunch",
  "14:30 - 16:30": "🐙 Open Source Dev (Langfuse / Lightdash PR or issue)",
  "16:30 - 17:30": "🎯 Interview Prep (system design or behavioural notes)",
  "17:30 - 18:00": "🤖 Mock Interview (micro1.ai / interviewsby.ai / Pramp)",
  "18:00 - 20:00": "👨‍👩‍👧 Family Time (unplug completely)",
  "20:00 - 20:30": "🍽️  Dinner",
  "20:30 - 21:30": "✉️  Founder Outreach (10 personalised emails)",
  "21:30 - 22:00": "🌙 Wind Down & Plan Tomorrow",
};

function buildSteps(topic: (typeof TOPICS)[0], day: number): string[] {
  return [
    `Read chapters in study.buildora.work for "${topic.title}"`,
    `Open Claude Opus and paste today's code/design — debate edge cases for 30 min`,
    `Implement a working mini-demo of the concept (commit to a private scratch repo)`,
    `Find 10 open roles on LinkedIn/Wellfound matching your stack: TypeScript, Node.js, React, PostgreSQL`,
    `For each role, note company name, tech stack, and 1 personalised talking point`,
    `Contribute to ${topic.oss}: review open issues, pick one, comment or open a PR`,
    `Complete 1 timed mock interview session on ${topic.mock}`,
    `Write 10 personalised founder outreach emails using today's product audit`,
    `Update personal.buildora.work/trackers with today's completed checklist items`,
  ];
}

function buildChecklist(topic: (typeof TOPICS)[0], day: number, partIdx: number) {
  return [
    { id: `c_${day}_1`, text: `✅ Read & understood "${topic.title}"`, done: false },
    { id: `c_${day}_2`, text: "✅ Built a working mini-demo or solved 2 LeetCode problems", done: false },
    { id: `c_${day}_3`, text: `✅ Contributed to ${topic.oss} (PR, issue, comment)`, done: false },
    { id: `c_${day}_4`, text: `✅ Completed 1 mock interview on ${topic.mock}`, done: false },
    { id: `c_${day}_5`, text: "✅ Sent 10 personalised founder emails", done: false },
    { id: `c_${day}_6`, text: "✅ Logged today's checklist in personal.buildora.work", done: false },
  ];
}

function buildLinks(topic: (typeof TOPICS)[0]) {
  const stackFolder = topic.stack.split(" / ")[0];
  return [
    `${STUDY_BASE_URL}/${stackFolder}/INDEX.md`,
    `${BIBLE_GITHUB}/${stackFolder}/INDEX.md`,
    `${PERSONAL_URL}/trackers`,
    `https://github.com/langfuse/langfuse`,
    `https://github.com/lightdash/lightdash`,
    `https://micro1.ai`,
    `https://interviewsby.ai`,
    `https://wellfound.com/jobs`,
  ];
}

const startDate = new Date("2026-09-29T00:00:00Z");
const days: DayPlan[] = [];
const todos: Todo[] = [];
let globalDay = 1;

for (const topic of TOPICS) {
  for (let part = 0; part < topic.days; part++) {
    const d = new Date(startDate.getTime() + (globalDay - 1) * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const partLabel = topic.days > 1 ? ` (Part ${part + 1}/${topic.days})` : "";

    const plan: DayPlan = {
      day: globalDay,
      date: dateStr,
      topic: topic.stack,
      chapterId: topic.id,
      title: topic.title + partLabel,
      studyLink: `${STUDY_BASE_URL}/${topic.stack.split(" / ")[0]}/${topic.file}`,
      practiceLinks: buildLinks(topic),
      schedule: Object.fromEntries(
        Object.entries(DAILY_SCHEDULE).map(([time, activity]) =>
          time === "08:30 - 10:30"
            ? [time, `📖 Deep Study: "${topic.title}"${partLabel} → ${STUDY_BASE_URL}/${topic.stack.split(" / ")[0]}/INDEX.md`]
            : [time, activity]
        )
      ),
      steps: buildSteps(topic, globalDay),
      checklist: buildChecklist(topic, globalDay, part),
      notification: {
        time: "08:00",
        message: `🌅 Day ${globalDay}/100 — Topic: "${topic.title}"${partLabel}\n📖 Study: ${STUDY_BASE_URL}/${topic.stack.split(" / ")[0]}/INDEX.md\n🎯 OSS: ${topic.oss} | Mock: ${topic.mock}\nCheck personal.buildora.work for your full checklist!`,
      },
      oSSProject: topic.oss,
      mockInterviewPlatform: topic.mock,
      founderOutreachTarget: topic.outreach,
    };

    days.push(plan);

    todos.push({
      id: `t_100day_${globalDay}`,
      text: `[Day ${globalDay}] ${topic.title}${partLabel}`,
      done: false,
      date: dateStr,
      priority: "P1",
      tag: "Goal",
      createdAt: Date.now() + globalDay,
    });

    globalDay++;
  }
}

// ─── Resume analysis ──────────────────────────────────────────────────────────
const resumeAnalysis = {
  lastUpdated: new Date().toISOString(),
  summary:
    "Senior Full Stack Engineer (5 YOE). Founding Engineer at Docita (multi-tenant healthcare SaaS). Strong in Node/NestJS, PostgreSQL RLS, event-driven architecture, React 19, AI integration with production guardrails. EU Blue Card eligible. Target: Munich/Berlin or 100% remote.",
  strengths: [
    "Founding Engineer at Docita — extreme end-to-end ownership (design → deploy)",
    "Multi-tenant SaaS architecture with PG Row-Level Security + ABAC/RBAC — highest demand in EU SaaS startups",
    "Transactional outbox & Postgres-native job queue — no Redis/Kafka dependency, pragmatic and impressive",
    "GDPR/DSGVO-aware field-level encryption — direct requirement for German companies",
    "AI features with production guardrails (kill-switches, spend caps, PHI-safe logs) — uniquely rare",
    "30% latency reduction, 25% faster delivery, 85%+ test coverage — quantified impact",
    "Mentored 4 engineers — signals seniority and leadership readiness",
    "German (beginner, actively learning) — very positive signal for German employers",
  ],
  gaps: [
    "Kubernetes operational experience is limited — study 40.2 deeply",
    "LeetCode signal unclear — grind 70.2 for FAANG-adjacent German companies (Zalando)",
    "No public OSS contributions visible on GitHub — start contributing to Langfuse or Lightdash immediately",
  ],
  targetRolesGermany: [
    {
      company: "Personio",
      city: "Munich",
      role: "Senior Backend Engineer (Node.js/TypeScript)",
      why: "B2B SaaS, heavy TS/NestJS stack, values architecture ownership. Direct overlap with Docita experience.",
      link: "https://www.personio.com/careers/",
      fitScore: 9,
    },
    {
      company: "Celonis",
      city: "Munich",
      role: "Senior Software Engineer",
      why: "Enterprise SaaS, values architectural depth and data scale. Your infra-patterns knowledge is a perfect fit.",
      link: "https://www.celonis.com/careers/",
      fitScore: 8,
    },
    {
      company: "Doctolib",
      city: "Berlin",
      role: "Full Stack Engineer",
      why: "HealthTech — your Docita experience is a direct domain match. GDPR knowledge is essential and you have it.",
      link: "https://careers.doctolib.com/",
      fitScore: 10,
    },
    {
      company: "N26",
      city: "Berlin",
      role: "Senior Backend Engineer",
      why: "FinTech, values strong Postgres, auth (OAuth2/JWT), and security engineering. EU Blue Card sponsor.",
      link: "https://n26.com/en/careers",
      fitScore: 8,
    },
    {
      company: "SumUp",
      city: "Berlin",
      role: "Senior Software Engineer (Node.js)",
      why: "Payments SaaS. Webhook/HMAC knowledge (Razorpay at Docita) translates directly.",
      link: "https://sumup.com/careers/",
      fitScore: 9,
    },
    {
      company: "Taxfix",
      city: "Berlin",
      role: "Senior Full Stack Engineer",
      why: "FinTech/legal SaaS, remote-friendly. Your multi-tenant + auth expertise is a match.",
      link: "https://taxfix.de/en/careers/",
      fitScore: 8,
    },
    {
      company: "Zalando",
      city: "Berlin",
      role: "Senior Software Engineer",
      why: "Large-scale microservices. Requires strong system design and K8s knowledge — study 30.2 + 40.2.",
      link: "https://jobs.zalando.com/",
      fitScore: 7,
    },
    {
      company: "FlixBus",
      city: "Munich",
      role: "Backend Engineer (Node.js)",
      why: "B2C platform, event-driven, values reliability engineering which is your core strength.",
      link: "https://www.flixbus.com/company/jobs",
      fitScore: 7,
    },
  ],
  targetRolesRemote: [
    {
      platform: "Toptal",
      why: "Vets for top 3% — you can pass with 5+ YOE, system design skills, and strong communication. Apply immediately.",
      link: "https://www.toptal.com/developers/apply",
      fitScore: 9,
    },
    {
      platform: "Turing.com",
      why: "Silicon Valley remote jobs. Strong TypeScript and system design background is exactly what they look for.",
      link: "https://developers.turing.com/",
      fitScore: 8,
    },
    {
      company: "Langfuse",
      role: "Full Stack Engineer (OSS startup, remote)",
      why: "OSS LLM observability tool. Contributing PRs now → job offer later. Perfect mission alignment.",
      link: "https://langfuse.com/careers",
      fitScore: 10,
    },
    {
      company: "Lightdash",
      role: "Full Stack Engineer (OSS startup, remote)",
      why: "OSS BI tool. Your React + Postgres skills are a direct fit. Contributing opens the door.",
      link: "https://lightdash.com/careers",
      fitScore: 9,
    },
    {
      company: "Deel",
      role: "Senior Software Engineer (Remote)",
      why: "Global remote-first, heavy Node/TS, compliance-driven — your auth and multi-tenant expertise is gold.",
      link: "https://www.letsdeel.com/careers",
      fitScore: 8,
    },
  ],
  mockInterviewPlatforms: [
    { name: "micro1.ai", url: "https://micro1.ai", type: "AI mock interviews", free: true },
    { name: "interviewsby.ai", url: "https://interviewsby.ai", type: "AI system design + coding", free: true },
    { name: "Pramp", url: "https://www.pramp.com", type: "Peer-to-peer mock interviews", free: true },
    { name: "Interviewing.io", url: "https://interviewing.io", type: "Anonymous interviews with engineers", free: true },
  ],
  ossProjects: [
    {
      name: "Langfuse",
      url: "https://github.com/langfuse/langfuse",
      why: "LLM observability, built with Next.js + Prisma + Postgres. Perfect stack match.",
      goodFirstIssues: "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22",
    },
    {
      name: "Lightdash",
      url: "https://github.com/lightdash/lightdash",
      why: "Open-source BI tool, heavy Node.js + React + Postgres. Direct Docita experience maps.",
      goodFirstIssues: "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22",
    },
  ],
};

// ─── Run ──────────────────────────────────────────────────────────────────────
async function run() {
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) throw usersErr;
  const user = usersData.users.find((u) => u.email === "cvamsik99@gmail.com");
  if (!user) throw new Error("User cvamsik99@gmail.com not found in Supabase Auth");
  const userId = user.id;
  console.log(`✅ Found user: ${userId} (${user.email})`);
  console.log(`📅 Total days planned: ${days.length}`);

  // 1. Upsert timetable
  console.log("📤 Upserting timetable_100_days …");
  const { error: ttErr } = await supabase.from("tracker_data").upsert(
    { user_id: userId, key: "timetable_100_days", value: { days }, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (ttErr) throw ttErr;
  console.log("   ✅ timetable_100_days saved");

  // 2. Merge todos (remove stale 100day todos, add fresh ones)
  console.log("📤 Merging todos …");
  const { data: existingTodosData } = await supabase
    .from("tracker_data")
    .select("value")
    .eq("user_id", userId)
    .eq("key", "todos")
    .maybeSingle();
  const existingTodos: Todo[] = Array.isArray(existingTodosData?.value) ? (existingTodosData!.value as Todo[]) : [];
  const cleanExisting = existingTodos.filter((t) => !t.id.startsWith("t_100day_"));
  const mergedTodos = [...cleanExisting, ...todos];
  const { error: todosErr } = await supabase.from("tracker_data").upsert(
    { user_id: userId, key: "todos", value: mergedTodos, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (todosErr) throw todosErr;
  console.log(`   ✅ todos saved (${todos.length} roadmap todos + ${cleanExisting.length} existing)`);

  // 3. Upsert resume analysis
  console.log("📤 Upserting resume_analysis …");
  const { error: raErr } = await supabase.from("tracker_data").upsert(
    { user_id: userId, key: "resume_analysis", value: resumeAnalysis, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (raErr) throw raErr;
  console.log("   ✅ resume_analysis saved");

  // 4. Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) {
    const msg =
      `🚀 *100-Day Roadmap Fully Synced!*\n\n` +
      `📅 *${days.length} days* mapped across all bible stacks (JS → TS → React → Next.js → Node → Security → DB → System Design → DevOps → Testing → Real-time → Interview Toolkit → Germany Lane)\n\n` +
      `📝 *${todos.length} todos* injected with exact dates\n` +
      `🎯 Resume analysis + Germany & Remote target roles saved\n\n` +
      `🔗 [Interactive Tracker](https://personal.buildora.work/trackers)\n` +
      `📖 [Study Material](https://study.buildora.work)\n\n` +
      `Let the grind begin — Day 1 is today! 💪`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" }),
    });
    console.log("   ✅ Telegram notification sent");
  } else {
    console.log("   ⚠️  Skipped Telegram (no env vars)");
  }

  console.log("\n🎉 All done! Open https://personal.buildora.work/trackers to see your roadmap.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
