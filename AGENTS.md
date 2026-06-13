# Kingdoom Sync Agent Context

Use this file as local guidance for Jules, Codex, Antigravity, and other AI coding agents working in this repository.

## Project Overview

Kingdoom Sync is the React web client and administration dashboard for the Kingdoom gaming economy. It is built with React, Vite, TypeScript, and Tailwind CSS/Vanilla CSS, communicating directly with the Supabase database.

## Repository Architecture

- `src/App.tsx`: Main dashboard entry point, routing, and layout structure.
- `src/index.css`: Central tailwind and custom CSS design system.
- `src/types.ts`: Shared TypeScript definitions for players, items, auctions, etc.
- `src/components/`: Modular UI sheets, modally-presented actions, and tabs:
  - `PlayerProfilePanel.tsx` & `PlayerInventorySheet.tsx`: Player progress, inventory tabs (inventory/credits), and sheet controls.
  - `PlayerAuctionPanel.tsx`: Player interface for participating in auctions (bidding/viewing status).
  - `PayInstallmentModal.tsx` & `PurchaseModal.tsx`: Interactive modals for item purchases (cash or installments) and debt payments.
  - `AppLiveHuntSection.tsx`: Interface for live group hunts.
  - `RealmStockExchange.tsx`: Interface for the Realm's stock market.
  - `Tavern*.tsx` (`TavernPlinko.tsx`, `TavernSlots.tsx`, `TavernCrash.tsx`, `TavernPenalty.tsx`, `TavernTowerDefense.tsx`, `TavernExpedition.tsx`, `TavernExpeditionArcade.tsx`, `TavernCards.tsx`, `TavernRoulette.tsx`, `TavernScratch.tsx`, `TavernHorseRace.tsx`, etc.): Interactive minigames.
  - `admin/`: Scoped admin controls:
    - `AdminControlSheet.tsx`: Admin interface with thematic categorized tabs.
    - `AdminAuctionManager.tsx`: Manage active/pending auctions and base prices.
    - `AdminMissionManager.tsx`: Mission management interface.
    - `AdminControlPrimitives.tsx`: Shared custom admin input widgets.
    - `AdminKnowledgeManager.tsx`: Manage grimoire/knowledge document records.
    - `AdminStaffAssistant.tsx`: AI assistant interface for staff and moderators.
- Root directory `*.sql` files: Database schemas, RLS policies, and RPC stored procedures.

## Project Guardrails

- **Working Directory:** Work only within the current workspace environment: `c:\Users\e_grado\Documents\New project 2\Kingdoom-sync`.
- **Consistency:** Maintain existing styling variables (gradients, card designs, layout system).
- **Git Discipline:** Stage only files directly related to the active task. Avoid editing unrelated files.
- **Dependencies:** Do not create, modify, or commit `package-lock.json`.
- **Target Platform:** Prioritize the desktop web/responsive page view. Mobile app wrappers are secondary.
- **Changelog:** Document all functional, UI, database, or architectural modifications in `AI_CHANGELOG.md`.

## 1. Reglas de Negocio y Lógica de la Economía

### Mecánica de Subastas
- **Comisión de entrada:** Se cobra una comisión única no reembolsable del 25% del precio base (`start_price`) del ítem al unirse a la subasta.
- **Modelo Lock-and-Release:** El oro ofertado por los jugadores no se descuenta definitivamente durante las pujas. Se bloquea en la subasta y, al finalizar, se devuelve automáticamente a todos los participantes excepto al ganador, a quien sí se le cobra el monto total de su última puja.
- **Pujas Acumulativas:** El monto que el jugador puja se suma a la puja acumulada global (ej: si la puja acumulada está en 100,000 y el jugador puja 5,000, la nueva puja acumulada es 105,000). El jugador que no tenga oro suficiente para cubrir el nuevo total acumulado queda descalificado.

### Sistema de Compra a Cuotas (Installments)
- **Cuotas e Intereses:** El jugador puede comprar objetos del mercado en 3 cuotas (con un 10% de recargo sobre el valor base) o 6 cuotas (con un 18% de recargo). Las pociones y consumibles no permiten financiación.
- **Bloqueo de Inventario (Locking):** Mientras el plan de pago esté activo, el ítem en `player_inventory` tendrá `is_locked = true` y no podrá utilizarse, equiparse ni transferirse. Al saldar la deuda, se desbloquea (`is_locked = false`).
- **Política de Morosidad:** Si un jugador tiene algún plan de pago en mora (`status = 'defaulted'`) en los últimos 14 días, el sistema le denegará cualquier nueva compra a plazos.

## 2. Estructura de la Base de Datos y Supabase (RPCs)

### Tablas Principales
- `players`: Perfil del jugador, contiene `gold`, `phone`, `is_admin`, `banned`.
- `character_sheets`: Ficha de rol del jugador. Usa la columna `playerId` (notar la I mayúscula en camelCase).
- `player_inventory`: Inventario real de objetos del mercado. Usa la columna `player_id` (notar snake_case), lee por `item_name` y contiene `is_locked` para artículos financiados.
- `payment_plans`: Registro de planes de financiación, cuotas pagadas, días de mora y estado del crédito.
- `knowledge_documents`: Almacena documentos de lore, bestiario, flora y grimorio.
- `market_auctions`: Registro de subastas activas (`active`, `completed`, `cancelled`).
- `market_auction_bids`: Historial de pujas realizadas por subasta.

### RPCs Clave
- `place_auction_bid(p_player_id, p_auction_id, p_amount)`: RPC de base de datos que encapsula el cobro de la comisión de entrada, las validaciones de saldo y el incremento acumulado del bot de WhatsApp y la web de forma unificada.
- `purchase_market_item_v2(p_player_id, p_item_id, p_installments)`: RPC transaccional que procesa compras de mercado al contado o financiadas, validando el saldo, la morosidad y aplicando el bloqueo `is_locked` en el inventario.
- `resolve_market_auction(p_auction_id)`: RPC que finaliza una subasta, transfiere el ítem al ganador, cobra la puja y devuelve el oro bloqueado al resto de los postores.

## 3. Playbooks (Guías Rápidas)

### Añadir o Modificar Minijuegos (Tavern)
1. Crea el componente en `src/components/Tavern[Nombre].tsx`.
2. Utiliza los hooks de base de datos o API locales en `src/hooks/` o `src/lib/` para sincronizar el saldo de oro con Supabase.
3. Agrégalo al enum de pestañas y al render condicional en `src/App.tsx`.

### Compras y Financiación en el Mercado
1. El usuario interactúa mediante `PurchaseModal` para elegir el método de pago (al contado, 3 cuotas o 6 cuotas).
2. Se consume `purchase_market_item_v2` en Supabase. Si es financiado, el ítem ingresa a `player_inventory` con `is_locked = true`.
3. El estado de la deuda y los pagos correspondientes se administran desde `PayInstallmentModal` y la pestaña de créditos en `PlayerInventorySheet.tsx`.

### Editar el Panel de Subastas (Player / Admin)
- Modifica `PlayerAuctionPanel.tsx` para vistas del jugador (ingreso de incrementos de pujas) y `AdminAuctionManager.tsx` para la gestión de administradores (iniciar subastas, definir incrementos mínimos).

## 4. Convenciones de UI y Estilo Visual

- **Diseño Premium:** Utilizar gradientes vibrantes, bordes finos semi-transparentes y esquinas redondeadas.
- **Tipografía:** Usar fuentes limpias tipo Outfit o Inter para una legibilidad óptima.
- **Responsividad:** Asegurar que todos los formularios, ventanas modales y paneles tengan clases de Tailwind para pantallas móviles (`sm:`, `md:`) sin romper el diseño de escritorio.
- **Foco Accesible Temático:** Foco global `:focus-visible` condicionado al color de acento de la sección (por ejemplo, ámbar en mercado, violeta en grimorio) visible solo al usar teclado.
- **Optimización de Scroll y Layout:**
  - Evitar saltos de scrollbar en transiciones de páginas cortas a largas aplicando `scrollbar-gutter: stable` en `html`.
  - Configurar `overscroll-behavior: contain` en paneles con scroll interno (modales, hojas de admin) para evitar el arrastre del scroll de la página base.
- **Números y Títulos:**
  - Uso de `text-wrap: balance` para una distribución equilibrada de títulos de varias líneas (en especial en móviles).
  - Uso de `font-variant-numeric: tabular-nums` para que los números en contadores y estadísticas mantengan anchos fijos y no vibren al cambiar.
- **Fluidez Táctil:** Uso de `-webkit-tap-highlight-color: transparent` y `overscroll-behavior-y: contain` en el body para brindar una experiencia fluida y similar a una aplicación nativa.

## 5. Validación y Verificación

- Ejecutar `npx tsc --noEmit` y `npm run build` para verificar que el código TypeScript compila correctamente y no introduce errores de tipado.
- Para pequeños cambios de texto o documentación, indica brevemente en tu reporte por qué se omitió el build de compilación.
- Verificar siempre que los estados de carga ("loading") y estados de error estén controlados en cada llamada a Supabase.

## 6. Protocolo de Inicio de Sesión (Session Bootstrap)

Al comenzar cualquier sesión de trabajo, el agente DEBE ejecutar
los siguientes pasos UNA SOLA VEZ, en orden, sin que el usuario
se lo pida:

1. Descargar o leer `AI_CHANGELOG.md` desde el repositorio local.
2. Leer el último bloque de "Relevo" o "Handoff" del changelog.
3. Consultar el MCP de memoria (`ai-memory/kingdoom-memory.jsonl`)
   para cargar decisiones y contexto persistente.
4. Informar al usuario con un resumen de una sola línea:
   "Contexto cargado — último relevo: [fecha]. Listo para trabajar."

⛔ No preguntar al usuario si debe hacer esto. Es obligatorio.
⛔ No iniciar ninguna tarea hasta completar estos 4 pasos.

## 7. Protocolo de Verificación de Subidas (Push/Deploy Honesty)

Antes de informar al usuario que un cambio fue subido a GitHub
o desplegado en Hugging Face, el agente DEBE:

1. Ejecutar el comando real (`git push`, `docker push`, etc.)
   y esperar la respuesta del terminal.
2. Leer la salida completa del comando.
3. Solo si la salida confirma éxito (sin errores), informar:
   "✅ Subido correctamente a [destino]."
4. Si el comando falla o no se ejecutó, informar inmediatamente:
   "⚠️ No se pudo subir. Motivo: [error exacto del terminal]."

⛔ PROHIBIDO reportar una subida como exitosa sin haber ejecutado
   y leído la salida del comando en esta misma sesión.
⛔ PROHIBIDO asumir que algo fue subido porque "debería funcionar".
⛔ Si hay duda, decir "No lo subí aún" es siempre la respuesta
   correcta. Mentir sobre esto rompe la confianza del proyecto.

Este protocolo existe porque la confiabilidad del agente depende
de que el usuario pueda creer lo que se le reporta. Un reporte
falso, aunque sea involuntario, invalida todo el trabajo de la
sesión

## 8. Protocolo de Reportes (Report Discipline)

Cada reporte entregado al usuario es un documento cerrado.
Una vez entregado, no debe repetirse en solicitudes posteriores.

### Reglas estrictas

1. Cada mensaje del usuario genera exactamente UN reporte nuevo,
   correspondiente SOLO a lo que se pidió en ese mensaje.

2. Si el usuario pide un reporte sobre la tarea B, el reporte
   de la tarea A ya fue entregado y NO debe incluirse de nuevo,
   ni como resumen, ni como contexto, ni como referencia.

3. El reporte debe comenzar directamente con el resultado de
   lo solicitado. No repetir lo que el usuario pidió, no resumir
   la conversación anterior, no incluir introducciones largas.

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
⛔ PROHIBIDO incluir en un reporte nuevo cualquier contenido
   de reportes anteriores de la misma sesión.
⛔ PROHIBIDO repetir el enunciado de la tarea como si fuera
   parte del reporte.
⛔ PROHIBIDO entregar reportes acumulativos no solicitados.
