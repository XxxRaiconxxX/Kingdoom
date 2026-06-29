-- [Codex] Tanda de indices orientada a Query Performance (16/06/2026)
-- Ajustada al patron real de las consultas vistas en Supabase:
-- - market_auctions: ORDER BY created_at DESC
-- - realm_events: ORDER BY created_at DESC
-- - knowledge_documents: WHERE visible = true ORDER BY updated_at DESC
-- - player_inventory: WHERE player_id = ? ORDER BY created_at DESC
-- - season_rank_thresholds / season_rank_point_rules: WHERE is_active = true ORDER BY sort_order
-- - business_collection_log: ORDER BY collected_at DESC
--
-- Se omite season_rank_seasons(status) porque el repo ya tiene
-- idx_season_rank_seasons_status_dates (status, starts_at desc, ends_at desc),
-- que cubre mejor el acceso actual. Tambien se omite character_sheets porque
-- el reporte muestra muy pocas llamadas y no justifica agregar indice ahora.

create index if not exists idx_market_auctions_created_at_desc
  on public.market_auctions (created_at desc);

create index if not exists idx_realm_events_created_at_desc
  on public.realm_events (created_at desc);

create index if not exists idx_knowledge_documents_visible_updated_at_desc
  on public.knowledge_documents (visible, updated_at desc);

create index if not exists idx_knowledge_documents_updated_at_desc
  on public.knowledge_documents (updated_at desc);

create index if not exists idx_player_inventory_player_created_at_desc
  on public.player_inventory (player_id, created_at desc);

create index if not exists idx_season_rank_thresholds_active_sort_order
  on public.season_rank_thresholds (is_active, sort_order);

create index if not exists idx_season_rank_point_rules_active_sort_order
  on public.season_rank_point_rules (is_active, sort_order);

create index if not exists idx_business_collection_log_collected_at_desc
  on public.business_collection_log (collected_at desc);
