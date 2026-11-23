"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Activity,
  Archive,
  BookOpen,
  Briefcase,
  Flag,
  Keyboard,
  ListTodo,
  Moon,
  PenLine,
  Plus,
  Sun,
  Target,
  Zap,
} from "lucide-react";
import { TrackerIcon } from "@/components/trackers/icons";
import {
  PERSONAL_PRIMARY_NAV,
  PERSONAL_TOOLS_NAV,
  type PersonalNavItem,
} from "@/lib/personal-nav";
import { useGoalState, useTodos } from "@/lib/tracker-store";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { GOAL_CATEGORIES } from "@/lib/user-prefs";
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
  roadmap: "Nov 23 hiring sprint, study.buildora.work links & pipeline",
  today: "Daily cockpit, schedule & Google Health snapshot",
  health: "Auto-synced Google Health Connect dashboard",
  review: "Hiring funnel, study mastery bars, heatmap & health trends",
};

const NAV_KEYWORDS: Partial<Record<PersonalNavItem["id"], string[]>> = {
  roadmap: ["roadmap", "career", "curriculum", "study", "jobs", "interview"],
  today: ["hub", "today", "home", "cockpit"],
  plan: ["plan", "focus", "sprint", "timetable"],
  health: ["health", "google health", "steps", "sleep", "weight", "connect"],
  review: ["progress", "dashboard", "analytics", "graphs", "trends", "funnel"],
  motivation: ["motivation", "focus", "goal", "inspiration"],
  archive: ["library", "notes", "links", "quotes", "bookmarks"],
  sharing: ["share", "sharing", "drops", "collaborate"],
  settings: ["settings", "backup", "restore", "sync", "preferences"],
};

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
    id: "goals",
    href: "/goal",
    title: "Goals & milestones",
    subtitle: "Track career milestones and daily target metrics",
    icon: Target,
    keywords: ["goal", "goals", "milestones", "target"],
  },
  {
    id: "health-connections",
    href: "/health?view=connections",
    title: "Google Health Connect setup",
    subtitle: "Pair Android companion or import Health Connect JSON",
    icon: Activity,
    keywords: ["google health", "health connect", "android", "pair", "sync"],
  },
  {
    id: "study-bible",
    href: "/roadmap?view=study",
    title: "Study Bible mastery",
    subtitle: "600 verified study.buildora.work chapters by stack",
    icon: BookOpen,
    keywords: ["study", "bible", "chapters", "javascript", "postgres", "system design"],
  },
  {
    id: "log",
    href: "/log",
    title: "Quick capture",
    subtitle: "Add a task, career note, or daily reflection",
    icon: Plus,
    keywords: ["log", "capture", "note", "task", "reflection"],
  },
  {
    id: "detailed-review",
    href: "/review",
    title: "Weekly review",
    subtitle: "Funnel scoreboard, lessons & Monday priorities",
    icon: BookOpen,
    keywords: ["review", "reflection", "journal", "weekly"],
  },
] as const;

export default function useNovaCommands(): {
  items: CommandItem[];
  captureItems: CaptureItem[];
} {
  const router = useRouter();
  const { resolvedTheme: theme, setTheme } = useTheme();
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

  const captureItems = useMemo<CaptureItem[]>(
    () => [
      {
        id: "task",
        label: "Add task",
        icon: ListTodo,
        run: () => router.push("/log?type=task"),
      },
      {
        id: "opportunity",
        label: "Add opportunity",
        icon: Briefcase,
        run: () => router.push("/roadmap?view=opportunities&add=1"),
      },
      {
        id: "drill",
        label: "Log drill",
        icon: Target,
        run: () => router.push("/roadmap?view=practice"),
      },
      {
        id: "focus",
        label: "Start focus",
        icon: Zap,
        run: () => router.push("/plan?view=focus"),
      },
      {
        id: "note",
        label: "Write note",
        icon: PenLine,
        run: () => router.push("/log?type=note"),
      },
      {
        id: "journal",
        label: "Daily reflection",
        icon: BookOpen,
        run: () => router.push("/log?view=journal"),
      },
    ],
    [router],
  );

  const items = useMemo<CommandItem[]>(() => {
    const navigation: CommandItem[] = [
      ...PERSONAL_PRIMARY_NAV,
      ...PERSONAL_TOOLS_NAV,
    ].map((entry) => ({
      id: `nav-${entry.id}`,
      category: "Navigation",
      title: NAV_TITLES[entry.id] ?? entry.label,
      subtitle:
        NAV_SUBTITLES[entry.id] ?? entry.description ?? "Open workspace view",
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
          subtitle: `Mastered · ${chapter.stack}`,
          icon: BookOpen,
          keywords: [
            "study",
            "chapter",
            chapter.stack.toLowerCase(),
            chapter.chapterTitle.toLowerCase(),
          ],
          run: () => router.push("/roadmap?view=study"),
        })),
      ...(archive ?? []).slice(0, 20).map((entry) => ({
        id: `record-library-${entry.id}`,
        category: "Records" as const,
        title:
          entry.body.replace(/\s+/g, " ").trim().slice(0, 80) || "Saved item",
        subtitle: `Library · ${entry.kind}`,
        icon: Archive,
        keywords: ["library", entry.kind, ...entry.tags],
        run: () => router.push("/archive"),
      })),
    ];

    const actions: CommandItem[] = [
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
        id: "action-add-opportunity",
        category: "Actions",
        title: "Add a job or contract opportunity",
        subtitle: "Log a new role in your hiring pipeline",
        icon: Briefcase,
        keywords: ["job", "role", "opportunity", "apply", "contract"],
        run: () => router.push("/roadmap?view=opportunities&add=1"),
      },
      {
        id: "action-log-drill",
        category: "Actions",
        title: "Log an interview drill",
        subtitle: "Record original attempt, gap & changed case",
        icon: Target,
        keywords: ["drill", "practice", "interview", "mock"],
        run: () => router.push("/roadmap?view=practice"),
      },
      {
        id: "action-write-note",
        category: "Actions",
        title: "Write a career or study note",
        subtitle: "Save a quick note to your journal",
        icon: PenLine,
        keywords: ["note", "write", "capture"],
        run: () => router.push("/log?type=note"),
      },
      {
        id: "action-start-focus",
        category: "Actions",
        title: "Start focus session",
        subtitle: "Launch a timed deep-work sprint",
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
  }, [archive, chapters, goal, router, setTheme, theme, todos]);

  return { items, captureItems };
}
