import type { ComponentType } from "react";

/** What every simulator component receives from the Lab's shell. */
export interface SimulationProps {
  /** Call once when the learner meets the challenge's condition. */
  onChallengePassed: () => void;
  /** Whether the challenge is already passed (show a done state, keep playing). */
  challengePassed: boolean;
  /**
   * Report a short plain-English description of what is on screen right now
   * ("DSP Beta won at $3.81 with a $3.50 floor…"). The Lab uses it to ask the
   * AI assistant to explain exactly what the learner is looking at.
   */
  onDescribe: (description: string) => void;
}

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface SimulationDefinition {
  /** Stable id, used in URLs and stored in simulation_progress.sim_id. */
  id: string;
  /** The curriculum section this simulator belongs to (one per section). */
  sectionId: string;
  title: string;
  /** One line under the title. */
  tagline: string;
  minutes: number;
  difficulty: Difficulty;
  /** Lesson ids (src/curriculum/data.ts) that should link to this simulator. */
  relatedLessonIds: string[];
  /** 2–4 bullets: what the learner will see. */
  whatYoullSee: string[];
  /** 3–5 guided things to try, in order. */
  tryThis: string[];
  challenge: { title: string; description: string; hint: string };
  load: () => Promise<{ default: ComponentType<SimulationProps> }>;
}
