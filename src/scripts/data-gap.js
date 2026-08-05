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
   Pět fází, čtyři z nich reálné Blender passy registrované na pixel
   (build-assets.mjs), první je kótovaný CAD wireframe:

     01 wireframe (SVG)   02 cad-solid   03 cad-pbr   04 cad-light   05 cad-render

   Fáze 04 a 05 sdílí jednu proměnnou `wipe`: světelný pass propouští úzký
   pruh a render se odkrývá plným wipe se STEJNOU hranou (47–53 % masky).
   Světelný pruh je tedy přesně ta hrana, za kterou už je díl hotový —
   světlo render „namaluje". */
function initCadTransform(root) {
  const cad = root.querySelector('[data-cad]');
  if (!cad) return;

  const solid = root.querySelector('[data-cad-solid]');
  const pbr = root.querySelector('[data-cad-pbr]');
  const light = root.querySelector('[data-cad-light]');
  const render = root.querySelector('[data-cad-render]');
  const wire = root.querySelector('[data-cad-wire]');
  const grid = root.querySelector('[data-cad-grid]');
  const hud = root.querySelector('[data-cad-hud]');
  const steps = root.querySelector('[data-cad-steps]');
  const phases = root.querySelectorAll('.cad-step');

  // mask-position 100 % = hrana wipu vlevo mimo díl (nic neodkryto),
  // 0 % = vpravo mimo (odkryto všechno). Mimo [0, 100] by maska přestala
  // element pokrývat a odmaskovaná část by zmizela — viz komentář v CSS.
  const WIPE_FROM = 100;
  const WIPE_TO = 0;

  // Aktivní krok se odvozuje ze STEJNÝCH hranic jako vrstvy pod ním.
  // Rovnoměrné pětiny (Math.floor(p * 5)) rozsvěcely „04 Physical lighting"
  // až v půlce světelného přejezdu a „03 PBR textures" ještě ve fázi solidu —
  // popiska tvrdila něco jiného, než co bylo vidět.
  const PHASE_AT = [0.16, 0.34, 0.52, 0.82];
  const phaseIndex = (p) => PHASE_AT.filter((t) => p >= t).length;

  // CSS default je hotový render (kvůli no-JS). Startovní stav — samotný
  // wireframe — se nasadí až tady, a to ještě mimo viewport: whenVisible
  // inicializuje s rootMargin 200 px, takže přepnutí není vidět.
  const armCad = () => {
    if (grid) grid.style.opacity = '1';
    if (wire) wire.style.opacity = '1';
    if (solid) solid.style.opacity = '0';
    if (pbr) pbr.style.opacity = '0';
    if (light) light.style.opacity = '0';
    if (render) {
      render.style.maskPosition = `${WIPE_FROM}% 0`;
      render.style.webkitMaskPosition = `${WIPE_FROM}% 0`;
    }
    if (hud) hud.style.opacity = '0';
    if (steps) steps.style.setProperty('--cad-progress', '0');
    phases.forEach((el, i) => {
      el.classList.toggle('is-active', i === 0);
      el.classList.remove('is-past');
    });
  };
  armCad();

  let lastIdx = -1;

  /* Pin režim: track (.gap-block--2) je 220vh vysoký a stage se v něm sticky
     drží celou obrazovku, takže start 'top top' / end 'bottom bottom' kryje
     sticky okno 1:1 (stejný model jako PipelineTransition). Zapíná se jen tam,
     kde se text i stage vejdou do jedné obrazovky — na mobilu a v nízkém okně
     zůstává tok, jen s delším rozsahem než původních 78 % → 35 %.
     Query musí zůstat v souladu s @media v DataGap.astro. */
  const track = cad.closest('[data-cad-track]');
  const pinQuery = window.matchMedia('(min-width: 769px) and (min-height: 640px)');

  /** Vykreslí stav sekvence pro normalizovaný progress p ∈ ⟨0, 1⟩. */
  const update = (p) => {
    if (grid) grid.style.opacity = q(1 - seg(p, 0.08, 0.26));
    if (wire) wire.style.opacity = q(1 - seg(p, 0.18, 0.38));
    if (solid) solid.style.opacity = q(seg(p, 0.14, 0.3) - seg(p, 0.36, 0.5));
    if (pbr) pbr.style.opacity = q(seg(p, 0.34, 0.5));

    const t = seg(p, 0.52, 0.92);
    const wipe = `${q(WIPE_FROM + (WIPE_TO - WIPE_FROM) * t)}% 0`;
    if (light) {
      light.style.opacity = q(seg(p, 0.5, 0.57) - seg(p, 0.9, 0.97));
      light.style.maskPosition = wipe;
      light.style.webkitMaskPosition = wipe;
    }
    if (render) {
      render.style.maskPosition = wipe;
      render.style.webkitMaskPosition = wipe;
    }

    if (hud) hud.style.opacity = q(seg(p, 0.9, 0.99));
    if (steps) steps.style.setProperty('--cad-progress', q(p));

    const idx = phaseIndex(p);
    if (idx !== lastIdx) {
      lastIdx = idx;
      phases.forEach((el, i) => {
        el.classList.toggle('is-active', i === idx);
        el.classList.toggle('is-past', i < idx);
      });
    }
  };

  let trigger = null;

  const build = () => {
    trigger?.kill();
    const pinned = Boolean(track) && pinQuery.matches;
    if (track) {
      if (pinned) track.dataset.cadMode = 'pinned';
      else delete track.dataset.cadMode;
    }

    /* Posledních ~18 % rozsahu je hold: hotový render zůstane stát v klidu
       uprostřed obrazovky, než pin pustí. Bez hold zóny sekvence dobíhá
       přesně ve chvíli, kdy vizuál odjíždí z viewportu, a uživateli zůstane
       v hlavě rozpracovaná fáze místo výsledku. */
    const SEQ_END = pinned ? 0.82 : 0.88;

    trigger = ScrollTrigger.create({
      trigger: pinned ? track : cad,
      start: pinned ? 'top top' : 'top 88%',
      end: pinned ? 'bottom bottom' : 'bottom 55%',
      scrub: true,
      onUpdate(self) {
        update(Math.min(1, self.progress / SEQ_END));
      },
    });

    // Track právě změnil výšku o ~150vh — pozice ostatních triggerů níž na
    // stránce jsou tím pádem zastaralé.
    ScrollTrigger.refresh();
  };

  build();
  pinQuery.addEventListener('change', build);
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

  // Koncový stav bloku 2 = hotový render, ostatní passy zhasnuté, wipe dojezděný.
  const wire = root.querySelector('[data-cad-wire]');
  const solid = root.querySelector('[data-cad-solid]');
  const pbr = root.querySelector('[data-cad-pbr]');
  const light = root.querySelector('[data-cad-light]');
  const render = root.querySelector('[data-cad-render]');
  const hud = root.querySelector('[data-cad-hud]');
  const steps = root.querySelector('[data-cad-steps]');
  if (wire) wire.style.opacity = '0';
  if (solid) solid.style.opacity = '0';
  if (pbr) pbr.style.opacity = '1';
  if (light) light.style.opacity = '0';
  if (render) {
    render.style.maskPosition = '0% 0';
    render.style.webkitMaskPosition = '0% 0';
  }
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
