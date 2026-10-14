/**
 * Seed data for demo mode: an admin (you), a cohort and a handful of
 * learners at different stages, with progress, activity and questions.
 */
import { bookLessonIds, lessonList } from "@/curriculum";
import { SIMULATIONS } from "@/simulations/registry";
import type { fakeDb as FakeDbInstance } from "@/demo/fakeSupabase";
import { installDemoRpc } from "@/demo/rpc";

type FakeDb = typeof FakeDbInstance;

const ADMIN_ID = "00000000-0000-4000-8000-0000000000ad";
const COHORT_ID = "00000000-0000-4000-8000-00000000c0f1";

const LEARNERS = [
  { name: "Priya Shah", team: "Sales", done: 0.82, daysAgo: 0, sims: 7 },
  { name: "Marcus Lee", team: "AdOps", done: 0.55, daysAgo: 1, sims: 4 },
  { name: "Sofia Alvarez", team: "Engineering", done: 0.34, daysAgo: 2, sims: 3 },
  { name: "Daniel Okafor", team: "Account Management", done: 0.12, daysAgo: 9, sims: 1 },
  { name: "Hannah Kim", team: "Product", done: 0.68, daysAgo: 0, sims: 6 },
  { name: "Tom Becker", team: "Finance", done: 0.05, daysAgo: 14, sims: 0 },
  { name: "Aisha Rahman", team: "Data", done: 1, daysAgo: 0, sims: 12 },
];

const QUESTIONS = [
  ["mediabuying-rtb-auction-in-100ms", "Why does the second-price winner pay one cent more than the runner-up?"],
  ["identity-cross-device-resolution", "What's the difference between deterministic and probabilistic matching?"],
  ["attribution-multi-touch-models", "When would I pick time decay over position-based?"],
  ["tracking-discrepancies-and-reconciliation", "Why do publisher and advertiser impression counts never match?"],
  ["mediabuying-header-bidding", "Is header bidding still used now that there's server-side bidding?"],
  ["data-taxonomies-and-segments", "How is a segment different from an audience?"],
];

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
// Deterministic pseudo-random so the demo looks the same every load.
let seed = 7;
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

export function seedDemo(db: FakeDb) {
  db.reset();
  db.tables = {};
  db.signInAs({
    id: ADMIN_ID,
    email: "arjun.trivedi@iqm.com",
    role: "admin",
    profile: { full_name: "Arjun Trivedi", team: "Product", cohort_id: null, weekly_minutes_goal: 60 },
  });
  db.passwords["arjun.trivedi@iqm.com"] = "demo1234";
  db.table("cohorts").push({
    id: COHORT_ID,
    name: "October 2026 new hires",
    description: "Sales, AdOps and Engineering joiners",
    start_date: day(21).slice(0, 10),
    target_end_date: day(-21).slice(0, 10),
    created_at: day(25),
  });

  LEARNERS.forEach((l, i) => {
    const id = `00000000-0000-4000-8000-00000000010${i}`;
    const email = `${l.name.split(" ")[0].toLowerCase()}@iqm.com`;
    db.table("profiles").push({
      id,
      email,
      full_name: l.name,
      team: l.team,
      experience_level: null,
      comfort: {},
      goals: null,
      weekly_minutes_goal: [30, 60, 120][i % 3],
      learning_path: null,
      resume: null,
      started_at: day(20),
      timezone: "UTC",
      cohort_id: i < 5 ? COHORT_ID : null,
      must_change_password: i === 5,
      recovery_code_saved_at: i === 5 ? null : day(20),
      first_login_at: i === 5 ? null : day(20),
      onboarding_completed_at: i === 5 ? null : day(20),
      tour_completed_at: day(20),
      last_active_at: i === 5 ? null : day(l.daysAgo),
      status: "active",
      created_via: i % 2 ? "admin" : "self_signup",
      created_at: day(22),
    });
    db.table("user_roles").push({ user_id: id, role: "learner" });
    db.passwords[email] = "demo1234";

    const count = Math.round(bookLessonIds.length * l.done);
    lessonList.slice(0, count + 3).forEach((ref, j) => {
      const completed = j < count;
      db.table("lesson_progress").push({
        user_id: id,
        lesson_id: ref.lesson.id,
        first_visited_at: day(20 - (j % 18)),
        completed_at: completed ? day(19 - (j % 18)) : null,
        time_spent_seconds: Math.round(ref.lesson.minutes * 60 * (0.6 + rand())),
        max_scroll_pct: completed ? 100 : Math.round(30 + rand() * 60),
        updated_at: day(l.daysAgo),
      });
      if (j % 2 === 0 && completed) {
        db.table("self_checks").push({
          user_id: id,
          lesson_id: ref.lesson.id,
          question_index: 0,
          rating: rand() < 0.65 ? "got_it" : rand() < 0.6 ? "partly" : "missed",
          updated_at: day(19 - (j % 18)),
        });
      }
    });

    SIMULATIONS.slice(0, l.sims).forEach((sim, j) => {
      db.table("simulation_progress").push({
        user_id: id,
        sim_id: sim.id,
        first_opened_at: day(15 - j),
        last_opened_at: day(l.daysAgo),
        runs: 1 + Math.round(rand() * 3),
        challenge_passed_at: j % 3 !== 2 ? day(14 - j) : null,
      });
    });

    for (let d = 0; d < 21; d++) {
      if (d < l.daysAgo || rand() < 0.35) continue;
      db.table("daily_activity").push({ user_id: id, day: day(d).slice(0, 10), reading_seconds: Math.round(rand() * 1800), events: 3 });
    }
  });

  QUESTIONS.forEach(([lessonId, question], i) => {
    db.table("chat_questions").push({
      id: i + 1,
      user_id: `00000000-0000-4000-8000-00000000010${i % LEARNERS.length}`,
      lesson_id: lessonId,
      context: null,
      question,
      blocked: false,
      created_at: day(i % 5),
    });
  });

  db.table("lesson_feedback").push(
    { user_id: "00000000-0000-4000-8000-000000000101", lesson_id: "identity-privacy-preserving-tech", helpful: false, comment: "Lost me at clean rooms — a diagram would help.", updated_at: day(1) },
    { user_id: "00000000-0000-4000-8000-000000000100", lesson_id: "mediabuying-rtb-auction-in-100ms", helpful: true, comment: "The timeline finally made this click.", updated_at: day(2) }
  );
  db.table("password_reset_requests").push({ id: "req-1", email: "tom@iqm.com", note: "Locked out after holiday", status: "pending", created_at: day(1) });
  db.table("announcements").push({ id: "ann-1", title: "Welcome to the October cohort!", body: "Aim to finish Part 1 by Friday. Office hours Thursday 3pm.", cohort_id: null, created_by: ADMIN_ID, published_at: day(3) });

  installDemoRpc(db);
}
