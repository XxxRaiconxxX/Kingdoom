create table if not exists public.bot_treasure_events (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null,
  message_id text not null unique,
  status text not null default 'open' check (status in ('open', 'claimed', 'expired')),
  max_winners integer not null check (max_winners between 1 and 3),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  closed_at timestamptz
);

create table if not exists public.bot_treasure_claims (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bot_treasure_events(id) on delete cascade,
  event_message_id text not null,
  player_id uuid not null references public.players(id) on delete cascade,
  reward_gold integer not null check (reward_gold between 10000 and 20000),
  claimed_at timestamptz not null default timezone('utc', now()),
  constraint bot_treasure_claims_event_player_unique unique (event_id, player_id)
);

create index if not exists bot_treasure_events_status_expires_idx
  on public.bot_treasure_events (status, expires_at);

create index if not exists bot_treasure_claims_event_id_idx
  on public.bot_treasure_claims (event_id, claimed_at);

create or replace function public.claim_bot_treasure_reward(
  p_message_id text,
  p_player_id uuid,
  p_chat_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $treasure$
declare
  v_event public.bot_treasure_events%rowtype;
  v_claim_count integer;
  v_reward integer;
begin
  select *
  into v_event
  from public.bot_treasure_events
  where message_id = p_message_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_event.chat_id <> p_chat_id then
    return jsonb_build_object('status', 'invalid_chat');
  end if;

  if v_event.status <> 'open' then
    return jsonb_build_object('status', v_event.status);
  end if;

  if v_event.expires_at <= timezone('utc', now()) then
    update public.bot_treasure_events
    set status = 'expired',
        closed_at = coalesce(closed_at, timezone('utc', now()))
    where id = v_event.id
      and status = 'open';

    return jsonb_build_object('status', 'expired');
  end if;

  if exists (
    select 1
    from public.bot_treasure_claims
    where event_id = v_event.id
      and player_id = p_player_id
  ) then
    return jsonb_build_object('status', 'duplicate');
  end if;

  select count(*)
  into v_claim_count
  from public.bot_treasure_claims
  where event_id = v_event.id;

  if v_claim_count >= v_event.max_winners then
    update public.bot_treasure_events
    set status = 'claimed',
        closed_at = coalesce(closed_at, timezone('utc', now()))
    where id = v_event.id
      and status = 'open';

    return jsonb_build_object(
      'status', 'full',
      'event_status', 'claimed',
      'winners_count', v_claim_count,
      'max_winners', v_event.max_winners
    );
  end if;

  v_reward := floor(random() * 10001 + 10000)::integer;

  perform public.increment_gold(p_player_id, v_reward);

  insert into public.bot_treasure_claims (
    event_id,
    event_message_id,
    player_id,
    reward_gold
  ) values (
    v_event.id,
    v_event.message_id,
    p_player_id,
    v_reward
  );

  v_claim_count := v_claim_count + 1;

  if v_claim_count >= v_event.max_winners then
    update public.bot_treasure_events
    set status = 'claimed',
        closed_at = timezone('utc', now())
    where id = v_event.id
      and status = 'open';

    return jsonb_build_object(
      'status', 'ok',
      'event_status', 'claimed',
      'reward_gold', v_reward,
      'winners_count', v_claim_count,
      'max_winners', v_event.max_winners
    );
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'event_status', 'open',
    'reward_gold', v_reward,
    'winners_count', v_claim_count,
    'max_winners', v_event.max_winners
  );
exception
  when unique_violation then
    return jsonb_build_object('status', 'duplicate');
end;
$treasure$;

grant execute on function public.claim_bot_treasure_reward(text, uuid, text)
  to service_role;

notify pgrst, 'reload schema';
