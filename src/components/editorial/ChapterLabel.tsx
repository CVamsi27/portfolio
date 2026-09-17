import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function ChapterLabel({
  index,
  eyebrow,
  status,
  className,
}: {
  index?: string;
  eyebrow: string;
  status?: ReactNode;
  className?: string;
}) {
  return (
    <div data-editorial-kicker className={cn("editorial-kicker", className)}>
      {index ? <span className="editorial-kicker-index">{index}</span> : null}
      <span>{eyebrow}</span>
      {status ? <span className="editorial-kicker-status">{status}</span> : null}
    </div>
  );
}
