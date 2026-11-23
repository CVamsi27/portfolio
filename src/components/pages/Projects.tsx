"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PROJECTS } from "@/lib/const";
import { caseStudyHref, projectSlug } from "@/lib/case-studies";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  ArrowUpRight,
  ExternalLink,
  Search,
  X,
  Gamepad2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DocitaArchitectureModal from "@/components/DocitaArchitectureModal";
import SuperTicTacToeModal from "@/components/SuperTicTacToeModal";
import LivePreviewModal from "@/components/LivePreviewModal";

type ProjectCategory = "all" | "saas" | "platforms" | "interactive";

const PROJECT_EXTRAS: Record<
  string,
  {
    category: ProjectCategory;
    categoryLabel: string;
    metrics?: string;
    highlights?: string[];
  }
> = {
  Docita: {
    category: "saas",
    categoryLabel: "Healthcare SaaS",
    metrics: "5 Core Clinical Workflows",
    highlights: [
      "Clinic-scoped authorization and configurable PostgreSQL RLS policies",
      "Selected transactional outbox events; jobs with bounded retries and manual recovery",
      "Prisma migrations and tenant-scoped transactional writes",
      "Shared Zod contracts, runtime validation and TanStack Query server state",
    ],
  },
  "RLS Rehearsal": {
    category: "platforms",
    categoryLabel: "Security & Isolation",
    metrics: "PostgreSQL RLS · CI Gate",
    highlights: [
      "Executable two-tenant PostgreSQL Row-Level Security harness, CLI, and GitHub Action",
      "Mandatory failing control pass disables RLS in a disposable DB to prove the check catches leaks",
      "Safety guards refuse privileged or remote targets; emits JSON, Markdown, and JUnit reports",
    ],
  },
  Retryglass: {
    category: "platforms",
    categoryLabel: "Queue Reliability",
    metrics: "BullMQ · Crash-Point Sweep",
    highlights: [
      "Sweeps crash points before and after external effect boundaries in local BullMQ workers",
      "Distinguishes duplicate side effects from silently lost jobs using idempotency keys",
      "Emits reproducible Vitest regression cases that stay red until the handler is fixed",
    ],
  },
  "Developer Pain Lab": {
    category: "platforms",
    categoryLabel: "Verification Suite",
    metrics: "Deploy · Rollout · Revoke",
    highlights: [
      "Executable failure-path verification suite combining Retryglass, Deployproof, Rolloutproof, and Revokeproof",
      "Catches packaging leaks, unsafe PostgreSQL rollback paths, and lingering revoked sessions",
    ],
  },
  "Senior Full Stack Bible": {
    category: "platforms",
    categoryLabel: "Engineering Reference",
    metrics: "Mechanisms · Revision · Practice",
    highlights: [
      "2 Terminal Interview Lanes: Abroad Full-Stack (EU/US Startups) & Indian SDE (FAANG)",
      "7 Deep Technical Stacks: Frontend, Backend, Architecture, Platform, Quality, Real-Time, Interview Toolkit",
      "All 23 GoF Design Patterns + 31 Production System Design Case Studies",
      "Automated structure, link, freshness and teaching-flow checks",
    ],
  },
  TeamOps: {
    category: "platforms",
    categoryLabel: "Real-Time Platform",
    metrics: "WebSockets · Microservices",
    highlights: [
      "Real-time collaborative boards with presence broadcast",
      "Decoupled microservice architecture with NestJS and PostgreSQL",
    ],
  },
  "Digital Library": {
    category: "platforms",
    categoryLabel: "Full-Stack System",
    metrics: "tRPC · End-to-End Types",
    highlights: [
      "Shared tRPC types from server contracts to UI, plus runtime validation",
      "Zod contract validation and relational query optimization with Prisma",
    ],
  },
  "Task Manager": {
    category: "platforms",
    categoryLabel: "Productivity System",
    metrics: "Next.js · Prisma",
    highlights: [
      "State-driven Kanban pipeline with automated workflow transitions",
      "Accessible drag-and-drop mechanics with responsive UI feedback",
    ],
  },
  "Super Tic Tac Toe": {
    category: "interactive",
    categoryLabel: "Game Engine",
    metrics: "Strategic Minimax Logic",
    highlights: [
      "Recursive 9-board game engine with dynamic win-condition evaluation",
      "Mobile-optimized touch interactions and zero-dependency game state machine",
    ],
  },
  Portfolio: {
    category: "interactive",
    categoryLabel: "Editorial & OS",
    metrics: "Next.js 16 · Edge Routing",
    highlights: [
      "Host-based edge routing proxy serving both portfolio and personal operating system",
      "Editorial design system with fluid typography and dark/light theme fidelity",
    ],
  },
};

const TABS: { id: ProjectCategory; label: string }[] = [
  { id: "all", label: "All Systems" },
  { id: "saas", label: "Healthcare SaaS" },
  { id: "platforms", label: "Platforms & Distributed" },
  { id: "interactive", label: "Interactive" },
];

const Projects = () => {
  const [activeTab, setActiveTab] = useState<ProjectCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [archModalOpen, setArchModalOpen] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{
    title: string;
    url: string;
  } | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const flagshipProject =
    PROJECTS.find((p) => p.title === "Docita") ?? PROJECTS[0];

  useEffect(() => {
    const onFilterTech = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedTech(customEvent.detail);
        setActiveTab("all");
        setSearchQuery("");
      }
    };
    const onPlayGame = () => setGameModalOpen(true);

    window.addEventListener("portfolio-filter-tech", onFilterTech);
    window.addEventListener("portfolio-play-game", onPlayGame);

    return () => {
      window.removeEventListener("portfolio-filter-tech", onFilterTech);
      window.removeEventListener("portfolio-play-game", onPlayGame);
    };
  }, []);

  const filteredProjects = PROJECTS.filter((project) => {
    if (
      activeTab !== "all" &&
      PROJECT_EXTRAS[project.title]?.category !== activeTab
    ) {
      return false;
    }
    if (selectedTech) {
      const techLower = selectedTech.toLowerCase();
      const projectTechMatch = project.tech.toLowerCase().includes(techLower);
      const highlightsMatch = PROJECT_EXTRAS[project.title]?.highlights?.some(
        (h) => h.toLowerCase().includes(techLower),
      );
      if (!projectTechMatch && !highlightsMatch) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = project.title.toLowerCase().includes(q);
      const matchesDesc = project.description.toLowerCase().includes(q);
      const matchesTech = project.tech.toLowerCase().includes(q);
      const matchesCategory = PROJECT_EXTRAS[project.title]?.categoryLabel
        .toLowerCase()
        .includes(q);
      const matchesHighlights = PROJECT_EXTRAS[project.title]?.highlights?.some(
        (h) => h.toLowerCase().includes(q),
      );
      if (
        !matchesTitle &&
        !matchesDesc &&
        !matchesTech &&
        !matchesCategory &&
        !matchesHighlights
      ) {
        return false;
      }
    }
    return true;
  });

  const getCount = (id: ProjectCategory) =>
    id === "all"
      ? PROJECTS.length
      : PROJECTS.filter((p) => PROJECT_EXTRAS[p.title]?.category === id).length;

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      const next = (index + 1) % TABS.length;
      tabRefs.current[next]?.focus();
      setActiveTab(TABS[next].id);
    } else if (e.key === "ArrowLeft") {
      const prev = (index - 1 + TABS.length) % TABS.length;
      tabRefs.current[prev]?.focus();
      setActiveTab(TABS[prev].id);
    }
  };

  return (
    <section
      id="Work"
      className="portfolio-section portfolio-work-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="01 // Featured Systems"
          title="Selected work"
          description="Production systems and engineered products, chosen for the operational problems they solve, their architectural resilience, and the lessons they carry into every codebase."
        />

        {/* Flagship Architectural Dossier: Docita (No glowing dots, no red side stripe) */}
        <Reveal delay={40} className="portfolio-flagship-card mb-14">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--portfolio-rule)] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--portfolio-muted)]">
              Flagship Production System · Healthcare SaaS
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]">
              Clinic Workflow OS
            </span>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-display text-4xl font-light leading-none tracking-[-0.03em] text-[var(--portfolio-ink)] sm:text-5xl">
                  {flagshipProject.title}
                </h3>
                <span className="font-sans text-xs font-medium text-[var(--portfolio-muted)]">
                  Clinical Operating System
                </span>
              </div>

              <p className="mt-5 font-sans text-sm leading-relaxed text-[var(--portfolio-muted)] sm:text-base sm:leading-[1.75]">
                {flagshipProject.description.replace(/\.$/, "")}. Built to
                replace fragmented paper workflows with a tenant-isolated
                clinical platform handling patient records, live queues,
                diagnoses, digital prescriptions, and multi-tier billing.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-4 border-t border-[var(--portfolio-rule)] pt-6 sm:grid-cols-2">
                {[
                  [
                    "01",
                    "Tenant Isolation",
                    "PostgreSQL RLS & deny-by-default ABAC",
                  ],
                  [
                    "02",
                    "Durable Delivery",
                    "Transactional outbox & bounded-retry queues",
                  ],
                  [
                    "03",
                    "Typed Backend",
                    "NestJS modular services & Prisma migrations",
                  ],
                  [
                    "04",
                    "Client State",
                    "TanStack Query & shared Zod contract validation",
                  ],
                ].map(([num, title, desc]) => (
                  <div key={num} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-[var(--portfolio-muted)]">
                        {num}
                      </span>
                      <span className="font-sans text-xs font-semibold text-[var(--portfolio-ink)]">
                        {title}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-[var(--portfolio-muted)]">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-1.5">
                {flagshipProject.tech.split(", ").map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() =>
                      setSelectedTech((prev) => (prev === tech ? null : tech))
                    }
                    className={cn(
                      "portfolio-tag-pill cursor-pointer",
                      selectedTech === tech &&
                        "!border-[var(--portfolio-ink)] !bg-[var(--portfolio-ink)] !text-[var(--portfolio-paper)]",
                    )}
                    title={`Filter projects by ${tech}`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6">
              <p className="portfolio-meta-label">Specification &amp; Scope</p>
              <div className="mt-4 divide-y divide-[var(--portfolio-rule)] border-y border-[var(--portfolio-rule)]">
                {[
                  ["Product scope", "5 Clinical workflows"],
                  ["Telemetry", "Activity & request traces"],
                  ["Architecture", "Multi-tenant isolated"],
                  ["Security", "RLS + audit logging"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between py-2.5 font-sans text-xs"
                  >
                    <span className="text-[var(--portfolio-muted)]">{k}</span>
                    <span className="font-medium text-[var(--portfolio-ink)]">
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewTarget({
                      title: "Docita · Healthcare OS",
                      url: "https://docita.work",
                    })
                  }
                  className="portfolio-primary-action w-full cursor-pointer"
                >
                  <span>Launch live preview</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={flagshipProject.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-secondary-action min-h-10 px-3 py-2 text-xs"
                  >
                    <span>Open site</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setArchModalOpen(true)}
                    className="portfolio-secondary-action min-h-10 cursor-pointer px-3 py-2 text-xs"
                  >
                    <span>Architecture</span>
                  </button>

                  <Link
                    href={caseStudyHref(flagshipProject.title)}
                    aria-label={`Read the ${flagshipProject.title} case study`}
                    className="portfolio-secondary-action col-span-2 min-h-10 px-3 py-2 text-xs"
                  >
                    <span>Read the {flagshipProject.title} case study</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Clean Underline Filter Tabs & Search Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div
            role="tablist"
            aria-label="Filter projects by category"
            className="portfolio-filter-tabs flex-1"
          >
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
                className={
                  activeTab === tab.id
                    ? "portfolio-filter-tab is-active"
                    : "portfolio-filter-tab"
                }
              >
                <span>{tab.label}</span>
                <span
                  className={
                    activeTab === tab.id
                      ? "portfolio-filter-tab__count portfolio-filter-tab__count--active"
                      : "portfolio-filter-tab__count"
                  }
                >
                  {getCount(tab.id)}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portfolio-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tech or title..."
              aria-label="Search projects by title, description, or technology"
              className="h-10 w-full rounded-full border border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] pl-9 pr-8 font-sans text-xs text-[var(--portfolio-ink)] placeholder:text-[var(--portfolio-muted)]/70 focus:border-[var(--portfolio-ink)] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Strip */}
        {(selectedTech || searchQuery) && (
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--portfolio-rule)] pb-4 font-sans text-xs">
            <span className="text-[var(--portfolio-muted)]">Filtered by:</span>
            {selectedTech && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--portfolio-ink)] bg-[var(--portfolio-ink)] px-3 py-0.5 text-[var(--portfolio-paper)]">
                {selectedTech}
                <button
                  type="button"
                  onClick={() => setSelectedTech(null)}
                  aria-label="Remove technology filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--portfolio-ink)] bg-[var(--portfolio-ink)] px-3 py-0.5 text-[var(--portfolio-paper)]">
                &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <span className="text-[var(--portfolio-muted)]">
              ({filteredProjects.length} result
              {filteredProjects.length !== 1 ? "s" : ""})
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedTech(null);
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="ml-auto cursor-pointer font-medium text-[var(--portfolio-ink)] underline underline-offset-4"
            >
              Reset all
            </button>
          </div>
        )}

        {/* 10-Row Open Editorial Index */}
        {filteredProjects.length === 0 ? (
          <div className="border-y border-[var(--portfolio-rule)] py-14 text-center">
            <p className="font-display text-2xl font-light text-[var(--portfolio-ink)]">
              No matching systems found
            </p>
            <p className="mt-1 font-sans text-xs text-[var(--portfolio-muted)]">
              No projects match the active search or technology filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTech(null);
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="portfolio-secondary-action mt-5 cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div
            className="portfolio-work-index"
            key={`${activeTab}-${selectedTech}-${searchQuery}`}
          >
            {filteredProjects.map((project, index) => {
              const extra = PROJECT_EXTRAS[project.title];
              return (
                <Reveal
                  key={project.title}
                  delay={(index % 3) * 35}
                  data-project-index={String(index + 1).padStart(2, "0")}
                  className="portfolio-work-row"
                >
                  <div className="portfolio-work-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="portfolio-work-copy min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h3>{project.title}</h3>
                        {extra?.categoryLabel ? (
                          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-muted)]">
                            {extra.categoryLabel}
                          </span>
                        ) : null}
                        {extra?.metrics ? (
                          <span className="font-sans text-xs text-[var(--portfolio-muted)]">
                            · {extra.metrics}
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={caseStudyHref(project.title)}
                        data-case-study-link={projectSlug(project.title)}
                        className="inline-flex shrink-0 items-center gap-1 border-b border-transparent pb-0.5 font-sans text-xs font-medium text-[var(--portfolio-ink)] transition-colors hover:border-[var(--portfolio-ink)]"
                        aria-label={`${project.title} case study`}
                      >
                        <span>Case study</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <p>{project.description}</p>

                    <details
                      data-project-details
                      className="portfolio-work-details mt-4"
                    >
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-muted)] transition-colors hover:text-[var(--portfolio-ink)]">
                        <ChevronDown
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        <span>Engineering decisions</span>
                      </summary>
                      <div className="mt-4 border-t border-[var(--portfolio-rule)] pt-4">
                        {extra?.highlights?.length ? (
                          <ul className="space-y-1.5 font-sans text-xs text-[var(--portfolio-muted)]">
                            {extra.highlights.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="text-[var(--portfolio-ink)]">
                                  —
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        <div className="portfolio-tag-list">
                          {project.tech.split(", ").map((tech) => (
                            <button
                              key={tech}
                              type="button"
                              onClick={() =>
                                setSelectedTech((prev) =>
                                  prev === tech ? null : tech,
                                )
                              }
                              className={cn(
                                "portfolio-tag-pill cursor-pointer",
                                selectedTech === tech &&
                                  "!border-[var(--portfolio-ink)] !bg-[var(--portfolio-ink)] !text-[var(--portfolio-paper)]",
                              )}
                              title={`Filter projects by ${tech}`}
                            >
                              {tech}
                            </button>
                          ))}
                        </div>

                        <div className="portfolio-work-links">
                          {project.title === "Super Tic Tac Toe" ? (
                            <button
                              type="button"
                              onClick={() => setGameModalOpen(true)}
                              className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-ink)] hover:underline"
                            >
                              <Gamepad2 className="h-3.5 w-3.5" />
                              <span>Play mini game</span>
                            </button>
                          ) : null}

                          {project.URL && !project.URL.includes("github.com") ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewTarget({
                                    title: project.title,
                                    url: project.URL,
                                  })
                                }
                                className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-ink)] hover:underline"
                              >
                                <span>Live sandbox</span>
                              </button>

                              <a
                                href={project.URL}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span>Live site</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </>
                          ) : (
                            <a
                              href={project.URL}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FontAwesomeIcon
                                icon={faGithub}
                                className="h-3.5 w-3.5"
                              />
                              <span>View on GitHub</span>
                            </a>
                          )}

                          {project.gitLink &&
                          !project.URL.includes("github.com") ? (
                            <a
                              href={project.gitLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="!text-[var(--portfolio-muted)] hover:!text-[var(--portfolio-ink)]"
                            >
                              <FontAwesomeIcon
                                icon={faGithub}
                                className="h-3.5 w-3.5"
                              />
                              <span>Source code</span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </details>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      <DocitaArchitectureModal
        open={archModalOpen}
        onClose={() => setArchModalOpen(false)}
      />

      <SuperTicTacToeModal
        open={gameModalOpen}
        onClose={() => setGameModalOpen(false)}
      />

      {previewTarget && (
        <LivePreviewModal
          open={Boolean(previewTarget)}
          title={previewTarget.title}
          url={previewTarget.url}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </section>
  );
};

export default Projects;
