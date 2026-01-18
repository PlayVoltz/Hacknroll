-- DarePot: migrate to Supabase Auth (auth.users) + public.profiles
-- - Keeps UI username+password by mapping username -> synthetic email in the app.
-- - Rewrites RLS policies to use auth.uid()
-- - Deprecates custom-auth tables/functions from 0001 (kept unless dropped below)

begin;

create extension if not exists citext;

-- Rename custom users table -> profiles (safe when no production data yet)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'users'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    alter table public.users rename to profiles;
  end if;
end $$;

-- Ensure profiles table exists (fresh installs where 0001 wasn't run fully)
create table if not exists public.profiles (
  id uuid primary key,
  username citext not null,
  avatar text,
  created_at timestamptz not null default now()
);

-- profiles: align columns (drop password_hash if present)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='password_hash'
  ) then
    alter table public.profiles drop column password_hash;
  end if;
end $$;

-- profiles.id must match auth.users.id
do $$
begin
  -- drop default (if previously gen_random_uuid())
  begin
    alter table public.profiles alter column id drop default;
  exception when others then
    null;
  end;
end $$;

-- Add FK to auth.users if not already present
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

create unique index if not exists profiles_username_unique on public.profiles (username);

-- Create profile on new auth user
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_avatar text;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_avatar := coalesce(new.raw_user_meta_data->>'avatar', null);

  insert into public.profiles (id, username, avatar)
  values (new.id, v_username, v_avatar)
  on conflict (id) do update set
    username = excluded.username,
    avatar = coalesce(excluded.avatar, public.profiles.avatar);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- =========================
-- RLS rewrites (auth.uid())
-- =========================

alter table public.profiles enable row level security;

-- Drop old policies that referenced app.current_user_id()
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and policyname in (
        'users_select_self','users_update_self','users_insert_any',
        'sessions_select_self','auth_rate_limits_deny_all',
        'groups_select_member','groups_insert_any',
        'group_members_select_in_group','group_members_insert_any','group_members_update_by_owner_admin',
        'seasons_select_member','seasons_insert_member','seasons_update_owner_admin',
        'balances_select_group_member','balances_update_self_only','balances_insert_any',
        'transactions_select_group_member','transactions_insert_self',
        'season_dares_select_member','season_outcomes_select_member',
        'poker_tables_select_member'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- PROFILES: self read/update
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- GROUPS: visible to members; insert by authenticated user
drop policy if exists groups_select_member on public.groups;
create policy groups_select_member on public.groups
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
  ));

drop policy if exists groups_insert_any on public.groups;
create policy groups_insert_any on public.groups
  for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

-- GROUP MEMBERS
drop policy if exists group_members_select_in_group on public.group_members;
create policy group_members_select_in_group on public.group_members
  for select
  using (exists (
    select 1 from public.group_members gm2
    where gm2.group_id = group_members.group_id
      and gm2.user_id = auth.uid()
  ));

drop policy if exists group_members_insert_any on public.group_members;
create policy group_members_insert_any on public.group_members
  for insert
  with check (auth.uid() is not null);

drop policy if exists group_members_update_by_owner_admin on public.group_members;
create policy group_members_update_by_owner_admin on public.group_members
  for update
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner','admin')
  ))
  with check (true);

-- SEASONS
drop policy if exists seasons_select_member on public.seasons;
create policy seasons_select_member on public.seasons
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = seasons.group_id
      and gm.user_id = auth.uid()
  ));

drop policy if exists seasons_insert_member on public.seasons;
create policy seasons_insert_member on public.seasons
  for insert
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = seasons.group_id
        and gm.user_id = auth.uid()
    )
  );

drop policy if exists seasons_update_owner_admin on public.seasons;
create policy seasons_update_owner_admin on public.seasons
  for update
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = seasons.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner','admin')
  ))
  with check (true);

-- BALANCES: readable by group members for leaderboards
drop policy if exists balances_select_group_member on public.balances;
create policy balances_select_group_member on public.balances
  for select
  using (exists (
    select 1
    from public.seasons s
    join public.group_members gm on gm.group_id = s.group_id
    where s.id = balances.season_id
      and gm.user_id = auth.uid()
  ));

drop policy if exists balances_insert_any on public.balances;
create policy balances_insert_any on public.balances
  for insert
  with check (auth.uid() is not null);

drop policy if exists balances_update_self_only on public.balances;
create policy balances_update_self_only on public.balances
  for update
  using (auth.uid() is not null)
  with check (true);

-- TRANSACTIONS: readable by group members; insert self only (season active)
drop policy if exists transactions_select_group_member on public.transactions;
create policy transactions_select_group_member on public.transactions
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = transactions.group_id
      and gm.user_id = auth.uid()
  ));

drop policy if exists transactions_insert_self on public.transactions;
create policy transactions_insert_self on public.transactions
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1
      from public.seasons s
      join public.group_members gm on gm.group_id = s.group_id
      where s.id = transactions.season_id
        and s.group_id = transactions.group_id
        and gm.user_id = auth.uid()
        and s.status = 'active'
    )
  );

-- DARES world readable
drop policy if exists dares_select_any on public.dares;
create policy dares_select_any on public.dares
  for select using (true);

-- SEASON_DARES / OUTCOMES readable to group members
drop policy if exists season_dares_select_member on public.season_dares;
create policy season_dares_select_member on public.season_dares
  for select
  using (exists (
    select 1
    from public.seasons s
    join public.group_members gm on gm.group_id = s.group_id
    where s.id = season_dares.season_id
      and gm.user_id = auth.uid()
  ));

drop policy if exists season_outcomes_select_member on public.season_outcomes;
create policy season_outcomes_select_member on public.season_outcomes
  for select
  using (exists (
    select 1
    from public.seasons s
    join public.group_members gm on gm.group_id = s.group_id
    where s.id = season_outcomes.season_id
      and gm.user_id = auth.uid()
  ));

-- Poker table visibility
drop policy if exists poker_tables_select_member on public.poker_tables;
create policy poker_tables_select_member on public.poker_tables
  for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = poker_tables.group_id
      and gm.user_id = auth.uid()
  ));

commit;


