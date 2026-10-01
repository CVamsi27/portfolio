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
    version: 2,
    reviewedOn: "2026-10-01",
    profile: {
      name: "Vamsi Krishna Chandaluri",
      headline: "Senior Full Stack / Backend-leaning Engineer — TypeScript · Node.js · PostgreSQL · React",
      yearsExperience: 5,
      currentRole: "Founding/Full-Stack Engineer @ Docita (Aug 2025 — Present)",
      stack: ["TypeScript", "React", "Node.js", "NestJS", "PostgreSQL", "Prisma", "TanStack Query", "Zod", "Jest", "Vitest", "Playwright", "Docker", "GitHub Actions", "Java", "Spring Boot"],
      resumeUrl: "https://buildora.work/VamsiKrishna_Resume.pdf",
      github: "https://github.com/CVamsi27",
      portfolio: "https://buildora.work",
      bible: "https://study.buildora.work",
    },
    resumeAnalysis: {
      reviewedOn: "2026-10-01",
      caveat: "Evidence-led review of the canonical CV; confirm each claim and quantify only with source evidence.",
      strengths: [
        { item: "Founding/Full-Stack Engineer ownership at Docita (healthcare SaaS, 25+ clinics, 1,000+ appts/mo)", impact: "Strong end-to-end product and delivery signal when backed by shipped artifacts.", fitScore: 10 },
        { item: "TypeScript + React + Node.js + PostgreSQL (NestJS, Prisma, TanStack Query, Zod)", impact: "Direct match for senior product engineering and backend-leaning full-stack roles.", fitScore: 10 },
        { item: "Multi-tenant data model, PostgreSQL RLS, deny-by-default ABAC, encryption, audit trails", impact: "Differentiator for regulated SaaS (healthtech, fintech, govtech); explains controls precisely.", fitScore: 9 },
        { item: "Queues + transactional outbox + idempotency + retries + DLQ + webhooks", impact: "Production-grade reliability pattern that many senior resumes skip.", fitScore: 9 },
        { item: "Measured wins: -30% p95 REST latency, -25% delivery time, 85%+ coverage, mentored 4", impact: "Quantified impact and team multiplier; prepare the measurement method cold.", fitScore: 8 },
        { item: "Accessibility, accessibility patterns, and shared component library", impact: "Mid-to-senior signal; pairs well with TypeScript depth.", fitScore: 7 },
        { item: "5 years total: Cognizant (Java microservices) → MAQ (Node/React) → Docita (founding)", impact: "Clear progression from services to product engineering to ownership.", fitScore: 8 },
      ],
      gaps: [
        { item: "Senior-level public proof is hard to assess from a CV alone", action: "Publish 2 compact architecture case studies (Docita + Senior Full Stack Bible) with diagrams, trade-offs, tests, and outcomes. Pin them in portfolio.", urgency: "high" },
        { item: "Kubernetes/Terraform depth is not as well evidenced as app/backend work", action: "Build and operate a small tested deployment; describe failure recovery and observability. Use 40-platform chapters 40.1–40.4 as the script.", urgency: "medium" },
        { item: "No recent DSA/system-design public artifacts", action: "Solve 25 LeetCode problems/week (medium → hard) and publish 3 written system-design posts to portfolio or study.buildora.work.", urgency: "high" },
        { item: "Resume bullets need claim-by-claim evidence and role tailoring", action: "Maintain a source-of-truth achievement ledger and tailor a one-page variant per role family (Germany SaaS / remote-EU / remote-India / OSS maintainer).", urgency: "high" },
        { item: "German language and relocation logistics need verification", action: "Start a sustainable A1 routine and validate degree recognition, salary threshold, and offer conditions from official sources.", urgency: "medium" },
        { item: "OSS contribution cadence is invisible on GitHub", action: "Land at least 1 merged PR/month in a real repo (Langfuse, Lightdash, n8n, Payload, etc.) and reference the links on resume.", urgency: "medium" },
      ],
    },
    skillMatrix: {
      core: { score: 9, items: ["TypeScript", "React", "Node.js", "NestJS", "PostgreSQL", "Prisma", "TanStack Query", "Zod", "REST APIs", "Git", "Docker", "GitHub Actions"] },
      strong: { score: 8, items: ["Java", "Spring Boot", "Microservices", "TanStack Query patterns", "RLS / multi-tenant", "Queues/outbox/idempotency", "Playwright e2e", "Accessibility"] },
      developing: { score: 6, items: ["Kubernetes (production)", "Terraform / IaC", "GCP / AWS depth", "GraphQL at scale", "Observability stacks (OTel, Prometheus)", "System-design post writing", "DSA interview readiness"] },
      toLearn: { score: 3, items: ["Kafka deep-dive", "Service mesh (Istio/Linkerd)", "Rust basics", "ML infra basics"] },
    },
    targetRoles: {
      germany: [
        { company: "Personio", city: "Munich or Berlin", role: "Senior Software Engineer — Backend / Fullstack", fitScore: 8, salary: "Not stated in listing", link: "https://www.personio.com/careers/3994eea1-edac-40c7-886b-61a92dfa813d/", status: "open · verify fit/team", sourceChecked: "2026-10-01", notes: "Official general senior-engineer opening across Munich/Berlin/London. End-to-end SaaS, Node/TypeScript/Postgres and Java experience map to the full-stack/backend path; role also mentions Java/Kotlin, so ask about team match and visa/relocation support." },
        { company: "Celonis", city: "Munich", role: "Senior Software Engineer — Backend", fitScore: 8, salary: "€75k–€110k typical (levels.fyi)", link: "https://www.celonis.com/careers/", status: "open · general pipeline", sourceChecked: "2026-10-01", notes: "Process-mining SaaS; strong backend/TypeScript/Postgres fit. Sponsor EU Blue Card; check current openings by team. Use LinkedIn + email to engineering managers." },
        { company: "Zalando", city: "Berlin", role: "Senior Engineer — Logistics Platform", fitScore: 7, salary: "€75k–€100k typical (levels.fyi)", link: "https://jobs.zalando.com/en/jobs/", status: "open · general pipeline", sourceChecked: "2026-10-01", notes: "E-commerce at scale; TypeScript/Java/Kotlin teams. Multi-tenant + queue experience is a differentiator. Apply via jobs portal, then warm-up HM on LinkedIn." },
        { company: "Delivery Hero", city: "Berlin", role: "Senior Software Engineer — Backend", fitScore: 7, salary: "€75k–€100k typical (levels.fyi)", link: "https://careers.deliveryhero.com/", status: "open · general pipeline", sourceChecked: "2026-10-01", notes: "Hyper-scale food delivery; NestJS/Node/TypeScript and Postgres align. Open-source friendly culture. Search listings by stack filter." },
        { company: "Trade Republic", city: "Berlin", role: "Senior Backend Engineer — Java/Kotlin", fitScore: 7, salary: "€90k–€130k typical (levels.fyi)", link: "https://www.traderepublic.com/careers/", status: "open · general pipeline", sourceChecked: "2026-10-01", notes: "Fintech; regulated SaaS pattern fits. Java/Kotlin is the main ramp-up. Strong mentor culture." },
        { company: "N26", city: "Berlin", role: "Senior Engineer — Backend", fitScore: 7, salary: "€80k–€115k typical (levels.fyi)", link: "https://n26.com/en/careers", status: "open · general pipeline", sourceChecked: "2026-10-01", notes: "Digital bank; security and ABAC patterns from Docita translate directly. Backend leans Java/Kotlin." },
        { company: "GetYourGuide", city: "Berlin", role: "Senior Software Engineer", fitScore: 7, salary: "€75k–€100k typical (levels.fyi)", link: "https://www.getyourguide.com/careers", status: "open · general pipeline", sourceChecked: "2026-10-01", notes: "Travel marketplace; TypeScript/React/Node teams. Engineering blog is a strong warm-up tool." },
        { company: "SumUp", city: "Berlin", role: "Senior Backend Engineer — Payments", fitScore: 8, salary: "€80k–€110k typical (levels.fyi)", link: "https://www.sumup.com/careers/", status: "open · general pipeline", sourceChecked: "2026-10-01", notes: "Payments platform; outbox/idempotency/webhooks from Docita map directly to payments domain. Java/Node teams." },
      ],
      remoteEU: [
        { company: "GitLab", role: "Senior Backend Engineer (Ruby/Go/Node)", fitScore: 7, salary: "$95k–$130k typical (levels.fyi)", link: "https://about.gitlab.com/jobs/", status: "open · global remote", sourceChecked: "2026-10-01", notes: "Async-first remote; transparency reports double as interview prep. Mostly Ruby/Go, with Node teams." },
        { company: "GitHub", role: "Senior Software Engineer", fitScore: 7, salary: "$130k–$170k typical (levels.fyi)", link: "https://github.com/about/careers", status: "open · global remote", sourceChecked: "2026-10-01", notes: "Remote-first; TypeScript/Node teams. Hire India through EOR." },
        { company: "Sentry", role: "Senior Software Engineer — Backend", fitScore: 7, salary: "$110k–$150k typical (levels.fyi)", link: "https://sentry.io/careers/", status: "open · global remote", sourceChecked: "2026-10-01", notes: "Observability; Python/Node/TypeScript. Production engineering depth is a plus." },
        { company: "Cloudflare", role: "Senior Engineer — Workers/Platform", fitScore: 6, salary: "$130k–$170k typical (levels.fyi)", link: "https://www.cloudflare.com/careers/jobs/", status: "open · global remote", sourceChecked: "2026-10-01", notes: "Edge platform; TypeScript and Workers skills map. Strong systems interview — prepare." },
        { company: "Doist", role: "Senior Backend Engineer — Node.js", fitScore: 8, salary: "$80k–$110k typical (levels.fyi)", link: "https://doist.com/careers", status: "open · global remote async", sourceChecked: "2026-10-01", notes: "Async-first; Node/TypeScript/Postgres fit. Excellent work-life balance. India-friendly." },
        { company: "Toptal", role: "Senior Full-Stack Engineer", fitScore: 7, salary: "Hourly $80–$150", link: "https://www.toptal.com/careers", status: "open · global freelance", sourceChecked: "2026-10-01", notes: "Talent network; pass interview once and get matched. Keeps optionality open." },
        { company: "Turing", role: "Senior Full-Stack Engineer", fitScore: 7, salary: "Contract $60–$120/hr", link: "https://www.turing.com/careers", status: "open · global remote", sourceChecked: "2026-10-01", notes: "Long-term remote contracts for US companies. India-eligible." },
      ],
      remoteIndia: [
        { company: "oMazons", role: "Full-Stack Developer — TypeScript / Vue / Node", fitScore: 8, salary: "₹22L–₹30L shown", link: "https://wellfound.com/jobs/4157895-full-stack-developer-typescript-vue-3-node", status: "listing found · verify at apply", sourceChecked: "2026-10-01", notes: "Wellfound listing says remote/everywhere and 3–5 years; strong TypeScript, Node, Postgres, Prisma, queues and end-to-end ownership match. Vue 3 is the main ramp-up; confirm employer, India eligibility, compensation, and vacancy directly." },
        { company: "TapStock", role: "Senior Backend Engineer — Node.js / TypeScript", fitScore: 8, salary: "₹6L–₹18L shown", link: "https://wellfound.com/jobs/4677899-senior-backend-engineer-3-years-exp", status: "listing found · compensation caution", sourceChecked: "2026-10-01", notes: "Wellfound listing says remote India, 3+ years, Node/TypeScript/Postgres/Prisma and two positions; Redis/BullMQ, cloud operations and first-backend ownership are additional requirements. Listed range is broad and low at its floor—confirm real budget and employment terms before investing heavily." },
        { company: "Razorpay", role: "Senior Software Engineer — Backend", fitScore: 8, salary: "₹35L–₹70L typical (levels.fyi/Glassdoor)", link: "https://razorpay.com/jobs/", status: "open · apply direct", sourceChecked: "2026-10-01", notes: "Payments + fintech; queues/idempotency/RBAC experience maps directly. TypeScript/Node teams. India-remote." },
        { company: "Postman", role: "Senior Software Engineer", fitScore: 7, salary: "₹40L–₹80L typical (levels.fyi)", link: "https://www.postman.com/careers/", status: "open · apply direct", sourceChecked: "2026-10-01", notes: "API platform; TypeScript/Node/React core. Strong systems culture. India-remote." },
        { company: "Zerodha", role: "Senior Backend Engineer — Go/Node", fitScore: 7, salary: "₹30L–₹55L typical (Glassdoor)", link: "https://zerodha.com/careers/", status: "open · apply direct", sourceChecked: "2026-10-01", notes: "Stock brokerage; high-scale backend. Go primary, Node secondary." },
        { company: "Cred", role: "Senior Software Engineer — Full Stack", fitScore: 7, salary: "₹40L–₹75L typical (Glassdoor)", link: "https://careers.cred.club/", status: "open · apply direct", sourceChecked: "2026-10-01", notes: "Fintech; high-bar TypeScript/React/Node. Strict on systems design." },
        { company: "Swiggy", role: "Senior Engineer — Backend", fitScore: 7, salary: "₹35L–₹65L typical (Glassdoor)", link: "https://careers.swiggy.com/", status: "open · apply direct", sourceChecked: "2026-10-01", notes: "Hyper-scale delivery; Node/Java/Kotlin teams." },
        { company: "Groww", role: "Senior Software Engineer", fitScore: 7, salary: "₹35L–₹65L typical (Glassdoor)", link: "https://groww.in/careers", status: "open · apply direct", sourceChecked: "2026-10-01", notes: "Fintech; React/Node/Java. Strong on ownership." },
        { company: "Razorpay / OpenAI / Anthropic (indirect)", role: "Forward-deployed / Solutions Engineer", fitScore: 6, salary: "Contract/FT varies", link: "https://openai.com/careers", status: "open · global", sourceChecked: "2026-10-01", notes: "Optionality play if you want to ride the AI wave without abandoning your stack. Read JD carefully; many roles need ML depth." },
      ],
    },
    roleResearchNote: "Source check: 2026-10-01. Listings change quickly; re-open the exact listing before applying and confirm location eligibility, language, compensation, work authorization/relocation, and that the role is still accepting applications. Wellfound and levels.fyi listings are third-party leads, not employer verification. Salary figures from levels.fyi and Glassdoor are typical bands, not posted ranges.",
    outreachTemplates: {
      germanySaaS: "Subject: {Role} — TypeScript / Node.js | {specific evidence}\n\nHi {Name},\n\nI build production software across TypeScript, Node.js, React, and PostgreSQL. In my current work at Docita (healthcare SaaS, 25+ clinics, 1,000+ appointments/month) I own end-to-end delivery including tenant-scoped PostgreSQL with Row-Level Security, transactional outbox + idempotency for clinical notifications, and a NestJS + Prisma + React stack. Previous work at MAQ Software cut REST p95 latency 30% across Node/Express/NestJS services.\n\nI noticed {specific product/team detail} and would be interested in discussing {relevant problem}. I'm based in India and am exploring relocation via the EU Blue Card — happy to share degree recognition status and timeline.\n\nPortfolio: https://buildora.work\nGitHub: https://github.com/CVamsi27\nResume: https://buildora.work/VamsiKrishna_Resume.pdf\n\nRegards,\nVamsi",
      remote: "Hi {Name},\n\nI'm exploring remote {role-family} roles compatible with India. My strongest evidence is end-to-end ownership of Docita (healthcare SaaS: NestJS + Prisma + PostgreSQL + React + TanStack Query + Zod, 25+ clinics, multi-tenant RLS, transactional outbox, Playwright e2e). At MAQ I led a Node/React service that cut p95 latency 30% and mentored 4 engineers.\n\nDoes this role hire in India directly or through an EOR? Happy to share work samples and complete a paid trial.\n\nPortfolio: https://buildora.work\nGitHub: https://github.com/CVamsi27\nResume: https://buildora.work/VamsiKrishna_Resume.pdf\n\nRegards,\nVamsi",
      ossMaintainer: "Hi {maintainer},\n\nI read the contribution guide and the context on {issue}. Before coding, could you confirm whether {narrow proposed change} is in scope? I can add tests and share a small design note first.\n\nBackground: 5 years of Node/TypeScript/Postgres production work; current owner of a multi-tenant healthcare SaaS (Docita). I learn fast and stay scoped.\n\nThanks!\nVamsi",
      linkedinConnection: "Hi {Name} — saw your work on {specific thing}. I'm a senior full-stack engineer exploring {role-family} roles in {location}. If you're open to a quick chat about {team/product}, I'd love to connect. — Vamsi",
    },
    germanyChecklist: [
      { id: "germany-degree", text: "Verify degree and institution recognition through official Anabin/ZAB guidance", done: false, link: "https://anabin.kmk.org/anabin.html" },
      { id: "germany-blue-card", text: "Check current EU Blue Card requirements (2025: €41,041 IT shortage / €45,552 standard)", done: false, link: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" },
      { id: "germany-documents", text: "Apostille degree + transcripts + experience letters + passport + certified translations", done: false, link: "https://www.auswaertiges-amt.de/en/apostille" },
      { id: "germany-language", text: "Set an achievable German A1 study cadence (15 min/day, 5 days/week) and record weekly practice", done: false, link: "https://www.goethe.de/en/spr/kup/kur/dlk.html" },
      { id: "germany-budget", text: "Build a relocation budget from current official and provider quotes (blocked account, deposit, flights)", done: false },
      { id: "germany-health", text: "Confirm German statutory/private health insurance plan and provider quote", done: false },
      { id: "germany-network", text: "Join 2 German engineering communities (e.g. Berlin/JS, Munich Rust, ReactJS Munich Discord)", done: false },
      { id: "germany-portfolio", text: "Tailor portfolio + resume for German SaaS roles (formal tone, photo optional, 1-page CV)", done: false },
    ],
    weeklyTargets: {
      focusedStudyHours: 14,
      practiceArtifacts: 5,
      tailoredApplications: 5,
      qualityOutreach: 10,
      mockInterviews: 2,
      ossPRs: 1,
      publicProof: 1,
      leetcodeProblems: 25,
      germanPracticeMinutes: 75,
    },
    daySchedule: {
      timezone: "Asia/Kolkata",
      blocks: [
        { time: "07:00–08:30", label: "Exercise + freshen up (no breakfast)", minutes: 90, type: "health" },
        { time: "08:30–09:00", label: "Hydrate, plan the day, review yesterday's evidence ledger", minutes: 30, type: "ritual" },
        { time: "09:00–11:00", label: "Deep study block A — Bible chapter(s) for today", minutes: 120, type: "study", output: "Notes committed to study.buildora.work chapter" },
        { time: "11:00–11:15", label: "Break · walk · water", minutes: 15, type: "break" },
        { time: "11:15–13:15", label: "Deep study block B — coding patterns / system-design", minutes: 120, type: "study", output: "Code committed, test passing" },
        { time: "13:15–13:45", label: "Buffer · message check · OSS PR review", minutes: 30, type: "buffer" },
        { time: "13:45–14:00", label: "Lunch", minutes: 15, type: "meal" },
        { time: "14:00–15:30", label: "Practice / build — Docita feature, OSS PR, or portfolio artifact", minutes: 90, type: "practice", output: "PR opened or design doc drafted" },
        { time: "15:30–17:30", label: "Role research + tailored applications + outreach", minutes: 120, type: "job", output: "1 tailored application or 5 quality outreach messages" },
        { time: "17:30–18:00", label: "Break · decompression", minutes: 30, type: "break" },
        { time: "18:00–19:30", label: "Mock interview prep (Mon/Wed) or DSA practice (Tue/Thu/Sat)", minutes: 90, type: "interview", output: "1 mock interview or 5 LeetCode problems" },
        { time: "19:30–20:00", label: "Dinner with family", minutes: 30, type: "meal" },
        { time: "20:00–22:00", label: "Family time · light reading · German practice (15m)", minutes: 120, type: "family" },
        { time: "22:00", label: "Sleep target", minutes: 0, type: "anchor" },
      ],
    },
    remindersDefault: {
      morning: { enabled: false, time: "07:00", message: "Wake up. Hydrate. Plan today. — Vamsi" },
      studyStart: { enabled: false, time: "08:55", message: "5 min to first deep-study block. Close distractions." },
      studyMid: { enabled: false, time: "11:00", message: "Mid-morning stretch. Refill water." },
      roleResearch: { enabled: false, time: "15:25", message: "Tailored application OR 5 outreach messages before 17:30." },
      mockInterview: { enabled: false, time: "17:55", message: "Mock interview at 18:00 (Mon/Wed) — open DeepStudy cockpit." },
      eveningReview: { enabled: false, time: "21:30", message: "Evidence ledger check. Mark today's checklist items. Win of the day." },
      windDown: { enabled: false, time: "22:00", message: "Lights out. Sleep is the most senior skill." },
    },
    motivationalResources: {
      inspiration: [
        { title: "Last 100 Days of 2026 — Mehul Mohan", url: "https://www.youtube.com/watch?v=zAVQYpeLbHs", why: "Work backwards from the goal; 2hr/day practice; put work out." },
        { title: "The Senior Engineer — Charity Majors", url: "https://charity.wtf/tag/the-senior-engineer/", why: "Production-engineering mindset." },
      ],
      jobBoards: [
        { label: "LinkedIn Germany", url: "https://www.linkedin.com/jobs/search/?keywords=Senior+Full+Stack+TypeScript&location=Germany" },
        { label: "Wellfound", url: "https://wellfound.com/jobs?q=node+typescript" },
        { label: "StepStone", url: "https://www.stepstone.de/Jobs/Beruf/software-engineer.html" },
        { label: "XING", url: "https://www.xing.com/jobs" },
        { label: "Glassdoor Germany", url: "https://www.glassdoor.de/Job/germany-senior-software-engineer-jobs-SRCH_IL.0,7_IN96_KO8,32.htm" },
      ],
      mockInterview: [
        { label: "Micro1 AI Interview", url: "https://www.micro1.ai", why: "Free mock interviews with AI" },
        { label: "Pramp", url: "https://www.pramp.com", why: "Free peer mock interviews" },
        { label: "Interviewing.io", url: "https://interviewing.io", why: "Paid FAANG mock interviews" },
        { label: "Exercism", url: "https://exercism.org", why: "Mentored practice" },
        { label: "LeetCode", url: "https://leetcode.com", why: "DSA reps" },
        { label: "NeetCode", url: "https://neetcode.io", why: "Curated patterns" },
      ],
      oss: [
        { label: "Langfuse", url: "https://github.com/langfuse/langfuse", why: "TypeScript + Postgres + queues — strong fit" },
        { label: "Lightdash", url: "https://github.com/lightdash/lightdash", why: "TypeScript + React + NestJS — direct stack match" },
        { label: "Cal.com", url: "https://github.com/calcom/cal.com", why: "TypeScript + Next.js + Prisma — your bible covers this" },
        { label: "n8n", url: "https://github.com/n8n-io/n8n", why: "TypeScript + queues + Postgres" },
        { label: "Directus", url: "https://github.com/directus/directus", why: "TypeScript + NestJS + Postgres + multi-tenant" },
        { label: "Twenty (CRM)", url: "https://github.com/twentyhq/twenty", why: "TypeScript + NestJS + Postgres" },
      ],
      study: { label: "Senior Full Stack Bible", url: "https://study.buildora.work" },
    },
    verificationChecklist: {
      label: "How to verify this roadmap is actually working",
      items: [
        { id: "verify-curriculum", text: "pnpm career:validate passes (snapshot fresh, 100 days, 556 chapters, 700 checklist items, dates in range, links valid)" },
        { id: "verify-db", text: "pnpm career:seed with CAREER_OWNER_EMAIL=cvamsik99@gmail.com applies 5 rows; readback returns matching version + length" },
        { id: "verify-portal", text: "personal.buildora.work /roadmap loads career_command_center data and shows today's checklist" },
        { id: "verify-study", text: "Every study block link opens study.buildora.work chapter (404 → curriculum gap)" },
        { id: "verify-evidence", text: "Every 'done' checklist item has evidence type matching its contract (commit / url / application / manual-confirmation)" },
        { id: "verify-outreach", text: "10 outreach messages/day logged with company + role + date + response status" },
        { id: "verify-oss", text: "≥1 merged OSS PR / month referenced in resume or portfolio" },
        { id: "verify-mock", text: "2 mock interviews / week logged with platform + questions + score" },
        { id: "verify-germany", text: "Germany checklist 100% done before serious job applications" },
      ],
    },
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

  const rpcProbe = await (client as any).rpc("sync_career_roadmap", { p_user_id: userId, p_rows: [] });
  const rpcAvailable = !rpcProbe.error;
  if (!rpcAvailable) {
    console.warn(`sync_career_roadmap RPC unavailable (${rpcProbe.error?.message ?? "unknown"}); falling back to sequential upsert with the same row key validation. Apply migration 0006 to enable the atomic path.`);
  }

  if (rpcAvailable) {
    const { data: applied, error } = await (client as any).rpc("sync_career_roadmap", { p_user_id: userId, p_rows: rows });
    if (error) throw new Error(`Atomic career sync failed: ${error.message}`);
    if (applied !== rows.length) throw new Error(`Atomic sync applied ${String(applied)} rows; expected ${rows.length}.`);
  } else {
    for (const row of rows) {
      const { error: upsertError } = await (client as any)
        .from("tracker_data")
        .upsert({ user_id: row.user_id, key: row.key, value: row.value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
      if (upsertError) throw new Error(`Fallback upsert failed for ${row.key}: ${upsertError.message}`);
    }
  }
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
