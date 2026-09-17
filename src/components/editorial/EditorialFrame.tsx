import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function EditorialFrame({
  surface,
  children,
  className,
}: {
  surface: "archive" | "paper" | "ink";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-surface={surface} className={cn("editorial-frame", className)}>
      {children}
    </section>
  );
}
