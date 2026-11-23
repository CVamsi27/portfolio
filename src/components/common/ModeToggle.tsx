"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="h-9 w-9 rounded-full border border-[var(--portfolio-rule)] bg-transparent text-[var(--portfolio-ink)] transition-colors hover:border-[var(--portfolio-ink)] hover:bg-[var(--portfolio-wash)]"
    >
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <Sun
          className="absolute h-3.5 w-3.5 transition-all duration-200"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)",
          }}
        />
        <Moon
          className="absolute h-3.5 w-3.5 transition-all duration-200"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
          }}
        />
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
