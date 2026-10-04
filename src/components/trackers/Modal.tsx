"use client";

import { useDialogFocus } from "@/components/common/useDialogFocus";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight accessible modal — portal + backdrop blur + Esc + scroll lock
 * + focus management (initial focus, Tab trap, restore on close).
 * No Radix Dialog dependency needed for tracker flows.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const dialogRef = useDialogFocus(open, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="fixed inset-0 z-[90] flex items-end justify-center p-0 outline-none sm:items-center sm:p-4"
    >
      <div
        aria-hidden
        className="animate-fade-in absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "animate-slide-up relative flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-card shadow-2xl shadow-primary/10 outline-none sm:rounded-2xl",
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-5 py-3.5">
          <h2 className="font-display font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border/40 px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
