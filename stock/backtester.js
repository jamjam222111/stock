const tickerMeta = {
  AAPL:['Apple',145,0.00018], MSFT:['Microsoft',220,0.00016], GOOGL:['Alphabet',120,0.0002], AMZN:['Amazon',95,0.00025], NVDA:['NVIDIA',45,0.0004], TSLA:['Tesla',80,0.0005], META:['Meta',180,0.00035], KO:['Coca-Cola',48,0.0001], MCD:["McDonald's",150,0.00012], WMT:['Walmart',90,0.00012],
  '005930':['삼성전자',55000,0.00022], '000660':['SK하이닉스',90000,0.00032], '035420':['NAVER',210000,0.00028], '005380':['현대차',170000,0.0003], '051910':['LG화학',450000,0.00035], '035720':['카카오',55000,0.00035], '068270':['셀트리온',180000,0.0003], '006400':['삼성SDI',480000,0.00032], '003670':['포스코퓨처엠',250000,0.0004], '028260':['삼성물산',120000,0.00022]
};

const chartCanvas = document.querySelector('#backtest-chart');
let latestChartValues = [];
let latestPriceValues = [];
let latestDateValues = [];
let liveMarketData = {};
let latestDrawdownIndex = -1;
let chartFrame;
let chartTooltip;
if (chartCanvas) {
  chartFrame = chartCanvas.parentElement;
  chartFrame.classList.add('chart-frame');
  chartTooltip = document.createElement('div');
  chartTooltip.className = 'chart-tooltip';
  chartTooltip.innerHTML = '<span class="tooltip-date"></span><strong class="tooltip-value"></strong><small class="tooltip-return"></small>';
  chartFrame.appendChild(chartTooltip);
  chartCanvas.addEventListener('mousemove', (event) => {
    if (!latestChartValues.length) return;
    const rect = chartCanvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const index = Math.min(latestChartValues.length - 1, Math.round(ratio * (latestChartValues.length - 1)));
    const value = latestChartValues[index];
    const first = latestChartValues[0] || 1;
    const returns = ((value - first) / first) * 100;
    const date = latestDateValues[index];
    const formattedDate = date ? `${new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(new Date(date))} (KST · 일봉 기준)` : '날짜 정보 없음';
    chartTooltip.querySelector('.tooltip-date').textContent = formattedDate;
    chartTooltip.querySelector('.tooltip-value').textContent = won(value);
    const price = latestPriceValues[index] || 0;
    chartTooltip.querySelector('.tooltip-return').textContent = `${index === latestDrawdownIndex ? '최대 하락 구간 · ' : ''}기준 주가 ${price.toFixed(2)} · ${returns >= 0 ? '+' : ''}${returns.toFixed(2)}%`;
    const frameRect = chartFrame.getBoundingClientRect();
    const left = Math.max(8, Math.min(frameRect.width - 155, event.clientX - frameRect.left - 70));
    chartTooltip.style.left = `${left}px`;
    chartTooltip.style.top = `${Math.max(8, event.clientY - frameRect.top - 88)}px`;
    chartTooltip.classList.add('is-visible');
  });
  chartCanvas.addEventListener('mouseleave', () => chartTooltip.classList.remove('is-visible'));
}

const labHeading = document.querySelector('.lab-heading');
if (labHeading) {
  const guide = document.createElement('div');
  guide.className = 'backtest-guide';
  guide.innerHTML = '<span><b>1</b> 종목 선택</span><i>→</i><span><b>2</b> 전략 설정</span><i>→</i><span><b>3</b> 결과 확인</span>';
  labHeading.after(guide);
}

const beginnerGuide = document.querySelector('.beginner-guide');
const guideHeading = beginnerGuide?.querySelector('.guide-heading');
if (beginnerGuide && guideHeading) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.innerHTML = '설명 닫기 <span>↑</span>';
  beginnerGuide.insertBefore(toggle, guideHeading);
  toggle.addEventListener('click', () => {
    const collapsed = beginnerGuide.classList.toggle('guide-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.innerHTML = collapsed ? '초보자 가이드 보기 <span>↓</span>' : '설명 닫기 <span>↑</span>';
  });
}

const metricsBox = document.querySelector('.result-metrics');
let drawdownPanel;
if (metricsBox) {
  drawdownPanel = document.createElement('div');
  drawdownPanel.className = 'drawdown-panel';
  drawdownPanel.innerHTML = '<div class="drawdown-title"><span>最大 하락 구간 분석</span><b>DEMO ANALYSIS</b></div><strong class="drawdown-headline"></strong><p class="drawdown-reason"></p><span class="drawdown-note">실제 시장 뉴스·공시가 연결된 분석이 아닌, 선택한 전략과 데모 가격 흐름을 바탕으로 한 참고용 설명입니다.</span>';
  metricsBox.after(drawdownPanel);
}

const form = document.querySelector('#backtest-form');
let advancedControls;
let advancedPanel;
if (form) {
  const quickStart = document.createElement('div');
  quickStart.className = 'quick-start-card';
  quickStart.innerHTML = '<strong>처음이라면 이렇게 시작하세요</strong><span>Apple · 일괄매수 · 초기 자금 1,000만 원 · 최근 10년</span><small>조건을 바꾼 뒤 “백테스트 실행”을 누르면 결과가 갱신됩니다.</small>';
  form.prepend(quickStart);
  const strategyHint = document.createElement('p');
  strategyHint.className = 'control-hint';
  strategyHint.setAttribute('aria-live', 'polite');
  form.querySelector('#strategy')?.closest('label')?.after(strategyHint);
  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'reset-defaults';
  resetButton.textContent = '기본값으로 복원';
  form.querySelector('.lab-submit')?.before(resetButton);
  const formStatus = document.createElement('p');
  formStatus.className = 'form-status';
  formStatus.setAttribute('role', 'status');
  formStatus.setAttribute('aria-live', 'polite');
  form.querySelector('.lab-submit')?.after(formStatus);
  const strategySelect = form.querySelector('#strategy');
  const monthlyInput = form.querySelector('#monthly');
  const monthlyLabel = monthlyInput?.closest('label');
  const updateStrategyHint = () => {
    const strategy = strategySelect?.value;
    const hints = {
      lump: '처음이라면 추천: 시작일에 한 번 투자하고 장기 보유한 결과를 확인합니다.',
      dca: '매달 투자하는 경우 선택: 월 투자금이 매 거래월마다 추가됩니다.',
      sma: '규칙 기반 전략: 20일 평균선 위에서 매수하고 아래에서 매도한 결과를 확인합니다.'
    };
    if (strategyHint) strategyHint.textContent = hints[strategy] || hints.lump;
    if (monthlyInput) monthlyInput.disabled = strategy !== 'dca';
    monthlyLabel?.classList.toggle('is-disabled', strategy !== 'dca');
  };
  strategySelect?.addEventListener('change', updateStrategyHint);
  resetButton.addEventListener('click', () => {
    $('#ticker').value = 'AAPL'; $('#strategy').value = 'lump'; $('#capital').value = '10000000'; $('#monthly').value = '300000'; $('#fee').value = '0.1'; $('#years').value = '10';
    $('#benchmark').value = 'SPY'; $('#slippage').value = '0.05'; $('#dividend').checked = true;
    updateStrategyHint();
    if (formStatus) formStatus.textContent = '기본 설정으로 복원했습니다.';
    executeBacktest();
  });
  updateStrategyHint();
  advancedControls = document.createElement('div');
  advancedControls.className = 'advanced-controls';
  advancedControls.innerHTML = '<div class="advanced-heading"><span>고급 설정</span><div><small>실제 조건에 맞춰 조정하세요</small><button type="button" class="feature-help-toggle" aria-expanded="false">설명 보기 <span>↓</span></button></div></div><div class="feature-help" hidden><p><strong>비교 기준</strong>은 내 전략을 시장 대표 지수와 비교하는 기능입니다. S&amp;P 500·NASDAQ 100·KOSPI 중 종목에 맞는 기준을 고르세요.</p><p><strong>슬리피지</strong>는 주문을 낸 가격과 실제 체결 가격의 작은 차이입니다. 자주 거래하는 전략일수록 결과에 더 큰 영향을 줄 수 있습니다.</p><p><strong>배당 재투자</strong>를 켜면 받은 배당금을 다시 투자했다고 가정합니다. 실제 배당률과 세금은 데이터에 따라 달라질 수 있습니다.</p></div><label>비교 기준<select id="benchmark"><option value="SPY">S&amp;P 500 · SPY</option><option value="QQQ">NASDAQ 100 · QQQ</option><option value="KOSPI">KOSPI</option></select></label><div class="lab-input-grid"><label>슬리피지 (%)<input id="slippage" type="number" value="0.05" min="0" step="0.01" /></label><label class="check-label"><input id="dividend" type="checkbox" checked /> 배당 재투자 포함</label></div>';
  form.querySelector('.lab-submit')?.before(advancedControls);
  const helpToggle = advancedControls.querySelector('.feature-help-toggle');
  const help = advancedControls.querySelector('.feature-help');
  helpToggle?.addEventListener('click', () => {
    const isOpen = helpToggle.getAttribute('aria-expanded') === 'true';
    helpToggle.setAttribute('aria-expanded', String(!isOpen));
    helpToggle.innerHTML = isOpen ? '설명 보기 <span>↓</span>' : '설명 닫기 <span>↑</span>';
    help.hidden = isOpen;
    advancedControls.classList.toggle('is-help-open', !isOpen);
  });
}
if (metricsBox) {
  advancedPanel = document.createElement('div');
  advancedPanel.className = 'advanced-results';
  advancedPanel.innerHTML = '<div class="advanced-results-head"><span>추가 분석</span><small id="benchmark-label">S&amp;P 500 대비 데모 비교</small></div><div class="advanced-result-grid"><div><span>연환산 수익률</span><strong id="result-cagr">—</strong></div><div><span>변동성</span><strong id="result-volatility">—</strong></div><div><span>승률</span><strong id="result-winrate">—</strong></div><div><span>벤치마크 대비</span><strong id="result-vs-benchmark">—</strong></div></div><div class="result-actions"><button type="button" id="copy-result">결과 요약 복사</button><button type="button" id="download-result">CSV 다운로드</button></div>';
  drawdownPanel?.after(advancedPanel);
}

const $ = (selector) => document.querySelector(selector);
const won = (value) => `₩${Math.round(value).toLocaleString('ko-KR')}`;
const pct = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

function makePrices(ticker, years) {
  const liveEntry = liveMarketData[ticker];
  // 새 데이터 파일은 종목 메타데이터와 rows를 함께 보관하고,
  // 예전 배열 형식도 계속 읽을 수 있게 호환한다.
  const livePrices = Array.isArray(liveEntry) ? liveEntry : liveEntry?.rows;
  if (Array.isArray(livePrices) && livePrices.length > 20) {
    return livePrices.slice(-years * 252).map((item, index) => ({ ...item, day:index }));
  }
  const [,,volatility] = tickerMeta[ticker];
  const dataSeed = Number(window.QUANTLY_DATA_CONFIG?.seed) || 20261107;
  const [,,seedBase] = [ticker, 0, ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), dataSeed % 97)];
  const days = years * 252;
  let price = tickerMeta[ticker][1];
  const prices = [];
  // 데모 일봉의 기준 시각은 한국 시간 오후 2시(UTC 05:00)로 고정한다.
  let tradingDate = new Date(Date.UTC(2016, 0, 4, 5, 0, 0));
  for (let i = 0; i < days; i += 1) {
    while (tradingDate.getUTCDay() === 0 || tradingDate.getUTCDay() === 6) tradingDate.setUTCDate(tradingDate.getUTCDate() + 1);
    const seasonal = Math.sin(i / 31 + seedBase) * 0.004;
    const cycle = Math.sin(i / 170 + seedBase / 10) * 0.002;
    const drift = 0.00034 + ((seedBase % 13) - 6) * 0.000015;
    const shock = Math.sin(i * 12.9898 + seedBase) * volatility * 0.55;
    price = Math.max(price * 0.45, price * (1 + drift + seasonal + cycle + shock));
    prices.push({ day:i, price, date:tradingDate.toISOString() });
    tradingDate.setUTCDate(tradingDate.getUTCDate() + 1);
  }
  return prices;
}

function runBacktest({ ticker, strategy, capital, monthly, fee, slippage = 0, years, dividend = true, benchmark = 'SPY' }) {
  const prices = makePrices(ticker, years);
  const feeRate = (fee + slippage) / 100;
  let cash = capital;
  let shares = 0;
  let invested = capital;
  let trades = 0;
  let previousMonth = -1;
  let inMarket = false;
  let equity = [];
  const ma = (index, period = 20) => {
    const start = Math.max(0, index - period + 1);
    const slice = prices.slice(start, index + 1);
    return slice.reduce((sum, item) => sum + item.price, 0) / slice.length;
  };
  prices.forEach((item, index) => {
    const month = Math.floor(index / 21);
    if (strategy === 'lump' && index === 0) {
      shares = (cash * (1 - feeRate)) / item.price;
      cash = 0; trades += 1; inMarket = true;
    }
    if (strategy === 'dca' && month !== previousMonth) {
      if (index > 0) { cash += monthly; invested += monthly; }
      const purchase = cash * (1 - feeRate);
      shares += purchase / item.price; cash = 0; trades += 1; previousMonth = month; inMarket = true;
    }
    if (strategy === 'sma' && index > 20) {
      const above = item.price > ma(index);
      if (above && !inMarket) { const purchase = cash * (1 - feeRate); shares += purchase / item.price; cash = 0; trades += 1; inMarket = true; }
      if (!above && inMarket) { cash += shares * item.price * (1 - feeRate); shares = 0; trades += 1; inMarket = false; }
    }
    if (dividend && shares > 0 && index > 0 && index % 63 === 0) cash += shares * item.price * 0.003;
    equity.push(cash + shares * item.price);
  });
  const finalValue = equity[equity.length - 1];
  let peak = equity[0]; let maxDrawdown = 0;
  equity.forEach((value) => { peak = Math.max(peak, value); maxDrawdown = Math.min(maxDrawdown, ((value - peak) / peak) * 100); });
  const dailyReturns = equity.slice(1).map((value, index) => equity[index] ? (value / equity[index]) - 1 : 0);
  const averageDaily = dailyReturns.reduce((sum, value) => sum + value, 0) / Math.max(1, dailyReturns.length);
  const variance = dailyReturns.reduce((sum, value) => sum + ((value - averageDaily) ** 2), 0) / Math.max(1, dailyReturns.length);
  const wins = dailyReturns.filter((value) => value > 0).length;
  const cagr = invested > 0 ? (Math.pow(finalValue / invested, 1 / Math.max(1, years)) - 1) * 100 : 0;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  const benchmarkBase = { SPY: 9.2, QQQ: 12.4, KOSPI: 5.8 }[benchmark] || 9.2;
  const benchmarkReturn = benchmarkBase + ((ticker.charCodeAt(0) % 7) - 3) * 0.35 + (dividend ? 1.1 : 0);
  return { prices, equity, finalValue, invested, profit: finalValue - invested, returnRate: ((finalValue - invested) / invested) * 100, maxDrawdown, trades, cagr, volatility, winRate: (wins / Math.max(1, dailyReturns.length)) * 100, benchmarkReturn, benchmark };
}

function drawChart(values) {
  const canvas = $('#backtest-chart');
  latestChartValues = values;
  const ctx = canvas.getContext('2d');
  const width = canvas.width; const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#e1e7f0'; ctx.lineWidth = 1;
  for (let row = 1; row < 5; row += 1) { const y = (height / 5) * row; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  const min = Math.min(...values) * 0.96; const max = Math.max(...values) * 1.04; const range = max - min || 1;
  const point = (value, index) => [index * (width / (values.length - 1)), height - ((value - min) / range) * height];
  ctx.beginPath(); values.forEach((value, index) => { const [x, y] = point(value, index); index ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fillStyle = 'rgba(40,100,215,.10)'; ctx.fill();
  ctx.beginPath(); values.forEach((value, index) => { const [x, y] = point(value, index); index ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.strokeStyle = '#2864d7'; ctx.lineWidth = 3; ctx.stroke();
  let peakValue = values[0]; let peakIndex = 0; let maxDrop = 0; let drawdownStart = 0; let drawdownEnd = 0;
  values.forEach((value, index) => {
    if (value > peakValue) { peakValue = value; peakIndex = index; }
    const drop = (value - peakValue) / peakValue;
    if (drop < maxDrop) { maxDrop = drop; drawdownStart = peakIndex; drawdownEnd = index; }
  });
  latestDrawdownIndex = drawdownEnd;
  const [startX, startY] = point(values[drawdownStart], drawdownStart);
  const [endX, endY] = point(values[drawdownEnd], drawdownEnd);
  ctx.save();
  ctx.strokeStyle = '#df634f'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = '#df634f';
  ctx.beginPath(); ctx.arc(startX, startY, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(endX, endY, 6, 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 12px Manrope'; ctx.fillText('최대 하락', Math.min(width - 78, Math.max(8, endX - 25)), Math.max(18, endY - 14));
  ctx.font = '10px DM Mono'; ctx.fillText(`${(maxDrop * 100).toFixed(1)}%`, Math.min(width - 48, Math.max(8, endX - 18)), Math.max(31, endY - 1));
  ctx.restore();
}

function renderResult(result, ticker, strategy) {
  latestPriceValues = result.prices.map((item) => item.price);
  latestDateValues = result.prices.map((item) => item.date);
  $('#result-value').textContent = won(result.finalValue);
  $('#result-return').textContent = pct(result.returnRate);
  $('#result-return').classList.toggle('negative', result.returnRate < 0);
  $('#result-invested').textContent = won(result.invested);
  $('#result-profit').textContent = won(result.profit);
  $('#result-mdd').textContent = `${result.maxDrawdown.toFixed(2)}%`;
  $('#result-trades').textContent = `${result.trades}회`;
  $('#result-label').textContent = `${tickerMeta[ticker][0]} · ${ticker}`;
  if (drawdownPanel) {
    const reasons = {
      lump: '초기 매수 이후 시장 조정과 변동성 확대가 겹치면서 보유 자산 평가액이 가장 크게 줄어든 구간입니다.',
      dca: '정기 매수 기간 중 가격이 빠르게 하락하면서, 추가 매수 전까지 누적 평가액이 일시적으로 낮아진 구간입니다.',
      sma: '가격이 20일 이동평균선 아래로 이탈하는 구간에서 추세가 약해지고, 매도·재진입 과정의 변동성이 커진 구간입니다.'
    };
    drawdownPanel.querySelector('.drawdown-headline').textContent = `최대 낙폭 ${result.maxDrawdown.toFixed(2)}% · ${tickerMeta[ticker][0]} ${strategy === 'sma' ? '이동평균 전략' : strategy === 'dca' ? '월 적립식 전략' : '일괄매수 전략'}`;
    drawdownPanel.querySelector('.drawdown-reason').textContent = reasons[strategy] || reasons.lump;
  }
  const cagr = $('#result-cagr');
  const volatility = $('#result-volatility');
  const winRate = $('#result-winrate');
  const versus = $('#result-vs-benchmark');
  const benchmarkLabel = $('#benchmark-label');
  if (cagr) cagr.textContent = pct(result.cagr);
  if (volatility) volatility.textContent = `${result.volatility.toFixed(2)}%`;
  if (winRate) winRate.textContent = `${result.winRate.toFixed(1)}%`;
  if (versus) { versus.textContent = pct(result.cagr - result.benchmarkReturn); versus.classList.toggle('negative', result.cagr < result.benchmarkReturn); }
  if (benchmarkLabel) benchmarkLabel.textContent = `${result.benchmark} 대비 데모 비교 · 배당 ${$('#dividend')?.checked ? '포함' : '미포함'}`;
  drawChart(result.equity);
}

function executeBacktest(event) {
  event?.preventDefault();
  const ticker = $('#ticker').value;
  const capital = Number($('#capital').value) || 0;
  const monthly = Number($('#monthly').value) || 0;
  if (capital <= 0) {
    const status = document.querySelector('.form-status');
    if (status) status.textContent = '초기 자금을 0보다 큰 금액으로 입력해 주세요.';
    $('#capital').focus();
    return;
  }
  const result = runBacktest({ ticker, strategy: $('#strategy').value, capital, monthly, fee:Number($('#fee').value) || 0, slippage:Number($('#slippage')?.value) || 0, years:Number($('#years').value), dividend:$('#dividend')?.checked ?? true, benchmark:$('#benchmark')?.value || 'SPY' });
  renderResult(result, ticker, $('#strategy')?.value || 'lump');
  window.latestBacktest = { result, ticker, strategy: $('#strategy')?.value || 'lump' };
  const status = document.querySelector('.form-status');
  if (status) status.textContent = '백테스트 결과를 업데이트했습니다.';
}

async function loadLiveMarketData() {
  const status = document.querySelector('.demo-note');
  try {
    const response = await fetch(`data/live-market.json?v=${Date.now()}`);
    if (!response.ok) throw new Error('market data unavailable');
    const payload = await response.json();
    if (payload.source === 'live' && payload.data && Object.keys(payload.data).length) {
      liveMarketData = payload.data;
      if (status) status.textContent = `LIVE DATA · ${payload.provider} · ${new Date(payload.updatedAt).toLocaleString('ko-KR')}`;
      return true;
    }
    if (status) status.textContent = 'DEMO DATA · 최신 데이터 연결 전';
  } catch {
    if (status) status.textContent = 'DEMO DATA · 연결 실패 시 안전한 대체 데이터';
  }
  return false;
}

if ($('#backtest-form')) {
  $('#backtest-form').addEventListener('submit', executeBacktest);
  window.addEventListener('resize', () => { if ($('#result-value')) executeBacktest(); });
  executeBacktest();
  loadLiveMarketData().then((loaded) => { if (loaded) executeBacktest(); });
  window.setInterval(async () => {
    const loaded = await loadLiveMarketData();
    if (loaded) executeBacktest();
  }, 5 * 60 * 1000);
}
document.querySelector('#copy-result')?.addEventListener('click', async () => {
  const data = window.latestBacktest;
  if (!data) return;
  const { result, ticker } = data;
  const summary = `${tickerMeta[ticker][0]} (${ticker}) 백테스트\n수익률 ${pct(result.returnRate)} · 연환산 ${pct(result.cagr)}\n최종 평가금액 ${won(result.finalValue)} · 최대 낙폭 ${result.maxDrawdown.toFixed(2)}%\n거래 ${result.trades}회 · 데모 데이터`;
  try { await navigator.clipboard.writeText(summary); } catch { /* 브라우저 권한이 없으면 화면 동작만 유지 */ }
  const button = document.querySelector('#copy-result');
  if (button) { button.textContent = '복사 완료'; window.setTimeout(() => { button.textContent = '결과 요약 복사'; }, 1400); }
});
document.querySelector('#download-result')?.addEventListener('click', () => {
  const data = window.latestBacktest;
  if (!data) return;
  const rows = [['종목','전략','일자','자산가치']];
  data.result.equity.forEach((value, index) => rows.push([data.ticker, data.strategy, `${index + 1}일차`, Math.round(value)]));
  const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type:'text/csv;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `quantly-${data.ticker}-backtest.csv`; link.click(); URL.revokeObjectURL(link.href);
});
document.querySelectorAll('a[href="#start"]').forEach((link) => link.setAttribute('href', 'backtest.html'));
document.querySelectorAll('a').forEach((link) => { if (link.textContent.includes('무료 백테스팅 시작')) link.setAttribute('href', 'backtest.html'); });
