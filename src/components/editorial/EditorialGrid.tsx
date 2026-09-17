import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function EditorialGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("editorial-grid", className)}>{children}</div>;
}
