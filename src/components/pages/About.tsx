"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Connections from "../Connections";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CONTACT_EMAIL, NAME_TRANSLATIONS, RESUME_PATH } from "@/lib/const";
import {
  Download,
  ArrowUpRight,
  Check,
  Copy,
  Clock,
  Building2,
  Activity,
  ShieldCheck,
  Languages,
  ChevronDown,
  BookOpen,
  FileText,
} from "lucide-react";
import ResumeModal from "@/components/ResumeModal";

const STATS = [
  {
    value: "5+",
    numericValue: 5,
    suffix: "+",
    label: "Years shipping",
    subtext: "Healthcare SaaS, enterprise & distributed systems",
    icon: Clock,
  },
  {
    value: "5",
    numericValue: 5,
    suffix: "",
    label: "Core workflows",
    subtext: "Scheduling, records, prescriptions, billing, inventory",
    icon: Building2,
  },
  {
    value: "1",
    numericValue: 1,
    prefix: "",
    suffix: "",
    label: "Operational dashboard",
    subtext: "Activity, request samples and measurement coverage",
    icon: Activity,
  },
  {
    value: "7",
    numericValue: 7,
    suffix: "",
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

  // Dynamic years-of-experience: started 2020
  const yearsExperience = new Date().getFullYear() - 2020;

  const handleFilterByTech = (tech: string) => {
    window.dispatchEvent(new CustomEvent("portfolio-filter-tech", { detail: tech }));
    document.getElementById("Work")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="Top"
      aria-label="About and Introduction"
      data-chapter-index="00"
      className="portfolio-hero relative overflow-hidden px-5 pb-16 pt-1 sm:px-10 sm:pb-24 sm:pt-2 lg:px-16 lg:pt-3"
    >
      <div aria-hidden className="portfolio-hero__wash" />
      <div aria-hidden className="portfolio-hero__ambient" />

      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-16">
        <div className="max-w-5xl">
          <div className="portfolio-status-pill">
            <span className="portfolio-status-dot" aria-hidden="true" />
            <span className="hidden sm:inline">Available for Senior / Staff Product Engineering Roles</span>
            <span className="inline sm:hidden">Open to Senior / Staff Eng Roles</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <p className="font-utility text-[0.68rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em] text-[var(--portfolio-muted)]">
              {currentTranslation.vamsi} {currentTranslation.krishna} {currentTranslation.chandaluri} · Senior Full Stack &amp; Systems Engineer
            </p>
            <button
              type="button"
              onClick={() =>
                setNameLangIndex((prev) => (prev + 1) % NAME_TRANSLATIONS.length)
              }
              aria-label={`Cycle name language (currently ${currentTranslation.language})`}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-2 py-0.5 font-utility text-[0.62rem] font-medium text-[var(--portfolio-accent)] transition-all hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)]"
              title="Click to cycle name script across languages"
            >
              <Languages className="h-3 w-3" />
              <span>{currentTranslation.language}</span>
            </button>
          </div>

          <h1 className="portfolio-hero__title mt-3.5 max-w-5xl">
            I build software
            <br />
            <span className="portfolio-hero__title--shimmer">that earns its place.</span>
          </h1>

          <p className="mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg leading-relaxed sm:leading-8 text-[var(--portfolio-muted)]">
            I architect and ship high-reliability web applications, resilient backend APIs,
            and multi-tenant platforms — {yearsExperience}+ years of production engineering
            trusted by clinics across India.
          </p>

          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <a href="#Work" className="portfolio-primary-action w-full sm:w-auto text-center">
              View selected work
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <a href="#Contact" className="portfolio-secondary-action justify-center">Contact me <ArrowUpRight className="h-4 w-4" /></a>
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResumeOpen(true)}
                className="portfolio-secondary-action w-full sm:w-auto cursor-pointer"
                title="View interactive résumé modal"
              >
                <FileText className="h-4 w-4 text-[var(--portfolio-accent)]" />
                <span>View resume</span>
              </Button>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="portfolio-copy-action w-full sm:w-auto"
                title="Copy email address"
                aria-label={`Copy ${CONTACT_EMAIL}`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Copied!</span>
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

          {/* Scroll-down indicator */}
          <div
            className="mt-10 hidden sm:flex items-center gap-2 text-[var(--portfolio-muted)] transition-all duration-500"
            style={{ opacity: scrolled ? 0 : 1, pointerEvents: scrolled ? "none" : "auto" }}
          >
            <a
              href="#Work"
              aria-label="Scroll to work section"
              className="portfolio-scroll-hint inline-flex items-center gap-2 font-utility text-[0.65rem] font-semibold uppercase tracking-[0.1em] transition-colors hover:text-[var(--portfolio-accent)]"
            >
              <ChevronDown className="h-4 w-4 animate-bounce" />
              <span>Scroll to see work</span>
            </a>
          </div>
        </div>

        <aside className="portfolio-hero__aside">
          {/* Author Profile Header */}
          <div className="flex items-center gap-3.5 border-b border-[var(--portfolio-rule)] pb-4">
            <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--portfolio-accent)]/30 bg-[var(--portfolio-paper)] shadow-xs">
              <Image
                src="/SE.webp"
                alt="Vamsi Krishna Chandaluri"
                width={56}
                height={56}
                className="h-full w-full object-cover"
                priority
              />
              <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--portfolio-paper)] bg-emerald-500"
                title="Active & Available"
              />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[var(--portfolio-ink)]">
                Vamsi Krishna
              </p>
              <p className="font-utility text-[11px] text-[var(--portfolio-accent)] font-medium">
                Senior Full Stack &amp; Systems Engineer
              </p>
              <p className="font-mono text-[10px] text-[var(--portfolio-muted)] mt-0.5">
                Bangalore · Relocation (Germany)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-b border-[var(--portfolio-rule)] py-3">
            <p className="portfolio-meta-label">Current Focus</p>
            <span className="portfolio-impact-pill">In Production</span>
          </div>

          <div className="mt-3.5">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--portfolio-ink)]">
              Docita · Multi-Tenant Healthcare OS
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">
              Building scheduling, patient records, prescriptions, billing and inventory workflows in a multi-tenant healthcare SaaS.
            </p>

            <div className="mt-3.5 border-t border-[var(--portfolio-rule)] pt-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-[var(--portfolio-ink)]">
                  Senior Full Stack Bible
                </h3>
                <a
                  href="https://study.buildora.work"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-utility text-[0.62rem] font-semibold text-[var(--portfolio-accent)] hover:underline inline-flex items-center gap-0.5"
                >
                  <span>study.buildora.work</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-1 text-xs text-[var(--portfolio-muted)]">
                Maintaining a structured study library with mechanism-first chapters, separate revision and practical interview exercises.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--portfolio-rule)] pt-4">
            <div className="flex items-center justify-between">
              <p className="portfolio-meta-label">Core Technologies</p>
              <span className="font-utility text-[0.6rem] text-[var(--portfolio-muted)]">Click to filter</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["TypeScript", "React", "NestJS", "PostgreSQL", "Prisma"].map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleFilterByTech(tech)}
                  className="portfolio-tag-pill cursor-pointer transition-all hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)] hover:shadow-xs"
                  title={`View projects built with ${tech}`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--portfolio-rule)] pt-4">
            <p className="portfolio-meta-label mb-2.5">Connect &amp; Channels</p>
            <Connections />
          </div>
        </aside>
      </div>

      <div className="relative mx-auto mt-16 max-w-7xl">
        <div className="portfolio-stat-grid">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <StatCard
                key={stat.label}
                stat={stat}
                Icon={Icon}
              />
            );
          })}
        </div>
      </div>

      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
      />
    </section>
  );
};

function StatCard({
  stat,
  Icon,
}: {
  stat: (typeof STATS)[number];
  Icon: React.ElementType;
}) {
  const displayValue = stat.value;

  return (
    <div className="portfolio-stat-card group">
      <div className="flex items-center justify-between">
        <p className="portfolio-stat__value tabular-nums transition-all duration-300">
          {displayValue}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--portfolio-blue-soft)] transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-4 w-4 text-[var(--portfolio-accent)]" />
        </div>
      </div>
      <p className="portfolio-meta-label mt-2">{stat.label}</p>
      <p className="mt-1 text-xs text-[var(--portfolio-muted)] line-clamp-1">
        {stat.subtext}
      </p>
    </div>
  );
}

export default About;

