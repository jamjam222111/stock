$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $projectRoot 'run-live-update.ps1'
$taskName = 'QUANTLY Live Market Data Update'

if ([string]::IsNullOrWhiteSpace($env:TWELVE_DATA_API_KEY)) {
  throw "먼저 현재 PowerShell에서 `$env:TWELVE_DATA_API_KEY='발급받은키'`를 설정하세요. API 키는 이 파일에 저장하지 않습니다."
}

$powershell = (Get-Command powershell.exe).Source
$action = New-ScheduledTaskAction -Execute $powershell -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`"" -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Daily -At 6:00PM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'QUANTLY 최신 주가 일봉 데이터 업데이트' -Force | Out-Null
Write-Output "예약 완료: $taskName (매일 오후 6시)"
Write-Output '수동 실행: 작업 스케줄러에서 해당 작업을 선택한 뒤 실행을 누르세요.'
