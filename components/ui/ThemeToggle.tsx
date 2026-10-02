"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";
import { useTheme } from "@/lib/useTheme";

// Logical canvas px — drawn inside the button's existing size-10 (40px)
// chip, not a new footprint, so this drops into Navbar/AuthShell/
// DashboardShell's headers with zero layout risk.
const SIZE = 34;
const DURATION = 900;
// Fraction of DURATION at which the real theme actually flips — partway
// through the drop, once the icon visually reads as "gone into the hole,"
// not after the whole sequence finishes.
const FLIP_AT = 0.45;

const GROUND_Y = SIZE * 0.78;
const HOLE_CX = SIZE * 0.6;
const HOLE_RX = SIZE * 0.24;
const HOLE_RY = SIZE * 0.08;
const REST_X = SIZE * 0.34;
const REST_Y = SIZE * 0.4;
const ICON_R = SIZE * 0.14;
const STICK_X = SIZE * 0.2;

function easeInCubic(t: number) {
  return t * t * t;
}
function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

type Direction = "toDark" | "toLight";
type Theme = "dark" | "light";
type AnimState = { direction: Direction; progress: number } | null;

/**
 * The whole scene: ground, hole, a minimal stickman, and whichever icon is
 * in play — drawn fresh every frame in logical `SIZE`-space (the caller
 * applies one devicePixelRatio `ctx.scale` up front and never resets it).
 * No physics engine — "weighty" comes from the easing curves themselves
 * (fast-accelerating drop, overshoot-settle rise), same hand-rolled-motion
 * approach as `TruckIllustration`'s wheel-spin elsewhere in this codebase.
 */
function drawScene(ctx: CanvasRenderingContext2D, color: string, theme: Theme, anim: AnimState) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SIZE * 0.08, GROUND_Y);
  ctx.lineTo(SIZE * 0.95, GROUND_Y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(HOLE_CX, GROUND_Y, HOLE_RX, HOLE_RY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Default (idle): current theme's icon resting beside the stickman.
  let iconTheme: Theme = theme;
  let x = REST_X;
  let y = REST_Y;
  let scale = 1;
  let armLean = 0;

  if (anim) {
    const { direction, progress } = anim;
    const droppingTheme: Theme = direction === "toDark" ? "light" : "dark";
    const risingTheme: Theme = direction === "toDark" ? "dark" : "light";

    if (progress < 0.5) {
      const t = easeInCubic(progress / 0.5);
      iconTheme = droppingTheme;
      x = REST_X + (HOLE_CX - REST_X) * t;
      y = REST_Y + (GROUND_Y - REST_Y) * t;
      scale = 1 - 0.9 * t;
      armLean = Math.min(1, progress / 0.25);
    } else {
      const t = (progress - 0.5) / 0.5;
      const rise = easeOutBack(t);
      iconTheme = risingTheme;
      x = HOLE_CX + (REST_X - HOLE_CX) * Math.min(1, t * 1.15);
      y = GROUND_Y + (REST_Y - GROUND_Y) * rise;
      scale = Math.max(0.1, Math.min(1.08, 0.1 + 0.98 * rise));
      armLean = 1 - Math.min(1, t / 0.6);
    }
  }

  // Stickman — head, body, legs, one arm that leans toward the hole mid-push.
  const hipY = GROUND_Y;
  const headY = GROUND_Y - SIZE * 0.34;
  const bodyTopY = headY + SIZE * 0.08;

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.25;

  ctx.beginPath();
  ctx.arc(STICK_X, headY, SIZE * 0.06, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(STICK_X, bodyTopY);
  ctx.lineTo(STICK_X, hipY - SIZE * 0.12);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(STICK_X, hipY - SIZE * 0.12);
  ctx.lineTo(STICK_X - SIZE * 0.07, hipY);
  ctx.moveTo(STICK_X, hipY - SIZE * 0.12);
  ctx.lineTo(STICK_X + SIZE * 0.07, hipY);
  ctx.stroke();

  const armStartX = STICK_X + SIZE * 0.01;
  const armStartY = bodyTopY + SIZE * 0.08;
  const armEndX = armStartX + (HOLE_CX - armStartX) * (0.28 + 0.2 * armLean);
  const armEndY = armStartY + SIZE * 0.05 * armLean;
  ctx.beginPath();
  ctx.moveTo(armStartX, armStartY);
  ctx.lineTo(armEndX, armEndY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Icon — sun (flat brand yellow + rays) or moon (a crescent cut from a
  // solid disc via destination-out, so it reads correctly over any button
  // background without needing a separate "shadow" color).
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (iconTheme === "light") {
    ctx.fillStyle = "#FCB435";
    ctx.strokeStyle = "#FCB435";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, ICON_R, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      const r1 = ICON_R * 1.35;
      const r2 = ICON_R * 1.75;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, ICON_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(ICON_R * 0.55, -ICON_R * 0.35, ICON_R * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

export function ThemeToggle({ dark = false, className }: { dark?: boolean; className?: string }) {
  const [theme, setTheme] = useTheme();
  const reducedMotion = useSettledReducedMotion();
  const isLight = theme === "light";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
  }, []);

  // Idle redraw on mount and whenever the theme changes from outside an
  // in-flight animation (e.g. flipped from a toggle on another page, via
  // `useTheme`'s shared store) — bails out while `handleClick`'s own loop
  // owns drawing.
  useEffect(() => {
    if (animatingRef.current) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    drawScene(ctx, getComputedStyle(canvas).color, theme, null);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleClick() {
    if (animatingRef.current) return;
    const next: Theme = isLight ? "dark" : "light";

    if (reducedMotion) {
      setTheme(next);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) {
      setTheme(next);
      return;
    }

    // Narrowed via the guard above, but TS doesn't carry that narrowing into
    // the nested `tick` function declaration below — these two are known
    // non-null for the lifetime of this click's animation regardless.
    const canvasEl = canvas;
    const ctx2d = ctx;

    const direction: Direction = next === "dark" ? "toDark" : "toLight";
    let color = getComputedStyle(canvasEl).color;
    let flipped = false;
    animatingRef.current = true;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / DURATION);
      if (!flipped && progress >= FLIP_AT) {
        flipped = true;
        setTheme(next);
        // `setTheme` flips `data-theme` on <html> synchronously, so the
        // token this color is built from (e.g. --color-mist) has already
        // changed — re-read it so the rest of the animation uses the new
        // theme's color instead of lagging a frame behind.
        color = getComputedStyle(canvasEl).color;
      }
      drawScene(ctx2d, color, theme, { direction, progress });
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        animatingRef.current = false;
        rafRef.current = null;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={isLight}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl border transition-colors duration-300",
        dark
          ? "border-black/15 bg-black/5 text-black/70 hover:border-black/30 hover:text-black"
          : "border-edge/10 bg-edge/[0.03] text-mist hover:border-brand/40 hover:text-brand",
        className,
      )}
    >
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none block" />
    </button>
  );
}
