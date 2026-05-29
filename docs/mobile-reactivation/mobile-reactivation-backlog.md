# Backlog de Reactivacion Mobile

Este backlog arranca con la Fase 1 ya cerrada por Jarvis.

## Fase 1 - Cerrada

### Jarvis
- [x] auditar web vs mobile por dominio
- [x] congelar el target oficial en `apps/mobile`
- [x] excluir `android/` raiz como producto movil principal
- [x] definir paridad operativa minima v1
- [x] listar contratos y tipos a alinear
- [x] dejar prompts listos para Antigravity 1 y 2

## Fase 2 - Paridad operativa minima

### Jarvis
- [x] revisar y cerrar alineacion de tipos entre `src/types.ts` y `apps/mobile/src/features/shared/types.ts`
- [x] decidir si el primer minijuego extra en mobile sera `Plinko` o `Horse Race`
- [x] validar que toda economia movil use RPC/flujo ya aprobado
- [x] revisar cambios de Antigravity 1 y 2 antes de merge

### Antigravity 1
- [x] pulir `home`
- [x] pulir `library`
- [x] pulir `market`
- [x] pulir `profile`
- [x] revisar `grimoire`, `archivist` y `anime` para consistencia visual y feedback
- [x] asegurar estados vacios, error, loading y refresh en todos los tabs principales
- [x] dejar los 4 flujos base listos para beta interna:
  - sesion
  - misiones/eventos
  - compra
  - inventario/perfil

### Antigravity 2
- [x] estabilizar `RealmStockExchangeNative`
- [x] revisar integracion de oro y sincronizacion de saldo en mobile
- [x] auditar `missionsService` y `eventsService`
- [x] revisar consistencia entre historial de compras, inventario y saldo
- [x] sumar un minijuego prioritario ademas de `TavernSlotsNative`

## Fase 3 - Expansión selectiva

### Jarvis
- [x] decidir si `Archivist` y `Anime` justifican expansion profunda o se mantienen compactos
- [x] reevaluar si ranking o notificaciones entran en mobile beta (notificaciones implementadas)

### Antigravity 1
- [x] segunda pasada de polish visual
- [x] ajustar ergonomia real de uso en Android

### Antigravity 2
- [ ] segundo minijuego movil si el primero quedo estable (evaluando prioridad)
- [x] evaluar notificaciones o features economicas adicionales (PlayerNotificationBellNative implementado)

## Orden recomendado de ejecucion

1. Alinear contratos minimos
2. Cerrar UX de `home`, `library`, `market`, `profile`
3. Estabilizar economia movil y exchange
4. Añadir primer minijuego prioritario (`Horse Race`)
5. Recién despues expandir archivista, anime u otros extras

## Criterios de aceptacion

- `npm run mobile:typecheck` pasa
- la app mantiene sesion y refresca oro correctamente
- `home`, `library`, `market` y `profile` funcionan de punta a punta
- compras, claims y participaciones no generan estados fantasmas
- exchange y minijuegos no contradicen el saldo real del jugador
