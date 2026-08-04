import { useEffect, useRef } from "react";

/**
 * Animated "ledger threads" — gold lines drifting across a dark canvas with
 * sparse coin-like particles. Pure canvas (transform/opacity only on the host),
 * pauses when offscreen and respects prefers-reduced-motion.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    type Thread = { y: number; speed: number; amp: number; phase: number; alpha: number; hue: string };
    type Spark = { x: number; y: number; r: number; vy: number; a: number };
    let threads: Thread[] = [];
    let sparks: Spark[] = [];

    function seed() {
      const rows = Math.max(6, Math.round(h / 90));
      threads = Array.from({ length: rows }, (_, i) => ({
        y: (h / rows) * i + Math.random() * 20,
        speed: 0.15 + Math.random() * 0.5,
        amp: 8 + Math.random() * 26,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.08 + Math.random() * 0.22,
        hue: i % 5 === 0 ? "46, 163, 106" : "226, 182, 76",
      }));
      sparks = Array.from({ length: reduced ? 0 : 34 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.8,
        vy: -(0.08 + Math.random() * 0.35),
        a: 0.15 + Math.random() * 0.5,
      }));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);

      // flowing ledger threads
      for (const th of threads) {
        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(${th.hue}, ${th.alpha})`;
        ctx!.lineWidth = 1;
        for (let x = 0; x <= w; x += 12) {
          const y = th.y + Math.sin(x / 160 + th.phase + t * 0.0004 * th.speed * 6) * th.amp;
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      // drifting gold sparks
      for (const s of sparks) {
        s.y += s.vy;
        if (s.y < -10) {
          s.y = h + 10;
          s.x = Math.random() * w;
        }
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(246, 218, 147, ${s.a})`;
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    if (reduced) {
      draw(0);
      return () => window.removeEventListener("resize", onResize);
    }

    let raf = 0;
    let running = true;
    const loop = (t: number) => {
      if (running) draw(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
