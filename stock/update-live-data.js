const fs = require('fs');
const path = require('path');

const root = __dirname;
const outputPath = path.join(root, 'data', 'live-market.json');
const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();

const symbols = [
  { ticker: 'AAPL', name: 'Apple', market: 'US', yahoo: 'AAPL', twelve: 'AAPL', refreshHours: 12 },
  { ticker: 'MSFT', name: 'Microsoft', market: 'US', yahoo: 'MSFT', twelve: 'MSFT', refreshHours: 12 },
  { ticker: 'GOOGL', name: 'Alphabet', market: 'US', yahoo: 'GOOGL', twelve: 'GOOGL', refreshHours: 24 },
  { ticker: 'AMZN', name: 'Amazon', market: 'US', yahoo: 'AMZN', twelve: 'AMZN', refreshHours: 24 },
  { ticker: 'NVDA', name: 'NVIDIA', market: 'US', yahoo: 'NVDA', twelve: 'NVDA', refreshHours: 12 },
  { ticker: 'TSLA', name: 'Tesla', market: 'US', yahoo: 'TSLA', twelve: 'TSLA', refreshHours: 12 },
  { ticker: 'META', name: 'Meta', market: 'US', yahoo: 'META', twelve: 'META', refreshHours: 24 },
  { ticker: 'KO', name: 'Coca-Cola', market: 'US', yahoo: 'KO', twelve: 'KO', refreshHours: 24 },
  { ticker: 'MCD', name: "McDonald's", market: 'US', yahoo: 'MCD', twelve: 'MCD', refreshHours: 24 },
  { ticker: 'WMT', name: 'Walmart', market: 'US', yahoo: 'WMT', twelve: 'WMT', refreshHours: 24 },
  { ticker: '005930', name: '삼성전자', market: 'KR', yahoo: '005930.KS', twelve: '005930:KRX', refreshHours: 24 },
  { ticker: '000660', name: 'SK하이닉스', market: 'KR', yahoo: '000660.KS', twelve: '000660:KRX', refreshHours: 24 },
  { ticker: '035420', name: 'NAVER', market: 'KR', yahoo: '035420.KS', twelve: '035420:KRX', refreshHours: 24 },
  { ticker: '005380', name: '현대차', market: 'KR', yahoo: '005380.KS', twelve: '005380:KRX', refreshHours: 24 },
  { ticker: '051910', name: 'LG화학', market: 'KR', yahoo: '051910.KS', twelve: '051910:KRX', refreshHours: 24 },
  { ticker: '035720', name: '카카오', market: 'KR', yahoo: '035720.KS', twelve: '035720:KRX', refreshHours: 24 },
  { ticker: '068270', name: '셀트리온', market: 'KR', yahoo: '068270.KS', twelve: '068270:KRX', refreshHours: 24 },
  { ticker: '006400', name: '삼성SDI', market: 'KR', yahoo: '006400.KS', twelve: '006400:KRX', refreshHours: 24 },
  { ticker: '003670', name: '포스코퓨처엠', market: 'KR', yahoo: '003670.KS', twelve: '003670:KRX', refreshHours: 24 },
  { ticker: '028260', name: '삼성물산', market: 'KR', yahoo: '028260.KS', twelve: '028260:KRX', refreshHours: 24 },
];

function readExisting() {
  try {
    return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch {
    return { data: {}, updatedByTicker: {} };
  }
}

function shouldUpdate(ticker, existing, now) {
  const item = symbols.find((symbol) => symbol.ticker === ticker);
  const previous = existing.updatedByTicker?.[ticker];
  if (!item || !previous || !existing.data?.[ticker]) return true;
  return now - new Date(previous).getTime() >= item.refreshHours * 60 * 60 * 1000;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'User-Agent': 'Mozilla/5.0 QUANTLY market updater', ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.yahoo)}?interval=1d&range=10y&events=div%2Csplits`;
  const payload = await fetchJson(url);
  const result = payload.chart?.result?.[0];
  if (!result) throw new Error('Yahoo 응답에 데이터가 없습니다.');
  const quote = result.indicators?.quote?.[0] || {};
  const adjusted = result.indicators?.adjclose?.[0]?.adjclose || [];
  const rows = (result.timestamp || []).map((timestamp, index) => {
    const close = quote.close?.[index];
    const price = adjusted[index] ?? close;
    if (!Number.isFinite(price)) return null;
    return {
      date: new Date(timestamp * 1000).toISOString(),
      price,
      open: quote.open?.[index] ?? null,
      high: quote.high?.[index] ?? null,
      low: quote.low?.[index] ?? null,
      volume: quote.volume?.[index] ?? null,
    };
  }).filter(Boolean);
  if (!rows.length) throw new Error('Yahoo 응답에 유효한 일봉이 없습니다.');
  return rows;
}

async function fetchTwelve(symbol) {
  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', symbol.twelve);
  url.searchParams.set('interval', '1day');
  url.searchParams.set('outputsize', '5000');
  url.searchParams.set('order', 'ASC');
  url.searchParams.set('apikey', apiKey);
  const payload = await fetchJson(url);
  if (payload.status === 'error' || !Array.isArray(payload.values)) {
    throw new Error(payload.message || 'Twelve Data 응답에 데이터가 없습니다.');
  }
  return payload.values.map((row) => ({
    date: new Date(`${row.datetime}T00:00:00Z`).toISOString(),
    price: Number(row.close),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    volume: Number(row.volume || 0),
  })).filter((row) => Number.isFinite(row.price));
}

async function main() {
  const existing = readExisting();
  const now = Date.now();
  const data = { ...(existing.data || {}) };
  const updatedByTicker = { ...(existing.updatedByTicker || {}) };
  const errors = [];
  let fetched = 0;
  let skipped = 0;

  for (const symbol of symbols) {
    if (!shouldUpdate(symbol.ticker, existing, now)) {
      skipped += 1;
      continue;
    }
    try {
      const rows = apiKey ? await fetchTwelve(symbol) : await fetchYahoo(symbol);
      data[symbol.ticker] = { ticker: symbol.ticker, name: symbol.name, market: symbol.market, rows };
      updatedByTicker[symbol.ticker] = new Date().toISOString();
      fetched += 1;
      console.log(`${symbol.ticker}: ${rows.length}개 일봉 ${apiKey ? 'Twelve Data' : 'Yahoo'} 반영`);
    } catch (error) {
      errors.push(`${symbol.ticker}: ${error.message}`);
      console.error(`${symbol.ticker}: ${error.message}`);
    }
  }

  const hasData = Object.keys(data).length > 0;
  if (!hasData) {
    console.error('저장할 주가 데이터가 없습니다.');
    process.exitCode = 1;
    return;
  }

  const refreshPolicy = Object.fromEntries(symbols.map((symbol) => [symbol.ticker, `${symbol.refreshHours}h`]));
  const output = {
    source: 'live',
    provider: apiKey ? 'Twelve Data' : 'Yahoo Finance public chart',
    updatedAt: new Date().toISOString(),
    updatedByTicker,
    refreshPolicy,
    message: errors.length
      ? `${fetched}개 종목 갱신, ${skipped}개 종목 유지, ${errors.length}개 종목 실패`
      : `${fetched}개 종목 갱신, ${skipped}개 종목 유지. 최신 일봉 데이터가 반영되었습니다.`,
    errors,
    data,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`저장 완료: ${outputPath}`);
  if (errors.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
