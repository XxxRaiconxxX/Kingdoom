-- Character sheet recycling lifecycle for WhatsApp exits.
-- Run this in Supabase SQL Editor before enabling the bot assignment commands.

alter table public.character_sheets
  add column if not exists "playerUsername" text null,
  add column if not exists "portraitUrl" text null,
  add column if not exists "recycleStatus" text not null default 'active'
    check ("recycleStatus" in ('active', 'available', 'assigned')),
  add column if not exists "originalPlayerId" uuid null references public.players(id) on delete set null,
  add column if not exists "originalPlayerUsername" text null,
  add column if not exists "recycledAt" timestamptz null,
  add column if not exists "assignedAt" timestamptz null,
  add column if not exists "assignedToPlayerId" uuid null references public.players(id) on delete set null;

create index if not exists idx_character_sheets_recycle_status
  on public.character_sheets ("recycleStatus", "recycledAt" desc);

create index if not exists idx_character_sheets_player_id_recycle_status
  on public.character_sheets ("playerId", "recycleStatus");

create table if not exists public.player_lifecycle_log (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  phone text null,
  group_jid text null,
  action text not null,
  from_status text null,
  to_status text null,
  sheet_id uuid null references public.character_sheets(id) on delete set null,
  performed_by text not null default 'system',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_player_lifecycle_log_player_created
  on public.player_lifecycle_log (player_id, created_at desc);

create index if not exists idx_player_lifecycle_log_action_created
  on public.player_lifecycle_log (action, created_at desc);

alter table public.character_sheets enable row level security;

drop policy if exists "Public can read character sheets" on public.character_sheets;
create policy "Public can read character sheets"
  on public.character_sheets
  for select
  using (true);

drop policy if exists "Public can insert character sheets" on public.character_sheets;
create policy "Public can insert character sheets"
  on public.character_sheets
  for insert
  with check (true);

drop policy if exists "Public can update character sheets" on public.character_sheets;
create policy "Public can update character sheets"
  on public.character_sheets
  for update
  using (true)
  with check (true);

drop policy if exists "Public can delete character sheets" on public.character_sheets;
create policy "Public can delete character sheets"
  on public.character_sheets
  for delete
  using (true);

create or replace function public.mark_player_sheets_recyclable(
  p_player_id uuid,
  p_actor text default 'bot'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_updated integer := 0;
begin
  select *
  into v_player
  from public.players
  where id = p_player_id;

  if not found then
    raise exception 'player_not_found';
  end if;

  update public.character_sheets
  set
    "recycleStatus" = 'available',
    "originalPlayerId" = coalesce("originalPlayerId", "playerId"),
    "originalPlayerUsername" = coalesce("originalPlayerUsername", v_player.username),
    "recycledAt" = coalesce("recycledAt", timezone('utc', now())),
    "assignedAt" = null,
    "assignedToPlayerId" = null
  where "playerId" = p_player_id
    and "recycleStatus" <> 'available';

  get diagnostics v_updated = row_count;

  insert into public.player_lifecycle_log (
    player_id,
    phone,
    action,
    from_status,
    to_status,
    performed_by,
    details
  )
  values (
    p_player_id,
    v_player.phone,
    'sheets_marked_recyclable',
    null,
    'available',
    p_actor,
    jsonb_build_object('updated_sheets', v_updated)
  )
  on conflict do nothing;

  return v_updated;
end;
$$;

create or replace function public.assign_recycled_character_sheet(
  p_sheet_id uuid,
  p_target_player_id uuid,
  p_actor text default 'bot'
)
returns public.character_sheets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_player public.players%rowtype;
  v_sheet public.character_sheets%rowtype;
begin
  select *
  into v_target_player
  from public.players
  where id = p_target_player_id;

  if not found then
    raise exception 'target_player_not_found';
  end if;

  select *
  into v_sheet
  from public.character_sheets
  where id = p_sheet_id
  for update;

  if not found then
    raise exception 'sheet_not_found';
  end if;

  if v_sheet."recycleStatus" <> 'available' then
    raise exception 'sheet_not_available_for_recycling';
  end if;

  update public.character_sheets
  set
    "playerId" = p_target_player_id,
    "playerUsername" = v_target_player.username,
    "recycleStatus" = 'assigned',
    "assignedAt" = timezone('utc', now()),
    "assignedToPlayerId" = p_target_player_id
  where id = p_sheet_id
  returning *
  into v_sheet;

  insert into public.player_lifecycle_log (
    player_id,
    phone,
    action,
    from_status,
    to_status,
    sheet_id,
    performed_by,
    details
  )
  values (
    p_target_player_id,
    v_target_player.phone,
    'recycled_sheet_assigned',
    'available',
    'assigned',
    p_sheet_id,
    p_actor,
    jsonb_build_object(
      'sheet_name', v_sheet.name,
      'original_player_id', v_sheet."originalPlayerId",
      'original_player_username', v_sheet."originalPlayerUsername"
    )
  )
  on conflict do nothing;

  return v_sheet;
end;
$$;
