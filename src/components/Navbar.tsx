"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MENU_LIST } from "@/lib/const";
import { TRACKER_LINKS } from "@/lib/trackers";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";
import AuthButton from "./auth/AuthButton";
import { cn } from "@/lib/utils";
import NovaMark from "@/components/brand/NovaMark";
import BuildoraMark from "@/components/brand/BuildoraMark";

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
    : [
        ...MENU_LIST.map((m) => ({ label: m, href: `#${m}` })),
        { label: "Study", href: "https://study.buildora.work" },
      ];

  const isMenuActive = (href: string) =>
    isTracker ? pathname === href : active === href.replace("#", "");

  // The proxy (host router) blocks /trackers on the portfolio host in production,
  // so the portal points at the personal subdomain there; locally it's /trackers.
  const portalHref = isPersonalHost || host === "localhost" || host.startsWith("127.") ? "/trackers" : "https://personal.buildora.work";

  return (
    <TooltipProvider delayDuration={200}>
      <nav data-testid="command-rail" className="dossier-command-rail sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-lg">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-transparent"
        >
          <div
            className="h-full bg-gradient-to-r from-primary via-primary to-fuchsia-500 transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <a
            href={isTracker ? "/trackers" : "#About"}
            aria-label={isTracker ? "NOVA//OS home" : "Buildora home"}
            className="transition-colors hover:text-primary"
          >
            {isTracker ? (
              <NovaMark variant="wordmark" simple label="NOVA//OS" />
            ) : (
              <BuildoraMark variant="wordmark" label="Buildora" />
            )}
          </a>
          <div className="flex items-center gap-1">
            <div data-editorial-index className="hidden items-center gap-1 md:flex">
              {menuItems.map((item) =>
                isTracker ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "dossier-rail-link px-3 py-1.5 text-sm transition-colors",
                      isMenuActive(item.href)
                        ? "is-active"
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
                      "dossier-rail-link px-3 py-1.5 text-sm transition-colors",
                      isMenuActive(item.href)
                        ? "is-active"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    {item.label}
                  </a>
                ),
              )}
            </div>
            {/* NOVA//OS portal — subtle entry from the resume */}
            {!isTracker && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={portalHref}
                    aria-label="Open the NOVA//OS trackers"
                    className="dossier-portal-link ml-1 inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold text-muted-foreground transition-all"
                  >
                    <NovaMark variant="mark" className="[&>svg]:h-3.5 [&>svg]:w-3.5" />
                    <span className="hidden lg:inline">NOVA//OS</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Your next chapter, in motion — fasting, workouts, goals & more
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
