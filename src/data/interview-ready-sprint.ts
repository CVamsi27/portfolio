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

/**
 * Hiring-first execution plan anchored to Monday, 23 November 2026.
 * Every study link resolves to a verified clean URL on study.buildora.work
 * (checked against repos/software-developer-bible).
 */
export const interviewReadySprint = {
  startDate: "2026-11-23",
  startDateLabel: "23 November 2026",
  headline: "Conversations & executable proof first — Senior Full-Stack offer",
  summary:
    "Anchored to Monday 23 November 2026: run a 32-hour hiring engine (six hours Mon–Fri, two hours Saturday, Sunday off). Every application batch pairs tailored factual resumes with direct hiring-manager outreach, live case studies (Docita, RLS Rehearsal, Retryglass), and a structured 5-round technical drill mapped directly to study.buildora.work.",
  triggerDate: "4 December 2026",
  sprintWindow: "23 November–4 December 2026",
  defenseDate: "18 December 2026",
  endDate: "18 February 2027",
  weeklyCapacity: "32 hours · Sunday off",
  repositoryUrl: "https://github.com/CVamsi27/rls-rehearsal",
  triggerNote:
    "Diagnostic gate: if fewer than 10 qualified applications are sent by Wednesday, pause study and send. If reply rate is under 10% across any 15-application cohort, audit your CV tailoring and outreach message before sending the next batch.",
  frontendNote:
    "Keep React, TypeScript, React Hook Form, Zod, and TanStack Query sharp through timed machine-coding drills and Docita walkthroughs—do not build new side projects before interviews or paid work are live.",
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
      label: "Retryglass Repo",
      url: "https://github.com/CVamsi27/retryglass",
      kind: "repo",
    },
    {
      label: "Developer Pain Lab",
      url: "https://github.com/CVamsi27/developer-pain-lab",
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
      label: "Phase 0 · Pipeline & Proof Launch",
      window: "23 Nov – 4 Dec 2026",
      status: "active",
      summary:
        "Launch high-signal dual-track applications (Track A: India Remote / Hyderabad Senior Full-Stack + paid diagnostics; Track B: EU/Germany English tech) backed by live portfolio case studies and direct hiring-manager outreach.",
      points: [
        "Publish RLS Rehearsal & Retryglass case studies on buildora.work and regenerate 1-page resumes (EU + Global/India) with --focus fullstack|backend|frontend.",
        "Send 15 qualified applications per week; pair at least 50% with a direct founder, engineering-manager, or employee referral message linking a concrete proof artifact.",
        "Send 5 scoped paid-diagnostic enquiries per week (Multi-Tenant RLS Audit or BullMQ Queue Reliability Sweep) with explicit deliverables.",
        "Track every send separately from drafts and follow up once after 5 business days.",
      ],
      exit: "≥25 qualified applications sent, ≥20 warm/referral messages, ≥10 contract enquiries, 2 case studies live, ≥3 live screens/calls booked.",
      links: [
        {
          label: "Find Startup Roles",
          url: "https://study.buildora.work/00-strategy/00.05-find-startup-roles",
          kind: "study",
        },
        {
          label: "Resume Tips",
          url: "https://study.buildora.work/00-strategy/00.02-resume-tips",
          kind: "study",
        },
        {
          label: "Docita Claim Walkthrough",
          url: "https://study.buildora.work/projects/docita/24-resume-claim-walkthrough",
          kind: "study",
        },
        {
          label: "RLS Rehearsal Case Study",
          url: "https://buildora.work/work/rls-rehearsal",
          kind: "portfolio",
        },
      ],
    },
    {
      id: "phase-1-interview-conversion",
      number: "02",
      label: "Phase 1 · Interview Conversion & 5-Round Readiness",
      window: "5 Dec – 31 Dec 2026",
      status: "active",
      summary:
        "Convert recruiter screens into onsite/final loops by rotating timed drills across JS/TS/React, Node/NestJS/PostgreSQL, Senior System Design, DSA coding patterns, and rehearsed 3-minute project defenses.",
      points: [
        "Run the 5-round weekday rotation (1h/day): 25m unaided attempt → 10m verified study.buildora.work reference → 20m changed-case repair → 5m notes.",
        "Record and rehearse 3-minute walkthroughs for Docita (ownership), RLS Rehearsal (tenant safety), and Retryglass (failure recovery).",
        "Run 1 full timed mock interview every week and log the #1 gap for 48-hour repair.",
        "When 2+ interview loops are active, dial cold applications down to 5/week and protect round preparation.",
      ],
      exit: "≥3 active technical interview processes or ≥2 paid engagements; 3 recorded project demos; every technical screen debriefed.",
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
      label: "Phase 2 · Offer Closing, Negotiation & Public Leverage",
      window: "1 Jan – 18 Feb 2027",
      status: "next",
      summary:
        "Close a senior full-stack offer with clear scope and compensation, publish one high-signal technical article demonstrating executable tenant-isolation proof, and build referral leverage.",
      points: [
        "Compare written offers on ownership scope, engineering bar, compensation, start date, and first-payment date; negotiate using real market benchmarks.",
        "Publish one practical technical article: 'What a tenant-isolation test actually proves' (showing the failing control pass) and distribute on LinkedIn & dev communities.",
        "End every technical call with a referral ask: 'Who else in your team or network is solving multi-tenant or worker reliability problems?'",
        "Keep applying until a contract is countersigned with a confirmed start date.",
      ],
      exit: "Countersigned Senior Full-Stack offer with confirmed start & payroll date, or repeatable paid diagnostic clients, plus a 30/60/90 onboarding plan.",
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
        work: "Proof packaging or paid client delivery: case studies, 3-minute recorded walkthroughs, or RLS Rehearsal / Retryglass polish tied to active conversations.",
        output: "1 tangible proof artifact or client milestone progressed",
        links: [
          {
            label: "RLS Rehearsal",
            url: "https://github.com/CVamsi27/rls-rehearsal",
            kind: "repo",
          },
          {
            label: "Retryglass",
            url: "https://github.com/CVamsi27/retryglass",
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
      build: "3 tailored applications + 2 paid diagnostic enquiries + PostgreSQL RLS & MVCC drill",
      description:
        "Target 3 multi-tenant SaaS roles (India Remote / Hyderabad + 1 EU English role), send 2 scoped Tenant-Isolation Review enquiries to SaaS founders/CTOs linking /work/rls-rehearsal, and drill PostgreSQL MVCC + Row-Level Security.",
      deliverable:
        "3 apps + 2 warm/diagnostic messages · RLS Rehearsal demo command verified",
      evidence:
        "Logged sends + SQL RLS & MVCC isolation notes with failure boundary",
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
      build: "Mid-week pipeline check (≥9 apps) + record 3-min Docita walkthrough + DSA sliding window",
      description:
        "Verify you are on pace for ≥10 apps before Wednesday close (if behind, cut prep and apply). Record a crisp 3-minute Docita end-to-end architecture walkthrough, and run a 35-minute timed TypeScript Sliding Window + Two Pointers drill.",
      deliverable:
        "≥9 cumulative applications · 3-min Docita video recorded · 1 timed DSA drill",
      evidence:
        "Recording saved + clean TypeScript solution with edge-case tests",
      links: [
        {
          label: "Docita Claim Walkthrough",
          url: "https://study.buildora.work/projects/docita/24-resume-claim-walkthrough",
          kind: "study",
        },
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
      ],
    },
    {
      day: 4,
      date: "Thu 26 Nov",
      isoDate: "2026-11-26",
      phase: "Phase 0 · Launch",
      build: "3 apps + 2 referral asks + record 3-min RLS Rehearsal demo + Multi-Tenant System Design",
      description:
        "Send 3 qualified applications and ask 2 former colleagues/peers for direct introductions to hiring managers. Record the 3-minute RLS Rehearsal demo (showing the failing control pass), then complete a 40-minute Multi-Tenant SaaS System Design drill.",
      deliverable:
        "3 apps + 2 referral asks · 3-min RLS Rehearsal demo · System design diagram",
      evidence:
        "Demo recorded + whiteboard design covering tenant isolation, rate limits & failure modes",
      links: [
        {
          label: "Multi-Tenant SaaS Architecture",
          url: "https://study.buildora.work/30-architecture/30.3-infra-patterns/04-data-at-scale/30.3.4.04-multi-tenant-saas-architecture",
          kind: "study",
        },
        {
          label: "How to Approach System Design",
          url: "https://study.buildora.work/30-architecture/30.2-system-design/01-theory/30.2.1.15-how-to-approach",
          kind: "study",
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
      build: "Hit Week 1 target (15 apps / 10 warm / 5 contracts) + Retryglass demo + STAR defense",
      description:
        "Close Week 1 targets (15 tailored applications, 10 warm/referral notes, 5 contract enquiries). Record the 3-minute Retryglass crash-point sweep walkthrough and rehearse 2 MAQ Software STAR stories.",
      deliverable:
        "Week 1 scoreboard complete · 3-min Retryglass demo · 2 STAR stories rehearsed",
      evidence:
        "All 3 project demos recorded + MAQ promotion & optimization stories timed",
      links: [
        {
          label: "STAR Method",
          url: "https://study.buildora.work/00-strategy/00.03-star-method",
          kind: "study",
        },
        {
          label: "MAQ Product Engineering",
          url: "https://study.buildora.work/projects/maq/01-product-engineering",
          kind: "study",
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
      build: "Week 1 Funnel Audit + 1 Full Timed Mock Interview (2h cap)",
      description:
        "Run the Weekly Review: count real sends vs drafts, check reply rate across the first 15 applications, run one 60-minute timed peer/self mock interview, and lock Monday's #1 fix.",
      deliverable:
        "Week 1 review saved · Mock rubric scored · Top 1 technical gap selected",
      evidence:
        "Funnel metrics recorded + written debrief with 1 changed-case repair for Monday",
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
      build: "5-day follow-up wave on Nov 23 batch + 3 new apps + React Fiber & TanStack Query drill",
      description:
        "Send polite 5-business-day follow-ups on every silent Nov 23 application/outreach with a fresh demo link, submit 3 new roles using Week 1 CV refinements, and drill React Fiber + TanStack Query cache invalidation.",
      deliverable:
        "Nov 23 follow-ups sent · 3 new apps · React/TanStack machine-coding drill",
      evidence:
        "Follow-up dates updated + working optimistic mutation & rollback code",
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
      build: "3 apps + 2 contract follow-ups + Webhooks, Outbox & Idempotency drill",
      description:
        "Follow up on Nov 24 paid diagnostic enquiries, send 3 targeted backend-heavy/full-stack applications using --focus backend, and drill HMAC webhooks, transactional outbox, and idempotency keys.",
      deliverable:
        "3 apps + contract follow-ups · Outbox & webhook idempotency design",
      evidence:
        "Trace showing duplicate webhook handling & crash-before-ack recovery",
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
      build: "3 apps + 2 warm notes + DSA Graphs/BFS/Topological Sort + TypeScript Generics",
      description:
        "Maintain pipeline pace (aim ≥25 cumulative apps by Friday), send 2 referral notes to engineers at shortlisted product companies, and drill BFS/DFS + Topological Sort in TypeScript.",
      deliverable:
        "3 apps + 2 warm messages · Timed graph/topo-sort implementation",
      evidence:
        "Verified complexity analysis + cycle-detection edge case passed",
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
      build: "3 apps + Payment Gateway System Design + Auth (JWT / OAuth2 / RBAC-ABAC)",
      description:
        "Send 3 roles (including EU/Germany Track B with EU PDF), complete a 40-minute Payment Gateway system design drill (ledger invariants, idempotency, retries), and review JWT vs session revocation trade-offs.",
      deliverable:
        "3 apps · Payment Gateway system design · Auth trade-off matrix",
      evidence:
        "Complete design notes covering double-charge prevention & reconciliation",
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
      build: "Phase 0 Checkpoint: ≥25 apps, ≥20 warm notes, ≥10 contracts + Full Defense Rehearsal",
      description:
        "Evaluate the Phase 0 exit gate across your first 2 weeks (23 Nov – 4 Dec). Rehearse all three 3-minute project stories back-to-back and decide Phase 1 ratio (keep 15 apps/wk if <2 live loops, or shift to 5 apps/wk + heavy screen prep if ≥2 loops are active).",
      deliverable:
        "Phase 0 scoreboard evaluated · Phase 1 capacity allocation locked",
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
  gates: [
    "Proof live: Docita, RLS Rehearsal, and Retryglass case studies live on buildora.work; aspirational Langfuse/Lightdash cards removed.",
    "Resume verified: 1-page A4 EU, Global/India, and phone-free Public PDFs pass verify_resume_pdf.py and check_ats.py with zero unverified claims.",
    "Pipeline real: every logged application has a submitted date, tailored variant, and 5-business-day follow-up; ≥50% paired with direct outreach.",
    "Rounds rehearsed: timed Frontend, Backend/Postgres, DSA, System Design, and Project Defense drills each logged with an observed gap & fix.",
    "Feedback loop: 10-app reply-rate diagnostic checked weekly; every screen debriefed within 24 hours back to a study.buildora.work chapter.",
  ],
} as const;
