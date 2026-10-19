"use client";

import { useState } from "react";
import { Reveal } from "@/components/common/Reveal";
import { ArrowUpRight, ChevronRight, Code2, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ARCHITECTURE_PATTERNS,
  SHOWCASE_PATTERN_IDS,
} from "@/lib/architecture-patterns";

type PatternCategory = "all" | "distributed" | "structural" | "behavioral" | "creational";

/**
 * The architecture chapter shows a curated six of the pattern set (the full
 * 23-pattern library lives in the Senior Full Stack Bible, linked from the
 * chapter header). Case studies link into the same pattern data by id.
 */
const SHOWCASED_PATTERNS = SHOWCASE_PATTERN_IDS.flatMap((id) => {
  const pattern = ARCHITECTURE_PATTERNS.find((candidate) => candidate.id === id);
  return pattern ? [pattern] : [];
});

export default function ArchitectureShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory>("all");
  const [activeSnippet, setActiveSnippet] = useState<string | null>(
    SHOWCASED_PATTERNS[0]?.id ?? null,
  );

  const filtered = SHOWCASED_PATTERNS.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  return (
    <section
      id="Architecture"
      aria-label="Systems Architecture and GoF Design Patterns"
      data-chapter-index="02"
      className="portfolio-chapter relative px-5 py-14 sm:px-10 sm:py-20 lg:px-16"
    >
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--portfolio-accent)] uppercase tracking-widest">
                  02 / ARCHITECTURE &amp; DESIGN PATTERNS
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--portfolio-accent)]" />
              </div>
              <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-[var(--portfolio-ink)]">
                Proven Patterns for High-Stakes Software.
              </h2>
              <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-[var(--portfolio-muted)]">
                These patterns explain decisions in my projects and study library. Examples illustrate mechanisms; each project case distinguishes implemented behavior, verification and proposed improvements.
              </p>
            </div>

            <a
              href="https://study.buildora.work/30-architecture"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-3.5 py-2 text-xs font-medium text-[var(--portfolio-ink)] hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)] transition-all shrink-0"
            >
              <span>Explore All 23 Patterns in Bible</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </Reveal>

        {/* Filter Pills */}
        <Reveal delay={80}>
          <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-[var(--portfolio-rule)] pb-4">
            <span className="font-utility text-xs text-[var(--portfolio-muted)] mr-2">
              Filter by scope:
            </span>
            {(
              [
                ["all", "All Architectures"],
                ["distributed", "Distributed & Security"],
                ["behavioral", "Behavioral (GoF)"],
                ["structural", "Structural (GoF)"],
                ["creational", "Creational (GoF)"],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-[var(--portfolio-accent)] text-white shadow-xs"
                    : "border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-ink)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Cards Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filtered.map((item, idx) => (
            <Reveal key={item.id} delay={idx * 60}>
              <div
                data-pattern-card
                className="group flex h-full flex-col justify-between rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-5 sm:p-6 transition-all duration-300 hover:border-[var(--portfolio-accent)]/60 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--portfolio-rule)] pb-3">
                    <span className="rounded-md bg-[var(--portfolio-blue-soft)] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--portfolio-accent)] uppercase tracking-wider">
                      {item.categoryLabel}
                    </span>
                    <a
                      href={item.stackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-utility text-[11px] font-medium text-[var(--portfolio-muted)] hover:text-[var(--portfolio-accent)] transition-colors"
                      title="Read complete chapter in Senior Full Stack Bible"
                    >
                      <span>Study Chapter</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold text-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-accent)] transition-colors">
                    {item.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-[var(--portfolio-ink)]">
                        Problem Invariant:{" "}
                      </span>
                      <span className="text-[var(--portfolio-muted)]">
                        {item.problem}
                      </span>
                    </div>

                    <details className="portfolio-disclosure">
                      <summary>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Architecture solution</span>
                      </summary>
                      <p className="portfolio-disclosure-body text-[var(--portfolio-muted)]">
                        {item.solution}
                      </p>
                    </details>

                    <div className="rounded-lg bg-[var(--portfolio-wash)] p-2.5 border border-[var(--portfolio-rule)] mt-3">
                      <span className="font-mono text-[11px] font-semibold text-[var(--portfolio-accent)]">
                        Production Application:
                      </span>
                      <p className="mt-1 text-xs text-[var(--portfolio-ink)] font-medium">
                        {item.productionUse}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Code Preview Drawer Toggle */}
                <div className="mt-5 border-t border-[var(--portfolio-rule)] pt-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSnippet(activeSnippet === item.id ? null : item.id)
                      }
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-[var(--portfolio-accent)] hover:underline"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>{activeSnippet === item.id ? "Hide Pattern Code" : "Inspect Pattern Code"}</span>
                    </button>
                    <span className="font-mono text-[10px] text-[var(--portfolio-muted)]">
                      TypeScript
                    </span>
                  </div>

                  {activeSnippet === item.id && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[var(--portfolio-rule)] bg-black/90 p-3 text-[11px] font-mono text-emerald-400 shadow-inner">
                      <pre className="overflow-x-auto whitespace-pre leading-relaxed">
                        <code>{item.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom Banner */}
        <Reveal delay={120}>
          <div className="mt-12 rounded-2xl border border-[var(--portfolio-rule)] bg-gradient-to-r from-[var(--portfolio-blue-soft)]/50 via-[var(--portfolio-paper)] to-[var(--portfolio-blue-soft)]/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-[var(--portfolio-accent)]" />
                <h4 className="font-display text-base sm:text-lg font-bold text-[var(--portfolio-ink)]">
                  Need a custom system design or architecture review?
                </h4>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-[var(--portfolio-muted)] max-w-2xl">
                I evaluate distributed transactions, multi-tenant RLS data models, real-time sync pipelines, and high-concurrency PostgreSQL performance.
              </p>
            </div>
            <a
              href="#Contact"
              className="portfolio-primary-action shrink-0 text-center"
            >
              Discuss Your Architecture
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
