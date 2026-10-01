"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portfolio:app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6">
      <Card variant="dossier">
        <CardContent className="space-y-3 p-6">
          <h1 className="font-display text-xl font-bold text-rose-400">
            That section crashed.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A runtime error happened on this page. The rest of the site is unaffected —
            try recovering, or jump to a different surface while we hold the broken piece
            aside.
          </p>
          {error?.digest ? (
            <p className="font-mono text-[11px] text-muted-foreground">digest: {error.digest}</p>
          ) : null}
          <details className="rounded-lg border border-border/40 bg-muted/30 p-3 text-xs">
            <summary className="cursor-pointer font-semibold">Show error</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
              {error?.message ?? "Unknown error"}
            </pre>
          </details>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/25 transition-colors"
            >
              Try again
            </button>
            <a
              href="/hub"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors"
            >
              Go to /hub
            </a>
            <a
              href="/roadmap"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/50 transition-colors"
            >
              Go to /roadmap
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
