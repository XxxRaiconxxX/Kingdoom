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

## Validation Policy

- Run `npx tsc --noEmit` and `npm run build` to verify there are no TypeScript or compilation errors before committing.
- For minor documentation/text-only changes, mention why a full compilation build was omitted.
- Test responsive states, paying special attention to mobile screens when updating UI components.
- For Supabase schema updates, check the respective `*.sql` files and double-check RLS policies to prevent authentication leaks.
