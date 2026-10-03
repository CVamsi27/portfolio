"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { SKILLS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import {
  Layout,
  Server,
  ShieldCheck,
  Cpu,
  Terminal,
  BookOpen,
  ArrowUpRight,
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
      "Webhook verification and duplicate-effect handling",
    ],
  },
  {
    title: "Quality & Infrastructure",
    icon: ShieldCheck,
    lead: "Meaningful tests and release checks for sensitive product workflows.",
    items: [
      "Jest, Vitest and Playwright failure-path checks",
      "Automated CI/CD pipelines with GitHub Actions",
      "Dockerized environments & snapshot validation",
      "Sensitive-data audit logging and resource authorization",
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

const SHELF_TABS: { id: TechCategory; label: string }[] = [
  { id: "all", label: "All Tools" },
  { id: "frontend", label: "Frontend & UI" },
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
      id === "all" ? SKILLS.length : SKILLS.filter((s) => TECH_CATEGORIES[s.alt] === id).length;
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
    <section id="Capabilities" className="portfolio-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
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
                  <div className="portfolio-capability-group__icon flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)] transition-all duration-200">
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

        {/* Senior Full Stack Bible Spotlight */}
        <Reveal delay={90} className="my-8 rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)]/40 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-accent)] shadow-xs">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-sm font-bold text-[var(--portfolio-ink)]">
                    Senior Full Stack Interview Bible
                  </h4>
                  <span className="portfolio-impact-pill">Mechanisms · Revision · Practical Exercises</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--portfolio-muted)]">
                  My open-source engineering reference covering 7 study stacks, 2 terminal interview lanes, and all 23 GoF design patterns.
                </p>
              </div>
            </div>

            <a
              href="https://study.buildora.work"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[var(--portfolio-accent)] bg-[var(--portfolio-paper)] px-3.5 py-1.5 font-utility text-xs font-semibold text-[var(--portfolio-accent)] transition-all hover:bg-[var(--portfolio-accent)] hover:text-white shrink-0 shadow-xs"
            >
              <span>Explore study.buildora.work</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </Reveal>

        {/* Interactive Tech Stack Shelf */}
        <Reveal delay={120} className="portfolio-tech-shelf">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--portfolio-rule)] pb-4">
            <div>
              <p className="portfolio-meta-label">Production Tooling &amp; Libraries</p>
              <p className="mt-1 text-xs text-[var(--portfolio-muted)]">
                Core technologies actively deployed across Docita, microservices, and platforms.
              </p>
            </div>

            {/* Category Filter — now with count badges and keyboard nav */}
            <div
              role="tablist"
              aria-label="Filter skills by discipline"
              className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap scrollbar-none -mx-1 px-1"
            >
              {SHELF_TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[i] = el; }}
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

          <div className="mt-6" key={activeCategory}>
            {/* Tool count summary */}
            <div className="mb-4 flex items-center gap-2">
              <span className="font-utility text-[0.6rem] font-bold uppercase tracking-widest text-[var(--portfolio-muted)]">
                {totalTools} tool{totalTools !== 1 ? "s" : ""} shown
              </span>
              <span className="h-px flex-1 bg-[var(--portfolio-rule)]" />
            </div>

            {filteredCoreSkills.length > 0 && (
              <>
                <p className="font-utility text-[0.65rem] font-bold uppercase tracking-wider text-[var(--portfolio-muted)] mb-3">
                  Core Languages &amp; Frameworks
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
              </>
            )}

            {filteredExtraSkills.length > 0 && (
              <>
                <p className="font-utility text-[0.65rem] font-bold uppercase tracking-wider text-[var(--portfolio-muted)] mt-6 mb-3">
                  Ecosystem &amp; Infrastructure
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {filteredExtraSkills.map((tool) => (
                    <div key={tool.name} className="portfolio-tech-chip">
                      <Terminal className="h-3.5 w-3.5 text-[var(--portfolio-accent)]" />
                      <span>{tool.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {filteredCoreSkills.length === 0 && filteredExtraSkills.length === 0 && (
              <p className="text-sm text-[var(--portfolio-muted)] py-4">
                No tools in this category.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Skills;
