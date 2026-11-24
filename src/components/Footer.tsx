"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { isTrackerHost, isTrackerPath, PORTFOLIO_BRAND } from "@/lib/brand";
import { CONTACT_EMAIL, RESUME_PATH } from "@/lib/const";

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

  const sectionHref = (anchor: string) =>
    pathname === "/" ? anchor : `/?#${anchor}`;

  return (
    <footer
      data-editorial-footer
      className="border-t border-[var(--portfolio-rule)] bg-[var(--portfolio-footer-bg)] text-[var(--portfolio-footer-ink)]"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-10 lg:px-16">
        <div className="grid gap-12 border-b border-[var(--portfolio-footer-rule)] py-16 lg:grid-cols-[1.45fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--portfolio-footer-muted)]">
              Senior Full Stack Engineer · Remote
            </p>
            <p className="font-display text-4xl font-light leading-[0.98] tracking-[-0.025em] sm:text-5xl">
              {PORTFOLIO_BRAND.personName}
            </p>
            <p className="max-w-md font-sans text-sm leading-relaxed text-[var(--portfolio-footer-muted)]">
              Architecting multi-tenant web applications, resilient TypeScript
              services, and verifiable PostgreSQL infrastructure.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1.5 border-b border-[var(--portfolio-footer-rule)] pb-0.5 font-sans text-sm font-medium transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
            >
              <span>{CONTACT_EMAIL}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--portfolio-footer-muted)]">
              Sections
            </p>
            <ul className="grid grid-cols-2 gap-y-2.5 font-sans text-sm text-[var(--portfolio-footer-muted)]">
              {[
                ["Work", "#Work"],
                ["Architecture", "#Architecture"],
                ["Open Source", "#OpenSource"],
                ["Experience", "#Experience"],
                ["Capabilities", "#Capabilities"],
                ["Contact", "#Contact"],
              ].map(([label, anchor]) => (
                <li key={anchor}>
                  <a
                    href={sectionHref(anchor)}
                    className="transition-colors hover:text-[var(--portfolio-footer-ink)]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--portfolio-footer-muted)]">
              Documents &amp; Channels
            </p>
            <div className="flex flex-col items-start gap-2.5 font-sans text-sm text-[var(--portfolio-footer-muted)]">
              <a
                href={RESUME_PATH}
                download="VamsiKrishna_Resume"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--portfolio-footer-ink)]"
              >
                <span>Resume (PDF)</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://github.com/CVamsi27"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--portfolio-footer-ink)]"
              >
                <span>GitHub (@CVamsi27)</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.linkedin.com/in/vamsikrishnachandaluri/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--portfolio-footer-ink)]"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <div className="flex items-center gap-4 pt-2 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("portfolio-open-terminal"),
                    )
                  }
                  className="cursor-pointer transition-colors hover:text-[var(--portfolio-footer-ink)]"
                  title="Open developer CLI terminal (~)"
                >
                  Terminal (~)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "?" }),
                    )
                  }
                  className="cursor-pointer transition-colors hover:text-[var(--portfolio-footer-ink)]"
                  title="Keyboard navigation shortcuts"
                >
                  Shortcuts (?)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 py-6 font-sans text-xs text-[var(--portfolio-footer-muted)] sm:flex-row">
          <p>
            © {year} {PORTFOLIO_BRAND.personName}. Engineered with Next.js &amp;
            TypeScript.
          </p>
          <a
            href="#Top"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--portfolio-footer-rule)] px-4 py-1.5 text-xs font-medium text-[var(--portfolio-footer-ink)] transition-colors hover:border-[var(--portfolio-footer-ink)]"
          >
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
