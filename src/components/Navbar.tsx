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
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
        <a
          href="#About"
          className="font-display text-lg font-semibold tracking-tight hover:text-primary transition-colors"
        >
          ~VK
        </a>
        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            {MENU_LIST.map((val) => (
              <a
                key={val}
                href={`#${val}`}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  active === val
                    ? "text-foreground bg-accent font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {val}
              </a>
            ))}
          </div>
          <ModeToggle />
          <HeaderMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;