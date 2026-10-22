from pathlib import Path

sql = Path(__file__).parents[1].joinpath('migrations', '20261022001204_business_weekly_growth_cap.sql').read_text(encoding='utf-8')
assert 'floor(v_policy.base_production * 0.50)' in sql
assert 'floor(v_policy.base_storage * 0.50)' in sql
assert 'v_policy.base_production + v_policy.base_production' in sql
assert 'v_policy.base_storage + v_policy.base_storage' in sql
assert 'Limite autonomo total alcanzado' in sql
assert 'Limite semanal alcanzado' in sql
assert 'interval \'7 days\'' in sql
assert 'grant execute on function public.upgrade_player_business_dual' in sql
assert 'grant execute on function public.upgrade_player_business(uuid,uuid,text,integer,integer)' in sql
print('BUSINESS_WEEKLY_CAP_CONTRACT_OK')
