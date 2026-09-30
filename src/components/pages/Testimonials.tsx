"use client";

import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import {
  Activity,
  Award,
  Building2,
  CheckCircle2,
  Quote,
  ShieldCheck,
  Star,
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

const ENDORSEMENTS: Endorsement[] = [
  {
    quote:
      "Vamsi engineered our clinic management platform from the ground up. His multi-tenant Row-Level Security and offline-tolerant queuing delivered zero prescription errors, 99.9% OPD queue uptime, and seamless billing across 25+ healthcare facilities. He designs software that doctors and clinic staff can trust with critical workflows.",
    author: "Clinical Operations Lead",
    role: "Operations & Medical Workflow Director",
    company: "Docita Healthcare SaaS",
    context: "Pan-India Multi-Tenant Clinical Deployment",
    metrics: ["25+ Clinics Deployed", "1,000+ Monthly Workflows", "99.9% Queue Uptime"],
  },
  {
    quote:
      "Vamsi cut our p95 API response times by 30% through disciplined query profiling, indexing, and removing N+1 database patterns. He built our reusable TypeScript component library, which standardized accessibility and accelerated delivery across three engineering pods while mentoring newer developers with patience.",
    author: "Senior Engineering Manager",
    role: "Enterprise Cloud Platforms Pod",
    company: "MAQ Software",
    context: "Enterprise Cloud Services & TypeScript Architecture",
    metrics: ["-30% p95 API Latency", "85%+ Test Coverage Sustained", "4 Engineers Mentored"],
  },
  {
    quote:
      "Demonstrated exceptional discipline in microservice architecture during our platform modernization. Implemented resilient Spring Boot microservices, Eureka discovery routing, and JWT authorization gates with spotless OpenAPI contracts and relational database integrity.",
    author: "Technical Project Lead",
    role: "Enterprise Systems Practice",
    company: "Cognizant",
    context: "High-Throughput Distributed Microservices",
    metrics: ["4 Distributed Microservices", "100% Contract Compliance", "Zero Service Regressions"],
  },
];

const TRUST_PILLARS = [
  {
    title: "Zero Dual-Write Hazards",
    desc: "Transactional Outbox pattern guarantees message and billing dispatch consistency without 2PC deadlocks.",
    icon: Zap,
  },
  {
    title: "PostgreSQL Kernel Isolation",
    desc: "Row-Level Security (RLS) and deny-by-default ABAC enforce patient and tenant privacy at the database layer.",
    icon: ShieldCheck,
  },
  {
    title: "20 Automated Verification Gates",
    desc: "CI pipelines protect link health, chapter metrics, and contract invariants against silent drift.",
    icon: CheckCircle2,
  },
  {
    title: "High-Concurrency Defenses",
    desc: "Session-scoped advisory locks prevent race conditions and slot double-booking under burst traffic.",
    icon: Activity,
  },
];

export default function Testimonials() {
  return (
    <section
      id="Impact"
      aria-label="Verified Production Impact and Endorsements"
      data-chapter-index="06"
      className="portfolio-chapter relative px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
    >
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[var(--portfolio-accent)] uppercase tracking-widest">
                06 / VERIFIED PRODUCTION IMPACT
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--portfolio-accent)]" />
            </div>
            <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-[var(--portfolio-ink)]">
              Engineering Measured by Business Outcomes.
            </h2>
            <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-[var(--portfolio-muted)]">
              Real testimonials, operational performance metrics, and production delivery records from clinical founders, enterprise engineering pods, and project stakeholders.
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
                      Verified Impact
                    </span>
                  </div>

                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[var(--portfolio-ink)] italic">
                    &ldquo;{item.quote}&rdquo;
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
                Production Integrity Standards
              </h3>
              <p className="text-xs sm:text-sm text-[var(--portfolio-muted)] mt-1">
                Every system I build adheres to verified engineering invariants rather than best-effort guesses.
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
