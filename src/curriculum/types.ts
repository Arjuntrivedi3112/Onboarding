/**
 * Curriculum shape.
 *
 * The curriculum is the single source of truth for the learning journey: it
 * drives the sidebar, the dashboard, progress maths, and prev/next navigation.
 * Nothing else should hardcode lesson or section ordering.
 */

import type { LucideIcon } from "lucide-react";

export interface Lesson {
  /**
   * Stable, globally unique progress key. Never changes, never derived from
   * the title — retitling must not orphan someone's progress.
   */
  id: string;
  /**
   * URL segment, unique within its section. Carries no chapter number, so
   * resequencing chapters cannot rot a link.
   */
  slug: string;
  title: string;
  /** Realistic read-and-interact time, used for "N min" labels and pacing. */
  minutes: number;
  /** One line, sentence case, aimed at someone new to AdTech. */
  summary: string;
}

export interface Section {
  /** Stable, unique, kebab-case. Used as the URL segment. */
  id: string;
  /**
   * Display number. Deliberately equal to `bookChapter` for the eleven book
   * sections so "Section 5" always means "Chapter 5".
   */
  number: number;
  /** The book chapter this maps to. 0 for material that isn't a chapter. */
  bookChapter: number;
  title: string;
  summary: string;
  icon: LucideIcon;
  lessons: Lesson[];
}

/** A named grouping of sections describing the arc of the journey. */
export interface Part {
  id: string;
  title: string;
  subtitle: string;
  sections: Section[];
}

/** A lesson together with everything needed to locate it in the journey. */
export interface LessonRef {
  lesson: Lesson;
  section: Section;
  part: Part;
  /** Position in the flattened journey, 0-based. */
  index: number;
}

export interface ProgressSummary {
  done: number;
  total: number;
  /** 0-100, rounded honestly: never 100 unless every lesson is complete. */
  pct: number;
  minutesDone: number;
  minutesTotal: number;
}
