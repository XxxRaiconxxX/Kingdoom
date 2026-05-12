# Archivista Vivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the web Archivist into a live chat assistant that answers from lore plus current site state, and can execute admin actions after chat confirmation.

**Architecture:** Split the feature into three units: a live-context collector, a structured AI/orchestration layer, and a chat-first UI with compact cards. Reuse existing admin utility functions instead of inventing new write paths.

**Tech Stack:** React, TypeScript, Vite, Supabase client, existing Vercel serverless admin endpoints.

---

### Task 1: Add Archivist live context and action contracts

**Files:**
- Create: `src/features/archivist/archivist.types.ts`
- Create: `src/features/archivist/archivistLive.ts`
- Modify: `src/utils/archivistSources.ts`

- [ ] Define shared Archivist types for cards, live context, action drafts and action results.
- [ ] Build a live-context collector that reads market, events, missions, grimoire and optional admin player data.
- [ ] Extend Archivist knowledge sources so market data is also part of retrieval.

### Task 2: Upgrade the Archivist endpoint to structured responses

**Files:**
- Modify: `api/admin/_aiPrompts.ts`
- Modify: `api/admin/ask-archivist.ts`
- Modify: `src/utils/archivistAi.ts`

- [ ] Change the prompt contract so the Archivist can return plain answers or admin action drafts as JSON.
- [ ] Accept extra runtime context and admin capability flags in the endpoint.
- [ ] Normalize endpoint responses on the client so the chat can render cards, pending confirmations and normal answers consistently.

### Task 3: Build admin action execution registry

**Files:**
- Create: `src/features/archivist/archivistActions.ts`
- Modify: `src/utils/players.ts`
- Reuse: `src/utils/missions.ts`, `src/utils/events.ts`, `src/features/market/market.service.ts`, `src/utils/grimoireContent.ts`, `src/utils/knowledge.ts`

- [ ] Map supported action kinds to existing project utilities.
- [ ] Implement safe execution wrappers with normalized success/error payloads.
- [ ] Support confirmation-only execution for admin users.

### Task 4: Redesign the Archivist UI to chat-first

**Files:**
- Modify: `src/components/ArchivistSection.tsx`

- [ ] Replace the current split layout with a chat-first layout.
- [ ] Render compact cards for market, events, missions and knowledge items when relevant.
- [ ] Add pending action blocks and `si/no` confirmation flow for admins.

### Task 5: Final polish and verification

**Files:**
- Modify: `AI_CHANGELOG.md`

- [ ] Verify typecheck and build.
- [ ] Smoke-check the Archivist flow for public queries and admin confirmations.
- [ ] Update changelog, review diff, commit and push.
