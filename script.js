const formatNumber = (value) => new Intl.NumberFormat("ru-RU").format(value);

const formatCurrency = (value) => `${formatNumber(value)} ₽`;

const formatPercent = (value) => {
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `+${formatted}%`;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const urgencyPercentByDays = (days) => {
  if (days <= 0) return 0;
  if (days <= 1) return 50;
  if (days <= 2) return 40;
  if (days <= 3) return 30;
  if (days <= 5) return 20;
  if (days <= 7) return 10;
  return 0;
};

const fields = {
  slidesCount: { min: 0, max: 200, step: 1 },
  slidesPrice: { min: 0, max: 20000, step: 100 },
  rendersCount: { min: 0, max: 100, step: 1 },
  rendersPrice: { min: 0, max: 20000, step: 100 },
  deadlineDays: { min: 0, max: 30, step: 1 },
};

const state = {
  slidesCount: 0,
  slidesPrice: 0,
  rendersCount: 0,
  rendersPrice: 0,
  deadlineDays: 0,
  keyvisual: true,
};

const dom = {
  slidesCount: document.getElementById("slidesCount"),
  slidesCountRange: document.getElementById("slidesCountRange"),
  slidesPrice: document.getElementById("slidesPrice"),
  slidesPriceRange: document.getElementById("slidesPriceRange"),
  rendersCount: document.getElementById("rendersCount"),
  rendersCountRange: document.getElementById("rendersCountRange"),
  rendersPrice: document.getElementById("rendersPrice"),
  rendersPriceRange: document.getElementById("rendersPriceRange"),
  deadlineDays: document.getElementById("deadlineDays"),
  deadlineDaysRange: document.getElementById("deadlineDaysRange"),
  keyvisual: document.getElementById("keyvisual"),
  deadlinePercent: document.getElementById("deadlinePercent"),
  summarySlides: document.getElementById("summarySlides"),
  summaryRenders: document.getElementById("summaryRenders"),
  summaryUrgency: document.getElementById("summaryUrgency"),
  summaryKeyvisual: document.getElementById("summaryKeyvisual"),
  summaryTotal: document.getElementById("summaryTotal"),
  reset: document.getElementById("reset"),
  copy: document.getElementById("copy"),
};

const copyButtonMarkup = dom.copy.innerHTML;

const syncField = (key, value) => {
  const config = fields[key];
  const next = clamp(value, config.min, config.max);
  state[key] = next;
  dom[key].value = next;
  const rangeKey = `${key}Range`;
  if (dom[rangeKey]) {
    dom[rangeKey].value = next;
  }
};

const recalc = () => {
  const slidesCost = state.slidesCount * state.slidesPrice;
  const rendersCost = state.rendersCount * state.rendersPrice;
  const urgencyPercent = urgencyPercentByDays(state.deadlineDays);
  const urgencyCost = Math.round((slidesCost + rendersCost) * (urgencyPercent / 100));
  const keyvisualCost = state.keyvisual ? 30000 : 0;
  const total = slidesCost + rendersCost + urgencyCost + keyvisualCost;

  dom.deadlinePercent.textContent = formatPercent(urgencyPercent);
  dom.summarySlides.textContent = formatCurrency(slidesCost);
  dom.summaryRenders.textContent = formatCurrency(rendersCost);
  dom.summaryUrgency.textContent = formatCurrency(urgencyCost);
  dom.summaryKeyvisual.textContent = formatCurrency(keyvisualCost);
  dom.summaryTotal.textContent = formatCurrency(total);
};

const bindInput = (key) => {
  dom[key].addEventListener("input", (event) => {
    const value = Number(event.target.value || 0);
    syncField(key, value);
    recalc();
  });

  const rangeKey = `${key}Range`;
  if (dom[rangeKey]) {
    dom[rangeKey].addEventListener("input", (event) => {
      const value = Number(event.target.value || 0);
      syncField(key, value);
      recalc();
    });
  }
};

Object.keys(fields).forEach(bindInput);

dom.keyvisual.addEventListener("change", (event) => {
  state.keyvisual = event.target.checked;
  recalc();
});

dom.reset.addEventListener("click", () => {
  syncField("slidesCount", 0);
  syncField("slidesPrice", 0);
  syncField("rendersCount", 0);
  syncField("rendersPrice", 0);
  syncField("deadlineDays", 0);
  state.keyvisual = true;
  dom.keyvisual.checked = true;
  recalc();
});

dom.copy.addEventListener("click", async () => {
  const payload = [
    `Вёрстка слайдов: ${dom.summarySlides.textContent}`,
    `Отрисовка: ${dom.summaryRenders.textContent}`,
    `Надбавка за срочность: ${dom.summaryUrgency.textContent}`,
    `Кейвижуал: ${dom.summaryKeyvisual.textContent}`,
    `Всего: ${dom.summaryTotal.textContent}`,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(payload);
    dom.copy.textContent = "Скопировано";
    setTimeout(() => {
      dom.copy.innerHTML = copyButtonMarkup;
    }, 1200);
  } catch (error) {
    console.error("Clipboard error", error);
  }
});

recalc();
