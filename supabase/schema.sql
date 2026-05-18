-- QuizMind Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text unique,
  bio text,
  total_xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Decks
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  source_filename text,
  last_studied_at timestamptz,
  created_at timestamptz not null default now()
);

-- Questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  hint text not null default '',
  explanation text not null default '',
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- Friends (optional social feature used on profile page)
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

-- Indexes
create index if not exists decks_user_id_idx on public.decks (user_id);
create index if not exists decks_last_studied_idx on public.decks (last_studied_at desc nulls last);
create index if not exists questions_deck_id_idx on public.questions (deck_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', '')),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger for profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.questions enable row level security;
alter table public.friends enable row level security;

-- Drop existing policies (safe to re-run whole file)
drop policy if exists "Users can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can view own decks" on public.decks;
drop policy if exists "Users can insert own decks" on public.decks;
drop policy if exists "Users can update own decks" on public.decks;
drop policy if exists "Users can delete own decks" on public.decks;
drop policy if exists "Users can view questions in own decks" on public.questions;
drop policy if exists "Users can insert questions in own decks" on public.questions;
drop policy if exists "Users can delete questions in own decks" on public.questions;
drop policy if exists "Users can view own friend rows" on public.friends;
drop policy if exists "Users can send friend requests" on public.friends;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Decks policies
create policy "Users can view own decks"
  on public.decks for select
  using (auth.uid() = user_id);

create policy "Users can insert own decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own decks"
  on public.decks for update
  using (auth.uid() = user_id);

create policy "Users can delete own decks"
  on public.decks for delete
  using (auth.uid() = user_id);

-- Questions policies (via deck ownership)
create policy "Users can view questions in own decks"
  on public.questions for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = questions.deck_id and decks.user_id = auth.uid()
    )
  );

create policy "Users can insert questions in own decks"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.decks
      where decks.id = questions.deck_id and decks.user_id = auth.uid()
    )
  );

create policy "Users can delete questions in own decks"
  on public.questions for delete
  using (
    exists (
      select 1 from public.decks
      where decks.id = questions.deck_id and decks.user_id = auth.uid()
    )
  );

-- Friends policies
create policy "Users can view own friend rows"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can send friend requests"
  on public.friends for insert
  with check (auth.uid() = user_id);
