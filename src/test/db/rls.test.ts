// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";

import { as, createAuthUser, createDb, type Db } from "./harness";

/**
 * Security contract for the database. These run the real migrations, so a
 * policy regression fails here before it can reach Supabase.
 */

let db: Db;
let admin: string;
let alice: string;
let bob: string;
let cohort: string;

beforeAll(async () => {
  db = await createDb();
  admin = await createAuthUser(db, "arjun.trivedi@iqm.com", "Arjun");
  alice = await createAuthUser(db, "alice@iqm.com", "Alice");
  bob = await createAuthUser(db, "Bob@IQM.com");
  const c = await db.query<{ id: string }>("insert into public.cohorts (name) values ('Oct 2026') returning id");
  cohort = c.rows[0].id;
}, 60_000);

async function role(userId: string) {
  const r = await db.query<{ role: string }>("select role from public.user_roles where user_id = $1", [userId]);
  return r.rows[0]?.role;
}

describe("sign-up gate", () => {
  it("lets @iqm.com self-register as a learner, lower-casing the email", async () => {
    expect(await role(alice)).toBe("learner");
    const p = await db.query<{ email: string; created_via: string; must_change_password: boolean }>(
      "select email, created_via, must_change_password from public.profiles where id = $1",
      [bob]
    );
    expect(p.rows[0]).toEqual({ email: "bob@iqm.com", created_via: "self_signup", must_change_password: false });
  });

  it("makes the bootstrap email an admin", async () => {
    expect(await role(admin)).toBe("admin");
  });

  it("rejects a non-allowed domain that no admin provisioned", async () => {
    await expect(createAuthUser(db, "random@gmail.com")).rejects.toThrow(/SIGNUP_NOT_ALLOWED/);
  });

  it("accepts an admin-provisioned outside email with its role and cohort", async () => {
    await db.query(
      "insert into public.account_provisions (email, role, cohort_id, full_name) values ('contractor@gmail.com', 'learner', $1, 'Casey')",
      [cohort]
    );
    const id = await createAuthUser(db, "contractor@gmail.com");
    const p = await db.query<{ cohort_id: string; must_change_password: boolean; created_via: string; full_name: string }>(
      "select cohort_id, must_change_password, created_via, full_name from public.profiles where id = $1",
      [id]
    );
    expect(p.rows[0]).toEqual({ cohort_id: cohort, must_change_password: true, created_via: "admin", full_name: "Casey" });
    // A provision is single-use.
    const prov = await db.query<{ consumed_at: string | null }>(
      "select consumed_at from public.account_provisions where email = 'contractor@gmail.com'"
    );
    expect(prov.rows[0].consumed_at).not.toBeNull();
  });

  it("reports self-registration eligibility to anonymous visitors", async () => {
    const r = await as(db, "anon", null, () =>
      db.query<{ ok: boolean; no: boolean }>(
        "select public.can_self_register('x@iqm.com') as ok, public.can_self_register('x@gmail.com') as no"
      )
    );
    expect(r.rows[0]).toEqual({ ok: true, no: false });
  });
});

describe("profiles", () => {
  it("shows learners only their own profile", async () => {
    const r = await as(db, "authenticated", alice, () => db.query<{ id: string }>("select id from public.profiles"));
    expect(r.rows.map((x) => x.id)).toEqual([alice]);
  });

  it("shows admins every profile", async () => {
    const r = await as(db, "authenticated", admin, () => db.query("select id from public.profiles"));
    expect(r.rows.length).toBeGreaterThanOrEqual(4);
  });

  it("lets a learner edit their name but not their cohort, status or email", async () => {
    await as(db, "authenticated", alice, () =>
      db.query("update public.profiles set full_name = 'Alice A' where id = $1", [alice])
    );
    for (const column of ["cohort_id = null", "status = 'suspended'", "email = 'x@iqm.com'", "must_change_password = false"]) {
      await expect(
        as(db, "authenticated", alice, () => db.query(`update public.profiles set ${column} where id = $1`, [alice]))
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("cannot be read by anonymous visitors", async () => {
    await expect(as(db, "anon", null, () => db.query("select * from public.profiles"))).rejects.toThrow(
      /permission denied/
    );
  });
});

describe("roles", () => {
  it("cannot be self-elevated", async () => {
    await expect(
      as(db, "authenticated", alice, () => db.query("update public.user_roles set role = 'admin' where user_id = $1", [alice]))
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, "authenticated", alice, () => db.query("select public.admin_set_role($1, 'admin')", [alice]))
    ).rejects.toThrow(/ADMIN_ONLY/);
  });

  it("can be changed by an admin, but never removes the last admin", async () => {
    await as(db, "authenticated", admin, () => db.query("select public.admin_set_role($1, 'admin')", [bob]));
    expect(await role(bob)).toBe("admin");
    await as(db, "authenticated", admin, () => db.query("select public.admin_set_role($1, 'learner')", [bob]));
    expect(await role(bob)).toBe("learner");
    await expect(
      as(db, "authenticated", admin, () => db.query("select public.admin_set_role($1, 'learner')", [admin]))
    ).rejects.toThrow(/LAST_ADMIN/);
  });
});

describe("learning data", () => {
  it("isolates progress between learners and exposes it to admins", async () => {
    await as(db, "authenticated", alice, () =>
      db.query(
        "insert into public.lesson_progress (lesson_id, first_visited_at, completed_at) values ('basics-what-is-adtech', now(), now())"
      )
    );
    const bobSees = await as(db, "authenticated", bob, () => db.query("select * from public.lesson_progress"));
    expect(bobSees.rows).toHaveLength(0);
    const adminSees = await as(db, "authenticated", admin, () => db.query("select * from public.lesson_progress"));
    expect(adminSees.rows).toHaveLength(1);
  });

  it("refuses writes on someone else's behalf", async () => {
    await expect(
      as(db, "authenticated", bob, () =>
        db.query("insert into public.lesson_progress (user_id, lesson_id) values ($1, 'x')", [alice])
      )
    ).rejects.toThrow(/row-level security/);
  });

  it("keeps lesson notes private even from admins", async () => {
    await as(db, "authenticated", alice, () =>
      db.query("insert into public.lesson_notes (lesson_id, body) values ('basics-what-is-adtech', 'secret')")
    );
    const r = await as(db, "authenticated", admin, () => db.query("select * from public.lesson_notes"));
    expect(r.rows).toHaveLength(0);
  });

  it("caps reading heartbeats and counts the day as active", async () => {
    await as(db, "authenticated", alice, () => db.query("select public.add_lesson_time('basics-what-is-adtech', 5000, 40)"));
    const r = await db.query<{ time_spent_seconds: number; max_scroll_pct: number }>(
      "select time_spent_seconds, max_scroll_pct from public.lesson_progress where user_id = $1",
      [alice]
    );
    expect(r.rows[0]).toEqual({ time_spent_seconds: 120, max_scroll_pct: 40 });
    const d = await db.query<{ reading_seconds: number }>(
      "select reading_seconds from public.daily_activity where user_id = $1",
      [alice]
    );
    expect(d.rows[0].reading_seconds).toBe(120);
  });

  it("marks a day active when an event is logged", async () => {
    await as(db, "authenticated", bob, () => db.query("insert into public.activity_events (type) values ('login')"));
    const d = await db.query<{ events: number }>("select events from public.daily_activity where user_id = $1", [bob]);
    expect(d.rows[0].events).toBe(1);
  });

  it("records simulation opens and passes", async () => {
    await as(db, "authenticated", alice, async () => {
      await db.query("select public.record_sim_open('rtb-auction')");
      await db.query("select public.record_sim_open('rtb-auction')");
      await db.query("select public.record_sim_pass('rtb-auction')");
    });
    const r = await db.query<{ runs: number; challenge_passed_at: string | null }>(
      "select runs, challenge_passed_at from public.simulation_progress where user_id = $1",
      [alice]
    );
    expect(r.rows[0].runs).toBe(2);
    expect(r.rows[0].challenge_passed_at).not.toBeNull();
  });
});

describe("recovery codes", () => {
  let code: string;

  it("issues a code the learner never sees stored", async () => {
    const r = await as(db, "authenticated", alice, () =>
      db.query<{ code: string }>("select public.regenerate_recovery_code() as code")
    );
    code = r.rows[0].code;
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    await expect(
      as(db, "authenticated", alice, () => db.query("select * from public.recovery_codes"))
    ).rejects.toThrow(/permission denied/);
  });

  it("can only be checked by the server", async () => {
    await expect(
      as(db, "authenticated", alice, () => db.query("select public.consume_recovery_code('alice@iqm.com', $1)", [code]))
    ).rejects.toThrow(/permission denied/);
  });

  it("rejects a wrong code, then accepts the right one exactly once", async () => {
    const wrong = await as(db, "service_role", null, () =>
      db.query<{ id: string | null }>("select public.consume_recovery_code('alice@iqm.com', 'AAAA-AAAA-AAAA') as id")
    );
    expect(wrong.rows[0].id).toBeNull();
    // Codes are matched case- and dash-insensitively.
    const loose = code.toLowerCase().replace(/-/g, " ");
    const right = await as(db, "service_role", null, () =>
      db.query<{ id: string | null }>("select public.consume_recovery_code('ALICE@iqm.com', $1) as id", [loose])
    );
    expect(right.rows[0].id).toBe(alice);
    const again = await as(db, "service_role", null, () =>
      db.query<{ id: string | null }>("select public.consume_recovery_code('alice@iqm.com', $1) as id", [code])
    );
    expect(again.rows[0].id).toBeNull();
  });

  it("locks an email after five failures in an hour", async () => {
    for (let i = 0; i < 5; i++) {
      await as(db, "service_role", null, () =>
        db.query("select public.consume_recovery_code('bob@iqm.com', 'ZZZZ-ZZZZ-ZZZZ')")
      );
    }
    await expect(
      as(db, "service_role", null, () => db.query("select public.consume_recovery_code('bob@iqm.com', 'ZZZZ-ZZZZ-ZZZZ')"))
    ).rejects.toThrow(/RATE_LIMITED/);
  });

  it("lets anyone ask for help without revealing the queue", async () => {
    await as(db, "anon", null, async () => {
      await db.query("select public.request_password_help('lost@iqm.com', 'locked out')");
      await db.query("select public.request_password_help('lost@iqm.com', 'again')");
    });
    await expect(as(db, "anon", null, () => db.query("select * from public.password_reset_requests"))).rejects.toThrow(
      /permission denied/
    );
    const r = await as(db, "authenticated", admin, () =>
      db.query("select * from public.password_reset_requests where email = 'lost@iqm.com'")
    );
    expect(r.rows).toHaveLength(1);
  });
});

describe("engagement", () => {
  it("fans a cohort assignment out as notifications to its members", async () => {
    await as(db, "authenticated", admin, () => db.query("select public.admin_set_cohort($1, $2)", [[alice, bob], cohort]));
    await as(db, "authenticated", admin, () =>
      db.query(
        "insert into public.assignments (cohort_id, target_type, target_id, assigned_by) values ($1, 'section', 'basics', $2)",
        [cohort, admin]
      )
    );
    const r = await as(db, "authenticated", alice, () =>
      db.query<{ kind: string }>("select kind from public.notifications")
    );
    expect(r.rows.map((x) => x.kind)).toContain("assignment");
    const seen = await as(db, "authenticated", alice, () => db.query("select * from public.assignments"));
    expect(seen.rows).toHaveLength(1);
  });

  it("lets learners mark notifications read but not rewrite them", async () => {
    await as(db, "authenticated", alice, () => db.query("update public.notifications set read_at = now()"));
    await expect(
      as(db, "authenticated", alice, () => db.query("update public.notifications set title = 'x'"))
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, "authenticated", alice, () =>
        db.query("insert into public.notifications (user_id, title) values ($1, 'spoof')", [bob])
      )
    ).rejects.toThrow(/row-level security/);
  });
});

describe("admin read models", () => {
  it("aggregate per-learner progress for admins only", async () => {
    const r = await as(db, "authenticated", admin, () =>
      db.query<{ email: string; completed_lessons: string[]; sims_passed: number }>(
        "select email, completed_lessons, sims_passed from public.admin_users() where email = 'alice@iqm.com'"
      )
    );
    expect(r.rows[0]).toEqual({ email: "alice@iqm.com", completed_lessons: ["basics-what-is-adtech"], sims_passed: 1 });
    await expect(as(db, "authenticated", alice, () => db.query("select * from public.admin_users()"))).rejects.toThrow(
      /ADMIN_ONLY/
    );
  });

  it("report daily activity, lesson and simulation stats", async () => {
    await as(db, "authenticated", admin, async () => {
      const days = await db.query("select * from public.admin_daily_activity(7)");
      expect(days.rows).toHaveLength(7);
      const lessons = await db.query<{ lesson_id: string; completers: number }>(
        "select lesson_id, completers from public.admin_lesson_stats()"
      );
      expect(lessons.rows).toContainEqual({ lesson_id: "basics-what-is-adtech", completers: 1 });
      const sims = await db.query<{ sim_id: string; passers: number }>("select sim_id, passers from public.admin_sim_stats()");
      expect(sims.rows).toContainEqual({ sim_id: "rtb-auction", passers: 1 });
    });
  });

  it("reset a learner's progress", async () => {
    await as(db, "authenticated", admin, () => db.query("select public.admin_reset_progress($1)", [alice]));
    const r = await db.query("select * from public.lesson_progress where user_id = $1", [alice]);
    expect(r.rows).toHaveLength(0);
  });
});

describe("team session notes", () => {
  it("lets everyone read sessions but only admins write them", async () => {
    await as(db, "authenticated", admin, () =>
      db.query("insert into public.team_sessions (id, data) values ('s1', '{\"title\":\"Kickoff\"}')")
    );
    const r = await as(db, "authenticated", alice, () => db.query("select id from public.team_sessions"));
    expect(r.rows).toHaveLength(1);
    await expect(
      as(db, "authenticated", alice, () => db.query("insert into public.team_sessions (id, data) values ('s2', '{}')"))
    ).rejects.toThrow(/row-level security/);
  });

  it("lets anyone raise and resolve doubts, but only authors and admins delete them", async () => {
    await as(db, "authenticated", alice, () =>
      db.query("insert into public.team_doubts (id, session_id, data) values ('d1', 's1', '{\"status\":\"open\"}')")
    );
    await as(db, "authenticated", bob, () =>
      db.query("update public.team_doubts set data = '{\"status\":\"resolved\"}' where id = 'd1'")
    );
    await as(db, "authenticated", bob, () => db.query("delete from public.team_doubts where id = 'd1'"));
    const still = await db.query("select id from public.team_doubts where id = 'd1'");
    expect(still.rows).toHaveLength(1);
    await as(db, "authenticated", alice, () => db.query("delete from public.team_doubts where id = 'd1'"));
    const gone = await db.query("select id from public.team_doubts where id = 'd1'");
    expect(gone.rows).toHaveLength(0);
  });

  it("only lets admins upload session images", async () => {
    await expect(
      as(db, "authenticated", alice, () =>
        db.query("insert into storage.objects (bucket_id, name) values ('session-images', 'x.png')")
      )
    ).rejects.toThrow(/row-level security/);
    await as(db, "authenticated", admin, () =>
      db.query("insert into storage.objects (bucket_id, name) values ('session-images', 'x.png')")
    );
  });
});
