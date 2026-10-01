"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type DistractionShieldState,
  DEFAULT_SHIELD_STATE,
  shouldInterceptUrl,
} from "@/lib/distraction-shield";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import DistractionShieldModal from "@/components/study/DistractionShieldModal";
import DistractionShieldBanner from "@/components/study/DistractionShieldBanner";
import MobileStudyLockdownBarrier from "@/components/study/MobileStudyLockdownBarrier";
import NightCurfewLockdownBarrier from "@/components/study/NightCurfewLockdownBarrier";

export default function DistractionInterceptor() {
  const { value: shieldState } = useSyncedStorage<DistractionShieldState>(
    "distraction_shield_state",
    DEFAULT_SHIELD_STATE
  );

  const [shieldOpen, setShieldOpen] = useState(false);
  const [shieldTarget, setShieldTarget] = useState("");

  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Check URL params for external redirects (e.g. from Tampermonkey userscript)
  useEffect(() => {
    const target = searchParams?.get("shield_target");
    const block = searchParams?.get("shield_block");
    if (!target && !block) return;

    const timeout = setTimeout(() => {
      setShieldTarget(target ? decodeURIComponent(target) : "https://instagram.com");
      setShieldOpen(true);
    }, 0);

    // Clean up query param from URL without reloading
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("shield_target");
      url.searchParams.delete("shield_block");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }

    return () => clearTimeout(timeout);
  }, [searchParams, pathname]);

  // Intercept in-app clicks to blocked domains
  useEffect(() => {
    if (!shieldState.enabled) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const link = target.closest("a");
      if (!link || !link.href) return;

      const href = link.href;

      // Don't intercept internal links
      if (href.startsWith(window.location.origin) || href.startsWith("/") || href.startsWith("#")) {
        return;
      }

      if (shouldInterceptUrl(href, shieldState)) {
        e.preventDefault();
        e.stopPropagation();
        setShieldTarget(href);
        setShieldOpen(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [shieldState]);

  // Support custom event triggering across the entire portfolio
  useEffect(() => {
    const handleCustomTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ url?: string }>;
      const targetUrl = customEvent.detail?.url || "https://x.com";
      setShieldTarget(targetUrl);
      setShieldOpen(true);
    };

    window.addEventListener("portfolio-trigger-distraction-shield", handleCustomTrigger);
    return () => {
      window.removeEventListener("portfolio-trigger-distraction-shield", handleCustomTrigger);
    };
  }, []);

  const handleOpenDirect = useCallback((url?: string) => {
    setShieldTarget(url || "https://x.com");
    setShieldOpen(true);
  }, []);

  return (
    <>
      <DistractionShieldModal
        open={shieldOpen}
        targetUrl={shieldTarget}
        onClose={() => setShieldOpen(false)}
      />
      <DistractionShieldBanner onOpenShield={handleOpenDirect} />
      <MobileStudyLockdownBarrier />
      <NightCurfewLockdownBarrier />
    </>
  );
}
