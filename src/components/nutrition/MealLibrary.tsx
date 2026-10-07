"use client";
import { useRef, useState } from "react";
import Modal from "@/components/trackers/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  displayNutrient,
  MEALS,
  scaleNutrients,
  nutrientTotals,
  type FoodEntry,
} from "@/lib/nutrition";
import {
  recipeMetrics,
  resizeIngredient,
  type RichRecipe,
} from "@/lib/nutrition-recipes";
import {
  createMealTemplate,
  repeatMeal,
  prepareBatch,
  batchRemaining,
  logBatchPortion,
  type MealTemplate,
  type PreparedBatch,
} from "@/lib/nutrition-reuse";
export type MealLibraryProps = {
  enabled?: boolean;
  date: string;
  entries: FoodEntry[];
  templates: Record<string, MealTemplate>;
  batches: Record<string, PreparedBatch>;
  recipes: RichRecipe[];
  onTemplatesChange: (next: Record<string, MealTemplate>) => void;
  onBatchesChange: (next: Record<string, PreparedBatch>) => void;
  onLog: (entries: Record<string, FoodEntry>) => void;
};
export default function MealLibrary(props: MealLibraryProps) {
  const {
    enabled = true,
    date,
    entries,
    templates,
    batches,
    recipes,
    onTemplatesChange,
    onBatchesChange,
    onLog,
  } = props;
  const [name, setName] = useState("");
  const [sourceMeal, setSourceMeal] = useState("Lunch");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<MealTemplate | null>(null);
  const [batch, setBatch] = useState<PreparedBatch | null>(null);
  const [preparing, setPreparing] = useState<RichRecipe | null>(null);
  const [preparedServings, setPreparedServings] = useState("");
  const [preparedWeight, setPreparedWeight] = useState("");
  const [meal, setMeal] = useState("Lunch");
  const [logDate, setLogDate] = useState(date);
  const [quantities, setQuantities] = useState<string[]>([]);
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState<"g" | "serving">("serving");
  const operation = useRef("");
  const saving = useRef(false);
  function begin() {
    operation.current = crypto.randomUUID();
    saving.current = false;
    setError("");
    setLogDate(date);
    setMeal("Lunch");
  }
  function run(action: () => void) {
    setError("");
    if (!enabled) {
      setError(
        "Meal library cloud storage is awaiting setup. Existing records remain available for review.",
      );
      return;
    }
    try {
      action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save. Please retry.",
      );
    }
  }
  const active = entries.filter(
    (e) =>
      e.date === date &&
      !e.deleted &&
      !(e as FoodEntry & { planned?: boolean }).planned,
  );
  function saveReviewed() {
    if (saving.current) return;
    run(() => {
      saving.current = true;
      try {
        if (review) {
          const reviewed = {
            ...review,
            items: review.items.map((item, i) => ({
              ...item,
              quantity: Number(quantities[i]),
            })),
          };
          onLog(
            repeatMeal(
              reviewed,
              operation.current,
              logDate,
              meal,
              1,
              Date.now(),
            ),
          );
          setReview(null);
        } else if (batch) {
          const entry = logBatchPortion(
            batch,
            entries,
            Number(amount),
            unit,
            operation.current,
            logDate,
            meal,
            Date.now(),
          );
          onLog({ [entry.id]: entry });
          setBatch(null);
        }
        setMessage("Consumed meal saved.");
      } finally {
        saving.current = false;
      }
    });
  }
  const preview = review
    ? nutrientTotals(
        review.items.flatMap((item, i) =>
          Number(quantities[i]) > 0
            ? [
                scaleNutrients(
                  item.food.nutrients,
                  Number(quantities[i]),
                  item.food.basisAmount,
                ),
              ]
            : [],
        ),
      ).values.energy
    : null;
  return (
    <section
      className="space-y-4 rounded-xl border border-border p-4"
      aria-label="Meal library"
    >
      <div>
        <h2 className="font-semibold">Repeat meals & prepared batches</h2>
        <p className="text-sm text-muted-foreground">
          Review portions before recording consumption. Preparing food never
          adds it to your diary.
        </p>
      </div>
      {!enabled && (
        <p role="status" className="text-sm text-muted-foreground">
          Meal library cloud storage is awaiting setup. Existing records remain
          available for review.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Save a meal from {date}</h3>
        <div className="flex flex-wrap gap-2">
          <label className="min-w-0 flex-1 text-sm">
            Meal template name
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={300}
            />
          </label>
          <label className="text-sm">
            Source meal
            <select
              className="block rounded border bg-background p-2"
              value={sourceMeal}
              onChange={(e) => setSourceMeal(e.target.value)}
            >
              {MEALS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
        <Button
          variant="outline"
          disabled={!enabled}
          onClick={() =>
            run(() => {
              const template = createMealTemplate(
                crypto.randomUUID(),
                name,
                active.filter((e) => e.meal === sourceMeal),
                Date.now(),
              );
              onTemplatesChange({ ...templates, [template.id]: template });
              setName("");
              setMessage(
                "Meal template saved with its original food snapshots.",
              );
            })
          }
        >
          Save meal template
        </Button>
      </div>
      <div className="space-y-2">
        {Object.values(templates)
          .filter((t) => !t.deleted)
          .map((t) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              key={t.id}
            >
              <div className="min-w-0">
                <p className="break-words font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.items.length} foods · original snapshots
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!enabled}
                  className="h-auto min-h-9 max-w-full whitespace-normal break-words"
                  onClick={() => {
                    begin();
                    setReview(t);
                    setQuantities(t.items.map((i) => String(i.quantity)));
                  }}
                >
                  Repeat {t.name}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!enabled}
                  aria-label={`Delete template ${t.name}`}
                  onClick={() => {
                    if (
                      enabled &&
                      confirm(`Delete ${t.name}? Logged meals are retained.`)
                    )
                      onTemplatesChange({
                        ...templates,
                        [t.id]: { ...t, deleted: true, updatedAt: Date.now() },
                      });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        {!Object.values(templates).some((t) => !t.deleted) && (
          <p className="text-sm text-muted-foreground">
            Save a consumed meal above to repeat it with one review.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Prepare a recipe</h3>
        <div className="flex flex-wrap gap-2">
          {recipes
            .filter((r) => !r.deleted)
            .map((r) => (
              <Button
                key={r.id}
                disabled={!enabled}
                className="h-auto min-h-9 max-w-full whitespace-normal break-words"
                variant="outline"
                onClick={() => {
                  begin();
                  setPreparing(JSON.parse(JSON.stringify(r)));
                  const yields = recipeMetrics(r);
                  setPreparedServings(
                    yields.servings === null ? "" : String(yields.servings),
                  );
                  setPreparedWeight(
                    yields.cookedWeightGrams === null
                      ? ""
                      : String(yields.cookedWeightGrams),
                  );
                }}
              >
                Prepare {r.name}
              </Button>
            ))}
        </div>
        {!recipes.some((r) => !r.deleted) && (
          <p className="text-sm text-muted-foreground">
            Create a recipe first to record a prepared batch.
          </p>
        )}
      </div>
      <div className="space-y-2">
        {Object.values(batches)
          .filter((b) => !b.deleted)
          .map((b) => {
            let remaining;
            try {
              remaining = batchRemaining(b, entries);
            } catch {
              return (
                <p key={b.id} role="alert">
                  {b.recipe.name}: correct invalid portions before logging more.
                </p>
              );
            }
            return (
              <div className="rounded-lg border p-3 space-y-2" key={b.id}>
                <div>
                  <p className="font-medium break-words">{b.recipe.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Prepared {b.preparedDate} · saved recipe snapshot
                  </p>
                  <p className="text-sm">
                    Declared remaining:{" "}
                    {remaining.grams !== null
                      ? `${displayNutrient(remaining.grams)} g`
                      : ""}
                    {remaining.grams !== null && remaining.servings !== null
                      ? " / "
                      : ""}
                    {remaining.servings !== null
                      ? `${displayNutrient(remaining.servings)} servings`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Calculated from logged portions; remaining food has not been
                    weighed.
                  </p>
                  {remaining.overdrawn && (
                    <p role="alert" className="text-sm text-destructive">
                      Recorded portions exceed the declared yield. Correct the
                      diary before adding more.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="h-auto min-h-9 max-w-full whitespace-normal break-words"
                  disabled={
                    !enabled || remaining.fraction <= 0 || remaining.overdrawn
                  }
                  onClick={() => {
                    begin();
                    setBatch(b);
                    setUnit(remaining.servings !== null ? "serving" : "g");
                    setAmount(
                      String(
                        remaining.servings !== null
                          ? Math.min(1, remaining.servings)
                          : Math.min(100, remaining.grams ?? 100),
                      ),
                    );
                  }}
                >
                  Log portion of {b.recipe.name}
                </Button>
              </div>
            );
          })}
      </div>
      <Modal
        open={!!review || !!batch}
        onClose={() => {
          setReview(null);
          setBatch(null);
          setError("");
        }}
        title="Review meal portions"
      >
        <div className="space-y-4">
          <label className="block text-sm">
            Consumed date
            <Input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Meal
            <select
              className="block w-full rounded border bg-background p-2"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
            >
              {MEALS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          {review && (
            <>
              {review.items.map((item, i) => (
                <label className="block text-sm" key={i}>
                  Portion for {item.food.name} ({item.food.basisUnit})
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={quantities[i] ?? ""}
                    onChange={(e) =>
                      setQuantities((old) =>
                        old.map((v, n) => (n === i ? e.target.value : v)),
                      )
                    }
                  />
                </label>
              ))}
              <p className="text-sm">
                Known calories: {displayNutrient(preview)} kcal. Missing
                nutrient values remain unknown.
              </p>
            </>
          )}
          {batch && (
            <>
              <label className="block text-sm">
                Batch portion
                <Input
                  type="number"
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Batch portion unit
                <select
                  className="block w-full rounded border bg-background p-2"
                  aria-label="Batch portion unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "g" | "serving")}
                >
                  {recipeMetrics(batch.recipe).servings !== null && (
                    <option value="serving">serving</option>
                  )}
                  {recipeMetrics(batch.recipe).cookedWeightGrams !== null && (
                    <option value="g">g cooked</option>
                  )}
                </select>
              </label>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button disabled={!enabled} onClick={saveReviewed}>
            Save consumed meal
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!preparing}
        onClose={() => {
          setPreparing(null);
          setError("");
        }}
        title="Prepare recipe batch"
      >
        {preparing && (
          <div className="space-y-4">
            <p className="text-sm">
              Adjust this cooking session. The saved recipe and previous meals
              stay unchanged.
            </p>
            <label className="block text-sm">
              Prepared servings
              <Input
                type="number"
                min="0.01"
                step="any"
                value={preparedServings}
                onChange={(e) => setPreparedServings(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Final cooked weight (g)
              <Input
                type="number"
                min="0.01"
                step="any"
                value={preparedWeight}
                onChange={(e) => setPreparedWeight(e.target.value)}
              />
            </label>
            {preparing.ingredients.map((ingredient, i) => (
              <label className="block text-sm" key={i}>
                Prepared ingredient {ingredient.name} ({ingredient.unit})
                <Input
                  type="number"
                  min="0.01"
                  step="any"
                  value={ingredient.quantity}
                  onChange={(e) =>
                    run(() =>
                      setPreparing({
                        ...preparing,
                        ingredients: preparing.ingredients.map((v, n) =>
                          n === i
                            ? resizeIngredient(v, Number(e.target.value))
                            : v,
                        ),
                      }),
                    )
                  }
                />
              </label>
            ))}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              disabled={!enabled}
              onClick={() =>
                run(() => {
                  if (!preparedServings && !preparedWeight)
                    throw new Error(
                      "Declare servings or final cooked weight before preparing.",
                    );
                  const recipeSnapshot = {
                    ...preparing,
                    servings: preparedServings
                      ? Number(preparedServings)
                      : undefined,
                    cookedWeightGrams: preparedWeight
                      ? Number(preparedWeight)
                      : undefined,
                    basisUnit: preparedServings
                      ? ("serving" as const)
                      : ("g" as const),
                    basisAmount: Number(preparedServings || preparedWeight),
                  };
                  const b = prepareBatch(
                    crypto.randomUUID(),
                    recipeSnapshot,
                    date,
                    Date.now(),
                  );
                  onBatchesChange({ ...batches, [b.id]: b });
                  setPreparing(null);
                  setMessage(
                    "Batch prepared. Nothing was added to consumed intake.",
                  );
                })
              }
            >
              Save prepared batch
            </Button>
          </div>
        )}
      </Modal>
    </section>
  );
}
