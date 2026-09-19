-- Hyperlocal GTM Copilot — corpus schema
-- One city on demo day: Boston. Multi-city is a column, not a rewrite.
-- Run this in Supabase Studio -> SQL Editor.

create extension if not exists "pgcrypto";

drop table if exists corpus_entries cascade;

create table corpus_entries (
  -- identity
  id              text primary key,              -- stable slug, e.g. 'evt-masschallenge-showcase'
  city            text not null default 'Boston',

  -- the nine agreed fields (locked schema — do not change without telling Person B)
  type            text not null check (type in ('event','person_org','channel')),
  name            text not null,
  url             text not null,
  date_or_cadence text not null,                 -- ISO date, date range, or cadence string
  who_it_serves   text not null,
  tags            text[] not null default '{}',
  why_it_matters  text not null,
  cost            text not null,                 -- 'Free', '$25', 'Free to apply', etc.
  contact_route   text not null,                 -- PUBLIC org routes only. No personal emails.

  -- operational (not part of Person B's contract; ignore in the prompt)
  last_verified   date not null default current_date,
  created_at      timestamptz not null default now()
);

create index corpus_entries_city_type_idx on corpus_entries (city, type);
create index corpus_entries_tags_idx      on corpus_entries using gin (tags);

-- Row Level Security: the corpus is public read, service-role write.
-- The frontend uses the anon key and can only SELECT.
alter table corpus_entries enable row level security;

drop policy if exists "corpus public read" on corpus_entries;
create policy "corpus public read"
  on corpus_entries for select
  to anon, authenticated
  using (true);

-- Writes are service_role only, which bypasses RLS. No insert/update/delete policy
-- exists for anon on purpose.

-- Convenience view: exactly the nine fields Person B's prompt should see.
drop view if exists corpus_for_prompt;
create view corpus_for_prompt as
  select id, type, name, url, date_or_cadence, who_it_serves,
         tags, why_it_matters, cost, contact_route
  from corpus_entries
  where city = 'Boston';


-- ============================================================
-- PROFILE SIDE (Person A)
-- The six intake fields from F1, plus the derived signals that
-- connect a founder to the corpus.
-- ============================================================

drop table if exists generated_plans cascade;
drop table if exists founder_profiles cascade;

create table founder_profiles (
  id             uuid primary key default gen_random_uuid(),

  -- F1: the six fields, exactly as the intake screen collects them
  building       text not null,          -- "what you're building"
  city           text not null,          -- free text; gated before we generate
  neighbourhood  text,                   -- optional, sharpens hyperlocal matching
  stage          text not null check (stage in
                   ('idea','building','launched','early-revenue','raising')),
  customer       text not null,          -- "who your customer is"
  goal           text not null check (goal in
                   ('users','pilot-customers','funding','press')),
  already_tried  text,                   -- optional

  -- derived by lib/profile.mjs, not typed by the user.
  -- This is the join key to the corpus: profile signals <-> entry tags.
  signals        text[] not null default '{}',
  city_supported boolean not null default false,

  created_at     timestamptz not null default now()
);

create index founder_profiles_signals_idx on founder_profiles using gin (signals);

-- One row per generation. Lets us re-show a plan without re-paying for it,
-- and is the foundation for MVP+ (don't repeat what you already did).
create table generated_plans (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references founder_profiles(id) on delete cascade,
  plan        jsonb not null,            -- Person B's validated output blob
  item_ids    text[] not null default '{}', -- corpus ids used, for de-duping next week
  model       text,
  created_at  timestamptz not null default now()
);

create index generated_plans_profile_idx on generated_plans (profile_id, created_at desc);

alter table founder_profiles enable row level security;
alter table generated_plans  enable row level security;

-- No accounts in the MVP, so the anon key needs to insert its own profile and
-- read it back. It must NOT be able to read everyone else's.
drop policy if exists "profiles anon insert" on founder_profiles;
create policy "profiles anon insert"
  on founder_profiles for insert to anon, authenticated with check (true);

drop policy if exists "plans anon insert" on generated_plans;
create policy "plans anon insert"
  on generated_plans for insert to anon, authenticated with check (true);

-- Reads are deliberately service_role-only. The frontend already holds the row
-- it just inserted (insert ... returning), so it never needs to query back.
-- This keeps one founder's intake from being readable by the next visitor.
