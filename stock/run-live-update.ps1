$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$logDirectory = Join-Path $projectRoot 'data\logs'
New-Item -ItemType Directory -Force $logDirectory | Out-Null
$logFile = Join-Path $logDirectory 'live-update.log'

if ([string]::IsNullOrWhiteSpace($env:TWELVE_DATA_API_KEY)) {
  Add-Content -Path $logFile -Value "$(Get-Date -Format s) ERROR TWELVE_DATA_API_KEY is missing"
  throw 'TWELVE_DATA_API_KEY 환경변수가 없습니다.'
}

try {
  node (Join-Path $projectRoot 'update-live-data.js') *>> $logFile
  Add-Content -Path $logFile -Value "$(Get-Date -Format s) SUCCESS"
} catch {
  Add-Content -Path $logFile -Value "$(Get-Date -Format s) ERROR $($_.Exception.Message)"
  throw
}
