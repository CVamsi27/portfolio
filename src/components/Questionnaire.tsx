"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Segmented from "@/components/trackers/Segmented";
import {
  useUserPrefs,
  GOAL_CATEGORIES,
  WORKOUT_SPLITS,
  MOTIVATION_STYLES,
  DEFAULT_GOAL_METRICS,
  type GoalCategory,
  type WorkoutSplit,
  type MotivationStyle,
} from "@/lib/user-prefs";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const STEPS = ["Welcome", "Goal", "Workout", "Fasting", "Motivation"] as const;

export default function Questionnaire({ onComplete }: { onComplete: () => void }) {
  const { prefs, setPrefs } = useUserPrefs();
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState({
    name: prefs.name,
    goalCategory: prefs.goalCategory as GoalCategory,
    goalTitle: prefs.goalTitle,
    dailyMetricLabel: prefs.dailyMetricLabel,
    dailyMetricTarget: prefs.dailyMetricTarget,
    workoutDaysPerWeek: prefs.workoutDaysPerWeek,
    workoutSplit: prefs.workoutSplit as WorkoutSplit,
    weightUnit: prefs.weightUnit,
    fastingEnabled: prefs.fastingEnabled,
    fastingProtocolId: prefs.fastingProtocolId,
    motivationStyle: prefs.motivationStyle as MotivationStyle,
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    setPrefs({ ...local, questionnaireDone: true } as any);
    onComplete();
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-lg overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
        {/* progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <CardContent className="p-6 sm:p-8">
          {/* step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <p className="dossier-kicker">Personal Suite // Onboarding chapter</p>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 shadow-lg shadow-primary/25">
                <Sparkles className="h-8 w-8 text-white" />
              </span>
              <h1 className="font-display text-2xl font-bold">Welcome to your Trackers</h1>
              <p className="text-sm text-muted-foreground">
                Let&apos;s personalize your experience. This takes 30 seconds.
              </p>
              <div>
                <label className="text-sm font-medium">What should we call you?</label>
                <Input
                  className="mt-2 text-center"
                  placeholder="Your name"
                  value={local.name}
                  onChange={(e) => setLocal({ ...local, name: e.target.value })}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* step 1: Goal */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="font-display text-xl font-bold">What&apos;s your main goal?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Pick the category that fits best.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_CATEGORIES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setLocal({ ...local, goalCategory: g.id })}
                    className={`rounded-xl border p-3 text-left text-sm transition-all ${
                      local.goalCategory === g.id
                        ? "border-primary bg-primary/10 font-semibold shadow-sm"
                        : "border-border/60 hover:bg-accent"
                    }`}
                  >
                    <span className="text-xl">{g.icon}</span>
                    <p className="mt-1 font-medium">{g.label}</p>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium">Goal title (optional)</label>
                <Input
                  className="mt-1"
                  placeholder={
                    local.goalCategory === "relocation"
                      ? "e.g. Relocate to Berlin"
                      : local.goalCategory === "fitness"
                        ? "e.g. Run a half marathon"
                        : "e.g. Get promoted to senior"
                  }
                  value={local.goalTitle}
                  onChange={(e) => setLocal({ ...local, goalTitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Daily metric</label>
                  <Input
                    className="mt-1"
                    placeholder={DEFAULT_GOAL_METRICS[local.goalCategory]?.label}
                    value={local.dailyMetricLabel ?? ""}
                    onChange={(e) => setLocal({ ...local, dailyMetricLabel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Daily target</label>
                  <Input
                    className="mt-1 tabular-nums"
                    type="number"
                    min={1}
                    placeholder={String(DEFAULT_GOAL_METRICS[local.goalCategory]?.target ?? 3)}
                    value={local.dailyMetricTarget ?? ""}
                    onChange={(e) =>
                      setLocal({ ...local, dailyMetricTarget: e.target.value === "" ? undefined : Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* step 2: Workout */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="font-display text-xl font-bold">Workout preferences</h2>
                <p className="mt-1 text-sm text-muted-foreground">How do you like to train?</p>
              </div>
              <div>
                <label className="text-sm font-medium">Days per week</label>
                <div className="mt-2 flex gap-2">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      onClick={() => setLocal({ ...local, workoutDaysPerWeek: d })}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
                        local.workoutDaysPerWeek === d
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border/60 hover:bg-accent"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Training split</label>
                <div className="mt-2">
                  <Segmented
                    label="Workout split"
                    options={WORKOUT_SPLITS.map((s) => ({ value: s.id, label: s.label }))}
                    value={local.workoutSplit}
                    onChange={(v) => setLocal({ ...local, workoutSplit: v as WorkoutSplit })}
                  />
                </div>
                {local.workoutSplit === "custom" && (
                  <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    Custom split: you&apos;ll build named day tabs (e.g. &ldquo;Day A&rdquo;, &ldquo;Arms&rdquo;) on the workout page.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Weight unit</label>
                <div className="mt-2">
                  <Segmented
                    label="Weight unit"
                    options={[
                      { value: "kg", label: "Kilograms (kg)" },
                      { value: "lbs", label: "Pounds (lbs)" },
                    ]}
                    value={local.weightUnit}
                    onChange={(v) => setLocal({ ...local, weightUnit: v as "kg" | "lbs" })}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Toggle anytime on the workout page — history is stored in kg and converts automatically.
                </p>
              </div>
            </div>
          )}

          {/* step 3: Fasting */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="font-display text-xl font-bold">Intermittent Fasting</h2>
                <p className="mt-1 text-sm text-muted-foreground">Do you practice intermittent fasting?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setLocal({ ...local, fastingEnabled: true })}
                  className={`flex-1 rounded-xl border p-4 text-center transition-all ${
                    local.fastingEnabled
                      ? "border-primary bg-primary/10 font-semibold shadow-sm"
                      : "border-border/60 hover:bg-accent"
                  }`}
                >
                  <span className="text-2xl">Yes</span>
                  <p className="mt-1 text-xs text-muted-foreground">Track my fasting windows</p>
                </button>
                <button
                  onClick={() => setLocal({ ...local, fastingEnabled: false })}
                  className={`flex-1 rounded-xl border p-4 text-center transition-all ${
                    !local.fastingEnabled
                      ? "border-primary bg-primary/10 font-semibold shadow-sm"
                      : "border-border/60 hover:bg-accent"
                  }`}
                >
                  <span className="text-2xl">No</span>
                  <p className="mt-1 text-xs text-muted-foreground">Skip fasting tracker</p>
                </button>
              </div>
              {local.fastingEnabled && (
                <div>
                  <label className="text-sm font-medium">Preferred protocol</label>
                  <div className="mt-2">
                    <Segmented
                      label="Fasting protocol"
                      options={[
                        { value: "14-10", label: "14:10" },
                        { value: "16-8", label: "16:8" },
                        { value: "18-6", label: "18:6" },
                        { value: "20-4", label: "20:4" },
                      ]}
                      value={local.fastingProtocolId}
                      onChange={(v) => setLocal({ ...local, fastingProtocolId: v })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* step 4: Motivation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="font-display text-xl font-bold">What drives you?</h2>
                <p className="mt-1 text-sm text-muted-foreground">We&apos;ll tailor your daily quotes.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MOTIVATION_STYLES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setLocal({ ...local, motivationStyle: m.id })}
                    className={`rounded-xl border p-3 text-left text-sm transition-all ${
                      local.motivationStyle === m.id
                        ? "border-primary bg-primary/10 font-semibold shadow-sm"
                        : "border-border/60 hover:bg-accent"
                    }`}
                  >
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* navigation */}
          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={prev}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={next}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Get started
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
