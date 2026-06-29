create table if not exists public.assistant_admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_phone text not null,
  actor_role text not null check (actor_role in ('admin', 'staff')),
  action_type text not null,
  status text not null default 'draft' check (
    status in ('draft', 'revised', 'confirmed', 'cancelled', 'failed')
  ),
  original_message text not null,
  proposed_payload jsonb not null default '{}'::jsonb,
  reference_payload jsonb not null default '{}'::jsonb,
  model_used text,
  result_message text,
  confirmation_message text,
  chat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists assistant_admin_actions_actor_status_idx
  on public.assistant_admin_actions (admin_phone, status, created_at desc);

create index if not exists assistant_admin_actions_action_type_idx
  on public.assistant_admin_actions (action_type, created_at desc);

alter table public.assistant_admin_actions enable row level security;

drop policy if exists "Admins can read assistant admin actions" on public.assistant_admin_actions;
create policy "Admins can read assistant admin actions"
on public.assistant_admin_actions
for select
to authenticated
using ((select public.is_current_user_admin()));

drop policy if exists "Admins can write assistant admin actions" on public.assistant_admin_actions;
create policy "Admins can write assistant admin actions"
on public.assistant_admin_actions
for all
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));
