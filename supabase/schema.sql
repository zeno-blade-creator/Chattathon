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
