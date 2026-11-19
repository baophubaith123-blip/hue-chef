-- Hue Chef — Gói H9 online arena schema (Kế hoạch hợp nhất, mục 9.3).
-- Project: the DEDICATED free-tier Supabase project "hue-chef"
-- (separate from the graduation project — never run this there).
-- Apply once via the Supabase dashboard SQL editor or the CLI.
-- Security model: the web client only ever uses the anon key; every
-- table has RLS on, players write only their own rows, and only the
-- deliberately public surfaces (directory names, tournament board,
-- stall postcards) are readable by everyone.

-- ---------------------------------------------------------------------
-- Public player directory: one row per online account.
-- ---------------------------------------------------------------------
create table if not exists public.online_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  level integer not null default 1,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Cross-device progress sync: one JSON snapshot per player, written
-- only through the game's single storage seam (mục 9.3).
-- ---------------------------------------------------------------------
create table if not exists public.progress_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Asynchronous duels (ý tưởng 8): the challenger's finished run is
-- stored as a "ghost"; the opponent answers it later, both scores and
-- the winner stay on the row for both players to read back.
-- ---------------------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users (id) on delete cascade,
  opponent_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null,
  status text not null default 'pending' check (status in ('pending', 'done')),
  challenger_score integer not null,
  challenger_ghost jsonb not null,
  opponent_score integer,
  opponent_ghost jsonb,
  winner_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists challenges_opponent_idx
  on public.challenges (opponent_id, status);
create index if not exists challenges_challenger_idx
  on public.challenges (challenger_id, status);

-- ---------------------------------------------------------------------
-- Weekly tournament (ý tưởng 21): one shared dish per ISO week; the
-- board keeps each player's best run. The week window itself is
-- derived deterministically in the client (Asia/Bangkok), so no
-- schedule table is needed; finalisation = the window closes.
-- ---------------------------------------------------------------------
create table if not exists public.tournament_entries (
  week_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  recipe_id text not null,
  score integer not null,
  stars integer not null,
  submitted_at timestamptz not null default now(),
  primary key (week_key, user_id)
);

-- ---------------------------------------------------------------------
-- Stall postcards for friend visits: a deliberately small, public
-- picture of a stall (level, stars, decorations, menu) — never the
-- full stall state.
-- ---------------------------------------------------------------------
create table if not exists public.stall_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  stall_level integer not null default 1,
  stars integer not null default 1,
  decor_ids jsonb not null default '[]'::jsonb,
  menu_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security.
-- ---------------------------------------------------------------------
alter table public.online_profiles enable row level security;
alter table public.progress_snapshots enable row level security;
alter table public.challenges enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.stall_snapshots enable row level security;

-- Directory: names/levels are public; a player writes only their row.
drop policy if exists online_profiles_read on public.online_profiles;
create policy online_profiles_read on public.online_profiles
  for select using (true);
drop policy if exists online_profiles_insert on public.online_profiles;
create policy online_profiles_insert on public.online_profiles
  for insert with check (auth.uid() = id);
drop policy if exists online_profiles_update on public.online_profiles;
create policy online_profiles_update on public.online_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Snapshots: strictly private — owner reads and writes only their own.
drop policy if exists progress_snapshots_rw on public.progress_snapshots;
create policy progress_snapshots_rw on public.progress_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Duels: visible to the two parties only. The challenger creates; both
-- parties may update (the opponent books the answer; the row's scores
-- are append-only by client contract).
drop policy if exists challenges_read on public.challenges;
create policy challenges_read on public.challenges
  for select using (auth.uid() = challenger_id or auth.uid() = opponent_id);
drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges
  for insert with check (auth.uid() = challenger_id);
drop policy if exists challenges_update on public.challenges;
create policy challenges_update on public.challenges
  for update using (auth.uid() = challenger_id or auth.uid() = opponent_id)
  with check (auth.uid() = challenger_id or auth.uid() = opponent_id);

-- Tournament board: public to read; a player writes only their row.
drop policy if exists tournament_entries_read on public.tournament_entries;
create policy tournament_entries_read on public.tournament_entries
  for select using (true);
drop policy if exists tournament_entries_insert on public.tournament_entries;
create policy tournament_entries_insert on public.tournament_entries
  for insert with check (auth.uid() = user_id);
drop policy if exists tournament_entries_update on public.tournament_entries;
create policy tournament_entries_update on public.tournament_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Stall postcards: public to read; a player writes only their own.
drop policy if exists stall_snapshots_read on public.stall_snapshots;
create policy stall_snapshots_read on public.stall_snapshots
  for select using (true);
drop policy if exists stall_snapshots_insert on public.stall_snapshots;
create policy stall_snapshots_insert on public.stall_snapshots
  for insert with check (auth.uid() = user_id);
drop policy if exists stall_snapshots_update on public.stall_snapshots;
create policy stall_snapshots_update on public.stall_snapshots
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- API access grants.
-- New Supabase projects do NOT auto-grant Data API privileges on
-- tables created through SQL, so PostgREST answers
-- "permission denied for table" (42501) even when RLS policies are
-- in place. Grant the table-level privileges explicitly: anon may
-- only read the three public boards (the RLS policies above still
-- decide exactly which rows are visible), while authenticated
-- players may read/write all five tables — their own rows only,
-- per the policies above.
-- ---------------------------------------------------------------------
grant select on public.online_profiles, public.tournament_entries, public.stall_snapshots to anon;
grant select, insert, update, delete on public.online_profiles, public.progress_snapshots, public.challenges, public.tournament_entries, public.stall_snapshots to authenticated;
