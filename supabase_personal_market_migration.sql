-- Kingdoom - Personal Market Migration
-- Ejecutar en Supabase SQL Editor.

-- 1. Agregar columnas a market_items
alter table public.market_items
add column if not exists seller_id uuid references public.players(id) on delete set null,
add column if not exists seller_cut_percentage integer check (seller_cut_percentage >= 0 and seller_cut_percentage <= 100),
add column if not exists spawn_chance numeric check (spawn_chance >= 0 and spawn_chance <= 1);
