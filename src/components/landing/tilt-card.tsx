import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/** 3D tilt-on-mouse card. Uses transforms only. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [t, setT] = useState({ rx: 0, ry: 0 });

  function onMove(e: React.MouseEvent) {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * 8, ry: px * 10 });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setT({ rx: 0, ry: 0 })}
      animate={{ rotateX: t.rx, rotateY: t.ry }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      style={{ transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
