"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MENU_LIST, RESUME_PATH } from "@/lib/const";
import {
  PERSONAL_PRIMARY_NAV,
  isPersonalPrimaryPath,
} from "@/lib/personal-nav";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";
import AuthButton from "./auth/AuthButton";
import { cn } from "@/lib/utils";
import NovaMark from "@/components/brand/NovaMark";
import VamsiMark from "@/components/brand/VamsiMark";
import CommandPalette from "@/components/trackers/CommandPalette";
import KeyboardShortcutsModal from "@/components/trackers/KeyboardShortcutsModal";
import { isTrackerHost, isTrackerPath } from "@/lib/brand";
import {
  ArrowUpRight,
  BookOpen,
  Download,
  FileText,
  Plus,
  Keyboard,
  Search,
  Terminal,
} from "lucide-react";
import PortfolioShortcutsModal from "./PortfolioShortcutsModal";
import PortfolioCommandPalette from "./PortfolioCommandPalette";
import DeveloperTerminalDrawer from "./DeveloperTerminalDrawer";
import ResumeModal from "./ResumeModal";
import DeepStudyCockpitModal from "@/components/study/DeepStudyCockpitModal";
import FullPageRevisionGate from "@/components/study/FullPageRevisionGate";
import StudyBreakLoungeModal from "@/components/study/StudyBreakLoungeModal";
import { useTheme } from "next-themes";

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
  const { setTheme, resolvedTheme } = useTheme();
  const host = useSyncExternalStore(subscribeHostname, getHostname, () => "");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [portfolioShortcutsOpen, setPortfolioShortcutsOpen] = useState(false);
  const [portfolioPaletteOpen, setPortfolioPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [studyCockpitOpen, setStudyCockpitOpen] = useState(false);
  const [revisionGateOpen, setRevisionGateOpen] = useState(false);
  const [breakLoungeOpen, setBreakLoungeOpen] = useState(false);
  const gPressedRef = useRef(false);
  const gTimerRef = useRef<number | null>(null);

  const isTracker = Boolean(
    initialIsTracker || isTrackerHost(host) || isTrackerPath(pathname),
  );
  const [active, setActive] = useState(MENU_LIST[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isTracker) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        document.querySelector('[role="dialog"][aria-modal="true"]')
      )
        return;
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

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (gTimerRef.current) window.clearTimeout(gTimerRef.current);
        const k = e.key.toLowerCase();
        if (k === "h") {
          router.push("/hub");
          e.preventDefault();
        } else if (k === "p") {
          router.push("/plan");
          e.preventDefault();
        } else if (k === "e") {
          router.push("/health");
          e.preventDefault();
        } else if (k === "v") {
          router.push("/dashboard");
          e.preventDefault();
        } else if (k === "n") {
          router.push("/food");
          e.preventDefault();
        } else if (k === "m") {
          router.push("/more");
          e.preventDefault();
        } else if (k === "f") {
          router.push("/motivation");
          e.preventDefault();
        } else if (k === "l") {
          router.push("/log");
          e.preventDefault();
        } else if (k === "w") {
          router.push("/workout-tracking");
          e.preventDefault();
        } else if (k === "i") {
          router.push("/intermittent-fasting");
          e.preventDefault();
        } else if (k === "g") {
          router.push("/goal");
          e.preventDefault();
        } else if (k === "a") {
          router.push("/archive");
          e.preventDefault();
        } else if (k === "r") {
          router.push("/roadmap");
          e.preventDefault();
        } else if (k === "s") {
          router.push("/settings");
          e.preventDefault();
        }
        return;
      }

      if (e.key.toLowerCase() === "b") {
        setStudyCockpitOpen(true);
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
    if (isTracker) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        document.querySelector('[role="dialog"][aria-modal="true"]')
      )
        return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPortfolioPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === "~" || e.key === "`") {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setPortfolioShortcutsOpen((prev) => !prev);
        return;
      }

      const k = e.key.toLowerCase();
      if (k === "w") {
        document.getElementById("Work")?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "a") {
        document
          .getElementById("Architecture")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "o") {
        document
          .getElementById("OpenSource")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "e") {
        document
          .getElementById("Experience")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "s") {
        document
          .getElementById("Capabilities")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "i") {
        document
          .getElementById("Impact")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "c") {
        document
          .getElementById("Contact")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "t") {
        document.getElementById("Top")?.scrollIntoView({ behavior: "smooth" });
      } else if (k === "m") {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      } else if (k === "r") {
        setResumeOpen(true);
      } else if (k === "b") {
        setStudyCockpitOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTracker, resolvedTheme, setTheme]);

  useEffect(() => {
    if (isTracker) return;
    const onOpenTerm = () => setTerminalOpen(true);
    window.addEventListener("portfolio-open-terminal", onOpenTerm);
    return () =>
      window.removeEventListener("portfolio-open-terminal", onOpenTerm);
  }, [isTracker]);

  useEffect(() => {
    const onOpenStudy = () => setStudyCockpitOpen(true);
    window.addEventListener("portfolio-open-study-cockpit", onOpenStudy);
    return () =>
      window.removeEventListener("portfolio-open-study-cockpit", onOpenStudy);
  }, []);

  useEffect(() => {
    const onOpenRevision = () => setRevisionGateOpen(true);
    window.addEventListener("portfolio-open-revision-deck", onOpenRevision);
    return () =>
      window.removeEventListener(
        "portfolio-open-revision-deck",
        onOpenRevision,
      );
  }, []);

  useEffect(() => {
    const onOpenBreak = () => setBreakLoungeOpen(true);
    window.addEventListener("portfolio-open-break-lounge", onOpenBreak);
    return () =>
      window.removeEventListener("portfolio-open-break-lounge", onOpenBreak);
  }, []);

  useEffect(() => {
    const sections = isTracker
      ? []
      : MENU_LIST.map((val) =>
          document.getElementById(val.replace(/\s+/g, "")),
        );
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0);

      if (isTracker) return;
      let current = MENU_LIST[0].replace(/\s+/g, "");
      for (const section of sections) {
        if (section && scrollTop >= section.offsetTop - 120) {
          current = section.id;
        }
      }
      if (
        window.innerHeight + scrollTop >=
        document.documentElement.scrollHeight - 40
      ) {
        current = MENU_LIST[MENU_LIST.length - 1].replace(/\s+/g, "");
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isTracker]);

  const menuItems = isTracker
    ? PERSONAL_PRIMARY_NAV.map((item) => ({
        label: item.label,
        href: item.href,
      }))
    : MENU_LIST.map((m) => ({ label: m, href: `#${m.replace(/\s+/g, "")}` }));

  const isMenuActive = (href: string) =>
    isTracker
      ? isPersonalPrimaryPath(pathname, href)
      : active === href.replace("#", "");

  return (
    <nav
      data-testid="command-rail"
      className="dossier-command-rail sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-lg"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-transparent"
      >
        <div
          className={cn(
            "h-full transition-[width] duration-150 ease-out",
            isTracker
              ? "bg-[var(--color-dossier-lime)]"
              : "bg-gradient-to-r from-[var(--portfolio-accent)] via-[var(--portfolio-accent)] to-[var(--portfolio-clay)]",
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
          <div
            data-editorial-index
            className="hidden items-center gap-1 lg:flex"
            data-testid={isTracker ? "tracker-primary-nav" : undefined}
          >
            {menuItems.map((item) =>
              isTracker ? (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isMenuActive(item.href) ? "page" : undefined}
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
                  aria-current={isMenuActive(item.href) ? "page" : undefined}
                  className={cn(
                    "dossier-rail-link px-3 py-1.5 text-sm transition-all duration-200",
                    isMenuActive(item.href)
                      ? "is-active font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  {item.label}
                </a>
              ),
            )}
          </div>
          {isTracker ? (
            <a
              data-testid="personal-study-link"
              href="https://study.buildora.work/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-sm text-primary transition-colors hover:border-primary/60 hover:bg-primary/10"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Study Bible</span>
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
          {isTracker ? (
            <>
              <Link
                href="/log"
                aria-label="Quick capture"
                title="Quick capture"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-primary"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search or run command"
                title="Command Palette (⌘K)"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-2.5 text-xs text-muted-foreground transition-all hover:border-primary/60 hover:bg-accent hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-wider">
                  ⌘K
                </span>
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
          <div
            className={
              isTracker ? "hidden sm:inline-flex items-center" : "hidden"
            }
          >
            <AuthButton />
          </div>
          {!isTracker ? (
            <button
              type="button"
              onClick={() => setResumeOpen(true)}
              title="View interactive résumé modal"
              className="group hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-3 py-1.5 font-utility text-xs font-semibold text-[var(--portfolio-ink)] transition-all duration-200 hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)] hover:shadow-xs cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Resume</span>
            </button>
          ) : null}
          {!isTracker ? (
            <button
              type="button"
              onClick={() => setPortfolioPaletteOpen(true)}
              aria-label="Command Palette (⌘K)"
              title="Command Palette (⌘K)"
              className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-2.5 text-xs text-muted-foreground transition-all hover:border-[var(--portfolio-accent)]/60 hover:bg-accent hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden lg:inline font-utility text-[10px] uppercase tracking-wider">
                ⌘K
              </span>
            </button>
          ) : null}
          {!isTracker ? (
            <button
              type="button"
              onClick={() => setTerminalOpen(true)}
              aria-label="Developer Terminal (~)"
              title="Developer Terminal (~)"
              className="hidden xl:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/40 text-muted-foreground transition-all active:scale-95"
            >
              <Terminal className="h-4 w-4" />
            </button>
          ) : null}
          {!isTracker ? (
            <button
              type="button"
              onClick={() => setPortfolioShortcutsOpen(true)}
              aria-label="Keyboard Shortcuts (?)"
              title="Keyboard Shortcuts (?)"
              className="hidden xl:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/40 text-muted-foreground transition-all active:scale-95"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          ) : null}
          <ModeToggle />
          {!isTracker ? (
            <HeaderMenu
              items={[
                ...menuItems,
                { label: "Resume (PDF)", href: RESUME_PATH },
              ]}
              ariaLabel="Open portfolio menu"
            />
          ) : null}
        </div>
      </div>
      {isTracker ? (
        <>
          <CommandPalette
            open={paletteOpen}
            onClose={() => setPaletteOpen(false)}
          />
          <KeyboardShortcutsModal
            open={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />
        </>
      ) : (
        <>
          <PortfolioCommandPalette
            open={portfolioPaletteOpen}
            onClose={() => setPortfolioPaletteOpen(false)}
          />
          <PortfolioShortcutsModal
            open={portfolioShortcutsOpen}
            onClose={() => setPortfolioShortcutsOpen(false)}
          />
          <DeveloperTerminalDrawer
            open={terminalOpen}
            onClose={() => setTerminalOpen(false)}
          />
          <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
        </>
      )}
      <DeepStudyCockpitModal
        open={studyCockpitOpen}
        onClose={() => setStudyCockpitOpen(false)}
      />
      <FullPageRevisionGate
        open={revisionGateOpen}
        onClose={() => setRevisionGateOpen(false)}
        onOpenStudyCockpit={() => setStudyCockpitOpen(true)}
      />
      <StudyBreakLoungeModal
        open={breakLoungeOpen}
        onClose={() => setBreakLoungeOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
