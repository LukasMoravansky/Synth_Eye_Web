import { gsap, prefersReducedMotion } from './lib/motion.js';
import { frames, FRAME_W, FRAME_H, NOMINAL } from './data/gui-demo-frames.js';

const PAD = 14;

let frameIndex = -1;
let connected = false;
let captured = false;
let analyzed = false;
let totalLogs = 0;
let okCount = 0;
let nokCount = 0;
const series = { ok: [0], nok: [0] };

const GRAPH_NS = 'http://www.w3.org/2000/svg';
const GRAPH_W = 780;
const GRAPH_H = 300;
const GRAPH_M = { t: 12, r: 44, b: 46, l: 52 };
/** Šířka, pro kterou je sazba grafu authorovaná (1 user unit = 1 px). */
const GRAPH_REF_W = 640;
/** Nad tímhle násobkem už by popisky os do sebe narazily. */
const GRAPH_K_MAX = 2.2;

/* Graf má fixní viewBox 780×300 a `width: 100%`. Na desktopu je karta ~600px
   široká, takže user unit ≈ px a 12,5 se vykreslí jako 12,5px. Na telefonu
   se karta zúží na ~300px (měřítko 0.39) a TÁŽ sazba doskočí na ~5px, tedy
   pod hranici čitelnosti — a graf je jediný nosič té informace, popisek pod
   ním osy nepopisuje. Značky i typografii proto škálujeme v user units podle
   skutečné šířky, aby render zůstal kolem 11px na jakémkoli viewportu. */
function graphScale(svg) {
  const w = svg?.clientWidth || GRAPH_REF_W;
  return Math.min(GRAPH_K_MAX, Math.max(1, GRAPH_REF_W / w));
}

function ts() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

function pickFrame(prev) {
  if (frames.length < 2) return 0;
  let i;
  do { i = Math.floor(Math.random() * frames.length); } while (i === prev);
  return i;
}

function objectBox(frame) {
  const xs = frame.outline.map((p) => p[0]);
  const ys = frame.outline.map((p) => p[1]);
  const x = Math.max(0, Math.min(...xs) - PAD);
  const y = Math.max(0, Math.min(...ys) - PAD);
  return {
    x: x / FRAME_W,
    y: y / FRAME_H,
    w: (Math.min(FRAME_W, Math.max(...xs) + PAD) - x) / FRAME_W,
    h: (Math.min(FRAME_H, Math.max(...ys) + PAD) - y) / FRAME_H,
  };
}

function buildBoxes(frame) {
  const sideLabel = frame.side === 'front' ? 'Cls_Obj_Front_Side' : 'Cls_Obj_Back_Side';
  const obj = objectBox(frame);
  const boxes = [
    { label: sideLabel, confidence: frame.objectConfidence, x: obj.x, y: obj.y, w: obj.w, h: obj.h, type: 'object' },
  ];
  frame.defects.forEach((d) => {
    boxes.push({
      label: 'Cls_Defect_Fingerprint',
      confidence: d.confidence,
      x: d.x / FRAME_W,
      y: d.y / FRAME_H,
      w: d.w / FRAME_W,
      h: d.h / FRAME_H,
      type: 'defect',
    });
  });
  return boxes;
}

function captureLogs() {
  return [
    'Capture button pressed. Performing camera scan.',
    'Image successfully captured with resolution 1920x1200 in RGB format.',
  ];
}

function analyzeLogs(frame) {
  const side = frame.side;
  const lines = [
    { text: 'Analyze button pressed. Performing SynthEye AI analysis of the RGB image.', nok: false },
    { text: `Detected ${side} side of the metallic object on the image. Confidence: ${frame.objectConfidence.toFixed(2)} %.`, nok: false },
  ];
  frame.defects.forEach((d) => {
    lines.push({
      text: `Detected defect in the form of fingerprint on the front side of the metallic object. Confidence: ${d.confidence.toFixed(2)} %.`,
      nok: true,
    });
  });
  const verdictSuffix = frame.verdict === 'NOK' ? '. A defect has been detected' : '';
  lines.push({
    text: `The result of the SynthEye AI analysis is ${frame.verdict}${verdictSuffix}. Confidence: ${frame.verdictConfidence.toFixed(2)} %.`,
    nok: frame.verdict === 'NOK',
    ok: frame.verdict === 'OK',
  });
  lines.push({ text: 'The SynthEye AI analysis has been completed.', nok: false });
  return lines;
}

function measureLogs(frame) {
  const m = frame.measured;
  return [
    `Measure button pressed. Running dimension measurement on ${frame.side} side.`,
    `Measured height of the metallic object: ${m.height.toFixed(2)} mm.`,
    `Measured width of the metallic object: ${m.width.toFixed(2)} mm.`,
    `Measured hole diameter of the ${frame.side} side: ${m.holeDia.toFixed(2)} mm.`,
    `Measured distance between hole centers: ${m.holeDist.toFixed(2)} mm.`,
    `Measured rotation angle of the object: ${m.angle.toFixed(1)} deg.`,
    `Measurement result: PASS. All dimensions are within the allowed tolerance of ${NOMINAL.tol.toFixed(1)} mm.`,
  ];
}

function polygonPerimeter(points) {
  let len = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    len += Math.hypot(x2 - x1, y2 - y1);
  }
  return len;
}

export default function init(root) {
  const viewport = root.querySelector('[data-gui-viewport]');
  const img = root.querySelector('[data-gui-img]');
  const overlay = root.querySelector('[data-gui-overlay]');
  const logger = root.querySelector('[data-gui-logger]');
  const verdict = root.querySelector('[data-gui-verdict]');
  const scanline = root.querySelector('[data-gui-scanline]');
  const flash = root.querySelector('[data-gui-flash]');
  const graphSvg = root.querySelector('[data-graph]');
  const capTotal = root.querySelector('[data-cap-total]');
  const capOk = root.querySelector('[data-cap-ok]');
  const capNok = root.querySelector('[data-cap-nok]');
  const measureLayer = root.querySelector('[data-gui-measure]');
  const lastUpdate = root.querySelector('[data-last-update]');
  const btnCapture = root.querySelector('[data-btn-capture]');
  const btnAnalyze = root.querySelector('[data-btn-analyze]');
  const btnMeasure = root.querySelector('[data-btn-measure]');
  const btnClear = root.querySelector('[data-btn-clear]');
  const btnConnect = root.querySelector('[data-btn-connect]');
  const toolbar = root.querySelector('.gui-toolbar');
  const welcome = root.querySelector('[data-gui-welcome]');
  const streamReady = root.querySelector('[data-gui-streamready]');
  const statTotal = root.querySelector('[data-stat-total]');
  const statOk = root.querySelector('[data-stat-ok]');
  const statNok = root.querySelector('[data-stat-nok]');
  const tooltip = root.querySelector('[data-gui-tooltip]');

  let pending = [];
  function later(fn, ms) { pending.push(setTimeout(fn, ms)); }
  function cancelPending() { pending.forEach(clearTimeout); pending = []; }

  function log(msg, opts = {}) {
    const line = document.createElement('div');
    line.className = 'log-line';
    if (opts.nok) line.classList.add('log-line--nok');
    if (opts.ok) line.classList.add('log-line--ok');
    line.innerHTML = `<span class="log-ts">${ts()}</span> ${msg}`;
    logger.appendChild(line);
    logger.scrollTop = logger.scrollHeight;
    totalLogs++;
    if (statTotal) statTotal.textContent = String(totalLogs);
    while (logger.children.length > 200) logger.removeChild(logger.firstChild);
  }

  function logSequence(entries, baseDelay = 200) {
    entries.forEach((entry, i) => {
      const delay = i * baseDelay;
      const text = typeof entry === 'string' ? entry : entry.text;
      const opts = typeof entry === 'string' ? {} : entry;
      later(() => log(text, opts), delay);
    });
  }

  /* `hidden` je IDL vlastnost HTMLElement, NE SVGElement — `svg.hidden = false`
     jen založí JS property a atribut na elementu nechá, takže vrstvu dál skrývá
     `[hidden] { display: none !important }` z global.css. Na SVG se proto musí
     sahat na atribut. */
  function showMeasure(on) {
    if (on) measureLayer.removeAttribute('hidden');
    else measureLayer.setAttribute('hidden', '');
  }

  function setImage(slug, alt) {
    img.src = `/images/${slug}.webp`;
    img.alt = alt;
    img.hidden = false;
    if (streamReady) streamReady.hidden = true;
    overlay.innerHTML = '';
    measureLayer.innerHTML = '';
    showMeasure(false);
    verdict.hidden = true;
    verdict.className = 'gui-verdict';
  }

  function drawBoxes(frame) {
    const boxes = buildBoxes(frame);
    const entries = boxes.map((box) => {
      const el = document.createElement('div');
      el.className = `gui-box gui-box--${box.type}`;
      el.style.cssText = `left:${box.x * 100}%;top:${box.y * 100}%;width:${box.w * 100}%;height:${box.h * 100}%`;
      const chip = document.createElement('span');
      chip.className = box.x + box.w > 0.85 ? 'mono gui-box__chip--right' : 'mono';
      chip.textContent = `${box.label} ${box.confidence.toFixed(2)}%`;
      el.appendChild(chip);
      overlay.appendChild(el);
      return { el, chip, box };
    });

    if (prefersReducedMotion()) return;

    // "Lock-on" sekvence: box dosedne zvětšením -> zmenšením, chip se odkryje
    // zleva až po dosednutí, defektový box po dosednutí dvakrát blikne hranou.
    entries.forEach(({ chip }) => { chip.style.clipPath = 'inset(0 100% 0 0)'; });

    const tl = gsap.timeline();
    entries.forEach(({ el, chip, box }, i) => {
      const lockAt = i * 0.12;
      tl.fromTo(
        el,
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1, duration: 0.18, ease: 'power3.out', transformOrigin: 'center center' },
        lockAt
      );
      tl.to(chip, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.2, ease: 'power2.out' }, lockAt + 0.24);
      if (box.type === 'defect') {
        tl.to(el, { opacity: 0.3, repeat: 3, yoyo: true, duration: 0.09 }, lockAt + 0.18);
      }
    });
  }

  function drawMeasure(frame) {
    measureLayer.innerHTML = '';
    showMeasure(true);

    // Barvu, tloušťku ani fill tu NENASTAVUJ přes setAttribute s var() —
    // v SVG prezentačním atributu se custom property neresolvuje a tvar zmizí.
    // Vzhled drží scoped CSS v GuiDemo.astro (.gui-measure :global(...)).
    const ns = 'http://www.w3.org/2000/svg';

    const polygon = document.createElementNS(ns, 'polygon');
    polygon.setAttribute('points', frame.outline.map((p) => p.join(',')).join(' '));
    measureLayer.appendChild(polygon);

    // Per díru: [vnější kroužek (jen přední strana), vnitřní kroužek děry].
    // Vnitřní kroužek nese svůj poloměr rovnou r — o něj se synchronizuje
    // fade středové tečky (viz níže), ne o vnější zahloubení.
    const holeGroups = frame.holes.map((hole) => {
      const radii = hole.ring ? [hole.ring, hole.r] : [hole.r];
      const rings = radii.map((r) => {
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx', String(hole.cx));
        c.setAttribute('cy', String(hole.cy));
        c.setAttribute('r', String(r));
        measureLayer.appendChild(c);
        return c;
      });
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('class', 'gui-measure__dot');
      dot.setAttribute('cx', String(hole.cx));
      dot.setAttribute('cy', String(hole.cy));
      dot.setAttribute('r', '5');
      measureLayer.appendChild(dot);
      return { hole, rings, dot };
    });

    const [h0, h1] = frame.holes;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', String(h0.cx));
    line.setAttribute('y1', String(h0.cy));
    line.setAttribute('x2', String(h1.cx));
    line.setAttribute('y2', String(h1.cy));
    measureLayer.appendChild(line);

    const len = Math.hypot(h1.cx - h0.cx, h1.cy - h0.cy);
    const angle = Math.atan2(h1.cy - h0.cy, h1.cx - h0.cx) * (180 / Math.PI);
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', String(len));
    line.setAttribute('y2', '0');
    line.setAttribute('transform', `translate(${h0.cx}, ${h0.cy}) rotate(${angle})`);

    if (prefersReducedMotion()) return;

    // Jedna souvislá timeline, sonda CMM: obrys se obkreslí, pak se po
    // obvodu vykreslí kružnice děr (dasharray/dashoffset, ne scale-pop),
    // tečky naskočí přesně s dokreslením své díry, nakonec spojnice středů.
    const perimeter = polygonPerimeter(frame.outline);
    polygon.setAttribute('stroke-dasharray', String(perimeter));
    polygon.setAttribute('stroke-dashoffset', String(perimeter));

    line.setAttribute('stroke-dasharray', String(len));
    line.setAttribute('stroke-dashoffset', String(len));

    holeGroups.forEach(({ dot }) => { dot.style.opacity = '0'; });

    const tl = gsap.timeline();
    tl.to(polygon, { strokeDashoffset: 0, duration: 0.55, ease: 'power1.inOut' }, 0);

    let cursor = 0.55;
    holeGroups.forEach(({ rings, dot }) => {
      let innerRingStart = cursor;
      rings.forEach((ring, i) => {
        const r = Number(ring.getAttribute('r'));
        const circumference = 2 * Math.PI * r;
        ring.setAttribute('stroke-dasharray', String(circumference));
        ring.setAttribute('stroke-dashoffset', String(circumference));
        tl.to(ring, { strokeDashoffset: 0, duration: 0.3, ease: 'none' }, cursor);
        innerRingStart = cursor;
        if (i < rings.length - 1) cursor += 0.1;
      });
      tl.to(dot, { opacity: 1, duration: 0.15 }, innerRingStart + 0.3);
      cursor += 0.1;
    });

    const lineStart = cursor - 0.1 + 0.3;
    tl.to(line, { strokeDashoffset: 0, duration: 0.3, ease: 'power1.inOut' }, lineStart);
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(GRAPH_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  // Plné překreslení SVG při každé iteraci — při ≤ ~40 bodech levnější a
  // jednodušší než diffing. `animate` řídí, jestli se nově přidaný úsek
  // obou křivek dokreslí dashoffsetem, nebo se vykreslí rovnou staticky
  // (prefers-reduced-motion, prázdný stav, první mount).
  function renderGraph(animate) {
    if (!graphSvg) return;
    graphSvg.replaceChildren();

    /* k > 1 jen na úzkých kartách. Marže musí povolit spolu se sazbou (jinak
       popisky osy Y vyjedou doleva a koncové hodnoty křivek doprava) a spodní
       pásmo popisků roste do VÝŠKY viewBoxu — plocha grafu tedy zůstává stejná
       a jen karta o pár pixelů narostě, což je na mobilu jednosloupcové. */
    const k = graphScale(graphSvg);
    const ml = GRAPH_M.l + (k - 1) * 48;
    const mr = GRAPH_M.r + (k - 1) * 30;
    const mb = GRAPH_M.b + (k - 1) * 34;
    const H = GRAPH_H + (mb - GRAPH_M.b);
    graphSvg.setAttribute('viewBox', `0 0 ${GRAPH_W} ${H}`);
    const plotW = GRAPH_W - ml - mr;
    const plotH = H - GRAPH_M.t - mb;
    const pointCount = series.ok.length;
    const iterations = pointCount - 1;

    const xMax = Math.max(10, iterations);
    const allValues = [...series.ok, ...series.nok];
    const yMax = Math.max(10, Math.ceil(Math.max(...allValues) / 5) * 5);
    const yStep = yMax / 5;

    const sx = (v) => ml + (v / xMax) * plotW;
    const sy = (v) => GRAPH_M.t + plotH - (v / yMax) * plotH;

    for (let v = 0; v <= yMax; v += yStep) {
      graphSvg.appendChild(svgEl('line', {
        class: 'gui-graph__grid', x1: ml, x2: ml + plotW, y1: sy(v), y2: sy(v),
      }));
      const label = svgEl('text', {
        class: 'gui-graph__tick', x: ml - 12 * k, y: sy(v) + 4 * k, 'text-anchor': 'end', 'font-size': 12.5 * k,
      });
      label.textContent = String(v);
      graphSvg.appendChild(label);
    }

    graphSvg.appendChild(svgEl('line', { class: 'gui-graph__axis', x1: ml, x2: ml, y1: GRAPH_M.t, y2: GRAPH_M.t + plotH }));
    graphSvg.appendChild(svgEl('line', { class: 'gui-graph__axis', x1: ml, x2: ml + plotW, y1: GRAPH_M.t + plotH, y2: GRAPH_M.t + plotH }));

    const xTickStep = Math.max(1, Math.ceil(xMax / 10));
    const xTicks = [];
    for (let v = 0; v <= xMax; v += xTickStep) xTicks.push(v);
    if (xTicks[xTicks.length - 1] !== xMax) xTicks.push(xMax);
    xTicks.forEach((v) => {
      graphSvg.appendChild(svgEl('line', {
        class: 'gui-graph__axis', x1: sx(v), x2: sx(v), y1: GRAPH_M.t + plotH, y2: GRAPH_M.t + plotH + 5 * k,
      }));
      const label = svgEl('text', {
        class: 'gui-graph__tick', x: sx(v), y: GRAPH_M.t + plotH + 20 * k, 'text-anchor': 'middle', 'font-size': 12.5 * k,
      });
      label.textContent = String(v);
      graphSvg.appendChild(label);
    });

    const xTitle = svgEl('text', {
      class: 'gui-graph__label', x: ml + plotW / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 12.5 * k,
    });
    xTitle.textContent = 'Iteration';
    graphSvg.appendChild(xTitle);
    /* x zůstává 16 i při k > 1 — celý přírůstek levé marže patří popiskům osy,
       aby se svislý titulek nedostal pod ně. */
    const yTitleY = GRAPH_M.t + plotH / 2;
    const yTitle = svgEl('text', {
      class: 'gui-graph__label', x: 16, y: yTitleY, 'text-anchor': 'middle', 'font-size': 12.5 * k,
      transform: `rotate(-90 16 ${yTitleY})`,
    });
    yTitle.textContent = 'Total';
    graphSvg.appendChild(yTitle);

    if (iterations === 0) {
      const nodata = svgEl('text', {
        class: 'gui-graph__nodata', x: ml + plotW / 2, y: GRAPH_M.t + plotH / 2, 'text-anchor': 'middle', 'font-size': 13 * k,
      });
      nodata.textContent = 'NO DATA — RUN ANALYZE';
      graphSvg.appendChild(nodata);
      return;
    }

    const drawSerie = (key) => {
      const data = series[key];
      const pts = data.map((v, i) => [sx(i), sy(v)]);
      const pointsAttr = pts.map((p) => p.join(',')).join(' ');

      let totalLen = 0;
      const segLens = [0];
      for (let i = 1; i < pts.length; i++) {
        totalLen += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        segLens.push(totalLen);
      }
      const lastSegLen = pts.length > 1 ? totalLen - segLens[segLens.length - 2] : 0;

      const polyline = svgEl('polyline', {
        class: `gui-serie gui-serie--${key}`, points: pointsAttr, 'stroke-width': 2.2 * k,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      });
      if (!prefersReducedMotion() && animate && lastSegLen > 0) {
        polyline.setAttribute('stroke-dasharray', `${totalLen} ${totalLen}`);
        polyline.setAttribute('stroke-dashoffset', String(lastSegLen));
      }
      graphSvg.appendChild(polyline);
      if (!prefersReducedMotion() && animate && lastSegLen > 0) {
        gsap.to(polyline, { strokeDashoffset: 0, duration: 0.35, ease: 'power1.out' });
      }

      pts.forEach((p, i) => {
        const dot = svgEl('circle', { class: `gui-serie-dot--${key}`, cx: p[0], cy: p[1], r: 2.6 * k });
        const isNew = animate && i === pts.length - 1 && pts.length > 1;
        if (!prefersReducedMotion() && isNew) dot.style.opacity = '0';
        graphSvg.appendChild(dot);
        if (!prefersReducedMotion() && isNew) gsap.to(dot, { opacity: 1, duration: 0.2 });
      });

      const last = pts[pts.length - 1];
      const endLabel = svgEl('text', {
        class: `gui-graph__label gui-serie-end--${key}`, x: last[0] + 12 * k, y: last[1] + 5 * k, 'font-size': 14 * k,
      });
      endLabel.textContent = String(data[data.length - 1]);
      graphSvg.appendChild(endLabel);
    };

    // OK první, NOK naposled — v případě shluku bodů má NOK přednost nahoře.
    drawSerie('ok');
    drawSerie('nok');
  }

  function updateCaption() {
    const total = okCount + nokCount;
    if (capTotal) capTotal.textContent = String(total);
    if (capOk) capOk.textContent = String(okCount);
    if (capNok) capNok.textContent = String(nokCount);
  }

  function setButtons() {
    btnCapture.disabled = !connected;
    btnAnalyze.disabled = !(connected && captured);
    btnMeasure.disabled = !(connected && analyzed);
  }

  function tooltipMessage() {
    if (!connected) return 'Connect the camera first.';
    if (!captured) return 'Capture an image first.';
    if (!analyzed) return 'Run ANALYZE first.';
    return '';
  }

  function showTooltip(msg) {
    if (!tooltip || !msg) return;
    tooltip.hidden = false;
    tooltip.textContent = msg;
    setTimeout(() => { tooltip.hidden = true; }, 3000);
  }

  toolbar?.addEventListener('pointerover', (e) => {
    const btn = e.target.closest('.gui-btn');
    if (btn && btn.disabled) showTooltip(tooltipMessage());
  });
  toolbar?.addEventListener('click', (e) => {
    const btn = e.target.closest('.gui-btn');
    if (btn && btn.disabled) showTooltip(tooltipMessage());
  });

  btnCapture?.addEventListener('click', () => {
    if (!connected) return;
    cancelPending();
    if (scanline) {
      gsap.killTweensOf(scanline);
      scanline.style.top = '0%';
    }
    frameIndex = pickFrame(frameIndex);
    const frame = frames[frameIndex];
    setImage(frame.slug, `Inspection frame ${frame.id}`);
    if (!prefersReducedMotion() && flash) {
      flash.classList.add('is-active');
      setTimeout(() => flash.classList.remove('is-active'), 90);
    }
    logSequence(captureLogs());
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
      later(() => drawBoxes(frame), prefersReducedMotion() ? 0 : 900);
      later(() => logSequence(analyzeLogs(frame)), prefersReducedMotion() ? 0 : 400);
      later(() => {
        verdict.hidden = false;
        verdict.textContent = frame.verdict;
        verdict.classList.add(frame.verdict === 'OK' ? 'gui-verdict--ok' : 'gui-verdict--nok');
        if (frame.verdict === 'OK') { okCount++; if (statOk) statOk.textContent = String(okCount); }
        else { nokCount++; if (statNok) statNok.textContent = String(nokCount); }
        series.ok.push(okCount);
        series.nok.push(nokCount);
        renderGraph(true);
        updateCaption();
      }, prefersReducedMotion() ? 100 : 1800);
    };
    run();
  });

  btnMeasure?.addEventListener('click', () => {
    const frame = frames[frameIndex];
    drawMeasure(frame);
    logSequence(measureLogs(frame));
  });

  btnClear?.addEventListener('click', () => {
    cancelPending();
    if (scanline) {
      gsap.killTweensOf(scanline);
      scanline.style.top = '0%';
    }
    overlay.innerHTML = '';
    measureLayer.innerHTML = '';
    showMeasure(false);
    verdict.hidden = true;
    captured = false;
    analyzed = false;
    setButtons();
    logger.replaceChildren();
    totalLogs = 0;
    if (statTotal) statTotal.textContent = '0';
    log('Clear button pressed. Viewport and logger reset.');
  });

  function showWelcome(on) {
    if (!welcome) return;
    if (on) {
      welcome.hidden = false;
      welcome.style.opacity = '';
    } else if (prefersReducedMotion()) {
      welcome.hidden = true;
    } else {
      gsap.to(welcome, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => { welcome.hidden = true; welcome.style.opacity = ''; },
      });
    }
  }

  btnConnect?.addEventListener('click', () => {
    if (!connected) {
      connected = true;
      showWelcome(false);
      if (streamReady) streamReady.hidden = false;
      btnConnect.textContent = 'DISCONNECT';
      logSequence([
        'Connect button pressed. Initializing camera interface.',
        'Camera Basler acA1920-40uc connected. Resolution 1920x1200, RGB format.',
        'Camera stream is live. Ready to capture.',
      ]);
      if (lastUpdate) lastUpdate.textContent = ts();
      captured = false;
      analyzed = false;
      setButtons();
    } else {
      cancelPending();
      if (scanline) {
        gsap.killTweensOf(scanline);
        scanline.style.top = '0%';
      }
      overlay.innerHTML = '';
      measureLayer.innerHTML = '';
      showMeasure(false);
      verdict.hidden = true;
      connected = false;
      captured = false;
      analyzed = false;
      setButtons();
      if (streamReady) streamReady.hidden = true;
      img.hidden = true;
      showWelcome(true);
      btnConnect.textContent = 'CONNECT';
      log('Disconnect button pressed. Camera stream closed.');
    }
  });

  setButtons();
  renderGraph(false);
  updateCaption();

  /* Rotace telefonu mění šířku karty o víc než dvojnásobek, takže i k. Bez
     překreslení by graf zůstal v sazbě pro předchozí orientaci. Rozdíl v k
     je podmínka, aby každý resize (i vysunutí adresního řádku) nepřekresloval
     celé SVG zbytečně. */
  if (graphSvg) {
    let lastK = graphScale(graphSvg);
    window.addEventListener('resize', () => {
      const next = graphScale(graphSvg);
      if (Math.abs(next - lastK) < 0.05) return;
      lastK = next;
      renderGraph(false);
    }, { passive: true });
  }
}
