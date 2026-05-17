-- =============================================================================
-- IEEE UoP Team Registration — Supabase schema bootstrap
-- =============================================================================
-- Run this ONCE in your Supabase project's SQL Editor
-- (left sidebar ▸ SQL Editor ▸ "+ New query" ▸ paste ▸ Run).
--
-- It creates the registrations table, enforces a unique-leader rule for
-- duplicate prevention, and sets up Row-Level Security so:
--   * Anonymous users can ONLY INSERT (the form on the public site).
--   * Authenticated users (admin) can SELECT / UPDATE / DELETE.
--
-- Re-run safely — each statement uses IF NOT EXISTS / DROP IF EXISTS.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------- table ----------------
create table if not exists public.registrations (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),

  team_name       text        not null,
  team_size       text        not null check (team_size in ('2', '3')),

  leader_name     text        not null,
  leader_id       text        not null unique,
  leader_major    text        not null,
  leader_phone    text        not null,

  member2_name    text        not null,
  member2_id      text        not null,
  member2_major   text        not null,
  member2_phone   text        not null,

  member3_name    text,
  member3_id      text,
  member3_major   text,
  member3_phone   text,

  language        text,
  status          text        not null default 'New'
                              check (status in ('New', 'Contacted', 'Confirmed', 'Rejected')),
  group_letter    text        check (group_letter is null
                                     or group_letter in ('A','B','C','D','E','F','G','H'))
);

create index if not exists registrations_created_at_idx on public.registrations (created_at desc);
create index if not exists registrations_status_idx     on public.registrations (status);
create index if not exists registrations_group_idx      on public.registrations (group_letter);

-- ---------------- row-level security ----------------
alter table public.registrations enable row level security;

drop policy if exists "anon can insert"           on public.registrations;
drop policy if exists "authenticated can read"    on public.registrations;
drop policy if exists "authenticated can update"  on public.registrations;
drop policy if exists "authenticated can delete"  on public.registrations;

-- Public form submissions
create policy "anon can insert"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

-- Admin dashboard reads
create policy "authenticated can read"
  on public.registrations for select
  to authenticated
  using (true);

-- Admin dashboard inline edits (status / group)
create policy "authenticated can update"
  on public.registrations for update
  to authenticated
  using (true)
  with check (true);

-- Admin dashboard delete
create policy "authenticated can delete"
  on public.registrations for delete
  to authenticated
  using (true);
