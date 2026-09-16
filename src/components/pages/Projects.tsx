"use client";
import { PROJECTS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight } from "lucide-react";

const Projects = () => {
  return (
    <section id="Projects" className="w-full px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects"
          description="Production systems and side projects — each built to solve a real problem and to sharpen the stack."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECTS.map((value, index) => (
            <Reveal
              key={index}
              delay={(index % 2) * 80}
              className="group relative flex flex-col gap-3 p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-base font-semibold group-hover:text-primary transition-colors">
                  {value.title}
                </h3>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 shrink-0 mt-0.5" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {value.tech.split(", ").map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-background text-muted-foreground border border-border/70"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1 mt-auto">
                {value.gitLink && (
                  <a
                    href={value.gitLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faGithub}
                      className="h-3.5 w-3.5"
                    />
                    Source
                  </a>
                )}
                <a
                  href={value.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Live Demo
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;