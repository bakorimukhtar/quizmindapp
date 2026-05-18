-- Run this ONLY if you already created tables but policies failed partway.
-- Safe to run multiple times.

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.questions enable row level security;
alter table public.friends enable row level security;

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

create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own decks"
  on public.decks for select using (auth.uid() = user_id);

create policy "Users can insert own decks"
  on public.decks for insert with check (auth.uid() = user_id);

create policy "Users can update own decks"
  on public.decks for update using (auth.uid() = user_id);

create policy "Users can delete own decks"
  on public.decks for delete using (auth.uid() = user_id);

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

create policy "Users can view own friend rows"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can send friend requests"
  on public.friends for insert
  with check (auth.uid() = user_id);
