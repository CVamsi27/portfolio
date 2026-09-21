import type { ReactNode } from "react";
import ChapterLabel from "./ChapterLabel";

export default function ActionBlock({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  testId,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  primary: ReactNode;
  secondary?: ReactNode;
  testId?: string;
}) {
  return (
    <section data-editorial-action data-testid={testId} className="editorial-action-block">
      {eyebrow ? <ChapterLabel eyebrow={eyebrow} /> : null}
      <div className="editorial-action-copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="editorial-action-controls">
        <div>{primary}</div>
        {secondary ? <div>{secondary}</div> : null}
      </div>
    </section>
  );
}
