"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label?: string;
  accent?: "blue" | "amber" | "violet";
  radius: number;
};

type Pulse = {
  from: number;
  to: number;
  t: number;
  speed: number;
  color: string;
};

const SEEDED_NODES: Array<{
  rx: number;
  ry: number;
  label?: string;
  accent?: "blue" | "amber" | "violet";
}> = [
  { rx: 0.08, ry: 0.22, label: "EDGE", accent: "blue" },
  { rx: 0.24, ry: 0.14 },
  { rx: 0.42, ry: 0.18, label: "API", accent: "blue" },
  { rx: 0.16, ry: 0.46 },
  { rx: 0.34, ry: 0.42, label: "RLS", accent: "amber" },
  { rx: 0.54, ry: 0.32, label: "PG", accent: "violet" },
  { rx: 0.68, ry: 0.18 },
  { rx: 0.84, ry: 0.28, label: "QUEUE", accent: "blue" },
  { rx: 0.12, ry: 0.76 },
  { rx: 0.29, ry: 0.72, label: "OUTBOX", accent: "amber" },
  { rx: 0.48, ry: 0.64, label: "WORKER", accent: "blue" },
  { rx: 0.66, ry: 0.54 },
  { rx: 0.78, ry: 0.74, label: "CI", accent: "violet" },
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
 * Lightweight, HiDPI spatial network field inspired by precision systems telemetry
 * (wireframe great-arcs, subtle service nodes, and slow signal pulses).
 * Automatically respects prefers-reduced-motion and pauses when scrolled offscreen.
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
      vx: ((idx % 3) - 1) * 0.08 + (idx % 2 === 0 ? 0.04 : -0.04),
      vy: (((idx + 1) % 3) - 1) * 0.06,
      label: seed.label,
      accent: seed.accent,
      radius: seed.label ? 2.8 : 1.7,
    }));

    const pulses: Pulse[] = [
      { from: 0, to: 2, t: 0.1, speed: 0.0042, color: "rgba(96, 165, 250, 0.9)" },
      { from: 2, to: 4, t: 0.45, speed: 0.0036, color: "rgba(251, 146, 60, 0.9)" },
      { from: 4, to: 5, t: 0.72, speed: 0.0038, color: "rgba(167, 139, 250, 0.85)" },
      { from: 5, to: 10, t: 0.25, speed: 0.0034, color: "rgba(96, 165, 250, 0.85)" },
      { from: 9, to: 10, t: 0.6, speed: 0.004, color: "rgba(251, 146, 60, 0.85)" },
      { from: 10, to: 12, t: 0.85, speed: 0.0032, color: "rgba(129, 140, 248, 0.85)" },
    ];

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

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural coordinate arcs (great-circle feel)
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.075)";
      ctx.lineWidth = 1;
      const cx = width * 0.72;
      const cy = height * 0.46;
      const baseR = Math.max(width, height) * 0.34;
      for (const mult of [0.65, 1.0, 1.38]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, baseR * mult, baseR * mult * 0.62, -0.22, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Drift nodes gently around their anchor coordinates
      if (animate) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const anchorX = SEEDED_NODES[i].rx * width;
          const anchorY = SEEDED_NODES[i].ry * height;
          n.x += n.vx;
          n.y += n.vy;
          if (Math.abs(n.x - anchorX) > 16) n.vx *= -1;
          if (Math.abs(n.y - anchorY) > 12) n.vy *= -1;
        }
      }

      // Draw curved telemetry edges
      ctx.save();
      ctx.lineWidth = 0.85;
      for (const [aIdx, bIdx] of EDGES) {
        const a = nodes[aIdx];
        const b = nodes[bIdx];
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2 - 14;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.13)";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(midX, midY, b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw traveling signal pulses along arcs
      for (const p of pulses) {
        if (animate) {
          p.t += p.speed;
          if (p.t >= 1) {
            p.t = 0;
            const nextEdge =
              EDGES.find(([from]) => from === p.to) ??
              EDGES[(p.from + p.to + 3) % EDGES.length];
            p.from = nextEdge[0];
            p.to = nextEdge[1];
          }
        }
        const a = nodes[p.from];
        const b = nodes[p.to];
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2 - 14;
        const u = 1 - p.t;
        const px = u * u * a.x + 2 * u * p.t * midX + p.t * p.t * b.x;
        const py = u * u * a.y + 2 * u * p.t * midY + p.t * p.t * b.y;

        ctx.save();
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 10);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw nodes and crisp monospace system tags
      ctx.save();
      ctx.font = '600 9px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';
      for (const n of nodes) {
        const fill =
          n.accent === "amber"
            ? "rgba(251, 146, 60, 0.9)"
            : n.accent === "violet"
              ? "rgba(167, 139, 250, 0.85)"
              : "rgba(96, 165, 250, 0.85)";
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        if (n.label) {
          ctx.strokeStyle = fill.replace(/0\.\d+\)/, "0.28)");
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(226, 232, 240, 0.36)";
          ctx.fillText(n.label, n.x + 8, n.y + 3);
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
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-75"
    />
  );
}
