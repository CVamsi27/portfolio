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
  recipeNutrients,
  scaleNutrients,
  validNutrients,
  validEntry,
  nutrientTotals,
  type Food,
  type FoodEntry,
  type NutrientKey,
  type Nutrients,
  type Recipe,
  type Unit,
} from "@/lib/nutrition";
import { getSupabase } from "@/lib/supabase/client";
import NutrientFields from "./NutrientFields";
import NutritionSummary from "./NutritionSummary";

const blank = {
  name: "",
  basisAmount: "100",
  basisUnit: "g" as Unit,
  quantity: "100",
  source: "User-entered",
};
export default function FoodTracker() {
  const store = useNutrition();
  const saving = useRef(false);
  const [copyDate, setCopyDate] = useState(() => foodDateKey());
  const [recipeEditing, setRecipeEditing] = useState<Recipe | null>(null);
  const [date, setDate] = useState(() => foodDateKey());
  const [entryDate, setEntryDate] = useState(() => foodDateKey());
  const [meal, setMeal] = useState<string>("Lunch");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [foodId, setFoodId] = useState<string | null>(null);
  const [reuse, setReuse] = useState(true);
  const [entryNote, setEntryNote] = useState("");
  const [unitMessage, setUnitMessage] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<FoodEntry | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: number; name: string; brand?: string; type?: string }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [yieldAmount, setYieldAmount] = useState("4");
  const [yieldUnit, setYieldUnit] = useState<Unit>("serving");
  const [ingredients, setIngredients] = useState<Recipe["ingredients"]>([]);
  const [ingredientId, setIngredientId] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("100");
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("meal");
    if (selected) {
      setMeal(selected === "Snacks" ? "Snack" : selected);
      setOpen(true);
    }
  }, []);
  const entries = Object.values(store.entries.value ?? {}).filter(
    (entry) => !entry.deleted && entry.date === date,
  );
  const recent = Object.fromEntries(
    Object.values(store.entries.value ?? {})
      .filter((item) => !item.deleted)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 20)
      .map((item) => [item.foodId, { ...item, id: item.foodId }]),
  );
  const foods = Object.values({
    ...recent,
    ...store.foods.value,
    ...store.recipes.value,
  })
    .filter((food) => !food.deleted)
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
    setEditingFood(null);
    setUnitMessage("");
    setEntryDate(entry?.date ?? date);
    setEntryNote(entry?.note ?? "");
    setDraft({
      name: food.name,
      basisAmount: String(food.basisAmount),
      basisUnit: food.basisUnit,
      quantity: String(entry?.quantity ?? food.basisAmount),
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
      !meal.trim() ||
      !draft.name.trim() ||
      !validNutrients(nutrients) ||
      !Number.isFinite(basis) ||
      basis <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
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
      id: fid,
      name: draft.name.trim(),
      basisAmount: basis,
      basisUnit: draft.basisUnit,
      nutrients,
      source: draft.source,
      updatedAt: stamp,
    };
    if (editingFood) {
      try {
        store.foods.setValue((previous) => ({
          ...previous,
          [fid]: {
            ...food,
            updatedAt: Math.max(stamp, editingFood.updatedAt + 1),
          },
        }));
        setOpen(false);
        setMessage("Saved food updated. Historical meals remain unchanged.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Food was not saved.");
      }
      return;
    }
    const entry: FoodEntry = {
      ...food,
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
      store.entries.setValue((previous) => ({ ...previous, [id]: entry }));
      if (reuse && !editing && !store.recipes.value[fid])
        store.foods.setValue((previous) => ({ ...previous, [fid]: food }));
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
  const request = async (path: string) => {
    const session = await getSupabase()?.auth.getSession();
    const response = await fetch(path, {
      headers: session?.data.session
        ? { Authorization: `Bearer ${session.data.session.access_token}` }
        : {},
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error ?? "Food database unavailable.");
    return result;
  };
  const search = async () => {
    setSearching(true);
    setError("");
    try {
      const result = await request(
        `/api/nutrition/search?q=${encodeURIComponent(query.trim())}`,
      );
      setResults(result.foods);
      if (!result.foods.length)
        setError(
          "No matching foods. Try another name or add the food manually.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search unavailable.");
    } finally {
      setSearching(false);
    }
  };
  const loadRemote = async (id: number) => {
    setSearching(true);
    try {
      const { food } = await request(`/api/nutrition/food/${id}`);
      load(food);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Food unavailable.");
    } finally {
      setSearching(false);
    }
  };
  const addIngredient = () => {
    const food = foods.find((item) => item.id === ingredientId);
    if (!food) return;
    try {
      const amount = Number(ingredientQuantity);
      setIngredients((previous) => [
        ...previous,
        {
          name: food.name,
          nutrients: scaleNutrients(food.nutrients, amount, food.basisAmount),
          quantity: amount,
          unit: food.basisUnit,
        },
      ]);
      setError("");
    } catch {
      setError("Enter a positive ingredient quantity.");
    }
  };
  const saveRecipe = () => {
    try {
      if (!recipeName.trim() || !ingredients.length)
        throw new Error("Name the recipe and add ingredients.");
      const amount = Number(yieldAmount);
      const nutrients = recipeNutrients(
        ingredients.map((item) => item.nutrients),
        amount,
        amount,
      );
      const id = recipeEditing?.id ?? crypto.randomUUID();
      const recipe: Recipe = {
        id,
        name: recipeName.trim(),
        basisAmount: amount,
        basisUnit: yieldUnit,
        nutrients,
        ingredients,
        source: "Recipe estimate · declared batch yield",
        updatedAt: Math.max(Date.now(), (recipeEditing?.updatedAt ?? 0) + 1),
      };
      store.recipes.setValue((previous) => ({ ...previous, [id]: recipe }));
      setRecipeOpen(false);
      setIngredients([]);
      setRecipeName("");
      setMessage("Recipe saved locally. Historical meals remain unchanged.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enter a positive yield.");
    }
  };
  return (
    <div className="space-y-5">
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
        <Button onClick={start}>Log food</Button>
        <Button
          variant="outline"
          onClick={() => {
            setRecipeEditing(null);
            setRecipeName("");
            setIngredients([]);
            setError("");
            setRecipeOpen(true);
          }}
        >
          Create recipe
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {store.entries.status === "synced"
          ? "Synced"
          : store.entries.status === "syncing"
            ? "Syncing…"
            : store.entries.status === "error"
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
      {entries.length > 0 && (
        <label className="block text-sm">
          Duplicate entries to date
          <Input
            type="date"
            value={copyDate}
            onChange={(e) => setCopyDate(e.target.value)}
          />
        </label>
      )}
      <NutritionSummary entries={entries} targets={store.targets.value} />
      <div className="space-y-4">
        {Array.from(new Set([...MEALS, ...entries.map((entry) => entry.meal)]))
          .filter((group) => entries.some((entry) => entry.meal === group))
          .map((group) => {
            const items = entries.filter((entry) => entry.meal === group);
            return (
              <section
                key={group}
                className="rounded-xl border border-border p-4"
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
                                const id = crypto.randomUUID();
                                const copy = {
                                  ...entry,
                                  id,
                                  date: copyDate,
                                  updatedAt: Date.now(),
                                };
                                if (!validEntry(copy)) {
                                  setMessage("Choose a valid copy date.");
                                  return;
                                }
                                store.entries.setValue((previous) => ({
                                  ...previous,
                                  [id]: copy,
                                }));
                                setMessage(`Food entry copied to ${copyDate}.`);
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
      {Object.values(store.foods.value).some((item) => !item.deleted) && (
        <details className="rounded-xl border border-border p-4">
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
      {Object.values(store.recipes.value).some((item) => !item.deleted) && (
        <details className="rounded-xl border border-border p-4">
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
                      setRecipeName(item.name);
                      setYieldAmount(String(item.basisAmount));
                      setYieldUnit(item.basisUnit);
                      setIngredients(item.ingredients);
                      setError("");
                      setRecipeOpen(true);
                    }}
                  >
                    Edit recipe
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
      <details className="rounded-xl border border-border p-4">
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
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          editingFood
            ? "Edit saved food"
            : editing
              ? "Edit food entry"
              : "Log food"
        }
        className="max-w-2xl"
        footer={
          <Button onClick={save}>
            {editingFood || editing ? "Save changes" : "Save food"}
          </Button>
        }
      >
        <div className="space-y-4">
          {!editingFood && (
            <label className="text-sm">
              Entry date
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </label>
          )}
          {!editing && (
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
                <div className="flex flex-wrap gap-2">
                  <Input
                    aria-label="Food search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Food or brand"
                  />
                  <Button
                    onClick={search}
                    disabled={searching || !query.trim()}
                  >
                    {searching ? "Loading…" : "Search foods"}
                  </Button>
                </div>
                <ul className="mt-3 space-y-2">
                  {results.map((item) => (
                    <li key={item.id}>
                      <Button
                        variant="outline"
                        className="h-auto whitespace-normal text-left"
                        onClick={() => loadRemote(item.id)}
                        disabled={searching}
                      >
                        {item.name} · {item.brand ?? item.type}
                      </Button>
                    </li>
                  ))}
                </ul>
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
          </div>
          <p className="text-xs text-muted-foreground">
            Use the label or source’s declared basis. A bowl or piece needs a
            defined serving; volume does not automatically equal weight.
          </p>
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
          {unitMessage && (
            <p role="status" className="text-sm text-muted-foreground">
              {unitMessage}
            </p>
          )}
          {!editingFood && (
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
          <p className="text-sm">
            This portion: {displayNutrient(preview.energy)} kcal ·{" "}
            {displayNutrient(preview.protein)} g protein
          </p>
          <label htmlFor="food-source" className="text-sm">
            Source / label note
          </label>
          <Input
            id="food-source"
            value={draft.source}
            maxLength={500}
            onChange={(e) => setDraft({ ...draft, source: e.target.value })}
          />
          {!editing && (
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
      <Modal
        open={recipeOpen}
        onClose={() => setRecipeOpen(false)}
        title={recipeEditing ? "Edit recipe" : "Create recipe"}
        footer={<Button onClick={saveRecipe}>Save recipe</Button>}
      >
        <div className="space-y-3">
          <label htmlFor="recipe-name">Recipe name</label>
          <Input
            id="recipe-name"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            maxLength={300}
          />
          <label htmlFor="ingredient-food">Saved ingredient</label>
          <select
            id="ingredient-food"
            className="w-full rounded-lg border border-border bg-background p-3"
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
          >
            <option value="">Choose food</option>
            {foods.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name} ({food.basisUnit})
              </option>
            ))}
          </select>
          <label htmlFor="ingredient-quantity">
            Ingredient quantity (selected food’s unit)
          </label>
          <Input
            id="ingredient-quantity"
            type="number"
            step="any"
            min="0.01"
            value={ingredientQuantity}
            onChange={(e) => setIngredientQuantity(e.target.value)}
          />
          <Button variant="outline" onClick={addIngredient}>
            Add ingredient
          </Button>
          <ul>
            {ingredients.map((item, index) => (
              <li
                key={index}
                className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-sm"
              >
                <span>
                  {item.name} · {item.quantity} {item.unit}
                </span>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setIngredients((previous) =>
                      previous.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove ingredient
                </Button>
              </li>
            ))}
          </ul>
          <label htmlFor="recipe-yield">Final batch yield</label>
          <Input
            id="recipe-yield"
            type="number"
            step="any"
            min="0.01"
            value={yieldAmount}
            onChange={(e) => setYieldAmount(e.target.value)}
          />
          <select
            aria-label="Recipe yield unit"
            className="w-full rounded-lg border border-border bg-background p-3"
            value={yieldUnit}
            onChange={(e) => setYieldUnit(e.target.value as Unit)}
          >
            <option value="serving">Servings</option>
            <option value="g">Cooked grams</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Include cooking oil and other additions. Nutrients are estimated
            from ingredients; unknown values stay unknown.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
