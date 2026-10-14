import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Tween a number towards `target` (ease-out), jumping straight there under reduced motion. */
export function useCountUp(target: number, duration = 600): number {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (reduce || !Number.isFinite(target)) {
      current.current = target;
      setShown(target);
      return;
    }
    const from = current.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const v = from + (target - from) * (1 - Math.pow(1 - k, 3));
      current.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  return shown;
}

export function CountUp({ value, format, duration }: { value: number; format: (v: number) => string; duration?: number }) {
  const shown = useCountUp(value, duration);
  return <>{format(shown)}</>;
}
