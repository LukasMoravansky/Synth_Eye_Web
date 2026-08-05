import { gsap, isFinePointer, prefersReducedMotion } from './lib/motion.js';

const COLS = 10;
const ROWS = 8;
const EASE = 0.14;
const SETTLED = 0.0004;
/* Fraction of a lattice cell spent crossfading. Outside the band a single real
   GAN sample is shown at full opacity — samples differ in orientation, so a
   full-cell crossfade would read as a double exposure, not as interpolation. */
const BLEND_BAND = 0.42;

let navigatorInitialized = false;

/* --- GAN architecture diagram flow (same section, scroll-scrubbed) --- */
function initDiagramAnimation() {
  const diagram = document.querySelector('[data-gan-diagram]');
  if (!diagram || diagram.dataset.flowAnimated === 'true') return;
  diagram.dataset.flowAnimated = 'true';
  diagram.querySelectorAll('[data-flow-path]').forEach((path) => {
    const len = path.getTotalLength?.() || 100;
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: diagram, start: 'top 70%', end: 'top 30%', scrub: true },
    });
  });
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const fmt = (v) => v.toFixed(3);

/** Hold a crisp sample across most of a cell, crossfade only inside the band. */
function band(t) {
  const edge = (1 - BLEND_BAND) / 2;
  const u = clamp01((t - edge) / BLEND_BAND);
  return u * u * (3 - 2 * u);
}

/** Nearest lattice node — the detent every gesture settles onto. */
const snap = (v, steps) => Math.round(v * steps) / steps;

function seedFrom(x, y) {
  const v = (Math.floor(x * 65535) ^ (Math.floor(y * 65535) << 8)) >>> 0;
  return `0x${v.toString(16).toUpperCase().padStart(6, '0').slice(-6)}`;
}

/* --- Image cache: only ever swap in a fully decoded frame, never a blank one --- */
const cache = new Map();

function cellUrl(c, r) {
  return `/images/latent/${r}-${c}.webp`;
}

function prefetch(url) {
  let img = cache.get(url);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = url;
    cache.set(url, img);
  }
  return img;
}

function isReady(url) {
  const img = cache.get(url);
  return !!img && img.complete && img.naturalWidth > 0;
}

function prefetchRing(c, r) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) prefetch(cellUrl(nc, nr));
    }
  }
}

export default function init(root) {
  initDiagramAnimation();

  const navRoot = root.matches?.('[data-latent-nav]') ? root : root.querySelector?.('[data-latent-nav]');
  if (!navRoot || navigatorInitialized) return;
  navigatorInitialized = true;

  const layers = [
    navRoot.querySelector('[data-latent-img]'),
    navRoot.querySelector('[data-latent-img-b]'),
    navRoot.querySelector('[data-latent-img-c]'),
    navRoot.querySelector('[data-latent-img-d]'),
  ].filter(Boolean);
  const display = navRoot.querySelector('[data-latent-display]');
  const plane = navRoot.querySelector('[data-latent-plane]');
  const marker = navRoot.querySelector('[data-latent-marker]');
  const mapCanvas = navRoot.querySelector('[data-latent-map]');
  const vectorEl = navRoot.querySelector('[data-latent-vector]');
  const cellsEl = navRoot.querySelector('[data-latent-cells]');
  const blendEl = navRoot.querySelector('[data-latent-blend]');
  const seedEl = navRoot.querySelector('[data-latent-seed]');
  const liveEl = navRoot.querySelector('[data-latent-live]');
  if (!display || !plane || layers.length < 4) return;

  const reduced = prefersReducedMotion();

  /* Start on a real lattice node, not the geometric centre — 0.5 falls mid-cell
     on an odd lattice and would open on a four-way blend. */
  const HOME = [4 / (COLS - 1), 3 / (ROWS - 1)];

  /* tx/ty = target coords, gx/gy = eased coords actually rendered */
  let tx = HOME[0];
  let ty = HOME[1];
  let gx = HOME[0];
  let gy = HOME[1];
  let raf = 0;
  let visible = true;
  let touched = false;
  let attract = !reduced;
  let attractHold = 0;
  let attractStep = 0;

  /* Idle demo hops node → node rather than drifting through the blend, so the
     resting frames are always real samples. */
  const TOUR = [
    [4, 3], [5, 4], [6, 5], [5, 6], [3, 6], [2, 5], [3, 4], [4, 2], [6, 2], [7, 4],
  ];

  const toCoord = (c, r) => [c / (COLS - 1), r / (ROWS - 1)];

  /** Settle on the nearest real sample so no gesture ever ends mid-crossfade. */
  function detent() {
    tx = snap(tx, COLS - 1);
    ty = snap(ty, ROWS - 1);
  }

  /* ---------- Blending ----------
     Four stacked <img> composite with source-over, not as a weighted sum.
     Cumulative alpha a_k = w_k / Σ(w_0..w_k) makes the stack resolve to exact
     bilinear interpolation — this is what removes the muddy ghosting. */
  function applyBlend(x, y) {
    const fx = x * (COLS - 1);
    const fy = y * (ROWS - 1);
    const c0 = Math.min(COLS - 2, Math.floor(fx));
    const r0 = Math.min(ROWS - 2, Math.floor(fy));
    const wx = band(fx - c0);
    const wy = band(fy - r0);

    const quad = [
      { c: c0, r: r0, w: (1 - wx) * (1 - wy) },
      { c: c0 + 1, r: r0, w: wx * (1 - wy) },
      { c: c0, r: r0 + 1, w: (1 - wx) * wy },
      { c: c0 + 1, r: r0 + 1, w: wx * wy },
    ].map((cell) => ({ ...cell, url: cellUrl(cell.c, cell.r) }));
    /* Heaviest first: the base layer is always the dominant, always-loaded frame. */
    quad.sort((a, b) => b.w - a.w);

    let acc = 0;
    quad.forEach((cell, i) => {
      const el = layers[i];
      prefetch(cell.url);
      /* Never point a layer at a frame that has not decoded. Holding the previous
         (neighbouring) frame at the new weight is invisible; a blank box is not. */
      if (isReady(cell.url) || !el.dataset.url) {
        if (el.dataset.url !== cell.url) {
          el.dataset.url = cell.url;
          el.src = cell.url;
        }
      }
      acc += cell.w;
      el.style.opacity = String(i === 0 ? 1 : cell.w / acc);
    });

    if (marker) {
      marker.style.left = `${x * 100}%`;
      marker.style.top = `${y * 100}%`;
    }
    if (vectorEl) vectorEl.textContent = `${fmt(x)} / ${fmt(y)}`;
    if (cellsEl) cellsEl.textContent = `${quad[0].c},${quad[0].r}`;
    if (blendEl) {
      blendEl.textContent =
        quad[0].w > 0.999 ? 'single sample' : `${Math.round(quad[0].w * 100)}% + ${4 - quad.filter((q) => q.w < 0.001).length - 1} more`;
    }
    if (seedEl) seedEl.textContent = seedFrom(x, y);
    drawMap(c0, r0, x, y);
    prefetchRing(c0, r0);
  }

  /* ---------- Latent field map (DPR-aware, lattice made legible) ---------- */
  const ctx = mapCanvas?.getContext('2d');
  let mw = 0;
  let mh = 0;

  function sizeMap() {
    if (!ctx) return;
    const rect = mapCanvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mw = rect.width;
    mh = rect.height;
    mapCanvas.width = Math.round(mw * dpr);
    mapCanvas.height = Math.round(mh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawMap(c0, r0, x, y) {
    if (!ctx || !mw) return;
    ctx.clearRect(0, 0, mw, mh);

    const px = x * mw;
    const py = y * mh;

    /* Field glow follows the cursor — the space reads as continuous. */
    const glow = ctx.createRadialGradient(px, py, 0, px, py, Math.max(mw, mh) * 0.55);
    glow.addColorStop(0, 'rgba(123, 110, 246, 0.28)');
    glow.addColorStop(1, 'rgba(123, 110, 246, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, mw, mh);

    const nodeX = (c) => (c / (COLS - 1)) * (mw - 2) + 1;
    const nodeY = (r) => (r / (ROWS - 1)) * (mh - 2) + 1;

    /* Lattice — discrete samples the blend interpolates between. */
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c < COLS; c++) {
      ctx.moveTo(Math.round(nodeX(c)) + 0.5, 0);
      ctx.lineTo(Math.round(nodeX(c)) + 0.5, mh);
    }
    for (let r = 0; r < ROWS; r++) {
      ctx.moveTo(0, Math.round(nodeY(r)) + 0.5);
      ctx.lineTo(mw, Math.round(nodeY(r)) + 0.5);
    }
    ctx.stroke();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const active = (c === c0 || c === c0 + 1) && (r === r0 || r === r0 + 1);
        ctx.fillStyle = active ? 'rgba(155, 143, 254, 0.95)' : 'rgba(232, 232, 236, 0.18)';
        const s = active ? 3 : 1.5;
        ctx.fillRect(nodeX(c) - s / 2, nodeY(r) - s / 2, s, s);
      }
    }

    /* Active quad outline — shows which four samples are in the mix. */
    ctx.strokeStyle = 'rgba(155, 143, 254, 0.35)';
    ctx.strokeRect(nodeX(c0), nodeY(r0), nodeX(c0 + 1) - nodeX(c0), nodeY(r0 + 1) - nodeY(r0));
  }

  /* ---------- Loop ---------- */
  function tick() {
    if (attract) {
      /* Reached the node? Pause on it, then move to the next one. */
      if (Math.abs(tx - gx) + Math.abs(ty - gy) < 0.004) {
        attractHold += 1;
        if (attractHold > 70) {
          attractHold = 0;
          attractStep += 1;
          /* One lap is enough of an invitation — then stop burning frames. */
          if (attractStep >= TOUR.length) attract = false;
          else [tx, ty] = toCoord(...TOUR[attractStep]);
        }
      }
    }
    gx += (tx - gx) * EASE;
    gy += (ty - gy) * EASE;
    applyBlend(gx, gy);

    const done = !attract && Math.abs(tx - gx) + Math.abs(ty - gy) < SETTLED;
    if (done || !visible) {
      if (done) {
        gx = tx;
        gy = ty;
        applyBlend(gx, gy);
      }
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (reduced) {
      gx = tx;
      gy = ty;
      applyBlend(gx, gy);
      return;
    }
    if (!raf && visible) raf = requestAnimationFrame(tick);
  }

  function markTouched() {
    attract = false;
    if (touched) return;
    touched = true;
    navRoot.classList.add('is-touched');
  }

  function announce() {
    if (liveEl) liveEl.textContent = `latent vector ${fmt(tx)}, ${fmt(ty)} — seed ${seedFrom(tx, ty)}`;
  }

  /* ---------- Map: absolute positioning (it is a map) ---------- */
  function setFromMap(e) {
    const rect = plane.getBoundingClientRect();
    tx = clamp01((e.clientX - rect.left) / rect.width);
    ty = clamp01((e.clientY - rect.top) / rect.height);
  }

  let mapDragging = false;
  let dragId = null;

  plane.addEventListener('pointerdown', (e) => {
    mapDragging = true;
    plane.setPointerCapture?.(e.pointerId);
    markTouched();
    setFromMap(e);
    wake();
    e.preventDefault();
  });
  plane.addEventListener('pointermove', (e) => {
    /* Fine pointers explore on hover; touch requires a drag. */
    if (dragId !== null) return;
    if (!mapDragging && !isFinePointer()) return;
    markTouched();
    setFromMap(e);
    wake();
  });
  const endMapDrag = () => {
    if (!mapDragging) return;
    mapDragging = false;
    detent();
    wake();
    announce();
  };
  plane.addEventListener('pointerup', endMapDrag);
  plane.addEventListener('pointercancel', endMapDrag);
  /* Hover exploration has no release event — settle when the pointer leaves. */
  plane.addEventListener('pointerleave', () => {
    if (mapDragging || dragId !== null) return;
    detent();
    wake();
  });

  /* ---------- Viewer: relative drag (grab the space, do not teleport) ---------- */
  let lastX = 0;
  let lastY = 0;

  display.addEventListener('pointerdown', (e) => {
    dragId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    display.setPointerCapture?.(e.pointerId);
    display.classList.add('is-active');
    markTouched();
    wake();
    e.preventDefault();
    /* preventDefault kills implicit focus; :focus-visible keeps the ring keyboard-only. */
    display.focus({ preventScroll: true });
  });

  display.addEventListener('pointermove', (e) => {
    if (dragId !== e.pointerId) return;
    const rect = display.getBoundingClientRect();
    tx = clamp01(tx + (e.clientX - lastX) / rect.width);
    ty = clamp01(ty + (e.clientY - lastY) / rect.height);
    lastX = e.clientX;
    lastY = e.clientY;
    wake();
  });

  function endDrag(e) {
    if (dragId !== e.pointerId) return;
    dragId = null;
    display.classList.remove('is-active');
    detent();
    wake();
    announce();
  }
  display.addEventListener('pointerup', endDrag);
  display.addEventListener('pointercancel', endDrag);

  /* ---------- Keyboard: one lattice step, Shift for quarter-steps ---------- */
  display.addEventListener('keydown', (e) => {
    const sx = 1 / (COLS - 1);
    const sy = 1 / (ROWS - 1);
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft': tx = clamp01(tx - sx); break;
      case 'ArrowRight': tx = clamp01(tx + sx); break;
      case 'ArrowUp': ty = clamp01(ty - sy); break;
      case 'ArrowDown': ty = clamp01(ty + sy); break;
      case 'Home': [tx, ty] = HOME; break;
      default: handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    markTouched();
    wake();
    announce();
  });

  /* ---------- Lifecycle ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) wake();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    { threshold: 0 }
  );
  io.observe(navRoot);

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      sizeMap();
      applyBlend(gx, gy);
    }, 120);
  };
  window.addEventListener('resize', onResize);

  /* The markup already shipped the centre frame — adopt it so the first blend
     has a real base layer instead of an empty slot. */
  const initialUrl = layers[0].getAttribute('src');
  if (initialUrl) {
    layers[0].dataset.url = initialUrl;
    prefetch(initialUrl);
  }
  prefetchRing(4, 3);
  sizeMap();
  applyBlend(gx, gy);

  if (reduced) {
    navRoot.classList.add('is-touched');
  } else {
    wake();
  }

  return () => {
    if (raf) cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener('resize', onResize);
    clearTimeout(resizeTimer);
  };
}
