import { describe, expect, it } from "vitest";

import { bookLessonIds } from "@/curriculum";
import {
  bookPctFor,
  confidenceFor,
  expectedPctFor,
  learnerMetrics,
  lessonInsights,
  onboardingFunnel,
  parsePeople,
  toCsv,
  type AdminUserRow,
  type LessonStatRow,
} from "@/lib/admin/metrics";

const NOW = new Date("2026-10-14T12:00:00Z").getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

function user(over: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: "u1",
    email: "a@iqm.com",
    full_name: "A",
    team: "Sales",
    role: "learner",
    cohort_id: null,
    status: "active",
    created_via: "self_signup",
    created_at: daysAgo(30),
    first_login_at: daysAgo(28),
    last_active_at: daysAgo(1),
    onboarding_completed_at: daysAgo(28),
    weekly_minutes_goal: 60,
    must_change_password: false,
    completed_lessons: [],
    visited_lessons: 0,
    time_spent_seconds: 0,
    sims_opened: 0,
    sims_passed: 0,
    badges: 0,
    got_it: 0,
    partly: 0,
    missed: 0,
    active_days_14: 0,
    reading_seconds_7: 0,
    ...over,
  };
}

describe("learner metrics", () => {
  it("weights book progress by lesson minutes and ignores the appendix", () => {
    expect(bookPctFor([])).toBe(0);
    expect(bookPctFor(bookLessonIds)).toBe(100);
    expect(bookPctFor(["ai-why-ai-runs-modern-advertising"])).toBe(0);
  });

  it("only scores confidence with enough ratings", () => {
    expect(confidenceFor(1, 0, 0)).toBeNull();
    expect(confidenceFor(2, 2, 0)).toBe(75);
  });

  it("derives expected progress from the cohort schedule first, then the weekly goal", () => {
    const cohort = { id: "c", name: "C", start_date: daysAgo(10).slice(0, 10), target_end_date: daysAgo(-10).slice(0, 10) };
    expect(expectedPctFor(user(), cohort, NOW)).toBeGreaterThanOrEqual(48);
    expect(expectedPctFor(user(), cohort, NOW)).toBeLessThanOrEqual(53);
    // 4 weeks × 60 min of a 633-minute book ≈ 38%.
    expect(expectedPctFor(user(), undefined, NOW)).toBe(38);
  });

  it("flags who needs a hand, and why", () => {
    expect(learnerMetrics(user({ first_login_at: null, last_active_at: null, created_at: daysAgo(5) }), undefined, NOW).risks).toEqual([
      "never_signed_in",
    ]);
    expect(learnerMetrics(user({ last_active_at: daysAgo(9) }), undefined, NOW).risks).toEqual(["inactive", "behind_pace"]);
    expect(learnerMetrics(user({ completed_lessons: bookLessonIds }), undefined, NOW)).toMatchObject({ stage: "completed", risks: [] });
    expect(learnerMetrics(user({ status: "suspended" }), undefined, NOW).risks).toEqual(["suspended"]);
  });

  it("builds a monotonically shrinking onboarding funnel", () => {
    const learners = [
      user({ first_login_at: null, onboarding_completed_at: null }),
      user({ onboarding_completed_at: null }),
      user(),
      user({ completed_lessons: bookLessonIds.slice(0, 40) }),
      user({ completed_lessons: bookLessonIds }),
    ].map((u) => learnerMetrics(u, undefined, NOW));
    const counts = onboardingFunnel(learners).map((s) => s.count);
    expect(counts.slice(0, 4)).toEqual([5, 4, 3, 2]);
    expect(counts[counts.length - 1]).toBe(1);
    counts.slice(1).forEach((c, i) => expect(c).toBeLessThanOrEqual(counts[i]));
  });
});

describe("lesson insights", () => {
  const stat = (over: Partial<LessonStatRow>): LessonStatRow => ({
    lesson_id: "mediabuying-header-bidding",
    viewers: 0,
    completers: 0,
    avg_seconds: 0,
    got_it: 0,
    partly: 0,
    missed: 0,
    helpful_yes: 0,
    helpful_no: 0,
    comments: 0,
    chat_questions: 0,
    ...over,
  });

  it("ranks lessons by combined struggle signals and explains why", () => {
    const [top, second] = lessonInsights([
      stat({ lesson_id: "basics-what-is-adtech", viewers: 10, completers: 10, got_it: 10 }),
      stat({ viewers: 10, completers: 4, missed: 5, got_it: 1, chat_questions: 3 }),
    ]);
    expect(top.title).toMatch(/header bidding/i);
    expect(top.reasons).toEqual(expect.arrayContaining(["40% of readers finish", "3 questions to the assistant"]));
    expect(second.struggleScore).toBe(0);
  });
});

describe("CSV and people parsing", () => {
  it("quotes cells and neutralises formulas", () => {
    expect(toCsv([{ a: 'x, "y"', b: "=SUM(A1)", c: ["p", "q"] }])).toBe('a,b,c\n"x, ""y""",\'=SUM(A1),p; q');
  });

  it("reads pasted lists in common shapes", () => {
    const { people, invalid } = parsePeople(
      "email,name\nada@iqm.com\nGrace Hopper <grace@gmail.com>\nlinus@iqm.com, Linus T\nada@iqm.com\nnot an email"
    );
    expect(people).toEqual([
      { email: "ada@iqm.com" },
      { email: "grace@gmail.com", full_name: "Grace Hopper" },
      { email: "linus@iqm.com", full_name: "Linus T" },
    ]);
    expect(invalid).toEqual(["not an email"]);
  });
});
