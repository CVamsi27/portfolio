"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { getSupabase } from "@/lib/supabase/client";
import { readDraft, writeDraft, deleteDraft } from "@/lib/nutrition-drafts";
import { mealEntries, type MealDraft } from "@/lib/nutrition-meals";
import { convertRecipePortion, type RichRecipe } from "@/lib/nutrition-recipes";
import {
  displayNutrient,
  nutrientTotals,
  scaleNutrients,
  validFood,
  NUTRIENTS,
  MEALS,
  type Food,
  type FoodEntry,
  type Nutrients,
} from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/trackers/Modal";
import NutrientFields from "./NutrientFields";

type Props = {
  open: boolean;
  onClose: () => void;
  date: string;
  meal?: string;
  foods: Food[];
  onSave: (entries: Record<string, FoodEntry>, date: string) => void;
};
export default function MealComposer({
  open,
  onClose,
  date,
  meal = "Lunch",
  foods,
  onSave,
}: Props) {
  const { user, configured } = useAuth();
  const scope = configured ? `account:${user?.id ?? "signed-out"}` : "local";
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [source, setSource] = useState<"library" | "database" | "quick">(
    "library",
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: number; name: string; brand?: string; type?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const writes = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);
  const latestWrite = useRef(0);
  const requestId = useRef(0);
  useEffect(() => {
    if (!open) return;
    const current = ++generation.current;
    setReady(false);
    setError("");
    setSource("library");
    readDraft(scope)
      .then((saved) => {
        if (current !== generation.current) return;
        setDraft(
          saved ?? {
            id: crypto.randomUUID(),
            date,
            meal,
            items: [],
            updatedAt: Date.now(),
          },
        );
        setStatus(saved ? "Restored draft" : "Draft ready");
        setReady(true);
      })
      .catch((e) => {
        if (current === generation.current) {
          setError(e.message);
          setReady(true);
          setDraft(null);
        }
      });
    return () => {
      // These are numeric cancellation tokens, not refs to DOM nodes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++;
    };
    // Date and meal are seeds only: changes in the surrounding page must not replace an open/restored draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope]);
  useEffect(() => {
    if (!open || !ready || !draft) return;
    const current = generation.current;
    latestWrite.current = draft.updatedAt;
    setStatus("Saving draft…");
    writes.current = writes.current
      .catch(() => undefined)
      .then(() => writeDraft(scope, draft));
    void writes.current
      .then(() => {
        if (
          current === generation.current &&
          latestWrite.current === draft.updatedAt
        )
          setStatus("Draft saved on this device");
      })
      .catch((e) => {
        if (
          current === generation.current &&
          latestWrite.current === draft.updatedAt
        ) {
          setStatus("Draft not saved");
          setError(e.message);
        }
      });
  }, [draft, open, ready, scope]);
  const update = (change: (d: MealDraft) => MealDraft) =>
    setDraft((d) =>
      d
        ? { ...change(d), updatedAt: Math.max(Date.now(), d.updatedAt + 1) }
        : d,
    );
  const add = (food: Food, quantity?: number) => {
    if (!validFood(food)) {
      setError("This food has invalid nutrient or portion data.");
      return;
    }
    update((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          id: crypto.randomUUID(),
          food: structuredClone(food),
          quantity:
            quantity ??
            ("ingredients" in food && food.basisUnit === "serving"
              ? 1
              : food.basisAmount),
        },
      ],
    }));
    setError("");
  };
  const request = async (path: string) => {
    const session = await getSupabase()?.auth.getSession();
    const response = await fetch(path, {
      headers: session?.data.session
        ? { Authorization: `Bearer ${session.data.session.access_token}` }
        : {},
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error ?? "Food database unavailable.");
    return result;
  };
  const search = async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await request(
        `/api/nutrition/search?q=${encodeURIComponent(query.trim())}`,
      );
      if (current === requestId.current) {
        setResults(result.foods);
        if (!result.foods.length)
          setError("No matching foods. Try another name or use Quick add.");
      }
    } catch (e) {
      if (current === requestId.current)
        setError(e instanceof Error ? e.message : "Search unavailable.");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  };
  const load = async (id: number) => {
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await request(`/api/nutrition/food/${id}`);
      if (current === requestId.current) add(result.food);
    } catch (e) {
      if (current === requestId.current)
        setError(e instanceof Error ? e.message : "Food unavailable.");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  };
  const quickAdd = () => {
    const nutrients: Nutrients = Object.fromEntries(
      Object.keys(NUTRIENTS).map((key) => [
        key,
        values[key]?.trim() ? Number(values[key]) : null,
      ]),
    );
    const food: Food = {
      id: crypto.randomUUID(),
      name: name.trim(),
      basisAmount: 1,
      basisUnit: "serving",
      nutrients,
      source: "User-entered portion estimate",
      updatedAt: Date.now(),
    };
    if (!validFood(food)) {
      setError(
        "Enter a food name and non-negative known nutrients. Leave unknowns blank.",
      );
      return;
    }
    add(food, 1);
    setName("");
    setValues({});
    setSource("library");
  };
  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    try {
      const entries = mealEntries(draft, draft.updatedAt);
      await writes.current;
      if (configured && !user) throw Error("Sign in before saving a meal.");
      onSave(entries, draft.date);
      await deleteDraft(scope);
      setDraft(null);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Meal was not saved. Your draft is retained.",
      );
    } finally {
      setSaving(false);
    }
  };
  const discard = async () => {
    if (
      !window.confirm("Discard this meal draft? Logged meals remain unchanged.")
    )
      return;
    try {
      await writes.current;
      await deleteDraft(scope);
      setDraft(null);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Draft could not be discarded.",
      );
    }
  };
  const totals = nutrientTotals(
    (draft?.items ?? []).flatMap((item) => {
      try {
        return [
          scaleNutrients(
            item.food.nutrients,
            item.quantity,
            item.food.basisAmount,
          ),
        ];
      } catch {
        return [];
      }
    }),
  );
  const matching = foods
    .filter(
      (f) => !f.deleted && f.name.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 30);
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Log meal"
      className="max-w-3xl"
      footer={
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="ghost" disabled={saving} onClick={discard}>
            Discard draft
          </Button>
          <Button
            disabled={!ready || saving || !draft?.items.length}
            onClick={save}
          >
            {saving ? "Saving…" : "Save meal"}
          </Button>
        </div>
      }
    >
      {!ready ? (
        <p>Loading meal draft…</p>
      ) : !draft ? (
        <p role="alert">
          {error || "Draft storage is unavailable. Close and try again."}
        </p>
      ) : (
        draft && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="field-label">
                Meal date
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(e) =>
                    update((d) => ({ ...d, date: e.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Meal
                <select
                  aria-label="Meal"
                  className="w-full rounded-lg border border-border bg-background p-3"
                  value={draft.meal}
                  onChange={(e) =>
                    update((d) => ({ ...d, meal: e.target.value }))
                  }
                >
                  {Array.from(new Set([...MEALS, draft.meal])).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </div>
            <section
              aria-label="Meal draft"
              className="rounded-xl border border-border bg-background/40 p-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Your meal · {draft.items.length} foods
                </h3>
                <span className="text-sm">
                  {displayNutrient(totals.values.energy)} known kcal
                </span>
              </div>
              {!draft.items.length && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Add foods below, review portions, then save the whole meal.
                </p>
              )}
              {draft.items.map((item) => (
                <div key={item.id} className="mt-3 border-t border-border pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <strong className="break-words text-sm">
                        {item.food.name}
                      </strong>
                      <p className="text-xs text-muted-foreground">
                        {item.food.source}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      aria-label={`Remove ${item.food.name}`}
                      onClick={() =>
                        update((d) => ({
                          ...d,
                          items: d.items.filter((i) => i.id !== item.id),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <label className="field-label">
                    Quantity ({item.food.basisUnit})
                    <Input
                      aria-label={`Quantity for ${item.food.name}`}
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        update((d) => ({
                          ...d,
                          items: d.items.map((i) =>
                            i.id === item.id
                              ? { ...i, quantity: Number(e.target.value) }
                              : i,
                          ),
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
            </section>
            <nav className="workspace-views" aria-label="Add food source">
              {[
                ["library", "Recent & saved"],
                ["database", "Search database"],
                ["quick", "Quick add"],
              ].map(([id, label]) => (
                <Button
                  key={id}
                  variant="ghost"
                  aria-pressed={source === id}
                  onClick={() => {
                    setSource(id as typeof source);
                    setError("");
                  }}
                >
                  {label}
                </Button>
              ))}
            </nav>
            {source === "library" && (
              <div className="space-y-2">
                <Input
                  aria-label="Search saved foods"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a food or recipe"
                />
                {matching.map((food) => (
                  <div
                    key={food.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">
                        {food.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {food.basisAmount} {food.basisUnit} · {food.source}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        aria-label={`Add ${food.name}`}
                        onClick={() => add(food)}
                      >
                        Add
                      </Button>
                      {"ingredients" in food &&
                        (food as RichRecipe).cookedWeightGrams && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              try {
                                add(
                                  convertRecipePortion(
                                    food as RichRecipe,
                                    100,
                                    "g",
                                  ),
                                  100,
                                );
                              } catch (e) {
                                setError((e as Error).message);
                              }
                            }}
                          >
                            Add 100 g cooked
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
                {!matching.length && (
                  <p className="text-sm text-muted-foreground">
                    No matching saved foods. Search the database or use Quick
                    add.
                  </p>
                )}
              </div>
            )}
            {source === "database" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    aria-label="Food database search"
                    placeholder="Food or brand"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button onClick={search} disabled={loading || !query.trim()}>
                    {loading ? "Loading…" : "Search foods"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  USDA FoodData Central · review preparation and portions. Your
                  draft remains available if search is offline.
                </p>
                {results.map((r) => (
                  <Button
                    className="h-auto whitespace-normal text-left"
                    key={r.id}
                    variant="outline"
                    disabled={loading}
                    onClick={() => load(r.id)}
                  >
                    {r.name} · {r.brand ?? r.type}
                  </Button>
                ))}
              </div>
            )}
            {source === "quick" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter the values for one portion. You can adjust its quantity
                  after adding it.
                </p>
                <label className="field-label">
                  Food name
                  <Input
                    value={name}
                    maxLength={300}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <NutrientFields values={values} onChange={setValues} />
                <Button onClick={quickAdd}>Add to meal</Button>
              </div>
            )}
            <label className="field-label">
              Meal note (optional)
              <Input
                value={draft.note ?? ""}
                maxLength={1000}
                onChange={(e) =>
                  update((d) => ({ ...d, note: e.target.value }))
                }
              />
            </label>
            <p role="status" className="text-xs text-muted-foreground">
              {status}
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )
      )}
    </Modal>
  );
}
