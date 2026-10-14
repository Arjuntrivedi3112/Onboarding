-- ============================================================================
-- Accounts: profiles, roles, cohorts, provisioning and password recovery.
--
-- Nothing in this platform sends email. Accounts are either
--   * created by an admin (the admin-users edge function records an
--     account_provisions row, then calls auth.admin.createUser), or
--   * self-registered by anyone on an allowed domain (@iqm.com).
-- Password recovery uses a one-time recovery code the learner saves on first
-- login; if they lose it, an admin generates a new password.
-- ============================================================================

create type public.app_role as enum ('admin', 'learner');

-- Small key/value table for policy that admins may want to change without a
-- deploy (allowed sign-up domains, bootstrap admins).
create table public.app_settings (
  key text primary key,
  value jsonb not null
);

insert into public.app_settings (key, value) values
  ('self_signup_domains', '["iqm.com"]'),
  ('admin_bootstrap_emails', '["arjun.trivedi@iqm.com"]');

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  start_date date,
  target_end_date date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  team text,
  experience_level text,
  -- partId -> 1..5 self-rated comfort, captured during onboarding.
  comfort jsonb not null default '{}'::jsonb,
  goals text,
  weekly_minutes_goal integer check (weekly_minutes_goal is null or weekly_minutes_goal between 10 and 1000),
  -- Ordered section ids: the personalised path built at onboarding.
  learning_path jsonb,
  -- Resume pointer mirrored from the client progress store.
  resume jsonb,
  started_at timestamptz,
  -- IANA zone, so "a day" for streaks and weekly goals means the learner's day.
  timezone text not null default 'UTC' check (length(timezone) <= 64),
  cohort_id uuid references public.cohorts (id) on delete set null,
  must_change_password boolean not null default false,
  recovery_code_saved_at timestamptz,
  first_login_at timestamptz,
  onboarding_completed_at timestamptz,
  tour_completed_at timestamptz,
  last_active_at timestamptz,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_via text not null default 'self_signup' check (created_via in ('self_signup', 'admin')),
  created_at timestamptz not null default now()
);

create index profiles_cohort_idx on public.profiles (cohort_id);

-- Roles live apart from profiles so no profile update can ever grant admin.
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'learner',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- Written only by the admin-users edge function (service role) just before it
-- creates the auth user. The sign-up trigger trusts this table, never
-- client-supplied metadata.
create table public.account_provisions (
  email text primary key check (email = lower(email)),
  role public.app_role not null default 'learner',
  cohort_id uuid references public.cohorts (id) on delete set null,
  full_name text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create table public.recovery_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  salt text not null,
  created_at timestamptz not null default now()
);

create table public.recovery_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create index recovery_attempts_email_idx on public.recovery_attempts (email, attempted_at desc);

create table public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz
);

-- ----------------------------------------------------------------------------
-- Helpers used by row-level security. SECURITY DEFINER so policies can consult
-- user_roles/profiles without recursing into their own policies.
-- ----------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create function public.my_cohort_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cohort_id from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- Sign-up gate and profile creation.
-- ----------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(new.email);
  v_domain text := split_part(lower(new.email), '@', 2);
  v_provision public.account_provisions%rowtype;
  v_role public.app_role := 'learner';
  v_domain_ok boolean;
begin
  select * into v_provision
  from public.account_provisions
  where email = v_email and consumed_at is null;

  select exists (
    select 1 from public.app_settings s, jsonb_array_elements_text(s.value) d
    where s.key = 'self_signup_domains' and lower(d) = v_domain
  ) into v_domain_ok;

  if v_provision.email is null and not v_domain_ok then
    raise exception 'SIGNUP_NOT_ALLOWED'
      using hint = 'Only allowed email domains can self-register. Ask an admin to add you.';
  end if;

  if v_provision.email is not null then
    v_role := v_provision.role;
    update public.account_provisions set consumed_at = now() where email = v_email;
  end if;

  if exists (
    select 1 from public.app_settings s, jsonb_array_elements_text(s.value) e
    where s.key = 'admin_bootstrap_emails' and lower(e) = v_email
  ) then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, cohort_id, must_change_password, created_via)
  values (
    new.id,
    v_email,
    coalesce(v_provision.full_name, nullif(new.raw_user_meta_data ->> 'full_name', '')),
    v_provision.cohort_id,
    v_provision.email is not null,
    case when v_provision.email is not null then 'admin' else 'self_signup' end
  );

  insert into public.user_roles (user_id, role) values (new.id, v_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up form explain a rejection before calling auth (the auth API
-- only reports "Database error saving new user" when the trigger raises).
create function public.can_self_register(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_settings s, jsonb_array_elements_text(s.value) d
    where s.key = 'self_signup_domains' and lower(d) = split_part(lower(p_email), '@', 2)
  );
$$;

-- ----------------------------------------------------------------------------
-- Recovery codes.
-- ----------------------------------------------------------------------------

-- 12 characters from an unambiguous alphabet, formatted XXXX-XXXX-XXXX.
create function public.generate_recovery_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := sha256(convert_to(gen_random_uuid()::text || clock_timestamp()::text || random()::text, 'UTF8'));
  out text := '';
  i int;
begin
  for i in 0..11 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
    if i in (3, 7) then out := out || '-'; end if;
  end loop;
  return out;
end;
$$;

create function public.hash_recovery_code(p_code text, p_salt text)
returns text
language sql
immutable
as $$
  select encode(sha256(convert_to(p_salt || ':' || upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex');
$$;

-- Issues (or replaces) the caller's recovery code and returns it once. The
-- caller confirms they saved it via confirm_recovery_code_saved().
create function public.regenerate_recovery_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_code text := public.generate_recovery_code();
  v_salt text := encode(sha256(convert_to(gen_random_uuid()::text, 'UTF8')), 'hex');
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  insert into public.recovery_codes (user_id, code_hash, salt)
  values (auth.uid(), public.hash_recovery_code(v_code, v_salt), v_salt)
  on conflict (user_id) do update
    set code_hash = excluded.code_hash, salt = excluded.salt, created_at = now();
  update public.profiles set recovery_code_saved_at = null where id = auth.uid();
  return v_code;
end;
$$;

create function public.confirm_recovery_code_saved()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.profiles set recovery_code_saved_at = now()
  where id = auth.uid()
    and exists (select 1 from public.recovery_codes where user_id = auth.uid());
$$;

-- Called only by the account-recovery edge function (service role). Returns
-- the user id when the code matches, consuming it; null otherwise. Five
-- failed attempts per email per hour lock further tries.
create function public.consume_recovery_code(p_email text, p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_row public.recovery_codes%rowtype;
  v_failures int;
begin
  select count(*) into v_failures from public.recovery_attempts
  where email = v_email and not succeeded and attempted_at > now() - interval '1 hour';
  if v_failures >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  select p.id into v_user from public.profiles p where p.email = v_email and p.status = 'active';
  if v_user is not null then
    select * into v_row from public.recovery_codes where user_id = v_user;
  end if;

  if v_row.user_id is null or v_row.code_hash <> public.hash_recovery_code(p_code, v_row.salt) then
    insert into public.recovery_attempts (email, succeeded) values (v_email, false);
    return null;
  end if;

  insert into public.recovery_attempts (email, succeeded) values (v_email, true);
  delete from public.recovery_codes where user_id = v_user;
  update public.profiles
    set recovery_code_saved_at = null, must_change_password = false
    where id = v_user;
  return v_user;
end;
$$;

-- "I lost my recovery code" — always succeeds so it cannot be used to probe
-- which emails have accounts. One pending request per email.
create function public.request_password_help(p_email text, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    return;
  end if;
  if exists (select 1 from public.password_reset_requests where email = v_email and status = 'pending') then
    return;
  end if;
  -- Crude global brake against scripted spam.
  if (select count(*) from public.password_reset_requests where created_at > now() - interval '1 hour') > 50 then
    return;
  end if;
  insert into public.password_reset_requests (email, note)
  values (v_email, left(nullif(trim(p_note), ''), 500));
end;
$$;

-- Clears the first-login flag once the learner has chosen their own password.
create function public.mark_password_changed()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.profiles set must_change_password = false where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- Row-level security.
-- ----------------------------------------------------------------------------

alter table public.app_settings enable row level security;
alter table public.cohorts enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.account_provisions enable row level security;
alter table public.recovery_codes enable row level security;
alter table public.recovery_attempts enable row level security;
alter table public.password_reset_requests enable row level security;

revoke all on public.app_settings, public.cohorts, public.profiles, public.user_roles,
  public.account_provisions, public.recovery_codes, public.recovery_attempts,
  public.password_reset_requests from anon, authenticated;

-- app_settings: admins only.
grant select, insert, update on public.app_settings to authenticated;
create policy "admins manage settings" on public.app_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- cohorts: everyone signed in can see names (their own badge on the profile);
-- only admins manage them.
grant select, insert, update, delete on public.cohorts to authenticated;
create policy "signed-in users read cohorts" on public.cohorts
  for select to authenticated using (true);
create policy "admins manage cohorts" on public.cohorts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles: own row, or everything for admins. Column grants keep learners
-- from editing their email, cohort, status or provenance.
grant select on public.profiles to authenticated;
grant update (full_name, team, experience_level, comfort, goals, weekly_minutes_goal,
  learning_path, resume, started_at, timezone, first_login_at, onboarding_completed_at,
  tour_completed_at, last_active_at)
  on public.profiles to authenticated;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- user_roles: readable by the owner and admins; changed only via admin RPCs.
grant select on public.user_roles to authenticated;
create policy "read own role" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- account_provisions: admins can see what was provisioned; writes come from
-- the service role only.
grant select on public.account_provisions to authenticated;
create policy "admins read provisions" on public.account_provisions
  for select to authenticated using (public.is_admin());

-- recovery_codes / recovery_attempts: no client access at all.

-- password_reset_requests: admins only (inserts go through the RPC).
grant select, update on public.password_reset_requests to authenticated;
create policy "admins manage reset requests" on public.password_reset_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Function execution: Postgres grants EXECUTE to PUBLIC by default.
revoke execute on function public.consume_recovery_code(text, text) from public, anon, authenticated;
revoke execute on function public.generate_recovery_code() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.regenerate_recovery_code() from public, anon;
revoke execute on function public.confirm_recovery_code_saved() from public, anon;
revoke execute on function public.mark_password_changed() from public, anon;
grant execute on function public.regenerate_recovery_code() to authenticated;
grant execute on function public.confirm_recovery_code_saved() to authenticated;
grant execute on function public.mark_password_changed() to authenticated;
grant execute on function public.can_self_register(text) to anon, authenticated;
grant execute on function public.request_password_help(text, text) to anon, authenticated;
grant execute on function public.consume_recovery_code(text, text) to service_role;
