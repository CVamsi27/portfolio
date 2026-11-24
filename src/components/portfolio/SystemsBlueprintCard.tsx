"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Connections from "../Connections";

type BlueprintId = "rls" | "outbox" | "edge";

interface Blueprint {
  id: BlueprintId;
  shortLabel: string;
  title: string;
  system: string;
  href: string;
  invariant: string;
  verification: string;
  hops: Array<{ step: string; label: string; detail: string }>;
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: "rls",
    shortLabel: "RLS Isolation",
    title: "Tenant-Scoped PostgreSQL Boundary",
    system: "Docita · RLS Rehearsal",
    href: "/work/rls-rehearsal",
    invariant:
      "Unfiltered queries fail closed; cross-tenant writes are rejected at the database layer.",
    verification:
      "Dual-tenant rehearsal + disabled-RLS failing control pass",
    hops: [
      { step: "01", label: "JWT Claim", detail: "clinic_id" },
      { step: "02", label: "SET LOCAL", detail: "tx scope" },
      { step: "03", label: "PG Policy", detail: "deny foreign" },
    ],
  },
  {
    id: "outbox",
    shortLabel: "Crash-Safe Queue",
    title: "Transactional Outbox & Idempotent Workers",
    system: "Docita · Retryglass",
    href: "/work/retryglass",
    invariant:
      "Business write and event append commit atomically; retries never duplicate side effects.",
    verification:
      "Crash-point sweep before/after external effects → Vitest repro",
    hops: [
      { step: "01", label: "DB + Outbox", detail: "single tx" },
      { step: "02", label: "Worker", detail: "idempotency" },
      { step: "03", label: "DLQ Replay", detail: "bounded retry" },
    ],
  },
  {
    id: "edge",
    shortLabel: "Multi-Surface",
    title: "Host-Aware Edge Routing & Isolation",
    system: "Portfolio · Edge Proxy",
    href: "/work/portfolio",
    invariant:
      "One deployment isolates public architecture dossiers from private operational workflows at the edge.",
    verification:
      "Host-header E2E boundary checks + baseline security headers",
    hops: [
      { step: "01", label: "Edge Proxy", detail: "host match" },
      { step: "02", label: "Auth Gate", detail: "owner-only" },
      { step: "03", label: "Static/SSR", detail: "typed UI" },
    ],
  },
];

export default function SystemsBlueprintCard({
  onFilterTech,
}: {
  onFilterTech: (tech: string) => void;
}) {
  const [activeId, setActiveId] = useState<BlueprintId>("rls");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = BLUEPRINTS.find((b) => b.id === activeId) ?? BLUEPRINTS[0];

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % BLUEPRINTS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + BLUEPRINTS.length) % BLUEPRINTS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = BLUEPRINTS.length - 1;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      setActiveId(BLUEPRINTS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <aside
      aria-label="Live systems architecture workbench"
      className="min-w-0 w-full border border-[var(--portfolio-hero-rule)] bg-[var(--portfolio-hero-surface)] p-6 text-[var(--portfolio-hero-ink)]"
    >
      {/* Pure Typographic Identity Header (No Avatar Image) */}
      <div className="border-b border-[var(--portfolio-hero-rule)] pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-2xl font-light leading-none tracking-[-0.025em] text-[var(--portfolio-hero-ink)]">
            Vamsi Krishna
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-hero-muted)]">
            IST · UTC+5:30
          </span>
        </div>
        <p className="mt-1.5 font-sans text-xs font-medium text-[var(--portfolio-hero-ink)]">
          Senior Full Stack Engineer
        </p>
        <p className="mt-0.5 font-sans text-xs text-[var(--portfolio-hero-muted)]">
          Hyderabad, India · Remote Roles
        </p>
      </div>

      {/* Interactive Blueprint Switcher */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-hero-muted)]">
            Architecture Mechanisms
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-hero-muted)]">
            Verified
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Inspect architecture mechanisms"
          className="mt-2.5 flex border-b border-[var(--portfolio-hero-rule)]"
        >
          {BLUEPRINTS.map((bp, idx) => {
            const isSelected = bp.id === activeId;
            return (
              <button
                key={bp.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                id={`blueprint-tab-${bp.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`blueprint-panel-${bp.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveId(bp.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`-mb-px flex-1 cursor-pointer border-b-[1.5px] py-2 font-sans text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-[var(--portfolio-hero-ink)] text-[var(--portfolio-hero-ink)]"
                    : "border-transparent text-[var(--portfolio-hero-muted)] hover:text-[var(--portfolio-hero-ink)]"
                }`}
              >
                {bp.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Visual Topology Pipeline */}
        <div
          role="tabpanel"
          id={`blueprint-panel-${active.id}`}
          aria-labelledby={`blueprint-tab-${active.id}`}
          className="mt-4 space-y-3.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-light leading-snug tracking-[-0.02em] text-[var(--portfolio-hero-ink)]">
                {active.title}
              </h2>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--portfolio-hero-muted)]">
                {active.system}
              </p>
            </div>
            <Link
              href={active.href}
              className="inline-flex shrink-0 items-center gap-1 border-b border-[var(--portfolio-hero-rule)] pb-0.5 font-sans text-xs font-medium text-[var(--portfolio-hero-ink)] transition-colors hover:border-[var(--portfolio-hero-ink)]"
            >
              <span>Case study</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 3-Node Flow Schematic */}
          <div className="grid grid-cols-3 gap-px border border-[var(--portfolio-hero-rule)] bg-[var(--portfolio-hero-rule)]">
            {active.hops.map((hop) => (
              <div
                key={hop.label}
                className="min-w-0 bg-[var(--portfolio-hero-bg)] px-2.5 py-2.5"
              >
                <span className="block font-mono text-[9px] text-[var(--portfolio-hero-muted)]">
                  {hop.step}
                </span>
                <span className="mt-0.5 block truncate font-sans text-xs font-medium text-[var(--portfolio-hero-ink)]">
                  {hop.label}
                </span>
                <span className="block truncate font-mono text-[10px] text-[var(--portfolio-hero-muted)]">
                  {hop.detail}
                </span>
              </div>
            ))}
          </div>

          <p className="font-sans text-xs leading-relaxed text-[var(--portfolio-hero-muted)]">
            {active.invariant}
          </p>
          <p className="border-t border-[var(--portfolio-hero-rule)] pt-2.5 font-mono text-[10px] leading-snug text-[var(--portfolio-hero-muted)]">
            Check: {active.verification}
          </p>
        </div>
      </div>

      {/* Core Technologies Filter */}
      <div className="mt-5 border-t border-[var(--portfolio-hero-rule)] pt-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-hero-muted)]">
            Core Stack
          </span>
          <span className="font-sans text-[11px] text-[var(--portfolio-hero-muted)]">
            Filter work
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[
            "TypeScript",
            "React",
            "NestJS",
            "PostgreSQL",
            "Prisma",
            "BullMQ",
          ].map((tech) => (
            <button
              key={tech}
              type="button"
              onClick={() => onFilterTech(tech)}
              className="cursor-pointer rounded-full border border-[var(--portfolio-hero-rule)] bg-transparent px-2.5 py-1 font-sans text-xs font-medium text-[var(--portfolio-hero-muted)] transition-colors hover:border-[var(--portfolio-hero-ink)] hover:text-[var(--portfolio-hero-ink)]"
              title={`View projects built with ${tech}`}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div className="mt-5 border-t border-[var(--portfolio-hero-rule)] pt-4">
        <div className="portfolio-obsidian-channels">
          <Connections />
        </div>
      </div>
    </aside>
  );
}
