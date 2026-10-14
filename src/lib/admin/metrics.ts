/**
 * Admin console maths: everything here is pure so the insights are
 * testable. The database returns raw facts (admin_users(), admin_lesson_stats());
 * the curriculum's weights and the definitions of "at risk" or "behind" live
 * here, next to the code that explains them.
 */
import { bookLessonIds, bookTotalMinutes, curriculum, findLesson, lessonList } from "@/curriculum";
import type { Database } from "@/integrations/supabase/types";

export type AdminUserRow = Database["public"]["Functions"]["admin_users"]["Returns"][number];
export type LessonStatRow = Database["public"]["Functions"]["admin_lesson_stats"]["Returns"][number];

export interface CohortLite {
  id: string;
  name: string;
  start_date: string | null;
  target_end_date: string | null;
}

export type RiskReason = "never_signed_in" | "not_onboarded" | "inactive" | "behind_pace" | "suspended";

export interface LearnerMetrics {
  user: AdminUserRow;
  /** 0–100, weighted by lesson minutes over the book (chapters 1–11). */
  bookPct: number;
  lessonsDone: number;
  daysSinceActive: number | null;
  /** Where they should be by now (0–100), from cohort dates or weekly goal. */
  expectedPct: number | null;
  stage: "not_signed_in" | "onboarding" | "not_started" | "in_progress" | "completed";
  risks: RiskReason[];
  confidence: number | null;
}

const minutesById = new Map(lessonList.map((ref) => [ref.lesson.id, ref.lesson.minutes]));
const bookSet = new Set(bookLessonIds);
const DAY = 86_400_000;

export function bookPctFor(completed: string[]): number {
  const minutes = completed.filter((id) => bookSet.has(id)).reduce((a, id) => a + (minutesById.get(id) ?? 0), 0);
  return bookTotalMinutes > 0 ? Math.round((minutes / bookTotalMinutes) * 100) : 0;
}

/** Share of "Got it" among rated self-checks (0–100), or null with too few ratings. */
export function confidenceFor(gotIt: number, partly: number, missed: number): number | null {
  const total = gotIt + partly + missed;
  if (total < 3) return null;
  return Math.round(((gotIt + partly * 0.5) / total) * 100);
}

/**
 * Expected progress by now. A cohort with start and target dates sets a
 * linear schedule; otherwise the learner's own weekly goal does, counted from
 * their first sign-in.
 */
export function expectedPctFor(user: AdminUserRow, cohort: CohortLite | undefined, now = Date.now()): number | null {
  if (cohort?.start_date && cohort.target_end_date) {
    const start = new Date(cohort.start_date).getTime();
    const end = new Date(cohort.target_end_date).getTime();
    if (end > start) return Math.round(Math.max(0, Math.min(1, (now - start) / (end - start))) * 100);
  }
  if (user.first_login_at && user.weekly_minutes_goal) {
    const weeks = (now - new Date(user.first_login_at).getTime()) / (7 * DAY);
    return Math.round(Math.min(100, ((weeks * user.weekly_minutes_goal) / bookTotalMinutes) * 100));
  }
  return null;
}

export const INACTIVE_DAYS = 7;
export const BEHIND_MARGIN = 15;

export function learnerMetrics(user: AdminUserRow, cohort: CohortLite | undefined, now = Date.now()): LearnerMetrics {
  const completed = user.completed_lessons ?? [];
  const bookPct = bookPctFor(completed);
  const daysSinceActive = user.last_active_at ? Math.floor((now - new Date(user.last_active_at).getTime()) / DAY) : null;
  const expectedPct = expectedPctFor(user, cohort, now);

  const stage: LearnerMetrics["stage"] = !user.first_login_at
    ? "not_signed_in"
    : !user.onboarding_completed_at
      ? "onboarding"
      : bookPct >= 100
        ? "completed"
        : completed.length === 0
          ? "not_started"
          : "in_progress";

  // Admins run onboarding; their own reading isn't something to chase.
  const risks: RiskReason[] = [];
  if (user.status === "suspended") risks.push("suspended");
  else if (user.role === "admin") {
    // No flags.
  } else if (stage === "not_signed_in") {
    if (now - new Date(user.created_at).getTime() > 2 * DAY) risks.push("never_signed_in");
  } else {
    if (stage === "onboarding") risks.push("not_onboarded");
    if (stage !== "completed" && daysSinceActive !== null && daysSinceActive >= INACTIVE_DAYS) risks.push("inactive");
    if (stage !== "completed" && expectedPct !== null && bookPct < expectedPct - BEHIND_MARGIN) risks.push("behind_pace");
  }

  return {
    user,
    bookPct,
    lessonsDone: completed.filter((id) => bookSet.has(id)).length,
    daysSinceActive,
    expectedPct,
    stage,
    risks,
    confidence: confidenceFor(user.got_it, user.partly, user.missed),
  };
}

export const RISK_LABELS: Record<RiskReason, string> = {
  never_signed_in: "Never signed in",
  not_onboarded: "Onboarding unfinished",
  inactive: `Inactive ${INACTIVE_DAYS}+ days`,
  behind_pace: "Behind pace",
  suspended: "Suspended",
};

export interface FunnelStep {
  label: string;
  count: number;
}

/** Account created → first sign-in → onboarded → started → 25/50/75/100% of the book. */
export function onboardingFunnel(learners: LearnerMetrics[]): FunnelStep[] {
  const signedIn = learners.filter((l) => l.user.first_login_at);
  const onboarded = signedIn.filter((l) => l.user.onboarding_completed_at);
  const started = onboarded.filter((l) => l.lessonsDone > 0);
  return [
    { label: "Account created", count: learners.length },
    { label: "Signed in", count: signedIn.length },
    { label: "Onboarded", count: onboarded.length },
    { label: "Started reading", count: started.length },
    { label: "25% of the book", count: learners.filter((l) => l.bookPct >= 25).length },
    { label: "50%", count: learners.filter((l) => l.bookPct >= 50).length },
    { label: "75%", count: learners.filter((l) => l.bookPct >= 75).length },
    { label: "Finished", count: learners.filter((l) => l.bookPct >= 100).length },
  ];
}

export interface LessonInsight {
  stat: LessonStatRow;
  title: string;
  sectionTitle: string;
  expectedMinutes: number;
  completionRate: number | null;
  missedShare: number | null;
  helpfulShare: number | null;
  /** Higher = more worth an admin's attention. */
  struggleScore: number;
  reasons: string[];
}

/**
 * Lessons people find hard, from three independent signals: self-checks
 * rated "missed", people who open but don't finish, and questions asked to
 * the assistant. Lessons with too little data to judge are left out.
 */
export function lessonInsights(stats: LessonStatRow[]): LessonInsight[] {
  return stats
    .map((stat) => {
      const ref = findLesson(curriculum, stat.lesson_id);
      const rated = stat.got_it + stat.partly + stat.missed;
      const votes = stat.helpful_yes + stat.helpful_no;
      const completionRate = stat.viewers > 0 ? Math.round((stat.completers / stat.viewers) * 100) : null;
      const missedShare = rated >= 3 ? Math.round(((stat.missed + stat.partly * 0.5) / rated) * 100) : null;
      const helpfulShare = votes > 0 ? Math.round((stat.helpful_yes / votes) * 100) : null;

      const reasons: string[] = [];
      let score = 0;
      if (missedShare !== null && missedShare >= 35) {
        score += missedShare;
        reasons.push(`${missedShare}% unsure on self-checks`);
      }
      if (completionRate !== null && stat.viewers >= 3 && completionRate < 60) {
        score += 100 - completionRate;
        reasons.push(`${completionRate}% of readers finish`);
      }
      if (stat.chat_questions >= 2) {
        score += stat.chat_questions * 10;
        reasons.push(`${stat.chat_questions} questions to the assistant`);
      }
      if (helpfulShare !== null && helpfulShare < 50) {
        score += 100 - helpfulShare;
        reasons.push(`${100 - helpfulShare}% said not helpful`);
      }

      return {
        stat,
        title: ref?.lesson.title ?? stat.lesson_id,
        sectionTitle: ref?.section.title ?? "",
        expectedMinutes: ref?.lesson.minutes ?? 0,
        completionRate,
        missedShare,
        helpfulShare,
        struggleScore: score,
        reasons,
      };
    })
    .sort((a, b) => b.struggleScore - a.struggleScore);
}

/** RFC 4180 CSV, with spreadsheet formula injection neutralised. */
export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : Array.isArray(value) ? value.join("; ") : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedPerson {
  email: string;
  full_name?: string;
}

/**
 * Accepts one person per line as "email", "Name <email>", "email, Name" or
 * "Name, email" (a pasted spreadsheet column works too). Returns valid rows
 * and the lines it couldn't read.
 */
export function parsePeople(text: string): { people: ParsedPerson[]; invalid: string[] } {
  const people: ParsedPerson[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const emailRe = /[^\s<>,;"']+@[^\s<>,;"']+\.[^\s<>,;"']+/;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^email\b/i.test(line)) continue;
    const match = line.match(emailRe);
    if (!match) {
      invalid.push(line);
      continue;
    }
    const email = match[0].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const name = line
      .replace(match[0], "")
      .replace(/[<>,;\t"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    people.push(name ? { email, full_name: name } : { email });
  }
  return { people, invalid };
}
