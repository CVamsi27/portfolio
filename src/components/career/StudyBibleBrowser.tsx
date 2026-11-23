"use client";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Search,
} from "lucide-react";
import curriculum from "@/data/career-curriculum.json";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import type { CompletedChapterRecord } from "@/lib/study-focus";
import StudyStackBars from "@/components/charts/StudyStackBars";
import { Input } from "@/components/ui/input";

type PriorityFilter = "Essential" | "Important" | "All";

export default function StudyBibleBrowser() {
  const { value: completed, setValue: setCompleted } = useSyncedStorage<
    CompletedChapterRecord[]
  >("study:completed_chapters", []);
  const [stackFilter, setStackFilter] = useState<string>("all");
  const [priority, setPriority] = useState<PriorityFilter>("Essential");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const completedSet = useMemo(
    () => new Set((completed ?? []).map((c) => c.chapterId)),
    [completed],
  );

  const allChapters = useMemo(
    () =>
      curriculum.days.flatMap((day) =>
        (day.chapters ?? []).map((ch) => ({
          ...ch,
          day: day.day,
          date: day.date,
        })),
      ),
    [],
  );

  const stacks = useMemo(
    () => [...new Set(allChapters.map((c) => c.stack))],
    [allChapters],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allChapters.filter((ch) => {
      if (stackFilter !== "all" && ch.stack !== stackFilter) return false;
      if (priority !== "All" && ch.rolePriority !== priority) return false;
      if (
        q &&
        !`${ch.title} ${ch.stack} ${ch.path}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [allChapters, stackFilter, priority, query]);

  const toggleMastered = (ch: (typeof allChapters)[number]) => {
    setCompleted((prev) => {
      const list = prev ?? [];
      if (list.some((item) => item.chapterId === ch.id)) {
        return list.filter((item) => item.chapterId !== ch.id);
      }
      return [
        ...list,
        {
          chapterId: ch.id,
          chapterTitle: ch.title,
          stack: ch.stack,
          day: ch.day,
          date: new Date().toISOString().slice(0, 10),
          completedAt: new Date().toISOString(),
          durationMinutes: ch.estimatedMinutes ?? 10,
          distractions: 0,
          notes: "",
        },
      ];
    });
  };

  const visible = showAll ? filtered : filtered.slice(0, 48);

  return (
    <div className="space-y-6" data-testid="study-bible-browser">
      <StudyStackBars
        completedIds={completedSet}
        essentialOnly={priority === "Essential"}
        onSelectStack={(st) =>
          setStackFilter((prev) => (prev === st ? "all" : st))
        }
      />

      {/* Search & Filter Toolbar */}
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Verified Study Bible Chapters ({filtered.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Starts {curriculum.startDate} · Every link opens the clean page on{" "}
              <a
                href="https://study.buildora.work/ROADMAP"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                study.buildora.work
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["Essential", "Important", "All"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPriority(level)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  priority === level
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/70 bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search V8, closures, PostgreSQL RLS, MVCC, outbox, sliding window…"
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter by stack"
            value={stackFilter}
            onChange={(e) => setStackFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium"
          >
            <option value="all">All stacks ({stacks.length})</option>
            {stacks.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter List */}
        <ul className="divide-y divide-border/50">
          {visible.map((ch) => {
            const done = completedSet.has(ch.id);
            return (
              <li
                key={ch.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleMastered(ch)}
                    aria-label={
                      done
                        ? `Mark ${ch.title} as not mastered`
                        : `Mark ${ch.title} as mastered`
                    }
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <a
                      href={ch.studyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors ${
                        done ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      <span className="truncate">{ch.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{ch.stack}</span> ·{" "}
                      {ch.estimatedMinutes} min · {ch.rolePriority} · Group{" "}
                      {ch.day} ({ch.date})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={ch.studyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-medium hover:border-primary/50"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Study
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleMastered(ch)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      done
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "border border-border/70 bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {done ? "Mastered" : "Done"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {filtered.length > visible.length && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-xl border border-border/70 bg-background px-4 py-2 text-xs font-semibold hover:border-primary/50"
            >
              Show all {filtered.length} matching chapters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
