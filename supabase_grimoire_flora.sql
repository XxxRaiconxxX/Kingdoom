create table if not exists public.grimoire_flora_entries (
  id text primary key,
  name text not null,
  category text not null default '',
  type text not null default '',
  general_data text not null default '',
  properties text not null default '',
  usage text not null default '',
  origin_place text not null default '',
  found_at text not null default '',
  description text not null default '',
  rarity text not null default 'common' check (rarity in ('common', 'uncommon', 'rare', 'legendary', 'calamity')),
  image_url text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_grimoire_flora_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_grimoire_flora_updated_at on public.grimoire_flora_entries;

create trigger set_grimoire_flora_updated_at
before update on public.grimoire_flora_entries
for each row
execute function public.set_grimoire_flora_updated_at();

alter table public.grimoire_flora_entries enable row level security;

drop policy if exists "Grimoire flora is readable by everyone" on public.grimoire_flora_entries;
create policy "Grimoire flora is readable by everyone"
on public.grimoire_flora_entries
for select
to public
using (true);

drop policy if exists "Admins can manage grimoire flora" on public.grimoire_flora_entries;
create policy "Admins can manage grimoire flora"
on public.grimoire_flora_entries
for all
to public
using (true)
with check (true);
