"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight, ChevronRight, Radio } from "lucide-react";
import LivePreviewModal from "@/components/LivePreviewModal";

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
    name: "Software Developer Bible",
    repo: "CVamsi27/software-developer-bible",
    description:
      "Open engineering documentation covering frontend internals, backend reliability, system architecture, and automated content verification checks.",
    highlights: [
      "Canonical architecture notes across frontend, backend, platform, and real-time systems",
      "Production TypeScript implementations of core structural and behavioral design patterns",
      "Automated structure, link, freshness, and verification scripts in CI",
    ],
    metrics: "Engineering Reference · Automated Verification",
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
    tag: "0.1.0-alpha.3",
  },
  {
    project: "Rolloutproof & Revokeproof",
    scope: "Rollback & Session Revocation Checks",
    description:
      "Disposable PostgreSQL migration/rollback rehearsals (Rolloutproof) and browser-driven open-session revocation checks (Revokeproof).",
    url: "https://github.com/CVamsi27/rolloutproof",
    tag: "Alpha Suite",
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
      className="portfolio-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="03 // Open Source & Verification Tooling"
          title="Public tooling & open engineering."
          description="Executable verification harnesses, crash-point probes, and engineering tools published openly so reliability claims can be inspected and reproduced."
        />

        <div className="mb-8 flex justify-end">
          <a
            href="https://github.com/CVamsi27"
            target="_blank"
            rel="noopener noreferrer"
            className="portfolio-secondary-action"
          >
            <FontAwesomeIcon icon={faGithub} className="h-3.5 w-3.5" />
            <span>Visit @CVamsi27 on GitHub</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Border-Collapsed 2-Column Engineering Ledger */}
        <div className="grid gap-px border border-[var(--portfolio-rule)] bg-[var(--portfolio-rule)] md:grid-cols-2">
          {REPOSITORIES.map((repo, idx) => (
            <div
              key={repo.id}
              data-repo-card
              className="flex h-full flex-col justify-between bg-[var(--portfolio-surface)] p-6 transition-colors hover:bg-[var(--portfolio-wash)] sm:p-7"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[var(--portfolio-rule)] pb-3">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--portfolio-ink)]">
                    <span className="text-[var(--portfolio-accent)]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <FontAwesomeIcon
                      icon={faGithub}
                      className="h-3.5 w-3.5 text-[var(--portfolio-muted)]"
                    />
                    <span>{repo.repo}</span>
                  </div>

                  {repo.featured && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-accent)]">
                      <span
                        className="h-1.5 w-1.5 bg-[var(--portfolio-accent)]"
                        aria-hidden="true"
                      />
                      Flagship
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-display text-2xl leading-tight tracking-[-0.015em] text-[var(--portfolio-ink)] sm:text-3xl">
                  {repo.name}
                </h3>

                <p className="mt-2.5 text-xs leading-relaxed text-[var(--portfolio-muted)] sm:text-sm sm:leading-6">
                  {repo.description}
                </p>

                <details className="group mt-4 border-t border-[var(--portfolio-rule)] pt-3">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]">
                    <ChevronRight
                      className="h-3.5 w-3.5 text-[var(--portfolio-accent)] transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    />
                    <span>Highlights</span>
                  </summary>
                  <ul className="mt-3 space-y-1.5 text-xs text-[var(--portfolio-ink)]">
                    {repo.highlights.map((highlight, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <span className="font-mono text-[var(--portfolio-accent)]">
                          —
                        </span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {repo.tech.map((t) => (
                    <span key={t} className="portfolio-tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--portfolio-rule)] pt-4">
                <a
                  href={repo.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-ink)] transition-colors hover:text-[var(--portfolio-accent)]"
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
                      className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-accent)] hover:underline"
                    >
                      <Radio className="h-3 w-3" />
                      <span>Live Sandbox</span>
                    </button>

                    <a
                      href={repo.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-muted)] transition-colors hover:text-[var(--portfolio-ink)]"
                    >
                      <span>Open Site</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Ecosystem Tracks */}
          {CONTRIBUTION_TRACKS.map((item) => (
            <div
              key={item.project}
              data-ecosystem-track
              className="flex h-full flex-col justify-between bg-[var(--portfolio-wash)] p-6 transition-colors hover:bg-[var(--portfolio-surface)] sm:p-7"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[var(--portfolio-rule)] pb-3">
                  <span className="font-mono text-xs font-medium text-[var(--portfolio-ink)]">
                    {item.project}
                  </span>
                  <span className="portfolio-impact-pill">{item.tag}</span>
                </div>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--portfolio-accent)]">
                  Ecosystem Track · {item.scope}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--portfolio-muted)] sm:text-sm">
                  {item.description}
                </p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-ink)] transition-colors hover:text-[var(--portfolio-accent)]"
              >
                <span>View Repository</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

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
