"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRACKER_BRAND } from "@/lib/brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "vk:install:dismissed";

/**
 * "Install app" banner for the hub. Appears only when the browser fires
 * `beforeinstallprompt` (Chromium/Android) and the user has not dismissed
 * it before. Never shows once the app runs installed — the event simply
 * doesn't fire in standalone display mode.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // take over the browser's mini-infobar
      let previouslyDismissed = false;
      try {
        previouslyDismissed = Boolean(window.localStorage.getItem(DISMISS_KEY));
      } catch {
        // storage unavailable — still allow the banner
      }
      if (!previouslyDismissed) setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setDeferred(null);
    try {
      window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") dismiss();
    else setDeferred(null); // dismissed in the browser UI — offer again next visit
  };

  if (!deferred) return null;

  return (
    <div data-editorial-action data-editorial-reveal className="flex items-center gap-3 border border-[#49E7FF]/35 bg-[#071014] p-3.5 text-white">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 shadow-md shadow-primary/25">
        <Download className="h-4 w-4 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install {TRACKER_BRAND.name}</p>
        <p className="text-xs text-muted-foreground">
          {TRACKER_BRAND.tagline} Full-screen app, offline support, home-screen icon.
        </p>
      </div>
      <Button size="sm" onClick={install}>
        Install
      </Button>
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
