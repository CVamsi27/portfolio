"use client";

import { useState, useEffect } from "react";
import Connections from "../Connections";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { NAME_TRANSLATIONS } from "@/lib/const";
import {
  Download,
  ArrowUpRight,
  Check,
  Copy,
  Clock,
  Building2,
  Activity,
  ShieldCheck,
  MapPin,
  Languages,
} from "lucide-react";

const STATS = [
  {
    value: "5+",
    label: "Years shipping",
    subtext: "Healthcare SaaS, enterprise & distributed systems",
    icon: Clock,
  },
  {
    value: "25+",
    label: "Clinics in production",
    subtext: "Pan-India multi-tenant clinical deployment",
    icon: Building2,
  },
  {
    value: "1k+",
    label: "Workflows / month",
    subtext: "Active appointments, records & billing",
    icon: Activity,
  },
  {
    value: "85%+",
    label: "Test coverage",
    subtext: "Unit, integration & Playwright E2E assurance",
    icon: ShieldCheck,
  },
];

const About = () => {
  const [copied, setCopied] = useState(false);
  const [nameLangIndex, setNameLangIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }).format(new Date());
        setCurrentTime(timeStr);
      } catch {
        // fallback
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentTranslation =
    NAME_TRANSLATIONS[nameLangIndex % NAME_TRANSLATIONS.length];

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("cvamsik99@gmail.com");
      setCopied(true);
      toast({
        title: "Email copied to clipboard",
        description: "cvamsik99@gmail.com is ready to paste.",
      });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast({
        title: "cvamsik99@gmail.com",
        description: "Click to email or copy manually.",
      });
    }
  };

  return (
    <section
      id="Top"
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
            <span className="inline sm:hidden">Available for Senior / Staff Roles</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <p className="font-utility text-[0.68rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em] text-[var(--portfolio-muted)]">
              {currentTranslation.vamsi} {currentTranslation.krishna} {currentTranslation.chandaluri} · Senior Full Stack & Systems Engineer
            </p>
            <button
              type="button"
              onClick={() =>
                setNameLangIndex((prev) => (prev + 1) % NAME_TRANSLATIONS.length)
              }
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
            <span>that earns its place.</span>
          </h1>

          <p className="mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg leading-relaxed sm:leading-8 text-[var(--portfolio-muted)]">
            I architect and ship high-reliability web applications, resilient backend APIs,
            and multi-tenant platforms. Currently engineering clinical operating systems
            trusted by clinics across India.
          </p>

          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <a href="#Work" className="portfolio-primary-action w-full sm:w-auto text-center">
              Explore selected work
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
              <Button asChild variant="outline" className="portfolio-secondary-action w-full sm:w-auto">
                <a href="/VamsiKrishna_Resume.pdf" download="VamsiKrishna_Resume">
                  <Download className="h-4 w-4" />
                  <span>Resume</span>
                </a>
              </Button>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="portfolio-copy-action w-full sm:w-auto"
                title="Copy email address"
                aria-label="Copy cvamsik99@gmail.com"
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
        </div>

        <aside className="portfolio-hero__aside">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--portfolio-rule)] pb-3">
            <p className="portfolio-meta-label">Current Focus</p>
            <span className="portfolio-impact-pill">In Production</span>
          </div>

          <div className="mt-3.5">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--portfolio-ink)]">
              Docita · Multi-Tenant Healthcare OS
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">
              Powering patient queues, clinical documentation, Rx prescriptions, and multi-tier billing for 25+ healthcare facilities.
            </p>
          </div>

          <div className="mt-6 border-t border-[var(--portfolio-rule)] pt-4">
            <p className="portfolio-meta-label">Core Technologies</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["TypeScript", "React", "NestJS", "PostgreSQL", "Prisma"].map((tech) => (
                <span key={tech} className="portfolio-tag-pill">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[var(--portfolio-rule)] pt-4 text-xs text-[var(--portfolio-muted)]">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--portfolio-accent)]" />
              <span className="text-[var(--portfolio-ink)] font-medium">Hyderabad, India</span>
            </div>
            {currentTime ? (
              <span className="font-utility text-[0.66rem] font-semibold text-[var(--portfolio-accent)]">
                {currentTime} IST (UTC+5:30)
              </span>
            ) : null}
          </div>

          <div className="mt-6 border-t border-[var(--portfolio-rule)] pt-4">
            <p className="portfolio-meta-label mb-2.5">Connect & Channels</p>
            <Connections />
          </div>
        </aside>
      </div>

      <div className="relative mx-auto mt-16 max-w-7xl">
        <div className="portfolio-stat-grid">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="portfolio-stat-card">
                <div className="flex items-center justify-between">
                  <p className="portfolio-stat__value">{stat.value}</p>
                  <Icon className="h-4 w-4 text-[var(--portfolio-accent)] opacity-80" />
                </div>
                <p className="portfolio-meta-label mt-2">{stat.label}</p>
                <p className="mt-1 text-xs text-[var(--portfolio-muted)] line-clamp-1">
                  {stat.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
