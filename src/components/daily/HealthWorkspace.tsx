"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import { usePersonalModules } from "@/lib/personal-modules";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useFasting, useFastingHistory } from "@/lib/tracker-store";
import { useUserPrefs } from "@/lib/user-prefs";
import { useNow } from "@/lib/tracker-store";
import { zonedDate } from "@/lib/routine-reminders";
import { displayWeight } from "@/lib/health";
import { calendarZone, validDay } from "@/lib/day-plan";
import { Button } from "@/components/ui/button";
import DaySelector from "./DaySelector";
import CaptureWorkspace from "./CaptureWorkspace";
import HealthConnections from "@/components/health/HealthConnections";
export default function HealthWorkspace() {
  const params = useSearchParams(),
    router = useRouter();
  const { prefs: calendarPrefs } = useUserPrefs();
  const now = useNow(30000);
  const today = zonedDate(now, calendarZone(calendarPrefs.timeZone));
  const date = validDay(params.get("date")) ? params.get("date")! : today;
  const view = params.get("view") ?? "today";
  const { data: d, prefs } = usePersonalProgress(
    view === "history" ? 30 : 1,
    date,
  );
  const modules = usePersonalModules();
  const water = useSyncedStorage<Record<string, number>>("fasting:water", {});
  const fasting = useFasting(),
    fastingHistory = useFastingHistory();
  const [fastMessage, setFastMessage] = useState("");
  const [undo, setUndo] = useState<string | null>(null);
  const back = `/health?date=${date}`;
  const add = (type: string) =>
    `/log?type=${type}&date=${date}&returnTo=${encodeURIComponent(back)}`;
  return (
    <div className="daily-workspace">
      <div className="workspace-heading">
        <DaySelector
          date={date}
          today={today}
          onChange={(day) => router.replace(`/health?view=${view}&date=${day}`)}
        />
        <Link href="/routine">Manage reminders →</Link>
      </div>
      {fasting.value.startedAt !== null && (
        <section className="workspace-panel">
          <h2>Active fasting timer</h2>
          <p>
            Started {new Date(fasting.value.startedAt).toLocaleString()}. Finish
            this saved timer before using meal windows.
          </p>
          <Button
            onClick={() => {
              const end = Date.now();
              const start = fasting.value.startedAt;
              if (start === null) return;
              fastingHistory.setValue((p) => [
                ...p,
                {
                  id: crypto.randomUUID(),
                  start,
                  end,
                  protocolId: fasting.value.protocolId,
                  source: "timer",
                },
              ]);
              fasting.setValue((p) => ({ ...p, startedAt: null }));
              setFastMessage("Fast ended and saved to history");
            }}
          >
            End Fast Window
          </Button>
        </section>
      )}
      {fastMessage && <p role="status">{fastMessage}</p>}
      <nav className="workspace-views" aria-label="Health views">
        {[
          ["today", "Today"],
          ["history", "History"],
          ["recovery", "Sleep & recovery"],
          ["connections", "Connections"],
        ].map(([id, label]) => (
          <Link
            key={id}
            aria-current={view === id ? "page" : undefined}
            href={`/health?view=${id}&date=${date}`}
          >
            {label}
          </Link>
        ))}
        {modules.value.fasting && (
          <Link href="/intermittent-fasting">Eating window</Link>
        )}
      </nav>
      {view === "connections" ? (
        <HealthConnections date={date} />
      ) : view === "recovery" ? (
        <CaptureWorkspace
          key={date}
          initialType="sleep"
          initialDate={date}
          returnTo={back}
        />
      ) : view === "history" ? (
        <section className="workspace-panel">
          <h2>Recorded days</h2>
          <p className="workspace-empty">
            Last 30 days through {date}. Missing records are unrecorded.
          </p>
          {d.days
            .filter(
              (day) =>
                day.foodCount ||
                day.exercise ||
                day.weight !== null ||
                day.water !== null ||
                day.sleep !== null,
            )
            .reverse()
            .map((day) => (
              <Link
                className="history-row"
                key={day.date}
                href={`/health?date=${day.date}`}
              >
                <strong>{day.date}</strong>
                <span>
                  {day.foodCount} foods · {day.exercise ?? 0} exercises
                  {day.weight !== null
                    ? ` · ${displayWeight(day.weight, prefs.weightUnit)}`
                    : ""}
                  {day.sleep !== null ? ` · ${day.sleep}h sleep` : ""}
                </span>
              </Link>
            ))}
        </section>
      ) : (
        <>
          <section className="workspace-panel">
            <h2>Health records · {date}</h2>
            <ul className="health-record-list">
              {modules.value.food && (
                <li>
                  <span>
                    <strong>Food</strong>
                    <small>
                      {d.foodCount
                        ? `${d.foodCount} entries · ${d.nutrients.energy.total === null ? "Calories unavailable" : Math.round(d.nutrients.energy.total) + " known kcal"}`
                        : "No food logged"}
                    </small>
                  </span>
                  <div className="health-record-actions">
                    <Link className="inline-action" href={add("food")}>
                      Add food
                    </Link>
                    <Link href={`/food?date=${date}`}>Open diary →</Link>
                  </div>
                </li>
              )}
              {modules.value.movement && (
                <li>
                  <span>
                    <strong>Exercise</strong>
                    <small>
                      {d.exerciseCount
                        ? `${d.exerciseCount} exercises · ${d.setCount} sets`
                        : "No exercise logged"}
                    </small>
                  </span>
                  <div className="health-record-actions">
                    <Link className="inline-action" href={add("exercise")}>
                      Record exercise
                    </Link>
                    <Link href={`/workout-tracking?date=${date}`}>
                      Open session →
                    </Link>
                  </div>
                </li>
              )}
              <li>
                <span>
                  <strong>Body</strong>
                  <small>
                    {d.latestWeight
                      ? displayWeight(d.latestWeight.value, prefs.weightUnit)
                      : "No weigh-in for this date"}
                  </small>
                </span>
                <div className="health-record-actions">
                  <Link className="inline-action" href={add("weight")}>
                    Weigh in
                  </Link>
                  <Link href={`/weight-loss?date=${date}`}>
                    Weight history →
                  </Link>
                </div>
              </li>
              <li>
                <span>
                  <strong>Sleep</strong>
                  <small>
                    {d.sleepAverage === null
                      ? "No sleep recorded"
                      : `${d.sleepAverage} hours recorded`}
                  </small>
                </span>
                <Link
                  className="inline-action"
                  href={`/health?view=recovery&date=${date}`}
                >
                  {d.sleepAverage === null ? "Record sleep" : "Edit sleep"} →
                </Link>
              </li>
              <li>
                <span>
                  <strong>Water</strong>
                  <small>{water.value[date] ?? 0} glasses recorded</small>
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      water.setValue((p) => ({
                        ...p,
                        [date]: (p[date] ?? 0) + 1,
                      }));
                      setUndo(date);
                    }}
                  >
                    Water +1
                  </Button>
                  {undo === date && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        water.setValue((p) => ({
                          ...p,
                          [date]: Math.max(0, (p[date] ?? 0) - 1),
                        }));
                        setUndo(null);
                      }}
                    >
                      Undo water
                    </Button>
                  )}
                </div>
              </li>
            </ul>
          </section>
          <Link className="capture-return" href="/dashboard?view=health">
            Explore health trends →
          </Link>
        </>
      )}
    </div>
  );
}
