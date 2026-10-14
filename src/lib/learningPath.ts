/**
 * The personalised learning path built at onboarding.
 *
 * It never hides or removes content: every section stays in the path. It
 * only reorders (the sections that matter most for your team come right
 * after the foundations) and labels each section as core, standard or skim
 * based on your team and how comfortable you said you are.
 */
import { curriculum, lessonList, type LessonRef } from "@/curriculum";

export const TEAMS = [
  "Sales",
  "Account Management",
  "AdOps",
  "Engineering",
  "Product",
  "Data",
  "Finance",
  "Other",
] as const;
export type Team = (typeof TEAMS)[number];

export type Focus = "core" | "standard" | "skim";

/** Sections that matter most for each team, most important first. */
export const TEAM_FOCUS: Record<Team, string[]> = {
  Sales: ["basics", "channels", "mediabuying", "targeting", "attribution"],
  "Account Management": ["basics", "tracking", "attribution", "targeting", "mediabuying"],
  AdOps: ["adserving", "tracking", "mediabuying", "targeting", "technology"],
  Engineering: ["technology", "adserving", "mediabuying", "identity", "data"],
  Product: ["technology", "identity", "data", "buildbuy", "ai"],
  Data: ["data", "identity", "attribution", "tracking", "ai"],
  Finance: ["basics", "tracking", "mediabuying", "buildbuy"],
  Other: ["basics", "technology", "mediabuying"],
};

/** Comfort 1 (new to it) … 5 (could teach it), per curriculum part id. */
export type Comfort = Record<string, number>;

export interface LearningPath {
  order: string[];
  focus: Record<string, Focus>;
}

const partOf = (sectionId: string) => curriculum.find((p) => p.sections.some((s) => s.id === sectionId))?.id ?? "";

export function buildLearningPath(team: Team | string | null, comfort: Comfort = {}): LearningPath {
  const sections = curriculum.flatMap((p) => p.sections);
  const priority = TEAM_FOCUS[(team as Team) ?? "Other"] ?? TEAM_FOCUS.Other;

  const focus: Record<string, Focus> = {};
  for (const s of sections) {
    const level = comfort[partOf(s.id)] ?? 2;
    focus[s.id] = level >= 4 ? "skim" : priority.includes(s.id) ? "core" : "standard";
  }

  // Foundations first (unless the learner already knows them), then core
  // sections in priority order, then everything else in book order, with the
  // appendix and skims at the end.
  const foundations = sections.filter((s) => partOf(s.id) === "foundations" && focus[s.id] !== "skim").map((s) => s.id);
  const core = priority.filter((id) => !foundations.includes(id) && focus[id] === "core");
  const rest = sections
    .map((s) => s.id)
    .filter((id) => !foundations.includes(id) && !core.includes(id) && focus[id] !== "skim" && id !== "ai");
  const appendix = focus.ai !== "skim" ? ["ai"] : [];
  const skims = sections.map((s) => s.id).filter((id) => focus[id] === "skim" && !foundations.includes(id));

  const order = [...new Set([...foundations, ...core, ...rest, ...appendix, ...skims])];
  return { order, focus };
}

/** Reading minutes along the path; skim sections count at half. */
export function pathMinutes(path: LearningPath): number {
  const sections = curriculum.flatMap((p) => p.sections);
  return path.order.reduce((total, id) => {
    const s = sections.find((x) => x.id === id);
    if (!s) return total;
    const minutes = s.lessons.reduce((n, l) => n + l.minutes, 0);
    return total + (path.focus[id] === "skim" ? minutes / 2 : minutes);
  }, 0);
}

/** Whole weeks to finish at a weekly pace (at least one). */
export function weeksToFinish(minutes: number, weeklyMinutes: number): number {
  return Math.max(1, Math.ceil(minutes / Math.max(10, weeklyMinutes)));
}

export function finishDate(weeks: number, from = new Date()): Date {
  return new Date(from.getTime() + weeks * 7 * 86_400_000);
}

/** The first unfinished lesson along the path, or null when all are done. */
export function nextOnPath(path: LearningPath | null, isComplete: (lessonId: string) => boolean): LessonRef | null {
  const order = path?.order ?? curriculum.flatMap((p) => p.sections.map((s) => s.id));
  for (const sectionId of order) {
    const next = lessonList.find((ref) => ref.section.id === sectionId && !isComplete(ref.lesson.id));
    if (next) return next;
  }
  return null;
}

/** Parse what's stored in profiles.learning_path, tolerating anything. */
export function parseLearningPath(value: unknown): LearningPath | null {
  const v = value as LearningPath | null;
  if (!v || !Array.isArray(v.order) || typeof v.focus !== "object" || v.focus === null) return null;
  return { order: v.order.filter((x): x is string => typeof x === "string"), focus: v.focus };
}
