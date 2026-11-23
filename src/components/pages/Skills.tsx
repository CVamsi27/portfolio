"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { SKILLS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  {
    title: "Product Engineering",
    lead: "Precision interfaces built with strict accessibility and design-system rigor.",
    items: [
      "React & Next.js full-stack architectures",
      "Accessible, keyboard-navigable flows (WCAG)",
      "Design systems & semantic tokens",
      "TypeScript strictness & shared schemas",
    ],
  },
  {
    title: "Backend & Systems",
    lead: "Reliable APIs and resilient multi-tenant PostgreSQL data pipelines.",
    items: [
      "NestJS, Express & Node.js microservices",
      "PostgreSQL schemas, RLS & safe migrations",
      "Transactional outbox, queues & locks",
      "Webhook verification & idempotency",
    ],
  },
  {
    title: "Quality & Infrastructure",
    lead: "Executable failure-path tests and release checks for sensitive workflows.",
    items: [
      "Jest, Vitest & Playwright failure-path checks",
      "Automated CI/CD with GitHub Actions",
      "Dockerized fixtures & snapshot validation",
      "Audit logging & resource authorization",
    ],
  },
  {
    title: "Engineering Practice",
    lead: "End-to-end ownership focused on durability, clarity, and team velocity.",
    items: [
      "Full lifecycle ownership from spec to prod",
      "Clean bounded contexts & decoupled modules",
      "Mentoring engineers through design reviews",
      "Data-driven p95 query & latency tuning",
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

const SHELF_TABS: { id: TechCategory; label: string }[] = [
  { id: "all", label: "All Tools" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend & Data" },
  { id: "devops", label: "DevOps & QA" },
];

const Skills = () => {
  const [activeCategory, setActiveCategory] = useState<TechCategory>("all");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredCoreSkills =
    activeCategory === "all"
      ? SKILLS
      : SKILLS.filter((s) => TECH_CATEGORIES[s.alt] === activeCategory);

  const filteredExtraSkills =
    activeCategory === "all"
      ? ADDITIONAL_TECH
      : ADDITIONAL_TECH.filter((s) => s.category === activeCategory);

  const getCount = (id: TechCategory) => {
    const core =
      id === "all"
        ? SKILLS.length
        : SKILLS.filter((s) => TECH_CATEGORIES[s.alt] === id).length;
    const extra =
      id === "all"
        ? ADDITIONAL_TECH.length
        : ADDITIONAL_TECH.filter((s) => s.category === id).length;
    return core + extra;
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      const next = (index + 1) % SHELF_TABS.length;
      tabRefs.current[next]?.focus();
      setActiveCategory(SHELF_TABS[next].id);
    } else if (e.key === "ArrowLeft") {
      const prev = (index - 1 + SHELF_TABS.length) % SHELF_TABS.length;
      tabRefs.current[prev]?.focus();
      setActiveCategory(SHELF_TABS[prev].id);
    }
  };

  const totalTools = filteredCoreSkills.length + filteredExtraSkills.length;

  return (
    <section
      id="Capabilities"
      className="portfolio-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="05 // Disciplines & Stack"
          title="Capabilities & technology shelf"
          description="Operating at the seam between a clear product interface, a dependable backend architecture, and the engineering habits that keep both healthy."
        />

        {/* 4 Open Top-Ruled Architectural Pillars */}
        <div className="portfolio-capability-grid">
          {CAPABILITIES.map((group, index) => (
            <Reveal
              key={group.title}
              delay={index * 40}
              className="portfolio-capability-group"
            >
              <span className="portfolio-index">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3>{group.title}</h3>
              <p className="mt-2.5 font-sans text-xs leading-relaxed text-[var(--portfolio-muted)]">
                {group.lead}
              </p>

              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* Interactive Architectural Tech Shelf */}
        <Reveal delay={80} className="portfolio-tech-shelf">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="portfolio-meta-label">
                Production Tooling &amp; Libraries
              </p>
              <p className="mt-1 font-sans text-xs text-[var(--portfolio-muted)]">
                Core technologies actively deployed across Docita,
                microservices, and verification harnesses.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter skills by discipline"
              className="portfolio-filter-tabs"
            >
              {SHELF_TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, i)}
                  className={
                    activeCategory === tab.id
                      ? "portfolio-filter-tab is-active"
                      : "portfolio-filter-tab"
                  }
                >
                  <span>{tab.label}</span>
                  <span
                    className={
                      activeCategory === tab.id
                        ? "portfolio-filter-tab__count portfolio-filter-tab__count--active"
                        : "portfolio-filter-tab__count"
                    }
                  >
                    {getCount(tab.id)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8" key={activeCategory}>
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-muted)]">
                {totalTools} tool{totalTools !== 1 ? "s" : ""} indexed
              </span>
              <span className="h-px flex-1 bg-[var(--portfolio-rule)]" />
            </div>

            {filteredCoreSkills.length > 0 && (
              <>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-muted)]">
                  Core Languages &amp; Frameworks
                </p>
                <div className="flex flex-wrap gap-2">
                  {filteredCoreSkills.map((skill) => (
                    <div key={skill.alt} className="portfolio-tech-chip">
                      <Image
                        src={skill.img}
                        alt={skill.alt}
                        width={16}
                        height={16}
                        className={cn(
                          "h-4 w-4 shrink-0 object-contain",
                          skill.alt === "NextJS" && "dark:invert",
                        )}
                      />
                      <span>{skill.alt}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {filteredExtraSkills.length > 0 && (
              <>
                <p className="mb-3 mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portfolio-muted)]">
                  Ecosystem &amp; Infrastructure
                </p>
                <div className="flex flex-wrap gap-2">
                  {filteredExtraSkills.map((tool) => (
                    <div key={tool.name} className="portfolio-tech-chip">
                      <span>{tool.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Skills;
