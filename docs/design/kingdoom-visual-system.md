# Kingdoom: fortaleza nocturna

## Fuentes incorporadas a Codex

Verificadas por la API de GitHub el 18-09-2026:

| Repositorio | Estrellas | Skill instalada | Aplicación |
| --- | ---: | --- | --- |
| https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | 128748 | `ui-ux-pro-max` | Jerarquía, objetivos táctiles, contraste, responsive y movimiento reducido |
| https://github.com/anthropics/skills | 177004 | `frontend-design` | Dirección visual específica, composición, tipografía y crítica visual |

Instaladas con el instalador oficial de Codex en `~/.codex/skills/`. Las estrellas corresponden al repositorio completo, no a una skill individual. Trabajan junto a `kingdoom-designer` y `kingdoom-frontend`.

## Dirección

Kingdoom es un reino de rol persistente, con personajes, misiones, magia, comercio y crónicas. La fortaleza ilustrada es la pieza principal; la interfaz alrededor es discreta y legible. La búsqueda de UI/UX Pro Max `gaming immersive dark` coincide con el producto en profundidad y atmósfera; su neón y tipografía de esports no encajan con el lore, por lo que se conservan Cinzel y una paleta de materiales medievales.

- Piedra nocturna `#101413`: fondo.
- Pizarra `#191e1c`: paneles.
- Latón `#d2b578`: acción principal.
- Pergamino `#eee9df`: texto principal.
- Niebla `#a9b3ac`: texto secundario.
- Bosque `#7da995`: apoyo y acentos del paisaje.
- Cinzel para marca y títulos, Manrope para lectura y controles. Cifras tabulares para oro y contadores.
- Bordes discretos, radios de 12–24 px según jerarquía. Evitar paneles anidados y halos permanentes.

## Composición

Escritorio: navegación lateral persistente, cabecera de contexto y perfil desplegable, portada panorámica y contenido en columnas. Móvil y tablet estrecha: marca compacta, perfil accesible y cinco destinos en la barra inferior con área segura.

```text
Escritorio                         Móvil
┌────────┬─────────────────────┐   ┌─────────────────┐
│ Marca  │ Contexto / perfil   │   │ Marca / perfil  │
│        ├─────────────────────┤   ├─────────────────┤
│ Inicio │ Portada ilustrada   │   │ Portada         │
│ Magia  │ Acciones del reino  │   │ Acciones        │
│ ...    ├──────────┬──────────┤   │ Misiones        │
│        │ Misiones / eventos │   │ Eventos         │
└────────┴──────────┴──────────┘   ├─────────────────┤
                                  │ Navegación      │
                                  └─────────────────┘
```

## Movimiento y acceso

Entrada de sección de 220 ms, respuesta de controles de 160–200 ms. Evitar apilar animaciones sobre un mismo elemento y retrasos por cada tarjeta. La preferencia de movimiento reducido se aplica a CSS y Framer Motion. Navegación con nombres accesibles, estado actual, foco visible, salto al contenido y controles táctiles de al menos 44 px. Se conserva la lógica de oro, inventario, sesiones y RPCs.

## Verificación requerida

Revisar Inicio, Grimorio, Biblioteca, Mercado, Archivista y Portal anime en escritorio y móvil; formularios, perfil y paneles; ausencia de desbordamiento horizontal; navegación por teclado; movimiento reducido; TypeScript y compilación. El repositorio no contiene un cliente Windows/Electron/Tauri: escritorio corresponde a la web en pantallas de escritorio.

## Ilustración de portada

Generada con la herramienta integrada `image_gen`, incorporada como `public/img/realm-citadel.webp` (1536 × 1024, 149838 bytes). Brief del prompt: fortaleza gótica de piedra en la mitad derecha, paisaje oscuro con espacio para texto a la izquierda, eclipse, niebla azul verdosa y ventanas de luz ámbar; ilustración pictórica cinematográfica, sin texto ni logotipos. El fondo se recorta de forma distinta en móvil y escritorio y es decorativo para los lectores de pantalla.

Prompt final:

> Use case: stylized-concept. Create a cinematic dark fantasy illustration for the hero background of Kingdoom, a medieval roleplaying web app called Reino de las Sombras. Wide landscape 1536x1024. An immense weathered gothic stone fortress with slender spires on a rocky cliff, distant mountain ranges and an ancient arched bridge disappearing into blue-green night mist. Small amber lights in windows, cloudy moonlit sky, subtle atmosphere of an eternal eclipse. Hand-painted premium fantasy book cover, evocative and richly detailed but grounded, sophisticated desaturated ink teal, charcoal stone and aged golden light. Composition: the fortress dominates the RIGHT half; the LEFT half is mostly very dark misty landscape and empty sky suitable for white overlaid text. No text, no letters, no logos, no UI, no watermark, no people, no neon, no large glowing magical effects. Landscape should remain clearly visible, not crushed to pure black.

## Incidencia observada durante la revisión

El servidor local mostraba `Cannot read properties of null (reading 'useContext')`. Su log contenía un fallo previo de escaneo de dependencias: `@emotion/is-prop-valid` no podía resolverse desde `android/app/build/intermediates/assets/debug/mergeDebugAssets/public/assets/motion-CUEKfUlm.js`. Vite analizaba HTML compilado de Android, ajeno a la entrada web. `optimizeDeps.entries: ["index.html"]` limita el análisis a la SPA; la nueva sesión de navegador recorre todas las secciones sin excepciones no capturadas. Referencia: https://vite.dev/config/dep-optimization-options.html#optimizedeps-entries.

## Prueba reproducible

Con Vite o su preview en marcha y el ejecutable `agent-browser` disponible:

```powershell
python scripts/check-realm-ui.py --browser <ruta-al-ejecutable-agent-browser> --url http://127.0.0.1:4173
```

La prueba usa lecturas públicas. No envía formularios de acceso ni ejecuta compras, apuestas o cambios de inventario. Produce capturas en `artifacts/realm-ui/`. Comprueba las seis secciones a 390 y 1440 px, la portada a 375/768/1024/1920 px, filtros y acordeón del grimorio, mapas, navegación por teclado, foco y cierre del modal, movimiento reducido y errores del navegador. Los carruseles horizontales intencionados se permiten; el contenido principal no debe escapar del viewport.

## Archivos de implementación

| Archivos | Cambio |
| --- | --- |
| `src/App.tsx`, `src/components/RealmNavigation.tsx` | Composición responsive, portada, accesos y navegación con foco |
| `src/realm.css`, `src/index.css`, `index.html` | Paleta, tipografías, tamaños, superficies, transiciones y breakpoints |
| `src/main.tsx` | Preferencia de movimiento reducido en Framer Motion |
| `src/components/SectionHeader.tsx`, `src/components/FilterPill.tsx`, `src/components/EventCard.tsx` | Controles y componentes visuales compartidos |
| `src/components/PlayerProfilePanel.tsx`, `src/components/KingdoomAuthModal.tsx` | Perfil compacto, icono coherente y foco del modal |
| `src/components/GrimoireSection.tsx`, `src/components/LibrarySection.tsx`, `src/components/ArchivistSection.tsx`, `src/components/AnimeHubSection.tsx`, `src/sections/MarketSection.tsx` | Jerarquía, cabeceras, filtros y accesos de cada destino |
| `public/img/realm-citadel.webp` | Ilustración optimizada para la portada |
| `vite.config.ts` | Entrada explícita para el análisis de dependencias web |
| `scripts/check-realm-ui.py` | Comprobación de navegador reproducible sin dependencias nuevas del proyecto |
| `AI_CHANGELOG.md`, `ai-memory/kingdoom-memory.jsonl` | Registro y relevo de la tarea |

## Validación y límites

`npx tsc --noEmit` y `npm run build` terminaron con código 0. El build final contiene 2255 módulos; CSS: 273.56 kB, 37.70 kB comprimido. Las comprobaciones del navegador se ejecutan sobre el preview de ese build.

La ejecución completa de `check-realm-ui.py --url http://127.0.0.1:4173` terminó con código 0 el 18-09-2026: doce revisiones de pantalla (seis destinos, dos tamaños), filtros/acordeón/mapas, teclado/modal y cuatro tamaños adicionales de portada. Ninguna excepción de JavaScript no capturada. Archivista finalizó con «Archivo sincronizado», 179 fuentes y 5/5 conectores. Algunas lecturas remotas tardaron hasta 38 segundos; se esperó su finalización para capturar el estado cargado.

Graphify se actualizó con código 0 (9613 nodos, 16134 relaciones). Informó de 43 archivos SQL sin parser opcional, cinco archivos con extracción parcial y metadatos antiguos sin `source_file`. Son límites de su grafo local, no errores de compilación de la aplicación.

La revisión visual y funcional cubre la interfaz pública y el modal de acceso sin enviar credenciales. No constituye una prueba de transacciones económicas, administración autenticada ni proveedores externos de vídeo. No hay cambios de esquema o RPC. El trabajo permanece local, sin push ni despliegue.
