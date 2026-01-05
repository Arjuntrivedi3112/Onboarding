import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EcosystemNodeProps {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  color: string;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  delay: number;
}

const colorMap: Record<string, string> = {
  advertiser: "from-amber-500 to-orange-600",
  dsp: "from-cyan-400 to-blue-500",
  exchange: "from-purple-500 to-pink-500",
  ssp: "from-emerald-400 to-green-500",
  publisher: "from-rose-400 to-pink-500",
  user: "from-blue-400 to-indigo-500",
};

const glowMap: Record<string, string> = {
  advertiser: "shadow-amber-500/30",
  dsp: "shadow-cyan-400/30",
  exchange: "shadow-purple-500/30",
  ssp: "shadow-emerald-400/30",
  publisher: "shadow-rose-400/30",
  user: "shadow-blue-400/30",
};

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
  delay,
}: EcosystemNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className="cursor-pointer group"
    >
      {/* Pulse ring on active */}
      {isActive && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-br",
            colorMap[color]
          )}
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Main node - more compact design */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative px-3 py-2 rounded-xl bg-card border transition-all duration-300",
          isActive
            ? `border-transparent shadow-lg ${glowMap[color]}`
            : "border-border hover:border-muted-foreground/30"
        )}
      >
        {/* Gradient overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
            colorMap[color]
          )}
        />

        {/* Content - compact */}
        <div className="relative z-10 text-center whitespace-nowrap">
          <div
            className={cn(
              "w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br flex items-center justify-center",
              colorMap[color]
            )}
          >
            <span className="text-sm font-bold text-white">
              {label.charAt(0)}
            </span>
          </div>
          <h3 className="font-display font-semibold text-xs text-foreground">
            {label}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
      </motion.div>

      {/* Tooltip on hover */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass rounded-lg px-2 py-1 whitespace-nowrap z-20"
        >
          <p className="text-[10px] text-primary">Click to explore →</p>
        </motion.div>
      )}
    </motion.div>
  );
}
