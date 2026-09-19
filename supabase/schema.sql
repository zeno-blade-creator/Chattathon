-- Misneach shared schema. Person A owns this table; Person B (generation) reads
-- profiles and writes plans. Run in Supabase SQL editor as-is.

create extension if not exists "pgcrypto";

-- 1. The founder's intake profile. Person A's form writes this.
create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  founder_name  text,
  product       text not null,          -- what you're building
  city          text not null,          -- "Boston, MA"
  neighborhood  text,
  stage         text not null,          -- idea|building|launched|revenue|raising
  customer      text not null,          -- who your customer is
  goal          text not null,          -- cofounders|users|pilots|funding|press|mentors
  already_tried text,
  created_at    timestamptz default now()
);

-- 2. A generated plan. Person B writes this. Person C reads it.
create table if not exists plans (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles(id) on delete cascade,
  status       text not null default 'pending',  -- pending|ready|failed
  payload      jsonb,                            -- the full Plan JSON (see contracts/plan.schema.json)
  model        text,
  cost_cents   numeric,
  created_at   timestamptz default now()
);

-- 3. Checklist state, so a second generation avoids repeats.
create table if not exists item_status (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  item_id    text not null,            -- Plan.items[].id
  state      text not null,            -- todo|done|skipped
  updated_at timestamptz default now(),
  unique (profile_id, item_id)
);

alter table profiles    enable row level security;
alter table plans       enable row level security;
alter table item_status enable row level security;

create policy "own profiles"  on profiles    for all using (auth.uid() = user_id);
create policy "own plans"     on plans       for all using (
  profile_id in (select id from profiles where user_id = auth.uid()));
create policy "own statuses"  on item_status for all using (
  profile_id in (select id from profiles where user_id = auth.uid()));
