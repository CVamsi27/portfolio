"use client";
import { useRef, useState } from "react";
import Modal from "@/components/trackers/Modal";
import NutrientFields from "./NutrientFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAIN_NUTRIENTS,
  NUTRIENTS,
  displayNutrient,
  recipeNutrients,
  scaleNutrients,
  type Food,
  type NutrientKey,
  type Nutrients,
  type Recipe,
  type Unit,
} from "@/lib/nutrition";
import {
  recipeMetrics,
  resizeIngredient,
  type RichRecipe,
} from "@/lib/nutrition-recipes";
type Props = {
  open: boolean;
  onClose: () => void;
  foods: Food[];
  onSave: (recipe: RichRecipe) => void;
  initialRecipe?: RichRecipe | null;
};
export default function RecipeBuilder(props: Props) {
  return props.open ? (
    <RecipeEditor {...props} key={props.initialRecipe?.id ?? "new"} />
  ) : null;
}
function RecipeEditor({ onClose, foods, onSave, initialRecipe }: Props) {
  const legacy = initialRecipe ? recipeMetrics(initialRecipe) : null;
  const [name, setName] = useState(initialRecipe?.name ?? "");
  const [servings, setServings] = useState(
    String(legacy?.servings ?? (initialRecipe ? "" : 4)),
  );
  const [weight, setWeight] = useState(
    legacy?.cookedWeightGrams ? String(legacy.cookedWeightGrams) : "",
  );
  const [notes, setNotes] = useState(initialRecipe?.notes ?? "");
  const [ingredients, setIngredients] = useState<Recipe["ingredients"]>(
    () =>
      initialRecipe?.ingredients.map((item) => ({
        ...item,
        nutrients: { ...item.nutrients },
      })) ?? [],
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customBasis, setCustomBasis] = useState("100");
  const [customUnit, setCustomUnit] = useState<Unit>("g");
  const [customSource, setCustomSource] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const saving = useRef(false);
  const available = foods.filter(
    (food) =>
      !food.deleted && food.name.toLowerCase().includes(search.toLowerCase()),
  );
  const chosen = foods.find((food) => food.id === selected);
  const dirty = useRef(false);
  function close() {
    if (!dirty.current || window.confirm("Discard unsaved recipe changes?"))
      onClose();
  }
  function attempt(action: () => void) {
    try {
      action();
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update this recipe.",
      );
    }
  }
  function addIngredient(food: Food, amount: number) {
    const nutrients = scaleNutrients(food.nutrients, amount, food.basisAmount);
    setIngredients((previous) => [
      ...previous,
      {
        name: food.name,
        quantity: amount,
        unit: food.basisUnit,
        nutrients,
        source: food.source,
      },
    ]);
    dirty.current = true;
  }
  let preview: ReturnType<typeof recipeMetrics> | null = null;
  try {
    if (ingredients.length)
      preview = recipeMetrics({
        id: "preview",
        name: name || "Recipe",
        basisAmount: Number(servings) || Number(weight) || 1,
        basisUnit: servings ? "serving" : "g",
        nutrients: {},
        source: "Recipe estimate",
        updatedAt: 0,
        ingredients,
        servings: servings ? Number(servings) : undefined,
        cookedWeightGrams: weight ? Number(weight) : undefined,
      });
  } catch {
    /* Invalid yields are explained on save; do not present misleading estimates. */
  }
  function save() {
    if (saving.current) return;
    saving.current = true;
    try {
      if (!name.trim() || !ingredients.length)
        throw new Error("Name the recipe and add ingredients.");
      if (notes.trim().length > 2000)
        throw new Error("Keep recipe notes within 2,000 characters.");
      if (!servings && !weight)
        throw new Error("Enter a serving count or final cooked weight.");
      const recipe: RichRecipe = {
        ...initialRecipe,
        id: initialRecipe?.id ?? crypto.randomUUID(),
        name: name.trim(),
        basisAmount: Number(servings || weight),
        basisUnit: servings ? "serving" : "g",
        nutrients: recipeNutrients(
          ingredients.map((item) => item.nutrients),
          1,
          1,
        ),
        ingredients,
        source:
          initialRecipe?.source ?? "Recipe estimate · declared batch yield",
        updatedAt: Math.max(Date.now(), (initialRecipe?.updatedAt ?? 0) + 1),
        servings: servings ? Number(servings) : undefined,
        cookedWeightGrams: weight ? Number(weight) : undefined,
        notes: notes.trim() || undefined,
      };
      recipeMetrics(recipe);
      onSave(recipe);
      dirty.current = false;
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save recipe.",
      );
    } finally {
      saving.current = false;
    }
  }
  return (
    <Modal
      open
      onClose={close}
      title={initialRecipe ? "Edit recipe" : "Create recipe"}
      className="sm:max-w-2xl"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>Save recipe</Button>
        </div>
      }
    >
      <div
        className="space-y-5"
        onChange={() => {
          dirty.current = true;
        }}
      >
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="recipe-name" className="text-sm font-medium">
            Recipe name
          </label>
          <Input
            id="recipe-name"
            value={name}
            maxLength={300}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <section className="space-y-3" aria-label="Recipe ingredients">
          <h3 className="font-medium">Ingredients</h3>
          <label htmlFor="recipe-search" className="text-sm">
            Search ingredient library
          </label>
          <Input
            id="recipe-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your food library"
          />
          <div>
            <label htmlFor="recipe-ingredient" className="text-sm">
              Saved ingredient
            </label>
            <select
              id="recipe-ingredient"
              className="w-full rounded-md border bg-background p-3"
              value={selected}
              onChange={(event) => {
                setSelected(event.target.value);
                const food = foods.find(
                  (item) => item.id === event.target.value,
                );
                setQuantity(
                  food
                    ? String(
                        food.basisUnit === "serving" ? 1 : food.basisAmount,
                      )
                    : "100",
                );
              }}
            >
              <option value="">Select an ingredient</option>
              {available.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name} · {food.basisAmount} {food.basisUnit} ·{" "}
                  {food.source}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="ingredient-quantity" className="text-sm">
                Ingredient quantity (selected food’s unit)
              </label>
              <Input
                id="ingredient-quantity"
                type="number"
                min="0.001"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() =>
                attempt(() => {
                  if (!chosen)
                    throw new Error("Choose a saved ingredient first.");
                  addIngredient(chosen, Number(quantity));
                })
              }
            >
              Add ingredient
            </Button>
          </div>
          {chosen && (
            <p className="text-sm text-muted-foreground">
              Quantity in {chosen.basisUnit}; source: {chosen.source}.
            </p>
          )}
          {!available.length && (
            <p className="text-sm text-muted-foreground">
              No matching saved foods. Create an ingredient below from its
              nutrition label or a reliable source.
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => setCustomOpen(!customOpen)}
            aria-expanded={customOpen}
          >
            Create ingredient
          </Button>
          {customOpen && (
            <div
              className="space-y-3 rounded-lg border p-3"
              aria-label="Custom recipe ingredient"
            >
              <h4 className="font-medium">Custom ingredient</h4>
              <p className="text-sm text-muted-foreground">
                These values stay in this recipe. Enter nutrients for the
                declared portion; blank nutrients remain unknown.
              </p>
              <label htmlFor="custom-ingredient-name">Ingredient name</label>
              <Input
                id="custom-ingredient-name"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                maxLength={300}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="custom-ingredient-basis">
                    Nutrition basis
                  </label>
                  <Input
                    id="custom-ingredient-basis"
                    type="number"
                    min="0.001"
                    step="any"
                    value={customBasis}
                    onChange={(event) => setCustomBasis(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="custom-ingredient-unit">Basis unit</label>
                  <select
                    id="custom-ingredient-unit"
                    className="w-full rounded-md border bg-background p-3"
                    value={customUnit}
                    onChange={(event) =>
                      setCustomUnit(event.target.value as Unit)
                    }
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="serving">serving</option>
                  </select>
                </div>
              </div>
              <label htmlFor="custom-ingredient-source">Source or label</label>
              <Input
                id="custom-ingredient-source"
                value={customSource}
                onChange={(event) => setCustomSource(event.target.value)}
                placeholder="e.g. package label, USDA record"
              />
              <NutrientFields
                values={customValues}
                onChange={setCustomValues}
              />
              <Button
                onClick={() =>
                  attempt(() => {
                    if (!customName.trim())
                      throw new Error("Name the ingredient.");
                    const nutrients = Object.fromEntries(
                      Object.entries(customValues)
                        .filter(([, value]) => value.trim())
                        .map(([key, value]) => [key, Number(value)]),
                    ) as Nutrients;
                    addIngredient(
                      {
                        id: crypto.randomUUID(),
                        name: customName.trim(),
                        basisAmount: Number(customBasis),
                        basisUnit: customUnit,
                        nutrients,
                        source:
                          customSource.trim() ||
                          "Custom ingredient · manually entered",
                        updatedAt: Date.now(),
                      },
                      Number(customBasis),
                    );
                    setCustomOpen(false);
                    setCustomName("");
                    setCustomValues({});
                  })
                }
              >
                Add custom ingredient
              </Button>
            </div>
          )}
          <ul className="space-y-2">
            {ingredients.map((item, index) => (
              <li
                key={`${index}-${item.name}`}
                className="rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item as typeof item & { source?: string }).source ??
                        "Saved ingredient snapshot"}{" "}
                      · {displayNutrient(item.nutrients.energy)} kcal
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIngredients((previous) =>
                        previous.filter((_, position) => position !== index),
                      );
                      dirty.current = true;
                    }}
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </Button>
                </div>
                <label htmlFor={`recipe-quantity-${index}`} className="text-sm">
                  {item.name} quantity ({item.unit})
                </label>
                <Input
                  id={`recipe-quantity-${index}`}
                  type="number"
                  min="0.001"
                  step="any"
                  value={item.quantity}
                  onChange={(event) =>
                    attempt(() => {
                      const resized = resizeIngredient(
                        item,
                        Number(event.target.value),
                      );
                      setIngredients((previous) =>
                        previous.map((row, position) =>
                          position === index ? resized : row,
                        ),
                      );
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3" aria-label="Recipe yield">
          <h3 className="font-medium">Final batch yield</h3>
          <p className="text-sm text-muted-foreground">
            Declare servings, final cooked weight, or both. We never derive
            cooked weight by adding raw ingredients.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="recipe-servings">Final batch yield</label>
              <Input
                id="recipe-servings"
                aria-describedby="servings-hint"
                type="number"
                min="0.001"
                step="any"
                value={servings}
                onChange={(event) => setServings(event.target.value)}
              />
              <p id="servings-hint" className="text-xs text-muted-foreground">
                Number of servings in the whole batch.
              </p>
            </div>
            <div>
              <label htmlFor="recipe-cooked-weight">Cooked weight (g)</label>
              <Input
                id="recipe-cooked-weight"
                type="number"
                min="0.001"
                step="any"
                placeholder="Optional"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
              />
            </div>
          </div>
        </section>
        {preview && (
          <section className="space-y-2" aria-label="Recipe nutrition preview">
            <h3 className="font-medium">Nutrition preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Nutrient</th>
                    <th>Full batch</th>
                    <th>Per serving</th>
                    <th>Per 100 g</th>
                  </tr>
                </thead>
                <tbody>
                  {MAIN_NUTRIENTS.map((key: NutrientKey) => (
                    <tr key={key}>
                      <th className="py-2 text-left font-normal">
                        {NUTRIENTS[key].label} ({NUTRIENTS[key].unit})
                      </th>
                      <td className="text-center">
                        {displayNutrient(preview.batch[key])}
                      </td>
                      <td className="text-center">
                        {preview.perServing
                          ? displayNutrient(preview.perServing[key])
                          : "Declare servings"}
                      </td>
                      <td className="text-center">
                        {preview.per100g
                          ? displayNutrient(preview.per100g[key])
                          : "Declare weight"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Recipe estimates use ingredient snapshots. Missing nutrient values
              remain unknown.
            </p>
          </section>
        )}
        <div>
          <label htmlFor="recipe-notes">Instructions / notes</label>
          <textarea
            id="recipe-notes"
            className="w-full rounded-md border bg-background p-3"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={2000}
          />
        </div>
      </div>
    </Modal>
  );
}
