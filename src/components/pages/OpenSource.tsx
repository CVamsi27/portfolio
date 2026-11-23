"use client";

import { useState } from "react";
import { Reveal } from "@/components/common/Reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight, ChevronRight, Radio } from "lucide-react";
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
    id: "rls-rehearsal",
    name: "RLS Rehearsal",
    repo: "CVamsi27/rls-rehearsal",
    description:
      "Executable PostgreSQL Row-Level Security harness, CLI, and GitHub Action that fails CI when an unfiltered read crosses a tenant boundary—with a failing control pass proving the assertion is load-bearing.",
    highlights: [
      "Two synthetic tenants sharing PostgreSQL tables under scoped roles and session claims",
      "Explicit control pass disables RLS in a disposable database to prove the test catches leaks",
      "Safety guards refuse remote or privileged targets; emits JSON, Markdown, and JUnit CI reports",
      "Honest scope: alpha release proving tested policy paths, not a full penetration test",
    ],
    metrics: "PostgreSQL RLS · Executable Isolation · CLI & GitHub Action",
    tech: ["TypeScript", "PostgreSQL", "NestJS", "GitHub Actions", "Docker"],
    githubUrl: "https://github.com/CVamsi27/rls-rehearsal",
    featured: true,
  },
  {
    id: "retryglass",
    name: "Retryglass",
    repo: "CVamsi27/retryglass",
    description:
      "Crash-point sweep for BullMQ workers that distinguishes duplicate vs lost same-job side effects and emits reproducible Vitest regression cases.",
    highlights: [
      "Sweeps crash points before and after external effect boundaries in local BullMQ workers",
      "Distinguishes duplicate side effects from silently lost jobs using business idempotency keys",
      "Turns failures into reproducible Vitest tests that stay red until fixed",
      "Part of the Developer Pain Lab executable failure-evidence suite (0.1.0-alpha.2)",
    ],
    metrics: "BullMQ · Crash-Point Sweep · Vitest Repro",
    tech: ["TypeScript", "Node.js", "BullMQ", "Redis", "Vitest"],
    githubUrl: "https://github.com/CVamsi27/retryglass",
    featured: true,
  },
  {
    id: "software-developer-bible",
    name: "Senior Full Stack Bible",
    repo: "CVamsi27/software-developer-bible",
    description:
      "A structured engineering library and study engine connecting senior full-stack mechanisms, examples, revision and practice.",
    highlights: [
      "Canonical chapters and learning-flow indexes across seven technical study areas",
      "2 terminal interview tracks: Abroad Full-Stack (EU/US startups) and Indian SDE (FAANG/Big Tech)",
      "All 23 Gang of Four (GoF) design patterns implemented with production TypeScript and rationale",
      "Automated metric, structure, freshness, link and teaching-flow checks",
    ],
    metrics: "Canonical Lessons · Revision · Verified Structure",
    tech: ["TypeScript", "Python", "Cloudflare Pages", "Jekyll", "AST Parsers"],
    githubUrl: "https://github.com/CVamsi27/software-developer-bible",
    liveUrl: "https://study.buildora.work",
  },
  {
    id: "developer-pain-lab",
    name: "Developer Pain Lab Suite",
    repo: "CVamsi27/developer-pain-lab",
    description:
      "Failure-path verification suite combining Retryglass, Deployproof, Rolloutproof, and Revokeproof around executable failure evidence.",
    highlights: [
      "Deployproof: catches built Node output folders that still import from source repositories",
      "Rolloutproof: rehearses migration-first deployments and application rollback safety on PostgreSQL",
      "Revokeproof: browser-driven check verifying open connections lose access after revocation",
      "Honest alpha documentation with reproducible local fixtures and explicit scope limits",
    ],
    metrics: "Deployproof · Rolloutproof · Revokeproof · Retryglass",
    tech: ["TypeScript", "PostgreSQL", "Node.js", "Playwright", "Vitest"],
    githubUrl: "https://github.com/CVamsi27/developer-pain-lab",
  },
];

const CONTRIBUTION_TRACKS = [
  {
    project: "Deployproof",
    scope: "Artifact Packaging Verification",
    description:
      "Verifies whether a built Node output directory still leaks imports back to the source repository, reporting the exact missing path and import chain.",
    url: "https://github.com/CVamsi27/deployproof",
    tag: "Owned Tool · 0.1.0-alpha.3",
  },
  {
    project: "Rolloutproof & Revokeproof",
    scope: "Rollback & Session Revocation Checks",
    description:
      "Disposable PostgreSQL migration/rollback rehearsals (Rolloutproof) and browser-driven open-session revocation checks (Revokeproof).",
    url: "https://github.com/CVamsi27/rolloutproof",
    tag: "Owned Tools · Alpha",
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
      className="portfolio-chapter relative px-5 py-14 sm:px-10 sm:py-20 lg:px-16"
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

        {/* Repositories Grid — repositories and ecosystem tracks in one grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {REPOSITORIES.map((repo, idx) => (
            <Reveal key={repo.id} delay={idx * 60}>
              <div
                data-repo-card
                className={cn(
                  "group flex h-full flex-col justify-between rounded-2xl border bg-[var(--portfolio-paper)] p-5 sm:p-6 transition-all duration-300 hover:shadow-lg",
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

                  <details className="portfolio-disclosure mt-4 border-t border-[var(--portfolio-rule)] pt-3">
                    <summary>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Highlights</span>
                    </summary>
                    <ul className="mt-3 space-y-1.5 text-xs text-[var(--portfolio-ink)]">
                      {repo.highlights.map((highlight, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--portfolio-accent)]" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </details>

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

          {/* Ecosystem contribution tracks — same section, compact strip */}
          {CONTRIBUTION_TRACKS.map((item, idx) => (
            <Reveal key={item.project} delay={(REPOSITORIES.length + idx) * 60}>
              <div
                data-ecosystem-track
                className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-[var(--portfolio-rule)] bg-[var(--portfolio-wash)] p-5 sm:p-6 transition-all duration-300 hover:border-[var(--portfolio-accent)]/60"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--portfolio-ink)]">
                      {item.project}
                    </span>
                    <span className="rounded-full bg-[var(--portfolio-blue-soft)] px-2 py-0.5 font-utility text-[10px] font-semibold text-[var(--portfolio-accent)]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-2 font-utility text-xs font-medium text-[var(--portfolio-accent)]">
                    Ecosystem track · {item.scope}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--portfolio-muted)]">
                    {item.description}
                  </p>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] text-[var(--portfolio-accent)] hover:underline"
                >
                  <span>View Repository Guide</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
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
