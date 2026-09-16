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
    <Reveal className={cn("max-w-3xl mx-auto mb-12", className)}>
      <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </span>
      <h2 className="font-display mt-4 text-3xl md:text-[2.5rem] md:leading-[1.1] font-bold tracking-tight">
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
