"use client";

import { WORK_EXPERIENCE } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { ArrowUpRight, ChevronDown } from "lucide-react";

const COMPANY_LOCATIONS: Record<string, string> = {
  Docita: "Remote · Pan-India",
  "MAQ Software": "Hyderabad, India",
  Cognizant: "Hyderabad, India",
};

const COMPANY_HIGHLIGHTS: Record<string, string[]> = {
  Docita: [
    "Clinic Workflow Ownership",
    "Operational Dashboard",
    "Scoped APIs",
    "Outbox & Queues",
  ],
  "MAQ Software": [
    "Recruitment Workflows",
    "API Query Tuning",
    "Reusable React UI",
    "Reviews & Mentoring",
  ],
  Cognizant: [
    "4 Microservices",
    "Spring Boot & Eureka",
    "Zuul Gateway",
    "E-Commerce",
  ],
};

const KEY_PHRASES = [
  "healthcare SaaS end to end",
  "PostgreSQL Row-Level Security, deny-by-default ABAC",
  "PostgreSQL queues, transactional outbox, idempotency, retries",
  "tenant-scoped queries, migrations, indexes, pagination, and transactional writes",
  "TanStack Query and shared Zod schemas",
  "optimized rest apis and postgresql queries",
  "recruitment and internal-workflow applications",
  "GitHub Actions, Jest and release checks",
  "mentored engineers",
  "4 Spring Boot microservices",
  "Eureka service discovery, Zuul gateway routing, JWT authorization",
];

const Experience = () => {
  return (
    <section
      id="Experience"
      className="portfolio-section bg-[var(--portfolio-wash)] px-5 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="04 // Career Record"
          title="Where I have shipped"
          description="Five years of production engineering across healthcare SaaS, high-throughput internal platforms, and enterprise cloud services."
        />

        <div className="portfolio-experience-list">
          {WORK_EXPERIENCE.map((value, index) => {
            const highlights = COMPANY_HIGHLIGHTS[value.company] || [];
            const isCurrent = index === 0;

            const detailsList = value.details?.length ? (
              <ul className="portfolio-experience-details">
                {value.details.map((detail) => {
                  const phrase = KEY_PHRASES.find((p) =>
                    detail.toLowerCase().includes(p.toLowerCase()),
                  );

                  if (!phrase) {
                    return <li key={detail}>{detail}</li>;
                  }

                  const idx = detail
                    .toLowerCase()
                    .indexOf(phrase.toLowerCase());
                  const before = detail.slice(0, idx);
                  const matched = detail.slice(idx, idx + phrase.length);
                  const after = detail.slice(idx + phrase.length);

                  return (
                    <li key={detail}>
                      {before}
                      <strong>{matched}</strong>
                      {after}
                    </li>
                  );
                })}
              </ul>
            ) : null;

            const techTags = (
              <div className="portfolio-tag-list mt-5">
                {value.tech.split(", ").map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("portfolio-filter-tech", {
                          detail: tech,
                        }),
                      );
                      document
                        .getElementById("Work")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="portfolio-tag-pill cursor-pointer"
                    title={`Filter work projects by ${tech}`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            );

            return (
              <Reveal
                key={`${value.company}-${value.duration}`}
                delay={index * 50}
              >
                {isCurrent ? (
                  <div
                    className="portfolio-experience-row"
                    data-experience-current
                  >
                    <div className="portfolio-experience-meta">
                      <span className="portfolio-index">
                        {String(index + 1).padStart(2, "0")} · Current Role
                      </span>

                      <a
                        href={value.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-display text-3xl font-light normal-case tracking-[-0.025em] text-[var(--portfolio-ink)] hover:opacity-75"
                      >
                        <span>{value.company}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--portfolio-muted)]" />
                      </a>

                      <span className="font-mono text-xs text-[var(--portfolio-muted)]">
                        {value.duration}
                      </span>

                      {COMPANY_LOCATIONS[value.company] ? (
                        <span className="font-sans text-xs text-[var(--portfolio-muted)]">
                          {COMPANY_LOCATIONS[value.company]}
                        </span>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {highlights.map((h) => (
                          <span key={h} className="portfolio-impact-pill">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="portfolio-experience-body">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3>{value.title}</h3>
                        <span className="portfolio-experience-description">
                          {value.description}
                        </span>
                      </div>

                      {detailsList}

                      {techTags}
                    </div>
                  </div>
                ) : (
                  <details
                    data-experience-history
                    className="group border-b border-[var(--portfolio-rule)]"
                  >
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2 py-5 transition-colors hover:bg-[var(--portfolio-surface)] sm:px-3">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="portfolio-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-2xl font-light leading-none text-[var(--portfolio-ink)]">
                          {value.company}
                        </span>
                        <span className="font-sans text-xs font-medium text-[var(--portfolio-ink)]">
                          {value.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        <span className="font-mono text-xs text-[var(--portfolio-muted)]">
                          {value.duration}
                        </span>
                        {COMPANY_LOCATIONS[value.company] ? (
                          <span className="hidden font-sans text-xs text-[var(--portfolio-muted)] md:inline">
                            · {COMPANY_LOCATIONS[value.company]}
                          </span>
                        ) : null}
                        <ChevronDown
                          className="h-4 w-4 shrink-0 text-[var(--portfolio-muted)] transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </div>
                    </summary>

                    <div className="border-t border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                        <span className="portfolio-experience-description">
                          {value.description}
                        </span>
                        <a
                          href={value.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-sans text-xs font-medium text-[var(--portfolio-ink)] hover:underline"
                        >
                          <span>{value.company} profile</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {highlights.map((h) => (
                          <span key={h} className="portfolio-impact-pill">
                            {h}
                          </span>
                        ))}
                      </div>

                      {detailsList}

                      {techTags}
                    </div>
                  </details>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experience;
