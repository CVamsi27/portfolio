"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandItem } from "./types";

/**
 * The shared search surface for both surfaces' command palettes and the
 * mobile QuickSheet: one combobox, one listbox, arrow/enter ownership,
 * active-result visibility and a clear-query control. Escape and Tab stay
 * owned by the surrounding dialog (useDialogFocus).
 */
export default function CommandSearch({
  items,
  prefix,
  variant,
  autoFocus = true,
  embedded = false,
  showClose = false,
  onClose,
  onRun,
}: {
  items: CommandItem[];
  /** Unique DOM id prefix for the results listbox and its options. */
  prefix: string;
  variant: "nova" | "portfolio";
  /** Focus the input while true (palettes open; the sheet's Search tab). */
  autoFocus?: boolean;
  /** Trims chrome when embedded inside another dialog body. */
  embedded?: boolean;
  showClose?: boolean;
  onClose?: () => void;
  onRun?: () => void;
}) {
  const nova = variant === "nova";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((keyword) => keyword.includes(q)),
    );
  }, [items, query]);

  useEffect(() => {
    if (!autoFocus) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timeout);
  }, [autoFocus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target !== inputRef.current ||
        event.isComposing ||
        event.defaultPrevented
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length ? (prev + 1) % filtered.length : 0,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selected = filtered[selectedIndex];
        if (selected) {
          selected.run();
          onRun?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, onClose, onRun, selectedIndex]);

  useEffect(() => {
    if (filtered[selectedIndex])
      document
        .getElementById(`${prefix}-${filtered[selectedIndex].id}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [filtered, prefix, selectedIndex]);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3",
          embedded
            ? "border-b border-border/40 pb-3"
            : nova
              ? "border-b border-border/60 px-4 py-3 sm:px-5"
              : "border-b border-[var(--portfolio-rule)] px-4 py-3",
        )}
      >
        <Search
          className={cn(
            "shrink-0",
            nova ? "h-5 w-5 text-primary" : "h-4 w-4 text-[var(--portfolio-muted)]",
          )}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls={`${prefix}-results`}
          aria-activedescendant={
            filtered[selectedIndex]
              ? `${prefix}-${filtered[selectedIndex].id}`
              : undefined
          }
          aria-label="Search commands"
          placeholder={
            nova
              ? "Search pages or actions…"
              : "Search pages, projects, or actions…"
          }
          className={cn(
            "min-w-0 flex-1 bg-transparent outline-none",
            nova
              ? "text-sm font-medium placeholder:text-muted-foreground"
              : "font-utility text-sm text-[var(--portfolio-ink)] placeholder:text-[var(--portfolio-muted)]/70 focus:outline-none",
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear query"
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg p-1",
              nova
                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                : "text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg p-1",
              nova
                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                : "text-[var(--portfolio-muted)] hover:bg-muted",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        id={`${prefix}-results`}
        role="listbox"
        aria-label="Commands"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto p-2",
          !nova && "scrollbar-thin",
        )}
      >
        {filtered.length === 0 ? (
          <div
            className={cn(
              "text-center",
              nova
                ? "py-12 text-sm text-muted-foreground"
                : "py-8 text-xs text-[var(--portfolio-muted)]",
            )}
          >
            {nova
              ? "No matching commands found."
              : "No matching commands or projects found."}
          </div>
        ) : (
          <ul role="presentation" className={nova ? "space-y-1" : undefined}>
            {filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <li key={item.id} role="presentation">
                  <button
                    role="option"
                    id={`${prefix}-${item.id}`}
                    aria-selected={isSelected}
                    tabIndex={-1}
                    type="button"
                    onClick={() => {
                      item.run();
                      onRun?.();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl text-left transition-colors",
                      nova ? "px-3.5 py-2.5" : "justify-between px-3 py-2.5",
                      isSelected
                        ? nova
                          ? "bg-primary font-semibold text-primary-foreground"
                          : "bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]"
                        : nova
                          ? "text-foreground hover:bg-muted/60"
                          : "cursor-pointer text-[var(--portfolio-ink)] hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid shrink-0 place-items-center rounded-lg",
                        nova
                          ? cn(
                              "h-8 w-8",
                              isSelected
                                ? "bg-primary-foreground/15 text-primary-foreground"
                                : "bg-muted text-primary",
                            )
                          : cn(
                              "h-7 w-7 border",
                              isSelected
                                ? "border-[var(--portfolio-accent)]/40 bg-[var(--portfolio-accent)]/10 text-[var(--portfolio-accent)]"
                                : "border-[var(--portfolio-rule)] bg-muted/20 text-[var(--portfolio-muted)]",
                            ),
                      )}
                    >
                      <Icon className={nova ? "h-4 w-4" : "h-3.5 w-3.5"} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="break-words text-sm font-medium">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "hidden shrink-0 text-xs sm:inline",
                            nova
                              ? isSelected
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                              : "text-[var(--portfolio-muted)]",
                          )}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle ? (
                        <p
                          className={cn(
                            "text-xs",
                            nova
                              ? isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                              : "text-[var(--portfolio-muted)]",
                          )}
                        >
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
