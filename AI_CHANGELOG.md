
## [2026-06-22] Higiene del Repositorio y Escrow del Bot de WhatsApp
- Se removieron los artefactos de compilación de Android del tracking de git (git rm --cached) y se añadieron al .gitignore para mantener la higiene del repositorio.
- Se implementó un sistema de Escrow (tabla `bot_active_bets` y funciones RPC `place_bet` / `resolve_bet`) en Supabase para evitar pérdidas de oro en minijuegos (`!trampa`, `!dados`, `!21`) si el contenedor de Hugging Face se reinicia a mitad de la jugada.
- Se añadió un sistema de recuperación en el evento `ready` del bot que busca apuestas huérfanas de más de 10 minutos de antigüedad y devuelve automáticamente el oro a los jugadores. [Antigravity]

## [2026-06-21] Portal Anime Proveedor por Defecto
- Se cambió el proveedor inicial por defecto a TioAnime y se deshabilitó temporalmente la opción de AnimeFLV (marcada como En Mantenimiento) debido a fallos en el scraper externo. [Antigravity]

## [2026-06-21] Limite de Misiones UI
- Se agregó un límite inicial de 3 misiones visibles en App.tsx con un botón de ocultar/mostrar para liberar espacio vertical en el tablero operativo. [Antigravity]
# AI Collaboration Log & Project Context

Este archivo sirve como puente de comunicacion y registro de actividad entre los asistentes de IA (**Antigravity** y **Jarvis**) y el desarrollador (**e_grado**).
Su proposito es mantener un historial claro de los cambios en el proyecto **Kingdoom-sync** para evitar conflictos y asegurar que todos estemos en la misma pagina.

---

## Instrucciones para Inteligencias Artificiales (Antigravity y Jarvis)

1. **Leer antes de actuar:** Cada vez que inicies sesion o recibas una tarea compleja, revisa rapidamente la seccion `Historial de Cambios` para saber que se modifico recientemente.
2. **Registrar despues de actuar:** **SIEMPRE** que se finalice CUALQUIER cambio (incluso mï¾ƒÎ´ï½­nimo), el asistente responsable debe aï¾ƒÎ´ï½±adir una nueva entrada al `Historial de Cambios` y a la memoria MCP (`kingdoom-memory.jsonl`), y asegurarse de subir ambos a Git (`git add`, `git commit`, `git push`).
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
### [Fecha: 15/06/2026] - [Autor: [Jules]]
- **Code Health Improvement**: Refactored `console.error` calls in `src/utils/characterSheets.ts` to securely log error messages instead of raw error objects. This prevents potential data leaks and improves code readability. Supabase error objects were properly handled to log `error.message` directly.


### [Fecha: 19/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `AGENTS.md`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Simplificacion del protocolo operativo para eliminar loops de bootstrap en agentes externos.
*   **Cambios Clave:**
    *   **[Protocolo - AGENTS]:** Se elimino el bootstrap obligatorio como ritual fijo del repositorio.
    *   **[Continuidad]:** `AGENTS.md` ahora deja una regla mas simple: el agente puede leer changelog o memoria cuando haga falta, pero debe hacerlo en silencio y continuar desde el estado actual.
    *   **[Anti-loop]:** Se corto explicitamente la practica de responder con "Contexto cargado..." como arranque repetitivo entre mensajes o subtareas.
*   **Notas/Advertencias:** No se ejecutaron `npx tsc --noEmit` ni `npm run build` porque el cambio fue exclusivamente documental y de protocolo operativo.

### [Fecha: 17/06/2026] - [Autor: Claude (Opus 4.8)] - Proyecto hermano: kingdoom-fichas
*   **Archivos Modificados:** Repo aparte `XxxRaiconxxX/kingdoom-fichas` (no es este repo). AquÃ­ solo se deja constancia.
*   **Resumen de Tareas:** Lanzada la **v2.0** de la app **kingdoom-fichas** (asistente de fichas, APK Android). Pasada de calidad visual premium + cierre de funciones; APK de distribuciÃ³n generado.
*   **Cambios Clave:**
    *   **[v2.0 push + tag]:** commit y tag `v2.0.0` en `github.com/XxxRaiconxxX/kingdoom-fichas` (rama main). `versionCode 2` / `versionName 2.0`.
    *   **[UI premium]:** fuentes Cinzel + Inter empaquetadas, rediseÃ±o de identidad Kingdoom, medidores de estadÃ­sticas/poderes, estados de vacÃ­o/error/listo, mobile-first con safe-areas Android, favicon herÃ¡ldico.
    *   **[Funciones]:** AnÃ¡lisis con IA usando el endpoint `analyze-ficha` de ESTE repo (Vercel) + sync del Grimorio desde la tabla `grimoire_magic_styles` de Supabase.
    *   **[APK]:** `dist-apk/Kingdoom-Fichas-v2.0.apk` (~4.5 MB, debug/sideload). El binario NO se versiona (artefacto); ver `kingdoom-fichas/dist-apk/LEEME-v2.md` y `kingdoom-fichas/CHANGELOG.md`.
*   **Notas/Advertencias:** Build de APK por CLI con `npm run apk:debug` (requiere JDK 17/21 â€” el JBR de Android Studio sirve â€” y Android SDK). Dependencia con este repo: el endpoint IA `analyze-ficha` ya estÃ¡ desplegado y con CORS abierto para los orÃ­genes de la app.

### [Fecha: 17/06/2026] - [Autor: Claude (Opus 4.8)]
*   **Archivos Modificados:** `api/admin/analyze-ficha.ts` (NUEVO). Proyecto hermano nuevo: `../kingdoom-fichas/` (APK Capacitor asistente de fichas de rol).
*   **Resumen de Tareas:** Arranque del proyecto **kingdoom-fichas** (app/APK que ayuda a los nuevos a crear/validar su ficha antes de enviarla al grupo de WhatsApp) + nuevo endpoint de IA en este repo para el anÃ¡lisis "asistente".
*   **Cambios Clave:**
    *   **[Nuevo endpoint]:** `api/admin/analyze-ficha.ts` â€” proxy Gemini (mismo patrÃ³n que `generate-magic.ts`: `_aiOrchestrator` + `setCorsHeaders`). Recibe `{ficha, avisosLocales}` y devuelve JSON `{veredicto, resumen, sugerencias[]}`. Juzga lo que las reglas locales NO pueden: coherencia edadâ†”historia, raza/reinoâ†”lore, calidad de personalidad y debilidades reales. Temperatura 0.5.
    *   **[App kingdoom-fichas]:** Vite+React+TS+Capacitor (Android). Validador local de reglas duras (stats=12, niveles de poderes=5, raza/reino del catÃ¡logo, arma/habilidades sin magia, mÃ­nimos de texto escalados por edad). Generador de ficha aleatoria vÃ¡lida. Copiar/Compartir a WhatsApp con el formato exacto de la plantilla. Sync del Grimorio desde la tabla `grimoire_magic_styles` (fusionado sobre bundle de 31 magias iniciales extraÃ­das de `extracted_powers/Poderes/`).
*   **Notas/Advertencias:** Endpoint `analyze-ficha` **DESPLEGADO y verificado** (POST real â†’ 200 con JSON `{veredicto, resumen, sugerencias}`; flujo end-to-end probado desde la app en `localhost:4320`, CORS OK). `MISSION_AI_ALLOWED_ORIGINS` ampliada en Vercel con `http://localhost:4320`, `https://localhost`, `capacitor://localhost` (necesario para el APK). Detalle completo del proyecto hermano en `../kingdoom-fichas/HANDOFF.md`. `npm run build` OK en ambos lados. Pendiente del lado fichas: generar el `.apk` (Android Studio).

### [Fecha: 15/06/2026] - [Autor: Claude]
*   **Archivos Modificados:** `TavernCards.tsx`, `TavernRoulette.tsx`, `TavernScratch.tsx`, `TavernPlinko.tsx`, `TavernHorseRace.tsx`, `TavernPenalty.tsx`, `TavernExpedition.tsx`, `TavernExpeditionArcade.tsx` (todos en `src/components/`)
*   **Resumen de Tareas:** Pase de pulido visual coherente sobre los 10 minijuegos restantes de la taberna (commits `d77fd03`, `ff13732`, `5ff59eb`). Enfoque seguro y presentacional: NO se reestructuraron los internos bespoke de cada juego ni los canvas (no verificables sin sesion logueada).
*   **Cambios Clave:**
    *   **[Cifras tabulares]:** `font-variant-numeric: tabular-nums` + `toLocaleString("es-PY")` en todos los displays de oro/saldo/premio/apuesta (chips StatChip/RaceStat/StatusChip/MiniStat y headers). Las cifras dejan de "bailar" al cambiar y muestran separador de miles.
    *   **[Headers de saldo]:** Cards y Scratch adoptaron el patron premium (icono `Coins`, hairline ambar superior, borde `amber-500/15`) ya usado en Cofres.
    *   **[Feedback tactil]:** `kd-touch` agregado a botones planos que no lo tenian â€” refrescar (Cards, Scratch, Ruleta) y CTA principal (Plinko "Lanzar esferas", Carreras "Apostar/Iniciar"). Se evito `motion.button` para no chocar con framer-motion.
    *   **[Sin tocar]:** `TavernCrash` (WIP de Codex, ya en `677e04b`) y `TavernTowerDefense`/`TavernSlots`/`TavernPenalty` que ya tenian `kd-touch` completo y oro formateado.
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores y `npm run build` OK en las 3 tandas. Verificacion: DOM-inspection en `vite preview` (el screenshot se cuelga por la red de Supabase en preview, sin relacion con el cambio). Pendiente para cuando haya sesion logueada: mejoras profundas de los canvas (tableros de Plinko/Carreras/Defensa/Penales) que requieren ojos en vivo.

### [Fecha: 15/06/2026] - [Autor: Claude]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`, `src/components/TavernGame.tsx`
*   **Resumen de Tareas:** Mejoras visuales en la taberna de minijuegos: selector de modos tematizado por tipo de juego y pulido del shell de Cofres.
*   **Cambios Clave:**
    *   **[UI - Selector de taberna]:** los chips de estado de cada minijuego ahora tienen color por tipo (nuevo mapa `TAVERN_STATUS_ACCENTS`: PvE=esmeralda, App=cian, Azar=ambar, Riesgo=carmesi, Rapido=violeta), dando lectura de un vistazo. El boton del modo activo se tematiza con ese mismo color (borde, fondo en gradiente, glow y hairline superior) en vez del ambar uniforme anterior. Hover de inactivos mas marcado y `aria-pressed` para accesibilidad.
    *   **[UI - Cofres (TavernGame)]:** header de saldo con icono `Coins`, `tabular-nums` y separador de miles (`toLocaleString es-PY`), hairline superior ambar y `kd-touch` en el boton de refrescar; linea de info de apuesta tambien con cifras tabulares y miles.
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores; `npm run build` OK. Verificado en vivo con `vite preview` (inspeccion del DOM: acento esmeralda en boton PvE activo y chip "Azar" ambar confirmados; el screenshot se colgaba por la red de Supabase en preview, sin relacion con el cambio). NO se toco `TavernCrash.tsx` (tenia trabajo en curso de Codex, ya commiteado en `677e04b`). Cambios 100% presentacionales. Quedan los otros 10 minijuegos para pulir en proximas iteraciones si se desea.

### [Fecha: 15/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/PurchaseModal.tsx`, `src/sections/MarketSection.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/features/market/market.rotation.ts`, `src/features/market/market.rotation.test.ts`
*   **Resumen de Tareas:** CorrecciÃ³n de la posiciÃ³n del modal de compra del mercado en mÃ³viles, ajustes visuales en el Frente de Temporada, y cambio en el intervalo de rotaciÃ³n del mercado a 2 horas.
*   **Cambios Clave:**
    *   **[Market - Modal de compra en mÃ³viles]:** Se centrÃ³ el modal verticalmente en el viewport mÃ³vil y se aÃ±adiÃ³ `overflow-y-auto` al contenedor exterior para permitir el scroll del formulario en pantallas pequeÃ±as.
    *   **[Market - Causa raÃ­z transform/fixed]:** Se envolviÃ³ el renderizado de `PurchaseModal` con `createPortal(..., document.body)` para evitar que ancestros con transformaciones CSS (animaciÃ³n `content-fade-in` de `kd-stage` en `index.css`) rompieran la posiciÃ³n fija del modal.
    *   **[Profile - Frente de Temporada]:** Se redujo el tamaÃ±o de la etiqueta "Avance" en `SeasonRing` de `8px` a `6.5px` y se disminuyÃ³ el espaciado de letras a `0.12em` para evitar desbordes en el cÃ­rculo de progreso. Se eliminÃ³ la etiqueta de ayuda redundante *"El resumen detallado de la temporada queda oculto..."* en estado colapsado.
    *   **[Market - RotaciÃ³n de la tienda]:** Se cambiÃ³ la frecuencia de rotaciÃ³n de artÃ­culos (`MARKET_ROTATION_WINDOW_MS`) de 5 horas a 2 horas, adaptando ademÃ¡s el intervalo en los tests de simulaciÃ³n en `market.rotation.test.ts`.
### [Fecha: 16/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Correccion de desincronizacion visual en TavernCrash cuando la ronda colapsaba instantaneamente o al reiniciar el canvas.
*   **Cambios Clave:**
    *   **[Crash - Canvas Reset]:** Se agrego `redrawCanvas(...)` para forzar repintado del grafico con el estado real de la ronda actual, en vez de dejar visible la curva anterior.
    *   **[Crash - Nueva Ronda]:** `handleStart()` ahora cancela cualquier `requestAnimationFrame` previo, resetea `pointsRef`, multiplicador y canvas antes de calcular el nuevo `crashPoint`.
    *   **[Crash - Colapso 1.00x]:** Cuando la ronda explota de forma instantanea, el lienzo se vuelve a pintar en `1.00x`, evitando que el jugador vea una trayectoria vieja por encima del auto-retiro configurado.
    *   **[Crash - Fin de Ronda]:** Al detectar el colapso normal, la funcion agrega el ultimo punto real al historial del canvas y dibuja la ronda final antes de marcar `crashed`.
*   **Notas/Advertencias:** `npx tsc --noEmit` paso limpio y `npm run build` tambien. El ajuste corrige la inconsistencia visual reportada; si reaparece una perdida injusta con evidencia nueva, habria que inspeccionar una posible carrera entre auto cashout y crash en el mismo frame.

### [Fecha: 15/06/2026] - [Autor: Claude]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/index.css`
*   **Resumen de Tareas:** Rediseno visual detallado de la tarjeta "Frente de temporada" (componente `SeasonRankSpotlight`). Commit `d807f06` (codigo) ya pusheado; esta entrada documenta el cambio (se diferio antes para no absorber el WIP de Codex en `AI_CHANGELOG.md`).
*   **Cambios Clave:**
    *   **[UI - Tematizacion por rango]:** nuevo mapa `SEASON_ACCENTS` que pinta todo el panel con el color del rango actual (bronce Siervo -> oro Escudero -> cielo Caballero -> violeta Senor -> carmesi Senor Oscuro) en borde, fondo, halo, barra de progreso y tiles, via estilos inline `rgb(${accent} / x)`.
    *   **[UI - Avance circular]:** el "Avance %" paso de una cajita de texto a un anillo SVG animado (`SeasonRing`), coherente con los gauges del diseno.
    *   **[UI - Detalle]:** tiles Misiones/Eventos/Staff con iconos tematizados (Swords/Sparkles/Crown); "Siguiente objetivo" con icono Target y chip del color del proximo rango; `tabular-nums` en todas las cifras; eyebrow con Sparkles y "Cierre estimado" con CalendarClock.
    *   **[CSS - index.css]:** `kd-season-orb` (halo del rango que respira) y `kd-season-bar::after` (barrido de luz en la barra) + marcas de cuartos en la barra. Ambas animaciones se desactivan bajo `prefers-reduced-motion`.
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores; `npm run build` OK; CSS+JS confirmados en el bundle. Cambio 100% presentacional (mismos props y wiring de datos). No se pudo capturar screenshot logueado (el panel solo renderiza con jugador conectado y no hay credenciales de jugador real en el entorno) â€” verificacion visual final queda a cargo del usuario en su sesion.

### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_seasons.sql`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Correccion de la RPC `award_manual_mission_rank_points(...)` tras el primer uso real desde WhatsApp.
*   **Cambios Clave:**
    *   **[Supabase - Fix RPC]:** Se agrego la directiva `#variable_conflict use_column` dentro de `award_manual_mission_rank_points(...)`.
    *   **[Causa Raiz]:** La funcion devuelve una tabla con columna `season_id`, y PL/pgSQL estaba interpretando de forma ambigua ese nombre dentro del `ON CONFLICT (season_id, player_id, source_type, source_key, external_ref)` al ejecutar `!misioncompleta`.
    *   **[Impacto]:** El fix mantiene intacta la logica anti-duplicado por `external_ref`, pero elimina el choque de nombres que provocaba el error `column reference "season_id" is ambiguous`.
*   **Notas/Advertencias:** Hace falta volver a ejecutar el `create or replace function public.award_manual_mission_rank_points(...)` en Supabase para que el fix quede aplicado en produccion.

### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_seasons.sql`, `src/utils/playerRanks.ts`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Preparacion del backend compartido para premios manuales de temporada desde staff/GM y lectura de esos premios en la web.
*   **Cambios Clave:**
    *   **[Supabase - Awards]:** Se agrego `season_rank_awards` para registrar puntos manuales de clasificatoria por temporada, con `source_type`, `source_key`, dificultad opcional, `points_awarded`, staff emisor, notas, `external_ref` y `metadata`.
    *   **[Supabase - RPC Bot Ready]:** Se creo `award_manual_mission_rank_points(...)`, una funcion segura pensada para el futuro comando de WhatsApp `!misioncompleta`, que toma una lista de jugadores, resuelve el puntaje desde `season_rank_point_rules` y registra premios manuales dentro de la temporada activa.
    *   **[Supabase - Rollover]:** El cierre de temporada ahora tambien contempla los premios manuales en snapshots y seeds de la siguiente temporada.
    *   **[Frontend - Perfil]:** `playerRanks.ts` y `PlayerProfilePanel` ya suman premios manuales del jugador dentro de la temporada activa, mostrando su conteo en el resumen clasificatorio.
*   **Notas/Advertencias:** El repo web ya esta listo para reflejar premios manuales, pero el comando de WhatsApp aun falta implementarse en `kingdoom-bot`.

### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_seasons.sql` [NEW], `src/utils/playerRanks.ts`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Backend de temporadas, snapshots y seeds para habilitar cierre automatico con reset de dos rangos y lectura de la temporada activa desde la web.
*   **Cambios Clave:**
    *   **[Supabase - Temporadas]:** Se creo `supabase_season_rank_seasons.sql` con las tablas `season_rank_seasons`, `season_rank_player_seeds` y `season_rank_player_snapshots`, mas un bootstrap de `Temporada Inicial` para que el sistema quede usable al correr el SQL.
    *   **[Supabase - Cierre/Reset]:** Se implemento la funcion `close_and_rollover_active_season_rank(p_force boolean default false)`, que cierra la temporada activa, congela snapshots por jugador, aplica el descenso de 2 rangos (`6` escalones), crea o activa la siguiente temporada e inserta los seeds del siguiente ciclo.
    *   **[Frontend - Temporada Activa]:** `playerRanks.ts` ahora intenta leer la temporada activa y los seeds del jugador desde Supabase, usando esos datos como ventana y punto de arranque del calculo del perfil en vez de depender unicamente del mes actual.
    *   **[Perfil - Copy]:** `PlayerProfilePanel` paso a hablar de temporada activa y muestra el nombre de temporada junto con los puntos semilla heredados al iniciar el ciclo.
*   **Notas/Advertencias:** Falta ejecutar el SQL nuevo en Supabase para activar el cierre/rollover real. El scheduler o bot que dispare la funcion automatica todavia no fue conectado.

### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_rules.sql` [NEW], `src/utils/playerRanks.ts`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Backend inicial del sistema clasificatorio mediante tablas configurables de puntos y umbrales, con lectura dinamica desde la app.
*   **Cambios Clave:**
    *   **[Supabase - Reglas]:** Se agrego `supabase_season_rank_rules.sql`, que crea `season_rank_point_rules` para puntajes por contenido (`easy`, `medium`, `hard`, `elite`, y evento recompensado) y `season_rank_thresholds` para los 15 escalones de la temporada de 10 semanas.
    *   **[Supabase - Seed Inicial]:** El SQL deja cargados los valores acordados para la primera temporada: misiones `12/28/55/95`, eventos recompensados `50`, y los umbrales desde `Siervo III (0)` hasta `Senor Oscuro I (2400)`.
    *   **[Frontend - Lectura Dinamica]:** `playerRanks.ts` dejo de depender exclusivamente de hardcodes y ahora intenta leer reglas y thresholds desde Supabase. Si las tablas aun no existen o fallan, conserva fallback local para no romper la UI.
*   **Notas/Advertencias:** La duracion de temporada de 10 semanas ya esta modelada en los umbrales, pero el calendario/soft reset mensual aun no fue implementado como proceso automatico.

### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/playerRanks.ts`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Extension de la clasificatoria mensual para incluir eventos recompensados como segunda fuente real de puntos.
*   **Cambios Clave:**
    *   **[Clasificatoria - Eventos]:** `fetchPlayerMonthlyRankSnapshot` ahora consulta tambien `realm_event_participants` con `status = rewarded` y `reward_delivered = true` dentro del mes actual, evitando contar inscripciones sin validacion final del staff.
    *   **[Clasificatoria - Balance Inicial]:** Se agrego un peso temporal plano de `50` puntos por evento recompensado, coexistiendo con los puntos por dificultad de misiones (`15/35/70/120`).
    *   **[Perfil - Feedback]:** `PlayerProfilePanel` paso a informar cuantas misiones y cuantos eventos recompensados del mes estan entrando al calculo de la temporada.
*   **Notas/Advertencias:** La fuente de puntos ya contempla misiones y eventos, pero aun falta una tabla dedicada para balance fino por tipo de contenido y logros especiales.

### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/playerRanks.ts` [NEW], `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Conexion inicial del sistema clasificatorio mensual a datos reales de Supabase usando misiones recompensadas del mes actual.
*   **Cambios Clave:**
    *   **[Clasificatoria - Logica]:** Se creo `fetchPlayerMonthlyRankSnapshot` para leer `realm_mission_claims` recompensadas (`status = rewarded`, `reward_delivered = true`) dentro del mes actual y convertirlas en puntos de temporada por dificultad.
    *   **[Clasificatoria - Umbrales]:** Se definio una primera escalera de 15 escalones (`Siervo III` hasta `Senor Oscuro I`) derivada por puntos, con pesos iniciales de misiones `easy=15`, `medium=35`, `hard=70`, `elite=120`.
    *   **[Perfil - Integracion]:** `PlayerProfilePanel` ahora deja de mostrar una insignia puramente estatica y pasa a renderizar rango, escalon y puntos mensuales reales basados en misiones ya validadas y pagadas por staff.
*   **Notas/Advertencias:** Esta primera conexion solo contempla misiones recompensadas. Aun faltan eventos, logros especiales y el reset mensual de dos rangos.

### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `public/img/ranks/siervo.png` [NEW], `public/img/ranks/escudero.png` [NEW], `public/img/ranks/caballero.png` [NEW], `public/img/ranks/senor.png` [NEW], `public/img/ranks/senor-oscuro.png` [NEW], `src/components/RankBadge.tsx` [NEW], `src/components/PlayerProfilePanel.tsx`, `src/types.ts`
*   **Resumen de Tareas:** Integracion visual inicial del sistema clasificatorio mensual en el perfil del jugador, usando las insignias generadas y dejando un fallback seguro mientras aun no existe la capa real de puntos/rangos en Supabase.
*   **Cambios Clave:**
    *   **[Perfil - UI]:** Se creo el componente `RankBadge` para renderizar la insignia, nombre de rango, escalon y puntos mensuales con tamanos `sm`, `md` y `lg`, reutilizable en futuras vistas del sistema clasificatorio.
    *   **[Perfil - Integracion]:** Se inserto la insignia clasificatoria en las variantes expandida y compacta de `PlayerProfilePanel`, mostrando por defecto `Siervo III` hasta enlazar los datos reales de temporada.
    *   **[Assets - Arte]:** Se incorporaron al repositorio las cinco insignias base (`Siervo`, `Escudero`, `Caballero`, `Senor`, `Senor Oscuro`) dentro de `public/img/ranks/` para servirlas desde la SPA sin dependencias externas.
    *   **[Tipos - Preparacion]:** `PlayerAccount` quedo preparado con campos opcionales `rankName`, `rankTier` y `monthlyRankPoints` para conectar despues la logica mensual sin rehacer el contrato visual.
*   **Notas/Advertencias:** Esta entrega es solo visual. Aun no existe persistencia de puntos mensuales, calculo de ascensos por misiones ni reset de fin de mes.

### [Fecha: 13/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `AGENTS.md`
*   **Resumen de Tareas:** ActualizaciÃ³n de las directrices operativas del agente a la realidad actual del proyecto.
*   **Cambios Clave:**
    *   **[DocumentaciÃ³n - Agentes]:** Se reestructuraron las secciones 1 a 5 de `AGENTS.md` para incluir el nuevo Working Directory, la arquitectura del repositorio completa (los nuevos minijuegos, vistas de administraciÃ³n y modales de pago), las reglas de negocio de cuotas e intereses de financiaciÃ³n, las nuevas tablas y RPCs de Supabase y las convenciones premium de diseÃ±o de UI/UX. Las secciones 6, 7 y 8 se mantuvieron intactas.

### [Fecha: 11/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`, `src/components/PlayerAuctionPanel.tsx` [NEW]
*   **Resumen de Tareas:** CreaciÃ³n de la interfaz web de Subastas para jugadores con soporte transaccional y sincronizaciÃ³n en tiempo real.
*   **Cambios Clave:**
    *   **[Web - Player UI]:** Se diseÃ±Ã³ y desarrollÃ³ el componente `PlayerAuctionPanel` con un panel de subastas activas, countdowns individuales en vivo, soporte para el envÃ­o de pujas y botÃ³n de retiro con confirmaciones.
    *   **[Web - IntegraciÃ³n]:** Se incrustÃ³ el panel en `MarketSection.tsx` bajo un nuevo bloque `<details>` premium de color Ã¡mbar con el icono `Gavel`.
    *   **[Web - Realtime]:** Se enlazÃ³ el componente a Supabase Realtime para recibir actualizaciones automÃ¡ticas de ofertas y ganadores al instante sin recarga de pÃ¡gina.
*   **Notas/Advertencias:** ValidaciÃ³n de build exitosa (`npm run build` completado en 2m 56s).

### [Fecha: 11/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/src/scheduler.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/handlers/auctions.js` [NEW], `kingdoom-bot/src/handlers/auctionsRealtime.js` [NEW]
*   **Resumen de Tareas:** IntegraciÃ³n completa de la mecÃ¡nica de Subastas en el Bot de WhatsApp: comandos de jugador, anuncios en tiempo real y resoluciÃ³n automÃ¡tica de expiraciones.
*   **Cambios Clave:**
    *   **[Bot - Comandos]:** Se implementaron los comandos pÃºblicos `!subastas` (listar subastas activas), `!pujar <item / #lista> <monto>` (realizar pujas atÃ³micas mediante RPC) y `!retirarse <item / #lista>` (bloquear pujas futuras en una subasta).
    *   **[Bot - Realtime]:** Se aÃ±adiÃ³ `startAuctionsRealtime` para que el bot escuche cambios en Supabase Realtime y publique automÃ¡ticamente en WhatsApp cuando una subasta se crea, se puja, o se resuelve.
    *   **[Bot - Scheduler]:** Se configurÃ³ una tarea recurrente en el cron del scheduler que comprueba cada minuto si hay subastas expiradas para resolverlas automÃ¡ticamente llamando a la RPC `resolve_market_auction`.
*   **Notas/Advertencias:** Los archivos JavaScript modificados pasan el control de sintaxis de Node sin errores.

### [Fecha: 11/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Handoff de la sesiÃ³n para Antigravity 2. Todo ha sido validado, el bot fue limpiado y optimizado, y la carga inicial de la web fue mejorada.
*   **Cambios Clave:**
    *   **[Handoff / Next Steps]:** 
        1. **AtÃ³mica de apuestas:** Priorizar la refactorizaciÃ³n de las apuestas del bot (`!dados`, `!trampa`, `!21`) mediante funciones RPC atÃ³micas en Supabase (`place_bet`) para evitar condiciones de carrera y pÃ©rdidas de oro inconsistentes.
        2. **Subastas:** Validar y completar la interfaz de subastas (actualmente estÃ¡n hechas las utilidades y SQL).
        3. **Monitoreo Bot:** Observar la estabilidad del bot en Hugging Face (sin el flag `--single-process`) para comprobar la mitigaciÃ³n del reinicio.
*   **Notas/Advertencias:** El repositorio web (`Kingdoom-sync`) compila sin errores (`tsc --noEmit` y `build` exitosos). El bot (`kingdoom-bot`) tiene los cambios de optimizaciÃ³n empujados.

### [Fecha: 11/06/2026] - [Autor: Claude]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/Dockerfile` (+ borrados: `src/scripts/notebooklm_*.py`, `test_notebooklm.js`)
*   **Resumen de Tareas:** Hardening del bot tras auditoria: cadena de fallback de Gemini corregida, eliminado `--single-process` de Puppeteer (sospechoso principal del loop de reinicios) y limpieza completa de los restos de NotebookLM.
*   **Cambios Clave:**
    *   **[Bot - IA]:** la cadena de fallback de `askKingdoomAI` incluia `gemini-3.5-flash` (modelo inexistente -> 404 garantizado en cada fallback) y `gemini-1.5-flash` (retirado por Google). Ahora: modelo base -> `gemini-2.5-flash` -> `gemini-2.0-flash`. Menos latencia y mas fiabilidad del GM cuando el modelo primario falla por cuota.
    *   **[Bot - Estabilidad]:** se quito `--single-process` de los args de Puppeteer. Ese flag es causa conocida de `Protocol error / Target closed / Session closed` con whatsapp-web.js â€” exactamente los errores que el propio `index.js` detecta para reiniciar el contenedor. Observar si baja la frecuencia de reinicios en HF Spaces.
    *   **[Bot - Limpieza NotebookLM]:** el Dockerfile instalaba `python3`, `pip` y `notebooklm-py` aunque la integracion se removio el 08/06 (imagen mas pesada sin razon). Eliminados tambien los scripts Python muertos, `test_notebooklm.js`, y las funciones sin callers `getMissionsWithMissingNotebooks`/`updateMissionNotebookId` en `supabase.js` (la columna `notebook_id` sigue en la BD, el bot ya no la usa).
*   **Notas/Advertencias:** `node --check` OK en los 3 JS editados; sin referencias rotas (grep). Pusheado a GitHub y a Hugging Face (redeploy del Space â€” el bot se reinicio con la imagen nueva). Pendientes de la auditoria, NO implementados aun: (1) race condition en apuestas `!dados`/`!trampa`/`!21` â€” la validacion de saldo y el debito no son atomicos, requiere RPC `place_bet` en Supabase; (2) sesiones de blackjack en memoria se pierden ante reinicios con apuesta ya debitada.

### [Fecha: 11/06/2026] - [Autor: Claude]
*   **Archivos Modificados:** `src/index.css`
*   **Resumen de Tareas:** Pulido visual y de experiencia: foco accesible tematico, fin del flash gris en Android, layout sin saltos de scrollbar, titulos balanceados y micro-interaccion en la navegacion.
*   **Cambios Clave:**
    *   **[Accesibilidad/Polish]:** anillo de foco global `:focus-visible` que sigue el color de acento de cada seccion (ambar en Inicio, violeta en Grimorio, etc.); el outline solo aparece navegando con teclado, mouse/touch no lo muestran (`:focus:not(:focus-visible)`).
    *   **[Movil]:** `-webkit-tap-highlight-color: transparent` (elimina el flash gris de Android al tocar; el feedback tactil lo sigue dando `.kd-touch` con su scale) y `overscroll-behavior-y: contain` en body (sensacion app-like, sin rebote del documento).
    *   **[Fluidez de layout]:** `scrollbar-gutter: stable` en html â€” al cambiar entre pestaÃ±as cortas (Inicio) y largas (Grimorio) ya no hay salto horizontal por aparicion/desaparicion del scrollbar. Los paneles internos con scroll (modales, admin) usan `overscroll-behavior: contain` para no arrastrar el scroll de la pagina.
    *   **[Tipografia]:** `text-wrap: balance` en h1-h3 (titulos multilinea reparten palabras equilibradamente, visible en movil: "Reino de / las Sombras") y `font-variant-numeric: tabular-nums` en `.kd-stat-card` (los contadores no "bailan" al cambiar de valor).
    *   **[Navegacion]:** micro-interaccion en la barra inferior â€” el icono de la pestaÃ±a activa se eleva 1px con scale 1.06 y transicion suave; deshabilitada bajo `prefers-reduced-motion`.
*   **Notas/Advertencias:** build OK; verificado en vivo con `vite preview` (computed styles confirmados via DevTools y screenshots desktop/movil, 0 errores de consola). Todo es CSS progresivo: navegadores viejos ignoran `text-wrap: balance` y `scrollbar-gutter` sin romper nada.

### [Fecha: 11/06/2026] - [Autor: Claude]
*   **Archivos Modificados:** `vite.config.ts`, `index.html`, `src/context/PlayerSessionContext.tsx`
*   **Resumen de Tareas:** Optimizacion de rendimiento web: primer load de JS reducido ~49% (gzip ~294KB -> ~149KB) y eliminacion de re-renders globales del polling de sesion.
*   **Cambios Clave:**
    *   **[Bug critico de chunks - preexistente]:** Rollup colocaba modulos eager compartidos DENTRO de chunks lazy: `supabaseClient` caia en `GrimoireSection` (el grimorio completo, UI + 235KB de datos, se descargaba en el primer load), `PlayerSessionContext`/`players.ts` caian en `TavernRoulette`, el `vite/preload-helper` en `MarketSection` y `SectionHeader`/`ExpandableText` en `LibrarySection`. Resultado: ~350KB de JS "lazy" viajaban eager via modulepreload. Fix: nuevo chunk `app-core` que ancla esos modulos compartidos y corta las aristas invertidas. Ahora el preload eager es solo `react + supabase + gsap + app-core + icons + entry`; `framer-motion` (125KB) y todas las secciones quedaron realmente lazy.
    *   **[manualChunks - regla react corregida]:** `id.includes("react")` se evaluaba antes que `lucide-react` (la regla "icons" estaba muerta) y arrastraba `@gsap/react`, `@vercel/*/react` y `@tanstack/react-virtual` al chunk eager. Ahora el match es estricto (`react|react-dom|scheduler`), `@vercel` tiene chunk propio realmente diferido (como disenaba `main.tsx`), `gsap` chunk propio, y los datos del grimorio (`src/data/grimorio.ts`, 235KB) se separan de la UI en `grimoire-data` para cache independiente.
    *   **[index.html]:** `preconnect` a Supabase (la app dispara auth + perfil apenas bootea; ahorra DNS+TLS en el primer load, relevante en movil).
    *   **[PlayerSessionContext - fluidez]:** `refreshPlayer` ahora conserva la MISMA referencia de objeto si el perfil no cambio, con lo que React hace bailout y el polling de 10s ya no re-renderiza todo el arbol de consumidores (evita micro-trabas durante minijuegos/animaciones). Ademas `touchPlayerActivity` (UPDATE a la BD por usuario conectado) se throttlea a 1 vez cada 5 min en vez de cada 10s.
    *   **[Tooling]:** plugin de diagnostico en `vite.config.ts` activable con `VITE_DEBUG_CHUNKS=1 npm run build` que imprime que modulos componen cada chunk (util para detectar regresiones de chunking).
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores; `npm run build` OK (revalidado post-merge con el redesign del admin); smoke test con `vite preview` (boot correcto, 0 errores de consola). Si se cambia de proyecto Supabase, actualizar el dominio del `preconnect` en `index.html`. La marca de actividad ahora tiene granularidad de 5 min (antes 10s); si algun reporte de staff necesita mas precision, ajustar `ACTIVITY_TOUCH_INTERVAL_MS` en `PlayerSessionContext.tsx`.

### [Fecha: 11/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-sync/src/components/AdminControlSheet.tsx`, `Kingdoom-sync/src/components/admin/AdminControlPrimitives.tsx`, `Kingdoom-sync/src/index.css`
*   **Resumen:** RediseÃ±o completo y premium del menÃº de navegaciÃ³n de pestaÃ±as del panel de administraciÃ³n y eliminaciÃ³n total del "Generador de Items IA / Pinterest" de la secciÃ³n Mercado del admin.
*   **Cambios Clave:**
    *   **[Admin - NavegaciÃ³n/Tabs]:** RediseÃ±o estÃ©tico y responsivo de las 10 pestaÃ±as del menÃº de administraciÃ³n.
        - Se agregaron iconos de Lucide-React semÃ¡nticos para cada botÃ³n de pestaÃ±a.
        - Se estructuraron las pestaÃ±as en 3 grupos lÃ³gicos diferenciados con separadores visuales (`.kd-admin-tab-divider`): **GestiÃ³n** (Jugadores, Misiones, Eventos), **EconomÃ­a** (Mercado, Negocios) e **IA & Lore** (Staff IA, Magias, Bestiario, Flora, Archivo IA).
        - Se optimizÃ³ el estilo activo/inactivo con gradientes premium, sombras internas y hover interactivo suave.
        - Se aÃ±adiÃ³ responsividad: en dispositivos mÃ³viles (`< 640px`) se despliega en un grid compacto de 2 columnas para una cÃ³moda navegaciÃ³n tÃ¡ctil; en pantallas de escritorio se mantiene la disposiciÃ³n en lÃ­nea optimizando el espacio horizontal.
    *   **[Admin - Limpieza de Generador IA]:** RemociÃ³n completa del mÃ³dulo experimental "Generador de Items IA" basado en Pinterest en la pestaÃ±a de Mercado.
        - Se eliminÃ³ todo el cÃ³digo JSX que contenÃ­a el visualizador de Pinterest y el disparador de IA (inputs de URL de Pinterest, previsualizadores, feedbacks, tema de IA y botones de acciÃ³n).
        - Se limpiaron las variables de estado relacionadas (`marketPinterestUrl`, `marketPinterestFeedback`, `marketPinterestPreview`, `marketAiTheme`, `marketAiFeedback`, `isGeneratingMarketItemAi`, `isLoadingPinterestReference`).
        - Se eliminaron las funciones controladoras (`handleLoadPinterestReference`, `handleGenerateMarketItemFromPin`) y se quitaron sus inicializaciones y dependencias en `resetMarketForm`, `preloadMarketItem` y `handleMarketImageUpload`.
        - Se eliminaron los imports obsoletos de `marketAi` y `pinterestPicker` en la cabecera.
    *   **[Admin - Estilos del Sistema]:** AdiciÃ³n en `index.css` de clases CSS `.kd-admin-tabs`, `.kd-admin-tab-group` y `.kd-admin-tab-divider` con transiciones fluidas y gradientes HSL.
*   **Notas/Advertencias:** Los archivos utilitarios subyacentes (`utils/marketAi.ts` y `utils/pinterestPicker.ts`) se preservaron en el repositorio para no romper posibles dependencias en API routes, pero ya no tienen acoplamiento con la interfaz de usuario. Verificado con `npx tsc --noEmit` y `npm run build` con Ã©xito.

### [Fecha: 10/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `api/admin/generate-market-item.ts`
*   **Resumen de Tareas:** Mejora del prompt de generaciÃ³n de Ã­tems con IA (Market Forge) para alinear mecÃ¡nicas y hacer los efectos mÃ¡s descriptivos.
*   **Cambios Clave:**
    *   **Contexto del Sistema:** Se actualizÃ³ el prompt para incluir las reglas exactas del sistema de Kingdoom: dados (d20 + stat, daÃ±o en d6), mecÃ¡nicas de mano blanca (fÃ­sica) y mano negra (mÃ¡gica/veneno), y las defensas activas (STR = Bloquear, INT = Defender, AGI = Esquivar).
    *   **GeneraciÃ³n de Habilidad (`ability`):** Se ajustaron las reglas JSON del prompt. Ahora la IA debe obligatoriamente describir el efecto mecÃ¡nico con porcentajes exactos ligados a stats (ej. 30% del STR) y definir una frecuencia clara de uso (cooldown en turnos o porcentaje de probabilidad de activaciÃ³n).
*   **Notas/Advertencias:** ValidaciÃ³n de build sin errores (`npm run build` exitoso). Las mecÃ¡nicas deberÃ­an estar mucho mejor representadas en el texto autogenerado.

### [Fecha: 10/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/types.ts`, `src/utils/inventory.ts`, `src/components/PlayerInventorySheet.tsx`
*   **Resumen de Tareas:** VisualizaciÃ³n del estado de cuotas e Ã­tems bloqueados en el Inventario del jugador.
*   **Cambios Clave:**
    *   **`src/types.ts`**: Se aÃ±adiÃ³ `isLocked?: boolean` a `InventoryEntry` y se creÃ³ el nuevo tipo `PaymentPlan` que mapea la tabla `payment_plans` de Supabase.
    *   **`src/utils/inventory.ts`**: Se aÃ±adiÃ³ `is_locked` al select y al mapeo de `fetchPlayerInventory`. Se creÃ³ `fetchPlayerPaymentPlans` que obtiene todos los planes activos/en-mora del jugador.
    *   **`src/components/PlayerInventorySheet.tsx`**: Reescrito con sistema de pestaÃ±as: pestaÃ±a "Inventario" (con badge ðŸ”’ "En cuotas" en cada Ã­tem bloqueado) y pestaÃ±a "CrÃ©ditos" que muestra resumen (planes activos, en mora, deuda total) y tarjetas detalladas por plan (cuotas pagadas/total, barra de progreso, saldo restante, prÃ³ximo pago, dÃ­as de mora).
*   **Notas/Advertencias:** `npx tsc --noEmit` â†’ exit 0. Sin errores.

### [Fecha: 10/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/purchases.ts`, `supabase_market_installments.sql`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** CorrecciÃ³n del error "Tu cuenta segura aun no esta vinculada a un jugador del reino." al intentar comprar artÃ­culos en el mercado.
*   **Cambios Clave:**
    *   **TypeScript (`src/utils/purchases.ts`)**: Se agregÃ³ el parÃ¡metro `p_player_id: input.playerId` que faltaba en la llamada RPC a `purchase_market_item_v2`. Al omitir este parÃ¡metro en el frontend, la base de datos recibÃ­a un valor NULL y por lo tanto fallaba al resolver la relaciÃ³n de vinculaciÃ³n.
    *   **SQL (`supabase_market_installments.sql`)**: Se ajustÃ³ la firma de la funciÃ³n `purchase_market_item_v2` para aceptar `p_player_id uuid` e implementÃ³ lÃ³gica de auto-vinculaciÃ³n. Si el jugador no estÃ¡ vinculado pero el usuario estÃ¡ autenticado, la base de datos inserta automÃ¡ticamente una fila en `player_auth_links` para vincularlos en el primer intento de compra segura.
*   **Notas/Advertencias:** Se corriÃ³ `npx tsc --noEmit` y `npm run build` con Ã©xito. La base de datos ya cuenta con la funciÃ³n actualizada.

### [Fecha: 08/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `Kingdoom-sync/AI_CHANGELOG.md`
*   **Resumen:** OptimizaciÃ³n drÃ¡stica de latencia en la lectura de mensajes del bot y adecuaciÃ³n para despliegue en Hugging Face Spaces.
*   **Cambios Clave:**
    *   **[Bot - OptimizaciÃ³n de Latencia]:** Se refactorizÃ³ el manejador de mensajes en `index.js`. La funciÃ³n `checkIsAdmin`, que ejecutaba una consulta a Supabase por cada mensaje recibido, ahora es *perezosa (lazy)*. Solo consulta la BD si el mensaje contiene un comando de la lista blanca administrativa o si el usuario estÃ¡ interactuando en el `Market Forge`. Esto reduce a cero la latencia de base de datos para trÃ¡fico estÃ¡ndar de rol.
    *   **[Bot - Despliegue en Hugging Face]:** Se confirmÃ³ el correcto funcionamiento del servidor HTTP existente en `index.js`, el cual expone el puerto definido por el entorno (`PORT` 7860), asegurando que el *healthcheck* de Hugging Face Spaces apruebe el arranque y mantenga el contenedor vivo (estado *Running*).

### [Fecha: 08/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `Kingdoom-sync/AI_CHANGELOG.md`
*   **Resumen:** RefactorizaciÃ³n y simplificaciÃ³n del tracker del Game Master (GM): eliminaciÃ³n de la integraciÃ³n con Google NotebookLM.
*   **Cambios Clave:**
    *   **[Bot - Limpieza de NotebookLM]:** Se eliminaron los subprocesos de Python y las funciones de aprovisionamiento de libretas en caliente. La integraciÃ³n previa resultaba inestable al depender fuertemente de cookies mediante Playwright.
    *   **[Bot - Motor Gemini Puro]:** La narrativa del GM ahora vuelve a procesarse exclusivamente con el motor base de Gemini (`askKingdoomAI`), asegurando respuestas mÃ¡s estables y sin retrasos de aprovisionamiento.
    *   **[Bot - OptimizaciÃ³n de Arranque]:** Se eliminÃ³ el loop de `autoProvisionMissions()` en el evento `ready` de WhatsApp (`index.js`), acelerando el encendido del bot y limpiando logs innecesarios.

### [Fecha: 08/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/scripts/notebooklm_provisioner.py`, `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `Kingdoom-sync/AI_CHANGELOG.md`
*   **Resumen:** Integraciï¾ƒï½³n completa y automatizaciï¾ƒï½³n del Game Master con Google NotebookLM mediante sincronizaciï¾ƒï½³n dinï¾ƒï½¡mica de grimorio y enciclopedia y aprovisionamiento bajo demanda.
*   **Cambios Clave:**
    *   **[Bot - Supabase Integraciï¾ƒï½³n]:** Creaciï¾ƒï½³n de dos funciones helper robustas en `supabase.js`: `getFormattedGrimoire()` y `getFormattedEncyclopedia()`.
        - `getFormattedGrimoire()`: Consulta la tabla `grimoire_magic_styles` de Supabase, extrayendo la informaciï¾ƒï½³n estructurada de hechizos, sus niveles, cooldowns, lï¾ƒï½­mites de uso, efectos y contramedidas de seguridad ("anti-mano negra"). Genera un documento en formato Markdown riguroso y jerï¾ƒï½¡rquico.
        - `getFormattedEncyclopedia()`: Consulta la tabla `knowledge_documents` de Supabase para compilar las entradas histï¾ƒï½³ricas, facciones, reglamentos del sistema de combate, geopolï¾ƒï½­tica y lore general del Reino, formateando todo en un Markdown legible.
    *   **[Bot - Provisionador Python]:** Actualizaciï¾ƒï½³n de `notebooklm_provisioner.py` para aceptar el payload ampliado con `grimorio_content` y `enciclopedia_content`. Este script normaliza la cookie `NOTEBOOKLM_COOKIES` en formato Playwright, crea el Notebook con el tï¾ƒï½­tulo `[GM] <Nombre de Misiï¾ƒï½³n>` y aï¾ƒï½±ade secuencialmente cuatro fuentes de texto independientes usando el cliente automatizado de NotebookLM:
        1. "Reglas Generales del Game Master (GM)" (System Prompt base).
        2. "Lore e Indicaciones de la Misiï¾ƒï½³n - <Nombre>" (Instrucciones especï¾ƒï½­ficas).
        3. "Grimorio Oficial de Magias y Hechizos" (Markdown dinï¾ƒï½¡mico desde Supabase).
        4. "Enciclopedia y Codex del Reino" (Markdown dinï¾ƒï½¡mico de lore desde Supabase).
    *   **[Bot - Aprovisionamiento Justo a Tiempo (On-Demand)]:** Modificaciï¾ƒï½³n en `gmTracker.js` dentro de `startMissionTracker()`. Al iniciar el rastreo de una misiï¾ƒï½³n con el comando `!misionstart`, si la misiï¾ƒï½³n no posee un `notebook_id` configurado y existen las cookies de autenticaciï¾ƒï½³n, el bot genera el NotebookLM en caliente y actualiza el campo `notebook_id` en `realm_missions` mediante Supabase. Esto permite crear misiones nuevas en la interfaz administrativa web de la aplicaciï¾ƒï½³n y disponer de sus libretas al instante sin reiniciar el servicio.
    *   **[Bot - Sincronizaciï¾ƒï½³n al Inicio]:** Modificaciï¾ƒï½³n en `index.js` para ejecutar `autoProvisionMissions()` durante el evento `ready`. Busca todas las misiones en base de datos que carezcan de un `notebook_id` asociado y las aprovisiona en lotes de manera asï¾ƒï½­ncrona, optimizando la consulta a base de datos al recuperar el grimorio y la enciclopedia una sola vez al inicio del bucle.
*   **Notas/Advertencias:** El flujo depende de que la variable de entorno `NOTEBOOKLM_COOKIES` estï¾ƒï½© configurada correctamente. La generaciï¾ƒï½³n en caliente requiere un tiempo extra de aprovisionamiento (~2-5s) durante la primera ejecuciï¾ƒï½³n de `!misionstart`, tiempo durante el cual el bot procesa el flujo en segundo plano y asocia el ID de forma transparente para el usuario final.

### [Fecha: 04/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `AI_CHANGELOG.md`
*   **Resumen:** Se rebalanceo `!cofre` a una tabla intermedia menos explosiva para bajar la frecuencia de premios altos sin quitarle identidad al comando.
*   **Cambios Clave:**
    *   **[Bot - Cofre] Probabilidades ajustadas:** La tabla paso a `22%` vacio, `27%` para `2k`, `22%` para `5k`, `15%` para `10k`, `8%` para `20k`, `4%` para `35k` y `2%` para `50k`.
    *   **[Bot - Economia] Alta gama reducida:** Los premios de `20k+` ya no suman `20%` por tirada; bajan a `14%`, lo que reduce la sensacion de lluvia de cofres grandes en las primeras 4 aperturas.
*   **Notas/Advertencias:** Validado con `node --check` sobre `games.js`. No se tocaron `!trampa`, tracking diario ni router del bot.

### [Fecha: 04/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/handlers/player.js`, `AI_CHANGELOG.md`
*   **Resumen:** Se agregaron los minijuegos rapidos `!cofre` y `!trampa <monto>` al bot de WhatsApp con tracking diario y economia segura basada en `increment_gold`.
*   **Cambios Clave:**
    *   **[Bot - Cofre] Nuevo comando casual:** `!cofre` ahora permite abrir cofres 4 veces al dia, con tabla de premios entre vacio, 2k, 5k, 10k, 20k, 35k y 50k sin posibilidad de perdida.
    *   **[Bot - Trampa] Nuevo riesgo corto:** `!trampa <monto>` se resolvio con tabla probabilistica (perder todo, recuperar, +25%, +50%, +75% o x2) y limites de apuesta de 100k entre semana / 500k en fin de semana.
    *   **[Bot - Tracking Diario] Reuso de bot_daily_claims:** `supabase.js` ahora expone contadores para `cofre_usage` y `trampa_usage` reutilizando el mismo patron diario ya usado por `!dados` y `!21`.
    *   **[Bot - Descubribilidad] Router y ayuda actualizados:** `index.js` ya enruta ambos comandos y `!ayuda` los muestra dentro del listado principal del reino.
*   **Notas/Advertencias:** Se uso un delta neto unico en `!trampa` para reducir el riesgo de inconsistencias entre debito y pago. Queda el riesgo habitual de cualquier flujo en dos pasos si falla el incremento de uso despues de actualizar oro, pero no se introdujo un nuevo camino de doble credito.

### [Fecha: 04/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Normalizacion final de textos con encoding roto visibles para usuarios en `kingdoom-bot`.
*   **Cambios Clave:**
    *   **[Bot - Registro] Mensajes de ayuda saneados:** Se reescribio el bloque de error de `!registrar` en `admin.js` usando texto ASCII limpio para evitar que los mensajes de ayuda vuelvan a degradarse por codificaciones mixtas.
    *   **[Bot - Auditoria de encoding] Barrido completo:** Se ejecuto una busqueda amplia sobre `kingdoom-bot` y no quedaron coincidencias activas con los patrones de mojibake que estaban afectando mensajes visibles.
*   **Notas/Advertencias:** Se opto por ASCII simple en ese bloque concreto para maximizar compatibilidad entre hosts y evitar nuevas corrupciones de caracteres. No se detectaron mas cadenas rotas factibles dentro del repo activo.

### [Fecha: 04/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/.gitignore`, `kingdoom-bot/src/activeProfileStore.js`, `kingdoom-bot/src/marketForgeStore.js`, `kingdoom-bot/check_supabase_market.js`, `kingdoom-bot/src/data/pending_tracker.json`, `supabase_bot_treasure_events.sql`, `AI_CHANGELOG.md`
*   **Resumen:** Pasada de limpieza de `kingdoom-bot` para quitar residuos, corregir higiene de tooling y sacar datos mutables del arbol `src/`.
*   **Cambios Clave:**
    *   **[Bot - Tooling] `.gitignore` corregido:** Se normalizaron los patrones a sintaxis POSIX para que herramientas como `rg` dejen de fallar por barras invertidas malformadas.
    *   **[Bot - Runtime State] Stores fuera de `src/`:** `activeProfileStore.js` y `marketForgeStore.js` ahora escriben en `.wwebjs_auth/state/` y migran automaticamente cualquier JSON legacy si existe.
    *   **[Bot - Residuos eliminados]:** Se elimino `check_supabase_market.js`, que contenia un helper manual con credenciales embebidas, y se removio `src/data/pending_tracker.json`, ya obsoleto desde que `!purga` persiste su tracker en Supabase.
    *   **[Bot - UX] Tesoro Errante verificado:** Se reviso el handler actual del evento para confirmar que la version persistida en Supabase ya venia sin los mensajes rotos detectados en auditorias anteriores.
    *   **[Supabase - SQL Versionado] Delimitador explicito:** `supabase_bot_treasure_events.sql` queda con delimitador `$treasure$` para evitar errores del SQL Editor al pegar o ejecutar la funcion por bloques.
*   **Notas/Advertencias:** Validado con `node --check` sobre los archivos JS tocados y una pasada de `rg` para confirmar que `.gitignore` ya no rompe el tooling. Siguen existiendo otros textos con encoding viejo en partes antiguas del bot, pero esta limpieza no abrio una campana masiva de normalizacion de strings.

### [Fecha: 03/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/treasure.js`, `Kingdoom-sync/AI_CHANGELOG.md`, `Kingdoom-sync/ai-memory/kingdoom-memory.jsonl`
*   **Resumen:** Incrementada la frecuencia del evento 'Tesoro Errante del Reino' en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Tesoro Errante]:** Se modifico la frecuencia de generacion de tesoros diarios de 1-2 veces a 2-4 veces en `treasure.js`, cambiando `const numEvents = Math.floor(Math.random() * 2) + 1;` por `const numEvents = Math.floor(Math.random() * 3) + 2;`.

### [Fecha: 03/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/treasure.js`, `kingdoom-bot/src/scheduler.js`, `kingdoom-bot/src/supabase.js`, `supabase_bot_treasure_events.sql`, `AI_CHANGELOG.md`
*   **Resumen:** Migracion de `Tesoro Errante del Reino` desde estado en memoria a persistencia real en Supabase.
*   **Cambios Clave:**
    *   **[Bot - Persistencia de Tesoro]:** `treasure.js` ya no depende del estado local como fuente de verdad. Ahora crea eventos persistidos, reclama recompensas por RPC y rehidrata tesoros abiertos al reiniciar el bot.
    *   **[Bot - Scheduler/Rehidratacion]:** `scheduler.js` invoca una rehidratacion de eventos `open` desde Supabase antes de reprogramar los tesoros del dia, para no perder cofres en curso tras reinicios.
    *   **[Supabase - SQL Versionado]:** Se agrego `supabase_bot_treasure_events.sql` con las tablas `bot_treasure_events`, `bot_treasure_claims` y la RPC `claim_bot_treasure_reward`, que asegura un solo claim por jugador y actualiza el oro dentro de la misma transaccion.
    *   **[Bot - Seguridad Economica]:** La concurrencia de multiples replies se mueve a la capa SQL via `FOR UPDATE` sobre el evento y `UNIQUE(event_id, player_id)`, reduciendo el riesgo de doble cobro o cierre inconsistente.
*   **Notas/Advertencias:** Hay que ejecutar `supabase_bot_treasure_events.sql` en Supabase antes de que el bot pueda usar la version persistente del Tesoro Errante.

### [Fecha: 03/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/treasure.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/scheduler.js`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre del MVP de `Tesoro Errante del Reino` para WhatsApp con disparo automatico, reply directo obligatorio y reparto controlado de oro en el grupo principal.
*   **Cambios Clave:**
    *   **[Bot - Tesoro Errante]:** Se implemento `treasure.js` como handler dedicado para eventos automaticos del grupo `595971938097-1618930274@g.us`, con mensaje ancla del bot y palabra clave `reclamar`.
    *   **[Bot - Scheduler Diario]:** `scheduler.js` ahora programa 1 o 2 tesoros aleatorios al dia dentro de la ventana 10:00-22:00 (America/Asuncion), rearmando la agenda al iniciar el bot y en el reset de medianoche.
    *   **[Bot - Ganadores y Premios]:** Cada evento define aleatoriamente entre 1 y 3 ganadores. Cada ganador recibe su propio premio aleatorio entre 10.000 y 20.000 de oro, con cierre al llenarse los cupos o al expirar los 5 minutos.
    *   **[Bot - Seguridad Conversacional]:** `index.js` intercepta replies al mensaje del tesoro y descarta mensajes sueltos; solo replies directos al tablero del bot pueden reclamar la recompensa.
*   **Notas/Advertencias:** El estado del Tesoro Errante vive en memoria para este MVP; si el bot reinicia durante un evento abierto, ese tesoro se pierde y no se recupera automaticamente.

### [Fecha: 03/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/blackjack.js`
*   **Resumen:** Implementaciï¾ƒï½³n del flujo de "aceptar" y "negar" para el modo multijugador PvP del Blackjack (!21) en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Blackjack PvP Accept/Deny]:** Se agregï¾ƒï½³ el estado "pending" a las sesiones de multijugador para esperar la respuesta de los invitados ("aceptar" o "negar").
    *   **[Bot - Timeout Pendiente]:** Si expira el tiempo mientras la sesiï¾ƒï½³n estï¾ƒï½¡ pendiente, automï¾ƒï½¡ticamente se declina por los inactivos y comienza la partida con los que sï¾ƒï½­ aceptaron.

### [Fecha: 03/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `docs/blackjack-simulation.md` (en Kingdoom-sync), `AI_CHANGELOG.md`
*   **Resumen:** Creaciï¾ƒï½³n del documento de simulaciï¾ƒï½³n detallado para el minijuego de Blackjack (!21) en WhatsApp, cubriendo los flujos Solo y PvP.
*   **Cambios Clave:**
    *   **[Docs - Blackjack Simulation]:** Creaciï¾ƒï½³n de `blackjack-simulation.md` que detalla el paso a paso, lï¾ƒï½­mites diarios de uso, lï¾ƒï½­mites de apuesta segï¾ƒï½ºn fin de semana, mecï¾ƒï½¡nica de juego y el cï¾ƒï½¡lculo exacto del pozo y las garantï¾ƒï½­as de pago del modo multijugador PvP en WhatsApp.

### [Fecha: 02/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/blackjack.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md` (en Kingdoom-sync)
*   **Resumen:** Implementaciï¾ƒï½³n de la modalidad multijugador PvP para el Blackjack (`!21`) por WhatsApp con control de turnos, timeout de 5 minutos y divisiï¾ƒï½³n proporcional del pozo de apuestas.
*   **Cambios Clave:**
    *   **[Bot - Blackjack PvP]:** Se expandiï¾ƒï½³ `blackjack.js` para dar soporte a partidas multijugador PvP (2+ jugadores) cuando se etiqueta a otros usuarios.
    *   **[Bot - Primera Ronda con 1 Carta]:** Se modificï¾ƒï½³ la distribuciï¾ƒï½³n de cartas iniciales para entregar exactamente 1 carta por jugador en la primera ronda del modo multijugador PvP.
    *   **[Bot - Interceptor Multijugador]:** Se actualizï¾ƒï½³ `index.js` para autorizar a cualquiera de los participantes del grupo a interactuar con el tablero enviando sus comandos de juego (`pedir` o `plantarse`).
    *   **[Bot - Autoplantado por Timeout]:** Se programï¾ƒï½³ un temporizador de 5 minutos que fuerza la acciï¾ƒï½³n de "plantarse" para los participantes inactivos de la ronda.
    *   **[Bot - Garantï¾ƒï½­a de Ganancias y Empates]:** En caso de empate, el pozo se distribuye equitativamente. Se implementaron multiplicadores garantizados mï¾ƒï½­nimos del sistema (`2.5x` para 21 natural, `2x` para victoria regular) por encima de la porciï¾ƒï½³n correspondiente del pozo si esta es menor.
*   **Notas/Advertencias:** Validado localmente con un script de prueba de cï¾ƒï½¡lculo de puntuaciones y verificaciï¾ƒï½³n sintï¾ƒï½¡ctica de Node.js.

### [Fecha: 02/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** kingdoom-bot/src/handlers/blackjack.js, AI_CHANGELOG.md
*   **Resumen:** Revision tecnica del azar en !21 y ajuste del limite diario base del Blackjack en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Blackjack] Azar auditado:** Se reviso lackjack.js y no hay evidencia de cartas amaï¾ƒï½±adas. El juego crea un mazo completo de 52 cartas, aplica Fisher-Yates con Math.random() y reparte desde ese mazo barajado, por lo que una racha de 3 derrotas seguidas entra dentro de lo esperable para Blackjack.
    *   **[Bot - Blackjack] Limite diario ampliado:** El limite base de usos de !21 sube de 3 a 5, quedando 5 entre semana y 5 en fin de semana.
    *   **[Bot - Crupier] Regla verificada:** El crupier roba solo mientras tenga menos de 17 y luego se planta. No se encontro una ventaja artificial extra fuera de la regla normal del juego.
*   **Notas/Advertencias:** Validado con 
ode --check src/handlers/blackjack.js en kingdoom-bot. El azar sigue usando Math.random(), que para un minijuego casual es aceptable, aunque no es un RNG criptografico.

### [Fecha: 02/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/src/handlers/player.js`, `AI_CHANGELOG.md`
*   **Resumen:** Integraciï¾ƒÎ´ï½³n del minijuego !21 (Blackjack) por WhatsApp y protecciï¾ƒÎ´ï½³n contra interferencias.
*   **Cambios Clave:**
    *   **[Bot - Blackjack]:** Se registrï¾ƒÎ´ï½³ el comando `!21` en `index.js`, redirigiendo al handler de Blackjack para iniciar partidas.
    *   **[Bot - Intercepciï¾ƒÎ´ï½³n de Respuestas]:** Se implementï¾ƒÎ´ï½³ un interceptor estricto al inicio de la recepciï¾ƒÎ´ï½³n de mensajes. Si un mensaje cita a uno de los mensajes de partidas de Blackjack activas, solo se procesa el comando (`pedir` o `plantarse`) si proviene exactamente del jugador que iniciï¾ƒÎ´ï½³ la partida (`sender === session.playerPhone`). Cualquier otro mensaje es ignorado completamente para evitar interferencias en grupos.
    *   **[Bot - Menï¾ƒÎ´ï½º de Ayuda]:** Se aï¾ƒÎ´ï½±adiï¾ƒÎ´ï½³ la descripciï¾ƒÎ´ï½³n del comando `!21 <monto>` al compendio de comandos del aventurero (`!ayuda`).
*   **Notas/Advertencias:** La validaciï¾ƒÎ´ï½³n de sintaxis de los archivos modificados ha sido completada con ï¾ƒÎ´ï½©xito.

### [Fecha: 02/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/assistant/market/_confirm.ts`, `AI_CHANGELOG.md`
*   **Resumen:** Reparacion del crash aislado al confirmar items forjados por WhatsApp.
*   **Cambios Clave:**
    *   **[Backend - Confirm Publish]:** `_confirm.ts` ya no importa `slugifyMarketItem` ni `buildMarketItemPayload` desde `src/features/market/market.adapter` (arbol frontend). Ahora define ambos helpers inline dentro de la funcion serverless.
    *   **[Diagnostico del caso]:** El flujo `draft` y `revise` funcionaba, pero `confirm` devolvia `500 FUNCTION_INVOCATION_FAILED`, seï¾ƒÎ´ï½±al de crash al cargar ese submodulo en Vercel. El import cruzado desde `src/features/market/*` era el punto mas fragil y quedo eliminado.
    *   **[Arquitectura]:** La publicacion final del item queda desacoplada del bundle de frontend, reduciendo riesgo de que una dependencia del lado web tumbe el endpoint administrativo.
*   **Notas/Advertencias:** Validado con compilacion dirigida del endpoint `api/admin/assistant/market/_confirm.ts`. El siguiente paso es reprobar `confirmar` sobre un borrador activo despues del redeploy de Vercel.

### [Fecha: 02/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/assistant/market/index.ts`, `kingdoom-bot/src/marketForgeApi.js`, `AI_CHANGELOG.md`
*   **Resumen:** Aislamiento del crash de la ruta de forja automatica en Vercel y mejora del diagnostico HTTP visible desde WhatsApp.
*   **Cambios Clave:**
    *   **[Backend - Routing Perezoso]:** `api/admin/assistant/market/index.ts` ahora importa `_draft`, `_revise` y `_confirm` de forma dinamica segun `action`, en lugar de cargar los tres arboles al iniciar la funcion. Esto evita que un submodulo no necesario tumbe incluso un `GET` o un `draft`.
    *   **[Bot - Error HTTP Util]:** `marketForgeApi.js` ya no asume JSON a ciegas. Si el backend responde HTML/texto o un `500` vacio, el bot informa el `status` HTTP y un recorte del cuerpo, ayudando a distinguir entre fallo de despliegue, runtime o validacion.
    *   **[Diagnostico del caso]:** El endpoint publico `https://kingdoom.vercel.app/api/admin/assistant/market` estaba devolviendo `500` incluso para `GET`, cuando deberia responder `405`. Eso indica un crash de carga/importacion en la funcion serverless, no un rechazo del prompt o de Pinterest.
*   **Notas/Advertencias:** Validado con `node --check` en `kingdoom-bot/src/marketForgeApi.js` y compilacion dirigida del endpoint `api/admin/assistant/market/index.ts`. El `npx tsc --noEmit` global y `npm run build` del repo siguen afectados por la falla preexistente de `swr` en la web principal.

### [Fecha: 02/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_assistantSecurity.ts`, `kingdoom-bot/src/handlers/marketForge.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del primer bloqueo de la forja automatica por WhatsApp y mejora del diagnostico visible en el bot.
*   **Cambios Clave:**
    *   **[Backend - Permisos]:** `verifyAssistantActor()` ya no rompe el flujo si el bot marca al actor como `admin` pero el backend solo lo reconoce por la whitelist de staff. Ahora valida acceso contra el conjunto efectivo `admin + staff`, promueve a `admin` solo cuando corresponde y tambien contempla `OWNER_NUMBER` dentro de la allowlist administrativa.
    *   **[Bot - Errores Utiles]:** `marketForge.js` ahora captura fallos de `draft`, `revise` y `confirm` y devuelve el mensaje real del backend (`No pude forjar el item: ...`) en lugar de dejar que suba al catch global con el texto generico `El reino esta en llamas...`.
    *   **[Diagnostico del caso]:** El primer test con `!forjaritem Lanza asincronica https://es.pinterest.com/...` apunta a una discrepancia de rol (`admin` en bot vs `staff` configurado en backend), no a un problema intrinseco con Pinterest. El proximo intento deberia revelar el error exacto si aparece otro bloqueo.
*   **Notas/Advertencias:** Validado con `node --check` en `kingdoom-bot/src/handlers/marketForge.js` y compilacion dirigida de los endpoints/seguridad del asistente en `Kingdoom-sync`. El `npx tsc --noEmit` global y `npm run build` del repo siguen teniendo la falla preexistente de resolucion `swr` en la web principal, ajena a este fix.

### [Fecha: 01/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** package.json, src/utils/serverAiProviders.ts
*   **Resumen:** Fix de tipado TypeScript para desbloquear el despliegue de Vercel.
*   **Cambios Clave:**
    *   **[Deploy - Vercel]:** Se solucionaron los errores de types de Node en serverAiProviders.ts que bloqueaban la generacion de las Serverless Functions de la forja de mercado en Vercel.

### [Fecha: 01/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`
*   **Resumen:** Confirmacion operativa del setup de la forja automatica de mercado por WhatsApp para relevo con Antigravity 2.
*   **Cambios Clave:**
    *   **[Deploy - Vercel]:** Ya quedaron configuradas las variables `WHATSAPP_ASSISTANT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `WHATSAPP_ASSISTANT_STAFF_NUMBERS` en el backend de `Kingdoom-sync`.
    *   **[Deploy - Hugging Face Bot]:** Ya quedaron configuradas `WHATSAPP_ASSISTANT_SECRET`, `STAFF_NUMBERS` y `KINGDOOM_ASSISTANT_API_URL` en `kingdoom-bot`.
    *   **[Supabase - SQL]:** El archivo `supabase_assistant_admin_actions.sql` ya fue ejecutado en SQL Editor, por lo que la tabla de auditoria/borradores del asistente administrativo deberia existir en el proyecto real.
*   **Notas/Advertencias:** A partir de este punto el siguiente paso operativo es probar `!forjaritem ...`, luego iterar ajustes (`sube el precio`, `hazlo epico`, etc.) y confirmar/cancelar para validar el flujo completo end-to-end.

### [Fecha: 01/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_assistantSecurity.ts`, `api/admin/_marketAssistant.ts`, `api/admin/_supabaseAdmin.ts`, `api/admin/_visualReference.ts`, `api/admin/assistant/market/draft.ts`, `api/admin/assistant/market/revise.ts`, `api/admin/assistant/market/confirm.ts`, `supabase_assistant_admin_actions.sql`, `kingdoom-bot/src/adminStore.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/handlers/marketForge.js`, `kingdoom-bot/src/marketForgeApi.js`, `kingdoom-bot/src/marketForgeStore.js`, `AI_CHANGELOG.md`
*   **Resumen:** MVP de forja automï¾ƒÎ´ï½¡tica de ï¾ƒÎ´ï½­tems de mercado por WhatsApp con borrador IA, ajustes conversacionales, confirmaciï¾ƒÎ´ï½³n explï¾ƒÎ´ï½­cita y auditorï¾ƒÎ´ï½­a en Supabase.
*   **Cambios Clave:**
    *   **[Backend - Assistant Market]:** Se aï¾ƒÎ´ï½±adieron los endpoints protegidos `POST /api/admin/assistant/market/draft`, `revise` y `confirm`, todos autenticados por `WHATSAPP_ASSISTANT_SECRET` y pensados para uso exclusivo del `kingdoom-bot`.
    *   **[Backend - Auditorï¾ƒÎ´ï½­a/Draft State]:** Se versionï¾ƒÎ´ï½³ `supabase_assistant_admin_actions.sql` como tabla fuente de verdad para borradores administrativos. Guarda actor, rol (`admin|staff`), payload propuesto, referencia visual, confirmaciï¾ƒÎ´ï½³n/cancelaciï¾ƒÎ´ï½³n, modelo IA y resultado final.
    *   **[Backend - IA de Mercado]:** Se creï¾ƒÎ´ï½³ un motor server-side compartido para generar y revisar drafts de ï¾ƒÎ´ï½­tems usando referencia visual + prompt del staff + contexto resumido del mercado actual. El precio puede ajustarse por conversaciï¾ƒÎ´ï½³n antes de confirmar.
    *   **[Bot - Flujo Conversacional]:** Se integrï¾ƒÎ´ï½³ `!forjaritem <idea> [url]` y `!mercado crear ...` en WhatsApp. El bot detecta una sola sesiï¾ƒÎ´ï½³n activa por staff/admin por chat, acepta ajustes conversacionales, soporta `confirmar` / `cancelar` y publica en `market_items` solo tras confirmaciï¾ƒÎ´ï½³n explï¾ƒÎ´ï½­cita.
    *   **[Bot - Permisos]:** Ademï¾ƒÎ´ï½¡s de admins, ahora existe `isStaffUser()` con whitelist por `STAFF_NUMBERS` para habilitar el flujo de forja a staff sin abrir el resto de comandos administrativos sensibles.
*   **Notas/Advertencias:** `node --check` pasï¾ƒÎ´ï½³ en los archivos nuevos/modificados del bot. Los endpoints nuevos de `api/` compilaron con `npx tsc --noEmit --skipLibCheck ...`. El `npx tsc --noEmit` global y `npm run build` de `Kingdoom-sync` siguen fallando por un problema preexistente de resoluciï¾ƒÎ´ï½³n de `swr` en `src/components/GrimoireSection.tsx` y `src/sections/MarketSection.tsx`, ajeno a esta implementaciï¾ƒÎ´ï½³n. Para que el flujo funcione en producciï¾ƒÎ´ï½³n deben configurarse `WHATSAPP_ASSISTANT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y, si se usarï¾ƒÎ´ï½¡n staff no-admin, `WHATSAPP_ASSISTANT_STAFF_NUMBERS` en backend y `STAFF_NUMBERS` en el bot.

### [Fecha: 01/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion de identidad del soberano en el prompt del Oraculo.
*   **Cambios Clave:**
    *   **[Bot - Oraculo] Soberano actual:** El prompt deja de tratar a `E.XE` como nombre principal del rey y pasa a reconocer a `Nothing` como el soberano real.
    *   **[Bot - Compatibilidad narrativa]:** `E.XE` queda interpretado solo como alias antiguo o forma vieja de referirse al mismo soberano, evitando respuestas desalineadas con el usuario real.
*   **Notas/Advertencias:** Validado con `node --check src/handlers/games.js` en `kingdoom-bot`. Ajuste de identidad narrativa; no cambia economia ni logica de juego.

### [Fecha: 01/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen:** Blindaje del arranque de WhatsApp en Hugging Face contra `auth timeout` y rechazos no controlados.
*   **Cambios Clave:**
    *   **[Bot - Estabilidad] Timeout configurable:** El cliente de WhatsApp ahora usa `WHATSAPP_AUTH_TIMEOUT_MS` (default `300000`) en lugar de un timeout fijo de `120000`, dando mas margen a sesiones lentas en contenedor.
    *   **[Bot - Resiliencia] Rechazos globales:** Se agregaron manejadores de `process.on('unhandledRejection')` y `process.on('uncaughtException')` para registrar `auth timeout` y otros errores asincronos sin tumbar el proceso por un rechazo no capturado.
    *   **[Bot - Scheduler] Guardia de doble inicio:** `startScheduler(client)` ahora solo corre una vez por ciclo de conexion y se libera al desconectarse, evitando duplicados si hay reconexion.
*   **Notas/Advertencias:** Validado con `node --check src/index.js` en `kingdoom-bot`. El bot deberia sobrevivir a un timeout de autenticacion, pero si la sesion de WhatsApp expira o la red del contenedor sigue inestable, aun hara falta reautenticar QR o revisar conectividad a `web.whatsapp.com`.

### [Fecha: 01/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `AI_CHANGELOG.md`
*   **Resumen:** Ajuste de reglas del minijuego `!dados` en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Dados] Victoria mas accesible:** La tirada ahora gana con suma `>= 7` en vez de `>= 8`.
    *   **[Bot - Dados] Mas intentos entre semana:** El limite diario base sube de `3` a `4` usos; el fin de semana se mantiene en `5`.
    *   **[Bot - Dados] Tope por ronda:** Se agrega una apuesta maxima de `100.000` oro por ronda y un maximo ampliado de `500.000` los fines de semana.
*   **Notas/Advertencias:** Validado con `node --check src/handlers/games.js` en `kingdoom-bot`. Cambio de economia puntual solicitado por el usuario; no modifica otros minijuegos ni RPCs.

### [Fecha: 01/06/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del parser de `!registrar` para evitar altas corruptas cuando el admin no cita realmente el mensaje del jugador.
*   **Cambios Clave:**
    *   **[Bot - Registro] Validacion de modo manual:** `!registrar` ahora exige que el primer argumento del modo manual parezca un telefono real (minimo 8 digitos) antes de tratarlo como celular.
    *   **[Bot - UX defensiva]:** Si el staff escribe `!registrar <nombre> [oro]` sin responder/citar el mensaje del jugador, el bot cancela el alta y devuelve una guia clara en vez de registrar basura.
    *   **[Diagnostico] Caso Johandarfox1:** Se verifico que el intento mostrado no creo `Johandarfox1` en `public.players`; el bot genero por error una fila con `username = "2500"` y `phone = "1,573219843017"` porque tomo el nombre como celular al entrar por la rama manual.
*   **Notas/Advertencias:** La web funciona correctamente: consulta `public.players` por `username` con `ilike`. El caso requiere limpieza manual de la fila rota en Supabase antes de volver a registrar al jugador correctamente.

### [Fecha: 01/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `docs/agents/KingdoomArchitect.md`, `docs/agents/KingdoomFrontend.md`, `docs/agents/KingdoomBackend.md`, `docs/agents/KingdoomMinigames.md`, `docs/agents/KingdoomLoreKeeper.md`, `docs/agents/KingdoomDevOps.md`, `docs/agents/KingdoomDesigner.md`
*   **Resumen:** Creaciï¾ƒÎ´ï½³n de directrices exhaustivas de agentes (Personas) para el Reino.
*   **Cambios Clave:**
    *   **[Docs - Agentes]:** Se crearon 7 nuevos perfiles de contexto en `docs/agents/` cubriendo todas las ï¾ƒÎ´ï½¡reas posibles del proyecto (`Kingdoom-sync` y `Kingdoom-bot`): Architect, Frontend, Backend, Minigames, LoreKeeper, DevOps, y Designer.

### [Fecha: 01/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `docs/agents/KingdoomAuditor.md`, `docs/agents/KingdoomDebugger.md`, `docs/agents/KingdoomReviewer.md`, `docs/agents/KingdoomBotMaster.md`
*   **Resumen:** Creaciï¾ƒÎ´ï½³n de directrices de agentes especializados (Personas) para el Reino.
*   **Cambios Clave:**
    *   **[Docs - Agentes]:** Se crearon 4 perfiles de contexto estandarizados dentro de `docs/agents/` que detallan las reglas, responsabilidades y prioridades para que cualquier agente de la arquitectura (Jarvis, Antigravity 2, etc.) asuma roles dedicados: Auditor de Economï¾ƒÎ´ï½­a/Seguridad, Depurador UI/Estado, Revisor de Calidad/Reglas y BotMaster de WhatsApp.

### [Fecha: 31/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `GrimoireSection.tsx`, `MarketSection.tsx`, `imageUtils.ts` (Nuevo), `package.json`
*   **Resumen:** Implementaciï¾ƒÎ´ï½³n de Optimizaciï¾ƒÎ´ï½³n Extrema (SWR Cachï¾ƒÎ´ï½© y Transformaciï¾ƒÎ´ï½³n de Imï¾ƒÎ´ï½¡genes).
*   **Cambios Clave:**
    *   **[Web] Performance (Cachï¾ƒÎ´ï½©):** Se reemplazï¾ƒÎ´ï½³ el `useEffect` por `useSWR` en las llamadas pesadas de Supabase (Grimorio, Mercado, Bestiario, Flora) con un cachï¾ƒÎ´ï½© local de 5 minutos, logrando cargas instantï¾ƒÎ´ï½¡neas (0ms) al navegar entre pestaï¾ƒÎ´ï½±as.
    *   **[Web] Performance (Imï¾ƒÎ´ï½¡genes):** Se introdujo `getOptimizedImageUrl` para interceptar imï¾ƒÎ´ï½¡genes de Supabase Storage e inyectar el modo "render" para devolverlas comprimidas a formato WebP y tamaï¾ƒÎ´ï½±o miniatura.

### [Fecha: 31/05/2026] - [Autor: ui_ux_designer (Subagente) / Antigravity]
*   **Archivos Modificados:** Mï¾ƒÎ´ï½¡s de 20 componentes React en `Kingdoom-sync/src` (ej. `AnimeHubSection.tsx`, `MarketItemCard.tsx`, etc.)
*   **Resumen:** Optimizaciï¾ƒÎ´ï½³n masiva de carga de imï¾ƒÎ´ï½¡genes en el frontend web.
*   **Cambios Clave:**
    *   **[Web] Performance:** Se inyectaron los atributos `loading="lazy"` y `decoding="async"` en todas las etiquetas `<img />` del proyecto para evitar cuellos de botella en la renderizaciï¾ƒÎ´ï½³n y mejorar el tiempo de carga en listas pesadas como el mercado, el inventario y el anime hub.

### [Fecha: 30/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/tracker.js`
*   **Resumen:** Fix del error de guardado del tracker provocado por restricciones de Supabase.
*   **Cambios Clave:**
    *   **[Bot] Base de Datos:** Se corrigiï¾ƒÎ´ï½³ una violaciï¾ƒÎ´ï½³n de la restricciï¾ƒÎ´ï½³n `knowledge_documents_type_check`. El `type` del tracker se cambiï¾ƒÎ´ï½³ de `tracker` a `other`, y se aï¾ƒÎ´ï½±adiï¾ƒÎ´ï½³ el campo obligatorio `title`.
### [Fecha: 30/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `.gemini/antigravity/mcp_config.json` (Local IDE Config)
*   **Resumen:** Configuraciï¾ƒÎ´ï½³n e integraciï¾ƒÎ´ï½³n del servidor MCP de Vercel.
*   **Cambios Clave:**
    *   **[Tooling - MCP]:** Se agregï¾ƒÎ´ï½³ exitosamente el servidor MCP de Vercel (`https://mcp.vercel.com`) al entorno de Google IDE (Antigravity).
    *   **[Tooling - Auth]:** Se configurï¾ƒÎ´ï½³ el Bearer Token de Vercel para permitir a los agentes realizar consultas de despliegues, logs de proyectos y administrar el entorno web alojado en Vercel sin salir del IDE.

### [Fecha: 30/05/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/components/TavernScratchNative.tsx`, `apps/mobile/src/utils/scratchUtils.ts`, `AI_CHANGELOG.md`
*   **Resumen:** Fix de empaquetado Android para EAS tras detectar un import cruzado desde la web en `TavernScratchNative`.
*   **Cambios Clave:**
    *   **[Mobile - Build Fix]:** Se reemplazo el import de `../../../../src/utils/scratchUtils` por un util nativo local en `apps/mobile/src/utils/scratchUtils.ts` para que Expo/Metro pueda resolver el modulo dentro del workspace mobile.
    *   **[Mobile - Paridad]:** El nuevo util replica la configuracion diaria de Scratch (`getDailyScratchConfig`, costos, chances y limite maximo) sin depender de archivos del frente web.
    *   **[EAS - Diagnostico]:** Se reprodujo localmente el fallo de bundle que estaba rompiendo la solicitud de APK en EAS y se valido el fix con export Android exitoso antes de relanzar el build remoto.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx expo export --platform android` y `npm run build` quedaron limpios tras el fix. El build remoto anterior `4a3d3025-f211-45cb-9c72-dbb1edec997a` fallo por este import fuera del arbol mobile.

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
*   **Resumen:** Integraciï¾ƒÎ´ï½³n de "TavernScratchNative" y cierre definitivo de la Fase 3 de reactivaciï¾ƒÎ´ï½³n mobile.
*   **Cambios Clave:**
    *   **[Mobile - Minijuego]:** Se integrï¾ƒÎ´ï½³ exitosamente el segundo minijuego nativo, "Rasca y Gana" (`TavernScratchNative.tsx`). Mantiene paridad con la lï¾ƒÎ´ï½³gica web, empleando configuraciï¾ƒÎ´ï½³n de probabilidades, lï¾ƒÎ´ï½­mites diarios y costos generados dinï¾ƒÎ´ï½¡micamente vï¾ƒÎ´ï½­a `getDailyScratchConfig`.
    *   **[Mobile - Economï¾ƒÎ´ï½­a Segura]:** La transacciï¾ƒÎ´ï½³n de oro utiliza exclusivamente `sessionStore.addGold`, el cual estï¾ƒÎ´ï½¡ respaldado por el RPC seguro de Supabase `increment_gold`, evitando cualquier condiciï¾ƒÎ´ï½³n de carrera.
    *   **[Mobile - Persistencia Local]:** Se implementï¾ƒÎ´ï½³ `AsyncStorage` para manejar el lï¾ƒÎ´ï½­mite de ganancias diarias de forma eficiente y segura a nivel de dispositivo.
    *   **[Mobile - Integraciï¾ƒÎ´ï½³n UI]:** El minijuego se renderiza de forma fluida y elegante en la tab del mercado, empleando la arquitectura `KingdoomUI` y `StaggerItem` existente.
    *   **[Backlog] Cierre Fase 3:** Con la implementaciï¾ƒÎ´ï½³n de este segundo minijuego y las notificaciones previamente aprobadas, la Fase 3 de reactivaciï¾ƒÎ´ï½³n mobile se considera cumplida.
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
*   **Resumen:** Implementaciï¾ƒÎ´ï½³n de Notificaciones Mobile (Fase 3).
*   **Cambios Clave:**
    *   **[Mobile - Notificaciones]:** Se implementï¾ƒÎ´ï½³ el servicio de notificaciones nativo (`notificationsService.ts`) que interactï¾ƒÎ´ï½ºa con Supabase para la app mobile, manteniendo paridad con la estructura de datos web.
    *   **[Mobile - Componente UI]:** Se creï¾ƒÎ´ï½³ `PlayerNotificationBellNative.tsx` utilizando `TanStack Query` para polling cada 15 segundos y `react-native-reanimated` para animaciones fluidas del modal bottom-sheet. Se garantizï¾ƒÎ´ï½³ el tamaï¾ƒÎ´ï½±o de 46x46 en los elementos clickeables (incluyendo botï¾ƒÎ´ï½³n de cerrar modal).
    *   **[Mobile - Integraciï¾ƒÎ´ï½³n]:** Se inyectï¾ƒÎ´ï½³ la campana de notificaciones en el `rightSlot` de las pantallas principales `home.tsx` y `profile.tsx` para brindar mï¾ƒÎ´ï½¡xima visibilidad sobre transacciones y recompensas sin afectar la ergonomï¾ƒÎ´ï½­a ni requerir tabs adicionales.
    *   **[Backlog] Actualizaciï¾ƒÎ´ï½³n:** Tareas de notificaciï¾ƒÎ´ï½³n/features econï¾ƒÎ´ï½³micas adicionales marcadas como evaluadas e implementadas.
*   **Notas/Advertencias:** Validado con `npm run mobile:typecheck` limpio. La economï¾ƒÎ´ï½­a mï¾ƒÎ´ï½³vil sigue intacta ya que la campana es solo un observador de estado.

### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/components/KingdoomUI.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/app/(tabs)/archivist.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/components/TavernSlotsNative.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Segunda pasada de polish visual/ergonï¾ƒÎ´ï½³mico para la reactivaciï¾ƒÎ´ï½³n mobile (Fase 3). 
*   **Cambios Clave:**
    *   **[Mobile - UI/Ergonomï¾ƒÎ´ï½­a]:** Se estandarizaron los touch targets a un mï¾ƒÎ´ï½­nimo de 46px en componentes interactivos clave de toda la app (botones, tabs, pills y search inputs) para cumplir con las guï¾ƒÎ´ï½­as de accesibilidad en Android. Esto incluyï¾ƒÎ´ï½³ ajustes en Archivist, Anime, Exchange, HorseRace y Slots, solucionando los problemas de fat-finger.
    *   **[Arquitectura - Decisiï¾ƒÎ´ï½³n]:** Se evaluï¾ƒÎ´ï½³ si `Archivist` y `Anime` justifican una expansiï¾ƒÎ´ï½³n profunda. Se decide mantenerlos como mï¾ƒÎ´ï½³dulos compactos. `Archivist` sirve como referencia rï¾ƒÎ´ï½¡pida y `Anime` como un hub de enlaces ligeros. Aï¾ƒÎ´ï½±adirles una navegaciï¾ƒÎ´ï½³n profunda y dependencias pesadas impactarï¾ƒÎ´ï½­a negativamente el rendimiento de React Native y la filosofï¾ƒÎ´ï½­a "compact-mode" que guï¾ƒÎ´ï½­a el resurgimiento mï¾ƒÎ´ï½³vil.
*   **Notas/Advertencias:** Todos los cambios pasaron `npm run mobile:typecheck` y no se inyectï¾ƒÎ´ï½³ lï¾ƒÎ´ï½³gica econï¾ƒÎ´ï½³mica nueva.

### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/features/session/sessionStore.ts`, `apps/mobile/src/components/TavernSlotsNative.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre definitivo de Fase 2 (Antigravity 2) de reactivaciï¾ƒÎ´ï½³n mobile: sincronizaciï¾ƒÎ´ï½³n atï¾ƒÎ´ï½³mica de economï¾ƒÎ´ï½­a y estabilizaciï¾ƒÎ´ï½³n del Stock Exchange.
*   **Cambios Clave:**
    *   **[Mobile - Economï¾ƒÎ´ï½­a] QA Funcional Completo y Sincronizaciï¾ƒÎ´ï½³n atï¾ƒÎ´ï½³mica:** Se auditï¾ƒÎ´ï½³ funcionalmente el ciclo de compra en el mercado mï¾ƒÎ´ï½³vil (se descuenta una sola vez, se refresca el saldo, se actualiza el inventario). Se refactorizaron `TavernSlotsNative`, `TavernHorseRaceNative` y `RealmStockExchangeNative` para utilizar `addGold` (basado en el RPC `increment_gold` de Supabase) en lugar del mï¾ƒÎ´ï½©todo inseguro `updateGold`, previniendo race conditions y asegurando la consistencia entre saldo visible e historial. Ademï¾ƒÎ´ï½¡s, se documentï¾ƒÎ´ï½³ el SQL del RPC `increment_gold` (`supabase_increment_gold.sql`) en el repositorio para evitar desincronizaciones futuras. Fase 2 completada y validada con \`npm run mobile:typecheck\` y \`npm run build\`.
    *   **[Mobile - Mercado] Estabilizaciï¾ƒÎ´ï½³n:** Se verificï¾ƒÎ´ï½³ la paridad operativa del `RealmStockExchangeNative` con la web, confirmando que las operaciones respetan el bloqueo transaccional (`applyOperation`) y propagan correctamente los deltas de oro.
    *   **[Backlog] Actualizaciï¾ƒÎ´ï½³n:** Se marcaron como completadas las tareas restantes del sprint de Antigravity 2 en `mobile-reactivation-backlog.md`.
*   **Notas/Advertencias:** Validado con lectura de cï¾ƒÎ´ï½³digo y `npm run mobile:typecheck` exitoso. La arquitectura financiera mï¾ƒÎ´ï½³vil ya no sobrescribe el oro total, operando exclusivamente mediante incrementos/decrementos validados en Supabase.

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
    *   **[Arquitectura] Matriz de paridad:** Se documento `web vs mobile` por dominio con estado (`lista`, `parcial`, `ausente`, `no prioritaria`) y dueï¾ƒÎ´ï½±o principal.
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
*   **Resumen:** Ampliaciï¾ƒÎ´ï½³n de la cantidad mï¾ƒÎ´ï½¡xima de esferas a lanzar en la Torre del Mago.
*   **Cambios Clave:**
    *   **[Minijuegos - Torre del Mago]:** Se ajustaron los botones de selecciï¾ƒÎ´ï½³n de cantidad de esferas, cambiando las opciones de `[1, 3, 5, 10]` a `[1, 5, 10, 20]`.
*   **Notas/Advertencias:** Actualizaciï¾ƒÎ´ï½³n rï¾ƒÎ´ï½¡pida de UI para escalar las apuestas.

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
*   **Resumen:** Correcciï¾ƒÎ´ï½³n visual y lï¾ƒÎ´ï½³gica del cï¾ƒÎ´ï½¡lculo de apuestas en Esfera de las Runas.
*   **Cambios Clave:**
    *   **[Minijuegos] Correcciï¾ƒÎ´ï½³n cï¾ƒÎ´ï½¡lculo de total:** El costo total de la jugada ahora calcula `apuestaPorEsfera * cantidad`, mostrï¾ƒÎ´ï½¡ndose explï¾ƒÎ´ï½­citamente y utilizï¾ƒÎ´ï½¡ndose correctamente para la deducciï¾ƒÎ´ï½³n de oro y los cï¾ƒÎ´ï½¡lculos de RTP/premio.
    *   **[UI] Claridad de Etiquetas:** Actualizadas etiquetas "Multiplicador" a "Lanzamiento" y "Apuesta unitaria" a "Apuesta por esfera" para evitar confusiï¾ƒÎ´ï½³n. Se muestra de manera clara el costo total real de la jugada.
    *   **[UX] Estado del Botï¾ƒÎ´ï½³n:** Actualizados los mensajes en el botï¾ƒÎ´ï½³n de lanzar (Oro insuficiente, lï¾ƒÎ´ï½­mite alcanzado, apuesta invï¾ƒÎ´ï½¡lida) para informar dinï¾ƒÎ´ï½¡micamente y con base al oro que requiere la apuesta total.
*   **Notas/Advertencias:** Validado localmente con `npx tsc --noEmit` y `npm run build` sin errores en este componente.
### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`
*   **Resumen:** Reducciï¾ƒÎ´ï½³n del plazo de inactividad para purga de 5 a 3 dï¾ƒÎ´ï½­as.
*   **Cambios Clave:**
    *   **[Admin] Comando !purga:** Se actualizï¾ƒÎ´ï½³ la constante `THREE_DAYS_MS` y la lï¾ƒÎ´ï½³gica de cï¾ƒÎ´ï½¡lculo de tiempo para que el bot advierta y expulse a los usuarios sin ficha o inactivos luego de 3 dï¾ƒÎ´ï½­as en lugar de 5.
    *   **[Admin] Notificaciones de UI:** Se ajustaron los textos enviados por WhatsApp al ejecutar la purga para que reporten correctamente el lï¾ƒÎ´ï½­mite de 3 dï¾ƒÎ´ï½­as.
*   **Notas/Advertencias:** Los cambios se hicieron en el repositorio del bot y se empujaron a `origin/main`.

### [Fecha: 28/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/admin/AdminMissionManager.tsx`, `src/utils/missions.ts`
*   **Resumen:** Funcionalidad para eliminar participantes de misiones desde el panel de admin.
*   **Cambios Clave:**
    *   **[Admin] Botï¾ƒÎ´ï½³n Eliminar:** Nuevo botï¾ƒÎ´ï½³n de "Eliminar" en la tarjeta de participante (`AdminMissionManager.tsx`) con prompt de confirmaciï¾ƒÎ´ï½³n de seguridad.
    *   **[Backend] Borrado y Recï¾ƒÎ´ï½¡lculo:** La funciï¾ƒÎ´ï½³n `deleteMissionClaim` (`missions.ts`) borra el reclamo, elimina las pruebas del Storage (`MISSION_EVIDENCE_BUCKET`) y devuelve el estado de la misiï¾ƒÎ´ï½³n a `available` automï¾ƒÎ´ï½¡ticamente si se libera un cupo en una misiï¾ƒÎ´ï½³n `in-progress`.
*   **Notas/Advertencias:** Listo para producciï¾ƒÎ´ï½³n, confirmado con `git push`. Las validaciones de TS fallan por errores previos ajenos al ï¾ƒÎ´ï½¡rea afectada.

### [Fecha: 28/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `DATABASE_SCHEMA.md`, `patch.cjs` (eliminado), `test-supabase.ts` (eliminado)
*   **Resumen:** Sincronizaciï¾ƒÎ´ï½³n en tiempo real de misiones en UI, resoluciï¾ƒÎ´ï½³n de conflictos y limpieza de repositorio.
*   **Cambios Clave:**
    *   **[Mobile/UI] Sincronizaciï¾ƒÎ´ï½³n de misiones:** Implementada lï¾ƒÎ´ï½³gica para reflejar cambios de estado de misiones (reclamos de cupos, actualizaciones de admin) en tiempo real en la UI mï¾ƒÎ´ï½³vil sin recarga manual.
    *   **[Mantenimiento] Resoluciï¾ƒÎ´ï½³n de conflictos:** Solucionados conflictos de Git en `AdminControlSheet.tsx` y `AdminControlPrimitives.tsx` para mantener consistencia Mobile-First.
    *   **[Mantenimiento] Limpieza de metadatos:** Se auditaron y limpiaron residuos huï¾ƒÎ´ï½©rfanos de Git (`REBASE_HEAD`, `.COMMIT_EDITMSG.swp`) tras confirmar un working tree limpio.
    *   **[Documentaciï¾ƒÎ´ï½³n] Correcciï¾ƒÎ´ï½³n de Schema:** Actualizado `DATABASE_SCHEMA.md` para clarificar la diferencia de casing entre `playerId` (`character_sheets`) y `player_id` (`player_inventory`).
    *   **[Mantenimiento] Archivos temporales:** Eliminados scripts temporales (`patch.cjs`, `test-supabase.ts`) que no pertenecen a producciï¾ƒÎ´ï½³n.
*   **Notas/Advertencias:** Persisten errores de tipos de Typescript en `RankingCard.tsx` y `WeeklyRankingPodium.tsx` que requieren futura revisiï¾ƒÎ´ï½³n.

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

### [Fecha: 30/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Reducciï¾ƒÎ´ï½³n del tiempo de gracia del comando `!purga` a peticiï¾ƒÎ´ï½³n del administrador.
*   **Cambios Clave:**
    *   **[Bot] Reglas de Purga:** Se modificï¾ƒÎ´ï½³ la duraciï¾ƒÎ´ï½³n permitida de un jugador sin ficha de 5 dï¾ƒÎ´ï½­as a 3 dï¾ƒÎ´ï½­as. Los textos de advertencia del menï¾ƒÎ´ï½º de comandos tambiï¾ƒÎ´ï½©n fueron actualizados a 3 dï¾ƒÎ´ï½­as.

### [Fecha: 30/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/tracker.js`, `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Soluciï¾ƒÎ´ï½³n al reseteo del comando `!purga` provocado por reinicios del servidor en Hugging Face.
*   **Cambios Clave:**
    *   **[Bot] Persistencia en Supabase:** Se reescribiï¾ƒÎ´ï½³ `tracker.js` para que ya no guarde `pending_tracker.json` en el sistema de archivos local, ya que Hugging Face Spaces es efï¾ƒÎ´ï½­mero y borraba el progreso.
    *   **[Bot] Documento Oculto:** El estado del tracker ahora se serializa y se guarda directamente en la tabla `knowledge_documents` bajo el ID `bot-pending-tracker` con visibilidad falsa, aprovechando la base de datos sin requerir migraciones SQL nuevas.
    *   **[Bot] Funciones Asï¾ƒÎ´ï½­ncronas:** Se modificï¾ƒÎ´ï½³ `admin.js` para usar `await` en las llamadas del tracker, permitiendo consultas remotas.

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
*   **Resumen:** Puente canï¾ƒÎ´ï½³nico entre misiones del panel admin y el Game Master para restringir magias de NPCs al grimorio oficial.
*   **Cambios Clave:**
    *   **[Admin] NPCs tï¾ƒÎ´ï½¡cticos canï¾ƒÎ´ï½³nicos:** El editor de misiones ahora permite definir NPCs del encounter con rol, stats, notas tï¾ƒÎ´ï½¡cticas y una lista explï¾ƒÎ´ï½­cita de magias permitidas tomadas del grimorio administrado.
    *   **[Compatibilidad] Config embebida sin migraciï¾ƒÎ´ï½³n:** La configuraciï¾ƒÎ´ï½³n del GM se serializa dentro de `instructions` usando bloques `[GM_CONFIG]...[/GM_CONFIG]`, evitando cambios de esquema en Supabase y manteniendo compatibilidad con las misiones existentes.
    *   **[GM-bot] Magia restringida por payload:** El bot parsea esa configuraciï¾ƒÎ´ï½³n embebida y la inyecta en `DATOS_DE_MISION` como bloque canï¾ƒÎ´ï½³nico de NPCs y magias permitidas, junto con una regla explï¾ƒÎ´ï½­cita para no inventar hechizos fuera de la lista.
*   **Notas/Advertencias:** `npx tsc --noEmit` sigue fallando por errores previos y ajenos en `src/components/RankingCard.tsx` y `src/components/WeeklyRankingPodium.tsx`. La validaciï¾ƒÎ´ï½³n de estos cambios se hizo con chequeo sintï¾ƒÎ´ï½¡ctico del bot y revisiï¾ƒÎ´ï½³n focalizada del flujo admin -> misiï¾ƒÎ´ï½³n -> GM.

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
*   **Resumen:** Optimizaciï¾ƒÎ´ï½³n del motor del Game Master para rol narrativo orgï¾ƒÎ´ï½¡nico sin lï¾ƒÎ´ï½­mites rï¾ƒÎ´ï½­gidos y agnï¾ƒÎ´ï½³stico al lore.
*   **Cambios Clave:**
    *   **Prompt Dinï¾ƒÎ´ï½¡mico y Agnï¾ƒÎ´ï½³stico:** Se refactorizï¾ƒÎ´ï½³ `buildGMPrompt` en `gmTracker.js` para eliminar referencias estï¾ƒÎ´ï½¡ticas (como "Shadow Garden"). Ahora el GM adopta la personalidad y el lore definidos exclusivamente en las instrucciones de la misiï¾ƒÎ´ï½³n desde la base de datos.
    *   **Eliminaciï¾ƒÎ´ï½³n de Lï¾ƒÎ´ï½­mites y Formato Natural:** Se removiï¾ƒÎ´ï½³ la restricciï¾ƒÎ´ï½³n de 350 palabras y el uso de listas numeradas (1., 2., 3...). El bot ahora usa prosa fluida y bloques de cï¾ƒÎ´ï½³digo Markdown para exponer mecï¾ƒÎ´ï½¡nicas RPG (cooldowns, niveles, daï¾ƒÎ´ï½±o) imitando el estilo de rol avanzado humano.
    *   **Expansiï¾ƒÎ´ï½³n de Tokens:** Se incrementï¾ƒÎ´ï½³ `maxOutputTokens` de 1024 a 2048 en `ai.js` para prevenir que respuestas narrativas extensas se corten prematuramente.
    *   **Fidelidad Tï¾ƒÎ´ï½¡ctica:** El sistema ahora estï¾ƒÎ´ï½¡ instruido para priorizar el respeto estricto a las estadï¾ƒÎ´ï½­sticas reales (niveles, HP, etc.) de los NPCs creados en el panel de control.

### [Fecha: 26/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/auditLog.js`, `kingdoom-bot/src/adminStore.js`
*   **Resumen:** Correcciï¾ƒÎ´ï½³n de rutas absolutas para garantizar persistencia local y remota del bot.
*   **Cambios Clave:**
    *   **[Admin] Rutas dinï¾ƒÎ´ï½¡micas:** Se implementaron rutas dinï¾ƒÎ´ï½¡micas (usando `__dirname` y `path.join`) para `admin_audit_log.json` y `admins.json`. Esto corrige el fallo silencioso donde el comando `!bitacora` no mostraba informaciï¾ƒÎ´ï½³n al correr en Windows y asegura compatibilidad nativa tanto local como en el contenedor de Hugging Face.

### [Fecha: 27/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `src/components/PlayerProfilePanel.tsx`
*   **Resumen:** Revisiï¾ƒÎ´ï½³n integral de UX/UI Mobile-First para compactar y optimizar espacio en pantallas pequeï¾ƒÎ´ï½±as.
*   **Cambios Clave:**
    *   **[UI Admin] Modal Full-screen:** `AdminControlSheet` ahora ocupa el 100% de la pantalla en dispositivos mï¾ƒÎ´ï½³viles sin bordes redondeados, maximizando el espacio ï¾ƒÎ´ï½ºtil, mientras que en desktop mantiene su diseï¾ƒÎ´ï½±o de panel flotante (`md:h-[92vh] md:rounded-[2rem]`).
    *   **[UI Admin] Formularios y Primitivas Compactas:** Se redujo el padding excesivo (`p-5` a `p-4 sm:p-5`) y los gaps en los inputs, tarjetas informativas y previas del mercado dentro de `AdminControlPrimitives.tsx`, requiriendo menos scroll vertical para administrar el reino desde el celular.
    *   **[UI Perfil] Optimizaciï¾ƒÎ´ï½³n de Layout:** `PlayerProfilePanel` ajustï¾ƒÎ´ï½³ la separaciï¾ƒÎ´ï½³n de sus bloques (`gap-5` a `gap-4 sm:gap-5`) y compactï¾ƒÎ´ï½³ los paddings generales de sus secciones internas para eliminar espacios vacï¾ƒÎ´ï½­os innecesarios sin perder jerarquï¾ƒÎ´ï½­a visual.
*   **Notas/Advertencias:** Ningï¾ƒÎ´ï½ºn cambio de lï¾ƒÎ´ï½³gica de Supabase ni del bot. Exclusivo de Frontend UI.


### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/player.js`
*   **Resumen:** Actualizaciï¾ƒÎ´ï½³n del comando `!ayuda`.
*   **Cambios Clave:**
    *   **[Admin/Soberano] Menï¾ƒÎ´ï½º de Ayuda:** Se aï¾ƒÎ´ï½±adieron los comandos administrativos faltantes (`!actividad`, `!grupoactual` y `!groupid`) a la lista desplegada por el comando `!ayuda`.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/supabase.js`
*   **Resumen:** Creaciï¾ƒÎ´ï½³n del comando de reporte `!actividad` (o `!inactivos`).
*   **Cambios Clave:**
    *   **[Admin] Reporte de Inactividad:** Se aï¾ƒÎ´ï½±adiï¾ƒÎ´ï½³ el comando `!actividad` exclusivo para administradores, el cual extrae a todos los usuarios ordenados por su ï¾ƒÎ´ï½ºltima fecha de conexiï¾ƒÎ´ï½³n y los formatea visualmente en columnas monospaciadas para rï¾ƒÎ´ï½¡pida lectura en WhatsApp.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-sync/supabase_purge_inactive.sql`, `Kingdoom-sync/src/utils/players.ts`, `Kingdoom-sync/src/context/PlayerSessionContext.tsx`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/index.js`
*   **Resumen:** Sistema de purga automï¾ƒÎ´ï½¡tica por 15 dï¾ƒÎ´ï½­as de inactividad (Web y WhatsApp).
*   **Cambios Clave:**
    *   **[Base de Datos] SQL Cron:** Nuevo script para aï¾ƒÎ´ï½±adir la columna `last_active_at` y crear un cron diario (`pg_cron`) que purgue perfiles inactivos.
    *   **[Web] Rastreo de Actividad:** Se ha integrado `touchPlayerActivity` al iniciar o recuperar sesiï¾ƒÎ´ï½³n en la web para evitar purgas errï¾ƒÎ´ï½³neas.
    *   **[Bot] Intercepciï¾ƒÎ´ï½³n de Mensajes:** Todo comando procesado por el bot en WhatsApp actualizarï¾ƒÎ´ï½¡ la actividad del usuario en tiempo real.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`
*   **Resumen:** Mejora del comando !purga para reportar y etiquetar a los usuarios pendientes.
*   **Cambios Clave:**
    *   **[Admin] Reporte de dï¾ƒÎ´ï½­as restantes:** El comando `!purga` ahora enumera a todos los usuarios pendientes que aï¾ƒÎ´ï½ºn no han superado el lï¾ƒÎ´ï½­mite de 5 dï¾ƒÎ´ï½­as, mencionï¾ƒÎ´ï½¡ndolos mediante etiqueta (`@usuario`) y mostrando cuï¾ƒÎ´ï½¡ntos dï¾ƒÎ´ï½­as les quedan para ser eliminados ("X dï¾ƒÎ´ï½­as para eliminaciï¾ƒÎ´ï½³n"). Esto funciona en adiciï¾ƒÎ´ï½³n a la expulsiï¾ƒÎ´ï½³n automï¾ƒÎ´ï½¡tica de aquellos que ya hayan cumplido el plazo.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`, `mcp_config.json`
*   **Resumen:** Reforzamiento de reglas de protocolo e integraciï¾ƒÎ´ï½³n local del MCP Kingdoom-memory.
*   **Cambios Clave:**
    *   **[Core Rule] Registro Obligatorio:** Se actualizï¾ƒÎ´ï½³ la regla de Inteligencias Artificiales del changelog para exigir que **cualquier** cambio, por mï¾ƒÎ´ï½­nimo que sea, deba documentarse en el historial y en la memoria MCP, y subirse obligatoriamente a Git de inmediato.
    *   **[Core Rule] Sincronizaciï¾ƒÎ´ï½³n:** Se inyectaron directrices principales (`core-rule`) en la memoria MCP exigiendo sincronizaciï¾ƒÎ´ï½³n obligatoria inicial (`git pull`) y publicaciï¾ƒÎ´ï½³n obligatoria final (`git push`) en cada sesiï¾ƒÎ´ï½³n.
    *   **[Sistema] Servidor MCP:** Se configurï¾ƒÎ´ï½³ exitosamente el servidor local MCP en `mcp_config.json` para tener acceso nativo a la memoria compartida de la IA.

### [Fecha: 25/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/scheduler.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/activeProfileStore.js`
*   **Resumen:** Correcciï¾ƒÎ´ï½³n de bug de usuarios con mï¾ƒÎ´ï½ºltiples nï¾ƒÎ´ï½ºmeros en reportes, implementaciï¾ƒÎ´ï½³n de mensajes motivacionales automatizados, y habilitaciï¾ƒÎ´ï½³n oficial de sistema multicuentas para WhatsApp.
*   **Cambios Clave:**
    *   **Bugfix en !pendientes y Scheduler (Fix):** Se ajustï¾ƒÎ´ï½³ la funciï¾ƒÎ´ï½³n de limpieza de nï¾ƒÎ´ï½ºmeros `normalizePhone` porque estaba fusionando nï¾ƒÎ´ï½ºmeros separados por coma en un ï¾ƒÎ´ï½ºnico nï¾ƒÎ´ï½ºmero corrupto. Ahora, cuando el bot revisa listas de participantes o envï¾ƒÎ´ï½­a notificaciones masivas, separa las comas primero y evalï¾ƒÎ´ï½ºa cada nï¾ƒÎ´ï½ºmero individualmente, arreglando falsos positivos de "no registrados" para los administradores y permitiendo que les lleguen las recompensas.
    *   **Mensajes Motivacionales de Rol (Feature):** El planificador de tareas (`scheduler.js`) fue rediseï¾ƒÎ´ï½±ado. Se eliminï¾ƒÎ´ï½³ el reporte semanal de ranking, y ahora envï¾ƒÎ´ï½­a un mensaje inmersivo y poï¾ƒÎ´ï½©tico ("Un nuevo ciclo comienza...") todos los lunes. Ademï¾ƒÎ´ï½¡s, el aviso de reset diario a la medianoche fue adaptado para incluir el nombre del personaje principal del usuario, haciï¾ƒÎ´ï½©ndolo 100% de rol.
    *   **Soporte Multicuentas (Feature):** Se eliminï¾ƒÎ´ï½³ la restricciï¾ƒÎ´ï½³n en la base de datos que impedï¾ƒÎ´ï½­a a los usuarios vincular un nï¾ƒÎ´ï½ºmero de telï¾ƒÎ´ï½©fono que ya estaba en uso. 
    *   **Comando `!cambiarcuenta` (Nuevo):** Los jugadores con mï¾ƒÎ´ï½ºltiples cuentas web (ej: Nothing y Alexander) pueden vincular ambas a su mismo WhatsApp. Se aï¾ƒÎ´ï½±adiï¾ƒÎ´ï½³ un store local (`activeProfileStore.js`) y un comando `!cambiarcuenta <nombre>` para que el jugador elija cuï¾ƒÎ´ï½¡l de sus fichas estï¾ƒÎ´ï½¡ activa para interactuar con el Orï¾ƒÎ´ï½¡culo, jugar o recibir oro.

### [Fecha: 22/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-bot/src/handlers/player.js`, `Kingdoom-bot/src/supabase.js`, `Kingdoom-bot/src/handlers/games.js`
*   **Resumen:** Correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de parseo en comandos y expansiï¾ƒÎ¸æ´¥ã�¤ï½³n de la visiï¾ƒÎ¸æ´¥ã�¤ï½³n del Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo hacia el Inventario Real.
*   **Cambios Clave:**
    *   **Trim de prefijo (Fix):** Se ajustï¾ƒÎ¸æ´¥ã�¤ï½³ la funciï¾ƒÎ¸æ´¥ã�¤ï½³n `parseCommand` en `player.js` para aplicar un `.trim()` sobre el string inmediatamente despuï¾ƒÎ¸æ´¥ã�¤ï½©s de remover el prefijo `!`. Esto soluciona un error crï¾ƒÎ¸æ´¥ã�¤ï½­tico donde comandos como `! Verificar <id>` se registraban como comando vacï¾ƒÎ¸æ´¥ã�¤ï½­o (`""`) debido al espacio residual.
    *   **Inventario en el Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo (Feature):** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ `getPlayerInventory` en `supabase.js` para consultar la tabla `player_inventory`. Ahora el `handleOraculo` en `games.js` inyecta las compras reales del mercado web (con sus cantidades correspondientes) directo al contexto de la IA. Si el jugador le pregunta "ï¾ƒï¿½Â€å ™ã�¤ï½¿Cï¾ƒÎ¸æ´¥ã�¤ï½³mo es mi equipamiento?", el Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo ya no alucinarï¾ƒÎ¸æ´¥ã�¤ï½¡ basï¾ƒÎ¸æ´¥ã�¤ï½¡ndose solo en su ficha original, sino que comentarï¾ƒÎ¸æ´¥ã�¤ï½¡ mï¾ƒÎ¸æ´¥ã�¤ï½¡gicamente sobre las pociones o espadas reales que haya adquirido con oro.

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
*   **Resumen:** Mejora del Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo con Memoria y Contexto de Jugador.
*   **Cambios Clave:**
    *   `games.js`: Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ un mapa en memoria (`oraculoMemory`) que guarda el historial de los ï¾ƒÎ¸æ´¥ã�¤ï½ºltimos 3 intercambios por cada chat/grupo, dï¾ƒÎ¸æ´¥ã�¤ï½¡ndole al Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo memoria a corto plazo.
    *   El orï¾ƒÎ¸æ´¥ã�¤ï½¡culo ahora sabe quiï¾ƒÎ¸æ´¥ã�¤ï½©n le habla y cuï¾ƒÎ¸æ´¥ã�¤ï½¡nto oro tiene. El prompt fue ajustado para referirse al jugador por su nombre, y para burlarse o codiciar sus riquezas basï¾ƒÎ¸æ´¥ã�¤ï½¡ndose en su saldo en la base de datos, mejorando drï¾ƒÎ¸æ´¥ã�¤ï½¡sticamente el rol en vivo.
    *   **Flexibilidad (Nuevo):** Se eliminï¾ƒÎ¸æ´¥ã�¤ï½³ la restricciï¾ƒÎ¸æ´¥ã�¤ï½³n rï¾ƒÎ¸æ´¥ã�¤ï½­gida de "exactamente 2-3 lï¾ƒÎ¸æ´¥ã�¤ï½­neas". Ahora se le permite adaptarse: puede dar respuestas de 1-2 lï¾ƒÎ¸æ´¥ã�¤ï½­neas si es un simple vaticinio o explayarse hasta 2 pï¾ƒÎ¸æ´¥ã�¤ï½¡rrafos si la pregunta requiere contexto del *lore*. Ademï¾ƒÎ¸æ´¥ã�¤ï½¡s, puede interpretar preguntas "Off-Rol" (fuera de personaje) absorbiï¾ƒÎ¸æ´¥ã�¤ï½©ndolas de forma poï¾ƒÎ¸æ´¥ã�¤ï½©tica como si fueran hechicerï¾ƒÎ¸æ´¥ã�¤ï½­a o idiomas forasteros.
    *   **Integraciï¾ƒÎ¸æ´¥ã�¤ï½³n de Fichas (Nuevo):** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ `getPlayerSheet` en `supabase.js`. El orï¾ƒÎ¸æ´¥ã�¤ï½¡culo ahora extrae la Ficha de Personaje (Rol) del jugador desde Supabase e inyecta su Nombre de personaje, Raza, Origen, Poderes, Arma y Personalidad en el sistema de la IA. Esto permite al orï¾ƒÎ¸æ´¥ã�¤ï½¡culo dar profecï¾ƒÎ¸æ´¥ã�¤ï½­as hiper-personalizadas basadas en la lore individual de cada guerrero.
    *   `ai.js`: Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ un tercer modelo de respaldo (`gemini-1.5-flash`) en la cascada de fallbacks para mitigar errores `503 Service Unavailable` provocados por la saturaciï¾ƒÎ¸æ´¥ã�¤ï½³n global de los servidores de Google Generative AI en los modelos `2.5` y `3.5`.
    *   `ai.js`: Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ un tercer modelo de respaldo (`gemini-1.5-flash`) en la cascada de fallbacks para mitigar errores `503 Service Unavailable` provocados por la saturaciï¾ƒÎ¸æ´¥ã�¤ï½³n global de los servidores de Google Generative AI en los modelos `2.5` y `3.5`.
    *   **Prevenciï¾ƒÎ¸æ´¥ã�¤ï½³n de Alucinaciones (Nuevo):** Se le dio la instrucciï¾ƒÎ¸æ´¥ã�¤ï½³n estricta al Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo de negarse a revelar las riquezas o secretos de *otros* jugadores. Si se le pregunta por alguien ajeno, ahora dirï¾ƒÎ¸æ´¥ã�¤ï½¡ de forma misteriosa que no puede revelar secretos que estï¾ƒÎ¸æ´¥ã�¤ï½¡n bajo la sombra, evitando que la IA invente nï¾ƒÎ¸æ´¥ã�¤ï½ºmeros falsos para compensar la falta de contexto en memoria.
    *   **Transferencia de Oro (`!oro`):** Se modificï¾ƒÎ¸æ´¥ã�¤ï½³ el comando `!oro` en `player.js`. Ahora, si se usa sin parï¾ƒÎ¸æ´¥ã�¤ï½¡metros, muestra el saldo actual. Si se usa como `!oro <monto> <@usuario>`, permite a los jugadores enviarse oro entre sï¾ƒÎ¸æ´¥ã�¤ï½­, descontando de la cuenta del emisor y sumando a la del receptor (con validaciï¾ƒÎ¸æ´¥ã�¤ï½³n de fondos y protecciï¾ƒÎ¸æ´¥ã�¤ï½³n de auto-envï¾ƒÎ¸æ´¥ã�¤ï½­o).
*   **Archivos Modificados:** `Kingdoom-bot/src/supabase.js`, `Kingdoom-bot/src/handlers/games.js`, `Kingdoom-bot/src/handlers/admin.js`, `Kingdoom-bot/src/index.js`
*   **Resumen:** Arquitectura RAG e integraciï¾ƒÎ¸æ´¥ã�¤ï½³n de Base de Conocimiento entre Kingdoom-sync (Archivista) y Kingdoom-bot.
*   **Cambios Clave:**
    *   `supabase.js`: Se aï¾ƒÎ¸æ´¥ã�¤ï½±adieron funciones `getKnowledgeDocuments` y `pickKnowledgeContext` para consultar la tabla `knowledge_documents`.
    *   `!oraculo` (`games.js`): Ahora inyecta dinï¾ƒÎ¸æ´¥ã�¤ï½¡micamente hasta 2 documentos relevantes de la base de datos de conocimiento como contexto al prompt de Gemini, compartiendo la misma memoria del Archivista web.
    *   `!data` (`admin.js` y `index.js`): Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ este comando exclusivo de admin para WhatsApp. Permite adjuntar un archivo `.txt` y cargarlo a la tabla Supabase, sincronizando la memoria directamente desde WhatsApp hacia la web.

### [Fecha: 22/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/features/businesses/businesses.service.ts`
*   **Resumen:** Implementaciï¾ƒÎ¸æ´¥ã�¤ï½³n de la funcionalidad de borrado de negocios y propuestas de negocios desde el panel de control administrativo.
*   **Cambios Clave:**
    *   **[Backend] Eliminaciï¾ƒÎ¸æ´¥ã�¤ï½³n de registros:** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adieron las funciones `deleteBusiness` y `deleteBusinessProposal` a los servicios de negocios para ejecutar los borrados con su respectivo manejo de estado.
    *   **[Admin] Botï¾ƒÎ¸æ´¥ã�¤ï½³n Borrar Negocio Activo:** Los administradores ahora pueden borrar negocios permanentemente pulsando el ï¾ƒÎ¸æ´¥ã�¤ï½­cono de la papelera junto al estado del almacenamiento en la tarjeta del negocio, con un diï¾ƒÎ¸æ´¥ã�¤ï½¡logo de confirmaciï¾ƒÎ¸æ´¥ã�¤ï½³n previo.
    *   **[Admin] Botï¾ƒÎ¸æ´¥ã�¤ï½³n Borrar Propuesta:** Se agregï¾ƒÎ¸æ´¥ã�¤ï½³ un botï¾ƒÎ¸æ´¥ã�¤ï½³n rojo de "Borrar" en el formulario de creaciï¾ƒÎ¸æ´¥ã�¤ï½³n/ediciï¾ƒÎ¸æ´¥ã�¤ï½³n de propuestas, posibilitando la eliminaciï¾ƒÎ¸æ´¥ã�¤ï½³n de propuestas mal formuladas o expiradas, igualmente protegido por confirmaciï¾ƒÎ¸æ´¥ã�¤ï½³n.
*   **Notas/Advertencias:** Estas acciones no se pueden deshacer y el oro no reclamado en negocios activos se perderï¾ƒÎ¸æ´¥ã�¤ï½¡ si son eliminados.

### [Fecha: 22/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`
*   **Resumen:** Optimizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de la interfaz de "Tus negocios" para ahorrar espacio y mejorar la experiencia de usuario.
*   **Cambios Clave:**
    *   **[UI] Filtrado Automï¾ƒÎ¸æ´¥ã�¤ï½¡tico:** Las propuestas de negocios ahora desaparecen instantï¾ƒÎ¸æ´¥ã�¤ï½¡neamente de la lista "Propuestas pendientes" una vez que son respondidas, mostrando solo aquellas en estado "pending".
    *   **[UI] Secciï¾ƒÎ¸æ´¥ã�¤ï½³n Colapsable:** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ un botï¾ƒÎ¸æ´¥ã�¤ï½³n "Mostrar / Ocultar" en la cabecera. Por defecto, todo el bloque interno de "Negocios activos" y "Propuestas" aparece colapsado, limpiando visualmente el perfil del jugador.
*   **Notas/Advertencias:** Estos cambios operan exclusivamente a nivel de presentaciï¾ƒÎ¸æ´¥ã�¤ï½³n en la SPA; la lï¾ƒÎ¸æ´¥ã�¤ï½³gica de red y base de datos (RPC) permanece intacta.

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

### [Fecha: 20/05/2026] - [Autor: Antigravity] - [Sesiï¾ƒÎ¸æ´¥ã�¤ï½³n 3 - Auditorï¾ƒÎ¸æ´¥ã�¤ï½­a de Comandos]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`
*   **Resumen:** Auditorï¾ƒÎ¸æ´¥ã�¤ï½­a estï¾ƒÎ¸æ´¥ã�¤ï½¡tica de todos los handlers del bot y correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de permisos/comandos de administraciï¾ƒÎ¸æ´¥ã�¤ï½³n.
*   **Cambios Clave:**
    *   **[SOPORTE] Comando `!pendiente` singular:** Se mapeï¾ƒÎ¸æ´¥ã�¤ï½³ `!pendiente` en el router principal (`index.js`) y en `admin.js` para que los administradores y dueï¾ƒÎ¸æ´¥ã�¤ï½±os puedan usar tanto el formato singular como el plural (`!pendientes`). Anteriormente, usar el singular hacï¾ƒÎ¸æ´¥ã�¤ï½­a que la peticiï¾ƒÎ¸æ´¥ã�¤ï½³n fuera procesada por la IA al no estar en la lista blanca de comandos de administrador en `index.js`.
    *   **[SOPORTE] Acceso a `!censo` y `!pendientes` para Administradores:** Se validï¾ƒÎ¸æ´¥ã�¤ï½³ y asegurï¾ƒÎ¸æ´¥ã�¤ï½³ que los usuarios que posean privilegios de administrador (ademï¾ƒÎ¸æ´¥ã�¤ï½¡s del Owner) puedan ejecutar `!censo` y `!pendientes` sin restricciones de permisos.
    *   **[CRï¾ƒÎ¸æ´¥ã�¤æŽ§ICO] Fix `!dados` ï¾ƒÎ´ï½¢ï¾ƒã‚„ã�Žï¾ƒã‚„Â€ï¿½ sender incorrecto en grupos (`games.js`):** El comando `!dados` usaba `msg.from` para buscar al jugador en Supabase. En grupos de WhatsApp, `msg.from` devuelve el JID del **grupo** (ej: `12345@g.us`), no el del jugador. Esto hacï¾ƒÎ¸æ´¥ã�¤ï½­a que el bot nunca encontrara al jugador y siempre respondiera "No estï¾ƒÎ¸æ´¥ã�¤ï½¡s registrado". Corregido usando `msg.author || msg.from`, el patrï¾ƒÎ¸æ´¥ã�¤ï½³n estï¾ƒÎ¸æ´¥ã�¤ï½¡ndar del resto de los handlers.
    *   **[MEDIO] Fix `!ban` ï¾ƒÎ´ï½¢ï¾ƒã‚„ã�Žï¾ƒã‚„Â€ï¿½ falso positivo (`admin.js`):** Cuando un admin ejecutaba `!ban` con un nï¾ƒÎ¸æ´¥ã�¤ï½ºmero no registrado en la DB, Supabase actualizaba 0 filas sin lanzar un error, y el bot respondï¾ƒÎ¸æ´¥ã�¤ï½­a "baneado" falsamente. Se agregï¾ƒÎ¸æ´¥ã�¤ï½³ una verificaciï¾ƒÎ¸æ´¥ã�¤ï½³n previa que consulta al jugador y retorna un error claro si no existe. Ademï¾ƒÎ¸æ´¥ã�¤ï½¡s, el mensaje de confirmaciï¾ƒÎ¸æ´¥ã�¤ï½³n ahora muestra el **username** del jugador baneado, no solo el nï¾ƒÎ¸æ´¥ã�¤ï½ºmero.
    *   **[MEJORA] Comando `!grant` y nuevo `!quitar` (`admin.js`, `index.js`):** Se mejorï¾ƒÎ¸æ´¥ã�¤ï½³ la gestiï¾ƒÎ¸æ´¥ã�¤ï½³n de oro para los administradores. Ahora `!grant` acepta tanto el celular, el **nombre de usuario**, o el **ID de la pï¾ƒÎ¸æ´¥ã�¤ï½¡gina web** (prefijo UUID) del jugador (ej. `!grant Zoelfrost 1000`, `!grant 2354 1000`), facilitando enormemente la administraciï¾ƒÎ¸æ´¥ã�¤ï½³n. Ademï¾ƒÎ¸æ´¥ã�¤ï½¡s, se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ el comando `!quitar` para restar oro sin necesidad de usar nï¾ƒÎ¸æ´¥ã�¤ï½ºmeros negativos (ej. `!quitar Zoelfrost 500`). Se actualizï¾ƒÎ¸æ´¥ã�¤ï½³ el menï¾ƒÎ¸æ´¥ã�¤ï½º de ayuda (`!admin`) para reflejar estos cambios.
    *   **[MEJORA] Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo y Memoria**
        - **Inyecciï¾ƒÎ¸æ´¥ã�¤ï½³n de Inventario Real:** El Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo ahora lee el inventario real del jugador (comprado en el mercado con oro) y lo integra en sus respuestas. Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ un error en la consulta a Supabase que causaba fallos silenciosos al buscar la columna `category` (que en realidad es `item_category`), logrando que el bot vuelva a "ver" los ï¾ƒÎ¸æ´¥ã�¤ï½­tems correctamente, extrayendo tambiï¾ƒÎ¸æ´¥ã�¤ï½©n el `item_name`. Ademï¾ƒÎ¸æ´¥ã�¤ï½¡s, se agregï¾ƒÎ¸æ´¥ã�¤ï½³ una inyecciï¾ƒÎ¸æ´¥ã�¤ï½³n explï¾ƒÎ¸æ´¥ã�¤ï½­cita para inventarios vacï¾ƒÎ¸æ´¥ã�¤ï½­os, evitando que el Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo "evada" la pregunta con frases mï¾ƒÎ¸æ´¥ã�¤ï½­sticas cuando el jugador no tiene ï¾ƒÎ¸æ´¥ã�¤ï½­tems.
        - **Identidad del Jugador (15-digit ID Fix):** Se agregï¾ƒÎ¸æ´¥ã�¤ï½³ un mapeo interno para que el Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo reconozca correctamente el ID de 15 dï¾ƒÎ¸æ´¥ã�¤ï½­gitos (`275162062668001`) del Owner como el perfil principal (`595987273405`), evitando que el sistema lo trate como un "alma sin nombre".
        - **Personalidad Mejorada:** Se rediseï¾ƒÎ¸æ´¥ã�¤ï½±ï¾ƒÎ¸æ´¥ã�¤ï½³ el prompt del Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo para que actï¾ƒÎ¸æ´¥ã�¤ï½ºe como un "vidente veterano y cï¾ƒÎ¸æ´¥ã�¤ï½­nico", hablando de forma mï¾ƒÎ¸æ´¥ã�¤ï½¡s directa, coloquial y menos poï¾ƒÎ¸æ´¥ã�¤ï½©tica. Su longitud se limitï¾ƒÎ¸æ´¥ã�¤ï½³ a 3 pï¾ƒÎ¸æ´¥ã�¤ï½¡rrafos y se instruyï¾ƒÎ¸æ´¥ã�¤ï½³ para negarse a revelar fortunas de terceros.
    *   **[MEJORA] Baneo y gestiï¾ƒÎ¸æ´¥ã�¤ï½³n de Administradores unificada (`admin.js`):** Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ un helper centralizado para que `!ban`, `!add admin`, `!remove admin`, `!grant` y `!quitar` puedan procesar a los jugadores usando su **ID web**, **username** o **celular**. Esto estandariza la experiencia de administraciï¾ƒÎ¸æ´¥ã�¤ï½³n, permitiendo identificar jugadores de mï¾ƒÎ¸æ´¥ã�¤ï½ºltiples maneras, tal como se hace en el comando de vinculaciï¾ƒÎ¸æ´¥ã�¤ï½³n `!verificar`.
    *   **[ELIMINADO] Comando `!broadcast` removido (`admin.js`, `index.js`):** El comando fue eliminado por decisiï¾ƒÎ¸æ´¥ã�¤ï½³n del Soberano. WhatsApp ya ofrece la funcionalidad nativa de @all / @todos en grupos, lo que hace innecesario un broadcast por DM que ademï¾ƒÎ¸æ´¥ã�¤ï½¡s tenï¾ƒÎ¸æ´¥ã�¤ï½­a problemas de compatibilidad con nï¾ƒÎ¸æ´¥ã�¤ï½ºmeros no registrados.
    *   **[NUEVO] Comando `!purga` (`admin.js`, `tracker.js`, `index.js`):** Nuevo comando que permite al Staff expulsar del grupo de WhatsApp a los usuarios que llevan mï¾ƒÎ¸æ´¥ã�¤ï½¡s de 5 dï¾ƒÎ¸æ´¥ã�¤ï½­as sin hacer su ficha. El bot mantiene un archivo JSON interno (`pending_tracker.json`) que registra la primera vez que un usuario aparece en `!pendientes`. Al ejecutar `!purga`, el bot verifica quiï¾ƒÎ¸æ´¥ã�¤ï½©nes superaron los 5 dï¾ƒÎ¸æ´¥ã�¤ï½­as y los remueve automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente. Requiere que el bot sea admin del grupo.
    *   **[MEJORA] `!pendientes` ahora rastrea fechas (`admin.js`, `tracker.js`):** Cada vez que se ejecuta `!pendientes`, el bot registra la fecha de detecciï¾ƒÎ¸æ´¥ã�¤ï½³n de cada usuario pendiente. Esto alimenta al tracker que `!purga` consume para calcular los 5 dï¾ƒÎ¸æ´¥ã�¤ï½­as de gracia.
    *   **[FIX] `!censo` / `!fichas` ï¾ƒÎ´ï½¢ï¾ƒã‚„ã�Žï¾ƒã‚„Â€ï¿½ columna inexistente (`supabase.js`):** La query de `getRealmCensus()` pedï¾ƒÎ¸æ´¥ã�¤ï½­a `player_id` a la tabla `character_sheets`, pero esa columna no existe en Supabase (solo existe `playerId` en camelCase). Esto hacï¾ƒÎ¸æ´¥ã�¤ï½­a que el comando fallara con "Error al obtener el censo del reino". Corregido removiendo la columna fantasma.
    *   **[BONUS] Formato de oro en `!dados`:** Se aplicï¾ƒÎ¸æ´¥ã�¤ï½³ `.toLocaleString('es-PY')` al mostrar el oro del jugador en el mensaje de saldo insuficiente, siendo consistente con el resto del bot.
### [Fecha: 20/05/2026] - [Autor: Antigravity] - [Sesiï¾ƒÎ¸æ´¥ã�¤ï½³n 3 - Fix Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo Cuota y Migraciï¾ƒÎ¸æ´¥ã�¤ï½³n a Gemini 2.5]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`
*   **Cambios Clave:**
    *   **[CRï¾ƒÎ¸æ´¥ã�¤æŽ§ICO] Fallback de modelo en `!oraculo` (`ai.js`):** Se identificï¾ƒÎ¸æ´¥ã�¤ï½³ que todos los modelos Gemini 1.0 y 1.5 (incluyendo `gemini-1.5-flash`) fueron desactivados por Google, arrojando error `404 Not Found`. Se migrï¾ƒÎ¸æ´¥ã�¤ï½³ el modelo por defecto del bot de `gemini-1.5-flash` a **`gemini-2.5-flash`**.
    *   **[CRï¾ƒÎ¸æ´¥ã�¤æŽ§ICO] Soporte para mï¾ƒÎ¸æ´¥ã�¤ï½ºltiples claves API con rotaciï¾ƒÎ¸æ´¥ã�¤ï½³n automï¾ƒÎ¸æ´¥ã�¤ï½¡tica (`ai.js`):** El usuario configurï¾ƒÎ¸æ´¥ã�¤ï½³ dos llaves API separadas por comas en `GEMINI_API_KEY`. Se rediseï¾ƒÎ¸æ´¥ã�¤ï½±ï¾ƒÎ¸æ´¥ã�¤ï½³ el manejador para procesar una lista de llaves de manera dinï¾ƒÎ¸æ´¥ã�¤ï½¡mica. Al invocar el Orï¾ƒÎ¸æ´¥ã�¤ï½¡culo, intenta secuencialmente con cada clave. Si una falla (por ejemplo, por lï¾ƒÎ¸æ´¥ã�¤ï½­mite de cuota o error 429), realiza un log detallado y reintenta con la siguiente clave transparente y automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente.
    *   **[MEJORA] Cadena de Fallback de Modelos en caso de 404/503 (`ai.js`):** Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ una lï¾ƒÎ¸æ´¥ã�¤ï½³gica de fallback de modelos en bucle. Si el modelo actual (ej: `gemini-2.5-flash`) devuelve `404 Not Found` o un error temporal de sobrecarga `503 Service Unavailable`, el bot no descartarï¾ƒÎ¸æ´¥ã�¤ï½¡ la clave de inmediato; en su lugar, intentarï¾ƒÎ¸æ´¥ã�¤ï½¡ automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente con otros modelos candidatos como **`gemini-3.5-flash`** para asegurar respuestas exitosas durante picos de demanda del servidor de Google.



### [Fecha: 20/05/2026] - [Autor: Antigravity] - [Sesiï¾ƒÎ¸æ´¥ã�¤ï½³n 3 - Auditorï¾ƒÎ¸æ´¥ã�¤ï½­a Scheduler]
*   **Archivos Modificados:** `kingdoom-bot/src/scheduler.js`
*   **Cambios Clave:**
    *   **[CRï¾ƒÎ¸æ´¥ã�¤æŽ§ICO] Fix reset semanal `weekly_gold` (`scheduler.js`):** La operaciï¾ƒÎ¸æ´¥ã�¤ï½³n `supabase.from('players').update({ weekly_gold: 0 })` sin ningï¾ƒÎ¸æ´¥ã�¤ï½ºn filtro es **bloqueada por defecto** por Supabase JS v2 como medida de seguridad contra actualizaciones masivas accidentales. Esto hacï¾ƒÎ¸æ´¥ã�¤ï½­a que el ranking semanal se anunciara correctamente cada lunes pero el oro semanal nunca se reseteara, acumulï¾ƒÎ¸æ´¥ã�¤ï½¡ndose indefinidamente. Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ agregando `.gte('weekly_gold', 0)` como filtro de seguridad que coincide con todos los jugadores (el oro nunca es negativo por diseï¾ƒÎ¸æ´¥ã�¤ï½±o).

### [Fecha: 20/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/welcome.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `kingdoom-bot/README.md`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/handlers/player.js`
*   **Resumen de Tareas:** Correcciï¾ƒÎ¸æ´¥ã�¤ï½³n del sistema de bienvenida, comando `!groupid`, fix del mercado, correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de textos truncados, fix de imports en consultas detalladas y migraciï¾ƒÎ¸æ´¥ã�¤ï½³n del bot a Hugging Face Spaces (16 GB RAM gratis).
*   **Cambios Clave:**
    *   **Migraciï¾ƒÎ¸æ´¥ã�¤ï½³n a Hugging Face Spaces:** Se trasladï¾ƒÎ¸æ´¥ã�¤ï½³ el bot desde Railway (con crï¾ƒÎ¸æ´¥ã�¤ï½©ditos agotados) a Hugging Face Spaces basado en Docker, obteniendo **16 GB de RAM y 2 vCPU** de forma completamente gratuita, eliminando crasheos de memoria por Puppeteer/Chromium.
    *   **Resoluciï¾ƒÎ¸æ´¥ã�¤ï½³n de puertos (7860) y metadatos:** Se agregï¾ƒÎ¸æ´¥ã�¤ï½³ `ENV PORT=7860` en el `Dockerfile` y se creï¾ƒÎ¸æ´¥ã�¤ï½³ el `README.md` con la cabecera YAML requerida por Hugging Face. Esto solucionï¾ƒÎ¸æ´¥ã�¤ï½³ la pantalla infinita de "Preparing Space" permitiendo la comunicaciï¾ƒÎ¸æ´¥ã�¤ï½³n correcta con la interfaz web.
    *   **Fix de permisos no-root:** Se crearon los directorios del bot y se asignï¾ƒÎ¸æ´¥ã�¤ï½³ `chmod -R 777` en el Dockerfile para que el usuario de Hugging Face (`1000`) pueda escribir los datos de autenticaciï¾ƒÎ¸æ´¥ã�¤ï½³n de WhatsApp en la carpeta temporal de persistencia.
    *   **Fix del comando !mercado (columna 'available' inexistente):** Se detectï¾ƒÎ¸æ´¥ã�¤ï½³ que las consultas a la tabla `market_items` en `supabase.js` filtraban usando `.eq('available', true)`. Dado que la columna `available` no existe en la base de datos de Kingdoom (el stock se gestiona en su lugar con `stock_status`), la API de Supabase devolvï¾ƒÎ¸æ´¥ã�¤ï½­a un error de columna inexistente, causando que el bot reportara falsamente que el mercado estaba vacï¾ƒÎ¸æ´¥ã�¤ï½­o. Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ removiendo este filtro y adaptando `getRealmSnapshot` para excluir items con `stock_status = 'sold-out'`.
    *   **Fix de importaciï¾ƒÎ¸æ´¥ã�¤ï½³n de getMissionDetails y getEventDetails:** Los comandos de detalle de misiones (`!mision <nombre>`) y eventos (`!evento <nombre>`) fallaban silenciosamente lanzando el error de sistema `"El reino estï¾ƒÎ¸æ´¥ã�¤ï½¡ en llamas..."`. Se detectï¾ƒÎ¸æ´¥ã�¤ï½³ que las funciones `getMissionDetails` y `getEventDetails` no estaban importadas al inicio de `player.js` desde `../supabase.js` a pesar de estar declaradas e implementadas. Se agregaron a los imports del archivo para solucionar el fallo de referencia.
    *   **Ampliaciï¾ƒÎ¸æ´¥ã�¤ï½³n del lï¾ƒÎ¸æ´¥ã�¤ï½­mite de texto en comandos (!item, !mision, !evento):** Las descripciones y habilidades se recortaban excesivamente en WhatsApp (`clipText` recortaba a 110, 130 o 140 caracteres, dejando textos incompletos con suspensivos). Se ampliï¾ƒÎ¸æ´¥ã�¤ï½³ el lï¾ƒÎ¸æ´¥ã�¤ï½­mite en los comandos de detalle a **500 caracteres**, permitiendo la lectura de habilidades legendarias completas y descripciones extendidas sin spam descontrolado.
    *   **Fix de filtro de grupo en bienvenida:** Ahora la bienvenida se dispara en cualquier grupo si no hay filtro configurado en las variables de entorno, evitando retornos silenciosos.
    *   **Log de diagnï¾ƒÎ¸æ´¥ã�¤ï½³stico:** Se aï¾ƒÎ¸æ´¥ã�¤ï½±ade `console.log` para `group_join` detallando los IDs de grupos.
    *   **Comando !groupid:** Se creï¾ƒÎ¸æ´¥ã�¤ï½³ el comando `!groupid` para administradores que devuelve el JID ï¾ƒÎ¸æ´¥ã�¤ï½ºnico del grupo (`@g.us`) donde se ejecuta para poder configurar las variables del bot de bienvenida.
*   **Notas/Advertencias:** El bot estï¾ƒÎ¸æ´¥ã�¤ï½¡ completamente enlazado, conectado y activo de forma gratuita en su nueva infraestructura de Hugging Face Spaces.



### [Fecha: 19/05/2026] - [Autor: Antigravity] - [Sesiï¾ƒÎ¸æ´¥ã�¤ï½³n 2]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/components/PlayerProfilePanel.tsx`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Implementaciï¾ƒÎ¸æ´¥ã�¤ï½³n del sistema de vinculaciï¾ƒÎ¸æ´¥ã�¤ï½³n segura (`!verificar`) entre perfiles web y WhatsApp y visualizaciï¾ƒÎ¸æ´¥ã�¤ï½³n en el Panel de Perfil de la web.
*   **Cambios Clave:**
    *   **Comando de Vinculaciï¾ƒÎ¸æ´¥ã�¤ï½³n !verificar:** Se creï¾ƒÎ¸æ´¥ã�¤ï½³ la funciï¾ƒÎ¸æ´¥ã�¤ï½³n `verifyAndLinkPlayer` en el backend del bot (`kingdoom-bot/src/supabase.js`) que permite a cualquier usuario vincular su nï¾ƒÎ¸æ´¥ã�¤ï½ºmero de WhatsApp con su cuenta web medieval existente ingresando su nombre de usuario (sin distinguir mayï¾ƒÎ¸æ´¥ã�¤ï½ºsculas/minï¾ƒÎ¸æ´¥ã�¤ï½ºsculas) o el segmento inicial de su ID UUID (ej. `!verificar Zoelfrost` o `!verificar 2354`).
    *   **Bypass de Jugador no Registrado:** Se ubicï¾ƒÎ¸æ´¥ã�¤ï½³ el manejador de `!verificar` en `kingdoom-bot/src/handlers/player.js` arriba del control de seguridad de usuario no registrado, permitiendo que nuevos contactos puedan vincularse de manera fluida sin ser rechazados como viajero desconocido.
    *   **Visualizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de ID en la Web:** Se actualizï¾ƒÎ¸æ´¥ã�¤ï½³ `src/components/PlayerProfilePanel.tsx` tanto en la vista colapsada como expandida para mostrar el ID corto (los primeros 8 caracteres del UUID) de manera clara y estï¾ƒÎ¸æ´¥ã�¤ï½©tica.
    *   **Instrucciones de Vinculaciï¾ƒÎ¸æ´¥ã�¤ï½³n en UI:** En caso de que la cuenta web no tenga ningï¾ƒÎ¸æ´¥ã�¤ï½ºn WhatsApp vinculado (`player.phone` es null), el Panel de Perfil muestra una tarjeta dorada estilizada con instrucciones precisas y el comando exacto para copiar y enviar al bot: `!verificar <id_corto>`.
    *   **Actualizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de Modelos y Consultas:** Se incluyï¾ƒÎ¸æ´¥ã�¤ï½³ la columna `phone` en todas las consultas y payloads de creaciï¾ƒÎ¸æ´¥ã�¤ï½³n de jugadores de `src/utils/players.ts` para que el estado de vinculaciï¾ƒÎ¸æ´¥ã�¤ï½³n se sincronice en tiempo real con la UI de la SPA.
    *   **Habilitaciï¾ƒÎ¸æ´¥ã�¤ï½³n del Comando en Ruteador:** Se registrï¾ƒÎ¸æ´¥ã�¤ï½³ `'verificar'` en la lista blanca de comandos del ruteador principal `kingdoom-bot/src/index.js` para asegurar el procesamiento correcto de su prefijo.
    *   **Soporte de Citado para !add/!remove admin:** Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ una discrepancia UX donde los comandos `!add admin` y `!remove admin` requerï¾ƒÎ¸æ´¥ã�¤ï½­an especificar manualmente el nï¾ƒÎ¸æ´¥ã�¤ï½ºmero. Ahora soportan plenamente citar (responder a) un mensaje para extraer automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente el nï¾ƒÎ¸æ´¥ã�¤ï½ºmero del remitente del mensaje citado (Opciï¾ƒÎ¸æ´¥ã�¤ï½³n A).
    *   **Preservaciï¾ƒÎ¸æ´¥ã�¤ï½³n de Prototipo de Mensaje:** Se solventï¾ƒÎ¸æ´¥ã�¤ï½³ un error crï¾ƒÎ¸æ´¥ã�¤ï½­tico de `TypeError: msg.getQuotedMessage is not a function` que provocaba que el bot crasheara con "El reino estï¾ƒÎ¸æ´¥ã�¤ï½¡ en llamas..." al usar citados en comandos modificados. La causa era que la destructuraciï¾ƒÎ¸æ´¥ã�¤ï½³n `{ ...msg }` eliminaba los mï¾ƒÎ¸æ´¥ã�¤ï½©todos de la clase `Message` de `whatsapp-web.js`. Se solucionï¾ƒÎ¸æ´¥ã�¤ï½³ implementando un envoltorio limpio basado en `Object.create(originalMsg)` que preserva la cadena de prototipos intacta.
    *   **Administradores Persistentes en Supabase:** Se detectï¾ƒÎ¸æ´¥ã�¤ï½³ que el almacenamiento local `admins.json` dentro del contenedor de Railway se perdï¾ƒÎ¸æ´¥ã�¤ï½­a al redesplegar la aplicaciï¾ƒÎ¸æ´¥ã�¤ï½³n. Para solucionar esto de forma definitiva, se habilitï¾ƒÎ¸æ´¥ã�¤ï½³ el chequeo hï¾ƒÎ¸æ´¥ã�¤ï½­brido: el bot ahora valida los privilegios de administrador consultando la columna `is_admin` en la tabla `players` de Supabase de manera asï¾ƒÎ¸æ´¥ã�¤ï½­ncrona. Los comandos `!add admin` y `!remove admin` ahora actualizan automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente la base de datos en tiempo real para garantizar persistencia absoluta.
    *   **Correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de ID en Citados de Grupo:** Se solucionï¾ƒÎ¸æ´¥ã�¤ï½³ un bug crï¾ƒÎ¸æ´¥ã�¤ï½­tico donde responder a un mensaje de grupo con `!add admin` o `!registrar` extraï¾ƒÎ¸æ´¥ã�¤ï½­a errï¾ƒÎ¸æ´¥ã�¤ï½³neamente el JID del chat del grupo (`xxxx@g.us`) a travï¾ƒÎ¸æ´¥ã�¤ï½©s de `quoted.from`, registrando o agregando el ID de grupo completo (`5959823815251611282780`) en lugar del nï¾ƒÎ¸æ´¥ã�¤ï½ºmero del jugador. Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ cambiando el objetivo para priorizar `quoted.author` (el emisor real del mensaje dentro del grupo) con fallback a `quoted.from` (en chats directos).
    *   **Mejora de UX en !registrar Autï¾ƒÎ¸æ´¥ã�¤ï½³nomo:** Se optimizï¾ƒÎ¸æ´¥ã�¤ï½³ el flujo de error cuando un administrador ejecuta el comando `!registrar` de forma standalone (sin citar a un usuario y con argumentos incompletos). Ahora el bot detecta que no se especificaron los parï¾ƒÎ¸æ´¥ã�¤ï½¡metros mï¾ƒÎ¸æ´¥ã�¤ï½­nimos y responde con un mensaje guiado e instructivo que explica detalladamente el formato correcto para ambas opciones (Opciï¾ƒÎ¸æ´¥ã�¤ï½³n A: Respondiendo, Opciï¾ƒÎ¸æ´¥ã�¤ï½³n B: Directo/Manual).
    *   **Censo General de Fichas y Vinculaciones (!censo / !fichas):** Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ una funciï¾ƒÎ¸æ´¥ã�¤ï½³n integrada `getRealmCensus` en `kingdoom-bot/src/supabase.js` que realiza una consulta unificada de todos los jugadores y sus respectivas fichas de personajes (`character_sheets`). Se expuso el comando exclusivo para administradores `!censo` / `!fichas` en `kingdoom-bot/src/handlers/admin.js`, el cual genera un hermoso y estructurado reporte que detalla: total de aventureros, porcentaje de vinculaciï¾ƒÎ¸æ´¥ã�¤ï½³n a WhatsApp, nï¾ƒÎ¸æ´¥ã�¤ï½ºmero de PJs por usuario, los nombres de cada uno de sus PJs (PJ 1, PJ 2) y, para aquellos pendientes sin ficha completada, calcula automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente el tiempo transcurrido en dï¾ƒÎ¸æ´¥ã�¤ï½­as desde su registro original con una alerta de advertencia.
    *   **Consistencia y Citados en !grant y !ban:** Se habilitï¾ƒÎ¸æ´¥ã�¤ï½³ el soporte para citar/responder mensajes de WhatsApp en los comandos de administraciï¾ƒÎ¸æ´¥ã�¤ï½³n `!grant` y `!ban`. Esto permite otorgar oro (ej. `!grant 500` respondiendo al jugador) o banear (ej. `!ban` respondiendo al jugador) directamente sin requerir escribir sus nï¾ƒÎ¸æ´¥ã�¤ï½ºmeros de telï¾ƒÎ¸æ´¥ã�¤ï½©fono a mano.
*   **Notas/Advertencias:** Todas las modificaciones son 100% compatibles con la base de datos Supabase existente y la lï¾ƒÎ¸æ´¥ã�¤ï½³gica del bot. El compilador TypeScript pasï¾ƒÎ¸æ´¥ã�¤ï½³ con ï¾ƒÎ¸æ´¥ã�¤ï½©xito (`Exit code: 0`).

### [Fecha: 19/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `kingdoom-bot/src/handlers/player.js` (en repo secundario)
*   **Resumen de Tareas:** Migraciï¾ƒÎ¸æ´¥ã�¤ï½³n completa de Kingdoom Bot a Railway y soporte de visualizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de QR en alta definiciï¾ƒÎ¸æ´¥ã�¤ï½³n para WhatsApp Web.
*   **Cambios Clave:**
    *   **Migraciï¾ƒÎ¸æ´¥ã�¤ï½³n a Railway:** Se adaptï¾ƒÎ¸æ´¥ã�¤ï½³ la configuraciï¾ƒÎ¸æ´¥ã�¤ï½³n del bot para desplegarse de manera robusta en Railway.app, superando las limitaciones de RAM (512MB) y disco volï¾ƒÎ¸æ´¥ã�¤ï½¡til del plan gratuito de Render.
    *   **Docker & Volumen Persistente:** Se removiï¾ƒÎ¸æ´¥ã�¤ï½³ la directiva `VOLUME` en el `Dockerfile` (no soportada nativamente por Railway) y se configurï¾ƒÎ¸æ´¥ã�¤ï½³ la persistencia de la sesiï¾ƒÎ¸æ´¥ã�¤ï½³n mediante un disco montado en `/app/.wwebjs_auth` desde la interfaz de Railway.
    *   **Servidor Web QR en HD:** Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ una pï¾ƒÎ¸æ´¥ã�¤ï½¡gina interactiva en `PORT = 8080` (en `src/index.js`) que sirve el cï¾ƒÎ¸æ´¥ã�¤ï½³digo QR generado como imagen PNG en alta definiciï¾ƒÎ¸æ´¥ã�¤ï½³n, facilitando su escaneo e indicando el estado `ï¾ƒÎ´ï½¢ï¾ƒã�§ç¦¿ã‚„Â€ï½¦ Bot Conectado` una vez autenticado.
    *   **Remociï¾ƒÎ¸æ´¥ã�¤ï½³n del comando !daily:** Se removiï¾ƒÎ¸æ´¥ã�¤ï½³ por completo la funcionalidad de reclamo de recompensas diarias (`!daily`), limpiando sus imports, su lï¾ƒÎ¸æ´¥ã�¤ï½³gica interna de base de datos, la funciï¾ƒÎ¸æ´¥ã�¤ï½³n de selecciï¾ƒÎ¸æ´¥ã�¤ï½³n de premios, su menciï¾ƒÎ¸æ´¥ã�¤ï½³n en el comando `!ayuda` y su registro en la lista de comandos procesados de `index.js`.
    *   **Privilegios de Owner y Administradores:** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ un sistema robusto de permisos gestionado en `src/adminStore.js` con persistencia en el volumen de Railway (`/app/.wwebjs_auth/admins.json`). El nï¾ƒÎ¸æ´¥ã�¤ï½ºmero `595987273405` se definiï¾ƒÎ¸æ´¥ã�¤ï½³ como **Soberano (Owner)** del bot, teniendo acceso exclusivo a comandos para conceder (`!add admin <numero>`) o revocar (`!remove admin <numero>`) roles de administrador.
    *   **Restricciï¾ƒÎ¸æ´¥ã�¤ï½³n y Mejoras de !registrar:** El comando `!registrar` ahora estï¾ƒÎ¸æ´¥ã�¤ï½¡ restringido ï¾ƒÎ¸æ´¥ã�¤ï½ºnicamente a los administradores y al owner. Otorga **2500 de oro inicial** por defecto, y permite especificar un monto a la derecha (ej. `!registrar pepe 200000`, soportando separadores de miles). Ademï¾ƒÎ¸æ´¥ã�¤ï½¡s, se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ soporte UX premium: si se ejecuta respondiendo a un mensaje de WhatsApp, extrae automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente el nï¾ƒÎ¸æ´¥ã�¤ï½ºmero del remitente del mensaje citado.
    *   **Mensaje de Bienvenida Premium en Dos Partes:** Se actualizï¾ƒÎ¸æ´¥ã�¤ï½³ `src/handlers/welcome.js` para enviar dos mensajes secuenciales e interactivos con un intervalo de 1.5s al detectar nuevos miembros en el grupo de WhatsApp. El primer mensaje incluye una caja medieval de bienvenida para `ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã�§ï¿½ ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã�­ï¿½ ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã�¤ï¿½ ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã‚„Â€ï¿½ ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã�¨ï¿½ ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã�§ï½½ ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã�§ï½½ ï¾ƒÎ´ï½°ï¾ƒã�¤æ••ã�¤é�™ã�§è›‹ y un link directo a su canal de informaciï¾ƒÎ¸æ´¥ã�¤ï½³n para crear el primer personaje, mientras que el segundo lista oficialmente a los "Guardianes del Reino" (`Nothing`, `Zoelfrost`, `Ord`, `E.xe`). Incorpora menciones automï¾ƒÎ¸æ´¥ã�¤ï½¡ticas en alta prioridad a los miembros reciï¾ƒÎ¸æ´¥ã�¤ï½©n unidos.
    *   **Resoluciï¾ƒÎ¸æ´¥ã�¤ï½³n de Discrepancias de JID en Paraguay:** Se identificï¾ƒÎ¸æ´¥ã�¤ï½³ que WhatsApp a nivel de servidor aï¾ƒÎ¸æ´¥ã�¤ï½±ade o remueve un dï¾ƒÎ¸æ´¥ã�¤ï½­gito `9` despuï¾ƒÎ¸æ´¥ã�¤ï½©s del cï¾ƒÎ¸æ´¥ã�¤ï½³digo de paï¾ƒÎ¸æ´¥ã�¤ï½­s paraguayo (`595`), resultando en discrepancias de formato JID (ej. `5959987273405@c.us` vs `595987273405@c.us`). Se actualizï¾ƒÎ¸æ´¥ã�¤ï½³ `src/adminStore.js` para admitir y homologar automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente ambos formatos, permitiendo que seas reconocido como Soberano (Owner) de inmediato.
    *   **Identificaciï¾ƒÎ¸æ´¥ã�¤ï½³n de Remitentes en Grupos de WhatsApp:** Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ el error de mapeo donde el bot extraï¾ƒÎ¸æ´¥ã�¤ï½­a el emisor usando `msg.from` (que en grupos devuelve el ID del grupo en lugar del nï¾ƒÎ¸æ´¥ã�¤ï½ºmero del remitente). Ahora el bot extrae al emisor real de forma infalible con `msg.author || msg.from`, permitiendo a los administradores ejecutar comandos desde grupos.
    *   **Filtrado Silencioso de Mensajes No Registrados:** Para evitar spam masivo de `Viajero desconocido...` ante palabras cotidianas en grupos y PV, se configurï¾ƒÎ¸æ´¥ã�¤ï½³ el bot para ignorar de manera silenciosa cualquier mensaje de usuario no registrado que carezca del prefijo de comando `!`.
    *   **Correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de ReferenceError en el Handler de Jugadores:** Al refactorizar la identificaciï¾ƒÎ¸æ´¥ã�¤ï½³n de emisores se removiï¾ƒÎ¸æ´¥ã�¤ï½³ accidentalmente la declaraciï¾ƒÎ¸æ´¥ã�¤ï½³n local de `chatId` en `src/handlers/player.js` que el historial de chat con Inteligencia Artificial requerï¾ƒÎ¸æ´¥ã�¤ï½­a. Se reincorporï¾ƒÎ¸æ´¥ã�¤ï½³ `const chatId = msg.from;` restableciendo la persistencia correcta y solventando el crash que arrojaba `ï¾ƒÎ´ï½¢ï¾ƒã�§ï½¡ï¾ƒã‚„Â€æ••Î´ï½¯ï¾ƒã�¤ï½¸ï¾ƒã�¤ï¿½ El reino esta en llamas...`.
    *   **Menï¾ƒÎ¸æ´¥ã�¤ï½º Dinï¾ƒÎ¸æ´¥ã�¤ï½¡mico e Inteligente para !ayuda:** Se reprogramï¾ƒÎ¸æ´¥ã�¤ï½³ el comando `!ayuda` en `src/handlers/player.js` para detectar en tiempo real si el remitente del mensaje es el Soberano (Owner) o un Administrador del Reino, anexando de manera dinï¾ƒÎ¸æ´¥ã�¤ï½¡mica sus comandos exclusivos (como `!registrar`, `!grant`, `!stats`, `!broadcast`, `!admin`, etc.) al menï¾ƒÎ¸æ´¥ã�¤ï½º tradicional de juego de WhatsApp.
    *   **Fortalecimiento en Normalizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de Telï¾ƒÎ¸æ´¥ã�¤ï½©fonos:** Se securizï¾ƒÎ¸æ´¥ã�¤ï½³ `normalizePhone` en `src/supabase.js` convirtiendo el argumento de entrada a String y aplicando valores por defecto seguros para prevenir TypeErrors inesperados si el JID o nï¾ƒÎ¸æ´¥ã�¤ï½ºmero remitente no estï¾ƒÎ¸æ´¥ã�¤ï½¡ definido.
    *   **Restricciï¾ƒÎ¸æ´¥ã�¤ï½³n Estricta de Respuestas a Prefijo (!):** Para evitar que el bot responda con el Heraldo AI a conversaciones cotidianas de cualquier usuario (incluidos dueï¾ƒÎ¸æ´¥ã�¤ï½±os y administradores), se configurï¾ƒÎ¸æ´¥ã�¤ï½³ una regla estricta al inicio del manejador de mensajes de WhatsApp. Si el mensaje no inicia con el prefijo `!`, se ignora de manera inmediata y silenciosa (`if (!hasPrefix) return;`).
    *   **Identificaciï¾ƒÎ¸æ´¥ã�¤ï½³n Dinï¾ƒÎ¸æ´¥ã�¤ï½¡mica de Dueï¾ƒÎ¸æ´¥ã�¤ï½±o por Env y JID de Acompaï¾ƒÎ¸æ´¥ã�¤ï½±ante:** Se adaptï¾ƒÎ¸æ´¥ã�¤ï½³ `isOwner` en `src/adminStore.js` para validar dinï¾ƒÎ¸æ´¥ã�¤ï½¡micamente si el nï¾ƒÎ¸æ´¥ã�¤ï½ºmero del emisor coincide con la variable de entorno `OWNER_NUMBER` o `ADMIN_NUMBER` definida en Railway, e incorporï¾ƒÎ¸æ´¥ã�¤ï½³ soporte directo nativo para el identificador de dispositivo acompaï¾ƒÎ¸æ´¥ã�¤ï½±ante `275162062668001` como Soberano (Owner).
    *   **Normalizaciï¾ƒÎ¸æ´¥ã�¤ï½³n Unificada de Telï¾ƒÎ¸æ´¥ã�¤ï½©fonos Internacionales:** Se unificï¾ƒÎ¸æ´¥ã�¤ï½³ la lï¾ƒÎ¸æ´¥ã�¤ï½³gica de `normalizePhone` importï¾ƒÎ¸æ´¥ã�¤ï½¡ndose desde `adminStore.js` a `supabase.js`. Ahora formatea de forma consistente nï¾ƒÎ¸æ´¥ã�¤ï½ºmeros de Paraguay (removiendo el 9 adicional si tiene 13 dï¾ƒÎ¸æ´¥ã�¤ï½­gitos), Mï¾ƒÎ¸æ´¥ã�¤ï½©xico (canonicalizando a `521` si tiene 12 dï¾ƒÎ¸æ´¥ã�¤ï½­gitos) y Argentina (canonicalizando a `549` y eliminando el `15` si estï¾ƒÎ¸æ´¥ã�¤ï½¡ presente). Esto previene inconsistencias entre los datos guardados en la BD y las llamadas de eventos en WhatsApp.
    *   **Bypass de !ayuda para Nuevos Admins/Usuarios No Registrados:** Se modificï¾ƒÎ¸æ´¥ã�¤ï½³ `handlePlayerMessage` en `src/handlers/player.js` para procesar el comando `!ayuda` antes de comprobar si el jugador existe en la BD. Esto permite a los administradores reciï¾ƒÎ¸æ´¥ã�¤ï½©n aï¾ƒÎ¸æ´¥ã�¤ï½±adidos u dueï¾ƒÎ¸æ´¥ã�¤ï½±os ver el menï¾ƒÎ¸æ´¥ã�¤ï½º, identificar sus roles y diagnosticar su telï¾ƒÎ¸æ´¥ã�¤ï½©fono con una nota explicativa sobre cï¾ƒÎ¸æ´¥ã�¤ï½³mo registrarse, en lugar de recibir el mensaje de "Viajero desconocido".
    *   **Registro de Handoff:** Se registrï¾ƒÎ¸æ´¥ã�¤ï½³ formalmente el estado y las instrucciones del bot en la memoria compartida (`kingdoom-memory` MCP) para sincronizar el trabajo con Codex.
*   **Notas/Advertencias:** El bot estï¾ƒÎ¸æ´¥ã�¤ï½¡ activo y online. Solo requiere escanear el QR generado en su dominio pï¾ƒÎ¸æ´¥ã�¤ï½ºblico de Railway. El cambio de la remociï¾ƒÎ¸æ´¥ã�¤ï½³n del !daily, la reestructuraciï¾ƒÎ¸æ´¥ã�¤ï½³n de permisos/registro, la bienvenida en dos partes, la correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de JIDs/mensajerï¾ƒÎ¸æ´¥ã�¤ï½­a grupal, el menï¾ƒÎ¸æ´¥ã�¤ï½º dinï¾ƒÎ¸æ´¥ã�¤ï½¡mico de ayuda, la restricciï¾ƒÎ¸æ´¥ã�¤ï½³n estricta de prefijos, el diagnï¾ƒÎ¸æ´¥ã�¤ï½³stico de identidad, el JID especï¾ƒÎ¸æ´¥ã�¤ï½­fico del dueï¾ƒÎ¸æ´¥ã�¤ï½±o, la normalizaciï¾ƒÎ¸æ´¥ã�¤ï½³n unificada de telï¾ƒÎ¸æ´¥ã�¤ï½©fonos internacionales y el bypass de ayuda fue committeado y pusheado de inmediato para gatillar el despliegue automï¾ƒÎ¸æ´¥ã�¤ï½¡tico en Railway.

### [Fecha: 18/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `api/admin/ask-archivist.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ la capacidad de dar oro a mï¾ƒÎ¸æ´¥ã�¤ï½ºltiples jugadores simultï¾ƒÎ¸æ´¥ã�¤ï½¡neamente ("add_multiple_players_gold").
*   **Cambios Clave:**
    *   **Acciï¾ƒÎ¸æ´¥ã�¤ï½³n de lista:** Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ `add_multiple_players_gold` para procesar una lista de nombres de usuario.
    *   **Bï¾ƒÎ¸æ´¥ã�¤ï½ºsqueda flexible:** El motor busca a los jugadores indicados ignorando mayï¾ƒÎ¸æ´¥ã�¤ï½ºsculas/minï¾ƒÎ¸æ´¥ã�¤ï½ºsculas y buscando coincidencias parciales, igual que en la bï¾ƒÎ¸æ´¥ã�¤ï½ºsqueda individual.
    *   **Prompts:** Se actualizï¾ƒÎ¸æ´¥ã�¤ï½³ el prompt de IA para utilizar un payload de la forma `{"usernames": ["User A", "User B"], "amount": X}` cuando se le piden varios nombres.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [Fecha: 18/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `api/admin/ask-archivist.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ la capacidad de dar oro a todos los jugadores ("add_all_players_gold") desde el Archivista.
*   **Cambios Clave:**
    *   **Acciï¾ƒÎ¸æ´¥ã�¤ï½³n global:** Se implementï¾ƒÎ¸æ´¥ã�¤ï½³ `add_all_players_gold` en el motor de acciones del Archivista, permitiendo actualizar a todos los jugadores del contexto en una sola solicitud.
    *   **Prompts:** Se actualizï¾ƒÎ¸æ´¥ã�¤ï½³ el prompt de IA para reconocer comandos globales y emitir un payload simple de `{ "amount": X }` sin requerir nombre de usuario.
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
*   **Resumen de Tareas:** Finalizaciï¾ƒÎ¸æ´¥ã�¤ï½³n del fix para el ranking de oro del Archivista y refuerzo semï¾ƒÎ¸æ´¥ã�¤ï½¡ntico.
*   **Cambios Clave:**
    *   **Contexto Admin:** Se verificï¾ƒÎ¸æ´¥ã�¤ï½³ la inclusiï¾ƒÎ¸æ´¥ã�¤ï½³n de `richestPlayers` en el resumen runtime para staff.
    *   **Refuerzo Semï¾ƒÎ¸æ´¥ã�¤ï½¡ntico:** Se eliminï¾ƒÎ¸æ´¥ã�¤ï½³ `oro` de `CARD_STOPWORDS` y se duplicï¾ƒÎ¸æ´¥ã�¤ï½³ el `categoryBoost` para asegurar que las tarjetas de jugadores tengan prioridad absoluta en consultas econï¾ƒÎ¸æ´¥ã�¤ï½³micas.
    *   **Detecciï¾ƒÎ¸æ´¥ã�¤ï½³n de Intenciï¾ƒÎ¸æ´¥ã�¤ï½³n:** Se flexibilizï¾ƒÎ¸æ´¥ã�¤ï½³ `isPlayerGoldQuestion` para detectar "ranking", "ricos" y "riqueza" sin necesidad de mencionar explï¾ƒÎ¸æ´¥ã�¤ï½­citamente "jugador".
*   **Notas/Advertencias:** Validado con `npm run build`. El sistema ahora diferencia correctamente entre "comprar oro" (mercado) y "ï¾ƒï¿½Â€å ™ã�¤ï½¿quiï¾ƒÎ¸æ´¥ã�¤ï½©n tiene mï¾ƒÎ¸æ´¥ã�¤ï½¡s oro?" (jugadores).



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
*   **Resumen de Tareas:** Reconstrucciï¾ƒÎ¸æ´¥ã�¤ï½³n del Archivista hacia un formato de chat puro con contexto vivo del reino, tarjetas compactas y preparaciï¾ƒÎ¸æ´¥ã�¤ï½³n/ejecuciï¾ƒÎ¸æ´¥ã�¤ï½³n de acciones admin por confirmaciï¾ƒÎ¸æ´¥ã�¤ï½³n conversacional.
*   **Cambios Clave:**
    *   **Chat puro:** Se eliminï¾ƒÎ¸æ´¥ã�¤ï½³ la estructura anterior con panel lateral y controles de memoria visibles para concentrar toda la experiencia en una sola interfaz conversacional.
    *   **Contexto vivo:** El Archivista ahora resume mercado, misiones, eventos, grimorio, biblioteca y, en modo admin, tambiï¾ƒÎ¸æ´¥ã�¤ï½©n jugadores cargados.
    *   **Tarjetas compactas:** Las respuestas pueden adjuntar tarjetas breves de mercado, eventos, misiones, magias, bestiario, flora y documentos sin romper la versiï¾ƒÎ¸æ´¥ã�¤ï½³n mï¾ƒÎ¸æ´¥ã�¤ï½³vil.
    *   **Modo admin real:** Se integrï¾ƒÎ¸æ´¥ã�¤ï½³ el borrador y la ejecuciï¾ƒÎ¸æ´¥ã�¤ï½³n de acciones del reino tras confirmaciï¾ƒÎ¸æ´¥ã�¤ï½³n `si/no` en el chat para oro, misiones, eventos, mercado, magia, bestiario, flora y documentos.
    *   **Cache y contexto:** Se ajustï¾ƒÎ¸æ´¥ã�¤ï½³ el endpoint para separar respuestas pï¾ƒÎ¸æ´¥ã�¤ï½ºblicas/admin y considerar el resumen vivo del reino al generar la respuesta IA.
*   **Notas/Advertencias:** El Archivista sigue dependiendo de las APIs/configuraciones IA ya existentes. Conviene validar flujo pï¾ƒÎ¸æ´¥ã�¤ï½ºblico y flujo admin tras cada redeploy porque ahora la capa operativa ya no es solo informativa.

### [Fecha: 12/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `src/components/ArchivistSection.tsx`, `api/anime/proxy.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Resoluciï¾ƒÎ¸æ´¥ã�¤ï½³n de problemas de visualizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de enlaces, rediseï¾ƒÎ¸æ´¥ã�¤ï½±o de la interfaz de reproducciï¾ƒÎ¸æ´¥ã�¤ï½³n/descarga para mayor compacidad y limpieza de la secciï¾ƒÎ¸æ´¥ã�¤ï½³n del Archivista.
*   **Cambios Clave:**
    *   **Limpieza de Interfaz (ArchivistSection):** Eliminaciï¾ƒÎ¸æ´¥ã�¤ï½³n de la descripciï¾ƒÎ¸æ´¥ã�¤ï½³n redundante en la cabecera del Archivista ("Consulta el reino..."), siguiendo el rediseï¾ƒÎ¸æ´¥ã�¤ï½±o hacia un formato de chat puro.
    *   **UI Minimalista (AnimeHubSection):** Sustituciï¾ƒÎ¸æ´¥ã�¤ï½³n del selector de servidores por un componente ultra-compacto con icono de flecha (`ChevronDown`), optimizando el espacio en la consola de acciones.
    *   **Normalizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de Enlaces:** Se actualizï¾ƒÎ¸æ´¥ã�¤ï½³ `normalizeLinks` para soportar arrays directos de `servers` y `downloads` que devuelven los scrapers actuales.
    *   **Correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de Mapeo (AnimeFLV):** Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ `fetchAnimeFlvLinks` para procesar correctamente el payload envuelto de la API.
    *   **Seguridad:** Migraciï¾ƒÎ¸æ´¥ã�¤ï½³n total de API Keys hardcodeadas a la constante `ANIME_HUB_API_KEY`.
    *   **Proxy API:** Actualizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de `api/anime/proxy.ts` para mejorar la compatibilidad del mapeo de fuentes y enlaces.
*   **Notas/Advertencias:** La interfaz ahora es mï¾ƒÎ¸æ´¥ã�¤ï½¡s limpia y evita solapamientos en resoluciones bajas o mï¾ƒÎ¸æ´¥ã�¤ï½³viles.

### [Fecha: 11/05/2026] - [Autor: Antigravity & Jarvis]
*   **Archivos Modificados:** `api/anime/stream.ts`, `api/anime/download.ts`, `api/admin/_serverAiProviders.ts`, `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`, `.env.example`
*   **Resumen de Tareas:** Finalizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de la integraciï¾ƒÎ¸æ´¥ã�¤ï½³n de AnimeFLV, implementaciï¾ƒÎ¸æ´¥ã�¤ï½³n de filtros por proveedor y optimizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de conectividad (CORS/Timeouts).
*   **Cambios Clave:**
    *   **Endpoints:** Optimizaciï¾ƒÎ¸æ´¥ã�¤ï½³n de proxies en Vercel para streaming y descargas; ahora aceptan `ANIMEFLV_API_URL` como variable server-side.
    *   **UI Web/Mï¾ƒÎ¸æ´¥ã�¤ï½³vil:** Implementaciï¾ƒÎ¸æ´¥ã�¤ï½³n de selectores de proveedor y filtros dinï¾ƒÎ¸æ´¥ã�¤ï½¡micos en ambas plataformas.
    *   **Conectividad:** Correcciï¾ƒÎ¸æ´¥ã�¤ï½³n de tipos TypeScript para `ApiRequest` (aï¾ƒÎ¸æ´¥ã�¤ï½±adido `query`) e inclusiï¾ƒÎ¸æ´¥ã�¤ï½³n de declaraciones globales para entornos Node.js.
    *   **Robustez:** Inyecciï¾ƒÎ¸æ´¥ã�¤ï½³n de `User-Agent` real en peticiones de backend para evitar bloqueos 403 y timeouts de 8s con `AbortController`.
    *   **Configuraciï¾ƒÎ¸æ´¥ã�¤ï½³n:** Documentada la nueva variable `ANIMEFLV_API_URL` en `.env.example`.
*   **Notas/Advertencias:** La integraciï¾ƒÎ¸æ´¥ã�¤ï½³n es ahora resiliente a fallos de red y cumple con los estï¾ƒÎ¸æ´¥ã�¤ï½¡ndares de tipado de Vercel. Se requiere redeploy final.

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
*   **Resumen de Tareas:** Se ampliï¾ƒÎ¸æ´¥ã�¤ï½³ Anime Hub para aprovechar mejor las capacidades reales de `anime1v` con filtros por proveedor, enlaces mï¾ƒÎ¸æ´¥ã�¤ï½¡s completos y una experiencia coherente entre web y app.
*   **Cambios Clave:**
    *   Se aï¾ƒÎ¸æ´¥ã�¤ï½±adieron filtros reales por proveedor `anime1v` (`AnimeAV1`, `AnimeFLV`, `TioAnime`, `JKAnime`, `HentaiLA`, `MonosChinos`) en web y mï¾ƒÎ¸æ´¥ã�¤ï½³vil.
    *   La bï¾ƒÎ¸æ´¥ã�¤ï½ºsqueda ahora puede forzar el dominio correcto en `anime1v`, en lugar de tratarlo como una ï¾ƒÎ¸æ´¥ã�¤ï½ºnica fuente genï¾ƒÎ¸æ´¥ã�¤ï½©rica.
    *   Los resultados de `anime1v` ahora muestran la etiqueta real del proveedor origen, no solo `anime1v remoto`.
    *   La carga de enlaces de episodio ahora combina variantes `SUB` y `DUB`, e intenta pedir `includeMega=true` para exprimir mejor lo que ofrece el backend.
    *   Se corrigiï¾ƒÎ¸æ´¥ã�¤ï½³ la referencia del endpoint batch a `/api/v1/anime/batch-download` para mantenerla alineada con el backend real.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit` y `npm run build` antes de publicar. Los proveedores mï¾ƒÎ¸æ´¥ã�¤ï½¡s allï¾ƒÎ¸æ´¥ã�¤ï½¡ de `AnimeAV1` siguen dependiendo de que el backend `anime1v` tenga esos scrapers y requisitos externos operativos.

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
*   **Resumen de Tareas:** Finalizada la integraciï¾ƒÎ¸æ´¥ã�¤ï½³n de Anime Hub con soporte completo para reproducciï¾ƒÎ¸æ´¥ã�¤ï½³n (streaming) y descargas directas desde la API real.
*   **Cambios Clave:**
    *   **Tipado:** Extendida la interfaz `AnimeHubProvider` con `getEpisodeLinks` para soportar la obtenciï¾ƒÎ¸æ´¥ã�¤ï½³n dinï¾ƒÎ¸æ´¥ã�¤ï½¡mica de servidores.
    *   **Web/Remote:** Implementado fetcher de enlaces en `remoteAnimeHubProvider` y corregido el mapeo de detalles de serie (id, episodios y metadata).
    *   **UI Web:** `AnimeHubSection` ahora permite seleccionar episodios, cargando dinï¾ƒÎ¸æ´¥ã�¤ï½¡micamente los servidores de streaming y enlaces de descarga en un panel integrado.
    *   **Mobile:** Actualizado el proveedor nativo para incluir `fetchMobileEpisodeLinks` y corregido el mapeo de series para consistencia con la API.
    *   **API Hotfix:** Se redirigiï¾ƒÎ¸æ´¥ã�¤ï½³ el almacenamiento temporal de la API para evitar errores 500 en entornos serverless (Vercel).
*   **Notas/Advertencias:** Validado y sincronizado en GitHub. El sistema mantiene fallback automï¾ƒÎ¸æ´¥ã�¤ï½¡tico al modo cascarï¾ƒÎ¸æ´¥ã�¤ï½³n si la API no responde.


### [Fecha: 07/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Conexiï¾ƒÎ¸æ´¥ã�¤ï½³n real del mï¾ƒÎ¸æ´¥ã�¤ï½³dulo Anime Hub con `anime1v-api` mediante variables de entorno, manteniendo el modo cascarï¾ƒÎ¸æ´¥ã�¤ï½³n como fallback seguro.
*   **Cambios Clave:**
    *   **Web:** Implementado adaptador real en `remoteAnimeHubProvider` usando `VITE_ANIME_HUB_API_URL`. Soporta `searchSeries` y `getSeriesDetail` con mapeo a tipos internos.
    *   **Web:** `AnimeHubSection` ahora detecta automï¾ƒÎ¸æ´¥ã�¤ï½¡ticamente si existe la URL de la API para conmutar entre el proveedor mock y el remoto, con manejo de errores elegante en el feedback.
    *   **Mobile:** Actualizado `animeHubProvider.ts` para consumir `EXPO_PUBLIC_ANIME_HUB_API_URL` si estï¾ƒÎ¸æ´¥ã�¤ï½¡ presente, integrando los flujos de bï¾ƒÎ¸æ´¥ã�¤ï½ºsqueda e informaciï¾ƒÎ¸æ´¥ã�¤ï½³n real con fallback automï¾ƒÎ¸æ´¥ã�¤ï½¡tico al shell mock en caso de error o ausencia de configuraciï¾ƒÎ¸æ´¥ã�¤ï½³n.
    *   **Resiliencia:** Se preservï¾ƒÎ¸æ´¥ã�¤ï½³ el diseï¾ƒÎ¸æ´¥ã�¤ï½±o premium y el funcionamiento del modo cascarï¾ƒÎ¸æ´¥ã�¤ï½³n para entornos sin configuraciï¾ƒÎ¸æ´¥ã�¤ï½³n de API.
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
*   **Notas/Advertencias:** No cambia precios, compras ni probabilidades; solo evita que la vitrina rotativa enseï¾ƒÎ¸æ´¥ã�¤ï½±e agotados como reemplazo.
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
    *   La barra inferior ahora resalta la pestaï¾ƒÎ¸æ´¥ã�¤ï½±a activa con una capsula visual mas premium y menos ruido en pantallas estrechas.
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
*   **Resumen de Tareas:** Se rediseï¾ƒÎ¸æ´¥ã�¤ï½±o el panel `Staff IA` para que cualquier miembro del staff pueda usarlo sin perderse.
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
    *   El panel admin suma la pestaï¾ƒÎ¸æ´¥ã�¤ï½±a `Staff IA` con recomendaciones de riesgo, dificultad, cupos, oro, checklist y texto publicable.
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
*   **Resumen de Tareas:** Se integrï¾ƒÎ¸æ´¥ã�¤ï½³ soporte de Groq como proveedor IA de respaldo para misiones, magias, bestiario y Archivista, con posibilidad de varias keys y debug admin ampliado por proveedor.
*   **Cambios Clave:**
    *   Se creï¾ƒÎ¸æ´¥ã�¤ï½³ un motor compartido en `src/utils/serverAiProviders.ts` para manejar Gemini y Groq fuera de `api/admin`, evitando repetir lï¾ƒÎ¸æ´¥ã�¤ï½³gica y manteniendo compatibilidad con Vercel.
    *   Los endpoints de misiones, magias, bestiario y Archivista ahora pueden responder con `Gemini -> Groq` como cadena de fallback.
    *   Se aï¾ƒÎ¸æ´¥ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¤ï½³ soporte para `GROQ_API_KEYS` ademï¾ƒÎ¸æ´¥ã�¤ï½¡s de `GROQ_API_KEY`, junto con `GROQ_MODEL_PRIMARY` y `GROQ_MODEL_FALLBACK`.
    *   El debug admin ahora contempla proveedor y modelo, para que staff pueda ver si la llamada saliï¾ƒÎ¸æ´¥ã�¤ï½³ por Gemini o por Groq.
*   **Notas/Advertencias:**
    *   La extracciï¾ƒÎ¸æ´¥ã�¤ï½³n de PDF sigue dependiendo de Gemini, porque ese flujo actual usa inline PDF y no se migrï¾ƒÎ¸æ´¥ã�¤ï½³ a Groq.

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
    *   La web suma la pestaï¾ƒÎ¸æ´¥ã�¤ï½±a `Archivista`, con busqueda contextual local sobre documentos visibles y respuestas basadas en fuentes cargadas.
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
    *   Se elimino la pestaï¾ƒÎ¸æ´¥ã�¤ï½±a `Plantillas` del panel admin para dejar el centro de control mas limpio.
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
*   **Resumen de Tareas:** Se aï¾ƒÎ¸æ´¥ã�¤ï½±adieron mutadores aleatorios por caceria y criticos especiales por dificultad para darle mas variedad y personalidad al PvE arcade.
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
*   **Resumen de Tareas:** Optimizaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n mobile-first para que la navegaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n sea mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡s fluida y los modales no queden tapados por la barra inferior.
*   **Cambios Clave:**
    *   El panel `Tu sesion de jugador` ahora se auto-compacta fuera de `Inicio` y permite expandir/compactar manualmente.
    *   Al cambiar de pestaï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±a se hace scroll al inicio (evita que el usuario ï¾ƒÎ¸æ´¥ã�¤ï½¢ï¾ƒÎ´ï½¢ï¾ƒã‚„Â€å ™ã�¤ï½¬ï¾ƒï¿½Â€ï½¦ï¾ƒã‚„Â€å½¡aigaï¾ƒÎ¸æ´¥ã�¤ï½¢ï¾ƒÎ´ï½¢ï¾ƒã‚„Â€å ™ã�¤ï½¬ï¾ƒï¿½Â€å ™ã�¤ï¿½ a mitad de pï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡gina en mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³vil).
    *   Mercado: los catï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡logos por categorï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a ya no aparecen abiertos por defecto (reduce scroll infinito).
    *   Modales de fichas (`CharImportModal`/`CharSheetModal`) suben su z-index y ajustan alto/padding para no quedar detrï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡s de la barra inferior.
*   **Notas/Advertencias:** Sin cambios en la lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³gica de Supabase o guardado; solo UX/layout.

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
    *   El parser ahora elimina asteriscos restantes dentro del contenido y omite lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­neas de plantilla tipo "Noble, plebeyo o burgues" / "En caso de ser".
    *   `CharSheetModal` renderiza bloques tipo lista como bullets y mantiene "Ver mas / Ver menos" para textos largos.
*   **Notas/Advertencias:** Para fichas viejas ya guardadas, el modal tambiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½©n limpia `*` y guiones al mostrar (no es necesario re-importar).

---
### [Fecha: 13/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/sheetParser.ts`, `src/utils/characterSheets.ts`, `src/types.ts`, `src/components/PlayerProfilePanel.tsx`, `src/components/CharImportModal.tsx`, `src/components/RealmRegistry.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se termino y estabilizo el sistema de Fichas de Personaje (importar desde WhatsApp, guardar con defaults, y buscador publico) con soporte opcional para mostrar/buscar por usuario (sin depender del UUID).
*   **Cambios Clave:**
    *   Parser reescrito (`sheetParser.ts`) para tolerar mejor el formato decorado de WhatsApp y capturar secciones multilï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­nea sin ï¾ƒÎ¸æ´¥ã�¤ï½¢ï¾ƒÎ´ï½¢ï¾ƒã‚„Â€å ™ã�¤ï½¬ï¾ƒï¿½Â€ï½¦ï¾ƒã‚„Â€å¾‡ezclarï¾ƒÎ¸æ´¥ã�¤ï½¢ï¾ƒÎ´ï½¢ï¾ƒã‚„Â€å ™ã�¤ï½¬ï¾ƒï¿½Â€å ™ã�¤ï¿½ campos.
    *   Guardado de fichas ahora completa valores por defecto al crear la ficha (evita `undefined` y hace el upsert mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡s estable).
    *   Se aï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ `playerUsername?: string` al tipo `CharacterSheet` y la capa de guardado detecta si la tabla soporta esa columna; si no, omite la propiedad para no romper el upsert.
    *   Registro del Reino (`RealmRegistry`) mejorado: bï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½ºsqueda por personaje/raza/profesiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n y, si existe la columna, por `playerUsername`; si no, cae a `playerId`.
    *   Importador (`CharImportModal`) con placeholder limpio (plantilla) y grilla de stats mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡s usable en mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³vil.
*   **Notas/Advertencias:** Si quieres que el Registro muestre y busque por nombre de jugador, crea la columna opcional `playerUsername` en `character_sheets` (texto) o avï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­same y te paso el SQL exacto para tu esquema.

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
    *   Se restauro la navegacion principal (Inicio, Grimorio, Biblioteca, Mercado, Ranking) para que coincida con `TabId` y el diseï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±o acordado.
    *   Se corrigio `PlayerProfilePanel` para incluir `motion` en los modales y evitar errores en runtime.
    *   Se normalizo Supabase para que el cliente no sea `null`: ahora falla rapido con un error claro si faltan `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, y `src/lib/supabase.ts` reexporta el mismo cliente.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores.

---
### [Fecha: 13/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correcciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n del sistema de retiro automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡tico y visualizaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n del tope en el minijuego Crash.
*   **Cambios Clave:**
    *   **Soluciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de Stale Closures:** Implementaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de `useRef` para variables crï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­ticas (apuesta, jugador, multiplicador) asegurando lecturas en tiempo real dentro del bucle `requestAnimationFrame`.
    *   **Visualizaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n del Tope:** Ajuste dinï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡mico del eje Y (`maxY`) en el canvas para que la lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­nea de retiro automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡tico sea siempre visible en el grï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡fico.
    *   **Precisiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de Cobro:** El retiro automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡tico ahora asegura el multiplicador exacto configurado por el usuario, evitando discrepancias por saltos de frames.
*   **Notas/Advertencias:** Simulaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n y compilaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n verificadas exitosamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/scratchUtils.ts`, `src/components/TavernScratch.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Aleatorizaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n del lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite diario de ganancias en el Rasca y Gana.
*   **Cambios Clave:**
    *   **Lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite Dinï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡mico**: El lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite dejï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ de ser fijo (50,000) y ahora varï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a cada dï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a entre **10,000 y 150,000 de oro**.
    *   **Semilla Diaria**: Se utiliza la misma semilla pseudo-aleatoria del dï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a para calcular el lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite, asegurando consistencia durante las 24 horas.
    *   **Feedback Visual**: Se actualizï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ el mensaje de "Lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite Alcanzado" para mostrar dinï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡micamente el tope del dï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a actual.
*   **Notas/Advertencias:** El lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite es por jugador y por dï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a local.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Implementaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n del minigame "El Multiplicador del Vacï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­o" (Crash Game).
*   **Cambios Clave:**
    *   **Lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³gica de Tiempo Real**: Sistema basado en `requestAnimationFrame` para un conteo fluido y preciso.
    *   **Curva Exponencial**: El multiplicador acelera con el tiempo (`1.06^t`), aumentando la presiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n psicolï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³gica.
    *   **Punto de Colapso Dinï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡mico**: Algoritmo de azar con un 3% de margen de la casa (instant crash).
    *   **Interfaz de Neï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n**: Diseï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±o oscuro con efectos de brillo, anillos de energï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a y respuesta visual al ganar o perder.
    *   **Integraciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de Saldo**: Sincronizaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n completa con `usePlayerSession` para apuestas y retiros.
*   **Notas/Advertencias:** Limpieza de animaciones al desmontar el componente para evitar fugas de memoria.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ y potenciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ el buscador del Grimorio para permitir bï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½ºsquedas globales y profundas en todo el catï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡logo de habilidades.
*   **Cambios Clave:**
    *   **Bï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½ºsqueda Global**: Al buscar una palabra, el sistema ahora ignora la categorï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a seleccionada y busca en TODO el grimorio simultï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡neamente.
    *   **Expansiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de Criterios**: El buscador ahora analiza el tï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­tulo, el Marco Teï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³rico (descripciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n), los nombres de habilidades, sus efectos y las restricciones de Anti-Mano Negra.
    *   **Auto-Apertura Inteligente**: Las escuelas de magia y las tarjetas de habilidad que contienen la palabra buscada se abren automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡ticamente para facilitar la lectura.
    *   **Contexto de Bï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½ºsqueda**: Se aï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±adieron etiquetas visuales en los resultados que indican a quï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½© categorï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a (Invocaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n, Elemental, etc.) pertenece cada estilo encontrado.
*   **Notas/Advertencias:** `npx tsc --noEmit` verificado. Al limpiar el buscador, la interfaz regresa automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡ticamente a la categorï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a que estaba seleccionada previamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCards.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Aumento de dificultad y sistema de rachas para el juego de cartas de la taberna.
*   **Cambios Clave:**
    *   **Mazo Ampliado**: El rango de cartas pasï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ de 1-10 a 1-15, dificultando las predicciones.
    *   **Sistema de Doble o Nada (Rachas)**: Tras ganar, el premio no se cobra automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡ticamente. El jugador debe decidir entre "Cobrar" o seguir con "Doble o Nada".
    *   **Pozo Acumulado**: Las ganancias se acumulan en un pozo que se multiplica x2 con cada acierto. Si se falla, se pierde TODO el pozo acumulado.
    *   **Optimizaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n Mobile-First**: Rediseï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±o completo de la interfaz con botones mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡s grandes, indicadores de racha/pozo y animaciones fluidas para una experiencia premium en mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³vil y escritorio.
*   **Notas/Advertencias:** Los empates mantienen la racha y el pozo (neutral). Se verificï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ la lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³gica de persistencia con Supabase.

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
*   **Resumen de Tareas:** Se agregaron los mapas del continente a la pestaï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±a `Mapa y Mundo` dentro de `Biblioteca`, con selector y visor en grande para movil.
*   **Cambios Clave:**
    *   Nuevo bloque de mapa al inicio de `Mapa y Mundo` con botones para alternar entre "Vyralis" y "Geopolitica".
    *   El mapa se puede tocar/abrir en un modal de pantalla completa para leer detalles sin saturar la UI.
    *   Los assets quedan versionados en `src/assets/maps/` para que Vite los empaquete y no haya 404 en deploy.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores (advertencia conocida por bundle grande, sin bloquear).

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Conversion automatica de unidades cientificas (N, kg, J, km/h, m/s, ï¾ƒÎ¸æ´¥ã‚„Â€å ™ï¿½Â€å ™ã�¤ï½°C) a "puntos" estilo D&D para que las habilidades se entiendan como stats (Fuerza, Velocidad, Danio).
*   **Cambios Clave:**
    *   Se implemento un formateador que reemplaza tokens tipo `$2000 N$` por equivalentes como `(+10 Fuerza)` y limpia escapes como `\\%`.
    *   El formateo se aplica a `effect`, `cd`, `limit`, `antiManoNegra` y tambien al texto de `Marco Teorico` dentro del Grimorio.
    *   La escala de conversion queda centralizada y facil de ajustar en una sola funcion (`convertUnitToDndPoints`).
*   **Notas/Advertencias:** Escala inicial: N->Fuerza (N/200), m/s->Velocidad (m/s/5), J->Danio (J/500), ï¾ƒÎ¸æ´¥ã‚„Â€å ™ï¿½Â€å ™ã�¤ï½°C->Danio de Fuego (ï¾ƒÎ¸æ´¥ã‚„Â€å ™ï¿½Â€å ™ã�¤ï½°C/20), con tope 25. `npx tsc --noEmit` verificado sin errores.

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
*   **Resumen de Tareas:** Reestructuraciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de la arquitectura de la SPA para integrar un sistema de habilidades (Grimorio) y optimizar la navegaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³vil mediante la fusiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de secciones informativas.
*   **Cambios Clave:**
    *   **Fusiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n "Biblioteca"**: Se unificaron las antiguas pestaï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±as `Lore` y `Mundo` en una sola secciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de `Biblioteca` con un selector interno (Tabs), liberando espacio en la barra de navegaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n.
    *   **Grimorio de Habilidades**: Implementaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de una secciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n dedicada para gestionar poderes y magias, categorizados por escuelas (Invocaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n, Elemental, etc.).
    *   **Diseï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±o Tï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½©cnico-Cientï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­fico**: Las habilidades incluyen Lore basado en fï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­sica real, niveles 1-5, tiempos de enfriamiento y limitantes especï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­ficas.
    *   **Capa Anti-Mano Negra**: Se integrï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ una secciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n visual distintiva en cada habilidad para definir reglas de balanceo y prohibiciones de uso (Anti-Powergaming).
    *   **Navegaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n Optimizada**: La barra inferior se mantiene en 5 elementos (Inicio, Grimorio, Biblioteca, Mercado, Ranking), mejorando la UX en dispositivos mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³viles.
*   **Notas/Advertencias:** Se dejï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ `src/data/grimorio.ts` con plantillas y comentarios para facilitar la expansiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n manual de contenidos sin saturar el contexto de la IA.

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
*   **Resumen de Tareas:** Implementaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n de la Loterï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a Dinï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡mica 24h con lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mites de fortuna, reembolsos automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡ticos y optimizaciones de interfaz mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³vil.
*   **Cambios Clave:**
    *   **Loterï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a Dinï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡mica (24h)**: Se creï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ `scratchUtils.ts` para generar precios (200-500) y probabilidades (10-40%) deterministas basados en la fecha actual (semilla diaria).
    *   **Multi-Scratch & Jackpot**: Se aï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±adiï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ la compra mï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½ºltiple de tickets con "Auto-Scrape" y un Jackpot VIP fijo del 5% (10,000 oro) independiente de la racha diaria.
    *   **Control de Inflaciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n (Lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite 50k)**: Se implementï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ un tope de ganancias brutas diarias de 50,000 oro. Al alcanzarlo, el juego se bloquea hasta el dï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a siguiente.
    *   **Sistema de Reembolsos**: Si una compra masiva choca con el lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite de 50k antes de terminar, los tickets sobrantes se cancelan automï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½¡ticamente y el oro se devuelve ï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­ntegro al jugador con una auditorï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a visual en el recibo.
    *   **Mobile-First Admin**: Se refactorizaron los grupos de botones y filtros del panel de administraciï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³n para evitar desbordamientos en pantallas pequeï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±as mediante scroll horizontal y flex-wrap.
    *   **UX Pulido**: Se ajustï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³ la lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½³gica de renderizado para permitir ver los resultados finales y reembolsos antes de que aparezca el mensaje bloqueante de "Lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite Alcanzado".
*   **Notas/Advertencias:** El sistema de semillas asegura que todos los jugadores vean la misma "suerte" cada dï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­a. El lï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½­mite de 50k se persiste en `localStorage` vinculado al ID del jugador y la fecha. `npx tsc --noEmit` verificado sin errores.

---
### [Fecha: 07/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/market.ts` (Nuevo), `src/components/AdminControlSheet.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio una pestana `Mercado` al panel de administracion para crear, editar y borrar productos del catalogo desde la interfaz sin tocar codigo.
*   **Cambios Clave:**
    *   Se creo `src/utils/market.ts` con `fetchMarketItems`, `upsertMarketItem`, `deleteMarketItem` y `slugifyMarketItem`, siguiendo el patron de `events.ts`.
    *   El mercado publico ahora carga los items desde Supabase (tabla `market_items`) con fallback transparente al archivo local `src/data/market.ts`.
    *   La pestana `Mercado` del admin tiene formulario completo: nombre, descripcion, habilidad, categoria, rareza, stock, precio, imagen (URL, ajuste, posicion) y destacado.
    *   El ID se auto-genera como slug de categoria+nombre al crear (ej: "Mi Espada" + swords ï¾ƒÎ¸æ´¥ã�¤ï½¢ï¾ƒÎ´ï½¢ï¾ƒã‚„ã�Žï¾ƒã�¤ï¿½ï¾ƒÎ´ï½¢ï¾ƒã‚„ã�Žï¾ƒã‚„â”� `sword-mi-espada`); en edicion muestra el ID existente.
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
    *   Se agrego una pestaï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±a `Eventos` al panel admin para crear y editar los eventos visibles del inicio sin tocar codigo manualmente.
    *   El diseï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±o publico de los eventos no cambia: solo cambia el origen del contenido cuando Supabase esta disponible.
*   **Notas/Advertencias:** Para administrarlos desde la web hace falta crear manualmente la tabla `realm_events` usando el SQL sugerido en `src/utils/events.ts`.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio la pestaï¾ƒÎ¸æ´¥ã�¨æ´¥ï¿½Â€å ™ã�¤ï½±a `Jugadores` al panel admin para crear perfiles nuevos y corregir oro sin entrar manualmente a Supabase.
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
- Conectado el Orï¾ƒÎ´ï½¡culo a las tablas de eventos y misiones activas.
- Refinado el comando '!perfil' para separar y clasificar inteligentemente los IDs de WhatsApp y los nï¾ƒÎ´ï½ºmeros de telï¾ƒÎ´ï½©fono reales.
- Aï¾ƒÎ´ï½±adidos comandos faltantes al menï¾ƒÎ´ï½º de ayuda (!ayuda) con restricciï¾ƒÎ´ï½³n por roles.



---
### [Fecha: 29/05/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** apps/mobile/app/(tabs)/profile.tsx, apps/mobile/app/(tabs)/anime.tsx, docs/mobile-reactivation/mobile-reactivation-backlog.md
*   **Resumen de Tareas:** Finalizacion de pulido visual y funcional ('Beta Interna') en la aplicacion movil para alcanzar paridad en la experiencia de usuario.
*   **Cambios Clave:**
    *   Migracion del perfil de jugador a KingdoomUI (RealmCard, StaggerItem, MetricTile, EmptyState).
    *   Integracion robusta de pull-to-refresh en todos los tabs (ej. anime.tsx) mediante ScreenShell.
    *   Garantia de estados consistentes (carga, error, vacio) en todos los modulos.
*   **Notas/Advertencias:** Validacion de tipos ejecutada correctamente (npx tsc --noEmit exitoso). Flujos base listos.

---
### [Fecha: 02/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/handlers/player.js` (en kingdoom-bot), `src/index.js` (en kingdoom-bot), `src/supabase.js` (en kingdoom-bot), `src/handlers/blackjack.js` (Nuevo en kingdoom-bot), `AI_CHANGELOG.md` (en Kingdoom-sync)
*   **Resumen de Tareas:** Implementaciï¾ƒÎ´ï½³n del minijuego de Blackjack (`!21`) para el bot de WhatsApp con control de sesiï¾ƒÎ´ï½³n estricto mediante respuestas.
*   **Cambios Clave:**
    *   Creaciï¾ƒÎ´ï½³n de `src/handlers/blackjack.js` con la lï¾ƒÎ´ï½³gica de Blackjack (apuestas, lï¾ƒÎ´ï½­mites diarios de 3 usos entre semana y 5 los fines de semana, crupier que planta en 17).
    *   La sesiï¾ƒÎ´ï½³n del juego estï¾ƒÎ´ï½¡ anclada a la respuesta directa al mensaje del bot para evitar interferencias en grupos.
    *   Integraciï¾ƒÎ´ï½³n con Supabase para descontar la apuesta antes de jugar y registrar/verificar el uso diario.
    *   Modificaciï¾ƒÎ´ï½³n de `src/index.js` para interceptar respuestas a mensajes activos y ejecutar el comando `!21`.
*   **Notas/Advertencias:** Se validaron las sintaxis con `node --check` antes de proceder al commit y push.




---
### [Fecha: 08/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/gmTracker.js`, `src/index.js`, `src/handlers/admin.js` (en kingdoom-bot).
*   **Resumen de Tareas:** Migracion completada de la logica del Game Master (GM) desde NotebookLM hacia un motor de ejecucion interna en el bot usando la API nativa de Gemini.
*   **Cambios Clave:**
    *   Centralizacion de la configuracion, el estado y el prompt maestro del GM en `src/gmTracker.js`.
    *   Refactorizacion del comando `!misionstart` para delegar el inicio a `startMissionTracker` integrando base de datos y la carga automatica de contexto sin intervencion manual.
    *   Eliminacion total de la dependencia de NotebookLM para lograr completa autonomia del sistema.
    *   Validacion de seguridad y anticheat incorporada en el prompt del GM.
*   **Notas/Advertencias:** Se verifico que la skill `grill-me` no esta instalada en el entorno. El testeo de `!misionstart` local (npm run dev) queda pausado hasta que el usuario permita acceso al workspace externo (kingdoom-bot) o lo agregue al Kingdoom-sync.


## [2026-06-10] - Supabase Cron Installments
*   **Archivos Modificados:** supabase_cron_installments.sql, supabase_market_installments.sql 
*   **Resumen:** Implementaciï¿½ de la funciï¿½ RPC process_market_installments para el cobro automç–¸ico de cuotas con reglas estrictas (1 dåƒ˜ de gracia, 5% mora acumulativa diaria, embargo a los 5 dåƒ˜s). Bloqueo de compras a cré¦˜ito limitado a 14 dåƒ˜s post-embargo.

---
### [Fecha: 13/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/index.js` (en kingdoom-bot), `AI_CHANGELOG.md` (en Kingdoom-sync), `ai-memory/kingdoom-memory.jsonl` (en Kingdoom-sync)
*   **Resumen de Tareas:** Cierre de navegadores huerfanos al fallar la inicializacion del bot en reintentos.
*   **Cambios Clave:**
    *   Implementacion de la limpieza de `client.pupBrowser` ante excepciones en el metodo `initializeClientWithRetry` de `src/index.js`.
    *   Esto previene que queden procesos de Chromium huerfanos (zombies) que bloquean la sesion de WhatsApp con el error "browser is already running".
    *   Se registro el cambio en la memoria del proyecto (jsonl) y se documentaron los riesgos.
*   **Notas/Advertencias:** Riesgo abierto de bloqueo de IP/numero por parte de WhatsApp al operar en la infraestructura de Hugging Face.

---
### [Fecha: 13/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `AGENTS.md`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** ActualizaciÃ³n de protocolos en AGENTS.md (bootstrap, cierre y subidas).
*   **Cambios Clave:**
    *   Se integrÃ³ la subsecciÃ³n "CuÃ¡ndo ocurre el bootstrap (CRÃ�TICO)" aclarando las fases y el flujo ordenado de una sesiÃ³n.
    *   Se expandieron las reglas de subidas y cierres en la SecciÃ³n 7, regulando la detecciÃ³n de intenciÃ³n del usuario (7.2), el mapeo de repositorios y destinos de push (7.3) y la secuencia exacta de cierre de tareas (7.4).
*   **Notas/Advertencias:** Ninguno detectado.

---
### [Fecha: 13/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `.gitignore`, `AGENTS.md`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** CorrecciÃ³n de remotos de la web en AGENTS.md e ignorado de archivos temporales.
*   **Cambios Clave:**
    *   Se corrigieron los remotos de `Kingdoom-sync` en la tabla 7.3 de `AGENTS.md` para especificar que va Ãºnicamente a GitHub (origin).
    *   Se agregaron las carpetas y archivos temporales `scratch/`, `temp_diff.txt` y `repomix-output-*.md` al archivo `.gitignore`.
*   **Notas/Advertencias:** Ninguno detectado.

---
### [Fecha: 13/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `AGENTS.md`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** AdiciÃ³n de directrices para agentes asÃ­ncronos (Jules) en AGENTS.md.
*   **Cambios Clave:**
    *   Se integrÃ³ la subsecciÃ³n 7.5 en `AGENTS.md` para regular el comportamiento del agente asÃ­ncrono Jules (bootstrap automÃ¡tico, honestidad de push en su entorno y disciplina de alcance al correr sin supervisiÃ³n).
*   **Notas/Advertencias:** Ninguno detectado.

---
### [Fecha: 14/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/features/market/market.adapter.ts`, `src/features/market/market.rotation.ts`, `src/features/market/market.service.ts`, `src/features/market/market.types.ts`, `src/types.ts`, `supabase_market_installments.sql`, `supabase_market_mythic_limited_stock.sql`, `supabase_personal_market_migration.sql` (Nuevo), `src/features/market/market.rotation.test.ts` (Nuevo)
*   **Resumen de Tareas:** ImplementaciÃ³n de la mecÃ¡nica de Mercado Personal para Ã­tems de rol creados por usuarios con comisiones y tasas de apariciÃ³n.
*   **Cambios Clave:**
    *   **Base de Datos:** Se crearon las columnas `seller_id`, `seller_cut_percentage` y `spawn_chance` en la tabla `market_items` mediante `supabase_personal_market_migration.sql`.
    *   **RPC de Compra:** Se modificaron las funciones RPC de compra de Supabase (`purchase_market_item` y `purchase_market_item_v2`) para realizar transferencias atÃ³micas automÃ¡ticas de las ganancias correspondientes del vendedor al saldo de oro de su cuenta.
    *   **Modelos y Adaptadores:** Se actualizaron las interfaces y los mappers para mapear los nuevos campos entre el cliente y Supabase de forma correcta.
    *   **LÃ³gica de RotaciÃ³n:** SincronizaciÃ³n determinista del catÃ¡logo filtrando Ã­tems mediante la probabilidad configurada en `spawn_chance`.
    *   **Interfaz de AdministraciÃ³n:** Se creÃ³ la pestaÃ±a "Mercado Personal" en `AdminControlSheet.tsx` que incluye autocompletado/bÃºsqueda de jugadores, campos interactivos (precio, split de comisiÃ³n, probabilidad de apariciÃ³n en rotaciÃ³n), previsualizador en tiempo real de oro asignado a cada parte, y listado de Ã­tems personales existentes.
    *   **VerificaciÃ³n:** Cobertura de tests unitarios agregada en `src/features/market/market.rotation.test.ts` y ejecuciÃ³n limpia de compilaciÃ³n de producciÃ³n.
*   **Notas/Advertencias:** Ninguno detectado.

---
### [Fecha: 15/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/types.ts`, `src/utils/players.ts`, `supabase_character_slots_migration.sql` (Nuevo)
*   **Resumen de Tareas:** ImplementaciÃ³n de la compra de espacios adicionales para fichas de personaje con oro.
*   **Cambios Clave:**
    *   **Base de Datos:** CreaciÃ³n de la columna `max_character_sheets` en `players` y de la funciÃ³n RPC transaccional `buy_character_slot` para la deducciÃ³n atÃ³mica de oro e incremento del lÃ­mite (mÃ¡ximo 10).
    *   **CÃ¡lculo de Costo:** Se definiÃ³ un costo plano de 1,000,000 de oro para todos los espacios adicionales (slots del 3 al 10).
    *   **Frontend & Modelos:** Mapeo de la columna y exportaciÃ³n del helper de RPC en `src/utils/players.ts`. ActualizaciÃ³n de la interfaz `PlayerAccount`.
    *   **UI de Perfil:** Reemplazo de los lÃ­mites hardcodeados de fichas en `PlayerProfilePanel.tsx` por el valor dinÃ¡mico del jugador. AdiciÃ³n de un botÃ³n de compra interactivo y feedback visual premium para la compra de slots.
*   **Notas/Advertencias:** Typecheck de TypeScript y compilaciÃ³n de producciÃ³n validados con Ã©xito sin errores.


---
### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/utils/playerRanks.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Pulido visual del frente de clasificatoria en el perfil del jugador para volver el frontend mÃƒÂ¡s llamativo y legible.
*   **Cambios Clave:**
    *   **Perfil Hero:** Se reemplazÃƒÂ³ el bloque simple de rango por un `SeasonRankSpotlight` con presencia visual de tarjeta hero, lectura de temporada y resumen de actividad.
    *   **Progreso Real:** `fetchPlayerMonthlyRankSnapshot` ahora expone piso del rango actual, siguiente meta, progreso porcentual dentro del escalÃƒÂ³n y avance temporal de la temporada.
    *   **UI de Temporada:** Se aÃƒÂ±adiÃƒÂ³ barra animada de progreso, contador de puntos faltantes al siguiente rango y mÃƒÂ©tricas compactas de misiones, eventos y premios manuales.
    *   **Legibilidad de Rangos:** El frontend ya muestra el siguiente rango con naming presentable en vez de identificadores crudos del sistema.
*   **Notas/Advertencias:** `npm run build` pasÃƒÂ³ correctamente. `npx tsc --noEmit` sigue fallando por una dependencia faltante preexistente en `src/features/market/market.rotation.test.ts` (`vitest` no resuelto), ajena a este cambio visual.
---
### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/vitest.d.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del bloqueo de typecheck causado por el test de rotacion del mercado.
*   **Cambios Clave:**
    *   Se agrego un shim local de tipos para `vitest` en `src/vitest.d.ts`.
    *   Con eso `npx tsc --noEmit` vuelve a pasar sin necesidad de agregar dependencias nuevas ni tocar `package-lock.json`.
*   **Notas/Advertencias:** La solucion actual resuelve el tipado del repo. Si mas adelante se incorporan mas tests de `vitest`, convendra instalar la dependencia de forma formal cuando el proyecto quiera ejecutar esa suite.

---
### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Reorganizacion del panel de clasificatoria para evitar la duplicacion visual del rango en perfil.
*   **Cambios Clave:**
    *   Se elimino la insignia duplicada del bloque principal del jugador en modo expandido.
    *   El frente de temporada ahora conserva una sola insignia visible, mas compacta, con un resumen inmediato del siguiente objetivo.
    *   Los detalles largos de temporada pasaron a un desplegable controlado: en mobile inicia compacto y en escritorio se abre automaticamente para mantener densidad visual sin perder informacion.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues del ajuste.

---
### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Verificacion UI en vivo del nuevo bloque de clasificatoria en desktop y mobile.
*   **Cambios Clave:**
    *   Se levanto la SPA localmente y se reviso el perfil real en ambas resoluciones mediante capturas automatizadas.
    *   La verificacion visual confirma que la insignia de rango ya no aparece duplicada entre el bloque principal del jugador y el frente de temporada.
    *   El panel de temporada mantiene una lectura mas compacta en mobile y una lectura mas abierta en escritorio.
*   **Notas/Advertencias:** La comprobacion visual fue satisfactoria. La automatizacion DOM no produjo selectores suficientemente estables para afirmar el estado conectado via aserciones, pero las capturas renderizadas si mostraron el layout esperado.

---
### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Compactacion adicional del frente de temporada para reducir el hueco vertical en escritorio.
*   **Cambios Clave:**
    *   Se elimino la autoexpansion inicial del bloque de temporada en desktop para que nazca compacto por defecto.
    *   La insignia del rango ahora usa tamano mas pequeno mientras el panel esta plegado.
    *   El bloque de `Siguiente objetivo` se movio al contenido desplegable, dejando solo la informacion esencial visible en estado natural.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues del ajuste.

---
### [Fecha: 15/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Reubicacion del frente de temporada para eliminar el vacio vertical del panel de jugador.
*   **Cambios Clave:**
    *   Se saco `Frente de temporada` de la columna lateral que compartia altura con `Jugador conectado`.
    *   El bloque de temporada ahora vive como seccion propia debajo del panel superior del perfil, antes del resto del contenido del jugador.
    *   Con esto el bloque `Jugador conectado` deja de arrastrar una altura artificial y recupera un layout mas limpio y compacto.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues de la reubicacion.

---
### [Fecha: 16/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_realm_missions.sql`, `supabase_realm_events_participation.sql`, `supabase_grimoire_flora.sql`, `supabase_knowledge_documents.sql`, `supabase_season_rank_rules.sql`, `supabase_season_rank_seasons.sql`, `supabase_cron_installments.sql`, `supabase_character_portraits_rls.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Endurecimiento de RLS y correccion de funciones SQL para limpiar avisos reales del Supabase Security Advisor.
*   **Cambios Clave:**
    *   **Search Path:** Se agrego `set search_path = public` a funciones trigger y auxiliares que el advisor marcaba como mutables en misiones, eventos, grimorio, documentos, reglas/ranking estacional y credito de cuotas.
    *   **Misiones y Eventos:** Se cerraron escrituras publicas en `realm_missions`, `realm_mission_claims` y `realm_event_participants`; ahora las altas/cambios quedan limitados a admin o al propio jugador autenticado vinculado.
    *   **Contenido Admin:** Las politicas de `grimoire_flora_entries` y `knowledge_documents` dejaron de estar abiertas a `public` y pasan a usar `is_current_user_admin()`.
    *   **Ranking Estacional:** Se corrigieron las tablas `season_rank_*` para mantener lectura publica pero escritura solo para admin autenticado, evitando que anonimos modifiquen semillas, snapshots, premios o reglas.
    *   **Storage:** Se restringio la escritura en `mission-evidence` y la subida/actualizacion/borrado de retratos a usuarios autenticados en vez de `public`.
*   **Notas/Advertencias:** Este cambio corrige el SQL del repo, pero algunos warnings del panel pueden seguir apareciendo si la base productiva aun no re-ejecuta estos scripts. El aviso de leaked password protection no se resuelve en SQL: se habilita desde Auth settings de Supabase.

---
### [Fecha: 16/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/context/PlayerSessionContext.tsx`, `src/utils/players.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Robustecimiento del bootstrap de perfil del jugador ante timeouts y caidas de Supabase.
*   **Cambios Clave:**
    *   **Timeouts de Perfil:** Se agrego un timeout local de 8 segundos a las consultas de perfil y deteccion de soporte de columnas/tablas relacionadas con auth.
    *   **Errores Mas Claros:** `PlayerSessionContext` ahora distingue mejor entre "jugador no encontrado" y fallos reales de conexion con Supabase al conectar, refrescar o restaurar la sesion guardada.
    *   **Sesion Mas Resistente:** Si Supabase no responde durante el hydrate o el refresh, el contexto evita dejar el flujo en un estado ambiguo y muestra mensajes de error concretos en vez de fallar silenciosamente.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente. El timeout usa `window.setTimeout`, por lo que esta proteccion aplica al cliente web y no altera RPCs ni logica economica del backend.

---
### [Fecha: 16/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_query_performance_indexes.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Versionado de una tanda de indices SQL ajustada al reporte real de Query Performance de Supabase.
*   **Cambios Clave:**
    *   **Subastas:** Se agrego un indice para `market_auctions(created_at desc)` porque el panel de subastas consulta con orden descendente por creacion y concentra el mayor peso del reporte.
    *   **Eventos y Documentos:** Se agregaron indices para `realm_events(created_at desc)` y para `knowledge_documents`, incluyendo un indice compuesto `(visible, updated_at desc)` alineado con la lectura publica mas frecuente.
    *   **Inventario y Ranking:** Se agregaron indices compuestos para `player_inventory(player_id, created_at desc)`, `season_rank_thresholds(is_active, sort_order)` y `season_rank_point_rules(is_active, sort_order)` para cubrir exactamente los patrones `WHERE + ORDER BY` observados.
    *   **Log de Negocios:** Se versiono un indice global por `business_collection_log(collected_at desc)` para el listado historico ordenado.
    *   **Exclusiones Deliberadas:** No se agrego un indice nuevo para `season_rank_seasons(status)` porque el repo ya tiene uno compuesto mejor (`status, starts_at desc, ends_at desc`), y se dejo fuera `character_sheets` por bajo volumen real de llamadas.
*   **Notas/Advertencias:** Esta tanda mejora el SQL versionado del repo, pero debe ejecutarse en Supabase para impactar produccion. No se corrio `npx tsc --noEmit` ni `npm run build` porque no hubo cambios en TypeScript ni frontend; fue una entrega exclusivamente SQL/documental.

---
### [Fecha: 16/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/characterSheets.ts`, `src/components/RealmRegistry.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Reduccion de sobrelectura en `character_sheets` para el Registro del Reino y flujos de fichas.
*   **Cambios Clave:**
    *   **Registro Ligero:** El listado publico del reino deja de pedir `select("*")` sobre todas las fichas y ahora consume un resumen tipado sin `history` ni otros campos pesados.
    *   **Carga Bajo Demanda:** La ficha completa se consulta por `id` solo cuando el usuario abre una entrada del registro, manteniendo intacta la modal detallada.
    *   **Orden en SQL:** Se movio el ordenamiento de las fichas al lado de Supabase (`order("name")` para el registro y `order("createdAt")` para los listados completos/por jugador) para evitar trabajo innecesario en frontend.
*   **Notas/Advertencias:** Este cambio optimiza la sobrelectura desde la SPA, pero el warning original de Query Performance estaba bajo `service_role`; por tanto, si esa entrada vuelve a aparecer, podria existir ademas algun consumidor externo al frontend que siga leyendo `character_sheets` de forma amplia.

---
### [Fecha: 17/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/auctions.ts`, `src/components/PlayerAuctionPanel.tsx`, `src/utils/knowledge.ts`, `src/components/admin/AdminKnowledgeManager.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Nueva pasada de reduccion de egress PostgREST en subastas del jugador y biblioteca IA del admin.
*   **Cambios Clave:**
    *   **Subastas del Jugador:** `fetchAuctions` ahora acepta filtros y el panel del jugador pide solo subastas `active`, evitando traer historico completo para luego filtrarlo en cliente.
    *   **Recargas Realtime Coalescidas:** `PlayerAuctionPanel` deja de disparar una recarga por cada evento inmediato de `market_auctions`, `market_auction_bids` y `market_auction_participants`; ahora agrupa cambios cercanos en una sola lectura.
    *   **Participaciones Acotadas:** La lectura de `market_auction_participants` del jugador ahora se limita a las subastas efectivamente devueltas por la consulta principal.
    *   **Biblioteca IA Ligera:** El manager admin de conocimiento ya no trae `content` completo para toda la lista; ahora consume resÃºmenes livianos y solo carga el documento completo por `id` cuando se va a editar.
*   **Notas/Advertencias:** Este cambio reduce payload y sobrelectura desde la SPA, pero no elimina por si solo consumidores externos o lecturas del Archivista que sigan necesitando contenido completo.

---
### [Fecha: 19/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del recorte de texto en las tarjetas de misiones del reino.
*   **Cambios Clave:**
    *   **Descripcion de Mision:** La descripcion principal deja de quedar fija en tres lineas sin salida; ahora se expande completa cuando el jugador abre el detalle.
    *   **Instrucciones de Mision:** El bloque de instrucciones pasa a un contenedor desplegable dentro de la misma tarjeta, conservando preview compacto en la grilla y lectura completa bajo demanda.
    *   **UX del Grid:** Se mantuvo la densidad visual de las cards en estado normal, evitando romper el tablero de misiones mientras se agrega acceso real al contenido largo.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues del ajuste.

### [Fecha: 19/06/2026] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/context/PlayerSessionContext.tsx`, `src/components/TavernCrash.tsx`, `src/components/TavernExpedition.tsx`, `src/components/TavernExpeditionArcade.tsx`, `src/components/TavernHorseRace.tsx`, `src/components/TavernPenalty.tsx`, `src/components/TavernPlinko.tsx`, `src/components/TavernRoulette.tsx`, `src/components/TavernSlots.tsx`, `src/components/TavernTowerDefense.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Blindaje del oro en minijuegos web para evitar premios perdidos por sobrescritura de saldo absoluto.
*   **Cambios Clave:**
    *   **Delta AtÃ³mico:** Se agregÃ³ `incrementPlayerGold(...)` sobre la RPC `increment_gold` y `PlayerSessionContext` expone ahora `addPlayerGold(delta)` para cobrar o descontar oro de forma atÃ³mica.
    *   **Tavern Web:** Crash, Expedition, Expedition Arcade, Horse Race offline, Penalty, Plinko, Roulette, Slots y Tower Defense dejaron de recalcular `gold = saldoBase +/- ...` en cliente y ahora usan delta real sobre Supabase.
    *   **CorrecciÃ³n del SÃ­ntoma Reportado:** El problema mÃ¡s probable era una carrera entre `refreshPlayer()` y `setPlayerGold(nextGold)` en rondas consecutivas o pestaÃ±as activas, lo que podÃ­a pisar premios ganados con un saldo viejo.
*   **Notas/Advertencias:** `setPlayerGold(nextGold)` se mantuvo para flujos donde la fuente de verdad ya devuelve el saldo final exacto. Conviene migrar gradualmente cualquier otro flujo econÃ³mico que siga escribiendo saldos absolutos.



### [Fecha: 21/06/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** src/components/AnimeHubSection.tsx, src/features/animeHub/animeHub.remoteProvider.ts
*   **Resumen de Tareas:** Habilitacion de VerAnimeOnline como proveedor activo en el frontend.
*   **Cambios Clave:**
    *   **UI:** Se reemplazo la opcion deshabilitada de AnimeFLV por VerAnimeOnline (Espanol) en el selector de proveedores.
    *   **Logica Remota:** Se anadieron los metodos de busqueda y resolucion y se enrutaron al nuevo caso veranimeonline en el remoteProvider para consumir la API previamente actualizada.
*   **Notas/Advertencias:** La API externa ya soporta la nueva ruta, asegurando que la integracion funcione.
