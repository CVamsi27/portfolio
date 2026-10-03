"use client";

import { WORK_EXPERIENCE } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { ArrowUpRight, MapPin } from "lucide-react";

const COMPANY_LOCATIONS: Record<string, string> = {
  Docita: "Remote · Pan-India",
  "MAQ Software": "Hyderabad, India",
  Cognizant: "Hyderabad, India",
};

const COMPANY_HIGHLIGHTS: Record<string, string[]> = {
  Docita: ["5 Core Workflows", "Operational Dashboard", "Scoped APIs", "Outbox & Queues"],
  "MAQ Software": ["Recruitment Workflows", "API Query Tuning", "Reusable React UI", "Reviews & Mentoring"],
  Cognizant: ["4 Microservices", "Spring Boot & Eureka", "Zuul Gateway", "E-Commerce"],
};

const KEY_PHRASES = [
  "5 core workflows",
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
    <section id="Experience" className="portfolio-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="02 / Career Record"
          title="Where I have shipped"
          description="Five years of production engineering across healthcare SaaS, high-throughput internal platforms, and enterprise cloud services."
        />

        <div className="portfolio-experience-list">
          {WORK_EXPERIENCE.map((value, index) => {
            const highlights = COMPANY_HIGHLIGHTS[value.company] || [];
            return (
              <Reveal
                key={`${value.company}-${value.duration}`}
                delay={index * 70}
                className="portfolio-experience-row"
              >
                <div className="portfolio-experience-meta">
                  <span className="portfolio-index">{String(index + 1).padStart(2, "0")}</span>

                  <a
                    href={value.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-display text-lg font-bold text-[var(--portfolio-ink)] transition-colors hover:text-[var(--portfolio-accent)]"
                  >
                    <span>{value.company}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--portfolio-accent)]" />
                  </a>

                  <span className="font-utility text-xs font-semibold text-[var(--portfolio-muted)]">
                    {value.duration}
                  </span>

                  {COMPANY_LOCATIONS[value.company] ? (
                    <span className="inline-flex items-center gap-1 font-utility text-[0.62rem] text-[var(--portfolio-muted)]">
                      <MapPin className="h-3 w-3 shrink-0 text-[var(--portfolio-accent)]" />
                      <span>{COMPANY_LOCATIONS[value.company]}</span>
                    </span>
                  ) : null}

                  {index === 0 && (
                    <span className="inline-flex items-center gap-1.5 w-fit">
                      <span className="portfolio-status-dot" aria-hidden="true" />
                      <span className="font-utility text-[0.6rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Current
                      </span>
                    </span>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {highlights.map((h) => (
                      <span key={h} className="portfolio-impact-pill">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="portfolio-experience-body">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-2xl sm:text-3xl">{value.title}</h3>
                    <span className="portfolio-experience-description">{value.description}</span>
                  </div>

                  {value.details?.length ? (
                    <ul className="portfolio-experience-details">
                      {value.details.map((detail) => {
                        const phrase = KEY_PHRASES.find((p) =>
                          detail.toLowerCase().includes(p.toLowerCase())
                        );

                        if (!phrase) {
                          return <li key={detail}>{detail}</li>;
                        }

                        const idx = detail.toLowerCase().indexOf(phrase.toLowerCase());
                        const before = detail.slice(0, idx);
                        const matched = detail.slice(idx, idx + phrase.length);
                        const after = detail.slice(idx + phrase.length);

                        return (
                          <li key={detail}>
                            {before}
                            <strong className="font-semibold text-[var(--portfolio-ink)]">
                              {matched}
                            </strong>
                            {after}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  <div className="portfolio-tag-list mt-5">
                    {value.tech.split(", ").map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("portfolio-filter-tech", { detail: tech }));
                          document.getElementById("Work")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="portfolio-tag-pill cursor-pointer transition-all hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)]"
                        title={`Filter work projects by ${tech}`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experience;

