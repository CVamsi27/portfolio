import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import ChapterLabel from "@/components/editorial/ChapterLabel";
import DisplayStatement from "@/components/editorial/DisplayStatement";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  inverted?: boolean;
};

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  className,
  inverted = false,
}: SectionHeadingProps) => {
  return (
    <Reveal
      className={cn(
        "editorial-section-heading portfolio-section-heading mb-10 border-b pb-8",
        inverted
          ? "border-white/15"
          : "border-[var(--portfolio-rule)]",
        className,
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <ChapterLabel
            eyebrow={eyebrow}
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.18em]",
              inverted ? "!text-[#ff3b2f]" : "!text-[var(--portfolio-accent)]",
            )}
          />
          <DisplayStatement
            as="h2"
            className={cn(
              "mt-4 !font-normal",
              inverted ? "!text-[#f4f3ee]" : "!text-[var(--portfolio-ink)]",
            )}
          >
            {title}
          </DisplayStatement>
        </div>
        {description ? (
          <p
            className={cn(
              "text-sm leading-relaxed sm:text-[15px] sm:leading-7 lg:justify-self-end lg:max-w-md",
              inverted ? "text-[#9c9ca6]" : "text-[var(--portfolio-muted)]",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
};
