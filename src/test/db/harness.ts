import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Runs the real Supabase migrations inside an in-process Postgres (PGlite)
 * on top of a minimal stand-in for what Supabase provides: the anon /
 * authenticated / service_role roles, an auth.users table, auth.uid() and
 * Supabase's default grants. That makes row-level security testable in CI
 * without Docker.
 */

const MIGRATIONS_DIR = join(__dirname, "..", "..", "..", "supabase", "migrations");

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    raw_app_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
  $$;

  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text,
    owner uuid default auth.uid()
  );
  alter table storage.objects enable row level security;
  grant select, insert, update, delete on storage.objects to authenticated;

  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant all on all tables in schema auth to service_role;

  -- Supabase grants everything in public to the API roles by default; the
  -- migrations are written to revoke what they don't want.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export type Db = PGlite;

export async function createDb(): Promise<Db> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }
  return db;
}

/** Simulates GoTrue inserting a user (as the auth admin, i.e. superuser). */
export async function createAuthUser(db: Db, email: string, fullName?: string): Promise<string> {
  const res = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [email, JSON.stringify(fullName ? { full_name: fullName } : {})]
  );
  return res.rows[0].id;
}

type Role = "anon" | "authenticated" | "service_role";

/**
 * Run `fn` as a given API role and user. Resets afterwards so tests can't
 * leak a role into each other.
 */
export async function as<T>(db: Db, role: Role, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    userId ? JSON.stringify({ sub: userId, role }) : "",
  ]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims', '', false)");
  }
}
