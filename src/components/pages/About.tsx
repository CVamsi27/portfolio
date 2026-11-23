"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CONTACT_EMAIL, NAME_TRANSLATIONS } from "@/lib/const";
import {
  ArrowUpRight,
  Check,
  Copy,
  Clock,
  Building2,
  Activity,
  Languages,
  ChevronDown,
  BookOpen,
  FileText,
} from "lucide-react";
import ResumeModal from "@/components/ResumeModal";
import SystemsFieldCanvas from "@/components/portfolio/SystemsFieldCanvas";
import SystemsBlueprintCard from "@/components/portfolio/SystemsBlueprintCard";

const STATS = [
  {
    index: "01",
    value: "5+",
    label: "Years developing",
    subtext: "Enterprise applications and an independent SaaS venture",
    icon: Clock,
  },
  {
    index: "02",
    value: "5",
    label: "Core workflows",
    subtext: "Scheduling, records, prescriptions, billing, inventory",
    icon: Building2,
  },
  {
    index: "03",
    value: "1",
    label: "Operational dashboard",
    subtext: "Activity, request samples and measurement coverage",
    icon: Activity,
  },
  {
    index: "04",
    value: "7",
    label: "Technical study areas",
    subtext: "Frontend, backend, architecture, platform and quality",
    icon: BookOpen,
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
      className="portfolio-hero portfolio-stage-hero relative isolate overflow-hidden px-5 pb-14 pt-6 sm:px-10 sm:pb-16 sm:pt-10 lg:px-16 lg:pb-20 lg:pt-12"
    >
      {/* Layer 1: Sculptural 3D optical-fiber ribbon artwork (onlook.cam-inspired fade) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-systems-bg.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="portfolio-stage-bg"
      />

      {/* Layer 2: Precision wireframe spatial network & telemetry pulses (arianetworks-inspired) */}
      <SystemsFieldCanvas />

      {/* Layer 3: Subtle engineering blueprint coordinate grid + vignette for legibility */}
      <div aria-hidden="true" className="portfolio-blueprint-grid" />
      <div aria-hidden="true" className="portfolio-stage-vignette" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Top Engineering Telemetry Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="portfolio-stage-status-pill">
            <span className="portfolio-status-dot" aria-hidden="true" />
            <span className="hidden sm:inline">
              Open to Remote Full Stack Roles
            </span>
            <span className="inline sm:hidden">Remote Full Stack Roles</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
            <span className="hidden md:inline text-slate-500">
              SYSTEMS · PRODUCTS · VERIFIED ARCHITECTURE
            </span>
            <button
              type="button"
              onClick={() =>
                setNameLangIndex((prev) => (prev + 1) % NAME_TRANSLATIONS.length)
              }
              aria-label={`Cycle name language (currently ${currentTranslation.language})`}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.06] px-2.5 py-1 font-mono text-[10px] font-medium text-blue-200 transition-all hover:border-blue-400/50 hover:bg-blue-500/20"
              title="Click to cycle name script across languages"
            >
              <Languages className="h-3 w-3" />
              <span>{currentTranslation.language}</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Stage Grid */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_24.5rem] lg:items-start lg:gap-12">
          <div className="min-w-0 max-w-3xl">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blue-300/90">
              {currentTranslation.vamsi} {currentTranslation.krishna}{" "}
              {currentTranslation.chandaluri} · Senior Full Stack Engineer
            </p>

            <h1 className="portfolio-stage-title mt-4">
              I build software
              <br />
              <span className="portfolio-stage-title-accent">
                that earns its place.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-8">
              I engineer React/TypeScript products, Node.js/NestJS APIs, and
              PostgreSQL workflows—backed by 5+ years across enterprise
              platforms and an independent healthcare SaaS. My work centers on
              tenant-scoped isolation, crash-safe queues, and verifiable
              production reliability.
            </p>

            {/* Frosted Glass Action Row */}
            <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a
                href="#Work"
                className="portfolio-glass-cta w-full sm:w-auto"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <span>View selected work</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>

              <a
                href="#Contact"
                className="portfolio-glass-cta-secondary w-full justify-center sm:w-auto"
              >
                <span>Contact me</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResumeOpen(true)}
                  className="portfolio-glass-cta-secondary h-auto w-full cursor-pointer sm:w-auto"
                  title="View interactive résumé modal"
                >
                  <FileText className="h-4 w-4 text-blue-300" />
                  <span>View resume</span>
                </Button>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="portfolio-glass-cta-secondary w-full cursor-pointer sm:w-auto"
                  title="Copy email address"
                  aria-label={`Copy ${CONTACT_EMAIL}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-300">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-300" />
                      <span>Copy email</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Subtle Scroll Cue */}
            <div
              className="mt-9 hidden items-center gap-2 text-slate-400 transition-opacity duration-500 sm:flex"
              style={{
                opacity: scrolled ? 0 : 1,
                pointerEvents: scrolled ? "none" : "auto",
              }}
            >
              <a
                href="#Work"
                aria-label="Scroll to work section"
                className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-blue-300"
              >
                <ChevronDown className="h-4 w-4 animate-bounce text-blue-400" />
                <span>Scroll to inspect systems &amp; case studies</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Systems Blueprint Workbench */}
          <SystemsBlueprintCard onFilterTech={handleFilterByTech} />
        </div>

        {/* Bottom 4-Column Telemetry Strip */}
        <div className="portfolio-telemetry-grid mt-10">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="portfolio-telemetry-card group">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-slate-500">
                    {stat.index}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/12 text-blue-300 transition-transform duration-200 group-hover:scale-105">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-300/90">
                  {stat.label}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                  {stat.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </section>
  );
};

export default About;
