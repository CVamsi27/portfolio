"use client";

import { useEffect, useRef, useState } from "react";
import { PROJECTS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  ArrowUpRight,
  Server,
  Shield,
  Layers,
  Activity,
  ExternalLink,
  Search,
  X,
  Gamepad2,
  Radio,
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
    categoryLabel: "Production SaaS",
    metrics: "25+ Clinics · 1,000+ Appts / Mo",
    highlights: [
      "Multi-tenant PostgreSQL Row-Level Security (RLS) & Deny-by-default ABAC",
      "Transactional outbox & background queues for guaranteed notifications and billing",
      "Zero-downtime database migrations with Prisma and tenant-scoped queries",
      "Full-stack end-to-end type safety with shared Zod schemas and TanStack Query",
    ],
  },
  "Senior Full Stack Bible": {
    category: "platforms",
    categoryLabel: "Knowledge Engine",
    metrics: "868 Files · 560 Chapters · 366k Lines",
    highlights: [
      "2 Terminal Interview Lanes: Abroad Full-Stack (EU/US Startups) & Indian SDE (FAANG)",
      "7 Deep Technical Stacks: Frontend, Backend, Architecture, Platform, Quality, Real-Time, Interview Toolkit",
      "All 23 GoF Design Patterns + 31 Production System Design Case Studies",
      "20 automated verification gates enforcing link health, schema depth, and zero-drift metrics",
    ],
  },
  TeamOps: {
    category: "platforms",
    categoryLabel: "Real-Time Platform",
    metrics: "WebSockets · Microservices",
    highlights: [
      "Low-latency real-time collaborative boards with presence broadcast",
      "Decoupled microservice architecture with NestJS and PostgreSQL",
    ],
  },
  "Digital Library": {
    category: "platforms",
    categoryLabel: "Full-Stack System",
    metrics: "tRPC · End-to-End Types",
    highlights: [
      "100% end-to-end type safety from database models to UI via tRPC",
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
  { id: "saas", label: "Production SaaS" },
  { id: "platforms", label: "Platforms & Distributed" },
  { id: "interactive", label: "Interactive & Creative" },
];

const Projects = () => {
  const [activeTab, setActiveTab] = useState<ProjectCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [archModalOpen, setArchModalOpen] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{ title: string; url: string } | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const flagshipProject = PROJECTS.find((p) => p.title === "Docita") ?? PROJECTS[0];

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
    if (activeTab !== "all" && PROJECT_EXTRAS[project.title]?.category !== activeTab) {
      return false;
    }
    if (selectedTech) {
      const techLower = selectedTech.toLowerCase();
      const projectTechMatch = project.tech.toLowerCase().includes(techLower);
      const highlightsMatch = PROJECT_EXTRAS[project.title]?.highlights?.some((h) =>
        h.toLowerCase().includes(techLower)
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
      const matchesCategory = PROJECT_EXTRAS[project.title]?.categoryLabel.toLowerCase().includes(q);
      const matchesHighlights = PROJECT_EXTRAS[project.title]?.highlights?.some((h) =>
        h.toLowerCase().includes(q)
      );
      if (!matchesTitle && !matchesDesc && !matchesTech && !matchesCategory && !matchesHighlights) {
        return false;
      }
    }
    return true;
  });

  const getCount = (id: ProjectCategory) =>
    id === "all"
      ? PROJECTS.length
      : PROJECTS.filter((p) => PROJECT_EXTRAS[p.title]?.category === id).length;

  // Keyboard navigation: left/right arrow keys between tabs
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
    <section id="Work" className="portfolio-section portfolio-work-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="01 / Featured Systems"
          title="Selected work"
          description="Production systems and engineered products, chosen for the operational problems they solve, their architectural resilience, and the lessons they carry into every new codebase."
        />

        {/* Flagship Showcase Card: Docita */}
        <Reveal delay={40} className="portfolio-flagship-card mb-10 sm:mb-16">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--portfolio-rule)] pb-4">
            <div className="flex items-center gap-2">
              <span className="portfolio-status-dot" aria-hidden="true" />
              <span className="font-utility text-xs font-bold tracking-wider uppercase text-[var(--portfolio-accent)]">
                Flagship Production System · Indian Healthcare
              </span>
            </div>
            <span className="portfolio-impact-pill">25+ Clinics Active</span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-display text-3xl font-bold tracking-tight text-[var(--portfolio-ink)] sm:text-4xl">
                  {flagshipProject.title}
                </h3>
                <span className="font-utility text-xs text-[var(--portfolio-muted)]">
                  Clinical Operating System
                </span>
              </div>

              <p className="mt-4 text-base leading-relaxed text-[var(--portfolio-muted)]">
                {flagshipProject.description.replace(/\.$/, "")}. Built to replace fragmented paper systems with a unified, high-security digital workflow handling patient demographics, real-time queues, clinical diagnoses, digital prescriptions, and multi-tier billing.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-start gap-2 text-xs text-[var(--portfolio-ink)]">
                  <Shield className="h-4 w-4 shrink-0 text-[var(--portfolio-accent)] mt-0.5" />
                  <span>PostgreSQL RLS & Deny-by-default ABAC</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-[var(--portfolio-ink)]">
                  <Server className="h-4 w-4 shrink-0 text-[var(--portfolio-accent)] mt-0.5" />
                  <span>Transactional Outbox & Queues</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-[var(--portfolio-ink)]">
                  <Layers className="h-4 w-4 shrink-0 text-[var(--portfolio-accent)] mt-0.5" />
                  <span>Sub-100ms NestJS & Prisma APIs</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-[var(--portfolio-ink)]">
                  <Activity className="h-4 w-4 shrink-0 text-[var(--portfolio-accent)] mt-0.5" />
                  <span>TanStack Query & Shared Zod Schemas</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-1.5">
                {flagshipProject.tech.split(", ").map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => setSelectedTech((prev) => (prev === tech ? null : tech))}
                    className={cn(
                      "portfolio-tag-pill cursor-pointer transition-all",
                      selectedTech === tech && "border-[var(--portfolio-accent)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)] font-semibold shadow-xs"
                    )}
                    title={`Filter projects by ${tech}`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 shadow-xs">
              <p className="portfolio-meta-label">System Specs & Impact</p>
              <div className="mt-4 space-y-3 border-b border-[var(--portfolio-rule)] pb-4">
                <div className="portfolio-flagship-spec-row flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Active Facilities:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">25+ Indian Clinics</span>
                </div>
                <div className="portfolio-flagship-spec-row flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Monthly Workflows:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">1,000+ Completed</span>
                </div>
                <div className="portfolio-flagship-spec-row flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Architecture:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">Multi-Tenant Scoped</span>
                </div>
                <div className="portfolio-flagship-spec-row flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Security:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">PHI-Safe Audit Logs</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewTarget({
                      title: "Docita · Healthcare OS",
                      url: "https://docita.work",
                    })
                  }
                  className="portfolio-primary-action w-full justify-center cursor-pointer"
                >
                  <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                  <span>Launch Live Preview Sandbox</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={flagshipProject.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] py-2 px-2.5 font-utility text-xs font-semibold text-[var(--portfolio-ink)] transition-all hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
                  >
                    <span>External Tab</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setArchModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] py-2 px-2.5 font-utility text-xs font-semibold text-[var(--portfolio-ink)] transition-all hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)] cursor-pointer shadow-xs"
                  >
                    <Layers className="h-3.5 w-3.5 text-[var(--portfolio-accent)]" />
                    <span>Architecture</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Filter Tabs and Search Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Filter projects by category"
            className="portfolio-filter-tabs flex gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none"
          >
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[i] = el; }}
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
                <span className={
                  activeTab === tab.id
                    ? "portfolio-filter-tab__count portfolio-filter-tab__count--active"
                    : "portfolio-filter-tab__count"
                }>
                  {getCount(tab.id)}
                </span>
              </button>
            ))}
          </div>

          {/* Instant Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portfolio-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tech or title..."
              aria-label="Search projects by title, description, or technology"
              className="w-full rounded-full border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] py-1.5 pl-8 pr-8 font-utility text-xs text-[var(--portfolio-ink)] placeholder:text-[var(--portfolio-muted)]/70 transition-all focus:border-[var(--portfolio-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--portfolio-accent)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--portfolio-muted)] hover:text-[var(--portfolio-accent)]"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(selectedTech || searchQuery) && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)]/50 p-2.5 text-xs">
            <span className="font-utility text-[0.65rem] font-bold uppercase tracking-wider text-[var(--portfolio-muted)]">
              Active Filters:
            </span>
            {selectedTech && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--portfolio-accent)]/40 bg-[var(--portfolio-paper)] px-2.5 py-0.5 font-utility text-[0.68rem] font-semibold text-[var(--portfolio-accent)] shadow-xs">
                Tech: {selectedTech}
                <button
                  type="button"
                  onClick={() => setSelectedTech(null)}
                  className="ml-1 hover:opacity-80"
                  aria-label="Remove technology filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--portfolio-accent)]/40 bg-[var(--portfolio-paper)] px-2.5 py-0.5 font-utility text-[0.68rem] font-semibold text-[var(--portfolio-accent)] shadow-xs">
                Query: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:opacity-80"
                  aria-label="Clear search query"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <span className="font-utility text-[0.68rem] text-[var(--portfolio-muted)]">
              ({filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""})
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedTech(null);
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="ml-auto font-utility text-[0.65rem] font-semibold text-[var(--portfolio-muted)] hover:text-[var(--portfolio-accent)] underline underline-offset-2"
            >
              Reset all
            </button>
          </div>
        )}

        {/* Project Catalog List */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] py-12 px-6 text-center">
            <p className="font-display text-lg font-bold text-[var(--portfolio-ink)]">
              No matching projects found
            </p>
            <p className="mt-1 text-xs text-[var(--portfolio-muted)]">
              No projects match the current search or technology filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTech(null);
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--portfolio-accent)] bg-[var(--portfolio-blue-soft)] px-4 py-1.5 font-utility text-xs font-semibold text-[var(--portfolio-accent)] transition-all hover:bg-[var(--portfolio-accent)] hover:text-white"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="portfolio-work-index" key={`${activeTab}-${selectedTech}-${searchQuery}`}>
            {filteredProjects.map((project, index) => {
              const extra = PROJECT_EXTRAS[project.title];
              return (
                <Reveal
                  key={project.title}
                  delay={(index % 3) * 60}
                  data-project-index={String(index + 1).padStart(2, "0")}
                  className={
                    project.title === "Docita"
                      ? "portfolio-work-row portfolio-work-row--lead"
                      : "portfolio-work-row"
                  }
                >
                  <div className="portfolio-work-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="portfolio-work-copy">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3>{project.title}</h3>
                        {extra?.categoryLabel ? (
                          <span className="portfolio-impact-pill">
                            {extra.categoryLabel}
                          </span>
                        ) : null}
                        {project.URL && !project.URL.includes("github.com") ? (
                          <span className="portfolio-work-live-badge">
                            <span className="portfolio-status-dot" aria-hidden="true" style={{ width: "0.4rem", height: "0.4rem" }} />
                            Live
                          </span>
                        ) : null}
                        {extra?.metrics ? (
                          <span className="font-utility text-xs text-[var(--portfolio-muted)]">
                            · {extra.metrics}
                          </span>
                        ) : null}
                      </div>

                      <a
                        href={project.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-end sm:self-auto text-[var(--portfolio-accent)] p-1 -mr-1"
                        aria-label={`Open ${project.title}`}
                      >
                        <ArrowUpRight className="portfolio-work-arrow h-5 w-5 shrink-0" />
                      </a>
                    </div>

                    <p>{project.description}</p>

                    {extra?.highlights?.length ? (
                      <ul className="mt-3.5 space-y-1.5 text-xs text-[var(--portfolio-muted)]">
                        {extra.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-[var(--portfolio-accent)] font-bold">›</span>
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
                          onClick={() => setSelectedTech((prev) => (prev === tech ? null : tech))}
                          className={cn(
                            "portfolio-tag-pill cursor-pointer transition-all",
                            selectedTech === tech && "border-[var(--portfolio-accent)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)] font-semibold shadow-xs"
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
                          className="inline-flex items-center gap-1.5 font-semibold text-[var(--portfolio-accent)] hover:underline cursor-pointer"
                        >
                          <Gamepad2 className="h-3.5 w-3.5" />
                          <span>Play Mini Game</span>
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
                            className="inline-flex items-center gap-1.5 font-semibold text-[var(--portfolio-accent)] hover:underline cursor-pointer"
                          >
                            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                            <span>Live Sandbox</span>
                          </button>

                          <a
                            href={project.URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold"
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
                          className="font-semibold"
                        >
                          <FontAwesomeIcon icon={faGithub} className="h-3.5 w-3.5" />
                          <span>View on GitHub</span>
                        </a>
                      )}

                      {project.gitLink && !project.URL.includes("github.com") ? (
                        <a
                          href={project.gitLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--portfolio-muted)] hover:text-[var(--portfolio-accent)]"
                        >
                          <FontAwesomeIcon icon={faGithub} className="h-3.5 w-3.5" />
                          <span>Source Code</span>
                        </a>
                      ) : null}
                    </div>
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

