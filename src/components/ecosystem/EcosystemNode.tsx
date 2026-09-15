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
 * is carried by the border and ring as well as the hue.
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
}: EcosystemNodeProps) {
  const hue = `hsl(var(--chain-${color}))`;

  return (
    <button
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
        transform: "translate(-50%, -50%)",
      }}
      className={cn(
        "group flex min-h-[2.75rem] min-w-[5rem] flex-col items-center justify-center rounded-lg border bg-card px-2.5 py-2 text-center transition-colors",
        isActive ? "border-border-strong" : "border-border hover:border-border-strong"
      )}
    >
      <span
        aria-hidden="true"
        className="mb-1 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: hue }}
      />
      <span className="text-xs font-semibold normal-case tracking-normal text-foreground">
        {label}
      </span>
      <span className="mt-0.5 text-xs normal-case tracking-normal text-muted-foreground">
        {description}
      </span>
    </button>
  );
}
