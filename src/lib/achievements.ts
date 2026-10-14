/**
 * Badges. Each is a pure predicate over a snapshot of the learner's
 * activity, so they're computed client-side, persisted once earned, and
 * testable without a backend.
 */
import { bookLessonIds, sectionList } from "@/curriculum";

export interface AchievementContext {
  completed: Set<string>;
  simsOpened: number;
  simsPassed: number;
  totalSims: number;
  streak: number;
  gotIt: number;
  notes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** lucide icon name, resolved by the UI. */
  icon: "Footprints" | "BookCheck" | "Flag" | "GraduationCap" | "FlaskConical" | "Trophy" | "Crown" | "Flame" | "Brain" | "NotebookPen";
  earned: (ctx: AchievementContext) => boolean;
}

const bookDone = (ctx: AchievementContext) => bookLessonIds.filter((id) => ctx.completed.has(id)).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-lesson", title: "First steps", description: "Complete your first lesson.", icon: "Footprints", earned: (c) => c.completed.size >= 1 },
  ...sectionList.map<Achievement>((section) => ({
    id: `section-${section.id}`,
    title: section.bookChapter > 0 ? `Section ${section.number} done` : "Appendix done",
    description: `Complete every lesson in ${section.title}.`,
    icon: "BookCheck",
    earned: (c) => section.lessons.every((l) => c.completed.has(l.id)),
  })),
  { id: "halfway", title: "Halfway there", description: "Complete half of the book.", icon: "Flag", earned: (c) => bookDone(c) >= Math.ceil(bookLessonIds.length / 2) },
  { id: "book-complete", title: "Cover to cover", description: "Complete every lesson in the book.", icon: "GraduationCap", earned: (c) => bookDone(c) === bookLessonIds.length },
  { id: "lab-first", title: "Lab rat", description: "Open your first simulator.", icon: "FlaskConical", earned: (c) => c.simsOpened >= 1 },
  { id: "challenge-first", title: "Challenger", description: "Beat your first simulator challenge.", icon: "Trophy", earned: (c) => c.simsPassed >= 1 },
  { id: "challenge-all", title: "Lab master", description: "Beat every simulator challenge.", icon: "Crown", earned: (c) => c.totalSims > 0 && c.simsPassed >= c.totalSims },
  { id: "streak-3", title: "On a roll", description: "Learn three days in a row.", icon: "Flame", earned: (c) => c.streak >= 3 },
  { id: "streak-7", title: "Week-long streak", description: "Learn seven days in a row.", icon: "Flame", earned: (c) => c.streak >= 7 },
  { id: "self-aware", title: "Honest check", description: "Rate ten self-checks as Got it.", icon: "Brain", earned: (c) => c.gotIt >= 10 },
  { id: "note-taker", title: "Note-taker", description: "Write notes on five lessons.", icon: "NotebookPen", earned: (c) => c.notes >= 5 },
];

export function earnedAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.earned(ctx));
}

/**
 * Consecutive active days ending today — or yesterday, so a streak isn't
 * shown as broken before the learner has had a chance to study today.
 * `days` are YYYY-MM-DD strings in the learner's local time.
 */
export function currentStreak(days: string[], today = localDay()): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return localDay(new Date(y, m - 1, d + delta));
}

/** Monday of the week containing `day` (weeks start Monday). */
export function weekStart(day = localDay()): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const offset = (date.getDay() + 6) % 7;
  return shiftDay(day, -offset);
}
