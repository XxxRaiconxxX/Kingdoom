create table if not exists public.business_proposals (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  proposed_by_id uuid references public.players(id) on delete set null,
  proposed_by_name text,
  name text not null,
  description text not null,
  business_type text not null,
  icon text not null default '🏪',
  production_label text not null default 'Produce oro pasivo',
  gold_per_hour integer not null check (gold_per_hour >= 0),
  max_storage integer not null check (max_storage >= 0),
  hourly_range_min integer not null default 0 check (hourly_range_min >= 0),
  hourly_range_max integer not null default 0 check (hourly_range_max >= 0),
  base_cost integer not null default 0 check (base_cost >= 0),
  staff_fee integer not null default 0 check (staff_fee >= 0),
  opening_cost integer not null check (opening_cost >= 0),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists idx_business_proposals_player_id
  on public.business_proposals(player_id);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  proposal_id uuid references public.business_proposals(id) on delete set null,
  name text not null,
  description text not null,
  business_type text not null,
  icon text not null default '🏪',
  production_label text not null default 'Produce oro pasivo',
  gold_per_hour integer not null check (gold_per_hour >= 0),
  max_storage integer not null check (max_storage >= 0),
  hourly_range_min integer not null default 0 check (hourly_range_min >= 0),
  hourly_range_max integer not null default 0 check (hourly_range_max >= 0),
  base_cost integer not null default 0 check (base_cost >= 0),
  staff_fee integer not null default 0 check (staff_fee >= 0),
  opening_cost integer not null check (opening_cost >= 0),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended')),
  opened_at timestamptz not null default now(),
  last_collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_businesses_player_id
  on public.businesses(player_id);

create table if not exists public.business_collection_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  collected_gold integer not null check (collected_gold >= 0),
  collected_at timestamptz not null default now()
);

create index if not exists idx_business_collection_log_player_id
  on public.business_collection_log(player_id, collected_at desc);

alter table public.business_proposals enable row level security;
alter table public.businesses enable row level security;
alter table public.business_collection_log enable row level security;

drop policy if exists "Public can read business proposals" on public.business_proposals;
create policy "Public can read business proposals"
on public.business_proposals
for select
to public
using (true);

drop policy if exists "Admins can write business proposals" on public.business_proposals;
create policy "Admins can write business proposals"
on public.business_proposals
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Public can read businesses" on public.businesses;
create policy "Public can read businesses"
on public.businesses
for select
to public
using (true);

drop policy if exists "Admins can write businesses" on public.businesses;
create policy "Admins can write businesses"
on public.businesses
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Public can read business logs" on public.business_collection_log;
create policy "Public can read business logs"
on public.business_collection_log
for select
to public
using (true);

drop policy if exists "Admins can read business logs" on public.business_collection_log;
create policy "Admins can read business logs"
on public.business_collection_log
for select
to authenticated
using ((select public.is_current_user_admin()));

create or replace function public.respond_business_proposal(
  p_proposal_id uuid,
  p_player_id uuid,
  p_action text
)
returns table (
  success boolean,
  message text,
  remaining_gold integer,
  proposal_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.business_proposals%rowtype;
  v_player public.players%rowtype;
begin
  if p_action not in ('accept', 'reject') then
    raise exception 'Accion invalida.' using errcode = '22023';
  end if;

  select *
  into v_proposal
  from public.business_proposals
  where id = p_proposal_id
    and player_id = p_player_id
  limit 1;

  if v_proposal.id is null then
    return query select false, 'La propuesta no existe o no pertenece a este jugador.', null::integer, null::text;
    return;
  end if;

  if v_proposal.status <> 'pending' then
    return query select false, 'La propuesta ya fue respondida.', null::integer, v_proposal.status;
    return;
  end if;

  if p_action = 'reject' then
    update public.business_proposals
    set status = 'rejected',
        responded_at = now()
    where id = v_proposal.id;

    return query select true, 'Propuesta rechazada.', null::integer, 'rejected'::text;
    return;
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  limit 1;

  if v_player.id is null then
    return query select false, 'Jugador no encontrado.', null::integer, null::text;
    return;
  end if;

  if coalesce(v_player.gold, 0) < v_proposal.opening_cost then
    return query select false, 'No tienes oro suficiente para abrir este negocio.', coalesce(v_player.gold, 0), 'pending'::text;
    return;
  end if;

  update public.players
  set gold = greatest(coalesce(v_player.gold, 0) - v_proposal.opening_cost, 0)
  where id = v_player.id;

  insert into public.businesses (
    player_id,
    proposal_id,
    name,
    description,
    business_type,
    icon,
    production_label,
    gold_per_hour,
    max_storage,
    hourly_range_min,
    hourly_range_max,
    base_cost,
    staff_fee,
    opening_cost,
    status,
    opened_at,
    last_collected_at,
    created_at,
    updated_at
  ) values (
    v_player.id,
    v_proposal.id,
    v_proposal.name,
    v_proposal.description,
    v_proposal.business_type,
    v_proposal.icon,
    v_proposal.production_label,
    v_proposal.gold_per_hour,
    v_proposal.max_storage,
    v_proposal.hourly_range_min,
    v_proposal.hourly_range_max,
    v_proposal.base_cost,
    v_proposal.staff_fee,
    v_proposal.opening_cost,
    'active',
    now(),
    now(),
    now(),
    now()
  );

  update public.business_proposals
  set status = 'accepted',
      responded_at = now()
  where id = v_proposal.id;

  return query
  select
    true,
    'Negocio activado. El costo fue descontado correctamente.',
    greatest(coalesce(v_player.gold, 0) - v_proposal.opening_cost, 0),
    'accepted'::text;
end;
$$;

revoke all on function public.respond_business_proposal(uuid, uuid, text) from public;
grant execute on function public.respond_business_proposal(uuid, uuid, text) to anon, authenticated;

create or replace function public.collect_business_gold(
  p_business_id uuid,
  p_player_id uuid
)
returns table (
  success boolean,
  message text,
  collected_gold integer,
  remaining_gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_player public.players%rowtype;
  v_elapsed_seconds numeric;
  v_collectible integer;
  v_consumed_seconds integer;
  v_capped boolean;
  v_next_gold integer;
begin
  select *
  into v_business
  from public.businesses
  where id = p_business_id
    and player_id = p_player_id
  limit 1;

  if v_business.id is null then
    return query select false, 'El negocio no existe o no pertenece a este jugador.', 0, null::integer;
    return;
  end if;

  if v_business.status <> 'active' then
    return query select false, 'El negocio no esta activo ahora mismo.', 0, null::integer;
    return;
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  limit 1;

  if v_player.id is null then
    return query select false, 'Jugador no encontrado.', 0, null::integer;
    return;
  end if;

  v_elapsed_seconds := greatest(extract(epoch from (now() - v_business.last_collected_at)), 0);
  v_collectible := least(
    v_business.max_storage,
    floor((v_elapsed_seconds * v_business.gold_per_hour) / 3600.0)
  );

  if coalesce(v_collectible, 0) <= 0 then
    return query select false, 'Tu negocio aun no produjo oro suficiente para recolectar.', 0, coalesce(v_player.gold, 0);
    return;
  end if;

  v_capped := v_collectible >= v_business.max_storage;
  v_consumed_seconds := floor((v_collectible * 3600.0) / greatest(v_business.gold_per_hour, 1));
  v_next_gold := coalesce(v_player.gold, 0) + v_collectible;

  update public.players
  set gold = v_next_gold
  where id = v_player.id;

  update public.businesses
  set last_collected_at =
        case
          when v_capped then now()
          else v_business.last_collected_at + make_interval(secs => greatest(v_consumed_seconds, 0))
        end,
      updated_at = now()
  where id = v_business.id;

  insert into public.business_collection_log (
    business_id,
    player_id,
    collected_gold,
    collected_at
  ) values (
    v_business.id,
    v_player.id,
    v_collectible,
    now()
  );

  return query
  select
    true,
    'Recoleccion completada.',
    v_collectible,
    v_next_gold;
end;
$$;

revoke all on function public.collect_business_gold(uuid, uuid) from public;
grant execute on function public.collect_business_gold(uuid, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
