# Matriz de Paridad Mobile v1

Fuente de verdad funcional:
- Web: `src/`
- Mobile oficial: `apps/mobile/`

Decision base:
- `apps/mobile` es la app oficial a mantener.
- `android/` en raiz se trata como artefacto derivado, no como frente principal.

## Estado por dominio

| Dominio | Web | Mobile | Estado | Prioridad v1 | Dueño principal | Evidencia |
|---|---|---|---|---|---|---|
| Sesion / jugador | Completo | Funcional con refresh y delta seguro | `lista` | Alta | Jarvis | Web: `src/context/PlayerSessionContext.tsx` / Mobile: `apps/mobile/src/features/session/sessionStore.ts` |
| Home / shell de producto | Completo | Funcional | `lista` | Alta | Antigravity 1 | Web: `src/App.tsx`, `src/sections/HomeSection.tsx` / Mobile: `apps/mobile/app/(tabs)/home.tsx` |
| Misiones | Completo + admin + GM config | Jugable base estable | `lista` | Alta | Antigravity 1 + 2 | Web: `src/utils/missions.ts`, `src/components/admin/AdminMissionManager.tsx` / Mobile: `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/src/features/missions/missionsService.ts` |
| Eventos | Completo + admin | Jugable base estable | `lista` | Alta | Antigravity 1 + 2 | Web: `src/utils/events.ts`, `src/components/AdminControlSheet.tsx` / Mobile: `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/src/features/events/eventsService.ts` |
| Mercado catalogo | Completo | Funcional con compra segura | `lista` | Alta | Antigravity 1 | Web: `src/sections/MarketSection.tsx` / Mobile: `apps/mobile/app/(tabs)/market.tsx` |
| Compra segura / economia de compra | Completo | Funcional con RPC | `lista` | Alta | Antigravity 2 | Web: `src/utils/purchases.ts` / Mobile: `apps/mobile/src/features/market/purchaseService.ts` |
| Perfil / inventario / actividad | Completo | Funcional y consistente | `lista` | Alta | Antigravity 1 + 2 | Web: `src/components/PlayerProfilePanel.tsx` / Mobile: `apps/mobile/app/(tabs)/profile.tsx` |
| Grimorio / bestiario / flora | Completo | Funcional | `lista` | Media | Antigravity 1 | Web: `src/components/GrimoireSection.tsx` / Mobile: `apps/mobile/app/(tabs)/grimoire.tsx` |
| Archivista | Completo y mas rico | Compacto y aceptado | `lista` | Media | Antigravity 2 | Web: `src/components/ArchivistSection.tsx` / Mobile: `apps/mobile/app/(tabs)/archivist.tsx` |
| Anime hub | Completo | Compacto y aceptado | `lista` | Baja | Antigravity 1 | Web: `src/components/AnimeHubSection.tsx` / Mobile: `apps/mobile/app/(tabs)/anime.tsx` |
| Bolsa del Reino | Completo | Nativo estable | `lista` | Media-Alta | Antigravity 2 | Web: `src/components/RealmStockExchange.tsx` / Mobile: `apps/mobile/src/components/RealmStockExchangeNative.tsx` |
| Minijuegos | Suite amplia | Slots + Horse Race + Scratch | `parcial` | Media-Alta | Antigravity 2 | Web: `src/components/Tavern*.tsx` / Mobile: `apps/mobile/src/components/TavernSlotsNative.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/components/TavernScratchNative.tsx` |
| Notificaciones jugador | Existe en web | Visible en `home` y `profile` | `lista` | Baja | Antigravity 2 | Web: `src/components/PlayerNotificationBell.tsx` / Mobile: `apps/mobile/src/components/PlayerNotificationBellNative.tsx` |
| Ranking semanal | Existe en web | No existe en app | `ausente` | Baja | Jarvis | Web: `src/sections/RankingSection.tsx` |
| Negocios / produccion pasiva | Existe en web | No existe en app | `ausente` | Baja | Jarvis | Web: `src/components/PlayerProfilePanel.tsx`, `src/features/businesses/*` |
| Admin / staff tools | Muy completo | No existe como panel | `no prioritaria para mobile v1` | Fuera de v1 | Jarvis | Web: `src/components/AdminControlSheet.tsx` |

## Alcance realmente logrado en Mobile v1

### Dentro de Mobile v1
- sesion y refresh de oro
- home
- library con misiones y eventos
- market con compra segura
- profile con inventario e historial
- grimorio
- bolsa del reino
- `TavernSlotsNative`
- `TavernHorseRaceNative`
- `TavernScratchNative`
- notificaciones compactas de jugador

### Fuera de Mobile v1
- panel admin
- staff tools operativos
- negocios
- ranking semanal
- suite completa de minijuegos de la web
- notificaciones avanzadas

## Lectura ejecutiva

- La web sigue siendo la fuente de verdad de negocio.
- La app mobile ya supero la reactivacion: no tiene paridad total, pero si **paridad operativa minima**.
- El siguiente cuello de botella ya no es la reactivacion, sino el roadmap post-reactivacion: ranking, negocios, QA manual profunda y futuras expansiones.
