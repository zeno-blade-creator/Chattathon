-- Migration 002 — Person B (generation layer).
-- ADDITIVE ONLY. Run AFTER supabase/schema.sql. Nothing here drops or renames
-- anything Person A built; it closes three gaps found when the corpus schema,
-- the intake screen and the generation contract were compared side by side.

-- ---------------------------------------------------------------------------
-- 1. The intake screen offers goals the CHECK constraint rejects, and the
--    product now covers every startup stage — including looking for a
--    cofounder or a mentor, which was never in the original four.
-- ---------------------------------------------------------------------------
alter table founder_profiles drop constraint if exists founder_profiles_goal_check;
alter table founder_profiles add  constraint founder_profiles_goal_check
  check (goal in ('users','pilot-customers','funding','press',
                  'cofounders','mentors','advisors','hiring'));

-- ---------------------------------------------------------------------------
-- 2. Checklist state. F4's week-one plan is meant to be tickable, and MVP+
--    ("a second generation avoids repeats") needs somewhere to record it.
--    generated_plans.item_ids records what we SHOWED; this records what the
--    founder actually DID, which is a different question.
-- ---------------------------------------------------------------------------
create table if not exists item_status (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references founder_profiles(id) on delete cascade,
  item_id    text not null,          -- corpus_entries.id, e.g. 'evt-venture-cafe-thursday'
  state      text not null default 'todo' check (state in ('todo','done','skipped')),
  updated_at timestamptz not null default now(),
  unique (profile_id, item_id)
);

create index if not exists item_status_profile_idx on item_status (profile_id);

alter table item_status enable row level security;

drop policy if exists "item status anon write" on item_status;
create policy "item status anon write"
  on item_status for insert to anon, authenticated with check (true);

drop policy if exists "item status anon update" on item_status;
create policy "item status anon update"
  on item_status for update to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 3. Generation status. generated_plans has no way to express "still running"
--    or "the model returned malformed JSON and we served the cached plan".
--    The interface renders three states and has no column to read them from.
-- ---------------------------------------------------------------------------
alter table generated_plans add column if not exists status text not null default 'ready'
  check (status in ('pending','ready','failed'));
alter table generated_plans add column if not exists fallback_used boolean not null default false;
