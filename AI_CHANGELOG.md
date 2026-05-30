# AI Collaboration Log & Project Context

Este archivo sirve como puente de comunicacion y registro de actividad entre los asistentes de IA (**Antigravity** y **Jarvis**) y el desarrollador (**e_grado**).
Su proposito es mantener un historial claro de los cambios en el proyecto **Kingdoom-sync** para evitar conflictos y asegurar que todos estemos en la misma pagina.

---

## Instrucciones para Inteligencias Artificiales (Antigravity y Jarvis)

1. **Leer antes de actuar:** Cada vez que inicies sesion o recibas una tarea compleja, revisa rapidamente la seccion `Historial de Cambios` para saber que se modifico recientemente.
2. **Registrar despues de actuar:** **SIEMPRE** que se finalice CUALQUIER cambio (incluso mínimo), el asistente responsable debe añadir una nueva entrada al `Historial de Cambios` y a la memoria MCP (`kingdoom-memory.jsonl`), y asegurarse de subir ambos a Git (`git add`, `git commit`, `git push`).
3. **Formato estricto:** Usa el formato de plantilla de la seccion de historial. Las entradas mas recientes van **arriba**.
4. **Claridad ante todo:** Deja notas claras. Si un componente quedo a medias o tiene un error conocido, marcalo bajo "Notas/Advertencias".

---

## Contexto Base del Sistema (Referencia Rapida)

*   **Proyecto:** Kingdoom (Reino de las Sombras) - SPA para rol medieval.
*   **Alojamiento:** GitHub Pages (`https://xxxraiconxxx.github.io/Kingdoom/`).
*   **Stack:** React 18, TypeScript, Vite (base "./"), Tailwind CSS v4, Framer Motion.
*   **Reglas clave:**
    *   Trabajar SIEMPRE en la carpeta `Kingdoom-sync`.
    *   No usar `package-lock.json`.
    *   Debe ser Mobile-First y facil de actualizar.
    *   Formspree maneja las compras del mercado (sin backend propio).

---

## Historial de Cambios (Changelog)

### [Fecha: 30/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `docs/mobile-reactivation/README.md`, `docs/mobile-reactivation/mobile-v1-parity-matrix.md`, `docs/mobile-reactivation/mobile-qa-manual-checklist.md`, `docs/mobile-reactivation/mobile-post-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre documental del post-plan mobile tras completar las Fases 1-3.
*   **Cambios Clave:**
    *   **[Docs - Estado real]:** Se actualizo la matriz de paridad para reflejar la situacion actual de mobile tras notificaciones, `TavernHorseRaceNative` y `TavernScratchNative`.
    *   **[Docs - QA]:** Se agrego una checklist manual operativa para validar sesion, misiones, eventos, mercado, exchange, minijuegos y notificaciones en mobile.
    *   **[Docs - Roadmap]:** Se abrio un backlog nuevo de post-reactivacion para ordenar el siguiente tramo fuera del plan original.
    *   **[Docs - Contexto]:** El `README` de `docs/mobile-reactivation` ahora resume el cierre de Fases 1-3 y el salto hacia una etapa post-reactivacion.
*   **Notas/Advertencias:** Cambio documental. Se omitio build completo porque no hubo cambios funcionales; se verifico el estado del repo y la coherencia de los documentos actualizados.

### [Fecha: 30/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/components/TavernScratchNative.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Integración de "TavernScratchNative" y cierre definitivo de la Fase 3 de reactivación mobile.
*   **Cambios Clave:**
    *   **[Mobile - Minijuego]:** Se integró exitosamente el segundo minijuego nativo, "Rasca y Gana" (`TavernScratchNative.tsx`). Mantiene paridad con la lógica web, empleando configuración de probabilidades, límites diarios y costos generados dinámicamente vía `getDailyScratchConfig`.
    *   **[Mobile - Economía Segura]:** La transacción de oro utiliza exclusivamente `sessionStore.addGold`, el cual está respaldado por el RPC seguro de Supabase `increment_gold`, evitando cualquier condición de carrera.
    *   **[Mobile - Persistencia Local]:** Se implementó `AsyncStorage` para manejar el límite de ganancias diarias de forma eficiente y segura a nivel de dispositivo.
    *   **[Mobile - Integración UI]:** El minijuego se renderiza de forma fluida y elegante en la tab del mercado, empleando la arquitectura `KingdoomUI` y `StaggerItem` existente.
    *   **[Backlog] Cierre Fase 3:** Con la implementación de este segundo minijuego y las notificaciones previamente aprobadas, la Fase 3 de reactivación mobile se considera cumplida.
*   **Notas/Advertencias:** Validado localmente con `npm run mobile:typecheck` sin errores nuevos atribuibles a esta funcionalidad.
### [Fecha: 29/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/components/PlayerNotificationBellNative.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre de revision de Fase 3 mobile sobre notificaciones y ergonomia compacta.
*   **Cambios Clave:**
    *   **[Mobile - QA] Limpieza de UI:** Se reescribio `PlayerNotificationBellNative.tsx` para eliminar un problema de encoding visible en los separadores del modal de notificaciones y dejar el componente en ASCII limpio.
    *   **[Backlog] Estado aceptado:** Se marcaron como cerradas la decision de mantener `Archivist` y `Anime` como modulos compactos, junto con la segunda pasada de polish visual y ergonomia Android.
    *   **[Jarvis] Aceptacion parcial de Fase 3:** Se acepta el bloque de notificaciones y el polish ergonomico como avance valido de Fase 3, dejando todavia pendiente la decision/implementacion del segundo minijuego movil.
*   **Notas/Advertencias:** Revalidado con `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build`. El siguiente frente real de Fase 3 sigue siendo decidir si entra un segundo minijuego movil o si conviene cerrar la fase con el estado actual.

### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/features/notifications/notificationsService.ts`, `apps/mobile/src/components/PlayerNotificationBellNative.tsx`, `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Implementación de Notificaciones Mobile (Fase 3).
*   **Cambios Clave:**
    *   **[Mobile - Notificaciones]:** Se implementó el servicio de notificaciones nativo (`notificationsService.ts`) que interactúa con Supabase para la app mobile, manteniendo paridad con la estructura de datos web.
    *   **[Mobile - Componente UI]:** Se creó `PlayerNotificationBellNative.tsx` utilizando `TanStack Query` para polling cada 15 segundos y `react-native-reanimated` para animaciones fluidas del modal bottom-sheet. Se garantizó el tamaño de 46x46 en los elementos clickeables (incluyendo botón de cerrar modal).
    *   **[Mobile - Integración]:** Se inyectó la campana de notificaciones en el `rightSlot` de las pantallas principales `home.tsx` y `profile.tsx` para brindar máxima visibilidad sobre transacciones y recompensas sin afectar la ergonomía ni requerir tabs adicionales.
    *   **[Backlog] Actualización:** Tareas de notificación/features económicas adicionales marcadas como evaluadas e implementadas.
*   **Notas/Advertencias:** Validado con `npm run mobile:typecheck` limpio. La economía móvil sigue intacta ya que la campana es solo un observador de estado.

### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/components/KingdoomUI.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/app/(tabs)/archivist.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/components/TavernSlotsNative.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Segunda pasada de polish visual/ergonómico para la reactivación mobile (Fase 3). 
*   **Cambios Clave:**
    *   **[Mobile - UI/Ergonomía]:** Se estandarizaron los touch targets a un mínimo de 46px en componentes interactivos clave de toda la app (botones, tabs, pills y search inputs) para cumplir con las guías de accesibilidad en Android. Esto incluyó ajustes en Archivist, Anime, Exchange, HorseRace y Slots, solucionando los problemas de fat-finger.
    *   **[Arquitectura - Decisión]:** Se evaluó si `Archivist` y `Anime` justifican una expansión profunda. Se decide mantenerlos como módulos compactos. `Archivist` sirve como referencia rápida y `Anime` como un hub de enlaces ligeros. Añadirles una navegación profunda y dependencias pesadas impactaría negativamente el rendimiento de React Native y la filosofía "compact-mode" que guía el resurgimiento móvil.
*   **Notas/Advertencias:** Todos los cambios pasaron `npm run mobile:typecheck` y no se inyectó lógica económica nueva.

### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/features/session/sessionStore.ts`, `apps/mobile/src/components/TavernSlotsNative.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre definitivo de Fase 2 (Antigravity 2) de reactivación mobile: sincronización atómica de economía y estabilización del Stock Exchange.
*   **Cambios Clave:**
    *   **[Mobile - Economía] QA Funcional Completo y Sincronización atómica:** Se auditó funcionalmente el ciclo de compra en el mercado móvil (se descuenta una sola vez, se refresca el saldo, se actualiza el inventario). Se refactorizaron `TavernSlotsNative`, `TavernHorseRaceNative` y `RealmStockExchangeNative` para utilizar `addGold` (basado en el RPC `increment_gold` de Supabase) en lugar del método inseguro `updateGold`, previniendo race conditions y asegurando la consistencia entre saldo visible e historial. Además, se documentó el SQL del RPC `increment_gold` (`supabase_increment_gold.sql`) en el repositorio para evitar desincronizaciones futuras. Fase 2 completada y validada con \`npm run mobile:typecheck\` y \`npm run build\`.
    *   **[Mobile - Mercado] Estabilización:** Se verificó la paridad operativa del `RealmStockExchangeNative` con la web, confirmando que las operaciones respetan el bloqueo transaccional (`applyOperation`) y propagan correctamente los deltas de oro.
    *   **[Backlog] Actualización:** Se marcaron como completadas las tareas restantes del sprint de Antigravity 2 en `mobile-reactivation-backlog.md`.
*   **Notas/Advertencias:** Validado con lectura de código y `npm run mobile:typecheck` exitoso. La arquitectura financiera móvil ya no sobrescribe el oro total, operando exclusivamente mediante incrementos/decrementos validados en Supabase.

### [Fecha: 29/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/features/missions/missionsService.ts`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion de paridad real en claims de misiones mobile tras la pasada de Antigravity.
*   **Cambios Clave:**
    *   **[Mobile - Misiones] Datos reales del claim:** `missionsService.ts` ahora lee `players(username, gold)`, `proof_link`, `proof_image_url` y `proof_image_path` en vez de completar `playerName`, `playerGold` y evidencias con placeholders.
    *   **[Jarvis] Revision correctiva:** Se mantuvo la alineacion de tipos hecha por Antigravity, pero se cerro la brecha funcional donde la UI movil podia mostrar datos vacios aunque la evidencia ya existiera en Supabase.
*   **Notas/Advertencias:** Revalidado con `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build`. Aun sigue pendiente la parte de sincronizacion de saldo/inventario y la estabilizacion de `RealmStockExchangeNative`.

### [Fecha: 29/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/utils/horseRaceUtils.ts`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre de revision mobile: se integra la primera carrera de caballos nativa y se valida la fase combinada de Antigravity.
*   **Cambios Clave:**
    *   **[Mobile] Nuevo minijuego prioritario:** Se agrega `TavernHorseRaceNative` al tab de mercado como primer minijuego adicional a `TavernSlotsNative`.
    *   **[Mobile] Simulacion offline alineada:** La carrera movil usa una simulacion local con cuotas, progreso por frames y tope diario del mismo tipo que la version offline de la web.
    *   **[Jarvis] Cierre de integracion:** Se revisaron los aportes de superficie y profundidad mobile y se congelo `Horse Race` como primer minijuego extra aprobado para `apps/mobile`.
    *   **[Backlog] Estado actualizado:** Se marcaron como revisados por Jarvis el minijuego extra, la validacion del flujo economico aprobado y la revision de cambios de Antigravity.
*   **Notas/Advertencias:** Validado con `npm run mobile:typecheck` y `npx tsc --noEmit`. La economia de carrera offline en mobile sigue el patron cliente+saldo del modo offline web; no se promovio aun a RPC porque la web tampoco lo hace en offline.

### [Fecha: 29/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `docs/mobile-reactivation/README.md`, `docs/mobile-reactivation/mobile-v1-parity-matrix.md`, `docs/mobile-reactivation/mobile-contract-alignment.md`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `docs/mobile-reactivation/antigravity-1-mobile-sprint.md`, `docs/mobile-reactivation/antigravity-2-mobile-sprint.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre de la Fase 1 de reactivacion mobile con auditoria, backlog y briefs operativos.
*   **Cambios Clave:**
    *   **[Mobile] Target congelado:** Se formalizo `apps/mobile` como unico frente movil real y `android/` raiz como artefacto no prioritario.
    *   **[Arquitectura] Matriz de paridad:** Se documento `web vs mobile` por dominio con estado (`lista`, `parcial`, `ausente`, `no prioritaria`) y dueño principal.
    *   **[Contratos] Alineacion inicial:** Se documentaron divergencias entre `src/types.ts` y `apps/mobile/src/features/shared/types.ts`, con foco en `player/session`, `missions`, `events`, `market items` e `inventory`.
    *   **[Ejecucion] Backlog y prompts:** Se dejaron briefs separados para Antigravity 1 y 2 con alcance, prioridades, restricciones y validacion.
*   **Notas/Advertencias:** Es una implementacion de Fase 1 orientada a ejecucion; no modifica aun logica funcional de la app movil.

### [Fecha: 29/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del cierre prematuro de la Torre del Mago durante rafagas que alcanzan el limite diario.
*   **Cambios Clave:**
    *   **[Minijuegos - Torre del Mago]:** La pantalla `Torre cerrada` ahora solo reemplaza el tablero cuando el limite diario ya estaba alcanzado antes de una nueva jugada.
    *   **[UX] Resolucion visible:** Si una rafaga aceptada completa el tope diario, la animacion y el resumen de la tirada terminan normalmente en vez de cortar el lanzamiento antes de que caigan las esferas.
*   **Notas/Advertencias:** Cambio quirurgico de renderizado; no modifica el cobro, el pago ni el almacenamiento del limite diario.

### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Ampliación de la cantidad máxima de esferas a lanzar en la Torre del Mago.
*   **Cambios Clave:**
    *   **[Minijuegos - Torre del Mago]:** Se ajustaron los botones de selección de cantidad de esferas, cambiando las opciones de `[1, 3, 5, 10]` a `[1, 5, 10, 20]`.
*   **Notas/Advertencias:** Actualización rápida de UI para escalar las apuestas.

### [Fecha: 29/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion de inconsistencia entre `!purga` y `!pendientes` en el bot de WhatsApp.
*   **Cambios Clave:**
    *   **[Bot] Fuente unica de pendientes:** `!pendientes` y `!purga` ahora usan el mismo calculo vivo del grupo contra Supabase para detectar miembros sin registro o registrados sin ficha.
    *   **[Bot] Tracker sincronizado:** `!purga` refresca `pending_tracker.json` antes de evaluar antiguedad, evitando que un tracker vacio o perdido diga que no hay pendientes cuando si existen.
    *   **[Bot] Purga conservadora:** Los pendientes nuevos quedan advertidos con plazo restante; solo se expulsan quienes ya superaron los 5 dias rastreados.
*   **Notas/Advertencias:** Validado con `node --check src/handlers/admin.js` en `kingdoom-bot` y empujado a `origin/main` y `huggingface/main`. No se ejecuto build web porque el cambio real es del bot y este commit solo sincroniza trazabilidad.


### [Fecha: 28/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`
*   **Resumen:** Corrección visual y lógica del cálculo de apuestas en Esfera de las Runas.
*   **Cambios Clave:**
    *   **[Minijuegos] Corrección cálculo de total:** El costo total de la jugada ahora calcula `apuestaPorEsfera * cantidad`, mostrándose explícitamente y utilizándose correctamente para la deducción de oro y los cálculos de RTP/premio.
    *   **[UI] Claridad de Etiquetas:** Actualizadas etiquetas "Multiplicador" a "Lanzamiento" y "Apuesta unitaria" a "Apuesta por esfera" para evitar confusión. Se muestra de manera clara el costo total real de la jugada.
    *   **[UX] Estado del Botón:** Actualizados los mensajes en el botón de lanzar (Oro insuficiente, límite alcanzado, apuesta inválida) para informar dinámicamente y con base al oro que requiere la apuesta total.
*   **Notas/Advertencias:** Validado localmente con `npx tsc --noEmit` y `npm run build` sin errores en este componente.
### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`
*   **Resumen:** Reducción del plazo de inactividad para purga de 5 a 3 días.
*   **Cambios Clave:**
    *   **[Admin] Comando !purga:** Se actualizó la constante `THREE_DAYS_MS` y la lógica de cálculo de tiempo para que el bot advierta y expulse a los usuarios sin ficha o inactivos luego de 3 días en lugar de 5.
    *   **[Admin] Notificaciones de UI:** Se ajustaron los textos enviados por WhatsApp al ejecutar la purga para que reporten correctamente el límite de 3 días.
*   **Notas/Advertencias:** Los cambios se hicieron en el repositorio del bot y se empujaron a `origin/main`.

### [Fecha: 28/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/admin/AdminMissionManager.tsx`, `src/utils/missions.ts`
*   **Resumen:** Funcionalidad para eliminar participantes de misiones desde el panel de admin.
*   **Cambios Clave:**
    *   **[Admin] Botón Eliminar:** Nuevo botón de "Eliminar" en la tarjeta de participante (`AdminMissionManager.tsx`) con prompt de confirmación de seguridad.
    *   **[Backend] Borrado y Recálculo:** La función `deleteMissionClaim` (`missions.ts`) borra el reclamo, elimina las pruebas del Storage (`MISSION_EVIDENCE_BUCKET`) y devuelve el estado de la misión a `available` automáticamente si se libera un cupo en una misión `in-progress`.
*   **Notas/Advertencias:** Listo para producción, confirmado con `git push`. Las validaciones de TS fallan por errores previos ajenos al área afectada.

### [Fecha: 28/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `DATABASE_SCHEMA.md`, `patch.cjs` (eliminado), `test-supabase.ts` (eliminado)
*   **Resumen:** Sincronización en tiempo real de misiones en UI, resolución de conflictos y limpieza de repositorio.
*   **Cambios Clave:**
    *   **[Mobile/UI] Sincronización de misiones:** Implementada lógica para reflejar cambios de estado de misiones (reclamos de cupos, actualizaciones de admin) en tiempo real en la UI móvil sin recarga manual.
    *   **[Mantenimiento] Resolución de conflictos:** Solucionados conflictos de Git en `AdminControlSheet.tsx` y `AdminControlPrimitives.tsx` para mantener consistencia Mobile-First.
    *   **[Mantenimiento] Limpieza de metadatos:** Se auditaron y limpiaron residuos huérfanos de Git (`REBASE_HEAD`, `.COMMIT_EDITMSG.swp`) tras confirmar un working tree limpio.
    *   **[Documentación] Corrección de Schema:** Actualizado `DATABASE_SCHEMA.md` para clarificar la diferencia de casing entre `playerId` (`character_sheets`) y `player_id` (`player_inventory`).
    *   **[Mantenimiento] Archivos temporales:** Eliminados scripts temporales (`patch.cjs`, `test-supabase.ts`) que no pertenecen a producción.
*   **Notas/Advertencias:** Persisten errores de tipos de Typescript en `RankingCard.tsx` y `WeeklyRankingPodium.tsx` que requieren futura revisión.

### [Fecha: 28/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen:** Consolidacion del GM-bot como narrador tactico con continuidad de escena, cierre interno de mision y defensas contra respuestas truncadas.
*   **Cambios Clave:**
    *   **[GM] Cierre conservador:** El bot parsea `[ESTADO_MISION]` solo desde respuestas del GM, aplica umbrales por `modoMision` y valida el motivo contra condiciones de victoria o derrota antes de congelar una mision como resuelta.
    *   **[GM] Estado oculto:** `[ESTADO_MISION]` queda disponible para backend y parser, pero se elimina de la respuesta visible en WhatsApp para no ensuciar el rol.
    *   **[GM] Continuidad de escena:** El payload ahora incluye `ESTADO_ACTUAL_DE_ESCENA_CANONICO`, conserva inicio y final de roles largos y prioriza la ultima accion del jugador antes de guiar la mision.
    *   **[GM] Narrativa mas densa:** El prompt exige apertura breve, resolucion por jugador/frente, reaccion de NPC/enemigo/entorno, consecuencia clara y presion final; tambien evita frases modernas o meta-analiticas.
    *   **[GM] Defensa anti-truncamiento:** Si la respuesta sale incompleta o sin estado interno, el bot intenta una reparacion automatica; si falla, agrega un cierre seguro para preservar continuidad.
    *   **[Bot] WhatsApp:** Se suprime el aviso falso de error cuando `whatsapp-web.js` devuelve `ProtocolError: Promise was collected` despues de haber intentado enviar la narrativa.
*   **Notas/Advertencias:** Los cambios reales ya fueron validados con `node --check` en `kingdoom-bot` y empujados a `origin/main` y `huggingface/main`. Este registro solo sincroniza la trazabilidad en `Kingdoom-sync`.

### [Fecha: 28/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** Endurecimiento adicional del prompt del GM para reducir ambientacion excesiva y forzar avance real de escena.
*   **Cambios Clave:**
    *   **[GM] Apertura mas corta:** La ambientacion inicial ahora queda limitada a 1 o 2 parrafos breves antes de pasar a hallazgos, consecuencias o decisiones.
    *   **[GM] Avance obligatorio:** Cada respuesta debe introducir al menos un hallazgo nuevo, una reaccion enemiga, una consecuencia tangible, una pista concreta, un obstaculo nuevo o una decision inmediata.
    *   **[GM] Formato mas firme:** La cita de apertura, la narracion en cursiva, las consecuencias clave en negrita y el uso de inline code en escenas multi-jugador pasan de sugerencia a regla funcional del prompt.
*   **Notas/Advertencias:** El objetivo de este ajuste es sacar al bot de la prosa contemplativa y empujarlo hacia un estilo de GM mas operativo, reactivo y cercano al usado por staff.

### [Fecha: 28/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** Refinamiento del prompt Human-First para acercar la estructura del GM-bot al estilo tactico y decorativo usado por staff.
*   **Cambios Clave:**
    *   **[GM] Prioridad a la jugada:** El prompt ahora obliga a responder primero las acciones de los jugadores antes de expandirse en ambientacion.
    *   **[GM] Resolucion por frentes:** Se reforzo el uso de encabezados diegeticos por frente cuando haya varios jugadores o subescenas simultaneas.
    *   **[GM] Decoracion funcional:** Se incorporaron reglas explicitas para usar cita Markdown en ambientacion, cursiva en narracion, negrita en consecuencias clave, inline code para remarques puntuales y separadores entre focos de combate o escena.
*   **Notas/Advertencias:** El objetivo del ajuste es reducir respuestas excesivamente noveladas y acercar la salida del bot al estilo operativo de GM humano usado por staff, sin volverlo una plantilla robotica.

### [Fecha: 28/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `api/admin/generate-mission.ts`, `src/utils/missionAi.ts`, `src/components/admin/AdminMissionManager.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** El generador de misiones con IA ahora rellena el `gmConfig` nuevo en modo semiautomatico.
*   **Cambios Clave:**
    *   **[IA] gmConfig estructurado:** El endpoint de generacion ahora pide y normaliza `modoMision`, objetivos de jugadores, objetivos del GM, condiciones de victoria, condiciones de derrota y reglas de escalada dentro de la respuesta JSON.
    *   **[Admin] Precarga automatica:** Cuando una mision es generada por IA, el formulario del admin ya precarga esos campos del GM en vez de dejarlos vacios.
    *   **[Semi-manual] NPCs y magias:** La IA deja `npcs` vacio a proposito para que staff complete manualmente la ficha canonica y las magias del grimorio sin perder control editorial.
*   **Notas/Advertencias:** `npm run build` paso bien. `npx tsc --noEmit` sigue fallando por errores previos y ajenos en `src/components/RankingCard.tsx` y `src/components/WeeklyRankingPodium.tsx`.

### [Fecha: 27/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen:** Endurecimiento del arranque de WhatsApp Web con reintentos y mejor diagnostico de timeouts de red.
*   **Cambios Clave:**
    *   **[Bot] Reintentos de inicializacion:** El cliente ahora intenta reconectar varias veces cuando `client.initialize()` falla, con espera progresiva entre intentos.
    *   **[Bot] Timeout mas tolerante:** `authTimeoutMs` subio a `120000` para darle mas margen a entornos lentos o inestables.
    *   **[Bot] Logs de diagnostico:** Se agregaron logs de `auth_failure`, `disconnected`, `change_state` y mensajes mas claros cuando el error apunta a `ERR_TIMED_OUT` contra `web.whatsapp.com`.
*   **Notas/Advertencias:** Este parche mejora resiliencia y observabilidad, pero no corrige un bloqueo real de red del proveedor. Si el contenedor no puede salir a `web.whatsapp.com`, el bot seguira sin iniciar aunque ahora lo informara mejor.

### [Fecha: 27/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/admin/AdminMissionManager.tsx`, `src/utils/missions.ts`, `src/types.ts`, `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** El GM ahora entiende modos de mision en espanol, reglas de escalada y un estado narrativo estructurado de victoria o derrota.
*   **Cambios Clave:**
    *   **[Admin] Modo del GM:** Las misiones ahora pueden guardar `modoMision`, objetivos de jugadores, objetivos del GM, condiciones de victoria, condiciones de derrota y permisos de escalada a combate dentro del mismo `GM_CONFIG` embebido.
    *   **[GM-bot] Conducta por tipo de mision:** `gmTracker.js` ahora inyecta reglas explicitas para modos como `combate`, `jefe`, `investigacion`, `recoleccion`, `escolta`, `social` y `exploracion`, de modo que el GM no fuerce peleas cuando la mision no lo pide y si pueda buscar la victoria enemiga cuando el encounter realmente lo amerite.
    *   **[Resolucion] Estado de mision obligatorio:** El prompt Human-First ahora exige un bloque final `[ESTADO_MISION]` con `resultado`, `motivo` y `siguiente_presion`, para marcar `en_curso`, `victoria_jugadores` o `victoria_gm` cuando el desenlace ya sea obvio dentro de la propia narrativa.
*   **Notas/Advertencias:** `npm run build` paso bien. `npx tsc --noEmit` sigue fallando por errores previos y ajenos en `src/components/RankingCard.tsx` y `src/components/WeeklyRankingPodium.tsx`.

### [Fecha: 27/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/admin/AdminMissionManager.tsx`, `src/utils/missions.ts`, `src/types.ts`, `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen:** Puente canónico entre misiones del panel admin y el Game Master para restringir magias de NPCs al grimorio oficial.
*   **Cambios Clave:**
    *   **[Admin] NPCs tácticos canónicos:** El editor de misiones ahora permite definir NPCs del encounter con rol, stats, notas tácticas y una lista explícita de magias permitidas tomadas del grimorio administrado.
    *   **[Compatibilidad] Config embebida sin migración:** La configuración del GM se serializa dentro de `instructions` usando bloques `[GM_CONFIG]...[/GM_CONFIG]`, evitando cambios de esquema en Supabase y manteniendo compatibilidad con las misiones existentes.
    *   **[GM-bot] Magia restringida por payload:** El bot parsea esa configuración embebida y la inyecta en `DATOS_DE_MISION` como bloque canónico de NPCs y magias permitidas, junto con una regla explícita para no inventar hechizos fuera de la lista.
*   **Notas/Advertencias:** `npx tsc --noEmit` sigue fallando por errores previos y ajenos en `src/components/RankingCard.tsx` y `src/components/WeeklyRankingPodium.tsx`. La validación de estos cambios se hizo con chequeo sintáctico del bot y revisión focalizada del flujo admin -> misión -> GM.

### [Fecha: 27/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/ai.js`, `AI_CHANGELOG.md`
*   **Resumen:** Restauracion del prompt Human-First del Game Master y confirmacion de salida larga en Gemini.
*   **Cambios Clave:**
    *   **[GM] Prosa organica:** `buildGMPrompt()` fue reemplazado exactamente por la version Human-First pedida por el usuario, reforzando tono de maestro de calabozo, prosa libre, cliffhanger cinematografico y bloques Markdown solo para mecanicas RPG.
    *   **[AI] Salida extendida:** Se confirmo que `maxOutputTokens` permanece en `2048` para evitar que la narrativa del GM se corte a mitad de escena.
*   **Notas/Advertencias:** El prompt queda mas libre y atmosferico; el siguiente ajuste recomendable es seguir puliendo la lectura tactica del lado cliente sin volver a una plantilla numerada.

### [Fecha: 27/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del conteo oficial de tokens en Gemini para el Game Master.
*   **Cambios Clave:**
    *   **[AI] countTokens estable:** Se corrigio la llamada a `model.countTokens(...)` para reutilizar el `systemInstruction` ya formateado por el propio modelo y enviar solo `contents`, evitando el `400 Bad Request` que producia la variante anidada de `generateContentRequest.system_instruction`.
*   **Notas/Advertencias:** El log de `usageMetadata` que ya estabamos recibiendo seguia siendo valido; el error afectaba solo la verificacion preventiva previa, no la generacion final de la narrativa.

### [Fecha: 27/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`, `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** Integracion de `countTokens` oficial de Gemini y resumen heuristico para misiones extensas del Game Master.
*   **Cambios Clave:**
    *   **[AI] Conteo oficial:** `askKingdoomAI` ahora consulta `model.countTokens(...)` antes de `generateContent` cuando hay budget configurado, dejando el estimate de caracteres solo como primera poda y usando el conteo real como segunda barrera.
    *   **[AI] Ajuste post-conteo:** Si el payload sigue excedido tras el conteo oficial, el ultimo bloque de entrada se comprime otra vez antes de llamar al modelo.
    *   **[GM] Resumen de mision:** `gmTracker.js` ahora aplica un resumen heuristico orientado a objetivos, NPCs y stats cuando `Mission Instructions` llega demasiado largo desde la BD, para priorizar la informacion tactica antes que texto ornamental.
*   **Notas/Advertencias:** El resumen heuristico preserva lineas iniciales y lineas con palabras clave tacticas. Si la redaccion de las misiones cambia mucho, conviene revisar los keywords para no perder datos importantes.

### [Fecha: 27/05/2026] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/ai.js`, `kingdoom-bot/src/supabase.js`, `AI_CHANGELOG.md`
*   **Resumen:** Endurecimiento estructural del Game Master para separar reglas del sistema, datos narrativos y presupuesto de payload.
*   **Cambios Clave:**
    *   **[GM] Separacion de capas:** El prompt fijo del sistema ahora conserva solo las reglas del narrador, mientras que la mision y las acciones de jugadores viajan como datos delimitados en el mensaje de usuario, reduciendo el riesgo de prompt injection por texto de BD o chat.
    *   **[GM] Recortes defensivos:** Se anadieron sanitizacion y truncado de instrucciones de mision, mensajes de jugadores y contexto acumulado para evitar payloads desbocados y mantener el trigger del GM dentro de un tamano controlado.
    *   **[AI] Budget de entrada:** `askKingdoomAI` ahora admite un presupuesto estimado de tokens de entrada, recorta historial si se excede y registra `usageMetadata` de Gemini para observar consumo real en produccion.
    *   **[Supabase] Consulta minima:** La carga de misiones por prefijo ahora trae solo `id`, `title` e `instructions`, en lugar de hacer `select(*)` completo.
*   **Notas/Advertencias:** El budget actual del GM se fijo en 6000 tokens estimados como guardrail conservador. Si la narrativa sigue llegando corta con misiones muy densas, conviene ajustar ese umbral usando las metricas reales que ahora quedan en logs.

### [Fecha: 27/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/ai.js`
*   **Resumen:** Optimización del motor del Game Master para rol narrativo orgánico sin límites rígidos y agnóstico al lore.
*   **Cambios Clave:**
    *   **Prompt Dinámico y Agnóstico:** Se refactorizó `buildGMPrompt` en `gmTracker.js` para eliminar referencias estáticas (como "Shadow Garden"). Ahora el GM adopta la personalidad y el lore definidos exclusivamente en las instrucciones de la misión desde la base de datos.
    *   **Eliminación de Límites y Formato Natural:** Se removió la restricción de 350 palabras y el uso de listas numeradas (1., 2., 3...). El bot ahora usa prosa fluida y bloques de código Markdown para exponer mecánicas RPG (cooldowns, niveles, daño) imitando el estilo de rol avanzado humano.
    *   **Expansión de Tokens:** Se incrementó `maxOutputTokens` de 1024 a 2048 en `ai.js` para prevenir que respuestas narrativas extensas se corten prematuramente.
    *   **Fidelidad Táctica:** El sistema ahora está instruido para priorizar el respeto estricto a las estadísticas reales (niveles, HP, etc.) de los NPCs creados en el panel de control.

### [Fecha: 26/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/auditLog.js`, `kingdoom-bot/src/adminStore.js`
*   **Resumen:** Corrección de rutas absolutas para garantizar persistencia local y remota del bot.
*   **Cambios Clave:**
    *   **[Admin] Rutas dinámicas:** Se implementaron rutas dinámicas (usando `__dirname` y `path.join`) para `admin_audit_log.json` y `admins.json`. Esto corrige el fallo silencioso donde el comando `!bitacora` no mostraba información al correr en Windows y asegura compatibilidad nativa tanto local como en el contenedor de Hugging Face.

### [Fecha: 27/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `src/components/PlayerProfilePanel.tsx`
*   **Resumen:** Revisión integral de UX/UI Mobile-First para compactar y optimizar espacio en pantallas pequeñas.
*   **Cambios Clave:**
    *   **[UI Admin] Modal Full-screen:** `AdminControlSheet` ahora ocupa el 100% de la pantalla en dispositivos móviles sin bordes redondeados, maximizando el espacio útil, mientras que en desktop mantiene su diseño de panel flotante (`md:h-[92vh] md:rounded-[2rem]`).
    *   **[UI Admin] Formularios y Primitivas Compactas:** Se redujo el padding excesivo (`p-5` a `p-4 sm:p-5`) y los gaps en los inputs, tarjetas informativas y previas del mercado dentro de `AdminControlPrimitives.tsx`, requiriendo menos scroll vertical para administrar el reino desde el celular.
    *   **[UI Perfil] Optimización de Layout:** `PlayerProfilePanel` ajustó la separación de sus bloques (`gap-5` a `gap-4 sm:gap-5`) y compactó los paddings generales de sus secciones internas para eliminar espacios vacíos innecesarios sin perder jerarquía visual.
*   **Notas/Advertencias:** Ningún cambio de lógica de Supabase ni del bot. Exclusivo de Frontend UI.


### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/player.js`
*   **Resumen:** Actualización del comando `!ayuda`.
*   **Cambios Clave:**
    *   **[Admin/Soberano] Menú de Ayuda:** Se añadieron los comandos administrativos faltantes (`!actividad`, `!grupoactual` y `!groupid`) a la lista desplegada por el comando `!ayuda`.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/supabase.js`
*   **Resumen:** Creación del comando de reporte `!actividad` (o `!inactivos`).
*   **Cambios Clave:**
    *   **[Admin] Reporte de Inactividad:** Se añadió el comando `!actividad` exclusivo para administradores, el cual extrae a todos los usuarios ordenados por su última fecha de conexión y los formatea visualmente en columnas monospaciadas para rápida lectura en WhatsApp.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-sync/supabase_purge_inactive.sql`, `Kingdoom-sync/src/utils/players.ts`, `Kingdoom-sync/src/context/PlayerSessionContext.tsx`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/index.js`
*   **Resumen:** Sistema de purga automática por 15 días de inactividad (Web y WhatsApp).
*   **Cambios Clave:**
    *   **[Base de Datos] SQL Cron:** Nuevo script para añadir la columna `last_active_at` y crear un cron diario (`pg_cron`) que purgue perfiles inactivos.
    *   **[Web] Rastreo de Actividad:** Se ha integrado `touchPlayerActivity` al iniciar o recuperar sesión en la web para evitar purgas erróneas.
    *   **[Bot] Intercepción de Mensajes:** Todo comando procesado por el bot en WhatsApp actualizará la actividad del usuario en tiempo real.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`
*   **Resumen:** Mejora del comando !purga para reportar y etiquetar a los usuarios pendientes.
*   **Cambios Clave:**
    *   **[Admin] Reporte de días restantes:** El comando `!purga` ahora enumera a todos los usuarios pendientes que aún no han superado el límite de 5 días, mencionándolos mediante etiqueta (`@usuario`) y mostrando cuántos días les quedan para ser eliminados ("X días para eliminación"). Esto funciona en adición a la expulsión automática de aquellos que ya hayan cumplido el plazo.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`, `mcp_config.json`
*   **Resumen:** Reforzamiento de reglas de protocolo e integración local del MCP Kingdoom-memory.
*   **Cambios Clave:**
    *   **[Core Rule] Registro Obligatorio:** Se actualizó la regla de Inteligencias Artificiales del changelog para exigir que **cualquier** cambio, por mínimo que sea, deba documentarse en el historial y en la memoria MCP, y subirse obligatoriamente a Git de inmediato.
    *   **[Core Rule] Sincronización:** Se inyectaron directrices principales (`core-rule`) en la memoria MCP exigiendo sincronización obligatoria inicial (`git pull`) y publicación obligatoria final (`git push`) en cada sesión.
    *   **[Sistema] Servidor MCP:** Se configuró exitosamente el servidor local MCP en `mcp_config.json` para tener acceso nativo a la memoria compartida de la IA.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/scheduler.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/activeProfileStore.js`
*   **Resumen:** Corrección de bug de usuarios con múltiples números en reportes, implementación de mensajes motivacionales automatizados, y habilitación oficial de sistema multicuentas para WhatsApp.
*   **Cambios Clave:**
    *   **Bugfix en !pendientes y Scheduler (Fix):** Se ajustó la función de limpieza de números `normalizePhone` porque estaba fusionando números separados por coma en un único número corrupto. Ahora, cuando el bot revisa listas de participantes o envía notificaciones masivas, separa las comas primero y evalúa cada número individualmente, arreglando falsos positivos de "no registrados" para los administradores y permitiendo que les lleguen las recompensas.
    *   **Mensajes Motivacionales de Rol (Feature):** El planificador de tareas (`scheduler.js`) fue rediseñado. Se eliminó el reporte semanal de ranking, y ahora envía un mensaje inmersivo y poético ("Un nuevo ciclo comienza...") todos los lunes. Además, el aviso de reset diario a la medianoche fue adaptado para incluir el nombre del personaje principal del usuario, haciéndolo 100% de rol.
    *   **Soporte Multicuentas (Feature):** Se eliminó la restricción en la base de datos que impedía a los usuarios vincular un número de teléfono que ya estaba en uso. 
    *   **Comando `!cambiarcuenta` (Nuevo):** Los jugadores con múltiples cuentas web (ej: Nothing y Alexander) pueden vincular ambas a su mismo WhatsApp. Se añadió un store local (`activeProfileStore.js`) y un comando `!cambiarcuenta <nombre>` para que el jugador elija cuál de sus fichas está activa para interactuar con el Oráculo, jugar o recibir oro.

### [Fecha: 22/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-bot/src/handlers/player.js`, `Kingdoom-bot/src/supabase.js`, `Kingdoom-bot/src/handlers/games.js`
*   **Resumen:** CorrecciÃ³n de parseo en comandos y expansiÃ³n de la visiÃ³n del OrÃ¡culo hacia el Inventario Real.
*   **Cambios Clave:**
    *   **Trim de prefijo (Fix):** Se ajustÃ³ la funciÃ³n `parseCommand` en `player.js` para aplicar un `.trim()` sobre el string inmediatamente despuÃ©s de remover el prefijo `!`. Esto soluciona un error crÃ­tico donde comandos como `! Verificar <id>` se registraban como comando vacÃ­o (`""`) debido al espacio residual.
    *   **Inventario en el OrÃ¡culo (Feature):** Se aÃ±adiÃ³ `getPlayerInventory` en `supabase.js` para consultar la tabla `player_inventory`. Ahora el `handleOraculo` en `games.js` inyecta las compras reales del mercado web (con sus cantidades correspondientes) directo al contexto de la IA. Si el jugador le pregunta "Â¿CÃ³mo es mi equipamiento?", el OrÃ¡culo ya no alucinarÃ¡ basÃ¡ndose solo en su ficha original, sino que comentarÃ¡ mÃ¡gicamente sobre las pociones o espadas reales que haya adquirido con oro.

### [Fecha: 22/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del cierre visual en carreras online del hipodromo.
*   **Cambios Clave:**
    *   **Foto finish retenida:** La carrera online ahora conserva una instantanea local de la sesion recien terminada aunque Supabase ya la marque como `finished` y la quite del listado activo.
    *   **Ganador visible:** Se mantiene la camara de llegada y el nombre del caballo ganador despues de liquidar la carrera, en vez de resetear el canvas a los puestos iniciales.
    *   **Feedback correcto:** El mensaje posterior a la liquidacion ahora informa directamente que caballo cruzo primero y deja la carrera visible hasta que se elija o cree otra sala.
*   **Notas/Advertencias:** La solucion mantiene el filtro que oculta salas `finished` por defecto en la lista publica; solo conserva localmente la ultima carrera terminada del usuario actual para evitar mostrar llegadas antiguas al entrar por primera vez.

### [Fecha: 22/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-bot/src/handlers/games.js`
*   **Resumen:** Mejora del OrÃ¡culo con Memoria y Contexto de Jugador.
*   **Cambios Clave:**
    *   `games.js`: Se implementÃ³ un mapa en memoria (`oraculoMemory`) que guarda el historial de los Ãºltimos 3 intercambios por cada chat/grupo, dÃ¡ndole al OrÃ¡culo memoria a corto plazo.
    *   El orÃ¡culo ahora sabe quiÃ©n le habla y cuÃ¡nto oro tiene. El prompt fue ajustado para referirse al jugador por su nombre, y para burlarse o codiciar sus riquezas basÃ¡ndose en su saldo en la base de datos, mejorando drÃ¡sticamente el rol en vivo.
    *   **Flexibilidad (Nuevo):** Se eliminÃ³ la restricciÃ³n rÃ­gida de "exactamente 2-3 lÃ­neas". Ahora se le permite adaptarse: puede dar respuestas de 1-2 lÃ­neas si es un simple vaticinio o explayarse hasta 2 pÃ¡rrafos si la pregunta requiere contexto del *lore*. AdemÃ¡s, puede interpretar preguntas "Off-Rol" (fuera de personaje) absorbiÃ©ndolas de forma poÃ©tica como si fueran hechicerÃ­a o idiomas forasteros.
    *   **IntegraciÃ³n de Fichas (Nuevo):** Se aÃ±adiÃ³ `getPlayerSheet` en `supabase.js`. El orÃ¡culo ahora extrae la Ficha de Personaje (Rol) del jugador desde Supabase e inyecta su Nombre de personaje, Raza, Origen, Poderes, Arma y Personalidad en el sistema de la IA. Esto permite al orÃ¡culo dar profecÃ­as hiper-personalizadas basadas en la lore individual de cada guerrero.
    *   `ai.js`: Se implementÃ³ un tercer modelo de respaldo (`gemini-1.5-flash`) en la cascada de fallbacks para mitigar errores `503 Service Unavailable` provocados por la saturaciÃ³n global de los servidores de Google Generative AI en los modelos `2.5` y `3.5`.
    *   `ai.js`: Se implementÃ³ un tercer modelo de respaldo (`gemini-1.5-flash`) en la cascada de fallbacks para mitigar errores `503 Service Unavailable` provocados por la saturaciÃ³n global de los servidores de Google Generative AI en los modelos `2.5` y `3.5`.
    *   **PrevenciÃ³n de Alucinaciones (Nuevo):** Se le dio la instrucciÃ³n estricta al OrÃ¡culo de negarse a revelar las riquezas o secretos de *otros* jugadores. Si se le pregunta por alguien ajeno, ahora dirÃ¡ de forma misteriosa que no puede revelar secretos que estÃ¡n bajo la sombra, evitando que la IA invente nÃºmeros falsos para compensar la falta de contexto en memoria.
    *   **Transferencia de Oro (`!oro`):** Se modificÃ³ el comando `!oro` en `player.js`. Ahora, si se usa sin parÃ¡metros, muestra el saldo actual. Si se usa como `!oro <monto> <@usuario>`, permite a los jugadores enviarse oro entre sÃ­, descontando de la cuenta del emisor y sumando a la del receptor (con validaciÃ³n de fondos y protecciÃ³n de auto-envÃ­o).
*   **Archivos Modificados:** `Kingdoom-bot/src/supabase.js`, `Kingdoom-bot/src/handlers/games.js`, `Kingdoom-bot/src/handlers/admin.js`, `Kingdoom-bot/src/index.js`
*   **Resumen:** Arquitectura RAG e integraciÃ³n de Base de Conocimiento entre Kingdoom-sync (Archivista) y Kingdoom-bot.
*   **Cambios Clave:**
    *   `supabase.js`: Se aÃ±adieron funciones `getKnowledgeDocuments` y `pickKnowledgeContext` para consultar la tabla `knowledge_documents`.
    *   `!oraculo` (`games.js`): Ahora inyecta dinÃ¡micamente hasta 2 documentos relevantes de la base de datos de conocimiento como contexto al prompt de Gemini, compartiendo la misma memoria del Archivista web.
    *   `!data` (`admin.js` y `index.js`): Se aÃ±adiÃ³ este comando exclusivo de admin para WhatsApp. Permite adjuntar un archivo `.txt` y cargarlo a la tabla Supabase, sincronizando la memoria directamente desde WhatsApp hacia la web.

### [Fecha: 22/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/features/businesses/businesses.service.ts`
*   **Resumen:** ImplementaciÃ³n de la funcionalidad de borrado de negocios y propuestas de negocios desde el panel de control administrativo.
*   **Cambios Clave:**
    *   **[Backend] EliminaciÃ³n de registros:** Se aÃ±adieron las funciones `deleteBusiness` y `deleteBusinessProposal` a los servicios de negocios para ejecutar los borrados con su respectivo manejo de estado.
    *   **[Admin] BotÃ³n Borrar Negocio Activo:** Los administradores ahora pueden borrar negocios permanentemente pulsando el Ã­cono de la papelera junto al estado del almacenamiento en la tarjeta del negocio, con un diÃ¡logo de confirmaciÃ³n previo.
    *   **[Admin] BotÃ³n Borrar Propuesta:** Se agregÃ³ un botÃ³n rojo de "Borrar" en el formulario de creaciÃ³n/ediciÃ³n de propuestas, posibilitando la eliminaciÃ³n de propuestas mal formuladas o expiradas, igualmente protegido por confirmaciÃ³n.
*   **Notas/Advertencias:** Estas acciones no se pueden deshacer y el oro no reclamado en negocios activos se perderÃ¡ si son eliminados.

### [Fecha: 22/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`
*   **Resumen:** OptimizaciÃ³n de la interfaz de "Tus negocios" para ahorrar espacio y mejorar la experiencia de usuario.
*   **Cambios Clave:**
    *   **[UI] Filtrado AutomÃ¡tico:** Las propuestas de negocios ahora desaparecen instantÃ¡neamente de la lista "Propuestas pendientes" una vez que son respondidas, mostrando solo aquellas en estado "pending".
    *   **[UI] SecciÃ³n Colapsable:** Se aÃ±adiÃ³ un botÃ³n "Mostrar / Ocultar" en la cabecera. Por defecto, todo el bloque interno de "Negocios activos" y "Propuestas" aparece colapsado, limpiando visualmente el perfil del jugador.
*   **Notas/Advertencias:** Estos cambios operan exclusivamente a nivel de presentaciÃ³n en la SPA; la lÃ³gica de red y base de datos (RPC) permanece intacta.

### [Fecha: 22/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/supabaseClient.ts`, `src/utils/players.ts`, `src/context/PlayerSessionContext.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `src/utils/supabaseErrors.ts`, `supabase_secure_admin_links.sql`
*   **Resumen:** Correccion estructural del acceso admin protegido por RLS para soportar sesiones seguras de Supabase y multiples perfiles ligados al mismo navegador.
*   **Cambios Clave:**
    *   **[CRITICO] Sesion segura persistente en frontend:** `supabaseClient` ahora persiste la sesion de Supabase y `PlayerSessionContext` inicia una sesion segura anonima cuando el navegador aun no tenia `auth.uid()`.
    *   **[CRITICO] Nuevo modelo de enlaces multiples:** Se agrego `supabase_secure_admin_links.sql` con la tabla `player_auth_links`, backfill desde `players.auth_user_id` y una nueva version de `public.is_current_user_admin()` compatible con perfiles multiples por persona.
    *   **[MEJORA] Vinculacion manual desde la UI:** El perfil del jugador y el panel admin ahora muestran el estado de `Cuenta segura` y permiten enlazar el perfil actual a la sesion segura del navegador con un boton visible.
    *   **[MEJORA] Compatibilidad futura para admins nuevos:** `linkPlayerToAuthUser` y `isPlayerLinkedToAuthUser` ya no dependen de una sola columna en `players`, evitando que casos como `Nothing` + `Alexander` queden bloqueados por un unico `auth_user_id`.
    *   **[MEJORA] Error de permisos mas claro:** Los errores de RLS ahora indican que falta vincular la sesion segura de Supabase, en vez de sugerir solo que falta un admin.
*   **Notas/Advertencias:** Para activar el arreglo completo hay que ejecutar `supabase_secure_admin_links.sql` en Supabase y tener habilitado el proveedor de acceso anonimo de Supabase Auth.
*   **Aclaracion operativa:** Si el boton `Vincular cuenta segura` muestra que no pudo iniciar la sesion segura, la causa mas probable es que `Anonymous sign-ins` siga desactivado en `Supabase Auth > Providers`.

### [Fecha: 22/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/businesses/businesses.service.ts`, `supabase_player_businesses.sql`
*   **Resumen:** Ajuste de diagnostico para RPC de negocios y recarga explicita del schema de PostgREST tras crear las funciones.
*   **Cambios Clave:**
    *   **[FIX] Deteccion precisa de RPC faltante:** El frontend de negocios ya no colapsa cualquier error que mencione la funcion en el mismo mensaje generico. Ahora distingue mejor entre RPC no visible en schema cache y errores reales de ejecucion.
    *   **[FIX] Recarga del schema de Supabase:** Se agrego `notify pgrst, 'reload schema';` al final de `supabase_player_businesses.sql` para forzar que PostgREST vea `respond_business_proposal` y `collect_business_gold` inmediatamente despues de la migracion.
*   **Notas/Advertencias:** Si ya habias ejecutado el SQL antes de este ajuste, corre solo `NOTIFY pgrst, 'reload schema';` en el SQL Editor y luego recarga la pagina.

### [Fecha: 21/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/components/AdminControlSheet.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/utils/businesses.ts`, `src/features/businesses/businesses.adapter.ts`, `src/features/businesses/businesses.service.ts`, `src/features/businesses/businesses.types.ts`, `src/features/businesses/index.ts`, `supabase_player_businesses.sql`
*   **Resumen:** Primera version del sistema de negocios del reino con propuestas del staff, aceptacion o rechazo por parte del jugador, produccion pasiva de oro y recoleccion segura.
*   **Cambios Clave:**
    *   **[NUEVO] Capa modular de negocios:** Se creo `src/features/businesses/` siguiendo el patron del mercado para centralizar tipos, adaptadores, servicios y calculo en tiempo real del oro acumulado.
    *   **[NUEVO] Pestania `Negocios` en admin:** El staff ahora puede cargar una propuesta formal con nombre, icono, descripcion, tipo, produccion por hora, tope maximo, rango interno del staff, costo base proporcional y cargo extra manual.
    *   **[NUEVO] Costo mixto personalizable:** El modelo separa `base_cost`, `staff_fee` y `opening_cost`, permitiendo que el precio final del negocio sea una mezcla entre costo proporcional y ajuste manual del staff.
    *   **[NUEVO] Apartado exclusivo en el perfil del jugador:** `PlayerProfilePanel` muestra negocios solo si el jugador tiene propuestas o negocios activos, con botones de aceptar, rechazar y recolectar.
    *   **[NUEVO] Produccion pasiva con tope:** Los negocios generan oro en tiempo real usando `gold_per_hour` y `max_storage`. Cuando se llenan, se detienen hasta que el jugador recolecta.
    *   **[CRITICO] RPC segura de economia:** Se agrego `supabase_player_businesses.sql` con las tablas `business_proposals`, `businesses`, `business_collection_log` y las RPC `respond_business_proposal` y `collect_business_gold` para evitar dobles cobros o dobles recolecciones.
    *   **[NUEVO] Historial de recoleccion:** El perfil del jugador ya puede mostrar un historial corto de oro retirado del negocio.

### [Fecha: 20/05/2026] - [Autor: Antigravity] - [SesiÃ³n 3 - AuditorÃ­a de Comandos]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`
*   **Resumen:** AuditorÃ­a estÃ¡tica de todos los handlers del bot y correcciÃ³n de permisos/comandos de administraciÃ³n.
*   **Cambios Clave:**
    *   **[SOPORTE] Comando `!pendiente` singular:** Se mapeÃ³ `!pendiente` en el router principal (`index.js`) y en `admin.js` para que los administradores y dueÃ±os puedan usar tanto el formato singular como el plural (`!pendientes`). Anteriormente, usar el singular hacÃ­a que la peticiÃ³n fuera procesada por la IA al no estar en la lista blanca de comandos de administrador en `index.js`.
    *   **[SOPORTE] Acceso a `!censo` y `!pendientes` para Administradores:** Se validÃ³ y asegurÃ³ que los usuarios que posean privilegios de administrador (ademÃ¡s del Owner) puedan ejecutar `!censo` y `!pendientes` sin restricciones de permisos.
    *   **[CRÃTICO] Fix `!dados` â sender incorrecto en grupos (`games.js`):** El comando `!dados` usaba `msg.from` para buscar al jugador en Supabase. En grupos de WhatsApp, `msg.from` devuelve el JID del **grupo** (ej: `12345@g.us`), no el del jugador. Esto hacÃ­a que el bot nunca encontrara al jugador y siempre respondiera "No estÃ¡s registrado". Corregido usando `msg.author || msg.from`, el patrÃ³n estÃ¡ndar del resto de los handlers.
    *   **[MEDIO] Fix `!ban` â falso positivo (`admin.js`):** Cuando un admin ejecutaba `!ban` con un nÃºmero no registrado en la DB, Supabase actualizaba 0 filas sin lanzar un error, y el bot respondÃ­a "baneado" falsamente. Se agregÃ³ una verificaciÃ³n previa que consulta al jugador y retorna un error claro si no existe. AdemÃ¡s, el mensaje de confirmaciÃ³n ahora muestra el **username** del jugador baneado, no solo el nÃºmero.
    *   **[MEJORA] Comando `!grant` y nuevo `!quitar` (`admin.js`, `index.js`):** Se mejorÃ³ la gestiÃ³n de oro para los administradores. Ahora `!grant` acepta tanto el celular, el **nombre de usuario**, o el **ID de la pÃ¡gina web** (prefijo UUID) del jugador (ej. `!grant Zoelfrost 1000`, `!grant 2354 1000`), facilitando enormemente la administraciÃ³n. AdemÃ¡s, se aÃ±adiÃ³ el comando `!quitar` para restar oro sin necesidad de usar nÃºmeros negativos (ej. `!quitar Zoelfrost 500`). Se actualizÃ³ el menÃº de ayuda (`!admin`) para reflejar estos cambios.
    *   **[MEJORA] OrÃ¡culo y Memoria**
        - **InyecciÃ³n de Inventario Real:** El OrÃ¡culo ahora lee el inventario real del jugador (comprado en el mercado con oro) y lo integra en sus respuestas. Se corrigiÃ³ un error en la consulta a Supabase que causaba fallos silenciosos al buscar la columna `category` (que en realidad es `item_category`), logrando que el bot vuelva a "ver" los Ã­tems correctamente, extrayendo tambiÃ©n el `item_name`. AdemÃ¡s, se agregÃ³ una inyecciÃ³n explÃ­cita para inventarios vacÃ­os, evitando que el OrÃ¡culo "evada" la pregunta con frases mÃ­sticas cuando el jugador no tiene Ã­tems.
        - **Identidad del Jugador (15-digit ID Fix):** Se agregÃ³ un mapeo interno para que el OrÃ¡culo reconozca correctamente el ID de 15 dÃ­gitos (`275162062668001`) del Owner como el perfil principal (`595987273405`), evitando que el sistema lo trate como un "alma sin nombre".
        - **Personalidad Mejorada:** Se rediseÃ±Ã³ el prompt del OrÃ¡culo para que actÃºe como un "vidente veterano y cÃ­nico", hablando de forma mÃ¡s directa, coloquial y menos poÃ©tica. Su longitud se limitÃ³ a 3 pÃ¡rrafos y se instruyÃ³ para negarse a revelar fortunas de terceros.
    *   **[MEJORA] Baneo y gestiÃ³n de Administradores unificada (`admin.js`):** Se implementÃ³ un helper centralizado para que `!ban`, `!add admin`, `!remove admin`, `!grant` y `!quitar` puedan procesar a los jugadores usando su **ID web**, **username** o **celular**. Esto estandariza la experiencia de administraciÃ³n, permitiendo identificar jugadores de mÃºltiples maneras, tal como se hace en el comando de vinculaciÃ³n `!verificar`.
    *   **[ELIMINADO] Comando `!broadcast` removido (`admin.js`, `index.js`):** El comando fue eliminado por decisiÃ³n del Soberano. WhatsApp ya ofrece la funcionalidad nativa de @all / @todos en grupos, lo que hace innecesario un broadcast por DM que ademÃ¡s tenÃ­a problemas de compatibilidad con nÃºmeros no registrados.
    *   **[NUEVO] Comando `!purga` (`admin.js`, `tracker.js`, `index.js`):** Nuevo comando que permite al Staff expulsar del grupo de WhatsApp a los usuarios que llevan mÃ¡s de 5 dÃ­as sin hacer su ficha. El bot mantiene un archivo JSON interno (`pending_tracker.json`) que registra la primera vez que un usuario aparece en `!pendientes`. Al ejecutar `!purga`, el bot verifica quiÃ©nes superaron los 5 dÃ­as y los remueve automÃ¡ticamente. Requiere que el bot sea admin del grupo.
    *   **[MEJORA] `!pendientes` ahora rastrea fechas (`admin.js`, `tracker.js`):** Cada vez que se ejecuta `!pendientes`, el bot registra la fecha de detecciÃ³n de cada usuario pendiente. Esto alimenta al tracker que `!purga` consume para calcular los 5 dÃ­as de gracia.
    *   **[FIX] `!censo` / `!fichas` â columna inexistente (`supabase.js`):** La query de `getRealmCensus()` pedÃ­a `player_id` a la tabla `character_sheets`, pero esa columna no existe en Supabase (solo existe `playerId` en camelCase). Esto hacÃ­a que el comando fallara con "Error al obtener el censo del reino". Corregido removiendo la columna fantasma.
    *   **[BONUS] Formato de oro en `!dados`:** Se aplicÃ³ `.toLocaleString('es-PY')` al mostrar el oro del jugador en el mensaje de saldo insuficiente, siendo consistente con el resto del bot.
### [Fecha: 20/05/2026] - [Autor: Antigravity] - [SesiÃ³n 3 - Fix OrÃ¡culo Cuota y MigraciÃ³n a Gemini 2.5]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`
*   **Cambios Clave:**
    *   **[CRÃTICO] Fallback de modelo en `!oraculo` (`ai.js`):** Se identificÃ³ que todos los modelos Gemini 1.0 y 1.5 (incluyendo `gemini-1.5-flash`) fueron desactivados por Google, arrojando error `404 Not Found`. Se migrÃ³ el modelo por defecto del bot de `gemini-1.5-flash` a **`gemini-2.5-flash`**.
    *   **[CRÃTICO] Soporte para mÃºltiples claves API con rotaciÃ³n automÃ¡tica (`ai.js`):** El usuario configurÃ³ dos llaves API separadas por comas en `GEMINI_API_KEY`. Se rediseÃ±Ã³ el manejador para procesar una lista de llaves de manera dinÃ¡mica. Al invocar el OrÃ¡culo, intenta secuencialmente con cada clave. Si una falla (por ejemplo, por lÃ­mite de cuota o error 429), realiza un log detallado y reintenta con la siguiente clave transparente y automÃ¡ticamente.
    *   **[MEJORA] Cadena de Fallback de Modelos en caso de 404/503 (`ai.js`):** Se implementÃ³ una lÃ³gica de fallback de modelos en bucle. Si el modelo actual (ej: `gemini-2.5-flash`) devuelve `404 Not Found` o un error temporal de sobrecarga `503 Service Unavailable`, el bot no descartarÃ¡ la clave de inmediato; en su lugar, intentarÃ¡ automÃ¡ticamente con otros modelos candidatos como **`gemini-3.5-flash`** para asegurar respuestas exitosas durante picos de demanda del servidor de Google.



### [Fecha: 20/05/2026] - [Autor: Antigravity] - [SesiÃ³n 3 - AuditorÃ­a Scheduler]
*   **Archivos Modificados:** `kingdoom-bot/src/scheduler.js`
*   **Cambios Clave:**
    *   **[CRÃTICO] Fix reset semanal `weekly_gold` (`scheduler.js`):** La operaciÃ³n `supabase.from('players').update({ weekly_gold: 0 })` sin ningÃºn filtro es **bloqueada por defecto** por Supabase JS v2 como medida de seguridad contra actualizaciones masivas accidentales. Esto hacÃ­a que el ranking semanal se anunciara correctamente cada lunes pero el oro semanal nunca se reseteara, acumulÃ¡ndose indefinidamente. Se corrigiÃ³ agregando `.gte('weekly_gold', 0)` como filtro de seguridad que coincide con todos los jugadores (el oro nunca es negativo por diseÃ±o).

### [Fecha: 20/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/welcome.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `kingdoom-bot/README.md`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/handlers/player.js`
*   **Resumen de Tareas:** CorrecciÃ³n del sistema de bienvenida, comando `!groupid`, fix del mercado, correcciÃ³n de textos truncados, fix de imports en consultas detalladas y migraciÃ³n del bot a Hugging Face Spaces (16 GB RAM gratis).
*   **Cambios Clave:**
    *   **MigraciÃ³n a Hugging Face Spaces:** Se trasladÃ³ el bot desde Railway (con crÃ©ditos agotados) a Hugging Face Spaces basado en Docker, obteniendo **16 GB de RAM y 2 vCPU** de forma completamente gratuita, eliminando crasheos de memoria por Puppeteer/Chromium.
    *   **ResoluciÃ³n de puertos (7860) y metadatos:** Se agregÃ³ `ENV PORT=7860` en el `Dockerfile` y se creÃ³ el `README.md` con la cabecera YAML requerida por Hugging Face. Esto solucionÃ³ la pantalla infinita de "Preparing Space" permitiendo la comunicaciÃ³n correcta con la interfaz web.
    *   **Fix de permisos no-root:** Se crearon los directorios del bot y se asignÃ³ `chmod -R 777` en el Dockerfile para que el usuario de Hugging Face (`1000`) pueda escribir los datos de autenticaciÃ³n de WhatsApp en la carpeta temporal de persistencia.
    *   **Fix del comando !mercado (columna 'available' inexistente):** Se detectÃ³ que las consultas a la tabla `market_items` en `supabase.js` filtraban usando `.eq('available', true)`. Dado que la columna `available` no existe en la base de datos de Kingdoom (el stock se gestiona en su lugar con `stock_status`), la API de Supabase devolvÃ­a un error de columna inexistente, causando que el bot reportara falsamente que el mercado estaba vacÃ­o. Se corrigiÃ³ removiendo este filtro y adaptando `getRealmSnapshot` para excluir items con `stock_status = 'sold-out'`.
    *   **Fix de importaciÃ³n de getMissionDetails y getEventDetails:** Los comandos de detalle de misiones (`!mision <nombre>`) y eventos (`!evento <nombre>`) fallaban silenciosamente lanzando el error de sistema `"El reino estÃ¡ en llamas..."`. Se detectÃ³ que las funciones `getMissionDetails` y `getEventDetails` no estaban importadas al inicio de `player.js` desde `../supabase.js` a pesar de estar declaradas e implementadas. Se agregaron a los imports del archivo para solucionar el fallo de referencia.
    *   **AmpliaciÃ³n del lÃ­mite de texto en comandos (!item, !mision, !evento):** Las descripciones y habilidades se recortaban excesivamente en WhatsApp (`clipText` recortaba a 110, 130 o 140 caracteres, dejando textos incompletos con suspensivos). Se ampliÃ³ el lÃ­mite en los comandos de detalle a **500 caracteres**, permitiendo la lectura de habilidades legendarias completas y descripciones extendidas sin spam descontrolado.
    *   **Fix de filtro de grupo en bienvenida:** Ahora la bienvenida se dispara en cualquier grupo si no hay filtro configurado en las variables de entorno, evitando retornos silenciosos.
    *   **Log de diagnÃ³stico:** Se aÃ±ade `console.log` para `group_join` detallando los IDs de grupos.
    *   **Comando !groupid:** Se creÃ³ el comando `!groupid` para administradores que devuelve el JID Ãºnico del grupo (`@g.us`) donde se ejecuta para poder configurar las variables del bot de bienvenida.
*   **Notas/Advertencias:** El bot estÃ¡ completamente enlazado, conectado y activo de forma gratuita en su nueva infraestructura de Hugging Face Spaces.



### [Fecha: 19/05/2026] - [Autor: Antigravity] - [SesiÃ³n 2]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/components/PlayerProfilePanel.tsx`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ImplementaciÃ³n del sistema de vinculaciÃ³n segura (`!verificar`) entre perfiles web y WhatsApp y visualizaciÃ³n en el Panel de Perfil de la web.
*   **Cambios Clave:**
    *   **Comando de VinculaciÃ³n !verificar:** Se creÃ³ la funciÃ³n `verifyAndLinkPlayer` en el backend del bot (`kingdoom-bot/src/supabase.js`) que permite a cualquier usuario vincular su nÃºmero de WhatsApp con su cuenta web medieval existente ingresando su nombre de usuario (sin distinguir mayÃºsculas/minÃºsculas) o el segmento inicial de su ID UUID (ej. `!verificar Zoelfrost` o `!verificar 2354`).
    *   **Bypass de Jugador no Registrado:** Se ubicÃ³ el manejador de `!verificar` en `kingdoom-bot/src/handlers/player.js` arriba del control de seguridad de usuario no registrado, permitiendo que nuevos contactos puedan vincularse de manera fluida sin ser rechazados como viajero desconocido.
    *   **VisualizaciÃ³n de ID en la Web:** Se actualizÃ³ `src/components/PlayerProfilePanel.tsx` tanto en la vista colapsada como expandida para mostrar el ID corto (los primeros 8 caracteres del UUID) de manera clara y estÃ©tica.
    *   **Instrucciones de VinculaciÃ³n en UI:** En caso de que la cuenta web no tenga ningÃºn WhatsApp vinculado (`player.phone` es null), el Panel de Perfil muestra una tarjeta dorada estilizada con instrucciones precisas y el comando exacto para copiar y enviar al bot: `!verificar <id_corto>`.
    *   **ActualizaciÃ³n de Modelos y Consultas:** Se incluyÃ³ la columna `phone` en todas las consultas y payloads de creaciÃ³n de jugadores de `src/utils/players.ts` para que el estado de vinculaciÃ³n se sincronice en tiempo real con la UI de la SPA.
    *   **HabilitaciÃ³n del Comando en Ruteador:** Se registrÃ³ `'verificar'` en la lista blanca de comandos del ruteador principal `kingdoom-bot/src/index.js` para asegurar el procesamiento correcto de su prefijo.
    *   **Soporte de Citado para !add/!remove admin:** Se corrigiÃ³ una discrepancia UX donde los comandos `!add admin` y `!remove admin` requerÃ­an especificar manualmente el nÃºmero. Ahora soportan plenamente citar (responder a) un mensaje para extraer automÃ¡ticamente el nÃºmero del remitente del mensaje citado (OpciÃ³n A).
    *   **PreservaciÃ³n de Prototipo de Mensaje:** Se solventÃ³ un error crÃ­tico de `TypeError: msg.getQuotedMessage is not a function` que provocaba que el bot crasheara con "El reino estÃ¡ en llamas..." al usar citados en comandos modificados. La causa era que la destructuraciÃ³n `{ ...msg }` eliminaba los mÃ©todos de la clase `Message` de `whatsapp-web.js`. Se solucionÃ³ implementando un envoltorio limpio basado en `Object.create(originalMsg)` que preserva la cadena de prototipos intacta.
    *   **Administradores Persistentes en Supabase:** Se detectÃ³ que el almacenamiento local `admins.json` dentro del contenedor de Railway se perdÃ­a al redesplegar la aplicaciÃ³n. Para solucionar esto de forma definitiva, se habilitÃ³ el chequeo hÃ­brido: el bot ahora valida los privilegios de administrador consultando la columna `is_admin` en la tabla `players` de Supabase de manera asÃ­ncrona. Los comandos `!add admin` y `!remove admin` ahora actualizan automÃ¡ticamente la base de datos en tiempo real para garantizar persistencia absoluta.
    *   **CorrecciÃ³n de ID en Citados de Grupo:** Se solucionÃ³ un bug crÃ­tico donde responder a un mensaje de grupo con `!add admin` o `!registrar` extraÃ­a errÃ³neamente el JID del chat del grupo (`xxxx@g.us`) a travÃ©s de `quoted.from`, registrando o agregando el ID de grupo completo (`5959823815251611282780`) en lugar del nÃºmero del jugador. Se corrigiÃ³ cambiando el objetivo para priorizar `quoted.author` (el emisor real del mensaje dentro del grupo) con fallback a `quoted.from` (en chats directos).
    *   **Mejora de UX en !registrar AutÃ³nomo:** Se optimizÃ³ el flujo de error cuando un administrador ejecuta el comando `!registrar` de forma standalone (sin citar a un usuario y con argumentos incompletos). Ahora el bot detecta que no se especificaron los parÃ¡metros mÃ­nimos y responde con un mensaje guiado e instructivo que explica detalladamente el formato correcto para ambas opciones (OpciÃ³n A: Respondiendo, OpciÃ³n B: Directo/Manual).
    *   **Censo General de Fichas y Vinculaciones (!censo / !fichas):** Se implementÃ³ una funciÃ³n integrada `getRealmCensus` en `kingdoom-bot/src/supabase.js` que realiza una consulta unificada de todos los jugadores y sus respectivas fichas de personajes (`character_sheets`). Se expuso el comando exclusivo para administradores `!censo` / `!fichas` en `kingdoom-bot/src/handlers/admin.js`, el cual genera un hermoso y estructurado reporte que detalla: total de aventureros, porcentaje de vinculaciÃ³n a WhatsApp, nÃºmero de PJs por usuario, los nombres de cada uno de sus PJs (PJ 1, PJ 2) y, para aquellos pendientes sin ficha completada, calcula automÃ¡ticamente el tiempo transcurrido en dÃ­as desde su registro original con una alerta de advertencia.
    *   **Consistencia y Citados en !grant y !ban:** Se habilitÃ³ el soporte para citar/responder mensajes de WhatsApp en los comandos de administraciÃ³n `!grant` y `!ban`. Esto permite otorgar oro (ej. `!grant 500` respondiendo al jugador) o banear (ej. `!ban` respondiendo al jugador) directamente sin requerir escribir sus nÃºmeros de telÃ©fono a mano.
*   **Notas/Advertencias:** Todas las modificaciones son 100% compatibles con la base de datos Supabase existente y la lÃ³gica del bot. El compilador TypeScript pasÃ³ con Ã©xito (`Exit code: 0`).

### [Fecha: 19/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `kingdoom-bot/src/handlers/player.js` (en repo secundario)
*   **Resumen de Tareas:** MigraciÃ³n completa de Kingdoom Bot a Railway y soporte de visualizaciÃ³n de QR en alta definiciÃ³n para WhatsApp Web.
*   **Cambios Clave:**
    *   **MigraciÃ³n a Railway:** Se adaptÃ³ la configuraciÃ³n del bot para desplegarse de manera robusta en Railway.app, superando las limitaciones de RAM (512MB) y disco volÃ¡til del plan gratuito de Render.
    *   **Docker & Volumen Persistente:** Se removiÃ³ la directiva `VOLUME` en el `Dockerfile` (no soportada nativamente por Railway) y se configurÃ³ la persistencia de la sesiÃ³n mediante un disco montado en `/app/.wwebjs_auth` desde la interfaz de Railway.
    *   **Servidor Web QR en HD:** Se implementÃ³ una pÃ¡gina interactiva en `PORT = 8080` (en `src/index.js`) que sirve el cÃ³digo QR generado como imagen PNG en alta definiciÃ³n, facilitando su escaneo e indicando el estado `â Bot Conectado` una vez autenticado.
    *   **RemociÃ³n del comando !daily:** Se removiÃ³ por completo la funcionalidad de reclamo de recompensas diarias (`!daily`), limpiando sus imports, su lÃ³gica interna de base de datos, la funciÃ³n de selecciÃ³n de premios, su menciÃ³n en el comando `!ayuda` y su registro en la lista de comandos procesados de `index.js`.
    *   **Privilegios de Owner y Administradores:** Se aÃ±adiÃ³ un sistema robusto de permisos gestionado en `src/adminStore.js` con persistencia en el volumen de Railway (`/app/.wwebjs_auth/admins.json`). El nÃºmero `595987273405` se definiÃ³ como **Soberano (Owner)** del bot, teniendo acceso exclusivo a comandos para conceder (`!add admin <numero>`) o revocar (`!remove admin <numero>`) roles de administrador.
    *   **RestricciÃ³n y Mejoras de !registrar:** El comando `!registrar` ahora estÃ¡ restringido Ãºnicamente a los administradores y al owner. Otorga **2500 de oro inicial** por defecto, y permite especificar un monto a la derecha (ej. `!registrar pepe 200000`, soportando separadores de miles). AdemÃ¡s, se aÃ±adiÃ³ soporte UX premium: si se ejecuta respondiendo a un mensaje de WhatsApp, extrae automÃ¡ticamente el nÃºmero del remitente del mensaje citado.
    *   **Mensaje de Bienvenida Premium en Dos Partes:** Se actualizÃ³ `src/handlers/welcome.js` para enviar dos mensajes secuenciales e interactivos con un intervalo de 1.5s al detectar nuevos miembros en el grupo de WhatsApp. El primer mensaje incluye una caja medieval de bienvenida para `ð ð ð ð ð ð ð ð` y un link directo a su canal de informaciÃ³n para crear el primer personaje, mientras que el segundo lista oficialmente a los "Guardianes del Reino" (`Nothing`, `Zoelfrost`, `Ord`, `E.xe`). Incorpora menciones automÃ¡ticas en alta prioridad a los miembros reciÃ©n unidos.
    *   **ResoluciÃ³n de Discrepancias de JID en Paraguay:** Se identificÃ³ que WhatsApp a nivel de servidor aÃ±ade o remueve un dÃ­gito `9` despuÃ©s del cÃ³digo de paÃ­s paraguayo (`595`), resultando en discrepancias de formato JID (ej. `5959987273405@c.us` vs `595987273405@c.us`). Se actualizÃ³ `src/adminStore.js` para admitir y homologar automÃ¡ticamente ambos formatos, permitiendo que seas reconocido como Soberano (Owner) de inmediato.
    *   **IdentificaciÃ³n de Remitentes en Grupos de WhatsApp:** Se corrigiÃ³ el error de mapeo donde el bot extraÃ­a el emisor usando `msg.from` (que en grupos devuelve el ID del grupo en lugar del nÃºmero del remitente). Ahora el bot extrae al emisor real de forma infalible con `msg.author || msg.from`, permitiendo a los administradores ejecutar comandos desde grupos.
    *   **Filtrado Silencioso de Mensajes No Registrados:** Para evitar spam masivo de `Viajero desconocido...` ante palabras cotidianas en grupos y PV, se configurÃ³ el bot para ignorar de manera silenciosa cualquier mensaje de usuario no registrado que carezca del prefijo de comando `!`.
    *   **CorrecciÃ³n de ReferenceError en el Handler de Jugadores:** Al refactorizar la identificaciÃ³n de emisores se removiÃ³ accidentalmente la declaraciÃ³n local de `chatId` en `src/handlers/player.js` que el historial de chat con Inteligencia Artificial requerÃ­a. Se reincorporÃ³ `const chatId = msg.from;` restableciendo la persistencia correcta y solventando el crash que arrojaba `âï¸ El reino esta en llamas...`.
    *   **MenÃº DinÃ¡mico e Inteligente para !ayuda:** Se reprogramÃ³ el comando `!ayuda` en `src/handlers/player.js` para detectar en tiempo real si el remitente del mensaje es el Soberano (Owner) o un Administrador del Reino, anexando de manera dinÃ¡mica sus comandos exclusivos (como `!registrar`, `!grant`, `!stats`, `!broadcast`, `!admin`, etc.) al menÃº tradicional de juego de WhatsApp.
    *   **Fortalecimiento en NormalizaciÃ³n de TelÃ©fonos:** Se securizÃ³ `normalizePhone` en `src/supabase.js` convirtiendo el argumento de entrada a String y aplicando valores por defecto seguros para prevenir TypeErrors inesperados si el JID o nÃºmero remitente no estÃ¡ definido.
    *   **RestricciÃ³n Estricta de Respuestas a Prefijo (!):** Para evitar que el bot responda con el Heraldo AI a conversaciones cotidianas de cualquier usuario (incluidos dueÃ±os y administradores), se configurÃ³ una regla estricta al inicio del manejador de mensajes de WhatsApp. Si el mensaje no inicia con el prefijo `!`, se ignora de manera inmediata y silenciosa (`if (!hasPrefix) return;`).
    *   **IdentificaciÃ³n DinÃ¡mica de DueÃ±o por Env y JID de AcompaÃ±ante:** Se adaptÃ³ `isOwner` en `src/adminStore.js` para validar dinÃ¡micamente si el nÃºmero del emisor coincide con la variable de entorno `OWNER_NUMBER` o `ADMIN_NUMBER` definida en Railway, e incorporÃ³ soporte directo nativo para el identificador de dispositivo acompaÃ±ante `275162062668001` como Soberano (Owner).
    *   **NormalizaciÃ³n Unificada de TelÃ©fonos Internacionales:** Se unificÃ³ la lÃ³gica de `normalizePhone` importÃ¡ndose desde `adminStore.js` a `supabase.js`. Ahora formatea de forma consistente nÃºmeros de Paraguay (removiendo el 9 adicional si tiene 13 dÃ­gitos), MÃ©xico (canonicalizando a `521` si tiene 12 dÃ­gitos) y Argentina (canonicalizando a `549` y eliminando el `15` si estÃ¡ presente). Esto previene inconsistencias entre los datos guardados en la BD y las llamadas de eventos en WhatsApp.
    *   **Bypass de !ayuda para Nuevos Admins/Usuarios No Registrados:** Se modificÃ³ `handlePlayerMessage` en `src/handlers/player.js` para procesar el comando `!ayuda` antes de comprobar si el jugador existe en la BD. Esto permite a los administradores reciÃ©n aÃ±adidos u dueÃ±os ver el menÃº, identificar sus roles y diagnosticar su telÃ©fono con una nota explicativa sobre cÃ³mo registrarse, en lugar de recibir el mensaje de "Viajero desconocido".
    *   **Registro de Handoff:** Se registrÃ³ formalmente el estado y las instrucciones del bot en la memoria compartida (`kingdoom-memory` MCP) para sincronizar el trabajo con Codex.
*   **Notas/Advertencias:** El bot estÃ¡ activo y online. Solo requiere escanear el QR generado en su dominio pÃºblico de Railway. El cambio de la remociÃ³n del !daily, la reestructuraciÃ³n de permisos/registro, la bienvenida en dos partes, la correcciÃ³n de JIDs/mensajerÃ­a grupal, el menÃº dinÃ¡mico de ayuda, la restricciÃ³n estricta de prefijos, el diagnÃ³stico de identidad, el JID especÃ­fico del dueÃ±o, la normalizaciÃ³n unificada de telÃ©fonos internacionales y el bypass de ayuda fue committeado y pusheado de inmediato para gatillar el despliegue automÃ¡tico en Railway.

### [Fecha: 18/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `api/admin/ask-archivist.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aÃ±adiÃ³ la capacidad de dar oro a mÃºltiples jugadores simultÃ¡neamente ("add_multiple_players_gold").
*   **Cambios Clave:**
    *   **AcciÃ³n de lista:** Se implementÃ³ `add_multiple_players_gold` para procesar una lista de nombres de usuario.
    *   **BÃºsqueda flexible:** El motor busca a los jugadores indicados ignorando mayÃºsculas/minÃºsculas y buscando coincidencias parciales, igual que en la bÃºsqueda individual.
    *   **Prompts:** Se actualizÃ³ el prompt de IA para utilizar un payload de la forma `{"usernames": ["User A", "User B"], "amount": X}` cuando se le piden varios nombres.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 18/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `api/admin/ask-archivist.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aÃ±adiÃ³ la capacidad de dar oro a todos los jugadores ("add_all_players_gold") desde el Archivista.
*   **Cambios Clave:**
    *   **AcciÃ³n global:** Se implementÃ³ `add_all_players_gold` en el motor de acciones del Archivista, permitiendo actualizar a todos los jugadores del contexto en una sola solicitud.
    *   **Prompts:** Se actualizÃ³ el prompt de IA para reconocer comandos globales y emitir un payload simple de `{ "amount": X }` sin requerir nombre de usuario.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/archivist/archivistLive.ts`, `src/components/ArchivistSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de respuestas del Archivista sobre ranking de oro.
*   **Cambios Clave:**
    *   **Oro visible para staff:** El contexto vivo del Archivista ahora incluye el ranking de oro actual con cantidades.
    *   **Tarjetas relevantes:** Las preguntas de staff sobre jugadores/oro priorizan tarjetas de jugadores y evitan recomendaciones de mercado fuera de contexto.
*   **Notas/Advertencias:** Solo se exponen estos datos cuando el Archivista corre en modo admin.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `src/utils/archivistAi.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del flujo de borradores pendientes del Archivista.
*   **Cambios Clave:**
    *   **Sin carga infinita:** El cliente del Archivista ahora corta consultas demoradas y devuelve el estado de carga aunque el endpoint falle.
    *   **Borrador conversacional:** Si hay una accion pendiente y el staff pregunta por habilidad, detalles o efectos, el chat responde sobre el mismo borrador sin bloquearse.
    *   **Items mas completos:** El prompt del Archivista exige que los items de mercado tengan una habilidad jugable y balanceada, no solo descripcion visual.
*   **Notas/Advertencias:** Se preservo el cambio previo de Antigravity en el placeholder del Archivista.

### [Fecha: 13/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistLive.ts`, `src/components/ArchivistSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** FinalizaciÃ³n del fix para el ranking de oro del Archivista y refuerzo semÃ¡ntico.
*   **Cambios Clave:**
    *   **Contexto Admin:** Se verificÃ³ la inclusiÃ³n de `richestPlayers` en el resumen runtime para staff.
    *   **Refuerzo SemÃ¡ntico:** Se eliminÃ³ `oro` de `CARD_STOPWORDS` y se duplicÃ³ el `categoryBoost` para asegurar que las tarjetas de jugadores tengan prioridad absoluta en consultas econÃ³micas.
    *   **DetecciÃ³n de IntenciÃ³n:** Se flexibilizÃ³ `isPlayerGoldQuestion` para detectar "ranking", "ricos" y "riqueza" sin necesidad de mencionar explÃ­citamente "jugador".
*   **Notas/Advertencias:** Validado con `npm run build`. El sistema ahora diferencia correctamente entre "comprar oro" (mercado) y "Â¿quiÃ©n tiene mÃ¡s oro?" (jugadores).



### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AGENTS.md`, `RTK.md`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Instalacion y configuracion local de RTK y reglas agenticas para Kingdoom.
*   **Cambios Clave:**
    *   **RTK activo:** Se agrego `RTK.md` y referencia local para usar `rtk` como proxy compacto de comandos.
    *   **AGENTS.md adaptado:** Se incorporaron reglas utiles de `agents-md` sobre disciplina de contexto, comandos acotados y validacion proporcional.
    *   **Compatibilidad Kingdoom:** Las reglas nuevas quedan subordinadas al protocolo del proyecto, incluyendo validacion obligatoria para cambios funcionales/UI.
*   **Notas/Advertencias:** RTK fue instalado como herramienta local de usuario en `C:\Users\e_grado\.local\bin`; no se agregaron dependencias npm.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceOnline.ts`, `supabase_horse_race_online.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de seleccion inicial en salas online de Carreras del Reino.
*   **Cambios Clave:**
    *   **Sin salas finalizadas por defecto:** El listado online ahora ignora carreras `finished` para evitar mostrar una foto finish vieja al entrar por primera vez.
    *   **Seleccion estricta:** La UI ya no usa la primera sala como fallback si no hay una sala activa seleccionada.
    *   **Nueva sala limpia:** Al crear una sala se limpian referencias internas de auto-inicio y liquidacion para evitar arrastre de estado anterior.
*   **Notas/Advertencias:** Tambien queda incluido el `DROP FUNCTION` de `settle_public_horse_race(uuid, uuid)` para que el SQL completo pueda re-ejecutarse sin el error de renombrado de parametros.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `src/utils/horseRaceOnline.ts`, `supabase_horse_race_online.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de animacion online y autonomia de salas para Carreras del Reino.
*   **Cambios Clave:**
    *   **Canvas online blindado:** Se corrigio el reloj de carrera para evitar frames invalidos cuando `started_at` llega con desfase o formato no interpretable por el navegador.
    *   **Salas publicas:** Cualquier jugador conectado puede crear una sala online y elegir cupo de 2 a 6 apostadores.
    *   **Auto-inicio:** La carrera online se inicia automaticamente cuando se completa el cupo, siempre con minimo 2 apuestas.
    *   **Liquidacion segura:** Los pagos online quedan idempotentes por RPC y pueden cerrarse sin depender de que un admin pulse el boton.
*   **Notas/Advertencias:** Hay que volver a ejecutar `supabase_horse_race_online.sql` para agregar `target_bets`, la funcion de auto-inicio y la nueva firma de creacion de salas.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceOnline.ts`, `supabase_horse_race_online.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Fases 3, 4 y 5 de Carreras del Reino: salas online, control admin y pulido premium.
*   **Cambios Clave:**
    *   **Salas online:** Se agrego modo `Sala online` con lectura de sesiones, apuestas compartidas y Realtime para sincronizar cambios entre usuarios.
    *   **Economia segura:** Las apuestas online pasan por RPC de Supabase, descuentan oro al apostar y liquidan premios una sola vez desde control admin.
    *   **Panel admin:** Los administradores pueden crear sala publica, cerrar apuestas, iniciar la carrera y liquidar pagos desde el mismo panel compacto.
    *   **Pulido visual:** Se agregaron indicadores de estado, pozo, apostadores, ganador, mensajes de sala y fallback claro si falta ejecutar el SQL.
*   **Notas/Advertencias:** Para activar la fase online en produccion hay que ejecutar `supabase_horse_race_online.sql` en Supabase. El modo offline queda operativo como respaldo.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion critica y fase 3 visual de Carreras del Reino.
*   **Cambios Clave:**
    *   **Ganador inmutable:** El motor ahora conserva como ganador al primer caballo que cruza la meta, incluso si otros quedan mas adelantados en frames posteriores.
    *   **Desempate por cruce real:** Si dos caballos cruzan en el mismo tick, se calcula el tiempo interno de cruce para resolver quien llego primero.
    *   **Foto de llegada:** El canvas final muestra el frame del primer cruce y un rotulo compacto con el caballo ganador para evitar ambiguedad visual.
*   **Notas/Advertencias:** La carrera sigue en modo offline. No se tocaron reglas de economia ni integraciones Supabase.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Fase 2 de Carreras del Reino: ritmo, terreno y limpieza visual.
*   **Cambios Clave:**
    *   **Carrera mas lenta:** Se amplio la duracion de la simulacion y se redujo el avance por frame para que la carrera tenga mas suspense.
    *   **Mas recorrido visual:** Se extendio la pista util y se agrego parallax de vallas, vegetacion y terreno para dar sensacion de distancia.
    *   **Panel lateral compacto:** Se quitaron los bloques de `Proxima fase` y `Ultima carrera` para dejar espacio a caballos, apuesta y accion.
*   **Notas/Advertencias:** Fase 2 sigue siendo offline. La fase online debe ir con RPC/Supabase Realtime para apuestas multiusuario seguras.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `src/utils/scratchUtils.ts`, `src/sections/MarketSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Fase 1 del minijuego Carreras del Reino en modo offline.
*   **Cambios Clave:**
    *   **Caballos aleatorios:** Cada cartel genera seis corredores con nombre, reino, color, estadisticas internas y cuotas variables.
    *   **Carrera canvas:** Se agrego pista arcade con fondo animado, carriles, meta, caballos pixelados y resultado visual.
    *   **Economia local:** El jugador apuesta oro, se descuenta al iniciar, cobra si gana y se aplica limite diario de ganancia neta.
    *   **Base para online:** El motor trabaja con `raceId`, caballos, frames, ganador y posiciones para facilitar una futura sala Supabase compartida.
*   **Notas/Advertencias:** Esta fase es offline. La fase online debe moverse a RPC/Supabase Realtime antes de aceptar apuestas multiusuario reales.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`, `src/utils/plinkUtils.ts`, `src/utils/scratchUtils.ts`, `src/sections/MarketSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Implementacion del minijuego Torre del Mago en la taberna del Mercado.
*   **Cambios Clave:**
    *   **Plinko arcano:** Se agrego una caida de esfera por 8 filas de runas y 9 cofres con animacion canvas, estela, impactos y cofres iluminados.
    *   **Economia conectada:** El juego descuenta apuesta, paga segun multiplicador, refresca oro del jugador y aplica limite diario de ganancia neta.
    *   **Utilidad reutilizable:** `plinkUtils.ts` concentra calculo de ruta, multiplicadores, retorno esperado y guardado diario.
    *   **Entrada en taberna:** Se agrego el modo `Torre` al selector horizontal de minijuegos en Mercado.
*   **Notas/Advertencias:** La tabla se balanceo para mantener retorno esperado cercano al 89% y evitar inflacion de oro. Pendiente validar visualmente en dispositivo real tras deploy.

### [Fecha: 13/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `scripts/kingdoom-memory-mcp.mjs`, `ai-memory/README.md`, `ai-memory/kingdoom-memory.jsonl`, `docs/kingdoom-memory-mcp.md`, `package.json`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Creacion de un MCP local de memoria compartida para Jarvis y Antigravity.
*   **Cambios Clave:**
    *   **Servidor MCP sin dependencias:** Se agrego `scripts/kingdoom-memory-mcp.mjs` con transporte `stdio` por JSON-RPC delimitado por lineas.
    *   **Memoria append-only:** Se creo `ai-memory/kingdoom-memory.jsonl` para decisiones, handoffs, riesgos y contexto operativo breve.
    *   **Herramientas de agente:** El MCP expone `remember_decision`, `record_handoff`, `search_memory`, `latest_memory` y `project_brief`.
    *   **Documentacion de conexion:** `docs/kingdoom-memory-mcp.md` incluye configuraciones sugeridas para Codex y Antigravity.
    *   **Comando local:** Se agrego `npm run mcp:memory` para iniciar el servidor desde la raiz del repo.
*   **Notas/Advertencias:** Validado con `node --check`, prueba directa de `initialize`, `tools/list` y `project_brief`, `npx tsc --noEmit` y `npm run build`. El changelog sigue activo como historial humano; la memoria MCP queda como capa operativa compacta.

### [Fecha: 12/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Pulido del flujo conversacional del Archivista para acciones admin por partes y adjuntos de imagen.
*   **Cambios Clave:**
    *   **Borradores por conversacion:** Si hay una accion pendiente, escribir algo distinto de `si/no` ahora ajusta o completa el borrador en vez de bloquear el chat.
    *   **Sin tarjetas contaminantes:** Las acciones de creacion y aclaraciones ya no muestran misiones, items o fuentes viejas que no corresponden al borrador actual.
    *   **Imagen adjunta:** Admin puede adjuntar imagen al siguiente borrador compatible; mercado, bestiario, flora y eventos reciben la imagen como `imageUrl`.
    *   **Prompt incremental:** El Archivista queda instruido para preguntar solo un dato indispensable por vez y conservar lo ya respondido.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. La lectura visual de una imagen sigue dependiendo de que el admin describa la referencia; la imagen se guarda como adjunto del borrador.

### [Fecha: 12/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `src/features/archivist/archivistLive.ts`, `src/features/archivist/archivistActions.ts`, `src/components/EventCard.tsx`, `src/components/AdminControlSheet.tsx`, `src/utils/events.ts`, `src/utils/archivistSources.ts`, `api/admin/_aiPrompts.ts`, `api/admin/ask-archivist.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de errores del Archivista vivo y blindaje de eventos creados por IA para evitar reinicios de interfaz.
*   **Cambios Clave:**
    *   **Tarjetas relevantes:** El Archivista deja de adjuntar items de mercado, magias o cartas aleatorias por palabras genericas; ahora filtra por intencion y score minimo.
    *   **Acciones admin robustas:** Misiones, eventos y oro aceptan payload canonico y variantes en espanol, recuperando titulos desde el borrador cuando la IA los dejaba solo en el texto visible.
    *   **Eventos defensivos:** Las vistas y fuentes del Archivista toleran eventos con facciones, fechas, imagenes o estado incompletos sin romper la UI.
    *   **Prompt endurecido:** El backend exige payload completo para acciones reales y valida que la accion devuelta este dentro de las soportadas.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Si existe un evento corrupto ya guardado en Supabase, la UI queda protegida, pero conviene editarlo desde admin para completar fecha, facciones y recompensa.

### [Fecha: 12/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `src/features/archivist/archivistLive.ts`, `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `src/utils/archivistSources.ts`, `src/utils/archivistAi.ts`, `api/admin/_aiPrompts.ts`, `api/admin/ask-archivist.ts`, `docs/superpowers/specs/2026-05-12-archivista-vivo-design.md`, `docs/superpowers/plans/2026-05-12-archivista-vivo.md`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ReconstrucciÃ³n del Archivista hacia un formato de chat puro con contexto vivo del reino, tarjetas compactas y preparaciÃ³n/ejecuciÃ³n de acciones admin por confirmaciÃ³n conversacional.
*   **Cambios Clave:**
    *   **Chat puro:** Se eliminÃ³ la estructura anterior con panel lateral y controles de memoria visibles para concentrar toda la experiencia en una sola interfaz conversacional.
    *   **Contexto vivo:** El Archivista ahora resume mercado, misiones, eventos, grimorio, biblioteca y, en modo admin, tambiÃ©n jugadores cargados.
    *   **Tarjetas compactas:** Las respuestas pueden adjuntar tarjetas breves de mercado, eventos, misiones, magias, bestiario, flora y documentos sin romper la versiÃ³n mÃ³vil.
    *   **Modo admin real:** Se integrÃ³ el borrador y la ejecuciÃ³n de acciones del reino tras confirmaciÃ³n `si/no` en el chat para oro, misiones, eventos, mercado, magia, bestiario, flora y documentos.
    *   **Cache y contexto:** Se ajustÃ³ el endpoint para separar respuestas pÃºblicas/admin y considerar el resumen vivo del reino al generar la respuesta IA.
*   **Notas/Advertencias:** El Archivista sigue dependiendo de las APIs/configuraciones IA ya existentes. Conviene validar flujo pÃºblico y flujo admin tras cada redeploy porque ahora la capa operativa ya no es solo informativa.

### [Fecha: 12/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `src/components/ArchivistSection.tsx`, `api/anime/proxy.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ResoluciÃ³n de problemas de visualizaciÃ³n de enlaces, rediseÃ±o de la interfaz de reproducciÃ³n/descarga para mayor compacidad y limpieza de la secciÃ³n del Archivista.
*   **Cambios Clave:**
    *   **Limpieza de Interfaz (ArchivistSection):** EliminaciÃ³n de la descripciÃ³n redundante en la cabecera del Archivista ("Consulta el reino..."), siguiendo el rediseÃ±o hacia un formato de chat puro.
    *   **UI Minimalista (AnimeHubSection):** SustituciÃ³n del selector de servidores por un componente ultra-compacto con icono de flecha (`ChevronDown`), optimizando el espacio en la consola de acciones.
    *   **NormalizaciÃ³n de Enlaces:** Se actualizÃ³ `normalizeLinks` para soportar arrays directos de `servers` y `downloads` que devuelven los scrapers actuales.
    *   **CorrecciÃ³n de Mapeo (AnimeFLV):** Se corrigiÃ³ `fetchAnimeFlvLinks` para procesar correctamente el payload envuelto de la API.
    *   **Seguridad:** MigraciÃ³n total de API Keys hardcodeadas a la constante `ANIME_HUB_API_KEY`.
    *   **Proxy API:** ActualizaciÃ³n de `api/anime/proxy.ts` para mejorar la compatibilidad del mapeo de fuentes y enlaces.
*   **Notas/Advertencias:** La interfaz ahora es mÃ¡s limpia y evita solapamientos en resoluciones bajas o mÃ³viles.

### [Fecha: 11/05/2026] - [Autor: Antigravity & Jarvis]
*   **Archivos Modificados:** `api/anime/stream.ts`, `api/anime/download.ts`, `api/admin/_serverAiProviders.ts`, `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`, `.env.example`
*   **Resumen de Tareas:** FinalizaciÃ³n de la integraciÃ³n de AnimeFLV, implementaciÃ³n de filtros por proveedor y optimizaciÃ³n de conectividad (CORS/Timeouts).
*   **Cambios Clave:**
    *   **Endpoints:** OptimizaciÃ³n de proxies en Vercel para streaming y descargas; ahora aceptan `ANIMEFLV_API_URL` como variable server-side.
    *   **UI Web/MÃ³vil:** ImplementaciÃ³n de selectores de proveedor y filtros dinÃ¡micos en ambas plataformas.
    *   **Conectividad:** CorrecciÃ³n de tipos TypeScript para `ApiRequest` (aÃ±adido `query`) e inclusiÃ³n de declaraciones globales para entornos Node.js.
    *   **Robustez:** InyecciÃ³n de `User-Agent` real en peticiones de backend para evitar bloqueos 403 y timeouts de 8s con `AbortController`.
    *   **ConfiguraciÃ³n:** Documentada la nueva variable `ANIMEFLV_API_URL` en `.env.example`.
*   **Notas/Advertencias:** La integraciÃ³n es ahora resiliente a fallos de red y cumple con los estÃ¡ndares de tipado de Vercel. Se requiere redeploy final.

### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se agrego soporte opt-in para `animeflv-api` como proveedor adicional de Anime Hub en web y app.
*   **Cambios Clave:**
    *   Se integro `VITE_ANIMEFLV_API_URL` y `EXPO_PUBLIC_ANIMEFLV_API_URL` como tercera fuente remota junto a `anime-website` y `anime-platform`.
    *   La busqueda puede consultar `/search` y la ficha puede resolver `/anime/{slug}` para obtener portada, sinopsis, generos y lista de episodios.
    *   Se mantuvieron desactivados los enlaces automaticos de embed/descarga desde este proveedor para evitar acoplar la UI a servidores externos no controlados.
*   **Notas/Advertencias:** Se verifico la API publica con busqueda de `bleach` y ficha `bleach-tv`. `npx tsc --noEmit`, `npm run build` y `npm run typecheck` de la app movil pasaron correctamente.

### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_serverAiProviders.ts`
*   **Resumen de Tareas:** Se endurecio el helper compartido de proveedores IA para que compile correctamente bajo la revision aislada de Vercel.
*   **Cambios Clave:**
    *   Se declaro un tipo minimo de `process.env` dentro del modulo.
    *   Se tiparon los `map(...)` que procesan keys y origenes configurables para evitar inferencias `any`.
*   **Notas/Advertencias:** El problema no estaba en la logica de fallback entre proveedores, sino en el entorno de tipado del runtime serverless.

### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/extract-pdf-text.ts`
*   **Resumen de Tareas:** Se corrigio el tipado aislado del extractor PDF para que compile correctamente en Vercel aunque el `tsconfig` principal no incluya la carpeta `api`.
*   **Cambios Clave:**
    *   Se declaro un tipo minimo de `process.env` para evitar la dependencia explicita de tipos de Node en ese endpoint.
    *   Se tiparon los callbacks implicitos y se normalizo el header `origin` antes de pasarlo al helper CORS.
*   **Notas/Advertencias:** Este ajuste apunta al verificador TypeScript aislado de Vercel, que estaba detectando errores que el `tsconfig` local no alcanzaba a cubrir.

### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/generate-bestiary.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-mission.ts`
*   **Resumen de Tareas:** Se corrigio el tipado de las funciones IA admin para evitar errores de compilacion en Vercel relacionados con `includeDebug`.
*   **Cambios Clave:**
    *   Se completo `includeDebug` en los objetos tipados como `Required<...Request>`.
    *   Se elimino el ruido de TypeScript que aparecia en los logs de deploy de produccion.
*   **Notas/Advertencias:** El deploy de Kingdoom ya no deberia marcar esos tres errores mientras la logica de debug siga siendo opcional.

### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/app/(tabs)/anime.tsx`, `src/features/animeHub/animeHub.mockProvider.ts`, `src/features/animeHub/animeHub.mock.ts`, `apps/mobile/src/features/animeHub/animeHubMock.ts`, `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se retiro la dependencia operativa de `anime1v` y se dejo Anime Hub centrado en `anime-website` y `anime-platform`, tanto en web como en la app.
*   **Cambios Clave:**
    *   Se eliminaron rutas, mensajes de entorno y prioridad visual ligadas a `anime1v`.
    *   Se reescribieron los proveedores remotos web y movil para dejar solo `anime-website` y `anime-platform`.
    *   Se limpiaron los mocks y las tarjetas de detalle para que no sigan mostrando etiquetas o contratos antiguos de `anime1v`.
*   **Notas/Advertencias:** `anime-website` sigue siendo la fuente principal. Para episodios y enlaces completos, su deploy debe responder correctamente en los endpoints `gogoanime`.

### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se endurecio el fallback de Anime Hub para evitar que las rutas averiadas de `gogoanime` generen resultados huerfanos o ruido innecesario en consola.
*   **Cambios Clave:**
    *   Se elimino la consulta redundante a `/search/anime/consumet/gogoanime` durante la busqueda mixta tanto en web como en movil.
    *   Si una ficha de `anime-website` no puede resolver su seed de streaming, ahora Kingdoom intenta redirigirla inmediatamente a `anime1v` por titulo en lugar de devolver `null`.
    *   Cuando tampoco existe rescate disponible, se construye un detalle minimo y estable para que la interfaz no quede sin respuesta.
*   **Notas/Advertencias:** El deploy `anime-website` sigue respondiendo `500` en las rutas `gogoanime`, y `anime1v` sigue necesitando una API key valida para rescatar episodios reales en produccion.

### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`
*   **Resumen de Tareas:** Se ampliÃ³ Anime Hub para aprovechar mejor las capacidades reales de `anime1v` con filtros por proveedor, enlaces mÃ¡s completos y una experiencia coherente entre web y app.
*   **Cambios Clave:**
    *   Se aÃ±adieron filtros reales por proveedor `anime1v` (`AnimeAV1`, `AnimeFLV`, `TioAnime`, `JKAnime`, `HentaiLA`, `MonosChinos`) en web y mÃ³vil.
    *   La bÃºsqueda ahora puede forzar el dominio correcto en `anime1v`, en lugar de tratarlo como una Ãºnica fuente genÃ©rica.
    *   Los resultados de `anime1v` ahora muestran la etiqueta real del proveedor origen, no solo `anime1v remoto`.
    *   La carga de enlaces de episodio ahora combina variantes `SUB` y `DUB`, e intenta pedir `includeMega=true` para exprimir mejor lo que ofrece el backend.
    *   Se corrigiÃ³ la referencia del endpoint batch a `/api/v1/anime/batch-download` para mantenerla alineada con el backend real.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit` y `npm run build` antes de publicar. Los proveedores mÃ¡s allÃ¡ de `AnimeAV1` siguen dependiendo de que el backend `anime1v` tenga esos scrapers y requisitos externos operativos.

### [Fecha: 08/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se reforzo la integracion de `anime1v` para que Kingdoom pueda autenticarse de forma mas compatible contra ese backend en web y app.
*   **Cambios Clave:**
    *   Se agrego un constructor dedicado para URLs de `anime1v` que anade automaticamente `apiKey` como query string cuando existe la variable de entorno.
    *   Se mantuvo tambien el envio por `X-API-Key` y `Authorization`, dejando doble compatibilidad con el middleware real de `anime1v-api`.
    *   Las llamadas de busqueda, detalle y episodios ahora reutilizan este protocolo unificado tanto en la version web como en la app movil.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Para que quede plenamente operativo en produccion, Vercel y Expo deben tener configuradas `VITE_ANIME_HUB_API_KEY` y `EXPO_PUBLIC_ANIME_HUB_API_KEY`.

### [Fecha: 08/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se reajusto la prioridad de proveedores de Anime Hub para dar mas estabilidad cuando conviven `anime1v` y `anime-website`.
*   **Cambios Clave:**
    *   La busqueda ahora prioriza primero `anime-website` para catalogo y cobertura general.
    *   `anime1v` pasa a segundo nivel como enriquecedor de resultados y fuente de reproduccion/episodios cuando aporta mejor disponibilidad.
    *   Si una ficha de `anime-website` no devuelve episodios, el sistema intenta resolver el mismo titulo en `anime1v` y reutiliza esos episodios como fallback transparente.
    *   El orden visual de resultados ahora favorece entradas de `anime-website`, manteniendo `anime1v` como respaldo de valor practico.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. `anime1v` sigue necesitando API key si ese backend la exige en produccion.

### [Fecha: 08/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se dejo documentada la nueva API desplegada de `anime-website` como proveedor remoto utilizable tanto en web como en la app nativa.
*   **Cambios Clave:**
    *   `VITE_ANIME_WEBSITE_API_URL` ahora apunta al deploy operativo `https://anime-website-hq58.vercel.app`.
    *   `EXPO_PUBLIC_ANIME_WEBSITE_API_URL` ahora apunta al mismo deploy para mantener consistencia entre web y app.
*   **Notas/Advertencias:** Para activar realmente la fuente en produccion aun hace falta pegar esta misma URL en las variables de entorno reales de Vercel y Expo/EAS.

### [Fecha: 08/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `src/components/AnimeHubSection.tsx`, `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se integro Anime Hub con estrategia multifuente para mejorar cobertura y corregir fichas que quedaban sin episodios.
*   **Cambios Clave:**
    *   `anime1v` queda como fuente principal de detalle, episodios y reproduccion.
    *   Se anadio soporte opcional para `anime-website` como respaldo de catalogo, detalle y episodios, y para `Anime API Platform` como respaldo de busqueda/catalogo.
    *   Las fichas y episodios ahora usan referencias compuestas por proveedor, evitando perder contexto al abrir detalle o cargar enlaces.
    *   Se corrigio el orden de resolucion de detalle para priorizar `url` antes que `id` en `anime1v`, reduciendo casos de `0 EPS`.
    *   Se documentaron las nuevas variables de entorno para Vercel y Expo.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. La integracion de `anime-website` y `Anime API Platform` requiere sus `*_API_URL` reales en entorno para quedar operativa.

### [Fecha: 08/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/PlayerNotificationBell.tsx`, `public/icons/anime-torii.png`
*   **Resumen de Tareas:** Se movio el acceso de Anime a la cabecera de Inicio y se limpio la cabecera del perfil.
*   **Cambios Clave:**
    *   Se retiro `Anime` de la barra global inferior para que deje de ocupar espacio permanente.
    *   Se anadio un acceso rapido con icono personalizado junto a notificaciones, visible solo mientras el usuario esta en `Inicio`.
    *   Se eliminaron los chips superiores de `Jugador` y `Activo`, ademas del texto redundante bajo `Tu sesion de jugador`.
    *   Se ajusto la navegacion inferior para que `Inicio` siga marcado cuando el portal Anime esta abierto desde ese acceso contextual.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`
*   **Resumen de Tareas:** Se corrigio la repeticion visual de portadas y se amplio la busqueda remota de Anime Hub.
*   **Cambios Clave:**
    *   Cuando el proveedor repite o no entrega portada, se genera una portada unica por titulo.
    *   Al abrir ficha se conserva el arte unico generado desde resultados.
    *   La busqueda prueba variantes con espacios, sin espacios, guiones y camelCase para casos como `Solo Leveling`.
    *   Los resultados se deduplican por ID y titulo normalizado.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`
*   **Resumen de Tareas:** Se pulio la vista de Anime Hub y se mejoro la deteccion de imagenes remotas.
*   **Cambios Clave:**
    *   El panel de acciones queda debajo de episodios salvo pantallas ultra amplias, evitando compresion lateral.
    *   El scroll de resultados recibio margen estable y estilo visual propio.
    *   El proveedor remoto ahora reconoce mas campos de portada/banner y normaliza URLs relativas.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se dejo la cabecera de Anime Hub solo como buscador compacto.
*   **Cambios Clave:**
    *   Se retiraron los filtros visibles de genero y el badge `Remoto/Demo`.
    *   La busqueda queda como unica accion superior con boton pequeno de lupa.
    *   Las consultas remotas siguen funcionando sin filtro de genero visible.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se compacto la cabecera de Anime Hub para liberar espacio de resultados, vista previa y episodios.
*   **Cambios Clave:**
    *   El buscador paso a una barra superior horizontal con boton pequeno de lupa.
    *   Los filtros quedaron en una fila desplazable y se retiro el bloque visual de `Estado`.
    *   Se elimino el encabezado grande de catalogo para reducir altura en movil y escritorio.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se ajusto la lista de episodios de Anime Hub para evitar compresion visual en escritorio y movil.
*   **Cambios Clave:**
    *   El detalle de serie recibe mas ancho frente a la lista de resultados en escritorio.
    *   El panel de acciones solo pasa a lateral en pantallas muy amplias, dejando los episodios como bloque principal.
    *   La grilla de episodios usa tarjetas con ancho minimo automatico para no deformarse.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se reorganizo el panel de detalle de Anime Hub para mejorar lectura y acciones en escritorio y movil.
*   **Cambios Clave:**
    *   La sinopsis queda como banda superior compacta y deja de competir con episodios y enlaces.
    *   Los episodios ahora usan tarjetas horizontales mas legibles, con numero fijo, seleccion clara y mayor altura util.
    *   Las acciones de ver y descargar se agruparon en una consola lateral responsive, apilable en movil.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se corrigio la seleccion de series en Anime Hub cuando el proveedor remoto no entrega ficha completa.
*   **Cambios Clave:**
    *   La web ahora abre una ficha basica desde el resultado seleccionado y solo la reemplaza si `/anime/info` responde correctamente.
    *   El adaptador remoto prueba `id` y `url` al consultar detalles, cubriendo variaciones frecuentes del proveedor.
    *   La app movil conserva la ficha seleccionada como fallback y muestra un estado claro si no hay episodios disponibles.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. Revision rapida de APIs serverless sin abrir README: endpoints admin principales mantienen CORS, OPTIONS y manejo de errores.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se corrigio el error de JSX que rompia el deploy de Vercel y se redisenio Anime Hub para que funcione como catalogo fluido de visualizacion y descarga.
*   **Cambios Clave:**
    *   La UI web ahora prioriza busqueda, resultados, ficha, episodios y acciones de ver/descargar, retirando paneles tecnicos y textos redundantes.
    *   El adaptador remoto se normalizo para evitar campos duplicados y manejar respuestas variables del proveedor sin romper la interfaz.
    *   La app movil recibio una vista mas compacta con carrusel de titulos, ficha visual, episodios accionables y botones directos para abrir enlaces.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.types.ts`, `src/features/animeHub/animeHub.remoteProvider.ts`, `src/features/animeHub/animeHub.mockProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Finalizada la integraciÃ³n de Anime Hub con soporte completo para reproducciÃ³n (streaming) y descargas directas desde la API real.
*   **Cambios Clave:**
    *   **Tipado:** Extendida la interfaz `AnimeHubProvider` con `getEpisodeLinks` para soportar la obtenciÃ³n dinÃ¡mica de servidores.
    *   **Web/Remote:** Implementado fetcher de enlaces en `remoteAnimeHubProvider` y corregido el mapeo de detalles de serie (id, episodios y metadata).
    *   **UI Web:** `AnimeHubSection` ahora permite seleccionar episodios, cargando dinÃ¡micamente los servidores de streaming y enlaces de descarga en un panel integrado.
    *   **Mobile:** Actualizado el proveedor nativo para incluir `fetchMobileEpisodeLinks` y corregido el mapeo de series para consistencia con la API.
    *   **API Hotfix:** Se redirigiÃ³ el almacenamiento temporal de la API para evitar errores 500 en entornos serverless (Vercel).
*   **Notas/Advertencias:** Validado y sincronizado en GitHub. El sistema mantiene fallback automÃ¡tico al modo cascarÃ³n si la API no responde.


### [Fecha: 07/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ConexiÃ³n real del mÃ³dulo Anime Hub con `anime1v-api` mediante variables de entorno, manteniendo el modo cascarÃ³n como fallback seguro.
*   **Cambios Clave:**
    *   **Web:** Implementado adaptador real en `remoteAnimeHubProvider` usando `VITE_ANIME_HUB_API_URL`. Soporta `searchSeries` y `getSeriesDetail` con mapeo a tipos internos.
    *   **Web:** `AnimeHubSection` ahora detecta automÃ¡ticamente si existe la URL de la API para conmutar entre el proveedor mock y el remoto, con manejo de errores elegante en el feedback.
    *   **Mobile:** Actualizado `animeHubProvider.ts` para consumir `EXPO_PUBLIC_ANIME_HUB_API_URL` si estÃ¡ presente, integrando los flujos de bÃºsqueda e informaciÃ³n real con fallback automÃ¡tico al shell mock en caso de error o ausencia de configuraciÃ³n.
    *   **Resiliencia:** Se preservÃ³ el diseÃ±o premium y el funcionamiento del modo cascarÃ³n para entornos sin configuraciÃ³n de API.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. No se requiere `package-lock.json`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/index.css`, `src/types.ts`, `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.types.ts`, `src/features/animeHub/animeHub.mock.ts`, `src/features/animeHub/animeHub.mockProvider.ts`, `src/features/animeHub/animeHub.remoteProvider.ts`, `src/features/animeHub/index.ts`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/features/animeHub/animeHubTypes.ts`, `apps/mobile/src/features/animeHub/animeHubMock.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se monto el cascaron completo de Anime Hub en web y app movil, con contratos de proveedor inspirados en `anime1v-api` pero sin conexion real.
*   **Cambios Clave:**
    *   Se anadio una pestania `Anime` en la web y otra en la app movil con buscador, filtros, endpoints preparados, detalle de serie, episodios y solicitudes de descarga mock.
    *   Se separaron los contratos del proveedor, el catalogo mock y el proveedor remoto placeholder para dejar listo el cableado futuro sin activar nada por accidente.
    *   Donde falta integracion real se dejaron comentarios explicitos del tipo "Si no se anade ANIME_HUB_API_URL ... no se activa y sigue modo cascaron" para que el modulo permanezca inerte hasta que usted conecte backend.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. No se conecto ninguna API real ni se implementaron descargas.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/CharImportModal.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/TavernExpeditionArcade.tsx`
*   **Resumen de Tareas:** Se amplio el editor de fichas y se corrigio la vista desactualizada de estadisticas tras mejorar en Expedicion.
*   **Cambios Clave:**
    *   El modo editar ficha ahora permite modificar datos base, poderes oficiales, armas, estilo de combate, habilidades, personalidad, historia, extras, debilidades, inventario y estadisticas.
    *   Antes de ver o editar una ficha, el panel de jugador vuelve a consultar Supabase para abrir la version mas reciente.
    *   Expedicion hidrata su estado por `player.id` y no por el objeto completo del jugador, evitando recargas internas cuando el perfil se refresca en segundo plano.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [Fecha: 07/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerInventorySheet.tsx`, `src/components/PlayerTradeSheet.tsx`
*   **Resumen de Tareas:** Se corrigio la recarga ciclica del inventario y del panel de intercambio mientras el perfil se refresca en segundo plano.
*   **Cambios Clave:**
    *   Ambos paneles ahora escuchan solo `player.id` en sus efectos de carga, en lugar del objeto `player` completo.
    *   El refresco automatico del perfil cada 10 segundos ya no reinicia las vistas internas del inventario ni muestra de nuevo el estado "Abriendo el inventario...".
    *   El mismo blindaje se aplico al panel de intercambio para evitar una recarga fantasma del inventario transferible.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.storage.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se blindo la compra de acciones de la Bolsa del Reino para evitar descuentos sin cartera.
*   **Cambios Clave:**
    *   Se agrego la RPC atomica `buy_realm_exchange_shares`, que descuenta oro y actualiza acciones en una sola transaccion.
    *   La web y la app nativa ahora compran acciones mediante la compra segura, no mediante el flujo local de oro primero y cartera despues.
    *   La RPC bloquea el jugador y su cartera con `for update`, valida oro suficiente y calcula el promedio desde la cartera real de Supabase.
    *   Si el SQL no esta instalado, la compra se detiene antes de descontar oro.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. Ejecutar el SQL actualizado de `supabase_realm_exchange_sync.sql` en Supabase antes de volver a comprar acciones en produccion.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.storage.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se blindo la apertura y el cobro de predicciones de la Bolsa del Reino contra estados duplicados.
*   **Cambios Clave:**
    *   Las predicciones resueltas ahora se confirman mediante la RPC atomica `resolve_realm_exchange_predictions`.
    *   La apertura de predicciones usa la RPC atomica `open_realm_exchange_prediction` para evitar dobles apuestas o carteras pisadas entre movil y escritorio.
    *   Supabase bloquea la cartera y el jugador antes de acreditar oro, pagando solo predicciones que sigan activas.
    *   Web y app nativa usan un candado de resolucion para evitar ejecuciones simultaneas del efecto automatico.
    *   Si la RPC aun no esta instalada, el cliente detiene el pago y avisa para ejecutar el SQL actualizado.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. Hay que ejecutar el SQL actualizado de `supabase_realm_exchange_sync.sql` en Supabase para activar el blindaje en produccion.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernExpeditionArcade.tsx`, `src/components/CharSheetModal.tsx`, `src/utils/pveProgress.ts`, `src/types.ts`, `src/features/realmExchange/realmExchange.data.ts`, `apps/mobile/src/features/realmExchange/realmExchangeData.ts`
*   **Resumen de Tareas:** Se ampliaron las mejoras de Expedicion y se ajusto la probabilidad de banca rota de la Bolsa del Reino.
*   **Cambios Clave:**
    *   Expedicion ahora permite invertir puntos en Agilidad, Inteligencia y Defensa Magica ademas de Fuerza, Vida y Defensa.
    *   Cada mejora vinculada a una estadistica real actualiza tambien la ficha activa, evitando tener que editarla manualmente.
    *   La hoja de personaje muestra el atributo real guardado y mantiene el desglose PvE separado para evitar duplicaciones visuales.
    *   La probabilidad de banca rota de la Bolsa del Reino baja de 5% a 1% tanto en web como en app nativa.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.data.ts`, `src/features/realmExchange/realmExchange.simulation.ts`, `src/features/realmExchange/realmExchange.storage.ts`, `src/features/realmExchange/realmExchange.types.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeData.ts`, `apps/mobile/src/features/realmExchange/realmExchangeSimulation.ts`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `apps/mobile/src/features/realmExchange/realmExchangeTypes.ts`
*   **Resumen de Tareas:** Se agrego la mecanica de banca rota global para activos de la Bolsa del Reino.
*   **Cambios Clave:**
    *   Cada tick de mercado tiene 5% de probabilidad deterministica de provocar banca rota por activo.
    *   Una banca rota dura 90 minutos, bloquea compras/ventas/predicciones y muestra el grafico caido con aviso rojo.
    *   Las acciones compradas se pierden si el jugador estaba desconectado cuando ocurrio la quiebra; la cartera se purga al cargar o al detectar el tick.
    *   La misma regla se aplico en web y app nativa para evitar desfaces entre plataformas.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerNotificationBell.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/utils/playerNotifications.ts`, `src/utils/trade.ts`, `supabase_player_notifications.sql`
*   **Resumen de Tareas:** Se agrego una campana de avisos para oro y objetos recibidos por transferencia entre jugadores.
*   **Cambios Clave:**
    *   El perfil del jugador muestra una campana compacta con contador de avisos nuevos y panel flotante con remitente, detalle y hora.
    *   Las transferencias exitosas de oro y objetos registran una notificacion para el destinatario sin bloquear el envio si la tabla aun no existe.
    *   Se agrego SQL idempotente para crear `player_notifications` con indices por jugador, fecha y estado de lectura.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Ejecutar `supabase_player_notifications.sql` en Supabase para activar persistencia real de avisos.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.storage.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se corrigio un bug critico de doble cobro en la Bolsa del Reino al vender acciones.
*   **Cambios Clave:**
    *   Se agrego un candado sincronico contra doble toque/click antes de que React actualice el estado visual.
    *   Las ventas y predicciones premiadas ahora consumen/persisten el estado antes de acreditar oro, evitando pagos repetidos con la misma cartera.
    *   Se agrego la RPC `sell_realm_exchange_shares` para venta atomica en Supabase y defensa multi-dispositivo.
    *   La app nativa usa la misma ruta segura de venta y refresca el oro desde Supabase cuando la RPC confirma la operacion.
*   **Notas/Advertencias:** La CLI de Supabase quedo con timeout al intentar aplicar el SQL enlazado; si la funcion no aparece en Supabase, ejecutar `supabase_realm_exchange_sync.sql` manualmente en el SQL Editor.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/magicBalance.ts`, `src/utils/grimoireContent.ts`, `docs/grimoire_balance_audit.md`
*   **Resumen de Tareas:** Se agrego una capa global de balance para el Grimorio, revisando magias de Lv1-Lv5 y corrigiendo habilidades con riesgo de Mano Negra.
*   **Cambios Clave:**
    *   Se aplican guardas por nivel para mantener progresion clara entre Lv1 y Lv5.
    *   Se agregaron reworks para habilidades con instakill, invulnerabilidad, defensa absoluta, control permanente o destruccion masiva sin respuesta.
    *   El balance se aplica tanto al contenido local como al contenido administrado desde Supabase.
    *   Se dejo una auditoria de criterios y familias afectadas en `docs/grimoire_balance_audit.md`.
*   **Notas/Advertencias:** La correccion no borra el material original; se aplica como capa de lectura y administracion para conservar compatibilidad con el formato actual.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/realmExchange/realmExchange.storage.ts`, `src/components/RealmStockExchange.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se corrigio la divergencia de carteras de la Bolsa del Reino entre web y app movil, migrando la persistencia hacia Supabase con compatibilidad para estados locales anteriores.
*   **Cambios Clave:**
    *   La Bolsa del Reino deja de depender solo de `localStorage` y `AsyncStorage` por dispositivo.
    *   Se agrego sincronizacion remota por `player_id` en la tabla `player_realm_exchange_states`.
    *   Al cargar, el sistema fusiona una sola vez el estado local viejo con el remoto para no perder compras previas del mismo usuario.
    *   Tras sincronizar, limpia el estado local legado para evitar que vuelva a duplicarse en siguientes cargas.
*   **Notas/Advertencias:** Para que la cartera quede realmente unificada entre dispositivos, hay que ejecutar `supabase_realm_exchange_sync.sql` en Supabase. Si la tabla aun no existe, el sistema conserva el fallback local sin romper la Bolsa.

### [Fecha: 06/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`
*   **Resumen de Tareas:** Se habilito la carga de imagenes desde galeria en el formulario de mercado dentro del panel admin.
*   **Cambios Clave:**
    *   Se agrego un boton `Cargar imagen desde galeria` debajo del campo `URL de imagen`.
    *   La imagen seleccionada se convierte a data URL local para no depender de enlaces externos.
    *   El formulario deja feedback claro cuando la imagen se carga correctamente o falla la lectura.
*   **Notas/Advertencias:** La carga reutiliza el mismo criterio practico ya usado en bestiario y flora, manteniendo consistencia en el panel admin.

### [Fecha: 05/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/market/market.rotation.ts`, `apps/mobile/src/features/market/marketRotation.ts`
*   **Resumen de Tareas:** Se ajusto la vitrina rotativa para mostrar solo items disponibles cuando no se completa el cupo por rareza.
*   **Cambios Clave:**
    *   Si una rareza tiene menos items disponibles que su cupo, se muestran solo esos items disponibles.
    *   Los items agotados ya no rellenan cupos faltantes dentro de la rotacion.
*   **Notas/Advertencias:** No cambia precios, compras ni probabilidades; solo evita que la vitrina rotativa enseÃ±e agotados como reemplazo.
*   **Validacion:** `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build` ejecutados correctamente.

### [Fecha: 05/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/market/market.rotation.ts`, `src/sections/MarketSection.tsx`, `apps/mobile/src/features/market/marketRotation.ts`, `apps/mobile/app/(tabs)/market.tsx`
*   **Resumen de Tareas:** Se agrego rotacion probabilistica de la vitrina del mercado cada 5 horas.
*   **Cambios Clave:**
    *   La tienda ahora selecciona items visibles por rareza con probabilidades: comun 100%, raro 90%, epico 50%, legendario 10% y mitico 1%.
    *   Los cupos por ventana son: comunes 5, raros 5, epicos 4, legendarios 3 y miticos 2.
    *   La rotacion es deterministica por ventana de 5 horas, por lo que todos ven la misma vitrina hasta el siguiente refresco.
    *   Web y app nativa comparten la misma regla, priorizando items comprables antes que agotados.
*   **Notas/Advertencias:** Esta mecanica filtra la vitrina visible, pero no cambia el RPC de compra ni el oro. Los admins siguen gestionando el catalogo completo desde el panel.
*   **Validacion:** `npx tsc --noEmit`, `npm run mobile:typecheck`, `npm run build` y `npx expo export --platform android` ejecutados correctamente.

### [Fecha: 05/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/components/MarketItemCard.tsx`, `src/components/PurchaseModal.tsx`, `src/components/AdminControlSheet.tsx`, `src/features/market/*`, `src/sections/MarketSection.tsx`, `api/admin/generate-market-item.ts`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/features/market/*`, `apps/mobile/src/features/shared/types.ts`, `apps/mobile/src/components/KingdoomUI.tsx`, `supabase_market_mythic_limited_stock.sql`
*   **Resumen de Tareas:** Se agrego la rareza `Mitico` al mercado, superior a legendario, con estetica carmesi destacada y soporte para stock limitado hasta quedar agotado.
*   **Cambios Clave:**
    *   El mercado web y la app nativa ahora reconocen `mythic` como rareza valida y la muestran como `Mitico`.
    *   Las tarjetas miticas tienen brillo carmesi, animacion propia y presencia visual superior a legendario.
    *   El admin puede cargar unidades limitadas y unidades vendidas para items limitados.
    *   Las compras web y nativas bloquean cantidades superiores al stock restante y muestran `Agotado` cuando se termina.
    *   Se preparo SQL para agregar `stock_limit`, `stock_sold`, permitir rareza `mythic` y actualizar el RPC de compra con control atomico de stock.
*   **Notas/Advertencias:** Ejecutar `supabase_market_mythic_limited_stock.sql` en Supabase para activar persistencia real de unidades limitadas y agotado automatico. Sin ese SQL, la lectura/guardado intenta fallback legacy para no romper el mercado actual.
*   **Validacion:** `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build` ejecutados correctamente.

### [Fecha: 05/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernRoulette.tsx`, `src/components/TavernCrash.tsx`, `src/components/TavernPenalty.tsx`, `src/components/TavernSlots.tsx`, `src/utils/scratchSecure.ts`
*   **Resumen de Tareas:** Se hizo una auditoria de seguridad funcional sobre los cobros de minijuegos y se corrigieron varios puntos donde un saldo viejo podia sobrescribir el oro real del jugador.
*   **Cambios Clave:**
    *   Ruleta, Crash, Penalty y Slots ahora refrescan el perfil antes de liquidar premio o perdida, reduciendo el riesgo de pisar cambios recientes de oro.
    *   Rasca y gana ahora respeta mejor el tope diario local y no deja que el ultimo ticket ganador se pase del limite por acumulacion.
    *   Se validaron `npx tsc --noEmit` y `npm run build` despues de los ajustes.
*   **Notas/Advertencias:** La auditoria confirmo que aun quedan minijuegos con logica client-side o `localStorage` en vez de RPC 100% de Supabase. Quedo estable para uso actual, pero la siguiente mejora recomendable es migrar liquidaciones criticas a backend atomico.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/components/RealmRegistry.tsx`
*   **Resumen de Tareas:** Se estabilizo el registro publico de fichas para que la cabecera y la `X` de cierre no se pierdan cuando hay muchas fichas cargadas.
*   **Cambios Clave:**
    *   El modal de registro ahora se monta por portal en `document.body`, igual que otros paneles grandes del perfil.
    *   La cabecera y la zona de busqueda quedaron fijas dentro del recuadro, con altura segura de viewport y mejor comportamiento en movil.
*   **Notas/Advertencias:** El contenido sigue desplazandose dentro del listado, pero el cierre ya permanece visible durante toda la navegacion.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/realmExchange/realmExchange.simulation.ts`, `apps/mobile/src/features/realmExchange/realmExchangeSimulation.ts`
*   **Resumen de Tareas:** Se corrigio la simulacion de la Bolsa del Reino para que el rango hasta 500 sea realmente alcanzable.
*   **Cambios Clave:**
    *   La formula dejo de orbitar solo alrededor del `basePrice` y ahora usa el rango completo entre `priceFloor` y `priceCeiling`.
    *   Web y app comparten el mismo comportamiento, por lo que ya no quedan activos clavados cerca de 150 aunque el techo sea 500.
*   **Notas/Advertencias:** El ajuste cambia la amplitud real del mercado, pero mantiene la misma persistencia local y la misma duracion de predicciones.
*   **Validacion:** `npx tsc --noEmit`, `npm run build`, `npm run typecheck` y `npx expo export --platform android` ejecutados correctamente.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/*`
*   **Resumen de Tareas:** Se porto la Bolsa del Reino a la app nativa.
*   **Cambios Clave:**
    *   Mercado nativo ahora incluye una seccion de Bolsa con activos por reino, grafico compacto, acciones y predicciones de 2 horas.
    *   El techo maximo de precio tambien queda en 500 dentro de la app mediante `REALM_EXCHANGE_PRICE_CEILING`.
    *   Las posiciones y predicciones se guardan por jugador con AsyncStorage y usan el oro real del perfil conectado.
*   **Notas/Advertencias:** La simulacion bursatil nativa sigue siendo local, igual que el prototipo web; no se agregan tablas ni RPC de Supabase.
*   **Validacion:** `npm run typecheck` y `npx expo export --platform android` ejecutados correctamente en `apps/mobile`.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/realmExchange/realmExchange.data.ts`
*   **Resumen de Tareas:** Se ajusto el techo maximo de precio de la Bolsa del Reino.
*   **Cambios Clave:**
    *   Los activos ahora pueden subir hasta 500 de precio maximo mediante `REALM_EXCHANGE_PRICE_CEILING`.
*   **Notas/Advertencias:** La simulacion sigue siendo local; no cambia reglas de Supabase ni tablas.
*   **Validacion:** `npx tsc --noEmit` y `npm run build` ejecutados correctamente.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`, `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/*`, `docs/superpowers/plans/2026-05-04-bolsa-del-reino-implementation.md`
*   **Resumen de Tareas:** Se implemento la primera version de la Bolsa del Reino dentro de Mercado.
*   **Cambios Clave:**
    *   Se agrego un modulo plegable independiente para activos de reinos, separado de la taberna y cargado con lazy loading.
    *   La Bolsa incluye simulacion deterministica de precios, grafico SVG animado, compra/venta local de acciones y predicciones de 2 horas por reino.
    *   Las operaciones descuentan o suman oro mediante la sesion activa del jugador, manteniendo posiciones y predicciones en `localStorage` como prototipo seguro.
*   **Notas/Advertencias:** Esta fase no crea tablas nuevas en Supabase; la persistencia bursatil es local para validar jugabilidad antes de blindar economia en backend.
*   **Validacion:** `npx tsc --noEmit` y `npm run build` ejecutados correctamente.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/components/DetailSheet.tsx`, `apps/mobile/src/components/KingdoomUI.tsx`, `apps/mobile/src/components/ScreenShell.tsx`, `apps/mobile/src/theme/colors.ts`
*   **Resumen de Tareas:** Se hizo una pasada visual premium sobre la UI nativa de Kingdoom.
*   **Cambios Clave:**
    *   `ScreenShell` ahora tiene halos ambientales animados, textura vertical sutil y cabecera con divisor brillante.
    *   Las tarjetas compartidas tienen cristal oscuro, rail dorado/teal/danger, sombras mas profundas y brillos internos.
    *   Cargas, errores y avisos usan paneles animados reutilizables para que Mercado y Biblioteca se sientan mas pulidos.
    *   La barra inferior tiene iconos activos con glow, cambio de ancho y linea inferior animada.
    *   Las hojas de detalle ganaron fondo mas teatral, halo dorado/teal y cierre mas claro.
*   **Notas/Advertencias:** Validado con `npm run typecheck` y `npx expo export --platform android --output-dir .expo-export-check` en `apps/mobile`. El export temporal fue eliminado.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/components/TavernSlotsNative.tsx`, `apps/mobile/src/features/session/sessionStore.ts`, `apps/mobile/assets/images/icon.png`, `apps/mobile/assets/images/adaptive-icon.png`, `apps/mobile/assets/images/splash-icon.png`, `apps/mobile/assets/images/favicon.png`
*   **Resumen de Tareas:** Se llevo el minijuego de Slots a la app nativa y se reemplazo el paquete de iconos por una identidad KD.
*   **Cambios Clave:**
    *   Mercado nativo ahora incluye `Slots del Tesoro`, con carretes animados, presets de apuesta, ALL IN, refresco de oro y limite diario de 350.000 oro neto.
    *   La app puede actualizar el oro del jugador desde el store nativo para que los minijuegos no dependan de la WebView.
    *   Los premios siguen la tabla x1.25/x2/x3/x5/x8/x12 y la apuesta se pierde si no hay premio.
    *   Se regeneraron icono, adaptive icon, splash y favicon con fondo negro, sello dorado e iniciales KD.
*   **Notas/Advertencias:** Validado con `npm run typecheck` en `apps/mobile` y `npx expo export --platform android --output-dir .expo-export-check`. El export temporal fue eliminado.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernSlots.tsx`, `src/sections/MarketSection.tsx`, `src/utils/scratchUtils.ts`
*   **Resumen de Tareas:** Se agrego el minijuego `Slots` a la taberna del mercado.
*   **Cambios Clave:**
    *   La taberna ahora incluye una maquina tragaperras arcana con 3 carretes, simbolos medievales y animacion escalonada.
    *   El minijuego usa el oro del perfil activo y descuenta la apuesta al girar.
    *   Si no hay premio, la apuesta se pierde; si hay premio, se cobra segun tabla x1.25/x2/x3/x5/x8/x12.
    *   Se agrego limite diario de 350.000 de oro neto ganado para evitar farmeo excesivo.
    *   La interfaz se adapto para escritorio y movil con paneles compactos, tabla de pagos y refresco de oro.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 04/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `supabase_grimoire_flora.sql`, `src/utils/inventory.ts`
*   **Resumen de Tareas:** Se corrigio el flujo de flora administrable y se blindo el inventario contra categorias legacy.
*   **Cambios Clave:**
    *   Flora ahora incluye politicas RLS equivalentes a bestiario y magias dentro del SQL del proyecto.
    *   El inventario normaliza categorias inesperadas como `potions` para evitar que la vista se caiga al renderizar items legacy.
    *   Con esto, una fila mal categorizada deja de romper la hoja completa del inventario.
*   **Notas/Advertencias:** Para que Flora quede operativa en Supabase, hay que ejecutar el SQL actualizado de `supabase_grimoire_flora.sql`.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/components/CharImportModal.tsx`
*   **Resumen de Tareas:** Se agrego edicion directa de fichas ya creadas desde el panel de jugador.
*   **Cambios Clave:**
    *   Cada tarjeta de personaje ahora incluye accion de editar sin eliminar la ficha.
    *   El modal de fichas reutiliza el flujo existente para importar o actualizar.
    *   Al editar, se conservan el id, jugador, fecha de creacion y retrato actual si no se carga otro.
    *   El limite de 2 fichas solo aplica al crear/importar, no al actualizar una existente.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernPenalty.tsx`, `src/utils/scratchUtils.ts`
*   **Resumen de Tareas:** Se agrego limite diario de ganancia neta al minijuego de Penales.
*   **Cambios Clave:**
    *   Penales ahora limita la ganancia neta diaria a 350.000 de oro por jugador.
    *   El contador solo aumenta por oro ganado, no por la apuesta devuelta.
    *   Si el tiro falla por poste o atajada, la apuesta se pierde y no suma al limite.
    *   Los cobros se recortan automaticamente si la jugada supera el margen diario restante.
    *   Se agrego una barra compacta de ganancia diaria dentro del panel de apuesta.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. El limite usa almacenamiento local igual que el flujo actual de Cartas.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernPenalty.tsx`
*   **Resumen de Tareas:** Se ajusto el minijuego de Penales para permitir apuestas superiores y limpiar la interfaz lateral.
*   **Cambios Clave:**
    *   Se elimino el limite fijo de 2500 de la apuesta; ahora el maximo se ajusta al oro disponible del jugador.
    *   Se retiro el panel redundante de `Zonas`, ya cubierto por la barra de multiplicadores x2/x4/x8/x12.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. El flujo sigue impidiendo apostar mas oro del disponible.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/assets/penalty-keeper-sprites.png`
*   **Resumen de Tareas:** Se reemplazo el spritesheet del portero de Penales por una version pixel-art nueva con transparencia real.
*   **Cambios Clave:**
    *   Se elimino el fondo gris que aparecia dentro del arco.
    *   Se recrearon las poses principales del portero en una hoja transparente compatible con el canvas actual.
    *   El asset bajo de 542 KB a 18.86 KB en el build.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. No se tocaron apuestas, multiplicadores ni reglas de oro.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernPenalty.tsx`, `src/assets/penalty-keeper-sprites.png`
*   **Resumen de Tareas:** Se pulio el minijuego de Penales con sprites reales del portero, tanda progresiva x2/x4/x8/x12 y una UI mas arcade.
*   **Cambios Clave:**
    *   Se integro un spritesheet compacto del portero para usar poses de espera, salto y atajada en canvas.
    *   La apuesta ahora funciona como tanda de 4 rondas con multiplicadores progresivos y opcion de cobrar o arriesgar.
    *   Se agrego barra de avance, chips de multiplicador, feedback de ronda y canvas mas atmosferico.
    *   Se corrigio el avance visual de la barra para que solo progrese cuando el tiro termina en gol.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. No se modifico el limite maximo de apuesta ni reglas globales de oro.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernTowerDefense.tsx`
*   **Resumen de Tareas:** Se ajusto la construccion del Tower Defense para permitir colocar torres en cualquier casilla libre del tablero.
*   **Cambios Clave:**
    *   Se elimino la restriccion de anclajes de construccion.
    *   Se mantiene el bloqueo de construccion sobre la ruta para evitar romper el movimiento de enemigos.
    *   Se limpiaron textos del modo que mencionaban anclajes y se actualizo la indicacion de mapa.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. No se tocaron recompensas ni cobro de oro.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernPenalty.tsx`, `src/sections/MarketSection.tsx`
*   **Resumen de Tareas:** Se agrego el minijuego Penales a la taberna como apuesta arcade con canvas, direccion de tiro, reaccion del portero y cobro de oro.
*   **Cambios Clave:**
    *   Nuevo modo `Penales` dentro de Juegos de azar, cargado de forma lazy para no aumentar la carga inicial.
    *   El penal se resuelve con timeline sincronizado: carrera, contacto, salida del balon, reaccion tardia del portero y resultado.
    *   Se agregaron 7 zonas de tiro, pagos por riesgo, reembolso por poste y cobro/perdida sobre el oro del jugador conectado.
    *   El canvas dibuja cancha, arco, shooter, portero, balon y marcas de punteria con estilo pixel arcade responsive.
    *   La UI se adapto para escritorio y movil con apuesta compacta, controles grandes y feedback claro.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. La actualizacion de oro usa el flujo existente de `PlayerSessionContext`.

### [Fecha: 02/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernTowerDefense.tsx`
*   **Resumen de Tareas:** Se mejoro el minijuego Tower Defense con balance mas desafiante, construccion por anclajes, nuevas torres y una oleada final con boss.
*   **Cambios Clave:**
    *   Los mapas ahora tienen puntos especificos de construccion para evitar acumular todas las torretas en el inicio.
    *   Se ajustaron recursos iniciales, costes, escalado de dificultad y vidas para que Asedio y Abismo sean mas tensos sin sentirse injustos.
    *   Se agregaron Caldera Alquimica y Bastion de Hierro, junto con ataques de area, ralentizacion, perforacion y efectos visuales por impacto.
    *   La oleada 5 ahora invoca un boss principal con menos enemigos de relleno.
    *   El render del canvas usa torres, enemigos, proyectiles y anclajes con siluetas pixel-art mas reconocibles.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. No se modifico la logica diaria de cobro de recompensa ni Supabase.

### [Fecha: 30/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/grimoire.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/components/DetailSheet.tsx`, `apps/mobile/src/components/KingdoomUI.tsx`, `apps/mobile/src/components/ScreenShell.tsx`
*   **Resumen de Tareas:** Se hizo una pasada premium de UI/UX nativa con foco en mobile, errores visuales, microinteracciones y estados de carga mas claros.
*   **Cambios Clave:**
    *   La barra inferior ahora resalta la pestaÃ±a activa con una capsula visual mas premium y menos ruido en pantallas estrechas.
    *   Tarjetas, botones y chips suman profundidad, glow sutil, escala tactil y transiciones con curva pesada.
    *   Los inputs de busqueda ahora tienen foco dorado, teclado oscuro y autocorreccion desactivada para nombres del rol.
    *   Se agrego un loader compacto reutilizable para Mercado, Biblioteca y Grimorio.
    *   Los paneles de detalle ahora tienen handle, atmosfera visual y cierre mas claro.
*   **Notas/Advertencias:** Validado con `npm run typecheck` en `apps/mobile`, `npx tsc --noEmit` y `npm run build`. No se tocaron reglas de oro, compras, misiones ni Supabase.

### [Fecha: 30/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/services/supabase.ts`, `apps/mobile/src/features/session/sessionStore.ts`, `apps/mobile/src/features/grimoire/grimoireService.ts`, `apps/mobile/src/features/events/eventsService.ts`, `apps/mobile/src/features/market/marketService.ts`, `apps/mobile/src/features/missions/missionsService.ts`, `apps/mobile/src/components/KingdoomUI.tsx`, `apps/mobile/src/components/ScreenShell.tsx`, `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/grimoire.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/archivist.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se revisaron los errores de carga vistos en la APK beta y se compacto la UI nativa para mostrar estados mas simples, utiles y menos redundantes.
*   **Cambios Clave:**
    *   Los errores de Supabase ahora distinguen configuracion faltante, tablas ausentes, permisos RLS y cambios de columnas.
    *   Inicio acepta coincidencias parciales de jugador cuando hay un solo resultado y evita mensajes confusos al conectar perfil.
    *   Mercado, Biblioteca y Grimorio ya no mezclan error con estados vacios, reduciendo ruido visual en mobile.
    *   Las tarjetas, cabeceras y paneles de error se compactaron para iPhone y Android sin perder informacion accionable.
    *   El Archivista se limpio con textos mas breves y separadores consistentes.
*   **Notas/Advertencias:** Validado con `npm run typecheck` en `apps/mobile`, `npx tsc --noEmit` y `npm run build`. La APK beta necesita variables `EXPO_PUBLIC_*` configuradas en EAS para conectar Supabase.

### [Fecha: 30/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/grimoire.tsx`
*   **Resumen de Tareas:** Se avanzaron las Fases 4, 5 y 6 de nivelacion nativa con mejoras de navegacion, mercado y grimorio sin tocar reglas de economia ni SQL.
*   **Cambios Clave:**
    *   Inicio ahora funciona como mesa de mando con actividad destacada y accesos rapidos a misiones, mercado, grimorio y Archivista.
    *   Mercado suma oro visible, conteos por categoria, resumen compacto de categorias, total por compra y bloqueo visual si no alcanza el oro.
    *   Grimorio suma conteos por seccion, filtros por categoria y detalles mas completos de magias, bestiario y flora.
    *   Se mantuvo un enfoque mobile-first con tarjetas compactas, chips horizontales y sin textos redundantes.
*   **Notas/Advertencias:** Validado con `npm run typecheck` en `apps/mobile`. No se modificaron recompensas, precios, RPC ni estructura de Supabase.

### [Fecha: 30/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/archivist.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/src/features/archivist/archivistService.ts`, `apps/mobile/src/features/shared/types.ts`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se avanzo la Fase 3 de nivelacion de la app nativa con un Archivista IA propio, sin WebView y sin exponer claves en el APK.
*   **Cambios Clave:**
    *   Se agrego una pestania nativa `Archivista` con chat, modos de respuesta, memoria corta y fuentes sugeridas.
    *   El contexto del Archivista ahora combina Archivo IA, grimorio, bestiario, flora, misiones y eventos antes de consultar el endpoint seguro de Vercel.
    *   Se sumaron metricas compactas de fuentes disponibles y badge de proveedor/modelo cuando el backend lo devuelve.
    *   `.env.example` de la app documenta `EXPO_PUBLIC_ARCHIVIST_AI_API_URL` para builds nativos.
*   **Notas/Advertencias:** Validado con `npm run typecheck` en `apps/mobile`. La IA depende del endpoint de Vercel y de las variables backend ya configuradas alli.

### [Fecha: 30/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/profile.tsx`
*   **Resumen de Tareas:** Se continuo la nivelacion de la app nativa con una Fase 2 enfocada en convertir el perfil movil en centro de actividad del jugador.
*   **Cambios Clave:**
    *   El perfil ahora resume misiones tomadas, eventos en los que participa y evidencias pendientes de revision.
    *   Se agregaron tarjetas compactas para ver misiones y eventos activos del jugador sin salir de Perfil.
    *   El pull-to-refresh del perfil ahora refresca oro, inventario, misiones, eventos y estados personales.
    *   Se mantuvieron compras, inventario e historial local sin cambiar reglas de economia.
*   **Notas/Advertencias:** Validado con `npm run typecheck` en `apps/mobile`, `npx tsc --noEmit` y `npm run build` desde raiz. No se tocaron reglas de recompensas ni SQL.

### [Fecha: 30/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/src/features/events/eventsService.ts`, `apps/mobile/src/features/missions/missionsService.ts`, `apps/mobile/src/features/shared/types.ts`
*   **Resumen de Tareas:** Se inicio la Fase 1 de nivelacion entre web y app nativa, llevando misiones y eventos desde lectura simple hacia flujos accionables para jugadores.
*   **Cambios Clave:**
    *   La app nativa ahora permite postularse a misiones desde Biblioteca, ver el estado propio y enviar un resumen de evidencia para revision del staff.
    *   Eventos ahora muestran participantes publicos, estado personal del jugador, cupos, recompensa de participacion y acciones para unirse o salir antes del inicio.
    *   Se agregaron servicios nativos para claims de misiones, participaciones de eventos y validaciones basicas contra Supabase.
    *   La pantalla Biblioteca se adapto a un flujo mobile-first con tarjetas compactas, detalle expandible y feedback contextual.
*   **Notas/Advertencias:** Validado con `npm run typecheck` en `apps/mobile`, `npx tsc --noEmit` y `npm run build` desde raiz. Esta fase no agrega panel admin nativo ni subida de imagen de evidencia en la app.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/admin/AdminControlPrimitives.tsx`, `src/utils/aiDebug.ts`
*   **Resumen de Tareas:** El debug visual de IA se redujo a un badge mas compacto y ahora soporta respuestas servidas por OpenRouter.
*   **Cambios Clave:**
    *   El panel ahora prioriza `proveedor + modelo` en formato minimalista.
    *   Solo aparecen indicadores extra si hubo `fallback` o si el pool quedo agotado.
    *   Los tipos de debug fueron ampliados para aceptar `openrouter` como proveedor valido.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_serverAiProviders.ts`, `api/admin/_aiOrchestrator.ts`, `.env.example`
*   **Resumen de Tareas:** Se agrego OpenRouter como proveedor backend adicional de IA para la web, usando una sola key y una cadena de modelos free.
*   **Cambios Clave:**
    *   El orquestador backend ahora reconoce `OPENROUTER_API_KEY` y `OPENROUTER_API_KEYS` como nueva fuente valida de generacion de texto y JSON.
    *   Se implemento fallback interno por modelos en OpenRouter con `nvidia/nemotron-3-super-120b-a12b:free`, `google/gemma-4-31b-it:free` y `google/gemma-4-26b-a4b-it:free`.
    *   OpenRouter se suma al flujo de debug de intentos para que el staff pueda detectar cuando la IA cae a este proveedor.
    *   `.env.example` ahora documenta la key unica y los tres modelos configurables de OpenRouter.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit` y `npm run build`. El orden actual mantiene Gemini, Groq y NVIDIA directos primero; OpenRouter entra como proveedor adicional/fallback del backend.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/generate-market-item.ts`, `src/utils/marketAi.ts`, `src/components/AdminControlSheet.tsx`, `.env.example`
*   **Resumen de Tareas:** El picker de Pinterest dejo de ser solo visual y ahora puede generar borradores de items del mercado con IA a partir del pin cargado.
*   **Cambios Clave:**
    *   Se creo un endpoint IA para mercado que toma la referencia visual del pin y devuelve un borrador normalizado con nombre, descripcion, habilidad, precio, rareza, categoria y stock.
    *   El panel admin del mercado ahora incluye un bloque `Crear item con IA` que usa el pin como semilla y aplica el borrador directamente al formulario.
    *   La interfaz se rehizo para que Pinterest se vea como una referencia visual util y no solo como un test tecnico.
    *   Se agrego `VITE_MARKET_AI_API_URL` para poder apuntar el generador de items a un endpoint explicito si hace falta.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit` y `npm run build`. El flujo usa Pinterest como referencia de entrada, no como almacenamiento final recomendado para la imagen del item.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/extract-pinterest-reference.ts`, `src/components/AdminControlSheet.tsx`
*   **Resumen de Tareas:** Se limpio el comportamiento del picker de Pinterest para evitar que meta texto basura en los items del mercado.
*   **Cambios Clave:**
    *   El backend ahora filtra titulos y descripciones genericas de Pinterest como `Pin by...`, `discovered by...` o textos promocionales del sitio.
    *   Si Pinterest solo entrega una imagen util, el panel aplica esa imagen pero no ensucia nombre/descripcion con metadata irrelevante.
    *   El feedback visual ahora aclara si se aprovecho solo la imagen o si tambien hubo texto util para autocompletar.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Sigue siendo un test de referencia visual, no una integracion oficial de catalogo Pinterest.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/extract-pinterest-reference.ts`, `src/utils/pinterestPicker.ts`, `src/components/AdminControlSheet.tsx`, `.env.example`
*   **Resumen de Tareas:** Se agrego un `Pinterest image picker` experimental por URL para testear referencias visuales en el panel de mercado.
*   **Cambios Clave:**
    *   Se creo un endpoint serverless que recibe una URL de pin, sigue redirecciones e intenta extraer `og:image`, titulo y descripcion del pin.
    *   El panel admin del mercado ahora incluye un bloque de prueba donde el staff pega la URL de Pinterest y carga la referencia visual en el item.
    *   Cuando la referencia responde bien, el sistema aplica la imagen al formulario y completa nombre/descripcion solo si esos campos estaban vacios.
    *   Se agrego `VITE_PINTEREST_PICKER_API_URL` como variable opcional para apuntar a un endpoint explicito.
*   **Notas/Advertencias:** Es una prueba de comportamiento, no una integracion oficial de busqueda de Pinterest. Si Pinterest bloquea un pin concreto, el panel devuelve feedback controlado. Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/admin/AdminStaffAssistant.tsx`
*   **Resumen de Tareas:** Se rediseÃ±o el panel `Staff IA` para que cualquier miembro del staff pueda usarlo sin perderse.
*   **Cambios Clave:**
    *   El formulario ahora se organiza en 3 pasos claros: que revisar, parametros de trabajo y limites/condiciones.
    *   Cada tipo (`Mision`, `Evento`, `Recompensa`, `Lore`, `Mercado`, `General`) muestra ayuda contextual, ejemplos y mini checklist.
    *   Se agregaron presets rapidos de carga baja/media/alta y una vista resumen de participantes, dificultad y oro antes de analizar.
    *   El estado vacio del dictamen ahora explica mejor que debe hacer el staff para obtener una recomendacion.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. No aparecio `package-lock.json`.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/advise-staff.ts`, `src/utils/staffAi.ts`, `src/components/admin/AdminStaffAssistant.tsx`
*   **Resumen de Tareas:** Se corrigio el crash del Asistente de staff cuando la IA devolvia respuesta incompleta o vacia.
*   **Cambios Clave:**
    *   El backend ahora normaliza de forma segura respuestas `undefined`, vacias o parciales antes de construir el dictamen.
    *   El cliente valida la estructura recibida antes de renderizarla y muestra un error controlado si la IA no responde con JSON util.
    *   El panel limpia el resultado previo cuando ocurre un fallo para evitar que quede un estado mezclado.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. No aparecio `package-lock.json`.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/advise-staff.ts`, `api/admin/_aiPrompts.ts`, `api/admin/ask-archivist.ts`, `src/components/ArchivistSection.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminStaffAssistant.tsx`, `src/utils/archivistAi.ts`, `src/utils/staffAi.ts`, `.env.example`
*   **Resumen de Tareas:** Se agrego memoria tematica al Archivista y un Asistente de staff IA en el panel admin.
*   **Cambios Clave:**
    *   El Archivista ahora permite fijar temas activos como chips locales para orientar busqueda y continuidad sin convertirlos en canon.
    *   El endpoint del Archivista recibe memoria tematica y la incluye en prompt/cache de forma segura.
    *   Se creo `advise-staff` para analizar misiones, eventos, recompensas, lore, mercado o decisiones generales con IA.
    *   El panel admin suma la pestaÃ±a `Staff IA` con recomendaciones de riesgo, dificultad, cupos, oro, checklist y texto publicable.
*   **Notas/Advertencias:** La memoria tematica vive en `localStorage`; no toca Supabase ni reglas economicas. Requiere `VITE_STAFF_AI_API_URL` si se quiere endpoint explicito en Vercel.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_aiOrchestrator.ts`, `api/admin/_aiCache.ts`, `api/admin/_aiPrompts.ts`, `api/admin/ask-archivist.ts`, `api/admin/analyze-magic-balance.ts`, `api/admin/generate-mission.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-bestiary.ts`, `src/components/ArchivistSection.tsx`, `src/components/AdminGrimoireManagers.tsx`, `src/utils/archivistAi.ts`, `src/utils/grimoireAi.ts`, `src/utils/knowledge.ts`
*   **Resumen de Tareas:** Se consolido la arquitectura IA y se potenciaron Archivista y balanceador de magias.
*   **Cambios Clave:**
    *   Se agrego un orquestador servidor para centralizar proveedores IA, fallback y mensajes de configuracion.
    *   Se separaron prompts de Archivista y balance de magias en un registry reutilizable.
    *   El Archivista ahora usa fragmentos rankeados, cache corta y nuevos modos `Narrador` y `Staff`.
    *   El balanceador devuelve scores, riesgos, ajustes por nivel, veredicto y borrador aplicable sin guardar automaticamente.
    *   Generadores de misiones, magias y bestiario ahora usan la misma capa servidor IA.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. No se tocaron reglas de oro, Supabase/RLS ni economia.

### [Fecha: 29/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/ask-archivist.ts`, `api/admin/analyze-magic-balance.ts`, `src/components/ArchivistSection.tsx`, `src/components/AdminGrimoireManagers.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `src/utils/archivistAi.ts`, `src/utils/grimoireAi.ts`, `src/utils/knowledge.ts`, `.env.example`
*   **Resumen de Tareas:** Se amplio el Archivista de lore y se agrego un balanceador IA para magias existentes.
*   **Cambios Clave:**
    *   El Archivista ahora permite modos `Canon`, `Profundo` y `Mecanicas`, con mas contexto cuando corresponde y mejor priorizacion de fuentes.
    *   Se creo el endpoint `analyze-magic-balance` para revisar una magia y sugerir mantener, buff, nerf o mejora sin modificar automaticamente el canon.
    *   El panel admin de Magias incorpora el balanceador con selector de modo, enfoque libre, resultado revisable y debug IA.
    *   Se ajusto el debug IA para mostrar correctamente intentos de NVIDIA ademas de Gemini/Groq.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Para produccion, configurar `VITE_MAGIC_BALANCE_AI_API_URL` en Vercel si se quiere URL explicita; si no, deriva desde el endpoint de misiones.

### [Fecha: 28/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`
*   **Resumen de Tareas:** Se corrigieron desbordes visuales del Mercado/Taberna en iPhone 12 Pro Max.
*   **Cambios Clave:**
    *   El selector de minijuegos ahora usa etiquetas cortas y ancho controlado en movil para evitar texto montado.
    *   Se agrego espacio inferior seguro a la zona de juego para que la navegacion fija no tape controles.
*   **Notas/Advertencias:** Ajuste visual mobile-first; no cambia logica ni economia de minijuegos.

### [Fecha: 28/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernTowerDefense.tsx`
*   **Resumen de Tareas:** Se ajusto la dificultad y el layout activo del minijuego tower defense.
*   **Cambios Clave:**
    *   Se aumentaron los costes de las torres y se redujeron recursos/vidas iniciales por dificultad.
    *   Las oleadas ahora tienen mas enemigos, aparecen mas rapido y escalan mas vida por ronda.
    *   Durante una oleada activa se ocultan los paneles de Partida y Mapa, dejando solo estado y controles para ganar espacio en movil.
*   **Notas/Advertencias:** Cambio validado como ajuste de balance del minijuego; no se modificaron recompensas ni schema Supabase.

### [Fecha: 28/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernTowerDefense.tsx`, `src/sections/MarketSection.tsx`
*   **Resumen de Tareas:** Se anadio un minijuego tower defense completo a la taberna del Mercado.
*   **Cambios Clave:**
    *   Se creo `TavernTowerDefense` con canvas responsive, tres mapas, tres dificultades, cuatro torres pixel-art y oleadas 5/5.
    *   Se integro el modo `Defensa` en el selector lazy de la taberna para no cargarlo en la pantalla inicial.
    *   Se agrego recompensa de oro real al completar la oleada 5/5, escalada por dificultad y limitada por jugador/dia/dificultad desde localStorage.
*   **Notas/Advertencias:** La recompensa actual usa `setPlayerGold` del perfil activo y un bloqueo local anti-farmeo. Para blindaje total contra abuso futuro conviene mover el cobro a una RPC Supabase.

### [Fecha: 28/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `.gitignore`
*   **Resumen de Tareas:** Se configuro Supabase CLI en el entorno local y se vinculo el repo con el proyecto cloud real de Kingdoom.
*   **Cambios Clave:**
    *   Se verifico que el proyecto vinculado sea `sibisgiwmgdrpfkzmkkw`.
    *   Se agrego `supabase/.temp/` al `.gitignore` para evitar subir metadata local del CLI.
*   **Notas/Advertencias:** `supabase status` requiere Docker local y no aplica al proyecto cloud. Las consultas remotas con `db query --linked` pueden requerir password/conexion adicional.

### [Fecha: 28/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/main.tsx`, `src/components/AppErrorBoundary.tsx`, `src/components/EventCard.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/CharImportModal.tsx`, `src/components/CharSheetModal.tsx`, `src/components/LibrarySection.tsx`, `src/components/PurchaseModal.tsx`, `src/components/TavernGame.tsx`, `src/index.css`
*   **Resumen de Tareas:** Se realizo un chequeo general de la web en movil/escritorio, con optimizacion de carga inicial, proteccion ante crashes visuales y ajuste responsive.
*   **Cambios Clave:**
    *   Se diferio la carga de utilidades de eventos, misiones y settings para reducir el chunk inicial de la pagina.
    *   Se agrego un `AppErrorBoundary` para que un fallo de UI no deje la pantalla en blanco y permita recargar.
    *   Se activo carga diferida/decodificacion asincrona en imagenes de modales, mapas, cofres y evidencia.
    *   Se reforzo la contencion mobile del shell y la navegacion inferior para evitar desbordes horizontales.
    *   Se limpiaron textos redundantes del perfil para mejorar legibilidad y ocupar menos espacio.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run build`, busqueda de mojibake/logs peligrosos y capturas locales de movil/escritorio.

### [Fecha: 27/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/grimoire.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/src/components/KingdoomUI.tsx`, `apps/mobile/src/components/ScreenShell.tsx`, `apps/mobile/src/features/grimoire/grimoireService.ts`, `apps/mobile/src/features/missions/missionsService.ts`, `apps/mobile/src/features/shared/types.ts`, `apps/mobile/src/theme/colors.ts`, `api/admin/_serverAiProviders.ts`, `api/admin/generate-mission.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-bestiary.ts`, `api/admin/ask-archivist.ts`, `src/utils/missionAi.ts`, `src/utils/grimoireAi.ts`, `src/utils/archivistAi.ts`, `src/utils/documentExtract.ts`, `src/utils/aiDebug.ts`, `.env.example`
*   **Resumen de Tareas:** Se remodelo la app nativa con una capa visual propia inspirada en la web y se conectaron secciones actuales como misiones, grimorio, bestiario y flora.
*   **Cambios Clave:**
    *   Se creo `KingdoomUI` con tarjetas, pills, buscador, acciones, metricas, estados vacios y entrada animada para unificar la estetica nativa.
    *   Inicio, Mercado, Biblioteca y Grimorio ahora usan una estructura mas premium, compacta y mobile-first, con filtros horizontales y detalles en sheet.
    *   La app nativa ya consulta magias, bestiario, flora y misiones publicas desde Supabase mediante servicios dedicados.
    *   Se amplio el fallback de endpoints IA para que GitHub Pages pueda apuntar al backend de Vercel si faltan variables `VITE_*`.
    *   Se corrigio el crash `ERR_MODULE_NOT_FOUND` de las Functions IA moviendo el helper server-only a `api/admin/_serverAiProviders.ts`.
    *   Se anadio NVIDIA como tercer proveedor IA configurable con `NVIDIA_API_KEY(S)`, `NVIDIA_MODEL_PRIMARY` y `NVIDIA_MODEL_FALLBACK`.
*   **Notas/Advertencias:** Validado con `apps/mobile npm run typecheck`, `npx tsc --noEmit`, `npm run build` y carga local de endpoints con `tsx`. No se genero `package-lock.json`.

### [Fecha: 27/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/serverAiProviders.ts`, `src/utils/aiDebug.ts`, `src/components/admin/AdminControlPrimitives.tsx`, `api/admin/generate-mission.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-bestiary.ts`, `api/admin/ask-archivist.ts`, `.env.example`
*   **Resumen de Tareas:** Se integrÃ³ soporte de Groq como proveedor IA de respaldo para misiones, magias, bestiario y Archivista, con posibilidad de varias keys y debug admin ampliado por proveedor.
*   **Cambios Clave:**
    *   Se creÃ³ un motor compartido en `src/utils/serverAiProviders.ts` para manejar Gemini y Groq fuera de `api/admin`, evitando repetir lÃ³gica y manteniendo compatibilidad con Vercel.
    *   Los endpoints de misiones, magias, bestiario y Archivista ahora pueden responder con `Gemini -> Groq` como cadena de fallback.
    *   Se aÃ±adiÃ³ soporte para `GROQ_API_KEYS` ademÃ¡s de `GROQ_API_KEY`, junto con `GROQ_MODEL_PRIMARY` y `GROQ_MODEL_FALLBACK`.
    *   El debug admin ahora contempla proveedor y modelo, para que staff pueda ver si la llamada saliÃ³ por Gemini o por Groq.
*   **Notas/Advertencias:**
    *   La extracciÃ³n de PDF sigue dependiendo de Gemini, porque ese flujo actual usa inline PDF y no se migrÃ³ a Groq.

### Plantilla de Nueva Entrada (Copiar y usar)
```markdown
### [Fecha: DD/MM/AAAA] - [Autor: Antigravity / Jarvis / Usuario]
*   **Archivos Modificados:** `ruta/al/archivo.ext`, `ruta2/al/archivo2.ext`
*   **Resumen de Tareas:** Breve descripcion de lo que se hizo.
*   **Cambios Clave:**
    *   Detalle 1
    *   Detalle 2
*   **Notas/Advertencias:** (Ej: Falla tal cosa, falta conectar tal otra. Dejar vacio si todo OK).
```

---
### [Fecha: 27/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `src/components/admin/AdminControlPrimitives.tsx`
*   **Resumen de Tareas:** Se compacto la tarjeta de debug IA del panel admin para que ocupe mucho menos espacio y se lea como una franja tecnica discreta.
*   **Cambios Clave:**
    *   Se reemplazo la cuadricula de metricas por chips compactos con modelo, key usada, fallback, margen y cuotas.
    *   El resumen de intentos quedo en una sola linea inferior, mas corto y limpio.
    *   Se corrigio tambien el separador visual que estaba saliendo con caracter roto.
*   **Notas/Advertencias:** El debug sigue mostrando la misma informacion util para staff, pero con mucha menos carga visual en movil y escritorio.

---
### [Fecha: 27/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `api/admin/generate-mission.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-bestiary.ts`, `api/admin/ask-archivist.ts`, `api/admin/extract-pdf-text.ts`
*   **Resumen de Tareas:** Se amplio la rotacion automatica de Gemini para que tambien salte a la siguiente API key cuando una cuenta devuelve `API key expired` o `invalid api key`.
*   **Cambios Clave:**
    *   Los endpoints IA ya no se quedan clavados en la primera key si Gemini responde que esta vencida o no es valida.
    *   La rotacion ahora cubre cuota, rate limit, key expirada y key invalida dentro del mismo pool de `GEMINI_API_KEYS`.
    *   Esto aplica tanto a misiones, magias, bestiario y Archivista como a la extraccion de PDF.
*   **Notas/Advertencias:** Si todas las keys estan vencidas o invalidas, igual devolvera error final. La diferencia es que ahora agotara el pool antes de fallar.

---
### [Fecha: 27/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `.env.example`, `api/admin/generate-mission.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-bestiary.ts`, `api/admin/ask-archivist.ts`, `src/utils/aiDebug.ts`, `src/utils/missionAi.ts`, `src/utils/grimoireAi.ts`, `src/utils/archivistAi.ts`, `src/components/admin/AdminControlPrimitives.tsx`, `src/components/admin/AdminMissionManager.tsx`, `src/components/AdminGrimoireManagers.tsx`
*   **Resumen de Tareas:** Se anadio debug opcional de Gemini para staff en los generadores IA y se limpio el ejemplo de variables para no dejar keys reales o de prueba dentro del repo.
*   **Cambios Clave:**
    *   Los endpoints de misiones, magias, bestiario y Archivista ahora pueden devolver metadata de debug sin exponer secrets: modelo, cantidad de keys detectadas, key usada, saltos por cuota, intentos y margen restante.
    *   El panel admin de misiones, magias y bestiario muestra una tarjeta compacta de salud IA para que el staff detecte rapido si ya hubo fallback por cuota y cuantas keys quedan sin tocar en esa llamada.
    *   El `.env.example` vuelve a usar placeholders seguros para `GEMINI_API_KEYS`.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. El debug solo aparece cuando el panel admin pide `includeDebug`, asi que la UX publica no se llena de ruido tecnico.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `api/admin/generate-mission.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-bestiary.ts`, `api/admin/ask-archivist.ts`, `api/admin/extract-pdf-text.ts`, `api/admin/_gemini.ts`
*   **Resumen de Tareas:** Se corrigio el fallo de `FUNCTION_INVOCATION_FAILED` en Vercel devolviendo los endpoints IA a handlers autonomos sin helper compartido dentro de `api/admin`.
*   **Cambios Clave:**
    *   Cada endpoint vuelve a resolver CORS, lectura de keys Gemini y rotacion de cuota dentro de su propio archivo para evitar el crash de carga en serverless.
    *   Se elimino `api/admin/_gemini.ts`, que estaba introduciendo un punto fragil para el runtime de Vercel en este proyecto.
    *   Se mantuvo la compatibilidad con `GEMINI_API_KEYS` y `GEMINI_API_KEY`.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. Hace falta redeploy en Vercel para que los endpoints vuelvan a responder `405 Metodo no permitido` al abrirlos por GET.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `.env.example`, `api/admin/_gemini.ts`, `api/admin/generate-mission.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-bestiary.ts`, `api/admin/ask-archivist.ts`, `api/admin/extract-pdf-text.ts`
*   **Resumen de Tareas:** Se habilito rotacion de multiples API keys de Gemini para evitar que los generadores y el Archivista queden caidos cuando una cuenta agota su cuota.
*   **Cambios Clave:**
    *   El helper `_gemini.ts` ahora acepta `GEMINI_API_KEYS` como lista separada por comas o saltos de linea, con compatibilidad hacia atras para `GEMINI_API_KEY`.
    *   Los endpoints de misiones, magias, bestiario, Archivista y extraccion PDF usan la capa comun y reintentan automaticamente con otra key si Gemini devuelve errores de cuota o rate limit.
    *   `.env.example` documenta el nuevo formato multi-key para Vercel.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. En Vercel puedes dejar una sola key o varias; si usas varias, conviene cargarlas en `GEMINI_API_KEYS`.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `src/components/ArchivistSection.tsx`, `src/utils/archivistSources.ts`
*   **Resumen de Tareas:** Se amplio el Archivista para consultar tambien el canon publicado de la web, no solo documentos cargados manualmente.
*   **Cambios Clave:**
    *   Se agrego una capa `archivistSources` que convierte magias, bestiario, flora, lore, mundo, eventos y misiones visibles en documentos consultables por IA.
    *   El Archivista ahora puede responder preguntas sobre estilos de magia, criaturas, flora, facciones, historia y datos publicados sin duplicar contenido en la base IA.
    *   La seccion mantiene carga lazy para no afectar el arranque de la pagina principal.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. El Archivista depende de las tablas publicadas disponibles en Supabase y usa fallback local donde ya existia.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `.env.example`, `src/App.tsx`, `src/types.ts`, `src/components/ArchivistSection.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminKnowledgeManager.tsx`, `src/utils/knowledge.ts`, `src/utils/archivistAi.ts`, `src/utils/documentExtract.ts`, `api/admin/ask-archivist.ts`, `api/admin/extract-pdf-text.ts`, `supabase_knowledge_documents.sql`
*   **Resumen de Tareas:** Se agrego el sistema `Archivista` como base de conocimiento consultable con IA, carga admin de documentos PDF/TXT/MD y una seccion publica de chat canonico sin reemplazar la navegacion existente.
*   **Cambios Clave:**
    *   Se creo la tabla SQL `knowledge_documents` para guardar lore, reglas, magias, bestiario, flora, eventos, misiones y otros textos visibles u ocultos.
    *   El panel admin ahora incluye `Archivo IA` para cargar documentos manualmente o extraer texto desde PDF/TXT/MD, editar metadatos y administrar la visibilidad.
    *   Se agregaron endpoints Vercel para preguntar al Archivista con Gemini y para extraer texto desde PDF sin exponer la API key al cliente.
    *   La web suma la pestaÃ±a `Archivista`, con busqueda contextual local sobre documentos visibles y respuestas basadas en fuentes cargadas.
    *   `.env.example` documenta las nuevas variables `VITE_ARCHIVIST_AI_API_URL` y `VITE_PDF_EXTRACT_API_URL`.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. Hace falta ejecutar `supabase_knowledge_documents.sql` en Supabase y configurar las variables nuevas en Vercel antes de usar PDF/Archivista en produccion.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `src/types.ts`, `src/components/admin/AdminControlPrimitives.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/AdminGrimoireManagers.tsx`, `src/components/GrimoireSection.tsx`, `src/utils/grimoireContent.ts`, `supabase_grimoire_flora.sql`
*   **Resumen de Tareas:** Se agrego la nueva seccion `Flora` al grimorio con CRUD admin sin IA, vista publica dentro del Grimorio y listas admin compactas con `Leer mas`.
*   **Cambios Clave:**
    *   Se incorporo `FloraEntry` al tipado global y soporte completo en `grimoireContent.ts` para cargar, guardar y borrar entradas desde Supabase.
    *   El panel admin ahora suma `Flora` como editor de naturaleza del mundo, con imagen opcional, campos narrativos y listado lateral editable.
    *   `GrimoireSection.tsx` ahora permite alternar entre `Magias`, `Bestiario` y `Flora`, con buscador adaptado y tarjetas publicas para la flora.
    *   Se unifico el control de listas admin usando `Leer mas / Leer menos`, incluyendo grimorio, bestiario y la nueva flora.
    *   Se dejo `supabase_grimoire_flora.sql` listo para crear la tabla administrable en Supabase.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. Hace falta ejecutar `supabase_grimoire_flora.sql` en Supabase para habilitar la persistencia real de Flora.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `api/admin/generate-bestiary.ts`, `api/admin/generate-magic.ts`
*   **Resumen de Tareas:** Se corrigio el fallo de invocacion en Vercel para los endpoints IA de bestiario y magias, reemplazando la version modular por handlers autonomos con el mismo patron estable del generador de misiones.
*   **Cambios Clave:**
    *   `generate-bestiary.ts` y `generate-magic.ts` ahora llevan CORS, lectura de variables y llamada a Gemini dentro del mismo archivo.
    *   Se elimino la dependencia operativa del helper compartido para evitar `FUNCTION_INVOCATION_FAILED` en Vercel.
    *   Se mantuvo intacto el contrato frontend actual y el formato de salida del parser de magias.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. Hace falta redeploy en Vercel para que esta correccion quede activa.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `.env.example`, `api/admin/_gemini.ts`, `api/admin/generate-bestiary.ts`, `api/admin/generate-magic.ts`, `src/components/AdminGrimoireManagers.tsx`, `src/utils/grimoireAi.ts`
*   **Resumen de Tareas:** Se agregaron asistentes IA para bestiario y magias en el panel admin usando Gemini, respetando el formato actual del grimorio y el schema existente del bestiario.
*   **Cambios Clave:**
    *   Se incorporo `api/admin/_gemini.ts` como helper compartido para CORS, lectura de configuracion Gemini y respuestas JSON/texto.
    *   Se creo `api/admin/generate-bestiary.ts` para generar fichas completas de bestiario listas para cargar en el formulario actual.
    *   Se creo `api/admin/generate-magic.ts` para generar magias en formato TXT estricto compatible con el parser existente de `AdminGrimoireManagers`.
    *   `src/utils/grimoireAi.ts` centraliza las llamadas frontend a ambos endpoints y permite configurar URLs propias o derivarlas desde el endpoint de misiones.
    *   El panel admin ahora incluye un bloque `Asistente IA` tanto en Bestiario como en Magias, con autocompletado de campos y sin tocar el flujo manual del staff.
    *   `.env.example` documenta los endpoints nuevos y actualiza Gemini al modelo `gemini-2.0-flash` como base mas estable.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. Para produccion, configura en Vercel `GEMINI_API_KEY`, `GEMINI_MODEL`, `MISSION_AI_ALLOWED_ORIGINS` y, si quieres apuntar explicito, `VITE_BESTIARY_AI_API_URL` / `VITE_MAGIC_AI_API_URL`.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `.env.example`, `src/components/admin/AdminMissionManager.tsx`, `src/utils/missionAi.ts`, `api/admin/generate-mission.ts`
*   **Resumen de Tareas:** Se integro un generador de misiones con IA para staff usando endpoint backend compatible con Gemini y autocompletado del formulario admin.
*   **Cambios Clave:**
    *   Se creo el endpoint `api/admin/generate-mission.ts` para generar misiones desde backend sin exponer la API key al cliente.
    *   El panel admin de misiones ahora incluye bloque `Asistente IA` con parametros como zona, faccion, tono, tema, restriccion y estilo de combate.
    *   Al generar con IA se rellena automaticamente el formulario de mision con titulo, descripcion, instrucciones, recompensa, cupos, tipo y dificultad.
    *   Se agrego `src/utils/missionAi.ts` para centralizar la llamada al endpoint y soportar URL configurable desde `VITE_MISSION_AI_API_URL`.
    *   `.env.example` ahora documenta la configuracion necesaria para Gemini y los origenes permitidos.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. Para GitHub Pages, configura `VITE_MISSION_AI_API_URL` apuntando al dominio Vercel que expone el endpoint.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `package.json`, `src/hooks/useGsapStaggerReveal.ts`, `src/App.tsx`, `src/sections/MarketSection.tsx`, `src/components/AdminControlSheet.tsx`
*   **Resumen de Tareas:** Se implemento fase 1 y 2 de animaciones GSAP con despliegue gradual en Home, Mercado y Panel Admin sin romper la estructura mobile-first.
*   **Cambios Clave:**
    *   Se agregaron `gsap` y `@gsap/react` al proyecto.
    *   Se creo el hook reutilizable `useGsapStaggerReveal` con cleanup, scope por contenedor y respeto de `prefers-reduced-motion`.
    *   Home ahora usa `data-gsap-home` para revelar bloques clave sin tocar logica de datos.
    *   Mercado ahora usa `data-gsap-market` para animar encabezados, taberna, filtros y paneles de catalogo.
    *   Admin ahora usa `data-gsap-admin` en tabs y secciones principales para mantener fluidez visual en modos Jugadores, Misiones, Eventos, Mercado, Magias y Bestiario.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan OK. No se genero `package-lock.json`.

---
### [Fecha: 24/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/utils/events.ts`, `src/components/EventCard.tsx`, `src/components/AdminControlSheet.tsx`, `src/App.tsx`, `supabase_realm_events_participation.sql`
*   **Resumen de Tareas:** Se agrego cupo maximo por evento con control en Supabase y visualizacion completa en panel admin + vista publica.
*   **Cambios Clave:**
    *   Nuevo campo `maxParticipants` en eventos (0 = sin limite) disponible para admin al crear/editar.
    *   El flujo de union de eventos ahora valida cupo antes de insertar y devuelve mensaje claro cuando esta completo.
    *   Se reforzo base de datos con `max_participants` y trigger `enforce_realm_event_participant_capacity` para evitar sobrecupo por concurrencia.
    *   Vista publica (`EventCard`) ahora muestra capacidad (`actual/max`), badge de cupo completo y bloquea el boton de union cuando no hay lugares.
    *   En admin se muestra cupo en listado, detalle seleccionado y bloqueo de alta manual cuando se alcanza el limite.
*   **Notas/Advertencias:** Ejecutar nuevamente `supabase_realm_events_participation.sql` en Supabase antes de usar cupos en produccion. `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/EventCard.tsx`, `src/components/AdminControlSheet.tsx`, `src/types.ts`, `src/utils/events.ts`, `supabase_realm_events_participation.sql`
*   **Resumen de Tareas:** Se implemento participacion publica en eventos con entrada/salida previa al inicio, listado visible de participantes y recompensa grupal entregable al cierre.
*   **Cambios Clave:**
    *   Los jugadores ahora pueden unirse o salir de eventos desde la vista publica mientras el evento siga antes de inicio; al comenzar queda bloqueada la salida.
    *   Cada tarjeta de evento muestra participantes publicos, estado del jugador y recompensa grupal si existe.
    *   El panel admin ahora permite configurar `Recompensa grupal (oro)`, agregar participantes manualmente, ver pagos pendientes y entregar recompensa solo cuando el evento esta finalizado.
    *   Se creo `supabase_realm_events_participation.sql` con tabla `realm_event_participants`, columna `participation_reward_gold`, RLS, triggers e indices.
*   **Notas/Advertencias:** Ejecutar `supabase_realm_events_participation.sql` en Supabase antes de usar la participacion de eventos en produccion.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`
*   **Resumen de Tareas:** Se simplifico el formulario de evidencia en misiones para dejar solo resumen + galeria.
*   **Cambios Clave:**
    *   Se removieron los campos "Link opcional" y "URL de imagen opcional" de la tarjeta de evidencia.
    *   El flujo queda con `Resumen de evidencia` + `Adjuntar desde galeria`.
    *   El boton de envio ahora exige resumen o archivo adjunto para evitar envios vacios.
*   **Notas/Advertencias:** La carga por galeria y limpieza automatica de imagen al pagar recompensa se mantiene activa.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/types.ts`, `src/utils/missions.ts`, `supabase_realm_missions.sql`
*   **Resumen de Tareas:** Se habilito carga de evidencia por galeria y limpieza automatica de imagen tras validacion/admin payout.
*   **Cambios Clave:**
    *   En la tarjeta de mision el jugador ahora puede adjuntar imagen local (`input file`) con preview antes de enviar.
    *   La evidencia se sube a Supabase Storage (`mission-evidence`) y guarda `proof_image_url` + `proof_image_path`.
    *   Al marcar recompensa entregada en admin, se elimina el archivo del bucket y se limpia la referencia en la claim.
    *   SQL actualizado con columna `proof_image_path`, creacion de bucket y politicas de lectura/escritura para evidencias.
*   **Notas/Advertencias:** Ejecutar nuevamente `supabase_realm_missions.sql` para crear bucket/policies y nueva columna antes de usar adjuntos por galeria.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/data/missions.ts`, `src/utils/missions.ts`, `src/App.tsx`, `src/components/admin/AdminMissionManager.tsx`, `supabase_realm_missions.sql`
*   **Resumen de Tareas:** Se implemento el flujo completo de postulacion/entrega/validacion de misiones con cupos por encargo y evidencias visibles para staff.
*   **Cambios Clave:**
    *   Misiones ahora manejan `maxParticipants` (cupo maximo) y se valida en servidor antes de permitir nuevas postulaciones.
    *   El jugador ve su estado real por mision (Postulado / Pendiente validar / Aprobada) y puede enviar evidencia (texto, enlace o imagen URL) desde su tarjeta.
    *   Se agrego panel de avisos en admin (campana) con pendientes de validacion y acceso rapido a cada entrega.
    *   En participantes de admin ahora se muestra mini bloque de evidencia con preview de imagen y enlaces.
    *   Se actualizo SQL de Supabase para agregar columnas de cupo y evidencia de forma idempotente.
*   **Notas/Advertencias:** Ejecutar `supabase_realm_missions.sql` actualizado antes de usar evidencias/cupos en produccion. `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `index.html`, `src/App.tsx`
*   **Resumen de Tareas:** Se aplicaron optimizaciones enfocadas en mejorar FCP/LCP segun el reporte de PageSpeed.
*   **Cambios Clave:**
    *   Fuentes de Google pasaron a carga no bloqueante con `preload + media=print + onload`, manteniendo fallback para `noscript`.
    *   `PlayerProfilePanel` se movio a carga diferida (`lazy + Suspense`) para reducir JavaScript inicial en la ruta critica.
    *   Se agrego skeleton visual en el fallback del perfil para conservar UX mientras carga el chunk.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. Recomendado volver a medir en PageSpeed despues del deploy.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`
*   **Resumen de Tareas:** Se elimino la repeticion del dato de fichas en el bloque premium del perfil.
*   **Cambios Clave:**
    *   Se retiro el pill superior de "Fichas".
    *   Se retiro el badge de "{n} fichas" junto al nombre del jugador.
    *   El contador de fichas queda en un unico punto visible dentro del bloque de economia.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`
*   **Resumen de Tareas:** Se aplico una fase premium al panel de perfil del jugador para mejorar jerarquia, legibilidad y sensacion de app nativa en movil.
*   **Cambios Clave:**
    *   Se reorganizo el panel en bloques mas claros: identidad del jugador, acciones rapidas, economia y fichas.
    *   Se mejoro el modo compacto para que conserve valor visual y acceso rapido sin sentirse saturado.
    *   Se redisenaron botones y tarjetas internas con un lenguaje mas premium, manteniendo intacta la logica de sesion, inventario, admin y fichas.
    *   Se agregaron componentes internos reutilizables para pills, acciones y metricas del perfil.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. No se tocaron `docs/` ni `awesome-codex-skills/`.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/SectionHeader.tsx`, `src/components/StatCard.tsx`, `src/index.css`
*   **Resumen de Tareas:** Se aplico una fase premium visual mobile-first para que la web se sienta mas moderna, viva y cercana a una app nativa.
*   **Cambios Clave:**
    *   Se agrego un sistema de acento dinamico por seccion (`Inicio`, `Grimorio`, `Biblioteca`, `Mercado`) con ambientacion, brillos y profundidad variable.
    *   La navegacion inferior paso a un dock flotante mas premium con iconos encapsulados, linea activa y mejor lectura tactil.
    *   El contenedor principal ahora usa un marco escenico interno para dar mas sensacion de producto premium en movil.
    *   Se pulieron encabezados y tarjetas de estadisticas con sigilos, acentos tematicos y reflejos sutiles.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. No se tocaron `docs/` ni `awesome-codex-skills/`, que siguen fuera del cambio.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/utils/missions.ts`
*   **Resumen de Tareas:** Se corrigio el intento de tomar misiones locales como si fueran registros UUID de Supabase.
*   **Cambios Clave:**
    *   Se agrego validacion de UUID para misiones persistidas antes de consultar o insertar participantes.
    *   Las misiones de fallback/local ahora quedan como solo lectura en el tablero publico.
    *   Se evita el error `invalid input syntax for type uuid` al tomar plantillas locales.
*   **Notas/Advertencias:** Las misiones deben crearse desde el panel admin para que los jugadores puedan tomarlas.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/utils/grimoireContent.ts`, `src/components/AdminGrimoireManagers.tsx`, `src/components/GrimoireSection.tsx`, `supabase_grimoire_admin.sql`
*   **Resumen de Tareas:** Se ampliaron los campos del Bestiario con enfoque de ficha tecnica (inspirado en carta de criatura) y se conecto todo el flujo admin/publico/Supabase.
*   **Cambios Clave:**
    *   Se agregaron nuevos parametros de bestia: `categoria`, `tipo`, `datos generales`, `nivel de amenaza`, `domesticacion` y `uso`.
    *   El panel admin ahora permite crear/editar esos campos junto a los existentes.
    *   La vista publica del Grimorio muestra los nuevos bloques en cada carta del bestiario.
    *   Se actualizo `supabase_grimoire_admin.sql` con columnas nuevas y `alter table ... add column if not exists` para migracion segura.
*   **Notas/Advertencias:** Ejecutar `supabase_grimoire_admin.sql` en Supabase para crear/agregar columnas antes de usar los nuevos campos en produccion. `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 23/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/admin/AdminMissionManager.tsx`, `src/types.ts`, `src/utils/missions.ts`, `supabase_realm_missions.sql`
*   **Resumen de Tareas:** Se completo el flujo de toma de misiones por jugador y entrega de recompensa desde admin con diseno compacto.
*   **Cambios Clave:**
    *   Se habilito "Tomar mision" en el tablero publico para perfiles conectados.
    *   Se agrego tabla de participantes (`realm_mission_claims`) para registrar uno o varios jugadores por mision.
    *   El panel admin de misiones ahora incluye bloque de participantes: asignar jugador, cambiar estado (Tomada/Completada) y entregar oro.
    *   La entrega de recompensa actualiza oro del jugador y marca la recompensa como pagada para evitar duplicados visuales.
*   **Notas/Advertencias:** Requiere ejecutar `supabase_realm_missions.sql` actualizado. `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 22/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminMissionManager.tsx`, `src/data/missions.ts`, `src/utils/missions.ts`, `src/types.ts`, `supabase_realm_missions.sql`
*   **Resumen de Tareas:** Se implemento el MVP de misiones manuales por WhatsApp con tablero publico y gestor admin.
*   **Cambios Clave:**
    *   Se agrego la seccion publica "Misiones del reino" en Inicio con recompensa, dificultad, tipo y estado.
    *   Se creo la pestana admin "Misiones" para crear, editar, ocultar, pausar/cerrar y borrar encargos.
    *   Se agregaron utilidades Supabase con fallback local para que la web no rompa si la tabla aun no existe.
    *   Se incluyo `supabase_realm_missions.sql` para crear la tabla `realm_missions`.
*   **Notas/Advertencias:** No hay entrega automatica de oro en esta fase. `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 22/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `package.json`, `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `src/components/TavernScratch.tsx`
*   **Resumen de Tareas:** Se hizo limpieza segura del flujo web y se aligero el panel admin sin cambiar reglas de datos/economia.
*   **Cambios Clave:**
    *   Se retiraron scripts y dependencias Capacitor del `package.json` para evitar confundir el flujo actual Expo de la app.
    *   Se elimino del panel admin el codigo muerto de resumen/actividad/ranking que ya no estaba visible en el menu.
    *   Se extrajeron controles reutilizables del admin a `AdminControlPrimitives` y Magias/Bestiario ahora cargan bajo demanda con `Suspense`.
    *   Se corrigio un caracter no UTF-8 residual en Rasca y gana.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. Auditoria de minijuegos realizada sin cambiar reglas economicas.

---
### [Fecha: 22/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `.gitignore`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/grimoire.tsx`, `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/package.json`, `apps/mobile/src/components/DetailSheet.tsx`, `apps/mobile/src/components/ScreenShell.tsx`, `apps/mobile/src/services/supabase.ts`
*   **Resumen de Tareas:** Se realizo chequeo previo a recompilacion APK y se pulio la experiencia visual de la app nativa.
*   **Cambios Clave:**
    *   Se oculto la ruta `index` para eliminar la pestana fantasma del tab bar.
    *   Se ajusto altura/padding de tabs para mejorar lectura en Android.
    *   Se agregaron transiciones nativas suaves en pantallas y hoja de detalle con Reanimated.
    *   Se reemplazo el cierre mojibake del sheet por icono real y se limpiaron textos redundantes.
    *   Se cambio el error tecnico de Supabase por mensaje apto para beta y se fijo `expo-system-ui` a la version compatible con SDK 54.
    *   Se ignoran carpetas `.idea/` para evitar ruido de Android Studio.
*   **Notas/Advertencias:** `npm run typecheck` en `apps/mobile`, `npx expo-doctor`, `npx expo install --check`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 22/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app.json`
*   **Resumen de Tareas:** Se activo New Architecture para destrabar build Android en EAS con Reanimated/Worklets.
*   **Cambios Clave:**
    *   `expo.newArchEnabled` paso de `false` a `true`.
    *   El prebuild remoto de EAS ya no debe fallar por `assertNewArchitectureEnabledTask`.
*   **Notas/Advertencias:** Si existe carpeta `apps/mobile/android` local generada con valor antiguo, regenerar con `npx expo prebuild -p android --clean`.

---
### [Fecha: 22/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/package.json`
*   **Resumen de Tareas:** Se aplico fix de dependencias para estabilizar build Android de la app nativa ante error de resolucion de AsyncStorage.
*   **Cambios Clave:**
    *   Se fijo `@react-native-async-storage/async-storage` en `^2.2.0` (evitando linea inestable que dispara fallo de Gradle con `org.asyncstorage.shared_storage`).
    *   Se mantuvieron scripts de Expo en formato previo para no alterar flujo operativo actual.
*   **Notas/Advertencias:** Si Android Studio conserva cache viejo, borrar `apps/mobile/android`, regenerar con `npx expo prebuild -p android --clean` y volver a sincronizar.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `android/` (eliminado), `capacitor.config.ts` (eliminado), `app-debug.apk` (eliminado)
*   **Resumen de Tareas:** Se retiro por completo el cascaron Android anterior (Capacitor) para evitar confusiones operativas y dejar un unico flujo movil nativo.
*   **Cambios Clave:**
    *   Se elimino la carpeta raiz `android/` asociada al flujo Capacitor.
    *   Se elimino `capacitor.config.ts` para cortar la configuracion del cascaron.
    *   Se elimino `app-debug.apk` en raiz para evitar artefactos ambiguos.
*   **Notas/Advertencias:** El flujo activo para APK queda en `apps/mobile` (Expo/React Native) y su carpeta nativa generada `apps/mobile/android`.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app.json`, `apps/mobile/eas.json`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 11 para preparar el armado de APK beta Android con configuracion de release y versionado.
*   **Cambios Clave:**
    *   Se agrego `apps/mobile/eas.json` con perfiles `development`, `preview` (APK beta) y `production` (AAB).
    *   Se actualizo `app.json` a version beta con `android.versionCode` e `ios.buildNumber`.
    *   README movil incorpora comandos exactos para build beta y chequeo rapido anti-mojibake.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan. Escaneo rapido de texto/codigo (`apps/mobile`, sin `node_modules`) sin hallazgos activos de mojibake.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 10 de hardening beta centrada en recuperacion de errores y robustez de UX en pantallas criticas.
*   **Cambios Clave:**
    *   Mercado, Biblioteca e Inventario suman acciones de `Reintentar` para no dejar estados bloqueados ante fallos de red.
    *   Pantalla Home evita intento de conexion con username vacio.
    *   Se corrigieron textos con mojibake en detalle de Biblioteca.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 9 con resumen de actividad para lectura rapida del estado del jugador en perfil.
*   **Cambios Clave:**
    *   Se agregaron metricas de compras en 7 y 30 dias con gasto total en oro.
    *   Se sumaron indicadores de inventario (`objetos unicos` y `unidades totales`).
    *   El bloque mantiene formato compacto mobile-first para consulta operativa rapida.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 8 con inventario compacto, filtrable y detalle expandible en perfil movil.
*   **Cambios Clave:**
    *   Inventario ahora admite buscador por nombre/ID y filtros por categoria.
    *   Cada item suma accion `Ver detalle` con panel nativo `DetailSheet`.
    *   El detalle muestra imagen, descripcion, habilidad, cantidad e ID para consulta rapida sin recargar UI principal.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 7 con historial de compras filtrable y exportacion rapida desde perfil movil.
*   **Cambios Clave:**
    *   Historial de movimientos ahora admite filtro por ventana (`7 dias`, `30 dias`, `Todo`) y buscador por item/referencia.
    *   Se agrego accion `Compartir` para exportar el listado de movimientos en texto nativo del sistema.
    *   Cada movimiento muestra fecha/hora local para auditoria rapida desde movil.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 6 con UX transaccional por item en el flujo de compra segura del mercado movil.
*   **Cambios Clave:**
    *   La compra pendiente ahora se controla por `itemId`, evitando bloqueo global de toda la lista.
    *   Se incorporo feedback semantico (`success`/`error`) para resultados de compra.
    *   Mientras un item se compra, se deshabilitan solo sus controles locales para prevenir doble accion.
    *   Se corrigio texto mojibake residual en el detalle del item.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/components/DetailSheet.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 5 con vista de detalle expandible para reducir carga visual en listas moviles.
*   **Cambios Clave:**
    *   Se creo componente reutilizable `DetailSheet` (panel inferior modal) para mostrar informacion completa bajo demanda.
    *   Mercado y Biblioteca ahora usan tarjetas compactas con texto reducido y accion `Ver detalle`.
    *   El detalle de Mercado/Eventos muestra contenido extendido e imagen cuando existe URL disponible.
    *   README movil actualizado con alcance de Fase 5.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/components/ScreenShell.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 4 nativa enfocada en UX movil compacta con refresco rapido y filtros de navegacion.
*   **Cambios Clave:**
    *   `ScreenShell` agrega soporte de pull-to-refresh reutilizable para pantallas nativas.
    *   Mercado incorpora buscador y filtros por categoria con chips horizontales, manteniendo compra segura existente.
    *   Biblioteca incorpora buscador y filtros por estado de evento con chips horizontales.
    *   Perfil soporta pull-to-refresh seguro para refrescar oro e inventario sin recargar toda la app.
    *   README movil actualizado con alcance de Fase 4.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/src/features/market/purchaseHistoryStore.ts`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 3 nativa con historial local de compras seguras y visualizacion en perfil.
*   **Cambios Clave:**
    *   Se agrego store persistente `purchaseHistoryStore` para registrar movimientos de compra por jugador.
    *   Cada compra segura exitosa desde Mercado ahora guarda item, cantidad, total, saldo restante y `orderRef`.
    *   Perfil incorpora bloque `Movimientos de compra` compacto con los ultimos registros y accion para limpiar historial local.
    *   Se actualizaron textos de Home/README para reflejar estado actual de la app nativa.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/features/market/purchaseService.ts`, `apps/mobile/supabase_purchase_market_rpc.sql`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se implemento Fase 2 de compra segura nativa del mercado usando RPC en Supabase y refresh de estado local.
*   **Cambios Clave:**
    *   Mercado movil ahora permite seleccionar cantidad y ejecutar `Comprar seguro` por item.
    *   Se agrego `purchaseService` que llama RPC `purchase_market_item` y maneja errores de integridad sin logica critica en cliente.
    *   Tras compra exitosa se refresca oro de sesion y se invalida inventario para reflejar cambios reales.
    *   Se agrego SQL listo para Supabase en `apps/mobile/supabase_purchase_market_rpc.sql` (descuento de oro, control de stock e inventario persistente).
    *   README movil actualizado con seccion de Fase 2.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan. Si no existe la RPC, la app muestra mensaje guiado para ejecutar el SQL.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/src/features/market/marketService.ts`, `apps/mobile/src/features/events/eventsService.ts`, `apps/mobile/src/features/inventory/inventoryService.ts`, `apps/mobile/src/features/shared/types.ts`, `apps/mobile/src/features/session/sessionStore.ts`, `apps/mobile/src/services/supabase.ts`
*   **Resumen de Tareas:** Se avanzo Fase 1 de la app nativa con lectura real desde Supabase para mercado, eventos e inventario, manteniendo modo read-only.
*   **Cambios Clave:**
    *   Mercado movil ahora carga `market_items` y muestra listado con precio, rareza, categoria, stock y destacado.
    *   Biblioteca movil ahora carga `realm_events` y muestra eventos activos con fechas y estado.
    *   Perfil movil ahora carga `player_inventory` del jugador conectado y permite refrescar oro.
    *   Se agregaron servicios nativos por feature (`market`, `events`, `inventory`) y tipos compartidos para mantener orden.
    *   Se reforzo integridad del cliente Supabase en movil: si falta `.env`, muestra mensaje claro en UI en vez de crashear.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build` pasan. No se uso `package-lock.json`.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `package.json`, `apps/mobile/*`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/grimoire.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/src/providers/AppProviders.tsx`, `apps/mobile/src/services/supabase.ts`, `apps/mobile/src/features/session/sessionStore.ts`, `apps/mobile/src/components/ScreenShell.tsx`, `apps/mobile/src/theme/colors.ts`, `apps/mobile/.env.example`, `apps/mobile/README.md`
*   **Resumen de Tareas:** Se inicio la Fase 0 de la app nativa real (sin WebView) con base Expo Router, tabs de Kingdoom y sesion conectada a Supabase.
*   **Cambios Clave:**
    *   Se creo `apps/mobile` como modulo nativo independiente con Expo + TypeScript.
    *   Se configuro navegacion por tabs reales: Inicio, Grimorio, Biblioteca, Mercado y Perfil.
    *   Se agrego capa base tecnica: `QueryClientProvider`, `SafeAreaProvider`, tema movil y layout base reutilizable.
    *   Se implemento sesion inicial por `username` contra tabla `players` en Supabase y persistencia local con Zustand.
    *   Se aniadieron scripts root para ejecutar y typecheck de la app movil (`mobile:start`, `mobile:android`, `mobile:web`, `mobile:typecheck`).
    *   Se elimino `apps/mobile/package-lock.json` para mantener la regla del proyecto.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx tsc --noEmit` (web) y `npm run build` (web) pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`
*   **Resumen de Tareas:** Se aplico el formato de filtros `1+4` pedido para categorias del mercado, priorizando vista compacta en movil.
*   **Cambios Clave:**
    *   Categorias pasan a una sola fila horizontal con scroll, sin ocupar altura extra.
    *   Rareza y orden quedan dentro de un bloque colapsable con boton `Ver filtros`.
    *   El bloque avanzado puede abrir/cerrar con indicador visual, reduciendo ruido cuando no se usa.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan.

---
### [Fecha: 21/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/data/home.ts`, `src/sections/MarketSection.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/RealmRegistry.tsx`, `src/components/TavernExpeditionArcade.tsx`, `src/utils/market.ts`, `src/features/market/market.types.ts`, `src/features/market/market.adapter.ts`, `src/features/market/market.service.ts`, `src/features/market/index.ts`
*   **Resumen de Tareas:** Se aplico una ronda incremental de mejoras moviles, orden administrativo y primer piloto de arquitectura por feature sin reescribir el proyecto.
*   **Cambios Clave:**
    *   Mercado ahora tiene filtros por rareza, orden por destacado/precio y selector de taberna mas compacto con ultimo modo recordado.
    *   Se creo `src/features/market` con tipos, adapter y service, manteniendo compatibilidad desde `src/utils/market.ts`.
    *   Inicio gana accesos rapidos y tarjeta de descarga APK local con version/fecha visible.
    *   Registro publico de fichas queda mas compacto, con retrato miniatura y boton de ficha mas claro.
    *   Expedicion muestra retrato de ficha, rango, progreso compacto y stats PvE + ficha sin textos largos.
    *   Panel admin de Mercado suma previsualizacion del item, etiquetas legibles y barra de acciones pegada para edicion movil.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. Auditoria movil local en 390x844 reviso Inicio, Mercado/Taberna y Admin sin desbordes criticos. Solo se observo 404 de `favicon.ico` en dev local.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/sections/HomeSection.tsx`, `src/sections/MarketSection.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/AppLiveHuntSection.tsx`, `src/components/CharImportModal.tsx`, `src/components/LibrarySection.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/PurchaseModal.tsx`, `src/components/RealmRegistry.tsx`, `src/components/TavernExpeditionArcade.tsx`, `src/components/TavernRoulette.tsx`
*   **Resumen de Tareas:** Se limpio texto explicativo innecesario en secciones publicas, panel admin, compra, biblioteca y minijuegos para una interfaz mas compacta en movil.
*   **Cambios Clave:**
    *   Se retiraron descripciones tecnicas o redundantes de eventos, mercado, ruleta, compra y formularios admin.
    *   Se acortaron avisos visibles para evitar menciones internas como Supabase/Formspree/SQL en la experiencia normal.
    *   Biblioteca, registro publico e importador de fichas quedan con menos ayuda textual y mas espacio util.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. No se creo `package-lock.json`.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/index.css`
*   **Resumen de Tareas:** Se corrigio el desborde del panel admin en vista movil para que vuelva a comportarse como modal contenido y legible.
*   **Cambios Clave:**
    *   El panel admin ahora se renderiza mediante portal en `document.body`, evitando que el contenedor del perfil limite el overlay `fixed`.
    *   Se ajustaron margenes, radios, ancho util y `overflow` del admin en mobile para que formularios y listas no salgan del marco.
    *   La regla global de `.kd-glass` ya no fuerza `position: relative` sobre overlays `fixed` o `absolute`.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. Verificacion movil local en 390x844 confirma overlay full viewport y sin elementos fuera del panel.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/index.css`, `src/App.tsx`, `src/components/SectionHeader.tsx`, `src/components/EventCard.tsx`, `src/components/FilterPill.tsx`, `src/components/StatCard.tsx`, `src/components/ExpandableText.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/GrimoireSection.tsx`, `src/components/AdminControlSheet.tsx`, `src/components/AdminGrimoireManagers.tsx`, `src/components/MarketItemCard.tsx`, `src/sections/MarketSection.tsx`
*   **Resumen de Tareas:** Se aplico una mejora visual global de UI con estetica de fantasia oscura industrial, manteniendo animaciones ligeras y mobile-first.
*   **Cambios Clave:**
    *   Se agrego un sistema visual reusable `kd-*` con glassmorphism oscuro, grano ambiental, staggered reveal, divisores animados, hover glow y feedback tactil.
    *   Inicio, navegacion inferior, tarjetas de eventos, mercado, grimorio, bestiario y panel admin adoptan superficies mas premium y microinteracciones consistentes.
    *   El Grimorio/Bestiario y el Admin ganan mayor jerarquia visual para magias, bestias, filtros, formularios y listas editables.
    *   Mercado y Taberna quedan enmarcados con el nuevo lenguaje visual sin tocar la logica de minijuegos ni cargar animaciones pesadas en el arranque.
    *   Se corrigio un warning de DOM en Home evitando `ExpandableText` dentro de etiquetas `p`.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. Verificacion movil local con Playwright sin errores de consola tras el ajuste.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/main.tsx`, `src/App.tsx`, `src/components/EventCard.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/MarketItemCard.tsx`, `src/index.css`
*   **Resumen de Tareas:** Se aplico una pasada de rendimiento movil enfocada en bajar INP y CLS sin cambiar la logica de juego.
*   **Cambios Clave:**
    *   Vercel Analytics y Speed Insights ahora cargan diferidos despues del arranque inicial.
    *   Se saco Framer Motion del arranque de `App`, `EventCard` y `PlayerProfilePanel`; los modales pesados de fichas/registro cargan bajo demanda.
    *   Las cargas de eventos y enlace APK en Inicio ahora corren en paralelo y actualizan en una transicion no urgente.
    *   Se desactivo el scroll suave global y se agregaron reservas/render diferido en bloques bajos de Inicio para reducir saltos de layout.
    *   Se agregaron hints `decoding`, `width` y `height` a imagenes de eventos, mercado y retratos del perfil.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasan. El chunk inicial bajo de ~74.6 kB a ~48.8 kB en build local.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se retiro el recuadro de `LV PVE / PODER / STATS PVE` del preview en `Mis Personajes` para dejar esas estadisticas solo en la hoja del personaje.
*   **Cambios Clave:**
    *   Se elimino del card-preview el bloque interno de estadisticas PvE que estaba debajo del retrato y datos basicos.
    *   Se limpiaron imports y referencias PvE que quedaron sin uso en el panel de perfil.
*   **Notas/Advertencias:** El detalle de estadisticas sigue visible en la hoja del personaje (`Ver Ficha`), que era el comportamiento solicitado.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/CharSheetModal.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se agrego el bloque de `Estadisticas de juego` dentro de la hoja de personaje usando los mismos datos PvE del preview.
*   **Cambios Clave:**
    *   En la seccion `Progreso PvE` de la hoja ahora aparece un recuadro oscuro interno con `LV PVE`, `PODER` y `STATS PVE`.
    *   Los valores usan exactamente el progreso PvE de la ficha (`level`, `pvePower`, `F/V/D`) para que coincidan con el preview de `Mis Personajes`.
*   **Notas/Advertencias:** Ajuste visual y de consistencia de datos; no cambia logica de progreso.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `src/utils/minigamesSecure.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigio la lectura visual y el cobro manual del minijuego `Multiplicador`.
*   **Cambios Clave:**
    *   La curva del multiplicador ahora usa crecimiento exponencial, arrancando lento y acelerando como los juegos tipo crash.
    *   El grafico conserva mas puntos de trayectoria para que la linea no desaparezca en rondas largas.
    *   El numero del multiplicador durante la subida se movio a un HUD superior para no tapar la linea del canvas.
    *   Al tocar `Asegurar ahora`, el polling se pausa y el cobro queda fijado al multiplicador del click, evitando que la ronda siga subiendo mientras confirma.
    *   El icono de refrescar oro ya no gira por acciones internas del juego; solo gira cuando se pulsa refrescar manualmente.
*   **Notas/Advertencias:** Probado localmente con Playwright: colapso visible, cobro manual congelado y sin spinner permanente.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `src/utils/minigamesSecure.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se recalibro el minijuego `Multiplicador` para que la subida sea mas progresiva y el crash se perciba correctamente.
*   **Cambios Clave:**
    *   La curva del multiplicador ahora tarda mas en llegar a `2.00x`, evitando cobros instantaneos y dando margen real para retirar.
    *   El grafico vuelve a usar una ventana minima de 8 segundos para que la trayectoria no se vea comprimida o demasiado vertical.
    *   Se aclaro en la UI que el retiro automatico debe quedar vacio si se quiere dejar correr la ronda hasta el colapso.
*   **Notas/Advertencias:** Probado localmente sin auto retiro hasta `COLAPSO` y con auto retiro `2.00x` hasta `ENERGIA ASEGURADA`.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `src/utils/minigamesSecure.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigio el minijuego `Multiplicador` para estabilizar la entrada de monto, la subida del multiplicador y la lectura del grafico.
*   **Cambios Clave:**
    *   El monto de apuesta y el retiro automatico ahora usan inputs controlados aptos para movil, permitiendo borrar y escribir sin saltos a `0`.
    *   El grafico usa una subida local suave sincronizada con `startedAt`, mientras el estado seguro sigue siendo resuelto por `minigamesSecure`.
    *   El canvas deja de animar al colapsar/cobrar y escala mejor las rondas cortas para que la curva no quede pegada al borde izquierdo.
*   **Notas/Advertencias:** Se probo localmente con apuesta minima y auto retiro; quedan warnings antiguos de nesting en `HomeSection/ExpandableText`, no relacionados con este cambio.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `src/utils/grimoireContent.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se ajusto la seleccion `Magias / Bestiario` al estilo compacto de Biblioteca y se preservaron las magias base con sus catalogos.
*   **Cambios Clave:**
    *   El Grimorio ahora usa un selector segmentado compacto para alternar entre `Magias` y `Bestiario`, con iconos y estado activo como `Cronicas y Leyes / Mapa y Mundo`.
    *   Las magias administradas en Supabase ya no reemplazan todo el catalogo local: se mezclan con las magias originales.
    *   Si una magia admin tiene el mismo `id` que una base, actua como reemplazo editable; si se borra el registro admin, vuelve a mostrarse la magia base.
*   **Notas/Advertencias:** Las magias viejas siguen viniendo de `src/data/grimorio.ts`; Supabase funciona como capa de edicion y extension.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminGrimoireManagers.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se simplifico la carga de magias para que el staff pueda pegar el formato narrativo completo sin editar JSON manualmente.
*   **Cambios Clave:**
    *   El editor de `Magias` ahora incluye un bloque `Pegar magia completa` con boton `Interpretar formato`.
    *   El parser detecta categoria, titulo del estilo, descripcion y habilidades Lv1-Lv5 con `Efecto`, `CD`, `Limitante` y `Anti-Mano Negra`.
    *   El JSON de niveles queda oculto como seccion avanzada para casos especiales, evitando que el staff tenga que manejarlo en el flujo normal.
*   **Notas/Advertencias:** El formato esperado sigue siendo el estilo narrativo del Grimorio: titulo, `Escala de niveles` y secciones `Habilidades de Lv1` a `Lv5`.

---
### [Fecha: 20/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/types.ts`, `src/components/AdminControlSheet.tsx`, `src/components/AdminGrimoireManagers.tsx`, `src/components/GrimoireSection.tsx`, `src/utils/grimoireContent.ts`, `src/data/home.ts`, `supabase_grimoire_admin.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se retiro `Ranking` de la navegacion publica y se amplio el Grimorio con administracion de magias y bestiario desde Supabase.
*   **Cambios Clave:**
    *   La navegacion publica queda en `Inicio`, `Grimorio`, `Biblioteca` y `Mercado`, sin seccion visible de `Ranking`.
    *   El panel admin ya no muestra `Actividad` y ahora suma pestanas de `Magias` y `Bestiario` para crear, editar y borrar contenido.
    *   `Grimorio` ahora permite alternar entre `Magias` y `Bestiario`, con busqueda y tarjetas de bestias con origen, ubicacion, descripcion, habilidad, rareza e imagen.
    *   Se agrego `supabase_grimoire_admin.sql` para crear las tablas `grimoire_magic_styles` y `grimoire_bestiary_entries` con lectura publica.
*   **Notas/Advertencias:** Ejecutar `supabase_grimoire_admin.sql` en Supabase para activar la persistencia. Hasta entonces, las magias siguen usando el contenido local como fallback y el bestiario queda vacio.

---
### [Fecha: 18/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernRoulette.tsx`, `src/utils/rouletteEngine.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se restauro la version COMPLEJA de la Ruleta de 25 casillas (con mesa de apuestas y sistema de fichas) tras identificar que la anterior restauracion era solo la version simplificada.
*   **Cambios Clave:**
    *   Se restauro `TavernRoulette.tsx` desde el commit `f3cfd05` (18/04/2026): Version de 724 lineas que incluye el tapete de apuestas visual, gestion de fichas y logica local (sin RPC).
    *   Se restauro `rouletteEngine.ts` desde el mismo commit: Soporte para 25 numeros orientada a la mesa de apuestas personalizada.
    *   Esta version recupera la experiencia "premium" de la ruleta pero manteniendo el mazo de 25 numeros solicitado por el usuario.
*   **Notas/Advertencias:** `npm run build` verificado con exito. Esta version funciona de forma local (sin depender de Supabase RPC para el giro).

---
### [Fecha: 18/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se compacto el panel admin para que las listas no ocupen tanta altura y se elimino la pestana visible de `Resumen`.
*   **Cambios Clave:**
    *   El panel ahora abre directamente en `Actividad` y la navegacion visible ya no muestra `Resumen`.
    *   Las listas de `Actividad`, `Jugadores`, `Eventos` y `Mercado` quedaron recortadas por defecto con boton `Ver mas / Ver menos`.
    *   Los bloques de lista se pliegan solos al cambiar filtros o busquedas, evitando que el admin quede inflado despues de cada consulta.
*   **Notas/Advertencias:** La seccion interna de `Resumen` sigue dentro del componente pero ya no es accesible desde la UI, asi que no afecta el flujo diario del admin.

---
### [Fecha: 18/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/scratchSecure.ts`, `src/utils/minigamesSecure.ts`, `src/components/TavernScratch.tsx`, `src/components/TavernRoulette.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se devolvio la taberna a un flujo local sin RPC para que los minijuegos vuelvan a funcionar sin activar SQL extra en Supabase.
*   **Cambios Clave:**
    *   `Rasca` ahora resuelve la tanda, reembolsos y limite diario en cliente, guardando el total bruto del dia por jugador en `localStorage` y actualizando el oro directo en `players`.
    *   `Cartas`, `Ruleta`, `Cofres` y `Crash` pasaron otra vez a sesiones locales por jugador con descuento y pago desde frontend, manteniendo el mercado aparte con su flujo protegido.
    *   Se limpiaron mensajes viejos de `RPC`, `segura` y referencias al flujo anterior para que la UI de la taberna vuelva a sentirse consistente.
*   **Notas/Advertencias:** Este cambio simplifica mucho el uso diario, pero deja los minijuegos sin la capa extra de validacion servidor que se habia montado antes.

---
### [Fecha: 18/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/components/CharSheetModal.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se devolvio el retrato a `Mis Personajes` y la ficha ahora refleja los puntos ganados en Expedicion dentro de los atributos visibles.
*   **Cambios Clave:**
    *   Cada card de personaje vuelve a mostrar la foto del retrato en miniatura para reconocer la ficha de un vistazo.
    *   En la ficha abierta, `Fuerza` y `Defensa` ahora se muestran como base + bonus PvE, y `PV Base` ya suma la inversion de vida de Expedicion.
    *   El bonus proveniente del minijuego se muestra visualmente como `(+X)` para que quede claro que viene de la progresion PvE y no reescribe la base narrativa.
*   **Notas/Advertencias:** `Agilidad`, `Inteligencia` y `Defensa Magica` siguen mostrando solo la ficha base porque Expedicion hoy no invierte puntos en esas ramas.

---
### [Fecha: 18/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernExpeditionArcade.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se hizo plegable la seccion `Mejora del cazador` para que Expedicion arranque todavia mas compacta en movil.
*   **Cambios Clave:**
    *   El bloque de mejoras ahora se abre y cierra con `Ver mejoras / Plegar`, igual que contratos.
    *   La barra de exp y las tres cards de stats solo ocupan pantalla cuando el jugador decide abrirlas.
*   **Notas/Advertencias:** El resumen superior sigue mostrando puntos disponibles, asi que el jugador no pierde referencia aunque el bloque este plegado.

---
### [Fecha: 18/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernExpeditionArcade.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/CharSheetModal.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se compacto `Expedicion` para movil y se hizo visible la progresion PvE dentro de las fichas para que los puntos del minijuego no parezcan perdidos.
*   **Cambios Clave:**
    *   Se limpio el encabezado duplicado del cazador, se recortaron textos explicativos innecesarios y la lista de contratos ahora se despliega y pliega desde un bloque compacto.
    *   Se quitaron del detalle del contrato los textos largos de requisito, puntos de mejora y critico especial para que el foco quede en entrar al combate.
    *   Las fichas ahora muestran `Lv PvE`, `Poder PvE` y `Stats PvE` tanto en `Mis Personajes` como dentro de la ficha abierta, manteniendo separadas las stats base de rol y las del minijuego.
*   **Notas/Advertencias:** La progresion PvE sigue guardandose por separado de la ficha base; ahora ya se ve en UI, pero no reescribe los atributos narrativos originales.

---
### [Fecha: 18/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/data/appLiveHunts.ts`, `src/utils/appLiveHunts.ts`, `src/components/AppLiveHuntSection.tsx`, `src/types.ts`, `supabase_app_live_hunts.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se cerro la Fase 3 de `Caceria comunal` con mutadores por sala, especializaciones por ficha y una presentacion mucho mas premium para la app.
*   **Cambios Clave:**
    *   Cada contrato ahora abre con un mutador vivo que altera dano, amenaza o botin y se muestra como capa tactica principal dentro de la sala.
    *   Las fichas reciben una especializacion (`Vanguardia`, `Bastion`, `Custodio`, `Estratega`) segun sus stats PvE, y esa identidad afecta realmente el resultado de `Asaltar`, `Cubrir`, `Canalizar` o `Sabotear`.
    *   La UI de la sala se rehizo para destacar `Mutador vivo`, `Pulso del frente`, el rol activo de la ficha y el peso de cada integrante sin tapar la jugabilidad movil.
*   **Notas/Advertencias:** Hay que volver a ejecutar `supabase_app_live_hunts.sql`, porque ahora tambien agrega columnas de mutador y especializacion para salas y miembros ya existentes.

---
### [Fecha: 18/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/appLiveHunts.ts`, `src/components/AppLiveHuntSection.tsx`, `src/types.ts`, `supabase_app_live_hunts.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se cerro la Fase 2 de `Caceria comunal` con reparto real de oro al terminar la sala y registro persistente de resultados por integrante.
*   **Cambios Clave:**
    *   Se anadio `app_live_hunt_results` para guardar el resultado final de cada participante con su oro asignado y su peso dentro del contrato.
    *   La resolucion de ronda ahora usa la funcion `settle_app_live_hunt(...)`, que inserta la bitacora, actualiza la sala y, si la caceria termina, paga el oro a `players` sin duplicar recompensas.
    *   La UI de la app ahora muestra `Tu parte del contrato` y un bloque `Reparto final` para que cada jugador vea el pago resuelto dentro de la propia sala.
*   **Notas/Advertencias:** Para activar esta fase en vivo hace falta volver a ejecutar `supabase_app_live_hunts.sql`, porque ahora incluye la tabla de resultados y la funcion SQL de settlement.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AppLiveHuntSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se cerro la Fase 1 de `Caceria comunal` con refresco en vivo por suscripciones de Supabase y una presentacion mucho mas nativa para movil dentro de la app.
*   **Cambios Clave:**
    *   La sala ahora escucha cambios de `app_live_hunts`, `app_live_hunt_members`, `app_live_hunt_actions` y `app_live_hunt_rounds` mediante canales de Supabase en vez de depender de polling.
    *   Se anadio reloj visual por ronda, lectura mas clara del estado del contrato y una barra de acciones fija abajo en movil para jugar con el pulgar sin perder contexto.
    *   La vista principal de la caceria se reorganizo como experiencia mobile-first con chips resumen, cabecera compacta, panel de sala mas legible y bitacora separada.
*   **Notas/Advertencias:** El reloj de ronda es visual y se apoya en `updated_at` del contrato; si luego quieres enforcement duro de tiempo, conviene llevar el deadline al backend.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`, `src/components/AppLiveHuntSection.tsx`, `src/utils/appLiveHunts.ts`, `src/data/appLiveHunts.ts`, `src/utils/platform.ts`, `src/types.ts`, `supabase_app_live_hunts.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se implemento `Caceria comunal` como modo exclusivo de la app Android, con salas, host, uniones por ficha activa de Expedicion, acciones por ronda y persistencia preparada en Supabase.
*   **Cambios Clave:**
    *   La taberna ahora muestra una opcion `Comunal` solo si la app corre dentro de Capacitor; en web no aparece ni se puede abrir.
    *   Se creo el componente `AppLiveHuntSection` con flujo de abrir sala, unirse con la ficha activa, elegir accion (`Asaltar`, `Cubrir`, `Canalizar`, `Sabotear`) y resolver rondas.
    *   La caceria usa el nivel y poder reales de la ficha activa de Expedicion para bloquear contratos y perfilar el aporte de cada integrante.
    *   Se preparo `supabase_app_live_hunts.sql` con tablas para salas, miembros, acciones y bitacora de rondas.
*   **Notas/Advertencias:** La experiencia ya funciona a nivel de app/UI, pero para activarla en vivo de verdad necesitas ejecutar `supabase_app_live_hunts.sql`. La sincronizacion entre jugadores ahora mismo se refresca por polling ligero, no por Realtime todavia.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/data/home.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se dejo un fallback real para la descarga de la app apuntando al APK subido en GitHub, de modo que el boton ya funcione aunque Supabase aun no tenga la URL configurada.
*   **Cambios Clave:**
    *   `COMMUNITY_APP_DOWNLOAD_FALLBACK_URL` ahora apunta al `app-debug.apk` publicado en el repositorio de GitHub.
    *   La web puede mostrar el boton de descarga incluso si `site_settings.community_app_download_url` sigue vacio.
*   **Notas/Advertencias:** Sigue siendo mejor mover el APK a `GitHub Releases` o a un storage dedicado cuando quieras una descarga mas limpia y versionada.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/sections/HomeSection.tsx`, `src/data/home.ts`, `src/utils/siteSettings.ts`, `supabase_site_settings.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se resolvieron textos pendientes del inicio y la descarga de la app ahora puede cargarse directamente desde Supabase en vez de quedar fija en codigo.
*   **Cambios Clave:**
    *   El CTA de `Descargar app de la comunidad` ahora consulta `site_settings.community_app_download_url` en Supabase y usa un fallback local vacio si la tabla o el valor aun no existen.
    *   Se preparo `supabase_site_settings.sql` con la tabla `site_settings`, lectura publica y gestion restringida a admins autenticados.
    *   Se corrigio el texto de primeros pasos para quitar la referencia vieja a `cuenta segura`.
    *   Tambien se alineo `src/sections/HomeSection.tsx` con el home actual para no dejar una version duplicada mostrando el boton viejo de WhatsApp.
*   **Notas/Advertencias:** Para activar la descarga debes ejecutar `supabase_site_settings.sql` y luego guardar la URL final del APK en la fila `community_app_download_url`.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/context/PlayerSessionContext.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/main.tsx`, `src/utils/supabaseClient.ts`, `src/utils/supabaseErrors.ts`, `.env.example`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se retiro la capa de `magic link` y se devolvio el acceso del jugador al flujo simple por nombre, manteniendo el resto del proyecto como estaba.
*   **Cambios Clave:**
    *   `PlayerSessionContext` vuelve a hidratar y refrescar la sesion usando solo el nombre del jugador guardado en `localStorage`.
    *   `PlayerProfilePanel` elimino el bloque de `Cuenta segura beta` y vuelve a mostrar un acceso directo por nombre de jugador.
    *   `main.tsx` ya no envuelve la app con `SupabaseAuthProvider` y se retiro el helper de redirect auth que habia quedado en `supabaseClient`.
    *   Se limpiaron mensajes y variables de entorno que mencionaban `magic link` para no dejar rastro del flujo viejo.
*   **Notas/Advertencias:** Esto devuelve la comodidad del acceso simple, pero tambien elimina la proteccion adicional que habiamos empezado a montar sobre sesiones y ownership.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmRegistry.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/AdminControlSheet.tsx`, `src/App.tsx`, `src/data/home.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se abrio el registro de fichas como catalogo publico de solo lectura, se simplifico el panel admin quitando Plantillas y se dejo listo el acceso para descarga de la app de la comunidad.
*   **Cambios Clave:**
    *   `RealmRegistry` ahora carga todas las fichas al abrirse, las muestra en grid con filtro en vivo y permite revisar cualquier ficha del reino sin editarla.
    *   El acceso al registro publico ya puede abrirse incluso antes de conectar un perfil, para que cualquier visitante pueda consultar personajes.
    *   Se elimino la pestaÃ±a `Plantillas` del panel admin para dejar el centro de control mas limpio.
    *   Se retiro el boton de unirse por WhatsApp del inicio y se anadio un CTA configurable para descargar la app de la comunidad mediante `COMMUNITY_APP_DOWNLOAD_URL`.
*   **Notas/Advertencias:** Para activar el boton de descarga debes rellenar `COMMUNITY_APP_DOWNLOAD_URL` en `src/data/home.ts` con el enlace real del APK o la pagina de descarga.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/data/pve.ts`, `src/utils/pveProgress.ts`, `src/utils/characterSheets.ts`, `src/components/PlayerProfilePanel.tsx`, `src/components/TavernExpeditionArcade.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se rehizo la progresion de Expedicion para que ahora cuelgue de una ficha activa, tenga niveles, experiencia y contratos bloqueados por rango en vez de escalar solo por puntos sueltos.
*   **Cambios Clave:**
    *   El progreso PvE ya no vive por jugador sino por ficha: cada personaje tiene `level`, `exp`, puntos disponibles y stats propios de Expedicion.
    *   Se anadio seleccion de ficha activa para Expedicion en el perfil y se limito la cuenta a un maximo de 2 fichas importadas.
    *   Cada 5 niveles se entrega 1 punto extra de stats, manteniendo ademas el sistema de puntos por victoria de los contratos.
    *   La ficha base ahora aporta bonos de combate a Expedicion, de modo que fuerza, defensa, magia y agilidad del personaje si influyen en el arcade.
    *   Los contratos se ampliaron y ahora tienen `minLevel`, `recommendedPower` y `expReward`, con una curva pensada para que llegar a nivel 15 tome varias semanas de constancia.
*   **Notas/Advertencias:** La progresion sigue guardandose en localStorage por ficha. Si mas adelante quieres blindarla, el siguiente paso natural es mover tambien Expedicion a RPC segura en Supabase.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/minigamesSecure.ts`, `src/components/TavernGame.tsx`, `src/components/TavernCrash.tsx`, `supabase_minigame_chests_crash.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se endurecieron `Cofres` y `Crash` para que apuesta, colapso, premio y saldo se resuelvan desde Supabase en vez de depender del cliente.
*   **Cambios Clave:**
    *   `Cofres` ahora usa una sola RPC segura para descontar, resolver los tres cofres y devolver premio/saldo final.
    *   `Crash` ahora usa una sesion segura en Supabase: iniciar ronda, consultar estado, cobrar y registrar historial salen del servidor.
    *   Se amplio `minigamesSecure.ts` para cubrir lectura/acciones de cofres y crash.
    *   Se anadio `supabase_minigame_chests_crash.sql` con tablas, RLS de lectura propia y RPCs seguras de ambos minijuegos.
*   **Notas/Advertencias:** Debes ejecutar `supabase_minigame_chests_crash.sql` en Supabase antes de volver a usar oro real en `Cofres` y `Crash`.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/minigamesSecure.ts`, `src/components/TavernCards.tsx`, `src/components/TavernRoulette.tsx`, `supabase_minigame_cards_roulette.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se endurecieron `Cartas` y `Ruleta` para que el oro, el resultado y el estado de partida pasen a Supabase en vez de resolverse en el navegador.
*   **Cambios Clave:**
    *   `Cartas` ahora usa una partida segura persistida en Supabase con RPCs para iniciar, adivinar, continuar y cobrar, incluyendo limite diario de ganancias netas.
    *   `Ruleta` ahora usa una sola RPC segura para descontar apuesta, resolver multiplicador y devolver el saldo final y el premio real.
    *   Se anadio `minigamesSecure.ts` como capa cliente para leer estado de cartas y ejecutar RPCs de ambos juegos.
    *   Se anadio `supabase_minigame_cards_roulette.sql` con tablas de auditoria/estado, RLS de lectura propia y funciones seguras para ambos minijuegos.
*   **Notas/Advertencias:** Debes ejecutar `supabase_minigame_cards_roulette.sql` en Supabase antes de volver a usar oro real en `Cartas` y `Ruleta`.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/scratchUtils.ts`, `src/utils/scratchSecure.ts`, `src/components/TavernScratch.tsx`, `supabase_minigame_scratch.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se endurecio `Rasca y gana` para que la compra, el sorteo, el jackpot y el limite diario dejen de resolverse en el cliente y pasen a una RPC segura en Supabase.
*   **Cambios Clave:**
    *   Se alineo la semilla diaria del rasca entre frontend y Supabase con una formula determinista compatible en ambos lados.
    *   Se anadio `scratchSecure.ts` para consultar el progreso diario y ejecutar tandas seguras mediante `play_scratch_batch`.
    *   `TavernScratch` ya no usa `Math.random()` ni `localStorage` para premios o limite diario: ahora prepara la tanda en UI y la resuelve contra Supabase al rascar.
    *   Se anadio `supabase_minigame_scratch.sql` con tablas de auditoria, limite diario, RLS de lectura propia y la RPC segura del minijuego.
*   **Notas/Advertencias:** Debes ejecutar `supabase_minigame_scratch.sql` en Supabase antes de volver a usar dinero real en `Rasca y gana`.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/supabaseErrors.ts`, `src/utils/market.ts`, `src/utils/events.ts`, `src/utils/adminRanking.ts`, `supabase_admin_rls.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se preparo el siguiente anillo de seguridad admin para mercado, eventos y ranking semanal, junto con mensajes mas claros cuando RLS o permisos bloquean escrituras.
*   **Cambios Clave:**
    *   Se anadio `supabase_admin_rls.sql` con una funcion `is_current_user_admin()` y politicas RLS para que `market_items`, `realm_events` y `weekly_activity_rankings` sigan siendo publicos en lectura pero solo editables por admins autenticados.
    *   `market_orders` ahora tambien puede ser leido por admins autenticados para futura supervision del mercado.
    *   `market.ts`, `events.ts` y `adminRanking.ts` detectan mejor errores de permisos y muestran mensajes guiando a usar `Cuenta segura beta` con `is_admin = true`.
*   **Notas/Advertencias:** Debes ejecutar `supabase_admin_rls.sql` en Supabase para activar este cierre de permisos. El siguiente paso fuerte sera migrar recompensas de minijuegos a RPCs seguras.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/purchases.ts`, `src/components/PurchaseModal.tsx`, `supabase_market_purchase.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se migro el flujo de compras del mercado hacia una compra segura basada en RPC para que el oro y el inventario dejen de depender del cliente.
*   **Cambios Clave:**
    *   `PurchaseModal` ya no descuenta oro ni sincroniza inventario desde el frontend; ahora llama a `purchase_market_item` mediante `purchaseMarketItemSecure()`.
    *   Si la RPC no existe o falla, el mercado muestra un error claro y deja de usar el camino inseguro anterior.
    *   Formspree queda como aviso secundario: si falla, la compra economica sigue siendo valida y solo se informa que el aviso debe revisarse manualmente.
    *   Se anadio `supabase_market_purchase.sql` con la tabla `market_orders`, su RLS de lectura propia y la funcion `purchase_market_item(...)` como base segura para economia.
*   **Notas/Advertencias:** Debes ejecutar `supabase_market_purchase.sql` en Supabase antes de volver a usar compras reales del mercado.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/context/PlayerSessionContext.tsx`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se alineo el frontend para la activacion de RLS en `players`: el perfil del reino ahora exige sesion segura autenticada y deja de depender del fallback anonimo por nombre.
*   **Cambios Clave:**
    *   `connectPlayer()` ahora exige una cuenta segura autenticada antes de vincular el jugador del reino.
    *   La hidratacion de perfil ya no intenta restaurar sesiones legacy por `localStorage` sin una cuenta segura valida.
    *   Si el usuario cierra la cuenta segura, la sesion del jugador tambien se limpia para evitar estados mezclados.
    *   El panel de perfil ahora explica que primero va la autenticacion por correo y luego la vinculacion del jugador.
*   **Notas/Advertencias:** Con esto la app queda lista para activar una politica base de `RLS` en `players`, pero el panel admin aun necesitara una capa segura posterior para escrituras globales.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/utils/players.ts`, `src/context/PlayerSessionContext.tsx`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se avanzo en la transicion entre `Supabase Auth` y el sistema actual de `players`, permitiendo empezar a vincular una cuenta segura con un jugador real del reino.
*   **Cambios Clave:**
    *   `PlayerAccount` ahora soporta `authUserId` y `players.ts` detecta si la columna `auth_user_id` existe en Supabase.
    *   Se anadieron helpers para leer jugadores por `auth_user_id` y para vincular un jugador a una cuenta autenticada de Supabase.
    *   `PlayerSessionContext` ahora prioriza el jugador vinculado a la cuenta segura al hidratar sesion y al refrescar perfil.
    *   Si hay `magic link` activo, al conectar el perfil del reino la app intenta vincularlo automaticamente y evita colisiones entre cuentas seguras y jugadores ya reclamados.
    *   El panel de perfil ahora muestra si la cuenta segura ya quedo vinculada al jugador actual.
*   **Notas/Advertencias:** Para que la vinculacion funcione de verdad en Supabase debes crear la columna `players.auth_user_id uuid unique` y protegerla luego con RLS.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/context/SupabaseAuthContext.tsx`, `src/utils/supabaseClient.ts`, `src/main.tsx`, `src/components/PlayerProfilePanel.tsx`, `.env.example`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se preparo la base de `Supabase Auth` en modo transicion para empezar a cerrar seguridad sin romper aun el flujo actual de jugador por nombre.
*   **Cambios Clave:**
    *   Se anadio `SupabaseAuthProvider` con restauracion de sesion, escucha de `onAuthStateChange`, envio de magic link por email y cierre de sesion.
    *   `main.tsx` ahora envuelve la app con el nuevo contexto de autenticacion.
    *   `PlayerProfilePanel` incluye un bloque `Cuenta segura beta` para iniciar sesion por correo con magic link y visualizar el estado autenticado.
    *   `supabaseClient.ts` expone `getSupabaseAuthRedirectUrl()` y `.env.example` documenta la variable opcional `VITE_SUPABASE_AUTH_REDIRECT_URL`.
*   **Notas/Advertencias:** Esta capa aun no liga automaticamente `auth.users` con `players`; por ahora convive con el sistema actual de perfil del reino y sirve como base para la siguiente migracion.

---
### [Fecha: 17/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/context/PlayerSessionContext.tsx`, `src/utils/adminRanking.ts`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se hizo el primer endurecimiento de seguridad visible: el panel admin ya no se concede por nombre especial y el ranking semanal queda descrito como validacion manual del rol hecho por WhatsApp.
*   **Cambios Clave:**
    *   Se elimino el fallback que trataba al usuario `Nothing` como admin si la columna `is_admin` no existia o no venia cargada.
    *   `PlayerSessionContext` ahora considera admin solo a jugadores con `player.isAdmin` real.
    *   Los textos del panel admin dejaron de recomendar nombres especiales y ahora apuntan a `players.is_admin`.
    *   El bloque de actividad semanal deja claro que misiones y eventos se cargan de forma manual tras validar el rol en texto fuera de la web.
*   **Notas/Advertencias:** Esto endurece la UI, pero no sustituye RLS ni backend seguro para oro, ranking, eventos o mercado.

---
### [Fecha: 16/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernRoulette.tsx`, `src/components/TavernScratch.tsx`, `src/components/GrimoireSection.tsx`, `src/assets/ruleta-optimized.jpg`, `src/assets/scratch-win-card-optimized.jpg`, `src/assets/scratch-pristine-card-optimized.jpg`, `src/assets/scratch-lose-card-optimized.jpg`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se reemplazaron los assets pesados de ruleta y rasca por versiones mucho mas livianas y el grimorio ahora carga su dataset grande de forma diferida.
*   **Cambios Clave:**
    *   La ruleta paso de usar `ruleta.png` (~415 KB) a `ruleta-optimized.jpg` (~37 KB).
    *   Las tres cartas del rasca ahora usan versiones optimizadas JPG de ~25-28 KB cada una en vez de PNGs de 156-168 KB.
    *   `GrimoireSection` ya no importa `GRIMOIRE_DATA` en caliente; primero monta la UI y luego carga el dataset del grimorio aparte.
*   **Notas/Advertencias:** Los PNG originales siguen en `src/assets` como respaldo local, pero ya no se usan en runtime.

---
### [Fecha: 16/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/sections/MarketSection.tsx`, `src/sections/RankingSection.tsx`, `vite.config.ts`, `src/components/TavernScratch.tsx`, `src/components/TavernRoulette.tsx`, `src/components/PlayerTradeSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se hizo una pasada real de rendimiento para la SPA: mas code splitting, precarga suave de tabs y ajustes de carga en imagenes grandes o repetidas.
*   **Cambios Clave:**
    *   `Market` y `Ranking` salieron del bundle principal y ahora cargan como secciones lazy propias.
    *   Las tabs publicas ahora disparan precarga en hover, focus o touch para que el cambio de vista se sienta mas inmediato.
    *   Se anadio `manualChunks` en Vite para separar `react`, `motion`, `supabase`, `icons` y secciones pesadas.
    *   Varias imagenes de taberna e inventario ahora usan `decoding=\"async\"` y `loading=\"lazy\"`, y bloques largos usan `content-visibility` en secciones separadas.
*   **Notas/Advertencias:** La ruleta sigue usando `ruleta.png`, que pesa mas de 400 KB; ya no castiga tanto al arranque porque vive fuera del bundle principal, pero si quieres el siguiente paso fuerte es reemplazar ese asset por una version mas liviana o reconstruir la rueda en CSS/SVG.

---
### [Fecha: 16/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernExpeditionArcade.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aÃ±adieron mutadores aleatorios por caceria y criticos especiales por dificultad para darle mas variedad y personalidad al PvE arcade.
*   **Cambios Clave:**
    *   Cada contrato ahora recibe un mutador aleatorio al iniciarse, con efectos reales sobre dano, defensa, fase dos o recompensa final.
    *   Las tres dificultades tienen identidad propia de critico: `Corte preciso` en controlado, `Ruptura brutal` en medio y `Juicio del verdugo` en dificil.
    *   La UI ahora avisa que hay mutador aleatorio, explica el critico especial de cada dificultad y muestra el mutador activo durante el combate.
*   **Notas/Advertencias:** Los mutadores se sortean localmente en cada inicio de caceria y no quedan sincronizados entre dispositivos.

---
### [Fecha: 16/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernExpeditionArcade.tsx`, `src/utils/pveProgress.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se reajusto la progresion de Expedicion para que los contratos controlado y medio tambien puedan otorgar puntos de mejora, sin romper el contador de victorias hard.
*   **Cambios Clave:**
    *   Las victorias en `Controlado` ahora tienen 5% de probabilidad de dar 1 punto, y `Medio` 10%; `Caza dificil` sigue entregando 1 punto garantizado.
    *   La UI de mejoras y las cards de contratos ahora explican claramente la probabilidad de punto segun la dificultad elegida.
    *   El progreso PvE ya no infla `Hard wins` con puntos obtenidos en facil o medio; ese contador sigue reservado a victorias realmente hard.
*   **Notas/Advertencias:** La progresion sigue guardandose en `localStorage`; las probabilidades son locales por cliente y no estan sincronizadas por servidor.

---
### [Fecha: 15/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernCards.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se bloqueo el cobro temprano en Cartas para que `Plantarse y cobrar` se habilite recien desde la segunda ronda.
*   **Cambios Clave:**
    *   El retiro ahora requiere `racha >= 2`.
    *   Se anadio un aviso visual cuando el cobro aun no esta disponible.
    *   Se evito un bloqueo de flujo permitiendo continuar aunque se roce el limite diario antes de desbloquear el retiro.
*   **Notas/Advertencias:** Mantiene la regla del limite diario y no cambia el conteo de ganancia neta ajustado previamente.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernExpeditionArcade.tsx`, `src/data/pve.ts`, `src/types.ts`, `src/utils/pveProgress.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadieron stats mejorables del cazador y limites de contratos por ventana de 6 horas para el PvE arcade.
*   **Cambios Clave:**
    *   El cazador ahora tiene `Fuerza`, `Vida` y `Defensa`, con puntos persistentes en local por jugador.
    *   Solo `Caza dificil` entrega 1 punto por victoria; esos puntos permiten subir stats base.
    *   Los contratos ahora tienen usos por 6 horas: controlado 5, medio 10 y dificil 10.
    *   Las stats ya afectan combate real: mas dano, mas vida total y mas reduccion/esquiva defensiva.
*   **Notas/Advertencias:** La progresion del PvE se guarda en `localStorage`; si luego quieres sincronizarla entre dispositivos, conviene migrarla a Supabase.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/data/pve.ts`, `src/components/TavernExpeditionArcade.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** La expedicion visible pasa a modo arcade, con combate mas limpio para movil y nuevas probabilidades tacticas.
*   **Cambios Clave:**
    *   `Expedicion` ahora usa el componente arcade en la UI activa; la version narrativa queda guardada en codigo como respaldo.
    *   Se anadieron criticos del jugador, defensa con esquiva total o mitigacion, y respuestas enemigas de esquiva, guardia y segunda fase.
    *   Recompensas reajustadas por dificultad: controlado hasta 500, medio hasta 1000 y dificil hasta 1500.
*   **Notas/Advertencias:** Revisado para mobile-first; el panel de combate evita bloques largos de texto y prioriza barras, estado y logs cortos.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/data/pve.ts`, `src/components/TavernExpedition.tsx`, `src/components/TavernExpeditionArcade.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio un PvE narrativo jugable dentro de la taberna y se dejo un modo arcade preparado en codigo sin activarlo.
*   **Cambios Clave:**
    *   Nuevo modo visible `Expedicion` con contratos, log narrativo, acciones por turno y recompensas en oro.
    *   La expedicion descuenta entrada al iniciar y paga botin o recuperacion parcial segun victoria o retirada.
    *   Se creo un componente `TavernExpeditionArcade` como respaldo futuro, sin conectarlo a la UI actual.
*   **Notas/Advertencias:** El PvE usa la sesion global de jugador y no requiere tablas nuevas por ahora.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernCards.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del limite diario en Cartas para contar solo ganancia neta.
*   **Cambios Clave:**
    *   El contador diario ya no suma el pozo bruto cobrado.
    *   Ahora suma solo `ganancia neta = cobro - apuesta inicial`.
*   **Notas/Advertencias:** El ajuste aplica a nuevas partidas; el contador diario se reinicia por fecha.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernRoulette.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Ajuste de probabilidades de la ruleta y mejora de animacion de giro.
*   **Cambios Clave:**
    *   Reemplazo de probabilidades por pesos normalizados para evitar sesgos y hacer los premios altos realmente alcanzables.
    *   Giro extendido: mas rotaciones y mayor duracion total para una sensacion mas epica.
    *   Sincronizacion entre tiempo de animacion y resolucion del resultado.
*   **Notas/Advertencias:** Balance actual favorece mas premios que la version previa.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmRegistry.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de busqueda por jugador en el Registro del Reino.
*   **Cambios Clave:**
    *   El buscador ahora cruza `players.username` con `character_sheets` para encontrar por nombre de jugador.
    *   Soporta esquemas mixtos: `playerId`/`player_id` y `playerUsername`/`player_username`.
    *   Se evita depender de columnas opcionales en el `or(...)` de Supabase, reduciendo falsos negativos.
*   **Notas/Advertencias:** Sin cambios de DB requeridos; usa los datos actuales.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Limpieza visual del bloque de sesion para reducir carga en movil y eliminar controles redundantes.
*   **Cambios Clave:**
    *   Se elimino el bloque visual `Perfil activo` y el boton redundante `Expandir/Compactar` del encabezado.
    *   El boton `Panel` queda como control unico para expandir/compactar.
    *   El cambio de usuario se movio al lado del nombre (icono), y se quitaron botones repetidos en el bloque de oro.
    *   Se removio el refresco manual del oro en esa vista para compactar la interfaz.
    *   Se corrigieron textos con codificacion rota en la seccion de fichas y confirmacion de borrado.
*   **Notas/Advertencias:** Cambio enfocado en UX mobile; no altera logica de Supabase ni de inventario/fichas.

---
### [Fecha: 14/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/CharImportModal.tsx`, `src/components/CharSheetModal.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** OptimizaciÃÂ³n mobile-first para que la navegaciÃÂ³n sea mÃÂ¡s fluida y los modales no queden tapados por la barra inferior.
*   **Cambios Clave:**
    *   El panel `Tu sesion de jugador` ahora se auto-compacta fuera de `Inicio` y permite expandir/compactar manualmente.
    *   Al cambiar de pestaÃÂ±a se hace scroll al inicio (evita que el usuario Ã¢â¬ÅcaigaÃ¢â¬Â a mitad de pÃÂ¡gina en mÃÂ³vil).
    *   Mercado: los catÃÂ¡logos por categorÃÂ­a ya no aparecen abiertos por defecto (reduce scroll infinito).
    *   Modales de fichas (`CharImportModal`/`CharSheetModal`) suben su z-index y ajustan alto/padding para no quedar detrÃÂ¡s de la barra inferior.
*   **Notas/Advertencias:** Sin cambios en la lÃÂ³gica de Supabase o guardado; solo UX/layout.

---
### [Fecha: 13/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `.gitignore`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se protegieron secretos para que un archivo `.env` local nunca se suba al repo por accidente.
*   **Cambios Clave:**
    *   `.gitignore` ahora ignora `.env` y `.env.*` (excepto `.env.example`).
*   **Notas/Advertencias:** Usa `.env.example` como plantilla y crea tu `.env` solo en tu PC. En Vercel, las variables se cargan desde el dashboard.

---
### [Fecha: 13/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/sheetParser.ts`, `src/components/CharSheetModal.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Limpieza total de caracteres de formato (`*`, `-`) al importar fichas y mejora del render de ficha para que listas (Extras/Debilidades/etc.) se vean elegantes con colapsado "Ver mas".
*   **Cambios Clave:**
    *   El parser ahora elimina asteriscos restantes dentro del contenido y omite lÃÂ­neas de plantilla tipo "Noble, plebeyo o burgues" / "En caso de ser".
    *   `CharSheetModal` renderiza bloques tipo lista como bullets y mantiene "Ver mas / Ver menos" para textos largos.
*   **Notas/Advertencias:** Para fichas viejas ya guardadas, el modal tambiÃÂ©n limpia `*` y guiones al mostrar (no es necesario re-importar).

---
### [Fecha: 13/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/sheetParser.ts`, `src/utils/characterSheets.ts`, `src/types.ts`, `src/components/PlayerProfilePanel.tsx`, `src/components/CharImportModal.tsx`, `src/components/RealmRegistry.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se termino y estabilizo el sistema de Fichas de Personaje (importar desde WhatsApp, guardar con defaults, y buscador publico) con soporte opcional para mostrar/buscar por usuario (sin depender del UUID).
*   **Cambios Clave:**
    *   Parser reescrito (`sheetParser.ts`) para tolerar mejor el formato decorado de WhatsApp y capturar secciones multilÃÂ­nea sin Ã¢â¬ÅmezclarÃ¢â¬Â campos.
    *   Guardado de fichas ahora completa valores por defecto al crear la ficha (evita `undefined` y hace el upsert mÃÂ¡s estable).
    *   Se aÃÂ±adiÃÂ³ `playerUsername?: string` al tipo `CharacterSheet` y la capa de guardado detecta si la tabla soporta esa columna; si no, omite la propiedad para no romper el upsert.
    *   Registro del Reino (`RealmRegistry`) mejorado: bÃÂºsqueda por personaje/raza/profesiÃÂ³n y, si existe la columna, por `playerUsername`; si no, cae a `playerId`.
    *   Importador (`CharImportModal`) con placeholder limpio (plantilla) y grilla de stats mÃÂ¡s usable en mÃÂ³vil.
*   **Notas/Advertencias:** Si quieres que el Registro muestre y busque por nombre de jugador, crea la columna opcional `playerUsername` en `character_sheets` (texto) o avÃÂ­same y te paso el SQL exacto para tu esquema.

### [Fecha: 13/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `.env.example`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigio el formato de `.env.example` para que sea un archivo `.env` valido (sin comillas ni `;`) y se pueda copiar/pegar directo.
*   **Cambios Clave:**
    *   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` quedaron como `KEY=value`.
*   **Notas/Advertencias:** Ninguna.

---
### [Fecha: 13/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/utils/supabaseClient.ts`, `src/lib/supabase.ts`, `src/utils/scratchUtils.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Integracion y saneamiento del repo tras cambios externos: se unifico el historial con `origin/main` y se corrigieron errores de TypeScript que rompian consistencia del proyecto.
*   **Cambios Clave:**
    *   Se integro `origin/main` (merge) y se resolvio el conflicto en `scratchUtils` manteniendo el limite diario dinamico del Rasca y Gana.
    *   Se restauro la navegacion principal (Inicio, Grimorio, Biblioteca, Mercado, Ranking) para que coincida con `TabId` y el diseÃÂ±o acordado.
    *   Se corrigio `PlayerProfilePanel` para incluir `motion` en los modales y evitar errores en runtime.
    *   Se normalizo Supabase para que el cliente no sea `null`: ahora falla rapido con un error claro si faltan `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, y `src/lib/supabase.ts` reexporta el mismo cliente.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores.

---
### [Fecha: 13/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** CorrecciÃÂ³n del sistema de retiro automÃÂ¡tico y visualizaciÃÂ³n del tope en el minijuego Crash.
*   **Cambios Clave:**
    *   **SoluciÃÂ³n de Stale Closures:** ImplementaciÃÂ³n de `useRef` para variables crÃÂ­ticas (apuesta, jugador, multiplicador) asegurando lecturas en tiempo real dentro del bucle `requestAnimationFrame`.
    *   **VisualizaciÃÂ³n del Tope:** Ajuste dinÃÂ¡mico del eje Y (`maxY`) en el canvas para que la lÃÂ­nea de retiro automÃÂ¡tico sea siempre visible en el grÃÂ¡fico.
    *   **PrecisiÃÂ³n de Cobro:** El retiro automÃÂ¡tico ahora asegura el multiplicador exacto configurado por el usuario, evitando discrepancias por saltos de frames.
*   **Notas/Advertencias:** SimulaciÃÂ³n y compilaciÃÂ³n verificadas exitosamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/scratchUtils.ts`, `src/components/TavernScratch.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** AleatorizaciÃÂ³n del lÃÂ­mite diario de ganancias en el Rasca y Gana.
*   **Cambios Clave:**
    *   **LÃÂ­mite DinÃÂ¡mico**: El lÃÂ­mite dejÃÂ³ de ser fijo (50,000) y ahora varÃÂ­a cada dÃÂ­a entre **10,000 y 150,000 de oro**.
    *   **Semilla Diaria**: Se utiliza la misma semilla pseudo-aleatoria del dÃÂ­a para calcular el lÃÂ­mite, asegurando consistencia durante las 24 horas.
    *   **Feedback Visual**: Se actualizÃÂ³ el mensaje de "LÃÂ­mite Alcanzado" para mostrar dinÃÂ¡micamente el tope del dÃÂ­a actual.
*   **Notas/Advertencias:** El lÃÂ­mite es por jugador y por dÃÂ­a local.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ImplementaciÃÂ³n del minigame "El Multiplicador del VacÃÂ­o" (Crash Game).
*   **Cambios Clave:**
    *   **LÃÂ³gica de Tiempo Real**: Sistema basado en `requestAnimationFrame` para un conteo fluido y preciso.
    *   **Curva Exponencial**: El multiplicador acelera con el tiempo (`1.06^t`), aumentando la presiÃÂ³n psicolÃÂ³gica.
    *   **Punto de Colapso DinÃÂ¡mico**: Algoritmo de azar con un 3% de margen de la casa (instant crash).
    *   **Interfaz de NeÃÂ³n**: DiseÃÂ±o oscuro con efectos de brillo, anillos de energÃÂ­a y respuesta visual al ganar o perder.
    *   **IntegraciÃÂ³n de Saldo**: SincronizaciÃÂ³n completa con `usePlayerSession` para apuestas y retiros.
*   **Notas/Advertencias:** Limpieza de animaciones al desmontar el componente para evitar fugas de memoria.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigiÃÂ³ y potenciÃÂ³ el buscador del Grimorio para permitir bÃÂºsquedas globales y profundas en todo el catÃÂ¡logo de habilidades.
*   **Cambios Clave:**
    *   **BÃÂºsqueda Global**: Al buscar una palabra, el sistema ahora ignora la categorÃÂ­a seleccionada y busca en TODO el grimorio simultÃÂ¡neamente.
    *   **ExpansiÃÂ³n de Criterios**: El buscador ahora analiza el tÃÂ­tulo, el Marco TeÃÂ³rico (descripciÃÂ³n), los nombres de habilidades, sus efectos y las restricciones de Anti-Mano Negra.
    *   **Auto-Apertura Inteligente**: Las escuelas de magia y las tarjetas de habilidad que contienen la palabra buscada se abren automÃÂ¡ticamente para facilitar la lectura.
    *   **Contexto de BÃÂºsqueda**: Se aÃÂ±adieron etiquetas visuales en los resultados que indican a quÃÂ© categorÃÂ­a (InvocaciÃÂ³n, Elemental, etc.) pertenece cada estilo encontrado.
*   **Notas/Advertencias:** `npx tsc --noEmit` verificado. Al limpiar el buscador, la interfaz regresa automÃÂ¡ticamente a la categorÃÂ­a que estaba seleccionada previamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCards.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Aumento de dificultad y sistema de rachas para el juego de cartas de la taberna.
*   **Cambios Clave:**
    *   **Mazo Ampliado**: El rango de cartas pasÃÂ³ de 1-10 a 1-15, dificultando las predicciones.
    *   **Sistema de Doble o Nada (Rachas)**: Tras ganar, el premio no se cobra automÃÂ¡ticamente. El jugador debe decidir entre "Cobrar" o seguir con "Doble o Nada".
    *   **Pozo Acumulado**: Las ganancias se acumulan en un pozo que se multiplica x2 con cada acierto. Si se falla, se pierde TODO el pozo acumulado.
    *   **OptimizaciÃÂ³n Mobile-First**: RediseÃÂ±o completo de la interfaz con botones mÃÂ¡s grandes, indicadores de racha/pozo y animaciones fluidas para una experiencia premium en mÃÂ³vil y escritorio.
*   **Notas/Advertencias:** Los empates mantienen la racha y el pozo (neutral). Se verificÃÂ³ la lÃÂ³gica de persistencia con Supabase.

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/data/grimorio.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigieron titulos de escuelas del Grimorio que aparecian como nombres de archivo (`texto XX.txt`) y ahora muestran el nombre real de cada magia.
*   **Cambios Clave:**
    *   Renombrados: Sangre (Hemomancia), Metal (Ferrocinesis), Plasma, Sonido (Sonocinesis), Ilusiones Mentales, Control Mental y Sugestion, Vacio, Divina, Demoniaca, Luz Solida, Tiempo (Cronomancia), Acido y Corrosion.
    *   Solo se ajusto `title` para no romper IDs ni niveles.
*   **Notas/Advertencias:** `npx tsc --noEmit` verificado sin errores.

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/data/lore.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se completaron los dossiers pendientes de `Mercenarios del Hierro` y `Guardianes del Umbral` con el lore proporcionado, y se actualizaron sus lemas.
*   **Cambios Clave:**
    *   `REALM_FACTIONS` ahora refleja los lemas actualizados para que coincidan con la presentacion de la web.
    *   `FACTION_DOSSIERS` ya no tiene placeholders: incluye historia, especializacion, tacticas, equipo, sede, relaciones y detalles para el jugador.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores (advertencia conocida por bundle grande, sin bloquear).

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/data/lore.ts`, `src/components/LibrarySection.tsx`, `src/types.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se expandieron las facciones existentes con dossiers completos (historia, equipo, sede, relaciones y detalles para jugador) sin saturar movil.
*   **Cambios Clave:**
    *   Se agrego `FACTION_DOSSIERS` en `src/data/lore.ts` con el contenido extendido de las 4 facciones ya presentes.
    *   La `Biblioteca -> Cronicas y Leyes` muestra un resumen corto en cards y debajo dossiers desplegables por faccion.
    *   Se anadieron tipos `FactionDossier`/`FactionRelation` para mantener el formato consistente y facil de extender.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores (advertencia conocida por bundle grande, sin bloquear).

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/LibrarySection.tsx`, `src/assets/maps/vyralis-map.jpeg`, `src/assets/maps/geopolitica-map.jpeg`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se agregaron los mapas del continente a la pestaÃÂ±a `Mapa y Mundo` dentro de `Biblioteca`, con selector y visor en grande para movil.
*   **Cambios Clave:**
    *   Nuevo bloque de mapa al inicio de `Mapa y Mundo` con botones para alternar entre "Vyralis" y "Geopolitica".
    *   El mapa se puede tocar/abrir en un modal de pantalla completa para leer detalles sin saturar la UI.
    *   Los assets quedan versionados en `src/assets/maps/` para que Vite los empaquete y no haya 404 en deploy.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores (advertencia conocida por bundle grande, sin bloquear).

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Conversion automatica de unidades cientificas (N, kg, J, km/h, m/s, ÃÂ°C) a "puntos" estilo D&D para que las habilidades se entiendan como stats (Fuerza, Velocidad, Danio).
*   **Cambios Clave:**
    *   Se implemento un formateador que reemplaza tokens tipo `$2000 N$` por equivalentes como `(+10 Fuerza)` y limpia escapes como `\\%`.
    *   El formateo se aplica a `effect`, `cd`, `limit`, `antiManoNegra` y tambien al texto de `Marco Teorico` dentro del Grimorio.
    *   La escala de conversion queda centralizada y facil de ajustar en una sola funcion (`convertUnitToDndPoints`).
*   **Notas/Advertencias:** Escala inicial: N->Fuerza (N/200), m/s->Velocidad (m/s/5), J->Danio (J/500), ÃÂ°C->Danio de Fuego (ÃÂ°C/20), con tope 25. `npx tsc --noEmit` verificado sin errores.

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** El Grimorio ahora entra con los estilos plegados por defecto para que sea mas escaneable (especialmente en movil), con auto-apertura al buscar.
*   **Cambios Clave:**
    *   Los paneles de estilos inician cerrados.
    *   Si se escribe en el buscador, solo se abren automaticamente los estilos que tengan coincidencias.
*   **Notas/Advertencias:** `npx tsc --noEmit` verificado sin errores.

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Mejora de tipografia/legibilidad del lore del Grimorio y ajuste responsive para que en movil no se vean tokens tipo markdown (`**`, `---`, `###`) ni layouts apretados.
*   **Cambios Clave:**
    *   Se agrego un renderizador liviano de texto para soportar `**negrita**`, separadores `---` y headings `###` como elementos visuales, evitando que se vean los caracteres crudos en pantalla.
    *   Se ajusto el grid de habilidades a 1 columna hasta `lg` y los bloques de cooldown/limitante ahora se apilan en pantallas muy chicas (`sm`), mejorando la lectura en movil.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente (persiste la advertencia conocida por bundle grande, sin bloquear).

---
### [Fecha: 09/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/types.ts`, `src/data/grimorio.ts` (Nuevo), `src/components/GrimoireSection.tsx` (Nuevo), `src/components/LibrarySection.tsx` (Nuevo), `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ReestructuraciÃÂ³n de la arquitectura de la SPA para integrar un sistema de habilidades (Grimorio) y optimizar la navegaciÃÂ³n mÃÂ³vil mediante la fusiÃÂ³n de secciones informativas.
*   **Cambios Clave:**
    *   **FusiÃÂ³n "Biblioteca"**: Se unificaron las antiguas pestaÃÂ±as `Lore` y `Mundo` en una sola secciÃÂ³n de `Biblioteca` con un selector interno (Tabs), liberando espacio en la barra de navegaciÃÂ³n.
    *   **Grimorio de Habilidades**: ImplementaciÃÂ³n de una secciÃÂ³n dedicada para gestionar poderes y magias, categorizados por escuelas (InvocaciÃÂ³n, Elemental, etc.).
    *   **DiseÃÂ±o TÃÂ©cnico-CientÃÂ­fico**: Las habilidades incluyen Lore basado en fÃÂ­sica real, niveles 1-5, tiempos de enfriamiento y limitantes especÃÂ­ficas.
    *   **Capa Anti-Mano Negra**: Se integrÃÂ³ una secciÃÂ³n visual distintiva en cada habilidad para definir reglas de balanceo y prohibiciones de uso (Anti-Powergaming).
    *   **NavegaciÃÂ³n Optimizada**: La barra inferior se mantiene en 5 elementos (Inicio, Grimorio, Biblioteca, Mercado, Ranking), mejorando la UX en dispositivos mÃÂ³viles.
*   **Notas/Advertencias:** Se dejÃÂ³ `src/data/grimorio.ts` con plantillas y comentarios para facilitar la expansiÃÂ³n manual de contenidos sin saturar el contexto de la IA.

---
### [Fecha: 08/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se separo visualmente el bloque de `Editar oro` en el panel admin para que los controles no queden apretados en movil.
*   **Cambios Clave:**
    *   Se agrupo el selector de modo (Sumar/Restar/Fijar) con el input dentro de una caja secundaria con mas aire.
    *   El boton de accion pasa a ancho completo en movil para evitar saturacion.
*   **Notas/Advertencias:** Cambio solo de layout/estilos; no modifica la logica de actualizacion de oro.

---
### [Fecha: 08/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/scratchUtils.ts` (Nuevo), `src/components/TavernScratch.tsx`, `src/App.tsx`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ImplementaciÃÂ³n de la LoterÃÂ­a DinÃÂ¡mica 24h con lÃÂ­mites de fortuna, reembolsos automÃÂ¡ticos y optimizaciones de interfaz mÃÂ³vil.
*   **Cambios Clave:**
    *   **LoterÃÂ­a DinÃÂ¡mica (24h)**: Se creÃÂ³ `scratchUtils.ts` para generar precios (200-500) y probabilidades (10-40%) deterministas basados en la fecha actual (semilla diaria).
    *   **Multi-Scratch & Jackpot**: Se aÃÂ±adiÃÂ³ la compra mÃÂºltiple de tickets con "Auto-Scrape" y un Jackpot VIP fijo del 5% (10,000 oro) independiente de la racha diaria.
    *   **Control de InflaciÃÂ³n (LÃÂ­mite 50k)**: Se implementÃÂ³ un tope de ganancias brutas diarias de 50,000 oro. Al alcanzarlo, el juego se bloquea hasta el dÃÂ­a siguiente.
    *   **Sistema de Reembolsos**: Si una compra masiva choca con el lÃÂ­mite de 50k antes de terminar, los tickets sobrantes se cancelan automÃÂ¡ticamente y el oro se devuelve ÃÂ­ntegro al jugador con una auditorÃÂ­a visual en el recibo.
    *   **Mobile-First Admin**: Se refactorizaron los grupos de botones y filtros del panel de administraciÃÂ³n para evitar desbordamientos en pantallas pequeÃÂ±as mediante scroll horizontal y flex-wrap.
    *   **UX Pulido**: Se ajustÃÂ³ la lÃÂ³gica de renderizado para permitir ver los resultados finales y reembolsos antes de que aparezca el mensaje bloqueante de "LÃÂ­mite Alcanzado".
*   **Notas/Advertencias:** El sistema de semillas asegura que todos los jugadores vean la misma "suerte" cada dÃÂ­a. El lÃÂ­mite de 50k se persiste en `localStorage` vinculado al ID del jugador y la fecha. `npx tsc --noEmit` verificado sin errores.

---
### [Fecha: 07/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/market.ts` (Nuevo), `src/components/AdminControlSheet.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio una pestana `Mercado` al panel de administracion para crear, editar y borrar productos del catalogo desde la interfaz sin tocar codigo.
*   **Cambios Clave:**
    *   Se creo `src/utils/market.ts` con `fetchMarketItems`, `upsertMarketItem`, `deleteMarketItem` y `slugifyMarketItem`, siguiendo el patron de `events.ts`.
    *   El mercado publico ahora carga los items desde Supabase (tabla `market_items`) con fallback transparente al archivo local `src/data/market.ts`.
    *   La pestana `Mercado` del admin tiene formulario completo: nombre, descripcion, habilidad, categoria, rareza, stock, precio, imagen (URL, ajuste, posicion) y destacado.
    *   El ID se auto-genera como slug de categoria+nombre al crear (ej: "Mi Espada" + swords Ã¢â â `sword-mi-espada`); en edicion muestra el ID existente.
    *   Lista de items a la derecha con buscador por nombre y filtro por categoria; clic precarga el formulario.
*   **Notas/Advertencias:** Para activar la gestion dinamica hay que crear la tabla `market_items` en Supabase con el SQL documentado en `src/utils/market.ts`. Sin la tabla, el mercado sigue mostrando los datos locales. `npx tsc --noEmit` paso sin errores.

---
### [Fecha: 07/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernScratch.tsx`, `src/assets/scratch-pristine-card.png`, `src/assets/scratch-win-card.png`, `src/assets/scratch-lose-card.png`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se limpiaron visualmente las cartas del minijuego `Rasca y gana` para quitar textos auxiliares del sprite original y hacer la presentacion menos invasiva.
*   **Cambios Clave:**
    *   Se generaron recortes nuevos con solo la carta util, sin los titulos superiores ni los extras inferiores del sheet original.
    *   El componente ahora usa esas cartas limpias en lugar del sprite completo y las renderiza con un ancho mas contenido.
    *   La zona de rascar paso a sentirse mas premium y enfocada, con menos ruido visual sobre el resto de la pantalla.
*   **Notas/Advertencias:** Los sheets originales siguen en `src/assets` como respaldo, pero el juego ya no depende de ellos para mostrarse.

---
### [Fecha: 07/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/TavernScratch.tsx`, `src/assets/scratch-win-sheet.png`, `src/assets/scratch-lose-sheet.png`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio el minijuego `Rasca y gana` a la taberna usando las ilustraciones personalizadas del usuario.
*   **Cambios Clave:**
    *   La taberna ahora incluye un cuarto juego llamado `Rasca`, junto a Cofres, Ruleta y Cartas.
    *   Cada ticket cuesta 250 de oro, usa el mismo perfil global del jugador y tiene un 20% de probabilidad de otorgar un premio aleatorio entre 500 y 1000 monedas.
    *   Se integraron las imagenes del usuario como carta intacta y estados revelados de victoria o derrota dentro de la interfaz del juego.
*   **Notas/Advertencias:** El minijuego descuenta el costo del ticket desde Supabase y acredita el premio en el mismo saldo si sale ganador.

---
### [Fecha: 07/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/MarketItemCard.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se compactaron las tarjetas del mercado en movil para que el catalogo sea mas agil de leer sin perder informacion importante.
*   **Cambios Clave:**
    *   La imagen ahora usa una proporcion menos alta en movil para reducir scroll innecesario dentro del catalogo.
    *   La descripcion queda recortada en movil con opcion `Ver mas`, mientras que en escritorio sigue completa.
    *   La habilidad ahora es plegable en movil y el bloque de precio/compra ocupa menos altura para dejar el CTA mas cerca.
*   **Notas/Advertencias:** El ajuste es visual y no cambia la logica de compra ni el comportamiento de rarezas, stock o destacados.

---
### [Fecha: 07/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aplico una primera optimizacion mobile-first para reducir la carga inicial y hacer mas ligera la experiencia en telefonos.
*   **Cambios Clave:**
    *   La taberna, el modal de compra y el podio semanal ahora se cargan de forma diferida solo cuando el usuario abre esas zonas.
    *   El inventario y el panel admin del perfil tambien pasaron a lazy load para no cargar overlays pesados desde el arranque.
    *   El cambio de pestania principal ahora usa una transicion no bloqueante para que la navegacion se sienta mas suave.
*   **Notas/Advertencias:** El bundle principal deberia bajar al mover partes pesadas fuera de la carga inicial. Conviene revisar luego `Speed Insights` para medir el impacto real.

---
### [Fecha: 07/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/utils/events.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio la opcion de borrar eventos desde el panel admin cuando un evento esta cargado en modo edicion.
*   **Cambios Clave:**
    *   El formulario de eventos ahora muestra un boton `Borrar evento` solo si hay un evento seleccionado.
    *   Antes de eliminar, el admin debe confirmar la accion para evitar borrados accidentales.
    *   Tras borrar un evento, el formulario se limpia y la lista se recarga para reflejar el cambio tambien en Inicio.
*   **Notas/Advertencias:** El borrado afecta la tabla `realm_events` en Supabase. Si la Home esta leyendo desde Supabase, el evento desaparecera del inicio despues de recargar.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se afino el panel admin con busqueda de jugadores, busqueda y filtro de estado para eventos, y salidas claras del modo edicion.
*   **Cambios Clave:**
    *   La pestana `Jugadores` ahora incorpora un buscador por nombre que filtra la lista visible y tambien ayuda a elegir mas rapido el objetivo para editar oro.
    *   La pestana `Eventos` ahora tiene buscador por titulo y filtros por estado (`Todos`, `Activo`, `En produccion`, `Finalizado`) para gestionar mejor el contenido del inicio.
    *   Se anadieron botones `Cancelar edicion` en los formularios de actividad semanal y eventos para volver rapido al modo crear sin arrastrar datos previos.
*   **Notas/Advertencias:** Los cambios mantienen el mismo flujo de Supabase y no alteran el diseno publico de la pagina.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/types.ts`, `src/utils/events.ts`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio un gestor de eventos desde el panel admin manteniendo el mismo formato visual de las tarjetas que aparecen en Inicio.
*   **Cambios Clave:**
    *   La Home ahora intenta leer eventos desde Supabase y, si no hay tabla o datos, cae con seguridad al archivo local `src/data/events.ts`.
    *   Se agrego una pestaÃÂ±a `Eventos` al panel admin para crear y editar los eventos visibles del inicio sin tocar codigo manualmente.
    *   El diseÃÂ±o publico de los eventos no cambia: solo cambia el origen del contenido cuando Supabase esta disponible.
*   **Notas/Advertencias:** Para administrarlos desde la web hace falta crear manualmente la tabla `realm_events` usando el SQL sugerido en `src/utils/events.ts`.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio la pestaÃÂ±a `Jugadores` al panel admin para crear perfiles nuevos y corregir oro sin entrar manualmente a Supabase.
*   **Cambios Clave:**
    *   El panel ahora incluye un formulario de alta para crear jugadores con oro inicial y opcion de admin.
    *   Se agrego una herramienta para sumar, restar o fijar el oro de cualquier jugador registrado.
    *   Si el admin edita su propio saldo, la sesion activa se refresca para reflejar el cambio al instante.
*   **Notas/Advertencias:** La creacion como admin aprovecha `is_admin` si la columna existe; si aun no esta disponible, el jugador se crea como normal sin romper el flujo.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/adminRanking.ts`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio el boton `Nueva semana` al panel admin para sembrar la temporada actual sin recargar manualmente a todos los jugadores.
*   **Cambios Clave:**
    *   Si la semana actual esta vacia, el sistema clona la ultima temporada registrada con los puntos reiniciados.
    *   Si no existe una temporada previa, la nueva semana se crea tomando la tabla `players` como semilla inicial.
    *   Los jugadores nuevos siguen pudiendo agregarse despues desde `players` y luego cargarse en el panel admin.
*   **Notas/Advertencias:** El boton no pisa semanas ya creadas; si detecta filas para la semana actual, solo informa que ya existe.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/utils/players.ts`, `src/utils/adminRanking.ts`, `src/data/adminTemplates.ts`, `src/context/PlayerSessionContext.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se creo una primera base de modo admin accesible desde el perfil del jugador `Nothing` o perfiles marcados como `is_admin`.
*   **Cambios Clave:**
    *   El perfil global ahora reconoce administradores y muestra un boton discreto de `Admin`.
    *   Se anadio una hoja de control para cargar o ajustar el ranking semanal real en Supabase durante la semana activa.
    *   Se incorporaron plantillas de puntaje para administrar la competencia sin improvisar cada actualizacion.
*   **Notas/Advertencias:** Para que el control sea mas solido conviene anadir la columna `is_admin` a la tabla `players`, aunque `Nothing` ya funciona como llave visual de admin.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `package.json`, `src/main.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se integro Vercel Speed Insights para medir rendimiento real del despliegue sin tocar la arquitectura de la app.
*   **Cambios Clave:**
    *   Se anadio la dependencia `@vercel/speed-insights` al proyecto.
    *   Se monto `<SpeedInsights />` junto a `<Analytics />` en `main.tsx` para capturar metricas globales.
*   **Notas/Advertencias:** Funciona en el despliegue de Vercel; GitHub Pages seguira operativo aunque no aproveche este panel.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `package.json`, `src/main.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se integro Vercel Analytics de forma global para empezar a medir visitas en el despliegue de Vercel sin tocar la estructura principal de la SPA.
*   **Cambios Clave:**
    *   Se anadio la dependencia `@vercel/analytics` al proyecto.
    *   Se monto el componente `<Analytics />` en `main.tsx` para que la medicion quede activa a nivel global.
*   **Notas/Advertencias:** La analitica sirve en el despliegue de Vercel; GitHub Pages seguira funcionando normalmente sin depender de este paquete.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/RankingCard.tsx`, `src/components/WeeklyRankingPodium.tsx`, `src/data/ranking.ts`, `src/types.ts`, `src/utils/weeklyRanking.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se transformo el ranking en una competencia semanal de actividad con podio visual, contador de cierre y conexion opcional a Supabase.
*   **Cambios Clave:**
    *   El ranking ahora mide puntos de actividad, misiones y eventos, y muestra un podio tipo top 3 mas cercano al estilo competitivo solicitado.
    *   Se anadio contador hasta el cierre semanal y una capa de lectura desde la tabla `weekly_activity_rankings` en Supabase.
    *   Si la tabla aun no existe o no tiene filas de la semana actual, la UI cae en un modo local seguro con datos de ejemplo sin romper la pagina.
*   **Notas/Advertencias:** Para administrarlo desde Supabase hace falta crear manualmente la tabla `weekly_activity_rankings` usando el SQL sugerido en `src/utils/weeklyRanking.ts`.

---
### [Fecha: 04/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/MarketItemCard.tsx`, `src/index.css`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aumento la presencia visual del acabado premium para que los legendarios y epicos se noten mas sin perder elegancia.
*   **Cambios Clave:**
    *   Los legendarios ganaron un dorado mas profundo, mayor resplandor y un reflejo metalico mas visible.
    *   Los epicos tambien subieron de intensidad, pero quedaron un paso por debajo del legendario para mantener jerarquia visual.
    *   Se acortaron ligeramente los ciclos de pulso y barrido para que el efecto se perciba mejor al primer vistazo.
*   **Notas/Advertencias:** El efecto sigue limitado al mercado y solo para rarezas `legendary` y `epic`.

---
### [Fecha: 04/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/MarketItemCard.tsx`, `src/index.css`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se llevo el acabado de rareza a un look mas premium con reflejo de metal encantado y un pulso mejor balanceado.
*   **Cambios Clave:**
    *   Los bordes legendarios y epicos ahora tienen un brillo mas profundo y un reflejo suave que recorre la tarjeta.
    *   Se ajustaron tiempos e intensidad para que el efecto se vea elegante, no estridente.
*   **Notas/Advertencias:** La animacion sigue limitada a legendarios y epicos para mantener el resto del mercado sobrio.

---
### [Fecha: 04/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/MarketItemCard.tsx`, `src/index.css`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se convirtio el brillo de rareza en una animacion suave para objetos legendarios y epicos.
*   **Cambios Clave:**
    *   Se anadieron keyframes globales para un pulso lento del borde neon.
    *   Los objetos `legendary` y `epic` ahora respiran visualmente con una animacion sutil, sin afectar rare o common.
*   **Notas/Advertencias:** La animacion se mantuvo intencionalmente lenta para evitar ruido visual o fatiga en movil.

---
### [Fecha: 04/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/MarketItemCard.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio un brillo especial tipo neon para los objetos legendarios y epicos del mercado.
*   **Cambios Clave:**
    *   Las tarjetas `legendary` ahora tienen un resplandor dorado suave en el borde.
    *   Las tarjetas `epic` ahora tienen un resplandor fucsia suave en el borde.
*   **Notas/Advertencias:** El efecto se aplico solo a las tarjetas del mercado para no recargar otras zonas de la interfaz.

---
### [Fecha: 04/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/MarketItemCard.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se compactaron los objetos destacados del mercado para que no muestren imagen y ocupen menos espacio visual.
*   **Cambios Clave:**
    *   `MarketItemCard` ahora acepta un modo sin imagen para reutilizar la misma tarjeta en formato mas liviano.
    *   La seccion `Objetos destacados` usa ese formato compacto, dejando visibles nombre, rareza, stock, habilidad, precio y boton de compra.
*   **Notas/Advertencias:** No se modifico el resto del catalogo; las tarjetas normales siguen mostrando imagen.

---
### [Fecha: 04/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/types.ts`, `src/data/market.ts`, `src/components/PlayerProfilePanel.tsx`, `src/components/PlayerInventorySheet.tsx`, `src/components/PurchaseModal.tsx`, `src/context/PlayerSessionContext.tsx`, `src/utils/inventory.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio un inventario visual separado para cada jugador y se conecto la compra del mercado para guardar objetos persistentes que no sean pociones.
*   **Cambios Clave:**
    *   Se creo una vista tipo hoja completa del inventario, abierta desde el perfil del jugador, con filtros discretos por categoria y tarjetas compactas.
    *   Los items del mercado ahora tienen `id` fijo para poder sincronizarse con el inventario de Supabase.
    *   Las compras agregan armas, armaduras y otros objetos al inventario del jugador. Las pociones siguen fuera del inventario persistente.
    *   Se anadio una capa de compatibilidad para que, si la tabla `player_inventory` aun no existe, la compra no se rompa y la UI lo comunique de forma suave.
*   **Notas/Advertencias:** Para sincronizacion real entre dispositivos, Supabase debe tener creada la tabla `player_inventory` con la estructura sugerida en `src/utils/inventory.ts`. `vite build` y `npx tsc --noEmit` pasaron correctamente.

---
### [Fecha: 01/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `README.md`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se creo un README completo y presentable para documentar el proyecto, sus funciones y su stack actual.
*   **Cambios Clave:**
    *   Se anadio una presentacion general de Kingdoom con enfoque narrativo y tecnico para visitantes del repositorio.
    *   Se documento la estructura del proyecto, el flujo del mercado, la taberna, el despliegue y los archivos mas importantes.
*   **Notas/Advertencias:** No fue necesario tocar codigo funcional para este cambio.

---
### [Fecha: 01/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/main.tsx`, `src/types.ts`, `src/components/PlayerProfilePanel.tsx`, `src/components/PurchaseModal.tsx`, `src/components/TavernGame.tsx`, `src/components/TavernRoulette.tsx`, `src/components/TavernCards.tsx`, `src/components/TavernCashoutModal.tsx`, `src/context/PlayerSessionContext.tsx`, `src/utils/players.ts`, `src/utils/supabaseClient.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se creo una sesion global de jugador para que el mercado y los minijuegos usen el mismo perfil y el mismo saldo sin pedir el nombre en cada pantalla.
*   **Cambios Clave:**
    *   Se anadio un panel de perfil visible en la app con conexion por nombre, oro disponible, refresco manual y persistencia local de la sesion.
    *   Las compras del mercado, cofres, ruleta, cartas y retiro de taberna ahora usan el perfil conectado en lugar de pedir login independiente dentro de cada flujo.
    *   Se limpiaron textos con codificacion rota en los componentes tocados y se centralizo la logica de lectura y actualizacion de jugadores de Supabase.
*   **Notas/Advertencias:** `vite build` y `npx tsc --noEmit` pasaron correctamente. Sigue apareciendo solo la advertencia conocida de bundle grande, sin bloquear el deploy.

---
### [Fecha: 01/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PurchaseModal.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Integracion de compras del mercado con verificacion y descuento de oro en Supabase.
*   **Cambios Clave:**
    *   El modal de compra ahora busca al jugador en la tabla `players`, valida saldo suficiente y descuenta el total antes de enviar el pedido.
    *   Si Formspree falla o hay un error de red tras el descuento, se intenta restaurar automaticamente el oro en la base de datos.
*   **Notas/Advertencias:** El build y TypeScript pasaron correctamente. Sigue quedando una advertencia de bundle grande por assets y minijuegos, pero no bloquea el deploy.

---
### [Fecha: 01/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Restauracion de la SPA completa con lore, mundo, mercado funcional y taberna integrada.
*   **Cambios Clave:**
    *   Se recupero la estructura rica de la aplicacion con las pestanias `Inicio`, `Lore`, `Mundo`, `Mercado` y `Ranking` usando los datos actuales de `src/data`.
    *   Se reintegro la `Taberna Clandestina` dentro de `Mercado` con selector entre `Cofres`, `Ruleta` y `Cartas`, manteniendo tambien el catalogo de compra y el modal de pedidos.
*   **Notas/Advertencias:** El build paso correctamente. Quedo una advertencia de bundle grande por assets y minijuegos, pero no bloquea el deploy.

---
### [Fecha: 01/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del fallo de deploy en Vercel y limpieza de texto con codificacion rota.
*   **Cambios Clave:**
    *   Se reemplazo el import invalido `motion/react` por `framer-motion` en `src/App.tsx`, que era la causa directa del error de build.
    *   Se normalizaron textos mojibake en `src/App.tsx` y se reescribio `AI_CHANGELOG.md` en ASCII legible para evitar mas ruido de codificacion.
*   **Notas/Advertencias:** La copia local tiene una carpeta `public/` sin trackear. No afecta esta correccion, pero conviene revisarla antes de futuros cambios de assets.

---
### [Fecha: 31/03/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/TavernRoulette.tsx` (Nuevo), `src/components/TavernCards.tsx` (Nuevo)
*   **Resumen de Tareas:** Adicion de dos nuevos minijuegos a la Taberna Clandestina (Ruleta y Cartas) con integracion a Supabase.
*   **Cambios Clave:**
    *   Creacion de `TavernRoulette.tsx`: Juego de ruleta con multiplicadores aleatorios y animacion de giro fluida preparada para usar una imagen personalizada (`ruleta.png`).
    *   Creacion de `TavernCards.tsx`: Juego de adivinar si la siguiente carta sera mayor o menor.
    *   Modificacion de `App.tsx`: Se aniadio un selector de juegos (pestanias) en la seccion del Mercado para alternar entre Cofres, Ruleta y Cartas.
    *   Integracion directa con Supabase en ambos juegos para descontar la apuesta y sumar los premios al oro del jugador en tiempo real.
*   **Notas/Advertencias:** El usuario debe subir su archivo pixel art `ruleta.png` a la carpeta `src/assets/` para reemplazar el placeholder temporal que se dejo configurado.

---
### [Fecha: 30/03/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/TavernGame.tsx` (Nuevo), `src/components/TavernCashoutModal.tsx` (Nuevo)
*   **Resumen de Tareas:** Integracion de "Taberna Clandestina", minijuego de apuestas Doble o Nada con Formspree.
*   **Cambios Clave:**
    *   Nuevo componente reactivo `TavernGame.tsx` para el ciclo de apuestas con animaciones Framer Motion y modificador dinamico de dificultad.
    *   Nuevo `TavernCashoutModal.tsx` para cobros usando Formspree (hacia xvzvavvd).
    *   Se incrusto la "Taberna Clandestina" dentro de la pestania `Mercado` mediante un panel colapsable (`<details>`).
*   **Notas/Advertencias:** El factor de dificultad aumenta probabilisticamente cada 2 tiros ganadores bajando las chances de x2 y subiendo las de x0 (Mimic).

---
### [Fecha: 30/03/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `AI_CHANGELOG.md` (Creacion)
*   **Resumen de Tareas:** Configuracion inicial del log de colaboracion entre IA.
*   **Cambios Clave:**
    *   Se creo este archivo para establecer un canal de comunicacion y registro entre Antigravity y Jarvis.
    *   Se definieron las reglas de uso y la plantilla estandar de registro.
*   **Notas/Advertencias:** Ninguna. Todo listo para empezar.
---
### [Fecha: 11/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/advise-staff.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de compatibilidad entre el endpoint de Staff IA y el nuevo contrato del orquestador serverless.
*   **Cambios Clave:**
    *   Se reemplazo el acceso obsoleto `aiResult.json` por `aiResult.data` en `api/admin/advise-staff.ts`.
    *   Con esto se resuelve el error de TypeScript que bloqueaba el build en Vercel para el endpoint `api/admin/advise-staff.ts`.
*   **Notas/Advertencias:** El build local con `npm run build` paso correctamente despues del ajuste.
## [2026-05-25] - Oracle and Profile Improvements
- Conectado el Oráculo a las tablas de eventos y misiones activas.
- Refinado el comando '!perfil' para separar y clasificar inteligentemente los IDs de WhatsApp y los números de teléfono reales.
- Añadidos comandos faltantes al menú de ayuda (!ayuda) con restricción por roles.



---
### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** apps/mobile/app/(tabs)/profile.tsx, apps/mobile/app/(tabs)/anime.tsx, docs/mobile-reactivation/mobile-reactivation-backlog.md
*   **Resumen de Tareas:** Finalizacion de pulido visual y funcional ('Beta Interna') en la aplicacion movil para alcanzar paridad en la experiencia de usuario.
*   **Cambios Clave:**
    *   Migracion del perfil de jugador a KingdoomUI (RealmCard, StaggerItem, MetricTile, EmptyState).
    *   Integracion robusta de pull-to-refresh en todos los tabs (ej. anime.tsx) mediante ScreenShell.
    *   Garantia de estados consistentes (carga, error, vacio) en todos los modulos.
*   **Notas/Advertencias:** Validacion de tipos ejecutada correctamente (npx tsc --noEmit exitoso). Flujos base listos.
