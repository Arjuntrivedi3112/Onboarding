import { motion } from "framer-motion";

interface DataFlowLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  isActive: boolean;
  dashed?: boolean;
  delay: number;
}

export function DataFlowLine({
  x1,
  y1,
  x2,
  y2,
  label,
  isActive,
  dashed = false,
  delay,
}: DataFlowLineProps) {
  // Calculate control points for curved line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const curve = 5; // Slight curve amount
  
  // Control point offset based on direction
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const normalX = -dy / length;
  const normalY = dx / length;
  
  const ctrlX = midX + normalX * curve;
  const ctrlY = midY + normalY * curve;

  const pathD = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;

  return (
    <g>
      {/* Background line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={dashed ? "4 4" : "none"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay, duration: 0.8, ease: "easeOut" }}
        style={{
          filter: isActive ? "drop-shadow(0 0 8px hsl(var(--primary)))" : "none",
        }}
      />

      {/* Animated flow dots */}
      {isActive && (
        <motion.circle
          r={3}
          fill="hsl(var(--primary))"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            offsetPath: `path("${pathD}")`,
            filter: "drop-shadow(0 0 6px hsl(var(--primary)))",
          }}
        />
      )}

      {/* Label */}
      {isActive && (
        <motion.text
          x={`${midX}%`}
          y={`${midY - 3}%`}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize="10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
        >
          {label}
        </motion.text>
      )}
    </g>
  );
}
