-- ============================================================================
-- Team session notes and doubts, moved off the GitHub Contents API (which
-- needed a write token shipped to every browser).
--   * Sessions: everyone signed in reads; admins write.
--   * Doubts: a shared board — anyone signed in can raise or resolve one;
--     only its author or an admin can delete it.
--   * Images: public-read storage bucket; admins upload and delete.
-- ============================================================================

create table public.team_sessions (
  id text primary key check (length(id) between 1 and 120),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid()
);

create table public.team_doubts (
  id text primary key check (length(id) between 1 and 120),
  session_id text not null,
  data jsonb not null,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index team_doubts_session_idx on public.team_doubts (session_id);

alter table public.team_sessions enable row level security;
alter table public.team_doubts enable row level security;
revoke all on public.team_sessions, public.team_doubts from anon, authenticated;

grant select, insert, update, delete on public.team_sessions to authenticated;
create policy "signed-in users read sessions" on public.team_sessions
  for select to authenticated using (true);
create policy "admins write sessions" on public.team_sessions
  for insert to authenticated with check (public.is_admin());
create policy "admins update sessions" on public.team_sessions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete sessions" on public.team_sessions
  for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.team_doubts to authenticated;
create policy "signed-in users read doubts" on public.team_doubts
  for select to authenticated using (true);
create policy "signed-in users raise doubts" on public.team_doubts
  for insert to authenticated with check (created_by = auth.uid());
create policy "signed-in users resolve doubts" on public.team_doubts
  for update to authenticated using (true) with check (true);
create policy "authors and admins delete doubts" on public.team_doubts
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- Storage bucket for session images.
insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', true)
on conflict (id) do nothing;

create policy "admins upload session images" on storage.objects
  for insert to authenticated with check (bucket_id = 'session-images' and public.is_admin());
create policy "admins update session images" on storage.objects
  for update to authenticated using (bucket_id = 'session-images' and public.is_admin());
create policy "admins delete session images" on storage.objects
  for delete to authenticated using (bucket_id = 'session-images' and public.is_admin());
