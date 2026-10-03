"use client";

import { Reveal } from "@/components/common/Reveal";
import {
  Activity,
  CheckCircle2,
  Quote,
  ShieldCheck,
  Zap,
} from "lucide-react";

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
  { quote: "End-to-end clinical workflows, scoped APIs, background jobs and an operational dashboard. The case study explains mechanisms, checks and remaining boundaries.", author: "Product implementation", role: "Self-authored project summary", company: "Docita", context: "Healthcare SaaS", metrics: ["5 Core Workflows", "Typed Contracts", "Request Telemetry"] },
  { quote: "Recruitment and internal-workflow applications, API/query tuning, reusable React interfaces and delivery reviews. Personal contribution is explained through actual work examples.", author: "Engineering experience", role: "Self-authored experience summary", company: "MAQ Software", context: "Enterprise product workflows", metrics: ["TypeScript / React", "API Profiling", "Reviews & Mentoring"] },
  { quote: "Four Spring Boot microservices for product, vendor and checkout workflows during a structured graduate training program.", author: "Graduate program", role: "Self-authored training summary", company: "Cognizant", context: "E-commerce exercise", metrics: ["4 Microservices", "Service Discovery", "JWT Authorization"] },
];

const TRUST_PILLARS = [
  { title: "Durable intent", desc: "Trace the business write and event append, then distinguish committed intent from external completion.", icon: Zap },
  { title: "Scoped access", desc: "Combine resource authorization and database policies, with effective role/context checks.", icon: ShieldCheck },
  { title: "Meaningful verification", desc: "Use failure-path tests and repository gates to verify specific behavior and report remaining gaps.", icon: CheckCircle2 },
  { title: "Concurrency reasoning", desc: "Test competing operations against a real database before claiming a scheduling or resource invariant.", icon: Activity },
];

export default function Testimonials() {
  return (
    <section
      id="Impact"
      aria-label="Product Work and Engineering Practice"
      data-chapter-index="06"
      className="portfolio-chapter relative px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
    >
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[var(--portfolio-accent)] uppercase tracking-widest">
                06 / PRODUCT WORK
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--portfolio-accent)]" />
            </div>
            <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-[var(--portfolio-ink)]">
              Work, Decisions and Verification.
            </h2>
            <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-[var(--portfolio-muted)]">
              Self-authored summaries of product work and engineering experience. Detailed examples explain implementation, personal contribution and verification.
            </p>
          </div>
        </Reveal>

        {/* Endorsements Cards Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {ENDORSEMENTS.map((item, idx) => (
            <Reveal key={item.company} delay={idx * 80}>
              <div className="flex flex-col justify-between rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 sm:p-7 shadow-xs hover:border-[var(--portfolio-accent)]/50 hover:shadow-md transition-all duration-300 h-full">
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] pb-3">
                    <Quote className="h-5 w-5 text-[var(--portfolio-accent)] opacity-80" />
                    <span className="rounded-full bg-[var(--portfolio-blue-soft)] px-2.5 py-0.5 font-utility text-[10px] font-semibold text-[var(--portfolio-accent)]">
                      Work Summary
                    </span>
                  </div>

                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[var(--portfolio-ink)] italic">
                    {item.quote}
                  </p>
                </div>

                <div className="mt-6 border-t border-[var(--portfolio-rule)] pt-4">
                  <p className="font-display text-sm font-bold text-[var(--portfolio-ink)]">
                    {item.author}
                  </p>
                  <p className="text-xs text-[var(--portfolio-accent)] font-medium">
                    {item.role} · {item.company}
                  </p>
                  <p className="text-[11px] text-[var(--portfolio-muted)] mt-0.5">
                    {item.context}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.metrics.map((m) => (
                      <span
                        key={m}
                        className="rounded-md border border-[var(--portfolio-rule)] bg-[var(--portfolio-wash)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--portfolio-ink)]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Verified Technical Standards */}
        <Reveal delay={120}>
          <div className="mt-14 rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 sm:p-8">
            <div className="border-b border-[var(--portfolio-rule)] pb-4">
              <h3 className="font-display text-lg font-bold text-[var(--portfolio-ink)]">
                Engineering Practice
              </h3>
              <p className="text-xs sm:text-sm text-[var(--portfolio-muted)] mt-1">
                These are the boundaries I examine when building and reviewing product workflows.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="flex flex-col rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-wash)] p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="mt-3 font-display text-xs font-bold text-[var(--portfolio-ink)]">
                      {pillar.title}
                    </h4>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--portfolio-muted)]">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
