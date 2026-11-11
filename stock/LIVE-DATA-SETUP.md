# 최신 주가 데이터 자동 갱신

이 프로젝트는 `Twelve Data 또는 Yahoo Finance 공개 차트 → update-live-data.js → data/live-market.json → backtest.html` 순서로 최신 일봉 데이터를 반영합니다.

API 키가 없으면 Yahoo Finance 공개 차트를 자동으로 사용하고, API 키가 있으면 Twelve Data를 우선 사용합니다. API 키 없는 방식은 프로토타입·개인용 최신 일봉 갱신에 적합하며, 상용 서비스는 데이터 제공처의 라이선스와 이용약관을 확인해야 합니다.

## API 키 없이 실행

```powershell
node update-live-data.js
```

미국 인기 종목(AAPL·MSFT·NVDA·TSLA)은 12시간, 나머지 종목은 24시간 주기로 갱신하도록 설정되어 있습니다. 스크립트가 종목별 마지막 갱신 시각을 확인하므로, 작업 스케줄러를 더 자주 실행해도 아직 갱신 시간이 되지 않은 종목은 건너뜁니다.

## API 키 사용(선택)

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

PowerShell에서 한 번 실행합니다. API 키가 없어도 예약할 수 있습니다.

```powershell
.\setup-live-update-task.ps1
```

예약 시간은 매일 오전 6시와 오후 6시입니다. updater가 각 종목의 마지막 갱신 시각을 확인하므로, 12시간 종목은 하루 두 번, 24시간 종목은 하루 한 번 실제로 갱신됩니다. 실행 기록은 `data/logs/live-update.log`에 저장됩니다.

예약을 삭제하려면:

```powershell
.\remove-live-update-task.ps1
```

데이터 갱신에 실패하면 기존 종목 데이터를 보존하고 실패 내용을 `data/live-market.json`에 기록합니다. 저장된 실제 데이터가 있으면 사이트는 백테스트 화면 상단 배지를 `LIVE DATA`로 표시합니다. 두 방식 모두 일별 종가 데이터이므로 장중 분 단위 시세가 필요하면 별도의 실시간·분봉 데이터 공급원이 필요합니다.
