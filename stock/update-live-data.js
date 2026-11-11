/*
 * QUANTLY 최신 주가 업데이트 스크립트
 * 실행: Windows PowerShell에서 $env:TWELVE_DATA_API_KEY='발급받은키'; node update-live-data.js
 *
 * Twelve Data의 일봉 OHLCV 데이터를 받아 data/live-market.json에 저장합니다.
 * API 키는 파일에 저장하지 않으며 환경변수로만 읽습니다.
 */
const fs = require('fs');
const path = require('path');

const apiKey = process.env.TWELVE_DATA_API_KEY;
const outputPath = path.join(__dirname, 'data', 'live-market.json');
const symbols = {
  AAPL: 'AAPL', MSFT: 'MSFT', GOOGL: 'GOOGL', AMZN: 'AMZN', NVDA: 'NVDA', TSLA: 'TSLA', META: 'META', KO: 'KO', MCD: 'MCD', WMT: 'WMT',
  '005930': '005930:KRX', '000660': '000660:KRX', '035420': '035420:KRX', '005380': '005380:KRX', '051910': '051910:KRX',
  '035720': '035720:KRX', '068270': '068270:KRX', '006400': '006400:KRX', '003670': '003670:KRX', '028260': '028260:KRX'
};

if (!apiKey) {
  console.error('TWELVE_DATA_API_KEY가 없습니다. Twelve Data API 키를 환경변수로 설정한 뒤 다시 실행하세요.');
  console.error("예: $env:TWELVE_DATA_API_KEY='발급받은키'; node update-live-data.js");
  process.exitCode = 1;
} else {
  const requestSeries = async (ticker, providerSymbol) => {
    const url = new URL('https://api.twelvedata.com/time_series');
    url.searchParams.set('symbol', providerSymbol);
    url.searchParams.set('interval', '1day');
    url.searchParams.set('outputsize', '5000');
    url.searchParams.set('order', 'asc');
    url.searchParams.set('apikey', apiKey);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${ticker}: HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.values) throw new Error(`${ticker}: ${payload.message || '데이터가 없습니다.'}`);
    return payload.values.map((item) => ({
      date: new Date(`${item.datetime}T14:00:00+09:00`).toISOString(),
      price: Number(item.close),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      volume: Number(item.volume || 0)
    })).filter((item) => Number.isFinite(item.price));
  };

  (async () => {
    const data = {};
    const errors = [];
    for (const [ticker, providerSymbol] of Object.entries(symbols)) {
      try {
        data[ticker] = await requestSeries(ticker, providerSymbol);
        console.log(`${ticker}: ${data[ticker].length} records`);
      } catch (error) {
        errors.push(error.message);
        console.warn(error.message);
      }
    }
    const successful = Object.keys(data).length;
    if (!successful) throw new Error('모든 종목 업데이트에 실패했습니다. 기존 데모 파일을 유지합니다.');
    const payload = {
      source: 'live',
      provider: 'Twelve Data',
      updatedAt: new Date().toISOString(),
      message: errors.length ? `${successful}개 종목 업데이트, ${errors.length}개 종목 실패` : '최신 일봉 데이터가 반영되었습니다.',
      data
    };
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`완료: ${outputPath}`);
    if (errors.length) process.exitCode = 2;
  })().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
