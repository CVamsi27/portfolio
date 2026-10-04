"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Headphones } from "lucide-react";
import { useWorkSession } from "@/lib/work-session-store";
import Modal from "@/components/trackers/Modal";
import { Button } from "@/components/ui/button";
import { podcastsForTopic } from "@/lib/study-audio";

export default function StudyBreakLoungeModal({
  open,
  onClose,
  defaultTimerMinutes = 5,
}: {
  open: boolean;
  onClose: () => void;
  defaultTimerMinutes?: number;
}) {
  const { study } = useWorkSession();
  const podcasts = podcastsForTopic(
    `${study?.chapterTitle ?? ""} ${study?.stack ?? ""}`,
  );
  const [minutes, setMinutes] = useState(defaultTimerMinutes);
  const [timer, setTimer] = useState({
    remainingMs: defaultTimerMinutes * 60_000,
    deadline: null as number | null,
  });
  const [now, setNow] = useState(() => Date.now());

  // Deadlines account for throttled/background tabs. Closing the chooser does
  // not interrupt a running break; the mounted shared component retains it.
  useEffect(() => {
    if (timer.deadline === null) return;
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 500);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [timer.deadline]);

  const remaining =
    timer.deadline === null
      ? timer.remainingMs
      : Math.max(0, timer.deadline - now);
  const seconds = Math.ceil(remaining / 1000);
  const running = timer.deadline !== null && remaining > 0;
  const start = () => {
    const current = Date.now();
    setNow(current);
    setTimer({ remainingMs: remaining, deadline: current + remaining });
  };
  const pause = () =>
    setTimer({
      remainingMs: Math.max(0, (timer.deadline ?? Date.now()) - Date.now()),
      deadline: null,
    });
  const reset = () =>
    setTimer({ remainingMs: minutes * 60_000, deadline: null });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Listen on YouTube Music"
      className="max-w-lg"
      footer={
        <Button className="w-full" onClick={onClose}>
          Return to study
        </Button>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Choose a developer podcast for your break. YouTube Music opens in a
          new tab where you can choose an episode and control playback.
        </p>
        <div className="space-y-3">
          {podcasts.map((podcast) => (
            <article
              key={podcast.title}
              className="rounded-xl border border-border p-4 space-y-2"
            >
              <h3 className="flex items-center gap-2 font-semibold">
                <Headphones className="h-4 w-4 text-primary" aria-hidden />
                {podcast.title}
              </h3>
              <p className="text-sm text-muted-foreground">{podcast.topic}</p>
              <a
                href={podcast.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Find podcast on YouTube Music: ${podcast.title}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              >
                Find podcast on YouTube Music{" "}
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
              </a>
            </article>
          ))}
        </div>
        <section
          aria-label="Optional break timer"
          className="rounded-xl bg-muted/40 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Optional break timer</h3>
            <output
              role="timer"
              aria-live="off"
              aria-label="Break time remaining"
              className="font-mono text-2xl tabular-nums"
            >
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </output>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Break duration">
            {[5, 10, 15].map((value) => (
              <Button
                key={value}
                variant="outline"
                aria-pressed={minutes === value}
                disabled={running}
                onClick={() => {
                  setMinutes(value);
                  setTimer({ remainingMs: value * 60_000, deadline: null });
                }}
              >
                {value} min
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {running ? (
              <Button onClick={pause}>Pause timer</Button>
            ) : (
              <Button onClick={start} disabled={remaining === 0}>
                {remaining === minutes * 60_000
                  ? "Start timer"
                  : "Resume timer"}
              </Button>
            )}
            <Button variant="outline" onClick={reset}>
              Reset timer
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setTimer({ remainingMs: 0, deadline: null });
              }}
            >
              End break
            </Button>
          </div>
          {remaining === 0 && (
            <p role="status" className="text-sm font-medium">
              Break finished. Return to study when you’re ready.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The timer runs while this chooser is closed. It does not control
            YouTube Music or change your focus session.
          </p>
        </section>
      </div>
    </Modal>
  );
}
