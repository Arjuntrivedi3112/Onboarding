import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock, FlaskConical, Trophy } from "lucide-react";

import { curriculum, findSection } from "@/curriculum";
import { useSimProgress } from "@/hooks/useSimProgress";
import { cn } from "@/lib/utils";
import { SIMULATIONS } from "@/simulations/registry";
import { SupplyChainPulse } from "@/simulations/visuals/SupplyChainPulse";

/** The Simulation Lab gallery: every simulator, grouped like the book. */
export default function LabPage() {
  const { progress } = useSimProgress();
  const explored = SIMULATIONS.filter((s) => progress[s.id]).length;
  const passed = SIMULATIONS.filter((s) => progress[s.id]?.challenge_passed_at).length;

  return (
    <div>
      <header className="mb-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            Simulation Lab
          </p>
          <h1 className="mt-2 font-display text-3xl text-foreground">Learn it by running it</h1>
          <p className="measure mt-2 text-muted-foreground">
            Twelve hands-on simulators, one for every part of the book. Play with the controls, follow the
            guided steps, then beat the challenge.
          </p>
          <div className="mt-5 flex flex-wrap gap-6">
            <p className="figure text-sm text-muted-foreground">
              <span className="text-2xl text-foreground">{explored}</span> / {SIMULATIONS.length} explored
            </p>
            <p className="figure text-sm text-muted-foreground">
              <span className="text-2xl text-foreground">{passed}</span> / {SIMULATIONS.length} challenges beaten
            </p>
          </div>
        </div>
        <SupplyChainPulse className="hidden w-full md:block" />
      </header>

      {curriculum.map((part) => {
        const sims = SIMULATIONS.filter((s) => part.sections.some((sec) => sec.id === s.sectionId));
        if (sims.length === 0) return null;
        return (
          <section key={part.id} className="mb-10">
            <h2 className="mb-4 text-xl text-foreground">{part.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {sims.map((sim) => {
                const section = findSection(curriculum, sim.sectionId);
                const Icon = section?.icon ?? FlaskConical;
                const row = progress[sim.id];
                return (
                  <li key={sim.id}>
                    <Link
                      to={`/lab/${sim.id}`}
                      className="interactive shadow-card flex h-full flex-col rounded-lg border border-border bg-card p-5 hover:border-primary/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="figure text-xs text-muted-foreground">
                          {section && section.bookChapter > 0 ? `Section ${section.number}` : "Appendix"} ·{" "}
                          {section?.title}
                        </span>
                        {row?.challenge_passed_at ? (
                          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            <Trophy className="h-3 w-3" aria-hidden="true" />
                            Beaten
                          </span>
                        ) : row ? (
                          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Explored
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-lg text-foreground">{sim.title}</h3>
                      <p className="mt-1 flex-1 text-sm text-muted-foreground">{sim.tagline}</p>
                      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="figure inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />~{sim.minutes} min
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5",
                            sim.difficulty === "Advanced" ? "border-floor/40 text-floor" : "border-border"
                          )}
                        >
                          {sim.difficulty}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 text-primary">
                          {row ? "Open again" : "Start"}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
