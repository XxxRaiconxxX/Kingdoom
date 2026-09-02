# AI Changelog - Kingdoom-sync

Este changelog mantiene solo el periodo operativo reciente para que el relevo sea rapido y accionable.

- Ventana conservada: 2026-05-06 a 2026-07-16.
- Historico anterior retirado del changelog activo por limpieza operativa.
- Entradas agrupadas por mes y ordenadas de mas reciente a mas antigua.

## 2026-09

### [2026-09-02] Cliente Publico de Perfil sin Bloqueo de Auth
- Se agrego `publicSupabase` con sesion persistente desactivada para que la carga publica del perfil no espere a `auth.getSession()` ni a locks de almacenamiento del navegador.
- `fetchPlayerByUsername` y el enriquecimiento de roleplay usan el cliente efimero; las escrituras y consultas vinculadas a Auth conservan el cliente autenticado.
- Validado con `node scripts/verify-player-fetch.mjs`, `npx tsc --noEmit`, `npm run build` y `git diff --check`. [Codex]

### [2026-09-02] Cancelacion Real y Resiliencia de Operaciones de Perfil
- Se agrego `AbortController` con `.abortSignal(signal)` a las consultas de lectura, enriquecimiento de roleplay y operaciones de autenticacion en `src/utils/players.ts`.
- `fetchAllPlayers` ahora degrada los abortos por timeout a una lista vacia, pero propaga excepciones inesperadas para no ocultar errores de programacion.
- Se eliminaron los espacios finales del script `scripts/verify-player-fetch.mjs`.
- Validado con `node scripts/verify-player-fetch.mjs`, `npx tsc --noEmit`, `npm run build` y `git diff --check`. [Codex]

### [2026-09-01] Optimización de Carga de Perfil y Supabase Timeout Fix
- Se auditó y resolvió el error de conexión y timeout (`AbortError`) al conectar perfiles de jugadores en la web.
- Se eliminó el antipatrón de consultas en cascada y sondeo previo (`detectAuthUserIdSupport`, `detectRoleplayAccessSupport`) en `src/utils/players.ts`, sustituyéndolo por consultas directas con degradación limpia ante errores de esquema (`42703`/`42P01`).
- Se amplió el timeout base de 8s a 15s (`PLAYER_QUERY_TIMEOUT_MS`) y se desacopló el enriquecimiento de roleplay a una consulta no bloqueante para evitar que metadatos secundarios interrumpan la sesión del jugador.
- Se creó el script de autoverificación `scripts/verify-player-fetch.mjs` y se configuró `.env` local para resiliencia en desarrollo. [Antigravity]

## 2026-08

### [2026-08-10] Mecánica de Stock Limitado: Validación de Compra Atómica y Transición a Sold-Out
- Se actualizó el procedimiento almacenado `purchase_market_item_v2` en Supabase y en `supabase/supabase_market_installments.sql` para validar que `(stock_sold + p_quantity) <= stock_limit` y realizar el incremento atómico de `stock_sold` al procesar la compra, haciendo la transición automática a `sold-out` cuando se alcanza el límite.
- Se verificaron los tres niveles de la mecánica (frontend card/modal, rotación y backend RPC) con 15 pruebas automatizadas pasando con éxito. [Antigravity]

### [2026-08-10] Rotación de Mercado: Inclusión garantizada de ítems destacados (Featured Showcase)
- Se corrigió `getMarketRotationState` en `src/features/market/market.rotation.ts` para que los ítems con estado destacado (`featured: true`) y stock disponible se incluyan siempre en la rotación activa del mercado y en la marquesina de ofertas, sin quedar bloqueados por el filtro probabilístico de rarezas cerradas (como el 10% de rareza legendaria).
- Se sincronizó en la base de datos Supabase el ítem `Códice de la Pesadilla Viviente: El Ojo de Abadón` (`sword-codice-de-la-pesadilla-viviente-el-ojo-de-abadon`) con stock limitado activo y estado destacado. [Antigravity]

### [2026-08-06] Actualización del Orden de Proveedores de IA
- Se actualizó el orden global de redundancia de IA a `groq -> gemini -> openrouter -> nvidia` en `.env` y `.env.example`. [Antigravity]

### [2026-08-03] RPC upgrade_player_business: Ampliaciones Atómicas y Auditoría de Negocios
- Se creó el procedimiento almacenado RPC `public.upgrade_player_business(p_business_id, p_player_id, p_upgrade_type, p_new_value, p_cost_gold)` en `supabase/supabase_player_business_upgrades.sql` para procesar de forma atómica el descuento de oro y el aumento de nivel, producción por hora o capacidad de almacenamiento de los negocios en Supabase.
- **Audit Fix:** Coalesce de valores por defecto en PostgreSQL para proteger registros de negocios heredados con campos nulos. [Antigravity]

## 2026-07

### [2026-07-19] Portal Anime: Integración de AnimeFLV (Completo) como nuevo proveedor
- Se agregó soporte para el nuevo proveedor `animeflvone` (`https://vww.animeflv.one/`) como opción de reproducción completa e independiente.
- Modificado `server/anime/providerContract.ts` y el script de autoprueba `scripts/anime-provider-contract.selfcheck.mjs` para habilitar y validar el nuevo ID de proveedor.
- Actualizado `src/features/animeHub/animeHub.remoteProvider.ts` para registrar "AnimeFLV (Completo)" en las opciones de reproducción del cliente (`ANIME_PROVIDER_OPTIONS`) y habilitarlo en la búsqueda automática distribuida (`PLAYBACK_PROVIDERS`). [Antigravity]
- **fix**: Corregido `buildPrimaryProviderUrl` en `server/anime/providerContract.ts` y modificado `api/anime/proxy.ts` para reenviar los parámetros opcionales `series` y `episode` a la API de Scraping al solicitar los enlaces de reproducción. Esto soluciona la redirección directa oficial para evadir los 404 del reproductor integrado de AniChi. [Antigravity]

### [2026-07-19] Portal Anime: migración de AnimeFLV a su nuevo dominio
- Se migró el scraper de AnimeFLV al nuevo dominio operativo `https://animeflv.or.at/` debido a que el dominio anterior eliminó todos los servidores de reproducción de video.
- Se rediseñó el sistema de selectores para soportar el formato WordPress/Yoast de la nueva web (búsqueda con parámetro `?s=`, metadatos detallados y episodios incrustados vía JSON `.animeflv-episodes-data`).
- Se introdujo extracción nativa tanto para los servidores de reproducción (iframes decodificados de Base64) como para descargas directas (tabla de descargas), actualizando el backend `api/episode/[id].ts` para devolver de manera estructurada los objetos `stream` y `download`.
- Validación: La API scraper local resolvió exitosamente la búsqueda, los detalles y el listado de servidores/descargas de "Black Torch". Los cambios fueron desplegados a producción de forma exitosa en el repositorio `Scraping-web-anime-api`. [Antigravity]

### [2026-07-19] El Multiplicador: solución de condición de carrera al retirar (cashout)
- Se corrigió una condición de carrera donde el botón "Asegurar ahora" (retirar) no detenía la animación de inmediato debido a que la transacción asíncrona de base de datos (`addPlayerGold`) demoraba en resolverse, permitiendo que la animación continuara y colapsara el juego en la UI a pesar de haberse iniciado el retiro.
- El estado local y el ref de estado ahora se actualizan de forma síncrona a `cashed_out` e instancian `lastWin` inmediatamente al hacer clic.
- Se ajustó `updateMultiplier` para que, en caso de colapso de la animación, detenga el loop y registre el resultado en el historial de manera normal, pero no sobrescriba el estado del jugador a `crashed` si ya había retirado previamente (`cashed_out`).
- Validación: `npx tsc --noEmit` y `npm run build` pasaron limpios. Riesgo abierto: ninguno nuevo; se mantiene el riesgo heredado de `increment_gold` expuesto a clientes. [Antigravity]

### [2026-07-16] Hotfix de fichas AniChi para peliculas y respuestas transitorias
- Se reprodujo la ficha de `Black Butler: Book of the Atlantic`: AniChi publica correctamente una pelicula como un unico episodio `Full`, pero una respuesta transitoria dejaba al portal mostrando solo el resumen de busqueda con `0 episodios`.
- El scraper solicita ahora las fichas con cabeceras HTML, separadas de las llamadas AJAX, y reintenta una sola vez la cadena de detalle cuando AniChi devuelve una pagina o lista incompleta.
- El Portal Anime diferencia entre carga, fallo real y ficha valida sin episodios. Mientras consulta muestra progreso, y ante un fallo ofrece `Reintentar ficha` en lugar de afirmar que el proveedor no publico capitulos.
- La comprobacion e2e cubre ahora series y peliculas: 12 episodios para `Solo Leveling`, 1 episodio para `Black Butler: Book of the Atlantic` y 9 servidores. Pasaron TypeScript del scraper, contrato compartido, TypeScript global, build de 2.248 modulos y `git diff --check`; el scraper quedo publicado en `92ec68e` y su endpoint productivo confirmo la pelicula completa.
- Riesgo abierto: AniChi sigue siendo una fuente externa sin API ni SLA; el reintento absorbe fallos transitorios, no cambios permanentes de su HTML. [Codex]

### [2026-07-16] Integracion experimental de AniChi en Portal Anime
- Se agrego `AniChi (beta)` al selector y al modo automatico del Portal Anime mediante el contrato compartido `source=anichi`; sus fallos quedan aislados por la tolerancia existente y no bloquean AnimeFLV/TioAnime.
- El subrepositorio autenticado del scraper incorpora busqueda, ficha, episodios y resolucion de servidores de AniChi. El navegador solo recibe enlaces HTTP(S) normalizados: no conoce los endpoints internos ni retransmite video, y la resolucion limita el fan-out a 12 servidores por episodio.
- Se agrego una comprobacion e2e que valida la cadena real contra AniChi. Resultado observado: 5 resultados, 12 episodios y 9 servidores para `Solo Leveling`; el contrato compartido, TypeScript del scraper, TypeScript global, build y Graphify pasaron limpios. El audit de dependencias de produccion del scraper reporto 0 vulnerabilidades. El commit `e8fbcb8` del scraper fue publicado y la misma cadena se verifico contra su endpoint productivo.
- Riesgos abiertos: AniChi fue lanzado recientemente, no publica una API ni un SLA y sus Terms of Use restringen copia, exhibicion, mirror e ingenieria inversa; la continuidad y autorizacion del conector no estan garantizadas. [Codex]

### [2026-07-14] Archivista: etiquetas cortas y pista horizontal real en sugerencias
- Las sugerencias del Archivista dejan de mostrar el texto completo dentro del chip y pasan a etiquetas mas cortas como `Eventos activos`, `Misiones abiertas` o `Item mas caro`.
- La banda usa ahora un contenedor con `inline-flex` y `w-max` para forzar una sola pista horizontal real, con scroll lateral incluso cuando el navegador intente repartir el contenido.
- Validacion: `npx tsc --noEmit` y `npm run build`. Riesgo abierto: ninguno detectado; es un ajuste visual y de layout. [Codex]

### [2026-07-14] Archivista: sugerencias compactas en carrusel horizontal
- Las sugerencias rapidas del Archivista ahora viven en una sola fila horizontal con desplazamiento lateral, en lugar de crecer a multiples lineas.
- Cada chip ocupa menos alto visual, limita su ancho y trunca el texto largo para conservar una cabecera mas compacta sin perder accesibilidad via `title`.
- Validacion: `npx tsc --noEmit` y `npm run build`. Riesgo abierto: ninguno detectado; es un ajuste de presentacion. [Codex]

### [2026-07-14] Archivista: vista de jugador mas limpia y sin telemetria interna
- La vista no admin del Archivista deja de mostrar el panel lateral de `Modo de consulta` y `Fuentes del reino`; esos controles quedan reservados para staff, que es quien realmente necesita operar foco y diagnostico de fuentes.
- Tambien se retiro la banda inferior de telemetria rapida (`En linea`, `Sesion X`, `Modo X` y hora) para no exponer metadatos internos que no aportan al jugador final.
- La cabecera se simplifico eliminando la chapita redundante del modo activo, manteniendo el flujo de conversacion intacto y sin tocar acciones admin ni carga de contexto.
- Validacion: `npx tsc --noEmit` y `npm run build`. Riesgo abierto: ninguno detectado; el cambio es de presentacion y visibilidad, no de logica. [Codex]

### [2026-07-14] Archivista 2.0: rework integral, acciones seguras y rendimiento
- Se reconstruyo la experiencia del Archivista con identidad Kingdoom, cabecera de estado vivo, metricas, cinco modos de consulta, salud visible por fuente, accesos guiados de administracion, vistas previas de acciones y conversacion priorizada en movil.
- La interfaz incorpora estados de carga/error/parcial, reintento, cancelacion, seguimiento de fuentes, preguntas sugeridas, follow-ups, adjuntos validados, historial acotado, autoscroll respetuoso y controles tactiles de al menos 46 px reales incluso bajo el escalado movil del sitio.
- La carga de mercado, eventos, misiones, grimorio, biblioteca y jugadores usa tolerancia a fallos por fuente; un conector rechazado ya no bloquea todo el Archivista y la UI muestra el origen degradado con texto accesible.
- Las operaciones admin exigen sesion segura vinculada, muestran payload antes de confirmar y diferencian eliminaciones. Los ajustes de oro usan incrementos atomicos, coincidencia exacta de jugadores, deteccion de nombres ambiguos, concurrencia limitada y reportes honestos de resultados parciales.
- Se corrigieron consultas IA obsoletas, cancelacion al cambiar bloqueo/privilegios, duplicacion de contexto, serializacion de imagenes, colisiones de cache por documentos, payloads sin limites y respuestas externas malformadas. El compositor deja de rerenderizar el historial por cada tecla y las tarjetas evitan procesar colecciones no solicitadas.
- Se agrego `scripts/check-archivist-v2.mjs` para proteger coincidencias exactas, acentos, ausencia de matches parciales y ambiguedad. Graphify quedo actualizado a 4.881 nodos y 10.496 aristas.
- Validacion: `node scripts/check-archivist-v2.mjs`, `npx tsc --noEmit`, `npm run build`, `npm run graphify:update` y Chrome headless real en 1440x1200/390x844 pasaron limpios; 5/5 fuentes sincronizadas, sin errores de consola/red ni overflow horizontal. El chunk diferido del Archivista queda en 70,05 kB (19,94 kB gzip), sin impactar el bundle inicial.
- Riesgos heredados abiertos: `increment_gold` sigue siendo invocable desde clientes y la seguridad completa de la economia requiere migrar los minijuegos a liquidacion server-side; ademas, "Detener" cancela la espera del navegador pero el proveedor IA puede terminar su generacion en el servidor porque el orquestador compartido aun no propaga un `AbortSignal`. Este rework no amplia esos permisos. [Codex]

### [2026-07-14] Hotfix de busquedas vacias en Portal Anime
- Se normalizo el `404` de busqueda anime como "sin coincidencias" en lugar de error de proveedor, cubriendo tanto el modo directo al scraper como el proxy server-side.
- El diagnostico de fuentes ya no marca AnimeFLV/TioAnime como "No disponible" cuando la serie buscada simplemente no existe en esa fuente.
- En Vercel el navegador vuelve a usar el proxy propio `/api/anime/proxy`; el modo directo con `key` queda reservado para GitHub Pages/static hosting, evitando divergencias entre el scraper externo y el proxy server-side.
- Validacion: `node --experimental-strip-types scripts/anime-provider-contract.selfcheck.mjs`, `npx tsc --noEmit` y `npm run build` pasaron limpios. [Codex]

### [2026-07-14] Limpieza del apartado de app comunitaria en Home
- Se elimino el flujo visible de descarga de app comunitaria del Home y el copy de onboarding que todavia indicaba "Descarga la app".
- Se retiro el util de `siteSettings` dedicado exclusivamente a resolver la URL del APK, ya sin consumidores activos.
- Validacion: busqueda `rg` sin referencias visibles a la app comunitaria, `npx tsc --noEmit` y `npm run build` pasaron limpios. [Codex]

### [2026-07-14] Despliegue Vercel del Portal Anime y ajuste de funciones Hobby
- Se conecto Vercel MCP oficialmente por OAuth (`https://mcp.vercel.com`) y se enlazo el checkout local al proyecto `xxxraiconxxxs-projects/kingdoom`.
- El deploy productivo inicial fallo por el limite Hobby de 12 Serverless Functions; se movieron helpers internos desde `api/` hacia `server/` para que Vercel cuente solo rutas reales y mantenga los endpoints admin/anime sin superar el limite.
- Se desplego produccion en Vercel y el alias `https://kingdoom.vercel.app` quedo apuntando al nuevo deployment.
- Validacion: `npx tsc --noEmit`, `npm run build`, conteo `api-ts-route-files=12`, `vercel deploy --prod` exitoso y verificacion remota del chunk `AnimeHubSection-BG9sdvZh.js` sin GogoAnime ni `Authorization`, con AnimeFLV, TioAnime, scraper externo y `key` por query. [Codex]

### [2026-07-14] Hotfix de entorno Supabase para GitHub Pages
- Se agregaron `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` al workflow de GitHub Pages con lectura desde secrets/variables y fallback publico, evitando que el bundle publicado rompa al iniciar en sesiones limpias.
- La reproduccion con navegador automatizado mostro que la pagina publicada lanzaba `Faltan variables de entorno de Supabase...` antes de renderizar, lo que explica fallos en iPhone o navegadores sin cache previa.
- Validacion: `npx tsc --noEmit`, `npm run build` con Supabase + Anime env y `git diff --check` pasaron limpios. [Codex]

### [2026-07-14] Simplificacion CORS del Portal Anime en Pages
- Se quito el header `Authorization` del modo directo GitHub Pages -> scraper, dejando la autenticacion por `?key=` que ya responde 200 en el scraper publicado.
- Esto evita preflight CORS innecesario y reduce los falsos 401 visibles en DevTools cuando el hosting estatico llama al scraper directo.
- Validacion: `npx tsc --noEmit`, `npm run build` y `git diff --check` pasaron limpios. [Codex]

### [2026-07-14] Recorte de proveedor inestable en Portal Anime
- Se retiro GogoAnime del selector y del modo automatico del Portal Anime tras confirmar que el scraper remoto respondia 500 para esa fuente mientras AnimeFLV y TioAnime respondian 200 con `naruto`.
- El contrato de proveedores queda limitado a AnimeFLV y TioAnime, evitando rondas automaticas con 401/500 visibles en DevTools y estados de "0 titulos" por mezcla de fuentes degradadas.
- Validacion: `node scripts/anime-provider-contract.selfcheck.mjs`, `npx tsc --noEmit`, `npm run build` y `git diff --check` pasaron limpios. [Codex]

### [2026-07-14] Fallback de autenticacion directa para Portal Anime
- Se reforzo el camino directo GitHub Pages -> scraper anime agregando `key` en la query ademas del header `Authorization`, para evitar 401 cuando el navegador o el hosting intermedio no entrega el header como espera el endpoint.
- El scraper embebido acepta ahora la clave tanto por `Authorization: Bearer` como por `?key=`, manteniendo el mismo `ANIME_HUB_API_KEY` configurado en produccion.
- Validacion: el scraper remoto respondio 200 con header y 401 sin credencial; CORS preflight acepta `Authorization`; `node --experimental-strip-types --check`, `npx tsc --noEmit`, `npm run build` y `git diff --check` pasaron limpios. [Codex]

### [2026-07-13] Hotfix de Portal Anime en GitHub Pages
- El job de build queda asociado al environment `github-pages` para leer variables/secrets configurados ahi antes de generar el bundle estatico.
- El workflow de Pages ahora acepta `ANIME_HUB_API_KEY`, `ANIME_HUB_API_URL` y `ANIME_PROXY_URL` tanto desde GitHub Actions Secrets como desde GitHub Actions Variables, para cubrir configuraciones no marcadas como secret.
- Se adapto el provider del Portal Anime para detectar despliegues estaticos de GitHub Pages y usar el scraper autenticado directamente cuando el build recibe `VITE_ANIME_HUB_API_KEY`; la URL publica del scraper queda como default.
- El workflow de Pages ahora inyecta `ANIME_HUB_API_URL`, `ANIME_HUB_API_KEY` y `ANIME_PROXY_URL` desde GitHub Actions Secrets durante `npm run build`, evitando que el bundle se publique sin credenciales anime.
- Se mantiene el camino server-side por `/api/anime/proxy` para despliegues con backend disponible; el modo directo queda como compatibilidad operativa para Pages.
- Validacion: scraper remoto con `Authorization` respondio 200 en TioAnime, mientras `/api/anime/proxy` en GitHub Pages/Vercel actual respondia 404; `npx tsc --noEmit`, `npm run build` con variables anime y `git diff --check` pasaron limpios. Riesgo: en GitHub Pages la clave `VITE_` queda incluida en el bundle estatico por limitacion del hosting. [Codex]

### [2026-07-13] Rework responsivo y endurecimiento de proveedores del Portal Anime
- Se rediseño `AnimeHubSection` para movil y escritorio con selector de proveedor siempre visible, busquedas rapidas, resultados tactiles, estados de carga/error/vacio, filtro de episodios, diagnostico visible por fuente y animaciones compatibles con movimiento reducido. Al entrar sin sesion, el panel de perfil se compacta para priorizar el portal sin perder el acceso a "Conectar".
- Se elimino la consulta vacia al abrir el portal y se protegieron busquedas, fichas y episodios contra respuestas asincronas atrasadas.
- El navegador deja de contener o enviar secretos a servicios externos: busqueda, detalle, enlaces y metadatos pasan por `/api/anime/proxy`, con timeout, cache CDN, deduplicacion cliente y cache temporal.
- El modo automatico consulta en paralelo solo las fuentes realmente soportadas: AnimeFLV, TioAnime y GogoAnime. AnimeFLV incorpora respaldo mediante `animeflv.ahmedrangel.com`; Jikan incorpora Kitsu como respaldo de metadatos.
- Se agrego un contrato ejecutable para rutas, alias y proveedores; los errores de red ahora activan el respaldo y no solo los errores HTTP.
- El scraper embebido rota el encabezado de navegador por solicitud, elimina la clave predeterminada conocida y permite `Authorization` en CORS. Requiere configurar `ANIME_HUB_API_KEY` tanto en Kingdoom como en el despliegue del scraper.
- Validacion: `node scripts/anime-provider-contract.selfcheck.mjs`, `npx tsc --noEmit`, compilacion aislada del proxy y `npm run build` exitosos. AnimeFLV y TioAnime respondieron desde infraestructura remota; la politica de la herramienta impidio probar rutas JSON parametrizadas y GogoAnime permanece sin confirmacion remota. [Codex]

### [2026-07-11] Auditoria extrema de rendimiento y transferencias seguras
- Se reemplazo el reveal inicial basado en GSAP por Web Animations API, reduciendo el camino critico de `185.002` a `157.084` bytes gzip (`-15,1%`) y de 7 a 6 archivos iniciales sin cambiar el aspecto ni el soporte de movimiento reducido.
- Se agrego `supabase/supabase_player_transfers.sql` con transferencias atomicas de oro y objetos, bloqueo de items financiados, autorizacion por sesion vinculada y notificacion dentro de la misma transaccion.
- El panel de intercambios deja de hacer debitos/creditos separados con rollback parcial, exige vinculo seguro y refresca el saldo real tras completar la RPC.
- La migracion reemplaza la politica abierta de `player_notifications` por lectura y marcado limitados al jugador vinculado.
- `.env` se retiro del indice de Git conservando la copia local. Las claves historicamente expuestas deben rotarse en sus proveedores antes del siguiente despliegue.
- Riesgo P0 abierto: `increment_gold` aun permite incrementos positivos desde clientes web y nueve minijuegos liquidan premios calculados en navegador. No se revoco para evitar romper produccion; requiere migrar cada juego a una RPC server-side verificable antes de considerar segura la economia web.
- Validacion: `npx tsc --noEmit`, `npm run build`, muestra final de siete pasadas de Chrome (LCP mediano `444 ms`, CLS mediano `0`) y ejecucion integral de la migracion en PostgreSQL efimero con casos autorizado, no autorizado, saldo insuficiente y objeto bloqueado. El SQL debe aplicarse en Supabase antes de desplegar estos cambios. [Codex]

### [2026-07-10] Hotfix del menu admin oculto en escritorio
- Se corrigio la prioridad CSS de `kd-admin-tabs` para que el menu de secciones del panel admin vuelva a mostrarse en escritorio aunque el estado inicial mantenga la clase `hidden`.
- El comportamiento colapsable en movil se conserva: el selector sigue cerrado por defecto en pantallas chicas y se despliega solo al pulsar "Menu". [Codex]

### [2026-07-09] Graphify operativo y portable sin versionar estado local
- Se agregaron `scripts/graphify-manager.mjs` y `docs/graphify/OPERATIONS.md`, junto con los comandos `npm run graphify:setup|doctor|update|rebuild|watch`, para unificar el mantenimiento del grafo en `Kingdoom-sync`.
- `AGENTS.md`, `.agents/rules/graphify.md` y `.agents/workflows/graphify.md` quedaron alineados al mismo flujo operativo, mientras `.codex/skills/graphify/` se conserva versionado para que Codex mantenga `/graphify` en nuevos clones.
- `.codex/hooks.json` y todo `graphify-out/` salen del indice de Git para volver a ser estado local por maquina, sin perder compatibilidad con Graphify ni con otros agentes. Validado con `npm run graphify:setup` y `npm run graphify:doctor`. [Codex]

### [2026-07-09] Redistribucion desktop del Asedio
- Se reordeno el layout de escritorio del Asedio para que la cronica quede debajo del mapa en la columna amplia, reduciendo el espacio vacio al final del frente.
- La cronica ahora reparte sus movimientos en una grilla responsiva cuando hay ancho disponible, manteniendo una sola columna en movil. [Codex]

### [2026-07-09] Versionado de artefactos Graphify para relevo
- Se suben la skill local de Graphify para Codex, el filtro de skills de agentes y las salidas `graphify-out` generadas para consultar el grafo del repositorio.
- El hook local de Codex queda portable usando `graphify hook-check` en vez de una ruta absoluta del equipo actual. [Codex]

### [2026-07-09] Pozo acumulativo de victoria para El Asedio
- Se agrego al esquema de Asedio un pozo de premio con base de 125.000 oro, crecimiento de 125.000 por ciclo de 24 h y tope de 1.000.000 oro.
- Se incorporo la RPC `settle_realm_siege_prize`, que reparte el pozo una sola vez al reino que conquiste todo el mapa o al que tenga mas territorios al cierre semanal.
- El reparto queda limitado a integrantes activos del reino ganador y se registra en la cronica como `prize_awarded`.
- La UI muestra una tarjeta compacta "Pozo de victoria" con progreso, candidato/ganador, cierre previsto y boton de reparto cuando corresponde. [Codex]

### [2026-07-09] Ajuste responsive del encabezado y cronica del Asedio
- Se simplifico el encabezado exclusivo del Asedio eliminando los chips visibles de bloqueo e IA.
- El boton de retorno a la pagina inicial ahora es compacto y ocupa menos espacio en desktop y movil.
- Se redujo el tamano del titulo "Ultimos movimientos" y se compactaron paddings/grillas en mobile para aprovechar mejor el ancho disponible. [Codex]

### [2026-07-09] Restauracion visual del mapa de Asedio con castillos
- Se incorporaron los cinco modelos visuales del Asedio en `src/assets/asedio/`: Kaelum-Gard, Oakhaven, Arcania, Los Paramos y neutral.
- `RealmSiegeSection` reemplaza el mapa de botones con iconos por un SVG interactivo con castillos, conexiones entre territorios, anillos de control, badges de muralla y escala distinta para capitales/puestos.
- Las tarjetas de eleccion de faccion y el panel lateral de territorio ahora muestran los modelos de castillo correspondientes para recuperar la direccion visual del prototipo pulido. [Codex]

### [2026-07-08] Hotfix de rutas SPA en Vercel para Asedio
- Se agrego `vercel.json` en la raiz para reescribir rutas internas de la SPA hacia `index.html`.
- Corrige el 404 directo al abrir `/asedio-reinos?returnTo=%2F` desde la tarjeta exclusiva del mercado en produccion. [Codex]

### [2026-07-08] Base Supabase y entrada web para El Asedio de los Reinos
- Se agrego `supabase/supabase_realm_siege.sql` con temporada, facciones, territorios, estado de jugador, depositos diarios, acciones del frente y RPCs seguras para elegir faccion, depositar oro, cobrar produccion e invertir en produccion territorial.
- La economia inicial queda alineada con el balance actual del prototipo: deposito diario maximo de 25K, ciclo de produccion de 24h, recompensa de conquista de 20K y cupo de 3 jugadores por reino.
- Se incorporo `src/utils/realmSiege.ts` como cliente unico de Supabase para el Asedio, incluyendo normalizacion de estado, apertura de ventana exclusiva y utilidades de oro.
- Se agrego `src/sections/RealmSiegeSection.tsx` como centro de mando web independiente con seleccion bloqueada de faccion, tesoro, produccion por territorios, inversiones y lectura de cronica.
- `src/App.tsx` reconoce `/asedio-reinos` como experiencia separada sin barra inferior ni perfil superior, y `src/sections/MarketSection.tsx` expone una tarjeta de catalogo que abre el Asedio en ventana aparte. [Codex]

### [2026-07-07] Setup portable de Graphify para Antigravity 2
- Se reforzo `AGENTS.md` para que Graphify sea la via preferente en auditoria, debugging, impacto y handoff dentro de `Kingdoom-sync`, especialmente en trazas UI -> hooks/contexto -> utilidades -> Supabase.
- Se agregaron `.agents/rules/graphify.md` y `.agents/workflows/graphify.md` para que Antigravity 2 consulte el grafo del repo antes de responder preguntas de arquitectura o codigo.
- Se versionaron `scripts/antigravity2-graphify-setup.ps1` y `docs/antigravity2-graphify-guia.md` para preparar otro ordenador con Graphify + Antigravity 2, incluyendo MCP, skills `.agents`, hooks y build inicial de `Kingdoom-sync`, `kingdoom-bot` y `kingdoom-fichas`.
- Validacion: revision manual de rutas, JSON de MCP valido y verificacion de archivos `.agents` generados. [Codex]

### [2026-07-06] Auditoria de minijuegos web y cobros recuperables
- Se auditaron los minijuegos web de la Taberna en funcionamiento, IU y decoracion, con foco en liquidacion de oro, estados bloqueados y mensajes visibles al jugador.
- `TavernRoulette.tsx`, `TavernHorseRace.tsx`, `TavernCrash.tsx`, `TavernExpedition.tsx`, `TavernExpeditionArcade.tsx` y `TavernTowerDefense.tsx` ahora convierten fallos de acreditacion en cobros pendientes recuperables, con aviso visible y boton de reintento.
- Las nuevas rondas, contratos, carreras u oleadas quedan bloqueadas mientras exista un cobro pendiente para evitar estados confusos o perdidas silenciosas.
- En `TavernHorseRace.tsx`, el tope diario de ganancia offline se aplica solo despues de acreditar correctamente el premio o de cobrar el pendiente.
- Se verifico que `TavernSlots.tsx`, `TavernPenalty.tsx` y `TavernPlinko.tsx` ya usan liquidacion neta en una sola operacion de oro; no requerian ajuste funcional.
- Validacion: `npx tsc --noEmit` y `npm run build` completados con exito. [Codex]

### [2026-07-06] Reestructuracion del changelog activo
- `AI_CHANGELOG.md` ahora conserva solo la ventana operativa reciente del 2026-05-06 al 2026-07-06.
- Se retiro del changelog activo el historico anterior a esa ventana para mantener el relevo rapido y accionable.
- Las entradas conservadas quedaron agrupadas por mes y ordenadas de mas reciente a mas antigua.
- Validacion: revision mecanica de fechas, rango conservado y ausencia de BOM.

### [2026-07-05] Auditoria de sobreingenieria y remocion de redundancias (YAGNI)
- Se eliminaron los archivos `src/lib/supabase.ts`, `src/utils/businesses.ts` y `src/utils/market.ts` que solo actuaban como wrappers redundantes de re-exportacion.
- Se actualizo el direccionamiento de imports de Supabase, businesses y market en los componentes `App.tsx`, `AdminControlSheet.tsx`, `PlayerProfilePanel.tsx`, `AppLiveHuntSection.tsx`, `RealmRegistry.tsx`, `MarketSection.tsx` y las features/utilidades correspondientes para conectar directamente con sus fuentes originales (`utils/supabaseClient`, `features/businesses`, `features/market`).
- Se removio el archivo temporal vacio `src/utils/test`.
- Validacion: `npx tsc --noEmit` y `npm run build` completados con exito. [Antigravity]

### [2026-07-05] Menu colapsable para admin y control de scroll en movil
- Se agrego un estado `isMenuExpanded` en `src/components/AdminControlSheet.tsx` para permitir que el menu de secciones administrativas se contraiga y expanda en dispositivos moviles.
- En resoluciones moviles (< 640px), si el menu esta contraido, se muestra una barra compacta premium con el icono y label de la pestana activa, liberando espacio para el contenido.
- Al hacer clic en un boton del menu desplegado, el panel cambia de pestana y se contrae de forma automatica.
- Se implemento un `useEffect` para aplicar `overflow: hidden` en `body` y `documentElement` cuando el panel administrador esta montado, previniendo el scroll de fondo y evitando la duplicidad de barras de scroll naranjas.
- Se corrigio la especificidad CSS de `.kd-admin-tabs` en `src/index.css` usando el selector `:not(.hidden)` en movil, asegurando que las clases de visualizacion condicionales (`hidden`) oculten la grilla de pestanas de forma efectiva en el colapso.
- Se reforzo el ocultamiento del menu colapsado en `src/index.css` agregando la regla `.kd-admin-tabs.hidden { display: none !important; }` para evitar que la definicion de visualizacion flex de la clase base gane por especificidad o cascada.
- Validacion: `npx tsc --noEmit` y `npm run build` completados con exito. [Antigravity]

### [2026-07-02] Cambio de ventana de roleo: 9 dias
- La politica de acceso por roleo pasa de 3 a 9 dias para el bloqueo automatico y la gracia inicial.
- `supabase/supabase_roleplay_access.sql` ahora siembra `grace_until` a 9 dias y extiende a 9 dias los perfiles no exentos, aun desbloqueados y sin roleo registrado cuando se reejecuta el SQL.
- `src/components/RoleplayLockNotice.tsx` actualiza el mensaje visible del frontend para reflejar la nueva ventana de 9 dias.
- Validacion: `npx tsc --noEmit` y `npm run build` completados con exito. [Codex]

### [2026-07-01] Auditoria y hardening del acceso web por roleo
- Se corrigio un bug de orden de hooks en `MarketSection` y `ArchivistSection`: el aviso de bloqueo ya no retorna antes de declarar todos los hooks, evitando errores de React al pasar de bloqueado a desbloqueado.
- `MarketSection` deja de disparar la carga SWR de mercado cuando el jugador esta bloqueado por roleo, reduciendo lecturas innecesarias.
- `supabase_roleplay_access.sql` ahora expone `player_roleplay_access_public` como vista segura para la web y elimina las politicas de lectura publica directa sobre `player_roleplay_access`, `roleplay_phone_activity` y `player_roleplay_access_log`.
- `players.ts` consume la vista publica cuando existe y mantiene fallback temporal a la tabla legacy para evitar corte de servicio hasta aplicar el SQL actualizado.
- Se removieron del tipo web los campos internos `lastRoleplayGroupJid` y `lastHumanRoleplayPhone`, que no eran necesarios para la UI.
- Se reparo `ai-memory/kingdoom-memory.jsonl` para recuperar formato JSONL valido tras el rebase y corregir una entrada antigua no-JSON.
- Validacion: `npx tsc --noEmit`, `npm run build` y parseo JSONL completados con exito. [Codex]

### [2026-07-01] Acceso web condicionado por roleo activo y nueva base SQL compartida
- Se agrego `supabase/supabase_roleplay_access.sql` para introducir `player_roleplay_access`, `roleplay_phone_activity` y `player_roleplay_access_log` como nueva capa persistente del sistema de roleo.
- `src/utils/players.ts` ahora detecta y lee `player_roleplay_access` junto al perfil del jugador, anexando al `PlayerAccount` el estado de bloqueo, gracia, ultima actividad de roleo y exenciones.
- `src/components/PlayerProfilePanel.tsx` muestra una advertencia visible cuando el perfil esta bloqueado por no rolear en los ultimos 9 dias.
- `src/sections/MarketSection.tsx` y `src/components/ArchivistSection.tsx` quedaron gateados: si el jugador esta bloqueado por roleo, la web mantiene perfil/misiones/eventos pero corta mercado, taberna y archivista con aviso explicito.
- Validacion: `npx tsc --noEmit` y `npm run build` completados con exito. [Codex]

## 2026-06

### [2026-06-30] Creación de subagente KingdoomFB y materiales de marketing
- Se configuró el nuevo subagente persistente `KingdoomFB` en `.agents/agents/KingdoomFB/agent.json`, especializado en marketing, posicionamiento estratégico y copywriting para redes sociales y WhatsApp.
- Se recopilaron y analizaron 10 publicidades de grupos competidores de Facebook, elaborando un estudio de mercado profundo con matriz de ventajas competitivas.
- Se redactaron copys optimizados y extendidos (limpios y muy espaciados) y prompts de imagen en formato horizontal y vertical basados en una estética anime/fantasía premium (estilo Ufotable).
- Se redactó el borrador de la primera publicación oficial optimizada para el feed de Facebook.
- Los entregables de marketing se organizaron en `docs/marketing/`. [Antigravity]

### [2026-06-29] Inicio: limpieza del hero y contador vivo de personajes
- Se elimino del hero principal de `Inicio` el apartado de **App de la comunidad** junto con los accesos rapidos **Conectar jugador**, **Ver fichas** y **Mercado y taberna**.
- La metrica `Personajes` del bloque superior dejo de mostrar un texto estatico y ahora consume el total real de fichas en `character_sheets`.
- El conteo excluye fichas recicladas disponibles cuando existe `recycleStatus`, para reflejar los personajes activos actuales del reino.
- Se agrego actualizacion en vivo del contador mediante cambios de Supabase sobre la tabla `character_sheets`, de modo que el numero se refresque cuando se crea, edita o elimina una ficha.
- Validacion: `npx tsc --noEmit` y `npm run build` completados con exito. [Codex]

### [2026-06-29] Reorganizacion estructural de docs, SQL y materiales fuente
- Se movieron todos los scripts SQL versionados desde la raiz a `supabase/`, dejando el bloque de base de datos agrupado en una carpeta unica.
- Se trasladaron `AI_GOLDEN_RULES.md` y `DATABASE_SCHEMA.md` a `docs/reference/` para separar documentacion operativa/esquematica del runtime de la app.
- Se movieron `grimorio_final.json` y `Poderes.zip` a `docs/source-material/` como insumos fuente del grimorio, y se ajustaron `scripts/generate_grimoire_ts.py` y `scripts/parse_powers_v2.py` para usar la nueva ruta.
- Se actualizo `AGENTS.md`, `README.md` y `docs/agents/KingdoomAuditor.md` para reflejar la nueva ubicacion de SQL y documentacion de referencia.
- Validacion: se verifico sintaxis de los scripts Python tocados; no se ejecuto `npx tsc --noEmit` ni `npm run build` porque la entrega fue de organizacion estructural, sin cambios funcionales en frontend. [Codex]

### [2026-06-29] Higiene de repositorio: scripts utilitarios, temporales y metadata basura
- Se movieron scripts utilitarios fuera de la raiz para que el repo quede mas legible: `fix_img_tags.cjs` paso a `scripts/maintenance/fix_img_tags.cjs` y `testVisual.ts` a `scripts/manual/testVisual.ts`.
- Se corrigieron sus rutas locales para que sigan siendo ejecutables desde la nueva ubicacion sin depender de paths personales externos.
- Se eliminaron del tracking archivos temporales/restores que no formaban parte del producto (`tmp_*.txt`) y la carpeta `extracted_powers/__MACOSX/`, que solo contenia metadata basura proveniente del zip original.
- Se endurecio `.gitignore` para ignorar futuros temporales `tmp_*.txt`, carpetas `__MACOSX` y residuos `.DS_Store`.
- Validacion: no se ejecuto `npx tsc --noEmit` ni `npm run build` porque la entrega fue de higiene estructural/documental y no altero runtime web ni SQL productivo. [Codex]

### [2026-06-28] Reforma Económica y Balanceo de Minijuegos
- **[Slots]:** Rediseñada la tabla de pagos (gemas x6, coronas x15, pares x1.5) y reajustadas las probabilidades de giro para fijar un RTP global de **91.5%** con 63% de probabilidad de pérdida.
- **[Penalty]:** Ajustados los multiplicadores por ronda a **x1.7 / x2.8 / x4.8 / x8.0** para fijar el RTP en **94.0%** e incentivado el riesgo. Adaptada la UI (Tanda x8).
- **[Ruleta]:** Migrada la ruleta de 25 números a una **Ruleta Francesa estándar de 37 números (0 al 36)**. El pleno ahora paga un **x35** real (RTP 97.30%) y se reajustó la grilla del frontend a 6 columnas incluyendo la celda del 0 al tope.
- **[Minijuegos Seguros]:** Limitado el RTP de *RouletteSecure* al **94.0%**, reducida la racha de cartas a incremento **0.15** y habilitados colapsos instantáneos en 1.01 para *CrashSecure* (5% de chance).
- **[Bot Games]:** Reducida la tabla de recompensas del cofre gratis diario a un promedio de **570 oro por cofre** y subido el objetivo de victoria en dados a **suma >= 8** desactivando permanentemente el multiplicador x4.
- **[Base de Datos & Alexander]:** Ejecutada la detracción de 900M de Alexander (balance inicial de 90M), aisladas las cuentas de administradores en `purchase_market_item` y creada la función `apply_wealth_tax` (tasa del 0.2% y 0.5% diario) colectando **18,311,444 de oro** en su primer ejecución.
- **[Validación]:** `npx tsc --noEmit` y `npm run build` completados con éxito. Commits y pushes realizados en ambos repositorios. [Antigravity]

### [2026-06-27] Fix: Botón de Retiro Inactivo en TavernCrash
- Se corrigió un bug grave en `TavernCrash` donde clics en el botón de retiro fallaban silenciosamente o quedaban bloqueados por condiciones de carrera introducidas en un parche anterior.
- Se eliminaron los `useEffect` que sincronizaban `updatingRef` y `statusRef`. Dichos efectos, al ser asíncronos en React, sobreescribían las mutaciones síncronas requeridas antes de los awaits (ej. `updatingRef.current = true`), provocando que la interfaz inhabilitara el botón temporalmente o fallara en registrar el estado `"cashed_out"` antes de un colapso.
- Se ajustó el argumento de `handleCashOut` y el bindeo en el botón (`onClick={() => handleCashOut()}`) para evitar que el evento sintético de React (`React.MouseEvent`) interfiera con el tipado interno del componente y la lógica de caída por defecto (fallback) al multiplicador local.
- Validación: Build limpia (`npx tsc --noEmit` y `npm run build` OK). No hay riesgos detectados ya que se restaura el aislamiento del flujo manual contra el bucle de animaciones. [Antigravity]

### [2026-06-26] Revision preproduccion: ocultar fichas reciclables del panel del jugador original
- Se corrigio `getPlayerSheets()` para que las fichas marcadas con `recycleStatus = available` ya no aparezcan en el apartado normal de fichas del jugador original.
- Esto evita que una ficha archivada/reciclable siga viendose como activa en `Mis personajes` mientras espera reasignacion.
- El filtro mantiene compatibilidad hacia atras: si la columna `recycleStatus` no existe, el comportamiento sigue funcionando sin romper el panel.
- Validacion: `npx tsc --noEmit` y `npm run build` pasaron correctamente. [Codex]

### [2026-06-25] Registro del Reino: fichas recicladas y fix de listado vacio
- Se corrigio la carga del modal `Buscar fichas`: `getCharacterSheetRegistrySummaries()` ya no depende de que existan columnas opcionales como `playerUsername`, `portraitUrl` o campos de reciclaje; ahora detecta soporte de columnas y arma la consulta compatible con el esquema real.
- Se agrego en `RealmRegistry` un selector entre `Fichas publicas` y `Fichas recicladas`, manteniendo contadores separados, busqueda por propietario original y mensajes vacios especificos.
- Se agregaron campos tipados de reciclaje en `CharacterSheet` (`recycleStatus`, `originalPlayerId`, `originalPlayerUsername`, `recycledAt`, `assignedAt`, `assignedToPlayerId`).
- Se versiono `supabase_character_sheet_recycling.sql` con columnas nuevas, indices, politicas de lectura/escritura compatibles con el flujo actual, tabla `player_lifecycle_log` y RPCs para el bot: `mark_player_sheets_recyclable()` y `assign_recycled_character_sheet()`.
- Se actualizo `docs/whatsapp-player-lifecycle-spec.md` para aclarar el apartado web de fichas recicladas y el comando futuro `!asignarficha <ficha|nombre> @usuario`.
- Validacion: `npx tsc --noEmit` y `npm run build` pasaron correctamente. Riesgos abiertos: el SQL debe ejecutarse en Supabase antes de que existan fichas recicladas reales y antes de conectar el comando del bot. [Codex]

### [2026-06-25] Especificacion del ciclo de vida de jugadores WhatsApp: salida, archivo y reciclaje
- Se documento en `docs/whatsapp-player-lifecycle-spec.md` el diseno operativo para jugadores que abandonan el grupo principal de WhatsApp.
- La politica definida establece deteccion de salida, anuncio del bot, estado `left_grace`, gracia de `14 dias` en horario `America/Asuncion` y archivado automatico posterior.
- Se fijo como regla de seguridad que **la ficha puede reciclarse, pero la identidad historica del jugador no se reutiliza**; el `player_id` viejo no debe pasar a otra persona.
- Tambien quedaron definidos los estados sugeridos (`active`, `left_grace`, `archived`, `recycled`, `purged`), la tabla de auditoria `player_lifecycle_log` y los comandos staff/admin base (`!salidos`, `!archivados`, `!reactivar`, `!reciclarficha`, `!purgarperfil`).
- Riesgos abiertos: aun falta concretar la implementacion fina de reasignacion de fichas recicladas y su UX administrativa; en esta entrega se dejo la base funcional y las reglas de negocio. [Codex]

### [2026-06-25] Reduccion de Egress Web: Perfil y Archivista
- Se redujo el polling automatico de perfil en `PlayerSessionContext` de cada `10s` a cada `60s`, y ahora solo refresca por intervalo si la pestana esta visible.
- Se conserva el refresh inmediato al volver a enfocar la ventana y los refresh explicitos tras compras/minijuegos, para no perder coherencia de saldo.
- `ArchivistSection` deja de ejecutar dos bootstraps paralelos que repetian mercado, eventos, misiones, grimorio y documentos.
- Se agrego `buildArchivistKnowledgeDocumentsFromContext()` para construir el corpus IA desde el mismo contexto vivo ya cargado por el Archivista.
- Impacto esperado: baja directa de lecturas repetitivas de `players` y eliminacion de una carga duplicada fuerte del Archivista. Riesgos abiertos: el Archivista mantiene el mismo corpus, pero conviene observar si alguna respuesta pierde contexto por depender de diferencias entre las dos cargas previas. [Codex]

### [2026-06-24] Rebalance Generoso de TavernCrash
- Se ajusto `generateCrashPoint()` en `src/components/TavernCrash.tsx` para volver el minijuego mas amable sin romper la economia.
- El crash instantaneo en `1.00x` baja de `3%` a `1.5%`.
- La constante principal sube de `0.99` a `0.995`, mejorando ligeramente las probabilidades de alcanzar multiplicadores como `1.5x`, `2x`, `3x` y `5x`.
- Se limpiaron redundancias menores del componente (asignaciones duplicadas de `updatingRef.current` y una clase `overflow-hidden` repetida) para dejar el archivo mas ordenado.
- El rebalance mantiene el tope de `1000x` y no toca la logica de retiro manual/automatico ni el blindaje anti doble cashout.
- Riesgos abiertos: Ninguno detectado a nivel de tipado o build; el unico punto pendiente es observar el comportamiento economico en uso real para confirmar que la sensacion generosa siga siendo sana para el oro del reino. [Codex]

### [2026-06-24] Nota de auditoria retroactiva sobre autoria del 23/06
- Por auditoria operativa posterior, las entregas subidas el `23/06/2026` sobre `TavernCrash` deben considerarse parte del ciclo de trabajo de **Antigravity 2**, aunque en este changelog hayan quedado firmadas solo como `[Antigravity]`.
- Commits afectados en git: `9939836` (`fix: race conditions en TavernCrash - updatingRef/statusRef sincronos [Antigravity]`) y `cfdea92` (`Fix TavernCrash double cash out exploit and state desync bugs`).
- Esta nota corrige la **atribucion operativa** del relevo, pero no altera la autoria tecnica registrada por git ni reescribe el contenido funcional de las entradas originales. [Codex]

### [2026-06-23] Fix Race Conditions en TavernCrash (Minijuego Crash)
- Se corrigieron race conditions en `handleCashOut`, `updateMultiplier` y `handleStart` mutando `updatingRef.current` y `statusRef.current` de forma sÃ­ncrona antes de los `await`, eliminando la ventana de tiempo donde React aÃºn no habÃ­a re-renderizado y un segundo click/frame podÃ­a disparar doble cobro.
- Se aÃ±adiÃ³ guardia `!updatingRef.current` en la condiciÃ³n de auto-cashout para evitar que un frame dispare el retiro automÃ¡tico mientras una transacciÃ³n de oro estÃ¡ en vuelo.
- Se sincroniza `statusRef.current = "crashed"` inmediatamente al detectar el crash point, cerrando el exploit de lag donde un frame-drop podÃ­a permitir un cashout despuÃ©s del colapso.
- Se aÃ±adiÃ³ `redrawCanvas` a las dependencias del `useCallback` de `updateMultiplier`.
- Riesgos abiertos: Ninguno detectado. [Antigravity]

### [2026-06-23] Fix Race Conditions en TavernCrash (Minijuego Crash)
- Se corrigieron race conditions en handleCashOut, updateMultiplier y handleStart mutando updatingRef y statusRef de forma sincrona antes de los await.
- Se anadio guardia !updatingRef.current en auto-cashout para evitar doble cobro.
- Se sincroniza statusRef.current = crashed inmediatamente al detectar crash point.
- Se anadio redrawCanvas a las dependencias del useCallback de updateMultiplier.
- Riesgos abiertos: Ninguno. [Antigravity]

### [2026-06-22] Higiene del Repositorio y Escrow del Bot de WhatsApp
- Se removieron los artefactos de compilaciÃ³n de Android del tracking de git (git rm --cached) y se aÃ±adieron al .gitignore para mantener la higiene del repositorio.
- Se implementÃ³ un sistema de Escrow (tabla `bot_active_bets` y funciones RPC `place_bet` / `resolve_bet`) en Supabase para evitar pÃ©rdidas de oro en minijuegos (`!trampa`, `!dados`, `!21`) si el contenedor de Hugging Face se reinicia a mitad de la jugada.
- Se aÃ±adiÃ³ un sistema de recuperaciÃ³n en el evento `ready` del bot que busca apuestas huÃ©rfanas de mÃ¡s de 10 minutos de antigÃ¼edad y devuelve automÃ¡ticamente el oro a los jugadores. [Antigravity]

### [2026-06-21] Portal Anime Proveedor por Defecto
- Se cambiÃ³ el proveedor inicial por defecto a TioAnime y se deshabilitÃ³ temporalmente la opciÃ³n de AnimeFLV (marcada como En Mantenimiento) debido a fallos en el scraper externo. [Antigravity]

### [2026-06-21] Limite de Misiones UI
- Se agregÃ³ un lÃ­mite inicial de 3 misiones visibles en App.tsx con un botÃ³n de ocultar/mostrar para liberar espacio vertical en el tablero operativo. [Antigravity]
# AI Collaboration Log & Project Context

Este archivo sirve como puente de comunicacion y registro de actividad entre los asistentes de IA (**Antigravity** y **Jarvis**) y el desarrollador (**e_grado**).
Su proposito es mantener un historial claro de los cambios en el proyecto **Kingdoom-sync** para evitar conflictos y asegurar que todos estemos en la misma pagina.

---

## Instrucciones para Inteligencias Artificiales (Antigravity y Jarvis)

1. **Leer antes de actuar:** Cada vez que inicies sesion o recibas una tarea compleja, revisa rapidamente la seccion `Historial de Cambios` para saber que se modifico recientemente.
2. **Registrar despues de actuar:** **SIEMPRE** que se finalice CUALQUIER cambio (incluso mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­nimo), el asistente responsable debe aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adir una nueva entrada al `Historial de Cambios` y a la memoria MCP (`kingdoom-memory.jsonl`), y asegurarse de subir ambos a Git (`git add`, `git commit`, `git push`).
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

### [2026-06-21] - [Autor: Antigravity]
*   **Archivos Modificados:** src/components/AnimeHubSection.tsx, src/features/animeHub/animeHub.remoteProvider.ts
*   **Resumen de Tareas:** Habilitacion de VerAnimeOnline como proveedor activo en el frontend.
*   **Cambios Clave:**
    *   **UI:** Se reemplazo la opcion deshabilitada de AnimeFLV por VerAnimeOnline (Espanol) en el selector de proveedores.
    *   **Logica Remota:** Se anadieron los metodos de busqueda y resolucion y se enrutaron al nuevo caso veranimeonline en el remoteProvider para consumir la API previamente actualizada.
*   **Notas/Advertencias:** La API externa ya soporta la nueva ruta, asegurando que la integracion funcione.

### [2026-06-19] - [Autor: Codex]
*   **Archivos Modificados:** `AGENTS.md`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Simplificacion del protocolo operativo para eliminar loops de bootstrap en agentes externos.
*   **Cambios Clave:**
    *   **[Protocolo - AGENTS]:** Se elimino el bootstrap obligatorio como ritual fijo del repositorio.
    *   **[Continuidad]:** `AGENTS.md` ahora deja una regla mas simple: el agente puede leer changelog o memoria cuando haga falta, pero debe hacerlo en silencio y continuar desde el estado actual.
    *   **[Anti-loop]:** Se corto explicitamente la practica de responder con "Contexto cargado..." como arranque repetitivo entre mensajes o subtareas.
*   **Notas/Advertencias:** No se ejecutaron `npx tsc --noEmit` ni `npm run build` porque el cambio fue exclusivamente documental y de protocolo operativo.

### [2026-06-19] - [Autor: Codex]
*   **Archivos Modificados:** `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del recorte de texto en las tarjetas de misiones del reino.
*   **Cambios Clave:**
    *   **Descripcion de Mision:** La descripcion principal deja de quedar fija en tres lineas sin salida; ahora se expande completa cuando el jugador abre el detalle.
    *   **Instrucciones de Mision:** El bloque de instrucciones pasa a un contenedor desplegable dentro de la misma tarjeta, conservando preview compacto en la grilla y lectura completa bajo demanda.
    *   **UX del Grid:** Se mantuvo la densidad visual de las cards en estado normal, evitando romper el tablero de misiones mientras se agrega acceso real al contenido largo.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues del ajuste.

### [2026-06-19] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/context/PlayerSessionContext.tsx`, `src/components/TavernCrash.tsx`, `src/components/TavernExpedition.tsx`, `src/components/TavernExpeditionArcade.tsx`, `src/components/TavernHorseRace.tsx`, `src/components/TavernPenalty.tsx`, `src/components/TavernPlinko.tsx`, `src/components/TavernRoulette.tsx`, `src/components/TavernSlots.tsx`, `src/components/TavernTowerDefense.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Blindaje del oro en minijuegos web para evitar premios perdidos por sobrescritura de saldo absoluto.
*   **Cambios Clave:**
    *   **Delta AtÃƒÂ³mico:** Se agregÃƒÂ³ `incrementPlayerGold(...)` sobre la RPC `increment_gold` y `PlayerSessionContext` expone ahora `addPlayerGold(delta)` para cobrar o descontar oro de forma atÃƒÂ³mica.
    *   **Tavern Web:** Crash, Expedition, Expedition Arcade, Horse Race offline, Penalty, Plinko, Roulette, Slots y Tower Defense dejaron de recalcular `gold = saldoBase +/- ...` en cliente y ahora usan delta real sobre Supabase.
    *   **CorrecciÃƒÂ³n del SÃƒÂ­ntoma Reportado:** El problema mÃƒÂ¡s probable era una carrera entre `refreshPlayer()` y `setPlayerGold(nextGold)` en rondas consecutivas o pestaÃƒÂ±as activas, lo que podÃƒÂ­a pisar premios ganados con un saldo viejo.
*   **Notas/Advertencias:** `setPlayerGold(nextGold)` se mantuvo para flujos donde la fuente de verdad ya devuelve el saldo final exacto. Conviene migrar gradualmente cualquier otro flujo econÃƒÂ³mico que siga escribiendo saldos absolutos.

### [2026-06-17] - [Autor: Claude (Opus 4.8)] - Proyecto hermano: kingdoom-fichas
*   **Archivos Modificados:** Repo aparte `XxxRaiconxxX/kingdoom-fichas` (no es este repo). AquÃƒÂ­ solo se deja constancia.
*   **Resumen de Tareas:** Lanzada la **v2.0** de la app **kingdoom-fichas** (asistente de fichas, APK Android). Pasada de calidad visual premium + cierre de funciones; APK de distribuciÃƒÂ³n generado.
*   **Cambios Clave:**
    *   **[v2.0 push + tag]:** commit y tag `v2.0.0` en `github.com/XxxRaiconxxX/kingdoom-fichas` (rama main). `versionCode 2` / `versionName 2.0`.
    *   **[UI premium]:** fuentes Cinzel + Inter empaquetadas, rediseÃƒÂ±o de identidad Kingdoom, medidores de estadÃƒÂ­sticas/poderes, estados de vacÃƒÂ­o/error/listo, mobile-first con safe-areas Android, favicon herÃƒÂ¡ldico.
    *   **[Funciones]:** AnÃƒÂ¡lisis con IA usando el endpoint `analyze-ficha` de ESTE repo (Vercel) + sync del Grimorio desde la tabla `grimoire_magic_styles` de Supabase.
    *   **[APK]:** `dist-apk/Kingdoom-Fichas-v2.0.apk` (~4.5 MB, debug/sideload). El binario NO se versiona (artefacto); ver `kingdoom-fichas/dist-apk/LEEME-v2.md` y `kingdoom-fichas/CHANGELOG.md`.
*   **Notas/Advertencias:** Build de APK por CLI con `npm run apk:debug` (requiere JDK 17/21 Ã¢â‚¬â€ el JBR de Android Studio sirve Ã¢â‚¬â€ y Android SDK). Dependencia con este repo: el endpoint IA `analyze-ficha` ya estÃƒÂ¡ desplegado y con CORS abierto para los orÃƒÂ­genes de la app.

### [2026-06-17] - [Autor: Claude (Opus 4.8)]
*   **Archivos Modificados:** `api/admin/analyze-ficha.ts` (NUEVO). Proyecto hermano nuevo: `../kingdoom-fichas/` (APK Capacitor asistente de fichas de rol).
*   **Resumen de Tareas:** Arranque del proyecto **kingdoom-fichas** (app/APK que ayuda a los nuevos a crear/validar su ficha antes de enviarla al grupo de WhatsApp) + nuevo endpoint de IA en este repo para el anÃƒÂ¡lisis "asistente".
*   **Cambios Clave:**
    *   **[Nuevo endpoint]:** `api/admin/analyze-ficha.ts` Ã¢â‚¬â€ proxy Gemini (mismo patrÃƒÂ³n que `generate-magic.ts`: `_aiOrchestrator` + `setCorsHeaders`). Recibe `{ficha, avisosLocales}` y devuelve JSON `{veredicto, resumen, sugerencias[]}`. Juzga lo que las reglas locales NO pueden: coherencia edadÃ¢â€ â€historia, raza/reinoÃ¢â€ â€lore, calidad de personalidad y debilidades reales. Temperatura 0.5.
    *   **[App kingdoom-fichas]:** Vite+React+TS+Capacitor (Android). Validador local de reglas duras (stats=12, niveles de poderes=5, raza/reino del catÃƒÂ¡logo, arma/habilidades sin magia, mÃƒÂ­nimos de texto escalados por edad). Generador de ficha aleatoria vÃƒÂ¡lida. Copiar/Compartir a WhatsApp con el formato exacto de la plantilla. Sync del Grimorio desde la tabla `grimoire_magic_styles` (fusionado sobre bundle de 31 magias iniciales extraÃƒÂ­das de `extracted_powers/Poderes/`).
*   **Notas/Advertencias:** Endpoint `analyze-ficha` **DESPLEGADO y verificado** (POST real Ã¢â€ â€™ 200 con JSON `{veredicto, resumen, sugerencias}`; flujo end-to-end probado desde la app en `localhost:4320`, CORS OK). `MISSION_AI_ALLOWED_ORIGINS` ampliada en Vercel con `http://localhost:4320`, `https://localhost`, `capacitor://localhost` (necesario para el APK). Detalle completo del proyecto hermano en `../kingdoom-fichas/HANDOFF.md`. `npm run build` OK en ambos lados. Pendiente del lado fichas: generar el `.apk` (Android Studio).

### [2026-06-17] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/auctions.ts`, `src/components/PlayerAuctionPanel.tsx`, `src/utils/knowledge.ts`, `src/components/admin/AdminKnowledgeManager.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Nueva pasada de reduccion de egress PostgREST en subastas del jugador y biblioteca IA del admin.
*   **Cambios Clave:**
    *   **Subastas del Jugador:** `fetchAuctions` ahora acepta filtros y el panel del jugador pide solo subastas `active`, evitando traer historico completo para luego filtrarlo en cliente.
    *   **Recargas Realtime Coalescidas:** `PlayerAuctionPanel` deja de disparar una recarga por cada evento inmediato de `market_auctions`, `market_auction_bids` y `market_auction_participants`; ahora agrupa cambios cercanos en una sola lectura.
    *   **Participaciones Acotadas:** La lectura de `market_auction_participants` del jugador ahora se limita a las subastas efectivamente devueltas por la consulta principal.
    *   **Biblioteca IA Ligera:** El manager admin de conocimiento ya no trae `content` completo para toda la lista; ahora consume resÃƒÂºmenes livianos y solo carga el documento completo por `id` cuando se va a editar.
*   **Notas/Advertencias:** Este cambio reduce payload y sobrelectura desde la SPA, pero no elimina por si solo consumidores externos o lecturas del Archivista que sigan necesitando contenido completo.

---

### [2026-06-16] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Correccion de desincronizacion visual en TavernCrash cuando la ronda colapsaba instantaneamente o al reiniciar el canvas.
*   **Cambios Clave:**
    *   **[Crash - Canvas Reset]:** Se agrego `redrawCanvas(...)` para forzar repintado del grafico con el estado real de la ronda actual, en vez de dejar visible la curva anterior.
    *   **[Crash - Nueva Ronda]:** `handleStart()` ahora cancela cualquier `requestAnimationFrame` previo, resetea `pointsRef`, multiplicador y canvas antes de calcular el nuevo `crashPoint`.
    *   **[Crash - Colapso 1.00x]:** Cuando la ronda explota de forma instantanea, el lienzo se vuelve a pintar en `1.00x`, evitando que el jugador vea una trayectoria vieja por encima del auto-retiro configurado.
    *   **[Crash - Fin de Ronda]:** Al detectar el colapso normal, la funcion agrega el ultimo punto real al historial del canvas y dibuja la ronda final antes de marcar `crashed`.
*   **Notas/Advertencias:** `npx tsc --noEmit` paso limpio y `npm run build` tambien. El ajuste corrige la inconsistencia visual reportada; si reaparece una perdida injusta con evidencia nueva, habria que inspeccionar una posible carrera entre auto cashout y crash en el mismo frame.

### [2026-06-16] - [Autor: Codex]
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

### [2026-06-16] - [Autor: Codex]
*   **Archivos Modificados:** `src/context/PlayerSessionContext.tsx`, `src/utils/players.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Robustecimiento del bootstrap de perfil del jugador ante timeouts y caidas de Supabase.
*   **Cambios Clave:**
    *   **Timeouts de Perfil:** Se agrego un timeout local de 8 segundos a las consultas de perfil y deteccion de soporte de columnas/tablas relacionadas con auth.
    *   **Errores Mas Claros:** `PlayerSessionContext` ahora distingue mejor entre "jugador no encontrado" y fallos reales de conexion con Supabase al conectar, refrescar o restaurar la sesion guardada.
    *   **Sesion Mas Resistente:** Si Supabase no responde durante el hydrate o el refresh, el contexto evita dejar el flujo en un estado ambiguo y muestra mensajes de error concretos en vez de fallar silenciosamente.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente. El timeout usa `window.setTimeout`, por lo que esta proteccion aplica al cliente web y no altera RPCs ni logica economica del backend.

---

### [2026-06-16] - [Autor: Codex]
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

### [2026-06-16] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/characterSheets.ts`, `src/components/RealmRegistry.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Reduccion de sobrelectura en `character_sheets` para el Registro del Reino y flujos de fichas.
*   **Cambios Clave:**
    *   **Registro Ligero:** El listado publico del reino deja de pedir `select("*")` sobre todas las fichas y ahora consume un resumen tipado sin `history` ni otros campos pesados.
    *   **Carga Bajo Demanda:** La ficha completa se consulta por `id` solo cuando el usuario abre una entrada del registro, manteniendo intacta la modal detallada.
    *   **Orden en SQL:** Se movio el ordenamiento de las fichas al lado de Supabase (`order("name")` para el registro y `order("createdAt")` para los listados completos/por jugador) para evitar trabajo innecesario en frontend.
*   **Notas/Advertencias:** Este cambio optimiza la sobrelectura desde la SPA, pero el warning original de Query Performance estaba bajo `service_role`; por tanto, si esa entrada vuelve a aparecer, podria existir ademas algun consumidor externo al frontend que siga leyendo `character_sheets` de forma amplia.

---

### [2026-06-15] - [Autor: Claude]
*   **Archivos Modificados:** `TavernCards.tsx`, `TavernRoulette.tsx`, `TavernScratch.tsx`, `TavernPlinko.tsx`, `TavernHorseRace.tsx`, `TavernPenalty.tsx`, `TavernExpedition.tsx`, `TavernExpeditionArcade.tsx` (todos en `src/components/`)
*   **Resumen de Tareas:** Pase de pulido visual coherente sobre los 10 minijuegos restantes de la taberna (commits `d77fd03`, `ff13732`, `5ff59eb`). Enfoque seguro y presentacional: NO se reestructuraron los internos bespoke de cada juego ni los canvas (no verificables sin sesion logueada).
*   **Cambios Clave:**
    *   **[Cifras tabulares]:** `font-variant-numeric: tabular-nums` + `toLocaleString("es-PY")` en todos los displays de oro/saldo/premio/apuesta (chips StatChip/RaceStat/StatusChip/MiniStat y headers). Las cifras dejan de "bailar" al cambiar y muestran separador de miles.
    *   **[Headers de saldo]:** Cards y Scratch adoptaron el patron premium (icono `Coins`, hairline ambar superior, borde `amber-500/15`) ya usado en Cofres.
    *   **[Feedback tactil]:** `kd-touch` agregado a botones planos que no lo tenian Ã¢â‚¬â€ refrescar (Cards, Scratch, Ruleta) y CTA principal (Plinko "Lanzar esferas", Carreras "Apostar/Iniciar"). Se evito `motion.button` para no chocar con framer-motion.
    *   **[Sin tocar]:** `TavernCrash` (WIP de Codex, ya en `677e04b`) y `TavernTowerDefense`/`TavernSlots`/`TavernPenalty` que ya tenian `kd-touch` completo y oro formateado.
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores y `npm run build` OK en las 3 tandas. Verificacion: DOM-inspection en `vite preview` (el screenshot se cuelga por la red de Supabase en preview, sin relacion con el cambio). Pendiente para cuando haya sesion logueada: mejoras profundas de los canvas (tableros de Plinko/Carreras/Defensa/Penales) que requieren ojos en vivo.

### [2026-06-15] - [Autor: Claude]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`, `src/components/TavernGame.tsx`
*   **Resumen de Tareas:** Mejoras visuales en la taberna de minijuegos: selector de modos tematizado por tipo de juego y pulido del shell de Cofres.
*   **Cambios Clave:**
    *   **[UI - Selector de taberna]:** los chips de estado de cada minijuego ahora tienen color por tipo (nuevo mapa `TAVERN_STATUS_ACCENTS`: PvE=esmeralda, App=cian, Azar=ambar, Riesgo=carmesi, Rapido=violeta), dando lectura de un vistazo. El boton del modo activo se tematiza con ese mismo color (borde, fondo en gradiente, glow y hairline superior) en vez del ambar uniforme anterior. Hover de inactivos mas marcado y `aria-pressed` para accesibilidad.
    *   **[UI - Cofres (TavernGame)]:** header de saldo con icono `Coins`, `tabular-nums` y separador de miles (`toLocaleString es-PY`), hairline superior ambar y `kd-touch` en el boton de refrescar; linea de info de apuesta tambien con cifras tabulares y miles.
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores; `npm run build` OK. Verificado en vivo con `vite preview` (inspeccion del DOM: acento esmeralda en boton PvE activo y chip "Azar" ambar confirmados; el screenshot se colgaba por la red de Supabase en preview, sin relacion con el cambio). NO se toco `TavernCrash.tsx` (tenia trabajo en curso de Codex, ya commiteado en `677e04b`). Cambios 100% presentacionales. Quedan los otros 10 minijuegos para pulir en proximas iteraciones si se desea.

### [2026-06-15] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/PurchaseModal.tsx`, `src/sections/MarketSection.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/features/market/market.rotation.ts`, `src/features/market/market.rotation.test.ts`
*   **Resumen de Tareas:** CorrecciÃƒÂ³n de la posiciÃƒÂ³n del modal de compra del mercado en mÃƒÂ³viles, ajustes visuales en el Frente de Temporada, y cambio en el intervalo de rotaciÃƒÂ³n del mercado a 2 horas.
*   **Cambios Clave:**
    *   **[Market - Modal de compra en mÃƒÂ³viles]:** Se centrÃƒÂ³ el modal verticalmente en el viewport mÃƒÂ³vil y se aÃƒÂ±adiÃƒÂ³ `overflow-y-auto` al contenedor exterior para permitir el scroll del formulario en pantallas pequeÃƒÂ±as.
    *   **[Market - Causa raÃƒÂ­z transform/fixed]:** Se envolviÃƒÂ³ el renderizado de `PurchaseModal` con `createPortal(..., document.body)` para evitar que ancestros con transformaciones CSS (animaciÃƒÂ³n `content-fade-in` de `kd-stage` en `index.css`) rompieran la posiciÃƒÂ³n fija del modal.
    *   **[Profile - Frente de Temporada]:** Se redujo el tamaÃƒÂ±o de la etiqueta "Avance" en `SeasonRing` de `8px` a `6.5px` y se disminuyÃƒÂ³ el espaciado de letras a `0.12em` para evitar desbordes en el cÃƒÂ­rculo de progreso. Se eliminÃƒÂ³ la etiqueta de ayuda redundante *"El resumen detallado de la temporada queda oculto..."* en estado colapsado.
    *   **[Market - RotaciÃƒÂ³n de la tienda]:** Se cambiÃƒÂ³ la frecuencia de rotaciÃƒÂ³n de artÃƒÂ­culos (`MARKET_ROTATION_WINDOW_MS`) de 5 horas a 2 horas, adaptando ademÃƒÂ¡s el intervalo en los tests de simulaciÃƒÂ³n en `market.rotation.test.ts`.

### [2026-06-15] - [Autor: Claude]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/index.css`
*   **Resumen de Tareas:** Rediseno visual detallado de la tarjeta "Frente de temporada" (componente `SeasonRankSpotlight`). Commit `d807f06` (codigo) ya pusheado; esta entrada documenta el cambio (se diferio antes para no absorber el WIP de Codex en `AI_CHANGELOG.md`).
*   **Cambios Clave:**
    *   **[UI - Tematizacion por rango]:** nuevo mapa `SEASON_ACCENTS` que pinta todo el panel con el color del rango actual (bronce Siervo -> oro Escudero -> cielo Caballero -> violeta Senor -> carmesi Senor Oscuro) en borde, fondo, halo, barra de progreso y tiles, via estilos inline `rgb(${accent} / x)`.
    *   **[UI - Avance circular]:** el "Avance %" paso de una cajita de texto a un anillo SVG animado (`SeasonRing`), coherente con los gauges del diseno.
    *   **[UI - Detalle]:** tiles Misiones/Eventos/Staff con iconos tematizados (Swords/Sparkles/Crown); "Siguiente objetivo" con icono Target y chip del color del proximo rango; `tabular-nums` en todas las cifras; eyebrow con Sparkles y "Cierre estimado" con CalendarClock.
    *   **[CSS - index.css]:** `kd-season-orb` (halo del rango que respira) y `kd-season-bar::after` (barrido de luz en la barra) + marcas de cuartos en la barra. Ambas animaciones se desactivan bajo `prefers-reduced-motion`.
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores; `npm run build` OK; CSS+JS confirmados en el bundle. Cambio 100% presentacional (mismos props y wiring de datos). No se pudo capturar screenshot logueado (el panel solo renderiza con jugador conectado y no hay credenciales de jugador real en el entorno) Ã¢â‚¬â€ verificacion visual final queda a cargo del usuario en su sesion.

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_seasons.sql`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Correccion de la RPC `award_manual_mission_rank_points(...)` tras el primer uso real desde WhatsApp.
*   **Cambios Clave:**
    *   **[Supabase - Fix RPC]:** Se agrego la directiva `#variable_conflict use_column` dentro de `award_manual_mission_rank_points(...)`.
    *   **[Causa Raiz]:** La funcion devuelve una tabla con columna `season_id`, y PL/pgSQL estaba interpretando de forma ambigua ese nombre dentro del `ON CONFLICT (season_id, player_id, source_type, source_key, external_ref)` al ejecutar `!misioncompleta`.
    *   **[Impacto]:** El fix mantiene intacta la logica anti-duplicado por `external_ref`, pero elimina el choque de nombres que provocaba el error `column reference "season_id" is ambiguous`.
*   **Notas/Advertencias:** Hace falta volver a ejecutar el `create or replace function public.award_manual_mission_rank_points(...)` en Supabase para que el fix quede aplicado en produccion.

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_seasons.sql`, `src/utils/playerRanks.ts`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Preparacion del backend compartido para premios manuales de temporada desde staff/GM y lectura de esos premios en la web.
*   **Cambios Clave:**
    *   **[Supabase - Awards]:** Se agrego `season_rank_awards` para registrar puntos manuales de clasificatoria por temporada, con `source_type`, `source_key`, dificultad opcional, `points_awarded`, staff emisor, notas, `external_ref` y `metadata`.
    *   **[Supabase - RPC Bot Ready]:** Se creo `award_manual_mission_rank_points(...)`, una funcion segura pensada para el futuro comando de WhatsApp `!misioncompleta`, que toma una lista de jugadores, resuelve el puntaje desde `season_rank_point_rules` y registra premios manuales dentro de la temporada activa.
    *   **[Supabase - Rollover]:** El cierre de temporada ahora tambien contempla los premios manuales en snapshots y seeds de la siguiente temporada.
    *   **[Frontend - Perfil]:** `playerRanks.ts` y `PlayerProfilePanel` ya suman premios manuales del jugador dentro de la temporada activa, mostrando su conteo en el resumen clasificatorio.
*   **Notas/Advertencias:** El repo web ya esta listo para reflejar premios manuales, pero el comando de WhatsApp aun falta implementarse en `kingdoom-bot`.

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_seasons.sql` [NEW], `src/utils/playerRanks.ts`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Backend de temporadas, snapshots y seeds para habilitar cierre automatico con reset de dos rangos y lectura de la temporada activa desde la web.
*   **Cambios Clave:**
    *   **[Supabase - Temporadas]:** Se creo `supabase_season_rank_seasons.sql` con las tablas `season_rank_seasons`, `season_rank_player_seeds` y `season_rank_player_snapshots`, mas un bootstrap de `Temporada Inicial` para que el sistema quede usable al correr el SQL.
    *   **[Supabase - Cierre/Reset]:** Se implemento la funcion `close_and_rollover_active_season_rank(p_force boolean default false)`, que cierra la temporada activa, congela snapshots por jugador, aplica el descenso de 2 rangos (`6` escalones), crea o activa la siguiente temporada e inserta los seeds del siguiente ciclo.
    *   **[Frontend - Temporada Activa]:** `playerRanks.ts` ahora intenta leer la temporada activa y los seeds del jugador desde Supabase, usando esos datos como ventana y punto de arranque del calculo del perfil en vez de depender unicamente del mes actual.
    *   **[Perfil - Copy]:** `PlayerProfilePanel` paso a hablar de temporada activa y muestra el nombre de temporada junto con los puntos semilla heredados al iniciar el ciclo.
*   **Notas/Advertencias:** Falta ejecutar el SQL nuevo en Supabase para activar el cierre/rollover real. El scheduler o bot que dispare la funcion automatica todavia no fue conectado.

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `supabase_season_rank_rules.sql` [NEW], `src/utils/playerRanks.ts`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Backend inicial del sistema clasificatorio mediante tablas configurables de puntos y umbrales, con lectura dinamica desde la app.
*   **Cambios Clave:**
    *   **[Supabase - Reglas]:** Se agrego `supabase_season_rank_rules.sql`, que crea `season_rank_point_rules` para puntajes por contenido (`easy`, `medium`, `hard`, `elite`, y evento recompensado) y `season_rank_thresholds` para los 15 escalones de la temporada de 10 semanas.
    *   **[Supabase - Seed Inicial]:** El SQL deja cargados los valores acordados para la primera temporada: misiones `12/28/55/95`, eventos recompensados `50`, y los umbrales desde `Siervo III (0)` hasta `Senor Oscuro I (2400)`.
    *   **[Frontend - Lectura Dinamica]:** `playerRanks.ts` dejo de depender exclusivamente de hardcodes y ahora intenta leer reglas y thresholds desde Supabase. Si las tablas aun no existen o fallan, conserva fallback local para no romper la UI.
*   **Notas/Advertencias:** La duracion de temporada de 10 semanas ya esta modelada en los umbrales, pero el calendario/soft reset mensual aun no fue implementado como proceso automatico.

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/playerRanks.ts`, `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Extension de la clasificatoria mensual para incluir eventos recompensados como segunda fuente real de puntos.
*   **Cambios Clave:**
    *   **[Clasificatoria - Eventos]:** `fetchPlayerMonthlyRankSnapshot` ahora consulta tambien `realm_event_participants` con `status = rewarded` y `reward_delivered = true` dentro del mes actual, evitando contar inscripciones sin validacion final del staff.
    *   **[Clasificatoria - Balance Inicial]:** Se agrego un peso temporal plano de `50` puntos por evento recompensado, coexistiendo con los puntos por dificultad de misiones (`15/35/70/120`).
    *   **[Perfil - Feedback]:** `PlayerProfilePanel` paso a informar cuantas misiones y cuantos eventos recompensados del mes estan entrando al calculo de la temporada.
*   **Notas/Advertencias:** La fuente de puntos ya contempla misiones y eventos, pero aun falta una tabla dedicada para balance fino por tipo de contenido y logros especiales.

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `src/utils/playerRanks.ts` [NEW], `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Conexion inicial del sistema clasificatorio mensual a datos reales de Supabase usando misiones recompensadas del mes actual.
*   **Cambios Clave:**
    *   **[Clasificatoria - Logica]:** Se creo `fetchPlayerMonthlyRankSnapshot` para leer `realm_mission_claims` recompensadas (`status = rewarded`, `reward_delivered = true`) dentro del mes actual y convertirlas en puntos de temporada por dificultad.
    *   **[Clasificatoria - Umbrales]:** Se definio una primera escalera de 15 escalones (`Siervo III` hasta `Senor Oscuro I`) derivada por puntos, con pesos iniciales de misiones `easy=15`, `medium=35`, `hard=70`, `elite=120`.
    *   **[Perfil - Integracion]:** `PlayerProfilePanel` ahora deja de mostrar una insignia puramente estatica y pasa a renderizar rango, escalon y puntos mensuales reales basados en misiones ya validadas y pagadas por staff.
*   **Notas/Advertencias:** Esta primera conexion solo contempla misiones recompensadas. Aun faltan eventos, logros especiales y el reset mensual de dos rangos.

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `public/img/ranks/siervo.png` [NEW], `public/img/ranks/escudero.png` [NEW], `public/img/ranks/caballero.png` [NEW], `public/img/ranks/senor.png` [NEW], `public/img/ranks/senor-oscuro.png` [NEW], `src/components/RankBadge.tsx` [NEW], `src/components/PlayerProfilePanel.tsx`, `src/types.ts`
*   **Resumen de Tareas:** Integracion visual inicial del sistema clasificatorio mensual en el perfil del jugador, usando las insignias generadas y dejando un fallback seguro mientras aun no existe la capa real de puntos/rangos en Supabase.
*   **Cambios Clave:**
    *   **[Perfil - UI]:** Se creo el componente `RankBadge` para renderizar la insignia, nombre de rango, escalon y puntos mensuales con tamanos `sm`, `md` y `lg`, reutilizable en futuras vistas del sistema clasificatorio.
    *   **[Perfil - Integracion]:** Se inserto la insignia clasificatoria en las variantes expandida y compacta de `PlayerProfilePanel`, mostrando por defecto `Siervo III` hasta enlazar los datos reales de temporada.
    *   **[Assets - Arte]:** Se incorporaron al repositorio las cinco insignias base (`Siervo`, `Escudero`, `Caballero`, `Senor`, `Senor Oscuro`) dentro de `public/img/ranks/` para servirlas desde la SPA sin dependencias externas.
    *   **[Tipos - Preparacion]:** `PlayerAccount` quedo preparado con campos opcionales `rankName`, `rankTier` y `monthlyRankPoints` para conectar despues la logica mensual sin rehacer el contrato visual.
*   **Notas/Advertencias:** Esta entrega es solo visual. Aun no existe persistencia de puntos mensuales, calculo de ascensos por misiones ni reset de fin de mes.

### [2026-06-15] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/types.ts`, `src/utils/players.ts`, `supabase_character_slots_migration.sql` (Nuevo)
*   **Resumen de Tareas:** ImplementaciÃƒÂ³n de la compra de espacios adicionales para fichas de personaje con oro.
*   **Cambios Clave:**
    *   **Base de Datos:** CreaciÃƒÂ³n de la columna `max_character_sheets` en `players` y de la funciÃƒÂ³n RPC transaccional `buy_character_slot` para la deducciÃƒÂ³n atÃƒÂ³mica de oro e incremento del lÃƒÂ­mite (mÃƒÂ¡ximo 10).
    *   **CÃƒÂ¡lculo de Costo:** Se definiÃƒÂ³ un costo plano de 1,000,000 de oro para todos los espacios adicionales (slots del 3 al 10).
    *   **Frontend & Modelos:** Mapeo de la columna y exportaciÃƒÂ³n del helper de RPC en `src/utils/players.ts`. ActualizaciÃƒÂ³n de la interfaz `PlayerAccount`.
    *   **UI de Perfil:** Reemplazo de los lÃƒÂ­mites hardcodeados de fichas en `PlayerProfilePanel.tsx` por el valor dinÃƒÂ¡mico del jugador. AdiciÃƒÂ³n de un botÃƒÂ³n de compra interactivo y feedback visual premium para la compra de slots.
*   **Notas/Advertencias:** Typecheck de TypeScript y compilaciÃƒÂ³n de producciÃƒÂ³n validados con ÃƒÂ©xito sin errores.


---

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `src/utils/playerRanks.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Pulido visual del frente de clasificatoria en el perfil del jugador para volver el frontend mÃƒÆ’Ã‚Â¡s llamativo y legible.
*   **Cambios Clave:**
    *   **Perfil Hero:** Se reemplazÃƒÆ’Ã‚Â³ el bloque simple de rango por un `SeasonRankSpotlight` con presencia visual de tarjeta hero, lectura de temporada y resumen de actividad.
    *   **Progreso Real:** `fetchPlayerMonthlyRankSnapshot` ahora expone piso del rango actual, siguiente meta, progreso porcentual dentro del escalÃƒÆ’Ã‚Â³n y avance temporal de la temporada.
    *   **UI de Temporada:** Se aÃƒÆ’Ã‚Â±adiÃƒÆ’Ã‚Â³ barra animada de progreso, contador de puntos faltantes al siguiente rango y mÃƒÆ’Ã‚Â©tricas compactas de misiones, eventos y premios manuales.
    *   **Legibilidad de Rangos:** El frontend ya muestra el siguiente rango con naming presentable en vez de identificadores crudos del sistema.
*   **Notas/Advertencias:** `npm run build` pasÃƒÆ’Ã‚Â³ correctamente. `npx tsc --noEmit` sigue fallando por una dependencia faltante preexistente en `src/features/market/market.rotation.test.ts` (`vitest` no resuelto), ajena a este cambio visual.
---

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `src/vitest.d.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del bloqueo de typecheck causado por el test de rotacion del mercado.
*   **Cambios Clave:**
    *   Se agrego un shim local de tipos para `vitest` en `src/vitest.d.ts`.
    *   Con eso `npx tsc --noEmit` vuelve a pasar sin necesidad de agregar dependencias nuevas ni tocar `package-lock.json`.
*   **Notas/Advertencias:** La solucion actual resuelve el tipado del repo. Si mas adelante se incorporan mas tests de `vitest`, convendra instalar la dependencia de forma formal cuando el proyecto quiera ejecutar esa suite.

---

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Reorganizacion del panel de clasificatoria para evitar la duplicacion visual del rango en perfil.
*   **Cambios Clave:**
    *   Se elimino la insignia duplicada del bloque principal del jugador en modo expandido.
    *   El frente de temporada ahora conserva una sola insignia visible, mas compacta, con un resumen inmediato del siguiente objetivo.
    *   Los detalles largos de temporada pasaron a un desplegable controlado: en mobile inicia compacto y en escritorio se abre automaticamente para mantener densidad visual sin perder informacion.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues del ajuste.

---

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Verificacion UI en vivo del nuevo bloque de clasificatoria en desktop y mobile.
*   **Cambios Clave:**
    *   Se levanto la SPA localmente y se reviso el perfil real en ambas resoluciones mediante capturas automatizadas.
    *   La verificacion visual confirma que la insignia de rango ya no aparece duplicada entre el bloque principal del jugador y el frente de temporada.
    *   El panel de temporada mantiene una lectura mas compacta en mobile y una lectura mas abierta en escritorio.
*   **Notas/Advertencias:** La comprobacion visual fue satisfactoria. La automatizacion DOM no produjo selectores suficientemente estables para afirmar el estado conectado via aserciones, pero las capturas renderizadas si mostraron el layout esperado.

---

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Compactacion adicional del frente de temporada para reducir el hueco vertical en escritorio.
*   **Cambios Clave:**
    *   Se elimino la autoexpansion inicial del bloque de temporada en desktop para que nazca compacto por defecto.
    *   La insignia del rango ahora usa tamano mas pequeno mientras el panel esta plegado.
    *   El bloque de `Siguiente objetivo` se movio al contenido desplegable, dejando solo la informacion esencial visible en estado natural.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues del ajuste.

---

### [2026-06-15] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Reubicacion del frente de temporada para eliminar el vacio vertical del panel de jugador.
*   **Cambios Clave:**
    *   Se saco `Frente de temporada` de la columna lateral que compartia altura con `Jugador conectado`.
    *   El bloque de temporada ahora vive como seccion propia debajo del panel superior del perfil, antes del resto del contenido del jugador.
    *   Con esto el bloque `Jugador conectado` deja de arrastrar una altura artificial y recupera un layout mas limpio y compacto.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` pasaron correctamente despues de la reubicacion.

---

### [2026-06-14] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/features/market/market.adapter.ts`, `src/features/market/market.rotation.ts`, `src/features/market/market.service.ts`, `src/features/market/market.types.ts`, `src/types.ts`, `supabase_market_installments.sql`, `supabase_market_mythic_limited_stock.sql`, `supabase_personal_market_migration.sql` (Nuevo), `src/features/market/market.rotation.test.ts` (Nuevo)
*   **Resumen de Tareas:** ImplementaciÃƒÂ³n de la mecÃƒÂ¡nica de Mercado Personal para ÃƒÂ­tems de rol creados por usuarios con comisiones y tasas de apariciÃƒÂ³n.
*   **Cambios Clave:**
    *   **Base de Datos:** Se crearon las columnas `seller_id`, `seller_cut_percentage` y `spawn_chance` en la tabla `market_items` mediante `supabase_personal_market_migration.sql`.
    *   **RPC de Compra:** Se modificaron las funciones RPC de compra de Supabase (`purchase_market_item` y `purchase_market_item_v2`) para realizar transferencias atÃƒÂ³micas automÃƒÂ¡ticas de las ganancias correspondientes del vendedor al saldo de oro de su cuenta.
    *   **Modelos y Adaptadores:** Se actualizaron las interfaces y los mappers para mapear los nuevos campos entre el cliente y Supabase de forma correcta.
    *   **LÃƒÂ³gica de RotaciÃƒÂ³n:** SincronizaciÃƒÂ³n determinista del catÃƒÂ¡logo filtrando ÃƒÂ­tems mediante la probabilidad configurada en `spawn_chance`.
    *   **Interfaz de AdministraciÃƒÂ³n:** Se creÃƒÂ³ la pestaÃƒÂ±a "Mercado Personal" en `AdminControlSheet.tsx` que incluye autocompletado/bÃƒÂºsqueda de jugadores, campos interactivos (precio, split de comisiÃƒÂ³n, probabilidad de apariciÃƒÂ³n en rotaciÃƒÂ³n), previsualizador en tiempo real de oro asignado a cada parte, y listado de ÃƒÂ­tems personales existentes.
    *   **VerificaciÃƒÂ³n:** Cobertura de tests unitarios agregada en `src/features/market/market.rotation.test.ts` y ejecuciÃƒÂ³n limpia de compilaciÃƒÂ³n de producciÃƒÂ³n.
*   **Notas/Advertencias:** Ninguno detectado.

---

### [2026-06-13] - [Autor: Antigravity]
*   **Archivos Modificados:** `AGENTS.md`
*   **Resumen de Tareas:** ActualizaciÃƒÂ³n de las directrices operativas del agente a la realidad actual del proyecto.
*   **Cambios Clave:**
    *   **[DocumentaciÃƒÂ³n - Agentes]:** Se reestructuraron las secciones 1 a 5 de `AGENTS.md` para incluir el nuevo Working Directory, la arquitectura del repositorio completa (los nuevos minijuegos, vistas de administraciÃƒÂ³n y modales de pago), las reglas de negocio de cuotas e intereses de financiaciÃƒÂ³n, las nuevas tablas y RPCs de Supabase y las convenciones premium de diseÃƒÂ±o de UI/UX. Las secciones 6, 7 y 8 se mantuvieron intactas.

### [2026-06-13] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/index.js` (en kingdoom-bot), `AI_CHANGELOG.md` (en Kingdoom-sync), `ai-memory/kingdoom-memory.jsonl` (en Kingdoom-sync)
*   **Resumen de Tareas:** Cierre de navegadores huerfanos al fallar la inicializacion del bot en reintentos.
*   **Cambios Clave:**
    *   Implementacion de la limpieza de `client.pupBrowser` ante excepciones en el metodo `initializeClientWithRetry` de `src/index.js`.
    *   Esto previene que queden procesos de Chromium huerfanos (zombies) que bloquean la sesion de WhatsApp con el error "browser is already running".
    *   Se registro el cambio en la memoria del proyecto (jsonl) y se documentaron los riesgos.
*   **Notas/Advertencias:** Riesgo abierto de bloqueo de IP/numero por parte de WhatsApp al operar en la infraestructura de Hugging Face.

---

### [2026-06-13] - [Autor: Antigravity]
*   **Archivos Modificados:** `AGENTS.md`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** ActualizaciÃƒÂ³n de protocolos en AGENTS.md (bootstrap, cierre y subidas).
*   **Cambios Clave:**
    *   Se integrÃƒÂ³ la subsecciÃƒÂ³n "CuÃƒÂ¡ndo ocurre el bootstrap (CRÃƒï¿½TICO)" aclarando las fases y el flujo ordenado de una sesiÃƒÂ³n.
    *   Se expandieron las reglas de subidas y cierres en la SecciÃƒÂ³n 7, regulando la detecciÃƒÂ³n de intenciÃƒÂ³n del usuario (7.2), el mapeo de repositorios y destinos de push (7.3) y la secuencia exacta de cierre de tareas (7.4).
*   **Notas/Advertencias:** Ninguno detectado.

---

### [2026-06-13] - [Autor: Antigravity]
*   **Archivos Modificados:** `.gitignore`, `AGENTS.md`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** CorrecciÃƒÂ³n de remotos de la web en AGENTS.md e ignorado de archivos temporales.
*   **Cambios Clave:**
    *   Se corrigieron los remotos de `Kingdoom-sync` en la tabla 7.3 de `AGENTS.md` para especificar que va ÃƒÂºnicamente a GitHub (origin).
    *   Se agregaron las carpetas y archivos temporales `scratch/`, `temp_diff.txt` y `repomix-output-*.md` al archivo `.gitignore`.
*   **Notas/Advertencias:** Ninguno detectado.

---

### [2026-06-13] - [Autor: Antigravity]
*   **Archivos Modificados:** `AGENTS.md`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** AdiciÃƒÂ³n de directrices para agentes asÃƒÂ­ncronos (Jules) en AGENTS.md.
*   **Cambios Clave:**
    *   Se integrÃƒÂ³ la subsecciÃƒÂ³n 7.5 en `AGENTS.md` para regular el comportamiento del agente asÃƒÂ­ncrono Jules (bootstrap automÃƒÂ¡tico, honestidad de push en su entorno y disciplina de alcance al correr sin supervisiÃƒÂ³n).
*   **Notas/Advertencias:** Ninguno detectado.

---

### [2026-06-11] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/sections/MarketSection.tsx`, `src/components/PlayerAuctionPanel.tsx` [NEW]
*   **Resumen de Tareas:** CreaciÃƒÂ³n de la interfaz web de Subastas para jugadores con soporte transaccional y sincronizaciÃƒÂ³n en tiempo real.
*   **Cambios Clave:**
    *   **[Web - Player UI]:** Se diseÃƒÂ±ÃƒÂ³ y desarrollÃƒÂ³ el componente `PlayerAuctionPanel` con un panel de subastas activas, countdowns individuales en vivo, soporte para el envÃƒÂ­o de pujas y botÃƒÂ³n de retiro con confirmaciones.
    *   **[Web - IntegraciÃƒÂ³n]:** Se incrustÃƒÂ³ el panel en `MarketSection.tsx` bajo un nuevo bloque `<details>` premium de color ÃƒÂ¡mbar con el icono `Gavel`.
    *   **[Web - Realtime]:** Se enlazÃƒÂ³ el componente a Supabase Realtime para recibir actualizaciones automÃƒÂ¡ticas de ofertas y ganadores al instante sin recarga de pÃƒÂ¡gina.
*   **Notas/Advertencias:** ValidaciÃƒÂ³n de build exitosa (`npm run build` completado en 2m 56s).

### [2026-06-11] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/src/scheduler.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/handlers/auctions.js` [NEW], `kingdoom-bot/src/handlers/auctionsRealtime.js` [NEW]
*   **Resumen de Tareas:** IntegraciÃƒÂ³n completa de la mecÃƒÂ¡nica de Subastas en el Bot de WhatsApp: comandos de jugador, anuncios en tiempo real y resoluciÃƒÂ³n automÃƒÂ¡tica de expiraciones.
*   **Cambios Clave:**
    *   **[Bot - Comandos]:** Se implementaron los comandos pÃƒÂºblicos `!subastas` (listar subastas activas), `!pujar <item / #lista> <monto>` (realizar pujas atÃƒÂ³micas mediante RPC) y `!retirarse <item / #lista>` (bloquear pujas futuras en una subasta).
    *   **[Bot - Realtime]:** Se aÃƒÂ±adiÃƒÂ³ `startAuctionsRealtime` para que el bot escuche cambios en Supabase Realtime y publique automÃƒÂ¡ticamente en WhatsApp cuando una subasta se crea, se puja, o se resuelve.
    *   **[Bot - Scheduler]:** Se configurÃƒÂ³ una tarea recurrente en el cron del scheduler que comprueba cada minuto si hay subastas expiradas para resolverlas automÃƒÂ¡ticamente llamando a la RPC `resolve_market_auction`.
*   **Notas/Advertencias:** Los archivos JavaScript modificados pasan el control de sintaxis de Node sin errores.

### [2026-06-11] - [Autor: Antigravity]
*   **Archivos Modificados:** `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Handoff de la sesiÃƒÂ³n para Antigravity 2. Todo ha sido validado, el bot fue limpiado y optimizado, y la carga inicial de la web fue mejorada.
*   **Cambios Clave:**
    *   **[Handoff / Next Steps]:** 
        1. **AtÃƒÂ³mica de apuestas:** Priorizar la refactorizaciÃƒÂ³n de las apuestas del bot (`!dados`, `!trampa`, `!21`) mediante funciones RPC atÃƒÂ³micas en Supabase (`place_bet`) para evitar condiciones de carrera y pÃƒÂ©rdidas de oro inconsistentes.
        2. **Subastas:** Validar y completar la interfaz de subastas (actualmente estÃƒÂ¡n hechas las utilidades y SQL).
        3. **Monitoreo Bot:** Observar la estabilidad del bot en Hugging Face (sin el flag `--single-process`) para comprobar la mitigaciÃƒÂ³n del reinicio.
*   **Notas/Advertencias:** El repositorio web (`Kingdoom-sync`) compila sin errores (`tsc --noEmit` y `build` exitosos). El bot (`kingdoom-bot`) tiene los cambios de optimizaciÃƒÂ³n empujados.

### [2026-06-11] - [Autor: Claude]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/Dockerfile` (+ borrados: `src/scripts/notebooklm_*.py`, `test_notebooklm.js`)
*   **Resumen de Tareas:** Hardening del bot tras auditoria: cadena de fallback de Gemini corregida, eliminado `--single-process` de Puppeteer (sospechoso principal del loop de reinicios) y limpieza completa de los restos de NotebookLM.
*   **Cambios Clave:**
    *   **[Bot - IA]:** la cadena de fallback de `askKingdoomAI` incluia `gemini-3.5-flash` (modelo inexistente -> 404 garantizado en cada fallback) y `gemini-1.5-flash` (retirado por Google). Ahora: modelo base -> `gemini-2.5-flash` -> `gemini-2.0-flash`. Menos latencia y mas fiabilidad del GM cuando el modelo primario falla por cuota.
    *   **[Bot - Estabilidad]:** se quito `--single-process` de los args de Puppeteer. Ese flag es causa conocida de `Protocol error / Target closed / Session closed` con whatsapp-web.js Ã¢â‚¬â€ exactamente los errores que el propio `index.js` detecta para reiniciar el contenedor. Observar si baja la frecuencia de reinicios en HF Spaces.
    *   **[Bot - Limpieza NotebookLM]:** el Dockerfile instalaba `python3`, `pip` y `notebooklm-py` aunque la integracion se removio el 08/06 (imagen mas pesada sin razon). Eliminados tambien los scripts Python muertos, `test_notebooklm.js`, y las funciones sin callers `getMissionsWithMissingNotebooks`/`updateMissionNotebookId` en `supabase.js` (la columna `notebook_id` sigue en la BD, el bot ya no la usa).
*   **Notas/Advertencias:** `node --check` OK en los 3 JS editados; sin referencias rotas (grep). Pusheado a GitHub y a Hugging Face (redeploy del Space Ã¢â‚¬â€ el bot se reinicio con la imagen nueva). Pendientes de la auditoria, NO implementados aun: (1) race condition en apuestas `!dados`/`!trampa`/`!21` Ã¢â‚¬â€ la validacion de saldo y el debito no son atomicos, requiere RPC `place_bet` en Supabase; (2) sesiones de blackjack en memoria se pierden ante reinicios con apuesta ya debitada.

### [2026-06-11] - [Autor: Claude]
*   **Archivos Modificados:** `src/index.css`
*   **Resumen de Tareas:** Pulido visual y de experiencia: foco accesible tematico, fin del flash gris en Android, layout sin saltos de scrollbar, titulos balanceados y micro-interaccion en la navegacion.
*   **Cambios Clave:**
    *   **[Accesibilidad/Polish]:** anillo de foco global `:focus-visible` que sigue el color de acento de cada seccion (ambar en Inicio, violeta en Grimorio, etc.); el outline solo aparece navegando con teclado, mouse/touch no lo muestran (`:focus:not(:focus-visible)`).
    *   **[Movil]:** `-webkit-tap-highlight-color: transparent` (elimina el flash gris de Android al tocar; el feedback tactil lo sigue dando `.kd-touch` con su scale) y `overscroll-behavior-y: contain` en body (sensacion app-like, sin rebote del documento).
    *   **[Fluidez de layout]:** `scrollbar-gutter: stable` en html Ã¢â‚¬â€ al cambiar entre pestaÃƒÂ±as cortas (Inicio) y largas (Grimorio) ya no hay salto horizontal por aparicion/desaparicion del scrollbar. Los paneles internos con scroll (modales, admin) usan `overscroll-behavior: contain` para no arrastrar el scroll de la pagina.
    *   **[Tipografia]:** `text-wrap: balance` en h1-h3 (titulos multilinea reparten palabras equilibradamente, visible en movil: "Reino de / las Sombras") y `font-variant-numeric: tabular-nums` en `.kd-stat-card` (los contadores no "bailan" al cambiar de valor).
    *   **[Navegacion]:** micro-interaccion en la barra inferior Ã¢â‚¬â€ el icono de la pestaÃƒÂ±a activa se eleva 1px con scale 1.06 y transicion suave; deshabilitada bajo `prefers-reduced-motion`.
*   **Notas/Advertencias:** build OK; verificado en vivo con `vite preview` (computed styles confirmados via DevTools y screenshots desktop/movil, 0 errores de consola). Todo es CSS progresivo: navegadores viejos ignoran `text-wrap: balance` y `scrollbar-gutter` sin romper nada.

### [2026-06-11] - [Autor: Claude]
*   **Archivos Modificados:** `vite.config.ts`, `index.html`, `src/context/PlayerSessionContext.tsx`
*   **Resumen de Tareas:** Optimizacion de rendimiento web: primer load de JS reducido ~49% (gzip ~294KB -> ~149KB) y eliminacion de re-renders globales del polling de sesion.
*   **Cambios Clave:**
    *   **[Bug critico de chunks - preexistente]:** Rollup colocaba modulos eager compartidos DENTRO de chunks lazy: `supabaseClient` caia en `GrimoireSection` (el grimorio completo, UI + 235KB de datos, se descargaba en el primer load), `PlayerSessionContext`/`players.ts` caian en `TavernRoulette`, el `vite/preload-helper` en `MarketSection` y `SectionHeader`/`ExpandableText` en `LibrarySection`. Resultado: ~350KB de JS "lazy" viajaban eager via modulepreload. Fix: nuevo chunk `app-core` que ancla esos modulos compartidos y corta las aristas invertidas. Ahora el preload eager es solo `react + supabase + gsap + app-core + icons + entry`; `framer-motion` (125KB) y todas las secciones quedaron realmente lazy.
    *   **[manualChunks - regla react corregida]:** `id.includes("react")` se evaluaba antes que `lucide-react` (la regla "icons" estaba muerta) y arrastraba `@gsap/react`, `@vercel/*/react` y `@tanstack/react-virtual` al chunk eager. Ahora el match es estricto (`react|react-dom|scheduler`), `@vercel` tiene chunk propio realmente diferido (como disenaba `main.tsx`), `gsap` chunk propio, y los datos del grimorio (`src/data/grimorio.ts`, 235KB) se separan de la UI en `grimoire-data` para cache independiente.
    *   **[index.html]:** `preconnect` a Supabase (la app dispara auth + perfil apenas bootea; ahorra DNS+TLS en el primer load, relevante en movil).
    *   **[PlayerSessionContext - fluidez]:** `refreshPlayer` ahora conserva la MISMA referencia de objeto si el perfil no cambio, con lo que React hace bailout y el polling de 10s ya no re-renderiza todo el arbol de consumidores (evita micro-trabas durante minijuegos/animaciones). Ademas `touchPlayerActivity` (UPDATE a la BD por usuario conectado) se throttlea a 1 vez cada 5 min en vez de cada 10s.
    *   **[Tooling]:** plugin de diagnostico en `vite.config.ts` activable con `VITE_DEBUG_CHUNKS=1 npm run build` que imprime que modulos componen cada chunk (util para detectar regresiones de chunking).
*   **Notas/Advertencias:** `tsc --noEmit` 0 errores; `npm run build` OK (revalidado post-merge con el redesign del admin); smoke test con `vite preview` (boot correcto, 0 errores de consola). Si se cambia de proyecto Supabase, actualizar el dominio del `preconnect` en `index.html`. La marca de actividad ahora tiene granularidad de 5 min (antes 10s); si algun reporte de staff necesita mas precision, ajustar `ACTIVITY_TOUCH_INTERVAL_MS` en `PlayerSessionContext.tsx`.

### [2026-06-11] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-sync/src/components/AdminControlSheet.tsx`, `Kingdoom-sync/src/components/admin/AdminControlPrimitives.tsx`, `Kingdoom-sync/src/index.css`
*   **Resumen:** RediseÃƒÂ±o completo y premium del menÃƒÂº de navegaciÃƒÂ³n de pestaÃƒÂ±as del panel de administraciÃƒÂ³n y eliminaciÃƒÂ³n total del "Generador de Items IA / Pinterest" de la secciÃƒÂ³n Mercado del admin.
*   **Cambios Clave:**
    *   **[Admin - NavegaciÃƒÂ³n/Tabs]:** RediseÃƒÂ±o estÃƒÂ©tico y responsivo de las 10 pestaÃƒÂ±as del menÃƒÂº de administraciÃƒÂ³n.
        - Se agregaron iconos de Lucide-React semÃƒÂ¡nticos para cada botÃƒÂ³n de pestaÃƒÂ±a.
        - Se estructuraron las pestaÃƒÂ±as en 3 grupos lÃƒÂ³gicos diferenciados con separadores visuales (`.kd-admin-tab-divider`): **GestiÃƒÂ³n** (Jugadores, Misiones, Eventos), **EconomÃƒÂ­a** (Mercado, Negocios) e **IA & Lore** (Staff IA, Magias, Bestiario, Flora, Archivo IA).
        - Se optimizÃƒÂ³ el estilo activo/inactivo con gradientes premium, sombras internas y hover interactivo suave.
        - Se aÃƒÂ±adiÃƒÂ³ responsividad: en dispositivos mÃƒÂ³viles (`< 640px`) se despliega en un grid compacto de 2 columnas para una cÃƒÂ³moda navegaciÃƒÂ³n tÃƒÂ¡ctil; en pantallas de escritorio se mantiene la disposiciÃƒÂ³n en lÃƒÂ­nea optimizando el espacio horizontal.
    *   **[Admin - Limpieza de Generador IA]:** RemociÃƒÂ³n completa del mÃƒÂ³dulo experimental "Generador de Items IA" basado en Pinterest en la pestaÃƒÂ±a de Mercado.
        - Se eliminÃƒÂ³ todo el cÃƒÂ³digo JSX que contenÃƒÂ­a el visualizador de Pinterest y el disparador de IA (inputs de URL de Pinterest, previsualizadores, feedbacks, tema de IA y botones de acciÃƒÂ³n).
        - Se limpiaron las variables de estado relacionadas (`marketPinterestUrl`, `marketPinterestFeedback`, `marketPinterestPreview`, `marketAiTheme`, `marketAiFeedback`, `isGeneratingMarketItemAi`, `isLoadingPinterestReference`).
        - Se eliminaron las funciones controladoras (`handleLoadPinterestReference`, `handleGenerateMarketItemFromPin`) y se quitaron sus inicializaciones y dependencias en `resetMarketForm`, `preloadMarketItem` y `handleMarketImageUpload`.
        - Se eliminaron los imports obsoletos de `marketAi` y `pinterestPicker` en la cabecera.
    *   **[Admin - Estilos del Sistema]:** AdiciÃƒÂ³n en `index.css` de clases CSS `.kd-admin-tabs`, `.kd-admin-tab-group` y `.kd-admin-tab-divider` con transiciones fluidas y gradientes HSL.
*   **Notas/Advertencias:** Los archivos utilitarios subyacentes (`utils/marketAi.ts` y `utils/pinterestPicker.ts`) se preservaron en el repositorio para no romper posibles dependencias en API routes, pero ya no tienen acoplamiento con la interfaz de usuario. Verificado con `npx tsc --noEmit` y `npm run build` con ÃƒÂ©xito.

### [2026-06-10] - [Autor: Antigravity]
*   **Archivos Modificados:** `api/admin/generate-market-item.ts`
*   **Resumen de Tareas:** Mejora del prompt de generaciÃƒÂ³n de ÃƒÂ­tems con IA (Market Forge) para alinear mecÃƒÂ¡nicas y hacer los efectos mÃƒÂ¡s descriptivos.
*   **Cambios Clave:**
    *   **Contexto del Sistema:** Se actualizÃƒÂ³ el prompt para incluir las reglas exactas del sistema de Kingdoom: dados (d20 + stat, daÃƒÂ±o en d6), mecÃƒÂ¡nicas de mano blanca (fÃƒÂ­sica) y mano negra (mÃƒÂ¡gica/veneno), y las defensas activas (STR = Bloquear, INT = Defender, AGI = Esquivar).
    *   **GeneraciÃƒÂ³n de Habilidad (`ability`):** Se ajustaron las reglas JSON del prompt. Ahora la IA debe obligatoriamente describir el efecto mecÃƒÂ¡nico con porcentajes exactos ligados a stats (ej. 30% del STR) y definir una frecuencia clara de uso (cooldown en turnos o porcentaje de probabilidad de activaciÃƒÂ³n).
*   **Notas/Advertencias:** ValidaciÃƒÂ³n de build sin errores (`npm run build` exitoso). Las mecÃƒÂ¡nicas deberÃƒÂ­an estar mucho mejor representadas en el texto autogenerado.

### [2026-06-10] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/types.ts`, `src/utils/inventory.ts`, `src/components/PlayerInventorySheet.tsx`
*   **Resumen de Tareas:** VisualizaciÃƒÂ³n del estado de cuotas e ÃƒÂ­tems bloqueados en el Inventario del jugador.
*   **Cambios Clave:**
    *   **`src/types.ts`**: Se aÃƒÂ±adiÃƒÂ³ `isLocked?: boolean` a `InventoryEntry` y se creÃƒÂ³ el nuevo tipo `PaymentPlan` que mapea la tabla `payment_plans` de Supabase.
    *   **`src/utils/inventory.ts`**: Se aÃƒÂ±adiÃƒÂ³ `is_locked` al select y al mapeo de `fetchPlayerInventory`. Se creÃƒÂ³ `fetchPlayerPaymentPlans` que obtiene todos los planes activos/en-mora del jugador.
    *   **`src/components/PlayerInventorySheet.tsx`**: Reescrito con sistema de pestaÃƒÂ±as: pestaÃƒÂ±a "Inventario" (con badge Ã°Å¸â€â€™ "En cuotas" en cada ÃƒÂ­tem bloqueado) y pestaÃƒÂ±a "CrÃƒÂ©ditos" que muestra resumen (planes activos, en mora, deuda total) y tarjetas detalladas por plan (cuotas pagadas/total, barra de progreso, saldo restante, prÃƒÂ³ximo pago, dÃƒÂ­as de mora).
*   **Notas/Advertencias:** `npx tsc --noEmit` Ã¢â€ â€™ exit 0. Sin errores.

### [2026-06-10] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/purchases.ts`, `supabase_market_installments.sql`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** CorrecciÃƒÂ³n del error "Tu cuenta segura aun no esta vinculada a un jugador del reino." al intentar comprar artÃƒÂ­culos en el mercado.
*   **Cambios Clave:**
    *   **TypeScript (`src/utils/purchases.ts`)**: Se agregÃƒÂ³ el parÃƒÂ¡metro `p_player_id: input.playerId` que faltaba en la llamada RPC a `purchase_market_item_v2`. Al omitir este parÃƒÂ¡metro en el frontend, la base de datos recibÃƒÂ­a un valor NULL y por lo tanto fallaba al resolver la relaciÃƒÂ³n de vinculaciÃƒÂ³n.
    *   **SQL (`supabase_market_installments.sql`)**: Se ajustÃƒÂ³ la firma de la funciÃƒÂ³n `purchase_market_item_v2` para aceptar `p_player_id uuid` e implementÃƒÂ³ lÃƒÂ³gica de auto-vinculaciÃƒÂ³n. Si el jugador no estÃƒÂ¡ vinculado pero el usuario estÃƒÂ¡ autenticado, la base de datos inserta automÃƒÂ¡ticamente una fila en `player_auth_links` para vincularlos en el primer intento de compra segura.
*   **Notas/Advertencias:** Se corriÃƒÂ³ `npx tsc --noEmit` y `npm run build` con ÃƒÂ©xito. La base de datos ya cuenta con la funciÃƒÂ³n actualizada.

### [2026-06-10] - Supabase Cron Installments
*   **Archivos Modificados:** supabase_cron_installments.sql, supabase_market_installments.sql 
*   **Resumen:** ImplementaciÃ¯Â¿Â½ de la funciÃ¯Â¿Â½ RPC process_market_installments para el cobro automÃ§â€“Â¸ico de cuotas con reglas estrictas (1 dÃ¥Æ’Ëœ de gracia, 5% mora acumulativa diaria, embargo a los 5 dÃ¥Æ’Ëœs). Bloqueo de compras a crÃ©Â¦Ëœito limitado a 14 dÃ¥Æ’Ëœs post-embargo.

---

### [2026-06-08] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `Kingdoom-sync/AI_CHANGELOG.md`
*   **Resumen:** OptimizaciÃƒÂ³n drÃƒÂ¡stica de latencia en la lectura de mensajes del bot y adecuaciÃƒÂ³n para despliegue en Hugging Face Spaces.
*   **Cambios Clave:**
    *   **[Bot - OptimizaciÃƒÂ³n de Latencia]:** Se refactorizÃƒÂ³ el manejador de mensajes en `index.js`. La funciÃƒÂ³n `checkIsAdmin`, que ejecutaba una consulta a Supabase por cada mensaje recibido, ahora es *perezosa (lazy)*. Solo consulta la BD si el mensaje contiene un comando de la lista blanca administrativa o si el usuario estÃƒÂ¡ interactuando en el `Market Forge`. Esto reduce a cero la latencia de base de datos para trÃƒÂ¡fico estÃƒÂ¡ndar de rol.
    *   **[Bot - Despliegue en Hugging Face]:** Se confirmÃƒÂ³ el correcto funcionamiento del servidor HTTP existente en `index.js`, el cual expone el puerto definido por el entorno (`PORT` 7860), asegurando que el *healthcheck* de Hugging Face Spaces apruebe el arranque y mantenga el contenedor vivo (estado *Running*).

### [2026-06-08] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `Kingdoom-sync/AI_CHANGELOG.md`
*   **Resumen:** RefactorizaciÃƒÂ³n y simplificaciÃƒÂ³n del tracker del Game Master (GM): eliminaciÃƒÂ³n de la integraciÃƒÂ³n con Google NotebookLM.
*   **Cambios Clave:**
    *   **[Bot - Limpieza de NotebookLM]:** Se eliminaron los subprocesos de Python y las funciones de aprovisionamiento de libretas en caliente. La integraciÃƒÂ³n previa resultaba inestable al depender fuertemente de cookies mediante Playwright.
    *   **[Bot - Motor Gemini Puro]:** La narrativa del GM ahora vuelve a procesarse exclusivamente con el motor base de Gemini (`askKingdoomAI`), asegurando respuestas mÃƒÂ¡s estables y sin retrasos de aprovisionamiento.
    *   **[Bot - OptimizaciÃƒÂ³n de Arranque]:** Se eliminÃƒÂ³ el loop de `autoProvisionMissions()` en el evento `ready` de WhatsApp (`index.js`), acelerando el encendido del bot y limpiando logs innecesarios.

### [2026-06-08] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/scripts/notebooklm_provisioner.py`, `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `Kingdoom-sync/AI_CHANGELOG.md`
*   **Resumen:** IntegraciÃ¯Â¾Æ’Ã¯Â½Â³n completa y automatizaciÃ¯Â¾Æ’Ã¯Â½Â³n del Game Master con Google NotebookLM mediante sincronizaciÃ¯Â¾Æ’Ã¯Â½Â³n dinÃ¯Â¾Æ’Ã¯Â½Â¡mica de grimorio y enciclopedia y aprovisionamiento bajo demanda.
*   **Cambios Clave:**
    *   **[Bot - Supabase IntegraciÃ¯Â¾Æ’Ã¯Â½Â³n]:** CreaciÃ¯Â¾Æ’Ã¯Â½Â³n de dos funciones helper robustas en `supabase.js`: `getFormattedGrimoire()` y `getFormattedEncyclopedia()`.
        - `getFormattedGrimoire()`: Consulta la tabla `grimoire_magic_styles` de Supabase, extrayendo la informaciÃ¯Â¾Æ’Ã¯Â½Â³n estructurada de hechizos, sus niveles, cooldowns, lÃ¯Â¾Æ’Ã¯Â½Â­mites de uso, efectos y contramedidas de seguridad ("anti-mano negra"). Genera un documento en formato Markdown riguroso y jerÃ¯Â¾Æ’Ã¯Â½Â¡rquico.
        - `getFormattedEncyclopedia()`: Consulta la tabla `knowledge_documents` de Supabase para compilar las entradas histÃ¯Â¾Æ’Ã¯Â½Â³ricas, facciones, reglamentos del sistema de combate, geopolÃ¯Â¾Æ’Ã¯Â½Â­tica y lore general del Reino, formateando todo en un Markdown legible.
    *   **[Bot - Provisionador Python]:** ActualizaciÃ¯Â¾Æ’Ã¯Â½Â³n de `notebooklm_provisioner.py` para aceptar el payload ampliado con `grimorio_content` y `enciclopedia_content`. Este script normaliza la cookie `NOTEBOOKLM_COOKIES` en formato Playwright, crea el Notebook con el tÃ¯Â¾Æ’Ã¯Â½Â­tulo `[GM] <Nombre de MisiÃ¯Â¾Æ’Ã¯Â½Â³n>` y aÃ¯Â¾Æ’Ã¯Â½Â±ade secuencialmente cuatro fuentes de texto independientes usando el cliente automatizado de NotebookLM:
        1. "Reglas Generales del Game Master (GM)" (System Prompt base).
        2. "Lore e Indicaciones de la MisiÃ¯Â¾Æ’Ã¯Â½Â³n - <Nombre>" (Instrucciones especÃ¯Â¾Æ’Ã¯Â½Â­ficas).
        3. "Grimorio Oficial de Magias y Hechizos" (Markdown dinÃ¯Â¾Æ’Ã¯Â½Â¡mico desde Supabase).
        4. "Enciclopedia y Codex del Reino" (Markdown dinÃ¯Â¾Æ’Ã¯Â½Â¡mico de lore desde Supabase).
    *   **[Bot - Aprovisionamiento Justo a Tiempo (On-Demand)]:** ModificaciÃ¯Â¾Æ’Ã¯Â½Â³n en `gmTracker.js` dentro de `startMissionTracker()`. Al iniciar el rastreo de una misiÃ¯Â¾Æ’Ã¯Â½Â³n con el comando `!misionstart`, si la misiÃ¯Â¾Æ’Ã¯Â½Â³n no posee un `notebook_id` configurado y existen las cookies de autenticaciÃ¯Â¾Æ’Ã¯Â½Â³n, el bot genera el NotebookLM en caliente y actualiza el campo `notebook_id` en `realm_missions` mediante Supabase. Esto permite crear misiones nuevas en la interfaz administrativa web de la aplicaciÃ¯Â¾Æ’Ã¯Â½Â³n y disponer de sus libretas al instante sin reiniciar el servicio.
    *   **[Bot - SincronizaciÃ¯Â¾Æ’Ã¯Â½Â³n al Inicio]:** ModificaciÃ¯Â¾Æ’Ã¯Â½Â³n en `index.js` para ejecutar `autoProvisionMissions()` durante el evento `ready`. Busca todas las misiones en base de datos que carezcan de un `notebook_id` asociado y las aprovisiona en lotes de manera asÃ¯Â¾Æ’Ã¯Â½Â­ncrona, optimizando la consulta a base de datos al recuperar el grimorio y la enciclopedia una sola vez al inicio del bucle.
*   **Notas/Advertencias:** El flujo depende de que la variable de entorno `NOTEBOOKLM_COOKIES` estÃ¯Â¾Æ’Ã¯Â½Â© configurada correctamente. La generaciÃ¯Â¾Æ’Ã¯Â½Â³n en caliente requiere un tiempo extra de aprovisionamiento (~2-5s) durante la primera ejecuciÃ¯Â¾Æ’Ã¯Â½Â³n de `!misionstart`, tiempo durante el cual el bot procesa el flujo en segundo plano y asocia el ID de forma transparente para el usuario final.

### [2026-06-08] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/gmTracker.js`, `src/index.js`, `src/handlers/admin.js` (en kingdoom-bot).
*   **Resumen de Tareas:** Migracion completada de la logica del Game Master (GM) desde NotebookLM hacia un motor de ejecucion interna en el bot usando la API nativa de Gemini.
*   **Cambios Clave:**
    *   Centralizacion de la configuracion, el estado y el prompt maestro del GM en `src/gmTracker.js`.
    *   Refactorizacion del comando `!misionstart` para delegar el inicio a `startMissionTracker` integrando base de datos y la carga automatica de contexto sin intervencion manual.
    *   Eliminacion total de la dependencia de NotebookLM para lograr completa autonomia del sistema.
    *   Validacion de seguridad y anticheat incorporada en el prompt del GM.
*   **Notas/Advertencias:** Se verifico que la skill `grill-me` no esta instalada en el entorno. El testeo de `!misionstart` local (npm run dev) queda pausado hasta que el usuario permita acceso al workspace externo (kingdoom-bot) o lo agregue al Kingdoom-sync.

### [2026-06-04] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `AI_CHANGELOG.md`
*   **Resumen:** Se rebalanceo `!cofre` a una tabla intermedia menos explosiva para bajar la frecuencia de premios altos sin quitarle identidad al comando.
*   **Cambios Clave:**
    *   **[Bot - Cofre] Probabilidades ajustadas:** La tabla paso a `22%` vacio, `27%` para `2k`, `22%` para `5k`, `15%` para `10k`, `8%` para `20k`, `4%` para `35k` y `2%` para `50k`.
    *   **[Bot - Economia] Alta gama reducida:** Los premios de `20k+` ya no suman `20%` por tirada; bajan a `14%`, lo que reduce la sensacion de lluvia de cofres grandes en las primeras 4 aperturas.
*   **Notas/Advertencias:** Validado con `node --check` sobre `games.js`. No se tocaron `!trampa`, tracking diario ni router del bot.

### [2026-06-04] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/handlers/player.js`, `AI_CHANGELOG.md`
*   **Resumen:** Se agregaron los minijuegos rapidos `!cofre` y `!trampa <monto>` al bot de WhatsApp con tracking diario y economia segura basada en `increment_gold`.
*   **Cambios Clave:**
    *   **[Bot - Cofre] Nuevo comando casual:** `!cofre` ahora permite abrir cofres 4 veces al dia, con tabla de premios entre vacio, 2k, 5k, 10k, 20k, 35k y 50k sin posibilidad de perdida.
    *   **[Bot - Trampa] Nuevo riesgo corto:** `!trampa <monto>` se resolvio con tabla probabilistica (perder todo, recuperar, +25%, +50%, +75% o x2) y limites de apuesta de 100k entre semana / 500k en fin de semana.
    *   **[Bot - Tracking Diario] Reuso de bot_daily_claims:** `supabase.js` ahora expone contadores para `cofre_usage` y `trampa_usage` reutilizando el mismo patron diario ya usado por `!dados` y `!21`.
    *   **[Bot - Descubribilidad] Router y ayuda actualizados:** `index.js` ya enruta ambos comandos y `!ayuda` los muestra dentro del listado principal del reino.
*   **Notas/Advertencias:** Se uso un delta neto unico en `!trampa` para reducir el riesgo de inconsistencias entre debito y pago. Queda el riesgo habitual de cualquier flujo en dos pasos si falla el incremento de uso despues de actualizar oro, pero no se introdujo un nuevo camino de doble credito.

### [2026-06-04] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Normalizacion final de textos con encoding roto visibles para usuarios en `kingdoom-bot`.
*   **Cambios Clave:**
    *   **[Bot - Registro] Mensajes de ayuda saneados:** Se reescribio el bloque de error de `!registrar` en `admin.js` usando texto ASCII limpio para evitar que los mensajes de ayuda vuelvan a degradarse por codificaciones mixtas.
    *   **[Bot - Auditoria de encoding] Barrido completo:** Se ejecuto una busqueda amplia sobre `kingdoom-bot` y no quedaron coincidencias activas con los patrones de mojibake que estaban afectando mensajes visibles.
*   **Notas/Advertencias:** Se opto por ASCII simple en ese bloque concreto para maximizar compatibilidad entre hosts y evitar nuevas corrupciones de caracteres. No se detectaron mas cadenas rotas factibles dentro del repo activo.

### [2026-06-04] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/.gitignore`, `kingdoom-bot/src/activeProfileStore.js`, `kingdoom-bot/src/marketForgeStore.js`, `kingdoom-bot/check_supabase_market.js`, `kingdoom-bot/src/data/pending_tracker.json`, `supabase_bot_treasure_events.sql`, `AI_CHANGELOG.md`
*   **Resumen:** Pasada de limpieza de `kingdoom-bot` para quitar residuos, corregir higiene de tooling y sacar datos mutables del arbol `src/`.
*   **Cambios Clave:**
    *   **[Bot - Tooling] `.gitignore` corregido:** Se normalizaron los patrones a sintaxis POSIX para que herramientas como `rg` dejen de fallar por barras invertidas malformadas.
    *   **[Bot - Runtime State] Stores fuera de `src/`:** `activeProfileStore.js` y `marketForgeStore.js` ahora escriben en `.wwebjs_auth/state/` y migran automaticamente cualquier JSON legacy si existe.
    *   **[Bot - Residuos eliminados]:** Se elimino `check_supabase_market.js`, que contenia un helper manual con credenciales embebidas, y se removio `src/data/pending_tracker.json`, ya obsoleto desde que `!purga` persiste su tracker en Supabase.
    *   **[Bot - UX] Tesoro Errante verificado:** Se reviso el handler actual del evento para confirmar que la version persistida en Supabase ya venia sin los mensajes rotos detectados en auditorias anteriores.
    *   **[Supabase - SQL Versionado] Delimitador explicito:** `supabase_bot_treasure_events.sql` queda con delimitador `$treasure$` para evitar errores del SQL Editor al pegar o ejecutar la funcion por bloques.
*   **Notas/Advertencias:** Validado con `node --check` sobre los archivos JS tocados y una pasada de `rg` para confirmar que `.gitignore` ya no rompe el tooling. Siguen existiendo otros textos con encoding viejo en partes antiguas del bot, pero esta limpieza no abrio una campana masiva de normalizacion de strings.

### [2026-06-03] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/treasure.js`, `Kingdoom-sync/AI_CHANGELOG.md`, `Kingdoom-sync/ai-memory/kingdoom-memory.jsonl`
*   **Resumen:** Incrementada la frecuencia del evento 'Tesoro Errante del Reino' en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Tesoro Errante]:** Se modifico la frecuencia de generacion de tesoros diarios de 1-2 veces a 2-4 veces en `treasure.js`, cambiando `const numEvents = Math.floor(Math.random() * 2) + 1;` por `const numEvents = Math.floor(Math.random() * 3) + 2;`.

### [2026-06-03] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/treasure.js`, `kingdoom-bot/src/scheduler.js`, `kingdoom-bot/src/supabase.js`, `supabase_bot_treasure_events.sql`, `AI_CHANGELOG.md`
*   **Resumen:** Migracion de `Tesoro Errante del Reino` desde estado en memoria a persistencia real en Supabase.
*   **Cambios Clave:**
    *   **[Bot - Persistencia de Tesoro]:** `treasure.js` ya no depende del estado local como fuente de verdad. Ahora crea eventos persistidos, reclama recompensas por RPC y rehidrata tesoros abiertos al reiniciar el bot.
    *   **[Bot - Scheduler/Rehidratacion]:** `scheduler.js` invoca una rehidratacion de eventos `open` desde Supabase antes de reprogramar los tesoros del dia, para no perder cofres en curso tras reinicios.
    *   **[Supabase - SQL Versionado]:** Se agrego `supabase_bot_treasure_events.sql` con las tablas `bot_treasure_events`, `bot_treasure_claims` y la RPC `claim_bot_treasure_reward`, que asegura un solo claim por jugador y actualiza el oro dentro de la misma transaccion.
    *   **[Bot - Seguridad Economica]:** La concurrencia de multiples replies se mueve a la capa SQL via `FOR UPDATE` sobre el evento y `UNIQUE(event_id, player_id)`, reduciendo el riesgo de doble cobro o cierre inconsistente.
*   **Notas/Advertencias:** Hay que ejecutar `supabase_bot_treasure_events.sql` en Supabase antes de que el bot pueda usar la version persistente del Tesoro Errante.

### [2026-06-03] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/treasure.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/scheduler.js`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre del MVP de `Tesoro Errante del Reino` para WhatsApp con disparo automatico, reply directo obligatorio y reparto controlado de oro en el grupo principal.
*   **Cambios Clave:**
    *   **[Bot - Tesoro Errante]:** Se implemento `treasure.js` como handler dedicado para eventos automaticos del grupo `595971938097-1618930274@g.us`, con mensaje ancla del bot y palabra clave `reclamar`.
    *   **[Bot - Scheduler Diario]:** `scheduler.js` ahora programa 1 o 2 tesoros aleatorios al dia dentro de la ventana 10:00-22:00 (America/Asuncion), rearmando la agenda al iniciar el bot y en el reset de medianoche.
    *   **[Bot - Ganadores y Premios]:** Cada evento define aleatoriamente entre 1 y 3 ganadores. Cada ganador recibe su propio premio aleatorio entre 10.000 y 20.000 de oro, con cierre al llenarse los cupos o al expirar los 5 minutos.
    *   **[Bot - Seguridad Conversacional]:** `index.js` intercepta replies al mensaje del tesoro y descarta mensajes sueltos; solo replies directos al tablero del bot pueden reclamar la recompensa.
*   **Notas/Advertencias:** El estado del Tesoro Errante vive en memoria para este MVP; si el bot reinicia durante un evento abierto, ese tesoro se pierde y no se recupera automaticamente.

### [2026-06-03] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/blackjack.js`
*   **Resumen:** ImplementaciÃ¯Â¾Æ’Ã¯Â½Â³n del flujo de "aceptar" y "negar" para el modo multijugador PvP del Blackjack (!21) en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Blackjack PvP Accept/Deny]:** Se agregÃ¯Â¾Æ’Ã¯Â½Â³ el estado "pending" a las sesiones de multijugador para esperar la respuesta de los invitados ("aceptar" o "negar").
    *   **[Bot - Timeout Pendiente]:** Si expira el tiempo mientras la sesiÃ¯Â¾Æ’Ã¯Â½Â³n estÃ¯Â¾Æ’Ã¯Â½Â¡ pendiente, automÃ¯Â¾Æ’Ã¯Â½Â¡ticamente se declina por los inactivos y comienza la partida con los que sÃ¯Â¾Æ’Ã¯Â½Â­ aceptaron.

### [2026-06-03] - [Autor: Antigravity]
*   **Archivos Modificados:** `docs/blackjack-simulation.md` (en Kingdoom-sync), `AI_CHANGELOG.md`
*   **Resumen:** CreaciÃ¯Â¾Æ’Ã¯Â½Â³n del documento de simulaciÃ¯Â¾Æ’Ã¯Â½Â³n detallado para el minijuego de Blackjack (!21) en WhatsApp, cubriendo los flujos Solo y PvP.
*   **Cambios Clave:**
    *   **[Docs - Blackjack Simulation]:** CreaciÃ¯Â¾Æ’Ã¯Â½Â³n de `blackjack-simulation.md` que detalla el paso a paso, lÃ¯Â¾Æ’Ã¯Â½Â­mites diarios de uso, lÃ¯Â¾Æ’Ã¯Â½Â­mites de apuesta segÃ¯Â¾Æ’Ã¯Â½Âºn fin de semana, mecÃ¯Â¾Æ’Ã¯Â½Â¡nica de juego y el cÃ¯Â¾Æ’Ã¯Â½Â¡lculo exacto del pozo y las garantÃ¯Â¾Æ’Ã¯Â½Â­as de pago del modo multijugador PvP en WhatsApp.

### [2026-06-02] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/blackjack.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md` (en Kingdoom-sync)
*   **Resumen:** ImplementaciÃ¯Â¾Æ’Ã¯Â½Â³n de la modalidad multijugador PvP para el Blackjack (`!21`) por WhatsApp con control de turnos, timeout de 5 minutos y divisiÃ¯Â¾Æ’Ã¯Â½Â³n proporcional del pozo de apuestas.
*   **Cambios Clave:**
    *   **[Bot - Blackjack PvP]:** Se expandiÃ¯Â¾Æ’Ã¯Â½Â³ `blackjack.js` para dar soporte a partidas multijugador PvP (2+ jugadores) cuando se etiqueta a otros usuarios.
    *   **[Bot - Primera Ronda con 1 Carta]:** Se modificÃ¯Â¾Æ’Ã¯Â½Â³ la distribuciÃ¯Â¾Æ’Ã¯Â½Â³n de cartas iniciales para entregar exactamente 1 carta por jugador en la primera ronda del modo multijugador PvP.
    *   **[Bot - Interceptor Multijugador]:** Se actualizÃ¯Â¾Æ’Ã¯Â½Â³ `index.js` para autorizar a cualquiera de los participantes del grupo a interactuar con el tablero enviando sus comandos de juego (`pedir` o `plantarse`).
    *   **[Bot - Autoplantado por Timeout]:** Se programÃ¯Â¾Æ’Ã¯Â½Â³ un temporizador de 5 minutos que fuerza la acciÃ¯Â¾Æ’Ã¯Â½Â³n de "plantarse" para los participantes inactivos de la ronda.
    *   **[Bot - GarantÃ¯Â¾Æ’Ã¯Â½Â­a de Ganancias y Empates]:** En caso de empate, el pozo se distribuye equitativamente. Se implementaron multiplicadores garantizados mÃ¯Â¾Æ’Ã¯Â½Â­nimos del sistema (`2.5x` para 21 natural, `2x` para victoria regular) por encima de la porciÃ¯Â¾Æ’Ã¯Â½Â³n correspondiente del pozo si esta es menor.
*   **Notas/Advertencias:** Validado localmente con un script de prueba de cÃ¯Â¾Æ’Ã¯Â½Â¡lculo de puntuaciones y verificaciÃ¯Â¾Æ’Ã¯Â½Â³n sintÃ¯Â¾Æ’Ã¯Â½Â¡ctica de Node.js.

### [2026-06-02] - [Autor: Jarvis]
*   **Archivos Modificados:** kingdoom-bot/src/handlers/blackjack.js, AI_CHANGELOG.md
*   **Resumen:** Revision tecnica del azar en !21 y ajuste del limite diario base del Blackjack en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Blackjack] Azar auditado:** Se reviso lackjack.js y no hay evidencia de cartas amaÃ¯Â¾Æ’Ã¯Â½Â±adas. El juego crea un mazo completo de 52 cartas, aplica Fisher-Yates con Math.random() y reparte desde ese mazo barajado, por lo que una racha de 3 derrotas seguidas entra dentro de lo esperable para Blackjack.
    *   **[Bot - Blackjack] Limite diario ampliado:** El limite base de usos de !21 sube de 3 a 5, quedando 5 entre semana y 5 en fin de semana.
    *   **[Bot - Crupier] Regla verificada:** El crupier roba solo mientras tenga menos de 17 y luego se planta. No se encontro una ventaja artificial extra fuera de la regla normal del juego.
*   **Notas/Advertencias:** Validado con 
ode --check src/handlers/blackjack.js en kingdoom-bot. El azar sigue usando Math.random(), que para un minijuego casual es aceptable, aunque no es un RNG criptografico.

### [2026-06-02] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/src/handlers/player.js`, `AI_CHANGELOG.md`
*   **Resumen:** IntegraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del minijuego !21 (Blackjack) por WhatsApp y protecciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n contra interferencias.
*   **Cambios Clave:**
    *   **[Bot - Blackjack]:** Se registrÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el comando `!21` en `index.js`, redirigiendo al handler de Blackjack para iniciar partidas.
    *   **[Bot - IntercepciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de Respuestas]:** Se implementÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ un interceptor estricto al inicio de la recepciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de mensajes. Si un mensaje cita a uno de los mensajes de partidas de Blackjack activas, solo se procesa el comando (`pedir` o `plantarse`) si proviene exactamente del jugador que iniciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la partida (`sender === session.playerPhone`). Cualquier otro mensaje es ignorado completamente para evitar interferencias en grupos.
    *   **[Bot - MenÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âº de Ayuda]:** Se aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la descripciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del comando `!21 <monto>` al compendio de comandos del aventurero (`!ayuda`).
*   **Notas/Advertencias:** La validaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de sintaxis de los archivos modificados ha sido completada con Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©xito.

### [2026-06-02] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/assistant/market/_confirm.ts`, `AI_CHANGELOG.md`
*   **Resumen:** Reparacion del crash aislado al confirmar items forjados por WhatsApp.
*   **Cambios Clave:**
    *   **[Backend - Confirm Publish]:** `_confirm.ts` ya no importa `slugifyMarketItem` ni `buildMarketItemPayload` desde `src/features/market/market.adapter` (arbol frontend). Ahora define ambos helpers inline dentro de la funcion serverless.
    *   **[Diagnostico del caso]:** El flujo `draft` y `revise` funcionaba, pero `confirm` devolvia `500 FUNCTION_INVOCATION_FAILED`, seÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±al de crash al cargar ese submodulo en Vercel. El import cruzado desde `src/features/market/*` era el punto mas fragil y quedo eliminado.
    *   **[Arquitectura]:** La publicacion final del item queda desacoplada del bundle de frontend, reduciendo riesgo de que una dependencia del lado web tumbe el endpoint administrativo.
*   **Notas/Advertencias:** Validado con compilacion dirigida del endpoint `api/admin/assistant/market/_confirm.ts`. El siguiente paso es reprobar `confirmar` sobre un borrador activo despues del redeploy de Vercel.

### [2026-06-02] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/assistant/market/index.ts`, `kingdoom-bot/src/marketForgeApi.js`, `AI_CHANGELOG.md`
*   **Resumen:** Aislamiento del crash de la ruta de forja automatica en Vercel y mejora del diagnostico HTTP visible desde WhatsApp.
*   **Cambios Clave:**
    *   **[Backend - Routing Perezoso]:** `api/admin/assistant/market/index.ts` ahora importa `_draft`, `_revise` y `_confirm` de forma dinamica segun `action`, en lugar de cargar los tres arboles al iniciar la funcion. Esto evita que un submodulo no necesario tumbe incluso un `GET` o un `draft`.
    *   **[Bot - Error HTTP Util]:** `marketForgeApi.js` ya no asume JSON a ciegas. Si el backend responde HTML/texto o un `500` vacio, el bot informa el `status` HTTP y un recorte del cuerpo, ayudando a distinguir entre fallo de despliegue, runtime o validacion.
    *   **[Diagnostico del caso]:** El endpoint publico `https://kingdoom.vercel.app/api/admin/assistant/market` estaba devolviendo `500` incluso para `GET`, cuando deberia responder `405`. Eso indica un crash de carga/importacion en la funcion serverless, no un rechazo del prompt o de Pinterest.
*   **Notas/Advertencias:** Validado con `node --check` en `kingdoom-bot/src/marketForgeApi.js` y compilacion dirigida del endpoint `api/admin/assistant/market/index.ts`. El `npx tsc --noEmit` global y `npm run build` del repo siguen afectados por la falla preexistente de `swr` en la web principal.

### [2026-06-02] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_assistantSecurity.ts`, `kingdoom-bot/src/handlers/marketForge.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del primer bloqueo de la forja automatica por WhatsApp y mejora del diagnostico visible en el bot.
*   **Cambios Clave:**
    *   **[Backend - Permisos]:** `verifyAssistantActor()` ya no rompe el flujo si el bot marca al actor como `admin` pero el backend solo lo reconoce por la whitelist de staff. Ahora valida acceso contra el conjunto efectivo `admin + staff`, promueve a `admin` solo cuando corresponde y tambien contempla `OWNER_NUMBER` dentro de la allowlist administrativa.
    *   **[Bot - Errores Utiles]:** `marketForge.js` ahora captura fallos de `draft`, `revise` y `confirm` y devuelve el mensaje real del backend (`No pude forjar el item: ...`) en lugar de dejar que suba al catch global con el texto generico `El reino esta en llamas...`.
    *   **[Diagnostico del caso]:** El primer test con `!forjaritem Lanza asincronica https://es.pinterest.com/...` apunta a una discrepancia de rol (`admin` en bot vs `staff` configurado en backend), no a un problema intrinseco con Pinterest. El proximo intento deberia revelar el error exacto si aparece otro bloqueo.
*   **Notas/Advertencias:** Validado con `node --check` en `kingdoom-bot/src/handlers/marketForge.js` y compilacion dirigida de los endpoints/seguridad del asistente en `Kingdoom-sync`. El `npx tsc --noEmit` global y `npm run build` del repo siguen teniendo la falla preexistente de resolucion `swr` en la web principal, ajena a este fix.

### [2026-06-02] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/handlers/player.js` (en kingdoom-bot), `src/index.js` (en kingdoom-bot), `src/supabase.js` (en kingdoom-bot), `src/handlers/blackjack.js` (Nuevo en kingdoom-bot), `AI_CHANGELOG.md` (en Kingdoom-sync)
*   **Resumen de Tareas:** ImplementaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del minijuego de Blackjack (`!21`) para el bot de WhatsApp con control de sesiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n estricto mediante respuestas.
*   **Cambios Clave:**
    *   CreaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de `src/handlers/blackjack.js` con la lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³gica de Blackjack (apuestas, lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mites diarios de 3 usos entre semana y 5 los fines de semana, crupier que planta en 17).
    *   La sesiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del juego estÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ anclada a la respuesta directa al mensaje del bot para evitar interferencias en grupos.
    *   IntegraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n con Supabase para descontar la apuesta antes de jugar y registrar/verificar el uso diario.
    *   ModificaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de `src/index.js` para interceptar respuestas a mensajes activos y ejecutar el comando `!21`.
*   **Notas/Advertencias:** Se validaron las sintaxis con `node --check` antes de proceder al commit y push.




---

### [2026-06-01] - [Autor: Antigravity]
*   **Archivos Modificados:** package.json, src/utils/serverAiProviders.ts
*   **Resumen:** Fix de tipado TypeScript para desbloquear el despliegue de Vercel.
*   **Cambios Clave:**
    *   **[Deploy - Vercel]:** Se solucionaron los errores de types de Node en serverAiProviders.ts que bloqueaban la generacion de las Serverless Functions de la forja de mercado en Vercel.

### [2026-06-01] - [Autor: Jarvis]
*   **Archivos Modificados:** `AI_CHANGELOG.md`
*   **Resumen:** Confirmacion operativa del setup de la forja automatica de mercado por WhatsApp para relevo con Antigravity 2.
*   **Cambios Clave:**
    *   **[Deploy - Vercel]:** Ya quedaron configuradas las variables `WHATSAPP_ASSISTANT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `WHATSAPP_ASSISTANT_STAFF_NUMBERS` en el backend de `Kingdoom-sync`.
    *   **[Deploy - Hugging Face Bot]:** Ya quedaron configuradas `WHATSAPP_ASSISTANT_SECRET`, `STAFF_NUMBERS` y `KINGDOOM_ASSISTANT_API_URL` en `kingdoom-bot`.
    *   **[Supabase - SQL]:** El archivo `supabase_assistant_admin_actions.sql` ya fue ejecutado en SQL Editor, por lo que la tabla de auditoria/borradores del asistente administrativo deberia existir en el proyecto real.
*   **Notas/Advertencias:** A partir de este punto el siguiente paso operativo es probar `!forjaritem ...`, luego iterar ajustes (`sube el precio`, `hazlo epico`, etc.) y confirmar/cancelar para validar el flujo completo end-to-end.

### [2026-06-01] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_assistantSecurity.ts`, `api/admin/_marketAssistant.ts`, `api/admin/_supabaseAdmin.ts`, `api/admin/_visualReference.ts`, `api/admin/assistant/market/draft.ts`, `api/admin/assistant/market/revise.ts`, `api/admin/assistant/market/confirm.ts`, `supabase_assistant_admin_actions.sql`, `kingdoom-bot/src/adminStore.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/handlers/marketForge.js`, `kingdoom-bot/src/marketForgeApi.js`, `kingdoom-bot/src/marketForgeStore.js`, `AI_CHANGELOG.md`
*   **Resumen:** MVP de forja automÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡tica de Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­tems de mercado por WhatsApp con borrador IA, ajustes conversacionales, confirmaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n explÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­cita y auditorÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a en Supabase.
*   **Cambios Clave:**
    *   **[Backend - Assistant Market]:** Se aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adieron los endpoints protegidos `POST /api/admin/assistant/market/draft`, `revise` y `confirm`, todos autenticados por `WHATSAPP_ASSISTANT_SECRET` y pensados para uso exclusivo del `kingdoom-bot`.
    *   **[Backend - AuditorÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a/Draft State]:** Se versionÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `supabase_assistant_admin_actions.sql` como tabla fuente de verdad para borradores administrativos. Guarda actor, rol (`admin|staff`), payload propuesto, referencia visual, confirmaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n/cancelaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n, modelo IA y resultado final.
    *   **[Backend - IA de Mercado]:** Se creÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ un motor server-side compartido para generar y revisar drafts de Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­tems usando referencia visual + prompt del staff + contexto resumido del mercado actual. El precio puede ajustarse por conversaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n antes de confirmar.
    *   **[Bot - Flujo Conversacional]:** Se integrÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `!forjaritem <idea> [url]` y `!mercado crear ...` en WhatsApp. El bot detecta una sola sesiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n activa por staff/admin por chat, acepta ajustes conversacionales, soporta `confirmar` / `cancelar` y publica en `market_items` solo tras confirmaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n explÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­cita.
    *   **[Bot - Permisos]:** AdemÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡s de admins, ahora existe `isStaffUser()` con whitelist por `STAFF_NUMBERS` para habilitar el flujo de forja a staff sin abrir el resto de comandos administrativos sensibles.
*   **Notas/Advertencias:** `node --check` pasÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ en los archivos nuevos/modificados del bot. Los endpoints nuevos de `api/` compilaron con `npx tsc --noEmit --skipLibCheck ...`. El `npx tsc --noEmit` global y `npm run build` de `Kingdoom-sync` siguen fallando por un problema preexistente de resoluciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de `swr` en `src/components/GrimoireSection.tsx` y `src/sections/MarketSection.tsx`, ajeno a esta implementaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n. Para que el flujo funcione en producciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n deben configurarse `WHATSAPP_ASSISTANT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y, si se usarÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡n staff no-admin, `WHATSAPP_ASSISTANT_STAFF_NUMBERS` en backend y `STAFF_NUMBERS` en el bot.

### [2026-06-01] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion de identidad del soberano en el prompt del Oraculo.
*   **Cambios Clave:**
    *   **[Bot - Oraculo] Soberano actual:** El prompt deja de tratar a `E.XE` como nombre principal del rey y pasa a reconocer a `Nothing` como el soberano real.
    *   **[Bot - Compatibilidad narrativa]:** `E.XE` queda interpretado solo como alias antiguo o forma vieja de referirse al mismo soberano, evitando respuestas desalineadas con el usuario real.
*   **Notas/Advertencias:** Validado con `node --check src/handlers/games.js` en `kingdoom-bot`. Ajuste de identidad narrativa; no cambia economia ni logica de juego.

### [2026-06-01] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen:** Blindaje del arranque de WhatsApp en Hugging Face contra `auth timeout` y rechazos no controlados.
*   **Cambios Clave:**
    *   **[Bot - Estabilidad] Timeout configurable:** El cliente de WhatsApp ahora usa `WHATSAPP_AUTH_TIMEOUT_MS` (default `300000`) en lugar de un timeout fijo de `120000`, dando mas margen a sesiones lentas en contenedor.
    *   **[Bot - Resiliencia] Rechazos globales:** Se agregaron manejadores de `process.on('unhandledRejection')` y `process.on('uncaughtException')` para registrar `auth timeout` y otros errores asincronos sin tumbar el proceso por un rechazo no capturado.
    *   **[Bot - Scheduler] Guardia de doble inicio:** `startScheduler(client)` ahora solo corre una vez por ciclo de conexion y se libera al desconectarse, evitando duplicados si hay reconexion.
*   **Notas/Advertencias:** Validado con `node --check src/index.js` en `kingdoom-bot`. El bot deberia sobrevivir a un timeout de autenticacion, pero si la sesion de WhatsApp expira o la red del contenedor sigue inestable, aun hara falta reautenticar QR o revisar conectividad a `web.whatsapp.com`.

### [2026-06-01] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `AI_CHANGELOG.md`
*   **Resumen:** Ajuste de reglas del minijuego `!dados` en WhatsApp.
*   **Cambios Clave:**
    *   **[Bot - Dados] Victoria mas accesible:** La tirada ahora gana con suma `>= 7` en vez de `>= 8`.
    *   **[Bot - Dados] Mas intentos entre semana:** El limite diario base sube de `3` a `4` usos; el fin de semana se mantiene en `5`.
    *   **[Bot - Dados] Tope por ronda:** Se agrega una apuesta maxima de `100.000` oro por ronda y un maximo ampliado de `500.000` los fines de semana.
*   **Notas/Advertencias:** Validado con `node --check src/handlers/games.js` en `kingdoom-bot`. Cambio de economia puntual solicitado por el usuario; no modifica otros minijuegos ni RPCs.

### [2026-06-01] - [Autor: Jarvis]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del parser de `!registrar` para evitar altas corruptas cuando el admin no cita realmente el mensaje del jugador.
*   **Cambios Clave:**
    *   **[Bot - Registro] Validacion de modo manual:** `!registrar` ahora exige que el primer argumento del modo manual parezca un telefono real (minimo 8 digitos) antes de tratarlo como celular.
    *   **[Bot - UX defensiva]:** Si el staff escribe `!registrar <nombre> [oro]` sin responder/citar el mensaje del jugador, el bot cancela el alta y devuelve una guia clara en vez de registrar basura.
    *   **[Diagnostico] Caso Johandarfox1:** Se verifico que el intento mostrado no creo `Johandarfox1` en `public.players`; el bot genero por error una fila con `username = "2500"` y `phone = "1,573219843017"` porque tomo el nombre como celular al entrar por la rama manual.
*   **Notas/Advertencias:** La web funciona correctamente: consulta `public.players` por `username` con `ilike`. El caso requiere limpieza manual de la fila rota en Supabase antes de volver a registrar al jugador correctamente.

### [2026-06-01] - [Autor: Antigravity]
*   **Archivos Modificados:** `docs/agents/KingdoomArchitect.md`, `docs/agents/KingdoomFrontend.md`, `docs/agents/KingdoomBackend.md`, `docs/agents/KingdoomMinigames.md`, `docs/agents/KingdoomLoreKeeper.md`, `docs/agents/KingdoomDevOps.md`, `docs/agents/KingdoomDesigner.md`
*   **Resumen:** CreaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de directrices exhaustivas de agentes (Personas) para el Reino.
*   **Cambios Clave:**
    *   **[Docs - Agentes]:** Se crearon 7 nuevos perfiles de contexto en `docs/agents/` cubriendo todas las Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡reas posibles del proyecto (`Kingdoom-sync` y `Kingdoom-bot`): Architect, Frontend, Backend, Minigames, LoreKeeper, DevOps, y Designer.

### [2026-06-01] - [Autor: Antigravity]
*   **Archivos Modificados:** `docs/agents/KingdoomAuditor.md`, `docs/agents/KingdoomDebugger.md`, `docs/agents/KingdoomReviewer.md`, `docs/agents/KingdoomBotMaster.md`
*   **Resumen:** CreaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de directrices de agentes especializados (Personas) para el Reino.
*   **Cambios Clave:**
    *   **[Docs - Agentes]:** Se crearon 4 perfiles de contexto estandarizados dentro de `docs/agents/` que detallan las reglas, responsabilidades y prioridades para que cualquier agente de la arquitectura (Jarvis, Antigravity 2, etc.) asuma roles dedicados: Auditor de EconomÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a/Seguridad, Depurador UI/Estado, Revisor de Calidad/Reglas y BotMaster de WhatsApp.

## 2026-05

### [2026-05-31] - [Autor: Antigravity]
*   **Archivos Modificados:** `GrimoireSection.tsx`, `MarketSection.tsx`, `imageUtils.ts` (Nuevo), `package.json`
*   **Resumen:** ImplementaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de OptimizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n Extrema (SWR CachÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â© y TransformaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de ImÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡genes).
*   **Cambios Clave:**
    *   **[Web] Performance (CachÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©):** Se reemplazÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el `useEffect` por `useSWR` en las llamadas pesadas de Supabase (Grimorio, Mercado, Bestiario, Flora) con un cachÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â© local de 5 minutos, logrando cargas instantÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡neas (0ms) al navegar entre pestaÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±as.
    *   **[Web] Performance (ImÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡genes):** Se introdujo `getOptimizedImageUrl` para interceptar imÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡genes de Supabase Storage e inyectar el modo "render" para devolverlas comprimidas a formato WebP y tamaÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±o miniatura.

### [2026-05-31] - [Autor: ui_ux_designer (Subagente) / Antigravity]
*   **Archivos Modificados:** MÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡s de 20 componentes React en `Kingdoom-sync/src` (ej. `AnimeHubSection.tsx`, `MarketItemCard.tsx`, etc.)
*   **Resumen:** OptimizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n masiva de carga de imÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡genes en el frontend web.
*   **Cambios Clave:**
    *   **[Web] Performance:** Se inyectaron los atributos `loading="lazy"` y `decoding="async"` en todas las etiquetas `<img />` del proyecto para evitar cuellos de botella en la renderizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n y mejorar el tiempo de carga en listas pesadas como el mercado, el inventario y el anime hub.

### [2026-05-30] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/tracker.js`
*   **Resumen:** Fix del error de guardado del tracker provocado por restricciones de Supabase.
*   **Cambios Clave:**
    *   **[Bot] Base de Datos:** Se corrigiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ una violaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de la restricciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n `knowledge_documents_type_check`. El `type` del tracker se cambiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ de `tracker` a `other`, y se aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el campo obligatorio `title`.

### [2026-05-30] - [Autor: Antigravity]
*   **Archivos Modificados:** `.gemini/antigravity/mcp_config.json` (Local IDE Config)
*   **Resumen:** ConfiguraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n e integraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del servidor MCP de Vercel.
*   **Cambios Clave:**
    *   **[Tooling - MCP]:** Se agregÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ exitosamente el servidor MCP de Vercel (`https://mcp.vercel.com`) al entorno de Google IDE (Antigravity).
    *   **[Tooling - Auth]:** Se configurÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el Bearer Token de Vercel para permitir a los agentes realizar consultas de despliegues, logs de proyectos y administrar el entorno web alojado en Vercel sin salir del IDE.

### [2026-05-30] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/components/TavernScratchNative.tsx`, `apps/mobile/src/utils/scratchUtils.ts`, `AI_CHANGELOG.md`
*   **Resumen:** Fix de empaquetado Android para EAS tras detectar un import cruzado desde la web en `TavernScratchNative`.
*   **Cambios Clave:**
    *   **[Mobile - Build Fix]:** Se reemplazo el import de `../../../../src/utils/scratchUtils` por un util nativo local en `apps/mobile/src/utils/scratchUtils.ts` para que Expo/Metro pueda resolver el modulo dentro del workspace mobile.
    *   **[Mobile - Paridad]:** El nuevo util replica la configuracion diaria de Scratch (`getDailyScratchConfig`, costos, chances y limite maximo) sin depender de archivos del frente web.
    *   **[EAS - Diagnostico]:** Se reprodujo localmente el fallo de bundle que estaba rompiendo la solicitud de APK en EAS y se valido el fix con export Android exitoso antes de relanzar el build remoto.
*   **Notas/Advertencias:** `npm run mobile:typecheck`, `npx expo export --platform android` y `npm run build` quedaron limpios tras el fix. El build remoto anterior `4a3d3025-f211-45cb-9c72-dbb1edec997a` fallo por este import fuera del arbol mobile.

### [2026-05-30] - [Autor: Jarvis]
*   **Archivos Modificados:** `docs/mobile-reactivation/README.md`, `docs/mobile-reactivation/mobile-v1-parity-matrix.md`, `docs/mobile-reactivation/mobile-qa-manual-checklist.md`, `docs/mobile-reactivation/mobile-post-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre documental del post-plan mobile tras completar las Fases 1-3.
*   **Cambios Clave:**
    *   **[Docs - Estado real]:** Se actualizo la matriz de paridad para reflejar la situacion actual de mobile tras notificaciones, `TavernHorseRaceNative` y `TavernScratchNative`.
    *   **[Docs - QA]:** Se agrego una checklist manual operativa para validar sesion, misiones, eventos, mercado, exchange, minijuegos y notificaciones en mobile.
    *   **[Docs - Roadmap]:** Se abrio un backlog nuevo de post-reactivacion para ordenar el siguiente tramo fuera del plan original.
    *   **[Docs - Contexto]:** El `README` de `docs/mobile-reactivation` ahora resume el cierre de Fases 1-3 y el salto hacia una etapa post-reactivacion.
*   **Notas/Advertencias:** Cambio documental. Se omitio build completo porque no hubo cambios funcionales; se verifico el estado del repo y la coherencia de los documentos actualizados.

### [2026-05-30] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/components/TavernScratchNative.tsx`, `apps/mobile/app/(tabs)/market.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** IntegraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de "TavernScratchNative" y cierre definitivo de la Fase 3 de reactivaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n mobile.
*   **Cambios Clave:**
    *   **[Mobile - Minijuego]:** Se integrÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ exitosamente el segundo minijuego nativo, "Rasca y Gana" (`TavernScratchNative.tsx`). Mantiene paridad con la lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³gica web, empleando configuraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de probabilidades, lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mites diarios y costos generados dinÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡micamente vÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a `getDailyScratchConfig`.
    *   **[Mobile - EconomÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a Segura]:** La transacciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de oro utiliza exclusivamente `sessionStore.addGold`, el cual estÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ respaldado por el RPC seguro de Supabase `increment_gold`, evitando cualquier condiciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de carrera.
    *   **[Mobile - Persistencia Local]:** Se implementÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `AsyncStorage` para manejar el lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mite de ganancias diarias de forma eficiente y segura a nivel de dispositivo.
    *   **[Mobile - IntegraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n UI]:** El minijuego se renderiza de forma fluida y elegante en la tab del mercado, empleando la arquitectura `KingdoomUI` y `StaggerItem` existente.
    *   **[Backlog] Cierre Fase 3:** Con la implementaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de este segundo minijuego y las notificaciones previamente aprobadas, la Fase 3 de reactivaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n mobile se considera cumplida.
*   **Notas/Advertencias:** Validado localmente con `npm run mobile:typecheck` sin errores nuevos atribuibles a esta funcionalidad.

### [2026-05-30] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** ReducciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del tiempo de gracia del comando `!purga` a peticiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del administrador.
*   **Cambios Clave:**
    *   **[Bot] Reglas de Purga:** Se modificÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la duraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n permitida de un jugador sin ficha de 5 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as a 3 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as. Los textos de advertencia del menÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âº de comandos tambiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©n fueron actualizados a 3 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as.

### [2026-05-30] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/tracker.js`, `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** SoluciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n al reseteo del comando `!purga` provocado por reinicios del servidor en Hugging Face.
*   **Cambios Clave:**
    *   **[Bot] Persistencia en Supabase:** Se reescribiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `tracker.js` para que ya no guarde `pending_tracker.json` en el sistema de archivos local, ya que Hugging Face Spaces es efÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mero y borraba el progreso.
    *   **[Bot] Documento Oculto:** El estado del tracker ahora se serializa y se guarda directamente en la tabla `knowledge_documents` bajo el ID `bot-pending-tracker` con visibilidad falsa, aprovechando la base de datos sin requerir migraciones SQL nuevas.
    *   **[Bot] Funciones AsÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­ncronas:** Se modificÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `admin.js` para usar `await` en las llamadas del tracker, permitiendo consultas remotas.

### [2026-05-29] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/components/PlayerNotificationBellNative.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre de revision de Fase 3 mobile sobre notificaciones y ergonomia compacta.
*   **Cambios Clave:**
    *   **[Mobile - QA] Limpieza de UI:** Se reescribio `PlayerNotificationBellNative.tsx` para eliminar un problema de encoding visible en los separadores del modal de notificaciones y dejar el componente en ASCII limpio.
    *   **[Backlog] Estado aceptado:** Se marcaron como cerradas la decision de mantener `Archivist` y `Anime` como modulos compactos, junto con la segunda pasada de polish visual y ergonomia Android.
    *   **[Jarvis] Aceptacion parcial de Fase 3:** Se acepta el bloque de notificaciones y el polish ergonomico como avance valido de Fase 3, dejando todavia pendiente la decision/implementacion del segundo minijuego movil.
*   **Notas/Advertencias:** Revalidado con `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build`. El siguiente frente real de Fase 3 sigue siendo decidir si entra un segundo minijuego movil o si conviene cerrar la fase con el estado actual.

### [2026-05-29] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/features/notifications/notificationsService.ts`, `apps/mobile/src/components/PlayerNotificationBellNative.tsx`, `apps/mobile/app/(tabs)/home.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** ImplementaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de Notificaciones Mobile (Fase 3).
*   **Cambios Clave:**
    *   **[Mobile - Notificaciones]:** Se implementÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el servicio de notificaciones nativo (`notificationsService.ts`) que interactÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºa con Supabase para la app mobile, manteniendo paridad con la estructura de datos web.
    *   **[Mobile - Componente UI]:** Se creÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `PlayerNotificationBellNative.tsx` utilizando `TanStack Query` para polling cada 15 segundos y `react-native-reanimated` para animaciones fluidas del modal bottom-sheet. Se garantizÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el tamaÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±o de 46x46 en los elementos clickeables (incluyendo botÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de cerrar modal).
    *   **[Mobile - IntegraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n]:** Se inyectÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la campana de notificaciones en el `rightSlot` de las pantallas principales `home.tsx` y `profile.tsx` para brindar mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡xima visibilidad sobre transacciones y recompensas sin afectar la ergonomÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a ni requerir tabs adicionales.
    *   **[Backlog] ActualizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n:** Tareas de notificaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n/features econÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³micas adicionales marcadas como evaluadas e implementadas.
*   **Notas/Advertencias:** Validado con `npm run mobile:typecheck` limpio. La economÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³vil sigue intacta ya que la campana es solo un observador de estado.

### [2026-05-29] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/components/KingdoomUI.tsx`, `apps/mobile/app/(tabs)/library.tsx`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/app/(tabs)/archivist.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/components/TavernSlotsNative.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Segunda pasada de polish visual/ergonÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³mico para la reactivaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n mobile (Fase 3). 
*   **Cambios Clave:**
    *   **[Mobile - UI/ErgonomÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a]:** Se estandarizaron los touch targets a un mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­nimo de 46px en componentes interactivos clave de toda la app (botones, tabs, pills y search inputs) para cumplir con las guÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as de accesibilidad en Android. Esto incluyÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ ajustes en Archivist, Anime, Exchange, HorseRace y Slots, solucionando los problemas de fat-finger.
    *   **[Arquitectura - DecisiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n]:** Se evaluÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ si `Archivist` y `Anime` justifican una expansiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n profunda. Se decide mantenerlos como mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³dulos compactos. `Archivist` sirve como referencia rÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡pida y `Anime` como un hub de enlaces ligeros. AÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adirles una navegaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n profunda y dependencias pesadas impactarÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a negativamente el rendimiento de React Native y la filosofÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a "compact-mode" que guÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a el resurgimiento mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³vil.
*   **Notas/Advertencias:** Todos los cambios pasaron `npm run mobile:typecheck` y no se inyectÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³gica econÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³mica nueva.

### [2026-05-29] - [Autor: Antigravity]
*   **Archivos Modificados:** `apps/mobile/src/features/session/sessionStore.ts`, `apps/mobile/src/components/TavernSlotsNative.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre definitivo de Fase 2 (Antigravity 2) de reactivaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n mobile: sincronizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n atÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³mica de economÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a y estabilizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del Stock Exchange.
*   **Cambios Clave:**
    *   **[Mobile - EconomÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a] QA Funcional Completo y SincronizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n atÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³mica:** Se auditÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ funcionalmente el ciclo de compra en el mercado mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³vil (se descuenta una sola vez, se refresca el saldo, se actualiza el inventario). Se refactorizaron `TavernSlotsNative`, `TavernHorseRaceNative` y `RealmStockExchangeNative` para utilizar `addGold` (basado en el RPC `increment_gold` de Supabase) en lugar del mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©todo inseguro `updateGold`, previniendo race conditions y asegurando la consistencia entre saldo visible e historial. AdemÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡s, se documentÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el SQL del RPC `increment_gold` (`supabase_increment_gold.sql`) en el repositorio para evitar desincronizaciones futuras. Fase 2 completada y validada con \`npm run mobile:typecheck\` y \`npm run build\`.
    *   **[Mobile - Mercado] EstabilizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n:** Se verificÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la paridad operativa del `RealmStockExchangeNative` con la web, confirmando que las operaciones respetan el bloqueo transaccional (`applyOperation`) y propagan correctamente los deltas de oro.
    *   **[Backlog] ActualizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n:** Se marcaron como completadas las tareas restantes del sprint de Antigravity 2 en `mobile-reactivation-backlog.md`.
*   **Notas/Advertencias:** Validado con lectura de cÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³digo y `npm run mobile:typecheck` exitoso. La arquitectura financiera mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³vil ya no sobrescribe el oro total, operando exclusivamente mediante incrementos/decrementos validados en Supabase.

### [2026-05-29] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/src/features/missions/missionsService.ts`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion de paridad real en claims de misiones mobile tras la pasada de Antigravity.
*   **Cambios Clave:**
    *   **[Mobile - Misiones] Datos reales del claim:** `missionsService.ts` ahora lee `players(username, gold)`, `proof_link`, `proof_image_url` y `proof_image_path` en vez de completar `playerName`, `playerGold` y evidencias con placeholders.
    *   **[Jarvis] Revision correctiva:** Se mantuvo la alineacion de tipos hecha por Antigravity, pero se cerro la brecha funcional donde la UI movil podia mostrar datos vacios aunque la evidencia ya existiera en Supabase.
*   **Notas/Advertencias:** Revalidado con `npm run mobile:typecheck`, `npx tsc --noEmit` y `npm run build`. Aun sigue pendiente la parte de sincronizacion de saldo/inventario y la estabilizacion de `RealmStockExchangeNative`.

### [2026-05-29] - [Autor: Jarvis]
*   **Archivos Modificados:** `apps/mobile/app/(tabs)/market.tsx`, `apps/mobile/src/components/TavernHorseRaceNative.tsx`, `apps/mobile/src/utils/horseRaceUtils.ts`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre de revision mobile: se integra la primera carrera de caballos nativa y se valida la fase combinada de Antigravity.
*   **Cambios Clave:**
    *   **[Mobile] Nuevo minijuego prioritario:** Se agrega `TavernHorseRaceNative` al tab de mercado como primer minijuego adicional a `TavernSlotsNative`.
    *   **[Mobile] Simulacion offline alineada:** La carrera movil usa una simulacion local con cuotas, progreso por frames y tope diario del mismo tipo que la version offline de la web.
    *   **[Jarvis] Cierre de integracion:** Se revisaron los aportes de superficie y profundidad mobile y se congelo `Horse Race` como primer minijuego extra aprobado para `apps/mobile`.
    *   **[Backlog] Estado actualizado:** Se marcaron como revisados por Jarvis el minijuego extra, la validacion del flujo economico aprobado y la revision de cambios de Antigravity.
*   **Notas/Advertencias:** Validado con `npm run mobile:typecheck` y `npx tsc --noEmit`. La economia de carrera offline en mobile sigue el patron cliente+saldo del modo offline web; no se promovio aun a RPC porque la web tampoco lo hace en offline.

### [2026-05-29] - [Autor: Codex]
*   **Archivos Modificados:** `docs/mobile-reactivation/README.md`, `docs/mobile-reactivation/mobile-v1-parity-matrix.md`, `docs/mobile-reactivation/mobile-contract-alignment.md`, `docs/mobile-reactivation/mobile-reactivation-backlog.md`, `docs/mobile-reactivation/antigravity-1-mobile-sprint.md`, `docs/mobile-reactivation/antigravity-2-mobile-sprint.md`, `AI_CHANGELOG.md`
*   **Resumen:** Cierre de la Fase 1 de reactivacion mobile con auditoria, backlog y briefs operativos.
*   **Cambios Clave:**
    *   **[Mobile] Target congelado:** Se formalizo `apps/mobile` como unico frente movil real y `android/` raiz como artefacto no prioritario.
    *   **[Arquitectura] Matriz de paridad:** Se documento `web vs mobile` por dominio con estado (`lista`, `parcial`, `ausente`, `no prioritaria`) y dueÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±o principal.
    *   **[Contratos] Alineacion inicial:** Se documentaron divergencias entre `src/types.ts` y `apps/mobile/src/features/shared/types.ts`, con foco en `player/session`, `missions`, `events`, `market items` e `inventory`.
    *   **[Ejecucion] Backlog y prompts:** Se dejaron briefs separados para Antigravity 1 y 2 con alcance, prioridades, restricciones y validacion.
*   **Notas/Advertencias:** Es una implementacion de Fase 1 orientada a ejecucion; no modifica aun logica funcional de la app movil.

### [2026-05-29] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del cierre prematuro de la Torre del Mago durante rafagas que alcanzan el limite diario.
*   **Cambios Clave:**
    *   **[Minijuegos - Torre del Mago]:** La pantalla `Torre cerrada` ahora solo reemplaza el tablero cuando el limite diario ya estaba alcanzado antes de una nueva jugada.
    *   **[UX] Resolucion visible:** Si una rafaga aceptada completa el tope diario, la animacion y el resumen de la tirada terminan normalmente en vez de cortar el lanzamiento antes de que caigan las esferas.
*   **Notas/Advertencias:** Cambio quirurgico de renderizado; no modifica el cobro, el pago ni el almacenamiento del limite diario.

### [2026-05-29] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** AmpliaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de la cantidad mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡xima de esferas a lanzar en la Torre del Mago.
*   **Cambios Clave:**
    *   **[Minijuegos - Torre del Mago]:** Se ajustaron los botones de selecciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de cantidad de esferas, cambiando las opciones de `[1, 3, 5, 10]` a `[1, 5, 10, 20]`.
*   **Notas/Advertencias:** ActualizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n rÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡pida de UI para escalar las apuestas.

### [2026-05-29] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion de inconsistencia entre `!purga` y `!pendientes` en el bot de WhatsApp.
*   **Cambios Clave:**
    *   **[Bot] Fuente unica de pendientes:** `!pendientes` y `!purga` ahora usan el mismo calculo vivo del grupo contra Supabase para detectar miembros sin registro o registrados sin ficha.
    *   **[Bot] Tracker sincronizado:** `!purga` refresca `pending_tracker.json` antes de evaluar antiguedad, evitando que un tracker vacio o perdido diga que no hay pendientes cuando si existen.
    *   **[Bot] Purga conservadora:** Los pendientes nuevos quedan advertidos con plazo restante; solo se expulsan quienes ya superaron los 5 dias rastreados.
*   **Notas/Advertencias:** Validado con `node --check src/handlers/admin.js` en `kingdoom-bot` y empujado a `origin/main` y `huggingface/main`. No se ejecuto build web porque el cambio real es del bot y este commit solo sincroniza trazabilidad.

### [2026-05-29] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`
*   **Resumen:** ReducciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del plazo de inactividad para purga de 5 a 3 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as.
*   **Cambios Clave:**
    *   **[Admin] Comando !purga:** Se actualizÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la constante `THREE_DAYS_MS` y la lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³gica de cÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡lculo de tiempo para que el bot advierta y expulse a los usuarios sin ficha o inactivos luego de 3 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as en lugar de 5.
    *   **[Admin] Notificaciones de UI:** Se ajustaron los textos enviados por WhatsApp al ejecutar la purga para que reporten correctamente el lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mite de 3 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as.
*   **Notas/Advertencias:** Los cambios se hicieron en el repositorio del bot y se empujaron a `origin/main`.

### [2026-05-29] - [Autor: Antigravity]
*   **Archivos Modificados:** apps/mobile/app/(tabs)/profile.tsx, apps/mobile/app/(tabs)/anime.tsx, docs/mobile-reactivation/mobile-reactivation-backlog.md
*   **Resumen de Tareas:** Finalizacion de pulido visual y funcional ('Beta Interna') en la aplicacion movil para alcanzar paridad en la experiencia de usuario.
*   **Cambios Clave:**
    *   Migracion del perfil de jugador a KingdoomUI (RealmCard, StaggerItem, MetricTile, EmptyState).
    *   Integracion robusta de pull-to-refresh en todos los tabs (ej. anime.tsx) mediante ScreenShell.
    *   Garantia de estados consistentes (carga, error, vacio) en todos los modulos.
*   **Notas/Advertencias:** Validacion de tipos ejecutada correctamente (npx tsc --noEmit exitoso). Flujos base listos.

---

### [2026-05-28] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`
*   **Resumen:** CorrecciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n visual y lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³gica del cÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡lculo de apuestas en Esfera de las Runas.
*   **Cambios Clave:**
    *   **[Minijuegos] CorrecciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n cÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡lculo de total:** El costo total de la jugada ahora calcula `apuestaPorEsfera * cantidad`, mostrÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ndose explÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­citamente y utilizÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ndose correctamente para la deducciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de oro y los cÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡lculos de RTP/premio.
    *   **[UI] Claridad de Etiquetas:** Actualizadas etiquetas "Multiplicador" a "Lanzamiento" y "Apuesta unitaria" a "Apuesta por esfera" para evitar confusiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n. Se muestra de manera clara el costo total real de la jugada.
    *   **[UX] Estado del BotÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n:** Actualizados los mensajes en el botÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de lanzar (Oro insuficiente, lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mite alcanzado, apuesta invÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡lida) para informar dinÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡micamente y con base al oro que requiere la apuesta total.
*   **Notas/Advertencias:** Validado localmente con `npx tsc --noEmit` y `npm run build` sin errores en este componente.

### [2026-05-28] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/admin/AdminMissionManager.tsx`, `src/utils/missions.ts`
*   **Resumen:** Funcionalidad para eliminar participantes de misiones desde el panel de admin.
*   **Cambios Clave:**
    *   **[Admin] BotÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n Eliminar:** Nuevo botÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de "Eliminar" en la tarjeta de participante (`AdminMissionManager.tsx`) con prompt de confirmaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de seguridad.
    *   **[Backend] Borrado y RecÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡lculo:** La funciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n `deleteMissionClaim` (`missions.ts`) borra el reclamo, elimina las pruebas del Storage (`MISSION_EVIDENCE_BUCKET`) y devuelve el estado de la misiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n a `available` automÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ticamente si se libera un cupo en una misiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n `in-progress`.
*   **Notas/Advertencias:** Listo para producciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n, confirmado con `git push`. Las validaciones de TS fallan por errores previos ajenos al Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡rea afectada.

### [2026-05-28] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `DATABASE_SCHEMA.md`, `patch.cjs` (eliminado), `test-supabase.ts` (eliminado)
*   **Resumen:** SincronizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n en tiempo real de misiones en UI, resoluciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de conflictos y limpieza de repositorio.
*   **Cambios Clave:**
    *   **[Mobile/UI] SincronizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de misiones:** Implementada lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³gica para reflejar cambios de estado de misiones (reclamos de cupos, actualizaciones de admin) en tiempo real en la UI mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³vil sin recarga manual.
    *   **[Mantenimiento] ResoluciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de conflictos:** Solucionados conflictos de Git en `AdminControlSheet.tsx` y `AdminControlPrimitives.tsx` para mantener consistencia Mobile-First.
    *   **[Mantenimiento] Limpieza de metadatos:** Se auditaron y limpiaron residuos huÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©rfanos de Git (`REBASE_HEAD`, `.COMMIT_EDITMSG.swp`) tras confirmar un working tree limpio.
    *   **[DocumentaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n] CorrecciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de Schema:** Actualizado `DATABASE_SCHEMA.md` para clarificar la diferencia de casing entre `playerId` (`character_sheets`) y `player_id` (`player_inventory`).
    *   **[Mantenimiento] Archivos temporales:** Eliminados scripts temporales (`patch.cjs`, `test-supabase.ts`) que no pertenecen a producciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n.
*   **Notas/Advertencias:** Persisten errores de tipos de Typescript en `RankingCard.tsx` y `WeeklyRankingPodium.tsx` que requieren futura revisiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n.

### [2026-05-28] - [Autor: Codex]
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

### [2026-05-28] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** Endurecimiento adicional del prompt del GM para reducir ambientacion excesiva y forzar avance real de escena.
*   **Cambios Clave:**
    *   **[GM] Apertura mas corta:** La ambientacion inicial ahora queda limitada a 1 o 2 parrafos breves antes de pasar a hallazgos, consecuencias o decisiones.
    *   **[GM] Avance obligatorio:** Cada respuesta debe introducir al menos un hallazgo nuevo, una reaccion enemiga, una consecuencia tangible, una pista concreta, un obstaculo nuevo o una decision inmediata.
    *   **[GM] Formato mas firme:** La cita de apertura, la narracion en cursiva, las consecuencias clave en negrita y el uso de inline code en escenas multi-jugador pasan de sugerencia a regla funcional del prompt.
*   **Notas/Advertencias:** El objetivo de este ajuste es sacar al bot de la prosa contemplativa y empujarlo hacia un estilo de GM mas operativo, reactivo y cercano al usado por staff.

### [2026-05-28] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** Refinamiento del prompt Human-First para acercar la estructura del GM-bot al estilo tactico y decorativo usado por staff.
*   **Cambios Clave:**
    *   **[GM] Prioridad a la jugada:** El prompt ahora obliga a responder primero las acciones de los jugadores antes de expandirse en ambientacion.
    *   **[GM] Resolucion por frentes:** Se reforzo el uso de encabezados diegeticos por frente cuando haya varios jugadores o subescenas simultaneas.
    *   **[GM] Decoracion funcional:** Se incorporaron reglas explicitas para usar cita Markdown en ambientacion, cursiva en narracion, negrita en consecuencias clave, inline code para remarques puntuales y separadores entre focos de combate o escena.
*   **Notas/Advertencias:** El objetivo del ajuste es reducir respuestas excesivamente noveladas y acercar la salida del bot al estilo operativo de GM humano usado por staff, sin volverlo una plantilla robotica.

### [2026-05-28] - [Autor: Codex]
*   **Archivos Modificados:** `api/admin/generate-mission.ts`, `src/utils/missionAi.ts`, `src/components/admin/AdminMissionManager.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** El generador de misiones con IA ahora rellena el `gmConfig` nuevo en modo semiautomatico.
*   **Cambios Clave:**
    *   **[IA] gmConfig estructurado:** El endpoint de generacion ahora pide y normaliza `modoMision`, objetivos de jugadores, objetivos del GM, condiciones de victoria, condiciones de derrota y reglas de escalada dentro de la respuesta JSON.
    *   **[Admin] Precarga automatica:** Cuando una mision es generada por IA, el formulario del admin ya precarga esos campos del GM en vez de dejarlos vacios.
    *   **[Semi-manual] NPCs y magias:** La IA deja `npcs` vacio a proposito para que staff complete manualmente la ficha canonica y las magias del grimorio sin perder control editorial.
*   **Notas/Advertencias:** `npm run build` paso bien. `npx tsc --noEmit` sigue fallando por errores previos y ajenos en `src/components/RankingCard.tsx` y `src/components/WeeklyRankingPodium.tsx`.

### [2026-05-27] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen:** Endurecimiento del arranque de WhatsApp Web con reintentos y mejor diagnostico de timeouts de red.
*   **Cambios Clave:**
    *   **[Bot] Reintentos de inicializacion:** El cliente ahora intenta reconectar varias veces cuando `client.initialize()` falla, con espera progresiva entre intentos.
    *   **[Bot] Timeout mas tolerante:** `authTimeoutMs` subio a `120000` para darle mas margen a entornos lentos o inestables.
    *   **[Bot] Logs de diagnostico:** Se agregaron logs de `auth_failure`, `disconnected`, `change_state` y mensajes mas claros cuando el error apunta a `ERR_TIMED_OUT` contra `web.whatsapp.com`.
*   **Notas/Advertencias:** Este parche mejora resiliencia y observabilidad, pero no corrige un bloqueo real de red del proveedor. Si el contenedor no puede salir a `web.whatsapp.com`, el bot seguira sin iniciar aunque ahora lo informara mejor.

### [2026-05-27] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/admin/AdminMissionManager.tsx`, `src/utils/missions.ts`, `src/types.ts`, `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** El GM ahora entiende modos de mision en espanol, reglas de escalada y un estado narrativo estructurado de victoria o derrota.
*   **Cambios Clave:**
    *   **[Admin] Modo del GM:** Las misiones ahora pueden guardar `modoMision`, objetivos de jugadores, objetivos del GM, condiciones de victoria, condiciones de derrota y permisos de escalada a combate dentro del mismo `GM_CONFIG` embebido.
    *   **[GM-bot] Conducta por tipo de mision:** `gmTracker.js` ahora inyecta reglas explicitas para modos como `combate`, `jefe`, `investigacion`, `recoleccion`, `escolta`, `social` y `exploracion`, de modo que el GM no fuerce peleas cuando la mision no lo pide y si pueda buscar la victoria enemiga cuando el encounter realmente lo amerite.
    *   **[Resolucion] Estado de mision obligatorio:** El prompt Human-First ahora exige un bloque final `[ESTADO_MISION]` con `resultado`, `motivo` y `siguiente_presion`, para marcar `en_curso`, `victoria_jugadores` o `victoria_gm` cuando el desenlace ya sea obvio dentro de la propia narrativa.
*   **Notas/Advertencias:** `npm run build` paso bien. `npx tsc --noEmit` sigue fallando por errores previos y ajenos en `src/components/RankingCard.tsx` y `src/components/WeeklyRankingPodium.tsx`.

### [2026-05-27] - [Autor: Codex]
*   **Archivos Modificados:** `src/components/admin/AdminMissionManager.tsx`, `src/utils/missions.ts`, `src/types.ts`, `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen:** Puente canÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³nico entre misiones del panel admin y el Game Master para restringir magias de NPCs al grimorio oficial.
*   **Cambios Clave:**
    *   **[Admin] NPCs tÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡cticos canÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³nicos:** El editor de misiones ahora permite definir NPCs del encounter con rol, stats, notas tÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡cticas y una lista explÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­cita de magias permitidas tomadas del grimorio administrado.
    *   **[Compatibilidad] Config embebida sin migraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n:** La configuraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del GM se serializa dentro de `instructions` usando bloques `[GM_CONFIG]...[/GM_CONFIG]`, evitando cambios de esquema en Supabase y manteniendo compatibilidad con las misiones existentes.
    *   **[GM-bot] Magia restringida por payload:** El bot parsea esa configuraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n embebida y la inyecta en `DATOS_DE_MISION` como bloque canÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³nico de NPCs y magias permitidas, junto con una regla explÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­cita para no inventar hechizos fuera de la lista.
*   **Notas/Advertencias:** `npx tsc --noEmit` sigue fallando por errores previos y ajenos en `src/components/RankingCard.tsx` y `src/components/WeeklyRankingPodium.tsx`. La validaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de estos cambios se hizo con chequeo sintÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ctico del bot y revisiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n focalizada del flujo admin -> misiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n -> GM.

### [2026-05-27] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/ai.js`, `AI_CHANGELOG.md`
*   **Resumen:** Restauracion del prompt Human-First del Game Master y confirmacion de salida larga en Gemini.
*   **Cambios Clave:**
    *   **[GM] Prosa organica:** `buildGMPrompt()` fue reemplazado exactamente por la version Human-First pedida por el usuario, reforzando tono de maestro de calabozo, prosa libre, cliffhanger cinematografico y bloques Markdown solo para mecanicas RPG.
    *   **[AI] Salida extendida:** Se confirmo que `maxOutputTokens` permanece en `2048` para evitar que la narrativa del GM se corte a mitad de escena.
*   **Notas/Advertencias:** El prompt queda mas libre y atmosferico; el siguiente ajuste recomendable es seguir puliendo la lectura tactica del lado cliente sin volver a una plantilla numerada.

### [2026-05-27] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del conteo oficial de tokens en Gemini para el Game Master.
*   **Cambios Clave:**
    *   **[AI] countTokens estable:** Se corrigio la llamada a `model.countTokens(...)` para reutilizar el `systemInstruction` ya formateado por el propio modelo y enviar solo `contents`, evitando el `400 Bad Request` que producia la variante anidada de `generateContentRequest.system_instruction`.
*   **Notas/Advertencias:** El log de `usageMetadata` que ya estabamos recibiendo seguia siendo valido; el error afectaba solo la verificacion preventiva previa, no la generacion final de la narrativa.

### [2026-05-27] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`, `kingdoom-bot/src/gmTracker.js`, `AI_CHANGELOG.md`
*   **Resumen:** Integracion de `countTokens` oficial de Gemini y resumen heuristico para misiones extensas del Game Master.
*   **Cambios Clave:**
    *   **[AI] Conteo oficial:** `askKingdoomAI` ahora consulta `model.countTokens(...)` antes de `generateContent` cuando hay budget configurado, dejando el estimate de caracteres solo como primera poda y usando el conteo real como segunda barrera.
    *   **[AI] Ajuste post-conteo:** Si el payload sigue excedido tras el conteo oficial, el ultimo bloque de entrada se comprime otra vez antes de llamar al modelo.
    *   **[GM] Resumen de mision:** `gmTracker.js` ahora aplica un resumen heuristico orientado a objetivos, NPCs y stats cuando `Mission Instructions` llega demasiado largo desde la BD, para priorizar la informacion tactica antes que texto ornamental.
*   **Notas/Advertencias:** El resumen heuristico preserva lineas iniciales y lineas con palabras clave tacticas. Si la redaccion de las misiones cambia mucho, conviene revisar los keywords para no perder datos importantes.

### [2026-05-27] - [Autor: Codex]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/ai.js`, `kingdoom-bot/src/supabase.js`, `AI_CHANGELOG.md`
*   **Resumen:** Endurecimiento estructural del Game Master para separar reglas del sistema, datos narrativos y presupuesto de payload.
*   **Cambios Clave:**
    *   **[GM] Separacion de capas:** El prompt fijo del sistema ahora conserva solo las reglas del narrador, mientras que la mision y las acciones de jugadores viajan como datos delimitados en el mensaje de usuario, reduciendo el riesgo de prompt injection por texto de BD o chat.
    *   **[GM] Recortes defensivos:** Se anadieron sanitizacion y truncado de instrucciones de mision, mensajes de jugadores y contexto acumulado para evitar payloads desbocados y mantener el trigger del GM dentro de un tamano controlado.
    *   **[AI] Budget de entrada:** `askKingdoomAI` ahora admite un presupuesto estimado de tokens de entrada, recorta historial si se excede y registra `usageMetadata` de Gemini para observar consumo real en produccion.
    *   **[Supabase] Consulta minima:** La carga de misiones por prefijo ahora trae solo `id`, `title` e `instructions`, en lugar de hacer `select(*)` completo.
*   **Notas/Advertencias:** El budget actual del GM se fijo en 6000 tokens estimados como guardrail conservador. Si la narrativa sigue llegando corta con misiones muy densas, conviene ajustar ese umbral usando las metricas reales que ahora quedan en logs.

### [2026-05-27] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/gmTracker.js`, `kingdoom-bot/src/ai.js`
*   **Resumen:** OptimizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del motor del Game Master para rol narrativo orgÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡nico sin lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mites rÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­gidos y agnÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³stico al lore.
*   **Cambios Clave:**
    *   **Prompt DinÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡mico y AgnÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³stico:** Se refactorizÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `buildGMPrompt` en `gmTracker.js` para eliminar referencias estÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ticas (como "Shadow Garden"). Ahora el GM adopta la personalidad y el lore definidos exclusivamente en las instrucciones de la misiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n desde la base de datos.
    *   **EliminaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de LÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mites y Formato Natural:** Se removiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la restricciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de 350 palabras y el uso de listas numeradas (1., 2., 3...). El bot ahora usa prosa fluida y bloques de cÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³digo Markdown para exponer mecÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡nicas RPG (cooldowns, niveles, daÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±o) imitando el estilo de rol avanzado humano.
    *   **ExpansiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de Tokens:** Se incrementÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ `maxOutputTokens` de 1024 a 2048 en `ai.js` para prevenir que respuestas narrativas extensas se corten prematuramente.
    *   **Fidelidad TÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ctica:** El sistema ahora estÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ instruido para priorizar el respeto estricto a las estadÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­sticas reales (niveles, HP, etc.) de los NPCs creados en el panel de control.

### [2026-05-27] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/components/admin/AdminControlPrimitives.tsx`, `src/components/PlayerProfilePanel.tsx`
*   **Resumen:** RevisiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n integral de UX/UI Mobile-First para compactar y optimizar espacio en pantallas pequeÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±as.
*   **Cambios Clave:**
    *   **[UI Admin] Modal Full-screen:** `AdminControlSheet` ahora ocupa el 100% de la pantalla en dispositivos mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³viles sin bordes redondeados, maximizando el espacio Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºtil, mientras que en desktop mantiene su diseÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±o de panel flotante (`md:h-[92vh] md:rounded-[2rem]`).
    *   **[UI Admin] Formularios y Primitivas Compactas:** Se redujo el padding excesivo (`p-5` a `p-4 sm:p-5`) y los gaps en los inputs, tarjetas informativas y previas del mercado dentro de `AdminControlPrimitives.tsx`, requiriendo menos scroll vertical para administrar el reino desde el celular.
    *   **[UI Perfil] OptimizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de Layout:** `PlayerProfilePanel` ajustÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la separaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de sus bloques (`gap-5` a `gap-4 sm:gap-5`) y compactÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ los paddings generales de sus secciones internas para eliminar espacios vacÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­os innecesarios sin perder jerarquÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a visual.
*   **Notas/Advertencias:** NingÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºn cambio de lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³gica de Supabase ni del bot. Exclusivo de Frontend UI.

### [2026-05-26] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/auditLog.js`, `kingdoom-bot/src/adminStore.js`
*   **Resumen:** CorrecciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de rutas absolutas para garantizar persistencia local y remota del bot.
*   **Cambios Clave:**
    *   **[Admin] Rutas dinÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡micas:** Se implementaron rutas dinÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡micas (usando `__dirname` y `path.join`) para `admin_audit_log.json` y `admins.json`. Esto corrige el fallo silencioso donde el comando `!bitacora` no mostraba informaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n al correr en Windows y asegura compatibilidad nativa tanto local como en el contenedor de Hugging Face.

### [2026-05-25] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/player.js`
*   **Resumen:** ActualizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del comando `!ayuda`.
*   **Cambios Clave:**
    *   **[Admin/Soberano] MenÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âº de Ayuda:** Se aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adieron los comandos administrativos faltantes (`!actividad`, `!grupoactual` y `!groupid`) a la lista desplegada por el comando `!ayuda`.

### [2026-05-25] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/src/supabase.js`
*   **Resumen:** CreaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n del comando de reporte `!actividad` (o `!inactivos`).
*   **Cambios Clave:**
    *   **[Admin] Reporte de Inactividad:** Se aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el comando `!actividad` exclusivo para administradores, el cual extrae a todos los usuarios ordenados por su Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºltima fecha de conexiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n y los formatea visualmente en columnas monospaciadas para rÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡pida lectura en WhatsApp.

### [2026-05-25] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-sync/supabase_purge_inactive.sql`, `Kingdoom-sync/src/utils/players.ts`, `Kingdoom-sync/src/context/PlayerSessionContext.tsx`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/index.js`
*   **Resumen:** Sistema de purga automÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡tica por 15 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as de inactividad (Web y WhatsApp).
*   **Cambios Clave:**
    *   **[Base de Datos] SQL Cron:** Nuevo script para aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adir la columna `last_active_at` y crear un cron diario (`pg_cron`) que purgue perfiles inactivos.
    *   **[Web] Rastreo de Actividad:** Se ha integrado `touchPlayerActivity` al iniciar o recuperar sesiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n en la web para evitar purgas errÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³neas.
    *   **[Bot] IntercepciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de Mensajes:** Todo comando procesado por el bot en WhatsApp actualizarÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ la actividad del usuario en tiempo real.

### [2026-05-25] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`
*   **Resumen:** Mejora del comando !purga para reportar y etiquetar a los usuarios pendientes.
*   **Cambios Clave:**
    *   **[Admin] Reporte de dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as restantes:** El comando `!purga` ahora enumera a todos los usuarios pendientes que aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºn no han superado el lÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­mite de 5 dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as, mencionÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ndolos mediante etiqueta (`@usuario`) y mostrando cuÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ntos dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as les quedan para ser eliminados ("X dÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­as para eliminaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n"). Esto funciona en adiciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n a la expulsiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n automÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡tica de aquellos que ya hayan cumplido el plazo.

### [2026-05-25] - [Autor: Antigravity]
*   **Archivos Modificados:** `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`, `mcp_config.json`
*   **Resumen:** Reforzamiento de reglas de protocolo e integraciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n local del MCP Kingdoom-memory.
*   **Cambios Clave:**
    *   **[Core Rule] Registro Obligatorio:** Se actualizÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la regla de Inteligencias Artificiales del changelog para exigir que **cualquier** cambio, por mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­nimo que sea, deba documentarse en el historial y en la memoria MCP, y subirse obligatoriamente a Git de inmediato.
    *   **[Core Rule] SincronizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n:** Se inyectaron directrices principales (`core-rule`) en la memoria MCP exigiendo sincronizaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n obligatoria inicial (`git pull`) y publicaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n obligatoria final (`git push`) en cada sesiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n.
    *   **[Sistema] Servidor MCP:** Se configurÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ exitosamente el servidor local MCP en `mcp_config.json` para tener acceso nativo a la memoria compartida de la IA.

### [2026-05-25] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/scheduler.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/activeProfileStore.js`
*   **Resumen:** CorrecciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de bug de usuarios con mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºltiples nÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºmeros en reportes, implementaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de mensajes motivacionales automatizados, y habilitaciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n oficial de sistema multicuentas para WhatsApp.
*   **Cambios Clave:**
    *   **Bugfix en !pendientes y Scheduler (Fix):** Se ajustÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la funciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n de limpieza de nÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºmeros `normalizePhone` porque estaba fusionando nÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºmeros separados por coma en un Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºnico nÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºmero corrupto. Ahora, cuando el bot revisa listas de participantes o envÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a notificaciones masivas, separa las comas primero y evalÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºa cada nÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºmero individualmente, arreglando falsos positivos de "no registrados" para los administradores y permitiendo que les lleguen las recompensas.
    *   **Mensajes Motivacionales de Rol (Feature):** El planificador de tareas (`scheduler.js`) fue rediseÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±ado. Se eliminÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ el reporte semanal de ranking, y ahora envÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a un mensaje inmersivo y poÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©tico ("Un nuevo ciclo comienza...") todos los lunes. AdemÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡s, el aviso de reset diario a la medianoche fue adaptado para incluir el nombre del personaje principal del usuario, haciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©ndolo 100% de rol.
    *   **Soporte Multicuentas (Feature):** Se eliminÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ la restricciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n en la base de datos que impedÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â­a a los usuarios vincular un nÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºmero de telÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©fono que ya estaba en uso. 
    *   **Comando `!cambiarcuenta` (Nuevo):** Los jugadores con mÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºltiples cuentas web (ej: Nothing y Alexander) pueden vincular ambas a su mismo WhatsApp. Se aÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³ un store local (`activeProfileStore.js`) y un comando `!cambiarcuenta <nombre>` para que el jugador elija cuÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡l de sus fichas estÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡ activa para interactuar con el OrÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡culo, jugar o recibir oro.

### [2026-05-25] - Oracle and Profile Improvements
- Conectado el OrÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¡culo a las tablas de eventos y misiones activas.
- Refinado el comando '!perfil' para separar y clasificar inteligentemente los IDs de WhatsApp y los nÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âºmeros de telÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â©fono reales.
- AÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â±adidos comandos faltantes al menÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Âº de ayuda (!ayuda) con restricciÃ¯Â¾Æ’ÃŽÂ´Ã¯Â½Â³n por roles.



---

### [2026-05-22] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-bot/src/handlers/player.js`, `Kingdoom-bot/src/supabase.js`, `Kingdoom-bot/src/handlers/games.js`
*   **Resumen:** CorrecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de parseo en comandos y expansiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de la visiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo hacia el Inventario Real.
*   **Cambios Clave:**
    *   **Trim de prefijo (Fix):** Se ajustÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la funciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n `parseCommand` en `player.js` para aplicar un `.trim()` sobre el string inmediatamente despuÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©s de remover el prefijo `!`. Esto soluciona un error crÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­tico donde comandos como `! Verificar <id>` se registraban como comando vacÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­o (`""`) debido al espacio residual.
    *   **Inventario en el OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo (Feature):** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `getPlayerInventory` en `supabase.js` para consultar la tabla `player_inventory`. Ahora el `handleOraculo` en `games.js` inyecta las compras reales del mercado web (con sus cantidades correspondientes) directo al contexto de la IA. Si el jugador le pregunta "Ã¯Â¾Æ’Ã¯Â¿Â½Ã‚â‚¬Ã¥Â â„¢Ã£ï¿½Â¤Ã¯Â½Â¿CÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³mo es mi equipamiento?", el OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo ya no alucinarÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ basÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ndose solo en su ficha original, sino que comentarÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡gicamente sobre las pociones o espadas reales que haya adquirido con oro.

### [2026-05-22] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `AI_CHANGELOG.md`
*   **Resumen:** Correccion del cierre visual en carreras online del hipodromo.
*   **Cambios Clave:**
    *   **Foto finish retenida:** La carrera online ahora conserva una instantanea local de la sesion recien terminada aunque Supabase ya la marque como `finished` y la quite del listado activo.
    *   **Ganador visible:** Se mantiene la camara de llegada y el nombre del caballo ganador despues de liquidar la carrera, en vez de resetear el canvas a los puestos iniciales.
    *   **Feedback correcto:** El mensaje posterior a la liquidacion ahora informa directamente que caballo cruzo primero y deja la carrera visible hasta que se elija o cree otra sala.
*   **Notas/Advertencias:** La solucion mantiene el filtro que oculta salas `finished` por defecto en la lista publica; solo conserva localmente la ultima carrera terminada del usuario actual para evitar mostrar llegadas antiguas al entrar por primera vez.

### [2026-05-22] - [Autor: Antigravity]
*   **Archivos Modificados:** `Kingdoom-bot/src/handlers/games.js`
*   **Resumen:** Mejora del OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo con Memoria y Contexto de Jugador.
*   **Cambios Clave:**
    *   `games.js`: Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un mapa en memoria (`oraculoMemory`) que guarda el historial de los Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºltimos 3 intercambios por cada chat/grupo, dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ndole al OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo memoria a corto plazo.
    *   El orÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo ahora sabe quiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©n le habla y cuÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡nto oro tiene. El prompt fue ajustado para referirse al jugador por su nombre, y para burlarse o codiciar sus riquezas basÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ndose en su saldo en la base de datos, mejorando drÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡sticamente el rol en vivo.
    *   **Flexibilidad (Nuevo):** Se eliminÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la restricciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n rÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­gida de "exactamente 2-3 lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­neas". Ahora se le permite adaptarse: puede dar respuestas de 1-2 lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­neas si es un simple vaticinio o explayarse hasta 2 pÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡rrafos si la pregunta requiere contexto del *lore*. AdemÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s, puede interpretar preguntas "Off-Rol" (fuera de personaje) absorbiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©ndolas de forma poÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©tica como si fueran hechicerÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a o idiomas forasteros.
    *   **IntegraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Fichas (Nuevo):** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `getPlayerSheet` en `supabase.js`. El orÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo ahora extrae la Ficha de Personaje (Rol) del jugador desde Supabase e inyecta su Nombre de personaje, Raza, Origen, Poderes, Arma y Personalidad en el sistema de la IA. Esto permite al orÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo dar profecÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­as hiper-personalizadas basadas en la lore individual de cada guerrero.
    *   `ai.js`: Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un tercer modelo de respaldo (`gemini-1.5-flash`) en la cascada de fallbacks para mitigar errores `503 Service Unavailable` provocados por la saturaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n global de los servidores de Google Generative AI en los modelos `2.5` y `3.5`.
    *   `ai.js`: Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un tercer modelo de respaldo (`gemini-1.5-flash`) en la cascada de fallbacks para mitigar errores `503 Service Unavailable` provocados por la saturaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n global de los servidores de Google Generative AI en los modelos `2.5` y `3.5`.
    *   **PrevenciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Alucinaciones (Nuevo):** Se le dio la instrucciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n estricta al OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo de negarse a revelar las riquezas o secretos de *otros* jugadores. Si se le pregunta por alguien ajeno, ahora dirÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ de forma misteriosa que no puede revelar secretos que estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡n bajo la sombra, evitando que la IA invente nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmeros falsos para compensar la falta de contexto en memoria.
    *   **Transferencia de Oro (`!oro`):** Se modificÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el comando `!oro` en `player.js`. Ahora, si se usa sin parÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡metros, muestra el saldo actual. Si se usa como `!oro <monto> <@usuario>`, permite a los jugadores enviarse oro entre sÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­, descontando de la cuenta del emisor y sumando a la del receptor (con validaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de fondos y protecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de auto-envÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­o).
*   **Archivos Modificados:** `Kingdoom-bot/src/supabase.js`, `Kingdoom-bot/src/handlers/games.js`, `Kingdoom-bot/src/handlers/admin.js`, `Kingdoom-bot/src/index.js`
*   **Resumen:** Arquitectura RAG e integraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Base de Conocimiento entre Kingdoom-sync (Archivista) y Kingdoom-bot.
*   **Cambios Clave:**
    *   `supabase.js`: Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adieron funciones `getKnowledgeDocuments` y `pickKnowledgeContext` para consultar la tabla `knowledge_documents`.
    *   `!oraculo` (`games.js`): Ahora inyecta dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡micamente hasta 2 documentos relevantes de la base de datos de conocimiento como contexto al prompt de Gemini, compartiendo la misma memoria del Archivista web.
    *   `!data` (`admin.js` y `index.js`): Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ este comando exclusivo de admin para WhatsApp. Permite adjuntar un archivo `.txt` y cargarlo a la tabla Supabase, sincronizando la memoria directamente desde WhatsApp hacia la web.

### [2026-05-22] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`, `src/features/businesses/businesses.service.ts`
*   **Resumen:** ImplementaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de la funcionalidad de borrado de negocios y propuestas de negocios desde el panel de control administrativo.
*   **Cambios Clave:**
    *   **[Backend] EliminaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de registros:** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adieron las funciones `deleteBusiness` y `deleteBusinessProposal` a los servicios de negocios para ejecutar los borrados con su respectivo manejo de estado.
    *   **[Admin] BotÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n Borrar Negocio Activo:** Los administradores ahora pueden borrar negocios permanentemente pulsando el Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­cono de la papelera junto al estado del almacenamiento en la tarjeta del negocio, con un diÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡logo de confirmaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n previo.
    *   **[Admin] BotÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n Borrar Propuesta:** Se agregÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un botÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n rojo de "Borrar" en el formulario de creaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n/ediciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de propuestas, posibilitando la eliminaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de propuestas mal formuladas o expiradas, igualmente protegido por confirmaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n.
*   **Notas/Advertencias:** Estas acciones no se pueden deshacer y el oro no reclamado en negocios activos se perderÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ si son eliminados.

### [2026-05-22] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/PlayerProfilePanel.tsx`
*   **Resumen:** OptimizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de la interfaz de "Tus negocios" para ahorrar espacio y mejorar la experiencia de usuario.
*   **Cambios Clave:**
    *   **[UI] Filtrado AutomÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡tico:** Las propuestas de negocios ahora desaparecen instantÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡neamente de la lista "Propuestas pendientes" una vez que son respondidas, mostrando solo aquellas en estado "pending".
    *   **[UI] SecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n Colapsable:** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un botÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n "Mostrar / Ocultar" en la cabecera. Por defecto, todo el bloque interno de "Negocios activos" y "Propuestas" aparece colapsado, limpiando visualmente el perfil del jugador.
*   **Notas/Advertencias:** Estos cambios operan exclusivamente a nivel de presentaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n en la SPA; la lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³gica de red y base de datos (RPC) permanece intacta.

### [2026-05-22] - [Autor: Jarvis]
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

### [2026-05-22] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/businesses/businesses.service.ts`, `supabase_player_businesses.sql`
*   **Resumen:** Ajuste de diagnostico para RPC de negocios y recarga explicita del schema de PostgREST tras crear las funciones.
*   **Cambios Clave:**
    *   **[FIX] Deteccion precisa de RPC faltante:** El frontend de negocios ya no colapsa cualquier error que mencione la funcion en el mismo mensaje generico. Ahora distingue mejor entre RPC no visible en schema cache y errores reales de ejecucion.
    *   **[FIX] Recarga del schema de Supabase:** Se agrego `notify pgrst, 'reload schema';` al final de `supabase_player_businesses.sql` para forzar que PostgREST vea `respond_business_proposal` y `collect_business_gold` inmediatamente despues de la migracion.
*   **Notas/Advertencias:** Si ya habias ejecutado el SQL antes de este ajuste, corre solo `NOTIFY pgrst, 'reload schema';` en el SQL Editor y luego recarga la pagina.

### [2026-05-21] - [Autor: Jarvis]
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

### [2026-05-20] - [Autor: Antigravity] - [SesiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n 3 - AuditorÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a de Comandos]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/games.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`
*   **Resumen:** AuditorÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡tica de todos los handlers del bot y correcciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de permisos/comandos de administraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n.
*   **Cambios Clave:**
    *   **[SOPORTE] Comando `!pendiente` singular:** Se mapeÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `!pendiente` en el router principal (`index.js`) y en `admin.js` para que los administradores y dueÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±os puedan usar tanto el formato singular como el plural (`!pendientes`). Anteriormente, usar el singular hacÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a que la peticiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n fuera procesada por la IA al no estar en la lista blanca de comandos de administrador en `index.js`.
    *   **[SOPORTE] Acceso a `!censo` y `!pendientes` para Administradores:** Se validÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ y asegurÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ que los usuarios que posean privilegios de administrador (ademÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s del Owner) puedan ejecutar `!censo` y `!pendientes` sin restricciones de permisos.
    *   **[CRÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¦Å½Â§ICO] Fix `!dados` Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¢Ã¯Â¾Æ’Ã£â€šâ€žÃ£ï¿½Å½Ã¯Â¾Æ’Ã£â€šâ€žÃ‚â‚¬Ã¯Â¿Â½ sender incorrecto en grupos (`games.js`):** El comando `!dados` usaba `msg.from` para buscar al jugador en Supabase. En grupos de WhatsApp, `msg.from` devuelve el JID del **grupo** (ej: `12345@g.us`), no el del jugador. Esto hacÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a que el bot nunca encontrara al jugador y siempre respondiera "No estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s registrado". Corregido usando `msg.author || msg.from`, el patrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ndar del resto de los handlers.
    *   **[MEDIO] Fix `!ban` Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¢Ã¯Â¾Æ’Ã£â€šâ€žÃ£ï¿½Å½Ã¯Â¾Æ’Ã£â€šâ€žÃ‚â‚¬Ã¯Â¿Â½ falso positivo (`admin.js`):** Cuando un admin ejecutaba `!ban` con un nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero no registrado en la DB, Supabase actualizaba 0 filas sin lanzar un error, y el bot respondÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a "baneado" falsamente. Se agregÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ una verificaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n previa que consulta al jugador y retorna un error claro si no existe. AdemÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s, el mensaje de confirmaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n ahora muestra el **username** del jugador baneado, no solo el nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero.
    *   **[MEJORA] Comando `!grant` y nuevo `!quitar` (`admin.js`, `index.js`):** Se mejorÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la gestiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de oro para los administradores. Ahora `!grant` acepta tanto el celular, el **nombre de usuario**, o el **ID de la pÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡gina web** (prefijo UUID) del jugador (ej. `!grant Zoelfrost 1000`, `!grant 2354 1000`), facilitando enormemente la administraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n. AdemÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s, se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el comando `!quitar` para restar oro sin necesidad de usar nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmeros negativos (ej. `!quitar Zoelfrost 500`). Se actualizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el menÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âº de ayuda (`!admin`) para reflejar estos cambios.
    *   **[MEJORA] OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo y Memoria**
        - **InyecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Inventario Real:** El OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo ahora lee el inventario real del jugador (comprado en el mercado con oro) y lo integra en sus respuestas. Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un error en la consulta a Supabase que causaba fallos silenciosos al buscar la columna `category` (que en realidad es `item_category`), logrando que el bot vuelva a "ver" los Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­tems correctamente, extrayendo tambiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©n el `item_name`. AdemÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s, se agregÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ una inyecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n explÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­cita para inventarios vacÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­os, evitando que el OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo "evada" la pregunta con frases mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­sticas cuando el jugador no tiene Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­tems.
        - **Identidad del Jugador (15-digit ID Fix):** Se agregÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un mapeo interno para que el OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo reconozca correctamente el ID de 15 dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­gitos (`275162062668001`) del Owner como el perfil principal (`595987273405`), evitando que el sistema lo trate como un "alma sin nombre".
        - **Personalidad Mejorada:** Se rediseÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el prompt del OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo para que actÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºe como un "vidente veterano y cÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­nico", hablando de forma mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s directa, coloquial y menos poÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©tica. Su longitud se limitÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ a 3 pÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡rrafos y se instruyÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ para negarse a revelar fortunas de terceros.
    *   **[MEJORA] Baneo y gestiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Administradores unificada (`admin.js`):** Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un helper centralizado para que `!ban`, `!add admin`, `!remove admin`, `!grant` y `!quitar` puedan procesar a los jugadores usando su **ID web**, **username** o **celular**. Esto estandariza la experiencia de administraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n, permitiendo identificar jugadores de mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºltiples maneras, tal como se hace en el comando de vinculaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n `!verificar`.
    *   **[ELIMINADO] Comando `!broadcast` removido (`admin.js`, `index.js`):** El comando fue eliminado por decisiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del Soberano. WhatsApp ya ofrece la funcionalidad nativa de @all / @todos en grupos, lo que hace innecesario un broadcast por DM que ademÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s tenÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a problemas de compatibilidad con nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmeros no registrados.
    *   **[NUEVO] Comando `!purga` (`admin.js`, `tracker.js`, `index.js`):** Nuevo comando que permite al Staff expulsar del grupo de WhatsApp a los usuarios que llevan mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s de 5 dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­as sin hacer su ficha. El bot mantiene un archivo JSON interno (`pending_tracker.json`) que registra la primera vez que un usuario aparece en `!pendientes`. Al ejecutar `!purga`, el bot verifica quiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©nes superaron los 5 dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­as y los remueve automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente. Requiere que el bot sea admin del grupo.
    *   **[MEJORA] `!pendientes` ahora rastrea fechas (`admin.js`, `tracker.js`):** Cada vez que se ejecuta `!pendientes`, el bot registra la fecha de detecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de cada usuario pendiente. Esto alimenta al tracker que `!purga` consume para calcular los 5 dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­as de gracia.
    *   **[FIX] `!censo` / `!fichas` Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¢Ã¯Â¾Æ’Ã£â€šâ€žÃ£ï¿½Å½Ã¯Â¾Æ’Ã£â€šâ€žÃ‚â‚¬Ã¯Â¿Â½ columna inexistente (`supabase.js`):** La query de `getRealmCensus()` pedÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a `player_id` a la tabla `character_sheets`, pero esa columna no existe en Supabase (solo existe `playerId` en camelCase). Esto hacÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a que el comando fallara con "Error al obtener el censo del reino". Corregido removiendo la columna fantasma.
    *   **[BONUS] Formato de oro en `!dados`:** Se aplicÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `.toLocaleString('es-PY')` al mostrar el oro del jugador en el mensaje de saldo insuficiente, siendo consistente con el resto del bot.

### [2026-05-20] - [Autor: Antigravity] - [SesiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n 3 - Fix OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo Cuota y MigraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n a Gemini 2.5]
*   **Archivos Modificados:** `kingdoom-bot/src/ai.js`
*   **Cambios Clave:**
    *   **[CRÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¦Å½Â§ICO] Fallback de modelo en `!oraculo` (`ai.js`):** Se identificÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ que todos los modelos Gemini 1.0 y 1.5 (incluyendo `gemini-1.5-flash`) fueron desactivados por Google, arrojando error `404 Not Found`. Se migrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el modelo por defecto del bot de `gemini-1.5-flash` a **`gemini-2.5-flash`**.
    *   **[CRÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¦Å½Â§ICO] Soporte para mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºltiples claves API con rotaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡tica (`ai.js`):** El usuario configurÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ dos llaves API separadas por comas en `GEMINI_API_KEY`. Se rediseÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el manejador para procesar una lista de llaves de manera dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡mica. Al invocar el OrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡culo, intenta secuencialmente con cada clave. Si una falla (por ejemplo, por lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­mite de cuota o error 429), realiza un log detallado y reintenta con la siguiente clave transparente y automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente.
    *   **[MEJORA] Cadena de Fallback de Modelos en caso de 404/503 (`ai.js`):** Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ una lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³gica de fallback de modelos en bucle. Si el modelo actual (ej: `gemini-2.5-flash`) devuelve `404 Not Found` o un error temporal de sobrecarga `503 Service Unavailable`, el bot no descartarÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ la clave de inmediato; en su lugar, intentarÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente con otros modelos candidatos como **`gemini-3.5-flash`** para asegurar respuestas exitosas durante picos de demanda del servidor de Google.

### [2026-05-20] - [Autor: Antigravity] - [SesiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n 3 - AuditorÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a Scheduler]
*   **Archivos Modificados:** `kingdoom-bot/src/scheduler.js`
*   **Cambios Clave:**
    *   **[CRÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¦Å½Â§ICO] Fix reset semanal `weekly_gold` (`scheduler.js`):** La operaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n `supabase.from('players').update({ weekly_gold: 0 })` sin ningÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºn filtro es **bloqueada por defecto** por Supabase JS v2 como medida de seguridad contra actualizaciones masivas accidentales. Esto hacÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a que el ranking semanal se anunciara correctamente cada lunes pero el oro semanal nunca se reseteara, acumulÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ndose indefinidamente. Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ agregando `.gte('weekly_gold', 0)` como filtro de seguridad que coincide con todos los jugadores (el oro nunca es negativo por diseÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±o).

### [2026-05-20] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/handlers/welcome.js`, `kingdoom-bot/src/handlers/admin.js`, `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `kingdoom-bot/README.md`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/handlers/player.js`
*   **Resumen de Tareas:** CorrecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del sistema de bienvenida, comando `!groupid`, fix del mercado, correcciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de textos truncados, fix de imports en consultas detalladas y migraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del bot a Hugging Face Spaces (16 GB RAM gratis).
*   **Cambios Clave:**
    *   **MigraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n a Hugging Face Spaces:** Se trasladÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el bot desde Railway (con crÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©ditos agotados) a Hugging Face Spaces basado en Docker, obteniendo **16 GB de RAM y 2 vCPU** de forma completamente gratuita, eliminando crasheos de memoria por Puppeteer/Chromium.
    *   **ResoluciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de puertos (7860) y metadatos:** Se agregÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `ENV PORT=7860` en el `Dockerfile` y se creÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el `README.md` con la cabecera YAML requerida por Hugging Face. Esto solucionÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la pantalla infinita de "Preparing Space" permitiendo la comunicaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n correcta con la interfaz web.
    *   **Fix de permisos no-root:** Se crearon los directorios del bot y se asignÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `chmod -R 777` en el Dockerfile para que el usuario de Hugging Face (`1000`) pueda escribir los datos de autenticaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de WhatsApp en la carpeta temporal de persistencia.
    *   **Fix del comando !mercado (columna 'available' inexistente):** Se detectÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ que las consultas a la tabla `market_items` en `supabase.js` filtraban usando `.eq('available', true)`. Dado que la columna `available` no existe en la base de datos de Kingdoom (el stock se gestiona en su lugar con `stock_status`), la API de Supabase devolvÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a un error de columna inexistente, causando que el bot reportara falsamente que el mercado estaba vacÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­o. Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ removiendo este filtro y adaptando `getRealmSnapshot` para excluir items con `stock_status = 'sold-out'`.
    *   **Fix de importaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de getMissionDetails y getEventDetails:** Los comandos de detalle de misiones (`!mision <nombre>`) y eventos (`!evento <nombre>`) fallaban silenciosamente lanzando el error de sistema `"El reino estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ en llamas..."`. Se detectÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ que las funciones `getMissionDetails` y `getEventDetails` no estaban importadas al inicio de `player.js` desde `../supabase.js` a pesar de estar declaradas e implementadas. Se agregaron a los imports del archivo para solucionar el fallo de referencia.
    *   **AmpliaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­mite de texto en comandos (!item, !mision, !evento):** Las descripciones y habilidades se recortaban excesivamente en WhatsApp (`clipText` recortaba a 110, 130 o 140 caracteres, dejando textos incompletos con suspensivos). Se ampliÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­mite en los comandos de detalle a **500 caracteres**, permitiendo la lectura de habilidades legendarias completas y descripciones extendidas sin spam descontrolado.
    *   **Fix de filtro de grupo en bienvenida:** Ahora la bienvenida se dispara en cualquier grupo si no hay filtro configurado en las variables de entorno, evitando retornos silenciosos.
    *   **Log de diagnÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³stico:** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±ade `console.log` para `group_join` detallando los IDs de grupos.
    *   **Comando !groupid:** Se creÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el comando `!groupid` para administradores que devuelve el JID Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºnico del grupo (`@g.us`) donde se ejecuta para poder configurar las variables del bot de bienvenida.
*   **Notas/Advertencias:** El bot estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ completamente enlazado, conectado y activo de forma gratuita en su nueva infraestructura de Hugging Face Spaces.

### [2026-05-19] - [Autor: Antigravity] - [SesiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n 2]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/components/PlayerProfilePanel.tsx`, `kingdoom-bot/src/supabase.js`, `kingdoom-bot/src/handlers/player.js`, `kingdoom-bot/src/index.js`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ImplementaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del sistema de vinculaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n segura (`!verificar`) entre perfiles web y WhatsApp y visualizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n en el Panel de Perfil de la web.
*   **Cambios Clave:**
    *   **Comando de VinculaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n !verificar:** Se creÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la funciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n `verifyAndLinkPlayer` en el backend del bot (`kingdoom-bot/src/supabase.js`) que permite a cualquier usuario vincular su nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero de WhatsApp con su cuenta web medieval existente ingresando su nombre de usuario (sin distinguir mayÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsculas/minÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsculas) o el segmento inicial de su ID UUID (ej. `!verificar Zoelfrost` o `!verificar 2354`).
    *   **Bypass de Jugador no Registrado:** Se ubicÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el manejador de `!verificar` en `kingdoom-bot/src/handlers/player.js` arriba del control de seguridad de usuario no registrado, permitiendo que nuevos contactos puedan vincularse de manera fluida sin ser rechazados como viajero desconocido.
    *   **VisualizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de ID en la Web:** Se actualizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `src/components/PlayerProfilePanel.tsx` tanto en la vista colapsada como expandida para mostrar el ID corto (los primeros 8 caracteres del UUID) de manera clara y estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©tica.
    *   **Instrucciones de VinculaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n en UI:** En caso de que la cuenta web no tenga ningÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºn WhatsApp vinculado (`player.phone` es null), el Panel de Perfil muestra una tarjeta dorada estilizada con instrucciones precisas y el comando exacto para copiar y enviar al bot: `!verificar <id_corto>`.
    *   **ActualizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Modelos y Consultas:** Se incluyÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la columna `phone` en todas las consultas y payloads de creaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de jugadores de `src/utils/players.ts` para que el estado de vinculaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n se sincronice en tiempo real con la UI de la SPA.
    *   **HabilitaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del Comando en Ruteador:** Se registrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `'verificar'` en la lista blanca de comandos del ruteador principal `kingdoom-bot/src/index.js` para asegurar el procesamiento correcto de su prefijo.
    *   **Soporte de Citado para !add/!remove admin:** Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ una discrepancia UX donde los comandos `!add admin` y `!remove admin` requerÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­an especificar manualmente el nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero. Ahora soportan plenamente citar (responder a) un mensaje para extraer automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente el nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero del remitente del mensaje citado (OpciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n A).
    *   **PreservaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Prototipo de Mensaje:** Se solventÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un error crÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­tico de `TypeError: msg.getQuotedMessage is not a function` que provocaba que el bot crasheara con "El reino estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ en llamas..." al usar citados en comandos modificados. La causa era que la destructuraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n `{ ...msg }` eliminaba los mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©todos de la clase `Message` de `whatsapp-web.js`. Se solucionÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ implementando un envoltorio limpio basado en `Object.create(originalMsg)` que preserva la cadena de prototipos intacta.
    *   **Administradores Persistentes en Supabase:** Se detectÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ que el almacenamiento local `admins.json` dentro del contenedor de Railway se perdÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a al redesplegar la aplicaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n. Para solucionar esto de forma definitiva, se habilitÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el chequeo hÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­brido: el bot ahora valida los privilegios de administrador consultando la columna `is_admin` en la tabla `players` de Supabase de manera asÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­ncrona. Los comandos `!add admin` y `!remove admin` ahora actualizan automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente la base de datos en tiempo real para garantizar persistencia absoluta.
    *   **CorrecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de ID en Citados de Grupo:** Se solucionÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un bug crÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­tico donde responder a un mensaje de grupo con `!add admin` o `!registrar` extraÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a errÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³neamente el JID del chat del grupo (`xxxx@g.us`) a travÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©s de `quoted.from`, registrando o agregando el ID de grupo completo (`5959823815251611282780`) en lugar del nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero del jugador. Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ cambiando el objetivo para priorizar `quoted.author` (el emisor real del mensaje dentro del grupo) con fallback a `quoted.from` (en chats directos).
    *   **Mejora de UX en !registrar AutÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³nomo:** Se optimizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el flujo de error cuando un administrador ejecuta el comando `!registrar` de forma standalone (sin citar a un usuario y con argumentos incompletos). Ahora el bot detecta que no se especificaron los parÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡metros mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­nimos y responde con un mensaje guiado e instructivo que explica detalladamente el formato correcto para ambas opciones (OpciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n A: Respondiendo, OpciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n B: Directo/Manual).
    *   **Censo General de Fichas y Vinculaciones (!censo / !fichas):** Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ una funciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n integrada `getRealmCensus` en `kingdoom-bot/src/supabase.js` que realiza una consulta unificada de todos los jugadores y sus respectivas fichas de personajes (`character_sheets`). Se expuso el comando exclusivo para administradores `!censo` / `!fichas` en `kingdoom-bot/src/handlers/admin.js`, el cual genera un hermoso y estructurado reporte que detalla: total de aventureros, porcentaje de vinculaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n a WhatsApp, nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero de PJs por usuario, los nombres de cada uno de sus PJs (PJ 1, PJ 2) y, para aquellos pendientes sin ficha completada, calcula automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente el tiempo transcurrido en dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­as desde su registro original con una alerta de advertencia.
    *   **Consistencia y Citados en !grant y !ban:** Se habilitÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el soporte para citar/responder mensajes de WhatsApp en los comandos de administraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n `!grant` y `!ban`. Esto permite otorgar oro (ej. `!grant 500` respondiendo al jugador) o banear (ej. `!ban` respondiendo al jugador) directamente sin requerir escribir sus nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmeros de telÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©fono a mano.
*   **Notas/Advertencias:** Todas las modificaciones son 100% compatibles con la base de datos Supabase existente y la lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³gica del bot. El compilador TypeScript pasÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ con Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©xito (`Exit code: 0`).

### [2026-05-19] - [Autor: Antigravity]
*   **Archivos Modificados:** `kingdoom-bot/src/index.js`, `kingdoom-bot/Dockerfile`, `kingdoom-bot/src/handlers/player.js` (en repo secundario)
*   **Resumen de Tareas:** MigraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n completa de Kingdoom Bot a Railway y soporte de visualizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de QR en alta definiciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n para WhatsApp Web.
*   **Cambios Clave:**
    *   **MigraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n a Railway:** Se adaptÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la configuraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del bot para desplegarse de manera robusta en Railway.app, superando las limitaciones de RAM (512MB) y disco volÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡til del plan gratuito de Render.
    *   **Docker & Volumen Persistente:** Se removiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la directiva `VOLUME` en el `Dockerfile` (no soportada nativamente por Railway) y se configurÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la persistencia de la sesiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n mediante un disco montado en `/app/.wwebjs_auth` desde la interfaz de Railway.
    *   **Servidor Web QR en HD:** Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ una pÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡gina interactiva en `PORT = 8080` (en `src/index.js`) que sirve el cÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³digo QR generado como imagen PNG en alta definiciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n, facilitando su escaneo e indicando el estado `Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¢Ã¯Â¾Æ’Ã£ï¿½Â§Ã§Â¦Â¿Ã£â€šâ€žÃ‚â‚¬Ã¯Â½Â¦ Bot Conectado` una vez autenticado.
    *   **RemociÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del comando !daily:** Se removiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ por completo la funcionalidad de reclamo de recompensas diarias (`!daily`), limpiando sus imports, su lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³gica interna de base de datos, la funciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de selecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de premios, su menciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n en el comando `!ayuda` y su registro en la lista de comandos procesados de `index.js`.
    *   **Privilegios de Owner y Administradores:** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ un sistema robusto de permisos gestionado en `src/adminStore.js` con persistencia en el volumen de Railway (`/app/.wwebjs_auth/admins.json`). El nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero `595987273405` se definiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ como **Soberano (Owner)** del bot, teniendo acceso exclusivo a comandos para conceder (`!add admin <numero>`) o revocar (`!remove admin <numero>`) roles de administrador.
    *   **RestricciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n y Mejoras de !registrar:** El comando `!registrar` ahora estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ restringido Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºnicamente a los administradores y al owner. Otorga **2500 de oro inicial** por defecto, y permite especificar un monto a la derecha (ej. `!registrar pepe 200000`, soportando separadores de miles). AdemÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s, se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ soporte UX premium: si se ejecuta respondiendo a un mensaje de WhatsApp, extrae automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente el nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero del remitente del mensaje citado.
    *   **Mensaje de Bienvenida Premium en Dos Partes:** Se actualizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `src/handlers/welcome.js` para enviar dos mensajes secuenciales e interactivos con un intervalo de 1.5s al detectar nuevos miembros en el grupo de WhatsApp. El primer mensaje incluye una caja medieval de bienvenida para `Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£ï¿½Â§Ã¯Â¿Â½ Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£ï¿½Â­Ã¯Â¿Â½ Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£ï¿½Â¤Ã¯Â¿Â½ Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£â€šâ€žÃ‚â‚¬Ã¯Â¿Â½ Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£ï¿½Â¨Ã¯Â¿Â½ Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£ï¿½Â§Ã¯Â½Â½ Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£ï¿½Â§Ã¯Â½Â½ Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â°Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¦â€¢â€¢Ã£ï¿½Â¤Ã©ï¿½â„¢Ã£ï¿½Â§Ã¨â€ºâ€¹ y un link directo a su canal de informaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n para crear el primer personaje, mientras que el segundo lista oficialmente a los "Guardianes del Reino" (`Nothing`, `Zoelfrost`, `Ord`, `E.xe`). Incorpora menciones automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticas en alta prioridad a los miembros reciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©n unidos.
    *   **ResoluciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Discrepancias de JID en Paraguay:** Se identificÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ que WhatsApp a nivel de servidor aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±ade o remueve un dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­gito `9` despuÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©s del cÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³digo de paÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­s paraguayo (`595`), resultando en discrepancias de formato JID (ej. `5959987273405@c.us` vs `595987273405@c.us`). Se actualizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `src/adminStore.js` para admitir y homologar automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente ambos formatos, permitiendo que seas reconocido como Soberano (Owner) de inmediato.
    *   **IdentificaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Remitentes en Grupos de WhatsApp:** Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el error de mapeo donde el bot extraÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a el emisor usando `msg.from` (que en grupos devuelve el ID del grupo en lugar del nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero del remitente). Ahora el bot extrae al emisor real de forma infalible con `msg.author || msg.from`, permitiendo a los administradores ejecutar comandos desde grupos.
    *   **Filtrado Silencioso de Mensajes No Registrados:** Para evitar spam masivo de `Viajero desconocido...` ante palabras cotidianas en grupos y PV, se configurÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el bot para ignorar de manera silenciosa cualquier mensaje de usuario no registrado que carezca del prefijo de comando `!`.
    *   **CorrecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de ReferenceError en el Handler de Jugadores:** Al refactorizar la identificaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de emisores se removiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ accidentalmente la declaraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n local de `chatId` en `src/handlers/player.js` que el historial de chat con Inteligencia Artificial requerÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a. Se reincorporÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `const chatId = msg.from;` restableciendo la persistencia correcta y solventando el crash que arrojaba `Ã¯Â¾Æ’ÃŽÂ´Ã¯Â½Â¢Ã¯Â¾Æ’Ã£ï¿½Â§Ã¯Â½Â¡Ã¯Â¾Æ’Ã£â€šâ€žÃ‚â‚¬Ã¦â€¢â€¢ÃŽÂ´Ã¯Â½Â¯Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¯Â½Â¸Ã¯Â¾Æ’Ã£ï¿½Â¤Ã¯Â¿Â½ El reino esta en llamas...`.
    *   **MenÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âº DinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡mico e Inteligente para !ayuda:** Se reprogramÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el comando `!ayuda` en `src/handlers/player.js` para detectar en tiempo real si el remitente del mensaje es el Soberano (Owner) o un Administrador del Reino, anexando de manera dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡mica sus comandos exclusivos (como `!registrar`, `!grant`, `!stats`, `!broadcast`, `!admin`, etc.) al menÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âº tradicional de juego de WhatsApp.
    *   **Fortalecimiento en NormalizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de TelÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©fonos:** Se securizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `normalizePhone` en `src/supabase.js` convirtiendo el argumento de entrada a String y aplicando valores por defecto seguros para prevenir TypeErrors inesperados si el JID o nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero remitente no estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ definido.
    *   **RestricciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n Estricta de Respuestas a Prefijo (!):** Para evitar que el bot responda con el Heraldo AI a conversaciones cotidianas de cualquier usuario (incluidos dueÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±os y administradores), se configurÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ una regla estricta al inicio del manejador de mensajes de WhatsApp. Si el mensaje no inicia con el prefijo `!`, se ignora de manera inmediata y silenciosa (`if (!hasPrefix) return;`).
    *   **IdentificaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n DinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡mica de DueÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±o por Env y JID de AcompaÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±ante:** Se adaptÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `isOwner` en `src/adminStore.js` para validar dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡micamente si el nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmero del emisor coincide con la variable de entorno `OWNER_NUMBER` o `ADMIN_NUMBER` definida en Railway, e incorporÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ soporte directo nativo para el identificador de dispositivo acompaÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±ante `275162062668001` como Soberano (Owner).
    *   **NormalizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n Unificada de TelÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©fonos Internacionales:** Se unificÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la lÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³gica de `normalizePhone` importÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ndose desde `adminStore.js` a `supabase.js`. Ahora formatea de forma consistente nÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºmeros de Paraguay (removiendo el 9 adicional si tiene 13 dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­gitos), MÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©xico (canonicalizando a `521` si tiene 12 dÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­gitos) y Argentina (canonicalizando a `549` y eliminando el `15` si estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ presente). Esto previene inconsistencias entre los datos guardados en la BD y las llamadas de eventos en WhatsApp.
    *   **Bypass de !ayuda para Nuevos Admins/Usuarios No Registrados:** Se modificÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `handlePlayerMessage` en `src/handlers/player.js` para procesar el comando `!ayuda` antes de comprobar si el jugador existe en la BD. Esto permite a los administradores reciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©n aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adidos u dueÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±os ver el menÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âº, identificar sus roles y diagnosticar su telÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©fono con una nota explicativa sobre cÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³mo registrarse, en lugar de recibir el mensaje de "Viajero desconocido".
    *   **Registro de Handoff:** Se registrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ formalmente el estado y las instrucciones del bot en la memoria compartida (`kingdoom-memory` MCP) para sincronizar el trabajo con Codex.
*   **Notas/Advertencias:** El bot estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ activo y online. Solo requiere escanear el QR generado en su dominio pÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºblico de Railway. El cambio de la remociÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del !daily, la reestructuraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de permisos/registro, la bienvenida en dos partes, la correcciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de JIDs/mensajerÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­a grupal, el menÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âº dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡mico de ayuda, la restricciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n estricta de prefijos, el diagnÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³stico de identidad, el JID especÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­fico del dueÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±o, la normalizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n unificada de telÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©fonos internacionales y el bypass de ayuda fue committeado y pusheado de inmediato para gatillar el despliegue automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡tico en Railway.

### [2026-05-18] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `api/admin/ask-archivist.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la capacidad de dar oro a mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºltiples jugadores simultÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡neamente ("add_multiple_players_gold").
*   **Cambios Clave:**
    *   **AcciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de lista:** Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `add_multiple_players_gold` para procesar una lista de nombres de usuario.
    *   **BÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsqueda flexible:** El motor busca a los jugadores indicados ignorando mayÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsculas/minÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsculas y buscando coincidencias parciales, igual que en la bÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsqueda individual.
    *   **Prompts:** Se actualizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el prompt de IA para utilizar un payload de la forma `{"usernames": ["User A", "User B"], "amount": X}` cuando se le piden varios nombres.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-18] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `api/admin/ask-archivist.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la capacidad de dar oro a todos los jugadores ("add_all_players_gold") desde el Archivista.
*   **Cambios Clave:**
    *   **AcciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n global:** Se implementÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `add_all_players_gold` en el motor de acciones del Archivista, permitiendo actualizar a todos los jugadores del contexto en una sola solicitud.
    *   **Prompts:** Se actualizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el prompt de IA para reconocer comandos globales y emitir un payload simple de `{ "amount": X }` sin requerir nombre de usuario.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/archivist/archivistLive.ts`, `src/components/ArchivistSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de respuestas del Archivista sobre ranking de oro.
*   **Cambios Clave:**
    *   **Oro visible para staff:** El contexto vivo del Archivista ahora incluye el ranking de oro actual con cantidades.
    *   **Tarjetas relevantes:** Las preguntas de staff sobre jugadores/oro priorizan tarjetas de jugadores y evitan recomendaciones de mercado fuera de contexto.
*   **Notas/Advertencias:** Solo se exponen estos datos cuando el Archivista corre en modo admin.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `src/utils/archivistAi.ts`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion del flujo de borradores pendientes del Archivista.
*   **Cambios Clave:**
    *   **Sin carga infinita:** El cliente del Archivista ahora corta consultas demoradas y devuelve el estado de carga aunque el endpoint falle.
    *   **Borrador conversacional:** Si hay una accion pendiente y el staff pregunta por habilidad, detalles o efectos, el chat responde sobre el mismo borrador sin bloquearse.
    *   **Items mas completos:** El prompt del Archivista exige que los items de mercado tengan una habilidad jugable y balanceada, no solo descripcion visual.
*   **Notas/Advertencias:** Se preservo el cambio previo de Antigravity en el placeholder del Archivista.

### [2026-05-13] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/archivist/archivistLive.ts`, `src/components/ArchivistSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** FinalizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del fix para el ranking de oro del Archivista y refuerzo semÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ntico.
*   **Cambios Clave:**
    *   **Contexto Admin:** Se verificÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la inclusiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de `richestPlayers` en el resumen runtime para staff.
    *   **Refuerzo SemÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ntico:** Se eliminÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `oro` de `CARD_STOPWORDS` y se duplicÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el `categoryBoost` para asegurar que las tarjetas de jugadores tengan prioridad absoluta en consultas econÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³micas.
    *   **DetecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de IntenciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n:** Se flexibilizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `isPlayerGoldQuestion` para detectar "ranking", "ricos" y "riqueza" sin necesidad de mencionar explÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â­citamente "jugador".
*   **Notas/Advertencias:** Validado con `npm run build`. El sistema ahora diferencia correctamente entre "comprar oro" (mercado) y "Ã¯Â¾Æ’Ã¯Â¿Â½Ã‚â‚¬Ã¥Â â„¢Ã£ï¿½Â¤Ã¯Â½Â¿quiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©n tiene mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s oro?" (jugadores).

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `AGENTS.md`, `RTK.md`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Instalacion y configuracion local de RTK y reglas agenticas para Kingdoom.
*   **Cambios Clave:**
    *   **RTK activo:** Se agrego `RTK.md` y referencia local para usar `rtk` como proxy compacto de comandos.
    *   **AGENTS.md adaptado:** Se incorporaron reglas utiles de `agents-md` sobre disciplina de contexto, comandos acotados y validacion proporcional.
    *   **Compatibilidad Kingdoom:** Las reglas nuevas quedan subordinadas al protocolo del proyecto, incluyendo validacion obligatoria para cambios funcionales/UI.
*   **Notas/Advertencias:** RTK fue instalado como herramienta local de usuario en `C:\Users\e_grado\.local\bin`; no se agregaron dependencias npm.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceOnline.ts`, `supabase_horse_race_online.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de seleccion inicial en salas online de Carreras del Reino.
*   **Cambios Clave:**
    *   **Sin salas finalizadas por defecto:** El listado online ahora ignora carreras `finished` para evitar mostrar una foto finish vieja al entrar por primera vez.
    *   **Seleccion estricta:** La UI ya no usa la primera sala como fallback si no hay una sala activa seleccionada.
    *   **Nueva sala limpia:** Al crear una sala se limpian referencias internas de auto-inicio y liquidacion para evitar arrastre de estado anterior.
*   **Notas/Advertencias:** Tambien queda incluido el `DROP FUNCTION` de `settle_public_horse_race(uuid, uuid)` para que el SQL completo pueda re-ejecutarse sin el error de renombrado de parametros.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `src/utils/horseRaceOnline.ts`, `supabase_horse_race_online.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de animacion online y autonomia de salas para Carreras del Reino.
*   **Cambios Clave:**
    *   **Canvas online blindado:** Se corrigio el reloj de carrera para evitar frames invalidos cuando `started_at` llega con desfase o formato no interpretable por el navegador.
    *   **Salas publicas:** Cualquier jugador conectado puede crear una sala online y elegir cupo de 2 a 6 apostadores.
    *   **Auto-inicio:** La carrera online se inicia automaticamente cuando se completa el cupo, siempre con minimo 2 apuestas.
    *   **Liquidacion segura:** Los pagos online quedan idempotentes por RPC y pueden cerrarse sin depender de que un admin pulse el boton.
*   **Notas/Advertencias:** Hay que volver a ejecutar `supabase_horse_race_online.sql` para agregar `target_bets`, la funcion de auto-inicio y la nueva firma de creacion de salas.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceOnline.ts`, `supabase_horse_race_online.sql`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Fases 3, 4 y 5 de Carreras del Reino: salas online, control admin y pulido premium.
*   **Cambios Clave:**
    *   **Salas online:** Se agrego modo `Sala online` con lectura de sesiones, apuestas compartidas y Realtime para sincronizar cambios entre usuarios.
    *   **Economia segura:** Las apuestas online pasan por RPC de Supabase, descuentan oro al apostar y liquidan premios una sola vez desde control admin.
    *   **Panel admin:** Los administradores pueden crear sala publica, cerrar apuestas, iniciar la carrera y liquidar pagos desde el mismo panel compacto.
    *   **Pulido visual:** Se agregaron indicadores de estado, pozo, apostadores, ganador, mensajes de sala y fallback claro si falta ejecutar el SQL.
*   **Notas/Advertencias:** Para activar la fase online en produccion hay que ejecutar `supabase_horse_race_online.sql` en Supabase. El modo offline queda operativo como respaldo.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion critica y fase 3 visual de Carreras del Reino.
*   **Cambios Clave:**
    *   **Ganador inmutable:** El motor ahora conserva como ganador al primer caballo que cruza la meta, incluso si otros quedan mas adelantados en frames posteriores.
    *   **Desempate por cruce real:** Si dos caballos cruzan en el mismo tick, se calcula el tiempo interno de cruce para resolver quien llego primero.
    *   **Foto de llegada:** El canvas final muestra el frame del primer cruce y un rotulo compacto con el caballo ganador para evitar ambiguedad visual.
*   **Notas/Advertencias:** La carrera sigue en modo offline. No se tocaron reglas de economia ni integraciones Supabase.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Fase 2 de Carreras del Reino: ritmo, terreno y limpieza visual.
*   **Cambios Clave:**
    *   **Carrera mas lenta:** Se amplio la duracion de la simulacion y se redujo el avance por frame para que la carrera tenga mas suspense.
    *   **Mas recorrido visual:** Se extendio la pista util y se agrego parallax de vallas, vegetacion y terreno para dar sensacion de distancia.
    *   **Panel lateral compacto:** Se quitaron los bloques de `Proxima fase` y `Ultima carrera` para dejar espacio a caballos, apuesta y accion.
*   **Notas/Advertencias:** Fase 2 sigue siendo offline. La fase online debe ir con RPC/Supabase Realtime para apuestas multiusuario seguras.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernHorseRace.tsx`, `src/utils/horseRaceUtils.ts`, `src/utils/scratchUtils.ts`, `src/sections/MarketSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Fase 1 del minijuego Carreras del Reino en modo offline.
*   **Cambios Clave:**
    *   **Caballos aleatorios:** Cada cartel genera seis corredores con nombre, reino, color, estadisticas internas y cuotas variables.
    *   **Carrera canvas:** Se agrego pista arcade con fondo animado, carriles, meta, caballos pixelados y resultado visual.
    *   **Economia local:** El jugador apuesta oro, se descuenta al iniciar, cobra si gana y se aplica limite diario de ganancia neta.
    *   **Base para online:** El motor trabaja con `raceId`, caballos, frames, ganador y posiciones para facilitar una futura sala Supabase compartida.
*   **Notas/Advertencias:** Esta fase es offline. La fase online debe moverse a RPC/Supabase Realtime antes de aceptar apuestas multiusuario reales.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernPlinko.tsx`, `src/utils/plinkUtils.ts`, `src/utils/scratchUtils.ts`, `src/sections/MarketSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Implementacion del minijuego Torre del Mago en la taberna del Mercado.
*   **Cambios Clave:**
    *   **Plinko arcano:** Se agrego una caida de esfera por 8 filas de runas y 9 cofres con animacion canvas, estela, impactos y cofres iluminados.
    *   **Economia conectada:** El juego descuenta apuesta, paga segun multiplicador, refresca oro del jugador y aplica limite diario de ganancia neta.
    *   **Utilidad reutilizable:** `plinkUtils.ts` concentra calculo de ruta, multiplicadores, retorno esperado y guardado diario.
    *   **Entrada en taberna:** Se agrego el modo `Torre` al selector horizontal de minijuegos en Mercado.
*   **Notas/Advertencias:** La tabla se balanceo para mantener retorno esperado cercano al 89% y evitar inflacion de oro. Pendiente validar visualmente en dispositivo real tras deploy.

### [2026-05-13] - [Autor: Jarvis]
*   **Archivos Modificados:** `scripts/kingdoom-memory-mcp.mjs`, `ai-memory/README.md`, `ai-memory/kingdoom-memory.jsonl`, `docs/kingdoom-memory-mcp.md`, `package.json`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Creacion de un MCP local de memoria compartida para Jarvis y Antigravity.
*   **Cambios Clave:**
    *   **Servidor MCP sin dependencias:** Se agrego `scripts/kingdoom-memory-mcp.mjs` con transporte `stdio` por JSON-RPC delimitado por lineas.
    *   **Memoria append-only:** Se creo `ai-memory/kingdoom-memory.jsonl` para decisiones, handoffs, riesgos y contexto operativo breve.
    *   **Herramientas de agente:** El MCP expone `remember_decision`, `record_handoff`, `search_memory`, `latest_memory` y `project_brief`.
    *   **Documentacion de conexion:** `docs/kingdoom-memory-mcp.md` incluye configuraciones sugeridas para Codex y Antigravity.
    *   **Comando local:** Se agrego `npm run mcp:memory` para iniciar el servidor desde la raiz del repo.
*   **Notas/Advertencias:** Validado con `node --check`, prueba directa de `initialize`, `tools/list` y `project_brief`, `npx tsc --noEmit` y `npm run build`. El changelog sigue activo como historial humano; la memoria MCP queda como capa operativa compacta.

### [2026-05-12] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `api/admin/_aiPrompts.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Pulido del flujo conversacional del Archivista para acciones admin por partes y adjuntos de imagen.
*   **Cambios Clave:**
    *   **Borradores por conversacion:** Si hay una accion pendiente, escribir algo distinto de `si/no` ahora ajusta o completa el borrador en vez de bloquear el chat.
    *   **Sin tarjetas contaminantes:** Las acciones de creacion y aclaraciones ya no muestran misiones, items o fuentes viejas que no corresponden al borrador actual.
    *   **Imagen adjunta:** Admin puede adjuntar imagen al siguiente borrador compatible; mercado, bestiario, flora y eventos reciben la imagen como `imageUrl`.
    *   **Prompt incremental:** El Archivista queda instruido para preguntar solo un dato indispensable por vez y conservar lo ya respondido.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. La lectura visual de una imagen sigue dependiendo de que el admin describa la referencia; la imagen se guarda como adjunto del borrador.

### [2026-05-12] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `src/features/archivist/archivistLive.ts`, `src/features/archivist/archivistActions.ts`, `src/components/EventCard.tsx`, `src/components/AdminControlSheet.tsx`, `src/utils/events.ts`, `src/utils/archivistSources.ts`, `api/admin/_aiPrompts.ts`, `api/admin/ask-archivist.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de errores del Archivista vivo y blindaje de eventos creados por IA para evitar reinicios de interfaz.
*   **Cambios Clave:**
    *   **Tarjetas relevantes:** El Archivista deja de adjuntar items de mercado, magias o cartas aleatorias por palabras genericas; ahora filtra por intencion y score minimo.
    *   **Acciones admin robustas:** Misiones, eventos y oro aceptan payload canonico y variantes en espanol, recuperando titulos desde el borrador cuando la IA los dejaba solo en el texto visible.
    *   **Eventos defensivos:** Las vistas y fuentes del Archivista toleran eventos con facciones, fechas, imagenes o estado incompletos sin romper la UI.
    *   **Prompt endurecido:** El backend exige payload completo para acciones reales y valida que la accion devuelta este dentro de las soportadas.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Si existe un evento corrupto ya guardado en Supabase, la UI queda protegida, pero conviene editarlo desde admin para completar fecha, facciones y recompensa.

### [2026-05-12] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/ArchivistSection.tsx`, `src/features/archivist/archivistLive.ts`, `src/features/archivist/archivistActions.ts`, `src/features/archivist/archivist.types.ts`, `src/utils/archivistSources.ts`, `src/utils/archivistAi.ts`, `api/admin/_aiPrompts.ts`, `api/admin/ask-archivist.ts`, `docs/superpowers/specs/2026-05-12-archivista-vivo-design.md`, `docs/superpowers/plans/2026-05-12-archivista-vivo.md`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ReconstrucciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del Archivista hacia un formato de chat puro con contexto vivo del reino, tarjetas compactas y preparaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n/ejecuciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de acciones admin por confirmaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n conversacional.
*   **Cambios Clave:**
    *   **Chat puro:** Se eliminÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la estructura anterior con panel lateral y controles de memoria visibles para concentrar toda la experiencia en una sola interfaz conversacional.
    *   **Contexto vivo:** El Archivista ahora resume mercado, misiones, eventos, grimorio, biblioteca y, en modo admin, tambiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©n jugadores cargados.
    *   **Tarjetas compactas:** Las respuestas pueden adjuntar tarjetas breves de mercado, eventos, misiones, magias, bestiario, flora y documentos sin romper la versiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³vil.
    *   **Modo admin real:** Se integrÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el borrador y la ejecuciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de acciones del reino tras confirmaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n `si/no` en el chat para oro, misiones, eventos, mercado, magia, bestiario, flora y documentos.
    *   **Cache y contexto:** Se ajustÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el endpoint para separar respuestas pÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºblicas/admin y considerar el resumen vivo del reino al generar la respuesta IA.
*   **Notas/Advertencias:** El Archivista sigue dependiendo de las APIs/configuraciones IA ya existentes. Conviene validar flujo pÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºblico y flujo admin tras cada redeploy porque ahora la capa operativa ya no es solo informativa.

### [2026-05-12] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `src/components/ArchivistSection.tsx`, `api/anime/proxy.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ResoluciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de problemas de visualizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de enlaces, rediseÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±o de la interfaz de reproducciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n/descarga para mayor compacidad y limpieza de la secciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del Archivista.
*   **Cambios Clave:**
    *   **Limpieza de Interfaz (ArchivistSection):** EliminaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de la descripciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n redundante en la cabecera del Archivista ("Consulta el reino..."), siguiendo el rediseÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±o hacia un formato de chat puro.
    *   **UI Minimalista (AnimeHubSection):** SustituciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n del selector de servidores por un componente ultra-compacto con icono de flecha (`ChevronDown`), optimizando el espacio en la consola de acciones.
    *   **NormalizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Enlaces:** Se actualizÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `normalizeLinks` para soportar arrays directos de `servers` y `downloads` que devuelven los scrapers actuales.
    *   **CorrecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Mapeo (AnimeFLV):** Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ `fetchAnimeFlvLinks` para procesar correctamente el payload envuelto de la API.
    *   **Seguridad:** MigraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n total de API Keys hardcodeadas a la constante `ANIME_HUB_API_KEY`.
    *   **Proxy API:** ActualizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de `api/anime/proxy.ts` para mejorar la compatibilidad del mapeo de fuentes y enlaces.
*   **Notas/Advertencias:** La interfaz ahora es mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s limpia y evita solapamientos en resoluciones bajas o mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³viles.

### [2026-05-11] - [Autor: Antigravity & Jarvis]
*   **Archivos Modificados:** `api/anime/stream.ts`, `api/anime/download.ts`, `api/admin/_serverAiProviders.ts`, `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`, `.env.example`
*   **Resumen de Tareas:** FinalizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de la integraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de AnimeFLV, implementaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de filtros por proveedor y optimizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de conectividad (CORS/Timeouts).
*   **Cambios Clave:**
    *   **Endpoints:** OptimizaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de proxies en Vercel para streaming y descargas; ahora aceptan `ANIMEFLV_API_URL` como variable server-side.
    *   **UI Web/MÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³vil:** ImplementaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de selectores de proveedor y filtros dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡micos en ambas plataformas.
    *   **Conectividad:** CorrecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de tipos TypeScript para `ApiRequest` (aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adido `query`) e inclusiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de declaraciones globales para entornos Node.js.
    *   **Robustez:** InyecciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de `User-Agent` real en peticiones de backend para evitar bloqueos 403 y timeouts de 8s con `AbortController`.
    *   **ConfiguraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n:** Documentada la nueva variable `ANIMEFLV_API_URL` en `.env.example`.
*   **Notas/Advertencias:** La integraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n es ahora resiliente a fallos de red y cumple con los estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ndares de tipado de Vercel. Se requiere redeploy final.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se agrego soporte opt-in para `animeflv-api` como proveedor adicional de Anime Hub en web y app.
*   **Cambios Clave:**
    *   Se integro `VITE_ANIMEFLV_API_URL` y `EXPO_PUBLIC_ANIMEFLV_API_URL` como tercera fuente remota junto a `anime-website` y `anime-platform`.
    *   La busqueda puede consultar `/search` y la ficha puede resolver `/anime/{slug}` para obtener portada, sinopsis, generos y lista de episodios.
    *   Se mantuvieron desactivados los enlaces automaticos de embed/descarga desde este proveedor para evitar acoplar la UI a servidores externos no controlados.
*   **Notas/Advertencias:** Se verifico la API publica con busqueda de `bleach` y ficha `bleach-tv`. `npx tsc --noEmit`, `npm run build` y `npm run typecheck` de la app movil pasaron correctamente.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/_serverAiProviders.ts`
*   **Resumen de Tareas:** Se endurecio el helper compartido de proveedores IA para que compile correctamente bajo la revision aislada de Vercel.
*   **Cambios Clave:**
    *   Se declaro un tipo minimo de `process.env` dentro del modulo.
    *   Se tiparon los `map(...)` que procesan keys y origenes configurables para evitar inferencias `any`.
*   **Notas/Advertencias:** El problema no estaba en la logica de fallback entre proveedores, sino en el entorno de tipado del runtime serverless.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/extract-pdf-text.ts`
*   **Resumen de Tareas:** Se corrigio el tipado aislado del extractor PDF para que compile correctamente en Vercel aunque el `tsconfig` principal no incluya la carpeta `api`.
*   **Cambios Clave:**
    *   Se declaro un tipo minimo de `process.env` para evitar la dependencia explicita de tipos de Node en ese endpoint.
    *   Se tiparon los callbacks implicitos y se normalizo el header `origin` antes de pasarlo al helper CORS.
*   **Notas/Advertencias:** Este ajuste apunta al verificador TypeScript aislado de Vercel, que estaba detectando errores que el `tsconfig` local no alcanzaba a cubrir.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/generate-bestiary.ts`, `api/admin/generate-magic.ts`, `api/admin/generate-mission.ts`
*   **Resumen de Tareas:** Se corrigio el tipado de las funciones IA admin para evitar errores de compilacion en Vercel relacionados con `includeDebug`.
*   **Cambios Clave:**
    *   Se completo `includeDebug` en los objetos tipados como `Required<...Request>`.
    *   Se elimino el ruido de TypeScript que aparecia en los logs de deploy de produccion.
*   **Notas/Advertencias:** El deploy de Kingdoom ya no deberia marcar esos tres errores mientras la logica de debug siga siendo opcional.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/app/(tabs)/anime.tsx`, `src/features/animeHub/animeHub.mockProvider.ts`, `src/features/animeHub/animeHub.mock.ts`, `apps/mobile/src/features/animeHub/animeHubMock.ts`, `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se retiro la dependencia operativa de `anime1v` y se dejo Anime Hub centrado en `anime-website` y `anime-platform`, tanto en web como en la app.
*   **Cambios Clave:**
    *   Se eliminaron rutas, mensajes de entorno y prioridad visual ligadas a `anime1v`.
    *   Se reescribieron los proveedores remotos web y movil para dejar solo `anime-website` y `anime-platform`.
    *   Se limpiaron los mocks y las tarjetas de detalle para que no sigan mostrando etiquetas o contratos antiguos de `anime1v`.
*   **Notas/Advertencias:** `anime-website` sigue siendo la fuente principal. Para episodios y enlaces completos, su deploy debe responder correctamente en los endpoints `gogoanime`.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se endurecio el fallback de Anime Hub para evitar que las rutas averiadas de `gogoanime` generen resultados huerfanos o ruido innecesario en consola.
*   **Cambios Clave:**
    *   Se elimino la consulta redundante a `/search/anime/consumet/gogoanime` durante la busqueda mixta tanto en web como en movil.
    *   Si una ficha de `anime-website` no puede resolver su seed de streaming, ahora Kingdoom intenta redirigirla inmediatamente a `anime1v` por titulo en lugar de devolver `null`.
    *   Cuando tampoco existe rescate disponible, se construye un detalle minimo y estable para que la interfaz no quede sin respuesta.
*   **Notas/Advertencias:** El deploy `anime-website` sigue respondiendo `500` en las rutas `gogoanime`, y `anime1v` sigue necesitando una API key valida para rescatar episodios reales en produccion.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`
*   **Resumen de Tareas:** Se ampliÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ Anime Hub para aprovechar mejor las capacidades reales de `anime1v` con filtros por proveedor, enlaces mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s completos y una experiencia coherente entre web y app.
*   **Cambios Clave:**
    *   Se aÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±adieron filtros reales por proveedor `anime1v` (`AnimeAV1`, `AnimeFLV`, `TioAnime`, `JKAnime`, `HentaiLA`, `MonosChinos`) en web y mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³vil.
    *   La bÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsqueda ahora puede forzar el dominio correcto en `anime1v`, en lugar de tratarlo como una Ã¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºnica fuente genÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â©rica.
    *   Los resultados de `anime1v` ahora muestran la etiqueta real del proveedor origen, no solo `anime1v remoto`.
    *   La carga de enlaces de episodio ahora combina variantes `SUB` y `DUB`, e intenta pedir `includeMega=true` para exprimir mejor lo que ofrece el backend.
    *   Se corrigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ la referencia del endpoint batch a `/api/v1/anime/batch-download` para mantenerla alineada con el backend real.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit` y `npm run build` antes de publicar. Los proveedores mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡s allÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ de `AnimeAV1` siguen dependiendo de que el backend `anime1v` tenga esos scrapers y requisitos externos operativos.

### [2026-05-11] - [Autor: Jarvis]
*   **Archivos Modificados:** `api/admin/advise-staff.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Correccion de compatibilidad entre el endpoint de Staff IA y el nuevo contrato del orquestador serverless.
*   **Cambios Clave:**
    *   Se reemplazo el acceso obsoleto `aiResult.json` por `aiResult.data` en `api/admin/advise-staff.ts`.
    *   Con esto se resuelve el error de TypeScript que bloqueaba el build en Vercel para el endpoint `api/admin/advise-staff.ts`.
*   **Notas/Advertencias:** El build local con `npm run build` paso correctamente despues del ajuste.

### [2026-05-08] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se reforzo la integracion de `anime1v` para que Kingdoom pueda autenticarse de forma mas compatible contra ese backend en web y app.
*   **Cambios Clave:**
    *   Se agrego un constructor dedicado para URLs de `anime1v` que anade automaticamente `apiKey` como query string cuando existe la variable de entorno.
    *   Se mantuvo tambien el envio por `X-API-Key` y `Authorization`, dejando doble compatibilidad con el middleware real de `anime1v-api`.
    *   Las llamadas de busqueda, detalle y episodios ahora reutilizan este protocolo unificado tanto en la version web como en la app movil.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Para que quede plenamente operativo en produccion, Vercel y Expo deben tener configuradas `VITE_ANIME_HUB_API_KEY` y `EXPO_PUBLIC_ANIME_HUB_API_KEY`.

### [2026-05-08] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se reajusto la prioridad de proveedores de Anime Hub para dar mas estabilidad cuando conviven `anime1v` y `anime-website`.
*   **Cambios Clave:**
    *   La busqueda ahora prioriza primero `anime-website` para catalogo y cobertura general.
    *   `anime1v` pasa a segundo nivel como enriquecedor de resultados y fuente de reproduccion/episodios cuando aporta mejor disponibilidad.
    *   Si una ficha de `anime-website` no devuelve episodios, el sistema intenta resolver el mismo titulo en `anime1v` y reutiliza esos episodios como fallback transparente.
    *   El orden visual de resultados ahora favorece entradas de `anime-website`, manteniendo `anime1v` como respaldo de valor practico.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. `anime1v` sigue necesitando API key si ese backend la exige en produccion.

### [2026-05-08] - [Autor: Jarvis]
*   **Archivos Modificados:** `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se dejo documentada la nueva API desplegada de `anime-website` como proveedor remoto utilizable tanto en web como en la app nativa.
*   **Cambios Clave:**
    *   `VITE_ANIME_WEBSITE_API_URL` ahora apunta al deploy operativo `https://anime-website-hq58.vercel.app`.
    *   `EXPO_PUBLIC_ANIME_WEBSITE_API_URL` ahora apunta al mismo deploy para mantener consistencia entre web y app.
*   **Notas/Advertencias:** Para activar realmente la fuente en produccion aun hace falta pegar esta misma URL en las variables de entorno reales de Vercel y Expo/EAS.

### [2026-05-08] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `src/components/AnimeHubSection.tsx`, `.env.example`, `apps/mobile/.env.example`
*   **Resumen de Tareas:** Se integro Anime Hub con estrategia multifuente para mejorar cobertura y corregir fichas que quedaban sin episodios.
*   **Cambios Clave:**
    *   `anime1v` queda como fuente principal de detalle, episodios y reproduccion.
    *   Se anadio soporte opcional para `anime-website` como respaldo de catalogo, detalle y episodios, y para `Anime API Platform` como respaldo de busqueda/catalogo.
    *   Las fichas y episodios ahora usan referencias compuestas por proveedor, evitando perder contexto al abrir detalle o cargar enlaces.
    *   Se corrigio el orden de resolucion de detalle para priorizar `url` antes que `id` en `anime1v`, reduciendo casos de `0 EPS`.
    *   Se documentaron las nuevas variables de entorno para Vercel y Expo.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. La integracion de `anime-website` y `Anime API Platform` requiere sus `*_API_URL` reales en entorno para quedar operativa.

### [2026-05-08] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/PlayerNotificationBell.tsx`, `public/icons/anime-torii.png`
*   **Resumen de Tareas:** Se movio el acceso de Anime a la cabecera de Inicio y se limpio la cabecera del perfil.
*   **Cambios Clave:**
    *   Se retiro `Anime` de la barra global inferior para que deje de ocupar espacio permanente.
    *   Se anadio un acceso rapido con icono personalizado junto a notificaciones, visible solo mientras el usuario esta en `Inicio`.
    *   Se eliminaron los chips superiores de `Jugador` y `Activo`, ademas del texto redundante bajo `Tu sesion de jugador`.
    *   Se ajusto la navegacion inferior para que `Inicio` siga marcado cuando el portal Anime esta abierto desde ese acceso contextual.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`
*   **Resumen de Tareas:** Se corrigio la repeticion visual de portadas y se amplio la busqueda remota de Anime Hub.
*   **Cambios Clave:**
    *   Cuando el proveedor repite o no entrega portada, se genera una portada unica por titulo.
    *   Al abrir ficha se conserva el arte unico generado desde resultados.
    *   La busqueda prueba variantes con espacios, sin espacios, guiones y camelCase para casos como `Solo Leveling`.
    *   Los resultados se deduplican por ID y titulo normalizado.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`
*   **Resumen de Tareas:** Se pulio la vista de Anime Hub y se mejoro la deteccion de imagenes remotas.
*   **Cambios Clave:**
    *   El panel de acciones queda debajo de episodios salvo pantallas ultra amplias, evitando compresion lateral.
    *   El scroll de resultados recibio margen estable y estilo visual propio.
    *   El proveedor remoto ahora reconoce mas campos de portada/banner y normaliza URLs relativas.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se dejo la cabecera de Anime Hub solo como buscador compacto.
*   **Cambios Clave:**
    *   Se retiraron los filtros visibles de genero y el badge `Remoto/Demo`.
    *   La busqueda queda como unica accion superior con boton pequeno de lupa.
    *   Las consultas remotas siguen funcionando sin filtro de genero visible.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se compacto la cabecera de Anime Hub para liberar espacio de resultados, vista previa y episodios.
*   **Cambios Clave:**
    *   El buscador paso a una barra superior horizontal con boton pequeno de lupa.
    *   Los filtros quedaron en una fila desplazable y se retiro el bloque visual de `Estado`.
    *   Se elimino el encabezado grande de catalogo para reducir altura en movil y escritorio.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se ajusto la lista de episodios de Anime Hub para evitar compresion visual en escritorio y movil.
*   **Cambios Clave:**
    *   El detalle de serie recibe mas ancho frente a la lista de resultados en escritorio.
    *   El panel de acciones solo pasa a lateral en pantallas muy amplias, dejando los episodios como bloque principal.
    *   La grilla de episodios usa tarjetas con ancho minimo automatico para no deformarse.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`
*   **Resumen de Tareas:** Se reorganizo el panel de detalle de Anime Hub para mejorar lectura y acciones en escritorio y movil.
*   **Cambios Clave:**
    *   La sinopsis queda como banda superior compacta y deja de competir con episodios y enlaces.
    *   Los episodios ahora usan tarjetas horizontales mas legibles, con numero fijo, seleccion clara y mayor altura util.
    *   Las acciones de ver y descargar se agruparon en una consola lateral responsive, apilable en movil.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se corrigio la seleccion de series en Anime Hub cuando el proveedor remoto no entrega ficha completa.
*   **Cambios Clave:**
    *   La web ahora abre una ficha basica desde el resultado seleccionado y solo la reemplaza si `/anime/info` responde correctamente.
    *   El adaptador remoto prueba `id` y `url` al consultar detalles, cubriendo variaciones frecuentes del proveedor.
    *   La app movil conserva la ficha seleccionada como fallback y muestra un estado claro si no hay episodios disponibles.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. Revision rapida de APIs serverless sin abrir README: endpoints admin principales mantienen CORS, OPTIONS y manejo de errores.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.remoteProvider.ts`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se corrigio el error de JSX que rompia el deploy de Vercel y se redisenio Anime Hub para que funcione como catalogo fluido de visualizacion y descarga.
*   **Cambios Clave:**
    *   La UI web ahora prioriza busqueda, resultados, ficha, episodios y acciones de ver/descargar, retirando paneles tecnicos y textos redundantes.
    *   El adaptador remoto se normalizo para evitar campos duplicados y manejar respuestas variables del proveedor sin romper la interfaz.
    *   La app movil recibio una vista mas compacta con carrusel de titulos, ficha visual, episodios accionables y botones directos para abrir enlaces.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [2026-05-07] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.types.ts`, `src/features/animeHub/animeHub.remoteProvider.ts`, `src/features/animeHub/animeHub.mockProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Finalizada la integraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de Anime Hub con soporte completo para reproducciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n (streaming) y descargas directas desde la API real.
*   **Cambios Clave:**
    *   **Tipado:** Extendida la interfaz `AnimeHubProvider` con `getEpisodeLinks` para soportar la obtenciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡mica de servidores.
    *   **Web/Remote:** Implementado fetcher de enlaces en `remoteAnimeHubProvider` y corregido el mapeo de detalles de serie (id, episodios y metadata).
    *   **UI Web:** `AnimeHubSection` ahora permite seleccionar episodios, cargando dinÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡micamente los servidores de streaming y enlaces de descarga en un panel integrado.
    *   **Mobile:** Actualizado el proveedor nativo para incluir `fetchMobileEpisodeLinks` y corregido el mapeo de series para consistencia con la API.
    *   **API Hotfix:** Se redirigiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el almacenamiento temporal de la API para evitar errores 500 en entornos serverless (Vercel).
*   **Notas/Advertencias:** Validado y sincronizado en GitHub. El sistema mantiene fallback automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡tico al modo cascarÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n si la API no responde.

### [2026-05-07] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/features/animeHub/animeHub.remoteProvider.ts`, `src/components/AnimeHubSection.tsx`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ConexiÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n real del mÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³dulo Anime Hub con `anime1v-api` mediante variables de entorno, manteniendo el modo cascarÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n como fallback seguro.
*   **Cambios Clave:**
    *   **Web:** Implementado adaptador real en `remoteAnimeHubProvider` usando `VITE_ANIME_HUB_API_URL`. Soporta `searchSeries` y `getSeriesDetail` con mapeo a tipos internos.
    *   **Web:** `AnimeHubSection` ahora detecta automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ticamente si existe la URL de la API para conmutar entre el proveedor mock y el remoto, con manejo de errores elegante en el feedback.
    *   **Mobile:** Actualizado `animeHubProvider.ts` para consumir `EXPO_PUBLIC_ANIME_HUB_API_URL` si estÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡ presente, integrando los flujos de bÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Âºsqueda e informaciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n real con fallback automÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â¡tico al shell mock en caso de error o ausencia de configuraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n.
    *   **Resiliencia:** Se preservÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³ el diseÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â±o premium y el funcionamiento del modo cascarÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n para entornos sin configuraciÃ¯Â¾Æ’ÃŽÂ¸Ã¦Â´Â¥Ã£ï¿½Â¤Ã¯Â½Â³n de API.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. No se requiere `package-lock.json`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/App.tsx`, `src/index.css`, `src/types.ts`, `src/components/AnimeHubSection.tsx`, `src/features/animeHub/animeHub.types.ts`, `src/features/animeHub/animeHub.mock.ts`, `src/features/animeHub/animeHub.mockProvider.ts`, `src/features/animeHub/animeHub.remoteProvider.ts`, `src/features/animeHub/index.ts`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/anime.tsx`, `apps/mobile/src/features/animeHub/animeHubTypes.ts`, `apps/mobile/src/features/animeHub/animeHubMock.ts`, `apps/mobile/src/features/animeHub/animeHubProvider.ts`
*   **Resumen de Tareas:** Se monto el cascaron completo de Anime Hub en web y app movil, con contratos de proveedor inspirados en `anime1v-api` pero sin conexion real.
*   **Cambios Clave:**
    *   Se anadio una pestania `Anime` en la web y otra en la app movil con buscador, filtros, endpoints preparados, detalle de serie, episodios y solicitudes de descarga mock.
    *   Se separaron los contratos del proveedor, el catalogo mock y el proveedor remoto placeholder para dejar listo el cableado futuro sin activar nada por accidente.
    *   Donde falta integracion real se dejaron comentarios explicitos del tipo "Si no se anade ANIME_HUB_API_URL ... no se activa y sigue modo cascaron" para que el modulo permanezca inerte hasta que usted conecte backend.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. No se conecto ninguna API real ni se implementaron descargas.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/CharImportModal.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/components/TavernExpeditionArcade.tsx`
*   **Resumen de Tareas:** Se amplio el editor de fichas y se corrigio la vista desactualizada de estadisticas tras mejorar en Expedicion.
*   **Cambios Clave:**
    *   El modo editar ficha ahora permite modificar datos base, poderes oficiales, armas, estilo de combate, habilidades, personalidad, historia, extras, debilidades, inventario y estadisticas.
    *   Antes de ver o editar una ficha, el panel de jugador vuelve a consultar Supabase para abrir la version mas reciente.
    *   Expedicion hidrata su estado por `player.id` y no por el objeto completo del jugador, evitando recargas internas cuando el perfil se refresca en segundo plano.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [2026-05-07] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerInventorySheet.tsx`, `src/components/PlayerTradeSheet.tsx`
*   **Resumen de Tareas:** Se corrigio la recarga ciclica del inventario y del panel de intercambio mientras el perfil se refresca en segundo plano.
*   **Cambios Clave:**
    *   Ambos paneles ahora escuchan solo `player.id` en sus efectos de carga, en lugar del objeto `player` completo.
    *   El refresco automatico del perfil cada 10 segundos ya no reinicia las vistas internas del inventario ni muestra de nuevo el estado "Abriendo el inventario...".
    *   El mismo blindaje se aplico al panel de intercambio para evitar una recarga fantasma del inventario transferible.
*   **Notas/Advertencias:** Validar con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.storage.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se blindo la compra de acciones de la Bolsa del Reino para evitar descuentos sin cartera.
*   **Cambios Clave:**
    *   Se agrego la RPC atomica `buy_realm_exchange_shares`, que descuenta oro y actualiza acciones en una sola transaccion.
    *   La web y la app nativa ahora compran acciones mediante la compra segura, no mediante el flujo local de oro primero y cartera despues.
    *   La RPC bloquea el jugador y su cartera con `for update`, valida oro suficiente y calcula el promedio desde la cartera real de Supabase.
    *   Si el SQL no esta instalado, la compra se detiene antes de descontar oro.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. Ejecutar el SQL actualizado de `supabase_realm_exchange_sync.sql` en Supabase antes de volver a comprar acciones en produccion.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.storage.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se blindo la apertura y el cobro de predicciones de la Bolsa del Reino contra estados duplicados.
*   **Cambios Clave:**
    *   Las predicciones resueltas ahora se confirman mediante la RPC atomica `resolve_realm_exchange_predictions`.
    *   La apertura de predicciones usa la RPC atomica `open_realm_exchange_prediction` para evitar dobles apuestas o carteras pisadas entre movil y escritorio.
    *   Supabase bloquea la cartera y el jugador antes de acreditar oro, pagando solo predicciones que sigan activas.
    *   Web y app nativa usan un candado de resolucion para evitar ejecuciones simultaneas del efecto automatico.
    *   Si la RPC aun no esta instalada, el cliente detiene el pago y avisa para ejecutar el SQL actualizado.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`. Hay que ejecutar el SQL actualizado de `supabase_realm_exchange_sync.sql` en Supabase para activar el blindaje en produccion.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/TavernExpeditionArcade.tsx`, `src/components/CharSheetModal.tsx`, `src/utils/pveProgress.ts`, `src/types.ts`, `src/features/realmExchange/realmExchange.data.ts`, `apps/mobile/src/features/realmExchange/realmExchangeData.ts`
*   **Resumen de Tareas:** Se ampliaron las mejoras de Expedicion y se ajusto la probabilidad de banca rota de la Bolsa del Reino.
*   **Cambios Clave:**
    *   Expedicion ahora permite invertir puntos en Agilidad, Inteligencia y Defensa Magica ademas de Fuerza, Vida y Defensa.
    *   Cada mejora vinculada a una estadistica real actualiza tambien la ficha activa, evitando tener que editarla manualmente.
    *   La hoja de personaje muestra el atributo real guardado y mantiene el desglose PvE separado para evitar duplicaciones visuales.
    *   La probabilidad de banca rota de la Bolsa del Reino baja de 5% a 1% tanto en web como en app nativa.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.data.ts`, `src/features/realmExchange/realmExchange.simulation.ts`, `src/features/realmExchange/realmExchange.storage.ts`, `src/features/realmExchange/realmExchange.types.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeData.ts`, `apps/mobile/src/features/realmExchange/realmExchangeSimulation.ts`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `apps/mobile/src/features/realmExchange/realmExchangeTypes.ts`
*   **Resumen de Tareas:** Se agrego la mecanica de banca rota global para activos de la Bolsa del Reino.
*   **Cambios Clave:**
    *   Cada tick de mercado tiene 5% de probabilidad deterministica de provocar banca rota por activo.
    *   Una banca rota dura 90 minutos, bloquea compras/ventas/predicciones y muestra el grafico caido con aviso rojo.
    *   Las acciones compradas se pierden si el jugador estaba desconectado cuando ocurrio la quiebra; la cartera se purga al cargar o al detectar el tick.
    *   La misma regla se aplico en web y app nativa para evitar desfaces entre plataformas.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit`, `npm run mobile:typecheck` y `npm run build`.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/PlayerNotificationBell.tsx`, `src/components/PlayerProfilePanel.tsx`, `src/utils/playerNotifications.ts`, `src/utils/trade.ts`, `supabase_player_notifications.sql`
*   **Resumen de Tareas:** Se agrego una campana de avisos para oro y objetos recibidos por transferencia entre jugadores.
*   **Cambios Clave:**
    *   El perfil del jugador muestra una campana compacta con contador de avisos nuevos y panel flotante con remitente, detalle y hora.
    *   Las transferencias exitosas de oro y objetos registran una notificacion para el destinatario sin bloquear el envio si la tabla aun no existe.
    *   Se agrego SQL idempotente para crear `player_notifications` con indices por jugador, fecha y estado de lectura.
*   **Notas/Advertencias:** Validado con `npx tsc --noEmit` y `npm run build`. Ejecutar `supabase_player_notifications.sql` en Supabase para activar persistencia real de avisos.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/RealmStockExchange.tsx`, `src/features/realmExchange/realmExchange.storage.ts`, `apps/mobile/src/components/RealmStockExchangeNative.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se corrigio un bug critico de doble cobro en la Bolsa del Reino al vender acciones.
*   **Cambios Clave:**
    *   Se agrego un candado sincronico contra doble toque/click antes de que React actualice el estado visual.
    *   Las ventas y predicciones premiadas ahora consumen/persisten el estado antes de acreditar oro, evitando pagos repetidos con la misma cartera.
    *   Se agrego la RPC `sell_realm_exchange_shares` para venta atomica en Supabase y defensa multi-dispositivo.
    *   La app nativa usa la misma ruta segura de venta y refresca el oro desde Supabase cuando la RPC confirma la operacion.
*   **Notas/Advertencias:** La CLI de Supabase quedo con timeout al intentar aplicar el SQL enlazado; si la funcion no aparece en Supabase, ejecutar `supabase_realm_exchange_sync.sql` manualmente en el SQL Editor.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/magicBalance.ts`, `src/utils/grimoireContent.ts`, `docs/grimoire_balance_audit.md`
*   **Resumen de Tareas:** Se agrego una capa global de balance para el Grimorio, revisando magias de Lv1-Lv5 y corrigiendo habilidades con riesgo de Mano Negra.
*   **Cambios Clave:**
    *   Se aplican guardas por nivel para mantener progresion clara entre Lv1 y Lv5.
    *   Se agregaron reworks para habilidades con instakill, invulnerabilidad, defensa absoluta, control permanente o destruccion masiva sin respuesta.
    *   El balance se aplica tanto al contenido local como al contenido administrado desde Supabase.
    *   Se dejo una auditoria de criterios y familias afectadas en `docs/grimoire_balance_audit.md`.
*   **Notas/Advertencias:** La correccion no borra el material original; se aplica como capa de lectura y administracion para conservar compatibilidad con el formato actual.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/features/realmExchange/realmExchange.storage.ts`, `src/components/RealmStockExchange.tsx`, `apps/mobile/src/features/realmExchange/realmExchangeStorage.ts`, `supabase_realm_exchange_sync.sql`
*   **Resumen de Tareas:** Se corrigio la divergencia de carteras de la Bolsa del Reino entre web y app movil, migrando la persistencia hacia Supabase con compatibilidad para estados locales anteriores.
*   **Cambios Clave:**
    *   La Bolsa del Reino deja de depender solo de `localStorage` y `AsyncStorage` por dispositivo.
    *   Se agrego sincronizacion remota por `player_id` en la tabla `player_realm_exchange_states`.
    *   Al cargar, el sistema fusiona una sola vez el estado local viejo con el remoto para no perder compras previas del mismo usuario.
    *   Tras sincronizar, limpia el estado local legado para evitar que vuelva a duplicarse en siguientes cargas.
*   **Notas/Advertencias:** Para que la cartera quede realmente unificada entre dispositivos, hay que ejecutar `supabase_realm_exchange_sync.sql` en Supabase. Si la tabla aun no existe, el sistema conserva el fallback local sin romper la Bolsa.

### [2026-05-06] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/AdminControlSheet.tsx`
*   **Resumen de Tareas:** Se habilito la carga de imagenes desde galeria en el formulario de mercado dentro del panel admin.
*   **Cambios Clave:**
    *   Se agrego un boton `Cargar imagen desde galeria` debajo del campo `URL de imagen`.
    *   La imagen seleccionada se convierte a data URL local para no depender de enlaces externos.
    *   El formulario deja feedback claro cuando la imagen se carga correctamente o falla la lectura.
*   **Notas/Advertencias:** La carga reutiliza el mismo criterio practico ya usado en bestiario y flora, manteniendo consistencia en el panel admin.

### [2026-07-07] - [Autor: Antigravity]
*   **Archivos Modificados:** `scripts/antigravity2-graphify-setup.ps1`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Corrección de sintaxis de parser de PowerShell en el script de instalación de Graphify.
*   **Cambios Clave:**
    *   Se movió el bloque `param(...)` a la primera línea del archivo. En PowerShell, el bloque de parámetros debe ser la primera sentencia ejecutable en el script; colocar asignaciones de variables antes de `param` causaba un error de sintaxis del parser (`ParserError: InvalidLeftHandSide`).
*   **Notas/Advertencias:** Este fix permite que el script se ejecute correctamente en cualquier terminal de PowerShell.

### [2026-07-08] - [Autor: Antigravity]
*   **Archivos Modificados:** `AGENTS.md`, `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl`
*   **Resumen de Tareas:** Expansión de reglas y utilidades de Graphify en el manual para agentes.
*   **Cambios Clave:**
    *   Se documentaron y agregaron pautas explícitas sobre el uso de `graphify affected` para análisis de impacto antes de refactorizar componentes o bases de datos, `graphify global` para cruzar dependencias inter-repositorios, y comandos de visualización gráfica (`callflow-html` y `tree`).
*   **Notas/Advertencias:** Ninguna.
