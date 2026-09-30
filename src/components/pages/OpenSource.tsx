"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  ArrowUpRight,
  BookOpen,
  GitBranch,
  GitCommit,
  GitFork,
  Globe,
  Radio,
  ShieldCheck,
  Star,
  Terminal,
  Zap,
} from "lucide-react";
import LivePreviewModal from "@/components/LivePreviewModal";
import { cn } from "@/lib/utils";

interface RepoItem {
  id: string;
  name: string;
  repo: string;
  description: string;
  highlights: string[];
  metrics: string;
  tech: string[];
  githubUrl: string;
  liveUrl?: string;
  featured?: boolean;
}

const REPOSITORIES: RepoItem[] = [
  {
    id: "software-developer-bible",
    name: "Senior Full Stack Bible",
    repo: "CVamsi27/software-developer-bible",
    description:
      "A 366,000-line engineering corpus and study engine designed for senior full-stack and systems engineering preparation.",
    highlights: [
      "868 reference files and 560 comprehensive study chapters across 7 technical stacks",
      "2 terminal interview tracks: Abroad Full-Stack (EU/US startups) and Indian SDE (FAANG/Big Tech)",
      "All 23 Gang of Four (GoF) design patterns implemented with production TypeScript and rationale",
      "20 automated verification gates in Python enforcing 0-drift metrics, schema depth, and dead-link prevention",
    ],
    metrics: "868 Files · 560 Chapters · 366k Lines · 20 Gates",
    tech: ["TypeScript", "Python", "Cloudflare Pages", "Jekyll", "AST Parsers"],
    githubUrl: "https://github.com/CVamsi27/software-developer-bible",
    liveUrl: "https://study.buildora.work",
    featured: true,
  },
  {
    id: "teamops",
    name: "TeamOps Collaborative Engine",
    repo: "CVamsi27/teamops",
    description:
      "Real-time task synchronization engine and microservices architecture supporting live multi-client coordination.",
    highlights: [
      "Decoupled WebSocket event bus broadcasting task mutations with sub-50ms latency",
      "Transactional outbox pattern preventing message loss during network disconnects",
      "Multi-tenant PostgreSQL isolation with Prisma ORM data modeling",
      "Production-ready authentication and RBAC permissions",
    ],
    metrics: "WebSockets · NestJS Microservices · Real-Time Canvas",
    tech: ["Next.js 15", "NestJS", "TypeScript", "PostgreSQL", "Prisma"],
    githubUrl: "https://github.com/CVamsi27/teamops",
    liveUrl: "https://teamops.buildora.work/",
  },
  {
    id: "super-tic-tac-toe",
    name: "Super Tic Tac Toe & Minimax AI",
    repo: "CVamsi27/super-tic-tac-toe",
    description:
      "Strategic 9-board nested Tic Tac Toe featuring a recursive depth-first Minimax AI engine with alpha-beta pruning.",
    highlights: [
      "State-space search exploring game trees with evaluation heuristics",
      "Unbeatable AI in 3x3 mode and tactical evaluation for 9-grid nested boards",
      "Zero-latency touch interactions optimized for 120Hz mobile viewports",
      "Clean separation between algorithmic game loop and presentation layer",
    ],
    metrics: "Game Tree Algorithm · Minimax AI · 120Hz Haptics",
    tech: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    githubUrl: "https://github.com/CVamsi27/super-tic-tac-toe",
    liveUrl: "https://super-tic-tac-toe.buildora.work/",
  },
  {
    id: "digital-library",
    name: "Digital Library Type-Safe Contracts",
    repo: "CVamsi27/digital-library",
    description:
      "Full-stack bookstore with end-to-end type safety spanning client requests, API routes, and database schema.",
    highlights: [
      "Zero-code-gen type sharing across network boundary using tRPC contracts",
      "Runtime schema parsing with Zod ensuring strict input validation",
      "Optimistic UI mutations with TanStack Query caching and invalidation",
      "Relational querying and migrations with Prisma on PostgreSQL",
    ],
    metrics: "End-to-End Type Safety · tRPC · Zod · PostgreSQL",
    tech: ["React", "Next.js", "TypeScript", "tRPC", "Zod", "Prisma"],
    githubUrl: "https://github.com/CVamsi27/digital-library",
    liveUrl: "https://digital-library.buildora.work/",
  },
];

const CONTRIBUTION_TRACKS = [
  {
    project: "Langfuse",
    scope: "LLM Observability & Evaluation",
    description: "Open-source LLM engineering platform. Track prompt latency, evaluation metrics, and tracing integrations in TypeScript.",
    url: "https://github.com/langfuse/langfuse",
    tag: "AI Engineering & Observability",
  },
  {
    project: "Lightdash",
    scope: "Business Intelligence Semantic Layer",
    description: "Open-source BI on dbt. Community discussions on metric definition schemas and semantic layer query performance.",
    url: "https://github.com/lightdash/lightdash",
    tag: "Data Platforms",
  },
];

export default function OpenSource() {
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    url: string;
  } | null>(null);

  return (
    <section
      id="OpenSource"
      aria-label="Open Source Contributions and Public Engineering"
      data-chapter-index="03"
      className="portfolio-chapter relative px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
    >
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--portfolio-accent)] uppercase tracking-widest">
                  03 / OPEN SOURCE &amp; COMMUNITY WORK
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--portfolio-accent)]" />
              </div>
              <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-[var(--portfolio-ink)]">
                Public Tooling &amp; Open Engineering.
              </h2>
              <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-[var(--portfolio-muted)]">
                I believe senior engineering should be transparent. All core algorithms, study curricula, verification gates, and demo architectures are published openly for the developer community.
              </p>
            </div>

            <a
              href="https://github.com/CVamsi27"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-4 py-2 text-xs font-medium text-[var(--portfolio-ink)] hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)] transition-all shrink-0"
            >
              <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />
              <span>Visit @CVamsi27 on GitHub</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </Reveal>

        {/* Highlight Stats Strip */}
        <Reveal delay={80}>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-4 sm:p-6">
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[var(--portfolio-accent)]">
                868+
              </p>
              <p className="font-utility text-[11px] uppercase tracking-wider text-[var(--portfolio-muted)] mt-1">
                Open Reference Files
              </p>
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[var(--portfolio-accent)]">
                20
              </p>
              <p className="font-utility text-[11px] uppercase tracking-wider text-[var(--portfolio-muted)] mt-1">
                Verification Gates (CI)
              </p>
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[var(--portfolio-accent)]">
                366k+
              </p>
              <p className="font-utility text-[11px] uppercase tracking-wider text-[var(--portfolio-muted)] mt-1">
                Lines Curated
              </p>
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[var(--portfolio-accent)]">
                100%
              </p>
              <p className="font-utility text-[11px] uppercase tracking-wider text-[var(--portfolio-muted)] mt-1">
                Zero-Drift Verified
              </p>
            </div>
          </div>
        </Reveal>

        {/* Repositories Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {REPOSITORIES.map((repo, idx) => (
            <Reveal key={repo.id} delay={idx * 60}>
              <div
                className={cn(
                  "group flex flex-col justify-between rounded-2xl border bg-[var(--portfolio-paper)] p-5 sm:p-6 transition-all duration-300 hover:shadow-lg",
                  repo.featured
                    ? "border-[var(--portfolio-accent)]/40 shadow-sm"
                    : "border-[var(--portfolio-rule)] hover:border-[var(--portfolio-accent)]/60"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--portfolio-rule)] pb-3">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faGithub}
                        className="h-4 w-4 text-[var(--portfolio-muted)] group-hover:text-[var(--portfolio-accent)] transition-colors"
                      />
                      <span className="font-mono text-xs font-semibold text-[var(--portfolio-ink)]">
                        {repo.repo}
                      </span>
                    </div>

                    {repo.featured && (
                      <span className="rounded-full bg-[var(--portfolio-blue-soft)] px-2.5 py-0.5 font-utility text-[10px] font-semibold text-[var(--portfolio-accent)] uppercase">
                        Flagship
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold text-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-accent)] transition-colors">
                    {repo.name}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--portfolio-muted)]">
                    {repo.description}
                  </p>

                  <ul className="mt-4 space-y-1.5 border-t border-[var(--portfolio-rule)] pt-3 text-xs text-[var(--portfolio-ink)]">
                    {repo.highlights.map((highlight, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--portfolio-accent)]" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {repo.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-[var(--portfolio-rule)] bg-[var(--portfolio-wash)] px-2 py-0.5 font-mono text-[10px] text-[var(--portfolio-muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-[var(--portfolio-rule)] pt-4">
                  <a
                    href={repo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-3 py-1.5 font-utility text-xs font-medium text-[var(--portfolio-ink)] hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)] transition-colors"
                  >
                    <FontAwesomeIcon icon={faGithub} className="h-3.5 w-3.5" />
                    <span>Source Code</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>

                  {repo.liveUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewItem({
                            title: repo.name,
                            url: repo.liveUrl!,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 font-utility text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span>Live Sandbox</span>
                      </button>

                      <a
                        href={repo.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-utility text-xs text-[var(--portfolio-muted)] hover:text-[var(--portfolio-accent)] transition-colors ml-auto"
                      >
                        <span>External Link</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Upstream Contribution Protocols */}
        <Reveal delay={120}>
          <div className="mt-12 rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] pb-4">
              <div>
                <h4 className="font-display text-base sm:text-lg font-bold text-[var(--portfolio-ink)]">
                  Ecosystem Contribution Tracks
                </h4>
                <p className="mt-1 text-xs text-[var(--portfolio-muted)]">
                  Active tracking, issue evaluation, and documentation alignment for leading open-source repositories.
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {CONTRIBUTION_TRACKS.map((item) => (
                <div
                  key={item.project}
                  className="rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-wash)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[var(--portfolio-ink)]">
                      {item.project}
                    </span>
                    <span className="rounded-full bg-[var(--portfolio-blue-soft)] px-2 py-0.5 font-utility text-[10px] font-semibold text-[var(--portfolio-accent)]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-1 font-utility text-xs font-medium text-[var(--portfolio-accent)]">
                    {item.scope}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--portfolio-muted)]">
                    {item.description}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-[var(--portfolio-accent)] hover:underline"
                  >
                    <span>View Repository Guide</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Live Preview Modal */}
      {previewItem && (
        <LivePreviewModal
          open={Boolean(previewItem)}
          title={previewItem.title}
          url={previewItem.url}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </section>
  );
}
