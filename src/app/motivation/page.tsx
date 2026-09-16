"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import { MOTIVATION_QUOTES, dateKey } from "@/lib/trackers";
import { cn } from "@/lib/utils";

export default function MotivationPage() {
  const daySeed = useMemo(() => {
    const d = dateKey();
    let h = 0;
    for (const c of d) h = (h * 31 + c.charCodeAt(0)) % 997;
    return h;
  }, []);
  const daily = MOTIVATION_QUOTES[daySeed % MOTIVATION_QUOTES.length];

  const [idx, setIdx] = useState(daySeed % MOTIVATION_QUOTES.length);
  const { value: favs, setValue: setFavs, status } = useSyncedStorage<string[]>(
    "motivation:favs",
    [],
  );
  const todayKey = dateKey();
  const { value: visits } = useSyncedStorage<Record<string, number>>(
    "motivation:visits",
    {},
  );

  const quote = MOTIVATION_QUOTES[idx % MOTIVATION_QUOTES.length];
  const isFav = favs.includes(quote.text);
  // Derived during render (no effect): counts today even before it's persisted.
  const streak = Object.keys(visits).length + (visits[todayKey] ? 0 : 1);

  const shuffle = () =>
    setIdx((i) => (i + 1 + Math.floor(Math.random() * (MOTIVATION_QUOTES.length - 1))) % MOTIVATION_QUOTES.length);

  return (
    <RequireAuth>
    <TrackerShell
      icon="🔥"
      title="Motivation"
      subtitle="One quote, zero noise. Daily pick plus a deck you can shuffle and save — built for the job hunt days."
      badge={<SyncBadge status={status} />}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-fuchsia-500/10">
        <CardContent className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Quote of the day · {quote.tag}
          </p>
          <blockquote className="font-display mt-3 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            “{daily.text}”
          </blockquote>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={shuffle} variant="secondary">
              Shuffle deck
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFavs(isFav ? favs.filter((f) => f !== quote.text) : [...favs, quote.text])
              }
            >
              {isFav ? "Saved ✓" : "Save this one"}
            </Button>
          </div>
          <p className="mt-4 rounded-lg bg-background/60 px-3 py-2 text-sm text-muted-foreground">
            Now showing: “{quote.text}”
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Day streak", v: `${streak}` },
          { l: "Saved", v: `${favs.length}` },
          { l: "Deck size", v: `${MOTIVATION_QUOTES.length}` },
        ].map((s) => (
          <Card key={s.l}>
            <CardContent className="p-4 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
              <p className="font-display mt-1 text-2xl font-bold">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Saved fuel</h2>
          {favs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing saved yet — hit “Save this one” on anything that hits.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {favs.map((f) => (
                <li
                  key={f}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm",
                  )}
                >
                  <span>“{f}”</span>
                  <button
                    onClick={() => setFavs(favs.filter((x) => x !== f))}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Germany goal anchor</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Goal: land a Full Stack role and relocate to Berlin. Daily
            non-negotiables — 3 applications, 1 workout logged, 16h fast
            closed. Track it on the{" "}
            <a href="/goal" className="font-medium text-primary hover:underline">
              Germany Goal board →
            </a>
          </p>
        </CardContent>
      </Card>
    </TrackerShell>
    </RequireAuth>
  );
}
