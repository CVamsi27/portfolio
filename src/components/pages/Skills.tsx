import { SKILLS } from "@/lib/const";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

const CAPABILITIES = [
  {
    title: "Product engineering",
    items: ["React interfaces", "Accessible flows", "Design systems", "TypeScript delivery"],
  },
  {
    title: "Backend systems",
    items: ["NestJS and Node.js", "PostgreSQL data models", "APIs and integrations", "Queues and webhooks"],
  },
  {
    title: "Quality and delivery",
    items: ["Jest and Vitest", "Playwright", "GitHub Actions", "Docker"],
  },
  {
    title: "Working style",
    items: ["End-to-end ownership", "Clear boundaries", "Mentoring", "Measured iteration"],
  },
];

const Skills = () => {
  return (
    <section id="Capabilities" className="portfolio-section px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How I work"
          title="Capabilities"
          description="I care about the seam between a thoughtful interface, a dependable system, and the team that has to maintain both."
        />

        <div className="portfolio-capability-grid">
          {CAPABILITIES.map((group, index) => (
            <Reveal key={group.title} delay={index * 60} className="portfolio-capability-group">
              <span className="portfolio-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <div className="portfolio-tech-strip">
          <p className="portfolio-meta-label">Tools in the rotation</p>
          <div className="portfolio-tag-list mt-4">
            {SKILLS.map((skill) => (
              <span key={skill.alt}>{skill.alt}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
