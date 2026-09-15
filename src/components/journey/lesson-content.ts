import type { ComponentType, ReactNode } from "react";

/**
 * The contract every lesson file implements.
 *
 * The shell owns the chrome and the order; a lesson supplies only the five
 * content slots. Enforcing the shape here is what makes all 79 lessons
 * predictable — the learner always knows where on the page the answer lives.
 */
export interface LessonContent {
  /**
   * One or two sentences naming a real moment on the job. A consequence, not
   * an objective: why someone would regret not knowing this.
   */
  whyThisMatters: ReactNode;

  /**
   * 2-4 verb-first, checkable outcomes. "Explain a gap between impressions
   * and viewable impressions in a report", never "Understand impressions".
   */
  objectives: string[];

  /**
   * The lesson itself. A component rather than a node so lessons can hold
   * their own interactive state.
   */
  Body: ComponentType;

  /** Exactly three. Each a full sentence a person could say out loud. */
  takeaways: [string, string, string];

  /**
   * 1-3 self-check questions. Self-scored, never stored, never reported. The
   * last one should reach a step past the lesson into a real decision.
   */
  checkYourself: Array<{ question: string; answer: ReactNode }>;
}
