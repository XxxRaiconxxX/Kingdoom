@RTK.md

# Kingdoom Agent Context

Use this file as local guidance for Codex, Antigravity, and other coding agents working in this repository.

## Project Guardrails

- Work only from `C:\Users\e_grado\Documents\New project 2\Kingdoom-sync`.
- Preserve the current Kingdoom architecture. Make small, compatible changes before considering larger refactors.
- Do not touch unrelated dirty files. Stage only the files that belong to the current task.
- Do not create or commit `package-lock.json`.
- For web work, prioritize the page version first. The mobile app is intentionally on hold unless the user explicitly asks for it.
- Update `AI_CHANGELOG.md` for functional, UI, Supabase, economy, minigame, or architecture changes.

## Context Discipline

- Inspect the smallest relevant file, symbol, route, component, SQL function, or diff before broad exploration.
- Prefer targeted searches with `rg` and scoped file reads.
- Avoid dumping large files, generated folders, full logs, minified output, broad `git diff`, or unbounded directory listings.
- If command output may be large, cap it and narrow the command before increasing output.

PowerShell examples:

```powershell
rtk rg -n -m 20 "TavernHorseRace|horseRace" src
rtk git diff -- src/components/TavernHorseRace.tsx
rtk npm run build
```

## Validation Policy

- For functional or medium/large UI work, run `npx tsc --noEmit` and `npm run build`.
- For tiny docs-only/tooling notes, use the cheapest useful verification and state why a full build was skipped.
- For rendered UI changes, verify at least one mobile viewport when practical.
- For Supabase/economy/minigame changes, be stricter: inspect RPC/client flow and avoid double-credit or double-debit paths.

## Communication

- State the approach before non-trivial edits.
- Report findings with evidence, not assumptions.
- Keep summaries short: what changed, files touched, validation run, and remaining risk.
