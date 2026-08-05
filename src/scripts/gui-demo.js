import { gsap, prefersReducedMotion } from './lib/motion.js';
import { frames } from './data/gui-demo-frames.js';

let frameIndex = 0;
let captured = false;
let analyzed = false;
let totalLogs = 0;
let okCount = 0;
let nokCount = 0;
let graphPoints = [];

function ts() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

export default function init(root) {
  const viewport = root.querySelector('[data-gui-viewport]');
  const img = root.querySelector('[data-gui-img]');
  const overlay = root.querySelector('[data-gui-overlay]');
  const logger = root.querySelector('[data-gui-logger]');
  const verdict = root.querySelector('[data-gui-verdict]');
  const scanline = root.querySelector('[data-gui-scanline]');
  const flash = root.querySelector('[data-gui-flash]');
  const graphPath = root.querySelector('[data-graph-path]');
  const graphCount = root.querySelector('[data-graph-count]');
  const measureLayer = root.querySelector('[data-gui-measure]');
  const lastUpdate = root.querySelector('[data-last-update]');
  const btnCapture = root.querySelector('[data-btn-capture]');
  const btnAnalyze = root.querySelector('[data-btn-analyze]');
  const btnMeasure = root.querySelector('[data-btn-measure]');
  const btnClear = root.querySelector('[data-btn-clear]');
  const btnDisconnect = root.querySelector('[data-btn-disconnect]');
  const statTotal = root.querySelector('[data-stat-total]');
  const statOk = root.querySelector('[data-stat-ok]');
  const statNok = root.querySelector('[data-stat-nok]');
  const tooltip = root.querySelector('[data-gui-tooltip]');

  function log(msg) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-ts">${ts()}</span> ${msg}`;
    logger.appendChild(line);
    logger.scrollTop = logger.scrollHeight;
    totalLogs++;
    if (statTotal) statTotal.textContent = String(totalLogs);
    while (logger.children.length > 200) logger.removeChild(logger.firstChild);
  }

  function setImage(frame) {
    img.src = `/images/${frame.slug}.webp`;
    img.alt = `Inspection frame ${frame.id}`;
    overlay.innerHTML = '';
    measureLayer.innerHTML = '';
    measureLayer.hidden = true;
    viewport.querySelector('.gui-defect-overlay')?.remove();
    if (frame.defectOverlay) {
      const d = document.createElement('div');
      d.className = 'gui-defect-overlay';
      d.setAttribute('aria-hidden', 'true');
      viewport.appendChild(d);
    }
    verdict.hidden = true;
    verdict.className = 'gui-verdict';
  }

  function drawBoxes(frame) {
    frame.boxes.forEach((box, i) => {
      const el = document.createElement('div');
      el.className = `gui-box gui-box--${box.type}`;
      el.style.cssText = `left:${box.x * 100}%;top:${box.y * 100}%;width:${box.w * 100}%;height:${box.h * 100}%`;
      el.innerHTML = `<span class="mono">${box.label} ${box.confidence.toFixed(2)}%</span>`;
      overlay.appendChild(el);
      if (!prefersReducedMotion()) {
        gsap.from(el, { opacity: 0, scale: 0.9, delay: i * 0.15, duration: 0.3 });
      }
    });
  }

  function updateGraph() {
    graphPoints.push(graphPoints.length + 1);
    const w = 300;
    const h = 80;
    const max = Math.max(...graphPoints, 1);
    const pts = graphPoints.map((v, i) => `${(i / (graphPoints.length - 1 || 1)) * w},${h - (v / max) * h}`).join(' L ');
    if (graphPath) graphPath.setAttribute('d', `M ${pts}`);
    if (graphCount) graphCount.textContent = String(graphPoints.length);
  }

  function setButtons() {
    btnAnalyze.disabled = !captured;
    btnMeasure.disabled = !analyzed;
  }

  btnCapture?.addEventListener('click', () => {
    frameIndex = (frameIndex + 1) % frames.length;
    const frame = frames[frameIndex];
    setImage(frame);
    if (!prefersReducedMotion() && flash) {
      flash.classList.add('is-active');
      setTimeout(() => flash.classList.remove('is-active'), 90);
    }
    frame.logs.slice(0, 2).forEach((l) => log(l.text));
    if (lastUpdate) lastUpdate.textContent = ts();
    captured = true;
    analyzed = false;
    setButtons();
  });

  btnAnalyze?.addEventListener('click', () => {
    if (!captured) return;
    const frame = frames[frameIndex];
    analyzed = true;
    setButtons();

    const run = () => {
      if (!prefersReducedMotion() && scanline) {
        gsap.fromTo(scanline, { top: '0%' }, { top: '100%', duration: 0.9, ease: 'none' });
      }
      setTimeout(() => drawBoxes(frame), prefersReducedMotion() ? 0 : 900);
      frame.logs.slice(2).forEach((l) => setTimeout(() => log(l.text), l.delay));
      setTimeout(() => {
        verdict.hidden = false;
        verdict.textContent = frame.verdict;
        verdict.classList.add(frame.verdict === 'OK' ? 'gui-verdict--ok' : 'gui-verdict--nok');
        if (frame.verdict === 'OK') { okCount++; if (statOk) statOk.textContent = String(okCount); }
        else { nokCount++; if (statNok) statNok.textContent = String(nokCount); }
        updateGraph();
      }, prefersReducedMotion() ? 100 : 1800);
    };
    run();
  });

  btnMeasure?.addEventListener('click', () => {
    const frame = frames[frameIndex];
    measureLayer.hidden = false;
    measureLayer.innerHTML = frame.measurements.map((m) =>
      `<div class="gui-dim mono">${m.name} ${m.value.toFixed(2)} mm (${m.ref} ±${m.tol}) ✓</div>`
    ).join('');
    log('Measure button pressed. Displaying dimensional annotations.');
  });

  btnClear?.addEventListener('click', () => {
    overlay.innerHTML = '';
    measureLayer.innerHTML = '';
    measureLayer.hidden = true;
    verdict.hidden = true;
    captured = false;
    analyzed = false;
    setButtons();
    log('Clear button pressed. Viewport reset.');
  });

  btnDisconnect?.addEventListener('click', () => {
    if (tooltip) {
      tooltip.hidden = false;
      tooltip.textContent = 'Connect a Basler camera to use this feature';
      setTimeout(() => { tooltip.hidden = true; }, 3000);
    }
  });

  setButtons();
  setImage(frames[0]);
}
