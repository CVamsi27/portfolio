import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function DisplayStatement({
  children,
  accent,
  as: Tag = "h1",
  className,
}: {
  children: ReactNode;
  accent?: ReactNode;
  as?: "h1" | "h2" | "p";
  className?: string;
}) {
  const Component = Tag as ElementType;
  return (
    <Component data-editorial-statement className={cn("editorial-statement", className)}>
      {children}
      {accent ? <span className="editorial-statement-accent">{accent}</span> : null}
    </Component>
  );
}
