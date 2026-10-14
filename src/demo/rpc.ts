/**
 * JavaScript stand-ins for the database functions and edge functions, used
 * by demo mode so the app behaves end to end without Supabase. They mirror
 * supabase/migrations/* and supabase/functions/* closely but are not the
 * security boundary — the real SQL is (and is tested in src/test/db).
 */
import type { fakeDb as FakeDbInstance } from "@/demo/fakeSupabase";

type FakeDb = typeof FakeDbInstance;
type Row = Record<string, unknown>;

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export function installDemoRpc(db: FakeDb) {
  const me = () => db.session?.user.id ?? "";
  const profileOf = (id: string) => db.table("profiles").find((p) => p.id === id);
  const isAdmin = () => db.table("user_roles").some((r) => r.user_id === me() && r.role === "admin");
  const assertAdmin = () => {
    if (!isAdmin()) throw new Error("ADMIN_ONLY");
  };
  const byUser = (table: string, id: string) => db.table(table).filter((r) => r.user_id === id);

  const touchDay = (seconds = 0) => {
    const rows = db.table("daily_activity");
    const row = rows.find((r) => r.user_id === me() && r.day === today());
    if (row) {
      row.reading_seconds = Number(row.reading_seconds) + seconds;
      row.events = Number(row.events) + 1;
    } else rows.push({ user_id: me(), day: today(), reading_seconds: seconds, events: 1 });
    const p = profileOf(me());
    if (p) p.last_active_at = new Date().toISOString();
  };

  const code = () => {
    const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const pick = () => Array.from({ length: 4 }, () => a[Math.floor(Math.random() * a.length)]).join("");
    return `${pick()}-${pick()}-${pick()}`;
  };
  const codes = new Map<string, string>();

  Object.assign(db.rpcHandlers, {
    can_self_register: ({ p_email }: Row) => String(p_email).toLowerCase().endsWith("@iqm.com"),
    regenerate_recovery_code: () => {
      const c = code();
      codes.set(me(), c);
      const p = profileOf(me());
      if (p) p.recovery_code_saved_at = null;
      return c;
    },
    confirm_recovery_code_saved: () => {
      const p = profileOf(me());
      if (p) p.recovery_code_saved_at = new Date().toISOString();
    },
    mark_password_changed: () => {
      const p = profileOf(me());
      if (p) p.must_change_password = false;
    },
    request_password_help: ({ p_email, p_note }: Row) => {
      const email = String(p_email).toLowerCase();
      if (db.table("password_reset_requests").some((r) => r.email === email && r.status === "pending")) return;
      db.table("password_reset_requests").push({
        id: crypto.randomUUID(),
        email,
        note: p_note ?? null,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    },
    add_lesson_time: ({ p_lesson_id, p_seconds, p_scroll_pct }: Row) => {
      const seconds = Math.max(0, Math.min(Number(p_seconds) || 0, 120));
      const rows = db.table("lesson_progress");
      let row = rows.find((r) => r.user_id === me() && r.lesson_id === p_lesson_id);
      if (!row) {
        row = { user_id: me(), lesson_id: p_lesson_id, first_visited_at: new Date().toISOString(), completed_at: null, time_spent_seconds: 0, max_scroll_pct: 0 };
        rows.push(row);
      }
      row.time_spent_seconds = Number(row.time_spent_seconds) + seconds;
      row.max_scroll_pct = Math.max(Number(row.max_scroll_pct), Number(p_scroll_pct) || 0);
      touchDay(seconds);
    },
    record_sim_open: ({ p_sim_id }: Row) => {
      const rows = db.table("simulation_progress");
      const row = rows.find((r) => r.user_id === me() && r.sim_id === p_sim_id);
      const now = new Date().toISOString();
      if (row) {
        row.runs = Number(row.runs) + 1;
        row.last_opened_at = now;
      } else rows.push({ user_id: me(), sim_id: p_sim_id, first_opened_at: now, last_opened_at: now, runs: 1, challenge_passed_at: null });
      touchDay();
    },
    record_sim_pass: ({ p_sim_id }: Row) => {
      const rows = db.table("simulation_progress");
      const now = new Date().toISOString();
      const row = rows.find((r) => r.user_id === me() && r.sim_id === p_sim_id);
      if (row) row.challenge_passed_at = row.challenge_passed_at ?? now;
      else rows.push({ user_id: me(), sim_id: p_sim_id, first_opened_at: now, last_opened_at: now, runs: 1, challenge_passed_at: now });
    },

    admin_set_role: ({ p_user, p_role }: Row) => {
      assertAdmin();
      const admins = db.table("user_roles").filter((r) => r.role === "admin");
      const target = db.table("user_roles").find((r) => r.user_id === p_user);
      if (p_role === "learner" && target?.role === "admin" && admins.length <= 1) throw new Error("LAST_ADMIN");
      if (target) target.role = p_role;
      else db.table("user_roles").push({ user_id: p_user, role: p_role });
    },
    admin_set_cohort: ({ p_users, p_cohort }: Row) => {
      assertAdmin();
      (p_users as string[]).forEach((id) => {
        const p = profileOf(id);
        if (p) p.cohort_id = p_cohort ?? null;
      });
    },
    admin_update_profile: ({ p_user, p_full_name, p_team }: Row) => {
      assertAdmin();
      const p = profileOf(String(p_user));
      if (p) Object.assign(p, { full_name: p_full_name || null, team: p_team || null });
    },
    admin_reset_progress: ({ p_user }: Row) => {
      assertAdmin();
      for (const t of ["lesson_progress", "bookmarks", "self_checks", "simulation_progress", "achievements"]) {
        db.tables[t] = db.table(t).filter((r) => r.user_id !== p_user);
      }
      const p = profileOf(String(p_user));
      if (p) Object.assign(p, { resume: null, started_at: null });
    },
    admin_users: () => {
      assertAdmin();
      return db.table("profiles").map((p) => {
        const lp = byUser("lesson_progress", String(p.id));
        const sp = byUser("simulation_progress", String(p.id));
        const sc = byUser("self_checks", String(p.id));
        const da = byUser("daily_activity", String(p.id));
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          team: p.team,
          role: db.table("user_roles").find((r) => r.user_id === p.id)?.role ?? "learner",
          cohort_id: p.cohort_id,
          status: p.status,
          created_via: p.created_via,
          created_at: p.created_at,
          first_login_at: p.first_login_at,
          last_active_at: p.last_active_at,
          onboarding_completed_at: p.onboarding_completed_at,
          weekly_minutes_goal: p.weekly_minutes_goal,
          must_change_password: p.must_change_password,
          completed_lessons: lp.filter((r) => r.completed_at).map((r) => r.lesson_id),
          visited_lessons: lp.filter((r) => r.first_visited_at).length,
          time_spent_seconds: lp.reduce((a, r) => a + Number(r.time_spent_seconds ?? 0), 0),
          sims_opened: sp.length,
          sims_passed: sp.filter((r) => r.challenge_passed_at).length,
          badges: byUser("achievements", String(p.id)).length,
          got_it: sc.filter((r) => r.rating === "got_it").length,
          partly: sc.filter((r) => r.rating === "partly").length,
          missed: sc.filter((r) => r.rating === "missed").length,
          active_days_14: da.filter((r) => String(r.day) > daysAgo(14)).length,
          reading_seconds_7: da.filter((r) => String(r.day) > daysAgo(7)).reduce((a, r) => a + Number(r.reading_seconds), 0),
        };
      });
    },
    admin_daily_activity: ({ p_days }: Row) => {
      assertAdmin();
      const n = Math.max(1, Math.min(Number(p_days) || 30, 365));
      return Array.from({ length: n }, (_, i) => {
        const d = daysAgo(n - 1 - i);
        const sameDay = (v: unknown) => typeof v === "string" && v.slice(0, 10) === d;
        const act = db.table("daily_activity").filter((r) => r.day === d);
        return {
          day: d,
          active_users: new Set(act.map((r) => r.user_id)).size,
          reading_minutes: Math.round(act.reduce((a, r) => a + Number(r.reading_seconds), 0) / 60),
          lessons_completed: db.table("lesson_progress").filter((r) => sameDay(r.completed_at)).length,
          sims_passed: db.table("simulation_progress").filter((r) => sameDay(r.challenge_passed_at)).length,
          chat_questions: db.table("chat_questions").filter((r) => sameDay(r.created_at)).length,
          signups: db.table("profiles").filter((r) => sameDay(r.created_at)).length,
        };
      });
    },
    admin_lesson_stats: () => {
      assertAdmin();
      const ids = new Set(
        ["lesson_progress", "self_checks", "lesson_feedback", "chat_questions"].flatMap((t) =>
          db.table(t).map((r) => r.lesson_id).filter(Boolean)
        )
      );
      return [...ids].map((id) => {
        const lp = db.table("lesson_progress").filter((r) => r.lesson_id === id);
        const timed = lp.filter((r) => Number(r.time_spent_seconds) > 0);
        const sc = db.table("self_checks").filter((r) => r.lesson_id === id);
        const fb = db.table("lesson_feedback").filter((r) => r.lesson_id === id);
        return {
          lesson_id: id,
          viewers: lp.filter((r) => r.first_visited_at).length,
          completers: lp.filter((r) => r.completed_at).length,
          avg_seconds: timed.length ? Math.round(timed.reduce((a, r) => a + Number(r.time_spent_seconds), 0) / timed.length) : 0,
          got_it: sc.filter((r) => r.rating === "got_it").length,
          partly: sc.filter((r) => r.rating === "partly").length,
          missed: sc.filter((r) => r.rating === "missed").length,
          helpful_yes: fb.filter((r) => r.helpful).length,
          helpful_no: fb.filter((r) => !r.helpful).length,
          comments: fb.filter((r) => r.comment).length,
          chat_questions: db.table("chat_questions").filter((r) => r.lesson_id === id).length,
        };
      });
    },
    admin_sim_stats: () => {
      assertAdmin();
      const groups = new Map<string, Row[]>();
      db.table("simulation_progress").forEach((r) => groups.set(String(r.sim_id), [...(groups.get(String(r.sim_id)) ?? []), r]));
      return [...groups].map(([sim_id, rows]) => ({
        sim_id,
        openers: rows.length,
        passers: rows.filter((r) => r.challenge_passed_at).length,
        total_runs: rows.reduce((a, r) => a + Number(r.runs), 0),
      }));
    },
  });

  const password = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8).toUpperCase();

  Object.assign(db.functionHandlers, {
    "admin-users": (body: Row) => {
      assertAdmin();
      switch (body.action) {
        case "create_users":
          return {
            results: (body.users as Row[]).map((u) => {
              const email = String(u.email).trim().toLowerCase();
              if (db.table("profiles").some((p) => p.email === email)) {
                return { email, ok: false, error: "An account with this email already exists" };
              }
              const id = crypto.randomUUID();
              const pw = password();
              db.table("profiles").push({
                id,
                email,
                full_name: u.full_name ?? null,
                team: null,
                comfort: {},
                weekly_minutes_goal: null,
                timezone: "UTC",
                cohort_id: u.cohort_id ?? null,
                must_change_password: true,
                recovery_code_saved_at: null,
                first_login_at: null,
                onboarding_completed_at: null,
                tour_completed_at: null,
                last_active_at: null,
                status: "active",
                created_via: "admin",
                created_at: new Date().toISOString(),
              });
              db.table("user_roles").push({ user_id: id, role: u.role === "admin" ? "admin" : "learner" });
              db.passwords[email] = pw;
              return { email, ok: true, password: pw, user_id: id };
            }),
          };
        case "reset_password": {
          const p = profileOf(String(body.user_id));
          if (!p) throw new Error("User not found");
          const pw = password();
          db.passwords[String(p.email)] = pw;
          p.must_change_password = true;
          db.table("password_reset_requests")
            .filter((r) => r.email === p.email && r.status === "pending")
            .forEach((r) => Object.assign(r, { status: "resolved", resolved_at: new Date().toISOString() }));
          return { email: p.email, password: pw };
        }
        case "set_status": {
          const p = profileOf(String(body.user_id));
          if (p) p.status = body.status;
          return { ok: true };
        }
        case "delete_user":
          db.tables.profiles = db.table("profiles").filter((p) => p.id !== body.user_id);
          return { ok: true };
        default:
          throw new Error("Unknown action");
      }
    },
    "account-recovery": (body: Row) => {
      const p = db.table("profiles").find((x) => x.email === String(body.email).toLowerCase());
      const expected = p ? codes.get(String(p.id)) : undefined;
      if (!p || !expected || expected.replace(/-/g, "") !== String(body.code).toUpperCase().replace(/[^A-Z0-9]/g, "")) {
        const err = new Error("That email and recovery code don't match.");
        throw Object.assign(err, { context: new Response(JSON.stringify({ error: err.message }), { status: 400 }) });
      }
      db.passwords[String(p.email)] = String(body.new_password);
      codes.delete(String(p.id));
      p.recovery_code_saved_at = null;
      return { ok: true };
    },
  });
}
