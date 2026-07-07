# Guia Rapida: Antigravity 2 + Graphify en otro ordenador

## Que hace este paquete

Deja preparado:

- `graphifyy` instalado con `uv`
- skill para `.agents`
- integracion de Antigravity 2
- MCP de Graphify en `~/.gemini/antigravity/mcp_config.json`
- hooks y grafo inicial en:
  - `Kingdoom-sync`
  - `kingdoom-bot`
  - `kingdoom-fichas`

## Paso 1

Instala `uv` si todavia no esta en el otro ordenador.

## Paso 2

Copia este script al otro ordenador y ejecutalo en PowerShell:

- `scripts/antigravity2-graphify-setup.ps1`

Si PowerShell bloquea scripts:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Luego ejecuta una de estas dos variantes.

Si los tres repos estan dentro de una misma carpeta base:

```powershell
.\scripts\antigravity2-graphify-setup.ps1 -BasePath "D:\Proyectos\Kingdoom"
```

Si cada repo esta en una ruta distinta:

```powershell
.\scripts\antigravity2-graphify-setup.ps1 `
  -KingdoomSyncPath "D:\Repos\Web\Kingdoom-sync" `
  -KingdoomBotPath "E:\Bots\kingdoom-bot" `
  -KingdoomFichasPath "F:\Juegos\kingdoom-fichas"
```

## Paso 3

Cuando termine:

1. Reinicia Antigravity 2
2. Abre el repo que quieras usar

## Paso 4

Dentro de Antigravity 2 puedes usar directamente prompts como:

- `usa graphify para explicarme la arquitectura del repo`
- `traza con graphify la relacion entre UI y Supabase`
- `audita con graphify el flujo principal del proyecto`

Si quieres forzar el arranque del grafo desde el principio:

```text
/graphify .
```

## Si algo falla

Verifica:

```powershell
uv --version
graphify --help
```

Y revisa que exista:

- `graphify-out\graph.json`

en el repo que abriste.
