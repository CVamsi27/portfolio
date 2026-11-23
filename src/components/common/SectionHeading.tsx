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
        "editorial-section-heading portfolio-section-heading mb-12 border-b pb-8",
        inverted
          ? "border-[var(--portfolio-arch-rule)]"
          : "border-[var(--portfolio-rule)]",
        className,
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <ChapterLabel
            eyebrow={eyebrow}
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.14em]",
              inverted
                ? "!text-[var(--portfolio-arch-muted)]"
                : "!text-[var(--portfolio-muted)]",
            )}
          />
          <DisplayStatement
            as="h2"
            className={cn(
              "mt-4 !font-light",
              inverted
                ? "!text-[var(--portfolio-arch-ink)]"
                : "!text-[var(--portfolio-ink)]",
            )}
          >
            {title}
          </DisplayStatement>
        </div>
        {description ? (
          <p
            className={cn(
              "font-sans text-sm leading-relaxed sm:text-[15px] sm:leading-7 lg:max-w-md lg:justify-self-end",
              inverted
                ? "text-[var(--portfolio-arch-muted)]"
                : "text-[var(--portfolio-muted)]",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
};
