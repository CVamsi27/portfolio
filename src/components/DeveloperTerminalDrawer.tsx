"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Terminal, X, CornerDownLeft, Minimize2, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  PROJECTS,
  RESUME_PATH,
  SKILLS,
  WORK_EXPERIENCE,
} from "@/lib/const";
import { cn } from "@/lib/utils";

type TerminalLine = {
  type: "input" | "output" | "error" | "info";
  content: string;
};

const emptySubscribe = () => () => {};

const INITIAL_LINES: TerminalLine[] = [
  {
    type: "info",
    content: "Vamsi Krishna Chandaluri — Portfolio Terminal v2.4 (Next.js 16 / TypeScript)",
  },
  {
    type: "info",
    content: "Type 'help' to inspect available system commands, or press Esc to close.",
  },
];

export default function DeveloperTerminalDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    const newLines: TerminalLine[] = [
      ...lines,
      { type: "input", content: `visitor@vamsi:~$ ${cmd}` },
    ];

    const lower = trimmed.toLowerCase();
    const args = lower.split(" ");
    const primary = args[0];

    switch (primary) {
      case "help":
        newLines.push({
          type: "output",
          content: [
            "Available Commands:",
            "  whoami       - Display developer summary and current role",
            "  bible        - Inspect the 860+ chapter Senior Full Stack Bible (study.buildora.work)",
            "  patterns     - Inspect 23 GoF design patterns & distributed invariants",
            "  oss          - View open source repositories & public engineering",
            "  skills       - Print production technical capabilities & stack",
            "  projects     - List flagship systems and deployment links",
            "  impact       - Review verified production outcomes & endorsements",
            "  experience   - View career trajectory across 5+ years",
            "  contact      - Display direct inbox, phone & coordinates",
            "  resume       - Trigger download of VamsiKrishna_Resume.pdf",
            "  vcard        - Export vCard (.vcf) address book contact",
            "  theme        - Toggle between light and dark editorial theme",
            "  date         - Print current system date and timezone",
            "  clear        - Clear the terminal screen buffer",
            "  exit         - Close this terminal session",
          ].join("\n"),
        });
        break;

      case "bible":
        newLines.push({
          type: "output",
          content: [
            "SENIOR FULL STACK INTERVIEW BIBLE (study.buildora.work):",
            "  Scope:       868 Reference Files | 560 Study Chapters | 40 Interview Banks | 366K Lines",
            "  Lanes (2):   [1] Abroad Full-Stack (EU/US Startups)  [2] Indian SDE / FAANG",
            "  Stacks (7):  Frontend, Backend, Architecture, Platform, Quality, Real-Time, Interview Toolkit",
            "  Patterns:    All 23 GoF Design Patterns + 31 Production System Design Case Studies",
            "  Gates:       20 Automated Verification Gates enforcing zero-drift metrics",
            "  Live Corpus: https://study.buildora.work",
            "  GitHub Repo: https://github.com/CVamsi27/software-developer-bible",
          ].join("\n"),
        });
        window.open("https://study.buildora.work", "_blank");
        break;

      case "patterns":
      case "architecture":
        newLines.push({
          type: "output",
          content: [
            "PRODUCTION ARCHITECTURAL PATTERNS & GOF ENGINES:",
            "  • Transactional Outbox:  PostgreSQL dual-write protection & background dispatch",
            "  • Multi-Tenant RLS:      Postgres kernel tenant isolation with session context",
            "  • Advisory Locks:        High-concurrency anti-double-booking synchronization",
            "  • Observer / SSE:        Real-time OPD queue broadcast & canvas coordination",
            "  • Strategy Pattern:      Pluggable healthcare pricing algorithms & tariffs",
            "  • Factory Method:        Multi-channel SMS/WhatsApp/Email notifications",
            "  Navigating to Architecture section...",
          ].join("\n"),
        });
        document.getElementById("Architecture")?.scrollIntoView({ behavior: "smooth" });
        break;

      case "oss":
      case "opensource":
        newLines.push({
          type: "output",
          content: [
            "OPEN SOURCE REPOSITORIES & PUBLIC WORK:",
            "  • Senior Full Stack Bible:  github.com/CVamsi27/software-developer-bible (366k lines)",
            "  • TeamOps:                  github.com/CVamsi27/teamops (Real-Time WebSockets)",
            "  • Super Tic Tac Toe:        github.com/CVamsi27/super-tic-tac-toe (Minimax AI)",
            "  • Digital Library:          github.com/CVamsi27/digital-library (tRPC + Prisma)",
            "  Navigating to Open Source section...",
          ].join("\n"),
        });
        document.getElementById("OpenSource")?.scrollIntoView({ behavior: "smooth" });
        break;

      case "impact":
        newLines.push({
          type: "output",
          content: [
            "VERIFIED BUSINESS & ENGINEERING OUTCOMES:",
            "  • Docita Healthcare OS:   25+ Clinics Pan-India, 1,000+ monthly workflows, 99.9% uptime",
            "  • MAQ Software:           -30% p95 API response latency, reusable component library",
            "  • Cognizant:              4 Distributed Spring Boot microservices, Eureka & JWT routing",
            "  Navigating to Impact section...",
          ].join("\n"),
        });
        document.getElementById("Impact")?.scrollIntoView({ behavior: "smooth" });
        break;

      case "whoami":
        newLines.push({
          type: "output",
          content: [
            "Vamsi Krishna Chandaluri",
            "Title:    Senior Full Stack & Systems Engineer",
            "Focus:    Healthcare SaaS, Distributed Systems, High-Security Web Apps",
            "Current:  Lead Full Stack Engineer at Docita (25+ Clinics Active)",
            "Location: Pan-India / Remote (Open to Germany & Global Relocation)",
            "Stack:    TypeScript, React, Next.js, NestJS, Node.js, PostgreSQL, Prisma",
          ].join("\n"),
        });
        break;

      case "skills":
        newLines.push({
          type: "output",
          content: [
            "CORE PRODUCTION TECH STACK:",
            "  Frontend:     React 19, Next.js 16, TypeScript, TanStack Query, Tailwind CSS",
            "  Backend:      NestJS, Express, Node.js, Spring Boot, WebSockets",
            "  Database:     PostgreSQL, Prisma ORM, Row-Level Security (RLS), ACID Outbox",
            "  Verification: Jest, Vitest, Playwright E2E, GitHub Actions CI/CD, Docker",
            "  Architecture: Multi-Tenancy, ABAC, Distributed Queues, Transactional Outbox",
          ].join("\n"),
        });
        break;

      case "projects":
        newLines.push({
          type: "output",
          content: [
            "SELECTED SYSTEMS:",
            ...PROJECTS.map(
              (p, i) =>
                `  [${i + 1}] ${p.title.padEnd(18)} : ${p.URL || "GitHub Repo"} (${p.tech})`,
            ),
          ].join("\n"),
        });
        break;

      case "experience":
        newLines.push({
          type: "output",
          content: [
            "CAREER RECORD:",
            ...WORK_EXPERIENCE.map(
              (w) =>
                `  • ${w.company.padEnd(16)} | ${w.title.padEnd(30)} | ${w.duration}`,
            ),
          ].join("\n"),
        });
        break;

      case "contact":
        newLines.push({
          type: "output",
          content: [
            "DIRECT COORDINATES:",
            `  Email:    ${CONTACT_EMAIL}`,
            `  Phone:    ${CONTACT_PHONE}`,
            "  GitHub:   https://github.com/CVamsi27",
            "  LinkedIn: https://www.linkedin.com/in/vamsikrishnachandaluri/",
            "  X:        https://x.com/Vamsikrishna99C",
          ].join("\n"),
        });
        break;

      case "resume":
        const a = document.createElement("a");
        a.href = RESUME_PATH;
        a.download = "VamsiKrishna_Resume.pdf";
        a.click();
        newLines.push({
          type: "info",
          content: "Initiated download for VamsiKrishna_Resume.pdf...",
        });
        break;

      case "vcard":
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
        newLines.push({
          type: "info",
          content: "Downloaded contact card Vamsi_Krishna_Chandaluri.vcf",
        });
        break;

      case "theme":
        const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        newLines.push({
          type: "info",
          content: `Switched theme mode to: ${nextTheme}`,
        });
        break;

      case "clear":
        setLines([]);
        setInputVal("");
        return;

      case "date":
        newLines.push({
          type: "output",
          content: new Date().toString(),
        });
        break;

      case "sudo":
        newLines.push({
          type: "error",
          content: "Permission denied: You are already a root guest on this portfolio.",
        });
        break;

      case "exit":
        onClose();
        return;

      default:
        newLines.push({
          type: "error",
          content: `command not found: ${primary}. Type 'help' for available commands.`,
        });
        break;
    }

    setLines(newLines);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInputVal("");
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Developer Interactive Terminal"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Terminal Window */}
      <div className="relative flex h-[82vh] sm:h-[600px] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[var(--portfolio-rule)] bg-neutral-950 font-mono text-xs shadow-2xl text-neutral-200">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 py-2.5 select-none">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-[11px] font-semibold text-neutral-400">
              vamsi@portfolio:~ (bash)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLines([])}
              title="Clear terminal buffer"
              className="p-1 text-neutral-400 hover:text-neutral-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close terminal (Esc)"
              className="p-1 text-neutral-400 hover:text-neutral-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Screen Buffer */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 leading-relaxed scrollbar-thin">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                "whitespace-pre-wrap",
                line.type === "input" && "text-emerald-400 font-bold",
                line.type === "output" && "text-neutral-300",
                line.type === "info" && "text-sky-400",
                line.type === "error" && "text-rose-400",
              )}
            >
              {line.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="flex items-center border-t border-neutral-800 bg-neutral-900/60 px-4 py-2.5">
          <span className="text-emerald-400 font-bold mr-2 select-none">
            visitor@vamsi:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type 'help' for commands..."
            className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 focus:outline-none font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => handleCommand(inputVal)}
            className="p-1 text-neutral-400 hover:text-emerald-400"
            aria-label="Execute command"
          >
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
