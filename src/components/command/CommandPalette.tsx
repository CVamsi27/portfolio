"use client";

import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";
import { cn } from "@/lib/utils";
import CommandSearch from "./CommandSearch";
import type { CommandItem } from "./types";

/**
 * One command palette for both surfaces. Each surface mounts it with its own
 * registry (`items`) and visual variant; combobox semantics, arrow navigation,
 * active-result visibility, focus trap and Escape ownership live in
 * CommandSearch + useDialogFocus and are shared by every surface.
 */
export default function CommandPalette({
  open,
  onClose,
  items,
  variant = "nova",
}: {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
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
      aria-label="Command Palette"
      className={cn(
        "fixed inset-0 flex items-start justify-center p-4",
        nova ? "z-[100] pt-16 sm:pt-24" : "z-[110] sm:p-6 sm:pt-24",
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
          "relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl shadow-2xl",
          nova
            ? "max-h-[calc(100dvh-5rem)] border border-border/70 bg-card shadow-primary/15 outline-none animate-slide-up sm:max-h-[calc(100dvh-7rem)]"
            : "max-h-[calc(100dvh-2rem)] border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] transition-all sm:max-h-[calc(100dvh-8rem)]",
        )}
      >
        <CommandSearch
          items={items}
          prefix={nova ? "nova-command" : "portfolio-command"}
          variant={variant}
          showClose
          onClose={onClose}
          onRun={onClose}
        />
        {nova ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/50 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span>Navigation:</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
                ↑
              </kbd>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
                ↓
              </kbd>
              <span>Select:</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
                ↵
              </kbd>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
                Esc
              </kbd>
              <span>to dismiss</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-[var(--portfolio-rule)] bg-muted/10 px-4 py-2 text-[0.65rem] font-utility text-[var(--portfolio-muted)]">
            <div className="flex items-center gap-2">
              <span>↑↓ Navigate</span>
              <span>·</span>
              <span>↵ Select</span>
              <span>·</span>
              <span>Esc Close</span>
            </div>
            <span className="font-semibold text-[var(--portfolio-accent)]">
              Command Palette
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
