"use client";
import { NUTRIENTS, MAIN_NUTRIENTS, type NutrientKey } from "@/lib/nutrition";
import { Input } from "@/components/ui/input";
export default function NutrientFields({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  const fields = (keys: NutrientKey[]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {keys.map((key) => (
        <div key={key}>
          <label htmlFor={`nutrient-${key}`} className="text-sm font-medium">
            {NUTRIENTS[key].label} ({NUTRIENTS[key].unit})
          </label>
          <Input
            id={`nutrient-${key}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Unknown"
            value={values[key] ?? ""}
            onChange={(event) =>
              onChange({ ...values, [key]: event.target.value })
            }
          />
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-3">
      {fields(MAIN_NUTRIENTS)}
      <details>
        <summary className="min-h-11 flex items-center cursor-pointer font-medium text-sm">
          Vitamins, minerals and other nutrients
        </summary>
        <p className="text-sm text-muted-foreground mb-3">
          Leave values blank if the source does not provide them.
        </p>
        {fields(
          (Object.keys(NUTRIENTS) as NutrientKey[]).filter(
            (key) => !MAIN_NUTRIENTS.includes(key),
          ),
        )}
      </details>
    </div>
  );
}
