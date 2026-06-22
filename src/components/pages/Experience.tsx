"use client";
import { WORK_EXPERIENCE } from "@/lib/const";

const Experience = () => {
  return (
    <section
      id="Experience"
      className="w-full px-6 py-20 bg-secondary/30"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-10 animate-fade-in">
          Experience
        </h2>
        <div className="relative flex flex-col">
          {WORK_EXPERIENCE.map((value, index) => (
            <div
              key={index}
              className="group relative flex gap-6 pb-10 last:pb-0 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {index < WORK_EXPERIENCE.length - 1 && (
                <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
              )}
              <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-background group-hover:border-primary group-hover:bg-primary/10 transition-colors" />
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                    {value.title}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {value.duration}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{value.company}</p>
                {value.details && value.details.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {value.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground leading-relaxed"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {value.tech.split(", ").map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
