-- NeuroChat Phase 2 Sprint 1 schema
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

-- Users (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text,
  has_onboarded boolean default false,
  font_size text default 'medium',
  pacing_mode boolean default false,
  show_hints boolean default true,
  mood_history text[] default '{}',
  last_mood text,
  created_at timestamptz default now()
);

-- Completed sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  scenario_id text not null,
  messages jsonb not null,
  feedback jsonb,
  mood text,
  created_at timestamptz default now()
);

-- User progress (denormalised for fast reads)
create table if not exists progress (
  user_id uuid references profiles(id) on delete cascade primary key,
  completed_scenarios text[] default '{}',
  earned_badges text[] default '{}',
  total_sessions integer default 0,
  unlocked_content text[] default '{}',
  last_active timestamptz default now()
);

-- Custom scenarios
create table if not exists custom_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  opener text not null,
  ai_personality text,
  suggested_replies jsonb,
  created_at timestamptz default now()
);

-- Institutional accounts
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_user_id uuid references profiles(id),
  licence_type text,
  max_seats integer,
  created_at timestamptz default now()
);

create table if not exists org_members (
  org_id uuid references organisations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  primary key (org_id, user_id)
);

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table progress enable row level security;
alter table custom_scenarios enable row level security;
alter table organisations enable row level security;
alter table org_members enable row level security;

create policy "Users can read own profile"
on profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on profiles for update
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can read own sessions"
on sessions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own sessions"
on sessions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read own progress"
on progress for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can upsert own progress"
on progress for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
