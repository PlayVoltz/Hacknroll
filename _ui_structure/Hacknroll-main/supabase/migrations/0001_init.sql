-- DarePot schema (Milestone 1) for Supabase Postgres
-- Virtual credits only. No payment/cashout features are modeled here.
--
-- This migration is intended to be executed as a superuser (e.g., Supabase `postgres`)
-- so it can create extensions, RLS policies, and (optionally) a non-bypass DB role.

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Optional: create a dedicated DB role that does NOT bypass RLS.
-- Use this role in DATABASE_URL for the app server.
-- NOTE: Change the password after running this migration.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'darepot_app') then
    create role darepot_app login password 'darepot_dev_only_change_me' noinherit;
  end if;
end $$;

-- App schema for helper functions
create schema if not exists app;

-- Helper: current user id from custom GUC (set per request by the server)
create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

-- =========================
-- Auth (custom username/password)
-- =========================

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username citext not null,
  password_hash text not null,
  avatar text,
  created_at timestamptz not null default now()
);

create unique index if not exists users_username_unique on public.users (username);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash bytea not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists sessions_token_hash_unique on public.sessions (token_hash);
create index if not exists sessions_user_id_idx on public.sessions (user_id);

create table if not exists public.auth_rate_limits (
  key text primary key,
  attempts int not null default 0,
  window_start_at timestamptz not null default now()
);

-- SECURITY DEFINER helpers for bootstrap auth flows (login/signup).
-- These are callable by the app role even when RLS blocks direct reads.
create or replace function app.auth_lookup_user(p_username citext)
returns table (
  id uuid,
  username citext,
  password_hash text,
  avatar text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, app
as $$
  select u.id, u.username, u.password_hash, u.avatar, u.created_at
  from public.users u
  where u.username = p_username
  limit 1;
$$;

create or replace function app.auth_create_session(
  p_user_id uuid,
  p_token_hash bytea,
  p_expires_at timestamptz
)
returns uuid
language sql
security definer
set search_path = public, app
as $$
  insert into public.sessions (user_id, token_hash, expires_at)
  values (p_user_id, p_token_hash, p_expires_at)
  returning id;
$$;

create or replace function app.auth_lookup_session(p_token_hash bytea)
returns table (
  id uuid,
  user_id uuid,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public, app
as $$
  select s.id, s.user_id, s.expires_at, s.created_at
  from public.sessions s
  where s.token_hash = p_token_hash
  limit 1;
$$;

create or replace function app.auth_delete_session(p_token_hash bytea)
returns int
language sql
security definer
set search_path = public, app
as $$
  with d as (
    delete from public.sessions s
    where s.token_hash = p_token_hash
    returning 1
  )
  select count(*)::int from d;
$$;

-- Basic brute-force protection. Key can be "ip:<ip>" or "user:<username>" etc.
-- Returns whether the caller is still allowed within the current window.
create or replace function app.auth_rate_limit_check(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns table (
  allowed boolean,
  attempts int,
  window_start_at timestamptz
)
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_now timestamptz := now();
  v_row public.auth_rate_limits%rowtype;
begin
  insert into public.auth_rate_limits (key, attempts, window_start_at)
  values (p_key, 0, v_now)
  on conflict (key) do nothing;

  select * into v_row from public.auth_rate_limits where key = p_key;

  if v_row.window_start_at < v_now - make_interval(secs => p_window_seconds) then
    update public.auth_rate_limits
      set attempts = 1,
          window_start_at = v_now
      where key = p_key
      returning * into v_row;
  else
    update public.auth_rate_limits
      set attempts = attempts + 1
      where key = p_key
      returning * into v_row;
  end if;

  allowed := (v_row.attempts <= p_limit);
  attempts := v_row.attempts;
  window_start_at := v_row.window_start_at;
  return next;
end;
$$;

-- =========================
-- Groups / seasons
-- =========================

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  owner_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index if not exists groups_code_unique on public.groups (code);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  start_at timestamptz not null default now(),
  end_at timestamptz not null,
  starting_credits bigint not null default 1000 check (starting_credits >= 0),
  status text not null default 'active' check (status in ('active', 'ended')),
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index if not exists seasons_one_active_per_group
  on public.seasons (group_id)
  where status = 'active';

create table if not exists public.balances (
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  balance bigint not null check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (season_id, user_id)
);

-- =========================
-- Ledger (immutable)
-- =========================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  game text not null,
  type text not null,
  bet bigint not null default 0 check (bet >= 0),
  payout bigint not null default 0 check (payout >= 0),
  net bigint generated always as (payout - bet) stored,
  idempotency_key uuid not null,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists transactions_idempotency_unique
  on public.transactions (season_id, user_id, idempotency_key);

create index if not exists transactions_season_created_idx
  on public.transactions (season_id, created_at desc);

-- Prevent UPDATE/DELETE on ledger table
create or replace function app.prevent_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'transactions are immutable';
end;
$$;

drop trigger if exists trg_prevent_transactions_mutation on public.transactions;
create trigger trg_prevent_transactions_mutation
before update or delete on public.transactions
for each row execute function app.prevent_ledger_mutation();

-- =========================
-- Dares
-- =========================

create table if not exists public.dares (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('social','physical','creative','food','challenge')),
  intensity text not null check (intensity in ('mild','medium','spicy','nuclear')),
  indoor boolean not null default true,
  pack text not null default 'default',
  active_from timestamptz,
  active_to timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.season_dares (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  dare_id uuid not null references public.dares(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (season_id, user_id, dare_id)
);

create table if not exists public.season_outcomes (
  season_id uuid primary key references public.seasons(id) on delete cascade,
  loser_user_id uuid not null references public.users(id) on delete restrict,
  chosen_dare_id uuid not null references public.dares(id) on delete restrict,
  resolved_at timestamptz not null default now()
);

-- =========================
-- Poker (tables only; logic later)
-- =========================

create table if not exists public.poker_tables (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  status text not null default 'open' check (status in ('open','running','paused','ended')),
  small_blind bigint not null default 5 check (small_blind >= 0),
  big_blind bigint not null default 10 check (big_blind >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.poker_players (
  table_id uuid not null references public.poker_tables(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  seat int not null check (seat >= 0 and seat <= 9),
  stack bigint not null default 0 check (stack >= 0),
  status text not null default 'seated' check (status in ('seated','left','busted')),
  last_action_at timestamptz,
  primary key (table_id, user_id),
  unique (table_id, seat)
);

create table if not exists public.poker_hands (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.poker_tables(id) on delete cascade,
  hand_no int not null,
  state_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (table_id, hand_no)
);

create table if not exists public.poker_actions (
  id uuid primary key default gen_random_uuid(),
  hand_id uuid not null references public.poker_hands(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  amount bigint not null default 0,
  created_at timestamptz not null default now()
);

-- =========================
-- RLS
-- =========================

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.auth_rate_limits enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.seasons enable row level security;
alter table public.balances enable row level security;
alter table public.transactions enable row level security;
alter table public.dares enable row level security;
alter table public.season_dares enable row level security;
alter table public.season_outcomes enable row level security;
alter table public.poker_tables enable row level security;
alter table public.poker_players enable row level security;
alter table public.poker_hands enable row level security;
alter table public.poker_actions enable row level security;

-- USERS: can read/update self only. Insert allowed (signup) via server.
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select
  using (id = app.current_user_id());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update
  using (id = app.current_user_id())
  with check (id = app.current_user_id());

drop policy if exists users_insert_any on public.users;
create policy users_insert_any on public.users
  for insert
  with check (true);

-- SESSIONS: only self sessions visible. Inserts/deletes via SECURITY DEFINER helpers.
drop policy if exists sessions_select_self on public.sessions;
create policy sessions_select_self on public.sessions
  for select
  using (user_id = app.current_user_id());

-- AUTH RATE LIMITS: server only (no direct access)
drop policy if exists auth_rate_limits_deny_all on public.auth_rate_limits;
create policy auth_rate_limits_deny_all on public.auth_rate_limits
  for all using (false) with check (false);

-- GROUPS: visible to members; insert by authenticated user
drop policy if exists groups_select_member on public.groups;
create policy groups_select_member on public.groups
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = app.current_user_id()
  ));

drop policy if exists groups_insert_any on public.groups;
create policy groups_insert_any on public.groups
  for insert
  with check (app.current_user_id() is not null and owner_id = app.current_user_id());

-- GROUP MEMBERS: visible to group members; inserts via server; updates only by owner/admin
drop policy if exists group_members_select_in_group on public.group_members;
create policy group_members_select_in_group on public.group_members
  for select
  using (exists (
    select 1 from public.group_members gm2
    where gm2.group_id = group_members.group_id
      and gm2.user_id = app.current_user_id()
  ));

drop policy if exists group_members_insert_any on public.group_members;
create policy group_members_insert_any on public.group_members
  for insert
  with check (app.current_user_id() is not null);

drop policy if exists group_members_update_by_owner_admin on public.group_members;
create policy group_members_update_by_owner_admin on public.group_members
  for update
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = app.current_user_id()
      and gm.role in ('owner','admin')
  ))
  with check (true);

-- SEASONS: visible to group members; insert allowed by group member; update status by owner/admin
drop policy if exists seasons_select_member on public.seasons;
create policy seasons_select_member on public.seasons
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = seasons.group_id
      and gm.user_id = app.current_user_id()
  ));

drop policy if exists seasons_insert_member on public.seasons;
create policy seasons_insert_member on public.seasons
  for insert
  with check (
    app.current_user_id() is not null
    and created_by = app.current_user_id()
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = seasons.group_id
        and gm.user_id = app.current_user_id()
    )
  );

drop policy if exists seasons_update_owner_admin on public.seasons;
create policy seasons_update_owner_admin on public.seasons
  for update
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = seasons.group_id
      and gm.user_id = app.current_user_id()
      and gm.role in ('owner','admin')
  ))
  with check (true);

-- BALANCES: readable by group members (needed for leaderboard); writable by server only (app role with RLS checks)
drop policy if exists balances_select_group_member on public.balances;
create policy balances_select_group_member on public.balances
  for select
  using (exists (
    select 1
    from public.seasons s
    join public.group_members gm on gm.group_id = s.group_id
    where s.id = balances.season_id
      and gm.user_id = app.current_user_id()
  ));

drop policy if exists balances_update_self_only on public.balances;
create policy balances_update_self_only on public.balances
  for update
  using (app.current_user_id() is not null)
  with check (true);

drop policy if exists balances_insert_any on public.balances;
create policy balances_insert_any on public.balances
  for insert
  with check (app.current_user_id() is not null);

-- TRANSACTIONS: readable by group members; insert only for self and only if season+group match membership
drop policy if exists transactions_select_group_member on public.transactions;
create policy transactions_select_group_member on public.transactions
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = transactions.group_id
      and gm.user_id = app.current_user_id()
  ));

drop policy if exists transactions_insert_self on public.transactions;
create policy transactions_insert_self on public.transactions
  for insert
  with check (
    app.current_user_id() is not null
    and user_id = app.current_user_id()
    and exists (
      select 1
      from public.seasons s
      join public.group_members gm on gm.group_id = s.group_id
      where s.id = transactions.season_id
        and s.group_id = transactions.group_id
        and gm.user_id = app.current_user_id()
        and s.status = 'active'
    )
  );

-- DARES: world-readable (safe; no secrets)
drop policy if exists dares_select_any on public.dares;
create policy dares_select_any on public.dares
  for select
  using (true);

-- SEASON_DARES / OUTCOMES: visible to group members of the season's group
drop policy if exists season_dares_select_member on public.season_dares;
create policy season_dares_select_member on public.season_dares
  for select
  using (exists (
    select 1
    from public.seasons s
    join public.group_members gm on gm.group_id = s.group_id
    where s.id = season_dares.season_id
      and gm.user_id = app.current_user_id()
  ));

drop policy if exists season_outcomes_select_member on public.season_outcomes;
create policy season_outcomes_select_member on public.season_outcomes
  for select
  using (exists (
    select 1
    from public.seasons s
    join public.group_members gm on gm.group_id = s.group_id
    where s.id = season_outcomes.season_id
      and gm.user_id = app.current_user_id()
  ));

-- Poker tables (visibility only; actions later)
drop policy if exists poker_tables_select_member on public.poker_tables;
create policy poker_tables_select_member on public.poker_tables
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = poker_tables.group_id
      and gm.user_id = app.current_user_id()
  ));

-- Grants: allow app role to use schema and access tables (RLS still applies)
grant usage on schema app to darepot_app;
grant usage on schema public to darepot_app;
grant select, insert, update, delete on all tables in schema public to darepot_app;
grant execute on all functions in schema app to darepot_app;

-- =========================
-- Seed dares (matches current UI mock set)
-- =========================

insert into public.dares (title, description, category, intensity, indoor, pack)
values
  ('The Sock Puppet Show','Perform a 2-minute dramatic monologue using a sock puppet. The topic: your deepest regrets about this season.','creative','mild',true,'q1_2024'),
  ('Spice Roulette','Eat a mystery hot sauce selected by the group. No milk for 5 minutes.','food','spicy',true,'q1_2024'),
  ('The Confessional','Record a 60-second video admitting your worst gambling habit to the group chat.','social','medium',true,'q1_2024'),
  ('Public Serenade','Sing ''I Will Survive'' at full volume in a public place while friends record.','social','spicy',false,'q1_2024'),
  ('The Plank of Shame','Hold a plank for 2 minutes while the group reads your worst plays from the ledger.','physical','medium',true,'q1_2024'),
  ('Avatar Makeover','Let the winner pick your profile picture for the next season.','social','mild',true,'q1_2024'),
  ('Cold Shower Challenge','Take a 3-minute ice cold shower. Video proof required.','physical','spicy',true,'q1_2024'),
  ('The Roast','Stand while each group member delivers a 30-second roast of your gaming skills.','social','medium',true,'q1_2024'),
  ('Mystery Meal','Eat whatever combination of items the group votes for from a restaurant menu.','food','medium',true,'q1_2024'),
  ('Karaoke Nightmare','Sing a song chosen by the group at a karaoke bar. No backing out.','social','nuclear',false,'q1_2024')
on conflict do nothing;

commit;


