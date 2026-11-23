"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CONTACT_EMAIL, NAME_TRANSLATIONS } from "@/lib/const";
import {
  ArrowUpRight,
  Check,
  Copy,
  Languages,
  ChevronDown,
  FileText,
} from "lucide-react";
import ResumeModal from "@/components/ResumeModal";
import SystemsFieldCanvas from "@/components/portfolio/SystemsFieldCanvas";
import SystemsBlueprintCard from "@/components/portfolio/SystemsBlueprintCard";

const STATS = [
  {
    index: "01",
    value: "5+",
    label: "Years Shipping",
    subtext: "Enterprise platforms & independent healthcare SaaS",
  },
  {
    index: "02",
    value: "5",
    label: "Clinical Workflows",
    subtext: "Scheduling, records, prescriptions, billing, inventory",
  },
  {
    index: "03",
    value: "10",
    label: "Indexed Systems",
    subtext: "Case studies, RLS harnesses, and crash-point probes",
  },
  {
    index: "04",
    value: "0",
    label: "Unverified Claims",
    subtext: "Reproducible failure-path checks over marketing copy",
  },
];

const About = () => {
  const [copied, setCopied] = useState(false);
  const [nameLangIndex, setNameLangIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);

  const currentTranslation =
    NAME_TRANSLATIONS[nameLangIndex % NAME_TRANSLATIONS.length];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast({
        title: "Email copied to clipboard",
        description: `${CONTACT_EMAIL} is ready to paste.`,
      });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast({
        title: CONTACT_EMAIL,
        description: "Click to email or copy manually.",
      });
    }
  };

  const handleFilterByTech = (tech: string) => {
    window.dispatchEvent(
      new CustomEvent("portfolio-filter-tech", { detail: tech }),
    );
    document.getElementById("Work")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="Top"
      aria-label="About and Introduction"
      data-chapter-index="00"
      className="portfolio-hero portfolio-stage-hero relative isolate overflow-hidden px-5 pb-16 pt-8 sm:px-10 sm:pb-24 sm:pt-12 lg:px-16 lg:pb-28 lg:pt-14"
    >
      {/* Layer 1: Theme-adaptive architectural wireframe topology */}
      <SystemsFieldCanvas />

      {/* Layer 2: Subtle drafting grid + soft radial vignette */}
      <div aria-hidden="true" className="portfolio-blueprint-grid" />
      <div aria-hidden="true" className="portfolio-stage-vignette" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Top Editorial Masthead Rule (No glowing dots) */}
        <div className="mb-12 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--portfolio-hero-rule)] pb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--portfolio-hero-muted)]">
            Open to Remote Full Stack Roles
          </p>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--portfolio-hero-muted)]">
            <span className="hidden md:inline">
              Systems · Products · Verified Architecture
            </span>
            <button
              type="button"
              onClick={() =>
                setNameLangIndex(
                  (prev) => (prev + 1) % NAME_TRANSLATIONS.length,
                )
              }
              aria-label={`Cycle name language (currently ${currentTranslation.language})`}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--portfolio-hero-rule)] bg-transparent px-3 py-1 font-sans text-xs font-medium normal-case tracking-normal text-[var(--portfolio-hero-ink)] transition-colors hover:border-[var(--portfolio-hero-ink)]"
              title="Click to cycle name script across languages"
            >
              <Languages className="h-3 w-3" />
              <span>{currentTranslation.language}</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Editorial Stage Grid */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_24.5rem] lg:items-start lg:gap-16">
          <div className="min-w-0 max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--portfolio-hero-muted)]">
              {currentTranslation.vamsi} {currentTranslation.krishna}{" "}
              {currentTranslation.chandaluri} — Senior Full Stack Engineer
            </p>

            <h1 className="portfolio-stage-title mt-6">
              I build software
              <br />
              <span className="portfolio-stage-title-accent">
                that earns its place.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl font-sans text-base leading-relaxed text-[var(--portfolio-hero-muted)] sm:text-[1.125rem] sm:leading-[1.75]">
              React and TypeScript products, Node.js and NestJS APIs, and
              PostgreSQL workflows—shaped by 5+ years across enterprise
              platforms and an independent healthcare SaaS. Focused on
              tenant-scoped isolation, crash-safe queues, and verifiable
              production reliability.
            </p>

            {/* Clean Sentence-Case Action Row */}
            <div className="mt-10 flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a
                href="#Work"
                className="portfolio-stage-primary-cta w-full sm:w-auto"
              >
                <span>View selected work</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href="#Contact"
                className="portfolio-stage-secondary-cta w-full sm:w-auto"
              >
                <span>Contact me</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResumeOpen(true)}
                  className="portfolio-stage-secondary-cta h-auto w-full sm:w-auto"
                  title="View interactive résumé modal"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>View resume</span>
                </Button>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="portfolio-stage-secondary-cta w-full sm:w-auto"
                  title="Copy email address"
                  aria-label={`Copy ${CONTACT_EMAIL}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy email</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quiet Scroll Cue */}
            <div
              className="mt-12 hidden items-center gap-2 transition-opacity duration-500 sm:flex"
              style={{
                opacity: scrolled ? 0 : 1,
                pointerEvents: scrolled ? "none" : "auto",
              }}
            >
              <a
                href="#Work"
                aria-label="Scroll to work section"
                className="inline-flex items-center gap-2 font-sans text-xs font-medium text-[var(--portfolio-hero-muted)] transition-colors hover:text-[var(--portfolio-hero-ink)]"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Scroll to inspect systems &amp; case studies</span>
              </a>
            </div>
          </div>

          {/* Right Column: Typographic Systems Inspector (No Avatar) */}
          <SystemsBlueprintCard onFilterTech={handleFilterByTech} />
        </div>

        {/* Bottom 4-Column Open Typographic Metrics Ledger */}
        <div className="portfolio-telemetry-grid mt-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="portfolio-telemetry-card">
              <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--portfolio-hero-muted)]">
                {stat.index}
              </span>
              <p className="mt-2 font-display text-4xl font-light leading-none tracking-[-0.03em] text-[var(--portfolio-hero-ink)] tabular-nums sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2.5 font-sans text-xs font-semibold text-[var(--portfolio-hero-ink)]">
                {stat.label}
              </p>
              <p className="mt-1 font-sans text-xs leading-relaxed text-[var(--portfolio-hero-muted)]">
                {stat.subtext}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </section>
  );
};

export default About;
