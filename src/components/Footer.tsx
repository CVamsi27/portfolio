"use client";

import { useSyncExternalStore } from "react";
import { ArrowUp } from "lucide-react";
import { TRACKER_BRAND } from "@/lib/brand";

const emptySubscribe = () => () => {};
const getHostname = () =>
  typeof window === "undefined" ? "" : window.location.hostname;
const getPathname = () =>
  typeof window === "undefined" ? "/" : window.location.pathname;

const Footer = () => {
  const year = new Date().getFullYear();
  const host = useSyncExternalStore(emptySubscribe, getHostname, () => "");
  const pathname = useSyncExternalStore(emptySubscribe, getPathname, () => "/");
  const isTracker = host.startsWith("personal.") || pathname !== "/";

  return (
    <footer data-editorial-footer className="border-t border-border/40">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground">
        {isTracker ? (
          <p className="font-display text-sm font-bold tracking-[-0.02em] text-foreground">
            {TRACKER_BRAND.name} <span className="text-[#49E7FF]">·</span>{" "}
            <span className="text-muted-foreground">{TRACKER_BRAND.tagline}</span>
          </p>
        ) : (
          <p>
            © {year}{" "}
            <span className="font-medium text-foreground">
              Vamsi Krishna Chandaluri
            </span>
          </p>
        )}
        {!isTracker ? (
          <p className="hidden sm:block text-xs tracking-wide">
            TypeScript · React · PostgreSQL
          </p>
        ) : null}
        <a
          href={isTracker ? "/trackers" : "#About"}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-foreground"
        >
          {isTracker ? "Hub" : "Top"}
          <ArrowUp className="h-3 w-3" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
