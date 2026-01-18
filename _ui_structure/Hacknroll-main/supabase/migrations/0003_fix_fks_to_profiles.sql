-- Fix foreign keys to point at public.profiles (Supabase Auth-backed users)
-- Needed when 0001_init.sql created FKs referencing public.users, but 0002 moved to auth.users + profiles.

begin;

-- groups.owner_id -> profiles.id
alter table public.groups
  drop constraint if exists groups_owner_id_fkey;
alter table public.groups
  add constraint groups_owner_id_fkey
  foreign key (owner_id) references public.profiles(id) on delete restrict;

-- group_members.user_id -> profiles.id
alter table public.group_members
  drop constraint if exists group_members_user_id_fkey;
alter table public.group_members
  add constraint group_members_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- seasons.created_by -> profiles.id
alter table public.seasons
  drop constraint if exists seasons_created_by_fkey;
alter table public.seasons
  add constraint seasons_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete restrict;

-- balances.user_id -> profiles.id
alter table public.balances
  drop constraint if exists balances_user_id_fkey;
alter table public.balances
  add constraint balances_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- transactions.user_id -> profiles.id
alter table public.transactions
  drop constraint if exists transactions_user_id_fkey;
alter table public.transactions
  add constraint transactions_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- season_dares.user_id -> profiles.id
alter table public.season_dares
  drop constraint if exists season_dares_user_id_fkey;
alter table public.season_dares
  add constraint season_dares_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- season_outcomes.loser_user_id -> profiles.id
alter table public.season_outcomes
  drop constraint if exists season_outcomes_loser_user_id_fkey;
alter table public.season_outcomes
  add constraint season_outcomes_loser_user_id_fkey
  foreign key (loser_user_id) references public.profiles(id) on delete restrict;

-- poker tables (users) -> profiles.id
alter table public.poker_players
  drop constraint if exists poker_players_user_id_fkey;
alter table public.poker_players
  add constraint poker_players_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.poker_actions
  drop constraint if exists poker_actions_user_id_fkey;
alter table public.poker_actions
  add constraint poker_actions_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

commit;


