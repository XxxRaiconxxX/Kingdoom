param(
    [string]$BasePath = "",
    [string]$KingdoomSyncPath = "",
    [string]$KingdoomBotPath = "",
    [string]$KingdoomFichasPath = ""
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Ensure-GraphifyInMcpConfig {
    param(
        [string]$ConfigPath
    )

    $configDir = Split-Path -Parent $ConfigPath
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }

    if (Test-Path $ConfigPath) {
        $json = Get-Content -Raw $ConfigPath | ConvertFrom-Json
    } else {
        $json = [pscustomobject]@{}
    }

    if (-not $json.PSObject.Properties.Name.Contains("mcpServers")) {
        $json | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue ([pscustomobject]@{})
    }

    $graphifyServer = [pscustomobject]@{
        command = "uv"
        args = @(
            "run",
            "--with",
            "graphifyy",
            "--with",
            "mcp",
            "-m",
            "graphify.serve",
            '${workspace.path}/graphify-out/graph.json'
        )
    }

    $json.mcpServers | Add-Member -NotePropertyName "graphify" -NotePropertyValue $graphifyServer -Force
    $json | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 $ConfigPath
}

function Resolve-RepoPath {
    param(
        [string]$ExplicitPath,
        [string]$BasePath,
        [string[]]$Candidates
    )

    if ($ExplicitPath) {
        return $ExplicitPath
    }

    if ($BasePath) {
        foreach ($candidate in $Candidates) {
            $joined = Join-Path $BasePath $candidate
            if (Test-Path $joined) {
                return $joined
            }
        }
    }

    return ""
}

function Install-RepoGraphify {
    param(
        [string]$RepoPath
    )

    if (-not (Test-Path $RepoPath)) {
        Write-Host "Saltando repo inexistente: $RepoPath" -ForegroundColor Yellow
        return
    }

    Write-Step "Preparando $RepoPath"
    Push-Location $RepoPath
    try {
        graphify antigravity install
        graphify agents install
        graphify hook install
        graphify update .
    } finally {
        Pop-Location
    }
}

Write-Step "Verificando uv"
uv --version

Write-Step "Instalando o actualizando Graphify"
uv tool install --upgrade graphifyy

Write-Step "Verificando Graphify"
graphify --help | Out-Null
Write-Host "Graphify OK" -ForegroundColor Green

$mcpConfig = Join-Path $env:USERPROFILE ".gemini\antigravity\mcp_config.json"
Write-Step "Configurando MCP de Antigravity 2"
Ensure-GraphifyInMcpConfig -ConfigPath $mcpConfig
Write-Host "MCP configurado en $mcpConfig" -ForegroundColor Green

$resolvedSync = Resolve-RepoPath -ExplicitPath $KingdoomSyncPath -BasePath $BasePath -Candidates @("Kingdoom-sync", "kingdoom-sync")
$resolvedBot = Resolve-RepoPath -ExplicitPath $KingdoomBotPath -BasePath $BasePath -Candidates @("kingdoom-bot", "Kingdoom-bot")
$resolvedFichas = Resolve-RepoPath -ExplicitPath $KingdoomFichasPath -BasePath $BasePath -Candidates @("kingdoom-fichas", "Kingdoom-fichas")

$repos = @(
    $resolvedSync,
    $resolvedBot,
    $resolvedFichas
) | Where-Object { $_ -and $_.Trim() -ne "" }

if ($repos.Count -eq 0) {
    throw "No se encontraron repos. Usa -BasePath o pasa -KingdoomSyncPath, -KingdoomBotPath y/o -KingdoomFichasPath."
}

Write-Step "Repos detectados"
$repos | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }

foreach ($repo in $repos) {
    Install-RepoGraphify -RepoPath $repo
}

Write-Step "Listo"
Write-Host "Reinicia Antigravity 2 y abre el repo que quieras usar." -ForegroundColor Green
Write-Host "Si quieres forzar el arranque de Graphify dentro del asistente, usa: /graphify ." -ForegroundColor Green
