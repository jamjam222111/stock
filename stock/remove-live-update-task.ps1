$taskName = 'QUANTLY Live Market Data Update'
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Output "예약 제거 완료: $taskName"
