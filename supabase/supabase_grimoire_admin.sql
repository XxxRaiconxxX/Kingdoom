create table if not exists public.grimoire_magic_styles (
  id text primary key,
  category_id text not null default 'general',
  category_title text not null default 'General',
  title text not null,
  description text not null default '',
  levels jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grimoire_bestiary_entries (
  id text primary key,
  name text not null,
  category text not null default '',
  type text not null default '',
  general_data text not null default '',
  threat_level text not null default '',
  domestication text not null default '',
  usage text not null default '',
  origin_place text not null default '',
  found_at text not null default '',
  description text not null default '',
  ability text not null default '',
  rarity text not null default 'common'
    check (rarity in ('common', 'uncommon', 'rare', 'legendary', 'calamity')),
  image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.grimoire_bestiary_entries
  add column if not exists category text not null default '',
  add column if not exists type text not null default '',
  add column if not exists general_data text not null default '',
  add column if not exists threat_level text not null default '',
  add column if not exists domestication text not null default '',
  add column if not exists usage text not null default '';

alter table public.grimoire_magic_styles enable row level security;
alter table public.grimoire_bestiary_entries enable row level security;

drop policy if exists "Grimoire magic styles are readable by everyone" on public.grimoire_magic_styles;
create policy "Grimoire magic styles are readable by everyone"
on public.grimoire_magic_styles
for select
to public
using (true);

drop policy if exists "Grimoire bestiary is readable by everyone" on public.grimoire_bestiary_entries;
create policy "Grimoire bestiary is readable by everyone"
on public.grimoire_bestiary_entries
for select
to public
using (true);

drop policy if exists "Admins can manage grimoire magic styles" on public.grimoire_magic_styles;
create policy "Admins can manage grimoire magic styles"
on public.grimoire_magic_styles
for all
to public
using (true)
with check (true);

drop policy if exists "Admins can manage grimoire bestiary" on public.grimoire_bestiary_entries;
create policy "Admins can manage grimoire bestiary"
on public.grimoire_bestiary_entries
for all
to public
using (true)
with check (true);
