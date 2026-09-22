"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Archive,
  Compass,
  Dumbbell,
  Flag,
  Flame,
  Moon,
  Plus,
  Scale,
  Search,
  Settings,
  Share2,
  Sun,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFasting } from "@/lib/tracker-store";

export type CommandItem = {
  id: string;
  category: "Navigation" | "Actions" | "Preferences";
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  run: () => void;
};

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { value: fasting, setValue: setFasting } = useFasting();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFasting = fasting?.startedAt !== null;

  const items = useMemo<CommandItem[]>(() => [
    // Navigation
    {
      id: "nav-today",
      category: "Navigation",
      title: "Today Cockpit",
      subtitle: "Daily next move & momentum",
      icon: Compass,
      keywords: ["hub", "today", "home", "dashboard"],
      run: () => router.push("/hub"),
    },
    {
      id: "nav-focus",
      category: "Navigation",
      title: "Focus & Motivation",
      subtitle: "Focus sprints & affirmations",
      icon: Flame,
      keywords: ["focus", "sprint", "motivation", "timer", "scene"],
      run: () => router.push("/motivation"),
    },
    {
      id: "nav-log",
      category: "Navigation",
      title: "Rapid Capture / Log",
      subtitle: "One-stop check-in for tasks, weight & notes",
      icon: Plus,
      keywords: ["log", "record", "capture", "checkin"],
      run: () => router.push("/log"),
    },
    {
      id: "nav-workouts",
      category: "Navigation",
      title: "Physical Workouts",
      subtitle: "Split builder, exercises, weights & sets",
      icon: Dumbbell,
      keywords: ["workout", "training", "gym", "exercises", "sets", "reps"],
      run: () => router.push("/workout-tracking"),
    },
    {
      id: "nav-fasting",
      category: "Navigation",
      title: "Intermittent Fasting",
      subtitle: "Meal windows & fasting rhythm",
      icon: Timer,
      keywords: ["fast", "fasting", "meals", "eating", "window", "16:8"],
      run: () => router.push("/intermittent-fasting"),
    },
    {
      id: "nav-goals",
      category: "Navigation",
      title: "Goals & Milestones",
      subtitle: "Trajectory, commitments & ETAs",
      icon: Flag,
      keywords: ["goals", "target", "milestones", "commitment"],
      run: () => router.push("/goal"),
    },
    {
      id: "nav-health",
      category: "Navigation",
      title: "Body & Recovery",
      subtitle: "Daily weigh-in, energy, sleep & soreness",
      icon: Scale,
      keywords: ["weight", "health", "recovery", "weigh-in", "sleep", "energy"],
      run: () => router.push("/weight-loss"),
    },
    {
      id: "nav-archive",
      category: "Navigation",
      title: "Second Brain Archive",
      subtitle: "Encrypted notes, links, quotes & references",
      icon: Archive,
      keywords: ["archive", "notes", "links", "quotes", "bookmarks"],
      run: () => router.push("/archive"),
    },
    {
      id: "nav-share",
      category: "Navigation",
      title: "Ephemeral Sharing",
      subtitle: "Encrypted drops & shared momentum",
      icon: Share2,
      keywords: ["share", "sharing", "drops", "collaborate"],
      run: () => router.push("/share"),
    },
    {
      id: "nav-settings",
      category: "Navigation",
      title: "System Settings",
      subtitle: "Preferences, backups & sync",
      icon: Settings,
      keywords: ["settings", "backup", "restore", "sync", "preferences"],
      run: () => router.push("/settings"),
    },
    // Actions
    {
      id: "action-toggle-fast",
      category: "Actions",
      title: isFasting ? "End Current Fast" : "Start New Fast",
      subtitle: isFasting ? "Close active fasting window" : "Begin fasting countdown",
      icon: Timer,
      keywords: ["fast", "start fast", "stop fast", "end fast", "meal"],
      run: () => {
        setFasting(
          isFasting
            ? { ...fasting, startedAt: null }
            : { protocolId: fasting?.protocolId ?? "16-8", phase: "fasting", startedAt: Date.now() },
        );
        router.push("/intermittent-fasting");
      },
    },
    {
      id: "action-start-focus",
      category: "Actions",
      title: "Launch Focus Sprint",
      subtitle: "Start a 25-minute distraction-free block",
      icon: Zap,
      keywords: ["focus", "sprint", "pomodoro", "timer", "deep work"],
      run: () => router.push("/motivation"),
    },
    {
      id: "action-log-weight",
      category: "Actions",
      title: "Record Today's Weigh-in",
      subtitle: "Log weight & recovery signals",
      icon: Scale,
      keywords: ["weight", "log weight", "scale", "recovery"],
      run: () => router.push("/weight-loss"),
    },
    // Preferences
    {
      id: "pref-theme",
      category: "Preferences",
      title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      subtitle: "Toggle visual color theme",
      icon: theme === "dark" ? Sun : Moon,
      keywords: ["theme", "dark", "light", "color", "mode"],
      run: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
  ], [fasting, isFasting, router, setFasting, setTheme, theme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => (
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords?.some((kw) => kw.includes(q))
    ));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filtered[selectedIndex];
        if (selected) {
          selected.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, filtered, selectedIndex]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 sm:pt-24"
    >
      <div
        aria-hidden
        className="fixed inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/15 outline-none animate-slide-up"
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, destinations, or actions… (↑↓ to navigate)"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        item.run();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground hover:bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm",
                          isSelected
                            ? "bg-primary-foreground/15 text-primary-foreground"
                            : "bg-muted text-primary",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{item.title}</span>
                          <span
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-[0.14em]",
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {item.category}
                          </span>
                        </div>
                        {item.subtitle ? (
                          <p
                            className={cn(
                              "truncate text-xs",
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
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

        <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
            <span>Select:</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
            <span>to dismiss</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
