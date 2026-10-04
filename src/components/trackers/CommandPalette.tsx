"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";
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
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFasting, useFastingHistory } from "@/lib/tracker-store";

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
  const { resolvedTheme: theme, setTheme } = useTheme();
  const { value: fasting, setValue: setFasting } = useFasting();
  const { setValue: setHistory } = useFastingHistory();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFasting =
    fasting?.phase === "fasting" && typeof fasting.startedAt === "number";

  const items = useMemo<CommandItem[]>(
    () => [
      // Navigation
      ...[
        { title: "Plan", href: "/plan" },
        { title: "Health", href: "/health" },
        { title: "Progress dashboard", href: "/dashboard" },
        { title: "Detailed review", href: "/review" },
        { title: "Food", href: "/food" },
        { title: "Reminders", href: "/routine" },
      ].map((item) => ({
        id: `nav-${item.title.toLowerCase()}`,
        category: "Navigation" as const,
        title: item.title,
        subtitle: "Open your personal tracker",
        icon: Compass,
        keywords: [item.title.toLowerCase()],
        run: () => router.push(item.href),
      })),
      {
        id: "nav-tasks",
        category: "Navigation",
        title: "Tasks",
        subtitle: "Plan, edit and complete your tasks",
        icon: Plus,
        keywords: ["tasks", "todo", "to-do"],
        run: () => router.push("/todo"),
      },
      {
        id: "nav-roadmap",
        category: "Navigation",
        title: "Career roadmap",
        subtitle: "Daily study, evidence and career progress",
        icon: Compass,
        keywords: ["roadmap", "career", "curriculum", "study"],
        run: () => router.push("/roadmap"),
      },
      {
        id: "nav-today",
        category: "Navigation",
        title: "Today",
        subtitle: "Daily next move & momentum",
        icon: Compass,
        keywords: ["hub", "today", "home", "dashboard"],
        run: () => router.push("/hub"),
      },
      {
        id: "nav-focus",
        category: "Navigation",
        title: "Motivation",
        subtitle: "Encouragement for your goal and your next step",
        icon: Flame,
        keywords: ["focus", "motivation", "goal", "inspiration", "reminder"],
        run: () => router.push("/motivation"),
      },
      {
        id: "nav-log",
        category: "Navigation",
        title: "Log",
        subtitle: "One-stop check-in for tasks, weight & notes",
        icon: Plus,
        keywords: ["log", "record", "capture", "checkin"],
        run: () => router.push("/log"),
      },
      {
        id: "nav-workouts",
        category: "Navigation",
        title: "Workouts",
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
        keywords: [
          "weight",
          "health",
          "recovery",
          "weigh-in",
          "sleep",
          "energy",
        ],
        run: () => router.push("/weight-loss"),
      },
      {
        id: "nav-archive",
        category: "Navigation",
        title: "Library",
        subtitle: "Notes, links, quotes and references",
        icon: Archive,
        keywords: [
          "library",
          "archive",
          "notes",
          "links",
          "quotes",
          "bookmarks",
        ],
        run: () => router.push("/archive"),
      },
      {
        id: "nav-share",
        category: "Navigation",
        title: "Sharing",
        subtitle: "Timed drops with explicit access controls",
        icon: Share2,
        keywords: ["share", "sharing", "drops", "collaborate"],
        run: () => router.push("/share"),
      },
      {
        id: "nav-settings",
        category: "Navigation",
        title: "Settings",
        subtitle: "Preferences, backups & sync",
        icon: Settings,
        keywords: ["settings", "backup", "restore", "sync", "preferences"],
        run: () => router.push("/settings"),
      },
      // Actions
      {
        id: "action-deep-study",
        category: "Actions",
        title: "Launch Deep Study Cockpit (Anti-Distraction Shield)",
        subtitle:
          "Focus reader with tab-switch guard, attention checks & study.buildora.work curriculum",
        icon: ShieldCheck,
        keywords: [
          "study",
          "focus",
          "distraction",
          "cockpit",
          "deep study",
          "lockdown",
          "attention",
          "bible",
        ],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-open-study-cockpit"));
        },
      },
      {
        id: "action-germany-shield",
        category: "Actions",
        title: "Germany Goal Guardian & Distraction Shield",
        subtitle:
          "Allowlist (buildora, notion, github), social media blocklist & 1h lockdown",
        icon: ShieldAlert,
        keywords: [
          "distraction",
          "blocklist",
          "allowlist",
          "germany",
          "shield",
          "social media",
          "lockdown",
          "guardian",
          "dreams",
        ],
        run: () => {
          window.dispatchEvent(
            new CustomEvent("portfolio-trigger-distraction-shield", {
              detail: { url: "https://instagram.com" },
            }),
          );
        },
      },
      {
        id: "action-revision-gate",
        category: "Actions",
        title:
          "Active Recall Spaced Repetition Gate (Full-Screen Invariants Drill)",
        subtitle:
          "Full-screen opaque recall screen with curriculum interview questions & Ebbinghaus intervals",
        icon: RotateCcw,
        keywords: [
          "revision",
          "recall",
          "spaced repetition",
          "ebbinghaus",
          "gate",
          "drill",
          "invariants",
          "refresh",
          "opaque",
        ],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-open-revision-deck"));
        },
      },
      {
        id: "action-break-lounge",
        category: "Actions",
        title: "Mindful Break Lounge (YouTube Music & Top 10 Tech Podcasts)",
        subtitle:
          "5–15m audio-only break: deep focus soundscapes, lo-fi beats, or world-class tech podcasts",
        icon: Headphones,
        keywords: [
          "break",
          "music",
          "youtube music",
          "podcast",
          "audio",
          "rest",
          "lofi",
          "relax",
          "listen",
        ],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-open-break-lounge"));
        },
      },
      {
        id: "action-toggle-fast",
        category: "Actions",
        title: isFasting ? "End Current Fast" : "Start New Fast",
        subtitle: isFasting
          ? "Close active fasting window"
          : "Begin fasting countdown",
        icon: Timer,
        keywords: ["fast", "start fast", "stop fast", "end fast", "meal"],
        run: () => {
          if (isFasting && fasting && typeof fasting.startedAt === "number") {
            const endedAt = Date.now();
            const entry = {
              id: `fast_${endedAt.toString(36)}`,
              start: fasting.startedAt,
              end: endedAt,
              protocolId: fasting.protocolId,
              source: "timer" as const,
            };
            setHistory((previous) => [...(previous ?? []), entry]);
            setFasting({ ...fasting, startedAt: null });
          } else {
            setFasting({
              protocolId: fasting?.protocolId ?? "16-8",
              phase: "fasting",
              startedAt: Date.now(),
            });
          }
          router.push("/intermittent-fasting");
        },
      },
      {
        id: "action-start-focus",
        category: "Actions",
        title: "Open focus sprint",
        subtitle: "Choose a session and start when ready",
        icon: Zap,
        keywords: ["focus", "sprint", "pomodoro", "timer", "deep work"],
        run: () => router.push("/plan#focus-sprint"),
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
        title:
          theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        subtitle: "Toggle visual color theme",
        icon: theme === "dark" ? Sun : Moon,
        keywords: ["theme", "dark", "light", "color", "mode"],
        run: () => setTheme(theme === "dark" ? "light" : "dark"),
      },
    ],
    [fasting, isFasting, router, setFasting, setHistory, setTheme, theme],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.includes(q)),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target !== inputRef.current || e.isComposing || e.defaultPrevented)
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length ? (prev + 1) % filtered.length : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0,
        );
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

  useEffect(() => {
    if (open && filtered[selectedIndex])
      document
        .getElementById(`tracker-command-${filtered[selectedIndex].id}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, filtered, selectedIndex]);
  const dialogRef = useDialogFocus(open, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
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
      <div className="relative flex max-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col overflow-hidden sm:max-h-[calc(100dvh-7rem)] rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/15 outline-none animate-slide-up">
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
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="tracker-command-results"
            aria-activedescendant={
              filtered[selectedIndex]
                ? `tracker-command-${filtered[selectedIndex].id}`
                : undefined
            }
            aria-label="Search commands"
            placeholder="Search pages or actions…"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          id="tracker-command-results"
          role="listbox"
          aria-label="Commands"
          className="min-h-0 flex-1 overflow-y-auto p-2"
        >
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            <ul role="presentation" className="space-y-1">
              {filtered.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon = item.icon;
                return (
                  <li key={item.id} role="presentation">
                    <button
                      role="option"
                      id={`tracker-command-${item.id}`}
                      aria-selected={isSelected}
                      tabIndex={-1}
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
                          <span className="break-words text-sm font-medium">
                            {item.title}
                          </span>
                          <span
                            className={cn(
                              "hidden shrink-0 text-xs sm:inline",
                              isSelected
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {item.category}
                          </span>
                        </div>
                        {item.subtitle ? (
                          <p
                            className={cn(
                              "text-xs",
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground",
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
      </div>
    </div>,
    document.body,
  );
}
