import { gsap, ScrollTrigger, prefersReducedMotion } from './lib/motion.js';

/**
 * Measurement — tolerance gauges + kóty na snímku.
 *
 * Hodnoty, pozice jehly i kóty jsou vyrenderované staticky v Measurement.astro
 * (z gui-demo-frames.js přes measure-sides.js), takže sekce je bez JS úplná
 * a správná. JS přidává jen tři věci: dojezd jehly, přepnutí strany a
 * propojení gauge ↔ kóta v obou směrech.
 */
export default function init(root) {
  const tabs = [...root.querySelectorAll('[data-side]')];
  const panels = [...root.querySelectorAll('[data-panel]')];
  const reduce = prefersReducedMotion();

  /* ── Propojení gauge ↔ kóta ───────────────────────────────────────────────
     Most drží shodné data-dim na obou stranách. Klik = zámek, hover/fokus jen
     napovídá a po odjetí se vrací k zamčenému rozměru. */
  panels.forEach((panel) => {
    const gauges = [...panel.querySelectorAll('.gauge')];
    const dims = [...panel.querySelectorAll('.dim')];
    let pinned = null;

    const show = (id) => {
      gauges.forEach((g) => {
        const on = g.dataset.dim === id;
        g.classList.toggle('is-active', on);
        g.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      dims.forEach((d) => d.classList.toggle('is-active', d.dataset.dim === id));
    };
    const pin = (id) => {
      pinned = pinned === id ? null : id;
      show(pinned);
    };

    [...gauges, ...dims].forEach((el) => {
      const id = el.dataset.dim;
      el.addEventListener('click', () => pin(id));
      el.addEventListener('mouseenter', () => show(id));
      el.addEventListener('mouseleave', () => show(pinned));
      el.addEventListener('focus', () => show(id));
      el.addEventListener('blur', () => show(pinned));
      // <g> není tlačítko, Enter/Space si musí obsloužit sám.
      if (el.tagName === 'g') {
        el.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          pin(id);
        });
      }
    });
  });

  /* ── Dojezd jehly ─────────────────────────────────────────────────────────
     Jehla startuje na nominálu (50 % dráhy) a dojede na naměřenou hodnotu
     s overshootem. Cíl se čte z inline stylu, který vypsalo Astro — bez JS tedy
     jehla stojí hned správně a animace jen dorovnává. */
  function runNeedles(panel) {
    if (reduce || panel.dataset.settled) return;
    panel.dataset.settled = '1';
    [...panel.querySelectorAll('[data-gauge-needle]')].forEach((needle, i) => {
      const target = needle.style.left;
      gsap.fromTo(
        needle,
        { left: '50%' },
        {
          left: target,
          duration: 0.9,
          ease: 'elastic.out(1, 0.5)',
          delay: i * 0.12,
          overwrite: 'auto',
        }
      );
    });
  }

  const active = panels.find((p) => p.classList.contains('is-active'));
  if (active) {
    ScrollTrigger.create({ trigger: active, start: 'top 85%', once: true, onEnter: () => runNeedles(active) });
  }

  /* ── Front / back toggle ──────────────────────────────────────────────────
     Panel nese snímek, kóty, gauges i readout, takže se přepíná jeden uzel a
     hodnoty se nemohou rozejít se snímkem. Neaktivní je display:none, tedy
     i mimo tab order. */
  function activate(side, moveFocus = false) {
    tabs.forEach((tab) => {
      const on = tab.dataset.side === side;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (on && moveFocus) tab.focus();
    });
    panels.forEach((panel) => {
      const on = panel.dataset.panel === side;
      panel.classList.toggle('is-active', on);
      if (on) runNeedles(panel);
    });
    // Přepnutí mění výšku sekce — bez refreshe by ostatní triggery střílely
    // na starých pozicích.
    ScrollTrigger.refresh();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(tab.dataset.side));
    tab.addEventListener('keydown', (e) => {
      const next =
        e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + tabs.length) % tabs.length
        : e.key === 'Home' ? 0
        : e.key === 'End' ? tabs.length - 1
        : -1;
      if (next < 0) return;
      e.preventDefault();
      activate(tabs[next].dataset.side, true);
    });
  });
}
