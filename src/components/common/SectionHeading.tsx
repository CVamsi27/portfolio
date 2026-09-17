import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import StoryPanel from "@/components/trackers/StoryPanel";

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
      <StoryPanel eyebrow={eyebrow} title={title}>
        {description}
      </StoryPanel>
    </Reveal>
  );
};
