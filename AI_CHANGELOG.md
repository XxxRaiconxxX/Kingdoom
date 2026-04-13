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
### [Fecha: 13/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Corrección del sistema de retiro automático y visualización del tope en el minijuego Crash.
*   **Cambios Clave:**
    *   **Solución de Stale Closures:** Implementación de `useRef` para variables críticas (apuesta, jugador, multiplicador) asegurando lecturas en tiempo real dentro del bucle `requestAnimationFrame`.
    *   **Visualización del Tope:** Ajuste dinámico del eje Y (`maxY`) en el canvas para que la línea de retiro automático sea siempre visible en el gráfico.
    *   **Precisión de Cobro:** El retiro automático ahora asegura el multiplicador exacto configurado por el usuario, evitando discrepancias por saltos de frames.
*   **Notas/Advertencias:** Simulación y compilación verificadas exitosamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/scratchUtils.ts`, `src/components/TavernScratch.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Aleatorización del límite diario de ganancias en el Rasca y Gana.
*   **Cambios Clave:**
    *   **Límite Dinámico**: El límite dejó de ser fijo (50,000) y ahora varía cada día entre **10,000 y 150,000 de oro**.
    *   **Semilla Diaria**: Se utiliza la misma semilla pseudo-aleatoria del día para calcular el límite, asegurando consistencia durante las 24 horas.
    *   **Feedback Visual**: Se actualizó el mensaje de "Límite Alcanzado" para mostrar dinámicamente el tope del día actual.
*   **Notas/Advertencias:** El límite es por jugador y por día local.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCrash.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Implementación del minigame "El Multiplicador del Vacío" (Crash Game).
*   **Cambios Clave:**
    *   **Lógica de Tiempo Real**: Sistema basado en `requestAnimationFrame` para un conteo fluido y preciso.
    *   **Curva Exponencial**: El multiplicador acelera con el tiempo (`1.06^t`), aumentando la presión psicológica.
    *   **Punto de Colapso Dinámico**: Algoritmo de azar con un 3% de margen de la casa (instant crash).
    *   **Interfaz de Neón**: Diseño oscuro con efectos de brillo, anillos de energía y respuesta visual al ganar o perder.
    *   **Integración de Saldo**: Sincronización completa con `usePlayerSession` para apuestas y retiros.
*   **Notas/Advertencias:** Limpieza de animaciones al desmontar el componente para evitar fugas de memoria.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se corrigió y potenció el buscador del Grimorio para permitir búsquedas globales y profundas en todo el catálogo de habilidades.
*   **Cambios Clave:**
    *   **Búsqueda Global**: Al buscar una palabra, el sistema ahora ignora la categoría seleccionada y busca en TODO el grimorio simultáneamente.
    *   **Expansión de Criterios**: El buscador ahora analiza el título, el Marco Teórico (descripción), los nombres de habilidades, sus efectos y las restricciones de Anti-Mano Negra.
    *   **Auto-Apertura Inteligente**: Las escuelas de magia y las tarjetas de habilidad que contienen la palabra buscada se abren automáticamente para facilitar la lectura.
    *   **Contexto de Búsqueda**: Se añadieron etiquetas visuales en los resultados que indican a qué categoría (Invocación, Elemental, etc.) pertenece cada estilo encontrado.
*   **Notas/Advertencias:** `npx tsc --noEmit` verificado. Al limpiar el buscador, la interfaz regresa automáticamente a la categoría que estaba seleccionada previamente.

---
### [Fecha: 10/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/components/TavernCards.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Aumento de dificultad y sistema de rachas para el juego de cartas de la taberna.
*   **Cambios Clave:**
    *   **Mazo Ampliado**: El rango de cartas pasó de 1-10 a 1-15, dificultando las predicciones.
    *   **Sistema de Doble o Nada (Rachas)**: Tras ganar, el premio no se cobra automáticamente. El jugador debe decidir entre "Cobrar" o seguir con "Doble o Nada".
    *   **Pozo Acumulado**: Las ganancias se acumulan en un pozo que se multiplica x2 con cada acierto. Si se falla, se pierde TODO el pozo acumulado.
    *   **Optimización Mobile-First**: Rediseño completo de la interfaz con botones más grandes, indicadores de racha/pozo y animaciones fluidas para una experiencia premium en móvil y escritorio.
*   **Notas/Advertencias:** Los empates mantienen la racha y el pozo (neutral). Se verificó la lógica de persistencia con Supabase.

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
*   **Resumen de Tareas:** Se agregaron los mapas del continente a la pestaña `Mapa y Mundo` dentro de `Biblioteca`, con selector y visor en grande para movil.
*   **Cambios Clave:**
    *   Nuevo bloque de mapa al inicio de `Mapa y Mundo` con botones para alternar entre "Vyralis" y "Geopolitica".
    *   El mapa se puede tocar/abrir en un modal de pantalla completa para leer detalles sin saturar la UI.
    *   Los assets quedan versionados en `src/assets/maps/` para que Vite los empaquete y no haya 404 en deploy.
*   **Notas/Advertencias:** `npx tsc --noEmit` y `npm run build` verificados sin errores (advertencia conocida por bundle grande, sin bloquear).

---
### [Fecha: 09/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/components/GrimoireSection.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Conversion automatica de unidades cientificas (N, kg, J, km/h, m/s, °C) a "puntos" estilo D&D para que las habilidades se entiendan como stats (Fuerza, Velocidad, Danio).
*   **Cambios Clave:**
    *   Se implemento un formateador que reemplaza tokens tipo `$2000 N$` por equivalentes como `(+10 Fuerza)` y limpia escapes como `\\%`.
    *   El formateo se aplica a `effect`, `cd`, `limit`, `antiManoNegra` y tambien al texto de `Marco Teorico` dentro del Grimorio.
    *   La escala de conversion queda centralizada y facil de ajustar en una sola funcion (`convertUnitToDndPoints`).
*   **Notas/Advertencias:** Escala inicial: N->Fuerza (N/200), m/s->Velocidad (m/s/5), J->Danio (J/500), °C->Danio de Fuego (°C/20), con tope 25. `npx tsc --noEmit` verificado sin errores.

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
*   **Resumen de Tareas:** Reestructuración de la arquitectura de la SPA para integrar un sistema de habilidades (Grimorio) y optimizar la navegación móvil mediante la fusión de secciones informativas.
*   **Cambios Clave:**
    *   **Fusión "Biblioteca"**: Se unificaron las antiguas pestañas `Lore` y `Mundo` en una sola sección de `Biblioteca` con un selector interno (Tabs), liberando espacio en la barra de navegación.
    *   **Grimorio de Habilidades**: Implementación de una sección dedicada para gestionar poderes y magias, categorizados por escuelas (Invocación, Elemental, etc.).
    *   **Diseño Técnico-Científico**: Las habilidades incluyen Lore basado en física real, niveles 1-5, tiempos de enfriamiento y limitantes específicas.
    *   **Capa Anti-Mano Negra**: Se integró una sección visual distintiva en cada habilidad para definir reglas de balanceo y prohibiciones de uso (Anti-Powergaming).
    *   **Navegación Optimizada**: La barra inferior se mantiene en 5 elementos (Inicio, Grimorio, Biblioteca, Mercado, Ranking), mejorando la UX en dispositivos móviles.
*   **Notas/Advertencias:** Se dejó `src/data/grimorio.ts` con plantillas y comentarios para facilitar la expansión manual de contenidos sin saturar el contexto de la IA.

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
*   **Resumen de Tareas:** Implementación de la Lotería Dinámica 24h con límites de fortuna, reembolsos automáticos y optimizaciones de interfaz móvil.
*   **Cambios Clave:**
    *   **Lotería Dinámica (24h)**: Se creó `scratchUtils.ts` para generar precios (200-500) y probabilidades (10-40%) deterministas basados en la fecha actual (semilla diaria).
    *   **Multi-Scratch & Jackpot**: Se añadió la compra múltiple de tickets con "Auto-Scrape" y un Jackpot VIP fijo del 5% (10,000 oro) independiente de la racha diaria.
    *   **Control de Inflación (Límite 50k)**: Se implementó un tope de ganancias brutas diarias de 50,000 oro. Al alcanzarlo, el juego se bloquea hasta el día siguiente.
    *   **Sistema de Reembolsos**: Si una compra masiva choca con el límite de 50k antes de terminar, los tickets sobrantes se cancelan automáticamente y el oro se devuelve íntegro al jugador con una auditoría visual en el recibo.
    *   **Mobile-First Admin**: Se refactorizaron los grupos de botones y filtros del panel de administración para evitar desbordamientos en pantallas pequeñas mediante scroll horizontal y flex-wrap.
    *   **UX Pulido**: Se ajustó la lógica de renderizado para permitir ver los resultados finales y reembolsos antes de que aparezca el mensaje bloqueante de "Límite Alcanzado".
*   **Notas/Advertencias:** El sistema de semillas asegura que todos los jugadores vean la misma "suerte" cada día. El límite de 50k se persiste en `localStorage` vinculado al ID del jugador y la fecha. `npx tsc --noEmit` verificado sin errores.

---
### [Fecha: 07/04/2026] - [Autor: Antigravity]
*   **Archivos Modificados:** `src/utils/market.ts` (Nuevo), `src/components/AdminControlSheet.tsx`, `src/App.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio una pestana `Mercado` al panel de administracion para crear, editar y borrar productos del catalogo desde la interfaz sin tocar codigo.
*   **Cambios Clave:**
    *   Se creo `src/utils/market.ts` con `fetchMarketItems`, `upsertMarketItem`, `deleteMarketItem` y `slugifyMarketItem`, siguiendo el patron de `events.ts`.
    *   El mercado publico ahora carga los items desde Supabase (tabla `market_items`) con fallback transparente al archivo local `src/data/market.ts`.
    *   La pestana `Mercado` del admin tiene formulario completo: nombre, descripcion, habilidad, categoria, rareza, stock, precio, imagen (URL, ajuste, posicion) y destacado.
    *   El ID se auto-genera como slug de categoria+nombre al crear (ej: "Mi Espada" + swords → `sword-mi-espada`); en edicion muestra el ID existente.
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
    *   Se agrego una pestaña `Eventos` al panel admin para crear y editar los eventos visibles del inicio sin tocar codigo manualmente.
    *   El diseño publico de los eventos no cambia: solo cambia el origen del contenido cuando Supabase esta disponible.
*   **Notas/Advertencias:** Para administrarlos desde la web hace falta crear manualmente la tabla `realm_events` usando el SQL sugerido en `src/utils/events.ts`.

---
### [Fecha: 06/04/2026] - [Autor: Jarvis]
*   **Archivos Modificados:** `src/utils/players.ts`, `src/components/AdminControlSheet.tsx`, `AI_CHANGELOG.md`
*   **Resumen de Tareas:** Se anadio la pestaña `Jugadores` al panel admin para crear perfiles nuevos y corregir oro sin entrar manualmente a Supabase.
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
