"use client";
import { useState } from "react";
import Link from "next/link";
import { useNow } from "@/lib/tracker-store";
import { useNutrition } from "@/lib/nutrition-store";
import {
  scaleNutrients,
  nutrientTotals,
  type Food,
  type FoodEntry,
} from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function FoodQuickCapture({
  date,
  onDirty,
}: {
  date: string;
  onDirty?: (dirty: boolean) => void;
}) {
  const now = useNow(1000);
  const store = useNutrition();
  const foods = Object.values({
    ...Object.fromEntries(
      Object.values(store.entries.value)
        .filter((e) => !e.deleted)
        .sort((a, b) => a.updatedAt - b.updatedAt)
        .map((e) => [e.foodId, { ...e, id: e.foodId }]),
    ),
    ...store.foods.value,
    ...store.recipes.value,
  })
    .filter((f) => !f.deleted)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const [selected, setSelected] = useState("");
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("Lunch");
  const [message, setMessage] = useState("");
  const food = foods.find((f) => f.id === selected);
  let energy: number | null = null;
  if (food && Number(quantity) > 0) {
    energy =
      nutrientTotals([
        scaleNutrients(food.nutrients, Number(quantity), food.basisAmount),
      ]).values.energy ?? null;
  }
  const save = () => {
    if (!food || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      setMessage("Choose a food and positive quantity.");
      return;
    }
    const id = crypto.randomUUID();
    const entry: FoodEntry = {
      ...food,
      id,
      foodId: food.id,
      date,
      meal,
      quantity: Number(quantity),
      updatedAt: now,
      deleted: false,
    };
    try {
      store.entries.setValue((p) => ({ ...p, [id]: entry }));
      setSelected("");
      setQuantity("");
      onDirty?.(false);
      setMessage("Food saved. Reminder completion is separate.");
    } catch {
      setMessage("Unable to save. Your draft is retained.");
    }
  };
  const choose = (f: Food) => {
    setSelected(f.id);
    setQuantity(String(f.basisAmount));
    onDirty?.(true);
  };
  return (
    <div className="capture-form">
      <label className="field-label">
        Meal
        <select
          aria-label="Meal"
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
        >
          {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Recent and saved food
        <select
          aria-label="Recent and saved food"
          value={selected}
          onChange={(e) => {
            const f = foods.find((f) => f.id === e.target.value);
            if (f) choose(f);
            else {
              setSelected("");
              setQuantity("");
              onDirty?.(false);
            }
          }}
        >
          <option value="">Choose a food</option>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.favorite ? "★ " : ""}
              {f.name}
            </option>
          ))}
        </select>
      </label>
      {food && (
        <>
          <label className="field-label">
            Quantity ({food.basisUnit})
            <Input
              aria-label="Food quantity"
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                onDirty?.(true);
              }}
            />
          </label>
          <p>
            {energy === null
              ? "Calories unavailable"
              : `${Math.round(energy)} kcal`}{" "}
            · {date} · {meal}
          </p>
          <Button onClick={save}>Save food</Button>
        </>
      )}
      <Link className="capture-return" href={`/food?date=${date}&meal=${meal}`}>
        New food or database search →
      </Link>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
