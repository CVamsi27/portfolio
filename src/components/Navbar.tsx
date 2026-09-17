"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { MENU_LIST } from "@/lib/const";
import { TRACKER_LINKS } from "@/lib/trackers";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";
import AuthButton from "./auth/AuthButton";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
const getHostname = () =>
  typeof window === "undefined" ? "" : window.location.hostname;

const Navbar = () => {
  const pathname = usePathname();
  // window.location.hostname is empty during SSR and the first client render,
  // so host-dependent hrefs resolve through an external store — the value
  // appears after hydration without setState-in-effect cascades.
  const host = useSyncExternalStore(emptySubscribe, getHostname, () => "");
  // On personal host, TrackerNavDock (inside TrackerShell) provides sub-nav,
  // so the top Navbar shows logo + auth + theme toggle (no duplicate links).
  const isPersonalHost = host.startsWith("personal.");
  const isTracker = pathname !== "/" || isPersonalHost;
  const [active, setActive] = useState(MENU_LIST[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sections = isTracker
      ? []
      : MENU_LIST.map((val) => document.getElementById(val));
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0);

      if (isTracker) return;
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
  }, [isTracker]);

  const menuItems = isTracker
    ? TRACKER_LINKS.map((t) => ({ label: t.label, href: t.href }))
    : MENU_LIST.map((m) => ({ label: m, href: `#${m}` }));

  const isMenuActive = (href: string) =>
    isTracker ? pathname === href : active === href.replace("#", "");

  // The proxy (host router) blocks /trackers on the portfolio host in production,
  // so the portal points at the personal subdomain there; locally it's /trackers.
  const portalHref = isPersonalHost || host === "localhost" || host.startsWith("127.") ? "/trackers" : "https://personal.buildora.work";

  return (
    <TooltipProvider delayDuration={200}>
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
            href={isTracker ? "/" : "#About"}
            className="font-display text-lg font-bold tracking-tight hover:text-primary transition-colors"
          >
            ~<span className="gradient-text">VK</span>
          </a>
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-1">
              {menuItems.map((item) =>
                isTracker ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full transition-colors",
                      isMenuActive(item.href)
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full transition-colors",
                      isMenuActive(item.href)
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    {item.label}
                  </a>
                ),
              )}
            </div>
            {/* Personal Suite portal — subtle lock-and-key entry from the resume */}
            {!isTracker && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={portalHref}
                    aria-label="Open the Personal Suite trackers"
                    className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 px-3 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:shadow-sm hover:shadow-primary/10"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Personal Suite</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Your private tracker command center — fasting, workouts, goals & more
                </TooltipContent>
              </Tooltip>
            )}
            {isTracker && (
              <div className="hidden md:block">
                <AuthButton />
              </div>
            )}
            <ModeToggle />
            <HeaderMenu items={menuItems} />
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
};

export default Navbar;
