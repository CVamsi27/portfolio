"use client";

import { useState } from "react";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ArrowUpRight, ChevronRight, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ARCHITECTURE_PATTERNS,
  SHOWCASE_PATTERN_IDS,
} from "@/lib/architecture-patterns";

type PatternCategory =
  | "all"
  | "distributed"
  | "structural"
  | "behavioral"
  | "creational";

const SHOWCASED_PATTERNS = SHOWCASE_PATTERN_IDS.flatMap((id) => {
  const pattern = ARCHITECTURE_PATTERNS.find((candidate) => candidate.id === id);
  return pattern ? [pattern] : [];
});

export default function ArchitectureShowcase() {
  const [selectedCategory, setSelectedCategory] =
    useState<PatternCategory>("all");
  const [activeSnippet, setActiveSnippet] = useState<string | null>(
    SHOWCASED_PATTERNS[0]?.id ?? null,
  );

  const filtered = SHOWCASED_PATTERNS.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory,
  );

  return (
    <section
      id="Architecture"
      aria-label="Systems Architecture and GoF Design Patterns"
      data-chapter-index="02"
      className="relative border-y border-[var(--portfolio-arch-rule)] bg-[var(--portfolio-arch-bg)] px-5 py-16 text-[var(--portfolio-arch-ink)] sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          inverted
          eyebrow="02 // Architecture & Design Patterns"
          title="Proven patterns for high-stakes software."
          description="Mechanisms that govern tenant boundaries, crash-safe background delivery, and deterministic state transitions across production systems."
        />

        {/* Scope Filter Row & Full Library Link */}
        <Reveal delay={40}>
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--portfolio-arch-rule)] pb-3">
            <div className="flex flex-wrap gap-5">
              {(
                [
                  ["all", "All Patterns"],
                  ["distributed", "Distributed & Security"],
                  ["behavioral", "Behavioral"],
                  ["structural", "Structural"],
                  ["creational", "Creational"],
                ] as const
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "-mb-[13px] cursor-pointer border-b-[1.5px] pb-3 font-sans text-xs font-medium transition-colors",
                    selectedCategory === cat
                      ? "border-[var(--portfolio-arch-ink)] text-[var(--portfolio-arch-ink)]"
                      : "border-transparent text-[var(--portfolio-arch-muted)] hover:text-[var(--portfolio-arch-ink)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <a
              href="https://study.buildora.work/30-architecture"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--portfolio-arch-rule)] px-3.5 py-1.5 font-sans text-xs font-medium text-[var(--portfolio-arch-ink)] transition-colors hover:border-[var(--portfolio-arch-ink)]"
            >
              <span>Explore All 23 Patterns</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </Reveal>

        {/* Border-Collapsed 2-Column Specification Matrix */}
        <div className="grid gap-px border border-[var(--portfolio-arch-rule)] bg-[var(--portfolio-arch-rule)] md:grid-cols-2">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              data-pattern-card
              className="flex h-full flex-col justify-between bg-[var(--portfolio-arch-bg)] p-6 transition-colors hover:bg-[var(--portfolio-arch-surface)] sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[var(--portfolio-arch-rule)] pb-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-arch-muted)]">
                    <span>{String(idx + 1).padStart(2, "0")}</span>
                    <span>·</span>
                    <span>{item.categoryLabel}</span>
                  </div>
                  <a
                    href={item.stackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-sans text-xs text-[var(--portfolio-arch-muted)] transition-colors hover:text-[var(--portfolio-arch-ink)]"
                  >
                    <span>Reference</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>

                <h3 className="mt-4 font-display text-2xl font-light leading-tight tracking-[-0.02em] text-[var(--portfolio-arch-ink)] sm:text-[1.75rem]">
                  {item.name}
                </h3>

                <div className="mt-4 space-y-3 font-sans text-xs sm:text-sm">
                  <p className="leading-relaxed text-[var(--portfolio-arch-muted)]">
                    <span className="font-medium text-[var(--portfolio-arch-ink)]">
                      Invariant:{" "}
                    </span>
                    {item.problem}
                  </p>

                  <details className="group">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-arch-ink)]">
                      <ChevronRight
                        className="h-3.5 w-3.5 text-[var(--portfolio-arch-muted)] transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                      <span>Architecture solution</span>
                    </summary>
                    <p className="mt-2.5 border-l border-[var(--portfolio-arch-rule)] pl-3 text-xs leading-relaxed text-[var(--portfolio-arch-muted)]">
                      {item.solution}
                    </p>
                  </details>

                  <div className="border border-[var(--portfolio-arch-rule)] bg-[var(--portfolio-arch-surface)] p-3.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-arch-muted)]">
                      Production Application
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--portfolio-arch-ink)]">
                      {item.productionUse}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Inspector Toggle */}
              <div className="mt-6 border-t border-[var(--portfolio-arch-rule)] pt-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSnippet(
                        activeSnippet === item.id ? null : item.id,
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-arch-ink)] hover:underline"
                  >
                    <Code2 className="h-3.5 w-3.5 text-[var(--portfolio-arch-muted)]" />
                    <span>
                      {activeSnippet === item.id
                        ? "Hide implementation"
                        : "Inspect TypeScript"}
                    </span>
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-arch-muted)]">
                    TS
                  </span>
                </div>

                {activeSnippet === item.id && (
                  <div className="mt-3 overflow-hidden border border-[var(--portfolio-arch-rule)] bg-[#070709] p-4 font-mono text-[11px] text-[#e6e5e0]">
                    <pre className="overflow-x-auto whitespace-pre leading-relaxed">
                      <code>{item.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Architectural Review Strip */}
        <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-[var(--portfolio-arch-rule)] pt-10 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-arch-muted)]">
              Architecture Advisory
            </p>
            <h4 className="mt-2 font-display text-2xl font-light tracking-[-0.02em] text-[var(--portfolio-arch-ink)] sm:text-3xl">
              Need a system design or reliability review?
            </h4>
            <p className="mt-1.5 max-w-2xl font-sans text-xs leading-relaxed text-[var(--portfolio-arch-muted)] sm:text-sm">
              Evaluating multi-tenant PostgreSQL RLS isolation, transactional
              outbox pipelines, real-time synchronization, and p95 latency
              bottlenecks.
            </p>
          </div>
          <a
            href="#Contact"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--portfolio-arch-ink)] bg-[var(--portfolio-arch-ink)] px-5 font-sans text-xs font-medium text-[var(--portfolio-arch-bg)] transition-opacity hover:opacity-85"
          >
            <span>Discuss architecture</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
