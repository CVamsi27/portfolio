"use client";

import { useState } from "react";
import Image from "next/image";
import { SKILLS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import {
  Layout,
  Server,
  ShieldCheck,
  Cpu,
  Sparkles,
  Terminal,
} from "lucide-react";

const CAPABILITIES = [
  {
    title: "Product Engineering",
    icon: Layout,
    lead: "Pixel-accurate, performant interfaces built with deep design system rigor.",
    items: [
      "React & Next.js full-stack architectures",
      "Accessible, keyboard-navigable user flows (WCAG)",
      "Design systems & component tokens",
      "TypeScript type safety & strict schemas",
    ],
  },
  {
    title: "Backend & Systems",
    icon: Server,
    lead: "High-throughput, reliable APIs and resilient multi-tenant data pipelines.",
    items: [
      "NestJS, Express & Node.js microservices",
      "PostgreSQL schemas, RLS & migration safety",
      "Transactional Outbox, queues & advisory locks",
      "Idempotent webhooks & payment integrations",
    ],
  },
  {
    title: "Quality & Infrastructure",
    icon: ShieldCheck,
    lead: "Defense-in-depth verification ensuring zero regressions in production.",
    items: [
      "85%+ coverage via Jest, Vitest & Playwright E2E",
      "Automated CI/CD pipelines with GitHub Actions",
      "Dockerized environments & snapshot validation",
      "PHI-safe audit trails & deny-by-default ABAC",
    ],
  },
  {
    title: "Engineering Practice",
    icon: Cpu,
    lead: "Pragmatic ownership focused on business impact and high team velocity.",
    items: [
      "Full lifecycle feature ownership from spec to deploy",
      "Clean bounded contexts and decoupled modules",
      "Mentoring engineers through design reviews",
      "Data-driven p95 performance profiling & tuning",
    ],
  },
];

type TechCategory = "all" | "frontend" | "backend" | "devops";

const ADDITIONAL_TECH: { name: string; category: TechCategory }[] = [
  { name: "NestJS", category: "backend" },
  { name: "Prisma ORM", category: "backend" },
  { name: "TanStack Query", category: "frontend" },
  { name: "Tailwind CSS", category: "frontend" },
  { name: "Docker", category: "devops" },
  { name: "Playwright", category: "devops" },
  { name: "Jest / Vitest", category: "devops" },
  { name: "Zod", category: "backend" },
  { name: "GitHub Actions", category: "devops" },
  { name: "WebSockets", category: "backend" },
];

const TECH_CATEGORIES: Record<string, TechCategory> = {
  React: "frontend",
  NextJS: "frontend",
  Typescript: "frontend",
  Javascript: "frontend",
  HTML: "frontend",
  CSS: "frontend",
  Postgresql: "backend",
  Python: "backend",
  Java: "backend",
  Git: "devops",
};

const Skills = () => {
  const [activeCategory, setActiveCategory] = useState<TechCategory>("all");

  const filteredCoreSkills =
    activeCategory === "all"
      ? SKILLS
      : SKILLS.filter((s) => TECH_CATEGORIES[s.alt] === activeCategory);

  const filteredExtraSkills =
    activeCategory === "all"
      ? ADDITIONAL_TECH
      : ADDITIONAL_TECH.filter((s) => s.category === activeCategory);

  return (
    <section id="Capabilities" className="portfolio-section px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="03 / Disciplines & Stack"
          title="Capabilities & technology shelf"
          description="I care about the seam between a thoughtful interface, a dependable backend architecture, and the team that builds and scales both."
        />

        {/* 4 Architectural Pillars */}
        <div className="portfolio-capability-grid">
          {CAPABILITIES.map((group, index) => {
            const Icon = group.icon;
            return (
              <Reveal
                key={group.title}
                delay={index * 60}
                className="portfolio-capability-group"
              >
                <div className="flex items-center justify-between">
                  <span className="portfolio-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <h3>{group.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--portfolio-muted)]">
                  {group.lead}
                </p>

                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>

        {/* Interactive Tech Stack Shelf */}
        <Reveal delay={120} className="portfolio-tech-shelf">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--portfolio-rule)] pb-4">
            <div>
              <p className="portfolio-meta-label">Production Tooling & Libraries</p>
              <p className="mt-1 text-xs text-[var(--portfolio-muted)]">
                Core technologies actively deployed across Docita, microservices, and platforms.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Tools" },
                { id: "frontend", label: "Frontend & UI" },
                { id: "backend", label: "Backend & Data" },
                { id: "devops", label: "DevOps & QA" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as TechCategory)}
                  className={
                    activeCategory === tab.id
                      ? "portfolio-filter-tab is-active"
                      : "portfolio-filter-tab"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="font-utility text-[0.65rem] font-bold uppercase tracking-wider text-[var(--portfolio-muted)] mb-3">
              Core Languages & Frameworks
            </p>
            <div className="flex flex-wrap gap-2.5">
              {filteredCoreSkills.map((skill) => (
                <div key={skill.alt} className="portfolio-tech-chip">
                  <Image
                    src={skill.img}
                    alt={skill.alt}
                    width={18}
                    height={18}
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                  <span>{skill.alt}</span>
                </div>
              ))}
            </div>

            <p className="font-utility text-[0.65rem] font-bold uppercase tracking-wider text-[var(--portfolio-muted)] mt-6 mb-3">
              Ecosystem & Infrastructure
            </p>
            <div className="flex flex-wrap gap-2.5">
              {filteredExtraSkills.map((tool) => (
                <div key={tool.name} className="portfolio-tech-chip">
                  <Terminal className="h-3.5 w-3.5 text-[var(--portfolio-accent)]" />
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Skills;

