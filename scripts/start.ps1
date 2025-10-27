param(
  [switch]$Rebuild = $false
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

try {
  Write-Info "Starting EYE system..."
  
  # Check Docker
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker is not installed or not in PATH. Install Docker Desktop and retry."
    exit 1
  }
  Write-Info "Docker found"

  # Check Docker engine
  Write-Info "Checking Docker engine..."
  try {
    docker info | Out-Null
    Write-Info "Docker engine running"
  } catch {
    Write-Err "Docker engine is not running. Please start Docker Desktop and retry."
    exit 1
  }

  # Determine compose command
  Write-Info "Detecting Docker Compose command..."
  if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $composeCmd = "docker-compose"
    Write-Info "Using docker-compose"
  } else {
    Write-Err "docker-compose is not available. Please install Docker Compose."
    exit 1
  }

  # Generate configuration
  Write-Info "Generating configuration files..."
  Set-Location ..
  python scripts/generate-config.py
  Set-Location scripts
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Configuration generation failed"
    exit 1
  }
  Write-Info "Configuration generated"

  # Start services
  Write-Info "Starting Docker services..."
  Set-Location ..
  if ($Rebuild) {
    Invoke-Expression "$composeCmd up -d --build"
  } else {
    Invoke-Expression "$composeCmd up -d"
  }
  Write-Info "Docker services started"

  # Show status
  Write-Host ""
  Write-Host "Services:" -ForegroundColor Green
  Write-Host "  Backend:   http://localhost:8000/" -ForegroundColor White
  Write-Host "  Frontend:  http://localhost:3000/" -ForegroundColor White
  Write-Host "  MinIO:     http://localhost:9001/" -ForegroundColor White
  Write-Host "  CVAT:      http://localhost:8080/" -ForegroundColor White
  Write-Host ""
  Write-Host "Commands:" -ForegroundColor DarkGray
  Write-Host "  $composeCmd ps" -ForegroundColor White
  Write-Host "  $composeCmd logs -f" -ForegroundColor White
  Write-Host "  $composeCmd down" -ForegroundColor White

  exit 0
} catch {
  Write-Err $_.Exception.Message
  exit 1
}