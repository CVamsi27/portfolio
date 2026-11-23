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
    pathname === "/" ? anchor : `/${anchor}`;

  return (
    <footer
      data-editorial-footer
      className="border-t border-white/15 bg-[#08080a] text-[#f4f3ee]"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-10 lg:px-16">
        {/* Top Monumental Editorial Colophon */}
        <div className="grid gap-10 border-b border-white/12 py-14 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e8e98]">
              <span
                className="inline-block h-1.5 w-1.5 bg-[#ff3b2f]"
                aria-hidden="true"
              />
              <span>Senior Full Stack Engineer · Remote</span>
            </div>
            <p className="font-display text-4xl leading-[0.95] tracking-[-0.02em] text-[#f4f3ee] sm:text-5xl">
              {PORTFOLIO_BRAND.personName}
            </p>
            <p className="max-w-md text-sm leading-relaxed text-[#8e8e98]">
              Architecting multi-tenant web applications, resilient TypeScript
              services, and verifiable PostgreSQL infrastructure.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1.5 border-b border-white/25 pb-0.5 font-mono text-xs text-[#f4f3ee] transition-colors hover:border-[#ff3b2f] hover:text-[#ff3b2f]"
            >
              <span>{CONTACT_EMAIL}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e8e98]">
              Index
            </p>
            <ul className="grid grid-cols-2 gap-y-2 font-mono text-xs text-[#c7c6c0]">
              <li>
                <a
                  href={sectionHref("#Work")}
                  className="transition-colors hover:text-[#ff3b2f]"
                >
                  01 Work
                </a>
              </li>
              <li>
                <a
                  href={sectionHref("#Architecture")}
                  className="transition-colors hover:text-[#ff3b2f]"
                >
                  02 Patterns
                </a>
              </li>
              <li>
                <a
                  href={sectionHref("#OpenSource")}
                  className="transition-colors hover:text-[#ff3b2f]"
                >
                  03 Open Source
                </a>
              </li>
              <li>
                <a
                  href={sectionHref("#Experience")}
                  className="transition-colors hover:text-[#ff3b2f]"
                >
                  04 Experience
                </a>
              </li>
              <li>
                <a
                  href={sectionHref("#Capabilities")}
                  className="transition-colors hover:text-[#ff3b2f]"
                >
                  05 Stack
                </a>
              </li>
              <li>
                <a
                  href={sectionHref("#Contact")}
                  className="transition-colors hover:text-[#ff3b2f]"
                >
                  07 Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e8e98]">
              Documents &amp; Tools
            </p>
            <div className="flex flex-col items-start gap-2 font-mono text-xs text-[#c7c6c0]">
              <a
                href={RESUME_PATH}
                download="VamsiKrishna_Resume"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#ff3b2f]"
              >
                <span>Resume (PDF)</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/CVamsi27"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#ff3b2f]"
              >
                <span>GitHub (@CVamsi27)</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <a
                href="https://www.linkedin.com/in/vamsikrishnachandaluri/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#ff3b2f]"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <div className="flex items-center gap-4 pt-1 text-[11px] text-[#8e8e98]">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("portfolio-open-terminal"),
                    )
                  }
                  className="cursor-pointer transition-colors hover:text-[#f4f3ee]"
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
                  className="cursor-pointer transition-colors hover:text-[#f4f3ee]"
                  title="Keyboard navigation shortcuts"
                >
                  Shortcuts (?)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Return Bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 font-mono text-[11px] text-[#8e8e98] sm:flex-row">
          <p>
            © {year} {PORTFOLIO_BRAND.personName} · Engineered with Next.js &amp;
            TypeScript
          </p>
          <a
            href="#Top"
            className="inline-flex items-center gap-2 border border-white/15 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[#f4f3ee] transition-colors hover:border-[#ff3b2f] hover:text-[#ff3b2f]"
          >
            <span>Back to top</span>
            <ArrowUp className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
