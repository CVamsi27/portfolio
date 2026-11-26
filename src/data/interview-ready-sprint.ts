export type InterviewSprintStatus = "active" | "gated" | "next";

export type ResourceLink = {
  label: string;
  url: string;
  kind?: "study" | "repo" | "portfolio" | "channel" | "tool";
};

export type InterviewSprintStage = {
  id: string;
  number: string;
  label: string;
  window: string;
  status: InterviewSprintStatus;
  summary: string;
  points: string[];
  exit: string;
  links: ResourceLink[];
};

export type InterviewSprintDay = {
  day: number;
  date: string;
  isoDate: string;
  phase: string;
  build: string;
  description: string;
  deliverable: string;
  evidence: string;
  links: ResourceLink[];
};

export type InterviewSprintCadenceBlock = {
  days: string;
  time: string;
  slot: string;
  work: string;
  output: string;
  links?: ResourceLink[];
};

export type InterviewSprintTarget = {
  id: string;
  value: string;
  numericTarget: number;
  label: string;
  why: string;
};

export type InterviewRoundTrack = {
  id: string;
  weekday: string;
  title: string;
  focus: string;
  protocol: string;
  links: ResourceLink[];
};

export type ProjectStoryCard = {
  id: string;
  name: string;
  pillar: string;
  duration: string;
  scriptOutline: string;
  limitation: string;
  links: ResourceLink[];
};

export type WeeklyBlueprint = {
  week: string;
  window: string;
  phase: string;
  theme: string;
  description: string;
  deliverable: string;
  links: ResourceLink[];
};

export type OssRepoVerdict =
  | "ship-oss"
  | "contribute-upstream"
  | "proof-only"
  | "park";

export type OssPortfolioItem = {
  id: string;
  repoFolder: string;
  name: string;
  verdict: OssRepoVerdict;
  verdictLabel: string;
  currentState: string;
  why: string;
  nextAction: string;
  adoptionTarget: string;
  links: ResourceLink[];
};

export type FutureProofPillar = {
  id: string;
  title: string;
  horizon: string;
  whyDurable: string;
  concreteMoves: string[];
};

export type CtoHorizon = {
  id: string;
  horizon: string;
  timeline: string;
  roleTarget: string;
  objective: string;
  milestones: string[];
  exitGate: string;
};

export type UpstreamOssTarget = {
  id: string;
  repo: string;
  tier: "Tier A · Start Now" | "Tier B · Domain Twin" | "Tier C · AI & Workflows";
  stackAndGeo: string;
  whyFit: string;
  prIdeas: string[];
  url: string;
  localFolder?: string;
};

export type OssPlaybookStep = {
  id: string;
  window: string;
  title: string;
  detail: string;
};

export type FutureWedgeProject = {
  id: string;
  name: string;
  command: string;
  gate: string;
  buildWindow: string;
  pain: string;
  whatItDoes: string;
  ctoLeverage: string;
};

export type HiringLane = {
  id: string;
  share: string;
  name: string;
  targets: string;
  strategy: string;
  why: string;
};

export type OfferScorecardCriterion = {
  id: string;
  title: string;
  question: string;
};

export type ResumeCheckpointItem = {
  id: string;
  area: string;
  horizon: string;
  nowState: string;
  targetState: string;
  verifyBy: string;
};

export type SprintFocus = {
  date: string;
  isoDate: string;
  phase: string;
  build: string;
  deliverable: string;
  evidence: string;
  weekdayRound?: string;
  links: ResourceLink[];
};

/**
 * Startup-first hiring & CTO-track execution plan anchored to Monday, 23 November 2026.
 * Every study link resolves to a verified clean URL on study.buildora.work
 * (checked against repos/software-developer-bible).
 */
export const interviewReadySprint = {
  startDate: "2026-11-23",
  startDateLabel: "23 November 2026",
  headline:
    "Startup seat immediately → Future-proof systems & OSS adoption → CTO track",
  summary:
    "Anchored to Monday 23 November 2026: stop spawning new alpha repos and convert your existing proof into a Seed–Series B Senior/Founding SWE offer immediately. Run a 32-hour hiring engine (six hours Mon–Fri, two hours Saturday, Sunday off) pairing direct Founder/CTO outreach with npm publication of your top two proof CLIs (RLS Rehearsal & Deployproof), high-signal upstream PRs in Langfuse (AI observability on your exact TS/Postgres stack), and a 5-round technical rotation.",
  triggerDate: "4 December 2026",
  sprintWindow: "23 November–4 December 2026",
  defenseDate: "18 December 2026",
  endDate: "18 February 2027",
  weeklyCapacity: "32 hours · Sunday off",
  repositoryUrl: "https://github.com/CVamsi27/rls-rehearsal",
  triggerNote:
    "Diagnostic gate: zero new side projects until your offer is signed. If fewer than 10 qualified applications + founder notes are sent by Wednesday, pause study and ship outreach. If reply rate is under 10% across 15 startups, audit your pitch and top 3 resume bullets before sending more.",
  frontendNote:
    "Keep React, TypeScript, React Hook Form, Zod, and TanStack Query sharp via timed machine-coding drills (practice both unaided and AI-assisted review), while parking Whetstone, Rolloutproof, and Revokeproof until post-offer.",
  quickLinks: [
    {
      label: "Study Bible Roadmap",
      url: "https://study.buildora.work/ROADMAP",
      kind: "study",
    },
    {
      label: "Topic Brush-Up Rubric",
      url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.29-topic-brushup-roadmap",
      kind: "study",
    },
    {
      label: "Docita Case Study",
      url: "https://buildora.work/work/docita",
      kind: "portfolio",
    },
    {
      label: "RLS Rehearsal Repo",
      url: "https://github.com/CVamsi27/rls-rehearsal",
      kind: "repo",
    },
    {
      label: "Deployproof Repo",
      url: "https://github.com/CVamsi27/deployproof",
      kind: "repo",
    },
    {
      label: "Retryglass Repo",
      url: "https://github.com/CVamsi27/retryglass",
      kind: "repo",
    },
    {
      label: "Langfuse Fork",
      url: "https://github.com/CVamsi27/langfuse",
      kind: "repo",
    },
  ] satisfies ResourceLink[],
  hiringChannels: [
    {
      label: "Wellfound (Startups)",
      url: "https://wellfound.com/jobs",
      kind: "channel",
    },
    {
      label: "YC Work at a Startup",
      url: "https://www.workatastartup.com/jobs",
      kind: "channel",
    },
    {
      label: "Instahyre (India Tech)",
      url: "https://www.instahyre.com/",
      kind: "channel",
    },
    {
      label: "Cutshort (India Product)",
      url: "https://cutshort.io/",
      kind: "channel",
    },
    {
      label: "LinkedIn Senior Full-Stack (Remote India / Hyderabad)",
      url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20Full%20Stack%20TypeScript%20React%20Node&location=India",
      kind: "channel",
    },
    {
      label: "LinkedIn EU / Germany English Tech",
      url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20Full%20Stack%20TypeScript&location=Germany",
      kind: "channel",
    },
    {
      label: "Pramp / Exponent Peer Mocks",
      url: "https://www.tryexponent.com/practice",
      kind: "tool",
    },
  ] satisfies ResourceLink[],
  stages: [
    {
      id: "phase-0-income-pipeline",
      number: "01",
      label: "Phase 0 · Startup Pipeline, npm Unlock & Upstream OSS",
      window: "23 Nov – 4 Dec 2026",
      status: "active",
      summary:
        "Target Seed–Series B product startups (India Remote/Bengaluru/Hyderabad + EU/US Remote) directly through CTOs & founders, unlock real npm installs on RLS Rehearsal & Deployproof, and land your first upstream PR via your Langfuse fork.",
      points: [
        "Send 15 qualified startup applications/week; pair ≥60% with a 4-sentence Founder/CTO note linking /work/docita or /work/rls-rehearsal (plus Trojan-Horse bug/DX Loom for top 5 targets).",
        "Publish rls-rehearsal@0.3.0 (/repos/tenantproof) and deployproof (/repos/deployproof) to npm so external developers can run npx without GitHub tarball friction.",
        "Open 1–2 clean, reproducible bug/test PRs upstream in /repos/langfuse (TS/Postgres/LLM observability — instant AI-era hiring proof).",
        "Freeze new features in rolloutproof, revokeproof, and whetstone until your startup offer is countersigned.",
      ],
      exit: "≥25 startup applications sent, ≥20 Founder/CTO notes, rls-rehearsal + deployproof live on npm, ≥1 upstream Langfuse PR opened, ≥3 screens booked.",
      links: [
        {
          label: "Find Startup Roles",
          url: "https://study.buildora.work/00-strategy/00.05-find-startup-roles",
          kind: "study",
        },
        {
          label: "RLS Rehearsal Case Study",
          url: "https://buildora.work/work/rls-rehearsal",
          kind: "portfolio",
        },
        {
          label: "Deployproof Repo",
          url: "https://github.com/CVamsi27/deployproof",
          kind: "repo",
        },
        {
          label: "Langfuse Fork",
          url: "https://github.com/CVamsi27/langfuse",
          kind: "repo",
        },
      ],
    },
    {
      id: "phase-1-interview-conversion",
      number: "02",
      label: "Phase 1 · Interview Conversion & Real External Users",
      window: "5 Dec – 31 Dec 2026",
      status: "active",
      summary:
        "Convert startup screens into final loops with 5-round timed drills + 3-minute recorded proof demos, while collecting the first 5+ external developer trials on RLS Rehearsal / Deployproof and merging upstream OSS PRs.",
      points: [
        "Run the 5-round weekday rotation (1h/day): 25m unaided attempt → 10m verified study.buildora.work reference → 20m changed-case repair → 5m notes.",
        "Record and reuse 3-minute walkthroughs for Docita (end-to-end SaaS), RLS Rehearsal (failing control pass), and Retryglass (BullMQ crash sweep).",
        "Ship Supabase + Drizzle drop-in templates for rls-rehearsal and close the Deployproof trial cohort with real external issue feedback.",
        "When ≥2 interview loops are active, dial cold outreach down to 5/week and protect technical screen prep + weekly timed mocks.",
      ],
      exit: "≥3 active startup interview loops or paid engagements; 3 recorded demos; ≥2 merged upstream OSS PRs; first external developer trials logged.",
      links: [
        {
          label: "Tech Screen Patterns",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.02-tech-screen-patterns",
          kind: "study",
        },
        {
          label: "System Design Approach",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.15-how-to-approach",
          kind: "study",
        },
        {
          label: "Coding Patterns Index",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/",
          kind: "study",
        },
        {
          label: "Mock Interview Script",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.30-mock-interview-script",
          kind: "study",
        },
      ],
    },
    {
      id: "phase-2-offer-leverage",
      number: "03",
      label: "Phase 2 · Offer Closing, Launch Article & CTO Foundation",
      window: "1 Jan – 18 Feb 2027",
      status: "next",
      summary:
        "Close a high-ownership Seed–Series B startup offer (evaluating CTO proximity, equity, real traffic, and comp), publish a high-signal tenant-isolation launch post, and begin the Month 3–12 AI-native + Go future-proofing track on the job.",
      points: [
        "Evaluate written offers on CTO proximity, real production ownership, equity + cash comp, and start date; negotiate with market benchmarks.",
        "Launch 'How one missing WHERE leaks every tenant — and a CI control pass that proves RLS blocks it' on HN, r/PostgreSQL, r/Supabase & LinkedIn driving npx rls-rehearsal installs.",
        "Convert interview contacts into referrals and keep applying until a contract is countersigned with a confirmed start date.",
        "Lock your 30/60/90 onboarding plan: volunteer to own 1 reliability/AI-eval system in your first 90 days on the job.",
      ],
      exit: "Countersigned Senior/Founding SWE offer at a high-velocity startup + 10+ external repos using rls-rehearsal/deployproof + 30/60/90 onboarding plan.",
      links: [
        {
          label: "Salary Negotiation Guide",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.31-salary-negotiation-guide",
          kind: "study",
        },
        {
          label: "HR Questions",
          url: "https://study.buildora.work/00-strategy/00.04-hr-questions",
          kind: "study",
        },
        {
          label: "Developer Pain Lab Case Study",
          url: "https://buildora.work/work/developer-pain-lab",
          kind: "portfolio",
        },
      ],
    },
  ] satisfies InterviewSprintStage[],
  cadence: {
    headline: "The 32-hour hiring engine (starting Mon 23 Nov 2026)",
    note: "Six focused hours Mon–Fri, two hours Saturday, Sunday completely off. Outbound hiring conversations always come before study or code. Real interviews or paid client calls replace lower-priority blocks—never stack extra hours.",
    blocks: [
      {
        days: "Mon–Fri",
        slot: "09:00–11:00",
        time: "2.0 h",
        work: "Qualified applications & direct hiring-manager outreach (Track A: India Remote / Hyderabad; Track B: EU/Germany). Tailor summary + 2 bullets with --focus and pair 50%+ with a direct note.",
        output: "3 tailored applications submitted + logged with follow-up date",
        links: [
          {
            label: "Find Startup Roles",
            url: "https://study.buildora.work/00-strategy/00.05-find-startup-roles",
            kind: "study",
          },
          {
            label: "Wellfound",
            url: "https://wellfound.com/jobs",
            kind: "channel",
          },
        ],
      },
      {
        days: "Mon–Fri",
        slot: "11:15–12:45",
        time: "1.5 h",
        work: "Warm contacts, employee referrals & scoped paid-diagnostic enquiries (Tenant-Isolation Review / BullMQ Queue Audit).",
        output: "2 warm/referral messages + 1 paid-diagnostic enquiry sent",
        links: [
          {
            label: "Communication Playbook",
            url: "https://study.buildora.work/00-strategy/00.01-communication",
            kind: "study",
          },
        ],
      },
      {
        days: "Mon–Fri",
        slot: "13:00–14:00",
        time: "1.0 h",
        work: "OSS & Proof Leverage (strictly capped at 1h): publish rls-rehearsal & deployproof to npm, ship Supabase/Drizzle templates, record 3-min demos, or land clean upstream PRs in /repos/langfuse.",
        output: "1 tangible npm release, demo recording, or upstream PR progressed",
        links: [
          {
            label: "RLS Rehearsal",
            url: "https://github.com/CVamsi27/rls-rehearsal",
            kind: "repo",
          },
          {
            label: "Deployproof",
            url: "https://github.com/CVamsi27/deployproof",
            kind: "repo",
          },
          {
            label: "Langfuse Fork",
            url: "https://github.com/CVamsi27/langfuse",
            kind: "repo",
          },
        ],
      },
      {
        days: "Mon–Fri",
        slot: "15:00–16:00",
        time: "1.0 h",
        work: "5-round interview drill: 25m unaided attempt → 10m verified study.buildora.work chapter → 20m changed-case repair → 5m failure notes.",
        output: "1 completed drill logged with observed gap and fix",
        links: [
          {
            label: "Interview Cheatsheets",
            url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/",
            kind: "study",
          },
        ],
      },
      {
        days: "Mon–Fri",
        slot: "16:00–16:30",
        time: "0.5 h",
        work: "Follow-ups (5-business-day cadence), pipeline logging, and picking tomorrow's top 3 roles before shutting down.",
        output: "Tracker accurate; zero stale replies; tomorrow queued",
      },
      {
        days: "Saturday",
        slot: "09:00–11:00",
        time: "2.0 h",
        work: "Weekly funnel audit (reply rate diagnostic + next-week adjustment) + 1 full timed mock interview or recorded project defense.",
        output: "Weekly review saved + 1 top interview gap assigned for Monday",
        links: [
          {
            label: "Mock Interview Bank",
            url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.11-mock-interview-bank",
            kind: "study",
          },
        ],
      },
      {
        days: "Sunday",
        slot: "Rest",
        time: "0 h",
        work: "Protected recovery day — zero catch-up work.",
        output: "Rested for Monday 09:00",
      },
    ] satisfies InterviewSprintCadenceBlock[],
  },
  targets: [
    {
      id: "applications",
      value: "15",
      numericTarget: 15,
      label: "Tailored applications / wk",
      why: "Minimum volume to keep 2–3 live screens running simultaneously.",
    },
    {
      id: "outreaches",
      value: "10",
      numericTarget: 10,
      label: "Warm / referral msgs / wk",
      why: "Direct hiring-manager & peer notes convert 5–8× better than cold forms.",
    },
    {
      id: "proposals",
      value: "5",
      numericTarget: 5,
      label: "Paid diagnostic enquiries / wk",
      why: "Fastest path to near-term cash via RLS or BullMQ reliability reviews.",
    },
    {
      id: "interviews",
      value: "2+",
      numericTarget: 2,
      label: "Screens / calls booked / wk",
      why: "Leading indicator of pipeline health; triggers 10-app audit if zero.",
    },
    {
      id: "drills",
      value: "5",
      numericTarget: 5,
      label: "Timed round drills / wk",
      why: "One 60-min focused drill per weekday across all 5 senior screens.",
    },
    {
      id: "mock",
      value: "1",
      numericTarget: 1,
      label: "Timed mock / defense / wk",
      why: "Exposes verbal pacing, trade-off clarity, and edge-case blind spots.",
    },
  ] satisfies InterviewSprintTarget[],
  interviewRounds: [
    {
      id: "frontend",
      weekday: "Monday",
      title: "Round 1 · JS / TS Internals & React Machine Coding",
      focus:
        "V8 execution, event loop microtasks, closures, TypeScript generics/narrowing, React Fiber/reconciliation, TanStack Query, React Hook Form + Zod, and rendering performance.",
      protocol:
        "Build one realistic interactive UI widget (debounced search with AbortController, paginated table, or multi-step Zod form) in 25m without AI, then inspect V8/Fiber trade-offs.",
      links: [
        {
          label: "V8 Execution & Optimization",
          url: "https://study.buildora.work/10-frontend/10.1-javascript/01-execution-and-scope/10.1.1.07-v8-execution-and-optimization",
          kind: "study",
        },
        {
          label: "JS Event Loop",
          url: "https://study.buildora.work/10-frontend/10.1-javascript/03-async-concurrency/10.1.3.01-event-loop",
          kind: "study",
        },
        {
          label: "Abort & Cancellation",
          url: "https://study.buildora.work/10-frontend/10.1-javascript/03-async-concurrency/10.1.3.05-abort-and-cancellation",
          kind: "study",
        },
        {
          label: "TypeScript Generics",
          url: "https://study.buildora.work/10-frontend/10.2-typescript/02-generics-and-inference/10.2.2.01-generics",
          kind: "study",
        },
        {
          label: "React Fiber Internals",
          url: "https://study.buildora.work/10-frontend/10.3-react/01-react-internals/10.3.1.02-fiber",
          kind: "study",
        },
        {
          label: "TanStack Query",
          url: "https://study.buildora.work/10-frontend/10.3-react/03-advanced-hooks-and-patterns/10.3.3.07-tanstack-query",
          kind: "study",
        },
        {
          label: "React Performance",
          url: "https://study.buildora.work/10-frontend/10.3-react/03-advanced-hooks-and-patterns/10.3.3.05-performance",
          kind: "study",
        },
      ],
    },
    {
      id: "backend",
      weekday: "Tuesday",
      title: "Round 2 · Node / NestJS, APIs, PostgreSQL & Security",
      focus:
        "NestJS DI & guards, REST pagination/webhooks/rate-limiting, PostgreSQL MVCC, indexing, EXPLAIN plans, deadlocks, Row-Level Security (RLS), JWT/OAuth2, and RBAC/ABAC.",
      protocol:
        "Trace a concurrent multi-tenant write + webhook retry path on paper, write the SQL index & RLS policy, and explain what breaks when isolation or idempotency is missing.",
      links: [
        {
          label: "PostgreSQL Row-Level Security",
          url: "https://study.buildora.work/20-backend/20.4-database/01-postgresql-foundations/20.4.1.06-row-level-security",
          kind: "study",
        },
        {
          label: "PostgreSQL MVCC",
          url: "https://study.buildora.work/20-backend/20.4-database/01-postgresql-foundations/20.4.1.03-mvcc",
          kind: "study",
        },
        {
          label: "Transactions & Isolation",
          url: "https://study.buildora.work/20-backend/20.4-database/03-transactions-and-replication/20.4.3.01-transactions",
          kind: "study",
        },
        {
          label: "NestJS Guards & Lifecycle",
          url: "https://study.buildora.work/20-backend/20.2-nestjs/02-request-lifecycle/20.2.2.02-guards",
          kind: "study",
        },
        {
          label: "Webhooks & Idempotency",
          url: "https://study.buildora.work/20-backend/20.3-rest-apis/03-payloads-errors-integration/20.3.3.05-webhooks",
          kind: "study",
        },
        {
          label: "JWT Trade-Offs",
          url: "https://study.buildora.work/20-backend/20.5-security/01-auth/20.5.1.05-jwt",
          kind: "study",
        },
        {
          label: "RBAC & ABAC",
          url: "https://study.buildora.work/20-backend/20.5-security/01-auth/20.5.1.09-rbac-abac",
          kind: "study",
        },
      ],
    },
    {
      id: "dsa",
      weekday: "Wednesday",
      title: "Round 3 · Timed Coding Patterns (TypeScript DSA)",
      focus:
        "High-frequency senior interview patterns: sliding window, two pointers, binary search on answer, intervals, BFS/DFS/topological sort, heaps, and dynamic programming.",
      protocol:
        "Solve 1 unseen medium problem in TypeScript in 25 minutes (state invariants & complexity aloud), test edge cases manually, then solve a twist/variation in 20 minutes.",
      links: [
        {
          label: "Sliding Window",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.01-sliding-window",
          kind: "study",
        },
        {
          label: "Two Pointers",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.02-two-pointers",
          kind: "study",
        },
        {
          label: "Binary Search",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.03-binary-search",
          kind: "study",
        },
        {
          label: "Intervals",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.05-intervals",
          kind: "study",
        },
        {
          label: "DFS & BFS",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/02-graphs-trees-grids/70.2.2.01-dfs-bfs",
          kind: "study",
        },
        {
          label: "Topological Sort",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/02-graphs-trees-grids/70.2.2.04-topological-sort",
          kind: "study",
        },
        {
          label: "Dynamic Programming",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/03-recursion-and-optimization/70.2.3.02-dynamic-programming",
          kind: "study",
        },
      ],
    },
    {
      id: "system-design",
      weekday: "Thursday",
      title: "Round 4 · Senior System Design & Failure Analysis",
      focus:
        "Clarifying scale/SLOs, API + schema boundaries, multi-tenant isolation, transactional outbox, queues & idempotency keys, caching/rate-limiting, and zero-downtime rollouts.",
      protocol:
        "Run a 40-minute timed whiteboard design (5m requirements, 10m API/data model, 15m deep dive on consistency & failure modes, 10m bottlenecks & observability).",
      links: [
        {
          label: "How to Approach System Design",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.15-how-to-approach",
          kind: "study",
        },
        {
          label: "Outbox & CDC",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.18-outbox-and-cdc",
          kind: "study",
        },
        {
          label: "Idempotency & Retry Deep Dive",
          url: "https://study.buildora.work/30-architecture/30.3-infra-patterns/02-failure-and-recovery/30.3.2.06-idempotency-retry-deep-dive",
          kind: "study",
        },
        {
          label: "Multi-Tenant SaaS Architecture",
          url: "https://study.buildora.work/30-architecture/30.3-infra-patterns/04-data-at-scale/30.3.4.04-multi-tenant-saas-architecture",
          kind: "study",
        },
        {
          label: "Rate Limiting",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.08-rate-limiting",
          kind: "study",
        },
        {
          label: "Payment Gateway Case Study",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/02-case-studies/30.2.2.06-payment-gateway",
          kind: "study",
        },
        {
          label: "System Design Cheat Sheet",
          url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.05-system-design-cheat-sheet",
          kind: "study",
        },
      ],
    },
    {
      id: "project-behavioral",
      weekday: "Friday",
      title: "Round 5 · Project Defense, Architecture Deep Dive & STAR",
      focus:
        "3-minute spoken walkthroughs of Docita, MAQ Software, RLS Rehearsal, and Retryglass; stating exact mechanisms, failure recoveries, trade-offs, and honest limitations.",
      protocol:
        "Record a 3-minute screen/voice defense without notes; answer 3 adversarial follow-up questions ('What happens if Postgres fails mid-write?', 'What does RLS NOT protect?').",
      links: [
        {
          label: "STAR Method",
          url: "https://study.buildora.work/00-strategy/00.03-star-method",
          kind: "study",
        },
        {
          label: "System-Design Behavioral",
          url: "https://study.buildora.work/70-interview-toolkit/70.1-behavioral/70.1.04-system-design-behavioral",
          kind: "study",
        },
        {
          label: "Docita Multi-Tenancy & RLS",
          url: "https://study.buildora.work/projects/docita/02-multi-tenancy-rls",
          kind: "study",
        },
        {
          label: "Docita Async Processing",
          url: "https://study.buildora.work/projects/docita/03-async-processing",
          kind: "study",
        },
        {
          label: "Docita Complete Defense",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.36-docita-complete-interview-defense",
          kind: "study",
        },
        {
          label: "MAQ Product Engineering",
          url: "https://study.buildora.work/projects/maq/01-product-engineering",
          kind: "study",
        },
      ],
    },
  ] satisfies InterviewRoundTrack[],
  projectStories: [
    {
      id: "docita",
      name: "Docita — End-to-End Ownership",
      pillar: "Full-Stack Product & Data Correctness",
      duration: "3 min",
      scriptOutline:
        "Walk through one complete clinic booking & billing write: React Hook Form + shared Zod schema → TanStack Query mutation → NestJS guard & clinic-scoped Prisma/PostgreSQL RLS write → HMAC-verified Razorpay webhook & bounded retry worker preventing duplicate invoices.",
      limitation:
        "Independent venture (no production multi-clinic scale claims); state clearly what automated checks verify vs what requires live load.",
      links: [
        {
          label: "Portfolio Case Study",
          url: "https://buildora.work/work/docita",
          kind: "portfolio",
        },
        {
          label: "Claim Walkthrough",
          url: "https://study.buildora.work/projects/docita/24-resume-claim-walkthrough",
          kind: "study",
        },
        {
          label: "Architecture Decisions",
          url: "https://study.buildora.work/projects/docita/01-architecture-decisions",
          kind: "study",
        },
      ],
    },
    {
      id: "rls-rehearsal",
      name: "RLS Rehearsal — Executable Tenant Isolation",
      pillar: "PostgreSQL Security & CI Verification",
      duration: "3 min",
      scriptOutline:
        "Two synthetic tenants share tables in a disposable Postgres instance. Show how a normal mocked unit test misses a forgotten workspace filter, how RLS Rehearsal enforces the boundary, and how the control pass disables RLS to prove the assertion actually catches leaks.",
      limitation:
        "Proves load-bearing policy enforcement on tested paths; not a penetration test or full query-surface audit.",
      links: [
        {
          label: "Portfolio Case Study",
          url: "https://buildora.work/work/rls-rehearsal",
          kind: "portfolio",
        },
        {
          label: "GitHub Repository",
          url: "https://github.com/CVamsi27/rls-rehearsal",
          kind: "repo",
        },
        {
          label: "PostgreSQL RLS Guide",
          url: "https://study.buildora.work/20-backend/20.4-database/01-postgresql-foundations/20.4.1.06-row-level-security",
          kind: "study",
        },
      ],
    },
    {
      id: "retryglass",
      name: "Retryglass — Crash-Point Failure Recovery",
      pillar: "Background Workers & Idempotency",
      duration: "3 min",
      scriptOutline:
        "A BullMQ worker executes a side effect and crashes before acknowledging. Show how Retryglass sweeps crash points to distinguish duplicate vs lost effects, enforces a business idempotency key, and emits a failing Vitest reproduction before the fix.",
      limitation:
        "Synthetic local worker fixtures; demonstrates determinism and retry safety rather than production cluster throughput.",
      links: [
        {
          label: "Portfolio Case Study",
          url: "https://buildora.work/work/retryglass",
          kind: "portfolio",
        },
        {
          label: "GitHub Repository",
          url: "https://github.com/CVamsi27/retryglass",
          kind: "repo",
        },
        {
          label: "Idempotency & Retry Deep Dive",
          url: "https://study.buildora.work/30-architecture/30.3-infra-patterns/02-failure-and-recovery/30.3.2.06-idempotency-retry-deep-dive",
          kind: "study",
        },
      ],
    },
  ] satisfies ProjectStoryCard[],
  days: [
    {
      day: 1,
      date: "Mon 23 Nov",
      isoDate: "2026-11-23",
      phase: "Phase 0 · Launch",
      build: "Reset pipeline, sync updated 1-page resumes & ship first 3 applications + 2 warm notes",
      description:
        "Audit every open thread in Opportunities, generate fresh Global/India and EU 1-page PDFs from resume-generator, verify RLS Rehearsal & Retryglass case studies on buildora.work, send 3 tailored applications paired with 2 direct hiring-manager/peer messages, and run Round 1 JS/V8 drill.",
      deliverable:
        "Updated resumes synced · 3 applications + 2 warm messages sent · 1 V8/event-loop recall drill",
      evidence:
        "Dated submissions logged separately from drafts + 25m unaided V8/event-loop trace saved",
      links: [
        {
          label: "Find Startup Roles",
          url: "https://study.buildora.work/00-strategy/00.05-find-startup-roles",
          kind: "study",
        },
        {
          label: "V8 Execution & Optimization",
          url: "https://study.buildora.work/10-frontend/10.1-javascript/01-execution-and-scope/10.1.1.07-v8-execution-and-optimization",
          kind: "study",
        },
        {
          label: "JS Event Loop",
          url: "https://study.buildora.work/10-frontend/10.1-javascript/03-async-concurrency/10.1.3.01-event-loop",
          kind: "study",
        },
      ],
    },
    {
      day: 2,
      date: "Tue 24 Nov",
      isoDate: "2026-11-24",
      phase: "Phase 0 · Launch",
      build:
        "Shortlist 20 Seed–Series B startups + 5 Founder/CTO pitches + publish rls-rehearsal@0.3.0 to npm + RLS/MVCC drill",
      description:
        "Lock the 'no new side projects' rule. Shortlist 20 product startups (10 India Remote/BLR/HYD + 10 EU/US Remote) on TS + Postgres/AI, send 5 direct Founder/CTO pitches linking /work/docita or /work/rls-rehearsal, complete the npm publish step for rls-rehearsal@0.3.0 (/repos/tenantproof), and drill PostgreSQL MVCC + RLS.",
      deliverable:
        "20-startup shortlist · 3 apps + 5 Founder/CTO notes · rls-rehearsal@0.3.0 live on npm",
      evidence:
        "Logged sends + npx rls-rehearsal --help works in a clean temp folder + MVCC/RLS notes",
      links: [
        {
          label: "PostgreSQL Row-Level Security",
          url: "https://study.buildora.work/20-backend/20.4-database/01-postgresql-foundations/20.4.1.06-row-level-security",
          kind: "study",
        },
        {
          label: "RLS Rehearsal Repo",
          url: "https://github.com/CVamsi27/rls-rehearsal",
          kind: "repo",
        },
        {
          label: "RLS Rehearsal Case Study",
          url: "https://buildora.work/work/rls-rehearsal",
          kind: "portfolio",
        },
      ],
    },
    {
      day: 3,
      date: "Wed 25 Nov",
      isoDate: "2026-11-25",
      phase: "Phase 0 · Launch",
      build:
        "Mid-week gate (≥9 apps) + record 3-min Docita walkthrough + publish deployproof to npm + DSA sliding window",
      description:
        "Check mid-week pace (≥10 apps + founder notes before close). Record a crisp 3-minute Docita end-to-end architecture walkthrough, publish deployproof (/repos/deployproof) to npm so external teams can run `npx deployproof check` with zero Docker setup, and run a 35-minute TypeScript Sliding Window + Two Pointers drill.",
      deliverable:
        "≥9 cumulative apps · 3-min Docita Loom · deployproof live on npm · 1 timed DSA drill",
      evidence:
        "Recording saved + npx deployproof demo exits 0 in temp dir + clean TS DSA solution",
      links: [
        {
          label: "Docita Claim Walkthrough",
          url: "https://study.buildora.work/projects/docita/24-resume-claim-walkthrough",
          kind: "study",
        },
        {
          label: "Deployproof Repo",
          url: "https://github.com/CVamsi27/deployproof",
          kind: "repo",
        },
        {
          label: "Sliding Window",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/01-linear-structures/70.2.1.01-sliding-window",
          kind: "study",
        },
      ],
    },
    {
      day: 4,
      date: "Thu 26 Nov",
      isoDate: "2026-11-26",
      phase: "Phase 0 · Launch",
      build:
        "Publish rls-rehearsal@0.3.0 & deployproof to npm + 3 Lane 1/2 startup apps + 2 founder DMs + Langfuse PR #1 repro",
      description:
        "Publish rls-rehearsal@0.3.0 (/repos/tenantproof) and deployproof (/repos/deployproof) to npm so developers can install via npx with zero friction. Send 3 tailored Lane 1/2 startup applications paired with 2 direct Founder/CTO DMs linking /work/docita or /work/rls-rehearsal, reproduce 1 clean bug/test issue in /repos/langfuse for PR #1, and complete a 40-minute Multi-Tenant SaaS System Design drill.",
      deliverable:
        "rls-rehearsal + deployproof live on npm · 3 apps + 2 Founder/CTO DMs · Langfuse PR #1 issue reproduced",
      evidence:
        "npx rls-rehearsal & npx deployproof run in temp dir + local failing regression test in /repos/langfuse + design notes",
      links: [
        {
          label: "Multi-Tenant SaaS Architecture",
          url: "https://study.buildora.work/30-architecture/30.3-infra-patterns/04-data-at-scale/30.3.4.04-multi-tenant-saas-architecture",
          kind: "study",
        },
        {
          label: "Langfuse Fork",
          url: "https://github.com/CVamsi27/langfuse",
          kind: "repo",
        },
        {
          label: "RLS Rehearsal Repo",
          url: "https://github.com/CVamsi27/rls-rehearsal",
          kind: "repo",
        },
      ],
    },
    {
      day: 5,
      date: "Fri 27 Nov",
      isoDate: "2026-11-27",
      phase: "Phase 0 · Launch",
      build:
        "Open Langfuse PR #1 + pick twentyhq/twenty PR #1 issue + 2 Trojan-Horse Looms (15 apps / 10 warm) + Retryglass demo",
      description:
        "Open your first clean upstream PR from /repos/langfuse (bug fix + failing-then-passing regression test) and pick 1 confirmed bug issue in twentyhq/twenty. Send 2 Trojan-Horse product Looms to top dream startups, hit Week 1 scoreboard (15 tailored apps, 10 Founder/CTO or referral notes, 5 diagnostic enquiries), record the 3-minute Retryglass demo, and rehearse 2 MAQ STAR stories.",
      deliverable:
        "Langfuse PR #1 opened · twenty issue claimed · 2 Trojan-Horse Looms + Week 1 targets hit · 3-min Retryglass demo",
      evidence:
        "Public Langfuse PR URL + recorded Retryglass demo + timed MAQ ownership & perf stories",
      links: [
        {
          label: "STAR Method",
          url: "https://study.buildora.work/00-strategy/00.03-star-method",
          kind: "study",
        },
        {
          label: "Langfuse Fork",
          url: "https://github.com/CVamsi27/langfuse",
          kind: "repo",
        },
        {
          label: "Retryglass Case Study",
          url: "https://buildora.work/work/retryglass",
          kind: "portfolio",
        },
      ],
    },
    {
      day: 6,
      date: "Sat 28 Nov",
      isoDate: "2026-11-28",
      phase: "Phase 0 · Review",
      build:
        "Week 1 Funnel Audit (10% reply-rate gate) + 1 Timed Startup Mock Interview (2h cap)",
      description:
        "Run the Weekly Review: count real sends vs drafts, evaluate the 10% reply-rate gate across Week 1's 15 applications, run one 60-minute timed startup-style mock interview (feature debugging + system design), and lock Monday's #1 fix.",
      deliverable:
        "Week 1 funnel audit saved · Mock rubric scored · Monday top technical gap locked",
      evidence:
        "Conversion table (apps → replies → screens) + written debrief with 1 changed-case repair",
      links: [
        {
          label: "Mock Interview Script",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.30-mock-interview-script",
          kind: "study",
        },
        {
          label: "Behavioral Anti-Patterns",
          url: "https://study.buildora.work/70-interview-toolkit/70.1-behavioral/70.1.05-behavioral-anti-patterns-checklist",
          kind: "study",
        },
      ],
    },
    {
      day: 7,
      date: "Mon 30 Nov",
      isoDate: "2026-11-30",
      phase: "Phase 0 · Follow-Up Wave",
      build:
        "5-day follow-up wave on Nov 23 batch + 3 Lane 1/2 apps + start PR #2 (Postgres/queue/eval) + React/TanStack drill",
      description:
        "Send polite 5-business-day follow-ups on silent Nov 23 startups with a fresh demo/npm link, submit 3 new Lane 1/2 startup apps, start PR #2 in Langfuse or twentyhq/twenty (targeting Postgres queries, worker retries, or evals with a design comment first), and drill React Fiber + TanStack Query optimistic mutations.",
      deliverable:
        "Nov 23 follow-ups sent · 3 new startup apps · PR #2 design note posted · React/TanStack drill",
      evidence:
        "Follow-up dates updated + maintainer-visible design comment + working optimistic rollback code",
      links: [
        {
          label: "React Fiber Internals",
          url: "https://study.buildora.work/10-frontend/10.3-react/01-react-internals/10.3.1.02-fiber",
          kind: "study",
        },
        {
          label: "TanStack Query",
          url: "https://study.buildora.work/10-frontend/10.3-react/03-advanced-hooks-and-patterns/10.3.3.07-tanstack-query",
          kind: "study",
        },
        {
          label: "React Performance",
          url: "https://study.buildora.work/10-frontend/10.3-react/03-advanced-hooks-and-patterns/10.3.3.05-performance",
          kind: "study",
        },
      ],
    },
    {
      day: 8,
      date: "Tue 1 Dec",
      isoDate: "2026-12-01",
      phase: "Phase 0 · Follow-Up Wave",
      build:
        "3 apps + 2 diagnostic/founder follow-ups + advance PR #2 + Webhooks, Outbox & Idempotency drill",
      description:
        "Follow up on Nov 24 founder pitches and diagnostic enquiries, send 3 backend-heavy/full-stack startup apps (--focus backend), advance your PR #2 implementation and regression tests, and drill HMAC webhooks, transactional outbox, and idempotency keys.",
      deliverable:
        "3 apps + follow-ups · PR #2 tests green locally · Outbox & webhook idempotency design",
      evidence:
        "Updated tracker + trace showing duplicate webhook handling & crash-before-ack recovery",
      links: [
        {
          label: "Webhooks Design",
          url: "https://study.buildora.work/20-backend/20.3-rest-apis/03-payloads-errors-integration/20.3.3.05-webhooks",
          kind: "study",
        },
        {
          label: "Outbox & CDC",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.18-outbox-and-cdc",
          kind: "study",
        },
        {
          label: "Idempotency & Retry Deep Dive",
          url: "https://study.buildora.work/30-architecture/30.3-infra-patterns/02-failure-and-recovery/30.3.2.06-idempotency-retry-deep-dive",
          kind: "study",
        },
      ],
    },
    {
      day: 9,
      date: "Wed 2 Dec",
      isoDate: "2026-12-02",
      phase: "Phase 0 · Follow-Up Wave",
      build:
        "3 apps + 2 warm intros + open/land PR #2 + light DSA maintenance (455+ banked) & startup feature coding",
      description:
        "Keep pipeline pace toward ≥25 cumulative apps, send 2 peer referral notes, open PR #2 (Langfuse/twenty) with full test proof, and run a 45-minute practical TS feature-build + light graph/topo-sort maintenance drill (keep DSA light since 455+ LeetCode are already solved).",
      deliverable:
        "3 apps + 2 warm intros · PR #2 submitted · Practical TS feature + topo-sort drill",
      evidence:
        "PR #2 link + complexity & cycle-detection check passed",
      links: [
        {
          label: "DFS & BFS",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/02-graphs-trees-grids/70.2.2.01-dfs-bfs",
          kind: "study",
        },
        {
          label: "Topological Sort",
          url: "https://study.buildora.work/70-interview-toolkit/70.2-coding-patterns/02-graphs-trees-grids/70.2.2.04-topological-sort",
          kind: "study",
        },
        {
          label: "TypeScript Generics",
          url: "https://study.buildora.work/10-frontend/10.2-typescript/02-generics-and-inference/10.2.2.01-generics",
          kind: "study",
        },
      ],
    },
    {
      day: 10,
      date: "Thu 3 Dec",
      isoDate: "2026-12-03",
      phase: "Phase 0 · Close",
      build:
        "3 Lane 3 EU/Remote apps + Day-11 maintainer/CTO DM + draft Show HN / r/Supabase RLS launch + Payment System Design",
      description:
        "Send 3 targeted roles (including Lane 3 EU/NL/DE startups matching TS + OSS proof), send Day-11 direct DMs to the CTO/maintainers who reviewed your PRs, draft the Show HN / r/Supabase launch post for rls-rehearsal (with 30s control-pass GIF), and complete a 40-minute Payment Gateway & Auth (JWT vs session revocation) system design drill.",
      deliverable:
        "3 apps + Day-11 maintainer DM · rls-rehearsal launch draft · Payment Gateway & Auth matrix",
      evidence:
        "Sent CTO/maintainer DM + saved launch draft + design notes on double-charge prevention & revocation",
      links: [
        {
          label: "Payment Gateway Case Study",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/02-case-studies/30.2.2.06-payment-gateway",
          kind: "study",
        },
        {
          label: "JWT Security",
          url: "https://study.buildora.work/20-backend/20.5-security/01-auth/20.5.1.05-jwt",
          kind: "study",
        },
        {
          label: "RBAC & ABAC",
          url: "https://study.buildora.work/20-backend/20.5-security/01-auth/20.5.1.09-rbac-abac",
          kind: "study",
        },
      ],
    },
    {
      day: 11,
      date: "Fri 4 Dec",
      isoDate: "2026-12-04",
      phase: "Phase 0 · Exit Gate",
      build:
        "Phase 0 Checkpoint: ≥25 apps, ≥20 Founder/CTO notes, 2 CLIs on npm, ≥1–2 Langfuse/twenty PRs + Full Defense Rehearsal",
      description:
        "Evaluate the Phase 0 exit gate across Weeks 1–2 (23 Nov – 4 Dec). Verify npm packages, merged/open OSS PRs, and active screen count. Rehearse all three 3-minute project stories back-to-back and lock Phase 1 capacity (keep 15 apps/wk if <2 live loops, or shift to 5 apps/wk + round defense if ≥2 loops are active).",
      deliverable:
        "Phase 0 scoreboard evaluated · Phase 1 capacity allocation locked · Resume checkpoint synced",
      evidence:
        "Dated conversion report (apps → replies → screens → calls) + next week's top 3 focus gaps",
      links: [
        {
          label: "Topic Brush-Up Rubric",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.29-topic-brushup-roadmap",
          kind: "study",
        },
        {
          label: "System Design Cheat Sheet",
          url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.05-system-design-cheat-sheet",
          kind: "study",
        },
        {
          label: "SQL & Data Modeling Cheat Sheet",
          url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.07-sql-data-modeling-cheat-sheet",
          kind: "study",
        },
      ],
    },
  ] satisfies InterviewSprintDay[],
  cheatsheets: [
    {
      label: "JavaScript",
      url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.01-javascript-cheat-sheet",
      kind: "study",
    },
    {
      label: "TypeScript",
      url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.02-typescript-cheat-sheet",
      kind: "study",
    },
    {
      label: "React & Next.js",
      url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.03-react-nextjs-cheat-sheet",
      kind: "study",
    },
    {
      label: "Backend",
      url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.04-backend-cheat-sheet",
      kind: "study",
    },
    {
      label: "System Design",
      url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.05-system-design-cheat-sheet",
      kind: "study",
    },
    {
      label: "Docker / K8s / CI",
      url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.06-docker-kubernetes-cicd-cheat-sheet",
      kind: "study",
    },
    {
      label: "SQL & Data Modeling",
      url: "https://study.buildora.work/70-interview-toolkit/70.3-cheatsheets/70.3.07-sql-data-modeling-cheat-sheet",
      kind: "study",
    },
  ] satisfies ResourceLink[],
  weeklyBlueprints: [
    {
      week: "Weeks 3–4",
      window: "7 Dec – 19 Dec 2026",
      phase: "Phase 1 · Technical Conversion",
      theme: "Architecture Patterns, Testing Rigor & Take-Home Speed",
      description:
        "Convert active screens into final rounds. Master SOLID/Strategy/Observer/Repository/CQRS patterns for live LLD rounds, sharpen Vitest/Playwright testing strategy, and drill 4-hour senior take-home structure.",
      deliverable:
        "≥2 active technical loops · 2 timed mocks debriefed · 1 take-home dry run",
      links: [
        {
          label: "SOLID Principles",
          url: "https://study.buildora.work/30-architecture/30.1-design-patterns/01-foundations/30.1.1.01-solid-principles",
          kind: "study",
        },
        {
          label: "Strategy & Observer Patterns",
          url: "https://study.buildora.work/30-architecture/30.1-design-patterns/04-behavioral/30.1.4.01-strategy",
          kind: "study",
        },
        {
          label: "Repository & CQRS/DI",
          url: "https://study.buildora.work/30-architecture/30.1-design-patterns/05-architectural/30.1.5.02-cqrs-di",
          kind: "study",
        },
        {
          label: "Take-Home Masterclass",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.26-take-home-masterclass",
          kind: "study",
        },
        {
          label: "Vitest & Playwright Testing",
          url: "https://study.buildora.work/50-quality/50.1-testing/02-frameworks/50.1.2.05-playwright",
          kind: "study",
        },
      ],
    },
    {
      week: "Weeks 5–6",
      window: "21 Dec – 31 Dec 2026",
      phase: "Phase 1 · Production Engineering",
      theme: "Docker, CI/CD, Observability, Performance & Real-Time",
      description:
        "Close senior production-readiness follow-ups: multi-stage Docker builds, blue-green/canary rollouts, SLI/SLO/error budgets, Core Web Vitals profiling, and WebSockets vs SSE scaling.",
      deliverable:
        "Production-ops Q&A rehearsed · All Phase 1 feedback gaps patched",
      links: [
        {
          label: "Docker Multi-Stage & Prod",
          url: "https://study.buildora.work/40-platform/40.1-docker/40.1.06-production-patterns",
          kind: "study",
        },
        {
          label: "GitHub Actions & Canary CI/CD",
          url: "https://study.buildora.work/40-platform/40.3-ci-cd/03-releases-and-metrics/40.3.3.01-blue-green-canary",
          kind: "study",
        },
        {
          label: "SLI / SLO / Observability",
          url: "https://study.buildora.work/40-platform/40.4-observability/03-sre-targets/40.4.3.01-sli-slo-sla",
          kind: "study",
        },
        {
          label: "Core Web Vitals",
          url: "https://study.buildora.work/50-quality/50.3-performance-monitoring/01-core-metrics/50.3.1.01-core-web-vitals",
          kind: "study",
        },
        {
          label: "WebSockets & SSE",
          url: "https://study.buildora.work/60-realtime/60.1-websockets/01-transports/60.1.1.02-server-sent-events",
          kind: "study",
        },
      ],
    },
    {
      week: "Weeks 7–9",
      window: "1 Jan – 24 Jan 2027",
      phase: "Phase 2 · Inbound Leverage",
      theme: "Publish Practical Tenant-Isolation Article, Company Prep & Referrals",
      description:
        "Publish 'What a tenant-isolation test actually proves' showing the failing RLS control pass, cross-post to LinkedIn & dev communities, prepare targeted company sheets for January hiring surges, and ask every technical contact for warm introductions.",
      deliverable:
        "1 practical article published · Developer Pain Lab hub shared · January surge batch sent",
      links: [
        {
          label: "Company Prep Sheets",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.32-company-prep-sheets",
          kind: "study",
        },
        {
          label: "System Design Case Bank",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.08-system-design-case-bank",
          kind: "study",
        },
        {
          label: "Developer Pain Lab Case Study",
          url: "https://buildora.work/work/developer-pain-lab",
          kind: "portfolio",
        },
      ],
    },
    {
      week: "Weeks 10–12",
      window: "25 Jan – 18 Feb 2027",
      phase: "Phase 2 · Offer Closing",
      theme: "Final Loops, Compensation Negotiation & 30/60/90 Onboarding Plan",
      description:
        "Convert late-stage loops into competing written offers, benchmark India Remote / Hyderabad & EU compensation accurately, verify visa/contract terms before signing, and lock a 30/60/90 onboarding plan.",
      deliverable:
        "Countersigned Senior Full-Stack offer (or repeatable paid diagnostics) + 30/60/90 plan",
      links: [
        {
          label: "Salary Negotiation Guide",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.31-salary-negotiation-guide",
          kind: "study",
        },
        {
          label: "EU Comp Benchmarking",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.05-comp-eu-benchmarking",
          kind: "study",
        },
        {
          label: "Visa & Relocation Playbook",
          url: "https://study.buildora.work/80-lanes-abroad-full-stack/80.06-visa-relocation-playbook",
          kind: "study",
        },
        {
          label: "HR Questions",
          url: "https://study.buildora.work/00-strategy/00.04-hr-questions",
          kind: "study",
        },
      ],
    },
  ] satisfies WeeklyBlueprint[],
  ossPortfolio: [
    {
      id: "tenantproof",
      repoFolder: "/repos/tenantproof",
      name: "RLS Rehearsal (rls-rehearsal)",
      verdict: "ship-oss",
      verdictLabel: "Tier 1 · Ship & Publish to npm",
      currentState:
        "v0.3.0 CLI + composite GitHub Action + Supabase JWT claim support prepared, but npm publish is still deferred (0 external users).",
      why: "Highest real-world pull of all your repos: every Supabase, Neon, Prisma, and Drizzle B2B SaaS team fears silent cross-tenant data leaks, and the failing control pass is an instant CTO hook.",
      nextAction:
        "Run npm publish for rls-rehearsal@0.3.0, add a 2-min Supabase + Drizzle drop-in template, and publish the launch post on HN, r/PostgreSQL & r/Supabase.",
      adoptionTarget: "100+ stars · 10+ external repos in CI · 5+ external issues/PRs",
      links: [
        {
          label: "RLS Rehearsal Repo",
          url: "https://github.com/CVamsi27/rls-rehearsal",
          kind: "repo",
        },
        {
          label: "Case Study",
          url: "https://buildora.work/work/rls-rehearsal",
          kind: "portfolio",
        },
      ],
    },
    {
      id: "deployproof",
      repoFolder: "/repos/deployproof",
      name: "Deployproof",
      verdict: "ship-oss",
      verdictLabel: "Tier 1 · Zero-Docker Quick Win",
      currentState:
        "v0.1.0-alpha.3 (0 stars, 2 tarball downloads); enrollment window open until 5 Dec 2026. GitHub tarball install creates unnecessary friction.",
      why: "Zero Docker/OrbStack dependency — any Node/pnpm/Next.js standalone developer can run `npx deployproof check ./out` in 5 seconds to catch missing runtime files or escaping workspace symlinks.",
      nextAction:
        "Publish to npm (unscoped or verified scope), close the Dec 5 trial cohort with 5 external Node/pnpm maintainers, and fix the top 1 onboarding blocker.",
      adoptionTarget: "5 external trial reports · 3 retained CI integrations",
      links: [
        {
          label: "Deployproof Repo",
          url: "https://github.com/CVamsi27/deployproof",
          kind: "repo",
        },
        {
          label: "Developer Pain Lab",
          url: "https://buildora.work/work/developer-pain-lab",
          kind: "portfolio",
        },
      ],
    },
    {
      id: "langfuse",
      repoFolder: "/repos/langfuse",
      name: "Langfuse (Upstream Fork)",
      verdict: "contribute-upstream",
      verdictLabel: "Tier 1 · AI-Era Upstream OSS",
      currentState:
        "Fork cloned locally (CVamsi27/langfuse, branch `test` active Nov 21). TypeScript + Next.js + Postgres + ClickHouse + queues — your exact stack + LLM observability/evals.",
      why: "Fastest credibility multiplier for 2026–2030: teaches production AI traces/evals inside a real Series A/B AI codebase and puts merged PRs in front of AI-native hiring teams.",
      nextAction:
        "Land 2–3 focused, well-tested bug-fix or eval/API PRs in Langfuse (plus 1–2 in drizzle-orm, better-auth, or bullmq during Month 2–6).",
      adoptionTarget: "≥2 merged upstream PRs by Dec 31 · 1–2 PRs/month post-offer",
      links: [
        {
          label: "Langfuse Fork",
          url: "https://github.com/CVamsi27/langfuse",
          kind: "repo",
        },
      ],
    },
    {
      id: "retryglass",
      repoFolder: "/repos/retryglass",
      name: "Retryglass",
      verdict: "proof-only",
      verdictLabel: "Tier 2 · Interview Proof & Audit Wedge",
      currentState:
        "v0.1.0-alpha.2 (0 stars, 2 tarball downloads); deterministic BullMQ crash-point sweep + Vitest export verified locally on OrbStack.",
      why: "Exceptional Staff-level interview proof and paid queue-audit hook, but Docker/Postgres/Redis prerequisites slow cold OSS adoption compared to RLS Rehearsal and Deployproof.",
      nextAction:
        "Record a 3-min crash-sweep demo for founder outreach & interviews; defer npm push and BullMQ v6 expansion until after your job offer is signed.",
      adoptionTarget: "Used in ≥10 founder/CTO pitches & interview defenses",
      links: [
        {
          label: "Retryglass Repo",
          url: "https://github.com/CVamsi27/retryglass",
          kind: "repo",
        },
        {
          label: "Case Study",
          url: "https://buildora.work/work/retryglass",
          kind: "portfolio",
        },
      ],
    },
    {
      id: "rolloutproof",
      repoFolder: "/repos/rolloutproof",
      name: "Rolloutproof",
      verdict: "park",
      verdictLabel: "Park Until Post-Offer (Upstream Later)",
      currentState:
        "v0.1.0-alpha.1 (0 stars, 2 downloads); macOS OrbStack local profile only; own docs note SchemaProof overlap.",
      why: "Heavy container + image contract setup makes cold adoption steep right now. Keep the expand-and-contract rollback insight for System Design rounds, not active feature cycles.",
      nextAction:
        "Freeze code changes during hiring sprint. Revisit only in Horizon 2 as an upstream PostgreSQL rollback adapter PR if teams ask for it.",
      adoptionTarget: "0 hours/wk during Phase 0–2 hiring sprint",
      links: [
        {
          label: "Rolloutproof Repo",
          url: "https://github.com/CVamsi27/rolloutproof",
          kind: "repo",
        },
      ],
    },
    {
      id: "revokeproof",
      repoFolder: "/repos/revokeproof",
      name: "Revokeproof",
      verdict: "park",
      verdictLabel: "Park Until Post-Offer (Security Proof)",
      currentState:
        "v0.1.0-alpha.1 (0 stars, 2 downloads); Chromium/Playwright WebSocket revocation helper requiring 6 custom app callbacks.",
      why: "Strong security/realtime talking point paired with Docita & TeamOps, but too bespoke per-app for quick cold OSS traction.",
      nextAction:
        "Freeze feature work; cite in Auth/JWT/WebSocket interview questions as concrete proof of thinking past HTTP 401.",
      adoptionTarget: "0 hours/wk during Phase 0–2 hiring sprint",
      links: [
        {
          label: "Revokeproof Repo",
          url: "https://github.com/CVamsi27/revokeproof",
          kind: "repo",
        },
      ],
    },
    {
      id: "whetstone",
      repoFolder: "/repos/whetstone",
      name: "Whetstone (Edgewise)",
      verdict: "park",
      verdictLabel: "Explicitly Parked During Job Search",
      currentState:
        "1,055 passing local tests across Next/Lynx/NestJS/native sign-in, but native SDKs, reviewed content stock, and production setup still block release.",
      why: "High surface-area product that will silently steal 20+ hours/week from hiring and startup onboarding if left active.",
      nextAction:
        "Keep strictly parked until you are settled in your startup role (Month 6+).",
      adoptionTarget: "0 hours/wk until Month 6 on the job",
      links: [],
    },
  ] satisfies OssPortfolioItem[],
  futureProofPillars: [
    {
      id: "ai-systems",
      title: "Production AI & Eval Engineering",
      horizon: "Start Now (Langfuse PRs) → Months 3–12",
      whyDurable:
        "AI agents write CRUD fast; engineers who own eval harnesses, guardrails, structured outputs, hybrid search (pgvector + BM25), and token/latency budgets become irreplaceable.",
      concreteMoves: [
        "Land upstream PRs in /repos/langfuse to master real LLM trace/eval pipelines.",
        "Volunteer in your first 90 days at the startup to own 1 AI feature + its automated regression eval & cost dashboard.",
      ],
    },
    {
      id: "systems-go",
      title: "Systems Reliability, Postgres Internals & Go",
      horizon: "Months 3–12 on the job",
      whyDurable:
        "Correctness under load, zero-downtime migrations, OpenTelemetry observability, and adding Go alongside TypeScript removes the 'just a JS dev' ceiling.",
      concreteMoves: [
        "Master EXPLAIN ANALYZE, lock queues, connection pooling, outbox/CDC, and OpenTelemetry SLOs on live startup traffic.",
        "Ship 1 real production service or CLI in Go (Months 6–12) to pair Go + TypeScript + PostgreSQL.",
      ],
    },
    {
      id: "cloud-finops",
      title: "Cloud Infra, Security & Unit Economics",
      horizon: "Months 6–24",
      whyDurable:
        "CTOs are graded on trust, uptime, compliance (SOC2/HIPAA/GDPR), and gross margin — especially cloud + LLM cost per tenant.",
      concreteMoves: [
        "Own IaC (Terraform), canary/rollback CI/CD gates, secret boundaries, and incident postmortems.",
        "Track cost-per-tenant and LLM cost-per-workflow for every major system you ship.",
      ],
    },
    {
      id: "product-leadership",
      title: "Product Judgment, Hiring & Executive Leverage",
      horizon: "Years 2–5+",
      whyDurable:
        "Code output plateaus; multiplying a team through RFCs, sharp scoping, hiring A-players, and talking to customers compounds all the way to CTO.",
      concreteMoves: [
        "Join customer calls, cut 70% of non-essential scope to ship in days, and write ADRs tied to revenue/retention.",
        "Design interview rubrics, mentor engineers, and partner directly with Founders/Sales on enterprise architecture reviews.",
      ],
    },
  ] satisfies FutureProofPillar[],
  ctoHorizons: [
    {
      id: "horizon-1",
      horizon: "Horizon 1",
      timeline: "Days 1–60 (Now → Jan 2027)",
      roleTarget: "Senior / Founding SWE · Seed–Series B Startup",
      objective:
        "Join a high-velocity product startup immediately (1 hop from the CTO/Founders) to learn on real traffic, revenue, and incidents.",
      milestones: [
        "Direct Founder/CTO outreach + Trojan-Horse product Looms on top 20 target startups.",
        "Publish rls-rehearsal & deployproof to npm; merge first upstream Langfuse PRs.",
        "Park rolloutproof, revokeproof & whetstone; convert screens via 5-round drills.",
      ],
      exitGate: "Countersigned startup offer + confirmed start date.",
    },
    {
      id: "horizon-2",
      horizon: "Horizon 2",
      timeline: "Months 3–12",
      roleTarget: "Most Trusted Senior / Lead SWE in the Room",
      objective:
        "Future-proof your stack on live production systems while turning 1 dev tool into an externally adopted OSS product.",
      milestones: [
        "Own 1 critical reliability system + 1 production AI feature with automated evals & cost metrics.",
        "Add Go in production + OpenTelemetry observability + Terraform/cloud ownership.",
        "Grow rls-rehearsal (or a real work-born CLI) to 100+ stars & 10+ external CI repos; write 1 deep post/month.",
      ],
      exitGate: "Go-to owner for hardest ambiguous problems + external OSS adoption + strong public writing.",
    },
    {
      id: "horizon-3",
      horizon: "Horizon 3",
      timeline: "Years 2–5",
      roleTarget: "Staff / Tech Lead → Head of Engineering",
      objective:
        "Cross from solo builder to technical & organizational multiplier owning architecture, hiring, and business outcomes.",
      milestones: [
        "Author company-wide RFCs/ADRs, own incident & release culture, and build the engineering hiring bar.",
        "Lead a squad/pillar of 5–15 engineers: roadmap trade-offs, coaching, performance, and enterprise customer calls.",
        "Speak 2–3×/year on multi-tenant Postgres, reliability, or production AI systems.",
      ],
      exitGate: "Proven track record hiring/scaling a team and shipping revenue-moving systems.",
    },
    {
      id: "horizon-4",
      horizon: "Horizon 4",
      timeline: "Years 5–10+ → Career Goal",
      roleTarget: "Founding CTO / Scale-Up CTO → Retire as CTO",
      objective:
        "Own technology vision, engineering organization, security/compliance posture, board-level strategy, and equity upside.",
      milestones: [
        "Path A: Step from Founding/Staff SWE → Head of Eng → VP Eng / CTO as a startup scales Series A → C.",
        "Path B: Pair with a strong GTM co-founder as Founding CTO (backed by solo SaaS + scale-up leadership proof).",
        "Compound equity, board communication, unit economics, and technical taste across the full career arc.",
      ],
      exitGate: "CTO seat with durable technical authority, A-player org, and meaningful equity.",
    },
  ] satisfies CtoHorizon[],
  gates: [
    "No new side projects: Whetstone, Rolloutproof, and Revokeproof stay parked until a startup offer is countersigned.",
    "npm & OSS unlocked: rls-rehearsal@0.3.0 and deployproof published to npm (zero tarball friction); ≥1 upstream Langfuse PR opened.",
    "Proof live & verified: Docita, RLS Rehearsal, Retryglass, and Developer Pain Lab live on buildora.work; 1-page resumes pass verify_resume_pdf.py & check_ats.py.",
    "Startup-first pipeline: ≥60% of applications paired with direct Founder/CTO outreach; 10-app reply-rate diagnostic audited every Saturday.",
    "Future-proof discipline: every interview debriefed within 24h; once hired, immediately shift into Horizon 2 (AI evals + Go + real OSS adoption).",
  ],
  hiringLanes: [
    {
      id: "lane-india-global-remote",
      share: "Lane 1 · 60%",
      name: "India Product Startups & Global Remote YC / OSS Teams",
      targets:
        "Bengaluru/Hyderabad/Remote Seed–Series B startups (Peak XV, Accel, Lightspeed, YC) + global remote OSS teams (Cal.com, Supabase, PostHog, Dub, Formbricks, Documenso, Trigger.dev, Twenty).",
      strategy:
        "Fast 2–3 week interview loops, immediate India-compatible payroll/EOR, direct 1-hop access to CTO/Founders, and zero visa bottleneck.",
      why: "Fastest path to immediate cash + real production scale while preserving global remote upside.",
    },
    {
      id: "lane-founding-direct",
      share: "Lane 2 · 25%",
      name: "Founding / Early Engineer (#3–#15) Direct Founder Outreach",
      targets:
        "Recent Seed/Series A founders hiring their first 2–5 senior TS/Postgres engineers on YC Work at a Startup, Wellfound & X.",
      strategy:
        "Send a 4-sentence proof pitch linking /work/docita or /work/rls-rehearsal; for top 5 dream startups, spot 1 real UX/API/DX paper-cut and attach a 2-min Trojan-Horse Loom + fix.",
      why: "Bypasses ATS black holes (5–10× reply rate) and puts you directly on the CTO trajectory.",
    },
    {
      id: "lane-eu-relocation",
      share: "Lane 3 · 15%",
      name: "High-Fit EU / Germany / NL / IE Relocation Track",
      targets:
        "Berlin/Munich/Amsterdam/Dublin product startups where exact stack + merged OSS PRs overcome visa friction (Langfuse, n8n, Twenty, Cello, Packmatic) and align with dual-career (TS + Pega) family fit.",
      strategy:
        "Confirm India-remote or supported relocation eligibility early; anchor outreach on live upstream PRs rather than cold ATS applications.",
      why: "Protects long-term family upside without stalling immediate income conversion.",
    },
  ] satisfies HiringLane[],
  offerScorecard: [
    {
      id: "cto-proximity",
      title: "Founder / CTO Proximity",
      question:
        "Do you work directly with the CTO or VP Engineering and see architecture, hiring, and customer trade-offs up close?",
    },
    {
      id: "prod-complexity",
      title: "Real Production Complexity",
      question:
        "Are there paying customers, multi-tenant data, async/AI workloads, and real production incidents you can own end to end?",
    },
    {
      id: "e2e-scope",
      title: "End-to-End Scope",
      question:
        "Do you own product + API + database + infrastructure together (avoiding isolated ticket-factory maintenance)?",
    },
    {
      id: "family-stability",
      title: "Family & Financial Stability",
      question:
        "Does it deliver reliable immediate cash + meaningful equity (with global-remote flexibility or a clean EU/NL/DE route)?",
    },
  ] satisfies OfferScorecardCriterion[],
  upstreamOssTargets: [
    {
      id: "langfuse",
      repo: "langfuse/langfuse",
      tier: "Tier A · Start Now",
      stackAndGeo:
        "TypeScript, Next.js, PostgreSQL, ClickHouse, BullMQ, LLM Evals · Berlin / Remote (YC)",
      whyFit:
        "Already cloned in /repos/langfuse. Fixes your #1 future-proofing gap overnight by teaching production LLM observability, prompt/trace ingestion, and eval pipelines on your exact stack.",
      prIdeas: [
        "BullMQ ingestion/retry edge-case fixes with deterministic regression tests",
        "Eval dataset/score filtering bugs, tRPC schema fixes, or Postgres/ClickHouse query perf",
      ],
      url: "https://github.com/langfuse/langfuse",
      localFolder: "/repos/langfuse",
    },
    {
      id: "twenty",
      repo: "twentyhq/twenty",
      tier: "Tier A · Start Now",
      stackAndGeo:
        "React, TypeScript, NestJS, PostgreSQL · Paris / EU Remote (YC)",
      whyFit:
        "Exact 1:1 stack twin of Docita (React + TS + NestJS + Postgres). Venture-backed AI-native open-source CRM (25k+ stars) that explicitly recruits engineers from active GitHub contributors.",
      prIdeas: [
        "Multi-workspace permission/isolation bugs or NestJS queue/worker reliability fixes",
        "GraphQL/Postgres N+1 query tuning or accessible React table/form interaction fixes",
      ],
      url: "https://github.com/twentyhq/twenty",
    },
    {
      id: "calcom",
      repo: "calcom/cal.com",
      tier: "Tier B · Domain Twin",
      stackAndGeo:
        "TypeScript, Next.js, Prisma, PostgreSQL · Global Remote (hires in India)",
      whyFit:
        "Exact domain twin of Docita (scheduling, clinic/team timezones, bookings, webhooks) with fast remote hiring in India.",
      prIdeas: [
        "Timezone/DST edge-case fixes, webhook retry/idempotency bugs, or Prisma query tuning",
      ],
      url: "https://github.com/calcom/cal.com",
    },
    {
      id: "n8n",
      repo: "n8n-io/n8n",
      tier: "Tier B · Domain Twin",
      stackAndGeo:
        "TypeScript, Node.js, AI Agents, Workflows · Berlin / EU Remote",
      whyFit:
        "Your highest historical career match (4.7/5) where workflow reliability and enterprise RBAC/audit directly match Docita.",
      prIdeas: [
        "Webhook error-handling/retry edge cases, queue execution stability, or AI tool-node fixes",
      ],
      url: "https://github.com/n8n-io/n8n",
    },
    {
      id: "supabase",
      repo: "supabase/supabase",
      tier: "Tier B · Domain Twin",
      stackAndGeo:
        "TypeScript, PostgreSQL, RLS, pgvector · Global Remote",
      whyFit:
        "Exact ecosystem twin of RLS Rehearsal and the core pgvector + Postgres AI stack; Supabase actively hires community builders.",
      prIdeas: [
        "Studio RLS policy editor edge cases, local CLI migration fixes, or showcasing rls-rehearsal",
      ],
      url: "https://github.com/supabase/supabase",
    },
    {
      id: "mastra-trigger",
      repo: "mastra-ai/mastra · triggerdotdev/trigger.dev",
      tier: "Tier C · AI & Workflows",
      stackAndGeo:
        "TypeScript-native AI agents, RAG, memory, evals & durable background jobs · Remote",
      whyFit:
        "Mastra covers TS agentic/RAG workflows cleanly without leaving TypeScript; Trigger.dev is the 1:1 durable execution twin of Retryglass.",
      prIdeas: [
        "Mastra memory/RAG adapter bug fixes & eval tests; Trigger.dev retry/timeout edge-case PRs",
      ],
      url: "https://github.com/mastra-ai/mastra",
    },
  ] satisfies UpstreamOssTarget[],
  ossPlaybook: [
    {
      id: "pr1-trust",
      window: "Days 1–3 · PR #1 Trust Builder",
      title: "Confirmed bug + failing-then-passing regression test",
      detail:
        "Never submit README typos or 2,000-line feature drops. Pick a confirmed bug with a clean local repro, ship a minimal fix, and include a test that fails before your patch and passes after.",
    },
    {
      id: "pr2-arch",
      window: "Days 4–10 · PR #2 Architecture Signal",
      title: "Postgres, worker retry, isolation, or AI eval fix",
      detail:
        "Target a harder issue in queries, queues, auth/tenant isolation, or LLM eval pipelines. Post a crisp 5-line design note on the issue before coding so maintainers see how you reason.",
    },
    {
      id: "day11-dm",
      window: "Day 11 · Direct CTO / Lead DM",
      title: "Convert code review trust into a 15-min interview chat",
      detail:
        "DM the engineering lead/CTO who reviewed your PRs: reference the exact subsystem + PR numbers, link rls-rehearsal, state India-remote or relocation readiness, and ask for a 15-min chat.",
    },
  ] satisfies OssPlaybookStep[],
  futureWedgeProjects: [
    {
      id: "evalproof",
      name: "evalproof",
      command: "npx evalproof run",
      gate: "Activation Gate: ONLY after npm publish + Week 1–3 hiring targets hit (or post-offer)",
      buildWindow: "1-week laser-focused v1",
      pain: "Startups swap prompts, models, or tool schemas and silently break JSON outputs, tool calls, or 3× their LLM bill in production.",
      whatItDoes:
        "Runs golden input fixtures against TS LLM functions in CI; asserts Zod schema validity, ordered tool calls, p95 latency, and $/1k run budgets with a PR diff table vs. main.",
      ctoLeverage:
        "Extends your *proof brand straight into 2026–2030 AI engineering and removes any AI-depth objection in startup loops.",
    },
    {
      id: "webhookproof",
      name: "webhookproof",
      command: "npx webhookproof run http://localhost:3000/api/webhooks/stripe --provider stripe",
      gate: "Activation Gate: Post-offer · Months 3–6",
      buildWindow: "3–5 day zero-Docker CLI",
      pain: "SaaS/FinTech teams get burned in prod by out-of-order webhooks, concurrent duplicate deliveries, replay timestamps, or broken HMAC checks.",
      whatItDoes:
        "Fires HMAC-signed payloads across 6 adversarial scenarios (duplicate sequential, parallel race, reversed lifecycle, bad sig, expired timestamp, slow-consumer retry).",
      ctoLeverage:
        "Born directly from Docita Razorpay work; every SaaS CTO gets the value in 10 seconds.",
    },
    {
      id: "pglockguard",
      name: "pglockguard (Go)",
      command: "pglockguard check ./prisma/migrations",
      gate: "Activation Gate: Post-offer · Months 6–12 (Go milestone)",
      buildWindow: "Go single-binary CLI + GitHub Action",
      pain: "Harmless-looking Prisma/Drizzle migrations (volatile defaults, unconcurrent indexes, missing lock_timeout) take down production with ACCESS EXCLUSIVE lock queues.",
      whatItDoes:
        "Statically parses SQL migrations with zero Docker needed, flags lock-queue hazards, and prints safe expand-and-contract SQL rewrites directly on PRs.",
      ctoLeverage:
        "100× easier cold adoption than rolloutproof and proves production Go systems fluency alongside TypeScript/Postgres.",
    },
    {
      id: "tenantguard-cloud",
      name: "TenantGuard Cloud",
      command: "Monetizing rls-rehearsal ($99–$299/mo)",
      gate: "Activation Gate: Horizon 2/3 — ONLY after 20+ external CI repos run rls-rehearsal",
      buildWindow: "Demand-validated micro-SaaS",
      pain: "B2B SaaS teams need signed SOC2/HIPAA tenant-isolation compliance artifacts and Slack alerts when a PR weakens a Postgres RLS policy.",
      whatItDoes:
        "Turns rls-rehearsal CI outputs into audit-ready release reports, cross-branch policy drift alerts, and workspace compliance dashboards.",
      ctoLeverage:
        "Builds B2B security buyer discovery and recurring revenue without gambling 12 months on an unvalidated build.",
    },
  ] satisfies FutureWedgeProject[],
  resumeCheckpoints: [
    {
      id: "startup-seat",
      area: "Core Role & Production Traffic",
      horizon: "Horizon 1 · Days 1–60",
      nowState: "Independent SaaS (Docita) + MAQ Senior SWE (Jul 2025)",
      targetState:
        "Senior / Founding SWE at a Seed–Series B startup owning live multi-tenant & customer traffic",
      verifyBy: "Countersigned startup offer + 2+ shipped production systems in 90 days",
    },
    {
      id: "npm-oss-adoption",
      area: "OSS Tool Adoption (*proof* CLIs)",
      horizon: "Horizon 1–2 · Months 1–6",
      nowState: "rls-rehearsal & deployproof at 0 stars / GitHub tarballs only",
      targetState:
        "Published on npm (npx) with 100+ GitHub stars & 10+ external repos running in CI",
      verifyBy: "npm registry stats + external CI workflow references & community issues resolved",
    },
    {
      id: "upstream-oss-prs",
      area: "Upstream Startup OSS PRs",
      horizon: "Horizon 1–2 · Months 1–6",
      nowState: "Local /repos/langfuse fork cloned; 0 merged external startup PRs",
      targetState:
        "2–4+ merged production PRs across langfuse, twentyhq/twenty, cal.com, or supabase",
      verifyBy: "Public merged PR URLs touching queries, queues, isolation, or LLM evals",
    },
    {
      id: "prod-ai-evals",
      area: "Production AI & Eval Engineering",
      horizon: "Horizon 2 · Months 3–12",
      nowState: "Strong TS/Postgres foundation; no production AI/LLM eval proof on resume",
      targetState:
        "Shipped production AI workflow (structured outputs/RAG/tools) + automated eval/cost gate (evalproof or work harness)",
      verifyBy: "Measured eval pass-rate & cost-per-run guardrails documented on CV",
    },
    {
      id: "second-language-go",
      area: "Systems Breadth (Go + TypeScript)",
      horizon: "Horizon 2 · Months 6–12",
      nowState: "TypeScript / Node / NestJS / PostgreSQL primary stack",
      targetState:
        "Shipped 1 production backend service or Go CLI (pglockguard) alongside TypeScript/SQL",
      verifyBy: "Public Go release binary or shipped production Go service",
    },
    {
      id: "observability-scale",
      area: "Measured Postgres & Telemetry Impact",
      horizon: "Horizon 2 · Months 3–12",
      nowState: "Synthetic local checks & qualitative MAQ query optimization",
      targetState:
        "Measured prod EXPLAIN ANALYZE wins, lock-safe migrations, and OpenTelemetry SLO tracing",
      verifyBy: "Defensible before/after latency & incident metrics retained from real prod logs",
    },
    {
      id: "cloud-security-finops",
      area: "Cloud Infra, Security & Unit Economics",
      horizon: "Horizon 2–3 · Months 6–24",
      nowState: "Docker, GitHub Actions, Fly.io & Cloudflare basics",
      targetState:
        "Owned Terraform/IaC, canary/rollback release gates, and per-tenant cloud + LLM unit economics",
      verifyBy: "Authored IaC/release runbooks & gross-margin cost optimizations",
    },
    {
      id: "staff-leadership",
      area: "Staff / CTO Leverage & Public Voice",
      horizon: "Horizon 2–3 · Months 6–24",
      nowState: "Code reviews & mentoring at MAQ Software",
      targetState:
        "Authored company RFCs/ADRs, led technical hiring/interviews, 6+ deep engineering posts & 1+ talk",
      verifyBy: "Published deep-dive articles + interview loop ownership + team multiplier track record",
    },
  ] satisfies ResumeCheckpointItem[],
} as const;

const WEEKDAY_ROUND_BY_UTC_DAY: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

const SPRINT_END_ISO = "2027-02-18";

const BLUEPRINT_WINDOWS: Array<{ start: string; end: string; index: number }> = [
  { start: "2026-12-05", end: "2026-12-19", index: 0 },
  { start: "2026-12-20", end: "2026-12-31", index: 1 },
  { start: "2027-01-01", end: "2027-01-24", index: 2 },
  { start: "2027-01-25", end: SPRINT_END_ISO, index: 3 },
];

/**
 * Pure date-to-sprint-focus resolver covering the full Nov 23, 2026 -> Feb 18, 2027
 * sprint window (Mon-Sat; Sundays return undefined). Zero React/Next dependencies so
 * Telegram delivery and Node unit tests can share it directly.
 */
export function sprintFocusForDate(isoDate: string): SprintFocus | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return undefined;
  const parsed = new Date(`${isoDate}T12:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== isoDate
  )
    return undefined;
  if (
    isoDate < interviewReadySprint.startDate ||
    isoDate > SPRINT_END_ISO
  )
    return undefined;
  const utcDay = parsed.getUTCDay();
  if (utcDay === 0) return undefined;

  const weekdayName = WEEKDAY_ROUND_BY_UTC_DAY[utcDay];
  const round = weekdayName
    ? interviewReadySprint.interviewRounds.find((r) => r.weekday === weekdayName)
    : undefined;

  const exact = interviewReadySprint.days.find((d) => d.isoDate === isoDate);
  if (exact) {
    return {
      date: exact.date,
      isoDate: exact.isoDate,
      phase: exact.phase,
      build: exact.build,
      deliverable: exact.deliverable,
      evidence: exact.evidence,
      weekdayRound: round?.title,
      links: [...exact.links],
    };
  }

  const windowSpec = BLUEPRINT_WINDOWS.find(
    (w) => isoDate >= w.start && isoDate <= w.end,
  );
  const bp =
    interviewReadySprint.weeklyBlueprints[windowSpec?.index ?? 0];
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(parsed)
    .replace(",", "");

  if (utcDay === 6) {
    return {
      date: dateLabel,
      isoDate,
      phase: bp.phase,
      build: `Weekly Funnel Audit + 1 Timed Mock Interview (2h cap) · ${bp.theme}`,
      deliverable:
        "Conversion audit saved + 1 timed mock debriefed + Monday top gap locked",
      evidence: "Recorded funnel metrics & mock rubric score",
      links: [...bp.links],
    };
  }

  return {
    date: dateLabel,
    isoDate,
    phase: bp.phase,
    build: `${bp.theme}${round ? ` · ${round.title}` : ""}`,
    deliverable: bp.deliverable,
    evidence: "Dated applications/outreach logged + 1 completed weekday drill",
    weekdayRound: round?.title,
    links: [...bp.links.slice(0, 2), ...(round ? round.links.slice(0, 2) : [])],
  };
}
