-- ============================================================================
-- Learning data: progress, self-checks, simulations, badges, feedback, notes,
-- activity. Every row belongs to one learner; admins can read everything.
--
-- Lesson and simulation ids are the stable ids from the TypeScript curriculum
-- (src/curriculum/data.ts, src/simulations/registry.ts). The database never
-- duplicates the curriculum — percentages and weights are computed in TS.
-- ============================================================================

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_id text not null check (length(lesson_id) between 1 and 120),
  first_visited_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  max_scroll_pct smallint not null default 0 check (max_scroll_pct between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_id text not null check (length(lesson_id) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.self_checks (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_id text not null check (length(lesson_id) between 1 and 120),
  question_index smallint not null check (question_index between 0 and 50),
  rating text not null check (rating in ('got_it', 'partly', 'missed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id, question_index)
);

create table public.simulation_progress (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  sim_id text not null check (length(sim_id) between 1 and 80),
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  runs integer not null default 1 check (runs >= 0),
  challenge_passed_at timestamptz,
  primary key (user_id, sim_id)
);

create table public.achievements (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  badge_id text not null check (length(badge_id) between 1 and 80),
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.lesson_feedback (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_id text not null check (length(lesson_id) between 1 and 120),
  helpful boolean not null,
  comment text check (comment is null or length(comment) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.lesson_notes (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_id text not null check (length(lesson_id) between 1 and 120),
  body text not null check (length(body) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type text not null check (type in (
    'login', 'lesson_view', 'lesson_complete', 'lesson_uncomplete',
    'sim_open', 'sim_pass', 'search', 'chat_question', 'bookmark',
    'self_check', 'feedback', 'badge', 'onboarding_complete', 'tour_complete'
  )),
  lesson_id text,
  sim_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_events_user_time_idx on public.activity_events (user_id, created_at desc);
create index activity_events_time_idx on public.activity_events (created_at desc);

-- One row per learner per local day they did anything. Drives streaks, the
-- weekly goal ring and the admin daily-activity chart.
create table public.daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  day date not null,
  reading_seconds integer not null default 0 check (reading_seconds >= 0),
  events integer not null default 0 check (events >= 0),
  primary key (user_id, day)
);

create index daily_activity_day_idx on public.daily_activity (day);

create function public.local_today(p_user uuid)
returns date
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz text;
begin
  select timezone into v_tz from public.profiles where id = p_user;
  return (now() at time zone coalesce(v_tz, 'UTC'))::date;
exception when others then
  -- An unrecognised zone name falls back to UTC rather than failing a write.
  return (now() at time zone 'UTC')::date;
end;
$$;

create table public.chat_questions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_id text,
  context text,
  question text not null check (length(question) <= 4000),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create index chat_questions_time_idx on public.chat_questions (created_at desc);

-- ----------------------------------------------------------------------------
-- Write helpers. Each is SECURITY DEFINER only to stamp auth.uid() and keep
-- the arithmetic server-side; each still only touches the caller's rows.
-- ----------------------------------------------------------------------------

-- Visibility-aware reading heartbeat. Seconds are capped per call so a
-- tampered client cannot claim hours in one request.
create function public.add_lesson_time(p_lesson_id text, p_seconds integer, p_scroll_pct integer default 0)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_seconds int := greatest(0, least(coalesce(p_seconds, 0), 120));
  v_scroll int := greatest(0, least(coalesce(p_scroll_pct, 0), 100));
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  insert into public.lesson_progress (user_id, lesson_id, first_visited_at, time_spent_seconds, max_scroll_pct)
  values (auth.uid(), p_lesson_id, now(), v_seconds, v_scroll)
  on conflict (user_id, lesson_id) do update
    set time_spent_seconds = public.lesson_progress.time_spent_seconds + v_seconds,
        max_scroll_pct = greatest(public.lesson_progress.max_scroll_pct, v_scroll),
        updated_at = now();
  insert into public.daily_activity (user_id, day, reading_seconds)
  values (auth.uid(), public.local_today(auth.uid()), v_seconds)
  on conflict (user_id, day) do update
    set reading_seconds = public.daily_activity.reading_seconds + v_seconds;
  update public.profiles set last_active_at = now() where id = auth.uid();
end;
$$;

-- Any tracked event also counts the day as active.
create function public.touch_daily_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_activity (user_id, day, events)
  values (new.user_id, public.local_today(new.user_id), 1)
  on conflict (user_id, day) do update
    set events = public.daily_activity.events + 1;
  update public.profiles set last_active_at = now() where id = new.user_id;
  return new;
end;
$$;

create trigger on_activity_event
  after insert on public.activity_events
  for each row execute function public.touch_daily_activity();

create function public.record_sim_open(p_sim_id text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into public.simulation_progress (user_id, sim_id)
  values (auth.uid(), p_sim_id)
  on conflict (user_id, sim_id) do update
    set runs = public.simulation_progress.runs + 1, last_opened_at = now();
$$;

create function public.record_sim_pass(p_sim_id text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into public.simulation_progress (user_id, sim_id, challenge_passed_at)
  values (auth.uid(), p_sim_id, now())
  on conflict (user_id, sim_id) do update
    set challenge_passed_at = coalesce(public.simulation_progress.challenge_passed_at, now()),
        last_opened_at = now();
$$;

-- ----------------------------------------------------------------------------
-- Row-level security: own rows for learners, read-all for admins.
-- ----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'lesson_progress', 'bookmarks', 'self_checks', 'simulation_progress',
    'achievements', 'lesson_feedback', 'lesson_notes', 'activity_events', 'chat_questions',
    'daily_activity'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format(
      'create policy "own rows or admin read" on public.%I for select to authenticated using (user_id = auth.uid() or public.is_admin())',
      t
    );
    execute format(
      'create policy "insert own rows" on public.%I for insert to authenticated with check (user_id = auth.uid())',
      t
    );
  end loop;
end;
$$;

-- Notes are private: admins see that notes exist in aggregate only via RPCs,
-- never the text.
drop policy "own rows or admin read" on public.lesson_notes;
create policy "own notes" on public.lesson_notes
  for select to authenticated using (user_id = auth.uid());

-- Mutable tables: learners update and delete their own rows.
do $$
declare
  t text;
begin
  foreach t in array array[
    'lesson_progress', 'bookmarks', 'self_checks', 'simulation_progress',
    'lesson_feedback', 'lesson_notes'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "update own rows" on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
    execute format(
      'create policy "delete own rows" on public.%I for delete to authenticated using (user_id = auth.uid())',
      t
    );
  end loop;
end;
$$;

-- Append-only tables.
grant select, insert on public.achievements, public.activity_events, public.chat_questions to authenticated;

grant select on public.daily_activity to authenticated;
revoke execute on function public.touch_daily_activity() from public, anon, authenticated;
revoke execute on function public.local_today(uuid) from public, anon, authenticated;
revoke execute on function public.add_lesson_time(text, integer, integer) from public, anon;
revoke execute on function public.record_sim_open(text) from public, anon;
revoke execute on function public.record_sim_pass(text) from public, anon;
grant execute on function public.add_lesson_time(text, integer, integer) to authenticated;
grant execute on function public.record_sim_open(text) to authenticated;
grant execute on function public.record_sim_pass(text) to authenticated;
