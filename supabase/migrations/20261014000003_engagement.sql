-- ============================================================================
-- Engagement: admin assignments, announcements and in-app notifications.
-- ============================================================================

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  cohort_id uuid references public.cohorts (id) on delete cascade,
  target_type text not null check (target_type in ('lesson', 'section', 'simulation')),
  target_id text not null check (length(target_id) between 1 and 120),
  due_date date,
  note text check (note is null or length(note) <= 1000),
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((user_id is not null) <> (cohort_id is not null))
);

create index assignments_user_idx on public.assignments (user_id);
create index assignments_cohort_idx on public.assignments (cohort_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  body text not null check (length(body) <= 5000),
  cohort_id uuid references public.cohorts (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'info' check (kind in ('info', 'nudge', 'assignment', 'announcement', 'badge')),
  title text not null check (length(title) between 1 and 200),
  body text check (body is null or length(body) <= 2000),
  link text check (link is null or link ~ '^/'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Fan an assignment out to the people it targets as notifications.
create function public.notify_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, kind, title, body, link, created_by)
  select p.id, 'assignment',
         'New assignment',
         coalesce(new.note, 'An admin assigned you something to work on.')
           || case when new.due_date is not null then ' Due ' || to_char(new.due_date, 'Mon DD') || '.' else '' end,
         '/dashboard',
         new.assigned_by
  from public.profiles p
  where (new.user_id is not null and p.id = new.user_id)
     or (new.cohort_id is not null and p.cohort_id = new.cohort_id);
  return new;
end;
$$;

create trigger on_assignment_created
  after insert on public.assignments
  for each row execute function public.notify_assignment();

create function public.notify_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, kind, title, body, link, created_by)
  select p.id, 'announcement', new.title, left(new.body, 280), '/dashboard', new.created_by
  from public.profiles p
  where p.status = 'active'
    and (new.cohort_id is null or p.cohort_id = new.cohort_id);
  return new;
end;
$$;

create trigger on_announcement_created
  after insert on public.announcements
  for each row execute function public.notify_announcement();

revoke execute on function public.notify_assignment() from public, anon, authenticated;
revoke execute on function public.notify_announcement() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Row-level security.
-- ----------------------------------------------------------------------------

alter table public.assignments enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;

revoke all on public.assignments, public.announcements, public.notifications from anon, authenticated;

grant select, insert, update, delete on public.assignments to authenticated;
create policy "see own and cohort assignments" on public.assignments
  for select to authenticated
  using (user_id = auth.uid() or (cohort_id is not null and cohort_id = public.my_cohort_id()) or public.is_admin());
create policy "admins manage assignments" on public.assignments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.announcements to authenticated;
create policy "see announcements for me" on public.announcements
  for select to authenticated
  using (cohort_id is null or cohort_id = public.my_cohort_id() or public.is_admin());
create policy "admins manage announcements" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "mark own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins send notifications" on public.notifications
  for insert to authenticated with check (public.is_admin());
create policy "delete own notifications" on public.notifications
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());
