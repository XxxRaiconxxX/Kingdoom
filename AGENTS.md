# Kingdoom Sync Agent Context

Este archivo es la guÃƒÆ’Ã‚Â­a local de comportamiento para **cualquier agente de IA**
que trabaje en este repositorio (Claude, Codex, Antigravity, Jules, u otros).

Todas las reglas de este documento aplican por igual a todo agente, sin
excepciÃƒÆ’Ã‚Â³n. Cuando una regla dice "el agente", se refiere a quien sea que estÃƒÆ’Ã‚Â©
trabajando en ese momento. NingÃƒÆ’Ã‚Âºn agente estÃƒÆ’Ã‚Â¡ exento de una regla por no
llamarse de cierta forma.

## 0. Roles y DivisiÃƒÆ’Ã‚Â³n de Trabajo

No hay dominios exclusivos por nombre de agente: cualquier agente puede tocar
frontend, estilos, lÃƒÆ’Ã‚Â³gica o base de datos segÃƒÆ’Ã‚Âºn la tarea que se le asigne.
La divisiÃƒÆ’Ã‚Â³n es **por tarea, no por agente**.

- **Dominio web/frontend (este repo, `Kingdoom-sync`):** SPA en React, UI,
  estado, componentes, integraciÃƒÆ’Ã‚Â³n con Supabase desde el cliente, minijuegos
  de la Taberna, paneles de jugador y admin. Cualquier agente puede trabajar
  acÃƒÆ’Ã‚Â¡ cuando se le asigne.
- **Dominio bot/backend (otro repo, `kingdoom-bot`):** fuera del alcance de
  este archivo salvo que se indique. No se toca desde acÃƒÆ’Ã‚Â¡.

REGLA DE CARRIL: el agente trabaja en la tarea que se le pidiÃƒÆ’Ã‚Â³ y en el repo
correspondiente (`Kingdoom-sync`). No cruza al repo del bot ni asume tareas
de otra sesiÃƒÆ’Ã‚Â³n salvo pedido explÃƒÆ’Ã‚Â­cito.

## Project Overview

Kingdoom Sync es el cliente web React y panel de administraciÃƒÆ’Ã‚Â³n de la economÃƒÆ’Ã‚Â­a
del juego Kingdoom. EstÃƒÆ’Ã‚Â¡ construido con React, Vite, TypeScript y Tailwind
CSS / CSS vanilla, comunicÃƒÆ’Ã‚Â¡ndose directamente con la base de datos Supabase.

## Repository Architecture

- `src/App.tsx`: Entry point del dashboard, ruteo y estructura de layout.
- `src/index.css`: Sistema de diseÃƒÆ’Ã‚Â±o central, Tailwind y CSS custom.
- `src/types.ts`: Definiciones TypeScript compartidas (players, items,
  auctions, etc.).
- `src/components/`: UI modular, acciones modales y pestaÃƒÆ’Ã‚Â±as:
  - `PlayerProfilePanel.tsx` y `PlayerInventorySheet.tsx`: Progreso del
    jugador, pestaÃƒÆ’Ã‚Â±as de inventario (inventario/crÃƒÆ’Ã‚Â©ditos) y controles de sheet.
  - `PlayerAuctionPanel.tsx`: Interfaz del jugador para participar en
    subastas (pujar / ver estado).
  - `PayInstallmentModal.tsx` y `PurchaseModal.tsx`: Modales de compra
    (contado o cuotas) y pago de deudas.
  - `AppLiveHuntSection.tsx`: Interfaz de cacerÃƒÆ’Ã‚Â­as grupales en vivo.
  - `RealmStockExchange.tsx`: Interfaz de la bolsa de valores del Reino.
  - `Tavern*.tsx` (`TavernPlinko.tsx`, `TavernSlots.tsx`, `TavernCrash.tsx`,
    `TavernPenalty.tsx`, `TavernTowerDefense.tsx`, `TavernExpedition.tsx`,
    `TavernExpeditionArcade.tsx`, `TavernCards.tsx`, `TavernRoulette.tsx`,
    `TavernScratch.tsx`, `TavernHorseRace.tsx`, etc.): Minijuegos interactivos.
  - `admin/`: Controles de administraciÃƒÆ’Ã‚Â³n:
    - `AdminControlSheet.tsx`: Interfaz admin con pestaÃƒÆ’Ã‚Â±as categorizadas.
    - `AdminAuctionManager.tsx`: GestiÃƒÆ’Ã‚Â³n de subastas activas/pendientes y
      precios base.
    - `AdminMissionManager.tsx`: GestiÃƒÆ’Ã‚Â³n de misiones.
    - `AdminControlPrimitives.tsx`: Widgets de input admin compartidos.
    - `AdminKnowledgeManager.tsx`: GestiÃƒÆ’Ã‚Â³n de documentos de grimorio/conocimiento.
    - `AdminStaffAssistant.tsx`: Interfaz de asistente IA para staff y moderadores.
- `supabase/*.sql`: Esquemas de BD, polÃƒÆ’Ã‚Â­ticas RLS y procedimientos RPC.

## Project Guardrails

- **Directorio de trabajo:** Trabajar solo dentro del workspace actual:
  `c:\Users\e_grado\Documents\New project 2\Kingdoom-sync`.
- **Consistencia:** Mantener las variables de estilo existentes (gradientes,
  diseÃƒÆ’Ã‚Â±os de tarjetas, sistema de layout).
- **Disciplina de Git:** Stagear solo archivos directamente relacionados con
  la tarea activa. No editar archivos no relacionados.
- **Dependencias:** No crear, modificar ni commitear `package-lock.json`.
- **Plataforma objetivo:** Priorizar la vista web de escritorio/responsiva.
  Los wrappers de app mÃƒÆ’Ã‚Â³vil son secundarios.
- **Changelog:** Documentar toda modificaciÃƒÆ’Ã‚Â³n funcional, de UI, de BD o
  arquitectÃƒÆ’Ã‚Â³nica en `AI_CHANGELOG.md`.

## 1. Reglas de Negocio y LÃƒÆ’Ã‚Â³gica de la EconomÃƒÆ’Ã‚Â­a

### MecÃƒÆ’Ã‚Â¡nica de Subastas
- **ComisiÃƒÆ’Ã‚Â³n de entrada:** Se cobra una comisiÃƒÆ’Ã‚Â³n ÃƒÆ’Ã‚Âºnica no reembolsable del 25%
  del precio base (`start_price`) del ÃƒÆ’Ã‚Â­tem al unirse a la subasta.
- **Modelo Lock-and-Release:** El oro ofertado por los jugadores no se descuenta
  definitivamente durante las pujas. Se bloquea en la subasta y, al finalizar,
  se devuelve automÃƒÆ’Ã‚Â¡ticamente a todos los participantes excepto al ganador, a
  quien sÃƒÆ’Ã‚Â­ se le cobra el monto total de su ÃƒÆ’Ã‚Âºltima puja.
- **Pujas Acumulativas:** El monto que el jugador puja se suma a la puja
  acumulada global (ej: si la puja acumulada estÃƒÆ’Ã‚Â¡ en 100,000 y el jugador puja
  5,000, la nueva puja acumulada es 105,000). El jugador que no tenga oro
  suficiente para cubrir el nuevo total acumulado queda descalificado.

### Sistema de Compra a Cuotas (Installments)
- **Cuotas e Intereses:** El jugador puede comprar objetos del mercado en 3
  cuotas (con un 10% de recargo sobre el valor base) o 6 cuotas (con un 18% de
  recargo). Las pociones y consumibles no permiten financiaciÃƒÆ’Ã‚Â³n.
- **Bloqueo de Inventario (Locking):** Mientras el plan de pago estÃƒÆ’Ã‚Â© activo, el
  ÃƒÆ’Ã‚Â­tem en `player_inventory` tendrÃƒÆ’Ã‚Â¡ `is_locked = true` y no podrÃƒÆ’Ã‚Â¡ utilizarse,
  equiparse ni transferirse. Al saldar la deuda, se desbloquea (`is_locked = false`).
- **PolÃƒÆ’Ã‚Â­tica de Morosidad:** Si un jugador tiene algÃƒÆ’Ã‚Âºn plan de pago en mora
  (`status = 'defaulted'`) en los ÃƒÆ’Ã‚Âºltimos 14 dÃƒÆ’Ã‚Â­as, el sistema le denegarÃƒÆ’Ã‚Â¡
  cualquier nueva compra a plazos.

## 2. Estructura de la Base de Datos y Supabase (RPCs)

### Tablas Principales
- `players`: Perfil del jugador, contiene `gold`, `phone`, `is_admin`, `banned`.
- `character_sheets`: Ficha de rol del jugador. Usa la columna `playerId`
  (notar la I mayÃƒÆ’Ã‚Âºscula en camelCase).
- `player_inventory`: Inventario real de objetos del mercado. Usa la columna
  `player_id` (notar snake_case), lee por `item_name` y contiene `is_locked`
  para artÃƒÆ’Ã‚Â­culos financiados.
- `payment_plans`: Registro de planes de financiaciÃƒÆ’Ã‚Â³n, cuotas pagadas, dÃƒÆ’Ã‚Â­as de
  mora y estado del crÃƒÆ’Ã‚Â©dito.
- `knowledge_documents`: Almacena documentos de lore, bestiario, flora y grimorio.
- `market_auctions`: Registro de subastas activas (`active`, `completed`,
  `cancelled`).
- `market_auction_bids`: Historial de pujas realizadas por subasta.

### RPCs Clave
- `place_auction_bid(p_player_id, p_auction_id, p_amount)`: RPC que encapsula el
  cobro de la comisiÃƒÆ’Ã‚Â³n de entrada, las validaciones de saldo y el incremento
  acumulado del bot de WhatsApp y la web de forma unificada.
- `purchase_market_item_v2(p_player_id, p_item_id, p_installments)`: RPC
  transaccional que procesa compras de mercado al contado o financiadas,
  validando el saldo, la morosidad y aplicando el bloqueo `is_locked`.
- `resolve_market_auction(p_auction_id)`: RPC que finaliza una subasta,
  transfiere el ÃƒÆ’Ã‚Â­tem al ganador, cobra la puja y devuelve el oro bloqueado al
  resto de los postores.

## 3. Playbooks (GuÃƒÆ’Ã‚Â­as RÃƒÆ’Ã‚Â¡pidas)

### AÃƒÆ’Ã‚Â±adir o Modificar Minijuegos (Tavern)
1. Crea el componente en `src/components/Tavern[Nombre].tsx`.
2. Utiliza los hooks de base de datos o API locales en `src/hooks/` o
   `src/lib/` para sincronizar el saldo de oro con Supabase.
3. AgrÃƒÆ’Ã‚Â©galo al enum de pestaÃƒÆ’Ã‚Â±as y al render condicional en `src/App.tsx`.

### Compras y FinanciaciÃƒÆ’Ã‚Â³n en el Mercado
1. El usuario interactÃƒÆ’Ã‚Âºa mediante `PurchaseModal` para elegir el mÃƒÆ’Ã‚Â©todo de pago
   (al contado, 3 cuotas o 6 cuotas).
2. Se consume `purchase_market_item_v2` en Supabase. Si es financiado, el ÃƒÆ’Ã‚Â­tem
   ingresa a `player_inventory` con `is_locked = true`.
3. El estado de la deuda y los pagos se administran desde `PayInstallmentModal`
   y la pestaÃƒÆ’Ã‚Â±a de crÃƒÆ’Ã‚Â©ditos en `PlayerInventorySheet.tsx`.

### Editar el Panel de Subastas (Player / Admin)
- Modifica `PlayerAuctionPanel.tsx` para vistas del jugador (ingreso de
  incrementos de pujas) y `AdminAuctionManager.tsx` para la gestiÃƒÆ’Ã‚Â³n de
  administradores (iniciar subastas, definir incrementos mÃƒÆ’Ã‚Â­nimos).

## 4. Convenciones de UI y Estilo Visual

- **DiseÃƒÆ’Ã‚Â±o Premium:** Utilizar gradientes vibrantes, bordes finos
  semi-transparentes y esquinas redondeadas.
- **TipografÃƒÆ’Ã‚Â­a:** Usar fuentes limpias tipo Outfit o Inter para legibilidad ÃƒÆ’Ã‚Â³ptima.
- **Responsividad:** Asegurar que todos los formularios, modales y paneles
  tengan clases de Tailwind para mÃƒÆ’Ã‚Â³viles (`sm:`, `md:`) sin romper escritorio.
- **Foco Accesible TemÃƒÆ’Ã‚Â¡tico:** Foco global `:focus-visible` condicionado al
  color de acento de la secciÃƒÆ’Ã‚Â³n (ÃƒÆ’Ã‚Â¡mbar en mercado, violeta en grimorio, etc.)
  visible solo al usar teclado.
- **OptimizaciÃƒÆ’Ã‚Â³n de Scroll y Layout:**
  - Evitar saltos de scrollbar aplicando `scrollbar-gutter: stable` en `html`.
  - Configurar `overscroll-behavior: contain` en paneles con scroll interno
    (modales, hojas de admin) para evitar el arrastre del scroll de la pÃƒÆ’Ã‚Â¡gina base.
- **NÃƒÆ’Ã‚Âºmeros y TÃƒÆ’Ã‚Â­tulos:**
  - `text-wrap: balance` para distribuciÃƒÆ’Ã‚Â³n equilibrada de tÃƒÆ’Ã‚Â­tulos multilÃƒÆ’Ã‚Â­nea.
  - `font-variant-numeric: tabular-nums` para que los nÃƒÆ’Ã‚Âºmeros en contadores y
    estadÃƒÆ’Ã‚Â­sticas mantengan anchos fijos y no vibren al cambiar.
- **Fluidez TÃƒÆ’Ã‚Â¡ctil:** `-webkit-tap-highlight-color: transparent` y
  `overscroll-behavior-y: contain` en el body para experiencia tipo app nativa.

## 5. ValidaciÃƒÆ’Ã‚Â³n y VerificaciÃƒÆ’Ã‚Â³n

- Ejecutar `npx tsc --noEmit` y `npm run build` para verificar que el cÃƒÆ’Ã‚Â³digo
  TypeScript compila correctamente y no introduce errores de tipado.
- Para pequeÃƒÆ’Ã‚Â±os cambios de texto o documentaciÃƒÆ’Ã‚Â³n, indicar brevemente en el
  reporte por quÃƒÆ’Ã‚Â© se omitiÃƒÆ’Ã‚Â³ el build de compilaciÃƒÆ’Ã‚Â³n.
- Verificar siempre que los estados de carga ("loading") y de error estÃƒÆ’Ã‚Â©n
  controlados en cada llamada a Supabase.

## 6. Regla de Contexto y Continuidad

No existe bootstrap obligatorio en este repositorio.

El agente puede consultar `AI_CHANGELOG.md`, relevo reciente o memoria cuando
eso ayude a ejecutar mejor la tarea, pero:

- no debe anunciar "Contexto cargado" como ritual fijo;
- no debe reiniciar una tarea por volver a leer contexto;
- no debe convertir la carga de contexto en una respuesta automÃƒÆ’Ã‚Â¡tica;
- no debe usar lectura de contexto como sustituto de trabajo real.

Regla prÃƒÆ’Ã‚Â¡ctica:

- si la tarea ya estÃƒÆ’Ã‚Â¡ en curso, el agente continÃƒÆ’Ã‚Âºa desde el estado actual;
- si necesita contexto, lo carga en silencio y sigue trabajando;
- el usuario solo debe ver ejecuciÃƒÆ’Ã‚Â³n, validaciÃƒÆ’Ã‚Â³n y reporte, no un arranque
  repetitivo.

## 7. Protocolo de VerificaciÃƒÆ’Ã‚Â³n de Subidas y Cierre de Tarea

### 7.1 Honestidad en las subidas (regla base)

Antes de informar que un cambio fue subido a GitHub o desplegado en Hugging
Face, el agente DEBE:

1. Ejecutar el comando real (`git push`, `docker push`, etc.) y esperar la
   respuesta del terminal.
2. Leer la salida completa del comando.
3. Solo si la salida confirma ÃƒÆ’Ã‚Â©xito (sin errores), informar:
   "ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Subido correctamente a [destino]."
4. Si el comando falla o no se ejecutÃƒÆ’Ã‚Â³, informar inmediatamente:
   "ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â No se pudo subir. Motivo: [error exacto del terminal]."

ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â PROHIBIDO reportar una subida como exitosa sin haber ejecutado y leÃƒÆ’Ã‚Â­do la
   salida del comando en esta misma sesiÃƒÆ’Ã‚Â³n.
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â PROHIBIDO asumir que algo fue subido porque "deberÃƒÆ’Ã‚Â­a funcionar".
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Si hay duda, decir "No lo subÃƒÆ’Ã‚Â­ aÃƒÆ’Ã‚Âºn" es siempre la respuesta correcta.
   Mentir sobre esto rompe la confianza del proyecto.

Este protocolo existe porque la confiabilidad del agente depende de que el
usuario pueda creer lo que se le reporta. Un reporte falso, aunque sea
involuntario, invalida todo el trabajo de la sesiÃƒÆ’Ã‚Â³n.

### 7.2 IntenciÃƒÆ’Ã‚Â³n de cierre / subida

El usuario rara vez usarÃƒÆ’Ã‚Â¡ una palabra fija. El agente debe reconocer la
INTENCIÃƒÆ’Ã¢â‚¬Å“N de "cerrar y subir la tarea" en cualquier frase que la exprese,
no solo en una palabra exacta.

Cuentan como orden de subida, entre otras:
  "subelo", "subÃƒÆ’Ã‚Â­ esto", "dale subÃƒÆ’Ã‚Â­", "mandalo", "publicÃƒÆ’Ã‚Â¡", "ya commiteÃƒÆ’Ã‚Â¡",
  "guardÃƒÆ’Ã‚Â¡ los cambios", "que quede en git", "hacÃƒÆ’Ã‚Â© el push", "subÃƒÆ’Ã‚Â­ y commiteÃƒÆ’Ã‚Â¡",
  "cerrÃƒÆ’Ã‚Â¡ la tarea", "dejalo subido", etc.

El criterio es el sentido, no la coincidencia literal: si el usuario estÃƒÆ’Ã‚Â¡
pidiendo que el trabajo reciÃƒÆ’Ã‚Â©n reportado quede commiteado y subido, esa es la
orden, y el agente ejecuta la secuencia completa de la secciÃƒÆ’Ã‚Â³n 7.4.

Si la frase es AMBIGUA, el agente hace UNA pregunta corta de confirmaciÃƒÆ’Ã‚Â³n
antes de subir, nunca asume. Ejemplo:
"Ãƒâ€šÃ‚Â¿QuerÃƒÆ’Ã‚Â©s que lo suba ahora (commit + push)?"

ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Distinguir cierre de continuaciÃƒÆ’Ã‚Â³n: "seguÃƒÆ’Ã‚Â­", "ahora hacÃƒÆ’Ã‚Â© X", "y tambiÃƒÆ’Ã‚Â©n..."
   NO son ÃƒÆ’Ã‚Â³rdenes de subida; son nuevas tareas.

### 7.3 Mapa de repos y destinos

La secuencia de subida depende del repo donde se hizo el trabajo. El agente
identifica el repo ANTES de subir y usa los destinos correctos. Nunca mezcla
la trazabilidad de un repo con la del otro.

| Repo            | Trazabilidad (changelog + memoria)              | Remotos del push          |
|-----------------|-------------------------------------------------|---------------------------|
| `Kingdoom-sync` | `AI_CHANGELOG.md` + `kingdoom-memory.jsonl` de `Kingdoom-sync` | GitHub (`origin`) |
| `kingdoom-bot`  | `AI_CHANGELOG.md` + memoria propios de `kingdoom-bot`          | GitHub + Hugging Face |

ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Si la tarea fue en `kingdoom-bot`, NO se toca el changelog ni la memoria de
   `Kingdoom-sync`, y viceversa. Cada repo lleva su propio historial.
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Si el agente no tiene certeza de cuÃƒÆ’Ã‚Â¡les son los remotos de un repo, ejecuta
   `git -C [ruta] remote -v` y los lee antes de empujar. No inventa destinos.

### 7.4 Secuencia de cierre completa

Ante una orden de subida clara (secciÃƒÆ’Ã‚Â³n 7.2), el agente ejecuta esta secuencia
en este orden exacto, sin pedir confirmaciÃƒÆ’Ã‚Â³n adicional, sobre el repo correcto:

1. Actualizar el `AI_CHANGELOG.md` del repo correspondiente con la entrada del
   cambio, incluyendo los riesgos abiertos declarados en el reporte, y firmar
   con el nombre del agente.
2. Actualizar el archivo de memoria del repo correspondiente.
3. `git add` SOLO de los archivos de la tarea + los dos de trazabilidad.
   Nunca `git add .` a ciegas.
4. `git commit` con mensaje claro y firma de agente.
5. `git push` a TODOS los remotos que correspondan al repo (ver tabla 7.3).
6. Mostrar la salida REAL de cada push. No reportar ÃƒÆ’Ã‚Â©xito sin ver el OK del
   terminal (regla 7.1).
7. Reporte final formato SecciÃƒÆ’Ã‚Â³n 8 con los comandos y sus salidas reales.

ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Una orden de subida SIEMPRE incluye changelog + memoria + commit + push.
   Nunca es solo el push.
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â El changelog y la memoria van en el MISMO commit que el cÃƒÆ’Ã‚Â³digo, para que el
   historial quede atÃƒÆ’Ã‚Â³mico (cÃƒÆ’Ã‚Â³digo + su registro juntos).
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Si algÃƒÆ’Ã‚Âºn paso falla (ej: push rechazado), el agente DETIENE la secuencia,
   reporta el error exacto, y NO continÃƒÆ’Ã‚Âºa como si hubiera funcionado.

### 7.5 Nota sobre agentes asÃƒÆ’Ã‚Â­ncronos (Jules)

Jules trabaja de forma asÃƒÆ’Ã‚Â­ncrona en una VM en la nube (no en la mÃƒÆ’Ã‚Â¡quina local
del usuario). Aunque pushea directo a `main` como el resto, aplican estas
aclaraciones:

- El bootstrap (SecciÃƒÆ’Ã‚Â³n 6) lo hace al clonar el repo en su VM: lee
  `AI_CHANGELOG.md`, el ÃƒÆ’Ã‚Âºltimo relevo y la memoria ANTES de ejecutar la tarea.
  No hay sesiÃƒÆ’Ã‚Â³n interactiva, pero el contexto se carga igual.
- La verificaciÃƒÆ’Ã‚Â³n de push (SecciÃƒÆ’Ã‚Â³n 7.1) aplica sin excepciÃƒÆ’Ã‚Â³n: Jules confirma
  el resultado real del push leyendo la salida de su entorno, nunca asume.
- Como Jules corre sin supervisiÃƒÆ’Ã‚Â³n en vivo, la disciplina de alcance
  (SecciÃƒÆ’Ã‚Â³n 14) es CRÃƒÆ’Ã‚ÂTICA: ejecuta solo la tarea asignada y no toca nada fuera
  de ella, porque el usuario no estÃƒÆ’Ã‚Â¡ mirando en tiempo real para frenarlo.
- Firma sus entradas de changelog, memoria y commits como `[Jules]`
  (SecciÃƒÆ’Ã‚Â³n 16).

## 8. Protocolo de Reportes (Report Discipline)

Cada reporte entregado al usuario es un documento cerrado. Una vez entregado,
no debe repetirse en solicitudes posteriores.

### Reglas estrictas

1. Cada mensaje del usuario genera exactamente UN reporte nuevo,
   correspondiente SOLO a lo que se pidiÃƒÆ’Ã‚Â³ en ese mensaje.
2. Si el usuario pide un reporte sobre la tarea B, el reporte de la tarea A ya
   fue entregado y NO debe incluirse de nuevo, ni como resumen, ni como
   contexto, ni como referencia.
3. El reporte debe comenzar directamente con el resultado de lo solicitado. No
   repetir lo que el usuario pidiÃƒÆ’Ã‚Â³, no resumir la conversaciÃƒÆ’Ã‚Â³n anterior, no
   incluir introducciones largas.
4. Formato obligatorio de reporte:
   ---
   [REPORTE] Tarea: [nombre corto de la tarea]

   Archivos modificados:
     - [archivo 1] ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â [quÃƒÆ’Ã‚Â© se cambiÃƒÆ’Ã‚Â³]
     - [archivo 2] ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â [quÃƒÆ’Ã‚Â© se cambiÃƒÆ’Ã‚Â³]

   Cambios realizados:
     [descripciÃƒÆ’Ã‚Â³n concisa de lo que se hizo y por quÃƒÆ’Ã‚Â©]

   Comandos ejecutados:
     $ [comando 1] ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ [resultado o salida relevante]
     $ [comando 2] ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ [resultado o salida relevante]

   Advertencias / Riesgos detectados:
     ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â [descripciÃƒÆ’Ã‚Â³n del riesgo o advertencia, si existe]
     ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Si no hay ninguno, escribir: "Ninguno detectado."

   Estado: ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Completado / ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Incompleto / ÃƒÂ¢Ã‚ÂÃ…â€™ Error
   PrÃƒÆ’Ã‚Â³ximo paso sugerido: [solo si aplica, mÃƒÆ’Ã‚Â¡ximo 1 lÃƒÆ’Ã‚Â­nea]
   ---
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â PROHIBIDO incluir en un reporte nuevo cualquier contenido de reportes
   anteriores de la misma sesiÃƒÆ’Ã‚Â³n.
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â PROHIBIDO repetir el enunciado de la tarea como si fuera parte del reporte.
ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â PROHIBIDO entregar reportes acumulativos no solicitados.

## 9. Protocolo Anti-Pereza: EjecuciÃƒÆ’Ã‚Â³n Completa

PRINCIPIO: una tarea estÃƒÆ’Ã‚Â¡ "hecha" cuando funciona y estÃƒÆ’Ã‚Â¡ verificada, no cuando
el cÃƒÆ’Ã‚Â³digo estÃƒÆ’Ã‚Â¡ escrito. El agente NUNCA entrega a medias.

PROHIBIDO ABSOLUTAMENTE:
- Dejar TODOs, placeholders, "// resto igual", "// implementar despuÃƒÆ’Ã‚Â©s" o
  funciones vacÃƒÆ’Ã‚Â­as en cÃƒÆ’Ã‚Â³digo que se reporta como terminado.
- Usar "// ... (sin cambios)" al editar: se escribe el archivo completo o se
  usa ediciÃƒÆ’Ã‚Â³n quirÃƒÆ’Ã‚Âºrgica real, nunca un resumen del cÃƒÆ’Ã‚Â³digo.
- Entregar una feature sin su manejo de errores, estados de carga y vacÃƒÆ’Ã‚Â­os.
- Responder "deberÃƒÆ’Ã‚Â­as hacer X" cuando la tarea era que el agente hiciera X.
- Detenerse en el primer error sin intentar diagnÃƒÆ’Ã‚Â³stico y soluciÃƒÆ’Ã‚Â³n.
- Decir "esto deberÃƒÆ’Ã‚Â­a funcionar" sin haberlo ejecutado.

OBLIGATORIO:
- Si la tarea tiene N subtareas, se completan las N o se reporta explÃƒÆ’Ã‚Â­citamente
  cuÃƒÆ’Ã‚Â¡les quedaron y por quÃƒÆ’Ã‚Â© (bloqueo real, no pereza).
- Si una soluciÃƒÆ’Ã‚Â³n requiere tocar 3 archivos, se tocan los 3 en la misma
  entrega, no "el primero y te aviso".
- Ante un error, se lee el mensaje completo, se diagnostica la causa raÃƒÆ’Ã‚Â­z y se
  corrige. ReciÃƒÆ’Ã‚Â©n si tras intentos reales no se resuelve, se escala al usuario
  con el detalle de lo intentado.
- Cada funciÃƒÆ’Ã‚Â³n nueva incluye su tipado completo (nada de `any` salvo
  justificaciÃƒÆ’Ã‚Â³n escrita).

## 10. Protocolo de VerificaciÃƒÆ’Ã‚Â³n Previa

PRINCIPIO: el agente no asume. Lee el cÃƒÆ’Ã‚Â³digo real antes de modificarlo.

ANTES DE EDITAR cualquier archivo:
- Leer el archivo objetivo completo (o las secciones relevantes con `rg`).
- Verificar imports, tipos y dependencias reales que usa.
- Confirmar que la funciÃƒÆ’Ã‚Â³n/componente que se va a tocar existe y hace lo que
  se cree.

ANTES DE USAR una librerÃƒÆ’Ã‚Â­a, hook, util o componente:
- Confirmar que ya existe en el proyecto (buscar con `rg`) antes de reimplementarlo.
- Confirmar que la versiÃƒÆ’Ã‚Â³n instalada soporta la API que se va a usar (leer
  package.json, no asumir la ÃƒÆ’Ã‚Âºltima versiÃƒÆ’Ã‚Â³n).

ANTES DE CREAR un archivo nuevo:
- Verificar que no exista ya uno equivalente.
- Confirmar la convenciÃƒÆ’Ã‚Â³n de nombres y carpeta correcta del proyecto.

PROHIBIDO:
- Inventar nombres de funciones, props, columnas de Supabase o endpoints.
- Asumir la estructura de una tabla sin haberla consultado.
- Asumir que un patrÃƒÆ’Ã‚Â³n de otro proyecto aplica acÃƒÆ’Ã‚Â¡.

## 11. Protocolo de Calidad de CÃƒÆ’Ã‚Â³digo

ESTÃƒÆ’Ã‚ÂNDAR INNEGOCIABLE para todo cÃƒÆ’Ã‚Â³digo entregado:

TypeScript:
- Tipado estricto. `any` solo con comentario que justifique por quÃƒÆ’Ã‚Â©.
- Sin variables/imports sin usar.
- `npx tsc --noEmit` debe pasar limpio antes de reportar.

React:
- Componentes funcionales con hooks. Sin lÃƒÆ’Ã‚Â³gica duplicada: extraer a hooks o
  utils si se repite.
- Manejo explÃƒÆ’Ã‚Â­cito de los tres estados: cargando, error, vacÃƒÆ’Ã‚Â­o.
- Keys estables en listas (nunca el ÃƒÆ’Ã‚Â­ndice si la lista muta).
- Sin efectos sin cleanup cuando corresponde.

Estilo:
- Tailwind v4 segÃƒÆ’Ã‚Âºn la convenciÃƒÆ’Ã‚Â³n existente del proyecto.
- Dark-mode primero, mobile-first.
- Touch targets ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 46px.

Antes de reportar un cambio funcional o de UI:
- `npx tsc --noEmit` limpio.
- `npm run build` exitoso.
- Salida real de ambos comandos incluida en el reporte (SecciÃƒÆ’Ã‚Â³n 8).

CONSISTENCIA: el agente imita el estilo del cÃƒÆ’Ã‚Â³digo existente del proyecto
(naming, estructura, patrones). No impone su propio estilo.

## 12. Protocolo de Seguridad: EconomÃƒÆ’Ã‚Â­a y Supabase

PRINCIPIO: el oro y el estado persistente son sagrados. Un bug acÃƒÆ’Ã‚Â¡ corrompe
datos reales de usuarios.

TODA operaciÃƒÆ’Ã‚Â³n que toque oro, mercado, forja, minijuegos o cualquier tabla de
Supabase con saldos exige:
- InspecciÃƒÆ’Ã‚Â³n estricta de doble crÃƒÆ’Ã‚Â©dito / doble dÃƒÆ’Ã‚Â©bito: rastrear cada ruta que
  suma o resta para garantizar que no se ejecute dos veces.
- Atomicidad: la operaciÃƒÆ’Ã‚Â³n se completa entera o no deja rastro (sin estados
  intermedios corruptos).
- ValidaciÃƒÆ’Ã‚Â³n de que el saldo nunca queda negativo salvo diseÃƒÆ’Ã‚Â±o explÃƒÆ’Ã‚Â­cito.
- VerificaciÃƒÆ’Ã‚Â³n de condiciones de carrera en operaciones concurrentes.

PROHIBIDO:
- Modificar lÃƒÆ’Ã‚Â³gica econÃƒÆ’Ã‚Â³mica "a ojo" sin rastrear el flujo completo.
- Borrar o alterar columnas/tablas sin confirmar el impacto.
- Operaciones destructivas en Supabase sin advertencia explÃƒÆ’Ã‚Â­cita previa al
  usuario y confirmaciÃƒÆ’Ã‚Â³n.

Todo cambio econÃƒÆ’Ã‚Â³mico se documenta con detalle especial en `AI_CHANGELOG.md`
describiendo exactamente quÃƒÆ’Ã‚Â© flujo se tocÃƒÆ’Ã‚Â³.

## 13. Protocolo de Continuidad entre Sesiones

PRINCIPIO: cualquier agente debe poder retomar el trabajo leyendo solo la
documentaciÃƒÆ’Ã‚Â³n, sin contexto previo.

AL CERRAR una sesiÃƒÆ’Ã‚Â³n de trabajo significativa, el agente deja un relevo que
incluye:
- QuÃƒÆ’Ã‚Â© se hizo (resumen de una lÃƒÆ’Ã‚Â­nea por cambio).
- Estado actual: quÃƒÆ’Ã‚Â© quedÃƒÆ’Ã‚Â³ funcionando, quÃƒÆ’Ã‚Â© quedÃƒÆ’Ã‚Â³ a medias.
- PrÃƒÆ’Ã‚Â³ximos pasos concretos si los hay.
- Riesgos abiertos o decisiones pendientes.

FUENTE ÃƒÆ’Ã…Â¡NICA DE VERDAD:
- `AI_CHANGELOG.md`: historial legible por humanos.
- `kingdoom-memory.jsonl`: estado estructurado para agentes.
- Ambos se actualizan ANTES del commit, nunca despuÃƒÆ’Ã‚Â©s ni "mÃƒÆ’Ã‚Â¡s tarde".

PROHIBIDO:
- Dejar el repo en estado inconsistente entre cÃƒÆ’Ã‚Â³digo y documentaciÃƒÆ’Ã‚Â³n.
- Asumir que el prÃƒÆ’Ã‚Â³ximo agente "ya sabe" algo que no estÃƒÆ’Ã‚Â¡ escrito.

## 14. Protocolo de Alcance y Foco

PRINCIPIO: el agente hace lo que se le pide, completo, y nada mÃƒÆ’Ã‚Â¡s.

- Trabajar SOLO dentro de la tarea solicitada. No refactorizar cÃƒÆ’Ã‚Â³digo ajeno a
  la tarea "de paso".
- Si el agente detecta un problema fuera del alcance, lo REPORTA al final del
  reporte (secciÃƒÆ’Ã‚Â³n de riesgos), no lo arregla por su cuenta.
- No cambiar dependencias, configuraciÃƒÆ’Ã‚Â³n de build, ni versiones sin pedido
  explÃƒÆ’Ã‚Â­cito.
- Trabajar exclusivamente en `Kingdoom-sync`. Priorizar web sobre apps/mobile
  (en hold salvo pedido explÃƒÆ’Ã‚Â­cito).
- Stagear solo archivos relevantes a la tarea. Nunca `git add .` a ciegas.
- Nunca crear ni commitear `package-lock.json`.

ANTE LA DUDA sobre el alcance: preguntar antes de actuar, una sola pregunta
concreta, no un cuestionario.

## 15. Protocolo de ComunicaciÃƒÆ’Ã‚Â³n con el Usuario

- EspaÃƒÆ’Ã‚Â±ol, directo, sin relleno ni disculpas innecesarias.
- Nada de "Ãƒâ€šÃ‚Â¡Claro! Con gusto te ayudo a..." antes de cada respuesta.
- Si algo saliÃƒÆ’Ã‚Â³ mal, se dice claro y primero, no enterrado al final.
- No prometer trabajo futuro ("luego puedo...") como sustituto de hacer el
  trabajo ahora.
- Honestidad sobre incertidumbre: si el agente no verificÃƒÆ’Ã‚Â³ algo, lo dice. No
  presenta suposiciones como hechos.
- Reportes segÃƒÆ’Ã‚Âºn el formato fijo de la SecciÃƒÆ’Ã‚Â³n 8, siempre.

## 16. IdentificaciÃƒÆ’Ã‚Â³n de Agente

Como en este repo trabajan varios agentes de IA, cada uno debe identificarse
para que el historial sea trazable:

- En cada entrada de `AI_CHANGELOG.md` y cada relevo, el agente firma con su
  nombre (ej: `[Antigravity]`, `[Codex]`, `[Claude]`).
- En el cuerpo del commit, incluir una lÃƒÆ’Ã‚Â­nea con el agente responsable.
- Si un agente retoma trabajo dejado por otro, lo menciona en el relevo para
  que quede claro el traspaso.

Esto evita confusiÃƒÆ’Ã‚Â³n sobre quiÃƒÆ’Ã‚Â©n hizo quÃƒÆ’Ã‚Â© y facilita el handoff entre IAs
distintas.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Local operational paths:
- `graphify-out/` stays in the project root because Graphify, Codex, and Antigravity all look for `graphify-out/graph.json` there. It is local and ignored by Git.
- `.codex/hooks.json` is local and ignored by Git. Refresh it with `npm run graphify:setup`.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- Before modifying shared functions, utils, types, or schema-facing helpers, run `graphify affected "<symbol_or_file>"` to map regressions before editing.
- Use the global graph merge (`graphify global list` / `graphify global path`) to trace contracts that cross the boundary between `Kingdoom-sync`, `kingdoom-bot`, and `kingdoom-fichas`.
- For documenting complex transaction flows or state movement, prefer `graphify export callflow-html` or `graphify tree`.
- Run `npm run graphify:setup` once per clone or when hooks and local Graphify wiring need repair.
- Run `npm run graphify:update` after structural code changes that are still uncommitted, or before asking Graphify-heavy architecture questions during an active edit session.
- Run `npm run graphify:doctor` when another AI agent reports stale graph answers, missing hooks, or missing local Graphify state.
- Dirty `graphify-out/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip Graphify. Only skip Graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, prefer `npm run graphify:update` over raw CLI calls so Codex hooks and repo conventions stay aligned.
