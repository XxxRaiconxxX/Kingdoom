# Kingdoom Memory MCP

Servidor MCP local para compartir memoria operativa entre Jarvis, Antigravity y otros agentes.

## Por que existe

`AI_CHANGELOG.md` es util como historial humano, pero se volvio pesado para iniciar cada sesion. Este MCP ofrece memoria compacta y buscable:

- decisiones tecnicas
- handoffs entre agentes
- riesgos activos
- archivos relevantes
- contexto reciente del proyecto

## Ubicacion

- Servidor: `scripts/kingdoom-memory-mcp.mjs`
- Datos: `ai-memory/kingdoom-memory.jsonl`

No usa dependencias externas. Funciona con Node y escribe en JSONL append-only.

## Herramientas MCP

### `remember_decision`

Registra decisiones o aprendizajes.

Campos principales:

- `actor`: Jarvis, Antigravity o e_grado.
- `area`: market, archivist, supabase, anime, admin, mobile, etc.
- `summary`: resumen corto.
- `details`: contexto adicional.
- `status`: `active`, `done`, `blocked`, `deprecated` o `watch`.
- `tags`: etiquetas.
- `files`: rutas relevantes.

### `record_handoff`

Deja un relevo para otro agente.

Campos principales:

- `from`
- `to`
- `summary`
- `nextSteps`
- `blockers`
- `files`
- `tags`

### `search_memory`

Busca por texto, area o tags.

### `latest_memory`

Devuelve entradas recientes.

### `project_brief`

Genera un brief compacto para empezar una sesion sin leer todo el changelog.

## Configuracion sugerida para Codex

En la configuracion MCP de Codex, agregar:

```toml
[mcp_servers.kingdoom-memory]
command = "node"
args = ["C:\\Users\\e_grado\\Documents\\New project 2\\Kingdoom-sync\\scripts\\kingdoom-memory-mcp.mjs"]
env = { KINGDOOM_MEMORY_PATH = "C:\\Users\\e_grado\\Documents\\New project 2\\Kingdoom-sync\\ai-memory\\kingdoom-memory.jsonl" }
```

## Configuracion sugerida para Antigravity

Si Antigravity acepta configuracion JSON de MCP:

```json
{
  "mcpServers": {
    "kingdoom-memory": {
      "command": "node",
      "args": [
        "C:\\Users\\e_grado\\Documents\\New project 2\\Kingdoom-sync\\scripts\\kingdoom-memory-mcp.mjs"
      ],
      "env": {
        "KINGDOOM_MEMORY_PATH": "C:\\Users\\e_grado\\Documents\\New project 2\\Kingdoom-sync\\ai-memory\\kingdoom-memory.jsonl"
      }
    }
  }
}
```

## Uso recomendado por agentes

Al iniciar trabajo complejo:

1. Llamar `project_brief`.
2. Llamar `search_memory` con el area de la tarea.
3. Trabajar normalmente.
4. Al terminar, llamar `remember_decision` o `record_handoff`.

## Reglas de seguridad

- No guardar API keys.
- No guardar service role keys.
- No guardar datos privados de jugadores.
- No usar esta memoria como base de datos de produccion.
- Mantener entradas cortas; si algo requiere detalle largo, enlazar archivo en `docs/`.

## Relacion con `AI_CHANGELOG.md`

Por ahora ambos conviven:

- `AI_CHANGELOG.md`: historial de cambios importantes para humanos y auditoria.
- MCP memory: memoria operativa compacta para agentes.

Cuando el flujo MCP sea estable, se puede reducir el changelog a cambios de producto y dejar los handoffs en esta memoria.
