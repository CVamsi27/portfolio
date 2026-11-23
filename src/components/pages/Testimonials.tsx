"use client";

import { SectionHeading } from "@/components/common/SectionHeading";

interface Endorsement {
  quote: string;
  author: string;
  role: string;
  company: string;
  context: string;
  metrics: string[];
}

// Self-authored summaries of work; no third-party endorsement is asserted.
const ENDORSEMENTS: Endorsement[] = [
  {
    quote:
      "End-to-end clinical workflows, scoped APIs, background jobs and an operational dashboard. The case study explains mechanisms, checks and remaining boundaries.",
    author: "Product implementation",
    role: "Self-authored project summary",
    company: "Docita",
    context: "Healthcare SaaS",
    metrics: ["Clinic Workflows", "Typed Contracts", "Request Telemetry"],
  },
  {
    quote:
      "Recruitment and internal-workflow applications, API/query tuning, reusable React interfaces and delivery reviews. Personal contribution is explained through actual work examples.",
    author: "Engineering experience",
    role: "Self-authored experience summary",
    company: "MAQ Software",
    context: "Enterprise product workflows",
    metrics: ["TypeScript / React", "API Profiling", "Reviews & Mentoring"],
  },
  {
    quote:
      "Four Spring Boot microservices for product, vendor and checkout workflows during a structured graduate training program.",
    author: "Graduate program",
    role: "Self-authored training summary",
    company: "Cognizant",
    context: "E-commerce exercise",
    metrics: ["4 Microservices", "Service Discovery", "JWT Authorization"],
  },
];

const TRUST_PILLARS = [
  {
    title: "Durable intent",
    desc: "Trace the business write and event append, then distinguish committed intent from external completion.",
  },
  {
    title: "Scoped access",
    desc: "Combine resource authorization and database policies, with effective role/context checks.",
  },
  {
    title: "Meaningful verification",
    desc: "Use failure-path tests and repository gates to verify specific behavior and report remaining gaps.",
  },
  {
    title: "Concurrency reasoning",
    desc: "Test competing operations against a real database before claiming a scheduling or resource invariant.",
  },
];

export default function Testimonials() {
  return (
    <section
      id="Impact"
      aria-label="Product Work and Engineering Practice"
      data-chapter-index="06"
      className="portfolio-section bg-[var(--portfolio-wash)] px-5 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="06 // Product Work & Standards"
          title="Work, decisions & verification."
          description="Self-authored summaries of shipped product work and engineering experience—paired with the technical invariants I inspect in every system."
        />

        {/* Editorial 3-Column Open Top-Ruled Grid */}
        <div className="grid gap-10 md:grid-cols-3">
          {ENDORSEMENTS.map((item, idx) => (
            <div
              key={item.company}
              className="flex h-full flex-col justify-between border-t border-[var(--portfolio-rule)] pt-6"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-muted)]">
                  <span>
                    {String(idx + 1).padStart(2, "0")} · {item.company}
                  </span>
                  <span>{item.context}</span>
                </div>

                <p className="mt-5 font-display text-xl font-light italic leading-relaxed text-[var(--portfolio-ink)] sm:text-[1.4rem]">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="mt-7 border-t border-[var(--portfolio-rule)] pt-4">
                <p className="font-sans text-xs font-semibold text-[var(--portfolio-ink)]">
                  {item.author}
                </p>
                <p className="mt-0.5 font-sans text-xs text-[var(--portfolio-muted)]">
                  {item.role}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.metrics.map((m) => (
                    <span key={m} className="portfolio-tag-pill">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Engineering Practice 4-Column Open Ledger */}
        <div className="mt-16 border-t border-[var(--portfolio-rule)] pt-10">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl font-light tracking-[-0.02em] text-[var(--portfolio-ink)] sm:text-3xl">
              Engineering Practice
            </h3>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]">
              Boundaries verified across every production workflow
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PILLARS.map((pillar, idx) => (
              <div
                key={pillar.title}
                className="border-t border-[var(--portfolio-rule)] pt-4"
              >
                <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--portfolio-muted)]">
                  0{idx + 1}
                </span>
                <h4 className="mt-2 font-display text-xl font-light text-[var(--portfolio-ink)]">
                  {pillar.title}
                </h4>
                <p className="mt-2 font-sans text-xs leading-relaxed text-[var(--portfolio-muted)]">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
