"use client";

import { SectionHeading } from "@/components/common/SectionHeading";
import { Activity, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

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
    icon: Zap,
  },
  {
    title: "Scoped access",
    desc: "Combine resource authorization and database policies, with effective role/context checks.",
    icon: ShieldCheck,
  },
  {
    title: "Meaningful verification",
    desc: "Use failure-path tests and repository gates to verify specific behavior and report remaining gaps.",
    icon: CheckCircle2,
  },
  {
    title: "Concurrency reasoning",
    desc: "Test competing operations against a real database before claiming a scheduling or resource invariant.",
    icon: Activity,
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

        {/* Editorial 3-Column Hairline Grid */}
        <div className="grid gap-px border border-[var(--portfolio-rule)] bg-[var(--portfolio-rule)] md:grid-cols-3">
          {ENDORSEMENTS.map((item, idx) => (
            <div
              key={item.company}
              className="flex h-full flex-col justify-between bg-[var(--portfolio-surface)] p-6 sm:p-7"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] pb-3 font-mono text-[10px] uppercase tracking-[0.16em]">
                  <span className="text-[var(--portfolio-accent)]">
                    {String(idx + 1).padStart(2, "0")} {"//"} {item.company}
                  </span>
                  <span className="text-[var(--portfolio-muted)]">
                    {item.context}
                  </span>
                </div>

                <p className="mt-5 font-display text-xl italic leading-snug text-[var(--portfolio-ink)] sm:text-2xl">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="mt-7 border-t border-[var(--portfolio-rule)] pt-4">
                <p className="font-mono text-xs font-medium text-[var(--portfolio-ink)]">
                  {item.author}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--portfolio-muted)]">
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

        {/* Engineering Practice 4-Column Specification Strip */}
        <div className="mt-10 border border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)]">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--portfolio-rule)] px-6 py-4">
            <h3 className="font-display text-2xl text-[var(--portfolio-ink)]">
              Engineering Practice
            </h3>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]">
              Boundaries verified across every production workflow
            </p>
          </div>

          <div className="grid gap-px bg-[var(--portfolio-rule)] sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-[var(--portfolio-surface)] p-5 transition-colors hover:bg-[var(--portfolio-wash)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--portfolio-accent)]">
                      0{idx + 1}
                    </span>
                    <Icon className="h-4 w-4 text-[var(--portfolio-muted)]" />
                  </div>
                  <h4 className="mt-3 font-display text-xl text-[var(--portfolio-ink)]">
                    {pillar.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--portfolio-muted)]">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
