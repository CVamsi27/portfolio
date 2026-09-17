"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Pause, Play, RotateCcw, X } from "lucide-react";
import { SimpleRing } from "./Ring";
import { cn } from "@/lib/utils";

const PRESETS = [60, 90, 120, 180] as const;

/**
 * Floating rest-timer widget for workout sessions. Uses a deadline
 * timestamp so the countdown stays correct across tab suspension.
 * Beeps (WebAudio) and vibrates when finished, if enabled.
 */
export default function RestTimer({
  seconds,
  onClose,
  onComplete,
}: {
  seconds: number;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + seconds * 1000);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const leftMs = pausedLeft ?? Math.max(0, endsAt - now);
  const totalMs = seconds * 1000;
  const pct = totalMs ? (leftMs / totalMs) * 100 : 0;
  const done = leftMs <= 0;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      if (sound) beep();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          // unsupported
        }
      }
      onComplete?.();
    }
  }, [done, sound, onComplete]);

  const togglePause = () => {
    if (pausedLeft !== null) {
      setEndsAt(Date.now() + pausedLeft);
      setPausedLeft(null);
    } else {
      setPausedLeft(leftMs);
    }
  };

  const restart = (s: number) => {
    // Event handler — reading the wall clock here is the whole point.
    // eslint-disable-next-line react-hooks/purity
    const at = Date.now();
    firedRef.current = false;
    setPausedLeft(null);
    setEndsAt(at + s * 1000);
    setNow(at);
  };

  const mmss = useMemo(() => {
    const s = Math.ceil(leftMs / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }, [leftMs]);

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-24 z-[80] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-2xl shadow-primary/20 backdrop-blur-md sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0",
        done && "border-emerald-500/50",
      )}
    >
      <SimpleRing pct={pct} size={64} thickness={7} from={done ? "#10b981" : "#3b82f6"} to={done ? "#34d399" : "#8b5cf6"}>
        <span className="font-display text-[13px] font-bold tabular-nums">{mmss}</span>
      </SimpleRing>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{done ? "Rest done — next set!" : "Rest timer"}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => restart(s)}
              className="rounded-md border border-border/60 px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition-colors hover:border-primary/50 hover:text-primary"
            >
              {s}s
            </button>
          ))}
          <button
            onClick={togglePause}
            aria-label={pausedLeft !== null ? "Resume" : "Pause"}
            className="rounded-md border border-border/60 p-1 transition-colors hover:border-primary/50 hover:text-primary"
          >
            {pausedLeft !== null ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button
            onClick={() => restart(seconds)}
            aria-label="Restart"
            className="rounded-md border border-border/60 p-1 transition-colors hover:border-primary/50 hover:text-primary"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={() => setSound((v) => !v)}
            aria-label={sound ? "Mute" : "Unmute"}
            className="rounded-md border border-border/60 p-1 transition-colors hover:border-primary/50 hover:text-primary"
          >
            {sound ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Close rest timer"
        className="self-start rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Two-tone finish chime via WebAudio — no asset needed. */
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (freq: number, at: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + dur + 0.05);
    };
    play(880, 0, 0.15);
    play(1320, 0.18, 0.25);
    setTimeout(() => void ctx.close(), 800);
  } catch {
    // audio unavailable
  }
}
