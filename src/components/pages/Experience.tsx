"use client";
import { WORK_EXPERIENCE } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

const Experience = () => {
  return (
    <section id="Experience" data-chapter-index="01" className="w-full bg-secondary/30 px-6 py-16 md:py-20">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          eyebrow="Career"
          title="Experience"
          description="5+ years shipping production software — from multi-tenant healthcare SaaS to internal platforms and enterprise services."
        />
        <div className="relative flex flex-col">
          {WORK_EXPERIENCE.map((value, index) => (
            <Reveal
              key={index}
              delay={index * 60}
              className="group relative flex gap-6 pb-10 last:pb-0"
            >
              {index < WORK_EXPERIENCE.length - 1 && (
                <div className="absolute left-[7px] top-5 bottom-0 w-px bg-gradient-to-b from-primary/40 to-border" />
              )}
              <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary/40 bg-background transition-colors group-hover:border-primary group-hover:bg-primary group-hover:shadow-md group-hover:shadow-primary/40" />
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <h3 className="font-display text-base font-semibold group-hover:text-primary transition-colors">
                    {value.title}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {value.duration}
                  </span>
                </div>
                <a
                  href={value.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
                >
                  {value.company}
                  <span className="ml-0.5 inline-block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    ↗
                  </span>
                </a>
                {value.details && value.details.length > 0 && (
                  <ul className="mt-1 space-y-1.5">
                    {value.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground leading-relaxed flex gap-2.5"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {value.tech.split(", ").map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-background text-secondary-foreground border border-border/70"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
