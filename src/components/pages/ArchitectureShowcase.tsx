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
      className="relative border-y border-white/12 bg-[#08080a] px-5 py-16 text-[#f4f3ee] sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          inverted
          eyebrow="02 // Architecture & Design Patterns"
          title="Proven patterns for high-stakes software."
          description="Mechanisms that govern tenant boundaries, crash-safe background delivery, and deterministic state transitions across production systems."
        />

        {/* Scope Filter Row & Full Library Link */}
        <Reveal delay={60}>
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap border border-white/15 bg-[#0e0e12]">
              {(
                [
                  ["all", "All"],
                  ["distributed", "Distributed & Security"],
                  ["behavioral", "Behavioral"],
                  ["structural", "Structural"],
                  ["creational", "Creational"],
                ] as const
              ).map(([cat, label], idx, arr) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "cursor-pointer px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
                    idx < arr.length - 1 && "border-r border-white/12",
                    selectedCategory === cat
                      ? "bg-[#f4f3ee] font-semibold text-[#08080a]"
                      : "text-[#9c9ca6] hover:text-[#f4f3ee]",
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
              className="inline-flex items-center gap-1.5 border border-white/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[#f4f3ee] transition-colors hover:border-[#ff3b2f] hover:text-[#ff3b2f]"
            >
              <span>Explore All 23 Patterns</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </Reveal>

        {/* Border-Collapsed 2-Column Specification Matrix */}
        <div className="grid gap-px border border-white/15 bg-white/15 md:grid-cols-2">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              data-pattern-card
              className="flex h-full flex-col justify-between bg-[#0c0c10] p-6 transition-colors hover:bg-[#111116] sm:p-7"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-white/12 pb-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                    <span className="text-[#ff3b2f]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[#8e8e98]">{item.categoryLabel}</span>
                  </div>
                  <a
                    href={item.stackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#9c9ca6] transition-colors hover:text-[#ff3b2f]"
                  >
                    <span>Reference</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>

                <h3 className="mt-4 font-display text-2xl leading-tight tracking-[-0.015em] text-[#f4f3ee] sm:text-3xl">
                  {item.name}
                </h3>

                <div className="mt-4 space-y-3 text-xs sm:text-sm">
                  <p className="leading-relaxed text-[#a8a8b2]">
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#f4f3ee]">
                      Invariant:{" "}
                    </span>
                    {item.problem}
                  </p>

                  <details className="group">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#d4d3ce] hover:text-[#ff3b2f]">
                      <ChevronRight
                        className="h-3.5 w-3.5 text-[#ff3b2f] transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                      <span>Architecture solution</span>
                    </summary>
                    <p className="mt-2.5 border-l border-[#ff3b2f]/60 pl-3 text-xs leading-relaxed text-[#a8a8b2]">
                      {item.solution}
                    </p>
                  </details>

                  <div className="border border-white/10 bg-[#08080a] p-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ff3b2f]">
                      Production Use
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-[#e6e5e0]">
                      {item.productionUse}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Inspector Toggle */}
              <div className="mt-5 border-t border-white/12 pt-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSnippet(
                        activeSnippet === item.id ? null : item.id,
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#f4f3ee] transition-colors hover:text-[#ff3b2f]"
                  >
                    <Code2 className="h-3.5 w-3.5 text-[#ff3b2f]" />
                    <span>
                      {activeSnippet === item.id
                        ? "Hide Implementation"
                        : "Inspect TypeScript"}
                    </span>
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6e6e78]">
                    TS
                  </span>
                </div>

                {activeSnippet === item.id && (
                  <div className="mt-3 overflow-hidden border border-white/12 bg-[#050507] p-3.5 font-mono text-[11px] text-[#e6e5e0]">
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
        <div className="mt-10 flex flex-col items-start justify-between gap-6 border border-white/15 bg-[#0e0e12] p-6 sm:p-8 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff3b2f]">
              Architecture Advisory
            </p>
            <h4 className="mt-1.5 font-display text-2xl text-[#f4f3ee] sm:text-3xl">
              Need a system design or reliability review?
            </h4>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#9c9ca6] sm:text-sm">
              Evaluating multi-tenant PostgreSQL RLS isolation, transactional
              outbox pipelines, real-time synchronization, and p95 latency
              bottlenecks.
            </p>
          </div>
          <a
            href="#Contact"
            className="portfolio-stage-primary-cta shrink-0"
          >
            <span>Discuss Architecture</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
