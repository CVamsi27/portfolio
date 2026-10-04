"use client";
import Link from "next/link";
import { useWorkSession } from "@/lib/work-session-store";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { completeFocusSession, type FocusSession } from "@/lib/focus-sprint";
import { exitFullscreen } from "@/lib/focus-mode";
import { Button } from "@/components/ui/button";
export default function ActiveSessionBar() {
  const work = useWorkSession();
  const sessions = useSyncedStorage<FocusSession[]>("focus:sessions", []);
  if (!work.focus) return null;
  const clear = () => {
    work.setFocus(null);
    void exitFullscreen();
    document.documentElement.removeAttribute("data-focus-session");
  };
  return (
    <aside
      data-testid="focus-lock-status"
      className="active-session-bar"
      aria-label="Active work session"
    >
      <span>
        <strong>{work.focus.label}</strong>
        <small>
          Focus is active · {work.focus.interruptions ?? 0} interruptions
        </small>
        <small>
          {work.focus.pausedAt ? "Paused session" : "Session in progress"}
        </small>
      </span>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/plan?view=focus${work.focus.taskId ? `&task=${encodeURIComponent(work.focus.taskId)}` : ""}${work.focus.returnTo?.match(/[?&]date=(\d{4}-\d{2}-\d{2})/)?.[1] ? `&date=${work.focus.returnTo.match(/[?&]date=(\d{4}-\d{2}-\d{2})/)![1]}` : ""}`}
        >
          Resume →
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (!work.focus) return;
            const record = completeFocusSession(work.focus, Date.now());
            sessions.setValue((p) =>
              p.some((s) => s.id === record.id)
                ? p
                : [record, ...p].slice(0, 100),
            );
            clear();
          }}
        >
          Finish session
        </Button>
        <Button
          aria-label="Cancel focus session"
          size="sm"
          variant="ghost"
          onClick={clear}
        >
          Cancel session
        </Button>
      </div>
    </aside>
  );
}
