import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical, Trophy } from "lucide-react";

import type { SimulationDefinition } from "@/simulations/types";

/** "See it in action" link from reading to the matching Lab simulator. */
export function LabCallout({ sim, passed, compact = false }: { sim: SimulationDefinition; passed: boolean; compact?: boolean }) {
  return (
    <Link
      to={`/lab/${sim.id}`}
      className="interactive shadow-card mb-10 flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-5 hover:border-primary/60"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary" aria-hidden="true">
        {passed ? <Trophy className="h-5 w-5" /> : <FlaskConical className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs uppercase text-muted-foreground">{compact ? "Try it in the Lab" : "See it in action"}</span>
        <span className="mt-0.5 block text-foreground">{sim.title}</span>
        {!compact && <span className="mt-0.5 block text-sm text-muted-foreground">{sim.tagline}</span>}
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-sm text-primary sm:inline-flex">
        {passed ? "Play again" : "Open simulator"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
