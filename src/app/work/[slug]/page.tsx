import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Code2, ExternalLink } from "lucide-react";
import EditorialFrame from "@/components/editorial/EditorialFrame";
import { PORTFOLIO_BRAND } from "@/lib/brand";
import {
  CASE_STUDIES,
  caseStudyNeighbours,
  caseStudyPatterns,
  getCaseStudy,
  projectByTitle,
} from "@/lib/case-studies";

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};
  return {
    title: `${study.title} — Case Study | ${PORTFOLIO_BRAND.siteName}`,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: {
      type: "article" as const,
      url: `/work/${study.slug}`,
      title: `${study.title} — Case Study`,
      description: study.summary,
      images: [
        {
          url: PORTFOLIO_BRAND.ogImagePath,
          width: 1200,
          height: 630,
          alt: `${study.title} — case study`,
        },
      ],
    },
  };
}

const SECTIONS = [
  { id: "problem", label: "The problem" },
  { id: "approach", label: "The approach" },
  { id: "architecture", label: "Architecture highlights" },
  { id: "verification", label: "Verification & limits" },
] as const;

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  const project = projectByTitle(study.project);
  const stack = project ? project.tech.split(", ") : [];
  const patterns = caseStudyPatterns(study);
  const references = study.references ?? [];
  const hasRelated = patterns.length > 0 || references.length > 0;
  const { previous, next } = caseStudyNeighbours(slug);

  return (
    <EditorialFrame surface="paper" className="min-h-full !p-0">
      <div id="Top" data-public-dossier className="mx-auto w-full max-w-7xl">
        <article className="case-study px-5 pb-16 pt-10 sm:px-10 sm:pb-24 lg:px-16">
          <Link href="/" className="case-study-back">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All selected work</span>
          </Link>

          <header data-testid="case-study-hero" className="case-study-hero">
            <p className="case-study-eyebrow">{study.category} · Case study</p>
            <h1 className="case-study-title">{study.title}</h1>
            <p className="case-study-summary">{study.summary}</p>

            <div className="case-study-meta">
              <span>{study.role}</span>
              {study.period ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{study.period}</span>
                </>
              ) : null}
            </div>

            {stack.length ? (
              <ul data-testid="case-study-stack" className="case-study-stack">
                {stack.map((tech) => (
                  <li key={tech} className="portfolio-tag-pill">
                    {tech}
                  </li>
                ))}
              </ul>
            ) : null}

            {project?.URL || project?.gitLink ? (
              <div className="case-study-actions">
                {project?.URL ? (
                  <a
                    href={project.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-primary-action"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open live site</span>
                  </a>
                ) : null}
                {project?.gitLink ? (
                  <a
                    href={project.gitLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="case-study-secondary-action"
                  >
                    <Code2 className="h-4 w-4" />
                    <span>Source code</span>
                  </a>
                ) : null}
              </div>
            ) : null}

            <nav className="case-study-toc" aria-label="On this page">
              {SECTIONS.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.label}
                </a>
              ))}
              {hasRelated ? <a href="#patterns">Related patterns</a> : null}
            </nav>
          </header>

          <section id="problem" className="case-study-section">
            <h2>The problem</h2>
            <ul className="case-study-list">
              {study.problem.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="approach" className="case-study-section">
            <h2>The approach</h2>
            <ul className="case-study-list">
              {study.approach.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="architecture" className="case-study-section">
            <h2>Architecture highlights</h2>
            <ul className="case-study-list case-study-list--grid">
              {study.architecture.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="verification" className="case-study-section">
            <h2>Verification &amp; limits</h2>
            <p className="case-study-note">{study.verification}</p>
          </section>

          {hasRelated ? (
            <section id="patterns" className="case-study-section">
              <h2>Related patterns</h2>
              <div className="case-study-patterns">
                {patterns.map((pattern) => (
                  <a
                    key={pattern.url}
                    href={pattern.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{pattern.name}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ))}
                {references.map((reference) => (
                  <a
                    key={reference.url}
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{reference.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <nav
            data-testid="case-study-pagination"
            className="case-study-pagination"
            aria-label="More case studies"
          >
            <Link
              href={`/work/${previous.slug}`}
              className="case-study-pagination__item case-study-pagination__item--prev"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>
                <small>Previous</small>
                <strong>{previous.title}</strong>
              </span>
            </Link>
            <Link
              href={`/work/${next.slug}`}
              className="case-study-pagination__item case-study-pagination__item--next"
            >
              <span>
                <small>Next</small>
                <strong>{next.title}</strong>
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </article>
      </div>
    </EditorialFrame>
  );
}
