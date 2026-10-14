import type { SimulationProps } from "@/simulations/types";
import { SimStage } from "@/simulations/kit";

/** Placeholder until this simulator is built. */
export default function Simulation(_props: SimulationProps) {
  return (
    <SimStage label="Simulator">
      <p className="py-16 text-center text-muted-foreground">This simulator is being built.</p>
    </SimStage>
  );
}
