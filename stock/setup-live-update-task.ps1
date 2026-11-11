$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $projectRoot 'run-live-update.ps1'
$taskName = 'QUANTLY Live Market Data Update'

$powershell = (Get-Command powershell.exe).Source
$action = New-ScheduledTaskAction -Execute $powershell -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`"" -WorkingDirectory $projectRoot
$triggers = @(
  (New-ScheduledTaskTrigger -Daily -At 6:00AM),
  (New-ScheduledTaskTrigger -Daily -At 6:00PM)
)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Settings $settings -Description 'QUANTLY 최신 주가 일봉 데이터 업데이트' -Force | Out-Null
$provider = if ([string]::IsNullOrWhiteSpace($env:TWELVE_DATA_API_KEY)) { 'Yahoo Finance 공개 차트 fallback' } else { 'Twelve Data' }
Write-Output "예약 완료: $taskName (매일 오전 6시·오후 6시, provider=$provider)"
Write-Output 'API 키가 없으면 Yahoo Finance 공개 차트 fallback이 사용됩니다.'
Write-Output '수동 실행: 작업 스케줄러에서 해당 작업을 선택한 뒤 실행을 누르세요.'
