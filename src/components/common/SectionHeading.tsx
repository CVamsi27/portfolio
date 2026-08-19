import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  className,
}: SectionHeadingProps) => {
  return (
    <Reveal className={cn("max-w-3xl mx-auto mb-10", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </Reveal>
  );
};