"use client";

import { useState } from "react";
import { PROJECTS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  ArrowUpRight,
  Sparkles,
  Server,
  Shield,
  Layers,
  Activity,
  ExternalLink,
} from "lucide-react";

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

const Projects = () => {
  const [activeTab, setActiveTab] = useState<ProjectCategory>("all");

  const flagshipProject = PROJECTS.find((p) => p.title === "Docita") ?? PROJECTS[0];

  const filteredProjects =
    activeTab === "all"
      ? PROJECTS
      : PROJECTS.filter((p) => PROJECT_EXTRAS[p.title]?.category === activeTab);

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
                {flagshipProject.description}. Built to replace fragmented paper systems with a unified, high-security digital workflow handling patient demographics, real-time queues, clinical diagnoses, digital prescriptions, and multi-tier billing.
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
                  <span key={tech} className="portfolio-tag-pill">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 shadow-xs">
              <p className="portfolio-meta-label">System Specs & Impact</p>
              <div className="mt-4 space-y-3 border-b border-[var(--portfolio-rule)] pb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Active Facilities:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">25+ Indian Clinics</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Monthly Workflows:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">1,000+ Completed</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Architecture:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">Multi-Tenant Scoped</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--portfolio-muted)]">Security:</span>
                  <span className="font-semibold text-[var(--portfolio-ink)]">PHI-Safe Audit Logs</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={flagshipProject.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-primary-action w-full justify-center"
                >
                  <span>Launch Live Platform</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Filter Tabs */}
        <div className="portfolio-filter-tabs flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
          {[
            { id: "all", label: `All Systems (${PROJECTS.length})` },
            { id: "saas", label: "Production SaaS" },
            { id: "platforms", label: "Platforms & Distributed" },
            { id: "interactive", label: "Interactive & Creative" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ProjectCategory)}
              className={
                activeTab === tab.id
                  ? "portfolio-filter-tab is-active"
                  : "portfolio-filter-tab"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Project Catalog List */}
        <div className="portfolio-work-index">
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
                      <span key={tech} className="portfolio-tag-pill">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="portfolio-work-links">
                    <a
                      href={project.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold"
                    >
                      <span>Live project</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    {project.gitLink ? (
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
      </div>
    </section>
  );
};

export default Projects;

