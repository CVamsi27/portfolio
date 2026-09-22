import Connections from "../Connections";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpRight } from "lucide-react";

const STATS = [
  { value: "5+", label: "Years shipping" },
  { value: "25+", label: "Clinics live" },
  { value: "1k+", label: "Appts / month" },
  { value: "85%+", label: "Test coverage" },
];

const About = () => {
  return (
    <section
      id="Top"
      data-chapter-index="00"
      className="portfolio-hero relative overflow-hidden px-6 pb-24 pt-20 sm:px-10 sm:pb-32 sm:pt-28 lg:px-16"
    >
      <div aria-hidden className="portfolio-hero__wash" />
      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-20">
        <div className="max-w-5xl">
          <div className="portfolio-kicker">
            <span className="portfolio-kicker__dot" />
            Available for thoughtful product engineering work
          </div>
          <p className="mt-7 font-utility text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--portfolio-muted)]">
            Vamsi Krishna Chandaluri · Full Stack Engineer
          </p>
          <h1 className="portfolio-hero__title mt-5 max-w-5xl">
            I build software
            <br />
            <span>that earns its place.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--portfolio-muted)] sm:text-xl">
            I work across product interfaces, dependable APIs, and the systems
            that carry them into production — making complex workflows feel
            clear, useful, and durable.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#Work" className="portfolio-primary-action">
              See selected work
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Button asChild variant="outline" className="portfolio-secondary-action">
              <a href="/VamsiKrishna_Resume.pdf" download="VamsiKrishna_Resume">
                Download resume
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <aside className="portfolio-hero__aside">
          <p className="portfolio-meta-label">Currently</p>
          <p className="mt-3 text-lg font-medium leading-7 text-[var(--portfolio-ink)]">
            Building multi-tenant healthcare workflows for clinics across India.
          </p>
          <div className="mt-8 border-t border-[var(--portfolio-rule)] pt-4">
            <p className="portfolio-meta-label">Focus</p>
            <p className="mt-2 text-sm leading-6 text-[var(--portfolio-muted)]">
              TypeScript · React · NestJS · PostgreSQL
            </p>
          </div>
          <div className="mt-8">
            <Connections />
          </div>
        </aside>
      </div>

      <div className="relative mx-auto mt-20 grid max-w-7xl grid-cols-2 border-y border-[var(--portfolio-rule)] sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="portfolio-stat">
            <p className="portfolio-stat__value">{stat.value}</p>
            <p className="portfolio-meta-label mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default About;
