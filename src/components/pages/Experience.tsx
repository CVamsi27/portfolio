import { WORK_EXPERIENCE } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { ArrowUpRight, Briefcase } from "lucide-react";

const COMPANY_HIGHLIGHTS: Record<string, string[]> = {
  Docita: ["25+ Clinics Live", "1,000+ Appts / Mo", "PostgreSQL RLS", "Outbox & Queues"],
  "MAQ Software": ["-30% p95 Latency", "25% Faster Delivery", "85%+ Test Coverage", "Mentored 4 Devs"],
  Cognizant: ["4 Microservices", "Spring Boot & Eureka", "Zuul Gateway", "E-Commerce"],
};

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
                        const KEY_PHRASES = [
                          "25+ clinics and 1,000+ appointment workflows per month",
                          "PostgreSQL Row-Level Security, deny-by-default ABAC",
                          "PostgreSQL queues, transactional outbox, idempotency, retries",
                          "tenant-scoped queries, migrations, indexes, pagination, and transactional writes",
                          "TanStack Query and shared Zod schemas",
                          "cut rest api p95 latency by 30%",
                          "p95 latency by 30%",
                          "reduced delivery time for recruitment and internal-workflow modules by 25%",
                          "by 25%",
                          "85%+ test coverage",
                          "mentored four engineers",
                          "4 Spring Boot microservices",
                          "Eureka service discovery, Zuul gateway routing, JWT authorization",
                        ];

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
                      <span key={tech} className="portfolio-tag-pill">
                        {tech}
                      </span>
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

