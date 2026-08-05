import { gsap, ScrollTrigger, prefersReducedMotion } from './lib/motion.js';

/** Normalizovaný úsek progressu: 0 před `a`, 1 za `b`. */
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const q = (v) => Math.round(v * 100) / 100;

/* ── Blok 1 — poměrový bar 1 : 130 ────────────────────────────────────────
   Scrub plní zelený fill a posouvá scan head; posledních 10 % rozsahu je
   záměrně prázdných, aby se finále (odhalení defektu) přehrálo na vlastní
   časové ose. Se scrubem by při rychlém scrollu proběhlo v jednom framu. */
function initRatioBar(root) {
  const bar = root.querySelector('[data-ratio-bar]');
  if (!bar) return;

  const fill = bar.querySelector('.ratio-bar__fill');
  const scan = bar.querySelector('.ratio-bar__scan');
  const defect = bar.querySelector('.ratio-bar__defect');
  const glow = bar.querySelector('.ratio-bar__defect-glow');
  const flag = bar.querySelector('[data-ratio-flag]');
  const count = bar.querySelector('[data-ratio-count]');

  // 130 clean : 1 defect → zelený fill končí na 130/131. Poslední sliver
  // zůstane pro červený segment.
  const FILL_END = 99.24;
  const SCRUB_END = 0.9;

  const finale = gsap.timeline({ paused: true });
  finale
    .to(defect, { opacity: 1, scaleX: 1, duration: 0.35, ease: 'power2.out' })
    .to(flag, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.1)
    .fromTo(
      glow,
      { opacity: 0 },
      { opacity: 1, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: 3 },
      0
    );

  let flagged = false;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: bar,
      start: 'top 85%',
      end: 'bottom 60%',
      scrub: 0.6,
      onUpdate(self) {
        const p = Math.min(1, self.progress / SCRUB_END);
        if (scan) {
          scan.style.left = `${q(p * FILL_END)}%`;
          scan.style.opacity = p > 0.02 && p < 0.999 ? '1' : '0';
        }
        if (count) count.textContent = String(Math.round(p * 130)).padStart(3, '0');

        // Hystereze: latch nahoru na 0.995, dolů až pod 0.75 — jinak by se
        // pulz při scrubu tam a zpět restartoval každý frame.
        if (!flagged && p >= 0.995) {
          flagged = true;
          finale.play();
        } else if (flagged && p < 0.75) {
          flagged = false;
          finale.reverse();
        }
      },
    },
  });
  tl.to(fill, { width: `${FILL_END}%`, ease: 'none', duration: SCRUB_END });
  tl.to({}, { duration: 1 - SCRUB_END });
}

/* ── Blok 2 — CAD geometrie → fyzikální render ────────────────────────────
   Pět fází je odvozeno z jediného reálného snímku dílu: wireframe (SVG nad
   siluetou) → plochý matte materiál → grayscale textura → světelný sweep +
   kontrast → plný render. Žádná další síťová data: fotka je ta samá jako
   v bloku 1, tedy z cache. */
function initCadTransform(root) {
  const cad = root.querySelector('[data-cad]');
  if (!cad) return;

  const photo = root.querySelector('[data-cad-photo]');
  const matte = root.querySelector('[data-cad-matte]');
  const light = root.querySelector('.cad-layer--light');
  const sweep = root.querySelector('[data-cad-sweep]');
  const wire = root.querySelector('[data-cad-wire]');
  const grid = root.querySelector('[data-cad-grid]');
  const hud = root.querySelector('[data-cad-hud]');
  const steps = root.querySelector('[data-cad-steps]');
  const phases = root.querySelectorAll('.cad-step');

  let lastIdx = -1;

  ScrollTrigger.create({
    trigger: cad,
    start: 'top 78%',
    end: 'bottom 35%',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;

      if (grid) grid.style.opacity = q(1 - seg(p, 0.1, 0.3));
      if (wire) wire.style.opacity = q(1 - seg(p, 0.22, 0.45));
      if (matte) matte.style.opacity = q(seg(p, 0.14, 0.3) - seg(p, 0.4, 0.58));
      if (photo) {
        photo.style.opacity = q(seg(p, 0.36, 0.6));
        const gray = q(1 - seg(p, 0.62, 0.86));
        const contrast = q(0.72 + 0.28 * seg(p, 0.58, 0.9));
        const bright = q(0.86 + 0.14 * seg(p, 0.6, 0.9));
        photo.style.filter = `grayscale(${gray}) contrast(${contrast}) brightness(${bright})`;
      }
      if (light) light.style.opacity = q(seg(p, 0.56, 0.72) - seg(p, 0.82, 0.97));
      if (sweep) sweep.style.transform = `translate3d(${q(-58 + 58 * seg(p, 0.54, 0.97))}%,0,0)`;
      if (hud) hud.style.opacity = q(seg(p, 0.86, 0.98));
      if (steps) steps.style.setProperty('--cad-progress', q(p));

      const idx = Math.min(4, Math.floor(p * 5));
      if (idx !== lastIdx) {
        lastIdx = idx;
        phases.forEach((el, i) => {
          el.classList.toggle('is-active', i === idx);
          el.classList.toggle('is-past', i < idx);
        });
      }
    },
  });
}

/* ── Blok 3 — countery ──────────────────────────────────────────────────── */
function initStats(root) {
  // Nula je pointa celé sekce: dosedne z mírného zvětšení (žádný bounce —
  // sekce má tón měřicího přístroje) a rozsvítí za sebou glow.
  const zero = root.querySelector('[data-zero-lock]');
  if (zero) {
    const glow = root.querySelector('.stat__glow');
    gsap
      .timeline({ scrollTrigger: { trigger: zero, start: 'top 85%' } })
      .from(zero, { scale: 1.14, opacity: 0, duration: 0.7, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.15);
  }

  // "< 1 hr" není číslo, counter na něj nesedne — aby trojice dosedla jako
  // jeden systém, odhalí se po znacích.
  const text = root.querySelector('[data-reveal-text]');
  if (text && !text.dataset.split) {
    text.dataset.split = 'true';
    const chars = [...text.textContent].map((ch) => {
      const span = document.createElement('span');
      span.className = 'rt-char';
      span.textContent = ch;
      if (ch === ' ') span.style.width = '0.4em';
      return span;
    });
    text.textContent = '';
    chars.forEach((c) => text.appendChild(c));
    gsap.from(chars, {
      opacity: 0,
      y: 10,
      filter: 'blur(6px)',
      duration: 0.5,
      stagger: 0.07,
      ease: 'power2.out',
      scrollTrigger: { trigger: text, start: 'top 88%' },
    });
  }
}

/** Statický koncový stav pro prefers-reduced-motion. */
function settleStatic(root) {
  const fill = root.querySelector('.ratio-bar__fill');
  const defect = root.querySelector('.ratio-bar__defect');
  const flag = root.querySelector('[data-ratio-flag]');
  const count = root.querySelector('[data-ratio-count]');
  if (fill) fill.style.width = '99.24%';
  if (defect) {
    defect.style.opacity = '1';
    defect.style.transform = 'scaleX(1)';
  }
  if (flag) {
    flag.style.opacity = '1';
    flag.style.transform = 'none';
  }
  if (count) count.textContent = '130';

  const photo = root.querySelector('[data-cad-photo]');
  const wire = root.querySelector('[data-cad-wire]');
  const matte = root.querySelector('[data-cad-matte]');
  const hud = root.querySelector('[data-cad-hud]');
  const steps = root.querySelector('[data-cad-steps]');
  if (photo) photo.style.opacity = '1';
  if (wire) wire.style.opacity = '0';
  if (matte) matte.style.opacity = '0';
  if (hud) hud.style.opacity = '1';
  if (steps) steps.style.setProperty('--cad-progress', '1');
  root.querySelectorAll('.cad-step').forEach((el, i) => {
    el.classList.toggle('is-active', i === 4);
    el.classList.toggle('is-past', i < 4);
  });

  const glow = root.querySelector('.stat__glow');
  if (glow) glow.style.opacity = '1';
}

export default function init(root) {
  if (prefersReducedMotion()) {
    settleStatic(root);
    return;
  }
  initRatioBar(root);
  initCadTransform(root);
  initStats(root);
}
