"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";
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

  const dialogRef = useDialogFocus(open, onClose);

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
      ref={dialogRef}
      tabIndex={-1}
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
      <div className="relative flex flex-col w-full max-w-7xl h-[94dvh] overflow-hidden border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Browser Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--portfolio-rule)] px-4 py-3 bg-[var(--portfolio-surface)]">
          {/* Title & Index */}
          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline-flex border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--portfolio-muted)]"
              aria-hidden="true"
            >
              SANDBOX
            </span>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--portfolio-ink)]" />
              <span className="font-display text-base font-light tracking-[-0.01em] text-[var(--portfolio-ink)] line-clamp-1">
                {title}
              </span>
            </div>
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-lg hidden md:flex items-center gap-2 border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-3 py-1.5 text-xs text-[var(--portfolio-muted)]">
            <Lock className="h-3 w-3 text-[var(--portfolio-ink)] shrink-0" />
            <span className="truncate font-mono text-[11px] text-[var(--portfolio-ink)]">
              {url}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-auto cursor-pointer text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)] transition-colors"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-3 w-3 text-[var(--portfolio-ink)]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Device Switcher & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-0.5">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={cn(
                  "flex h-11 w-11 cursor-pointer items-center justify-center text-[var(--portfolio-muted)] transition-colors",
                  device === "desktop" && "bg-[var(--portfolio-wash)] text-[var(--portfolio-ink)] font-semibold"
                )}
                title="Desktop View"
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={cn(
                  "flex h-11 w-11 cursor-pointer items-center justify-center text-[var(--portfolio-muted)] transition-colors",
                  device === "tablet" && "bg-[var(--portfolio-wash)] text-[var(--portfolio-ink)] font-semibold"
                )}
                title="Tablet View (768px)"
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={cn(
                  "flex h-11 w-11 cursor-pointer items-center justify-center text-[var(--portfolio-muted)] transition-colors",
                  device === "mobile" && "bg-[var(--portfolio-wash)] text-[var(--portfolio-ink)] font-semibold"
                )}
                title="Mobile View (390px)"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleReload}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] hover:border-[var(--portfolio-ink)] hover:text-[var(--portfolio-ink)] transition-colors"
              title="Reload Frame"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--portfolio-ink)] bg-[var(--portfolio-ink)] px-4 font-sans text-xs font-medium text-[var(--portfolio-paper)] transition-opacity hover:opacity-85"
              title="Open full site in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Launch Full</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] hover:border-[var(--portfolio-ink)] hover:text-[var(--portfolio-ink)] transition-colors"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="relative flex-1 w-full bg-[var(--portfolio-wash)] flex items-center justify-center overflow-auto p-2 sm:p-4">
          <div
            className={cn(
              "h-full transition-all duration-300 overflow-hidden border border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)]",
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
        <div className="flex items-center justify-between border-t border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] px-4 py-2 text-[11px] font-mono text-[var(--portfolio-muted)]">
          <span>Interactive sandbox preview · Isolated iframe session</span>
          <span className="text-[10px] uppercase tracking-[0.08em]">Press Esc to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
