/**
 * In-memory stand-in for the Supabase client, installed for every test in
 * src/test/setup.ts. Tables are plain arrays; the query builder applies the
 * equality-style filters the app uses, so components behave as they would
 * against a real project — without network, keys or a database.
 *
 * Default state: a signed-in, fully onboarded learner with no progress.
 * Use `fakeDb.signInAs(...)`, `fakeDb.signOut()` and `fakeDb.tables` to set
 * up other scenarios.
 */

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;
type Result = { data: unknown; error: { message: string } | null; count?: number | null };

const LEARNER_ID = "00000000-0000-4000-8000-000000000001";

export interface FakeAccount {
  id?: string;
  email?: string;
  role?: "admin" | "learner";
  profile?: Row;
}

function baseProfile(id: string, email: string): Row {
  const now = "2026-10-01T09:00:00.000Z";
  return {
    id,
    email,
    full_name: "Test Learner",
    team: "Engineering",
    experience_level: null,
    comfort: {},
    goals: null,
    weekly_minutes_goal: 60,
    learning_path: null,
    resume: null,
    started_at: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cohort_id: null,
    must_change_password: false,
    recovery_code_saved_at: now,
    first_login_at: now,
    onboarding_completed_at: now,
    tour_completed_at: now,
    last_active_at: now,
    status: "active",
    created_via: "self_signup",
    created_at: now,
  };
}

type AuthListener = (event: string, session: unknown) => void;

class FakeDb {
  tables: Record<string, Row[]> = {};
  session: { user: { id: string; email: string }; access_token: string } | null = null;
  passwords: Record<string, string> = {};
  rpcHandlers: Record<string, (args: Record<string, unknown>) => unknown> = {};
  functionHandlers: Record<string, (body: unknown) => unknown> = {};
  /** Every write, for assertions: { table, op, payload }. */
  writes: Array<{ table: string; op: string; payload: unknown }> = [];
  listeners = new Set<AuthListener>();

  reset() {
    this.tables = {};
    this.passwords = {};
    this.rpcHandlers = {};
    this.functionHandlers = {};
    this.writes = [];
    this.session = null;
    this.signInAs({});
  }

  signInAs({ id = LEARNER_ID, email = "learner@iqm.com", role = "learner", profile = {} }: FakeAccount) {
    this.table("profiles").splice(0, Infinity, ...this.table("profiles").filter((r) => r.id !== id));
    this.table("profiles").push({ ...baseProfile(id, email), ...profile });
    this.table("user_roles").splice(0, Infinity, ...this.table("user_roles").filter((r) => r.user_id !== id));
    this.table("user_roles").push({ user_id: id, role });
    this.session = { user: { id, email }, access_token: "test-token" };
    this.emit("SIGNED_IN");
  }

  signOut() {
    this.session = null;
    this.emit("SIGNED_OUT");
  }

  table(name: string): Row[] {
    return (this.tables[name] ??= []);
  }

  emit(event: string) {
    this.listeners.forEach((fn) => fn(event, this.session));
  }
}

export const fakeDb = new FakeDb();

class Query implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private payload: unknown = null;
  private conflict: string[] = ["id"];
  private singleMode: "one" | "maybe" | null = null;
  private max: number | null = null;
  private head = false;
  private wantCount = false;
  private returning = false;
  private orderBy: { column: string; ascending: boolean } | null = null;

  constructor(private readonly name: string) {}

  select(_columns?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.op = "select";
    else this.returning = true;
    this.head = Boolean(opts?.head);
    this.wantCount = Boolean(opts?.count);
    return this;
  }
  insert(rows: Row | Row[]) {
    this.op = "insert";
    this.payload = rows;
    return this;
  }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = rows;
    if (opts?.onConflict) this.conflict = opts.onConflict.split(",").map((s) => s.trim());
    return this;
  }
  update(patch: Row) {
    this.op = "update";
    this.payload = patch;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push((r) => r[column] !== value);
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.push((r) => values.includes(r[column]));
    return this;
  }
  is(column: string, value: unknown) {
    this.filters.push((r) => (r[column] ?? null) === value);
    return this;
  }
  gt(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) > value);
    return this;
  }
  gte(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) >= value);
    return this;
  }
  lt(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) < value);
    return this;
  }
  lte(column: string, value: string | number) {
    this.filters.push((r) => (r[column] as string | number) <= value);
    return this;
  }
  not() {
    return this;
  }
  or() {
    return this;
  }
  filter() {
    return this;
  }
  match(values: Row) {
    Object.entries(values).forEach(([k, v]) => this.eq(k, v));
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: opts?.ascending ?? true };
    return this;
  }
  limit(n: number) {
    this.max = n;
    return this;
  }
  range(from: number, to: number) {
    this.max = to - from + 1;
    return this;
  }
  returns() {
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }
  single() {
    this.singleMode = "one";
    return this;
  }

  private matches(row: Row) {
    return this.filters.every((f) => f(row));
  }

  private run(): Result {
    const table = fakeDb.table(this.name);
    const asArray = (p: unknown) => (Array.isArray(p) ? p : [p]) as Row[];
    let rows: Row[] = [];

    switch (this.op) {
      case "select":
        rows = table.filter((r) => this.matches(r));
        break;
      case "insert":
        rows = asArray(this.payload).map((r) => ({ id: r.id ?? crypto.randomUUID(), created_at: new Date().toISOString(), ...r }));
        table.push(...rows);
        break;
      case "upsert":
        rows = asArray(this.payload).map((r) => {
          const existing = table.find((t) => this.conflict.every((k) => t[k] === r[k]));
          if (existing) return Object.assign(existing, r);
          const created = { ...r };
          table.push(created);
          return created;
        });
        break;
      case "update":
        rows = table.filter((r) => this.matches(r));
        rows.forEach((r) => Object.assign(r, this.payload as Row));
        break;
      case "delete":
        rows = table.filter((r) => this.matches(r));
        fakeDb.tables[this.name] = table.filter((r) => !rows.includes(r));
        break;
    }
    if (this.op !== "select") fakeDb.writes.push({ table: this.name, op: this.op, payload: this.payload });

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = [...rows].sort((a, b) => {
        const x = a[column] as string;
        const y = b[column] as string;
        return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
      });
    }
    const count = rows.length;
    if (this.max !== null) rows = rows.slice(0, this.max);
    const copy = rows.map((r) => ({ ...r }));

    if (this.singleMode) {
      if (this.singleMode === "one" && copy.length !== 1) return { data: null, error: { message: "Row not found" } };
      return { data: copy[0] ?? null, error: null };
    }
    if (this.op !== "select" && !this.returning) return { data: null, error: null, count: this.wantCount ? count : null };
    return { data: this.head ? null : copy, error: null, count: this.wantCount ? count : null };
  }

  then<A = Result, B = never>(onfulfilled?: ((value: Result) => A | PromiseLike<A>) | null, onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve()
      .then(() => this.run())
      .then(onfulfilled, onrejected);
  }
}

const userFrom = () => (fakeDb.session ? { id: fakeDb.session.user.id, email: fakeDb.session.user.email } : null);

export const fakeSupabase = {
  from: (name: string) => new Query(name),
  rpc: async (name: string, args: Record<string, unknown> = {}) => {
    const handler = fakeDb.rpcHandlers[name];
    try {
      return { data: handler ? await handler(args) : null, error: null };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
    }
  },
  functions: {
    invoke: async (name: string, opts?: { body?: unknown }) => {
      const handler = fakeDb.functionHandlers[name];
      try {
        return { data: handler ? await handler(opts?.body) : null, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
  },
  storage: {
    from: () => ({
      upload: async (path: string) => ({ data: { path }, error: null }),
      remove: async () => ({ data: [], error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
    }),
  },
  auth: {
    getSession: async () => ({ data: { session: fakeDb.session }, error: null }),
    getUser: async () => ({ data: { user: userFrom() }, error: null }),
    onAuthStateChange: (cb: AuthListener) => {
      fakeDb.listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => fakeDb.listeners.delete(cb) } } };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (fakeDb.passwords[email] !== password) {
        return { data: { session: null, user: null }, error: { message: "Invalid login credentials" } };
      }
      const profile = fakeDb.table("profiles").find((p) => p.email === email);
      fakeDb.session = { user: { id: String(profile?.id ?? LEARNER_ID), email }, access_token: "test-token" };
      fakeDb.emit("SIGNED_IN");
      return { data: { session: fakeDb.session, user: fakeDb.session.user }, error: null };
    },
    signUp: async ({ email }: { email: string }) => {
      const id = crypto.randomUUID();
      fakeDb.signInAs({ id, email, profile: { recovery_code_saved_at: null, onboarding_completed_at: null } });
      return { data: { session: fakeDb.session, user: fakeDb.session?.user }, error: null };
    },
    signOut: async () => {
      fakeDb.signOut();
      return { error: null };
    },
    updateUser: async () => ({ data: { user: userFrom() }, error: null }),
  },
};
