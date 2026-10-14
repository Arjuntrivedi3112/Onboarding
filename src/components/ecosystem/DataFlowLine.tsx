import { motion, useReducedMotion } from "framer-motion";

interface DataFlowLineProps {
  /** Endpoints in the parent SVG's pixel space. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  isActive: boolean;
  dashed?: boolean;
  delay: number;
  /** Dim the line while a node it doesn't touch is highlighted. */
  dimmed?: boolean;
  /** CSS colour channels (e.g. "var(--chain-dsp)") of the node the data leaves from. */
  tone?: string;
  /**
   * "line" draws the path and packets (behind the nodes); "label" draws only
   * the active line's label, for an overlay above the nodes so it stays legible.
   */
  layer?: "line" | "label";
}

/** A point on the quadratic curve at t (0–1). */
function quad(p0: number, c: number, p1: number, t: number) {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * c + t * t * p1;
}

/**
 * One connection on the ecosystem map: a gently curved line that draws in on
 * load, with data packets travelling from source to destination. Packets are
 * always gently flowing; hovering either end brightens the line, speeds the
 * packets up and shows what travels along it. Every loop stops under reduced
 * motion — the line and its label remain.
 */
export function DataFlowLine({
  x1,
  y1,
  x2,
  y2,
  label,
  isActive,
  dashed = false,
  delay,
  dimmed = false,
  tone = "var(--primary)",
  layer = "line",
}: DataFlowLineProps) {
  const reduce = useReducedMotion();

  // Control point: offset from the midpoint along the normal for a slight curve.
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const curve = Math.min(28, length * 0.12);
  const ctrlX = midX + (-dy / length) * curve;
  const ctrlY = midY + (dx / length) * curve;
  const pathD = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;

  // Sample the curve so packets follow it exactly.
  const samples = Array.from({ length: 13 }, (_, i) => i / 12);
  const cx = samples.map((t) => quad(x1, ctrlX, x2, t));
  const cy = samples.map((t) => quad(y1, ctrlY, y2, t));
  const labelX = quad(x1, ctrlX, x2, 0.5);
  // Near-horizontal links sit between nodes on the same row, so lift their label clear of the nodes.
  const labelY = quad(y1, ctrlY, y2, 0.5) - (Math.abs(dy) < 40 ? 46 : 0);

  const packetColour = isActive ? "var(--primary)" : tone;
  const packets = isActive ? 3 : 1;
  const duration = isActive ? 1.6 : 3.2;

  if (layer === "label") {
    if (!isActive) return null;
    const w = label.length * 7 + 16;
    return (
      <motion.g initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <rect x={labelX - w / 2} y={labelY - 11} width={w} height={22} rx={11} fill="hsl(var(--card))" stroke="hsl(var(--primary) / 0.6)" />
        <text x={labelX} y={labelY + 4} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={12}>
          {label}
        </text>
      </motion.g>
    );
  }

  return (
    <g style={{ opacity: dimmed ? 0.3 : 1, transition: "opacity 200ms" }}>
      {/* Soft glow under an active line */}
      {isActive && <path d={pathD} fill="none" stroke="hsl(var(--primary) / 0.25)" strokeWidth={8} strokeLinecap="round" />}
      <motion.path
        d={pathD}
        fill="none"
        stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--rule-strong) / 0.55)"}
        strokeWidth={isActive ? 2.5 : 1.5}
        strokeLinecap="round"
        strokeDasharray={dashed ? "5 6" : undefined}
        // pathLength drives stroke-dasharray, so dashed lines fade in instead of drawing.
        initial={reduce ? false : dashed ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
        animate={dashed ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
        transition={{ delay: reduce ? 0 : delay, duration: 0.8, ease: "easeOut" }}
      />

      {/* Data packets */}
      {!reduce &&
        Array.from({ length: packets }, (_, i) => (
          <motion.circle
            key={`${isActive ? "a" : "i"}${i}`}
            r={isActive ? 4 : 3}
            fill={`hsl(${packetColour})`}
            style={{ filter: `drop-shadow(0 0 ${isActive ? 6 : 3}px hsl(${packetColour} / 0.9))` }}
            initial={{ cx: x1, cy: y1, opacity: 0 }}
            animate={{ cx, cy, opacity: [0, 1, 1, 1, 0] }}
            transition={{
              duration,
              delay: (isActive ? i * (duration / packets) : delay + 0.8) % 6,
              repeat: Infinity,
              repeatDelay: isActive ? 0 : 1.2,
              ease: "linear",
            }}
          />
        ))}
    </g>
  );
}
