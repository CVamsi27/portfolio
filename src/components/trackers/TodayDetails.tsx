import type { ReactNode } from "react";

export default function TodayDetails({ children }: { children: ReactNode }) {
  return (
    <details data-testid="today-details" className="border-t border-border/70 pt-4">
      <summary className="cursor-pointer list-none min-h-11 flex items-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <span className="inline-flex items-center gap-2">See today&apos;s details <span aria-hidden>↓</span></span>
      </summary>
      <div className="mt-5 space-y-5">{children}</div>
    </details>
  );
}
