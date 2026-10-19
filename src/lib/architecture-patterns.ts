/**
 * Systems architecture showcase: the pattern set rendered on the portfolio's
 * Architecture chapter. The Bible deploys all 23 GoF patterns; the showcases
 * here are the ones that explain real decisions in the shipped projects, so
 * case studies can link to them by id.
 */
export interface ArchitecturePattern {
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

export const ARCHITECTURE_PATTERNS: ArchitecturePattern[] = [
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

/**
 * The six patterns rendered on the portfolio chapter (the full 23-pattern
 * library lives in the Senior Full Stack Bible, linked from the chapter).
 */
export const SHOWCASE_PATTERN_IDS = [
  "transactional-outbox",
  "rls-abac",
  "observer-sse",
  "factory-method",
  "adapter-ehr",
  "state-machine",
] as const;

export function patternById(id: string): ArchitecturePattern | undefined {
  return ARCHITECTURE_PATTERNS.find((pattern) => pattern.id === id);
}

/** Link to the complete GoF pattern library in the Bible. */
export const PATTERN_LIBRARY_URL =
  "https://study.buildora.work/30-architecture/30.1-design-patterns/INDEX.html";
