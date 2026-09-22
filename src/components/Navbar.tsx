"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MENU_LIST } from "@/lib/const";
import { PERSONAL_PRIMARY_NAV, isPersonalPrimaryPath } from "@/lib/personal-nav";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";
import AuthButton from "./auth/AuthButton";
import { cn } from "@/lib/utils";
import NovaMark from "@/components/brand/NovaMark";
import VamsiMark from "@/components/brand/VamsiMark";
import CommandPalette from "@/components/trackers/CommandPalette";
import KeyboardShortcutsModal from "@/components/trackers/KeyboardShortcutsModal";
import { ArrowUpRight, Keyboard, Search } from "lucide-react";

const subscribeHostname = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
  };
};

const getHostname = () =>
  typeof window === "undefined" ? "" : window.location.hostname;

const Navbar = ({ initialIsTracker }: { initialIsTracker?: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();
  const host = useSyncExternalStore(subscribeHostname, getHostname, () => "");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const gPressedRef = useRef(false);
  const gTimerRef = useRef<number | null>(null);

  const isPersonalHost = host.startsWith("personal.") || (typeof window !== "undefined" && window.location.hostname.startsWith("personal."));
  const isTracker = Boolean(initialIsTracker || isPersonalHost || pathname !== "/");
  const [active, setActive] = useState(MENU_LIST[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isTracker) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (gTimerRef.current) window.clearTimeout(gTimerRef.current);
        const k = e.key.toLowerCase();
        if (k === "h") { router.push("/hub"); e.preventDefault(); }
        else if (k === "f") { router.push("/motivation"); e.preventDefault(); }
        else if (k === "l") { router.push("/log"); e.preventDefault(); }
        else if (k === "w") { router.push("/workout-tracking"); e.preventDefault(); }
        else if (k === "i") { router.push("/intermittent-fasting"); e.preventDefault(); }
        else if (k === "g") { router.push("/goal"); e.preventDefault(); }
        else if (k === "a") { router.push("/archive"); e.preventDefault(); }
        else if (k === "s") { router.push("/settings"); e.preventDefault(); }
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gPressedRef.current = true;
        if (gTimerRef.current) window.clearTimeout(gTimerRef.current);
        gTimerRef.current = window.setTimeout(() => {
          gPressedRef.current = false;
        }, 1200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gTimerRef.current) window.clearTimeout(gTimerRef.current);
    };
  }, [isTracker, router]);

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
    ? PERSONAL_PRIMARY_NAV.map((item) => ({ label: item.label, href: item.href }))
    : MENU_LIST.map((m) => ({ label: m, href: `#${m}` }));

  const isMenuActive = (href: string) =>
    isTracker ? isPersonalPrimaryPath(pathname, href) : active === href.replace("#", "");

  return (
    <nav data-testid="command-rail" className="dossier-command-rail sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-lg">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-transparent"
        >
          <div
            className={cn(
              "h-full transition-[width] duration-150 ease-out",
              isTracker ? "bg-[var(--color-dossier-lime)]" : "bg-gradient-to-r from-primary via-primary to-fuchsia-500",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <a
            href={isTracker ? "/hub" : "#Top"}
            aria-label={isTracker ? "NOVA home" : "Vamsi Krishna portfolio"}
            className="transition-colors hover:text-primary"
          >
            {isTracker ? (
              <NovaMark variant="wordmark" simple label="NOVA" />
            ) : (
              <VamsiMark variant="wordmark" label="Vamsi Krishna portfolio" />
            )}
          </a>
          <div className="flex items-center gap-1.5">
            <div data-editorial-index className="hidden items-center gap-1 md:flex" data-testid={isTracker ? "tracker-primary-nav" : undefined}>
              {(isTracker ? menuItems : menuItems).map((item) =>
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
            {isTracker ? (
              <>
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  aria-label="Search or run command"
                  title="Command Palette (⌘K)"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-2.5 text-xs text-muted-foreground transition-all hover:border-primary/60 hover:bg-accent hover:text-foreground"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-wider">⌘K</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShortcutsOpen(true)}
                  aria-label="Keyboard Shortcuts (?)"
                  title="Keyboard Shortcuts (?)"
                  className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground transition-all hover:border-primary/60 hover:bg-accent hover:text-foreground"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}
            {isTracker ? <div className="hidden md:block"><AuthButton /></div> : null}
            {!isTracker ? (
              <a
                href="/VamsiKrishna_Resume.pdf"
                download="VamsiKrishna_Resume"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-3 py-1.5 font-utility text-xs font-semibold text-[var(--portfolio-ink)] transition-all hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
              >
                <span>Resume</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : null}
            <ModeToggle />
            {!isTracker ? (
              <HeaderMenu
                items={[
                  ...menuItems,
                  { label: "Resume (PDF)", href: "/VamsiKrishna_Resume.pdf" },
                ]}
                ariaLabel="Open portfolio menu"
              />
            ) : null}
          </div>
        </div>
        {isTracker ? (
          <>
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
            <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
          </>
        ) : null}
      </nav>
  );
};

export default Navbar;
