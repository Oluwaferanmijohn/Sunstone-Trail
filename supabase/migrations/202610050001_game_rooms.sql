create type public.game_room_status as enum ('lobby', 'active', 'finished');

create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  status public.game_room_status not null default 'lobby',
  game_state jsonb,
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  colour text not null check (colour in ('blue', 'coral', 'gold', 'green')),
  seat smallint not null check (seat between 0 and 3),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, colour),
  unique (room_id, seat)
);

create index game_room_players_user_id_idx on public.game_room_players (user_id);
create index game_room_players_room_id_idx on public.game_room_players (room_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger game_rooms_set_updated_at
before update on public.game_rooms
for each row execute function public.set_updated_at();

alter table public.game_rooms enable row level security;
alter table public.game_room_players enable row level security;

create policy "Players can read their rooms"
on public.game_rooms for select to authenticated
using (
  host_user_id = auth.uid()
  or exists (
    select 1 from public.game_room_players player
    where player.room_id = id and player.user_id = auth.uid()
  )
);

create policy "Players can read fellow players in their rooms"
on public.game_room_players for select to authenticated
using (
  exists (
    select 1 from public.game_room_players membership
    where membership.room_id = room_id and membership.user_id = auth.uid()
  )
);

-- All writes go through Nuxt server endpoints using the service-role key.
-- Browser clients receive no write policy and cannot forge dice or turns.

alter table public.game_rooms replica identity full;
alter publication supabase_realtime add table public.game_rooms;
