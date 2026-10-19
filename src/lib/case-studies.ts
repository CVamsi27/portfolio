import { PROJECTS } from "@/lib/const";
import {
  patternById,
  PATTERN_LIBRARY_URL,
  type ArchitecturePattern,
} from "@/lib/architecture-patterns";

/**
 * Case studies for the seven portfolio projects. Every claim is assembled from
 * sources that already exist on the site — `const.ts` project copy, the
 * architecture showcase, the open-source repository cards and the experience
 * record — and deliberately avoids inventing metrics or outcomes.
 */
export interface CaseStudyLink {
  label: string;
  url: string;
}

export interface CaseStudy {
  slug: string;
  /** Title as it appears in `PROJECTS`; the page derives tech and links from it. */
  project: string;
  title: string;
  category: string;
  role: string;
  period?: string;
  summary: string;
  problem: string[];
  approach: string[];
  architecture: string[];
  verification: string;
  /** Related pattern ids resolved against the architecture pattern set. */
  patternIds: string[];
  references?: CaseStudyLink[];
}

export function projectSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function caseStudyHref(title: string): string {
  return `/work/${projectSlug(title)}`;
}

export function projectByTitle(title: string): (typeof PROJECTS)[number] | undefined {
  return PROJECTS.find((project) => project.title === title);
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "docita",
    project: "Docita",
    title: "Docita",
    category: "Healthcare SaaS",
    role: "Independent SaaS venture — built and maintained end to end",
    period: "Aug 2025 – Present",
    summary:
      "Independent healthcare SaaS: scheduling, patient records, prescriptions, billing and inventory on a TypeScript monorepo — built to replace fragmented paper workflows.",
    problem: [
      "Clinics run scheduling, prescriptions, diagnostics and billing across disconnected paper and spreadsheet records, with no single auditable trail.",
      "Healthcare data raises the bar: cross-tenant isolation, scoped role permissions, field encryption and sensitive-data audit logging have to be structural, not bolted on.",
      "Payments, notifications and document workflows must survive retries and partial failures without duplicate effects.",
    ],
    approach: [
      "Built the product end to end in a TypeScript monorepo — React/Vite clinical forms with shared Zod validation and TanStack Query server state on the front; NestJS, Prisma and PostgreSQL APIs behind.",
      "Modeled multi-tenancy with PostgreSQL Row-Level Security and deny-by-default ABAC resource policies, plus field encryption and sensitive-data audit logging.",
      "Made asynchronous work durable with PostgreSQL-backed background jobs and a transactional outbox with bounded retries and dead-letter replay; payment webhooks are HMAC-verified before they touch state.",
      "Instrumented an internal operational dashboard for clinic activity, API latency percentiles and error rates.",
    ],
    architecture: [
      "Multi-tenant PostgreSQL Row-Level Security (RLS) with deny-by-default ABAC",
      "Transactional outbox and background jobs with retries and recovery boundaries",
      "Prisma migrations and tenant-scoped transactional writes",
      "Full-stack end-to-end type safety with shared Zod schemas and TanStack Query",
    ],
    verification:
      "Clinical workflows are covered by Jest/Vitest/Playwright checks for API, worker and frontend changes. Concurrency and isolation behavior are treated as invariants that need evidence against a real database, so this page distinguishes implemented mechanisms from outcomes that still require external verification — payment settlement and lab interoperability among them.",
    patternIds: [
      "transactional-outbox",
      "rls-abac",
      "observer-sse",
      "state-machine",
      "distributed-lock",
    ],
  },
  {
    slug: "senior-full-stack-bible",
    project: "Senior Full Stack Bible",
    title: "Senior Full Stack Bible",
    category: "Knowledge Engine",
    role: "Author & maintainer — curriculum, examples and verification tooling",
    summary:
      "A 366,000-line engineering corpus and study engine for senior full-stack preparation — 868 reference files, 560 chapters and automated verification gates.",
    problem: [
      "Senior interview preparation is fragmented: scattered notes, outdated question lists, and no way to tell whether a guide is still correct.",
      "Reference material drifts — dead links, shallow topics and inconsistent structure compound across hundreds of chapters.",
    ],
    approach: [
      "Wrote and structured a 366,000-line corpus: 868 reference files and 560 study chapters across 7 technical stacks.",
      "Two terminal interview tracks: Abroad Full-Stack (EU/US startups) and Indian SDE (FAANG/Big Tech).",
      "All 23 Gang of Four design patterns implemented with production TypeScript and rationale, plus 31 production system design case studies.",
      "Enforced hygiene with 20 automated verification gates in Python — zero-drift metrics, schema depth, dead-link prevention and teaching-flow checks on every build.",
    ],
    architecture: [
      "868 reference files and 560 comprehensive study chapters across 7 technical stacks",
      "2 terminal interview tracks: Abroad Full-Stack (EU/US startups) and Indian SDE (FAANG/Big Tech)",
      "All 23 Gang of Four (GoF) design patterns implemented with production TypeScript and rationale",
      "20 automated verification gates in Python enforcing 0-drift metrics, schema depth, and dead-link prevention",
    ],
    verification:
      "Claims on this page come from the repository's own verification gates: structural checks, metric drift, dead links and teaching-flow verification all run in CI, so the corpus is checked rather than promised.",
    patternIds: [],
    references: [
      { label: "Explore all 23 patterns in the Bible", url: PATTERN_LIBRARY_URL },
    ],
  },
  {
    slug: "teamops",
    project: "TeamOps",
    title: "TeamOps",
    category: "Real-Time Platform",
    role: "Designed & built — real-time collaboration engine",
    summary:
      "Real-time collaboration platform: WebSocket task synchronization across clients on decoupled NestJS microservices with PostgreSQL persistence.",
    problem: [
      "Teams coordinating live work need task state that converges across clients without polling or manual refreshes.",
      "Real-time systems lose events at the edges — disconnects, retries and multi-instance deployments all threaten message delivery.",
    ],
    approach: [
      "Low-latency collaborative boards broadcast task mutations over a WebSocket event bus, with presence updates for concurrent clients.",
      "The backend is split into decoupled NestJS microservices with PostgreSQL persistence and Prisma modeling, so broadcasting and data concerns evolve separately.",
      "A transactional outbox prevents message loss during network disconnects; multi-tenant isolation and RBAC guard shared workspaces.",
    ],
    architecture: [
      "Decoupled WebSocket event bus broadcasting task mutations with sub-50ms latency",
      "Transactional outbox pattern preventing message loss during network disconnects",
      "Multi-tenant PostgreSQL isolation with Prisma ORM data modeling",
      "Authentication and RBAC permissions for shared workspaces",
    ],
    verification:
      "The interesting failures in real-time collaboration are at the edges: disconnects, retries and duplicate delivery. The outbox and idempotency handling exist so that only committed state is broadcast — the happy path does not depend on them.",
    patternIds: ["observer-sse", "transactional-outbox"],
  },
  {
    slug: "super-tic-tac-toe",
    project: "Super Tic Tac Toe",
    title: "Super Tic Tac Toe",
    category: "Game Engine",
    role: "Designed & built — algorithmic game",
    summary:
      "Strategic 9-board Tic Tac Toe with recursive win conditions, a depth-first Minimax AI with alpha-beta pruning, and mobile-optimized touch mechanics.",
    problem: [
      "Nested 9-board Tic Tac Toe is tactically deep — naive move trees explode and flat heuristics produce unconvincing opponents.",
      "Touch games live or die on input latency and clarity, not just rules.",
    ],
    approach: [
      "A recursive 9-board game engine with dynamic win-condition evaluation and a zero-dependency game state machine.",
      "Depth-first Minimax search with alpha-beta pruning and evaluation heuristics: unbeatable in the classic 3x3 mode and tactically evaluated on nested boards.",
      "Clean separation between the algorithmic game loop and the presentation layer, with touch interactions tuned for high-refresh mobile viewports.",
    ],
    architecture: [
      "State-space search exploring game trees with evaluation heuristics",
      "Unbeatable AI in 3x3 mode and tactical evaluation for 9-grid nested boards",
      "Low-latency touch interactions for high-refresh mobile viewports",
      "Clean separation between algorithmic game loop and presentation layer",
    ],
    verification:
      "Claims stay scoped: perfect play is claimed for the classic 3x3 mode, where Minimax is exhaustive; nested-board play is tactically evaluated rather than claimed perfect, and the game's copy says exactly that.",
    patternIds: [],
  },
  {
    slug: "digital-library",
    project: "Digital Library",
    title: "Digital Library",
    category: "Full-Stack System",
    role: "Designed & built — end-to-end type safety study",
    summary:
      "A full-stack bookstore with end-to-end type safety from database schema to UI — tRPC contracts, Zod validation and relational queries via Prisma.",
    problem: [
      "Every layer boundary is a place for types to drift — especially between a client, an API and a database schema.",
      "Runtime input is untrusted even in a demo: contracts need validation, not assertions.",
    ],
    approach: [
      "End-to-end type sharing across the network boundary with tRPC contracts — no code generation step.",
      "Runtime schema parsing with Zod for strict input validation at the edges.",
      "Optimistic UI mutations with TanStack Query caching and invalidation, on relational queries and migrations with Prisma and PostgreSQL.",
    ],
    architecture: [
      "Zero-code-gen type sharing across the network boundary using tRPC contracts",
      "Runtime schema parsing with Zod ensuring strict input validation",
      "Optimistic UI mutations with TanStack Query caching and invalidation",
      "Relational querying and migrations with Prisma on PostgreSQL",
    ],
    verification:
      "Type safety is compile-time by construction; anything crossing the network is parsed with Zod at runtime, so malformed input fails as a validation error rather than undefined behavior.",
    patternIds: [],
  },
  {
    slug: "task-manager",
    project: "Task Manager",
    title: "Task Manager",
    category: "Productivity System",
    role: "Designed & built — workflow-driven Kanban",
    summary:
      "State-driven Kanban with enforced workflow transitions, accessible drag-and-drop and full relational persistence via Prisma and PostgreSQL.",
    problem: [
      "Kanban state transitions invite invalid jumps — everything drags into everything and the workflow stops meaning anything.",
      "Drag and drop must also work for keyboard and touch users, not just the mouse.",
    ],
    approach: [
      "A state-driven pipeline validates movement against the workflow rules rather than allowing free-form reordering.",
      "Accessible drag-and-drop mechanics with responsive UI feedback.",
      "Full relational persistence via Prisma and PostgreSQL.",
    ],
    architecture: [
      "State-driven Kanban pipeline with automated workflow transitions",
      "Accessible drag-and-drop mechanics with responsive UI feedback",
      "Relational persistence via Prisma and PostgreSQL",
    ],
    verification:
      "Movement is validated centrally, so the same rules reject an invalid drop everywhere rather than per-view logic — the board's behavior is testable at one seam.",
    patternIds: [],
  },
  {
    slug: "portfolio",
    project: "Portfolio",
    title: "Portfolio & Personal OS",
    category: "Editorial & OS",
    role: "Designed & built — this website",
    summary:
      "The site you are on: an editorial portfolio and a personal operating system served from one repository with host-based edge routing.",
    problem: [
      "One repository must serve two surfaces with different audiences: a public portfolio and a private personal workspace — without leaking the private side.",
      "Both surfaces need the same design-system rigor, and the public one has to stay fast and legible.",
    ],
    approach: [
      "Host-based edge routing in a single Next.js app: the public host serves the portfolio and redirects every other path home; the workspace host is allowlist-gated.",
      "An editorial design system with fluid typography and full light/dark fidelity, shared across both surfaces.",
      "PWA support and a command palette that reaches every destination without a navigation wall.",
      "Project case studies (this page) keep the overview tight by moving per-project depth onto its own routes.",
    ],
    architecture: [
      "Host-based edge routing proxy serving both portfolio and personal operating system",
      "Editorial design system with fluid typography and dark/light theme fidelity",
      "Public-host redirect rule that admits only the portfolio entry points and /work/*",
    ],
    verification:
      "The routing boundary is covered by end-to-end host tests: public hosts redirect every path except the portfolio entry points and /work/*, and the workspace host stays allowlist-gated. This case study is served by the same rule it describes.",
    patternIds: [],
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}

export function caseStudyNeighbours(slug: string): {
  previous: CaseStudy;
  next: CaseStudy;
} {
  const index = CASE_STUDIES.findIndex((study) => study.slug === slug);
  const count = CASE_STUDIES.length;
  const safeIndex = index === -1 ? 0 : index;
  return {
    previous: CASE_STUDIES[(safeIndex - 1 + count) % count],
    next: CASE_STUDIES[(safeIndex + 1) % count],
  };
}

export interface CaseStudyPatternLink {
  name: string;
  url: string;
}

export function caseStudyPatterns(study: CaseStudy): CaseStudyPatternLink[] {
  return study.patternIds
    .map((id) => patternById(id))
    .filter((pattern): pattern is ArchitecturePattern => Boolean(pattern))
    .map((pattern) => ({ name: pattern.name, url: pattern.stackUrl }));
}
