"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/trackers/Modal";
import { useNutrition } from "@/lib/nutrition-store";
import {
  foodDateKey,
  displayNutrient,
  MEALS,
  NUTRIENTS,
  scaleNutrients,
  validNutrients,
  validEntry,
  validFood,
  nutrientTotals,
  type Food,
  type FoodEntry,
  type NutrientKey,
  type Nutrients,
  type Recipe,
  type Unit,
} from "@/lib/nutrition";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import CatalogSearch from "./CatalogSearch";
import MealLibrary from "./MealLibrary";
import { correctBatchBasis } from "@/lib/nutrition-reuse";
import NutrientFields from "./NutrientFields";
import { mergeMealEntries } from "@/lib/nutrition-meals";
import NutritionDailySummary from "./NutritionDailySummary";
import MealComposer from "./MealComposer";
import RecipeBuilder from "./RecipeBuilder";
import NutritionStrategy from "./NutritionStrategy";
import NutritionDayQuality from "./NutritionDayQuality";
import NutritionInsights from "./NutritionInsights";

const blank = {
  name: "",
  basisAmount: "100",
  basisUnit: "g" as Unit,
  quantity: "100",
  source: "User-entered",
};
export default function FoodTracker() {
  const store = useNutrition();
  const [foodView, setFoodView] = useState("diary");
  const saving = useRef(false);
  const loadedFood = useRef<Food | null>(null);
  const [copyDate, setCopyDate] = useState(() => foodDateKey());
  const [recipeEditing, setRecipeEditing] = useState<Recipe | null>(null);
  const [date, updateDate] = useState(() => foodDateKey());
  const setDate = (day: string) => {
    updateDate(day);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    const query = new URLSearchParams(window.location.search);
    query.set("date", day);
    window.history.replaceState(null, "", `/food?${query}`);
  };
  const [entryDate, setEntryDate] = useState(() => foodDateKey());
  const [meal, setMeal] = useState<string>("Lunch");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [values, setValues] = useState<Record<string, string>>({});
  const [ingredientOnly, setIngredientOnly] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [foodId, setFoodId] = useState<string | null>(null);
  const [reuse, setReuse] = useState(true);
  const [entryNote, setEntryNote] = useState("");
  const [unitMessage, setUnitMessage] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<FoodEntry | null>(null);

  const [recipeOpen, setRecipeOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("meal");
    const view = params.get("view");
    if (
      view &&
      ["diary", "saved", "nutrients", "strategy", "insights"].includes(view)
    )
      setFoodView(view);
    const day = params.get("date");
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      setDate(day);
      setEntryDate(day);
    }
    if (selected) {
      setMeal(selected === "Snacks" ? "Snack" : selected);
      setOpen(true);
    }
  }, []);
  const syncStates = Object.values(store).map(
    (collection) => collection.status,
  );
  const syncStatus = syncStates.includes("error")
    ? "error"
    : syncStates.includes("syncing")
      ? "syncing"
      : syncStates.every((status) => status === "synced")
        ? "synced"
        : "local-only";
  const entries = Object.values(store.entries.value ?? {}).filter(
    (entry) =>
      validEntry(entry) &&
      !entry.deleted &&
      !entry.planned &&
      entry.date === date,
  );
  const recent = Object.fromEntries(
    Object.values(store.entries.value ?? {})
      .filter((item) => validEntry(item) && !item.deleted && !item.planned)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 20)
      .map((item) => [item.foodId, { ...item, id: item.foodId }]),
  );
  const foods = Object.values({
    ...recent,
    ...store.foods.value,
    ...store.recipes.value,
  })
    .filter((food) => validFood(food) && !food.deleted)
    .sort((a, b) => Number(b.favorite ?? false) - Number(a.favorite ?? false));
  const getValues = (): Nutrients =>
    Object.fromEntries(
      Object.entries(NUTRIENTS).map(([key]) => [
        key,
        values[key]?.trim() ? Number(values[key]) : null,
      ]),
    );
  let preview: Nutrients = {};
  try {
    preview = scaleNutrients(
      getValues(),
      Number(draft.quantity),
      Number(draft.basisAmount),
    );
  } catch {
    /* Validation is shown on save. */
  }
  const load = (food: Food, entry?: FoodEntry) => {
    loadedFood.current = food;
    setIngredientOnly(false);
    setEditingFood(null);
    setUnitMessage("");
    setEntryDate(entry?.date ?? date);
    setEntryNote(entry?.note ?? "");
    setDraft({
      name: food.name,
      basisAmount: String(food.basisAmount),
      basisUnit: food.basisUnit,
      quantity: String(
        entry?.quantity ??
          ("ingredients" in food && food.basisUnit === "serving"
            ? 1
            : food.basisAmount),
      ),
      source: food.source,
    });
    setValues(
      Object.fromEntries(
        Object.entries(food.nutrients).map(([key, value]) => [
          key,
          value == null ? "" : String(value),
        ]),
      ),
    );
    setFoodId(entry?.foodId ?? food.id);
    setEditing(entry ?? null);
    setMeal(entry?.meal ?? meal);
    setError("");
    setOpen(true);
  };
  const start = () => {
    loadedFood.current = null;
    setIngredientOnly(false);
    setEditingFood(null);
    setUnitMessage("");
    setEntryDate(date);
    setEntryNote("");
    setDraft(blank);
    setValues({});
    setFoodId(null);
    setEditing(null);
    setError("");
    setOpen(true);
  };
  const save = () => {
    if (saving.current) return;
    const nutrients = getValues();
    const basis = Number(draft.basisAmount);
    const quantity = Number(draft.quantity);
    if (
      (!ingredientOnly && !editingFood && !meal.trim()) ||
      !draft.name.trim() ||
      !validNutrients(nutrients) ||
      !Number.isFinite(basis) ||
      basis <= 0 ||
      (!ingredientOnly &&
        !editingFood &&
        (!Number.isFinite(quantity) || quantity <= 0)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)
    ) {
      setError(
        "Enter a food name, a valid date, positive portions and non-negative nutrient values. Leave unknown nutrients blank.",
      );
      return;
    }
    const stamp = Math.max(Date.now(), (editing?.updatedAt ?? 0) + 1);
    const id = editing?.id ?? crypto.randomUUID();
    const fid = foodId ?? crypto.randomUUID();
    const food: Food = {
      ...(editingFood ?? {}),
      favorite: store.foods.value[fid]?.favorite,
      portions:
        (editingFood ?? loadedFood.current)?.basisUnit === draft.basisUnit
          ? (editingFood ?? loadedFood.current)?.portions
          : undefined,
      id: fid,
      name: draft.name.trim(),
      basisAmount: basis,
      basisUnit: draft.basisUnit,
      nutrients,
      source: draft.source,
      updatedAt: stamp,
    };
    if (editingFood || ingredientOnly) {
      try {
        store.foods.setValue((previous) => ({
          ...previous,
          [fid]: {
            ...food,
            updatedAt: Math.max(stamp, (editingFood?.updatedAt ?? 0) + 1),
          },
        }));
        setOpen(false);
        setIngredientOnly(false);
        setMessage(
          editingFood
            ? "Saved food updated. Historical meals remain unchanged."
            : "Ingredient saved. No meal was logged.",
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Food was not saved.");
      }
      return;
    }
    let batchBasis = {};
    try {
      if (editing)
        batchBasis = correctBatchBasis(
          editing,
          basis,
          draft.basisUnit,
          editing.batchId ? store.batches.value[editing.batchId] : undefined,
        );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Batch portion was not corrected.",
      );
      return;
    }
    const entry: FoodEntry = {
      ...editing,
      ...food,
      ...batchBasis,
      id,
      foodId: fid,
      date: entryDate,
      meal: meal.trim(),
      note: entryNote.trim() || undefined,
      quantity,
    };
    if (!validEntry(entry)) {
      setError("Choose a valid calendar date and portion.");
      return;
    }
    saving.current = true;
    try {
      if (reuse && !editing && !store.recipes.value[fid])
        store.foods.setValue((previous) => ({ ...previous, [fid]: food }));
      store.entries.setValue((previous) => ({ ...previous, [id]: entry }));
      setOpen(false);
      setDate(entryDate);
      setMessage(
        editing ? "Food entry updated locally." : "Food entry saved locally.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Food was not saved.");
    } finally {
      saving.current = false;
    }
  };
  const remove = (entry: FoodEntry) => {
    store.entries.setValue((previous) => ({
      ...previous,
      [entry.id]: {
        ...entry,
        deleted: true,
        updatedAt: Math.max(Date.now(), entry.updatedAt + 1),
      },
    }));
    setRemoved(entry);
    setMessage("Food entry removed.");
  };
  const undo = () => {
    if (!removed) return;
    store.entries.setValue((previous) => ({
      ...previous,
      [removed.id]: {
        ...removed,
        deleted: false,
        updatedAt: Math.max(
          Date.now(),
          (previous[removed.id]?.updatedAt ?? 0) + 1,
        ),
      },
    }));
    setRemoved(null);
    setMessage("Food entry restored.");
  };
  return (
    <div className="space-y-5">
      <nav className="workspace-views" aria-label="Food views">
        {[
          ["diary", "Diary"],
          ["saved", "Saved foods & recipes"],
          ["nutrients", "Nutrients"],
          ["strategy", "Strategy"],
          ["insights", "Progress"],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant={foodView === id ? "default" : "ghost"}
            aria-pressed={foodView === id}
            onClick={() => {
              setFoodView(id);
              const q = new URLSearchParams(window.location.search);
              q.set("view", id);
              q.set("date", date);
              window.history.replaceState(null, "", `/food?${q}`);
            }}
          >
            {label}
          </Button>
        ))}
      </nav>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="food-date" className="text-sm font-medium">
            Record date
          </label>
          <Input
            id="food-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          aria-label="Previous food date"
          onClick={() => {
            const day = new Date(`${date}T12:00:00Z`);
            if (!Number.isFinite(day.getTime())) return;
            day.setUTCDate(day.getUTCDate() - 1);
            setDate(day.toISOString().slice(0, 10));
          }}
        >
          ←
        </Button>
        <Button
          variant="ghost"
          aria-label="Next food date"
          onClick={() => {
            const day = new Date(`${date}T12:00:00Z`);
            if (!Number.isFinite(day.getTime())) return;
            day.setUTCDate(day.getUTCDate() + 1);
            setDate(day.toISOString().slice(0, 10));
          }}
        >
          →
        </Button>
        <Button onClick={() => setMealOpen(true)}>Log meal</Button>
        <Button variant="outline" onClick={start}>
          Log food
        </Button>
        {foodView === "saved" && (
          <Button
            variant="outline"
            onClick={() => {
              start();
              setIngredientOnly(true);
            }}
          >
            Add saved food
          </Button>
        )}
        {foodView === "saved" && (
          <Button
            variant="outline"
            onClick={() => {
              setRecipeEditing(null);
              setError("");
              setRecipeOpen(true);
            }}
          >
            Create recipe
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {syncStatus === "synced"
          ? "Synced"
          : syncStatus === "syncing"
            ? "Syncing…"
            : syncStatus === "error"
              ? "Saved locally · sync needs retry on reconnect"
              : "Saved on this device"}
      </p>
      {message && (
        <p role="status" className="text-sm">
          {message}{" "}
          {removed && (
            <Button variant="ghost" onClick={undo}>
              Undo removal
            </Button>
          )}
        </p>
      )}
      {foodView === "diary" && entries.length > 0 && (
        <details>
          <summary>Repeat a meal on another date</summary>
          <label className="block text-sm">
            Duplicate entries to date
            <Input
              type="date"
              value={copyDate}
              onChange={(e) => setCopyDate(e.target.value)}
            />
          </label>
        </details>
      )}
      {(foodView === "diary" || foodView === "nutrients") && (
        <NutritionDailySummary
          date={date}
          programs={store.programs.value}
          entries={entries}
          targets={store.targets.value}
          details={foodView === "nutrients"}
        />
      )}
      {foodView === "saved" && (
        <MealLibrary
          date={date}
          entries={Object.values(store.entries.value)}
          templates={store.templates.value}
          batches={store.batches.value}
          recipes={Object.values(store.recipes.value).filter(
            (recipe) => !recipe.deleted && validFood(recipe),
          )}
          enabled={
            !isSupabaseConfigured() ||
            process.env.NEXT_PUBLIC_NUTRITION_REUSE_ENABLED === "true"
          }
          onTemplatesChange={store.templates.setValue}
          onBatchesChange={store.batches.setValue}
          onLog={(items) => {
            store.entries.setValue((previous) =>
              mergeMealEntries(previous, items),
            );
            setMessage("Consumed meal saved locally.");
          }}
        />
      )}
      {foodView === "strategy" && <NutritionStrategy date={date} />}
      {foodView === "insights" && (
        <NutritionInsights
          date={date}
          entries={Object.values(store.entries.value)}
        />
      )}
      {foodView === "diary" && (
        <NutritionDayQuality
          date={date}
          entries={Object.values(store.entries.value)}
        />
      )}
      <div hidden={foodView !== "diary"} className="space-y-4">
        {Array.from(new Set([...MEALS, ...entries.map((entry) => entry.meal)]))
          .filter((group) => entries.some((entry) => entry.meal === group))
          .map((group) => {
            const items = entries.filter((entry) => entry.meal === group);
            return (
              <section
                key={group}
                className="rounded-xl border border-border bg-card p-4"
              >
                <h2 className="font-semibold">{group}</h2>
                {items.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Known subtotal:{" "}
                    {displayNutrient(
                      nutrientTotals(
                        items.map((item) =>
                          scaleNutrients(
                            item.nutrients,
                            item.quantity,
                            item.basisAmount,
                          ),
                        ),
                      ).values.energy,
                    )}{" "}
                    kcal
                  </p>
                )}
                {!items.length ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No entries yet.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {items.map((entry) => (
                      <li key={entry.id} className="py-3">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium break-words">
                              {entry.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.quantity} {entry.basisUnit} ·{" "}
                              {displayNutrient(
                                scaleNutrients(
                                  entry.nutrients,
                                  entry.quantity,
                                  entry.basisAmount,
                                ).energy,
                              )}{" "}
                              kcal
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="ghost"
                              onClick={() => load(entry, entry)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                load({ ...entry, id: entry.foodId });
                                setEditing(null);
                                setMeal(entry.meal);
                                setDraft((p) => ({
                                  ...p,
                                  quantity: String(entry.quantity),
                                }));
                                setEntryDate(copyDate);
                                setMessage(
                                  "Review the date and portion before saving the repeated food.",
                                );
                              }}
                            >
                              Duplicate
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => remove(entry)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
      </div>
      {foodView === "saved" &&
        Object.values(store.foods.value).some((item) => !item.deleted) && (
          <details className="rounded-xl border border-border bg-card p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">
              Saved foods
            </summary>
            {Object.values(store.foods.value)
              .filter((item) => !item.deleted)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="text-sm">{item.name}</span>
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        load(item);
                        setEditingFood(item);
                      }}
                    >
                      Edit saved food
                    </Button>
                    <Button
                      variant="ghost"
                      aria-pressed={item.favorite ?? false}
                      onClick={() =>
                        store.foods.setValue((previous) => ({
                          ...previous,
                          [item.id]: {
                            ...item,
                            favorite: !item.favorite,
                            updatedAt: Math.max(Date.now(), item.updatedAt + 1),
                          },
                        }))
                      }
                    >
                      {item.favorite ? "Unfavorite" : "Favorite"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        store.foods.setValue((previous) => ({
                          ...previous,
                          [item.id]: {
                            ...item,
                            deleted: true,
                            updatedAt: Math.max(Date.now(), item.updatedAt + 1),
                          },
                        }))
                      }
                    >
                      Remove saved food
                    </Button>
                  </div>
                </div>
              ))}
          </details>
        )}
      {foodView === "saved" &&
        Object.values(store.recipes.value).some((item) => !item.deleted) && (
          <details className="rounded-xl border border-border bg-card p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">
              Saved recipes
            </summary>
            {Object.values(store.recipes.value)
              .filter((item) => !item.deleted)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="text-sm">{item.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setRecipeEditing(item);
                        setError("");
                        setRecipeOpen(true);
                      }}
                    >
                      Edit recipe
                    </Button>
                    <Button variant="outline" onClick={() => load(item)}>
                      Log recipe
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        store.recipes.setValue((previous) => ({
                          ...previous,
                          [item.id]: {
                            ...item,
                            deleted: true,
                            updatedAt: Math.max(Date.now(), item.updatedAt + 1),
                          },
                        }))
                      }
                    >
                      Remove recipe
                    </Button>
                  </div>
                </div>
              ))}
          </details>
        )}
      <div hidden={foodView !== "nutrients"}>
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="flex min-h-11 items-center cursor-pointer font-medium">
            Nutrition targets (optional)
          </summary>
          <p className="text-sm text-muted-foreground mb-3">
            Use your own reference values or limits. Tracking works without
            targets.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(NUTRIENTS) as NutrientKey[]).map((key) => (
              <div key={key}>
                <label htmlFor={`target-${key}`} className="text-sm">
                  {NUTRIENTS[key].label} ({NUTRIENTS[key].unit})
                </label>
                <div className="flex gap-2">
                  <Input
                    id={`target-${key}`}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="No target"
                    value={
                      store.targets.value?.[key]?.deleted
                        ? ""
                        : (store.targets.value?.[key]?.amount ?? "")
                    }
                    onChange={(e) => {
                      const amount = Number(e.target.value);
                      if (!Number.isFinite(amount) || amount < 0) return;
                      store.targets.setValue((previous) => ({
                        ...previous,
                        [key]: {
                          id: key,
                          amount,
                          kind: previous[key]?.kind ?? "reference",
                          deleted: e.target.value === "",
                          updatedAt: Date.now(),
                        },
                      }));
                    }}
                  />
                  <select
                    aria-label={`${NUTRIENTS[key].label} target type`}
                    className="rounded-lg border border-border bg-background p-2 min-h-11"
                    value={store.targets.value?.[key]?.kind ?? "reference"}
                    onChange={(e) =>
                      store.targets.setValue((previous) => ({
                        ...previous,
                        [key]: {
                          id: key,
                          amount: previous[key]?.amount ?? 0,
                          deleted: previous[key]?.deleted ?? true,
                          kind: e.target.value as "reference" | "limit",
                          updatedAt: Date.now(),
                        },
                      }))
                    }
                  >
                    <option value="reference">Reference</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          ingredientOnly
            ? "Add saved food"
            : editingFood
              ? "Edit saved food"
              : editing
                ? "Edit food entry"
                : "Log food"
        }
        className="max-w-2xl"
        footer={
          <Button onClick={save}>
            {ingredientOnly
              ? "Save ingredient"
              : editingFood || editing
                ? "Save changes"
                : "Save food"}
          </Button>
        }
      >
        <div className="space-y-4">
          {!editingFood && !ingredientOnly && (
            <label className="text-sm">
              Entry date
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </label>
          )}
          {!editing && !ingredientOnly && (
            <>
              <label htmlFor="saved-food" className="text-sm font-medium">
                Saved foods and recipes
              </label>
              <select
                id="saved-food"
                className="w-full rounded-lg border border-border bg-background p-3"
                value={foodId ?? ""}
                onChange={(e) => {
                  const food = foods.find((item) => item.id === e.target.value);
                  if (food) load(food);
                }}
              >
                <option value="">Choose a saved food</option>
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} · {food.basisAmount} {food.basisUnit}
                  </option>
                ))}
              </select>
              <details>
                <summary className="flex min-h-11 items-center cursor-pointer text-sm font-medium">
                  Search food database
                </summary>
                <CatalogSearch
                  foods={foods}
                  onSelect={(food, quantity) => {
                    load(food);
                    if (quantity !== undefined)
                      setDraft((previous) => ({
                        ...previous,
                        quantity: String(quantity),
                      }));
                  }}
                />
              </details>
            </>
          )}
          <div>
            <label htmlFor="food-name" className="text-sm font-medium">
              Food name
            </label>
            <Input
              id="food-name"
              maxLength={300}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="food-basis">Nutrients per</label>
              <Input
                id="food-basis"
                type="number"
                min="0.01"
                step="any"
                value={draft.basisAmount}
                onChange={(e) =>
                  setDraft({ ...draft, basisAmount: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="food-unit">Portion unit</label>
              <select
                id="food-unit"
                className="w-full rounded-lg border border-border bg-background p-3"
                value={draft.basisUnit}
                onChange={(e) => {
                  const unit = e.target.value as Unit;
                  if (unit !== draft.basisUnit) {
                    setValues({});
                    setUnitMessage(
                      "Changing units clears nutrient values. Enter values for the new declared basis; NOVA does not assume a weight-to-volume conversion.",
                    );
                    setDraft({
                      ...draft,
                      basisUnit: unit,
                      basisAmount: unit === "serving" ? "1" : draft.basisAmount,
                      quantity: unit === "serving" ? "1" : draft.quantity,
                      source: "User-entered declared basis",
                    });
                  }
                }}
              >
                <option value="g">Grams</option>
                <option value="ml">Millilitres</option>
                <option value="serving">Declared serving</option>
              </select>
            </div>
            {!ingredientOnly && !editingFood && (
              <div>
                <label htmlFor="food-quantity">Consumed quantity</label>
                <Input
                  id="food-quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  value={draft.quantity}
                  onChange={(e) =>
                    setDraft({ ...draft, quantity: e.target.value })
                  }
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Use the label or source’s declared basis. A bowl or piece needs a
            defined serving; volume does not automatically equal weight.
          </p>
          {!ingredientOnly && !editingFood && (
            <div>
              <label htmlFor="food-meal">Meal</label>
              <Input
                id="food-meal"
                list="meal-options"
                maxLength={100}
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
              />
              <datalist id="meal-options">
                {MEALS.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
          )}
          {unitMessage && (
            <p role="status" className="text-sm text-muted-foreground">
              {unitMessage}
            </p>
          )}
          {!editingFood && !ingredientOnly && (
            <label className="text-sm">
              Meal note (optional)
              <Input
                value={entryNote}
                maxLength={1000}
                onChange={(e) => setEntryNote(e.target.value)}
              />
            </label>
          )}
          <NutrientFields values={values} onChange={setValues} />
          {!ingredientOnly && !editingFood && (
            <p className="text-sm">
              This portion: {displayNutrient(preview.energy)} kcal ·{" "}
              {displayNutrient(preview.protein)} g protein
            </p>
          )}
          <label htmlFor="food-source" className="text-sm">
            Source / label note
          </label>
          <Input
            id="food-source"
            value={draft.source}
            maxLength={500}
            onChange={(e) => setDraft({ ...draft, source: e.target.value })}
          />
          {!editing && !ingredientOnly && (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={reuse}
                onChange={(e) => setReuse(e.target.checked)}
              />
              Save food for reuse
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </Modal>
      <RecipeBuilder
        open={recipeOpen}
        onClose={() => setRecipeOpen(false)}
        foods={foods}
        initialRecipe={recipeEditing}
        onSave={(recipe) => {
          store.recipes.setValue((previous) => ({
            ...previous,
            [recipe.id]: recipe,
          }));
          setRecipeOpen(false);
          setMessage("Recipe saved. Historical meals remain unchanged.");
        }}
      />
      <MealComposer
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        date={date}
        meal={meal}
        foods={foods}
        onSave={(items, day) => {
          store.entries.setValue((previous) =>
            mergeMealEntries(previous, items),
          );
          setDate(day);
          setFoodView("diary");
          setMessage("Meal saved on this device.");
        }}
      />
    </div>
  );
}
