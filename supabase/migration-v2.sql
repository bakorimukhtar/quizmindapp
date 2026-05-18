-- Run in Supabase SQL Editor (safe to re-run)

alter table public.decks
  add column if not exists source_text text;

create table if not exists public.question_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  question text not null,
  question_hash text not null,
  correct_answer text not null,
  options jsonb not null,
  hint text not null default '',
  explanation text not null default '',
  review_type text not null check (review_type in ('failed', 'explained')),
  times_seen integer not null default 1,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, deck_id, question_hash)
);

create index if not exists question_reviews_user_deck_idx
  on public.question_reviews (user_id, deck_id);

alter table public.question_reviews enable row level security;

drop policy if exists "Users manage own question reviews" on public.question_reviews;
create policy "Users manage own question reviews"
  on public.question_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
