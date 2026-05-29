# Prompt Operativo - Antigravity 2

Trabaja solo en `C:\Users\e_grado\Documents\New project 2\Kingdoom-sync\apps\mobile`.

Objetivo:
- cerrar la profundidad funcional movil sin romper la economia ni divergir de la web.

Contexto congelado:
- la web en `src/` es la fuente de verdad funcional.
- el target movil oficial es `apps/mobile`.
- cualquier logica sensible debe venir de RPC existente o replicar fielmente el comportamiento ya aprobado en web.
- no abrir features nuevas fuera del backlog de reactivacion.

Tus frentes:
- `src/components/RealmStockExchangeNative.tsx`
- `src/components/TavernSlotsNative.tsx`
- `src/features/missions/*`
- `src/features/events/*`
- `src/features/market/*`
- `src/features/inventory/*`
- `src/features/session/*`

Lo que debes hacer:
- auditar sincronizacion real de oro, inventario y estado de jugador
- revisar consistencia entre compra, refresco de saldo e inventario
- estabilizar `RealmStockExchangeNative`
- revisar `missionsService` y `eventsService` para asegurar paridad operativa minima
- dejar preparado el terreno para un minijuego movil adicional ademas de slots

Reglas estrictas:
- no tocar admin movil
- no inventar contratos nuevos si no existen en web o no fueron aprobados por Jarvis
- no aceptar dobles descuentos, dobles premios ni estados fantasmas
- no asumir que el cliente puede ser fuente de verdad economica

Prioridad:
1. `market` y `profile` como eje economico
2. `missions` y `events`
3. `RealmStockExchangeNative`
4. primer minijuego movil adicional

Minijuego adicional:
- no implementarlo hasta que saldo, inventario y servicios base esten estables
- la recomendacion inicial es evaluar `Plinko` o `Horse Race`, no toda la suite

Validacion:
- `npm run mobile:typecheck`
- prueba manual de:
  - compra segura
  - refresh de oro
  - inventario actualizado
  - claim de mision o participacion en evento
  - exchange sin contradiccion visible de saldo

Entrega esperada:
- lista de servicios/componentes tocados
- riesgos economicos encontrados y como se mitigaron
- decision sobre minijuego adicional o precondiciones restantes
- validacion ejecutada
