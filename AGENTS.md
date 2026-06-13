# Kingdoom Sync Agent Context

Use this file as local guidance for Jules, Codex, Antigravity, and other AI coding agents working in this repository.

## Project Overview

Kingdoom Sync is the React web client and administration dashboard for the Kingdoom gaming economy. It is built with React, Vite, TypeScript, and Tailwind CSS/Vanilla CSS, communicating directly with the Supabase database.

## Repository Architecture

- `src/App.tsx`: Main dashboard entry point, routing, and layout structure.
- `src/index.css`: Central tailwind and custom CSS design system.
- `src/types.ts`: Shared TypeScript definitions for players, items, auctions, etc.
- `src/components/`: Modular UI sheets, modally-presented actions, and tabs:
  - `PlayerProfilePanel.tsx` & `PlayerInventorySheet.tsx`: Player progress, inventory view, and sheet controls.
  - `PlayerAuctionPanel.tsx`: Player interface for participating in auctions (bidding/viewing status).
  - `Tavern*.tsx` (`TavernHorseRace.tsx`, `TavernScratch.tsx`, `TavernRoulette.tsx`, etc.): Interactive minigames.
  - `admin/`: Scoped admin controls:
    - `AdminAuctionManager.tsx`: Manage active/pending auctions and base prices.
    - `AdminMissionManager.tsx`: Mission management interface.
    - `AdminControlPrimitives.tsx`: Shared custom admin input widgets.
- Root directory `*.sql` files: Database schemas, RLS policies, and RPC stored procedures.

## Project Guardrails

- **Working Directory:** Work only within the current workspace environment: `c:\Users\CRISMA01\.gemini\antigravity\scratch\Kingdoom-sync`.
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

## 2. Estructura de la Base de Datos y Supabase (RPCs)

### Tablas Principales
- `players`: Perfil del jugador, contiene `gold`, `phone`, `is_admin`, `banned`.
- `character_sheets`: Ficha de rol del jugador. Usa la columna `playerId` (notar la I mayúscula en camelCase).
- `player_inventory`: Inventario real de objetos del mercado. Usa la columna `player_id` (notar snake_case) y lee por `item_name`.
- `market_auctions`: Registro de subastas activas (`active`, `completed`, `cancelled`).
- `market_auction_bids`: Historial de pujas realizadas por subasta.

### RPCs Clave
- `place_auction_bid(p_player_id, p_auction_id, p_amount)`: RPC de base de datos que encapsula el cobro de la comisión de entrada, las validaciones de saldo y el incremento acumulado del bot de WhatsApp y la web de forma unificada.

## 3. Playbooks (Guías Rápidas)

### Añadir o Modificar Minijuegos (Tavern)
1. Crea el componente en `src/components/Tavern[Nombre].tsx`.
2. Utiliza los hooks de base de datos o API locales en `src/hooks/` o `src/lib/` para sincronizar el saldo de oro con Supabase.
3. Agrégalo al enum de pestañas y al render condicional en `src/App.tsx`.

### Editar el Panel de Subastas (Player / Admin)
- Modifica `PlayerAuctionPanel.tsx` para vistas del jugador (ingreso de incrementos de pujas) y `AdminAuctionManager.tsx` para la gestión de administradores (iniciar subastas, definir incrementos mínimos).

## 4. Convenciones de UI y Estilo Visual

- **Diseño Premium:** Utilizar gradientes vibrantes, bordes finos semi-transparentes y esquinas redondeadas.
- **Tipografía:** Usar fuentes limpias tipo Outfit o Inter para una legibilidad óptima.
- **Responsividad:** Asegurar que todos los formularios, ventanas modales y paneles tengan clases de Tailwind para pantallas móviles (`sm:`, `md:`) sin romper el diseño de escritorio.

## 5. Validación y Verificación

- Ejecutar `npx tsc --noEmit` y `npm run build` para verificar que el código TypeScript compila correctamente y no introduce errores de tipado.
- Para pequeños cambios de texto o documentación, indica brevemente en tu reporte por qué se omitió el build de compilación.
- Verificar siempre que los estados de carga ("loading") y estados de error estén controlados en cada llamada a Supabase.
