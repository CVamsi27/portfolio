"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Cpu, Terminal } from "lucide-react";
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
    invariant:
      "Unfiltered queries fail closed; cross-tenant writes are rejected at the database layer.",
    verification:
      "Dual-tenant rehearsal + disabled-RLS failing control pass",
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
    invariant:
      "Business write and event append commit atomically; retries never duplicate side effects.",
    verification:
      "Crash-point sweep before/after external effects → Vitest repro",
    hops: [
      { label: "DB + Outbox", detail: "1 TX", status: "ok" },
      { label: "Worker", detail: "idempotency", status: "guard" },
      { label: "DLQ Replay", detail: "bounded retry", status: "ok" },
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
      className="min-w-0 w-full border border-white/15 bg-[#0c0c0f] p-5 text-[#f4f3ee]"
    >
      {/* Author Header */}
      <div className="flex items-center gap-3.5 border-b border-white/12 pb-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-white/20 bg-[#141418]">
          <Image
            src="/SE.webp"
            alt="Vamsi Krishna Chandaluri"
            width={56}
            height={56}
            className="h-full w-full object-cover grayscale contrast-110"
            priority
          />
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 border border-[#0c0c0f] bg-[#ff3b2f]"
            title="Active & Available"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl leading-none tracking-[-0.01em] text-[#f4f3ee]">
            Vamsi Krishna
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#ff3b2f]">
            Senior Full Stack Engineer
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-[#8e8e98]">
            Hyderabad, India · Remote Roles
          </p>
        </div>
      </div>

      {/* Interactive Blueprint Switcher */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c9ca6]">
            <Terminal className="h-3 w-3 text-[#ff3b2f]" />
            Systems Inspector
          </span>
          <span className="inline-flex items-center gap-1.5 border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#f4f3ee]">
            <span className="h-1.5 w-1.5 bg-[#ff3b2f]" aria-hidden="true" />
            Verified
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Inspect architecture mechanisms"
          className="mt-3 grid grid-cols-3 border border-white/15 bg-[#08080a]"
        >
          {BLUEPRINTS.map((bp, idx) => {
            const isSelected = bp.id === activeId;
            return (
              <button
                key={bp.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveId(bp.id)}
                className={`cursor-pointer px-2 py-2 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors ${
                  idx < BLUEPRINTS.length - 1 ? "border-r border-white/12" : ""
                } ${
                  isSelected
                    ? "bg-[#f4f3ee] font-semibold text-[#08080a]"
                    : "text-[#8e8e98] hover:text-[#f4f3ee]"
                }`}
              >
                {bp.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Visual Topology Pipeline */}
        <div className="mt-3 border border-white/12 bg-[#08080a] p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-lg leading-tight text-[#f4f3ee]">
              {active.title}
            </h2>
            <Link
              href={active.href}
              className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ff3b2f] hover:underline"
            >
              <span>Inspect</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8e8e98]">
            {active.system}
          </p>

          {/* 3-Node Flow Schematic */}
          <div className="mt-3.5 grid grid-cols-3 items-center gap-1.5">
            {active.hops.map((hop, idx) => (
              <div
                key={hop.label}
                className={`relative min-w-0 border px-2 py-2 text-center ${
                  hop.status === "guard"
                    ? "border-[#ff3b2f]/60 bg-[#ff3b2f]/10"
                    : "border-white/15 bg-[#111116]"
                }`}
              >
                <span className="block truncate font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-[#f4f3ee]">
                  {hop.label}
                </span>
                <span
                  className={`mt-0.5 block truncate font-mono text-[9px] ${
                    hop.status === "guard" ? "text-[#ff3b2f]" : "text-[#8e8e98]"
                  }`}
                >
                  {hop.detail}
                </span>
                {idx < active.hops.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-1.5 top-1/2 z-10 -translate-y-1/2 font-mono text-[10px] text-[#6e6e78]"
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-3.5 text-xs leading-relaxed text-[#b8b8c2]">
            {active.invariant}
          </p>
          <div className="mt-3 flex items-start gap-1.5 border-t border-white/10 pt-2.5 font-mono text-[10px] leading-snug text-[#d4d3ce]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff3b2f]" />
            <span>{active.verification}</span>
          </div>
        </div>
      </div>

      {/* Core Technologies Filter */}
      <div className="mt-4 border-t border-white/12 pt-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9c9ca6]">
            <Cpu className="h-3 w-3 text-[#ff3b2f]" />
            Core Stack
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#6e6e78]">
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
              className="cursor-pointer border border-white/15 bg-transparent px-2 py-1 font-mono text-[10px] text-[#d4d3ce] transition-colors hover:border-[#ff3b2f] hover:text-white"
              title={`View projects built with ${tech}`}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div className="mt-4 border-t border-white/12 pt-4">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9c9ca6]">
          Channels
        </p>
        <div className="portfolio-obsidian-channels">
          <Connections />
        </div>
      </div>
    </aside>
  );
}
