"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth, currentAuthUserId } from "@/lib/auth-store";
import { getSupabase } from "@/lib/supabase/client";
import {
  importedHealthProgress,
  type ImportedReading,
  type HealthSourceSelection,
} from "@/lib/imported-health-progress";
import { Button } from "@/components/ui/button";
import TrendChart from "./TrendChart";
export default function ImportedHealthTrends(props: {
  from: string;
  to: string;
}) {
  const { user, configured } = useAuth();
  return (
    <SourceTrends
      key={configured ? (user?.id ?? "signed-out") : "local"}
      {...props}
    />
  );
}
function SourceTrends({ from, to }: { from: string; to: string }) {
  const [open, setOpen] = useState(false),
    [records, setRecords] = useState<ImportedReading[]>([]),
    [loading, setLoading] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [sources, setSources] = useState<HealthSourceSelection>({});
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    if (!open) return;
    const current = ++generation.current;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setLoaded(false);
    setRecords([]);
    void (async () => {
      try {
        const owner = currentAuthUserId();
        const session = await getSupabase()?.auth.getSession();
        const all: ImportedReading[] = [];
        let offset = 0;
        while (true) {
          if (current !== generation.current || currentAuthUserId() !== owner)
            return;
          const response = await fetch(
            `/api/health-connect/records?from=${from}&to=${to}&limit=100&offset=${offset}`,
            {
              cache: "no-store",
              signal: controller.signal,
              headers: session?.data.session
                ? {
                    Authorization: `Bearer ${session.data.session.access_token}`,
                  }
                : {},
            },
          );
          const data = await response.json();
          if (!response.ok)
            throw Error(data.error ?? "Imported health records unavailable.");
          if (
            !Array.isArray(data.records) ||
            !Number.isInteger(data.total) ||
            data.total < 0
          )
            throw Error("Health records returned an invalid page.");
          all.push(...data.records);
          offset += data.records.length;
          if (offset >= data.total) break;
          if (!data.records.length || offset > 10000)
            throw Error(
              "Too many records to display safely. Choose a shorter range.",
            );
        }
        if (current === generation.current && currentAuthUserId() === owner) {
          setRecords(all);
          setLoaded(true);
        }
      } catch (cause) {
        if (current === generation.current && !controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load imported records.",
          );
      } finally {
        if (current === generation.current) setLoading(false);
      }
    })();
    return () => {
      controller.abort();
      generation.current = current + 1;
    };
  }, [open, from, to, retry]);
  const data = importedHealthProgress(records, from, to, sources);
  const metrics = [
    ["weight", "Weight", "kg"],
    ["steps", "Daily steps", "steps"],
    ["sleep", "Recorded sleep duration", "minutes"],
  ] as const;
  return (
    <section
      className="workspace-panel space-y-4"
      aria-label="Imported health progress"
    >
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2>Android health progress</h2>
        <Button
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Hide imported trends" : "View imported trends"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Choose one source per metric. Imported records stay separate from manual
        logs; daily step aggregates from different devices are not added
        together.
      </p>
      {open && (
        <>
          {loading && <p role="status">Loading imported health records…</p>}
          {error && (
            <div className="space-y-2">
              <p role="alert">{error}</p>
              <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
                Retry imported records
              </Button>
            </div>
          )}
          {loaded && !records.length && (
            <p>
              No imported records in this range. Pair your phone in{" "}
              <a className="underline" href="/health?view=connections">
                Health connections
              </a>
              .
            </p>
          )}
          {loaded &&
            records.length > 0 &&
            metrics.map(([key, label, unit]) => (
              <div key={key} className="space-y-3 border-t border-border pt-4">
                <label className="block text-sm">
                  {label} source
                  <select
                    className="mt-1 block w-full rounded-lg border bg-background p-3"
                    value={data.chosen[key]}
                    onChange={(e) =>
                      setSources((v) => ({ ...v, [key]: e.target.value }))
                    }
                  >
                    {data.chosen[key] &&
                      !data.options[key].includes(data.chosen[key]) && (
                        <option value={data.chosen[key]}>
                          {data.chosen[key]} · no records in this range
                        </option>
                      )}
                    {!data.options[key].length && !data.chosen[key] && (
                      <option value="">No source records</option>
                    )}
                    {data.options[key].map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </label>
                {data[key].some((point) => point.value !== null) ? (
                  <TrendChart
                    points={data[key]}
                    label={`Imported ${label.toLowerCase()}`}
                    unit={unit}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No usable imported {label.toLowerCase()} readings for this
                    source in this range.
                  </p>
                )}
              </div>
            ))}
          {data.notes.map((note) => (
            <p key={note} className="text-sm text-muted-foreground">
              {note}
            </p>
          ))}
        </>
      )}
    </section>
  );
}
