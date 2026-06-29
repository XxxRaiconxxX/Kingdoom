# Kingdoom Sync Agent Context

Este archivo es la guía local de comportamiento para **cualquier agente de IA**
que trabaje en este repositorio (Claude, Codex, Antigravity, Jules, u otros).

Todas las reglas de este documento aplican por igual a todo agente, sin
excepción. Cuando una regla dice "el agente", se refiere a quien sea que esté
trabajando en ese momento. Ningún agente está exento de una regla por no
llamarse de cierta forma.

## 0. Roles y División de Trabajo

No hay dominios exclusivos por nombre de agente: cualquier agente puede tocar
frontend, estilos, lógica o base de datos según la tarea que se le asigne.
La división es **por tarea, no por agente**.

- **Dominio web/frontend (este repo, `Kingdoom-sync`):** SPA en React, UI,
  estado, componentes, integración con Supabase desde el cliente, minijuegos
  de la Taberna, paneles de jugador y admin. Cualquier agente puede trabajar
  acá cuando se le asigne.
- **Dominio bot/backend (otro repo, `kingdoom-bot`):** fuera del alcance de
  este archivo salvo que se indique. No se toca desde acá.

REGLA DE CARRIL: el agente trabaja en la tarea que se le pidió y en el repo
correspondiente (`Kingdoom-sync`). No cruza al repo del bot ni asume tareas
de otra sesión salvo pedido explícito.

## Project Overview

Kingdoom Sync es el cliente web React y panel de administración de la economía
del juego Kingdoom. Está construido con React, Vite, TypeScript y Tailwind
CSS / CSS vanilla, comunicándose directamente con la base de datos Supabase.

## Repository Architecture

- `src/App.tsx`: Entry point del dashboard, ruteo y estructura de layout.
- `src/index.css`: Sistema de diseño central, Tailwind y CSS custom.
- `src/types.ts`: Definiciones TypeScript compartidas (players, items,
  auctions, etc.).
- `src/components/`: UI modular, acciones modales y pestañas:
  - `PlayerProfilePanel.tsx` y `PlayerInventorySheet.tsx`: Progreso del
    jugador, pestañas de inventario (inventario/créditos) y controles de sheet.
  - `PlayerAuctionPanel.tsx`: Interfaz del jugador para participar en
    subastas (pujar / ver estado).
  - `PayInstallmentModal.tsx` y `PurchaseModal.tsx`: Modales de compra
    (contado o cuotas) y pago de deudas.
  - `AppLiveHuntSection.tsx`: Interfaz de cacerías grupales en vivo.
  - `RealmStockExchange.tsx`: Interfaz de la bolsa de valores del Reino.
  - `Tavern*.tsx` (`TavernPlinko.tsx`, `TavernSlots.tsx`, `TavernCrash.tsx`,
    `TavernPenalty.tsx`, `TavernTowerDefense.tsx`, `TavernExpedition.tsx`,
    `TavernExpeditionArcade.tsx`, `TavernCards.tsx`, `TavernRoulette.tsx`,
    `TavernScratch.tsx`, `TavernHorseRace.tsx`, etc.): Minijuegos interactivos.
  - `admin/`: Controles de administración:
    - `AdminControlSheet.tsx`: Interfaz admin con pestañas categorizadas.
    - `AdminAuctionManager.tsx`: Gestión de subastas activas/pendientes y
      precios base.
    - `AdminMissionManager.tsx`: Gestión de misiones.
    - `AdminControlPrimitives.tsx`: Widgets de input admin compartidos.
    - `AdminKnowledgeManager.tsx`: Gestión de documentos de grimorio/conocimiento.
    - `AdminStaffAssistant.tsx`: Interfaz de asistente IA para staff y moderadores.
- `supabase/*.sql`: Esquemas de BD, políticas RLS y procedimientos RPC.

## Project Guardrails

- **Directorio de trabajo:** Trabajar solo dentro del workspace actual:
  `c:\Users\e_grado\Documents\New project 2\Kingdoom-sync`.
- **Consistencia:** Mantener las variables de estilo existentes (gradientes,
  diseños de tarjetas, sistema de layout).
- **Disciplina de Git:** Stagear solo archivos directamente relacionados con
  la tarea activa. No editar archivos no relacionados.
- **Dependencias:** No crear, modificar ni commitear `package-lock.json`.
- **Plataforma objetivo:** Priorizar la vista web de escritorio/responsiva.
  Los wrappers de app móvil son secundarios.
- **Changelog:** Documentar toda modificación funcional, de UI, de BD o
  arquitectónica en `AI_CHANGELOG.md`.

## 1. Reglas de Negocio y Lógica de la Economía

### Mecánica de Subastas
- **Comisión de entrada:** Se cobra una comisión única no reembolsable del 25%
  del precio base (`start_price`) del ítem al unirse a la subasta.
- **Modelo Lock-and-Release:** El oro ofertado por los jugadores no se descuenta
  definitivamente durante las pujas. Se bloquea en la subasta y, al finalizar,
  se devuelve automáticamente a todos los participantes excepto al ganador, a
  quien sí se le cobra el monto total de su última puja.
- **Pujas Acumulativas:** El monto que el jugador puja se suma a la puja
  acumulada global (ej: si la puja acumulada está en 100,000 y el jugador puja
  5,000, la nueva puja acumulada es 105,000). El jugador que no tenga oro
  suficiente para cubrir el nuevo total acumulado queda descalificado.

### Sistema de Compra a Cuotas (Installments)
- **Cuotas e Intereses:** El jugador puede comprar objetos del mercado en 3
  cuotas (con un 10% de recargo sobre el valor base) o 6 cuotas (con un 18% de
  recargo). Las pociones y consumibles no permiten financiación.
- **Bloqueo de Inventario (Locking):** Mientras el plan de pago esté activo, el
  ítem en `player_inventory` tendrá `is_locked = true` y no podrá utilizarse,
  equiparse ni transferirse. Al saldar la deuda, se desbloquea (`is_locked = false`).
- **Política de Morosidad:** Si un jugador tiene algún plan de pago en mora
  (`status = 'defaulted'`) en los últimos 14 días, el sistema le denegará
  cualquier nueva compra a plazos.

## 2. Estructura de la Base de Datos y Supabase (RPCs)

### Tablas Principales
- `players`: Perfil del jugador, contiene `gold`, `phone`, `is_admin`, `banned`.
- `character_sheets`: Ficha de rol del jugador. Usa la columna `playerId`
  (notar la I mayúscula en camelCase).
- `player_inventory`: Inventario real de objetos del mercado. Usa la columna
  `player_id` (notar snake_case), lee por `item_name` y contiene `is_locked`
  para artículos financiados.
- `payment_plans`: Registro de planes de financiación, cuotas pagadas, días de
  mora y estado del crédito.
- `knowledge_documents`: Almacena documentos de lore, bestiario, flora y grimorio.
- `market_auctions`: Registro de subastas activas (`active`, `completed`,
  `cancelled`).
- `market_auction_bids`: Historial de pujas realizadas por subasta.

### RPCs Clave
- `place_auction_bid(p_player_id, p_auction_id, p_amount)`: RPC que encapsula el
  cobro de la comisión de entrada, las validaciones de saldo y el incremento
  acumulado del bot de WhatsApp y la web de forma unificada.
- `purchase_market_item_v2(p_player_id, p_item_id, p_installments)`: RPC
  transaccional que procesa compras de mercado al contado o financiadas,
  validando el saldo, la morosidad y aplicando el bloqueo `is_locked`.
- `resolve_market_auction(p_auction_id)`: RPC que finaliza una subasta,
  transfiere el ítem al ganador, cobra la puja y devuelve el oro bloqueado al
  resto de los postores.

## 3. Playbooks (Guías Rápidas)

### Añadir o Modificar Minijuegos (Tavern)
1. Crea el componente en `src/components/Tavern[Nombre].tsx`.
2. Utiliza los hooks de base de datos o API locales en `src/hooks/` o
   `src/lib/` para sincronizar el saldo de oro con Supabase.
3. Agrégalo al enum de pestañas y al render condicional en `src/App.tsx`.

### Compras y Financiación en el Mercado
1. El usuario interactúa mediante `PurchaseModal` para elegir el método de pago
   (al contado, 3 cuotas o 6 cuotas).
2. Se consume `purchase_market_item_v2` en Supabase. Si es financiado, el ítem
   ingresa a `player_inventory` con `is_locked = true`.
3. El estado de la deuda y los pagos se administran desde `PayInstallmentModal`
   y la pestaña de créditos en `PlayerInventorySheet.tsx`.

### Editar el Panel de Subastas (Player / Admin)
- Modifica `PlayerAuctionPanel.tsx` para vistas del jugador (ingreso de
  incrementos de pujas) y `AdminAuctionManager.tsx` para la gestión de
  administradores (iniciar subastas, definir incrementos mínimos).

## 4. Convenciones de UI y Estilo Visual

- **Diseño Premium:** Utilizar gradientes vibrantes, bordes finos
  semi-transparentes y esquinas redondeadas.
- **Tipografía:** Usar fuentes limpias tipo Outfit o Inter para legibilidad óptima.
- **Responsividad:** Asegurar que todos los formularios, modales y paneles
  tengan clases de Tailwind para móviles (`sm:`, `md:`) sin romper escritorio.
- **Foco Accesible Temático:** Foco global `:focus-visible` condicionado al
  color de acento de la sección (ámbar en mercado, violeta en grimorio, etc.)
  visible solo al usar teclado.
- **Optimización de Scroll y Layout:**
  - Evitar saltos de scrollbar aplicando `scrollbar-gutter: stable` en `html`.
  - Configurar `overscroll-behavior: contain` en paneles con scroll interno
    (modales, hojas de admin) para evitar el arrastre del scroll de la página base.
- **Números y Títulos:**
  - `text-wrap: balance` para distribución equilibrada de títulos multilínea.
  - `font-variant-numeric: tabular-nums` para que los números en contadores y
    estadísticas mantengan anchos fijos y no vibren al cambiar.
- **Fluidez Táctil:** `-webkit-tap-highlight-color: transparent` y
  `overscroll-behavior-y: contain` en el body para experiencia tipo app nativa.

## 5. Validación y Verificación

- Ejecutar `npx tsc --noEmit` y `npm run build` para verificar que el código
  TypeScript compila correctamente y no introduce errores de tipado.
- Para pequeños cambios de texto o documentación, indicar brevemente en el
  reporte por qué se omitió el build de compilación.
- Verificar siempre que los estados de carga ("loading") y de error estén
  controlados en cada llamada a Supabase.

## 6. Regla de Contexto y Continuidad

No existe bootstrap obligatorio en este repositorio.

El agente puede consultar `AI_CHANGELOG.md`, relevo reciente o memoria cuando
eso ayude a ejecutar mejor la tarea, pero:

- no debe anunciar "Contexto cargado" como ritual fijo;
- no debe reiniciar una tarea por volver a leer contexto;
- no debe convertir la carga de contexto en una respuesta automática;
- no debe usar lectura de contexto como sustituto de trabajo real.

Regla práctica:

- si la tarea ya está en curso, el agente continúa desde el estado actual;
- si necesita contexto, lo carga en silencio y sigue trabajando;
- el usuario solo debe ver ejecución, validación y reporte, no un arranque
  repetitivo.

## 7. Protocolo de Verificación de Subidas y Cierre de Tarea

### 7.1 Honestidad en las subidas (regla base)

Antes de informar que un cambio fue subido a GitHub o desplegado en Hugging
Face, el agente DEBE:

1. Ejecutar el comando real (`git push`, `docker push`, etc.) y esperar la
   respuesta del terminal.
2. Leer la salida completa del comando.
3. Solo si la salida confirma éxito (sin errores), informar:
   "✅ Subido correctamente a [destino]."
4. Si el comando falla o no se ejecutó, informar inmediatamente:
   "⚠️ No se pudo subir. Motivo: [error exacto del terminal]."

⛔ PROHIBIDO reportar una subida como exitosa sin haber ejecutado y leído la
   salida del comando en esta misma sesión.
⛔ PROHIBIDO asumir que algo fue subido porque "debería funcionar".
⛔ Si hay duda, decir "No lo subí aún" es siempre la respuesta correcta.
   Mentir sobre esto rompe la confianza del proyecto.

Este protocolo existe porque la confiabilidad del agente depende de que el
usuario pueda creer lo que se le reporta. Un reporte falso, aunque sea
involuntario, invalida todo el trabajo de la sesión.

### 7.2 Intención de cierre / subida

El usuario rara vez usará una palabra fija. El agente debe reconocer la
INTENCIÓN de "cerrar y subir la tarea" en cualquier frase que la exprese,
no solo en una palabra exacta.

Cuentan como orden de subida, entre otras:
  "subelo", "subí esto", "dale subí", "mandalo", "publicá", "ya commiteá",
  "guardá los cambios", "que quede en git", "hacé el push", "subí y commiteá",
  "cerrá la tarea", "dejalo subido", etc.

El criterio es el sentido, no la coincidencia literal: si el usuario está
pidiendo que el trabajo recién reportado quede commiteado y subido, esa es la
orden, y el agente ejecuta la secuencia completa de la sección 7.4.

Si la frase es AMBIGUA, el agente hace UNA pregunta corta de confirmación
antes de subir, nunca asume. Ejemplo:
"¿Querés que lo suba ahora (commit + push)?"

⛔ Distinguir cierre de continuación: "seguí", "ahora hacé X", "y también..."
   NO son órdenes de subida; son nuevas tareas.

### 7.3 Mapa de repos y destinos

La secuencia de subida depende del repo donde se hizo el trabajo. El agente
identifica el repo ANTES de subir y usa los destinos correctos. Nunca mezcla
la trazabilidad de un repo con la del otro.

| Repo            | Trazabilidad (changelog + memoria)              | Remotos del push          |
|-----------------|-------------------------------------------------|---------------------------|
| `Kingdoom-sync` | `AI_CHANGELOG.md` + `kingdoom-memory.jsonl` de `Kingdoom-sync` | GitHub (`origin`) |
| `kingdoom-bot`  | `AI_CHANGELOG.md` + memoria propios de `kingdoom-bot`          | GitHub + Hugging Face |

⛔ Si la tarea fue en `kingdoom-bot`, NO se toca el changelog ni la memoria de
   `Kingdoom-sync`, y viceversa. Cada repo lleva su propio historial.
⛔ Si el agente no tiene certeza de cuáles son los remotos de un repo, ejecuta
   `git -C [ruta] remote -v` y los lee antes de empujar. No inventa destinos.

### 7.4 Secuencia de cierre completa

Ante una orden de subida clara (sección 7.2), el agente ejecuta esta secuencia
en este orden exacto, sin pedir confirmación adicional, sobre el repo correcto:

1. Actualizar el `AI_CHANGELOG.md` del repo correspondiente con la entrada del
   cambio, incluyendo los riesgos abiertos declarados en el reporte, y firmar
   con el nombre del agente.
2. Actualizar el archivo de memoria del repo correspondiente.
3. `git add` SOLO de los archivos de la tarea + los dos de trazabilidad.
   Nunca `git add .` a ciegas.
4. `git commit` con mensaje claro y firma de agente.
5. `git push` a TODOS los remotos que correspondan al repo (ver tabla 7.3).
6. Mostrar la salida REAL de cada push. No reportar éxito sin ver el OK del
   terminal (regla 7.1).
7. Reporte final formato Sección 8 con los comandos y sus salidas reales.

⛔ Una orden de subida SIEMPRE incluye changelog + memoria + commit + push.
   Nunca es solo el push.
⛔ El changelog y la memoria van en el MISMO commit que el código, para que el
   historial quede atómico (código + su registro juntos).
⛔ Si algún paso falla (ej: push rechazado), el agente DETIENE la secuencia,
   reporta el error exacto, y NO continúa como si hubiera funcionado.

### 7.5 Nota sobre agentes asíncronos (Jules)

Jules trabaja de forma asíncrona en una VM en la nube (no en la máquina local
del usuario). Aunque pushea directo a `main` como el resto, aplican estas
aclaraciones:

- El bootstrap (Sección 6) lo hace al clonar el repo en su VM: lee
  `AI_CHANGELOG.md`, el último relevo y la memoria ANTES de ejecutar la tarea.
  No hay sesión interactiva, pero el contexto se carga igual.
- La verificación de push (Sección 7.1) aplica sin excepción: Jules confirma
  el resultado real del push leyendo la salida de su entorno, nunca asume.
- Como Jules corre sin supervisión en vivo, la disciplina de alcance
  (Sección 14) es CRÍTICA: ejecuta solo la tarea asignada y no toca nada fuera
  de ella, porque el usuario no está mirando en tiempo real para frenarlo.
- Firma sus entradas de changelog, memoria y commits como `[Jules]`
  (Sección 16).

## 8. Protocolo de Reportes (Report Discipline)

Cada reporte entregado al usuario es un documento cerrado. Una vez entregado,
no debe repetirse en solicitudes posteriores.

### Reglas estrictas

1. Cada mensaje del usuario genera exactamente UN reporte nuevo,
   correspondiente SOLO a lo que se pidió en ese mensaje.
2. Si el usuario pide un reporte sobre la tarea B, el reporte de la tarea A ya
   fue entregado y NO debe incluirse de nuevo, ni como resumen, ni como
   contexto, ni como referencia.
3. El reporte debe comenzar directamente con el resultado de lo solicitado. No
   repetir lo que el usuario pidió, no resumir la conversación anterior, no
   incluir introducciones largas.
4. Formato obligatorio de reporte:
   ---
   [REPORTE] Tarea: [nombre corto de la tarea]

   Archivos modificados:
     - [archivo 1] — [qué se cambió]
     - [archivo 2] — [qué se cambió]

   Cambios realizados:
     [descripción concisa de lo que se hizo y por qué]

   Comandos ejecutados:
     $ [comando 1] → [resultado o salida relevante]
     $ [comando 2] → [resultado o salida relevante]

   Advertencias / Riesgos detectados:
     ⚠️ [descripción del riesgo o advertencia, si existe]
     — Si no hay ninguno, escribir: "Ninguno detectado."

   Estado: ✅ Completado / ⚠️ Incompleto / ❌ Error
   Próximo paso sugerido: [solo si aplica, máximo 1 línea]
   ---
⛔ PROHIBIDO incluir en un reporte nuevo cualquier contenido de reportes
   anteriores de la misma sesión.
⛔ PROHIBIDO repetir el enunciado de la tarea como si fuera parte del reporte.
⛔ PROHIBIDO entregar reportes acumulativos no solicitados.

## 9. Protocolo Anti-Pereza: Ejecución Completa

PRINCIPIO: una tarea está "hecha" cuando funciona y está verificada, no cuando
el código está escrito. El agente NUNCA entrega a medias.

PROHIBIDO ABSOLUTAMENTE:
- Dejar TODOs, placeholders, "// resto igual", "// implementar después" o
  funciones vacías en código que se reporta como terminado.
- Usar "// ... (sin cambios)" al editar: se escribe el archivo completo o se
  usa edición quirúrgica real, nunca un resumen del código.
- Entregar una feature sin su manejo de errores, estados de carga y vacíos.
- Responder "deberías hacer X" cuando la tarea era que el agente hiciera X.
- Detenerse en el primer error sin intentar diagnóstico y solución.
- Decir "esto debería funcionar" sin haberlo ejecutado.

OBLIGATORIO:
- Si la tarea tiene N subtareas, se completan las N o se reporta explícitamente
  cuáles quedaron y por qué (bloqueo real, no pereza).
- Si una solución requiere tocar 3 archivos, se tocan los 3 en la misma
  entrega, no "el primero y te aviso".
- Ante un error, se lee el mensaje completo, se diagnostica la causa raíz y se
  corrige. Recién si tras intentos reales no se resuelve, se escala al usuario
  con el detalle de lo intentado.
- Cada función nueva incluye su tipado completo (nada de `any` salvo
  justificación escrita).

## 10. Protocolo de Verificación Previa

PRINCIPIO: el agente no asume. Lee el código real antes de modificarlo.

ANTES DE EDITAR cualquier archivo:
- Leer el archivo objetivo completo (o las secciones relevantes con `rg`).
- Verificar imports, tipos y dependencias reales que usa.
- Confirmar que la función/componente que se va a tocar existe y hace lo que
  se cree.

ANTES DE USAR una librería, hook, util o componente:
- Confirmar que ya existe en el proyecto (buscar con `rg`) antes de reimplementarlo.
- Confirmar que la versión instalada soporta la API que se va a usar (leer
  package.json, no asumir la última versión).

ANTES DE CREAR un archivo nuevo:
- Verificar que no exista ya uno equivalente.
- Confirmar la convención de nombres y carpeta correcta del proyecto.

PROHIBIDO:
- Inventar nombres de funciones, props, columnas de Supabase o endpoints.
- Asumir la estructura de una tabla sin haberla consultado.
- Asumir que un patrón de otro proyecto aplica acá.

## 11. Protocolo de Calidad de Código

ESTÁNDAR INNEGOCIABLE para todo código entregado:

TypeScript:
- Tipado estricto. `any` solo con comentario que justifique por qué.
- Sin variables/imports sin usar.
- `npx tsc --noEmit` debe pasar limpio antes de reportar.

React:
- Componentes funcionales con hooks. Sin lógica duplicada: extraer a hooks o
  utils si se repite.
- Manejo explícito de los tres estados: cargando, error, vacío.
- Keys estables en listas (nunca el índice si la lista muta).
- Sin efectos sin cleanup cuando corresponde.

Estilo:
- Tailwind v4 según la convención existente del proyecto.
- Dark-mode primero, mobile-first.
- Touch targets ≥ 46px.

Antes de reportar un cambio funcional o de UI:
- `npx tsc --noEmit` limpio.
- `npm run build` exitoso.
- Salida real de ambos comandos incluida en el reporte (Sección 8).

CONSISTENCIA: el agente imita el estilo del código existente del proyecto
(naming, estructura, patrones). No impone su propio estilo.

## 12. Protocolo de Seguridad: Economía y Supabase

PRINCIPIO: el oro y el estado persistente son sagrados. Un bug acá corrompe
datos reales de usuarios.

TODA operación que toque oro, mercado, forja, minijuegos o cualquier tabla de
Supabase con saldos exige:
- Inspección estricta de doble crédito / doble débito: rastrear cada ruta que
  suma o resta para garantizar que no se ejecute dos veces.
- Atomicidad: la operación se completa entera o no deja rastro (sin estados
  intermedios corruptos).
- Validación de que el saldo nunca queda negativo salvo diseño explícito.
- Verificación de condiciones de carrera en operaciones concurrentes.

PROHIBIDO:
- Modificar lógica económica "a ojo" sin rastrear el flujo completo.
- Borrar o alterar columnas/tablas sin confirmar el impacto.
- Operaciones destructivas en Supabase sin advertencia explícita previa al
  usuario y confirmación.

Todo cambio económico se documenta con detalle especial en `AI_CHANGELOG.md`
describiendo exactamente qué flujo se tocó.

## 13. Protocolo de Continuidad entre Sesiones

PRINCIPIO: cualquier agente debe poder retomar el trabajo leyendo solo la
documentación, sin contexto previo.

AL CERRAR una sesión de trabajo significativa, el agente deja un relevo que
incluye:
- Qué se hizo (resumen de una línea por cambio).
- Estado actual: qué quedó funcionando, qué quedó a medias.
- Próximos pasos concretos si los hay.
- Riesgos abiertos o decisiones pendientes.

FUENTE ÚNICA DE VERDAD:
- `AI_CHANGELOG.md`: historial legible por humanos.
- `kingdoom-memory.jsonl`: estado estructurado para agentes.
- Ambos se actualizan ANTES del commit, nunca después ni "más tarde".

PROHIBIDO:
- Dejar el repo en estado inconsistente entre código y documentación.
- Asumir que el próximo agente "ya sabe" algo que no está escrito.

## 14. Protocolo de Alcance y Foco

PRINCIPIO: el agente hace lo que se le pide, completo, y nada más.

- Trabajar SOLO dentro de la tarea solicitada. No refactorizar código ajeno a
  la tarea "de paso".
- Si el agente detecta un problema fuera del alcance, lo REPORTA al final del
  reporte (sección de riesgos), no lo arregla por su cuenta.
- No cambiar dependencias, configuración de build, ni versiones sin pedido
  explícito.
- Trabajar exclusivamente en `Kingdoom-sync`. Priorizar web sobre apps/mobile
  (en hold salvo pedido explícito).
- Stagear solo archivos relevantes a la tarea. Nunca `git add .` a ciegas.
- Nunca crear ni commitear `package-lock.json`.

ANTE LA DUDA sobre el alcance: preguntar antes de actuar, una sola pregunta
concreta, no un cuestionario.

## 15. Protocolo de Comunicación con el Usuario

- Español, directo, sin relleno ni disculpas innecesarias.
- Nada de "¡Claro! Con gusto te ayudo a..." antes de cada respuesta.
- Si algo salió mal, se dice claro y primero, no enterrado al final.
- No prometer trabajo futuro ("luego puedo...") como sustituto de hacer el
  trabajo ahora.
- Honestidad sobre incertidumbre: si el agente no verificó algo, lo dice. No
  presenta suposiciones como hechos.
- Reportes según el formato fijo de la Sección 8, siempre.

## 16. Identificación de Agente

Como en este repo trabajan varios agentes de IA, cada uno debe identificarse
para que el historial sea trazable:

- En cada entrada de `AI_CHANGELOG.md` y cada relevo, el agente firma con su
  nombre (ej: `[Antigravity]`, `[Codex]`, `[Claude]`).
- En el cuerpo del commit, incluir una línea con el agente responsable.
- Si un agente retoma trabajo dejado por otro, lo menciona en el relevo para
  que quede claro el traspaso.

Esto evita confusión sobre quién hizo qué y facilita el handoff entre IAs
distintas.
