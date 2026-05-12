-- WR Coach App — Database Schema
-- Run this in the Supabase SQL editor to set up the database.

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number integer,
  position text not null default 'WR' check (position in ('WR', 'TE', 'RB', 'FB')),
  created_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  opponent text,
  created_at timestamptz not null default now()
);

create table if not exists plays (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  possession_number integer not null default 1,
  play_number integer,
  play_type text not null check (play_type in ('run', 'pass')),
  receivers_on_line uuid[] not null default '{}',
  wr_targeted uuid references players(id) on delete set null,
  result text check (result in ('completion', 'drop', 'incompletion', 'turnover')),
  yards_gained integer,
  yards_after_catch integer,
  notes text,
  created_at timestamptz not null default now()
);

-- Migrations: if you already ran this schema, run these manually:
-- alter table plays add column if not exists possession_number integer not null default 1;
-- alter table plays drop constraint if exists plays_result_check;
-- alter table plays add constraint plays_result_check check (result in ('completion', 'drop', 'incompletion', 'turnover'));

-- Indexes for common stats queries
create index if not exists plays_game_id_idx on plays(game_id);
create index if not exists plays_wr_targeted_idx on plays(wr_targeted);
create index if not exists plays_result_idx on plays(result);

-- profiles table — ready for auth (populated when Google OAuth is added)
create table if not exists profiles (
  id uuid primary key, -- will match Supabase auth.users.id
  email text not null,
  name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------
-- Row Level Security
-- Enabled on all tables. Policies are open for the
-- prototype. When auth is added, replace these with
-- role-based policies tied to the profiles table.
-- -------------------------------------------------------

alter table players enable row level security;
alter table games enable row level security;
alter table plays enable row level security;
alter table profiles enable row level security;

-- Prototype: allow full public access
-- TODO: replace with auth-gated policies when Google OAuth is added
create policy "public read players"  on players  for select using (true);
create policy "public write players" on players  for all    using (true) with check (true);

create policy "public read games"    on games    for select using (true);
create policy "public write games"   on games    for all    using (true) with check (true);

create policy "public read plays"    on plays    for select using (true);
create policy "public write plays"   on plays    for all    using (true) with check (true);

create policy "public read profiles" on profiles for select using (true);
create policy "public write profiles" on profiles for all   using (true) with check (true);
