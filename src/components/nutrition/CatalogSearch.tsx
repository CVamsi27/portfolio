"use client";
import { useEffect, useRef, useState } from "react";
import { currentAuthUserId, useAuth } from "@/lib/auth-store";
import { getSupabase } from "@/lib/supabase/client";
import { displayNutrient, type Food } from "@/lib/nutrition";
import {
  cacheFoods,
  readCatalog,
  clearCatalog,
  searchCatalog,
  catalogQuery,
  validCatalogFood,
  portionQuantity,
  type CachedFood,
  type CatalogFood,
} from "@/lib/nutrition-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Hit = { id: number; name: string; brand?: string; type?: string };
type Props = {
  foods: Food[];
  onSelect: (food: Food, quantity?: number) => void;
};
export default function CatalogSearch({ foods, onSelect }: Props) {
  const { user, configured } = useAuth();
  const scope = configured ? (user ? `account:${user.id}` : null) : "local";
  return (
    <ScopedCatalogSearch
      key={scope ?? "signed-out"}
      foods={scope ? foods : []}
      onSelect={onSelect}
      scope={scope}
      owner={configured ? (user?.id ?? null) : undefined}
    />
  );
}
function freshness(stamp: number) {
  const date = new Date(stamp);
  if (!Number.isFinite(date.getTime())) return "Retrieval date unavailable";
  const day = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${Date.now() - stamp > 30 * 86_400_000 ? "Older snapshot · " : ""}Downloaded ${day}`;
}
function ScopedCatalogSearch({
  foods,
  onSelect,
  scope,
  owner,
}: Props & { scope: string | null; owner: string | null | undefined }) {
  const accountActive = () =>
    owner === undefined || currentAuthUserId() === owner;
  const [query, setQuery] = useState("");
  const [cached, setCached] = useState<CachedFood[]>([]);
  const [remote, setRemote] = useState<Hit[]>([]);
  const [selected, setSelected] = useState<CatalogFood | null>(null);
  const [portion, setPortion] = useState("basis");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    controller.current?.abort();
    setCached([]);
    setRemote([]);
    setSelected(null);
    setBusy(false);
    setError("");
    setStorageError("");
    setNotice("");
    if (scope)
      void readCatalog(scope)
        .then((rows) => {
          if (current === generation.current) setCached(rows);
        })
        .catch((e) => {
          if (current === generation.current)
            setStorageError(
              e instanceof Error
                ? e.message
                : "Offline food storage unavailable.",
            );
        });
    return () => {
      controller.current?.abort();
      generation.current += 1;
    };
  }, [scope]);
  const request = async (path: string, signal: AbortSignal) => {
    const session = await getSupabase()?.auth.getSession();
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    if (
      !accountActive() ||
      (owner !== undefined && session?.data.session?.user.id !== owner)
    )
      throw Error("Your account changed. Reopen food search to continue.");
    const response = await fetch(path, {
      signal,
      headers: session?.data.session
        ? { Authorization: `Bearer ${session.data.session.access_token}` }
        : {},
    });
    const result = await response.json();
    if (!response.ok)
      throw Error(
        typeof result.error === "string"
          ? result.error
          : "Food database unavailable.",
      );
    return result;
  };
  const searchRemote = async () => {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    const current = generation.current;
    setBusy(true);
    setError("");
    setRemote([]);
    setNotice("");
    try {
      if (!query.trim() || query.trim().length > 200)
        throw Error("Enter a food name of 1–200 characters.");
      if (!scope)
        throw Error(
          "Sign in to search the food database. Saved foods remain available.",
        );
      const result = await request(
        `/api/nutrition/search?q=${encodeURIComponent(catalogQuery(query))}`,
        active.signal,
      );
      if (!Array.isArray(result.foods))
        throw Error("The food database returned an invalid search response.");
      const hits = result.foods.filter(
        (hit: unknown): hit is Hit =>
          !!hit &&
          typeof hit === "object" &&
          Number.isSafeInteger((hit as Hit).id) &&
          (hit as Hit).id > 0 &&
          typeof (hit as Hit).name === "string" &&
          !!(hit as Hit).name.trim() &&
          ((hit as Hit).brand === undefined ||
            typeof (hit as Hit).brand === "string") &&
          ((hit as Hit).type === undefined ||
            typeof (hit as Hit).type === "string"),
      );
      if (
        current === generation.current &&
        !active.signal.aborted &&
        accountActive()
      ) {
        setRemote(hits);
        if (!hits.length)
          setNotice(
            "No database matches. Try another name, choose a saved food or add it manually.",
          );
      }
    } catch (e) {
      if (
        current === generation.current &&
        !active.signal.aborted &&
        accountActive()
      )
        setError(
          e instanceof Error
            ? e.message
            : "Database search unavailable. Saved foods remain available.",
        );
    } finally {
      if (
        current === generation.current &&
        !active.signal.aborted &&
        accountActive()
      )
        setBusy(false);
    }
  };
  const chooseRemote = async (hit: Hit) => {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    const current = generation.current;
    const account = scope;
    setBusy(true);
    setError("");
    try {
      const result = await request(
        `/api/nutrition/food/${hit.id}`,
        active.signal,
      );
      if (!validCatalogFood(result.food))
        throw Error("Food details contain invalid nutrition or portion data.");
      if (
        active.signal.aborted ||
        current !== generation.current ||
        !accountActive()
      )
        return;
      const food = result.food;
      setSelected(food);
      setPortion("basis");
      if (account) {
        try {
          if (!accountActive()) return;
          await cacheFoods(account, [food]);
          const rows = await readCatalog(account);
          if (
            current === generation.current &&
            !active.signal.aborted &&
            accountActive()
          ) {
            setCached(rows);
            setStorageError("");
          }
        } catch (e) {
          if (
            current === generation.current &&
            !active.signal.aborted &&
            accountActive()
          )
            setStorageError(
              e instanceof Error
                ? e.message
                : "Food loaded, but it could not be cached for offline use.",
            );
        }
      }
    } catch (e) {
      if (
        current === generation.current &&
        !active.signal.aborted &&
        accountActive()
      )
        setError(e instanceof Error ? e.message : "Food details unavailable.");
    } finally {
      if (
        current === generation.current &&
        !active.signal.aborted &&
        accountActive()
      )
        setBusy(false);
    }
  };
  const clear = async () => {
    if (
      !scope ||
      !window.confirm(
        "Clear downloaded food snapshots on this device? Your saved foods and meal history will stay.",
      )
    )
      return;
    const current = generation.current;
    if (!accountActive()) return;
    try {
      await clearCatalog(scope);
      if (current === generation.current) {
        setCached([]);
        setStorageError("");
        setNotice("Offline catalog cleared.");
      }
    } catch (e) {
      if (current === generation.current)
        setStorageError(
          e instanceof Error
            ? e.message
            : "Could not clear offline food storage.",
        );
    }
  };
  const matches = searchCatalog(
    [...foods, ...cached.map((row) => row.food)],
    query,
  );
  const quantity = selected
    ? portion === "basis"
      ? selected.basisAmount
      : portionQuantity(selected, selected.portions![Number(portion)])
    : null;
  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void searchRemote();
        }}
      >
        <label className="min-w-0 flex-1 text-sm">
          Food catalog search
          <Input
            value={query}
            maxLength={200}
            onChange={(e) => {
              controller.current?.abort();
              setBusy(false);
              setRemote([]);
              setSelected(null);
              setError("");
              setNotice("");
              setQuery(e.target.value);
            }}
            placeholder="Search saved foods or the database"
          />
        </label>
        <Button
          className="self-end"
          type="submit"
          disabled={busy || !query.trim()}
        >
          Search food database
        </Button>
      </form>
      {catalogQuery(query) !== query.trim().toLowerCase() && (
        <p className="text-sm text-muted-foreground">
          Database search uses “{catalogQuery(query)}”. Check the actual food
          and preparation before adding it.
        </p>
      )}
      {busy && (
        <p role="status" className="text-sm">
          Loading food database…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} Cached and saved foods below still work.
        </p>
      )}
      {storageError && (
        <div className="text-sm">
          <p role="alert">{storageError}</p>
          <Button type="button" variant="ghost" onClick={() => void clear()}>
            Clear offline catalog
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {selected && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div>
            <h3 className="font-medium">{selected.name}</h3>
            <p className="text-xs text-muted-foreground break-words">
              {selected.source}
            </p>
          </div>
          <p className="text-sm">
            {displayNutrient(selected.nutrients.energy)} kcal per{" "}
            {selected.basisAmount} {selected.basisUnit}. Missing nutrients
            remain unknown.
          </p>
          {cached.find((row) => row.food.id === selected.id) && (
            <p className="text-xs text-muted-foreground">
              {freshness(
                cached.find((row) => row.food.id === selected.id)!.retrievedAt,
              )}
              . Check the source label if the product has changed.
            </p>
          )}
          <label className="block text-sm">
            Declared portion
            <select
              className="mt-1 w-full rounded-lg border bg-background p-2"
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
            >
              <option value="basis">
                {selected.basisAmount} {selected.basisUnit} (food basis)
              </option>
              {selected.portions?.map((item, index) => (
                <option
                  key={index}
                  value={index}
                  disabled={portionQuantity(selected, item) === null}
                >
                  {item.name} · {item.amount} {item.unit}
                  {item.gramWeight ? ` · ${item.gramWeight} g` : ""}
                  {portionQuantity(selected, item) === null
                    ? " · conversion unavailable"
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            Adjust the amount in the food or meal editor after selecting.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={quantity === null}
              onClick={() => {
                if (quantity !== null) {
                  if (!accountActive()) {
                    setError(
                      "Your account changed. Reopen food search to continue.",
                    );
                    return;
                  }
                  onSelect(structuredClone(selected), quantity);
                  setSelected(null);
                }
              }}
            >
              Use this food
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      <section
        aria-label="Saved and offline food matches"
        className="space-y-2"
      >
        <h3 className="text-sm font-medium">Saved &amp; offline foods</h3>
        {matches.length ? (
          matches.map((food) => (
            <button
              key={food.id}
              type="button"
              className="w-full rounded-xl border p-3 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => {
                if (!accountActive()) {
                  setError(
                    "Your account changed. Reopen food search to continue.",
                  );
                  return;
                }
                controller.current?.abort();
                setBusy(false);
                setSelected(food);
                setPortion("basis");
              }}
            >
              <span className="block font-medium">{food.name}</span>
              <span className="block text-xs text-muted-foreground">
                {displayNutrient(food.nutrients.energy)} kcal /{" "}
                {food.basisAmount} {food.basisUnit} ·{" "}
                {cached.some((row) => row.food.id === food.id)
                  ? "Available offline"
                  : "Saved food"}
              </span>
              <span className="block text-xs text-muted-foreground break-words">
                {food.source}
              </span>
              {cached.find((row) => row.food.id === food.id) && (
                <span className="block text-xs text-muted-foreground">
                  {freshness(
                    cached.find((row) => row.food.id === food.id)!.retrievedAt,
                  )}
                </span>
              )}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? "No saved matches. Search the database or add a food manually."
              : "Foods downloaded from the database will appear here for offline reuse."}
          </p>
        )}
      </section>
      {!!remote.length && (
        <section aria-label="Database food matches" className="space-y-2">
          <h3 className="text-sm font-medium">
            Database results · review details before adding
          </h3>
          {remote.map((hit) => (
            <button
              key={hit.id}
              disabled={busy}
              type="button"
              className="w-full rounded-xl border p-3 text-left hover:bg-muted/50 disabled:opacity-50"
              onClick={() => void chooseRemote(hit)}
            >
              <span className="block font-medium">{hit.name}</span>
              <span className="block text-xs text-muted-foreground">
                {[hit.brand, hit.type].filter(Boolean).join(" · ")}
              </span>
            </button>
          ))}
        </section>
      )}
      {!!cached.length && !storageError && (
        <p className="text-xs text-muted-foreground">
          {cached.length} downloaded food snapshots on this device.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void clear()}
          >
            Clear offline catalog
          </button>
        </p>
      )}
    </div>
  );
}
