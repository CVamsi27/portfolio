"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen,
  Briefcase,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Gamepad2,
  GitBranch,
  Headphones,
  Keyboard,
  Layers,
  Mail,
  Moon,
  Quote,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  User,
  Workflow,
} from "lucide-react";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  PROJECTS,
  RESUME_PATH,
} from "@/lib/const";
import { caseStudyHref, projectSlug } from "@/lib/case-studies";
import { toast } from "@/components/ui/use-toast";
import type { CommandItem } from "./types";

/**
 * The public portfolio's command registry: section navigation, downloads and
 * contact actions, project search and tech filters. Mounted through the same
 * CommandPalette component the workspace uses.
 */
export default function usePortfolioCommands(): CommandItem[] {
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();

  return useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: "nav-top",
        category: "Navigation",
        title: "Top / Overview",
        subtitle: "Jump to portfolio introduction & hero",
        icon: User,
        keywords: ["home", "intro", "about", "bio", "hero"],
        run: () => {
          document
            .getElementById("Top")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-work",
        category: "Navigation",
        title: "Selected Work & Systems",
        subtitle: "Jump to flagship project & engineering catalog",
        icon: Briefcase,
        keywords: ["work", "projects", "systems", "docita", "portfolio"],
        run: () => {
          document
            .getElementById("Work")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-architecture",
        category: "Navigation",
        title: "Architecture & GoF Patterns",
        subtitle:
          "Jump to Gang of Four design patterns & distributed invariants",
        icon: Workflow,
        keywords: [
          "architecture",
          "gof",
          "patterns",
          "outbox",
          "rls",
          "design",
          "system",
        ],
        run: () => {
          document
            .getElementById("Architecture")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-opensource",
        category: "Navigation",
        title: "Open Source & Research",
        subtitle: "Jump to public tools, Bible repo & contribution tracks",
        icon: GitBranch,
        keywords: [
          "open source",
          "oss",
          "github",
          "bible",
          "teamops",
          "public",
        ],
        run: () => {
          document
            .getElementById("OpenSource")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-experience",
        category: "Navigation",
        title: "Career Record",
        subtitle: "Jump to roles at Docita, MAQ Software & Cognizant",
        icon: FileText,
        keywords: [
          "experience",
          "jobs",
          "career",
          "history",
          "roles",
          "companies",
        ],
        run: () => {
          document
            .getElementById("Experience")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-capabilities",
        category: "Navigation",
        title: "Capabilities & Tech Shelf",
        subtitle: "Jump to engineering pillars & production stack",
        icon: Layers,
        keywords: [
          "skills",
          "stack",
          "tech",
          "tools",
          "capabilities",
          "languages",
        ],
        run: () => {
          document
            .getElementById("Capabilities")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-impact",
        category: "Navigation",
        title: "Verified Production Impact",
        subtitle: "Jump to clinical & enterprise endorsements and outcomes",
        icon: Quote,
        keywords: [
          "impact",
          "testimonials",
          "endorsements",
          "reviews",
          "recommendations",
        ],
        run: () => {
          document
            .getElementById("Impact")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-contact",
        category: "Navigation",
        title: "Start a Conversation",
        subtitle: "Jump to contact form & coordinates",
        icon: Mail,
        keywords: ["contact", "email", "message", "hire", "reach out", "chat"],
        run: () => {
          document
            .getElementById("Contact")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      },

      // Quick Actions
      {
        id: "act-resume",
        category: "Actions",
        title: "Download Resume (PDF)",
        subtitle: "Download official curriculum vitae",
        icon: Download,
        keywords: ["resume", "cv", "pdf", "download"],
        run: () => {
          const a = document.createElement("a");
          a.href = RESUME_PATH;
          a.download = "VamsiKrishna_Resume.pdf";
          a.click();
          toast({
            title: "Downloading Resume",
            description: "VamsiKrishna_Resume.pdf is downloading.",
          });
        },
      },
      {
        id: "act-vcard",
        category: "Actions",
        title: "Save vCard Contact (.vcf)",
        subtitle: "Add Vamsi to your phone or desktop address book",
        icon: Download,
        keywords: ["vcard", "contact", "vcf", "phone", "address book"],
        run: () => {
          const vcard = [
            "BEGIN:VCARD",
            "VERSION:3.0",
            "FN:Vamsi Krishna Chandaluri",
            "N:Chandaluri;Vamsi Krishna;;;",
            "TITLE:Senior Full Stack & Systems Engineer",
            `EMAIL;TYPE=INTERNET,PREF:${CONTACT_EMAIL}`,
            `TEL;TYPE=CELL:${CONTACT_PHONE.replace(/\s+/g, "")}`,
            "URL:https://buildora.work",
            "NOTE:Senior Full Stack & Systems Engineer specializing in TypeScript, React, NestJS, and PostgreSQL.",
            "END:VCARD",
          ].join("\r\n");

          const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "Vamsi_Krishna_Chandaluri.vcf");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast({
            title: "vCard downloaded",
            description: "Saved as Vamsi_Krishna_Chandaluri.vcf",
          });
        },
      },
      {
        id: "act-copy-email",
        category: "Actions",
        title: `Copy Email (${CONTACT_EMAIL})`,
        subtitle: "Copy primary contact address to clipboard",
        icon: Copy,
        keywords: ["email", "copy", "inbox"],
        run: async () => {
          await navigator.clipboard.writeText(CONTACT_EMAIL);
          toast({
            title: "Email copied",
            description: `${CONTACT_EMAIL} is ready to paste.`,
          });
        },
      },
      {
        id: "act-theme",
        category: "Actions",
        title: `Toggle Theme (Currently ${resolvedTheme === "dark" ? "Dark" : "Light"})`,
        subtitle: "Switch between dark and light editorial surfaces",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        keywords: ["theme", "dark", "light", "mode", "color"],
        run: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
        },
      },
      {
        id: "act-github",
        category: "Actions",
        title: "Visit GitHub Profile (@CVamsi27)",
        subtitle: "Explore open-source repositories and contributions",
        icon: ExternalLink,
        keywords: ["github", "code", "repo", "git"],
        run: () => {
          window.open("https://github.com/CVamsi27", "_blank");
        },
      },
      {
        id: "act-terminal",
        category: "Actions",
        title: "Open Developer CLI Terminal (~)",
        subtitle: "Launch interactive unix shell emulator",
        icon: Terminal,
        keywords: ["terminal", "cli", "shell", "bash", "console"],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-open-terminal"));
        },
      },
      {
        id: "act-game",
        category: "Actions",
        title: "Play Super Tic Tac Toe (Minimax Game)",
        subtitle: "Launch interactive game against unbeatable Minimax AI",
        icon: Gamepad2,
        keywords: ["game", "tictactoe", "play", "minimax"],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-play-game"));
        },
      },
      {
        id: "act-deep-study",
        category: "Actions",
        title: "Start Deep Study Sprint (Anti-Distraction Shield)",
        subtitle:
          "Lockdown focus reader with tab-switch guard, attention checks & progress tracking",
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
        id: "act-germany-shield",
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
        id: "act-revision-gate",
        category: "Actions",
        title:
          "Active Recall Spaced Repetition Gate (Full-Screen Invariant Drill)",
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
        id: "act-break-lounge",
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
        id: "act-shortcuts",
        category: "Actions",
        title: "Keyboard Shortcuts",
        subtitle: "See every portfolio shortcut",
        icon: Keyboard,
        keywords: ["shortcuts", "keyboard", "keys", "help"],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-open-shortcuts"));
        },
      },
      {
        id: "act-bible",
        category: "Actions",
        title: "Open Senior Full Stack Bible (study.buildora.work)",
        subtitle:
          "868 reference files & 560 study chapters across 7 technical stacks",
        icon: BookOpen,
        keywords: [
          "bible",
          "study",
          "notes",
          "interview",
          "faang",
          "abroad",
          "cheatsheet",
        ],
        run: () => {
          window.open("https://study.buildora.work", "_blank");
        },
      },
      {
        id: "act-bible-patterns",
        category: "Actions",
        title: "Browse All 23 GoF Design Patterns",
        subtitle:
          "Creational, structural, and behavioral patterns in TypeScript",
        icon: BookOpen,
        keywords: [
          "patterns",
          "gof",
          "design patterns",
          "architecture",
          "singleton",
          "factory",
          "observer",
        ],
        run: () => {
          window.open(
            "https://study.buildora.work/30-architecture/30.1-design-patterns/INDEX.html",
            "_blank",
          );
        },
      },
    ];

    // Add projects — each opens its case study route.
    PROJECTS.forEach((p) => {
      list.push({
        id: `proj-${projectSlug(p.title)}`,
        category: "Projects",
        title: p.title,
        subtitle: `Open the ${p.title} case study`,
        icon: Code2,
        keywords: [
          p.title.toLowerCase(),
          "case study",
          ...p.tech.toLowerCase().split(", "),
        ],
        run: () => router.push(caseStudyHref(p.title)),
      });
    });

    // Add tech filters
    const popularTechs = [
      "React",
      "TypeScript",
      "Next.js",
      "NestJS",
      "PostgreSQL",
      "Prisma",
    ];
    popularTechs.forEach((tech) => {
      list.push({
        id: `tech-${tech.toLowerCase()}`,
        category: "Tech Filters",
        title: `Filter Projects by ${tech}`,
        subtitle: `Show only projects built using ${tech}`,
        icon: Sparkles,
        keywords: ["tech", "filter", tech.toLowerCase()],
        run: () => {
          window.dispatchEvent(
            new CustomEvent("portfolio-filter-tech", { detail: tech }),
          );
          document
            .getElementById("Work")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      });
    });

    return list;
  }, [resolvedTheme, setTheme, router]);
}
