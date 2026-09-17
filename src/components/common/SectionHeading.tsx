import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import ChapterLabel from "@/components/editorial/ChapterLabel";
import DisplayStatement from "@/components/editorial/DisplayStatement";

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
    <Reveal className={cn("editorial-section-heading mb-12", className)}>
      <ChapterLabel eyebrow={eyebrow} />
      <DisplayStatement as="h2" className="mt-5 max-w-[9ch] text-[clamp(3rem,8vw,7rem)]">
        {title}
      </DisplayStatement>
      {description ? <p className="editorial-section-description mt-6 max-w-2xl">{description}</p> : null}
    </Reveal>
  );
};
