"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating "back to top" button that becomes visible on portfolio pages
 * once the user has scrolled past 400px. Hidden on mobile when keyboard
 * is open (detects viewport height shrink). Only renders on portfolio surface.
 */
export default function ScrollToTop({
  isPortfolio,
}: {
  isPortfolio?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isPortfolio) return;
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isPortfolio]);

  if (!isPortfolio) return null;

  return (
    <a
      href="#Top"
      aria-label="Back to top"
      className={cn(
        "portfolio-scroll-fab fixed bottom-6 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)] hover:shadow-xl sm:hidden",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </a>
  );
}
