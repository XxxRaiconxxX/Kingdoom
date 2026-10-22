-- Remove the legacy dual signature so every dual upgrade uses idempotency and audit.
drop function if exists public.upgrade_player_business_dual(uuid, uuid, integer, integer, integer);
notify pgrst, 'reload schema';
