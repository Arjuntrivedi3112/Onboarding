import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface EcosystemNodeProps {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  /** Chain actor key — selects the data-encoding hue for this node. */
  color: string;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  /** Entrance stagger, in seconds. */
  delay?: number;
  /** Another node is highlighted and this one isn't connected to it. */
  dimmed?: boolean;
  /** Connected to the highlighted node. */
  linked?: boolean;
}

/**
 * One actor on the ecosystem map.
 *
 * A real button, not a div with a handler: these nine nodes are the only route
 * from the map into the sections that explain them, so a pointer-only
 * implementation made that content unreachable by keyboard. Focus mirrors
 * hover, so tabbing through the map reveals the same detail as pointing at it.
 *
 * Colour comes from the chain scale, which encodes supply-chain position. It
 * is never the only signal — the label is always present, and the active state
 * is carried by the border and ring as well as the hue. The node springs in on
 * load, its hue dot breathes, and the active node pulses; all looping motion
 * stops under reduced motion.
 */
export function EcosystemNode({
  id,
  label,
  description,
  x,
  y,
  color,
  isActive,
  onHover,
  onClick,
  delay = 0,
  dimmed = false,
  linked = false,
}: EcosystemNodeProps) {
  const reduce = useReducedMotion();
  const tone = `var(--chain-${color})`;
  const hue = `hsl(${tone})`;

  return (
    <motion.button
      type="button"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      onClick={onClick}
      aria-label={`${label} — ${description}. Open the section that explains it.`}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        x: "-50%",
        y: "-50%",
        borderColor: isActive || linked ? hue : undefined,
        boxShadow: isActive
          ? `0 0 0 4px hsl(${tone} / 0.18), 0 0 28px hsl(${tone} / 0.5)`
          : linked
            ? `0 0 16px hsl(${tone} / 0.3)`
            : `0 1px 2px hsl(var(--foreground) / 0.06)`,
      }}
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: dimmed ? 0.45 : 1, scale: isActive ? 1.08 : 1 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={{ delay: reduce ? 0 : delay, type: "spring", stiffness: 260, damping: 20, opacity: { duration: 0.2 } }}
      className={cn(
        "group z-10 flex min-h-[2.75rem] min-w-[4.75rem] flex-col items-center justify-center rounded-lg border bg-card px-2.5 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-w-[5rem]",
        isActive ? "border-border-strong" : "border-border hover:border-border-strong",
      )}
    >
      {/* Gradient wash in the node's hue */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(160deg, hsl(${tone} / 0.14), transparent 70%)` }}
      />

      {/* Pulse ring while active */}
      {isActive && !reduce && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg border-2"
          style={{ borderColor: hue }}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      <motion.span
        aria-hidden="true"
        className="relative mb-1 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: hue, boxShadow: `0 0 8px ${hue}` }}
        animate={reduce ? undefined : { scale: [1, 1.8, 1], opacity: [1, 0.6, 1] }}
        transition={reduce ? undefined : { duration: 2.4, delay: delay * 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative text-xs font-semibold normal-case tracking-normal text-foreground">{label}</span>
      <span className="relative mt-0.5 text-xs normal-case tracking-normal text-muted-foreground">{description}</span>
    </motion.button>
  );
}
