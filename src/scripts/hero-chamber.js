import { gsap, isFinePointer, prefersReducedMotion } from './lib/motion.js';
import { scrollToSection } from './scroll-setup.js';

// Jen znaky v subsetu Clash Display (U+0000–00FF). Box-drawing glyfy (█▓▒░)
// v subsetu nejsou → fallback je nevykreslí a dekódování „bliká" prázdnem.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?';

export default function init(root) {
  const part = root.querySelector('[data-hero-part]');
  const beam = root.querySelector('[data-hero-beam]');
  const decodeEl = root.querySelector('[data-decode-text]');
  const cta = root.querySelector('[data-hero-cta]');
  const stage = root.querySelector('[data-hero-stage]');

  let raf = 0;
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let visible = true;
  let destroyed = false;
  let cleanupDecode = null;

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; // musí se nulovat, jinak start() už nikdy nespustí novou smyčku
  }

  function start() {
    if (!raf && visible) raf = requestAnimationFrame(loop);
  }

  const observer = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) stop();
  }, { threshold: 0.1 });
  if (stage) observer.observe(stage);

  function decodeText() {
    if (!decodeEl || prefersReducedMotion()) return;
    const final = decodeEl.textContent.trim();
    const timers = [];
    let pending = 0;
    let finished = false;

    // Zámek šířky znaků je platný jen pro font-size, při kterém se měřil.
    // --fs-h1 je 6vw, takže jakýkoli resize zamčené boxy rozladí a nadpis se
    // rozsype. Proto se po dokončení (nebo hned při resizu) vrací čistý text
    // bez spanů — dál se nadpis sází nativně a je imunní vůči změně okna.
    function restore() {
      if (finished) return;
      finished = true;
      timers.forEach(clearInterval);
      timers.length = 0;
      window.removeEventListener('resize', restore);
      decodeEl.textContent = final;
    }
    cleanupDecode = restore;
    window.addEventListener('resize', restore);

    // Znaky se obalují po SLOVECH v nowrap boxu. Bez toho by inline-block znaky
    // (potřebné pro zámek šířky níž) dovolily zlom uprostřed slova → „Deploy on r / eal."
    decodeEl.innerHTML = final
      .split(' ')
      .map(
        (word) =>
          `<span style="white-space:nowrap;display:inline-block">${word
            .split('')
            .map((ch) => `<span data-ch>${ch}</span>`)
            .join('')}</span>`
      )
      .join(' ');
    // Pozor: `span span` by chytlo i slovní obaly (decodeEl je sám <span>) → data-ch.
    const spans = decodeEl.querySelectorAll('[data-ch]');
    // Zamkni šířku každého znaku na finální hodnotu — scramble glyfy (█▓▒░) mají
    // jinou šířku než písmena a bez zámku by nadpis během dekódování přeskakoval.
    const widths = [...spans].map((s) => s.getBoundingClientRect().width);
    spans.forEach((span, i) => {
      span.style.display = 'inline-block';
      span.style.width = `${widths[i]}px`;
    });
    const chars = [...final].filter((c) => c !== ' ');
    pending = spans.length;
    spans.forEach((span, i) => {
      let step = 0;
      const iv = setInterval(() => {
        if (finished) return;
        if (step < 3) {
          span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          step++;
        } else {
          span.textContent = chars[i]; // index bez mezer — spans jsou jen znaky slov
          clearInterval(iv);
          if (--pending === 0) restore();
        }
      }, 30 + i * 25);
      timers.push(iv);
    });
  }

  function loop() {
    if (!visible || !part) {
      raf = 0;
      return;
    }
    curX += (targetX - curX) * 0.08;
    curY += (targetY - curY) * 0.08;
    // perspektivu drží .hero__stage — lokální perspective() by ji zdvojila
    part.style.transform = `rotateY(${curX * 5}deg) rotateX(${-curY * 5}deg)`;

    // Po dojezdu do klidové pozice smyčku zastav — jinak rAF běží navěky.
    const settled = Math.abs(targetX - curX) < 0.002 && Math.abs(targetY - curY) < 0.002;
    if (settled && targetX === 0 && targetY === 0) {
      part.style.transform = '';
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  if (isFinePointer() && part && !prefersReducedMotion()) {
    part.addEventListener('pointermove', (e) => {
      const rect = part.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = nx * 2;
      targetY = ny * 2;
      if (beam) {
        beam.style.setProperty('--bx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        beam.style.setProperty('--by', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      }
      part.classList.add('is-active');
      start();
    });
    part.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      part.classList.remove('is-active');
      start(); // dojezd zpět do klidu i když smyčka mezitím zastavila
    });
  }

  // Měřit šířky znaků ve fallback fontu a pak nechat doskočit Clash Display
  // znamená zamknout špatné boxy — čekáme na fonty. Když už jsou hotové,
  // `ready` je resolved a dekódování startuje bez viditelné prodlevy.
  if (document.fonts) {
    document.fonts.ready.then(() => {
      if (!destroyed) decodeText();
    });
  } else {
    decodeText();
  }

  cta?.addEventListener('click', () => {
    scrollToSection(document.getElementById('data-gap'), -80);
  });

  return () => {
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    observer.disconnect();
    cleanupDecode?.();
  };
}
