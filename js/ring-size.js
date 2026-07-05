/* THCD Ring Sizer — screen-calibrated, fully client-side, no data leaves the browser
   unless the customer explicitly clicks "send". Sizes computed from measured mm,
   not looked up — RING_SIZE_TABLE below is only a reference/fallback for the
   approximate US column and the printed chart. */

const RING_SIZE_TABLE = [
  { us: 0,    diameter: 11.6, circumference: 36.4, ru: 11.5, eu: 36 },
  { us: 0.5,  diameter: 11.8, circumference: 37.1, ru: 12.0, eu: 37 },
  { us: 1,    diameter: 12.4, circumference: 39.0, ru: 12.5, eu: 39 },
  { us: 1.5,  diameter: 12.7, circumference: 39.9, ru: 12.5, eu: 40 },
  { us: 2,    diameter: 13.1, circumference: 41.2, ru: 13.0, eu: 41 },
  { us: 2.5,  diameter: 13.6, circumference: 42.7, ru: 13.5, eu: 43 },
  { us: 3,    diameter: 14.0, circumference: 44.0, ru: 14.0, eu: 44 },
  { us: 3.5,  diameter: 14.3, circumference: 44.9, ru: 14.5, eu: 45 },
  { us: 4,    diameter: 14.6, circumference: 45.9, ru: 14.5, eu: 46 },
  { us: 4.5,  diameter: 15.1, circumference: 47.4, ru: 15.0, eu: 47 },
  { us: 5,    diameter: 15.7, circumference: 49.3, ru: 15.5, eu: 49 },
  { us: 5.5,  diameter: 16.0, circumference: 50.3, ru: 16.0, eu: 50 },
  { us: 6,    diameter: 16.4, circumference: 51.5, ru: 16.5, eu: 52 },
  { us: 6.5,  diameter: 16.9, circumference: 53.1, ru: 17.0, eu: 53 },
  { us: 7,    diameter: 17.2, circumference: 54.0, ru: 17.0, eu: 54 },
  { us: 7.5,  diameter: 17.6, circumference: 55.3, ru: 17.5, eu: 55 },
  { us: 8,    diameter: 18.0, circumference: 56.5, ru: 18.0, eu: 57 },
  { us: 8.5,  diameter: 18.4, circumference: 57.8, ru: 18.5, eu: 58 },
  { us: 9,    diameter: 18.9, circumference: 59.4, ru: 19.0, eu: 59 },
  { us: 9.5,  diameter: 19.3, circumference: 60.6, ru: 19.5, eu: 61 },
  { us: 10,   diameter: 19.8, circumference: 62.2, ru: 20.0, eu: 62 },
  { us: 10.5, diameter: 20.1, circumference: 63.1, ru: 20.0, eu: 63 },
  { us: 11,   diameter: 20.4, circumference: 64.1, ru: 20.5, eu: 64 },
  { us: 11.5, diameter: 20.8, circumference: 65.3, ru: 21.0, eu: 65 },
  { us: 12,   diameter: 21.2, circumference: 66.6, ru: 21.0, eu: 67 },
  { us: 12.5, diameter: 21.7, circumference: 68.2, ru: 21.5, eu: 68 },
  { us: 13,   diameter: 22.2, circumference: 69.7, ru: 22.0, eu: 70 },
];

const CARD_W_MM = 85.60, CARD_H_MM = 53.98; // ISO/IEC 7810 ID-1
const BASE_PX_PER_MM = 96 / 25.4;           // CSS reference pixel guess, corrected by calibration slider
const STORAGE_KEY = 'thcd_px_per_mm';

let pxPerMm = parseFloat(localStorage.getItem(STORAGE_KEY)) || BASE_PX_PER_MM;
let calibrated = localStorage.getItem(STORAGE_KEY) !== null;
const state = { method: null, diameterMm: null };

function diameterToRu(d) { return Math.round(d * 2) / 2; }
function diameterToEu(d) { return Math.round(d * Math.PI); }
function interpolateUs(d) {
  const t = RING_SIZE_TABLE;
  if (d <= t[0].diameter) return t[0].us;
  if (d >= t[t.length - 1].diameter) return t[t.length - 1].us;
  for (let i = 0; i < t.length - 1; i++) {
    const a = t[i], b = t[i + 1];
    if (d >= a.diameter && d <= b.diameter) {
      const frac = (d - a.diameter) / (b.diameter - a.diameter);
      return Math.round((a.us + frac * (b.us - a.us)) * 2) / 2;
    }
  }
}

function goToStep(name) {
  document.querySelectorAll('.sizer__step').forEach(el => { el.hidden = el.dataset.step !== name; });
  if (name === 'calibrate') renderCalibCard();
  if (name === 'measure-ring') renderRingCircle();
}

// ── Calibration ──────────────────────────────────────────
const calibCard = document.getElementById('calibCard');
const calibSlider = document.getElementById('calibSlider');
calibSlider.value = Math.min(220, Math.max(40, Math.round((pxPerMm / BASE_PX_PER_MM) * 100)));

function renderCalibCard() {
  const factor = calibSlider.value / 100;
  const ppm = BASE_PX_PER_MM * factor;
  calibCard.style.width = (CARD_W_MM * ppm) + 'px';
  calibCard.style.height = (CARD_H_MM * ppm) + 'px';
  calibCard.dataset.ppm = ppm;
}
calibSlider.addEventListener('input', renderCalibCard);
document.getElementById('calibMinus').addEventListener('click', () => { calibSlider.value = Math.max(+calibSlider.min, +calibSlider.value - 0.5); renderCalibCard(); });
document.getElementById('calibPlus').addEventListener('click', () => { calibSlider.value = Math.min(+calibSlider.max, +calibSlider.value + 0.5); renderCalibCard(); });

document.getElementById('calibDoneBtn').addEventListener('click', () => {
  pxPerMm = parseFloat(calibCard.dataset.ppm);
  calibrated = true;
  localStorage.setItem(STORAGE_KEY, pxPerMm);
  goToStep('measure-ring');
});
document.getElementById('calibBackBtn').addEventListener('click', () => goToStep('method'));

// ── Ring-on-screen measurement ───────────────────────────
const ringCircle = document.getElementById('ringCircle');
const ringSlider = document.getElementById('ringSlider');
const ringReadout = document.getElementById('ringReadout');

function renderRingCircle() {
  const mm = ringSlider.value / 10;
  const px = mm * pxPerMm;
  ringCircle.style.width = px + 'px';
  ringCircle.style.height = px + 'px';
  ringReadout.textContent = mm.toFixed(1) + ' мм';
}
ringSlider.addEventListener('input', renderRingCircle);
document.getElementById('ringMinus').addEventListener('click', () => { ringSlider.value = Math.max(+ringSlider.min, +ringSlider.value - 1); renderRingCircle(); });
document.getElementById('ringPlus').addEventListener('click', () => { ringSlider.value = Math.min(+ringSlider.max, +ringSlider.value + 1); renderRingCircle(); });

document.getElementById('ringDoneBtn').addEventListener('click', () => {
  state.diameterMm = ringSlider.value / 10;
  showResult();
});
document.getElementById('ringBackBtn').addEventListener('click', () => goToStep('method'));
document.getElementById('recalibrateBtn').addEventListener('click', () => goToStep('calibrate'));

// ── Finger / paper strip measurement ─────────────────────
document.getElementById('fingerDoneBtn').addEventListener('click', () => {
  const circ = parseFloat(document.getElementById('circInput').value);
  if (!circ || circ < 30 || circ > 90) {
    showToast('Введите окружность пальца в мм (обычно 40–75)');
    return;
  }
  state.diameterMm = circ / Math.PI;
  showResult();
});
document.getElementById('fingerBackBtn').addEventListener('click', () => goToStep('method'));

// ── Method selection ──────────────────────────────────────
document.querySelectorAll('.sizer__method-card').forEach(card => {
  card.addEventListener('click', () => {
    state.method = card.dataset.method;
    if (state.method === 'ring') {
      goToStep(calibrated ? 'measure-ring' : 'calibrate');
    } else {
      goToStep('measure-finger');
    }
  });
});

// ── Result ────────────────────────────────────────────────
function showResult() {
  const d = state.diameterMm;
  document.getElementById('resultMm').textContent = d.toFixed(1) + ' мм';
  document.getElementById('resultRu').textContent = diameterToRu(d);
  document.getElementById('resultEu').textContent = diameterToEu(d);
  document.getElementById('resultUs').textContent = interpolateUs(d);
  document.getElementById('otherSystemsBox').hidden = true;
  goToStep('result');
}

document.getElementById('otherSystemsToggle').addEventListener('click', () => {
  const box = document.getElementById('otherSystemsBox');
  box.hidden = !box.hidden;
});

document.getElementById('sendResultBtn').addEventListener('click', () => {
  const d = state.diameterMm;
  const methodLabel = state.method === 'ring' ? 'По кольцу (калибровка экрана банковской картой)' : 'По окружности пальца (бумажная полоска)';
  const comment = document.getElementById('sendComment').value.trim();
  const body = [
    `Метод измерения: ${methodLabel}`,
    `Диаметр: ${d.toFixed(1)} мм`,
    `RU размер: ${diameterToRu(d)}`,
    `EU / ISO размер: ${diameterToEu(d)}`,
    `US (приблизительно): ${interpolateUs(d)}`,
    '',
    'Комментарий:',
    comment || '(нет)',
  ].join('\n');
  const url = `mailto:marina.marbl@gmail.com?subject=${encodeURIComponent('THCD — результат замера размера кольца')}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
  showToast('Открываю почтовый клиент…');
});

document.getElementById('restartBtn').addEventListener('click', () => {
  document.getElementById('sendComment').value = '';
  state.method = null;
  state.diameterMm = null;
  goToStep('method');
});

// ── Reference chart ──────────────────────────────────────
document.getElementById('refChartBody').innerHTML = RING_SIZE_TABLE.map(r =>
  `<tr><td>${r.ru}</td><td>${r.eu}</td><td>${r.us}</td><td>${r.diameter.toFixed(1)}</td><td>${r.circumference.toFixed(1)}</td></tr>`
).join('');
