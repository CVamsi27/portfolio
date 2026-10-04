"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { isTrackerHost, isTrackerPath, PORTFOLIO_BRAND } from "@/lib/brand";
import { RESUME_PATH } from "@/lib/const";

const subscribeHostname = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
  };
};

const getHostname = () => window.location.hostname;
const getServerHostname = () => "";

const Footer = ({ initialIsTracker }: { initialIsTracker?: boolean }) => {
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const host = useSyncExternalStore(
    subscribeHostname,
    getHostname,
    getServerHostname,
  );

  const isTracker = Boolean(
    initialIsTracker || isTrackerHost(host) || isTrackerPath(pathname),
  );

  if (isTracker) return null;

  return (
    <footer data-editorial-footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-10 lg:px-16">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <p className="font-utility text-xs">
            © {year}{" "}
            <span className="font-semibold text-foreground">
              {PORTFOLIO_BRAND.personName}
            </span>
          </p>
          <span className="hidden sm:inline text-border">·</span>
          <p className="text-xs text-[var(--portfolio-muted)]">
            Senior Full Stack &amp; Systems Engineer
          </p>
          <span className="hidden sm:inline text-border">·</span>
          <p className="text-xs text-[var(--portfolio-muted)] opacity-70">
            Built with Next.js &amp; Tailwind
          </p>
        </div>

        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs font-utility text-[var(--portfolio-muted)]">
          <a
            href="#Work"
            className="transition-colors hover:text-[var(--portfolio-accent)]"
          >
            Work
          </a>
          <a
            href="#Experience"
            className="transition-colors hover:text-[var(--portfolio-accent)]"
          >
            Experience
          </a>
          <a
            href="#Capabilities"
            className="transition-colors hover:text-[var(--portfolio-accent)]"
          >
            Stack
          </a>
          <a
            href="#Contact"
            className="transition-colors hover:text-[var(--portfolio-accent)]"
          >
            Contact
          </a>
          <a
            href={RESUME_PATH}
            download="VamsiKrishna_Resume"
            className="transition-colors hover:text-[var(--portfolio-accent)]"
          >
            Resume
          </a>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("portfolio-open-terminal"))
            }
            className="transition-colors hover:text-[var(--portfolio-accent)] cursor-pointer"
            title="Open developer CLI terminal (~)"
          >
            Terminal (~)
          </button>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))
            }
            className="transition-colors hover:text-[var(--portfolio-accent)] cursor-pointer"
            title="Keyboard navigation shortcuts"
          >
            Shortcuts (?)
          </button>
        </div>

        <a
          href="#Top"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-3.5 py-1.5 text-xs font-utility text-[var(--portfolio-muted)] transition-all hover:-translate-y-0.5 hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)]"
        >
          <span>Back to top</span>
          <ArrowUp className="h-3 w-3" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
