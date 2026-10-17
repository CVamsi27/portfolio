"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Keep the visual indicator small inside a square, accessible hit target. */
export default function CompletionToggle({
  checked,
  label,
  onClick,
  round = false,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
  round?: boolean;
}) {
  return (
    <button
      type="button"
      className="workspace-completion"
      aria-label={label}
      aria-pressed={checked}
      onClick={onClick}
    >
      <span
        aria-hidden
        className={cn(
          "workspace-completion-indicator",
          round && "is-round",
          checked && "is-complete",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
