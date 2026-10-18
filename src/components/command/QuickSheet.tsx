"use client";

import { useRef, useState } from "react";
import Modal from "@/components/trackers/Modal";
import { cn } from "@/lib/utils";
import CommandSearch from "./CommandSearch";
import type { CaptureItem, CommandItem } from "./types";

const TABS = [
  { id: "add", label: "Add" },
  { id: "search", label: "Search" },
] as const;

export type QuickSheetTab = (typeof TABS)[number]["id"];

/**
 * The sheet body unmounts with the Modal, so capture confirmations start
 * clean on every open without an effect-driven reset.
 */
function QuickSheetBody({
  onClose,
  tab,
  onTabChange,
  items,
  captureItems,
}: {
  onClose: () => void;
  tab: QuickSheetTab;
  onTabChange: (tab: QuickSheetTab) => void;
  items: CommandItem[];
  captureItems: CaptureItem[];
}) {
  const [status, setStatus] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (direction: 1 | -1) => {
    const index = TABS.findIndex((entry) => entry.id === tab);
    const next = TABS[(index + direction + TABS.length) % TABS.length].id;
    onTabChange(next);
    tabRefs.current[TABS.findIndex((entry) => entry.id === next)]?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Quick add and search"
        className="mb-3 flex gap-1 rounded-xl border border-border/60 bg-muted/40 p-1"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        {TABS.map((entry, index) => (
          <button
            key={entry.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            role="tab"
            type="button"
            id={`quicksheet-tab-${entry.id}`}
            aria-controls={`quicksheet-panel-${entry.id}`}
            aria-selected={tab === entry.id}
            tabIndex={tab === entry.id ? 0 : -1}
            onClick={() => onTabChange(entry.id)}
            className={cn(
              "min-h-11 flex-1 rounded-lg text-sm transition-colors",
              tab === entry.id
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="quicksheet-panel-add"
        aria-labelledby="quicksheet-tab-add"
        hidden={tab !== "add"}
      >
        {status ? (
          <p
            role="status"
            className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
          >
            {status}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          {captureItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.run();
                  if (item.confirm) setStatus(item.confirm);
                  else onClose();
                }}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/40"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 break-words">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id="quicksheet-panel-search"
        aria-labelledby="quicksheet-tab-search"
        hidden={tab !== "search"}
      >
        <CommandSearch
          items={items}
          prefix="quicksheet-command"
          variant="nova"
          embedded
          autoFocus={tab === "search"}
          onRun={onClose}
        />
      </div>
    </>
  );
}

/**
 * The mobile command surface for the NOVA workspace: one sheet with an Add
 * tab for immediate captures and a Search tab that reuses the shared command
 * registry. Opened by the floating + above the dock, the header search
 * affordance and the compact Tools menu. Desktop keeps the classic palette.
 */
export default function QuickSheet({
  open,
  onClose,
  tab,
  onTabChange,
  items,
  captureItems,
}: {
  open: boolean;
  onClose: () => void;
  tab: QuickSheetTab;
  onTabChange: (tab: QuickSheetTab) => void;
  items: CommandItem[];
  captureItems: CaptureItem[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Quick add and search">
      {open ? (
        <QuickSheetBody
          onClose={onClose}
          tab={tab}
          onTabChange={onTabChange}
          items={items}
          captureItems={captureItems}
        />
      ) : null}
    </Modal>
  );
}
