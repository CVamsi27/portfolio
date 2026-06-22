"use client";
import { PROJECTS } from "@/lib/const";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight } from "lucide-react";

const Projects = () => {
  return (
    <section
      id="Projects"
      className="w-full px-6 py-20"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-10 animate-fade-in">
          Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECTS.map((value, index) => (
            <div
              key={index}
              className="group relative flex flex-col gap-3 p-5 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all animate-scale-in cursor-default"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                  {value.title}
                </h3>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {value.tech.split(", ").map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1">
                {value.gitLink && (
                  <a
                    href={value.gitLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FontAwesomeIcon icon={faGithub} className="h-3.5 w-3.5" />
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
