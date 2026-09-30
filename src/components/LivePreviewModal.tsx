"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ExternalLink,
  Laptop,
  Maximize2,
  RefreshCw,
  Smartphone,
  Tablet,
  X,
  Lock,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DeviceMode = "desktop" | "tablet" | "mobile";

const emptySubscribe = () => () => {};

export default function LivePreviewModal({
  open,
  title,
  url,
  onClose,
}: {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  if (!mounted || !open) return null;

  const deviceWidthClasses: Record<DeviceMode, string> = {
    desktop: "w-full",
    tablet: "w-[768px] max-w-full",
    mobile: "w-[390px] max-w-full",
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Live preview of ${title}`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative flex flex-col w-full max-w-7xl h-[94vh] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Browser Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3 bg-muted/30">
          {/* Title & Dots */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                {title}
              </span>
            </div>
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-lg hidden md:flex items-center gap-2 rounded-lg border border-border/80 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground shadow-inner">
            <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
            <span className="truncate font-mono text-[11px] text-foreground">
              {url}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Device Switcher & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  device === "desktop" && "bg-card text-foreground shadow-xs font-semibold"
                )}
                title="Desktop View"
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  device === "tablet" && "bg-card text-foreground shadow-xs font-semibold"
                )}
                title="Tablet View (768px)"
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  device === "mobile" && "bg-card text-foreground shadow-xs font-semibold"
                )}
                title="Mobile View (390px)"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleReload}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Reload Frame"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              title="Open full site in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Launch Full</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="relative flex-1 w-full bg-muted/20 flex items-center justify-center overflow-auto p-2 sm:p-4">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-xl overflow-hidden shadow-md border border-border/70 bg-background",
              deviceWidthClasses[device]
            )}
          >
            <iframe
              key={iframeKey}
              src={url}
              title={`${title} live preview`}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
            />
          </div>
        </div>

        {/* Status notice */}
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 bg-muted/10 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Interactive sandbox preview · Protected sandbox mode
          </span>
          <span className="font-mono text-[10px]">Press Esc to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
