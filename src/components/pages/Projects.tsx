"use client";

import { PROJECTS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight } from "lucide-react";

const Projects = () => {
  return (
    <section id="Work" className="portfolio-section portfolio-work-section px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="A few things I have made"
          title="Selected work"
          description="Production systems and side projects, chosen for the problems they solve and the lessons they carry forward."
        />
        <div className="portfolio-work-index">
          {PROJECTS.map((project, index) => (
            <Reveal
              key={project.title}
              delay={(index % 2) * 70}
              data-project-index={String(index + 1).padStart(2, "0")}
              className={index === 0 ? "portfolio-work-row portfolio-work-row--lead" : "portfolio-work-row"}
            >
              <div className="portfolio-work-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="portfolio-work-copy">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h3>{project.title}</h3>
                  <ArrowUpRight className="portfolio-work-arrow h-5 w-5 shrink-0" />
                </div>
                <p>{project.description}</p>
                <div className="portfolio-tag-list">
                  {project.tech.split(", ").map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
                <div className="portfolio-work-links">
                  {project.gitLink ? (
                    <a href={project.gitLink} target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faGithub} className="h-3.5 w-3.5" />
                      Source
                    </a>
                  ) : null}
                  <a href={project.URL} target="_blank" rel="noopener noreferrer">
                    Live project <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
