"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Layers, Cpu, Terminal } from "lucide-react";
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
  hops: Array<{ label: string; detail: string; status: "ok" | "guard" }>;
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: "rls",
    shortLabel: "RLS Isolation",
    title: "Tenant-Scoped PostgreSQL Boundary",
    system: "Docita · RLS Rehearsal",
    href: "/work/rls-rehearsal",
    invariant: "Unfiltered queries fail closed; cross-tenant writes are rejected at the database layer.",
    verification: "Dual-tenant rehearsal + disabled-RLS failing control pass",
    hops: [
      { label: "JWT Claim", detail: "clinic_id", status: "ok" },
      { label: "SET LOCAL", detail: "tx scope", status: "ok" },
      { label: "PG Policy", detail: "deny foreign", status: "guard" },
    ],
  },
  {
    id: "outbox",
    shortLabel: "Crash-Safe Queue",
    title: "Transactional Outbox & Idempotent Workers",
    system: "Docita · Retryglass",
    href: "/work/retryglass",
    invariant: "Business write and event append commit atomically; retries never duplicate side effects.",
    verification: "Crash-point sweep before/after external effects → Vitest repro",
    hops: [
      { label: "DB + Outbox", detail: "1 TX", status: "ok" },
      { label: "Worker", detail: "idempotency", status: "guard" },
      { label: "DLQ Replay", detail: "bounded retry", status: "ok" },
    ],
  },
  {
    id: "edge",
    shortLabel: "Multi-Surface",
    title: "Host-Aware Edge Routing & Study Engine",
    system: "Portfolio · Full Stack Bible",
    href: "/work/senior-full-stack-bible",
    invariant: "One deployment cleanly isolates public work, private tracking, and 600-chapter study docs.",
    verification: "Host-header E2E boundary checks + automated link/freshness CI",
    hops: [
      { label: "Edge Proxy", detail: "host match", status: "ok" },
      { label: "Auth Gate", detail: "owner-only", status: "guard" },
      { label: "Static/SSR", detail: "typed UI", status: "ok" },
    ],
  },
];

export default function SystemsBlueprintCard({
  onFilterTech,
}: {
  onFilterTech: (tech: string) => void;
}) {
  const [activeId, setActiveId] = useState<BlueprintId>("rls");
  const active = BLUEPRINTS.find((b) => b.id === activeId) ?? BLUEPRINTS[0];

  return (
    <aside
      aria-label="Live systems architecture workbench"
      className="portfolio-hero__aside portfolio-obsidian-glass min-w-0 w-full"
    >
      {/* Author Header */}
      <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-blue-400/40 bg-[#0e1118] shadow-sm">
          <Image
            src="/SE.webp"
            alt="Vamsi Krishna Chandaluri"
            width={56}
            height={56}
            className="h-full w-full object-cover"
            priority
          />
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0e1118] bg-emerald-400"
            title="Active & Available"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-white">
            Vamsi Krishna
          </p>
          <p className="font-utility text-[11px] font-medium text-blue-300">
            Senior Full Stack Engineer
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
            Hyderabad, India · Remote full-stack roles
          </p>
        </div>
      </div>

      {/* Interactive Blueprint Switcher */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-300">
            <Terminal className="h-3 w-3" />
            Systems Inspector
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
            In Production
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Inspect architecture mechanisms"
          className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/40 p-1"
        >
          {BLUEPRINTS.map((bp) => {
            const isSelected = bp.id === activeId;
            return (
              <button
                key={bp.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveId(bp.id)}
                className={`rounded-md px-2 py-1.5 font-mono text-[10px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-500/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-blue-400/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {bp.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Visual Topology Pipeline */}
        <div className="mt-3 rounded-xl border border-white/10 bg-[#090B10]/85 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold text-white">
              {active.title}
            </h2>
            <Link
              href={active.href}
              className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] font-semibold text-blue-300 hover:text-blue-200"
            >
              <span>Inspect</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
            {active.system}
          </p>

          {/* 3-Node Flow Schematic */}
          <div className="mt-3 grid grid-cols-3 items-center gap-1.5">
            {active.hops.map((hop, idx) => (
              <div
                key={hop.label}
                className={`relative min-w-0 rounded-lg border px-1.5 py-2 text-center ${
                  hop.status === "guard"
                    ? "border-amber-400/35 bg-amber-500/10"
                    : "border-blue-400/25 bg-blue-500/10"
                }`}
              >
                <span className="block truncate font-mono text-[9px] font-semibold text-white">
                  {hop.label}
                </span>
                <span
                  className={`mt-0.5 block truncate font-mono text-[9px] ${
                    hop.status === "guard" ? "text-amber-300" : "text-blue-300"
                  }`}
                >
                  {hop.detail}
                </span>
                {idx < active.hops.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-1.5 top-1/2 z-10 -translate-y-1/2 font-mono text-[10px] text-slate-500"
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            {active.invariant}
          </p>
          <div className="mt-2.5 flex items-start gap-1.5 border-t border-white/10 pt-2 font-mono text-[10px] leading-snug text-emerald-300/90">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span>{active.verification}</span>
          </div>
        </div>
      </div>

      {/* Study Library Direct Link */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-300" />
            <h3 className="font-display text-xs font-bold text-white">
              Senior Full Stack Bible
            </h3>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            600 chapters · 23 patterns · 31 case studies
          </p>
        </div>
        <a
          href="https://study.buildora.work"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/15 px-2.5 py-1 font-mono text-[10px] font-semibold text-blue-200 transition-colors hover:bg-blue-500/25"
        >
          <span>Read</span>
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      {/* Core Technologies Filter */}
      <div className="mt-4 border-t border-white/10 pt-3.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Cpu className="h-3 w-3 text-blue-300" />
            Core Stack
          </span>
          <span className="font-mono text-[9px] text-slate-500">
            Click to filter work
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["TypeScript", "React", "NestJS", "PostgreSQL", "Prisma", "BullMQ"].map(
            (tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => onFilterTech(tech)}
                className="cursor-pointer rounded-md border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] font-medium text-slate-200 transition-all hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-white"
                title={`View projects built with ${tech}`}
              >
                {tech}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Channels */}
      <div className="mt-4 border-t border-white/10 pt-3.5">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Connect &amp; Channels
        </p>
        <div className="portfolio-obsidian-channels">
          <Connections />
        </div>
      </div>
    </aside>
  );
}
