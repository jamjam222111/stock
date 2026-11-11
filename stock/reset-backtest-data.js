/*
 * QUANTLY 데모 주가 데이터 초기화 스크립트
 * 실행: node reset-backtest-data.js
 *
 * 이 스크립트는 실제 투자 데이터나 API 키를 건드리지 않습니다.
 * 프로젝트의 data/stock-data/us, data/stock-data/kr 안에 있는
 * 데모 CSV만 삭제한 뒤 동일한 기준 시드로 다시 생성합니다.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const dataRoot = path.join(root, 'data');
const seed = 20261107;
const years = 10;
const days = years * 252;

const stocks = {
  us: {
    AAPL: ['Apple', 145], MSFT: ['Microsoft', 220], GOOGL: ['Alphabet', 120], AMZN: ['Amazon', 95], NVDA: ['NVIDIA', 45],
    TSLA: ['Tesla', 80], META: ['Meta', 180], KO: ['Coca-Cola', 48], MCD: ["McDonald's", 150], WMT: ['Walmart', 90]
  },
  kr: {
    '005930': ['삼성전자', 55000], '000660': ['SK하이닉스', 90000], '035420': ['NAVER', 210000], '005380': ['현대차', 170000], '051910': ['LG화학', 450000],
    '035720': ['카카오', 55000], '068270': ['셀트리온', 180000], '006400': ['삼성SDI', 480000], '003670': ['포스코퓨처엠', 250000], '028260': ['삼성물산', 120000]
  }
};

function makeRows(ticker, name, startPrice) {
  let price = startPrice;
  const tickerSeed = [...ticker].reduce((sum, char) => sum + char.charCodeAt(0), seed);
  const rows = ['date,open,high,low,close,volume'];
  const start = new Date('2016-01-04T00:00:00Z');
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + Math.floor(i * 365 / 252));
    const drift = 0.00025 + ((tickerSeed % 11) - 5) * 0.000012;
    const wave = Math.sin(i / 29 + tickerSeed) * 0.004 + Math.sin(i / 151) * 0.002;
    const shock = Math.sin(i * 12.9898 + tickerSeed) * 0.0018;
    const previous = price;
    price = Math.max(price * 0.45, price * (1 + drift + wave + shock));
    const open = previous * (1 + Math.sin(i + tickerSeed) * 0.001);
    const high = Math.max(open, price) * 1.006;
    const low = Math.min(open, price) * 0.994;
    const volume = Math.round((1000000 + Math.abs(Math.sin(i / 17 + tickerSeed)) * 4000000) * (1 + (tickerSeed % 5) / 10));
    rows.push([date.toISOString().slice(0, 10), open.toFixed(2), high.toFixed(2), low.toFixed(2), price.toFixed(2), volume].join(','));
  }
  return `# ${name} · ${ticker}\n${rows.join('\n')}\n`;
}

for (const [market, symbols] of Object.entries(stocks)) {
  const directory = path.join(dataRoot, 'stock-data', market);
  fs.mkdirSync(directory, { recursive: true });
  for (const file of fs.readdirSync(directory)) {
    if (file.endsWith('.csv')) fs.unlinkSync(path.join(directory, file));
  }
  for (const [ticker, [name, startPrice]] of Object.entries(symbols)) {
    fs.writeFileSync(path.join(directory, `${ticker}.csv`), makeRows(ticker, name, startPrice), 'utf8');
  }
}

fs.writeFileSync(path.join(dataRoot, 'backtest-config.js'), `window.QUANTLY_DATA_CONFIG = ${JSON.stringify({ seed, resetVersion: 'demo-baseline-1', source: 'generated-demo-data' }, null, 2)};\n`, 'utf8');
fs.writeFileSync(path.join(dataRoot, 'last-reset.json'), JSON.stringify({ resetAt: new Date().toISOString(), seed, markets: ['us', 'kr'], symbols: 20 }, null, 2), 'utf8');
console.log(`QUANTLY demo stock data reset complete: ${Object.values(stocks).reduce((total, market) => total + Object.keys(market).length, 0)} symbols, ${years} years, seed ${seed}`);
