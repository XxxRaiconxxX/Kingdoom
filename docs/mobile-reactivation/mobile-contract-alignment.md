# Contratos y Tipos a Alinear

Objetivo:
- reducir divergencia entre `src/types.ts` y `apps/mobile/src/features/shared/types.ts`;
- documentar que contratos deben tratarse como canon de dominio antes de seguir expandiendo mobile.

## Contratos prioritarios

1. `player/session`
2. `realm missions`
3. `realm events`
4. `market items`
5. `inventory entries`
6. estados de `claims` y `participations`
7. resultados economicos seguros de compra/apuesta

## Divergencias actuales

### Player / session
- Web usa `PlayerAccount` en `src/types.ts` con:
  - `isAdmin`
  - `authUserId`
  - `phone`
  - `avatar_gif_url`
- Mobile usa `SessionPlayer` local en `apps/mobile/src/features/session/sessionStore.ts` con solo:
  - `id`
  - `username`
  - `gold`

Decision:
- no ampliar todavia el store movil con todos los campos;
- crear primero un contrato compartido minimo de sesion:
  - `id`
  - `username`
  - `gold`
  - `isAdmin?`
- `authUserId`, `phone` y `avatar_gif_url` quedan como extension posterior.

### RealmMission
- Web define `RealmMission` con:
  - `gmConfig?`
  - `createdAt?`
  - `updatedAt?`
  - `activeClaims?`
- Mobile define una version reducida sin esos campos.

Decision:
- `gmConfig`, timestamps y `activeClaims` deben considerarse parte del contrato canon;
- mobile puede no renderizarlos todos en v1, pero debe tolerarlos y tiparlos.

### RealmEvent
- Web permite `id?`, `participationRewardGold?`, `maxParticipants?`
- Mobile exige mas campos como requeridos.

Decision:
- normalizar para que mobile no quede mas estricto que web en campos opcionales;
- si un campo puede venir vacio desde Supabase o fallback web, mobile debe aceptarlo.

### MarketItem / InventoryEntry
- Hoy estan casi alineados entre web y mobile.
- Riesgo principal: evolucion paralela de stock, featured y metadatos visuales.

Decision:
- conservar estos contratos como primer candidato para extraer a capa compartida mas adelante.

### Estados de participacion y claim
- Web:
  - `RealmMissionClaimStatus = claimed | completed | rewarded`
  - `RealmEventParticipationStatus = joined | rewarded`
- Mobile replica los mismos literales.

Decision:
- mantener esos enums congelados como canon compartido.

## Regla de fuente de verdad

La app movil:
- no redefine estados de negocio;
- no cambia literales de dominio por conveniencia local;
- no endurece contratos si web y Supabase todavia permiten variantes mas laxas.

## Trabajo concreto para Jarvis

- revisar cada tipo de `apps/mobile/src/features/shared/types.ts` contra `src/types.ts`
- proponer un lote de alineacion sin romper Expo
- priorizar:
  1. `SessionPlayer`
  2. `RealmMission`
  3. `RealmEvent`
  4. `MarketItem`
  5. `InventoryEntry`

## Trabajo concreto para Antigravity

- Antigravity 1 no debe inventar nuevos tipos de dominio para resolver UI.
- Antigravity 2 solo puede extender contratos si el cambio ya existe en web o queda aprobado por Jarvis primero.
