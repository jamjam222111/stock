const compareSection = document.querySelector('.compare-section');
const allocationSection = document.querySelector('.allocation');
if (compareSection && allocationSection) allocationSection.parentNode.insertBefore(compareSection, allocationSection);
const backtestLab = document.querySelector('.backtest-lab');
const finalCta = document.querySelector('.final-cta');
if (backtestLab && document.body.classList.contains('landing-page')) backtestLab.remove();
const engineOverview = document.querySelector('.engine-overview');
if (engineOverview && backtestLab?.parentNode) backtestLab.parentNode.insertBefore(engineOverview, backtestLab);
document.querySelectorAll('a[href="#start"]').forEach((link) => { link.setAttribute('href', 'backtest.html'); });

let previousScrollY = window.scrollY;
const observer = new IntersectionObserver((entries) => {
  const scrollingUp = window.scrollY < previousScrollY;
  entries.forEach((entry) => {
    const element = entry.target;
    if (entry.isIntersecting) {
      element.style.setProperty('--reveal-offset', scrollingUp ? '-28px' : '28px');
      requestAnimationFrame(() => element.classList.add('visible'));
    } else {
      element.style.setProperty('--reveal-offset', scrollingUp ? '28px' : '-28px');
      element.classList.remove('visible');
    }
  });
  previousScrollY = window.scrollY;
}, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

document.querySelectorAll('.period').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.period').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    updateRebalancing(button.textContent.trim());
  });
});

const rebalancingData = {
  '월간': { rate:'+8.94%', total:'+286.41%', mdd:'-18.20%', volatility:'9.82%', win:'68.4%', delta:'+2.1% vs benchmark', hero:'M0 216 C26 211 45 193 65 204 S95 153 119 174 S148 119 169 143 S202 112 224 126 S248 84 275 112 S310 76 331 98 S360 65 384 88 S414 48 440 73 S470 33 494 63 S533 41 553 35 S602 16 650 8', dash:'M0 220 C30 212 71 167 113 194 S162 145 208 162 S267 106 302 143 S363 91 401 114 S463 57 493 99 S555 43 597 70 S658 39 688 57 S752 20 820 12' },
  '분기': { rate:'+8.12%', total:'+251.12%', mdd:'-20.40%', volatility:'10.18%', win:'65.1%', delta:'+1.3% vs benchmark', hero:'M0 216 C26 211 45 199 65 207 S95 164 119 183 S148 130 169 151 S202 121 224 139 S248 96 275 119 S310 91 331 108 S360 79 384 99 S414 60 440 84 S470 48 494 73 S533 53 553 45 S602 27 650 18', dash:'M0 220 C30 216 71 180 113 201 S162 161 208 177 S267 124 302 151 S363 108 401 127 S463 76 493 108 S555 67 597 88 S658 60 688 75 S752 38 820 28' },
  '연간': { rate:'+7.42%', total:'+210.72%', mdd:'-24.80%', volatility:'11.04%', win:'61.7%', delta:'+0.6% vs benchmark', hero:'M0 216 C26 214 45 205 65 211 S95 176 119 190 S148 143 169 161 S202 131 224 147 S248 111 275 130 S310 102 331 119 S360 91 384 108 S414 74 440 96 S470 60 494 84 S533 66 553 58 S602 40 650 31', dash:'M0 220 C30 218 71 191 113 208 S162 176 208 188 S267 143 302 164 S363 127 401 143 S463 97 493 121 S555 86 597 103 S658 78 688 91 S752 56 820 46' }
};

function updateRebalancing(period) {
  const data = rebalancingData[period];
  if (!data) return;
  document.querySelector('.line')?.setAttribute('d', data.hero);
  document.querySelector('.dash-line')?.setAttribute('d', data.dash);
  const total = document.querySelector('.chart-heading strong');
  const rate = document.querySelector('.positive');
  const dashRate = document.querySelector('.dash-top strong');
  const delta = document.querySelector('.dash-top .delta');
  const metrics = document.querySelectorAll('.mini-stats b');
  const dashTotal = document.querySelector('.dash-bottom>div:first-child strong');
  if (total) total.textContent = data.total;
  if (rate) rate.firstChild.textContent = `${data.rate} `;
  if (dashRate) dashRate.textContent = data.rate;
  if (delta) delta.textContent = data.delta;
  if (metrics[0]) metrics[0].textContent = data.volatility;
  if (metrics[1]) metrics[1].textContent = data.mdd;
  if (metrics[2]) metrics[2].textContent = data.win;
  if (dashTotal) dashTotal.textContent = data.total;
  document.querySelectorAll('.chart-window,.dashboard').forEach((chart) => {
    chart.classList.remove('chart-refresh');
    requestAnimationFrame(() => chart.classList.add('chart-refresh'));
  });
}

document.querySelectorAll('.side-item').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.side-item').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// 첫 방문 온보딩: 사용 경험을 확인하고, 초보자에게만 짧은 튜토리얼을 제공한다.
const onboarding = document.querySelector('#onboarding-modal');
const onboardingBackdrop = document.querySelector('#onboarding-backdrop');
if (onboarding && onboardingBackdrop) {
  const storageKey = 'quantly-onboarding-complete-v1';
  const intro = document.querySelector('#onboarding-intro');
  const tutorial = document.querySelector('#tutorial-content');
  const progressDots = [...document.querySelectorAll('.onboarding-progress i')];
  const title = document.querySelector('#tutorial-title');
  const description = document.querySelector('#tutorial-description');
  const example = document.querySelector('#tutorial-example');
  const stepLabel = document.querySelector('#tutorial-step-label');
  const nextButton = document.querySelector('#tutorial-next');
  const tutorialSteps = [
    { title: '1. 이 화면은 무엇을 하는 곳인가요?', description: '백테스팅은 “내가 과거에 이 규칙대로 투자했다면 결과가 어땠을까?”를 계산해 보는 기능입니다. 미래를 맞히는 기능이 아니라, 투자 규칙의 장단점을 과거 시장으로 연습하는 화면이라고 생각하면 됩니다.', example: '<b>먼저 기억할 것</b><span>투자 아이디어 → 과거 데이터에 적용 → 결과와 위험 확인</span>' },
    { title: '2. 종목 메뉴에서 회사를 골라요', description: '종목 선택 메뉴를 누르고 미국 또는 한국 기업을 고릅니다. 주식 지식이 있다면 평소 관심 있는 종목부터 선택하세요. 종목을 바꾸면 같은 전략도 결과가 달라집니다.', example: '<b>사용 순서</b><span>종목 선택 → 기업 선택 → 투자 전략 메뉴로 이동</span>' },
    { title: '3. 일괄매수는 이렇게 써요', description: '“A · 처음에 한 번 투자하기”는 시작일에 가진 돈을 한 번 투자하고 계속 보유했다고 가정합니다. 장기 보유 결과를 가장 단순하게 확인할 때 쓰는 첫 번째 전략입니다.', example: '<b>입력 순서</b><span>전략 A 선택 → 초기 자금 입력 → 월 투자금 0원 → 백테스트 실행</span>' },
    { title: '4. 월 적립식은 이렇게 써요', description: '“B · 매달 일정 금액 투자하기”는 매월 같은 금액을 추가로 투자했다고 가정합니다. 일괄매수와 비교하면 “한 번에 투자”와 “나눠서 투자”의 차이를 확인할 수 있습니다.', example: '<b>입력 순서</b><span>전략 B 선택 → 초기 자금 입력 → 월 투자금 입력 → 결과 비교</span>' },
    { title: '5. 이동평균 전략은 이렇게 써요', description: '“C · 20일 이동평균 돌파”는 최근 20일 평균보다 주가가 올라가면 매수하고, 아래로 내려가면 매도하는 규칙입니다. 자동매매가 실행되는 것은 아니며, 이 규칙을 과거에 적용해 보는 기능입니다.', example: '<b>확인할 것</b><span>전략 C 선택 → 수수료 입력 → 거래 횟수와 수익률 확인</span>' },
    { title: '6. 입력값은 같은 조건으로 맞춰요', description: '초기 자금은 첫날 투자할 돈, 월 투자금은 매달 추가할 돈입니다. 기간은 최근 5·10·15년 중 고르고, 수수료는 거래할 때마다 빠지는 비용입니다. 전략을 비교할 때는 같은 금액·기간·수수료를 유지하세요.', example: '<b>비교용 예시</b><span>초기 자금 1,000만 원 · 월 투자금 30만 원 · 수수료 0.1% · 최근 10년</span>' },
    { title: '7. 결과는 수익률만 보지 않아요', description: '최종 평가금액은 마지막 날 자산, 수익금은 번 돈에서 투자 원금을 뺀 값입니다. 최대 낙폭은 중간에 가장 크게 잃었던 폭이고, 거래 횟수는 사고판 횟수입니다. 높은 수익률과 큰 하락 폭을 함께 비교하세요.', example: '<b>먼저 볼 값</b><span class="tutorial-positive">수익률 +86.41%</span><span class="tutorial-negative">최대 낙폭 -18.20% · 실제로 버틸 수 있었을까?</span>' },
    { title: '8. 그래프에 마우스를 올려요', description: '자산 그래프에 마우스를 올리면 그 시점의 날짜·주가·자산가치를 볼 수 있습니다. 그래프의 빨간 점선은 가장 크게 떨어진 구간입니다. 하락이 언제 시작됐고 얼마나 지나 회복했는지 확인하세요.', example: '<b>그래프 사용법</b><span>마우스오버 → 날짜·가격 확인 · 빨간 구간 → 최대 하락 기간 확인</span>' },
    { title: '9. 고급 설정은 비교용으로 써요', description: '비교 기준은 내 결과를 S&P 500·NASDAQ 100·KOSPI와 나란히 보는 기능입니다. 슬리피지는 주문 가격과 실제 체결 가격의 작은 차이이고, 배당 재투자는 배당금을 다시 투자하는 가정입니다.', example: '<b>고급 설정</b><span>비교 기준 선택 → 슬리피지 입력 → 배당 재투자 선택</span>' },
    { title: '10. 분석 결과를 저장하고 복습해요', description: '연환산 수익률은 1년 기준으로 환산한 수익률, 변동성은 결과가 얼마나 흔들렸는지, 승률은 오른 날의 비율입니다. 결과 요약 복사·CSV 다운로드로 기록하고 초보자 가이드에서 다시 확인하세요.', example: '<b>마무리 순서</b><span>추가 지표 확인 → 결과 요약 복사 또는 CSV 다운로드 → 다른 전략과 비교</span>' }
  ];
  let currentStep = 0;

  const closeOnboarding = () => {
    onboarding.hidden = true;
    onboardingBackdrop.classList.remove('is-visible');
    document.body.classList.remove('onboarding-open');
    localStorage.setItem(storageKey, 'done');
  };
  const showOnboarding = () => {
    onboarding.hidden = false;
    onboardingBackdrop.classList.add('is-visible');
    document.body.classList.add('onboarding-open');
    document.querySelector('#tutorial-start')?.focus();
  };
  const renderTutorialStep = () => {
    const step = tutorialSteps[currentStep];
    stepLabel.textContent = `0${currentStep + 1} / 10`;
    title.textContent = step.title;
    description.textContent = step.description;
    example.innerHTML = step.example;
    progressDots.forEach((dot, index) => dot.classList.toggle('active', index <= currentStep));
    nextButton.innerHTML = currentStep === tutorialSteps.length - 1 ? '백테스팅 시작 <span>↗</span>' : '다음 <span>→</span>';
  };
  document.querySelector('#tutorial-start')?.addEventListener('click', () => {
    intro.hidden = true;
    tutorial.hidden = false;
    currentStep = 0;
    renderTutorialStep();
  });
  nextButton?.addEventListener('click', () => {
    if (currentStep < tutorialSteps.length - 1) {
      currentStep += 1;
      renderTutorialStep();
    } else {
      closeOnboarding();
      window.location.href = 'backtest.html';
    }
  });
  document.querySelector('#tutorial-skip')?.addEventListener('click', closeOnboarding);
  document.querySelector('#onboarding-close')?.addEventListener('click', closeOnboarding);
  onboardingBackdrop.addEventListener('click', closeOnboarding);
  document.querySelector('#experienced-start')?.addEventListener('click', () => localStorage.setItem(storageKey, 'done'));
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !onboarding.hidden) closeOnboarding(); });
  if (!localStorage.getItem(storageKey)) window.setTimeout(showOnboarding, 500);
}
