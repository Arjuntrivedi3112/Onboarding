import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/** A number that counts smoothly to its new value (instantly under reduced motion). */
export function AnimatedNumber({ value, format, duration = 0.6 }: { value: number; format: (v: number) => string; duration?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce) {
      from.current = value;
      setShown(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        from.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [value, reduce, duration]);

  return <>{format(shown)}</>;
}
