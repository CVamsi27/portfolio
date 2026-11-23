"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label?: string;
  signal?: boolean;
  radius: number;
};

type Pulse = {
  from: number;
  to: number;
  t: number;
  speed: number;
  scarlet: boolean;
};

const SEEDED_NODES: Array<{
  rx: number;
  ry: number;
  label?: string;
  signal?: boolean;
}> = [
  { rx: 0.08, ry: 0.22, label: "EDGE" },
  { rx: 0.24, ry: 0.14 },
  { rx: 0.42, ry: 0.18, label: "API", signal: true },
  { rx: 0.16, ry: 0.46 },
  { rx: 0.34, ry: 0.42, label: "RLS", signal: true },
  { rx: 0.54, ry: 0.32, label: "PG" },
  { rx: 0.68, ry: 0.18 },
  { rx: 0.84, ry: 0.28, label: "QUEUE" },
  { rx: 0.12, ry: 0.76 },
  { rx: 0.29, ry: 0.72, label: "OUTBOX", signal: true },
  { rx: 0.48, ry: 0.64, label: "WORKER" },
  { rx: 0.66, ry: 0.54 },
  { rx: 0.78, ry: 0.74, label: "CI" },
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
 * Monochrome architectural wireframe topology with surgical scarlet active telemetry pulses.
 * Respects prefers-reduced-motion and pauses when scrolled offscreen.
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
      vx: ((idx % 3) - 1) * 0.055 + (idx % 2 === 0 ? 0.03 : -0.03),
      vy: (((idx + 1) % 3) - 1) * 0.045,
      label: seed.label,
      signal: seed.signal,
      radius: seed.signal ? 2.6 : seed.label ? 2.0 : 1.35,
    }));

    const pulses: Pulse[] = [
      { from: 0, to: 2, t: 0.1, speed: 0.0036, scarlet: true },
      { from: 2, to: 4, t: 0.45, speed: 0.0031, scarlet: false },
      { from: 4, to: 5, t: 0.72, speed: 0.0034, scarlet: true },
      { from: 5, to: 10, t: 0.25, speed: 0.0029, scarlet: false },
      { from: 9, to: 10, t: 0.6, speed: 0.0035, scarlet: true },
      { from: 10, to: 12, t: 0.85, speed: 0.0028, scarlet: false },
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

      // Architectural concentric coordinate wireframes
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
      ctx.lineWidth = 1;
      const cx = width * 0.7;
      const cy = height * 0.48;
      const baseR = Math.max(width, height) * 0.34;
      for (const mult of [0.55, 0.9, 1.28]) {
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          baseR * mult,
          baseR * mult * 0.62,
          -0.2,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      ctx.restore();

      // Gentle drift around anchors
      if (animate) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const anchorX = SEEDED_NODES[i].rx * width;
          const anchorY = SEEDED_NODES[i].ry * height;
          n.x += n.vx;
          n.y += n.vy;
          if (Math.abs(n.x - anchorX) > 14) n.vx *= -1;
          if (Math.abs(n.y - anchorY) > 10) n.vy *= -1;
        }
      }

      // Crisp straight hairline edges
      ctx.save();
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.095)";
      for (const [aIdx, bIdx] of EDGES) {
        const a = nodes[aIdx];
        const b = nodes[bIdx];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();

      // Traveling monochrome + surgical scarlet signal nodes
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
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;

        ctx.save();
        ctx.fillStyle = p.scarlet ? "#ff3b2f" : "rgba(244, 243, 238, 0.85)";
        ctx.beginPath();
        ctx.arc(px, py, p.scarlet ? 2.2 : 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (p.scarlet) {
          ctx.strokeStyle = "rgba(255, 59, 47, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Crisp monochrome + scarlet nodes with monospace labels
      ctx.save();
      ctx.font =
        '500 9px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
      for (const n of nodes) {
        ctx.fillStyle = n.signal ? "#ff3b2f" : "rgba(244, 243, 238, 0.55)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        if (n.label) {
          if (n.signal) {
            ctx.strokeStyle = "rgba(255, 59, 47, 0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = n.signal
            ? "rgba(244, 243, 238, 0.58)"
            : "rgba(244, 243, 238, 0.28)";
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
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
    />
  );
}
