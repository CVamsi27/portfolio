"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label?: string;
};

const SEEDED_NODES: Array<{
  rx: number;
  ry: number;
  label?: string;
}> = [
  { rx: 0.08, ry: 0.22 },
  { rx: 0.24, ry: 0.14 },
  { rx: 0.48, ry: 0.16, label: "API" },
  { rx: 0.16, ry: 0.46 },
  { rx: 0.34, ry: 0.42 },
  { rx: 0.56, ry: 0.30, label: "PG" },
  { rx: 0.68, ry: 0.18 },
  { rx: 0.86, ry: 0.26, label: "QUEUE" },
  { rx: 0.12, ry: 0.82 },
  { rx: 0.30, ry: 0.84, label: "OUTBOX" },
  { rx: 0.50, ry: 0.78, label: "WORKER" },
  { rx: 0.66, ry: 0.54, label: "RLS" },
  { rx: 0.78, ry: 0.80, label: "CI" },
  { rx: 0.91, ry: 0.56 },
];

const EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [2, 4],
  [2, 5],
  [4, 5],
  [5, 6],
  [6, 7],
  [5, 7],
  [3, 8],
  [8, 9],
  [4, 9],
  [9, 10],
  [5, 10],
  [10, 11],
  [11, 7],
  [10, 12],
  [11, 12],
  [12, 13],
  [7, 13],
];

/**
 * Serene, zero-glow architectural wireframe topology that adapts automatically
 * between Light Mode (delicate graphite lines on studio paper) and Dark Mode
 * (fine silver wireframes on carbon obsidian). No glowing dots or circles.
 */
export default function SystemsFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let rafId = 0;
    let inView = true;

    const nodes: NodePoint[] = SEEDED_NODES.map((seed, idx) => ({
      x: 0,
      y: 0,
      vx: ((idx % 3) - 1) * 0.04 + (idx % 2 === 0 ? 0.02 : -0.02),
      vy: (((idx + 1) % 3) - 1) * 0.032,
      label: seed.label,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      SEEDED_NODES.forEach((seed, i) => {
        nodes[i].x = seed.rx * width;
        nodes[i].y = seed.ry * height;
      });
    };

    const drawCrosshair = (x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.stroke();
    };

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");
      const arcStroke = isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(13, 13, 15, 0.055)";
      const edgeStroke = isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(13, 13, 15, 0.085)";
      const crossStroke = isDark
        ? "rgba(255, 255, 255, 0.26)"
        : "rgba(13, 13, 15, 0.28)";
      const labelFill = isDark
        ? "rgba(244, 243, 239, 0.22)"
        : "rgba(13, 13, 15, 0.22)";

      // Concentric architectural wireframe ellipses
      ctx.save();
      ctx.strokeStyle = arcStroke;
      ctx.lineWidth = 0.85;
      const cx = width * 0.68;
      const cy = height * 0.46;
      const baseR = Math.max(width, height) * 0.34;
      for (const mult of [0.55, 0.92, 1.3]) {
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          baseR * mult,
          baseR * mult * 0.6,
          -0.18,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      ctx.restore();

      if (animate) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const anchorX = SEEDED_NODES[i].rx * width;
          const anchorY = SEEDED_NODES[i].ry * height;
          n.x += n.vx;
          n.y += n.vy;
          if (Math.abs(n.x - anchorX) > 12) n.vx *= -1;
          if (Math.abs(n.y - anchorY) > 9) n.vy *= -1;
        }
      }

      // Fine hairline edges
      ctx.save();
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = edgeStroke;
      for (const [aIdx, bIdx] of EDGES) {
        const a = nodes[aIdx];
        const b = nodes[bIdx];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();

      // Architectural '+' crosshairs at vertices (no glowing dots)
      ctx.save();
      ctx.strokeStyle = crossStroke;
      ctx.lineWidth = 0.9;
      ctx.font =
        '400 9px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
      ctx.fillStyle = labelFill;
      const showLabels = width >= 900;
      for (const n of nodes) {
        const canLabel =
          showLabels &&
          Boolean(n.label) &&
          (n.x > width * 0.46 || n.y > height * 0.78);
        drawCrosshair(n.x, n.y, canLabel ? 3.5 : 2.2);
        if (canLabel && n.label) {
          ctx.fillText(n.label, n.x + 7, n.y + 3);
        }
      }
      ctx.restore();
    };

    resize();
    drawFrame(false);

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    const themeObserver = new MutationObserver(() => drawFrame(false));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("resize", resize);

    if (!reduceMotion) {
      const tick = () => {
        if (inView) drawFrame(true);
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      themeObserver.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
