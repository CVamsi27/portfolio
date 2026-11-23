"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";
import {
  Shield,
  Server,
  Layers,
  Activity,
  X,
  CheckCircle2,
  Lock,
  Database,
  ArrowRight,
  Cpu,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ArchTab = "overview" | "security" | "outbox" | "metrics";

const emptySubscribe = () => () => {};

export default function DocitaArchitectureModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ArchTab>("overview");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const dialogRef = useDialogFocus(open, onClose);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Docita System Architecture Inspector"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)]">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-light tracking-[-0.02em] text-[var(--portfolio-ink)]">
                  Docita Architecture Inspector
                </h2>
                <span className="portfolio-impact-pill">Production SaaS</span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--portfolio-muted)]">
                Multi-Tenant Clinical Operating System · 5 Core Clinical Workflows
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close architecture inspector"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-ink)] hover:text-[var(--portfolio-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] px-5 sm:px-6 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Pipeline Flow" },
            { id: "security", label: "PostgreSQL RLS & ABAC" },
            { id: "outbox", label: "Transactional Outbox" },
            { id: "metrics", label: "Scale & Latency" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ArchTab)}
              className={cn(
                "-mb-px border-b-[1.5px] py-3 px-3.5 font-sans text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "border-[var(--portfolio-ink)] text-[var(--portfolio-ink)]"
                  : "border-transparent text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 font-sans text-sm text-[var(--portfolio-ink)]">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <p className="text-xs leading-relaxed text-[var(--portfolio-muted)]">
                Request paths combine authentication, scoped authorization and persistence. Outbox work belongs to selected business operations; inspect the concrete path and its transaction boundary.
              </p>

              {/* Border-Collapsed Flow Pipeline */}
              <div className="grid gap-px border border-[var(--portfolio-rule)] bg-[var(--portfolio-rule)] sm:grid-cols-4">
                <div className="bg-[var(--portfolio-surface)] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]">
                    Stage 01
                  </div>
                  <div className="mt-1.5 font-sans text-xs font-semibold text-[var(--portfolio-ink)]">
                    Client Layer
                  </div>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--portfolio-muted)]">
                    React 19 + TanStack Query with shared Zod contracts
                  </p>
                </div>

                <div className="bg-[var(--portfolio-surface)] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]">
                    Stage 02
                  </div>
                  <div className="mt-1.5 font-sans text-xs font-semibold text-[var(--portfolio-ink)]">
                    Edge &amp; Gateway
                  </div>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--portfolio-muted)]">
                    NestJS AuthGuard + Deny-by-default ABAC policies
                  </p>
                </div>

                <div className="bg-[var(--portfolio-surface)] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]">
                    Stage 03
                  </div>
                  <div className="mt-1.5 font-sans text-xs font-semibold text-[var(--portfolio-ink)]">
                    PostgreSQL RLS
                  </div>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--portfolio-muted)]">
                    Row-Level Security enforcing tenant boundary at DB engine
                  </p>
                </div>

                <div className="bg-[var(--portfolio-surface)] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]">
                    Stage 04
                  </div>
                  <div className="mt-1.5 font-sans text-xs font-semibold text-[var(--portfolio-ink)]">
                    Outbox &amp; Workers
                  </div>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--portfolio-muted)]">
                    Transactional outbox records intent; workers handle retry and recovery
                  </p>
                </div>
              </div>

              <div className="border border-[var(--portfolio-rule)] border-l-2 border-l-[var(--portfolio-ink)] bg-[var(--portfolio-surface)] p-4">
                <h4 className="font-display text-lg font-light text-[var(--portfolio-ink)]">
                  Tenant Boundary and Its Evidence
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--portfolio-muted)]">
                  RLS policies add a database boundary when enabled with the intended role and transaction context. Privileged roles and bypass paths require separate checks; scoped API authorization remains necessary.
                </p>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--portfolio-ink)]" />
                <h3 className="font-display text-xl font-light tracking-[-0.02em]">
                  PostgreSQL Row-Level Security &amp; Deny-by-Default ABAC
                </h3>
              </div>
              <p className="text-xs text-[var(--portfolio-muted)] leading-relaxed">
                Tenant isolation depends on API authorization, database role privileges and transaction context. This illustrative policy explains the mechanism; it is not a dump of the production schema:
              </p>

              <pre className="overflow-x-auto border border-[var(--portfolio-arch-rule)] bg-[#0b0b0e] p-4 font-mono text-[0.72rem] leading-relaxed text-[#e6e5e0]">
{`-- Illustrative schema; verify the actual role and context path
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON patients
  AS PERMISSIVE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);`}
              </pre>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="flex items-start gap-2.5 border border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--portfolio-ink)] mt-0.5" />
                  <span className="text-[var(--portfolio-muted)]">Deny-by-default role permissions for doctors, front-desk, and billing staff.</span>
                </div>
                <div className="flex items-start gap-2.5 border border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--portfolio-ink)] mt-0.5" />
                  <span className="text-[var(--portfolio-muted)]">Sensitive-data audit logging; coverage and retention need verification.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "outbox" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[var(--portfolio-ink)]" />
                <h3 className="font-display text-xl font-light tracking-[-0.02em]">
                  Transactional Outbox &amp; Idempotent Queues
                </h3>
              </div>
              <p className="text-xs text-[var(--portfolio-muted)] leading-relaxed">
                When a doctor completes an appointment or billing transaction, notifications (WhatsApp/SMS) and ledger writes must not fail silently if third-party APIs timeout.
              </p>

              <div className="divide-y divide-[var(--portfolio-rule)] border border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)]">
                <div className="p-3.5 text-xs text-[var(--portfolio-muted)]">
                  <strong className="font-semibold text-[var(--portfolio-ink)]">01 · Atomic DB Transaction:</strong> Business write and event append can share a transaction when the producer supplies it; verify the selected path.
                </div>
                <div className="p-3.5 text-xs text-[var(--portfolio-muted)]">
                  <strong className="font-semibold text-[var(--portfolio-ink)]">02 · Durable Claim and Completion:</strong> Verify atomic claim, owner/fencing and completion behavior against the actual queue implementation.
                </div>
                <div className="p-3.5 text-xs text-[var(--portfolio-muted)]">
                  <strong className="font-semibold text-[var(--portfolio-ink)]">03 · Exponential Retries &amp; Dead-Letter Queue:</strong> Retryable failures use a bounded retry policy; persistent failures move to DLQ for manual inspection.
                </div>
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--portfolio-ink)]" />
                <h3 className="font-display text-xl font-light tracking-[-0.02em]">
                  Product Scope &amp; Measurement Boundaries
                </h3>
              </div>

              <div className="grid gap-px border border-[var(--portfolio-rule)] bg-[var(--portfolio-rule)] sm:grid-cols-2">
                <div className="bg-[var(--portfolio-surface)] p-5 text-center">
                  <div className="font-display text-3xl font-light tracking-[-0.02em] text-[var(--portfolio-ink)]">
                    5
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--portfolio-muted)]">
                    Named Clinical Workflows
                  </div>
                </div>

                <div className="bg-[var(--portfolio-surface)] p-5 text-center">
                  <div className="font-display text-3xl font-light tracking-[-0.02em] text-[var(--portfolio-ink)]">
                    30 days
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--portfolio-muted)]">
                    Monthly OPD &amp; Consult Workflows
                  </div>
                </div>

                <div className="bg-[var(--portfolio-surface)] p-5 text-center">
                  <div className="font-display text-2xl font-light tracking-[-0.02em] text-[var(--portfolio-ink)]">
                    Unavailable
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--portfolio-muted)]">
                    Latency Without Request Samples
                  </div>
                </div>

                <div className="bg-[var(--portfolio-surface)] p-5 text-center">
                  <div className="font-display text-2xl font-light tracking-[-0.02em] text-[var(--portfolio-ink)]">
                    Not claimed
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--portfolio-muted)]">
                    Availability Requires Separate Evidence
                  </div>
                </div>
              </div>

              <p className="text-xs text-[var(--portfolio-muted)] leading-relaxed">
                The implemented dashboard separates empty activity, missing telemetry and failed reads. Retained request samples do not establish customer adoption, a latency improvement or an availability SLO; verify the deployed revision before calling it live.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] px-5 py-3 sm:px-6 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--portfolio-muted)]">
            Architected &amp; Deployed by Vamsi Krishna Chandaluri
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-4 py-1.5 font-sans text-xs font-medium text-[var(--portfolio-ink)] transition-colors hover:border-[var(--portfolio-ink)]"
          >
            Close Inspector (Esc)
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
