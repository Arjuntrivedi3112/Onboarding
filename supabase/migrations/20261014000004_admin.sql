-- ============================================================================
-- Admin RPCs. Each is SECURITY DEFINER and refuses non-admins, so the admin
-- console gets aggregated, fast answers without shipping raw tables around.
-- Curriculum-dependent maths (book %, minute weighting) stays in TypeScript:
-- these return lesson ids and counts, and the client applies the curriculum.
-- ============================================================================

create function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_ONLY' using errcode = '42501';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Member management.
-- ----------------------------------------------------------------------------

create function public.admin_set_role(p_user uuid, p_role public.app_role)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  if p_role = 'learner'
     and (select role from public.user_roles where user_id = p_user) = 'admin'
     and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'LAST_ADMIN' using hint = 'Promote someone else before demoting the last admin.';
  end if;
  insert into public.user_roles (user_id, role, updated_at, updated_by)
  values (p_user, p_role, now(), auth.uid())
  on conflict (user_id) do update
    set role = excluded.role, updated_at = now(), updated_by = auth.uid();
end;
$$;

-- Move one or many members into a cohort (null removes them from any cohort).
create function public.admin_set_cohort(p_users uuid[], p_cohort uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set cohort_id = p_cohort where id = any (p_users);
end;
$$;

create function public.admin_update_profile(p_user uuid, p_full_name text, p_team text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles
    set full_name = nullif(trim(p_full_name), ''), team = nullif(trim(p_team), '')
    where id = p_user;
end;
$$;

-- Wipe a learner's progress (not their account, notes or feedback).
create function public.admin_reset_progress(p_user uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  delete from public.lesson_progress where user_id = p_user;
  delete from public.bookmarks where user_id = p_user;
  delete from public.self_checks where user_id = p_user;
  delete from public.simulation_progress where user_id = p_user;
  delete from public.achievements where user_id = p_user;
  update public.profiles set resume = null, started_at = null where id = p_user;
end;
$$;

-- ----------------------------------------------------------------------------
-- Read models.
-- ----------------------------------------------------------------------------

create function public.admin_users()
returns table (
  id uuid,
  email text,
  full_name text,
  team text,
  role public.app_role,
  cohort_id uuid,
  status text,
  created_via text,
  created_at timestamptz,
  first_login_at timestamptz,
  last_active_at timestamptz,
  onboarding_completed_at timestamptz,
  weekly_minutes_goal integer,
  must_change_password boolean,
  completed_lessons text[],
  visited_lessons integer,
  time_spent_seconds bigint,
  sims_opened integer,
  sims_passed integer,
  badges integer,
  got_it integer,
  partly integer,
  missed integer,
  active_days_14 integer,
  reading_seconds_7 bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  select
    p.id, p.email, p.full_name, p.team, coalesce(r.role, 'learner'::public.app_role),
    p.cohort_id, p.status, p.created_via, p.created_at, p.first_login_at, p.last_active_at,
    p.onboarding_completed_at, p.weekly_minutes_goal, p.must_change_password,
    coalesce(lp.completed, '{}'::text[]),
    coalesce(lp.visited, 0),
    coalesce(lp.seconds, 0)::bigint,
    coalesce(sp.opened, 0),
    coalesce(sp.passed, 0),
    coalesce(a.badges, 0),
    coalesce(sc.got_it, 0),
    coalesce(sc.partly, 0),
    coalesce(sc.missed, 0),
    coalesce(da.days14, 0),
    coalesce(da.seconds7, 0)::bigint
  from public.profiles p
  left join public.user_roles r on r.user_id = p.id
  left join lateral (
    select
      array_agg(x.lesson_id order by x.completed_at) filter (where x.completed_at is not null) as completed,
      count(*) filter (where x.first_visited_at is not null)::int as visited,
      sum(x.time_spent_seconds) as seconds
    from public.lesson_progress x where x.user_id = p.id
  ) lp on true
  left join lateral (
    select count(*)::int as opened, count(x.challenge_passed_at)::int as passed
    from public.simulation_progress x where x.user_id = p.id
  ) sp on true
  left join lateral (
    select count(*)::int as badges from public.achievements x where x.user_id = p.id
  ) a on true
  left join lateral (
    select
      count(*) filter (where x.rating = 'got_it')::int as got_it,
      count(*) filter (where x.rating = 'partly')::int as partly,
      count(*) filter (where x.rating = 'missed')::int as missed
    from public.self_checks x where x.user_id = p.id
  ) sc on true
  left join lateral (
    select
      count(*) filter (where x.day > current_date - 14)::int as days14,
      sum(x.reading_seconds) filter (where x.day > current_date - 7) as seconds7
    from public.daily_activity x where x.user_id = p.id
  ) da on true
  order by p.created_at desc;
end;
$$;

create function public.admin_daily_activity(p_days integer default 30)
returns table (
  day date,
  active_users integer,
  reading_minutes integer,
  lessons_completed integer,
  sims_passed integer,
  chat_questions integer,
  signups integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  with days as (
    select generate_series(current_date - (greatest(1, least(p_days, 365)) - 1), current_date, interval '1 day')::date as day
  )
  select
    d.day,
    (select count(distinct x.user_id)::int from public.daily_activity x where x.day = d.day),
    (select coalesce(sum(x.reading_seconds), 0)::int / 60 from public.daily_activity x where x.day = d.day),
    (select count(*)::int from public.lesson_progress x where x.completed_at::date = d.day),
    (select count(*)::int from public.simulation_progress x where x.challenge_passed_at::date = d.day),
    (select count(*)::int from public.chat_questions x where x.created_at::date = d.day),
    (select count(*)::int from public.profiles x where x.created_at::date = d.day)
  from days d
  order by d.day;
end;
$$;

create function public.admin_lesson_stats()
returns table (
  lesson_id text,
  viewers integer,
  completers integer,
  avg_seconds integer,
  got_it integer,
  partly integer,
  missed integer,
  helpful_yes integer,
  helpful_no integer,
  comments integer,
  chat_questions integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  with ids as (
    select x.lesson_id from public.lesson_progress x
    union select x.lesson_id from public.self_checks x
    union select x.lesson_id from public.lesson_feedback x
    union select x.lesson_id from public.chat_questions x where x.lesson_id is not null
  )
  select
    i.lesson_id,
    (select count(*)::int from public.lesson_progress x where x.lesson_id = i.lesson_id and x.first_visited_at is not null),
    (select count(*)::int from public.lesson_progress x where x.lesson_id = i.lesson_id and x.completed_at is not null),
    (select coalesce(avg(x.time_spent_seconds), 0)::int from public.lesson_progress x where x.lesson_id = i.lesson_id and x.time_spent_seconds > 0),
    (select count(*)::int from public.self_checks x where x.lesson_id = i.lesson_id and x.rating = 'got_it'),
    (select count(*)::int from public.self_checks x where x.lesson_id = i.lesson_id and x.rating = 'partly'),
    (select count(*)::int from public.self_checks x where x.lesson_id = i.lesson_id and x.rating = 'missed'),
    (select count(*)::int from public.lesson_feedback x where x.lesson_id = i.lesson_id and x.helpful),
    (select count(*)::int from public.lesson_feedback x where x.lesson_id = i.lesson_id and not x.helpful),
    (select count(*)::int from public.lesson_feedback x where x.lesson_id = i.lesson_id and x.comment is not null and x.comment <> ''),
    (select count(*)::int from public.chat_questions x where x.lesson_id = i.lesson_id)
  from ids i;
end;
$$;

create function public.admin_sim_stats()
returns table (sim_id text, openers integer, passers integer, total_runs integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  select x.sim_id, count(*)::int, count(x.challenge_passed_at)::int, sum(x.runs)::int
  from public.simulation_progress x
  group by x.sim_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Grants.
-- ----------------------------------------------------------------------------

do $$
declare
  f text;
begin
  foreach f in array array[
    'assert_admin()',
    'admin_set_role(uuid, public.app_role)',
    'admin_set_cohort(uuid[], uuid)',
    'admin_update_profile(uuid, text, text)',
    'admin_reset_progress(uuid)',
    'admin_users()',
    'admin_daily_activity(integer)',
    'admin_lesson_stats()',
    'admin_sim_stats()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;
