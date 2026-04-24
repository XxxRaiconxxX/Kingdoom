create table if not exists public.knowledge_documents (
  id text primary key,
  title text not null,
  type text not null default 'lore'
    check (type in ('lore', 'rules', 'magic', 'bestiary', 'flora', 'event', 'mission', 'faction', 'other')),
  category text not null default '',
  tags text[] not null default '{}',
  source text not null default '',
  content text not null default '',
  summary text not null default '',
  visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists knowledge_documents_visible_idx
on public.knowledge_documents (visible);

create index if not exists knowledge_documents_type_idx
on public.knowledge_documents (type);

create index if not exists knowledge_documents_search_idx
on public.knowledge_documents
using gin (
  to_tsvector(
    'spanish',
    coalesce(title, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(source, '') || ' ' ||
    coalesce(summary, '') || ' ' ||
    coalesce(content, '')
  )
);

create or replace function public.set_knowledge_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_knowledge_documents_updated_at on public.knowledge_documents;

create trigger set_knowledge_documents_updated_at
before update on public.knowledge_documents
for each row
execute function public.set_knowledge_documents_updated_at();

alter table public.knowledge_documents enable row level security;

drop policy if exists "Knowledge documents are readable by everyone" on public.knowledge_documents;
create policy "Knowledge documents are readable by everyone"
on public.knowledge_documents
for select
to public
using (visible = true);

drop policy if exists "Admins can manage knowledge documents" on public.knowledge_documents;
create policy "Admins can manage knowledge documents"
on public.knowledge_documents
for all
to public
using (true)
with check (true);
