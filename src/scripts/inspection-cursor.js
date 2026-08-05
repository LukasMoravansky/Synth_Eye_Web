import '../styles/cursor.css';
import { gsap, isFinePointer, prefersReducedMotion } from './lib/motion.js';

/**
 * Inspection Cursor — kurzor jako inspekční sonda.
 *
 * Na hover nad `[data-inspectable]` se vykreslí detekční overlay. Dva druhy boxů,
 * odlišené barvou **i tvarem** (ne jen barvou — daltonismus):
 *
 *   objekt  `data-box="l,t,w,h"`      → rohové závorky v --accent (viewfinder motiv)
 *   defekty `data-defects="l,t,w,h;…" → uzavřený rámeček v --nok, N nálezů
 *
 * Souřadnice jsou v % rozměru obrázku. Label je **ukotvený k boxu**, ne k kurzoru
 * (viz docs/plan/ux-bbox-2026-08-05.md) — kurzor nese jen viewfinder ring.
 */

// Chip smí přetéct hranici svého boxu (malý nález ho neuveze), ale ne hranici
// snímku — proto se prahuje šířkou snímku, ne boxu.
const TAG_MIN_IMAGE_WIDTH = 220;

function init() {
  const overlay = document.createElement('div');
  overlay.className = 'inspection-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="inspection-ring"></div>
    <div class="inspection-boxes"></div>
  `;
  document.body.appendChild(overlay);

  const ring = overlay.querySelector('.inspection-ring');
  const boxes = overlay.querySelector('.inspection-boxes');

  const CORNERS = ['tl', 'tr', 'bl', 'br']
    .map((c) => `<span class="inspection-box__corner inspection-box__corner--${c}"></span>`)
    .join('');

  let active = null;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  let raf = 0;
  let tapTimeout = 0;
  let spec = [];
  let pool = [];

  /** Pool bracket boxů — recykluje se mezi hovery, nealokuje se za běhu rAF. */
  function boxPool(count) {
    while (boxes.children.length < count) {
      const el = document.createElement('div');
      el.className = 'inspection-box';
      el.innerHTML = `${CORNERS}<span class="inspection-box__tag mono"></span>`;
      boxes.appendChild(el);
    }
    const nodes = [];
    for (let i = 0; i < boxes.children.length; i++) {
      const el = boxes.children[i];
      el.hidden = i >= count;
      if (i < count) nodes.push(el);
    }
    return nodes;
  }

  function parseGroups(value) {
    return (value || '')
      .split(';')
      .map((g) => g.split(',').map(Number))
      .filter((g) => g.length === 4 && g.every((n) => Number.isFinite(n)));
  }

  /**
   * Poskládej spec pro hovernutý prvek. Objekt jde první (kreslí se pod defekty),
   * defekty se řadí od největšího — label dostane jen ten dominantní, aby se
   * u dvou identických tříd nezdvojoval text.
   */
  function buildSpec(el) {
    const objLabel = el.dataset.label;
    const objConf = el.dataset.confidence;
    const tag = objLabel && objConf ? `${objLabel} ${objConf}%` : '';

    const objGroups = parseGroups(el.dataset.box);
    const defectGroups = parseGroups(el.dataset.defects).sort((a, b) => b[2] * b[3] - a[2] * a[3]);

    const dLabel = el.dataset.defectLabel;
    const dConf = el.dataset.defectConfidence;
    const defectTag = dLabel && dConf ? `${dLabel} ${dConf}%` : '';

    const out = [];
    // Bez jakéhokoli boxu = orámuj celý snímek (chování pro sekce bez měřených souřadnic).
    const objects = objGroups.length || defectGroups.length ? objGroups : [[0, 0, 100, 100]];
    objects.forEach((g) => out.push({ g, kind: 'obj', tag }));
    defectGroups.forEach((g, i) => out.push({ g, kind: 'defect', tag: i === 0 ? defectTag : '' }));
    return out;
  }

  function bindBoxes(el) {
    spec = buildSpec(el);
    pool = boxPool(spec.length);
    for (let i = 0; i < spec.length; i++) {
      const node = pool[i];
      const s = spec[i];
      node.classList.toggle('inspection-box--defect', s.kind === 'defect');
      const tagEl = node.lastElementChild;
      tagEl.textContent = s.tag;
      tagEl.hidden = !s.tag;
    }
  }

  /**
   * Chip objektu jde NAD box, chip defektu POD svůj box. Tím se dva chipy
   * nepřekryjí ani když defekt začíná těsně pod horní hranou dílu (v Data Gap
   * je rozdíl 1,5 % výšky snímku = pár px).
   */
  function placeBoxes(el) {
    const rect = el.getBoundingClientRect();
    const tagFits = rect.width >= TAG_MIN_IMAGE_WIDTH;
    for (let i = 0; i < spec.length; i++) {
      const [l, t, w, h] = spec[i].g;
      const isDefect = spec[i].kind === 'defect';
      const node = pool[i];
      const top = rect.top + (rect.height * t) / 100;
      const height = (rect.height * h) / 100;
      node.style.left = `${rect.left + (rect.width * l) / 100}px`;
      node.style.top = `${top}px`;
      node.style.width = `${(rect.width * w) / 100}px`;
      node.style.height = `${height}px`;
      // Objekt: chip nad boxem by u horní hrany viewportu vyjel z obrazu → dovnitř.
      // Defekt: chip pod boxem u spodní hrany snímku → překlopit nad box.
      node.classList.toggle('is-tag-inside', !isDefect && top < 26);
      node.classList.toggle('is-tag-flip', isDefect && t + h > 88);
      // Box v pravé části snímku → chip zarovnaný na jeho pravý okraj (roste doleva).
      node.classList.toggle('is-tag-right', l > 55);
      node.classList.toggle('is-tag-hidden', !tagFits);
    }
  }

  function show(el) {
    if (active === el) return;
    active = el;
    bindBoxes(el);
    placeBoxes(el);
    px = tx;
    py = ty;
    const d = prefersReducedMotion() ? 0 : 0.22;
    gsap.to(boxes, { opacity: 1, duration: d });
    gsap.to(ring, { opacity: 1, scale: 1, duration: d, ease: 'power2.out' });
    if (!isFinePointer()) return;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function hide() {
    active = null;
    gsap.to(ring, { opacity: 0, scale: 0.85, duration: 0.16 });
    gsap.to(boxes, { opacity: 0, duration: 0.16 });
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function tick() {
    if (!active) {
      raf = 0;
      return;
    }
    px += (tx - px) * 0.2;
    py += (ty - py) * 0.2;
    ring.style.transform = `translate(${px}px, ${py}px) scale(1)`;
    placeBoxes(active); // fixed boxy musí sledovat scroll (Lenis) i resize
    raf = requestAnimationFrame(tick);
  }

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-inspectable]');
    if (!el) return;
    // Snap na aktuální pozici kurzoru — jinak ring přiletí ze souřadnic
    // předchozího hoveru (nebo z 0,0 při prvním).
    tx = e.clientX;
    ty = e.clientY;
    show(el);
  });

  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest('[data-inspectable]');
    if (el && !el.contains(e.relatedTarget)) hide();
  });

  document.addEventListener('pointermove', (e) => {
    if (!active || !isFinePointer()) return;
    tx = e.clientX;
    ty = e.clientY;
  });

  if (!isFinePointer()) {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-inspectable]');
      if (!el) { hide(); return; }
      show(el);
      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(hide, 2500);
    });
  }

  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-inspectable]');
    if (el) show(el);
  });
  document.addEventListener('focusout', (e) => {
    const el = e.target.closest?.('[data-inspectable]');
    if (el) hide();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export default init;
