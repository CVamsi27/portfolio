"use client";

import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShortcutGroup = {
  title: string;
  items: { keys: string[]; description: string }[];
};

const NOVA_GROUPS: ShortcutGroup[] = [
  {
    title: "Global Commands",
    items: [
      { keys: ["⌘", "K"], description: "Open Command Palette" },
      { keys: ["B"], description: "Open study workspace" },
      { keys: ["?"], description: "Show Keyboard Shortcuts" },
      { keys: ["T"], description: "Toggle Theme (Dark / Light)" },
      { keys: ["Esc"], description: "Close Active Dialog / Modal" },
    ],
  },
  {
    title: "Quick Navigation (Press G then…)",
    items: [
      { keys: ["G", "H"], description: "Go to Today Cockpit" },
      { keys: ["G", "P"], description: "Go to Plan" },
      { keys: ["G", "E"], description: "Go to Health" },
      { keys: ["G", "V"], description: "Go to Progress dashboard" },
      { keys: ["G", "N"], description: "Go to Food" },
      { keys: ["G", "M"], description: "Go to More" },
      { keys: ["G", "F"], description: "Go to Motivation" },
      { keys: ["G", "L"], description: "Go to Rapid Capture / Log" },
      { keys: ["G", "W"], description: "Go to Physical Workouts" },
      { keys: ["G", "I"], description: "Go to Intermittent Fasting" },
      { keys: ["G", "G"], description: "Go to Goals & Trajectory" },
      { keys: ["G", "A"], description: "Go to Library" },
      { keys: ["G", "R"], description: "Go to Career Roadmap & Curriculum" },
      { keys: ["G", "S"], description: "Go to System Settings" },
    ],
  },
  {
    title: "Execution & Timers",
    items: [{ keys: ["Enter"], description: "Submit a quick task" }],
  },
];

const PORTFOLIO_SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ["⌘K"], description: "Open Universal Command Palette" },
  { keys: ["~"], description: "Open Developer CLI Terminal" },
  { keys: ["W"], description: "Jump to Selected Work & Systems" },
  { keys: ["A"], description: "Jump to Architecture & GoF Patterns" },
  { keys: ["O"], description: "Jump to Public Code & Tooling" },
  { keys: ["E"], description: "Jump to Career Record & Roles" },
  { keys: ["S"], description: "Jump to Capabilities & Tech Shelf" },
  { keys: ["I"], description: "Jump to Verified Production Impact" },
  { keys: ["C"], description: "Jump to Start a Conversation" },
  { keys: ["T"], description: "Scroll back to the top" },
  { keys: ["R"], description: "Open interactive Résumé Viewer" },
  {
    keys: ["B"],
    description: "Launch Deep Study Cockpit & Anti-Distraction Shield",
  },
  { keys: ["M"], description: "Toggle Light / Dark Theme" },
  { keys: ["?"], description: "Toggle this Keyboard Shortcuts modal" },
  { keys: ["Esc"], description: "Dismiss this modal" },
];

/**
 * One keyboard-shortcuts sheet for both surfaces. The shortcut *data* stays
 * surface-specific (each surface has its own bindings); the dialog mechanics,
 * focus trap and Escape ownership are shared here.
 */
export default function ShortcutsModal({
  open,
  onClose,
  variant = "nova",
}: {
  open: boolean;
  onClose: () => void;
  variant?: "nova" | "portfolio";
}) {
  const nova = variant === "nova";
  const dialogRef = useDialogFocus(open, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4",
        !nova && "sm:p-6",
      )}
    >
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0",
          nova
            ? "animate-fade-in bg-background/80 backdrop-blur-md"
            : "bg-black/60 backdrop-blur-sm transition-opacity",
        )}
      />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden shadow-2xl outline-none",
          nova
            ? "animate-slide-up rounded-2xl border border-border/70 bg-card shadow-primary/15"
            : "rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 transition-all",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between",
            nova
              ? "border-b border-border/60 px-5 py-4"
              : "border-b border-[var(--portfolio-rule)] pb-4",
          )}
        >
          <div className="flex items-center gap-2.5">
            {nova ? (
              <>
                <Keyboard className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-bold">
                  Keyboard Shortcuts
                </h3>
              </>
            ) : (
              <>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]">
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
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className={cn(
              nova
                ? "rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {nova ? (
          <div className="max-h-[65vh] space-y-6 overflow-y-auto p-5">
            {NOVA_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  {group.title}
                </h4>
                <div className="mt-2.5 space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.description}
                      className="flex items-center justify-between gap-3 border-b border-border/30 py-1 text-xs last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, index) => (
                          <kbd
                            key={`${index}-${key}`}
                            className="min-w-6 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-center font-mono text-xs font-bold text-foreground shadow-xs"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
            {PORTFOLIO_SHORTCUTS.map((item) => (
              <div
                key={item.description}
                className="flex items-center justify-between rounded-lg border border-[var(--portfolio-rule)]/60 bg-muted/20 px-3 py-2 text-xs"
              >
                <span className="font-medium text-[var(--portfolio-muted)]">
                  {item.description}
                </span>
                <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-1.5 py-0.5 font-utility text-[0.65rem] font-bold text-[var(--portfolio-accent)] shadow-xs">
                  {item.keys.join(" ")}
                </kbd>
              </div>
            ))}
          </div>
        )}

        {nova ? (
          <div className="border-t border-border/50 bg-muted/30 px-5 py-2.5 text-center text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border border-border px-1 font-mono text-xs">
              ?
            </kbd>{" "}
            anytime to toggle this menu.
          </div>
        ) : (
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
        )}
      </div>
    </div>,
    document.body,
  );
}
