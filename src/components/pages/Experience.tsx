import { WORK_EXPERIENCE } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

const Experience = () => {
  return (
    <section id="Experience" className="portfolio-section px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Where I have shipped"
          title="Experience"
          description="Five years of production engineering across healthcare SaaS, internal platforms, and enterprise services."
        />
        <div className="portfolio-experience-list">
          {WORK_EXPERIENCE.map((value, index) => (
            <Reveal
              key={`${value.company}-${value.duration}`}
              delay={index * 60}
              className="portfolio-experience-row"
            >
              <div className="portfolio-experience-meta">
                <span className="portfolio-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{value.duration}</span>
                <a href={value.URL} target="_blank" rel="noopener noreferrer">
                  {value.company} ↗
                </a>
              </div>
              <div className="portfolio-experience-body">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3>{value.title}</h3>
                  <span className="portfolio-experience-description">{value.description}</span>
                </div>
                {value.details?.length ? (
                  <ul className="portfolio-experience-details">
                    {value.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="portfolio-tag-list">
                  {value.tech.split(", ").map((tech) => (
                    <span key={tech}>{tech}</span>
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
