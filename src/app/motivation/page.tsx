"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TrackerShell from "@/components/trackers/TrackerShell";
import FocusScene from "@/components/motivation/FocusScene";
import Modal from "@/components/trackers/Modal";
import EmptyState from "@/components/trackers/EmptyState";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SyncBadge } from "@/components/auth/AuthButton";
import { useUserPrefs } from "@/lib/user-prefs";
import {
  type JournalMap,
  MOTIVATION_QUOTES,
  calculateStreak,
  dateKey,
  milestonesFor,
} from "@/lib/trackers";
import { useCustomQuotes, useGoalState, useJournal, useMigrateFasting, useMigrateGoal, useMotivationVisits, newCustomQuote } from "@/lib/tracker-store";
import { GOAL_CATEGORIES, displayGoalTitle } from "@/lib/user-prefs";
import Segmented from "@/components/trackers/Segmented";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { fallbackMotivationMedia, type MotivationMedia } from "@/lib/motivation-media";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Copy,
  Feather,
  Plus,
  Quote,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";

const JOURNAL_PROMPTS = [
  { key: "win" as const, label: "One win today", placeholder: "Shipped the auth flow…", icon: Sparkles },
  { key: "learned" as const, label: "One thing I learned / grateful for", placeholder: "Finally understood RSC hydration…", icon: BookOpen },
  { key: "focus" as const, label: "Tomorrow's #1 focus", placeholder: "Finish the set logger…", icon: ArrowRight },
];

export default function MotivationPage() {
  // Runs the fasting/goal migrations early for returning users; harmless no-op otherwise.
  useMigrateFasting();
  useMigrateGoal();
  const router = useRouter();
  const { prefs, setPrefs } = useUserPrefs();
  const { value: goal } = useGoalState();
  const presetQuotes = MOTIVATION_QUOTES[prefs.motivationStyle] ?? MOTIVATION_QUOTES.discipline;

  const { value: favs, setValue: setFavs, status } = useSyncedStorage<string[]>("motivation:favs", []);
  const { value: visits, setValue: setVisits } = useMotivationVisits();
  const { value: customQuotes, setValue: setCustomQuotes } = useCustomQuotes();
  const { value: journal, setValue: setJournal } = useJournal();
  const { value: mediaCache, setValue: setMediaCache } = useSyncedStorage<Record<string, MotivationMedia>>("motivation:media", {});

  const safeFavs = favs ?? [];
  const safeVisits = useMemo(() => visits ?? {}, [visits]);
  const safeCustom = useMemo(() => customQuotes ?? [], [customQuotes]);
  const safeJournal: JournalMap = useMemo(() => journal ?? {}, [journal]);
  const safeGoal = useMemo(() => goal ?? { metricByDay: {}, milestonesByCategory: {} }, [goal]);
  const goalMeta = GOAL_CATEGORIES.find((category) => category.id === prefs.goalCategory) ?? GOAL_CATEGORIES[0];
  const milestones = useMemo(() => milestonesFor(safeGoal, prefs.goalCategory), [safeGoal, prefs.goalCategory]);
  const completedMilestones = milestones.filter((milestone) => milestone.done).length;
  const goalPct = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const nextMilestone = milestones.find((milestone) => !milestone.done)?.title ?? "All milestones complete";

  const today = dateKey();
  const [copied, setCopied] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState({ text: "", tag: "Mine" });
  const [media, setMedia] = useState<MotivationMedia>(() => fallbackMotivationMedia(prefs.motivationPersonalization, prefs.goalCategory));

  // Register today's visit once, from an effect (never during render).
  // Uses the store's updater form so a stale first-render snapshot (before
  // localStorage hydration) can never wipe previously-visited days.
  const [visitRecorded, setVisitRecorded] = useState(false);
  useEffect(() => {
    if (visitRecorded) return;
    setVisitRecorded(true);
    setVisits((prev) => {
      const v = prev ?? {};
      if (v[today]) return v;
      return { ...v, [today]: Date.now() };
    });
  }, [visitRecorded, today, setVisits]);

  // Deck = presets + user's custom affirmations (normalized to one shape)
  const deck = useMemo<{ text: string; tag: string; id: string }[]>(
    () => [
      ...presetQuotes.map((q, i) => ({ ...q, id: `preset-${i}` })),
      ...safeCustom.map((q) => ({ text: q.text, tag: q.tag || "Mine", id: q.id })),
    ],
    [presetQuotes, safeCustom],
  );

  const daySeed = useMemo(() => {
    let h = 0;
    for (const c of today) h = (h * 31 + c.charCodeAt(0)) % 997;
    return h;
  }, [today]);
  const [idx, setIdx] = useState(daySeed % Math.max(1, deck.length));
  const current = deck[((idx % deck.length) + deck.length) % deck.length];
  const currentText = current.text;
  const isFav = safeFavs.includes(currentText);

  // Real consecutive-day streak across journaling + visits.
  const activeDays = useMemo(
    () => Array.from(new Set([...Object.keys(safeJournal), ...Object.keys(safeVisits)])),
    [safeJournal, safeVisits],
  );
  const streak = calculateStreak(activeDays);

  const shuffle = () => setIdx((i) => i + 1 + Math.floor(Math.random() * (deck.length - 1)));

  const toggleFav = () =>
    setFavs(isFav ? safeFavs.filter((f) => f !== currentText) : [...safeFavs, currentText]);

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(`"${currentText}"`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const addCustomQuote = () => {
    const text = quoteDraft.text.trim();
    if (!text) return;
    setCustomQuotes([...safeCustom, newCustomQuote(text, quoteDraft.tag.trim() || "Mine")]);
    setQuoteDraft({ text: "", tag: "Mine" });
    setQuoteOpen(false);
  };

  // Journal draft state, hydrated from today's saved entry.
  const entry = safeJournal[today] ?? { win: "", learned: "", focus: "", updatedAt: 0 };
  const [draft, setDraft] = useState<{ win: string; learned: string; focus: string } | null>(null);
  const draftState = draft ?? { win: entry.win, learned: entry.learned, focus: entry.focus };
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const country =
      prefs.motivationPersonalization === "goal" && prefs.goalCategory === "relocation"
        ? prefs.goalCountry
        : undefined;
    const key = `${prefs.motivationPersonalization}:${prefs.goalCategory}:${country ?? "none"}`;
    const cached = mediaCache?.[key];
    if (cached && Date.now() - cached.fetchedAt < 86_400_000) {
      setMedia(cached);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      source: prefs.motivationPersonalization,
      category: prefs.goalCategory,
    });
    if (country) params.set("country", country);
    fetch(`/api/motivation-media?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("media unavailable"))))
      .then((next: MotivationMedia) => {
        if (cancelled) return;
        setMedia(next);
        setMediaCache({ ...(mediaCache ?? {}), [key]: next });
      })
      .catch(() => {
        if (!cancelled) setMedia(fallbackMotivationMedia(prefs.motivationPersonalization, prefs.goalCategory));
      });
    return () => { cancelled = true; };
  }, [mediaCache, prefs.goalCategory, prefs.goalCountry, prefs.motivationPersonalization, setMediaCache]);

  const saveJournal = () => {
    // Event handler — stamping the wall clock is the intent.
    // eslint-disable-next-line react-hooks/purity
    const savedAt = Date.now();
    setJournal({ ...safeJournal, [today]: { ...draftState, updatedAt: savedAt } });
    setDraft(null);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <RequireAuth>
      <TrackerShell
        icon="flame"
        title="Motivation"
        subtitle={`Daily ${prefs.motivationStyle} deck with your own affirmations, favorites, and a three-prompt reflection anchor.`}
        badge={<SyncBadge status={status} />}
      >
        <div className="flex flex-col gap-2 border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-utility text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Inspiration source</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose whether the scene follows your goal or stays broad.</p>
          </div>
          <Segmented
            label="Inspiration source"
            options={[
              { value: "goal" as const, label: "Goal-aware" },
              { value: "general" as const, label: "General inspiration" },
            ]}
            value={prefs.motivationPersonalization}
            onChange={(value) => setPrefs({ ...prefs, motivationPersonalization: value })}
          />
        </div>
        <FocusScene
          goalTitle={displayGoalTitle(prefs)}
          goalLabel={goalMeta.label}
          goalPct={goalPct}
          nextMilestone={nextMilestone}
          streak={streak}
          quote={currentText}
          quoteTag={current.tag}
          saved={isFav}
          copied={copied}
          onStartAction={() => router.push("/goal")}
          onShuffle={shuffle}
          onSave={toggleFav}
          onCopy={copyQuote}
          onOpenGoal={() => router.push("/goal")}
          media={media}
        />

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Day streak", v: `${streak}`, Icon: Zap, gradient: "from-amber-500 to-orange-600" },
            { l: "Saved", v: `${safeFavs.length}`, Icon: Bookmark, gradient: "from-rose-500 to-pink-600" },
            { l: "Deck size", v: `${deck.length}`, Icon: Quote, gradient: "from-primary to-fuchsia-500" },
          ].map((s) => (
            <Card key={s.l} className="group overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <span
                  aria-hidden
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg`}
                >
                  <s.Icon className="h-5 w-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{s.l}</p>
                  <p className="font-display text-2xl font-bold">{s.v}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Daily micro-journal ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">Daily reflection</h2>
              {entry.updatedAt ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  saved {new Date(entry.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
            </div>
            <div className="mt-3 space-y-3">
              {JOURNAL_PROMPTS.map((p) => (
                <div key={p.key}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <p.icon className="h-3.5 w-3.5 text-primary" /> {p.label}
                  </label>
                  <Input
                    className="mt-1.5"
                    placeholder={p.placeholder}
                    value={draftState[p.key]}
                    onChange={(e) => setDraft({ ...draftState, [p.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              {savedFlash && <span className="text-xs font-semibold text-emerald-500">Saved ✓</span>}
              <Button size="sm" onClick={saveJournal} disabled={!draftState.win && !draftState.learned && !draftState.focus}>
                Save reflection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Custom affirmations ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">Your affirmations</h2>
              <Button variant="outline" size="sm" onClick={() => setQuoteOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {safeCustom.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={Feather}
                  title="No personal affirmations yet"
                  hint="Add mantras in your own words — they join the daily deck and shuffle alongside the presets."
                  action={
                    <Button size="sm" variant="outline" onClick={() => setQuoteOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Write one
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {safeCustom.map((q) => (
                  <li key={q.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm">
                    <span>
                      &ldquo;{q.text}&rdquo;
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{q.tag}</span>
                    </span>
                    <button
                      onClick={() => setCustomQuotes(safeCustom.filter((x) => x.id !== q.id))}
                      aria-label="Delete affirmation"
                      className="shrink-0 text-muted-foreground transition-colors hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Saved fuel ── */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display font-bold">Saved fuel</h2>
            {safeFavs.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nothing saved yet — hit &ldquo;Save&rdquo; on anything that hits.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {safeFavs.map((f) => (
                  <li key={f} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span>&ldquo;{f}&rdquo;</span>
                    <button
                      onClick={() => setFavs(safeFavs.filter((x) => x !== f))}
                      aria-label="Remove"
                      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Custom quote modal ── */}
        <Modal
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          title="New affirmation"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setQuoteOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={addCustomQuote} disabled={!quoteDraft.text.trim()}>
                Add to deck
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <Input
              placeholder="I show up for the hard things first…"
              value={quoteDraft.text}
              onChange={(e) => setQuoteDraft({ ...quoteDraft, text: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addCustomQuote()}
              autoFocus
            />
            <Input
              placeholder="Tag (optional) — e.g. Mantra"
              value={quoteDraft.tag}
              onChange={(e) => setQuoteDraft({ ...quoteDraft, tag: e.target.value })}
            />
          </div>
        </Modal>
      </TrackerShell>
    </RequireAuth>
  );
}
