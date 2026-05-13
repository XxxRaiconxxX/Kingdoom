# Kingdoom Shared Memory

Memoria operativa compartida entre Jarvis, Antigravity y otros agentes que trabajen en Kingdoom.

## Objetivo

Reducir dependencia de `AI_CHANGELOG.md` para contexto diario. El changelog sigue siendo historial humano y de despliegue; esta carpeta guarda decisiones, handoffs y notas consultables por MCP.

## Archivo principal

- `kingdoom-memory.jsonl`: append-only, una entrada JSON por linea.

## Reglas

- No guardar secretos, API keys ni datos privados de usuarios.
- Registrar solo contexto accionable: decisiones, riesgos, estado de tareas, rutas relevantes y handoffs.
- Preferir entradas cortas y etiquetadas.
- No borrar entradas manualmente salvo limpieza consciente y revisada.

## MCP

Servidor local:

```powershell
node scripts/kingdoom-memory-mcp.mjs
```

Script npm:

```powershell
npm run mcp:memory
```
