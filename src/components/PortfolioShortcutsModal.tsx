"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Keyboard, X } from "lucide-react";

export type ShortcutItem = {
  key: string;
  label: string;
  description: string;
};

const emptySubscribe = () => () => {};

const SHORTCUTS: ShortcutItem[] = [
  { key: "⌘K", label: "Palette", description: "Open Universal Command Palette" },
  { key: "~", label: "Terminal", description: "Open Developer CLI Terminal" },
  { key: "W", label: "Work", description: "Jump to Selected Work & Systems" },
  { key: "A", label: "Architecture", description: "Jump to Architecture & GoF Patterns" },
  { key: "O", label: "Open Source", description: "Jump to Public Code & Tooling" },
  { key: "E", label: "Experience", description: "Jump to Career Record & Roles" },
  { key: "S", label: "Stack", description: "Jump to Capabilities & Tech Shelf" },
  { key: "I", label: "Impact", description: "Jump to Verified Production Impact" },
  { key: "C", label: "Contact", description: "Jump to Start a Conversation" },
  { key: "T", label: "Top", description: "Scroll back to the top" },
  { key: "R", label: "Resume", description: "Open interactive Résumé Viewer" },
  { key: "B", label: "Study Sprint", description: "Launch Deep Study Cockpit & Anti-Distraction Shield" },
  { key: "M", label: "Mode", description: "Toggle Light / Dark Theme" },
  { key: "?", label: "Help", description: "Toggle this Keyboard Shortcuts modal" },
  { key: "Esc", label: "Close", description: "Dismiss this modal" },
];

export default function PortfolioShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[var(--portfolio-ink)]">
                Keyboard Shortcuts
              </h2>
              <p className="font-utility text-[0.68rem] text-[var(--portfolio-muted)]">
                Navigate the portfolio instantly from your keyboard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-[var(--portfolio-rule)]/60 bg-muted/20 px-3 py-2 text-xs"
            >
              <span className="text-[var(--portfolio-muted)] font-medium">
                {item.description}
              </span>
              <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-1.5 py-0.5 font-utility text-[0.65rem] font-bold text-[var(--portfolio-accent)] shadow-xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--portfolio-rule)] pt-4 text-[0.68rem] text-[var(--portfolio-muted)]">
          <span>Shortcuts are active when no input is focused</span>
          <button
            type="button"
            onClick={onClose}
            className="font-utility font-semibold text-[var(--portfolio-accent)] hover:underline"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
