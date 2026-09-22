"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Keyboard, X } from "lucide-react";

export type ShortcutGroup = {
  title: string;
  items: { keys: string[]; description: string }[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Global Commands",
    items: [
      { keys: ["⌘", "K"], description: "Open Command Palette" },
      { keys: ["?"], description: "Show Keyboard Shortcuts" },
      { keys: ["T"], description: "Toggle Theme (Dark / Light)" },
      { keys: ["Esc"], description: "Close Active Dialog / Modal" },
    ],
  },
  {
    title: "Quick Navigation (Press G then…)",
    items: [
      { keys: ["G", "H"], description: "Go to Today Cockpit" },
      { keys: ["G", "F"], description: "Go to Focus & Motivation" },
      { keys: ["G", "L"], description: "Go to Rapid Capture / Log" },
      { keys: ["G", "W"], description: "Go to Physical Workouts" },
      { keys: ["G", "I"], description: "Go to Intermittent Fasting" },
      { keys: ["G", "G"], description: "Go to Goals & Trajectory" },
      { keys: ["G", "A"], description: "Go to Second Brain Archive" },
      { keys: ["G", "S"], description: "Go to System Settings" },
    ],
  },
  {
    title: "Execution & Timers",
    items: [
      { keys: ["Space"], description: "Pause / Resume Focus Sprint (when active)" },
      { keys: ["Enter"], description: "Submit / Save Quick Task or Note" },
    ],
  },
];

export default function KeyboardShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        className="fixed inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/15 outline-none animate-slide-up">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold">Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                {group.title}
              </h4>
              <div className="mt-2.5 space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/30 last:border-0"
                  >
                    <span className="text-muted-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="min-w-6 text-center rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 bg-muted/30 px-5 py-2.5 text-center text-xs text-muted-foreground">
          Press <kbd className="rounded border border-border px-1 font-mono text-[10px]">?</kbd> anytime to toggle this menu.
        </div>
      </div>
    </div>,
    document.body,
  );
}
