"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Archive,
  BookOpen,
  Compass,
  Droplets,
  Dumbbell,
  Flag,
  Flame,
  Headphones,
  Keyboard,
  ListTodo,
  Moon,
  PenLine,
  Plus,
  RotateCcw,
  Scale,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Timer,
  Utensils,
  Zap,
} from "lucide-react";
import { TrackerIcon } from "@/components/trackers/icons";
import {
  PERSONAL_PRIMARY_NAV,
  PERSONAL_TOOLS_NAV,
  type PersonalNavItem,
} from "@/lib/personal-nav";
import {
  useFasting,
  useFastingHistory,
  useGoalState,
  useNow,
  useTodos,
} from "@/lib/tracker-store";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { GOAL_CATEGORIES, useUserPrefs } from "@/lib/user-prefs";
import { calendarZone } from "@/lib/day-plan";
import { zonedDate } from "@/lib/routine-reminders";
import type { ArchiveItem } from "@/lib/archive";
import type { CompletedChapterRecord } from "@/lib/study-focus";
import type { CaptureItem, CommandItem } from "./types";

const navIcon = (item: PersonalNavItem) =>
  function NavIcon(props: { className?: string }) {
    return <TrackerIcon name={item.icon} className={props.className} />;
  };

const NAV_TITLES: Partial<Record<PersonalNavItem["id"], string>> = {
  roadmap: "Career roadmap",
};

const NAV_SUBTITLES: Partial<Record<PersonalNavItem["id"], string>> = {
  roadmap: "Daily study, evidence and career progress",
  today: "Daily next move & momentum",
};

const NAV_KEYWORDS: Partial<Record<PersonalNavItem["id"], string[]>> = {
  roadmap: ["roadmap", "career", "curriculum", "study"],
  today: ["hub", "today", "home", "dashboard"],
  plan: ["plan", "focus", "sprint"],
  health: ["health", "records", "recovery"],
  review: ["progress", "dashboard", "trends"],
  motivation: ["motivation", "focus", "goal", "inspiration"],
  archive: ["library", "notes", "links", "quotes", "bookmarks"],
  sharing: ["share", "sharing", "drops", "collaborate"],
  settings: ["settings", "backup", "restore", "sync", "preferences"],
};

/** Extra chapter destinations that are not part of the rail itself. */
const EXTRA_NAV = [
  {
    id: "tasks",
    href: "/todo",
    title: "Tasks",
    subtitle: "Plan, edit and complete your tasks",
    icon: ListTodo,
    keywords: ["tasks", "todo", "to-do"],
  },
  {
    id: "food",
    href: "/food",
    title: "Food",
    subtitle: "Diary, targets and nutrition insights",
    icon: Utensils,
    keywords: ["food", "calories", "protein", "meals", "nutrition"],
  },
  {
    id: "workouts",
    href: "/workout-tracking",
    title: "Workouts",
    subtitle: "Split builder, exercises, weights & sets",
    icon: Dumbbell,
    keywords: ["workout", "training", "gym", "exercises", "sets", "reps"],
  },
  {
    id: "body",
    href: "/weight-loss",
    title: "Body & weight",
    subtitle: "Daily weigh-in, energy, sleep & soreness",
    icon: Scale,
    keywords: ["weight", "weigh-in", "recovery", "sleep", "energy"],
  },
  {
    id: "fasting",
    href: "/intermittent-fasting",
    title: "Fasting & eating window",
    subtitle: "Meal windows & fasting rhythm",
    icon: Timer,
    keywords: ["fast", "fasting", "meals", "eating", "window", "16:8"],
  },
  {
    id: "routine",
    href: "/routine",
    title: "Routine reminders",
    subtitle: "Habits, reminders and their history",
    icon: Timer,
    keywords: ["routine", "reminders", "habits"],
  },
  {
    id: "log",
    href: "/log",
    title: "Add a record",
    subtitle: "One-stop check-in for tasks, weight & notes",
    icon: Plus,
    keywords: ["log", "record", "capture", "checkin"],
  },
  {
    id: "detailed-review",
    href: "/review",
    title: "Detailed review",
    subtitle: "Reflect on the week with your saved records",
    icon: BookOpen,
    keywords: ["review", "reflection", "journal", "weekly"],
  },
] as const;

/**
 * The NOVA command registry: surface-aware navigation from the shared nav
 * source, searchable records from the personal stores, runnable actions and
 * the local captures used by the QuickSheet Add tab.
 */
export default function useNovaCommands(): {
  items: CommandItem[];
  captureItems: CaptureItem[];
} {
  const router = useRouter();
  const { resolvedTheme: theme, setTheme } = useTheme();
  const { value: fasting, setValue: setFasting } = useFasting();
  const { setValue: setHistory } = useFastingHistory();
  const { prefs } = useUserPrefs();
  const { value: todos } = useTodos();
  const { value: goal } = useGoalState();
  const { value: archive } = useSyncedStorage<ArchiveItem[]>(
    "archive:items",
    [],
  );
  const { value: chapters } = useSyncedStorage<CompletedChapterRecord[]>(
    "study:completed_chapters",
    [],
  );
  const { setValue: setWater } = useSyncedStorage<Record<string, number>>(
    "fasting:water",
    {},
  );
  const now = useNow(60_000);

  const todayKey = zonedDate(now, calendarZone(prefs.timeZone));

  const addWater = useCallback(() => {
    setWater((prev) => {
      const current = prev ?? {};
      return { ...current, [todayKey]: (current[todayKey] ?? 0) + 1 };
    });
  }, [setWater, todayKey]);

  const isFasting =
    fasting?.phase === "fasting" && typeof fasting.startedAt === "number";

  const captureItems = useMemo<CaptureItem[]>(
    () => [
      {
        id: "water",
        label: "Water +1",
        icon: Droplets,
        run: addWater,
        confirm: "Water logged",
      },
      {
        id: "food",
        label: "Log food",
        icon: Utensils,
        run: () => router.push("/log?type=food"),
      },
      {
        id: "weight",
        label: "Record weight",
        icon: Scale,
        run: () => router.push(`/log?type=weight&date=${todayKey}`),
      },
      {
        id: "task",
        label: "Add task",
        icon: ListTodo,
        run: () => router.push("/log?type=task"),
      },
      {
        id: "note",
        label: "Write a note",
        icon: PenLine,
        run: () => router.push("/log?type=note"),
      },
      {
        id: "journal",
        label: "Write reflection",
        icon: BookOpen,
        run: () => router.push("/log?view=journal"),
      },
      {
        id: "focus",
        label: "Start focus",
        icon: Zap,
        run: () => router.push("/plan?view=focus"),
      },
    ],
    [addWater, router, todayKey],
  );

  const items = useMemo<CommandItem[]>(() => {
    const navigation: CommandItem[] = [
      ...PERSONAL_PRIMARY_NAV,
      ...PERSONAL_TOOLS_NAV,
    ].map((entry) => ({
      id: `nav-${entry.id}`,
      category: "Navigation",
      title: NAV_TITLES[entry.id] ?? entry.label,
      subtitle: NAV_SUBTITLES[entry.id] ?? entry.description ?? "Open your personal tracker",
      icon: navIcon(entry),
      keywords: NAV_KEYWORDS[entry.id] ?? [
        entry.label.toLowerCase(),
        entry.href.slice(1),
      ],
      run: () => router.push(entry.href),
    }));

    const extras: CommandItem[] = EXTRA_NAV.map((entry) => ({
      id: `nav-${entry.id}`,
      category: "Navigation",
      title: entry.title,
      subtitle: entry.subtitle,
      icon: entry.icon,
      keywords: [...entry.keywords],
      run: () => router.push(entry.href),
    }));

    const openTasks = [...(todos ?? [])]
      .filter((task) => !task.done)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 20);
    const milestones = Object.entries(goal.milestonesByCategory).flatMap(
      ([category, list]) =>
        (list ?? []).map((milestone) => ({ category, milestone })),
    );
    const records: CommandItem[] = [
      ...openTasks.map((task) => ({
        id: `record-task-${task.id}`,
        category: "Records" as const,
        title: task.text,
        subtitle: `Task · ${task.date}`,
        icon: ListTodo,
        keywords: ["task", task.date, task.tag.toLowerCase()],
        run: () => router.push("/todo"),
      })),
      ...milestones.slice(0, 20).map(({ category, milestone }) => ({
        id: `record-milestone-${milestone.id}`,
        category: "Records" as const,
        title: milestone.title,
        subtitle: `${GOAL_CATEGORIES.find((entry) => entry.id === category)?.label ?? category} · Milestone${milestone.done ? " · done" : ""}`,
        icon: Flag,
        keywords: ["milestone", category, milestone.title.toLowerCase()],
        run: () => router.push("/goal"),
      })),
      ...[...(chapters ?? [])]
        .reverse()
        .slice(0, 20)
        .map((chapter) => ({
          id: `record-chapter-${chapter.chapterId}`,
          category: "Records" as const,
          title: chapter.chapterTitle,
          subtitle: `Day ${chapter.day} · ${chapter.stack}`,
          icon: BookOpen,
          keywords: [
            "study",
            "chapter",
            chapter.stack.toLowerCase(),
            chapter.chapterTitle.toLowerCase(),
          ],
          run: () => router.push("/roadmap?view=curriculum"),
        })),
      ...(archive ?? []).slice(0, 20).map((entry) => ({
        id: `record-library-${entry.id}`,
        category: "Records" as const,
        title: entry.body.replace(/\s+/g, " ").trim().slice(0, 80) || "Saved item",
        subtitle: `Library · ${entry.kind}`,
        icon: Archive,
        keywords: ["library", entry.kind, ...entry.tags],
        run: () => router.push("/archive"),
      })),
    ];

    const actions: CommandItem[] = [
      {
        id: "action-capture-water",
        category: "Actions",
        title: "Log a glass of water",
        subtitle: "Records today's water immediately",
        icon: Droplets,
        keywords: ["water", "hydration", "glass", "drink"],
        run: addWater,
      },
      {
        id: "action-capture-food",
        category: "Actions",
        title: "Log food",
        subtitle: "Open the food capture",
        icon: Utensils,
        keywords: ["food", "eat", "meal", "calories"],
        run: () => router.push("/log?type=food"),
      },
      {
        id: "action-log-weight",
        category: "Actions",
        title: "Record Today's Weigh-in",
        subtitle: "Log weight & recovery signals",
        icon: Scale,
        keywords: ["weight", "log weight", "scale", "recovery"],
        run: () => router.push(`/log?type=weight&date=${todayKey}`),
      },
      {
        id: "action-start-task",
        category: "Actions",
        title: "Add a task",
        subtitle: "Capture a task for today or later",
        icon: ListTodo,
        keywords: ["task", "todo", "add task"],
        run: () => router.push("/log?type=task"),
      },
      {
        id: "action-write-note",
        category: "Actions",
        title: "Write a note",
        subtitle: "Save a private note to your Library",
        icon: PenLine,
        keywords: ["note", "write", "capture"],
        run: () => router.push("/log?type=note"),
      },
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
        title: "Start focus session",
        subtitle: "Choose a session and start when ready",
        icon: Zap,
        keywords: ["focus", "sprint", "pomodoro", "timer", "deep work"],
        run: () => router.push("/plan?view=focus"),
      },
      {
        id: "action-shortcuts",
        category: "Actions",
        title: "Keyboard shortcuts",
        subtitle: "See every workspace shortcut",
        icon: Keyboard,
        keywords: ["shortcuts", "keyboard", "keys", "help"],
        run: () => {
          window.dispatchEvent(new CustomEvent("nova-open-shortcuts"));
        },
      },
    ];

    const preferences: CommandItem[] = [
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
    ];

    return [...navigation, ...extras, ...records, ...actions, ...preferences];
  }, [
    addWater,
    chapters,
    archive,
    fasting,
    goal,
    isFasting,
    router,
    setFasting,
    setHistory,
    setTheme,
    theme,
    todayKey,
    todos,
  ]);

  return { items, captureItems };
}
