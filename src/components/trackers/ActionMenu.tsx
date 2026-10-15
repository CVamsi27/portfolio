"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** A single keyboard-accessible home for secondary row operations. */
export default function ActionMenu({
  label = "Actions",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          ref={trigger}
          type="button"
          className="workspace-action-menu"
          aria-label={label}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
          <span>Actions</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[90]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => {
            if (!document.querySelector('[role="dialog"]'))
              trigger.current?.focus();
          });
        }}
      >
        {Children.toArray(children)
          .filter(isValidElement)
          .map((child, index) => (
            <DropdownMenuItem
              key={index}
              asChild
              onSelect={() => trigger.current?.focus()}
              disabled={Boolean(
                (child.props as { disabled?: boolean }).disabled,
              )}
              className="min-h-11"
            >
              {cloneElement(
                child as ReactElement<{
                  children: ReactNode;
                  className?: string;
                  "aria-label"?: string;
                }>,
                {
                  className:
                    "flex w-full min-h-11 items-center justify-start gap-2 rounded px-3 py-2 text-left text-sm",
                },
                (child.props as { children: ReactNode; "aria-label"?: string })[
                  "aria-label"
                ] ?? (child.props as { children: ReactNode }).children,
              )}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
