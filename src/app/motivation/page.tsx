"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import { MOTIVATION_QUOTES, dateKey } from "@/lib/trackers";
import { useUserPrefs } from "@/lib/user-prefs";
import { cn } from "@/lib/utils";
import { Zap, Heart, Diamond, Check, X, ArrowRight, Shuffle, Bookmark } from "lucide-react";

export default function MotivationPage() {
  const { prefs } = useUserPrefs();
  const quotes = MOTIVATION_QUOTES[prefs.motivationStyle] ?? MOTIVATION_QUOTES.discipline;

  const daySeed = useMemo(() => {
    const d = dateKey();
    let h = 0;
    for (const c of d) h = (h * 31 + c.charCodeAt(0)) % 997;
    return h;
  }, []);
  const daily = quotes[daySeed % quotes.length];

  const [idx, setIdx] = useState(daySeed % quotes.length);
  const { value: favs, setValue: setFavs, status } = useSyncedStorage<string[]>(
    "motivation:favs",
    [],
  );
  const todayKey = dateKey();
  const { value: visits } = useSyncedStorage<Record<string, number>>(
    "motivation:visits",
    {},
  );

  const quote = quotes[idx % quotes.length];
  const isFav = favs.includes(quote.text);
  const streak = Object.keys(visits ?? {}).length + ((visits ?? {})[todayKey] ? 0 : 1);

  const shuffle = () =>
    setIdx((i) => (i + 1 + Math.floor(Math.random() * (quotes.length - 1))) % quotes.length);

  return (
    <RequireAuth>
    <TrackerShell
      icon="flame"
      title="Motivation"
      subtitle={`Daily ${prefs.motivationStyle} quotes — curated for your ${prefs.goalTitle || "goals"}.`}
      badge={<SyncBadge status={status} />}
    >
      {/* quote card */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-fuchsia-500/10">
        <CardContent className="p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Quote of the day · {quote.tag}
          </p>
          <blockquote className="font-display mt-3 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            &ldquo;{daily.text}&rdquo;
          </blockquote>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={shuffle} variant="secondary">
              <Shuffle className="mr-1.5 h-4 w-4" /> Shuffle deck
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFavs(isFav ? favs.filter((f) => f !== quote.text) : [...favs, quote.text])
              }
            >
              {isFav ? <><Bookmark className="mr-1.5 h-4 w-4" /> Saved</> : <><Bookmark className="mr-1.5 h-4 w-4" /> Save this one</>}
            </Button>
          </div>
          <p className="mt-4 rounded-lg bg-background/60 px-3 py-2 text-sm text-muted-foreground">
            Now showing: &ldquo;{quote.text}&rdquo;
          </p>
        </CardContent>
      </Card>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Day streak", v: `${streak}`, Icon: Zap, gradient: "from-amber-500 to-orange-600" },
          { l: "Saved", v: `${favs.length}`, Icon: Heart, gradient: "from-rose-500 to-pink-600" },
          { l: "Deck size", v: `${quotes.length}`, Icon: Diamond, gradient: "from-primary to-fuchsia-500" },
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

      {/* saved fuel */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-display font-bold">Saved fuel</h2>
          {(favs ?? []).length === 0 ? (
            <Card className="mt-3 border-dashed">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Bookmark className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nothing saved yet — hit &ldquo;Save this one&rdquo; on anything that hits.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="mt-3 space-y-2">
              {(favs ?? []).map((f) => (
                <li
                  key={f}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted/60",
                  )}
                >
                  <span>&ldquo;{f}&rdquo;</span>
                  <button
                    onClick={() => setFavs((favs ?? []).filter((x) => x !== f))}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* goal anchor */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-display font-bold">Goal anchor</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your focus: <strong>{prefs.goalTitle || prefs.goalCategory}</strong>. Daily
            non-negotiables keep you on track.{" "}
            <a href="/goal" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              View goal board <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </p>
        </CardContent>
      </Card>
    </TrackerShell>
    </RequireAuth>
  );
}
