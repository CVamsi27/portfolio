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
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-[var(--portfolio-ink)]">
                  Docita Architecture Inspector
                </h2>
                <span className="portfolio-impact-pill">Production SaaS</span>
              </div>
              <p className="font-utility text-xs text-[var(--portfolio-muted)]">
                Multi-Tenant Clinical Operating System · 5 Core Clinical Workflows
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close architecture inspector"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--portfolio-rule)] bg-muted/20 px-5 sm:px-6 overflow-x-auto scrollbar-none">
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
                "border-b-2 py-3 px-3 font-utility text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "border-[var(--portfolio-accent)] text-[var(--portfolio-accent)]"
                  : "border-transparent text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-sm text-[var(--portfolio-ink)]">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <p className="text-xs leading-relaxed text-[var(--portfolio-muted)]">
                Request paths combine authentication, scoped authorization and persistence. Outbox work belongs to selected business operations; inspect the concrete path and its transaction boundary.
              </p>

              {/* Visual Flow Pipeline */}
              <div className="grid gap-3 sm:grid-cols-4 text-center">
                <div className="rounded-xl border border-[var(--portfolio-rule)] bg-muted/30 p-3.5">
                  <div className="font-utility text-[0.65rem] font-bold text-[var(--portfolio-accent)] uppercase">
                    Stage 1
                  </div>
                  <div className="mt-1 font-semibold text-xs">Client Layer</div>
                  <p className="mt-1 text-[0.68rem] text-[var(--portfolio-muted)]">
                    React 19 + TanStack Query with shared Zod contracts
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--portfolio-rule)] bg-muted/30 p-3.5">
                  <div className="font-utility text-[0.65rem] font-bold text-[var(--portfolio-accent)] uppercase">
                    Stage 2
                  </div>
                  <div className="mt-1 font-semibold text-xs">Edge &amp; Gateway</div>
                  <p className="mt-1 text-[0.68rem] text-[var(--portfolio-muted)]">
                    NestJS AuthGuard + Deny-by-default ABAC policies
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--portfolio-rule)] bg-muted/30 p-3.5">
                  <div className="font-utility text-[0.65rem] font-bold text-[var(--portfolio-accent)] uppercase">
                    Stage 3
                  </div>
                  <div className="mt-1 font-semibold text-xs">PostgreSQL RLS</div>
                  <p className="mt-1 text-[0.68rem] text-[var(--portfolio-muted)]">
                    Row-Level Security enforcing tenant boundary at DB engine
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--portfolio-rule)] bg-muted/30 p-3.5">
                  <div className="font-utility text-[0.65rem] font-bold text-[var(--portfolio-accent)] uppercase">
                    Stage 4
                  </div>
                  <div className="mt-1 font-semibold text-xs">Outbox &amp; Workers</div>
                  <p className="mt-1 text-[0.68rem] text-[var(--portfolio-muted)]">
                    Transactional outbox records intent; workers handle retry and recovery
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)]/40 p-4">
                <h4 className="font-display text-xs font-bold text-[var(--portfolio-ink)]">
                  Tenant Boundary and Its Evidence
                </h4>
                <p className="mt-1 text-xs text-[var(--portfolio-muted)]">
                  RLS policies add a database boundary when enabled with the intended role and transaction context. Privileged roles and bypass paths require separate checks; scoped API authorization remains necessary.
                </p>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--portfolio-accent)]" />
                <h3 className="font-display text-sm font-bold">
                  PostgreSQL Row-Level Security &amp; Deny-by-Default ABAC
                </h3>
              </div>
              <p className="text-xs text-[var(--portfolio-muted)] leading-relaxed">
                Tenant isolation depends on API authorization, database role privileges and transaction context. This illustrative policy explains the mechanism; it is not a dump of the production schema:
              </p>

              <pre className="overflow-x-auto rounded-xl border border-[var(--portfolio-rule)] bg-neutral-950 p-3.5 font-mono text-[0.72rem] text-emerald-400">
{`-- Illustrative schema; verify the actual role and context path
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON patients
  AS PERMISSIVE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);`}
              </pre>

              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div className="flex items-start gap-2 rounded-lg border border-[var(--portfolio-rule)] p-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Deny-by-default role permissions for doctors, front-desk, and billing staff.</span>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-[var(--portfolio-rule)] p-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Sensitive-data audit logging; coverage and retention need verification.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "outbox" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[var(--portfolio-accent)]" />
                <h3 className="font-display text-sm font-bold">
                  Transactional Outbox &amp; Idempotent Queues
                </h3>
              </div>
              <p className="text-xs text-[var(--portfolio-muted)] leading-relaxed">
                When a doctor completes an appointment or billing transaction, notifications (WhatsApp/SMS) and ledger writes must not fail silently if third-party APIs timeout.
              </p>

              <div className="space-y-2">
                <div className="rounded-xl border border-[var(--portfolio-rule)] bg-muted/30 p-3 text-xs">
                  <strong className="text-[var(--portfolio-ink)]">1. Atomic DB Transaction:</strong> Business write and event append can share a transaction when the producer supplies it; verify the selected path.
                </div>
                <div className="rounded-xl border border-[var(--portfolio-rule)] bg-muted/30 p-3 text-xs">
                  <strong className="text-[var(--portfolio-ink)]">2. Durable Claim and Completion:</strong> Verify atomic claim, owner/fencing and completion behavior against the actual queue implementation.
                </div>
                <div className="rounded-xl border border-[var(--portfolio-rule)] bg-muted/30 p-3 text-xs">
                  <strong className="text-[var(--portfolio-ink)]">3. Exponential Retries &amp; Dead-Letter Queue:</strong> Retryable failures use a bounded retry policy; persistent failures move to DLQ for manual inspection.
                </div>
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--portfolio-accent)]" />
                <h3 className="font-display text-sm font-bold">
                  Product Scope &amp; Measurement Boundaries
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--portfolio-rule)] p-4 text-center">
                  <div className="font-display text-2xl font-bold text-[var(--portfolio-accent)]">
                    5
                  </div>
                  <div className="font-utility text-xs text-[var(--portfolio-muted)]">
                    Named Clinical Workflows
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--portfolio-rule)] p-4 text-center">
                  <div className="font-display text-2xl font-bold text-[var(--portfolio-accent)]">
                    30 days
                  </div>
                  <div className="font-utility text-xs text-[var(--portfolio-muted)]">
                    Monthly OPD &amp; Consult Workflows
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--portfolio-rule)] p-4 text-center">
                  <div className="font-display text-2xl font-bold text-emerald-500">
                    Unavailable
                  </div>
                  <div className="font-utility text-xs text-[var(--portfolio-muted)]">
                    Latency Without Request Samples
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--portfolio-rule)] p-4 text-center">
                  <div className="font-display text-2xl font-bold text-emerald-500">
                    Not claimed
                  </div>
                  <div className="font-utility text-xs text-[var(--portfolio-muted)]">
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
        <div className="flex items-center justify-between border-t border-[var(--portfolio-rule)] bg-muted/20 px-5 py-3 sm:px-6 text-xs">
          <span className="font-utility text-[0.68rem] text-[var(--portfolio-muted)]">
            Architected &amp; Deployed by Vamsi Krishna Chandaluri
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-3 py-1.5 font-utility text-xs font-semibold text-[var(--portfolio-ink)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
          >
            Close Inspector (Esc)
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
