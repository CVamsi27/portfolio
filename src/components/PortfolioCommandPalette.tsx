"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};
import {
  Search,
  X,
  FileText,
  User,
  Briefcase,
  Layers,
  Mail,
  Copy,
  Download,
  Sun,
  Moon,
  ExternalLink,
  Code2,
  Sparkles,
  Check,
  Gamepad2,
  Terminal,
  BookOpen,
  Workflow,
  Quote,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL, CONTACT_PHONE, PROJECTS, RESUME_PATH } from "@/lib/const";
import { toast } from "@/components/ui/use-toast";

export type PaletteCommand = {
  id: string;
  category: "Navigation" | "Projects" | "Actions" | "Tech Filters";
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  run: () => void;
};

export default function PortfolioCommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState(query);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  const commands = useMemo<PaletteCommand[]>(() => {
    const list: PaletteCommand[] = [
      // Navigation
      {
        id: "nav-top",
        category: "Navigation",
        title: "Top / Overview",
        subtitle: "Jump to portfolio introduction & hero",
        icon: User,
        keywords: ["home", "intro", "about", "bio", "hero"],
        run: () => {
          document.getElementById("Top")?.scrollIntoView({ behavior: "smooth" });
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
          document.getElementById("Work")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-architecture",
        category: "Navigation",
        title: "Architecture & GoF Patterns",
        subtitle: "Jump to Gang of Four design patterns & distributed invariants",
        icon: Workflow,
        keywords: ["architecture", "gof", "patterns", "outbox", "rls", "design", "system"],
        run: () => {
          document.getElementById("Architecture")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-opensource",
        category: "Navigation",
        title: "Open Source & Research",
        subtitle: "Jump to public tools, Bible repo & contribution tracks",
        icon: GitBranch,
        keywords: ["open source", "oss", "github", "bible", "teamops", "public"],
        run: () => {
          document.getElementById("OpenSource")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-experience",
        category: "Navigation",
        title: "Career Record",
        subtitle: "Jump to roles at Docita, MAQ Software & Cognizant",
        icon: FileText,
        keywords: ["experience", "jobs", "career", "history", "roles", "companies"],
        run: () => {
          document.getElementById("Experience")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-capabilities",
        category: "Navigation",
        title: "Capabilities & Tech Shelf",
        subtitle: "Jump to engineering pillars & production stack",
        icon: Layers,
        keywords: ["skills", "stack", "tech", "tools", "capabilities", "languages"],
        run: () => {
          document.getElementById("Capabilities")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "nav-impact",
        category: "Navigation",
        title: "Verified Production Impact",
        subtitle: "Jump to clinical & enterprise endorsements and outcomes",
        icon: Quote,
        keywords: ["impact", "testimonials", "endorsements", "reviews", "recommendations"],
        run: () => {
          document.getElementById("Impact")?.scrollIntoView({ behavior: "smooth" });
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
          document.getElementById("Contact")?.scrollIntoView({ behavior: "smooth" });
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
            `TEL;TYPE=CELL:${CONTACT_PHONE.replace(/\\s+/g, "")}`,
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
        subtitle: "Lockdown focus reader with tab-switch guard, attention checks & progress tracking",
        icon: ShieldCheck,
        keywords: ["study", "focus", "distraction", "cockpit", "deep study", "lockdown", "attention", "bible"],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-open-study-cockpit"));
        },
      },
      {
        id: "act-germany-shield",
        category: "Actions",
        title: "Germany Goal Guardian & Distraction Shield",
        subtitle: "Allowlist (buildora, notion, github), social media blocklist & 1h lockdown",
        icon: ShieldAlert,
        keywords: ["distraction", "blocklist", "allowlist", "germany", "shield", "social media", "lockdown", "guardian", "dreams"],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-trigger-distraction-shield", { detail: { url: "https://instagram.com" } }));
        },
      },
      {
        id: "act-bible",
        category: "Actions",
        title: "Open Senior Full Stack Bible (study.buildora.work)",
        subtitle: "868 reference files & 560 study chapters across 7 technical stacks",
        icon: BookOpen,
        keywords: ["bible", "study", "notes", "interview", "faang", "abroad", "cheatsheet"],
        run: () => {
          window.open("https://study.buildora.work", "_blank");
        },
      },
      {
        id: "act-bible-patterns",
        category: "Actions",
        title: "Browse All 23 GoF Design Patterns",
        subtitle: "Creational, structural, and behavioral patterns in TypeScript",
        icon: BookOpen,
        keywords: ["patterns", "gof", "design patterns", "architecture", "singleton", "factory", "observer"],
        run: () => {
          window.open("https://study.buildora.work/30-architecture/30.1-design-patterns/INDEX.html", "_blank");
        },
      },
    ];

    // Add projects
    PROJECTS.forEach((p) => {
      list.push({
        id: `proj-${p.title.toLowerCase().replace(/\\s+/g, "-")}`,
        category: "Projects",
        title: p.title,
        subtitle: p.description,
        icon: Code2,
        keywords: [p.title.toLowerCase(), ...p.tech.toLowerCase().split(", ")],
        run: () => {
          if (p.URL) {
            window.open(p.URL, "_blank");
          } else {
            document.getElementById("Work")?.scrollIntoView({ behavior: "smooth" });
          }
        },
      });
    });

    // Add tech filters
    const popularTechs = ["React", "TypeScript", "Next.js", "NestJS", "PostgreSQL", "Prisma"];
    popularTechs.forEach((tech) => {
      list.push({
        id: `tech-${tech.toLowerCase()}`,
        category: "Tech Filters",
        title: `Filter Projects by ${tech}`,
        subtitle: `Show only projects built using ${tech}`,
        icon: Sparkles,
        keywords: ["tech", "filter", tech.toLowerCase()],
        run: () => {
          window.dispatchEvent(new CustomEvent("portfolio-filter-tech", { detail: tech }));
          document.getElementById("Work")?.scrollIntoView({ behavior: "smooth" });
        },
      });
    });

    return list;
  }, [resolvedTheme, setTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(q);
      const matchKeywords = cmd.keywords?.some((k) => k.includes(q));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, filtered, selectedIndex]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-[110] flex items-start justify-center p-4 sm:p-6 sm:pt-24"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] shadow-2xl transition-all">
        {/* Search Input */}
        <div className="flex items-center border-b border-[var(--portfolio-rule)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--portfolio-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, project name, or technology..."
            aria-label="Search commands"
            className="ml-3 flex-1 bg-transparent font-utility text-sm text-[var(--portfolio-ink)] placeholder:text-[var(--portfolio-muted)]/70 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded p-1 text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]"
              aria-label="Clear query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--portfolio-rule)] bg-muted/30 px-1.5 py-0.5 font-utility text-[0.62rem] text-[var(--portfolio-muted)]">
              Esc
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--portfolio-muted)]">
              No matching commands or projects found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors",
                    isSelected
                      ? "bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]"
                      : "text-[var(--portfolio-ink)] hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                        isSelected
                          ? "border-[var(--portfolio-accent)]/40 bg-[var(--portfolio-accent)]/10 text-[var(--portfolio-accent)]"
                          : "border-[var(--portfolio-rule)] bg-muted/20 text-[var(--portfolio-muted)]",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {item.title}
                      </p>
                      {item.subtitle ? (
                        <p className="truncate font-utility text-[0.68rem] text-[var(--portfolio-muted)]">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <span className="ml-2 shrink-0 font-utility text-[0.62rem] text-[var(--portfolio-muted)]">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between border-t border-[var(--portfolio-rule)] bg-muted/10 px-4 py-2 text-[0.65rem] font-utility text-[var(--portfolio-muted)]">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>·</span>
            <span>↵ Select</span>
            <span>·</span>
            <span>Esc Close</span>
          </div>
          <span className="font-semibold text-[var(--portfolio-accent)]">
            Command Palette
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
