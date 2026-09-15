import { CHAIN_ACTORS, type ChainActorId } from "@/curriculum/chain";
import { cn } from "@/lib/utils";

interface ChainRailProps {
  /**
   * The links this lesson is about. Everything else is dimmed. An empty array
   * means the whole chain is relevant, so nothing dims.
   */
  focus?: ChainActorId[];
  className?: string;
}

/**
 * The chain rail — the one element present in every lesson of every section.
 *
 * The nine actors sit at fixed positions that never move, so the rail is
 * simultaneously the product's signature, the mental model it teaches, and a
 * breadcrumb telling the learner which link of the chain they are inside.
 *
 * The 100ms marker at the right end is the point: the entire supply chain
 * settles inside a tenth of a second, which is the one constraint no other
 * supply chain has.
 *
 * Chain hues appear here and in the ecosystem map, and nowhere else. Focus is
 * never carried by colour alone — dimmed actors also drop their weight and
 * the whole rail is summarised for screen readers.
 */
export function ChainRail({ focus = [], className }: ChainRailProps) {
  const focusesAll = focus.length === 0;
  const isFocused = (id: ChainActorId) => focusesAll || focus.includes(id);

  const focusLabel = focusesAll
    ? "This lesson covers the whole supply chain."
    : `This lesson covers ${CHAIN_ACTORS.filter((a) => focus.includes(a.id))
        .map((a) => a.label)
        .join(", ")}.`;

  return (
    <div
      className={cn("border-y border-border py-3", className)}
      role="img"
      aria-label={`The advertising supply chain, from advertiser to user. ${focusLabel}`}
    >
      <ol className="flex items-start justify-between gap-1" aria-hidden="true">
        {CHAIN_ACTORS.map((actor) => {
          const active = isFocused(actor.id);
          return (
            <li key={actor.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full transition-opacity",
                  active ? "opacity-100" : "opacity-25"
                )}
                style={{ backgroundColor: `hsl(var(${actor.token}))` }}
              />
              <span
                className={cn(
                  "figure truncate text-[0.6875rem] uppercase tracking-wider",
                  active ? "text-foreground" : "text-muted-foreground opacity-60"
                )}
              >
                {actor.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-xs uppercase text-muted-foreground">Supply chain</span>
        <span className="figure text-xs text-muted-foreground">
          settles in <span className="text-foreground">100 ms</span>
        </span>
      </div>
    </div>
  );
}
