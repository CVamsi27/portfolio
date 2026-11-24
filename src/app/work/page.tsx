import Link from "next/link";
import { PROJECTS } from "@/lib/const";
import { caseStudyHref } from "@/lib/case-studies";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";

export default function WorkIndex() {
  return (
    <section
      id="Work"
      aria-label="Selected work index"
      className="portfolio-section portfolio-work-section px-5 py-16 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 border-b border-[var(--portfolio-rule)] pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--portfolio-muted)]">
            01 // Featured Systems
          </p>
          <h2 className="mt-4 font-display text-5xl font-light leading-none tracking-[-0.03em] text-[var(--portfolio-ink)] sm:text-6xl">
            Selected work
          </h2>
          <p className="mt-5 max-w-2xl font-sans text-sm leading-relaxed text-[var(--portfolio-muted)] sm:text-base sm:leading-[1.75]">
            Production systems and engineered products, chosen for the
            operational problems they solve, their architectural resilience,
            and the lessons they carry into every codebase.
          </p>
        </div>

        <div className="portfolio-work-index">
          {PROJECTS.map((project, index) => {
            const tech = project.tech.split(", ");
            return (
              <Link
                key={project.title}
                href={caseStudyHref(project.title)}
                className="portfolio-work-row group block"
                aria-label={`Read the ${project.title} case study`}
              >
                <div className="portfolio-work-number group-hover:opacity-80 transition-opacity">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="portfolio-work-copy min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="font-display text-xl font-light leading-tight tracking-[-0.02em] text-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-accent)] transition-colors sm:text-[1.25rem]">
                        {project.title}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 border-b border-transparent pb-0.5 font-sans text-xs font-medium text-[var(--portfolio-muted)] group-hover:border-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-ink)] transition-colors",
                      )}
                    >
                      Case study
                    </span>
                  </div>

                  <p className="mt-3 font-sans text-xs text-[var(--portfolio-muted)] leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tech.map((t) => (
                      <span
                        key={t}
                        className="portfolio-tag-pill group-hover:border-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-ink)] transition-colors"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 portfolio-work-links">
                    {project.URL ? (
                      <>
                        <a
                          href={project.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-ink)] hover:underline"
                        >
                          <span>Live site</span
                          ><span aria-hidden="true"> → </span>
                        </a>
                        {project.gitLink && !project.URL.includes("github.com") ? (
                          <a
                            href={project.gitLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)] hover:underline"
                          >
                            <span>Source code</span>
                            <span aria-hidden="true"> → </span>
                          </a>
                        ) : null}
                      </>
                    ) : (
                      <a
                        href={project.gitLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-1.5 font-sans text-xs font-medium text-[var(--portfolio-ink)] hover:underline"
                      >
                        <span>Source code</span
                        ><span aria-hidden="true"> → </span>
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
