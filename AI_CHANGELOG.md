# AI Collaboration Log & Project Context

Este archivo sirve como puente de comunicacion y registro de actividad entre los asistentes de IA (**Antigravity** y **Jarvis**) y el desarrollador (**e_grado**).
Su proposito es mantener un historial claro de los cambios en el proyecto **Kingdoom-sync** para evitar conflictos y asegurar que todos estemos en la misma pagina.

---

## Instrucciones para Inteligencias Artificiales (Antigravity y Jarvis)

1. **Leer antes de actuar:** Cada vez que inicies sesion o recibas una tarea compleja, revisa rapidamente la seccion `Historial de Cambios` para saber que se modifico recientemente.
2. **Registrar despues de actuar:** **SIEMPRE** que se finalice un cambio importante, un nuevo componente o una refactorizacion, el asistente responsable debe aniadir una nueva entrada al `Historial de Cambios`.
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

*(Aniade nuevas entradas siempre en la parte superior de esta lista)*

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
    *   Se elimino la pestaña `Plantillas` del panel admin para dejar el centro de control mas limpio.
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
*   **Resumen de Tareas:** Se añadieron mutadores aleatorios por caceria y criticos especiales por dificultad para darle mas variedad y personalidad al PvE arcade.
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
*   **Resumen de Tareas:** OptimizaciÃ³n mobile-first para que la navegaciÃ³n sea mÃ¡s fluida y los modales no queden tapados por la barra inferior.
*   **Cambios Clave:**
    *   El panel `Tu sesion de jugador` ahora se auto-compacta fuera de `Inicio` y permite expandir/compactar manualmente.
    *   Al cambiar de pestaÃ±a se hace scroll al inicio (evita que el usuario â€œcaigaâ€ a mitad de pÃ¡gina en mÃ³vil).
    *   Mercado: los catÃ¡logos por categorÃ­a ya no aparecen abiertos por defecto (reduce scroll infinito).
    *   Modales de fichas (`CharImportModal`/`CharSheetModal`) suben su z-index y ajustan alto/padding para no quedar detrÃ¡s de la barra inferior.
*   **Notas/Advertencias:** Sin cambios en la lÃ³gica de Supabase o guardado; solo UX/layout.

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
    *   El parser ahora elimina asteriscos restantes dentro del contenido y omite lÃ­neas de plantilla tipo "Noble, plebeyo o burgues" / "En caso de ser".
    *   `CharSheetModal` renderiza bloques tipo lista como bullets y mantiene "Ver mas / Ver menos" para textos largos.
*   **Notas/Advertencias:** Para fichas viejas ya guardadas, el modal tambiÃ©n limpia `*` y guiones al mostrar (no es necesario re-importar).

---
### [Fecha: 13/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/sheetParser.ts`, `src/utils/characterSheets.ts`, `src/types.ts`, `src/components/PlayerProfilePanel.tsx`, `src/components/CharImportModal.tsx`, `src/components/RealmRegistry.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se termino y estabilizo el sistema de Fichas de Personaje (importar desde WhatsApp, guardar con defaults, y buscador publico) con soporte opcional para mostrar/buscar por usuario (sin depender del UUID).
*   **Cambios Clave:**
    *   Parser reescrito (`sheetParser.ts`) para tolerar mejor el formato decorado de WhatsApp y capturar secciones multilÃ­nea sin â€œmezclarâ€ campos.
    *   Guardado de fichas ahora completa valores por defecto al crear la ficha (evita `undefined` y hace el upsert mÃ¡s estable).
    *   Se aÃ±adiÃ³ `playerUsername?: string` al tipo `CharacterSheet` y la capa de guardado detecta si la tabla soporta esa columna; si no, omite la propiedad para no romper el upsert.
    *   Registro del Reino (`RealmRegistry`) mejorado: bÃºsqueda por personaje/raza/profesiÃ³n y, si existe la columna, por `playerUsername`; si no, cae a `playerId`.
    *   Importador (`CharImportModal`) con placeholder limpio (plantilla) y grilla de stats mÃ¡s usable en mÃ³vil.
*   **Notas/Advertencias:** Si quieres que el Registro muestre y busque por nombre de jugador, crea la columna opcional `playerUsername` en `character_sheets` (texto) o avÃ­same y te paso el SQL exacto para tu esquema.

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
    *   Se restauro la navegacion principal (Inicio, Grimorio, Biblioteca, Mercado, Ranking) para que coincida con `TabId` y el diseÃ±o acordado.
    *   Se corrigio `PlayerProfilePanel` para incluir `motion` en los modales y evitar errores en runtime.
    *   Se normalizo Supabase para que el cliente no sea `null`: ahora falla rapido con un error claro si faltan `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, y `src/lib/supabase.ts` reexporta el mismo cliente.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores.

---
### [Fecha: 13/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** CorrecciÃ³n del sistema de retiro automÃ¡tico y visualizaciÃ³n del tope en el minijuego Crash.
*   **Cambios Clave:**
    *   **SoluciÃ³n de Stale Closures:** ImplementaciÃ³n de `useRef` para variables crÃ­ticas (apuesta, jugador, multiplicador) asegurando lecturas en tiempo real dentro del bucle `requestAnimationFrame`.
    *   **VisualizaciÃ³n del Tope:** Ajuste dinÃ¡mico del eje Y (`maxY`) en el canvas para que la lÃ­nea de retiro automÃ¡tico sea siempre visible en el grÃ¡fico.
    *   **PrecisiÃ³n de Cobro:** El retiro automÃ¡tico ahora asegura el multiplicador exacto configurado por el usuario, evitando discrepancias por saltos de frames.
*   **Notas/Advertencias:** SimulaciÃ³n y compilaciÃ³n verificadas exitosamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/scratchUtils.ts`, `src/components/TavernScratch.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** AleatorizaciÃ³n del lÃ­mite diario de ganancias en el Rasca y Gana.
*   **Cambios Clave:**
    *   **LÃ­mite DinÃ¡mico**: El lÃ­mite dejÃ³ de ser fijo (50,000) y ahora varÃ­a cada dÃ­a entre **10,000 y 150,000 de oro**.
    *   **Semilla Diaria**: Se utiliza la misma semilla pseudo-aleatoria del dÃ­a para calcular el lÃ­mite, asegurando consistencia durante las 24 horas.
    *   **Feedback Visual**: Se actualizÃ³ el mensaje de "LÃ­mite Alcanzado" para mostrar dinÃ¡micamente el tope del dÃ­a actual.
*   **Notas/Advertencias:** El lÃ­mite es por jugador y por dÃ­a local.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** ImplementaciÃ³n del minigame "El Multiplicador del VacÃ­o" (Crash Game).
*   **Cambios Clave:**
    *   **LÃ³gica de Tiempo Real**: Sistema basado en `requestAnimationFrame` para un conteo fluido y preciso.
    *   **Curva Exponencial**: El multiplicador acelera con el tiempo (`1.06^t`), aumentando la presiÃ³n psicolÃ³gica.
    *   **Punto de Colapso DinÃ¡mico**: Algoritmo de azar con un 3% de margen de la casa (instant crash).
    *   **Interfaz de NeÃ³n**: DiseÃ±o oscuro con efectos de brillo, anillos de energÃ­a y respuesta visual al ganar o perder.
    *   **IntegraciÃ³n de Saldo**: SincronizaciÃ³n completa con `usePlayerSession` para apuestas y retiros.
*   **Notas/Advertencias:** Limpieza de animaciones al desmontar el componente para evitar fugas de memoria.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigiÃ³ y potenciÃ³ el buscador del Grimorio para permitir bÃºsquedas globales y profundas en todo el catÃ¡logo de habilidades.
*   **Cambios Clave:**
    *   **BÃºsqueda Global**: Al buscar una palabra, el sistema ahora ignora la categorÃ­a seleccionada y busca en TODO el grimorio simultÃ¡neamente.
    *   **ExpansiÃ³n de Criterios**: El buscador ahora analiza el tÃ­tulo, el Marco TeÃ³rico (descripciÃ³n), los nombres de habilidades, sus efectos y las restricciones de Anti-Mano Negra.
    *   **Auto-Apertura Inteligente**: Las escuelas de magia y las tarjetas de habilidad que contienen la palabra buscada se abren automÃ¡ticamente para facilitar la lectura.
    *   **Contexto de BÃºsqueda**: Se aÃ±adieron etiquetas visuales en los resultados que indican a quÃ© categorÃ­a (InvocaciÃ³n, Elemental, etc.) pertenece cada estilo encontrado.
*   **Notas/Advertencias:** `npx tsc --noEmit` verificado. Al limpiar el buscador, la interfaz regresa automÃ¡ticamente a la categorÃ­a que estaba seleccionada previamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCards.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Aumento de dificultad y sistema de rachas para el juego de cartas de la taberna.
*   **Cambios Clave:**
    *   **Mazo Ampliado**: El rango de cartas pasÃ³ de 1-10 a 1-15, dificultando las predicciones.
    *   **Sistema de Doble o Nada (Rachas)**: Tras ganar, el premio no se cobra automÃ¡ticamente. El jugador debe decidir entre "Cobrar" o seguir con "Doble o Nada".
    *   **Pozo Acumulado**: Las ganancias se acumulan en un pozo que se multiplica x2 con cada acierto. Si se falla, se pierde TODO el pozo acumulado.
    *   **OptimizaciÃ³n Mobile-First**: RediseÃ±o completo de la interfaz con botones mÃ¡s grandes, indicadores de racha/pozo y animaciones fluidas para una experiencia premium en mÃ³vil y escritorio.
*   **Notas/Advertencias:** Los empates mantienen la racha y el pozo (neutral). Se verificÃ³ la lÃ³gica de persistencia con Supabase.

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
*   **Resumen de Tareas:** Se agregaron los mapas del continente a la pestaÃ±a `Mapa y Mundo` dentro de `Biblioteca`, con selector y visor en grande para movil.
*   **Cambios Clave:**
    *   Nuevo bloque de mapa al inicio de `Mapa y Mundo` con botones para alternar entre "Vyralis" y "Geopolitica".
    *   El mapa se puede tocar/abrir en un modal de pantalla completa para leer detalles sin saturar la UI.
    *   Los assets quedan versionados en `src/assets/maps/` para que Vite los empaquete y no haya 404 en deploy.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores (advertencia conocida por bundle grande, sin bloquear).

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Conversion automatica de unidades cientificas (N, kg, J, km/h, m/s, Â°C) a "puntos" estilo D&D para que las habilidades se entiendan como stats (Fuerza, Velocidad, Danio).
*   **Cambios Clave:**
    *   Se implemento un formateador que reemplaza tokens tipo `$2000 N$` por equivalentes como `(+10 Fuerza)` y limpia escapes como `\\%`.
    *   El formateo se aplica a `effect`, `cd`, `limit`, `antiManoNegra` y tambien al texto de `Marco Teorico` dentro del Grimorio.
    *   La escala de conversion queda centralizada y facil de ajustar en una sola funcion (`convertUnitToDndPoints`).
*   **Notas/Advertencias:** Escala inicial: N->Fuerza (N/200), m/s->Velocidad (m/s/5), J->Danio (J/500), Â°C->Danio de Fuego (Â°C/20), con tope 25. `npx tsc --noEmit` verificado sin errores.

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
*   **Resumen de Tareas:** ReestructuraciÃ³n de la arquitectura de la SPA para integrar un sistema de habilidades (Grimorio) y optimizar la navegaciÃ³n mÃ³vil mediante la fusiÃ³n de secciones informativas.
*   **Cambios Clave:**
    *   **FusiÃ³n "Biblioteca"**: Se unificaron las antiguas pestaÃ±as `Lore` y `Mundo` en una sola secciÃ³n de `Biblioteca` con un selector interno (Tabs), liberando espacio en la barra de navegaciÃ³n.
    *   **Grimorio de Habilidades**: ImplementaciÃ³n de una secciÃ³n dedicada para gestionar poderes y magias, categorizados por escuelas (InvocaciÃ³n, Elemental, etc.).
    *   **DiseÃ±o TÃ©cnico-CientÃ­fico**: Las habilidades incluyen Lore basado en fÃ­sica real, niveles 1-5, tiempos de enfriamiento y limitantes especÃ­ficas.
    *   **Capa Anti-Mano Negra**: Se integrÃ³ una secciÃ³n visual distintiva en cada habilidad para definir reglas de balanceo y prohibiciones de uso (Anti-Powergaming).
    *   **NavegaciÃ³n Optimizada**: La barra inferior se mantiene en 5 elementos (Inicio, Grimorio, Biblioteca, Mercado, Ranking), mejorando la UX en dispositivos mÃ³viles.
*   **Notas/Advertencias:** Se dejÃ³ `src/data/grimorio.ts` con plantillas y comentarios para facilitar la expansiÃ³n manual de contenidos sin saturar el contexto de la IA.

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
*   **Resumen de Tareas:** ImplementaciÃ³n de la LoterÃ­a DinÃ¡mica 24h con lÃ­mites de fortuna, reembolsos automÃ¡ticos y optimizaciones de interfaz mÃ³vil.
*   **Cambios Clave:**
    *   **LoterÃ­a DinÃ¡mica (24h)**: Se creÃ³ `scratchUtils.ts` para generar precios (200-500) y probabilidades (10-40%) deterministas basados en la fecha actual (semilla diaria).
    *   **Multi-Scratch & Jackpot**: Se aÃ±adiÃ³ la compra mÃºltiple de tickets con "Auto-Scrape" y un Jackpot VIP fijo del 5% (10,000 oro) independiente de la racha diaria.
    *   **Control de InflaciÃ³n (LÃ­mite 50k)**: Se implementÃ³ un tope de ganancias brutas diarias de 50,000 oro. Al alcanzarlo, el juego se bloquea hasta el dÃ­a siguiente.
    *   **Sistema de Reembolsos**: Si una compra masiva choca con el lÃ­mite de 50k antes de terminar, los tickets sobrantes se cancelan automÃ¡ticamente y el oro se devuelve Ã­ntegro al jugador con una auditorÃ­a visual en el recibo.
    *   **Mobile-First Admin**: Se refactorizaron los grupos de botones y filtros del panel de administraciÃ³n para evitar desbordamientos en pantallas pequeÃ±as mediante scroll horizontal y flex-wrap.
    *   **UX Pulido**: Se ajustÃ³ la lÃ³gica de renderizado para permitir ver los resultados finales y reembolsos antes de que aparezca el mensaje bloqueante de "LÃ­mite Alcanzado".
*   **Notas/Advertencias:** El sistema de semillas asegura que todos los jugadores vean la misma "suerte" cada dÃ­a. El lÃ­mite de 50k se persiste en `localStorage` vinculado al ID del jugador y la fecha. `npx tsc --noEmit` verificado sin errores.

---
### [Fecha: 07/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/market.ts` (Nuevo), `src/components/AdminControlSheet.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio una pestana `Mercado` al panel de administracion para crear, editar y borrar productos del catalogo desde la interfaz sin tocar codigo.
*   **Cambios Clave:**
    *   Se creo `src/utils/market.ts` con `fetchMarketItems`, `upsertMarketItem`, `deleteMarketItem` y `slugifyMarketItem`, siguiendo el patron de `events.ts`.
    *   El mercado publico ahora carga los items desde Supabase (tabla `market_items`) con fallback transparente al archivo local `src/data/market.ts`.
    *   La pestana `Mercado` del admin tiene formulario completo: nombre, descripcion, habilidad, categoria, rareza, stock, precio, imagen (URL, ajuste, posicion) y destacado.
    *   El ID se auto-genera como slug de categoria+nombre al crear (ej: "Mi Espada" + swords â†’ `sword-mi-espada`); en edicion muestra el ID existente.
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
    *   Se agrego una pestaÃ±a `Eventos` al panel admin para crear y editar los eventos visibles del inicio sin tocar codigo manualmente.
    *   El diseÃ±o publico de los eventos no cambia: solo cambia el origen del contenido cuando Supabase esta disponible.
*   **Notas/Advertencias:** Para administrarlos desde la web hace falta crear manualmente la tabla `realm_events` usando el SQL sugerido en `src/utils/events.ts`.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio la pestaÃ±a `Jugadores` al panel admin para crear perfiles nuevos y corregir oro sin entrar manualmente a Supabase.
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
