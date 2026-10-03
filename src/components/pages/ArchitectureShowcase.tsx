"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import {
  ArrowUpRight,
  Code2,
  Cpu,
  Database,
  Layers,
  Lock,
  Network,
  Shield,
  Workflow,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PatternCategory = "all" | "distributed" | "structural" | "behavioral" | "creational";

interface PatternItem {
  id: string;
  name: string;
  category: "distributed" | "structural" | "behavioral" | "creational";
  categoryLabel: string;
  problem: string;
  solution: string;
  productionUse: string;
  stackUrl: string;
  codeSnippet: string;
}

const PATTERNS: PatternItem[] = [
  {
    id: "transactional-outbox",
    name: "Transactional Outbox Pattern",
    category: "distributed",
    categoryLabel: "Distributed Systems",
    problem: "Dual-write hazard: atomic database state mutations coupled with asynchronous message broker or external notifications.",
    solution: "Persist outgoing events into an `outbox` table within the identical database transaction, decoupled from worker dispatch with idempotency keys.",
    productionUse: "Docita Healthcare OS: Durable event intent and background processing; external completion requires recovery evidence.",
    stackUrl: "https://study.buildora.work/20-backend/20.6-microservices/03-data-and-consistency/20.6.3.06-transactional-outbox",
    codeSnippet: `// 1. Write state & outbox in same DB transaction
await prisma.$transaction(async (tx) => {
  const appt = await tx.appointment.create({ data: apptDto });
  await tx.outboxEvent.create({
    data: {
      eventType: 'APPOINTMENT_CONFIRMED',
      payload: appt,
      status: 'PENDING',
    },
  });
});
// 2. Worker polls with SKIP LOCKED & idempotency
// 3. Mark processed or exponential backoff`,
  },
  {
    id: "rls-abac",
    name: "Multi-Tenant Row-Level Security & ABAC",
    category: "distributed",
    categoryLabel: "Distributed Security",
    problem: "Cross-tenant data leakage in shared database architectures and complex clinic role permissions.",
    solution: "PostgreSQL session variables with `current_setting('app.current_tenant_id')` backed by deny-by-default Attribute-Based Access Control.",
    productionUse: "Docita Healthcare OS: Tenant-scoped authorization and RLS policies; effective enforcement depends on roles and transaction context.",
    stackUrl: "https://study.buildora.work/20-backend/20.4-database/01-postgresql-foundations/20.4.1.06-row-level-security",
    codeSnippet: `-- Illustrative policy; verify real role and transaction context
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON patients
  AS PERMISSIVE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);`,
  },
  {
    id: "observer-sse",
    name: "Observer & Reactive Real-Time Pipeline",
    category: "behavioral",
    categoryLabel: "Behavioral (GoF)",
    problem: "Low-latency broadcast of state changes to multiple concurrent frontend clients without resource-heavy polling.",
    solution: "Decouple event publishers from subscribers using event emitters and multiplexed Server-Sent Events / WebSockets.",
    productionUse: "TeamOps & Docita: Live OPD queue progression, room calls, and real-time collaboration canvas.",
    stackUrl: "https://study.buildora.work/30-architecture/30.1-design-patterns/04-behavioral/30.1.4.02-observer",
    codeSnippet: `export class RealtimeQueueSubject implements Subject {
  private observers: Set<QueueObserver> = new Set();
  
  notify(event: QueueEvent): void {
    for (const observer of this.observers) {
      observer.onQueueUpdated(event);
    }
  }
}`,
  },
  {
    id: "strategy-pattern",
    name: "Strategy Pattern for Clinical Billing",
    category: "behavioral",
    categoryLabel: "Behavioral (GoF)",
    problem: "Volatile billing rules across private pay, CGHS government schemes, and corporate insurance tariffs.",
    solution: "Encapsulate invoice calculation strategies behind a uniform interface, selecting the pricing algorithm dynamically at runtime.",
    productionUse: "Docita Healthcare OS: Modular billing engine supporting insurance deductions, GST slabs, and discount tariffs.",
    stackUrl: "https://study.buildora.work/30-architecture/30.1-design-patterns/04-behavioral/30.1.4.01-strategy",
    codeSnippet: `interface BillingStrategy {
  calculate(invoice: Invoice): InvoiceBreakdown;
}

class CGHSGovernmentStrategy implements BillingStrategy {
  calculate(invoice: Invoice): InvoiceBreakdown {
    // Apply regulated CGHS price ceiling & co-pay
    return { payable: cappedAmount, discount: govSubsidy };
  }
}`,
  },
  {
    id: "distributed-lock",
    name: "Advisory Locks & Concurrency Guards",
    category: "distributed",
    categoryLabel: "Distributed Systems",
    problem: "Race conditions in high-concurrency booking workflows causing double-booking of doctor appointment slots.",
    solution: "PostgreSQL transaction-level advisory locks (`pg_try_advisory_xact_lock`) ensuring serialized execution per resource ID.",
    productionUse: "Docita Healthcare OS: Booking concurrency is an invariant to verify with competing requests and actual database behavior.",
    stackUrl: "https://study.buildora.work/20-backend/20.4-database/03-transactions-and-replication/20.4.3.03-optimistic-pessimistic-locking",
    codeSnippet: `// Acquire session-scoped advisory lock on doctor + timeslot hash
const acquired = await prisma.$queryRaw\`
  SELECT pg_try_advisory_xact_lock(hashtext(\${lockKey})) AS locked;
\`;
if (!acquired[0].locked) {
  throw new ConflictException('Timeslot is currently being booked.');
}`,
  },
  {
    id: "factory-method",
    name: "Factory Method for Unified Notifications",
    category: "creational",
    categoryLabel: "Creational (GoF)",
    problem: "Tight coupling to concrete messaging channels (WhatsApp Business API, Twilio SMS, Resend Email).",
    solution: "Define a notification provider factory that instantiates channel handlers conforming to a shared dispatch contract.",
    productionUse: "Docita Healthcare OS: Provider adapters for communications; verify delivery and fallback on the selected path.",
    stackUrl: "https://study.buildora.work/30-architecture/30.1-design-patterns/02-creational/30.1.2.02-factory-method",
    codeSnippet: `class NotificationFactory {
  static create(channel: ChannelType): NotificationProvider {
    switch (channel) {
      case 'WHATSAPP': return new WhatsAppProvider();
      case 'SMS':      return new TwilioSmsProvider();
      case 'EMAIL':    return new ResendEmailProvider();
    }
  }
}`,
  },
  {
    id: "adapter-ehr",
    name: "Adapter Pattern for Health Record Interoperability",
    category: "structural",
    categoryLabel: "Structural (GoF)",
    problem: "Incompatible legacy diagnostic machine formats (HL7 v2, proprietary CSV) and modern FHIR JSON APIs.",
    solution: "Implement domain adapters that convert disparate diagnostic lab schemas into standardized internal patient records.",
    productionUse: "Docita Healthcare OS: Lab/report integration paths with validation and external-provider evidence still required.",
    stackUrl: "https://study.buildora.work/30-architecture/30.1-design-patterns/03-structural/30.1.3.01-adapter",
    codeSnippet: `class HL7DiagnosticAdapter implements LabReportTarget {
  constructor(private legacyHL7Message: HL7Payload) {}
  
  toStandardReport(): DiagnosticReport {
    return {
      testCode: this.legacyHL7Message.OBX_3_Identifier,
      value: parseFloat(this.legacyHL7Message.OBX_5_Value),
      unit: this.legacyHL7Message.OBX_6_Units,
    };
  }
}`,
  },
  {
    id: "state-machine",
    name: "Finite State Machine for Patient Journeys",
    category: "behavioral",
    categoryLabel: "Behavioral (GoF)",
    problem: "Invalid state jumps (e.g. prescribing medication before doctor check-in or billing unrendered services).",
    solution: "Formal finite state machine enforcing strict transition matrices, guard conditions, and audit event logs.",
    productionUse: "Docita Healthcare OS: Governs patient flow from Registration -> Triage -> Consultation -> Pharmacy -> Discharge.",
    stackUrl: "https://study.buildora.work/30-architecture/30.1-design-patterns/04-behavioral/30.1.4.04-state",
    codeSnippet: `const ALLOWED_TRANSITIONS: Record<PatientStatus, PatientStatus[]> = {
  REGISTERED: ['TRIAGED', 'CANCELLED'],
  TRIAGED:    ['IN_CONSULTATION'],
  IN_CONSULTATION: ['PHARMACY_PENDING', 'OBSERVATION'],
  PHARMACY_PENDING: ['BILLED'],
  BILLED:     ['DISCHARGED'],
  DISCHARGED: [],
};`,
  },
];

export default function ArchitectureShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory>("all");
  const [activeSnippet, setActiveSnippet] = useState<string | null>(PATTERNS[0].id);

  const filtered = PATTERNS.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  return (
    <section
      id="Architecture"
      aria-label="Systems Architecture and GoF Design Patterns"
      data-chapter-index="02"
      className="portfolio-chapter relative px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
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
              <div className="group flex flex-col justify-between rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-5 sm:p-6 transition-all duration-300 hover:border-[var(--portfolio-accent)]/60 hover:shadow-lg">
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

                    <div>
                      <span className="font-semibold text-[var(--portfolio-ink)]">
                        Architecture Solution:{" "}
                      </span>
                      <span className="text-[var(--portfolio-muted)]">
                        {item.solution}
                      </span>
                    </div>

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
