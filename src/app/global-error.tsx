"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portfolio:global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#071014",
          color: "#E8F6F7",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            border: "1px solid rgba(73,231,255,0.35)",
            borderRadius: 16,
            padding: 24,
            background: "#0B1E23",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, color: "#FF7B7B" }}>
            Something broke on the page.
          </h1>
          <p style={{ marginTop: 8, fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
            The app caught a runtime error before the rest of the page could render. You can
            try recovering without reloading everything.
          </p>
          {error?.digest ? (
            <p style={{ marginTop: 8, fontSize: 11, opacity: 0.6, fontFamily: "monospace" }}>
              digest: {error.digest}
            </p>
          ) : null}
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              fontSize: 11,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 240,
              overflow: "auto",
            }}
          >
            {error?.message ?? "Unknown error"}
          </pre>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                border: "1px solid #49E7FF",
                background: "transparent",
                color: "#49E7FF",
                padding: "8px 14px",
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              Try again
            </button>
            <a
              href="/hub"
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 14px",
                borderRadius: 999,
                color: "inherit",
                textDecoration: "none",
                fontSize: 12,
              }}
            >
              Go to /hub
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
