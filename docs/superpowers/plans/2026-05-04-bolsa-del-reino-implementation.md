# Bolsa Del Reino Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable web version of `Bolsa del Reino` inside Mercado with local simulation, player portfolio, and 2h predictions.

**Architecture:** Add a self-contained exchange feature under `src/features/realmExchange` plus one UI component under `src/components`. Integrate it as a new Mercado section, separate from tavern minigames, and keep Supabase schema untouched for this first pass.

**Tech Stack:** React 18, TypeScript, Vite, Framer Motion, lucide-react, localStorage, existing `PlayerSessionContext`.

---

### Task 1: Exchange Domain And Local Store

**Files:**
- Create: `src/features/realmExchange/realmExchange.types.ts`
- Create: `src/features/realmExchange/realmExchange.data.ts`
- Create: `src/features/realmExchange/realmExchange.simulation.ts`
- Create: `src/features/realmExchange/realmExchange.storage.ts`

- [ ] Define asset, position, prediction, volatility, and operation types.
- [ ] Create four initial assets: Arcania, Vyralis, Kaelum-Gard, Aurelia.
- [ ] Implement deterministic tick pricing from asset id and timestamp.
- [ ] Implement localStorage portfolio and prediction persistence per player.
- [ ] Expose pure helpers for buy, sell, open prediction, and settle predictions.

### Task 2: Web UI Component

**Files:**
- Create: `src/components/RealmStockExchange.tsx`

- [ ] Render selector for the four assets.
- [ ] Render large SVG chart without explicit trend label.
- [ ] Render separate `Prediccion 2h` and `Acciones` panels.
- [ ] Use existing player session gold and update gold through `setPlayerGold`.
- [ ] Show active prediction, portfolio, errors, and operation feedback.

### Task 3: Market Integration

**Files:**
- Modify: `src/sections/MarketSection.tsx`

- [ ] Lazy-load `RealmStockExchange`.
- [ ] Add a new collapsible Mercado section before `Taberna clandestina`.
- [ ] Keep tavern modes unchanged.

### Task 4: Documentation And Validation

**Files:**
- Modify: `AI_CHANGELOG.md`

- [ ] Add changelog entry.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Confirm no `package-lock.json`.
- [ ] Commit and push.

