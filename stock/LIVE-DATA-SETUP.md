# 최신 주가 데이터 자동 갱신

이 프로젝트는 `Twelve Data → update-live-data.js → data/live-market.json → backtest.html` 순서로 최신 일봉 데이터를 반영합니다.

## API 키 설정

Twelve Data에서 API 키를 발급받은 뒤 PowerShell에서 설정합니다. API 키는 코드나 저장소에 넣지 않습니다.

```powershell
$env:TWELVE_DATA_API_KEY='발급받은_API_키'
```

## 한 번 수동 갱신

```powershell
node update-live-data.js
```

또는 로그까지 남기는 PowerShell 실행기를 사용합니다.

```powershell
.\run-live-update.ps1
```

## 매일 자동 갱신 예약

API 키를 설정한 같은 PowerShell에서 한 번 실행합니다.

```powershell
.\setup-live-update-task.ps1
```

기본 예약 시간은 매일 오후 6시입니다. 실행 기록은 `data/logs/live-update.log`에 저장됩니다.

예약을 삭제하려면:

```powershell
.\remove-live-update-task.ps1
```

API 호출이 실패하면 기존 `data/live-market.json`을 덮어쓰지 않으며, 사이트는 데모 데이터로 안전하게 표시됩니다. 실제 데이터가 반영되면 백테스트 화면 상단 배지가 `LIVE DATA`로 바뀝니다.
