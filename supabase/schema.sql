-- RAGGING? GAME OVER. -- Supabase schema
-- Run this in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

-- ========== GAMES ==========
create table if not exists games (
  code text primary key,
  status text not null default 'lobby',            -- lobby | active | finished
  phase text not null default 'lobby',              -- lobby | question | reveal | leaderboard
  current_question int not null default -1,
  total_questions int not null default 15,
  question_started_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========== TEAMS ==========
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  game_code text not null references games(code) on delete cascade,
  name text not null,
  color text not null,
  joined_at timestamptz not null default now(),
  unique (game_code, name)
);

-- ========== QUESTIONS ==========
-- Optional persisted copy of the question bank (source of truth is lib/questions.ts,
-- kept here for reference / future host-editing). Never exposed to the client directly.
create table if not exists questions (
  idx int primary key,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text not null
);

-- ========== ANSWERS ==========
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  game_code text not null references games(code) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  question_idx int not null,
  selected_index int not null,
  is_correct boolean not null,
  points int not null default 0,
  answered_at timestamptz not null default now(),
  unique (game_code, team_id, question_idx)
);

-- ========== ROW LEVEL SECURITY ==========
alter table games enable row level security;
alter table teams enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;

-- Public (anon) can only ever READ games + teams, so the projector and phone
-- screens can subscribe to realtime changes and show who's connected.
-- Every write (create game, join, start, submit answer, advance phase,
-- compute leaderboard) happens through Next.js API routes using the
-- service role key, which bypasses RLS. This keeps scoring and correct
-- answers fully server-authoritative.

drop policy if exists "public read games" on games;
create policy "public read games" on games for select using (true);

drop policy if exists "public read teams" on teams;
create policy "public read teams" on teams for select using (true);

-- questions & answers: no anon access at all (service role bypasses RLS anyway).

-- ========== REALTIME ==========
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table teams;
