$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $projectRoot 'run-live-update.ps1'
$taskName = 'QUANTLY Live Market Data Update'

$powershell = (Get-Command powershell.exe).Source
$action = New-ScheduledTaskAction -Execute $powershell -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`"" -WorkingDirectory $projectRoot
$triggers = @(
  (New-ScheduledTaskTrigger -Daily -At 6:00AM),
  (New-ScheduledTaskTrigger -Daily -At 6:00PM),
  (New-ScheduledTaskTrigger -AtStartup)
)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
try {
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Settings $settings -Description 'QUANTLY 최신 주가 일봉 데이터 업데이트' -Force -ErrorAction Stop | Out-Null
} catch {
  Write-Warning '기존 작업은 관리자 권한으로 등록되어 있어 유지합니다. 현재 사용자 자동 시작은 별도로 등록합니다.'
}
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$startupCommand = "`"$powershell`" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runner`""
New-Item -Path $runKey -Force | Out-Null
Set-ItemProperty -Path $runKey -Name 'QUANTLY Live Market Data Startup Update' -Value $startupCommand
$provider = if ([string]::IsNullOrWhiteSpace($env:TWELVE_DATA_API_KEY)) { 'Yahoo Finance 공개 차트 fallback' } else { 'Twelve Data' }
Write-Output "예약 완료: $taskName (매일 오전 6시·오후 6시, provider=$provider)"
Write-Output '자동 시작 완료: 현재 사용자 로그인 시 1회 실행'
Write-Output 'API 키가 없으면 Yahoo Finance 공개 차트 fallback이 사용됩니다.'
Write-Output '수동 실행: 작업 스케줄러에서 해당 작업을 선택한 뒤 실행을 누르세요.'
