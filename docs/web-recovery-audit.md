# Recuperación de Kingdoom — auditoría en curso

Fecha: 2026-09-12. Alcance: Kingdoom-sync en escritorio/móvil, navegación, compras, cuotas, economía, accesibilidad y seguridad.

## Correcciones locales

- Se reemplazó la escala móvil global por layout responsive; escritorio usa navegación superior y móvil navegación inferior.
- Se añadió enlace para saltar al contenido, etiquetas accesibles y perfil compacto fuera de Inicio.
- El oro del jugador solo cambia mediante RPC atómico; se eliminaron rescates absolutos tras errores y se validan enteros seguros y filas afectadas.
- El recibo de compras financiadas distingue el importe cobrado ahora del total con recargo; el cálculo usa aritmética entera.
- Tras pagar una cuota se refresca el perfil para mostrar el oro real inmediatamente.
- `purchase_market_item_v2` local rechaza cuotas nulas/no válidas y financiación de pociones, exige vinculación previa, evita auto-vincular cuentas y conserva recibos únicos sin doble cobro.
- Se añadió migración local `20260912112245_market_purchase_security_recovery.sql`: elimina escrituras directas de jugadores/inventario y creación directa de vínculos; mantiene solo lecturas necesarias.

## Riesgos pendientes

- La migración SQL aún no se aplicó al proyecto Supabase remoto; requiere un flujo administrativo separado para vincular identidades existentes.
- Subastas y premios de algunos juegos todavía necesitan revisión de idempotencia y resolución exclusivamente servidor.
- La auditoría remota detectó RLS permisivo en tablas de jugadores/inventario, una vista security-definer pública y funciones con search_path mutable; quedan para una tanda backend específica.

## Validación

- `npx vitest run scripts/player-gold.test.ts src/features/market/market.rotation.test.ts` → 2 archivos, 3 pruebas correctas.
- `node scripts/market-purchase.selfcheck.mjs` → guards de cuotas, propiedad, recibos únicos y bloqueo RLS correctos.
- `npx tsc --noEmit` → correcto.
- `npm run build` → correcto; 2251 módulos.
- `npm audit --audit-level=moderate` → 0 vulnerabilidades.
- `node scripts/check-web-layout.cjs` con Playwright → 20/20 combinaciones, 16 aperturas de formulario, cero excepciones JS.
- `git diff --check` → correcto.

Las capturas y resultados visuales están en `artifacts/`; el informe no representa una migración remota ni un despliegue.

Estado: en curso. No se hizo commit, push, despliegue ni cambio remoto de Supabase.
