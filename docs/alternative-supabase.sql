-- One row per parent account. The whole family state lives in `data`.
--
-- What is stored: a first name the parent typed, an age, which stories were
-- heard and on what night, and the difficult-stories setting. Nothing else --
-- no behavioural events, no per-child analytics, nothing shared onward.
-- The account holder is the parent; the child's data is minimal and used only
-- to deliver the service. See PRIVACY.md before adding a column.

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A parent can read and write their own row, and no other.
drop policy if exists "profiles are private to their owner" on public.profiles;
create policy "profiles are private to their owner"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Deleting the account takes the family's data with it (on delete cascade above).
-- Keep it that way: a parent who leaves should not have to ask twice.
