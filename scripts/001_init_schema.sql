-- CIZRE PAINTBALL - Veritabanı şeması
-- Bu scripti Supabase SQL editöründe çalıştırın.

-- =========================================================
-- PROFILES
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  skin_url text,
  wins int not null default 0,
  losses int not null default 0,
  kills int not null default 0,
  deaths int not null default 0,
  matches_played int not null default 0,
  money int not null default 800,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- =========================================================
-- FRIENDS
-- status: pending | accepted
-- =========================================================
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);

alter table public.friends enable row level security;

drop policy if exists "friends_select_involved" on public.friends;
create policy "friends_select_involved" on public.friends
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "friends_insert_own" on public.friends;
create policy "friends_insert_own" on public.friends
  for insert with check (auth.uid() = user_id);

drop policy if exists "friends_update_involved" on public.friends;
create policy "friends_update_involved" on public.friends
  for update using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "friends_delete_involved" on public.friends;
create policy "friends_delete_involved" on public.friends
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- =========================================================
-- LOBBIES
-- status: waiting | in_game | finished
-- =========================================================
create table if not exists public.lobbies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  map text not null default 'neon_district',
  status text not null default 'waiting',
  max_players int not null default 10,
  created_at timestamptz not null default now()
);

alter table public.lobbies enable row level security;

drop policy if exists "lobbies_select_all" on public.lobbies;
create policy "lobbies_select_all" on public.lobbies for select using (true);

drop policy if exists "lobbies_insert_own" on public.lobbies;
create policy "lobbies_insert_own" on public.lobbies
  for insert with check (auth.uid() = host_id);

drop policy if exists "lobbies_update_host" on public.lobbies;
create policy "lobbies_update_host" on public.lobbies
  for update using (auth.uid() = host_id);

drop policy if exists "lobbies_delete_host" on public.lobbies;
create policy "lobbies_delete_host" on public.lobbies
  for delete using (auth.uid() = host_id);

-- =========================================================
-- LOBBY MEMBERS
-- team: A | B
-- =========================================================
create table if not exists public.lobby_members (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team text not null default 'A',
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (lobby_id, user_id)
);

alter table public.lobby_members enable row level security;

drop policy if exists "members_select_all" on public.lobby_members;
create policy "members_select_all" on public.lobby_members for select using (true);

drop policy if exists "members_insert_own" on public.lobby_members;
create policy "members_insert_own" on public.lobby_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "members_update_own" on public.lobby_members;
create policy "members_update_own" on public.lobby_members
  for update using (auth.uid() = user_id);

drop policy if exists "members_delete_own" on public.lobby_members;
create policy "members_delete_own" on public.lobby_members
  for delete using (auth.uid() = user_id);

-- =========================================================
-- LOBBY MESSAGES (chat)
-- =========================================================
create table if not exists public.lobby_messages (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.lobby_messages enable row level security;

drop policy if exists "messages_select_all" on public.lobby_messages;
create policy "messages_select_all" on public.lobby_messages for select using (true);

drop policy if exists "messages_insert_own" on public.lobby_messages;
create policy "messages_insert_own" on public.lobby_messages
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- GAME INVITES
-- status: pending | accepted | declined
-- =========================================================
create table if not exists public.game_invites (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.game_invites enable row level security;

drop policy if exists "invites_select_involved" on public.game_invites;
create policy "invites_select_involved" on public.game_invites
  for select using (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists "invites_insert_own" on public.game_invites;
create policy "invites_insert_own" on public.game_invites
  for insert with check (auth.uid() = from_user);

drop policy if exists "invites_update_involved" on public.game_invites;
create policy "invites_update_involved" on public.game_invites
  for update using (auth.uid() = from_user or auth.uid() = to_user);

-- =========================================================
-- REALTIME
-- =========================================================
alter publication supabase_realtime add table public.lobby_messages;
alter publication supabase_realtime add table public.lobby_members;
alter publication supabase_realtime add table public.lobbies;
alter publication supabase_realtime add table public.game_invites;
alter publication supabase_realtime add table public.friends;
