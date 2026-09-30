/**
 * sync-roadmap.ts — v2 "Desperation Mode"
 * Full career command center data: detailed daily missions, specific interview Qs,
 * OSS steps, outreach templates, role targets, Germany checklist.
 * Run: SUPABASE_URL=... SUPABASE_SECRET_KEY=... npx --yes tsx scripts/sync-roadmap.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

// ─── Interview questions per stack ────────────────────────────────────────────
const INTERVIEW_QS: Record<string, string[]> = {
  "js": [
    "Explain the JavaScript event loop in depth. What is the call stack, microtask queue, and macrotask queue?",
    "How does `this` binding work in arrow functions vs regular functions?",
    "What is a closure and give a real-world use case from your Docita codebase?",
    "Explain prototypal inheritance — how does it differ from classical OOP?",
    "What causes memory leaks in a long-running Node.js process? How do you detect them?",
    "Explain debounce vs throttle. When would you use each?",
    "What are generators and when are they useful over async/await?",
  ],
  "ts": [
    "What is the difference between `type` and `interface`? When do you use each?",
    "Explain conditional types with a real example from your codebase.",
    "What are mapped types and how did you use them in Docita?",
    "How does `infer` work in TypeScript? Give a practical use case.",
    "What is the `satisfies` operator and why was it introduced?",
    "Explain covariance and contravariance in TypeScript.",
    "How do branded types prevent bugs? Show an implementation.",
  ],
  "react": [
    "Walk me through the React reconciliation algorithm and Fiber.",
    "When does React batch state updates? How does this differ in React 18?",
    "Explain `useSyncExternalStore` — what problem does it solve?",
    "How would you prevent unnecessary re-renders in a complex component tree?",
    "What are React Server Components? How do they differ from SSR?",
    "Describe the TanStack Query v5 architecture you built at Docita.",
    "How did you enforce query-key factories in CI at Docita?",
  ],
  "node": [
    "How does the Node.js event loop differ from the browser event loop?",
    "Explain SKIP LOCKED — why did you use it for your job queue at Docita?",
    "What is a transactional outbox pattern and why does it guarantee delivery?",
    "How do you prevent N+1 queries in a NestJS application with Prisma?",
    "Explain idempotency keys — how did you implement them at Docita?",
    "What is backpressure in Node.js streams? How do you handle it?",
    "Describe your webhook security implementation (HMAC + replay protection) at Docita.",
  ],
  "postgres": [
    "Explain PostgreSQL Row-Level Security. How did you implement it at Docita?",
    "What is MVCC in PostgreSQL and how does it affect transaction isolation?",
    "Explain the difference between SERIALIZABLE and REPEATABLE READ isolation.",
    "How do you diagnose a slow query using EXPLAIN ANALYZE? Walk me through it.",
    "What are partial indexes and when do you use them?",
    "How do advisory locks work and when did you use them at Docita?",
    "Explain the write-ahead log (WAL) and its role in replication.",
  ],
  "system-design": [
    "Design a multi-tenant SaaS platform like Docita at 100x scale.",
    "How would you design a real-time notification system for 1M concurrent users?",
    "Design a rate limiter at the API gateway level.",
    "How would you implement a distributed job queue without Redis?",
    "Design an idempotent payment processing system.",
    "How do you handle schema migrations in a zero-downtime deployment?",
    "Design the ABDM/ABHA health ID gateway integration you built at Docita.",
  ],
  "behavioral": [
    "Tell me about a time you owned an entire feature from design to production — use Docita as an example.",
    "Describe a system design decision where you chose the simpler solution. What were the trade-offs?",
    "How do you mentor engineers while also shipping features? (you mentored 4 at MAQ)",
    "Tell me about a production incident — how did you diagnose and fix it?",
    "How do you balance technical debt against feature velocity?",
    "Describe how you made a 30% latency improvement at MAQ — what was your process?",
    "Why Germany? What do you know about our product and team?",
  ],
};

// ─── OSS contribution roadmap ─────────────────────────────────────────────────
const OSS_ROADMAP = {
  langfuse: {
    name: "Langfuse",
    url: "https://github.com/langfuse/langfuse",
    why: "LLM observability, Next.js + Prisma + PostgreSQL. Direct stack match. Fast-growing team actively hiring contributors.",
    week1: [
      "Star + fork the repo. Read CONTRIBUTING.md fully.",
      "Run the dev environment locally (docker-compose + pnpm)",
      "Explore src/pages/api — identify 1 route you understand end-to-end",
      "Comment on 1 good-first-issue saying you're working on it",
    ],
    week2: [
      "Open your first PR — even docs, types, or a small bug fix",
      "Join their Discord and introduce yourself as a contributor",
      "Review someone else's PR and leave a thoughtful comment",
      "Tag the PR to a good-first-issue ticket",
    ],
    week3: [
      "Pick a mid-complexity issue (auth, filtering, API endpoint)",
      "Ship the PR with tests",
      "Ask a maintainer for code review feedback publicly",
      "Tweet/LinkedIn post: 'Shipped my 2nd Langfuse PR — learned X'",
    ],
  },
  lightdash: {
    name: "Lightdash",
    url: "https://github.com/lightdash/lightdash",
    why: "Open-source BI tool. Heavy Node.js + React + TypeScript + PostgreSQL. Your Docita architecture experience maps directly.",
    week1: [
      "Star + fork. Read packages/backend and packages/frontend structure.",
      "Run locally: docker-compose up. Explore the API layer.",
      "Find a good-first-issue in the backend (Node.js preferably)",
      "Comment and claim the issue",
    ],
    week2: [
      "Submit first PR with a fix or small improvement",
      "Write a clear PR description referencing your Docita experience",
      "Request review from a maintainer",
    ],
    week3: [
      "Take on a feature request or performance improvement",
      "Document your contribution on LinkedIn",
    ],
  },
};

// ─── Outreach templates ───────────────────────────────────────────────────────
const OUTREACH_TEMPLATES = {
  germanySaaS: `Subject: Senior Full Stack Engineer → {Company} | Node.js · TypeScript · Postgres

Hi {Founder/Hiring Manager Name},

I'm a Senior Full Stack Engineer (5 YOE) currently at Docita as Founding Engineer, where I own a multi-tenant healthcare SaaS platform end-to-end — from PostgreSQL Row-Level Security and event-driven job queues (no Redis) to React 19 frontends with sub-1.5s LCP.

I'm looking to relocate to {Munich/Berlin} on an EU Blue Card and noticed {Company} is solving {specific product problem}. Your approach to {something specific} caught my attention — it maps well to challenges I've solved in production.

Would you be open to a 20-minute call this week? Happy to do a technical screen immediately — I move fast.

GitHub: github.com/CVamsi27 | Portfolio: buildora.work

— Vamsi Krishna Chandaluri`,

  remote: `Subject: Senior TS/Node Engineer → Remote | Founding-level ownership, shipped to production

Hi {Name},

I'm a Senior Full Stack Engineer (5 YOE) with founding-level experience building multi-tenant SaaS from zero to production. I've shipped: field-level GDPR encryption, transactional outbox patterns, multi-tenant Row-Level Security in Postgres, and React 19 frontends with measurable Web Vitals budgets.

I noticed you're building {product area} — I've solved adjacent problems at Docita (healthcare SaaS). I work async-first, write extensively, and ship with high confidence.

Open to a technical screen this week. My GitHub shows real production work: github.com/CVamsi27

— Vamsi`,

  ossMaintainer: `Hey {maintainer},

I've been using {Langfuse/Lightdash} in production and submitted PR #{number} for {issue description}. Happy to take on more — particularly anything in the auth / multi-tenancy / Postgres layer, which is my strongest area.

Anything in the backlog I should tackle next?

— Vamsi`,
};

// ─── Germany relocation checklist ─────────────────────────────────────────────
const GERMANY_CHECKLIST = [
  { id: "g1", text: "Research EU Blue Card requirements: min salary €45,552/yr for non-shortage, €41,041 for shortage occupations (IT qualifies)", done: false, link: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" },
  { id: "g2", text: "Get degree equivalency checked at anabin.kmk.org (KL University B.Tech → anabin H+ status)", done: false, link: "https://anabin.kmk.org/anabin.html" },
  { id: "g3", text: "Get degree certificate apostilled from India", done: false },
  { id: "g4", text: "Open a Blocked Account (Fintiba/Expatrio) for visa: €11,208 required", done: false, link: "https://www.fintiba.com" },
  { id: "g5", text: "Enroll in German A1→B1 course (Goethe Institut online) — critical differentiator", done: false, link: "https://www.goethe.de/en/spr/kup/kur/dlk.html" },
  { id: "g6", text: "Get health insurance quote: TK (Techniker Krankenkasse) or Barmer", done: false, link: "https://www.tk.de/en" },
  { id: "g7", text: "Research Munich vs Berlin: Munich = Personio, Celonis, BMW; Berlin = N26, Doctolib, SumUp, Zalando", done: false },
  { id: "g8", text: "Target 10 companies on LinkedIn and save contacts of their CTOs/EMs", done: false },
  { id: "g9", text: "Set up a German phone number with Sipgate (for recruiter calls)", done: false, link: "https://www.sipgate.de" },
  { id: "g10", text: "Update LinkedIn location to 'Open to Munich/Berlin relocation' and set Open to Work for EMEA", done: false },
];

// ─── Deep per-topic missions ───────────────────────────────────────────────────
const TOPICS: Array<{
  stack: string; id: string; title: string; file: string; days: number;
  oss: string; mock: string; outreach: string;
  mission: string; practiceTask: string; interviewQKey: string;
  resources: Array<{ label: string; url: string }>;
}> = [
  // ── 00-strategy ──────────────────────────────────────────────────────────
  {
    stack: "00-strategy", id: "00.01", title: "Communication Skills for Tech Interviews",
    file: "00.01-communication.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Personio (Munich)",
    mission: "Master the art of 'structured answer delivery': lead with impact, back with method, close with result. Record yourself answering 3 behavioral questions and critique the recording.",
    practiceTask: "Write STAR answers for: (1) Biggest technical decision at Docita, (2) Conflict with a co-worker, (3) Failure that taught you something. Polish until they're under 2 minutes each.",
    interviewQKey: "behavioral",
    resources: [
      { label: "STAR Method Guide", url: "https://www.themuse.com/advice/star-interview-method" },
      { label: "Lenny Rachitsky on Communication", url: "https://www.lennysnewsletter.com" },
    ],
  },
  {
    stack: "00-strategy", id: "00.02", title: "Resume Tips & ATS Optimisation",
    file: "00.02-resume-tips.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Doctolib (Berlin)",
    mission: "Run your CV through every ATS scanner. Quantify every bullet. Add 3 missing keywords from your top 5 target JDs.",
    practiceTask: "Paste each of your 5 target JDs into a doc. Highlight every keyword. Cross-check against your CV. Fill 3 gaps TODAY.",
    interviewQKey: "behavioral",
    resources: [
      { label: "JobScan ATS Checker", url: "https://www.jobscan.co" },
      { label: "CV Compiler", url: "https://cvcompiler.com" },
      { label: "LinkedIn Resume Builder", url: "https://www.linkedin.com/resume-builder/" },
    ],
  },
  {
    stack: "00-strategy", id: "00.03", title: "STAR Method & Behavioural Answers",
    file: "00.03-star-method.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Celonis (Munich)",
    mission: "Build a STAR story bank: 10 stories that each answer 3+ behavioral questions. Cross-reference with Docita and MAQ accomplishments.",
    practiceTask: "Write 10 STAR stories in a doc. For each: Situation (1 line), Task (1 line), Action (3 bullets), Result (metric). Rehearse 5 of them out loud.",
    interviewQKey: "behavioral",
    resources: [
      { label: "Leet Design Behavioral Q Bank", url: "https://leetdesign.com/behavioral" },
    ],
  },
  {
    stack: "00-strategy", id: "00.04", title: "HR Questions & Salary Negotiation",
    file: "00.04-hr-questions.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "N26 (Berlin)",
    mission: "Know your number. Research German salaries on Levels.fyi, LinkedIn Salary, Glassdoor. For Senior FS Engineer in Munich: €70K–€95K. Practice saying your target number out loud without flinching.",
    practiceTask: "Set your salary anchor: '€80K base is my target, flexible based on equity and relocation support.' Say it 10 times. Write your answers to: 'Why Germany?', 'Why leave India?', 'What's your notice period?'",
    interviewQKey: "behavioral",
    resources: [
      { label: "Levels.fyi Germany", url: "https://www.levels.fyi/t/software-engineer/locations/germany" },
      { label: "Glassdoor Germany", url: "https://www.glassdoor.com/Salaries/germany-senior-software-engineer-salary-SRCH_IL.0,7_IN96_KO8,32.htm" },
    ],
  },
  {
    stack: "00-strategy", id: "00.review", title: "Strategy Review + First Outreach Sprint",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "interviewsby.ai", outreach: "SumUp (Berlin)",
    mission: "Send your first 10 outreach messages today. Use the template. Target CTOs and Engineering Managers of your top 10 companies. Track every message in the Goals tracker.",
    practiceTask: "Copy the outreach template from the Links tab. Personalise each message with 1 specific product observation. Send 10 messages. Update your tracker.",
    interviewQKey: "behavioral",
    resources: [
      { label: "LinkedIn InMail Best Practices", url: "https://www.linkedin.com/help/linkedin/answer/a544077" },
      { label: "Hunter.io - Find emails", url: "https://hunter.io" },
    ],
  },
  // ── JS ───────────────────────────────────────────────────────────────────
  {
    stack: "10-frontend / 10.1-javascript", id: "10.1.1", title: "JS: Execution Context, Scope & Closures",
    file: "01-execution-and-scope/INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Personio",
    mission: "Read the chapter. Then open your Docita codebase and find 3 real examples of closures. Explain each one to yourself as if presenting to a senior interviewer.",
    practiceTask: "Code challenge: implement `memoize()`, `once()`, and `curry()` from scratch in TypeScript with full type safety. No libraries.",
    interviewQKey: "js",
    resources: [
      { label: "JS Visualizer (event loop)", url: "https://www.jsv9000.app/" },
      { label: "You Don't Know JS", url: "https://github.com/getify/You-Dont-Know-JS" },
    ],
  },
  {
    stack: "10-frontend / 10.1-javascript", id: "10.1.2", title: "JS: Objects, Prototypes & this",
    file: "02-objects-prototypes-this/INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Celonis",
    mission: "Deeply understand the prototype chain. Build a class-based system using only prototypes (no `class` keyword) that mimics Docita's ABAC policy engine.",
    practiceTask: "Code challenge: implement `Object.create()`, `instanceof`, and `new` from scratch. Explain Proxy and Reflect use cases.",
    interviewQKey: "js",
    resources: [
      { label: "MDN: Prototype Chain", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain" },
    ],
  },
  {
    stack: "10-frontend / 10.1-javascript", id: "10.1.3", title: "JS: Async, Event Loop & Promises",
    file: "03-async-concurrency/INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Gorillas (Berlin)",
    mission: "Draw the entire event loop on paper. Explain microtasks vs macrotasks. Implement a Promise from scratch. This is the #1 most asked JS topic.",
    practiceTask: "Code: implement `Promise.all`, `Promise.race`, `Promise.allSettled` from scratch. Then implement a retry-with-exponential-backoff function.",
    interviewQKey: "js",
    resources: [
      { label: "Philip Roberts: Event Loop Talk", url: "https://www.youtube.com/watch?v=8aGhZQkoFbQ" },
      { label: "JS Event Loop Visualizer", url: "https://www.jsv9000.app/" },
    ],
  },
  {
    stack: "10-frontend / 10.1-javascript", id: "10.1.4", title: "JS: Memory & Garbage Collection",
    file: "04-memory-and-data/INDEX.md", days: 1, oss: "Langfuse", mock: "interviewsby.ai", outreach: "Mambu",
    mission: "Profile a real app. Open Chrome DevTools → Memory → take a heap snapshot of your buildora.work. Identify the top 5 memory holders.",
    practiceTask: "Code: implement `debounce` and `throttle` with leading/trailing edge control. Find 1 memory leak in your portfolio codebase and fix it.",
    interviewQKey: "js",
    resources: [
      { label: "Chrome DevTools Memory Guide", url: "https://developer.chrome.com/docs/devtools/memory-problems/" },
    ],
  },
  {
    stack: "10-frontend / 10.1-javascript", id: "10.1.5", title: "JS: Functional Patterns",
    file: "05-functional-patterns/INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "TIER Mobility (Berlin)",
    mission: "Refactor a complex piece of your Docita code using functional patterns: compose, pipe, and partial application.",
    practiceTask: "Code: implement `pipe()`, `compose()`, `partial()`, and a monad-like Result type (Ok/Err) in TypeScript.",
    interviewQKey: "js",
    resources: [
      { label: "Mostly Adequate Guide to FP", url: "https://mostly-adequate.gitbook.io/mostly-adequate-guide" },
    ],
  },
  {
    stack: "10-frontend / 10.1-javascript", id: "10.1.6", title: "JS: Modern Features + Interview Prep",
    file: "06-modern-and-interview/INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Adjust",
    mission: "Do a full mock interview on micro1.ai focused on JavaScript. Review every answer you give. Write down 3 weak spots.",
    practiceTask: "Do the top 20 JavaScript interview questions on micro1.ai. Record your answers. Re-answer the ones you got wrong.",
    interviewQKey: "js",
    resources: [
      { label: "micro1.ai Mock Interview", url: "https://micro1.ai" },
      { label: "JavaScript.info", url: "https://javascript.info" },
    ],
  },
  // ── TS ───────────────────────────────────────────────────────────────────
  {
    stack: "10-frontend / 10.2-typescript", id: "10.2.1", title: "TS: Foundations",
    file: "01-foundations/INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Contentful (Berlin)",
    mission: "Read the chapter. Then open your Docita types and catalogue every `any` or `unknown`. Fix 5 of them with proper types today.",
    practiceTask: "Code: implement a fully type-safe API client using only TypeScript generics and conditional types. No `any`.",
    interviewQKey: "ts",
    resources: [
      { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/2/types-from-types.html" },
      { label: "Type Challenges", url: "https://github.com/type-challenges/type-challenges" },
    ],
  },
  {
    stack: "10-frontend / 10.2-typescript", id: "10.2.2", title: "TS: Generics & Inference",
    file: "02-generics-and-inference/INDEX.md", days: 1, oss: "Lightdash", mock: "interviewsby.ai", outreach: "Babbel (Berlin)",
    mission: "Solve 5 'medium' type challenges on type-challenges.github.io. These are exactly what top companies ask.",
    practiceTask: "Solve: Implement `ReturnType`, `Parameters`, `Awaited`, `DeepReadonly`, and `FlattenPromise` from scratch.",
    interviewQKey: "ts",
    resources: [
      { label: "Type Challenges (Medium)", url: "https://github.com/type-challenges/type-challenges?tab=readme-ov-file#medium" },
    ],
  },
  {
    stack: "10-frontend / 10.2-typescript", id: "10.2.3", title: "TS: Utility & Mapped Types",
    file: "03-type-transformations/INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Idealo (Berlin)",
    mission: "Build a type-safe event emitter using discriminated unions and mapped types. This is a classic senior TS interview question.",
    practiceTask: "Implement: TypeSafeEventEmitter<Events extends Record<string, unknown>>. No any, no cast.",
    interviewQKey: "ts",
    resources: [
      { label: "Matt Pocock TS Tips", url: "https://www.totaltypescript.com/tips" },
    ],
  },
  {
    stack: "10-frontend / 10.2-typescript", id: "10.2.4", title: "TS: Advanced Patterns",
    file: "04-advanced-patterns/INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Taxfix (Berlin)",
    mission: "Implement branded types for your domain: UserId, ClinicId, PatientId — and refactor a Docita function to use them.",
    practiceTask: "Implement: UserId brand, ClinicId brand, type-safe factory functions, and an assertion function that narrows from string to UserId.",
    interviewQKey: "ts",
    resources: [
      { label: "Branded Types — Zod Creator", url: "https://www.totaltypescript.com/branded-types" },
    ],
  },
  {
    stack: "10-frontend / 10.2-typescript", id: "10.2.5", title: "TS: Interview Prep & Mock",
    file: "05-interview-prep/INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "ABOUT YOU (Hamburg)",
    mission: "Full TypeScript mock interview on micro1.ai. Target time: 45 minutes. Focus on generics + mapped types.",
    practiceTask: "Solve 3 hard type-challenges. Then write a blog-post-style explanation of the trickiest one (proves understanding).",
    interviewQKey: "ts",
    resources: [
      { label: "Total TypeScript Course", url: "https://www.totaltypescript.com" },
    ],
  },
  // ── React ─────────────────────────────────────────────────────────────────
  {
    stack: "10-frontend / 10.3-react", id: "10.3.1", title: "React: Internals — Fiber & Reconciliation",
    file: "01-react-internals/INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Personio",
    mission: "Explain Fiber and reconciliation to yourself in plain English — without reading. Record a 2-min explanation. This is what a staff engineer interview sounds like.",
    practiceTask: "Build a tiny React-like from scratch: createElement, render, useState. Follow along with https://pomb.us/build-your-own-react/",
    interviewQKey: "react",
    resources: [
      { label: "Build Your Own React", url: "https://pomb.us/build-your-own-react/" },
      { label: "React Fiber Architecture", url: "https://github.com/acdlite/react-fiber-architecture" },
    ],
  },
  {
    stack: "10-frontend / 10.3-react", id: "10.3.2", title: "React: Core Hooks Deep-Dive",
    file: "02-core-hooks/INDEX.md", days: 1, oss: "Lightdash", mock: "interviewsby.ai", outreach: "SumUp",
    mission: "Explain when useCallback and useMemo actually help vs hurt. This is a trap question most devs get wrong.",
    practiceTask: "Implement: useDebounce, usePrevious, useLocalStorage, useIntersectionObserver from scratch. Add TypeScript types.",
    interviewQKey: "react",
    resources: [
      { label: "useHooks.com", url: "https://usehooks.com" },
      { label: "React hooks — when to use each", url: "https://react.dev/reference/react" },
    ],
  },
  {
    stack: "10-frontend / 10.3-react", id: "10.3.3", title: "React: Advanced Patterns",
    file: "03-advanced-hooks-and-patterns/INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Doctolib",
    mission: "Study how useSyncedStorage.ts in your portfolio works — it IS a textbook implementation of useSyncExternalStore. Use it as your answer in interviews.",
    practiceTask: "Build: Compound Component pattern, Render Props pattern, and HOC pattern — all for the same use case to compare trade-offs.",
    interviewQKey: "react",
    resources: [
      { label: "Kent C. Dodds — Advanced React Patterns", url: "https://kentcdodds.com/blog/advanced-react-component-patterns" },
    ],
  },
  {
    stack: "10-frontend / 10.3-react", id: "10.3.4", title: "React 19: Modern React",
    file: "04-modern-react/INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Celonis",
    mission: "You already use React 19 at Docita. Write a technical blog post (500 words) about one specific React 19 feature you ship in production. This becomes a portfolio piece.",
    practiceTask: "Implement a React 19 Server Action for a form. Explain the round-trip vs client component approach trade-offs.",
    interviewQKey: "react",
    resources: [
      { label: "React 19 Release Notes", url: "https://react.dev/blog/2024/12/05/react-19" },
    ],
  },
  {
    stack: "10-frontend / 10.3-react", id: "10.3.5", title: "React: Patterns & Interview",
    file: "05-patterns-and-interview/INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "N26",
    mission: "Do a full React take-home style challenge: build a paginated data table with sorting, filtering, and virtualization in 2 hours.",
    practiceTask: "Build: A React data table with TanStack Table, virtual scrolling, column sorting, and keyboard navigation.",
    interviewQKey: "react",
    resources: [
      { label: "TanStack Table Docs", url: "https://tanstack.com/table/latest" },
      { label: "React Virtual", url: "https://tanstack.com/virtual/latest" },
    ],
  },
  // ── Next.js ───────────────────────────────────────────────────────────────
  {
    stack: "10-frontend / 10.4-nextjs", id: "10.4.1", title: "Next.js: App Router, RSC & Data Fetching",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Vercel-backed startup",
    mission: "Explain the difference between Server Components, Client Components, and Partial Prerendering without looking it up.",
    practiceTask: "Build a Next.js 15 page that uses: RSC for initial data, Suspense for streaming, and a Server Action for a form mutation.",
    interviewQKey: "react",
    resources: [
      { label: "Next.js App Router Docs", url: "https://nextjs.org/docs/app" },
    ],
  },
  {
    stack: "10-frontend / 10.4-nextjs", id: "10.4.2", title: "Next.js: Auth, Middleware & API Routes",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "interviewsby.ai", outreach: "Pitch (Berlin)",
    mission: "Implement a complete auth flow with NextAuth v5 + Supabase (you already have this in your portfolio — explain every line).",
    practiceTask: "Audit your portfolio's auth implementation. Document: session handling, CSRF protection, token refresh strategy.",
    interviewQKey: "node",
    resources: [
      { label: "Auth.js (NextAuth v5)", url: "https://authjs.dev" },
    ],
  },
  {
    stack: "10-frontend / 10.4-nextjs", id: "10.4.3", title: "Next.js: Performance, Caching & Deployment",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Moonfare (Berlin)",
    mission: "Run Lighthouse on personal.buildora.work. Fix every issue that drops your score below 95 on desktop.",
    practiceTask: "Optimize: images with next/image, fonts with next/font, bundle analyze, route prefetching strategy.",
    interviewQKey: "react",
    resources: [
      { label: "Next.js Bundle Analyzer", url: "https://www.npmjs.com/package/@next/bundle-analyzer" },
    ],
  },
  // ── Node/NestJS ───────────────────────────────────────────────────────────
  {
    stack: "20-backend / 20.1-nodejs", id: "20.1.1", title: "Node.js: Event Loop & Streams",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Taxfix",
    mission: "Draw the Node.js event loop from memory. Explain libuv, the thread pool, and how I/O phases differ from timer phases.",
    practiceTask: "Implement: a backpressure-aware stream processor that reads a large CSV, transforms each row, and writes to a DB without buffering the whole file.",
    interviewQKey: "node",
    resources: [
      { label: "Node.js Event Loop Explained", url: "https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick" },
    ],
  },
  {
    stack: "20-backend / 20.1-nodejs", id: "20.1.2", title: "Node.js: Performance & Worker Threads",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Personio",
    mission: "Profile a Node.js function with `--inspect` and Chrome DevTools. Find a CPU-bound operation and move it to a worker thread.",
    practiceTask: "Implement: a CPU-heavy image processing task using worker_threads with a thread pool. Show 4x throughput improvement.",
    interviewQKey: "node",
    resources: [
      { label: "Node.js Performance Profiling", url: "https://nodejs.org/en/docs/guides/diagnostics-flamegraph" },
    ],
  },
  {
    stack: "20-backend / 20.1-nodejs", id: "20.1.3", title: "NestJS: Modules, DI & Guards",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "FlixBus (Munich)",
    mission: "Explain NestJS's DI system from scratch. How does it compare to Express? You use this daily — be the expert in the room.",
    practiceTask: "Build: a NestJS module with custom providers, a guard that checks JWT + ABAC policy, and a request-scoped interceptor for audit logging.",
    interviewQKey: "node",
    resources: [
      { label: "NestJS Fundamentals", url: "https://docs.nestjs.com/fundamentals/dependency-injection" },
    ],
  },
  {
    stack: "20-backend / 20.1-nodejs", id: "20.1.4", title: "NestJS: Advanced (CQRS, Microservices)",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "interviewsby.ai", outreach: "Allianz X",
    mission: "Design a CQRS pattern for Docita's appointment booking. Write out the command, handler, event, and projection classes.",
    practiceTask: "Implement: NestJS CQRS module for a booking command. Add an event sourcing projection that rebuilds read-model.",
    interviewQKey: "node",
    resources: [
      { label: "NestJS CQRS Module", url: "https://docs.nestjs.com/recipes/cqrs" },
    ],
  },
  // ── APIs ──────────────────────────────────────────────────────────────────
  {
    stack: "20-backend / 20.2-api", id: "20.2.1", title: "REST API Design: OpenAPI, Versioning & Pagination",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Contentful",
    mission: "Write an OpenAPI 3.1 spec for Docita's Patient API from memory. Include: pagination, error schemas, auth, and webhook callbacks.",
    practiceTask: "Generate OpenAPI spec for 5 Docita endpoints. Validate it with Spectral linter. Fix every rule violation.",
    interviewQKey: "node",
    resources: [
      { label: "Stoplight — OpenAPI Editor", url: "https://stoplight.io" },
      { label: "Spectral OpenAPI Linter", url: "https://stoplight.io/open-source/spectral" },
    ],
  },
  {
    stack: "20-backend / 20.2-api", id: "20.2.2", title: "GraphQL, gRPC & tRPC",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Shopify (Remote)",
    mission: "Build a tRPC router that mirrors one of your Docita API surfaces. Compare latency vs REST with k6 load test.",
    practiceTask: "Implement: a tRPC router with input validation (Zod), output type inference, and a React Query adapter for the client.",
    interviewQKey: "node",
    resources: [
      { label: "tRPC Docs", url: "https://trpc.io" },
      { label: "GraphQL vs REST vs gRPC", url: "https://hygraph.com/blog/graphql-vs-rest-apis" },
    ],
  },
  // ── Security ──────────────────────────────────────────────────────────────
  {
    stack: "20-backend / 20.5-security", id: "20.5.1", title: "Auth: JWT, OAuth2, OIDC",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Auth0 / Okta (Remote)",
    mission: "Draw the full OAuth2 authorization code flow with PKCE from memory. Explain exactly what Docita's refresh token rotation + token family reuse detection does.",
    practiceTask: "Implement: a minimal OIDC provider from scratch (authorization endpoint, token endpoint, JWKS endpoint).",
    interviewQKey: "node",
    resources: [
      { label: "OAuth2 Playground", url: "https://www.oauth.com/playground/" },
    ],
  },
  {
    stack: "20-backend / 20.5-security", id: "20.5.2", title: "ABAC, RBAC & Row-Level Security",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "N26",
    mission: "Write a technical blog post (500 words): 'How we implemented ABAC over RBAC in a multi-tenant healthcare SaaS.' This is a portfolio piece AND interview gold.",
    practiceTask: "Implement: PostgreSQL RLS policies for a multi-tenant table with 3 role levels (admin, member, viewer). Test with differential-equivalence approach.",
    interviewQKey: "postgres",
    resources: [
      { label: "PostgreSQL RLS Docs", url: "https://www.postgresql.org/docs/current/ddl-rowsecurity.html" },
    ],
  },
  {
    stack: "20-backend / 20.5-security", id: "20.5.3", title: "GDPR, DSGVO & Encryption",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "interviewsby.ai", outreach: "Doctolib",
    mission: "This is your strongest differentiator for Germany. Practice explaining your field-level encryption implementation at Docita in under 3 minutes.",
    practiceTask: "Write: a 1-page technical design doc for 'Field-level encryption with key rotation in PostgreSQL.' Include: key derivation, rotation strategy, performance impact.",
    interviewQKey: "postgres",
    resources: [
      { label: "GDPR Technical Measures Guide", url: "https://gdpr.eu/article-25-data-protection-by-design/" },
    ],
  },
  // ── DB ────────────────────────────────────────────────────────────────────
  {
    stack: "20-backend / 20.3-database", id: "20.3.1", title: "PostgreSQL: Indexes & Query Planning",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Aiven (Remote)",
    mission: "Run EXPLAIN ANALYZE on your 3 slowest Docita queries. Identify what's causing full table scans. Add the right indexes.",
    practiceTask: "Explain: Seq Scan vs Index Scan vs Bitmap Heap Scan vs Index Only Scan. When does Postgres choose each? Write it from memory then verify.",
    interviewQKey: "postgres",
    resources: [
      { label: "Use The Index Luke", url: "https://use-the-index-luke.com" },
      { label: "explain.tensor.ru (EXPLAIN visualizer)", url: "https://explain.tensor.ru" },
    ],
  },
  {
    stack: "20-backend / 20.3-database", id: "20.3.2", title: "PostgreSQL: Transactions & Isolation",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Zalando (Berlin)",
    mission: "Explain MVCC in plain English without looking it up. Then explain why SKIP LOCKED is better than SELECT FOR UPDATE for job queues.",
    practiceTask: "Code challenge: implement optimistic locking in Prisma + PostgreSQL for a booking system where 2 users can't book the same slot.",
    interviewQKey: "postgres",
    resources: [
      { label: "PostgreSQL Transaction Isolation", url: "https://www.postgresql.org/docs/current/transaction-iso.html" },
    ],
  },
  {
    stack: "20-backend / 20.3-database", id: "20.3.3", title: "Prisma ORM: Schema Design & Migrations",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Personio",
    mission: "Review every Prisma migration you've written at Docita. Find 1 that could have been done with a zero-downtime strategy. Rewrite it.",
    practiceTask: "Implement: a Prisma schema for a multi-tenant app with: row-level security hooks, soft deletes, audit columns, and a polymorphic relationship.",
    interviewQKey: "postgres",
    resources: [
      { label: "Prisma Docs — Advanced", url: "https://www.prisma.io/docs/orm/prisma-schema/overview" },
    ],
  },
  {
    stack: "20-backend / 20.3-database", id: "20.3.4", title: "Redis, Background Jobs & Message Queues",
    file: "INDEX.md", days: 1, oss: "Langfuse", mock: "micro1.ai", outreach: "Tier Mobility",
    mission: "You built a Postgres-native job queue. Explain why you chose it over Redis/BullMQ. This is a differentiated answer — practice it.",
    practiceTask: "Implement: a minimal Postgres-backed job queue with SKIP LOCKED, retry with exponential backoff, DLQ, and idempotency keys.",
    interviewQKey: "node",
    resources: [
      { label: "Graphile Worker (Postgres jobs)", url: "https://worker.graphile.org" },
    ],
  },
  // ── Architecture ──────────────────────────────────────────────────────────
  {
    stack: "30-architecture / 30.1-design-patterns", id: "30.1", title: "Design Patterns: GoF 23 Patterns",
    file: "INDEX.md", days: 2, oss: "Langfuse", mock: "micro1.ai", outreach: "Celonis",
    mission: "Map every GoF pattern to a real example from Docita or MAQ. Concrete code > abstract descriptions in interviews.",
    practiceTask: "Implement 5 patterns from your Docita codebase in a playground. For each, write: 'We use this because...' in 2 sentences.",
    interviewQKey: "system-design",
    resources: [
      { label: "Refactoring.Guru — Patterns", url: "https://refactoring.guru/design-patterns" },
    ],
  },
  {
    stack: "30-architecture / 30.2-system-design", id: "30.2", title: "System Design: Scalability & Caching",
    file: "INDEX.md", days: 3, oss: "Lightdash", mock: "interviewsby.ai", outreach: "Zalando",
    mission: "Practice 1 full system design per day. Use the FRIED framework: Functional requirements → Requirements → Infrastructure → Evaluation → Drill-down.",
    practiceTask: "Day 1: Design Docita at 1000x. Day 2: Design a URL shortener. Day 3: Design a real-time collaborative document editor.",
    interviewQKey: "system-design",
    resources: [
      { label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
      { label: "ByteByteGo Newsletter", url: "https://blog.bytebytego.com" },
      { label: "interviewsby.ai — System Design", url: "https://interviewsby.ai" },
    ],
  },
  {
    stack: "30-architecture / 30.3-infra-patterns", id: "30.3", title: "Infra Patterns: Event-Driven, CQRS, Outbox",
    file: "INDEX.md", days: 3, oss: "Langfuse", mock: "micro1.ai", outreach: "SumUp",
    mission: "You BUILT the transactional outbox at Docita. Explain it end-to-end with a sequence diagram. This is a senior-level differentiator.",
    practiceTask: "Day 1: Draw the transactional outbox sequence diagram. Day 2: Implement Saga pattern for distributed booking. Day 3: Implement event sourcing with projection.",
    interviewQKey: "system-design",
    resources: [
      { label: "Microservices Patterns (book)", url: "https://microservices.io/patterns/data/transactional-outbox.html" },
    ],
  },
  // ── Platform ──────────────────────────────────────────────────────────────
  {
    stack: "40-platform / 40.1-docker", id: "40.1", title: "Docker: Containers, Networking & Compose",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "FlixBus",
    mission: "Write a multi-stage Dockerfile for a production NestJS app. Explain every layer and why it's in that order.",
    practiceTask: "Build: a production-grade multi-stage Docker image for NestJS: build stage → prune stage → runtime stage. Target: <200MB final image.",
    interviewQKey: "system-design",
    resources: [
      { label: "Docker Best Practices", url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" },
    ],
  },
  {
    stack: "40-platform / 40.2-kubernetes", id: "40.2", title: "Kubernetes: Workloads, Networking & Scaling",
    file: "INDEX.md", days: 3, oss: "Langfuse", mock: "micro1.ai", outreach: "Zalando",
    mission: "This is your biggest gap. Invest 3 days here. K8s knowledge is required for every senior role at Zalando, Celonis, and N26.",
    practiceTask: "Day 1: Deploy your NestJS app to minikube. Day 2: Add HPA + resource limits. Day 3: Add liveness/readiness probes + rolling deploy.",
    interviewQKey: "system-design",
    resources: [
      { label: "Kubernetes the Hard Way", url: "https://github.com/kelseyhightower/kubernetes-the-hard-way" },
      { label: "Killer.sh — K8s Exam Simulator", url: "https://killer.sh" },
      { label: "Play with Kubernetes", url: "https://labs.play-with-k8s.com" },
    ],
  },
  {
    stack: "40-platform / 40.3-ci-cd", id: "40.3", title: "CI/CD: Pipelines & Releases",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Personio",
    mission: "Audit your current CI/CD setup at Docita. Add: Snyk security scan, Docker image scan, and a canary deployment step.",
    practiceTask: "Build: a GitHub Actions workflow with: lint → test → build → container scan → deploy to staging → smoke test → promote to prod.",
    interviewQKey: "system-design",
    resources: [
      { label: "GitHub Actions Docs", url: "https://docs.github.com/en/actions" },
    ],
  },
  {
    stack: "40-platform / 40.4-observability", id: "40.4", title: "Observability: Logging, Tracing & SRE",
    file: "INDEX.md", days: 2, oss: "Langfuse", mock: "interviewsby.ai", outreach: "Datadog (Remote)",
    mission: "Add OpenTelemetry to your personal.buildora.work. Connect to a free Grafana Cloud account. Show a real trace in the interview.",
    practiceTask: "Instrument a Node.js app with: structured pino logs, OpenTelemetry traces, and a Prometheus metrics endpoint. Set up Grafana dashboard.",
    interviewQKey: "system-design",
    resources: [
      { label: "OpenTelemetry JS", url: "https://opentelemetry.io/docs/languages/js/" },
      { label: "Grafana Cloud (free)", url: "https://grafana.com/products/cloud/free/" },
    ],
  },
  {
    stack: "40-platform / 40.5-build-tools", id: "40.5", title: "Build Tools: Vite, esbuild & Turborepo",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Vercel-backed",
    mission: "Run bundle-analyzer on your Docita frontend. Find the 3 biggest contributors. Fix at least one.",
    practiceTask: "Analyze: your buildora.work bundle. Implement lazy loading for the 3 heaviest routes. Measure before/after LCP.",
    interviewQKey: "react",
    resources: [
      { label: "Vite Bundle Visualizer", url: "https://github.com/btd/rollup-plugin-visualizer" },
    ],
  },
  // ── Quality ───────────────────────────────────────────────────────────────
  {
    stack: "50-quality / 50.1-testing", id: "50.1", title: "Testing: Unit, Integration & E2E",
    file: "INDEX.md", days: 3, oss: "Lightdash", mock: "micro1.ai", outreach: "Personio",
    mission: "You maintain 85%+ coverage at Docita. Explain your testing pyramid philosophy — this is a gold-star answer for any senior role.",
    practiceTask: "Day 1: Write integration tests for the transactional outbox. Day 2: Write cross-tenant E2E tests in Playwright. Day 3: Set up a test data builder pattern.",
    interviewQKey: "node",
    resources: [
      { label: "Testing JS — Kent C. Dodds", url: "https://testingjavascript.com" },
      { label: "Playwright Docs", url: "https://playwright.dev/docs/intro" },
    ],
  },
  {
    stack: "50-quality / 50.2-accessibility", id: "50.2", title: "Accessibility: WCAG & ARIA",
    file: "INDEX.md", days: 1, oss: "Lightdash", mock: "micro1.ai", outreach: "Zalando",
    mission: "Run axe DevTools on your portfolio. Fix every error. Add keyboard navigation to the roadmap page.",
    practiceTask: "Audit: personal.buildora.work with axe DevTools. Fix all Critical and Serious violations. Add skip-to-content link.",
    interviewQKey: "react",
    resources: [
      { label: "axe DevTools Extension", url: "https://www.deque.com/axe/browser-extensions/" },
    ],
  },
  {
    stack: "50-quality / 50.3-performance", id: "50.3", title: "Performance: Core Web Vitals",
    file: "INDEX.md", days: 2, oss: "Langfuse", mock: "interviewsby.ai", outreach: "SumUp",
    mission: "Your LCP < 1.5s at Docita is a real achievement. Prepare to explain the exact changes that got you there with metrics.",
    practiceTask: "Day 1: Achieve Lighthouse 100 on personal.buildora.work desktop. Day 2: Set up Vercel Analytics and Web Vitals monitoring.",
    interviewQKey: "react",
    resources: [
      { label: "web.dev/performance", url: "https://web.dev/performance/" },
    ],
  },
  // ── Realtime ──────────────────────────────────────────────────────────────
  {
    stack: "60-realtime / 60.1-websockets", id: "60.1", title: "Real-time: WebSockets, SSE & Scaling",
    file: "INDEX.md", days: 3, oss: "Langfuse", mock: "micro1.ai", outreach: "Liveblocks (Remote)",
    mission: "Build a real-time feature for Docita (e.g., live appointment status updates) using WebSockets with Socket.IO. This becomes a portfolio talking point.",
    practiceTask: "Build: a real-time appointment dashboard with Socket.IO: room-based isolation per clinic, reconnect handling, and presence indicators.",
    interviewQKey: "system-design",
    resources: [
      { label: "Socket.IO Docs", url: "https://socket.io/docs/v4/" },
    ],
  },
  // ── Interview Toolkit ─────────────────────────────────────────────────────
  {
    stack: "70-interview-toolkit / 70.1-behavioral", id: "70.1", title: "Behavioural Mastery & STAR Stories",
    file: "INDEX.md", days: 2, oss: "Langfuse", mock: "micro1.ai", outreach: "Celonis",
    mission: "Do a full behavioral mock interview on micro1.ai. Record it. Watch it back. Identify 3 answers to improve.",
    practiceTask: "Day 1: Record answers to 7 behavioral questions. Day 2: Re-record the 3 weakest. Compare before/after.",
    interviewQKey: "behavioral",
    resources: [
      { label: "micro1.ai Behavioral Practice", url: "https://micro1.ai" },
    ],
  },
  {
    stack: "70-interview-toolkit / 70.2-coding-patterns", id: "70.2", title: "LeetCode Patterns: Arrays, Graphs, DP",
    file: "INDEX.md", days: 4, oss: "Lightdash", mock: "interviewsby.ai", outreach: "Doctolib",
    mission: "Solve 2 LeetCode mediums per day. You have 455+ solved — focus on the patterns you're weakest on: DP and graph traversal.",
    practiceTask: "Day 1: Sliding Window + Two Pointer (5 problems). Day 2: DFS/BFS (5 problems). Day 3: Dynamic Programming (3 problems). Day 4: Heap + Monotonic Stack (4 problems).",
    interviewQKey: "behavioral",
    resources: [
      { label: "NeetCode 150", url: "https://neetcode.io/practice" },
      { label: "LeetCode Patterns", url: "https://seanprashad.com/leetcode-patterns/" },
    ],
  },
  {
    stack: "70-interview-toolkit / 70.3-cheatsheets", id: "70.3", title: "Cheatsheets: Final Review",
    file: "INDEX.md", days: 2, oss: "Langfuse", mock: "micro1.ai", outreach: "Personio",
    mission: "Do 2 full loop interviews: 1 coding + 1 system design per day. Treat them as real. Timer on.",
    practiceTask: "Day 1: Full coding round on Pramp (peer-to-peer). Day 2: Full system design round on interviewsby.ai.",
    interviewQKey: "system-design",
    resources: [
      { label: "Pramp — peer-to-peer", url: "https://www.pramp.com" },
      { label: "interviewsby.ai", url: "https://interviewsby.ai" },
    ],
  },
  // ── Germany Lane ─────────────────────────────────────────────────────────
  {
    stack: "80-lanes-abroad-full-stack", id: "80.1", title: "Germany Target Research & Outreach Sprint",
    file: "INDEX.md", days: 2, oss: "Langfuse", mock: "micro1.ai", outreach: "10 founders per day",
    mission: "Send 10 personalised outreach messages per day using the templates. Track every response. Follow up on no-replies after 5 days.",
    practiceTask: "Day 1: Send 10 messages to Munich targets (Personio, Celonis, FlixBus area). Day 2: Send 10 to Berlin targets (Doctolib, N26, SumUp, Taxfix). Update tracker.",
    interviewQKey: "behavioral",
    resources: [
      { label: "LinkedIn Job Search — Germany", url: "https://www.linkedin.com/jobs/search/?location=Germany" },
      { label: "Make It In Germany", url: "https://www.make-it-in-germany.com" },
    ],
  },
  {
    stack: "80-lanes-abroad-full-stack", id: "80.2", title: "OSS Sprint: Ship 2 Meaningful PRs",
    file: "INDEX.md", days: 3, oss: "Langfuse", mock: "interviewsby.ai", outreach: "OSS maintainers",
    mission: "This is your most leveraged activity. A merged PR to Langfuse or Lightdash is equivalent to 10 outreach emails. Prioritise it.",
    practiceTask: "Day 1: Set up local Langfuse dev env + claim issue. Day 2: Write code + tests + PR draft. Day 3: Polish PR, request review, post on LinkedIn.",
    interviewQKey: "node",
    resources: [
      { label: "Langfuse Good First Issues", url: "https://github.com/langfuse/langfuse/issues?q=label%3A%22good+first+issue%22" },
      { label: "Lightdash Good First Issues", url: "https://github.com/lightdash/lightdash/issues?q=label%3A%22good+first+issue%22" },
    ],
  },
  {
    stack: "80-lanes-abroad-full-stack", id: "80.3", title: "Take-Home Projects & Full Mock Loops",
    file: "INDEX.md", days: 3, oss: "Lightdash", mock: "micro1.ai", outreach: "Final wave",
    mission: "Run 3 full interview loops. Each loop: 1 HR screen + 1 technical + 1 system design. Treat them as real. Debrief after each.",
    practiceTask: "Day 1: Full mock loop on Pramp. Day 2: Full mock loop on interviewsby.ai. Day 3: Build + submit a take-home project (CRUD API with auth, tests, Docker).",
    interviewQKey: "system-design",
    resources: [
      { label: "Pramp Full Loop", url: "https://www.pramp.com" },
      { label: "interviewsby.ai", url: "https://interviewsby.ai" },
    ],
  },
];

// ─── Build daily plan ─────────────────────────────────────────────────────────
const DAILY_SCHEDULE: Record<string, string> = {
  "07:00 - 08:30": "💪 Exercise & Freshen Up — no breakfast. Start the day with your body.",
  "08:30 - 10:30": "📖 Deep Study — read the chapter, ask Claude, take notes. No distractions.",
  "10:30 - 12:30": "🛠️  Build & Practice — code the day's challenge. Ship something real.",
  "12:30 - 14:00": "🔍 Role Scouting — find 10 open roles. Audit their product. Prepare outreach note.",
  "14:00 - 14:30": "🍱 Lunch",
  "14:30 - 16:30": "🐙 OSS Contribution — work on Langfuse or Lightdash. Claim issues. Ship PRs.",
  "16:30 - 17:30": "🎯 Interview Prep — answer today's interview questions out loud. Record yourself.",
  "17:30 - 18:00": "🤖 Mock Interview — micro1.ai or interviewsby.ai. Full timed session.",
  "18:00 - 20:00": "👨‍👩‍👧 Family Time — unplug completely. Recharge.",
  "20:00 - 20:30": "🍽️  Dinner",
  "20:30 - 21:30": "✉️  Founder Outreach — send 10 personalised messages. Track responses.",
  "21:30 - 22:00": "🌙 Wind Down — review what you learned. Write tomorrow's 3 priorities.",
};

const START_DATE = new Date("2026-09-29T00:00:00Z");

interface DayPlan {
  day: number; date: string; topic: string; chapterId: string; title: string;
  studyLink: string; schedule: Record<string, string>;
  mission: string; practiceTask: string;
  interviewQuestions: string[];
  steps: string[]; checklist: { id: string; text: string; done: boolean }[];
  notification: { time: string; message: string };
  oSSProject: string; mockInterviewPlatform: string; founderOutreachTarget: string;
  resources: { label: string; url: string }[];
  ossRoadmap: typeof OSS_ROADMAP.langfuse;
  outreachTemplates: typeof OUTREACH_TEMPLATES;
  germanyChecklist: typeof GERMANY_CHECKLIST;
}

const days: DayPlan[] = [];
const todos: { id: string; text: string; done: boolean; date: string; priority: "P1"; tag: "Goal"; createdAt: number }[] = [];
let globalDay = 1;

for (const t of TOPICS) {
  const qs = INTERVIEW_QS[t.interviewQKey] ?? [];
  for (let p = 0; p < t.days; p++) {
    const d = new Date(START_DATE.getTime() + (globalDay - 1) * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const partLabel = t.days > 1 ? ` (Part ${p + 1}/${t.days})` : "";
    const stackFolder = t.stack.split(" / ")[0];

    days.push({
      day: globalDay,
      date: dateStr,
      topic: t.stack,
      chapterId: t.id,
      title: t.title + partLabel,
      studyLink: `https://study.buildora.work/${stackFolder}/INDEX.md`,
      schedule: Object.fromEntries(
        Object.entries(DAILY_SCHEDULE).map(([time, act]) =>
          time === "08:30 - 10:30"
            ? [time, `📖 Deep Study: "${t.title}"${partLabel} → study.buildora.work/${stackFolder}`]
            : time === "16:30 - 17:30"
            ? [time, `🎯 Interview Prep: "${qs[p % qs.length]}" — answer out loud, record yourself`]
            : [time, act]
        )
      ),
      mission: t.mission,
      practiceTask: t.practiceTask,
      interviewQuestions: qs,
      steps: [
        `Open study.buildora.work/${stackFolder}/INDEX.md and read the full chapter`,
        `Ask Claude Opus to quiz you on "${t.title}" — answer everything without looking`,
        t.practiceTask,
        `Answer this interview question out loud (record): "${qs[p % qs.length]}"`,
        `Open ${t.oss === "Langfuse" ? "github.com/langfuse/langfuse" : "github.com/lightdash/lightdash"} → claim or progress 1 issue`,
        `Do 1 timed mock interview session on ${t.mock}`,
        `Find 10 roles on Wellfound/LinkedIn matching Node.js/TypeScript/PostgreSQL. Add 1 to your outreach queue.`,
        `Send 10 personalised founder emails using the outreach template`,
        `Log today's checklist in personal.buildora.work/roadmap`,
      ],
      checklist: [
        { id: `c_${globalDay}_1`, text: `📖 Read chapter: "${t.title}"`, done: false },
        { id: `c_${globalDay}_2`, text: `🛠️  Completed: ${t.practiceTask.split(".")[0]}`, done: false },
        { id: `c_${globalDay}_3`, text: `💬 Answered interview Q out loud: "${qs[p % qs.length]?.slice(0, 60)}..."`, done: false },
        { id: `c_${globalDay}_4`, text: `🐙 Progressed OSS: ${t.oss} (PR/issue/comment)`, done: false },
        { id: `c_${globalDay}_5`, text: `🤖 Completed mock interview on ${t.mock}`, done: false },
        { id: `c_${globalDay}_6`, text: `✉️  Sent 10 personalised outreach messages`, done: false },
        { id: `c_${globalDay}_7`, text: `🔍 Added 1 new role to job tracker`, done: false },
      ],
      notification: {
        time: "08:00",
        message: `🌅 Day ${globalDay}/78 — "${t.title}"${partLabel}\n🎯 Mission: ${t.mission.slice(0, 120)}...\n📖 study.buildora.work/${stackFolder} | 🤖 ${t.mock}`,
      },
      oSSProject: t.oss,
      mockInterviewPlatform: t.mock,
      founderOutreachTarget: t.outreach,
      resources: t.resources,
      ossRoadmap: OSS_ROADMAP.langfuse,
      outreachTemplates: OUTREACH_TEMPLATES,
      germanyChecklist: GERMANY_CHECKLIST,
    });

    todos.push({
      id: `t_100day_${globalDay}`,
      text: `[Day ${globalDay}] ${t.title}${partLabel}`,
      done: false,
      date: dateStr,
      priority: "P1",
      tag: "Goal",
      createdAt: Date.now() + globalDay,
    });

    globalDay++;
  }
}

// ─── Career command center data ───────────────────────────────────────────────
const careerData = {
  resumeAnalysis: {
    lastUpdated: new Date().toISOString(),
    strengths: [
      { item: "Founding Engineer at Docita", impact: "Extreme ownership signal — most senior engineers don't have this", fitScore: 10 },
      { item: "Multi-tenant SaaS + RLS + ABAC/RBAC", impact: "Top demand in EU SaaS; differentiates from 80% of applicants", fitScore: 10 },
      { item: "Transactional Outbox (Postgres-native, no Redis)", impact: "Rare pragmatic approach that signals maturity over trend-chasing", fitScore: 9 },
      { item: "GDPR/DSGVO field-level encryption", impact: "LEGAL REQUIREMENT for German employers — you have it in production", fitScore: 10 },
      { item: "AI features with kill-switches + spend caps", impact: "Every company is shipping AI — production-grade governance is rare", fitScore: 9 },
      { item: "30% latency reduction at MAQ", impact: "Quantified impact stands out in ATS and human review", fitScore: 8 },
      { item: "85%+ test coverage + 4 engineers mentored", impact: "Shows team multiplier ability — required for senior positions", fitScore: 8 },
    ],
    gaps: [
      { item: "No public OSS contributions visible on GitHub", action: "Start contributing to Langfuse or Lightdash THIS WEEK", urgency: "critical" },
      { item: "Kubernetes operational experience limited", action: "Study 40.2 deeply. Deploy to minikube. Run k8s scenarios on killer.sh", urgency: "high" },
      { item: "No published technical writing", action: "Write 2 blog posts: ABAC implementation + Transactional Outbox", urgency: "high" },
      { item: "German language at beginner level", action: "Enroll in Goethe Institut A1 online immediately. Show progress.", urgency: "medium" },
      { item: "LeetCode not prominently featured", action: "Solve NeetCode 150. Link your LeetCode profile prominently in CV.", urgency: "medium" },
    ],
  },
  targetRoles: {
    germany: [
      { company: "Personio", city: "Munich", role: "Senior Backend Engineer", fitScore: 9, salary: "€75K–€95K", link: "https://www.personio.com/careers/", status: "not_applied", notes: "B2B SaaS, NestJS + TS stack. Your Docita RLS + ABAC maps directly." },
      { company: "Doctolib", city: "Berlin", role: "Full Stack Engineer", fitScore: 10, salary: "€70K–€90K", link: "https://careers.doctolib.com/", status: "not_applied", notes: "HealthTech — DIRECT domain overlap with Docita. GDPR knowledge = essential." },
      { company: "SumUp", city: "Berlin", role: "Senior Software Engineer", fitScore: 9, salary: "€75K–€95K", link: "https://sumup.com/careers/", status: "not_applied", notes: "Payments SaaS. Your HMAC webhooks + Razorpay experience is relevant." },
      { company: "N26", city: "Berlin", role: "Senior Backend Engineer", fitScore: 8, salary: "€80K–€100K", link: "https://n26.com/en/careers", status: "not_applied", notes: "FinTech. Strong Postgres + auth + security background is the match." },
      { company: "Celonis", city: "Munich", role: "Senior Software Engineer", fitScore: 8, salary: "€80K–€105K", link: "https://www.celonis.com/careers/", status: "not_applied", notes: "Enterprise SaaS. Values architectural depth and data scale." },
      { company: "Taxfix", city: "Berlin", role: "Senior Full Stack Engineer", fitScore: 8, salary: "€70K–€90K", link: "https://taxfix.de/en/careers/", status: "not_applied", notes: "FinTech/legal SaaS. Multi-tenant + auth expertise is a match." },
      { company: "FlixBus", city: "Munich", role: "Backend Engineer", fitScore: 7, salary: "€65K–€85K", link: "https://www.flixbus.com/company/jobs", status: "not_applied", notes: "Reliability-driven platform engineering. Event-driven background helps." },
      { company: "Zalando", city: "Berlin", role: "Senior Software Engineer", fitScore: 7, salary: "€85K–€110K", link: "https://jobs.zalando.com/", status: "not_applied", notes: "Requires strong K8s + system design. Study 40.2 and 30.2 first." },
    ],
    remote: [
      { company: "Toptal", role: "Senior Full Stack Engineer", fitScore: 9, link: "https://www.toptal.com/developers/apply", status: "not_applied", notes: "Top 3% vetting. You will pass with 5 YOE + system design. Apply immediately." },
      { company: "Turing.com", role: "Senior Software Engineer", fitScore: 8, link: "https://developers.turing.com/", status: "not_applied", notes: "Silicon Valley remote. TS + Node + system design is the exact bar." },
      { company: "Langfuse", role: "Full Stack Engineer (OSS)", fitScore: 10, link: "https://langfuse.com/careers", status: "contributing_oss", notes: "Contribute PRs now → job offer later. Fastest path." },
      { company: "Lightdash", role: "Full Stack Engineer (OSS)", fitScore: 9, link: "https://lightdash.com/careers", status: "contributing_oss", notes: "Node.js + Postgres + React — direct stack match." },
      { company: "Deel", role: "Senior Software Engineer", fitScore: 8, link: "https://www.letsdeel.com/careers", status: "not_applied", notes: "Global remote-first. Heavy compliance — your GDPR knowledge is relevant." },
    ],
  },
  outreachTemplates: OUTREACH_TEMPLATES,
  germanyChecklist: GERMANY_CHECKLIST,
  ossRoadmap: OSS_ROADMAP,
  weeklyTargets: {
    studyHours: 14,
    leetcodeProblems: 10,
    outreachMessages: 50,
    ossPRs: 1,
    mockInterviews: 5,
    blogPosts: 0.5,
  },
};

// ─── Run ──────────────────────────────────────────────────────────────────────
async function run() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((u) => u.email === "cvamsik99@gmail.com");
  if (!user) throw new Error("User not found");
  const uid = user.id;
  console.log(`✅ User: ${uid}`);
  console.log(`📅 Days: ${days.length}`);

  // 1. Timetable
  const { error: e1 } = await supabase.from("tracker_data").upsert(
    { user_id: uid, key: "timetable_100_days", value: { days }, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (e1) throw e1;
  console.log("✅ timetable_100_days");

  // 2. Todos
  const { data: ex } = await supabase.from("tracker_data").select("value").eq("user_id", uid).eq("key", "todos").maybeSingle();
  const existing = (Array.isArray(ex?.value) ? ex!.value : []).filter((t: { id: string }) => !t.id.startsWith("t_100day_"));
  const { error: e2 } = await supabase.from("tracker_data").upsert(
    { user_id: uid, key: "todos", value: [...existing, ...todos], updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (e2) throw e2;
  console.log(`✅ todos (${todos.length} + ${existing.length} existing)`);

  // 3. Career data
  const { error: e3 } = await supabase.from("tracker_data").upsert(
    { user_id: uid, key: "career_command_center", value: careerData, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (e3) throw e3;
  console.log("✅ career_command_center");

  // 4. Telegram
  const msg = `🚀 *v2 Career Command Center Synced!*\n\n📅 ${days.length} days — each with:\n• Daily mission statement\n• Specific practice challenge\n• Interview question for the day\n• 7-item completion checklist\n• Curated resources\n• OSS roadmap + outreach templates\n• Germany checklist (10 steps)\n\n🎯 Resume gaps analysis saved\n🇩🇪 8 Germany roles + 5 remote roles with fit scores\n\n🔗 [Roadmap](https://personal.buildora.work/roadmap) | [Study](https://study.buildora.work)`;
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" }),
  });
  console.log("✅ Telegram");
  console.log("\n🎉 Done. Open https://personal.buildora.work/roadmap");
}

run().catch((e) => { console.error(e); process.exit(1); });
