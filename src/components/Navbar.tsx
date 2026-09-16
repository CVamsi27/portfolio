"use client";

import { useEffect, useState } from "react";
import { MENU_LIST } from "@/lib/const";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [active, setActive] = useState(MENU_LIST[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sections = MENU_LIST.map((val) => document.getElementById(val));
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0);

      let current = MENU_LIST[0];
      for (const section of sections) {
        if (section && scrollTop >= section.offsetTop - 120) {
          current = section.id;
        }
      }
      if (
        window.innerHeight + scrollTop >=
        document.documentElement.scrollHeight - 40
      ) {
        current = MENU_LIST[MENU_LIST.length - 1];
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-transparent"
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-primary to-fuchsia-500 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
        <a
          href="#About"
          className="font-display text-lg font-bold tracking-tight hover:text-primary transition-colors"
        >
          ~<span className="gradient-text">VK</span>
        </a>
        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            {MENU_LIST.map((val) => (
              <a
                key={val}
                href={`#${val}`}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  active === val
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {val}
              </a>
            ))}
            <span className="mx-1 h-4 w-px bg-border" aria-hidden />
            <a
              href="/trackers"
              className="px-3 py-1.5 text-sm font-medium rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              Trackers →
            </a>
          </div>
          <ModeToggle />
          <HeaderMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;